/**
 * A finished fight, kept so a reader can go back to it.
 *
 * The panel holds one fight — the one happening now — and a new `init` resets the
 * session under it (`src/game/battle-session.ts`). This is what a fight is turned
 * into so that resetting no longer means losing it, and what it turns back into
 * when somebody opens it again
 * (`docs/specs/2026-08-26-a-fight-you-can-go-back-to.md`).
 *
 * **The inputs, never the numbers.** What is written down is what the session
 * accumulated — messages, the roster they resolve against, the side the game
 * named, the health people entered with — and restoring is the path that already
 * exists: decode, then fold. Keeping the *totals* instead would be smaller
 * (measured: 20 kB against 34 on the median recording held on 2026-08-26), and it
 * would make the aggregate's shape a storage format (§4), stop every later fix to
 * the decoder from ever reaching a fight already kept, and put two meters on one
 * screen.
 *
 * Pure, like its neighbour: a state in, a state out, and no clock, no storage and
 * no browser anywhere in it. Where a kept fight is *put* is the entry point's
 * question, because §9.1 leaves storage to the one layer allowed to reach a page.
 */

import { assert } from "@/libs/assert.ts";
import { composeJsonText, getValueFromJsonText } from "@/libs/json.ts";
import { getFiniteNumberFromValue, getIntegerFromValue } from "@/libs/number.ts";
import { getRecordFromValue } from "@/libs/record.ts";
import type { FightEntryHealth } from "@/src/core/combatant-health.ts";
import type { RosteredCombatant } from "@/src/core/combatant-roster.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import type { FightStatistics } from "@/src/core/fight-statistics.ts";
import {
  composeEmptySession,
  type BattleSession,
} from "@/src/game/battle-session.ts";
import { PAYLOAD_FAULTS, type PayloadFault } from "@/src/game/engine-battle-wrap.ts";
import type { FightPlace } from "@/src/game/engine-place.ts";
import { composeBattleRoster } from "@/src/game/engine-roster.ts";

/**
 * How the fight ended, exactly as `src/core/fight-statistics.ts` states it.
 *
 * Kept beside the tape rather than read back out of it, and it is the one derived
 * value here. Two reasons, and the second is the load-bearing one: it is a figure
 * the **protocol stated** rather than a total anything added up, and the list of
 * fights has to say how each one ended without decoding any of them. Ten fights
 * decoded to draw ten rows is 20–70 ms of somebody's page load, spent to recover
 * something already known when the fight was written down.
 *
 * Which of the two lists is the reader's own is still not decided here — §10's
 * *side* — so the panel composes the word from these names and the roster, the
 * same way it does for a live fight.
 */
export type KeptFightOutcome = NonNullable<FightStatistics["outcome"]>;

/**
 * One fight, written down.
 *
 * Everything below the identity is what `composeNextSession` had when the fight
 * ended, minus what it derives: `events`, `decodedCombatants` and `lastMessage`
 * all fall back out of `messages` and `combatants`, and `fightsStarted` counts
 * this session's fights rather than describing one.
 *
 * ⚠️ **The three gap counters are here because a restored fight must not read
 * cleaner than the live one did.** They record what never reached the decoder —
 * a payload whose shape we stopped recognising, and the messages inside it — so
 * nothing in `messages` can imply them: `messages` is what *did* arrive. Drop
 * them and a fight that lost a payload comes back with no warning on it, which
 * is §9.6's failure exactly: a number that might be wrong looking like one that
 * is right.
 */
