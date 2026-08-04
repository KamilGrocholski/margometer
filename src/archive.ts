/**
 * Okno archiwum: lista nagranych walk i odtwarzanie.
 *
 * Statystyk nie liczymy tu od nowa — wczytana walka trafia do GŁÓWNEGO panelu
 * przez `showPreview`. Dzięki temu wszystko, co panel już umie (metryki, filtr
 * składu, na turę, drążenie w postać i w cel), działa dla nagrań za darmo.
 *
 * Nagrania zostają SUROWYMI KOMUNIKATAMI protokołu, a zdarzenia i statystyki
 * liczą się przy każdym otwarciu. Po każdej naprawie dekodera stare walki liczą
 * się więc poprawnie same z siebie — policzone raz i zamrożone w JSON-ie już by
 * się nie poprawiły.
 *
 * ⚠️ **Ręczne wklejenie logu zniknęło stąd 2026‑08‑04**, razem z odczytem ze
 * zdań. Wklejało się zdania z gry, a te nie są już dla dodatku czytelne:
 * protokół i zdanie to dwa różne języki i tłumaczy między nimi tylko sama gra.
 */
import { dekoduj } from "./protokol.ts";
import { SlownikGry, type Slownik, type TranslationGlobals } from "./slownik-gry.ts";
import type { RosterEntry } from "./roster.ts";
import type { Nagranie } from "./recorder.ts";
import { storedBoolean, storedNumber, storedRecord } from "./stored-state.ts";
import type { Recording } from "./recorder.ts";
import { aggregate, type BattleStats } from "./stats.ts";
import type { BattleEvent } from "./types.ts";
import { turnWord, type PreviewView, type ReplayView } from "./overlay.ts";
import { clampToViewport, makeDraggable, realTicker, type Ticker } from "./window.ts";
import { Confirm } from "./confirm.ts";

/** Tyle, ile archiwum potrzebuje od nagrywarki. */
export type ArchiveRecorder = {
  list(): Recording[];
  read(id: number): Nagranie | null;
  /** Kasowanie pojedynczego nagrania. Opcjonalne — atrapy w testach go nie mają. */
  remove?(id: number): void;
};

/** Tyle, ile archiwum potrzebuje od panelu. */
export type PreviewHost = {
  shadow: ShadowRoot;
  showPreview(stats: BattleStats, view: PreviewView): void;
  closePreview(): void;
  refresh(): void;
};

type ArchiveState = { x: number; y: number; open: boolean };

const STORAGE_KEY = "margometer.archive";
/** Musi się zgadzać z `width` w arkuszu — przycinanie pozycji liczy się z niej. */
const ARCHIVE_WIDTH = 300;
const DEFAULT_STATE: ArchiveState = { x: 300, y: 16, open: false };

/** Prędkości odtwarzania w kółko — tyle wystarcza, żeby przejrzeć długą walkę. */
const SPEEDS = [1, 2, 4] as const;
/** Odstęp między liniami przy 1×. Wolniej niż gra, bo tu się patrzy na licznik. */
const STEP_MS = 250;
/** Jak długo stoi odpowiedź na kliknięcie, które nic nie zrobiło. */
const NOTICE_MS = 4000;

/**
 * Ile wierszy zahacza o widoczną część listy.
 *
 * Wyprowadzone z arkusza niżej: `.archive-list` ma `max-height: 320px`, a wiersz
 * to nazwa (12px × 1.35 ≈ 16px), metryka (11px × 1.35 ≈ 15px), `padding: 5px`
 * z dwóch stron i kreska pod spodem — razem ~42px. 320 / 42 ≈ 7,6, więc ósmy
 * wiersz jeszcze wystaje zza krawędzi.
 *
 * Liczba jest z natury przybliżona i taka ma zostać. Pomyłka w górę kosztuje
 * kilka milisekund, pomyłka w dół — jedno domalowanie wiersza przy dolnej
 * krawędzi. Obie są tańsze niż pytanie o prawdziwy layout: `getBoundingClientRect`
 * wymusiłby przeliczenie układu w tym samym wątku, który tu ratujemy, a jsdom
 * i tak zwraca z niego zera, więc testy nie miałyby czego sprawdzać.
 */
const VISIBLE_ROWS = 8;
/**
 * Porcja dopełniania i odstęp między porcjami.
 *
 * Odczyt plus `aggregate` kosztował ~1,4 ms na nagranie (pomiar 2026‑08‑02,
 * średnia 15 kB), więc ósemka mieści się w klatce. O to tu chodzi: nie
 * o to, żeby policzyć szybciej, tylko żeby NIGDY nie policzyć wszystkiego naraz.
 */
