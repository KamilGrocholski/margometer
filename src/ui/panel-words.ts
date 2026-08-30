/**
 * Everything the reader reads, and the only Polish in `src/`. Identifiers around the sentences
 * stay English, which is what keeps the boundary visible in one file.
 */

import { assert } from "@std/assert";
import { composeIntegerText } from "@/libs/number-text.ts";
import type { PanelMetric, PanelOutcome } from "@/src/ui/panel-reading.ts";
import type { PanelNoun, PanelSideChoice, PanelStorageChoice } from "@/src/ui/panel-screen.ts";

export interface CountedNoun {
    one: string;
    few: string;
    many: string;
}

export const WARNING_MARK = "⚠ ";

export const PANEL_WORDS = {
    title: "MargoMeter",
    // Neither says "bez": the figure was placed, and it is the person that was never named.
    withoutActor: "Nieznany sprawca",
    withoutTarget: "Nieznany cel",
    unknown: "Nie wiadomo",
    nothingYet: "Nikogo tu jeszcze nie ma.",
    noFightYet: "Nie było jeszcze walki.",
    noSides: "brak składu",
    fights: "Walki",
    backFromFights: "wróć",
    storage: "Trzymaj",
    ourSide: "My",
    theirSide: "Oni",
    withoutSide: "Bez strony",
    wholeFight: "Cała walka",
    openFights: "Pokaż albo schowaj zapisane walki",
    back: "skład",
    shelfEmpty: "Nie ma jeszcze zapisanych walk",
    fightOver: "Walka skończona",
    dealtTo: "KOMU",
    takenFrom: "OD KOGO",
    damageKind: "TYP OBRAŻEŃ",
    healthSource: "OD CZEGO",
    skills: "CZYM (UMIEJĘTNOŚCI)",
    skillsAgainst: "CZYM",
    /** A blow nothing was announced before. The game does not tell it from a swing it granted. */
    plainBlow: "Zwykły cios",
    withoutKind: "Bez podanego typu",
    undrawn: "nie dało się narysować",
    combatants: "Postacie",
    share: "Udział w walce",
    shareOfFigure: "Udział w tej liczbie",
    drag: "Przeciągnij, żeby przesunąć",
    collapse: "Zwiń okno",
    expand: "Rozwiń okno",
    saveRecording: "Do zgłoszeń: zapisz surowe dane walki prosto z gry",
    copyReport: "Do zgłoszeń: skopiuj policzone liczby z tej walki",
} as const;

/** Lower case: the shelf composes these a row at a time, and the header shouts them in CSS. */
const OUTCOME_WORDS: Record<PanelOutcome, string> = {
    won: "wygrana",
    lost: "przegrana",
    drawn: "remis",
};

export function getWordsForOutcome(outcome: PanelOutcome): string {
    assert(outcome.length > 0, "an outcome is asked for by name");
    const words = OUTCOME_WORDS[outcome];
    assert(words.length > 0, "and a fight that ended somehow is a fight with a word for it");
    return words;
}

const NOTHING_WORDS: Record<PanelMetric, string> = {
    damageDealtApplied: "Nie zadała nikomu obrażeń.",
    damageTakenApplied: "Nic jej nie ubyło.",
    healthGiven: "Nikogo nie leczyła.",
    healthRestored: "Nikt jej nie leczył.",
};

export function getWordsForNothing(screen: PanelMetric): string {
    assert(screen.length > 0, "a screen is asked for by name");
    const words = NOTHING_WORDS[screen];
    assert(words.length > 0, "and a figure of nothing is said in words on every one of them");
    return words;
}

const NOUN_WORDS: Record<PanelNoun, string> = {
    damage: "Obrażenia",
    healing: "Leczenie",
};

/**
 * Worded per screen rather than per direction: Polish uses one word for damage given and another
 * for healing given, and a label covering both would be ours rather than the language's.
 */
const DIRECTION_WORDS: Record<PanelMetric, string> = {
    damageDealtApplied: "zadane",
    damageTakenApplied: "otrzymane",
    healthGiven: "dane",
    healthRestored: "otrzymane",
};

const SIDE_WORDS: Record<PanelSideChoice, string> = {
    everyone: "Wszyscy",
    reader: "My",
    opposing: "Oni",
};

export function getWordsForNoun(noun: PanelNoun): string {
    assert(noun.length > 0, "a quantity is asked for by name");
    const words = NOUN_WORDS[noun];
    assert(words.length > 0, "a quantity a strip draws is a quantity with a name");
    return words;
}