export type KeptFight = {
  /**
   * What names this fight in a list and in a click, for as long as it is kept.
   *
   * Composed by whoever keeps it, because an identity is about the occasion and
   * not about the fight: two fights against the same opponents, on the same
   * evening, with the same roster, are two rows.
   */
  id: string;
  /** When it was written down, as the page's clock stated it. */
  keptAt: string;
  /**
   * Whether the reader asked for this one to survive the rotation.
   *
   * The whole of "saving selected fights": everything is kept up to the limit,
   * and a pin exempts one from being the oldest thing dropped. A reader who
   * forgets to press anything loses nothing they would have kept.
   */
  isPinned: boolean;
  outcome: KeptFightOutcome | null;
  messages: readonly string[];
  combatants: readonly RosteredCombatant[];
  ourSide: number | null;
  isFromFightStart: boolean;
  /**
   * ⚠️ **Copied, never re-derived.** It is a reading rather than a statement —
   * the health each combatant entered with, unwound back through the opening
   * payload's own messages (`src/core/combatant-health.ts`) — and the unwind is
   * only right against that payload's slice of events. Re-running it on restore
   * would unwind the whole fight at once, which
   * `docs/specs/2026-08-26-the-game-says-the-fight-again.md` measured drifting:
   * the baseline moves by a point and every figure sized against it moves with
   * it. Live it is taken once and never touched again; here it is copied for the
   * same reason.
   */
  entryHealthByCombatantId: FightEntryHealth;
  /**
   * Where it was fought, read when the fight opened and copied like everything
   * else here — never re-derived, because there is nothing to derive it from: the
   * messages say nothing about a map and the page has moved on.
   *
   * Null on every fight kept before this field existed, which is the reader
   * below's job to say rather than a reason to drop them.
   */
  place: FightPlace | null;
  unreadablePayloadsByFault: ReadonlyMap<PayloadFault, number>;
  lostMessages: number;
  unreadableCombatants: number;
};

/**
 * What the stored text says it is.
 *
 * A fight kept by an older build is read only where the shape still matches; a
 * number that does not match is dropped rather than migrated, because migration
 * is a promise about every past shape and this is a convenience. Bumped whenever
 * a field below changes meaning — adding one that reads as absent does not need
 * it, and the validator is what decides that.
 */
export const KEPT_FIGHTS_FORMAT = 1;

/**
 * The stored form's own field names, spelled once for the two halves that must
 * agree about them: the writer below and the reader under it.
 *
 * ⚠️ **Three of these are spelled the same as the game's own and are not the
 * game's own.** `src/game/engine-warrior.ts` owns `id` and `name` as the
 * *client's* fields, and `tests/game/engine-warrior.test.ts` holds every other
 * file in this directory to reading them through it. What is read here is the
 * roster this add-on wrote down itself, in `src/core/combatant-roster.ts`'s
 * vocabulary — the side is `side` where the client says `team`, the profession is
 * `profession` where the client says `prof` — under a fight identity that is
 * nobody's but ours.
 *
 * The distinction is `tools/fight-dump-parser.ts`'s, for the reason it gives:
 * what binds these is the format already written into somebody's browser. If the
 * client renamed a field tomorrow, following it here would make this reader
 * misread text that is already on disk — §9.2's argument, one medium along.
 */
const STORED_FIELDS = {
  format: "format",
  fights: "fights",
  id: "id",
  keptAt: "keptAt",
  isPinned: "isPinned",
  outcome: "outcome",
  messages: "messages",
  combatants: "combatants",
  ourSide: "ourSide",
  isFromFightStart: "isFromFightStart",
  entryHealth: "entryHealthByCombatantId",
  place: "place",
  placeMapName: "mapName",
  placeX: "x",
  placeY: "y",
  faults: "unreadablePayloadsByFault",
  lostMessages: "lostMessages",
  unreadableCombatants: "unreadableCombatants",
  wonNames: "wonNames",
  lostNames: "lostNames",
  isDrawn: "isDrawn",
  combatantId: "id",
  combatantName: "name",
  combatantSide: "side",
  combatantProfession: "profession",
  combatantLevel: "level",
  combatantMaximumHealth: "maximumHealth",
} as const;

/**
 * The fight as it will be written down.
 *
 * Takes the session and the outcome separately because the caller has both and
 * this file will not fold a fight to find one: the outcome is on the aggregate,
 * the aggregate costs the whole fight, and the caller is holding the reading
 * already.
 */
