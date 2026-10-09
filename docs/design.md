# MargoMeter, rewritten: interfaces, signatures, process

**Status: the architecture the tree is built to.** This document is a design constraint, not
evidence that a feature exists (`AGENTS.md`, "Target is not proof"): a signature here that the code
does not match is a finding in one of the two. It owns the architecture — layers, ports, types, the
process and the failure map. The rules that bind the code are `AGENTS.md`'s, and this document cites
them rather than restating them.

The design was drawn on 2026-09-24 against `develop` @ `fa1dcce`. Every figure below that describes
the old tree was measured there, on that date.

## 1. Where this comes from

What the old tree does that this design does not, measured on `develop` @ `fa1dcce`:

- **A failure arrives in four shapes.** A `throw` (`ProtocolMessageFormatError`, the only subclass
  of `MargoMeterError`), an `assert` caught by one of 21 `try` blocks in `src/userscript-entry.ts`,
  a `null` from a reader, and an `isOk` union in three places (`JsonReading`, `JsonWriting`,
  `ShelfWriting`). Nothing checks that every failure met a fate.
- **`src/userscript-entry.ts` is 1925 lines** and holds the boot, the session, the shelf, the
  settings, the export, the drawing and the defects at once.
- **The panel redraws on every call to `updateData`** (`develop:src/userscript-entry.ts`), including
  the calls the game keeps making after a fight is over. On the first recording, thinning dropped
  565 of 569 calls for carrying nothing new (`develop:src/game/fight-capture.ts`).
- **Figures are recomputed from nothing on every draw**, not once per change.
- **`compose` starts 310 of the 680 functions in `src/` and `libs/`**, and means four things there:
  building a stateful object, a computation, building DOM, and composing Polish text.

What is carried over unchanged: the data contract `BattleEvent` (`develop:src/core/battle-event.ts`,
and changing it is `[ASK]`), the wrap semantics (the original first, its value untouched, one
layer), the recording file format (§11) and the boundaries of `AGENTS.md`'s error rules.

## 2. Principles

TigerStyle, translated to an add-on that is a guest in somebody else's page. The binding form of
each is the `AGENTS.md` rule named beside it.

| #  | Principle                                 | What it means here                                                                                                                                                                                         |
| -- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1 | Two kinds of error.                       | A failure that can happen is returned beside the value; a broken invariant is an assertion. `AGENTS.md` E1–E4.                                                                                             |
| T2 | A limit on everything.                    | Every collection states a maximum, and capacities are fixed when a fight opens. S11.                                                                                                                       |
| T3 | In somebody else's stack, only what must. | In the game's stack: reading the envelope, copying for the file, `preparePayload`/`commitPayload`. The cost is bounded by the message count; nothing throws past `errors.attempt`. No drawing.             |
| T4 | A deterministic core.                     | `core/` is pure transitions `(state, input) → value \| failure`. All I/O goes through ports, so a simulator replays recordings with injected faults — the VOPR idea.                                       |
| T5 | Parse, don't validate.                    | A value from the game becomes a type of ours at the edge in `ports/`, which checks its bounds once. E1.                                                                                                    |
| T6 | Explicit control flow.                    | A failure comes back beside the value, and every call site branches on it. E2, S1.                                                                                                                         |
| T7 | Absent in the protocol is not a failure.  | `null` is what the protocol did not state; a failure is a reading that failed. E6.                                                                                                                         |
| T8 | Batch where the cost is.                  | A payload and a click only mark the panel stale. One scheduled frame computes and draws once, however many changes arrived. There is no queue, because there is nothing to hold in one.                    |
| T9 | State changes where they are seen.        | A step that changes state is read in its caller, in the order it runs, and what is pulled out into a function of its own is pure: Carmack's inlining, with D's strengths of purity. `AGENTS.md` S4, P1–P4. |

## 3. Foundation: `libs/`

`libs/` knows nothing of the game or of this project's layers.

```ts
// libs/errors.ts — imported as `import * as errors`, and holding only what the tree calls (ADR 0008)
/** What a `catch` held, whatever was thrown, as the `cause`. */
export class Caught extends Error {
    override readonly name = "Caught";
    constructor(cause: unknown);
}
/** `unknown | Caught` is `unknown`: a call answering `unknown` or `any` narrows inside the call. */
export type Known<Value> = unknown extends Value ? never : Value;
/** The one broad catch: a call into code we did not write, or ours at a boundary. */
export function attempt<Value>(call: () => Value): Known<Value> | Caught;

// libs/vocabulary.ts: a vocabulary is an object, its type and its list derived (ADR 0001)
export type VocabularyWord<Vocabulary extends Readonly<Record<string, string>>> =
    Vocabulary[keyof Vocabulary];
export function isOneOf<const Words extends readonly string[]>(
    words: Words,
    candidate: unknown,
): candidate is Words[number];

// libs/unknown-value.ts
/** Read-only: a write into the game's object through this type does not compile. */
export interface UnknownRecord {
    readonly [key: string]: unknown;
}
/** `typeof` alone admits `null` and arrays here, and the answer must be read-only. */
export function isRecord(candidate: unknown): candidate is UnknownRecord;

/** Keys are the game's, fields are ours: the same map as `ENVELOPE_KEYS` (§7). */
export type FieldKeys<Field extends string> = { readonly [Name in Field]: string };
export const FIELD_TYPE = {
    number: "number",
    text: "text",
    statedText: "stated-text",
    record: "record",
    list: "list",
} as const;
export type FieldType = VocabularyWord<typeof FIELD_TYPE>;
export class FieldWrongType<Field extends string> extends Error {
    override readonly name = "FieldWrongType";
    readonly field: Field;
    readonly expected: FieldType;
}
export class FieldTooLong<Field extends string> extends Error {
    override readonly name = "FieldTooLong";
    readonly field: Field;
    readonly count: number;
    readonly maximum: number;
}
export type FieldFailure<Field extends string> = FieldWrongType<Field> | FieldTooLong<Field>;

/** An absent field is `null`, a fact. A field of the wrong type is a failure, named as ours. */
export function getNumberField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
): number | null | FieldWrongType<Field>;
export function getTextField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
): string | null | FieldWrongType<Field>;
export function getStatedTextField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
): string | null | FieldWrongType<Field>;
export function getRecordField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
): UnknownRecord | null | FieldWrongType<Field>;
/** A longer list is a failure, never a truncation. */
export function getListField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
    maximum: number,
): readonly unknown[] | null | FieldFailure<Field>;

// libs/json-text.ts
/** One level deep, the level a caller branches on, and one an `Error` does not fit. */
export type JsonValue = null | boolean | number | string | readonly unknown[] | UnknownRecord;
/** The `Caught` of `JSON.parse` as its `cause`. */
export class JsonUnreadable extends Error {
    override readonly name = "JsonUnreadable";
}
/** The `Caught` of `JSON.stringify` as its `cause`, or `null` for a value with no JSON text. */
export class JsonUnwritable extends Error {
    override readonly name = "JsonUnwritable";
}
export function parseJson(text: string): JsonValue | JsonUnreadable;
export function encodeJson(
    encodable: unknown,
    indentSpaces: number,
): string | JsonUnwritable;

// libs/number-text.ts — one reason to fail each, so `null`
export function parseInteger(text: string): number | null; // digits, optional minus, safe integer
export function parseDecimal(text: string): number | null; // digits, a point, digits; no sign
export function formatInteger(integer: number): string;
export function formatDecimal(decimal: number, places: number): string;

// libs/number-range.ts
/** Unlike the usual clamp: where `maximum < minimum` the minimum wins. */
export function clampNumber(number: number, minimum: number, maximum: number): number;

// libs/text-walk.ts — walking text: isDigitAt, isWhitespaceAt, lookupEndOfRun, isDigitRun,
// lookupQuotedLiteral, and the bounds each walk carries
// libs/html-text.ts — markup read as the words a person would have seen in it
export function decodeHtmlText(html: string): string;
```