export function getWordsForDirection(screen: PanelMetric): string {
    assert(screen.length > 0, "a screen is asked for by name");
    const words = DIRECTION_WORDS[screen];
    assert(words.length > 0, "a screen a strip draws says which way round it is");
    return words;
}

export function getWordsForSide(choice: PanelSideChoice): string {
    assert(choice.length > 0, "a choice of side is asked for by name");
    const words = SIDE_WORDS[choice];
    assert(words.length > 0, "a choice a strip draws is a choice with a name");
    return words;
}

/** Spelled both ways round: `Leczenie` alone means either, and here the two stand together. */
const CARD_METRIC_WORDS: Record<PanelMetric, string> = {
    damageDealtApplied: "Zadane",
    damageTakenApplied: "Otrzymane",
    healthGiven: "Leczenie dane",
    healthRestored: "Leczenie otrzymane",
};

export function getWordsForCardMetric(metric: PanelMetric): string {
    assert(metric.length > 0, "a figure the card states is asked for by name");
    const words = CARD_METRIC_WORDS[metric];
    assert(words.length > 0, "and every one of the four has a word of its own");
    return words;
}

export const CARD_WORDS = {
    raw: "surowe",
    blows: "Ciosy",
    blowsWithoutSkill: "bez umiejętności",
    skillUses: "Użycia umiejętności",
    prevented: "Zatrzymane",
    blowsCritical: "Krytyki",
    /** A subset of the line above, which is what a sub-line under it means. */
    blowsCriticalOffhand: "bronią pomocniczą",
    blowLargestDealt: "Największy cios",
    blowLargestTaken: "Największy przyjęty cios",
    /**
     * A heading over a run of parts and **never a sum of them**: points of armour and percentage
     * points of resistance stand under it, and one number over both would be two quantities
     * wearing one word (`src/core/battle-event.ts`).
     */
    destroyed: "Zniszczone",
    /**
     * Owed wherever `raw` stands: a reader meeting the two will try the subtraction, and armour
     * and resistance reduce unreported (`src/core/battle-event.ts`).
     */
    damageNote: "Surowe to obrażenia przed redukcją. Różnicy nie zatrzymała obrona — " +
        "pancerza ani odporności gra nie podaje.",
    /** The right press is not named: on the last rung it reaches nothing. */
    gesture: "LPM — rozbicie",
} as const;

/**
 * The defence that stopped part of a blow, in the player's words. Drawn as sub-lines under
 * `Zatrzymane`, so each names the defence rather than describing what it did — the line above
 * already said that.
 *
 * **Keyed by the client's own token, with no sign**, the way an element is: a figure carries the
 * token and the sign says which half of the blow it was, not which defence. The procs below are
 * keyed the other way for the opposite reason — there the sign is part of what the key names.
 *
 * All three are stated in `captures/`, measured 2026-08-30: `-absorb` on 624 blows, `-absorbm` on
 * 301 and `-blok` on 175.
 */
export const DEFENCE_WORDS: Record<string, string> = {
    blok: "blok",
    absorb: "wchłonięcie",
    absorbm: "wchłonięcie magiczne",
};

/**
 * What fired beside a blow, in the player's words. Ours, and short: these sit in a column beside a
 * count, so each is the mechanic's name and not a sentence about it.
 *
 * **Six of the twenty keys are deliberately absent**, and a reader meets them as the game's own
 * token. `+legbon_curse`, `+legbon_verycrit`, `-legbon_cleanse` and `-legbon_glare` are legendary
 * bonuses whose published name this repository has not read; `-tenacity` and `+superspell-dispel`
 * are the two article view,372 does not carry at all. Wording a mechanic nothing named would be a
 * claim about the game. **ADR 0011.**
 *
 * The five stun keys share one word because they are one event from five sources, which is what
 * `+stun2-d`'s entry in `docs/protocol-keys.md` says outright.
 *
 * **Keyed with the sign**, unlike the two tables of tokens beside it: a proc is stated by the key
 * and no figure, so the sign is part of the name — `+wound` is a wound a blow announced and
 * `wound` is one ticking afterwards, and they are different rows on different screens.
 */
