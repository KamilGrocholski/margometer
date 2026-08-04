import { beforeEach, describe, expect, test } from "bun:test";
import { Recorder, tytul, type Nagranie, type RecorderStorage } from "../src/recorder.ts";
import type { PorcjaProtokolu } from "../src/protokol-source.ts";
import type { RosterEntry } from "../src/roster.ts";

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

  /** Surowe JSON-y nagrań, w kolejności zapisu. */
  logs(): string[] {
    return [...this.data]
      .filter(([key]) => /^margometer\.rec\.\d+$/.test(key))
      .map(([, value]) => value);
  }

  /** To samo, ale odczytane — bo od 2026‑08‑04 nagranie jest JSON-em, nie tekstem. */
  nagrania(): Nagranie[] {
    return this.logs().map((raw) => JSON.parse(raw) as Nagranie);
  }
}

const SKLAD_A: RosterEntry[] = [
  { id: 482845, name: "Kamil", side: 0, prof: "h", lvl: 100 },
  { id: 255967, name: "Wilk", side: 1, prof: "x", lvl: 80 },
];

const SKLAD_B: RosterEntry[] = [
  { id: 482845, name: "Kamil", side: 0, prof: "h", lvl: 100 },
  { id: 700001, name: "Gnoll", side: 1, prof: "x", lvl: 90 },
];

const KOM_A = [
  "482845=100.00;-255967=37.61;+dmgd=483;+acdmg=5;-dmgd=233",
  "-255967=19.27;0;poison=140,14",
];

const KOM_B = ["482845=100.00;-700001=61.00;+dmgd=901"];

/** Porcja tak, jak podaje ją `EngineProtocolSource`. `zdarzenia` nagrywarki nie obchodzą. */
const porcja = (komunikaty: string[], sklad: RosterEntry[] = SKLAD_A): PorcjaProtokolu => ({
  komunikaty,
  zdarzenia: [],
  sklad,
});

/** Ile znaków zajmie takie nagranie w magazynie — budżet liczy się właśnie z tego. */
const zapis = (komunikaty: string[], sklad: RosterEntry[]) =>
  JSON.stringify({ komunikaty, sklad }).length;

let storage: FakeStorage;
let clock: number;
const recorder = (options: { budgetChars?: number } = {}) =>
  new Recorder({ storage, now: () => (clock += 1000), ...options });

beforeEach(() => {
  storage = new FakeStorage();
  clock = 1_700_000_000_000;
});

describe("tytuł nagrania", () => {
  // Protokół NIE MUSI nieść zdania „Rozpoczęła się walka pomiędzy…" — klient
  // składa je sam, poza `data.m`. Tytuł powstaje więc ze składu i celowo nie
  // udaje cytatu z logu.
  test("obie strony po przecinku, rozdzielone „vs”", () => {
    expect(tytul(SKLAD_A)).toBe("Kamil vs Wilk");
  });

  test("powyżej dwóch nazw na stronie reszta idzie jako „+N”", () => {
    const tlum: RosterEntry[] = [
      { id: 1, name: "A", side: 0 },
      { id: 2, name: "B", side: 0 },
      { id: 3, name: "C", side: 0 },
      { id: 4, name: "D", side: 0 },
      { id: 5, name: "Wróg", side: 1 },
    ];
    expect(tytul(tlum)).toBe("A, B +2 vs Wróg");
  });

  test("jedna strona pusta nie daje wiszącego „vs”", () => {
    expect(tytul([{ id: 1, name: "Kamil", side: 0 }])).toBe("Kamil");
  });

  test("skład pusty mówi to wprost, zamiast dawać pusty wiersz", () => {
    expect(tytul([])).toBe("walka bez składu");
  });
});

