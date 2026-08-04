import { describe, expect, test } from "bun:test";
import { BEZ_SLOWNIKA, SlownikGry, SlownikStaly, type TranslationGlobals } from "../src/slownik-gry.ts";
import { dekoduj, rola } from "../src/protokol.ts";
import type { RosterEntry } from "../src/roster.ts";
import type { Zamrozenie } from "../tools/slownik.ts";

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

const ZAMROZONE = (await Bun.file(
  new URL("./fixtures/klucze-protokolu.json", import.meta.url).pathname,
).json()) as Zamrozenie;

/** Słownik zbudowany z zamrożonej tabeli — dokładnie tak, jak zrobi to archiwum. */
const zeZamrozenia = () =>
  new SlownikStaly(
    ZAMROZONE.klucze
      .filter((w): w is typeof w & { id: string; zdanie: string } => w.id !== null && w.zdanie !== null)
      .map((w) => [w.id, w.zdanie] as const),
  );

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

describe("zaszyte identyfikatory nie mogą się rozjechać z zamrożoną tabelą", () => {
  /**
   * NAJWAŻNIEJSZY TEST TEGO PLIKU. Identyfikatory są zaszyte w `src/protokol.ts`,
   * bo dodatek nie ma jak wylistować słownika gry. Zaszyta kopia, która
   * rozjedzie się z tabelą, daje w panelu klucz zamiast zdania — po cichu,
   * bo `zdanie()` na nieznanym identyfikatorze zwraca `null`, a nie błąd.
   */
  test("każdy identyfikator z tabeli ról stoi w zamrożonym słowniku", () => {
    const znane = new Map(ZAMROZONE.klucze.map((w) => [w.klucz, w.id]));
    const rozjazdy: string[] = [];
    for (const [klucz, id] of znane) {
      const r = rola(klucz);
      if (r === null) continue;
      const nasz = "id" in r ? r.id : null;
      if (nasz !== null && nasz !== id) rozjazdy.push(`${klucz}: ${nasz} ≠ ${id}`);
    }
    expect(rozjazdy).toEqual([]);
  });

  test("każdy klucz ze zdaniem, który jest procem, MA u nas identyfikator", () => {
    // Inaczej panel pokazałby klucz, mimo że gra ma dla niego zdanie.
    const bezId: string[] = [];
    for (const w of ZAMROZONE.klucze) {
      const r = rola(w.klucz);
      if (r?.typ !== "proc") continue;
      if (w.zdanie !== null && !("id" in r && r.id)) bezId.push(w.klucz);
    }
    expect(bezId).toEqual([]);
  });
});
