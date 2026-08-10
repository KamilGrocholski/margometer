/**
 * Bundle entry point: the game on one side, a reading of the fight on the other.
 *
 * Everything here is wiring. The decoding, the arithmetic and the promises to
 * the game each live in a module that can be read on its own; this is the only
 * file that knows they go together, and the only one that touches `window`.
 *
 * **Nothing is drawn yet.** The panel is the next piece, and until it exists the
 * add-on reads and keeps the result. That is why `setMargoMeter` takes the
 * page rather than reaching for the global itself: the wiring is testable, and
 * the one unavoidable global read sits at the bottom of this file where an
 * auditor will find it.
 */

import {
  composeEmptySession,
  composeFightReading,
  composeNextSession,
  type BattleSession,
  type FightReading,
} from "@/src/game/battle-session.ts";
import { setEngineAttachment, type GameWindow } from "@/src/game/engine-attachment.ts";
import {
  renderPanelInto,
  setPanelRoot,
  type PanelDocument,
  type PanelHost,
} from "@/src/ui/panel-element.ts";
import { composePanelView, type PanelMetric } from "@/src/ui/panel-view.ts";

export type MargoMeterOptions = {
  /** Told after every payload, with the fight as it now stands. */
  onReading?: ((reading: FightReading) => void) | undefined;
  /** Told once, when the wrap is on the game. */
  onAttached?: (() => void) | undefined;
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
 * Until a panel exists this is the only way to see whether any of it works, and
 * it stays afterwards because "is it attached" is the first question anyone
 * reporting a wrong number will be asked. One property, namespaced, read-only in
 * spirit: the page belongs to the game.
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
  [PAGE_HANDLE]?: MargoMeter;
};

/**
 * Draws the panel and keeps it in step with the fight.
 *
 * The whole panel is rebuilt on each reading rather than patched. That is the
 * cheap thing to be right about: a fight produces a payload every few seconds,
 * and §9.6's "render section by section, each isolated" is a property of
 * building, not of diffing. Losing a hand-written patcher's edge cases is worth
 * more than the frames it would save.
 */
function composePanelMount(page: HostPage): ((reading: FightReading) => void) | null {
  const document = page.document as PanelDocument | undefined;
  if (document === undefined) return null;

  const host = document.createElement("div") as PanelHost;
  host.style.setProperty("position", "fixed");
  host.style.setProperty("top", "8px");
  host.style.setProperty("right", "8px");
  host.style.setProperty("z-index", "9999");
  page.document?.body?.append(host);
  // Opened once: `attachShadow` throws on a second call for the same element.
  const container = setPanelRoot(document, host);

  let metric: PanelMetric = "dealt";
  let latest: FightReading | null = null;
  let reported = false;

  const renderLatest = (): void => {
    if (latest === null) return;
    renderPanelInto(document, container, composePanelView(latest, metric), {
      onMetricChosen: (chosen) => {
        metric = chosen;
        renderLatest();
      },
      // Once, not per render: a panel logging sixty times a second is itself a
      // way of disturbing someone (§9.6).
      onSectionFailure: (error) => {
        if (reported) return;
        reported = true;
        console.warn("MargoMeter/PanelSection", error);
      },
    });
  };

  return (reading) => {
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
    onReading: (reading) => renderReading?.(reading),
  });
}