describe("nagrywanie", () => {
  test("wyłączone nie zapisuje niczego", () => {
    const rec = recorder();

    rec.capture(porcja(KOM_A));

    expect(rec.count()).toBe(0);
    expect(storage.logs()).toEqual([]);
  });

  test("po włączeniu zapisuje walkę i liczy ją w indeksie", () => {
    const rec = recorder();
    rec.toggle();

    rec.capture(porcja(KOM_A));

    expect(rec.isRecording()).toBe(true);
    expect(rec.count()).toBe(1);
    expect(rec.chars()).toBe(zapis(KOM_A, SKLAD_A));
  });

  test("nagranie niesie KOMUNIKATY i SKŁAD, znak w znak", () => {
    // Sedno formatu `v: 2`: nagranie ma dać się przeliczyć nowszym dekoderem,
    // więc zapisujemy surowy protokół, a nie policzone zdarzenia.
    const rec = recorder();
    rec.toggle();

    rec.capture(porcja(KOM_A));

    expect(storage.nagrania()).toEqual([{ komunikaty: KOM_A, sklad: SKLAD_A }]);
  });

  test("porcja bez komunikatów nie zakłada nagrania", () => {
    const rec = recorder();
    rec.toggle();

    rec.capture(porcja([]));

    expect(rec.count()).toBe(0);
  });

  test("doczytana walka nadpisuje wpis zamiast zakładać drugi", () => {
    const rec = recorder();
    rec.toggle();

    rec.capture(porcja(KOM_A));
    const dluzsza = [...KOM_A, "482845=100.00;-255967=12.00;+dmgd=310"];
    rec.capture(porcja(dluzsza));

    expect(rec.count()).toBe(1);
    expect(storage.nagrania()[0]?.komunikaty).toEqual(dluzsza);
  });

  test("skład doczytany w trakcie walki nadpisuje ten sprzed", () => {
    // Roster bywa pusty w pierwszej porcji — wtedy `id` nie mają jak stać się
    // nazwami. Nagranie musi wziąć ten późniejszy, inaczej zostaje bez nazw.
    const rec = recorder();
    rec.toggle();

    rec.capture(porcja(KOM_A, []));
    rec.capture(porcja(KOM_A, SKLAD_A));

    expect(rec.count()).toBe(1);
    expect(storage.nagrania()[0]?.sklad).toEqual(SKLAD_A);
  });

  test("nowa walka to osobne nagranie", () => {
    const rec = recorder();
    rec.toggle();

    rec.capture(porcja(KOM_A));
    rec.capture(porcja(KOM_B, SKLAD_B));

    expect(rec.count()).toBe(2);
    expect(storage.nagrania().map((one) => one.komunikaty)).toEqual([KOM_A, KOM_B]);
  });

  test("krótsza lista komunikatów to nowa walka, nie ucięcie starej", () => {
    const rec = recorder();
    rec.toggle();

    rec.capture(porcja(KOM_A));
    rec.capture(porcja(KOM_A.slice(0, 1)));

    expect(rec.count()).toBe(2);
  });

  test("podmieniony komunikat w środku to nowa walka, choćby lista rosła", () => {
    // Tu pilnujemy, że `przedluza` sprawdza TREŚĆ, a nie samą długość: druga
    // walka bywa dłuższa od pierwszej i wpadłaby do jej nagrania.
    const rec = recorder();
    rec.toggle();

    rec.capture(porcja(KOM_A));
    rec.capture(porcja([KOM_A[0]!, "inny", ...KOM_B]));

    expect(rec.count()).toBe(2);
  });

  test("wyłączenie i włączenie zaczyna nowe nagranie tej samej walki", () => {
    const rec = recorder();
    rec.toggle();
    rec.capture(porcja(KOM_A));

    rec.toggle();
    rec.toggle();
    rec.capture(porcja(KOM_A));

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
    first.capture(porcja(KOM_A));

    const second = recorder();

    expect(second.count()).toBe(1);
    expect(second.read(second.list()[0]!.id)?.komunikaty).toEqual(KOM_A);
  });

  test("kolejne nagranie po odświeżeniu nie nadpisuje poprzedniego", () => {
    const first = recorder();
    first.toggle();
    first.capture(porcja(KOM_A));

    const second = recorder();
    second.capture(porcja(KOM_B, SKLAD_B));

    expect(second.count()).toBe(2);
    expect(storage.nagrania().map((one) => one.komunikaty)).toEqual([KOM_A, KOM_B]);
  });
});

