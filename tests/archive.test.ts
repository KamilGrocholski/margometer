import { beforeEach, describe, expect, test } from "bun:test";
import { Archive, fightLabel, whenLabel, type ArchiveRecorder } from "../src/archive.ts";
import { Overlay } from "../src/overlay.ts";
import { parse } from "../src/parser.ts";
import { aggregate } from "../src/stats.ts";
import type { Ticker } from "../src/window.ts";
import type { Recording } from "../src/recorder.ts";

const FIXTURES = new URL("./fixtures/", import.meta.url).pathname;
const readFixture = (name: string) => Bun.file(`${FIXTURES}new-engine/${name}/raw.txt`).text();

/** Zegar sterowany ręcznie — bez tego nie da się sprawdzić kolejnych klatek. */
class ManualTicker implements Ticker {
  private steps = new Map<number, () => void>();
  private next = 1;
  everyMs = 0;

  start(step: () => void, everyMs: number): number {
    this.everyMs = everyMs;
    const handle = this.next++;
    this.steps.set(handle, step);
    return handle;
  }

  stop(handle: number): void {
    this.steps.delete(handle);
  }

  get running(): boolean {
    return this.steps.size > 0;
  }

  tick(times = 1): void {
    for (let i = 0; i < times; i += 1) for (const step of [...this.steps.values()]) step();
  }
}

/** Nagrywarka w pamięci — archiwum widzi tylko listę i odczyt. */
function fakeRecorder(logs: { id: number; at: number; text: string }[]): ArchiveRecorder {
  return {
    list: (): Recording[] =>
      logs.map((one) => ({
        id: one.id,
        title: one.text.split("\n")[0] ?? "",
        chars: one.text.length,
        at: one.at,
      })),
    read: (id) => logs.find((one) => one.id === id)?.text ?? null,
  };
}

const NOW = new Date("2026-07-23T20:00:00").getTime();
const store = new Map<string, string>();
const storage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
};

let ticker: ManualTicker;

beforeEach(() => {
  document.body.innerHTML = "";
  store.clear();
  ticker = new ManualTicker();
});

const build = (logs: { id: number; at: number; text: string }[]) => {
  const overlay = new Overlay({ storage });
  const archive = new Archive({
    recorder: fakeRecorder(logs),
    overlay,
    storage,
    ticker,
    now: () => NOW,
  });
  overlay.attachArchive(archive);
  return { overlay, archive };
};

const rows = (overlay: Overlay) => [
  ...overlay.shadow.querySelectorAll<HTMLElement>(".archive-row"),
];
const button = (overlay: Overlay, action: string) =>
  overlay.shadow.querySelector<HTMLElement>(`[data-action="${action}"]`);

describe("etykiety", () => {
  test("skład z linii otwierającej", () => {
    expect(fightLabel("Rozpoczęła się walka pomiędzy Kamil (120h) a Regulus (130m)")).toBe(
      "Kamil vs Regulus",
    );
  });

  test("liczna drużyna skraca się do dwóch nazw i reszty", () => {
    const line =
      "Rozpoczęła się walka pomiędzy Kamil (120h), Fover (118t) a Gnoll (90h), Gnoll (91h), Gnoll (92m)";
    expect(fightLabel(line)).toBe("Kamil, Fover vs Gnoll, Gnoll +1");
  });

  test("log bez linii otwierającej mówi to wprost", () => {
    expect(fightLabel("Kamil(100%) uderzył z siłą +120 Wilk")).toBe("walka bez składu");
  });

  test("dzisiejsza walka pokazuje samą godzinę, starsza także dzień", () => {
    expect(whenLabel(new Date("2026-07-23T19:04:00").getTime(), NOW)).toBe("19:04");
    expect(whenLabel(new Date("2026-07-22T22:10:00").getTime(), NOW)).toBe("22.07 22:10");
  });
});

