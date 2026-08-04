# Mechanika gry — procedura i rejestr

**Co to jest.** Jedno miejsce na odpowiedzi na pytania „jak zachowuje się GRA”
— nie nasz kod. Każdy wpis ma przy sobie dowód: dosłowny cytat z oficjalnej
pomocy albo jawnie zapisane „nie znaleziono” razem z tym, czego szukano.

**Po co powstał.** Bo repo trzy razy zapisało „sprawdzone w pomocy, milczy”,
a dwa z tych trzech zapisów były nieprawdą — i wyglądały dokładnie jak fakt,
bo miały datę i adnotację „nie badać drugi raz”. Przyczyna była narzędziowa:
`WebFetch` na artykule „Mechanika walk” oddaje praktycznie sam spis treści,
a `curl` na ten sam adres — 669 kB i 399 tys. znaków tekstu. Fałszywy negatyw
kosztuje więcej niż brak wpisu, bo zamyka temat.

---

## Procedura

### 1. Rozpoznaj, że to pytanie o mechanikę

Test: **czy zdanie, które zamierzasz napisać, byłoby prawdziwe w cudzym repo
czytającym ten sam log?** Jeśli tak — mówi o grze, nie o nas, i idzie tędy.

- „`hits + misses` to liczba ataków” → o naszym kodzie, nie tędy.
- „unik rozstrzyga się raz na atak, nie na każdą liczbę obrażeń” → o grze, tędy.

Dotyczy **tak samo zdań negatywnych**: „log tego nie mówi”, „dokumentacja tego
nie rozstrzyga”, „gra tego nie robi”.

### 2. Rejestr najpierw

Sprawdź tabelę niżej. **Wpis negatywny wiąże tylko wtedy, gdy ma przy sobie
metodę i datę.** „Sprawdzone, milczy” bez metody jest do sprawdzenia od nowa —
dokładnie takie zdanie stało przy `AUDYT‑40` i było fałszywe.

### 3. Pełny tekst artykułu, nie streszczenie

```bash
bun tools/pomoc.ts "Unik ( evade )"
bun tools/pomoc.ts --artykul 205 łup
```

**Nie `WebFetch`** na `view,372` — sprawdzone: poproszony o treść podsekcji
odpowiada „nie znaleziono w pobranym tekście” i wypisuje same tytuły. Do
krótkich stron (`view,3`, `view,183`) wystarcza.

**Szukaj frazą, nie rdzeniem.** „unik” łapie też „unikatowy”, a takich
w artykule są dziesiątki. Pomoc podaje przy każdym zdarzeniu **nazwę
silnikową w nawiasie** i to ona jest najlepszą frazą: `Unik ( evade )`,
`Blok ( blok )`, `Głęboka rana ( wound0, of_wound0 )`. Gdy fraza nie trafia —
spróbuj synonimu z języka pomocy: „chybienie” zamiast „pudło”, „zdarzenie”
zamiast „proc”, „obrażenia wykonane / zadane” zamiast „surowe / przyjęte”.

### 4. Cytat albo nic

Do rejestru trafia **dosłowne zdanie z artykułu**. Parafraza jest bezwartościowa,
bo następny czytelnik nie odróżni jej od twojego wniosku. Ta sama zasada, co
przy fixture'ach: dowód ma dać się sprawdzić.

**Cytat wklejaj z wyjścia sondy, nie przepisuj.** Przy zakładaniu tego pliku
wzór na kryta wjechał tu jako `critgain [%] = …` — z `WebFetch`. W artykule stoi
`crit gain`, ze spacją, a sonda po pełnym tekście nie znajduje `critgain` ani
razu. Błąd jednej spacji, ale w zapisie, który udaje cytat, i tak jest
dyskwalifikujący: następny czytelnik szukałby frazy, której w źródle nie ma.

### 4b. Trzeci szczebel: asset klienta gry (od 2026‑08‑04)

Pomoc mówi, jak mechanika **działa**. Osobne pytanie brzmi „jak BRZMI linia,
którą gra o tym wypisze" — i na nie pomoc nie odpowiada nigdy. Odpowiada
tabela tłumaczeń klienta:

```bash
bun tools/slownik.ts --klucz "anguish"
```

