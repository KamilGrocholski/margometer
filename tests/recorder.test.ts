import { beforeEach, describe, expect, test } from "bun:test";
import { Recorder, splitRawFights, type RecorderStorage } from "../src/recorder.ts";

const FIXTURES = new URL("./fixtures/", import.meta.url).pathname;
const readFixture = (name: string) => Bun.file(`${FIXTURES}${name}/raw.txt`).text();

/** Magazyn w pamięci — z opcjonalnym limitem, żeby dało się wywołać przepełnienie. */
class FakeStorage implements RecorderStorage {
  readonly data = new Map<string, string>();
  /** null = bez limitu. Liczone w znakach, jak budżet nagrywarki. */
  limit: number | null = null;

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.limit !== null && this.used(key) + value.length > this.limit) {
      throw new DOMException("pełno", "QuotaExceededError");
    }
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  // Prawdziwy `Storage` daje przeglądanie kluczy i po tym nagrywarka poznaje
  // nagrania osierocone przez indeks. Atrapa musi to umieć, inaczej testy
  // omijałyby całą ścieżkę sprzątania.
  get length(): number {
    return this.data.size;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  /** Zajętość bez klucza, który właśnie nadpisujemy. */
  private used(without: string): number {
    let total = 0;
    for (const [key, value] of this.data) if (key !== without) total += value.length;
    return total;
  }

  logs(): string[] {
    return [...this.data]
      .filter(([key]) => /^margometer\.rec\.\d+$/.test(key))
      .map(([, value]) => value);
  }
}

const FIGHT_A = [
  "Rozpoczęła się walka pomiędzy Kamil(100h) a Wilk(80x)",
  "Kamil(100%) uderzył z siłą +120 Wilk",
  "Wilk(70%) otrzymał(a) -100 obrażeń",
].join("\n");

const FIGHT_B = [
  "Rozpoczęła się walka pomiędzy Kamil(100h) a Gnoll(90x)",
  "Kamil(100%) uderzył z siłą +200 Gnoll",
].join("\n");

let storage: FakeStorage;
let clock: number;
const recorder = (options: { budgetChars?: number } = {}) =>
  new Recorder({ storage, now: () => (clock += 1000), ...options });

beforeEach(() => {
  storage = new FakeStorage();
  clock = 1_700_000_000_000;
});

describe("dzielenie bufora na walki", () => {
  test("tnie po linii rozpoczęcia", () => {
    expect(splitRawFights(`${FIGHT_A}\n${FIGHT_B}`)).toEqual([FIGHT_A, FIGHT_B]);
  });

  test("zdublowana linia rozpoczęcia nie otwiera drugiej walki", () => {
    const start = FIGHT_A.split("\n")[0]!;
    expect(splitRawFights(`${start}\n${FIGHT_A}`)).toHaveLength(1);
  });

  test("walka skończona na samym nagłówku nie skleja się z następną", () => {
    // Nagłówek INNEJ walki nie jest dublem, choćby poprzednia nie miała nic
    // poza swoim — inaczej dwie walki wpadały do jednego nagrania.
    const stub = FIGHT_A.split("\n")[0]!;
    expect(splitRawFights(`${stub}\n${FIGHT_B}`)).toEqual([stub, FIGHT_B]);
  });

  // Sesja rozstrzyga duplikat nagłówka po SKŁADZIE odczytanym przez parser,
  // czyli po zdjęciu bbcode'u i zwinięciu odstępów. Nagrywarka porównywała
  // surowy tekst dosłownie, więc wystarczyło, że gra rozjechała `[b]`, i obie
  // strony dawały inną odpowiedź: panel widział jedną walkę, archiwum
  // zapisywało dwie, w tym jedną śmieciową.
  test("rozjechany bbcode nie rozcina walki na dwa nagrania", () => {
    const head = "Rozpoczęła się walka pomiędzy Kamil Kazrek (70h) a Regulus (63w)";
    expect(splitRawFights(`[b]${head}[/b]\n[b]${head}\n[/b]`)).toHaveLength(1);
  });

  test("inne odstępy w nagłówku to nadal ta sama walka", () => {
    const head = "Rozpoczęła się walka pomiędzy Kamil Kazrek (70h) a Regulus (63w)";
    expect(splitRawFights(`${head}\nRozpoczęła się walka pomiędzy  Kamil Kazrek (70h)  a Regulus (63w)`)).toHaveLength(1);
  });

  test("nagranie zostaje SUROWE — normalizacja dotyczy tylko porównania", () => {
    const head = "[b]Rozpoczęła się walka pomiędzy Kamil Kazrek (70h) a Regulus (63w)[/b]";
    expect(splitRawFights(head)).toEqual([head]);
  });

  test("ogon bez linii rozpoczęcia zostaje jedną walką", () => {
    const tail = FIGHT_A.split("\n").slice(1).join("\n");
    expect(splitRawFights(tail)).toEqual([tail]);
  });
});

