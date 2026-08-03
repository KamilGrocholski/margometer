import { professionColor, professionInk, typeColor } from "./palette.ts";
import {
  EMPTY_STATS,
  invertBreakdown,
  leadsDeeper,
  totalBySide,
  UNATTRIBUTED_SOURCE,
  type BattleStats,
  type BySide,
} from "./stats.ts";
import { STYLE } from "./style.ts";
import { PROFESSIONS, type ActorStats, type AttackerBreakdown } from "./types.ts";
import { VERSION } from "./version.ts";
import { clampToViewport, makeDraggable, realTicker, type Ticker } from "./window.ts";
import { Confirm } from "./confirm.ts";
import { storedBoolean, storedNumber, storedOneOf, storedRecord } from "./stored-state.ts";

/**
 * Metryka, czyli o czym mówi ranking.
 *
 * Stała tu czwarta wartość — `"turns"` — i była nieosiągalna z UI, bo `METRICS`
 * jej nie wystawiał. Odpuszczona 2026‑08‑03 razem z osią tur: średnia na turę
 * stoi dziś w każdym wierszu, a same tury i tury utracone — w dymku. Czwarta
 * zakładka nie miała czego dołożyć, a typ obiecywał, że kiedyś będzie.
 */
export type Metric = "damageDealt" | "damageTaken" | "healingReceived";
/** Filtr składu: obie strony, drużyna gracza (strona 0) albo przeciwnicy. */
export type Team = "all" | "mine" | "enemy";

const METRIC_LABELS: Record<Metric, string> = {
  damageDealt: "Zadane",
  damageTaken: "Otrzymane",
  healingReceived: "Leczenie",
};

/** Etykieta wiersza „Tury" w dymku. Nie jest metryką — nie da się jej wybrać. */
const TURNS_LABEL = "Tury";

/** Ile pozycji pokazuje podgląd rozbicia w dymku (`UX §4.2`). */
const TOP_SOURCES = 3;

/**
 * Wiersz dymka: etykieta z lewej, wartość z prawej.
 *
 * Ten sam kształt padał w czterech miejscach po trzy linijki
 * (`SOLID §8` liczyło pięć kopii `tip-stat`). Kopie same z siebie niczego nie
 * psuły, ale piąta powstawała właśnie teraz — a to one rozjeżdżają się
 * pierwsze, gdy jedno miejsce dostanie klasę, a reszta nie.
 */
function tipStat(label: string, value: string, extraClass = ""): HTMLElement {
  const row = div(`tip-stat${extraClass ? ` ${extraClass}` : ""}`);
  row.append(div("tip-stat-label", label), div("tip-stat-value", value));
  return row;
}

/**
 * Kolejność zakładek i wierszy podsumowania w dymku — jedna, wspólna.
 *
 * Leczenie wróciło ze względu na PvP grupowe: w dziesiątce healer decyduje
 * o wyniku, więc bez tej kolumny panel kłamie o tym, kto wygrał walkę.
 */
const METRICS = ["damageDealt", "damageTaken", "healingReceived"] as const;

// Krótko, bo to przełącznik używany W TRAKCIE walki — a "my"/"oni" stoi już
// przy pasku porównania stron, więc te same słowa znaczą tu to samo.
const TEAM_LABELS: Record<Team, string> = {
  all: "Wszyscy",
  mine: "My",
  enemy: "Oni",
};

/** Zamknięty zestaw filtrów — po nim `loadState` odsiewa zapis spoza wersji. */
const TEAMS = ["all", "mine", "enemy"] as const;

/**
 * Puste stany napisane po polsku, a nie sklejone z etykiety zakładki.
 *
 * `Brak danych: ${TEAM_LABELS[team].toLowerCase()}.` dawało „Brak danych: my."
 * i „Brak rozbicia: zadane." — etykiety zakładek są MIANOWNIKAMI i po dwukropku
 * nie brzmią jak zdanie. Zdania są krótsze niż reguła odmiany, a zestaw jest
 * zamknięty, więc mapa jest tu tańsza od gramatyki.
 */
const EMPTY_BREAKDOWN: Record<Metric, string> = {
  damageDealt: "Brak zadanych obrażeń.",
  damageTaken: "Brak otrzymanych obrażeń.",
  healingReceived: "Brak leczenia.",
};
const EMPTY_TEAM: Record<Team, string> = {
  all: "Brak danych — czekam na walkę.",
  mine: "Brak danych po naszej stronie.",
  enemy: "Brak danych po stronie przeciwnika.",
};

/**
 * Który przekrój rozbicia: pozycje po drugiej stronie ciosu (kto/komu),
 * umiejętności zsumowane po wszystkich celach, albo typ obrażeń.
 *
 * `sources` i `abilities` to DWA WEJŚCIA w to samo drążenie, z przeciwnych
 * stron: przez cel („komu zadał, a czym w niego”) i przez umiejętność („czym
 * zadał, a komu tym”). Rozróżnienie musi przeżyć klik, bo ta sama nazwa potrafi
 * stać w obu listach — trucizna bez sprawcy stoi na pierwszym szczeblu pod
 * nazwą efektu i po odwróceniu wychodzi też jako umiejętność.
 */
type BreakdownList = "sources" | "abilities" | "types";

/**
 * Czy `data-list` z wiersza jest jedną ze znanych list.
 *
 * `dataset` daje `string | undefined`, a od tej wartości zależy, w której liście
 * dymek szuka pozycji — pudło znaczy dymek, który nie przychodzi. Strażnik stoi
 * tu, żeby dołożenie czwartej listy było błędem kompilacji w JEDNYM miejscu,
 * a nie cichym pudłem w drugim.
 */
function isBreakdownList(value: string | undefined): value is BreakdownList {
  return value === "sources" || value === "abilities" || value === "types";
}

/** Z której listy wyszedł drugi szczebel drążenia. */
type DrillKind = "target" | "ability";

/**
 * Co siedzi pod kursorem. Dymek opisuje albo postać z listy składu, albo
 * pojedynczy wiersz rozbicia wewnątrz postaci — to dwie różne treści i dwa
 * różne sposoby odnalezienia danych po przebudowie panelu.
 */
type HoverTarget =
  | { type: "actor"; key: string }
  | { type: "source"; key: string; list: BreakdownList };

/**
 * Rodzaje tykających obrażeń bez sprawcy w zakresie, który widać na liście.
 *
 * Sumujemy po postaciach przechodzących filtr, bo tylko one składają się na
 * liczbę stojącą w przypisie. Rodzaje z całej walki obok kwoty jednej strony
 * to nawias rozbijający coś innego, niż zapowiada.
 */
function sumKinds(
  actors: readonly ActorStats[],
  team: Team,
): Array<{ label: string; amount: number }> {
  const total = new Map<string, number>();
  for (const actor of actors) {
    if (!matchesTeam(actor.side, team)) continue;
    for (const kind of actor.unattributedDotTypes) {
      total.set(kind.label, (total.get(kind.label) ?? 0) + kind.amount);
    }
  }
  return [...total]
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** Strona 0 to drużyna gracza — log pisze skład od jego perspektywy. */
function matchesTeam(side: number | null, team: Team): boolean {
  if (team === "all") return true;
  // Postać spoza składu nie ma strony, więc pokazujemy ją tylko w "Wszyscy".
  if (side === null) return false;
  return team === "mine" ? side === 0 : side !== 0;
}

/**
 * Polska odmiana po liczbie: `[jedna, dwie, pięć]`.
 *
 * Jedna reguła na wszystkie liczniki w panelu. Wcześniej odmieniały się same
 * walki, a obok stało „2 tur" i „1 postaci · 1 tur" — liczba jest tu treścią,
 * więc zła forma rzuca się w oczy tak samo jak zła wartość.
 */
export function plural(count: number, forms: [string, string, string]): string {
  if (count === 1) return forms[0];
  const last = count % 10;
  const teens = count % 100;
  const few = last >= 2 && last <= 4 && !(teens >= 12 && teens <= 14);
  return few ? forms[1] : forms[2];
}

const fightWord = (count: number) => plural(count, ["walka", "walki", "walk"]);
/** „1 nierozpoznana linia" zamiast „1 nierozpoznanych linii". */
const lineWord = (count: number) => plural(count, ["linia", "linie", "linii"]);
const unknownWord = (count: number) =>
  plural(count, ["nierozpoznana", "nierozpoznane", "nierozpoznanych"]);
/** Wspólne dla panelu i archiwum — te same liczniki stoją w obu. */
export const turnWord = (count: number) => plural(count, ["tura", "tury", "tur"]);

/**
 * Człon o unikach — jeden dla stopki widoku postaci i dla dymka.
 *
 * Uniki CZĘŚCIOWE (broń główna przepadła, pomocnicza trafiła) stoją osobno, bo
 * taki atak jest jednocześnie ciosem: doliczone do „uników" dawały
 * „ciosy 12 · uniki 2" przy dwunastu atakach i czytający sumował je do
 * czternastu. Człon pojawia się TYLKO gdy jest niezerowy — u profesji bijących
 * jedną bronią uniki są zawsze pełne i wiersz zostaje bez zmian.
 */
function dodgeLabel(actor: ActorStats): string {
  const partial = actor.partialMisses;
  if (partial === 0) return `uniki ${actor.misses}`;
  const word = plural(partial, ["częściowy", "częściowe", "częściowych"]);
  return `uniki ${actor.misses} (+${partial} ${word})`;
}

/**
 * Kryty razem z ciosami bardzo krytycznymi.
 *
 * "W tym", a nie "+", bo super-kryt JEST krytem — log wypisuje oba modyfikatory
 * przy tym samym trafieniu (10/10 wystąpień w korpusie). Znak plus czytałby się
 * jak druga kategoria do dodania i psuł liczbę, tak samo jak przy unikach
 * częściowych, gdzie z dwunastu ataków wychodziło czternaście.
 */
function critLabel(actor: ActorStats): string {
  if (actor.superCrits === 0) return `kryt. ${actor.crits}`;
  return `kryt. ${actor.crits} (w tym ${actor.superCrits} bardzo)`;
}

/**
 * Pochłonięte razem z tym, ile z nich zdjął blok.
 *
 * Blok jest PODZBIOREM pochłoniętych — reszta to pancerz i odporności, których
 * log nie rozbija. Stąd nawias, a nie osobny człon listy: dwie liczby obok
 * siebie zapraszałyby do dodania ich do siebie.
 */
function absorbedLabel(actor: ActorStats): string {
  const absorbed = `pochłonięte ${number.format(actor.damageAbsorbed)}`;
  if (actor.damageBlocked === 0) return absorbed;
  return `${absorbed} (blok ${number.format(actor.damageBlocked)})`;
}

export const actorWord = (count: number) => plural(count, ["postać", "postacie", "postaci"]);

const number = new Intl.NumberFormat("pl-PL");
/** Na turę wychodzą ułamki — bez miejsca po przecinku wszyscy zlewają się w jedno. */
const rate = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });

/**
 * Zwięzły zapis liczby na PASKU rankingu — jak w SKADZIE i Details!: `39,4k`
 * zamiast `39 352`.
 *
 * Wchodzi dopiero od pięciu cyfr, bo do czterech pełna liczba i tak się mieści,
 * a jest dokładniejsza. Skrót „k”/„M” zamiast polskiego „tys.” jest tu świadomy:
 * panel czyta gracz przyzwyczajony do liczników z innych gier, a „tys.” zajmuje
 * więcej miejsca niż oszczędza.
 *
 * Tylko pasek — dymek, podsumowania drużyn i rozbicie pokazują pełne liczby,
 * bo tam nie ma o miejsce walki, a różnica bywa istotna.
 */
function compact(value: number, fraction: boolean): string {
  if (value >= 1_000_000) return `${rate.format(value / 1_000_000)}M`;
  if (value >= 10_000) return `${rate.format(value / 1000)}k`;
  return fraction ? rate.format(value) : number.format(value);
}

// Muszą się zgadzać z szerokościami w `style.ts` — przy `box-sizing: border-box`
// to pełne wymiary elementów, razem z ramką.
const PANEL_WIDTH = 260;
const TIP_WIDTH = 260;
const TIP_GAP = 8;
// Granice ręcznego rozmiaru okna. Poniżej MIN_WIDTH dwukolumnowe wiersze się
// zlepiają; MIN_HEIGHT zostawia miejsce na nagłówek i kilka wierszy. RESIZE_MARGIN
// to luz do krawędzi ekranu, żeby uchwyt nie uciekł poza widok.
const MIN_WIDTH = 200;
const MIN_HEIGHT = 140;
/** Jak długo na przycisku stoi „✓"/„✕" po kopiowaniu. */
const FLASH_MS = 1500;
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
  return metric === "damageDealt" ? actor.turns : fightTurns;
}

/**
 * Jak nazywa się dzielnik trybu „na turę” dla danej metryki.
 *
 * W wierszu obie kolumny są podpisane identycznie „/t”, więc przełączenie
 * zakładki Zadane↔Otrzymane zmienia skalę liczby o rząd wielkości bez żadnego
 * sygnału w UI. Dymek jest miejscem, gdzie da się to powiedzieć słowami, nie
 * zaśmiecając wiersza kryptycznym sufiksem.
 */
function turnKind(metric: Metric): string {
  return metric === "damageDealt" ? "turę własną" : "turę walki";
}

/**
 * „Ile razy” dla akcji, która ma i użycia, i ciosy.
 *
 * Ciosy dopisujemy tylko przy rozjeździe: równe liczby pod dwiema nazwami
 * czytały się jak dwa osobne pomiary.
 *
 * ZERO ciosów to nie rozjazd, tylko inny kształt akcji. `Śpiew zagłady` zadaje
 * przez linię „-N obrażeń otrzymał(a) X", która nie jest ciosem — i słusznie nie
 * jest liczona jako cios. Ale wiersz mówił wtedy „266 040 (79%) ×3 · 0 c.",
 * czyli licznik zaprzeczał kwocie stojącej obok niego. Skoro ciosów nie było,
 * nie ma czego dopisywać: samo „×3" nadal odpowiada na „ile razy”.
 */
