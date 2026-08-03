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
ozdobnikiem zapisu, nie negacją. Parser liczy ją jako tyknięcie bez sprawcy
(`RE_HP_LOST` → `kind: "dot"`), a etykieta „Ubytek życia” w `DOT_LABELS` jest
**nasza**, bo log rodzaju nie podaje — dlatego w panelu stoi jako
„Nieznany (Ubytek życia)”, tak samo jak `globalne` wyżej.

⚠️ **Czego ten wpis NIE mówi.** Ubytek dotyka wyłącznie dwóch postaci, które
rzuciły trującą mgłę, i maleje ~5/turę do zera (92→87→…→5, 20 tyknięć). To
**korelacja zmierzona na jednej walce**, nie udokumentowana przyczynowość —
pomoc o koszcie zdrowia tej aury milczy, a drugiej walki z tą aurą i tą linią
w korpusie nie ma. Nie wolno na tej podstawie napisać, że „trująca mgła kosztuje
życie”.

---

## Otwarte — pytania, które warto tędy przepuścić

| pytanie | dlaczego warto | stan |
|---|---|---|
| Czy „osłabione o N%” przy DoT‑cie to etap 1 z kolejności redukcji? | Nasze `damageWeakened` odtwarza pełne tyknięcie z `amount/(1−p)` na podstawie 16 obserwacji. Pomoc opisuje efekty `poison_lowdmg_per-enemies` i mówi, że wynik osłabienia widać „jako obrażenia wylosowane przez atakującego” — jeśli to ta sama rzecz, nasze odtworzenie ma potwierdzenie albo obalenie | niesprawdzone |
| Jak log zapisuje **pomocniczy** cios bardzo krytyczny? | Pomoc mówi, że to osobne zdarzenie; parser nie rozróżnia | brak próbki w korpusie |
| Czy gra pisze linię, w której JEDNA postać leczy DRUGĄ? | Blokuje drill „leczenie — od kogo” (`ROADMAP`) | niesprawdzone |
| Czy gra dopuszcza tę samą nazwę po obu stronach walki? | `AUDYT‑39` naprawiono na teście syntetycznym, bo korpus takiego układu nie ma | niesprawdzone |
