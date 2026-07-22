# margometer

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.ts
```

```opis
Margometer jest programem, który ma być uruchamiany dla gry Margonem (gra przeglądarkowa), używając narzędzia tampermonkey, do śledzenia statystyk z walk. 
Powinna działać podobnie do SKADA lub dpsmeter z gry World of Warcraft, tylko że Margonem jest grą turową, więc wygladałoby to trochę inaczej.
Źródło statystyk to test z okna walki margonem, który jest parsowalny prze ze mnie i na podstawie tego wyliczane są odpowiednie wartości, 
leczenie, obrażenia zadane, obrażenia przyjęte, ilość stunów itd. (na sam start interesuje mnie tylko obrażenia zadanie i obrażenia przyjęte).
```

```jak ma wygladac ui
Chce miec toggle 'na turę'
Chce miec 3 taby filtrowania wedlug zespolow: Wszyscy, My, Oni.
Chce miec taby po: Zadanie obrazenia, Otrzymane obrazenia, Wyleczone
Zdane obrazenia maja miec widoki: 
    Ranking wszystkich; 
    pojedynczej postaci, gdzie pokazuje zadane wedlug postaci - klikam na rankingu zadane i widze;
    pojedynczej postaci, gdzie pokazuje zadane wedlug umiejetnosci - klikam na rankingu wedlug postaci i widze;
Otrzymane obrazenia maja miec widoki: 
    Ranking wszystkich; 
    pojedynczej postaci, gdzie pokazuje otrzymane wedlug postaci - klikam na rankingu otrzymane i widze;
    pojedynczej postaci, gdzie pokazuje otrzymane wedlug umiejetnosci - klikam na rankingu wedlug postaci i widze;
Wyleczone maja miec widoki: 
    Ranking wszystkich; 
    pojedynczej postaci, gdzie pokazuje wyleczone wedlug postaci - klikam na rankingu wyleczone i widze;
    pojedynczej postaci, gdzie pokazuje otrzymane wedlug umiejetnosci - klikam na rankingu wedlu gpostaci i widze;

Nie mam pomyslu na to, jak zrobic szybkie i latwe przeskakiwanei z tych widokow w poszczegolnych tabach, zadanie, otrzymane, wyleczone

```

## Znane ograniczenia

### Trucizna bez sprawcy

Linie typu `Postać traci 143 pkt. życia od trucizny.` **nie zawierają informacji, kto
truciznę nałożył.** W przeciwieństwie do `głębokiej rany` i `zranienia`, które mają
w logu odpowiadający im proc (`+Głęboka rana`, `+Zranienie (N)`), trucizna nie ma
żadnej linii nakładającej.

Sprawdzone w korpusie fixture'ów:

```
od trucizny      x15  ← brak proca
od ognia         x1   ← brak proca
od błyskawic     x2   ← brak proca
od głębokiej rany x2  ← +Głęboka rana
po zranieniu     x1   ← +Zranienie (N)
```

Obecne zachowanie: DoT przypisujemy sprawcy tylko wtedy, gdy po przeciwnej stronie
stoi dokładnie jeden przeciwnik (`opponentOf` w `stats.ts`). W innym wypadku obrażenia
lądują w `unattributedDotDamage`.

**Czy da się to obejść?** Nie wprost. Trucizna to właściwość broni
([pomoc.margonem.pl/index/view,372](https://pomoc.margonem.pl/index/view,372)), więc
otruć mógł tylko ten, kto faktycznie trafił cel — to zawęża krąg podejrzanych, ale
przy dwóch trafiających przeciwnikach nadal nie rozstrzyga. Zawężenie „tylko ci,
którzy trafili" jest do wdrożenia, ale świadomie odłożone.

Sprawdzone również: **stan wewnętrzny klienta gry też tego nie ma.** Obiekt wojownika
w `Engine.battle` niesie `buffs` jako zwykły licznik, a nie listę efektów ze źródłem.
Serwer wysyła klientowi tyle, ile ten musi narysować (ikonę i licznik tur) — skoro UI
nigdzie nie pokazuje „kto cię otruł", ta informacja do przeglądarki nie dociera.

### Leczenie bez leczącego

Widok **Wyleczone** ma w spec trzy szczeble (ranking → wg postaci → wg
umiejętności), ale środkowego — **wg postaci (kto leczył)** — nie da się zbudować:
linia leczenia nie niesie sprawcy. `Przywrócono N punktów życia X` podaje tylko
uleczonego, a `X: Ostatni ratunek, zregenerowano N` to samoleczenie/regeneracja
bez rzucającego. Dlatego gołe „Przywrócono" ląduje pod `Regeneracja`, a rozbicie
leczenia idzie **wprost do źródła** (`healedBy`), z pominięciem szczebla postaci.
W panelu ten jeden szczebel nosi nagłówek **„OD CZEGO"** (efekt: Regeneracja /
aura / samoratunek), w parze z „OD KOGO/KOMU" zadanych i przyjętych — tyle że bez
drążenia głębiej, bo źródłem jest sam efekt, nie postać. Zadane i przyjęte drążą
się przez postać (`dealtToBy` / `takenFromBy`), bo tam obie strony ciosu są w
logu; leczenie tej symetrii nie ma.

### Dwie postacie o tej samej nazwie

Rozdzielamy je po procencie życia z linii logu: życie nie rośnie, więc linia
należy do tej instancji, która stoi tuż nad podaną wartością. Kolejną instancję
zakładamy dopiero, gdy log jej zażąda — linia z HP wyższym niż u wszystkich
dotąd widzianych nie może dotyczyć żadnej z nich.

Ta zwłoka jest celowa. Dwie „Wieczornice" stojące całą walkę na 100%
(`lowca-vs-paladyni`) są w logu nieodróżnialne i rozbicie ich na dwa wiersze
przypisałoby konkretnej postaci obrażenia, o których log milczy. Wtedy zostaje
jeden scalony wiersz pod gołą nazwą. Gdy dowód jest — dwie „Lochy" spadające
osobnymi ciągami HP (`lowca-vs-druzyna`), dwa „Odyńce", z których jeden stoi na
40.37%, a drugi atakuje ze 100% (`lowca-dom-trucizna`) — dostają wiersze
`Nazwa #1`, `Nazwa #2`.

