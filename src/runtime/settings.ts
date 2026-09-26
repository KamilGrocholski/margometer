/**
 * What a reader chose about the panel, kept in the store field by field (`docs/design.md` §8):
 * where the shelf is kept, and for each of the two windows where it stands and whether it is
 * folded.
 *
 * Each field is its own key, so one that reads back broken costs that field alone. An absent field
 * is the reader having chosen nothing, which is the default and no failure; a field that does not
 * read back is a failure, and the runtime falls back to the default and marks it.
 */

import { formatInteger } from "#/libs/number-text.ts";
import { parseJson } from "#/libs/json-text.ts";
import { type FieldKeys, getNumberField, isRecord } from "#/libs/unknown-value.ts";
import { isOneOf, type VocabularyWord } from "#/libs/vocabulary.ts";
import {
    type KeyValueStore,
    STORE_KEY,
    type StoreFailure,
    type StoreKey,
} from "#/src/game/browser-store.ts";
import {
    PANEL_WINDOW,
    type PanelPosition,
    type PanelWindow,
    STORAGE_CHOICE,
    STORAGE_CHOICES,
    type StorageChoice,
} from "#/src/ui/panel-choice.ts";

export const SETTING_KEY = {
    storage: "storage",
    panelPosition: "panel-position",
    panelFolded: "panel-folded",
    helperPosition: "helper-position",
    helperFolded: "helper-folded",
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

/**
 * The fold and the place are stored beside the shelf and never inside it: a shelf that reads back
 * broken is dropped whole, and a reader who folded the panel should not have that undone by it.
 * The choice of store is kept beside the panel's own state rather than in the store it names.
 */
const STORE_KEY_BY_SETTING: { readonly [Key in SettingKey]: StoreKey } = {
    [SETTING_KEY.storage]: STORE_KEY.storage,
    [SETTING_KEY.panelPosition]: STORE_KEY.panelPlace,
    [SETTING_KEY.panelFolded]: STORE_KEY.panelFolded,
    [SETTING_KEY.helperPosition]: STORE_KEY.helperPlace,
    [SETTING_KEY.helperFolded]: STORE_KEY.helperFolded,
};
const FOLD_SETTING_BY_WINDOW: { readonly [Window in PanelWindow]: SettingKey } = {
    [PANEL_WINDOW.panel]: SETTING_KEY.panelFolded,
    [PANEL_WINDOW.helper]: SETTING_KEY.helperFolded,
};
const POSITION_SETTING_BY_WINDOW: { readonly [Window in PanelWindow]: SettingKey } = {
    [PANEL_WINDOW.panel]: SETTING_KEY.panelPosition,
    [PANEL_WINDOW.helper]: SETTING_KEY.helperPosition,
};

export const STORAGE_DEFAULT: StorageChoice = STORAGE_CHOICE.local;
/** What a fold is stored as. Nothing stored, and the empty text an unfolding leaves, is not one. */
const FOLDED = "1";
const UNFOLDED = "";
/** A position is two numbers written as JSON; text longer than this is not one. */
const POSITION_LENGTH_MAXIMUM = 4096;
const POSITION_FIELDS: FieldKeys<PositionField> = { left: "left", top: "top" };

export function readStorageChoice(store: KeyValueStore): StorageChoice | SettingFailure {
    const read = store.read(STORE_KEY_BY_SETTING.storage);
    if (read instanceof Error) return read;
    if (read === null) return STORAGE_DEFAULT;
    if (!isOneOf(STORAGE_CHOICES, read)) return new SettingUnreadable(SETTING_KEY.storage);
    return read;
}

export function writeStorageChoice(
    store: KeyValueStore,
    choice: StorageChoice,
): undefined | SettingFailure {
    return store.write(STORE_KEY_BY_SETTING.storage, choice);
}

export function readWindowFold(
    store: KeyValueStore,
    window: PanelWindow,
): boolean | SettingFailure {
    const key = FOLD_SETTING_BY_WINDOW[window];
    const read = store.read(STORE_KEY_BY_SETTING[key]);
    if (read instanceof Error) return read;
    if (read === null) return false;
    if (read === FOLDED) return true;
    if (read === UNFOLDED) return false;
    return new SettingUnreadable(key);
}

export function writeWindowFold(
    store: KeyValueStore,
    window: PanelWindow,
    isCollapsed: boolean,
): undefined | SettingFailure {
    const key = FOLD_SETTING_BY_WINDOW[window];
    return store.write(STORE_KEY_BY_SETTING[key], isCollapsed ? FOLDED : UNFOLDED);
}

/**
 * Where the reader put the window, or null where they put it nowhere. It comes back from text a
 * person can edit and a browser can truncate, so a fraction or a number written as text is not one.
 */
export function readWindowPosition(
    store: KeyValueStore,
    window: PanelWindow,
): PanelPosition | null | SettingFailure {
    const key = POSITION_SETTING_BY_WINDOW[window];
    const read = store.read(STORE_KEY_BY_SETTING[key]);
    if (read instanceof Error) return read;
    if (read === null) return null;
    if (read.length > POSITION_LENGTH_MAXIMUM) return new SettingTooLong(key);
    const position = parseWindowPosition(read);
    if (position === null) return new SettingUnreadable(key);
    return position;
}

function parseWindowPosition(text: string): PanelPosition | null {
    const parsed = parseJson(text);
    if (parsed instanceof Error) return null;
    if (!isRecord(parsed)) return null;
    const left = getNumberField(parsed, POSITION_FIELDS, "left");
    const top = getNumberField(parsed, POSITION_FIELDS, "top");
    if (left instanceof Error) return null;
    if (top instanceof Error) return null;
    if (left === null) return null;
    if (top === null) return null;
    if (!Number.isSafeInteger(left)) return null;
    if (!Number.isSafeInteger(top)) return null;
    return { left, top };
}

/** A position that is not two whole numbers is the caller's bug, which `formatInteger` asserts. */
export function writeWindowPosition(
    store: KeyValueStore,
    window: PanelWindow,
    position: PanelPosition,
): undefined | SettingFailure {
    const key = POSITION_SETTING_BY_WINDOW[window];
    const text = `{"left":${formatInteger(position.left)},"top":${formatInteger(position.top)}}`;
    return store.write(STORE_KEY_BY_SETTING[key], text);
}
