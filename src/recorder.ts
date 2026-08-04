/**
 * Nagrywanie walk do localStorage.
 *
 * Zapisujemy SUROWE KOMUNIKATY PROTOKOŁU, nie policzone statystyki i nie
 * zdarzenia. Powód jest ten sam, dla którego wcześniej trzymaliśmy surowy tekst:
 * nagranie ma dać się przeliczyć NOWSZYM dekoderem. Cokolwiek policzonego,
 * zamrożone w JSON-ie, jest bezużyteczne w dniu, w którym łatamy lukę
 * w odczycie — a łataliśmy ją dwa razy w ciągu jednego dnia (`d4be27e`,
 * `a5e9150`).
 *
 * Razem z komunikatami idzie SKŁAD. Bez niego `id` nie ma jak stać się nazwą,
 * a archiwum odtwarza nagranie długo po zamknięciu gry, więc rostera nie ma
 * gdzie wziąć.
 *
 * ⚠️ **FORMAT `v: 2` NIE CZYTA NAGRAŃ `v: 1`.** Tamte trzymały ZDANIA z okna
 * walki, a odczyt zdań zszedł z drzewa — nie ma czym ich przeczytać. Indeks
 * w starej wersji jest odrzucany przy starcie i archiwum zaczyna od zera.
 * To jest strata dla gracza i jest świadoma; alternatywą było utrzymywanie
 * całego tamtego odczytu (ponad tysiąc linii) wyłącznie dla archiwum.
 *
 * Magazyn dzielimy z grą: `@grant none` znaczy, że siedzimy w kontekście
 * strony, a `localStorage` na `tempest.margonem.pl` to ten sam ~5 MB kubełek,
 * z którego korzysta klient. Gdybyśmy go zapchali, `QuotaExceededError`
 * poleciałby GRZE, nie nam. Stąd dwa zabezpieczenia: własny budżet dużo niższy
 * od limitu przeglądarki i kasowanie najstarszych nagrań, gdy zapis mimo to
 * odmówi.
 */

import type { RosterEntry } from "./roster.ts";
import type { PorcjaProtokolu } from "./protokol-source.ts";

const KEY_PREFIX = "margometer.rec.";
const INDEX_KEY = `${KEY_PREFIX}index`;
/** Nagrywanie przeżywa odświeżenie gry — inaczej każde F5 po cichu je gasi. */
const FLAG_KEY = `${KEY_PREFIX}on`;

/**
 * Ile znaków wolno zająć nagraniom. Przeglądarki liczą po 2 bajty na znak
 * (UTF-16), więc 500 tys. znaków to ~1 MB z ~5 MB origin — reszta zostaje grze.
 *
 * ⚠️ Ile walk się tu mieści, przestało być zmierzone. Przy tekście była to
 * średnia 2,6 tys. znaków i ~190 walk; protokół jest gęstszy na komunikat, ale
 * komunikatów jest mniej niż linii (18 na walkę w jedynym zrzucie, jaki mamy).
 * Budżet zostaje ten sam, bo chroni GRĘ przed zapchanym kubełkiem, a nie nas
 * przed małym archiwum — ale liczby walk nie wpisuję, dopóki jej nie zmierzę.
 */
export const BUDGET_CHARS = 500_000;

/**
 * Ile zmiany ROZMIARU wolno odłożyć, zanim przepiszemy indeks — patrz
 * `saveIndex`. Próg dobrany tak, żeby średnia walka (~2,6 tys. znaków)
 * utrwaliła się parę razy w trakcie, zamiast przy każdej linii.
 */
const INDEX_FLUSH_CHARS = 2_000;

/** Jedno nagranie w indeksie. Sam tekst leży pod osobnym kluczem. */
export type Recording = {
  id: number;
  /** Linia otwierająca — jedyne, po czym da się nagranie rozpoznać na liście. */
  title: string;
  chars: number;
  /** Znacznik czasu pierwszego zapisu (ms). */
  at: number;
};

