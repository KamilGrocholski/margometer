import { beforeEach, describe, expect, test } from "bun:test";
import { Overlay } from "../src/overlay.ts";
import { Session } from "../src/session.ts";
import { Recorder } from "../src/recorder.ts";
import { boot, start } from "../src/index.ts";
import { StaticProtocolSource } from "../src/protokol-source.ts";
import { BEZ_SLOWNIKA } from "../src/slownik-gry.ts";
import type { BattleEvent } from "../src/types.ts";

import { KOMUNIKATY, SKLAD } from "./walka-z-gry.ts";

describe("spięcie źródła z overlayem", () => {
  /**
   * Cały łańcuch: `Engine.battle.update` → dekoder → agregat → panel.
   *
   * Do 2026‑08‑04 stały tu DWA testy i oba szły przez DOM: budowały okno walki
   * z `<div>`-ów i sprawdzały, że dopisane zdanie przelicza panel. Okna walki
   * nie czytamy — materiałem jest prawdziwy zrzut protokołu, a „dopisane
   * zdanie" to kolejny komunikat.
   */
  test("cały łańcuch: protokół gry → dekoder → panel", () => {
    const overlay = new Overlay();
    start(new StaticProtocolSource(KOMUNIKATY, BEZ_SLOWNIKA, SKLAD), overlay, new Session());

    const labels = [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);
    expect(labels).toContain("Gracz 1");
    // Skład jest z gry, więc na liście stoją także ci, którzy nic nie zadali.
    expect(labels.length).toBe(SKLAD.length);
  });

  test("kolejna porcja przelicza panel, a nie dokłada się do poprzedniej", () => {
    const overlay = new Overlay();
    const sesja = new Session();
    const wartosc = (name: string) =>
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
        .find((row) => row.dataset.actor === name)
        ?.querySelector(".value")?.textContent ?? "";

    // Protokół podaje CAŁY prefiks przy każdej porcji — panel ma liczyć od zera.
    start(new StaticProtocolSource(KOMUNIKATY.slice(0, 2), BEZ_SLOWNIKA, SKLAD), overlay, sesja);
    const polowa = wartosc("Gracz 1");

    start(new StaticProtocolSource(KOMUNIKATY, BEZ_SLOWNIKA, SKLAD), overlay, sesja);
    const calosc = wartosc("Gracz 1");

    expect(polowa).not.toBe("");
    expect(calosc).not.toBe(polowa);
  });
});

