# MargoMeter, rewritten: interfaces, signatures, process

**Status: target.** Nothing here is implemented on this branch yet. This document is a design
constraint, not evidence that a feature exists (`AGENTS.md`, "Target is not proof"). It owns the
architecture — layers, ports, types, the process and the failure map. The rules that bind the code
are `AGENTS.md`'s, and this document cites them rather than restating them.

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
- **The panel redraws on every call to `updateData`** (`src/userscript-entry.ts:1912`), including
  the calls the game keeps making after a fight is over. On the first recording, thinning dropped
  565 of 569 calls for carrying nothing new (`src/game/fight-capture.ts`).
- **Figures are recomputed from nothing on every draw**, not once per change.
- **`compose` starts 310 of the 680 functions in `src/` and `libs/`**, and means four things there:
  building a stateful object, a computation, building DOM, and composing Polish text.

What is carried over unchanged: the data contract `BattleEvent` (`develop:src/core/battle-event.ts`,
and changing it is `[ASK]`), the wrap semantics (the original first, its value untouched, one
layer), the recording file format (§11) and the six boundaries of `AGENTS.md`'s error rules.

## 2. Principles

TigerStyle, translated to an add-on that is a guest in somebody else's page. The binding form of
each is the `AGENTS.md` rule named beside it.

| #  | Principle                                 | What it means here                                                                                                                                                                                                    |
| -- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1 | Two kinds of error.                       | An operating error is expected and returns a `Result`. A programmer error is a broken invariant, asserted, and caught only by `runGuarded` at a boundary. `AGENTS.md` E1–E4.                                          |
| T2 | A limit on everything.                    | Every collection states a maximum, and capacities are fixed when a fight opens. S11.                                                                                                                                  |
| T3 | In somebody else's stack, only what must. | In the game's stack: reading the envelope, copying for the file, `preparePayload`/`commitPayload`. The cost is bounded by the message count; nothing throws past `runGuarded`. No drawing.                            |
| T4 | A deterministic core.                     | `core/` is pure transitions `(state, input) → Result`. All I/O goes through ports, so a simulator replays recordings with injected faults — the VOPR idea.                                                            |
| T5 | Parse, don't validate.                    | A value from the game is read into a type of ours at the edge in `game/`, and every bound on it is checked there, once. Above the edge nothing is `unknown`, and a bound broken there is a bug of ours: an assertion. |
| T6 | Explicit control flow.                    | `Result` has no `map`/`andThen`. Every call site writes `if (!result.ok)`. S1.                                                                                                                                        |
| T7 | Absent in the protocol is not a failure.  | `T \| null` in a domain type means "the protocol did not state it", which is a fact. `Err` means "reading failed". E6.                                                                                                |
| T8 | Batch where the cost is.                  | A payload and a click only mark the panel stale. One scheduled frame computes and draws once, however many changes arrived. There is no queue, because there is nothing to hold in one.                               |

## 3. Foundation: `libs/`

`libs/` knows nothing of the game or of this project's layers.