describe("budżet magazynu", () => {
  test("po przekroczeniu budżetu wypadają najstarsze nagrania", () => {
    const rec = recorder({ budgetChars: zapis(KOM_A, SKLAD_A) + 10 });
    rec.toggle();

    rec.capture(porcja(KOM_A));
    rec.capture(porcja(KOM_B, SKLAD_B));

    expect(rec.count()).toBe(1);
    expect(storage.nagrania().map((one) => one.komunikaty)).toEqual([KOM_B]);
  });

  test("bieżąca walka nigdy nie leci jako pierwsza", () => {
    const rec = recorder({ budgetChars: 1 });
    rec.toggle();

    rec.capture(porcja(KOM_A));

    expect(storage.nagrania().map((one) => one.komunikaty)).toEqual([KOM_A]);
  });

  test("pełny magazyn gry zwalnia miejsce po naszej stronie", () => {
    const rec = recorder();
    rec.toggle();
    rec.capture(porcja(KOM_A));
    // Coś innego (gra) zajęło resztę kubełka.
    storage.limit =
      storage.getItem("margometer.rec.index")!.length + zapis(KOM_B, SKLAD_B) + 200;

    rec.capture(porcja(KOM_B, SKLAD_B));

    expect(rec.isRecording()).toBe(true);
    expect(storage.nagrania().map((one) => one.komunikaty)).toEqual([KOM_B]);
  });

  test("gdy zwolnienie wszystkiego nie pomaga, nagrywanie gaśnie", () => {
    const rec = recorder();
    rec.toggle();
    storage.limit = 1;

    rec.capture(porcja(KOM_A));

    expect(rec.isFailed()).toBe(true);
    expect(rec.isRecording()).toBe(false);
    expect(storage.logs()).toEqual([]);
  });
});

describe("odczyt nagrań", () => {
  test("read oddaje to, co weszło", () => {
    const rec = recorder();
    rec.toggle();
    rec.capture(porcja(KOM_A));

    expect(rec.read(rec.list()[0]!.id)).toEqual({ komunikaty: KOM_A, sklad: SKLAD_A });
  });

  test("nagranie w starym formacie czyta się jako null, a nie jako pustka", () => {
    // Nagrania `v: 1` trzymały ZDANIA z okna walki. Odczytu zdań już nie ma,
    // więc nie ma czym ich przeczytać — a `JSON.parse` na takim tekście rzuca.
    // Ma z tego wyjść „nie ma czego pokazać", nie walka o zerowych liczbach.
    storage.setItem("margometer.rec.4", "Rozpoczęła się walka pomiędzy Kamil(100h) a Wilk(80x)");

    expect(recorder().read(4)).toBeNull();
  });

  test("JSON bez wymaganych pól też jest null", () => {
    storage.setItem("margometer.rec.4", JSON.stringify({ komunikaty: KOM_A }));

    expect(recorder().read(4)).toBeNull();
  });

  test("read na nieznanym id to null", () => {
    expect(recorder().read(99)).toBeNull();
  });

  test("dump skleja walki z nagłówkami", () => {
    const rec = recorder();
    rec.toggle();
    rec.capture(porcja(KOM_A));
    rec.capture(porcja(KOM_B, SKLAD_B));

    const dump = rec.dump() ?? "";

    expect(dump).toContain(KOM_A[0]!);
    expect(dump).toContain(KOM_B[0]!);
    expect(dump.match(/=== walka \d+ · /g)).toHaveLength(2);
  });

  test("dump bez nagrań to null", () => {
    expect(recorder().dump()).toBeNull();
  });

  test("clear kasuje nagrania i klucze", () => {
    const rec = recorder();
    rec.toggle();
    rec.capture(porcja(KOM_A));
    rec.capture(porcja(KOM_B, SKLAD_B));

    rec.clear();

    expect(rec.count()).toBe(0);
    expect(storage.logs()).toEqual([]);
    expect(rec.dump()).toBeNull();
  });

  test("po wyczyszczeniu dalsze nagrywanie działa", () => {
    const rec = recorder();
    rec.toggle();
    rec.capture(porcja(KOM_A));
    rec.clear();

    rec.capture(porcja(KOM_B, SKLAD_B));

    expect(rec.count()).toBe(1);
    expect(storage.nagrania().map((one) => one.komunikaty)).toEqual([KOM_B]);
  });
});