The order a ranking is drawn in is the panel's, not a library's: `calculateRankedOrder` in
`src/ui/ranked-order.ts`.

What is deliberately **not** here:

- **No `isFiniteNumber`, `isText` or `isStatedText`.** `typeof value === "string"` narrows on its
  own. `Number.isFinite(value)` does **not** narrow `unknown` — checked with `deno check` on
  2026-09-24: `TS18046 'value' is of type 'unknown'` — so a number needs `typeof` first. That pair
  stands once, inside `getNumberField`, and code outside the adapters reads fields through
  `get…Field` rather than bare values.
- **No `getOwnFromRecord`.** `get…Field` reads own properties only (`Object.hasOwn`, ES2022), so
  `constructor` or `toString` off the prototype is never an answer. On `develop` that protection
  reached 8 call sites that remembered to ask for it.
- **No bounded queue.** §10 says why nothing waits in one.

## 4. Layers

```
frozen/                   the game's published tables, dated readings `deno task margonem:readings`
                          writes (ADR 0005, `frozen/AGENTS.md`)
libs/                     errors, vocabulary, readers of text, numbers, JSON, markup, unknown values
src/core/                 grammar → decoder → session → figures → standings (pure, deterministic)
src/ports/                ports over Margonem and the browser: engine, warriors, envelope, store,
                          place, dictionary, tooltip, file
src/runtime/              the frame, defects, settings, shelf, export
src/ui/                   reading → DOM; throws nothing, asserts nothing; gestures → intents
src/userscript-entry.ts   composing the ports and starting; nothing else
```

Dependencies point one way: `core → libs`; `ports → core, libs`; `ui → core, libs`, where what
`ports` and `ui` take from core is its types and the bounds and vocabularies it owns;
`runtime → everything below it`; the entry → `runtime`, `ports`, `ui`, `core` and `frozen/`, which
is the one layer holding a frozen reading and handing it on. `libs/` and `frozen/` import no layer.

## 5. Ports

A port is an interface over something this program does not control. A port has a real
implementation over the page and a simulated one (§12), which is what earns it an interface
(`AGENTS.md` I1). The engine and the dictionary are the exception: they are simulated one step
lower, by a page of the test's own under the real adapter (`tests/runtime-world.ts`), because the
adapter is what a recording has to pass through. What earns their interfaces is I2: each describes
an object an `init…` builds, which holds what it wraps.

```ts
// Time and the frame
export interface BrowserClock {
    /** Read under `errors.attempt`: a now that is no whole millisecond past nought is a `Caught`. */
    readNowMilliseconds(): number | errors.Caught;
    /**
     * The reader's own day and time, or null where the page's `Date` will not read one. Asked only
     * of a moment `readNowMilliseconds` or the shelf stated.
     */
    readMoment(atMilliseconds: number): BrowserMoment | null;
    /** The moment as a file states it, in the page's own ISO 8601. */
    readTimestampText(atMilliseconds: number): string | errors.Caught;
}
/**
 * The page's `requestAnimationFrame`. A hidden tab gets no frames, and nobody is looking at it. The
 * step is guarded where it is handed over (E10), as the interval's is.
 */
export interface BrowserFrameScheduler {
    requestFrame(
        step: () => void,
        onStepFailure: (failure: errors.Caught) => void,
    ): FrameHandle | errors.Caught;
}
export interface FrameHandle {
    cancel(): void | errors.Caught;
}
/**
 * The page's `setInterval`, for the search for the engine (§10.1). The step is guarded where it is
 * handed over (E10), and its failure goes to `onStepFailure` rather than into the browser's timer.
 */
export interface BrowserIntervalScheduler {
    every(
        step: () => void,
        everyMilliseconds: number,
        onStepFailure: (failure: errors.Caught) => void,
    ): IntervalHandle | errors.Caught;
}
export interface IntervalHandle {
    cancel(): void | errors.Caught;
}

// The engine
export interface MargonemEngineBattlePort {
    readBattle(): MargonemEngineBattle | MargonemEngineFailure | errors.Caught;
}
export interface MargonemEngineBattle {
    wrap(listener: PayloadListener): WrapHandle | MargonemEngineFailure;
    readWarriors():
        | MargonemEngineWarriorSnapshot
        | MargonemEngineWarriorFailure
        | errors.Caught;
}
/** Called in the game's stack. */
export interface PayloadListener {
    onBeforeCall(): void;
    onPayload(payload: unknown): void;
}
export interface WrapHandle {
    detach(): undefined | MargonemEngineFailure;
    getFailureCount(): number; // the listener guards itself; this counts what escaped it
    getFirstFailure(): errors.Caught | null; // what a defect carries
}
// Each a class of its own, `extends Error`, with a `name` spelled as the class is.
export type MargonemEngineFailure =
    | MargonemEngineAbsent // neither spelling answered
    | MargonemEngineBattleAbsent
    | MargonemEngineMethodAbsent // the method's name is spelled by the adapter alone
    | MargonemEngineMethodUnwritable // a write the page refused or threw on: at the wrap the engine's
    //                                  own is put back, at the detach ours stays; cause: Caught | null
    | MargonemEngineAlreadyWrapped // another copy's wrap marker is present
    | SearchAbandoned // `looks` and `maximum`; cause: the timer's refusal, null at the bound
    | WrapCovered; // somebody wrapped over us; only ours comes off

// The game's page state, read
export interface MargonemEnginePlacePort {
    readPlace(): FightPlace | MargonemReadFailure;
}
/** The hero's id, which is how the client keys its own warrior in a fight (ADR 0014). */
export interface MargonemEngineHeroPort {
    readHeroId(): number | MargonemReadFailure;
}
export interface MargonemClientDictionaryPort {
    /** The category is the client's own filing: a status is filed under `buff`. */
    readLabel(labelId: string, category?: string): string | MargonemReadFailure;
}
export interface MargonemClientBuildPort {
    readBuildId(): string | MargonemReadFailure;
}
/** `MargonemValueAbsent` names the reading: "place", "hero", "label" or "build". */
export type MargonemReadFailure = MargonemValueAbsent | errors.Caught;

// The one write into the game: rows of its tooltip, every fighter the page draws at once
export interface MargonemEngineTooltipPort {
    /**
     * An empty list takes the block off. The writer remembers the block it left on each fighter
     * and forgets a fighter the page no longer draws, so a rebuilt tooltip takes it once again.
     */
    writeRows(
        rowsByCombatantId: ReadonlyMap<number, readonly string[]>,
    ): TooltipWritten | MargonemEngineWarriorsExceeded | errors.Caught;
}
/** A client that renamed a method throws nothing, so `refused` is the only sign of it. */
export interface TooltipWritten {
    written: number;
    refused: number; // drawn fighters asked for a block whose tooltip would not take one
}

// Browser storage
export interface KeyValueStore {
    read(key: StoreKey): string | null | StoreFailure; // null: no such key, a fact
    write(key: StoreKey, storedText: string): undefined | StoreFailure;
    delete(key: StoreKey): undefined | StoreFailure;
}
export const STORE_KEY = {
    fights: "MargoMeter-fights",
    meterFolded: "MargoMeter-meter-folded",
    meterPosition: "MargoMeter-meter-position",
    helperFolded: "MargoMeter-helper-folded",
    helperPosition: "MargoMeter-helper-position",
    storage: "MargoMeter-storage",
    typeStep: "MargoMeter-type-step",
    meterSize: "MargoMeter-meter-size",
    helperSize: "MargoMeter-helper-size",
} as const;
export type StoreKey = VocabularyWord<typeof STORE_KEY>;
export type StoreFailure =
    | StoreUnavailable
    | StoreRefused // a quota refusal is an answer; the `Caught` is its `cause`
    | StoreValueTooLong; // `length` and `maximum`

// Where a recording was taken, beyond the fight
export interface BrowserSurroundingsPort {
    readWorld(): string; // the host's first label, or `unknown`, never ""
    readUserAgent(): string | null;
}

// A file and the console
export interface BrowserFileSink {
    /** The address is released on the browser's clock, so its failure arrives later, apart. */
    writeFile(
        name: string,
        text: string,
        onLateFailure: (failure: errors.Caught) => void,
    ): undefined | FileFailure;
}
export type FileFailure = FileApiAbsent | errors.Caught;
/** Once per kind of defect. */
/** The kind is handed in as text: `ports/` imports nothing of the runtime's (§4). */
export interface BrowserConsolePort {
    writeBrandedLine(kind: string, detail: unknown): void;
}
```

