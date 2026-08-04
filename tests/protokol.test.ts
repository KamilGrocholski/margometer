import { describe, expect, test } from "bun:test";
import {
  czlony,
  dekoduj,
  liczba,
  rola,
  rolaDomyslna,
  rozbierz,
  znaneKlucze,
} from "../src/protokol.ts";
import type { RosterEntry } from "../src/roster.ts";

/**
 * Rozbiór komunikatu protokołu.
 *
 * SKĄD BIORĄ SIĘ WEJŚCIA. Dwa źródła, oba prawdziwe, i to jest tu ważne:
 *
 * - **kształty z prawdziwych walk**, przepisane do treści testów. ⚠️ Brały się
 *   z korpusu protokołu z grooove.pl (przekodowanego przez cudzy serwis:
 *   kropka zamiast `=`); korpus zszedł z drzewa 2026‑08‑04, a kształty zostały
 *   w komentarzach przy asercjach;
 * - **źródło renderera gry** — przypadki brzegowe, których w korpusie nie ma,
 *   ale które `battleMsg` obsługuje jawnie i dlatego wiadomo, że istnieją.
 *
 * Czego te testy NIE dowodzą: że gra wysyła dokładnie takie komunikaty. Tego
 * nie dowiedzie nic aż do zrzutu z gry — repo nie ma dziś ani jednej walki
 * zapisanej protokołem. Jedyna, jaką repo ma, leży w `tests/walka-z-gry.ts`
 * i czytają ją testy archiwum oraz `index`. Tutaj sprawdzamy, że rozbiór
 * odwzorowuje `battleMsg` znak w znak, a nie że wejście jest autentyczne.
 */

describe("rozbierz: strony", () => {
  test("obie strony z życiem", () => {
    const k = rozbierz("1=100.00;2=40.37;+dmgd=455");
    expect(k.nadawca).toEqual({ id: 1, hpp: 100 });
    expect(k.cel).toEqual({ id: 2, hpp: 40.37 });
  });

  test("brak celu to null, a nie wojownik o id 0", () => {
    // Kształt tyknięcia DoT-a z korpusu: `119444.6.71;0;anguish.3615`.
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
    // `0;0;txt=…` i `0;0;winner.…` z korpusu: linia otwierająca i rozstrzygnięcie.
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
    // Zero to poprawna wartość życia — postać martwa (`439082.0.00` w korpusie).
    // Zlanie „nie umiem odczytać" z „zero procent" ogłaszałoby zgony.
    expect(rozbierz("1=nic;0;heal=5").nadawca).toEqual({ id: 1, hpp: null });
    expect(rozbierz("1=0.00;0;heal=5").nadawca).toEqual({ id: 1, hpp: 0 });
  });
});