export const PROC_WORDS: Record<string, string> = {
    "+crit": "krytyk",
    /** Never drawn beside the others: the card states it under the count it is a part of. */
    "+of_crit": "bronią pomocniczą",
    "+pierce": "przebicie",
    "-pierceb": "blok przebicia",
    "+stun": "ogłuszenie",
    "+stun2": "ogłuszenie",
    "+stun2-c": "ogłuszenie",
    "+stun2-d": "ogłuszenie",
    "+freeze": "zamrożenie",
    "+wound": "głęboka rana",
    "+fastarrow": "szybka strzała",
    "+acdmg_destroyed": "pancerz zniszczony",
    "-evade": "unik",
    "-contra": "kontra",
};

/** A key neither table holds reaches the reader as the game wrote it. **ADR 0011.** */
export function getWordsForBlowKey(key: string): string {
    assert(key.length > 0, "a key a blow carried is named");
    const words = PROC_WORDS[key] ?? DEFENCE_WORDS[key];
    if (words === undefined) return key;
    assert(words.length > 0, "a key either table holds is worded");
    return words;
}

/**
 * What a blow destroyed on whoever took it: the statistic, and **the unit its figure is in**.
 * `+acdmg` counts points of armour and `+resdmg` percentage points of resistance
 * (`docs/protocol-keys.md`), so a column of bare numbers under one heading is a column a reader
 * will add up and get a number that means nothing.
 *
 * The unit rides the figure rather than the name because the name shares its column with three
 * others and the figure has the room. Keyed by the token, like the defences above.
 */
export const DESTROYED_WORDS: Record<string, { name: string; unit: string }> = {
    acdmg: { name: "pancerz", unit: "pkt" },
    resdmg: { name: "odporność", unit: "p.p." },
    abdest_per: { name: "wchłanianie", unit: "pkt" },
    abmdest_per: { name: "wchłanianie magiczne", unit: "pkt" },
};

/** A key the table does not hold reaches the reader as the game wrote it. **ADR 0011.** */
export function getWordsForDestroyed(statistic: string): string {
    assert(statistic.length > 0, "a statistic a blow destroyed is named");
    const held = DESTROYED_WORDS[statistic];
    if (held === undefined) return statistic;
    assert(held.name.length > 0, "a statistic the table holds is worded");
    return held.name;
}

/** The figure with the unit it is in, which is the whole reason the two are never totalled. */
export function composeDestroyedText(statistic: string, figure: number): string {
    assert(figure > 0, "a statistic that was destroyed was destroyed by something");
    const stated = composeFigureText(figure);
    const held = DESTROYED_WORDS[statistic];
    if (held === undefined) return stated;
    assert(held.unit.length > 0, "and a statistic the table holds is counted in something");
    return `${stated} ${held.unit}`;
}

/**
 * Profession → the player's word for it. Ours rather than the client's own `eq_prof` headings,
 * for the reason **ADR 0011** gives, and the six letters are the six the recordings state
 * (`src/ui/panel-look.ts` colours the same six).
 */
export const PROFESSION_WORDS: Record<string, string> = {
    w: "Wojownik",
    p: "Paladyn",
    t: "Tropiciel",
    h: "Łowca",
    m: "Mag",
    b: "Tancerz ostrzy",
};

/** A letter the table does not hold reaches the reader as the game wrote it. **ADR 0011.** */
export function getWordsForProfession(profession: string): string {
    assert(profession.length > 0, "a profession that was stated says something");
    const words = PROFESSION_WORDS[profession];
    if (words === undefined) return profession;
    assert(words.length > 0, "a letter the table holds is worded");
    return words;
}

export function composeCardSubtitleText(
    profession: string | null,
    level: number | null,
): string | null {
    assert(level === null || Number.isSafeInteger(level), "a level stated is a whole number");
    assert(level === null || level > 0, "and somebody who has one is at least on the first");
    const stated = profession === null ? null : getWordsForProfession(profession);
    if (level === null) return stated;
    const counted = `(${composeIntegerText(level)})`;
    return stated === null ? counted : `${stated} ${counted}`;
}

/**
 * The letter in a damage key, in the player's words. Ours, and not the client's own
 * `stat-damage-…` family, which words seven of the ten for a character sheet in a grammar this
 * column cannot take. **ADR 0011.**
 */
export const ELEMENT_WORDS: Record<string, string> = {
    dmg: "fizyczne",
    dmgd: "dystansowe",
    dmgo: "broń pomocnicza",
    dmgf: "ogień",
    dmgc: "zimno",
    dmgl: "błyskawica",
    dmga: "nieuchronne",
    dmgp: "trucizna",
    dmgg: "globalne",
    thirdatt: "trzeci atak",
};

