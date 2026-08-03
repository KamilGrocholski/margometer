/**
 * Arkusz obu okien — panelu i archiwum — w JEDNYM miejscu.
 *
 * PO CO to jest wydzielone (`SOLID R7`). Panel i archiwum rysują się w TYM SAMYM
 * shadow roocie, a do 2026‑08‑02 każde wstrzykiwało własny `<style>`. Dwa
 * arkusze w jednym zasięgu znaczą dokładnie tyle, że nie ma czegoś takiego jak
 * „styl archiwum" — reguły panelu obowiązują tam tak samo, tylko nikt tego nie
 * pilnuje. Skutki były widoczne w kodzie: `archive.ts` musiało nazwać swój
 * wiersz `.archive-paste-actions`, bo `.row` było już zajęte przez ranking
 * (komentarz stał w pliku), a chrome okna powielało się z innymi wartościami —
 * tło `0.96` wobec `0.94`, ta sama intencja w dwóch literałach.
 *
 * Podział jest po ROLI, nie po pliku: tokeny → prymitywy wspólne → to, co
 * naprawdę własne. Dokładając regułę, zacznij od pytania, do którego z tych
 * trzech należy — a jeśli do dwóch, to znaczy, że jest wspólna.
 *
 * `all: initial` na hoście plus Shadow DOM odcinają globalny CSS Margonema —
 * bez tego gra przemalowałaby nam panel.
 *
 * ⚠️ Backtick w komentarzu CSS ZAMYKA ten literał i wywala kompilację w miejscu
 * wyglądającym na niezwiązane. Nazwy własności pisz tu bez odwrotnych apostrofów
 * albo z ukośnikiem, tak jak w liniach niżej.
 */

/**
 * Tokeny — jedyne miejsce, w którym stoją wartości, a nie odwołania.
 *
 * Wszystko, co ma być takie samo w obu oknach, ma tu mieć nazwę. Reguła
 * praktyczna: jeżeli ta sama wartość pada w arkuszu drugi raz, powinna być
 * tokenem — bo drugie wystąpienie prędzej czy później rozjedzie się z pierwszym
 * i nikt tego nie zauważy.
 */
const TOKENS = `
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
  /* Para „po naszej stronie / przeciwko nam". Celowo nie z palety postaci — te
     dwa kolory mają znaczyć stronę, a nie wskazywać konkretną osobę.
     Nazwy mówią o walce, bo tam powstały (pasek podziału stron), ale archiwum
     używa ich do wygranej i przegranej — i to jest ten sam podział, nie drugi:
     zielone znaczy „poszło po naszej myśli", czerwone „nie poszło". Trzeciego
     znaczenia tej parze nie dokładamy; gdyby było potrzebne, to znak, że
     potrzebny jest osobny token, a nie szersza interpretacja. */
  --mine: #6fbf8b;
  --enemy: #e0736f;
  /* Ramka okna nad grą. Panel i archiwum miały to samo w dwóch kopiach, przy
     czym krycie tła różniło się o 0,02 — nie z wyboru, tylko dlatego, że drugie
     okno powstało przez skopiowanie pierwszego. */
  --surface-window: rgba(22, 22, 26, 0.94);
  --radius: 8px;
  --shadow: 0 6px 20px rgb(0 0 0 / 45%);
  /* Tor, po którym biegnie wypełnienie: wiersz danych, suwak odtwarzania,
     podział stron. Trzy paski o trzech różnych znaczeniach, ale jedno tło —
     bo to tło znaczy „tu nic jeszcze nie ma", a nie „to jest taki pasek".
     Stało w arkuszu trzy razy z palca. */
  --track: #24242a;
  /* Dwa stany, które ma każdy klikalny element w obu oknach: kursor nad nim
     i „to jest teraz wybrane". Padały po trzy i po dwa razy z palca —
     w przyciskach panelu, w okruszku i w wierszu archiwum. */
  --hover: #26262c;
  --active: #2f2f37;
  /* Kreska WEWNĄTRZ okna, słabsza niż jego ramka: dzieli wiersze listy
     i odcina pasek komunikatu, ale nie ma udawać krawędzi. To --border przy
     45 % krycia; stało dwa razy rozpisane na kanałach. */
  --border-soft: rgb(53 53 59 / 45%);
}
/* Wymiary liczymy razem z ramką i paddingiem — stałe pozycjonowania w JS
   zakładają dokładnie te szerokości. */
*, *::before, *::after { box-sizing: border-box; }
`;

