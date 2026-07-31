import { beforeEach, describe, expect, test } from "bun:test";
import { Overlay } from "../src/overlay.ts";
import { Session } from "../src/session.ts";
import { DomLogSource, findBattleLog, StaticLogSource } from "../src/source.ts";
import { Recorder } from "../src/recorder.ts";
import { boot, start } from "../src/index.ts";
import { number, readFixture } from "./helpers.ts";

describe("spięcie źródła z overlayem", () => {
  test("cały łańcuch: DOM gry → parser → overlay", async () => {
    // Odtwarzamy okno walki tak, jak wyglądałoby w grze: linie w <div>-ach.
    const log = document.createElement("div");
    log.id = "log-walki";
    for (const line of (await readFixture("new-engine/2026-07-18_lowca-vs-paladyni")).split("\n")) {
      log.append(Object.assign(document.createElement("div"), { textContent: line }));
    }
    document.body.append(log);

    const container = findBattleLog();
    expect(container?.id).toBe("log-walki");

    const overlay = new Overlay();
    const stop = start(new DomLogSource(container!), overlay);

    // Jeden wspólny ranking, malejąco — strona nie ma wpływu na kolejność.
    const labels = [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);
    expect(labels).toEqual(["Południca", "Wieczornica *", "Łowca głów z psk"]);

    // Po dopisaniu linii overlay musi się sam przeliczyć.
    log.append(
      Object.assign(document.createElement("div"), {
        textContent: "Południca(100%) uderzył(a) z siłą  +900",
      }),
      Object.assign(document.createElement("div"), {
        textContent: "Łowca głów z psk(0%) otrzymał  -500  obrażeń",
      }),
    );
    await new Promise((resolve) => queueMicrotask(() => resolve(null)));

    // Wiersz bierzemy po nazwie: sekcje układają moją stronę przed przeciwnikami,
    // a dopisane obrażenia zadała Południca.
    const poludnica = [...overlay.shadow.querySelectorAll<HTMLElement>(".row")].find(
      (row) => row.dataset.actor === "Południca",
    );
    expect(poludnica?.querySelector(".value")?.textContent).toContain(number.format(978 + 500));
    stop();
  });

  test("statyczne źródło renderuje statystyki walki", async () => {
    const overlay = new Overlay();
    start(new StaticLogSource(await readFixture("new-engine/2026-07-18_tancerz-vs-kukla")), overlay);

    const labels = [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);
    expect(labels).toEqual(["Magister Kazrek", "Kukła Treningowa"]);
    expect(overlay.shadow.querySelector(".value")?.textContent).toContain("36");
  });
});

describe("spięcie nagrywarki ze źródłem logu", () => {
  test("start() podaje nagrywarce ten sam tekst, który dostał parser", async () => {
    const text = await readFixture("new-engine/2026-07-18_tancerz-vs-kukla");
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    const recorder = new Recorder({ storage });
    recorder.toggle();
    const overlay = new Overlay({ recorder });

    start(new StaticLogSource(text), overlay, new Session(), undefined, recorder);

    expect(recorder.count()).toBe(1);
    // Overlay pokazuje ten sam stan, co nagrywarka zapisała.
    expect(overlay.shadow.querySelector(".rec-bar .grow")!.textContent).toContain("1 walka");
    const recorded = recorder.dump() ?? "";
    for (const line of text.split("\n").filter((l) => l.trim() !== "")) {
      expect(recorded).toContain(line);
    }
  });

  // Nagranie ma przeżyć licznik, nie odwrotnie: gdy wysypie się parsowanie,
  // surowy log jest JEDYNĄ rzeczą, którą da się tę awarię odtworzyć. Dlatego
  // zapis idzie pierwszy i we własnej osłonie.
  test("awaria licznika nie zabiera ze sobą nagrywania", async () => {
    const text = await readFixture("new-engine/2026-07-18_tancerz-vs-kukla");
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    const recorder = new Recorder({ storage });
    recorder.toggle();

    const session = new Session();
    session.update = () => {
      throw new Error("parser padł");
    };
    const errors: unknown[] = [];
    const console_error = console.error;
    console.error = (...args: unknown[]) => void errors.push(args);

    try {
      // Nie może wylecieć na zewnątrz: callback leci z mikrotaska, więc
      // wyjątek wypadłby do kontekstu STRONY GRY i powtarzał się przy każdej
      // mutacji DOM.
      expect(() =>
        start(new StaticLogSource(text), new Overlay({ recorder }), session, undefined, recorder),
      ).not.toThrow();
    } finally {
      console.error = console_error;
    }

    expect(recorder.count()).toBe(1);
    expect(errors).toHaveLength(1);
  });
});

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
