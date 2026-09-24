/**
 * A blow the published table granted, and how far its announcement reaches.
 *
 * The protocol never puts a skill on a blow: a skill that strikes twice announces once and sends
 * two blow messages, and nothing in the message charges the second. What decides how far an
 * announcement reaches is the table rather than the shape of the payload, and this is where that
 * is re-earned over `develop:captures/` (`develop ADR 0078`).
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import { BATTLE_EVENT, type BattleEvent } from "@/src/core/battle-event.ts";
import { indexCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodePayloadMessages, type DecoderTables } from "@/src/core/fight-decoder.ts";
import { tallyFightStatistics, verifyFightStatistics } from "@/src/core/fight-statistics.ts";
import { parseProtocolMessage, type ProtocolMessage } from "@/src/core/protocol-message.ts";
import { composeTurnStanding, lookupTurnOpener, NO_TURN_STANDING } from "@/src/core/turn-clock.ts";
import { BLOWS_GRANTED } from "@/tests/frozen-tables.ts";
import { readRecordedFights, type RecordedFight } from "@/tests/recorded-fights.ts";

/**
 * The keys are the game's, restated here on purpose: a test reading the decoder's own table back
 * would hold the decoder to itself. The damage family is characters 1 to 3 reading `dmg`.
 */
const DAMAGE_MARKER = "dmg";
const MARKER_AT = 1;
const NAME_KEY = "tspell";
const ID_KEY = "skillId";
const ANNOUNCEMENT_KEYS: readonly string[] = [NAME_KEY, "tcustom", ID_KEY];
/** Keys that would put a figure somewhere else, and never stand on a granted blow. */
const ELSEWHERE_KEYS: readonly string[] = ["+oth_dmg", "healall_per", "legbon_lastheal", "heal"];
/** Past the longest run this walk could meet before it is a payload of nothing else. */
const RUN_MAXIMUM = 64;
const NO_GRANTS: DecoderTables = { blowsGrantedBySkillId: new Map() };
const TABLES = { table: BLOWS_GRANTED, none: NO_GRANTS } as const;

function hasDamageFigure(keys: readonly string[]): boolean {
    return keys.some((key) =>
        key.slice(MARKER_AT, MARKER_AT + DAMAGE_MARKER.length) === DAMAGE_MARKER
    );
}

function isAnnouncement(keys: readonly string[]): boolean {
    return keys.some((key) => ANNOUNCEMENT_KEYS.includes(key));
}

function parseOrFail(text: string): ProtocolMessage {
    const parsed = parseProtocolMessage(text);
    assert(parsed.ok, `"${text}" parses`);
    return parsed.value;
}

interface RecordedRun {
    /** The name the announcement carried, or the empty text where it carried none. */
    skillName: string;
    /** Its id, or null where the announcement stated none. */
    skillId: number | null;
    /** The blow messages that followed it, uninterrupted and all by its own announcer. */
    blows: string[];
}

/** The run of the announcer's own blows following the announcement at `at`. */
function readRunBlows(
    payload: readonly string[],
    parsed: readonly ProtocolMessage[],
    at: number,
    actorId: number | null,
): string[] {
    const blows: string[] = [];
    for (let look = at + 1; look < parsed.length; look += 1) {
        assert(blows.length <= RUN_MAXIMUM, "a run stays inside the bound this walk states");
        const next = parsed[look];
        if (next === undefined) break;
        const following = next.parameters.map((one) => one.key);
        if (isAnnouncement(following)) break;
        if (!hasDamageFigure(following)) break;
        if ((next.actor?.combatantId ?? null) !== actorId) break;
        blows.push(payload[look] ?? "");
    }
    return blows;
}

