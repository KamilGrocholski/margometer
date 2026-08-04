# Decyzje i ograniczenia

**Dlaczego kod wygląda tak, jak wygląda** — czego log walki NIE mówi, co z tego
wynika dla parsera i statystyk, i które warianty zostały świadomie odrzucone.
Punkt wejścia do katalogu jest w [`README.md`](README.md); ten plik czyta się
wybiórczo, sekcjami.

## Nagrywanie walk — dlaczego tak (`src/recorder.ts`)

**Zapisujemy surowy tekst logu, nie policzone statystyki.** Pomiar na 13
zrzutach z `tests/fixtures/new-engine/` (od 1v1 po walkę grupową na 201 linii):

| co zapisujemy | śr. znaków / walkę | max |
| --- | --- | --- |
| surowy log | 2 610 | 7 490 |
| `BattleEvent[]` w JSON | 5 737 | 16 378 |
| `BattleStats` w JSON | 4 457 | 8 924 |

Surowy log jest nie tylko najmniejszy — przeżywa zmianę kształtu `ActorStats`
i pozwala przeliczyć stare nagrania nowym parserem. Statystyki zamrożone w
JSON-ie są bezużyteczne w dniu, w którym łatamy lukę w parserze.

**Budżet: 500 tys. znaków (~1 MB).** Przeglądarki liczą localStorage po 2 bajty
na znak (UTF-16), więc z ~5 MB na origin realnie mieści się ~2,5 mln znaków —
czyli ~950 średnich walk. Bierzemy piątą część tego, bo `@grant none` znaczy,
że siedzimy w kontekście strony: to jest TEN SAM kubełek, którego używa klient
gry. Zapchany oznacza `QuotaExceededError` **dla gry**, nie dla nas. Stąd też
`write()` w razie odmowy najpierw kasuje własne najstarsze nagranie i dopiero
potem gaśnie.

**Klucz na walkę** (`margometer.rec.<id>` + `margometer.rec.index`), nie jeden
blob. `capture()` leci przy każdej zmianie logu, a localStorage jest
synchroniczny — przepisywanie całego archiwum przy każdej nowej linii zacinałoby
grę. Zapis idzie tylko wtedy, gdy nagranie faktycznie urosło.

**Sklejanie bufora** powtarza logikę `Session.update`: walki dopasowujemy od
końca, bo log traci treść od góry, a dorasta na dole. Różnica: sesja porównuje
sygnatury składu, a nagrywarka wspólny początek tekstu, a przy przyciętym
nagłówku — najdłuższy wspólny fragment (`merge`). Bez tego przycięcie bufora
zdublowałoby połowę walki w nagraniu.

## Archiwum i odtwarzanie — dlaczego tak (`src/archive.ts`)

**Wczytana walka trafia do GŁÓWNEGO panelu, a nie do drugiego widoku.**
`Overlay.preview` podmienia źródło statystyk w `render()` i to wszystko — dzięki
temu metryki, filtr składu, „na turę", drążenie w postać i w cel działają dla
nagrań bez jednej dodatkowej linii kodu. Osobny widok archiwum znaczyłby drugą
implementację tego samego rankingu.

**Podgląd niczego nie zatrzymuje.** `render()` dalej zapisuje `latest`, więc po
wyjściu z podglądu panel pokazuje to, co narosło w międzyczasie. Pasek podglądu
jest krzykliwy celowo: pomylenie nagrania sprzed godziny z trwającą walką jest
gorsze niż żółte tło.

**Odtwarzanie idzie tą samą ścieżką co licznik na żywo.** `Session.update()`
dostaje w grze CAŁY bufor przy każdej zmianie i parsuje go od nowa, więc
odtwarzanie to podawanie coraz dłuższych prefiksów nagrania (`frameStats`).
Zero nowej logiki w rdzeniu i zero drugiej prawdy o tym, jak liczy się walka.
Zegar (`Ticker` w `window.ts`) jest wstrzykiwany, bo inaczej nie dałoby się
sprawdzić kolejnych klatek w testach.

**Podsumowania wierszy liczone leniwie**, przy rysowaniu listy, i cache'owane po
`id:długość tekstu` — nie przy zapisie, bo tam `Session` liczy dokładnie to samo
na żywo. Klucz z długością sprawia, że wiersz trwającej walki rośnie razem z nią.
`sync()` przebudowuje listę tylko wtedy, gdy zmieni się zestaw identyfikatorów:
przebudowa dwustu wierszy przy każdej nowej linii logu kosztowałaby więcej, niż
warta jest świeża liczba tur w jednym wierszu.

**Wklejony log nie trafia do archiwum** — magazyn dzielimy z grą, a wklejenie
jest z natury jednorazowe (diagnostyka, cudza walka).

Podgląd bez wchodzenia do gry: `bun run build` generuje `dist/preview-archive.html`
z kilkoma nagraniami wstawionymi prosto do localStorage.

## Znane ograniczenia

### Trucizna bez sprawcy

Linie typu `Postać traci 143 pkt. życia od trucizny.` **nie zawierają informacji, kto
truciznę nałożył.** W przeciwieństwie do `głębokiej rany` i `zranienia`, które mają
w logu odpowiadający im proc (`+Głęboka rana`, `+Zranienie (N)`), trucizna nie ma
żadnej linii nakładającej.

Sprawdzone w korpusie fixture'ów (przeliczone 2026‑07‑31, po dołożeniu walki
z Hildur — same tyknięcia DoT-a, nie liczba walk):