const FILL_CHUNK = 8;
const FILL_MS = 16;

/**
 * Etykieta nagrania.
 *
 * Do 2026‑08‑04 składała ją tu funkcja `labelOf`, czytając PIERWSZĄ LINIĘ
 * nagrania — czyli zdanie gry „Rozpoczęła się walka pomiędzy…".
 * Protokół takiego zdania nie musi nieść (klient syntetyzuje je sam, poza
 * `data.m`), więc tytuł składa dziś nagrywarka ze SKŁADU i zapisuje gotowy
 * w indeksie. Tutaj zostaje wyłącznie obrona przed pustym wpisem.
 */
export function fightLabel(title: string): string {
  return title.trim() === "" ? "walka bez składu" : title;
}

/** "19:04" dla dzisiejszych, "22.07 19:04" dla starszych. */
export function whenLabel(at: number, now: number): string {
  const date = new Date(at);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const today = new Date(now);
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  if (sameDay) return time;
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")} ${time}`;
}

/**
 * Co pokazać w wierszu poza nazwą — liczone leniwie, przy rysowaniu listy.
 *
 * NAZWY tu nie ma i to jest zmiana z 2026‑08‑04. Wcześniej składało się ją
 * z `fight-start` w strumieniu, więc żeby poznać skład walki, trzeba było ją
 * najpierw sparsować. Protokół `fight-start` nie niesie — klient syntetyzuje
 * linię otwierającą sam, poza `data.m` — więc tytuł zna wyłącznie nagrywarka,
 * która widziała roster, i zapisuje go gotowy w indeksie. Wiersz bierze nazwę
 * stamtąd i nie ma już powodu na nią czekać.
 */
type Summary = {
  stats: BattleStats;
  outcome: "victory" | "defeat" | "draw" | null;
  turns: number;
  damage: number;
};

function summarize(events: BattleEvent[], sklad: RosterEntry[]): Summary {
  // SKŁAD IDZIE DO AGREGATU, a nie tylko do dekodera. Bez niego wszyscy aktorzy
  // mają `side: null` i `inRoster: false`: filtr „nasi / obcy" w podglądzie nie
  // ma czego filtrować, a postać, która nic nie zdążyła zrobić, wypada z listy
  // zamiast stać na zerach. Na żywo robi to `Session.updateEvents`; nagranie
  // trzyma skład właśnie po to, żeby dało się to powtórzyć po tygodniu.
  const stats = aggregate(events, sklad);
  const end = events.find((event) => event.kind === "fight-end");
  return {
    stats,
    outcome: end?.outcome ?? null,
    turns: stats.timeline.length,
    damage: stats.actors.reduce((sum, actor) => sum + actor.damageDealt, 0),
  };
}

const number = new Intl.NumberFormat("pl-PL");

export type ArchiveOptions = {
  recorder: ArchiveRecorder;
  overlay: PreviewHost;
  /** `| undefined` jawnie — patrz `RecorderOptions.storage`. */
  storage?: Pick<Storage, "getItem" | "setItem"> | undefined;
  ticker?: Ticker;
  now?: () => number;
  /**
   * Brzmienia efektów przy odtwarzaniu. Domyślnie z gry — archiwum otwiera się
   * na jej stronie, więc `window._t` tam jest. Wstrzykiwane, bo poza stroną
   * (test, przyszłe odtwarzanie offline) trzeba je wziąć skądinąd, a milczący
   * `globalThis` dawałby to samo co brak słownika i nikt by nie wiedział, czy
   * tak miało być.
   */
  slownik?: Slownik;
};

