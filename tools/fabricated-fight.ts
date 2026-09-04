/**
 * A fight nobody fought: ten players against ten, which the corpus does not hold and cannot.
 *
 *     deno task fight:fabricate --out fabricated/10v10-long.json
 *
 * ⚠️ **Not material, and never becomes it.** Every figure below was invented by the script in
 * this file, so nothing read off one of these says anything about the game. They go to
 * `fabricated/`, which git does not carry; an output path outside it is refused.
 */

import { assert, assertExists } from "@std/assert";
import { parseArgs } from "@std/cli";
import { composeJsonWriting } from "@/libs/json-text.ts";
import { composeIntegerText } from "@/libs/number-text.ts";
import { getValueWithin } from "@/libs/number-range.ts";
import {
    composeProtocolMessage,
    type MessageParameter,
    type MessageSide,
} from "@/src/core/protocol-message.ts";
import { composeHealthPercentText } from "@/src/core/protocol-number.ts";
import {
    FIGHT_ENDS_KEY,
    FIGHT_OPENS_KEY,
    MESSAGE_INDEX_KEY,
    MESSAGES_KEY,
    READER_SIDE_KEY,
} from "@/src/game/battle-session.ts";
import { CAPTURE_FIELDS } from "@/src/game/fight-capture.ts";
import { WARRIOR_FIELDS } from "@/src/game/engine-warrior.ts";
import { getDevelopmentVersion } from "@/tools/declared-version.ts";
import { CURRENT_KEY, TURN_QUEUE_KEY } from "@/tools/turn-count.ts";
import { FabricatedFightError } from "@/tools/margometer-tool-error.ts";

/** One of the twenty, and where the script has left them. */
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
    combatantsBefore: unknown[];
    combatantsAfter: unknown[];
}

export interface FabricatedFight {
    warriors: FabricatedWarrior[];
    calls: FabricatedCall[];
}

/** The fight as it stands while the script runs it. */
interface FabricationState {
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
    actor: FabricatedWarrior;
    target: FabricatedWarrior;
    ally: FabricatedWarrior;
    /** Everyone still standing on the actor's side, for the acts that reach a whole one. */
    side: FabricatedWarrior[];
    round: number;
    ordinal: number;
}

/**
 * What one act writes. `opensTurn` is stated rather than read back: an act carrying only a
 * declaration is not a turn to `src/core/fight-statistics.ts`, so the script adds a `step` beside
 * it and the game's own numbering agrees with what the panel counts.
 */
interface FabricatedAct {
    name: string;
    opensTurn: boolean;
    compose: (turn: FabricatedTurn) => string[];
}

export const FABRICATED_DIRECTORY = "fabricated";
export const FABRICATED_WORLD = "fabricated";
/**
 * The envelope's own marks, beside `CAPTURE_FIELDS`. Three of them at three ranges — the path,
 * these fields and the stated world — because a reader who takes one of these for a recording
 * reaches a wrong conclusion and nothing in the file argues back.
 */
export const FABRICATION_FIELDS = {
    isFabricated: "isFabricated",
    fabricatedBy: "fabricatedBy",
    fabricationScript: "fabricationScript",
} as const;
const FABRICATION_SCRIPT = "ten-a-side";
const TOOL_NAME = "tools/fabricated-fight.ts";
/** Fixed, so two runs of the same script write the same bytes. */
const FABRICATED_AT = "2026-01-01T00:00:00.000Z";
const CAPTURE_FORMAT_VERSION = 3;
const INDENT_SPACES = 2;
const OUTPUT_FLAG = "out";
const DEFAULT_OUTPUT = `${FABRICATED_DIRECTORY}/10v10-long.json`;
const PATH_SEPARATOR = "/";

const SIDE_OURS = 1;
const SIDE_THEIRS = 2;
const PER_SIDE = 10;
const FIRST_ID_OURS = 500001;
const FIRST_ID_THEIRS = 600001;
/** The six the game has, spread over ten places so every profession stands on both sides. */
const PROFESSIONS = ["w", "m", "p", "t", "h", "b", "w", "t", "m", "p"];
const LEVEL_FIRST = 92;
const LEVEL_STEP = 3;
const HEALTH_FIRST = 12400;
const HEALTH_STEP = 830;
const WHOLE_PERCENT = 100;
const MAXIMUM_ROUNDS = 26;
/** Past the longest run the script can produce, so the walk carries a stated bound — **S11**. */
const MAXIMUM_CALLS = 2000;

const FIGURE_RAW_BASE = 940;
/** A blow grows with the round, so the last rounds of a long fight are the ones that kill. */
const FIGURE_PER_ROUND = 46;
const FIGURE_PER_PLACE = 17;
const FIGURE_PLACES = 11;
const REDUCTION_BASE = 120;
const REDUCTION_PER_PLACE = 13;
const ARMOUR_DAMAGE = 5;

/** The elements a blow is thrown in, as the pair of keys each is stated on. */
const ELEMENTS = [
    { raw: "+dmg", applied: "-dmg", member: "" },
    { raw: "+dmgd", applied: "-dmgd", member: "d" },
    { raw: "+dmgf", applied: "-dmgf", member: "f" },
    { raw: "+dmgc", applied: "-dmgc", member: "c" },
    { raw: "+dmgl", applied: "-dmgl", member: "l" },
    { raw: "+dmgo", applied: "-dmgo", member: "o" },
];

/**
 * Skill ids the published table states a side-wide duration for (`frozen/aura-turns.ts`), under
 * names invented here: a skill's own name is the game's prose and is not copied into this tree.
 */
const AURA_SKILLS = [
    { id: 25, name: "Znak wichru" },
    { id: 219, name: "Jadowita mgła" },
    { id: 285, name: "Pieczęć wytrwania" },
    { id: 206, name: "Okrzyk zbiórki" },
    { id: 291, name: "Tarcza przymierza" },
];
const PLAIN_SKILLS = [
    { id: 411, name: "Cios rozpędowy" },
    { id: 412, name: "Salwa igieł" },
    { id: 413, name: "Modlitwa opatrunku" },
];
const BARD_SONG = "Pieśń o dwóch rzekach";
const CHARGED_SKILL = "Nawałnica lodu";

const OUTCOME_WINNER_KEY = "winner";
const OUTCOME_LOSER_KEY = "loser";
const NAME_SEPARATOR = ", ";
const TEXT_KEY = "txt";
const TURN_LOST_SEPARATOR = " - ";
/** Our own words, in the shape the decoder reads: a name, the separator, and no full stop. */
const TURN_LOST_TAIL = "tura minęła bez ruchu";
const LOOT_SENTENCE = "Skrzynia stanęła otworem.";

