/**
 * Getting the wrap onto the game, and off again.
 *
 * `engine-battle-wrap.ts` knows how to wrap a battle object; this knows how to
 * find one. They are separate because the finding is a matter of timing and the
 * wrapping is a matter of promises, and mixing them would make the promises
 * harder to read.
 *
 * **The timing problem.** The game builds `Engine.battle` once, during engine
 * initialisation (`docs/specs/2026-08-10-reading-a-live-fight.md`), and a
 * userscript at `document-idle` may arrive before or after that. So this looks
 * now, and keeps looking until it finds it — then stops looking. There is
 * nothing to poll for afterwards: the object is not replaced.
 *
 * What polling cannot fix is a fight already in progress. That is not a bug to
 * engineer away but a fact to report, and `battle-session.ts` carries it as
 * `isFromFightStart`.
 */

import { setBattleWrap, type EngineBattle } from "@/src/game/engine-battle-wrap.ts";

/** How the page exposes the game. Both spellings, because both are in the wild. */
export type GameWindow = {
  Engine?: { battle?: unknown } | undefined;
  getEngine?: (() => { battle?: unknown } | undefined) | undefined;
};

export type AttachmentOptions = {
  /** Injected so a test can drive the clock instead of waiting on one. */
  schedule?: ((step: () => void, everyMs: number) => number) | undefined;
  cancel?: ((handle: number) => void) | undefined;
  /** Told once, when the wrap is on. */
  onAttached?: (() => void) | undefined;
  onReadingFailure?: ((error: unknown) => void) | undefined;
};

/**
 * How often to look for the battle object before it exists.
 *
 * A tenth of a second, and the cost is one property read: the game may finish
 * initialising at any point after our script runs, and every tick we wait is a
 * tick in which a fight could start without us. Once found, the timer stops —
 * this is a search, not a watch.
 */
const LOOK_AGAIN_EVERY_MS = 100;

/**
 * Reads `Engine.battle` without trusting any of it.
 *
 * Wrapped because reaching into another program's object graph can throw when
 * the page tears a context down, and an exception here would come from a timer
 * with nobody to catch it.
 */
export function getBattleFromWindow(page: GameWindow): EngineBattle | null {
  try {
    const engine = page.Engine ?? page.getEngine?.();
    const battle = engine?.battle;
    if (typeof battle !== "object" || battle === null) return null;
    return battle as EngineBattle;
  } catch {
    return null;
  }
}

/**
 * Watches for the game, wraps it once it is there, and hands back the way to
 * undo both.
 *
 * The remover is safe to call whether or not the wrap ever went on, because the
 * caller cannot know which — the search may still be running when a user
 * disables the add-on.
 */
export function setEngineAttachment(
  page: GameWindow,
  onMessages: (messages: readonly string[], payload: unknown) => void,
  options: AttachmentOptions = {},
): () => void {
  const schedule =
    options.schedule ?? ((step, everyMs) => setInterval(step, everyMs) as unknown as number);
  const cancel = options.cancel ?? ((handle: number) => clearInterval(handle));

  let removeWrap: (() => void) | null = null;
  let handle: number | null = null;

  function removeSearchTimer(): void {
    if (handle === null) return;
    cancel(handle);
    handle = null;
  }

  function setWrapIfPresent(): void {
    if (removeWrap !== null) return;
    const battle = getBattleFromWindow(page);
    if (battle === null) return;

    removeWrap = setBattleWrap(battle, onMessages, {
      onReadingFailure: options.onReadingFailure,
    });
    removeSearchTimer();
    options.onAttached?.();
  }

  setWrapIfPresent();
  // Only if the first look came up empty: scheduling a timer we would cancel on
  // its first tick is a timer that exists to be read about, not to run.
  if (removeWrap === null) handle = schedule(setWrapIfPresent, LOOK_AGAIN_EVERY_MS);

  return () => {
    removeSearchTimer();
    removeWrap?.();
    removeWrap = null;
  };
}
