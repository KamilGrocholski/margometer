import { describe, expect, test } from "bun:test";
import {
  czlony,
  dekoduj,
  liczba,
  rola,
  rolaDomyslna,
  rozbierz,
  RODZAJE_DOT,
  TABELE_KLUCZY,
  znaneKlucze,
} from "../src/protokol.ts";
import { dotLabel, RODZAJE_Z_ETYKIETA, type BattleEvent } from "../src/types.ts";
import { SlownikStaly } from "../src/slownik-gry.ts";
import type { RosterEntry } from "../src/roster.ts";
import { ZAMROZENIE } from "./klucze-protokolu.ts";

/**
 * Rozbiór komunikatu protokołu.
 *
 * SKĄD BIORĄ SIĘ WEJŚCIA. Dwa źródła, oba prawdziwe, i to jest tu ważne:
 *
 * - **kształty z prawdziwych walk**, przepisane do treści testów. ⚠️ Brały się
 *   z 12 publicznych zapisów walk, PRZEKODOWANYCH przez cudzy serwis (kropka
 *   zamiast `=`, `@` zamiast `+`); tamten materiał zszedł z drzewa 2026‑08‑04,
 *   a kształty zostały w komentarzach przy asercjach — dlatego stoją tam
 *   w tamtej, przekodowanej postaci;
 * - **źródło renderera gry** — przypadki brzegowe, których w materiale nie ma,
 *   ale które `battleMsg` obsługuje jawnie i dlatego wiadomo, że istnieją.
 *
 * Czego te testy NIE dowodzą: że gra wysyła dokładnie takie komunikaty. Repo
 * ma na to JEDNĄ walkę i leży ona w `tests/walka-z-gry.ts` — czytają ją testy
 * archiwum oraz `index`. Tutaj sprawdzamy, że rozbiór odwzorowuje `battleMsg`
 * znak w znak, a nie że wejście jest autentyczne.
 */

describe("rozbierz: strony", () => {
  test("obie strony z życiem", () => {
    const k = rozbierz("1=100.00;2=40.37;+dmgd=455");
    expect(k.nadawca).toEqual({ id: 1, hpp: 100 });
    expect(k.cel).toEqual({ id: 2, hpp: 40.37 });
  });

  test("brak celu to null, a nie wojownik o id 0", () => {
    // Kształt tyknięcia DoT-a z prawdziwych walk: `119444.6.71;0;anguish.3615`.
    // Gra sprawdza `if (id2)` i przy zerze podstawia atrapę zamiast wojownika,
    // więc zero NIE jest identyfikatorem. Zwrócenie `{id: 0}` dałoby zdarzenia
    // przypisane nieistniejącej postaci.
    const k = rozbierz("119444=6.71;0;anguish=3615");
    expect(k.nadawca).toEqual({ id: 119444, hpp: 6.71 });
    expect(k.cel).toBeNull();
  });

  test("strona bez życia — samo id, bez znaku równości", () => {
    const k = rozbierz("1;2;+dmg=10");
    expect(k.nadawca).toEqual({ id: 1, hpp: null });
    expect(k.cel).toEqual({ id: 2, hpp: null });
  });

  test("obie strony puste — komunikat systemowy", () => {
    // `0;0;txt=…` i `0;0;winner.…` z prawdziwych walk: linia otwierająca i rozstrzygnięcie.
    const k = rozbierz("0;0;winner=Baylan");
    expect(k.nadawca).toBeNull();
    expect(k.cel).toBeNull();
    expect(k.parametry).toHaveLength(1);
  });

  test("segment zaczynający się od `=` nie daje strony", () => {
    // ⚠️ Ten test pilnuje ZACHOWANIA, a nie zapisu warunku w `strona()`.
    // Sprawdzone mutacją: zamiana `indexOf('=') > 0` (tak jak w grze) na
    // `!== -1` nie zapala tutaj niczego, bo obie gałęzie kończą na NaN.
    // Zapisane, żeby komentarz przy tamtym warunku nie obiecywał osłony,
    // której nie ma — zielony test to nie to samo, co test rozróżniający.
    expect(rozbierz("=5;2;+dmg=10").nadawca).toBeNull();
  });

  test("id ze śmieciem na końcu czyta się jak w grze", () => {
    // parseInt('103655abc') to 103655; Number dałoby NaN i zgubiłoby stronę.
    expect(rozbierz("103655abc;0;heal=5").nadawca).toEqual({ id: 103655, hpp: null });
  });

  test("życie nieliczbowe daje null, a nie zero", () => {
    // Zero to poprawna wartość życia — postać martwa (`439082.0.00` w tamtym materiale).
    // Zlanie „nie umiem odczytać" z „zero procent" ogłaszałoby zgony.
    expect(rozbierz("1=nic;0;heal=5").nadawca).toEqual({ id: 1, hpp: null });
    expect(rozbierz("1=0.00;0;heal=5").nadawca).toEqual({ id: 1, hpp: 0 });
  });
});

describe("rozbierz: parametry", () => {
  test("klucz z wartością i flaga bez wartości stoją obok siebie", () => {
    // `+pierce` i `r` z prawdziwej walki to flagi — segment bez znaku równości.
    const k = rozbierz("1=100.00;2=98.29;+dmgd=455;+pierce;-dmgd=455");
    expect(k.parametry.map((p) => p.klucz)).toEqual(["+dmgd", "+pierce", "-dmgd"]);
    expect(k.parametry[0]!.wartosc).toBe("455");
    expect(k.parametry[1]!.wartosc).toBeNull();
  });

  test("flaga (brak `=`) to nie to samo, co wartość pusta (`klucz=`)", () => {
    // Gra rozróżnia: `m[1]` jest wtedy `undefined` kontra `""`. Zlanie ich
    // kazałoby czytać flagę jak parametr o pustej wartości.
    expect(rozbierz("0;0;flaga").parametry[0]!.wartosc).toBeNull();
    expect(rozbierz("0;0;klucz=").parametry[0]!.wartosc).toBe("");
  });

  test("wartość urywa się na DRUGIM znaku równości i to jest zapalone", () => {
    // BattleMessages.js:176 — `msg[k].split('=')`, dalej wyłącznie m[0] i m[1].
    // Gra gubi resztę, więc gubimy zgodnie; ale `obciete` mówi, że format
    // niesie kształt, którego nikt nie przewidział.
    const p = rozbierz("0;0;klucz=a=b").parametry[0]!;
    expect(p.klucz).toBe("klucz");
    expect(p.wartosc).toBe("a");
    expect(p.obciete).toBe(true);
  });

  test("zwykły parametr nie jest oznaczony jako obcięty", () => {
    expect(rozbierz("0;0;klucz=a").parametry[0]!.obciete).toBe(false);
  });

  test("`surowy` to cały segment, dosłownie ten, który gra wkleiłaby w „Nieznany parametr”", () => {
    // `_t('msg_unknown_prameter %val%', {'%val%': msg[k]})` — %val% to CAŁY
    // segment. Czujka `unknown` ma podać cytat, nie rekonstrukcję.
    expect(rozbierz("1=100.00;0;X=1053,a,Dark Laser(92.90%)").parametry[0]!.surowy).toBe(
      "X=1053,a,Dark Laser(92.90%)",
    );
  });

  test("nazwa umiejętności z nawiasami i przecinkami przechodzi w całości", () => {
    // Kształt z prawdziwej walki: `p_.Wyzywający okrzyk;skillId.188;n.Toffi-Pawełek`.
    const k = rozbierz("498891=91.53;439082=73.83;tspell=Wyzywający okrzyk;skillId=188");
    expect(k.parametry[0]!.wartosc).toBe("Wyzywający okrzyk");
    expect(k.parametry[1]!.wartosc).toBe("188");
  });
});

describe("rozbierz: wejścia zdegenerowane nie wywracają rozbioru", () => {
  // Bez trybu porażki — porażka ma być widoczna na nierozpoznanym KLUCZU,
  // piętro wyżej. Rozbiór, który rzuca, zamieniłby jeden nieznany klucz
  // w utratę całego komunikatu.
  test("pusty string", () => {
    expect(rozbierz("")).toEqual({ nadawca: null, cel: null, parametry: [] });
  });

  test("sam nadawca, bez celu i bez parametrów", () => {
    const k = rozbierz("1=100.00");
    expect(k.nadawca).toEqual({ id: 1, hpp: 100 });
    expect(k.cel).toBeNull();
    expect(k.parametry).toEqual([]);
  });

  test("puste segmenty na końcu dają puste klucze, nie wyjątek", () => {
    const k = rozbierz("0;0;;");
    expect(k.parametry.map((p) => p.klucz)).toEqual(["", ""]);
  });
});