export function composeFabricatedFight(): FabricatedFight {
    const warriors = composeFabricatedWarriors();
    const state: FabricationState = {
        warriors,
        calls: [],
        messagesWritten: 0,
        round: 0,
        awaiting: null,
        statementOrdinal: 1,
    };
    addOpeningCall(state);
    addFightRounds(state);
    addClosingCall(state);
    assert(state.calls.length > 1, "a fabricated fight carries more than its opening");
    assert(state.calls.length <= MAXIMUM_CALLS, "and stays inside its stated bound");
    return { warriors, calls: state.calls };
}

/** The file, marked three ways so nobody reads it as a recording. */
export function composeFabricatedCaptureText(fight: FabricatedFight): string {
    assert(fight.calls.length > 0, "a file is written from a fight that carries calls");
    const writing = composeJsonWriting({
        [CAPTURE_FIELDS.formatVersion]: CAPTURE_FORMAT_VERSION,
        [FABRICATION_FIELDS.isFabricated]: true,
        [FABRICATION_FIELDS.fabricatedBy]: `${TOOL_NAME} ${getDevelopmentVersion()}`,
        [FABRICATION_FIELDS.fabricationScript]: FABRICATION_SCRIPT,
        [CAPTURE_FIELDS.addOnVersion]: getDevelopmentVersion(),
        [CAPTURE_FIELDS.capturedAt]: FABRICATED_AT,
        [CAPTURE_FIELDS.world]: FABRICATED_WORLD,
        [CAPTURE_FIELDS.gameBuild]: null,
        [CAPTURE_FIELDS.userAgent]: null,
        [CAPTURE_FIELDS.droppedCalls]: 0,
        [CAPTURE_FIELDS.isTruncated]: false,
        [CAPTURE_FIELDS.calls]: fight.calls,
    }, INDENT_SPACES);
    if (!writing.isOk) {
        throw new FabricatedFightError("a fabricated fight this tool cannot write as JSON");
    }
    assert(writing.text.length > 0, "and text that was written says something");
    return writing.text;
}

/** Refused outside `fabricated/`: the one outcome that must never happen is a file in evidence. */
export function isFabricatedPath(path: string): boolean {
    assert(path.length > 0, "a path that is asked about says something");
    assert(!path.startsWith(PATH_SEPARATOR), "and is written from the repository root");
    return path.startsWith(`${FABRICATED_DIRECTORY}${PATH_SEPARATOR}`);
}

export function writeFabricatedFight(path: string, text: string): void {
    if (!isFabricatedPath(path)) {
        throw new FabricatedFightError(`${path} is outside ${FABRICATED_DIRECTORY}/`);
    }
    assert(text.length > 0, "a file that is written carries something");
    assert(path.endsWith(".json"), "and is written as the file a reader opens it as");
    // `Deno.mkdirSync` and `Deno.writeTextFileSync` are calls this project did not author and
    // throw a family of their own, so the catch is broad here and nowhere else — **E4**.
    try {
        Deno.mkdirSync(FABRICATED_DIRECTORY, { recursive: true });
        Deno.writeTextFileSync(path, text);
    } catch (cause) {
        throw new FabricatedFightError(`${path} is not a file this tool can write`, { cause });
    }
}

function composeWarriorAt(side: number, place: number): FabricatedWarrior {
    assert(place >= 0, "a place on a side is never below the first");
    assert(place < PER_SIDE, "and never past the ten a side holds");
    const isOurs = side === SIDE_OURS;
    const identity = (isOurs ? FIRST_ID_OURS : FIRST_ID_THEIRS) + place;
    const named = isOurs ? place + 1 : PER_SIDE + place + 1;
    const healthMaximum = HEALTH_FIRST + place * HEALTH_STEP + (isOurs ? 0 : HEALTH_STEP);
    return {
        id: identity,
        name: `Gracz ${composeIntegerText(named)}`,
        side,
        profession: PROFESSIONS[place] ?? "w",
        level: LEVEL_FIRST + place * LEVEL_STEP,
        healthMaximum,
        health: healthMaximum,
        statusMask: 0,
        statusClearsAtRound: 0,
    };
}

function composeFabricatedWarriors(): FabricatedWarrior[] {
    const warriors: FabricatedWarrior[] = [];
    for (let place = 0; place < PER_SIDE; place += 1) {
        warriors.push(composeWarriorAt(SIDE_OURS, place));
        warriors.push(composeWarriorAt(SIDE_THEIRS, place));
    }
    assert(warriors.length === PER_SIDE * 2, "a fabricated fight fields ten a side");
    assert(new Set(warriors.map((one) => one.id)).size === warriors.length, "each of them once");
    return warriors;
}

function getHealthPercent(warrior: FabricatedWarrior): number {
    assert(warrior.healthMaximum > 0, "a combatant has a maximum to stand against");
    const share = warrior.health * WHOLE_PERCENT / warrior.healthMaximum;
    assert(share >= 0, "a percentage of health is never below nothing");
    return getValueWithin(share, 0, WHOLE_PERCENT);
}

function isStanding(warrior: FabricatedWarrior): boolean {
    assert(warrior.health >= 0, "health never falls below nothing");
    assert(warrior.healthMaximum > 0, "and stands against a maximum");
    return warrior.health > 0;
}

/** Clamped at the health left, so what the message states is what the combatant lost. */
function takeHealth(warrior: FabricatedWarrior, asked: number): number {
    assert(asked >= 0, "a figure taken is never below nothing");
    const taken = getValueWithin(asked, 0, warrior.health);
    warrior.health -= taken;
    assert(warrior.health >= 0, "and leaves health that is never below nothing");
    return taken;
}

/** The same the other way, clamped at the maximum so nobody is restored past full. */
function addHealth(warrior: FabricatedWarrior, asked: number): number {
    assert(asked >= 0, "a figure restored is never below nothing");
    const room = warrior.healthMaximum - warrior.health;
    const given = getValueWithin(asked, 0, room);
    warrior.health += given;
    assert(warrior.health <= warrior.healthMaximum, "and never past the whole of it");
    return given;
}

function composeFigure(turn: FabricatedTurn, base: number): number {
    assert(base > 0, "a figure is composed from a base above nothing");
    const figure = base + turn.round * FIGURE_PER_ROUND +
        turn.ordinal % FIGURE_PLACES * FIGURE_PER_PLACE;
    assert(Number.isSafeInteger(figure), "and comes out a whole number");
    return figure;
}