export class Archive {
  private readonly recorder: ArchiveRecorder;
  private readonly overlay: PreviewHost;
  private readonly storage: ArchiveOptions["storage"];
  private readonly ticker: Ticker;
  private readonly now: () => number;
  private readonly window: HTMLElement;
  private state: ArchiveState;
  /**
   * Policzone podsumowania nagrań. Parsujemy dopiero przy rysowaniu listy i już
   * nie powtarzamy: przy zapisie liczyłaby to samo, co `Session` liczy na żywo.
   */
  private readonly summaries = new Map<string, Summary>();
  private readonly slownik: Slownik;
  /**
   * Wiersze czekające na podsumowanie — patrz `renderList`.
   *
   * Trzymamy WĘZEŁ, nie indeks: `render()` buduje listę od nowa, więc indeks
   * po chwili wskazywałby cudzy wiersz albo nic.
   */
  private pending: { row: HTMLElement; entry: Recording }[] = [];
  private fillHandle: number | null = null;
  /** Które nagranie jest właśnie w podglądzie — do podświetlenia wiersza. */
  private opened: number | null = null;
  /** Identyfikatory nagrań z ostatniego renderu listy — patrz `sync`. */
  private listSignature = "";
  /**
   * Pytanie „na pewno?" przy kasowaniu POJEDYNCZEGO nagrania.
   *
   * Ta sama klasa co przy „wyczyść" w panelu — wcześniej były dwie i różniły
   * się w najgorszy możliwy sposób: tamta wygasała (choć niewidocznie), a ta
   * nie wygasała WCALE. Uzbrojona destrukcja wisiała więc bez końca; wystarczyło
   * kliknąć ✕, odejść i wrócić po godzinie w to samo miejsce.
   */
  private readonly confirmRemove: Confirm<number>;
  /**
   * Krótka odpowiedź na kliknięcie, które nic nie zrobiło.
   *
   * Trzy miejsca wychodziły dotąd cichym `return`: „wczytaj" przy pustym polu
   * oraz wiersz nagrania, którego tekst zniknął spod indeksu. Klik wyglądał
   * wtedy jak awaria przycisku, a był poprawną odmową.
   */
  private notice: string | null = null;
  private noticeHandle: number | null = null;
  private replay: {
    komunikaty: string[];
    sklad: RosterEntry[];
    /** Ile komunikatów już podano licznikowi. */
    at: number;
    playing: boolean;
    speed: number;
    turns: number;
    handle: number | null;
    view: PreviewView;
  } | null = null;

  constructor(options: ArchiveOptions) {
    this.recorder = options.recorder;
    this.overlay = options.overlay;
    this.storage = options.storage;
    this.ticker = options.ticker ?? realTicker;
    this.now = options.now ?? Date.now;
    this.slownik = options.slownik ?? new SlownikGry(globalThis as TranslationGlobals);
    this.confirmRemove = new Confirm<number>({
      now: this.now,
      ticker: this.ticker,
      // Wygaśnięcie musi przerysować listę, żeby zdjąć „na pewno?" z wiersza.
      onExpire: () => this.render(),
    });
    this.state = this.loadState();

    // Arkusza NIE wstrzykujemy: reguły archiwum siedzą w `src/style.ts` razem
    // z regułami panelu i wchodzą do shadow roota raz, przy powstaniu overlaya.
    // Dwa arkusze w jednym zasięgu (a ten jest jeden) nie dawały archiwum
    // własnego stylu — dawały tylko złudzenie, że je ma.
    this.window = document.createElement("div");
    this.window.className = "archive";
    this.window.hidden = true;
    this.overlay.shadow.append(this.window);

    if (this.state.open) this.render();
  }

  isOpen(): boolean {
    return this.state.open;
  }

  /**
   * Odświeża listę, gdy przybyło nagrań. Wołane z każdego renderu panelu, więc
   * porównuje same identyfikatory: przebudowa dwustu wierszy przy KAŻDEJ nowej
   * linii logu kosztowałaby więcej, niż warta jest świeża liczba tur w wierszu
   * trwającej walki.
   */
  sync(): void {
    if (!this.state.open) return;
    const signature = this.recorder
      .list()
      .map((one) => one.id)
      .join(",");
    if (signature === this.listSignature) return;
    this.listSignature = signature;
    this.render();
  }

  toggle(): void {
    // Zamknięte okno nie może zostawiać uzbrojonego kasowania: po ponownym
    // otwarciu wiersz wyglądałby normalnie, a pierwszy klik już by kasował.
    this.confirmRemove.cancel();
    this.state.open = !this.state.open;
    this.saveState();
    if (this.state.open) this.render();
    else {
      this.window.hidden = true;
      // Zamknięcie okna kończy dopełnianie. Bez tego zegar dolicza dalej wiersze
      // schowanego okna: zmierzone na 190 nagraniach — 8 policzonych przy
      // otwarciu, a po zamknięciu kolejne 182, czyli **193 ms w wątku gry**
      // wydane na listę, której nie ma na ekranie. To trzy czwarte kosztu,
      // który cała leniwa ścieżka miała usunąć (269 ms), tylko przesunięte
      // w czasie. `destroy()` robił to od początku poprawnie — `toggle()` nie.
      this.stopFilling();
      this.pending = [];
    }
    // Przycisk ▤ w nagłówku panelu pokazuje stan okna — musi się odświeżyć.
    this.overlay.refresh();
  }