/**
 * Treść jednego nagrania. Leży pod kluczem `margometer.rec.<id>` jako JSON.
 */
export type Nagranie = {
  komunikaty: string[];
  sklad: RosterEntry[];
};

type Index = {
  v: 2;
  /** Licznik identyfikatorów. Nie długość listy — kasowanie by go cofało. */
  next: number;
  fights: Recording[];
};

const EMPTY_INDEX: Index = { v: 2, next: 1, fights: [] };

/** Walka widoczna w buforze wraz z tym, ile jej już zapisaliśmy. */
type ActiveRecording = {
  id: number;
  komunikaty: string[];
  sklad: RosterEntry[];
  /** Długość ostatnio zapisanego JSON-a — po niej poznajemy, że nic nie urosło. */
  saved: number;
};

/**
 * Tytuł nagrania — jedyne, po czym da się je rozpoznać na liście.
 *
 * Przy tekście brała go pierwsza linia, czyli zdanie gry „Rozpoczęła się walka
 * pomiędzy…". Protokół takiego zdania NIE MUSI nieść: klient syntetyzuje je sam,
 * poza `data.m` (`Battle.js:945`), więc w zrzucie bywa i nie bywa.
 *
 * Składamy więc własny, ze składu — i celowo **nie udajemy zdania gry**.
 * Formatowanie „A, B a C" wyglądałoby jak cytat z logu, a nim nie jest.
 */
export function tytul(sklad: readonly RosterEntry[]): string {
  const strona = (side: number) => sklad.filter((w) => w.side === side).map((w) => w.name);
  // Skrót taki sam, jaki archiwum stosowało dotąd do linii otwierającej —
  // wiersz listy ma stałą szerokość, a dziesięcioosobowa drużyna go rozpycha.
  const skrot = (nazwy: string[]) =>
    nazwy.length <= 2 ? nazwy.join(", ") : `${nazwy[0]}, ${nazwy[1]} +${nazwy.length - 2}`;

  const nasi = skrot(strona(0));
  const obcy = skrot(strona(1));
  if (!nasi || !obcy) return nasi || obcy || "walka bez składu";
  return `${nasi} vs ${obcy}`;
}

/**
 * Tyle magazynu, ile nagrywarce potrzeba.
 *
 * `key`/`length` są OPCJONALNE, bo służą wyłącznie sprzątaniu osieroconych
 * kluczy — bez nich wszystko inne działa, a atrapy w testach nie muszą udawać
 * całego `Storage`.
 */
export type RecorderStorage = Pick<Storage, "getItem" | "setItem" | "removeItem"> &
  Partial<Pick<Storage, "key" | "length">>;


/**
 * Czy wpis indeksu ma wszystko, czego od niego oczekujemy.
 *
 * Sprawdzamy KAŻDE pole, nie tylko kształt tablicy: brakujące `chars` psuło
 * arytmetykę budżetu (`NaN > n` jest fałszem, więc eksmisja milkła), a brakujące
 * `at` dawało „NaN.NaN NaN:NaN" w wierszu archiwum.
 */
function isRecording(value: unknown): value is Recording {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<Recording>;
  return (
    typeof entry.id === "number" &&
    Number.isFinite(entry.id) &&
    typeof entry.chars === "number" &&
    Number.isFinite(entry.chars) &&
    typeof entry.at === "number" &&
    Number.isFinite(entry.at) &&
    typeof entry.title === "string"
  );
}