```ts
// libs/result.ts
export interface Ok<Value> {
    readonly ok: true;
    readonly value: Value;
}
export interface Err<Failure> {
    readonly ok: false;
    readonly error: Failure;
}
export type Result<Value, Failure extends Fault> = Ok<Value> | Err<Failure>;

/** Every failure is a record with a discriminant, never a class and never a sentence. */
export interface Fault {
    readonly kind: string;
}

/** A failure of code we did not write: the only place `cause: unknown` appears. */
export interface ForeignFailure extends Fault {
    readonly kind: "foreign-threw";
    readonly cause: unknown;
}
/** A broken invariant, caught at a boundary. */
export interface BrokenInvariant extends Fault {
    readonly kind: "invariant-broken";
    readonly cause: unknown;
}

export function ok<Value>(value: Value): Ok<Value>;
export function err<Failure extends Fault>(error: Failure): Err<Failure>;

/** A broad catch whose `try` holds only a call into code we did not write. */
export function callForeign<Value>(call: () => Value): Result<Value, ForeignFailure>;
/** A broad catch around our own code at a boundary: an assertion becomes `BrokenInvariant`. */
export function runGuarded<Value>(step: () => Value): Result<Value, BrokenInvariant>;

// libs/vocabulary.ts
export function isOneOf<const Words extends readonly string[]>(
    words: Words,
    value: unknown,
): value is Words[number];

// libs/unknown-value.ts
/** Read-only: a write into the game's object through this type does not compile. */
export interface UnknownRecord {
    readonly [key: string]: unknown;
}
/** `typeof` alone admits `null` and arrays here, and the answer must be read-only. */
export function isRecord(value: unknown): value is UnknownRecord;

/** Keys are the game's, fields are ours: the same map as `ENVELOPE_KEYS` (§7). */
export type FieldKeys<Field extends string> = { readonly [Name in Field]: string };
export const FIELD_TYPES = ["number", "text", "stated-text", "record", "list"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];
export const FIELD_FAILURE = { wrongType: "field-wrong-type", tooLong: "field-too-long" } as const;
export type FieldFailure<Field extends string> =
    | { kind: typeof FIELD_FAILURE.wrongType; field: Field; expected: FieldType }
    | { kind: typeof FIELD_FAILURE.tooLong; field: Field; count: number; maximum: number };

/** An absent field is `ok(null)`, a fact. A field of the wrong type is `err`, named as ours. */
export function getNumberField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
): Result<number | null, FieldFailure<Field>>;
export function getTextField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
): Result<string | null, FieldFailure<Field>>;
export function getStatedTextField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
): Result<string | null, FieldFailure<Field>>;
export function getRecordField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
): Result<UnknownRecord | null, FieldFailure<Field>>;
/** A longer list is a failure, never a truncation. */
export function getListField<Field extends string>(
    record: UnknownRecord,
    keys: FieldKeys<Field>,
    field: Field,
    maximum: number,
): Result<readonly unknown[] | null, FieldFailure<Field>>;

// libs/json-text.ts
export const JSON_FAILURE = {
    unreadable: "json-unreadable",
    nothing: "json-nothing",
    unwritable: "json-unwritable",
} as const;
export type JsonFailure =
    | { kind: typeof JSON_FAILURE.unreadable; cause: unknown }
    | { kind: typeof JSON_FAILURE.nothing } // a function, a symbol, `undefined`: no JSON text
    | { kind: typeof JSON_FAILURE.unwritable; cause: unknown };
export function parseJson(text: string): Result<unknown, JsonFailure>;
export function encodeJson(value: unknown, indentSpaces: number): Result<string, JsonFailure>;

// libs/number-text.ts — one reason to fail each, so `null`
export function parseInteger(text: string): number | null; // digits, optional minus, safe integer
export function parseDecimal(text: string): number | null; // digits, a point, digits; no sign
export function formatInteger(value: number): string;
export function formatDecimal(value: number, places: number): string;

// libs/number-range.ts
/** Unlike the usual clamp: where `maximum < minimum` the minimum wins. */
export function clamp(value: number, minimum: number, maximum: number): number;

// libs/tally-order.ts
export function compareTallies(
    one: readonly [string, number],
    other: readonly [string, number],
): number;

// libs/text-walk.ts — as on `develop`: isDigitAt, getEndOfRun, isDigitRun
```

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
libs/                     result, vocabulary, readers of text, numbers, JSON, unknown values
src/core/                 grammar → decoder → session → figures → standings (pure, deterministic)
src/game/                 ports over the page: engine, warriors, envelope, store, place,
                          dictionary, tooltip, file
src/runtime/              the frame, defects, settings, shelf, export
src/ui/                   reading → DOM; throws nothing, asserts nothing; gestures → intents
src/userscript-entry.ts   composing the ports and starting; nothing else
```

Dependencies point one way: `core → libs`; `game → core (types), libs`; `ui → core (types), libs`;
`runtime → everything below it`; the entry → `runtime`, `game`, `ui`. `libs/` imports no layer.

## 5. Ports

A port is an interface over something this program does not control. Each has a real implementation
over the page and a simulated one (§12), which is what earns it an interface (`AGENTS.md` I1).

```ts
// Time and the frame
export interface Clock {
    readNowMilliseconds(): number;
}
/** The page's `requestAnimationFrame`. A hidden tab gets no frames, and nobody is looking at it. */
export interface FrameScheduler {
    requestFrame(step: () => void): Result<FrameHandle, ForeignFailure>;
}
export interface FrameHandle {
    cancel(): void;
}

