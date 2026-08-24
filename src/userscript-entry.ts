/**
 * Bundle entry point: the game on one side, a reading of the fight on the other.
 *
 * Everything here is wiring. The decoding, the arithmetic and the promises to
 * the game each live in a module that can be read on its own; this is the only
 * file that knows they go together, and the only one that touches `window`.
 *
 * `setMargoMeter` takes the page rather than reaching for the global itself, so
 * the wiring is testable and the one unavoidable global read sits at the bottom
 * of this file where an auditor will find it. The panel is mounted the same way,
 * from the document this file is handed — which is what lets the once-per-fight
 * rule §9.6 asks for be checked without a browser.
 */

import {
  composeEmptySession,
  composeFightReading,
  composeNextSession,
  type BattleSession,
  type FightReading,
} from "@/src/game/battle-session.ts";
import { composeJsonText } from "@/libs/json.ts";
import { setEngineAttachment, type GameWindow } from "@/src/game/engine-attachment.ts";
import { getDictionaryReader, type DictionaryWindow } from "@/src/game/game-dictionary.ts";
import { USERSCRIPT_VERSION } from "@/src/userscript-version.ts";
import type { EngineBattle } from "@/src/game/engine-battle-wrap.ts";
import {
  composeCaptureFileName,
  composeCaptureText,
  composeEmptyCapture,
  composeNextCapture,
  composeSnapshotFromBattle,
  type CaptureEnvironment,
  type CapturedCombatant,
  type FightCapture,
} from "@/src/game/fight-capture.ts";
import { getFiniteNumberFromValue } from "@/libs/number.ts";
import {
  composeEmptyCombatantStatistics,
  getCombatantIdsInFight,
} from "@/src/core/fight-statistics.ts";
import { getGameBuildFromScriptName } from "@/src/core/game-build.ts";
import {
  renderPanelInto,
  renderWaitingInto,
  setPanelRoot,
  type PanelDocument,
  type PanelHost,
  type PanelScroll,
} from "@/src/ui/panel-element.ts";
import {
  composeDefaultState,
  composeStateAfterBack,
  composeStateAfterFightStart,
  composeStateAfterMetric,
  composeStateAfterTeam,
  composeStateFromRow,
  type PanelDetailLine,
  type PanelState,
} from "@/src/ui/panel-screen.ts";
import {
  composeStoredTextFromPosition,
  getPositionFromStoredText,
  type PanelPosition,
  type PanelViewport,
} from "@/src/ui/panel-element.ts";
import { composePanelView, PANEL_WAITING } from "@/src/ui/panel-view.ts";
import {
  CAPTURE_PHASE,
  DOM_PHASE,
  DRAG_PHASE,
  GESTURE_PHASE,
  PAYLOAD_PHASE,
  READING_PHASE,
  SESSION_PHASE,
  VIEW_PHASE,
} from "@/src/cost-phases.ts";
import { getTimedResult, setCostDrawn } from "@/src/userscript-instrument.ts";

export type MargoMeterOptions = {
  /** Told after every payload, with the fight as it now stands. */
  onReading?: ((reading: FightReading) => void) | undefined;
  onAttached?: (() => void) | undefined;
  onSearchAbandoned?: (() => void) | undefined;
  /** Told once when another MargoMeter was already reading, so this one does not. */
  onAnotherReaderFound?: (() => void) | undefined;
  /** Told once when the game is on the page and refuses to be read. */
  onAttachmentRefused?: ((error: unknown) => void) | undefined;
  onReadingFailure?: ((error: unknown) => void) | undefined;
  /**
   * Told when keeping the recording throws. Its own channel, not `onReadingFailure`:
   * the recording is a developer's tool and the meter is the product, so a reader
   * of the console has to be able to tell which of the two stopped working.
   */
  onCaptureFailure?: ((error: unknown) => void) | undefined;
  schedule?: ((step: () => void, everyMs: number) => number) | undefined;
  cancel?: ((handle: number) => void) | undefined;
};

/**
 * A failure channel that speaks the first time and counts after that.
 *
 * §9.6 asks for exactly one branded console entry per caught failure — "a repeat
 * is counted, not reprinted" — and both of this file's failure channels fire from
 * inside the wrap, which runs on **every payload**. A fight redraws every few
 * seconds, so a channel that printed each time would put our own entry in front
 * of whatever the person was reading, which is the disturbance §9.6 spends its
 * length refusing.
 *
 * Once for the page rather than once per fight, like the drag and the capture
 * button in `composePanelMount`: a throw out of the reading is a bug of ours, not
 * a state of a fight, and the fight boundary is not visible from here — the
 * session lives inside `setMargoMeter`. The repeats are counted, and the count
 * reaches the copied report through `composeMeterOptions`, which hands the sinks
 * back to whoever wired them. Nothing prints it on its own: there is no moment in
 * a page's life that is the right one to print a tally at, and for a while there
 * was no moment at which anything read it either
 * (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F23).
 */
export type FailureSink = { report: (error: unknown) => void; getSilenced: () => number };

export function composeFailureSink(
  brand: string,
  warn: (brand: string, detail: unknown) => void,
): FailureSink {
  let hasReported = false;
  let silenced = 0;
  return {
    report: (error) => {
      if (hasReported) {
        silenced += 1;
        return;
      }
      hasReported = true;
      warn(brand, error);
    },
    getSilenced: () => silenced,
  };
}

/** The two channels a page's failures are counted on, kept so a report can say. */
export type FailureSinks = { reading: FailureSink; capture: FailureSink };

