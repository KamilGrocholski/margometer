/**
 * Nagrywanie walk do localStorage.
 *
 * Zapisujemy SUROWY tekst logu, nie policzone statystyki. Trzy powody:
 * jest najmniejszy (średnia walka to ~2,6 tys. znaków wobec ~4,5 tys. dla
 * `BattleStats` w JSON-ie), przeżywa każdą zmianę kształtu statystyk, a przede
 * wszystkim — pozwala przeliczyć stare nagrania nowym parserem. Statystyki
 * zamrożone w JSON-ie są bezużyteczne w dniu, w którym łatamy lukę w parserze.
 *
 * Magazyn dzielimy z grą: `@grant none` znaczy, że siedzimy w kontekście
 * strony, a `localStorage` na `tempest.margonem.pl` to ten sam ~5 MB kubełek,
 * z którego korzysta klient. Gdybyśmy go zapchali, `QuotaExceededError`
 * poleciałby GRZE, nie nam. Stąd dwa zabezpieczenia: własny budżet dużo niższy
 * od limitu przeglądarki i kasowanie najstarszych nagrań, gdy zapis mimo to
 * odmówi.
 */

const KEY_PREFIX = "margometer.rec.";
const INDEX_KEY = `${KEY_PREFIX}index`;
/** Nagrywanie przeżywa odświeżenie gry — inaczej każde F5 po cichu je gasi. */
const FLAG_KEY = `${KEY_PREFIX}on`;

/**
 * Ile znaków wolno zająć nagraniom. Przeglądarki liczą po 2 bajty na znak
 * (UTF-16), więc 500 tys. znaków to ~1 MB z ~5 MB origin — reszta zostaje grze.
 * Przy średniej walce (2,6 tys. znaków) mieści się tu ~190 walk.
 */
export const BUDGET_CHARS = 500_000;

const FIGHT_START = /Rozpoczęła się walka pomiędzy/;

/** Jedno nagranie w indeksie. Sam tekst leży pod osobnym kluczem. */
export type Recording = {
  id: number;
  /** Linia otwierająca — jedyne, po czym da się nagranie rozpoznać na liście. */
  title: string;
  chars: number;
  /** Znacznik czasu pierwszego zapisu (ms). */
  at: number;
};

type Index = {
  v: 1;
  /** Licznik identyfikatorów. Nie długość listy — kasowanie by go cofało. */
  next: number;
  fights: Recording[];
};

const EMPTY_INDEX: Index = { v: 1, next: 1, fights: [] };

/** Walka widoczna w buforze wraz z tym, ile jej już zapisaliśmy. */
type ActiveRecording = {
  id: number;
  lines: string[];
  /** Długość ostatnio zapisanego tekstu — po niej poznajemy, że nic nie urosło. */
  saved: number;
};

export type RecorderStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * Dzieli bufor logu na walki po liniach otwierających.
 *
 * Odpowiednik `splitFights` z sesji, tylko na tekście zamiast na zdarzeniach —
 * nagranie ma być dokładnie tym, co widział parser, więc nie może przechodzić
 * przez zdarzenia i z powrotem.
 */
function splitLines(text: string): string[][] {
  const fights: string[][] = [];

  for (const line of text.split("\n")) {
    if (line.trim() === "") continue;
    if (FIGHT_START.test(line)) {
      const previous = fights.at(-1);
      // Margonem potrafi zdublować linię rozpoczęcia — druga nie zaczyna
      // nowej walki, bo poprzednia nie ma jeszcze żadnej treści.
      const isDuplicate = previous?.length === 1 && FIGHT_START.test(previous[0]!);
      if (!isDuplicate) fights.push([]);
    }
    if (fights.length === 0) fights.push([]);
    fights.at(-1)!.push(line);
  }

  return fights;
}

/** Ta sama funkcja widziana z zewnątrz — walki jako teksty. Do testów. */
export function splitRawFights(text: string): string[] {
  return splitLines(text).map((lines) => lines.join("\n"));
}

/**
 * Czy `current` to ta sama walka co `previous`, tylko doczytana?
 *
 * Nowa walka ZAWSZE zaczyna się linią otwierającą. Jej brak znaczy więc, że
 * patrzymy na ogon walki, której nagłówek wyjechał już z bufora — czymś nowym
 * być nie może. Z linią otwierającą decyduje wspólny początek: ta sama walka
 * dostaje linie na dole i nigdy nie chudnie.
 */