Wyjście to **szablon zdania z assetu gry**, więc cytat stąd jest cytatem z gry,
nie z cudzej reimplementacji. Do rejestru wkleja się go tak samo dosłownie jak
zdanie z pomocy, razem z identyfikatorem i numerem builda.

⚠️ **Czego szablon NIE dowodzi.** (1) Że gra wypisze tę linię w konkretnej
walce — słownik zna brzmienie, nie warunek. (2) Że linia wygląda dokładnie tak
po złożeniu: `battleMsg` skleja w jedno zdanie kilka kluczy, podstawia odmianę
pod `#`/`$`, zamienia `++` na `+` i dokleja `<br>`. **Wzorzec parsera stawia się
na zrzucie z gry; szablon mówi, CZEGO w zrzucie szukać.**

### 5. Dopiero teraz korpus

`bun -e '…'` z importem `parse`/`aggregate` po `tests/fixtures/*/*/raw.txt`.

Dokumentacja mówi, co gra **zamierza**; korpus — co log **pokazuje**. Nie
zastępują się i oba są potrzebne: pomoc nie opisuje formatu logu ani jednym
zdaniem, a korpus nie powie, dlaczego liczba jest akurat taka.

### 6. Rozjazd jest wpisem, nie ciszą

Gdy pomiar przeczy dokumentacji, **w kodzie wygrywa korpus** — opisuje wersję
gry, którą dodatek faktycznie czyta, a artykuł bywa starszy niż ostatni dodatek.
Ale rozbieżność ląduje w rejestrze z obiema stronami i datą, a nie znika.

---

## Kiedy wolno napisać „dokumentacja tego nie rozstrzyga”

Dopiero po kroku 3 wykonanym **na pełnym tekście** i po sprawdzeniu co najmniej
dwóch sformułowań (polskiego i silnikowego). Zapis brzmi:

> **nie znaleziono** w `view,372`; szukane: „X”, „Y”, „Z”; metoda:
> `bun tools/pomoc.ts`; data: RRRR‑MM‑DD

a **nie** „nie ma”. Różnica nie jest kosmetyczna — to dokładnie ten skrót, który
zamknął `AUDYT‑40` fałszywym wnioskiem na tydzień.

---

## Źródła

| Artykuł | Adres | Co w nim jest |
|---|---|---|
| **Mechanika walk** | `pomoc.margonem.pl/index/view,372` | **Jedyny adres, który się liczy.** ~399 tys. znaków: system walki, system tur, statystyki postaci i NPC, efekty umiejętności, atrakcje. Wzory i pełne opisy zdarzeń |
| Mechanika Gry | `pomoc.margonem.pl/index/view,3` | O walce **nic** — „Wszelkie informacje odnośnie mechaniki walk … zostały przeniesione do Dokumentacji Mechaniki walk”. Sprawdzone 2026‑08‑01 |
| Słowniczek | `pomoc.margonem.pl/index/view,183` | Ogólne pojęcia. Nie zna ani uniku, ani bloku, ani ciosu krytycznego. Sprawdzone 2026‑08‑01 |

| **Tabela tłumaczeń klienta** | `commons.margonem.pl/js/dictionaries/dictionary_pl.js` | **Brzmienia linii**, nie mechanika. 233 etykiety renderera, 223 ze zdaniem, 0 do wyjaśnienia (build `1785244275300`, 2026‑08‑04). Sonda: `bun tools/slownik.ts` |
| Źródła klienta (build dev) | `experimental.margonem.pl` | Warunki i komentarze autorów przy każdej gałęzi. **Sześć tygodni starszy od produkcji** — struktura tak, brzmienia nie. Sonda: `bun tools/zrodla.ts --pokaz` |

Reszta pomocy nie była przeglądana systematycznie. Znajdziesz coś — dopisz tutaj
**razem z cytatem**, nie sam adres.

---

## Rejestr

Wszystko poniżej: `view,372`, sprawdzone **2026‑08‑01** metodą `tools/pomoc.ts`.

### Unik — rozstrzyga się raz na atak, a broń pomocnicza jest nieunikalna ✅