/**
 * Prymitywy wspólne — chrome okna i wiersz danych.
 *
 * Oba okna są tym samym rodzajem rzeczy: przeciągalną ramką z nagłówkiem nad
 * grą. Dlatego ich tło, ramka, promień i cień jadą stąd, a nie z dwóch
 * osobnych deklaracji.
 */
const SHARED = `
/* Ramka okna nad grą. Jedna reguła na oba selektory, a nie wspólna klasa
   doklejana w JS: klasa wymagałaby zmiany w dwóch plikach i dałoby się
   o nią zapomnieć przy trzecim oknie. Tu zapomnieć się nie da — nowe okno
   albo jest na tej liście, albo nie wygląda jak okno. */
.panel, .archive {
  background: var(--surface-window);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  color: var(--ink);
  font-size: 12px;
  line-height: 1.35;
  /* Kolumna: nagłówek u góry, przewijany korpus pod nim. */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
/* Nagłówek jest uchwytem przeciągania w obu oknach. */
.panel header, .archive header { cursor: grab; }
.panel header.dragging, .archive header.dragging { cursor: grabbing; }
`;

/** Reguły panelu i dymka. */
const PANEL = `
/* Chrome (tło, ramka, promień, cień, kolumna) idzie z prymitywów wyżej.
   Zostaje to, co panelowi naprawdę własne: szerokość i kontekst pozycjonowania
   dla uchwytu zmiany rozmiaru w rogu. */
.panel {
  width: 260px;
  position: relative;
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
/* Wersja ma być czytelna, ale nie ma konkurować z nazwą — stąd rozmiar i barwa
   przygaszona. Rozciąga się .title, nie ten węzeł, więc przy wąskim panelu
   miejsce oddaje nazwa, a numer zostaje w całości. */
.version { font-size: 10px; color: var(--ink-muted); white-space: nowrap; }
button {
  all: unset;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--ink-muted);
  font-size: 11px;
}
button:hover { background: var(--hover); color: var(--ink); }
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
button[aria-pressed="true"] { background: var(--active); color: var(--ink); }
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
  background: var(--track);
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
.sides-track { display: flex; height: 5px; margin-top: 4px; border-radius: 3px; overflow: hidden; background: var(--track); }
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
.rows .row { position: relative; height: 20px; background: var(--track); border-radius: 3px; overflow: hidden; }
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
.rows .row[data-unattributed] {
  margin-top: 6px;
  border-top: 1px dashed var(--border);
  height: 25px;
}
/* Pasek i tekst zaczynają się POD kreską, żeby jej nie zamalowały. */
.rows .row[data-unattributed] .bar,
.rows .row[data-unattributed] .bar-cap,
.rows .row[data-unattributed] .row-text { top: 4px; }
.rows .row[data-unattributed] .bar {
  opacity: 0.4;
  mask-image: repeating-linear-gradient(-45deg, #000 0 4px, transparent 4px 8px);
}
.rows .row[data-unattributed] .bar-cap { opacity: 0.7; }
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
/* Okruszek jest TRWAŁY i chowa się atrybutem, a nie zniknięciem z drzewa —
   inaczej podświetlenie :hover gasło przy każdej linii logu. Reguła jest
   potrzebna, bo .crumb{display:flex} wyżej bije domyślne [hidden]{display:none}
   z arkusza przeglądarki. */
.crumb[hidden] { display: none; }
/* color: inherit trzyma wygląd sprzed zmiany na przycisk: reguła "button"
   maluje na --ink-muted, a okruszek ma być tak samo jasny jak reszta ścieżki. */
.crumb-back { cursor: pointer; border-radius: 3px; padding: 1px 4px; margin-left: -4px; color: inherit; }
.crumb-back:hover { background: var(--hover); }
.crumb-name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Numer pozycji — jedyne, co stoi przed nazwą. Poziom i profesję niesie barwa
   paska i dymek; na 260 px kolejna kolumna zrobiłaby z wiersza tabelę. */
.rank { color: var(--ink-muted); font-variant-numeric: tabular-nums; flex: none; }
.label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
/* Odznaka profesji. Nie kurczy się, bo przy ciasnym wierszu ustąpić ma NAZWA —
   ona ma wielokropek, odznaka nie ma czego uciąć. Szerokość równa wysokości,
   żeby wszystkie litery zajmowały tyle samo i lewa krawędź nazw stała w pionie
   mimo różnych szerokości znaków. */
.label[data-prof]::before {
  content: attr(data-prof);
  display: inline-block;
  vertical-align: 1px;
  margin-right: 4px;
  width: 13px;
  height: 13px;
  border-radius: 3px;
  background: var(--prof-bg);
  color: var(--prof-ink);
  font-size: 9px;
  font-weight: 700;
  line-height: 13px;
  text-align: center;
  letter-spacing: 0;
}
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

/** Reguły okna archiwum. */
const ARCHIVE = `
/* \`hidden\` przegrywa z \`display: flex\` niżej — bez tej reguły zamknięte okno
   byłoby dalej widoczne. */