describe("spięcie nagrywarki ze źródłem protokołu", () => {
  // Nagrywarka zapisuje KOMUNIKATY, nie policzone liczby, więc spięcie siedzi
  // tam, gdzie protokół — w `start()`, razem z sesją i panelem.
  const pamiec = () => {
    const store = new Map<string, string>();
    return {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
  };

  const zrodlo = () => new StaticProtocolSource(KOMUNIKATY, BEZ_SLOWNIKA, SKLAD);

  test("start() podaje nagrywarce te same komunikaty, które dostał dekoder", () => {
    const recorder = new Recorder({ storage: pamiec() });
    recorder.toggle();
    const overlay = new Overlay({ recorder });

    start(zrodlo(), overlay, new Session(), recorder);

    expect(recorder.count()).toBe(1);
    // Overlay pokazuje ten sam stan, co nagrywarka zapisała.
    expect(overlay.shadow.querySelector(".rec-bar .grow")!.textContent).toContain("1 walka");
    // Nagranie odtwarza WEJŚCIE licznika, znak w znak — nie jego wynik.
    expect(recorder.read(recorder.list()[0]!.id)).toEqual({
      komunikaty: KOMUNIKATY,
      sklad: SKLAD,
    });
  });

  // Nagranie ma przeżyć licznik, nie odwrotnie: gdy wysypie się liczenie,
  // surowe komunikaty są JEDYNĄ rzeczą, którą da się tę awarię odtworzyć.
  // Dlatego zapis idzie pierwszy i we własnej osłonie.
  test("awaria licznika nie zabiera ze sobą nagrywania", () => {
    const recorder = new Recorder({ storage: pamiec() });
    recorder.toggle();

    const sesja = new Session();
    sesja.updateEvents = () => {
      throw new Error("licznik padł");
    };
    const errors: unknown[] = [];
    const console_error = console.error;
    console.error = (...args: unknown[]) => void errors.push(args);

    try {
      // Nie może wylecieć na zewnątrz: callback leci z opakowanego
      // `Engine.battle.update`, więc wyjątek wypadłby do kontekstu STRONY GRY
      // i przewracał turę.
      expect(() =>
        start(zrodlo(), new Overlay({ recorder }), sesja, recorder),
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
      window: { Engine: {} },
      storage,
    });

    loop.tick();
    expect(panelShown()).toBe(true);
    // Gra jest, więc pętla ma tykać dalej — panel stoi, dopóki stoi `Engine`.
    loop.tick(30);
    expect(loop.running).toBe(true);
  });

  test("samo okno walki w DOM JUŻ NIE uruchamia licznika", () => {
    // ⚠️ Zmiana z 2026‑08‑04, i to zamierzona. Dopóki log brało się z DOM-u,
    // okno walki bez `Engine` (inna wersja klienta, wklejony podgląd) było
    // wystarczającym dowodem gry. Dziś czytamy `Engine.battle` — bez niego
    // panel stanąłby pusty, więc rysowanie go obiecywałoby licznik, którego
    // nie ma. Pętla ma zamiast tego zgasnąć, jak na każdej innej podstronie.
    const log = document.createElement("div");
    log.id = "log-walki";
    document.body.append(log);

    const loop = manualLoop();
    boot({ schedule: loop.schedule, cancel: loop.cancel, window: {}, storage });

    loop.tick(20);
    // `panelShown()` szuka byle `<div>`, a my sami jednego dołożyliśmy —
    // liczymy więc dzieci `body`: ma zostać wyłącznie nasz log, bez hosta panelu.
    expect(document.body.children).toHaveLength(1);
    expect(document.body.children[0]).toBe(log);
    expect(loop.running).toBe(false);
  });

  test("panel powstaje RAZ, nie przy każdym tyknięciu", () => {
    const loop = manualLoop();
    boot({
      schedule: loop.schedule,
      cancel: loop.cancel,
      window: { Engine: {} },
      storage,
    });

    loop.tick(5);
    expect(document.body.children).toHaveLength(1);
  });
});

/**
 * ⚠️ **`zrodloPanelu` ZNIKŁO 2026‑08‑04**, a razem z nim 5 testów.
 *
 * Rozstrzygało, z której z dwóch dróg panel bierze liczby: „protokół, gdy
 * cokolwiek POLICZYŁ; tekst w przeciwnym razie". Warunkiem była TREŚĆ, a nie
 * liczba wierszy — i ta różnica kosztowała jedno złe wskazanie w grze. Droga
 * została jedna, więc nie ma czego wybierać; sam warunek żyje dalej jako
 * `pustyOdczyt` i to on odpowiada dziś na pytanie „czy zdążyliśmy się podpiąć"
 * (`tests/stan-odczytu.test.ts`).
 */

describe("ostrzeżenie o spóźnionym podpięciu nie przeżywa walki", () => {
  /** Atrapa panelu: notuje, co dostało i w jakiej kolejności. */
  const panel = () => {
    const spoznienia: boolean[] = [];
    return {
      spoznienia,
      overlay: {
        render: () => {},
        setSpoznionePodpiecie: (s: boolean) => spoznienia.push(s),
      } as unknown as Overlay,
    };
  };

  const zdarzeniaCiosu: BattleEvent[] = [
    {
      kind: "attack",
      source: "Kamil",
      target: "Locha",
      sourceHpPct: 100,
      targetHpPct: 50,
      hits: [
        { raw: 10, applied: 10, crit: false, superCrit: false, secondary: false, element: null, dodged: false },
      ],
      dodged: false,
      blocked: null,
      procs: [],
      ability: null,
      strike: true,
    },
  ];
  const koniec: BattleEvent[] = [
    { kind: "fight-end", outcome: "victory", actors: ["Kamil"], result: "" },
  ];
  const sklad = [
    { id: 1, name: "Kamil", side: 0 },
    { id: 2, name: "Locha", side: 1 },
  ];
  /** Porcja z protokołu — komunikaty są tu nieistotne, liczy się odczyt i skład. */
  const porcja = (zdarzenia: BattleEvent[]) => ({ komunikaty: [], zdarzenia, sklad });

  test("porcja W TRAKCIE walki nie zapala ostrzeżenia, choćby nie było liczb", () => {
    // To jest ta usterka: napis z walki, w której nie zdążyliśmy się podpiąć,
    // wisiał nad następną. Wyrokujemy dopiero na końcu, ale GASIMY po drodze.
    const p = panel();
    start({ subscribe: (l) => (l(porcja([])), () => {}) }, p.overlay, new Session());

    expect(p.spoznienia.at(-1)).toBe(false);
  });

  test("koniec walki z PUSTYM odczytem mówi o spóźnieniu", () => {
    const p = panel();
    // Sam koniec walki — zero obrażeń, a wiersze i tak będą, bo jest skład.
    start({ subscribe: (l) => (l(porcja(koniec)), () => {}) }, p.overlay, new Session());

    expect(p.spoznienia.at(-1)).toBe(true);
  });

  test("koniec walki z PEŁNYM odczytem gasi flagę spóźnienia", () => {
    // Inaczej flaga zapalona raz wisiałaby do końca sesji.
    const p = panel();
    start(
      { subscribe: (l) => (l(porcja([...zdarzeniaCiosu, ...koniec])), () => {}) },
      p.overlay,
      new Session(),
    );

    expect(p.spoznienia.at(-1)).toBe(false);
  });
});