  /**
   * Wpis indeksu razem z treścią — albo `null`, gdy którejkolwiek połowy brak.
   *
   * Obie są potrzebne RAZEM: treść niesie komunikaty, a wpis niesie tytuł
   * i `chars`, czyli klucz cache'u. Wpis bez treści to nagranie, które
   * przepadło spod indeksu; treść bez wpisu to sierota, której archiwum
   * i tak nie pokazuje.
   */
  private nagranieZWpisem(id: number): { entry: Recording; nagranie: Nagranie } | null {
    const entry = this.recorder.list().find((one) => one.id === id);
    if (!entry) return null;
    const nagranie = this.recorder.read(id);
    return nagranie === null ? null : { entry, nagranie };
  }

  /** Wczytuje nagranie do panelu jako gotowe statystyki. */
  open(id: number): void {
    const found = this.nagranieZWpisem(id);
    // Indeks obiecuje nagranie, którego pod kluczem nie ma — wiersz wygląda
    // normalnie, a klik nie robił nic. Lepiej powiedzieć, że przepadło.
    if (found === null) {
      this.say("Tego nagrania już nie ma w pamięci przeglądarki.");
      return;
    }
    this.stopReplay();
    this.opened = id;
    this.overlay.showPreview(
      this.summaryOf(found.entry, found.nagranie).stats,
      this.viewFor(found.entry, null),
    );
    this.render();
  }

  /** Wczytuje nagranie i odtwarza je od pierwszego komunikatu. */
  play(id: number): void {
    const found = this.nagranieZWpisem(id);
    if (found === null) {
      this.say("Tego nagrania już nie ma w pamięci przeglądarki.");
      return;
    }
    this.stopReplay();
    this.opened = id;

    const view = this.viewFor(found.entry, null);
    this.replay = {
      komunikaty: found.nagranie.komunikaty,
      sklad: found.nagranie.sklad,
      at: 0,
      playing: false,
      speed: 1,
      turns: this.summaryOf(found.entry, found.nagranie).turns,
      handle: null,
      view,
    };
    // Pierwsza klatka to pusta walka — odtwarzanie ma się zaczynać od zera,
    // a nie od gotowego wyniku.
    this.seek(0);
    this.setPlaying(true);
    this.render();
  }


  private closePreview(): void {
    this.stopReplay();
    this.opened = null;
    this.overlay.closePreview();
    this.render();
  }

  private viewFor(entry: Recording, replay: ReplayView | null): PreviewView {
    return {
      source: `z archiwum · ${whenLabel(entry.at, this.now())}`,
      title: fightLabel(entry.title),
      replay,
      close: () => this.closePreview(),
    };
  }

  /**
   * Świeży opis stanu odtwarzania dla panelu.
   *
   * Statystyki klatki dostaje z zewnątrz, a nie liczy sam: potrzebuje z nich
   * wyłącznie liczby tur do etykiety, a `pushFrame` i tak musi je mieć dla
   * panelu. Liczone tu osobno znaczyły PODWÓJNE parsowanie prefiksu na każdą
   * klatkę — przy dłuższym nagraniu sekundy pracy na jedno odtworzenie.
   */
  private currentReplayView(shown: BattleStats): ReplayView | null {
    const replay = this.replay;
    if (!replay) return null;
    return {
      playing: replay.playing,
      progress: replay.komunikaty.length === 0 ? 0 : replay.at / replay.komunikaty.length,
      speed: replay.speed,
      label: `tura ${shown.timeline.length}/${replay.turns}`,
      toggle: () => this.setPlaying(!replay.playing),
      cycleSpeed: () => this.cycleSpeed(),
      seek: (fraction) => this.seek(Math.round(fraction * replay.komunikaty.length)),
    };
  }

  private frameStats(at: number, replay = this.replay!): BattleStats {
    // Dekodujemy CAŁY prefiks od nowa, dokładnie jak `Session` przy każdej
    // porcji w grze — dzięki temu odtwarzanie idzie tą samą ścieżką co licznik
    // na żywo i nie ma osobnej, drugiej prawdy.
    //
    // ⚠️ Zniknęło stąd zdejmowanie ostatniego `unknown`. Przy zdaniach krok po
    // LINII potrafił zatrzymać się między „uderzył" a „otrzymał", więc odczyt
    // słusznie zgłaszał niedomknięty cios — a w połowie odtwarzania to była
    // klatka złapana w pół akcji, nie zmiana formatu. Protokół takiego stanu
    // nie ma: jeden komunikat niesie CAŁY blok, więc prefiks komunikatów jest
    // zawsze domknięty i każdy `unknown` znaczy to samo, co w grze.
    return aggregate(
      dekoduj(replay.komunikaty.slice(0, at), replay.sklad, this.slownik),
      replay.sklad,
    );
  }