describe("nagrywanie", () => {
  test("wyłączone nie zapisuje niczego", () => {
    const rec = recorder();

    rec.capture(FIGHT_A);

    expect(rec.count()).toBe(0);
    expect(storage.logs()).toEqual([]);
  });

  test("po włączeniu zapisuje walkę i liczy ją w indeksie", () => {
    const rec = recorder();
    rec.toggle();

    rec.capture(FIGHT_A);

    expect(rec.isRecording()).toBe(true);
    expect(rec.count()).toBe(1);
    expect(storage.logs()).toEqual([FIGHT_A]);
    expect(rec.chars()).toBe(FIGHT_A.length);
  });

  test("doczytana walka nadpisuje wpis zamiast zakładać drugi", () => {
    const rec = recorder();
    rec.toggle();

    rec.capture(FIGHT_A);
    const grown = `${FIGHT_A}\nKamil(100%) uderzył z siłą +130 Wilk`;
    rec.capture(grown);

    expect(rec.count()).toBe(1);
    expect(storage.logs()).toEqual([grown]);
  });

  test("druga walka w buforze to osobne nagranie", () => {
    const rec = recorder();
    rec.toggle();

    rec.capture(FIGHT_A);
    rec.capture(`${FIGHT_A}\n${FIGHT_B}`);

    expect(rec.count()).toBe(2);
    expect(storage.logs()).toEqual([FIGHT_A, FIGHT_B]);
  });

  test("przycięty od góry bufor dokleja się do nagrania, nie dubluje go", () => {
    const rec = recorder();
    rec.toggle();

    rec.capture(FIGHT_A);
    // Gra wyrzuciła nagłówek z okna, a na dole dorosła kolejna linia.
    const trimmed = [...FIGHT_A.split("\n").slice(1), "Wilk(70%) uderzył z siłą +40 Kamil"].join(
      "\n",
    );
    rec.capture(trimmed);

    expect(rec.count()).toBe(1);
    expect(storage.logs()[0]).toBe(`${FIGHT_A}\nWilk(70%) uderzył z siłą +40 Kamil`);
  });

  test("ta sama walka od nowa po wyczyszczeniu logu to nowe nagranie", () => {
    const rec = recorder();
    rec.toggle();

    rec.capture(`${FIGHT_A}\nKamil(100%) uderzył z siłą +130 Wilk`);
    // Gra wyczyściła okno i bijemy to samo jeszcze raz — krócej niż poprzednio.
    rec.capture(FIGHT_A);

    expect(rec.count()).toBe(2);
  });

  test("wyłączenie i włączenie zaczyna nowe nagranie tej samej walki", () => {
    const rec = recorder();
    rec.toggle();
    rec.capture(FIGHT_A);

    rec.toggle();
    rec.toggle();
    rec.capture(FIGHT_A);

    expect(rec.isRecording()).toBe(true);
    expect(rec.count()).toBe(2);
  });

  test("stan nagrywania przeżywa odświeżenie strony", () => {
    recorder().toggle();

    expect(recorder().isRecording()).toBe(true);
  });

  test("nagrania przeżywają odświeżenie strony", () => {
    const first = recorder();
    first.toggle();
    first.capture(FIGHT_A);

    const second = recorder();

    expect(second.count()).toBe(1);
    expect(second.dump()).toContain(FIGHT_A);
  });

  test("kolejne nagranie po odświeżeniu nie nadpisuje poprzedniego", () => {
    const first = recorder();
    first.toggle();
    first.capture(FIGHT_A);

    const second = recorder();
    second.capture(FIGHT_B);

    expect(second.count()).toBe(2);
    expect(storage.logs()).toEqual([FIGHT_A, FIGHT_B]);
  });
});