function times(uses: number, hits: number): string {
  return hits === 0 || hits === uses ? `×${uses}` : `×${uses} · ${hits} c.`;
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

/** Nazwa akcji przycisku, w którym leży cel zdarzenia. */
function actionUnder(target: EventTarget | null): string | null {
  const element = target as Element | null;
  if (typeof element?.closest !== "function") return null;
  return element.closest<HTMLElement>("[data-action]")?.dataset.action ?? null;
}

/**
 * Czy cel zdarzenia leży w samym panelu — a nie w archiwum, które rysuje się
 * w TYM SAMYM shadow roocie.
 *
 * Ta sama ostrożność co w `rowUnder` — `closest` zamiast `instanceof`, bo
 * siedzimy w cudzym dokumencie.
 */
function panelUnder(target: EventTarget | null): boolean {
  const element = target as Element | null;
  if (typeof element?.closest !== "function") return false;
  return element.closest(".panel") !== null;
}

/**
 * Wypełnienie wiersza: przygaszony pasek plus nasadka w pełnej barwie.
 *
 * Dwa węzły, nie jeden, bo służą dwóm różnym rzeczom i mają różne krycie —
 * pasek niesie WIELKOŚĆ (i musi ustąpić tekstowi, który na nim leży, patrz
 * reguła `.bar`), nasadka niesie TOŻSAMOŚĆ i zostaje przy nasyceniu, dla
 * którego liczony był rozstęp barw w `palette.ts`.
 *
 * Jedno miejsce na oba, bo rysują je dwie listy — ranking i rozbicie — a
 * rozjazd między nimi znaczyłby, że ta sama postać wygląda inaczej w zależności
 * od tego, gdzie się na nią patrzy.
 */
function barFill(color: string, widthPct: number): HTMLElement[] {
  const bar = div("bar");
  bar.style.background = color;
  bar.style.width = `${widthPct}%`;
  const cap = div("bar-cap");
  cap.style.background = color;
  return [bar, cap];
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

/**
 * Nagrywanie widziane przez overlay. Celowo bez wiedzy o magazynie: panel ma
 * przełączać i pokazywać stan, a nie wiedzieć, gdzie leżą logi.
 */
export type RecorderControl = {
  isRecording(): boolean;
  toggle(): void;
  count(): number;
  chars(): number;
  /** Nagrane logi w jednym tekście. null, gdy nie ma czego kopiować. */
  dump(): string | null;
  clear(): void;
  /** Magazyn odmówił zapisu — pasek ma to powiedzieć wprost. */
  isFailed(): boolean;
};

/**
 * Okno archiwum widziane przez overlay — tylko tyle, ile trzeba, żeby narysować
 * przycisk. Reszta (lista, wczytywanie, odtwarzanie) siedzi w `archive.ts`.
 */
export type ArchiveControl = {
  isOpen(): boolean;
  toggle(): void;
  /** Lista nagrań mogła urosnąć — okno ma szansę się odświeżyć. */
  sync(): void;
  /** Zatrzymuje odtwarzanie i odliczanie. Opcjonalne — atrapy w testach go nie mają. */
  destroy?(): void;
};

/** Sterowanie odtwarzaniem, rysowane w pasku podglądu. */
export type ReplayView = {
  playing: boolean;
  /** Postęp 0..1 — tyle log ma już odtworzone. */
  progress: number;
  /** Mnożnik prędkości do pokazania na przycisku. */
  speed: number;
  /** Podpis postępu, np. "tura 14/31". */
  label: string;
  toggle(): void;
  cycleSpeed(): void;
  seek(fraction: number): void;
};

/**
 * Walka wczytana z archiwum albo wklejona ręcznie. Panel pokazuje ją zamiast
 * bieżącej, więc musi powiedzieć wprost, CO widać — inaczej minutę później nie
 * wiadomo, czy to trwająca walka, czy wczorajsza.
 */
export type PreviewView = {
  /** Skąd dane: "z archiwum · dziś 19:04" albo "wklejony log". */
  source: string;
  /** Kogo dotyczy walka, np. "Kamil vs Regulus". */
  title: string;
  replay: ReplayView | null;
  close(): void;
};

export type OverlayOptions = {
  /** Gdzie doczepić hosta. Domyślnie `document.body`. */
  mount?: Element;
  /** Odczyt i zapis stanu okna (pozycja, zwinięcie). */
  storage?: Pick<Storage, "getItem" | "setItem">;
  recorder?: RecorderControl;
  /**
   * Wstrzykiwany zapis do schowka — jsdom nie ma `navigator.clipboard`, a bez
   * tego kopiowania nie dałoby się przetestować.
   */
  clipboard?: (text: string) => void | Promise<void>;
  /** Zegar do wygaszania potwierdzeń. Wstrzykiwany wyłącznie dla testów. */
  now?: () => number;
  /** Odmierzanie wygaśnięcia potwierdzeń. Wstrzykiwane wyłącznie dla testów. */
  ticker?: Ticker;
};

/**
 * Zapis do schowka z zapasowym wyjściem.
 *
 * `navigator.clipboard` wymaga bezpiecznego kontekstu; Margonem chodzi po
 * https, więc normalnie wystarcza. `execCommand` zostaje na wypadek starszej
 * przeglądarki i odmowy uprawnienia — kliknięcie i tak już jest gestem
 * użytkownika, więc obie drogi są dozwolone.
 */
async function writeClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // Spadamy do starej drogi poniżej.
  }

  const area = document.createElement("textarea");
  area.value = text;
  // Poza ekranem, żeby nie mrugnęło polem tekstowym nad grą.
  area.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
  document.body.append(area);
  area.select();
  let copied = false;
  try {
    // `execCommand` przy odmowie ZWRACA `false`, a nie rzuca — a wartość szła
    // dotąd w próżnię. Panel migał więc „✓" także wtedy, gdy do schowka nie
    // trafiło nic, i użytkownik dowiadywał się o tym dopiero przy wklejaniu.
    copied = document.execCommand("copy");
  } finally {
    area.remove();
  }
  if (!copied) throw new Error("schowek odmówił zapisu");
}

// `height: null` = wysokość z treści (jak dotąd). Liczba pojawia się dopiero,
// gdy użytkownik pociągnie za uchwyt — wtedy okno ma stały rozmiar, a korpus
// przewija się w środku.
/**
 * Co panel pamięta między sesjami.
 *
 * Geometria (`x`, `y`, `collapsed`, `width`, `height`) i USTAWIENIA WIDOKU
 * (`metric`, `team`, `perTurn`). Wcześniej zapisywała się tylko geometria, przez
 * co panel wyglądał na zapamiętany — stał tam, gdzie się go postawiło — a widok
 * w środku wracał do domyślnego. F5 w walce grupowej kasował ustawione „Oni"
 * plus „na turę".
 *
 * Wejścia w postać (`focus`) świadomie tu NIE MA: po odświeżeniu postać
 * z poprzedniej walki i tak by nie istniała, a `render()` słusznie cofa wtedy
 * o szczebel.
 */
type PanelState = {
  x: number;
  y: number;
  collapsed: boolean;
  width: number;
  height: number | null;
  metric: Metric;
  team: Team;
  perTurn: boolean;
};