  private setPlaying(playing: boolean): void {
    const replay = this.replay;
    if (!replay) return;

    // Koniec logu: „graj" startuje od początku, zamiast stać w miejscu.
    if (playing && replay.at >= replay.komunikaty.length) replay.at = 0;
    replay.playing = playing;
    if (replay.handle !== null) {
      this.ticker.stop(replay.handle);
      replay.handle = null;
    }
    if (playing) {
      replay.handle = this.ticker.start(() => this.step(), STEP_MS / replay.speed);
    }
    this.pushFrame();
  }

  private cycleSpeed(): void {
    const replay = this.replay;
    if (!replay) return;
    const next = SPEEDS[(SPEEDS.indexOf(replay.speed as 1 | 2 | 4) + 1) % SPEEDS.length]!;
    replay.speed = next;
    // Zegar chodzi ze starym odstępem — przestawiamy go, zachowując stan gry.
    if (replay.playing) this.setPlaying(true);
    else this.pushFrame();
  }

  private step(): void {
    const replay = this.replay;
    if (!replay) return;
    if (replay.at >= replay.komunikaty.length) {
      this.setPlaying(false);
      return;
    }
    replay.at += 1;
    this.pushFrame();
  }

  private seek(at: number): void {
    const replay = this.replay;
    if (!replay) return;
    replay.at = Math.max(0, Math.min(at, replay.komunikaty.length));
    this.pushFrame();
  }

  private pushFrame(): void {
    const replay = this.replay;
    if (!replay) return;
    const shown = this.frameStats(replay.at);
    replay.view.replay = this.currentReplayView(shown);
    this.overlay.showPreview(shown, replay.view);
  }

  private stopReplay(): void {
    const handle = this.replay?.handle;
    if (handle != null) this.ticker.stop(handle);
    this.replay = null;
  }

  /**
   * Kluczem jest `chars` Z INDEKSU, nie samo `id`: nagranie trwającej walki
   * rośnie, a jej podsumowanie musi rosnąć razem z nim.
   *
   * ⚠️ **Musi to być liczba, którą `cached()` zna BEZ wczytywania nagrania** —
   * inaczej pytanie „czy trzeba liczyć" kosztowałoby dokładnie tę pracę, której
   * unikamy. Dlatego nie `komunikaty.length`, choć byłoby czytelniejsze:
   * długości listy nie da się poznać, nie czytając JSON-a. `chars` mierzy
   * dokładnie ten JSON (`recorder.ts` ustawia je na `text.length` przy zapisie),
   * więc rośnie razem z komunikatami.
   */
  private summaryOf(entry: Recording, nagranie: Nagranie): Summary {
    const key = `${entry.id}:${entry.chars}`;
    const cached = this.summaries.get(key);
    if (cached) return cached;
    // Klucz niesie ROZMIAR, więc trwające nagranie zakłada nowy wpis przy
    // każdym doczytaniu, a stary zostaje z pełnym `BattleStats` w środku (z osią
    // tur i macierzą). Zdejmujemy poprzednie wersje TEGO nagrania — cache ma
    // pamiętać ostatni kształt, nie historię kształtów.
    for (const old of this.summaries.keys()) {
      if (old !== key && old.startsWith(`${entry.id}:`)) this.summaries.delete(old);
    }
    const summary = summarize(
      dekoduj(nagranie.komunikaty, nagranie.sklad, this.slownik),
      nagranie.sklad,
    );
    this.summaries.set(key, summary);
    return summary;
  }

  /**
   * Wyrzuca z cache'u nagrania, których nie ma już na liście.
   *
   * Kasowanie ręczne czyściło cache w całości, ale EKSMISJA po przekroczeniu
   * budżetu dzieje się w nagrywarce i archiwum się o niej nie dowiaduje —
   * podsumowanie skasowanego nagrania zostawało w pamięci do końca sesji.
   */
  private forgetMissing(alive: Iterable<number>): void {
    const ids = new Set(alive);
    for (const key of this.summaries.keys()) {
      const id = Number(key.slice(0, key.indexOf(":")));
      if (!ids.has(id)) this.summaries.delete(key);
    }
  }