Overlay oznacza gwiazdką oba przypadki, bo dla patrzącego znaczą to samo:
liczba nie jest pewna. Scalony wiersz sumuje kilka postaci, rozdzielony opiera
się na wnioskowaniu ze spadku HP, a nie na odczycie stanu gry.

**Czego to NIE naprawi:** dwóch nietkniętych przeciwników o tej samej nazwie.
Engine.battle też tu nie pomoże — patrz niżej.

## Engine.battle jako uzupełnienie źródła danych

Gra wystawia globalnie `Engine` (oraz `getEngine()`), a w nim `Engine.battle` ze stanem
trwającej walki. Zweryfikowane pola obiektu wojownika (`Engine.battle.warriors`):

```js
id: 473373, originalId: 473373   // unikalny identyfikator
name: "Łowcosław Kazrek", lvl: 70, prof: "h"
team: 1                          // przynależność do drużyny
hp: { max: 14467, cur: 14467, hpp: 100 }
mana: 0, energy: 116
ac, resfire, resfrost, reslight, act
buffs: 0                         // licznik, nie lista efektów
```

Dodatkowo: `Engine.battle.myteam` (numer drużyny gracza), `getFlist1()` / `getFlist2()`
(składy obu drużyn), `getTeamIDs()`. Warto też zbadać `API.addCallbackToEvent` —
zdarzenia gry mogłyby zastąpić `MutationObserver` na DOM.

Co to naprawia, czego log nie daje:

| Pole | Problem, który rozwiązuje |
|---|---|
| `team` | podział na drużyny wyprowadzam z rozbioru słowa „a" w linii otwierającej — kruche i sensowne głównie przy 1v1 |
| `id` / `originalId` | trwała tożsamość postaci między turami i walkami — ale NIE przypisanie linii logu do konkretnego NPC, patrz niżej |
| `hp`, `energy`, odporności | overlay nie ma dziś pojęcia o stanie postaci, tylko o sumach |

**Stan: wdrożone dla wierszy** (`src/roster.ts`). `EngineRosterSource` czyta
`battle.warriors` + `myteam` i podaje `aggregate` skład jako opcjonalny hint.
Gdy jest — wiersze i strony biorą się z gry, więc każda postać jest widoczna od
pierwszej tury, a duplikaty dostają osobne wiersze (`Wilk #1`, `Wilk #2`), bo
ich istnienie jest faktem. Gdy go nie ma (testy, wklejony tekst, patch gry) —
wszystko leci z linii otwierającej, dokładnie jak przedtem.

