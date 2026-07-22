import { ColorAssignment } from "./palette.ts";
import { totalUnattributedDot, type BattleStats } from "./stats.ts";
import type { ActorStats } from "./types.ts";

export type Metric = "damageDealt" | "damageTaken" | "healingReceived" | "turns";
/** Filtr składu: obie strony, drużyna gracza (strona 0) albo przeciwnicy. */
export type Team = "all" | "mine" | "enemy";

const METRIC_LABELS: Record<Metric, string> = {
  damageDealt: "Zadane",
  damageTaken: "Otrzymane",
  healingReceived: "Leczenie",
  turns: "Tury",
};

/**
 * Kolejność zakładek i wierszy podsumowania w dymku — jedna, wspólna.
 *
 * Leczenie wróciło ze względu na PvP grupowe: w dziesiątce healer decyduje
 * o wyniku, więc bez tej kolumny panel kłamie o tym, kto wygrał walkę. Tury
 * zostają ukryte — średnia na turę stoi teraz w każdym wierszu.
 */
const METRICS = ["damageDealt", "damageTaken", "healingReceived"] as const;

// Krótko, bo to przełącznik używany W TRAKCIE walki — a "my"/"oni" stoi już
// przy pasku porównania stron, więc te same słowa znaczą tu to samo.
const TEAM_LABELS: Record<Team, string> = {
  all: "Wszyscy",
  mine: "My",
  enemy: "Oni",
};

/** Który przekrój rozbicia: pozycje (kto/czym) albo typ obrażeń. */
type BreakdownList = "sources" | "types";

/**
 * Co siedzi pod kursorem. Dymek opisuje albo postać z listy składu, albo
 * pojedynczy wiersz rozbicia wewnątrz postaci — to dwie różne treści i dwa
 * różne sposoby odnalezienia danych po przebudowie panelu.
 */
type HoverTarget =
  | { type: "actor"; key: string }
  | { type: "source"; key: string; list: BreakdownList };

/** Strona 0 to drużyna gracza — log pisze skład od jego perspektywy. */
function matchesTeam(side: number | null, team: Team): boolean {
  if (team === "all") return true;
  // Postać spoza składu nie ma strony, więc pokazujemy ją tylko w "Wszyscy".
  if (side === null) return false;
  return team === "mine" ? side === 0 : side !== 0;
}

const number = new Intl.NumberFormat("pl-PL");
/** Na turę wychodzą ułamki — bez miejsca po przecinku wszyscy zlewają się w jedno. */
const rate = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });

/**
 * Style overlaya. `all: initial` na hoście plus Shadow DOM odcinają globalny
 * CSS Margonema — bez tego gra przemalowałaby nam tabelę.
 */
const STYLE = `
:host {
  all: initial;
  position: fixed;
  z-index: 2147483000;
  font-family: ui-sans-serif, system-ui, "Segoe UI", sans-serif;
  color-scheme: dark;
}
/* Osobna reguła: \`all: initial\` z definicji nie zeruje własnych właściwości,
   a dymek jest rodzeństwem panelu i też musi z nich korzystać. */
:host {
  --surface: #16161a;
  --border: #35353b;
  --ink: #f2f2ef;
  /* Cały tekst panelu jest biały. Zmienna zostaje, bo trzyma w jednym miejscu
     wszystkie miejsca, które kiedyś były przygaszone — gdyby hierarchia miała
     wrócić, wystarczy tu jeden kolor. */
  --ink-muted: #f2f2ef;
  --warning: #fab219;
  /* Strony konfliktu. Celowo nie z palety postaci — te dwa kolory mają znaczyć
     "my" i "oni", a nie wskazywać konkretną osobę. */
  --mine: #6fbf8b;
  --enemy: #e0736f;
}
/* Wymiary liczymy razem z ramką i paddingiem — stałe pozycjonowania w JS
   zakładają dokładnie te szerokości. */
*, *::before, *::after { box-sizing: border-box; }
.panel {
  width: 260px;
  /* Świadomie rgba, a nie color-mix(): starsze przeglądarki odrzucają całą
     deklarację z color-mix i panel zostaje bez tła. */
  background: rgba(22, 22, 26, 0.94);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--ink);
  font-size: 12px;
  line-height: 1.35;
  overflow: hidden;
  box-shadow: 0 6px 20px rgb(0 0 0 / 45%);
  /* Kolumna: nagłówek u góry, przewijany korpus pod nim, uchwyt w rogu. */
  position: relative;
  display: flex;
  flex-direction: column;
}
/* Wszystko poza nagłówkiem. Przy zadanej wysokości okna to ono się przewija,
   a nagłówek (uchwyt przeciągania) i róg zmiany rozmiaru zostają na miejscu. */
.panel-body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}
/* Uchwyt zmiany rozmiaru — róg jak w textarea. Trójkąt w prawym dolnym rogu
   z ukośnymi kreskami; pełny rozmiar okna bierze się z pociągnięcia za niego. */
.resize-grip {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  touch-action: none;
  user-select: none;
  clip-path: polygon(100% 0, 100% 100%, 0 100%);
  background: repeating-linear-gradient(-45deg, var(--ink-muted) 0 1px, transparent 1px 4px);
  opacity: 0.4;
}
.resize-grip:hover, .resize-grip.resizing { opacity: 0.85; }
header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: grab;
  user-select: none;
  border-bottom: 1px solid var(--border);
}
header.dragging { cursor: grabbing; }
.title { font-weight: 600; letter-spacing: 0.02em; flex: 1; }
button {
  all: unset;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--ink-muted);
  font-size: 11px;
}
button:hover { background: #26262c; color: var(--ink); }
button[aria-pressed="true"] { background: #2f2f37; color: var(--ink); }
/* Porównanie stron: dwie liczby i pasek podziału, pod listą. Lista przy
   "Wszyscy" jest jednym rankingiem bez sekcji, więc to tutaj widać wynik
   drużyn — stąd miejsce na końcu panelu, jako podsumowanie. */
.sides { padding: 6px 8px 8px; border-top: 1px solid var(--border); }
.sides-row { display: flex; align-items: baseline; gap: 6px; }
.side-mine, .side-enemy { font-variant-numeric: tabular-nums; font-weight: 600; }
.side-mine { color: var(--mine); }
.side-enemy { color: var(--enemy); margin-left: auto; }
.side-name { color: var(--ink-muted); font-weight: 400; font-size: 11px; }
/* Sumy jednej drużyny — trzy metryki pod nazwą strony. */
.team-name { font-weight: 600; letter-spacing: 0.08em; font-size: 10px; }
.team-name.mine { color: var(--mine); }
.team-name.enemy { color: var(--enemy); }
.team-totals { display: flex; flex-direction: column; gap: 1px; margin-top: 4px; }
.team-total { display: flex; gap: 6px; font-size: 11px; }
.team-total-value { margin-left: auto; font-variant-numeric: tabular-nums; }
.team-total.is-active { font-weight: 600; }
.sides-track { display: flex; height: 5px; margin-top: 4px; border-radius: 3px; overflow: hidden; background: #24242a; }
.sides-track > span { height: 100%; }
.sides-track .fill-mine { background: var(--mine); }
.sides-track .fill-enemy { background: var(--enemy); }
.tabs { display: flex; gap: 2px; padding: 6px 8px 0; }
.tabs.metrics, .tabs.teams { padding-top: 3px; }
.tabs .per-turn { margin-left: auto; }
.tabs button { white-space: nowrap; }
/* Wiersz to jeden gruby pasek z tekstem NA nim — jak w SKADZIE czy GW2.
   Wypełnienie niesie ranking, tekst niesie liczby; osobny cienki pasek pod
   spodem tylko dublowałby tę samą informację i zjadał pion. */
.rows { padding: 6px 8px 8px; display: flex; flex-direction: column; gap: 3px; }
.row { position: relative; height: 20px; background: #24242a; border-radius: 3px; overflow: hidden; }
.bar { position: absolute; inset: 0 auto 0 0; min-width: 2px; opacity: 0.85; }
/* Tekst leży nad wypełnieniem, więc musi być czytelny i na pasku, i na tle. */
.row-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 6px;
  text-shadow: 0 1px 2px rgb(0 0 0 / 70%);
}
/* Nagłówek listy rozbicia w widoku pojedynczej postaci ("CZYM ZADANE" i suma).
   Lista składu nagłówków nie ma — to jeden ciągły ranking. */
.side-head {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 6px 2px;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
}
.side-head .sum { margin-left: auto; font-variant-numeric: tabular-nums; }
/* Ścieżka powrotu z widoku pojedynczej postaci. */
.crumb { display: flex; align-items: baseline; gap: 6px; padding: 6px 8px 0; font-size: 11px; }
.crumb-back { cursor: pointer; border-radius: 3px; padding: 1px 4px; margin-left: -4px; }
.crumb-back:hover { background: #26262c; }
.crumb-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Dwie linijki, które da się wykorzystać W TRAKCIE walki grupowej. */
.focus { padding: 4px 8px 0; display: flex; flex-direction: column; gap: 2px; font-size: 11px; }
.focus-line { display: flex; gap: 6px; align-items: baseline; color: var(--ink-muted); }
.focus-line .who { color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.focus-line .count { margin-left: auto; font-variant-numeric: tabular-nums; flex: none; }
/* Oś tur: jedna kolumna na turę, wysokość to obrażenia, kolor to strona. */
.axis { padding: 6px 8px 0; }
.axis-head { display: flex; font-size: 10px; letter-spacing: 0.08em; color: var(--ink-muted); padding-bottom: 3px; }
.axis-bars { display: flex; align-items: flex-end; gap: 1px; height: 34px; }
.axis-col { flex: 1; min-width: 2px; display: flex; flex-direction: column; justify-content: flex-end; height: 100%; }
.axis-fill { width: 100%; min-height: 1px; border-radius: 1px; }
.axis-fill.mine { background: var(--mine); }
.axis-fill.enemy { background: var(--enemy); }
.axis-fill.unknown { background: #4a4a52; }
/* Znacznik zgonu pod kolumną — w walce grupowej to jest fabuła starcia. */
.axis-marks { display: flex; gap: 1px; padding-top: 2px; }
.axis-mark { flex: 1; min-width: 2px; height: 3px; border-radius: 1px; }
.axis-mark.death { background: var(--warning); }
.rank { color: var(--ink-muted); font-variant-numeric: tabular-nums; flex: none; }
.label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.value, .avg { font-variant-numeric: tabular-nums; flex: none; }
.avg { color: var(--ink-muted); font-size: 11px; }
/* Liczba wiodąca jest zawsze ta pogrubiona — to ona rządzi paskiem i rankingiem,
   niezależnie od tego, czy pokazuje sumę czy tempo. Obok stoi ta druga miara,
   więc samo pogrubienie wystarcza za całe rozróżnienie. */
.value { font-weight: 600; }
.share { color: var(--ink-muted); font-variant-numeric: tabular-nums; }
.empty, .note { padding: 10px 8px; color: var(--ink-muted); }
footer { border-top: 1px solid var(--border); padding: 6px 8px; display: flex; flex-direction: column; gap: 3px; }
.warn { color: var(--warning); }
.panel.collapsed .tabs,
.panel.collapsed .rows,
.panel.collapsed .sides,
.panel.collapsed .focus,
.panel.collapsed .crumb,
.panel.collapsed .axis,
.panel.collapsed .resize-grip,
.panel.collapsed footer { display: none; }
/* Wiersz składu prowadzi głębiej, wiersz rozbicia już nie — stąd kursor tylko
   tam, gdzie kliknięcie coś robi. */
.rows .row { cursor: default; }
.rows .row[data-actor] { cursor: pointer; }
/* Wiersz rozbicia nie prowadzi głębiej, ale ma dymek — kursor to sygnalizuje. */
.rows .row[data-source] { cursor: help; }
.tip {
  /* Zwykły element panelu, nie natywny tooltip przeglądarki: pełna kontrola
     nad wyglądem i momentem pokazania, identycznie w każdej przeglądarce. */
  position: absolute;
  width: 260px;
  padding: 7px 9px;
  background: rgba(15, 15, 18, 0.97);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 6px 20px rgb(0 0 0 / 55%);
  color: var(--ink);
  font-size: 11px;
  line-height: 1.4;
  /* Dymek nie może przechwytywać myszy — inaczej zasłania wiersz, który go
     wywołał, i miga w kółko. */
  pointer-events: none;
}
/* Widoczność sterowana jawnie, bez polegania na arkuszu przeglądarki dla
   atrybutu [hidden]. */
.tip { display: none; }
.tip:not([hidden]) { display: block; }
.tip-title { font-weight: 600; margin-bottom: 4px; }
/* Etykieta rozbicia bywa dłuższa niż panel — w dymku ma się złamać, nie uciąć. */
.tip-wrap { overflow-wrap: anywhere; }
.tip-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0 8px;
  color: var(--ink-muted);
}
.tip-row .tip-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tip-row .tip-value { color: var(--ink); font-variant-numeric: tabular-nums; }
.tip-row .tip-share { font-variant-numeric: tabular-nums; min-width: 26px; text-align: right; }
.tip-section {
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px solid var(--border);
  color: var(--ink-muted);
}
/* Podsumowanie: etykieta i liczba, bez kolumny udziału — to wartości same
   w sobie, nie części żadnej całości. */
.tip-stat {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0 8px;
  color: var(--ink-muted);
}
.tip-stat-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tip-stat-value { color: var(--ink); font-variant-numeric: tabular-nums; }
/* Metryka z aktywnej zakładki — żeby było wiadomo, wobec czego liczony jest
   ranking i rozbicie niżej. */
.tip-stat.is-active { color: var(--ink); font-weight: 600; }
.tip-note { margin-top: 3px; color: var(--ink-muted); }
.tip-hint {
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px solid var(--border);
  font-size: 10px;
  letter-spacing: 0.04em;
}
.tip-heading {
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 2px;
}
`;

