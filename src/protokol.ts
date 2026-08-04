/**
 * Protokół silnika walki — surowe komunikaty serwera, zanim gra zrobi z nich
 * zdania.
 *
 * DRUGIE ŹRÓDŁO, NIE ZAMIENNIK. `src/parser.ts` czyta tekst z okna walki i tak
 * zostaje: nagrania są surowym tekstem, a wklejka z „Kopiuj logi" innej drogi
 * nie ma. Ten plik czyta to, co gra dostaje OD SERWERA, i istnieje po to, żeby
 * dało się zapytać, czy obie drogi liczą to samo. Projekt i powody:
 * `docs/specy/2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md`.
 *
 * KSZTAŁT KOMUNIKATU. Jedna linia protokołu wygląda tak:
 *
 *     id[=hpp];id[=hpp];klucz[=wartość];klucz[=wartość];flaga;…
 *
 * Dwa pierwsze segmenty to strony — nadawca i cel — reszta to parametry.
 * Wszystko poniżej odwzorowuje `battleMsg` z `core/battle/BattleMessages.js`
 * (build deweloperski 1781609507010, czytany przez `bun tools/zrodla.ts`),
 * bo to jedyna implementacja tego formatu, jaka istnieje, i lepiej ją odwzorować
 * niż wymyślić własną interpretację obok.
 *
 * TEN PLIK NIE DOTYKA GRY. Zero globali, zero DOM — wejściem są stringi.
 * Owinięcie `Engine.battle.update` siedzi osobno, w `src/protokol-source.ts`,
 * żeby jedyne miejsce łamiące obietnicę „nie dotykamy stanu gry" było widoczne
 * w drzewie plików, a nie schowane w środku modułu.
 */

import { nazwaZywiolu, type BattleEvent, type Hit } from "./types.ts";
import type { RosterEntry } from "./roster.ts";

/**
 * Strona komunikatu: identyfikator wojownika i jego życie w setnych procenta.
 *
 * `hpp` jest `null`, gdy segment niesie samo id bez `=` — gra wtedy życia nie
 * aktualizuje (`dotHp` zostaje `false`), więc my też nie mamy czego podać.
 */
export type Strona = { id: number; hpp: number | null };

/**
 * Jeden parametr komunikatu.
 *
 * `wartosc === null` to parametr-FLAGA, czyli segment bez `=` (`+pierce`, `r`,
 * `x`). Pusty ciąg to co innego — `klucz=` z wartością pustą — i te dwie rzeczy
 * trzeba rozróżniać, bo gra je rozróżnia (`m[1]` jest wtedy `undefined` kontra
 * `""`).
 *
 * `surowy` to cały segment w oryginale, dokładnie ten, który gra wkleja
 * w „Nieznany parametr" (`_t('msg_unknown_prameter %val%', {'%val%': msg[k]})`,
 * `BattleMessages.js:1117`). Nasza czujka `unknown` ma podać to samo — cytat,
 * a nie własną rekonstrukcję segmentu z klucza i wartości.
 *
 * `obciete` znaczy „w segmencie stał DRUGI `=`". Gra bierze wyłącznie `m[0]`
 * i `m[1]` (`BattleMessages.js:176`), więc resztę gubi — i my gubimy zgodnie,
 * bo odwzorowujemy grę, a nie poprawiamy ją. Ale gubimy GŁOŚNO: skoro gra też
 * coś tu obcina, to znaczy, że format niesie kształt, którego nikt z nas nie
 * przewidział, i lepiej się o tym dowiedzieć od czujki niż od złej liczby.
 */
export type Parametr = {
  klucz: string;
  wartosc: string | null;
  surowy: string;
  obciete: boolean;
};

export type Komunikat = {
  nadawca: Strona | null;
  cel: Strona | null;
  parametry: Parametr[];
};