/**
 * Czy `biezace` to ta sama walka co `poprzednie`, tylko doczytana?
 *
 * ⚠️ **TU ZNIKNĘŁA CAŁA KLASA ZŁOŻONOŚCI.** Do 2026‑08‑04 stały w tym miejscu
 * trzy funkcje — `continues`, `sameOrGrown`, `merge` — i wszystkie istniały
 * wyłącznie dlatego, że bufor DOM jest RUCHOMYM OKNEM: gra przycinała log od
 * góry, a ostatnia linia potrafiła urosnąć w miejscu między dwoma mikrotaskami.
 * Trzeba było szukać najdłuższego wspólnego ogona i sklejać po nim.
 *
 * Protokół nie ma okna. `EngineProtocolSource` trzyma komunikaty JEDNEJ walki
 * i zeruje bufor przy nowej, więc lista albo rośnie od początku, albo jest
 * nową walką. Zostaje sprawdzenie prefiksu.
 */
function przedluza(poprzednie: readonly string[], biezace: readonly string[]): boolean {
  if (biezace.length < poprzednie.length) return false;
  return poprzednie.every((komunikat, i) => komunikat === biezace[i]);
}

export type RecorderOptions = {
  /**
   * `| undefined` jest tu JAWNE, a nie zapomniane. Przy
   * `exactOptionalPropertyTypes` „pole opcjonalne" i „pole, któremu wolno być
   * `undefined`" to dwie różne rzeczy, a `index.ts` przekazuje wynik
   * `safeStorage()` wprost — czyli `Storage | undefined`. Bez tego zapisu
   * wywołanie nie przechodzi, a obejściem byłoby budowanie obiektu opcji
   * warunkowo, czyli ukrycie faktu, że magazynu po prostu bywa brak.
   */
  storage?: RecorderStorage | undefined;
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
  /** Kształt listy nagrań zmienił się i musi trafić do magazynu. */
  private indexDirty = false;
  /** Ile zmiany rozmiaru czeka na utrwalenie — patrz `saveIndex`. */
  private indexDrift = 0;

  constructor(options: RecorderOptions = {}) {
    this.storage = options.storage;
    this.budget = options.budgetChars ?? BUDGET_CHARS;
    this.now = options.now ?? Date.now;
    this.index = this.loadIndex();
    this.on = this.storage?.getItem(FLAG_KEY) === "1";
    // Nagrywanie przeżywa odświeżenie strony — i musi je przeżyć także wiedza
    // o tym, KTÓRA walka jest w toku. Bez tego pierwszy `capture` po F5 nie ma
    // z czym dopasować bufora, zakłada nowe nagranie i ta sama walka ląduje
    // w archiwum dwa razy: raz urwana, raz cała.
    if (this.on) this.active = this.resume();
  }

  /** Ostatnie nagranie jako walka „w toku" — punkt zaczepienia po odświeżeniu. */
  private resume(): ActiveRecording[] {
    const last = this.index.fights.at(-1);
    if (!last) return [];
    const surowe = this.storage?.getItem(KEY_PREFIX + last.id);
    const nagranie = this.read(last.id);
    if (nagranie === null || surowe === undefined || surowe === null) return [];
    return [
      {
        id: last.id,
        komunikaty: nagranie.komunikaty,
        sklad: nagranie.sklad,
        saved: surowe.length,
      },
    ];
  }

  isRecording(): boolean {
    return this.on;
  }

  toggle(): void {
    // Bufor zaczynamy od zera: po ponownym włączeniu walka widoczna w oknie
    // jest dla nas nowa i ma trafić do nagrania od tego, co jeszcze widać.
    this.active = [];
    if (!this.on) this.failed = false;
    // Wyłączenie to naturalny moment na domknięcie rozmiarów odłożonych przez
    // `saveIndex`: nagrywanie się kończy, więc gorącej ścieżki już nie ma,
    // a indeks ma odtąd mówić prawdę co do znaku.
    if (this.on && (this.indexDirty || this.indexDrift > 0)) this.persistIndex();
    this.setOn(!this.on);
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

  /**
   * Treść jednego nagrania. `null`, gdy klucz zniknął spod indeksu albo trzyma
   * coś, czego nie umiemy odczytać — na przykład nagranie w starym formacie,
   * które przetrwało kasowanie indeksu.
   */
  read(id: number): Nagranie | null {
    const surowe = this.storage?.getItem(KEY_PREFIX + id);
    if (typeof surowe !== "string") return null;
    try {
      const parsed = JSON.parse(surowe) as Partial<Nagranie>;
      if (!Array.isArray(parsed.komunikaty) || !Array.isArray(parsed.sklad)) return null;
      return { komunikaty: parsed.komunikaty, sklad: parsed.sklad };
    } catch {
      return null;
    }
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

  /**
   * Kasuje jedno nagranie. Maszyneria była od początku (`drop`), brakowało
   * tylko drogi z zewnątrz — jedynym sposobem usunięcia czegokolwiek było
   * „wyczyść", które kasuje WSZYSTKO.
   */
  remove(id: number): void {
    this.drop(id);
    this.persistIndex();
  }

  clear(): void {
    for (const fight of [...this.index.fights]) this.drop(fight.id);
    // „Wyczyść" ma znaczyć wyczyść: gdyby cokolwiek zostało poza indeksem,
    // przycisk kłamałby, a miejsce dalej byłoby zajęte.
    this.sweepOrphans(new Set());
    this.active = [];
    this.failed = false;
    this.persistIndex();
  }

  /**
   * Zapis indeksu poza gorącą ścieżką: bezwarunkowy i bez `write`.
   *
   * Bez `write`, bo ono przy odmowie GASI nagrywanie — a kasowanie nagrań nie
   * może wyłączać zapisu; tu zresztą miejsca właśnie ubyło, nie przybyło.
   */
  private persistIndex(): void {
    this.indexDirty = false;
    this.indexDrift = 0;
    try {
      this.storage?.setItem(INDEX_KEY, JSON.stringify(this.index));
    } catch {
      // Indeks, którego nie dało się zapisać, odtworzy się przy starcie.
    }
  }

  /**
   * Nowa porcja z protokołu. Wołane przy każdym wywołaniu `Engine.battle.update`
   * niosącym komunikaty, tak jak `Session.updateEvents`.
   *
   * Jedna walka na raz — protokół nie ma bufora z kilkoma naraz, bo źródło
   * zeruje go przy każdej nowej. To jest cała różnica wobec wersji tekstowej,
   * która dopasowywała walki od KOŃCA bufora, bo log tracił treść od góry.
   */
  capture(porcja: PorcjaProtokolu): void {
    if (!this.on || this.failed) return;
    if (porcja.komunikaty.length === 0) return;

    const komunikaty = [...porcja.komunikaty];
    const sklad = [...porcja.sklad];
    const biezace = this.active[0];

    if (biezace && przedluza(biezace.komunikaty, komunikaty)) {
      biezace.komunikaty = komunikaty;
      biezace.sklad = sklad;
    } else {
      this.active = [{ id: this.index.next, komunikaty, sklad, saved: -1 }];
      this.index.next += 1;
    }

    const nagranie = this.active[0]!;
    const tresc = JSON.stringify({ komunikaty: nagranie.komunikaty, sklad: nagranie.sklad });
    if (tresc.length === nagranie.saved) return;
    if (!this.save(nagranie.id, tresc, tytul(nagranie.sklad))) return;
    nagranie.saved = tresc.length;
  }

  private save(id: number, text: string, title: string): boolean {
    const entry = this.index.fights.find((fight) => fight.id === id);
    const previousChars = entry?.chars;
    if (entry) entry.chars = text.length;
    else {
      this.index.fights.push({
        id,
        title,
        chars: text.length,
        at: this.now(),
      });
    }

    // Nowy wpis zmienia KSZTAŁT listy, samo `chars` tylko jej rozmiar — patrz
    // `saveIndex`. Ta różnica decyduje, czy indeks leci do magazynu teraz.
    if (entry) this.indexDrift += Math.abs(text.length - (previousChars ?? 0));
    else this.indexDirty = true;

    // Miejsce robimy PRZED zapisem i kosztem najstarszych nagrań — bieżąca
    // walka jest tą, której użytkownik pilnuje.
    this.evict(id);
    if (!this.write(KEY_PREFIX + id, text, id)) {
      // Zapis tekstu padł, więc wpis w indeksie obiecywałby nagranie, którego
      // nie ma: `read()` zwróciłby null, a `count()`/`chars()` liczyłyby widmo.
      if (entry) entry.chars = previousChars ?? 0;
      else this.index.fights = this.index.fights.filter((fight) => fight.id !== id);
      return false;
    }
    return this.saveIndex(id);
  }

  /**
   * Utrwala indeks — ale nie przy każdej linii logu.
   *
   * `save()` woła to przy KAŻDEJ zmianie tekstu walki, czyli kilka razy na
   * sekundę w środku walki, synchronicznie w wątku gry. Przy pełnym archiwum
   * (190 nagrań) indeks waży ~21 tys. znaków — tyle szło przez `JSON.stringify`
   * i `setItem` za każdym razem. To dokładnie ta praca, przed którą broni się
   * komentarz przy zapisie kluczem na walkę; indeks po prostu wymykał się temu
   * rozumowaniu.
   *
   * Dzielimy więc zmiany na dwa rodzaje:
   * - KSZTAŁT (doszło nagranie, wypadło nagranie) — zapis natychmiast, bo bez
   *   tego nagranie po odświeżeniu przepadłoby albo zostało widmem w indeksie;
   * - ROZMIAR (`chars` rośnie o kilkanaście znaków) — odkładamy, aż uzbiera się
   *   `INDEX_FLUSH_CHARS`.
   *
   * W pamięci `chars` jest ZAWSZE dokładne, więc budżet i eksmisja liczą się
   * poprawnie niezależnie od tego, kiedy indeks poszedł na dysk. Rozjazd dotyczy
   * wyłącznie odczytu po nagłym zamknięciu karty i jest ograniczony progiem —
   * przy budżecie 500 tys. znaków to ułamek procenta.
   */
  private saveIndex(keep?: number, force = false): boolean {
    if (!force && !this.indexDirty && this.indexDrift < INDEX_FLUSH_CHARS) return true;
    if (!this.write(INDEX_KEY, JSON.stringify(this.index), keep)) return false;
    this.indexDirty = false;
    this.indexDrift = 0;
    return true;
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
    this.indexDirty = true;
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
  private write(key: string, value: string, keep?: number): boolean {
    for (;;) {
      try {
        this.storage?.setItem(key, value);
        return true;
      } catch {
        // `keep` osobno od klucza: przy zapisie INDEKSU porównanie klucza nie
        // trafia w żadne nagranie, więc bez tego dało się skasować właśnie
        // nagrywaną walkę, żeby zrobić miejsce na indeks, który ją opisuje.
        const oldest = this.index.fights.find(
          (fight) => fight.id !== keep && KEY_PREFIX + fight.id !== key,
        );
        if (!oldest) break;
        this.drop(oldest.id);
      }
    }

    // Zwolnienie wszystkiego nie pomogło — miejsce skończyło się poza nami.
    this.failed = true;
    this.setOn(false);
    return false;
  }

  /**
   * Przestawia nagrywanie i UTRWALA to.
   *
   * Wygaszenie po braku miejsca zapisywało dotąd samo pole w pamięci, więc
   * znacznik w magazynie zostawał na „1": po odświeżeniu konstruktor czytał go
   * i nagrywanie wracało WŁĄCZONE, a czerwony pasek znikał razem z `failed`.
   * Użytkownik dostawał komunikat, robił F5 i komunikat przepadał — przy
   * niezmienionym stanie magazynu.
   */
  private setOn(on: boolean): void {
    this.on = on;
    try {
      // Wygaszenie KASUJE znacznik, zamiast zapisywać "0". Brak klucza czyta
      // się tak samo (`getItem(...) === "1"`), a różnica jest w tym, że
      // kasowanie ZWALNIA miejsce zamiast go potrzebować. To istotne właśnie
      // tutaj: najczęstszy powód wygaszania to magazyn, który odmówił zapisu —
      // gdyby utrwalenie tego faktu samo wymagało zapisu, padłoby razem z nim
      // i po odświeżeniu nagrywanie wracałoby włączone.
      if (on) this.storage?.setItem(FLAG_KEY, "1");
      else this.storage?.removeItem(FLAG_KEY);
    } catch {
      // Sam znacznik nie jest wart przewracania overlaya.
    }
  }

  /**
   * Wczytuje indeks, ufając mu tylko na tyle, na ile go sprawdzimy.
   *
   * Magazyn dzielimy z grą i z własnymi przyszłymi wersjami, więc pod kluczem
   * może stać cokolwiek. Wpis bez `chars` dawał `chars() === NaN`, a wtedy
   * `while (chars() > budget)` jest fałszem — eksmisja przestawała działać
   * i limit magazynu znikał po cichu. Pole `v` było przy tym WYMUSZANE na 1,
   * a nie sprawdzane, więc przyszły format czytałby się jako dzisiejszy.
   */
  /**
   * Kasuje nagrania, o których indeks nic nie wie.
   *
   * Bez tego uszkodzony indeks (obcy format, przerwany zapis, cudzy skrypt)
   * zostawiał teksty walk w magazynie NA ZAWSZE: `clear()` chodzi po indeksie,
   * więc ich nie widzi, `chars()` raportuje zero, a `evict()` uważa, że jest
   * miejsce. Do ~1 MB znikało z kubełka dzielonego z GRĄ — czyli dokładnie to,
   * przed czym broni się cały budżet tego modułu.
   *
   * Zbieramy klucze przed kasowaniem: `removeItem` przestawia indeksy w
   * `Storage`, więc kasowanie w trakcie przebiegu przeskakiwałoby co drugi.
   */
  private sweepOrphans(known: ReadonlySet<string>): void {
    const storage = this.storage;
    if (!storage?.key || storage.length === undefined) return;

    const orphans: string[] = [];
    try {
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key === null || !key.startsWith(KEY_PREFIX)) continue;
        // Indeks i znacznik nagrywania też mają ten prefiks, a nagraniami nie są.
        if (key === INDEX_KEY || key === FLAG_KEY || known.has(key)) continue;
        orphans.push(key);
      }
      for (const key of orphans) storage.removeItem(key);
    } catch {
      // Sprzątanie jest dodatkiem — jego awaria nie może przewrócić startu.
    }
  }

  private loadIndex(): Index {
    const fresh = (): Index => {
      // Pusty indeks znaczy, że ŻADEN klucz nagrania nie jest już nasz.
      this.sweepOrphans(new Set());
      return { ...EMPTY_INDEX, fights: [] };
    };
    try {
      const raw = this.storage?.getItem(INDEX_KEY);
      if (!raw) return fresh();
      const parsed = JSON.parse(raw) as Partial<Index>;
      if (parsed.v !== 2) return fresh();
      if (!Array.isArray(parsed.fights)) return fresh();

      const fights = parsed.fights.filter(isRecording);
      // Także tutaj: wpis odrzucony przez `isRecording` zostawia po sobie tekst
      // pod kluczem, którego indeks już nie wymienia.
      this.sweepOrphans(new Set(fights.map((fight) => KEY_PREFIX + fight.id)));
      // `next` nigdy poniżej największego znanego id — inaczej nowe nagranie
      // nadpisałoby stare pod tym samym kluczem.
      const highest = fights.reduce((max, fight) => Math.max(max, fight.id), 0);
      const next = typeof parsed.next === "number" && Number.isFinite(parsed.next) ? parsed.next : 0;
      return { v: 2, next: Math.max(next, highest + 1), fights };
    } catch {
      return fresh();
    }
  }
}
