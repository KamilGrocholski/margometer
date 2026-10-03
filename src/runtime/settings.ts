/**
 * What a reader chose about the panel, kept in the store field by field (`docs/design.md` §8):
 * where the shelf is kept, the size the type is drawn at, and for each of the two windows where it
 * stands, how big it was made and whether it is folded.
 *
 * Each field is its own key, so one that reads back broken costs that field alone. An absent field
 * is the reader having chosen nothing, which is the default and no failure; a field that does not
 * read back is a failure, and the runtime falls back to the default and marks it.
 */

import { assert } from "@std/assert/assert";
import { formatInteger } from "#/libs/number-text.ts";
import { parseJson } from "#/libs/json-text.ts";
import { type FieldKeys, getNumberField, isRecord } from "#/libs/unknown-value.ts";
import { isOneOf, type VocabularyWord } from "#/libs/vocabulary.ts";
import {
    type KeyValueStore,
    STORE_KEY,
    type StoreFailure,
    type StoreKey,
} from "#/src/ports/browser-store.ts";
import {
    PANEL_WINDOW,
    type PanelPosition,
    type PanelWindow,
    STORAGE_CHOICE,
    STORAGE_CHOICES,
    type StorageChoice,
    TYPE_STEP_DEFAULT,
    TYPE_STEPS,
    type TypeStep,
    type WindowSize,
} from "#/src/ui/panel-choice.ts";

export const SETTING_KEY = {
    storage: "storage",
    typeStep: "type-step",
    meterPosition: "meter-position",
    meterFolded: "meter-folded",
    helperPosition: "helper-position",
    helperFolded: "helper-folded",
    meterSize: "meter-size",
    helperSize: "helper-size",
} as const;
export type SettingKey = VocabularyWord<typeof SETTING_KEY>;

export class SettingUnreadable extends Error {
    override readonly name = "SettingUnreadable";
    readonly key: SettingKey;

    constructor(key: SettingKey) {
        super();
        this.key = key;
    }
}

export class SettingTooLong extends Error {
    override readonly name = "SettingTooLong";
    readonly key: SettingKey;

    constructor(key: SettingKey) {
        super();
        this.key = key;
    }
}

export type SettingFailure = StoreFailure | SettingUnreadable | SettingTooLong;

type PositionField = "left" | "top";
type SizeField = "width" | "height";

/**
 * The fold and the place are stored beside the shelf and never inside it: a shelf that reads back
 * broken is dropped whole, and a reader who folded a window should not have that undone by it.
 * The choice of store is kept beside the panel's own state rather than in the store it names.
 */
const STORE_KEY_BY_SETTING: { readonly [Key in SettingKey]: StoreKey } = {
    [SETTING_KEY.storage]: STORE_KEY.storage,
    [SETTING_KEY.typeStep]: STORE_KEY.typeStep,
    [SETTING_KEY.meterPosition]: STORE_KEY.meterPosition,
    [SETTING_KEY.meterFolded]: STORE_KEY.meterFolded,
    [SETTING_KEY.helperPosition]: STORE_KEY.helperPosition,
    [SETTING_KEY.helperFolded]: STORE_KEY.helperFolded,
    [SETTING_KEY.meterSize]: STORE_KEY.meterSize,
    [SETTING_KEY.helperSize]: STORE_KEY.helperSize,
};
const FOLD_SETTING_BY_WINDOW: { readonly [Window in PanelWindow]: SettingKey } = {
    [PANEL_WINDOW.meter]: SETTING_KEY.meterFolded,
    [PANEL_WINDOW.helper]: SETTING_KEY.helperFolded,
};
const POSITION_SETTING_BY_WINDOW: { readonly [Window in PanelWindow]: SettingKey } = {
    [PANEL_WINDOW.meter]: SETTING_KEY.meterPosition,
    [PANEL_WINDOW.helper]: SETTING_KEY.helperPosition,
};
const SIZE_SETTING_BY_WINDOW: { readonly [Window in PanelWindow]: SettingKey } = {
    [PANEL_WINDOW.meter]: SETTING_KEY.meterSize,
    [PANEL_WINDOW.helper]: SETTING_KEY.helperSize,
};

export const STORAGE_DEFAULT: StorageChoice = STORAGE_CHOICE.local;
/** What a fold is stored as. Nothing stored, and the empty text an unfolding leaves, is not one. */
const FOLDED = "1";
const UNFOLDED = "";
/** A position or a size is two numbers written as JSON; text longer than this is not one. */
const PAIR_LENGTH_MAXIMUM = 4096;
const POSITION_FIELDS: FieldKeys<PositionField> = { left: "left", top: "top" };
const SIZE_FIELDS: FieldKeys<SizeField> = { width: "width", height: "height" };

export function readStorageChoice(store: KeyValueStore): StorageChoice | SettingFailure {
    const storedText = store.read(STORE_KEY_BY_SETTING[SETTING_KEY.storage]);
    if (storedText instanceof Error) return storedText;
    if (storedText === null) return STORAGE_DEFAULT;
    if (!isOneOf(STORAGE_CHOICES, storedText)) return new SettingUnreadable(SETTING_KEY.storage);
    return storedText;
}

export function writeStorageChoice(
    store: KeyValueStore,
    choice: StorageChoice,
): undefined | SettingFailure {
    return store.write(STORE_KEY_BY_SETTING[SETTING_KEY.storage], choice);
}