export function composeKeptFight(
  session: BattleSession,
  outcome: KeptFightOutcome | null,
  id: string,
  keptAt: string,
): KeptFight {
  return {
    id,
    keptAt,
    isPinned: false,
    outcome,
    messages: session.messages,
    combatants: session.combatants,
    ourSide: session.ourSide,
    isFromFightStart: session.isFromFightStart,
    entryHealthByCombatantId: session.entryHealthByCombatantId,
    place: session.place,
    unreadablePayloadsByFault: session.unreadablePayloadsByFault,
    lostMessages: session.lostMessages,
    unreadableCombatants: session.unreadableCombatants,
  };
}

/**
 * The same fight as something the rest of the add-on already knows how to read.
 *
 * Everything derived is derived here rather than stored, so a kept fight and a
 * live one cannot disagree about what a message means — `composeFightReading`
 * takes it from this point unchanged, and every screen, drill level and detail
 * card works on the result without being told which kind it is.
 *
 * ⚠️ **`fightsStarted` is zero and that is not a count of anything.** It exists
 * to tell one live fight from the next so a warning can be scoped to one (§9.6);
 * a kept fight is not in that sequence, and whoever draws one is responsible for
 * the reader's screen rather than this.
 */
export function composeSessionFromKeptFight(fight: KeptFight): BattleSession {
  const { roster } = composeBattleRoster(fight.combatants, fight.ourSide);
  return {
    ...composeEmptySession(),
    messages: fight.messages,
    combatants: fight.combatants,
    decodedCombatants: fight.combatants,
    events: decodeFight(fight.messages, roster),
    lastMessage: fight.messages[fight.messages.length - 1] ?? null,
    ourSide: fight.ourSide,
    isFromFightStart: fight.isFromFightStart,
    entryHealthByCombatantId: fight.entryHealthByCombatantId,
    place: fight.place,
    unreadablePayloadsByFault: fight.unreadablePayloadsByFault,
    lostMessages: fight.lostMessages,
    unreadableCombatants: fight.unreadableCombatants,
  };
}

/**
 * The last unpinned fight in a list that runs newest first, or nothing.
 *
 * The value rather than its index, so the two callers that drop one can do it by
 * identity — an index has to stay true across the splice that follows it, and
 * §9.5 would rather have a type that cannot be wrong than an assertion covering
 * one that can.
 */
function getOldestUnpinned(fights: readonly KeptFight[]): KeptFight | null {
  let oldest: KeptFight | null = null;
  for (const fight of fights) if (!fight.isPinned) oldest = fight;
  return oldest;
}

/**
 * What the rotation did, because two of the three outcomes are things a reader
 * has to be told about.
 *
 * A list alone would say "here is what is kept now" and leave the panel to work
 * out by subtraction whether the fight just finished is in it — which is the
 * silence §9.6 spends its length on.
 */
export type KeptFightsAfterKeeping = {
  fights: readonly KeptFight[];
  /** Ids the limit pushed out. Empty is the ordinary case. */
  dropped: readonly string[];
  /**
   * The new fight was **not** kept, because every slot the limit allows is
   * pinned.
   *
   * The reader's explicit choice beats the automatic one — dropping something
   * somebody pinned to make room for a fight they said nothing about is the one
   * behaviour that makes a pin worthless. So the new fight is refused instead,
   * and the panel says so where the consequence is.
   */
  isRefused: boolean;
};

/**
 * The kept fights after one more, newest first.
 *
 * The limit counts everything kept, pinned included, because it is the reader's
 * answer to *how much of my browser may this have* and a pin is not a licence to
 * spend more of it. What a pin buys is order: the oldest **unpinned** fight is
 * what goes, however new it is relative to a pinned one.
 *
 * ⚠️ **Zero is not a case.** It had a branch of its own that emptied the list,
 * and that branch was the one limit in either rotation where a pinned fight was
 * given up — while trimming to the same zero kept it, and keeping at *one* kept
 * it: one stated rule, two functions, opposite answers
 * (`docs/audits/2026-08-26-the-whole-tree-read-a-fifth-time.md`, F3). The loop
 * below reaches zero on its own and reaches it correctly, so the rule now holds
 * at every limit with nothing arguing an exception. What it costs is that a
 * refusal at zero hands back an unpinned list unchanged rather than emptied —
 * which is what a refusal means everywhere else in this file, and what the one
 * caller does with it either way is nothing (`src/userscript-entry.ts`).
 */
