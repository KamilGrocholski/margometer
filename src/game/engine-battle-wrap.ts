/**
 * The one function in this repository that changes the running game.
 *
 * It replaces `Engine.battle.updateData` with a wrapper that calls the original
 * first, hands us the protocol messages, and returns the original's value
 * untouched. Design, evidence and rejected alternatives:
 * `docs/specs/2026-08-10-reading-a-live-fight.md`.
 *
 * **It is its own file so that it is visible in the tree.** §5 promises the
 * add-on does not automate the game or alter its behaviour, and wrapping a
 * function belonging to someone else's program is the closest this project comes
 * to the edge of that promise. Buried inside a larger module it would be a
 * detail; here it is a file with a name, and an auditor can read the whole of
 * our contact with the game in one sitting.
 *
 * The engine arrives as an argument rather than off `window`, which keeps this
 * testable without a browser and keeps the global read in the caller.
 */

import { MargoMeterError } from "@/src/core/margometer-error.ts";

export class EngineBattleWrapError extends MargoMeterError {
  constructor(reason: string) {
    super("EngineBattleWrap", reason);
  }
}

/**
 * The method the payload arrives on. Production build `1785244275300`:
 * `on_f` ends with `Engine.battle.updateData(e,t)`.
 */
const WRAPPED_METHOD = "updateData";

/**
 * Marks our wrapper so detaching can tell it from someone else's.
 *
 * Carries a version because two add-ons of ours from different builds may meet
 * on one page, and "is this mine" then has to mean "is this mine, of this
 * vintage" — otherwise an older layer is removed by newer code that does not
 * know its shape.
 */
const WRAP_MARKER = "__margometerBattleWrap";
const WRAP_VERSION = 1;

/** The battle object as we use it: one method, and nothing else assumed. */
export type EngineBattle = Record<string, unknown>;

type Wrapper = ((...args: unknown[]) => unknown) & { [WRAP_MARKER]?: number };

function isOurWrapper(value: unknown): value is Wrapper {
  return typeof value === "function" && (value as Wrapper)[WRAP_MARKER] === WRAP_VERSION;
}

/**
 * The payload is the game's, so nothing is assumed about it beyond the one field
 * we came for. A payload whose `m` is not a list of strings yields no messages
 * rather than a guess — the caller sees an empty batch, which is a state the
 * panel already has to handle for a fight joined late.
 */
export function getMessagesFromPayload(payload: unknown): string[] {
  if (typeof payload !== "object" || payload === null) return [];
  const stated = (payload as Record<string, unknown>)["m"];
  if (!Array.isArray(stated)) return [];
  return stated.filter((message): message is string => typeof message === "string");
}

export type BattleWrapOptions = {
  /**
   * Told when our own reading throws, so a failure is visible somewhere. It must
   * not throw itself; if it does, the error is swallowed here rather than
   * travelling into the game.
   */
  onReadingFailure?: ((error: unknown) => void) | undefined;
  /**
   * Called with the battle object **before** the original runs, for anything that
   * has to be read while the fight still holds the state the payload is about to
   * change. Nothing here may alter the battle object or the arguments; this is
   * the one place our code stands ahead of the game's own, and §5's promise is
   * that a fight plays out exactly as it would without us.
   *
   * ⚠️ **Its own guard, deliberately not shared with the reading below.** A
   * single `try` around both would let a throw here skip `onMessages` — so a
   * developer-facing collector failing would stop the meter counting, which is
   * the one failure mode a tool for collecting material must not have.
   */
  onBeforeOriginal?: ((battle: EngineBattle) => void) | undefined;
};

/**
 * Puts our wrapper on the battle object and hands back the function that takes
 * it off again.
 *
 * Returns a remover rather than exposing a detach that anyone can call on any
 * object: the pair that knows what was replaced is the pair that should undo it.
 */
export function setBattleWrap(
  battle: EngineBattle,
  onMessages: (messages: readonly string[], payload: unknown) => void,
  options: BattleWrapOptions = {},
): () => void {
  const existing = battle[WRAPPED_METHOD];
  // Wrapping twice would stack two layers on one function, and every promise
  // this file makes is about there being exactly one.
  if (isOurWrapper(existing)) return () => removeBattleWrap(battle);

  if (typeof existing !== "function") {
    throw new EngineBattleWrapError(
      `\`${WRAPPED_METHOD}\` is not a function on the battle object — the client changed`,
    );
  }

  const original = existing as (...args: unknown[]) => unknown;
  // Reached through the prototype in every build seen so far. Restoring by
  // assignment would leave an own property shadowing the class for the life of
  // the page, on an object belonging to the game.
  const wasOwnProperty = Object.prototype.hasOwnProperty.call(battle, WRAPPED_METHOD);

  /**
   * The catches below are deliberately broad — the only two in this repository
   * that are. Narrowing them would let some class of our own bugs escape into
   * the game's call stack, and an add-on that breaks the game is worse than one
   * that counts nothing (§9.6).
   */
  const handleFailure = (error: unknown): void => {
    try {
      options.onReadingFailure?.(error);
    } catch {
      // A failure reporter that fails is still not the game's problem.
    }
  };

  const wrapper: Wrapper = function (this: unknown, ...args: unknown[]): unknown {
    // Ahead of the original, because what it reads is the state the payload is
    // about to replace. Its own `try`: see `onBeforeOriginal`.
    try {
      options.onBeforeOriginal?.(battle);
    } catch (error) {
      handleFailure(error);
    }
    // The original goes next and its value is what the caller gets. Our reading
    // happens in between and can change neither.
    const result = original.apply(this, args);
    try {
      onMessages(getMessagesFromPayload(args[0]), args[0]);
    } catch (error) {
      handleFailure(error);
    }
    return result;
  };
  wrapper[WRAP_MARKER] = WRAP_VERSION;

  battle[WRAPPED_METHOD] = wrapper;
  ORIGINALS.set(battle, { original, wasOwnProperty });
  return () => removeBattleWrap(battle);
}

/**
 * What was there before we arrived, keyed by the object we changed.
 *
 * A `WeakMap` so that a battle object the game has finished with is not kept
 * alive by us — the add-on runs for as long as the tab does.
 */
const ORIGINALS = new WeakMap<EngineBattle, { original: unknown; wasOwnProperty: boolean }>();

/**
 * Takes our layer off, and only ours.
 *
 * If something else has wrapped on top since, the top layer is not ours and
 * removing it would tear out another add-on's work — so nothing happens and the
 * caller is told nothing happened. Doing it anyway is the failure mode we would
 * least like done to us.
 */
export function removeBattleWrap(battle: EngineBattle): boolean {
  if (!isOurWrapper(battle[WRAPPED_METHOD])) return false;

  const replaced = ORIGINALS.get(battle);
  if (replaced === undefined) return false;

  if (replaced.wasOwnProperty) battle[WRAPPED_METHOD] = replaced.original;
  else delete battle[WRAPPED_METHOD];

  ORIGINALS.delete(battle);
  return true;
}