// Muszą się zgadzać z szerokościami w STYLE — przy `box-sizing: border-box`
// to pełne wymiary elementów, razem z ramką.
const PANEL_WIDTH = 260;
const TIP_WIDTH = 260;
const TIP_GAP = 8;
// Granice ręcznego rozmiaru okna. Poniżej MIN_WIDTH dwukolumnowe wiersze się
// zlepiają; MIN_HEIGHT zostawia miejsce na nagłówek i kilka wierszy. RESIZE_MARGIN
// to luz do krawędzi ekranu, żeby uchwyt nie uciekł poza widok.
const MIN_WIDTH = 200;
const MIN_HEIGHT = 140;
const RESIZE_MARGIN = 8;

/**
 * Przez ile tur dzielić daną metrykę w widoku „na turę”.
 *
 * Obrażenia ZADANE dzielą się przez tury własne, bo pytanie brzmi „ile wykręcam
 * jedną akcją”. Suma karze tego, kto stracił tury na ogłuszeniu — a to nie
 * znaczy, że bije słabiej. Tury utracone są wliczone w `turns`, więc dzielenie
 * je uwzględnia.
 *
 * Obrażenia PRZYJĘTE dzielą się przez tury całej walki, bo bierze się je w
 * turach przeciwnika — własny licznik akcji nie ma z nimi nic wspólnego.
 * Przy dzieleniu przez tury własne postać, która zginęła przed swoją turą,
 * pokazywała 0 na turę mimo pełnego worka obrażeń, a taka, która zdążyła zagrać
 * raz, dostawała całość podzieloną przez jeden — obie liczby mówiły o tym, ile
 * razy zdążyła zagrać, a nie o tym, jak długo obrywała.
 */
function turnsFor(actor: ActorStats, metric: Metric, fightTurns: number): number {
  return metric === "damageDealt" || metric === "turns" ? actor.turns : fightTurns;
}

function actorValue(
  actor: ActorStats,
  metric: Metric,
  perTurn = false,
  fightTurns = 0,
): number {
  const value = actor[metric];
  if (!perTurn) return value;
  const turns = turnsFor(actor, metric, fightTurns);
  return turns > 0 ? value / turns : 0;
}