export type MargoMeter = {
  /** The fight as it now stands, or null before anything has been read. */
  getReading: () => FightReading | null;
  /** The same fight as material: what a file written now would carry. */
  getCapture: () => FightCapture;
  stop: () => void;
};

/**
 * The name the running add-on answers to on the page.
 *
 * "Is it attached" is the first question anyone reporting a wrong number will be
 * asked, and this is where it is answered from a console. One property,
 * namespaced, read-only in spirit: the page belongs to the game.
 */
const PAGE_HANDLE = "margometer";

/**
 * What every element of ours wears in the game's own document (§9.6).
 *
 * Two of them, because the add-on puts exactly two nodes into the page: the
 * panel's host, which stays for the session, and the anchor a download rides on,
 * which lasts a click. Both used to go in anonymous — a bare `<div>` and a bare
 * `<a>` at the end of `document.body`, indistinguishable in the inspector from
 * the game's own furniture and from every other add-on's.
 *
 * ⚠️ **The prefix is not what stops the game's stylesheet reaching the panel.**
 * The shadow root is, which is why the ~40 class names behind it are unprefixed
 * and stay that way. These two are in front of it, so they are the ones that need
 * a name nothing else on the page will have chosen. Measured rather than assumed:
 * `margometer`, in any case, occurs nowhere in either cached client bundle —
 * production build `1786514810315`, development build `1781609507010`.
 *
 * ⚠️ **The version rides an attribute whose name cannot carry the prefix's
 * casing.** HTML matches and serialises attribute names case-insensitively, so
 * `data-MargoMeter-version` arrives in the DOM as `data-margometer-version`
 * whatever is typed here. Case survives in an `id` and a `class` *value* and in a
 * custom property, and nowhere else — so the mixed-case names below are values
 * and the lower-case one is a name. Do not "correct" either of them.
 */
const PANEL_HOST_ID = "MargoMeter-Panel";
const PANEL_HOST_CLASS = "MargoMeter-Panel";
const PANEL_HOST_VERSION_ATTRIBUTE = "data-margometer-version";
const DOWNLOAD_ANCHOR_CLASS = "MargoMeter-Download";

/**
 * The host, plus the two things naming it needs.
 *
 * Widened here rather than on `PanelHost`, which is `ui`'s slice of the DOM: the
 * panel draws inside a shadow root and has no business knowing that the element
 * holding it sits in somebody else's document under an id.
 */
type MarkedPanelHost = PanelHost & {
  id: string;
  setAttribute(name: string, value: string): void;
};

/**
 * Whether a MargoMeter is already running on this page.
 *
 * The outermost of the three guards against two copies counting one fight, and
 * the only one that survives the case the other two cannot see: a third add-on
 * wrapping the battle method *between* our two copies. Both of the guards in
 * `src/game/engine-battle-wrap.ts` look at the method, and by then the method on
 * top is a stranger's — so neither can tell "nobody has wrapped" from "we have,
 * and somebody wrapped over us". This one never looks at the method at all.
 *
 * It costs nothing to add because the handle has been set by every build since
 * 0.6.0; what was missing was anybody reading it.
 */
export function hasOtherMargoMeter(page: HostPage): boolean {
  return page[PAGE_HANDLE] !== undefined;
}

/**
 * Attaches to the game and starts accumulating.
 *
 * The session is rebuilt rather than mutated on each payload, so the value handed
 * out is never one a later payload can change underneath its reader — which is
 * what lets a panel hold onto a reading while the next batch arrives.
 */
export function setMargoMeter(page: GameWindow, options: MargoMeterOptions = {}): MargoMeter {
  let session: BattleSession = composeEmptySession();
  let hasReading = false;
  let capture: FightCapture = composeEmptyCapture();
  /**
   * The combatants as the fight held them before the call the game is making now.
   * It has to be taken ahead of the original, which is the whole reason the wrap
   * offers a hook there — afterwards there is only the state the payload produced.
   */
  let combatantsBefore: readonly CapturedCombatant[] = [];
  /**
   * Kept from the hook above so the *after* snapshot can be read from the same
   * object once the original has run. Held here rather than widened into
   * `onMessages`: the reading is `core`'s business and has no use for the engine,
   * and a signature carrying it would say otherwise to everyone who reads it.
   */
  let battleBeingCalled: EngineBattle | null = null;

  const stop = setEngineAttachment(
    page,
    /**
     * ⚠️ **The phases wrap this whole callback, not the panel alone.** What a
     * player waits for is the engine call returning, and everything below runs
     * inside it — so `payload` is the honest figure and `session`, `capture`,
     * `reading` are its parts. In the file people install every one of those is
     * a pass-through that runs the work and hands it back
     * (`src/userscript-instrument.ts`).
     */
    (reading) =>
      getTimedResult(PAYLOAD_PHASE, () => {
        const { payload, messages } = reading;
        const before = session;
        session = getTimedResult(SESSION_PHASE, () => composeNextSession(before, reading));
        hasReading = true;
        /**
         * Guarded on its own, and ahead of nothing: keeping material is a
         * developer's convenience, and it must never be the reason a fight stops
         * being counted or the panel stops being drawn. The same argument the wrap
         * makes with two `try`s instead of one, one layer up.
         */
        try {
          capture = getTimedResult(CAPTURE_PHASE, () =>
            composeNextCapture(
              capture,
              payload,
              messages,
              combatantsBefore,
              battleBeingCalled === null ? [] : composeSnapshotFromBattle(battleBeingCalled),
            ),
          );
        } catch (error) {
          options.onCaptureFailure?.(error);
        }
        combatantsBefore = [];
        // Nothing the panel draws can have changed, so nothing is drawn: the same
        // session object back means the payload carried no fight (`composeNextSession`).
        if (session !== before) {
          const next = session;
          options.onReading?.(getTimedResult(READING_PHASE, () => composeFightReading(next)));
        }
      }),
    {
      onBeforeOriginal: (battle) => {
        battleBeingCalled = battle;
        combatantsBefore = composeSnapshotFromBattle(battle);
      },
      onReadingFailure: options.onReadingFailure,
      onAttached: options.onAttached,
      onSearchAbandoned: options.onSearchAbandoned,
      onAnotherReaderFound: options.onAnotherReaderFound,
      onAttachmentRefused: options.onAttachmentRefused,
      schedule: options.schedule,
      cancel: options.cancel,
    },
  );

  return {
    getReading: () => (hasReading ? composeFightReading(session) : null),
    getCapture: () => capture,
    stop,
  };
}

