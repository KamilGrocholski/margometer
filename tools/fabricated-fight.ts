/**
 * A fight nobody fought: ten players against ten, which the corpus does not hold and cannot.
 *
 *     deno task fight:fabricate --out fabricated/10v10-long.json
 *     deno task fight:fabricate --per-side 1 --level 5 --rounds 8 --out fabricated/duel-low.json
 *     deno task fight:fabricate --ending fled --out fabricated/fled.json
 *     deno task fight:fabricate --closing-shouts --out fabricated/10v10-provoked.json
 *
 * ⚠️ **Not material, and never becomes it.** Every figure below was invented by the script in
 * this file, so nothing read off one of these says anything about the game. They go to
 * `fabricated/`, which git does not carry; an output path outside it is refused. The envelope and
 * warrior keys are the adapters' (N13); a message key is the decoder's, and
 * `tests/tools/fabricated-fight.test.ts` holds every one of them to it by reading the fight back.
 */

import { assert, assertExists, assertStrictEquals } from "@std/assert";
import { parseArgs } from "@std/cli";
import { normalize } from "@std/path";
import { encodeJson } from "#/libs/json-text.ts";
import { clamp } from "#/libs/number-range.ts";
import { formatInteger, parseInteger } from "#/libs/number-text.ts";
import { callForeign } from "#/libs/result.ts";
import { isOneOf, type VocabularyWord } from "#/libs/vocabulary.ts";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import {
    CHARGE_BROKEN_KEY,
    HASTE_AURA_KEY,
    HEALING_REDUCER_KEY,
    HOLYTOUCH_DECLARATION_KEY,
    HOLYTOUCH_HEAL_KEY,
    LASTHEAL_KEY,
    NAME_SEPARATOR,
    PREPARE_KEY,
    PROVOCATION_KEY,
    SKILL_ID_KEY,
    SLOW_ALL_KEY,
    STEP_KEY,
    TEXT_KEY,
    WOUND_ANNOUNCEMENT_KEY,
    WOUND_TICK_KEY,
} from "#/src/core/protocol-key.ts";
import {
    encodeProtocolMessage,
    type MessageParameter,
    type MessageSide,
} from "#/src/core/protocol-message.ts";
import { encodeHealthPercent } from "#/src/core/protocol-number.ts";
import { WARRIOR_FIELDS } from "#/src/game/engine-warrior.ts";
import { CALLS_MAXIMUM } from "#/src/game/fight-capture.ts";
import { ENVELOPE_KEYS } from "#/src/game/payload-envelope.ts";
import type { CapturedCombatant } from "#/src/game/warrior-snapshot.ts";
import { FILE_FIELD } from "#/src/runtime/fight-file.ts";
import { readDevelopmentVersion } from "./build-userscript.ts";
import { FabricatedFightError } from "./margometer-tool-error.ts";
import { WITNESS_KEYS } from "./turn-count.ts";

/**
 * How the script ends the fight: one side left standing, or an escape breaking it off. The corpus
 * carries none of the second, so the second is the only way the panel's `ucieczka` can be looked
 * at at all.
 */
export const FABRICATION_ENDING = { settled: "settled", fled: "fled" } as const;
export type FabricationEnding = VocabularyWord<typeof FABRICATION_ENDING>;

/**
 * How large a fight is, and at what level. `scale` is derived rather than asked for: every figure
 * of health the script invents is multiplied by it, so a duel at level 5 takes as many blows to
 * settle as a ten-a-side at 300 rather than ending on the first one.
 */
export interface FabricationShape {
    perSide: number;
    rounds: number;
    level: number;
    scale: number;
    ending: FabricationEnding;
    doesCloseOnShouts: boolean;
}

/** One of the cast, and where the script has left them. */
export interface FabricatedWarrior {
    id: number;
    name: string;
    side: number;
    profession: string;
    level: number;
    healthMaximum: number;
    health: number;
    statusMask: number;
    statusClearsAtRound: number;
}

/** One engine call: the payload the game would have delivered, and what rode with it. */
export interface FabricatedCall {
    index: number;
    payload: Record<string, unknown>;
    messages: string[];
    combatantsBefore: CapturedCombatant[];
    combatantsAfter: CapturedCombatant[];
}

export interface FabricatedFight {
    shape: FabricationShape;
    warriors: FabricatedWarrior[];
    calls: FabricatedCall[];
    /**
     * How many of the scripted acts a fight this long reached. A short fight walks the head of the
     * list and never sees the tail, and a reader who takes one for full coverage of
     * `docs/protocol-keys.md` reaches a wrong conclusion.
     */
    actsReached: number;
}

/** The fight as it stands while the script runs it. */
interface FabricationState {
    shape: FabricationShape;
    warriors: FabricatedWarrior[];
    calls: FabricatedCall[];
    messagesWritten: number;
    round: number;
    /**
     * The payload whose statement of the turn is not yet written, and the ordinal it will carry.
     * ⚠️ **The game states a turn one payload before the messages of it arrive** — a boundary is
     * graded from the *previous* payload's queue (`tools/turn-count.ts`), so a payload naming its
     * own actor would place every turn on the combatant who took the one before.
     */
    awaiting: Record<string, unknown> | null;
    statementOrdinal: number;
}

/** One combatant's turn: who acts, on whom, beside whom, and who else shares the side. */
interface FabricatedTurn {
    shape: FabricationShape;
    actor: FabricatedWarrior;
    target: FabricatedWarrior;
    ally: FabricatedWarrior;
    /** Everyone still standing on the actor's side, for the acts that reach a whole one. */
    side: FabricatedWarrior[];
    /** Everyone still standing against them, for the one act that names whom it holds. */
    opposing: FabricatedWarrior[];
    round: number;
    ordinal: number;
}

/**
 * What one act writes. `doesOpenTurn` is stated rather than read back: an act carrying only a
 * declaration is not a turn to `src/core/fight-statistics.ts`, so the script adds a `step` beside
 * it and the game's own numbering agrees with what the panel counts.
 */
interface FabricatedAct {
    name: string;
    doesOpenTurn: boolean;
    execute: (turn: FabricatedTurn) => string[];
}

interface FabricatedSkill {
    id: number;
    name: string;
}

interface FabricatedElement {
    raw: string;
    applied: string;
    member: string;
}

const FABRICATION_ENDINGS: readonly FabricationEnding[] = Object.values(FABRICATION_ENDING);
export const FABRICATED_DIRECTORY = "fabricated";
export const FABRICATED_WORLD = "fabricated";
/**
 * The envelope's own marks, beside `FILE_FIELD`. Three of them at three ranges — the path, these
 * fields and the stated world — because a reader who takes one of these for a recording reaches a
 * wrong conclusion and nothing in the file argues back.
 */
export const FABRICATION_FIELDS = {
    isFabricated: "isFabricated",
    fabricatedBy: "fabricatedBy",
    fabricationScript: "fabricationScript",
    fabricatedShape: "fabricatedShape",
} as const;
/**
 * The client's keys the script writes and nothing in this tree reads by an exported map: the
 * replay in `tests/tools/fabricated-fight.test.ts` holds the ones a reader takes to their reader.
 */
const CLIENT_FIELDS = {
    battleground: "battleground",
    skillsDisabled: "skills_disabled",
    skillsComboMaximum: "skills_combo_max",
    skills: "skills",
    poolTime: "poolTime",
    poolTotal: "total",
    poolMinimum: "minimum",
    poolPenalty: "penalty",
    poolLeft: "left",
    moveOpening: "start_move",
    move: "move",
    originalId: "originalId",
    nonPlayer: "npc",
    otherLevel: "oplvl",
    gender: "gender",
    gridRow: "y",
    icon: "icon",
    mana: "mana",
    energy: "energy",
    armour: "ac",
    resistanceFire: "resfire",
    resistanceFrost: "resfrost",
    resistanceLight: "reslight",
    act: "act",
    focus: "focus",
    combo: "combo",
    cooldowns: "cooldowns",
    figureNow: "cur",
    figureBonus: "bonus",
    healthMaximum: "max",
    healthNow: "cur",
    healthPercent: "hpp",
    chargeName: "name",
    chargeTurnsElapsed: "turn",
    chargeTurnsStated: "total_turns",
} as const;
/** There is one script; the shape is what a run varies about it. */
const FABRICATION_SCRIPT = "ten-a-side";
const TOOL_NAME = "tools/fabricated-fight.ts";
/** Fixed, so two runs of the same shape write the same bytes. */
const FABRICATED_AT = "2026-01-01T00:00:00.000Z";
/** Version 3's envelope: no `report`, because no add-on tallied a fight nobody fought. */
const FILE_FORMAT_VERSION = 3;
const INDENT_SPACES = 2;
const FILE_SUFFIX = ".json";
const OUTPUT_FLAG = "out";
const PER_SIDE_FLAG = "per-side";
const ROUNDS_FLAG = "rounds";
const LEVEL_FLAG = "level";
const ENDING_FLAG = "ending";
const CLOSING_SHOUTS_FLAG = "closing-shouts";
/**
 * One turn a side, which is what it takes for both shouts to be standing at the last call.
 * Exported because the guard counts the same two turns, and two spellings of it would drift.
 */
export const CLOSING_SHOUTS = 2;
const CLOSING_SHOUTS_SUFFIX = "shouts";
/** The key an escape arrives on; `docs/protocol-keys.md` says what it means and how we know. */
const FLED_KEY = "flee";
const OUTPUT_DEFAULT = `${FABRICATED_DIRECTORY}/10v10-long.json`;
const PATH_SEPARATOR = "/";