/**
 * The key health moved under, in the player's words. Ours, like the damage kinds beside it and
 * for the reason **ADR 0011** gives: the client words most of these as sentences with holes in
 * them, which is not a phrase a column can take.
 *
 * Every one of the six is stated in `captures/`, measured 2026-08-29: `heal` on 2,057 movements,
 * `heal_target` on 114, `legbon_holytouch_heal` on 53, `legbon_lastheal` on 13 stated against a
 * name, `npc_heal` on 2 and `bandage` on 1.
 */
export const HEALTH_SOURCE_WORDS: Record<string, string> = {
    heal: "przywracanie życia",
    heal_target: "uleczenie wskazanego",
    legbon_holytouch_heal: "dotyk anioła",
    legbon_lastheal: "ostatni ratunek",
    healall_per: "uleczenie sojuszników",
    npc_heal: "regeneracja potwora",
    bandage: "bandażowanie",
};

/** A key the table does not hold reaches the reader as the game wrote it. **ADR 0011.** */
export function getWordsForHealthSource(source: string): string {
    assert(source.length > 0, "a key health moved under is named");
    const words = HEALTH_SOURCE_WORDS[source];
    if (words === undefined) return source;
    assert(words.length > 0, "a key the table holds is worded");
    return words;
}

export const COUNTED_NOUNS = {
    messages: { one: "wiadomość", few: "wiadomości", many: "wiadomości" },
    heals: { one: "uleczenie", few: "uleczenia", many: "uleczeń" },
    fights: { one: "walka", few: "walki", many: "walk" },
    combatants: { one: "postać", few: "postacie", many: "postaci" },
} as const;

/**
 * What takes health down outside a blow, in the player's words.
 *
 * Kept apart from the elements above, and the pairs are the reason: `poison` is the poisoning
 * ticking afterwards and `dmgp` is the damage a blow of that element lands, so one label over
 * both would be two quantities under one word — a wrong number that looks right. The same split
 * holds for `fire` against `dmgf` and `light` against `dmgl`.
 *
 * All seven are stated in `captures/`, measured 2026-08-29: `poison` takes 543,391 over 812
 * movements, `injure` 28,521 over 184, `anguish` 24,208 over 70, `wound` 22,957 over 42, a
 * negative `heal` 8,348 over 154, `fire` 7,497 over 43 and `light` 2,677 over 69.
 */
export const HEALTH_LOSS_WORDS: Record<string, string> = {
    poison: "zatrucie",
    fire: "podpalenie",
    light: "porażenie",
    injure: "zranienie",
    wound: "głęboka rana",
    anguish: "krwawienie",
    heal: "ujemne przywracanie życia",
};

/**
 * What a figure was made of, whether a blow carried it or health went out under it. A token
 * neither table holds is drawn as the game wrote it. **ADR 0011.**
 */
export function getWordsForDamageKind(kind: string): string {
    assert(kind.length > 0, "a kind of damage is named");
    const words = ELEMENT_WORDS[kind] ?? HEALTH_LOSS_WORDS[kind];
    if (words === undefined) return kind;
    assert(words.length > 0, "a kind either table holds is worded");
    return words;
}

const TEEN_FLOOR = 12;
const TEEN_CEILING = 14;
const FEW_FLOOR = 2;
const FEW_CEILING = 4;
const TEN = 10;
const HUNDRED = 100;

/**
 * One, a few, or many: Polish picks by the last digit, except in the teens, where it picks many
 * whatever that digit is. Twenty-two takes the few form and twelve does not.
 */
export function composeCountedNoun(count: number, noun: CountedNoun): string {
    assert(Number.isSafeInteger(count), "a count is a whole number");
    assert(count >= 0, "a count is never below nothing");
    if (count === 1) return `1 ${noun.one}`;
    const lastTwo = count % HUNDRED;
    const last = count % TEN;
    if (lastTwo >= TEEN_FLOOR && lastTwo <= TEEN_CEILING) return `${count} ${noun.many}`;
    if (last >= FEW_FLOOR && last <= FEW_CEILING) return `${count} ${noun.few}`;
    return `${count} ${noun.many}`;
}

