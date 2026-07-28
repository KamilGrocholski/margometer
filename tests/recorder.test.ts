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