  private render(): void {
    if (!this.state.open) return;
    this.window.hidden = false;
    // Lista powstaje od nowa, więc przewinięcie trzeba przenieść ręcznie —
    // inaczej po każdej skończonej walce skakałaby na górę, choć patrzy się
    // właśnie na stare nagranie.
    const scroll = this.window.querySelector(".archive-list")?.scrollTop ?? 0;
    this.window.textContent = "";
    // Przez `moveTo`, a nie prosto w styl: zapisana pozycja mogła powstać na
    // szerszym ekranie i musi zostać przycięta, zanim okno się pokaże.
    this.moveTo(this.state.x, this.state.y);
    const list = this.renderList();
    this.window.append(this.renderHeader());
    // Odpowiedź na odmowę idzie NAD listą: to reakcja na właśnie wykonany gest,
    // więc ma być tam, gdzie patrzy oko, a nie na końcu okna.
    if (this.notice !== null) {
      this.window.append(
        Object.assign(document.createElement("div"), {
          className: "archive-notice",
          textContent: this.notice,
        }),
      );
    }
    this.window.append(list);
    list.scrollTop = scroll;
  }

  private renderHeader(): HTMLElement {
    const header = document.createElement("header");
    const title = document.createElement("span");
    title.className = "title";
    title.textContent = "Archiwum walk";


    const close = document.createElement("button");
    close.type = "button";
    close.dataset.action = "archive-close";
    close.textContent = "✕";
    close.setAttribute("aria-label", "Zamknij archiwum");
    close.addEventListener("click", () => this.toggle());

    header.append(title, close);
    makeDraggable(header, {
      position: () => ({ x: this.state.x, y: this.state.y }),
      move: (x, y) => this.moveTo(x, y),
      end: () => this.saveState(),
    });
    return header;
  }

  /**
   * Przesuwa okno, pilnując, żeby zostało w zasięgu myszy. Uchwytem jest sam
   * nagłówek, a razem z oknem ucieka za krawędź jego ✕ — po zsunięciu okna nie
   * dałoby się już ani złapać, ani zamknąć, a pozycja przeżywa odświeżenie.
   */
  private moveTo(x: number, y: number): void {
    const clamped = clampToViewport(x, y, ARCHIVE_WIDTH);
    this.state.x = clamped.x;
    this.state.y = clamped.y;
    this.window.style.left = `${clamped.x}px`;
    this.window.style.top = `${clamped.y}px`;
  }

  private renderList(): HTMLElement {
    const list = document.createElement("div");
    list.className = "archive-list";

    // Kolejka jest własnością TEGO renderu: węzły z poprzedniego są już odpięte
    // od dokumentu, więc dopełnianie ich byłoby liczeniem w próżnię.
    this.stopFilling();
    this.pending = [];

    // Najnowsze na górze — szuka się zwykle walki sprzed chwili.
    const entries = [...this.recorder.list()].sort((a, b) => b.at - a.at);
    this.forgetMissing(entries.map((one) => one.id));
    if (entries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "archive-empty";
      empty.textContent = "Brak nagrań. Włącz ⏺ w nagłówku, żeby zacząć zapisywać walki.";
      list.append(empty);
      return list;
    }

    // Widoczne wiersze liczą się od razu, reszta czeka na tykanie. Lista jest
    // posortowana najnowsze-pierwsze, więc „widoczne" to po prostu pierwsze —
    // i dlatego nie trzeba pytać o geometrię, żeby wiedzieć, na co ktoś patrzy.
    entries.forEach((entry, at) => list.append(this.renderRow(entry, at < VISIBLE_ROWS)));
    this.startFilling();
    return list;
  }

  /**
   * Czy podsumowanie tego nagrania jest już policzone — bez sięgania po treść.
   *
   * Klucz jest TEN SAM, co w `summaryOf`; powód, dla którego stoi na `chars`,
   * a nie na liczbie komunikatów, jest opisany tam.
   */
  private cached(entry: Recording): boolean {
    return this.summaries.has(`${entry.id}:${entry.chars}`);
  }

  /**
   * Podsumowanie wiersza — z cache'u, a dopiero potem z magazynu.
   *
   * Kolejność jest tu całą treścią. Gdyby klucz cache'u wymagał TREŚCI
   * nagrania, pytanie o gotowy wynik znaczyłoby wczytanie go z magazynu.
   * `render()` leci po każdej skończonej walce, a wiersze powstają wtedy od
   * nowa — przy 190 nagraniach byłby to komplet odczytów z `localStorage` za
   * każdym razem, tylko po to, żeby trafić w cache.
   */
  private summaryFor(entry: Recording): Summary | null {
    const cached = this.summaries.get(`${entry.id}:${entry.chars}`);
    if (cached) return cached;
    const nagranie = this.recorder.read(entry.id);
    if (nagranie === null) return null;
    return this.summaryOf(entry, nagranie);
  }

