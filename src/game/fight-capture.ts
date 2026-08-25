/**
 * The fight as it happened, kept so it can be written to a file.
 *
 * This is the other direction of `tools/fight-dump-parser.ts`: that file reads
 * captured material, this one produces it. **The shape is a contract, not an
 * invention** — the text composed here is exactly what the parser already reads,
 * Polish field names and all, because that is the only way a new recording can be
 * set beside the ones already in `tests/captured-fights/`. §9.2 says the Polish
 * names stop at the reader that parses them; this is the same boundary from the
 * other side.
 *
 * ⚠️ **Nothing is redacted here, and that is the design.** The file this composes
 * carries real nicknames and the game's own ability descriptions, and it never
 * enters git. Substitution and stripping happen in the intake tool, at the moment
 * material enters the repository — so the cost is paid once, where it is
 * checkable, rather than on every recording.
 *
 * Scope is one fight: the buffer clears where the panel's own session clears, on
 * the `init` of the next fight (`isFightStart`). So the recording that is offered
 * is the one whose numbers the panel is showing.
 */

import { getIntegerFromValue } from "@/libs/number.ts";
import { composeJsonText, getValueFromJsonText } from "@/libs/json.ts";
import { getRecordOrArrayFromValue } from "@/libs/record.ts";
import { isFightStart } from "@/src/game/battle-session.ts";
import type { EngineBattle } from "@/src/game/engine-battle-wrap.ts";
import {
  WARRIOR_HEALTH_FIELD,
  WARRIOR_ID_FIELD,
  WARRIOR_LEVEL_FIELD,
  WARRIOR_NAME_FIELD,
  WARRIOR_PROFESSION_FIELD,
  WARRIOR_SIDE_FIELD,
} from "@/src/game/engine-warrior.ts";
import { USERSCRIPT_VERSION } from "@/src/userscript-version.ts";

/** The format `tools/fight-dump-parser.ts` reads. Every capture on disk carries 1. */
const CAPTURE_FORMAT_VERSION = 1;

/**
 * Where collecting stops.
 *
 * It **stops** rather than dropping the oldest, and the order is the point: a
 * recording without the start of the fight is useless, one without the end still
 * carries material. After the thinning below a fight is a few dozen calls, so
 * this is a backstop against a pathological fight, not a working limit.
 */
const MAXIMUM_CALLS = 2000;

/**
 * One combatant as the running fight holds it.
 *
 * Only the fields the existing captures carry, so material from this path and
 * material already in the repository are the same kind of thing. Everything but
 * the id stays `unknown`: it is the game's, we copy it rather than interpret it,
 * and `tools/fight-dump-parser.ts` is where it is held to a shape.
 *
 * `npc` — the only field saying who is a person — is deliberately absent, exactly
 * as it is absent from every capture on disk. It is not lost: it rides in the
 * payload's own `w`, which is recorded whole, and that is where the intake tool
 * reads it.
 */
export type CapturedCombatant = {
  id: number | null;
  name: unknown;
  team: unknown;
  prof: unknown;
  lvl: unknown;
  hp: unknown;
  mana: unknown;
  energy: unknown;
  ac: unknown;
};

export type CapturedCall = {
  index: number;
  payload: unknown;
  messages: readonly string[];
  combatantsBefore: readonly CapturedCombatant[];
  combatantsAfter: readonly CapturedCombatant[];
};

export type FightCapture = {
  calls: readonly CapturedCall[];
  /** Calls the thinning below decided carried nothing new. Written to the file. */
  droppedCalls: number;
  /** Whether the ceiling was reached, so the caller can say the tail is missing. */
  isFull: boolean;
  /** What the thinning has already seen. Carried in the value so it stays one. */
  shapesSeen: ReadonlySet<string>;
  statesSeen: ReadonlySet<string>;
};

/**
 * What a recording needs from outside the engine, injected so the whole of this
 * file is checkable without a browser — the same shape the panel takes a document.
 */
export type CaptureEnvironment = {
  getWorld: () => string;
  /** Null where the page did not say. A recording without it is not comparable. */
  getGameBuild: () => string | null;
  getCapturedAt: () => string;
  /** The same shape, and for the same reason: a browser that did not say is null. */
  getUserAgent: () => string | null;
};