const STORAGE_KEY = "margometer.panel";
const DEFAULT_STATE: PanelState = {
  x: 16,
  y: 16,
  collapsed: false,
  width: PANEL_WIDTH,
  height: null,
  metric: "damageDealt",
  team: "all",
  perTurn: false,
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
  /**
   * Szkielet okna żyje przez całe życie overlaya. Render co klatkę (odtwarzanie)
   * przebudowuje tylko TREŚĆ w środku, nie te pojemniki — inaczej kliknięcie
   * w sterowanie gubiło się w przebudowie, a pasek przewijania korpusu migał.
   */
  private readonly panel: HTMLElement;
  private readonly body: HTMLElement;
  /** Okruszek powrotu — trwały przez całe życie panelu (`UX §4.1`). */
  private readonly crumb: HTMLElement;
  private readonly crumbBack = document.createElement("button");
  private readonly crumbName = div("crumb-name");
  private readonly grip: HTMLElement;
  /**
   * Nagłówek żyje tyle, co overlay — razem z przyciskami i uchwytem
   * przeciągania.
   *
   * Ta sama zasada co przy sterowaniu odtwarzaniem: gdyby powstawał od nowa
   * przy każdej zmianie logu, `pointerdown` i `pointerup` jednego gestu
   * trafiałyby w dwa różne węzły. Przeciąganie zastygało wtedy w środku walki,
   * a `saveState` (wisi na `pointerup`) nigdy nie padał, więc ustawiona pozycja
   * nie przeżywała odświeżenia strony.
   */
  private readonly header: HTMLElement;
  private readonly headerButtons: {
    copy: HTMLButtonElement;
    /** null, gdy overlay dostał program bez nagrywarki. */
    record: HTMLButtonElement | null;
    /** Gotowy, ale wchodzi do nagłówka dopiero przy `attachArchive`. */
    archive: HTMLButtonElement;
    collapse: HTMLButtonElement;
  };
  /** Paski stanu z ostatniego renderu — do zdjęcia przy następnym. */
  private chromeNodes: HTMLElement[] = [];
  /**
   * Trwałe węzły sterowania odtwarzaniem. Muszą przeżyć przebudowę pasków co
   * klatkę: gdyby powstawały od nowa, `pointerdown` i `pointerup` jednego
   * kliknięcia trafiałyby w dwa różne węzły i `click` nigdy by nie padł.
   */
  private replayControls: {
    row: HTMLElement;
    play: HTMLButtonElement;
    track: HTMLElement;
    fill: HTMLElement;
    label: HTMLElement;
    speed: HTMLButtonElement;
  } | null = null;
  /** Bieżący opis odtwarzania — trwałe przyciski czytają go w chwili kliknięcia. */
  private currentReplay: ReplayView | null = null;
  /** Wiersz, na którym wciśnięto lewy przycisk — do dopasowania na `pointerup`. */
  private pressed: { key: string; actor?: string; source?: string } | null = null;
  /** `pointerup` już wdrążył — powstrzymaj `click`, który zaraz po nim przyjdzie. */
  private drillHandled = false;
  /**
   * Statystyki, które panel właśnie pokazuje — bieżąca walka albo podgląd
   * z archiwum. Trzymane w polu, bo rozbicie musi sięgnąć po profesję postaci
   * stojącej po DRUGIEJ stronie ciosu, a tej nie ma we własnym `ActorStats`.
   */
  private shown: BattleStats = EMPTY_STATS;
  private readonly storage: OverlayOptions["storage"];
  private readonly recorder: RecorderControl | undefined;
  private readonly clipboard: (text: string) => void | Promise<void>;
  /** Wstrzykiwany zegar — bez niego nie da się sprawdzić wygasania potwierdzeń. */
  private readonly now: () => number;
  private state: PanelState;

  /**
   * Co pokazać zamiast ikony kopiowania przez chwilę po kliknięciu. Kopiowanie
   * nie zmienia nic na ekranie, więc bez potwierdzenia nie wiadomo, czy w ogóle
   * poszło. Trzymane w polu, bo panel przebudowuje się przy każdej zmianie logu.
   */
  private flash: { key: string; label: string } | null = null;
  /**
   * Pytanie „na pewno?" przy kasowaniu WSZYSTKICH nagrań.
   *
   * Potwierdzenie wygasa — inaczej pierwszy klik, zwinięcie panelu i przypadkowy
   * klik po godzinie kasowały całe archiwum bez pytania. Ta sama klasa obsługuje
   * kasowanie pojedynczego nagrania w archiwum; wcześniej były dwie i zachowywały
   * się odwrotnie.
   */
  private readonly confirmClear: Confirm<void>;
  private archive: ArchiveControl | null = null;
  /** Trzymane, żeby `destroy()` miało co zdjąć z `window`. */
  private readonly onResize: () => void;
  /**
   * Zegar wygaszania „✓"/„✕" po skopiowaniu.
   *
   * Ten sam wstrzykiwany `Ticker`, co w `Confirm`, a nie goły `setTimeout`:
   * inaczej jedyny test na to, że `destroy()` gasi odliczanie, musiał SPAĆ 1,6 s
   * i sprawdzać, że host nadal nie jest w dokumencie — czyli zdanie prawdziwe
   * niezależnie od tego, czy zegar zgasł. Z tickerem da się zapytać wprost.
   */
  private readonly ticker: Ticker;
  private flashHandle: number | null = null;
  /**
   * Wczytana walka pokazywana zamiast bieżącej. Licznik na żywo leci w tle bez
   * zmian — podgląd niczego nie zatrzymuje, tylko przykrywa widok.
   */
  private preview: { stats: BattleStats; view: PreviewView } | null = null;

  /**
   * Co robią przyciski przebudowywane przy każdym renderze — klucz to
   * `data-action`, czyli tożsamość PRZEŻYWAJĄCA przebudowę, w odróżnieniu od
   * samego węzła. Wypełniana od nowa w `render()`; patrz `bindAction`.
   */
  private readonly actions = new Map<string, () => void>();
  /** Akcja, na której wciśnięto przycisk — para dla `pointerup`. */
  private pressedAction: string | null = null;
  /** `pointerup` już wykonał akcję; przyszły za nim `click` ma ją pominąć. */
  private actionHandled = false;

  // Metryka, filtr składu i tryb „na turę" mieszkają w `state`, bo przeżywają
  // odświeżenie strony — patrz `PanelState`. Skróty niżej, żeby reszta pliku
  // czytała się tak samo jak wcześniej.
  private get metric(): Metric {
    return this.state.metric;
  }
  private set metric(value: Metric) {
    this.state.metric = value;
    this.saveState();
  }
  private get team(): Team {
    return this.state.team;
  }
  private set team(value: Team) {
    this.state.team = value;
    this.saveState();
  }
  /** Liczby dzielone przez tury zamiast surowych sum. */
  private get perTurn(): boolean {
    return this.state.perTurn;
  }
  private set perTurn(value: boolean) {
    this.state.perTurn = value;
    this.saveState();
  }
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
   * Drugi szczebel drążenia: pozycja, w którą weszliśmy wewnątrz postaci.
   * `null` to pierwszy szczebel. Zależnie od `focusKind` jest to postać po
   * drugiej stronie ciosu (cel / napastnik) albo umiejętność.
   */
  private focusSource: string | null = null;
  /**
   * Z KTÓREJ listy wyszedł `focusSource`. Sama nazwa nie wystarcza: „od
   * trucizny" potrafi stać naraz na liście napastników i na liście
   * umiejętności, a drugi szczebel renderuje się dla każdej z nich inaczej.
   */
  private focusKind: DrillKind | null = null;
  /** Ostatnio podane statystyki bieżącej walki. */
  private latest: { fight: BattleStats } | null = null;
  /**
   * Tury całej walki — dzielnik dla metryk, których nie bierze się we własnej
   * turze (patrz `turnsFor`). Trzymane w polu, bo potrzebuje go kilka metod
   * renderujących, a wszystkie i tak wiszą na tym samym `render()`.
   */
  private fightTurns = 0;

  constructor(options: OverlayOptions = {}) {
    this.storage = options.storage;
    this.recorder = options.recorder;
    this.clipboard = options.clipboard ?? writeClipboard;
    this.now = options.now ?? Date.now;
    this.ticker = options.ticker ?? realTicker;
    this.confirmClear = new Confirm<void>({
      now: this.now,
      ticker: this.ticker,
      // Wygaśnięcie musi PRZERYSOWAĆ panel, inaczej na przycisku zostaje „na
      // pewno?" nad pytaniem, którego już nie ma.
      onExpire: () => this.rerender(),
    });
    this.state = this.loadState();

    this.host = document.createElement("div");
    this.host.id = "margometer";
    this.root = this.host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = STYLE;

    this.tip = div("tip");
    this.tip.hidden = true;

    // Trwały szkielet: panel, nagłówek, przewijany korpus i uchwyt rozmiaru.
    // Oba uchwyty (przeciąganie, rozmiar) podpinamy RAZ — piszą prosto w styl
    // tego samego panelu przez całe życie okna. Treść wjeżdża do `body` i przed
    // nie przy każdym renderze.
    this.panel = document.createElement("div");
    this.body = div("panel-body");
    // Okruszek wjeżdża do korpusu RAZ i już z niego nie wychodzi — patrz
    // `buildCrumb`. Render tylko go pokazuje albo chowa.
    this.crumb = this.buildCrumb();
    this.body.append(this.crumb);
    this.grip = div("resize-grip");
    this.grip.setAttribute("aria-hidden", "true");
    this.makeResizable(this.grip, this.panel);
    this.header = document.createElement("header");
    this.headerButtons = this.buildHeader(this.header);
    this.makeDraggable(this.header);
    this.panel.append(this.header, this.body, this.grip);

    this.root.append(style, this.tip, this.panel);

    // Delegacja zamiast listenerów na wierszach: panel jest przebudowywany przy
    // każdej zmianie logu, a `pointerenter` nie odpaliłby się ponownie dla
    // świeżego węzła pod nieruchomym kursorem. `pointerover` bąbelkuje.
    this.root.addEventListener("pointerover", (event) => {
      const row = rowUnder(event.target);
      if (row?.dataset.actor) {
        this.showTip({ type: "actor", key: row.dataset.actor });
      } else if (row?.dataset.source && isBreakdownList(row.dataset.list)) {
        // Wewnątrz postaci pełna etykieta bywa ucięta w wierszu — dymek jest
        // jedynym miejscem, gdzie widać całe "od kogo i czym".
        //
        // Lista idzie WPROST z wiersza. Wcześniej stało tu zawężenie do dwóch
        // wartości (`… === "types" ? "types" : "sources"`), przez które cała
        // sekcja `CZYM (ŁĄCZNIE)` — i drugi szczebel wejścia przez umiejętność —
        // pytały o pozycję w liście CELÓW, nie znajdowały jej i chowały dymek.
        // Akurat tam etykiety są najdłuższe, czyli dymek najbardziej potrzebny.
        this.showTip({ type: "source", key: row.dataset.source, list: row.dataset.list });
      }
    });
    this.root.addEventListener("pointerout", (event) => {
      if (!rowUnder((event as PointerEvent).relatedTarget)) this.hideTip();
    });

    // Lewy przycisk wchodzi w postać. Podczas odtwarzania panel przebudowuje się
    // co klatkę, więc wiersz spod kursora znika MIĘDZY `pointerdown` a `pointerup`
    // — a wtedy przeglądarka albo w ogóle nie wystawia `click`, albo wystawia go
    // na trwałym `panel-body` (wspólnym przodku), gdzie nie ma już `.row` do
    // odczytania. Dlatego drążymy na `pointerup`: on pada zawsze na węzeł
    // faktycznie pod kursorem w chwili puszczenia. Tożsamością jest nazwa
    // z wiersza, nie sam węzeł, więc świeży wiersz tej samej postaci pasuje.
    this.root.addEventListener("pointerdown", (event) => {
      // Nowy gest zeruje ślad po poprzednim — gdyby po `pointerup` nie przyszedł
      // `click` (rzadkie), flaga nie może połknąć następnego kliknięcia.
      this.drillHandled = false;
      this.pressed = this.rowIdentity(rowUnder(event.target));
    });
    this.root.addEventListener("pointerup", (event) => {
      const pressed = this.pressed;
      this.pressed = null;
      const row = this.rowIdentity(rowUnder(event.target));
      // Puszczono nad tym samym wierszem, na którym wciśnięto — dopiero to jest
      // kliknięcie. Puszczenie nad innym (ranking się przestawił) nie drąży.
      if (row && pressed && row.key === pressed.key && this.drill(row)) {
        // Za `pointerup` i tak przyjdzie `click` — bez tej flagi zadziałałby drugi
        // raz i od razu cofnął wejście.
        this.drillHandled = true;
      }
    });
    // Zapasowa droga dla samego `click`: testy wywołują `.click()` bez pary
    // pointer-ów, a przy nieruchomym panelu (poza odtwarzaniem) to najprostsze.
    this.root.addEventListener("click", (event) => {
      if (this.drillHandled) {
        this.drillHandled = false;
        return;
      }
      this.drill(this.rowIdentity(rowUnder(event.target)));
    });

    // Przyciski panelu chodzą tą samą drogą co wiersze i z tego samego powodu:
    // zakładki, okruszek i pasek nagrywania powstają od nowa przy KAŻDYM
    // renderze, więc podczas odtwarzania węzeł znika między `pointerdown`
    // a `pointerup` i natywny `click` nie pada. Tożsamością jest `data-action`,
    // a nie węzeł, więc świeży przycisk tej samej akcji pasuje.
    this.root.addEventListener("pointerdown", (event) => {
      this.actionHandled = false;
      this.pressedAction = actionUnder(event.target);
    });
    this.root.addEventListener("pointerup", (event) => {
      const pressed = this.pressedAction;
      this.pressedAction = null;
      const name = actionUnder(event.target);
      if (!name || name !== pressed) return;
      const run = this.actions.get(name);
      if (!run) return;
      run();
      this.actionHandled = true;
    });
    this.root.addEventListener("click", (event) => {
      if (this.actionHandled) {
        this.actionHandled = false;
        return;
      }
      const name = actionUnder(event.target);
      if (name) this.actions.get(name)?.();
    });
    this.root.addEventListener("contextmenu", (event) => {
      // Prawy przycisk zdejmuje szczebel drążenia, więc menu przeglądarki
      // blokujemy — ale WYŁĄCZNIE tam, gdzie naprawdę coś robi. Zabranie menu
      // bez dania niczego w zamian to czysta strata dla użytkownika.
      //
      // Stąd dwa warunki, oba konieczne. Po pierwsze: tylko w panelu, bo
      // archiwum rysuje się w TYM SAMYM shadow roocie i ma własne pole
      // wklejania logu — jedyne miejsce w dodatku, gdzie natywne menu jest
      // naprawdę potrzebne. Sam warunek „nie pole tekstowe" tu nie wystarcza:
      // nad LISTĄ nagrań menu też się należy, a wcześniej ginęło.
      //
      // Po drugie: tylko gdy jest co zdjąć. Na najwyższym szczeblu `back()`
      // wychodził bez efektu, a `preventDefault()` leciał i tak — menu znikało
      // w zamian za nic. Kolejność ma znaczenie: gdyby pytać tylko o szczebel,
      // to po zejściu w postać i otwarciu archiwum prawy przycisk NAD ARCHIWUM
      // zdejmowałby szczebel w niewidocznym panelu.
      if (!panelUnder(event.target)) return;
      if (!this.canGoBack()) return;
      event.preventDefault();
      this.back();
    });

    (options.mount ?? document.body).append(this.host);
    // Zapisana pozycja mogła powstać na szerszym ekranie — przycinamy ją
    // przy starcie, nie dopiero przy pierwszym przeciągnięciu.
    this.moveTo(this.state.x, this.state.y);
    // Okno gry zmienia rozmiar także wtedy, gdy nic nie przychodzi z logu.
    // Referencja w polu, żeby `destroy()` miało co zdjąć.
    this.onResize = () => this.moveTo(this.state.x, this.state.y);
    window.addEventListener("resize", this.onResize);
  }

  /**
   * Jedyny argument to JEDNA walka — ta, o której panel mówi.
   *
   * Stał tu drugi, suma sesji, i miał WŁASNY typ `SessionStats`, żeby podanie
   * sumy jako pierwszego się nie skompilowało: suma nie ma osi tur, więc
   * wyzerowałaby `fightTurns`, a to po cichu psuje tryb „na turę" dla
   * przyjętych i leczenia. Mina zniknęła razem z sumą (`AUDYT‑6`) — nie ma
   * czego pomylić, więc nie ma czego pilnować typem.
   */
  render(fight: BattleStats): void {
    this.latest = { fight };
    // Akcje należą do TEJ wersji panelu: co render buduje, to render rejestruje.
    // Bez czyszczenia zostałaby tu obsługa przycisków, których już nie ma —
    // choćby „na żywo” po zamknięciu podglądu.
    this.actions.clear();
    // Wczytana walka przykrywa bieżącą, ale jej nie zatrzymuje: `latest` idzie
    // dalej i po zamknięciu podglądu panel wraca do tego, co zdążyło się
    // wydarzyć w międzyczasie.
    const stats = this.preview?.stats ?? fight;
    this.fightTurns = stats.timeline.length;
    const hovered = this.hovered;

    this.shown = stats;

    // Postać mogła zniknąć — nowa walka, inny skład. Wtedy wracamy do listy
    // zamiast pokazywać pusty widok nieistniejącej postaci.
    const focused = this.focus
      ? (stats.actors.find((actor) => actor.name === this.focus) ?? null)
      : null;
    if (this.focus && !focused) {
      this.focus = null;
      this.clearDrill();
    }
    // Pozycja, której log przestał wymieniać (nowa walka, inny skład), nie ma
    // czego pokazać — wracamy o szczebel zamiast rysować pusty widok. Szukamy
    // w liście, z której faktycznie wyszedł ten szczebel: przez cel czy przez
    // umiejętność. Sprawdzanie zawsze w `dealtToBy` gubiłoby drążenie po
    // umiejętności przy pierwszym rerenderze.
    if (focused && this.focusSource !== null && this.focusKind !== null) {
      const tier = this.tierList(focused, this.focusKind);
      if (!tier.some((one) => one.label === this.focusSource)) this.clearDrill();
    }

    // Szerokość stosujemy zawsze, wysokość tylko rozwinięty i tylko gdy
    // użytkownik ją ustawił — inaczej okno rośnie z treścią jak dotąd, a zwinięte
    // pokazuje sam nagłówek bez sztywnej wysokości pod spodem.
    this.panel.className = this.state.collapsed ? "panel collapsed" : "panel";
    this.panel.style.width = `${this.state.width}px`;
    if (!this.state.collapsed && this.state.height !== null) {
      this.panel.style.height = `${this.state.height}px`;
    } else {
      // Panel jest trwały — bez zdjęcia wysokość sprzed zwinięcia albo sprzed
      // skasowania ręcznego rozmiaru zostałaby na nim na stałe.
      this.panel.style.removeProperty("height");
    }
    // Okno gry potrafi zmienić rozmiar między walkami — sufit przeliczamy przy
    // każdym renderze, nie tylko przy przesuwaniu okna.
    this.applyHeightCap();
    // Gutter paska przewijania rezerwujemy tylko wtedy, gdy korpus faktycznie
    // się przewija — patrz reguła `.panel-body.scrolls`.
    this.body.classList.toggle(
      "scrolls",
      !this.state.collapsed && this.state.height !== null,
    );

    // Tylko TREŚĆ korpusu — sam `body` jest trwały, więc pasek przewijania
    // i jego pozycja przeżywają zmianę danych zamiast mrugać przy każdej klatce.
    //
    // NIE `replaceChildren`: okruszek jest trwały i ma NIE wychodzić z drzewa
    // (patrz `buildCrumb`), a `replaceChildren` zdjęłoby go razem z resztą.
    // Zdejmujemy więc wszystko poza nim.
    for (const child of [...this.body.childNodes]) {
      if (child !== this.crumb) child.remove();
    }
    this.crumb.hidden = !focused;
    if (focused) this.updateCrumb(focused);
    this.body.append(
      ...(focused
        ? // Wewnątrz postaci nie ma po co porównywać stron ani filtrować składu
          // — jest jedna postać i jej rozbicie. Zostaje wybór metryki, bo on
          // decyduje, CO rozbijamy: zadane, otrzymane czy leczenie.
          [this.renderMetrics(), this.renderDetail(focused)]
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
    if (footer) this.body.append(footer);

    // Podsumowanie drużyny zamyka korpus — pod listą i pod stopką. Przy
    // "Wszyscy" porównuje strony, przy "My"/"Oni" podaje sumy tej jednej.
    // W widoku pojedynczej postaci nie ma czego podsumowywać.
    if (!focused) this.body.append(...(this.renderTeamSummary(stats) ?? []));

    // Nagłówek jest trwały — tylko odświeżamy jego podpisy. Paski stanu
    // budujemy od nowa, ale WKŁADAMY między nagłówek i trwały korpus, zamiast
    // składać cały panel na nowo. Sterowanie odtwarzaniem wewnątrz pasków
    // zostaje na trwałych węzłach (patrz renderReplayRow), więc kliknięcie w nie
    // przeżywa przebudowę pasków co klatkę.
    //
    // Pasek nagrywania tylko w rozwiniętym oknie — zwinięte pokazuje sam
    // nagłówek, a nagrywanie widać wtedy po kolorze kropki.
    //
    // Pasek PODGLĄDU zostaje ZAWSZE. On nie niesie liczb, tylko tożsamość
    // widoku: bez niego zwinięty panel jest nieodróżnialny od zwiniętego panelu
    // na żywo, choć pokazuje nagranie sprzed godziny — a odtwarzanie leci dalej,
    // bo zwinięcie nie zatrzymuje zegara. Razem z paskiem znikało też jedyne
    // wyjście „na żywo" i całe sterowanie, więc po rozwinięciu nagranie stało
    // w innym miejscu, niż się je zostawiło.
    this.updateHeader();
    const bars = [
      this.renderPreviewBar(),
      this.state.collapsed ? null : this.renderRecordBar(),
    ].filter((bar): bar is HTMLElement => bar !== null);
    // Zdejmujemy poprzednie paski PO zbudowaniu nowych — trwałe węzły
    // odtwarzania zdążyły się już przenieść do świeżego paska, więc ich to nie
    // dotyka. Nagłówek, `body` i uchwyt zostają na miejscu.
    for (const node of this.chromeNodes) node.remove();
    this.chromeNodes = bars;
    this.body.before(...bars);

    // Kursor stoi w miejscu, a wiersz pod nim to już inny węzeł — odtwarzamy
    // dymek sami, bo żadne zdarzenie wskaźnika się nie powtórzy.
    if (hovered) this.showTip(hovered);

    // Skończyła się walka i przybyło nagranie — otwarte archiwum ma je pokazać
    // bez zamykania i otwierania okna.
    this.archive?.sync();
  }

  /**
   * Zdejmuje panel i WSZYSTKO, co po sobie zostawił.
   *
   * Metoda istniała, ale robiła tylko `host.remove()` — zostawiała listener
   * `resize` wiszący na `window` i odliczający timeout, który po zniknięciu
   * panelu wołał `rerender()` na drzewie, którego już nie ma. Do tego nie była
   * wołana z żadnego miejsca, więc kłamała podwójnie: nie sprzątała i nikt jej
   * nie używał. Woła ją teraz `stop()` z `boot()`.
   */
  destroy(): void {
    window.removeEventListener("resize", this.onResize);
    this.stopFlash();
    this.archive?.destroy?.();
    this.host.remove();
  }

  /**
   * Profesja postaci o danej nazwie — także tej stojącej po DRUGIEJ stronie
   * ciosu. Pierwszy szczebel rozbicia wymienia właśnie takie postacie, a ich
   * profesji nie ma we własnym `ActorStats` tego, w kogo weszliśmy.
   */
  private professionOf(name: string): string | null {
    return this.shown.actors.find((actor) => actor.name === name)?.professionCode ?? null;
  }

  /** Do testów — pozwala zajrzeć w wyrenderowaną treść. */
  get shadow(): ShadowRoot {
    return this.root;
  }

  /**
   * Archiwum doczepiamy po utworzeniu overlaya, a nie w opcjach: okno archiwum
   * rysuje się w TYM shadow roocie, więc nie może powstać przed nim.
   */
  attachArchive(archive: ArchiveControl): void {
    this.archive = archive;
    this.refresh();
  }

  /** Przerysowanie na żądanie — archiwum woła je, gdy zmienia swój stan. */
  refresh(): void {
    this.rerender();
  }

  /** Pokazuje wczytaną walkę zamiast bieżącej. */
  showPreview(stats: BattleStats, view: PreviewView): void {
    // Inna walka to inny skład — drążenie w postać z poprzedniego widoku nie
    // miałoby się do czego odnieść.
    if (this.preview?.view !== view) {
      this.focus = null;
      this.clearDrill();
    }
    this.preview = { stats, view };
    this.rerender();
  }

  closePreview(): void {
    if (!this.preview) return;
    this.preview = null;
    this.focus = null;
    this.clearDrill();
    this.rerender();
  }

  isPreviewing(): boolean {
    return this.preview !== null;
  }

  /**
   * Buduje trwały nagłówek — raz na życie overlaya. Listenery czytają stan
   * w chwili kliknięcia, więc same węzły nie muszą się zmieniać; render tylko
   * odświeża ich podpisy (patrz `updateHeader`).
   */
  private buildHeader(header: HTMLElement): Overlay["headerButtons"] {
    const title = Object.assign(document.createElement("span"), {
      className: "title",
      textContent: "MargoMeter",
    });
    // Wersja stoi w nagłówku, bo zgłoszenia przychodzą ZRZUTEM EKRANU równie
    // często jak skopiowanym JSON-em — a od `0.3.0` dodatek aktualizuje się sam,
    // więc nadawca nie ma skąd wiedzieć, na czym siedzi. Osobny węzeł, nie
    // dopisek do `.title`: nazwa ma zostać nazwą dla kodu i dla testów.
    const version = Object.assign(document.createElement("span"), {
      className: "version",
      textContent: `v${VERSION}`,
    });

    /** Kopiuje statystyki tej walki — albo nagrania, jeśli stoi na ekranie. */
    const copy = document.createElement("button");
    copy.type = "button";
    copy.dataset.action = "copy-stats";
    // aria-label zamiast title: nie chcemy natywnych dymków przeglądarki.
    copy.setAttribute("aria-label", "Kopiuj statystyki (JSON)");
    copy.addEventListener("click", () => {
      void this.copy("copy-stats", this.statsJson());
    });

    const record = this.recorder ? document.createElement("button") : null;
    if (record) {
      record.type = "button";
      record.dataset.action = "record";
      record.textContent = "⏺";
      record.addEventListener("click", () => {
        this.recorder?.toggle();
        // Wyłączenie nagrywania nie może zostawić otwartego pytania o kasowanie.
        this.confirmClear.cancel();
        this.rerender();
      });
    }

    // Archiwum doczepia się PO konstruktorze (okno rysuje się w tym samym
    // shadow roocie), więc przycisk czeka gotowy i wchodzi do nagłówka dopiero
    // wtedy, gdy jest co otwierać.
    const archive = document.createElement("button");
    archive.type = "button";
    archive.dataset.action = "archive";
    archive.textContent = "▤";
    archive.addEventListener("click", () => this.archive?.toggle());

    const collapse = document.createElement("button");
    collapse.type = "button";
    collapse.dataset.action = "collapse";
    collapse.addEventListener("click", () => {
      this.state.collapsed = !this.state.collapsed;
      this.saveState();
      this.rerender();
    });

    header.append(title, version, copy, ...(record ? [record] : []), collapse);
    return { copy, record, archive, collapse };
  }

  /** Odświeża podpisy trwałego nagłówka. Węzły zostają — patrz `header`. */
  private updateHeader(): void {
    const { copy, record, archive, collapse } = this.headerButtons;

    copy.textContent = this.flash?.key === "copy-stats" ? this.flash.label : "⧉";

    if (record && this.recorder) {
      const recording = this.recorder.isRecording();
      // Kropka czerwienieje dopiero, gdy faktycznie leci zapis — bez tego
      // przycisk wyłączony i włączony różnią się samym tłem, a to za mało
      // w oknie, na które patrzy się kątem oka w trakcie walki.
      record.className = recording ? "rec is-on" : "rec";
      record.setAttribute("aria-pressed", String(recording));
      record.setAttribute("aria-label", recording ? "Zatrzymaj nagrywanie" : "Nagrywaj walki");
    }

    if (this.archive) {
      if (archive.parentNode !== this.header) collapse.before(archive);
      const open = this.archive.isOpen();
      archive.setAttribute("aria-pressed", String(open));
      archive.setAttribute("aria-label", open ? "Zamknij archiwum" : "Archiwum walk");
    }

    collapse.textContent = this.state.collapsed ? "▢" : "—";
    collapse.setAttribute("aria-label", this.state.collapsed ? "Rozwiń" : "Zwiń");
  }

  /**
   * Pasek podglądu — jedyne miejsce, po którym widać, że panel NIE mówi
   * o trwającej walce. Stąd inny kolor i wyjście na wierzchu, a nie w menu.
   */
  private renderPreviewBar(): HTMLElement | null {
    const preview = this.preview;
    if (!preview) return null;

    const bar = div("preview-bar");
    const head = div("preview-head");
    head.append(div("preview-tag", "PODGLĄD"), div("grow", preview.view.source));

    const back = document.createElement("button");
    back.type = "button";
    back.textContent = "na żywo";
    back.setAttribute("aria-label", "Wróć do bieżącej walki");
    this.bindAction(back, "exit-preview", () => preview.view.close());
    head.append(back);

    bar.append(head, div("preview-title", preview.view.title));

    const replay = preview.view.replay;
    if (replay) bar.append(this.renderReplayRow(replay));
    return bar;
  }

  /**
   * Wiersz sterowania odtwarzaniem. Zwraca TRWAŁE węzły (te same przy każdym
   * renderze) i tylko odświeża ich stan — inaczej przy odtwarzaniu, gdzie render
   * leci co klatkę, przebudowa paska rozdzielała `pointerdown` od `pointerup`
   * jednego kliknięcia na dwa różne przyciski i pauza/suwak nie reagowały.
   */
  private renderReplayRow(replay: ReplayView): HTMLElement {
    // Najświeższy opis czytają listenery w chwili kliknięcia — same przyciski
    // się nie zmieniają, zmienia się to, na co wskazują.
    this.currentReplay = replay;
    const controls = (this.replayControls ??= this.buildReplayControls());

    controls.play.textContent = replay.playing ? "⏸" : "▶";
    controls.play.setAttribute("aria-label", replay.playing ? "Zatrzymaj" : "Odtwarzaj");
    controls.fill.style.width = `${Math.round(replay.progress * 100)}%`;
    controls.label.textContent = replay.label;
    controls.speed.textContent = `${replay.speed}×`;
    return controls.row;
  }

  /** Buduje trwałe węzły sterowania odtwarzaniem — raz na życie overlaya. */
  private buildReplayControls(): NonNullable<Overlay["replayControls"]> {
    const row = div("replay");

    const play = document.createElement("button");
    play.type = "button";
    play.dataset.action = "replay-toggle";
    play.addEventListener("click", () => this.currentReplay?.toggle());

    // Pasek jest zarazem postępem i suwakiem — kliknięcie przewija w to miejsce.
    const track = div("replay-track");
    track.dataset.action = "replay-seek";
    const fill = div("replay-fill");
    track.append(fill);
    track.addEventListener("click", (event) => {
      const box = track.getBoundingClientRect();
      // jsdom nie liczy layoutu — bez szerokości nie ma czego dzielić.
      if (box.width === 0) return;
      this.currentReplay?.seek(clamp((event.clientX - box.left) / box.width, 0, 1));
    });

    const label = div("replay-label");

    const speed = document.createElement("button");
    speed.type = "button";
    speed.dataset.action = "replay-speed";
    speed.setAttribute("aria-label", "Prędkość odtwarzania");
    speed.addEventListener("click", () => this.currentReplay?.cycleSpeed());

    row.append(play, track, label, speed);
    return { row, play, track, fill, label, speed };
  }

  /**
   * Pasek stanu nagrywania — pod nagłówkiem, tylko gdy jest o czym mówić.
   *
   * Nagrania zajmują miejsce w magazynie dzielonym z grą, więc licznik walk
   * i zajętość stoją na wierzchu, a nie w jakimś ukrytym widoku: to jedyne
   * miejsce, gdzie widać, że coś rośnie.
   */
  private renderRecordBar(): HTMLElement | null {
    const recorder = this.recorder;
    if (!recorder) return null;

    const count = recorder.count();
    if (!recorder.isRecording() && count === 0 && !recorder.isFailed()) return null;

    const bar = div("rec-bar");
    if (recorder.isFailed()) {
      bar.classList.add("warn");
      bar.append(div("grow", "Brak miejsca w przeglądarce — nagrywanie wyłączone"));
    } else {
      if (recorder.isRecording()) bar.append(div("dot", "⏺"));
      const kb = Math.round((recorder.chars() * 2) / 1024);
      bar.append(
        div(
          "grow",
          count === 0
            ? // Wielką literą, bo to KOMUNIKAT, a nie akcja — i bo w tym samym
              // miejscu stoi „Brak miejsca w przeglądarce…". Jeden element,
              // dwie konwencje wyglądały jak literówka (`UX.md §1.6`).
              "Nagrywam — czekam na walkę"
            : `${count} ${fightWord(count)} · ${kb} kB`,
        ),
      );
    }

    if (count > 0) {
      const copy = document.createElement("button");
      copy.type = "button";
      copy.textContent = this.flash?.key === "copy-logs" ? this.flash.label : "kopiuj logi";
      copy.setAttribute("aria-label", "Kopiuj nagrane logi");
      this.bindAction(copy, "copy-logs", () => {
        // `dump()` zwraca null, gdy indeks obiecuje nagrania, których pod
        // kluczami już nie ma — to porażka do pokazania, nie pusty schowek.
        void this.copy("copy-logs", recorder.dump());
      });

      const clear = document.createElement("button");
      clear.type = "button";
      const asking = this.confirmClear.pending(undefined);
      clear.textContent = asking ? "na pewno?" : "wyczyść";
      // Etykieta dla czytnika idzie za stanem, tak samo jak napis — inaczej
      // przycisk mówi „Usuń nagrania" w chwili, gdy pyta o potwierdzenie.
      clear.setAttribute("aria-label", asking ? "Potwierdź usunięcie nagrań" : "Usuń nagrania");
      this.bindAction(clear, "clear-recordings", () => {
        // Nagrań nie da się odzyskać, więc pierwszy klik tylko pyta.
        if (this.confirmClear.ask(undefined)) recorder.clear();
        this.rerender();
      });

      bar.append(copy, clear);
    }

    return bar;
  }

  /**
   * Stan obu liczników w jednym JSON-ie: walka i sesja.
   *
   * Kopiujemy pełne statystyki, nie to, co akurat widać na ekranie — widok jest
   * przekrojem tych samych danych, a wklejenie „tylko zadanych, tylko mojej
   * drużyny" byłoby niespodzianką przy próbie policzenia czegokolwiek dalej.
   */
  /**
   * Statystyki do schowka — TE, KTÓRE WIDAĆ.
   *
   * Wcześniej szła zawsze walka na żywo, także gdy na ekranie stało nagranie
   * z archiwum. Decyzja była świadoma, ale nigdzie niekomunikowana: przycisk
   * wyglądał tak samo, mówił to samo, a kopiował co innego niż to, na co
   * patrzysz — i dowiadywałeś się o tym dopiero po wklejeniu.
   *
   * Stał tu obok klucz `session` z sumą wszystkich walk. Zdjęty 2026‑08‑03
   * razem z samą sumą (`AUDYT‑6`): był jej JEDYNYM wyjściem do użytkownika,
   * a `aria-label` przycisku mówił tylko „Kopiuj statystyki (JSON)", więc
   * nawet nie było wiadomo, że tam jest.
   */
  private statsJson(): string {
    const preview = this.preview;
    return JSON.stringify(
      {
        tool: "MargoMeter",
        // Wersja idzie PRZED datą, bo to ona rozstrzyga, czy zgłoszenie dotyczy
        // czegoś, co już naprawiliśmy. Data mówi tylko, kiedy skopiowano.
        version: VERSION,
        at: new Date().toISOString(),
        source: preview ? preview.view.source : "na żywo",
        fight: preview ? preview.stats : (this.latest?.fight ?? null),
      },
      null,
      2,
    );
  }

  /**
   * Kopiuje i mówi, jak poszło. `text === null` znaczy „nie ma czego kopiować".
   *
   * Pusty tekst to też porażka, nie sukces: „kopiuj logi" przy indeksie bez
   * plików wołało `dump() ?? ""` i migało „✓" nad pustym schowkiem.
   */
  private async copy(key: string, text: string | null): Promise<void> {
    let label = "✓";
    try {
      if (text === null || text === "") throw new Error("nie ma czego kopiować");
      await this.clipboard(text);
    } catch {
      // Schowek potrafi odmówić — lepiej powiedzieć wprost niż udawać sukces.
      label = "✕";
    }
    this.flash = { key, label };
    this.rerender();
    this.stopFlash();
    // Ticker jest interwałem, więc pierwszy strzał zarazem gasi odliczanie —
    // ten sam wzorzec „jednorazówki z interwału", co w `Confirm`.
    this.flashHandle = this.ticker.start(() => {
      this.stopFlash();
      if (this.flash?.key !== key) return;
      this.flash = null;
      this.rerender();
    }, FLASH_MS);
  }

  private stopFlash(): void {
    if (this.flashHandle !== null) this.ticker.stop(this.flashHandle);
    this.flashHandle = null;
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
      const divisor = metric === "damageDealt" ? turns : this.fightTurns;
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
        textContent: `${shown.length} ${actorWord(shown.length)} · ${turns} ${turnWord(turns)}`,
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
    const perSide = this.metric === "damageDealt";
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

    // Przy sumie 0 pasek zostaje PUSTY, a nie po połowie: „jeszcze nic się nie
    // wydarzyło” wyglądało wtedy jak wyrównana walka. Samo tło paska mówi tyle,
    // ile wiadomo — czyli nic.
    const track = div("sides-track");
    const fillMine = document.createElement("span");
    fillMine.className = "fill-mine";
    fillMine.style.width = `${sum > 0 ? (mine / sum) * 100 : 0}%`;
    const fillEnemy = document.createElement("span");
    fillEnemy.className = "fill-enemy";
    fillEnemy.style.width = `${sum > 0 ? (enemy / sum) * 100 : 0}%`;
    track.append(fillMine, fillEnemy);

    return [row, track];
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
        this.tabButton(`metric-${metric}`, METRIC_LABELS[metric], this.metric === metric, () => {
          this.metric = metric;
          // Drugi szczebel należy do metryki, w której się w niego weszło —
          // przy innej nie ma czego pokazać. `clearDrill`, a nie samo
          // `focusSource`: `focusKind` MUSI zginąć razem z nim. Zostawiony
          // dawał nagłówek „OD KOGO" nad listą UMIEJĘTNOŚCI, tę samą listę
          // wyrenderowaną dwa razy i pierwszy szczebel, którego nie dało się
          // kliknąć — dokładnie rozjazd, przed którym broni docstring `clearDrill`.
          this.clearDrill();
          this.rerender();
        }),
      );
    }

    // Nie jest zakładką w tym samym sensie co metryki — nie wybiera, CO liczymy,
    // tylko czy dzielimy przez tury. Stąd osobne miejsce, dosunięte do prawej.
    const perTurn = this.tabButton("per-turn", "na turę", this.perTurn, () => {
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
        this.tabButton(`team-${team}`, TEAM_LABELS[team], this.team === team, () => {
          this.team = team;
          this.rerender();
        }),
      );
    }

    return tabs;
  }

  /**
   * Drążalna tożsamość wiersza — nazwa, nie węzeł, bo panel przebudowuje wiersze
   * przy każdej klatce. `key` porównuje `pointerdown` z `pointerup`; `null` to
   * wiersz, który nigdzie nie prowadzi (rozbicie po typie, pusty obszar).
   */
  private rowIdentity(
    row: HTMLElement | null,
  ): { key: string; actor?: string; source?: string; kind?: DrillKind } | null {
    if (row?.dataset.actor) return { key: `a:${row.dataset.actor}`, actor: row.dataset.actor };
    // Przekrój po typie nigdzie nie prowadzi, a pojedyncze pozycje bywają
    // liśćmi mimo drążalnej listy — `data-leaf` stawia je `appendBreakdown`.
    if (!row?.dataset.source || row.dataset.leaf !== undefined) return null;
    // Prefiks w kluczu rozdziela listy: ta sama nazwa w obu przekrojach to dwa
    // różne wiersze, więc `pointerdown` na jednym nie może domknąć się na drugim.
    if (row.dataset.list === "sources") {
      return { key: `s:${row.dataset.source}`, source: row.dataset.source, kind: "target" };
    }
    if (row.dataset.list === "abilities") {
      return { key: `b:${row.dataset.source}`, source: row.dataset.source, kind: "ability" };
    }
    return null;
  }

  /**
   * Zdejmuje drugi szczebel drążenia.
   *
   * Jedno miejsce, bo `focusSource` i `focusKind` MUSZĄ ginąć razem — rozjazd
   * między nimi znaczy drugi szczebel renderowany z niewłaściwej listy. Zerują
   * to cztery różne ścieżki (nowa walka, zmiana metryki, podgląd, powrót)
   * i przy dwóch polach pilnowanych osobno regresja jest kwestią czasu.
   */
  private clearDrill(): void {
    this.focusSource = null;
    this.focusKind = null;
  }

  /** Wchodzi w to, co niesie tożsamość wiersza. Zwraca, czy było w co wejść. */
  private drill(target: ReturnType<Overlay["rowIdentity"]>): boolean {
    if (target?.actor !== undefined) {
      this.enter(target.actor);
      return true;
    }
    if (target?.source !== undefined && target.kind !== undefined) {
      // Oba wejścia w drugi szczebel: przez cel („czym w niego”) i przez
      // umiejętność („komu nią”). Ta sama mechanika, przeciwne strony ciosu.
      return this.enterSource(target.source, target.kind);
    }
    return false;
  }

  /** Wejście w postać lewym przyciskiem. */
  private enter(name: string): void {
    this.focus = name;
    this.clearDrill();
    // Dymek opisuje wiersz, którego już nie ma na ekranie.
    this.hideTip();
    this.rerender();
  }

  /**
   * Wejście w drugi szczebel. Zadane i przyjęte drążą się dwiema drogami:
   * przez postać po drugiej stronie ciosu (cel / napastnik) i przez samą
   * umiejętność. Leczenie ma jeden poziom i tu nie wchodzi.
   *
   * Zwraca, czy faktycznie weszliśmy — inaczej `drill` meldowałby obsłużenie
   * kliknięcia, które nic nie zrobiło, i połykałby je bez śladu.
   */
  private enterSource(label: string, kind: DrillKind): boolean {
    if (!this.canDrillSources()) return false;
    this.focusSource = label;
    this.focusKind = kind;
    this.hideTip();
    this.rerender();
    return true;
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
  /**
   * Czy jest z czego wracać. Osobno od `back()`, bo prawy przycisk musi to
   * wiedzieć ZANIM zdecyduje, czy odbierać menu przeglądarki.
   */
  private canGoBack(): boolean {
    return this.focusSource !== null || this.focus !== null;
  }

  private back(): void {
    // Zdejmujemy JEDEN szczebel, nie cały stos: z umiejętności napastnika
    // wraca się do listy napastników, a dopiero stamtąd do składu.
    if (this.focusSource !== null) this.clearDrill();
    else if (this.focus !== null) this.focus = null;
    else return;
    this.hideTip();
    this.rerender();
  }

  /**
   * Ścieżka powrotu nad rozbiciem — TRWAŁY węzeł, budowany raz na życie panelu.
   *
   * Prawy przycisk robi to samo, ale nie widać go na ekranie — bez tej linijki
   * nie da się zgadnąć, jak się cofnąć.
   *
   * Trwały, bo panel przerysowuje się przy KAŻDEJ linii logu, a `.crumb-back`
   * ma regułę `:hover`. Świeży węzeł nie jest pod kursorem, dopóki mysz się nie
   * ruszy — więc w środku walki podświetlenie gasło i wracało kilka razy na
   * sekundę, dokładnie na elemencie, który ma dawać znać, że kontekst się
   * trzyma (`UX §4.1`, `UX-POPRAWKI B4`). Ten sam chwyt, co przy `A1`
   * z nagłówkiem: węzeł zostaje, render odświeża same podpisy.
   *
   * Listener jest tu BEZPOŚREDNI, nie przez `bindAction`: mapa `actions` czyści
   * się na każdym renderze, bo opisuje węzły budowane od nowa. `data-action`
   * zostaje — po nim ten przycisk rozpoznają testy i `actionUnder` — ale nie
   * ma odpowiednika w mapie, więc delegacja go nie odpali drugi raz.
   */
  private buildCrumb(): HTMLElement {
    const crumb = div("crumb");
    // Prawdziwy `<button>`, nie `div`: to element AKCJI, a nie tekst. Niezależnie
    // od polityki klawiatury element, w który się klika, ma się tak nazywać —
    // dopiero wtedy czytnik ekranu mówi o nim jak o przycisku, a Tab może się na
    // nim zatrzymać widocznie.
    this.crumbBack.type = "button";
    this.crumbBack.className = "crumb-back";
    this.crumbBack.dataset.action = "crumb-back";
    this.crumbBack.setAttribute("aria-label", "Wróć o szczebel");
    this.crumbBack.addEventListener("click", () => this.back());
    crumb.append(this.crumbBack, this.crumbName);
    return crumb;
  }

  /** Odświeża podpisy trwałego okruszka. Węzły zostają — patrz `buildCrumb`. */
  private updateCrumb(actor: ActorStats): void {
    // Etykieta mówi, DOKĄD się wraca, a nie „wstecz” — przy dwóch szczeblach
    // sam strzałek nie wystarczy, żeby wiedzieć, gdzie się wyląduje.
    this.crumbBack.textContent = this.focusSource === null ? "‹ skład" : `‹ ${actor.name}`;
    const here = this.focusSource ?? actor.name;
    /**
     * Okruszek niesie odznakę, bo to on nazywa postać, w której się stoi —
     * na pierwszym szczeblu `actor.name`, na drugim `focusSource`.
     *
     * To tutaj, a NIE w nagłówku sekcji, i jest to wybór, nie przeoczenie:
     * na drugim szczeblu nagłówek brzmi `CZYM — CYGAŃSKI BIDOK`, czyli powtarza
     * tę samą nazwę dwie linijki niżej. Druga odznaka na to samo nie dokłada
     * informacji, tylko powtarza — a przy nazwie umiejętności
     * (`KOMU — SYMFONIA ŻYWIOŁÓW`) byłaby wręcz myląca.
     */
    this.crumbName.textContent = here;
    /**
     * Odznaka profesji jest ATRYBUTEM (`data-prof`) plus dwiema własnymi
     * własnościami CSS, a nie węzłem potomnym — więc podmiana tekstu jej NIE
     * zdejmuje. Na węźle budowanym od nowa nie było czego czyścić; na trwałym
     * jest, i to jest cała cena tej trwałości.
     *
     * Bez tych trzech linijek odznaka zostawałaby po poprzednim szczeblu:
     * wchodząc w postać, a potem w jej umiejętność, okruszek pokazywałby
     * `SYMFONIA ŻYWIOŁÓW` z literą profesji tancerza. Czyścimy ZAWSZE, nie
     * tylko gdy nowa nazwa nie jest postacią — inaczej ta sama pomyłka wraca
     * przy przejściu z jednej postaci na drugą.
     */
    delete this.crumbName.dataset.prof;
    this.crumbName.style.removeProperty("--prof-bg");
    this.crumbName.style.removeProperty("--prof-ink");
    this.markIfCharacter(this.crumbName, here);
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
    // Na drugim szczeblu żyje tylko ta lista, z której w niego weszliśmy —
    // druga zwraca pustkę i schodzi z ekranu razem z pierwszym szczeblem.
    const byTarget = this.breakdownList(actor, "sources");
    const byAbility = this.breakdownList(actor, "abilities");
    const types = this.breakdownList(actor, "types");
    const sources = this.focusKind === "ability" ? byAbility : byTarget;

    const total = actorValue(actor, this.metric);
    /**
     * Suma dla listy GŁÓWNEJ. Na pierwszym szczeblu to całość postaci — wiersze
     * wymieniają wszystkie jej cele, więc jedno i drugie znaczy to samo.
     *
     * Na drugim szczeblu już nie: sekcja mówi o JEDNEJ parze, a `total` mówił
     * dalej o całej postaci. Nagłówek `CZYM — DIETA-MIÓD` niósł przez to
     * 403 206, choć wiersze pod nim sumowały się do 104 005, a udziały do 26 %
     * zamiast 100 %. Liczba przy etykiecie ma mówić o tym, co etykieta nazywa.
     */
    const listTotal =
      this.focusSource === null
        ? total
        : sources.reduce((sum, source) => sum + source.amount, 0);
    // Nagłówek nazywa to, co WYMIENIA lista, i zależy od drogi, którą się tu
    // weszło. Przez cel: „KOMU” → „CZYM — <CEL>”. Przez umiejętność: lustro
    // tego samego, „CZYM (ŁĄCZNIE)” → „KOMU — <UMIEJĘTNOŚĆ>”. Leczenie nie
    // drąży dalej — log nie nazywa leczącego, więc źródłem jest sam efekt
    // (Regeneracja / aura / samoratunek), a nie postać.
    const secondTier =
      this.focusKind === "ability"
        ? `${dealt ? "KOMU" : "OD KOGO"} — ${this.focusSource?.toUpperCase()}`
        : `CZYM — ${this.focusSource?.toUpperCase()}`;
    const heading =
      this.metric === "healingReceived"
        ? "OD CZEGO"
        : this.focusSource !== null
          ? secondTier
          : dealt
            ? "KOMU"
            : "OD KOGO";

    if (sources.length === 0) {
      // Liczniki zostają: `ciosy · kryt. · uniki · maks. cios · tury · utracone`
      // są prawdziwe niezależnie od metryki, a wcześniej znikały razem z listą.
      // Postać, która tylko obrywała, pokazywała pod „Zadane" jedno zdanie
      // i pustkę — mimo że dane o niej były.
      container.append(div("empty", EMPTY_BREAKDOWN[this.metric]), this.counters(actor));
      return container;
    }

    /**
     * Barwa wiersza rozbicia zależy od tego, CO wymienia dany szczebel.
     *
     * Pierwszy szczebel zadanych/przyjętych to POSTACIE (cel albo napastnik) —
     * tam barwa idzie za profesją, tak samo jak na liście składu, więc ten sam
     * przeciwnik ma ten sam kolor w obu widokach. Głębiej etykietą jest już
     * akcja i wtedy barwę niesie rodzaj obrażeń — zwykły cios i tykająca
     * trucizna przestają wyglądać identycznie. Leczenia to nie dotyczy: jego
     * źródłem jest efekt, nie postać, więc zostaje neutralne.
     */
    const typeOf = new Map(actor.typeByLabel.map((entry) => [entry.label, entry.type]));
    const paint = (charactersInList: boolean) => (label: string) =>
      charactersInList
        ? professionColor(this.professionOf(label))
        : typeColor(typeOf.get(label) ?? label);
    // Barwa idzie za TREŚCIĄ listy, nie za jej głębokością. Droga przez
    // umiejętność odwraca kolejność szczebli — najpierw akcje, potem postacie —
    // więc warunek liczony z samego `focusSource` malowałby ją na odwrót.
    const listsCharacters =
      this.metric !== "healingReceived" &&
      (this.focusSource === null || this.focusKind === "ability");
    const colorFor = paint(listsCharacters);
    /**
     * Odznaka z literą profesji — z TEGO SAMEGO predykatu co barwa.
     *
     * To nie jest oszczędność na pisaniu, tylko warunek spójności: gdyby
     * o odznace decydował osobny warunek, dałoby się dojść do wiersza z barwą
     * jednej profesji i literą drugiej. Jeden predykat nie ma jak się rozjechać
     * sam ze sobą.
     *
     * PO CO odznaka jest tu w ogóle. `palette.ts` mówi wprost: sześciu barw
     * profesji nie da się zrobić wzajemnie rozłącznymi na tym tle (sufit to
     * cztery), więc „rozróżnialność zapewnia odznaka z literą profesji, nie
     * barwa". Ranking składu miał ją od `AUDYT-14`; rozbicie wymienia TE SAME
     * postacie, z tymi samymi powtarzającymi się barwami, i do 2026-08-02 nie
     * miało jej wcale. Gwarancja obowiązywała więc na jednym szczeblu z trzech.
     */
    const professionFor = listsCharacters
      ? (label: string) => this.professionOf(label)
      : () => null;

    const divisor = turnsFor(actor, this.metric, this.fightTurns);
    const uses = new Map(actor.abilityUses.map((use) => [use.label, use.count]));

    // Po stronie zadanych wiedzie liczba UŻYĆ, a ciosy dochodzą tylko przy
    // rozjeździe — patrz `sourceTipContent`. Poza zadanymi użyć nie ma, więc
    // zostaje sam licznik ciosów (albo tyknięć trucizny).
    const timesDealt = (source: ActorStats["dealtBy"][number]): string | null => {
      // Użycia liczy się dla całej walki (linia "X wykonuje Y" nie dzieli się na
      // cele), więc na szczeblu celów — gdzie etykieta to nazwa postaci — nie
      // pada żadne dopasowanie i zostaje sam licznik ciosów. Po zejściu w cel
      // etykiety to znów umiejętności i użycie (wartość ogólna) wraca.
      const used = dealt ? uses.get(source.label) : undefined;
      // Zero ciosów przy niezerowej kwocie nie jest pomiarem, tylko innym
      // kształtem akcji (patrz `times`) — a „×0" obok 27 945 obrażeń czyta się
      // jak usterka. Brak licznika znaczy tu dokładnie to, co powinien: w tej
      // pozycji ta liczba nie ma nic do powiedzenia.
      if (used === undefined) return source.hits > 0 ? `×${source.hits}` : null;
      return times(used, source.hits);
    };

    const mainList: BreakdownList = this.focusKind === "ability" ? "abilities" : "sources";
    // Ta sama reguła co w sekcji niżej: wiersz, pod którym stoi on sam, nie ma
    // dokąd prowadzić. Wcześniej pilnowała jej wyłącznie sekcja `CZYM (ŁĄCZNIE)`,
    // więc lista główna przepuszczała klik w ślepy zaułek — a `UX.md §6` mówi
    // o KAŻDYM liściu, nie o jednej sekcji.
    //
    // Zbiór liczony tylko na PIERWSZYM szczeblu: niżej każdy wiersz jest liściem
    // z definicji, więc odwracanie rozbicia byłoby pracą, której nikt nie czyta.
    const deeperInMain =
      this.focusSource === null
        ? new Set(this.tierList(actor, "target").filter(leadsDeeper).map((entry) => entry.label))
        : null;
    this.appendBreakdown(
      container,
      heading,
      mainList,
      sources,
      listTotal,
      divisor,
      colorFor,
      professionFor,
      timesDealt,
      deeperInMain === null
        ? () => false
        : (source) => deeperInMain.has(source.label),
    );

    // Drugie wejście w to samo drążenie, od strony umiejętności: „która akcja
    // robi robotę”, bez względu na to, w kogo poszła. Ta sama suma co wyżej,
    // inny podział — jak TYP OBRAŻEŃ niżej, tylko z klikalnymi wierszami, bo
    // stąd schodzi się w cele.
    //
    // Przy jednej pozycji sekcja jest powtórzeniem sumy stojącej wyżej, a na
    // drugim szczeblu nie ma czego oferować — jesteśmy już w środku drążenia.
    if (this.focusSource === null && this.metric !== "healingReceived" && byAbility.length > 1) {
      // Trucizna bez sprawcy stoi na obu szczeblach pod tą samą nazwą, więc
      // wejście w nią pokazałoby wiersz powtarzający sam siebie. Zbiór liczony
      // RAZ — pytanie per wiersz odwracałoby rozbicie na nowo dla każdego.
      const deeper = new Set(
        this.tierList(actor, "ability").filter(leadsDeeper).map((entry) => entry.label),
      );
      this.appendBreakdown(
        container,
        "CZYM (ŁĄCZNIE)",
        "abilities",
        byAbility,
        total,
        divisor,
        paint(false),
        // Etykietą jest tu UMIEJĘTNOŚĆ, nie postać — odznaki nie ma czego nieść.
        () => null,
        timesDealt,
        (source) => deeper.has(source.label),
      );
    }

    // Drugi przekrój tych samych obrażeń — żywioł, trucizna, głęboka rana.
    // Suma jest ta sama, więc to nie są dodatkowe obrażenia, tylko inny podział.
    // Przy jednym typie podział nie istnieje: "bez żywiołu 100%" to nie jest
    // informacja, tylko powtórzenie sumy stojącej wyżej.
    if (types.length > 1) {
      // Bez licznika: jeden cios niesie kilka żywiołów, więc pozycje sumowałyby
      // się do wielokrotności ciosów postaci.
      // Tu etykieta JEST rodzajem obrażeń, więc barwę bierze wprost z siebie.
      //
      // `() => false` jest tu konieczne, nie ozdobne: przekrój po typie nigdzie
      // nie prowadzi (`rowIdentity` zwraca dla niego `null`), a bez tego wiersze
      // nie dostają `data-leaf` i reguła kursora maluje im łapkę nad kliknięciem,
      // które przepada. Obietnica kursora ma się zgadzać z tym, co robi klik.
      this.appendBreakdown(
        container,
        "TYP OBRAŻEŃ",
        "types",
        types,
        total,
        divisor,
        typeColor,
        // Etykietą jest RODZINA OBRAŻEŃ — tym bardziej nie postać.
        () => null,
        () => null,
        () => false,
      );
    }

    container.append(this.counters(actor));

    return container;
  }

  /** Stopka widoku postaci — te same liczby niezależnie od wybranej metryki. */
  private counters(actor: ActorStats): HTMLElement {
    return div(
      "note",
      [
        `ciosy ${actor.hits}`,
        critLabel(actor),
        dodgeLabel(actor),
        `maks. cios ${number.format(actor.maxHit)}`,
        `tury ${actor.turns}`,
        `utracone ${actor.turnsLost}`,
      ].join(" · "),
    );
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
    if (list === "types") {
      return this.metric === "damageDealt" ? actor.dealtByType : actor.takenByType;
    }
    // Drugi szczebel należy do TEJ listy, z której wyszedł. Po wejściu w cel
    // widać umiejętności użyte na nim, po wejściu w umiejętność — cele, które
    // nią oberwały. Druga lista schodzi wtedy z ekranu, więc pytana o drugi
    // szczebel nie ma nic do powiedzenia.
    const kind: DrillKind = list === "abilities" ? "ability" : "target";
    const tier = this.tierList(actor, kind);
    if (this.focusSource === null) {
      return tier.map(({ label, amount, hits }) => ({ label, amount, hits }));
    }
    if (this.focusKind !== kind) return [];
    return tier.find((one) => one.label === this.focusSource)?.by ?? [];
  }

  /**
   * Pierwszy szczebel drążenia w wybranym kierunku — niezależnie od tego, czy
   * już w coś weszliśmy.
   *
   * Osobno od `breakdownList`, bo `render()` musi sprawdzić, czy wybrana
   * pozycja NADAL istnieje, a `breakdownList` odpowiada wtedy już drugim
   * szczeblem. Odwracamy `dealtToBy`, a nie czytamy gotowego `dealtBy`, żeby
   * oba szczeble szły z jednego źródła — inaczej dałoby się kliknąć w wiersz,
   * pod którym nic nie ma.
   */
  private tierList(actor: ActorStats, kind: DrillKind): AttackerBreakdown[] {
    const twoTier = this.metric === "damageDealt" ? actor.dealtToBy : actor.takenFromBy;
    return kind === "ability" ? invertBreakdown(twoTier) : twoTier;
  }

  /**
   * Jedna lista rozbicia: nagłówek i paski w skali TEJ SEKCJI.
   *
   * Stało tu „w tej samej skali co reszta widoku" i było to nieprawdą —
   * `max` liczy się niżej z `sources`, czyli osobno dla każdej listy. Nieprawdą
   * było zdanie, nie kod: każda sekcja jest własnym rankingiem („która
   * umiejętność robi robotę"), a `TYP OBRAŻEŃ` i `CZYM (ŁĄCZNIE)` sumują się do
   * tej samej kwoty co lista główna — przy wspólnej skali ich najdłuższy pasek
   * i tak byłby pełny, a krótkie zrobiłyby się nieczytelne. Sprawdzone
   * i rozstrzygnięte 2026‑08‑02 na rzecz kodu.
   */
  private appendBreakdown(
    container: HTMLElement,
    heading: string,
    list: BreakdownList,
    sources: ActorStats["dealtBy"],
    total: number,
    turns: number,
    /** Barwa paska dla danej etykiety — decyzja stoi u wołającego, patrz `renderDetail`. */
    colorFor: (label: string) => string,
    /**
     * Kod profesji dla danej etykiety albo `null`, gdy etykieta nie jest
     * postacią. Stoi PARĄ z `colorFor` i u tego samego wołającego, bo obie
     * odpowiadają na to samo pytanie — „czy ta lista wymienia postacie".
     */
    professionFor: (label: string) => string | null,
    counter: (source: ActorStats["dealtBy"][number]) => string | null,
    /**
     * Czy w TĘ pozycję da się wejść. Domyślnie decyduje sama lista, ale
     * pojedynczy wiersz bywa liściem mimo drążalnej sekcji — wtedy nie może
     * kusić kliknięciem (`UX.md §6`).
     */
    drillable?: (source: ActorStats["dealtBy"][number]) => boolean,
  ): void {
    // Tryb „na turę” obowiązuje też tutaj: dzielimy przez tury TEJ postaci, bo
    // rozbicie dotyczy jej jednej. Udziały zostają na surowych liczbach —
    // wspólny dzielnik i tak by się skrócił.
    const perTurn = (amount: number) => (this.perTurn && turns > 0 ? amount / turns : amount);

    const head = div("side-head");
    // Klasa na nazwie, żeby to ONA ustępowała przy długim nicku, a nie suma.
    head.append(div("who", heading), div("sum", this.format(perTurn(total))));
    container.append(head);

    const max = Math.max(...sources.map((source) => source.amount));

    for (const source of sources) {
      const row = div("row");
      // Tożsamość wiersza dla dymka. Etykieta i lista razem, bo ta sama nazwa
      // ("Trucizna") potrafi stać w obu przekrojach naraz.
      row.dataset.source = source.label;
      row.dataset.list = list;
      // Znacznik zostaje przy wierszu, a nie przy liście, bo dymek dalej ma
      // działać — nieklikalne jest wejście, nie podgląd.
      if (drillable && !drillable(source)) row.dataset.leaf = "";
      if (source.label === UNATTRIBUTED_SOURCE) row.dataset.unattributed = "";

      const bar = barFill(colorFor(source.label), max > 0 ? (source.amount / max) * 100 : 0);

      const value = document.createElement("span");
      value.className = "value";
      const share = total > 0 ? Math.round((source.amount / total) * 100) : 0;
      value.append(
        // "/t" jak na liście składu — ta sama liczba ma znaczyć to samo w obu widokach.
        document.createTextNode(
          this.format(perTurn(source.amount)) + (this.perTurn ? "/t " : " "),
        ),
        Object.assign(document.createElement("span"), {
          className: "share",
          textContent: `(${share}%)`,
        }),
      );

      const text = div("row-text");
      const label = div("label", source.label);
      // Odznaka wchodzi W ŚRODEK etykiety, przez `::before` — nie jako czwarta
      // komórka i nie jako osobny węzeł. Oba warianty były już tu próbowane
      // przy `AUDYT-14` i oba się nie udały: komórka kładzie test „wiersz to
      // ranking, nie tabela", a węzeł wchodzi do `textContent` i nazwa zaczyna
      // brzmieć „HŁowca głów z psk".
      const profession = professionFor(source.label);
      if (profession) this.markProfession(label, profession);
      text.append(label, value);
      // Ile razy. Co dokładnie jest liczone, rozstrzyga `counter` — zależy to
      // od przekroju, więc decyzja stoi u wołającego, nie tutaj. `null` znaczy
      // "w tej sekcji taka liczba nie ma sensu" i wtedy nie ma po niej śladu.
      const howMany = counter(source);
      if (howMany !== null) {
        text.append(
          Object.assign(document.createElement("span"), {
            className: "avg",
            textContent: howMany,
          }),
        );
      }
      row.append(...bar, text);
      container.append(row);
    }
  }

  private tabButton(
    action: string,
    label: string,
    pressed: boolean,
    onClick: () => void,
  ): HTMLElement {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.setAttribute("aria-pressed", String(pressed));
    return this.bindAction(button, action, onClick);
  }

  /**
   * Wiąże akcję z węzłem przebudowywanym przy renderze.
   *
   * Zamiast listenera NA WĘŹLE (ten ginie razem z nim w środku gestu) zapisuje
   * `data-action` i wpis w `actions` — obsługę robi delegacja z konstruktora.
   */
  private bindAction(element: HTMLElement, action: string, run: () => void): HTMLElement {
    element.dataset.action = action;
    this.actions.set(action, run);
    return element;
  }

  private renderRows(stats: BattleStats): HTMLElement {
    const container = document.createElement("div");
    container.className = "rows";

    const ranked = [...stats.actors]
      .filter((actor) => matchesTeam(actor.side, this.team))
      // Skład ze składu walki pokazujemy od pierwszej tury, choćby na zerach —
      // brak wiersza czyta się jak "nie ma takiej postaci", a nie "jeszcze nic
      // nie zrobiła". Postać spoza składu to inna sprawa: ona pojawia się
      // dopiero, gdy log ją wymieni, więc zerowej nie ma po co trzymać
      // w rankingu wybranej metryki.
      //
      // Pyta o `inRoster`, nie o `side !== null`: przy tej samej nazwie po obu
      // stronach uczestnik składu NIE MA strony, a pusty wiersz i tak mu się
      // należy — jego istnienie jest faktem, nieznana jest tylko przynależność.
      .filter((actor) => actor.inRoster || this.value(actor) > 0)
      .sort((a, b) => this.value(b) - this.value(a) || a.name.localeCompare(b.name, "pl"));

    if (ranked.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = EMPTY_TEAM[this.team];
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
    // Udział liczymy ZAWSZE od surowych sum, także w trybie „na turę”.
    // Mianownikiem była tam Σ(temp) — wielkość bez sensu fizycznego, której
    // panel nigdzie nie pokazuje, bo każda postać dzieli się przez własne tury.
    // Postać z 10% realnych obrażeń dostawała w nawiasie WIĘCEJ niż ta z 21%.
    // `totalsRows`/`sidesRows` świadomie tego unikają; ranking teraz też.
    const total = ranked.reduce((sum, actor) => sum + actorValue(actor, this.metric), 0);

    for (const [index, actor] of ranked.entries()) {
      const value = this.value(actor);
      const raw = actorValue(actor, this.metric);
      // Pasek niesie PROFESJĘ, jak w SKADZIE. Dwie postacie tej samej klasy
      // dostają tę samą barwę — od odróżniania ich jest nazwa i numer w
      // rankingu, a od powiedzenia „kto tu jest czym" właśnie kolor.
      const color = professionColor(actor.professionCode);
      const ambiguous = stats.ambiguousNames.includes(actor.name);

      const row = div("row");
      // Zdarzenia obsługuje delegacja na shadow root, więc wiersz musi nieść
      // swoją tożsamość — po rerenderze to inny węzeł, ale ta sama postać.
      row.dataset.actor = actor.name;

      const bar = barFill(color, max > 0 ? (value / max) * 100 : 0);

      const rank = document.createElement("span");
      rank.className = "rank";
      rank.textContent = `${index + 1}.`;

      const label = document.createElement("span");
      label.className = "label";
      // Odznaka profesji — kanał NIEBARWNY, na którym stoi cały argument
      // o rozróżnialności z `palette.ts`. Sześciu barw nie da się na tym tle
      // zrobić wzajemnie rozłącznymi (sufit to cztery), więc przy daltonizmie
      // to litera, a nie kolor, odpowiada na pytanie „kto tu jest czym".
      // Dokument twierdził, że problem jest rozwiązany, a odznaki nie było.
      //
      // Siedzi WEWNĄTRZ `.label`, a nie obok — i to nie jest szczegół
      // implementacyjny, tylko warunek zgodności z zakazem „nie robić
      // z rankingu tabeli" (`UX.md §6`). Czwarta komórka rodzeństwa wyrównałaby
      // się w pionie i wiersz zacząłby się czytać jak tabela; wewnątrz nazwy
      // odznaka jest jej znacznikiem i płynie razem z nią. Stoi pierwsza, więc
      // przy długim nicku wielokropek zjada koniec nazwy, a nie ją.
      //
      // Rysowana przez `::before` z `attr()`, a nie osobnym węzłem, bo inaczej
      // litera wchodzi do `textContent` wiersza i każde pytanie „jak nazywa się
      // ta postać" — w kodzie i w testach — zaczyna zwracać „HŁowca głów z psk".
      // Nazwa ma zostać nazwą; odznaka jest warstwą NAD nią.
      if (actor.professionCode) this.markProfession(label, actor.professionCode);
      // Gwiazdka: pod tą nazwą kryje się w walce więcej niż jedna postać.
      label.textContent = ambiguous ? `${actor.name} *` : actor.name;

      // Wiersz to numer, nazwa i JEDNA liczba wiodąca — reszta wchodzi do
      // nawiasu tuż przy niej. Kolumny są tu świadomie tylko trzy: przy
      // czwartej pasek zaczyna się czytać jak wiersz tabeli, a to ma być
      // ranking.
      //
      // W nawiasie stoi udział, a za nim TA DRUGA miara: przy sumach tempo,
      // przy tempie suma. Obie mówią prawdę, ale inną — kto stracił tury, ma
      // niską sumę mimo mocnych ciosów. Przełącznik decyduje tylko, która
      // rządzi rankingiem, a nie która jest jedyną widoczną.
      const value$ = document.createElement("span");
      value$.className = "value";
      const share = total > 0 ? Math.round((raw / total) * 100) : 0;
      const second = this.perTurn
        ? compact(raw, false)
        : `${compact(actorValue(actor, this.metric, true, this.fightTurns), true)}/t`;
      value$.append(
        // Przy tempie "/t" wraca do liczby: nagłówka, który mógłby to powiedzieć
        // raz na listę, nie ma i mieć nie będzie.
        document.createTextNode(compact(value, this.perTurn) + (this.perTurn ? "/t " : " ")),
        Object.assign(document.createElement("span"), {
          className: "share",
          textContent: `(${share}% · ${second})`,
        }),
      );

      const text = div("row-text");
      text.append(rank, label, value$);
      row.append(...bar, text);
      container.append(row);
    }
  }

  /**
   * Dokleja do etykiety odznakę z literą profesji.
   *
   * Litera wielka, bo w logu kod jest małą i przy nazwie ginęła. Barwy jadą
   * zmiennymi CSS, bo samą treść rysuje `::before` — a do pseudoelementu nie
   * da się sięgnąć stylem inline.
   *
   * Nierozpoznanej litery nie tłumaczymy na nazwę: log potrafi dodać profesję,
   * której jeszcze nie znamy, a zgadywanie byłoby zmyślaniem. Sama litera i tak
   * jest prawdziwa, więc odznakę dostaje — z barwą „Inni".
   */
  private markProfession(label: HTMLElement, code: string): void {
    label.dataset.prof = code.toUpperCase();
    label.style.setProperty("--prof-bg", professionColor(code));
    label.style.setProperty("--prof-ink", professionInk(code));
  }

  /**
   * Odznaka dla węzła niosącego SAMĄ nazwę — okruszek i tytuły dymków.
   *
   * Różnica wobec `markProfession` jest jedna, ale zasadnicza: tam wołający już
   * WIE, że ma postać i zna jej kod. Tutaj wiadomo tylko, co jest napisane,
   * a o tym, czy to postać, rozstrzyga `professionOf`. Dzięki temu ten sam
   * węzeł obsługuje nazwę postaci i nazwę umiejętności — tytuł dymka nad
   * wierszem `OD KOGO` niesie postać, a nad wierszem `CZYM (ŁĄCZNIE)`
   * umiejętność, i żaden warunek po stronie wołającego nie musi ich rozróżniać.
   *
   * Pozycje spoza składu („Bez sprawcy", „Trucizna") zostają gołe same z siebie:
   * `professionOf` ich nie zna, więc zwraca `null`.
   */
  private markIfCharacter(node: HTMLElement, name: string): void {
    const code = this.professionOf(name);
    if (code) this.markProfession(node, code);
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

    // Wiersz nosi samą literę, bo przy 260 px na nazwę profesji nie ma miejsca.
    // Tu jest miejsce, więc stoi pełna — a nierozpoznanej litery nie tłumaczymy
    // na siłę: gra może dodać profesję, której `PROFESSIONS` jeszcze nie zna.
    if (actor.professionCode !== null) {
      section.append(
        tipStat(
          "Profesja",
          PROFESSIONS[actor.professionCode as keyof typeof PROFESSIONS] ?? actor.professionCode,
        ),
      );
    }

    for (const metric of METRICS) {
      // Własne klasy, nie `tip-label`/`tip-value` z rozbicia: to inne dane
      // i zapytania o rozbicie nie mają ich łapać.
      section.append(
        tipStat(
          METRIC_LABELS[metric],
          this.tipValue(actor, metric),
          metric === this.metric ? "is-active" : "",
        ),
      );
    }

    // Trzy liczby wyżej dzielą się przez RÓŻNE dzielniki, a wszystkie noszą to
    // samo „/t" — bez tego zdania nie da się zgadnąć, czym się różnią.
    if (this.perTurn) {
      section.append(
        div("tip-note", "„/t”: zadane na turę własną · otrzymane i leczenie na turę walki"),
      );
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
    section.append(tipStat(TURNS_LABEL, `${actor.turns}`));
    // Udział mówi więcej niż sama liczba: 3 utracone z 4 to inna walka niż
    // 3 z 30. `turns` zawiera tury utracone, więc jest właściwym mianownikiem.
    section.append(
      tipStat(
        "Tury utracone",
        actor.turns > 0
          ? `${actor.turnsLost} (${Math.round((actor.turnsLost / actor.turns) * 100)}%)`
          : `${actor.turnsLost}`,
      ),
    );

    // Liczniki, które nie mają własnej zakładki, a mówią o jakości gry.
    const counters = [
      `ciosy ${actor.hits}`,
      critLabel(actor),
      dodgeLabel(actor),
      `maks. cios ${number.format(actor.maxHit)}`,
      absorbedLabel(actor),
    ];
    // Osłabienie trucizn dochodzi TYLKO gdy jest — u postaci, która nie nosi
    // takiego efektu, zero mówiłoby o niej mniej niż nic. Reszta liczników
    // stoi zawsze, bo zero ciosów albo zero krytów jest informacją.
    if (actor.damageWeakened > 0) {
      counters.push(`osłabione ${number.format(actor.damageWeakened)}`);
    }
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
      section.append(tipStat(use.label, times(use.count, hits)));
    }
    return section;
  }

  private effectsSection(heading: string, procs: ActorStats["procs"]): HTMLElement | null {
    if (procs.length === 0) return null;

    const section = div("tip-section");
    section.append(div("tip-heading", heading));
    for (const proc of procs) section.append(tipStat(proc.label, `×${proc.count}`));
    return section;
  }

  /**
   * TOP‑3 źródła aktywnej metryki — podgląd BEZ wchodzenia w postać (`UX §4.2`).
   *
   * Pytanie „co go tak boli?" zadaje się w biegu i dotąd wymagało kliknięcia
   * w postać, przeczytania i kliknięcia z powrotem. Dane były policzone od
   * zawsze; brakowało ich tutaj.
   *
   * Trzy, nie pięć i nie wszystkie: dymek ma zostać SKRÓTEM. Pełna lista jest
   * o jedno kliknięcie stąd i to ona odpowiada na „a reszta?". Przy czterech
   * sekcjach dymka i 260 px szerokości każdy kolejny wiersz odbiera miejsce
   * czemuś, co już tam jest.
   *
   * Nagłówek jest ten sam, co nad listą po wejściu w postać (`KOMU` / `OD KOGO`
   * / `OD CZEGO`) — dymek zapowiada dokładnie ten widok, do którego prowadzi.
   *
   * Liczby idą przez `this.format`, więc w trybie „na turę" pokazują tempo tak
   * samo jak wiersz pod kursorem. Udział liczy się natomiast ZAWSZE z sum
   * surowych — to samo rozstrzygnięcie, co przy `A2`: procent ma nie zmieniać
   * się z trybem, bo opisuje strukturę obrażeń, nie tempo.
   */
  private topSourcesSection(actor: ActorStats): HTMLElement | null {
    // Zawsze PIERWSZY szczebel, nie `breakdownList`: ten drugi po wejściu
    // w pozycję oddaje już szczebel niższy. Dymek postaci pokazuje się tylko
    // na liście składu, ale niech nie zależy od tego, gdzie akurat stoimy.
    const sources =
      this.metric === "healingReceived"
        ? actor.healedBy
        : this.tierList(actor, "target");
    if (sources.length === 0) return null;

    const heading =
      this.metric === "healingReceived" ? "OD CZEGO" : this.metric === "damageDealt" ? "KOMU" : "OD KOGO";
    const total = actorValue(actor, this.metric);
    const divisor = turnsFor(actor, this.metric, this.fightTurns);

    const section = div("tip-section");
    section.append(div("tip-heading", heading));
    for (const source of sources.slice(0, TOP_SOURCES)) {
      const shown = this.perTurn && divisor > 0 ? source.amount / divisor : source.amount;
      const share = total > 0 ? Math.round((source.amount / total) * 100) : 0;
      section.append(
        tipStat(source.label, `${this.format(shown)}${this.perTurn ? "/t" : ""} (${share}%)`),
      );
    }
    // Ile zostało poza trójką — bez tego „TOP 3" czyta się jak „to wszystko".
    if (sources.length > TOP_SOURCES) {
      const reszta = sources.length - TOP_SOURCES;
      section.append(
        div("tip-note", `+ ${reszta} ${plural(reszta, ["pozycja", "pozycje", "pozycji"])} niżej`),
      );
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
    // Kod bierzemy z `actor`, a nie przez `professionOf`: tu wołający TRZYMA
    // postać w ręku, więc pytanie „czy to postać" jest już rozstrzygnięte.
    const title = div("tip-title", actor.name);
    if (actor.professionCode) this.markProfession(title, actor.professionCode);
    const nodes: Node[] = [title, this.generalSection(actor)];

    // Rozbicie stoi ZARAZ po sumach, przed użyciami i efektami: „ile" i „od
    // czego" to jedno pytanie zadane w dwóch krokach, a reszta dymka odpowiada
    // na inne. Przy czterech sekcjach kolejność decyduje, co widać bez
    // przesuwania wzroku.
    const top = this.topSourcesSection(actor);
    if (top) nodes.push(top);

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
    //
    // Człon o PPM tylko wtedy, gdy jest z czego wracać. Na najwyższym szczeblu
    // obiecywał powrót donikąd — a to JEDYNA instrukcja nawigacji w panelu,
    // więc jej nieprawda kosztuje więcej niż gdzie indziej.
    nodes.push(
      div("tip-hint", this.canGoBack() ? "LPM — rozbicie · PPM — powrót" : "LPM — rozbicie"),
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
    /**
     * Czy w ten wiersz da się wejść. Bierzemy to z `dataset.leaf` wiersza, bo
     * to on jest źródłem prawdy (patrz `appendBreakdown`) — dymek ma opisywać
     * TEN wiersz, nad którym stoi kursor, a nie całą sekcję.
     */
    canDrill: boolean,
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
      // Nie samo „Na turę”: dzielnik zależy od metryki, a wiersz podpisuje oba
      // tym samym „/t" (patrz `turnKind`).
      stat(`Na ${turnKind(this.metric)}`, `${rate.format(perTurn)}/t`),
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
      // Ten sam warunek co w `times()`: ZERO ciosów to nie rozjazd, tylko inny
      // kształt akcji („Śpiew zagłady" zadaje linią, która ciosem nie jest).
      // Wiersz przestał to meldować w poprzedniej rundzie, dymek nie — i ta sama
      // nieprawda przeniosła się o kilka pikseli w bok.
      if (source.hits > 0 && source.hits !== uses.count) {
        numbers.append(stat("Ciosy", `${source.hits}`));
      }
    } else if (source.hits > 0) {
      // Otrzymane i leczenie nie mają użyć — tam liczba ciosów jest jedyną,
      // jaką da się podać. Zera nie podajemy z tego samego powodu, co wyżej.
      numbers.append(stat(this.metric === "healingReceived" ? "Razy" : "Ciosy", `${source.hits}`));
    }

    // Etykieta łamie się na kilka linijek — po to jest ten dymek. Gdy niesie
    // postać (wiersz `KOMU` / `OD KOGO`), dostaje odznakę; gdy umiejętność albo
    // rodzaj obrażeń — nie, i rozstrzyga to `professionOf`, nie sekcja.
    const title = div("tip-title tip-wrap", source.label);
    this.markIfCharacter(title, source.label);

    return [
      title,
      numbers,
      // PPM zdejmuje JEDEN szczebel, więc z drugiego wraca do listy celów, nie
      // do składu. To jedyna instrukcja nawigacji w panelu — nie może kłamać.
      //
      // O LPM podpowiedź milczała, choć na drążalnym wierszu schodzi szczebel
      // niżej. Milczenie czyta się jak "nie ma tam nic", więc cała ta droga
      // była do odkrycia przypadkiem. Na liściu członu nie ma — wiersz nie
      // może kusić kliknięciem, którego nie obsłuży (`UX.md §6`).
      div(
        "tip-hint",
        canDrill
          ? `${actor.name} · LPM — głębiej · PPM — o szczebel wyżej`
          : `${actor.name} · PPM — o szczebel wyżej`,
      ),
    ];
  }

  private showTip(target: HoverTarget): void {
    // `shown`, nie `latest.fight`: dymek ma opisywać to, co widać na ekranie.
    // Przy wczytanym nagraniu wiersze biorą się z podglądu, więc szukanie
    // postaci w walce NA ŻYWO nie znajdowało nic (dymek w archiwum nie
    // pokazywał się wcale), a przy zbieżności nazw pokazywało cudze liczby.
    const stats = this.shown;
    const rows = [...this.root.querySelectorAll<HTMLElement>(".row")];

    let content: Node[] | null = null;
    let row: HTMLElement | undefined;

    if (target.type === "actor") {
      const actor = stats.actors.find((candidate) => candidate.name === target.key);
      row = rows.find((candidate) => candidate.dataset.actor === target.key);
      if (actor) content = this.tipContent(actor);
    } else {
      // Wiersz rozbicia opisuje postać, w której stoimy — bez niej nie ma czego
      // pokazać, a etykieta sama w sobie nie niesie liczb.
      const actor = this.focus
        ? stats.actors.find((candidate) => candidate.name === this.focus)
        : undefined;
      row = rows.find(
        (candidate) =>
          candidate.dataset.source === target.key && candidate.dataset.list === target.list,
      );
      const list = actor ? this.breakdownList(actor, target.list) : [];
      const source = list.find((candidate) => candidate.label === target.key);
      if (actor && source) {
        content = this.sourceTipContent(source, actor, target.list, row?.dataset.leaf === undefined);
      }
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
        text:
          `⚠ ${stats.unknownLines} ${unknownWord(stats.unknownLines)} ` +
          `${lineWord(stats.unknownLines)} — statystyki niepełne`,
        warn: true,
      });
    }
    if (stats.unknownElements.length > 0) {
      // Osobno od linii: te są zrozumiane i liczby się zgadzają, niepewny jest
      // sam rodzaj obrażeń. Wypisujemy nazwę klasy, bo to jedyne, co o nim
      // wiadomo — i to ona ma trafić do zgłoszenia.
      notes.push({
        text: `⚠ nieznany rodzaj obrażeń: ${stats.unknownElements.join(", ")}`,
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
    /**
     * Ile z puli bez sprawcy dotyczy tego, co WIDAĆ. Jedno miejsce na tę
     * decyzję, bo puli są dwie — tykające obrażenia i leczenie — a rozjazd
     * między nimi znaczyłby, że dwa przypisy pod sobą liczą według dwóch
     * różnych zasad.
     */
    const visible = (pool: BySide, own: number | undefined) =>
      own !== undefined
        ? own
        : this.team === "mine"
          ? pool.mine
          : this.team === "enemy"
            ? pool.enemy
            : totalBySide(pool);
    /** „my N · oni N” — dokładane tylko tam, gdzie widać obie strony naraz. */
    const bothSides = (pool: BySide) =>
      !focused && this.team === "all" && (pool.mine > 0 || pool.enemy > 0)
        ? [`my ${number.format(pool.mine)}`, `oni ${number.format(pool.enemy)}`]
        : [];

    const dot = stats.unattributedDotDamage;
    const unattributed = visible(dot, focused?.unattributedDotTaken);
    if (unattributed > 0) {
      // Przy "Wszyscy" sama suma nie mówi, kogo to boli — a to jedyne, co o tej
      // truciźnie wiadomo, bo sprawcy log nie podaje. W widoku postaci podział
      // na strony nie ma sensu: strona jest jedna, ta jej.
      // Przypis mówi, CO w tej puli jest, i KOGO to boli — obie rzeczy w jednym
      // nawiasie, bo dwa nawiasy pod rząd czyta się gorzej niż lista.
      //
      // Rodzaje MUSZĄ być z tego samego zakresu, co liczba przed nawiasem.
      // Wcześniej stały tu zawsze rodzaje z całej walki, a kwota szła za
      // filtrem i za wybraną postacią — przy dwóch rodzajach na dwóch
      // postaciach nawias potrafił być WIĘKSZY od liczby, którą rozbijał
      // („bez sprawcy: 300 (Ogień 900 · Trucizna 300)").
      const kinds = focused ? focused.unattributedDotTypes : sumKinds(stats.actors, this.team);
      const detail = [
        ...(kinds.length === 1
          ? [kinds[0]!.label]
          : kinds.map((k) => `${k.label} ${number.format(k.amount)}`)),
        // Sama suma nie mówi, kogo to boli — a to jedyne, co o tych obrażeniach
        // wiadomo, bo sprawcy log nie podaje. W widoku postaci podział na strony
        // nie ma sensu: strona jest jedna, ta jej.
        ...bothSides(dot),
      ];
      notes.push({
        text:
          `Tykające obrażenia bez sprawcy: ${number.format(unattributed)}` +
          (detail.length > 0 ? ` (${detail.join(" · ")})` : ""),
        warn: false,
      });
    }

    // Leczenie bez sprawcy liczyło się i znikało: log nie mówi, KTO leczył, więc
    // ta pula nie ma właściciela i przez to nie miała w panelu żadnego śladu.
    // Ta sama zasada, co przy DoT-cie — nie zgadujemy sprawcy, tylko mówimy,
    // ile leczenia stoi poza rankingiem.
    //
    // I ta sama arytmetyka: dopóki była to JEDNA liczba, filtr „My"/„Oni"
    // pokazywał na obu zakładkach to samo, a w widoku postaci przypis znikał —
    // choć to właśnie ona tę kwotę dostała.
    const healing = stats.unattributedHealing;
    const unattributedHealing = visible(healing, focused?.unattributedHealingReceived);
    if (unattributedHealing > 0) {
      const detail = bothSides(healing);
      notes.push({
        text:
          `Leczenie bez sprawcy: ${number.format(unattributedHealing)}` +
          (detail.length > 0 ? ` (${detail.join(" · ")})` : ""),
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
    // Pusty komplet, gdy nic jeszcze nie przyszło z gry: podgląd z archiwum
    // i przycisk ▤ muszą dać się narysować przed pierwszą walką.
    this.render(this.latest?.fight ?? EMPTY_STATS);
  }

  private makeDraggable(handle: HTMLElement): void {
    makeDraggable(handle, {
      position: () => ({ x: this.state.x, y: this.state.y }),
      move: (x, y) => this.moveTo(x, y),
      end: () => this.saveState(),
    });
  }

  /** Przesuwa panel, pilnując, żeby dało się go jeszcze złapać za nagłówek. */
  private moveTo(x: number, y: number): void {
    const clamped = clampToViewport(x, y, this.state.width);
    this.state.x = clamped.x;
    this.state.y = clamped.y;
    this.applyPosition();
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
    this.applyHeightCap();
  }

  /**
   * Sufit wysokości okna: tyle, ile zostało od jego górnej krawędzi do dołu
   * ekranu.
   *
   * Bez ręcznie ustawionej wysokości panel rósł z treścią — trzydzieści postaci
   * to ~700 px samej listy, więc przy oknie postawionym niżej dolne wiersze
   * schodziły poza ekran i nie dawały się kliknąć. Sufit działa niezależnie od
   * tego, czy rozmiar ustawiono ręcznie: `panel-body` ma już `overflow-y: auto`,
   * więc nadwyżka po prostu się przewija.
   *
   * Liczone w JS, nie przez `100vh` w CSS: wysokość zależy od pozycji okna,
   * a tej arkusz nie widzi.
   */
  private applyHeightCap(): void {
    const cap = Math.max(MIN_HEIGHT, window.innerHeight - this.state.y - RESIZE_MARGIN);
    this.panel.style.maxHeight = `${cap}px`;
  }

  /**
   * Stan panelu z magazynu — pole po polu, bez zaufania do ani jednego.
   *
   * Wcześniej sprawdzane były trzy pola sterujące renderem, a GEOMETRIA szła
   * żywcem z komentarzem „przycina ją `clampToViewport`". Nie przycina:
   * `clampToViewport` broni przed wyjechaniem za ekran, a nie przed `NaN`
   * (który przez nie przechodzi i zabiera hostowi `left`) ani przed szerokością
   * miliarda pikseli (która trafia prosto w `style.width` i przykrywa grę razem
   * z uchwytem do zmniejszenia). Oba odtworzone — patrz `overlay.test.ts`.
   */
  private loadState(): PanelState {
    const stored = storedRecord(this.storage, STORAGE_KEY);
    if (!stored) return { ...DEFAULT_STATE };
    // Sufity liczone z okna: panel szerszy niż ekran nie jest ustawieniem,
    // tylko awarią, a po zawężeniu nadal da się go złapać i rozciągnąć.
    const maxWidth = Math.max(MIN_WIDTH, window.innerWidth);
    const maxHeight = Math.max(MIN_HEIGHT, window.innerHeight);
    return {
      x: storedNumber(stored["x"], DEFAULT_STATE.x, -maxWidth, maxWidth),
      y: storedNumber(stored["y"], DEFAULT_STATE.y, -maxHeight, maxHeight),
      collapsed: storedBoolean(stored["collapsed"], DEFAULT_STATE.collapsed),
      width: storedNumber(stored["width"], DEFAULT_STATE.width, MIN_WIDTH, maxWidth),
      // `null` to prawidłowa wartość — „wysokość z treści", nie brak danych.
      height:
        stored["height"] === null
          ? null
          : storedNumber(stored["height"], DEFAULT_STATE.height ?? MIN_HEIGHT, MIN_HEIGHT, maxHeight),
      metric: storedOneOf(stored["metric"], METRICS, DEFAULT_STATE.metric),
      team: storedOneOf(stored["team"], TEAMS, DEFAULT_STATE.team),
      perTurn: storedBoolean(stored["perTurn"], DEFAULT_STATE.perTurn),
    };
  }

  private saveState(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Brak storage nie jest powodem, żeby przewrócić overlay.
    }
  }
}