## 6. Core: pure transitions

### 6.1 Grammar

```ts
export function parseProtocolMessage(text: string): ProtocolMessage | GrammarRefusal;
export type GrammarRefusal =
    | SegmentsExceeded // `segments` and `maximum`
    | EndUnreadable // `end`: "actor" or "target"
    | ParameterKeyEmpty; // `index`
```

A message the grammar refuses is returned, never thrown: the decoder turns the refusal into a
message it could not read.

### 6.2 Decoder

```ts
export interface DecoderTables {
    blowsGrantedBySkillId: ReadonlyMap<number, number>;
}
/** `null`: no announcement reaches the next message. */
export type AnnouncementStanding = StandingAnnouncement | null;
export interface DecodeContext {
    roster: CombatantRoster | null;
    announcementStanding: AnnouncementStanding;
    tables: DecoderTables;
}

export function decodeMessage(
    text: string,
    context: DecodeContext,
): MessageDecoded | UnreadMessage;
export interface MessageDecoded {
    events: readonly BattleEvent[];
    announcementStanding: AnnouncementStanding;
}
/** A class, `name` "UnreadMessage", holding the reading below; `cause` stays the lower failure's. */
export interface UnreadDetails {
    unreadCause: UnreadCause;
    keys: readonly string[];
    combatantIds: readonly number[];
    text: string;
    /** What was read beside the unread keys, so a blow with a new proc keeps its damage. */
    events: readonly BattleEvent[];
    announcementStanding: AnnouncementStanding;
}

/** `src/core/protocol-key.ts`: the one owner of what a key means. `null` is `unknown-key`. */
export function lookupKeyMeaning(key: string): KeyMeaning | null;

/** The envelope has bounded the message count already; here it is asserted. */
export function decodePayloadMessages(
    texts: readonly string[],
    context: DecodeContext,
): PayloadDecoded;
export interface PayloadDecoded {
    events: readonly BattleEvent[];
    unread: readonly UnreadMessage[];
    announcementStanding: AnnouncementStanding;
}
```

An `UnreadMessage` is one message's failure, a class of its own like any other, and its fate differs
from a defect's (`shown-as-suspect`, §10.5): the session records it as a fact — counted, and shown
as a suspect — so the payload as a whole succeeds. A message with too many segments is one of them
(`GrammarRefusal`), because the count comes off the game's text. `UnknownMessageEvent` stays in
`BattleEvent`, and `decodePayloadMessages` puts one after the events an `UnreadMessage` carries,
which is where `develop` puts it.

The standing a payload ends on is handed back. `develop` starts every call from none, so a session
that hands it into the next call draws different figures (`AGENTS.md` W8).

### 6.3 Roster

```ts
/** The envelope has bounded the cast and refused a repeated id already; here both are asserted. */
export function indexCombatantRoster(combatants: readonly Combatant[]): CombatantRoster;
/** `null`: ambiguous, or nobody. */
export function lookupCombatantIdByName(roster: CombatantRoster, name: string): number | null;
```

### 6.4 The fight session

A state machine whose transition runs in two phases, as TigerBeetle's `prepare` and `commit` do:
every read and every computation first, then one write. A payload lands whole or not at all: an
assertion that fires while preparing leaves the session untouched, because the write never ran.

```ts
export const SESSION_PHASE = { waiting: "waiting", underway: "underway", over: "over" } as const;
export type SessionPhase = (typeof SESSION_PHASE)[keyof typeof SESSION_PHASE];
/** A record the four functions below read and write; nothing else writes to it. */
export interface FightSession {
    readonly options: SessionOptions;
    state: SessionState | null; // null: no payload yet
    events: BattleEvent[];
}
export function createFightSession(options: SessionOptions): FightSession;
export function getSessionPhase(session: FightSession): SessionPhase;
/** A reading: the arrays are the session's own, typed read-only, and nothing here writes (S9). */
export function composeFightView(session: FightSession): FightView | null;
/** Phase one: reads and computations, the session untouched. */
export function preparePayload(
    session: FightSession,
    record: PayloadRecord,
    tables: DecoderTables,
): PreparedPayload | PayloadRejected;
/** Phase two: the write alone. Nothing here can fail but an assertion. */
export function commitPayload(session: FightSession, prepared: PreparedPayload): PayloadCommitted;

export interface PreparedPayload {
    readonly payloadIndex: number; // what the standing it was read against had applied
    readonly isOpening: boolean; // `init`, or the first payload the session sees
    readonly decoded: PayloadDecoded;
    readonly stateAfter: SessionState; // everything but the events, which commit appends
}
export interface PayloadCommitted {
    hasOpened: boolean;
    hasClosed: boolean;
    eventsAdded: number;
    unreadAdded: number;
}
/**
 * A fight past a bound the options or the figures state, each stating its `count` and `maximum`;
 * what stands is left whole. `CombatantsExceeded` counts everybody the fight has named: seated by
 * the envelope, at either end of a message or on the announcement it rides, or carrying a mask or a
 * charge. `CutKeysExceeded` counts every name a cut of the figures is kept under, and
 * `SkillsExceeded` every skill announced, against the figures' own `CUT_MAXIMUM` and
 * `SKILLS_MAXIMUM`: the game may spell a new element or a new skill in any message.
 */
export type PayloadRejected =
    | CombatantsExceeded
    | CutKeysExceeded
    | EventsExceeded
    | PayloadsExceeded
    | SkillsExceeded;

/** What the envelope hands the session. Core owns the type because core reads it (§4). */
export interface PayloadRecord {
    isInit: boolean;
    isEnd: boolean;
    messages: readonly string[];
    messagesStated: number | null; // the length of `mi`; null where it is absent, never zero
    readerSide: number | null;
    isOnAuto: boolean | null;
    turnStatement: TurnStatement | null; // the queue's least entry, the only one it states
    combatants: readonly Combatant[];
    statusMasksByCombatantId: ReadonlyMap<number, number>;
    chargeStatements: readonly ChargedSkillStatement[];
}

/** `develop`'s `FightState`, same content. */
export interface FightView {
    roster: CombatantRoster;
    events: readonly BattleEvent[];
    unread: UnreadCounts;
    messagesLost: number;
    messagesRead: number;
    hasJoinedInProgress: boolean;
    isOver: boolean;
    readerSide: number | null;
    turnStatement: TurnStatement | null;
    isOnAuto: boolean;
    payloadsApplied: number;
    chargedSkills: readonly ChargedSkillStanding[];
    carriedStatuses: readonly CarriedStatus[];
    legendaryStandings: readonly LegendaryStanding[];
    turnsByCombatantId: ReadonlyMap<number, number>;
    eventsAtSeatingByCombatantId: ReadonlyMap<number, number>; // the events held when first seated
}
export interface SessionOptions {
    eventsMaximum: number;
    payloadsMaximum: number;
    combatantsMaximum: number;
}
```

