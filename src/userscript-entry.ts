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
import { setEngineAttachment, type GameWindow } from "@/src/game/engine-attachment.ts";
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
import {
  getIntegerFromText, getFiniteNumberFromValue } from "@/libs/number.ts";
import {
  renderPanelInto,
  setPanelRoot,
  type PanelDocument,
  type PanelHost,
} from "@/src/ui/panel-element.ts";
import {
  composeStoredTextFromPosition,
  getPositionFromStoredText,
  type PanelPosition,
  type PanelViewport,
} from "@/src/ui/panel-placement.ts";
import {
  composeDefaultState,
  composePanelView,
  type PanelDetailLine,
  type PanelMetric,
  type PanelState,
  type PanelTeam,
} from "@/src/ui/panel-view.ts";

export type MargoMeterOptions = {
  /** Told after every payload, with the fight as it now stands. */
  onReading?: ((reading: FightReading) => void) | undefined;
  /** Told once, when the wrap is on the game. */
  onAttached?: (() => void) | undefined;
  /** Told once, when the search gives up without ever finding the game. */
  onSearchAbandoned?: (() => void) | undefined;
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
export const PAGE_HANDLE = "margometer";

/**
 * Attaches to the game and starts accumulating.
 *
 * The session is rebuilt rather than mutated on each payload, so the value handed
 * out is never one a later payload can change underneath its reader — which is
 * what lets a panel hold onto a reading while the next batch arrives.
 */
export function setMargoMeter(page: GameWindow, options: MargoMeterOptions = {}): MargoMeter {
  let session: BattleSession = composeEmptySession();
  let read = false;
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
    (messages, payload) => {
      const before = session;
      session = composeNextSession(session, payload, messages);
      read = true;
      /**
       * Guarded on its own, and ahead of nothing: keeping material is a
       * developer's convenience, and it must never be the reason a fight stops
       * being counted or the panel stops being drawn. The same argument the wrap
       * makes with two `try`s instead of one, one layer up.
       */
      try {
        capture = composeNextCapture(
          capture,
          payload,
          messages,
          combatantsBefore,
          battleBeingCalled === null ? [] : composeSnapshotFromBattle(battleBeingCalled),
        );
      } catch (error) {
        options.onCaptureFailure?.(error);
      }
      combatantsBefore = [];
      // Nothing the panel draws can have changed, so nothing is drawn: the same
      // session object back means the payload carried no fight (`composeNextSession`).
      if (session !== before) options.onReading?.(composeFightReading(session));
    },
    {
      onBeforeOriginal: (battle) => {
        battleBeingCalled = battle;
        combatantsBefore = composeSnapshotFromBattle(battle);
      },
      onReadingFailure: options.onReadingFailure,
      onAttached: options.onAttached,
      onSearchAbandoned: options.onSearchAbandoned,
      schedule: options.schedule,
      cancel: options.cancel,
    },
  );

  return {
    getReading: () => (read ? composeFightReading(session) : null),
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
 * The one global read in the add-on, and its one global write.
 *
 * `globalThis` rather than `window` because that is what exists in both places
 * this file is loaded — and in a test runner there is no `document`, so
 * importing this module attaches to nothing.
 */
/**
 * The page as this file needs it: the game, a document to draw into, and a name
 * to answer to.
 */
type HostPage = GameWindow & {
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
  /**
   * Where a report goes when the reader asks for one.
   *
   * Optional throughout, because a browser may refuse it and a test has none —
   * and refusing costs the copy and nothing else, the same shape as the stored
   * position. Not a network call: §5 forbids sending anything anywhere, and
   * handing a person their own numbers is not sending them.
   */
  navigator?: { clipboard?: { writeText?: ((text: string) => unknown) | undefined } | undefined } | undefined;
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
 * Read from a script's filename — `main.min<build>.js` — which is the same place
 * `tools/game-client-source.ts` reads it to decide which bundle to download, so
 * the number in a recording and the number in the cache mean the same thing.
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
    const found = /main\.min(\d{10,})\.js/.exec(source);
    if (found?.[1] !== undefined) return found[1];
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
  };
}

/** What the browser needs to be handed to save a file. Nothing wider. */
type DownloadAnchor = {
  href: string;
  download: string;
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
  const host = document.createElement("div") as PanelHost;
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
  let dragFailureSaid = false;

  /** Once for the page, like the drag above: pressing a button is not a fight. */
  let captureFailureSaid = false;

  /**
   * One map, filled by every render and read by the tooltip.
   *
   * It has to be the same object on both sides: the tooltip is built once with
   * the shadow root, and the rows it describes are rebuilt on every payload.
   */
  const details = new Map<unknown, PanelDetailLine[]>();

  // Opened once: `attachShadow` throws on a second call for the same element.
  const container = setPanelRoot(
    document,
    host,
    {
      position: getStoredPosition(page),
      getViewport: () => getViewportFromPage(page),
      onMoved: (position) => setStoredPosition(page, position),
      onSectionFailure: (error) => {
        if (dragFailureSaid) return;
        dragFailureSaid = true;
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
        if (captureFailureSaid) return;
        captureFailureSaid = true;
        warn("MargoMeter/PanelCapture", error);
      },
    },
    details,
  );

  let state: PanelState = composeDefaultState();
  let latest: FightReading | null = null;
  let failuresThisFight = 0;
  let fightBeingCounted = 0;

  /**
   * Where a gesture becomes a state.
   *
   * All of it is here rather than in `ui`, and the split is the same one the
   * whole layer keeps: the panel reports what was clicked, and what that means
   * for what is on screen is decided outside it. Changing the metric drops the
   * drill with it, because the level below belongs to the metric it was opened
   * in — kept, it would draw one list under another list's heading.
   */
  const setState = (next: Partial<PanelState>): void => {
    state = { ...state, ...next };
    renderLatest();
  };

  const renderLatest = (): void => {
    if (latest === null) return;
    renderPanelInto(document, container, composePanelView(latest, state), {
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
    }, state.isCollapsed, details);
  };

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
    }

    latest = reading;
    renderLatest();
  };
}