describe("walka przerwana odświeżeniem strony", () => {
  test("nagranie w toku jest kontynuowane, a nie zakładane od nowa", () => {
    // `on` przeżywa F5, ale wiedza o tym, KTÓRA walka trwa, siedziała tylko
    // w pamięci — pierwszy capture po odświeżeniu nie miał czego dopasować
    // i zakładał drugie nagranie, którego prefiksem było pierwsze.
    const first = recorder();
    first.toggle();
    first.capture(porcja(KOM_A));
    expect(first.count()).toBe(1);

    const after = recorder();
    expect(after.isRecording()).toBe(true);
    const dluzsza = [...KOM_A, "-255967=0.00;0;dead"];
    after.capture(porcja(dluzsza));

    expect(after.count()).toBe(1);
    expect(storage.nagrania()[0]?.komunikaty).toEqual(dluzsza);
  });

  test("nowa walka po odświeżeniu dostaje własne nagranie", () => {
    const first = recorder();
    first.toggle();
    first.capture(porcja(KOM_A));

    const after = recorder();
    after.capture(porcja(KOM_B, SKLAD_B));

    expect(after.count()).toBe(2);
    expect(storage.nagrania().map((one) => one.komunikaty)).toEqual([KOM_A, KOM_B]);
  });
});

describe("zepsuty indeks w magazynie", () => {
  test("wpis bez rozmiaru nie zabija eksmisji", () => {
    // `chars: undefined` dawało `chars() === NaN`, a `NaN > budżet` jest
    // fałszem — limit magazynu znikał po cichu, razem z jedyną ochroną
    // kubełka, który dzielimy z grą.
    storage.setItem(
      "margometer.rec.index",
      JSON.stringify({ v: 2, next: 2, fights: [{ id: 1, title: "stara" }] }),
    );

    const rec = recorder({ budgetChars: zapis(KOM_A, SKLAD_A) + 10 });
    expect(rec.count()).toBe(0);
    expect(Number.isFinite(rec.chars())).toBe(true);

    rec.toggle();
    rec.capture(porcja(KOM_A));
    rec.capture(porcja(KOM_B, SKLAD_B));
    expect(rec.chars()).toBeLessThanOrEqual(zapis(KOM_A, SKLAD_A) + 10);
  });

  test("indeks w nieznanej wersji jest odrzucany, nie zgadywany", () => {
    storage.setItem(
      "margometer.rec.index",
      JSON.stringify({ v: 3, next: 5, fights: [{ id: 1, title: "x", chars: 10, at: 1 }] }),
    );
    expect(recorder().count()).toBe(0);
  });

  test("STARE nagrania `v: 1` przepadają, zamiast czytać się jako protokół", () => {
    // Świadoma strata z 2026‑08‑04. Tamten indeks opisywał zdania z okna walki,
    // a odczytu zdań już nie ma. Gdyby `v: 1` przechodziło, archiwum
    // pokazywałoby wiersze, których nie da się otworzyć.
    storage.setItem(
      "margometer.rec.index",
      JSON.stringify({
        v: 1,
        next: 2,
        fights: [{ id: 1, title: "Rozpoczęła się walka…", chars: 100, at: 1 }],
      }),
    );
    storage.setItem("margometer.rec.1", "Rozpoczęła się walka pomiędzy Kamil(100h) a Wilk(80x)");

    const rec = recorder();

    expect(rec.count()).toBe(0);
    expect(storage.logs()).toEqual([]);
  });

  test("nowe nagranie nie nadpisuje istniejącego, gdy `next` kłamie", () => {
    const stare = JSON.stringify({ komunikaty: KOM_A, sklad: SKLAD_A });
    storage.setItem("margometer.rec.7", stare);
    storage.setItem(
      "margometer.rec.index",
      JSON.stringify({
        v: 2,
        next: 1,
        fights: [{ id: 7, title: "stara", chars: stare.length, at: 1 }],
      }),
    );

    const rec = recorder();
    rec.toggle();
    rec.capture(porcja(KOM_B, SKLAD_B));

    expect(rec.list().map((one) => one.id)).toEqual([7, 8]);
    expect(storage.nagrania().map((one) => one.komunikaty)).toEqual([KOM_A, KOM_B]);
  });
});