  /**
   * Dopełnia wiersze porcjami, zamiast policzyć wszystko przy otwarciu.
   *
   * Zanim to powstało, `renderList` liczyło `parse` + `aggregate` dla KAŻDEGO
   * nagrania, choć lista pokazuje ~8 wierszy. Zmierzone przed zmianą: 190 nagrań
   * po ~15 kB to **269 ms** zamrożonego wątku gry — a wątek jest jeden i wspólny
   * z grą. Dodatek, który obiecuje, że „nie dotyka gry", nie może jej zacinać
   * na ćwierć sekundy za każdym otwarciem archiwum.
   */
  private startFilling(): void {
    this.stopFilling();
    if (this.pending.length === 0) return;
    this.fillHandle = this.ticker.start(() => {
      for (let i = 0; i < FILL_CHUNK; i += 1) {
        const next = this.pending.shift();
        if (!next) break;
        this.fillRow(next.row, next.entry);
      }
      if (this.pending.length === 0) this.stopFilling();
    }, FILL_MS);
  }

  private stopFilling(): void {
    if (this.fillHandle !== null) this.ticker.stop(this.fillHandle);
    this.fillHandle = null;
  }

  /**
   * Dokłada do wiersza to, co pochodzi z podsumowania — resztę narysował już
   * `renderRow` z samego indeksu.
   *
   * NAZWY tu nie ma: tytuł stoi w indeksie i wiersz ma go od pierwszej klatki.
   * Wcześniej `fillRow` go PODMIENIAŁ, bo skład dawało się poznać dopiero po
   * sparsowaniu logu — więc wiersz spod krawędzi wisiał przez chwilę z inną
   * nazwą niż docelowa.
   *
   * Węzeł wyszukiwany po klasie, a nie przekazywany parametrem, bo woła to
   * dwoje: `renderRow` od razu (wiersz widoczny albo policzony wcześniej)
   * i krok tickera później (wiersz spod krawędzi).
   */
  private fillRow(row: HTMLElement, entry: Recording): void {
    const summary = this.summaryFor(entry);
    // Nagranie zniknęło spod indeksu — wiersz zostaje przy samej godzinie.
    if (summary === null) return;

    const meta = row.querySelector<HTMLElement>(".archive-meta");
    if (!meta) return;
    meta.textContent = [
      whenLabel(entry.at, this.now()),
      `${summary.turns} ${turnWord(summary.turns)}`,
      `${number.format(summary.damage)} obr.`,
    ].join(" · ");

    if (summary.outcome === "victory" || summary.outcome === "defeat") {
      const mark = document.createElement("span");
      mark.className = summary.outcome === "victory" ? "archive-win" : "archive-loss";
      mark.textContent = summary.outcome === "victory" ? " ✓" : " ✗";
      meta.append(mark);
    }
  }