describe("czlony", () => {
  test("rozdziela przecinkiem, tak jak gra", () => {
    // `heal=1356,-15` z prawdziwej walki (`l.1356,-15`) — gra robi m[1].split(',')
    // i sięga po multi[0], multi[1].
    expect(czlony("1356,-15")).toEqual(["1356", "-15"]);
  });

  test("jedna wartość to jeden człon", () => {
    expect(czlony("3615")).toEqual(["3615"]);
  });

  test("brak wartości i wartość pusta dają pustą listę", () => {
    expect(czlony(null)).toEqual([]);
    expect(czlony("")).toEqual([]);
  });
});

describe("liczba", () => {
  test("czyta wartości dodatnie i ujemne", () => {
    // Ujemne są realne: `l.-58` z prawdziwej walki to utrata życia, nie leczenie.
    expect(liczba("455")).toBe(455);
    expect(liczba("-58")).toBe(-58);
  });

  test("zero jest liczbą, a nie brakiem", () => {
    // `-D.0` pada w prawdziwych walkach i znaczy „obrażenia zredukowane do zera".
    expect(liczba("0")).toBe(0);
  });

  test("brak wartości i śmieć dają null, żeby czytelnik musiał się zdecydować", () => {
    expect(liczba(null)).toBeNull();
    expect(liczba("")).toBeNull();
    expect(liczba("nic")).toBeNull();
  });
});

/**
 * POKRYCIE — czy wiemy o KAŻDYM kluczu, który gra umie wysłać.
 *
 * To jest jedyne miejsce w repo, gdzie pokrycie da się DOMKNĄĆ, a nie tylko
 * oszacować. Materiał z jednej walki ma zero kluczy `unknown` i sam z siebie
 * nie mówi nic o tym, czego dekoder NIE rozpoznaje. Zbiór kluczy protokołu jest
 * za to skończony i policzalny — 233 etykiety w assecie klienta — więc pytanie
 * „czy czegoś nam brakuje" ma tutaj odpowiedź, a nie oszacowanie.
 *
 * Test jest DWUSTRONNY i to nie jest nadmiarowość. Jedna strona łapie klucz
 * gry, o którym nie wiemy (cicho niepoliczone obrażenia); druga — nasz wpis
 * o kluczu, którego gra nie ma (tabela, która zwietrzała po aktualizacji
 * klienta). To dwa różne błędy i jednostronny test przepuściłby drugi.
 *
 * ⚠️ **BLOK STAŁ PUSTY MIĘDZY 2026‑08‑04 A DZIŚ**, bo `znaneKlucze()` nie miało
 * z czym się porównać: zamrożona tabela leżała jako plik danych obok testów
 * i zeszła z drzewa razem z nimi. Wrócił świadek, nie test — asercje niżej są
 * napisane od nowa.
 */
describe("pokrycie tabeli ról kontra asset gry", () => {
  test("każdy klucz, który gra zna, ma u nas rolę", () => {
    // Strona pierwsza: klucz gry, o którym nie wiemy, wpada do `{kind:"unknown"}`
    // — hałasuje w panelu, ale nie mówi, ILE przez niego przepadło.
    expect(ZAMROZENIE.klucze.map((w) => w.klucz).filter((k) => rola(k) === null)).toEqual([]);
  });

  test("i odwrotnie — nie znamy klucza, którego gra nie ma", () => {
    // Strona druga. Bez niej tabela mogłaby puchnąć o klucze wymyślone przy
    // debugowaniu albo zwietrzałe po aktualizacji klienta, i nikt by tego nie
    // zauważył. `+dmgX`/`-dmgX` NIE wchodzą do `znaneKlucze()` — obsługuje je
    // `rolaDomyslna`, bo gra też ich nie wylicza, tylko rozpoznaje w `default`.
    const gra = new Set(ZAMROZENIE.klucze.map((w) => w.klucz));
    expect(znaneKlucze().filter((klucz) => !gra.has(klucz))).toEqual([]);
  });

  test("żaden klucz nie stoi w dwóch tabelach naraz", () => {
    // ⚠️ NAJCICHSZY BŁĄD, JAKI TE TABELE POTRAFIĄ ZROBIĆ. `rola()` bierze
    // pierwszą pasującą (`ROLE` przed `PROCE` przed `MILCZACE`), więc klucz
    // wpisany omyłkiem do dwóch daje po cichu decyzję jednej z nich, a druga
    // przestaje istnieć. Ani `tsc`, ani żadna asercja pokrycia tego nie widzi:
    // klucz JEST znany, tylko znaczy co innego, niż ktoś napisał.
    //
    // Znalezione 2026‑08‑04 przy mutacji, która miała zapalić test „klucze
    // milczące są ciszą": dopisanie klucza z `MILCZACE` do `PROCE` nie zmieniło
    // NICZEGO, bo `WYLICZONE` skleja mapę z `MILCZACE` na końcu. Mutacja nie
    // zapaliła nie dlatego, że test był słaby, tylko dlatego, że pułapka jest
    // głębiej — i dopiero to ją ujawniło.
    //
    // Idzie po `TABELE_KLUCZY`, a NIE po `znaneKlucze()`, i to też jest wynik
    // mutacji: na sklejonej liście wystarczyło `new Set(...)` w `znaneKlucze()`,
    // żeby ten test zamilkł, a zmiana wyglądałaby na porządki.
    const pary = [
      ["role", "proce"],
      ["role", "milczace"],
      ["proce", "milczace"],
    ] as const;
    const kolizje = pary.flatMap(([a, b]) => {
      const drugi = new Set(TABELE_KLUCZY[b]);
      return TABELE_KLUCZY[a].filter((k) => drugi.has(k)).map((k) => `${k}: ${a} + ${b}`);
    });
    expect(kolizje).toEqual([]);
  });

  test("klucze, przy których gra MILCZY, są u nas ciszą — nie procem bez zdania", () => {
    // Gra ma dla nich puste ciało i świadomie nic nie wypisuje. Wpisanie ich
    // jako proców dałoby w panelu goły klucz tam, gdzie gra celowo milczy —
    // czyli hałas udający efekt. To rozróżnienie jest jedynym powodem, dla
    // którego zamrożenie w ogóle niesie pole `milczy`.
    const milczace = ZAMROZENIE.klucze.filter((w) => w.milczy).map((w) => w.klucz);
    expect(milczace.length).toBeGreaterThan(0);
    expect(milczace.filter((klucz) => rola(klucz)?.typ !== "cisza")).toEqual([]);
  });
});

describe("rolaDomyslna: gałąź `default` renderera", () => {
  test("zadane i przyjęte rozróżnia ZNAK, tak jak gra", () => {
    // :1102-1117 — `m[0].substr(1,3) === 'dmg'`, potem `charAt(0)`.
    expect(rolaDomyslna("+dmgd")).toEqual({ typ: "cios", kod: "d" });
    expect(rolaDomyslna("-dmgd")).toEqual({ typ: "przyjete", kod: "d" });
  });

  test("`+dmg` bez litery daje kod `p`, jak po stronie tekstu", () => {
    // Kod `p` jest NASZ — gra przy `+dmg` nie podaje żadnej litery, a bez kodu
    // „fizyczne" nie miałoby jak trafić do tabeli żywiołów.
    expect(rolaDomyslna("+dmg")).toEqual({ typ: "cios", kod: "p" });
  });

  test("kod nieznany przechodzi surowy, zamiast wypaść", () => {
    // Nowy żywioł po stronie gry ma dojść do `nazwaZywiolu` i zapalić się jako
    // `dmgX` w panelu — a nie zniknąć tutaj.
    expect(rolaDomyslna("+dmgZZ")).toEqual({ typ: "cios", kod: "ZZ" });
  });

  test("klucze niepodobne do obrażeń odpada", () => {
    expect(rolaDomyslna("+crit")).toBeNull();
    expect(rolaDomyslna("dmg_hpp")).toBeNull();
    expect(rolaDomyslna("heal")).toBeNull();
  });

  test("`+dmgX` NIE stoi w tabeli wyliczonej — ma iść gałęzią domyślną", () => {
    // Wpisanie ich zamknęłoby listę tam, gdzie gra ma ją otwartą.
    expect(znaneKlucze()).not.toContain("+dmgd");
    expect(rola("+dmgd")).toEqual({ typ: "cios", kod: "d" });
  });
});