/**
 * Segment strony → `Strona` albo `null`.
 *
 * TRZY RZECZY SĄ TU ODWZOROWANIEM GRY, NIE WYBOREM:
 *
 * 1. **`indexOf("=") > 0`, nie `!== -1`.** Tak stoi w `BattleMessages.js:124`.
 *    ⚠️ **Tu akurat jedno od drugiego NIE DA SIĘ odróżnić wynikiem** i wiadomo
 *    to z mutacji, nie z domysłu: przy segmencie zaczynającym się od `=` gałąź
 *    z `> 0` liczy `parseInt("=5")`, a gałąź z `!== -1` liczy `parseInt("")` —
 *    obie dają `NaN`, czyli brak strony. Zostaje `> 0`, żeby ta funkcja dała
 *    się czytać obok źródła gry linia w linię, ale **żaden test tego nie pilnuje
 *    i nie ma udawać, że pilnuje**. Gdyby ktoś to uprościł, nic się nie zapali.
 * 2. **`parseInt`, nie `Number`.** `parseInt("103655abc")` daje 103655, a
 *    `Number` dałoby `NaN`. Odwzorowujemy pierwsze.
 * 3. **`id === 0` to BRAK STRONY, nie wojownik o numerze zero.** Gra sprawdza
 *    `if (id1)` i przy zerze podstawia atrapę zamiast wojownika
 *    (`BattleMessages.js:145‑153`). Zwracamy `null`, żeby nie dało się tych
 *    dwóch rzeczy pomylić — to ta sama decyzja co w `tools/walka.ts`, tam
 *    opisana przy `stronyKomunikatu`.
 *
 * `NaN` traktujemy jak zero, bo gra też: `if (NaN)` jest fałszem.
 */
function strona(segment: string | undefined): Strona | null {
  if (segment === undefined) return null;

  const zRownaniem = segment.indexOf("=") > 0;
  const id = Number.parseInt(zRownaniem ? segment.slice(0, segment.indexOf("=")) : segment, 10);
  if (!Number.isFinite(id) || id === 0) return null;

  if (!zRownaniem) return { id, hpp: null };
  const hpp = Number(segment.slice(segment.indexOf("=") + 1));
  return { id, hpp: Number.isFinite(hpp) ? hpp : null };
}

/**
 * Rozbiór komunikatu na strony i parametry. Składnia, zero semantyki.
 *
 * **BEZ TRYBU PORAŻKI — każdy string daje `Komunikat`, choćby pusty.** Gra też
 * go nie ma: `msg.split(';')` nie zawodzi, a `msg.splice(0, 2)` na krótkiej
 * tablicy po prostu nic nie zdejmuje. Porażka ma być widoczna nie tutaj, tylko
 * PIĘTRO WYŻEJ, na nierozpoznanym kluczu — czyli tam, gdzie da się powiedzieć,
 * czego konkretnie nie rozumiemy. Rozbiór, który rzuca, zamieniłby jeden
 * nieznany klucz w utratę całego komunikatu.
 *
 * To ta sama zasada, co „leksyka totalna" w
 * `docs/specy/2026-08-03-parser-tokenizer-i-gramatyka.md` — tyle że po stronie
 * protokołu wychodzi za darmo, bo format jest pozycyjny, a nie zdaniowy.
 */
export function rozbierz(komunikat: string): Komunikat {
  const segmenty = komunikat.split(";");
  return {
    nadawca: strona(segmenty[0]),
    cel: strona(segmenty[1]),
    parametry: segmenty.slice(2).map(parametr),
  };
}

function parametr(surowy: string): Parametr {
  const pierwszy = surowy.indexOf("=");
  if (pierwszy === -1) return { klucz: surowy, wartosc: null, surowy, obciete: false };

  const reszta = surowy.slice(pierwszy + 1);
  const drugi = reszta.indexOf("=");
  return {
    klucz: surowy.slice(0, pierwszy),
    wartosc: drugi === -1 ? reszta : reszta.slice(0, drugi),
    surowy,
    obciete: drugi !== -1,
  };
}

/**
 * Wartość wieloczłonowa: gra rozdziela przecinkiem (`m[1].split(',')`) i sięga
 * po `multi[0]`, `multi[1]` — na przykład przy `heal`, `wound`, `anguish`.
 *
 * ⚠️ **Co znaczy druga liczba, nie wiadomo** i tego nie rozstrzyga ani źródło
 * renderera, ani słownik: widać tylko, że przy dwóch wartościach idzie inny
 * szablon zdania. Dlatego ta funkcja niczego nie interpretuje — oddaje człony
 * i zostawia decyzję czytelnikowi, który musi ją podjąć jawnie.
 */
export function czlony(wartosc: string | null): string[] {
  return wartosc === null || wartosc === "" ? [] : wartosc.split(",");
}

/**
 * Liczba z parametru albo `null`.
 *
 * `Number.parseInt` po to samo, co przy id: gra wszędzie w `battleMsg` traktuje
 * wartości liczbowe przez `parseInt`/arytmetykę na stringu, a nie przez ścisłą
 * konwersję. Wartość, której nie da się odczytać jako liczby, ma dać `null`
 * i zapalić czujkę u czytelnika — nie zero, bo zero jest poprawną liczbą
 * obrażeń i zlanie tych dwóch przypadków ukryłoby zmianę formatu.
 */