export function getWordsForPin(isPinned: boolean): string {
    assert(typeof isPinned === "boolean", "a pin is drawn for a fight that is pinned or is not");
    if (isPinned) return "Odepnij — będzie mogła zniknąć";
    return "Przypnij, żeby nie zniknęła";
}

const STORAGE_WORDS: Record<PanelStorageChoice, string> = {
    local: "na stałe",
    session: "do zamknięcia karty",
    memory: "tylko teraz",
};

export function getWordsForStorage(choice: PanelStorageChoice): string {
    assert(choice.length > 0, "a place a shelf is kept in is asked for by name");
    const words = STORAGE_WORDS[choice];
    assert(words.length > 0, "and each of the three is worded");
    return words;
}

export const STORE_REFUSED_WARNING =
    "Przeglądarka nie przyjęła tej walki — nie została zapisana. " +
    "Odepnij którąś, żeby zrobić miejsce.";

export const EVERY_SLOT_PINNED_WARNING =
    "Wszystkie miejsca są zajęte przez przypięte walki — ta się nie zapisała.";

export const CHOICE_REFUSED_WARNING =
    "Przeglądarka nie zapisała tego wyboru — zostaje tak, jak było.";

const LIVE_FIGHT_TIME = "teraz";
const LIVE_FIGHT_OUTCOME = "trwa";
const TWO_DIGITS = 2;

/**
 * Two digits either side: a column of times jumping between four and five characters reads as a
 * column of different things. Empty where the moment does not read back — `00:00` is a reading.
 */
export function getWordsForShelfTime(
    at: { hour: number; minute: number } | null,
    isLive: boolean,
): string {
    assert(typeof isLive === "boolean", "a row says whether it is the fight going on now");
    if (isLive) return LIVE_FIGHT_TIME;
    if (at === null) return "";
    assert(at.hour >= 0, "a moment on a clock is not before its own start");
    return `${composeTwoDigitText(at.hour)}:${composeTwoDigitText(at.minute)}`;
}

function composeTwoDigitText(value: number): string {
    const digits = composeIntegerText(value);
    assert(digits.length > 0, "a part of a moment is written as at least one digit");
    assert(value >= 0, "and is never below nothing");
    return digits.length >= TWO_DIGITS ? digits : `0${digits}`;
}

/**
 * The multiplication sign rather than `v`: `4v4` is English shorthand, and this panel's one
 * borrowed word would be it. The header says the same with `vs`, where there is room for a word.
 */
export function composeShelfSizeText(counts: readonly number[]): string {
    assert(counts.every((one) => one > 0), "a side that is counted has somebody on it");
    if (counts.length === 0) return "";
    return counts.map((count) => composeFigureText(count)).join("×");
}

export function getWordsForShelfOutcome(outcome: PanelOutcome | null, isLive: boolean): string {
    assert(typeof isLive === "boolean", "a row says whether it is the fight going on now");
    // How it went outranks the word for one going on: a fight that has ended is still the live
    // one until the next begins, and *trwa* over a fight the game has already called is wrong.
    if (outcome !== null) return getWordsForOutcome(outcome);
    if (isLive) return LIVE_FIGHT_OUTCOME;
    return "";
}

export function composeUsesText(uses: number): string {
    assert(Number.isSafeInteger(uses), "a count of announcements is a whole number");
    assert(uses >= 0, "and never below nothing");
    return `×${composeFigureText(uses)}`;
}

/** The sign is taken off first and put back last, so a lone minus never joins its digits. */
const MINUS_SIGN = "-";
const THOUSAND_DIGITS = 3;
const THOUSAND_SEPARATOR = " ";
/** A safe integer is sixteen digits, so five groups is past every figure the protocol states. */
const MAXIMUM_THOUSAND_GROUPS = 5;

/**
 * What a reading could not be sure of, each as one sentence a player can act on.
 *
 * The count sits in an apposition rather than as the subject, so one sentence carries all three
 * Polish forms without the verb having to agree with the number.
 */
export function composeUnreadWarning(count: number): string {
    assert(count > 0, "a warning about what could not be read is said because something was not");
    const said = composeCountedNoun(count, COUNTED_NOUNS.messages);
    assert(said.length > 0, "and it says how much of it there was");
    return `Nie udało się odczytać wszystkiego — ${said} bez odczytu, ` +
        "więc liczby mogą być zaniżone.";
}