> „Zdarzenie powoduje zniwelowanie obrażeń od **broni głównej** przeciwnika,
> **w obrębie ataku**, do zera.”
>
> „**Obrażenia od broni pomocniczej nie mogą zostać uniknięte** — atak nigdy nie
> chybi. Oznacza to, że zdarzenia Głęboka rana pomocnicza, Cios krytyczny
> pomocniczy nie mogą być zniwelowane poprzez zajście zdarzenia uniku.”
>
> „Obrażenia od ciosów profesji mag nie mogą zostać uniknięte — atak nigdy nie
> chybi.” · „Maksymalna szansa na unik podczas walki wynosi 50%.”
>
> `evade [%] = evade points * 20 / min(lvl enemy, 300)`

**Wniosek dla kodu.** Unik pełny kontra częściowy (`AUDYT‑40`) jest w pomocy
opisany wprost, a nasz model — atak zeruje broń główną, pomocnicza może wejść —
jest z nim zgodny. Rozdzielenie `misses` i `partialMisses` ma odtąd uzasadnienie
w źródle, nie tylko w trzech obserwacjach z korpusu.

⚠️ **Ten wpis zastępuje zdanie, które było FAŁSZEM**: `docs/README.md` i `AUDYT‑40`
twierdziły, że artykuł „ani słowem nie mówi, jak zachowuje się broń pomocnicza”.
Powstało to z pojedynczego `WebFetch`, który oddał spis treści. Wpięte:
`docs/AUDYT.md` (`AUDYT‑40`).

### Blok — 30 % obrażeń broni głównej, przed pancerzem i odpornościami ✅

> „Zdarzenie powoduje zredukowanie obrażeń od broni głównej przeciwnika
> (zarówno obrażeń magicznych, jak i fizycznych) podczas przyjętego ataku
> **o 30%**.”
>
> „**Obrażenia od broni pomocniczej nie mogą zostać zmniejszone poprzez blok** —
> atak nigdy nie jest blokowany.”
>
> „**Redukcja obrażeń podczas bloku następuje przed** redukcją przez absorpcję,
> pancerz oraz odporności.”
>
> „Blok nigdy nie zajdzie, jeżeli Postać nie jest wyposażona w tarczę.”
>
> `block [%] = block points * 20 / min(lvl enemy, 300)`

**Wniosek dla kodu.** Zmierzone na korpusie „blok to zawsze dokładnie 30 % `raw`
i zawsze mniej niż `raw − applied`” **jest cytatem z pomocy**, nie wnioskiem
z 20 obserwacji. Stąd też bierze się kształt w panelu: blok w nawiasie przy
pochłoniętych. Wpięte: `docs/DECYZJE.md` („Blok, osłabienie i to, co pochłonięte”),
`src/types.ts` (`damageBlocked`), `docs/SOLID.md §4.22`.

**Nowe, czego repo nie wiedziało:** broń pomocnicza nie jest blokowana. Do
sprawdzenia przy pierwszym zrzucie z tancerza ostrzy z zablokowanym ciosem —
w dzisiejszym korpusie takiego nie ma.

### Kolejność redukcji obrażeń w ciosie ✅

> „Kolejność redukcji obrażeń w ramach ciosu: 1. Efekty umiejętności osłabiające
> źródła obrażeń (np. umiejętności Strach lub Toksyczne opary) — wynik tych
> obliczeń jest w logu walki widoczny jako obrażenia wylosowane przez
> atakującego. 2. Zdarzenia regularne niwelujące obrażenia (Unik, Parowanie,
> Blok strzały). 3. Blok. 4. Pancerz. 5. Absorpcja i absorpcja magiczna.
> 6. Odporności na żywioły. 7. Odporności bonusów legendarnych (Fasada opieki,
> Krytyczna osłona). 8. Pozostałe efekty zerujące obrażenia.”

**Wniosek dla kodu.** To jest pełna definicja tego, co panel pokazuje jako
`pochłonięte` (`raw − applied`): suma etapów 3–7. Wcześniej repo pisało
„resztę zdejmuje pancerz i odporności” jako domysł — teraz to lista ze źródła.