function composeReduction(turn: FabricatedTurn): number {
    const reduction = REDUCTION_BASE + turn.ordinal % FIGURE_PLACES * REDUCTION_PER_PLACE;
    assert(reduction > 0, "a reduction is above nothing");
    assert(reduction < FIGURE_RAW_BASE, "and never takes the whole of the blow");
    return reduction;
}

function composeSide(warrior: FabricatedWarrior): MessageSide {
    assert(warrior.id > 0, "a combatant a message names has an id");
    assert(warrior.name.length > 0, "and a name");
    return { combatantId: warrior.id, healthPercent: getHealthPercent(warrior) };
}

function composeValued(key: string, value: string): MessageParameter {
    assert(key.length > 0, "a key a message states is named");
    assert(value.length > 0, "and a value stated says something");
    return { key, value };
}

function composeValueless(key: string): MessageParameter {
    assert(key.length > 0, "a key a message states is named");
    assert(!key.includes("="), "and a valueless one carries nothing beside it");
    return { key, value: null };
}

function composeFigureParameter(key: string, amount: number): MessageParameter {
    assert(Number.isSafeInteger(amount), "a figure a message states is a whole number");
    assert(amount >= 0, "and is never below nothing");
    return composeValued(key, composeIntegerText(amount));
}

function composeMessage(
    actor: MessageSide | null,
    target: MessageSide | null,
    parameters: MessageParameter[],
): string {
    assert(parameters.length > 0, "a message states something after its ends");
    const written = composeProtocolMessage({ actor, target, parameters });
    assert(written.length > 0, "and comes out as text that says something");
    return written;
}

/** `Gracz 7(63.00%)` — how the protocol writes a combatant inside a value. */
function composeNamedText(warrior: FabricatedWarrior): string {
    const percent = composeHealthPercentText(getHealthPercent(warrior));
    assert(warrior.name.length > 0, "a figure stated against a name has a name");
    assert(percent.includes("."), "and the percentage the game writes beside it");
    return `${warrior.name}(${percent}%)`;
}

function getElementFor(turn: FabricatedTurn): { raw: string; applied: string; member: string } {
    const chosen = ELEMENTS[turn.ordinal % ELEMENTS.length];
    assertExists(chosen, "an element is chosen from the ones a blow is thrown in");
    assert(chosen.raw.length > 0, "and is stated on the key the client would have sent");
    return chosen;
}

/** A blow: what it threw, what got through, and whatever the act stated beside it. */
function composeBlow(turn: FabricatedTurn, extra: MessageParameter[]): string {
    const element = getElementFor(turn);
    const raw = composeFigure(turn, FIGURE_RAW_BASE);
    const applied = takeHealth(turn.target, raw - composeReduction(turn));
    assert(applied <= raw, "no more gets through a blow than the blow threw");
    const parameters = [
        composeFigureParameter(element.raw, raw),
        composeFigureParameter("+acdmg", ARMOUR_DAMAGE),
        composeFigureParameter(element.applied, applied),
        ...extra,
    ];
    assert(parameters.length >= 3, "a blow states what it threw and what got through");
    return composeMessage(composeSide(turn.actor), composeSide(turn.target), parameters);
}

/** Health moving outside a blow, stated on the combatant it happened to. */
function composeHealthChange(warrior: FabricatedWarrior, parameters: MessageParameter[]): string {
    assert(parameters.length > 0, "a movement of health states the key it arrived on");
    assert(warrior.id > 0, "and the combatant it happened to");
    return composeMessage(composeSide(warrior), null, parameters);
}

function setStatusBit(warrior: FabricatedWarrior, bit: number, round: number): void {
    assert(bit >= 0, "a bit of the mask is never below the first");
    assert(bit < 9, "and never past the nine the client words");
    warrior.statusMask |= 1 << bit;
    warrior.statusClearsAtRound = round + 4;
}

/**
 * The ally with the most room. ⚠️ **A heal of nothing is a heal the panel refuses** —
 * `src/ui/panel-standing.ts` asserts a bonus that fired restored something, and a script healing
 * somebody already full states exactly that. Null where the whole side is at full health.
 */
function getHurtAllyFor(turn: FabricatedTurn): FabricatedWarrior | null {
    let hurt: FabricatedWarrior | null = null;
    for (const one of turn.side) {
        if (one.health >= one.healthMaximum) continue;
        if (hurt === null) hurt = one;
        else if (one.healthMaximum - one.health > hurt.healthMaximum - hurt.health) hurt = one;
    }
    assert(hurt === null || hurt.health < hurt.healthMaximum, "an ally that is healed has room");
    assert(turn.side.length > 0, "and stands on a side with somebody on it");
    return hurt;
}

/** A movement of health, or nothing where the figure came out at nothing. */
function composeMovedHealth(
    warrior: FabricatedWarrior,
    key: string,
    moved: number,
): string | null {
    assert(moved >= 0, "a figure moved is never below nothing");
    assert(key.length > 0, "and names the key it arrived on");
    if (moved === 0) return null;
    return composeHealthChange(warrior, [composeFigureParameter(key, moved)]);
}

function composeSmall(turn: FabricatedTurn, base: number): number {
    assert(base > 0, "a small figure is composed from a base above nothing");
    const figure = base + turn.ordinal % 7;
    assert(figure > 0, "and comes out above nothing");
    return figure;
}

function getAuraSkill(turn: FabricatedTurn): { id: number; name: string } {
    const chosen = AURA_SKILLS[turn.ordinal % AURA_SKILLS.length];
    assertExists(chosen, "a cast names a skill the table states a side-wide duration for");
    assert(chosen.name.length > 0, "and the announcement carrying it names it");
    return chosen;
}

function getPlainSkill(turn: FabricatedTurn): { id: number; name: string } {
    const chosen = PLAIN_SKILLS[turn.ordinal % PLAIN_SKILLS.length];
    assertExists(chosen, "an announcement names a skill");
    assert(chosen.id > 0, "and states the id the client would have sent");
    return chosen;
}

/** The two halves of an announcement, which the client sends in one breath. */
function composeAnnouncement(skill: { id: number; name: string }): MessageParameter[] {
    assert(skill.name.length > 0, "an announcement names something");
    assert(skill.id > 0, "and carries the id the client sent");
    return [
        composeValued("tspell", skill.name),
        composeValued("skillId", composeIntegerText(skill.id)),
    ];
}

function actPlainBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [composeBlow(turn, [])];
}

function actCriticalBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [composeBlow(turn, [
        composeValueless("+crit"),
        composeFigureParameter("-blok", composeSmall(turn, 210)),
    ])];
}

function actOffhandBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [composeBlow(turn, [
        composeValueless("+of_crit"),
        composeFigureParameter("+resdmg", composeSmall(turn, 31)),
    ])];
}

function actPiercingBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [composeBlow(turn, [composeValueless("+pierce"), composeValueless("-pierceb")])];
}

function actAbsorbedBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [composeBlow(turn, [
        composeFigureParameter("-absorb", composeSmall(turn, 140)),
        composeFigureParameter("-absorbm", composeSmall(turn, 95)),
        composeFigureParameter("+abdest_per", composeSmall(turn, 12)),
        composeFigureParameter("+abmdest_per", composeSmall(turn, 9)),
    ])];
}

function actArmourBreakingBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [composeBlow(turn, [
        composeValueless("+acdmg_destroyed"),
        composeFigureParameter("-dmga", composeSmall(turn, 60)),
    ])];
}

function actThirdAttack(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [composeBlow(turn, [
        composeFigureParameter("+thirdatt", composeSmall(turn, 260)),
        composeFigureParameter("-thirdatt", composeSmall(turn, 190)),
    ])];
}

function actStunningBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    setStatusBit(turn.target, 8, turn.round);
    setStatusBit(turn.target, 7, turn.round);
    return [composeBlow(turn, [
        composeValueless("+stun"),
        composeValueless("+stun2"),
        composeValueless("+stun2-c"),
        composeValueless("+stun2-d"),
        composeValueless("+freeze"),
    ])];
}

function actCursedBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [composeBlow(turn, [
        composeValueless("+legbon_curse"),
        composeValueless("+legbon_verycrit"),
        composeValueless("-legbon_cleanse"),
        composeValueless("-legbon_glare"),
    ])];
}

function actEvadedBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    return [composeBlow(turn, [
        composeValueless("-evade"),
        composeValueless("-contra"),
        composeValueless("-tenacity"),
        composeValueless("+superspell-dispel"),
        composeValueless("+fastarrow"),
    ])];
}

function actWoundingBlow(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a blow is thrown by somebody still standing");
    assert(turn.target.side !== turn.actor.side, "and never at its own side");
    setStatusBit(turn.target, 0, turn.round);
    setStatusBit(turn.target, 1, turn.round);
    return [composeBlow(turn, [
        composeValueless("+wound"),
        composeFigureParameter("+injure", composeSmall(turn, 120)),
    ])];
}

function actWoundTick(turn: FabricatedTurn): string[] {
    assert(turn.target.healthMaximum > 0, "a tick lands where there is a maximum");
    assert(turn.round >= 0, "and on a round the fight has reached");
    const injure = composeMovedHealth(turn.target, "injure", takeHealth(turn.target, 175));
    const wound = composeMovedHealth(turn.target, "wound", takeHealth(turn.target, 130));
    return [injure, wound].filter((one) => one !== null);
}

function actPoisonTick(turn: FabricatedTurn): string[] {
    assert(turn.target.healthMaximum > 0, "a tick lands where there is a maximum");
    assert(turn.round >= 0, "and on a round the fight has reached");
    setStatusBit(turn.target, 3, turn.round);
    setStatusBit(turn.target, 4, turn.round);
    const poison = takeHealth(turn.target, composeSmall(turn, 140));
    const stated = `${composeIntegerText(poison)},${composeIntegerText(composeSmall(turn, 14))}`;
    const ticked = poison === 0
        ? null
        : composeHealthChange(turn.target, [composeValued("poison", stated)]);
    const fire = composeMovedHealth(turn.target, "fire", takeHealth(turn.target, 96));
    return [ticked, fire].filter((one) => one !== null);
}

function actLightTick(turn: FabricatedTurn): string[] {
    assert(turn.target.healthMaximum > 0, "a tick lands where there is a maximum");
    assert(turn.round >= 0, "and on a round the fight has reached");
    const light = composeMovedHealth(turn.target, "light", takeHealth(turn.target, 88));
    const anguish = takeHealth(turn.ally, composeSmall(turn, 74));
    const ached = anguish === 0 ? null : composeHealthChange(turn.ally, [
        composeFigureParameter("anguish", anguish),
        composeValueless("+legbon_anguish"),
    ]);
    return [light, ached].filter((one) => one !== null);
}

function actHealSelf(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a turn is taken by somebody still standing");
    assert(turn.actor.health <= turn.actor.healthMaximum, "and nobody stands above full");
    const restored = addHealth(turn.actor, composeSmall(turn, 430));
    if (restored === 0) return [];
    return [composeHealthChange(turn.actor, [
        composeFigureParameter("heal", restored),
        composeFigureParameter("afterheal", composeSmall(turn, 18)),
    ])];
}

function actHealAlly(turn: FabricatedTurn): string[] {
    assert(turn.ally.side === turn.actor.side, "an ally stands on the actor's own side");
    assert(turn.ally.healthMaximum > 0, "and has a maximum to be moved against");
    const hurt = getHurtAllyFor(turn);
    if (hurt === null) return [composeBlow(turn, [])];
    const given = addHealth(hurt, composeSmall(turn, 640));
    return [composeMessage(composeSide(turn.actor), composeSide(hurt), [
        ...composeAnnouncement(getPlainSkill(turn)),
        composeFigureParameter("heal_target", given),
    ])];
}

function actHolyTouch(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a turn is taken by somebody still standing");
    assert(turn.actor.health <= turn.actor.healthMaximum, "and nobody stands above full");
    const given = addHealth(turn.actor, composeSmall(turn, 380));
    if (given === 0) return [];
    return [composeHealthChange(turn.actor, [
        composeValueless("+legbon_holytouch"),
        composeFigureParameter("legbon_holytouch_heal", given),
    ])];
}

function actBandage(turn: FabricatedTurn): string[] {
    assert(turn.ally.side === turn.actor.side, "an ally stands on the actor's own side");
    assert(turn.ally.healthMaximum > 0, "and has a maximum to be moved against");
    const bandaged = composeMovedHealth(turn.actor, "bandage", addHealth(turn.actor, 210));
    const carried = composeMovedHealth(turn.ally, "npc_heal", addHealth(turn.ally, 260));
    return [bandaged, carried].filter((one) => one !== null);
}

