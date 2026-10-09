/**
 * The running fight on the game's page, and the wrap of its `updateData` (`docs/design.md` §5,
 * §10.2). What the wrap promises the page is `SECURITY.md`'s, under "The reading boundary", and is
 * carried over from `develop`. The engine itself is found here, and what it holds of its map and
 * its hero is read here for every adapter.
 */

import * as errors from "#/libs/errors.ts";
import {
    type FieldKeys,
    getRecordField,
    isRecord,
    type UnknownRecord,
} from "#/libs/unknown-value.ts";
import {
    type MargonemEngineWarriorFailure,
    type MargonemEngineWarriorSnapshot,
    readMargonemEngineWarriorSnapshot,
} from "./margonem-engine-warriors.ts";

export class MargonemEngineAbsent extends Error {
    override readonly name = "MargonemEngineAbsent";
}

export class MargonemEngineBattleAbsent extends Error {
    override readonly name = "MargonemEngineBattleAbsent";
}

export class MargonemEngineMethodAbsent extends Error {
    override readonly name = "MargonemEngineMethodAbsent";
}

/**
 * The method will not take a write of ours, or does not hand it back: a property the page will not
 * let be written, a setter that throws, or a getter answering something else. At the wrap the
 * engine's own is put back, so no second layer goes on at the next look; at the detach ours stays.
 * The cause is what the page threw, and null where it threw nothing.
 */
export class MargonemEngineMethodUnwritable extends Error {
    override readonly name = "MargonemEngineMethodUnwritable";

    constructor(cause: errors.Caught | null) {
        super(undefined, { cause });
    }
}

/** A wrap of ours already stands: another copy of the add-on is reading this fight. */
export class MargonemEngineAlreadyWrapped extends Error {
    override readonly name = "MargonemEngineAlreadyWrapped";
}

/**
 * The looking ended with no game found: at its bound, or at once where the page will not start the
 * timer, whose refusal is the cause. Null where the looks ran out.
 */
export class SearchAbandoned extends Error {
    override readonly name = "SearchAbandoned";
    readonly looks: number;
    readonly maximum: number;

    constructor(looks: number, maximum: number, cause: errors.Caught | null) {
        super(undefined, { cause });
        this.looks = looks;
        this.maximum = maximum;
    }
}

export class WrapCovered extends Error {
    override readonly name = "WrapCovered";
}

type MargonemEngineHeldMember = "map" | "hero";
type HeldField = "data";

export type MargonemEngineFailure =
    | MargonemEngineAbsent
    | MargonemEngineBattleAbsent
    | MargonemEngineMethodAbsent
    | MargonemEngineMethodUnwritable
    | MargonemEngineAlreadyWrapped
    | SearchAbandoned
    | WrapCovered;

/** Called in the game's stack. */
export interface PayloadListener {
    onBeforeCall(): void;
    onPayload(payload: unknown): void;
}

export interface WrapHandle {
    /** Puts back what was there, and only where ours is still the outermost layer. */
    detach(): undefined | MargonemEngineFailure;
    /** Failures of ours the wrap caught: the listener guards itself, so this is what escaped. */
    getFailureCount(): number;
    getFirstFailure(): errors.Caught | null;
}

export interface MargonemEngineBattle {
    wrap(listener: PayloadListener): WrapHandle | MargonemEngineFailure;
    readWarriors():
        | MargonemEngineWarriorSnapshot
        | MargonemEngineWarriorFailure
        | errors.Caught;
}

/** What the game answered, and whether any spelling of it was there to ask. */
export interface MargonemEngineAnswer<Answer> {
    answer: Answer | null;
    hasEngine: boolean;
}

export interface MargonemEngineBattlePort {
    readBattle(): MargonemEngineBattle | MargonemEngineFailure | errors.Caught;
}

