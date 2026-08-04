import { describe, expect, test } from "bun:test";
import { rozjazdy, walkaZakonczona } from "../src/rozjazd.ts";
import { Session } from "../src/session.ts";
import { parse } from "../src/parser.ts";
import { dekoduj } from "../src/protokol.ts";
import type { BattleStats } from "../src/stats.ts";
import type { RosterEntry } from "../src/roster.ts";

/**
 * Czujka rozjazdu.
 *
 * ⚠️ **CZEGO TE TESTY NIE DOWODZĄ: że czujka nie hałasuje.** Test „czy potrafi
 * paść" jest tu trywialny — podaj dwie różne liczby i alarm się zapali. Test
 * „czy nie krzyczy bez powodu" wymaga żywej walki i nie da się go tu napisać;
 * mówimy to wprost, zamiast chować pod pokryciem jednostkowym. To jest
 * największe otwarte ryzyko tej rundy.
 */

const statystyki = (
  aktorzy: Array<{
    name: string;
    damageDealt?: number;
    damageTaken?: number;
    healingDone?: number;
  }>,
): BattleStats =>
  ({
    actors: aktorzy.map((a) => ({
      name: a.name,
      damageDealt: a.damageDealt ?? 0,
      damageTaken: a.damageTaken ?? 0,
      healingDone: a.healingDone ?? 0,
      healingReceived: 0,
    })),
  }) as unknown as BattleStats;

describe("rozjazdy", () => {
  test("zgodne odczyty nie dają ani jednego wpisu", () => {
    const a = statystyki([{ name: "Kamil", damageDealt: 1000 }]);
    const b = statystyki([{ name: "Kamil", damageDealt: 1000 }]);
    expect(rozjazdy(a, b)).toEqual([]);
  });

  test("różnica w skalarze jest zgłoszona z obiema liczbami", () => {
    // Obie liczby muszą być w wyniku, bo bez nich zgłoszenie jest bezużyteczne:
    // czytający nie wie, czy panel zaniża, czy zawyża.
    const wynik = rozjazdy(
      statystyki([{ name: "Kamil", damageDealt: 1000 }]),
      statystyki([{ name: "Kamil", damageDealt: 1200 }]),
    );
    expect(wynik).toEqual([
      { etykieta: "Kamil", pole: "obrażenia zadane", zTekstu: 1000, zProtokolu: 1200 },
    ]);
  });

  test("nazwa pola jest po ludzku, bo idzie do panelu", () => {
    const wynik = rozjazdy(
      statystyki([{ name: "Kamil", damageTaken: 5 }]),
      statystyki([{ name: "Kamil", damageTaken: 6 }]),
    );
    expect(wynik[0]!.pole).toBe("obrażenia otrzymane");
  });

  test("postać znana tylko jednej stronie jest POMIJANA", () => {
    // To inny problem niż zła liczba — najczęściej różnica w numeracji
    // instancji. Wrzucenie jej tutaj zalałoby czujkę szumem.
    const wynik = rozjazdy(
      statystyki([{ name: "Kamil", damageDealt: 10 }, { name: "Locha #1", damageDealt: 10 }]),
      statystyki([{ name: "Kamil", damageDealt: 10 }, { name: "Locha #2", damageDealt: 99 }]),
    );
    expect(wynik).toEqual([]);
  });

  test("kilka pól tej samej postaci daje kilka wpisów", () => {
    const wynik = rozjazdy(
      statystyki([{ name: "Kamil", damageDealt: 1, damageTaken: 1 }]),
      statystyki([{ name: "Kamil", damageDealt: 2, damageTaken: 2 }]),
    );
    expect(wynik).toHaveLength(2);
  });

  test("różnica o JEDEN też się liczy — progu tolerancji nie ma", () => {
    // Świadome źródło fałszywych alarmów: próg dobrany „na oko" ukrywałby
    // dokładnie te małe rozjazdy, których szukamy. Ustali go pierwsza walka
    // zapisana obiema drogami.
    const wynik = rozjazdy(
      statystyki([{ name: "Kamil", healingDone: 100 }]),
      statystyki([{ name: "Kamil", healingDone: 101 }]),
    );
    expect(wynik).toHaveLength(1);
  });
});