const SIDE_OURS = 1;
const SIDE_THEIRS = 2;
/** Both of them, where a walk has to reach each in turn. Read, never written (**S9**). */
const SIDES: readonly number[] = [SIDE_OURS, SIDE_THEIRS];
/** A side of ten, which with the far side is the whole a roster holds. */
const PER_SIDE_MAXIMUM = COMBATANTS_MAXIMUM / 2;
const PER_SIDE_DEFAULT = PER_SIDE_MAXIMUM;
const ROUNDS_DEFAULT = 26;
const LEVEL_DEFAULT = 92;
/** Past what the script's figures were composed for, so a level asked for carries a bound. */
const LEVEL_MAXIMUM = 500;
const OURS_ID_FIRST = 500001;
const THEIRS_ID_FIRST = 600001;
/** The six the game has, spread over ten places so every profession stands on both sides. */
const PROFESSIONS = ["w", "m", "p", "t", "h", "b", "w", "t", "m", "p"];
/** Invented, like every figure here: the client draws its cast on a grid, and this is a row. */
const GRID_PLACES = 10;
/** The queue the client draws is ten deep whatever the sides came to. */
const TURN_QUEUE_WIDTH = 10;
const LEVEL_STEP = 3;
/** Chosen so the first of a side at `LEVEL_DEFAULT` stands on 12400. */
const HEALTH_PER_LEVEL = 130;
const HEALTH_BASE = 440;
const HEALTH_STEP = 830;
const WHOLE_PERCENT = 100;
const MANA_STATED = 240;
const ENERGY_STATED = 118;
const ARMOUR_BASE = 250;

const FIGURE_RAW_BASE = 940;
/** A blow grows with the round, so the last rounds of a long fight are the ones that kill. */
const FIGURE_PER_ROUND = 46;
const FIGURE_PER_PLACE = 17;
const FIGURE_PLACES = 11;
const SMALL_PLACES = 7;
const REDUCTION_BASE = 120;
const REDUCTION_PER_PLACE = 13;
const ARMOUR_DAMAGE = 5;
/** More armour, on the blow where a critical hit and a pierce fall together. */
const ARMOUR_DAMAGE_PIERCED = 2;
/** A percentage rather than health: the share a wound was weakened by. */
const WOUND_WEAKENED_PERCENT = 50;
/** What a choice of opponent or ally moves by from one round to the next — see `lookupOpponent`. */
const CHOICE_PER_ROUND = 3;
/** How long a status the script put on somebody stands before the round clears it. */
const STATUS_ROUNDS = 4;
/** The nine the client words, so a bit past them is a bit nothing would draw. */
const STATUS_BIT_MAXIMUM = 9;

/** The elements a blow is thrown in, as the pair of keys each is stated on. */
const ELEMENTS: readonly FabricatedElement[] = [
    { raw: "+dmg", applied: "-dmg", member: "" },
    { raw: "+dmgd", applied: "-dmgd", member: "d" },
    { raw: "+dmgf", applied: "-dmgf", member: "f" },
    { raw: "+dmgc", applied: "-dmgc", member: "c" },
    { raw: "+dmgl", applied: "-dmgl", member: "l" },
    { raw: "+dmgo", applied: "-dmgo", member: "o" },
];

/**
 * The one skill the script shouts with. Only the ids `frozen/aura-turns.ts` lists under `shouts`
 * are dated as shouts, so a shout announced under any other id reaches no row of the panel at all
 * and the act would draw nothing.
 */
const SHOUT_SKILL: FabricatedSkill = { id: 25, name: "Znak wichru" };
/**
 * Skills a cast is announced under. Both the ids and the names are invented here: a skill's own
 * name is the game's prose and is not copied into this tree, and no table in this repository
 * states a side-wide duration these could have been taken from.
 */
const AURA_SKILLS: readonly FabricatedSkill[] = [
    SHOUT_SKILL,
    { id: 219, name: "Jadowita mgła" },
    { id: 285, name: "Pieczęć wytrwania" },
    { id: 206, name: "Okrzyk zbiórki" },
    { id: 291, name: "Tarcza przymierza" },
];
const PLAIN_SKILLS: readonly FabricatedSkill[] = [
    { id: 411, name: "Cios rozpędowy" },
    { id: 412, name: "Salwa igieł" },
    { id: 413, name: "Modlitwa opatrunku" },
];
const BARD_SONG = "Pieśń o dwóch rzekach";
const CHARGED_SKILL = "Nawałnica lodu";

const OUTCOME_WINNER_KEY = "winner";
const OUTCOME_LOSER_KEY = "loser";
const TURN_LOST_SEPARATOR = " - ";
/** Our own words, in the shape the decoder reads: a name, the separator, and no full stop. */
const TURN_LOST_TAIL = "tura minęła bez ruchu";
const LOOT_SENTENCE = "Skrzynia stanęła otworem.";

/**
 * Named apart from the list below, because a fight closing on shouts reaches for this one act by
 * itself and two spellings of it would drift.
 */
const SHOUT_ACT: FabricatedAct = { name: "a shout", doesOpenTurn: true, execute: executeShout };

/**
 * The script. One entry is one turn, and the fight walks this list round after round, so a key
 * stated here is stated many times over a fight rather than once where nobody would see it. A
 * fight shorter than this list reaches its head only — which is what `actsReached` reports.
 */
const ACTS: readonly FabricatedAct[] = [
    { name: "a plain blow", doesOpenTurn: true, execute: executePlainBlow },
    { name: "a critical blow", doesOpenTurn: true, execute: executeCriticalBlow },
    { name: "an off-hand critical", doesOpenTurn: true, execute: executeOffhandBlow },
    { name: "a piercing blow", doesOpenTurn: true, execute: executePiercingBlow },
    { name: "a critical pierce", doesOpenTurn: true, execute: executeCriticalPierce },
    { name: "a blow against absorption", doesOpenTurn: true, execute: executeAbsorbedBlow },
    { name: "a blow breaking armour", doesOpenTurn: true, execute: executeArmourBreakingBlow },
    { name: "a third attack", doesOpenTurn: true, execute: executeThirdAttack },
    { name: "a stunning blow", doesOpenTurn: true, execute: executeStunningBlow },
    { name: "a cursed blow", doesOpenTurn: true, execute: executeCursedBlow },
    { name: "a blow evaded", doesOpenTurn: true, execute: executeEvadedBlow },
    { name: "a wounding blow", doesOpenTurn: true, execute: executeWoundingBlow },
    { name: "a wound weakened", doesOpenTurn: true, execute: executeWeakenedWound },
    { name: "a wound off the other hand", doesOpenTurn: true, execute: executeAuxiliaryWound },
    { name: "a wound ticking", doesOpenTurn: false, execute: executeWoundTick },
    { name: "poison and fire ticking", doesOpenTurn: false, execute: executePoisonTick },
    { name: "light and anguish ticking", doesOpenTurn: false, execute: executeLightTick },
    { name: "healing oneself", doesOpenTurn: false, execute: executeHealSelf },
    { name: "healing an ally", doesOpenTurn: true, execute: executeHealAlly },
    { name: "a holy touch", doesOpenTurn: false, execute: executeHolyTouch },
    { name: "a bandage", doesOpenTurn: false, execute: executeBandage },
    { name: "healing stated by name", doesOpenTurn: true, execute: executeLastHeal },
    { name: "damage stated by name", doesOpenTurn: true, execute: executeNamedDamage },
    { name: "a blow from nobody", doesOpenTurn: false, execute: executeBlowFromNobody },
    { name: "a blow at nobody", doesOpenTurn: true, execute: executeBlowAtNobody },
    { name: "health lost between nobody", doesOpenTurn: false, execute: executeLossToNobody },
    { name: "health coming back to nobody", doesOpenTurn: false, execute: executeHealToNobody },
    { name: "healing a whole side", doesOpenTurn: true, execute: executeSideHeal },
    { name: "an aura cast", doesOpenTurn: true, execute: executeAuraCast },
    SHOUT_ACT,
    { name: "a cast on the allies", doesOpenTurn: true, execute: executeAlliesCast },
    { name: "a cast on the enemies", doesOpenTurn: true, execute: executeEnemiesCast },
    { name: "a stance", doesOpenTurn: false, execute: executeStance },
    { name: "resources declared", doesOpenTurn: false, execute: executeResources },
    { name: "buffs standing", doesOpenTurn: false, execute: executeStandingBuffs },
    { name: "legendary buffs standing", doesOpenTurn: false, execute: executeLegendaryBuffs },
    { name: "a bard's song", doesOpenTurn: true, execute: executeBardSong },
    { name: "a step", doesOpenTurn: true, execute: executeStep },
    { name: "a skill made ready", doesOpenTurn: true, execute: executePrepare },
    { name: "a turn spent on nothing", doesOpenTurn: true, execute: executeTurnLost },
    { name: "the log saying something else", doesOpenTurn: false, execute: executeLoot },
];

/**
 * ⚠️ **A shape past one of these is refused rather than asserted**: it is what a reader typed,
 * and both bounds belong to somebody else. Twenty combatants is what a roster holds
 * (`src/core/combatant-roster.ts`); two thousand calls is where collecting stops
 * (`src/game/fight-capture.ts`), and a replay asserts against it, so a longer fight writes a file
 * nothing in this repository can open.
 */
export function requireFabricationShape(
    perSide = PER_SIDE_DEFAULT,
    rounds = ROUNDS_DEFAULT,
    level = LEVEL_DEFAULT,
    ending: FabricationEnding = FABRICATION_ENDING.settled,
    doesCloseOnShouts = false,
): FabricationShape {
    if (!isShapeFigureWithin(perSide, 1, PER_SIDE_MAXIMUM)) {
        throw new FabricatedFightError(
            `${perSide} a side is not between 1 and ${PER_SIDE_MAXIMUM}, which is what a` +
                ` roster of ${COMBATANTS_MAXIMUM} holds`,
        );
    }
    if (!isShapeFigureWithin(level, 1, LEVEL_MAXIMUM)) {
        throw new FabricatedFightError(`level ${level} is not between 1 and ${LEVEL_MAXIMUM}`);
    }
    if (!isShapeFigureWithin(rounds, 1, Number.MAX_SAFE_INTEGER)) {
        throw new FabricatedFightError(`${rounds} rounds is not a round the script can run`);
    }
    const calls = perSide * 2 * rounds + 2 + (doesCloseOnShouts ? CLOSING_SHOUTS : 0);
    if (calls > CALLS_MAXIMUM) {
        throw new FabricatedFightError(
            `${perSide} a side over ${rounds} rounds comes to ${calls} calls, past the` +
                ` ${CALLS_MAXIMUM} a recording is read within`,
        );
    }
    const scale = composeHealthCeiling(level) / composeHealthCeiling(LEVEL_DEFAULT);
    assert(scale > 0, "a fight is composed at a scale above nothing");
    return { perSide, rounds, level, scale, ending, doesCloseOnShouts };
}

