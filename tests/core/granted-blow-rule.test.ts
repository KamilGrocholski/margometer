/**
 * A blow the published table granted, and how far its announcement reaches.
 *
 * The protocol never puts a skill on a blow: a skill that strikes twice announces once and sends
 * two blow messages, and nothing in the message charges the second. What decides how far an
 * announcement reaches is the table rather than the shape of the payload, and this is where that
 * is re-earned over `captures/`. **ADR 0078.**
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { ANNOUNCEMENT_KEYS, decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import {
    composeFightStatistics,
    composeTurnStanding,
    getTurnOpener,
    NO_TURN_STANDING,
} from "@/src/core/fight-statistics.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import {
    BLOWS_GRANTED,
    getRecordedCombatants,
    getRecordedPayloads,
    readRecordingPaths,
} from "@/tests/recorded-fight.ts";
import { FROZEN_BLOWS_GRANTED } from "@/frozen/blows-granted.ts";

/** The damage family, by the rule `frozen/protocol-keys.ts` states: characters 1 to 3 are `dmg`. */
const DAMAGE_MARKER = "dmg";
const MARKER_AT = 1;
const NAME_KEY = "tspell";
const ID_KEY = "skillId";
/** Keys that would put a figure somewhere else, and never stand on a granted blow. */
const ELSEWHERE_KEYS: readonly string[] = ["+oth_dmg", "healall_per", "legbon_lastheal", "heal"];
/** Past the longest run this walk could meet before it is a payload of nothing else. */
const MAXIMUM_RUN = 64;

function hasDamageFigure(keys: readonly string[]): boolean {
    for (const key of keys) {
        if (key.slice(MARKER_AT, MARKER_AT + DAMAGE_MARKER.length) === DAMAGE_MARKER) return true;
    }
    return false;
}

function isAnnouncement(keys: readonly string[]): boolean {
    for (const key of keys) {
        if (ANNOUNCEMENT_KEYS.includes(key)) return true;
    }
    return false;
}

interface RecordedRun {
    /** The name the announcement carried, or the empty text where it carried none. */
    skillName: string;
    /** Its id, or null where the announcement stated none. */
    skillId: number | null;
    /** The blow messages that followed it, uninterrupted and all by its own announcer. */
    blows: string[];
}

/** Every announcement in one payload, with the run of its own blows that followed it. */
function composeRunsFromPayload(payload: readonly string[]): RecordedRun[] {
    const parsed = payload.map((one) => parseProtocolMessage(one));
    const runs: RecordedRun[] = [];
    for (let at = 0; at < parsed.length; at += 1) {
        const opener = parsed[at];
        if (opener === undefined) continue;
        const keys = opener.parameters.map((one) => one.key);
        if (!isAnnouncement(keys)) continue;
        const actorId = opener.actor?.combatantId ?? opener.target?.combatantId ?? null;
        const blows: string[] = [];
        for (let look = at + 1; look < parsed.length; look += 1) {
            assert(blows.length <= MAXIMUM_RUN, "a run stays inside the bound this walk states");
            const next = parsed[look];
            if (next === undefined) break;
            const following = next.parameters.map((one) => one.key);
            if (isAnnouncement(following)) break;
            if (!hasDamageFigure(following)) break;
            if ((next.actor?.combatantId ?? null) !== actorId) break;
            blows.push(payload[look] ?? "");
        }
        const stated = opener.parameters.find((one) => one.key === ID_KEY)?.value ?? null;
        runs.push({
            skillName: opener.parameters.find((one) => one.key === NAME_KEY)?.value ?? "",
            skillId: stated === null ? null : Number(stated),
            blows,
        });
    }
    return runs;
}

function composeRunsFromRecordings(): RecordedRun[] {
    const runs: RecordedRun[] = [];
    for (const path of readRecordingPaths()) {
        for (const payload of getRecordedPayloads(path)) {
            for (const run of composeRunsFromPayload(payload)) runs.push(run);
        }
    }
    assert(runs.length > 0, "an empty reading of the material is a finding, not a pass");
    return runs;
}