function continues(previous: string[], current: string[]): boolean {
  if (!current.some((line) => FIGHT_START.test(line))) return true;
  if (current.length < previous.length) return false;
  return previous.every((line, i) => line === current[i]);
}

/**
 * Skleja to, co mamy, z tym, co widać teraz.
 *
 * Gra przycina log od góry, więc bufor bywa OGONEM nagrania, nie jego
 * przedłużeniem — zwykłe doklejenie zdublowałoby wspólną część. Szukamy więc
 * najdłuższego ogona nagrania, który jest początkiem bufora, i dopisujemy
 * dopiero to, co za nim. Dla walki, która po prostu urosła, ogonem tym jest
 * całe nagranie i wychodzi zwykłe doklejenie.
 */
function merge(previous: string[], current: string[]): string[] {
  for (let overlap = Math.min(previous.length, current.length); overlap > 0; overlap -= 1) {
    const tail = previous.slice(previous.length - overlap);
    if (tail.every((line, i) => line === current[i])) {
      return [...previous, ...current.slice(overlap)];
    }
  }
  return [...previous, ...current];
}

export type RecorderOptions = {
  storage?: RecorderStorage;
  budgetChars?: number;
  /** Wstrzykiwany zegar — testy nie mają czym ustawić `Date.now()`. */
  now?: () => number;
};

export class Recorder {
  private readonly storage: RecorderStorage | undefined;
  private readonly budget: number;
  private readonly now: () => number;
  private index: Index;
  /** Walki widoczne w buforze, w kolejności, w jakiej w nim stoją. */
  private active: ActiveRecording[] = [];
  private on = false;
  /**
   * Magazyn odmówił zapisu mimo zwolnionego miejsca. Nie próbujemy w kółko —
   * to nie nasze miejsce się skończyło, tylko całego origin, więc kolejne
   * próby tylko dokładałyby grze wyjątków.
   */
  private failed = false;

  constructor(options: RecorderOptions = {}) {
    this.storage = options.storage;
    this.budget = options.budgetChars ?? BUDGET_CHARS;
    this.now = options.now ?? Date.now;
    this.index = this.loadIndex();
    this.on = this.storage?.getItem(FLAG_KEY) === "1";
  }

  isRecording(): boolean {
    return this.on;
  }

  toggle(): void {
    this.on = !this.on;
    // Bufor zaczynamy od zera: po ponownym włączeniu walka widoczna w oknie
    // jest dla nas nowa i ma trafić do nagrania od tego, co jeszcze widać.
    this.active = [];
    if (this.on) this.failed = false;
    try {
      this.storage?.setItem(FLAG_KEY, this.on ? "1" : "0");
    } catch {
      // Sam znacznik nie jest wart przewracania overlaya.
    }
  }

  /** Liczba nagranych walk. */
  count(): number {
    return this.index.fights.length;
  }

  /** Ile znaków zajmują nagrania. */
  chars(): number {
    return this.index.fights.reduce((sum, fight) => sum + fight.chars, 0);
  }

  list(): Recording[] {
    return this.index.fights.map((fight) => ({ ...fight }));
  }

  /** Surowy log jednego nagrania. null, gdy klucz zniknął spod indeksu. */
  read(id: number): string | null {
    return this.storage?.getItem(KEY_PREFIX + id) ?? null;
  }

  /** Czy zapis się wysypał — overlay ma to powiedzieć wprost. */
  isFailed(): boolean {
    return this.failed;
  }

  /**
   * Nagrania w jednym tekście, gotowe do wklejenia. Separator niesie datę
   * i skład, żeby po wklejeniu było wiadomo, gdzie kończy się jedna walka.
   */
  dump(): string | null {
    const parts: string[] = [];
    for (const fight of this.index.fights) {
      const text = this.storage?.getItem(KEY_PREFIX + fight.id);
      if (!text) continue;
      parts.push(`=== walka ${fight.id} · ${new Date(fight.at).toISOString()} ===\n${text}`);
    }
    return parts.length > 0 ? parts.join("\n\n") : null;
  }