function isShapeFigureWithin(figure: number, minimum: number, maximum: number): boolean {
    assert(minimum <= maximum, "a figure is held between ends that do not cross");
    if (!Number.isSafeInteger(figure)) return false;
    if (figure < minimum) return false;
    return figure <= maximum;
}

/** What the first of a side stands on, which is what every other figure is scaled against. */
function composeHealthCeiling(level: number): number {
    assert(level > 0, "a level a pool is composed from is above nothing");
    const ceiling = HEALTH_PER_LEVEL * level + HEALTH_BASE;
    assert(ceiling > 0, "and a pool that came out of it holds something");
    return ceiling;
}

/** The shape as a reader writes it, which is what the envelope carries and a file is named for. */
export function formatFabricationShape(shape: FabricationShape): string {
    assert(shape.perSide > 0, "a shape that is written down fields somebody");
    assert(shape.rounds > 0, "and runs at least one round");
    const side = formatInteger(shape.perSide);
    const ending = shape.ending === FABRICATION_ENDING.settled ? "" : `-${shape.ending}`;
    const shouts = shape.doesCloseOnShouts ? `-${CLOSING_SHOUTS_SUFFIX}` : "";
    const fought = `lvl${formatInteger(shape.level)}-r${formatInteger(shape.rounds)}`;
    return `${side}v${side}-${fought}${ending}${shouts}`;
}

export function createFabricatedFight(
    shape: FabricationShape = requireFabricationShape(),
): FabricatedFight {
    const warriors = createFabricatedWarriors(shape);
    const state: FabricationState = {
        shape,
        warriors,
        calls: [],
        messagesWritten: 0,
        round: 0,
        awaiting: null,
        statementOrdinal: 1,
    };
    addOpeningCall(state);
    const turns = addFightRounds(state);
    if (shape.doesCloseOnShouts) addClosingShouts(state, turns);
    addClosingCall(state);
    assert(state.calls.length > 1, "a fabricated fight carries more than its opening");
    assert(state.calls.length <= CALLS_MAXIMUM, "and stays inside its stated bound");
    return { shape, warriors, calls: state.calls, actsReached: Math.min(turns, ACTS.length) };
}

function createFabricatedWarriors(shape: FabricationShape): FabricatedWarrior[] {
    const warriors: FabricatedWarrior[] = [];
    for (let place = 0; place < shape.perSide; place += 1) {
        warriors.push(createFabricatedWarrior(shape, SIDE_OURS, place));
        warriors.push(createFabricatedWarrior(shape, SIDE_THEIRS, place));
    }
    assertStrictEquals(warriors.length, shape.perSide * 2, "both sides are fielded in full");
    assertStrictEquals(new Set(warriors.map((one) => one.id)).size, warriors.length, "each once");
    return warriors;
}

function createFabricatedWarrior(
    shape: FabricationShape,
    side: number,
    place: number,
): FabricatedWarrior {
    assert(place >= 0, "a place on a side is never below the first");
    assert(place < shape.perSide, "and never past the number a side holds");
    const isOurs = side === SIDE_OURS;
    const named = isOurs ? place + 1 : shape.perSide + place + 1;
    const step = composeScaled(shape, HEALTH_STEP);
    const healthMaximum = composeHealthCeiling(shape.level) + place * step + (isOurs ? 0 : step);
    const profession = PROFESSIONS[place % PROFESSIONS.length];
    assertExists(profession, "every place on a side fights as one of the professions");
    return {
        id: (isOurs ? OURS_ID_FIRST : THEIRS_ID_FIRST) + place,
        name: `Gracz ${formatInteger(named)}`,
        side,
        profession,
        level: shape.level + place * LEVEL_STEP,
        healthMaximum,
        health: healthMaximum,
        statusMask: 0,
        statusClearsAtRound: 0,
    };
}

/**
 * Every figure of health or damage the script invents passes through here. At `LEVEL_DEFAULT` the
 * scale is `1` and the figure is what it was written as.
 */
function composeScaled(shape: FabricationShape, figure: number): number {
    assert(figure > 0, "a figure that is scaled is above nothing");
    assert(shape.scale > 0, "and is scaled by something above nothing");
    const scaled = Math.max(1, Math.round(figure * shape.scale));
    assert(Number.isSafeInteger(scaled), "and comes out a whole number");
    return scaled;
}

/** The client's own opening: the cast, the ground it stands on, and whose side the reader is. */
function addOpeningCall(state: FabricationState): void {
    assertStrictEquals(state.calls.length, 0, "an opening is the first call a fight carries");
    const before = encodeSnapshot(state);
    const messages = encodeOpeningDeclarations(state);
    const indexes = addMessageIndexes(state, messages);
    const payload: Record<string, unknown> = {
        [ENVELOPE_KEYS.isInit]: "1",
        [ENVELOPE_KEYS.isOnAuto]: "0",
        [CLIENT_FIELDS.battleground]: "009.jpg",
        [CLIENT_FIELDS.skillsDisabled]: [],
        [CLIENT_FIELDS.skillsComboMaximum]: [],
        [CLIENT_FIELDS.skills]: ["-1", "", "", "", "", "", "", "", "", ""],
        [ENVELOPE_KEYS.combatants]: encodeWarriorsById(state.warriors, encodeOpeningWarrior),
        [ENVELOPE_KEYS.readerSide]: SIDE_OURS,
        [ENVELOPE_KEYS.messages]: messages,
        [ENVELOPE_KEYS.messagesStated]: indexes,
        [CLIENT_FIELDS.poolTime]: {
            [CLIENT_FIELDS.poolTotal]: 120,
            [CLIENT_FIELDS.poolMinimum]: 2,
            [CLIENT_FIELDS.poolPenalty]: 5,
            [CLIENT_FIELDS.poolLeft]: 120,
        },
        [CLIENT_FIELDS.moveOpening]: 15,
        [CLIENT_FIELDS.move]: 15,
    };
    state.awaiting = payload;
    addCall(state, payload, messages, before);
}

/** What the panel would have seen of each combatant, which is the snapshot the format carries. */
function encodeSnapshot(state: FabricationState): CapturedCombatant[] {
    const taken = state.warriors.map((warrior): CapturedCombatant => ({
        id: warrior.id,
        name: warrior.name,
        team: warrior.side,
        prof: warrior.profession,
        lvl: warrior.level,
        hp: encodeHealthRecord(warrior),
        mana: MANA_STATED,
        energy: ENERGY_STATED,
        ac: encodeArmour(warrior),
    }));
    assertStrictEquals(taken.length, state.warriors.length, "a snapshot holds every combatant");
    assert(taken.length > 0, "and a fight has combatants to hold");
    return taken;
}

function encodeHealthRecord(warrior: FabricatedWarrior): Record<string, unknown> {
    assert(warrior.healthMaximum > 0, "a combatant states the maximum it stands against");
    assert(warrior.health >= 0, "and health that is never below nothing");
    return {
        [CLIENT_FIELDS.healthMaximum]: warrior.healthMaximum,
        [CLIENT_FIELDS.healthNow]: warrior.health,
        [CLIENT_FIELDS.healthPercent]: getHealthPercent(warrior),
    };
}

function getHealthPercent(warrior: FabricatedWarrior): number {
    assert(warrior.healthMaximum > 0, "a combatant has a maximum to stand against");
    const share = warrior.health * WHOLE_PERCENT / warrior.healthMaximum;
    assert(share >= 0, "a percentage of health is never below nothing");
    return clamp(share, 0, WHOLE_PERCENT);
}

function encodeArmour(warrior: FabricatedWarrior): Record<string, unknown> {
    assert(warrior.level > 0, "armour is stated for a combatant fighting at a level");
    return encodeFigureRecord(ARMOUR_BASE + warrior.level);
}

function encodeFigureRecord(figure: number): Record<string, unknown> {
    assert(Number.isSafeInteger(figure), "a figure a warrior states is a whole number");
    assert(figure >= 0, "and never below nothing");
    return { [CLIENT_FIELDS.figureNow]: figure, [CLIENT_FIELDS.figureBonus]: 0 };
}

/**
 * The one key the corpus states before anybody acts, on the side facing the reader. Written on
 * the opening because that is where the protocol writes it, and the whole script has no other
 * message that opens no turn and rides no act.
 */
function encodeOpeningDeclarations(state: FabricationState): string[] {
    const stated = state.warriors.find((one) => one.side === SIDE_THEIRS);
    assertExists(stated, "an opening declaration is made about somebody in the fight");
    return [encodeMessage(encodeSide(stated), null, [
        encodeValued("surpass_bonus_total", formatInteger(14)),
    ])];
}

/** The ordinals a payload's messages carry, which run unbroken across the whole fight. */
function addMessageIndexes(state: FabricationState, messages: readonly string[]): number[] {
    assert(messages.length > 0, "a payload that numbers messages carries some");
    const indexes: number[] = [];
    for (const written of messages) {
        assert(written.length > 0, "a message written says something");
        indexes.push(state.messagesWritten);
        state.messagesWritten += 1;
    }
    assertStrictEquals(indexes.length, messages.length, "each is numbered once, never twice");
    return indexes;
}

function encodeWarriorsById(
    warriors: readonly FabricatedWarrior[],
    encode: (warrior: FabricatedWarrior) => Record<string, unknown>,
): Record<string, unknown> {
    assert(warriors.length > 0, "a warrior map states somebody");
    const encoded: Record<string, unknown> = {};
    for (const warrior of warriors) encoded[formatInteger(warrior.id)] = encode(warrior);
    assertStrictEquals(Object.keys(encoded).length, warriors.length, "every combatant, once");
    return encoded;
}