A payload arriving before `init` is read, as `develop` reads it: it opens a fight marked joined in
progress, and `hasJoinedInProgress` is the suspect the reader sees. No recording begins that way (0
of 35, 2026-09-24); a reader reloading mid-fight does. The carried statuses, the legendary bonuses
and the charges are walks `prepare…` computes as new values, so preparing touches nothing.

### 6.5 Figures

```ts
export function tallyFightFigures(view: FightView): FightFigures;
/** The balances in one place: assertions only. */
export function verifyFightFigures(figures: FightFigures): void;
export interface FightFigures {
    statistics: FightStatistics;
    sideHealByEvent: ReadonlyMap<BattleEvent, SideHeal>;
    payloadsApplied: number;
}
```

Tallying returns figures, never a failure. Every way it could fail — a cut, a skill list or a proc
list past its bound — ends where a broken invariant ends, in the "reading" defect `errors.attempt`
leaves, so a failure class would add code on every path and change no outcome. The bounds are
asserted.

The balances — dealt, dealt against its two parts, restored, half-named and the rest — stay
assertions, because they are invariants rather than failures. The two parts are health and what a
pool absorbed, and a defence's pool or chance, and the elements a pool takes from, are
`src/core/protocol-key.ts`'s to say (ADR 0012, ADR 0045). A disagreement that _can_ happen
(`hasFiguresDisagreed`) stays data.

A live fight's figures are tallied again each frame (§10.4), and nothing holds them between frames.
They are not folded in as payloads arrive: sizing a team heal reads messages from later payloads.

### 6.6 Standings

```ts
/** As tallying: the bounds are asserted, and a broken one is the frame step's defect. */
export function replayAuraStandings(view: FightView, stated: StatedSkills): FightStandings;
/** What a carried status comes to, where a standing cast of its key reaches the bearer's side. */
export function tallyCarriedFigures(reading: CarriedFigureInputs): CarriedFigure[];
```

Which side a key reaches is `lookupKeyMeaning`'s file's to say (`lookupKeyReach`), beside what the
key means. The published tables (`StatedSkills`, the blows granted, the status bits) are handed in
by whoever holds a frozen reading; `core/` imports none.

## 7. The game's edge

```ts
/** Record fields read straight off one envelope key; `Pick` admits no name outside the record. */
export type EnvelopeField = keyof Pick<
    PayloadRecord,
    | "isInit"
    | "isEnd"
    | "messages"
    | "messagesStated"
    | "readerSide"
    | "isOnAuto"
    | "turnStatement"
    | "combatants"
>;
/** The only place the game's envelope keys are spelled; the compiler holds it complete. */
const ENVELOPE_KEYS: { readonly [Field in EnvelopeField]: string } = {
    isInit: "init",
    isEnd: "endBattle",
    messages: "m",
    messagesStated: "mi",
    readerSide: "myteam",
    isOnAuto: "auto",
    turnStatement: "turns_warriors",
    combatants: "w",
};

/**
 * In the game's stack: bounded, and it builds arrays and records of its own. The snapshot and the
 * copy for the file are other readings of the same call (`readMargonemEngineWarriorSnapshot`,
 * `prepareCapture`), and the listener holds the three side by side rather than this one carrying
 * the other two.
 */
export function readPayloadEnvelope(payload: unknown): PayloadRecord | EnvelopeFailure;

/** A field reader's failure below one of these is its `cause`. */
export class PayloadFieldMalformed extends Error {
    override readonly name = "PayloadFieldMalformed";
    readonly field: EnvelopeField; // ours
}
export type EnvelopeFailure =
    | PayloadNotRecord
    | PayloadFieldMalformed
    | PayloadFieldTooLong // `field`, `count`, `maximum`
    | PayloadCombatantRepeated; // `combatantId`

/**
 * In the game's stack, right after the original: the thinning decision (payload shape and cast
 * state) and a JSON copy of a call that is kept. `develop` does the same at the same place, so the
 * cost in the game's stack does not grow. `snapshotAfter` reads the fight after the original.
 */
export function prepareCapture(
    capture: FightCaptureReading, // the calls and the two sets seen, read-only (P3)
    call: Readonly<MargonemEngineCall>, // the payload, its messages or their refusal, the snapshots
    isOpening: boolean,
): PreparedCapture; // the call's copy where it is kept; the recording untouched
/** Appends rather than copies, so a call costs the same at the end of a fight as at its start. */
export function commitCapture(capture: FightCapture, prepared: PreparedCapture): void;
export interface FightCapture {
    calls: CapturedCall[];
    droppedCalls: number;
    isTruncated: boolean; // a call worth keeping came past the ceiling: the tail is missing
    shapesSeen: Set<string>;
    statesSeen: Set<string>;
}

/** Called on the live battle object by the engine port, inside its `errors.attempt`. */
export function readMargonemEngineWarriorSnapshot(
    battle: unknown,
): MargonemEngineWarriorSnapshot | MargonemEngineWarriorFailure;
export type MargonemEngineWarriorFailure =
    | MargonemEngineWarriorsAbsent // no collection answered with a named warrior
    | MargonemEngineWarriorCollectionAbsent // a battle holding neither collection at all
    | MargonemEngineWarriorsExceeded; // `count`, `maximum`
```

A warrior entry the payload restates only in part (it carries only what moved) is not a combatant
stated in full, and is passed over rather than refused: that is how the game writes. What is refused
is the shape around the entries: a field of the wrong type, a list past its bound, an id stated
twice. Whether a call opens a fight is read apart from the rest (`isPayloadOpening`): a refused
opening still starts the file anew and leaves the session empty, so the next call opens the new
fight as one joined in progress rather than running on in the one that ended.

Capture has no failure of its own. The ceiling is a state of the file and not an error: it stops
collecting, counts what it dropped and says its tail is missing (`isTruncated`), which the format
has carried since version 1. A payload the JSON round trip cannot carry is recorded as `null`.