  clear(): void {
    for (const fight of [...this.index.fights]) this.drop(fight.id);
    this.active = [];
    this.failed = false;
    this.write(INDEX_KEY, JSON.stringify(this.index));
  }

  /**
   * Nowa treść bufora logu. Wołane przy każdej zmianie, tak jak `Session.update`.
   *
   * Walki dopasowujemy od KOŃCA bufora — dokładnie jak sesja i z tego samego
   * powodu: log traci treść od góry, a dorasta na dole, więc ani indeks, ani
   * pierwsza linia nie są stałą tożsamością.
   */
  capture(text: string): void {
    if (!this.on || this.failed) return;

    const fights = splitLines(text);
    const next: ActiveRecording[] = new Array(fights.length);
    let oldIndex = this.active.length - 1;

    for (let i = fights.length - 1; i >= 0; i -= 1) {
      const lines = fights[i]!;
      const previous = oldIndex >= 0 ? this.active[oldIndex] : undefined;
      if (previous && continues(previous.lines, lines)) {
        oldIndex -= 1;
        next[i] = { id: previous.id, lines: merge(previous.lines, lines), saved: previous.saved };
      } else {
        next[i] = { id: this.index.next, lines, saved: -1 };
        this.index.next += 1;
      }
    }

    this.active = next;

    for (const fight of this.active) {
      const content = fight.lines.join("\n");
      // Zapis idzie kluczem na walkę, nie jednym blobem — inaczej każda nowa
      // linia logu przepisywałaby całe archiwum, synchronicznie, w wątku gry.
      if (content.length === fight.saved) continue;
      if (!this.save(fight.id, content)) return;
      fight.saved = content.length;
    }
  }

  private save(id: number, text: string): boolean {
    const entry = this.index.fights.find((fight) => fight.id === id);
    if (entry) entry.chars = text.length;
    else {
      this.index.fights.push({
        id,
        title: text.split("\n")[0] ?? "",
        chars: text.length,
        at: this.now(),
      });
    }

    // Miejsce robimy PRZED zapisem i kosztem najstarszych nagrań — bieżąca
    // walka jest tą, której użytkownik pilnuje.
    this.evict(id);
    if (!this.write(KEY_PREFIX + id, text)) return false;
    return this.write(INDEX_KEY, JSON.stringify(this.index));
  }

  /** Kasuje najstarsze nagrania, aż suma zmieści się w budżecie. `keep` zostaje. */
  private evict(keep: number): void {
    while (this.chars() > this.budget) {
      const oldest = this.index.fights.find((fight) => fight.id !== keep);
      if (!oldest) return;
      this.drop(oldest.id);
    }
  }

  private drop(id: number): void {
    this.index.fights = this.index.fights.filter((fight) => fight.id !== id);
    this.active = this.active.filter((fight) => fight.id !== id);
    try {
      this.storage?.removeItem(KEY_PREFIX + id);
    } catch {
      // Nie ma czego ratować — wpis i tak wypadł z indeksu.
    }
  }

  /**
   * Zapis z ustępowaniem miejsca. Gdy magazyn odmówi, kasujemy własne najstarsze
   * nagranie i próbujemy ponownie — pełny kubełek uderzyłby w grę, nie w nas.
   */
  private write(key: string, value: string): boolean {
    for (;;) {
      try {
        this.storage?.setItem(key, value);
        return true;
      } catch {
        const oldest = this.index.fights.find((fight) => KEY_PREFIX + fight.id !== key);
        if (!oldest) break;
        this.drop(oldest.id);
      }
    }

    // Zwolnienie wszystkiego nie pomogło — miejsce skończyło się poza nami.
    this.failed = true;
    this.on = false;
    return false;
  }

  private loadIndex(): Index {
    try {
      const raw = this.storage?.getItem(INDEX_KEY);
      if (!raw) return { ...EMPTY_INDEX, fights: [] };
      const parsed = JSON.parse(raw) as Partial<Index>;
      if (!Array.isArray(parsed.fights)) return { ...EMPTY_INDEX, fights: [] };
      return {
        v: 1,
        next: typeof parsed.next === "number" ? parsed.next : parsed.fights.length + 1,
        fights: parsed.fights,
      };
    } catch {
      return { ...EMPTY_INDEX, fights: [] };
    }
  }
}