Liczby nadal przypisuje heurystyka HP z logu. Przy duplikatach, których log nie
rozróżnia, całość obrażeń ląduje na jednej instancji, a wszystkie wiersze tej
nazwy dostają gwiazdkę.

**Zamierzona architektura: uzupełnienie, nie zamiennik.** Log tekstowy zostaje źródłem
obrażeń — przez kilkanaście zebranych zrzutów nie zmienił swojego formatu ani razu,
a wewnętrzne struktury klienta takiej gwarancji nie mają i mogą paść przy każdym
patchu. Z gry warto brać wyłącznie roster: `id`, `name`, `team`. Parser przyjmowałby
je jako opcjonalny „hint" i używał, gdy są dostępne; w ich braku (testy, fixture'y,
zmiana w grze) działa jak dotąd. Dzięki temu istniejące testy pozostają nienaruszone.

**Czego roster z Engine NIE załatwi:** przypisania linii logu do konkretnego
NPC. Linia mówi `Wieczornica(100%)` i nic poza tym — nie niesie żadnego `id`,
więc mając nawet obie Wieczornice z osobnymi `id` i tak nie wiadomo, której
dotyczy. Engine mówi ILE ich jest (to samo, co linia otwierająca), nie KTÓRA
właśnie uderzyła. Rozstrzygnąć mogłoby dopiero śledzenie `hp.cur` każdego
wojownika między turami — wtedy widać, komu życie spadło. To osobna, znacznie
głębsza integracja niż odczyt składu i nie jest zrobiona.

**Uwaga przy mapowaniu:** numeracja drużyn w grze to nie to samo co nasza. U nas strona
`0` to drużyna gracza (kolejność w linii otwierającej), a gra raportuje `myteam: 1`.
Te dwa układy trzeba zmapować jawnie, a nie zakładać, że są zgodne.

## Przegląd kodu — 2026-07-19

Pełny przegląd modułów. Każdy punkt odtworzony uruchomieniem kodu na fixture'ach
albo na scenariuszu syntetycznym; przy każdym stoi, jak się go wywołuje. Punkty
oznaczone **[otwarte]** nie są naprawione.

Trzy rzeczy naprawiono od razu, bo psuły licznik u użytkownika — opis niżej,
w sekcji „Naprawione".

### Krytyczne [otwarte]

**Pula kolorów wyczerpuje się na całą sesję, nie na walkę.** `overlay.ts:416` —
`ColorAssignment` jest tworzona raz i nigdy nie resetowana, a `MAX_SERIES` to 8
(`palette.ts:18`). Overlay żyje tyle, co karta gry, więc pula wyczerpuje się po
ośmiu unikalnych nazwach widzianych **kiedykolwiek**, nie w bieżącej walce. Od
trzeciej walki ranking robi się jednolicie szary i kolor przestaje odróżniać
wiersze. Zmierzone na trzech kolejnych walkach:

```
walka 1 (4 postaci): #3987e5  #008300  #d55181  #c98500
walka 2 (3 postaci): #199e70  #d95926  #9085e9
walka 3 (4 postaci): #e66767  #8a8a80  #8a8a80  #8a8a80   ← OTHER_COLOR
```

Do tego mapa przypisań rośnie przez całą sesję bez ograniczenia. Naprawa to
reset puli na starcie walki — ale wtedy ta sama postać zmienia kolor między
walkami, więc decyzja nie jest czysto techniczna.

### Poważne [otwarte]

**Przeciąganie panelu ginie przy pierwszej linii logu.** `overlay.ts:1428`
(`makeDraggable`) jest wołane przy każdym renderze, a `render()` buduje nowy
`<header>` i kasuje stary. Listenery `pointermove`/`pointerup` zostają na
odłączonym węźle, więc ruch zastyga w połowie. Gorzej: `saveState` siedzi
wyłącznie w `pointerup`, który już nigdy nie odpali — pozycja nie zapisuje się
w ogóle, panel wraca po odświeżeniu na stare miejsce.

**W trybie „na turę" udziały procentowe liczą się względem sumy temp.**
`overlay.ts:1091` — mianownikiem jest Σ(obrażenia/tury), wielkość bez sensu
fizycznego, której panel nigdzie nie pokazuje. `totalsRows` i `sidesRows`
świadomie tego unikają, ranking nie. Skutek: postać z 10% obrażeń dostaje
w nawiasie większy udział niż ta z 21%.

