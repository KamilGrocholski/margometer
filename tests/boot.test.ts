import { beforeEach, describe, expect, test } from "bun:test";
import { boot } from "../src/index.ts";

/** Pętla sterowana ręcznie — `boot` normalnie siedzi na `setInterval`. */
function manualLoop() {
  let step: (() => void) | null = null;
  return {
    schedule: (run: () => void) => {
      step = run;
      return 1;
    },
    cancel: () => {
      step = null;
    },
    tick(times = 1) {
      for (let i = 0; i < times; i += 1) step?.();
    },
    get running() {
      return step !== null;
    },
  };
}

const store = new Map<string, string>();
const storage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
} as unknown as Storage;

/** Panel rysuje się jako host doczepiony do body — po nim poznajemy start. */
const panelShown = () => document.body.querySelector("div") !== null;

beforeEach(() => {
  document.body.innerHTML = "";
  store.clear();
});

describe("start dodatku", () => {
  test("poza grą nic się nie rysuje, a pętla gaśnie", () => {
    // `@match` obejmuje całą domenę, więc dodatek startuje też na podstronach,
    // które grą nie są. Bez tego zostawał tam pływający panel i przeczesywanie
    // CAŁEGO dokumentu co sekundę do końca życia karty.
    const loop = manualLoop();
    boot({
      schedule: loop.schedule,
      cancel: loop.cancel,
      findLog: () => null,
      window: {},
      storage,
    });

    loop.tick(19);
    expect(panelShown()).toBe(false);
    expect(loop.running).toBe(true);

    loop.tick();
    expect(loop.running).toBe(false);
    expect(panelShown()).toBe(false);
  });

  test("obecność Engine wystarczy, żeby narysować panel przed pierwszą walką", () => {
    // Licznik ma stać na ekranie od wejścia do gry, a nie dopiero od pierwszego
    // ciosu — okno walki pojawia się w DOM znacznie później.
    const loop = manualLoop();
    boot({
      schedule: loop.schedule,
      cancel: loop.cancel,
      findLog: () => null,
      window: { Engine: {} },
      storage,
    });

    loop.tick();
    expect(panelShown()).toBe(true);
    // Gra jest, więc pętla ma dalej szukać okna walki, choćby go jeszcze nie było.
    loop.tick(30);
    expect(loop.running).toBe(true);
  });

  test("samo okno walki w DOM też uruchamia licznik", () => {
    // Bez `Engine` (inna wersja klienta, wklejony podgląd) zostaje dowód
    // z DOM-u — i on wystarcza.
    const log = document.createElement("div");
    log.textContent = "Rozpoczęła się walka pomiędzy Kamil (120h) a Wilk (10w)";
    document.body.append(log);

    const loop = manualLoop();
    boot({
      schedule: loop.schedule,
      cancel: loop.cancel,
      findLog: () => log,
      window: {},
      storage,
    });

    loop.tick();
    expect(panelShown()).toBe(true);
    expect(loop.running).toBe(true);
  });

  test("panel powstaje RAZ, nie przy każdym tyknięciu", () => {
    const loop = manualLoop();
    boot({
      schedule: loop.schedule,
      cancel: loop.cancel,
      findLog: () => null,
      window: { Engine: {} },
      storage,
    });

    loop.tick(5);
    expect(document.body.children).toHaveLength(1);
  });
});
