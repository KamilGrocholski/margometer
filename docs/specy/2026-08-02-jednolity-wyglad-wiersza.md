# Jednolity wygląd wiersza — odznaka postaci i wspólne prymitywy

Status: wdrożone · 2026-08-02

## Problem

Pytanie brzmiało: czy nie ujednolicić pasków i „ikonek postaci", żeby były takie
same we wszystkich oknach. Pomiar dał odpowiedź złożoną — jedno faktycznie było
zepsute, jedno wyglądało na rozjazd, a nim nie było.

**1. Odznaka profesji istniała wyłącznie w rankingu składu.** `markProfession`
miało w całym `overlay.ts` jedno wywołanie. Rozbicia `KOMU` / `OD KOGO` i lista
celów umiejętności wymieniają POSTACIE i malują pasek `professionColor` — ale
`.label` budowany w `appendBreakdown` nigdy nie dostawał `data-prof`.

To nie jest kosmetyka. `palette.ts` mówi wprost, i jest to wynik przeszukania
palety, nie preferencja: sześciu barw profesji nie da się na tym tle zrobić
wzajemnie rozłącznymi — sufit to cztery, dla pełnej szóstki najlepszy możliwy
rozstęp to ΔE 10,6 przy progu 15 — więc „**rozróżnialność zapewnia odznaka
z literą profesji, nie barwa**". `UX.md §6` powtarza to samo zdanie. W rankingu
gwarancja była dotrzymana od `AUDYT-14`; w rozbiciu nie było jej wcale, choć to
tam barwy powtarzają się najgęściej (dziesięciu graczy potrafi mieć trzy
profesje). Gwarancja obowiązywała więc na jednym szczeblu z trzech.

**2. Archiwum miało własny arkusz w tym samym shadow roocie.** Dwa arkusze
w jednym zasięgu nie dają drugiemu oknu własnego stylu — dają złudzenie, że je
ma. Skutki były policzalne: chrome okna stało w dwóch kopiach różniących się
kryciem tła o 0,02 (`0.96` wobec `0.94`) — nie z wyboru, tylko dlatego, że drugie
okno powstało przez skopiowanie pierwszego; barwa toru padała trzy razy z palca,
stan `hover` trzy razy, stan „wybrane" dwa razy, kreska wewnętrzna dwa razy;
`archive.ts` musiało nazwać swój wiersz `.archive-paste-actions`, bo `.row` było
zajęte przez ranking — z komentarzem tłumaczącym obejście. `--warning` miało
w archiwum wartość zapasową `#c98500` INNĄ niż token `#fab219`, więc dwa okna
ostrzegały dwoma odcieniami żółtego zależnie od kolejności ładowania.

**3. Czego zepsutego NIE BYŁO.** Trzy gatunki pasków wyglądają różnie, bo znaczą
różne rzeczy — patrz „Odrzucone warianty".

## Rozwiązanie

**Odznaka wszędzie, gdzie wiersz nazywa postać**, i to z TEGO SAMEGO predykatu
co barwa (`listsCharacters`). To nie jest oszczędność na pisaniu, tylko warunek
spójności: osobny warunek pozwoliłby kiedyś dojść do wiersza z barwą jednej
profesji i literą drugiej. Jeden predykat nie ma jak rozjechać się sam ze sobą.
`appendBreakdown` dostaje `professionFor` parą z `colorFor` — decyzja stoi
u wołającego, tak jak przy `counter` i `drillable`.

Nowego CSS nie ma ani linii: reguła `.label[data-prof]::before` była już ogólna.
Brakowało wyłącznie wywołania.

**Jeden arkusz dla obu okien** (`src/style.ts`, zamyka `SOLID R7`), podzielony po
ROLI, nie po pliku: tokeny → prymitywy wspólne → panel → archiwum. Chrome okna
opisuje jedna reguła `.panel, .archive`. Wszystko, co padało w arkuszu drugi raz,
ma teraz nazwę: `--surface-window`, `--radius`, `--shadow`, `--track`, `--hover`,
`--active`, `--border-soft`. Wiersz rankingu zawężony do `.rows .row`, więc
kolizja, dla której powstało obejście w archiwum, przestała istnieć.

**Pasków i odznak w liście nagrań nie ma.** Lista nagrań to nie ranking.

## Odrzucone warianty

**Sprowadzenie trzech gatunków pasków do jednego wyglądu.** W panelu żyją trzy:
`.bar` + `.bar-cap` (wielkość wiersza wobec lidera listy), `.sides-track`
(podział 100 % między dwie strony) i `.replay-track` (postęp odtwarzania,
zarazem suwak). Wyglądają różnie, bo znaczą różne rzeczy, i mają udokumentowane,
świadomie SPRZECZNE rozstrzygnięcia: `.bar` ma `min-width: 2px`, żeby pozycja
zerowa była widoczna, a `.sides-track` przy sumie 0 zostaje celowo PUSTY, bo
„jeszcze nic się nie wydarzyło" wyglądało jak wyrównana walka (`A5`).
Ujednolicenie ich skasowałoby informację, a nie powtórzenie.

**Paski w liście nagrań archiwum.** Kuszące, bo „wszędzie są paski". Ale pasek
w tym repo zawsze niesie udział w jakiejś sumie, a wiersz archiwum jest
nagraniem — nie ma czego być udziałem. Pasek proporcjonalny do długości logu
albo do obrażeń w walce byłby ozdobą udającą pomiar, czyli dokładnie tym, czego
zabrania zasada „nie udawaj danych, których log nie ma".

