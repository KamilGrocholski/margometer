/**
 * What the fabricated fight is worth, against `docs/protocol-keys.md`.
 *
 * The fight is composed here and never written: a guard that needed the file on disk would be a
 * guard that only runs where somebody has already run the tool. What it holds is the reason the
 * tool exists — every key the register calls `decoded` is stated at least once, and the whole
 * thing goes back through the chain `src/userscript-entry.ts` runs with nothing left unread.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { composeFightReplay } from "@/tools/fight-replay.ts";
import {
    composeFabricatedCaptureText,
    composeFabricatedFight,
    FABRICATED_WORLD,
    FABRICATION_FIELDS,
    isFabricatedPath,
} from "@/tools/fabricated-fight.ts";

const REGISTER_PATH = "docs/protocol-keys.md";
const SECTION_MARKER = "### ";
const BACKTICK = "`";
const DECODED_VERDICT = "decoded";
const SEGMENT_SEPARATOR = ";";
const VALUE_SEPARATOR = "=";
/** Both ends of a message come first, and neither is a key. */
const SIDE_SEGMENTS = 2;
/** Past the heading count of the register, so the walk carries a stated bound. */
const MAXIMUM_HEADINGS = 1024;

/**
 * A key the register calls `decoded` that no message can state, each with why. The list is the
 * one way past this guard, so an entry without a reason is an entry that should not be here.
 */
const NOT_A_MESSAGE_KEY: Record<string, string> = {
    // A field of the payload's own warrior record, which is where the fabricated fight sets it.
    buffs: "a warrior record's key, not a message's",
    // The family the client reads by shape rather than by name; every member of it is a key, and
    // the script states six pairs of them.
    "?dmg*": "a family read by shape, and no key a message ever writes",
};

/** Every heading of the register, as the key it names and the verdict it carries. */
function getRegisterVerdicts(register: string): Map<string, string> {
    const found = new Map<string, string>();
    for (const line of register.split("\n")) {
        if (!line.startsWith(SECTION_MARKER)) continue;
        assert(found.size <= MAXIMUM_HEADINGS, "the walk stays inside its stated bound");
        const body = line.slice(SECTION_MARKER.length);
        if (!body.startsWith(BACKTICK)) continue;
        const closes = body.indexOf(BACKTICK, 1);
        if (closes === -1) continue;
        const key = body.slice(1, closes);
        const verdict = body.slice(closes + 1).split("—").join("").trim();
        found.set(key, verdict);
    }
    return found;
}

/** The keys one message states, which is every segment after its two ends. */
function getKeysOfMessage(message: string): string[] {
    const segments = message.split(SEGMENT_SEPARATOR).slice(SIDE_SEGMENTS);
    assert(segments.length >= 0, "a message states no fewer keys than none");
    return segments.map((segment) => {
        const at = segment.indexOf(VALUE_SEPARATOR);
        return at === -1 ? segment : segment.slice(0, at);
    });
}

Deno.test("the readers know a decoded heading and a key from a message", () => {
    const sample = "### `+crit` — decoded\n### `+swing` — investigated\nnot a heading\n";
    const read = getRegisterVerdicts(sample);
    assertStrictEquals(read.get("+crit"), DECODED_VERDICT, "a decoded heading is read as one");
    assertStrictEquals(read.get("+swing"), "investigated", "and one that was only looked at");
    assertStrictEquals(read.size, 2, "and a line that is no heading is no entry");

    assertEquals(
        getKeysOfMessage("500001=97.45;600001=70.07;+dmgd=466;+crit"),
        ["+dmgd", "+crit"],
        "a key is read with its value off, and both ends are skipped",
    );
    assertEquals(getKeysOfMessage("0;0"), [], "a message stating nothing states no key");
});

const FIGHT = composeFabricatedFight();
const MESSAGES = FIGHT.calls.flatMap((call) => call.messages);
const REPLAY = composeFightReplay({
    name: "fabricated",
    calls: FIGHT.calls.map((call) => call.payload),
});