export function composeKeptFightsAfterKeeping(
  kept: readonly KeptFight[],
  fight: KeptFight,
  limit: number,
): KeptFightsAfterKeeping {
  assert(Number.isInteger(limit) && limit >= 0, "a keep limit is a whole number of fights");

  let held = [fight, ...kept.filter((other) => other.id !== fight.id)];
  const dropped: string[] = [];
  while (held.length > limit) {
    /*
     * ⚠️ **The fight being kept is not a candidate, and without that the new
     * fight evicts itself while the caller is told it was kept.** Every held
     * fight pinned, one more arriving, and the only unpinned entry in the list is
     * the newcomer at the front — so the sweep found it, dropped it, and handed
     * back a list that had not changed with `isRefused` false. Skipping the front
     * is what makes the refusal below reachable at all.
     */
    const oldestUnpinned = getOldestUnpinned(held.slice(1));
    if (oldestUnpinned === null) return { fights: kept, dropped: [], isRefused: true };
    dropped.push(oldestUnpinned.id);
    held = held.filter((other) => other !== oldestUnpinned);
  }

  return { fights: held, dropped, isRefused: false };
}

/** The same list with one fight pinned or released, and the same list where no id matches. */
export function composeKeptFightsAfterPin(
  kept: readonly KeptFight[],
  id: string,
  isPinned: boolean,
): readonly KeptFight[] {
  if (!kept.some((fight) => fight.id === id && fight.isPinned !== isPinned)) return kept;
  return kept.map((fight) => (fight.id === id ? { ...fight, isPinned } : fight));
}

/** The same list without one fight, and the same list where no id matches. */
export function composeKeptFightsAfterRemoval(
  kept: readonly KeptFight[],
  id: string,
): readonly KeptFight[] {
  if (!kept.some((fight) => fight.id === id)) return kept;
  return kept.filter((fight) => fight.id !== id);
}

/**
 * The fights as text, with every map written as pairs.
 *
 * `composeJsonText` rather than a hand-written writer, unlike the panel's
 * position beside it (`src/ui/panel-element.ts`): that one is four numbers whose
 * round trip is the whole feature, and this is a structure no hand-written writer
 * would stay correct about. What `JSON.stringify` can quietly turn into `null` —
 * a `NaN`, an infinity — is caught at the other end instead, where a figure that
 * will not read drops the fight rather than being repaired.
 */
export function composeStoredTextFromKeptFights(kept: readonly KeptFight[]): string {
  return composeJsonText({
    [STORED_FIELDS.format]: KEPT_FIGHTS_FORMAT,
    [STORED_FIELDS.fights]: kept.map((fight) => ({
      [STORED_FIELDS.id]: fight.id,
      [STORED_FIELDS.keptAt]: fight.keptAt,
      [STORED_FIELDS.isPinned]: fight.isPinned,
      [STORED_FIELDS.outcome]: fight.outcome,
      [STORED_FIELDS.messages]: fight.messages,
      [STORED_FIELDS.combatants]: fight.combatants,
      [STORED_FIELDS.ourSide]: fight.ourSide,
      [STORED_FIELDS.isFromFightStart]: fight.isFromFightStart,
      [STORED_FIELDS.entryHealth]: [...fight.entryHealthByCombatantId],
      [STORED_FIELDS.place]:
        fight.place === null
          ? null
          : {
              [STORED_FIELDS.placeMapName]: fight.place.mapName,
              [STORED_FIELDS.placeX]: fight.place.x,
              [STORED_FIELDS.placeY]: fight.place.y,
            },
      [STORED_FIELDS.faults]: [...fight.unreadablePayloadsByFault],
      [STORED_FIELDS.lostMessages]: fight.lostMessages,
      [STORED_FIELDS.unreadableCombatants]: fight.unreadableCombatants,
    })),
  });
}