**Sufiks `/t` znaczy dwie różne rzeczy.** `turnsFor` (`overlay.ts:311`) dzieli
zadane przez tury własne, a otrzymane przez tury walki — świadomie, bo obrywa
się w turach przeciwnika (patrz historia zmiany). Ale obie kolumny są podpisane
identycznie, więc przełączenie zakładki zmienia skalę liczby o rząd wielkości
bez żadnego sygnału w UI.

**Obrażenia wypadają z osi tur, gdy walka zaczyna się od DoT-u.**
`stats.ts:431` — `addToTurn` przy pustej `timeline` po cichu wyrzuca kwotę
(`if (slice)` bez `else`). `dot` i `heal` nie otwierają tury. Na logu obciętym do
pierwszego tyknięcia trucizny: suma zdarzeń 2329, suma osi tur 2189 — ubytek 140.
Realne, bo bufor bywa przewinięty i walka bez linii otwierającej jest
przewidzianym przypadkiem.

**`opponentOf` nie widzi składu z gry.** `stats.ts:413` czyta wyłącznie listę
z linii `fight-start`, choć `resolve` korzysta już ze składu z `Engine.battle`.
Gdy nagłówek wyjechał z bufora, DoT trafia do puli nieprzypisanej, mimo że skład
z gry jest znany i jednoznaczny. Przy tym samym rosterze: z nagłówkiem DoT bez
sprawcy = 0, bez nagłówka = 280.

**Walka przerwana skleja się z następną.** `session.ts:53` — warunek na
zdublowaną linię otwierającą (`previous?.length === 1`) nie odróżnia dubla od
walki, która skończyła się na samym nagłówku (ucieczka, przerwanie, bufor
doczytany na granicy). Dwie walki zlewają się w jedną, a skład bierze się
z pierwszej:

```
fight-start (Wilk) + fight-start (Niedźwiedź) + atak  →  1 walka zamiast 2
```

**`sourceHpPct: 0` jako zaślepka czytane jest jako śmierć.** `parser.ts:425`
wystawia zero dla własnych obrażeń umiejętności (log nie podaje HP rzucającego),
a `stats.ts:455` traktuje `hpPct <= 0` jako zgon. Mag kończy walkę na liście
poległych, przyjąwszy 9 obrażeń:

```
mag-vs-druzyna-umiejetnosci
  deaths: [Dida Gula t1, Fula Gula t2, wf mushita psk t4, Furu Mulu t4]
  fight-end: zwyciężył wf mushita psk          ← zwycięzca wśród poległych
```

Dziś **utajone**: `stats.deaths` czyta wyłącznie `renderAxis`, czyli martwy kod.
Ożyje przy podpięciu osi tur. Poprawne byłoby `sourceHpPct: number | null` —
`observeDeath` już obsługuje `null`.

**`RE_MODIFIER` jest catch-allem i wyłącza czujkę `unknown`.** `parser.ts:40` —
wzorzec `/^[+-]\s*(.*\p{L}.*)$/u` stoi przed resztą rozpoznawania, więc dowolna
niezrozumiana linia zaczynająca się od `+`/`-` ląduje w proc-ach zamiast zostać
zgłoszona. Mechanizm, który wg `types.ts` ma sygnalizować zmianę formatu, na tej
klasie linii nie działa. Wzmacnia to `parser.ts:415` (`if (abilityDamage && ability)`),
gdzie brak zapowiedzi umiejętności powoduje ciche pominięcie linii obrażeń:

```
"Tancogniew(75.08%) zrobił krok do przodu."
"  -507  obrażeń otrzymał(a) Tancogniew(75.08%)."
→ jedno zdarzenie `move`; 507 obrażeń znika bez `unknown`
```

**`findBattleLog` przy jednoliniowym logu bywa niejednoznaczny.** Naprawiona
została wersja z pogrubionym nagłówkiem (niżej), ale gdy w logu stoi **wyłącznie**
linia otwierająca, z treści nie da się odróżnić kontenera logu od ramki nad nim.
Bierzemy wtedy rodzica linii. Naprawia się samo przy drugiej linii — `boot()`
zobaczy inny element i przepnie obserwatora.

