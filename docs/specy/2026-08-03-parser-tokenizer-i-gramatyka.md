# Parser od zera — tokenizer i gramatyka zamiast katalogu wzorców

Status: projekt

## Problem

`src/parser.ts` ma 960 linii, w tym 33 nazwane stałe regexowe, 23 wzorce
w `RE_INFO` i 6 wpisanych w miejscu użycia. Nie jest zepsuty: na całym korpusie
(24 fixture'y, **9379 linii znaczących**, 5523 unikalne) daje **4859 zdarzeń
i zero `unknown`**, w obu drogach — tekstowej i przez DOM. Problem nie polega na
tym, że liczy źle. Polega na trzech rzeczach, z których każdą da się pokazać
palcem.

**1. Kolejność drabiny jest nośna i niejawna — i wiadomo to od miesiąca.**
`SOLID §6` mówi wprost: „**OCP — dyspozytor to sztywna drabina `if` z ZNACZĄCĄ,
niejawną kolejnością.** 🔴 Obrażenia PRZED modyfikatorem, leczenie/DoT PRZED
`endBlock` — wiedza w komentarzach, nie w strukturze. To bezpośrednie źródło
§4.3." Proponowany tam fix — tablica reguł i „stan bloku przekazywany jako jawny
kontekst parsera, co **rozdziela tokenizację od domykania bloków**" — stoi
w roadmapie jako `R4`.

Pomiar dokłada do tego rzecz, której rejestr nie znał. Przepisałem wszystkie 20
klas wzorców i puściłem KAŻDY po każdej linii korpusu, zamiast przerywać na
pierwszym trafieniu:

```
ile wzorców trafia w linię:  { 1: 9355,  2: 24 }
kolizje (≥2 wzorce):            24  strike-note + info
linie bez ŻADNEGO wzorca:        0
```

Czyli **kolejność drabiny nie robi na korpusie prawie nic** — wzorce tworzą
podział, nie listę prób. Jedyna kolizja to `Przerwanie ciosu specjalnego.`,
wpisane naraz w `RE_STRIKE_NOTE` i w `RE_INFO`, i ta jest świadoma (komentarz:
„poza blokiem ataku (w bloku łapane wcześniej)"). To zmienia ocenę ryzyka całej
rundy — nie trzeba odtwarzać kolejności, bo kolejność niczego nie trzyma — i daje
niezmiennik, którego dziś nie ma nigdzie: **żadna linia nie pasuje do dwóch
reguł.**

**2. Dwie dziury (spisane jako trzy), tej samej rodziny: `(.+?)` przyjmuje cokolwiek.**
Nie hipotezy — przepuszczone przez dzisiejszy `parse()`:

| wejście | co daje dziś | czego nie ma |
|---|---|---|
| `Wilk(50%) otrzymał kwiaty obrażeń` | `attack`, `hits [{raw:75, applied:0}]` | `unknown` — wygląda jak cios wytłumiony do zera |
| `Kamil(100%) uderzył z siłą kwiaty` | `attack`, `hits [{raw:10, applied:10}]` | `unknown` — siła surowa wzięta z linii przyjętych |
| ~~`Uleczono Kamil o o 500 punktów życia.`~~ | ~~`heal`, cel `"Kamil o"`~~ | **SKREŚLONE — patrz niżej** |

Pierwsze dwa to **ciche przekłamanie liczby przy zerowym `unknownLines`** —
dokładnie tryb awarii, przed którym broni cała reszta tego pliku, i którego
`isPhantomHit` nie łapie, bo trafienia są niezerowe.

> ⚠️ **Sprostowanie 2026‑08‑03 (ta sama data — wpis stał tak kilka godzin).**
> Trzeci wiersz był **nieprawdą** i nie wolno go cytować. `"Kamil o"` JEST
> poprawnym odczytem tej linii: format to `Uleczono {NAZWA} o {N} punktów
> życia`, więc postać `Kamil` daje jedno " o ", a postać `Kamil o` — dwa.
> Przy dwóch separatorach istnieje dokładnie JEDEN podział zgodny z formatem,
> a intencji „chodziło o Kamila" w linii nie ma i nie da się jej odzyskać.
> Rozstrzyga to leniwy kwantyfikator **plus kotwica `(\d+)` zaraz za
> separatorem**: krótszy podział odpada, bo po nim nie stoi liczba. Sprawdzone
> na siedmiu kształtach (`Agent 007`, `Coś o Czymś`, `Kamil o 5`, jeden i dwa
> separatory) — każdy wychodzi poprawnie, a `Uleczono Kamil o 500 600 punktów
> życia.` idzie w `unknown`. Zamrożone w `tests/parser.test.ts`, w sekcji
> „leczenie kierowane", żeby nikt tego nie „naprawił" drugi raz.
>
> Skąd wzięła się pomyłka: komentarz przy `RE_HEAL_TARGET` przyznaje się do
> ryzyka („nazwa KOŃCZĄCA się na » o « i przechodząca w liczbę nie [jest
> bezpieczna] — takiej w korpusie nie ma i nie bronimy się przed nią na
> zapas"), a spec wziął tę ostrożność za potwierdzenie defektu, zamiast
> sprawdzić wejście. **Wniosek na przyszłość: „wzorzec zawiera `(.+?)`" nie
> jest dowodem dziury. Dowodem jest wejście, dla którego istnieje INNY podział
> zgodny z formatem.**

Segment obrażeń, opisany dziś jako `(.+)`, w korpusie **ani razu** nie jest
czymkolwiek innym niż liczbami: **0 wyjątków na 2816 segmentów** (rozkład: 1282
segmenty jednoliczbowe, 1239 dwu-, 287 trzy-, 8 czteroliczbowych). Zawężenie
„tu stoją wyłącznie liczby" jest więc darmowe.

> **Przeliczone 2026‑08‑03 przy wdrażaniu zawężenia — szerzej i z inną
> liczbą: 10 808 segmentów, 0 wyjątków** (rozkład: 4870 jednoliczbowych, 4758
> dwu‑, 1147 trzy‑, 32 cztero‑, 1 pięcioliczbowy). Rozbieżność z 2816 nie jest
> błędem żadnego z pomiarów, tylko innym zakresem: tamten liczył jedną drogę
> i jedną wersję linii, ten liczy **obie drogi (`raw.txt` i `log.html`) razy
> obie wersje linii (ze znacznikami żywiołu i bez)** — bo `RE_ATTACK`
> i `RE_TAKEN` biegną po linii dwa razy i zawężenie musi trzymać w obu.
>
> **Rzecz, której węższy pomiar NIE MÓGŁ zobaczyć, a która wywraca naiwne
> zawężenie:** na ścieżce przez DOM liczby w segmencie **nie są rozdzielone
> spacją** — `extractText` skleja sąsiednie węzły i wychodzi `-487␁d-503␁a`.
> Wzorzec `liczba( liczba)*` odrzucał **2870 z 10 808** segmentów, wyłącznie
> z `log.html`. Separatorem jest znak liczby, nie odstęp.

**3. Żywioł jedzie przemytem, a regex musi wykonać się dwa razy.** `source.ts`
dokleja do liczby `ELEMENT_MARKER` i literę, bo klasa CSS nie przeżywa drogi do
parsera. Parser trzyma każdą linię w dwóch wersjach i odpala ten sam wzorzec
ponownie:

```ts
const hits = buildHits(pending.rawDamages, toDamages(RE_TAKEN.exec(marked)?.[3] ?? ""), mods);
rawDamages: toDamages(RE_ATTACK.exec(marked)?.[3] ?? attack[3]!),
```

Że znacznik nie wycieknie do nazwy, pilnuje dziś komentarz i dyscyplina
(`parser.ts:747`), nie typ. Dotyczy to 4626 liczb w korpusie HTML.

**Czego zepsutego NIE MA.** `classifyModifiers` jest już stringowe, nie regexowe.
`pairApplied`, `buildHits` i `isPhantomHit` to algorytmy niezależne od techniki
dopasowania — ta runda ich nie dotyka. Czujka `unknown` jest dziś szczelna na
całym korpusie. I `RE_CARRIES_HP` **nie jest** hackiem do usunięcia: pomiar,
który go uzasadnia, powtórzyłem na urosłym korpusie — **4430 linii z `(N%)`,
z nawiasem przyklejonym do nazwy, zero ze spacją przed nawiasem** (komentarz
w kodzie mówi 2794; korpus urósł, wniosek się trzyma).

## Rozwiązanie

Trzy warstwy, trzy pliki, zależność jednokierunkowa. Szew biegnie po **stanie**:
lekser i gramatyka są bezstanowe, stan zostaje tam, gdzie był.

```
tekst ze znacznikami ──► lekser.ts     ──► Wiersz { tekst czysty, Token[] }
                     ──► gramatyka.ts  ──► Zdanie | null      (bezstanowe)
                     ──► parser.ts     ──► BattleEvent[]      (stan bloku, unknown, lineNo)
```

**`src/lekser.ts` — leksyka totalna.** Jeden przebieg po znakach; funkcja nie ma
trybu porażki, każdy znak wchodzi do jakiegoś tokenu. Tokeny: `slowo`, `klucz`,
`liczba`, `zycie`, `znak`, `koniec`; każdy z przesunięciami `od`/`do` w tekście
**już oczyszczonym ze znaczników**.

Trzy rozstrzygnięcia w tej warstwie, każde zamykające jedną z dziur wyżej:

- **`zycie` jest tokenem tylko wtedy, gdy `(liczba%)` jest PRZYKLEJONE** do
  znaku niebiałego. To awansuje `RE_CARRIES_HP` ze strażnika doklejonego z boku
  na regułę leksykalną — a przy okazji likwiduje niezgodność dwóch wzorców, które
  dziś mówią co innego: `ACTOR` dopuszcza przed nawiasem **dowolny** znak
  (`(.+?)`), `RE_CARRIES_HP` żąda **niebiałego** (`\S`). Wolne rozróżnienie
  z komentarza — „życie przykleja się do nazwy, wartość efektu stoi po spacji" —
  przestaje być obserwacją, a staje się definicją.

  **To jedyne miejsce w całej rundzie, które ODBIERA przypadek działający dziś**,
  i trzeba to powiedzieć wprost zamiast chować pod „zawężenie". Sprawdzone na
  żywym parserze: `Kamil (100%) uderzył z siłą +75` — ze spacją przed nawiasem —
  jest dziś poprawnym ciosem ze źródłem `Kamil`, bo `ACTOR` zjada spację do
  nazwy i `trim()` ją zdejmuje. Po zmianie to `unknown`. W korpusie takich linii
  jest **zero na 4430**, a gdyby gra kiedyś zaczęła odsuwać nawias, awaria będzie
  natychmiastowa i GŁOŚNA zamiast cichej — czyli po stronie, którą to repo
  wybiera świadomie. Ale to jest wybór, nie darmowy zysk, i przy pierwszym
  zgłoszeniu „panel przestał liczyć" jest pierwszym miejscem do sprawdzenia.
- **Znacznik żywiołu wchodzi DO ŚRODKA tokenu `liczba`** jako `kodZywiolu`.
  Lekser czyta tekst ze znacznikami raz i wystawia tekst bez nich. `clean()`,
  para `marked`/`line` i podwójne `exec` znikają; „znacznik nie wycieka do nazwy"
  przestaje być dyscypliną, a zaczyna być własnością typu.
- **Znak `+`/`-` NIE wchodzi do liczby.** W całym parserze znak nie niesie
  znaczenia (`toDamages` robi `Math.abs`, `RE_ABILITY_DAMAGE` ma `[+-]?`, przy
  `RE_HP_LOST` stoi akapit o tym, że minus jest ozdobnikiem, poparty siedmioma
  pomiarami puli życia), a reguła modyfikatora potrzebuje go jako samodzielnego
  pierwszego tokenu. Jedna decyzja obsługuje oba. Skutek uboczny wart odnotowania:
  strażnik separatora tysięcy przeżywa nietknięty — `+10 000` daje dwie liczby,
  więc `isPhantomHit` zgłasza tak samo jak dziś.

Odmiana rodzaju idzie **tablicą form powierzchniowych**, nie generowaniem:
`uderzył`, `uderzyła`, `uderzyło`, `uderzył(a)` → jeden `klucz`. To ściślej niż
dzisiejsze `GENDER = (?:a|o|\(a\))?` doklejane do rdzenia, i uwidacznia
niespójność, którą kod przyznaje w komentarzu: `RE_DEFEAT` dopuszcza dodatkowo
`y`, reszta nie — „niespójność była wewnętrzna, nie wynikała z formatu logu".

**Nazwa NIE jest tokenem** i to jest rozstrzygnięcie, nie przeoczenie. Nazwa
gracza nie ma żadnej własności leksykalnej — i to jest pomiar, nie przeczucie.
Ze składów korpusu wychodzą **74 unikalne nazwy, z czego 8 zawiera słowo, które
gdzie indziej w logu jest kotwicą**:

```
Zbieracz Ziół z Rosy  Utopiony w Kotle      nie sypiam nocami    Maleńki na Długach
Łowca z Przedmieścia  Antek to Wyłudzacz    Tylko po Zwycięstwo  I Zasada Zachowania
```

⚠️ **Te osiem nazw to ZASTĘPNIKI, wstawione 2026‑08‑06.** Stały tu prawdziwe
pseudonimy ośmiu graczy, a repozytorium jest publiczne (`NOTICE.md`). Zastępniki
niosą DOKŁADNIE te własności leksykalne, o które w tym akapicie chodzi — kotwicę
`z`, `w`, `na`, `to`, małą literę na początku, przyimek `po` i wiodące `I`.
Pomiar (**74 unikalne nazwy, 8 kolidujących**) jest prawdziwy i pochodzi
z korpusu, którego w repo nie ma od 2026‑08‑04; nazw i tak nie dało się już
zweryfikować.

Ostatnie dwa są rozstrzygające. `Tylko po Zwycięstwo` niesie `po` — czyli
DOSŁOWNIE przyimek, którym `RE_DOT` odróżnia „obrażeń **od** trucizny" od
„obrażeń **po** zranieniu". `I Zasada Zachowania` zaczyna się od `I`, spójnika
rozdzielającego nazwy w składzie. Każda reguła leksykalna „maksymalny ciąg wyrazów" zjadłaby
kotwicę (`z siłą`, `o`, `uderzył`) albo rozcięła nazwę na spójniku. Nazwę
odróżnia **wyłącznie pozycja względem kotwicy**,
a pozycja to gramatyka. Powstaje więc dopiero tam, przez `nazwaDo(kotwica)`,
i jest **wycinkiem tekstu źródłowego**, nie sklejeniem tokenów — bo tylko wycinek
daje bajtową tożsamość z dzisiejszymi grupami, czego wymaga strażnik
równoważności, i tylko wycinek odtworzy `+Piętno bestii: atak +503` czy
`+Kombinacja x3!` bez zgadywania odstępów.

**`src/gramatyka.ts` — reguły jako dane.** Tablica `REGULY`, każda z `nazwa`,
`wymaga` (klucze, bez których reguła nie ma prawa trafić) i `dopasuj(k: Kursor)`.
Pozycja w tablicy JEST kolejnością — dana, nie własność kodu. To zamyka `SOLID §6`
i `R4`. Gramatyka zwraca `Zdanie` (bezstanowy opis linii), **nie** `BattleEvent`:
zdarzenie wymaga stanu (`ability?.actor === pending.source`, `self: block?.actor
=== target`, `targetHpPct: null` przy leczeniu kierowanym), więc powstaje piętro
wyżej. Ta granica jest powodem, dla którego pliki są trzy, a nie dwa.

Konsolidacje, które ten kształt wymusza i które są czystym zyskiem: `RE_DOT`
i `RE_DOT_TAKEN` — dwa szyki tego samego zdarzenia, dziś dwie prawie identyczne
gałęzie różniące się numerem grupy — dają jedno `tykniecie`; cztery szyki
leczenia dają jedno `leczenie` z polem `szyk`; `Przerwanie ciosu specjalnego.`
przestaje być zdublowane, a o tym, czy to modyfikator ciosu czy tło, decyduje
stan `pending`. Dopiero ta ostatnia zmiana pozwala w ogóle postawić niezmiennik
„co najwyżej jedna reguła" — bo likwiduje jedyne 24 kolizje w korpusie.

**`src/parser.ts` — stan.** Maszyna stanów (`pending`, `ability`, `loose`),
`sideEvent`, `classifyModifiers`, `pairApplied`, `buildHits`, `isPhantomHit`,
`parseParticipants`, `ELEMENTS`, `canonicalLine` — **zostają, co do logiki bez
zmian**. Zmienia się wyłącznie to, skąd biorą dane. Publiczne API (`parse`,
`canonicalLine`) nie rusza się; zależy od niego siedem modułów.

**Dlaczego to nie osłabia wąskości** — to jedyne realne ryzyko rundy, więc pięć
mechanizmów, z czego cztery mocniejsze niż dzisiejsze:

1. **Lekser nie ma reguły „wszystko inne" produkującej token znaczący.**
   Nierozpoznany tekst zostaje `slowo`/`znak`, a te da się skonsumować wyłącznie
   wewnątrz `nazwaDo` albo `reszta` — czyli w regule, która JUŻ zaangażowała
   klucze. Tokenizer stałby się catch-allem tylko wtedy, gdyby istniała reguła
   przyjmująca sam strumień śmieci; takiej nie ma.
2. **`wymaga` jest deklarowane i testowalne.** „Która reguła jest szeroka"
   przestaje być pytaniem wymagającym przeczytania 35 wzorców, a staje się
   jednym `expect`: reguł bez kotwicy ma być dokładnie jedna — `modyfikator`.
3. **Segment obrażeń przestaje być `(.+)`.** `Kursor.liczby()` żąda
   `(znak? liczba)+` i nic poza tym. **Zrobione 2026‑08‑03 NIEZALEŻNIE od tej
   rundy** — `DAMAGE_SEGMENT` w dzisiejszym `parser.ts`, zmierzone na 10 808
   segmentach (obie drogi, obie wersje linii) z zerem wyjątków i zerem zmian
   w korpusie. Ten punkt przestaje więc być argumentem ZA przepisaniem: zysk
   już jest zebrany, a gramatyka ma go tylko nie stracić.
4. **Niezmiennik „żadna linia nie pasuje do dwóch reguł"** — dziś nie do
   postawienia, bo lista wzorców nie jest obiektem, po którym da się przejść.
   Poszerzenie dowolnej reguły zapala się natychmiast, bo zaczyna zachodzić na
   sąsiednią. Regex poszerzony tak, że łyka cudzy kształt, dziś przechodzi bez
   śladu — stoi wcześniej w drabinie i po prostu wygrywa.
5. **Reguła musi dojść do `koniec()`.** Częściowe dopasowanie to porażka.
   Dziś trzy wzorce `RE_INFO` łapią się w ŚRODKU linii bez kotwicy `^`
   (`/\sspowija się\s/`, `/\sprzygotowuje się do wykonania\s/`,
   `/ - atak w martwego przeciwnika\.?$/`) i nikt tego nie widzi; po zmianie
   każde takie poluzowanie musi być jawnym `reszta()` w treści reguły.

## Odrzucone warianty

**Zostawić regexy, tylko posprzątać: nazwane grupy i podział pliku.**
Najsilniejszy konkurent i trzeba to powiedzieć uczciwie — kosztuje ułamek,
ryzyko bliskie zeru, kupuje większość czytelności. Przekreśla go to, że nazwane
grupy naprawiają NOTACJĘ, a nie dwuznaczność formatu. ⚠️ Przykład, który tu
stał — `(?<cel>.+?)\s+o\s+` „rozcina `Uleczono Kamil o o 500…` tak samo źle
jak dziś" — padł razem ze sprostowaniem w „Problemie": tamta linia rozcina się
POPRAWNIE. Argument o notacji zostaje, ale bez tej ilustracji, a wraz z nią
osłabł: po zamknięciu segmentu obrażeń poza regexem nie ma dziś ani jednego
zmierzonego wejścia, które by go podpierało. Nie znikają dwa światy
`marked`/`line` ani podwójne `exec`. I nie da się postawić niezmiennika „co
najwyżej jedna reguła", bo katalog wzorców nie jest obiektem, po którym da się
iterować — a to on jest największym pojedynczym zyskiem tej rundy. **Wariant do
powrotu, jeśli strażnik równoważności pokaże, że pełna zgodność jest
nieosiągalna** — wtedy to plan B, nie porażka.

**Sama tablica reguł nad regexami — czyli `R4` dosłownie.** Zamyka OCP i pozycję
z roadmapy mniejszym kosztem. Zostawiał dziury z tabeli w „Problemie", bo one
nie biorą się z kolejności prób, tylko z tego, że wzorzec opisuje segment liczb
jako „cokolwiek".

⚠️ **Ten powód odrzucenia ZNIKNĄŁ 2026‑08‑03** — i to jest dokładnie ta klasa,
o której akapit mówił „nie zniknie sam". Zniknął, bo zawężenie dało się zrobić
bez przepisywania czegokolwiek. Wariant „sama tablica reguł" wraca więc do gry
jako tańszy kandydat na `R4` i wymaga ponownego zważenia, zanim ktoś ruszy
pełne przepisanie.

**Kombinatory parserów.** Deklaratywne i zwięzłe, ale dokładają warstwę typów,
a przy porażce mówią „nie pasuje" zamiast „nie pasuje w tym miejscu" — przy
41 regułach diagnostyka jest ważniejsza od zwięzłości zapisu. Kandydat do
powrotu, gdyby gramatyka urosła dwukrotnie.

**Generator gramatyki (peggy, nearley, chevrotain).** Trzy powody, pierwszy
twardy: `build.ts` skleja userscript w jeden plik bez zależności runtime'owych,
więc generator to nowa zależność i nowy krok budowania dla 41 reguł. Drugi:
„nazwa to dowolny tekst" jest dokładnie tym, co generator CFG obsługuje
NAJGORZEJ — zakłada lekser umiejący ograniczyć token, a takiego tu nie ma.
Trzeci: 43 % dzisiejszego pliku to komentarze niosące powody decyzji i pomiary,
a w gramatyce generowanej nie mają gdzie zamieszkać.

**Ręczny skaner bez warstwy tokenów.** Każda reguła sama czyta znaki, więc
„liczba ze znakiem i żywiołem" powstaje kilkanaście razy. Odrzucony przez DRY,
nie przez wygodę pisania.

**Nazwa jako token leksera.** Odrzucony pomiarem: **74 unikalne nazwy w składach
korpusu, z czego 8 zawiera słowo, które gdzie indziej jest kotwicą** — pełna
lista w „Rozwiązaniu". Podwariant — **słownik nazw zebrany
z linii otwierającej i podany lekserowi** — odrzucony osobno i z innego powodu:
`session.ts` jawnie obsługuje przypadek „log traci treść od góry, a dorasta na
dole", więc linia składu bywa już poza buforem, gdy przychodzą kolejne linie.
Parser nie ma prawa zakładać, że ją widział.

**Znacznik żywiołu jako osobny token obok liczby.** Odtwarza dzisiejszy problem
wewnątrz strumienia: każdy wycinek (`nazwaDo`, `reszta`) musiałby wiedzieć, że
ma go pominąć — a rozproszenie tej wiedzy po 35 wzorcach jest właśnie tym, co
wymusiło `clean()` i podwójne `exec`.

**Usunąć strażnik `RE_CARRIES_HP` jako zbędny po tokenizacji.** Sprawdzone
i odrzucone. Kusi, bo `-507 obrażeń otrzymał(a) X(75%)` „przecież zaczyna się od
liczby" — ale przy znaku jako osobnym tokenie zaczyna się od `znak("-")`,
identycznie jak `+14 energii`. Rozróżnia je wyłącznie obecność tokenu `zycie`.
Rozważona alternatywa „patrzeć na słowo za liczbą (`energii` vs `obrażeń`)" to
biała lista zasobów, czyli catch-all, który to repo już raz z `RE_INFO` usunęło
z osobnym uzasadnieniem. Strażnik zostaje, zmienia tylko język na tokenowy.

**Gramatyka blokowa zamiast linia-po-linii** (`cios modyfikator* przyjete` jako
produkcja). Kusi, bo `PendingAttack`, `flushPending` i `flushLoose` rozpuściłyby
się w regule. Odrzucony na trzech rzeczach: (a) subtelności maszyny stanów są
SEMANTYCZNE, nie składniowe — własność zapowiedzi, doklejanie `loose` do
poprzedniego zdarzenia, `flushPending` emitujące `unknown` z `lineNo` linii
OTWIERAJĄCEJ — więc trzeba by je przenieść, nie usunąć; (b) „zgłoś linię jako
`unknown` i jedź dalej" jest w podejściu liniowym darmowe, a w blokowym wymaga
jawnej resynchronizacji; (c) zmieniłoby się, KTÓRA linia trafia do `unknown`,
więc strażnik równoważności przestałby być osiągalny — a to jedyne narzędzie na
diff tej wielkości. **Kandydat na osobną rundę PO tej**, gdy strażnik już
istnieje.

**Przepisanie w miejscu, bez strażnika różnicowego.** Odrzucone regułą z
`AGENTS.md`: „zdarzyły się tu testy zielone i puste". Przy diffie ~960 usuniętych
i ~1140 dodanych linii przegląd czytający linia po linii jest fikcją.

## Plan wdrożenia

Każdy commit przechodzi `bun run check` osobno. Typy dobrane pod strażnika
z `tools/wydanie.ts` (`refactor` i `test` zwalniają z wpisu w `[Niewydane]`).

1. **`test(parser): różnicowy strażnik równoważności na zamrożonej kopii`** —
   `tests/pomocnicze/parser-zamrozony.ts` (dosłowna kopia dzisiejszego pliku,
   tymczasowa; w komunikacie sha, z którego wzięta) + test różnicowy. Zielony
   z definicji, to punkt odniesienia.
2. **`refactor(lekser): tokenizer linii logu`** — `src/lekser.ts` + testy.
   Nikt go jeszcze nie woła.
3. **`refactor(gramatyka): kursor, kotwice i reguły bezstanowe`** —
   `src/gramatyka.ts` + testy. Nadal nieużywany. **Oba niezmienniki (kotwica
   każdej reguły, żadna linia w dwie reguły) muszą przejść, zanim ktokolwiek
   ruszy `parser.ts`.**
4. **`refactor(parser): rozpoznawanie linii przez gramatykę zamiast 35
   wzorców`** — commit ryzykowny. Znikają wszystkie `RE_*`, `clean`, `ACTOR`,
   `GENDER`, `PCT`, `modifierOf`, para `marked`/`line`. Maszyna stanów bez
   zmian logiki.
5. **`refactor(parser): usunięcie zamrożonej kopii i strażnika różnicowego`** —
   zostaje trwały, lekki manifest korpusu.
6. ~~**`fix(parser): segment obrażeń i procent życia przestają przyjmować
   dowolny tekst`**~~ — **ZROBIONE 2026‑08‑03, poza tą rundą.** Zawężenie
   segmentu obrażeń weszło jako `DAMAGE_SEGMENT` w dzisiejszym `parser.ts`,
   z fuzzem mutacyjnym (`tests/mutanty.test.ts`) jako strażnikiem: 1961 z 1995
   zmierzonych ucieczek zamkniętych jedną zmianą, zero zmian w korpusie, koszt
   wydajnościowy 20,10 → 20,15 ms (szum). Trzecie „zawężenie" nie istnieje —
   patrz sprostowanie w „Problemie".
7. **`perf(parser): pamięć rozpoznanych linii`** — `Map<string, Zdanie | null>`,
   bezpieczna wyłącznie dlatego, że `rozpoznaj` jest bezstanowe. `Session.update`
   woła `parse` na CAŁYM logu przy każdej mutacji DOM (`session.ts:303`),
   a korpus ma 9379 linii przy 5523 unikalnych — w trwającej walce trafienie
   w pamięć zbliża się do 100 %.
8. **`docs(specy)`** — status tego wpisu na „wdrożone", tabela w
   `docs/specy/README.md`, diagram układu w `AGENTS.md`, zamknięcie `SOLID §6`
   i `R4`.

## Weryfikacja

**Sam korpus nie wystarcza i to jest sedno.** Korpus ma ZERO `unknown`, więc nie
mówi ani słowa o tym, które linie NIE są rozpoznawane — czyli o dokładnie tej
granicy, którą ta zmiana rusza najmocniej. Strażnik oparty tylko na nim byłby
zielony i pusty w najważniejszym miejscu. Stąd trzy zbiory:

- **(a) Korpus, obie drogi.** 24 pliki `raw.txt` i 11 `log.html` przez
  `extractText` — droga przez DOM niesie znaczniki żywiołu, a te zmieniają
  w tej rundzie właściciela. Porównanie `toEqual` na pełnych `BattleEvent[]`
  (4859 zdarzeń), nie na sumach: sumy zgadzały się już przy błędzie z `§4.19`.
- **(b) Mutanty — granica `unknown`.** Z każdej z 9379 linii ~5 wariantów
  generowanych DETERMINISTYCZNIE (bez losowości, żeby test był powtarzalny):
  usunięty znak, zamienione sąsiednie słowa, zdublowana liczba, wstawiony
  i usunięty znacznik żywiołu, dostawiona spacja przed `(N%)`. Oba parsery, diff.
  To jedyny dowód, że przepisanie nie POSZERZYŁO rozpoznawania. Koszt jest do
  udźwignięcia: zmierzony `parse()` to **20,66 ms na cały korpus** (2,85 ms na
  największym fixture, 2032 linie), czyli ~2,2 µs/linię — całość poniżej sekundy
  na parser.
- **(c) Kształty syntetyczne** z `tests/parser.test.ts` (`describe("odporność na
  zmianę formatu")`, `describe("głośne awarie zamiast cichych")`) — zostają jak
  są, już są dowodem na granicę.

**Że strażnik potrafi paść** — przed krokiem 4, na zielonym strażniku, trzy
mutacje, każda zapalająca inny zbiór:

| mutacja w nowym parserze | co ma paść |
|---|---|
| `nazwaDo` zachłanne zamiast leniwego | (a) — `Uleczono` i `ACTOR`, konkretne fixture'y |
| `Kursor.liczby()` przyjmuje `slowo` | (b) — mutanty; (a) zostaje zielone |
| token `zycie` bez warunku przyklejenia | (c) — `+Wampiryzm (10%)` rozpada się na trzy `unknown` |

Ostatnia jest szczególnie warta odpalenia, bo dokładnie ten defekt repo już raz
miało (`§4.18`, komentarz przy `RE_CARRIES_HP`).

Wszystkie dzisiejsze pętle po korpusie zostają nietknięte i **nie wolno ich
osłabić ani o jedną asercję**: „każda linia rozpoznana", różnicowy `html ↔ raw`,
„rozbicia domykają się ze skalarami", „ciosy i uniki sumują się do liczby
ataków", sesja ze wszystkich walk naraz.

**Pomiar wydajności przed i po, tą samą sondą.** Baseline wyżej jest z tej rundy;
sondy w `tools/` nie ma i powstaje razem z krokiem 1.

## Co zostaje otwarte

- **Wydajność najprawdopodobniej spada, i to w wątku gry.** Tokenizacja znak po
  znaku w JS-ie przegra z natywnym silnikiem regexów V8 — realistycznie 2–3×,
  czyli 2,85 → ~7 ms na dużej walce, przy pełnym przeparsowaniu bufora po każdej
  mutacji DOM (`SOLID §4.10`). Krok 7 to łagodzi, więc **runda nie jest zamknięta
  bez niego**. Jeśli pomiar po kroku 4 wyjdzie gorszy niż 3×, decyzja o powrocie
  do wariantu „posprzątać regexy" jest nadal otwarta — po to strażnik istnieje.
- **Kod rośnie mimo znikających regexów**: ~960 → ~1140 linii w trzech plikach.
  Najgorszy stosunek mają komunikaty tła — `RE_DRAW` to jedna linia, reguła to
  cztery; przy 23 wzorcach `RE_INFO` daje to ~60 linii przyrostu na czymś, czego
  nikt nie czyta.
- **Nowa, ostra klasa awarii: mapowanie przesunięć.** Lekser czyta tekst ze
  znacznikami, a wystawia przesunięcia w tekście czystym. Pomyłka o jeden ucina
  pierwszy albo ostatni znak KAŻDEJ nazwy w logu. Dziś odpowiednikiem jest jedna
  linia `clean()` i nie ma tam czego pomylić. Test na wycinek po liczbie ze
  znacznikiem jest obowiązkowy, nie miły.
- **Dopisanie nowego kształtu logu przestaje być tanie**: dziś jeden regex i jedna
  gałąź, po zmianie forma do `KLUCZE`, reguła do `REGULY`, może wariant `Zdanie`,
  może gałąź w `parser.ts`. `docs/specy/README.md` mówi „nie pisz speca do
  dopisania wzorca do parsera" — ta zasada lekko się po tej rundzie rozjeżdża.
- **Komentarze zostają rozdzielone.** Akapit przy `RE_CARRIES_HP` z pomiarem
  4430 linii należy jednocześnie do tokenu `zycie` i do reguły `modyfikator`;
  akapit przy `pairApplied` ze sprostowaniem z 2026-08-03 zostaje w `parser.ts`,
  ale odsyła do rzeczy, które przeniosły się piętro niżej. Mitygacja jest tylko
  dyscyplinarna: przenieść dosłownie, nie „streścić".
- **„Bez wyrażeń regularnych" nie jest prawdą literalnie.** `normalize()`
  i `canonicalLine()` zostają na `/\[\/?[a-zA-Z]+\]/g` i `/\s+/g`, `DAMAGE_CLASS`
  w `source.ts` też. Zdejmowanie bbcode'u to przygotowanie wejścia, nie gramatyka.
  Deklaracja dotyczy rozpoznawania zdań i tylko jego.
- **`bun run check` zwalnia.** Fuzz różnicowy plus niezmiennik „co najwyżej jedna
  reguła" (9379 linii × 41 reguł ≈ 385 tys. prób). Sekundy, nie minuty — ale
  kroki 1–5 żyją z tym przez całą rundę.
- **Rzeczy, których ta runda świadomie nie dotyka**: `SOLID §4.9` (`procs` nadal
  zbierają przyrosty zasobów), formy żeńskie nadal bez fixture'u z gry
  (`§4.8`, `ROADMAP`), rozjazd `damageAbsorbed` między tekstem a DOM-em — ten
  ostatni jest własnością `pairApplied` i logu, nie techniki parsowania, więc nikt
  nie ma prawa liczyć tu na darmową naprawę.

## Zmiany wpisu

- **2026-08-03** — powstał.