/**
 * The whole of what the corpus grants, measured 2026-09-19: 216 announcements are followed by two
 * of their own blows and none by three, and the three skills behind them are the two the table
 * grants an attack to and one it has never heard of.
 */
Deno.test("a run of the announcer's own blows is two at most, and only for three skills", () => {
    const longer = new Map<string, number>();
    for (const run of composeRunsFromRecordings()) {
        assert(run.blows.length <= 2, `${run.skillName}: a run of more than two blows`);
        if (run.blows.length < 2) continue;
        longer.set(run.skillName, (longer.get(run.skillName) ?? 0) + 1);
    }
    assertEquals(
        [...longer.entries()].sort(),
        [["Podwójne trafienie", 154], ["Podwójny strzał", 59], ["Struna płomienna", 3]],
        "the skills that strike twice, and how often the corpus caught each",
    );
});

/**
 * ⚠️ **Which half of the rule reaches each blow, and the two must not be read off each other.**
 * A run whose announcement names an id is the table's to bound, and the count it states binds. A
 * run whose announcement names none is the bound's, because the table is keyed by that id and has
 * no way to answer — the published table is a **player's**, and every run here is a boss's.
 */
Deno.test(
    "a second blow is reached by the table where it can speak, and by the bound where not",
    () => {
        let bounded = 0;
        let reached = 0;
        for (const run of composeRunsFromRecordings()) {
            if (run.blows.length < 2) continue;
            if (run.skillId === null) {
                reached += 1;
                assertStrictEquals(run.skillName, "Struna płomienna", "the one with no id");
                continue;
            }
            const granted = BLOWS_GRANTED.get(run.skillId);
            assert(granted !== undefined, `${run.skillName}: an id the table does not carry`);
            bounded += 1;
            assert(granted >= run.blows.length - 1, `${run.skillName}: more blows than it grants`);
        }
        assertStrictEquals(bounded, 213, "what the table bounds");
        assertStrictEquals(reached, 3, "and what the bound reaches, because the table cannot");
    },
);

/**
 * ⚠️ **Why nothing but the announcement on a blow moves.** A granted blow reports damage and
 * nothing else — no health moving, no figure stated against a name, no share restored to a side.
 * A recording that brings one reddens here, and this is the test that would have to be answered
 * before the figures below could be trusted again.
 */
Deno.test("a granted blow carries damage and nothing a second reading would place", () => {
    let read = 0;
    for (const run of composeRunsFromRecordings()) {
        for (const message of run.blows.slice(1)) {
            read += 1;
            const keys = parseProtocolMessage(message).parameters.map((one) => one.key);
            for (const elsewhere of ELSEWHERE_KEYS) {
                assert(!keys.includes(elsewhere), `a granted blow states ${elsewhere}`);
            }
        }
    }
    assertStrictEquals(read, 216, "every second blow the corpus holds was read");
});

/**
 * The figures this moved, both ways. ⚠️ **The empty table does not restore the rule that stood
 * before this decision, and must not be read as doing so:** a reach the table could not bound is
 * not the table's to take away, so the three blows it reaches stay reached. What the empty column
 * isolates is exactly the table's own contribution — 213 blows and 138,290 points — and the three
 * it does not move are the other half of the rule showing through.
 */
Deno.test("the table reaches 213 blows, and the bound reaches three the table cannot", () => {
    const counted = new Map<string, { plain: number; plainApplied: number }>();
    for (const table of [BLOWS_GRANTED, new Map<number, number>()]) {
        let plain = 0;
        let plainApplied = 0;
        for (const path of readRecordingPaths()) {
            const roster = composeCombatantRoster(getRecordedCombatants(path));
            for (const payload of getRecordedPayloads(path)) {
                for (const event of decodeFightMessages(payload, roster, table)) {
                    if (event.kind !== "attack") continue;
                    const applied = event.applied.reduce((sum, one) => sum + one.amount, 0);
                    if (event.announced !== null) continue;
                    plain += 1;
                    plainApplied += applied;
                }
            }
        }
        counted.set(table.size === 0 ? "none" : "table", { plain, plainApplied });
    }
    assertEquals(
        counted.get("table"),
        { plain: 1672, plainApplied: 2163634 },
        "what stands behind no announcement once both halves of the rule have run",
    );
    assertEquals(
        counted.get("none"),
        { plain: 1885, plainApplied: 2301924 },
        "and what the bound alone leaves, which is the table's own contribution measured",
    );
});

