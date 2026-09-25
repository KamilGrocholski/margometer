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
import { err, ok, type Result } from "#/libs/result.ts";
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

export const SETTING_FAILURE = {
    unreadable: "setting-unreadable",
    tooLong: "setting-too-long",
} as const;

export type SettingFailure =
    | StoreFailure
    | { kind: typeof SETTING_FAILURE.unreadable; key: SettingKey }
    | { kind: typeof SETTING_FAILURE.tooLong; key: SettingKey };

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

type PositionField = "left" | "top";
const POSITION_FIELDS: FieldKeys<PositionField> = { left: "left", top: "top" };

export function readStorageChoice(store: KeyValueStore): Result<StorageChoice, SettingFailure> {
    const read = store.read(STORE_KEY_BY_SETTING.storage);
    if (!read.ok) return read;
    if (read.value === null) return ok(STORAGE_DEFAULT);
    if (!isOneOf(STORAGE_CHOICES, read.value)) {
        return err({ kind: SETTING_FAILURE.unreadable, key: SETTING_KEY.storage });
    }
    return ok(read.value);
}

export function writeStorageChoice(
    store: KeyValueStore,
    choice: StorageChoice,
): Result<void, SettingFailure> {
    return store.write(STORE_KEY_BY_SETTING.storage, choice);
}

export function readWindowFold(
    store: KeyValueStore,
    window: PanelWindow,
): Result<boolean, SettingFailure> {
    const key = FOLD_SETTING_BY_WINDOW[window];
    const read = store.read(STORE_KEY_BY_SETTING[key]);
    if (!read.ok) return read;
    if (read.value === null) return ok(false);
    if (read.value === FOLDED) return ok(true);
    if (read.value === UNFOLDED) return ok(false);
    return err({ kind: SETTING_FAILURE.unreadable, key });
}

export function writeWindowFold(
    store: KeyValueStore,
    window: PanelWindow,
    isCollapsed: boolean,
): Result<void, SettingFailure> {
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
): Result<PanelPosition | null, SettingFailure> {
    const key = POSITION_SETTING_BY_WINDOW[window];
    const read = store.read(STORE_KEY_BY_SETTING[key]);
    if (!read.ok) return read;
    if (read.value === null) return ok(null);
    if (read.value.length > POSITION_LENGTH_MAXIMUM) {
        return err({ kind: SETTING_FAILURE.tooLong, key });
    }
    const position = parseWindowPosition(read.value);
    if (position === null) return err({ kind: SETTING_FAILURE.unreadable, key });
    return ok(position);
}

/** A position that is not two whole numbers is the caller's bug, which `formatInteger` asserts. */
export function writeWindowPosition(
    store: KeyValueStore,
    window: PanelWindow,
    position: PanelPosition,
): Result<void, SettingFailure> {
    const key = POSITION_SETTING_BY_WINDOW[window];
    const text = `{"left":${formatInteger(position.left)},"top":${formatInteger(position.top)}}`;
    return store.write(STORE_KEY_BY_SETTING[key], text);
}

function parseWindowPosition(text: string): PanelPosition | null {
    const parsed = parseJson(text);
    if (!parsed.ok) return null;
    if (!isRecord(parsed.value)) return null;
    const left = getNumberField(parsed.value, POSITION_FIELDS, "left");
    const top = getNumberField(parsed.value, POSITION_FIELDS, "top");
    if (!left.ok) return null;
    if (!top.ok) return null;
    if (left.value === null) return null;
    if (top.value === null) return null;
    if (!Number.isSafeInteger(left.value)) return null;
    if (!Number.isSafeInteger(top.value)) return null;
    return { left: left.value, top: top.value };
}
