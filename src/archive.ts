/**
 * Okno archiwum: lista nagranych walk, ręczne wklejenie logu i odtwarzanie.
 *
 * Statystyk nie liczymy tu od nowa — wczytana walka trafia do GŁÓWNEGO panelu
 * przez `showPreview`. Dzięki temu wszystko, co panel już umie (metryki, filtr
 * składu, na turę, drążenie w postać i w cel), działa dla nagrań za darmo.
 *
 * Nagrania zostają surowym logiem, a statystyki liczą się przy każdym otwarciu.
 * Po każdej naprawie parsera stare walki liczą się więc poprawnie same z siebie
 * — policzone raz i zamrożone w JSON-ie już by się nie poprawiły.
 */
import { parse } from "./parser.ts";
import type { Recording } from "./recorder.ts";
import { aggregate, type BattleStats } from "./stats.ts";
import type { BattleEvent } from "./types.ts";
import type { PreviewView, ReplayView } from "./overlay.ts";
import { clampToViewport, makeDraggable, realTicker, type Ticker } from "./window.ts";

/** Tyle, ile archiwum potrzebuje od nagrywarki. */
export type ArchiveRecorder = {
  list(): Recording[];
  read(id: number): string | null;
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

const STYLE = `
/* \`hidden\` przegrywa z \`display: flex\` niżej — bez tej reguły zamknięte okno
   byłoby dalej widoczne. */
.archive[hidden] { display: none; }
.archive {
  position: fixed;
  z-index: 1;
  width: 300px;
  background: rgba(22, 22, 26, 0.96);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--ink);
  font-size: 12px;
  line-height: 1.35;
  box-shadow: 0 6px 20px rgb(0 0 0 / 45%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.archive header { cursor: grab; }
.archive header.dragging { cursor: grabbing; }
/* Lista przewija się w środku okna: nagrań bywa ~190, a okno ma zostać oknem. */
.archive-list { max-height: 320px; overflow-y: auto; }
.archive-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  cursor: pointer;
  border-bottom: 1px solid rgb(53 53 59 / 45%);
}
.archive-row:hover { background: #26262c; }
.archive-row.is-open { background: #2f2f37; }
.archive-row .grow { flex: 1; min-width: 0; }
.archive-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.archive-meta { font-size: 11px; color: var(--ink-muted); opacity: 0.75; }
.archive-win { color: var(--mine); }
.archive-loss { color: var(--enemy); }
.archive-empty { padding: 10px 8px; font-size: 11px; opacity: 0.75; }
.archive-paste { display: flex; flex-direction: column; gap: 4px; padding: 6px 8px; }
.archive-paste textarea {
  all: unset;
  height: 90px;
  padding: 4px 6px;
  overflow: auto;
  white-space: pre;
  background: #101014;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--ink);
  font: 11px/1.35 ui-monospace, monospace;
}
/* Własna klasa, nie .row: tamta jest już zajęta przez wiersz rankingu w panelu
   (ten sam shadow root), który narzuca wysokość 20 px, ciemne tło i obcięcie. */
.archive-paste-actions { display: flex; gap: 6px; align-items: center; }
.archive-paste .hint { flex: 1; font-size: 11px; opacity: 0.75; }
`;

/** "Kamil vs Regulus", "Kamil, Fover vs Gnoll +2" — po składzie z linii otwierającej. */
function labelOf(events: BattleEvent[]): string {
  const start = events.find((event) => event.kind === "fight-start");
  if (!start) return "walka bez składu";

  const side = (which: number) =>
    start.participants.filter((one) => one.side === which).map((one) => one.name);
  const short = (names: string[]) =>
    names.length <= 2 ? names.join(", ") : `${names[0]}, ${names[1]} +${names.length - 2}`;

  const mine = short(side(0));
  const enemy = short(side(1));
  if (!mine || !enemy) return mine || enemy || "walka bez składu";
  return `${mine} vs ${enemy}`;
}

/**
 * Etykieta z samego tekstu. Nagranie bez linii otwierającej (gra przycięła log,
 * zanim je włączyliśmy) etykiety mieć nie może — i tak to mówi wprost.
 */
export function fightLabel(text: string): string {
  return labelOf(parse(text));
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

/** Co pokazać w wierszu poza nazwą — liczone leniwie, przy rysowaniu listy. */
type Summary = {
  stats: BattleStats;
  label: string;
  outcome: "victory" | "defeat" | "draw" | null;
  turns: number;
  damage: number;
};

function summarize(events: BattleEvent[]): Summary {
  const stats = aggregate(events);
  const end = events.find((event) => event.kind === "fight-end");
  return {
    stats,
    label: labelOf(events),
    outcome: end?.outcome ?? null,
    turns: stats.timeline.length,
    damage: stats.actors.reduce((sum, actor) => sum + actor.damageDealt, 0),
  };
}

const number = new Intl.NumberFormat("pl-PL");

export type ArchiveOptions = {
  recorder: ArchiveRecorder;
  overlay: PreviewHost;
  storage?: Pick<Storage, "getItem" | "setItem">;
  ticker?: Ticker;
  now?: () => number;
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
  /** Które nagranie jest właśnie w podglądzie — do podświetlenia wiersza. */
  private opened: number | null = null;
  /** Identyfikatory nagrań z ostatniego renderu listy — patrz `sync`. */
  private listSignature = "";
  private pasting = false;
  /** Trwałe pole wklejania — patrz `renderPaste`. */
  private pasteBox: HTMLElement | null = null;
  private replay: {
    lines: string[];
    /** Ile linii już podano licznikowi. */
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
    this.state = this.loadState();

    const style = document.createElement("style");
    style.textContent = STYLE;
    this.window = document.createElement("div");
    this.window.className = "archive";
    this.window.hidden = true;
    this.overlay.shadow.append(style, this.window);

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
    this.state.open = !this.state.open;
    this.saveState();
    if (this.state.open) this.render();
    else this.window.hidden = true;
    // Przycisk ▤ w nagłówku panelu pokazuje stan okna — musi się odświeżyć.
    this.overlay.refresh();
  }

  /** Wczytuje nagranie do panelu jako gotowe statystyki. */
  open(id: number): void {
    const text = this.recorder.read(id);
    if (text === null) return;
    this.stopReplay();
    this.opened = id;
    this.overlay.showPreview(this.summaryOf(id, text).stats, this.viewFor(id, text, null));
    this.render();
  }

  /** Wczytuje nagranie i odtwarza je od pierwszej linii. */
  play(id: number): void {
    const text = this.recorder.read(id);
    if (text === null) return;
    this.stopReplay();
    this.opened = id;

    const lines = text.split("\n").filter((line) => line.trim() !== "");
    const view = this.viewFor(id, text, null);
    this.replay = {
      lines,
      at: 0,
      playing: false,
      speed: 1,
      turns: this.summaryOf(id, text).turns,
      handle: null,
      view,
    };
    // Pierwsza klatka to pusta walka — odtwarzanie ma się zaczynać od zera,
    // a nie od gotowego wyniku.
    this.seek(0);
    this.setPlaying(true);
    this.render();
  }

  /** Ręcznie wklejony log — pokazujemy go, ale nie zapisujemy w archiwum. */
  loadPasted(text: string): void {
    if (text.trim() === "") return;
    this.stopReplay();
    this.opened = null;
    const events = parse(text);
    const view: PreviewView = {
      source: "wklejony log",
      title: labelOf(events),
      replay: null,
      close: () => this.closePreview(),
    };
    this.overlay.showPreview(aggregate(events), view);
    this.pasting = false;
    this.render();
  }

  private closePreview(): void {
    this.stopReplay();
    this.opened = null;
    this.overlay.closePreview();
    this.render();
  }

  private viewFor(id: number, text: string, replay: ReplayView | null): PreviewView {
    const entry = this.recorder.list().find((one) => one.id === id);
    const when = entry ? whenLabel(entry.at, this.now()) : "";
    return {
      source: when ? `z archiwum · ${when}` : "z archiwum",
      title: this.summaryOf(id, text).label,
      replay,
      close: () => this.closePreview(),
    };
  }

  /** Świeży opis stanu odtwarzania dla panelu. */
  private currentReplayView(): ReplayView | null {
    const replay = this.replay;
    if (!replay) return null;
    const shown = this.frameStats(replay.at);
    return {
      playing: replay.playing,
      progress: replay.lines.length === 0 ? 0 : replay.at / replay.lines.length,
      speed: replay.speed,
      label: `tura ${shown.timeline.length}/${replay.turns}`,
      toggle: () => this.setPlaying(!replay.playing),
      cycleSpeed: () => this.cycleSpeed(),
      seek: (fraction) => this.seek(Math.round(fraction * replay.lines.length)),
    };
  }

  private frameStats(at: number, replay = this.replay!): BattleStats {
    // Parsujemy CAŁY prefiks od nowa, dokładnie jak `Session` przy każdej
    // zmianie logu w grze — dzięki temu odtwarzanie idzie tą samą ścieżką
    // co licznik na żywo i nie ma osobnej, drugiej prawdy.
    const events = parse(replay.lines.slice(0, at).join("\n"));

    // Krok po linii potrafi zatrzymać się MIĘDZY linią ciosu ("uderzył") a linią
    // obrażeń ("otrzymał"). Parser słusznie zgłasza wtedy niedomknięty cios jako
    // linię nierozpoznaną — ale w połowie odtwarzania to nie zmiana formatu,
    // tylko klatka złapana w pół akcji. Bez tego ostrzeżenie w stopce mrugałoby
    // co drugą klatkę. Zdejmujemy tylko OSTATNIE zdarzenie i tylko przed końcem
    // nagrania: na `at === lines.length` żadnego niedomknięcia już nie ma, więc
    // realne nierozpoznane linie zostają i ostrzeżenie działa jak w grze.
    if (at < replay.lines.length && events.at(-1)?.kind === "unknown") events.pop();

    return aggregate(events);
  }

  private setPlaying(playing: boolean): void {
    const replay = this.replay;
    if (!replay) return;

    // Koniec logu: „graj" startuje od początku, zamiast stać w miejscu.
    if (playing && replay.at >= replay.lines.length) replay.at = 0;
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
    if (replay.at >= replay.lines.length) {
      this.setPlaying(false);
      return;
    }
    replay.at += 1;
    this.pushFrame();
  }

  private seek(at: number): void {
    const replay = this.replay;
    if (!replay) return;
    replay.at = Math.max(0, Math.min(at, replay.lines.length));
    this.pushFrame();
  }

  private pushFrame(): void {
    const replay = this.replay;
    if (!replay) return;
    replay.view.replay = this.currentReplayView();
    this.overlay.showPreview(this.frameStats(replay.at), replay.view);
  }

  private stopReplay(): void {
    const handle = this.replay?.handle;
    if (handle != null) this.ticker.stop(handle);
    this.replay = null;
  }

  /**
   * Kluczem jest długość tekstu, nie samo `id`: nagranie trwającej walki rośnie,
   * a jej podsumowanie musi rosnąć razem z nim.
   */
  private summaryOf(id: number, text: string): Summary {
    const key = `${id}:${text.length}`;
    const cached = this.summaries.get(key);
    if (cached) return cached;
    const summary = summarize(parse(text));
    this.summaries.set(key, summary);
    return summary;
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
    this.window.append(this.renderHeader(), list);
    list.scrollTop = scroll;
    if (this.pasting) this.window.append(this.renderPaste());
  }

  private renderHeader(): HTMLElement {
    const header = document.createElement("header");
    const title = document.createElement("span");
    title.className = "title";
    title.textContent = "Archiwum walk";

    const paste = document.createElement("button");
    paste.type = "button";
    paste.dataset.action = "archive-paste";
    paste.textContent = "wklej";
    paste.setAttribute("aria-pressed", String(this.pasting));
    paste.setAttribute("aria-label", "Wklej log ręcznie");
    paste.addEventListener("click", () => {
      this.pasting = !this.pasting;
      this.render();
    });

    const close = document.createElement("button");
    close.type = "button";
    close.dataset.action = "archive-close";
    close.textContent = "✕";
    close.setAttribute("aria-label", "Zamknij archiwum");
    close.addEventListener("click", () => this.toggle());

    header.append(title, paste, close);
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

    // Najnowsze na górze — szuka się zwykle walki sprzed chwili.
    const entries = [...this.recorder.list()].sort((a, b) => b.at - a.at);
    if (entries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "archive-empty";
      empty.textContent = "Brak nagrań. Włącz ⏺ w nagłówku, żeby zacząć zapisywać walki.";
      list.append(empty);
      return list;
    }

    for (const entry of entries) list.append(this.renderRow(entry));
    return list;
  }

  private renderRow(entry: Recording): HTMLElement {
    const row = document.createElement("div");
    row.className = this.opened === entry.id ? "archive-row is-open" : "archive-row";
    row.dataset.recording = String(entry.id);

    const text = this.recorder.read(entry.id);
    const summary = text === null ? null : this.summaryOf(entry.id, text);

    const box = document.createElement("div");
    box.className = "grow";
    const name = document.createElement("div");
    name.className = "archive-name";
    // Nazwa z pełnego logu, nie z samej linii tytułowej: przy nagraniu zaczętym
    // w środku walki linia otwierająca bywa w środku tekstu albo wcale.
    name.textContent = summary?.label ?? fightLabel(entry.title);

    const meta = document.createElement("div");
    meta.className = "archive-meta";
    const parts = [whenLabel(entry.at, this.now())];
    if (summary) {
      parts.push(`${summary.turns} tur`, `${number.format(summary.damage)} obr.`);
    }
    meta.textContent = parts.join(" · ");

    if (summary?.outcome === "victory" || summary?.outcome === "defeat") {
      const mark = document.createElement("span");
      mark.className = summary.outcome === "victory" ? "archive-win" : "archive-loss";
      mark.textContent = summary.outcome === "victory" ? " ✓" : " ✗";
      meta.append(mark);
    }

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

    row.addEventListener("click", () => this.open(entry.id));
    return row;
  }

  /**
   * Pole wklejania jest TRWAŁE: `render()` czyści okno, a leci ono po każdej
   * skończonej walce w trakcie nagrywania (`sync`), więc wpisywany log ginął
   * w połowie pisania. Ten sam węzeł wraca do okna z zachowaną treścią.
   */
  private renderPaste(): HTMLElement {
    return (this.pasteBox ??= this.buildPaste());
  }

  private buildPaste(): HTMLElement {
    const box = document.createElement("div");
    box.className = "archive-paste";

    const area = document.createElement("textarea");
    area.dataset.field = "paste";
    area.placeholder = "Wklej tu log walki...";

    const row = document.createElement("div");
    row.className = "archive-paste-actions";
    const hint = document.createElement("span");
    hint.className = "hint";
    hint.textContent = "Wklejony log tylko podglądamy — nie trafia do archiwum.";

    const load = document.createElement("button");
    load.type = "button";
    load.dataset.action = "archive-load-pasted";
    load.textContent = "wczytaj";
    load.addEventListener("click", () => this.loadPasted(area.value));

    row.append(hint, load);
    box.append(area, row);
    return box;
  }

  private loadState(): ArchiveState {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      return { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<ArchiveState>) };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  private saveState(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Brak magazynu nie jest powodem, żeby przewrócić okno.
    }
  }
}