**Wspólna skala pasków w widoku postaci.** W jednym oknie stoją do trzech sekcji,
każda licząca własne 100 %. Komentarz w kodzie obiecywał przy tym „paski w tej
samej skali co reszta widoku" — więc wyglądało to na rozjazd kodu z zamiarem.
Sprawdzone: rację ma KOD. Każda sekcja jest własnym rankingiem („która
umiejętność robi robotę"), a `TYP OBRAŻEŃ` i `CZYM (ŁĄCZNIE)` sumują się do tej
samej kwoty co lista główna — przy wspólnej skali ich najdłuższy pasek i tak
byłby pełny, a krótkie zrobiłyby się nieczytelne. Poprawiony został komentarz.

**Odznaka jako czwarta komórka wiersza albo osobny węzeł w etykiecie.** Oba
warianty były już tu próbowane przy `AUDYT-14` i oba upadły: komórka kładzie test
„wiersz to ranking, nie tabela", a węzeł wchodzi do `textContent` i nazwa zaczyna
brzmieć „HŁowca Wichrów". Zostaje `::before` na `.label`.

**Wspólna klasa `.window-chrome` doklejana w JS.** Wymagałaby zmiany w dwóch
plikach przy każdym nowym oknie i dałoby się o nią zapomnieć. Reguła
`.panel, .archive` nie daje się zapomnieć: nowe okno albo jest na liście, albo
nie wygląda jak okno.

**Zmiana `--warning` na barwę z `SERIES_COLORS`.** `#fab219` nie występuje
w palecie, co wyglądało na omijanie walidacji. Ale reguła „barwy wyłącznie
z `SERIES_COLORS`" dotyczy palet DANYCH (postacie, rodzaje obrażeń), gdzie liczy
się wzajemny rozstęp. `--warning` jest barwą chrome'u, nie serią — zostaje.
Usunięta została natomiast rozjeżdżająca się wartość zapasowa w archiwum.

**`--mine` / `--enemy` rozbite na osobne tokeny dla wygranej i przegranej.**
Wyglądało na dwie semantyki w jednej parze. Przy bliższym spojrzeniu to jeden
podział: zielone znaczy „poszło po naszej myśli", czerwone „nie poszło" — strony
walki są jego przypadkiem, tak jak wynik. Zapisane w komentarzu przy tokenie,
razem z warunkiem: trzecie znaczenie ma być sygnałem, że potrzebny jest osobny
token, a nie szersza interpretacja.

## Plan wdrożenia

1. `src/style.ts` — arkusz obu okien, tokeny, `.rows .row`; oba okna przestają
   wstrzykiwać własne arkusze.
2. `appendBreakdown` dostaje `professionFor`; trzy wołania rozstrzygają, czy ich
   lista wymienia postacie.
3. Dokumenty w tej samej rundzie: `UX.md §6`, sprostowania, zamknięcie `R7`.

## Weryfikacja

**Zestaw selektorów przed i po wydzieleniu arkusza: 113 i 113**, a jedyne
różnice to dokładnie te zamierzone (`.row` → `.rows .row`, chrome scalone
w `.panel, .archive`). To był główny strażnik przy przenoszeniu 440 linii CSS.

Nowe testy, **każdy sprawdzony mutacją**:

- wiersze `OD KOGO` niosą literę profesji swojej postaci, a `.label` zostaje
  DOKŁADNIE nazwą → zapala się po zdjęciu wywołania `markProfession`;
- barwa paska i litera pochodzą z tej samej profesji → zapala się, gdy odznakę
  liczy osobny predykat;
- wiersze umiejętności i `TYP OBRAŻEŃ` odznaki nie mają;
- doczepienie archiwum nie dokłada drugiego `<style>` → zapala się po
  przywróceniu wstrzykiwania;
- chrome okna opisuje jedna reguła → zapala się po dodaniu własnego tła
  w `.archive`;
- każdy token pada raz jako deklaracja → zapala się przy zdublowanym tokenie;
- wartości wspólne nie stoją z palca (`#24242a`, `rgba(22, 22, 26,` — po jednym
  wystąpieniu).

Strażnik kontrastu z `A14` przeżył przeprowadzkę bez osłabienia: `styleOf` czyta
teraz wartość PRZEZ token, zamiast dostać ją wpisaną w test. Sprawdzone dwiema
mutacjami — podniesienie krycia `.bar` do dawnego `0.85` i rozjaśnienie
`--track` zapalają go tak samo jak przedtem.

Brama po całej rundzie: **704 zielone / 0 błędów**, `tsc --noEmit` czysto.

## Co zostaje otwarte

- **`R7` zamknięte tylko w części „wydzielić `STYLE`".** Pozostałe wiersze
  tabeli granic cięcia w `SOLID §8` (`format.ts`, `metrics.ts`, `dom.ts`,
  `tooltip.ts`, `rows.ts`, `panel-window.ts`) stoją dalej, a ich numery linii są
  sprzed trzech rund i wymagają odczytu przed użyciem.
- **Profesja ma nadal dwie prezentacje**: literę na odznace (ranking, rozbicie)
  i pełną nazwę tekstem w dymku. To nie jest rozjazd — dymek jest miejscem na
  pełne brzmienie — ale nic tych dwóch miejsc ze sobą nie wiąże wizualnie.
- **Pełne zakresowanie arkusza per okno.** Zawężony został `.row`, bo to on
  kolidował. `header`, `button` i `.grow` są dalej globalne w shadow roocie —
  dziś celowo (oba okna mają wyglądać tak samo), ale trzecie okno o innym
  nagłówku odkryje to tak samo, jak archiwum odkryło `.row`.
- **`AUDYT-52`** — zrzuty w `README` po tej rundzie są nieaktualne o jedną
  zmianę więcej.

## Zmiany wpisu

- **2026-08-02** — powstał i został wdrożony w tej samej rundzie.