describe("rola: nieznane ma być głośne", () => {
  test("klucz spoza tabeli i spoza gałęzi domyślnej daje null", () => {
    expect(rola("klucz-ktorego-gra-nie-ma")).toBeNull();
  });

  test("milczące mają rolę `cisza`, a nie brak roli", () => {
    // „Gra tego nie wypisuje" to ODPOWIEDŹ. Zlanie jej z „nie wiemy" dałoby
    // czujkę krzyczącą o kluczach, o których wiadomo wszystko.
    expect(rola("skillId")).toEqual({ typ: "cisza" });
    expect(rola("balloflight")).toEqual({ typ: "cisza" });
  });

  test("role znaczące niosą dowód, nie domysł", () => {
    expect(rola("-blok")).toEqual({ typ: "blok" });
    expect(rola("heal_target")).toEqual({ typ: "leczenie", strona: "cel", wlasne: false });
    // `znakZnaczacy` ma WYŁĄCZNIE `heal` — jako jedyny klucz leczenia, którego
    // zdanie niesie `%gain_lost%`, więc ujemna kwota znaczy przy nim „Stracono".
    expect(rola("heal")).toEqual({
      typ: "leczenie",
      strona: "nadawca",
      wlasne: false,
      znakZnaczacy: true,
    });
    expect(rola("poison")).toEqual({ typ: "dot", przyimek: "od", rodzaj: "trucizny" });
    expect(rola("injure")).toEqual({ typ: "dot", przyimek: "po", rodzaj: "zranieniu" });
    expect(rola("+thirdatt")).toEqual({ typ: "ciosProc", kod: "3", id: "+third_strike" });
  });
});

/**
 * Niezmiennik, którego brak pozwolił dwóm etykietom przeżyć własny parser
 * (`AUDYT‑97`).
 *
 * `DOT_LABELS` miało od 2026‑08‑04 wpisy „od ognia" i „od błyskawic", a żadna
 * ścieżka dekodera ich nie produkowała — bo `fire` i `light` stały w tabeli
 * efektów nieliczonych. Martwy wpis w mapie wygląda tak samo jak żywy, więc
 * pojedyncza asercja („«od ognia» daje «Ogień»") była przez te dwa dni ZIELONA
 * i bezużyteczna.
 *
 * Dlatego OBIE strony. Każda łapie inną awarię i żadna nie zastępuje drugiej:
 * pierwsza łapie rodzaj bez etykiety (fraza przyimkowa wycieka do panelu),
 * druga łapie etykietę bez rodzaju (kod, który nikogo nie obsługuje).
 */
describe("rodzaje tykających obrażeń: dekoder i etykiety zgadzają się w OBIE strony", () => {
  test("każdy rodzaj, który dekoder umie wypuścić, ma etykietę", () => {
    const bezEtykiety = RODZAJE_DOT.filter((r) => !RODZAJE_Z_ETYKIETA.includes(r));
    expect(bezEtykiety).toEqual([]);
  });

  test("każda etykieta ma rodzaj, który ją wywoła", () => {
    const martwe = RODZAJE_Z_ETYKIETA.filter((r) => !RODZAJE_DOT.includes(r));
    expect(martwe).toEqual([]);
  });

  test("etykieta jest RZECZOWNIKIEM, a nie frazą przyimkową z logu", () => {
    // Powód istnienia całej mapy: w panelu ta kolumna sąsiaduje z nazwami
    // umiejętności („Niszczycielski cios"), więc „od krwawienia" czyta się
    // w niej jak usterka. Sprawdzane po WŁASNOŚCI, nie po liście nazw — lista
    // rosłaby razem z tabelą i zestarzała się przy pierwszym nowym rodzaju.
    for (const rodzaj of RODZAJE_DOT) {
      const [przyimek, ...reszta] = rodzaj.split(" ");
      expect(dotLabel(przyimek!, reszta.join(" "))).not.toStartWith(`${przyimek} `);
    }
  });
});

/**
 * DEKODER — komunikaty na zdarzenia.
 *
 * Najmniej pewna warstwa i testy tego nie ukrywają: sprawdzają, że składanie
 * jest KONSEKWENTNE i że niepewność jest głośna, a nie że odwzorowuje grę.
 * Tego drugiego nie dowiedzie nic aż do walki zapisanej obiema drogami.
 */
const SKLAD: RosterEntry[] = [
  { id: 1, name: "Kamil", side: 0 },
  { id: 2, name: "Locha", side: 1 },
];

describe("dekoduj: cios", () => {
  test("zadane i przyjęte składają się w jedno trafienie", () => {
    const [z] = dekoduj(["1=100.00;2=40.37;+dmgd=455;+pierce;-dmgd=455"], SKLAD);
    expect(z).toMatchObject({
      kind: "attack",
      source: "Kamil",
      target: "Locha",
      sourceHpPct: 100,
      targetHpPct: 40.37,
      strike: true,
      // Efekt niesie klucz, wartość i STRONĘ — nie samą etykietę (`AUDYT‑87`).
      // `+pierce` jest przebiciem BIJĄCEGO, więc strona domyślna.
      procs: [{ key: "+pierce", label: "+pierce", value: null, side: "attacker" }],
    });
    expect((z as { hits: unknown[] }).hits).toEqual([
      {
        raw: 455,
        applied: 455,
        crit: false,
        superCrit: false,
        secondary: false,
        element: "dystansowe",
        dodged: false,
      },
    ]);
  });

  // ⚠️ **STAŁ TU TEST „ta sama liczba, co po drugiej stronie" i zszedł
  // 2026‑08‑04.** Brał ten sam komunikat, wyciągał z niego 455 i pokazywał, że
  // zgadza się z 455 odczytanym DRUGĄ, niezależną drogą. Cała jego wartość
  // siedziała w tamtej drugiej stronie; bez niej został sprawdzian, że
  // z `+dmgd=455` wychodzi 455 — czyli dokładnie to, co asercja wyżej robi na
  // tym samym komunikacie. Test powtarzający sąsiada kosztuje uwagę i nic nie
  // chroni.
  //
  // Nie jest to sprzątanie: **tu naprawdę ubyło pokrycie**, tylko nie w tym
  // pliku. Ubyło go w chwili, w której zniknął drugi odczyt.

  test("blok i unik siadają na ciosie, a nie obok niego", () => {
    const [z] = dekoduj(["1=100.00;2=98.29;+dmg=823;-blok=247;-evade;-dmg=0"], SKLAD);
    expect(z).toMatchObject({ kind: "attack", blocked: 247, dodged: true });
  });

  test("dwa żywioły w jednym komunikacie dają dwa trafienia, drugie jako wtórne", () => {
    const [z] = dekoduj(["1=100.00;2=98.29;+dmgc=453;+dmgl=887;-dmgc=13;-dmgl=224"], SKLAD);
    const hits = (z as { hits: { element: string; secondary: boolean; applied: number }[] }).hits;
    expect(hits.map((h) => h.element)).toEqual(["zimno", "błyskawica"]);
    expect(hits.map((h) => h.secondary)).toEqual([false, true]);
    expect(hits.map((h) => h.applied)).toEqual([13, 224]);
  });

  test("`+thirdatt` niesie liczbę I proc naraz", () => {
    const [z] = dekoduj(["1=100.00;2=98.29;+thirdatt=120;-thirdatt=100"], SKLAD);
    expect(z).toMatchObject({
      kind: "attack",
      procs: [{ key: "+thirdatt", label: "+thirdatt", value: "120", side: "attacker" }],
    });
    expect((z as { hits: { element: string }[] }).hits[0]!.element).toBe("trzeci cios");
  });

  test("nierówna liczba zadanych i przyjętych — nic nie ginie, ale się zapala", () => {
    // Kształt z prawdziwych walk: jedna liczba zadana, dwie przyjęte.
    const zd = dekoduj(["1=100.00;2=61.72;+dmgd=897;-dmgd=184;-dmga=135"], SKLAD);
    const cios = zd.find((z) => z.kind === "attack") as { hits: { raw: number; applied: number }[] };
    expect(cios.hits.map((h) => h.applied)).toEqual([184, 135]);
    expect(cios.hits.map((h) => h.raw)).toEqual([897, 0]);
    // Suma przyjętych zostaje prawdziwa, a rozjazd długości jest zgłoszony.
    // ⚠️ To jest kierunek NIEROZSTRZYGNIĘTY — przyjęte bez zadanego. Kierunek
    // odwrotny (`+dmgX` bez pary) `unknown` już nie zapala; test niżej.
    expect(zd.some((z) => z.kind === "unknown")).toBe(true);
  });

  test("przyjęte trafia pod SWÓJ żywioł, nie pod ten, który wypadł na tej pozycji", () => {
    // Kształt zmierzony na `2026-08-06-tempest-grupa-vs-hildur`: trzy żywioły
    // zadane, dwa przyjęte, a brakuje ŚRODKOWEGO. Parowanie po kolejności dawało
    // tu `ogień ← 8` (przyjęte należące do zimna) i `zimno ← 0`.
    const [z] = dekoduj(
      ["1=100.00;2=99.57;+dmgd=926;+dmgf=138;+dmgc=799;-dmgd=81;-dmgc=8"],
      SKLAD,
    );
    const hits = (z as { hits: { element: string; applied: number; raw: number }[] }).hits;
    expect(hits.map((h) => `${h.element}:${h.raw}→${h.applied}`)).toEqual([
      "dystansowe:926→81",
      "ogień:138→0",
      "zimno:799→8",
    ]);
  });

  test("`+dmgX` bez pary nie jest już nieznanym kształtem", () => {
    // Osobno od asercji wyżej, bo pyta o co innego: tamta o przypisanie liczb,
    // ta o czujkę. Rozstrzygnięte 2026‑08‑06 assetem klienta — gra dwóch stron
    // nie paruje w ogóle (`docs/MECHANIKA.md`, „Zadane i przyjęte NIE SĄ
    // PAROWANE"), więc brak `-dmgf` znaczy „pod ogniem nie weszło nic", a nie
    // „nasz model się rozjechał".
    const zd = dekoduj(["1=100.00;2=99.57;+dmgd=926;+dmgf=138;-dmgd=81"], SKLAD);
    expect(zd.some((z) => z.kind === "unknown")).toBe(false);
  });

  test("ten sam żywioł dwa razy — drugie zadane bierze DRUGIE przyjęte", () => {
    // Zużywanie dopasowania, a nie samo jego znajdowanie. Bez `splice` oba
    // trafienia dostałyby 100 i suma przyjętych urosłaby z 130 do 200.
    const [z] = dekoduj(["1=100.00;2=98.29;+dmgd=500;+dmgd=400;-dmgd=100;-dmgd=30"], SKLAD);
    const hits = (z as { hits: { applied: number }[] }).hits;
    expect(hits.map((h) => h.applied)).toEqual([100, 30]);
  });
});