/**
 * The combatants the fight is holding right now.
 *
 * ⚠️ **A claim about the game.** `Engine.battle.warriorsList` is an object keyed
 * by combatant id, and each value receives every field of the payload's own `w`
 * entry verbatim — `OneWarrior.js`: `for (var i in w) { _this[i] = w[i]; … }`.
 * Read on development build `1781609507010`, which is the readable channel, and
 * confirmed on production `1786441768914`, which is the one that decides (§7.6):
 * `this.warriorsList={}` and `Engine.battle.warriorsList` both appear there.
 *
 * `warriors` is tried after it because the client also carries a collection under
 * that name; whichever answers with named combatants first is the one used, and
 * neither being there yields an empty snapshot rather than a guess.
 *
 * Copies, never references: `hp` and `ac` are live objects the game goes on
 * mutating, so a snapshot holding the reference would show the state *after* the
 * call as the state before it. Shallow is enough — their members are numbers.
 * Not `structuredClone` of the whole combatant: it carries references to DOM
 * nodes and to the engine itself, so cloning it whole either throws or drags half
 * the game into the recording.
 */
export function composeSnapshotFromBattle(battle: EngineBattle): CapturedCombatant[] {
  for (const field of ["warriorsList", "warriors"]) {
    const collection = getRecordOrArrayFromValue(battle[field]);
    if (collection === null) continue;

    const named = Object.values(collection).filter(
      (combatant): combatant is Record<string, unknown> => {
        const named = getRecordOrArrayFromValue(combatant)?.[WARRIOR_NAME_FIELD];
        return typeof named === "string" && named !== "";
      },
    );
    if (named.length === 0) continue;

    return named.map((combatant) => ({
      id: getIntegerFromValue(combatant[WARRIOR_ID_FIELD] ?? combatant["originalId"]),
      name: combatant[WARRIOR_NAME_FIELD] ?? null,
      team: combatant[WARRIOR_SIDE_FIELD] ?? null,
      prof: combatant[WARRIOR_PROFESSION_FIELD] ?? null,
      lvl: combatant[WARRIOR_LEVEL_FIELD] ?? null,
      hp: composeShallowCopy(combatant[WARRIOR_HEALTH_FIELD]),
      mana: combatant["mana"] ?? null,
      energy: combatant["energy"] ?? null,
      ac: composeShallowCopy(combatant["ac"]),
    }));
  }
  return [];
}

function composeShallowCopy(value: unknown): unknown {
  const record = getRecordOrArrayFromValue(value);
  return record === null ? (value ?? null) : { ...record };
}

export function composeEmptyCapture(): FightCapture {
  return {
    calls: [],
    droppedCalls: 0,
    isFull: false,
    shapesSeen: new Set(),
    statesSeen: new Set(),
  };
}

/**
 * The capture as it stands after one more call.
 *
 * Rebuilt rather than mutated, like `composeNextSession` beside it, so the value
 * handed out is never one a later payload changes underneath its reader.
 *
 * **Thinned as it is collected**, by the rule the previous incarnation measured:
 * every call carrying messages is kept without exception, and so is every call
 * introducing a payload shape or a combatant state not seen before. On the first
 * real recording that dropped 565 of 569 calls — the game polls `updateData` long
 * after a fight is over — without losing information that is not in a kept call.
 */
export function composeNextCapture(
  capture: FightCapture,
  payload: unknown,
  messages: readonly string[],
  combatantsBefore: readonly CapturedCombatant[],
  combatantsAfter: readonly CapturedCombatant[],
): FightCapture {
  const previous = isFightStart(payload) ? composeEmptyCapture() : capture;
  if (previous.calls.length >= MAXIMUM_CALLS) {
    return { ...previous, isFull: true, droppedCalls: previous.droppedCalls + 1 };
  }

  const shape = composeShapeKey(payload);
  const state = composeStateKey(combatantsAfter);
  const isWorthKeeping =
    messages.length > 0 || !previous.shapesSeen.has(shape) || !previous.statesSeen.has(state);
  if (!isWorthKeeping) {
    return { ...previous, droppedCalls: previous.droppedCalls + 1 };
  }

  const call: CapturedCall = {
    index: previous.calls.length,
    // Copied, not referenced: the game goes on mutating its own payload object
    // after we return, and a recording holding the reference would show a later
    // state as this call's.
    payload: composeCopiedValue(payload),
    messages: [...messages],
    combatantsBefore: [...combatantsBefore],
    combatantsAfter: [...combatantsAfter],
  };
  return {
    calls: [...previous.calls, call],
    droppedCalls: previous.droppedCalls,
    isFull: false,
    shapesSeen: new Set([...previous.shapesSeen, shape]),
    statesSeen: new Set([...previous.statesSeen, state]),
  };
}