  /**
   * Wiersz listy. `eager` mówi, czy podsumowanie ma się policzyć TERAZ.
   *
   * Skorupa stoi wyłącznie na indeksie nagrywarki (tytuł, godzina) — jest więc
   * darmowa. Wszystko, co wymaga przeczytania i sparsowania logu, dokłada
   * `fillRow`: od razu dla wierszy widocznych, później dla reszty.
   */
  private renderRow(entry: Recording, eager: boolean): HTMLElement {
    const row = document.createElement("div");
    row.className = this.opened === entry.id ? "archive-row is-open" : "archive-row";
    row.dataset.recording = String(entry.id);

    const box = document.createElement("div");
    box.className = "grow";
    const name = document.createElement("div");
    name.className = "archive-name";
    // Tytuł z indeksu i to jest już nazwa OSTATECZNA — złożyła ją nagrywarka
    // ze składu, który widziała w chwili nagrywania.
    name.textContent = fightLabel(entry.title);
    // Jedyny wyjątek od zasady „bez natywnych dymków" (patrz `overlay.ts`):
    // archiwum nie ma własnej warstwy dymka, a ucięty skład jest nie do
    // odczytania w żaden inny sposób.
    name.title = name.textContent;

    const meta = document.createElement("div");
    meta.className = "archive-meta";
    meta.textContent = whenLabel(entry.at, this.now());

    box.append(name, meta);
    row.append(box);

    const play = document.createElement("button");
    play.type = "button";
    play.dataset.action = "archive-play";
    play.textContent = "▶";
    play.setAttribute("aria-label", "Odtwórz walkę");
    play.addEventListener("click", (event) => {
      // Bez tego kliknięcie poszłoby też w wiersz i wczytało gotowy wynik.
      event.stopPropagation();
      this.play(entry.id);
    });
    row.append(play);

    if (this.recorder.remove) {
      const drop = document.createElement("button");
      drop.type = "button";
      drop.dataset.action = "archive-remove";
      const asking = this.confirmRemove.pending(entry.id);
      // Słowo, nie „✕". Ten sam glif stał w nagłówku okna i znaczył tam
      // „zamknij" — dwa skutki, jeden ekran, a jeden z nich NIEODWRACALNY.
      // Rozróżnienie idzie przez słowo, a nie przez drugi glif, bo kosz jest
      // w większości fontów emoji: kolorowy i inny na każdym systemie, w panelu
      // złożonym wyłącznie z monochromatycznych znaków. Przy okazji nazwanie
      // rzeczy po imieniu jest tu zaletą — to jedyny nieodwracalny przycisk
      // w dodatku, więc odrobina tarcia mu służy. Stan pytania już był słowem.
      drop.textContent = asking ? "na pewno?" : "usuń";
      drop.setAttribute("aria-label", asking ? "Potwierdź usunięcie" : "Usuń nagranie");
      drop.addEventListener("click", (event) => {
        event.stopPropagation();
        // Nagrania nie da się odzyskać, więc pierwszy klik tylko pyta —
        // ten sam wzorzec i ta sama implementacja co przy „wyczyść" w panelu.
        if (this.confirmRemove.ask(entry.id)) {
          if (this.opened === entry.id) this.closePreview();
          this.recorder.remove?.(entry.id);
          // Stało tu `this.summaries.clear()` i przez to skasowanie JEDNEGO
          // wiersza wyrzucało cache całego archiwum: zmierzone na 20
          // policzonych nagraniach — po skasowaniu jednego 19 liczyło się od
          // nowa (8 od razu, 11 w tle) zamiast zera. Nic tu nie wchodzi
          // w zamian, bo `renderList` woła `forgetMissing` z listą żywych
          // nagrań i to ono zdejmuje klucze skasowanego — dokładnie ten wpis
          // i tylko jego. `render()` leci linijkę niżej.
          this.listSignature = "";
          this.overlay.refresh();
        }
        this.render();
      });
      row.append(drop);
    }

    row.addEventListener("click", () => this.open(entry.id));

    // Policzone już podsumowanie jest darmowe, więc wiersz nie ma powodu mrugać
    // — i dlatego ponowne otwarcie archiwum wygląda jak dawniej, natychmiast.
    if (eager || this.cached(entry)) this.fillRow(row, entry);
    else this.pending.push({ row, entry });
    return row;
  }

  /**
   * Mówi jedno zdanie i gasi je po chwili.
   *
   * Bez gaszenia komunikat zostawałby na ekranie do końca sesji i po kilku
   * kliknięciach okno byłoby listą starych odmów zamiast listą nagrań.
   */
  private say(text: string): void {
    this.notice = text;
    if (this.noticeHandle !== null) this.ticker.stop(this.noticeHandle);
    this.noticeHandle = this.ticker.start(() => {
      if (this.noticeHandle !== null) this.ticker.stop(this.noticeHandle);
      this.noticeHandle = null;
      this.notice = null;
      this.render();
    }, NOTICE_MS);
    this.render();
  }

  /**
   * Zatrzymuje wszystko, co odlicza: odtwarzanie, dopełnianie listy, gasnący
   * komunikat i pytanie „na pewno?". Bez tego zegary chodziłyby po zniknięciu
   * panelu i wołały `render()` na drzewie, którego już nie ma.
   */
  destroy(): void {
    this.stopReplay();
    this.stopFilling();
    this.pending = [];
    this.confirmRemove.cancel();
    if (this.noticeHandle !== null) this.ticker.stop(this.noticeHandle);
    this.noticeHandle = null;
    this.window.remove();
  }

  /** Ta sama ostrożność co przy panelu — patrz `stored-state.ts`. */
  private loadState(): ArchiveState {
    const stored = storedRecord(this.storage, STORAGE_KEY);
    if (!stored) return { ...DEFAULT_STATE };
    const maxX = Math.max(1, window.innerWidth);
    const maxY = Math.max(1, window.innerHeight);
    return {
      x: storedNumber(stored["x"], DEFAULT_STATE.x, -maxX, maxX),
      y: storedNumber(stored["y"], DEFAULT_STATE.y, -maxY, maxY),
      open: storedBoolean(stored["open"], DEFAULT_STATE.open),
    };
  }

  private saveState(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Brak magazynu nie jest powodem, żeby przewrócić okno.
    }
  }
}