/**
 * What a clicked row does to the state.
 *
 * The key is the view's own and its prefix is what says which level was clicked;
 * reading it here rather than passing three optional ids keeps `ui` free of the
 * question "which of these is set".
 */
export function composeStateFromRow(state: PanelState, key: string): Partial<PanelState> {
  if (key === "back") return composeStateAfterBack(state);

  const [kind, rest] = [key.slice(0, key.indexOf(":")), key.slice(key.indexOf(":") + 1)];
  if (kind === "combatant") {
    const id = getIntegerFromText(rest);
    // A row whose id will not read is a row that leads nowhere, rather than one
    // that opens somebody else's breakdown.
    return id === null ? {} : { focusCombatantId: id, focusTargetId: null, focusSkill: null };
  }
  if (kind === "target") {
    const id = getIntegerFromText(rest);
    return id === null ? {} : { focusTargetId: id, focusSkill: null };
  }
  if (kind === "skill") {
    /**
     * The owner is split off the front and whatever follows is taken whole: a
     * skill's own key is the game's id where it stated one and the skill's
     * **name** where it did not, so it can carry anything, including a colon.
     *
     * ⚠️ The guard is load-bearing rather than defensive. Without it a key we did
     * not compose slices as `rest.slice(0, -1)`, which turns `78` into the owner
     * id `7` — a row that quietly opens somebody else's figures, which is the
     * whole defect this shape exists to end.
     */
    const divider = rest.indexOf(":");
    if (divider < 0) return {};
    const ownerId = getIntegerFromText(rest.slice(0, divider));
    return ownerId === null
      ? {}
      : { focusSkill: { ownerId, key: rest.slice(divider + 1) }, focusTargetId: null };
  }
  return {};
}

/**
 * A side tab chooses who is on the list, so choosing one closes the breakdown.
 *
 * Further than the metric goes, and the asymmetry is the point: the same
 * combatant exists in every metric, so switching metric keeps them in focus —
 * but a side filter decides *who is on the list at all*, and can put the one in
 * focus off it. Measured against the alternative: while a breakdown is open the
 * team changes nothing on screen at either level, so a tab that only dropped the
 * deep level would still look chosen while the panel did not move.
 *
 * Rejected: dropping the focus only when the filter excludes them. That needs
 * the admission rule outside `ui`, where this file would hold a second copy of
 * the ranking's logic — §9.1's line, spent on a nicety.
 */
export function composeStateAfterTeam(team: PanelTeam): Partial<PanelState> {
  return { team, focusCombatantId: null, focusTargetId: null, focusSkill: null };
}

/**
 * Both control strips land here, because both answer the same question: which
 * figure. What they share is the reset, and the deep level is the part that must
 * go.
 *
 * ⚠️ **A deep level does not survive turning the figure round.** Under
 * `Leczenie · otrzymane` an open skill belongs to whoever cast it — somebody
 * other than the combatant in focus — while under `Leczenie · dane` the skills
 * are the combatant's own. Carrying `focusSkill` across the flip opens a key that
 * is not on that side of the join, and the same is true of `focusTargetId`, whose
 * end of the pair the direction decides. The combatant stays: they exist in every
 * metric, which is the asymmetry `composeStateAfterTeam` above is about.
 */
export function composeStateAfterMetric(metric: PanelMetric): Partial<PanelState> {
  return { metric, focusTargetId: null, focusSkill: null };
}