export function readTypeStep(store: KeyValueStore): TypeStep | SettingFailure {
    const storedText = store.read(STORE_KEY_BY_SETTING[SETTING_KEY.typeStep]);
    if (storedText instanceof Error) return storedText;
    if (storedText === null) return TYPE_STEP_DEFAULT;
    if (!isOneOf(TYPE_STEPS, storedText)) return new SettingUnreadable(SETTING_KEY.typeStep);
    return storedText;
}

export function writeTypeStep(store: KeyValueStore, step: TypeStep): undefined | SettingFailure {
    return store.write(STORE_KEY_BY_SETTING[SETTING_KEY.typeStep], step);
}

export function readWindowCollapsed(
    store: KeyValueStore,
    panelWindow: PanelWindow,
): boolean | SettingFailure {
    const key = FOLD_SETTING_BY_WINDOW[panelWindow];
    const storedText = store.read(STORE_KEY_BY_SETTING[key]);
    if (storedText instanceof Error) return storedText;
    if (storedText === null) return false;
    if (storedText === FOLDED) return true;
    if (storedText === UNFOLDED) return false;
    return new SettingUnreadable(key);
}

export function writeWindowCollapsed(
    store: KeyValueStore,
    panelWindow: PanelWindow,
    isCollapsed: boolean,
): undefined | SettingFailure {
    const key = FOLD_SETTING_BY_WINDOW[panelWindow];
    return store.write(STORE_KEY_BY_SETTING[key], isCollapsed ? FOLDED : UNFOLDED);
}

/**
 * Where the reader put the window, or null where they put it nowhere. It comes back from text a
 * person can edit and a browser can truncate, so a fraction or a number written as text is not one.
 */
export function readWindowPosition(
    store: KeyValueStore,
    panelWindow: PanelWindow,
): PanelPosition | null | SettingFailure {
    const key = POSITION_SETTING_BY_WINDOW[panelWindow];
    const storedText = store.read(STORE_KEY_BY_SETTING[key]);
    if (storedText instanceof Error) return storedText;
    if (storedText === null) return null;
    if (storedText.length > PAIR_LENGTH_MAXIMUM) return new SettingTooLong(key);
    const pair = parseWholePair(storedText, POSITION_FIELDS, ["left", "top"]);
    if (pair === null) return new SettingUnreadable(key);
    return { left: pair[0], top: pair[1] };
}

/** Two whole numbers under two names, or null where the text is not exactly that. */
function parseWholePair<Field extends string>(
    text: string,
    fields: FieldKeys<Field>,
    names: readonly [Field, Field],
): readonly [number, number] | null {
    const parsed = parseJson(text);
    if (parsed instanceof Error) return null;
    if (!isRecord(parsed)) return null;
    const firstNumber = getNumberField(parsed, fields, names[0]);
    const secondNumber = getNumberField(parsed, fields, names[1]);
    if (firstNumber instanceof Error) return null;
    if (secondNumber instanceof Error) return null;
    if (firstNumber === null) return null;
    if (secondNumber === null) return null;
    if (!Number.isSafeInteger(firstNumber)) return null;
    if (!Number.isSafeInteger(secondNumber)) return null;
    return [firstNumber, secondNumber];
}

/** A position that is not two whole numbers is the caller's bug, which `formatInteger` asserts. */
export function writeWindowPosition(
    store: KeyValueStore,
    panelWindow: PanelWindow,
    position: PanelPosition,
): undefined | SettingFailure {
    const key = POSITION_SETTING_BY_WINDOW[panelWindow];
    const text = `{"left":${formatInteger(position.left)},"top":${formatInteger(position.top)}}`;
    return store.write(STORE_KEY_BY_SETTING[key], text);
}

/**
 * How big the reader made the window, or null where they left it as its type draws it. A size is
 * two whole numbers above nought, read back from text a person can edit.
 */
export function readWindowSize(
    store: KeyValueStore,
    panelWindow: PanelWindow,
): WindowSize | null | SettingFailure {
    const key = SIZE_SETTING_BY_WINDOW[panelWindow];
    const storedText = store.read(STORE_KEY_BY_SETTING[key]);
    if (storedText instanceof Error) return storedText;
    if (storedText === null) return null;
    if (storedText.length > PAIR_LENGTH_MAXIMUM) return new SettingTooLong(key);
    const pair = parseWholePair(storedText, SIZE_FIELDS, ["width", "height"]);
    if (pair === null) return new SettingUnreadable(key);
    const [width, height] = pair;
    if (width < 1) return new SettingUnreadable(key);
    if (height < 1) return new SettingUnreadable(key);
    return { width, height };
}

export function writeWindowSize(
    store: KeyValueStore,
    panelWindow: PanelWindow,
    size: WindowSize,
): undefined | SettingFailure {
    assert(size.width > 0, "a window made narrower than nothing is our bug");
    assert(size.height > 0, "and so is one made shorter than nothing");
    const key = SIZE_SETTING_BY_WINDOW[panelWindow];
    const text = `{"width":${formatInteger(size.width)},"height":${formatInteger(size.height)}}`;
    return store.write(STORE_KEY_BY_SETTING[key], text);
}

/** The window goes back to what its type draws it at, which is nothing stored. */
export function deleteWindowSize(
    store: KeyValueStore,
    panelWindow: PanelWindow,
): undefined | SettingFailure {
    return store.delete(STORE_KEY_BY_SETTING[SIZE_SETTING_BY_WINDOW[panelWindow]]);
}
