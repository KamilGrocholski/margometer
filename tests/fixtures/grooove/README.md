# Korpus protokołu walk z grooove.pl

12 publicznych walk pobranych z [`grooove.pl/battle`](https://grooove.pl/battle/),
z pięciu **polskojęzycznych** światów, razem **1502 zdarzenia, 123 różne klucze
protokołu, 61 nazw umiejętności i 64 nicki** na 87 kB.

**To NIE jest korpus dla parsera.** `src/parser.ts` nie czyta tych plików i nie
ma czytać. Materiał dowodowy dla parsera stoi obok, w
[`../new-engine/`](../new-engine/) — tam są zrzuty tekstu z okna walki
(`raw.txt`) i DOM-u (`log.html`). Tutaj jest coś innego: **surowy protokół
silnika**, czyli to, z czego okno walki dopiero buduje zdania.

Ten korpus odpowiada na pytanie **„czy gra w ogóle emituje X i jak często"**.
Na „czy parser to czyta" odpowiada tamten.

---

## Skąd to się wzięło i czego tu nie ma

grooove.pl nie przechowuje tekstu z okna walki. Przechowuje dwa pola — skład
i log protokołu — a polskie zdania składa dopiero w przeglądarce, własnym
`battle_engine.js`. To **cudza reimplementacja renderera gry i jest do tyłu**.
Zmierzone 2026‑08‑03 na 28 publicznych walkach (5094 linie renderu):

- **227 linii wyszło jako „Nieznany parametr"**, 16 różnych kluczy — m.in.
  `active_decblock_per` (46×), `+crush_physical` (36×), `-legbon_facade` (28×).
  To ostatnie gra pokazuje dziś jako „Fasada opieki, 20% redukcji ciosów do
  końca walki" i stoi jako tekst w `../new-engine/2026-08-03_druzyna-vs-hildur-absorpcja`.
- Ten sam render przepuszczony przez `parse()` dał **132 z 223 zdarzeń jako
  `unknown`** — i to nie dlatego, że wzorce parsera są za wąskie, tylko dlatego,
  że to inny dialekt: grooove pisze `+1462` bez odstępów, `-0-37` sklejone,
  `obrażeń.` z kropką i ucina życie do pełnych procent (`98%` zamiast `98.16%`).

Dlatego renderu **nie zapisujemy i nie tłumaczymy**. Konwerter protokół →
tekst gry musiałby wymyślać brzmienie zdań, których gra przy nas nie
wypowiedziała — dokładnie to, czego zabrania „Nie udawaj danych, których log
nie ma" z `AGENTS.md`. W plikach leży wyłącznie protokół, jeden do jednego.

## Dlaczego pliki nie nazywają się `raw.txt`

Bo wtedy wpadłyby do pętli parsera i to bez niczyjej decyzji.

Globy w `parser.test.ts`, `stats.test.ts` i `mutanty.test.ts` szukają dwa
poziomy w głąb `tests/fixtures/` plików `raw.txt` i `log.html`. **Każdy nowy
katalog klienta wchodzi do nich automatycznie**, nigdzie nie trzeba go
rejestrować — to wygodne dla zrzutów z gry i groźne dla wszystkiego innego.
Korpus protokołu wywaliłby niezmiennik „każda linia rozpoznana", a stamtąd
prowadzi krótka droga do rozszerzania wzorców parsera pod cudzy renderer.

Nazwa `log.grooove.txt` jest więc mechanizmem, nie estetyką. Pilnuje jej test
w [`../../grooove.test.ts`](../../grooove.test.ts) — razem z tym, że w tym
katalogu nie ma ani jednego `raw.txt` ani `log.html`.

## Format pliku

Dwie linie, wartości dokładnie takie, jakie serwuje strona:

```
team=23244|Dark Laser|m|2|24277|Baylan|m|1
log=|0;0;a.Walka bez Punktów Honoru…|24277.100.00;23244.98.29;@D.1462;T.439;-D.254|…
```

- **`team`** — czwórkami po `|`: `id | nick | płeć | numer drużyny`.
- **`log`** — zdarzenia rozdzielone `|`; wiodący `|` jest pusty.

Zdarzenie ma kształt `strona;strona;klucz.wartość;klucz.wartość;…`:

- dwa pierwsze segmenty to strony. Każdy jest albo `0` (brak strony), albo
  `id.życie.setne` (`24277.100.00`), albo **samo `id` bez życia** — ten trzeci
  kształt wychodzi przy kluczu `e.` i łatwo go przeoczyć (`718280;0;e.17696`);
- dalej idą parametry. Klucz kończy się na **pierwszej** kropce, bo wartość bywa
  złożona: `X.1053,a,Dark Laser(92.90%)`;
- część parametrów nie ma wartości i jest całym segmentem (`r`, `x`, `P`, `flee`).

Do oglądania:

```bash
bun tools/grooove.ts --pokaz 2026-08-03_pandora_wojownik-vs-mag-fuzja
bun tools/grooove.ts --parametry     # które klucze ma korpus i ile razy
```

**Podziału po `|` nie utrwalamy w pliku.** Dowodem jest to, co serwuje strona,
a nie nasze formatowanie — narzędzie rozbija log przy czytaniu.

## Po co to jest — konkretnie

Klucze protokołu to w dużej części **nazwy silnikowe, których oficjalna pomoc
gry używa wprost**, w nawiasie obok nazwy polskiej. To robi z tego korpusu
pomost między logiem a `docs/MECHANIKA.md`. Trzy sprawdzone sondą
`bun tools/pomoc.ts` 2026‑08‑03 (cytaty dosłowne z artykułu „Mechanika walk"):

| Klucz w korpusie | Co mówi pomoc gry |
|---|---|
| `legbon_holytouch_l` | „Dotyk anioła ( holytouch ) • Działanie: podczas walki istnieje prawdopodobieństwo na zajście zdarzenia, podczas którego Postać aplikuje na siebie efekt rozłożony na 3 tury, którego każde wyzwolenie leczy Postaci 6% puli punktów zdrowia." |
| `-legbon_facade` | „Fasada opieki ( facade ) • Działanie: w przypadku przyjęcia przez Postać niezerowych obrażeń podczas ciosu, są one redukowane o pewną ich część." |
| `@legbon_puncture` | „Przeszywająca skuteczność ( puncture ) • Działanie: podczas walki ataki posiadacza ignorują statystyki defensywne celu — pancerz, odporności magiczne, absorpcję oraz absorpcję magiczną, punkty uniku i punkty bloku." |

Droga jest zawsze ta sama: klucz z korpusu → rdzeń nazwy → `bun tools/pomoc.ts
<rdzeń>` → cytat do rejestru w `docs/MECHANIKA.md`. Procedura i powód, dla
którego NIE robi się tego `WebFetch`-em, stoją w tamtym pliku.

**Ta droga jest zautomatyzowana — `bun tools/luki.ts`.** Narzędzie składa trzy
źródła (pomoc gry, ten korpus, korpus tekstowy) i rozkłada 123 klucze na cztery
kubełki: `ZNANE`, `LUKA`, `STAT` (statystyka bez linii w logu) i `NIEZNANE`.

## Co ten korpus już dał

**Testy parsera na prawdziwych nazwach** —
[`../../parser-grooove.test.ts`](../../parser-grooove.test.ts). Pola `opening`
i `team` są autentyczne (grooove ich nie renderuje) i pochodzą z DWÓCH różnych
miejsc, więc zgodność między nimi coś znaczy. Sprawdzane: skład z linii
otwierającej przeciw składowi z `team`, round‑trip 64 prawdziwych nicków
i 61 nazw umiejętności, oraz jawna asercja, że **każdy** fixture w korpusie ma
polską linię otwierającą — patrz „Dlaczego korpus jest tylko polskojęzyczny".

Dwa efekty, które gra dokumentuje, protokół dowodzi w prawdziwych walkach,
a korpus tekstowy **nie zna ich ani razu**:

- **Krwawa udręka ( anguish )** — 11 wystąpień w dwóch walkach. Pomoc:
  „obrażenia od krwawienia rozłożone w czasie na pięć tur", czyli ta sama
  rodzina co trucizna i głęboka rana, którą parser czyta jako `kind: "dot"`,
  a agregat przypisuje sprawcy. Jedyny z dziesięciu bonusów legendarnych
  wymienionych w pomocy, którego korpus tekstowy nie widział.
- **Wściekłość ( rage )** — 26 wystąpień w sześciu walkach, najczęstszy klucz
  bez odpowiednika.

Oba siedzą w `docs/MECHANIKA.md` z dosłownymi cytatami i w `docs/ROADMAP.md`
jako brakujące fixture'y. **Żaden z nich nie jest podstawą do dopisania wzorca
w parserze** — protokół nie mówi, jak brzmi linia, a renderu grooove'a nie wolno
przepisać. To pozycje na liście zakupowej: takich walek trzeba poszukać w grze.

To jest zarazem odpowiedź na pytanie „po co ten korpus, skoro parser go nie
czyta". `docs/ROADMAP.md` stawia pod kierunkiem „jakość danych" pozycję *dowód,
że czujka `unknown` jest ciasna — korpus ma zero nieznanych linii, więc sam
z siebie nie mówi nic o tym, czego parser NIE rozpoznaje*. Korpus protokołu jest
tym spojrzeniem z zewnątrz.

**Czego korpus NIE rozstrzyga.** Nie mówi, jak dana wartość wygląda w oknie
walki — tego trzeba szukać w `../new-engine/` albo zrobić nowy zrzut z gry.
Klucz obecny tutaj i nieobecny tam znaczy tylko tyle, że **nie mamy próbki
tekstowej**; nie znaczy, że gra tego nie wypisuje.

## Jak dołożyć walkę

```bash
bun tools/grooove.ts --lista --swiat nerthus          # kandydaci z gotowymi komendami
bun tools/grooove.ts --pobierz <ID> --swiat <świat> --nazwa <slug>
```

Trzy rzeczy, o których trzeba wiedzieć:

1. **Tylko polskie światy publiczne.** Narzędzie trzyma whitelistę z menu
   `grooove.pl/battle/` i odmawia pobrania spoza niej. Globalny feed na stronie
   miesza światy prywatne — przy przeglądaniu wpadły `luvia` i `nexos`.
   Świat podaje się ręcznie, bo strona pojedynczej walki go nie niesie.
   Trzy światy anglojęzyczne (`husaria`, `cronus`, `steamrealm`) stoją w osobnej
   liście `SWIATY_ANGLOJEZYCZNE` i dostają **inny komunikat błędu** niż świat
   nieznany — bo „nie ma takiego świata" byłoby nieprawdą, a odsyłacz do menu
   grooove'a niczego by nie rozstrzygnął. Powód niżej.
2. **Nie każda walka ma log.** Właściciel zrzutu może go ukryć albo usunąć,
   a strona oddaje wtedy zwykłe HTTP 200 bez danych — na 30 pobranych walk
   trafiły się dwie takie. Narzędzie mówi to wprost i nie zapisuje pustego pliku.
3. **`covers`, `missing` i `notes` pisze człowiek.** `--pobierz` zostawia tam
   „DO UZUPEŁNIENIA" i test się o to zapala. Opisuj **zawartość pliku** („ma
   klucze `@Dc` i `@Dl`", „20 uczestników"), a nie zachowanie gry — zdanie
   o grze wymaga cytatu z pomocy, patrz `.claude/rules/mechanika-gry.md`.

Ta sama walka bywa na grooove pod kilkoma ID, bo zapisuje ją każdy uczestnik
osobno — `2026-08-03_tempest_ucieczka-bez-rozstrzygniecia` leży tam pod trzema.

## Skąd akurat te dwanaście

Dobór szedł w trzech turach i **każda odpowiadała na inne pytanie**: pierwsza
o pokrycie protokołu, druga o kształt nazw, trzecia — 2026‑08‑04 — odjęła dwie
walki z Cronusa razem z decyzją o polskojęzyczności (sekcja niżej).

### Dziesięć za pokrycie kluczy

Jedenaście wybrało **zachłanne pokrycie kluczy**: bierz walkę, która dokłada
najwięcej kluczy jeszcze niewidzianych, powtórz. Na 142 przejrzanych walkach
z sześciu światów jedenaście walk pokryło wszystkie 130 kluczy — pierwsza dała
76, ostatnie cztery po jednym. **Dwie z tych jedenastu były z Cronusa i już ich
tu nie ma**, więc dziś z tej tury zostaje dziewięć walk i 123 klucze.

Ostatnie cztery zasługują na uwagę, bo pokazują, że próg „jeszcze jeden klucz"
wybiera sensownie: tak weszła
`2026-08-03_tempest_ucieczka-bez-rozstrzygniecia` — 4 zdarzenia i 6 kluczy,
utrzymana w korpusie przez jeden jedyny `flee`, a przy okazji jedyna walka,
w której zwycięzcą jest znak zapytania.

Dwunasta doszła ręcznie, bo pokrycie kluczy jej nie widzi:
`2026-08-03_nerthus_tropiciel-lowca-vs-tropiciel` nie wnosi ANI JEDNEGO nowego
klucza. Weszła za najwyższy próg poziomów w składzie (427–444) i za świat
Nerthus. Gdyby korpus trzeba było przyciąć, to pierwszy kandydat — i dlatego
jest to napisane tu i w jej `meta.json`, a nie zostawione do ponownego odkrycia.

Dwa światy są w korpusie po jednej walce (Nerthus, Zorza), Gefion i Pandora mają
po trzy, Tempest cztery. **To nie jest parytet i nie ma nim być** — o doborze
decydowały klucze, nie świat.

⚠️ Do 2026‑08‑04 stało tu „Trzy światy w korpusie są po jednej walce, Pandora ma
trzy". Zdanie było prawdziwe, kiedy je pisano, i przestało być takie tego samego
dnia, przy dokładaniu dwóch walk za nicki — nikt go wtedy nie przeliczył. Tyle
żyje w tym repo zdanie o liczbie, którego nie pilnuje test.

### Dwie za nicki

Doszły 2026‑08‑04 i **żadna nie wnosi ani jednego nowego klucza** — weszły za
kształt nazw, którego pozostałe dwanaście nie miało. Czyta je
[`../../parser-grooove.test.ts`](../../parser-grooove.test.ts):

- `2026-08-04_tempest_dragon-spacje-w-nicku` — nick **`D r a g o n`**, czyli
  pojedyncze litery ze spacjami, a więc podciąg „ a " w środku nazwy. To jest
  **jedyny nick ze 191 przejrzanych, który na prawdziwej linii otwierającej
  wykrywa rozluźnienie `splitSides`** z `/\)\s+a\s+/` do `/\s+a\s+/`: skład
  rozpada się wtedy na `["g o n", "Absolwemt"]`. Drugi i ostatni nick z „ a "
  w środku, `Tears of a Clown`, stał w swojej walce PO separatorze, więc luźny
  wzorzec trafiał tam przypadkiem w to samo miejsce i nic nie zauważał — jego
  walka była z Cronusa i wyszła z korpusu (sekcja niżej). Pomiar zostaje, bo
  szedł po walkach PRZEJRZANYCH, nie po korpusie.
- `2026-08-04_gefion_siedmioro-vs-jeden-spojnik-w-nicku` — **`talerz i hantle`**
  (spójnik w środku nazwy), `fit-executor` (myślnik), `Feeh Zbożownik`
  i `Janinka Króliczynka` (polskie znaki). `RE_PARTICIPANT` obcina wiodące
  `a `, `i ` i przecinek, a w 191 nickach **nie ma ani jednego zaczynającego
  się** od takiego słowa — spójnik w środku jest najbliższą rzeczą, jaką
  prawdziwe dane dają.

### Minus dwie z Cronusa — dlaczego korpus jest tylko polskojęzyczny

Do 2026‑08‑04 leżały tu dwie walki ze świata **Cronus**, w menu grooove'a
z dopiskiem `[EN]`. Weszły celowo i pokazywały jedną konkretną rzecz: że na
światach anglojęzycznych **angielskie są tylko NAZWY** — linia otwierająca („The
battle between Freyr(244t) and Tears of a Clown(271m) has begun"), nazwy
umiejętności (`Frost Arrow`, `Rampage`, `First Aid`) i komunikaty `a.` („No
Glory reward - level difference too high.") — a **klucze protokołu zostają te
same**. Dwa pliki zamiast jednego, żeby to nie był domysł.

Decyzja właściciela repo: **korpus ich nie bierze**. Margometer czyta polskie
okno walki i `src/parser.ts` zna wyłącznie polskie `FIGHT_START_TEXT`, więc te
pliki nie odpowiadały na żadne pytanie tego repo — ale wchodziły do liczników,
progów i niezmienników tak, jakby odpowiadały. Skala, zmierzona przy usuwaniu:
**365 z 1867 zdarzeń (20 %) i 22 z 83 nazw umiejętności (26 %)** pochodziły
z materiału, którego parser nie ma prawa czytać. Próg „korpus daje dość nazw
umiejętności" stał przez to na 70 przy 61 polskich.

**Co z nimi wyszło i nie wróciło.** Siedem kluczy protokołu, których nie niesie
ani jedna polska walka w korpusie:

```
z__crit   z__pierce   spell-taken_D   critval-allies   critmval-allies   rk_per   g_
```

To jest cena tej decyzji i nie ma być przemilczana — dziś są to kandydaci do
znalezienia na polskim świecie, dokładnie tak samo jak `rage` i `anguish` wyżej,
tylko z drugiej strony (tam mamy klucz bez tekstu, tu nie mamy nawet klucza).
Kilka `meta.json` wymienia je w `missing`; te zdania zostają prawdziwe, ale od
2026‑08‑04 znaczą „nie ma tego NIGDZIE w korpusie", a nie „ma to sąsiad".

**Czego decyzja NIE unieważnia.** Ustalenie, po które te dwa pliki tu stały —
że klucze protokołu są wspólne dla obu wersji językowych — zostaje zapisane
tutaj i jest nadal prawdziwe. Zniknął dowód w plikach, nie wniosek.

Furtkę trzyma zamkniętą `SWIATY_ANGLOJEZYCZNE` w
[`../../../tools/grooove.ts`](../../../tools/grooove.ts) (pobranie = błąd
nazywający decyzję), a od strony korpusu — test „każdy fixture jest ze świata
polskojęzycznego" w [`../../parser-grooove.test.ts`](../../parser-grooove.test.ts).
Dwa mechanizmy, bo pierwszy nie widzi pliku wklejonego ręcznie, a drugi nie
widzi pobrania.