/**
 * Whether this is somewhere to attach at all.
 *
 * ⚠️ **The first version of this asked whether `Engine` was there yet, and that
 * was wrong in the one place it mattered.** A userscript at `document-idle` can
 * run before the game finishes building its engine; asking for `Engine` at that
 * instant meant never starting, and never starting meant the search that exists
 * precisely for a late engine was never scheduled. The add-on did nothing, in
 * silence, and every test still passed — the bug needed a browser to appear.
 *
 * So the question is "am I in a page", which is answerable immediately and stays
 * answerable. Whether the game is there yet is the search's business.
 */
export function shouldStartHere(scope: { document?: unknown }): boolean {
  return scope.document !== undefined;
}

/**
 * The page as this file needs it: the game, a document to draw into, and a name
 * to answer to.
 */
type HostPage = GameWindow & DictionaryWindow & {
  document?: {
    createElement(tag: string): unknown;
    body?: { append(node: unknown): void } | undefined;
    /**
     * For the client's build id, which rides in a script's filename.
     *
     * `ArrayLike` and not `Iterable`, which is the weaker of the two and the only
     * one true of what a browser hands back here. A real `NodeListOf` iterates at
     * run time, but TypeScript only says so when `lib` carries `DOM.Iterable`,
     * and this repository's does not — so `Iterable` typechecked locally against
     * stray `@types/jsdom` and failed in CI, where the lockfile decides.
     */
    querySelectorAll?: ((selector: string) => ArrayLike<{ src?: unknown }>) | undefined;
  };
  /** The world a recording came from. Absent means the page did not say. */
  location?: { hostname?: string | undefined } | undefined;
  /** The two things a reader's own browser is asked for, and neither is required. */
  navigator?:
    | {
        /**
         * Where a report goes when the reader asks for one.
         *
         * Optional throughout, because a browser may refuse it and a test has
         * none — and refusing costs the copy and nothing else, the same shape as
         * the stored position. Not a network call: §5 forbids sending anything
         * anywhere, and handing a person their own numbers is not sending them.
         */
        clipboard?: { writeText?: ((text: string) => unknown) | undefined } | undefined;
        /**
         * Which browser a recording and a report were written in.
         *
         * Read and never acted on: nothing here branches on it, and §5 keeps it
         * from leaving the machine. It is in both artefacts because a defect can
         * belong to one browser — `docs/browser-support.md` carries a whole tier
         * for what degrades where, and the selection defect this repository fixed
         * for `v0.8.0` was Safari's alone — and the artefacts are what somebody
         * sends when they report one.
         */
        userAgent?: string | undefined;
      }
    | undefined;
  /** For keeping the panel on screen. Absent means the page did not say. */
  innerWidth?: number | undefined;
  innerHeight?: number | undefined;
  /**
   * Injected like the document, so where the panel was left is checkable without
   * a browser — and so `src/ui/` still touches no global.
   */
  localStorage?:
    | {
        getItem(key: string): string | null;
        setItem(key: string, value: string): void;
      }
    | undefined;
  [PAGE_HANDLE]?: MargoMeter;
};

/** Namespaced, because the page belongs to the game and to every other add-on on it. */
const POSITION_KEY = "margometer.panel-position";

/**
 * Where the panel was left, or null.
 *
 * The `try` is wider than §9.5 likes, and deliberately: a browser refusing
 * storage is the expected failure here — private windows, third-party-storage
 * rules, a quota — and it arrives as a `DOMException` under several different
 * names, so there is nothing narrower to catch that would still catch them all.
 * What is not swallowed is a bad *value*: that is read and rejected by
 * `getPositionFromStoredText`, which is a different thing from the read failing.
 */
function getStoredPosition(page: HostPage): PanelPosition | null {
  try {
    const stored = page.localStorage?.getItem(POSITION_KEY);
    return stored === null || stored === undefined ? null : getPositionFromStoredText(stored);
  } catch {
    return null;
  }
}

/** The same the other way, and a failure to write is a panel that forgets — not a broken panel. */
function setStoredPosition(page: HostPage, position: PanelPosition): void {
  try {
    page.localStorage?.setItem(POSITION_KEY, composeStoredTextFromPosition(position));
  } catch {
    return;
  }
}

/**
 * The client build a recording came from, or null.
 *
 * Read from a script's filename by `src/core/game-build.ts`, which is also what
 * `tools/game-client-source.ts` asks when it decides which bundle to download —
 * so the number in a recording and the number in the cache mean the same thing.
 * They were two copies of one pattern until the coupling this sentence describes
 * was made into a module rather than left to the sentence
 * (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F18).
 *
 * Null, never a stand-in, where the page does not say. §7.6: material from the
 * game without the client's version is not comparable material, and a recording
 * that quietly claimed a build would be worse than one that admits it has none.
 */
