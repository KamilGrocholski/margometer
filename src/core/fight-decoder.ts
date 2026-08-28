/**
 * Messages to what happened. The families below are the client's own and each is cited in
 * `docs/protocol-keys.md`; nothing is read because it looks like a number.
 *
 * The decoder drops nothing and invents nothing: a key with no meaning yet leaves the message
 * on an unknown event, keys and ends included, so a panel can say which total may be short.
 */

import { assert } from "@std/assert";
import type {
    AttackEvent,
    BattleEvent,
    DamageFigure,
    DestroyedStatistic,
    PreventedDamage,
} from "@/src/core/battle-event.ts";
import { MargoMeterError } from "@/src/core/margometer-error.ts";
import {
    type MessageParameter,
    parseProtocolMessage,
    type ProtocolMessage,
} from "@/src/core/protocol-message.ts";
import { getIntegerFromText } from "@/src/core/protocol-number.ts";

/**
 * The client's default branch reads characters 1 to 3 of a key: `+` is raw, the rest applied.
 */
const DAMAGE_MARKER = "dmg";
const DAMAGE_MARKER_AT = 1;
const RAW_SIGN = "+";
const APPLIED_SIGN = "-";
/** The one pair the family rule cannot reach, because the key carries no marker. */
const DAMAGE_KEYS = ["+thirdatt", "-thirdatt"];
const PREVENTED_KEYS = ["-absorb", "-absorbm", "-blok"];
const DESTROYED_KEYS = ["+acdmg", "+resdmg", "+abdest_per", "+abmdest_per"];
const PROC_KEYS = [
    "+crit",
    "+of_crit",
    "+pierce",
    "-pierceb",
    "+stun",
    "+stun2",
    "+stun2-c",
    "+stun2-d",
    "+freeze",
    "+wound",
    "+fastarrow",
    "+acdmg_destroyed",
    "+legbon_curse",
    "+legbon_verycrit",
    "-legbon_cleanse",
    "-legbon_glare",
    "+superspell-dispel",
    "-tenacity",
    "-evade",
    "-contra",
];
/** The longest message in `captures/` carries 40 parameters, 2026-08-28. */
const MAXIMUM_PARAMETERS = 512;
const UNREAD_REASON = "keys with no meaning yet";
const EMPTY_REASON = "a message stating no parameter";

interface AttackReading {
    raw: DamageFigure[];
    applied: DamageFigure[];
    prevented: PreventedDamage[];
    destroyed: DestroyedStatistic[];
    procs: string[];
    unreadKeys: string[];
}

function isDamageKey(key: string): boolean {
    assert(key.length > 0, "a key is never empty");
    if (DAMAGE_KEYS.includes(key)) return true;
    return key.slice(DAMAGE_MARKER_AT, DAMAGE_MARKER_AT + DAMAGE_MARKER.length) === DAMAGE_MARKER;
}

/** The client's own token: the key with its sign taken off. */
function getTokenFromKey(key: string): string {
    assert(key.length > 0, "a key is never empty");
    if (key.startsWith(RAW_SIGN)) return key.slice(1);
    if (key.startsWith(APPLIED_SIGN)) return key.slice(1);
    assert(!key.startsWith(RAW_SIGN), "a token carries no sign of its own");
    return key;
}