/**
 * The fights a browser store was holding, or an empty list.
 *
 * §9.6: state that survives a reload is validated on read, and this is a great
 * deal more of it than a pair of coordinates. Everything here comes back from
 * text a person can edit, a browser can truncate and an older build wrote — so a
 * fight that will not read is **dropped, not repaired**. A half-read fight draws
 * numbers nobody can place, which is worse than a fight that is simply not there.
 *
 * Reading returns a value and throws nothing (§9.5); nothing here decides what an
 * empty answer means, and the caller that gets one has a panel to draw either
 * way.
 */
export function getKeptFightsFromStoredText(text: string): readonly KeptFight[] {
  const reading = getValueFromJsonText(text);
  if (reading.syntaxError !== null) return [];

  const held = getRecordFromValue(reading.value);
  if (held === null) return [];
  if (getIntegerFromValue(held[STORED_FIELDS.format]) !== KEPT_FIGHTS_FORMAT) return [];

  const fights = held[STORED_FIELDS.fights];
  if (!Array.isArray(fights)) return [];

  const read: KeptFight[] = [];
  for (const entry of fights) {
    const fight = getKeptFightFromValue(entry);
    if (fight !== null) read.push(fight);
  }
  return read;
}

function getKeptFightFromValue(value: unknown): KeptFight | null {
  const fields = getRecordFromValue(value);
  if (fields === null) return null;

  const id = fields[STORED_FIELDS.id];
  const keptAt = fields[STORED_FIELDS.keptAt];
  const isPinned = fields[STORED_FIELDS.isPinned];
  const isFromFightStart = fields[STORED_FIELDS.isFromFightStart];
  if (typeof id !== "string" || id === "" || typeof keptAt !== "string") return null;
  if (typeof isPinned !== "boolean" || typeof isFromFightStart !== "boolean") return null;

  const messages = getTextListFromValue(fields[STORED_FIELDS.messages]);
  const combatants = getCombatantsFromValue(fields[STORED_FIELDS.combatants]);
  const entryHealth = getIntegerPairsFromValue(fields[STORED_FIELDS.entryHealth]);
  const faults = getFaultPairsFromValue(fields[STORED_FIELDS.faults]);
  const lostMessages = getCountFromValue(fields[STORED_FIELDS.lostMessages]);
  const unreadableCombatants = getCountFromValue(fields[STORED_FIELDS.unreadableCombatants]);
  if (
    messages === null ||
    combatants === null ||
    entryHealth === null ||
    faults === null ||
    lostMessages === null ||
    unreadableCombatants === null
  ) {
    return null;
  }

  // Absent and unreadable stay different, the way a recording's build does
  // (`tools/fight-dump-parser.ts`): a fight the protocol never called is `null`,
  // and a value that is not an outcome is a fight we cannot read.
  const stated = fields[STORED_FIELDS.outcome];
  const outcome = stated === null || stated === undefined ? null : getOutcomeFromValue(stated);
  if (outcome === null && stated !== null && stated !== undefined) return null;

  // Absent and unreadable stay apart here too, and absent has two causes worth
  // keeping distinct in the head even though they read the same: a fight kept
  // before this field existed, and one whose page would not say where it was.
  // Neither is a reason to drop a fight; a value of the wrong shape is.
  const statedPlace = fields[STORED_FIELDS.place];
  const place =
    statedPlace === null || statedPlace === undefined ? null : getPlaceFromValue(statedPlace);
  if (place === null && statedPlace !== null && statedPlace !== undefined) return null;

  const statedSide = fields[STORED_FIELDS.ourSide];
  const ourSide = statedSide === null ? null : getIntegerFromValue(statedSide);
  if (ourSide === null && statedSide !== null) return null;

  return {
    id,
    keptAt,
    isPinned,
    outcome,
    messages,
    combatants,
    ourSide,
    isFromFightStart,
    entryHealthByCombatantId: new Map(entryHealth),
    place,
    unreadablePayloadsByFault: new Map(faults),
    lostMessages,
    unreadableCombatants,
  };
}