function getGameBuildFromPage(page: HostPage): string | null {
  const scripts = page.document?.querySelectorAll?.("script[src]");
  if (scripts === undefined) return null;
  for (const script of Array.from(scripts)) {
    const source = typeof script.src === "string" ? script.src : "";
    const build = getGameBuildFromScriptName(source);
    if (build !== null) return build;
  }
  return null;
}

/**
 * Which world a recording came from, or the word that says we do not know.
 *
 * ⚠️ **`?? "unknown"` did not cover the case that happens.** A page with no
 * hostname gives `""`, `"".split(".")[0]` is `""`, and an empty string is not
 * nullish — so the recording carried a world of nothing and the file was named
 * `margometer--2026-…json`, with a hole where the answer goes. That is the
 * silence §9.3 forbids twice over: it is a value nobody wrote, and it reads as
 * an answer rather than as its absence. Seen on a `file://` page.
 */
function getWorldFromPage(page: HostPage): string {
  const world = page.location?.hostname?.split(".")[0];
  return world === undefined || world === "" ? "unknown" : world;
}

/**
 * What a recording needs from the page, gathered in the one file allowed to read
 * it — so `src/game/fight-capture.ts` stays checkable without a browser.
 */
function composeCaptureEnvironment(page: HostPage): CaptureEnvironment {
  return {
    getWorld: () => getWorldFromPage(page),
    getGameBuild: () => getGameBuildFromPage(page),
    getCapturedAt: () => new Date().toISOString(),
    getUserAgent: () => page.navigator?.userAgent ?? null,
  };
}

/** What the browser needs to be handed to save a file. Nothing wider. */
type DownloadAnchor = {
  href: string;
  download: string;
  /** So the one tick it spends in the page is still a tick it spends named. */
  className: string;
  click: () => void;
  remove: () => void;
};

/**
 * Hands a file to the browser, which puts it wherever the reader's downloads go.
 *
 * A file rather than the clipboard: a recording is hundreds of kilobytes, and
 * `navigator.clipboard` refuses often enough without a gesture that it cannot be
 * the only way out. `@grant none` is no obstacle — a blob and an object URL are
 * ordinary page APIs, not privileges.
 *
 * ⚠️ **The anchor goes into the document, and the URL is released on the next
 * tick.** Clicking a detached node and revoking synchronously is tolerated by
 * Chromium and can abort the download in Firefox, which reads the blob after the
 * click returns. That failure is the worst kind available here: nothing throws,
 * so the panel looks like it saved, and no file arrives. Nothing in a fake
 * document exercises this — `click()` on an anchor does nothing there — so it is
 * checked by hand, in a browser.
 */