function actLastHeal(turn: FabricatedTurn): string[] {
    assert(turn.ally.side === turn.actor.side, "an ally stands on the actor's own side");
    assert(turn.ally.healthMaximum > 0, "and has a maximum to be moved against");
    const hurt = getHurtAllyFor(turn);
    if (hurt === null) return [composeBlow(turn, [])];
    const given = addHealth(hurt, composeSmall(turn, 300));
    const stated = `${composeIntegerText(given)},${composeNamedText(hurt)}`;
    return [composeBlow(turn, [composeValued("legbon_lastheal", stated)])];
}

function actNamedDamage(turn: FabricatedTurn): string[] {
    assert(turn.ally.side === turn.actor.side, "an ally stands on the actor's own side");
    assert(turn.ally.healthMaximum > 0, "and has a maximum to be moved against");
    const element = getElementFor(turn);
    const dealt = takeHealth(turn.ally, composeSmall(turn, 340));
    const stated = `${composeIntegerText(dealt)},${element.member},${composeNamedText(turn.ally)}`;
    return [composeBlow(turn, [composeValued("+oth_dmg", stated)])];
}

/**
 * The share is applied to the side before the message states it, so the percentages the message
 * carries are the ones the panel will size the share against.
 */
function actSideHeal(turn: FabricatedTurn): string[] {
    assert(turn.side.length > 0, "a cast that reaches a side reaches somebody");
    assert(turn.side.every((one) => one.side === turn.actor.side), "and only their own");
    const share = composeSmall(turn, 22);
    for (const standing of turn.side) {
        addHealth(standing, Math.round(standing.healthMaximum * share / WHOLE_PERCENT));
    }
    return [composeMessage(composeSide(turn.actor), null, [
        ...composeAnnouncement(getAuraSkill(turn)),
        composeValued("healall_per", composeIntegerText(share)),
        composeFigureParameter("lowheal_per-enemies", composeSmall(turn, 27)),
    ])];
}

function actAuraCast(turn: FabricatedTurn): string[] {
    assert(turn.side.length > 0, "a cast that reaches a side reaches somebody");
    assert(turn.side.every((one) => one.side === turn.actor.side), "and only their own");
    return [composeMessage(composeSide(turn.actor), null, [
        ...composeAnnouncement(getAuraSkill(turn)),
        composeFigureParameter("aura-ac_per", composeSmall(turn, 15)),
        composeFigureParameter("aura-resall", composeSmall(turn, 20)),
        composeFigureParameter("aura-sa_per", composeSmall(turn, 11)),
        composeFigureParameter("aura-adddmg2_per-meele", composeSmall(turn, 8)),
    ])];
}

function actShoutCast(turn: FabricatedTurn): string[] {
    assert(turn.side.length > 0, "a cast that reaches a side reaches somebody");
    assert(turn.side.every((one) => one.side === turn.actor.side), "and only their own");
    return [composeMessage(composeSide(turn.actor), null, [
        ...composeAnnouncement(getAuraSkill(turn)),
        composeFigureParameter("shout", composeSmall(turn, 30)),
        composeFigureParameter("allslow_per", composeSmall(turn, 25)),
        composeFigureParameter("alllowdmg", composeSmall(turn, 16)),
    ])];
}

function actAlliesCast(turn: FabricatedTurn): string[] {
    assert(turn.side.length > 0, "a cast that reaches a side reaches somebody");
    assert(turn.side.every((one) => one.side === turn.actor.side), "and only their own");
    return [composeMessage(composeSide(turn.actor), null, [
        ...composeAnnouncement(getAuraSkill(turn)),
        composeFigureParameter("critval-allies", composeSmall(turn, 12)),
        composeFigureParameter("critmval-allies", composeSmall(turn, 10)),
        composeValueless("removeslow-allies"),
        composeValueless("removestun-allies"),
        composeValueless("removedot-allies"),
    ])];
}

function actEnemiesCast(turn: FabricatedTurn): string[] {
    assert(turn.side.length > 0, "a cast that reaches a side reaches somebody");
    assert(turn.side.every((one) => one.side === turn.actor.side), "and only their own");
    return [composeMessage(composeSide(turn.actor), composeSide(turn.target), [
        ...composeAnnouncement(getAuraSkill(turn)),
        composeFigureParameter("poison_lowdmg_per-enemies", composeSmall(turn, 27)),
        composeFigureParameter("active_decblock_per-enemies", composeSmall(turn, 19)),
        composeFigureParameter("-poison_lowdmg_per", composeSmall(turn, 14)),
    ])];
}

function actStance(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a declaration is made by somebody still standing");
    assert(turn.ordinal >= 0, "on a turn the fight has numbered");
    return [composeMessage(composeSide(turn.actor), null, [
        composeFigureParameter("active_block_per", composeSmall(turn, 24)),
        composeFigureParameter("active_decblock_per", composeSmall(turn, 18)),
        composeFigureParameter("active_absorbdest_per", composeSmall(turn, 13)),
    ])];
}

function actResources(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a declaration is made by somebody still standing");
    assert(turn.ordinal >= 0, "on a turn the fight has numbered");
    return [composeMessage(composeSide(turn.actor), null, [
        composeFigureParameter("mana", composeSmall(turn, 40)),
        composeFigureParameter("energy", composeSmall(turn, 25)),
        composeFigureParameter("en-regen", composeSmall(turn, 6)),
        composeValueless("en-regen-cast"),
        composeFigureParameter("+engback", composeSmall(turn, 9)),
        composeFigureParameter("-endest", composeSmall(turn, 7)),
    ])];
}

function actStandingBuffs(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a declaration is made by somebody still standing");
    assert(turn.ordinal >= 0, "on a turn the fight has numbered");
    return [composeMessage(composeSide(turn.actor), null, [
        composeFigureParameter("+absorb", composeSmall(turn, 320)),
        composeFigureParameter("+absorbm", composeSmall(turn, 240)),
        composeFigureParameter("+taken_dmg", composeSmall(turn, 21)),
        composeValueless("+spell-taken_dmg-all"),
        composeFigureParameter("+crush_physical", composeSmall(turn, 17)),
        composeFigureParameter("+rage", composeSmall(turn, 26)),
        composeFigureParameter("+critsa", composeSmall(turn, 11)),
    ])];
}

function actLegendaryBuffs(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a declaration is made by somebody still standing");
    assert(turn.ordinal >= 0, "on a turn the fight has numbered");
    return [composeMessage(composeSide(turn.actor), null, [
        composeFigureParameter("-legbon_critred", composeSmall(turn, 13)),
        composeFigureParameter("+legbon_puncture", composeSmall(turn, 19)),
        composeFigureParameter("-legbon_facade", composeSmall(turn, 15)),
        composeFigureParameter("+critslow_per", composeSmall(turn, 23)),
        composeFigureParameter("+critpoison_per", composeSmall(turn, 20)),
        composeFigureParameter("combo-max", composeSmall(turn, 3)),
    ])];
}

