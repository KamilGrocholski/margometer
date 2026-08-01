import { professionColor, typeColor } from "./palette.ts";
import { EMPTY_STATS } from "./session.ts";
import {
  invertBreakdown,
  leadsDeeper,
  totalBySide,
  UNATTRIBUTED_SOURCE,
  type BattleStats,
  type BySide,
  type SessionStats,
} from "./stats.ts";
import { PROFESSIONS, type ActorStats, type AttackerBreakdown } from "./types.ts";
import { clampToViewport, makeDraggable, realTicker, type Ticker } from "./window.ts";
import { Confirm } from "./confirm.ts";

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
  turns: "Brak tur.",
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
/* Gutter paska przewijania rezerwujemy TYLKO przy stałej wysokości, gdy korpus
   naprawdę się przewija. Odtwarzanie zmienia dane co klatkę — bez tego pasek
   pojawiający się i znikający na granicy przewijania miga. Przy wysokości
   z treści (brak przewijania) pusty gutter tylko zjadałby kilkanaście pikseli
   z prawej, więc włącza go dopiero klasa \`scrolls\`. */
.panel-body.scrolls { scrollbar-gutter: stable; }
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
/* Reset "all: unset" zdejmuje też obwódkę focusu przeglądarki, a Tab i tak po
   przyciskach chodzi — bez tej reguły chodzi po nich NIEWIDZIALNIE. Nie chodzi
   o nawigację klawiaturą (skróty są świadomie poza zakresem, UX.md §6), tylko
   o to, żeby widać było, gdzie stoi zaznaczenie.

   Selektor jest JEDEN, bo fokusowalne są wyłącznie przyciski. Stały tu kiedyś
   jeszcze trzy — .row[tabindex], .crumb-back i .replay-track — i wszystkie
   trzy były MARTWE: tabindex nie ustawia nic w całym src/, a pozostałe dwa były
   div-ami. Arkusz obiecywał więc fokus tam, gdzie go z założenia nie ma.
   Okruszek został przy tej okazji prawdziwym przyciskiem, bo nim jest; wiersze
   i suwak zostają myszą, zgodnie z UX.md §6. */
