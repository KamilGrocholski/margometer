import { beforeEach, describe, expect, test } from "bun:test";
import { Archive, fightLabel, whenLabel, type ArchiveRecorder } from "../src/archive.ts";
import { Overlay } from "../src/overlay.ts";
import { dekoduj } from "../src/protokol.ts";
import { BEZ_SLOWNIKA } from "../src/slownik-gry.ts";
import { aggregate } from "../src/stats.ts";
import { tytul, type Nagranie, type Recording } from "../src/recorder.ts";
import { ManualTicker } from "./manual-ticker.ts";


/**
 * Materiałem jest PRAWDZIWA walka z gry (`tests/walka-z-gry.ts`), nie zdania
 * złożone w teście. Syntetyczne komunikaty dałoby się napisać krócej, ale wtedy
 * nie wiedzielibyśmy, czy walka w archiwum liczy się tak samo jak walka w grze.
 */
import { KOMUNIKATY, SKLAD } from "./walka-z-gry.ts";
const NAGRANIE: Nagranie = { komunikaty: KOMUNIKATY, sklad: SKLAD };

/**
 * Ta sama walka, uszczuplona o ogon — do testów, gdzie potrzebne są dwa różne
 * nagrania. Skład zostaje, więc różni je wyłącznie długość.
 */
const KROTSZE: Nagranie = { komunikaty: KOMUNIKATY.slice(0, 6), sklad: SKLAD };

/** Słownik jak w teście: `window._t` na stronie gry jest, tutaj go nie ma. */
const oczekiwane = (nagranie: Nagranie) =>
  aggregate(dekoduj(nagranie.komunikaty, nagranie.sklad, BEZ_SLOWNIKA), nagranie.sklad);

type Wpis = { id: number; at: number; nagranie: Nagranie };

const entryOf = (one: Wpis): Recording => ({
  id: one.id,
  title: tytul(one.nagranie.sklad),
  // Ta sama liczba, którą liczy nagrywarka — i klucz cache'u w archiwum.
  chars: JSON.stringify(one.nagranie).length,
  at: one.at,
});