/** Every announcement in one payload, with the run of its own blows that followed it. */
function readRunsFromPayload(payload: readonly string[]): RecordedRun[] {
    const parsed = payload.map(parseOrFail);
    const runs: RecordedRun[] = [];
    for (let at = 0; at < parsed.length; at += 1) {
        const opener = parsed[at];
        if (opener === undefined) continue;
        if (!isAnnouncement(opener.parameters.map((one) => one.key))) continue;
        const actorId = opener.actor?.combatantId ?? opener.target?.combatantId ?? null;
        const stated = opener.parameters.find((one) => one.key === ID_KEY)?.value ?? null;
        runs.push({
            skillName: opener.parameters.find((one) => one.key === NAME_KEY)?.value ?? "",
            skillId: stated === null ? null : Number(stated),
            blows: readRunBlows(payload, parsed, at, actorId),
        });
    }
    return runs;
}

function readRunsFromRecordings(): RecordedRun[] {
    const runs = readRecordedFights().flatMap((fight) =>
        fight.payloads.flatMap((payload) => readRunsFromPayload(payload))
    );
    assert(runs.length > 0, "an empty reading of the material is a finding, not a pass");
    return runs;
}

/** One recording decoded payload by payload against a table, as develop decodes it. */
function decodeWithTable(fight: RecordedFight, tables: DecoderTables): BattleEvent[] {
    const roster = indexCombatantRoster(fight.combatants);
    return fight.payloads.flatMap((payload) => [
        ...decodePayloadMessages(payload, { roster, standing: null, tables }).events,
    ]);
}

/**
 * The whole of what the corpus grants, measured 2026-09-21: 239 announcements are followed by two
 * of their own blows and none by three, and the three skills behind them are the two the table
 * grants an attack to and one it has never heard of.
 */
Deno.test("a run of the announcer's own blows is two at most, and only for three skills", () => {
    const longer = new Map<string, number>();
    for (const run of readRunsFromRecordings()) {
        assert(run.blows.length <= 2, `${run.skillName}: a run of more than two blows`);
        if (run.blows.length < 2) continue;
        longer.set(run.skillName, (longer.get(run.skillName) ?? 0) + 1);
    }
    assertEquals(
        [...longer.entries()].sort(),
        [["Podwójne trafienie", 177], ["Podwójny strzał", 59], ["Struna płomienna", 3]],
        "the skills that strike twice, and how often the corpus caught each",
    );
});

/**
 * ⚠️ **Which half of the rule reaches each blow, and the two must not be read off each other.** A
 * run whose announcement names an id is the table's to bound. A run whose announcement names none
 * is the bound's, because the table is keyed by that id: the published table is a **player's**,
 * and every run here is a boss's.
 */
Deno.test("a second blow is reached by the table where it can, and by the bound where not", () => {
    let bounded = 0;
    let reached = 0;
    for (const run of readRunsFromRecordings()) {
        if (run.blows.length < 2) continue;
        if (run.skillId === null) {
            reached += 1;
            assertStrictEquals(run.skillName, "Struna płomienna", "the one with no id");
            continue;
        }
        const granted = BLOWS_GRANTED.blowsGrantedBySkillId.get(run.skillId);
        assertExists(granted, `${run.skillName}: an id the table does not carry`);
        bounded += 1;
        assert(granted >= run.blows.length - 1, `${run.skillName}: more blows than it grants`);
    }
    assertStrictEquals(bounded, 236, "what the table bounds");
    assertStrictEquals(reached, 3, "and what the bound reaches, because the table cannot");
});

/**
 * ⚠️ **Why nothing but the announcement on a blow moves.** A granted blow reports damage and
 * nothing else. A recording that brings one reddens here, and this is the test that would have to
 * be answered before the figures below could be trusted again.
 */
Deno.test("a granted blow carries damage and nothing a second reading would place", () => {
    let read = 0;
    for (const run of readRunsFromRecordings()) {
        for (const message of run.blows.slice(1)) {
            read += 1;
            const keys = parseOrFail(message).parameters.map((one) => one.key);
            for (const elsewhere of ELSEWHERE_KEYS) {
                assert(!keys.includes(elsewhere), `a granted blow states ${elsewhere}`);
            }
        }
    }
    assertStrictEquals(read, 239, "every second blow the corpus holds was read");
});