describe("nagrania osierocone przez indeks", () => {
  // Uszkodzony indeks zwracał pusty stan, ale treści walk zostawały
  // w magazynie NA ZAWSZE: `clear()` chodzi po indeksie, więc ich nie widział,
  // `chars()` raportował zero, a `evict()` uważał, że jest miejsce. Do ~1 MB
  // znikało z kubełka dzielonego z GRĄ.
  const orphanKeys = () => [...storage.data.keys()].filter((key) => /\.\d+$/.test(key));
  const tresc = (komunikaty: string[], sklad: RosterEntry[]) =>
    JSON.stringify({ komunikaty, sklad });

  test("indeks w nieznanej wersji zabiera ze sobą swoje nagrania", () => {
    storage.setItem("margometer.rec.1", tresc(KOM_A, SKLAD_A));
    storage.setItem("margometer.rec.2", tresc(KOM_B, SKLAD_B));
    storage.setItem("margometer.rec.index", JSON.stringify({ v: 3, next: 9, fights: [] }));

    const rec = recorder();

    expect(rec.count()).toBe(0);
    expect(orphanKeys()).toEqual([]);
  });

  test("indeks nie do odczytania też", () => {
    storage.setItem("margometer.rec.1", tresc(KOM_A, SKLAD_A));
    storage.setItem("margometer.rec.index", "{to nie jest JSON");

    recorder();

    expect(orphanKeys()).toEqual([]);
  });

  test("brak indeksu przy istniejących nagraniach to też sieroty", () => {
    storage.setItem("margometer.rec.1", tresc(KOM_A, SKLAD_A));

    recorder();

    expect(orphanKeys()).toEqual([]);
  });

  test("wpis odrzucony przez walidację zabiera swoją treść, reszta zostaje", () => {
    storage.setItem("margometer.rec.1", tresc(KOM_A, SKLAD_A));
    storage.setItem("margometer.rec.2", tresc(KOM_B, SKLAD_B));
    storage.setItem(
      "margometer.rec.index",
      JSON.stringify({
        v: 2,
        next: 3,
        // Drugi wpis bez `chars` — `isRecording` go odrzuci.
        fights: [
          { id: 1, title: "dobra", chars: 10, at: 1 },
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

    storage.setItem("margometer.rec.index", JSON.stringify({ v: 3, next: 1, fights: [] }));
    recorder();

    expect(storage.getItem("margometer.rec.on")).toBe("1");
  });

  test("wyczyszczenie obejmuje także to spoza indeksu", () => {
    const rec = recorder();
    rec.toggle();
    rec.capture(porcja(KOM_A));
    storage.setItem("margometer.rec.999", tresc(KOM_B, SKLAD_B));

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
    storage.setItem("margometer.rec.1", tresc(KOM_A, SKLAD_A));
    storage.setItem("margometer.rec.index", JSON.stringify({ v: 3, next: 9, fights: [] }));

    const rec = new Recorder({ storage: blind, now: () => 1 });

    expect(rec.count()).toBe(0);
    expect(storage.getItem("margometer.rec.1")).toBe(tresc(KOM_A, SKLAD_A));
  });
});

describe("wygaszenie nagrywania przeżywa odświeżenie", () => {
  test("brak miejsca gasi nagrywanie NA TRWAŁE", () => {
    const rec = recorder();
    rec.toggle();
    rec.capture(porcja(KOM_A));

    // Od teraz magazyn odmawia wszystkiego — zwolnienie miejsca nie pomoże.
    storage.limit = 0;
    rec.capture(porcja(KOM_B, SKLAD_B));

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

describe("indeks nie leci do magazynu przy każdej porcji", () => {
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

  /** Walka rosnąca komunikat po komunikacie, jak w grze. */
  const grow = (recorder: Recorder, ile: number) => {
    const komunikaty = [...KOM_A];
    for (let i = 0; i < ile; i += 1) {
      komunikaty.push(`482845=100.00;-255967=${(90 - i).toFixed(2)};+dmgd=${100 + i}`);
      recorder.capture(porcja([...komunikaty]));
    }
    return komunikaty;
  };

  test("rosnąca walka nie przepisuje indeksu w kółko", () => {
    const recorder = rec();
    recorder.toggle();
    counting.indexWrites = 0;

    grow(recorder, 50);

    // Bez progu byłoby po jednym zapisie na porcję, plus założenie nagrania.
    expect(counting.indexWrites).toBeLessThan(5);
  });

  test("ale rozmiar w pamięci zostaje DOKŁADNY", () => {
    const recorder = rec();
    recorder.toggle();

    const komunikaty = grow(recorder, 50);

    // Budżet i eksmisja liczą się z tego, nie z tego, co zdążyło trafić na dysk.
    expect(recorder.chars()).toBe(zapis(komunikaty, SKLAD_A));
  });

  test("nowe nagranie utrwala się NATYCHMIAST — to zmiana kształtu", () => {
    const recorder = rec();
    recorder.toggle();
    recorder.capture(porcja(KOM_A));
    recorder.capture(porcja(KOM_B, SKLAD_B));

    // Bez odczekania na próg: po odświeżeniu obie walki mają być w indeksie,
    // inaczej druga byłaby treścią bez wpisu, czyli sierotą.
    expect(new Recorder({ storage: counting, now: () => 1 }).count()).toBe(2);
  });

  test("skasowanie nagrania utrwala się natychmiast", () => {
    const recorder = rec();
    recorder.toggle();
    recorder.capture(porcja(KOM_A));
    recorder.capture(porcja(KOM_B, SKLAD_B));
    const [first] = recorder.list();

    recorder.remove(first!.id);

    expect(new Recorder({ storage: counting, now: () => 1 }).count()).toBe(1);
  });

  test("wyłączenie nagrywania domyka odłożone rozmiary", () => {
    const recorder = rec();
    recorder.toggle();
    const komunikaty = grow(recorder, 20);

    recorder.toggle();

    // Gorąca ścieżka się skończyła, więc indeks ma odtąd mówić prawdę co do znaku.
    expect(new Recorder({ storage: counting, now: () => 1 }).chars()).toBe(
      zapis(komunikaty, SKLAD_A),
    );
  });

  test("eksmisja utrwala się natychmiast, mimo progu", () => {
    const recorder = new Recorder({
      storage: counting,
      now: () => 1,
      budgetChars: zapis(KOM_A, SKLAD_A) + 10,
    });
    recorder.toggle();
    recorder.capture(porcja(KOM_A));
    recorder.capture(porcja(KOM_B, SKLAD_B));

    const after = new Recorder({ storage: counting, now: () => 1 });
    expect(after.count()).toBe(1);
    expect(counting.nagrania().map((one) => one.komunikaty)).toEqual([KOM_B]);
  });
});