/** The opening call's record: every field the client's own warrior map carries. */
function encodeOpeningWarrior(warrior: FabricatedWarrior): Record<string, unknown> {
    assert(warrior.level > 0, "a warrior states the level it fights at");
    assert(warrior.profession.length > 0, "and the profession it fights as");
    const encoded: Record<string, unknown> = {
        [CLIENT_FIELDS.originalId]: warrior.id,
        [WARRIOR_FIELDS.id]: warrior.id,
        [WARRIOR_FIELDS.name]: warrior.name,
        [WARRIOR_FIELDS.side]: warrior.side,
        [WARRIOR_FIELDS.profession]: warrior.profession,
        [WARRIOR_FIELDS.level]: warrior.level,
        [CLIENT_FIELDS.nonPlayer]: 0,
        [WARRIOR_FIELDS.statuses]: warrior.statusMask,
        [WARRIOR_FIELDS.health]: encodeHealthRecord(warrior),
        [CLIENT_FIELDS.otherLevel]: warrior.level,
        [CLIENT_FIELDS.gender]: warrior.side === SIDE_OURS ? "m" : "k",
        [CLIENT_FIELDS.gridRow]: warrior.id % GRID_PLACES,
        [CLIENT_FIELDS.icon]: `kuf/kuf_${warrior.profession}.gif`,
        [CLIENT_FIELDS.mana]: MANA_STATED,
        [CLIENT_FIELDS.energy]: ENERGY_STATED,
        [CLIENT_FIELDS.armour]: encodeArmour(warrior),
        [CLIENT_FIELDS.resistanceFire]: encodeFigureRecord(20),
        [CLIENT_FIELDS.resistanceFrost]: encodeFigureRecord(15),
        [CLIENT_FIELDS.resistanceLight]: encodeFigureRecord(10),
        [CLIENT_FIELDS.act]: encodeFigureRecord(30),
        [CLIENT_FIELDS.focus]: 0,
        [CLIENT_FIELDS.combo]: 0,
        [CLIENT_FIELDS.cooldowns]: warrior.id === OURS_ID_FIRST ? [[SHOUT_SKILL.id, 3]] : [],
    };
    if (warrior.id === THEIRS_ID_FIRST) {
        encoded[WARRIOR_FIELDS.charge] = {
            [CLIENT_FIELDS.chargeName]: CHARGED_SKILL,
            [CLIENT_FIELDS.chargeTurnsElapsed]: 2,
            [CLIENT_FIELDS.chargeTurnsStated]: 5,
        };
    }
    return encoded;
}

/**
 * ⚠️ **The snapshot before the call is taken before its messages are composed.** Composing one
 * moves health, so a `before` read here would be the `after` and the format's one independent
 * check on the decoder would compare a reading with itself (`captures/AGENTS.md`).
 */
function addCall(
    state: FabricationState,
    payload: Record<string, unknown>,
    messages: string[],
    before: CapturedCombatant[],
): void {
    assert(state.calls.length < CALLS_MAXIMUM, "a fabricated fight stays inside its bound");
    assertStrictEquals(before.length, state.warriors.length, "and snapshots every combatant");
    state.calls.push({
        index: state.calls.length,
        payload,
        messages,
        combatantsBefore: before,
        combatantsAfter: encodeSnapshot(state),
    });
}

/** How many turns the fight ran, which is how far down the script it reached. */
function addFightRounds(state: FabricationState): number {
    let ordinal = 0;
    for (let round = 0; round < state.shape.rounds; round += 1) {
        state.round = round;
        resetExpiredStatuses(state);
        for (const actor of state.warriors) {
            if (!isStanding(actor)) continue;
            if (isFightOver(state)) return ordinal;
            const turn = prepareTurn(state, actor, ordinal);
            if (turn === null) continue;
            const act = ACTS[ordinal % ACTS.length];
            assertExists(act, "a turn is written by an act the script names");
            addTurnCall(state, turn, act);
            ordinal += 1;
        }
    }
    assert(ordinal > 0, "a fabricated fight runs at least one turn");
    return ordinal;
}

function resetExpiredStatuses(state: FabricationState): void {
    assert(state.round >= 0, "a round is never below the first");
    for (const warrior of state.warriors) {
        if (warrior.statusMask === 0) continue;
        if (warrior.statusClearsAtRound > state.round) continue;
        warrior.statusMask = 0;
    }
    assert(state.warriors.every((one) => one.statusMask >= 0), "a mask is never below nothing");
}

function isStanding(warrior: FabricatedWarrior): boolean {
    assert(warrior.health >= 0, "health never falls below nothing");
    assert(warrior.healthMaximum > 0, "and stands against a maximum");
    return warrior.health > 0;
}

function isFightOver(state: FabricationState): boolean {
    assert(state.warriors.length > 0, "a fight that is asked about has combatants");
    if (getStandingOnSide(state, SIDE_OURS).length === 0) return true;
    return getStandingOnSide(state, SIDE_THEIRS).length === 0;
}

function getStandingOnSide(state: FabricationState, side: number): FabricatedWarrior[] {
    const standing = state.warriors.filter((one) => one.side === side && isStanding(one));
    assert(standing.length <= state.shape.perSide, "a side holds no more than it fielded");
    assert(standing.every(isStanding), "and everyone left on it is standing");
    return standing;
}

function prepareTurn(
    state: FabricationState,
    actor: FabricatedWarrior,
    ordinal: number,
): FabricatedTurn | null {
    const target = lookupOpponent(state, actor, ordinal);
    if (target === null) return null;
    const ally = getAlly(state, actor, ordinal);
    assert(ally.id > 0, "an act that names an ally names somebody");
    assert(target.id !== actor.id, "and a blow is never thrown at its own thrower");
    return {
        shape: state.shape,
        actor,
        target,
        ally,
        side: getStandingOnSide(state, actor.side),
        opposing: getStandingOnSide(state, target.side),
        round: state.round,
        ordinal,
    };
}

/**
 * ⚠️ **The round is in the choice, and it has to be.** A turn's ordinal steps by two for a given
 * side, so `ordinal % ten` reaches five of the ten and the other five end a long fight untouched.
 */
function lookupOpponent(
    state: FabricationState,
    actor: FabricatedWarrior,
    ordinal: number,
): FabricatedWarrior | null {
    const other = actor.side === SIDE_OURS ? SIDE_THEIRS : SIDE_OURS;
    const standing = getStandingOnSide(state, other);
    if (standing.length === 0) return null;
    const chosen = standing[(ordinal + state.round * CHOICE_PER_ROUND) % standing.length];
    assertExists(chosen, "a blow is thrown at somebody still standing");
    return chosen;
}

/** The actor themselves where nobody else is left: a turn is never skipped for want of a second. */
function getAlly(
    state: FabricationState,
    actor: FabricatedWarrior,
    ordinal: number,
): FabricatedWarrior {
    const beside = getStandingOnSide(state, actor.side).filter((one) => one.id !== actor.id);
    if (beside.length === 0) return actor;
    const chosen = beside[(ordinal + state.round * CHOICE_PER_ROUND) % beside.length];
    assertExists(chosen, "an act that names an ally names one still standing");
    return chosen;
}

function addTurnCall(state: FabricationState, turn: FabricatedTurn, act: FabricatedAct): void {
    assert(act.name.length > 0, "a turn is written by an act with a name");
    const before = encodeSnapshot(state);
    // An act whose figures all came out at nothing writes nothing, and the step is then the whole
    // of the turn.
    const messages = act.execute(turn);
    if (act.doesOpenTurn) assert(messages.length > 0, "an act opening a turn leaves a message");
    else messages.push(...executeStep(turn));
    const indexes = addMessageIndexes(state, messages);
    addTurnStatement(state, turn.actor);
    const payload: Record<string, unknown> = {
        [ENVELOPE_KEYS.combatants]: encodeWarriorsById(
            getStatedWarriors(state, turn),
            encodeStandingWarrior,
        ),
        [ENVELOPE_KEYS.messages]: messages,
        [ENVELOPE_KEYS.messagesStated]: indexes,
        [CLIENT_FIELDS.move]: 15,
    };
    state.awaiting = payload;
    addCall(state, payload, messages, before);
}

/** The statement the payload before this turn was waiting to make: whose turn is arriving. */
function addTurnStatement(state: FabricationState, acting: FabricatedWarrior): void {
    const awaiting = state.awaiting;
    if (awaiting === null) return;
    assert(acting.id > 0, "a statement names the combatant whose turn is arriving");
    awaiting[WITNESS_KEYS.holder] = acting.id;
    awaiting[ENVELOPE_KEYS.turnStatement] = encodeTurnQueue(state, state.statementOrdinal, acting);
    state.statementOrdinal += 1;
    assert(state.statementOrdinal > 1, "and is numbered once, never twice");
    state.awaiting = null;
}

/**
 * The queue the client draws: the holder at its least ordinal, then the nine forecast behind them.
 * `docs/turns-taken.md` grades a count against that least entry, so a queue opening on anybody
 * else would report every turn as taken by the wrong combatant.
 */
function encodeTurnQueue(
    state: FabricationState,
    ordinal: number,
    acting: FabricatedWarrior,
): Record<string, number> {
    const standing = state.warriors.filter(isStanding);
    assert(standing.length > 0, "there is somebody left to put in the queue");
    assert(ordinal > 0, "and the game numbers a turn from one upwards");
    const opens = clamp(standing.findIndex((one) => one.id === acting.id), 0, standing.length - 1);
    const queue: Record<string, number> = {};
    for (let ahead = 0; ahead < TURN_QUEUE_WIDTH; ahead += 1) {
        const chosen = standing[(opens + ahead) % standing.length];
        assertExists(chosen, "a place in the queue is somebody still standing");
        queue[formatInteger(ordinal + ahead)] = chosen.id;
    }
    assertStrictEquals(Object.keys(queue).length, TURN_QUEUE_WIDTH, "as wide as the client's");
    return queue;
}

/**
 * Whom a mid-fight payload states: the three the turn named, and everybody carrying a mask. The
 * client sends the volatile subset rather than the whole cast, and a mask that goes unstated is a
 * status the panel would still see standing after the script cleared it.
 */
function getStatedWarriors(state: FabricationState, turn: FabricatedTurn): FabricatedWarrior[] {
    const named = new Set([turn.actor.id, turn.target.id, turn.ally.id]);
    const stated = state.warriors.filter((one) => named.has(one.id) || one.statusMask !== 0);
    assert(stated.length > 0, "a payload states somebody");
    assert(stated.length <= state.warriors.length, "and no more than the cast it was built from");
    return stated;
}

