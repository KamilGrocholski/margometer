/**
 * Everything the reader reads, and the only Polish in `src/`. Identifiers around the sentences
 * stay English, which is what keeps the boundary visible in one file.
 *
 * **Anything a table below does not hold reaches the reader as the game wrote it** — a key, a
 * letter, a token. Wording a mechanic nobody named would be a claim about the game.
 * `develop ADR 0011`.
 */

import { clampNumber } from "#/libs/number-range.ts";
import type { VocabularyWord } from "#/libs/vocabulary.ts";
import { formatInteger } from "#/libs/number-text.ts";
import type { OutcomeResult } from "#/src/core/battle-event.ts";
import type { FightMoment, PanelUnnamedEnd, PinnedCase, SideRelation } from "./panel-content.ts";
import type { PanelWindow, StorageChoice, TypeStep } from "./panel-choice.ts";
import type { PanelMetric, PanelNoun, PanelSideChoice } from "./panel-screen.ts";
import type { HelperAbsence, StandingTurnState } from "./panel-helper.ts";
import type { ChargedSkillState } from "#/src/core/charged-skill.ts";
import { HASTE_BIT_NAME, SLOW_BIT_NAME } from "#/src/core/carried-figure.ts";
import { HOLYTOUCH_HEALS_STATED } from "#/src/core/legendary-standing.ts";
import { HOLYTOUCH_DECLARATION_KEY, LASTHEAL_KEY } from "#/src/core/protocol-key.ts";
import { KIND_ELEMENTS_SEPARATOR } from "#/src/core/fight-statistics.ts";

export interface CountedNoun {
    one: string;
    few: string;
    many: string;
}

/**
 * Every figure whose label names more than the figure counts: a closed set, so a card's sentences
 * are bounded (S11), in the order they stand. The row closing a damage section carries the third,
 * which is why the name is not the card's (N9), and a kind naming several elements the fourth (ADR
 * 0045). `Ciosy` has none: a `+swing` is one blow, its further targets riding the same message as
 * damage against a name (`docs/protocol-keys.md`), so the count names what it counts
 * (`develop ADR 0088`, `0089`).
 */
export const CAVEAT = {
    reduction: "reduction",
    turns: "turns",
    unannounced: "unannounced",
    undivided: "undivided",
} as const;
export type Caveat = VocabularyWord<typeof CAVEAT>;

/**
 * A name out of the running client, or null where it has none to give. Declared here rather than
 * imported: `docs/design.md` §4 names no direction from `ui/` to `ports/`.
 *
 * The category is the client's own filing, and it is optional because most of what the panel asks
 * for sits in the default one. `src/ports/margonem-client-dictionary.ts` is where the shape is
 * answered, and the compiler holds the two to each other at every call site the entry composes.
 */
export type TranslateLabel = (id: string, category?: string) => string | null;

/**
 * One status on one fighter: that it stands, which the mask says and the game already knows, and
 * the figure an announcement over them comes to. **No length** — `develop ADR 0112`.
 */
export interface TooltipStatus {
    bit: number;
    percent: number | null;
}

/**
 * One fighter, as the game's own tooltip could honestly restate them. ⚠️ **Never the charge**: the
 * game's tooltip draws that itself, above our block (ADR 0038).
 */
export interface TooltipContent {
    turnsTaken: number;
    /** Whoever is holding them with a shout, and how far through the shout's turns they are. */
    provokedBy: { name: string; turnsElapsed: number; turnsStated: number } | null;
    /** How many characters their own shout is holding. Never their names — `develop ADR 0103`. */
    provokedCount: number;
    /** What the mask says stands on them, with what the announcements over them come to. */
    statuses: readonly TooltipStatus[];
    /** The heals the bonus has given them since it lit, or null where it is not standing. */
    holytouchHealsReceived: number | null;
    hasSpentLastheal: boolean;
    /**
     * Whether the panel walked into this fight. **The turns are the one row here counted from
     * the fight's own start**, so they are the one row a late start understates — everything
     * else says what stands now.
     */
    hasJoinedInProgress: boolean;
}

export const PANEL_REGION = {
    header: "header",
    strips: "strips",
    crumb: "crumb",
    list: "list",
    pinned: "pinned",
    sides: "sides",
    outside: "outside",
    suspicions: "suspicions",
    defects: "defects",
    /** The card a row opens. It is not a region of the panel's frame, and it is drawn like one. */
    card: "card",
    /** The window beside the panel. Its own region, drawn and undrawn like any other. */
    helper: "helper",
} as const;
export type PanelRegion = VocabularyWord<typeof PANEL_REGION>;

/**
 * Every kind of defect the panel words, so a reader over the words can be held to the list
 * (**S11**). The runtime's `DEFECT_KIND` is the same set, held to this one by a test rather than
 * imported, because the panel imports nothing from the runtime (§4).
 */