/** The one announcement that carries no id, which is why nothing can date what it put on a side. */
function actBardSong(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a song is sung by somebody still standing");
    assert(BARD_SONG.length > 0, "and names what the client would have shown");
    return [composeMessage(composeSide(turn.actor), null, [composeValued("tcustom", BARD_SONG)])];
}

function actStep(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a step is taken by somebody still standing");
    assert(turn.actor.id > 0, "and by somebody the payload names");
    return [composeMessage(composeSide(turn.actor), null, [composeValueless("step")])];
}

function actPrepare(turn: FabricatedTurn): string[] {
    assert(isStanding(turn.actor), "a skill is made ready by somebody standing");
    assert(CHARGED_SKILL.length > 0, "and names the skill the client would show");
    const percent = composeIntegerText(getValueWithin(composeSmall(turn, 70), 0, WHOLE_PERCENT));
    return [composeMessage(composeSide(turn.actor), null, [
        composeValued("prepare", `${CHARGED_SKILL}(${percent}%)`),
    ])];
}

function actTurnLost(turn: FabricatedTurn): string[] {
    assert(turn.actor.name.length > 0, "a turn lost is lost by somebody named");
    assert(!TURN_LOST_TAIL.endsWith("."), "and the sentence carries no full stop");
    const sentence = `${turn.actor.name}${TURN_LOST_SEPARATOR}${TURN_LOST_TAIL}`;
    return [composeMessage(null, null, [composeValued(TEXT_KEY, sentence)])];
}

function actLoot(turn: FabricatedTurn): string[] {
    assert(LOOT_SENTENCE.endsWith("."), "a line about something else ends in a stop");
    assert(turn.actor.name.length > 0, "and the turn it rides was taken by somebody");
    return [composeMessage(null, null, [composeValued(TEXT_KEY, LOOT_SENTENCE)])];
}

/**
 * The script. One entry is one turn, and the fight walks this list round after round, so a key
 * stated here is stated many times over a fight rather than once where nobody would see it.
 */
const ACTS: FabricatedAct[] = [
    { name: "a plain blow", opensTurn: true, compose: actPlainBlow },
    { name: "a critical blow", opensTurn: true, compose: actCriticalBlow },
    { name: "an off-hand critical", opensTurn: true, compose: actOffhandBlow },
    { name: "a piercing blow", opensTurn: true, compose: actPiercingBlow },
    { name: "a blow against absorption", opensTurn: true, compose: actAbsorbedBlow },
    { name: "a blow breaking armour", opensTurn: true, compose: actArmourBreakingBlow },
    { name: "a third attack", opensTurn: true, compose: actThirdAttack },
    { name: "a stunning blow", opensTurn: true, compose: actStunningBlow },
    { name: "a cursed blow", opensTurn: true, compose: actCursedBlow },
    { name: "a blow evaded", opensTurn: true, compose: actEvadedBlow },
    { name: "a wounding blow", opensTurn: true, compose: actWoundingBlow },
    { name: "a wound ticking", opensTurn: false, compose: actWoundTick },
    { name: "poison and fire ticking", opensTurn: false, compose: actPoisonTick },
    { name: "light and anguish ticking", opensTurn: false, compose: actLightTick },
    { name: "healing oneself", opensTurn: false, compose: actHealSelf },
    { name: "healing an ally", opensTurn: true, compose: actHealAlly },
    { name: "a holy touch", opensTurn: false, compose: actHolyTouch },
    { name: "a bandage", opensTurn: false, compose: actBandage },
    { name: "healing stated by name", opensTurn: true, compose: actLastHeal },
    { name: "damage stated by name", opensTurn: true, compose: actNamedDamage },
    { name: "healing a whole side", opensTurn: true, compose: actSideHeal },
    { name: "an aura cast", opensTurn: true, compose: actAuraCast },
    { name: "a shout", opensTurn: true, compose: actShoutCast },
    { name: "a cast on the allies", opensTurn: true, compose: actAlliesCast },
    { name: "a cast on the enemies", opensTurn: true, compose: actEnemiesCast },
    { name: "a stance", opensTurn: false, compose: actStance },
    { name: "resources declared", opensTurn: false, compose: actResources },
    { name: "buffs standing", opensTurn: false, compose: actStandingBuffs },
    { name: "legendary buffs standing", opensTurn: false, compose: actLegendaryBuffs },
    { name: "a bard's song", opensTurn: true, compose: actBardSong },
    { name: "a step", opensTurn: true, compose: actStep },
    { name: "a skill made ready", opensTurn: true, compose: actPrepare },
    { name: "a turn spent on nothing", opensTurn: true, compose: actTurnLost },
    { name: "the log saying something else", opensTurn: false, compose: actLoot },
];

function composeHealthRecord(warrior: FabricatedWarrior): Record<string, unknown> {
    assert(warrior.healthMaximum > 0, "a combatant states the maximum it stands against");
    assert(warrior.health >= 0, "and health that is never below nothing");
    return {
        [WARRIOR_FIELDS.healthMaximum]: warrior.healthMaximum,
        cur: warrior.health,
        hpp: getHealthPercent(warrior),
    };
}

/** The opening call's record: every field the client's own warrior map carries. */
function composeOpeningWarrior(warrior: FabricatedWarrior): Record<string, unknown> {
    assert(warrior.level > 0, "a warrior states the level it fights at");
    assert(warrior.profession.length > 0, "and the profession it fights as");
    return {
        originalId: warrior.id,
        [WARRIOR_FIELDS.identity]: warrior.id,
        [WARRIOR_FIELDS.name]: warrior.name,
        [WARRIOR_FIELDS.side]: warrior.side,
        [WARRIOR_FIELDS.profession]: warrior.profession,
        [WARRIOR_FIELDS.level]: warrior.level,
        [WARRIOR_FIELDS.nonPlayer]: 0,
        [WARRIOR_FIELDS.statuses]: warrior.statusMask,
        [WARRIOR_FIELDS.health]: composeHealthRecord(warrior),
        oplvl: warrior.level,
        gender: warrior.side === SIDE_OURS ? "m" : "k",
        y: warrior.id % PER_SIDE,
        icon: `kuf/kuf_${warrior.profession}.gif`,
        mana: 240,
        energy: 118,
        ac: { cur: 250 + warrior.level, bonus: 0 },
        resfire: { cur: 20, bonus: 0 },
        resfrost: { cur: 15, bonus: 0 },
        reslight: { cur: 10, bonus: 0 },
        act: { cur: 30, bonus: 0 },
        focus: 0,
        combo: 0,
        cooldowns: warrior.id === FIRST_ID_OURS ? [[AURA_SKILLS[0]?.id ?? 25, 3]] : [],
        super_cast: warrior.id === FIRST_ID_THEIRS
            ? { name: CHARGED_SKILL, turn: 2, total_turns: 5 }
            : undefined,
    };
}