/** Nagrywarka w pamięci — archiwum widzi tylko listę i odczyt. */
function fakeRecorder(logs: Wpis[]): ArchiveRecorder {
  return {
    remove: (id) => {
      const at = logs.findIndex((one) => one.id === id);
      if (at >= 0) logs.splice(at, 1);
    },
    list: () => logs.map(entryOf),
    read: (id) => logs.find((one) => one.id === id)?.nagranie ?? null,
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

const build = (logs: Wpis[]) => {
  const overlay = new Overlay({ storage });
  const archive = new Archive({
    recorder: fakeRecorder(logs),
    overlay,
    storage,
    ticker,
    now: () => NOW,
    slownik: BEZ_SLOWNIKA,
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
  // Tytuł składa dziś NAGRYWARKA ze składu (`recorder.tytul`) i zapisuje gotowy
  // w indeksie — tu zostaje sama obrona przed pustym wpisem. Wcześniej stał
  // w tym miejscu rozbiór zdania „Rozpoczęła się walka pomiędzy…", którego
  // protokół nie musi nieść.
  test("tytuł z indeksu przechodzi bez zmian", () => {
    expect(fightLabel("Kamil vs Regulus")).toBe("Kamil vs Regulus");
  });

  test("pusty tytuł mówi to wprost, zamiast zostawić pusty wiersz", () => {
    expect(fightLabel("")).toBe("walka bez składu");
    expect(fightLabel("   ")).toBe("walka bez składu");
  });

  test("dzisiejsza walka pokazuje samą godzinę, starsza także dzień", () => {
    expect(whenLabel(new Date("2026-07-23T19:04:00").getTime(), NOW)).toBe("19:04");
    expect(whenLabel(new Date("2026-07-22T22:10:00").getTime(), NOW)).toBe("22.07 22:10");
  });
});

describe("okno archiwum", () => {
  test("startuje zamknięte i otwiera się przyciskiem w nagłówku", () => {
    const { overlay, archive } = build([{ id: 1, at: NOW, nagranie: NAGRANIE }]);

    expect(archive.isOpen()).toBe(false);
    expect(overlay.shadow.querySelector(".archive")?.hasAttribute("hidden")).toBe(true);

    button(overlay, "archive")!.click();

    expect(archive.isOpen()).toBe(true);
    expect(overlay.shadow.querySelector(".archive")?.hasAttribute("hidden")).toBe(false);
    expect(button(overlay, "archive")!.getAttribute("aria-pressed")).toBe("true");
  });

  test("zamyka się krzyżykiem i pamięta to między sesjami", () => {
    const first = build([{ id: 1, at: NOW, nagranie: NAGRANIE }]);
    first.archive.toggle();
    button(first.overlay, "archive-close")!.click();
    expect(first.archive.isOpen()).toBe(false);

    first.archive.toggle();
    // Nowa sesja czyta ten sam magazyn — okno wraca otwarte.
    const second = build([{ id: 1, at: NOW, nagranie: NAGRANIE }]);
    expect(second.archive.isOpen()).toBe(true);
    expect(second.overlay.shadow.querySelector(".archive")?.hasAttribute("hidden")).toBe(false);
  });

  test("pusta lista tłumaczy, skąd wziąć nagrania", () => {
    const { overlay, archive } = build([]);
    archive.toggle();

    expect(rows(overlay)).toHaveLength(0);
    expect(overlay.shadow.querySelector(".archive-empty")!.textContent).toContain("⏺");
  });

  test("lista pokazuje skład, czas, tury i wynik, najnowsze na górze", () => {
    const { overlay, archive } = build([
      { id: 1, at: new Date("2026-07-23T18:00:00").getTime(), nagranie: KROTSZE },
      { id: 2, at: new Date("2026-07-23T19:30:00").getTime(), nagranie: NAGRANIE },
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

  test("nazwa wiersza jest tytułem z indeksu, a nie odczytem nagrania", () => {
    // Wcześniej `fillRow` PODMIENIAŁ nazwę na skład wyczytany z logu, więc
    // wiersz spod krawędzi wisiał przez chwilę z inną nazwą niż docelowa.
    const { overlay, archive } = build([{ id: 1, at: NOW, nagranie: NAGRANIE }]);
    archive.toggle();

    expect(rows(overlay)[0]!.querySelector(".archive-name")!.textContent).toBe(tytul(SKLAD));
  });

  test("otwarte okno dokłada nową walkę bez zamykania go", () => {
    const logs: Wpis[] = [{ id: 1, at: NOW, nagranie: NAGRANIE }];
    const { overlay, archive } = build(logs);
    archive.toggle();
    expect(rows(overlay)).toHaveLength(1);

    logs.push({ id: 2, at: NOW, nagranie: KROTSZE });
    // Panel przerysowuje się przy każdej porcji z protokołu — archiwum jedzie z nim.
    overlay.refresh();

    expect(rows(overlay)).toHaveLength(2);
  });
});

describe("wczytywanie walki do panelu", () => {
  test("kliknięcie wiersza pokazuje gotowe statystyki tej walki", () => {
    const { overlay, archive } = build([{ id: 1, at: NOW, nagranie: NAGRANIE }]);
    archive.toggle();

    rows(overlay)[0]!.click();

    expect(overlay.isPreviewing()).toBe(true);
    const expected = oczekiwane(NAGRANIE);
    const shown = [...overlay.shadow.querySelectorAll(".rows .row .label")].map(
      (el) => el.textContent,
    );
    expect(shown).toHaveLength(expected.actors.length);
    // Pasek mówi wprost, że to nie jest trwająca walka.
    expect(overlay.shadow.querySelector(".preview-tag")!.textContent).toBe("PODGLĄD");
    expect(overlay.shadow.querySelector(".preview-head .grow")!.textContent).toContain(
      "z archiwum",
    );
    expect(overlay.shadow.querySelector(".preview-title")!.textContent).toBe(tytul(SKLAD));
  });

  test("podgląd przykrywa licznik na żywo, ale go nie zatrzymuje", () => {
    const live = oczekiwane(NAGRANIE);
    const { overlay, archive } = build([{ id: 1, at: NOW, nagranie: KROTSZE }]);
    archive.toggle();
    rows(overlay)[0]!.click();

    const previewed = [...overlay.shadow.querySelectorAll(".rows .row .label")].map(
      (el) => el.textContent,
    );
    // Gra leci dalej — panel ma pokazywać nagranie mimo świeżych danych.
    overlay.render(live);
    expect([...overlay.shadow.querySelectorAll(".rows .row .label")].map((el) => el.textContent))
      .toEqual(previewed);

    button(overlay, "exit-preview")!.click();

    expect(overlay.isPreviewing()).toBe(false);
    expect(overlay.shadow.querySelector(".preview-bar")).toBeNull();
    // Po wyjściu widać to, co narosło w międzyczasie.
    expect(overlay.shadow.querySelectorAll(".rows .row")).toHaveLength(live.actors.length);
  });

  test("wybrany wiersz jest zaznaczony na liście", () => {
    const { overlay, archive } = build([{ id: 1, at: NOW, nagranie: NAGRANIE }]);
    archive.toggle();

    rows(overlay)[0]!.click();

    expect(rows(overlay)[0]!.className).toContain("is-open");
  });
});

describe("odtwarzanie", () => {
  const loadReplay = () => {
    const { overlay, archive } = build([{ id: 1, at: NOW, nagranie: NAGRANIE }]);
    archive.toggle();
    button(overlay, "archive-play")!.click();
    return { overlay, archive };
  };

  test("startuje od zera, a nie od gotowego wyniku", () => {
    const { overlay } = loadReplay();

    expect(overlay.isPreviewing()).toBe(true);
    // Wiersze SĄ — skład walki stoi w rankingu od pierwszej klatki, bo brak
    // wiersza czyta się jak „nie ma takiej postaci", a nie „jeszcze nic nie
    // zrobiła" (`overlay.renderRows`). Do 2026‑08‑04 było ich tu zero, bo
    // archiwum liczyło agregat BEZ składu i nikt nie był „w składzie".
    const wartosci = [...overlay.shadow.querySelectorAll(".rows .row .value")].map(
      (el) => el.textContent,
    );
    expect(wartosci.length).toBeGreaterThan(0);
    // Zerowa jest KAŻDA — o to chodzi w „od zera".
    expect(wartosci.every((value) => /^0\b/.test(value ?? ""))).toBe(true);
    expect(button(overlay, "replay-toggle")!.textContent).toBe("⏸");
    expect(ticker.running).toBe(true);
  });

  test("kolejne klatki dokładają obrażeń", () => {
    const { overlay } = loadReplay();
    const damage = () => {
      const value = overlay.shadow.querySelector(".rows .row .value")?.textContent ?? "0";
      return Number(value.split("(")[0]!.replace(/\D/g, ""));
    };

    ticker.tick(6);
    const early = damage();
    ticker.tick(KOMUNIKATY.length - 6);

    expect(early).toBeGreaterThan(0);
    expect(damage()).toBeGreaterThan(early);
    expect(overlay.shadow.querySelector(".replay-label")!.textContent).toMatch(/^tura \d+\/\d+$/);
  });

  test("pauza zatrzymuje zegar, wznowienie go wraca", () => {
    const { overlay } = loadReplay();

    button(overlay, "replay-toggle")!.click();
    expect(ticker.running).toBe(false);
    expect(button(overlay, "replay-toggle")!.textContent).toBe("▶");

    button(overlay, "replay-toggle")!.click();
    expect(ticker.running).toBe(true);
  });

  test("prędkość chodzi w kółko i skraca odstęp", () => {
    const { overlay } = loadReplay();
    const base = ticker.everyMs;

    button(overlay, "replay-speed")!.click();
    expect(button(overlay, "replay-speed")!.textContent).toBe("2×");
    expect(ticker.everyMs).toBe(base / 2);

    button(overlay, "replay-speed")!.click();
    expect(button(overlay, "replay-speed")!.textContent).toBe("4×");
    button(overlay, "replay-speed")!.click();
    expect(button(overlay, "replay-speed")!.textContent).toBe("1×");
  });

  test("dobiegnięcie do końca zatrzymuje odtwarzanie na pełnym wyniku", () => {
    const { overlay } = loadReplay();

    ticker.tick(KOMUNIKATY.length + 5);

    expect(ticker.running).toBe(false);
    expect(overlay.shadow.querySelectorAll(".rows .row")).toHaveLength(
      oczekiwane(NAGRANIE).actors.length,
    );
    expect((overlay.shadow.querySelector(".replay-fill") as HTMLElement).style.width).toBe("100%");
  });

  test("żadna klatka nie zapala ostrzeżenia o nierozpoznanym materiale", () => {
    // Przy tekście krok po LINII potrafił stanąć MIĘDZY „uderzył" a „otrzymał",
    // więc parser zgłaszał niedomknięty cios i stopka mrugała co drugą klatkę.
    // Protokół takiego stanu nie ma — jeden komunikat niesie CAŁY blok — więc
    // prefiks komunikatów jest zawsze domknięty. Ten test pilnuje, że tak
    // zostanie: gdyby dekoder zaczął zgłaszać `unknown` na pół-akcji, zapali się.
    const { overlay } = loadReplay();

    for (let i = 0; i < KOMUNIKATY.length; i += 1) {
      ticker.tick(1);
      expect(overlay.shadow.querySelector(".warn")).toBeNull();
    }
  });

  test("wejście w inną walkę gasi poprzednie odtwarzanie", () => {
    const { overlay, archive } = build([
      { id: 1, at: NOW, nagranie: NAGRANIE },
      { id: 2, at: NOW - 1000, nagranie: KROTSZE },
    ]);
    archive.toggle();
    overlay.shadow.querySelector<HTMLElement>('[data-recording="1"] [data-action="archive-play"]')!
      .click();

    overlay.shadow.querySelector<HTMLElement>('[data-recording="2"]')!.click();

    expect(ticker.running).toBe(false);
    expect(overlay.shadow.querySelector(".replay")).toBeNull();
  });

  test("wyjście z podglądu zatrzymuje zegar", () => {
    const { overlay } = loadReplay();

    button(overlay, "exit-preview")!.click();

    expect(ticker.running).toBe(false);
    expect(overlay.isPreviewing()).toBe(false);
  });
});

describe("kasowanie pojedynczego nagrania", () => {
  test("pierwszy klik pyta, drugi kasuje", () => {
    // Jedyną drogą usunięcia czegokolwiek było "wyczyść" w panelu, które kasuje
    // WSZYSTKO — `Recorder.drop` istniał od początku, tylko nic go nie wystawiało.
    const logs: Wpis[] = [
      { id: 1, at: NOW, nagranie: KROTSZE },
      { id: 2, at: NOW, nagranie: NAGRANIE },
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
    const { overlay, archive } = build([{ id: 1, at: NOW, nagranie: NAGRANIE }]);
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
      const logs: Wpis[] = [
        { id: 1, at: NOW, nagranie: KROTSZE },
        { id: 2, at: NOW, nagranie: NAGRANIE },
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

  // Kliknięcie w wiersz nagrania, którego treści nie ma, wychodziło dotąd cichym
  // `return` — klik wyglądał jak awaria przycisku, a był poprawną odmową.
  describe("kliknięcie, które nic nie robi, mówi dlaczego", () => {
    const notice = (overlay: Overlay) =>
      overlay.shadow.querySelector(".archive-notice")?.textContent ?? null;

    /** Indeks obiecuje nagranie, a klucza pod nim nie ma — `read` zwraca null. */
    const zGubionymNagraniem = () => {
      const overlay = new Overlay({ storage });
      const archive = new Archive({
        recorder: {
          list: () => [{ id: 1, title: "Kamil vs Wilk", chars: 200, at: NOW }],
          read: () => null,
        },
        overlay,
        storage,
        ticker,
        now: () => NOW,
        slownik: BEZ_SLOWNIKA,
      });
      overlay.attachArchive(archive);
      archive.toggle();
      return { overlay, archive };
    };

    test("wiersz nagrania, którego treść zniknęła, nie milczy", () => {
      const { overlay } = zGubionymNagraniem();

      rows(overlay)[0]!.click();

      expect(notice(overlay)).toBe("Tego nagrania już nie ma w pamięci przeglądarki.");
      expect(overlay.isPreviewing()).toBe(false);
    });

    test("„odtwórz” na takim wierszu też nie milczy", () => {
      const { overlay } = zGubionymNagraniem();

      button(overlay, "archive-play")!.click();

      expect(notice(overlay)).toBe("Tego nagrania już nie ma w pamięci przeglądarki.");
      expect(overlay.isPreviewing()).toBe(false);
    });

    test("odpowiedź gaśnie sama, żeby okno nie stało się listą odmów", () => {
      const { overlay } = zGubionymNagraniem();
      rows(overlay)[0]!.click();
      expect(notice(overlay)).not.toBeNull();

      ticker.tick();

      expect(notice(overlay)).toBeNull();
    });

    test("gest, który się udał, nie zostawia odpowiedzi", () => {
      const { overlay, archive } = build([{ id: 1, at: NOW, nagranie: NAGRANIE }]);
      archive.toggle();

      rows(overlay)[0]!.click();

      expect(notice(overlay)).toBeNull();
      expect(overlay.isPreviewing()).toBe(true);
    });
  });

  // Kasowanie ręczne czyściło cache w całości, ale EKSMISJA po przekroczeniu
  // budżetu dzieje się w nagrywarce i archiwum się o niej nie dowiaduje —
  // podsumowanie skasowanego nagrania zostawało w pamięci do końca sesji.
  test("nagranie wyeksmitowane przez nagrywarkę znika też z pamięci archiwum", () => {
    const logs: Wpis[] = [
      { id: 1, at: NOW, nagranie: KROTSZE },
      { id: 2, at: NOW, nagranie: NAGRANIE },
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
    const logs: Wpis[] = [{ id: 1, at: NOW, nagranie: { komunikaty: [], sklad: SKLAD } }];
    const { overlay, archive } = build(logs);
    archive.toggle();

    // Walka trwa i rośnie — klucz cache'u niesie rozmiar nagrania, więc bez
    // sprzątania każdy przyrost zakładałby nowy wpis z pełnym `BattleStats`.
    for (let i = 0; i < 5; i += 1) {
      logs[0]!.nagranie = {
        komunikaty: KOMUNIKATY.slice(0, i + 1),
        sklad: SKLAD,
      };
      archive.sync();
      // `sync` porównuje same identyfikatory, a te się nie zmieniły — listę
      // trzeba przebudować ręcznie, tak jak robi to panel po każdej porcji.
      overlay.refresh();
      rows(overlay);
    }

    const cache = (archive as unknown as { summaries: Map<string, unknown> }).summaries;
    expect([...cache.keys()].filter((key) => key.startsWith("1:"))).toHaveLength(1);
  });

  test("kliknięcie w „usuń” nie wczytuje walki do panelu", () => {
    const { overlay, archive } = build([{ id: 1, at: NOW, nagranie: NAGRANIE }]);
    archive.toggle();

    rows(overlay)[0]!.querySelector<HTMLElement>('[data-action="archive-remove"]')!.click();
    expect(overlay.isPreviewing()).toBe(false);
  });
});

describe("wygląd obu okien idzie z jednego arkusza", () => {
  test("doczepienie archiwum nie dokłada drugiego arkusza", () => {
    // Do 2026‑08‑02 archiwum wstrzykiwało własny `<style>` do TEGO SAMEGO
    // shadow roota. Dwa arkusze w jednym zasięgu nie dają drugiemu oknu
    // własnego stylu — dają złudzenie, że je ma, a w praktyce chrome powielało
    // się z innym kryciem tła i `.row` było „zajęte" przez panel.
    const { overlay } = build([]);
    expect(overlay.shadow.querySelectorAll("style")).toHaveLength(1);
    expect(overlay.shadow.querySelector("style")!.textContent).toContain(".archive-row");
  });
});

describe("otwarcie archiwum nie zamraża wątku gry", () => {
  /**
   * Nagrywarka licząca odczyty. Odczyt jest tu miarą zastępczą dla `dekoduj` +
   * `aggregate`: podsumowanie liczy się WYŁĄCZNIE po wczytaniu nagrania, więc
   * czego nie wczytano, tego nie policzono.
   */
  function countingRecorder(logs: Wpis[]) {
    let reads = 0;
    const recorder: ArchiveRecorder = {
      list: () => logs.map(entryOf),
      read: (id) => {
        reads += 1;
        return logs.find((one) => one.id === id)?.nagranie ?? null;
      },
    };
    return { recorder, reads: () => reads };
  }

  const many = (count: number): Wpis[] =>
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      at: NOW - i * 60_000,
      nagranie: NAGRANIE,
    }));

  const openWith = (logs: Wpis[]) => {
    const { recorder, reads } = countingRecorder(logs);
    const overlay = new Overlay({ storage });
    const archive = new Archive({
      recorder,
      overlay,
      storage,
      ticker,
      now: () => NOW,
      slownik: BEZ_SLOWNIKA,
    });
    overlay.attachArchive(archive);
    archive.toggle();
    return { overlay, archive, reads };
  };

  test("liczba wczytanych nagrań NIE rośnie z długością listy", () => {
    const few = openWith(many(30));
    expect(rows(few.overlay)).toHaveLength(30);
    const afterFew = few.reads();

    ticker = new ManualTicker();
    const lots = openWith(many(120));
    expect(rows(lots.overlay)).toHaveLength(120);

    // To jest CAŁA treść naprawy: czterokrotnie dłuższa lista kosztuje przy
    // otwarciu tyle samo. Wcześniej `renderList` czytało i liczyło każde
    // nagranie, więc te dwie liczby dzieliła czwórka.
    expect(lots.reads()).toBe(afterFew);
    // I jest to liczba rzędu widocznej części listy, nie długości archiwum.
    expect(afterFew).toBeLessThan(30);
  });

  test("wiersze spod krawędzi dopełniają się po tyknięciach, do tych samych liczb", () => {
    const stats = oczekiwane(NAGRANIE);
    const turns = stats.timeline.length;
    const damage = stats.actors.reduce((sum, actor) => sum + actor.damageDealt, 0);

    const { overlay } = openWith(many(30));
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

  test("dopełnianie zatrzymuje się samo, gdy nie ma już czego liczyć", () => {
    openWith(many(30));

    expect(ticker.running).toBe(true);
    ticker.tick(30);
    expect(ticker.running).toBe(false);
  });

  test("destroy zatrzymuje dopełnianie", () => {
    const { archive } = openWith(many(30));

    expect(ticker.running).toBe(true);
    archive.destroy();
    expect(ticker.running).toBe(false);
  });

  test("zamknięcie okna też zatrzymuje dopełnianie", () => {
    // `destroy()` robił to od początku, `toggle()` nie — a zamknięcie okna jest
    // tym gestem, którym użytkownik mówi „skończyłem". Bez tego zegar dolicza
    // dalej listę, której nie ma na ekranie: zmierzone na 190 nagraniach —
    // 182 nagrania i 193 ms w wątku gry PO zniknięciu okna, czyli trzy czwarte
    // kosztu (269 ms), który ta cała ścieżka miała usunąć.
    const { archive, reads } = openWith(many(30));
    const afterOpen = reads();

    expect(ticker.running).toBe(true);
    archive.toggle();
    expect(ticker.running).toBe(false);

    // Czas płynie dalej — i nic się nie dolicza.
    ticker.tick(30);
    expect(reads()).toBe(afterOpen);
  });

  test("skasowanie jednego nagrania nie unieważnia podsumowań pozostałych", () => {
    // Stało tu `summaries.clear()`, więc kasowanie jednego wiersza wyrzucało
    // cache CAŁEGO archiwum. `forgetMissing` i tak zdejmuje klucze nagrań,
    // których nie ma już na liście — zawężenie było więc darmowe.
    const logs = many(20);
    const { recorder, reads } = countingRecorder(logs);
    recorder.remove = (id) => {
      const at = logs.findIndex((one) => one.id === id);
      if (at >= 0) logs.splice(at, 1);
    };
    const overlay = new Overlay({ storage });
    const archive = new Archive({
      recorder,
      overlay,
      storage,
      ticker,
      now: () => NOW,
      slownik: BEZ_SLOWNIKA,
    });
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

  test("ponowny render nie czyta nagrań, które ma już policzone", () => {
    const { overlay, archive, reads } = openWith(many(30));
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
