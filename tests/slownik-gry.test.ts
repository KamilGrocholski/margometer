import { describe, expect, test } from "bun:test";
import { BEZ_SLOWNIKA, SlownikGry, SlownikStaly, type TranslationGlobals } from "../src/slownik-gry.ts";
import { dekoduj, rola, znaneKlucze } from "../src/protokol.ts";
import type { RosterEntry } from "../src/roster.ts";
import { slownikZeZamrozenia } from "../tools/slownik.ts";
import { ZAMROZENIE } from "./klucze-protokolu.ts";

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
 * Słownik złożony z tabeli zamrożonej z assetu gry — 233 klucze,
 * `bun tools/slownik.ts --zamroz`.
 *
 * Testy niżej sprawdzają MECHANIZM podstawiania, ale robią to na prawdziwych
 * brzmieniach, a nie na garści wpisów przepisanych ręcznie. Różnica jest realna:
 * ręczna kopia zgadza się z grą z definicji, bo obie strony pisze ta sama osoba.
 */
const zeZamrozenia = () => slownikZeZamrozenia(ZAMROZENIE);

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
    // Znak wiodący spada — inaczej ten sam efekt stałby w panelu jako dwie
    // różne pozycje, „Przebicie" i „+Przebicie".
    expect((z as { procs: string[] }).procs).toEqual(["Przebicie"]);
  });

  test("proc z wartością dostaje ją podstawioną", () => {
    // `+acdmg=5` → „+Niszczenie pancerza o %val%" → „+Niszczenie pancerza o 5".
    // Ten sam kształt niesie prawdziwa walka w `tests/walka-z-gry.ts`.
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
    // Kryt wchodzi do `Hit.crit`, a nie na listę efektów — i rozstrzyga o tym
    // KLUCZ, nie brzmienie zdania.
    const [z] = dekoduj(["1=100.00;2=90.00;+dmgd=10;+crit;-dmgd=10"], SKLAD, zeZamrozenia());
    expect((z as { procs: string[] }).procs).toEqual([]);
    expect((z as { hits: { crit: boolean }[] }).hits[0]!.crit).toBe(true);
  });
});

/**
 * **NAJWAŻNIEJSZY TEST TEGO PLIKU.**
 *
 * Identyfikatory `_t` są zaszyte w `src/protokol.ts`, bo dodatek nie ma jak
 * wylistować słownika gry (`const _dict` jest w produkcji domknięty w module).
 * Zaszyta kopia, która rozjedzie się z grą, daje w panelu KLUCZ zamiast zdania
 * — i robi to **po cichu**, bo `zdanie()` na nieznanym identyfikatorze zwraca
 * `null`, a nie błąd. Nic w dodatku tego nie zauważy; zauważy to gracz.
 *
 * ⚠️ **BLOK STAŁ PUSTY MIĘDZY 2026‑08‑04 A DZIŚ**, bo świadek — zamrożona
 * tabela z assetu gry — leżał jako plik danych obok testów i zszedł z drzewa
 * razem z całym tamtym katalogiem, zabierając ze sobą oba te testy. Dziś jest
 * z powrotem, jako moduł (`tests/klucze-protokolu.ts`), i odtwarza go
 * `bun tools/slownik.ts --zamroz`.
 *
 * Czego ten blok NIE dowodzi: że zdanie brzmi dobrze po polsku ani że gra
 * wypisze je w tej walce. Dowodzi jednego — że pytamy o identyfikator, który
 * gra zna.
 */
describe("zaszyte identyfikatory kontra asset gry", () => {
  const slownik = slownikZeZamrozenia(ZAMROZENIE);

  test("każdy identyfikator z tabeli ról ma zdanie w słowniku gry", () => {
    // Strona pierwsza: nasza kopia nie zwietrzała po aktualizacji klienta.
    const bezZdania = znaneKlucze()
      .map((klucz) => ({ klucz, rola: rola(klucz) }))
      .filter((w) => w.rola !== null && "id" in w.rola)
      .map((w) => ({ klucz: w.klucz, id: (w.rola as { id: string }).id }))
      .filter((w) => slownik.zdanie(w.id) === null);

    // Lista, nie liczba: przy rozjeździe ma być widać KTÓRY klucz, bo poprawka
    // idzie do konkretnego wpisu w `ROLE`/`PROCE`.
    expect(bezZdania).toEqual([]);
  });

  test("proc z prawdziwym brzmieniem gry dociera do panelu złożony", () => {
    // Druga strona tej samej rzeczy: nie „czy identyfikator istnieje", tylko
    // czy zdanie spod niego przechodzi całą drogę do `procs`. Wejście jest
    // prawdziwym komunikatem z `tests/walka-z-gry.ts`.
    const [z] = dekoduj(["1=100.00;2=70.07;+dmgd=466;+acdmg=5;-dmgd=223"], SKLAD, slownik);
    expect((z as { procs: string[] }).procs).toEqual(["Niszczenie pancerza o 5"]);
  });
});
