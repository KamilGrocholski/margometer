/**
 * Protokół silnika walki — surowe komunikaty serwera, zanim gra zrobi z nich
 * zdania.
 *
 * JEDYNE ŹRÓDŁO ZDARZEŃ. Ten plik czyta to, co gra dostaje OD SERWERA, i jest
 * dziś jedyną drogą, którą liczby trafiają do panelu.
 *
 * ⚠️ **Nagłówek brzmiał tu „DRUGIE ŹRÓDŁO, NIE ZAMIENNIK" i było to prawdą
 * przez jeden dzień.** Repo miało wtedy drugi odczyt walki — ze zdań w oknie
 * gry — a ten plik istniał po to, żeby dało się zapytać, czy obie drogi liczą
 * to samo. Pytanie padło: pierwsza walka zapisana obiema drogami rozstrzygnęła
 * je na korzyść protokołu, a druga droga zeszła z drzewa 2026‑08‑04.
 *
 * Co to znaczy dla tego pliku: **nie ma już czym go sprawdzić.** Dopóki był
 * drugi odczyt, błąd tutaj rozjeżdżał liczby i czujka to zapalała. Dziś błąd
 * tutaj jest po prostu liczbą w panelu. Projekt, powody i koszt:
 * `docs/specy/2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md`
 * oraz `docs/specy/2026-08-04-parser-tekstu-i-korpus-schodza-z-drzewa.md`.
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

import { BEZ_SLOWNIKA, type Slownik } from "./slownik-gry.ts";
import { nazwaZywiolu, type BattleEvent, type Hit, type Proc } from "./types.ts";
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
  | { typ: "ciosProc"; kod: string; id: string }
  /** `-blok=N` → „-Zablokowanie N obrażeń". */
  | { typ: "blok" }
  /** `-evade` → „-Unik". Flaga, bez wartości. */
  | { typ: "unik" }
  /**
   * Cios krytyczny. Protokół ma na to WŁASNE KLUCZE, więc nie musimy — i nie
   * chcemy — rozpoznawać krytów po BRZMIENIU zdania. Rozpoznawanie po zdaniu
   * jest tym, co robiła droga tekstowa, i było jej najsłabszym miejscem:
   * brzmienie zmienia się z aktualizacją gry i z językiem klienta, klucz nie.
   *
   * `pomocniczy` siada na trafieniach wtórnych, `glowny` i `bardzo` na
   * pierwszym.
   */
  | { typ: "kryt"; rodzaj: "glowny" | "pomocniczy" | "bardzo" }
  /** `-absorb=N`, `-absorbm=N` → „-Absorpcja N obrażeń fizycznych/magicznych". */
  | { typ: "absorpcja"; id: string; strona?: "cel" }
  /**
   * Leczenie w PUNKTACH życia.
   *
   * `strona` mówi, kogo gra podstawia w zdanie: `nadawca` to `f1` (id1),
   * `cel` to `f2` (id2).
   *
   * `wlasne` odpowiada polu `heal.self` z `types.ts` i **jest osobną
   * informacją, a nie funkcją `strona`** — to sprostowanie z 2026‑08‑04,
   * zapłacone pierwszą parą tekst↔protokół. Wyprowadzanie go ze `strona`
   * dawało `self: true` dla klucza `heal`, którego komunikat ma DRUGĄ STRONĘ
   * PUSTĄ (`482845=100.00;0;heal=99`) — czyli nie mówi, kto leczył. Dekoder
   * kredytował wtedy leczenie postaci, o której log milczy, co jest wprost
   * „udawaniem danych, których log nie ma" i łamie „Leczenie bez leczącego"
   * z `docs/DECYZJE.md`.
   *
   * `true` zostaje tylko tam, gdzie efekt Z DEFINICJI siada na trafionym —
   * czyli przy „Dotyku anioła" i „Ostatnim ratunku". To dokładnie te dwa
   * przykłady, które komentarz przy `heal.self` w `types.ts` wymienia jako
   * jedyne przypadki `self: true`, i ta zbieżność jest dowodem, nie zbiegiem
   * okoliczności.
   *
   * ⚠️ `wlasne: false` NIE znaczy „sprawca nieznany" — znaczy tylko „leczony
   * to nie leczący". Przy `strona: "cel"` sprawca jest znany i od 2026‑08‑05
   * wychodzi z dekodera jako `heal.healer`; `wlasne` zostaje `false`, bo są
   * to dwie różne informacje i tylko jedna z nich pochodzi z tabeli.
   */
  | {
      typ: "leczenie";
      strona: "nadawca" | "cel";
      wlasne: boolean;
      /**
       * Czy ZNAK wartości rozstrzyga „Przywrócono" kontra „Stracono".
       *
       * Prawdziwe wyłącznie dla klucza `heal`, i to nie z ostrożności, tylko
       * z odczytu: `%gain_lost%` stoi w JEGO jednym zdaniu, a renderer wybiera
       * człon warunkiem `m[1] >= 0` (`BattleMessages.js:301`). Wszystkie
       * pozostałe klucze leczenia — `afterheal` (`:235`), `heal_target`
       * (`:959`), `npc_heal`, `legbon_holytouch_heal` (`:796`),
       * `legbon_lastheal` (`:587`) — składają bezwarunkowe „Przywrócono".
       *
       * Ujemna kwota przy którymkolwiek z NICH jest więc kształtem spoza reguły
       * gry i ma iść do `unknown`, a nie zostać po cichu przemianowana na
       * ubytek. „Nieznane ma być głośne".
       */
      znakZnaczacy?: boolean;
    }
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
   * `id` to identyfikator `_t`, nie polskie zdanie. **Brzmienie należy do gry**
   * — zmienia się z jej aktualizacją i zależy od języka klienta — więc kopia
   * w naszym kodzie zestarzałaby się po cichu. Rozwiązuje je `src/slownik-gry.ts`
   * w locie; zaszyty zostaje wyłącznie identyfikator, bo listy kluczy z gry
   * wylistować się nie da.
   *
   * ⚠️ Czyta się to „nie udowodniono, że niesie liczbę, którą liczymy", a nie
   * „na pewno nie niesie". Część z tych 201 kluczy niesie wartości procentowe
   * (`+crush_fire` → „+Zmiażdżenie %val%%"), część kwoty nieprzypisywalne
   * postaci (`healall` → „%name% uzdrowił swoją drużynę (%val%)"). Wariant
   * zachowawczy jest wybrany świadomie: w etapie 3a protokół karmi wyłącznie
   * czujkę, więc pomyłka daje ALARM DO ZBADANIA, a nie cichą złą liczbę.
   */
  | { typ: "proc"; id: string; strona?: "cel" }
  /** Gra ma dla tego klucza puste ciało i nie wypisuje NICZEGO. To odpowiedź, nie luka. */
  | { typ: "cisza" };

/**
 * Klucze, przy których efekt należy do CELU, a nie do bijącego (`AUDYT‑87`).
 *
 * DOWÓD JEST STRUKTURALNY I POCHODZI Z RENDERERA GRY. `battleMsg` składa jedną
 * linię logu z trzech kubełków (`BattleMessages.js:162`, `var tm = ['','','']`)
 * i przy ciosie wypełnia skrajne dwa (`:1127‑1129`):
 *
 *     tm[0] = _t('msg_dmgdone %name1% …',  {'%name1%': f1.name, …})  // BIJĄCY
 *     tm[2] += _t('msg_dmgtaken %name1% …', {'%name1%': f2.name, …}) // BITY
 *
 * Czyli `tm[0]` to zdanie o `f1` (pierwszy segment komunikatu), a `tm[2]`
 * o `f2` (drugi). Klucz dopisujący się do `tm[2]` opisuje więc CEL — i jest to
 * ten sam kubełek, w którym stoją `-blok` (`:827`) i `-evade` (`:830`), czyli
 * dwie rzeczy, które ten dekoder przypisuje celowi od początku, osobnymi rolami.
 * Ta zbieżność jest tu najmocniejszym argumentem: reguła nie jest nowa, była
 * tylko stosowana do dwóch kluczy zamiast do dwudziestu sześciu.
 *
 * ⚠️ **ZNAK WIODĄCY NIE JEST REGUŁĄ I NIE WOLNO GO ZA NIĄ BRAĆ.** Kusi, bo
 * `rolaDomyslna` niżej odczytuje stronę właśnie ze znaku — ale tam gra sama tak
 * robi, w gałęzi `default` i wyłącznie dla rodziny `dmg`. Poza nią zgodności
 * nie ma: `+absorb` („Odnowienie absorpcji", `:847`) należy do celu MIMO plusa,
 * a `-legbon_facade` (`:811`) do nikogo szczególnego MIMO minusa — idzie do
 * `tm[1]`, kubełka neutralnego. Lista jest więc WYLICZONA, każdy wpis
 * z numerem linii, i tak ma zostać.
 *
 * Jak powstała: przejściem wszystkich 200 kluczy trafiających do `procy[]`
 * przez ciała gałęzi `battleMsg` (build deweloperski `1781609507010`), łącznie
 * z gałęziami zbiorczymi — `+crush_*`, `fire`, `frost`, `light`, `physical`
 * dzielą ciało z innymi kluczami i wszystkie kończą w `tm[1]`.
 */
const STRONA_CELU: readonly string[] = [
  "+absorb", // :847  „Odnowienie absorpcji %val%" — plus, a mimo to cel
  "+absorbm", // :853
  "+critpoison_per", // :900  „+Czarna krew %val%"
  "+legbon_puncture", // :869
  "+rage", // :841  „+Wściekłość: atak %val%"
  "+superspell-prevented", // :782
  "+vulture", // :878  „+Wzmocnienie ataku o %val%%"
  "-absorb", // :850  rola `absorpcja`, nie `proc`
  "-absorbm", // :856  rola `absorpcja`, nie `proc`
  "-arrowblock", // :859  „Strzała zablokowana"
  "-contra", // :838  „-Kontra"
  "-legbon_cleanse", // :776
  "-legbon_critred", // :866
  "-legbon_glare", // :779
  "-legbon_resgain", // :872  „-Ochrona żywiołów"
  "-parry", // :832  „-Parowanie"
  "-pierceb", // :835  „-Blok przebicia"
  "-rage", // :844  „-Wściekłość"
  "-redacdmg", // :884  „Redukcja niszczenia pancerza o %val%"
  "-redacdmg_per", // :887
  "-reddest_per", // :881
  "-redendest_per", // :893
  "-redmanadest_per", // :890
  "-resmanaendest", // :896
];

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
  "+thirdatt": { typ: "ciosProc", kod: "3", id: "+third_strike" },
  // :863-864 — `take += <b class=third>` oraz `takenum += m[1]`.
  "-thirdatt": { typ: "przyjete", kod: "3" },

  // — redukcja po stronie celu ————————————————————————————————————
  "-blok": { typ: "blok" },
  "-evade": { typ: "unik" },
  // Brzmienia potwierdzają rozdział: „+Cios krytyczny", „+Cios bardzo
  // krytyczny", „+Cios krytyczny broni pomocniczej". `+critwound` („+Ciężka
  // rana") krytem NIE jest, mimo przedrostka — jego zdanie nie zawiera frazy
  // „Cios krytyczny", więc rozdziela je sama gra, a nie nasze nazewnictwo.
  "+crit": { typ: "kryt", rodzaj: "glowny" },
  "+verycrit": { typ: "kryt", rodzaj: "bardzo" },
  "+legbon_verycrit": { typ: "kryt", rodzaj: "bardzo" },
  "+of_crit": { typ: "kryt", rodzaj: "pomocniczy" },
  // Strona z `STRONA_CELU`, tak jak u proców — absorpcja jest tarczą BITEGO,
  // choć jej liczba stoi w komunikacie bijącego.
  "-absorb": { typ: "absorpcja", id: "msg_-absorb %val%", strona: "cel" },
  "-absorbm": { typ: "absorpcja", id: "msg_-absorbm %val%", strona: "cel" },

  // — leczenie w punktach ————————————————————————————————————————
  // „%gain_lost% %val% punktów życia %name%" — %name% to f1. Znak wartości
  // rozstrzyga „Przywrócono" kontra „Stracono" (:1090, `m[1] >= 0`).
  heal: { typ: "leczenie", strona: "nadawca", wlasne: false, znakZnaczacy: true },
  // „Przywrócono %val% punktów życia %name%."
  afterheal: { typ: "leczenie", strona: "nadawca", wlasne: false },
  // „Uleczono %target% o %val% punktów życia." — %target% to f2 (:960).
  // To STRUKTURALNY dowód na `heal.self === false`, gdzie dotąd stał wniosek
  // z samego brzmienia — i zarazem dowód, że LECZĄCYM jest f1, bo skoro cel
  // stoi w drugim segmencie, to rzucający stoi w pierwszym.
  heal_target: { typ: "leczenie", strona: "cel", wlasne: false },
  // Ten sam identyfikator słownika co `heal_target`.
  npc_heal: { typ: "leczenie", strona: "cel", wlasne: false },
  // „Dotyk anioła: zregenerowano %val% punktów życia %name%"
  legbon_holytouch_heal: { typ: "leczenie", strona: "nadawca", wlasne: true },
  // „%val%: Ostatni ratunek, zregenerowano %val2% punktów życia." Wartość jest
  // DWUCZŁONOWA i człony są odwrócone względem zdania: renderer podstawia
  // `'%val%': mm[1]` (nazwa) i `'%val2%': mm[0]` (kwota). Kwota to człon ZEROWY.
  legbon_lastheal: { typ: "leczenie", strona: "nadawca", wlasne: true },

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
const PROCE: Readonly<Record<string, string>> = {
  "+abdest": "msg_+abdest %val%",
  "+abdest_per": "msg_only_val_+abdest_per",
  "+abmdest_per": "msg_only_val_+abmdest_per",
  "+absorb": "msg_+absorb %val%",
  "+absorbm": "msg_+absorbm %val%",
  "+acdmg": "msg_+acdmg %val%",
  "+acdmg_destroyed": "msg_+acdmg_destroyed",
  "+actdmg": "msg_+actdmg %val%",
  "+critpierce": "eng_game_only_val_+critpierce %val%",
  "+critpoison_per": "msg_+critpoison_per %val%",
  "+critsa": "msg_+critsa %val%",
  "+critsa_per": "msg_+critsa_per %val%",
  "+critslow": "msg_+hithurt %val%",
  "+critslow_per": "msg_+critslow_per= %val%",
  "+critwound": "msg_+critwound",
  "+crush": "eng_game_only_val_+crush %val%",
  "+crush_distance": "eng_game_only_val_+crush %val%",
  "+crush_fire": "eng_game_only_val_+crush %val%",
  "+crush_frost": "eng_game_only_val_+crush %val%",
  "+crush_light": "eng_game_only_val_+crush %val%",
  "+crush_physical": "eng_game_only_val_+crush %val%",
  "+distract": "msg_+distract",
  "+endest": "msg_+endest %val%",
  "+energy": "msg_+energy %val%",
  "+engback": "msg_+engback %val%",
  "+exp": "msg_+exp %val%",
  "+fastarrow": "msg_+fastarrow",
  "+firearrow": "msg_+firearrow",
  "+freeze": "msg_+freeze",
  "+immobilize": "msg_+immobilize",
  "+injure": "msg_+injure %val%",
  "+legbon_anguish": "msg_+legbon_anguish %val%",
  "+legbon_curse": "msg_+legbon_curse",
  "+legbon_frenzy_main": "msg_+legbon_frenzy_main %val%",
  "+legbon_frenzy_off": "msg_+legbon_frenzy_off %val%",
  "+legbon_holytouch": "msg_+legbon_holytouch %val%",
  "+legbon_puncture": "msg_+legbon_puncture %val%",
  "+legbon_pushback": "msg_+legbon_pushback",
  "+lowheal2turns": "msg_+lowheal2turns %val%",
  "+manadest": "msg_+manadest %val%",
  "+mcurse": "msg_+mcurse",
  "+of_wound": "msg_+of_wound",
  "+of_woundmagic": "msg_of_woundmagic %val%",
  "+of_woundpoison": "msg_of_woundpoison %val%",
  "+oth_cover": "msg_+oth_cover %val% %name%",
  "+oth_dmg": "msg_+oth_dmg %val% %name%",
  "+ph": "msg_+ph %val%",
  "+pierce": "msg_+pierce",
  "+rage": "msg_+rage %val%",
  "+resdmg": "msg_+resdmg %val%",
  "+resdmgc": "msg_+resdmgc %val%",
  "+resdmgf": "msg_+resdmgf %val%",
  "+resdmgl": "msg_+resdmgl %val%",
  "+rotatingblade": "msg_+rotatingblade",
  "+spell-taken_dmg": "eng_game_only_nick_+spell-taken_dmg %name%",
  "+spell-taken_dmg-all": "end-game-without-percent+spell-taken_dmg-all",
  "+spell-vamp_time": "eng_game_only_nick_+spell-vamp_time %name%",
  "+stun": "msg_+stun",
  "+stun2": "msg_+stun2",
  "+stun2-c": "msg_+stun2-c",
  "+stun2-d": "msg_+stun2-d",
  "+stun2-f": "msg_+stun2-f",
  "+stun2-l": "msg_+stun2-l",
  "+superspell-dispel": "msg_+dispel",
  "+superspell-prevented": "msg_+superspell-prevented",
  "+swing": "msg_+swing",
  "+taken_dmg": "eng_game_only_val_+taken_dmg %val%",
  "+vulture": "msg_+vulture= %val%",
  "+wound": "msg_+wound",
  "+woundfrost": "msg_woundfrost %val%",
  "+woundmagic": "msg_woundmagic %val%",
  "+woundpoison": "msg_woundpoison %val%",
  "-arrowblock": "msg_-arrowblock",
  "-contra": "msg_-contra",
  "-endest": "msg_-endest %val%",
  "-immunity_to_dmg": "end-game-without-percent-immunity_to_dmg",
  "-legbon_cleanse": "msg_-legbon_cleanse",
  "-legbon_critred": "msg_-legbon_critred %val%",
  "-legbon_dmgred": "msg_-legbon_dmgred %val%",
  "-legbon_facade": "msg_-legbon_facade %val%",
  "-legbon_glare": "msg_-legbon_glare",
  "-legbon_resgain": "msg_-legbon_resgain",
  "-legbon_retaliation": "msg_-legbon_retaliation %val%",
  "-lowcritallval": "msg_-lowcritallval %val%",
  "-manadest": "msg_-manadest %val%",
  "-parry": "msg_-parry",
  "-pierceb": "msg_-pierceb",
  "-poison_lowdmg_per": "msg_-poison_lowdmg_per %val%",
  "-rage": "msg_-rage",
  "-redabdest_per": "msg_redabdest_per %m1%",
  "-redacdmg": "msg_-redacdmg %val%",
  "-redacdmg_per": "msg_-redacdmg_per %val%",
  "-reddest_per": "msg_-reddest_per %val%",
  "-redendest": "msg_-redendest %val%",
  "-redendest_per": "msg_-redendest_per %val%",
  "-redmanadest": "msg_-redmanadest %val%",
  "-redmanadest_per": "msg_-redmanadest_per %val%",
  "-resmanaendest": "msg_-resmanaendest %val%",
  "-spell-distortion": "eng_game_nick_and_opponent_-spell-distortion %name% %target%",
  "-spell-immunity_to_dmg": "eng_game_nick_and_friendnick_-spell-immunity_to_dmg %name%",
  "-tenacity": "msg_-tenacity",
  "achpp_per": "achpp_per",
  "active_block_per": "msg_only_val_active_block_per",
  "active_decblock_per-enemies": "msg_only_val_active_decblock_per-enemies",
  "active_resall_per": "msg_only_val_active_resall_per",
  "alllowdmg": "msg_alllowdmg %val% %name%",
  "allslow": "msg_allslow",
  "allslow_per": "msg_allslow_per %val% %name%",
  "ansgame": "msg_ansgame",
  "antidote": "msg_antidote %val%",
  "arrowrain": "msg_arrowrain",
  "aura-ac": "msg_aura-ac %val%",
  "aura-ac_per": "msg_aura-ac_per %val% %name%",
  "aura-adddmg2_per-meele": "msg_blesswords_perw %val% %name%",
  "aura-resall": "msg_aura-resall %val% %name%",
  "aura-sa": "msg_aura-sa %val%",
  "aura-sa_per": "msg_aura-sa_per_new %val% %name%",
  "bandage": "msg_aura-bandage %val%",
  "blackout": "msg_blackout",
  "blizzard": "msg_blizzard",
  "chainlightning_perw": "msg_chainlightning_perw %name%",
  "combo-max": "msg_combo-max",
  "cover": "msg_cover",
  "critmval-allies": "eng_game_only_val_critmval-allies %val%",
  "critmval-enemies": "eng_game_only_val_critmval-enemies %val%",
  "critstagnation": "msg_critstagnation",
  "critval-allies": "eng_game_only_val_critval-allies %val%",
  "critval-enemies": "eng_game_only_val_critval-enemies %val%",
  "critwound": "msg_critwound %name% %val%",
  "distortion": "eng_game_only_nick_distortion %name%",
  "distractshoot": "msg_distractshoot",
  "disturb": "msg_disturb",
  "disturbshoot": "msg_disturbshoot",
  "dloot": "msg_dloot %name% %g1% %m1%",
  "dmg-target_physical": "eng_game_opponent_nick_and_value_dmg-target_physical %target% %val%",
  "dmg_hpp": "msg_-dmg_hpp",
  "doubleshoot": "msg_doubleshoot %name%",
  "en-regen": "msg_en-regen %gain_lost% %name% %val%",
  "en-regen-cast": "msg_en-regen-cast %name% %target%",
  "energy": "msg_energy %name% %gain_loss% %val%",
  "energyout": "msg_energyout %val%",
  "fire": "msg_fire %name% %val%",
  "fireshield": "msg_fireshield %name%",
  "firewall": "msg_firewall %name%",
  "footshoot": "msg_footshoot %name%",
  "frost": "msg_frost %name% %val%",
  "frostshield": "msg_frostshield %name%",
  "heal_per": "msg_heal_per %name%",
  "heal_per-allies": "eng_game_nick_and_value_heal_per-allies %name% %val%",
  "heal_per-enemies": "eng_game_nick_and_value_heal_per-enemies %name% %val%",
  "healall": "msg_healall %name% %val%",
  "healall_per": "msg_healall_per %name% %val%",
  "hp_per-allies": "eng_game_nick_and_value_hp_per-allies %name% %val%",
  "hp_per-enemies": "eng_game_nick_and_value_hp_per-enemies %name% %val%",
  "insult": "msg_insult %name% %name2% %val%",
  "light": "msg_light %name% %val%",
  "lightshield": "msg_lightshield %name%",
  "lightshield2": "msg_lightshield2 %name%",
  "loot": "msg_loot %name% %g1% %m1%",
  "lowheal_per-enemies": "msg_lowheal_per-enemies val",
  "mana": "msg_receivemana %name% %val%",
  "managain": "msg_managain %name% %val%",
  "manatransfer": "msg_manatransfer %name% %val% %name2%",
  "mlightshiled": "msg_mlightshiled %name%",
  "of-woundstart": "msg_of-woundstart",
  "physical": "msg_physical %name% %val%",
  "poison_lowdmg_per-enemies": "msg_poison_lowdmg_per-enemies %val%",
  "poisonspread": "msg_poisonspread",
  "poisonspread_failkey": "msg_poisonspread_failkey",
  "removedot": "skill_removedot",
  "removedot-allies": "skill_removedot-allies",
  "removeslow-allies": "msg_removeslow-allies",
  "removestun": "skill_removestun",
  "removestun-allies": "msg_removestun-allies",
  "resfire_per": "msg_resfire_per %val%",
  "resfrost_per": "msg_resfrost_per %val%",
  "reslight_per": "msg_reslight_per %val%",
  "reusearrows": "msg_reusearrows_one",
  "rime_per": "msg_rime_per %val% %name%",
  "shout": "msg_shout %name%",
  "soullink": "msg_soullink %name%",
  "spell-taken_dmg": "eng_game_nick_and_opponent_spell-taken_dmg %name% %target%",
  "stealmana": "msg_stealmana %name%",
  "stinkbomb": "msg_stinkbomb %name% %name2%",
  "stinkbomb_crit": "eng_game_only_nick_stinkbomb_crit %name%",
  "stinkbomb_pierce": "eng_game_only_nick_stinkbomb_pierce %name%",
  "storm": "msg_storm %name%",
  "sunreduction": "msg_sunreduction %name%",
  "sunshield": "msg_sunshield %name%",
  "sunshield_per": "msg_sunshield %name%",
  "surpass_bonus_total": "surpass_bonus_total %val% %name%",
  "tcustom": "msg_tcustom_target %target% %val%",
  "thunder": "msg_thunder %name%",
  "trickyknife": "msg_trickyknife %name% %target%",
  "vamp": "msg_vamp %val%",
  "vamp_time": "eng_game_only_val_vamp_time %val%",
  "woundextend": "msg_woundextend %name% %target%",
};

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
 * Klucz `+dmg` bez litery daje kod `p`. Kod jest NASZ — gra w tym miejscu nie
 * podaje żadnej litery, a „fizyczne" bez kodu nie miałoby jak trafić do tabeli
 * żywiołów w `types.ts`.
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
 *
 * ⚠️ **TRZY TABELE MUSZĄ BYĆ ROZŁĄCZNE, a ta funkcja tego NIE SPRAWDZA.**
 * Kolejność `??` jest pierwszeństwem: `ROLE` bije wszystko, `MILCZACE` bije
 * `PROCE` (patrz `WYLICZONE`). Klucz wpisany omyłkiem do dwóch tabel nie daje
 * ani błędu, ani ostrzeżenia — po prostu jedna z decyzji przestaje działać
 * i nikt się o tym nie dowiada. Znalezione 2026‑08‑04 przy mutacji, która
 * z tego właśnie powodu nie zapaliła testu.
 *
 * Pilnuje tego niezmiennik „żaden klucz nie stoi w dwóch tabelach naraz"
 * w `tests/protokol.test.ts`, a nie kod tutaj: tabele są literałami, więc
 * duplikat jest błędem programisty łapalnym w bramie. Rzucanie przy ładowaniu
 * modułu byłoby dla GRACZA gorsze niż sam duplikat — zdejmowałoby cały panel
 * za pomyłkę, która i tak nie przeszłaby przez `bun run check`.
 */
export function rola(klucz: string): Rola | null {
  return ROLE[klucz] ?? rolaDomyslna(klucz) ?? WYLICZONE.get(klucz) ?? null;
}

const CEL = new Set(STRONA_CELU);

const WYLICZONE = new Map<string, Rola>([
  ...Object.entries(PROCE).map(
    ([k, id]) =>
      [k, (CEL.has(k) ? { typ: "proc", id, strona: "cel" } : { typ: "proc", id }) as Rola] as const,
  ),
  ...MILCZACE.map((k) => [k, { typ: "cisza" } as Rola] as const),
]);

/**
 * Klucze każdej z trzech tabel OSOBNO — materiał dla niezmiennika rozłączności.
 *
 * Po co osobno, skoro `znaneKlucze()` niżej i tak je skleja: bo niezmiennik
 * postawiony na sklejonej liście da się wyłączyć jednym `new Set(...)` w tej
 * funkcji, i będzie to wyglądało na porządki. Sprawdzone mutacją — odsianie
 * powtórzeń w `znaneKlucze()` uciszało test i nic się nie zapalało. Tutaj nie
 * ma czego odsiewać, bo to jest projekcja tabel, nie ich suma.
 */
export const TABELE_KLUCZY: Readonly<Record<"role" | "proce" | "milczace", readonly string[]>> = {
  role: Object.keys(ROLE),
  proce: Object.keys(PROCE),
  milczace: MILCZACE,
};

/** Wszystkie klucze, o których tabele cokolwiek wiedzą — materiał dla testów pokrycia. */
export function znaneKlucze(): string[] {
  return [...TABELE_KLUCZY.role, ...TABELE_KLUCZY.proce, ...TABELE_KLUCZY.milczace].sort();
}

/**
 * Komunikaty JEDNEJ walki → zdarzenia.
 *
 * BIERZE CAŁĄ WALKĘ, NIE PORCJĘ, i to jest ta sama decyzja, co w `session.ts`:
 * stan przyrostowy między wywołaniami byłby źródłem podwójnego liczenia. Zysk
 * dodatkowy: funkcja zostaje CZYSTA, więc daje się przetestować bez gry —
 * a gry w repo nie ma.
 *
 * `sklad` służy WYŁĄCZNIE zamianie `id` na nazwę. Nazwa jest kluczem-etykietą
 * w `stats.ts`, więc identyfikator bez nazwy nie ma jak trafić do panelu —
 * a zmyślenie nazwy łamie „nie udawaj danych, których log nie ma". Taki
 * komunikat idzie w całości do `unknown`.
 *
 * ⚠️ **TO JEST NAJMNIEJ PEWNA WARSTWA TEGO PLIKU** i od 2026‑08‑04 nic tego nie
 * łagodzi. Rozbiór odwzorowuje sześć linii gry, tabela ról ma przy każdym wpisie
 * cytat, a klucze mają świadka w assecie (`tests/klucze-protokolu.ts`) — ale
 * SKŁADANIE ich w `BattleEvent` nie ma świadka nigdzie. Kształt tych zdarzeń
 * powstał dla innego odczytu i przeżył jego usunięcie; pomyłka tutaj jest dziś
 * po prostu liczbą w panelu, bo czujka porównująca dwa odczyty zeszła z drzewa
 * razem z drugim odczytem.
 */
export function dekoduj(
  komunikaty: readonly string[],
  sklad: readonly RosterEntry[],
  slownik: Slownik = BEZ_SLOWNIKA,
): BattleEvent[] {
  const nazwy = new Map(sklad.map((w) => [w.id, w.name]));
  const zdarzenia: BattleEvent[] = [];
  // Zapowiedź umiejętności przychodzi OSOBNYM komunikatem, a obrażenia dopiero
  // następnym (w zmierzonych walkach: `…;p_.Porażenie;skillId.70` i dopiero potem `@Dc.…`).
  //
  // TO NIE JEST NASZ DOMYSŁ — GRA ROBI DOKŁADNIE TO SAMO.
  // `battleEffects/BattleEffectsController.js:237‑255`, przy obsłudze każdego
  // klucza:
  //
  //     let str    = allM[indexM];
  //     let result = str.match(/skillId=([0-9]*)/g);
  //     if (result) {
  //         let nextIndex = parseIndexM + 1;
  //         if (allM[nextIndex]) str = allM[indexM] + ',' + allM[nextIndex];
  //
  // Komunikat ze `skillId` gra skleja z NASTĘPNYM i traktuje oba jako jedną
  // akcję. Pomiar na 12 zmierzonych walkach: 444 komunikaty ze `skillId`,
  // z czego 333 (75%) mają obrażenia w następnym; reszta to umiejętności, które
  // obrażeń nie zadają. Reguła nie ma więc wyjątków, tylko zakres.
  //
  // ⚠️ Kontekst międzykomunikatowy w grze idzie WYŁĄCZNIE DO PRZODU i wyłącznie
  // przy `skillId`. Nic nie patrzy wstecz — i to jest ostatnia ścieżka, którą
  // mogłoby się ukrywać przypisanie sprawcy DoT‑a. Nie ukrywa się
  // (`docs/MECHANIKA.md` §„Sprawca DoT‑a").
  //
  // Stan jest lokalny dla wywołania, więc funkcja zostaje czysta.
  //
  // ⚠️ **ZASIĘG TO JEDEN KOMUNIKAT, nie „do najbliższego ciosu"** — naprawione
  // 2026‑08‑05 po audycie. Wcześniej zapowiedź gasła WYŁĄCZNIE po złożeniu
  // ciosu, więc ścieżki `heal`, `nieuchronne` i oba wcześniejsze `return`
  // zostawiały ją uzbrojoną i przyklejała się do cudzej akcji:
  //
  //   tspell=Uzdrowienie → heal=500 → zwykły +dmgd=400
  //     … i obrażenia broni szły w panelu pod „Uzdrowienie";
  //   tspell=Porażenie → step → zwykły +dmgd=400
  //     … i zapowiedź przeżywała komunikat pośredni.
  //
  // Cytat wyżej rozstrzyga to wprost: gra skleja komunikat ze `skillId`
  // z NASTĘPNYM (`nextIndex = parseIndexM + 1`) i z niczym więcej.
  //
  // `swiezaZapowiedz` odróżnia „ustawiona W TYM komunikacie" (ma dożyć
  // następnego) od „przyszła z poprzedniego" (ten komunikat jest tym, który
  // obejmuje — i na jego końcu gaśnie).
  let zapowiedziana: string | null = null;
  let swiezaZapowiedz = false;

  /**
   * Jeden komunikat → zdarzenia. Wydzielone z pętli WYŁĄCZNIE po to, żeby
   * wygaszanie zapowiedzi niżej wykonało się także po wcześniejszych `return`
   * w środku — bo to właśnie one zostawiały ją uzbrojoną.
   */
  const przetworzKomunikat = (surowy: string, nr: number): void => {
    const { nadawca, cel, parametry } = rozbierz(surowy);
    const nieznany = (co: string) => zdarzenia.push({ kind: "unknown", line: co, lineNo: nr });

    const nadawcaNazwa = nadawca === null ? null : (nazwy.get(nadawca.id) ?? null);
    const celNazwa = cel === null ? null : (nazwy.get(cel.id) ?? null);
    if ((nadawca !== null && nadawcaNazwa === null) || (cel !== null && celNazwa === null)) {
      // Id spoza składu. Nie zgadujemy — cały komunikat idzie do czujki.
      nieznany(surowy);
      return;
    }

    /**
     * Etykieta proca dla panelu.
     *
     * Brzmienie idzie ze słownika GRY, a nie z naszego kodu — z podstawionym
     * `%val%`, żeby „+Niszczenie pancerza o %val%" stało się „+Niszczenie
     * pancerza o 5". Gdy słownika nie ma (wklejka, archiwum, test bez atrapy)
     * albo gra nie zna identyfikatora, zostaje KLUCZ. Klucz jest prawdą —
     * brzmienie zmyślone przez nas nie byłoby.
     */
    const etykieta = (p: Parametr, id: string): string => {
      const zdanie = slownik.zdanie(id, p.wartosc === null ? undefined : { "%val%": p.wartosc });
      // ZNAK WIODĄCY SPADA. Gra dokleja go do zdania, bo w oknie walki niesie
      // informację (dodatnie efekty na plusie, ujemne na minusie); w panelu
      // efekt stoi już w kolumnie, która to mówi, a „+Przebicie" obok
      // „Przebicie" wyglądałoby na dwie różne rzeczy.
      return zdanie === null ? p.klucz : zdanie.replace(/^[+-]\s*/, "");
    };

    /**
     * Efekt gotowy dla `stats.ts`: klucz i wartość obok brzmienia.
     *
     * Brzmienie jest DO POKAZANIA, klucz DO DECYDOWANIA — patrz `Proc`
     * w `types.ts`. Strona idzie z tabeli ról, nigdy ze znaku klucza.
     */
    const proc = (p: Parametr, r: { id: string; strona?: "cel" }): Proc => ({
      key: p.klucz,
      label: etykieta(p, r.id),
      value: p.wartosc,
      side: r.strona === "cel" ? "target" : "attacker",
    });

    const zadane: Hit[] = [];
    const przyjete: number[] = [];
    const procy: Proc[] = [];
    let blok: number | null = null;
    let unik = false;
    let krytGlowny = false;
    let krytPomocniczy = false;
    let krytBardzo = false;

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
          // `+thirdatt` niesie liczbę I jest procem naraz; jako cios należy do
          // bijącego, więc `strona` zostaje domyślna.
          if (r.typ === "ciosProc") procy.push(proc(p, { id: r.id }));
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
        case "kryt":
          if (r.rodzaj === "glowny") krytGlowny = true;
          else if (r.rodzaj === "pomocniczy") krytPomocniczy = true;
          else krytBardzo = true;
          break;
        case "absorpcja":
        case "proc":
          procy.push(proc(p, r));
          break;
        case "cisza":
          break;
        case "leczenie": {
          const strona = r.strona === "cel" ? celNazwa : nadawcaNazwa;
          const stronaId = r.strona === "cel" ? cel?.id : nadawca?.id;
          const hpp = r.strona === "cel" ? (cel?.hpp ?? null) : (nadawca?.hpp ?? null);
          // Kwota stoi w członie ZEROWYM także przy wartościach dwuczłonowych —
          // patrz `legbon_lastheal`, gdzie zdanie sugeruje odwrotnie.
          const kwota = liczba(czlony(p.wartosc)[0] ?? null);
          if (strona === null || kwota === null) nieznany(p.surowy);
          // ⚠️ **UJEMNA KWOTA TO „STRACONO", CZYLI REALNY UBYTEK ŻYCIA**
          // (`AUDYT‑88`). Gra rozstrzyga to znakiem, w jednym warunku
          // (`BattleMessages.js:301`):
          //
          //     '%gain_lost%': (m[1] >= 0 ? _t('part_gained') : _t('part_lost'))
          //     //(m[1]>0?'Przywrócono ':'Stracono ')+m[1]+' punktów życia '
          //
          // Do 2026‑08‑05 wychodziło stąd `{kind:"heal", amount:-92}`, więc
          // ubytek NIE liczył się jako obrażenia (`damageTaken: 0`), a siadał
          // w „uleczone" ze znakiem minus, w wierszu „Regeneracja −92". Był to
          // skutek uboczny skasowania parsera tekstu: tamten czytał tę linię
          // jako `kind:"dot"` i to zachowanie tu wraca.
          //
          // Kwota idzie DODATNIA, bo minus jest ozdobnikiem zapisu, nie
          // negacją — pomiar w `docs/MECHANIKA.md` („Linia »Stracono −N…«").
          // Rodzaj „od ubytku życia" jest NASZ, bo log źródła nie nazywa,
          // i dlatego `SELF_INFLICTED_DOTS` w `stats.ts` odbiera tej puli
          // zgadywanie sprawcy: efekt idzie z tej samej strony co cel.
          else if (kwota < 0 && r.znakZnaczacy === true && nadawca !== null)
            zdarzenia.push({
              kind: "dot",
              target: strona,
              targetId: nadawca.id,
              targetHpPct: nadawca.hpp ?? 0,
              amount: -kwota,
              via: "od",
              dotType: "ubytku życia",
              // Zdanie „Stracono" nie ma drugiego członu z osłabieniem.
              weakenedPct: null,
            });
          // Ujemna kwota przy kluczu, którego zdanie NIE ma `%gain_lost%`, jest
          // kształtem spoza reguły gry. Głośno, zamiast po cichu przemianować.
          else if (kwota < 0) nieznany(p.surowy);
          else
            zdarzenia.push({
              kind: "heal",
              ability: zapowiedziana,
              target: strona,
              ...(stronaId === undefined ? {} : { targetId: stronaId }),
              amount: kwota,
              // NIE wyprowadzane ze `strona` — patrz komentarz przy `Rola`.
              // Klucz `heal` ma pustą drugą stronę, więc leczącego nie zna
              // ani tekst, ani protokół; kredytowanie go komukolwiek byłoby
              // wymyślaniem danych.
              self: r.wlasne,
              // Ale przy `strona: "cel"` druga strona ISTNIEJE, a leczącym jest
              // pierwsza — renderer podstawia pod `%target%` pole `f2`
              // (`BattleMessages.js:956‑969`), więc `f1` to rzucający. Milczenie
              // o nim było stratą danych, nie ostrożnością: całe leczenie
              // kierowane szło do puli „bez sprawcy", choć sprawca stał
              // w komunikacie. `heal` i proce zostają bez leczącego.
              ...(r.strona === "cel" && nadawca !== null && nadawcaNazwa !== null
                ? { healer: nadawcaNazwa, healerId: nadawca.id, healerHpPct: nadawca.hpp }
                : {}),
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
              targetId: nadawca.id,
              targetHpPct: nadawca.hpp ?? 0,
              amount: kwota,
              via: r.przyimek,
              dotType: r.rodzaj,
              // DRUGI CZŁON WARTOŚCI TO PROCENT OSŁABIENIA — udowodnione
              // słownikiem gry 2026‑08‑04, a nie wywnioskowane z kształtu:
              //
              //   msg_poison  %name% %val0% %val1%
              //     → „%name%: %val0% (osłabione o %val1%%) obrażeń od trucizny."
              //   msg_wound_multi, msg_anguish — ten sam wzór.
              //
              // Do tego commita stało tu `null` z komentarzem „protokół nie
              // niesie osłabienia osobnym kluczem". Niesie — nie osobnym
              // kluczem, tylko DRUGIM CZŁONEM tego samego (`poison=140,14`).
              //
              // ⚠️ Jak to wyszło, jest tu ważniejsze niż sama poprawka:
              // porównanie dwóch odczytów walki tego NIE złapało i nie mogło,
              // bo osłabienie nie wchodziło do porównywanych skalarów. Złapało
              // to czytanie słownika gry — dowód, że czujka i czytanie źródeł
              // łapią co innego, i że jedno nie zastępuje drugiego.
              weakenedPct: liczba(czlony(p.wartosc)[1] ?? null),
            });
          break;
        }
        case "nieuchronne": {
          // „%name% otrzymał %val% obrażeń nieuchronnych." Bez sprawcy i bez
          // przyimka, więc do `dot` nie pasuje. `attack` bez ciosu (`strike: false`)
          // to kształt, którym `types.ts` opisuje własne obrażenia umiejętności.
          const kwota = liczba(p.wartosc);
          if (nadawcaNazwa === null || kwota === null || nadawca === null) nieznany(p.surowy);
          else
            zdarzenia.push({
              kind: "attack",
              source: nadawcaNazwa,
              target: nadawcaNazwa,
              sourceId: nadawca.id,
              targetId: nadawca.id,
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
            swiezaZapowiedz = true;
            zdarzenia.push({
              kind: "ability",
              actor: nadawcaNazwa,
              ...(nadawca === null ? {} : { actorId: nadawca.id }),
              name: p.wartosc,
            });
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
              actorId: nadawca.id,
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
    // `attack` i `take` w pętli `for (var k in msg)`. Jest to możliwe DLATEGO,
    // że obie strony stoją w jednym komunikacie — odczyt ze zdań musiał je
    // parować heurystycznie i to była jego największa słabość.
    //
    // ⚠️ Długości MOGĄ być różne: `+dmgd=897;…;-dmgd=184;-dmga=135` ma jedną
    // liczbę zadaną i dwie przyjęte. Nadmiar NIE GINIE — dostaje własne
    // trafienie z `raw: 0` — bo `aggregate` sumuje `raw` i `applied` osobno,
    // więc skalary zostają prawdziwe. Rozjazd długości jest jednak zapalany
    // jako `unknown`: to sygnał, że nasz model ciosu nie pokrywa się z grą.
    //
    // ⚠️ **STAŁO TU „widać to w prawdziwych walkach" I OBIETNICA, ŻE
    // „pierwsza walka ze zrzutem ma to rozstrzygnąć"** (`AUDYT‑90`). Zrzut jest
    // w repo od 2026‑08‑05 i rozstrzygnął: **0 rozjazdów** na 18 komunikatach
    // `2026-08-04-tempest-lowca-vs-odyncze` (zero `unknown`, świadek 7/7).
    // Kształt powyżej pochodzi z 25 walk skasowanych 2026‑08‑04 i dziś żyje
    // wyłącznie jako asercja syntetyczna w `tests/protokol.test.ts`. Gałąź
    // ZOSTAJE — nadmiar naprawdę nie ma gdzie zginąć, a `unknown` jest tu tani —
    // ale „widać to w prawdziwych walkach" nie jest już zdaniem, które ktokolwiek
    // w tym repo umie sprawdzić. Rozstrzygnie je dopiero drugi zrzut.
    if (zadane.length !== przyjete.length) nieznany(surowy);
    const trafienia: Hit[] = [];
    for (let i = 0; i < Math.max(zadane.length, przyjete.length); i += 1) {
      const z = zadane[i];
      trafienia.push(
        z === undefined
          ? {
              raw: 0,
              applied: przyjete[i] ?? 0,
              crit: krytPomocniczy,
              superCrit: false,
              secondary: i > 0,
              element: null,
              dodged: unik && (przyjete[i] ?? 0) === 0,
            }
          : {
              ...z,
              applied: przyjete[i] ?? 0,
              // Ten sam rozkład co `buildHits`: kryt broni pomocniczej siada na
              // trafieniach wtórnych, główny i bardzo krytyczny na pierwszym.
              crit: i > 0 ? krytPomocniczy : krytGlowny,
              superCrit: i > 0 ? false : krytBardzo,
              // Unik bywa CZĘŚCIOWY — o uniknięciu tego trafienia decyduje
              // zerowa wartość przyjęta, nie sama obecność klucza.
              dodged: unik && (przyjete[i] ?? 0) === 0,
            },
      );
    }

    zdarzenia.push({
      kind: "attack",
      source: nadawcaNazwa,
      target: celNazwa,
      ...(nadawca === null ? {} : { sourceId: nadawca.id }),
      ...(cel === null ? {} : { targetId: cel.id }),
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
    // zwykły.
    zapowiedziana = null;
  };

  komunikaty.forEach((surowy, nr) => {
    przetworzKomunikat(surowy, nr);
    // ZAPOWIEDŹ ŻYJE JEDEN KOMUNIKAT. Ustawiona tutaj — dożywa następnego
    // (`nextIndex = parseIndexM + 1` po stronie gry). Przyszła z poprzedniego —
    // ten komunikat był tym, który obejmowała, więc gaśnie bez względu na to,
    // czy złożył się z niej cios, leczenie, czy nic.
    if (swiezaZapowiedz) swiezaZapowiedz = false;
    else zapowiedziana = null;
  });

  return zdarzenia;
}
