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
const page = globalThis as GameWindow & { document?: unknown; [PAGE_HANDLE]?: MargoMeter };
if (shouldStartHere(page)) {
  page[PAGE_HANDLE] = setMargoMeter(page, {
    // One line, once, when the wrap goes on. Branded like every other thing this
    // add-on writes to a console it shares with the game (§9.5). It is not a
    // running commentary: nothing else here prints.
    onAttached: () => console.info("MargoMeter/attached"),
  });
}