/** Both spellings are in the wild, and a client renaming either breaks both readers at once. */
const ENGINE_FIELD = "Engine";
const ENGINE_CALL_FIELD = "getEngine";
const BATTLE_FIELD = "battle";
/** Production build `1785244275300`: `on_f` ends with `Engine.battle.updateData(e, t)`. */
const WRAPPED_METHOD = "updateData";
/** The name is the contract, not the value: a wrap of ours from any build is a second count. */
const WRAP_MARKER = "__margometerBattleWrap";
const WRAP_VERSION = 1;
/** Past anything a fight produces: a wrap failing this often has stopped working. */
const FAILURES_MAXIMUM = 1048576;
/**
 * Production build `Bb28FQty`, fetched 2026-09-27, `this.getId=()=>this.d.id`, and v1's reading of
 * `53XkBRxF`, `Engine.map.d.name`: what the map and the hero hold is their member `d`.
 */
const ENGINE_FIELDS: FieldKeys<MargonemEngineHeldMember> = { map: "map", hero: "hero" };
const HELD_FIELDS: FieldKeys<HeldField> = { data: "d" };
/** Both spellings of the game a page holds, in the order they are asked. */
const ENGINE_ASKERS: readonly ((browserWindow: UnknownRecord) => unknown)[] = [
    (browserWindow) => browserWindow[ENGINE_FIELD],
    (browserWindow) => {
        const getEngine = browserWindow[ENGINE_CALL_FIELD];
        if (typeof getEngine !== "function") return null;
        return Reflect.apply(getEngine, browserWindow, []);
    },
];

/** The page's game, in whichever spelling answers. A call into the page may throw: theirs. */
export function initMargonemEngineBattle(browserWindow: unknown): MargonemEngineBattlePort {
    return {
        readBattle() {
            const asked = readMargonemEngineAnswer(browserWindow, lookupMargonemEngineBattle);
            if (asked instanceof errors.Caught) return asked;
            if (!asked.hasEngine) return new MargonemEngineAbsent();
            const battle = asked.answer;
            if (battle === null) return new MargonemEngineBattleAbsent();
            return {
                // Put the wrap on the engine's own method.
                wrap: (listener): WrapHandle | MargonemEngineFailure => {
                    // Read the engine's own method, and whether it is a wrap of ours: both reads
                    // are of the page's object, whose getter may throw.
                    const looked = errors.attempt(() => {
                        const method = battle[WRAPPED_METHOD];
                        return { method, isOurs: isOurWrap(method) };
                    });
                    if (looked instanceof errors.Caught) {
                        return new MargonemEngineMethodUnwritable(looked);
                    }
                    const original = looked.method;
                    if (typeof original !== "function") return new MargonemEngineMethodAbsent();
                    if (looked.isOurs) return new MargonemEngineAlreadyWrapped();
                    const failures: { count: number; first: errors.Caught | null } = {
                        count: 0,
                        first: null,
                    };
                    const recordFailure = (failure: errors.Caught): void => {
                        if (failures.count === FAILURES_MAXIMUM) return;
                        failures.count += 1;
                        if (failures.first === null) failures.first = failure;
                    };
                    // Two guards and not one: a throw before the call must not skip the reading
                    // after it.
                    const callEngineUpdate = function (
                        this: unknown,
                        ...engineArguments: unknown[]
                    ): unknown {
                        const before = errors.attempt(() => listener.onBeforeCall());
                        if (before instanceof Error) recordFailure(before);
                        const answer: unknown = Reflect.apply(original, this, engineArguments);
                        const after = errors.attempt(() => listener.onPayload(engineArguments[0]));
                        if (after instanceof Error) recordFailure(after);
                        return answer;
                    };
                    const wrapper = Object.assign(callEngineUpdate, {
                        [WRAP_MARKER]: WRAP_VERSION,
                    });
                    // ⚠️ A write the page refuses throws in strict code and is silent in the bundle's
                    // sloppy code, so it goes through `Reflect.set`, which does neither; and a wrap
                    // that does not read back is one the next look cannot see, and would go on
                    // again over it.
                    const isWrapStanding = errors.attempt((): boolean => {
                        void Reflect.set(battle, WRAPPED_METHOD, wrapper);
                        if (battle[WRAPPED_METHOD] === wrapper) return true;
                        void Reflect.set(battle, WRAPPED_METHOD, original);
                        return false;
                    });
                    if (isWrapStanding instanceof Error) {
                        return new MargonemEngineMethodUnwritable(isWrapStanding);
                    }
                    if (!isWrapStanding) return new MargonemEngineMethodUnwritable(null);
                    return {
                        detach() {
                            const detached = errors.attempt(() => {
                                if (battle[WRAPPED_METHOD] !== wrapper) return new WrapCovered();
                                if (Reflect.set(battle, WRAPPED_METHOD, original)) return undefined;
                                return new MargonemEngineMethodUnwritable(null);
                            });
                            if (detached instanceof errors.Caught) {
                                return new MargonemEngineMethodUnwritable(detached);
                            }
                            return detached;
                        },
                        getFailureCount: () => failures.count,
                        getFirstFailure: () => failures.first,
                    };
                },
                readWarriors() {
                    return errors.attempt(() => readMargonemEngineWarriorSnapshot(battle));
                },
            };
        },
    };
}