describe("rozbierz: parametry", () => {
  test("klucz z wartością i flaga bez wartości stoją obok siebie", () => {
    // `+pierce` i `r` z korpusu to flagi — segment bez znaku równości.
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
    // Prawdziwy kształt z korpusu: `p_.Wyzywający okrzyk;skillId.188;n.Toffi-Pawełek`.
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
    // `heal=1356,-15` z korpusu (`l.1356,-15`) — gra robi m[1].split(',')
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
    // Ujemne są realne: `l.-58` z korpusu to utrata życia, nie leczenie.
    expect(liczba("455")).toBe(455);
    expect(liczba("-58")).toBe(-58);
  });

  test("zero jest liczbą, a nie brakiem", () => {
    // `-D.0` pada w korpusie i znaczy „obrażenia zredukowane do zera".
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
 * oszacować. Korpus tekstowy ma zero linii `unknown` i — jak mówi
 * `docs/ROADMAP.md` — „sam z siebie nie mówi nic o tym, czego parser NIE
 * rozpoznaje". Zbiór kluczy protokołu jest za to skończony i policzalny, więc
 * pytanie „czy czegoś nam brakuje" ma tutaj odpowiedź.
 *
 * Test jest DWUSTRONNY i to nie jest nadmiarowość. Jedna strona łapie klucz
 * gry, o którym nie wiemy (cicho niepoliczone obrażenia); druga — nasz wpis
 * o kluczu, którego gra nie ma (tabela, która zwietrzała po aktualizacji
 * klienta). To dwa różne błędy i jednostronny test przepuściłby drugi.
 */
/**
 * ⚠️ **ZNIKŁ STĄD BLOK „pokrycie tabeli kluczy" — 3 testy, 2026‑08‑04, razem
 * z zamrożoną tabelą kluczy.**
 *
 * Tamta tabela to były 233 klucze wyłuskane z assetu gry przez
 * `bun tools/slownik.ts`, a test był **DWUSTRONNY** i nie była to nadmiarowość:
 *
 * - „każdy klucz z zamrożonej listy ma rolę" łapało klucz GRY, o którym nie
 *   wiemy — czyli obrażenia liczone po cichu jako zero;
 * - „każdy klucz naszej tabeli stoi na liście" łapało nasz wpis o kluczu,
 *   którego gra NIE MA — czyli tabelę zwietrzałą po aktualizacji klienta.
 *
 * To są dwa różne błędy i jednostronny test przepuściłby drugi. Dziś nie
 * sprawdza ich żaden: `znaneKlucze()` nie ma z czym się porównać.
 *
 * `bun tools/slownik.ts` dalej czyta asset gry i wypisuje tę tabelę — brakuje
 * wyłącznie miejsca, w którym wynik miałby osiąść.
 */

describe("rolaDomyslna: gałąź `default` renderera", () => {
  test("zadane i przyjęte rozróżnia ZNAK, tak jak gra", () => {
    // :1102-1117 — `m[0].substr(1,3) === 'dmg'`, potem `charAt(0)`.
    expect(rolaDomyslna("+dmgd")).toEqual({ typ: "cios", kod: "d" });
    expect(rolaDomyslna("-dmgd")).toEqual({ typ: "przyjete", kod: "d" });
  });

  test("`+dmg` bez litery daje kod `p`, jak po stronie tekstu", () => {
    // src/source.ts:80 robi `damage[1] || "p"`. Obie drogi mają dać tę samą
    // etykietę żywiołu, inaczej czujka krzyczałaby na własnym nazewnictwie.
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
    expect(rola("heal")).toEqual({ typ: "leczenie", strona: "nadawca", wlasne: false });
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
      procs: ["+pierce"],
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

  // ⚠️ **STAŁ TU TEST „ta sama liczba, co po stronie tekstu — miniatura
  // orakulum" i zszedł 2026‑08‑04.** Brał ten sam komunikat, wyciągał z niego
  // 455 i pokazywał, że zgadza się z 455, które `parse` wyczytało z renderu tej
  // samej akcji (`tests/walka.test.ts`). Cała jego wartość siedziała w tamtej
  // DRUGIEJ stronie porównania; bez niej został sprawdzian, że z `+dmgd=455`
  // wychodzi 455 — czyli dokładnie to, co asercja wyżej robi na tym samym
  // komunikacie. Test, który powtarza sąsiada, kosztuje uwagę i nic nie chroni.
  //
  // Nie jest to sprzątanie: **tu naprawdę ubyło pokrycie**, tylko nie w tym
  // pliku. Ubyło go w chwili, w której zniknął parser, a ten test przez jedną
  // rundę udawał, że nie.

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
    expect(z).toMatchObject({ kind: "attack", procs: ["+thirdatt"] });
    expect((z as { hits: { element: string }[] }).hits[0]!.element).toBe("trzeci cios");
  });

  test("nierówna liczba zadanych i przyjętych — nic nie ginie, ale się zapala", () => {
    // Kształt z korpusu: jedna liczba zadana, dwie przyjęte.
    const zd = dekoduj(["1=100.00;2=61.72;+dmgd=897;-dmgd=184;-dmga=135"], SKLAD);
    const cios = zd.find((z) => z.kind === "attack") as { hits: { raw: number; applied: number }[] };
    expect(cios.hits.map((h) => h.applied)).toEqual([184, 135]);
    expect(cios.hits.map((h) => h.raw)).toEqual([897, 0]);
    // Suma przyjętych zostaje prawdziwa, a rozjazd długości jest zgłoszony.
    expect(zd.some((z) => z.kind === "unknown")).toBe(true);
  });
});

describe("dekoduj: leczenie i obrażenia bez sprawcy", () => {
  test("`heal` leczy NADAWCĘ, ale NIE jest oznaczone jako własne", () => {
    // ⚠️ Ten test twierdził do 2026‑08‑04 `self: true` i był NAPISANY POD BŁĄD:
    // powstał razem z dekoderem, z tego samego założenia, które orakulum potem
    // obaliło. Zielony test nie jest dowodem, gdy autor testu i autor kodu
    // wierzą w to samo — dopiero druga, niezależna droga to rozstrzygnęła.
    const [z] = dekoduj(["1=99.04;0;heal=1356"], SKLAD);
    expect(z).toMatchObject({ kind: "heal", target: "Kamil", amount: 1356, self: false });
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
    expect(zd[0]).toEqual({ kind: "ability", actor: "Kamil", name: "Porażenie" });
    expect(zd[1]).toMatchObject({ kind: "attack", ability: "Porażenie" });
    expect(zd[2]).toMatchObject({ kind: "attack", ability: null });
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
   * Usterka złapana przez orakulum na PIERWSZEJ parze tekst↔protokół
   * (2026‑08‑04). Dekoder wyprowadzał `self` ze strony komunikatu i dawał
   * `true` dla klucza `heal`, którego komunikat ma drugą stronę PUSTĄ — czyli
   * kredytował leczenie postaci, o której log milczy.
   */
  test("`heal` NIE przypisuje leczenia nikomu", () => {
    // `482845=100.00;0;heal=99` — druga strona pusta. Parser tekstu na tej
    // samej akcji („Przywrócono 99 punktów życia X") daje self: false, więc
    // kwota idzie do puli nieprzypisanej. Protokół ma robić to samo.
    const [z] = dekoduj(["1=100.00;0;heal=99"], SKLAD);
    expect(z).toMatchObject({ kind: "heal", target: "Kamil", amount: 99, self: false });
  });

  test("`heal_target` też nie — leczył ktoś inny, tylko log go nie nazywa", () => {
    const [z] = dekoduj(["1=100.00;2=80.00;heal_target=4639"], SKLAD);
    expect(z).toMatchObject({ kind: "heal", target: "Locha", self: false });
  });

  test("„Ostatni ratunek” i „Dotyk anioła” ZOSTAJĄ własne", () => {
    // Jedyne dwa przypadki, w których efekt z definicji siada na trafionym —
    // i dokładnie te dwa, które `types.ts:117‑128` wymienia z nazwy.
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
    // o %val1%%) obrażeń od trucizny." — parser tekstu czyta 14 od dawna.
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