// The engine
export interface EnginePort {
    readBattle(): Result<EngineBattle, EngineFailure>;
}
export interface EngineBattle {
    wrap(listener: PayloadListener): Result<WrapHandle, EngineFailure>;
    readWarriors(): Result<WarriorSnapshot, WarriorFailure>;
}
/** Called in the game's stack. */
export interface PayloadListener {
    onBeforeCall(): void;
    onPayload(payload: unknown): void;
}
export interface WrapHandle {
    detach(): Result<void, EngineFailure>;
    getFailureCount(): number;
}
export type EngineFailure =
    | { kind: "engine-absent" } // neither spelling answered
    | { kind: "battle-absent" }
    | { kind: "method-absent" } // the method's name is spelled by the adapter alone
    | { kind: "another-reader" } // another copy's wrap marker is present
    | { kind: "search-abandoned"; looks: number; maximum: number }
    | { kind: "detach-foreign-layer" }; // somebody wrapped over us; only ours comes off

// The game's page state, read
export interface PlacePort {
    readPlace(): Result<FightPlace, PageReadFailure>;
}
export interface DictionaryPort {
    readLabel(labelId: string): Result<string, PageReadFailure>;
}
export interface BuildPort {
    readBuildId(): Result<string, PageReadFailure>;
}
export type PageReadFailure =
    | { kind: "page-reading-absent"; reading: "place" | "label" | "build" }
    | ForeignFailure;

// The one write into the game: rows of its tooltip
export interface TooltipPort {
    writeRows(
        combatantId: number,
        rows: readonly TooltipRow[],
    ): Result<TooltipWritten, TooltipFailure>;
}
export interface TooltipWritten {
    rowsWritten: number;
}
export type TooltipFailure =
    | { kind: "tooltip-target-absent"; combatantId: number }
    | { kind: "tooltip-rows-exceeded"; rows: number; maximum: number }
    | ForeignFailure;

// Browser storage
export interface KeyValueStore {
    read(key: StoreKey): Result<string | null, StoreFailure>; // null: no such key, a fact
    write(key: StoreKey, value: string): Result<void, StoreFailure>;
    remove(key: StoreKey): Result<void, StoreFailure>;
}
export const STORE_KEYS = [
    "MargoMeter-fights",
    "MargoMeter-folded",
    "MargoMeter-place",
    "MargoMeter-pomocnik-folded",
    "MargoMeter-pomocnik-place",
    "MargoMeter-storage",
] as const;
export type StoreKey = (typeof STORE_KEYS)[number];
export type StoreFailure =
    | { kind: "store-unavailable" }
    | { kind: "store-refused"; cause: unknown } // a quota refusal is an answer
    | { kind: "store-value-too-long"; length: number; maximum: number };

// A file and the console
export interface FileSink {
    writeFile(name: string, text: string): Result<void, FileFailure>;
}
export type FileFailure = { kind: "file-api-absent" } | ForeignFailure;
/** Once per kind. */
export interface ConsolePort {
    writeBrandedLine(kind: DefectKind, failure: RuntimeFailure): void;
}
```

## 6. Core: pure transitions

### 6.1 Grammar

```ts
export function parseProtocolMessage(text: string): Result<ProtocolMessage, GrammarRefusal>;
export type GrammarRefusal =
    | { kind: "segments-exceeded"; segments: number; maximum: number }
    | { kind: "side-unreadable"; end: "actor" | "target" }
    | { kind: "parameter-key-empty"; index: number };
```

A message the grammar refuses is data, not an exception, so no error class is needed for it.

### 6.2 Decoder

```ts
export interface DecoderTables {
    blowsGrantedBySkillId: ReadonlyMap<number, number>;
}
/** `null`: no announcement reaches the next message. */
export type AnnouncementStanding = StandingAnnouncement | null;
export interface DecodeContext {
    roster: CombatantRoster | null;
    standing: AnnouncementStanding;
    tables: DecoderTables;
}

export function decodeMessage(
    text: string,
    context: DecodeContext,
): Result<MessageDecoded, UnreadMessage>;
export interface MessageDecoded {
    events: readonly BattleEvent[];
    standing: AnnouncementStanding;
}
export interface UnreadMessage extends Fault {
    kind: "unread";
    cause: UnreadCause;
    keys: readonly string[];
    combatantIds: readonly number[];
    text: string;
    /** What was read beside the unread keys, so a blow with a new proc keeps its damage. */
    events: readonly BattleEvent[];
    standing: AnnouncementStanding;
}

