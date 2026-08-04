import { describe, expect, test } from "bun:test";
import { BEZ_SLOWNIKA, SlownikGry, SlownikStaly, type TranslationGlobals } from "../src/slownik-gry.ts";
import { dekoduj } from "../src/protokol.ts";
import type { RosterEntry } from "../src/roster.ts";

/**
 * Brzmienia z gry, nie z naszego kodu.
 *
 * CZEGO TE TESTY PILNUJĄ. Nie tego, jak brzmi polskie zdanie — to należy do gry
 * i zmienia się poza nami. Tego, że **nie zaszywamy brzmień**, że pytamy
 * wyłącznie o identyfikatory, które znamy, i że brak słownika zostawia klucz,
 * a nie zmyśloną etykietę.
 */

const SKLAD: RosterEntry[] = [
  { id: 1, name: "Kamil", side: 0 },
  { id: 2, name: "Locha", side: 1 },
];

/**
 * Kilka wpisów słownika, przepisanych z assetu gry.
 *
 * ⚠️ **Stała tu ZAMROŻONA TABELA** — `tests/fixtures/klucze-protokolu.json`,
 * 233 klucze wyłuskane z assetu przez `bun tools/slownik.ts`. Katalog
 * `tests/fixtures/` zszedł z drzewa 2026‑08‑04, a razem z nim **dwa testy,
 * które pilnowały, że zaszyte u nas identyfikatory zgadzają się z grą** —
 * opisane niżej. Zostaje garść wpisów wystarczająca do sprawdzenia
 * MECHANIZMU podstawiania; zgodności z grą już nikt nie sprawdza.
 */
const zeZamrozenia = () =>
  new SlownikStaly([
    ["msg_+pierce", "+Przebicie"],
    ["msg_+acdmg %val%", "+Niszczenie pancerza o %val%"],
    ["msg_+crit", "+Cios krytyczny"],
  ]);

describe("SlownikGry — odczyt window._t", () => {
  test("oddaje zdanie, które zwróciła gra", () => {
    const window: TranslationGlobals = { _t: (id) => (id === "msg_+pierce" ? "+Przebicie" : undefined) };
    expect(new SlownikGry(window).zdanie("msg_+pierce")).toBe("+Przebicie");
  });

  test("przekazuje parametry do gry, zamiast podstawiać po swojemu", () => {
    // Podstawienie ma robić gra — jej `getTranslationsWithParameters` zna
    // przypadki, których my nie znamy (odmiana, `<span class=damage>`).
    const widziane: unknown[] = [];
    const window: TranslationGlobals = {
      _t: (id, params) => {
        widziane.push([id, params]);
        return "+Niszczenie pancerza o 5";
      },
    };
    new SlownikGry(window).zdanie("msg_+acdmg %val%", { "%val%": "5" });
    expect(widziane).toEqual([["msg_+acdmg %val%", { "%val%": "5" }]]);
  });

  test("brak `_t` na stronie daje null, a nie wyjątek", () => {
    // Panel powstaje też poza walką i poza grą (podgląd, archiwum).
    expect(new SlownikGry({}).zdanie("msg_+pierce")).toBeNull();
  });

  test("`_t` rzucające wyjątkiem jest przełknięte", () => {
    // Ta sama osłona co w `roster.ts`: dostęp do wnętrzności gry potrafi rzucić
    // przy zmianie kontekstu strony.
    const window: TranslationGlobals = {
      _t: () => {
        throw new Error("kontekst zniknął");
      },
    };
    expect(new SlownikGry(window).zdanie("msg_+pierce")).toBeNull();
  });

  test("nieznany identyfikator daje null — gra zwraca wtedy undefined", () => {
    expect(new SlownikGry({ _t: () => undefined }).zdanie("czegoś takiego nie ma")).toBeNull();
  });

  test("pusty ciąg traktujemy jak brak", () => {
    // Pusta etykieta w panelu jest bezużyteczna; klucz mówi więcej.
    expect(new SlownikGry({ _t: () => "" }).zdanie("msg_x")).toBeNull();
  });
});

describe("SlownikStaly — ta sama rola poza grą", () => {
  test("oddaje szablon z tabeli", () => {
    const s = new SlownikStaly([["msg_+pierce", "+Przebicie"]]);
    expect(s.zdanie("msg_+pierce")).toBe("+Przebicie");
  });

  test("podstawia parametry dosłownie, bez wyrażeń regularnych", () => {
    // Nicki w tej grze potrafią zawierać nawiasy i kropki. Podstawienie przez
    // `RegExp` wywróciłoby się na nazwie w rodzaju `Dark Laser(92.90%)`.
    const s = new SlownikStaly([["msg_x %name%", "Ktoś: %name%"]]);
    expect(s.zdanie("msg_x %name%", { "%name%": "Dark Laser(92.90%)" })).toBe(
      "Ktoś: Dark Laser(92.90%)",
    );
  });

  test("nieznany identyfikator daje null", () => {
    expect(new SlownikStaly([]).zdanie("msg_czegoś")).toBeNull();
  });
});