describe("budżet magazynu", () => {
  test("po przekroczeniu budżetu wypadają najstarsze nagrania", () => {
    const rec = recorder({ budgetChars: FIGHT_A.length + 10 });
    rec.toggle();

    rec.capture(FIGHT_A);
    rec.capture(`${FIGHT_A}\n${FIGHT_B}`);

    expect(rec.count()).toBe(1);
    expect(storage.logs()).toEqual([FIGHT_B]);
  });

  test("bieżąca walka nigdy nie leci jako pierwsza", () => {
    const rec = recorder({ budgetChars: 1 });
    rec.toggle();

    rec.capture(FIGHT_A);

    expect(storage.logs()).toEqual([FIGHT_A]);
  });

  test("pełny magazyn gry zwalnia miejsce po naszej stronie", async () => {
    const rec = recorder();
    rec.toggle();
    rec.capture(FIGHT_A);
    // Coś innego (gra) zajęło resztę kubełka.
    storage.limit = storage.getItem("margometer.rec.index")!.length + FIGHT_B.length + 200;

    rec.capture(`${FIGHT_A}\n${FIGHT_B}`);

    expect(rec.isRecording()).toBe(true);
    expect(storage.logs()).toEqual([FIGHT_B]);
  });

  test("gdy zwolnienie wszystkiego nie pomaga, nagrywanie gaśnie", () => {
    const rec = recorder();
    rec.toggle();
    storage.limit = 1;

    rec.capture(FIGHT_A);

    expect(rec.isFailed()).toBe(true);
    expect(rec.isRecording()).toBe(false);
    expect(storage.logs()).toEqual([]);
  });
});

describe("odczyt nagrań", () => {
  test("dump skleja walki z nagłówkami", () => {
    const rec = recorder();
    rec.toggle();
    rec.capture(`${FIGHT_A}\n${FIGHT_B}`);

    const dump = rec.dump() ?? "";

    expect(dump).toContain(FIGHT_A);
    expect(dump).toContain(FIGHT_B);
    expect(dump.match(/=== walka \d+ · /g)).toHaveLength(2);
  });

  test("dump bez nagrań to null", () => {
    expect(recorder().dump()).toBeNull();
  });

  test("clear kasuje nagrania i klucze", () => {
    const rec = recorder();
    rec.toggle();
    rec.capture(`${FIGHT_A}\n${FIGHT_B}`);

    rec.clear();

    expect(rec.count()).toBe(0);
    expect(storage.logs()).toEqual([]);
    expect(rec.dump()).toBeNull();
  });

  test("po wyczyszczeniu dalsze nagrywanie działa", () => {
    const rec = recorder();
    rec.toggle();
    rec.capture(FIGHT_A);
    rec.clear();

    rec.capture(FIGHT_B);

    expect(rec.count()).toBe(1);
    expect(storage.logs()).toEqual([FIGHT_B]);
  });
});

describe("na prawdziwym logu", () => {
  test("nagranie jest znak w znak tym, co dostał parser", async () => {
    const text = await readFixture("new-engine/2026-07-22_lowca-tropiciel-vs-regulus-grupowa");
    const rec = recorder();
    rec.toggle();

    // Log dochodzi po kawałku, tak jak w grze.
    const lines = text.split("\n");
    for (let i = 1; i <= lines.length; i += 1) rec.capture(lines.slice(0, i).join("\n"));

    const recorded = storage.logs().join("\n");
    const expected = lines.filter((line) => line.trim() !== "").join("\n");
    expect(recorded).toBe(expected);
  });
});

