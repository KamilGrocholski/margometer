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
import { getFiniteNumberFromValue } from "@/libs/number.ts";
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
import { composePanelView, type PanelMetric } from "@/src/ui/panel-view.ts";

export type MargoMeterOptions = {
  /** Told after every payload, with the fight as it now stands. */
  onReading?: ((reading: FightReading) => void) | undefined;
  /** Told once, when the wrap is on the game. */
  onAttached?: (() => void) | undefined;
  /** Told once, when the search gives up without ever finding the game. */
  onSearchAbandoned?: (() => void) | undefined;
  onReadingFailure?: ((error: unknown) => void) | undefined;
  schedule?: ((step: () => void, everyMs: number) => number) | undefined;
  cancel?: ((handle: number) => void) | undefined;
};

export type MargoMeter = {
  /** The fight as it now stands, or null before anything has been read. */
  getReading: () => FightReading | null;
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

  const stop = setEngineAttachment(
    page,
    (messages, payload) => {
      session = composeNextSession(session, payload, messages);
      read = true;
      options.onReading?.(composeFightReading(session));
    },
    {
      onReadingFailure: options.onReadingFailure,
      onAttached: options.onAttached,
      onSearchAbandoned: options.onSearchAbandoned,
      schedule: options.schedule,
      cancel: options.cancel,
    },
  );

  return {
    getReading: () => (read ? composeFightReading(session) : null),
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
  };
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

  // Opened once: `attachShadow` throws on a second call for the same element.
  const container = setPanelRoot(document, host, {
    position: getStoredPosition(page),
    getViewport: () => getViewportFromPage(page),
    onMoved: (position) => setStoredPosition(page, position),
    onSectionFailure: (error) => {
      if (dragFailureSaid) return;
      dragFailureSaid = true;
      warn("MargoMeter/PanelDrag", error);
    },
  });

  let metric: PanelMetric = "dealt";
  let latest: FightReading | null = null;
  let failuresThisFight = 0;
  let fightBeingCounted = 0;

  const renderLatest = (): void => {
    if (latest === null) return;
    renderPanelInto(document, container, composePanelView(latest, metric), {
      onMetricChosen: (chosen) => {
        metric = chosen;
        renderLatest();
      },
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
    });
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

const page = globalThis as HostPage;
if (shouldStartHere(page)) {
  const renderReading = composePanelMount(page);
  page[PAGE_HANDLE] = setMargoMeter(page, {
    // One line, once, when the wrap goes on. Branded like every other thing this
    // add-on writes to a console it shares with the game (§9.5). It is not a
    // running commentary: nothing else here prints.
    onAttached: () => console.info("MargoMeter/attached"),
    // The other end of the same line: a page where the game never appeared says
    // so once, rather than leaving a timer running and nothing on screen.
    onSearchAbandoned: () => console.info("MargoMeter/no-game-here"),
    onReading: (reading) => renderReading?.(reading),
  });
}