/** One level out, and only one: the way back is as small a step as the way in. */
export function composeStateAfterBack(state: PanelState): Partial<PanelState> {
  if (state.focusTargetId !== null || state.focusSkill !== null) {
    return { focusTargetId: null, focusSkill: null };
  }
  return { focusCombatantId: null };
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
 */
export function composeReportText(page: HostPage, reading: FightReading | null): string {
  const environment = composeCaptureEnvironment(page);
  const report = {
    dodatek: { nazwa: "MargoMeter", wersja: USERSCRIPT_VERSION },
    gra: { swiat: environment.getWorld(), build: environment.getGameBuild() },
    kiedy: environment.getCapturedAt(),
    walka:
      reading === null
        ? null
        : {
            odPoczatku: reading.isFromFightStart,
            wynik: reading.statistics.outcome,
            nasza_strona: reading.ourSide,
            sklad: [...reading.roster.byId.values()],
            postacie: Object.fromEntries(
              [...reading.statistics.byCombatantId].map(([id, row]) => [
                id,
                composeReportRow(row),
              ]),
            ),
            bez_sprawcy: composeReportRow(reading.statistics.unattributed),
            odczyt: {
              nieodczytane_komunikaty: reading.statistics.reading.unreadableMessages,
              powody: Object.fromEntries(reading.statistics.reading.messagesByReason),
              nieznane_klucze: Object.fromEntries(reading.statistics.reading.occurrencesByUnreadKey),
              leczenie_bez_sumy: Object.fromEntries(
                reading.statistics.reading.unaccountedHealthBySource,
              ),
            },
          },
  };
  return JSON.stringify(report, null, 2);
}

/** One combatant's figures, with every map turned into something JSON can hold. */
function composeReportRow(row: FightReading["statistics"]["unattributed"]): Record<string, unknown> {
  return {
    zadane_surowe: row.dealtRaw,
    zadane: row.dealtApplied,
    zadane_wg_rodzaju: Object.fromEntries(row.dealtAppliedByElement),
    otrzymane: row.taken,
    otrzymane_wg_rodzaju: Object.fromEntries(row.takenByElement),
    utracone_poza_ciosem: row.healthLost,
    utracone_wg_zrodla: Object.fromEntries(row.healthLostBySource),
    leczenie: row.healed,
    leczenie_wg_zrodla: Object.fromEntries(row.healedBySource),
    leczenie_wg_leczacego: Object.fromEntries(row.healedByHealerId),
    leczenie_dane: row.healingGiven,
    leczenie_dane_komu: Object.fromEntries(row.healingGivenByCombatantId),
    pochloniete: Object.fromEntries(row.prevented),
    zniszczone: Object.fromEntries(row.destroyed),
    efekty: Object.fromEntries(row.procsOnBlowsStruck),
    ciosy: row.blowsStruck,
    // Beside the number it breaks down, and named for what it means rather than
    // for what the panel labels it: this file is read by us, not by a player.
    ciosy_bez_umiejetnosci: row.blowsWithoutSkill,
    maks_cios: row.largestBlow,
    uzycia_umiejetnosci: row.skillsUsed,
    komu: Object.fromEntries(
      [...row.dealtByTargetId].map(([id, byElement]) => [id, Object.fromEntries(byElement)]),
    ),
    od_kogo: Object.fromEntries(
      [...row.takenByActorId].map(([id, byElement]) => [id, Object.fromEntries(byElement)]),
    ),
    umiejetnosci: Object.fromEntries(
      [...row.skills].map(([key, skill]) => [
        key,
        {
          nazwa: skill.skillName,
          uzycia: skill.uses,
          zadane: skill.dealtApplied,
          komu: Object.fromEntries(skill.dealtByTargetId),
          wyleczone: skill.healed,
          komu_wyleczone: Object.fromEntries(skill.healedByCombatantId),
        },
      ]),
    ),
  };
}

const page = globalThis as HostPage;
if (shouldStartHere(page)) {
  // The panel is mounted before the meter exists, and the button needs the meter
  // — so the button asks for it at the moment it is pressed, by which time it is
  // there. Mounting after the meter instead would leave the first payloads of a
  // fight already under way with nowhere to draw.
  let meter: MargoMeter | null = null;
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
      void page.navigator?.clipboard?.writeText?.(composeReportText(page, reading));
    },
  );
  meter = setMargoMeter(page, {
    // One line, once, when the wrap goes on. Branded like every other thing this
    // add-on writes to a console it shares with the game (§9.5). It is not a
    // running commentary: nothing else here prints.
    onAttached: () => console.info("MargoMeter/attached"),
    // The other end of the same line: a page where the game never appeared says
    // so once, rather than leaving a timer running and nothing on screen.
    onSearchAbandoned: () => console.info("MargoMeter/no-game-here"),
    onReading: (reading) => renderReading?.(reading),
    onCaptureFailure: (error) => console.warn("MargoMeter/Capture", error),
  });
  page[PAGE_HANDLE] = meter;
}