⚠️ Etap 1 mówi coś ważnego o `damageWeakened`: osłabienia źródła obrażeń są
widoczne w logu **jako obrażenia wylosowane przez atakującego**, czyli PRZED
`raw`. To nie jest to samo, co „osłabione o N%” przy tyknięciu DoT‑a, i nie
przesądza jeszcze naszego odtworzenia `amount/(1−p)`. **Do dokończenia** —
patrz „Otwarte” niżej.

### Cios bardzo krytyczny — bonus legendarny ✅

> „Dostępne są następujące bonusy: **Cios bardzo krytyczny**, Dotyk anioła,
> Klątwa, Oślepienie, Ostatni ratunek, Krytyczna osłona, Fasada opieki,
> Płomienne oczyszczenie, Krwawa udręka, Przeszywająca skuteczność.”
>
> „Bronie pomocnicze z faktu posiadania osobnego zdarzenia dla ciosu krytycznego
> (pomocniczego) posiadają również **osobne zdarzenie ciosu bardzo krytycznego
> pomocniczego**, który zwiększa siłę ciosu krytycznego pomocniczego o 75%.”

**Wniosek dla kodu.** Super‑kryt to bonus legendarny wzmacniający kryta, czyli
jego **podzbiór** — zgodne z pomiarem (10/10 razem ze zwykłym krytem) i z formą
`kryt. 7 (w tym 1 bardzo)`. Pomoc dorzuca istnienie osobnego wariantu
pomocniczego; nasz parser nie rozróżnia go od zwykłego super‑kryta i **nie ma
w korpusie próbki**, żeby sprawdzić, jak zapisuje go log.

### Przewaga poziomowa dla ciosu krytycznego ✅ (bez odbiorcy w kodzie)

> `crit gain [%] = sign(lvl attack - lvl defence ) * max(abs(lvl attack - lvl defence ) - 5, 0) * 3`
>
> `critval gain [%] = min(300 , sign(lvl attack - lvl defence ) * max(abs(lvl attack - lvl defence ) - 5, 0) * 10)`

**Wniosek dla kodu: żaden, celowo.** Licznik czyta log, nie symuluje gry —
wzór na szansę nie ma tu odbiorcy. Zapisany, żeby nikt nie szukał drugi raz.

⚠️ **Ten wpis jest jednocześnie dowodem, po co cała ta procedura.** Wzór trafił
tu najpierw w postaci `critgain [%] = …` — tak podał go `WebFetch`. W artykule
stoi `crit gain` (ze spacją), a obok niego drugi wzór, na SIŁĘ kryta, o którym
streszczenie nie wspomniało wcale. Sonda po pełnym tekście nie znalazła
`critgain` ani razu. Streszczenie nie tylko gubi treść — **przepisuje ją
niedokładnie i nadal wygląda jak cytat.**

### „Obrażenia globalne” — nie znaleziono ❌

**nie znaleziono** w `view,372`; szukane: „obrażenia globalne”, „globaln”,
„we wszystkich”; metoda: `bun tools/pomoc.ts`; data: 2026‑08‑01. Sześć trafień
na rdzeń „globaln” dotyczy „Dodatku globalnego do Gry”, nie obrażeń.

**Wniosek dla kodu.** Nazwa `globalne` dla klasy `dmgg` (`src/parser.ts`)
pochodzi z terminologii gry i z naszego zestawienia po korpusie, **nie z cytatu**
— i tak ma zostać opisana. Adnotacja w `meta.json` fixture'a
`2026-07-31_druzyna-vs-hildur-zwyciestwo` się broni.

### Linia „Stracono −N punktów życia X(pct%)” — nie znaleziono ❌, rozstrzygnięte pomiarem

**nie znaleziono** w `view,372`; szukane: „Stracono”, „trującą mgłą”, „mgła”,
„zatrutych przeciwników”, „traci punkty życia”, „utrata punktów życia”; metoda:
`bun tools/pomoc.ts`; data: 2026‑08‑03. Fraza „punktów życia” daje 12 trafień —
żadne nie dotyczy tej linii.

**Trafienie pośrednie.** Aura, którą rzucają dokładnie te postacie, u których ta
linia potem tyka („X spowija się trującą mgłą: −10% obrażeń zadawanych przez
zatrutych przeciwników”), to w pomocy:

> „…efekty osłabiające wszelkie źródła obrażeń, takich jak efekt umiejętności
> Strach ( dmg_from_player_per ) czy Toksyczny Wstrząs/Toksyczne Opary
> ( poison_lowdmg_per-enemies ).”

Artykuł opisuje ją **wyłącznie** jako redukcję obrażeń przeciwnika i **ani
słowem** nie wspomina o koszcie zdrowia po stronie rzucającego.

**Pomiar korpusu rozstrzygnął.** Siedem kolejnych tyknięć Łowcomira Kazrka
z fixture'a `2026-08-03_druzyna-vs-hildur-absorpcja`, czytanych jako „liczba to
ubytek, procent to stan PO nim”:

| ubytek | życie przed → po | wyliczona pula |
|---:|---|---:|
| 92 | 100,00 % → 99,52 % | ~19 167 |
| 87 | 99,52 % → 99,06 % | ~18 913 |
| 83 | 99,06 % → 98,62 % | ~18 864 |
| 78 | 98,62 % → 98,21 % | ~19 024 |
| 74 | 98,21 % → 97,82 % | ~18 974 |
| 69 | 97,82 % → 97,46 % | ~19 167 |
| 64 | 97,46 % → 97,12 % | ~18 824 |

Zgodna pula ~19 000 przy rozrzucie 1,8 % na siedmiu pomiarach. Przy odwrotnym
odczycie (przyrost życia) procent musiałby rosnąć — a rośnie wyłącznie po
liniach „Przywrócono”.

**Wniosek dla kodu.** Liczba to **realny ubytek HP**, a minus przed nią jest
ozdobnikiem zapisu, nie negacją. Parser czyta ją jako tyknięcie
(`RE_HP_LOST` → `kind: "dot"`), a etykieta „Ubytek życia” w `DOT_LABELS` jest
**nasza**, bo log rodzaju nie podaje — dlatego w panelu stoi jako
„Nieznany (Ubytek życia)”, tak samo jak `globalne` wyżej.

**Sprawcy nie przypisujemy — świadomie, i to jest wniosek z KIERUNKU efektu.**
Agregat zna regułę „gdy po drugiej stronie stoi dokładnie jeden przeciwnik, to
on nałożył tykający efekt” (`opponentOf` w `stats.ts`). Dla trucizny jest
słuszna. Tutaj byłaby fałszem, bo pomiar wyżej wskazuje źródło po **tej samej
stronie co cel**. Stąd `SELF_INFLICTED_DOTS` w `stats.ts` — kwota idzie do puli
„Bez sprawcy”.

⚠️ **To zdanie zastępuje wcześniejsze, które było nieprawdą.** Stało tu
„parser liczy ją jako tyknięcie bez sprawcy”; parser owszem, ale agregat
sprawcę **dopisywał**. Skutek na `2026-08-03_druzyna-vs-hildur-absorpcja`: boss
dostawał 2 026 obrażeń, których nie zadał, a Łowcomir Kazrek i Png Holak mieli
w panelu „OD KOGO: Hildur Muza Śmierci” na 100 % tego, co stracili — mimo że
boss nie tknął żadnego z nich ani razu. Znalezione audytem 2026‑08‑03, już po
commicie; naprawione tego samego dnia.

⚠️ **Czego ten wpis NIE mówi.** Ubytek dotyka wyłącznie dwóch postaci, które
rzuciły trującą mgłę, i maleje ~5/turę do zera (92→87→…→5, 20 tyknięć). To
**korelacja zmierzona na jednej walce**, nie udokumentowana przyczynowość —
pomoc o koszcie zdrowia tej aury milczy, a drugiej walki z tą aurą i tą linią
w korpusie nie ma. Nie wolno na tej podstawie napisać, że „trująca mgła kosztuje
życie”.

### Krwawa udręka ( anguish ) — obrażenia w czasie, których korpus NIE zna ✅