Whether the game mutates a payload after the call does not need to be settled. Everything read is
built into arrays and records of ours in the game's stack, strings are immutable, and the raw
payload for the file is copied there too. Nothing reads the game's object after `onPayload` returns.

## 8. Runtime

```ts
// Defects
export const DEFECT_KIND = {
    kept: "kept",
    keeping: "keeping",
    mount: "mount",
    region: "region",
    reading: "reading",
    figures: "figures",
    gesture: "gesture",
    file: "file",
    engine: "engine",
} as const;
export type DefectKind = VocabularyWord<typeof DEFECT_KIND>;
export interface Defect {
    kind: DefectKind;
    region: PanelRegion | null;
    failure: RuntimeFailure;
}
/** One row per kind and region, as the panel words them; the console hears a kind once. */
export interface DefectLedger {
    add(defect: Defect): void;
    getCounts(): readonly DefectCount[];
}
export interface DefectCount {
    kind: DefectKind;
    region: PanelRegion | null;
    count: number;
    first: RuntimeFailure;
}

// Settings: field by field — the storage choice, the type step, and per window its fold, its
// position and its size; a failure falls back to the default and leaves a defect
/**
 * One reader and one writer per field rather than a generic pair: a value typed by its key needs a
 * conditional type, and narrowing into one needs a cast, which C13 refuses in `src/`.
 */
export function readStorageChoice(store: KeyValueStore): StorageChoice | SettingFailure;
export function readTypeStep(store: KeyValueStore): TypeStep | SettingFailure;
export function readWindowCollapsed(
    store: KeyValueStore,
    window: PanelWindow,
): boolean | SettingFailure;
export function readWindowPosition(
    store: KeyValueStore,
    window: PanelWindow,
): PanelPosition | null | SettingFailure; // null: the reader put it nowhere
export function readWindowSize(
    store: KeyValueStore,
    window: PanelWindow,
): WindowSize | null | SettingFailure; // null: the window stands as its type draws it
// and `writeStorageChoice`, `writeTypeStep`, `writeWindowCollapsed`, `writeWindowPosition`,
// `writeWindowSize` and `deleteWindowSize` beside them
export type SettingFailure = StoreFailure | SettingUnreadable | SettingTooLong; // each names its `key`

// The shelf
/** At start: durable state into memory, as TigerBeetle's `open`. */
export function openShelf(store: KeyValueStore): ShelfOpened | ShelfFailure; // and `fightsUnreadable`
export function writeKeptFight(
    store: KeyValueStore,
    shelf: ShelfContents,
    fight: KeptFight,
): ShelfWritten | ShelfFailure;
export function writeKeptFightPin(
    store: KeyValueStore,
    shelf: ShelfContents,
    openedAt: number,
    isPinned: boolean,
): ShelfWritten | ShelfFailure;
/** The rotation is stated, never silent. */
export interface ShelfWritten {
    contents: ShelfContents;
    droppedOpenedAt: readonly number[];
}
export type ShelfFailure =
    | StoreFailure
    | ShelfUnreadable // the JSON or field failure below it as its `cause`, where there is one
    | ShelfUnwritable
    | ShelfVersionUnknown // `version`, null where none was stated
    | KeptFightsUnreadable // `count`: the fights a shelf held and did not read back
    | EverySlotPinned // `maximum`
    | RotationRefused // `attempts`; the store's last refusal as its `cause`
    | FightAlreadyKept; // `openedAt`

// The file
/**
 * The inverse of `decode`: meaning into the structure of a file, `formatVersion` 4. The calls are
 * the live capture's, or a kept fight's payloads with the messages the envelope reads back out of
 * them, in `develop`'s envelope; the report follows the figures (ADR 0012, ADR 0035).
 * `addOnVersion` arrives in `surroundings` with the build.
 */
export function encodeFightFile(
    calls: FileCalls,
    subject: FileSubject | null,
    surroundings: FileSurroundings,
): FightFile | FileUnserializable; // the JSON failure as its `cause`
/** Which fight the file is of is the intent's question, and its refusal is the runtime's. */
export type ExportFailure = ShownFightAbsent | FileUnserializable | FileFailure;

// The shelf as the running add-on holds it: the fights, the store, and what the store answered
export interface ShelfKeeper {
    getFights(): readonly KeptFight[];
    getChoice(): StorageChoice;
    getAnswers(): ShelfAnswers; // every slot pinned, refused, room made, choice, move or pin refused
    getKeptFightStates(): ReadonlyMap<number, KeptFightState | null>; // replayed as kept, a refusal included
    keep(fight: KeptFight): void;
    pin(openedAt: number): void; // a toggle, as develop's pin is
    moveShelf(choice: StorageChoice): void; // fights first, the answer second, the old place last
}

// A payload and an intent change state at once; drawing waits for one frame
export interface Runtime {
    onIntent(intent: PanelIntent): void; // a listener: the intent executed → markStale
    deinit(): undefined | MargonemEngineFailure; // stops looking, takes the wrap off, cancels the frame
}
export function initRuntime(ports: RuntimePorts, options: RuntimeOptions): Runtime;
export interface RuntimeOptions {
    addOnVersion: string;
    tables: { decoder: DecoderTables; tooltip: TooltipTables };
    sessionOptions: SessionOptions;
}
export interface RuntimePorts {
    clock: BrowserClock;
    frames: BrowserFrameScheduler;
    interval: BrowserIntervalScheduler;
    battle: MargonemEngineBattlePort;
    place: MargonemEnginePlacePort;
    hero: MargonemEngineHeroPort;
    dictionary: MargonemClientDictionaryPort;
    build: MargonemClientBuildPort;
    surroundings: BrowserSurroundingsPort;
    tooltip: MargonemEngineTooltipPort;
    settings: KeyValueStore;
    initShelfStore(choice: StorageChoice): KeyValueStore | StoreUnavailable; // the keeper decides
    file: BrowserFileSink;
    console: BrowserConsolePort;
    document: PanelDocument; // the runtime makes the view, which is handed its own callbacks
    mountPanel(panel: PanelElement): void | errors.Caught;
    readViewport(): PanelViewport | null;
}

// Every failure meets a fate, and the compiler holds the table complete
export type RuntimeFailure =
    | MargonemEngineFailure
    | EnvelopeFailure
    | PayloadRejected
    | CaptureCallsExceeded // a capture stopped at its ceiling: `maximum`
    | UnreadMessage
    | StoreFailure
    | ShelfFailure
    | SettingFailure
    | FileUnserializable
    | ExportFailure // no fight on screen, a file that will not encode, a sink that refused
    | FiguresDisagreed // two counts of one figure came out different
    | MargonemEngineTooltipRefused // drawn fighters whose tooltip would not take a block
    | ViewFailure // RegionUndrawn, GestureDropped, WindowUnplaced
    | MargonemEngineWarriorFailure
    | MargonemReadFailure
    | errors.Caught;
export const FAILURE_FATE = {
    shownAsUnknown: "shown-as-unknown",
    shownAsSuspect: "shown-as-suspect",
    defect: "defect",
    shelfAnswer: "shelf-answer",
    fallbackWithDefect: "fallback-with-defect",
    standDown: "stand-down",
    none: "none", // leaves no mark by design, wherever it is met: §10.5 says why
    byPlace: "by-place", // met in places that do different things with it: a row each in §10.5
} as const;
export type FailureFate = VocabularyWord<typeof FAILURE_FATE>;
/** Keyed by each class's literal `name`, so a class with no entry fails `deno check` (ADR 0008). */
export const FAILURE_FATES: { readonly [Name in RuntimeFailure["name"]]: FailureFate };
```