### Średnie [otwarte]

**Pełne przeparsowanie i przebudowa DOM przy każdej linii logu.** `index.ts:15`
— każda emisja parsuje cały bufor i buduje panel od zera, więc koszt rośnie
z długością walki. Log 1425 linii podawany narastająco: 12,1 s łącznie, koszt
pojedynczej emisji rośnie z 6,6 ms (linia 250) do 13,2 ms (linia 1250). Do tego
`showTip` po każdym renderze woła `getBoundingClientRect()` tuż po podmianie
poddrzewa, czyli wymusza layout na każdą linię.

**Metryka „Tury" jest nieosiągalna z UI.** Typ `Metric` ją zawiera,
`METRIC_LABELS` ma etykietę, `turnRows()` renderuje jej rozbicie — ale `METRICS`
(`overlay.ts:23`) wymienia trzy pozycje i zakładka nigdy się nie rysuje. Dwa
testy tej funkcji stoją na `test.skip`. To funkcja porzucona w połowie, nie
przeoczenie.

**Sesja jest liczona i nigdy nie pokazywana.** `Session.total()` i cała
`mergeStats` (~100 linii) działają, ale overlay nie ma zakładki zakresu —
`render()` przyjmuje `session` i tylko oddaje go sam sobie przy rerenderze.

**`maxHit` wlicza obrażenia własne umiejętności.** `stats.ts:518` — `types.ts`
definiuje je jako „najsilniejszy pojedynczy **cios**", a liczone są też zdarzenia
`strike: false`. W fixture'ach bez wpływu (12 vs 1098), przy silniejszej Fuzji
zmieni wynik.

**Leczenie gubi procent życia.** Regexy leczenia (`parser.ts:51-60`) **łapią**
`(\d+%)`, ale `BattleEvent.heal` nie ma pola na HP, więc `stats.ts` woła
`resolve(target, null)` i przy zdublowanych nazwach leczenie lgnie do „ostatnio
aktywnej" instancji. Dane są w logu, parser je wyrzuca. Dodatkowo leczenie
podnosi HP, co łamie założenie „życie nie rośnie", na którym stoi rozdzielanie
duplikatów.

**Tylko męskie formy czasownika.** `parser.ts:33,35,66` — `uderzył(?:\(a\))?`,
`otrzymał(?:\(a\))?`, `zrobił(?:\(a\))?`. Fixture'y mają wyłącznie właścicieli
mężczyzn, więc nie da się na nich rozstrzygnąć, czy gra odmienia własną postać
wg płci. Jeśli tak — log postaci kobiecej rozsypie się w całości. Niespójność
jest wewnętrzna: `RE_VICTORY`/`RE_DEFEAT` już obsługują `-a/-o/-y`. Awaria
byłaby głośna (`unknown`), nie cicha.

### Drobne [otwarte]

- `parser.ts:111` — `.replace(/ /g, " ")` podmienia spację na spację. Miało być
  NBSP (` `); w fixture'ach NBSP nie występuje, a `normalizeLine` i tak go
  zbiera. Do usunięcia albo naprawy.
- `parser.ts:51-60` — regexy leczenia nie mają opcjonalnej kropki na końcu,
  w odróżnieniu od `RE_DOT`/`RE_MOVE`. `Przywrócono 247 punktów życia X(93.01%).`
  → `unknown`. To samo `Łowcosław otrzymuje 15 punktów many.` (dwa słowa po liczbie).
- `parser.ts` — brak obsługi separatora tysięcy i brak strażnika `applied <= raw`.
  Gdyby gra rozdzielała tysiące, `+10 000` daje dwa trafienia i `applied > raw`.
  Formatu nie potwierdzono — fixture'y mają maks. 4 cyfry.
- `parser.ts` — proc-i zbierają przyrosty zasobów (`"14 energii"`), choć
  `types.ts` definiuje `procs` jako efekty z ekwipunku.
- `stats.ts:614` — `unattributedHealing` jest jedną liczbą, podczas gdy
  `unattributedDotDamage` jest rozbity na stronę. Filtr „My"/„Oni" pokaże to samo
  leczenie na obu zakładkach.
- `stats.ts:699` — `estimateMaxHp` eksportowane, używane wyłącznie w testach.
- `overlay.ts` — pasek stron przy sumie 0 dostaje 50/50, więc brak danych wygląda
  jak wyrównana walka.