describe("okno archiwum", () => {
  test("startuje zamknięte i otwiera się przyciskiem w nagłówku", async () => {
    const text = await readFixture("2026-07-18_tancerz-vs-kukla");
    const { overlay, archive } = build([{ id: 1, at: NOW, text }]);

    expect(archive.isOpen()).toBe(false);
    expect(overlay.shadow.querySelector(".archive")?.hasAttribute("hidden")).toBe(true);

    button(overlay, "archive")!.click();

    expect(archive.isOpen()).toBe(true);
    expect(overlay.shadow.querySelector(".archive")?.hasAttribute("hidden")).toBe(false);
    expect(button(overlay, "archive")!.getAttribute("aria-pressed")).toBe("true");
  });

  test("zamyka się krzyżykiem i pamięta to między sesjami", async () => {
    const text = await readFixture("2026-07-18_tancerz-vs-kukla");
    const first = build([{ id: 1, at: NOW, text }]);
    first.archive.toggle();
    button(first.overlay, "archive-close")!.click();
    expect(first.archive.isOpen()).toBe(false);

    first.archive.toggle();
    // Nowa sesja czyta ten sam magazyn — okno wraca otwarte.
    const second = build([{ id: 1, at: NOW, text }]);
    expect(second.archive.isOpen()).toBe(true);
    expect(second.overlay.shadow.querySelector(".archive")?.hasAttribute("hidden")).toBe(false);
  });

  test("pusta lista tłumaczy, skąd wziąć nagrania", () => {
    const { overlay, archive } = build([]);
    archive.toggle();

    expect(rows(overlay)).toHaveLength(0);
    expect(overlay.shadow.querySelector(".archive-empty")!.textContent).toContain("⏺");
  });

  test("lista pokazuje skład, czas, tury i wynik, najnowsze na górze", async () => {
    const kukla = await readFixture("2026-07-18_tancerz-vs-kukla");
    const gnolle = await readFixture("2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const { overlay, archive } = build([
      { id: 1, at: new Date("2026-07-23T18:00:00").getTime(), text: kukla },
      { id: 2, at: new Date("2026-07-23T19:30:00").getTime(), text: gnolle },
    ]);
    archive.toggle();

    const listed = rows(overlay);
    expect(listed).toHaveLength(2);
    expect(listed[0]!.dataset.recording).toBe("2");
    expect(listed[0]!.querySelector(".archive-name")!.textContent).toContain(" vs ");
    const meta = listed[0]!.querySelector(".archive-meta")!.textContent!;
    expect(meta).toContain("19:30");
    expect(meta).toMatch(/\d+ tur/);
    expect(meta).toMatch(/obr\./);
  });

  test("otwarte okno dokłada nową walkę bez zamykania go", async () => {
    const kukla = await readFixture("2026-07-18_tancerz-vs-kukla");
    const gnolle = await readFixture("2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const logs = [{ id: 1, at: NOW, text: kukla }];
    const overlay = new Overlay({ storage });
    const archive = new Archive({
      recorder: fakeRecorder(logs),
      overlay,
      storage,
      ticker,
      now: () => NOW,
    });
    overlay.attachArchive(archive);
    archive.toggle();
    expect(rows(overlay)).toHaveLength(1);

    logs.push({ id: 2, at: NOW, text: gnolle });
    // Panel przerysowuje się przy każdej zmianie logu — archiwum jedzie z nim.
    overlay.refresh();

    expect(rows(overlay)).toHaveLength(2);
  });
});