## 9. UI

A reading is a plain function of what it is handed, and returns the reading itself, as `develop`
does: its inputs are the statistics, the roster, the metric, the side chosen, the reader's side and
the suspicions, and the words are the module's, not a parameter. The two failures a reading could
name are degraded in place (E12) rather than returned: rows past the roster's bound are clamped to
`COMBATANTS_MAXIMUM` after the sort, and a combatant missing from the roster reads with no side and
no name. The status bits the tooltip words are handed in, since `ui/` imports no frozen table.

```ts
export function presentScreen(
    statistics: FightStatistics,
    roster: CombatantRoster,
    metric: PanelMetric,
    choice: PanelSideChoice,
    readerSide: number | null,
    suspicions: FightSuspicions,
): ScreenContent;
export function presentHelper(
    provocations: readonly ProvocationStanding[],
    chargedSkills: readonly ChargedSkillStanding[],
    roster: CombatantRoster,
    readerSide: number | null,
    turn: StandingTurn,
): HelperContent;
// and presentOpenedLevel, presentPairLevel, presentPartLevel, presentUnnamedLevel…, presentCard
// beside them

export function initPanelView(document: PanelDocument, options: PanelViewOptions): PanelView;
export interface PanelViewOptions {
    addOnVersion: string;
    typeStep: TypeStep; // the first sheet, and where a window nobody moved opens
    onIntent: (intent: PanelIntent) => void;
    /** What failed while no render was running: a gesture, a card, a window's opening place. */
    onFailure: (failure: ViewFailure) => void;
    meterPlacement: PanelPlacement | null;
    helperPlacement: PanelPlacement | null;
    translate: TranslateLabel | null;
}
export interface PanelView {
    element: PanelElement;
    render(shown: ShownScreen): RenderReport;
    renderWaiting(waiting: WaitingContent): RenderReport;
    renderHelper(helper: HelperContent | HelperAbsence, isCollapsed: boolean): RenderReport;
}
/** A region that could not draw stands undrawn in place. */
export interface RenderReport {
    undrawn: readonly RegionUndrawn[];
}
// Each a class `extends Error`, with what was caught as its `cause`.
export type ViewFailure =
    | RegionUndrawn // `region`; the cause a `Caught`, or a `CardRefused` for a card's key
    | GestureDropped // `listener`
    | WindowUnplaced; // `window`

/** What the reader asked for, before anything is done about it. `develop` calls it `PanelPress`. */
export type PanelIntent =
    | { kind: "metric"; metric: PanelMetric }
    | { kind: "side"; side: PanelSideChoice }
    | { kind: "open-row"; combatantId: number }
    | { kind: "open-unnamed"; end: PanelUnnamedEnd }
    | { kind: "open-part"; part: OpenedPart }
    | { kind: "close" }
    | { kind: "fold"; window: PanelWindow }
    | { kind: "move"; window: PanelWindow; position: PanelPosition }
    | { kind: "resize"; window: PanelWindow; size: WindowSize }
    | { kind: "reset-size"; window: PanelWindow }
    | { kind: "save-file" }
    | { kind: "storage"; choice: StorageChoice }
    | { kind: "type-step"; step: TypeStep }
    | { kind: "shelf" }
    | { kind: "options" }
    | { kind: "show-kept"; openedAt: number }
    | { kind: "show-live" }
    | { kind: "pin"; openedAt: number };
```