/** The mid-fight record: the volatile subset, which is what the corpus carries after the first. */
function encodeStandingWarrior(warrior: FabricatedWarrior): Record<string, unknown> {
    assert(warrior.id > 0, "a warrior stated mid-fight is named by its id");
    assert(warrior.statusMask >= 0, "and by a mask that is never below nothing");
    return {
        [WARRIOR_FIELDS.id]: warrior.id,
        [WARRIOR_FIELDS.health]: encodeHealthRecord(warrior),
        [WARRIOR_FIELDS.statuses]: warrior.statusMask,
        [CLIENT_FIELDS.mana]: MANA_STATED,
        [CLIENT_FIELDS.energy]: ENERGY_STATED,
        [CLIENT_FIELDS.armour]: encodeArmour(warrior),
    };
}

/**
 * Two turns more, one a side, each spent on the shout — so the last call of the fight is one where
 * everybody still standing is held by somebody.
 *
 * ⚠️ **Where the rotation lands a shout is not a shape anybody chose.** Measured 2026-09-22 at ten
 * a side, level 92: the walk reaches this act once every 41 turns, so how many are still held at
 * the last call falls out of wherever the rounds happened to stop — 20 at 20 rounds, 10 at the
 * default 26, and nothing says so. A fixture for `PROVOKED_MAXIMUM` (`src/ui/panel-standing.ts`)
 * cannot rest on that. A side nobody is left on shouts at nobody, so a shape whose fight settles
 * before its rounds run out is refused here rather than closing on one shout.
 */
function addClosingShouts(state: FabricationState, turns: number): void {
    assert(turns > 0, "a fight closing on shouts ran turns before them");
    assert(state.calls.length > 1, "and carries the calls those turns wrote");
    // Both sides are asked before either shouts: a side with nobody left neither shouts nor is
    // shouted at, and the second of those is what a check on the shouter alone walks past.
    const wiped = SIDES.filter((side) => getStandingOnSide(state, side).length === 0);
    if (wiped.length > 0) {
        throw new FabricatedFightError(
            `nobody is left standing on side ${wiped.join(" and side ")} after` +
                ` ${state.shape.rounds} rounds, so no shout closes the fight:` +
                ` --${CLOSING_SHOUTS_FLAG} asks for a shape both sides come out of standing`,
        );
    }
    let ordinal = turns;
    for (const side of SIDES) {
        const standing = getStandingOnSide(state, side);
        const shouter = standing[standing.length - 1];
        assertExists(shouter, "a side somebody is left on has a last of them");
        const turn = prepareTurn(state, shouter, ordinal);
        assertExists(turn, "and somebody to shout at, both sides being standing");
        addTurnCall(state, turn, SHOUT_ACT);
        ordinal += 1;
    }
}

/** How the fight ends: the two sides as text, and what the log says after them. */
function addClosingCall(state: FabricationState): void {
    const last = state.warriors.find(isStanding);
    assertExists(last, "a fight ends with somebody left standing");
    assert(state.calls.length > 1, "and after the calls that got it there");
    addTurnStatement(state, last);
    const before = encodeSnapshot(state);
    const messages = state.shape.ending === FABRICATION_ENDING.fled
        ? encodeFledClosing(last)
        : encodeSettledClosing(state);
    assert(messages.length > 0, "a fight that ends says so");
    const payload: Record<string, unknown> = {
        [ENVELOPE_KEYS.isEnd]: 1,
        [ENVELOPE_KEYS.combatants]: encodeWarriorsById(state.warriors, encodeStandingWarrior),
        [ENVELOPE_KEYS.messages]: messages,
        [ENVELOPE_KEYS.messagesStated]: addMessageIndexes(state, messages),
        [CLIENT_FIELDS.move]: -1,
    };
    addCall(state, payload, messages, before);
}

/**
 * One message and nothing after it. The escape names its combatant in the actor slot, which is
 * where the client reads the name and the health percent it prints — and no side is named, no
 * experience is paid and no honour changes hands, because a fight nobody finished settles none of
 * that. Inventing a figure here would be a claim about the game.
 */
function encodeFledClosing(fled: FabricatedWarrior): string[] {
    assert(isStanding(fled), "the one who escapes is still standing");
    return [encodeMessage(encodeSide(fled), null, [encodeValueless(FLED_KEY)])];
}

/** The two sides named, and the spoils the winner is paid after them. */
function encodeSettledClosing(state: FabricationState): string[] {
    const won = getStandingOnSide(state, SIDE_OURS).length > 0 ? SIDE_OURS : SIDE_THEIRS;
    const lost = won === SIDE_OURS ? SIDE_THEIRS : SIDE_OURS;
    assert(getStandingOnSide(state, won).length > 0, "the side that won has somebody standing");
    return [
        encodeMessage(null, null, [encodeValued(OUTCOME_WINNER_KEY, encodeSideNames(state, won))]),
        encodeMessage(null, null, [encodeValued(OUTCOME_LOSER_KEY, encodeSideNames(state, lost))]),
        encodeMessage(null, null, [
            encodeValued("+exp", formatInteger(48310)),
            encodeValued("+ph", formatInteger(12)),
        ]),
    ];
}

function encodeSideNames(state: FabricationState, side: number): string {
    const named = state.warriors.filter((one) => one.side === side).map((one) => one.name);
    assertStrictEquals(named.length, state.shape.perSide, "a side named names all of its own");
    assert(named.every((one) => one.length > 0), "and each of them says something");
    return named.join(NAME_SEPARATOR);
}

function encodeMessage(
    actor: MessageSide | null,
    target: MessageSide | null,
    parameters: MessageParameter[],
): string {
    assert(parameters.length > 0, "a message states something after its ends");
    const written = encodeProtocolMessage({ actor, target, parameters });
    assert(written.length > 0, "and comes out as text that says something");
    return written;
}

function encodeSide(warrior: FabricatedWarrior): MessageSide {
    assert(warrior.id > 0, "a combatant a message names has an id");
    assert(warrior.name.length > 0, "and a name");
    return { combatantId: warrior.id, healthPercent: getHealthPercent(warrior) };
}

function encodeValued(key: string, value: string): MessageParameter {
    assert(key.length > 0, "a key a message states is named");
    assert(value.length > 0, "and a value stated says something");
    return { key, value };
}

function encodeValueless(key: string): MessageParameter {
    assert(key.length > 0, "a key a message states is named");
    assert(!key.includes("="), "and a valueless one carries nothing beside it");
    return { key, value: null };
}

function executePlainBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [executeBlow(turn, [])];
}

function executeCriticalBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [executeBlow(turn, [
        encodeValueless("+crit"),
        encodeFigure("+actdmg", composeSmall(turn, 4)),
        encodeFigure("-blok", composeSmallHealth(turn, 210)),
    ])];
}

function executeOffhandBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [executeBlow(turn, [
        encodeValueless("+of_crit"),
        encodeFigure("+resdmg", composeSmallHealth(turn, 31)),
        encodeFigure("+resdmgf", composeSmallHealth(turn, 29)),
        encodeFigure("+resdmgc", composeSmallHealth(turn, 23)),
        encodeFigure("+resdmgl", composeSmallHealth(turn, 19)),
    ])];
}

function executePiercingBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [executeBlow(turn, [encodeValueless("+pierce"), encodeValueless("-pierceb")])];
}

/**
 * The armour boost fires only where a critical hit and a pierce fall on the same blow, which is
 * why this act carries both. 102 blows in `captures/` carry the pair and one carries the key
 * (`docs/protocol-keys.md`).
 */
function executeCriticalPierce(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [executeBlow(turn, [
        encodeValueless("+crit"),
        encodeValueless("+pierce"),
        encodeFigure("+critpierce", composeScaled(turn.shape, ARMOUR_DAMAGE_PIERCED)),
    ])];
}

function executeAbsorbedBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [executeBlow(turn, [
        encodeFigure("-absorb", composeSmallHealth(turn, 140)),
        encodeFigure("-absorbm", composeSmallHealth(turn, 95)),
        encodeFigure("+abdest_per", composeSmall(turn, 12)),
        encodeFigure("+abmdest_per", composeSmall(turn, 9)),
    ])];
}

function executeArmourBreakingBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [executeBlow(turn, [
        encodeValueless("+acdmg_destroyed"),
        encodeFigure("-dmga", composeSmallHealth(turn, 60)),
    ])];
}

function executeThirdAttack(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [executeBlow(turn, [
        encodeFigure("+thirdatt", composeSmallHealth(turn, 260)),
        encodeFigure("-thirdatt", composeSmallHealth(turn, 190)),
    ])];
}

function executeStunningBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    setStatusBit(turn.target, 8, turn.round);
    setStatusBit(turn.target, 7, turn.round);
    return [executeBlow(turn, [
        encodeValueless("+stun"),
        encodeValueless("+stun2"),
        encodeValueless("+stun2-c"),
        encodeValueless("+stun2-d"),
        encodeValueless("+stun2-f"),
        encodeValueless("+stun2-l"),
        encodeValueless("+freeze"),
    ])];
}

function executeCursedBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [executeBlow(turn, [
        encodeValueless("+legbon_curse"),
        encodeValueless("+legbon_verycrit"),
        encodeValueless("-legbon_cleanse"),
        encodeValueless("-legbon_glare"),
    ])];
}

function executeEvadedBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [executeBlow(turn, [
        encodeValueless("-evade"),
        encodeValueless("-contra"),
        encodeValueless("-arrowblock"),
        encodeValueless("-tenacity"),
        encodeValueless(CHARGE_BROKEN_KEY),
        encodeValueless("+superspell-prevented"),
        encodeValueless("+fastarrow"),
    ])];
}

function executeWoundingBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    setStatusBit(turn.target, 0, turn.round);
    setStatusBit(turn.target, 1, turn.round);
    return [executeBlow(turn, [
        encodeValueless("+wound"),
        encodeFigure(WOUND_ANNOUNCEMENT_KEY, composeSmallHealth(turn, 120)),
    ])];
}

/**
 * The same announcement with a share stated on it, which is the form a wound something weakened
 * arrives in. `+wound` is not beside it: the client composes one sentence or the other, never
 * both (`docs/protocol-keys.md`).
 */