describe("walka przerwana odświeżeniem strony", () => {
  test("nagranie w toku jest kontynuowane, a nie zakładane od nowa", () => {
    // `on` przeżywa F5, ale wiedza o tym, KTÓRA walka trwa, siedziała tylko
    // w pamięci — pierwszy capture po odświeżeniu nie miał czego dopasować
    // i zakładał drugie nagranie, którego prefiksem było pierwsze.
    const first = recorder();
    first.toggle();
    first.capture(FIGHT_A);
    expect(first.count()).toBe(1);

    const after = recorder();
    expect(after.isRecording()).toBe(true);
    after.capture(`${FIGHT_A}\nWilk(70%) uderzył z siłą +50 Kamil`);

    expect(after.count()).toBe(1);
    expect(storage.logs()).toHaveLength(1);
    expect(storage.logs()[0]).toContain("Wilk(70%) uderzył z siłą +50 Kamil");
  });

  test("nowa walka po odświeżeniu dostaje własne nagranie", () => {
    const first = recorder();
    first.toggle();
    first.capture(FIGHT_A);

    const after = recorder();
    after.capture(`${FIGHT_A}\n${FIGHT_B}`);

    expect(after.count()).toBe(2);
    expect(storage.logs()).toEqual([FIGHT_A, FIGHT_B]);
  });
});

describe("ostatnia linia rosnąca w miejscu", () => {
  test("dopisanie liczby do tej samej linii nie rozcina nagrania", () => {
    // Gra trzyma cały blok ataku w JEDNYM węźle: tekst i liczby obrażeń stoją
    // w tej samej linii, a zmiany przychodzą po mikrotasku. Dwie mutacje
    // w różnych taskach dawały bufor z dłuższą wersją ostatniej linii.
    const rec = recorder();
    rec.toggle();
    rec.capture("Rozpoczęła się walka pomiędzy Kamil(100h) a Wilk(80x)\nKamil(100%) uderzył z siłą");
    rec.capture(
      "Rozpoczęła się walka pomiędzy Kamil(100h) a Wilk(80x)\nKamil(100%) uderzył z siłą +120 Wilk",
    );

    expect(rec.count()).toBe(1);
    expect(storage.logs()[0]).toContain("+120 Wilk");
    // Urwana wersja linii nie może zostać obok pełnej.
    expect(storage.logs()[0]!.split("\n")).toHaveLength(2);
  });
});

describe("zepsuty indeks w magazynie", () => {
  test("wpis bez rozmiaru nie zabija eksmisji", () => {
    // `chars: undefined` dawało `chars() === NaN`, a `NaN > budżet` jest
    // fałszem — limit magazynu znikał po cichu, razem z jedyną ochroną
    // kubełka, który dzielimy z grą.
    storage.setItem(
      "margometer.rec.index",
      JSON.stringify({ v: 1, next: 2, fights: [{ id: 1, title: "stara" }] }),
    );

    const rec = recorder({ budgetChars: FIGHT_A.length + 10 });
    expect(rec.count()).toBe(0);
    expect(Number.isFinite(rec.chars())).toBe(true);

    rec.toggle();
    rec.capture(FIGHT_A);
    rec.capture(`${FIGHT_A}\n${FIGHT_B}`);
    expect(rec.chars()).toBeLessThanOrEqual(FIGHT_A.length + 10);
  });

  test("indeks w nieznanej wersji jest odrzucany, nie zgadywany", () => {
    storage.setItem(
      "margometer.rec.index",
      JSON.stringify({ v: 2, next: 5, fights: [{ id: 1, title: "x", chars: 10, at: 1 }] }),
    );
    expect(recorder().count()).toBe(0);
  });

  test("nowe nagranie nie nadpisuje istniejącego, gdy `next` kłamie", () => {
    storage.setItem("margometer.rec.7", FIGHT_A);
    storage.setItem(
      "margometer.rec.index",
      JSON.stringify({
        v: 1,
        next: 1,
        fights: [{ id: 7, title: "stara", chars: FIGHT_A.length, at: 1 }],
      }),
    );

    const rec = recorder();
    rec.toggle();
    rec.capture(FIGHT_B);

    expect(rec.list().map((one) => one.id)).toEqual([7, 8]);
    expect(storage.logs()).toEqual([FIGHT_A, FIGHT_B]);
  });
});