function composeAttackReading(parameters: readonly MessageParameter[]): AttackReading {
    assert(parameters.length <= MAXIMUM_PARAMETERS, "a message stays inside its stated bound");
    const reading: AttackReading = {
        raw: [],
        applied: [],
        prevented: [],
        destroyed: [],
        procs: [],
        unreadKeys: [],
    };
    for (const parameter of parameters) {
        if (parameter.value === null) {
            if (PROC_KEYS.includes(parameter.key)) reading.procs.push(parameter.key);
            else reading.unreadKeys.push(parameter.key);
            continue;
        }
        const amount = getIntegerFromText(parameter.value);
        if (amount === null) {
            reading.unreadKeys.push(parameter.key);
            continue;
        }
        const token = getTokenFromKey(parameter.key);
        if (isDamageKey(parameter.key)) {
            if (parameter.key.startsWith(RAW_SIGN)) reading.raw.push({ element: token, amount });
            else reading.applied.push({ element: token, amount });
        } else if (PREVENTED_KEYS.includes(parameter.key)) {
            reading.prevented.push({ defence: token, amount });
        } else if (DESTROYED_KEYS.includes(parameter.key)) {
            reading.destroyed.push({ statistic: token, amount });
        } else {
            reading.unreadKeys.push(parameter.key);
        }
    }
    const read = reading.raw.length + reading.applied.length + reading.prevented.length +
        reading.destroyed.length + reading.procs.length + reading.unreadKeys.length;
    assert(read === parameters.length, "every parameter is read or named unread, and none twice");
    assert(reading.raw.length <= parameters.length, "a reading holds no more than it was handed");
    return reading;
}

function hasAttackFigure(reading: AttackReading): boolean {
    if (reading.raw.length > 0) return true;
    if (reading.applied.length > 0) return true;
    if (reading.prevented.length > 0) return true;
    assert(reading.destroyed.length <= MAXIMUM_PARAMETERS, "a reading stays inside its bound");
    return reading.destroyed.length > 0;
}

function getNamedCombatantIds(parsed: ProtocolMessage): number[] {
    const found: number[] = [];
    if (parsed.actor !== null) found.push(parsed.actor.combatantId);
    if (parsed.target !== null) {
        if (!found.includes(parsed.target.combatantId)) found.push(parsed.target.combatantId);
    }
    assert(found.length <= 2, "a message names at most two ends");
    assert(new Set(found).size === found.length, "an end that is named twice is named once here");
    return found;
}

function composeAttackEvent(parsed: ProtocolMessage, reading: AttackReading): AttackEvent {
    assert(hasAttackFigure(reading), "an attack states a figure");
    assert(reading.unreadKeys.length <= MAXIMUM_PARAMETERS, "an event stays inside its bound");
    return {
        kind: "attack",
        actorId: parsed.actor?.combatantId ?? null,
        targetId: parsed.target?.combatantId ?? null,
        actorHealthPercent: parsed.actor?.healthPercent ?? null,
        targetHealthPercent: parsed.target?.healthPercent ?? null,
        raw: reading.raw,
        applied: reading.applied,
        prevented: reading.prevented,
        destroyed: reading.destroyed,
        procs: reading.procs,
    };
}

export function decodeFightMessage(message: string): BattleEvent[] {
    assert(message.length > 0, "a message to decode is never empty");
    let parsed: ProtocolMessage;
    try {
        parsed = parseProtocolMessage(message);
    } catch (failure) {
        if (!(failure instanceof MargoMeterError)) throw failure;
        return [{
            kind: "unknown-message",
            message,
            reason: failure.message,
            unreadKeys: [],
            combatantIds: [],
        }];
    }
    const reading = composeAttackReading(parsed.parameters);
    const events: BattleEvent[] = [];
    // A proc rides a blow in every message in `captures/` that carries one, 2026-08-28. Where
    // no figure stands beside it, the key is not read as one: a proc alone would be a claim
    // this decoder cannot make.
    if (!hasAttackFigure(reading)) reading.unreadKeys.push(...reading.procs);
    else events.push(composeAttackEvent(parsed, reading));
    const isUnread = reading.unreadKeys.length > 0;
    if (isUnread || events.length === 0) {
        events.push({
            kind: "unknown-message",
            message,
            reason: isUnread ? UNREAD_REASON : EMPTY_REASON,
            unreadKeys: reading.unreadKeys,
            combatantIds: getNamedCombatantIds(parsed),
        });
    }
    assert(events.length > 0, "a message decodes to something, even where nothing was read");
    assert(events.length <= 2, "a message decodes to at most one event of each kind");
    return events;
}
