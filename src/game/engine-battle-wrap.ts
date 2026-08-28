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
import { getRecordOrArrayFromValue } from "@/libs/record.ts";

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
 * Marks our wrapper, so a second copy of the add-on can see it is not first.
 *
 * ⚠️ **The name is the contract; the value is not, and reading it as one was a
 * bug that had not gone off yet.** This used to carry a version, and the check
 * below asked `[WRAP_MARKER] === WRAP_VERSION`. The reasoning for that was about
 * *removal* — do not tear out a layer whose shape you do not know — and it is
 * correct there. Applied to *installation* it inverts: a wrapper of ours from
 * another build fails the test, "already wrapped" does not fire, and a second
 * layer goes on top of the first. Both then call the reading, and **every number
 * is counted twice**.
 *
 * It has never fired because `WRAP_VERSION` has been `1` in every shipped build.
 * The day it becomes `2` is the day anyone with both copies installed doubles
 * every figure, in the release nobody would think to look at.
 *
 * So the version survives as the marker's value and stops being load-bearing: it
 * tells whoever is reading a console which vintage is doing the reading.
 */
const WRAP_MARKER = "__margometerBattleWrap";
const WRAP_VERSION = 1;

/** The battle object as we use it: one method, and nothing else assumed. */
export type EngineBattle = Record<string, unknown>;

type Wrapper = ((...args: unknown[]) => unknown) & { [WRAP_MARKER]?: unknown };

/**
 * Whether a MargoMeter — any MargoMeter — is already on this function.
 *
 * By the marker's presence, whatever its value: a version older than ours, newer
 * than ours, or not a number at all. Every one of those is a reader that will
 * count the fight, and two readers are two counts.
 */
function hasMargoMeterWrapper(value: unknown): value is Wrapper {
  return typeof value === "function" && WRAP_MARKER in value;
}

/**
 * The field the messages arrive in, and the one that says how many there were.
 *
 * `mi` is a companion list the client itself never reads — measured on production
 * build `1786514810315`, no property access to it anywhere in the bundle. What it
 * is *for* is therefore not something we can claim. What is measured, over
 * **every** captured engine call, is that it counts the same things `m` does: it
 * is present in exactly the payloads `m` is, never without `m`, never `m` without
 * it, and `mi.length === m.length` every time. Stated over all of them rather
 * than as a count, so it stays true as recordings arrive (§3) — the count was
 * written here as 380 of 400 and was wrong within a fortnight, twice.
 *
 * That makes it a witness that can only ever **add** signal. It is read as
 * positive evidence that messages were stated, and nothing else — so losing it to
 * a rename costs a witness and can never invent an alarm.
 */
const MESSAGES_FIELD = "m";
const MESSAGE_COUNT_FIELD = "mi";

/**
 * What went wrong reading a payload, where "nothing" is a real answer.
 *
 * ⚠️ **`messages-lost` is the one this file exists for.** If the game renames
 * `m`, every payload yields no messages and the old reader said exactly what it
 * says for a payload that opened a fight — so every fight read as zero and the
 * panel drew zeroes as though they were the count.
 *
 * **A list, and the type derived from it.** A union spelled once is enough for
 * everything that *produces* a fault; it is not enough for the one reader that
 * has to take a fault back **out** of text, which is a fight read from a browser
 * store (`src/game/kept-fights.ts`) — §9.5 refuses a cast off `JSON.parse`, so
 * there has to be something to compare against at run time. The compiler still
 * counts the members.
 */
export const PAYLOAD_FAULTS = [
  "payload-not-a-record",
  "messages-not-a-list",
  "messages-lost",
] as const;

export type PayloadFault = (typeof PAYLOAD_FAULTS)[number];

export type PayloadReading = {
  /** Carried through untouched: deciding its shape is this layer's job alone. */
  payload: unknown;
  messages: readonly string[];
  fault: PayloadFault | null;
  /**
   * How many the payload said it held that we could not read.
   *
   * `null` where something was lost and nothing said how much — a fault with no
   * number is louder than a fault with a zero, and `0` here would be a figure
   * nobody wrote (§9.3). `0` means exactly "nothing was lost".
   */
  lostMessages: number | null;
};

/**
 * The payload, read for what it holds and for whether we still recognise it.
 *
 * Three states the old reader collapsed into one empty list, and the middle one
 * is normal rather than wrong:
 *
 *   the payload did not mention messages   `m` absent, `mi` absent — a minority
 *                                          of captured calls, every one of them
 *                                          a fight opening or closing. Clean.
 *   the payload carried none               `m: []`. Clean — and worth knowing
 *                                          this happens in no captured call at
 *                                          all, which is why it is not the same
 *                                          observation as the line above.
 *   we no longer recognise the payload     one of the three faults.
 *
 * Nothing is assumed about the payload beyond the two fields we came for, and a
 * fault yields whatever could still be read rather than nothing (§9.6: never
 * vanish). The messages are still returned alongside the fault.
 */