The intents are `develop`'s presses, one for one: `pin` toggles, as `develop`'s does, so it carries
no state, and there is no `remove-kept`, because `develop` has no such press. A press is read off
one `data-*` mark per control (`PANEL_MARK`), never a class; a mark stating a value nothing of ours
writes is `MarkValueUnknown`, which the listener reports as a dropped gesture, with it as the
`cause`. A `PanelDefect` the panel states is `{ kind, region, count }`, one per row of the ledger: a
kind leaving two regions undrawn is two lines, each naming its region (null where a kind is none's).

The UI returns failures beside its values, and a `RenderReport`, and neither throws nor asserts. An
exception out of the DOM is caught by `errors.attempt` inside its region. A listener reads an intent
from the element's `data-*` attributes and calls `onIntent` at once, under `errors.attempt`: a throw
there drops one gesture, reported to `onFailure`, and leaves the state untouched.

Every union above with a `kind` gets its vocabulary object when it is built (`AGENTS.md` N19). The
literals stand in the variants here only so the document reads. A failure is a class instead
(`AGENTS.md` E3), and the failure types above name the classes `src/` declares.

## 10. Process

### 10.1 Start

```
window ─ readRuntimePorts ─▶ RuntimePorts | BootFailure, under errors.attempt
   BrowserWindowUnusable: the first part missing (document, console, timers, frames, clock,
     downloads)
   Caught: a member whose getter threw, a broken invariant while standing up
   a failure → one console line where the page has a console → stand down, no panel
composeRuntimeTables     the frozen readings indexed, under the start's guard, never at load
initRuntime(ports, options)
   ─▶ readStorageChoice, readTypeStep, readWindowCollapsed × 2, readWindowSize × 2
                              a failure → the default, and a "kept" defect
   ─▶ openShelf               a failure → memory, the stored shelf left unless an older version's,
                              and a "kept" defect
   ─▶ initPanelView           readWindowPosition × 2: a failure → the sheet's corner, a "kept" defect
   ─▶ look for the engine every 250 ms, at most 240 times
        MargonemEngineAlreadyWrapped        → stand down, one console line, no panel
        MargonemEngineMethodAbsent, MargonemEngineMethodUnwritable, abandoned
                                    → at the last look only, an "engine" defect,
                                     markStale: the panel waits
        a look that threw           → one console line; the looking goes on
        a timer that will not start → abandoned at once, the refusal its cause: an "engine"
                                     defect, markStale: the panel goes up and says so
        found                       → engine.wrap(listener), markStale
the first frame draws and mounts   a failure → a "mount" defect, tried again at the next frame
```

No frame is asked for before the wrap is on or the game is given up on, so the panel goes up at the
first frame, as `develop` puts it up when the wrap goes on. A missing method is the game given up on
only at the last look: a copy that put its panel up at the first refusal and stood down at a later
one would leave that panel on the page.

### 10.2 The game's stack: `onPayload`, called inside `updateData`

```
onBeforeCall ─ errors.attempt(readMargonemEngineWarriorSnapshot) ─▶ snapshotBefore | null
[the game's original runs; its exception reaches the game untouched, and we do nothing]
onPayload(payload) ─ errors.attempt:
   readPayloadEnvelope     an opening, refused or not, clears the refusal the fight held;
                           a failure → a "reading" defect, and the fight's first refusal held
   readMargonemEngineWarriorSnapshot     after the original → snapshotAfter | null
   prepareCapture          → commitCapture: the call kept or counted, beside the session's payload;
                           assertion → a "file" defect, and the fight's first refusal held; an
                                 opening it did not take starts the capture anew
   preparePayload          a value → commitPayload → unread counted (suspect)
                                 hasOpened → the moment, read on its own under errors.attempt;
                                   the place and the reader reset, then read; the screen
                                   reset where no kept fight is chosen
                                 hasClosed → no moment: a "keeping" defect, and nothing kept;
                                   a refusal held: a "keeping" defect carrying it, and nothing
                                   kept, because a gap replays to figures that look right;
                                   a capture stopped at its ceiling: a "keeping" defect
                                   (`CaptureCallsExceeded`), and nothing kept;
                                   else ShelfKeeper.keep → the shelf's answers; then a chosen
                                   fight the shelf no longer holds is cleared
                                   (resetScreenFightDropped)
                           a failure → a bound the options state: a "reading" defect, and the
                                 fight's first refusal held
                           assertion → a "reading" defect, and the fight's first refusal
                                 held; the session untouched
   markStale               the first mark asks for a frame
end: no DOM; cost bounded by the message count; a JSON copy only of a call thinning keeps
```

### 10.3 A gesture: `onIntent`, under `errors.attempt` in the listener

```
listener ─ reads a PanelIntent off data-* (isOneOf; unknown → GestureDropped)
   the intent executed in place: the screen moves, and the options and the shelf never cover it
      together; the keeper pins and moves the shelf, and either clears a chosen fight the
      shelf dropped to make room (resetScreenFightDropped); a fold is written; a size of type is
      written, and asks for a frame only where it moved; a move is written and asks for no
      frame, and a resize asks for one only while the options stand open; a size given back is
      removed and asks for one; a save writes the file or a "file" defect, and a live fight
      whose figures will not tally is written as its calls alone, with no report
   true → markStale
```

### 10.4 The frame: `onFrame`, every step under `errors.attempt`

```
1. replayAuraStandings → presentTooltipRows → tooltip.writeRows → a failure → a "region" defect
2. replayAuraStandings → presentHelper → renderHelper → undrawn → "region" defects
3. the ledger as it stands → the panel's defects, drawn this frame
4. tallyFightFigures → verifyFightFigures → presentScreen → render → undrawn → "region" defects
   nothing to stand on → renderWaiting; a broken invariant → a "reading" defect, unread
   a kept fight stood on that no longer reads → renderWaiting, saying so, and when and where
   a kept fight stood on → the live fight tallied for its shelf row alone, under its own guard:
   a broken invariant → a "reading" defect and no live row, the kept fight drawn
5. Caught in any step → that step's defect; the rest of the frame goes on
6. the first frame mounts the panel
```

How many calls fall into one frame the recordings do not say, because they carry no time. What is
certain is that there are no more drawings than frames, where `develop` draws once per call. The
figures are tallied again each frame rather than held: a kept fight's are held by the keeper, and a
live one's change with every call a frame covers. Where `requestFrame` answers a failure,
`markStale` draws at once, as `develop` does, and leaves a "region" defect once, because no failure
goes without a mark.

### 10.5 The failure map

| Failure                                         | Fate                   | What the reader sees                                         |
| ----------------------------------------------- | ---------------------- | ------------------------------------------------------------ |
| `UnreadMessage` (grammar, unknown key, none)    | `shown-as-suspect`     | a count beside the figure, a suspicion sentence              |
| `PayloadRejected`                               | `defect` "reading"     | the defects section; the fight read so far stands            |
| `hasJoinedInProgress` (data, not a failure)     | `shown-as-suspect`     | "joined in progress"                                         |
| `EnvelopeFailure`                               | `defect` "reading"     | the defects section: what could not be done, how often       |
| `EnvelopeFailure`, `PayloadRejected` at a close | `defect` "keeping"     | the fight read on live, and not kept                         |
| `Caught` reading or capturing, at a close       | `defect` "keeping"     | as above                                                     |
| `CaptureCallsExceeded`                          | `defect` "keeping"     | as above: a capture holding no close is not kept             |
| `Caught`                                        | `defect` of its step   | as above; one console line per kind                          |
| `Caught` reading the page's state               | `shown-as-unknown`     | our word instead of the game's, and no defect                |
| `FiguresDisagreed`                              | `defect` "figures"     | as above                                                     |
| `StoreFailure` opening the shelf                | `fallback-with-defect` | memory; a "kept" defect                                      |
| `StoreUnavailable` on choosing a store          | `shelf-answer`         | nothing moves; the shelf's answer row                        |
| `StoreFailure` emptying the place left          | `defect` "kept"        | the move stands; a copy stayed behind                        |
| `ShelfFailure` on a write                       | `shelf-answer`         | the answer row: a fight, a pin or a move not saved           |
| `ShelfUnreadable`, `ShelfVersionUnknown`        | `fallback-with-defect` | memory, the stored shelf untouched; a "kept" defect          |
| `ShelfVersionUnknown` of an older version       | `fallback-with-defect` | an empty shelf, written over next; a "kept" defect           |
| `KeptFightsUnreadable`                          | `defect` "kept"        | the rest of the shelf; the fights lost, counted              |
| `FightAlreadyKept`                              | `defect` "keeping"     | the fight is not kept twice                                  |
| `SettingFailure`                                | `fallback-with-defect` | the default place, fold, size or type; a "kept" defect       |
| `RegionUndrawn`                                 | `defect` "region"      | an undrawn mark where the region stands                      |
| `GestureDropped`                                | `defect` "gesture"     | nothing happened, marked once                                |
| `WindowUnplaced`                                | `fallback-with-defect` | the sheet's corner; a "mount" defect                         |
| `ExportFailure`, `FileFailure`                  | `defect` "file"        | as above                                                     |
| a tooltip write that threw                      | `defect` "region"      | the game's tooltip without our rows                          |
| `MargonemEngineTooltipRefused`                  | `defect` "region"      | as above, for the fighters it counts                         |
| a setting write refused                         | `none`                 | the reader's choice stands; the next visit is poorer         |
| `MargonemReadFailure`                           | `shown-as-unknown`     | no place line; our word instead of the game's                |
| `MargonemEngineWarriorsAbsent`                  | `none`                 | a board of nobody: no tooltip, a file with no fighters       |
| `MargonemEngineWarriorCollectionAbsent`         | `defect` "file"        | a file with no board; the tooltips asked for counted refused |
| `MargonemEngineWarriorsExceeded`                | `defect` "file"        | a file with no board; and "region" for the tooltips          |
| `MargonemEngineAbsent`, `…BattleAbsent`, a look | `none`                 | a look that found nothing; the search runs on                |
| `MargonemEngineAbsent`, `…BattleAbsent`, a file | `defect` "file"        | a file with no board                                         |
| `WrapCovered`                                   | `none`                 | returned by `deinit`, which only a test calls                |
| `MargonemEngineAlreadyWrapped`, `BootFailure`   | `stand-down`           | no panel, one console line                                   |
| `SearchAbandoned`, `MargonemEngineMethodAbsent` | `defect` "engine"      | the panel waits, one console line                            |
| `SearchAbandoned`, the timer refused            | `defect` "engine"      | as above, at once: no look is left to come                   |
| `MargonemEngineMethodUnwritable`                | `defect` "engine"      | as above; the engine's own method stands                     |
| `MargonemEngineMethodUnwritable` on a detach    | `none`                 | returned by `deinit`, which only a test calls                |
| `Caught` from the search's own report           | console line           | nothing on the panel; one console line, the first time       |
| `Caught` cancelling the search's timer          | console line           | a search done, its timer ticking; one console line           |
| `Caught` cancelling the frame                   | console line           | a frame that finds nothing to do; one console line           |
| `Caught` from a clock that will not state now   | `defect` "keeping"     | at a fight's close: the fight is not kept                    |
| `Caught` from a clock, on a handover            | `defect` "file"        | no file                                                      |

A class `FAILURE_FATES` marks `by-place` — `Caught`, the three of `StoreFailure`,
`MargonemEngineAbsent`, `…BattleAbsent` and `MargonemEngineMethodUnwritable` — is met in places that
do different things with it, so its fate is the row of the place it was met in, above. A class it
marks `none` leaves no mark wherever it is met, by design: `WrapCovered` is met only by a detach,
which only a test calls, and `MargonemEngineWarriorsAbsent` is a board with nobody on it, which the
file and the tooltip both take as empty.

### 10.6 Where a broad catch stands

| Boundary                         | Where                                                                                                                                                                                                                                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the add-on standing up           | `readRuntimePorts` and `initRuntime` under `errors.attempt`, in the entry                                                                                                                                                                                                                           |
| the wrapped engine call          | `PayloadListener.onBeforeCall` and `onPayload`                                                                                                                                                                                                                                                      |
| one render region                | `errors.attempt` per region in `PanelView.render`                                                                                                                                                                                                                                                   |
| browser storage                  | `errors.attempt` inside the `KeyValueStore` implementation                                                                                                                                                                                                                                          |
| the game's own page state        | `errors.attempt` in `MargonemEngineBattlePort` (its read, the wrap's write, the detach), `MargonemEnginePlacePort`, `MargonemEngineHeroPort`, `MargonemClientDictionaryPort`, `MargonemClientBuildPort`, `MargonemEngineTooltipPort` (reading the board, and the walk writing each block), warriors |
| a browser API this program calls | `errors.attempt` inside `BrowserConsolePort`, `BrowserSurroundingsPort`, `BrowserClock`, `BrowserFrameScheduler`, `BrowserIntervalScheduler`, `BrowserFileSink`                                                                                                                                     |
| a callback somebody else calls   | a DOM listener, `onFrame`, the interval's step and the file's timeout, under `errors.attempt`                                                                                                                                                                                                       |

