import { beforeEach, describe, expect, test } from "bun:test";
import { Archive, fightLabel, whenLabel, type ArchiveRecorder } from "../src/archive.ts";
import { Overlay } from "../src/overlay.ts";
import { parse } from "../src/parser.ts";
import { aggregate } from "../src/stats.ts";
import type { Recording } from "../src/recorder.ts";
import { ManualTicker } from "./manual-ticker.ts";

const FIXTURES = new URL("./fixtures/", import.meta.url).pathname;
const readFixture = (name: string) => Bun.file(`${FIXTURES}new-engine/${name}/raw.txt`).text();

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

  test("kasowanie i zamykanie nie dzielą tego samego znaku", () => {
    // AUDYT-18: w jednym oknie ✕ w nagłówku zamykało, a ✕ w wierszu kasowało
    // NIEODWRACALNIE. Test pyta o samą zasadę, a nie o konkretną etykietę —
    // wolno je zmienić, nie wolno ich zrównać.
    const { overlay, archive } = build([{ id: 1, at: NOW, text: line }]);
    archive.toggle();

    const close = overlay.shadow.querySelector<HTMLElement>('[data-action="archive-close"]')!;
    const remove = rows(overlay)[0]!.querySelector<HTMLElement>('[data-action="archive-remove"]')!;

    expect(close.textContent).not.toBe(remove.textContent);
    // I żeby nie dało się tego przejść, robiąc oba puste.
    expect(remove.textContent?.trim()).not.toBe("");
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

    test("po wygaśnięciu wiersz SAM wraca do stanu spoczynku", () => {
      const { remove } = armed();
      expect(remove(0).textContent).toBe("na pewno?");

      ticker.tick();

      expect(remove(0).textContent).toBe("usuń");
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

      expect(remove(0).textContent).toBe("usuń");
      remove(0).click();
      expect(logs.map((one) => one.id)).toEqual([1, 2]);
    });

    test("pytanie o inne nagranie rozbraja poprzednie", () => {
      const { remove } = armed();

      remove(1).click();

      expect(remove(0).textContent).toBe("usuń");
      expect(remove(1).textContent).toBe("na pewno?");
    });
  });

  // Trzy miejsca wychodziły dotąd cichym `return`, więc klik wyglądał jak
  // awaria przycisku, a był poprawną odmową.
  describe("kliknięcie, które nic nie robi, mówi dlaczego", () => {
    const notice = (overlay: Overlay) =>
      overlay.shadow.querySelector(".archive-notice")?.textContent ?? null;

    test("„wczytaj” przy pustym polu nie milczy", () => {
      const { overlay, archive } = build([{ id: 1, at: NOW, text: line }]);
      archive.toggle();
      button(overlay, "archive-paste")!.click();

      button(overlay, "archive-load-pasted")!.click();

      expect(notice(overlay)).toBe("Najpierw wklej log walki.");
      expect(overlay.isPreviewing()).toBe(false);
    });

    test("wiersz nagrania, którego tekst zniknął, też nie milczy", () => {
      // Indeks obiecuje nagranie, a klucza pod nim nie ma — `read` zwraca null,
      // tak jak `localStorage.getItem` dla skasowanego klucza.
      const overlay = new Overlay({ storage });
      const archive = new Archive({
        recorder: {
          list: () => [{ id: 1, title: line, chars: line.length, at: NOW }],
          read: () => null,
        },
        overlay,
        storage,
        ticker,
        now: () => NOW,
      });
      overlay.attachArchive(archive);
      archive.toggle();

      rows(overlay)[0]!.click();

      expect(notice(overlay)).toBe("Tego nagrania już nie ma w pamięci przeglądarki.");
      expect(overlay.isPreviewing()).toBe(false);
    });

    test("odpowiedź gaśnie sama, żeby okno nie stało się listą odmów", () => {
      const { overlay, archive } = build([{ id: 1, at: NOW, text: line }]);
      archive.toggle();
      button(overlay, "archive-paste")!.click();
      button(overlay, "archive-load-pasted")!.click();
      expect(notice(overlay)).not.toBeNull();

      ticker.tick();

      expect(notice(overlay)).toBeNull();
    });

    test("poprawne wklejenie nie zostawia odpowiedzi", () => {
      const { overlay, archive } = build([{ id: 1, at: NOW, text: line }]);
      archive.toggle();
      button(overlay, "archive-paste")!.click();
      overlay.shadow.querySelector<HTMLTextAreaElement>('[data-field="paste"]')!.value = line;

      button(overlay, "archive-load-pasted")!.click();

      expect(notice(overlay)).toBeNull();
      expect(overlay.isPreviewing()).toBe(true);
    });
  });

  // Kasowanie ręczne czyściło cache w całości, ale EKSMISJA po przekroczeniu
  // budżetu dzieje się w nagrywarce i archiwum się o niej nie dowiaduje —
  // podsumowanie skasowanego nagrania zostawało w pamięci do końca sesji.
  test("nagranie wyeksmitowane przez nagrywarkę znika też z pamięci archiwum", () => {
    const logs = [
      { id: 1, at: NOW, text: line },
      { id: 2, at: NOW, text: `${line}\nKamil(100%) uderzył z siłą  +10` },
    ];
    const { overlay, archive } = build(logs);
    archive.toggle();
    expect(rows(overlay)).toHaveLength(2);

    // Nagrywarka zwolniła miejsce sama — archiwum dowiaduje się o tym dopiero
    // z listy, bo nikt go nie powiadamia.
    logs.shift();
    archive.sync();

    const cache = (archive as unknown as { summaries: Map<string, unknown> }).summaries;
    expect(rows(overlay)).toHaveLength(1);
    expect([...cache.keys()].some((key) => key.startsWith("1:"))).toBe(false);
  });

  test("doczytywane nagranie nie mnoży wpisów w pamięci", () => {
    const logs = [{ id: 1, at: NOW, text: line }];
    const { overlay, archive } = build(logs);
    archive.toggle();

    // Walka trwa i rośnie — klucz cache'u niesie długość tekstu, więc bez
    // sprzątania każdy przyrost zakładałby nowy wpis z pełnym `BattleStats`.
    for (let i = 0; i < 5; i += 1) {
      logs[0]!.text += `\nKamil(100%) uderzył z siłą  +${10 + i}`;
      archive.sync();
      rows(overlay);
    }

    const cache = (archive as unknown as { summaries: Map<string, unknown> }).summaries;
    expect([...cache.keys()].filter((key) => key.startsWith("1:"))).toHaveLength(1);
  });

  test("kliknięcie w ✕ nie wczytuje walki do panelu", () => {
    const logs = [{ id: 1, at: NOW, text: line }];
    const { overlay, archive } = build(logs);
    archive.toggle();

    rows(overlay)[0]!.querySelector<HTMLElement>('[data-action="archive-remove"]')!.click();
    expect(overlay.isPreviewing()).toBe(false);
  });
});