/** `src/core/protocol-key.ts`: the one owner of what a key means. `null` is `unknown-key`. */
export function getKeyReading(key: string): KeyReading | null;

/** The envelope has bounded the message count already; here it is asserted. */
export function decodePayloadMessages(
    texts: readonly string[],
    context: DecodeContext,
): PayloadDecoded;
export interface PayloadDecoded {
    events: readonly BattleEvent[];
    unread: readonly UnreadMessage[];
    standing: AnnouncementStanding;
}
```

An `UnreadMessage` is one message's failure, and it stays a `Result` because its fate differs from a
defect: the session records it as a fact — counted, and shown as a suspect — so the payload as a
whole succeeds. A message with too many segments is one of them (`GrammarRefusal`), because the
count comes off the game's text. `UnknownMessageEvent` stays in `BattleEvent`, and
`decodePayloadMessages` puts one after the events an `UnreadMessage` carries, which is where
`develop` puts it.

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
    standing: SessionStanding | null; // null: no payload yet
    events: BattleEvent[];
}
export function initFightSession(options: SessionOptions): FightSession;
export function getSessionPhase(session: FightSession): SessionPhase;
/** A reading: the arrays are the session's own, typed read-only, and nothing here writes (S9). */
export function getFightView(session: FightSession): FightView | null;
/** Phase one: reads and computations, the session untouched. */
export function preparePayload(
    session: FightSession,
    record: PayloadRecord,
    tables: DecoderTables,
): Result<PreparedPayload, PayloadRejected>;
/** Phase two: the write alone. Nothing here can fail but an assertion. */
export function commitPayload(session: FightSession, prepared: PreparedPayload): PayloadCommitted;

export interface PreparedPayload {
    readonly payloadIndex: number; // what the standing it was read against had applied
    readonly isOpening: boolean; // `init`, or the first payload the session sees
    readonly decoded: PayloadDecoded;
    readonly next: SessionStanding; // everything but the events, which commit appends
}
export interface PayloadCommitted {
    hasOpened: boolean;
    hasClosed: boolean;
    eventsAdded: number;
    unreadAdded: number;
}
/** A fight past a bound the options state; what stands is left whole. */
export type PayloadRejected =
    | { kind: "cast-exceeded"; count: number; maximum: number }
    | { kind: "events-exceeded"; count: number; maximum: number }
    | { kind: "payloads-exceeded"; count: number; maximum: number };

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

/** `develop`'s `FightReading`, same content. */
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
    heals: ReadonlyMap<BattleEvent, TeamHeal>;
    payloadsApplied: number;
}
```

Tallying returns figures, not a `Result`. Every way it could fail — a cut, a skill list or a proc
list past its bound — ends where a broken invariant ends, in the "reading" defect `runGuarded`
leaves, so a failure type would add code on every path and change no outcome. The bounds are
asserted.

The six balances — applied, restored, half-named and the rest — stay assertions, because they are
invariants rather than failures. A disagreement that _can_ happen (`hasFiguresDisagreed`) stays
data.

Figures are tallied once per frame, and only when something changed, memoised on `payloadsApplied`.
They are not folded in as payloads arrive: sizing a team heal reads messages from later payloads.

### 6.6 Standings

```ts
/** As tallying: the bounds are asserted, and a broken one is the frame step's defect. */
export function replayFightStandings(view: FightView, stated: StatedSkills): FightStandings;
/** What a carried status comes to, where a standing cast of its key reaches the bearer's side. */
export function tallyCarriedFigures(reading: CarriedFigureReading): CarriedFigure[];
```

Which side a key reaches is `getKeyReading`'s file's to say (`lookupKeyReach`), beside what the key
means. The published tables (`StatedSkills`, the blows granted, the status bits) are handed in by
whoever holds a frozen reading; `core/` imports none.

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
 * copy for the file are other readings of the same call (`readWarriorSnapshot`,
 * `prepareCapture`), and the listener holds the three side by side rather than this one carrying
 * the other two.
 */
export function readPayloadEnvelope(payload: unknown): Result<PayloadRecord, EnvelopeFailure>;