/** Which keys the payload carried, so a call introducing a new one is kept. */
function composeShapeKey(payload: unknown): string {
  const record = getRecordOrArrayFromValue(payload);
  return record === null ? "" : Object.keys(record).sort().join(",");
}

function composeStateKey(combatants: readonly CapturedCombatant[]): string {
  return composeJsonText(combatants);
}

/**
 * A copy that survives the game mutating what it handed us.
 *
 * Through the JSON round trip rather than `structuredClone`, because what is
 * recorded is what will be written as JSON anyway — so anything the round trip
 * cannot carry was never going to reach the file, and this way it is dropped at
 * the moment of recording rather than silently at the end.
 */
function composeCopiedValue(value: unknown): unknown {
  // `?? null` because `composeJsonText` refuses `undefined` outright, and a
  // payload field the client left out is a thing that happens rather than a
  // broken invariant.
  const { value: copied } = getValueFromJsonText(composeJsonText(value ?? null));
  return copied;
}

/**
 * The recording as the file on disk.
 *
 * The field names are the game's own Polish, because they are the format
 * `tools/fight-dump-parser.ts` reads. Indented, so a difference between two
 * recordings is something a person can read.
 *
 * Two fields the previous incarnation wrote are deliberately absent. `render` —
 * the sentences the client composed — is not collected at all: `NOTICE.md` names
 * the 38 of them in `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json`
 * as an exception that survives only because cutting them would mean editing
 * evidence, and material that never carried them needs no exception. `otwarcie` is
 * gone with the only reach into the page's DOM that `src/` ever had; nothing reads
 * it, the two captures that carried it hold null, and no recording since carries
 * the key at all. Stated as "no recording since" rather than as a count: this
 * sentence has been rewritten twice to correct that figure and invalidated by the
 * next commit both times (§3).
 *
 * **Two fields are about the reader rather than the fight**, and they are here
 * because the file arrives in a report: the button offering it says so, and a
 * recording that turns up on its own could otherwise name neither the add-on that
 * wrote it nor the browser it was written in. `dodatek` is ours and comes from
 * the constant — on an unbuilt tree that is the word `USERSCRIPT_VERSION` states
 * rather than a number that would read like a release. `przegladarka` is the
 * page's and is null where it did not say, never `""`: §9.3 keeps unknown apart
 * from a value nobody wrote. Neither is a figure, and nothing here is derived
 * from the fight — a computed number belongs in the report the copy button
 * writes, not in material (§9.2).
 */
export function composeCaptureText(
  capture: FightCapture,
  environment: CaptureEnvironment,
): string {
  return composeJsonText(
    {
      wersja: CAPTURE_FORMAT_VERSION,
      // Not `wersja`, which is the format's: this is the add-on's own, and the
      // two are different numbers that move for different reasons.
      dodatek: USERSCRIPT_VERSION,
      przy: environment.getCapturedAt(),
      swiat: environment.getWorld(),
      // Null where the page did not say, rather than a stand-in that reads like a
      // build. Nothing downstream refuses it: material from the game without the
      // client's version is not comparable with other material, which is a fact
      // about the recording that `docs/captured-fights.md` states in words rather
      // than one `tools/fight-dump-parser.ts` acts on. This comment claimed the
      // intake tool refused it by name for three releases — `composeIntakePath`
      // never looked at the field, and what actually refused was the parser, one
      // step later and everywhere at once
      // (`docs/specs/2026-08-25-a-recording-that-names-no-build.md`).
      build: environment.getGameBuild(),
      przegladarka: environment.getUserAgent(),
      pominietych: capture.droppedCalls,
      urwany: capture.isFull,
      wpisy: capture.calls.map((call) => ({
        nr: call.index,
        ladunek: call.payload,
        komunikaty: call.messages,
        wojownicyPrzed: call.combatantsBefore,
        wojownicyPo: call.combatantsAfter,
      })),
    },
    2,
  );
}

/** Names the world and the moment, so two recordings never collide in a folder. */
export function composeCaptureFileName(environment: CaptureEnvironment): string {
  const at = environment.getCapturedAt().replaceAll(":", "-").replaceAll(".", "-");
  return `margometer-${environment.getWorld()}-${at}.json`;
}