/**
 * Strona efektu — `AUDYT‑87`.
 *
 * Dowód, dlaczego to nie jest szczegół: `-parry` i `-absorb` stoją w KOMUNIKACIE
 * BIJĄCEGO, a opisują tarczę BITEGO. Gra renderuje je do `tm[2]`, czyli do tego
 * samego kubełka co `-blok` i `-evade` (`BattleMessages.js:827,830,832,850`).
 */
describe("dekoduj: po czyjej stronie zaszedł efekt", () => {
  test("efekt obronny należy do CELU, choć stoi w komunikacie bijącego", () => {
    const [z] = dekoduj(["1=100.00;2=50.00;+dmgd=500;-dmgd=300;-absorb=200;-parry"], SKLAD);
    const procs = (z as { procs: { key: string; side: string }[] }).procs;
    expect(procs.map((p) => [p.key, p.side])).toEqual([
      ["-absorb", "target"],
      ["-parry", "target"],
    ]);
  });

  test("efekt zaczepny zostaje przy bijącym", () => {
    const [z] = dekoduj(["1=100.00;2=90.00;+dmgd=10;+pierce;+acdmg=5;-dmgd=10"], SKLAD);
    const procs = (z as { procs: { key: string; side: string }[] }).procs;
    expect(procs.map((p) => [p.key, p.side])).toEqual([
      ["+pierce", "attacker"],
      ["+acdmg", "attacker"],
    ]);
  });

  test("ZNAK KLUCZA nie rozstrzyga strony i nie wolno go za to brać", () => {
    // Dwa kontrprzykłady naraz, po jednym w każdą stronę. Gdyby ktoś zastąpił
    // wyliczoną listę regułą „minus znaczy cel", ten test się zapala.
    const [z] = dekoduj(
      ["1=100.00;2=50.00;+dmgd=500;-dmgd=300;+absorb=90;-legbon_facade=7"],
      SKLAD,
    );
    const procs = (z as { procs: { key: string; side: string }[] }).procs;
    expect(procs.map((p) => [p.key, p.side])).toEqual([
      // plus, a jednak cel („Odnowienie absorpcji", `:847`)
      ["+absorb", "target"],
      // minus, a jednak nie cel (`tm[1]`, kubełek neutralny, `:811`)
      ["-legbon_facade", "attacker"],
    ]);
  });

  /**
   * `AUDYT‑93` — kubełek renderera mówi, KOGO efekt dotyczy, a nie KTO go
   * wyzwolił. Dla efektów obronnych oba znaczenia się pokrywają; dla debuffów
   * rzucanych ciosem rozjeżdżają się, i to na tych trzech kluczach pierwsza
   * wersja tabeli się pomyliła.
   */
  test.each([
    // Wycofane z `STRONA_CELU`: gra drukuje je w `tm[2]`, ale pomoc mówi, że
    // wyzwala je BIJĄCY. Wpisanie ich z powrotem „bo są w tm[2]" ma paść.
    ["+critpoison_per", "attacker"],
    ["+vulture", "attacker"],
    ["+legbon_puncture", "attacker"],
    // Dopisane: gra drukuje je w kubełku NEUTRALNYM, ale pomoc mówi wprost,
    // że należą do postaci, która obrywa.
    ["-immunity_to_dmg", "target"],
    ["-redabdest_per", "target"],
    // ⚠️ PUŁAPKA ODWROTNA (`AUDYT‑94`). Pomoc mówi o nich „zwiększa odporność
    // Postaci, NA KTÓRĄ RZUCONA JEST UMIEJĘTNOŚĆ" — brzmi jak wskazanie celu,
    // ale wskazuje BENEFICJENTA, nie sprawcę. Wyzwala je umiejętność
    // rzucającego, więc zostają przy nim. Dopisanie ich do `STRONA_CELU`
    // „bo pomoc mówi o celu" ma się tu zapalić.
    ["resfire_per", "attacker"],
    ["resfrost_per", "attacker"],
    ["reslight_per", "attacker"],
    // Kotwice: te dwa źródła są zgodne i mają zostać zgodne.
    ["-parry", "target"],
    ["+pierce", "attacker"],
  ])("%s należy do strony: %s", (klucz, strona) => {
    const [z] = dekoduj([`1=100.00;2=90.00;+dmgd=10;${klucz}=1;-dmgd=10`], SKLAD);
    const procs = (z as { procs: { key: string; side: string }[] }).procs;
    expect(procs.find((p) => p.key === klucz)?.side).toBe(strona);
  });

  test("efekt niesie WARTOŚĆ, żeby decyzje nie szły po zdaniu", () => {
    // `AUDYT‑89`: kwota zranienia ma się dać odczytać bez czytania etykiety.
    const [z] = dekoduj(["1=100.00;2=90.00;+dmgd=10;+injure=339;-dmgd=10"], SKLAD);
    const procs = (z as { procs: { key: string; value: string | null }[] }).procs;
    expect(procs).toMatchObject([{ key: "+injure", value: "339" }]);
  });
});