/** The count sits in an apposition: under *nie dotarło* the verb would have to agree with it. */
export function composeLostMessageWarning(count: number): string {
    assert(count > 0, "a warning about what never arrived is said because something did not");
    const said = composeCountedNoun(count, COUNTED_NOUNS.messages);
    assert(said.length > 0, "and it says how much of it there was");
    return `Część walki nie dotarła do panelu — ${said} bez odbioru, ` +
        "więc liczby mogą być zaniżone.";
}

/** No count: what happened before the reading began is stated nowhere. */
export function composeJoinedInProgressWarning(): string {
    return "Panel zaczął czytać tę walkę już w trakcie — nie widział jej początku, " +
        "więc liczby mogą być zaniżone.";
}

export function composeUnplacedHealWarning(count: number): string {
    assert(count > 0, "a warning about healing nobody could place is said because some was not");
    const said = composeCountedNoun(count, COUNTED_NOUNS.heals);
    assert(said.length > 0, "and it says how much of it there was");
    return `Nie da się rozdzielić leczenia drużyny — ${said} bez podziału, ` +
        "więc leczenie może być zaniżone.";
}

export const REGION_WORDS = {
    header: "nagłówka",
    tabs: "zakładek",
    crumb: "ścieżki",
    list: "listy",
    pinned: "wiersza",
    sides: "podsumowania stron",
    warnings: "ostrzeżenia",
} as const;

export type PanelRegion = keyof typeof REGION_WORDS;

export function composeUndrawnText(region: PanelRegion): string {
    const words = REGION_WORDS[region];
    assert(words.length > 0, "a region that could not be drawn is a region with a name");
    assert(PANEL_WORDS.undrawn.length > 0, "and the sentence saying so says something");
    return `Nie udało się narysować ${words}.`;
}

/**
 * The fight as a headcount. The people the roster could not place are counted apart rather than
 * added to a side, because which side they are on is exactly what nobody knows.
 */
export function composeSideCountsText(sizes: readonly number[], unplaced: number): string {
    assert(unplaced >= 0, "a headcount of people on no side is never below nothing");
    assert(sizes.every((one) => one > 0), "and a side that is counted has somebody on it");
    if (sizes.length === 0) return PANEL_WORDS.noSides;
    const counted = sizes.map((count) => composeFigureText(count)).join(" vs ");
    if (unplaced === 0) return counted;
    return `${counted} +${composeFigureText(unplaced)}`;
}

/** Thousands spaced, which is how the game itself writes a figure this size. */
export function composeFigureText(value: number): string {
    assert(Number.isFinite(value), "a figure a reader is shown is a number");
    const rounded = Math.round(value);
    assert(Number.isSafeInteger(rounded), "and one the panel writes out exactly");
    const digits = composeIntegerText(rounded);
    const sign = digits.startsWith(MINUS_SIGN) ? MINUS_SIGN : "";
    const body = digits.slice(sign.length);
    let spaced = "";
    let start = body.length;
    for (let group = 0; group < MAXIMUM_THOUSAND_GROUPS; group += 1) {
        if (start <= THOUSAND_DIGITS) break;
        const from = start - THOUSAND_DIGITS;
        spaced = `${THOUSAND_SEPARATOR}${body.slice(from, start)}${spaced}`;
        start = from;
    }
    assert(start <= THOUSAND_DIGITS, "every group of three past the first stands apart");
    return `${sign}${body.slice(0, start)}${spaced}`;
}

const SHARE_FLOOR = "<1%";
/** More shares than any screen draws rows: twenty combatants, sixty-four kinds, and the pinned. */
const MAXIMUM_SHARES = 128;

/**
 * A share in whole points, with the floor spent where it is owed. A figure under half a point
 * rounds to `0%`, and on a panel that keeps zero and unknown apart that is a third thing neither
 * of them means: something happened, and it was too small to round to. Over `captures/` on
 * 2026-08-29, across the four screens and the three side choices, 55 rows print this floor — and
 * without it every one of them would read `0%` beside a figure that is not one.
 */
function composeSharePointsText(points: number, isPresent: boolean): string {
    assert(Number.isSafeInteger(points), "a share in points is a whole number of them");
    assert(points >= 0, "and never below nothing");
    if (points === 0 && isPresent) return SHARE_FLOOR;
    return `${composeIntegerText(points)}%`;
}

interface ShareInPoints {
    index: number;
    amount: number;
    points: number;
    remainder: number;
}