describe("nagrania osierocone przez indeks", () => {
  // Uszkodzony indeks zwracał pusty stan, ale teksty walk zostawały
  // w magazynie NA ZAWSZE: `clear()` chodzi po indeksie, więc ich nie widział,
  // `chars()` raportował zero, a `evict()` uważał, że jest miejsce. Do ~1 MB
  // znikało z kubełka dzielonego z GRĄ.
  const orphanKeys = () => [...storage.data.keys()].filter((key) => /\.\d+$/.test(key));

  test("indeks w nieznanej wersji zabiera ze sobą swoje nagrania", () => {
    storage.setItem("margometer.rec.1", FIGHT_A);
    storage.setItem("margometer.rec.2", FIGHT_B);
    storage.setItem("margometer.rec.index", JSON.stringify({ v: 2, next: 9, fights: [] }));

    const rec = recorder();

    expect(rec.count()).toBe(0);
    expect(orphanKeys()).toEqual([]);
  });

  test("indeks nie do odczytania też", () => {
    storage.setItem("margometer.rec.1", FIGHT_A);
    storage.setItem("margometer.rec.index", "{to nie jest JSON");

    recorder();

    expect(orphanKeys()).toEqual([]);
  });

  test("brak indeksu przy istniejących nagraniach to też sieroty", () => {
    storage.setItem("margometer.rec.1", FIGHT_A);

    recorder();

    expect(orphanKeys()).toEqual([]);
  });

  test("wpis odrzucony przez walidację zabiera swój tekst, reszta zostaje", () => {
    storage.setItem("margometer.rec.1", FIGHT_A);
    storage.setItem("margometer.rec.2", FIGHT_B);
    storage.setItem(
      "margometer.rec.index",
      JSON.stringify({
        v: 1,
        next: 3,
        // Drugi wpis bez `chars` — `isRecording` go odrzuci.
        fights: [
          { id: 1, title: "dobra", chars: FIGHT_A.length, at: 1 },
          { id: 2, title: "kaleka" },
        ],
      }),
    );

    const rec = recorder();

    expect(rec.list().map((one) => one.id)).toEqual([1]);
    expect(orphanKeys()).toEqual(["margometer.rec.1"]);
  });

  test("znacznik nagrywania nie jest sierotą, mimo tego samego prefiksu", () => {
    const rec = recorder();
    rec.toggle();
    expect(storage.getItem("margometer.rec.on")).toBe("1");

    storage.setItem("margometer.rec.index", JSON.stringify({ v: 2, next: 1, fights: [] }));
    recorder();

    expect(storage.getItem("margometer.rec.on")).toBe("1");
  });

  test("wyczyszczenie obejmuje także to spoza indeksu", () => {
    const rec = recorder();
    rec.toggle();
    rec.capture(FIGHT_A);
    storage.setItem("margometer.rec.999", FIGHT_B);

    rec.clear();

    expect(orphanKeys()).toEqual([]);
  });

  test("magazyn bez przeglądania kluczy działa jak dotąd", () => {
    // Atrapy bez `key`/`length` (i stare przeglądarki) mają po prostu nie
    // sprzątać, zamiast się wywracać.
    const blind = {
      getItem: (key: string) => storage.getItem(key),
      setItem: (key: string, value: string) => storage.setItem(key, value),
      removeItem: (key: string) => storage.removeItem(key),
    };
    storage.setItem("margometer.rec.1", FIGHT_A);
    storage.setItem("margometer.rec.index", JSON.stringify({ v: 2, next: 9, fights: [] }));

    const rec = new Recorder({ storage: blind, now: () => 1 });

    expect(rec.count()).toBe(0);
    expect(storage.getItem("margometer.rec.1")).toBe(FIGHT_A);
  });
});