export function getPayloadReading(payload: unknown): PayloadReading {
  const record = getRecordOrArrayFromValue(payload);
  if (record === null) {
    return { payload, messages: [], fault: "payload-not-a-record", lostMessages: null };
  }

  const stated = record[MESSAGES_FIELD];
  const counted = record[MESSAGE_COUNT_FIELD];
  const statedCount = Array.isArray(counted) ? counted.length : null;

  if (stated === undefined) {
    // The whole of the rename case: nothing under the name we know, and the
    // companion list still saying how many there should have been.
    if (statedCount !== null && statedCount > 0) {
      return { payload, messages: [], fault: "messages-lost", lostMessages: statedCount };
    }
    return { payload, messages: [], fault: null, lostMessages: 0 };
  }

  if (!Array.isArray(stated)) {
    return {
      payload,
      messages: [],
      fault: "messages-not-a-list",
      lostMessages: statedCount,
    };
  }

  const messages = stated.filter((message): message is string => typeof message === "string");
  // Two independent statements of how many there were, and the loss is measured
  // against whichever saw more: `m`'s own length catches an entry that is not
  // text even where `mi` is absent, and `mi` catches a list that arrived short.
  const lost = Math.max(stated.length, statedCount ?? 0) - messages.length;
  if (lost > 0) return { payload, messages, fault: "messages-lost", lostMessages: lost };

  return { payload, messages, fault: null, lostMessages: 0 };
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

/** What `setBattleWrap` did, so the caller can say why nothing is being read. */
export type BattleWrapAttachment = {
  remove: () => void;
  /**
   * Whether a MargoMeter was already reading this fight, so this one did not.
   *
   * Told rather than inferred: a copy that decides not to read must not then
   * draw an empty panel in silence (§9.6). Its caller says so once and stops.
   */
  hasAnotherReader: boolean;
};

/**
 * Puts our wrapper on the battle object and hands back the way to take it off.
 *
 * Returns a remover rather than exposing a detach that anyone can call on any
 * object: the pair that knows what was replaced is the pair that should undo it.
 */
export function setBattleWrap(
  battle: EngineBattle,
  onPayloadRead: (reading: PayloadReading) => void,
  options: BattleWrapOptions = {},
): BattleWrapAttachment {
  const existing = battle[WRAPPED_METHOD];
  /**
   * Two guards, and the second is not covered by the first.
   *
   * A marker on the method catches the ordinary case — another copy wrapped and
   * its layer is still on top. `ORIGINALS.has` catches the compound one: **this**
   * copy already wrapped this object, and something else has since wrapped over
   * us, so the marker we would find is not ours and the method is not ours
   * either. Wrapping again there would put two of our layers in one stack with a
   * stranger's between them.
   */
  if (hasMargoMeterWrapper(existing)) {
    return { remove: () => removeBattleWrap(battle), hasAnotherReader: !ORIGINALS.has(battle) };
  }
  if (ORIGINALS.has(battle)) {
    return { remove: () => removeBattleWrap(battle), hasAnotherReader: false };
  }

  if (typeof existing !== "function") {
    throw new EngineBattleWrapError(
      `\`${WRAPPED_METHOD}\` is not a function on the battle object — the client changed`,
    );
  }

  const original = existing as (...args: unknown[]) => unknown;
  // Reached through the prototype in every build seen so far. Restoring by
  // assignment would leave an own property shadowing the class for the life of
  // the page, on an object belonging to the game.
  const prevOwnProperty = Object.prototype.hasOwnProperty.call(battle, WRAPPED_METHOD);

  /**
   * The catches below are deliberately broad, and this is the boundary §9.5's
   * exception is written for: everything under here runs **inside the game's own
   * call stack**, between the engine calling its update and getting its value
   * back. Narrowing them would let some class of our own bugs escape into that
   * stack, and an add-on that breaks the game is worse than one that counts
   * nothing (§9.6).
   *
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
      onPayloadRead(getPayloadReading(args[0]));
    } catch (error) {
      handleFailure(error);
    }
    return result;
  };
  wrapper[WRAP_MARKER] = WRAP_VERSION;

  battle[WRAPPED_METHOD] = wrapper;
  ORIGINALS.set(battle, { original, prevOwnProperty, wrapper });
  return { remove: () => removeBattleWrap(battle), hasAnotherReader: false };
}

/**
 * What was there before we arrived, keyed by the object we changed.
 *
 * A `WeakMap` so that a battle object the game has finished with is not kept
 * alive by us — the add-on runs for as long as the tab does.
 */
const ORIGINALS = new WeakMap<
  EngineBattle,
  { original: unknown; prevOwnProperty: boolean; wrapper: Wrapper }
>();

/**
 * Takes off the layer **this copy** put on, and only that one.
 *
 * If something else has wrapped on top since, the top layer is not ours and
 * removing it would tear out another add-on's work — so nothing happens and the
 * caller is told nothing happened. Doing it anyway is the failure mode we would
 * least like done to us.
 *
 * ⚠️ **By identity, not by the marker.** The marker says "a MargoMeter is here",
 * which is the right question when deciding whether to wrap and the wrong one
 * when deciding whether to remove: two copies of the *same* build carry the same
 * marker and the same version, so either one's remover would have torn out the
 * other's layer and left the game calling a function nobody owns. The wrapper
 * this copy installed is kept beside the original, and only that exact function
 * is taken off.
 */
export function removeBattleWrap(battle: EngineBattle): boolean {
  const replaced = ORIGINALS.get(battle);
  if (replaced === undefined) return false;
  if (battle[WRAPPED_METHOD] !== replaced.wrapper) return false;

  if (replaced.prevOwnProperty) battle[WRAPPED_METHOD] = replaced.original;
  else delete battle[WRAPPED_METHOD];

  ORIGINALS.delete(battle);
  return true;
}