export const ENVELOPE_FAILURE = {
    payloadNotRecord: "payload-not-record",
    payloadFieldMalformed: "payload-field-malformed",
    payloadFieldTooLong: "payload-field-too-long",
    payloadCombatantRepeated: "payload-combatant-repeated",
} as const;
export type EnvelopeFailure =
    | { kind: typeof ENVELOPE_FAILURE.payloadNotRecord }
    | { kind: typeof ENVELOPE_FAILURE.payloadFieldMalformed; field: EnvelopeField } // ours
    | {
        kind: typeof ENVELOPE_FAILURE.payloadFieldTooLong;
        field: EnvelopeField;
        count: number;
        maximum: number;
    }
    | { kind: typeof ENVELOPE_FAILURE.payloadCombatantRepeated; combatantId: number };

/**
 * In the game's stack, right after the original: the thinning decision (payload shape and cast
 * state) and a JSON copy of a call that is kept. `develop` does the same at the same place, so the
 * cost in the game's stack does not grow. `snapshotAfter` reads the fight after the original.
 */
export function prepareCapture(
    standing: CaptureStanding,
    call: EngineCall, // the payload, its messages, and the snapshots either side
    isOpening: boolean,
): CaptureStanding;
export interface CaptureStanding {
    readonly calls: readonly CapturedCall[];
    readonly droppedCalls: number;
    readonly isTruncated: boolean; // the ceiling was reached: the file says its tail is missing
    readonly shapesSeen: ReadonlySet<string>;
    readonly statesSeen: ReadonlySet<string>;
}

/** Called on the live battle object by the engine port, inside its `callForeign`. */
export function readWarriorSnapshot(battle: unknown): Result<WarriorSnapshot, WarriorFailure>;
export type WarriorFailure =
    | { kind: "warriors-absent" } // no collection answered with a named warrior
    | { kind: "warriors-exceeded"; count: number; maximum: number };
```

A warrior entry the payload restates only in part (it carries only what moved) is not a combatant
stated in full, and is passed over rather than refused: that is how the game writes. What is refused
is the shape around the entries: a field of the wrong type, a list past its bound, an id stated
twice.

Capture has no failure of its own. The ceiling is a state of the file and not an error: it stops
collecting, counts what it dropped and says its tail is missing (`isTruncated`), which the format
has carried since version 1. A payload the JSON round trip cannot carry is recorded as `null`.

Whether the game mutates a payload after the call does not need to be settled. Everything read is
built into arrays and records of ours in the game's stack, strings are immutable, and the raw
payload for the file is copied there too. Nothing reads the game's object after `onPayload` returns.

## 8. Runtime

```ts
// Defects
export const DEFECT_KINDS = [
    "kept",
    "keeping",
    "mount",
    "region",
    "reading",
    "figures",
    "gesture",
    "file",
    "engine",
] as const;
export type DefectKind = (typeof DEFECT_KINDS)[number];
export interface Defect {
    kind: DefectKind;
    region: PanelRegion | null;
    failure: RuntimeFailure;
}
export interface DefectLedger {
    add(defect: Defect): void;
    getCounts(): readonly DefectCount[];
}
export interface DefectCount {
    kind: DefectKind;
    region: PanelRegion | null;
    count: number;
}

// Settings: field by field; a failure falls back to the default and leaves a defect
export interface Settings {
    storage: StorageChoice;
    panel: WindowSetting;
    helper: WindowSetting;
}
export interface WindowSetting {
    position: PanelPosition | null;
    isCollapsed: boolean;
}
export function readSetting<Key extends SettingKey>(
    store: KeyValueStore,
    key: Key,
): Result<SettingValue<Key>, SettingFailure>;
export function writeSetting<Key extends SettingKey>(
    store: KeyValueStore,
    key: Key,
    value: SettingValue<Key>,
): Result<void, SettingFailure>;
export type SettingFailure =
    | StoreFailure
    | { kind: "setting-unreadable"; key: SettingKey }
    | { kind: "setting-too-long"; key: SettingKey };

// The shelf
/** At start: durable state into memory, as TigerBeetle's `open`. */
export function openShelf(store: KeyValueStore): Result<ShelfContents, ShelfFailure>;
export function keepFight(
    store: KeyValueStore,
    shelf: ShelfContents,
    fight: KeptFight,
): Result<ShelfWritten, ShelfFailure>;
export function pinFight(
    store: KeyValueStore,
    shelf: ShelfContents,
    openedAt: number,
    isPinned: boolean,
): Result<ShelfWritten, ShelfFailure>;
export function removeKeptFight(
    store: KeyValueStore,
    shelf: ShelfContents,
    openedAt: number,
): Result<ShelfWritten, ShelfFailure>;
/** The rotation is stated, never silent. */
export interface ShelfWritten {
    contents: ShelfContents;
    droppedOpenedAt: readonly number[];
}
export type ShelfFailure =
    | StoreFailure
    | { kind: "shelf-unreadable" }
    | { kind: "shelf-version-unknown"; version: number }
    | { kind: "every-slot-pinned"; maximum: number }
    | { kind: "store-refused-after-rotation"; attempts: number }
    | { kind: "fight-already-kept"; openedAt: number };

