import { describe, expect, test } from "bun:test";
import {
  czlony,
  dekoduj,
  liczba,
  rola,
  rolaDomyslna,
  rozbierz,
  TABELE_KLUCZY,
  znaneKlucze,
} from "../src/protokol.ts";
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
    expect(zd.some((z) => z.kind === "unknown")).toBe(true);
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
    expect(zd).toEqual([{ kind: "unknown", line: "heal_target=-50", lineNo: 0 }]);
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

  test("rozstrzygnięcie walki, z drużyną i bez", () => {
    const [a] = dekoduj(["0;0;winner=Kamil, Locha"], SKLAD);
    expect(a).toMatchObject({ kind: "fight-end", outcome: "victory", actors: ["Kamil", "Locha"] });
    const [b] = dekoduj(["0;0;loser=Kamil"], SKLAD);
    expect(b).toMatchObject({ kind: "fight-end", outcome: "defeat" });
  });

  test("`winner=?` to remis, a nie zwycięstwo postaci o nazwie „?”", () => {
    // Gra idzie wtedy gałęzią `battle_no_winner` i nazwiska nie wypisuje.
    const [z] = dekoduj(["0;0;winner=?"], SKLAD);
    expect(z).toMatchObject({ kind: "fight-end", outcome: "draw", actors: [] });
  });

  test("`txt` oddaje tekst serwera bez tłumaczenia", () => {
    const [z] = dekoduj(["0;0;txt=Rozpoczęła się walka pomiędzy"], SKLAD);
    expect(z).toEqual({ kind: "info", line: "Rozpoczęła się walka pomiędzy" });
  });
});

describe("dekoduj: nieznane jest głośne", () => {
  test("nierozpoznany klucz daje `unknown` z CAŁYM segmentem, nie z samym kluczem", () => {
    const zd = dekoduj(["1=100.00;2=90.00;+dmg=10;-dmg=10;czegoNieZnamy=7"], SKLAD);
    expect(zd).toContainEqual({ kind: "unknown", line: "czegoNieZnamy=7", lineNo: 0 });
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
    expect(zd).toEqual([{ kind: "unknown", line: "999=100.00;2=90.00;+dmg=10;-dmg=10", lineNo: 0 }]);
  });

  test("obcięcie na drugim `=` zapala czujkę", () => {
    const zd = dekoduj(["1=100.00;2=90.00;klucz=a=b"], SKLAD);
    expect(zd.some((z) => z.kind === "unknown")).toBe(true);
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