> „Krwawa udręka ( anguish ) • **Działanie:** podczas walki istnieje
> prawdopodobieństwo na zajście zdarzenia, podczas którego na cel ataku zostają
> zaaplikowane **obrażenia od krwawienia rozłożone w czasie na pięć tur**.
> • Zdarzenie możesz zajść wyłącznie, jeżeli podczas ciosu nie zaszedł unik,
> neutralizacja strzały ( arrowblock ) oraz parowanie ( parry ). • Parametr
> zmienny: prawdopodobienstwo zajścia zdarzenia. • Wartość początkowa: 8%
> (kolejne wartości kumulacji: 12%, 14%, 15%, 16%, 16%). • Bonus ma charakter
> ofensywny i prowadzi do skrócenia walki. • **Obrażenia od krwawienia są
> obrażeniami nieuchronnymi**, redukowanymi jedynie przez efekty takich
> umiejętności jak Strach ( dmg_from_player_per ) […]”

Sprawdzone 2026‑08‑03 sondą `bun tools/pomoc.ts "Krwawa udręka"`. Literówka
„możesz zajść” i „prawdopodobienstwo” są w źródle — cytat jest dosłowny.

**Brzmienie linii jest znane od 2026‑08‑04** — z assetu gry, nie z domysłu:

> `msg_anguish %name% %hpp% %val0%`
> → `%name%(%hpp%%): %val0% obrażeń od krwawienia.`
>
> `msg_anguish %name% %hpp% %val0% %val1%`
> → `%name%(%hpp%%): %val0% (osłabione o %val1%%) obrażeń od krwawienia.`

Sonda: `bun tools/slownik.ts --klucz "anguish"`, build `1785244275300`.

⚠️ **To unieważnia zdanie, które stało tu do 2026‑08‑04**: „nie wiemy, jak brzmi
jego linia w oknie walki i nie wolno tego zgadnąć". Wiemy — i nie trzeba było
zgadywać, bo brzmienie stoi w assecie klienta.

**Wniosek dla kodu — i to jest zwrot względem poprzedniej wersji wpisu:
parser TO JUŻ CZYTA.** `RE_DOT` jest ogólny co do rodzaju
(`obrażeń (od|po) (.+?)`), więc linia krwawienia wchodzi jako
`kind: "dot"`, `via: "od"`, `dotType: "krwawienia"` — sprawdzone przez
przepuszczenie zdania ze słownika przez `parse`. Wariant dwuczłonowy też:
`(osłabione o N%)` siedzi we wzorcu i trafia do `weakenedPct`.

Czyli **`anguish` nigdy nie był cichą luką PARSERA — był luką KORPUSU.**
W korpusie tekstowym nadal nie ma ani jednego wystąpienia rdzenia „udrę”,
a że efekt zachodzi w prawdziwych walkach, dowodzi korpus protokołu (11 razy
w dwóch walkach, `bun tools/luki.ts`). Zrzut jest więc dalej wart zebrania —
ale jako POTWIERDZENIE, nie jako warunek napisania wzorca.

Bonus stoi też w cytacie z listy bonusów legendarnych przy wpisie o ciosie
bardzo krytycznym wyżej — na dziesięć wymienionych tam bonusów korpus tekstowy
zna wszystkie poza tym jednym.

### Wściekłość ( rage ) — efekt tylko przeciw potworom, korpus NIE zna ✅

> „Wściekłość ( rage ) • Odpowiada za wyzwolenie efektu Wściekłości , wraz
> z każdym **trafionym w potwora ciosem krytycznym**, na określoną liczbę tur.
> • Zwiększa obrażenia fizyczne o 10%.
>
> Wściekłość na 3 tury ( rage_3turns ) • Odpowiada za wyzwolenie efektu
> Wściekłości , wraz z każdym trafionym w potwora ciosem krytycznym, na 3 tury.
> • Zwiększa obrażenia fizyczne o wartość określoną jako parametr statystyki.”

Sprawdzone 2026‑08‑03 sondą `bun tools/pomoc.ts "Wściekłość ( rage )"`.

**Gra wypisuje z tego powodu linię i jej brzmienie jest znane od 2026‑08‑04:**

> `msg_+rage %val%` → `+Wściekłość: atak +%val%`
> `msg_-rage` → `-Wściekłość`

Sonda: `bun tools/slownik.ts --klucz "+rage"`, build `1785244275300`.

⚠️ **To unieważnia ostrzeżenie, które stało tu do 2026‑08‑04**: „czego ten wpis
NIE mówi — że gra wypisuje z tego powodu jakąkolwiek linię". Wypisuje.