```
od trucizny      x105  ← brak proca
od głębokiej rany x18  ← +Głęboka rana
od ognia          x17  ← brak proca
po zranieniu      x16  ← +Zranienie (N)
od błyskawic       x2  ← brak proca
```

Proporcja jest tu ważniejsza od samych liczb: **rodzaje bez proca to nadal
większość tyknięć**, a jeden zrzut z długiej walki grupowej potrafi przesunąć
cały rachunek — dlatego ta tabelka ma datę.

#### Trzy piętra, nie jedno (ustalone 2026‑07‑31)

„DoT bez sprawcy" brzmi jak jedna sprawa, a są trzy — i mylenie ich kosztowało
nas realne liczby:

| piętro | rodzaj | co daje log | co robimy |
|---|---|---|---|
| **1. sprawca i kwota** | `po zranieniu` | `+Zranienie (N)` stoi przy ciosie i **zapowiada kwotę tyknięcia** | **wiążemy** — z warunkiem zgodności kwoty |
| **2. sam sprawca** | `od głębokiej rany` | `+Głęboka rana` bez kwoty (jeden proc, tyknięcia 754 → 1131) | nie wiążemy |
| **3. nic** | `od trucizny`, `od ognia`, `od błyskawic` | brak proca w całym korpusie | nie wiążemy |
| **0. zły kierunek** | `od ubytku życia` | nic — log nie nazywa nawet rodzaju | **odmawiamy także rezerwy** po układzie stron |

**Piętro 0 dopisane 2026‑08‑03 i jest jakościowo inne od pozostałych.** Tamte
trzy różnią się tym, ile log mówi o sprawcy, ale wszystkie spadają na tę samą
rezerwę: „gdy po drugiej stronie stoi jeden przeciwnik, to on”. Ubytek życia
jest pierwszym rodzajem, przy którym **ta rezerwa sama jest fałszem** — pomiar
(`docs/MECHANIKA.md`) wskazuje źródło po TEJ SAMEJ stronie co cel, więc reguła
szukająca sprawcy naprzeciwko musi trafić w niewinnego. Stąd
`SELF_INFLICTED_DOTS` w `stats.ts`.

Kosztowało to realne liczby, zanim zostało wyłapane: w `2026-08-03_druzyna-vs-
hildur-absorpcja` boss dostawał 2 026 obrażeń, których nie zadał, a dwie
postacie miały w panelu napisane, że oberwały od niego **100 %** tego, co
straciły. Ten sam rachunek co przy piętrach 1–3, tylko z drugiej strony:
niesprawdzalne wiązanie jest gorsze od jawnego „nie wiadomo”.