describe("wygaszenie nagrywania przeżywa odświeżenie", () => {
  test("brak miejsca gasi nagrywanie NA TRWAŁE", () => {
    const rec = recorder();
    rec.toggle();
    rec.capture(FIGHT_A);

    // Od teraz magazyn odmawia wszystkiego — zwolnienie miejsca nie pomoże.
    storage.limit = 0;
    rec.capture(FIGHT_B);

    expect(rec.isRecording()).toBe(false);
    expect(rec.isFailed()).toBe(true);

    // Znacznik zostawał na "1", więc po F5 nagrywanie wracało WŁĄCZONE,
    // a komunikat o braku miejsca znikał razem z `failed`.
    storage.limit = null;
    expect(new Recorder({ storage, now: () => 1 }).isRecording()).toBe(false);
  });

  test("ręczne wyłączenie też przeżywa", () => {
    const rec = recorder();
    rec.toggle();
    expect(new Recorder({ storage, now: () => 1 }).isRecording()).toBe(true);

    rec.toggle();
    expect(new Recorder({ storage, now: () => 1 }).isRecording()).toBe(false);
  });
});

describe("indeks nie leci do magazynu przy każdej linii", () => {
  /** Liczy zapisy pod klucz indeksu — to on był przepisywany w kółko. */
  class CountingStorage extends FakeStorage {
    indexWrites = 0;

    override setItem(key: string, value: string): void {
      if (key === "margometer.rec.index") this.indexWrites += 1;
      super.setItem(key, value);
    }
  }

  let counting: CountingStorage;
  const rec = () => new Recorder({ storage: counting, now: () => 1 });

  beforeEach(() => {
    counting = new CountingStorage();
  });

  /** Walka doczytująca się linia po linii, jak w grze. */
  const grow = (recorder: Recorder, lines: number) => {
    let buffer = FIGHT_A;
    for (let i = 0; i < lines; i += 1) {
      buffer += `\nKamil(100%) uderzył z siłą +${100 + i} Wilk`;
      recorder.capture(buffer);
    }
    return buffer;
  };

  test("rosnący tekst nie przepisuje indeksu w kółko", () => {
    const recorder = rec();
    recorder.toggle();
    counting.indexWrites = 0;

    grow(recorder, 50);

    // Bez progu byłoby po jednym zapisie na linię, plus założenie nagrania.
    expect(counting.indexWrites).toBeLessThan(5);
  });

  test("ale rozmiar w pamięci zostaje DOKŁADNY", () => {
    const recorder = rec();
    recorder.toggle();

    const buffer = grow(recorder, 50);

    // Budżet i eksmisja liczą się z tego, nie z tego, co zdążyło trafić na dysk.
    expect(recorder.chars()).toBe(buffer.length);
  });

  test("nowe nagranie utrwala się NATYCHMIAST — to zmiana kształtu", () => {
    const recorder = rec();
    recorder.toggle();
    recorder.capture(FIGHT_A);
    recorder.capture(`${FIGHT_A}\n${FIGHT_B}`);

    // Bez odczekania na próg: po odświeżeniu obie walki mają być w indeksie,
    // inaczej druga byłaby tekstem bez wpisu, czyli sierotą.
    expect(new Recorder({ storage: counting, now: () => 1 }).count()).toBe(2);
  });

  test("skasowanie nagrania utrwala się natychmiast", () => {
    const recorder = rec();
    recorder.toggle();
    recorder.capture(FIGHT_A);
    recorder.capture(`${FIGHT_A}\n${FIGHT_B}`);
    const [first] = recorder.list();

    recorder.remove(first!.id);

    expect(new Recorder({ storage: counting, now: () => 1 }).count()).toBe(1);
  });

  test("wyłączenie nagrywania domyka odłożone rozmiary", () => {
    const recorder = rec();
    recorder.toggle();
    const buffer = grow(recorder, 20);

    recorder.toggle();

    // Gorąca ścieżka się skończyła, więc indeks ma odtąd mówić prawdę co do znaku.
    expect(new Recorder({ storage: counting, now: () => 1 }).chars()).toBe(buffer.length);
  });

  test("eksmisja utrwala się natychmiast, mimo progu", () => {
    const recorder = new Recorder({
      storage: counting,
      now: () => 1,
      budgetChars: FIGHT_A.length + 10,
    });
    recorder.toggle();
    recorder.capture(FIGHT_A);
    recorder.capture(`${FIGHT_A}\n${FIGHT_B}`);

    const after = new Recorder({ storage: counting, now: () => 1 });
    expect(after.count()).toBe(1);
    expect(counting.logs()).toEqual([FIGHT_B]);
  });
});
