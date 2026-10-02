/**
 * The fight a panel is drawn from and a file is written from, live or kept: its view and the
 * figures tallied from it (`docs/design.md` §6.5, §10.4). A kept fight is replayed through the
 * chain the live one goes through, from the payloads the shelf kept, so its figures are this
 * version's rather than the version that watched it (`develop ADR 0026`).
 */

import { assert } from "@std/assert/assert";
import type { DecoderTables } from "#/src/core/fight-decoder.ts";
import {
    type FightFigures,
    tallyFightFigures,
    verifyFightFigures,
} from "#/src/core/fight-figures.ts";
import {
    commitPayload,
    composeFightView,
    createFightSession,
    type FightView,
    type PayloadRejected,
    preparePayload,
    type SessionOptions,
} from "#/src/core/fight-session.ts";
import { type EnvelopeFailure, readPayloadEnvelope } from "#/src/game/payload-envelope.ts";
import { CALLS_MAXIMUM } from "#/src/game/fight-capture.ts";
import { KEPT_MAXIMUM, type KeptFight } from "./shelf.ts";

export interface FightState {
    view: FightView;
    figures: FightFigures;
}

export interface KeptFightState extends FightState {
    /** One entry per payload replayed: the messages the envelope took back out of it. */
    messagesByPayload: readonly (readonly string[])[];
}

/** A kept payload the chain will not read costs the whole fight: a gap mid-fight reads as whole. */
export type ReplayFailure = EnvelopeFailure | PayloadRejected;

/** The fight the panel stands on, and the kept one it was read off where that is what it is. */
export type ShownFight =
    | { keptFight: null; fightState: FightState }
    | { keptFight: KeptFight; fightState: KeptFightState };

/** The figures, derived rather than kept, and verified in the one place they are balanced. */
export function tallyFightState(view: FightView): FightState {
    const figures = tallyFightFigures(view);
    verifyFightFigures(figures);
    assert(figures.payloadsApplied === view.payloadsApplied, "tallied off the view it was handed");
    return { view, figures };
}

/** Null where the kept payloads opened no fight, which is no fight to stand on. */
export function replayKeptFight(
    fight: KeptFight,
    tables: DecoderTables,
    options: SessionOptions,
): KeptFightState | null | ReplayFailure {
    assert(fight.payloads.length > 0, "a fight kept was kept from something");
    return replayFightPayloads(fight.payloads, tables, options);
}

/**
 * Calls as the engine was handed them, thinned as a file and the shelf keep them, walked through
 * the chain the live fight goes through. A tool reading a recording comes in here too, so there is
 * one way a call becomes a fight.
 */
export function replayFightPayloads(
    payloads: readonly unknown[],
    tables: DecoderTables,
    options: SessionOptions,
): KeptFightState | null | ReplayFailure {
    assert(payloads.length <= CALLS_MAXIMUM, "a fight replayed is inside a recording's bound");
    const session = createFightSession(options);
    const messagesByPayload: (readonly string[])[] = [];
    for (const payload of payloads) {
        const record = readPayloadEnvelope(payload);
        if (record instanceof Error) return record;
        const prepared = preparePayload(session, record, tables);
        if (prepared instanceof Error) return prepared;
        commitPayload(session, prepared);
        messagesByPayload.push(record.messages);
    }
    const view = composeFightView(session);
    if (view === null) return null;
    return { ...tallyFightState(view), messagesByPayload };
}

/**
 * The kept fight the reader chose, else the live one; a page between fights has no live reading,
 * and the newest kept fight is what it has instead (`develop ADR 0033`). Null where there is
 * nothing to stand on, or where the kept fight no longer reads (a panel of zeroes is a claim).
 */
export function lookupShownFight(
    liveFightState: FightState | null,
    chosenFightOpenedAt: number | null,
    fights: readonly KeptFight[],
    lookupKeptFightState: (fight: KeptFight) => KeptFightState | null,
): ShownFight | null {
    const keptFight = lookupShownKeptFight(liveFightState, chosenFightOpenedAt, fights);
    if (keptFight !== undefined) {
        const keptFightState = lookupKeptFightState(keptFight);
        if (keptFightState === null) return null;
        return { keptFight, fightState: keptFightState };
    }
    if (liveFightState === null) return null;
    return { keptFight: null, fightState: liveFightState };
}

/**
 * Which kept fight the panel stands on, read or not: the one chosen, or the newest where no fight
 * is going on. Undefined where the panel stands on the live fight, or on nothing.
 */
export function lookupShownKeptFight(
    liveFightState: FightState | null,
    chosenFightOpenedAt: number | null,
    fights: readonly KeptFight[],
): KeptFight | undefined {
    assert(fights.length <= KEPT_MAXIMUM, "a shelf walked is inside its stated bound");
    const chosen = chosenFightOpenedAt === null
        ? undefined
        : fights.find((one) => one.openedAt === chosenFightOpenedAt);
    return chosen ?? (liveFightState === null ? lookupNewestFight(fights) : undefined);
}

function lookupNewestFight(fights: readonly KeptFight[]): KeptFight | undefined {
    let newest: KeptFight | undefined;
    for (const one of fights) {
        if (newest === undefined) newest = one;
        else if (one.openedAt > newest.openedAt) newest = one;
    }
    if (newest !== undefined) assert(fights.includes(newest), "the newest is one of the shelf's");
    else assert(fights.length === 0, "only an empty shelf names no newest");
    return newest;
}