function executeWeakenedWound(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    setStatusBit(turn.target, 0, turn.round);
    return [executeBlow(turn, [
        encodeFigure("+woundpoison", WOUND_WEAKENED_PERCENT),
        encodeFigure("+woundfrost", WOUND_WEAKENED_PERCENT),
        encodeFigure("+woundmagic", WOUND_WEAKENED_PERCENT),
        encodeFigure("+of_woundpoison", WOUND_WEAKENED_PERCENT),
        encodeFigure("+of_woundmagic", WOUND_WEAKENED_PERCENT),
    ])];
}

/**
 * The wound an auxiliary weapon left, and `+wound` is not beside it: both occurrences in
 * `captures/` ride a blow stating this key alone (`docs/protocol-keys.md`).
 */
function executeAuxiliaryWound(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    setStatusBit(turn.target, 0, turn.round);
    return [executeBlow(turn, [encodeValueless("+of_wound")])];
}

function executeWoundTick(turn: FabricatedTurn): string[] {
    assert(turn.target.healthMaximum > 0, "a tick lands where there is a maximum");
    assert(turn.round >= 0, "and on a round the fight has reached");
    const injure = executeHealthTaken(turn, turn.target, WOUND_TICK_KEY, 175);
    const wound = executeHealthTaken(turn, turn.target, "wound", 130);
    return [injure, wound].filter((one) => one !== null);
}

function executePoisonTick(turn: FabricatedTurn): string[] {
    assert(turn.target.healthMaximum > 0, "a tick lands where there is a maximum");
    assert(turn.round >= 0, "and on a round the fight has reached");
    setStatusBit(turn.target, 3, turn.round);
    setStatusBit(turn.target, 4, turn.round);
    const poison = removeHealth(turn.target, composeSmallHealth(turn, 140));
    const stated = `${formatInteger(poison)},${formatInteger(composeSmall(turn, 14))}`;
    const ticked = poison === 0
        ? null
        : encodeHealthChange(turn.target, [encodeValued("poison", stated)]);
    const fire = executeHealthTaken(turn, turn.target, "fire", 96);
    return [ticked, fire].filter((one) => one !== null);
}

function executeLightTick(turn: FabricatedTurn): string[] {
    assert(turn.target.healthMaximum > 0, "a tick lands where there is a maximum");
    assert(turn.round >= 0, "and on a round the fight has reached");
    const light = executeHealthTaken(turn, turn.target, "light", 88);
    const anguish = removeHealth(turn.ally, composeSmallHealth(turn, 74));
    const ached = anguish === 0 ? null : encodeHealthChange(turn.ally, [
        encodeFigure("anguish", anguish),
        encodeValueless("+legbon_anguish"),
    ]);
    return [light, ached].filter((one) => one !== null);
}

function executeHealSelf(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a turn is taken by somebody still standing");
    assert(turn.actor.health <= turn.actor.healthMaximum, "and nobody stands above full");
    const restored = addHealth(turn.actor, composeSmallHealth(turn, 430));
    if (restored === 0) return [];
    return [encodeHealthChange(turn.actor, [
        encodeFigure("heal", restored),
        encodeFigure("afterheal", composeSmallHealth(turn, 18)),
    ])];
}

function executeHealAlly(turn: FabricatedTurn): string[] {
    assert(turn.ally.side === turn.actor.side, "an ally stands on the actor's own side");
    assert(turn.ally.healthMaximum > 0, "and has a maximum to be moved against");
    const hurt = lookupHurtAlly(turn);
    if (hurt === null) return [executeBlow(turn, [])];
    const given = addHealth(hurt, composeSmallHealth(turn, 640));
    return [encodeMessage(encodeSide(turn.actor), encodeSide(hurt), [
        ...encodeAnnouncement(getPlainSkill(turn)),
        encodeFigure("heal_target", given),
    ])];
}

function executeHolyTouch(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a turn is taken by somebody still standing");
    assert(turn.actor.health <= turn.actor.healthMaximum, "and nobody stands above full");
    const given = addHealth(turn.actor, composeSmallHealth(turn, 380));
    if (given === 0) return [];
    return [encodeHealthChange(turn.actor, [
        encodeValueless(HOLYTOUCH_DECLARATION_KEY),
        encodeFigure(HOLYTOUCH_HEAL_KEY, given),
    ])];
}

function executeBandage(turn: FabricatedTurn): string[] {
    assert(turn.ally.side === turn.actor.side, "an ally stands on the actor's own side");
    assert(turn.ally.healthMaximum > 0, "and has a maximum to be moved against");
    const bandaged = executeHealthGiven(turn, turn.actor, "bandage", 210);
    const carried = executeHealthGiven(turn, turn.ally, "npc_heal", 260);
    return [bandaged, carried].filter((one) => one !== null);
}

function executeLastHeal(turn: FabricatedTurn): string[] {
    assert(turn.ally.side === turn.actor.side, "an ally stands on the actor's own side");
    assert(turn.ally.healthMaximum > 0, "and has a maximum to be moved against");
    const hurt = lookupHurtAlly(turn);
    if (hurt === null) return [executeBlow(turn, [])];
    const given = addHealth(hurt, composeSmallHealth(turn, 300));
    const stated = `${formatInteger(given)},${encodeNamedText(hurt)}`;
    return [executeBlow(turn, [encodeValued(LASTHEAL_KEY, stated)])];
}

function executeNamedDamage(turn: FabricatedTurn): string[] {
    assert(turn.ally.side === turn.actor.side, "an ally stands on the actor's own side");
    assert(turn.ally.healthMaximum > 0, "and has a maximum to be moved against");
    const element = getElement(turn);
    const dealt = removeHealth(turn.ally, composeSmallHealth(turn, 340));
    const stated = `${formatInteger(dealt)},${element.member},${encodeNamedText(turn.ally)}`;
    return [executeBlow(turn, [encodeValued("+oth_dmg", stated)])];
}

/**
 * A blow the protocol states the struck end of and calls the striker nobody. The panel pins it
 * under the ranking rather than on a row, because the row it would go on is exactly the one
 * nobody named. `CONTEXT.md` calls this half-named.
 */
function executeBlowFromNobody(turn: FabricatedTurn): string[] {
    assert(turn.target.healthMaximum > 0, "a blow lands where there is a maximum");
    const element = getElement(turn);
    const raw = composeFigure(turn, FIGURE_RAW_BASE);
    const applied = removeHealth(turn.target, raw - composeReduction(turn));
    return [encodeMessage(null, encodeSide(turn.target), [
        encodeFigure(element.raw, raw),
        encodeFigure(element.applied, applied),
    ])];
}

/**
 * The other half-named shape, and a different claim: the striker is named and the struck end is
 * nobody. No health moves, because the combatant it would move on is the one left out.
 */
function executeBlowAtNobody(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a turn is taken by somebody still standing");
    const element = getElement(turn);
    const raw = composeFigure(turn, FIGURE_RAW_BASE);
    const applied = raw - composeReduction(turn);
    assert(applied >= 0, "no blow lands below nothing");
    return [encodeMessage(encodeSide(turn.actor), null, [
        encodeFigure(element.raw, raw),
        encodeFigure(element.applied, applied),
    ])];
}

/**
 * ⚠️ **Health going out with neither end named, which `captures/` does not carry.** It is charged
 * to no side — the end that would decide one is the end that is missing — so the panel draws it
 * under the ranking as a claim of its own (`CONTEXT.md`).
 */
function executeLossToNobody(turn: FabricatedTurn): string[] {
    assert(turn.round >= 0, "a tick lands on a round the fight has reached");
    const lost = composeSmallHealth(turn, 260);
    const stated = `${formatInteger(lost)},${formatInteger(composeSmall(turn, 11))}`;
    return [encodeMessage(null, null, [encodeValued("poison", stated)])];
}

/**
 * ⚠️ **Health coming back to nobody the protocol named, which `captures/` does not carry either.**
 * It reaches no row at all, so the only place it can be seen is the section under the list —
 * which is the whole of what that section is for (`develop ADR 0082`).
 */
function executeHealToNobody(turn: FabricatedTurn): string[] {
    assert(turn.round >= 0, "a movement lands on a round the fight has reached");
    const restored = composeSmallHealth(turn, 315);
    assert(restored >= 0, "health that came back never came back below nothing");
    return [encodeMessage(null, null, [encodeFigure("heal", restored)])];
}

/**
 * The share is applied to the side before the message states it, so the percentages the message
 * carries are the ones the panel will size the share against.
 */
function executeSideHeal(turn: FabricatedTurn): string[] {
    assert(turn.side.length > 0, "a cast that reaches a side reaches somebody");
    assert(turn.side.every((one) => one.side === turn.actor.side), "and only their own");
    const share = composeSmall(turn, 22);
    for (const standing of turn.side) {
        addHealth(standing, Math.round(standing.healthMaximum * share / WHOLE_PERCENT));
    }
    return [encodeMessage(encodeSide(turn.actor), null, [
        ...encodeAnnouncement(getAuraSkill(turn)),
        encodeValued("healall_per", formatInteger(share)),
        encodeFigure(HEALING_REDUCER_KEY, composeSmall(turn, 27)),
    ])];
}

function executeAuraCast(turn: FabricatedTurn): string[] {
    assert(turn.side.length > 0, "a cast that reaches a side reaches somebody");
    assert(turn.side.every((one) => one.side === turn.actor.side), "and only their own");
    return [encodeMessage(encodeSide(turn.actor), null, [
        ...encodeAnnouncement(getAuraSkill(turn)),
        encodeFigure("aura-ac_per", composeSmall(turn, 15)),
        encodeFigure("aura-resall", composeSmall(turn, 20)),
        encodeFigure(HASTE_AURA_KEY, composeSmall(turn, 11)),
        encodeFigure("aura-adddmg2_per-meele", composeSmall(turn, 8)),
        encodeValueless("sunshield_per"),
    ])];
}

/**
 * ⚠️ **The value is the characters it holds, by name.** `docs/protocol-keys.md` has it as a list
 * in the grammar `winner` uses, and a count there leaves the panel nothing to resolve against the
 * roster — so the fight draws no provocation at all, however many it shouts.
 * Every opponent still standing is named, which stays inside what the published table covers: it
 * gives the shout six characters at skill level 1 and ten at level 10, and a side here never
 * fields more than ten (`requireFabricationShape`).
 */
