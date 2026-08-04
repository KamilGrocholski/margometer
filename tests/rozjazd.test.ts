import { describe, expect, test } from "bun:test";
import { pustyOdczyt, walkaZakonczona } from "../src/rozjazd.ts";
import { aggregate } from "../src/stats.ts";
import { dekoduj } from "../src/protokol.ts";
import type { RosterEntry } from "../src/roster.ts";
import { cios, otwarcie, trafienie } from "./zdarzenia.ts";

/**
 * Stan odczytu — dwa pytania, które zostały po czujce rozjazdu.
 *
 * ⚠️ **CZUJKA ZESZŁA Z DRZEWA 2026‑08‑04.** Porównywała odczyt z tekstu
 * z odczytem z protokołu i miała zapalać ostrzeżenie, gdy podadzą inne liczby.
 * Razem z parserem tekstu zniknęła druga strona porównania, więc zniknęła i ona
 * — a razem z nią 9 testów, które opisywały jej zachowanie.
 *
 * Warto zapisać, CZEGO tamte testy i tak nie dowodziły: że czujka nie hałasuje.
 * „Czy potrafi paść" było trywialne (podaj dwie różne liczby), a „czy nie
 * krzyczy bez powodu" wymagało żywej walki i nigdy nie zostało pokryte.
 */

const SKLAD: RosterEntry[] = [
  { id: 1, name: "Kamil", side: 0 },
  { id: 2, name: "Locha", side: 1 },
];

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

describe("pustyOdczyt", () => {
  /**
   * ⚠️ Sedno: WIERSZE NIE ŚWIADCZĄ O TREŚCI. `aggregate` buduje je ze składu
   * podanego z gry, więc sesja, która nie zobaczyła ani jednego ciosu, ma
   * komplet postaci i same zera. Warunek „są wiersze" wybierał wtedy zera
   * i tak wyglądała usterka zgłoszona przez pierwszego gracza (2026‑08‑04).
   */
  test("komplet postaci na samych zerach to nadal PUSTY odczyt", () => {
    const stats = aggregate([], SKLAD);
    expect(stats.actors.length).toBe(2);
    expect(pustyOdczyt(stats)).toBe(true);
  });

  test("jeden cios wystarczy, żeby przestał być pusty", () => {
    const stats = aggregate(
      [
        otwarcie(["Kamil 100m"], ["Locha 50w"]),
        cios("Kamil", "Locha", [trafienie(455)], { targetHpPct: 40.37 }),
      ],
      SKLAD,
    );
    expect(pustyOdczyt(stats)).toBe(false);
  });

  test("⚠ walka z samych uników czyta się jako PUSTA — i to jest luka", () => {
    // Zmierzone, nie założone: `aggregate` nie dolicza uniku do `hits`, więc
    // odczyt złożony wyłącznie z uników ma zerowe kwoty ORAZ zerowe ciosy.
    // `pustyOdczyt` powie o nim „nie zdążyliśmy się podpiąć", choć podpięcie
    // było w porządku.
    //
    // Zostaje tak świadomie: walka rozstrzygnięta samymi unikami nie istnieje
    // (żeby ktoś poległ, musi oberwać), a warunek liczący uniki wymagałby
    // dołożenia im pola w `ActorStats`. Test stoi tu po to, żeby luka była
    // ZAPISANA, a nie odkryta drugi raz.
    const stats = aggregate(
      [
        otwarcie(["Kamil 100m"], ["Locha 50w"]),
        cios("Kamil", "Locha", [trafienie(0, 0, { dodged: true })], { dodged: true }),
      ],
      SKLAD,
    );
    expect(pustyOdczyt(stats)).toBe(true);
  });

  test("odczyt z protokołu na prawdziwym komunikacie nie jest pusty", () => {
    // Druga strona tego samego pytania: to, co dodatek naprawdę dostaje z gry,
    // ma przejść przez `pustyOdczyt` jako TREŚĆ, a nie jako brak.
    const stats = aggregate(dekoduj(["1=100.00;2=40.37;+dmgd=455;-dmgd=455"], SKLAD), SKLAD);
    expect(pustyOdczyt(stats)).toBe(false);
  });
});