describe("dekoduj: leczenie i obrażenia bez sprawcy", () => {
  test("`heal` leczy NADAWCĘ, ale NIE jest oznaczone jako własne", () => {
    // ⚠️ Ten test twierdził do 2026‑08‑04 `self: true` i był NAPISANY POD BŁĄD:
    // powstał razem z dekoderem, z tego samego założenia. Obaliło je dopiero
    // porównanie z DRUGIM, niezależnym odczytem tej samej walki. Zielony test
    // nie jest dowodem, gdy autor testu i autor kodu wierzą w to samo.
    const [z] = dekoduj(["1=99.04;0;heal=1356"], SKLAD);
    expect(z).toMatchObject({ kind: "heal", target: "Kamil", amount: 1356, self: false });
  });

  test("`heal` z kwotą UJEMNĄ to ubytek życia, nie leczenie na minusie", () => {
    // „Stracono −92 punktów życia X". Gra rozstrzyga to ZNAKIEM, w jednym
    // warunku: `m[1] >= 0 ? part_gained : part_lost` (`BattleMessages.js:301`).
    // Do 2026‑08‑05 wychodziło stąd leczenie na −92, więc realny ubytek nie
    // liczył się jako obrażenia w ogóle.
    const [z] = dekoduj(["1=88.00;0;heal=-92"], SKLAD);
    expect(z).toMatchObject({
      kind: "dot",
      target: "Kamil",
      // Kwota DODATNIA — minus jest ozdobnikiem zapisu, nie negacją.
      amount: 92,
      via: "od",
      dotType: "ubytku życia",
    });
  });

  test("ujemna kwota przy INNYM kluczu leczenia jest głośna", () => {
    // `%gain_lost%` stoi wyłącznie w zdaniu klucza `heal`; pozostałe składają
    // bezwarunkowe „Przywrócono". Minus przy nich to kształt spoza reguły gry —
    // ma zapalić czujkę, a nie zostać po cichu przemianowany na ubytek.
    const zd = dekoduj(["1=88.00;2=50.00;heal_target=-50"], SKLAD);
    expect(zd).toEqual([
      { kind: "unknown", line: "heal_target=-50", lineNo: 0, scope: "segment", dropped: true },
    ]);
  });

  test("`heal_target` leczy CEL i własne już nie jest", () => {
    // Struktura protokołu rozstrzyga to, co w tekście jest wnioskiem
    // (`types.ts:117‑128`): „Uleczono X" rzucił ktoś inny.
    const [z] = dekoduj(["1=100.00;2=80.00;heal_target=4639"], SKLAD);
    expect(z).toMatchObject({ kind: "heal", target: "Locha", amount: 4639, self: false });
  });

  test("kwota stoi w członie ZEROWYM, choć zdanie sugeruje odwrotnie", () => {
    // `legbon_lastheal`: renderer podstawia '%val%': mm[1] (nazwa),
    // '%val2%': mm[0] (kwota). Czytanie zdania bez zajrzenia do podstawienia
    // dałoby leczenie równe numerowi postaci.
    const [z] = dekoduj(["1=50.00;0;legbon_lastheal=980,Kamil"], SKLAD);
    expect(z).toMatchObject({ kind: "heal", amount: 980 });
  });

  test.each([
    // „Uleczono %name% o %val% punktów życia." — `'%name%': f1.name` (`:378‑392`).
    ["bandage=200", 200],
    // „+Uleczono za %val% punktów życia" (`:1018‑1039`).
    ["vamp_time=75", 75],
  ])("`%s` to leczenie w punktach, nie efekt bez liczby (AUDYT‑96)", (segment, kwota) => {
    // Do 2026‑08‑06 oba klucze stały w tabeli efektów NIELICZONYCH, więc taki
    // komunikat dawał zero zdarzeń: leczenie nie wchodziło ani do `healingReceived`,
    // ani do puli bez leczącego, czyli nie zostawiało po sobie nawet przypisu.
    const zd = dekoduj([`1=88.00;0;${segment}`], SKLAD);
    expect(zd).toHaveLength(1);
    expect(zd[0]).toMatchObject({ kind: "heal", target: "Kamil", amount: kwota, self: false });
  });

  test("osłabienie leczenia nie psuje KWOTY, choć samo przepada", () => {
    // Wariant dwuczłonowy: „%val% (osłabiono o %val2%%)". Drugiego członu
    // `BattleEvent.heal` nie ma gdzie położyć i to jest zapisane jako otwarte
    // (`AUDYT‑96`) — ale kwota z członu zerowego stoi już PO osłabieniu, więc
    // liczba w panelu zostaje prawdziwa. Test pilnuje właśnie tego: obecność
    // drugiego członu nie ma prawa ruszyć pierwszego ani zamienić go w `unknown`.
    const [z] = dekoduj(["1=88.00;0;bandage=200,15"], SKLAD);
    expect(z).toMatchObject({ kind: "heal", amount: 200 });
  });

  /**
   * `dmg-target_physical` — obrażenia o STAŁEJ wartości, zadane CELOWI
   * (`AUDYT‑99`, przeniesione z `PROCE` do `ROLE` 2026‑08‑06).
   *
   * ⚠️ **TEN KLUCZ NIE MA I NIE BĘDZIE MIAŁ ŚWIADKA NA MATERIALE.** Nie pada
   * ani razu w obu fixture'ach, ani w całym `KORPUS` — sprawdzone pomiarem.
   * Wpis stoi na kliencie gry (katalog efektów, słownik, podstawienie
   * w rendererze), a te testy sprawdzają wyłącznie, czy dekoder robi z tego to,
   * co zapisano przy wpisie. Nie udają pokrycia materiałem i nie mają go udawać.
   */
  test("obrażenia o stałej wartości siadają na CELU, nie na nadawcy", () => {
    // Zdanie gry: „%target% otrzymuje %val% obrażeń" — `%target%` to `f2`.
    const [z] = dekoduj(["1=100.00;2=80.00;dmg-target_physical=250"], SKLAD);

    expect(z).toMatchObject({
      kind: "attack",
      source: "Kamil",
      target: "Locha",
      // `raw === applied`, bo katalog mówi „obrażenia nie są redukowane przez
      // pancerz". Zaślepka `applied: 0` czytałaby się jako „wszystko pochłonięte".
      hits: [expect.objectContaining({ raw: 250, applied: 250, element: "fizyczne" })],
      // Nie cios bronią — nie ma podbijać licznika trafień ani tur.
      strike: false,
    });
  });

  /**
   * PARA NEGATYWNA: klucz NIE wchodzi do parowania po żywiole.
   *
   * Gdyby dostał rolę `cios`, wpadłby do puli parowanej z `-dmgX`. Pary dla
   * niego nie ma, więc `applied` wyszłoby `0` — a wtedy `stats.ts` policzyłby
   * te obrażenia jako w całości pochłonięte (`damageAbsorbed += raw - applied`).
   * Ten test pilnuje, że stoi obok ciosu, a nie w nim.
   */
  test("stoi OBOK ciosu, a nie w jego parowaniu", () => {
    const zd = dekoduj(
      ["1=100.00;2=80.00;+dmgd=100;-dmgd=60;dmg-target_physical=250"],
      SKLAD,
    );
    const ciosy = zd.filter((z) => z.kind === "attack");

    // Dwa OSOBNE zdarzenia: stałe obrażenia i właściwy cios.
    expect(ciosy).toHaveLength(2);
    expect(ciosy[0]).toMatchObject({ strike: false, hits: [expect.objectContaining({ applied: 250 })] });
    expect(ciosy[1]).toMatchObject({ strike: true, hits: [expect.objectContaining({ raw: 100, applied: 60 })] });
    // I ani jednego `unknown` — 250 nie jest „przyjętym bez pary".
    expect(zd.filter((z) => z.kind === "unknown")).toEqual([]);
  });

  test("DoT trafia w nadawcę i niesie przyimek z brzmienia gry", () => {
    const zd = dekoduj(["1=6.71;0;anguish=3615", "1=6.00;0;injure=120"], SKLAD);
    expect(zd[0]).toMatchObject({
      kind: "dot",
      target: "Kamil",
      amount: 3615,
      via: "od",
      dotType: "krwawienia",
    });
    expect(zd[1]).toMatchObject({ via: "po", dotType: "zranieniu" });
  });

  test.each([
    // `critwound` — trzy źródła zgodne, opis przy wpisie w `ROLE`. Wartość
    // DWUCZŁONOWA, tak jak przy truciźnie: kwota i procent osłabienia.
    ["critwound=140,14", "od", "ciężkiej rany", 140, 14],
    // Cztery żywioły. Renderer robi `m[1].split(',')` przy trzech pierwszych…
    ["fire=88,10", "od", "ognia", 88, 10],
    ["frost=88", "od", "zimna", 88, null],
    ["light=88", "od", "błyskawic", 88, null],
    // …a przy `physical` NIE robi (`:402‑404`), więc drugiego członu nie ma
    // i `null` jest tu zgodnością z grą, a nie zgubioną liczbą.
    ["physical=88", "od", "obrażeń fizycznych", 88, null],
  ])(
    "`%s` to tyknięcie, nie efekt bez liczby (AUDYT‑95)",
    (segment, przyimek, rodzaj, kwota, oslabienie) => {
      // Do 2026‑08‑06 każdy z tych pięciu kluczy stał w tabeli efektów
      // NIELICZONYCH, więc taki komunikat dawał ZERO zdarzeń — bez `unknown`,
      // bez ostrzeżenia w panelu, bez śladu. Punkty życia znikały po cichu.
      const zd = dekoduj([`1=19.27;0;${segment}`], SKLAD);
      expect(zd).toHaveLength(1);
      expect(zd[0]).toMatchObject({
        kind: "dot",
        target: "Kamil",
        amount: kwota,
        via: przyimek,
        dotType: rodzaj,
        weakenedPct: oslabienie,
      });
    },
  );

  test("`critwound` tyka tak samo jak `wound` — bo renderer składa je tym samym kodem", () => {
    // Sedno `AUDYT‑95` w jednej asercji: `:249‑253` kontra `:259‑263` różnią
    // się kolorem czcionki i identyfikatorem zdania. Wszystko poza rodzajem ma
    // wyjść identyczne, a rodzaj ma być różny, bo różne są ZDANIA gry.
    const [ciezka] = dekoduj(["1=19.27;0;critwound=140,14"], SKLAD);
    const [gleboka] = dekoduj(["1=19.27;0;wound=140,14"], SKLAD);
    expect({ ...ciezka, dotType: null }).toEqual({ ...gleboka, dotType: null });
    expect(ciezka).toMatchObject({ dotType: "ciężkiej rany" });
    expect(gleboka).toMatchObject({ dotType: "głębokiej rany" });
  });

  test("obrażenia nieuchronne są ciosem BEZ ciosu — jak własne obrażenia umiejętności", () => {
    const [z] = dekoduj(["1=88.00;0;absolute=507"], SKLAD);
    expect(z).toMatchObject({
      kind: "attack",
      source: "Kamil",
      target: "Kamil",
      strike: false,
      sourceHpPct: null,
    });
  });
});