// The file
/** The inverse of `decode`: meaning into the structure of a file. */
export function encodeFightFile(
    view: FightView,
    figures: FightFigures | null,
    surroundings: CaptureSurroundings,
): Result<FightFile, ExportFailure>;
export type ExportFailure =
    | { kind: "no-fight-on-screen" }
    | { kind: "calls-exceeded"; count: number; maximum: number }
    | { kind: "export-unserializable" };

// A payload and an intent change state at once; drawing waits for one frame
export interface Runtime {
    onPayload(record: PayloadRecord): void; // the game's stack: prepare → commit → markStale
    onIntent(intent: PanelIntent): void; // a listener: executeIntent → markStale
    onFrame(): FrameReport; // the only drawing
}
/** One intent, as TigerBeetle's state machine executes one operation. */
export function executeIntent(
    runtime: Runtime,
    intent: PanelIntent,
): Result<IntentExecuted, RuntimeFailure>;
/** The first mark asks for a frame; later marks before it arrives do nothing. One flag. */
export function markStale(runtime: Runtime): void;
export interface FrameReport {
    hasRendered: boolean;
    defectsAdded: number;
}
export function initRuntime(
    ports: RuntimePorts,
    tables: FrozenTables,
): Result<Runtime, BootFailure>;
/** Takes the wrap off, cancels the frame asked for, removes the listeners. */
export function deinitRuntime(runtime: Runtime): Result<void, EngineFailure>;
export interface RuntimePorts {
    clock: Clock;
    frames: FrameScheduler;
    engine: EnginePort;
    place: PlacePort;
    dictionary: DictionaryPort;
    build: BuildPort;
    tooltip: TooltipPort;
    store: KeyValueStore;
    initStore(choice: StorageChoice): KeyValueStore;
    file: FileSink;
    console: ConsolePort;
    panel: PanelView;
}
export type BootFailure = { kind: "window-unusable"; missing: string } | ForeignFailure;

// Every failure meets a fate, and the compiler holds the table complete
export type RuntimeFailure =
    | EngineFailure
    | EnvelopeFailure
    | PayloadRejected
    | StoreFailure
    | ShelfFailure
    | SettingFailure
    | ExportFailure
    | TooltipFailure
    | RenderFailure
    | GestureFailure
    | ForeignFailure
    | BrokenInvariant;
export const FATES = [
    "shown-as-unknown",
    "shown-as-suspect",
    "defect",
    "shelf-answer",
    "fallback-with-defect",
    "stand-down",
] as const;
export type FailureFate = (typeof FATES)[number];
export const FAILURE_FATES: { readonly [Kind in RuntimeFailure["kind"]]: FailureFate };
```

## 9. UI

```ts
export function presentScreen(
    figures: FightFigures,
    view: FightView,
    screen: ScreenState,
    words: PanelWords,
): Result<ScreenReading, ReadingFailure>;
export function presentStanding(
    standings: FightStandings,
    view: FightView,
): Result<StandingReading, ReadingFailure>;
export type ReadingFailure =
    | { kind: "combatant-not-in-roster"; combatantId: number }
    | { kind: "rows-clamped"; rows: number; maximum: number };

export interface PanelView {
    render(screen: ShownScreen): RenderReport;
    renderWaiting(waiting: WaitingReading): RenderReport;
    renderStanding(standing: StandingReading | null, isCollapsed: boolean): RenderReport;
}
/** A region that could not draw stands undrawn in place. */
export interface RenderReport {
    undrawn: readonly RenderFailure[];
}
export type RenderFailure = { kind: "region-undrawn"; region: PanelRegion; cause: unknown };
export type GestureFailure = { kind: "gesture-dropped"; listener: string; cause: unknown };