/** The mid-fight record: the volatile subset, which is what the corpus carries after the first. */
function composeStandingWarrior(warrior: FabricatedWarrior): Record<string, unknown> {
    assert(warrior.id > 0, "a warrior stated mid-fight is named by its id");
    assert(warrior.statusMask >= 0, "and by a mask that is never below nothing");
    return {
        [WARRIOR_FIELDS.identity]: warrior.id,
        [WARRIOR_FIELDS.health]: composeHealthRecord(warrior),
        [WARRIOR_FIELDS.statuses]: warrior.statusMask,
        mana: 240,
        energy: 118,
        ac: { cur: 250 + warrior.level, bonus: 0 },
    };
}

function composeWarriorMap(
    warriors: readonly FabricatedWarrior[],
    compose: (warrior: FabricatedWarrior) => Record<string, unknown>,
): Record<string, unknown> {
    assert(warriors.length > 0, "a warrior map states somebody");
    const map: Record<string, unknown> = {};
    for (const warrior of warriors) map[composeIntegerText(warrior.id)] = compose(warrior);
    assert(Object.keys(map).length === warriors.length, "every combatant handed over, once");
    return map;
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

/** What the panel would have seen of each combatant, which is the snapshot the format carries. */
function composeSnapshot(state: FabricationState): unknown[] {
    const taken = state.warriors.map((warrior) => ({
        [WARRIOR_FIELDS.identity]: warrior.id,
        [WARRIOR_FIELDS.name]: warrior.name,
        [WARRIOR_FIELDS.side]: warrior.side,
        [WARRIOR_FIELDS.profession]: warrior.profession,
        [WARRIOR_FIELDS.level]: warrior.level,
        [WARRIOR_FIELDS.health]: composeHealthRecord(warrior),
        mana: 240,
        energy: 118,
        ac: { cur: 250 + warrior.level, bonus: 0 },
    }));
    assert(taken.length === state.warriors.length, "a snapshot holds every combatant");
    assert(taken.length > 0, "and a fight has combatants to hold");
    return taken;
}

function getStandingOnSide(state: FabricationState, side: number): FabricatedWarrior[] {
    const standing = state.warriors.filter((one) => one.side === side && isStanding(one));
    assert(standing.length <= PER_SIDE, "a side holds no more than the ten it fielded");
    assert(standing.every(isStanding), "and everyone left on it is standing");
    return standing;
}

function isFightOver(state: FabricationState): boolean {
    assert(state.warriors.length > 0, "a fight that is asked about has combatants");
    if (getStandingOnSide(state, SIDE_OURS).length === 0) return true;
    return getStandingOnSide(state, SIDE_THEIRS).length === 0;
}

/**
 * ⚠️ **The round is in the choice, and it has to be.** A turn's ordinal steps by two for a given
 * side, so `ordinal % ten` reaches five of the ten and the other five end a long fight untouched.
 */
function getOpponentFor(state: FabricationState, actor: FabricatedWarrior, ordinal: number) {
    const other = actor.side === SIDE_OURS ? SIDE_THEIRS : SIDE_OURS;
    const standing = getStandingOnSide(state, other);
    if (standing.length === 0) return null;
    const chosen = standing[(ordinal + state.round * 3) % standing.length];
    assertExists(chosen, "a blow is thrown at somebody still standing");
    return chosen;
}

/** The actor themselves where nobody else is left: a turn is never skipped for want of a second. */
function getAllyFor(state: FabricationState, actor: FabricatedWarrior, ordinal: number) {
    const beside = getStandingOnSide(state, actor.side).filter((one) => one.id !== actor.id);
    if (beside.length === 0) return actor;
    const chosen = beside[(ordinal + state.round * 3) % beside.length];
    assertExists(chosen, "an act that names an ally names one still standing");
    return chosen;
}

function clearExpiredStatuses(state: FabricationState): void {
    assert(state.round >= 0, "a round is never below the first");
    for (const warrior of state.warriors) {
        if (warrior.statusMask === 0) continue;
        if (warrior.statusClearsAtRound > state.round) continue;
        warrior.statusMask = 0;
    }
    assert(state.warriors.every((one) => one.statusMask >= 0), "a mask is never below nothing");
}

/**
 * The queue the client draws: the holder at its least ordinal, then the nine forecast behind them.
 * `docs/turns-taken.md` grades a count against that least entry, so a queue opening on anybody
 * else would report every turn as taken by the wrong combatant.
 */
function composeTurnQueue(
    state: FabricationState,
    ordinal: number,
    acting: FabricatedWarrior,
): Record<string, number> {
    const standing = state.warriors.filter(isStanding);
    assert(standing.length > 0, "there is somebody left to put in the queue");
    assert(ordinal > 0, "and the game numbers a turn from one upwards");
    const opens = standing.findIndex((one) => one.id === acting.id);
    const queue: Record<string, number> = {};
    for (let ahead = 0; ahead < PER_SIDE; ahead += 1) {
        const at = (getValueWithin(opens, 0, standing.length - 1) + ahead) % standing.length;
        const chosen = standing[at];
        if (chosen === undefined) continue;
        queue[composeIntegerText(ordinal + ahead)] = chosen.id;
    }
    assert(Object.keys(queue).length <= PER_SIDE, "the queue is no wider than the client draws");
    return queue;
}

/** The statement the payload before this turn was waiting to make: whose turn is arriving. */
function addTurnStatement(state: FabricationState, acting: FabricatedWarrior): void {
    const awaiting = state.awaiting;
    if (awaiting === null) return;
    assert(acting.id > 0, "a statement names the combatant whose turn is arriving");
    awaiting[CURRENT_KEY] = acting.id;
    awaiting[TURN_QUEUE_KEY] = composeTurnQueue(state, state.statementOrdinal, acting);
    state.statementOrdinal += 1;
    assert(state.statementOrdinal > 1, "and is numbered once, never twice");
    state.awaiting = null;
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
    before: unknown[],
): void {
    assert(state.calls.length < MAXIMUM_CALLS, "a fabricated fight stays inside its bound");
    assert(before.length === state.warriors.length, "and opens on a snapshot of every combatant");
    state.calls.push({
        index: state.calls.length,
        payload,
        messages,
        combatantsBefore: before,
        combatantsAfter: composeSnapshot(state),
    });
}

/** The client's own opening: the cast, the ground it stands on, and whose side the reader is. */
function addOpeningCall(state: FabricationState): void {
    const before = composeSnapshot(state);
    const payload: Record<string, unknown> = {
        [FIGHT_OPENS_KEY]: "1",
        auto: "0",
        battleground: "009.jpg",
        skills_disabled: [],
        skills_combo_max: [],
        skills: ["-1", "", "", "", "", "", "", "", "", ""],
        [WARRIOR_FIELDS.warriors]: composeWarriorMap(state.warriors, composeOpeningWarrior),
        [READER_SIDE_KEY]: SIDE_OURS,
        poolTime: { total: 120, minimum: 2, penalty: 5, left: 120 },
        start_move: 15,
        move: 15,
    };
    assert(Object.keys(payload).length > 0, "an opening states something");
    assert(state.calls.length === 0, "and is the first call a fabricated fight carries");
    state.awaiting = payload;
    addCall(state, payload, [], before);
}

function addTurnCall(state: FabricationState, turn: FabricatedTurn, act: FabricatedAct): void {
    assert(act.name.length > 0, "a turn is written by an act with a name");
    const before = composeSnapshot(state);
    // An act whose figures all came out at nothing writes nothing, and the step below is then the
    // whole of the turn. Only an act that opens one of its own is held to leaving a message.
    const messages = act.compose(turn);
    if (!act.opensTurn) messages.push(...actStep(turn));
    assert(messages.length > 0, "a turn leaves at least one message behind");
    const indexes: number[] = [];
    for (const written of messages) {
        assert(written.length > 0, "a message written says something");
        indexes.push(state.messagesWritten);
        state.messagesWritten += 1;
    }
    addTurnStatement(state, turn.actor);
    const payload: Record<string, unknown> = {
        [WARRIOR_FIELDS.warriors]: composeWarriorMap(
            getStatedWarriors(state, turn),
            composeStandingWarrior,
        ),
        [MESSAGES_KEY]: messages,
        [MESSAGE_INDEX_KEY]: indexes,
        move: 15,
    };
    state.awaiting = payload;
    addCall(state, payload, messages, before);
}

function composeTurn(
    state: FabricationState,
    actor: FabricatedWarrior,
    ordinal: number,
): FabricatedTurn | null {
    const target = getOpponentFor(state, actor, ordinal);
    if (target === null) return null;
    const ally = getAllyFor(state, actor, ordinal);
    assert(ally.id > 0, "an act that names an ally names somebody");
    assert(target.id !== actor.id, "and a blow is never thrown at its own thrower");
    const side = getStandingOnSide(state, actor.side);
    return { actor, target, ally, side, round: state.round, ordinal };
}

function addFightRounds(state: FabricationState): void {
    let ordinal = 0;
    for (let round = 0; round < MAXIMUM_ROUNDS; round += 1) {
        state.round = round;
        clearExpiredStatuses(state);
        for (const actor of state.warriors) {
            if (!isStanding(actor)) continue;
            if (isFightOver(state)) return;
            const turn = composeTurn(state, actor, ordinal);
            if (turn === null) continue;
            const act = ACTS[ordinal % ACTS.length];
            assertExists(act, "a turn is written by an act the script names");
            addTurnCall(state, turn, act);
            ordinal += 1;
        }
    }
    assert(ordinal > 0, "a fabricated fight runs at least one turn");
}

/** How the fight ends: the two sides as text, and what the log says after them. */
function addClosingCall(state: FabricationState): void {
    const last = state.warriors.find(isStanding);
    assertExists(last, "a fight ends with somebody left standing");
    assert(state.calls.length > 1, "and after the calls that got it there");
    addTurnStatement(state, last);
    const before = composeSnapshot(state);
    const won = getStandingOnSide(state, SIDE_OURS).length > 0 ? SIDE_OURS : SIDE_THEIRS;
    const lost = won === SIDE_OURS ? SIDE_THEIRS : SIDE_OURS;
    const messages = [
        composeMessage(null, null, [
            composeValued(OUTCOME_WINNER_KEY, composeSideNames(state, won)),
        ]),
        composeMessage(null, null, [
            composeValued(OUTCOME_LOSER_KEY, composeSideNames(state, lost)),
        ]),
        composeMessage(null, null, [
            composeValued("+exp", composeIntegerText(48310)),
            composeValued("+ph", composeIntegerText(12)),
        ]),
    ];
    addCall(state, composeClosingPayload(state, messages), messages, before);
}

function composeSideNames(state: FabricationState, side: number): string {
    const named = state.warriors.filter((one) => one.side === side).map((one) => one.name);
    assert(named.length === PER_SIDE, "a side that is named names all ten of its own");
    assert(named.every((one) => one.length > 0), "and each of them says something");
    return named.join(NAME_SEPARATOR);
}

function composeClosingPayload(
    state: FabricationState,
    messages: string[],
): Record<string, unknown> {
    const indexes: number[] = [];
    for (const written of messages) {
        assert(written.length > 0, "a message written says something");
        indexes.push(state.messagesWritten);
        state.messagesWritten += 1;
    }
    assert(indexes.length === messages.length, "and is numbered once");
    return {
        [FIGHT_ENDS_KEY]: 1,
        [WARRIOR_FIELDS.warriors]: composeWarriorMap(state.warriors, composeStandingWarrior),
        [MESSAGES_KEY]: messages,
        [MESSAGE_INDEX_KEY]: indexes,
        move: -1,
    };
}

if (import.meta.main) {
    const parsed = parseArgs(Deno.args, { string: [OUTPUT_FLAG] });
    const path = parsed.out ?? DEFAULT_OUTPUT;
    const fight = composeFabricatedFight();
    writeFabricatedFight(path, composeFabricatedCaptureText(fight));
    const messages = fight.calls.reduce((sum, call) => sum + call.messages.length, 0);
    console.log(`${path}`);
    console.log(`${fight.warriors.length} combatants, ten a side, every one of them a player`);
    console.log(`${fight.calls.length} calls, ${messages} messages, ${ACTS.length} acts scripted`);
}