describe("dekoduj: przebieg walki", () => {
  test("zapowiedź umiejętności dokleja się do NASTĘPNEGO ciosu i tylko do niego", () => {
    const zd = dekoduj(
      [
        "1=100.00;2=100.00;tspell=Porażenie;skillId=70",
        "1=100.00;2=94.92;+dmgc=453;-dmgc=13",
        "1=100.00;2=90.00;+dmgc=100;-dmgc=50",
      ],
      SKLAD,
    );
    // `actorId` jedzie razem z nazwą od 2026‑08‑05 — to po nim `stats.ts`
    // rozdziela postacie o tej samej nazwie, zamiast zgadywać po spadku życia.
    expect(zd[0]).toEqual({ kind: "ability", actor: "Kamil", actorId: 1, name: "Porażenie" });
    expect(zd[1]).toMatchObject({ kind: "attack", ability: "Porażenie" });
    expect(zd[2]).toMatchObject({ kind: "attack", ability: null });
  });

  /**
   * ZASIĘG ZAPOWIEDZI TO JEDEN KOMUNIKAT — trzy kształty, które do 2026‑08‑05
   * dawały złą liczbę w rozbiciu „CZYM", i żaden z nich nie zapalał niczego.
   *
   * Zapowiedź gasła WYŁĄCZNIE po złożeniu ciosu, więc każda ścieżka kończąca
   * komunikat inaczej (leczenie, krok, komunikat bez liczb) zostawiała ją
   * uzbrojoną — i przyklejała ją do pierwszego ciosu, jaki nadszedł, choćby
   * kilka komunikatów później.
   *
   * Rozstrzyga to cytat z gry stojący przy `dekoduj`: komunikat ze `skillId`
   * jest sklejany z NASTĘPNYM (`nextIndex = parseIndexM + 1`) i z niczym więcej.
   */
  test("leczenie zjada zapowiedź — następny zwykły cios jej NIE dostaje", () => {
    // Najostrzejszy z trzech: obrażenia broni szły w panelu pod nazwą
    // umiejętności LECZĄCEJ.
    const zd = dekoduj(
      [
        "1=100.00;2=100.00;tspell=Uzdrowienie;skillId=7",
        "1=100.00;0;heal=500",
        "1=100.00;2=80.00;+dmgd=400;-dmgd=400",
      ],
      SKLAD,
    );
    expect(zd.find((e) => e.kind === "heal")).toMatchObject({ ability: "Uzdrowienie" });
    expect(zd.find((e) => e.kind === "attack")).toMatchObject({ ability: null });
  });

  test("komunikat pośredni zjada zapowiedź — krok też jest komunikatem", () => {
    const zd = dekoduj(
      [
        "1=100.00;2=100.00;tspell=Porażenie;skillId=70",
        "1=100.00;0;step",
        "1=100.00;2=80.00;+dmgd=400;-dmgd=400",
      ],
      SKLAD,
    );
    expect(zd.find((e) => e.kind === "attack")).toMatchObject({ ability: null });
  });

  test("zapowiedź i obrażenia w TYM SAMYM komunikacie — cios dostaje, następny nie", () => {
    // Druga strona reguły. Gdyby wygaszanie było ślepe na „ustawiona właśnie
    // teraz", zapowiedź przeżyłaby własny komunikat i poszła na kolejny.
    const zd = dekoduj(
      [
        "1=100.00;2=80.00;tspell=Fuzja;skillId=9;+dmgc=400;-dmgc=400",
        "1=100.00;2=60.00;+dmgd=100;-dmgd=100",
      ],
      SKLAD,
    );
    const ciosy = zd.filter((e) => e.kind === "attack");
    expect(ciosy).toHaveLength(2);
    expect(ciosy[0]).toMatchObject({ ability: "Fuzja" });
    expect(ciosy[1]).toMatchObject({ ability: null });
  });

  /**
   * ⚠️ **TEN TEST PYTAŁ TEŻ O LISTĘ NAZWISK I PRZESTAŁ 2026‑08‑09.** Sprawdzał
   * `actors: ["Kamil", "Locha"]` — pole, którego **nikt poza tą asercją nie
   * czytał**: ani `stats.ts`, ani panel, ani archiwum (jedyny konsument
   * `fight-end` w produkcji bierze `outcome`). Zeszło razem z `result`.
   *
   * Warto zapisać, bo to poprawka do audytu, a nie tylko do kodu: pole nie było
   * „bez czytelnika", tylko **czytane wyłącznie przez test, który sprawdzał, że
   * jest wypełniane**. Taki test mierzy własne istnienie i wygląda przy tym
   * dokładnie tak samo jak test niosący wymaganie.
   */
  test("rozstrzygnięcie walki: `winner` to zwycięstwo, `loser` to porażka", () => {
    const [a] = dekoduj(["0;0;winner=Kamil, Locha"], SKLAD);
    expect(a).toMatchObject({ kind: "fight-end", outcome: "victory" });
    const [b] = dekoduj(["0;0;loser=Kamil"], SKLAD);
    expect(b).toMatchObject({ kind: "fight-end", outcome: "defeat" });
  });

  test("`winner=?` to remis, a nie zwycięstwo postaci o nazwie „?”", () => {
    // Gra idzie wtedy gałęzią `battle_no_winner` i nazwiska nie wypisuje.
    const [z] = dekoduj(["0;0;winner=?"], SKLAD);
    expect(z).toEqual({ kind: "fight-end", outcome: "draw" });
  });

  test("`txt` oddaje tekst serwera bez tłumaczenia", () => {
    const [z] = dekoduj(["0;0;txt=Rozpoczęła się walka pomiędzy"], SKLAD);
    expect(z).toEqual({ kind: "info", line: "Rozpoczęła się walka pomiędzy" });
  });
});

/**
 * EFEKT BEZ ANI JEDNEJ LICZBY OBRAŻEŃ — `AUDYT‑98`.
 *
 * Do 2026‑08‑06 wczesny powrót nie czytał zebranej listy `procy`, więc taki
 * komunikat dawał ZERO zdarzeń niosących efekt. Zmierzone na
 * `2026-08-06-tempest-grupa-vs-hildur`: 91 komunikatów, 247 efektów, żaden
 * nieobecny w `unknown` — czyli dekoder rozpoznawał klucze poprawnie
 * i porzucał wynik. Pełne liczby: `docs/AUDYT.md`, `AUDYT‑102`.
 *
 * Kształty niżej są PRZEPISANE Z MATERIAŁU, nie wymyślone — po jednym na każdy
 * z trzech układów stron, które w nim występują.
 */
describe("dekoduj: efekt rzucony poza ciosem", () => {
  test("aura na kompana daje `effect`, a nie ciszę", () => {
    // Kształt z materiału: `469657=100.00;-10000249=99.60;tspell=Szadź;…`
    const zd = dekoduj(["1=100.00;2=99.60;tspell=Szadź;skillId=123;allslow_per=14"], SKLAD);

    expect(zd).toContainEqual(
      expect.objectContaining({
        kind: "effect",
        source: "Kamil",
        target: "Locha",
        ability: "Szadź",
        procs: [expect.objectContaining({ key: "allslow_per", value: "14" })],
      }),
    );
  });

  /**
   * ⚠️ **CIOSU Z TEGO NIE MA I TO JEST OSOBNA ASERCJA.** Gałąź mogłaby
   * „naprawić" problem, emitując `attack` z pustym `hits` — a wtedy `stats.ts`
   * policzyłby trafienie, turę i wiersz w rozbiciu, czyli panel pokazałby cios,
   * którego gra nie opisała (`BattleMessages.js:1127`, warunek `attack != ''`).
   * Sama obecność efektu tego nie wyłapie.
   */
  test("z komunikatu bez obrażeń NIE powstaje cios", () => {
    const zd = dekoduj(["1=100.00;2=99.60;tspell=Szadź;skillId=123;allslow_per=14"], SKLAD);
    expect(zd.filter((z) => z.kind === "attack")).toEqual([]);
  });

  test("samobuf — obie strony to ta sama postać, i tak ma zostać zapisane", () => {
    // Kształt z materiału: `466476=94.30;466476=94.30;tspell=Aura ochrony;…`
    const zd = dekoduj(["1=94.30;1=94.30;tspell=Aura ochrony;skillId=76;aura-resall=15"], SKLAD);

    expect(zd).toContainEqual(
      expect.objectContaining({ kind: "effect", source: "Kamil", target: "Kamil" }),
    );
  });

  test("komunikat bez drugiej strony daje `effect` z celem `null`", () => {
    // Kształt z materiału: `467968=100.00;0;poison_lowdmg_per-enemies=10`
    const zd = dekoduj(["1=100.00;0;poison_lowdmg_per-enemies=10"], SKLAD);

    expect(zd).toContainEqual(
      expect.objectContaining({ kind: "effect", source: "Kamil", target: null }),
    );
  });

  /**
   * ⚠️ **BEZ NADAWCY TO `info`, NIE `unknown`** — i ta różnica jest treścią
   * testu, nie jego szczegółem. `unknown` znaczy „dekoder nie rozumie klucza"
   * i zapala graczowi ostrzeżenie o niepełnych statystykach; tutaj rozumiemy
   * wszystko, tylko log nie mówi, czyj to efekt. Jedyny taki w materiale to
   * `0;0;+exp=3973` — doświadczenie z końca walki, przypisane dosłownie nikomu.
   */
  test("efekt bez ANI JEDNEJ strony nie zapala czujki nieznanego", () => {
    const zd = dekoduj(["0;0;+exp=3973"], SKLAD);

    expect(zd).toEqual([{ kind: "info", line: "0;0;+exp=3973" }]);
    expect(zd.filter((z) => z.kind === "unknown")).toEqual([]);
  });

  test("komunikat Z obrażeniami nadal daje cios z efektami — regresja", () => {
    // Para dla całego bloku: naprawa dotyczy WYŁĄCZNIE gałęzi bez obrażeń.
    // Gdyby efekty przeniosły się do `effect` także przy ciosie, panel straciłby
    // powiązanie efektu z trafieniem.
    const zd = dekoduj(["1=100.00;2=90.00;+dmgd=10;+pierce;-dmgd=10"], SKLAD);

    expect(zd.filter((z) => z.kind === "effect")).toEqual([]);
    expect(zd).toContainEqual(
      expect.objectContaining({
        kind: "attack",
        procs: [expect.objectContaining({ key: "+pierce" })],
      }),
    );
  });
});