function executeShout(turn: FabricatedTurn): string[] {
    assert(turn.side.length > 0, "a cast that reaches a side reaches somebody");
    assert(turn.side.every((one) => one.side === turn.actor.side), "and only their own");
    assert(turn.opposing.length > 0, "and a shout names the characters it holds");
    return [encodeMessage(encodeSide(turn.actor), encodeSide(turn.target), [
        ...encodeAnnouncement(SHOUT_SKILL),
        encodeValued(PROVOCATION_KEY, turn.opposing.map((one) => one.name).join(NAME_SEPARATOR)),
        encodeFigure(SLOW_ALL_KEY, composeSmall(turn, 25)),
        encodeFigure("alllowdmg", composeSmall(turn, 16)),
    ])];
}

function executeAlliesCast(turn: FabricatedTurn): string[] {
    assert(turn.side.length > 0, "a cast that reaches a side reaches somebody");
    assert(turn.side.every((one) => one.side === turn.actor.side), "and only their own");
    return [encodeMessage(encodeSide(turn.actor), null, [
        ...encodeAnnouncement(getAuraSkill(turn)),
        encodeFigure("critval-allies", composeSmall(turn, 12)),
        encodeFigure("critmval-allies", composeSmall(turn, 10)),
        encodeValueless("removeslow-allies"),
        encodeValueless("removestun-allies"),
        encodeValueless("removedot-allies"),
        encodeFigure("heal_per-allies", composeSmall(turn, 18)),
        encodeFigure("hp_per-allies", composeSmall(turn, 9)),
    ])];
}

function executeEnemiesCast(turn: FabricatedTurn): string[] {
    assert(turn.side.length > 0, "a cast that reaches a side reaches somebody");
    assert(turn.side.every((one) => one.side === turn.actor.side), "and only their own");
    return [encodeMessage(encodeSide(turn.actor), encodeSide(turn.target), [
        ...encodeAnnouncement(getAuraSkill(turn)),
        encodeFigure("poison_lowdmg_per-enemies", composeSmall(turn, 27)),
        encodeFigure("active_decblock_per-enemies", composeSmall(turn, 19)),
        encodeFigure("-poison_lowdmg_per", composeSmall(turn, 14)),
        encodeFigure("heal_per-enemies", composeSmall(turn, 15)),
        encodeFigure("hp_per-enemies", composeSmall(turn, 7)),
    ])];
}

function executeStance(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a declaration is made by somebody still standing");
    assert(turn.ordinal >= 0, "on a turn the fight has numbered");
    return [encodeMessage(encodeSide(turn.actor), null, [
        encodeFigure("active_block_per", composeSmall(turn, 24)),
        encodeFigure("active_decblock_per", composeSmall(turn, 18)),
        encodeFigure("active_absorbdest_per", composeSmall(turn, 13)),
    ])];
}

function executeResources(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a declaration is made by somebody still standing");
    assert(turn.ordinal >= 0, "on a turn the fight has numbered");
    return [encodeMessage(encodeSide(turn.actor), null, [
        encodeFigure("mana", composeSmall(turn, 40)),
        encodeFigure("energy", composeSmall(turn, 25)),
        encodeFigure("en-regen", composeSmall(turn, 6)),
        encodeValueless("en-regen-cast"),
        encodeFigure("+engback", composeSmall(turn, 9)),
        encodeFigure("-endest", composeSmall(turn, 7)),
        encodeFigure("-manadest", composeSmall(turn, 9)),
    ])];
}

function executeStandingBuffs(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a declaration is made by somebody still standing");
    assert(turn.ordinal >= 0, "on a turn the fight has numbered");
    return [encodeMessage(encodeSide(turn.actor), null, [
        encodeFigure("+absorb", composeSmallHealth(turn, 320)),
        encodeFigure("+absorbm", composeSmallHealth(turn, 240)),
        encodeFigure("+taken_dmg", composeSmall(turn, 21)),
        encodeValueless("+spell-taken_dmg-all"),
        encodeFigure("+crush_physical", composeSmall(turn, 17)),
        encodeFigure("+rage", composeSmall(turn, 26)),
        encodeFigure("+critsa", composeSmall(turn, 11)),
    ])];
}

function executeLegendaryBuffs(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a declaration is made by somebody still standing");
    assert(turn.ordinal >= 0, "on a turn the fight has numbered");
    return [encodeMessage(encodeSide(turn.actor), null, [
        encodeFigure("-legbon_critred", composeSmall(turn, 13)),
        encodeFigure("+legbon_puncture", composeSmall(turn, 19)),
        encodeFigure("-legbon_facade", composeSmall(turn, 15)),
        encodeFigure("+critslow_per", composeSmall(turn, 23)),
        encodeFigure("+critpoison_per", composeSmall(turn, 20)),
        encodeFigure("combo-max", composeSmall(turn, 3)),
    ])];
}

/** The one announcement that carries no id, which is why nothing can date what it put on a side. */
function executeBardSong(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a song is sung by somebody still standing");
    assert(BARD_SONG.length > 0, "and is sung under a name");
    return [encodeMessage(encodeSide(turn.actor), null, [encodeValued("tcustom", BARD_SONG)])];
}

function executeStep(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a step is taken by somebody still standing");
    assert(turn.actor.id > 0, "and by somebody the payload names");
    return [encodeMessage(encodeSide(turn.actor), null, [encodeValueless(STEP_KEY)])];
}

function executePrepare(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a skill is made ready by somebody standing");
    const percent = formatInteger(clamp(composeSmall(turn, 70), 0, WHOLE_PERCENT));
    assert(CHARGED_SKILL.length > 0, "and is made ready under a name");
    return [encodeMessage(encodeSide(turn.actor), null, [
        encodeValued(PREPARE_KEY, `${CHARGED_SKILL}(${percent}%)`),
    ])];
}

function executeTurnLost(turn: FabricatedTurn): string[] {
    assert(turn.actor.name.length > 0, "a turn lost is lost by somebody named");
    assert(!TURN_LOST_TAIL.endsWith("."), "and the sentence carries no full stop");
    const sentence = `${turn.actor.name}${TURN_LOST_SEPARATOR}${TURN_LOST_TAIL}`;
    return [encodeMessage(null, null, [encodeValued(TEXT_KEY, sentence)])];
}

function executeLoot(turn: FabricatedTurn): string[] {
    assert(LOOT_SENTENCE.endsWith("."), "a line about something else ends in a stop");
    assert(turn.actor.name.length > 0, "and the turn it rides was taken by somebody");
    return [encodeMessage(null, null, [encodeValued(TEXT_KEY, LOOT_SENTENCE)])];
}

/** A blow: what it threw, what got through, and whatever the act stated beside it. */
function executeBlow(turn: FabricatedTurn, extra: MessageParameter[]): string {
    assert(turn.target.healthMaximum > 0, "a blow lands where there is a maximum");
    assert(extra.every((one) => one.key.length > 0), "and states every key beside it by name");
    const element = getElement(turn);
    const raw = composeFigure(turn, FIGURE_RAW_BASE);
    const applied = removeHealth(turn.target, raw - composeReduction(turn));
    assert(applied <= raw, "no more gets through a blow than the blow threw");
    return encodeMessage(encodeSide(turn.actor), encodeSide(turn.target), [
        encodeFigure(element.raw, raw),
        encodeFigure("+acdmg", composeScaled(turn.shape, ARMOUR_DAMAGE)),
        encodeFigure(element.applied, applied),
        ...extra,
    ]);
}

function encodeFigure(key: string, amount: number): MessageParameter {
    assert(Number.isSafeInteger(amount), "a figure a message states is a whole number");
    assert(amount >= 0, "and is never below nothing");
    return encodeValued(key, formatInteger(amount));
}

/** `Gracz 7(63.00%)` — how the protocol writes a combatant inside a value. */
function encodeNamedText(warrior: FabricatedWarrior): string {
    const percent = encodeHealthPercent(getHealthPercent(warrior));
    assert(warrior.name.length > 0, "a figure stated against a name has a name");
    assert(percent.includes("."), "and the percentage the game writes beside it");
    return `${warrior.name}(${percent}%)`;
}

/** The two halves of an announcement, which the client sends in one breath. */
function encodeAnnouncement(skill: FabricatedSkill): MessageParameter[] {
    assert(skill.name.length > 0, "an announcement names something");
    assert(skill.id > 0, "and carries the id the client sent");
    return [
        encodeValued("tspell", skill.name),
        encodeValued(SKILL_ID_KEY, formatInteger(skill.id)),
    ];
}

/** Clamped at the health left, so what the message states is what the combatant lost. */
function removeHealth(warrior: FabricatedWarrior, asked: number): number {
    assert(asked >= 0, "a figure taken is never below nothing");
    const taken = clamp(asked, 0, warrior.health);
    warrior.health -= taken;
    assert(warrior.health >= 0, "and leaves health that is never below nothing");
    return taken;
}

/** The same the other way, clamped at the maximum so nobody is restored past full. */
function addHealth(warrior: FabricatedWarrior, asked: number): number {
    assert(asked >= 0, "a figure restored is never below nothing");
    const given = clamp(asked, 0, warrior.healthMaximum - warrior.health);
    warrior.health += given;
    assert(warrior.health <= warrior.healthMaximum, "and never past the whole of it");
    return given;
}

function setStatusBit(warrior: FabricatedWarrior, bit: number, round: number): void {
    assert(bit >= 0, "a bit of the mask is never below the first");
    assert(bit < STATUS_BIT_MAXIMUM, "and never past the nine the client words");
    warrior.statusMask |= 1 << bit;
    warrior.statusClearsAtRound = round + STATUS_ROUNDS;
}

function composeFigure(turn: FabricatedTurn, base: number): number {
    assert(base > 0, "a figure is composed from a base above nothing");
    const figure = base + turn.round * FIGURE_PER_ROUND +
        turn.ordinal % FIGURE_PLACES * FIGURE_PER_PLACE;
    assert(Number.isSafeInteger(figure), "and comes out a whole number");
    return composeScaled(turn.shape, figure);
}