/** What the reader asked for, before anything is done about it. `develop` calls it `PanelPress`. */
export type PanelIntent =
    | { kind: "metric"; metric: PanelMetric }
    | { kind: "side"; side: PanelSideChoice }
    | { kind: "open-row"; combatantId: number }
    | { kind: "open-part"; part: OpenedPart }
    | { kind: "close" }
    | { kind: "fold"; window: "panel" | "helper" }
    | { kind: "move"; window: "panel" | "helper"; position: PanelPosition }
    | { kind: "save-file" }
    | { kind: "storage"; choice: StorageChoice }
    | { kind: "show-kept"; openedAt: number }
    | { kind: "pin"; openedAt: number; isPinned: boolean }
    | { kind: "remove-kept"; openedAt: number }
    | { kind: "show-live" };
```

The UI returns `Result` and `RenderReport` and neither throws nor asserts. An exception out of the
DOM is caught by `callForeign` inside its region. A listener composes an intent from the pressed
element's `data-*` attributes and calls `runtime.onIntent` at once, under `runGuarded`: a throw
there drops one gesture and leaves the state untouched.

Every union above with a `kind` gets its vocabulary object when it is built (`AGENTS.md` N19). The
literals stand in the variants here only so the document reads; §7 shows the built form.

## 10. Process

### 10.1 Start

```
window ─ readUserscriptWindow ─▶ Result<Ports, BootFailure>
   err → one console line → stand down
initRuntime(ports)
   ─▶ readSetting × 5         err → the default, and a "kept" defect
   ─▶ openShelf               err → an empty shelf, and a shelf answer
   ─▶ panel mount             err → a "mount" defect
   ─▶ markStale               the first frame
   ─▶ look for the engine every 250 ms, at most 240 times
        another-reader              → stand down, one console line
        method-absent, abandoned    → the panel waits, one console line
        found                       → engine.wrap(listener)
