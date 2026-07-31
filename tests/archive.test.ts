import { beforeEach, describe, expect, test } from "bun:test";
import { Archive, fightLabel, whenLabel, type ArchiveRecorder } from "../src/archive.ts";
import { Overlay } from "../src/overlay.ts";
import { parse } from "../src/parser.ts";
import { aggregate } from "../src/stats.ts";
import type { Ticker } from "../src/window.ts";
import type { Recording } from "../src/recorder.ts";
import { ManualTicker } from "./manual-ticker.ts";

const FIXTURES = new URL("./fixtures/", import.meta.url).pathname;
const readFixture = (name: string) => Bun.file(`${FIXTURES}new-engine/${name}/raw.txt`).text();

/** Zegar sterowany ręcznie — bez tego nie da się sprawdzić kolejnych klatek. */
/** Nagrywarka w pamięci — archiwum widzi tylko listę i odczyt. */
function fakeRecorder(logs: { id: number; at: number; text: string }[]): ArchiveRecorder {
  return {
    remove: (id) => {
      const at = logs.findIndex((one) => one.id === id);
      if (at >= 0) logs.splice(at, 1);
    },
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

  test("krok w pół akcji nie wywołuje ostrzeżenia o nierozpoznanych liniach", async () => {
    // Krok po linii potrafi stanąć MIĘDZY "uderzył" a "otrzymał". Parser słusznie
    // zgłasza wtedy niedomknięty cios, ale w połowie odtwarzania to nie zmiana
    // formatu — stopka nie ma przez to mrugać ostrzeżeniem co drugą klatkę.
    // Fixture rozpoznaje się w całości (0 nieznanych linii), więc na żadnej
    // klatce nie powinno paść żadne ostrzeżenie.
    const { overlay, text } = await loadReplay();
    const total = text.split("\n").filter((line) => line.trim() !== "").length;

    for (let i = 0; i < total; i += 1) {
      ticker.tick(1);
      expect(overlay.shadow.querySelector(".warn")).toBeNull();
    }
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

describe("pole wklejania przeżywa przebudowę listy", () => {
  const line = "Rozpoczęła się walka pomiędzy Kamil (120h) a Regulus (130m)";

  test("wpisany tekst nie znika, gdy dojdzie nowe nagranie", async () => {
    const text = await readFixture("2026-07-18_tancerz-vs-kukla");
    const logs = [{ id: 1, at: NOW, text }];
    const { overlay, archive } = build(logs);
    archive.toggle();
    button(overlay, "archive-paste")!.click();

    const area = overlay.shadow.querySelector<HTMLTextAreaElement>("[data-field='paste']")!;
    area.value = "mój długi wklejony log...";

    // Skończyła się kolejna walka: `sync` przebudowuje listę pod spodem.
    logs.push({ id: 2, at: NOW, text: line });
    archive.sync();

    const after = overlay.shadow.querySelector<HTMLTextAreaElement>("[data-field='paste']")!;
    expect(after).toBe(area);
    expect(after.value).toBe("mój długi wklejony log...");
    // Lista faktycznie się przebudowała — inaczej test nic nie dowodzi.
    expect(rows(overlay)).toHaveLength(2);
  });

  test("wiersz z przyciskiem wczytania nie udaje wiersza rankingu", async () => {
    // `.row` w tym samym shadow roocie należy do rankingu i narzuca wysokość
    // 20 px z obcięciem — pole wklejania musi mieć własną klasę.
    const { overlay, archive } = build([{ id: 1, at: NOW, text: line }]);
    archive.toggle();
    button(overlay, "archive-paste")!.click();

    expect(overlay.shadow.querySelector(".archive-paste .row")).toBeNull();
    expect(overlay.shadow.querySelector(".archive-paste-actions")).not.toBeNull();
  });
});

describe("kasowanie pojedynczego nagrania", () => {
  const line = "Rozpoczęła się walka pomiędzy Kamil (120h) a Regulus (130m)";

  test("pierwszy klik pyta, drugi kasuje", () => {
    // Jedyną drogą usunięcia czegokolwiek było "wyczyść" w panelu, które kasuje
    // WSZYSTKO — `Recorder.drop` istniał od początku, tylko nic go nie wystawiało.
    const logs = [
      { id: 1, at: NOW, text: line },
      { id: 2, at: NOW, text: `${line}\nKamil(100%) uderzył z siłą  +10` },
    ];
    const { overlay, archive } = build(logs);
    archive.toggle();
    expect(rows(overlay)).toHaveLength(2);

    const remove = () =>
      rows(overlay)[0]!.querySelector<HTMLElement>('[data-action="archive-remove"]')!;

    remove().click();
    // Nadal dwa wiersze — pierwszy klik tylko pyta.
    expect(rows(overlay)).toHaveLength(2);
    expect(remove().textContent).toBe("na pewno?");

    remove().click();
    expect(rows(overlay)).toHaveLength(1);
    expect(logs.map((one) => one.id)).toEqual([2]);
  });

  // Pytanie „na pewno?" nie wygasało tu WCALE: wystarczyło kliknąć ✕, odejść
  // i wrócić po godzinie w to samo miejsce, żeby skasować bez pytania. Panel
  // miał ten sam wzorzec z wygasaniem — dwa zachowania, jedna decyzja.
  describe("pytanie o skasowanie nagrania wygasa", () => {
    const armed = () => {
      const logs = [
        { id: 1, at: NOW, text: line },
        { id: 2, at: NOW, text: `${line}\nKamil(100%) uderzył z siłą  +10` },
      ];
      const { overlay, archive } = build(logs);
      archive.toggle();
      const remove = (index: number) =>
        rows(overlay)[index]!.querySelector<HTMLElement>('[data-action="archive-remove"]')!;
      remove(0).click();
      return { overlay, archive, logs, remove };
    };

    test("po wygaśnięciu wiersz SAM wraca do ✕", () => {
      const { remove } = armed();
      expect(remove(0).textContent).toBe("na pewno?");

      ticker.tick();

      expect(remove(0).textContent).toBe("✕");
      expect(remove(0).getAttribute("aria-label")).toBe("Usuń nagranie");
    });

    test("klik po wygaśnięciu pyta od nowa, a nie kasuje", () => {
      const { logs, remove } = armed();
      ticker.tick();

      remove(0).click();

      expect(logs.map((one) => one.id)).toEqual([1, 2]);
      expect(remove(0).textContent).toBe("na pewno?");
    });

    test("zamknięcie okna rozbraja pytanie", () => {
      const { archive, remove, logs } = armed();

      archive.toggle();
      archive.toggle();

      expect(remove(0).textContent).toBe("✕");
      remove(0).click();
      expect(logs.map((one) => one.id)).toEqual([1, 2]);
    });

    test("pytanie o inne nagranie rozbraja poprzednie", () => {
      const { remove } = armed();

      remove(1).click();

      expect(remove(0).textContent).toBe("✕");
      expect(remove(1).textContent).toBe("na pewno?");
    });
  });

  test("kliknięcie w ✕ nie wczytuje walki do panelu", () => {
    const logs = [{ id: 1, at: NOW, text: line }];
    const { overlay, archive } = build(logs);
    archive.toggle();

    rows(overlay)[0]!.querySelector<HTMLElement>('[data-action="archive-remove"]')!.click();
    expect(overlay.isPreviewing()).toBe(false);
  });
});