**Sprostowanie, które warto zapamiętać osobno:** brzmienie z assetu gry jest
**identyczne** z tym, które składa renderer grooove.pl. Zakaz przepisywania
tamtych brzmień był i zostaje słuszny co do METODY — cudza reimplementacja
bywa do tyłu i tego samego dnia złapaliśmy ją na `+wound` („Ciężka rana"
zamiast „Głęboka rana", `docs/specy/2026-08-04-protokol-silnika-jako-zrodlo-parsera.md`).
Ale w TYM kluczu akurat miała rację, i zapisanie samego zakazu bez tego faktu
byłoby myleniem dobrej reguły z nieomylnością.

**Wniosek dla kodu — zwrot względem poprzedniej wersji wpisu: parser TO JUŻ
CZYTA.** Obie linie wchodzą w bloku ciosu jako proc, a liczba jest
normalizowana do `+N`, więc dwa różne trafienia dają jedną etykietę
`Wściekłość: atak +N` z licznikiem 2 — sprawdzone przez `parse` + `aggregate`
na zdaniach ze słownika. **To NIE jest cicha luka parsera; to luka korpusu.**
Rdzeń „wście” nie występuje w korpusie tekstowym ani razu, a `@rage` jest
w korpusie protokołu 26 razy w sześciu walkach.

---

## Otwarte — pytania, które warto tędy przepuścić

| pytanie | dlaczego warto | stan |
|---|---|---|
| Czy „osłabione o N%” przy DoT‑cie to etap 1 z kolejności redukcji? | Nasze `damageWeakened` odtwarza pełne tyknięcie z `amount/(1−p)` na podstawie 16 obserwacji. Pomoc opisuje efekty `poison_lowdmg_per-enemies` i mówi, że wynik osłabienia widać „jako obrażenia wylosowane przez atakującego” — jeśli to ta sama rzecz, nasze odtworzenie ma potwierdzenie albo obalenie | niesprawdzone |
| Jak log zapisuje **pomocniczy** cios bardzo krytyczny? | Pomoc mówi, że to osobne zdarzenie; parser nie rozróżnia | brak próbki w korpusie |
| Czy gra pisze linię, w której JEDNA postać leczy DRUGĄ? | Blokuje drill „leczenie — od kogo” (`ROADMAP`) | **odpowiedziane 2026‑08‑04, patrz niżej** |
| Czy gra dopuszcza tę samą nazwę po obu stronach walki? | `AUDYT‑39` naprawiono na teście syntetycznym, bo korpus takiego układu nie ma | niesprawdzone |

### Leczenie kierowane — tekst nazywa LECZONEGO, protokół zna też LECZĄCEGO ✅

Pytanie z tabeli wyżej („czy gra pisze linię, w której jedna postać leczy
drugą") ma dwie różne odpowiedzi, zależnie od tego, którą drogą się patrzy.

**Tekst: linia istnieje, ale nazywa tylko leczonego.**

> `msg_heal_target %target% %val%` → `Uleczono %target% o %val% punktów życia.`

Sonda: `bun tools/slownik.ts --klucz "heal_target"`, build `1785244275300`.
Parser czyta to od dawna (`RE_HEAL_TARGET`), a korpus tekstowy ma tę linię
w **7 z 24** fixture'ów. Leczącego w tym zdaniu nie ma i nie da się go stamtąd
wyczytać — to jest dokładnie ograniczenie „Leczenie bez leczącego"
z `docs/DECYZJE.md`.

**Protokół: obie strony stoją w komunikacie.** Renderer podstawia pod
`%target%` pole `f2.name`, czyli DRUGĄ stronę komunikatu — a pierwszą jest
nadawca, czyli leczący. Klucz `heal_target` niesie więc parę
`leczący → leczony` strukturalnie, bez zgadywania po nazwach.

⚠️ **Czego to jeszcze nie znaczy.** Że drill „leczenie — od kogo" da się
zbudować: dowód pochodzi z odczytu renderera, nie ze zrzutu z gry, a panel
liczy dziś z tekstu. To jest **argument za zrzutem**, nie zamknięcie tematu —
i pierwsza pozycja, którą warto sprawdzić, gdy para tekst↔protokół powstanie.