```

### 10.2 The game's stack: `updateData`

```
onBeforeCall ─ runGuarded(readWarriorSnapshot) ─▶ snapshotBefore | null
[the game's original runs; its exception reaches the game untouched, and we do nothing]
onPayload(payload) ─ runGuarded:
   readPayloadEnvelope     err → a "reading" defect (and messagesLost, where countable)
   readWarriorSnapshot     after the original → snapshotAfter | null
   prepareCapture          → the capture standing, committed with the session's payload
   preparePayload          ok  → commitPayload → unread counted (suspect)
                                 hasClosed → keepFight → ShelfWritten | ShelfFailure
                           err → a bound the options state: a "reading" defect
                           assertion → a "reading" defect; the session untouched
   markStale               the first mark asks for a frame
end: no DOM; cost bounded by the message count; a JSON copy only of a call thinning keeps
```

### 10.3 A gesture: `onIntent`, under `runGuarded` in the listener

```
listener ─ composes a PanelIntent from data-* (isOneOf; unknown → gesture-dropped)
   executeIntent: settings, shelf, file → Result → its fate from FAILURE_FATES
   markStale
```

### 10.4 The frame: `onFrame`, every step under `runGuarded`

```
1. tallyFightFigures (memo) → verifyFightFigures → presentScreen → render → RenderReport
2. replayFightStandings → presentStanding → renderStanding
3. tooltip.writeRows per combatant → err → a "region" defect
4. BrokenInvariant in any step → that step's defect; the rest of the frame goes on
```

How many calls fall into one frame the recordings do not say, because they carry no time. What is
certain is that there are no more drawings than frames, where `develop` draws once per call. Where
`requestFrame` answers `err`, `markStale` draws at once, as `develop` does, and leaves a "region"
defect once, because no failure goes without a mark.

### 10.5 The failure map

| Failure                                         | Fate                   | What the reader sees                                   |
| ----------------------------------------------- | ---------------------- | ------------------------------------------------------ |
| `unread` (grammar, unknown key, no parameter)   | `shown-as-suspect`     | a count beside the figure, a suspicion sentence        |
| `PayloadRejected`                               | `defect` "reading"     | the defects section; the fight read so far stands      |
| `hasJoinedInProgress` (data, not a failure)     | `shown-as-suspect`     | "joined in progress"                                   |
| `EnvelopeFailure`                               | `defect` "reading"     | the defects section: what could not be done, how often |
| `BrokenInvariant`                               | `defect` of its step   | as above; one console line per kind                    |
| `hasFiguresDisagreed` (data, not a failure)     | `defect` "figures"     | as above                                               |
| `StoreFailure` on choosing a store              | `fallback-with-defect` | memory; the storage strip says it was refused          |
| `ShelfFailure`                                  | `shelf-answer`         | the shelf's answer row                                 |
| `SettingFailure`                                | `fallback-with-defect` | the default position or fold; a "kept" defect          |
| `RenderFailure`                                 | `defect` "region"      | an undrawn mark where the region stands                |
| `GestureFailure`                                | `defect` "gesture"     | nothing happened, marked once                          |
| `ExportFailure`, `FileFailure`                  | `defect` "file"        | as above                                               |
| `TooltipFailure`                                | `defect` "region"      | the game's tooltip without our rows                    |
| `PageReadFailure`                               | `shown-as-unknown`     | no place line; our word instead of the game's          |
| `EngineFailure` another-reader, `BootFailure`   | `stand-down`           | no panel, one console line                             |
| `EngineFailure` search-abandoned, method-absent | `defect` "engine"      | the panel waits, one console line                      |

### 10.6 Where a broad catch stands

| Boundary                       | Where                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| the add-on standing up         | `readUserscriptWindow` and `initRuntime` under `runGuarded`, in the entry            |
| the wrapped engine call        | `PayloadListener.onBeforeCall` and `onPayload`                                       |
| one render region              | `callForeign` or `runGuarded` per region in `PanelView.render`                       |
| browser storage                | `callForeign` inside the `KeyValueStore` implementation                              |
| the game's own page state      | `callForeign` in `PlacePort`, `DictionaryPort`, `BuildPort`, `TooltipPort`, warriors |
| a callback somebody else calls | a DOM listener and `onFrame`, under `runGuarded`                                     |

## 11. Recorded material and the file format

- **The recordings are `develop:captures/`**, and this branch reads them without changing them.
- **The file format stays `formatVersion` 4.** `encodeFightFile` writes the fields `develop`'s
  `composeCaptureText` writes. A name changing in code (`combatantsBefore` becomes `snapshotBefore`
  in `PayloadRecord`) never reaches a key in the file, because the keys are spelled once, in the
  file module's own field map. Intake keeps reading versions 1 to 4.
- **The shelf (`MargoMeter-fights`, version 3) stays** as well. It holds the same thinned calls.
- **No format change is needed.** A call's time was wanted only to measure the period of a tick, and
  this design has no tick.

## 12. Building it

This branch starts empty, so the order is what makes each step testable on the last:

1. `libs/`: `result`, `vocabulary`, `unknown-value`, `json-text`, `number-text`, `number-range`,
   `text-walk`, each in the step that brings its first consumer (`AGENTS.md` C9), so this list is an
   order and not a batch. The gate and its first guards arrive in the same commit as the first code.
2. `core/` grammar and decoder, carried over from `develop` with its tests, returning `Result`.
3. `core/` session (`preparePayload`, `commitPayload`), figures, standings.
4. `game/` ports and the envelope, warriors and capture readers.
5. `runtime/`: defects, settings, shelf, file, `markStale`, `FAILURE_FATES`.
6. `ui/`: `present…`, `PanelView`, intents.
7. The entry, and the userscript build.
8. The simulator:

```ts
export interface FaultPlan {
    seed: number;
    storeRefusalPercent: number;
    foreignThrowPercent: number;
    payloadsPerFrame: number;
}
export function initSimulatedPorts(plan: FaultPlan, recording: Recording): SimulatedPorts;
export function runSimulation(ports: SimulatedPorts, recording: Recording): SimulationReport;
export interface SimulationReport {
    hasThrownIntoGame: boolean;
    figuresEqualFaultFree: boolean;
    unhandledKinds: readonly string[];
    defects: readonly DefectCount[];
}
```

What the simulator holds, on every recording and every seed:

- nothing reached the game's stack;
- with no data faults injected, the figures equal a fault-free run;
- every failure met a fate.

**The rewrite is proven against `develop`.** On every recording, the figures this branch draws equal
the figures `develop` @ `fa1dcce` draws. A difference is a finding in one of the two, never a golden
value to move (`AGENTS.md` W8).

## 13. Open

- The most messages one payload carried: 627, over the 36 files of `develop:captures/` on
  2026-09-24. That is also the bound on the work `preparePayload` does in the game's stack.
- Drawing once per frame moves the moment the panel is current: the frame after a payload rather
  than the payload itself. An end-to-end test must wait for the frame.