**Piętro 1 wiążemy, bo da się to sprawdzić, a nie dlatego, że pasuje.** Kwota
z proca musi się zgadzać z kwotą tyknięcia — 16/16 w korpusie — więc test
(`stats.test.ts`, „zranienie zgadza się z proca") pilnuje tego przy każdym
kolejnym zrzucie. Gdy przestanie się zgadzać, wiązanie trzeba **wycofać**, a nie
naprawiać: bez zgodności kwot zostałoby wnioskowanie z kolejności linii, czyli
dokładnie to, czego przy truciźnie odmawiamy.

**Dlaczego nie piętro 2 i 3.** `+Głęboka rana` wskazuje sprawcę, ale wiązanie
opierałoby się wyłącznie na sąsiedztwie linii. Przy ogniu jest jeszcze
kuszący dowód: w walce z Hildur jest **jeden** rzut `Kula ognia`, dwa tyknięcia
zaraz po nim, i wbudowana próba kontrolna — trzej gracze biją `dmgf` przez całą
walkę i nie wywołują ani jednego tyknięcia. To i tak korelacja z jednego zrzutu,
a `UX.md` stawia zasadę „nie udawać danych, których log nie ma". Zostaje.

Skutek praktyczny: w walce 10v1 z Hildur `opponentOf` milczy dla wszystkiego (po
drugiej stronie stoi dziesięciu), ale zranienie i tak ma właściciela — 3 380
obrażeń wróciło do Łowcomira. W puli zostały trucizna (40 435) i ogień (556).

Obecne zachowanie: DoT przypisujemy sprawcy tylko wtedy, gdy po przeciwnej stronie
stoi dokładnie jeden przeciwnik (`opponentOf` w `stats.ts`). W innym wypadku obrażenia
lądują w `unattributedDotDamage`.

**Czy da się to obejść?** Nie wprost. Trucizna to właściwość broni
([„Mechanika walk"](https://pomoc.margonem.pl/index/view,372) — oficjalna pomoc
mówi o „broniach od zimna i trucizny"), więc
otruć mógł tylko ten, kto faktycznie trafił cel — to zawęża krąg podejrzanych, ale
przy dwóch trafiających przeciwnikach nadal nie rozstrzyga. Zawężenie „tylko ci,
którzy trafili" jest do wdrożenia, ale świadomie odłożone.

Sprawdzone również: **stan wewnętrzny klienta gry też tego nie ma.** Obiekt wojownika
w `Engine.battle` niesie `buffs` jako zwykły licznik, a nie listę efektów ze źródłem.
Serwer wysyła klientowi tyle, ile ten musi narysować (ikonę i licznik tur) — skoro UI
nigdzie nie pokazuje „kto cię otruł", ta informacja do przeglądarki nie dociera.

#### Gdzie to ląduje w panelu (2026‑08‑01)

Do tej pory tykający efekt bez sprawcy wchodził na pierwszy szczebel rozbicia
**pod własną nazwą**, więc „od trucizny" stało w rankingu `OD KOGO` między
postaciami — a to jest lista postaci. Odtąd wszystko bez sprawcy zbiera się pod
jedną pozycją `Bez sprawcy` (stała `UNATTRIBUTED_SOURCE` w `stats.ts`), stojącą
**na końcu** listy bez względu na kwotę i odciętą od niej wizualnie. Wejście w nią
odpowiada na pytanie, na które log odpowiedzieć umie: nie „kto", tylko „czym".

To zmiana prezentacji. **Reguła zostaje ta sama:** sprawcy nie zgadujemy, a
piętra 2 i 3 z tabelki wyżej nadal nie są wiązane. Szczegóły: `AUDYT.md AUDYT‑28`.

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

**Trzeci szyk, i najbliższy kontrprzykład, jaki ta sekcja dostała.** Leczenie
kierowane — `Uleczono Zsz Przeworsk o 11937 punktów życia.` — stoi wprost pod
zapowiedzią `Er Al Safar wykonuje Leczenie ran.`, więc **nazwa umiejętności jest
znana**, a przy odrobinie dobrej woli i rzucający też. Mimo to szczebla „kto
leczył" **nadal nie budujemy**, i nie jest to zaniechanie:

- nazwę bierzemy (parser podaje `sideEvent` blok jako parametr), bo bez niej całe
  leczenie drużyny stałoby pod wspólną „Regeneracją" — to jest ta wygrana;
- sprawcy nie zapisujemy, bo szczebel wypełniony **tylko dla jednego z trzech
  szyków** kłamałby bardziej niż jego brak: „Przywrócono" i tak zostaje bez
  nikogo, a w panelu wyglądałoby to jak healer, który raz leczy, a raz nie.

**Sprawdzone drugą drogą 2026‑08‑04 — reguła obowiązuje TAKŻE dla protokołu.**
Kusiło założyć, że protokół silnika to rozstrzyga, bo komunikat ma dwie strony.
Ma, ale nie zawsze: `heal` przychodzi jako `482845=100.00;0;heal=99`, czyli
z drugą stroną PUSTĄ. Dekoder protokołu założył inaczej i zaczął kredytować
leczenie postaci, o której log milczy — pierwsza para tekst↔protokół pokazała
to jako jedyną rozbieżność w całej walce (`fix` w `d4be27e`).

Protokół rozstrzyga sprawcę **wyłącznie przy `heal_target`/`npc_heal`**, gdzie
pierwszą stroną jest leczący, a drugą leczony. Nawet tam nie da się tego dziś
zapisać: `BattleEvent.heal` nie ma pola na leczącego, bo powstało pod log
tekstowy, który go nie zna. To jest realny kandydat na rozszerzenie — ale
dopiero wtedy, gdy panel będzie liczył z protokołu, a nie z tekstu.

Zdarzenie `heal` niesie za to pole `self` — „czy leczony i leczący to ta sama
postać". Tyle i tylko tyle da się z logu wyczytać, a wystarcza, żeby `healingDone`
nie dostawał cudzej roboty. Wcześniej rolę tę pełniło `ability !== null`, co
działało dopóty, dopóki nazwane leczenie zawsze siadało na trafionym (`Dotyk
anioła`, `Ostatni ratunek`). Fixture `2026-07-31_druzyna-vs-hildur-zwyciestwo`
trzyma oba warianty naraz — Hubert Ivan leczy siebie, Er Al Safar leczy kogoś
innego, obaj tą samą umiejętnością — i jest jedynym dowodem, że to rozróżnienie
w ogóle jest potrzebne.

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

## Profesje — trzy źródła, sprawdzone 2026-07-26

**Stan: (1) i (2) wdrożone 2026-07-27** — `ActorStats.professionCode`, kolor paska
i odznaka w wierszu (patrz „Kolory pasków” niżej). (3) nadal niezbadane w praktyce.

**1. Linia otwierająca — już sparsowane, dziś wyrzucane.** `parser.ts` wypełnia
`Participant.professionCode` (litera z `(85b)`), a `types.ts` ma mapę
`PROFESSIONS`. Przelot po wszystkich 16 korpusach dał sześć liter, ani jednej
nieznanej, i **potwory mają prawdziwe kody, nie zaślepkę**:

```
b tancerz ostrzy · Tancogniew Kazrek (64)   p paladyn   · Wieczornica (93), Południca (92)
h łowca          · Łowcosław Kazrek (70)    t tropiciel · wf agar psk (63)
m mag            · Zulu Mulu (27)           w wojownik  · Odyniec (41), Locha (40)
```

Pokrycie pełne: cały skład, obie strony, od pierwszej linii, także we wklejonym
tekście. Ale `professionCode` i `level` idą WYŁĄCZNIE do `participantsKey`
(podpis walki), a `PROFESSIONS` jest eksportowane i nieużywane. Droga do widoku:
profesja pojechałaby torem, którym już jedzie `side` — `seats` niesie
`{key, side}`, `aggregate` robi `get(seat.key).side ??= seat.side`. Dopisanie
`prof` do `seats` plus jedno `??=`, ~6 linii, bez ruszania parsera.

**2. `Engine.battle.warriors[].prof`** (patrz sekcja wyżej — pole zweryfikowane,
ten sam alfabet co log). `roster.ts` czyta dziś tylko `id`/`name`/`team`.
To nie alternatywa dla (1), a jej DOPEŁNIENIE: profesje niesie linia otwierająca,
czyli dokładnie ta, która wyjeżdża z bufora. Bez składu z gry profesja znika
w tym samym momencie i z tego samego powodu, z którego znikała strona celu
w `SOLID.md §4.2`.

**3. Atrybut `prof-X` na liczbie obrażeń w DOM — jedyne źródło „per cios".**
Nie było tego dotąd nigdzie zapisane. Atrybut siedzi na samej liczbie i niesie
profesję ZADAJĄCEGO, nie celu:

```html
Odyniec(40.37%) otrzymał(a) <b class="dmgd" prof-h="">-455       <!-- bije łowca (h) -->
Łowcożyr Kazrek(98.37%) otrzymał <b class="dmg" prof-w="">-95    <!-- bije Odyniec (w) -->
```

Do składu bezużyteczne, ale to jedyna droga, żeby nazwy w `ELEMENTS` przestały
być wnioskiem — komentarze przy `d` („dystansowe") i `a` („nieuchronne") mówią
wprost, że to zgadywanie z zestawienia, nie zapis z logu. Kanał już istnieje:
`ELEMENT_MARKER` przemyca klasę CSS przez tekst, atrybut pojechałby tak samo.
Ograniczenie: tylko prawdziwy DOM — 3 z 16 korpusów to HTML, wklejony log tego
nie niesie.

**Wykorzystane 2026‑07‑31 — i od razu rozstrzygnęło coś innego.** Przekrój
wszystkich zrzutów DOM po `prof-X` (czyli po ZADAJĄCYM, nie po imieniu z początku
linii, które przy „otrzymał" wskazuje cel):

```
dmg   278  →  w, p, b     ← wyłącznie profesje zwarcia
dmgd  408  →  t, h        ← wyłącznie profesje strzelające
dmgo   56  →  b           ← wyłącznie tancerz ostrzy
dmgc  372  →  m, t, p  ·  dmgf 161 → t, m  ·  dmgl 116 → m, t
```

Podział zwarcie/dystans jest czysty na 686 liczbach, **zero przecięć**. To znaczy,
że `ELEMENTS` nigdy nie było mapą żywiołów — trzyma odpowiedzi na trzy różne
pytania i gra wybiera JEDNĄ na liczbę:

| oś | litery |
|---|---|
| żywioł | `f`, `l`, `c` |
| broń / slot | brak litery (zwarcie), `d` (dystans), `o` (broń pomocnicza) |
| zasięg | `g` (globalne) |
| osobno | `a` (nieuchronne) |

Dlatego `o` i `g` **weszły** do tej mapy (korpus nie ma już ani jednej nieznanej
klasy), ale rozdzielenie osi na dwa pola w `Hit` — świadomie NIE. Nie ma dziś
pytania, na które jedno pole nie wystarcza: przy `dmgg` i `dmgo` gra podaje
zasięg albo slot ZAMIAST żywiołu, więc żywiołu i tak nie znamy, a drugie pole
stałoby puste. Wraca, gdy pojawi się log niosący oba naraz.

## Kolory pasków — 2026-07-27

Wzorzec SKADA/Details! wzięty w całości: **pasek postaci niesie klasę, a obok
stoi odznaka z literą profesji**. Rozbicie koloruje się rodzajem obrażeń, jak
szkoły magii w Details!. Palety siedzą w `palette.ts` i biorą barwy wyłącznie
z `SERIES_COLORS`, żeby nie omijać walidacji.

Liczby, na których stoi ta decyzja (walidator palety, tło `#16161a`, tryb dark,
test „wszystkie pary”, bo barwa idzie z ATRYBUTU, więc obok siebie może stanąć
dowolna para):

| ile barw | podzbiorów przechodzących próg normalnego widzenia (≥15) |
|---|---|
| 8 | 0 / 1 |
| 7 | 0 / 8 |
| 6 | 0 / 28 |
| 5 | 0 / 56 |
| 4 | 4 / 70 (i to w paśmie „floor” CVD) |

Sufit to cztery barwy, a profesji jest sześć — więc **rozróżnialność bierze na
siebie odznaka, nie kolor**. Kluczowa konsekwencja: ponieważ najlepszy możliwy
rozstęp dla szóstki (ΔE 10,6) jest taki sam dla KAŻDEGO przypisania, skojarzenia
nic nie kosztują. Stąd mag niebieski, łowca zielony, paladyn różowy.

Przy protanopii/deuteranopii barwa nie rozróżnia klas w żadnym układzie
(ΔE ok. 1,6–4,8) — to jest powód, dla którego odznaka jest warunkiem wejścia
tego pomysłu, a nie ozdobą.

Świadome ustępstwa, żeby nie badać ich drugi raz:
- **ogień↔rana (ΔE 7,1)** to najsłabsza para rodzin, obie ciepłe. Fiolet
  podniósłby najgorszą parę tylko do 9,8 (wtedy zimno↔rana), więc próg i tak
  zostaje niezaliczony, a krwawienie przestałoby być czerwone.
- **Umiejętność o kilku żywiołach dostaje ten dominujący obrażeniami.** W korpusie
  u maga to zawsze błyskawica (Lodowy pocisk to 259 błyskawicy wobec 50 zimna!),
  więc jego akcje wychodzą jednobarwne — podział niesie sekcja TYP OBRAŻEŃ.
- **Nazwy akcji są dwa szczeble w głąb** (skład → cel → czym), bo pierwszy poziom
  wymienia postacie. Tam barwa idzie za profesją, spójnie z listą składu.

### Krycie paska to decyzja o czytelności, nie o guście (2026‑08‑01)

Ten sam walidator mierzył kontrast **paska do tła**, a tekst wiersza leży NA
pasku — więc mierzył nie to, co trzeba (`UX-POPRAWKI.md A14`). Przy `opacity: .85`
żadna z barw nie przechodziła 4,5:1 dla tekstu 12 px; najgorszy żółty dawał 3,50.

Rozstrzygnięcie: `.bar` schodzi na `opacity: .55` (najgorsza para wychodzi wtedy
na **5,58:1**; przy `.7` żółty ma 4,30 i próg nadal pada), a **pełne nasycenie
zostaje w 3‑pikselowej nasadce `.bar-cap`** na lewej krawędzi. Liczby wyżej
w tej sekcji dotyczą pełnego nasycenia i **nadal obowiązują dla nasadki** — to
ona niesie tożsamość, pasek niesie wielkość.

Przypięte testem w `palette.test.ts`, który czyta krycie Z ARKUSZA panelu, nie ze
stałej: podniesienie go „bo ładniej” zapala czerwone, a nie przechodzi po cichu.

⚠️ **Stało tu: „odznaka z literą profesji, o której mówi akapit wyżej, nadal nie
istnieje w drzewie — czyli «rozróżnialność bierze na siebie odznaka» jest na
razie planem, nie opisem". Sprostowane 2026‑08‑02.** Odznaka jest w drzewie od
2026‑08‑01 (`AUDYT‑14`, `3a784f6`): rysuje ją `.label[data-prof]::before`,
ustawia `markProfession`. Od 2026‑08‑02 stoi na KAŻDYM szczeblu wymieniającym
postacie, nie tylko w rankingu — `UX.md §6` i
[`specy/2026-08-02-jednolity-wyglad-wiersza.md`](specy/2026-08-02-jednolity-wyglad-wiersza.md).

Skąd rozjazd: status tej samej rzeczy żył w dwóch plikach. `AUDYT.md`
sprostowano w dniu naprawy, a to zdanie zostało — czyli dokładnie ten sam
mechanizm, który `AUDYT §G` opisuje przy `A14` i `SOLID §11` przy swojej
tabeli, trzeci raz. Wniosek jest za każdym razem ten sam: **poprawia się to,
co się czyta**, a czyta się dokument, w którym pracujemy akurat tego dnia.

### Jedna nazwa na rodzinę (2026‑08‑01)

Log nazywa tę samą rzecz dwojako, zależnie od tego, którędy przyszła: żywioł
z klasy CSS mówi `ogień`, a tykający efekt `od ognia`. Sekcja `TYP OBRAŻEŃ`
wymieniała surowe etykiety, więc rodzina stała w niej **dwa razy, w tej samej
barwie** — u bossa z Hildur dziewięć wierszy w dwóch gramatykach.

Odtąd przekrój idzie po rodzinach (`typeDisplay` w `types.ts`), a tykające efekty
dostają mianownik (`dotLabel`): `od trucizny` → `Trucizna`, `po zranieniu` →
`Zranienie`. Rodzaj, którego rodziny nie znamy, mówi to wprost i zostawia w
nawiasie to, co log podał: `globalne` → `Nieznany (obszarowe)`, `dmgo` →
`Nieznany (dmgo)`. Rodzaj tykający spoza mapy zostaje **dosłownie** — nowy format
ma być widać.

Co się przy tym traci świadomie: `fizyczne` i `dystansowe` to jedna rodzina
(`Broń`), więc rozbicie na zwarcie/dystans znika z tej sekcji. Nie znika z
danych — parser dalej je rozróżnia i jest to testowane w `stats.test.ts`
(„rozróżnia klasy obrażeń fizycznych”). Szczegóły: `AUDYT.md AUDYT‑27`.

Odpadło przy okazji: `ColorAssignment`, `MAX_SERIES` i `OTHER_LABEL` nie mają już
użytkownika w `src/` — barwa z atrybutu nie ma czego wyczerpać, więc cała klasa
błędu „pula kolorów kończy się po ośmiu nazwach” (dawne `UX-POPRAWKI.md A3`) zniknęła
z definicji, a nie została załatana.

## Blok, osłabienie i to, co pochłonięte — 2026-08-01

Trzy liczby o tym samym: ile obrażeń NIE weszło. Log podaje je trzema drogami
i to, że stoją w panelu osobno, jest decyzją, nie niedoróbką.

**`damageAbsorbed` (`raw − applied`) — dokładne.** Obie liczby stoją w logu
wprost, w tej samej linii ciosu. Nic tu nie jest liczone „na oko”.

**`damageBlocked` („Zablokowanie 47 obrażeń”) — dokładne i będące CZĘŚCIĄ
tamtego.** Zmierzone na 20 wystąpieniach w korpusie: blok to za każdym razem
dokładnie 30 % `raw`, a `raw − applied` jest zawsze WIĘKSZE — resztę zdejmuje
pancerz i odporności, których log nie rozbija na składniki.

**To nie jest wniosek z 20 obserwacji — to cytat** (dopisane 2026‑08‑01, po
przejściu procedury z `MECHANIKA.md`). Oficjalna „Mechanika walk” mówi:

> „Zdarzenie powoduje zredukowanie obrażeń od broni głównej przeciwnika
> (zarówno obrażeń magicznych, jak i fizycznych) podczas przyjętego ataku
> **o 30%**.” · „**Redukcja obrażeń podczas bloku następuje przed** redukcją
> przez absorpcję, pancerz oraz odporności.”

Artykuł podaje też pełną **kolejność redukcji obrażeń w ramach ciosu**:
1. efekty osłabiające źródła obrażeń → 2. Unik, Parowanie, Blok strzały →
3. **Blok** → 4. Pancerz → 5. Absorpcja i absorpcja magiczna → 6. Odporności na
żywioły → 7. odporności bonusów legendarnych → 8. efekty zerujące. Czyli
`pochłonięte` to suma etapów 3–7, a `blok` to etap 3 — „resztę zdejmuje pancerz
i odporności” przestaje być domysłem.

**Nowe, czego repo nie wiedziało:** „Obrażenia od broni pomocniczej nie mogą
zostać zmniejszone poprzez blok — atak nigdy nie jest blokowany”, a blok
w ogóle nie zachodzi bez tarczy. W korpusie nie ma zrzutu z tancerza ostrzy
z zablokowanym ciosem, więc dziś nic z tego nie wynika dla kodu — ale gdy taki
zrzut się pojawi, to jest miejsce, w którym trzeba sprawdzić, czy 30 % liczy się
od całego `raw`, czy od samej broni głównej. Cytaty i reszta: `MECHANIKA.md`.

Stąd zapis
`pochłonięte 55 923 (blok 10 568)`: dwie liczby postawione obok siebie w liście
członów zaprosiłyby do dodania ich do siebie, a suma nie znaczyłaby nic. Ta sama
zasada, co przy unikach częściowych i przy super‑krytach — **nawias należy do
liczby, którą rozbija**. Pilnuje tego niezmiennik `damageBlocked ≤
damageAbsorbed`, lecący po całym korpusie i po sumie sesji.

Uwaga na stronę: log podaje blok w bloku ciosu NAPASTNIKA, ale mówi o tarczy
BITEGO — więc liczba siada u celu. Odwrotnie byłoby to „ile mój cios
zablokował”, czyli zdanie bez sensu.

**`damageWeakened` („osłabione o 25%”) — ODTWORZONE, i dlatego osobne.** Log
podaje kwotę już PO osłabieniu i sam procent, więc pełne tyknięcie wychodzi
z `amount / (1 − p)`. Że kwota jest „po”, a nie „przed”, wiadomo z porównania:
tiki tego samego efektu na tym samym celu bez osłabienia trzymają stałą wartość
(np. 429), a osłabione o 19 % dają 348 — czyli 429 × 0,81. Odtworzona baza trafia
w tę wartość **16 razy na 16, z błędem do 2 %**; błąd bierze się stąd, że gra
zaokrągla procent do liczby całkowitej.

Kuszące było dosypanie tego do `damageAbsorbed` — to przecież ta sama rzecz, tyle
że dla trucizn. Odrzucone: `damageAbsorbed` jest **wyliczone**, a to
**oszacowane**, i wlanie jednego w drugie zamieniłoby liczbę dokładną
w przybliżoną bez żadnego sygnału dla czytającego. Zasada „nie udawaj danych,
których log nie ma” obejmuje też precyzję, nie tylko atrybucję.

Zostaje z tego jedna nieoczywistość, którą trzeba znać: `damageWeakened` **nie
jest** podzbiorem `damageAbsorbed` i potrafi być od niego większe — walka
z kukłą ma `pochłonięte 10` przy `osłabione 101`, bo kukła nie redukuje ciosów,
a trucizny są osłabiane. To nie jest rozjazd; to dwie różne rzeczy pod
podobnymi nazwami.

## „Na turę” — zgłoszone jako podejrzane, DO POPRAWY (2026-07-27) [otwarte]

Zgłoszenie użytkownika: „«na turę» źle liczy lub pokazuje”. Sprawdzone na
fixture `2026-07-22_lowca-tropiciel-vs-regulus-grupowa` (26 tur walki) przez
porównanie każdej liczby z panelu z surowymi `ActorStats`.

**Wynik sprawdzenia: błędu arytmetycznego NIE ma.** Każda liczba zgadza się co do
cyfry z regułą, którą deklaruje kod. Źle jest co innego: **ten sam sufiks `/t`
opisuje w panelu trzy różne wielkości naraz i nic tego nie sygnalizuje.** Stąd
odczucie „pokazuje źle” jest uzasadnione, nawet jeśli dzielenie jest poprawne.

Surowe dane fixture'u:

```
Regulus Mętnooki  side=1  tury=14  zadane=39352  otrzymane=16601
Łowcosław Kazrek  side=0  tury= 5  zadane= 4379  otrzymane=20166
wf foverek psk    side=0  tury= 7  zadane= 2889  otrzymane=19186
```

### 1. Wiersze nie sumują się do drużyny — ale tylko przy Zadanych

To jest najpoważniejsze. Panel pokazuje jedno pod drugim ranking i sumę drużyny,
a przy „Zadane / na turę” te dwie rzeczy liczą się przez INNY dzielnik:

```
Zadane, na turę:     2810,9 + 875,8 + 412,7 = 4099,4     sumy drużyny: 1793,1/t
Otrzymane, na turę:   775,6 + 737,9 + 638,5 = 2152,0     sumy drużyny: 2152,0/t  ✓
```

Zadane dzielą się przez tury WŁASNE postaci (`turnsFor`, `overlay.ts:434`), więc
każdy wiersz ma inny mianownik i dodać ich się nie da. Otrzymane dzielą się przez
tury walki — wspólny mianownik, więc tam sumowanie wychodzi. Jeden przełącznik,
dwie różne arytmetyki, zero sygnału w UI. Reguła sama w sobie jest przemyślana
(patrz komentarz przy `turnsFor`: kto zginął przed swoją turą, nie ma pokazywać
„0 na turę”) — problemem jest to, że obie są podpisane identycznie.

### 2. Procent w nawiasie nie opisuje liczby, przy której stoi

W trybie „na turę” wiersz Regulusa pokazuje `2810,9/t (84% · 39,4k)`. Ale 84% to
udział w SUROWYCH sumach (39352 z 46620), a nie udział pokazanego tempa
(2810,9 z 4099,4 = 69%). To jest świadoma decyzja z `UX-POPRAWKI.md A2` — mianownikiem
Σ(temp) była wielkość bez sensu fizycznego, więc udziały celowo zostały przy
sumach. Tyle że po zmianie układu wiersza procent stoi teraz w JEDNYM nawiasie
razem z drugą miarą, tuż przy tempie, i czyta się jak jego udział.

### 3. `/t` to dwa różne dzielniki, nazwane tylko w dymku

`turnsFor` daje tury własne dla zadanych, a tury walki dla otrzymanych i
leczenia. Przełączenie zakładki zmienia skalę liczby, nie zmieniając podpisu.
Dymek mówi to słowami (`turnKind`, „Na turę własną” / „Na turę walki”) — wiersz
nie mówi nic. To dawne `UX-POPRAWKI.md A4`: uznane za załatane dymkiem, ale sam wiersz
został bez sygnału.

### Co z tym zrobić — do decyzji, NIE zrobione

Kierunki, nie plan. Wybór jest projektowy, nie techniczny:

- Ujednolicić dzielnik do tur walki wszędzie — wtedy wszystko się sumuje i „/t”
  znaczy jedno. Kosztem jest to, przed czym broni dzisiejsza reguła: kto stracił
  tury, znów wygląda słabiej, choć bije mocno.
- Zostawić dzielniki, ale przestać stawiać sumę drużyny pod listą, której nie da
  się do niej dodać (albo podpisać ją wprost jako liczoną inaczej).
- Przy „na turę” liczyć udział z tempa, przyjmując Σ(temp) jako mianownik — czyli
  cofnąć A2. Odrzucone raz, ale wtedy nawias przynajmniej opisuje swoją liczbę.

Reprodukcja: skrypt liczący to wszystko z fixture'u stoi w historii sesji;
najkrócej — `overlay.render(stats, stats)`, klik „na turę”, odczyt `.rows .row`,
`.team-total` i `.sides-row`, porównanie z `stats.actors`.

## Przegląd — 2026-07-30

Reweryfikacja całego przeglądu z 2026‑07‑19 na bieżącym kodzie (po `3814a42`)
plus **pierwszy przegląd nagrywania, archiwum, odtwarzania i palety** — czyli
kodu, który powstał już po tamtym przeglądzie. Pełne listy siedzą w dokumentach
obok; tutaj zostaje to, co zmienia obraz całości.

**Gdzie co jest od tego przeglądu:**

| plik | co zawiera |
|---|---|
| `UX.md` | spec zachowań — jak to ma się klikać |
| `UX-POPRAWKI.md` | usterki widoczne dla użytkownika (`A…`) i nowe wygody (`B…`) |
| `SOLID.md` | usterki działania (`§4…`), dług architektoniczny, testy |
| `TOOLING.md` | budowanie, `@match`, wersjonowanie, CI |
| `DECYZJE.md` (ten plik) | **dlaczego** kod wygląda, jak wygląda; ograniczenia danych |
| `AUDYT.md` | migawka **otwartych** spraw z przeglądu 2026‑07‑31, ID `AUDYT‑N` |

Oba dokumenty poprawkowe leżały wcześniej w roocie; są teraz w `docs/`, żeby
wszystko, co dotyczy pracy nad kodem, stało w jednym miejscu.

**Statusy z 2026‑07‑19 — bilans.** Z 25 punktów **zamknięte są 24 opisane
w „Naprawione” plus czternaście z listy otwartych** (`sourceHpPct → null`,
leczenie z HP celu, formy żeńskie, NBSP, kropki w regexach leczenia, pasek stron
przy zerze, sufit wysokości listy, `maxHit` tylko `strike`, „tura tła”
w `addToTurn`, wspólny roster w `opponentOf`, dubel `fight-start`,
`RE_MODIFIER`, trwały `<header>`, udziały % z surowych sum). **Otwarte
zostają**: `/t` jako dwa dzielniki, `findBattleLog` przy jednoliniowym logu,
pełny reparse bufora, metryka „Tury”, separator tysięcy (inaczej, niż zapisano —
patrz `SOLID.md §4.19`), `procs` łykające zasoby, `unattributedHealing` bez
stron, `estimateMaxHp` tylko w testach, niesprzątany `setInterval`, twarde
`typeof` w `roster.ts` i cały martwy kod.

**Najcięższe, czego wcześniej nie było widać:**

1. **`dealtToBy` nie jest scalane w sumie sesji** (`SOLID.md §4.11`) — 46
   rozjazdów na 15 fixture'ach, a liczby wychodzą DZIŚ przyciskiem „kopiuj”.
   To druga po `abilityUses` ofiara ręcznego `mergeStats`, więc R3 przestaje być
   opcjonalne.
2. **Dymek jest w podglądzie z archiwum martwy** (`UX-POPRAWKI.md A7`) —
   `showTip` czyta walkę na żywo zamiast tego, co panel pokazuje.
3. **W trakcie odtwarzania nie da się kliknąć nic poza sterowaniem**
   (`UX-POPRAWKI.md A8`) — ta sama klasa, którą `2cabd6d` naprawił dla wierszy,
   tyle że reszta panelu jej nie dostała.
4. **Przycięcie bufora obniża sumy** (`SOLID.md §4.12`) — z zastrzeżeniem, że
   **przesłanki nie potwierdza żaden fixture**: największy zrzut DOM (742 linie)
   nadal ma linię otwierającą. Albo licznik zaniża, albo `merge` w nagrywarce to
   martwa złożoność. Rozstrzyga jeden zrzut z długiej walki.
   **Domknięte pomiarem 2026‑07‑31:** zrzut z walki z Hildur ma 1373 linie —
   prawie dwa razy tyle — i nagłówek nadal na miejscu. Teza zostaje
   niepotwierdzona, a ciężar dowodu przechodzi na `merge`. Szczegóły i następny
   krok przy §4.12.
5. **Kontrakt „nieznany kształt musi być głośny” ma wyjątki** — nieznana klasa
   `dmg*` staje się cicho „bez żywiołu” (`SOLID.md §4.17`), a separator tysięcy
   obcina liczbę bez `unknown` (`§4.19`).

**Sprawdzone i NIE jest problemem** (żeby nikt nie badał drugi raz):

- **Arytmetyka klatek odtwarzania jest poprawna** — `progress = at/lines.length`,
  `seek(round(f·len))` i stan końcowy `at === lines.length` są spójne, bez
  off‑by‑one. Odtwarzanie zatrzymuje się jedno bezczynne tyknięcie po ostatniej
  klatce, co jest niewidoczne. (Osobna sprawa: `seek` skacze po liniach, gdy
  etykieta mówi o turach — `UX-POPRAWKI.md B2`.)
- **Heurystyka „ostatnia linia to niedomknięty cios” działa** — przejście
  wszystkich klatek 15 fixture'ów dało **0 klatek** z `unknownLines > 0`, więc
  ostrzeżenie w stopce nie mruga podczas odtwarzania.
- **`Ticker` nie wycieka** — `stopReplay` jest osiągalne z `open`, `play`,
  `loadPasted` i `closePreview`, a `step` sam się zatrzymuje na końcu. Listenery
  sterowania są wiązane raz, na trwałych węzłach.
- **Kolizja `.row` między delegacją overlaya a wierszem wklejania w archiwum jest
  problemem stylu, nie klikania** — `rowIdentity` zwraca dla niego `null`.
- **Syntetyczny log nie wjeżdża do bundle'a** — `dist/margometer.user.js` nie
  zawiera ani `syntheticFight`, ani jego nazw.

## Przegląd kodu — 2026-07-19

Pełny przegląd modułów. Każdy punkt odtworzony uruchomieniem kodu na fixture'ach
albo na scenariuszu syntetycznym; przy każdym stoi, jak się go wywołuje.

⚠️ **Nagłówki `[otwarte]` w tej sekcji KŁAMIĄ i tak zostają — świadomie.**
Znaczyły „nie naprawione” w dniu przeglądu (2026‑07‑19), a nie „nie naprawione
dziś”; większość tych punktów została od tamtej pory zamknięta, każdy w swoim
rejestrze. Aktualny stan czyta się z `AUDYT.md`, `SOLID.md` i `ROADMAP.md`, nie
stąd. **Zmiana ich na `[historyczne]` byłaby czwartym miejscem, w którym żyje
ten sam status** — a to jest dokładnie ta pomyłka, którą repo złapało u siebie
pięć razy (`AUDYT‑46`, `AUDYT‑47`, `SOLID §10`, `§11` i właśnie tu).

Punkty zamknięte oznaczam więc **przy nich samych**, przekreśleniem i datą, gdy
akurat po nie sięgam — a nie przepisywaniem nagłówków. Ten akapit istnieje po
to, żeby nikt nie wziął tej sekcji za listę zadań; brano ją tak co najmniej raz.

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

**~~Metryka „Tury" jest nieosiągalna z UI.~~ ZAMKNIĘTE 2026‑08‑03 — odpuszczona.**
Opis był trafny („funkcja porzucona w połowie, nie przeoczenie") i tak też
została rozstrzygnięta: `"turns"` zeszło z typu `Metric`, `turnRows()` z drzewa
już 2026‑07‑31. Tury i tury utracone zostają w dymku.

**~~Sesja jest liczona i nigdy nie pokazywana.~~ ZAMKNIĘTE 2026‑08‑03 —
usunięta.** `Session.total()`, `mergeStats` i drugi argument `render()` zeszły
z drzewa (`AUDYT‑6`). Zdanie „liczona i nigdy nie pokazywana" stało tu od
2026‑07‑19 i przez ten czas ta funkcja zdążyła wygenerować trzy usterki
(`§4.11`, `AUDYT‑37`, `AUDYT‑5`), z których żadnej nie zobaczył użytkownik.

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
- ~~`stats.ts:614` — `unattributedHealing` jest jedną liczbą, podczas gdy
  `unattributedDotDamage` jest rozbity na stronę. Filtr „My"/„Oni" pokaże to samo
  leczenie na obu zakładkach.~~ **Naprawione 2026‑08‑01** — obie pule mają teraz
  wspólny kształt `BySide`, a przypis schodzi też do wybranej postaci
  (`AUDYT.md AUDYT‑26`).
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