describe("walkaZakonczona", () => {
  test("rozstrzygnięcie kończy walkę", () => {
    expect(
      walkaZakonczona([{ kind: "fight-end", outcome: "victory", actors: [], result: "" }]),
    ).toBe(true);
  });

  test("sam cios jeszcze nie", () => {
    expect(walkaZakonczona([{ kind: "info", line: "cokolwiek" }])).toBe(false);
    expect(walkaZakonczona([])).toBe(false);
  });
});

describe("obie drogi na tej samej walce", () => {
  /**
   * Najbliższa rzecz orakulum, jaką da się dziś napisać: ta sama akcja podana
   * raz jako tekst z okna walki, raz jako komunikat protokołu. Liczby mają
   * wyjść identyczne — i to jest cały pomysł na czujkę w miniaturze.
   *
   * ⚠️ Komunikat protokołu jest tu REKONSTRUKCJĄ, nie zrzutem z gry. Że gra
   * wysyła dokładnie takie komunikaty, nie dowodzi to nic.
   */
  const SKLAD: RosterEntry[] = [
    { id: 1, name: "Kamil", side: 0 },
    { id: 2, name: "Locha", side: 1 },
  ];

  test("zadane obrażenia zgadzają się co do liczby", () => {
    const tekst = [
      "Rozpoczęła się walka pomiędzy Kamil(100lvl m) a Locha(50lvl w).",
      "Kamil(100%) uderzył z siłą 455",
      "Locha(40.37%) otrzymał 455 obrażeń",
    ].join("\n");

    const zTekstu = new Session();
    zTekstu.update(tekst);

    const zProtokolu = new Session();
    zProtokolu.updateEvents(dekoduj(["1=100.00;2=40.37;+dmgd=455;-dmgd=455"], SKLAD), SKLAD);

    const kamilTekst = zTekstu.current().actors.find((a) => a.name === "Kamil");
    const kamilProtokol = zProtokolu.current().actors.find((a) => a.name === "Kamil");
    expect(kamilTekst?.damageDealt).toBe(455);
    expect(kamilProtokol?.damageDealt).toBe(455);
    expect(rozjazdy(zTekstu.current(), zProtokolu.current())).toEqual([]);
  });

  test("podmieniona liczba w protokole ZAPALA czujkę", () => {
    // Dowód, że poprzedni test nie jest zielony z powodu pustych danych.
    const tekst = [
      "Rozpoczęła się walka pomiędzy Kamil(100lvl m) a Locha(50lvl w).",
      "Kamil(100%) uderzył z siłą 455",
      "Locha(40.37%) otrzymał 455 obrażeń",
    ].join("\n");
    const zTekstu = new Session();
    zTekstu.update(tekst);
    const zProtokolu = new Session();
    zProtokolu.updateEvents(dekoduj(["1=100.00;2=40.37;+dmgd=999;-dmgd=999"], SKLAD), SKLAD);

    const wynik = rozjazdy(zTekstu.current(), zProtokolu.current());
    expect(wynik.length).toBeGreaterThan(0);
    expect(wynik[0]).toMatchObject({ etykieta: "Kamil", zTekstu: 455, zProtokolu: 999 });
  });

  test("parse i dekoduj nie dzielą kodu — to warunek sensowności porównania", () => {
    // Gdyby obie drogi wołały tę samą funkcję, zgodność wyżej nie znaczyłaby
    // nic. `parse` czyta tekst, `dekoduj` czyta komunikaty i nie mają wspólnego
    // czytelnika liczb — ten test pilnuje, że oba w ogóle produkują zdarzenia
    // z NIEZALEŻNYCH wejść.
    const zTekstu = parse("Kamil(100%) uderzył z siłą 455\nLocha(40.37%) otrzymał 455 obrażeń");
    const zProtokolu = dekoduj(["1=100.00;2=40.37;+dmgd=455;-dmgd=455"], SKLAD);
    expect(zTekstu.filter((z) => z.kind === "attack")).toHaveLength(1);
    expect(zProtokolu.filter((z) => z.kind === "attack")).toHaveLength(1);
  });
});