describe("otwarcie archiwum nie zamraża wątku gry", () => {
  /**
   * Nagrywarka licząca odczyty. Odczyt jest tu miarą zastępczą dla `parse` +
   * `aggregate`: podsumowanie liczy się WYŁĄCZNIE po wczytaniu tekstu, więc
   * czego nie wczytano, tego nie sparsowano.
   */
  function countingRecorder(logs: { id: number; at: number; text: string }[]) {
    let reads = 0;
    const recorder: ArchiveRecorder = {
      list: (): Recording[] =>
        logs.map((one) => ({
          id: one.id,
          title: one.text.split("\n")[0] ?? "",
          chars: one.text.length,
          at: one.at,
        })),
      read: (id) => {
        reads += 1;
        return logs.find((one) => one.id === id)?.text ?? null;
      },
    };
    return { recorder, reads: () => reads };
  }

  const many = (count: number, text: string) =>
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      at: NOW - i * 60_000,
      text,
    }));

  const openWith = (logs: { id: number; at: number; text: string }[]) => {
    const { recorder, reads } = countingRecorder(logs);
    const overlay = new Overlay({ storage });
    const archive = new Archive({ recorder, overlay, storage, ticker, now: () => NOW });
    overlay.attachArchive(archive);
    archive.toggle();
    return { overlay, archive, reads };
  };

  test("liczba wczytanych nagrań NIE rośnie z długością listy", async () => {
    const text = await readFixture("2026-07-18_lowca-vs-gnolle-rozdzielanie");

    const few = openWith(many(30, text));
    expect(rows(few.overlay)).toHaveLength(30);
    const afterFew = few.reads();

    ticker = new ManualTicker();
    const lots = openWith(many(120, text));
    expect(rows(lots.overlay)).toHaveLength(120);

    // To jest CAŁA treść naprawy: czterokrotnie dłuższa lista kosztuje przy
    // otwarciu tyle samo. Wcześniej `renderList` czytało i parsowało każde
    // nagranie, więc te dwie liczby dzieliła czwórka.
    expect(lots.reads()).toBe(afterFew);
    // I jest to liczba rzędu widocznej części listy, nie długości archiwum.
    expect(afterFew).toBeLessThan(30);
  });

  test("wiersze spod krawędzi dopełniają się po tyknięciach, do tych samych liczb", async () => {
    const text = await readFixture("2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const stats = aggregate(parse(text));
    const turns = stats.timeline.length;
    const damage = stats.actors.reduce((sum, actor) => sum + actor.damageDealt, 0);

    const { overlay } = openWith(many(30, text));
    const listed = rows(overlay);

    const meta = (row: HTMLElement) => row.querySelector(".archive-meta")!.textContent!;
    // Wiersz spod krawędzi ma na razie samą godzinę — podsumowania nikt nie liczył.
    expect(meta(listed.at(-1)!)).not.toMatch(/obr\./);

    // Tyle tyknięć, żeby porcje pokryły całą listę z zapasem.
    ticker.tick(30);

    for (const row of rows(overlay)) {
      expect(meta(row)).toContain(`${turns} tur`);
      expect(meta(row)).toContain("obr.");
    }
    // Kwota jest ta sama, co przy liczeniu wszystkiego od razu — dopełnianie
    // zmienia MOMENT liczenia, nie wynik.
    expect(meta(rows(overlay).at(-1)!)).toContain(String(damage).slice(0, 2));
  });

  test("dopełnianie zatrzymuje się samo, gdy nie ma już czego liczyć", async () => {
    const text = await readFixture("2026-07-18_lowca-vs-gnolle-rozdzielanie");
    openWith(many(30, text));

    expect(ticker.running).toBe(true);
    ticker.tick(30);
    expect(ticker.running).toBe(false);
  });

  test("destroy zatrzymuje dopełnianie", async () => {
    const text = await readFixture("2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const { archive } = openWith(many(30, text));

    expect(ticker.running).toBe(true);
    archive.destroy();
    expect(ticker.running).toBe(false);
  });

  test("zamknięcie okna też zatrzymuje dopełnianie", async () => {
    // `destroy()` robił to od początku, `toggle()` nie — a zamknięcie okna jest
    // tym gestem, którym użytkownik mówi „skończyłem". Bez tego zegar dolicza
    // dalej listę, której nie ma na ekranie: zmierzone na 190 nagraniach —
    // 182 nagrania i 193 ms w wątku gry PO zniknięciu okna, czyli trzy czwarte
    // kosztu (269 ms), który ta cała ścieżka miała usunąć.
    const text = await readFixture("2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const { archive, reads } = openWith(many(30, text));
    const afterOpen = reads();

    expect(ticker.running).toBe(true);
    archive.toggle();
    expect(ticker.running).toBe(false);

    // Czas płynie dalej — i nic się nie dolicza.
    ticker.tick(30);
    expect(reads()).toBe(afterOpen);
  });

  test("skasowanie jednego nagrania nie unieważnia podsumowań pozostałych", async () => {
    // Stało tu `summaries.clear()`, więc kasowanie jednego wiersza wyrzucało
    // cache CAŁEGO archiwum. `forgetMissing` i tak zdejmuje klucze nagrań,
    // których nie ma już na liście — zawężenie było więc darmowe.
    const text = await readFixture("2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const logs = many(20, text);
    const { recorder, reads } = countingRecorder(logs);
    recorder.remove = (id) => {
      const at = logs.findIndex((one) => one.id === id);
      if (at >= 0) logs.splice(at, 1);
    };
    const overlay = new Overlay({ storage });
    const archive = new Archive({ recorder, overlay, storage, ticker, now: () => NOW });
    overlay.attachArchive(archive);
    archive.toggle();
    ticker.tick(30);
    const afterFill = reads();

    // Pierwszy klik pyta, drugi kasuje — ten sam wzorzec co przy „wyczyść".
    const drop = [...rows(overlay)[0]!.querySelectorAll("button")].at(-1)!;
    drop.click();
    drop.click();
    ticker.tick(30);

    expect(rows(overlay)).toHaveLength(19);
    expect(reads()).toBe(afterFill);
  });

  test("ponowny render nie czyta nagrań, które ma już policzone", async () => {
    const text = await readFixture("2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const { overlay, archive, reads } = openWith(many(30, text));
    ticker.tick(30);
    const afterFill = reads();

    // Zamknięcie i otwarcie buduje WSZYSTKIE wiersze od nowa — a że każdy ma
    // już policzone podsumowanie, żaden nie ma powodu sięgać do magazynu.
    // Gdyby `summaryFor` pytało magazyn przed cache'em, byłby to tu komplet
    // trzydziestu odczytów, i to przy każdym przerysowaniu listy.
    archive.toggle();
    archive.toggle();
    expect(rows(overlay)).toHaveLength(30);

    expect(reads()).toBe(afterFill);
  });
});