describe("etykiety proców w dekoderze", () => {
  test("ze słownikiem gry proc dostaje ZDANIE, nie klucz", () => {
    const [z] = dekoduj(
      ["1=100.00;2=90.00;+dmgd=10;+pierce;-dmgd=10"],
      SKLAD,
      zeZamrozenia(),
    );
    // Znak wiodący spada — tak samo jak zdejmuje go `RE_MODIFIER` po stronie
    // tekstu. Inaczej ten sam efekt stałby w panelu jako dwie pozycje.
    expect((z as { procs: string[] }).procs).toEqual(["Przebicie"]);
  });

  test("proc z wartością dostaje ją podstawioną", () => {
    // `+acdmg=5` → „+Niszczenie pancerza o %val%" → „+Niszczenie pancerza o 5".
    // Ta sama linia stoi w raw.txt pierwszej pary tekst↔protokół.
    const [z] = dekoduj(
      ["1=100.00;2=90.00;+dmgd=466;+acdmg=5;-dmgd=223"],
      SKLAD,
      zeZamrozenia(),
    );
    expect((z as { procs: string[] }).procs).toEqual(["Niszczenie pancerza o 5"]);
  });

  test("BEZ słownika zostaje KLUCZ, a nie zmyślona etykieta", () => {
    // Klucz jest prawdą. Brzmienie wymyślone przez nas nie byłoby — i to jest
    // ta sama reguła, co „nie udawaj danych, których log nie ma".
    const [z] = dekoduj(["1=100.00;2=90.00;+dmgd=10;+pierce;-dmgd=10"], SKLAD, BEZ_SLOWNIKA);
    expect((z as { procs: string[] }).procs).toEqual(["+pierce"]);
  });

  test("klucz, którego gra nie zna, też zostaje kluczem", () => {
    // `+crit` nie nadaje się na ten test, bo od 2026‑08‑04 nie jest procem
    // tylko krytem — bierzemy inny proc bez zdania w słowniku.
    const pusty = new SlownikStaly([]);
    const [z] = dekoduj(["1=100.00;2=90.00;+dmgd=10;+pierce;-dmgd=10"], SKLAD, pusty);
    expect((z as { procs: string[] }).procs).toEqual(["+pierce"]);
  });

  test("kryt NIE jest procem — protokół ma na niego własny klucz", () => {
    // Ścieżka tekstowa konsumuje „+Cios krytyczny" do `Hit.crit` zamiast
    // wypisywać go jako efekt; protokół robi to samo, tyle że po kluczu.
    const [z] = dekoduj(["1=100.00;2=90.00;+dmgd=10;+crit;-dmgd=10"], SKLAD, zeZamrozenia());
    expect((z as { procs: string[] }).procs).toEqual([]);
    expect((z as { hits: { crit: boolean }[] }).hits[0]!.crit).toBe(true);
  });
});

/**
 * ⚠️ **ZNIKŁ STĄD BLOK „zaszyte identyfikatory nie mogą się rozjechać
 * z zamrożoną tabelą" — 2 testy, 2026‑08‑04, razem z `tests/fixtures/`.**
 *
 * Nagłówek tamtego bloku brzmiał **„NAJWAŻNIEJSZY TEST TEGO PLIKU"** i nie było
 * to przesadą. Identyfikatory `_t` są zaszyte w `src/protokol.ts`, bo dodatek
 * nie ma jak wylistować słownika gry (`const _dict` jest domknięty w module).
 * Zaszyta kopia, która rozjedzie się z grą, daje w panelu KLUCZ zamiast zdania
 * — i robi to **po cichu**, bo `zdanie()` na nieznanym identyfikatorze zwraca
 * `null`, a nie błąd.
 *
 * Dwie strony, które przestały być sprawdzane:
 * - każdy identyfikator z naszej tabeli ról stoi w słowniku gry pod tym samym
 *   kluczem (nasza kopia nie zwietrzała po aktualizacji klienta);
 * - każdy klucz, dla którego gra MA zdanie i który jest u nas procem, ma
 *   u nas identyfikator (nie pokazujemy klucza tam, gdzie gra ma brzmienie).
 *
 * Odtworzyć to da się jedną komendą — `bun tools/slownik.ts` czyta asset gry
 * i wypisuje tabelę. Brakuje wyłącznie miejsca, w którym wynik miałby osiąść.
 */