- `overlay.ts` — lista nie ma ograniczenia wysokości ani przewijania. 30 postaci
  to ~690 px samej listy; przy panelu niżej w oknie dolne wiersze są nieosiągalne.
- `index.ts:39` — `setInterval` nigdy nie czyszczony; `findBattleLog` robi
  `querySelectorAll("*")` po całym DOM gry co sekundę do końca życia karty.
  Koszt zmierzony jako liniowy i nieistotny (2–6 ms dla 500–5000 elementów).
- `roster.ts:76` — twarde `typeof === "number"`: wojownik ze stringowym `id`
  lub `team` jest po cichu pomijany. Gdy dotyczy wszystkich, rozdzielanie
  duplikatów znika bez śladu w UI.
- Martwy kod: `renderAxis`, `renderFireFocus`, `turnRows` (~103 linie) plus
  odpowiadający im CSS; `StaticRosterSource` (`roster.ts:87`); `OTHER_LABEL`
  (`palette.ts:21`); `Session.reset()` — nie ma przycisku resetu, sesja jest
  niezerowalna do przeładowania strony.

### Naprawione w tym przeglądzie

**Sesja liczyła walkę dwa razy.** Tożsamością walki było `${indeks}|${sygnatura}`,
a obie części zmieniają się przy przycięciu bufora — ta sama walka trafiała do
archiwum pod starym kluczem i żyła dalej pod nowym. Zmierzone: 2897 → **5794**.
Zastąpione dopasowaniem od końca bufora (log traci treść od góry, dorasta na
dole) z jawnym testem kontynuacji: nowa walka zawsze zaczyna się linią
otwierającą, więc jej brak znaczy „ogon walki, której nagłówek wyjechał", a ten
sam skład z mniejszą liczbą zdarzeń znaczy „gra wyczyściła log i bijemy od nowa".

**`findBattleLog` przy pogrubionym nagłówku podpinał się do jednej linii.** Kod
brał rodzica najgłębszego elementu z markerem. Gdy linia otwierająca była owinięta
w `<b>` — a `raw.txt` zapisuje ją jako `[b]...[/b]` — rodzicem była sama linia,
więc obserwator pilnował jednej linii i licznik nie widział ani jednego obrażenia
do końca walki. Teraz wspinamy się w górę tak długo, jak rodzic nie dokłada treści.

**`abilityUses` wypadało z sumy sesji.** Pole dodane do `ActorStats` nie zostało
objęte przez `copyActor` (współdzielona referencja) ani `mergeStats`. Dwie walki
dawały podwojone obrażenia i niepodwojone użycia. Doszedł test generyczny na tę
klasę błędu — `mergeStats` wylicza pola z palca, więc każde nowe pole wypada
z sumy po cichu.

### Sprawdzone i odrzucone

Nie ma sensu wracać do tych hipotez — zostały przebadane i nie potwierdziły się:

- Wyciek `MutationObservera` przy podmianie kontenera — `unsubscribe()` leci
  przed przypisaniem nowego, `disconnect()` działa, podwójnej subskrypcji nie ma.
- Akumulacja listenerów zakładek przy rerenderze — siedzą na węzłach usuwanych
  razem z panelem. (Dotyczy zakładek; przeciąganie panelu to osobny problem, wyżej.)
- Samowykrycie overlaya przez `findBattleLog` — overlay siedzi w shadow root,
  `querySelectorAll("*")` go nie przebija.
- Rozjazd rozbicia względem sum — na wszystkich 14 fixture'ach `Σ dealtBy`,
  `Σ dealtByType`, `Σ takenFrom`, `Σ takenByType`, `Σ healedBy` zgadzają się co do
  jednostki, a udziały sumują się do 100%.
- Dzielenie przez zero w overlayu — wszystkie miejsca strzeżone.
- Niezmienniki agregacji — `Σ damageDealt + DoT bez sprawcy == Σ damageTaken`,
  `Σ timeline == Σ zdarzeń`, `unknownLines == 0` trzymają na całym korpusie.
- Zdublowana linia `fight-start` w logu — parser emituje dwa zdarzenia, ale
  `stats.ts` bierze `find(...)`, więc skład nie jest liczony podwójnie.
- Mapowanie `myteam` z gry na naszą numerację stron — jawne i poprawne.

## Bun

This project was created using `bun init` in bun v1.1.29. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