function composeReduction(turn: FabricatedTurn): number {
    const reduction = REDUCTION_BASE + turn.ordinal % FIGURE_PLACES * REDUCTION_PER_PLACE;
    assert(reduction > 0, "a reduction is above nothing");
    assert(reduction < FIGURE_RAW_BASE, "and never takes the whole of the blow");
    return composeScaled(turn.shape, reduction);
}

function composeSmall(turn: FabricatedTurn, base: number): number {
    assert(base > 0, "a small figure is composed from a base above nothing");
    const figure = base + turn.ordinal % SMALL_PLACES;
    assert(figure > 0, "and comes out above nothing");
    return figure;
}

/** The same, where what came out is a quantity of health rather than a percentage or a count. */
function composeSmallHealth(turn: FabricatedTurn, base: number): number {
    assert(base > 0, "a small quantity of health is composed from a base above nothing");
    return composeScaled(turn.shape, composeSmall(turn, base));
}

function getElement(turn: FabricatedTurn): FabricatedElement {
    const chosen = ELEMENTS[turn.ordinal % ELEMENTS.length];
    assertExists(chosen, "an element is chosen from the ones a blow is thrown in");
    assert(chosen.raw.length > 0, "and is stated on the key the client would have sent");
    return chosen;
}

function getAuraSkill(turn: FabricatedTurn): FabricatedSkill {
    const chosen = AURA_SKILLS[turn.ordinal % AURA_SKILLS.length];
    assertExists(chosen, "a cast names a skill the script invented a side-wide reach for");
    assert(chosen.name.length > 0, "and the announcement carrying it names it");
    return chosen;
}

function getPlainSkill(turn: FabricatedTurn): FabricatedSkill {
    const chosen = PLAIN_SKILLS[turn.ordinal % PLAIN_SKILLS.length];
    assertExists(chosen, "an announcement names a skill");
    assert(chosen.id > 0, "and states the id the client would have sent");
    return chosen;
}

/** Health moving outside a blow, stated on the combatant it happened to. */
function encodeHealthChange(warrior: FabricatedWarrior, parameters: MessageParameter[]): string {
    assert(parameters.length > 0, "a movement of health states the key it arrived on");
    assert(warrior.id > 0, "and the combatant it happened to");
    return encodeMessage(encodeSide(warrior), null, parameters);
}

/**
 * A figure taken off somebody, and the message stating it. ⚠️ **The take and the message are one
 * step.** A second take before the first message is composed states the first figure against the
 * health the second left, and the panel reads a percentage that never stood.
 */
function executeHealthTaken(
    turn: FabricatedTurn,
    warrior: FabricatedWarrior,
    key: string,
    figure: number,
): string | null {
    assert(figure > 0, "a figure taken is composed from a base above nothing");
    return encodeMovedHealth(
        warrior,
        key,
        removeHealth(warrior, composeScaled(turn.shape, figure)),
    );
}

/** The same the other way, and one step for the same reason. */
function executeHealthGiven(
    turn: FabricatedTurn,
    warrior: FabricatedWarrior,
    key: string,
    figure: number,
): string | null {
    assert(figure > 0, "a figure given is composed from a base above nothing");
    return encodeMovedHealth(warrior, key, addHealth(warrior, composeScaled(turn.shape, figure)));
}

/** A movement of health, or nothing where the figure came out at nothing. */
function encodeMovedHealth(warrior: FabricatedWarrior, key: string, moved: number): string | null {
    assert(moved >= 0, "a figure moved is never below nothing");
    assert(key.length > 0, "and names the key it arrived on");
    if (moved === 0) return null;
    return encodeHealthChange(warrior, [encodeFigure(key, moved)]);
}

/**
 * The ally with the most room. ⚠️ **A heal of nothing is not a heal** — zero is a measurement
 * (**E6**), and a script that restores nothing to somebody already full states that a bonus fired
 * and moved no health, which is a reading the panel is right to refuse. Null where the whole side
 * is at full health, and the caller throws a blow instead.
 */
function lookupHurtAlly(turn: FabricatedTurn): FabricatedWarrior | null {
    assert(turn.side.length > 0, "an ally is looked for on a side with somebody on it");
    let hurt: FabricatedWarrior | null = null;
    for (const one of turn.side) {
        if (one.health >= one.healthMaximum) continue;
        if (hurt === null) hurt = one;
        else if (one.healthMaximum - one.health > hurt.healthMaximum - hurt.health) hurt = one;
    }
    if (hurt !== null) assert(hurt.health < hurt.healthMaximum, "an ally that is healed has room");
    return hurt;
}

/** The file, marked three ways so nobody reads it as a recording. */
export function encodeFabricatedFight(fight: FabricatedFight): string {
    assert(fight.calls.length > 0, "a file is written from a fight that carries calls");
    const version = readDevelopmentVersion();
    const written = encodeJson({
        [FILE_FIELD.formatVersion]: FILE_FORMAT_VERSION,
        [FABRICATION_FIELDS.isFabricated]: true,
        [FABRICATION_FIELDS.fabricatedBy]: `${TOOL_NAME} ${version}`,
        [FABRICATION_FIELDS.fabricationScript]: FABRICATION_SCRIPT,
        [FABRICATION_FIELDS.fabricatedShape]: formatFabricationShape(fight.shape),
        [FILE_FIELD.addOnVersion]: version,
        [FILE_FIELD.capturedAt]: FABRICATED_AT,
        [FILE_FIELD.world]: FABRICATED_WORLD,
        [FILE_FIELD.gameBuild]: null,
        [FILE_FIELD.userAgent]: null,
        [FILE_FIELD.droppedCalls]: 0,
        [FILE_FIELD.isTruncated]: false,
        [FILE_FIELD.calls]: fight.calls.map((call) => ({
            [FILE_FIELD.index]: call.index,
            [FILE_FIELD.payload]: call.payload,
            [FILE_FIELD.messages]: call.messages,
            [FILE_FIELD.combatantsBefore]: call.combatantsBefore,
            [FILE_FIELD.combatantsAfter]: call.combatantsAfter,
        })),
    }, INDENT_SPACES);
    if (!written.ok) {
        throw new FabricatedFightError(`a fabricated fight this tool cannot write as JSON`, {
            cause: written.error,
        });
    }
    return written.value;
}

/**
 * Refused outside `fabricated/`: the one outcome that must never happen is a file in evidence. The
 * path is normalised first, so `fabricated/../captures/` is read as where it leads.
 */
export function isFabricatedPath(path: string): boolean {
    assert(path.length > 0, "a path that is asked about says something");
    const normalised = normalize(path);
    assert(normalised.length > 0, "and still says something once normalised");
    return normalised.startsWith(`${FABRICATED_DIRECTORY}${PATH_SEPARATOR}`);
}

function writeFabricatedFight(path: string, text: string): void {
    assert(text.length > 0, "a file that is written carries something");
    if (!isFabricatedPath(path)) {
        throw new FabricatedFightError(`${path} is outside ${FABRICATED_DIRECTORY}/`);
    }
    if (!path.endsWith(FILE_SUFFIX)) {
        throw new FabricatedFightError(`${path} is not named as the file a reader opens it as`);
    }
    const written = callForeign(() => {
        Deno.mkdirSync(FABRICATED_DIRECTORY, { recursive: true });
        Deno.writeTextFileSync(normalize(path), text);
    });
    if (!written.ok) {
        throw new FabricatedFightError(`${path} is not a file this tool can write`, {
            cause: written.error.cause,
        });
    }
}

/** A flag as it was written down, or the default where it was not. Refused unless a number. */
function readShapeFlag(stated: string | undefined, fallback: number, flag: string): number {
    if (stated === undefined) return fallback;
    const asked = parseInteger(stated);
    if (asked === null) throw new FabricatedFightError(`--${flag} ${stated} is not a whole number`);
    return asked;
}

function readEndingFlag(stated: string | undefined): FabricationEnding {
    if (stated === undefined) return FABRICATION_ENDING.settled;
    if (isOneOf(FABRICATION_ENDINGS, stated)) return stated;
    throw new FabricatedFightError(
        `--${ENDING_FLAG} ${stated} is none of ${FABRICATION_ENDINGS.join(", ")}`,
    );
}

if (import.meta.main) {
    const parsed = parseArgs(Deno.args, {
        string: [OUTPUT_FLAG, PER_SIDE_FLAG, ROUNDS_FLAG, LEVEL_FLAG, ENDING_FLAG],
        boolean: [CLOSING_SHOUTS_FLAG],
    });
    const shape = requireFabricationShape(
        readShapeFlag(parsed[PER_SIDE_FLAG], PER_SIDE_DEFAULT, PER_SIDE_FLAG),
        readShapeFlag(parsed[ROUNDS_FLAG], ROUNDS_DEFAULT, ROUNDS_FLAG),
        readShapeFlag(parsed[LEVEL_FLAG], LEVEL_DEFAULT, LEVEL_FLAG),
        readEndingFlag(parsed[ENDING_FLAG]),
        parsed[CLOSING_SHOUTS_FLAG],
    );
    const asked = parsed[OUTPUT_FLAG];
    // A shape nobody named a path for would land on the default one and take the fight already
    // there with it, which is the one mistake a run of this tool can make that costs work.
    if (asked === undefined) {
        const isDefault =
            formatFabricationShape(shape) === formatFabricationShape(requireFabricationShape());
        if (!isDefault) {
            throw new FabricatedFightError(
                `--${OUTPUT_FLAG} is what a shape past the default is named by`,
            );
        }
    }
    const path = asked ?? OUTPUT_DEFAULT;
    const fight = createFabricatedFight(shape);
    writeFabricatedFight(path, encodeFabricatedFight(fight));
    const messages = fight.calls.reduce((sum, call) => sum + call.messages.length, 0);
    console.log(path);
    console.log(
        `${fight.warriors.length} combatants, ${shape.perSide} a side, every one a player,` +
            ` levels ${shape.level} upwards`,
    );
    console.log(`${fight.calls.length} calls, ${messages} messages`);
    console.log(`${fight.actsReached} of ${ACTS.length} scripted acts reached`);
}