export function liczba(wartosc: string | null): number | null {
  if (wartosc === null || wartosc.trim() === "") return null;
  const n = Number.parseInt(wartosc, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Co dany klucz WNOSI do zdarzenia.
 *
 * Rola opisuje KLUCZ, nie zdarzenie — zamiana roli na `BattleEvent` dzieje się
 * piętro wyżej, w `dekoduj`. Podział jest celowy: tabela ma dać się czytać obok
 * `case`'ów renderera, a te też nie wiedzą, w jakie zdanie złożą się na końcu.
 *
 * KAŻDA ROLA MA PRZY SOBIE DOWÓD. Albo ciało gałęzi z `BattleMessages.js`, albo
 * zdanie ze słownika gry (`bun tools/slownik.ts --klucz "…"`). Reguła
 * z `docs/MECHANIKA.md` obowiązuje tu tak samo jak w dokumentach: zdanie o tym,
 * co gra robi, wymaga cytatu, a nie wniosku z nazwy klucza.
 */
export type Rola =
  /** Liczba doklejana do `attack` — obrażenia zadane. `kod` to litera żywiołu. */
  | { typ: "cios"; kod: string }
  /** Liczba doklejana do `take` — obrażenia przyjęte po redukcji. */
  | { typ: "przyjete"; kod: string }
  /** Niesie liczbę I JEST procem naraz — `+thirdatt` robi oba (`:623‑624`). */
  | { typ: "ciosProc"; kod: string }
  /** `-blok=N` → „-Zablokowanie N obrażeń". */
  | { typ: "blok" }
  /** `-evade` → „-Unik". Flaga, bez wartości. */
  | { typ: "unik" }
  /** `-absorb=N`, `-absorbm=N` → „-Absorpcja N obrażeń fizycznych/magicznych". */
  | { typ: "absorpcja" }
  /**
   * Leczenie w PUNKTACH życia. `strona` mówi, kogo gra podstawia w zdanie:
   * `nadawca` to `f1` (id1), `cel` to `f2` (id2) — i to jest jedyne miejsce,
   * w którym protokół rozstrzyga coś, co w tekście jest wnioskiem
   * (patrz `Hit`/`heal.self` w `types.ts`).
   */
  | { typ: "leczenie"; strona: "nadawca" | "cel" }
  /** Obrażenia bez sprawcy, tykające w czasie. `przyimek` i `rodzaj` z brzmienia. */
  | { typ: "dot"; przyimek: "od" | "po"; rodzaj: string }
  /** `absolute=N` → „%name% otrzymał %val% obrażeń nieuchronnych." */
  | { typ: "nieuchronne" }
  /** `tspell`, `prepare` — zapowiedź umiejętności, obrażenia w kolejnym komunikacie. */
  | { typ: "zapowiedz" }
  /** `winner`, `loser` — rozstrzygnięcie walki. */
  | { typ: "koniec"; wynik: "victory" | "defeat" }
  /** `flee=…` — ucieczka. Osobno od `koniec`, bo nie jest ani wygraną, ani porażką. */
  | { typ: "ucieczka" }
  /** `txt=…` — gotowy tekst od serwera, wklejany bez tłumaczenia (`:1084`). */
  | { typ: "tekst" }
  /** `step` → „%name% zrobił krok do przodu." */
  | { typ: "krok" }
  /**
   * Nazwany efekt, którego NIE LICZYMY do żadnego skalara.
   *
   * ⚠️ Czyta się to „nie udowodniono, że niesie liczbę, którą liczymy", a nie
   * „na pewno nie niesie". Część z tych 201 kluczy niesie wartości procentowe
   * (`+crush_fire` → „+Zmiażdżenie %val%%", `healall_per` → „Uleczono
   * sojuszników o %val%% życia"), część kwoty, których nie da się przypisać
   * postaci (`healall` → „%name% uzdrowił swoją drużynę (%val%)"). Wariant
   * zachowawczy jest wybrany świadomie: w etapie 3a protokół karmi wyłącznie
   * czujkę, więc pomyłka daje ALARM DO ZBADANIA, a nie cichą złą liczbę.
   */
  | { typ: "proc" }
  /** Gra ma dla tego klucza puste ciało i nie wypisuje NICZEGO. To odpowiedź, nie luka. */
  | { typ: "cisza" };

/**
 * Role przypisane pojedynczo, każda z dowodem.
 *
 * Klucze `+dmgX` i `-dmgX` tu NIE STOJĄ i nie mają stać — obsługuje je
 * `rolaDomyslna`, bo gra też ich nie wylicza, tylko rozpoznaje w gałęzi
 * `default`. Wpisanie ich zamknęłoby listę tam, gdzie gra ma ją otwartą.
 */
const ROLE: Readonly<Record<string, Rola>> = {
  // — obrażenia ————————————————————————————————————————————————
  // `attack += '<b class=dmgo>+' + m[1]` (:620) — żywioł zaszyty w klasie, nie
  // w kluczu, więc kod bierzemy stamtąd.
  "+of_dmg": { typ: "cios", kod: "o" },
  // :623-624 — najpierw proc „+Trzeci cios", potem `attack += <b class=third>`.
  "+thirdatt": { typ: "ciosProc", kod: "3" },
  // :863-864 — `take += <b class=third>` oraz `takenum += m[1]`.
  "-thirdatt": { typ: "przyjete", kod: "3" },

  // — redukcja po stronie celu ————————————————————————————————————
  "-blok": { typ: "blok" },
  "-evade": { typ: "unik" },
  "-absorb": { typ: "absorpcja" },
  "-absorbm": { typ: "absorpcja" },

  // — leczenie w punktach ————————————————————————————————————————
  // „%gain_lost% %val% punktów życia %name%" — %name% to f1. Znak wartości
  // rozstrzyga „Przywrócono" kontra „Stracono" (:1090, `m[1] >= 0`).
  heal: { typ: "leczenie", strona: "nadawca" },
  // „Przywrócono %val% punktów życia %name%."
  afterheal: { typ: "leczenie", strona: "nadawca" },
  // „Uleczono %target% o %val% punktów życia." — %target% to f2 (:960).
  // To STRUKTURALNY dowód na `heal.self === false` z `types.ts:117‑128`, gdzie
  // dotąd stał wniosek z samego brzmienia.
  heal_target: { typ: "leczenie", strona: "cel" },
  // Ten sam identyfikator słownika co `heal_target`.
  npc_heal: { typ: "leczenie", strona: "cel" },
  // „Dotyk anioła: zregenerowano %val% punktów życia %name%"
  legbon_holytouch_heal: { typ: "leczenie", strona: "nadawca" },
  // „%val%: Ostatni ratunek, zregenerowano %val2% punktów życia." Wartość jest
  // DWUCZŁONOWA i człony są odwrócone względem zdania: renderer podstawia
  // `'%val%': mm[1]` (nazwa) i `'%val2%': mm[0]` (kwota). Kwota to człon ZEROWY.
  legbon_lastheal: { typ: "leczenie", strona: "nadawca" },

  // — obrażenia bez sprawcy ————————————————————————————————————————
  // Przyimki są dosłownie te ze zdań gry i trafiają w pole `via` z `types.ts`.
  poison: { typ: "dot", przyimek: "od", rodzaj: "trucizny" },
  wound: { typ: "dot", przyimek: "od", rodzaj: "głębokiej rany" },
  injure: { typ: "dot", przyimek: "po", rodzaj: "zranieniu" },
  anguish: { typ: "dot", przyimek: "od", rodzaj: "krwawienia" },
  absolute: { typ: "nieuchronne" },

  // — przebieg walki ————————————————————————————————————————————
  // „%name% wykonuje %name2%" / „%name% przygotowuje się do rzucenia %name2%".
  tspell: { typ: "zapowiedz" },
  prepare: { typ: "zapowiedz" },
  winner: { typ: "koniec", wynik: "victory" },
  loser: { typ: "koniec", wynik: "defeat" },
  flee: { typ: "ucieczka" },
  txt: { typ: "tekst" },
  step: { typ: "krok" },
};

/**
 * Klucze, przy których gra wypisuje zdanie, ale my nie liczymy z nich niczego.
 *
 * Lista jest WYLICZONA, a nie domyślna, i to jest cała jej wartość. Gdyby
 * nieznany klucz wpadał tu z automatu, nowy klucz z obrażeniami zostałby
 * połknięty po cichu — a to jest dokładnie ten tryb awarii, przed którym broni
 * reguła „nieznane ma być głośne" z `AGENTS.md`.
 */
const PROCE: readonly string[] = [
  "+abdest", "+abdest_per", "+abmdest_per", "+absorb",
  "+absorbm", "+acdmg", "+acdmg_destroyed", "+actdmg",
  "+crit", "+critpierce", "+critpoison_per", "+critsa",
  "+critsa_per", "+critslow", "+critslow_per", "+critwound",
  "+crush", "+crush_distance", "+crush_fire", "+crush_frost",
  "+crush_light", "+crush_physical", "+distract", "+endest",
  "+energy", "+engback", "+exp", "+fastarrow",
  "+firearrow", "+freeze", "+immobilize", "+injure",
  "+legbon_anguish", "+legbon_curse", "+legbon_frenzy_main", "+legbon_frenzy_off",
  "+legbon_holytouch", "+legbon_puncture", "+legbon_pushback", "+legbon_verycrit",
  "+lowheal2turns", "+manadest", "+mcurse", "+of_crit",
  "+of_wound", "+of_woundmagic", "+of_woundpoison", "+oth_cover",
  "+oth_dmg", "+ph", "+pierce", "+rage",
  "+resdmg", "+resdmgc", "+resdmgf", "+resdmgl",
  "+rotatingblade", "+spell-taken_dmg", "+spell-taken_dmg-all", "+spell-vamp_time",
  "+stun", "+stun2", "+stun2-c", "+stun2-d",
  "+stun2-f", "+stun2-l", "+superspell-dispel", "+superspell-prevented",
  "+swing", "+taken_dmg", "+verycrit", "+vulture",
  "+wound", "+woundfrost", "+woundmagic", "+woundpoison",
  "-arrowblock", "-contra", "-endest", "-immunity_to_dmg",
  "-legbon_cleanse", "-legbon_critred", "-legbon_dmgred", "-legbon_facade",
  "-legbon_glare", "-legbon_resgain", "-legbon_retaliation", "-lowcritallval",
  "-manadest", "-parry", "-pierceb", "-poison_lowdmg_per",
  "-rage", "-redabdest_per", "-redacdmg", "-redacdmg_per",
  "-reddest_per", "-redendest", "-redendest_per", "-redmanadest",
  "-redmanadest_per", "-resmanaendest", "-spell-distortion", "-spell-immunity_to_dmg",
  "-tenacity", "achpp_per", "active_block_per", "active_decblock_per-enemies",
  "active_resall_per", "alllowdmg", "allslow", "allslow_per",
  "ansgame", "antidote", "arrowrain", "aura-ac",
  "aura-ac_per", "aura-adddmg2_per-meele", "aura-resall", "aura-sa",
  "aura-sa_per", "bandage", "blackout", "blizzard",
  "chainlightning_perw", "combo-max", "cover", "critmval-allies",
  "critmval-enemies", "critstagnation", "critval-allies", "critval-enemies",
  "critwound", "distortion", "distractshoot", "disturb",
  "disturbshoot", "dloot", "dmg-target_physical", "dmg_hpp",
  "doubleshoot", "en-regen", "en-regen-cast", "energy",
  "energyout", "fire", "fireshield", "firewall",
  "footshoot", "frost", "frostshield", "heal_per",
  "heal_per-allies", "heal_per-enemies", "healall", "healall_per",
  "hp_per-allies", "hp_per-enemies", "insult", "light",
  "lightshield", "lightshield2", "loot", "lowheal_per-enemies",
  "mana", "managain", "manatransfer", "mlightshiled",
  "of-woundstart", "physical", "poison_lowdmg_per-enemies", "poisonspread",
  "poisonspread_failkey", "removedot", "removedot-allies", "removeslow-allies",
  "removestun", "removestun-allies", "resfire_per", "resfrost_per",
  "reslight_per", "reusearrows", "rime_per", "shout",
  "soullink", "spell-taken_dmg", "stealmana", "stinkbomb",
  "stinkbomb_crit", "stinkbomb_pierce", "storm", "sunreduction",
  "sunshield", "sunshield_per", "surpass_bonus_total", "tcustom",
  "thunder", "trickyknife", "vamp", "vamp_time",
  "woundextend",
];

/**
 * Klucze z pustym ciałem — gra świadomie nie wypisuje NICZEGO.
 *
 * „Nie wypisuje" to ODPOWIEDŹ, a nie luka, i dlatego stoją osobno od proców:
 * `skillId` niesie numer umiejętności dla mechaniki gry, a nie dla logu, i nie
 * ma czego z niego przeczytać. Zlanie tego z „nie wiemy" dałoby czujkę
 * krzyczącą o kluczach, o których wiadomo wszystko.
 */
const MILCZACE: readonly string[] = [
  "-reddest_per0", "active_absorbdest_per", "active_decblock_per", "balloflight",
  "chainlightning", "daggerthrow", "skillId",
];

/**
 * Gałąź `default` renderera, obliczana zamiast wyliczana wpisami.
 *
 * `BattleMessages.js:1102‑1117`: gdy `m[0].substr(1, 3) === 'dmg'`, znak wiodący
 * rozstrzyga stronę (`+` → `attack`, `-` → `take`), a reszta klucza po znaku
 * staje się NAZWĄ KLASY CSS. Stąd `dmgd` w DOM i `+dmgd` w protokole to ta sama
 * litera — i stąd wspólna tabela żywiołów w `types.ts`.
 *
 * Klucz `+dmg` bez litery daje kod `p`, bo tak samo robi `src/source.ts:80`
 * (`damage[1] || "p"`) po stronie tekstu. Dwie drogi mają dać tę samą etykietę.
 */
export function rolaDomyslna(klucz: string): Rola | null {
  if (klucz.substring(1, 4) !== "dmg") return null;
  const znak = klucz.charAt(0);
  if (znak !== "+" && znak !== "-") return null;
  const kod = klucz.slice(4) || "p";
  return znak === "+" ? { typ: "cios", kod } : { typ: "przyjete", kod };
}

/**
 * Rola klucza albo `null`, gdy o kluczu nic nie wiemy.
 *
 * `null` znaczy „nieznane" i ma być GŁOŚNE — czytelnik zamienia je na
 * `{kind: "unknown"}`. Gra ma tu swój odpowiednik piętro wyżej:
 * `msg_unknown_prameter` w gałęzi `default` (:1117).
 */
export function rola(klucz: string): Rola | null {
  return ROLE[klucz] ?? rolaDomyslna(klucz) ?? WYLICZONE.get(klucz) ?? null;
}

const WYLICZONE = new Map<string, Rola>([
  ...PROCE.map((k) => [k, { typ: "proc" } as Rola] as const),
  ...MILCZACE.map((k) => [k, { typ: "cisza" } as Rola] as const),
]);

/** Wszystkie klucze, o których tabela cokolwiek wie — materiał dla testu pokrycia. */
export function znaneKlucze(): string[] {
  return [...Object.keys(ROLE), ...PROCE, ...MILCZACE].sort();
}

/**
 * Komunikaty JEDNEJ walki → zdarzenia.
 *
 * BIERZE CAŁĄ WALKĘ, NIE PORCJĘ, i to jest ta sama decyzja, co w `session.ts:53‑57`
 * po stronie tekstu: stan przyrostowy między wywołaniami byłby źródłem podwójnego
 * liczenia. Zysk dodatkowy jest tu większy niż tam — funkcja zostaje CZYSTA, więc
 * daje się przetestować bez gry, a gry w repo nie ma.
 *
 * `sklad` służy WYŁĄCZNIE zamianie `id` na nazwę. Nazwa jest kluczem-etykietą
 * w `stats.ts`, więc identyfikator bez nazwy nie ma jak trafić do panelu —
 * a zmyślenie nazwy łamie „nie udawaj danych, których log nie ma". Taki
 * komunikat idzie w całości do `unknown`.
 *
 * ⚠️ **TO JEST NAJMNIEJ PEWNA WARSTWA TEGO PLIKU.** Rozbiór odwzorowuje sześć
 * linii gry, tabela ról ma przy każdym wpisie cytat — a tutaj składamy z tego
 * zdarzenia w kształcie, który wymyślił parser tekstu, i nie ma ani jednej
 * walki zapisanej obiema drogami, żeby to sprawdzić. Dlatego pierwszym
 * czytelnikiem jest CZUJKA, nie panel: pomyłka ma dać alarm do zbadania.
 */
export function dekoduj(
  komunikaty: readonly string[],
  sklad: readonly RosterEntry[],
): BattleEvent[] {
  const nazwy = new Map(sklad.map((w) => [w.id, w.name]));
  const zdarzenia: BattleEvent[] = [];
  // Zapowiedź umiejętności przychodzi OSOBNYM komunikatem, a obrażenia dopiero
  // następnym (w korpusie: `…;p_.Porażenie;skillId.70` i dopiero potem `@Dc.…`).
  // Stan jest lokalny dla wywołania, więc funkcja zostaje czysta.
  let zapowiedziana: string | null = null;

  komunikaty.forEach((surowy, nr) => {
    const { nadawca, cel, parametry } = rozbierz(surowy);
    const nieznany = (co: string) => zdarzenia.push({ kind: "unknown", line: co, lineNo: nr });

    const nadawcaNazwa = nadawca === null ? null : (nazwy.get(nadawca.id) ?? null);
    const celNazwa = cel === null ? null : (nazwy.get(cel.id) ?? null);
    if ((nadawca !== null && nadawcaNazwa === null) || (cel !== null && celNazwa === null)) {
      // Id spoza składu. Nie zgadujemy — cały komunikat idzie do czujki.
      nieznany(surowy);
      return;
    }

    const zadane: Hit[] = [];
    const przyjete: number[] = [];
    const procy: string[] = [];
    let blok: number | null = null;
    let unik = false;

    for (const p of parametry) {
      // Pusty segment (`…;;`) nie jest kluczem i nie ma o czym krzyczeć — gra
      // też przechodzi po nim gałęzią `default` bez skutku, bo `substr` pustego
      // ciągu nie da „dmg".
      if (p.klucz === "") continue;
      if (p.obciete) nieznany(p.surowy);

      const r = rola(p.klucz);
      if (r === null) {
        nieznany(p.surowy);
        continue;
      }

      switch (r.typ) {
        case "cios":
        case "ciosProc": {
          const wartosc = liczba(p.wartosc);
          if (wartosc === null) {
            nieznany(p.surowy);
            break;
          }
          if (r.typ === "ciosProc") procy.push(p.klucz);
          zadane.push({
            raw: wartosc,
            // Uzupełniane niżej, gdy poznamy stronę przyjętą. Zero tutaj jest
            // zaślepką, nie odczytem — i dlatego parowanie ma własny komentarz.
            applied: 0,
            crit: false,
            superCrit: false,
            secondary: zadane.length > 0,
            element: nazwaZywiolu(r.kod),
            dodged: false,
          });
          break;
        }
        case "przyjete": {
          const wartosc = liczba(p.wartosc);
          if (wartosc === null) nieznany(p.surowy);
          else przyjete.push(wartosc);
          break;
        }
        case "blok": {
          const wartosc = liczba(p.wartosc);
          if (wartosc === null) nieznany(p.surowy);
          else blok = (blok ?? 0) + wartosc;
          break;
        }
        case "unik":
          unik = true;
          break;
        case "absorpcja":
        case "proc":
          procy.push(p.klucz);
          break;
        case "cisza":
          break;
        case "leczenie": {
          const strona = r.strona === "cel" ? celNazwa : nadawcaNazwa;
          const hpp = r.strona === "cel" ? (cel?.hpp ?? null) : (nadawca?.hpp ?? null);
          // Kwota stoi w członie ZEROWYM także przy wartościach dwuczłonowych —
          // patrz `legbon_lastheal`, gdzie zdanie sugeruje odwrotnie.
          const kwota = liczba(czlony(p.wartosc)[0] ?? null);
          if (strona === null || kwota === null) nieznany(p.surowy);
          else
            zdarzenia.push({
              kind: "heal",
              ability: zapowiedziana,
              target: strona,
              amount: kwota,
              // Protokół podaje OBIE strony, więc „czy leczony to leczący" jest
              // tu faktem, a nie wnioskiem — inaczej niż w `parser.ts`.
              self: r.strona === "nadawca",
              targetHpPct: hpp,
            });
          break;
        }
        case "dot": {
          const kwota = liczba(czlony(p.wartosc)[0] ?? null);
          if (nadawcaNazwa === null || kwota === null || nadawca === null) nieznany(p.surowy);
          else
            zdarzenia.push({
              kind: "dot",
              target: nadawcaNazwa,
              targetHpPct: nadawca.hpp ?? 0,
              amount: kwota,
              via: r.przyimek,
              dotType: r.rodzaj,
              // Protokół nie niesie osłabienia DoT-a osobnym kluczem — pytanie
              // „osłabione o N%" zostaje otwarte tak samo jak po stronie tekstu.
              weakenedPct: null,
            });
          break;
        }
        case "nieuchronne": {
          // „%name% otrzymał %val% obrażeń nieuchronnych." Bez sprawcy i bez
          // przyimka, więc do `dot` nie pasuje. `attack` bez ciosu jest tym,
          // czym parser opisuje własne obrażenia umiejętności (`strike: false`).
          const kwota = liczba(p.wartosc);
          if (nadawcaNazwa === null || kwota === null || nadawca === null) nieznany(p.surowy);
          else
            zdarzenia.push({
              kind: "attack",
              source: nadawcaNazwa,
              target: nadawcaNazwa,
              sourceHpPct: null,
              targetHpPct: nadawca.hpp ?? 0,
              hits: [
                {
                  raw: kwota,
                  applied: kwota,
                  crit: false,
                  superCrit: false,
                  secondary: false,
                  element: nazwaZywiolu("a"),
                  dodged: false,
                },
              ],
              dodged: false,
              blocked: null,
              procs: [],
              ability: zapowiedziana,
              strike: false,
            });
          break;
        }
        case "zapowiedz": {
          if (nadawcaNazwa === null || p.wartosc === null) nieznany(p.surowy);
          else {
            zapowiedziana = p.wartosc;
            zdarzenia.push({ kind: "ability", actor: nadawcaNazwa, name: p.wartosc });
          }
          break;
        }
        case "koniec": {
          zdarzenia.push({
            kind: "fight-end",
            // `winner=?` to walka bez rozstrzygnięcia — gra idzie wtedy gałęzią
            // `battle_no_winner` (`:180`), a nie wypisuje nazwiska.
            outcome: p.wartosc === "?" ? "draw" : r.wynik,
            actors: p.wartosc === null || p.wartosc === "?" ? [] : p.wartosc.split(", "),
            result: p.surowy,
          });
          break;
        }
        case "ucieczka":
          zdarzenia.push({ kind: "info", line: p.surowy });
          break;
        case "tekst":
          zdarzenia.push({ kind: "info", line: p.wartosc ?? "" });
          break;
        case "krok": {
          if (nadawcaNazwa === null || nadawca === null) nieznany(p.surowy);
          else
            zdarzenia.push({
              kind: "move",
              actor: nadawcaNazwa,
              hpPct: nadawca.hpp ?? 0,
              description: p.surowy,
            });
          break;
        }
      }
    }

    if (zadane.length === 0 && przyjete.length === 0) {
      // Bez ani jednej liczby obrażeń gra nie składa zdania „uderzył z siłą"
      // (`:1127`, warunek `attack != ''`), więc i my nie robimy ciosu. Blok
      // i unik bez ciosu też nie mają czego opisać — ale nie giną, bo gra
      // wypisuje je osobną linią, a czujka porównuje skalary, nie linie.
      if (blok !== null || unik) zdarzenia.push({ kind: "info", line: surowy });
      return;
    }

    if (nadawcaNazwa === null || celNazwa === null) {
      nieznany(surowy);
      return;
    }

    // PAROWANIE ZADANYCH Z PRZYJĘTYMI IDZIE PO KOLEJNOŚCI, tak jak gra skleja
    // `attack` i `take` w pętli `for (var k in msg)`. To jest INNY algorytm niż
    // `pairApplied`/`buildHits` w `parser.ts` i różnica jest ZAMIERZONA: tam
    // parowanie liczb w tekście jest heurystyką, tu obie strony stoją w jednym
    // komunikacie. Gdyby heurystyka parsera się myliła, ta różnica jest jedyną
    // rzeczą, która to pokaże.
    //
    // ⚠️ Długości bywają RÓŻNE i to widać w korpusie: `@Dd.897;…;-Dd.184;-Da.135`
    // ma jedną liczbę zadaną i dwie przyjęte. Nadmiar NIE GINIE — dostaje własne
    // trafienie z `raw: 0` — bo `aggregate` sumuje `raw` i `applied` osobno,
    // więc skalary zostają prawdziwe. Rozjazd długości jest jednak zapalany
    // jako `unknown`: to sygnał, że nasz model ciosu nie pokrywa się z grą,
    // i pierwsza walka ze zrzutem ma to rozstrzygnąć.
    if (zadane.length !== przyjete.length) nieznany(surowy);
    const trafienia: Hit[] = [];
    for (let i = 0; i < Math.max(zadane.length, przyjete.length); i += 1) {
      const z = zadane[i];
      trafienia.push(
        z === undefined
          ? {
              raw: 0,
              applied: przyjete[i] ?? 0,
              crit: false,
              superCrit: false,
              secondary: i > 0,
              element: null,
              dodged: false,
            }
          : { ...z, applied: przyjete[i] ?? 0 },
      );
    }

    zdarzenia.push({
      kind: "attack",
      source: nadawcaNazwa,
      target: celNazwa,
      sourceHpPct: nadawca?.hpp ?? null,
      targetHpPct: cel?.hpp ?? 0,
      hits: trafienia,
      dodged: unik,
      blocked: blok,
      procs: procy,
      ability: zapowiedziana,
      strike: true,
    });
    // Umiejętność obejmuje jeden cios; kolejny bez własnej zapowiedzi jest już
    // zwykły. Tak samo czyta to parser tekstu.
    zapowiedziana = null;
  });

  return zdarzenia;
}