function getTextListFromValue(value: unknown): readonly string[] | null {
  if (!Array.isArray(value)) return null;
  for (const entry of value) if (typeof entry !== "string") return null;
  return value as readonly string[];
}

/** A count the add-on itself wrote: whole, and never below zero. */
function getCountFromValue(value: unknown): number | null {
  const count = getIntegerFromValue(value);
  return count === null || count < 0 ? null : count;
}

/**
 * A place, or null where the record is not one.
 *
 * Every member may be absent — the page answers each of them separately and a
 * map mid-load answers none (`src/game/engine-place.ts`) — so what makes this a
 * place at all is that it is a record. What it may not be is a record stating a
 * member of the wrong kind: that is text somebody edited, and §9.6 would rather
 * lose the fight than draw a map name nobody wrote.
 */
function getPlaceFromValue(value: unknown): FightPlace | null {
  const fields = getRecordFromValue(value);
  if (fields === null) return null;

  const statedName = fields[STORED_FIELDS.placeMapName];
  const statedX = fields[STORED_FIELDS.placeX];
  const statedY = fields[STORED_FIELDS.placeY];
  if (statedName !== undefined && statedName !== null && typeof statedName !== "string") return null;

  const x = isNothingStated(statedX) ? null : getIntegerFromValue(statedX);
  const y = isNothingStated(statedY) ? null : getIntegerFromValue(statedY);
  if (x === null && !isNothingStated(statedX)) return null;
  if (y === null && !isNothingStated(statedY)) return null;

  return { mapName: statedName ?? null, x, y };
}

/** The two ways a stored field says nothing, told apart from a bad value. */
function isNothingStated(value: unknown): boolean {
  return value === null || value === undefined;
}

function getOutcomeFromValue(value: unknown): KeptFightOutcome | null {
  const fields = getRecordFromValue(value);
  if (fields === null) return null;
  const wonNames = getTextListFromValue(fields[STORED_FIELDS.wonNames]);
  const lostNames = getTextListFromValue(fields[STORED_FIELDS.lostNames]);
  const isDrawn = fields[STORED_FIELDS.isDrawn];
  if (wonNames === null || lostNames === null || typeof isDrawn !== "boolean") return null;
  return { wonNames, lostNames, isDrawn };
}

function getCombatantsFromValue(value: unknown): readonly RosteredCombatant[] | null {
  if (!Array.isArray(value)) return null;
  const combatants: RosteredCombatant[] = [];
  for (const entry of value) {
    const fields = getRecordFromValue(entry);
    if (fields === null) return null;
    const id = getIntegerFromValue(fields[STORED_FIELDS.combatantId]);
    const side = getIntegerFromValue(fields[STORED_FIELDS.combatantSide]);
    const name = fields[STORED_FIELDS.combatantName];
    if (id === null || side === null || typeof name !== "string") return null;

    const profession = fields[STORED_FIELDS.combatantProfession];
    if (profession !== null && typeof profession !== "string") return null;
    const level = getNullableIntegerFromValue(fields[STORED_FIELDS.combatantLevel]);
    const maximumHealth = getNullableIntegerFromValue(
      fields[STORED_FIELDS.combatantMaximumHealth],
    );
    if (level === undefined || maximumHealth === undefined) return null;

    combatants.push({ id, name, side, profession, level, maximumHealth });
  }
  return combatants;
}

/**
 * A whole number, `null` where the field says so, and `undefined` where it says
 * something else.
 *
 * Three answers rather than two because the middle one is a real value here:
 * `null` is what the roster carries for a level or a pool the game never stated
 * (`src/core/combatant-roster.ts`), so reading it as a failure would drop every
 * fight holding a combatant the game said little about.
 */
function getNullableIntegerFromValue(value: unknown): number | null | undefined {
  if (value === null) return null;
  return getIntegerFromValue(value) ?? undefined;
}