function composeSharesInPoints(amounts: readonly number[], whole: number): ShareInPoints[] {
    assert(whole > 0, "a share is taken of a whole that is something");
    assert(amounts.length <= MAXIMUM_SHARES, "and no more of them than a screen draws");
    return amounts.map((amount, index) => {
        const exact = (amount / whole) * HUNDRED;
        const points = Math.floor(exact);
        return { index, amount, points, remainder: exact - points };
    });
}

function getShareGroupHead(group: readonly ShareInPoints[]): ShareInPoints {
    const first = group[0];
    assert(first !== undefined, "a group that was formed has a member");
    assert(first.remainder > 0, "and a fraction somebody could be paid for");
    return first;
}

/**
 * Equal figures take a point together or not at all: the plain method hands the last point to one
 * row of a tie, and two identical numbers with different shares beside them read as a panel that
 * cannot add up. So a group of equal figures is one candidate costing as many points as it has
 * members, and where the points left will not cover it a smaller remainder is paid instead. Over
 * `captures/` on 2026-08-29 that is 12 groups of equal figures across the four screens and the
 * three side choices, and no two of a figure print different shares.
 */
function composeShareGroups(shares: readonly ShareInPoints[]): ShareInPoints[][] {
    const byAmount = new Map<number, ShareInPoints[]>();
    for (const share of shares) {
        // A share with nothing discarded is a whole number of points already.
        if (share.remainder <= 0) continue;
        const held = byAmount.get(share.amount);
        if (held === undefined) byAmount.set(share.amount, [share]);
        else held.push(share);
    }
    const groups = [...byAmount.values()];
    assert(groups.length <= shares.length, "a group holds at least the share that formed it");
    groups.sort((one, other) => {
        const first = getShareGroupHead(one);
        const second = getShareGroupHead(other);
        if (first.remainder !== second.remainder) return second.remainder - first.remainder;
        return first.index - second.index;
    });
    assert(groups.every((group) => group.length > 0), "and no group is drawn up empty");
    return groups;
}

/**
 * Every share of one whole, written so what the reader adds up comes to what the panel says it is
 * a share of. Rounding each on its own loses up to half a point per row in the same direction: of
 * the 312 screens drawing a figure over `captures/` on 2026-08-29, 106 would print a set that did
 * not add to a hundred, and all 312 do under the apportionment here. The largest remainder decides
 * who takes the points that are left; a second decimal place does not close it, because `33,3%`
 * three times adds to `99,9%` and the column still does not sum.
 */
export function composeShareTexts(amounts: readonly number[], whole: number): string[] {
    assert(whole >= 0, "a whole a share is taken of is never below nothing");
    assert(amounts.length <= MAXIMUM_SHARES, "and a screen asks for no more shares than it draws");
    if (whole <= 0) return amounts.map(() => composeSharePointsText(0, false));
    const shares = composeSharesInPoints(amounts, whole);
    const held = shares.reduce((sum, one) => sum + one.points, 0);
    const exact = shares.reduce((sum, one) => sum + one.points + one.remainder, 0);
    let left = Math.round(exact) - held;
    const unpaid: ShareInPoints[][] = [];
    for (const group of composeShareGroups(shares)) {
        if (group.length > left) {
            unpaid.push(group);
            continue;
        }
        for (const share of group) share.points += 1;
        left -= group.length;
    }
    // Where nothing but a group too big to pay for is left, the column adding up wins over the
    // evenness and the group is split, earliest row first.
    for (const group of unpaid) {
        for (const share of group) {
            if (left <= 0) break;
            share.points += 1;
            left -= 1;
        }
    }
    assert(left >= 0, "no more points are handed out than were left to hand out");
    return shares.map((one) => composeSharePointsText(one.points, one.amount > 0));
}

export function composeShareText(share: number): string {
    assert(share >= 0, "a share is never below nothing");
    assert(share <= 1, "and never more than the whole");
    return composeSharePointsText(Math.round(share * HUNDRED), share > 0);
}

export function composePlaceWords(
    mapName: string | null,
    x: number | null,
    y: number | null,
): string | null {
    assert(mapName === null || mapName.length > 0, "a map that was named says something");
    const tile = x === null || y === null ? null : `(${x}, ${y})`;
    if (mapName === null) return tile;
    if (tile === null) return mapName;
    assert(tile.length > 0, "a tile that was read is written out");
    return `${mapName} ${tile}`;
}