function clamp(value: number, min: number, max: number): number {
  // `max` bywa mniejsze od `min`, gdy dymek jest wyższy od okna — wtedy trzyma
  // się górnej krawędzi zamiast wyjeżdżać w ujemne.
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Pozycja dymka w układzie ekranu, przycięta tak, żeby cały był widoczny.
 *
 * Domyślnie stoi po prawej stronie panelu. Gdy się tam nie mieści, przeskakuje
 * na lewą — a gdy i tam wystaje (panel przy krawędzi albo okno węższe niż
 * panel z dymkiem), zostaje dosunięty do brzegu. Pion nie ma strony do
 * przeskoczenia, więc jest po prostu przycinany do wysokości okna.
 *
 * Wydzielone z DOM-u, bo to sama arytmetyka — inaczej nie da się tego
 * przetestować bez silnika layoutu.
 */
export function tipPosition(box: {
  hostLeft: number;
  panelWidth: number;
  rowTop: number;
  tipWidth: number;
  tipHeight: number;
  gap: number;
  viewportWidth: number;
  viewportHeight: number;
}): { left: number; top: number } {
  const { hostLeft, panelWidth, rowTop, tipWidth, tipHeight, gap } = box;
  const { viewportWidth, viewportHeight } = box;

  const toRight = hostLeft + panelWidth + gap;
  const fitsRight = toRight + tipWidth + gap <= viewportWidth;
  const preferred = fitsRight ? toRight : hostLeft - tipWidth - gap;

  return {
    left: clamp(preferred, gap, viewportWidth - tipWidth - gap),
    top: clamp(rowTop, gap, viewportHeight - tipHeight - gap),
  };
}

/**
 * Wiersz, w którym leży cel zdarzenia. Sprawdzamy `closest` zamiast
 * `instanceof Element`, bo userscript żyje w cudzym dokumencie i konstruktory
 * potrafią pochodzić z innego kontekstu niż nasze.
 */
function rowUnder(target: EventTarget | null): HTMLElement | null {
  const element = target as Element | null;
  if (typeof element?.closest !== "function") return null;
  return element.closest<HTMLElement>(".row");
}

function div(className: string, text?: string): HTMLElement {
  const element = document.createElement("div");
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/** Dokleja przygaszony podpis do liczby, w tym samym wierszu. */
function withText(element: HTMLElement, text: string): HTMLElement {
  element.append(
    Object.assign(document.createElement("span"), { className: "side-name", textContent: text }),
  );
  return element;
}

export type OverlayOptions = {
  /** Gdzie doczepić hosta. Domyślnie `document.body`. */
  mount?: Element;
  /** Odczyt i zapis stanu okna (pozycja, zwinięcie). */
  storage?: Pick<Storage, "getItem" | "setItem">;
};

// `height: null` = wysokość z treści (jak dotąd). Liczba pojawia się dopiero,
// gdy użytkownik pociągnie za uchwyt — wtedy okno ma stały rozmiar, a korpus
// przewija się w środku.
type PanelState = { x: number; y: number; collapsed: boolean; width: number; height: number | null };

const STORAGE_KEY = "margometer.panel";
const DEFAULT_STATE: PanelState = {
  x: 16,
  y: 16,
  collapsed: false,
  width: PANEL_WIDTH,
  height: null,
};

/**
 * Okno ze statystykami renderowane nad grą.
 *
 * Overlay nie zna parsera ani źródła logu — dostaje gotowe statystyki przez
 * `render()`, dzięki czemu testuje się go zrzutem z pliku.
 */
export class Overlay {
  private readonly host: HTMLElement;
  private readonly root: ShadowRoot;
  /** Dymek z rozbiciem obrażeń. Żyje obok panelu, więc przetrwa rerender. */
  private readonly tip: HTMLElement;
  private readonly colors = new ColorAssignment();
  private readonly storage: OverlayOptions["storage"];
  private state: PanelState;

  private metric: Metric = "damageDealt";
  private team: Team = "all";
  /** Liczby dzielone przez tury zamiast surowych sum. */
  private perTurn = false;
  /** Co stoi pod kursorem — trzymane między rerenderami. */
  private hovered: HoverTarget | null = null;
  /**
   * Postać, w którą weszliśmy lewym przyciskiem. `null` to lista składu.
   *
   * Tożsamością jest NAZWA, nie węzeł ani indeks: panel przebudowuje się przy
   * każdej zmianie logu, a ranking potrafi się w tym czasie przestawić.
   */
  private focus: string | null = null;
  /**
   * Drugi szczebel drążenia, wyłącznie dla obrażeń przyjętych: napastnik,
   * w którego weszliśmy wewnątrz postaci. `null` to lista napastników.
   */
  private focusSource: string | null = null;
  private latest: { fight: BattleStats; session: BattleStats } | null = null;
  /**
   * Tury całej walki — dzielnik dla metryk, których nie bierze się we własnej
   * turze (patrz `turnsFor`). Trzymane w polu, bo potrzebuje go kilka metod
   * renderujących, a wszystkie i tak wiszą na tym samym `render()`.
   */
  private fightTurns = 0;

  constructor(options: OverlayOptions = {}) {
    this.storage = options.storage;
    this.state = this.loadState();

    this.host = document.createElement("div");
    this.host.id = "margometer";
    this.root = this.host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLE;

    this.tip = div("tip");
    this.tip.hidden = true;
    this.root.append(style, this.tip);

    // Delegacja zamiast listenerów na wierszach: panel jest przebudowywany przy
    // każdej zmianie logu, a `pointerenter` nie odpaliłby się ponownie dla
    // świeżego węzła pod nieruchomym kursorem. `pointerover` bąbelkuje.
    this.root.addEventListener("pointerover", (event) => {
      const row = rowUnder(event.target);
      if (row?.dataset.actor) {
        this.showTip({ type: "actor", key: row.dataset.actor });
      } else if (row?.dataset.source) {
        // Wewnątrz postaci pełna etykieta bywa ucięta w wierszu — dymek jest
        // jedynym miejscem, gdzie widać całe "od kogo i czym".
        this.showTip({
          type: "source",
          key: row.dataset.source,
          list: row.dataset.list === "types" ? "types" : "sources",
        });
      }
    });
    this.root.addEventListener("pointerout", (event) => {
      if (!rowUnder((event as PointerEvent).relatedTarget)) this.hideTip();
    });

    // Lewy przycisk wchodzi w postać, prawy wraca. Oba przez delegację, z tego
    // samego powodu co dymek: wiersz pod kursorem to po rerenderze inny węzeł.
    this.root.addEventListener("click", (event) => {
      const row = rowUnder(event.target);
      if (row?.dataset.actor) {
        this.enter(row.dataset.actor);
      } else if (row?.dataset.source && row.dataset.list === "sources") {
        // Wewnątrz przyjętych wiersz napastnika prowadzi głębiej: czym uderzał.
        this.enterSource(row.dataset.source);
      }
    });
    this.root.addEventListener("contextmenu", (event) => {
      // Menu przeglądarki nad panelem tylko przeszkadza, a prawy przycisk ma
      // tu własne znaczenie. Blokujemy je w całym overlayu, nie tylko na
      // wierszu — wracać chce się także z pustego miejsca pod listą.
      event.preventDefault();
      this.back();
    });

    (options.mount ?? document.body).append(this.host);
    this.applyPosition();
  }

  render(fight: BattleStats, session: BattleStats): void {
    this.latest = { fight, session };
    // Sesja jest liczona i pamiętana, ale nie ma dziś zakładki, która by ją
    // pokazała — panel mówi zawsze o bieżącej walce.
    const stats = fight;
    this.fightTurns = stats.timeline.length;
    const hovered = this.hovered;

    // Kolejność przypisania kolorów bierzemy z obrażeń zadanych, nie z aktualnie
    // wybranej metryki — inaczej przełączenie zakładki przemalowałoby wiersze.
    this.colors.seed([...stats.actors].map((actor) => actor.name));

    // Postać mogła zniknąć — nowa walka, inny skład. Wtedy wracamy do listy
    // zamiast pokazywać pusty widok nieistniejącej postaci.
    const focused = this.focus
      ? (stats.actors.find((actor) => actor.name === this.focus) ?? null)
      : null;
    if (this.focus && !focused) {
      this.focus = null;
      this.focusSource = null;
    }
    // Postać po drugiej stronie, której log przestał wymieniać (nowa walka,
    // inny skład), nie ma czego pokazać — wracamy o szczebel zamiast rysować
    // pusty widok. Lista zależy od metryki: cele przy zadanych, napastnicy przy
    // przyjętych.
    if (focused && this.focusSource !== null) {
      const twoTier = this.metric === "damageDealt" ? focused.dealtToBy : focused.takenFromBy;
      if (!twoTier.some((one) => one.label === this.focusSource)) this.focusSource = null;
    }

    const panel = document.createElement("div");
    panel.className = this.state.collapsed ? "panel collapsed" : "panel";
    // Szerokość stosujemy zawsze, wysokość tylko rozwinięty i tylko gdy
    // użytkownik ją ustawił — inaczej okno rośnie z treścią jak dotąd, a zwinięte
    // pokazuje sam nagłówek bez sztywnej wysokości pod spodem.
    panel.style.width = `${this.state.width}px`;
    if (!this.state.collapsed && this.state.height !== null) {
      panel.style.height = `${this.state.height}px`;
    }

    const body = div("panel-body");
    body.append(
      ...(focused
        ? // Wewnątrz postaci nie ma po co porównywać stron ani filtrować składu
          // — jest jedna postać i jej rozbicie. Zostaje wybór metryki, bo on
          // decyduje, CO rozbijamy: zadane, otrzymane czy leczenie.
          [this.renderCrumb(focused), this.renderMetrics(), this.renderDetail(focused)]
        : [
            // "ogień na" / "obrywa" są odłączone: w tej formie nie niosą tyle,
            // co zajmują, i wracają dopiero po przemyśleniu układu. Kod
            // zostaje, żeby nie odtwarzać go od zera — patrz renderFireFocus.
            this.renderMetrics(),
            this.renderTeams(),
            this.renderRows(stats),
            // Oś tur odłączona do czasu przemyślenia, co ma mówić — kod zostaje,
            // patrz renderAxis. Panel i tak urósł o pełną listę składu.
          ]),
    );

    const footer = this.renderFooter(stats);
    if (footer) body.append(footer);

    // Podsumowanie drużyny zamyka korpus — pod listą i pod stopką. Przy
    // "Wszyscy" porównuje strony, przy "My"/"Oni" podaje sumy tej jednej.
    // W widoku pojedynczej postaci nie ma czego podsumowywać.
    if (!focused) body.append(...(this.renderTeamSummary(stats) ?? []));

    const grip = div("resize-grip");
    grip.setAttribute("aria-hidden", "true");
    this.makeResizable(grip, panel);

    panel.append(this.renderHeader(), body, grip);

    this.root.querySelector(".panel")?.remove();
    this.root.append(panel);

    // Kursor stoi w miejscu, a wiersz pod nim to już inny węzeł — odtwarzamy
    // dymek sami, bo żadne zdarzenie wskaźnika się nie powtórzy.
    if (hovered) this.showTip(hovered);
  }

  destroy(): void {
    this.host.remove();
  }

  /** Do testów — pozwala zajrzeć w wyrenderowaną treść. */
  get shadow(): ShadowRoot {
    return this.root;
  }

  private renderHeader(): HTMLElement {
    const header = document.createElement("header");

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = "MargoMeter";

    const collapse = document.createElement("button");
    collapse.type = "button";
    collapse.textContent = this.state.collapsed ? "▢" : "—";
    // aria-label zamiast title: nie chcemy natywnych dymków przeglądarki.
    collapse.setAttribute("aria-label", this.state.collapsed ? "Rozwiń" : "Zwiń");
    collapse.addEventListener("click", () => {
      this.state.collapsed = !this.state.collapsed;
      this.saveState();
      this.rerender();
    });

    header.append(title, collapse);
    this.makeDraggable(header);
    return header;
  }

  /**
   * Podsumowanie drużyny widocznej na liście — zamyka panel.
   *
   * Przy "Wszyscy" to porównanie stron: dwie sumy i pasek podziału. Przy jednej
   * drużynie porównywać nie ma z czym, więc zamiast paska idą jej sumy we
   * wszystkich metrykach naraz — tak jak sekcja "Ogólne" w dymku, tylko liczona
   * dla całego składu zamiast dla postaci.
   *
   * Zwraca tablicę, nie element: gdy walka nie ma podziału na strony (log nie
   * dał składu), bloku po prostu nie ma i nic nie trzeba filtrować wyżej.
   */
  private renderTeamSummary(stats: BattleStats): [HTMLElement] | null {
    const shown = stats.actors.filter((actor) => matchesTeam(actor.side, this.team));
    if (shown.length === 0) return null;

    const box = div("sides");
    // Przy "Wszyscy" nad sumami stoi jeszcze porównanie stron — sumy mówią, ile
    // padło w całej walce, pasek mówi, jak to się rozłożyło między drużyny.
    if (this.team === "all") box.append(...this.sidesRows(stats));
    box.append(...this.totalsRows(shown));
    return [box];
  }

  /**
   * Sumy widocznego składu: każda metryka osobno, wszystkie naraz.
   *
   * Metryki nie ma po co wybierać zakładką — to podsumowanie, a nie ranking,
   * więc pokazanie tylko aktywnej znaczyłoby chowanie dwóch trzecich obrazu.
   * Aktywna jest za to wyróżniona, żeby wiadomo było, co rządzi listą wyżej.
   */
  private totalsRows(shown: ActorStats[]): Node[] {
    const turns = shown.reduce((sum, actor) => sum + actor.turns, 0);
    // Suma składu dzielona przez jego tury, a nie suma temp pojedynczych postaci
    // — inaczej liczniejsza drużyna miałaby wyższe "tempo" tylko dlatego, że
    // jest jej więcej.
    //
    // Dzielnik dobiera ta sama reguła co dla pojedynczej postaci: przyjęte
    // odnoszą się do tur walki, nie do sumy tur składu. Inaczej drużyna, która
    // wyginęła, zanim zdążyła zagrać, obrywałaby "0 na turę".
    const value = (metric: Metric) => {
      const total = shown.reduce((sum, actor) => sum + actorValue(actor, metric), 0);
      if (!this.perTurn) return total;
      const divisor = metric === "damageDealt" || metric === "turns" ? turns : this.fightTurns;
      return divisor > 0 ? total / divisor : 0;
    };

    const head = div("sides-row");
    head.append(
      // Własna klasa, nie `side-enemy`: tamta jest dosuwana do prawej krawędzi
      // na potrzeby porównania stron, a tu nazwa otwiera linijkę.
      div(`team-name ${this.team}`, TEAM_LABELS[this.team].toUpperCase()),
      Object.assign(document.createElement("span"), {
        className: "side-name",
        style: "margin-left:auto",
        textContent: `${shown.length} postaci · ${turns} tur`,
      }),
    );

    const totals = div("team-totals");
    for (const metric of METRICS) {
      const line = div(`team-total${metric === this.metric ? " is-active" : ""}`);
      line.append(
        div("", METRIC_LABELS[metric]),
        div("team-total-value", this.format(value(metric)) + (this.perTurn ? "/t" : "")),
      );
      totals.append(line);
    }

    return [head, totals];
  }

  /**
   * Porównanie stron: dwie sumy aktywnej metryki i pasek podziału.
   *
   * Świadomie liczy po WSZYSTKICH postaciach, nie po widocznym składzie — to
   * porównanie stron, a wchodzi tylko przy "Wszyscy", gdzie widać obie.
   */
  private sidesRows(stats: BattleStats): Node[] {
    const sides = { mine: { value: 0, turns: 0 }, enemy: { value: 0, turns: 0 } };

    for (const actor of stats.actors) {
      if (actor.side === null) continue;
      const bucket = actor.side === 0 ? sides.mine : sides.enemy;
      bucket.value += actorValue(actor, this.metric);
      bucket.turns += actor.turns;
    }

    // Przy "na turę" dzielimy sumę strony przez jej tury, a nie sumujemy tempa
    // pojedynczych postaci — inaczej czteroosobowa drużyna miałaby czterokrotnie
    // wyższe "tempo" niż samotny przeciwnik, co nie znaczyłoby nic.
    //
    // Przyjęte idą przez tury walki, wspólne dla obu stron — patrz `turnsFor`.
    const perSide = this.metric === "damageDealt" || this.metric === "turns";
    const value = (side: { value: number; turns: number }) => {
      if (!this.perTurn) return side.value;
      const divisor = perSide ? side.turns : this.fightTurns;
      return divisor > 0 ? side.value / divisor : 0;
    };

    const mine = value(sides.mine);
    const enemy = value(sides.enemy);
    const sum = mine + enemy;

    const row = div("sides-row");
    row.append(
      withText(div("side-mine", this.format(mine)), " my"),
      withText(div("side-enemy", this.format(enemy)), " oni"),
    );

    const track = div("sides-track");
    const fillMine = document.createElement("span");
    fillMine.className = "fill-mine";
    fillMine.style.width = `${sum > 0 ? (mine / sum) * 100 : 50}%`;
    const fillEnemy = document.createElement("span");
    fillEnemy.className = "fill-enemy";
    fillEnemy.style.width = `${sum > 0 ? (enemy / sum) * 100 : 50}%`;
    track.append(fillMine, fillEnemy);

    return [row, track];
  }

  /**
   * Dwie linijki, które da się wykorzystać W TRAKCIE walki grupowej: w kogo
   * bijemy i kto u nas obrywa. Reszta panelu jest do czytania po walce.
   *
   * Przy 1v1 nie ma tu czego pokazywać — „bijemy w jedynego przeciwnika” to
   * nie jest informacja — więc sekcja pojawia się dopiero od trzech osób.
   */
  private renderFireFocus(stats: BattleStats): [HTMLElement] | null {
    const mine = stats.actors.filter((actor) => actor.side === 0);
    const enemy = stats.actors.filter((actor) => actor.side !== null && actor.side !== 0);
    // Obie linijki mają sens dopiero, gdy po mojej stronie jest KOGO liczyć:
    // przy jednej osobie "ogień na: 1 z 1" i "obrywa: ja" to nie informacje,
    // tylko szum. Liczba przeciwników nie ma tu nic do rzeczy.
    if (mine.length < 2 || stats.matrix.length === 0) return null;

    // Ile obrażeń i od ilu osób zebrał każdy cel — po to jest macierz.
    const incoming = new Map<string, { damage: number; attackers: Set<string> }>();
    for (const edge of stats.matrix) {
      const entry = incoming.get(edge.target) ?? { damage: 0, attackers: new Set<string>() };
      entry.damage += edge.damage;
      entry.attackers.add(edge.source);
      incoming.set(edge.target, entry);
    }

    const worst = (group: ActorStats[]) =>
      group
        .map((actor) => ({ actor, hit: incoming.get(actor.name) }))
        .filter((row) => row.hit && row.hit.damage > 0)
        .sort((a, b) => b.hit!.damage - a.hit!.damage)[0];

    const target = worst(enemy);
    const pressured = worst(mine);
    if (!target && !pressured) return null;

    const box = div("focus");
    if (target) {
      const line = div("focus-line");
      line.append(
        div("", "ogień na:"),
        div("who", target.actor.name),
        div("count", `${target.hit!.attackers.size} z ${mine.length}`),
      );
      box.append(line);
    }
    if (pressured) {
      const line = div("focus-line");
      line.append(
        div("", "obrywa:"),
        div("who", pressured.actor.name),
        div("count", `-${number.format(pressured.hit!.damage)}`),
      );
      box.append(line);
    }
    return [box];
  }

  /**
   * Oś tur: kolumna na turę, wysokość to obrażenia, kolor to strona działającej
   * postaci. Znacznik pod spodem oznacza turę, w której ktoś padł.
   *
   * To jest widok, którego SKADA nie ma i mieć nie może — w WoW nie ma
   * dyskretnych tur, więc oś czasu jest ciągła i nic z niej nie widać.
   */
  private renderAxis(stats: BattleStats): [HTMLElement] | null {
    if (stats.timeline.length < 2) return null;

    const max = Math.max(...stats.timeline.map((slice) => slice.damage));
    if (max <= 0) return null;

    const deathTurns = new Set(stats.deaths.map((death) => death.turn));

    const box = div("axis");
    const head = div("axis-head");
    head.append(div("", "OŚ TUR"), div("sum", `${stats.timeline.length}`));
    head.querySelector(".sum")?.setAttribute("style", "margin-left:auto");

    const bars = div("axis-bars");
    const marks = div("axis-marks");
    for (const slice of stats.timeline) {
      const col = div("axis-col");
      const side = slice.side === null ? "unknown" : slice.side === 0 ? "mine" : "enemy";
      const fill = div(`axis-fill ${side}`);
      fill.style.height = `${(slice.damage / max) * 100}%`;
      col.append(fill);
      bars.append(col);
      marks.append(div(`axis-mark ${deathTurns.has(slice.turn) ? "death" : ""}`));
    }

    box.append(head, bars, marks);
    return [box];
  }

  /** Formatuje wartość zgodnie z trybem: sumy całkowite, tempo z ułamkiem. */
  private format(value: number): string {
    return this.perTurn ? rate.format(value) : number.format(value);
  }

  /** Wartość wiersza w bieżącym trybie — jedno miejsce na ranking i pasek. */
  private value(actor: ActorStats): number {
    return actorValue(actor, this.metric, this.perTurn, this.fightTurns);
  }

  /**
   * Liczba do dymka, licząca się tak samo jak w wierszu listy — z trybem
   * „na turę” włącznie. Wcześniej dymek pokazywał sumy niezależnie od trybu,
   * więc ta sama postać miała w wierszu 1230/t, a w dymku 5000 i nic nie
   * mówiło, że to dwie miary tej samej rzeczy.
   *
   * Dzielnik bierze `turnsFor` osobno dla każdej metryki, nie jeden wspólny
   * dla całej sekcji: przyjęte dzielą się przez tury walki, zadane przez
   * własne. Wspólny mianownik rozjechałby wiersze metryk NIEAKTYWNYCH z tym,
   * co te same metryki pokażą po kliknięciu w ich zakładkę.
   */
  private tipValue(actor: ActorStats, metric: Metric): string {
    const value = actorValue(actor, metric, this.perTurn, this.fightTurns);
    // "/t" jak przy liczbie wiodącej w wierszu — ta sama jednostka ma się
    // zapisywać tak samo w obu miejscach.
    return this.format(value) + (this.perTurn ? "/t" : "");
  }

  /**
   * Dwa niezależne wymiary w osobnych rzędach. Upchnięte w jeden nie mieszczą
   * się w 260px — etykiety zawijały się i ostatni przycisk wychodził poza panel.
   */
  private renderMetrics(): HTMLElement {
    const tabs = document.createElement("div");
    tabs.className = "tabs metrics";

    for (const metric of METRICS) {
      tabs.append(
        this.tabButton(METRIC_LABELS[metric], this.metric === metric, () => {
          this.metric = metric;
          // Drugi szczebel istnieje tylko dla przyjętych i tylko dla JEDNEGO
          // napastnika — przy innej metryce nie ma czego pokazać.
          this.focusSource = null;
          this.rerender();
        }),
      );
    }

    // Nie jest zakładką w tym samym sensie co metryki — nie wybiera, CO liczymy,
    // tylko czy dzielimy przez tury. Stąd osobne miejsce, dosunięte do prawej.
    const perTurn = this.tabButton("na turę", this.perTurn, () => {
      this.perTurn = !this.perTurn;
      this.rerender();
    });
    perTurn.classList.add("per-turn");
    tabs.append(perTurn);

    return tabs;
  }

  /** Drugi rząd zakładek — filtr składu. Sumy liczą się w obrębie wyboru. */
  private renderTeams(): HTMLElement {
    const tabs = document.createElement("div");
    tabs.className = "tabs teams";

    for (const team of ["all", "mine", "enemy"] as const) {
      tabs.append(
        this.tabButton(TEAM_LABELS[team], this.team === team, () => {
          this.team = team;
          this.rerender();
        }),
      );
    }

    return tabs;
  }

  /** Wejście w postać lewym przyciskiem. */
  private enter(name: string): void {
    this.focus = name;
    this.focusSource = null;
    // Dymek opisuje wiersz, którego już nie ma na ekranie.
    this.hideTip();
    this.rerender();
  }

  /**
   * Wejście w postać po drugiej stronie ciosu — trzeci szczebel. Zadane drążą
   * w cel, przyjęte w napastnika; leczenie ma jeden poziom i tu nie wchodzi.
   */
  private enterSource(label: string): void {
    if (!this.canDrillSources()) return;
    this.focusSource = label;
    this.hideTip();
    this.rerender();
  }

  /** Czy bieżący widok pozwala wejść głębiej niż w postać. */
  private canDrillSources(): boolean {
    const twoTier = this.metric === "damageDealt" || this.metric === "damageTaken";
    return twoTier && this.focus !== null && this.focusSource === null;
  }

  /**
   * Powrót prawym przyciskiem. Dziś poziom jest jeden, więc wracamy do listy;
   * gdy dojdzie kolejny (umiejętność → jej cele), to jest miejsce na zdjęcie
   * jednego szczebla zamiast całego stosu.
   */
  private back(): void {
    // Zdejmujemy JEDEN szczebel, nie cały stos: z umiejętności napastnika
    // wraca się do listy napastników, a dopiero stamtąd do składu.
    if (this.focusSource !== null) this.focusSource = null;
    else if (this.focus !== null) this.focus = null;
    else return;
    this.hideTip();
    this.rerender();
  }

  /**
   * Ścieżka powrotu nad rozbiciem. Prawy przycisk robi to samo, ale nie widać
   * go na ekranie — bez tej linijki nie da się zgadnąć, jak się cofnąć.
   */
  private renderCrumb(actor: ActorStats): HTMLElement {
    const crumb = div("crumb");
    // Etykieta mówi, DOKĄD się wraca, a nie „wstecz” — przy dwóch szczeblach
    // sam strzałek nie wystarczy, żeby wiedzieć, gdzie się wyląduje.
    const back = div("crumb-back", this.focusSource === null ? "‹ skład" : `‹ ${actor.name}`);
    back.addEventListener("click", () => this.back());
    const here = this.focusSource ?? actor.name;
    crumb.append(back, div("crumb-name", here));
    return crumb;
  }

  /**
   * Rozbicie jednej postaci: ten sam ranking co na liście, tylko o szczebel
   * niżej — zamiast „kto zadał” mamy „czym zadał”.
   *
   * Wiersze świadomie NIE niosą `data-actor`: to nie są postacie, więc dymek
   * i wejście głębiej nie mają się na nich łapać.
   */
  private renderDetail(actor: ActorStats): HTMLElement {
    const container = div("rows");
    const dealt = this.metric === "damageDealt";
    const sources = this.breakdownList(actor, "sources");
    const types = this.breakdownList(actor, "types");

    const total = actorValue(actor, this.metric);
    // Pierwszy szczebel nazywa DRUGĄ stronę zdarzenia: cel przy zadanych
    // ("KOMU"), napastnika przy przyjętych ("OD KOGO"), źródło przy leczeniu
    // ("OD CZEGO"). Leczenie nie drąży dalej — log nie nazywa leczącego, więc
    // źródłem jest sam efekt (Regeneracja / aura / samoratunek), a nie postać.
    const heading =
      this.metric === "healingReceived"
        ? "OD CZEGO"
        : this.focusSource !== null
          ? `CZYM — ${this.focusSource.toUpperCase()}`
          : dealt
            ? "KOMU"
            : "OD KOGO";

    if (sources.length === 0) {
      container.append(
        div("empty", `Brak rozbicia: ${METRIC_LABELS[this.metric].toLowerCase()}.`),
      );
      return container;
    }

    // Osobna pula kolorów na widok: gdyby etykiety brały kolory z tej samej
    // instancji co postacie, zjadłyby jej osiem slotów i przemalowały listę.
    const colors = new ColorAssignment();
    colors.seed(sources.map((source) => source.label));

    const divisor = turnsFor(actor, this.metric, this.fightTurns);
    const uses = new Map(actor.abilityUses.map((use) => [use.label, use.count]));

    // Po stronie zadanych wiedzie liczba UŻYĆ, a ciosy dochodzą tylko przy
    // rozjeździe — patrz `sourceTipContent`. Poza zadanymi użyć nie ma, więc
    // zostaje sam licznik ciosów (albo tyknięć trucizny).
    const timesDealt = (source: ActorStats["dealtBy"][number]): string => {
      // Użycia liczy się dla całej walki (linia "X wykonuje Y" nie dzieli się na
      // cele), więc na szczeblu celów — gdzie etykieta to nazwa postaci — nie
      // pada żadne dopasowanie i zostaje sam licznik ciosów. Po zejściu w cel
      // etykiety to znów umiejętności i użycie (wartość ogólna) wraca.
      const used = dealt ? uses.get(source.label) : undefined;
      if (used === undefined) return `×${source.hits}`;
      return source.hits === used ? `×${used}` : `×${used} · ${source.hits} c.`;
    };

    this.appendBreakdown(container, heading, "sources", sources, total, divisor, colors, timesDealt);
    // Drugi przekrój tych samych obrażeń — żywioł, trucizna, głęboka rana.
    // Suma jest ta sama, więc to nie są dodatkowe obrażenia, tylko inny podział.
    // Przy jednym typie podział nie istnieje: "bez żywiołu 100%" to nie jest
    // informacja, tylko powtórzenie sumy stojącej wyżej.
    if (types.length > 1) {
      // Bez licznika: jeden cios niesie kilka żywiołów, więc pozycje sumowałyby
      // się do wielokrotności ciosów postaci.
      this.appendBreakdown(container, "TYP OBRAŻEŃ", "types", types, total, divisor, colors, () => null);
    }

    const counters = [
      `ciosy ${actor.hits}`,
      `kryt. ${actor.crits}`,
      `uniki ${actor.misses}`,
      `maks. cios ${number.format(actor.maxHit)}`,
      `tury ${actor.turns}`,
      `utracone ${actor.turnsLost}`,
    ];
    container.append(div("note", counters.join(" · ")));

    return container;
  }

  /**
   * Która lista rozbicia odpowiada bieżącej metryce.
   *
   * Jedno miejsce na tę decyzję, bo pytają o nią dwie strony: render wierszy
   * i dymek, który musi trafić w DOKŁADNIE tę samą pozycję, co wiersz pod
   * kursorem — inaczej pokazałby liczby z sąsiedniej listy.
   */
  private breakdownList(actor: ActorStats, list: BreakdownList): ActorStats["dealtBy"] {
    if (this.metric === "healingReceived") return list === "sources" ? actor.healedBy : [];
    // Przekrój po typie (żywioł) jest ten sam na każdym szczeblu — dotyczy
    // całości obrażeń postaci, nie wybranej pary.
    if (list !== "sources") {
      return this.metric === "damageDealt" ? actor.dealtByType : actor.takenByType;
    }
    // Zadane i przyjęte drążą się lustrzanie: pierwszy szczebel to postać po
    // drugiej stronie (cel / napastnik), drugi — czym padło. `focusSource`
    // trzyma wybraną postać wspólnie dla obu metryk.
    const twoTier = this.metric === "damageDealt" ? actor.dealtToBy : actor.takenFromBy;
    if (this.focusSource === null) {
      return twoTier.map(({ label, amount, hits }) => ({ label, amount, hits }));
    }
    return twoTier.find((one) => one.label === this.focusSource)?.by ?? [];
  }

  /** Jedna lista rozbicia: nagłówek i paski w tej samej skali co reszta widoku. */
  private appendBreakdown(
    container: HTMLElement,
    heading: string,
    list: BreakdownList,
    sources: ActorStats["dealtBy"],
    total: number,
    turns: number,
    colors: ColorAssignment,
    counter: (source: ActorStats["dealtBy"][number]) => string | null,
  ): void {
    // Tryb „na turę” obowiązuje też tutaj: dzielimy przez tury TEJ postaci, bo
    // rozbicie dotyczy jej jednej. Udziały zostają na surowych liczbach —
    // wspólny dzielnik i tak by się skrócił.
    const perTurn = (amount: number) => (this.perTurn && turns > 0 ? amount / turns : amount);

    const head = div("side-head");
    head.append(div("", heading), div("sum", this.format(perTurn(total))));
    container.append(head);

    const max = Math.max(...sources.map((source) => source.amount));

    for (const source of sources) {
      const row = div("row");
      // Tożsamość wiersza dla dymka. Etykieta i lista razem, bo ta sama nazwa
      // ("od trucizny") potrafi stać w obu przekrojach naraz.
      row.dataset.source = source.label;
      row.dataset.list = list;

      const bar = div("bar");
      bar.style.background = colors.colorFor(source.label);
      bar.style.width = `${max > 0 ? (source.amount / max) * 100 : 0}%`;

      const value = document.createElement("span");
      value.className = "value";
      const share = total > 0 ? Math.round((source.amount / total) * 100) : 0;
      value.append(
        // "/t" jak na liście składu — ta sama liczba ma znaczyć to samo w obu widokach.
        document.createTextNode(this.format(perTurn(source.amount)) + (this.perTurn ? "/t " : " ")),
        Object.assign(document.createElement("span"), {
          className: "share",
          textContent: `(${share}%)`,
        }),
      );

      const text = div("row-text");
      text.append(div("label", source.label), value);
      // Ile razy. Co dokładnie jest liczone, rozstrzyga `counter` — zależy to
      // od przekroju, więc decyzja stoi u wołającego, nie tutaj. `null` znaczy
      // "w tej sekcji taka liczba nie ma sensu".
      const times = counter(source);
      if (times !== null) {
        text.append(
          Object.assign(document.createElement("span"), {
            className: "avg",
            textContent: times,
          }),
        );
      }
      row.append(bar, text);
      container.append(row);
    }
  }

  private tabButton(label: string, pressed: boolean, onClick: () => void): HTMLElement {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-pressed", String(pressed));
    button.addEventListener("click", onClick);
    return button;
  }

  private renderRows(stats: BattleStats): HTMLElement {
    const container = document.createElement("div");
    container.className = "rows";

    const ranked = [...stats.actors]
      .filter((actor) => matchesTeam(actor.side, this.team))
      // Skład ze składu walki pokazujemy od pierwszej tury, choćby na zerach —
      // brak wiersza czyta się jak "nie ma takiej postaci", a nie "jeszcze nic
      // nie zrobiła". Postać spoza składu (side === null) to inna sprawa: ona
      // pojawia się dopiero, gdy log ją wymieni, więc zerowej nie ma po co
      // trzymać w rankingu wybranej metryki.
      .filter((actor) => actor.side !== null || this.value(actor) > 0)
      .sort((a, b) => this.value(b) - this.value(a) || a.name.localeCompare(b.name, "pl"));

    if (ranked.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent =
        this.team === "all"
          ? "Brak danych — czekam na walkę."
          : `Brak danych: ${TEAM_LABELS[this.team].toLowerCase()}.`;
      container.append(empty);
      return container;
    }

    // Jedna lista, bez dzielenia na strony. "Wszyscy" znaczy dokładnie tyle:
    // wspólny ranking całej walki, więc dwudziestka stoi w jednym ciągu i widać
    // od razu, kto bije najmocniej — niezależnie od tego, po czyjej jest stronie.
    // Udziały liczą się wobec tej samej całości, którą widać na ekranie.
    this.appendSection(container, stats, ranked, this.value(ranked[0]!));

    return container;
  }

  /**
   * Lista składu: cały ranking, bez zwijania.
   *
   * Wszystkie postacie stoją na ekranie od razu — panel ma pokazywać walkę,
   * a nie kazać jej dopiero rozwijać. Przy dwudziestce robi się z tego długie
   * okno i tak ma być.
   */
  private appendSection(
    container: HTMLElement,
    stats: BattleStats,
    ranked: ActorStats[],
    max: number,
  ): void {
    const total = ranked.reduce((sum, actor) => sum + this.value(actor), 0);

    for (const [index, actor] of ranked.entries()) {
      const value = this.value(actor);
      const color = this.colors.colorFor(actor.name);
      const ambiguous = stats.ambiguousNames.includes(actor.name);

      const row = div("row");
      // Zdarzenia obsługuje delegacja na shadow root, więc wiersz musi nieść
      // swoją tożsamość — po rerenderze to inny węzeł, ale ta sama postać.
      row.dataset.actor = actor.name;

      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.background = color;
      bar.style.width = `${max > 0 ? (value / max) * 100 : 0}%`;

      const rank = document.createElement("span");
      rank.className = "rank";
      rank.textContent = `${index + 1}.`;

      const label = document.createElement("span");
      label.className = "label";
      // Gwiazdka: pod tą nazwą kryje się w walce więcej niż jedna postać.
      label.textContent = ambiguous ? `${actor.name} *` : actor.name;

      const value$ = document.createElement("span");
      value$.className = "value";
      const share = total > 0 ? Math.round((value / total) * 100) : 0;
      value$.append(
        // Przy tempie dopisujemy "/t" do liczby wiodącej: bez tego dwie kolumny
        // różniły się tylko wielkością liczby i nie było wiadomo, która jest która.
        document.createTextNode(this.format(value) + (this.perTurn ? "/t " : " ")),
        Object.assign(document.createElement("span"), {
          className: "share",
          textContent: `(${share}%)`,
        }),
      );

      // Obok liczby wiodącej stoi zawsze TA DRUGA miara: przy sumach tempo,
      // przy tempie suma. Wcześniej było tu tempo niezależnie od trybu, więc po
      // włączeniu "na turę" ta sama liczba stała w wierszu dwa razy.
      //
      // Obie mówią prawdę, ale inną — kto stracił tury, ma niską sumę mimo
      // mocnych ciosów. Przełącznik decyduje tylko, która rządzi rankingiem.
      const avg = document.createElement("span");
      avg.className = "avg";
      avg.textContent = this.perTurn
        ? number.format(actorValue(actor, this.metric))
        : `${rate.format(actorValue(actor, this.metric, true, this.fightTurns))}/t`;

      // Obie kolumny stoją ZAWSZE, także gdy wychodzą na to samo — postać
      // z jedną turą ma tempo równe sumie, a postać, która nic nie zrobiła, ma
      // dwa zera. Chowanie powtórki zabierało odpowiedź na "ile w sumie":
      // "1230/t (8%)" bez drugiej liczby wygląda, jakby sumy w ogóle nie było.
      const text = div("row-text");
      text.append(rank, label, value$, avg);
      row.append(bar, text);
      container.append(row);
    }
  }

  /**
   * Rozbicie obrażeń wybranej postaci: z czego się złożyły i w jakich
   * proporcjach. Zwykłe ciosy log nazywa tylko bronią, nazwane są efekty.
   */
  /**
   * Komplet metryk naraz, niezależnie od wybranej zakładki.
   *
   * Zakładki rządzą rankingiem — kto jest wyżej i wobec czego liczone są
   * proporcje. Ale żeby zobaczyć, ile ktoś ma tur albo ile oberwał, nie trzeba
   * między nimi skakać: dymek pokazuje wszystko, a aktywną metrykę wyróżnia.
   *
   * Wyróżnienie to jedyne, czym rządzi tu zakładka metryki. Trybu „na turę”
   * dymek słucha co do liczby — patrz `tipValue`. Filtr składu nie zmienia
   * niczego: wybiera, KTO jest na liście, a nie ile ta postać zrobiła.
   */
  private generalSection(actor: ActorStats): HTMLElement {
    const section = div("tip-section");
    section.append(div("tip-heading", "Ogólne"));

    for (const metric of METRICS) {
      const row = div(`tip-stat${metric === this.metric ? " is-active" : ""}`);
      // Własne klasy, nie `tip-label`/`tip-value` z rozbicia: to inne dane
      // i zapytania o rozbicie nie mają ich łapać.
      row.append(
        div("tip-stat-label", METRIC_LABELS[metric]),
        div("tip-stat-value", this.tipValue(actor, metric)),
      );
      section.append(row);
    }

    // Tury stoją tu jako pełnoprawna pozycja, nie w linijce liczników niżej:
    // bez nich sumy nie mają skali — 5000 obrażeń w trzech turach i w dwunastu
    // to dwie różne postacie. Tury utracone pokazujemy ZAWSZE, także jako zero,
    // bo brak wiersza czyta się jak brak pomiaru, a nie jak brak strat.
    //
    // Obie liczby zostają surowe także przy „na turę”: tury na turę to z
    // definicji 1, a udział tur utraconych jest już ułamkiem. To one są
    // mianownikiem dla wierszy wyżej — dzielenie ich przez siebie zabrałoby
    // jedyną skalę, wobec której tamto tempo cokolwiek znaczy.
    const turns = div("tip-stat");
    turns.append(div("tip-stat-label", METRIC_LABELS.turns), div("tip-stat-value", `${actor.turns}`));
    section.append(turns);

    const lost = div("tip-stat");
    lost.append(
      div("tip-stat-label", "Tury utracone"),
      // Udział mówi więcej niż sama liczba: 3 utracone z 4 to inna walka niż
      // 3 z 30. `turns` zawiera tury utracone, więc jest właściwym mianownikiem.
      div(
        "tip-stat-value",
        actor.turns > 0
          ? `${actor.turnsLost} (${Math.round((actor.turnsLost / actor.turns) * 100)}%)`
          : `${actor.turnsLost}`,
      ),
    );
    section.append(lost);

    // Liczniki, które nie mają własnej zakładki, a mówią o jakości gry.
    const counters = [
      `ciosy ${actor.hits}`,
      `kryt. ${actor.crits}`,
      `uniki ${actor.misses}`,
      `maks. cios ${number.format(actor.maxHit)}`,
      `pochłonięte ${number.format(actor.damageAbsorbed)}`,
    ];
    section.append(div("tip-note", counters.join(" · ")));

    return section;
  }

  /**
   * Efekty wyzwolone w ciosach: klątwy, oślepienia, dotyki anioła, niszczenie
   * pancerza — cokolwiek log zgłosi.
   *
   * Świadomie NIE ma tu listy znanych efektów. Parser bierze każdy modyfikator,
   * jaki napotka, więc licznik działa też dla rzeczy, których nigdy nie
   * widzieliśmy — a spis na sztywno zestarzałby się przy pierwszym dodatku
   * do gry i po cichu gubił nowe efekty.
   */
  /**
   * Co postać odpalała i ile z tego wyszło ciosów.
   *
   * Dwie liczby, nie jedna, bo nie są tym samym i log potrafi je rozjechać w
   * obie strony: "Podwójny strzał" daje dwa ciosy z jednego użycia, a użycie
   * wyunikane w całości nie daje żadnego. Sam licznik ciosów czytało się jak
   * liczbę odpaleń umiejętności.
   */
  private usesSection(actor: ActorStats): HTMLElement | null {
    if (actor.abilityUses.length === 0) return null;

    const hitsByLabel = new Map(actor.dealtBy.map((source) => [source.label, source.hits]));
    const section = div("tip-section");
    section.append(div("tip-heading", "Użycia akcji"));
    for (const use of actor.abilityUses) {
      const hits = hitsByLabel.get(use.label) ?? 0;
      const row = div("tip-stat");
      row.append(
        div("tip-stat-label", use.label),
        // Ciosy dopisujemy tylko przy rozjeździe: równe liczby pod dwiema
        // nazwami czytały się jak dwa osobne pomiary.
        div("tip-stat-value", hits === use.count ? `×${use.count}` : `×${use.count} · ${hits} c.`),
      );
      section.append(row);
    }
    return section;
  }

  private effectsSection(heading: string, procs: ActorStats["procs"]): HTMLElement | null {
    if (procs.length === 0) return null;

    const section = div("tip-section");
    section.append(div("tip-heading", heading));
    for (const proc of procs) {
      const row = div("tip-stat");
      row.append(div("tip-stat-label", proc.label), div("tip-stat-value", `×${proc.count}`));
      section.append(row);
    }
    return section;
  }

  /**
   * SKRÓT postaci — nie pełna karta.
   *
   * Rozbicie („czym zadane”, typ obrażeń) przeniosło się do widoku pod lewym
   * przyciskiem. Dymek ma odpowiadać na pytanie zadawane w biegu, w środku
   * walki: ile ta postać zadała, ile oberwała i co się na niej sypie. Wszystko
   * naraz nie mieściło się na ekranie i tak czy siak wymagało czytania.
   */
  private tipContent(actor: ActorStats): Node[] {
    const nodes: Node[] = [div("tip-title", actor.name), this.generalSection(actor)];

    const uses = this.usesSection(actor);
    if (uses) nodes.push(uses);

    // Dwie sekcje, bo to dwa różne pytania: co ta postać nakłada (jej sprzęt)
    // i co się na nią sypie (sprzęt przeciwników).
    const dealtEffects = this.effectsSection("Efekty w ciosach", actor.procs);
    if (dealtEffects) nodes.push(dealtEffects);
    const takenEffects = this.effectsSection("Efekty otrzymane", actor.procsReceived);
    if (takenEffects) nodes.push(takenEffects);

    // Własna klasa, nie `tip-note`: ta stoi już pod licznikami w "Ogólne",
    // a to jest podpowiedź nawigacji, nie dane.
    nodes.push(div("tip-hint", "LPM — rozbicie · PPM — powrót"));
    return nodes;
  }

  /**
   * Pokazuje rozbicie dla postaci o danej nazwie. Nazwa, a nie węzeł DOM, jest
   * tu tożsamością — dzięki temu dymek przeżywa przebudowę panelu.
   */
  /** Przy metryce tur pokazujemy, na co te tury poszły, a nie skąd obrażenia. */
  private turnRows(actor: ActorStats, total: number): Node[] {
    const rows: Array<[string, number]> = [
      ["Z akcją", total - actor.turnsLost],
      ["Utracone", actor.turnsLost],
    ];

    const nodes: Node[] = [div("tip-heading", "Na co poszły")];
    for (const [label, value] of rows) {
      if (value === 0 && label === "Utracone") continue;
      const row = div("tip-row");
      row.append(
        div("tip-label", label),
        div("tip-value", number.format(value)),
        div("tip-share", total > 0 ? `${Math.round((value / total) * 100)}%` : "—"),
      );
      nodes.push(row);
    }

    nodes.push(
      div(
        "tip-section",
        `ciosy ${actor.hits} · kryt. ${actor.crits} · uniki ${actor.misses}` +
          ` · maks. cios ${number.format(actor.maxHit)}`,
      ),
    );
    return nodes;
  }

  /**
   * Treść dymka dla wiersza rozbicia: pełna etykieta i liczby tej pozycji.
   *
   * Powód istnienia to sama etykieta. W 260px "Tancogniew Kazrek · Zwykły atak"
   * czy "Mushita Gula (od trucizny)" nie mieści się i ucina się wielokropkiem,
   * a to właśnie ta część niesie odpowiedź: od kogo i czym.
   */
  private sourceTipContent(
    source: ActorStats["dealtBy"][number],
    actor: ActorStats,
    list: BreakdownList,
  ): Node[] {
    const total = actorValue(actor, this.metric);
    const share = total > 0 ? Math.round((source.amount / total) * 100) : 0;
    const divisor = turnsFor(actor, this.metric, this.fightTurns);
    const perTurn = divisor > 0 ? source.amount / divisor : 0;

    const stat = (label: string, value: string) => {
      const row = div("tip-stat");
      row.append(div("tip-stat-label", label), div("tip-stat-value", value));
      return row;
    };

    const numbers = div("tip-section");
    numbers.append(
      stat(METRIC_LABELS[this.metric], number.format(source.amount)),
      stat("Udział", `${share}%`),
      stat("Na turę", `${rate.format(perTurn)}/t`),
    );

    // Użycia dotyczą tylko zadanych i całej walki (nie da się ich rozbić na
    // cele). Na szczeblu celów etykieta to nazwa postaci i nie trafia w żadne
    // użycie, więc dymek pokazuje wtedy same ciosy.
    const uses = this.metric === "damageDealt"
      ? actor.abilityUses.find((use) => use.label === source.label)
      : undefined;

    if (list === "types") {
      // Przekrój po żywiole nie dostaje licznika ciosów. Jeden cios niesie
      // kilka żywiołów naraz (mag: zimno + błyskawica), więc pozycje sumowałyby
      // się do wielokrotności ciosów postaci — trzy uderzenia czytało się jako
      // sześć. Ta sekcja odpowiada na pytanie "ile obrażeń czym", i tyle.
    } else if (uses) {
      // Po stronie zadanych pierwsza jest liczba UŻYĆ: to ona odpowiada na
      // pytanie, które się zadaje. Ciosy dokładamy wyłącznie wtedy, gdy się
      // rozjeżdżają — przy 13 z 17 etykiet w korpusie to ta sama liczba, a
      // powtórzona pod drugą nazwą czytała się jak osobny pomiar.
      numbers.append(stat("Użycia", `${uses.count}`));
      if (source.hits !== uses.count) numbers.append(stat("Ciosy", `${source.hits}`));
    } else {
      // Otrzymane i leczenie nie mają użyć — tam liczba ciosów jest jedyną,
      // jaką da się podać.
      numbers.append(stat(this.metric === "healingReceived" ? "Razy" : "Ciosy", `${source.hits}`));
    }

    return [
      // Etykieta łamie się na kilka linijek — po to jest ten dymek.
      div("tip-title tip-wrap", source.label),
      numbers,
      div("tip-hint", `${actor.name} · PPM — powrót do składu`),
    ];
  }

  private showTip(target: HoverTarget): void {
    const stats = this.latest?.fight;
    const rows = [...this.root.querySelectorAll<HTMLElement>(".row")];

    let content: Node[] | null = null;
    let row: HTMLElement | undefined;

    if (target.type === "actor") {
      const actor = stats?.actors.find((candidate) => candidate.name === target.key);
      row = rows.find((candidate) => candidate.dataset.actor === target.key);
      if (actor) content = this.tipContent(actor);
    } else {
      // Wiersz rozbicia opisuje postać, w której stoimy — bez niej nie ma czego
      // pokazać, a etykieta sama w sobie nie niesie liczb.
      const actor = this.focus
        ? stats?.actors.find((candidate) => candidate.name === this.focus)
        : undefined;
      row = rows.find(
        (candidate) =>
          candidate.dataset.source === target.key && candidate.dataset.list === target.list,
      );
      const list = actor ? this.breakdownList(actor, target.list) : [];
      const source = list.find((candidate) => candidate.label === target.key);
      if (actor && source) content = this.sourceTipContent(source, actor, target.list);
    }

    if (!content || !row) {
      this.hideTip();
      return;
    }

    this.hovered = target;
    this.tip.replaceChildren(...content);
    this.tip.hidden = false;

    // Wysokość znamy dopiero po wstawieniu treści i odsłonięciu dymka —
    // rośnie z liczbą wierszy rozbicia, więc nie da się jej wziąć ze stałej.
    const host = this.host.getBoundingClientRect();
    const { left, top } = tipPosition({
      hostLeft: host.left,
      panelWidth: this.state.width,
      rowTop: row.getBoundingClientRect().top,
      tipWidth: TIP_WIDTH,
      tipHeight: this.tip.getBoundingClientRect().height,
      gap: TIP_GAP,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });

    // Dymek jest pozycjonowany względem hosta (jedyny przodek z pozycją),
    // więc pozycję ekranową przeliczamy z powrotem na jego układ.
    this.tip.style.left = `${left - host.left}px`;
    this.tip.style.top = `${top - host.top}px`;
  }

  private hideTip(): void {
    this.hovered = null;
    this.tip.hidden = true;
  }

  private renderFooter(stats: BattleStats): HTMLElement | null {
    const notes: Array<{ text: string; warn: boolean }> = [];

    if (stats.unknownLines > 0) {
      notes.push({
        text: `⚠ ${stats.unknownLines} nierozpoznanych linii — statystyki niepełne`,
        warn: true,
      });
    }
    if (stats.ambiguousNames.length > 0) {
      notes.push({
        text: `* zsumowane postacie o tej samej nazwie: ${stats.ambiguousNames.join(", ")}`,
        warn: false,
      });
    }
    // Przypis idzie za tym, co widać na liście: przy "Oni" mówi o truciźnie
    // tykającej im, a nie o całej walce. Sprawcy log nie zna, ale poszkodowanego
    // tak, więc jest po czym dzielić.
    //
    // Wewnątrz postaci schodzi o szczebel niżej razem z widokiem: liczba ma
    // dotyczyć TEJ postaci, bo cała reszta panelu mówi już tylko o niej.
    const focused = this.focus
      ? stats.actors.find((actor) => actor.name === this.focus)
      : undefined;
    const dot = stats.unattributedDotDamage;
    const unattributed = focused
      ? focused.unattributedDotTaken
      : this.team === "mine"
        ? dot.mine
        : this.team === "enemy"
          ? dot.enemy
          : totalUnattributedDot(dot);
    if (unattributed > 0) {
      // Przy "Wszyscy" sama suma nie mówi, kogo to boli — a to jedyne, co o tej
      // truciźnie wiadomo, bo sprawcy log nie podaje. W widoku postaci podział
      // na strony nie ma sensu: strona jest jedna, ta jej.
      const split =
        !focused && this.team === "all" && (dot.mine > 0 || dot.enemy > 0)
          ? ` (my ${number.format(dot.mine)} · oni ${number.format(dot.enemy)})`
          : "";
      notes.push({
        text: `Trucizna bez sprawcy: ${number.format(unattributed)}${split}`,
        warn: false,
      });
    }

    if (notes.length === 0) return null;

    const footer = document.createElement("footer");
    for (const note of notes) {
      const line = document.createElement("div");
      line.className = note.warn ? "note warn" : "note";
      line.style.padding = "0";
      line.textContent = note.text;
      footer.append(line);
    }
    return footer;
  }

  private rerender(): void {
    if (this.latest) this.render(this.latest.fight, this.latest.session);
  }

  private makeDraggable(handle: HTMLElement): void {
    handle.addEventListener("pointerdown", (event) => {
      if ((event.target as Element).tagName === "BUTTON") return;

      const startX = event.clientX - this.state.x;
      const startY = event.clientY - this.state.y;
      handle.classList.add("dragging");
      handle.setPointerCapture(event.pointerId);

      const move = (moveEvent: PointerEvent) => {
        this.state.x = moveEvent.clientX - startX;
        this.state.y = moveEvent.clientY - startY;
        this.applyPosition();
      };

      const up = () => {
        handle.classList.remove("dragging");
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        this.saveState();
      };

      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
    });
  }

  /**
   * Uchwyt w rogu ciągnie szerokość i wysokość okna — jak róg w textarea. Rozmiar
   * piszemy prosto w styl żywego panelu (bez rerenderu, jak przeciąganie), a po
   * puszczeniu zapisujemy do stanu. Przy następnym renderze `render()` odtwarza
   * go z `state.width/height`, więc przeżywa przebudowę.
   */
  private makeResizable(grip: HTMLElement, panel: HTMLElement): void {
    grip.addEventListener("pointerdown", (event) => {
      // Bez tego pointer poszedłby dalej jako klik/kontekst i cofnął widok.
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startY = event.clientY;
      const startW = this.state.width;
      // Pierwszy pionowy chwyt startuje od bieżącej wysokości z treści.
      const startH = this.state.height ?? panel.getBoundingClientRect().height;
      grip.classList.add("resizing");
      // jsdom nie ma tej metody — stąd wywołanie warunkowe.
      grip.setPointerCapture?.(event.pointerId);

      const move = (moveEvent: PointerEvent) => {
        const maxW = Math.max(MIN_WIDTH, window.innerWidth - this.state.x - RESIZE_MARGIN);
        const maxH = Math.max(MIN_HEIGHT, window.innerHeight - this.state.y - RESIZE_MARGIN);
        this.state.width = clamp(startW + (moveEvent.clientX - startX), MIN_WIDTH, maxW);
        this.state.height = clamp(startH + (moveEvent.clientY - startY), MIN_HEIGHT, maxH);
        panel.style.width = `${this.state.width}px`;
        panel.style.height = `${this.state.height}px`;
      };

      const up = () => {
        grip.classList.remove("resizing");
        grip.removeEventListener("pointermove", move);
        grip.removeEventListener("pointerup", up);
        this.saveState();
      };

      grip.addEventListener("pointermove", move);
      grip.addEventListener("pointerup", up);
    });
  }

  private applyPosition(): void {
    this.host.style.left = `${this.state.x}px`;
    this.host.style.top = `${this.state.y}px`;
  }

  private loadState(): PanelState {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      return { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<PanelState>) };
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  private saveState(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Brak storage nie jest powodem, żeby przewrócić overlay.
    }
  }
}