describe("wczytywanie walki do panelu", () => {
  test("kliknięcie wiersza pokazuje gotowe statystyki tej walki", async () => {
    const text = await readFixture("2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const { overlay, archive } = build([{ id: 1, at: NOW, text }]);
    archive.toggle();

    rows(overlay)[0]!.click();

    expect(overlay.isPreviewing()).toBe(true);
    const expected = aggregate(parse(text));
    const shown = [...overlay.shadow.querySelectorAll(".rows .row .label")].map(
      (el) => el.textContent,
    );
    expect(shown).toHaveLength(expected.actors.length);
    // Pasek mówi wprost, że to nie jest trwająca walka.
    expect(overlay.shadow.querySelector(".preview-tag")!.textContent).toBe("PODGLĄD");
    expect(overlay.shadow.querySelector(".preview-head .grow")!.textContent).toContain(
      "z archiwum",
    );
    expect(overlay.shadow.querySelector(".preview-title")!.textContent).toContain(" vs ");
  });

  test("podgląd przykrywa licznik na żywo, ale go nie zatrzymuje", async () => {
    const archived = await readFixture("2026-07-18_tancerz-vs-kukla");
    const live = aggregate(parse(await readFixture("2026-07-18_lowca-vs-paladyni")));
    const { overlay, archive } = build([{ id: 1, at: NOW, text: archived }]);
    archive.toggle();
    rows(overlay)[0]!.click();

    const previewed = [...overlay.shadow.querySelectorAll(".rows .row .label")].map(
      (el) => el.textContent,
    );
    // Gra leci dalej — panel ma pokazywać nagranie mimo świeżych danych.
    overlay.render(live, live);
    expect([...overlay.shadow.querySelectorAll(".rows .row .label")].map((el) => el.textContent))
      .toEqual(previewed);

    button(overlay, "exit-preview")!.click();

    expect(overlay.isPreviewing()).toBe(false);
    expect(overlay.shadow.querySelector(".preview-bar")).toBeNull();
    // Po wyjściu widać to, co narosło w międzyczasie.
    expect(overlay.shadow.querySelectorAll(".rows .row")).toHaveLength(live.actors.length);
  });

  test("wybrany wiersz jest zaznaczony na liście", async () => {
    const text = await readFixture("2026-07-18_tancerz-vs-kukla");
    const { overlay, archive } = build([{ id: 1, at: NOW, text }]);
    archive.toggle();

    rows(overlay)[0]!.click();

    expect(rows(overlay)[0]!.className).toContain("is-open");
  });
});

describe("odtwarzanie", () => {
  const loadReplay = async () => {
    const text = await readFixture("2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const { overlay, archive } = build([{ id: 1, at: NOW, text }]);
    archive.toggle();
    button(overlay, "archive-play")!.click();
    return { overlay, archive, text };
  };

  test("startuje od zera, a nie od gotowego wyniku", async () => {
    const { overlay } = await loadReplay();

    expect(overlay.isPreviewing()).toBe(true);
    expect(overlay.shadow.querySelectorAll(".rows .row")).toHaveLength(0);
    expect(button(overlay, "replay-toggle")!.textContent).toBe("⏸");
    expect(ticker.running).toBe(true);
  });

  test("kolejne klatki dokładają obrażeń", async () => {
    const { overlay } = await loadReplay();
    const damage = () => {
      const value = overlay.shadow.querySelector(".rows .row .value")?.textContent ?? "0";
      return Number(value.split("(")[0]!.replace(/\D/g, ""));
    };

    ticker.tick(12);
    const early = damage();
    ticker.tick(20);

    expect(early).toBeGreaterThan(0);
    expect(damage()).toBeGreaterThan(early);
    expect(overlay.shadow.querySelector(".replay-label")!.textContent).toMatch(/^tura \d+\/\d+$/);
  });

  test("pauza zatrzymuje zegar, wznowienie go wraca", async () => {
    const { overlay } = await loadReplay();

    button(overlay, "replay-toggle")!.click();
    expect(ticker.running).toBe(false);
    expect(button(overlay, "replay-toggle")!.textContent).toBe("▶");

    button(overlay, "replay-toggle")!.click();
    expect(ticker.running).toBe(true);
  });

  test("prędkość chodzi w kółko i skraca odstęp", async () => {
    const { overlay } = await loadReplay();
    const base = ticker.everyMs;

    button(overlay, "replay-speed")!.click();
    expect(button(overlay, "replay-speed")!.textContent).toBe("2×");
    expect(ticker.everyMs).toBe(base / 2);

    button(overlay, "replay-speed")!.click();
    expect(button(overlay, "replay-speed")!.textContent).toBe("4×");
    button(overlay, "replay-speed")!.click();
    expect(button(overlay, "replay-speed")!.textContent).toBe("1×");
  });

  test("dobiegnięcie do końca zatrzymuje odtwarzanie na pełnym wyniku", async () => {
    const { overlay, text } = await loadReplay();

    ticker.tick(text.split("\n").filter((line) => line.trim() !== "").length + 5);

    expect(ticker.running).toBe(false);
    const full = aggregate(parse(text));
    expect(overlay.shadow.querySelectorAll(".rows .row")).toHaveLength(full.actors.length);
    expect((overlay.shadow.querySelector(".replay-fill") as HTMLElement).style.width).toBe("100%");
  });

  test("wejście w inną walkę gasi poprzednie odtwarzanie", async () => {
    const gnolle = await readFixture("2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const kukla = await readFixture("2026-07-18_tancerz-vs-kukla");
    const { overlay, archive } = build([
      { id: 1, at: NOW, text: gnolle },
      { id: 2, at: NOW - 1000, text: kukla },
    ]);
    archive.toggle();
    overlay.shadow.querySelector<HTMLElement>('[data-recording="1"] [data-action="archive-play"]')!
      .click();

    overlay.shadow.querySelector<HTMLElement>('[data-recording="2"]')!.click();

    expect(ticker.running).toBe(false);
    expect(overlay.shadow.querySelector(".replay")).toBeNull();
  });

  test("wyjście z podglądu zatrzymuje zegar", async () => {
    const { overlay } = await loadReplay();

    button(overlay, "exit-preview")!.click();

    expect(ticker.running).toBe(false);
    expect(overlay.isPreviewing()).toBe(false);
  });
});

describe("ręczne wklejenie", () => {
  test("wczytuje log i oznacza go jako wklejony, nie zapisując go", async () => {
    const text = await readFixture("2026-07-18_lowca-vs-paladyni");
    const { overlay, archive } = build([]);
    archive.toggle();

    button(overlay, "archive-paste")!.click();
    const area = overlay.shadow.querySelector<HTMLTextAreaElement>('textarea[data-field="paste"]')!;
    area.value = text;
    button(overlay, "archive-load-pasted")!.click();

    expect(overlay.isPreviewing()).toBe(true);
    expect(overlay.shadow.querySelector(".preview-head .grow")!.textContent).toBe("wklejony log");
    const expected = aggregate(parse(text));
    expect(overlay.shadow.querySelectorAll(".rows .row")).toHaveLength(expected.actors.length);
    // Nagrania przybyć nie mogło — wklejony log nie zajmuje magazynu.
    expect(rows(overlay)).toHaveLength(0);
  });

  test("puste pole nie otwiera podglądu", () => {
    const { overlay, archive } = build([]);
    archive.toggle();
    button(overlay, "archive-paste")!.click();

    button(overlay, "archive-load-pasted")!.click();

    expect(overlay.isPreviewing()).toBe(false);
  });
});