/**
 * ETYKIETA Z NIEWYPEŁNIONĄ DZIURĄ SPADA DO KLUCZA — `AUDYT‑98`.
 *
 * `etykieta()` podstawia wyłącznie `%val%`, a część identyfikatorów żąda
 * więcej (`msg_+oth_dmg %val% %name%`). Dopóki te klucze nie docierały do
 * panelu, nie było tego widać: zmierzone **0 z 299** dzisiejszych etykiet
 * z dziurą, **147 z 546** po wpuszczeniu efektów spoza ciosu.
 */
describe("dekoduj: brzmienie z dziurą jest gorsze od klucza", () => {
  /**
   * Atrapa PODSTAWIAJĄCA, a nie zwracająca stały napis — inaczej testy niżej
   * byłyby zielone niezależnie od tego, co robi `parametryZdania`. `SlownikStaly`
   * używa tego samego `podstaw`, co ścieżka produkcyjna.
   */
  const slownikZ = (id: string, szablon: string) => new SlownikStaly([[id, szablon]]);
  const etykiety = (z: BattleEvent | undefined) =>
    (z as { procs: { key: string; label: string }[] }).procs.map((p) => p.label);

  test("zdanie z niepodstawionym `%name%` ustępuje kluczowi", () => {
    // `mana` — klucz, którego NIE MA w `PODSTAWIENIA_Z_WARTOSCI`. Klient
    // podstawia tam `f1.name`, czyli nazwę spoza wartości, więc my nie mamy
    // czym wypełnić dziury i zdanie ustępuje kluczowi.
    const [z] = dekoduj(
      ["1=100.00;2=90.00;+dmgd=10;-dmgd=10;mana=-50"],
      SKLAD,
      slownikZ("msg_receivemana %name% %val%", "%name% odzyskał %val% many"),
    );

    expect(etykiety(z)).toEqual(["mana"]);
  });

  test("zdanie BEZ dziury przechodzi normalnie — para dla testu wyżej", () => {
    // Bez niej „zawsze zwracaj klucz" przeszłoby tak samo, a to skasowałoby
    // cały sens słownika gry.
    const [z] = dekoduj(
      ["1=100.00;2=90.00;+dmgd=10;-dmgd=10;+pierce"],
      SKLAD,
      slownikZ("msg_+pierce", "+Przebicie"),
    );

    expect(etykiety(z)).toEqual(["Przebicie"]);
  });

  /**
   * `+oth_dmg` — dziura, którą KLIENT każe wypełnić z samej wartości
   * (`AUDYT‑106`). `BattleMessages.js:596‑602`: `'%val%': mm[0]`,
   * `'%name%': mm[2]`. To nie jest zgadywanie, więc etykieta ma być zdaniem.
   */
  test("`+oth_dmg` wypełnia `%name%` z TRZECIEGO członu wartości", () => {
    const [z] = dekoduj(
      ["1=100.00;2=90.00;+dmgd=10;-dmgd=10;+oth_dmg=8868,g,Ktoś(70.85%)"],
      SKLAD,
      slownikZ("msg_+oth_dmg %val% %name%", "−%val% obrażeń otrzymał %name%"),
    );

    expect(etykiety(z)).toEqual(["−8868 obrażeń otrzymał Ktoś(70.85%)"]);
  });

  /**
   * ⚠️ **PODSTAWIENIE DOTYCZY BRZMIENIA, NIE LICZB.** Świadek życia poprawia się
   * po doliczeniu tych obrażeń z 0/71 na 25/71 — kierunek pewny, wielkość nie —
   * więc `+oth_dmg` zostaje procem. Ta asercja pilnuje decyzji: gdyby ktoś przy
   * okazji ładniejszej etykiety przeniósł klucz do obrażeń, zapali się tutaj.
   */
  test("ładniejsza etykieta NIE zamienia `+oth_dmg` w obrażenia", () => {
    const zd = dekoduj(["1=100.00;2=90.00;+oth_dmg=8868,g,Ktoś(70.85%)"], SKLAD);

    expect(zd.filter((z) => z.kind === "attack")).toEqual([]);
    expect(zd.filter((z) => z.kind === "unknown")).toEqual([]);
  });

  test("wartość krótsza, niż zakłada wzór, spada do klucza zamiast pustego miejsca", () => {
    // Zmiana formatu po stronie gry ma być GŁOŚNA. Podstawienie pustym ciągiem
    // dałoby „−8868 obrażeń otrzymał ", czyli zdanie wyglądające na poprawne.
    const [z] = dekoduj(
      ["1=100.00;2=90.00;+dmgd=10;-dmgd=10;+oth_dmg=8868,g"],
      SKLAD,
      slownikZ("msg_+oth_dmg %val% %name%", "−%val% obrażeń otrzymał %name%"),
    );

    expect(etykiety(z)).toEqual(["+oth_dmg"]);
  });
});