button:focus-visible {
  outline: 2px solid var(--accent, #6ea8fe);
  outline-offset: 1px;
}
button[aria-pressed="true"] { background: #2f2f37; color: var(--ink); }
/* Nagrywanie: kropka czerwienieje dopiero, gdy faktycznie leci zapis — bez
   tego przycisk wyłączony i włączony różnią się samym tłem, a to za mało
   w oknie, na które patrzy się kątem oka w trakcie walki. */
.rec.is-on { color: var(--enemy); }
/* Pasek nagrywania — stan i dwie akcje, pod nagłówkiem. Osobny wiersz, a nie
   kolejne przyciski w nagłówku: przy 260 px tytuł nie ma się gdzie zmieścić
   obok pięciu ikon, a licznik walk jest tu i tak czytelniejszy niż w ikonie. */
.rec-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  font-size: 11px;
  color: var(--ink-muted);
  border-bottom: 1px solid var(--border);
  /* Okno schodzi do 200 px — wtedy ustępuje opis, a nie przyciski. */
  white-space: nowrap;
}
.rec-bar .dot { color: var(--enemy); }
.rec-bar .grow { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.rec-bar.warn { color: var(--enemy); }
/* Stan błędu jest jedyną treścią, która MUSI się zmieścić: przy wąskim oknie
   "Brak miejsca w przeglądarce" ucinało się do kilku znaków, czyli komunikat
   znikał dokładnie wtedy, gdy był potrzebny. */
.rec-bar.warn { white-space: normal; }
.rec-bar.warn .grow { overflow: visible; text-overflow: clip; }
/* Podgląd wczytanej walki. Żółte tło jest tu celowo krzykliwe: panel pokazuje
   wtedy dane sprzed godziny, a pomylenie ich z trwającą walką jest gorsze niż
   krzykliwy pasek. */
.preview-bar {
  padding: 4px 8px 6px;
  font-size: 11px;
  background: rgb(250 178 25 / 12%);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.preview-head { display: flex; align-items: center; gap: 6px; }
.preview-tag { color: var(--warning); font-weight: 600; letter-spacing: 0.06em; }
.preview-head .grow { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.preview-title { overflow: hidden; text-overflow: ellipsis; }
.replay { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
.replay-track {
  flex: 1;
  min-width: 0;
  /* Pasek rysuje się cienko, ale łapie grubo: 5 px to cel nie do trafienia,
     a przewinięcie nagrania idzie wyłącznie tędy. Wysokość dokłada padding,
     sam pasek zostaje wizualnie taki jak był. */
  height: 5px;
  box-sizing: content-box;
  padding: 6px 0;
  background-clip: content-box;
  border-radius: 3px;
  background: #24242a;
  cursor: pointer;
  overflow: hidden;
}
.replay-fill { height: 100%; background: var(--warning); }
.replay-label { font-variant-numeric: tabular-nums; }
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
/* Krycie jest tu miarą DOSTĘPNOŚCI, nie gustu: tekst wiersza leży NA pasku,
   a przy pełnej mocy barwy żadna z palety nie przechodziła 4,5:1 (najgorzej
   żółty — 3,50:1). Przy 0.55 przechodzą wszystkie; wartości pilnuje test
   kontrastu w palette.test.ts, więc ta liczba nie da się podnieść po cichu. */
.bar { position: absolute; inset: 0 auto 0 0; min-width: 2px; opacity: 0.55; }
/* Barwa w pełnej mocy zostaje na krawędzi: to ona niesie tożsamość (profesja
   albo rodzaj obrażeń), a rozstęp ΔE z palette.ts liczony był właśnie dla
   pełnego nasycenia. Przygaszony pasek dalej mówi „ile", nasadka — „czyje". */
.bar-cap { position: absolute; inset: 0 auto 0 0; width: 3px; border-radius: 3px 0 0 3px; }
/* Pozycja zbiorcza „bez sprawcy" nie jest postacią, więc nie ma jej wyglądać:
   pasek kreskowany zamiast pełnego, kreska odcinająca ją od rankingu.
   Kreska siedzi na WŁASNYM boksie wiersza (border-top), a nie na ::before
   wysuniętym nad niego: .row ma overflow:hidden, więc wszystko poza boksem
   jest przycinane i kreski nie było widać wcale. */
.row[data-unattributed] {
  margin-top: 6px;
  border-top: 1px dashed var(--border);
  height: 25px;
}
/* Pasek i tekst zaczynają się POD kreską, żeby jej nie zamalowały. */
.row[data-unattributed] .bar,
.row[data-unattributed] .bar-cap,
.row[data-unattributed] .row-text { top: 4px; }
.row[data-unattributed] .bar {
  opacity: 0.4;
  mask-image: repeating-linear-gradient(-45deg, #000 0 4px, transparent 4px 8px);
}
.row[data-unattributed] .bar-cap { opacity: 0.7; }
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
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 6px 2px;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
}
.side-head .sum { margin-left: auto; font-variant-numeric: tabular-nums; white-space: nowrap; }
/* Nazwa w nagłówku ustępuje, suma nie: przy długim nicku ("CZYM — Jordi El
   Nino Polla") to opis miał się skrócić, a nie liczba wyjechać poza panel. */
.side-head .who { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
/* Ścieżka powrotu z widoku pojedynczej postaci. */
.crumb { display: flex; align-items: baseline; gap: 6px; padding: 6px 8px 0; font-size: 11px; }
/* color: inherit trzyma wygląd sprzed zmiany na przycisk: reguła "button"
   maluje na --ink-muted, a okruszek ma być tak samo jasny jak reszta ścieżki. */
.crumb-back { cursor: pointer; border-radius: 3px; padding: 1px 4px; margin-left: -4px; color: inherit; }
.crumb-back:hover { background: #26262c; }
.crumb-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Numer pozycji — jedyne, co stoi przed nazwą. Poziom i profesję niesie barwa
   paska i dymek; na 260 px kolejna kolumna zrobiłaby z wiersza tabelę. */
.rank { color: var(--ink-muted); font-variant-numeric: tabular-nums; flex: none; }
.label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.value, .avg { font-variant-numeric: tabular-nums; flex: none; }
.avg { color: var(--ink-muted); font-size: 11px; }
/* Liczba wiodąca jest zawsze ta pogrubiona — to ona rządzi paskiem i rankingiem,
   niezależnie od tego, czy pokazuje sumę czy tempo. Reszta stoi przy niej
   w nawiasie, więc samo pogrubienie wystarcza za całe rozróżnienie. */
.value { font-weight: 600; }
/* Nawias przy liczbie wiodącej: udział, a przy nim ta druga miara. Nie osobna
   kolumna — ma się czytać jako dopisek do liczby obok, nie jako własne pole. */
.share { color: var(--ink-muted); font-variant-numeric: tabular-nums; font-weight: 400; }
.empty, .note { padding: 10px 8px; color: var(--ink-muted); }
footer { border-top: 1px solid var(--border); padding: 6px 8px; display: flex; flex-direction: column; gap: 3px; }
.warn { color: var(--warning); }
.panel.collapsed .tabs,
.panel.collapsed .rows,
.panel.collapsed .sides,
.panel.collapsed .crumb,
.panel.collapsed .resize-grip,
.panel.collapsed footer { display: none; }
/* Wiersz składu prowadzi głębiej, wiersz rozbicia już nie — stąd kursor tylko
   tam, gdzie kliknięcie coś robi. */
.rows .row { cursor: default; }
.rows .row[data-actor] { cursor: pointer; }
/* Wiersz rozbicia, który jest liściem, nie prowadzi głębiej, ale ma dymek —
   kursor to sygnalizuje. Ten, w który DA się wejść, dostaje ten sam kursor co
   wiersz składu: obietnica kursora ma się zgadzać z tym, co robi klik. */
.rows .row[data-source] { cursor: help; }
.rows .row[data-source]:not([data-leaf]) { cursor: pointer; }
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
  /* Nad wszystkim, co rysujemy w tym samym shadow roocie. Bez tego decydowała
     kolejność w drzewie: dymek stoi PRZED panelem, więc panel go zamalowywał
     (widoczne po rozciągnięciu okna, gdy dymek klamruje się na lewą stronę),
     a okno archiwum ze swoim własnym z-index zasłaniało go zawsze. */
  z-index: 3;
}
/* Widoczność sterowana jawnie, bez polegania na arkuszu przeglądarki dla
   atrybutu [hidden]. */
.tip { display: none; }
.tip:not([hidden]) { display: block; }
.tip-title { font-weight: 600; margin-bottom: 4px; }
/* Etykieta rozbicia bywa dłuższa niż panel — w dymku ma się złamać, nie uciąć. */
.tip-wrap { overflow-wrap: anywhere; }
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

/**
 * Jak nazywa się dzielnik trybu „na turę” dla danej metryki.
 *
 * W wierszu obie kolumny są podpisane identycznie „/t”, więc przełączenie
 * zakładki Zadane↔Otrzymane zmienia skalę liczby o rząd wielkości bez żadnego
 * sygnału w UI. Dymek jest miejscem, gdzie da się to powiedzieć słowami, nie
 * zaśmiecając wiersza kryptycznym sufiksem.
 */
function turnKind(metric: Metric): string {
  return metric === "damageDealt" || metric === "turns" ? "turę własną" : "turę walki";
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
 * Czy cel zdarzenia leży w polu, w którym się pisze.
 *
 * Ta sama ostrożność co w `rowUnder` — `closest` zamiast `instanceof`, bo
 * siedzimy w cudzym dokumencie.
 */
function editableUnder(target: EventTarget | null): boolean {
  const element = target as Element | null;
  if (typeof element?.closest !== "function") return false;
  return element.closest("textarea, input, [contenteditable='true']") !== null;
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
  /** Odliczanie powrotu ikony kopiowania — patrz `copy` i `destroy`. */
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
  /**
   * Ostatnio podane statystyki. Sesja jako FUNKCJA, nie gotowa wartość:
   * `mergeStats` głęboko kopiuje i sortuje każde rozbicie każdej postaci,
   * a panel nie pokazuje dziś sumy sesji — czyta ją tylko przycisk kopiowania.
   * Liczenie jej przy każdej linii logu było pracą w wątku gry na nic.
   */
  private latest: { fight: BattleStats; session: () => SessionStats } | null = null;
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
    this.confirmClear = new Confirm<void>({
      now: this.now,
      ticker: options.ticker ?? realTicker,
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
      // Menu przeglądarki nad panelem tylko przeszkadza, a prawy przycisk ma
      // tu własne znaczenie. Blokujemy je w całym overlayu, nie tylko na
      // wierszu — wracać chce się także z pustego miejsca pod listą.
      //
      // Ale archiwum rysuje się w TYM SAMYM shadow roocie, a w nim stoi pole
      // wklejania logu — jedyne miejsce w całym dodatku, gdzie natywne menu
      // jest naprawdę potrzebne. Tam prawy przycisk zostawiamy w spokoju.
      if (editableUnder(event.target)) return;
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
   * Pierwszy argument to JEDNA walka, drugi — suma sesji, i te typy są RÓŻNE.
   *
   * Panel rysuje wyłącznie `fight`: czyta z niego oś tur (`fightTurns`), której
   * suma sesji nie ma i mieć nie może. Gdyby oba argumenty były tym samym
   * typem, podanie sumy jako pierwszego skompilowałoby się i po cichu wyzerowało
   * tryb „na turę” dla przyjętych i leczenia. `SessionStats` to uniemożliwia.
   */
  render(fight: BattleStats, session: SessionStats | (() => SessionStats)): void {
    this.latest = { fight, session: typeof session === "function" ? session : () => session };
    // Akcje należą do TEJ wersji panelu: co render buduje, to render rejestruje.
    // Bez czyszczenia zostałaby tu obsługa przycisków, których już nie ma —
    // choćby „na żywo” po zamknięciu podglądu.
    this.actions.clear();
    // Sesja jest liczona i pamiętana, ale nie ma dziś zakładki, która by ją
    // pokazała — panel mówi zawsze o bieżącej walce.
    //
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
    this.body.replaceChildren(
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
    if (this.flashHandle !== null) clearTimeout(this.flashHandle);
    this.flashHandle = null;
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

    /** Kopiuje statystyki — bieżącą walkę i całą sesję naraz — jako JSON. */
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

    header.append(title, copy, ...(record ? [record] : []), collapse);
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
            ? "nagrywam — czekam na walkę"
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
   * W podglądzie nie ma też sumy sesji: nagranie z archiwum ani wklejony log
   * nie są jej częścią, więc dokładanie jej obok znaczyłoby, że te liczby się
   * ze sobą wiążą. `source` mówi wprost, na co się patrzy.
   */
  private statsJson(): string {
    const preview = this.preview;
    return JSON.stringify(
      {
        tool: "MargoMeter",
        at: new Date().toISOString(),
        source: preview ? preview.view.source : "na żywo",
        fight: preview ? preview.stats : (this.latest?.fight ?? null),
        session: preview ? null : (this.latest?.session() ?? null),
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
    if (this.flashHandle !== null) clearTimeout(this.flashHandle);
    this.flashHandle = setTimeout(() => {
      this.flashHandle = null;
      if (this.flash?.key !== key) return;
      this.flash = null;
      this.rerender();
    }, 1500) as unknown as number;
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
   * Ścieżka powrotu nad rozbiciem. Prawy przycisk robi to samo, ale nie widać
   * go na ekranie — bez tej linijki nie da się zgadnąć, jak się cofnąć.
   */
  private renderCrumb(actor: ActorStats): HTMLElement {
    const crumb = div("crumb");
    // Etykieta mówi, DOKĄD się wraca, a nie „wstecz” — przy dwóch szczeblach
    // sam strzałek nie wystarczy, żeby wiedzieć, gdzie się wyląduje.
    // Prawdziwy `<button>`, nie `div`: to element AKCJI, a nie tekst. Niezależnie
    // od polityki klawiatury element, w który się klika, ma się tak nazywać —
    // dopiero wtedy czytnik ekranu mówi o nim jak o przycisku, a Tab może się na
    // nim zatrzymać widocznie.
    const back = document.createElement("button");
    back.type = "button";
    back.className = "crumb-back";
    back.textContent = this.focusSource === null ? "‹ skład" : `‹ ${actor.name}`;
    back.setAttribute("aria-label", "Wróć o szczebel");
    this.bindAction(back, "crumb-back", () => this.back());
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
        `kryt. ${actor.crits}`,
        `uniki ${actor.misses}`,
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

  /** Jedna lista rozbicia: nagłówek i paski w tej samej skali co reszta widoku. */
  private appendBreakdown(
    container: HTMLElement,
    heading: string,
    list: BreakdownList,
    sources: ActorStats["dealtBy"],
    total: number,
    turns: number,
    /** Barwa paska dla danej etykiety — decyzja stoi u wołającego, patrz `renderDetail`. */
    colorFor: (label: string) => string,
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
      text.append(div("label", source.label), value);
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
      // nie zrobiła". Postać spoza składu (side === null) to inna sprawa: ona
      // pojawia się dopiero, gdy log ją wymieni, więc zerowej nie ma po co
      // trzymać w rankingu wybranej metryki.
      .filter((actor) => actor.side !== null || this.value(actor) > 0)
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
      const row = div("tip-stat");
      row.append(
        div("tip-stat-label", "Profesja"),
        div(
          "tip-stat-value",
          PROFESSIONS[actor.professionCode as keyof typeof PROFESSIONS] ?? actor.professionCode,
        ),
      );
      section.append(row);
    }

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
        div("tip-stat-value", times(use.count, hits)),
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

    return [
      // Etykieta łamie się na kilka linijek — po to jest ten dymek.
      div("tip-title tip-wrap", source.label),
      numbers,
      // PPM zdejmuje JEDEN szczebel, więc z drugiego wraca do listy celów, nie
      // do składu. To jedyna instrukcja nawigacji w panelu — nie może kłamać.
      div("tip-hint", `${actor.name} · PPM — o szczebel wyżej`),
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
    const latest = this.latest ?? { fight: EMPTY_STATS, session: () => EMPTY_STATS };
    this.render(latest.fight, latest.session);
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

  private loadState(): PanelState {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const stored = { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<PanelState>) };
      // Metryka i filtr sterują renderem, więc wartość spoza zestawu wywracałaby
      // panel przy starcie — a pod tym kluczem może stać zapis starszej albo
      // NOWSZEJ wersji dodatku. Geometrię przycina `clampToViewport`.
      if (!METRICS.includes(stored.metric as (typeof METRICS)[number])) {
        stored.metric = DEFAULT_STATE.metric;
      }
      if (!(stored.team in TEAM_LABELS)) stored.team = DEFAULT_STATE.team;
      if (typeof stored.perTurn !== "boolean") stored.perTurn = DEFAULT_STATE.perTurn;
      return stored;
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