### 10.7 The card: `onHover`, in the root listener, under its guard

```
listener ─ the row under the pointer, by its card key, and the pointer's height
   onHover: the same row → the card moves with the pointer, and nothing is drawn
            another row   → its reading composed and the card drawn at once
            no row        → the card hides
```

The detail window answers the pointer where it stands, with no frame between: a card drawn a frame
late follows a row the pointer has already left. It is the view's own state — which key is open and
where the card stands — and reaches neither the runtime nor the session, so it marks nothing stale.

## 11. Recorded material and the file format

- **The recordings are `captures/`**: those `develop` @ `fa1dcce` held, byte for byte, and those
  `tools/capture-intake.ts` has admitted since (`AGENTS.md`, _Ask first_), read off the tree by
  `tests/recorded-fights.ts`. `docs/captured-fights.md` names every one, held by
  `tests/repository/captured-fight-register.test.ts`.
- **The file format stays `formatVersion` 4.** `encodeFightFile` writes the fields `develop`'s
  `composeCaptureText` writes, but for `report.totals`, which holds only the figures summed (ADR
  0035). A name changing in code (`combatantsBefore` is the live fight's `snapshotBefore`) never
  reaches a key in the file, because the keys are spelled once, in the file module's own field map.
  Intake keeps reading versions 1 to 4.
- **The shelf (`MargoMeter-fights`, version 3) stays** as well. It holds the same thinned calls.
- **No format change is needed.** A call's time was wanted only to measure the period of a tick, and
  this design has no tick.

## 12. Building it

This branch starts empty, so the order is what makes each step testable on the last:

1. `libs/`: `errors`, `vocabulary`, `unknown-value`, `json-text`, `number-text`, `number-range`,
   `text-walk`, each in the step that brings its first consumer (`AGENTS.md` C9), so this list is an
   order and not a batch. The gate and its first guards arrive in the same commit as the first code.
2. `core/` grammar and decoder, carried over from `develop` with its tests, returning failures
   beside their values.
3. `core/` session (`preparePayload`, `commitPayload`), figures, standings.
4. `ports/`: the envelope, warriors and capture readers.
5. `runtime/`: defects, settings, shelf, file, `FAILURE_FATES`. Each port of §5 arrives with the
   runtime piece that consumes it (`AGENTS.md` C9), in `ports/` where it reads the page.
6. `ui/`: `present…`, `PanelView`, intents; then the runtime joining them: `initRuntime`, the
   keeper, the frame, the tooltip and the file, with the dictionary, tooltip, frame, clock,
   surroundings and file ports.
7. The entry, and the userscript build.
8. The simulator, `tests/simulation.ts`. It stands the add-on up by its own entry over a page and a
   game of the tests' own (`tests/fake-window.ts`, `tests/rebuilding-battle.ts`), plays a recording
   through the game's method, and has the page refuse and throw where a real one could:

```ts
export interface FaultPlan {
    seed: number;
    storeRefusalPercent: number; // a write to a store refused, as a full one refuses it
    foreignThrowPercent: number; // any other call into the page throwing
    payloadsPerFrame: number;
}
export function runSimulation(plan: FaultPlan, updates: readonly unknown[]): SimulationReport;
export interface SimulationReport {
    hasThrownIntoMargonem: boolean; // from the game's call, the start, or a frame
    ranking: string; // what the last frame drew, compared with a run left alone
    kindsSaid: string[]; // every kind of failure the console heard
    hasInvariantBroken: boolean; // one of those stands, down its causes, on an assertion
    unhandledKinds: string[]; // those `FAILURE_FATES` has no fate for
    faultsInjected: number;
}
```

What `tests/simulation.test.ts` holds, on every recording and every seed:

- nothing reached the game's stack;
- none of the faults touches the data, so the figures equal a run left alone;
- every failure met a fate;
- a fault of the page's is met as the page's, and never as a broken invariant of ours.

**The rewrite is proven against `develop`.** On every recording, the figures this branch draws equal
the figures `develop` @ `fa1dcce` draws, except where a decision record names a departure: ADR 0012
counts what an absorption pool took, and states which lines of the report that moves; ADR 0035 keeps
out of `report.totals` the figures it never summed; ADR 0043 hands an announcement on over its
announcer's own heal, which moves the blows behind no announcement in three recordings. Any other
difference is a finding in one of the two, never a golden value to move (`AGENTS.md` W8).

## 13. Open

- The most messages one payload carried: 655, in
  `captures/2026-10-02-luvia-grupa-vs-amaimon-auto-BTPBneEN-0.21.0.json`, over the 37 recordings of
  `captures/` on 2026-10-06. The bound on the work `preparePayload` does in the game's stack is
  `MESSAGES_MAXIMUM` (`src/core/fight-decoder.ts`), not the corpus.
- Drawing once per frame moves the moment the panel is current: the frame after a payload rather
  than the payload itself. `tests/e2e/AGENTS.md` says how the browser suite waits for it.