.archive[hidden] { display: none; }
/* Jak przy panelu: chrome z prymitywów, tu zostaje własne. Archiwum jest
   osobnym oknem (\`position: fixed\`), a panel siedzi na hoście. */
.archive {
  position: fixed;
  z-index: 1;
  width: 300px;
}
/* Lista przewija się w środku okna: nagrań bywa ~190, a okno ma zostać oknem. */
.archive-list { max-height: 320px; overflow-y: auto; }
.archive-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-soft);
}
.archive-row:hover { background: var(--hover); }
.archive-row.is-open { background: var(--active); }
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
/* Nazwa własna, choć KOLIZJI JUŻ NIE MA. Stało tu: „własna klasa, nie .row:
   tamta jest już zajęta przez wiersz rankingu w panelu (ten sam shadow root),
   który narzuca wysokość 20 px, ciemne tło i obcięcie". Od 2026‑08‑02 wiersz
   rankingu jest zawężony do .rows .row, więc samo .row byłoby wolne — nazwa
   zostaje, bo mówi więcej. Kolizja była objawem: reguła panelu obowiązywała
   w archiwum, tylko nikt tego nie pilnował. Objaw zniknął razem z przyczyną. */
.archive-paste-actions { display: flex; gap: 6px; align-items: center; }
.archive-paste .hint { flex: 1; font-size: 11px; opacity: 0.75; }
/* Odpowiedź na kliknięcie, które nic nie zrobiło. Ostrzegawcza, ale nie krzyczy
   — to poprawna odmowa, nie awaria. */
.archive-notice {
  padding: 5px 8px;
  font-size: 11px;
  /* Bez wartości zapasowej: token stoi w TOKENS wyżej, w tym samym arkuszu.
     Stało tu \`var(--warning, #c98500)\` z czasów, gdy archiwum miało własny
     arkusz i nie mogło zakładać, że panel już swój wstrzyknął — a zapasowa
     barwa była przy tym INNA niż token, więc dwa okna ostrzegały dwoma
     odcieniami żółtego w zależności od kolejności ładowania. */
  color: var(--warning);
  border-bottom: 1px solid var(--border-soft);
}
`;

/**
 * Jeden arkusz, wstrzykiwany raz przez `Overlay`.
 *
 * Reguły archiwum stoją w nim także wtedy, gdy okno archiwum nie powstało —
 * kosztu w tym nie ma, a alternatywa (dokładanie arkusza przy `attachArchive`)
 * przywracałaby dwa źródła wyglądu, czyli to, przed czym ten plik powstał.
 */
export const STYLE = [TOKENS, SHARED, PANEL, ARCHIVE].join("\n");