describe("dekoduj: nieznane jest głośne", () => {
  test("nierozpoznany klucz daje `unknown` z CAŁYM segmentem, nie z samym kluczem", () => {
    const zd = dekoduj(["1=100.00;2=90.00;+dmg=10;-dmg=10;czegoNieZnamy=7"], SKLAD);
    expect(zd).toContainEqual({
      kind: "unknown",
      line: "czegoNieZnamy=7",
      lineNo: 0,
      scope: "segment",
      dropped: true,
    });
  });

  test("nieznany klucz NIE kasuje reszty komunikatu", () => {
    // Ostrzej niż po stronie tekstu, gdzie nierozpoznana bywa cała linia.
    const zd = dekoduj(["1=100.00;2=90.00;+dmg=10;-dmg=10;czegoNieZnamy=7"], SKLAD);
    expect(zd.some((z) => z.kind === "attack")).toBe(true);
  });

  test("`lineNo` to numer KOMUNIKATU, bo linii protokół nie ma", () => {
    const zd = dekoduj(["0;0;txt=start", "1=100.00;2=90.00;nieznany"], SKLAD);
    expect(zd.find((z) => z.kind === "unknown")).toMatchObject({ lineNo: 1 });
  });

  test("id spoza składu nie dostaje zmyślonej nazwy", () => {
    const zd = dekoduj(["999=100.00;2=90.00;+dmg=10;-dmg=10"], SKLAD);
    expect(zd).toEqual([
      {
        kind: "unknown",
        line: "999=100.00;2=90.00;+dmg=10;-dmg=10",
        lineNo: 0,
        scope: "message",
        dropped: true,
      },
    ]);
  });

  test("obcięcie na drugim `=` zapala czujkę", () => {
    const zd = dekoduj(["1=100.00;2=90.00;klucz=a=b"], SKLAD);
    expect(zd.some((z) => z.kind === "unknown")).toBe(true);
  });

  /**
   * CZTERY KOMÓRKI TABELI 2×2 — `scope` × `dropped`.
   *
   * ⚠️ **DO 2026‑08‑07 NIE BYŁO ANI JEDNEGO TAKIEGO TESTU** (`AUDYT‑114`).
   * Zdarzenie `unknown` opisywało raz cały komunikat, raz segment, a `stats.ts`
   * sumowało jedno z drugim — i **całą tę usterkę dało się naprawić albo zepsuć
   * bez zmiany ani jednej asercji liczbowej w repo**. Zmierzone: jedyny test
   * z twardą liczbą (`overlay.test.ts`) przechodził także po deduplikacji.
   *
   * Dlatego to jest test o KONTRAKCIE, nie o pojedynczym kształcie: każda
   * kombinacja jest osiągalna z gry i każda znaczy dla gracza co innego.
   */
  describe("`unknown` deklaruje zasięg i skutek", () => {
    const czujka = (komunikat: string) =>
      dekoduj([komunikat], SKLAD)
        .filter((z) => z.kind === "unknown")
        .map((z) => ({ scope: z.scope, dropped: z.dropped }));

    test("id spoza składu — CAŁY komunikat, wszystko stracone", () => {
      expect(czujka("999=100.00;2=90.00;+dmg=10;-dmg=10")).toEqual([
        { scope: "message", dropped: true },
      ]);
    });

    test("nieznany klucz — SEGMENT, reszta komunikatu policzona", () => {
      const zd = dekoduj(["1=100.00;2=90.00;+dmg=10;-dmg=10;czegoNieZnamy=7"], SKLAD);
      expect(
        zd.filter((z) => z.kind === "unknown").map((z) => ({ scope: z.scope, dropped: z.dropped })),
      ).toEqual([{ scope: "segment", dropped: true }]);
      // Dowód, że `dropped` mówi prawdę: cios z tego samego komunikatu JEST.
      expect(zd.some((z) => z.kind === "attack")).toBe(true);
    });

    test("obcięcie na drugim `=` — SEGMENT, ale NIC nie stracone", () => {
      // Gra gubi ogon tak samo (`BattleMessages.js:176`), a sam klucz jest
      // przetwarzany dalej. To zastrzeżenie, nie strata.
      expect(czujka("1=100.00;2=90.00;+dmg=10;-dmg=10;+pierce=a=b")).toEqual([
        { scope: "segment", dropped: false },
      ]);
    });

    test("niesparowane `-dmgX` — CAŁY komunikat, ale NIC nie stracone", () => {
      // ⚠️ Komórka, której `AUDYT‑114` nie przewidywał. Cytujemy cały komunikat,
      // bo niesparowana jest RELACJA między segmentami — a `attack` powstaje
      // mimo to i obrażenia wchodzą do statystyk.
      const zd = dekoduj(["1=100.00;2=40.37;+dmgf=100;-dmgd=100"], SKLAD);
      expect(
        zd.filter((z) => z.kind === "unknown").map((z) => ({ scope: z.scope, dropped: z.dropped })),
      ).toEqual([{ scope: "message", dropped: false }]);
      expect(zd.some((z) => z.kind === "attack")).toBe(true);
    });
  });

  test("milczący klucz NIE zapala czujki", () => {
    // `skillId` to odpowiedź, nie luka.
    const zd = dekoduj(["1=100.00;2=100.00;tspell=Cios;skillId=70"], SKLAD);
    expect(zd.some((z) => z.kind === "unknown")).toBe(false);
  });

  test("puste segmenty nie są kluczami i nie krzyczą", () => {
    expect(dekoduj(["0;0;;"], SKLAD)).toEqual([]);
  });
});

describe("dekoduj: leczenie bez leczącego zostaje bez leczącego", () => {
  /**
   * Usterka złapana przez porównanie dwóch niezależnych odczytów tej samej
   * walki — pierwszej i jedynej takiej pary (2026‑08‑04). To JEDYNY prawdziwy
   * błąd dekodera, jaki tamto porównanie znalazło, i zarazem powód, dla którego
   * jego zniknięcie jest zapisane jako największa otwarta luka repo.
   * Dekoder wyprowadzał `self` ze strony komunikatu i dawał
   * `true` dla klucza `heal`, którego komunikat ma drugą stronę PUSTĄ — czyli
   * kredytował leczenie postaci, o której log milczy.
   */
  test("`heal` NIE przypisuje leczenia nikomu", () => {
    // `482845=100.00;0;heal=99` — druga strona PUSTA, czyli log nie mówi, kto
    // leczył. Kwota idzie do puli nieprzypisanej; skredytowanie jej nadawcy
    // byłoby zgadnięciem nazwiska, którego log nie podał.
    const [z] = dekoduj(["1=100.00;0;heal=99"], SKLAD);
    expect(z).toMatchObject({ kind: "heal", target: "Kamil", amount: 99, self: false });
  });

  test("`heal_target` nie jest własne — leczony to nie leczący", () => {
    const [z] = dekoduj(["1=100.00;2=80.00;heal_target=4639"], SKLAD);
    expect(z).toMatchObject({ kind: "heal", target: "Locha", self: false });
  });

  /**
   * Druga strona tej samej medalu, dopisana 2026‑08‑05.
   *
   * Nagłówek tego bloku brzmiał „leczenie bez leczącego zostaje bez leczącego"
   * i był prawdziwy dla klucza `heal`, ale rozciągnął się na `heal_target`,
   * gdzie leczący STOI w komunikacie. Renderer podstawia pod `%target%` pole
   * `f2` (`BattleMessages.js:956‑969`), więc pierwszy segment to rzucający —
   * a dekoder go wyrzucał, przez co całe leczenie kierowane szło do puli
   * „bez sprawcy".
   */
  test("`heal_target` NIESIE leczącego — to pierwszy segment komunikatu", () => {
    const [z] = dekoduj(["1=100.00;2=80.00;heal_target=4639"], SKLAD);
    expect(z).toMatchObject({
      kind: "heal",
      target: "Locha",
      healer: "Kamil",
      healerId: 1,
      healerHpPct: 100,
    });
  });

  test("`npc_heal` tak samo — ten sam kształt komunikatu", () => {
    const [z] = dekoduj(["2=90.00;1=30.00;npc_heal=250"], SKLAD);
    expect(z).toMatchObject({ kind: "heal", target: "Kamil", healer: "Locha", healerId: 2 });
  });

  test("leczenie kierowane na SIEBIE zostaje kierowane — gra rozróżnia ten układ", () => {
    // `id1 == id2`. Gra sama go wyodrębnia (`BattleMessages.js:953`:
    // `id1 == id2 ? part_himself : f2.name`), więc nie jest to zdegenerowany
    // przypadek do wyprostowania, tylko normalny szyk. `self` zostaje `false`,
    // bo pochodzi z tabeli ról, a nie z porównania stron — rozstrzyga `healer`.
    const [z] = dekoduj(["1=100.00;1=60.00;heal_target=700"], SKLAD);
    expect(z).toMatchObject({ kind: "heal", target: "Kamil", healer: "Kamil", self: false });
  });

  test("`heal` i proce leczącego NIE dostają — nie ma go w komunikacie", () => {
    // To jest strażnik regresji `d4be27e`: gdyby `healer` zaczął się wypełniać
    // przy `strona: "nadawca"`, leczenie z pustą drugą stroną znów byłoby
    // kredytowane postaci, o której log milczy.
    for (const linia of [
      "1=100.00;0;heal=99",
      "1=100.00;0;afterheal=42",
      "1=50.00;0;legbon_holytouch_heal=120",
    ]) {
      const [z] = dekoduj([linia], SKLAD);
      expect(z).toMatchObject({ kind: "heal" });
      expect(z).not.toHaveProperty("healer");
    }
  });

  test("„Ostatni ratunek” i „Dotyk anioła” ZOSTAJĄ własne", () => {
    // Jedyne dwa przypadki, w których efekt z definicji siada na trafionym —
    // i dokładnie te dwa, które komentarz przy `heal.self` w `types.ts`
    // wymienia z nazwy.
    expect(dekoduj(["1=50.00;0;legbon_lastheal=980,Kamil"], SKLAD)[0]).toMatchObject({
      kind: "heal",
      self: true,
    });
    expect(dekoduj(["1=50.00;0;legbon_holytouch_heal=120"], SKLAD)[0]).toMatchObject({
      kind: "heal",
      self: true,
    });
  });
});

describe("dekoduj: osłabienie DoT-a", () => {
  test("drugi człon wartości to procent osłabienia", () => {
    // `poison=140,14` z pierwszej pary. Słownik gry: „%val0% (osłabione
    // o %val1%%) obrażeń od trucizny." — czyli 14 stoi w komunikacie wprost.
    const [z] = dekoduj(["1=19.27;0;poison=140,14"], SKLAD);
    expect(z).toMatchObject({ kind: "dot", amount: 140, weakenedPct: 14, dotType: "trucizny" });
  });

  test("jeden człon to brak osłabienia, a nie zero", () => {
    // Zero znaczyłoby „osłabione o 0%", czyli że gra to policzyła i wyszło
    // zero. `null` znaczy „gra o tym nie mówi" i te dwa trzeba rozróżniać.
    const [z] = dekoduj(["1=19.27;0;poison=140"], SKLAD);
    expect(z).toMatchObject({ kind: "dot", amount: 140, weakenedPct: null });
  });

  test("kwota zostaje w członie zerowym, mimo dołożenia drugiego", () => {
    const [z] = dekoduj(["1=6.71;0;anguish=3615,20"], SKLAD);
    expect(z).toMatchObject({ kind: "dot", amount: 3615, weakenedPct: 20 });
  });
});