/** The rows the change takes away entirely: a combatant whose every blow was announced. */
Deno.test("six combatants are left with no unannounced blow at all", () => {
    let emptied = 0;
    for (const path of readRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const payloads = getRecordedPayloads(path);
        const read = payloads.flatMap((one) => decodeFightMessages(one, roster, BLOWS_GRANTED));
        const before = payloads.flatMap((one) => decodeFightMessages(one, roster, new Map()));
        const now = composeFightStatistics(read, new Map()).byCombatantId;
        const was = composeFightStatistics(before, new Map()).byCombatantId;
        for (const [id, figures] of now) {
            const stood = was.get(id)?.blowsWithoutSkill ?? 0;
            if (stood === 0) continue;
            if (figures.blowsWithoutSkill > 0) continue;
            emptied += 1;
        }
    }
    assertStrictEquals(emptied, 6, "and each of them loses the row that closed their section");
});

/** The frozen reading itself: three skills, and the count each one grants. */
Deno.test("the table the bundle carries is the three skills that grant a blow", () => {
    assertEquals(
        FROZEN_BLOWS_GRANTED.skills.map((one) => one.id),
        [97, 239, 283],
        "read off the published table on the date its banner states",
    );
    assertStrictEquals(BLOWS_GRANTED.size, 3, "and each is keyed once");
    for (const [, granted] of BLOWS_GRANTED) {
        assert(granted > 0, "a skill in the table grants at least one blow");
    }
});

/**
 * ⚠️ **`Zwykły cios` is a measured claim after this, and was a likely one before.** Every blow
 * standing under no announcement opened a turn of its own, so this program's two readings of the
 * same message — whose action it was, and whose skill it was — answer alike. Until 2026-09-12 they
 * did not: `docs/reading-a-turn.md` counted 1,580 turns opened by a blow while this row held
 * 1,583, and the three were one boss skill the published table of a player's skills cannot carry.
 *
 * The empty table is what proves the walk still counts. With it the reach the table grants is
 * gone, 213 blows fall back into the row, and every one of them stands mid-strike — so a reader
 * that had stopped finding its subject could not pass this.
 */
Deno.test("every blow the closing row holds opened a turn of its own", () => {
    const counted = new Map<string, { plain: number; midStrike: number }>();
    for (const table of [BLOWS_GRANTED, new Map<number, number>()]) {
        let plain = 0;
        let midStrike = 0;
        for (const path of readRecordingPaths()) {
            const roster = composeCombatantRoster(getRecordedCombatants(path));
            const events = getRecordedPayloads(path)
                .flatMap((payload) => decodeFightMessages(payload, roster, table));
            let standing = NO_TURN_STANDING;
            for (const event of events) {
                const openerId = getTurnOpener(event, standing);
                standing = composeTurnStanding(event, standing);
                if (event.kind !== "attack") continue;
                if (event.announced !== null) continue;
                plain += 1;
                if (openerId === null) midStrike += 1;
            }
        }
        counted.set(table.size === 0 ? "none" : "table", { plain, midStrike });
    }
    assertEquals(
        counted.get("table"),
        { plain: 1672, midStrike: 0 },
        "the row is exactly the blows the game numbered a turn for",
    );
    assertEquals(
        counted.get("none"),
        { plain: 1885, midStrike: 213 },
        "and without the table's reach the walk still finds what it is looking for",
    );
});