function writeTextToFile(page: HostPage, name: string, text: string): void {
  const document = page.document;
  if (document === undefined) return;

  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const anchor = document.createElement("a") as DownloadAnchor;
  anchor.href = url;
  anchor.download = name;
  anchor.className = DOWNLOAD_ANCHOR_CLASS;
  document.body?.append(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/**
 * What the panel is kept inside. Null rather than zero where the page did not
 * say: §9.3, and a viewport of zero would pin the panel to the corner while
 * looking exactly like one that works.
 */
function getViewportFromPage(page: HostPage): PanelViewport | null {
  const width = getFiniteNumberFromValue(page.innerWidth);
  const height = getFiniteNumberFromValue(page.innerHeight);
  if (width === null || height === null) return null;
  return { width, height };
}

/**
 * Draws the panel and keeps it in step with the fight.
 *
 * The whole panel is rebuilt on each reading rather than patched. That is the
 * cheap thing to be right about: a fight produces a payload every few seconds,
 * and §9.6's "render section by section, each isolated" is a property of
 * building, not of diffing. Losing a hand-written patcher's edge cases is worth
 * more than the frames it would save.
 */
export function composePanelMount(
  page: HostPage,
  /** Injected so the once-per-fight rule can be checked without a console. */
  warn: (brand: string, detail: unknown) => void = (brand, detail) =>
    console.warn(brand, detail),
  /**
   * What the title bar's one button does. Absent draws no button: the panel is
   * mounted in tests that have no fight to hand over, and a control that does
   * nothing is worse than one that is not there.
   */
  onCaptureRequested?: () => void,
  /**
   * What the copy button hands over, given the fight as it stands.
   *
   * Takes the reading rather than reaching for it, because the button is built
   * once and the fight changes under it — a closure over the fight at mount time
   * would copy an empty one for the rest of the session.
   */
  onCopyRequested?: (reading: FightReading | null) => void,
): ((reading: FightReading) => void) | null {
  const document = page.document as PanelDocument | undefined;
  if (document === undefined) return null;

  // Where it sits is the stylesheet's, not this file's — all that is decided here
  // is where it was left last time, which is the one part `src/ui/` cannot know.
  const host = document.createElement("div") as MarkedPanelHost;
  /*
   * Named before it is appended, not after: between the two there is a tick in
   * which the page holds an anonymous `<div>` of ours, and a page script reading
   * `body.children` in that tick is exactly the reader this naming is for.
   */
  host.id = PANEL_HOST_ID;
  host.className = PANEL_HOST_CLASS;
  host.setAttribute(PANEL_HOST_VERSION_ATTRIBUTE, USERSCRIPT_VERSION);
  page.document?.body?.append(host);

  /**
   * Once for the page, not once per fight like the section failures below.
   *
   * A drag is not scoped to a fight, and `pointermove` fires tens of times a
   * second — a handler failing on each one would put the panel's own console
   * entry in the way of whatever the user was actually trying to read (§9.6).
   * Nothing is marked on screen for this: what a failed drag looks like is a
   * panel that did not move, which the hand holding it can already see.
   */
  let hasReportedDragFailure = false;

  /** Once for the page, like the drag above: pressing a button is not a fight. */
  let hasReportedCaptureFailure = false;

  /**
   * Once for the page, and for the plainest reason of the three: the body drawn
   * before the first payload belongs to no fight, so there is no boundary the
   * counter below could be cleared on.
   */
  let hasReportedWaitingFailure = false;

  /**
   * One map, filled by every render and read by the tooltip.
   *
   * It has to be the same object on both sides: the tooltip is built once with
   * the shadow root, and the rows it describes are rebuilt on every payload.
   */
  const details = new Map<unknown, PanelDetailLine[]>();

  /**
   * One per mount, like the map above, and for the same reason: the render is what
   * replaces the list, so where the reader had scrolled to has to survive between
   * two of them.
   */
  const scroll: PanelScroll = { list: null, levelKey: null };

  /**
   * Once per mount, because the dictionary is built with the page and not with
   * the fight — and because a page without one is a page that never grows one.
   * Null here is the panel drawing its own words, which is what every test and
   * every browser without the game sees.
   */
  const translate = getDictionaryReader(page);

  // Opened once: `attachShadow` throws on a second call for the same element.
  const container = setPanelRoot(
    document,
    host,
    {
      position: getStoredPosition(page),
      getViewport: () => getViewportFromPage(page),
      onMoved: (position) => setStoredPosition(page, position),
      // The name is bound here because `src/ui/` may not read the list it comes
      // from (§9.1). The panel is handed a function, not a vocabulary.
      getTimedResult: (work) => getTimedResult(DRAG_PHASE, work),
      onSectionFailure: (error) => {
        if (hasReportedDragFailure) return;
        hasReportedDragFailure = true;
        warn("MargoMeter/PanelDrag", error);
      },
    },
    {
      onCopyRequested: onCopyRequested === undefined ? undefined : () => onCopyRequested(latest),
      onCaptureRequested,
      onCollapseToggled: () => {
        state = { ...state, isCollapsed: !state.isCollapsed };
        renderLatest();
      },
      onSectionFailure: (error) => {
        if (hasReportedCaptureFailure) return;
        hasReportedCaptureFailure = true;
        warn("MargoMeter/PanelCapture", error);
      },
    },
    details,
  );

  let state: PanelState = composeDefaultState();
  let latest: FightReading | null = null;
  let failuresThisFight = 0;
  let fightBeingCounted = 0;
  /** Per fight, like the counter above and cleared on the same boundary. */
  let hasReportedEngineGaps = false;

  /**
   * Where a gesture becomes a state.
   *
   * All of it is here rather than in `ui`, and the split is the same one the
   * whole layer keeps: the panel reports what was clicked, and what that means
   * for what is on screen is decided outside it. Changing the metric drops the
   * drill with it, because the level below belongs to the metric it was opened
   * in — kept, it would draw one list under another list's heading.
   *
   * Every gesture goes through here — a tab, a side, a row, a step back, the
   * collapse — which is also why it is the one place the `gesture` phase wraps.
   * It contains the render it triggers, so what it measures is the question the
   * panel is actually asked: how long between the click and the new screen.
   */
  const setState = (next: Partial<PanelState>): void => {
    getTimedResult(GESTURE_PHASE, () => {
      state = { ...state, ...next };
      renderLatest();
    });
  };

  const renderLatest = (): void => {
    /*
     * ⚠️ **This used to be a bare `return`, and it is the whole of the defect it
     * replaces.** The title bar is built with the shadow root and outlives every
     * render, so a render that drew nothing left the panel looking exactly like a
     * *collapsed* one — a bar and no body — for as long as the player had not
     * fought. Two things followed from it: nothing said whether the add-on was
     * waiting or broken, and the collapse button flipped a flag that reached a
     * function which returned before drawing, so the one control on the bar did
     * nothing at all until the first payload.
     */
    if (latest === null) {
      renderWaitingInto(document, container, PANEL_WAITING, {
        onSectionFailure: (error) => {
          if (hasReportedWaitingFailure) return;
          hasReportedWaitingFailure = true;
          warn("MargoMeter/PanelSection", error);
        },
      }, state.isCollapsed);
      return;
    }
    const shown = latest;
    const view = getTimedResult(VIEW_PHASE, () => composePanelView(shown, state, translate));
    getTimedResult(DOM_PHASE, () =>
      renderPanelInto(document, container, view, {
      onMetricChosen: (chosen) => setState(composeStateAfterMetric(chosen)),
      onTeamChosen: (chosen) => setState(composeStateAfterTeam(chosen)),
      onRowChosen: (key) => setState(composeStateFromRow(state, key)),
      onBack: () => setState(composeStateAfterBack(state)),
      /**
       * Once per fight, not once per render: a fight redraws on every payload
       * and a panel logging each time is itself a way of disturbing someone
       * (§9.6). The repeats are counted rather than dropped, and what the count
       * came to is said when the fight it belongs to is over.
       */
      onSectionFailure: (error) => {
        failuresThisFight += 1;
        if (failuresThisFight === 1) warn("MargoMeter/PanelSection", error);
      },
      }, state.isCollapsed, details, scroll),
    );
    // Last, so what it draws includes the render it is drawn after. Nothing at
    // all in the file people install (`src/userscript-instrument.ts`).
    setCostDrawn(page);
  };

  /*
   * Drawn once here, so the panel is a panel from the moment it is on the page.
   * It cannot go any earlier: `state` is declared below the shadow root, and
   * `renderLatest` below that.
   */
  renderLatest();

  return (reading) => {
    // A warning belongs to the fight that produced it and clears with it (§9.6).
    // Said here rather than in the handler because this is where the boundary is
    // visible: the handler only ever sees failures, so a fight that ends cleanly
    // would never reach it.
    if (reading.fightsStarted !== fightBeingCounted) {
      if (failuresThisFight > 1) {
        warn("MargoMeter/PanelSection", `${failuresThisFight} failures in that fight, 1 printed`);
      }
      failuresThisFight = 0;
      fightBeingCounted = reading.fightsStarted;
      hasReportedEngineGaps = false;
      /*
       * The reader goes back to the top of the tab they chose, for the reason
       * `composeStateAfterFightStart` states. Assigned rather than pushed through
       * `setState`: that path renders, and what it measures is the `gesture`
       * phase — how long between a click and the new screen — while this is a
       * payload arriving. The render at the end of this callback is the one that
       * draws it, so the reset costs no second pass.
       *
       * ⚠️ **It sees the fights the game announces and no others.** A fight
       * joined in progress carries no `init`, so `fightsStarted` does not move
       * (`src/game/battle-session.ts`) and the panel stays where it was — the
       * same limit the accumulated figures already have.
       */
      state = { ...state, ...composeStateAfterFightStart() };
    }

    /**
     * Once per fight, on the payload that first has something to say.
     *
     * The panel states this to the player in their own words; the console states
     * it in ours, with the fault names, because that is the pair somebody needs
     * to report it. Not per payload — a fight redraws every few seconds and the
     * counts only grow, so a repeat would say the same thing louder (§9.6).
     */
    if (!hasReportedEngineGaps && hasEngineGaps(reading.engineReading)) {
      hasReportedEngineGaps = true;
      warn("MargoMeter/EngineReading", {
        unreadablePayloadsByFault: Object.fromEntries(
          reading.engineReading.unreadablePayloadsByFault,
        ),
        lostMessages: reading.engineReading.lostMessages,
        unreadableCombatants: reading.engineReading.unreadableCombatants,
      });
    }

    latest = reading;
    renderLatest();
  };
}

/** Whether the engine layer has anything to report about this fight. */
function hasEngineGaps(gaps: FightReading["engineReading"]): boolean {
  return (
    gaps.unreadablePayloadsByFault.size > 0 ||
    gaps.lostMessages > 0 ||
    gaps.unreadableCombatants > 0
  );
}

/**
 * Writes out whatever the meter is holding, under a name saying where and when.
 *
 * Written even when the fight is empty. A file stating `wpisy: []` is a true
 * statement and a useful one — it says the add-on is attached and reading
 * nothing, which is exactly the report someone would otherwise have to guess at.
 * Doing nothing instead would be the silence §9.6 spends its whole length on.
 */
export function writeCaptureToPage(page: HostPage, meter: MargoMeter): void {
  const environment = composeCaptureEnvironment(page);
  writeTextToFile(
    page,
    composeCaptureFileName(environment),
    composeCaptureText(meter.getCapture(), environment),
  );
}

/**
 * The fight, as something a person can paste into a report.
 *
 * Everything that qualifies the numbers travels with them, because a figure
 * without its build, its world and its warnings is a figure nobody can act on:
 * the add-on's version, the game's, where it was, when it was taken, who was
 * watching, the whole roster, and every warning as an entry with a token beside
 * it. **The tokens live here and nowhere the player reads** — the panel says
 * what cannot be known, this says what we could not read (§3).
 *
 * Ids and tokens rather than sentences, on purpose: a report is read by us.
 *
 * ⚠️ **English keys, and the comment above is why.** They were Polish until
 * `docs/audits/2026-08-13-the-whole-tree-read-once.md` (F11) put the two
 * sentences side by side: §3 makes Polish the exception for the text a *player*
 * reads, and this file says its reader is us. The names are the aggregate's own,
 * so a key in a pasted report can be grepped for in `src/core/fight-statistics.ts`
 * — which the translations could not be.
 */
export function composeReportText(
  page: HostPage,
  reading: FightReading | null,
  /**
   * How many failures each channel counted without printing. Absent where the
   * caller has no meter — a test mounting the panel alone — and absent is not
   * zero, so the report leaves the field out rather than claiming none (§9.6).
   */
  silenced?: { reading: number; capture: number },
): string {
  const environment = composeCaptureEnvironment(page);
  const report = {
    addon: { name: "MargoMeter", version: USERSCRIPT_VERSION },
    game: { world: environment.getWorld(), build: environment.getGameBuild() },
    // The same fact the recording carries as `przegladarka`, so the two artefacts
    // a reader can send cannot disagree about what was known. English here and
    // Polish there for the reason the block above states: this one is read by us.
    browser: environment.getUserAgent(),
    capturedAt: environment.getCapturedAt(),
    // One line printed per channel per page, and this is the rest of them —
    // §9.6 says a repeat is counted rather than reprinted, and a count nobody
    // can read is a count that is not there (F23).
    silencedFailures: silenced ?? null,
    fight:
      reading === null
        ? null
        : {
            isFromFightStart: reading.isFromFightStart,
            outcome: reading.statistics.outcome,
            ourSide: reading.ourSide,
            roster: [...reading.roster.byId.values()],
            // Everyone the panel drew, not everyone the aggregate counted: a
            // report is read beside the screenshot it arrived with, and a list
            // of eleven rows above a report holding two is a discrepancy
            // whoever reads it has to work out before they can start. A
            // combatant nothing has named yet reports zeros, which is what the
            // row beside them says.
            combatants: Object.fromEntries(
              getCombatantIdsInFight(reading.statistics, reading.roster).map((id) => [
                id,
                composeReportRow(
                  reading.statistics.byCombatantId.get(id) ?? composeEmptyCombatantStatistics(),
                ),
              ]),
            ),
            unattributed: composeReportRow(reading.statistics.unattributed),
            // Beside `reading` and not inside it: one says what never reached the
            // decoder, the other what the decoder could not make sense of, and a
            // report that merged them would lose the difference that decides
            // which of the two somebody has to go and look at.
            engineReading: {
              unreadablePayloadsByFault: Object.fromEntries(
                reading.engineReading.unreadablePayloadsByFault,
              ),
              lostMessages: reading.engineReading.lostMessages,
              unreadableCombatants: reading.engineReading.unreadableCombatants,
            },
            reading: {
              unreadableMessages: reading.statistics.reading.unreadableMessages,
              messagesByReason: Object.fromEntries(reading.statistics.reading.messagesByReason),
              occurrencesByUnreadKey: Object.fromEntries(reading.statistics.reading.occurrencesByUnreadKey),
              unaccountedHealthBySource: Object.fromEntries(
                reading.statistics.reading.unaccountedHealthBySource,
              ),
            },
          },
  };
  return composeJsonText(report, 2);
}

/**
 * One combatant's figures, with every map turned into something JSON can hold.
 *
 * ⚠️ **The return type is what holds this complete, and it used to be
 * `Record<string, unknown>` — a type any subset satisfies.** §4 makes the data
 * contract an `[ASK]` for one stated reason: a field added to a type and
 * forgotten downstream produces numbers that quietly shrink. This is that
 * downstream, and the consequence is specific — the report is what a player
 * pastes when something looks wrong, so a field added to the aggregate and
 * missed here is invisible in exactly the situation the report exists for
 * (`docs/audits/2026-08-14-the-whole-tree-read-a-third-time.md`, F9).
 *
 * Keyed to the row's own type, so adding a figure to `CombatantStatistics`
 * stops the build here until somebody decides how it is written down. §9.3's
 * bargain: no linter, because the compiler is the one holding the rule.
 */
function composeReportRow(
  row: FightReading["statistics"]["unattributed"],
): Record<keyof FightReading["statistics"]["unattributed"], unknown> {
  return {
    dealtRaw: row.dealtRaw,
    dealtApplied: row.dealtApplied,
    dealtAppliedByElement: Object.fromEntries(row.dealtAppliedByElement),
    taken: row.taken,
    takenByElement: Object.fromEntries(row.takenByElement),
    healthLost: row.healthLost,
    healthLostBySource: Object.fromEntries(row.healthLostBySource),
    healthLostByActorId: Object.fromEntries(
      [...row.healthLostByActorId].map(([id, bySource]) => [id, Object.fromEntries(bySource)]),
    ),
    healthLostCaused: row.healthLostCaused,
    healthLostCausedByTargetId: Object.fromEntries(
      [...row.healthLostCausedByTargetId].map(([id, bySource]) => [
        id,
        Object.fromEntries(bySource),
      ]),
    ),
    healed: row.healed,
    healedBySource: Object.fromEntries(row.healedBySource),
    healedWithoutHealerBySource: Object.fromEntries(row.healedWithoutHealerBySource),
    healedByHealerId: Object.fromEntries(row.healedByHealerId),
    healedWithoutSkillByHealerId: Object.fromEntries(
      [...row.healedWithoutSkillByHealerId].map(([id, bySource]) => [
        id,
        Object.fromEntries(bySource),
      ]),
    ),
    healingGiven: row.healingGiven,
    healingGivenByCombatantId: Object.fromEntries(row.healingGivenByCombatantId),
    healingGivenWithoutSkillByCombatantId: Object.fromEntries(
      [...row.healingGivenWithoutSkillByCombatantId].map(([id, bySource]) => [
        id,
        Object.fromEntries(bySource),
      ]),
    ),
    prevented: Object.fromEntries(row.prevented),
    destroyed: Object.fromEntries(row.destroyed),
    procsOnBlowsStruck: Object.fromEntries(row.procsOnBlowsStruck),
    blowsStruck: row.blowsStruck,
    blowsWithoutSkill: row.blowsWithoutSkill,
    largestBlow: row.largestBlow,
    skillsUsed: row.skillsUsed,
    // What the panel puts a mark on this row for. In the report because the mark
    // says a figure may be low and says nothing a reader can chase — these say
    // how often, and the fight-wide `reading` below says what the keys were.
    unreadableMessages: row.unreadableMessages,
    unaccountedHealingCasts: row.unaccountedHealingCasts,
    dealtByTargetId: Object.fromEntries(
      [...row.dealtByTargetId].map(([id, byElement]) => [id, Object.fromEntries(byElement)]),
    ),
    takenByActorId: Object.fromEntries(
      [...row.takenByActorId].map(([id, byElement]) => [id, Object.fromEntries(byElement)]),
    ),
    skills: Object.fromEntries(
      [...row.skills].map(([key, skill]) => [
        key,
        {
          skillName: skill.skillName,
          uses: skill.uses,
          dealtApplied: skill.dealtApplied,
          dealtByTargetId: Object.fromEntries(skill.dealtByTargetId),
          healed: skill.healed,
          healedByCombatantId: Object.fromEntries(skill.healedByCombatantId),
        },
      ]),
    ),
  };
}

/**
 * Everything the meter is told, as a value rather than as a literal at the call.
 *
 * ⚠️ **It is a function because the literal was wrong and nothing could say so.**
 * `onReadingFailure` was declared on `MargoMeterOptions`, called at
 * `src/game/engine-battle-wrap.ts`, and passed faithfully down through
 * `setEngineAttachment` and `setMargoMeter` — and then the one call that ships
 * never supplied it. An optional callback nobody passes is indistinguishable at
 * every layer from one deliberately left out, so the compiler had nothing to say
 * and neither did the gate. A literal inside `if (shouldStartHere(page))` runs at
 * import and cannot be looked at; this can, and its guard reads the option names
 * off the type rather than from a list somebody keeps (§7.5).
 *
 * The console is injected for the same reason `composePanelMount` injects `warn`:
 * so the once-per-page rule is checkable without one.
 */
export function composeMeterOptions(
  renderReading: ((reading: FightReading) => void) | null,
  warn: (brand: string, detail: unknown) => void,
  info: (message: string) => void,
  /**
   * Where the silenced counts go, so somebody can read them.
   *
   * ⚠️ **They had nowhere to go, and the docblock said otherwise.** Both sinks
   * were built here and only `.report` was kept, so `getSilenced` could never be
   * called by anything that ships — while §9.6 requires the repeats to be
   * *counted* and not merely dropped, and the sink's own comment said the count
   * existed "so a report can say how many followed the one that printed". The
   * report carried no such field
   * (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F23).
   *
   * Optional, because a caller that never copies a report has nothing to do with
   * them and should not have to invent a place to put them.
   */
  onSinks?: (sinks: FailureSinks) => void,
): MargoMeterOptions {
  const reading = composeFailureSink("MargoMeter/Reading", warn);
  const capture = composeFailureSink("MargoMeter/Capture", warn);
  onSinks?.({ reading, capture });
  return {
    // One line, once, when the wrap goes on. Branded like every other thing this
    // add-on writes to a console it shares with the game (§9.5). It is not a
    // running commentary: nothing else here prints.
    onAttached: () => info("MargoMeter/attached"),
    // The other end of the same line: a page where the game never appeared says
    // so once, rather than leaving a timer running and nothing on screen.
    onSearchAbandoned: () => info("MargoMeter/no-game-here"),
    // A copy that stands down says which of the two it is. Silence here would be
    // a panel drawing nothing on a page where the add-on is working perfectly
    // well — in the other copy.
    onAnotherReaderFound: () => info("MargoMeter/another-copy-is-reading"),
    // The game is here and its shape is not one we know. Said once; the search
    // keeps going, because a battle object without its method is also what a
    // client half-way through building one looks like.
    onAttachmentRefused: (error) => warn("MargoMeter/AttachmentRefused", error),
    onReading: (reading) => renderReading?.(reading),
    onReadingFailure: reading.report,
    onCaptureFailure: capture.report,
  };
}

/**
 * The page, read once, and the one name this add-on writes onto it.
 *
 * `globalThis` rather than `window` because that is what exists in both places
 * this file is loaded — and in a test runner there is no `document`, so
 * importing this module attaches to nothing.
 *
 * ⚠️ **This block used to sit six hundred lines up, above a type, where it
 * documented nothing** and said "the one global read in the add-on", which is
 * also not true: `src/game/engine-attachment.ts` reaches for `setInterval` and
 * `clearInterval` when no clock is injected
 * (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F7). What is true is
 * narrower and is the part that matters — this is the only file that reads the
 * game off the page and the only one that writes a name back onto it.
 */
const page = globalThis as HostPage;
if (hasOtherMargoMeter(page)) {
  // Nothing is mounted and nothing is wrapped: two panels over one fight is a
  // worse outcome than one, and this copy has no way to be the better of the two.
  // Said out loud, because a second copy that installs and then draws nothing is
  // indistinguishable from one that is broken.
  console.info("MargoMeter/already-running-here");
} else if (shouldStartHere(page)) {
  // The panel is mounted before the meter exists, and the button needs the meter
  // — so the button asks for it at the moment it is pressed, by which time it is
  // there. Mounting after the meter instead would leave the first payloads of a
  // fight already under way with nowhere to draw.
  let meter: MargoMeter | null = null;
  let sinks: FailureSinks | null = null;
  const renderReading = composePanelMount(
    page,
    undefined,
    () => {
      if (meter !== null) writeCaptureToPage(page, meter);
    },
    /**
     * The clipboard, not the network: §5 forbids the second and says nothing
     * about the first, because handing a person their own numbers is not sending
     * them anywhere. A browser that refuses the clipboard costs the copy and
     * nothing else — the same shape as the stored position.
     */
    (reading) => {
      void page.navigator?.clipboard?.writeText?.(
        composeReportText(
          page,
          reading,
          sinks === null
            ? undefined
            : { reading: sinks.reading.getSilenced(), capture: sinks.capture.getSilenced() },
        ),
      );
    },
  );
  meter = setMargoMeter(
    page,
    composeMeterOptions(
      renderReading,
      (brand, detail) => console.warn(brand, detail),
      (message) => console.info(message),
      (built) => {
        sinks = built;
      },
    ),
  );
  page[PAGE_HANDLE] = meter;
}