function lookupMargonemEngineBattle(engine: UnknownRecord): UnknownRecord | null {
    const battle = engine[BATTLE_FIELD];
    return isRecord(battle) ? battle : null;
}

function isOurWrap(engineMethod: unknown): boolean {
    if (typeof engineMethod !== "function") return false;
    return WRAP_MARKER in engineMethod;
}

/**
 * What the first spelling of the game answers, each asked under its own guard and in order: the
 * page's call only where the field gave no answer, so a call that throws never costs what the field
 * already said, and a page whose field answers is never called into. A throw is the answer only
 * where no spelling gave one.
 */
export function readMargonemEngineAnswer<Answer>(
    browserWindow: unknown,
    readEngine: (engine: UnknownRecord) => Answer | null,
): MargonemEngineAnswer<Answer> | errors.Caught {
    if (!isRecord(browserWindow)) return { answer: null, hasEngine: false };
    let hasEngine = false;
    let firstFailure: errors.Caught | null = null;
    for (const askEngine of ENGINE_ASKERS) {
        const asked = errors.attempt(() => {
            const engine = askEngine(browserWindow);
            if (!isRecord(engine)) return null;
            return { answer: readEngine(engine) };
        });
        if (asked instanceof errors.Caught) {
            firstFailure ??= asked;
            continue;
        }
        if (asked === null) continue;
        hasEngine = true;
        if (asked.answer !== null) return { answer: asked.answer, hasEngine };
    }
    // An engine some spelling found is what was said, whatever another spelling threw.
    if (hasEngine) return { answer: null, hasEngine };
    if (firstFailure !== null) return firstFailure;
    return { answer: null, hasEngine };
}

/** The battle a page's game holds, or null; a call into the page may throw, and it is theirs. */
export function readMargonemEngineBattle(
    browserWindow: unknown,
): UnknownRecord | null | errors.Caught {
    const asked = readMargonemEngineAnswer(browserWindow, lookupMargonemEngineBattle);
    if (asked instanceof errors.Caught) return asked;
    return asked.answer;
}

/** What one member of the engine holds, or null where it holds no record. */
export function readMargonemEngineRecord(
    engine: UnknownRecord,
    member: MargonemEngineHeldMember,
): UnknownRecord | null {
    const engineMember = getRecordField(engine, ENGINE_FIELDS, member);
    if (engineMember instanceof Error) return null;
    if (engineMember === null) return null;
    const memberRecord = getRecordField(engineMember, HELD_FIELDS, "data");
    if (memberRecord instanceof Error) return null;
    return memberRecord;
}
