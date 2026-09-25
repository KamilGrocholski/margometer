/**
 * What the decoder could not read, counted. That the text is `develop`'s is
 * `deno task fight:develop`'s to show; these hold what the counts say about the material.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { BATTLE_EVENT, type BattleEvent, UNREAD_CAUSE } from "#/src/core/battle-event.ts";
import { formatStatusReport, tallyDecodingStatus } from "#/tools/decoding-status.ts";
import {
    readRecordedMaterial,
    type ReplayedFight,
    replayRecordedMaterial,
} from "#/tools/recorded-material.ts";
import { lookupRecordedFight } from "#/tests/recorded-fights.ts";

const SHORT = "captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json";

Deno.test("the corpus counts every message it carries, and every kind has a line", () => {
    const material = readRecordedMaterial([]);
    const status = tallyDecodingStatus(replayRecordedMaterial(material));
    const carried = material.fights.reduce((sum, fight) => sum + fight.messages.length, 0);
    assertStrictEquals(status.messages, carried, "the messages the files state are the ones read");
    assertStrictEquals(status.recordings, material.fights.length);
    assertEquals(
        [...status.eventsByKind.keys()].sort(),
        Object.values(BATTLE_EVENT).sort(),
        "a kind that never occurred is a nought, not a missing line",
    );
});

Deno.test("an unread key is counted per occurrence, and a cause names no key", () => {
    const replayed = replayShort();
    const unread = (cause: typeof UNREAD_CAUSE[keyof typeof UNREAD_CAUSE], keys: string[]) => ({
        kind: BATTLE_EVENT.unknownMessage,
        message: "",
        unreadCause: cause,
        unreadKeys: keys,
        combatantIds: [],
    });
    const events: BattleEvent[] = [
        unread(UNREAD_CAUSE.unknownKey, ["zeta", "alpha", "zeta"]),
        unread(UNREAD_CAUSE.unknownKey, ["alpha"]),
        unread(UNREAD_CAUSE.grammarRefused, []),
        unread(UNREAD_CAUSE.noParameter, []),
    ];
    const view = { ...replayed.reading.view, events: [...replayed.reading.view.events, ...events] };
    const status = tallyDecodingStatus([{ ...replayed, reading: { ...replayed.reading, view } }]);
    assertStrictEquals(status.messagesWithUnread, 4, "each message once, whatever it carried");
    assertStrictEquals(status.messagesRefused, 1, "a refusal apart");
    assertStrictEquals(status.messagesWithoutParameter, 1, "and an empty one apart from that");
    assertEquals(status.unreadKeysByFrequency, [["alpha", 2], ["zeta", 2]], "ties by key");
});

function replayShort(): ReplayedFight {
    const material = { material: SHORT, fights: [lookupRecordedFight(SHORT)] };
    const [replayed] = replayRecordedMaterial(material);
    return replayed!;
}

Deno.test("a recording stating no snapshot is named, and a material with none says so", () => {
    const replayed = replayShort();
    const whole = { material: SHORT, fights: [replayed.fight] };
    const lines = formatStatusReport(whole, [replayed]);
    assertStrictEquals(lines[0], `material          ${SHORT}`);
    assert(lines.includes("no snapshot             0"), "a count of none is printed");
    assert(lines.includes("  every recording states one"));
    assert(lines.includes("  every key was read"));
    const shelved = { ...replayed.fight, hasSnapshot: false };
    const named = formatStatusReport({ material: SHORT, fights: [shelved] }, [replayed]);
    assert(named.includes("no snapshot             1"), "one is counted");
    assert(named.includes("  2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none"), "and named");
});