/**
 * The figures this moved, both ways. ⚠️ **The empty table does not restore the rule that stood
 * before this decision**: a reach the table could not bound is not the table's to take away, so
 * the three blows it reaches stay reached. The empty column isolates the table's own contribution.
 */
Deno.test("the table reaches 236 blows, and the bound reaches three the table cannot", () => {
    const counted = new Map<string, { plain: number; plainApplied: number }>();
    for (const [name, tables] of Object.entries(TABLES)) {
        let plain = 0;
        let plainApplied = 0;
        for (const fight of readRecordedFights()) {
            for (const event of decodeWithTable(fight, tables)) {
                if (event.kind !== BATTLE_EVENT.attack) continue;
                if (event.announced !== null) continue;
                plain += 1;
                plainApplied += event.applied.reduce((sum, one) => sum + one.amount, 0);
            }
        }
        counted.set(name, { plain, plainApplied });
    }
    assertEquals(
        counted.get("table"),
        { plain: 1769, plainApplied: 2254795 },
        "what stands behind no announcement once both halves of the rule have run",
    );
    assertEquals(
        counted.get("none"),
        { plain: 2005, plainApplied: 2404633 },
        "and what the bound alone leaves, which is the table's own contribution measured",
    );
});

/** The rows the change takes away entirely: a combatant whose every blow was announced. */
Deno.test("six combatants are left with no unannounced blow at all", () => {
    let emptied = 0;
    for (const fight of readRecordedFights()) {
        const now = tallyFightStatistics(decodeWithTable(fight, BLOWS_GRANTED), new Map());
        const was = tallyFightStatistics(decodeWithTable(fight, NO_GRANTS), new Map());
        verifyFightStatistics(now);
        verifyFightStatistics(was);
        for (const [id, figures] of now.byCombatantId) {
            const stood = was.byCombatantId.get(id)?.blowsWithoutSkill ?? 0;
            if (stood === 0) continue;
            if (figures.blowsWithoutSkill > 0) continue;
            emptied += 1;
        }
    }
    assertStrictEquals(emptied, 6, "and each of them loses the row that closed their section");
});

/** The table the tests carry, as `develop:frozen/blows-granted.ts` froze it. */
Deno.test("the table the tests carry is the three skills that grant a blow", () => {
    const table = BLOWS_GRANTED.blowsGrantedBySkillId;
    assertEquals([...table.keys()], [97, 239, 283], "read off the published table");
    assertStrictEquals(table.size, 3, "and each is keyed once");
    for (const [, granted] of table) {
        assert(granted > 0, "a skill in the table grants at least one blow");
    }
});

/**
 * ⚠️ **`Zwykły cios` is a measured claim.** Every blow standing under no announcement opened a turn
 * of its own, so the two readings of one message, whose action it was and whose skill it was,
 * answer alike. The empty table proves the walk still counts: 236 blows fall back into the row, and
 * every one of them stands mid-strike.
 */
Deno.test("every blow the closing row holds opened a turn of its own", () => {
    const counted = new Map<string, { plain: number; midStrike: number }>();
    for (const [name, tables] of Object.entries(TABLES)) {
        let plain = 0;
        let midStrike = 0;
        for (const fight of readRecordedFights()) {
            let standing = NO_TURN_STANDING;
            for (const event of decodeWithTable(fight, tables)) {
                const openerId = lookupTurnOpener(event, standing);
                standing = composeTurnStanding(event, standing);
                if (event.kind !== BATTLE_EVENT.attack) continue;
                if (event.announced !== null) continue;
                plain += 1;
                if (openerId === null) midStrike += 1;
            }
        }
        counted.set(name, { plain, midStrike });
    }
    assertEquals(
        counted.get("table"),
        { plain: 1769, midStrike: 0 },
        "the row is exactly the blows the game numbered a turn for",
    );
    assertEquals(
        counted.get("none"),
        { plain: 2005, midStrike: 236 },
        "and without the table's reach the walk still finds what it is looking for",
    );
});