Deno.test("the fabricated fight states every key the register calls decoded", () => {
    const verdicts = getRegisterVerdicts(Deno.readTextFileSync(REGISTER_PATH));
    assert(verdicts.size > 0, "the register names keys");
    const stated = new Set(MESSAGES.flatMap(getKeysOfMessage));
    assert(stated.size > 0, "and the fabricated fight states keys of its own");
    const unstated: string[] = [];
    for (const [key, verdict] of verdicts) {
        if (verdict !== DECODED_VERDICT) continue;
        if (key in NOT_A_MESSAGE_KEY) continue;
        if (!stated.has(key)) unstated.push(key);
    }
    assertEquals(unstated, [], "a decoded key the fabricated fight never puts in front of anybody");
});

Deno.test("every exemption names a key the register really carries", () => {
    const verdicts = getRegisterVerdicts(Deno.readTextFileSync(REGISTER_PATH));
    const gone = Object.keys(NOT_A_MESSAGE_KEY).filter((key) => !verdicts.has(key));
    assertEquals(gone, [], "an exemption for a key the register no longer names");
    const reasons = Object.values(NOT_A_MESSAGE_KEY).filter((reason) => reason.length === 0);
    assertEquals(reasons, [], "an exemption carrying no reason");
});

Deno.test("the fabricated fight goes through the chain with nothing left unread", () => {
    assertStrictEquals(REPLAY.statistics.unreadMessages, 0, "a message the panel could not read");
    assertStrictEquals(REPLAY.reading.messagesLost, 0, "a message the payload said it carried");
    assert(REPLAY.reading.isOver, "and the fight it composed reached its end");
    assert(!REPLAY.reading.hasJoinedInProgress, "and was read from its own opening");
});

Deno.test("the fabricated fight fields ten players against ten", () => {
    const combatants = [...REPLAY.roster.byId.values()];
    assertStrictEquals(combatants.length, 20, "a fabricated fight fields twenty");
    assertStrictEquals(REPLAY.reading.readerSide, 1, "and states which side the reader is on");
    const ours = combatants.filter((one) => one.side === REPLAY.reading.readerSide);
    assertStrictEquals(ours.length, 10, "ten of them ours");
    assertStrictEquals(combatants.length - ours.length, 10, "and ten of them theirs");
    const professions = new Set(combatants.map((one) => one.profession));
    assert(professions.size >= 4, "across more than one profession");
});

Deno.test("the fabricated fight puts something in every part of the panel", () => {
    assert(REPLAY.statistics.outcome !== null, "a fight that ended says who won it");
    assert(REPLAY.statistics.statusRuns.length > 0, "and statuses that stood on somebody");
    assert(REPLAY.statistics.auraStandings.length > 0, "and a skill that reached a whole side");
    assert(REPLAY.statistics.chargeStandings.length > 0, "and a skill being made ready");
    const figures = [...REPLAY.statistics.byCombatantId.values()];
    assertStrictEquals(figures.length, 20, "and a figure for every combatant");
    assert(figures.every((one) => one.damageDealtApplied > 0), "each of whom dealt something");
    assert(figures.every((one) => one.damageTakenApplied > 0), "and each of whom took something");
    assert(figures.some((one) => one.healthGiven > 0), "somebody restored somebody else");
    assert(figures.some((one) => one.turnsLost > 0), "and somebody spent a turn on nothing");
});

Deno.test("a fabricated fight is written only where git is told not to look", () => {
    assert(isFabricatedPath("fabricated/10v10-long.json"), "the directory git ignores");
    assert(!isFabricatedPath("captures/10v10-long.json"), "and never the evidence directory");
    assert(!isFabricatedPath("fabricated.json"), "nor a file merely named after it");
});

Deno.test("the file a fabricated fight is written as says so three times over", () => {
    const written = composeFabricatedCaptureText(FIGHT);
    const document = JSON.parse(written);
    assertStrictEquals(document[FABRICATION_FIELDS.isFabricated], true, "the envelope says so");
    assertStrictEquals(document.world, FABRICATED_WORLD, "the world it states says so");
    assert(`${document[FABRICATION_FIELDS.fabricatedBy]}`.length > 0, "and what wrote it is named");
    assertStrictEquals(document.gameBuild, null, "a fight nobody fought came off no build");
});
