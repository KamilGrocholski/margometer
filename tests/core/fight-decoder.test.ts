/**
 * The first decoding step, over the blows the recordings carry.
 *
 * Every sample is a transcript from the recording named beside it. The corpus test states what
 * holds over all of them, which is where a key family that stops being read would show.
 */

import { assert, assertEquals } from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { decodeFightMessage } from "@/src/core/fight-decoder.ts";
import { getRecordedMessages, getRecordingPaths } from "@/tests/recorded-fight.ts";

/** `2026-08-06-tempest-grupa-vs-hildur.json`: a blow absorption stood in front of. */
const ABSORBED =
    "467968=100.00;-10000249=99.69;+pierce;+dmgd=1557;+acdmg=16;-absorb=545;-dmgd=1012";
/** `2026-08-12-tempest-grupa-vs-draugr-1.json`: a blow carrying a key with no meaning yet. */
const UNREAD = "477718=100.00;-10000234=95.59;+dmgd=924;+dmgc=766;+acdmg=18;+taken_dmg=254;" +
    "-dmgd=291;-dmgc=295;-dmga=254";
/** `2026-08-12-experimental-tancerz-vs-wojownik.json`: the pair the family rule cannot reach. */
const THIRD_BLOW = "114881=80.80;195782=98.67;+dmg=1210;+dmgo=896;+thirdatt=1168;+acdmg=90;" +
    "-blok=363;-dmg=0;-thirdatt=59";

function getOnlyAttack(events: readonly BattleEvent[]): BattleEvent {
    assertEquals(events.length, 1, "the message decoded to one event");
    const event = events[0];
    assert(event !== undefined, "a list of one has a first member");
    assertEquals(event.kind, "attack", "and that event is a blow");
    return event;
}

Deno.test("a blow reads as raw, applied, and what a defence stopped", () => {
    const event = getOnlyAttack(decodeFightMessage(ABSORBED));
    if (event.kind !== "attack") return;
    assertEquals(event.actorId, 467968, "the actor is the message's own");
    assertEquals(event.targetHealthPercent, 99.69, "the target's health rides the blow");
    assertEquals(event.raw, [{ element: "dmgd", amount: 1557 }], "before reduction");
    assertEquals(event.applied, [{ element: "dmgd", amount: 1012 }], "after it");
    assertEquals(event.prevented, [{ defence: "absorb", amount: 545 }], "and what stopped 545");
    assertEquals(event.destroyed, [{ statistic: "acdmg", amount: 16 }], "armour is not damage");
    assertEquals(event.procs, ["+pierce"], "a proc states no figure");
});

Deno.test("the third blow is read by name, and a zero is a reading", () => {
    const event = getOnlyAttack(decodeFightMessage(THIRD_BLOW));
    if (event.kind !== "attack") return;
    assertEquals(event.raw.length, 3, "two damage keys and the pair with no marker");
    assertEquals(event.raw[2], { element: "thirdatt", amount: 1168 }, "raw, by name");
    assertEquals(event.applied[0], { element: "dmg", amount: 0 }, "nothing landed, and says so");
    assertEquals(event.applied[1], { element: "thirdatt", amount: 59 }, "applied, by name");
    assertEquals(event.prevented, [{ defence: "blok", amount: 363 }], "a block stopped 363");
});

Deno.test("a key with no meaning yet leaves the rest of the blow read", () => {
    const events = decodeFightMessage(UNREAD);
    assertEquals(events.length, 2, "the blow and what could not be read");
    const [attack, unread] = events;
    assert(attack?.kind === "attack", "the blow is still an event");
    assertEquals(attack.applied.length, 3, "every applied figure is read");
    assert(unread?.kind === "unknown-message", "and the unread key is its own event");
    assertEquals(unread.unreadKeys, ["+taken_dmg"], "named, one entry per occurrence");
    assertEquals(unread.combatantIds, [477718, -10000234], "with the ends the grammar stated");
});

Deno.test("a message the grammar refuses is an event, not a silence", () => {
    const events = decodeFightMessage("gracz;0;step");
    assertEquals(events.length, 1, "one event");
    const event = events[0];
    assert(event?.kind === "unknown-message", "the refusal reaches the panel as a reading");
    assertEquals(event.unreadKeys, [], "no key was reached, which is not a claim about keys");
    assertEquals(event.combatantIds, [], "and no end was read either");
    assert(event.reason.includes("side"), "the reason names the half that failed");
});

Deno.test("every message in every recording decodes, and the pairs hold", () => {
    let attacks = 0;
    let unread = 0;
    for (const path of getRecordingPaths()) {
        for (const message of getRecordedMessages(path)) {
            const events = decodeFightMessage(message);
            assert(events.length > 0, `${path}: a message decoded to nothing`);
            for (const event of events) {
                if (event.kind === "unknown-message") {
                    unread += 1;
                    continue;
                }
                attacks += 1;
                assertEquals(event.raw.length > 0, event.applied.length > 0, `${path}: ${message}`);
                if (event.procs.length === 0) continue;
                assert(event.raw.length > 0, `${path}: a proc rode nothing`);
            }
        }
    }
    assert(attacks > 0, "the recordings carry blows");
    assert(unread > attacks, "most of a fight is still unread, and the panel would say so");
});