/** Pairs of whole numbers, as a map writes itself out. */
function getIntegerPairsFromValue(value: unknown): Array<[number, number]> | null {
  if (!Array.isArray(value)) return null;
  const pairs: Array<[number, number]> = [];
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length !== 2) return null;
    const key = getIntegerFromValue(entry[0]);
    // Health unwound from a stated percentage is not always whole, so the value
    // side is read as a finite number while the id beside it stays an integer.
    const held = getFiniteNumberFromValue(entry[1]);
    if (key === null || held === null) return null;
    pairs.push([key, held]);
  }
  return pairs;
}

/**
 * The same, keyed by a fault this build still knows.
 *
 * A key we no longer recognise drops the fight rather than being counted under a
 * name nobody chose — the counters exist to say a figure may be short, and one
 * arriving under an unreadable heading says it in a way nothing can act on.
 */
function getFaultPairsFromValue(value: unknown): Array<[PayloadFault, number]> | null {
  if (!Array.isArray(value)) return null;
  const pairs: Array<[PayloadFault, number]> = [];
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length !== 2) return null;
    const fault = PAYLOAD_FAULTS.find((known) => known === entry[0]);
    const count = getCountFromValue(entry[1]);
    if (fault === undefined || count === null) return null;
    pairs.push([fault, count]);
  }
  return pairs;
}

/**
 * What a write came to, because two of the three answers are things a reader has
 * to be told about.
 */
export type KeptFightsWritten = {
  /** What is in the store now. The list handed in, where nothing had to go. */
  fights: readonly KeptFight[];
  /** Ids given up to make it fit. Empty is the ordinary case. */
  dropped: readonly string[];
  /**
   * Nothing more could be given up and the store still would not take it.
   *
   * The store is then left holding whatever it held before — no partial write
   * happens here, because the only successful write is the one this returns
   * `false` for. What the reader is owed at that point is the panel saying so,
   * not a list that quietly stopped growing (§9.6).
   */
  isRefused: boolean;
};

/**
 * Writes the fights, giving up the oldest unpinned ones until they fit.
 *
 * Two ceilings, and they answer different questions. The **budget** is ours: how
 * much of somebody's browser this add-on is willing to spend, checked before a
 * byte is written. The **refusal** is the browser's, and it is never predicted —
 * `src/userscript-storage.ts` says why no quota is assumed anywhere, and the
 * short of it is that the origin is shared with a game that does not catch one.
 *
 * ⚠️ **A pinned fight is never given up to make room, even when that means
 * writing nothing.** The reader's explicit choice beats the automatic one:
 * dropping something somebody pinned, to keep a fight they said nothing about, is
 * the one behaviour that would make a pin worthless.
 *
 * Takes the writer as an argument rather than a store, which is what keeps this
 * in `src/game/` at all — §9.1 leaves the page to the entry point, and the rule
 * being checked here is about fights.
 */
export function setKeptFightsThatFit(
  kept: readonly KeptFight[],
  budget: number,
  write: (text: string) => boolean,
): KeptFightsWritten {
  assert(Number.isInteger(budget) && budget >= 0, "a store budget is a whole number of characters");

  let held = [...kept];
  const dropped: string[] = [];
  for (;;) {
    const text = composeStoredTextFromKeptFights(held);
    if (text.length <= budget && write(text)) {
      // The list it was handed back where nothing had to go, so a caller can tell
      // by identity that the store now holds exactly what it asked for.
      return { fights: dropped.length === 0 ? kept : held, dropped, isRefused: false };
    }

    const oldestUnpinned = getOldestUnpinned(held);
    // Nothing left that may be given up — including the case where the list is
    // already empty and the store is refusing anyway, which is a browser that
    // will not take a write at all rather than one that is full.
    if (oldestUnpinned === null) return { fights: kept, dropped: [], isRefused: true };

    dropped.push(oldestUnpinned.id);
    held = held.filter((other) => other !== oldestUnpinned);
  }
}