export const PANEL_DEFECT_KIND = {
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
export type PanelDefectKind = VocabularyWord<typeof PANEL_DEFECT_KIND>;

/**
 * A place in the two parts that give way differently on the fight's line: the map's name shortens
 * and the tile never does (ADR 0014). Either may be missing, never both.
 */
export interface PlaceWords {
    name: string | null;
    tile: string | null;
}

interface ShareInPoints {
    index: number;
    amount: number;
    points: number;
    remainder: number;
}

export const SUSPECT_MARK = "⚠ ";

export const DEFECT_MARK = "✖ ";

export const TURN_MARK = "▸ ";

/**
 * Beside the suspect mark and never instead of it: `SUSPECT_MARK` says a figure may be short
 * because this fight could not be read; this one says it is complete and answers a narrower
 * question than its label (`develop ADR 0088`). ⚠️ Text that is never shown: the ring is drawn,
 * because no family here carries U+24D8 (`develop ADR 0092`), and the letter in it is drawn too,
 * because a face's `i` sits where the face puts it (ADR 0036). This is what a copy of it reads.
 */
export const CAVEAT_MARK = "i";

export const PANEL_WORDS = {
    title: "MargoMeter",
    // Neither says "bez": the figure was placed, and it is the person that was never named.
    withoutActor: "Nieznany sprawca",
    withoutTarget: "Nieznany cel",
    unknown: "Nie wiadomo",
    unknownHowMany: "Nie wiadomo, ile",
    nothingYet: "Nikogo tu jeszcze nie ma.",
    noFightYet: "Nie było jeszcze walki.",
    // Never "no fight yet": there was one, and it is this panel that could not show it.
    fightUnread: "Nie da się pokazać tej walki.",
    // Never "no fight yet" either: the shelf holds this one, and it is the one that would not read.
    keptUnread: "Nie da się odczytać zapisanej walki.",
    // What pointing at such a fight on the shelf says: what it will not do, never why.
    keptUnreadNote: "Nie da się odczytać tej walki, więc nie otworzy się ani nie zapisze do pliku.",
    noSides: "brak składu",
    fights: "Walki",
    backFromFights: "wróć",
    options: "Opcje",
    backFromOptions: "wróć",
    storage: "Zapisane walki",
    typeSize: "Rozmiar czcionki",
    windowSize: "Rozmiar okien",
    resizeHint: "Rozmiar zmienisz, ciągnąc prawy dolny róg okna.",
    sizeOwn: "własny",
    sizeDefault: "domyślny",
    sizeReset: "przywróć",
    resizeGrip: "Przeciągnij, żeby zmienić rozmiar",
    ourSide: "My",
    theirSide: "Oni",
    withoutSide: "Bez strony",
    wholeFight: "Cała walka",
    openFights: "Pokaż albo schowaj zapisane walki",
    openOptions: "Pokaż albo schowaj opcje",
    back: "skład",
    shelfEmpty: "Nie ma jeszcze zapisanych walk.",
    dealtTo: "KOMU",
    takenFrom: "OD KOGO",
    damageKind: "TYP OBRAŻEŃ",
    healthSource: "OD CZEGO",
    skills: "CZYM",
    withoutKind: "Bez podanego typu",
    /** Between the last two kinds a pool's part may have been, when the blow does not say which. */
    eitherKind: "lub",
    /** What a bound would not give a row to, summed. Never the row that closes a section: that
     * one is what the game named nothing for, and this is what it named (`develop ADR 0055`). */
    restOfKinds: "pozostałe",
    /**
     * The section under the list, and the row inside it. **Never `pozostałe`**, which the line
     * above already is: that one is a bound's leftovers inside a cut, and a reader meeting one
     * word over two different claims has no way to tell which they are looking at (**N9**).
     */
    outsideRanking: "POZA RANKINGIEM",
    outsideRow: "Poza wierszami",
    outsideNote: "Tej części nie ma nigdzie wyżej — ani na wierszu postaci, ani pod listą.",
    restNote: "Za dużo pozycji, żeby pokazać każdą — te są tu zsumowane.",
    share: "Udział w walce",
    shareOfFigure: "Udział w tej liczbie",
    drag: "Przeciągnij, żeby przesunąć",
    collapse: "Zwiń okno",
    expand: "Rozwiń okno",
    saveFight: "Zapisz tę walkę do pliku: policzone liczby i surowy zapis prosto z gry",
} as const;

/** Lower case: the shelf composes these a row at a time, and the header shouts them in CSS. */
const OUTCOME_WORDS: Record<OutcomeResult, string> = {
    won: "wygrana",
    lost: "przegrana",
    drawn: "remis",
    fled: "ucieczka",
};

/**
 * The first letter of each word above, which is what a shelf row draws (ADR 0046): the ink says
 * which side took the fight and the letter says it again where the ink cannot be told apart.
 */
const OUTCOME_LETTERS: Record<OutcomeResult, string> = {
    won: "W",
    lost: "P",
    drawn: "R",
    fled: "U",
};

const NOTHING_WORDS: Record<PanelMetric, string> = {
    damageDealt: "Nie zadała nikomu obrażeń.",
    damageTaken: "Nic jej nie ubyło.",
    healthGiven: "Nikogo nie leczyła.",
    healthRestored: "Nikt jej nie leczył.",
};

/**
 * The closing row of a skills section, which is the figure no announcement covered.
 *
 * ⚠️ **The two healing entries draw only where the figures disagree.** What no announcement
 * covered on a healing screen is named by the key the game stated it under and stands as a row of
 * its own, so the remainder there is nought by construction (`composeSkillCut` in
 * `src/ui/panel-content.ts`), and a row under these words is a figure a reader can add up and
 * find wrong.
 */
const UNANNOUNCED_WORDS: Record<PanelMetric, string> = {
    damageDealt: "Zwykły cios",
    damageTaken: "Zwykły cios",
    healthGiven: "Bez podanej umiejętności",
    healthRestored: "Bez podanej umiejętności",
};

const NOUN_WORDS: Record<PanelNoun, string> = {
    damage: "Obrażenia",
    healing: "Leczenie",
};

/**
 * Worded per screen rather than per direction: Polish uses one word for damage given and another
 * for healing given, and a label covering both would be ours rather than the language's.
 */
const DIRECTION_WORDS: Record<PanelMetric, string> = {
    damageDealt: "zadane",
    damageTaken: "otrzymane",
    healthGiven: "dane",
    healthRestored: "otrzymane",
};

const SIDE_WORDS: Record<PanelSideChoice, string> = {
    everyone: "Wszyscy",
    reader: PANEL_WORDS.ourSide,
    opposing: PANEL_WORDS.theirSide,
};

/** Spelled both ways round: `Leczenie` alone means either, and here the two stand together. */
const CARD_METRIC_WORDS: Record<PanelMetric, string> = {
    damageDealt: "Zadane",
    damageTaken: "Otrzymane",
    healthGiven: "Leczenie dane",
    healthRestored: "Leczenie otrzymane",
};

/**
 * **The limit, and never our reason for it** (**L3**): a reader is told what cannot be known from
 * what the game sent, not that a decoder of ours found no end to charge. The fourth is drawn by no
 * row at all — a heal is always written with whoever received it — and stands so that the table is
 * keyed by every end and noun, as every table here is.
 */
const UNNAMED_END_NOTES: Record<PanelUnnamedEnd, Record<PanelNoun, string>> = {
    actor: {
        damage: "Gra nie mówi, kto to zadał — wiadomo tylko, kto to otrzymał.",
        healing: "Gra nie mówi, kto leczył — wiadomo tylko, komu życia przybyło.",
    },
    target: {
        damage: "Gra nie mówi, w kogo — wiadomo tylko, że cios wszedł.",
        healing: "Gra nie mówi, komu — wiadomo tylko, że leczenie weszło.",
    },
};
export const CAVEATS = Object.values(CAVEAT);

/**
 * Which caveat the closing row of a section carries, and none on a healing screen — where the
 * section closes against nothing at all. The noun is handed over rather than read off the metric,
 * as the unnamed ends' is: this file imports no screen of its own.
 */
const UNANNOUNCED_CAVEATS: Record<PanelNoun, Caveat | null> = {
    damage: CAVEAT.unannounced,
    healing: null,
};

const APART_NOTE = "Nikt tego nie ma na swoim wierszu — dlatego stoi osobno.";

/**
 * **What decides whether a reader may add this figure to what they have just read.** Two of the
 * five are inside the ranking and three are not, and a bar looks the same either way.
 */
const PINNED_PLACING_NOTES: Record<PinnedCase, string> = {
    dealtWithNoActor: APART_NOTE,
    givenWithNoActor: APART_NOTE,
    takenWithNoTarget: APART_NOTE,
    takenWithNoActor: "Te obrażenia są już policzone wyżej, u tych, którzy je otrzymali.",
    restoredWithNoActor: "To leczenie jest już policzone wyżej, u tych, którzy je dostali.",
};

/**
 * ⚠️ **The end a figure was counted by is not always the shown side's own end.** One standing
 * apart is charged by the end the game **did** name and damage crosses on the way
 * (`getSideRelationCharged`, `develop ADR 0013`), so on `Otrzymane` the named end is whoever swung
 * — and a sentence naming it would read as the shown side having swung.
 */
const PINNED_SCOPE_NOTES: Record<PinnedCase, string> = {
    dealtWithNoActor: "Tylko z pokazanej drużyny — to ona to zadała, choć gra nie mówi kto.",
    givenWithNoActor: "Tylko z pokazanej drużyny — to ona to wyleczyła, choć gra nie mówi kto.",
    takenWithNoActor: "Tylko z pokazanej drużyny — liczone po tym, kto je otrzymał.",
    takenWithNoTarget: "Tylko z pokazanej drużyny — gra nie mówi, kogo z niej.",
    restoredWithNoActor: "Tylko z pokazanej drużyny — liczone po tym, komu przybyło życia.",
};

/**
 * Which row under the list holds the end an opened figure left out, by the screen it is opened on.
 * Named by the label a reader sees on it: `przypięte` already means the shelf's kept fights.
 * `healthGiven` is null because a heal is always written with whoever received it, so that screen
 * draws no such row (ADR 0034).
 */
const OPENED_UNNAMED_STANDING_NOTES: Record<PanelMetric, string | null> = {
    damageDealt:
        `W obrażeniach otrzymanych ta część stoi osobno, w wierszu „${PANEL_WORDS.withoutTarget}” pod listą.`,
    damageTaken:
        `Pod listą ta część jest też w wierszu „${PANEL_WORDS.withoutActor}”, razem z resztą takich obrażeń.`,
    healthGiven: null,
    healthRestored:
        `Pod listą ta część jest też w wierszu „${PANEL_WORDS.withoutActor}”, razem z resztą takiego leczenia.`,
};

/** What a `no kind` row is, by the noun of the figure it closes. */
const NO_KIND_NOTES: Record<PanelNoun, string> = {
    damage: "Gra nie mówi, jakiego typu były te obrażenia.",
    healing: "Gra nie mówi, od czego było to leczenie.",
};

/**
 * ⚠️ **It says nothing about what the game did or did not state, and that is the point.** It
 * covers two ways of having no end at all — a name matching nobody in the roster, or nothing
 * stated at either end — and a sentence naming one would be false of the other.
 */
export const NEITHER_END_WORDS = {
    label: "Nie do przypisania",
    note: "Ta część nie trafiła na żaden wiersz — nie wiadomo ani kto, ani komu.",
} as const;

export const CARD_WORDS = {
    /**
     * The heading over the figures the fight is summed over, and it is what the two blow headings
     * below are read against: a card whose blocks each name their own scope needs the widest one
     * named too, or the widest reads as the default every other figure is a part of.
     */
    wholeFight: "W całej walce",
    /**
     * **It says what the protocol stated, not what this reader summed.** `surowe z ciosów` named a
     * scope, and the scope was not true: `-dmga` — *obrażenia nieuchronne* — never carries a
     * `+dmga` half, because nothing reduces it (`docs/protocol-keys.md`), so the figure
     * sits below the blows' own applied total on 5 of the 113 rows stating one, measured over
     * `captures/` on 2026-09-14. Worded as what was **stated** it claims nothing about
     * coverage, which is the register the rest of this file's sentences are written in (**L3**).
     */
    raw: "Podane przed redukcją",
    blows: "Ciosy",
    blowsWithoutSkill: "bez umiejętności",
    skillUses: "Użycia umiejętności",
    /**
     * **Two labels, because the card states one figure or two**: which one is whether a lost turn
     * was heard anywhere in this fight, and where none was the second half is unread, not nought.
     * At 22 characters the longer one is `LABEL_CHARACTERS_MAXIMUM` exactly, which is why its
     * slash carries no space where the figures beside it do. `develop ADR 0110`.
     */
    turns: "Tury wykonane",
    turnsWithLost: "Tury wykonane/utracone",
    prevented: "Zatrzymane",
    blowsCritical: "Krytyki",
    /** A subset of the line above, which is what a sub-line under it means. */
    blowsCriticalOffhand: "bronią pomocniczą",
    /**
     * A heading each, because the two runs stand together and half the keys under them belong to
     * the other end: `+pierce` fires when its holder attacks and `-evade` when its holder is hit
     * (`docs/protocol-keys.md`). `develop ADR 0032`.
     */
    striking: "W ciosach zadanych",
    struck: "W ciosach przyjętych",
    /** Said only where the row under the card states a narrower figure than the card does. */
    scope: "Liczby z całej walki.",
    /**
     * Said by the end left out of an opened figure: the section over it comes to a hundred with
     * that row, and a reader adding up the rest is otherwise left a part short.
     */
    insideSection: "Ta część jest wliczona w sumę nad sekcją — bez niej udziały nie dałyby 100%.",
    /**
     * A heading over a run of parts and **never a sum of them**: points of armour and percentage
     * points of resistance stand under it, and one number over both would be two quantities
     * wearing one word (`src/core/battle-event.ts`).
     */
    destroyed: "Zniszczone",
    /**
     * The run of its own the legendary bonuses stand in, at whichever end of a blow each fired —
     * the line under it names which. Those held for the whole fight stand after the colon in one
     * sentence, because a count of them would read as a count of firings (ADR 0029).
     */
    legendary: "Bonusy legendarne",
    legendaryHeld: "Przez całą walkę:",
    /**
     * Somebody else's bonuses, in the run after, each by its name and count. The word is the one
     * the screens already use for what reached a combatant (ADR 0032).
     */
    legendaryReached: "Otrzymane bonusy legendarne",
    /**
     * The instruction a row gives, and it stands wherever pressing leads somewhere —
     * `DESIGN.md` owns that rule. The right press is not named beside it: a reader on the
     * ranking has nowhere to go back to, so a row's card would promise a gesture that does nothing
     * there.
     */
    gesture: "LPM — rozwiń wiersz",
    /**
     * The way back, and it stands on the crumb alone — which is drawn only where a level is open,
     * so both gestures it names do something wherever it is read. The second is the cheapest
     * gesture the panel has and the only one nothing else states. `develop ADR 0086`.
     */
    gestureBack: "LPM tutaj — wróć o krok",
    gestureBackAnywhere: "PPM gdziekolwiek — wróć o krok",
    /**
     * Said where the window is too short for the whole card, which is the one thing this panel
     * cannot answer by drawing less of a figure. **L3**: what is not shown, never which of our
     * runs was dropped to make it fit.
     */
    cut: "Nie wszystko się mieści w tym oknie.",
} as const;

/**
 * **L3**: what the game does not report, never what this reader summed; each said once at the foot
 * of the card. ⚠️ `reduction` names no pair: told not to subtract, a reader points at the nearest
 * two numbers, and `z tych liczb` voids every subtraction instead of forbidding one. `turns` is
 * written to 60 characters, so it wraps to two lines of the card and not three. ⚠️ `unannounced`
 * says the game names no skill there, and not whether our reading missed one: that half is ours,
 * and `develop:docs/unannounced-damage.md` carries it. `undivided` says the game states one figure
 * for the whole blow, which is why the row names more than one kind (`docs/protocol-keys.md`).
 */
const CAVEAT_NOTES: Record<Caveat, string> = {
    reduction:
        "Pancerza ani odporności gra nie podaje, więc z tych liczb nie wyliczysz całej redukcji.",
    turns: "Gra nie podaje, ile tur ktoś dostał, tylko co w nich zrobił.",
    unannounced: "Gra nie mówi, czym te ciosy zadano — wiadomo tylko, że padły.",
    undivided:
        "Absorpcję gra podaje jedną liczbą na cały cios, więc nie wiadomo, ile z niej przypada na który typ.",
};

/**
 * The defence that stopped part of a blow, in the game's own word (`develop ADR 0077`), drawn as
 * sub-lines under `Zatrzymane` and, for a pool, under `Zadane` and `Otrzymane` (ADR 0012), and
 * never among the kinds of damage (ADR 0045); each word is held to the frozen counts by its test.
 * Keyed by the client's token with no sign, the way an element is: the sign says which half of the
 * blow it was, not which defence.
 */
export const DEFENCE_WORD_BY_KEY: ReadonlyMap<string, string> = new Map(Object.entries({
    blok: "blok",
    absorb: "absorpcja",
    absorbm: "absorpcja magiczna",
}));

/**
 * What fired beside a blow, in the player's words. Ours, and short: these sit in a column beside a
 * count, so each is the mechanic's name and not a sentence about it.
 *
 * **Not every key in `PROC_END_BY_KEY` has a word here**: the legendary bonuses have theirs in
 * `LEGENDARY_BONUS_WORD_BY_KEY`, and `CLIENT_ID_BY_UNWORDED_KEY` below names the rest and says
 * why. The six keys sharing `ogłuszenie` are one event
 * the client spells two ways — `+stun`, and the five variants of the monster statistic — which is
 * what `+stun2-d`'s entry in `docs/protocol-keys.md` says outright.
 *
 * **Keyed with the sign**, for the reason `DEFENCE_WORD_BY_KEY` above states: `+wound` is a wound
 * a blow announced and `wound` is one ticking afterwards, and they are different rows on different
 * screens.
 */
export const PROC_WORD_BY_KEY: ReadonlyMap<string, string> = new Map(Object.entries({
    "+crit": "krytyk",
    /** Never drawn beside the others: the card states it under the count it is a part of. */
    "+of_crit": "bronią pomocniczą",
    "+pierce": "przebicie",
    "-pierceb": "blok przebicia",
    "+stun": "ogłuszenie",
    "+stun2": "ogłuszenie",
    "+stun2-c": "ogłuszenie",
    "+stun2-d": "ogłuszenie",
    "+stun2-f": "ogłuszenie",
    "+stun2-l": "ogłuszenie",
    "+freeze": "zamrożenie",
    "+wound": "głęboka rana",
    /**
     * The same wound off the auxiliary weapon, sharing the word rather than taking one of its own:
     * a second row would split one mechanic over the hand that threw it, which is a difference the
     * five stun keys were not given either.
     */
    "+of_wound": "głęboka rana",
    /** A deep wound something weakened, which is a deep wound: `PROC_SUB_WORD_BY_KEY` says so. */
    "+woundpoison": "głęboka rana",
    "+woundfrost": "głęboka rana",
    "+woundmagic": "głęboka rana",
    "+of_woundpoison": "głęboka rana",
    "+of_woundmagic": "głęboka rana",
    "+fastarrow": "szybka strzała",
    "+swing": "szeroki zamach",
    "+acdmg_destroyed": "pancerz zniszczony",
    "-evade": "unik",
    "-parry": "parowanie",
    "-contra": "kontra",
    "-arrowblock": "blok strzały",
}));

/**
 * Counted in the row above rather than beside it, and named under it: the qualifier, never the
 * mechanic. A wound something weakened is a wound, so a reader counting the ones they left reads
 * every one of them off one line — over `captures/` on 2026-09-18 one combatant announced
 * six deep wounds, all of them weakened, and their card stated no deep-wound count at all.
 * `develop ADR 0095`.
 *
 * `+of_crit` is the same shape and is not here: the count it narrows is one of blows and not of
 * announcements, so `src/ui/panel-element.ts` draws it against a figure this table has no unit for.
 */
export const PROC_SUB_WORD_BY_KEY: ReadonlyMap<string, string> = new Map(Object.entries({
    "+woundpoison": "osłabiona",
    "+woundfrost": "osłabiona",
    "+woundmagic": "osłabiona",
    "+of_woundpoison": "osłabiona",
    "+of_woundmagic": "osłabiona",
}));

/**
 * What a label **of ours** may run to before the column cuts it. `.card-label` is `nowrap` with an
 * ellipsis, so a long one costs the card no height — it costs the end of the word, and a cut label
 * reads as a shorter label with nothing saying it was cut (`develop ADR 0088`). Our own words are
 * ours to keep short, and `tests/ui/blow-vocabulary.test.ts` holds every one of them to this.
 */
export const LABEL_CHARACTERS_MAXIMUM = 22;
/**
 * The same for a label out of the player's own client, which is not ours to keep short: its
 * dictionary runs to 41 characters for the keys asked about (build `1785244275300`, read
 * 2026-09-22), past the bound our own words keep to. ⚠️ The label is measured after `parseLabel`
 * (`src/ports/margonem-client-dictionary.ts`) takes the sign and the full stop off. ⚠️ A label
 * past the column is still cut: the client's words cut, rather than a key the game wrote for
 * itself.
 */
export const CLIENT_LABEL_CHARACTERS_MAXIMUM = 64;

/**
 * The three keys this repository has no word for, and what the client calls each in its own
 * dictionary. **The panel asks only here** — every other key it draws it has a word of its own for,
 * chosen short enough for the column above, and an answer out of somebody else's program is not.
 * `develop ADR 0024`. All three are what article `view,372` does not carry at all (`develop ADR
 * 0011`); the legendary bonuses it does carry are worded here (ADR 0030).
 *
 * Every id is spelled by the client, checked against `.cache/game-client/production/main.js` at
 * build `Bb28FQty` on 2026-09-21. Two are `msg_` and the key; `+superspell-dispel` is the one
 * that is not, and it is why this is a table rather than a rule.
 */
export const CLIENT_ID_BY_UNWORDED_KEY: ReadonlyMap<string, string> = new Map(Object.entries({
    "-tenacity": "msg_-tenacity",
    "+superspell-dispel": "msg_+dispel",
    "+superspell-prevented": "msg_+superspell-prevented",
}));

/**
 * What a blow destroyed on whoever took it: the statistic, and **the unit its figure is in**.
 * `+acdmg` counts points of armour and `+resdmg` percentage points of resistance
 * (`docs/protocol-keys.md`), so a column of bare numbers under one heading is a column a
 * reader will add up and get a number that means nothing.
 *
 * The unit rides the figure rather than the name because the name shares its column with three
 * others and the figure has the room. Keyed by the token, like the defences above.
 */
export const DESTROYED_WORD_BY_KEY: ReadonlyMap<string, { name: string; unit: string }> = new Map(
    Object.entries({
        acdmg: { name: "pancerz", unit: "pkt" },
        // The one pair here that empties the same pool in the same unit, so the names say which
        // took it rather than what it was (`docs/protocol-keys.md`).
        critpierce: { name: "pancerz z przebicia", unit: "pkt" },
        resdmg: { name: "odporność", unit: "p.p." },
        // The element rides after a colon rather than after "na", which the bound decides:
        // `odporność na błyskawice` is 23 characters against LABEL_CHARACTERS_MAXIMUM above,
        // and a label past it is cut by the column with nothing saying it was cut.
        resdmgf: { name: "odporność: ogień", unit: "p.p." },
        resdmgc: { name: "odporność: zimno", unit: "p.p." },
        resdmgl: { name: "odporność: błyskawice", unit: "p.p." },
        // `acdmg` opening this table is one letter away and is armour in points, not this
        // (`docs/protocol-keys.md`).
        actdmg: { name: "odporność: trucizna", unit: "p.p." },
        // The article's own words, as the defence line above already draws them — one pool, one
        // spelling on both surfaces (`develop ADR 0077`, **N13**).
        abdest_per: { name: "absorpcja", unit: "pkt" },
        abmdest_per: { name: "absorpcja magiczna", unit: "pkt" },
    }),
);

/**
 * Profession → the player's word for it. Ours rather than the client's own `eq_prof` headings,
 * for the reason `develop ADR 0011` gives, and the six letters are the six the recordings state
 * (`src/ui/panel-palette.ts` colours the same six).
 */
export const PROFESSION_WORD_BY_KEY: ReadonlyMap<string, string> = new Map(Object.entries({
    w: "Wojownik",
    p: "Paladyn",
    t: "Tropiciel",
    h: "Łowca",
    m: "Mag",
    b: "Tancerz ostrzy",
}));

const SIDE_PART_WORDS: Record<SideRelation, string | null> = {
    reader: SIDE_WORDS.reader,
    opposing: SIDE_WORDS.opposing,
    nobody: null,
};

/**
 * The letter in a damage key, in the player's words — **the game's own, every one of them.**
 * Not the client's `stat-damage-…` family, which words them for a character sheet in a grammar
 * this column cannot take (`develop ADR 0011`); the published help's `Typ obrażeń` table and its
 * `dmgmul…` bonus list, which name the types themselves. `develop ADR 0073`.
 *
 * A word here is therefore a claim about the game and not a matter of taste, and
 * `tests/ui/panel-words.test.ts` holds each to the frozen counts. A kind the help does not name
 * is left out rather than invented: it reaches a reader as the game's own token, which is what
 * `develop ADR 0011` asks for and is visible where an invention is not.
 */
export const ELEMENT_WORD_BY_KEY: ReadonlyMap<string, string> = new Map(Object.entries({
    dmg: "fizyczne",
    dmgd: "dystansowe",
    dmgo: "pomocnicze",
    dmgf: "ogień",
    dmgc: "zimno",
    dmgl: "błyskawice",
    dmga: "nieuchronne",
    dmgp: "trucizna",
    thirdatt: "trzeci cios",
}));

/**
 * The key health moved under, in the player's words. Ours, like the damage kinds beside it and for
 * the reason `develop ADR 0011` gives: the client words most of these as sentences with holes in
 * them, which is not a phrase a column can take. How often each is stated is
 * `docs/protocol-keys.md`'s, key by key.
 */
export const HEALTH_SOURCE_WORD_BY_KEY: ReadonlyMap<string, string> = new Map(Object.entries({
    heal: "przywracanie życia",
    heal_target: "uleczenie wskazanego",
    legbon_holytouch_heal: "dotyk anioła",
    legbon_lastheal: "ostatni ratunek",
    healall_per: "uleczenie sojuszników",
    npc_heal: "regeneracja potwora",
    bandage: "bandażowanie",
}));

/**
 * Every legendary bonus a message names, by the name the published help gives each (article
 * view,372, read 2026-10-03), so the card names them whether or not the client can be asked.
 * ADR 0030.
 */
export const LEGENDARY_BONUS_WORD_BY_KEY: ReadonlyMap<string, string> = new Map(Object.entries({
    "+legbon_curse": "Klątwa",
    "+legbon_verycrit": "Cios bardzo krytyczny",
    "-legbon_cleanse": "Płomienne oczyszczenie",
    "-legbon_glare": "Oślepienie",
    "+legbon_holytouch": "Dotyk anioła",
    "+legbon_anguish": "Krwawa udręka",
    "-legbon_critred": "Krytyczna osłona",
    legbon_lastheal: "Ostatni ratunek",
    "-legbon_facade": "Fasada opieki",
    "+legbon_puncture": "Przeszywająca skuteczność",
}));

export const COUNTED_NOUN_WORDS = {
    messages: { one: "wiadomość", few: "wiadomości", many: "wiadomości" },
    heals: { one: "uleczenie", few: "uleczenia", many: "uleczeń" },
    fights: { one: "walka", few: "walki", many: "walk" },
    combatants: { one: "postać", few: "postacie", many: "postaci" },
    turns: { one: "tura", few: "tury", many: "tur" },
} as const;

/**
 * What takes health down outside a blow, in the player's words.
 *
 * Kept apart from the elements above, and the pairs are the reason: `poison` is the poisoning
 * ticking afterwards and `dmgp` is the damage a blow of that element lands, so one label over
 * both would be two quantities under one word — a wrong number that looks right. The same split
 * holds for `fire` against `dmgf` and `light` against `dmgl`. How much each takes and over how
 * many movements is `docs/protocol-keys.md`'s, key by key.
 */
export const HEALTH_LOSS_WORD_BY_KEY: ReadonlyMap<string, string> = new Map(Object.entries({
    poison: "zatrucie",
    fire: "podpalenie",
    light: "porażenie",
    injure: "zranienie",
    wound: "głęboka rana",
    anguish: "krwawienie",
    heal: "ujemne przywracanie życia",
}));

const TEEN_FLOOR = 12;
const TEEN_CEILING = 14;
const FEW_FLOOR = 2;
const FEW_CEILING = 4;
const TEN = 10;
const HUNDRED = 100;

/** The window beside the panel: the turn in hand, what is being made ready, and who holds whom. */
export const HELPER_WORDS = {
    title: "Pomocnik",
    drag: PANEL_WORDS.drag,
    collapse: "Zwiń Pomocnika",
    expand: "Rozwiń Pomocnika",
    now: "Teraz",
    nothingHappens: "Nic się nie dzieje.",
    /** The two shouts share one state, so they share one heading — `develop ADR 0062`. */
    provocation: "Prowokacja",
    /**
     * Between whoever is holding somebody and the shout they hold them with — `develop ADR 0097`.
     */
    castSeparator: "·",
    /**
     * What a card in this window states a length under, a charge's and a shout's alike: the turns
     * left, as the game writes a charge's (ADR 0040). Never `CARD_WORDS.turns`: that one names the
     * turns a combatant took and carries the caveat that the game publishes none of them.
     */
    turnsLeft: "Zostało",
    /** The game's own name for it, the client's label on `DHSqC3Uh` (ADR 0038, **L2**). */
    chargedSkill: "Cios specjalny",
} as const;

/**
 * The words the tooltip says and the panel does not. The two bonuses it names are not here: they
 * are read from `LEGENDARY_BONUS_WORD_BY_KEY`, so the tooltip and the card cannot drift into two
 * spellings of one thing (**N13**).
 */
const TOOLTIP_WORDS = {
    /**
     * ⚠️ **Two skills put a fighter here, so the row names the state and never either of them.**
     * `Wyzywający okrzyk` and `Prowokujący okrzyk` announce the one key — 118 casts against 48 over
     * `captures/`, 2026-09-22 — so a row reading `Wyzwany` named one of the two while the
     * state had come from either.
     */
    provokedBy: "Sprowokowany przez",
    provokedCount: "Prowokuje",
    /** The bonus fires once a fight, so this is a state and never a count. */
    spent: "wykorzystany",
    turnsTaken: CARD_WORDS.turns,
} as const;

/**
 * The client files the statuses a mask carries under its own category, so an id asked without one
 * reaches the default dictionary and answers nothing. Read on development build `1781609507010`.
 */
const STATUS_CATEGORY = "buff";
/** What a reader meets outside the panel says whose it is — `SECURITY.md`'s guest rule. */
const ADD_ON_NAME = PANEL_WORDS.title;
const LEADING_STATUS_NAMES: readonly string[] = [SLOW_BIT_NAME, HASTE_BIT_NAME];
/** The two characters that would make a row of ours part of somebody else's markup. */
const MARKUP_OPENER = "<";
const MARKUP_ENTITY = "&";
/**
 * Every row one fighter can put up, **counted off the parts rather than off the corpus**: the
 * add-on's own name, the shout from either end, the two legendary bonuses, the turns taken, and
 * one row per status the client registers.
 *
 * ⚠️ **A figure taken off the corpus is the wrong figure here.** The tallest block over
 * `captures/` is seven (`develop:design/dziesiec/measured.json`), and a fabricated ten-a-side
 * stands eleven — a bound set at what has been seen falls short of what happens. It clamps rather
 * than asserts, because a fighter with one thing more to say is not a reason to stop drawing
 * (**A11**, `develop ADR 0051`).
 */
export const ROWS_BESIDE_THE_STATUSES = 6;

/**
 * What the heading says about a charge, and nothing where it is still running: there the row is
 * the whole statement. Both ends stand for one turn and then the section is gone.
 *
 * ⚠️ **One of these two words is ours.** The game has a sentence for the break, `msg_+dispel`, and
 * none at all for a blow that simply landed, so `wykonane` is this panel's word and is deliberately
 * the plainest one available (**L3**).
 */
const CHARGED_SKILL_WORDS: Record<ChargedSkillState, string> = {
    charging: "",
    struck: "wykonane",
    broken: "przerwane",
};

/**
 * What the window says where it draws no turn, one sentence per state and none where there is a
 * turn to draw. `unread` is not "no turn": there the game numbers one and this reading is what
 * could not take it, while the other two are the game numbering none at all. `develop ADR 0072`.
 */
const TURN_STATE_WORDS: Record<StandingTurnState, string> = {
    held: "",
    unread: "Nie wiadomo, czyja tura.",
    afterFight: "Walka się skończyła.",
    onAuto: "Szybka walka — gra nie podaje tur.",
};

/** The panel's own sentences where they fit, so the two windows never disagree on a fight. */
const HELPER_ABSENCE_WORDS: Record<HelperAbsence, string> = {
    noFightYet: PANEL_WORDS.noFightYet,
    betweenFights: HELPER_WORDS.nothingHappens,
    fightUnread: PANEL_WORDS.fightUnread,
};

const STORAGE_WORDS: Record<StorageChoice, string> = {
    local: "na stałe",
    session: "do zamknięcia karty",
    memory: "tylko teraz",
};

/**
 * What each answer means to the fights already kept, said under the answers: the three words alone
 * do not say that a reload is survived by one and not by another.
 */
const STORAGE_MEANING_WORDS: Record<StorageChoice, string> = {
    local: "Zostają też po zamknięciu przeglądarki.",
    session: "Przetrwają odświeżenie strony, znikną z zamknięciem karty.",
    memory: "Znikną przy odświeżeniu strony.",
};

/** A line per window in the options, so a reader who sized one is told which goes back. */
const WINDOW_WORDS: Record<PanelWindow, string> = {
    meter: "Licznik",
    helper: HELPER_WORDS.title,
};

const TYPE_STEP_WORDS: Record<TypeStep, string> = {
    small: "mały",
    medium: "średni",
    large: "duży",
};

export const STORE_REFUSED_ANSWER = "Przeglądarka nie przyjęła tej walki — nie została zapisana. " +
    "Odepnij którąś, żeby zrobić miejsce.";

export const STORE_MADE_ROOM_ANSWER =
    "Zabrakło miejsca w przeglądarce — najstarsze walki zostały usunięte, żeby zmieścić tę. " +
    "Przypnij te, które chcesz zachować.";

export const EVERY_SLOT_PINNED_ANSWER =
    "Wszystkie miejsca są zajęte przez przypięte walki — ta się nie zapisała.";

export const CHOICE_REFUSED_ANSWER =
    "Przeglądarka nie zapisała tego wyboru — zostaje tak, jak było.";

export const MOVE_REFUSED_ANSWER =
    "Wybrane miejsce nie przyjęło zapisanych walk — zostały tam, gdzie były.";

export const PIN_REFUSED_ANSWER = "Przeglądarka nie zapisała przypięcia.";

/** The labels on the card a fight opens, from its line or its shelf row (ADR 0014). */
export const FIGHT_CARD_WORDS = {
    when: "Kiedy",
    world: "Świat",
    character: "Postać",
    profession: "Profesja",
} as const;

const LIVE_FIGHT_WORDS = { time: "teraz", outcome: "trwa" } as const;
const TWO_DIGITS = 2;
/** The month a person counts first, which is the offset a lookup by month subtracts. */
const MONTH_FIRST = 1;
/** The calendar's own edges. A month outside its own is caught by finding no word for it. */
const DAY_MINIMUM = 1;
const DAY_MAXIMUM = 31;
const HOUR_MAXIMUM = 23;
const MINUTE_MAXIMUM = 59;
/**
 * The months as a Polish calendar shortens them: three letters each, so a dated column is one
 * width whichever month it falls in. A word rather than a number because two numbers either side
 * of a separator are a date nobody can order without being told which half is which.
 */
const MONTH_WORDS = [
    "sty",
    "lut",
    "mar",
    "kwi",
    "maj",
    "cze",
    "lip",
    "sie",
    "wrz",
    "paź",
    "lis",
    "gru",
];

/** The sign is taken off first and put back last, so a lone minus never joins its digits. */
const MINUS_SIGN = "-";
const THOUSAND_DIGITS = 3;
const THOUSAND_SEPARATOR = "\u00a0";
/** A safe integer is sixteen digits, so five groups is past every figure the protocol states. */
const THOUSAND_GROUPS_MAXIMUM = 5;

/** Three names is what fits beside a count; past that the sentence says how many instead. */
export const NAMED_ROWS_MAXIMUM = 3;

export const REGION_WORDS: { readonly [Region in PanelRegion]: string } = {
    header: "nagłówka",
    strips: "zakładek",
    crumb: "ścieżki",
    list: "listy",
    pinned: "wiersza",
    sides: "podsumowania stron",
    outside: "tego, co zostało poza rankingiem",
    suspicions: "ostrzeżenia",
    defects: "spisu usterek",
    card: "szczegółów wiersza",
    [PANEL_REGION.helper]: "pomocnika",
};

/** **L3**: a player is told a part of the panel is missing, never what our code believed. */
const DEFECT_WORDS: Record<PanelDefectKind, string> = {
    kept: "Panel nie odczytał tego, co miał zapisane",
    keeping: "Panel nie zapisał tej walki",
    // Said in the past: a panel that is being read got onto the page in the end, and one that
    // never did is not there to say anything at all.
    mount: "Panel nie od razu stanął na stronie",
    region: "Panel nie narysował jednej ze swoich części",
    reading: "Panel nie przeliczył tej walki",
    figures: "Liczby w panelu nie zgadzają się ze sobą",
    gesture: "Panel nie zareagował na mysz",
    file: "Panel nie przygotował pliku z walką",
    // A panel waiting for a game says what it cannot see.
    engine: "Nie widać walki w grze",
};

/**
 * What the panel draws where a share is owed and rounds to nothing. Exported because two guards
 * read a drawn share back into points, and a second spelling of the floor there would go on
 * measuring a string the panel no longer draws.
 */
export const SHARE_FLOOR = "<1%";
/** More shares than the widest section draws rows — `tests/ui/share-bound.test.ts` holds it so. */
export const SHARES_MAXIMUM = 384;

/** A group with nobody in it takes no points and sorts last, which is what an empty one is. */
const NOBODY_TO_PAY: ShareInPoints = { index: 0, amount: 0, points: 0, remainder: 0 };

export function getWordsForOutcome(outcome: OutcomeResult): string {
    const words = OUTCOME_WORDS[outcome];
    return words;
}

export function getWordsForNothing(metric: PanelMetric): string {
    const words = NOTHING_WORDS[metric];
    return words;
}

export function getWordsForUnannounced(metric: PanelMetric): string {
    const words = UNANNOUNCED_WORDS[metric];
    return words;
}

export function getWordsForNoun(noun: PanelNoun): string {
    const words = NOUN_WORDS[noun];
    return words;
}

export function getDirectionWordsForMetric(metric: PanelMetric): string {
    const words = DIRECTION_WORDS[metric];
    return words;
}

export function getWordsForSide(choice: PanelSideChoice): string {
    const words = SIDE_WORDS[choice];
    return words;
}

export function getWordsForCardMetric(metric: PanelMetric): string {
    const words = CARD_METRIC_WORDS[metric];
    return words;
}

export function getNoteForUnnamedEnd(end: PanelUnnamedEnd, noun: PanelNoun): string {
    const words = UNNAMED_END_NOTES[end][noun];
    return words;
}

export function getNoteForOpenedUnnamedStanding(metric: PanelMetric): string | null {
    const words = OPENED_UNNAMED_STANDING_NOTES[metric];
    return words;
}

export function getNoteForNoKind(noun: PanelNoun): string {
    const words = NO_KIND_NOTES[noun];
    return words;
}

export function getCaveatForUnannounced(noun: PanelNoun): Caveat | null {
    return UNANNOUNCED_CAVEATS[noun];
}

/** A kind that names more than one element is a pool's part the blow did not place (ADR 0045). */
export function getCaveatForKind(kind: string): Caveat | null {
    if (!kind.includes(KIND_ELEMENTS_SEPARATOR)) return null;
    return CAVEAT.undivided;
}

export function getWordsForPinnedStanding(pinnedCase: PinnedCase): string {
    const words = PINNED_PLACING_NOTES[pinnedCase];
    return words;
}

export function getWordsForPinnedScope(pinnedCase: PinnedCase): string {
    const words = PINNED_SCOPE_NOTES[pinnedCase];
    return words;
}

export function getNoteForCaveat(caveat: Caveat): string {
    const words = CAVEAT_NOTES[caveat];
    return words;
}

/** Ours, then the player's own client, then the key as the game wrote it. `develop ADR 0024`. */
export function getWordsForBlowKey(key: string, translate: TranslateLabel | null): string {
    const words = PROC_WORD_BY_KEY.get(key) ?? DEFENCE_WORD_BY_KEY.get(key);
    if (words !== undefined) {
        return words;
    }
    const stated = getMargonemClientWordsForKey(key, translate);
    if (stated !== null) return stated;
    return key;
}

/** Null where nobody is asked, where the client has no name, or where the name will not fit. */
function getMargonemClientWordsForKey(
    key: string,
    translate: TranslateLabel | null,
): string | null {
    if (translate === null) return null;
    const id = CLIENT_ID_BY_UNWORDED_KEY.get(key);
    if (id === undefined) return null;
    const label = translate(id);
    if (label === null) return null;
    if (label.length > CLIENT_LABEL_CHARACTERS_MAXIMUM) return null;
    if (label.length === 0) return null;
    return label;
}

/** Ours, or the key as the game wrote it where a bonus joins the game before it joins the table. */
export function getWordsForLegendaryBonus(key: string): string {
    return LEGENDARY_BONUS_WORD_BY_KEY.get(key) ?? key;
}

/** The word standing under the row a key's count landed on, and `""` where it stands alone. */
export function getSubWordsForBlowKey(key: string): string {
    return PROC_SUB_WORD_BY_KEY.get(key) ?? "";
}

export function getWordsForDestroyed(statistic: string): string {
    const word = DESTROYED_WORD_BY_KEY.get(statistic);
    if (word === undefined) return statistic;
    return word.name;
}

/** The figure with the unit it is in, which is the whole reason the two are never totalled. */
export function formatDestroyed(statistic: string, figure: number): string {
    const stated = formatFigure(figure);
    const word = DESTROYED_WORD_BY_KEY.get(statistic);
    if (word === undefined) return stated;
    return `${stated} ${word.unit}`;
}

export function getWordsForProfession(profession: string): string {
    const words = PROFESSION_WORD_BY_KEY.get(profession);
    if (words === undefined) return profession;
    return words;
}

/**
 * Who somebody is: profession, level, side — the words the row's rule stands on.
 * `develop ADR 0065`.
 */
export function formatCardSubtitle(
    profession: string | null,
    level: number | null,
    sideRelation: SideRelation,
): string | null {
    const said: string[] = [];
    if (profession !== null) said.push(getWordsForProfession(profession));
    if (isLevelStated(level)) said.push(`(${formatWholeUngrouped(level)})`);
    const stated = said.join(" ");
    const side = SIDE_PART_WORDS[sideRelation];
    if (side === null) return stated.length === 0 ? null : stated;
    return stated.length === 0 ? side : `${stated} · ${side}`;
}

/** A level the game states is a whole number above nothing; anything else is not shown. */
function isLevelStated(level: number | null): level is number {
    if (level === null) return false;
    if (!Number.isSafeInteger(level)) return false;
    return level > 0;
}

export function getWordsForHealthSource(source: string): string {
    const words = HEALTH_SOURCE_WORD_BY_KEY.get(source);
    if (words === undefined) return source;
    return words;
}

/**
 * What a figure was made of: an element, a key health went out under, or the elements a pool's
 * part stands under together, which is said as one of them (ADR 0045).
 */
export function getWordsForDamageKind(kind: string): string {
    const words = ELEMENT_WORD_BY_KEY.get(kind) ?? HEALTH_LOSS_WORD_BY_KEY.get(kind);
    if (words !== undefined) return words;
    if (!kind.includes(KIND_ELEMENTS_SEPARATOR)) return kind;
    const elementWords = kind.split(KIND_ELEMENTS_SEPARATOR).map((element) => {
        return ELEMENT_WORD_BY_KEY.get(element) ?? element;
    });
    const leadingWords = elementWords.slice(0, -1).join(", ");
    const lastWord = elementWords[elementWords.length - 1] ?? "";
    return `${leadingWords} ${PANEL_WORDS.eitherKind} ${lastWord}`;
}

/**
 * One, a few, or many: Polish picks by the last digit, except in the teens, where it picks many
 * whatever that digit is. Twenty-two takes the few form and twelve does not. `Intl.PluralRules`
 * for `pl` picks the same form for every whole number from nought up (V8 15.0, 2026-10-06); it
 * also picks one for a count below nought or not whole, which this says is not known instead.
 */
export function formatCountedNoun(count: number, noun: CountedNoun): string {
    if (!Number.isSafeInteger(count)) return `${PANEL_WORDS.unknownHowMany} ${noun.many}`;
    if (count < 0) return `${PANEL_WORDS.unknownHowMany} ${noun.many}`;
    if (count === 1) return `1 ${noun.one}`;
    const lastTwo = count % HUNDRED;
    const lastDigit = count % TEN;
    if (lastTwo >= TEEN_FLOOR) {
        if (lastTwo <= TEEN_CEILING) return `${count} ${noun.many}`;
    }
    if (lastDigit >= FEW_FLOOR) {
        if (lastDigit <= FEW_CEILING) return `${count} ${noun.few}`;
    }
    return `${count} ${noun.many}`;
}

/**
 * What the add-on adds to the game's tooltip for one fighter: one row per thing to say, empty where
 * there is nothing. Rows go one at a time: `concatTip` puts a `<br>` of its own between them
 * (production build `Bb28FQty`, read 2026-09-21; `develop ADR 0111`). The first row is the add-on's
 * name alone, the guest rule of `SECURITY.md`. ⚠️ Each row lands in HTML somebody else
 * composed, so a row carrying markup is refused rather than escaped (`develop ADR 0024`). The order
 * is fixed, so a row is found where it was last time (`develop ADR 0116`), and a row is written as
 * the game writes its own above it, `Pancerz: 120` (ADR 0039).
 */
export function presentTooltipRows(
    tooltip: TooltipContent,
    translate: TranslateLabel | null,
    statusBits: readonly string[],
): string[] {
    const rowsMaximum = statusBits.length + ROWS_BESIDE_THE_STATUSES;
    const said: string[] = [];
    // Say the turns taken, where the figure cannot be short.
    {
        // ⚠️ **A figure that may be short is drawn where it can be marked, and nowhere else.** The
        // panel draws these on a fight it walked into and says over them that every number may be
        // understated (`formatJoinedInProgressSuspicion`). This block has no room for that sentence
        // and no mark of its own, so the row it cannot qualify is the row it does not draw —
        // `CONTEXT.md`'s **Suspect** is marked beside the figure it concerns or it is not a
        // suspect, it is a wrong number.
        if (!tooltip.hasJoinedInProgress) {
            if (tooltip.turnsTaken > 0) {
                said.push(`${TOOLTIP_WORDS.turnsTaken}: ${formatFigure(tooltip.turnsTaken)}`);
            }
        }
    }
    // Say what stands of the legendary heals.
    {
        // **Dotyk anioła counts up, in heals**, while the provocation below it counts down, in
        // turns: each heal is on the wire and nothing dates a turn it ends on (`develop ADR 0113`).
        // The heals are a bare pair, as the game writes its energy; the turns carry their noun,
        // as it writes a charge's (ADR 0039).
        const given = tooltip.holytouchHealsReceived;
        if (tooltip.hasSpentLastheal) {
            const lastheal = getWordsForLegendaryBonus(LASTHEAL_KEY);
            said.push(`${lastheal}: ${TOOLTIP_WORDS.spent}`);
        }
        if (given !== null) {
            const heals = formatTooltipFraction(given, HOLYTOUCH_HEALS_STATED);
            const holytouch = getWordsForLegendaryBonus(HOLYTOUCH_DECLARATION_KEY);
            said.push(`${holytouch}: ${heals}`);
        }
    }
    // Say whom the fighter provokes, and who holds it provoked.
    {
        if (tooltip.provokedCount > 0) {
            const counted = formatCountedNoun(tooltip.provokedCount, COUNTED_NOUN_WORDS.combatants);
            said.push(`${TOOLTIP_WORDS.provokedCount}: ${counted}`);
        }
        const provoker = tooltip.provokedBy;
        if (provoker !== null) {
            const left = formatTurnsLeft(provoker.turnsElapsed, provoker.turnsStated);
            said.push(`${TOOLTIP_WORDS.provokedBy}: ${provoker.name} (${left})`);
        }
    }
    const words = { translate, statusBits, rowsMaximum };
    addStatusRows(said, getLeadingStatuses(tooltip.statuses, statusBits), words);
    addStatusRows(said, getTrailingStatuses(tooltip.statuses, statusBits), words);
    const kept = said.filter((row) => !doesRowCarryMarkup(row));
    if (kept.length === 0) return [];
    // The name takes a row of the bound like any other, so a block handed over is never longer
    // than the maximum however many rows were composed.
    return [ADD_ON_NAME, ...kept].slice(0, rowsMaximum);
}

/** `1/3`, as the game writes its energy and mana, and our word where the pair cannot stand. */
function formatTooltipFraction(figure: number, stated: number): string {
    if (!Number.isSafeInteger(figure)) return PANEL_WORDS.unknown;
    if (!Number.isSafeInteger(stated)) return PANEL_WORDS.unknown;
    if (figure < 0) return PANEL_WORDS.unknown;
    if (stated < figure) return PANEL_WORDS.unknown;
    return `${formatWholeUngrouped(figure)}/${formatWholeUngrouped(stated)}`;
}

/**
 * ⚠️ **A figure stands beside a status only where one may be said of this bearer** — which is
 * `core/carried-figure.ts`'s answer and null far more often than not. Where it is null the row is
 * the status alone. **No row here counts turns** (`develop ADR 0112`): the mask says a status
 * stands and never since when, and a re-application nobody announces renews it where nothing can
 * see.
 */
function addStatusRows(
    said: string[],
    statuses: readonly TooltipStatus[],
    words: {
        translate: TranslateLabel | null;
        statusBits: readonly string[];
        rowsMaximum: number;
    },
): void {
    for (const status of statuses) {
        if (said.length >= words.rowsMaximum) break;
        const word = getWordsForStatusBit(status.bit, words.translate, words.statusBits);
        const percent = status.percent === null ? "" : `: ${formatWholeUngrouped(status.percent)}%`;
        said.push(`${word}${percent}`);
    }
}

/** The slow, then the haste, ahead of every other status — `develop ADR 0116`. */
function getLeadingStatuses(
    statuses: readonly TooltipStatus[],
    statusBits: readonly string[],
): TooltipStatus[] {
    const leading: TooltipStatus[] = [];
    for (const name of LEADING_STATUS_NAMES) {
        for (const status of statuses) {
            if (statusBits[status.bit] === name) leading.push(status);
        }
    }
    return leading;
}

function getTrailingStatuses(
    statuses: readonly TooltipStatus[],
    statusBits: readonly string[],
): TooltipStatus[] {
    // A bit the client registers no status for is one it draws nothing for, and neither does this.
    return statuses.filter((status) => {
        const name = statusBits[status.bit];
        if (name === undefined) return false;
        return !LEADING_STATUS_NAMES.includes(name);
    });
}

function doesRowCarryMarkup(row: string): boolean {
    if (row.includes(MARKUP_OPENER)) return true;
    return row.includes(MARKUP_ENTITY);
}

/**
 * The client's word for a status, or the key as the game wrote it — the second and third rungs of
 * `develop ADR 0024`, and there is no first here: this repository has no word of its own for any
 * bit of the mask, and inventing one would put a made-up label where the game already has a real
 * one.
 */
function getWordsForStatusBit(
    bit: number,
    translate: TranslateLabel | null,
    statusBits: readonly string[],
): string {
    const key = statusBits[bit];
    if (key === undefined) return PANEL_WORDS.unknown;
    if (translate === null) return key;
    const said = translate(key, STATUS_CATEGORY);
    if (said === null) return key;
    if (said.length === 0) return key;
    if (said.length > CLIENT_LABEL_CHARACTERS_MAXIMUM) return key;
    if (doesRowCarryMarkup(said)) return key;
    return said;
}

/**
 * `2 tury`, the turns a length has left, as the game writes a charge's: every length the tooltip
 * and Pomocnik draw (ADR 0039, ADR 0040). A figure below none or past what is stated is a
 * subtraction somebody got backwards, so it is not drawn as one. ⚠️ **Nought is drawn**: a shout
 * stands while its turns are `<=` what the table gives it (`core/aura-standing.ts`), so a held
 * character's last turn arrives as none left, and a charge lands on the turn none is left.
 */
export function formatTurnsLeft(turnsElapsed: number, turnsStated: number): string {
    if (!Number.isSafeInteger(turnsElapsed)) return PANEL_WORDS.unknown;
    if (!Number.isSafeInteger(turnsStated)) return PANEL_WORDS.unknown;
    if (turnsElapsed < 0) return PANEL_WORDS.unknown;
    if (turnsStated < turnsElapsed) return PANEL_WORDS.unknown;
    return formatCountedNoun(turnsStated - turnsElapsed, COUNTED_NOUN_WORDS.turns);
}

export function getWordsForChargedSkill(state: ChargedSkillState): string {
    const words = CHARGED_SKILL_WORDS[state];
    return words;
}

/**
 * The line under a charge's name on its card: whoever is making the blow ready, and at either end
 * what became of it. The band's own heading states one state word off the first charge it drew,
 * so a card saying nothing about its own row's would leave a second charge described by the
 * first's. `develop ADR 0100`.
 */
export function formatChargedSkillSubtitle(name: string, state: ChargedSkillState): string {
    const said = getWordsForChargedSkill(state);
    if (said.length === 0) return name;
    return `${name} ${HELPER_WORDS.castSeparator} ${said}`;
}

export function getWordsForTurnState(state: StandingTurnState): string {
    const words = TURN_STATE_WORDS[state];
    return words;
}

export function getWordsForHelperAbsence(absence: HelperAbsence): string {
    const words = HELPER_ABSENCE_WORDS[absence];
    return words;
}

/** The game's own numbering, and never a count of what this fight has run. */
export function formatTurnOrdinal(ordinal: number): string {
    if (!Number.isSafeInteger(ordinal)) return PANEL_WORDS.unknown;
    if (ordinal < 0) return PANEL_WORDS.unknown;
    return `tura ${formatWholeUngrouped(ordinal)}`;
}

export function getWordsForPin(isPinned: boolean): string {
    if (isPinned) return "Odepnij — będzie mogła zniknąć";
    return "Przypnij, żeby nie zniknęła";
}

export function getWordsForStorage(choice: StorageChoice): string {
    const words = STORAGE_WORDS[choice];
    return words;
}

export function getWordsForStorageMeaning(choice: StorageChoice): string {
    const words = STORAGE_MEANING_WORDS[choice];
    return words;
}

export function getWordsForWindow(window: PanelWindow): string {
    const words = WINDOW_WORDS[window];
    return words;
}

export function getWordsForTypeStep(step: TypeStep): string {
    const words = TYPE_STEP_WORDS[step];
    return words;
}

/** When and where a kept fight that would not read was fought: what the shelf row would say. */
export function formatKeptUnread(moment: FightMoment | null, place: string | null): string {
    const parts = [formatShelfTime(moment, false), place ?? ""];
    return parts.filter((phrase) => phrase.length > 0).join(" · ");
}

/**
 * Two digits either side and the day in front of them: a column of times jumping between four and
 * five characters reads as a column of different things, and a shelf spanning days reads as one
 * day where nothing says which. Empty where the moment does not read back — `00:00` is a reading,
 * and so is a day nobody stated.
 *
 * The place is what pays for the width, on every row (`DESIGN.md`, `develop ADR 0084`).
 */
export function formatShelfTime(moment: FightMoment | null, isLive: boolean): string {
    if (isLive) return LIVE_FIGHT_WORDS.time;
    if (moment === null) return "";
    if (moment.hour > HOUR_MAXIMUM) return "";
    if (moment.minute > MINUTE_MAXIMUM) return "";
    if (moment.day < DAY_MINIMUM) return "";
    if (moment.day > DAY_MAXIMUM) return "";
    const month = MONTH_WORDS[moment.month - MONTH_FIRST];
    if (month === undefined) return "";
    const day = formatTwoDigits(moment.day);
    if (day === "") return "";
    const hour = formatTwoDigits(moment.hour);
    if (hour === "") return "";
    const minute = formatTwoDigits(moment.minute);
    if (minute === "") return "";
    return `${day} ${month} ${hour}:${minute}`;
}

function formatTwoDigits(momentPart: number): string {
    if (!Number.isSafeInteger(momentPart)) return "";
    if (momentPart < 0) return "";
    return formatWholeUngrouped(momentPart).padStart(TWO_DIGITS, "0");
}

/**
 * The multiplication sign rather than `v`: `4v4` is English shorthand, and this panel's one
 * borrowed word would be it. The header says the same with `vs`, where there is room for a word.
 */
export function formatShelfSize(counts: readonly number[]): string {
    const countsStated = counts.filter((count) => count > 0);
    if (countsStated.length === 0) return "";
    return countsStated.map((count) => formatFigure(count)).join("×");
}

export function getWordsForShelfOutcome(outcome: OutcomeResult | null, isLive: boolean): string {
    // How it went outranks the word for one going on: a fight that has ended is still the live
    // one until the next begins, and *trwa* over a fight the game has already called is wrong.
    if (outcome !== null) return getWordsForOutcome(outcome);
    if (isLive) return LIVE_FIGHT_WORDS.outcome;
    return "";
}

export function getLetterForShelfOutcome(outcome: OutcomeResult): string {
    const letter = OUTCOME_LETTERS[outcome];
    return letter;
}

export function formatUses(uses: number): string {
    if (uses < 0) return PANEL_WORDS.unknown;
    return `×${formatFigure(uses)}`;
}

/**
 * Whom a gap reaches, as the sentence puts them: names while they are few, a count past that — a
 * list growing with the fight would be a second ranking, drawn in a paragraph. `develop ADR 0070`.
 */
export function formatNamesReachedByGap(names: readonly string[], charged: number): string {
    if (charged <= 0) return "";
    // A list leaving out somebody the roster could not name would read as everybody reached, so
    // the count stands wherever a name is missing.
    if (names.length === charged) {
        if (charged <= NAMED_ROWS_MAXIMUM) return ` (${names.join(", ")})`;
    }
    return ` (dotyczy ${formatGenitiveNoun(charged, COUNTED_NOUN_WORDS.combatants)})`;
}

/**
 * A count under a word governing the genitive — `z`, `dotyczy`. The **many** form is the genitive
 * plural: `1 z 3 uleczeń`, never `3 uleczenia`, which is the form nothing governs.
 */
function formatGenitiveNoun(count: number, noun: CountedNoun): string {
    return `${formatWholeUngrouped(count)} ${noun.many}`;
}

/**
 * What a reading could not be sure of, each as one sentence a player can act on. The count sits
 * in an apposition, so one sentence carries all three Polish forms without the verb agreeing with
 * it. Each says **what cannot be known** and never what this reader could not do (**L3**), which
 * is what keeps the three unread causes apart. `develop ADR 0070`.
 */
export function formatUnknownKeySuspicion(
    count: number,
    stated: number,
    whom: string,
): string {
    if (count <= 0) return "";
    const said = formatOutOf(count, stated, COUNTED_NOUN_WORDS.messages);
    return "Nie wiadomo, co znaczyła część tego, co powiedziała gra — " +
        `${said} bez odczytu${whom}, więc liczby mogą być zaniżone.`;
}

/**
 * How much a reading could not read, against how much there was: two of twelve is a fight nobody
 * can trust, two of four hundred is a number in the third decimal place. A denominator of one is
 * dropped — it adds nothing, and `z 1` wants a genitive singular this vocabulary has not got.
 */
function formatOutOf(count: number, stated: number, noun: CountedNoun): string {
    if (stated <= 1) return formatCountedNoun(count, noun);
    if (stated < count) return formatCountedNoun(count, noun);
    return `${formatWholeUngrouped(count)} z ${formatGenitiveNoun(stated, noun)}`;
}

export function formatNoParameterSuspicion(
    count: number,
    stated: number,
    whom: string,
): string {
    if (count <= 0) return "";
    const said = formatOutOf(count, stated, COUNTED_NOUN_WORDS.messages);
    return "Część tego, co powiedziała gra, nie niosła żadnej liczby — " +
        `${said} bez odczytu${whom}, więc liczby mogą być zaniżone.`;
}

/** It names nobody, and takes no `whom`: a message nothing could be read out of named no end. */
export function formatGrammarRefusedSuspicion(count: number, stated: number): string {
    if (count <= 0) return "";
    const said = formatOutOf(count, stated, COUNTED_NOUN_WORDS.messages);
    return "Części tego, co powiedziała gra, nie dało się rozłożyć na słowa — " +
        `${said} bez odczytu, więc liczby mogą być zaniżone.`;
}

/** The count sits in an apposition: under *nie dotarło* the verb would have to agree with it. */
export function formatLostMessageSuspicion(count: number, stated: number): string {
    if (count <= 0) return "";
    const said = formatOutOf(count, stated, COUNTED_NOUN_WORDS.messages);
    return `Część walki nie dotarła do panelu — ${said} bez odbioru, ` +
        "więc wszystkie liczby mogą być zaniżone.";
}

/** No count: what happened before the reading began is stated nowhere. */
export function formatJoinedInProgressSuspicion(): string {
    return "Panel zaczął czytać tę walkę już w trakcie — nie widział jej początku, " +
        "więc wszystkie liczby mogą być zaniżone.";
}

export function formatUnplacedHealSuspicion(
    count: number,
    stated: number,
    whom: string,
): string {
    if (count <= 0) return "";
    const said = formatOutOf(count, stated, COUNTED_NOUN_WORDS.heals);
    return `Nie da się rozdzielić leczenia drużyny — ${said} bez podziału${whom}, ` +
        "więc leczenie może być zaniżone.";
}

/**
 * The same suspicions about one person — and after `develop ADR 0069` the only place one naming
 * somebody is said. No denominator: what a row would be counted out of is the messages naming that
 * person, which nothing counts. `postać` is feminine, so the possessive is `jej` whoever the row
 * is.
 */
export function formatUnknownKeyRowSuspicion(count: number): string {
    if (count <= 0) return "";
    const said = formatCountedNoun(count, COUNTED_NOUN_WORDS.messages);
    return `Nie wiadomo, co znaczyła część tego, co gra powiedziała z jej udziałem — ${said} ` +
        "bez odczytu, więc jej liczby mogą być zaniżone.";
}

export function formatNoParameterRowSuspicion(count: number): string {
    if (count <= 0) return "";
    const said = formatCountedNoun(count, COUNTED_NOUN_WORDS.messages);
    return `Część tego, co gra powiedziała z jej udziałem, nie niosła żadnej liczby — ${said} ` +
        "bez odczytu, więc jej liczby mogą być zaniżone.";
}

export function formatUnplacedHealRowSuspicion(count: number): string {
    if (count <= 0) return "";
    const said = formatCountedNoun(count, COUNTED_NOUN_WORDS.heals);
    return `Nie da się rozdzielić jej leczenia drużyny — ${said} bez podziału, ` +
        "więc jej leczenie może być zaniżone.";
}

export function formatUndrawn(region: PanelRegion): string {
    return `Nie udało się narysować ${REGION_WORDS[region]}.`;
}

/**
 * A whole number as text, degrading rather than asserting (`AGENTS.md` E12): `formatInteger`
 * asserts its input is a safe integer, and the panel is the layer that must not stop. On every
 * whole number it is `formatInteger`; a fraction rounds, and what is no number is the unknown word.
 */
export function formatWholeUngrouped(wholeNumber: number): string {
    if (Number.isSafeInteger(wholeNumber)) return formatInteger(wholeNumber);
    if (!Number.isFinite(wholeNumber)) return PANEL_WORDS.unknown;
    const rounded = Math.round(wholeNumber);
    if (!Number.isSafeInteger(rounded)) return PANEL_WORDS.unknown;
    return formatInteger(rounded);
}

/** A tally of one is not drawn: `(1×)` reads as a count somebody has to work out. */
export function formatDefect(
    kind: PanelDefectKind,
    region: PanelRegion | null,
    count: number,
): string {
    let said: string;
    if (kind === PANEL_DEFECT_KIND.region) {
        said = region === null ? DEFECT_WORDS[kind] : `Panel nie narysował ${REGION_WORDS[region]}`;
    } else {
        said = DEFECT_WORDS[kind];
    }
    if (!Number.isSafeInteger(count)) return `${said}.`;
    if (count <= 1) return `${said}.`;
    return `${said} (${formatWholeUngrouped(count)}×).`;
}

/**
 * The fight as a headcount. The people the roster could not place are counted apart rather than
 * added to a side, because which side they are on is exactly what nobody knows.
 */
export function formatSideCounts(sizes: readonly number[], unplaced: number): string {
    const counts = sizes.filter((size) => size > 0);
    if (counts.length === 0) return PANEL_WORDS.noSides;
    const counted = counts.map((count) => formatFigure(count)).join(" vs ");
    if (unplaced <= 0) return counted;
    return `${counted} +${formatFigure(unplaced)}`;
}

/**
 * ⚠️ **Divided and never added**: the sum is not the turns anybody was granted
 * (`develop ADR 0110`). Spaced on the space that never breaks, for the reason `formatFigure` spaces
 * thousands on — a figure folded across two lines reads as a number half its size
 * (`DESIGN.md`).
 */
export function formatTurns(taken: number, lost: number): string {
    const divider = `${THOUSAND_SEPARATOR}/${THOUSAND_SEPARATOR}`;
    return `${formatFigure(taken)}${divider}${formatFigure(lost)}`;
}

/**
 * Thousands spaced as the game spaces them, on a space that never breaks — `DESIGN.md`. A
 * figure that is not one is drawn as *not known*, never as `0`: they are different claims
 * (`CONTEXT.md`).
 */
export function formatFigure(figure: number): string {
    // ⚠️ One check, not two, and every caller relies on it: rounding what is not a number answers
    // what is not a whole one either, so a second guard anywhere above this is unreachable.
    const rounded = Math.round(figure);
    if (!Number.isSafeInteger(rounded)) return PANEL_WORDS.unknown;
    const digits = formatWholeUngrouped(rounded);
    const sign = digits.startsWith(MINUS_SIGN) ? MINUS_SIGN : "";
    const body = digits.slice(sign.length);
    let spaced = "";
    let start = body.length;
    for (let group = 0; group < THOUSAND_GROUPS_MAXIMUM; group += 1) {
        if (start <= THOUSAND_DIGITS) break;
        const from = start - THOUSAND_DIGITS;
        spaced = `${THOUSAND_SEPARATOR}${body.slice(from, start)}${spaced}`;
        start = from;
    }
    return `${sign}${body.slice(0, start)}${spaced}`;
}

/**
 * Every share of one whole, written so what the reader adds up comes to what the panel says it is a
 * share of. Rounding each on its own loses up to half a point per row in the same direction: of the
 * 312 screens drawing a figure over `captures/` on 2026-08-29, 106 would print a set that
 * did not add to a hundred. The largest remainder decides who takes the points that are left; a
 * second decimal place does not close it, because `33,3%` three times adds to `99,9%` and the
 * column still does not sum.
 */
export function formatSharesApportioned(amounts: readonly number[], whole: number): string[] {
    // A whole that is not a number states no share of anything, and neither does one at or below
    // nothing: every row reads `0%`, which is what a screen with no figure on it already draws.
    if (!Number.isFinite(whole)) return amounts.map(() => formatSharePoints(0, false));
    if (whole <= 0) return amounts.map(() => formatSharePoints(0, false));
    const shares = composeSharesInPoints(amounts.slice(0, SHARES_MAXIMUM), whole);
    const pointsPaid = shares.reduce((sum, share) => sum + share.points, 0);
    const exact = shares.reduce((sum, share) => sum + share.points + share.remainder, 0);
    let left = Math.round(exact) - pointsPaid;
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
    return shares.map((share) => formatSharePoints(share.points, share.amount > 0));
}

/**
 * A share in whole points, with the floor spent where it is owed. A figure under half a point
 * rounds to `0%`, and on a panel that keeps zero and unknown apart that is a third thing neither
 * of them means: something happened, and it was too small to round to. Over `captures/` on
 * 2026-08-29, across the four screens and the three side choices, 55 rows print this floor — and
 * without it every one of them would read `0%` beside a figure that is not one.
 */
function formatSharePoints(points: number, isPresent: boolean): string {
    if (!Number.isSafeInteger(points)) return PANEL_WORDS.unknown;
    if (points < 0) return PANEL_WORDS.unknown;
    if (points === 0) {
        if (isPresent) return SHARE_FLOOR;
    }
    return `${formatWholeUngrouped(points)}%`;
}

function composeSharesInPoints(amounts: readonly number[], whole: number): ShareInPoints[] {
    return amounts.map((amount, index) => {
        const exact = (amount / whole) * HUNDRED;
        const points = Math.floor(exact);
        return { index, amount, points, remainder: exact - points };
    });
}

/**
 * Equal figures take a point together or not at all: the plain method hands the last point to one
 * row of a tie, and two identical numbers with different shares beside them read as a panel that
 * cannot add up. So a group of equal figures is one candidate costing as many points as it has
 * members, and where the points left will not cover it a smaller remainder is paid instead. Over
 * `captures/` on 2026-08-29 that is 12 groups of equal figures across the four screens and
 * the three side choices.
 */
function composeShareGroups(shares: readonly ShareInPoints[]): ShareInPoints[][] {
    const byAmount = new Map<number, ShareInPoints[]>();
    for (const share of shares) {
        // A share with nothing discarded is a whole number of points already.
        if (share.remainder <= 0) continue;
        const group = byAmount.get(share.amount);
        if (group === undefined) byAmount.set(share.amount, [share]);
        else group.push(share);
    }
    const groups = [...byAmount.values()];
    groups.sort((leftGroup, rightGroup) => {
        const leftHead = getShareGroupHead(leftGroup);
        const rightHead = getShareGroupHead(rightGroup);
        if (leftHead.remainder !== rightHead.remainder) {
            return rightHead.remainder - leftHead.remainder;
        }
        return leftHead.index - rightHead.index;
    });
    return groups;
}

function getShareGroupHead(group: readonly ShareInPoints[]): ShareInPoints {
    return group[0] ?? NOBODY_TO_PAY;
}

export function formatShareRounded(share: number): string {
    if (!Number.isFinite(share)) return PANEL_WORDS.unknown;
    const clamped = clampNumber(share, 0, 1);
    return formatSharePoints(Math.round(clamped * HUNDRED), clamped > 0);
}

export function formatPlace(
    mapName: string | null,
    x: number | null,
    y: number | null,
): string | null {
    const words = formatPlaceWords(mapName, x, y);
    if (words === null) return null;
    if (words.name === null) return words.tile;
    if (words.tile === null) return words.name;
    return `${words.name} ${words.tile}`;
}

export function formatPlaceWords(
    mapName: string | null,
    x: number | null,
    y: number | null,
): PlaceWords | null {
    let name: string | null;
    if (mapName === null) {
        name = null;
    } else {
        name = mapName.length > 0 ? mapName : null;
    }
    let tile: string | null;
    if (x === null) {
        tile = null;
    } else if (y === null) {
        tile = null;
    } else {
        tile = `(${formatWholeUngrouped(x)}, ${formatWholeUngrouped(y)})`;
    }
    if (name === null) {
        if (tile === null) return null;
    }
    return { name, tile };
}
