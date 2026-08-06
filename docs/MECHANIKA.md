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
pod `#`/`$`, zamienia `++` na `+` i dokleja `<br>`. **Szablon mówi, CZEGO
w zrzucie z gry szukać — nie zastępuje samego zrzutu.**

### 5. Dopiero teraz materiał

`bun -e '…'` z importem `aggregate` po walkach z `tests/korpus.ts`
i `tests/walka-z-gry.ts`. ⚠️ Do 2026‑08‑04 szło to po 25 prawdziwych walkach,
których już nie ma — pomiar jest dziś ZNACZNIE słabszy i trzeba to mówić przy
każdej liczbie, którą z niego wyciągasz.

Dokumentacja mówi, co gra **zamierza**; pomiar — co log **pokazuje**. Nie
zastępują się i oba są potrzebne: pomoc nie opisuje formatu logu ani jednym
zdaniem, a pomiar nie powie, dlaczego liczba jest akurat taka.

### 6. Rozjazd jest wpisem, nie ciszą

Gdy pomiar przeczy dokumentacji, **w kodzie wygrywa pomiar** — opisuje wersję
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

**Wniosek dla kodu.** Nazwa `globalne` dla rodzaju obrażeń pochodzi
z terminologii gry i z naszego zestawienia po korpusie, **nie z cytatu** — i tak
ma zostać opisana. (Wskazywało to na klasę CSS `dmgg` czytaną przez
`src/parser.ts`; parser zszedł z drzewa 2026‑08‑04, rodzaj przychodzi dziś
kluczem protokołu, ale pochodzenie NAZWY się nie zmieniło.) Adnotacja w `meta.json` fixture'a
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

**Pomiar korpusu rozstrzygnął.** Siedem kolejnych tyknięć Gracza C
z fixture'a `2026-08-03_druzyna-vs-hildur-absorpcja`, czytanych jako „liczba to
ubytek, procent to stan PO nim”.

⚠️ **Tego pliku w repo NIE MA od 2026‑08‑04** (`AUDYT‑91`) — zszedł z drzewa
razem z pozostałymi 24 walkami. Tabela niżej i liczby przy „Skutku” były
prawdziwe, gdy je mierzono, ale **nikt ich dziś nie powtórzy**. Sam kierunek
odczytu ma jednak drugie, mocniejsze potwierdzenie: warunek `m[1] >= 0`
w rendererze (cytat wyżej) mówi to samo bez żadnego pomiaru.

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
ozdobnikiem zapisu, nie negacją. Dekoder czyta ją jako tyknięcie
(`kind: "dot"`, rodzaj „od ubytku życia”), a etykieta „Ubytek życia”
w `DOT_LABELS` jest **nasza**, bo log rodzaju nie podaje — dlatego w panelu stoi
jako „Nieznany (Ubytek życia)”, tak samo jak `globalne` wyżej.

**Skąd ta linia bierze się w protokole — dopisane 2026‑08‑05.** Nie ma na nią
osobnego klucza: to **`heal` z wartością UJEMNĄ**. Renderer wybiera człon zdania
znakiem (`BattleMessages.js:301`):

> ```js
> '%gain_lost%': (m[1] >= 0 ? _t('part_gained') : _t('part_lost'))
> //(m[1]>0?'Przywrócono ':'Stracono ')+m[1]+' punktów życia '+f1.name
> ```

`%gain_lost%` stoi w zdaniu **wyłącznie** klucza `heal`; `afterheal` (`:235`),
`heal_target` (`:959`), `npc_heal`, `legbon_holytouch_heal` (`:796`)
i `legbon_lastheal` (`:587`) składają bezwarunkowe „Przywrócono”.

⚠️ **DWA ZDANIA TEGO WPISU BYŁY NIEPRAWDĄ PRZEZ DOBĘ** (`AUDYT‑88`). Stało tu
„Parser czyta ją jako tyknięcie (`RE_HP_LOST` → `kind:"dot"`)” — a parser tekstu
zszedł z drzewa 2026‑08‑04 i droga protokołu tego zachowania **nigdy nie
miała**: `heal=-92` wychodziło jako `{kind:"heal", amount:-92}`, więc ubytek nie
liczył się jako obrażenia w ogóle (`damageTaken: 0`), tylko siadał w „uleczone”
ze znakiem minus. Razem z parserem osierocone zostały trzy strażniki opisane
niżej — `SELF_INFLICTED_DOTS`, `DOT_LABELS["od ubytku życia"]` i wyjątek przy
`UNKNOWN_DETAIL` — i **wszystkie trzy były martwe**, bo broniły przed
zdarzeniem, którego nikt już nie produkował. Naprawione 2026‑08‑05.

**Wniosek ogólniejszy od tej poprawki:** kasując ścieżkę WEJŚCIA, trzeba przejść
to, co po niej zostaje na WYJŚCIU. Martwy strażnik nie zapala testu i nie łapie
go `noUnusedLocals` — jest czytany, tylko przez warunek, który nigdy nie zachodzi.

**Sprawcy nie przypisujemy — świadomie, i to jest wniosek z KIERUNKU efektu.**
Agregat zna regułę „gdy po drugiej stronie stoi dokładnie jeden przeciwnik, to
on nałożył tykający efekt” (`opponentOf` w `stats.ts`). Dla trucizny jest
słuszna. Tutaj byłaby fałszem, bo pomiar wyżej wskazuje źródło po **tej samej
stronie co cel**. Stąd `SELF_INFLICTED_DOTS` w `stats.ts` — kwota idzie do puli
„Bez sprawcy”.

⚠️ **To zdanie zastępuje wcześniejsze, które było nieprawdą.** Stało tu
„parser liczy ją jako tyknięcie bez sprawcy”; parser owszem, ale agregat
sprawcę **dopisywał**. Skutek na `2026-08-03_druzyna-vs-hildur-absorpcja`: boss
dostawał 2 026 obrażeń, których nie zadał, a Gracz C i Gracz G mieli
w panelu „OD KOGO: Hildur Muza Śmierci” na 100 % tego, co stracili — mimo że
boss nie tknął żadnego z nich ani razu. Znalezione audytem 2026‑08‑03, już po
commicie; naprawione tego samego dnia.

⚠️ **Czego ten wpis NIE mówi.** Ubytek dotyka wyłącznie dwóch postaci, które
rzuciły trującą mgłę, i maleje ~5/turę do zera (92→87→…→5, 20 tyknięć). To
**korelacja zmierzona na jednej walce**, nie udokumentowana przyczynowość —
pomoc o koszcie zdrowia tej aury milczy, a drugiej walki z tą aurą i tą linią
w korpusie nie ma. Nie wolno na tej podstawie napisać, że „trująca mgła kosztuje
życie”.

### Po czyjej stronie zachodzi efekt — rozstrzyga kubełek renderera, nie znak klucza ✅

Pytanie: komu przypisać „Parowanie”, „Absorpcja N obrażeń”, „Kontra” — bijącemu
czy bitemu. Dotyczy gry, nie nas: **wszystkie te klucze stoją w komunikacie
bijącego**, więc cudze repo czytające ten sam strumień ma dokładnie ten sam
problem.

**Metoda: trzeci szczebel** (`§4b`) — asset klienta, build deweloperski
`1781609507010`. Pomoc gry o tym nie mówi i mówić nie musi: to pytanie
o protokół i o renderer, nie o mechanikę walki.

**Dowód jest strukturalny.** `battleMsg` składa jedną linię logu z trzech
kubełków (`BattleMessages.js:162`, `var tm = ['', '', '']`) i przy ciosie
wypełnia skrajne dwa (`:1127‑1129`):

> ```js
> tm[0]  = _t('msg_dmgdone %name1% %hpp% %val%',  {'%name1%': f1.name, …});
> tm[2] += _t('msg_dmgtaken %name1% %hpp% %val%', {'%name1%': f2.name, …});
> ```

Czyli `tm[0]` to zdanie o `f1` (pierwszy segment komunikatu — bijący), a `tm[2]`
o `f2` (drugi — bity). **Klucz dopisujący się do `tm[2]` opisuje CEL.**

Najmocniejsze potwierdzenie tej reguły leży w tym samym kubełku: stoją w nim
`-blok` (`:827`) i `-evade` (`:830`) — dwie rzeczy, które ten dodatek przypisuje
celowi od początku i osobnymi rolami. Reguła nie jest więc nowa; była stosowana
do dwóch kluczy zamiast do dwudziestu sześciu.

**Zmierzone:** przejściem wszystkich 200 kluczy trafiających u nas do listy
efektów przez ciała gałęzi `battleMsg`, łącznie z gałęziami zbiorczymi.
**24 lądują w `tm[2]`:**

`+absorb` `+absorbm` `+critpoison_per` `+legbon_puncture` `+rage`
`+superspell-prevented` `+vulture` `-absorb` `-absorbm` `-arrowblock` `-contra`
`-legbon_cleanse` `-legbon_critred` `-legbon_glare` `-legbon_resgain` `-parry`
`-pierceb` `-rage` `-redacdmg` `-redacdmg_per` `-reddest_per` `-redendest_per`
`-redmanadest_per` `-resmanaendest`

⚠️ **ZNAK WIODĄCY NIE JEST REGUŁĄ.** Kusi, bo dla rodziny `dmg` gra sama czyta
stronę ze znaku — ale robi to w gałęzi `default` (`:1102‑1117`) i tylko tam.
Poza nią zgodności nie ma, i to w obie strony: `+absorb` („Odnowienie
absorpcji”, `:847`) należy do celu **mimo plusa**, a `-legbon_facade` (`:811`)
idzie do neutralnego `tm[1]` **mimo minusa**. Reguła „minus znaczy cel” byłaby
o pięć kluczy za szeroka i o siedem za wąska.

**Wniosek dla kodu.** Strona należy do KLUCZA i jest wyliczona wpis po wpisie
(`STRONA_CELU` w `src/protokol.ts`, każdy z numerem linii renderera). Do
2026‑08‑05 każdy efekt szedł na konto bijącego, więc napastnik miał w dymku
napisane, że sparował i pochłonął cios, który sam zadał (`AUDYT‑87`).

⚠️ **SPROSTOWANIE 2026‑08‑05 — TEN WPIS PYTAŁ O ZŁĄ RZECZ** (`AUDYT‑93`).
Powyższe mówi „klucz w `tm[2]` opisuje CEL” i to jest prawda, ale odpowiada na
pytanie **kogo efekt DOTYCZY**, a nie **kto go WYZWOLIŁ** — a panel pyta o to
drugie (`procs` to „efekty, które ta postać ma z ekwipunku”). Dla efektów
obronnych oba znaczenia się pokrywają: parowanie dotyczy bitego i należy do
bitego. Dla debuffów rzucanych ciosem **rozjeżdżają się**: efekt ląduje na bitym
(stąd `tm[2]`), ale wyzwala go ekwipunek bijącego.

Kosztowało to trzy błędne wpisy w tabeli, wykryte drugim źródłem:

> `+critpoison_per` — „w przypadku zajścia zdarzenia ciosu krytycznego […]
> leczenie pochodzące z ekwipunku **atakowanego** Gracza zostaje zredukowane”
>
> `vulture_perw` — „gdy cel ataku ma poziom zdrowia niższy niż 20%, **obrażenia
> zadane** zostają zwiększone o część obrażeń wykonanych”
>
> `+legbon_puncture` — „+Przeszywająca skuteczność, **wszystkie ataki** pomijają
> %val%% defensywy”

Wszystkie trzy zwiększają siłę BIJĄCEGO i wszystkie trzy gra drukuje w `tm[2]`.

**Drugie źródło: katalog efektów w pomocy gry.** Artykuł `view,372` zawiera wpisy
w postaci „pasywny/aktywny *nazwa* • Działanie: … • Zmienna: … • Wyzwolenie: …”,
opisujące efekt **z perspektywy postaci, która go ma** — czyli mówiące wprost
o wyzwoleniu. Zmierzone pokrycie: **68 z naszych 200 kluczy**. Tam, gdzie oba
źródła istnieją i mówią o obronie, są zgodne co do jednego (`-parry`, `-contra`,
`+rage`, `-rage`, `-redacdmg_per`, `-reddest_per`).

**Wniosek dla kodu.** Tabela `STRONA_CELU` stoi na dwóch źródłach i jest rozbita
według siły dowodu: grupa A — kubełek i katalog zgodne (19 kluczy); grupa B —
katalog przeciw kubełkowi, wygrywa katalog (2 klucze); grupa C — sam kubełek,
bez potwierdzenia (2 klucze, i tak są oznaczone).

⚠️ **DRUGIE ROZRÓŻNIENIE: KTO WYZWOLIŁ ≠ KTO KORZYSTA** (dopisane 2026‑08‑06,
`AUDYT‑94`). Katalog opisuje część efektów od strony BENEFICJENTA:

> `resfire_per` — „zwiększa odporność na ogień Postaci, **na którą rzucona jest
> umiejętność**”

Czyta się to jak wskazanie drugiego segmentu, ale mówi tylko, komu efekt POMAGA.
Wyzwala go umiejętność rzucającego, więc należy do pierwszego segmentu. Jest to
lustrzane odbicie pomyłki z `+critpoison_per`: tam kubełek wskazywał bitego, bo
efekt na nim **ląduje**; tu zdanie wskazuje bitego, bo mu **służy**. Ani
„ląduje”, ani „służy” nie znaczy „wyzwolił”.

**Test przy każdym kolejnym wpisie:** czy gdyby ta postać zdjęła cały swój
ekwipunek i umiejętności, efekt nadal by zaszedł? Jeśli tak — nie jest jej.

**Przegląd 2026‑08‑06: wszystkie 60 opisanych kluczy przeczytane po jednym.**
Wynik: **zero zmian w tabeli** — każdy opis potwierdził domyślnego napastnika.
To jest wynik pozytywny, nie brak wyniku: dla tych 60 „napastnik” przestało być
założeniem i stało się odczytem.

⚠️ **Co ZOSTAJE nierozstrzygnięte.** `tm[1]` jest kubełkiem NEUTRALNYM — nie
„stroną bijącego”. Po przeglądzie zostaje **117 kluczy bez żadnego drugiego
źródła**: katalog pomocy ich nie opisuje, a renderer wkłada je do kubełka, który
o stronie nie mówi. Tam „napastnik” jest nadal **założeniem**. Wiadomo przy tym,
że kubełek bywa w obrębie jednej rodziny NIEKONSEKWENTNY: `-redendest`
i `-redmanadest` (`:971`, `:975`) idą do `tm[1]`, a ich warianty `_per` do
`tm[2]` przy identycznym znaczeniu — więc wśród tych 117 niemal na pewno siedzą
kolejne efekty celu, których nie umiemy wskazać. **Zrzut z gry tego nie zamknie**
i to jest zmierzone: protokół nie koduje właściciela efektu w ogóle (komunikat
to dwa segmenty `id` i płaska lista kluczy), więc więcej materiału daje więcej
wystąpień tego samego kształtu, a nie nową informację.

⚠️ **Dwa znaleziska poboczne z tego przeglądu**, obie poza jego tematem:
- `dmg-target_physical` („na przeciwnika zostają nałożone obrażenia fizyczne
  o stałej wartości”) i `vamp` („zadaje stałe obrażenia od umiejętności oraz
  przywraca Postaci punkty zdrowia”) **NIOSĄ OBRAŻENIA**, a stoją u nas w tabeli
  efektów nieliczonych — dołączają do `fire`, `frost`, `light`, `physical`.
- Efekty z komunikatu BEZ ani jednej liczby obrażeń **przepadają w całości**:
  dekoder kończy taki komunikat wcześniej i lista `procs` nie trafia nigdzie.
  Sprawdzone: `tspell=Tarcza;resfire_per=20` daje samo zdarzenie `ability`.

⚠️ **Drugie ograniczenie: `fire`, `frost`, `light`, `physical` NIOSĄ OBRAŻENIA.**
Ich zdania brzmią „%name% otrzymał %val% obrażeń od ognia” (`:317‑330`, `:402`),
a dodatek trzyma je w tabeli efektów nieliczonych. To osobna sprawa od stron
i nie jest dziś naprawiona; zapisana tu, żeby nie wypadła z pola widzenia.

### Zadane i przyjęte NIE SĄ PAROWANE — gra prowadzi dwie osobne listy ✅

Pytanie: w komunikacie `+dmgd=926;+dmgf=138;+dmgc=799;…;-dmgd=81;-dmgc=8` które
przyjęte należy do którego zadanego. Dotyczy gry, nie nas: cudze repo czytające
ten sam strumień ma ten sam komunikat i ten sam problem.

**Pomoc gry milczy i to jest wynik, nie brak wyniku.** *nie znaleziono*
w `view,372`; szukane: „obrażenia wykonane”, „obrażenia przyjęte”, „otrzymał”
(jedno trafienie, o poziomie operacyjnym); metoda: `bun tools/pomoc.ts`; data:
2026‑08‑06. Zgodne z tym, co ten plik mówi od założenia: pomoc opisuje
mechanikę, nie format logu.

**Metoda: trzeci szczebel** (`§4b`) — asset klienta, build deweloperski
`1781609507010`. Sześć tygodni starszy od produkcji, ale pytanie jest
o STRUKTURĘ, nie o brzmienie, więc mieści się w tym, na co ten szczebel wolno
powołać.

**Odpowiedź: gra nie paruje ich wcale.** `battleMsg` zakłada dwa NIEZALEŻNE
ciągi (`BattleMessages.js:165‑167`) i w gałęzi `default` dokleja do nich osobno,
biorąc żywioł z SAMEGO KLUCZA (`:1102‑1116`):

> ```js
> var tm = ['', '', ''], type = '', attack = '', take = '', takenum = 0;
> …
> if (m[0].substr(1, 3) == 'dmg') {
>     if (m[0].charAt(0) == '+') { attack += '<b class=' + m[0].substr(1) + '>+' + m[1] + '</b>'; }
>     else { take += '<b class=' + m[0].substr(1) + ' prof-' + f1.prof + '>-' + m[1] + '</b>'; takenum -= m[1]; }
> }
> ```

Klasa CSS to `m[0].substr(1)`, czyli `dmgf`, `dmgc`, `dmgd` — **żywioł podaje
klucz i nigdzie nie ma indeksu, po którym cokolwiek dałoby się sparować**. Poza
gałęzią `default` jest tak samo: `+of_dmg` (`:619`), `+thirdatt` (`:624`)
i `-thirdatt` (`:863`) też tylko doklejają. Skalar `takenum` (`:167`, `:864`,
`:1114`) sumuje wyłącznie stronę przyjętą.

**Wniosek dla kodu.** Parowanie PO POZYCJI było naszym wymysłem, nie odczytem.
Do 2026‑08‑06 `dekoduj` sklejało `zadane[i]` z `przyjete[i]`, więc przy
`+dmgd,+dmgf,+dmgc` i tylko `-dmgd,-dmgc` przyjęte dla `dmgc` lądowało pod
`dmgf`, a `dmgc` dostawało zero. **Skalary zostawały prawdziwe** (`aggregate`
sumuje `raw` i `applied` osobno), kłamało rozbicie po żywiołach. Parowanie idzie
dziś po kluczu, a `+dmgX` bez pary znaczy „pod tym żywiołem nie weszło nic”.

**Zmierzone na materiale** (`2026-08-06-tempest-grupa-vs-hildur`, 188 linii
ciosu): **172 listy równe co do kolejności, 16 właściwych podzbiorów, 0 innych
kształtów** — `-dmgX` nigdy nie wychodzi poza `+dmgX`. Na starszym fixturze
(9 linii) wszystkie listy są równe, więc poprawka jest tam bezskutkowa i to
zgadza się z tym, że tamten materiał nigdy tej gałęzi nie zapalił.

⚠️ **Kierunek odwrotny ZOSTAJE nierozstrzygnięty.** Przyjęte bez zadanego
(`-thirdatt`, kod `3`, oraz `-dmga` z komentarza przy `rozbierz`) nadal idzie
do `unknown` — materiału z takim kształtem repo nie ma, a renderer o tym nic nie
mówi, bo jemu to obojętne: dokleja do `take` i tyle.

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
W korpusie tekstowym nie było ani jednego wystąpienia rdzenia „udrę”, a że efekt
zachodzi w prawdziwych walkach, dowodził korpus protokołu (11 razy w dwóch
walkach). Zrzut jest dalej wart zebrania — ale jako POTWIERDZENIE, nie jako
warunek napisania wzorca.

⚠️ Pomiar po stronie tekstowej robiło `bun tools/luki.ts`; narzędzie i korpus
tekstowy zeszły z drzewa 2026‑08‑04, więc tej liczby nie da się dziś odtworzyć.
Liczba z korpusu protokołu (11) zostaje sprawdzalna.

Bonus stoi też w cytacie z listy bonusów legendarnych przy wpisie o ciosie
bardzo krytycznym wyżej — na dziesięć wymienionych tam bonusów korpus tekstowy
zna wszystkie poza tym jednym.

### Które klucze protokołu niosą PUNKTY życia — jedenaście spoza tabeli ról ✅

Pytanie o grę, nie o nas: **czy zdanie, które gra składa z tego klucza, podaje
liczbę punktów obrażeń albo punktów życia?** Test z `AGENTS.md` przechodzi —
w cudzym repo czytającym ten sam log odpowiedź byłaby ta sama.

**Metoda (2026‑08‑06, `AUDYT‑95…99`).** Nie czytanie po jednym, tylko jedno
przejście **wszystkich 197 kluczy tabeli `PROCE`** przeciw słownikowi gry
(build `1785244275300`), z pytaniem o rdzenie „obrażeń” i „punktów życia”.
Trafień z LICZBĄ BEZWZGLĘDNĄ: **jedenaście** (reszta z 27 dopasowań to procenty
i modyfikatory, nie kwoty).

| klucz | zdanie gry (dosłownie ze słownika) | strona | status |
|---|---|---|---|
| `critwound` | „%name%: %val% obrażeń od ciężkiej rany." | `f1` | ✅ tyknięcie |
| `fire` | „%name% otrzymał# %val% obrażeń od ognia." | `f1` | ✅ tyknięcie |
| `frost` | „%name% otrzymał# %val% obrażeń od zimna." | `f1` | ✅ tyknięcie |
| `light` | „%name% otrzymał# %val% obrażeń od błyskawic." | `f1` | ✅ tyknięcie |
| `physical` | „%name% otrzymał# %val% obrażeń fizycznych." | `f1` | ✅ tyknięcie |
| `bandage` | „Uleczono %name% o %val% punktów życia." | `f1` | ✅ leczenie |
| `vamp_time` | „+Uleczono za %val% punktów życia" | — | ✅ leczenie |
| `dmg-target_physical` | „%target% otrzymuje %val% obrażeń" | `f2` | ✅ obrażenia celu |
| `vamp` | „%name% zadał %val% obrażeń %target% lecząc za nie siebie." | `f1`→`f2` | ⬜ otwarte |
| `+oth_cover` | „%name% przejął(eła) %val% obrażeń." | trzecia postać | ⬜ otwarte |
| `+oth_dmg` | „−%val% obrażeń otrzymał(a) %name%." | trzecia postać | ⬜ otwarte |

⚠️ **Kolumna „strona" przy dwóch ostatnich NIE JEST STRONĄ KOMUNIKATU — odbiorcę
podaje SAMA WARTOŚĆ** (`AUDYT‑106`). Przy pozostałych dziewięciu stronę daje
podstawienie (`'%name%': f1.name` kontra `'%target%': f2.name`); tutaj klient
podstawia trzeci człon wartości, więc pytanie „która strona" w ogóle nie ma tu
zastosowania. Cytat, `BattleMessages.js:596‑607`:

```js
case '+oth_dmg':
    var mm = m[1].split(',');
    tm[1] += '<b class=dmg' + mm[1] + '>' + _t('msg_+oth_dmg %val% %name%', {
            '%val%': mm[0],
            '%name%': mm[2]
        }) + '<br>'; //+'   -'+mm[0]+'</b> obrażeń otrzymał(a) '+mm[2]+'<br>'

case '+oth_cover':
    var mm = m[1].split(',');
    tm[1] += _t('msg_+oth_cover %val% %name%', {'%val%': mm[0], '%name%': mm[2]})
        + '<br>'; //mm[1]+' przejął(eła) '+mm[0]+' obrażeń<br>'
```

**Trzy człony:** `mm[0]` kwota, **`mm[1]` KOD ŻYWIOŁU** (wchodzi w
`class=dmg{mm[1]}` — ta sama konwencja, co gałąź `default`; zmierzone: wszystkie
cztery występujące kody `a`, `g`, `f`, `c` są w tabeli `ELEMENTS`), `mm[2]`
nazwa odbiorcy. ⚠️ Do 2026‑08‑07 `ROADMAP.md` nazywał `mm[1]` „klasą", co
czytało się jak klasa POSTACI.

⚠️ **Że adresatem bywa boss, przestało być zagadką.** Zmierzone: 40 razy z 71
jest to postać spoza obu stron komunikatu, 31 razy — druga strona; do 20 wpisów
`+oth_dmg` w JEDNYM komunikacie. To jest **lista celów umiejętności
obszarowej**, a nie osłona jednej postaci — i dlatego boss się na niej
znajduje. `+oth_cover` to co innego mimo wspólnego przedrostka: „przejął(eła)
N obrażeń".

Kolumna „strona” pochodzi z PODSTAWIENIA w rendererze, nie ze zdania:
`'%name%': f1.name` kontra `'%target%': f2.name`.

**Pytanie, które o mało nie zostało zadane, a było jedyne trudne:** czy te
liczby są OSOBNE, czy są rozbiciem ciosu — bo w drugim wypadku doliczenie ich
podwaja coś, co już siedzi w `-dmgd`. Rozstrzyga to katalog efektów:

> „aktywny critwound • **Działanie:** w przypadku zajścia zdarzenia ciosu
> krytycznego lub ciosu krytycznego pomocniczego, których wartość obrażeń
> zadanych w Gracza jest większa od zera, istnieje szansa na zajście zdarzenia
> (Ciężka rana), podczas którego aplikowane są na cel obrażenia od głębokiej rany
> **(jako osobna instancja wyniszczeń)** o wartości 10% obrażeń zadanych na 3
> tury. • Zmienna: szansa na zajście zdarzenia ciężkiej rany po zajściu
> zdarzenia ciosu krytycznego. • Aplikacja: warstwa zdarzeń. • Wyzwolenie:
> warstwa inicjacji u przeciwnika.”

> „aktywny dmg-target_physical • **Działanie:** na przeciwnika zostają nałożone
> obrażenia fizyczne o stałej wartości. • Zmienna: liczba punktów obrażeń
> zadanych w przeciwnika. • Wyzwolenie: warstwa inicjacji. • **Obrażenia nie są
> redukowane przez pancerz.**”

> „aktywny vamp • **Działanie: zadaje stałe obrażenia od umiejętności** oraz
> przywraca Postaci punkty zdrowia o tę samą wartość. • Zmienna: liczba punktów
> obrażeń oraz leczenia. • Wyzwolenie: warstwa inicjacji.”

Sonda: `bun tools/pomoc.ts` na artykule `view,372` (mechanika walk), zrzut
w `.cache/pomoc-372.txt`. Cytaty dosłowne.

Dla czterech żywiołów katalog haseł NIE MA — to nie są efekty ekwipunku, tylko
zdania o typie obrażeń — więc stoją na dwóch źródłach zamiast trzech. Ryzyko
podwojenia odpada u nich **z kodu**: żywioł ciosu niesie sam klucz obrażeń
(gałąź `default` renderera robi `substr(1)` i wkleja wynik jako klasę `dmgX`),
więc `fire=88` nie ma jak być rozbiciem `-dmgd`.

⚠️ **ROZJAZD MIĘDZY ŹRÓDŁAMI, rozstrzygnięty na korzyść zdania (punkt 6
procedury).** Katalog nazywa obrażenia z `critwound` „**od głębokiej** rany”;
zdanie, które gracz widzi w logu walki, mówi „**od ciężkiej** rany”. Klient jest
tu bliżej gracza niż dokumentacja, a wiersz panelu ma się zgadzać z logiem, więc
w kodzie stoi „ciężkiej”. W przekroju „TYP OBRAŻEŃ” obie schodzą się w jedną
rodzinę („rana”), więc rozjazd nie rozbija sumy — gdyby rozbijał, decyzja
mogłaby wyjść odwrotnie.

⚠️ **Czego ten wpis NIE mówi: jak często te klucze padają.** To jest pytanie do
próbki, nie do klienta gry — a przez dobę żadna prawdziwa walka w repo nie
niosła ani jednego z jedenastu. ✅ **Od 2026‑08‑06 jeden jest**: `+oth_dmg`
pada w `2026-08-06-tempest-grupa-vs-hildur` kilkanaście razy, zawsze w postaci
`+oth_dmg=143,a,<nazwa>(4.78%)` — czyli z TRZECIĄ postacią i jej procentem życia
w wartości. Pozostałych dziesięciu nadal nie ma i pytanie o częstość zostaje
otwarte. Rozdział tych dwóch pytań (FORMAT → kod gry, CZĘSTOŚĆ →
materiał) jest w tej procedurze od początku i został tu złamany raz, we własną
stronę: `ROADMAP.md` trzymał `bandage` i `vamp_time` jako „czekające na zrzut”,
choć zrzut nigdy nie był potrzebny do odpowiedzi, na którą czekały.

⚠️ **Doprecyzowanie „kilkanaście razy" — jest ich 71** (`AUDYT‑106`, zmierzone
2026‑08‑06). Liczba nie jest tu ozdobą, bo dopiero ona pokazuje, ile ta pozycja
kosztuje: świadek `hp.max` przeciw procentowi z wartości daje **0 trafień na 18
bez doliczenia `+oth_dmg`** — osłaniane postacie wychodzą u nas na 100 % życia,
gdy log mówi 52–70 %. Doliczenie podnosi to do 5, więc kierunek jest pewny,
a wielkość nie: 13 rozjazdów zostaje i nasze sumy są wtedy za NISKIE.

⚠️ **A `+oth_dmg` i `+oth_cover` NIE MAJĄ HASŁA W KATALOGU** — `grep` po
`.cache/pomoc-372.txt` daje przy obu zero.

⚠️ **Ale „katalog nie zna" NIE ZNACZY „nie wiadomo", i to jest sprostowanie
do zdania, które stało tu przez dobę** (`AUDYT‑106`, 2026‑08‑07). Napisałem
wtedy, że nazwa „osłona kompana" jest zmyślona; klient opisuje tę mechanikę we
własnym komentarzu („przejął(eła) N obrażeń" przy `+oth_cover`) i leżał
rozpakowany w `.cache/` przez cały ten czas. Nazwa była trafna dla `+oth_cover`
i nietrafna dla `+oth_dmg` — błędem było **sklejenie dwóch kluczy pod jedną**,
a nie samo słowo.

**Wniosek dla tej procedury, i dlatego stoi tu, a nie tylko w `AUDYT.md`:**
punkt 1 mówi „sprawdź rejestr", punkt 2 „sonda po pomoc". Ta runda pokazała, że
**milczenie pomocy nie zamyka pytania, dopóki nie zapytano klienta** — a to dwa
różne źródła i odpowiadają na różne rzeczy. Pomoc mówi, CO efekt robi
w mechanice; klient mówi, JAK wygląda w protokole. Zdanie „dokumentacja tego nie
rozstrzyga" wolno napisać dopiero po obu.

⚠️ **Jak daleko zaszła, zanim ktoś ją sprawdził — policzone gitem, nie
z pamięci.** Do 2026‑08‑06 stała w **jednym** miejscu (`ROADMAP.md:262`).
Runda z tego samego dnia rozniosła ją do **pięciu kolejnych plików**
(`CHANGELOG.md`, `src/types.ts`, `src/stats.ts`, `src/protokol.ts` i spec) —
i była to runda, która ten obszar AUDYTOWAŁA. Cytowanie własnego rejestru czyta
się jak sprawdzanie źródła, a nim nie jest; jedno zdanie bez pokrycia rozmnaża
się przez cytowanie szybciej, niż powstaje.
To jest ten sam błąd, co przy `AUDYT‑93` i `AUDYT‑94`, w trzecim wariancie —
tam mylono „kogo dotyczy" z „kto wyzwolił", tu **nazwę własną klucza wzięto za
jego opis**. Za każdym razem brakował ten sam krok: sprawdzić, czy źródło
w ogóle o tym mówi. Tu wystarczał jeden `grep` po pliku leżącym w `.cache/`
od dwóch dni.

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

**Wykorzystane 2026‑08‑05.** `BattleEvent.heal` niesie odtąd
`healer`/`healerId`/`healerHpPct` przy `heal_target` i `npc_heal`, a agregat
kredytuje tę kwotę leczącemu zamiast puli „bez sprawcy".

⚠️ **Czego to nadal nie znaczy — dwie rzeczy, i obie zostają otwarte.**

1. **Że dowód jest ze zrzutu.** Nie jest: pochodzi z odczytu renderera, więc
   mówi o FORMACIE. Klucza `heal_target` nie ma w jedynej prawdziwej walce,
   jaką repo ma (`tests/walka-z-gry.ts` — sam `heal=99`). Zrzut z walki
   z uzdrowicielem leczącym KOGOŚ INNEGO jest wciąż najbardziej opłacalną
   rzeczą do złapania sondą.
2. **Że drążenie „leczenie — od kogo" da się zbudować.** To osobna decyzja
   i nadal jest na „nie" — nie z braku danych, tylko dlatego, że szczebel
   wypełniony dla jednego z trzech szyków leczenia kłamie bardziej niż jego
   brak (`docs/DECYZJE.md` §„Leczenie bez leczącego").

⚠️ Stało tu wcześniej „panel liczy dziś z tekstu" jako powód, dla którego temat
jest zamknięty. Powód wygasł w `eb9e76c` — **tego samego dnia, w którym akapit
powstał** (2026‑08‑04), i przeleżał tak dobę, nie zapalając niczego. Warunek
wpisany do rejestru nie ma żadnego strażnika poza kimś, kto go przeczyta.

### Sprawca DoT-a — nie zna go też KLIENT gry ✅ (odpowiedź negatywna)

Pytanie wracało tu trzeci raz („kto bije trucizną"), więc odpowiedź idzie do
rejestru razem z metodą — inaczej wróci czwarty.

**Sprawdzone 2026‑08‑04 w ŹRÓDŁACH KLIENTA**, nie w pomocy i nie w korpusie:
`bun tools/zrodla.ts --pokaz …`, drzewo builda deweloperskiego
`1781609507010`, **547 plików**.

**1. Gra sama definiuje tyknięcie jako komunikat bez drugiej strony.**

> ```js
> var isDot = id1 != 0 && id2 == 0 && dotHp; //current message is 'damage over time' effect description
> ```
> — `core/battle/BattleMessages.js:169`

**2. Gdy strony nie ma, klient wstawia atrapę z napisem „BŁĄD".**

> ```js
> if (id1) {
>     f1 = Engine.battle.warriorsList[id1];
> } else {
>     f1 = {name: 'BŁĄD#1!'};
> }
> ```
> — `core/battle/BattleMessages.js:145‑150`, powtórzone
> w `battleEffects/BattleEffectsController.js:181‑182`

To jest sedno: klient **nie ma czego podstawić**. Nie chodzi o to, że my nie
umiemy odczytać — chodzi o to, że w komunikacie tego nie ma.

**3. Efekty na postaci to 9‑bitowa bitmaska ze statyczną nazwą.**

> ```js
> for (var p = 0; p < 9; p++) {
>     if (buffs >> p & 1) {
>         var $bf = tpl.get('buff').addClass('_' + p);
>         $bf.tip(buffNames[p],'t_static');
> ```
> — `core/battle/Battle.js:2613‑2618`

Bit i nazwa. Ani sprawcy, ani czasu trwania, ani wartości. Potwierdza to
`docs/DECYZJE.md` §„Engine.battle" (`buffs: 0 // licznik, nie lista efektów`),
tyle że z kodu, a nie z sondy.

**4. Najmocniejszy dowód: gra ma w kodzie WŁASNE przykładowe ładunki serwera.**

> ```js
> "m":["-198229=100;0;surpass_bonus_total=40", Engine.hero.getId()+"=25;0;poison_lowdmg_per-enemies=8", Engine.hero.getId()+"=1;0;hp_per-allies=10"]
> ```
> — `core/Communication.js:590`

Wszystkie efektowe komunikaty jednostronne, `id2 = 0`. **To jest format
protokołu udokumentowany przez samą grę**, a nie wniosek z naszej próbki. Ten
sam przykład wylicza pełny kształt wojownika (`buffs`, `cooldowns`,
`doublecastcost`, `combo`, `ac`, odporności) — pola na sprawcę efektu nie ma
także tam.

**5. Przeszukanie całego drzewa.** Truciznę wspomina **8 z 547 plików**:
`BattleMessages.js`, `Battle.js`, `Communication.js`, `TemplatesData.js`,
`characters/Hero.js` (statystyka bohatera), `items/ItemStatsData.js`,
`items/Item.js`, `skills/SkillsParser.js` (klucze definicji umiejętności).
Żaden nie wiąże efektu ze sprawcą. `battleEffects/character`
i `battleEffects/screen` to animacje (`TintWarriorAction`, `ShakeWarriorAction`,
`IconAnimation`, `BattleEarthQuakeAction`).

**Wniosek dla kodu: żaden, i to jest cała treść tego wpisu.** Zakaz zgadywania
sprawcy z `docs/DECYZJE.md` zostaje w mocy. Zmieniło się tylko to, że stoi za
nim teraz dowód z kodu gry, a nie samo „log tego nie mówi".

⚠️ **Co BY działało i dlaczego to nadal nie fakt.** Gdy DoT‑a nakłada NAZWANA
umiejętność, komunikat zapowiedzi ma obie strony, więc korelacja „zapowiedź od
A na B → późniejsze tyknięcia na B pochodzą od A" jest po `id` mocniejsza niż
dzisiejsza rezerwa po nazwie. Rozpada się w dwóch układach: trucizna
z przedmiotu albo z pasywki **nie ma zapowiedzi w ogóle** (tak jest w jedynym
fixturze protokołowym — łowca truje trzy odyńce bez ani jednego komunikatu
nakładającego), a przy dwóch źródłach tego samego DoT‑a na jednym celu nie ma
czego rozstrzygać.

⚠️ **Kontekst międzykomunikatowy w grze ISTNIEJE — ale idzie tylko do przodu.**
To była ostatnia ścieżka, którą przypisanie mogło się ukrywać, więc zamykam ją
cytatem, a nie brakiem znaleziska. `battleEffects/BattleEffectsController.js`
dostaje przy każdym kluczu WSZYSTKIE komunikaty i indeks bieżącego, i robi
z nimi jedno:

> ```js
> this.getArrayToCheckBlock = (allM, indexM) => {
>     let str     = allM[indexM];
>     let result  = str.match(/skillId=([0-9]*)/g);
>     if (result) {
>         …
>         let nextIndex = parseIndexM + 1;
>         if (allM[nextIndex]) str = allM[indexM] + ',' + allM[nextIndex];
> ```
> — `battleEffects/BattleEffectsController.js:237‑248`

Komunikat ze `skillId` sklejany z NASTĘPNYM, i tyle. **Nic nie patrzy wstecz.**
Pomiar potwierdza zakres reguły: w korpusie protokołu 12 walk jest **444
komunikatów ze `skillId`, z czego 333 (75%) mają obrażenia w następnym**;
pozostałe to umiejętności, które obrażeń nie zadają.

Ta sama reguła stoi po naszej stronie w `src/protokol.ts` (stan `zapowiedziana`)
— napisana tam wcześniej z obserwacji korpusu, a teraz z cytatem.

⚠️ **Dowód z konkretnej walki: nie ma czego korelować.** Fixture
`2026-08-04_tempest_lowca-vs-odyncze`, 18 komunikatów przysłanych przez serwer,
**ani jednego nakładającego truciznę**:

    "482845=100.00;-255967=37.61;+dmgd=483;+acdmg=5;-dmgd=233",
    "-255967=19.27;0;poison=140,14",

Trucizna zaczyna tykać znikąd — bez proca, bez `skillId`, bez zapowiedzi.
Nawet mając całą tablicę `t.m` naraz, nie ma z czym powiązać tyknięcia.

⚠️ **Jedyne miejsce, którego nie wykluczyłem: pole `mi`.** Ładunek `t` niesie
`mi` — w naszym zrzucie `[0..17]` przy 18 komunikatach, w przykładzie
z `Communication.js` `[0,1,2]` przy trzech. **Żaden z 547 plików nie czyta
`data.mi`** (`grep -rn "data\.mi\b"` → 0 trafień). W obu znanych próbkach to
identyczność, więc nic z niej nie wynika — ale to jedyne pole `t`, którego nie
rozumiemy. Do rozstrzygnięcia potrzebny zrzut, w którym `mi` identycznością NIE
jest, i nie wiadomo, czy taki istnieje.

### Zasięg zapowiedzi umiejętności — JEDEN komunikat ✅ (pomoc milczy, źródło rozstrzyga)

Pytanie: przez ile komunikatów obowiązuje zapowiedź (`tspell`, `prepare`),
zanim obrażenia przestaną do niej należeć. Odpowiedź decyduje o tym, pod jaką
nazwą stoją obrażenia w rozbiciu „CZYM", więc pomyłka daje złą liczbę bez ani
jednego ostrzeżenia — i dawała ją do 2026‑08‑05.

**Pomoc gry NIE ROZSTRZYGA.** Sonda `bun tools/pomoc.ts "przygotowuje się do
rzucenia"` — **0 wystąpień** w artykule `view,372` (zrzut z 2026‑08‑01). Wpis
negatywny wiąże tylko z tą frazą i tą datą; artykuł opisuje mechanikę zdarzeń,
a nie sposób, w jaki serwer paczkuje komunikaty.

**Rozstrzyga ŹRÓDŁO KLIENTA**, build deweloperski `1781609507010`:

> ```js
> let str    = allM[indexM];
> let result = str.match(/skillId=([0-9]*)/g);
> if (result) {
>     let nextIndex = parseIndexM + 1;
>     if (allM[nextIndex]) str = allM[indexM] + ',' + allM[nextIndex];
> ```
> — `battleEffects/BattleEffectsController.js:237‑255`

Komunikat ze `skillId` gra skleja z **NASTĘPNYM** i traktuje oba jako jedną
akcję. `nextIndex = parseIndexM + 1` — bez pętli, bez szukania najbliższego
ciosu. Zasięg to jeden komunikat i tyle.

**Co to unieważniło po naszej stronie.** Dekoder trzymał zapowiedź uzbrojoną aż
do najbliższego CIOSU, więc leczenie, krok albo komunikat bez liczb jej nie
gasiły — i przyklejała się do cudzej akcji kilka komunikatów dalej. Odtworzone
i naprawione 2026‑08‑05 (`tests/protokol.test.ts`, trzy kształty).

⚠️ **Czego ten wpis NIE mówi.** Że `prepare` („przygotowuje się do rzucenia")
ma ten sam zasięg co `tspell`. Cytat mówi o kluczu `skillId`, a nie o tym,
który klucz zapowiedzi mu towarzyszy; w naszym jedynym zrzucie z gry nie ma ani
jednej zapowiedzi, więc pomiaru też nie ma. Traktujemy `prepare` tak jak
`tspell`, bo to jedyna udokumentowana reguła — ale jeśli kiedyś zrzut pokaże
obrażenia dwa komunikaty po `prepare`, to jest miejsce, w którym trzeba zajrzeć.

### System tur — tura to AKCJA, numerowana i przyznawana jednej postaci ✅

Pytanie: czym jest tura, którą liczy panel. Odpowiedź jest mianownikiem trybu
„na turę”, więc pomyłka w niej przekłamuje KAŻDĄ liczbę z sufiksem `/t` — i
przekłamywała je do 2026‑08‑05.

**Pomoc gry ma na to cały rozdział „2. System tur”**, którego ten rejestr nie
miał do dziś ani w wersji pozytywnej, ani negatywnej. Sonda
`bun tools/pomoc.ts "System tur"` (zrzut z 2026‑08‑01):

> „Tura w systemie tur to numerowana (od 1 wzwyż) akcja, którą Postać może
> wykonać w sposób automatyczny (w przypadku NPC lub Graczy wybierających opcję
> automatycznej walki) lub manualny (wtedy Gracz ma przyznawany czas na ruch).
> **Tura jest akcją przyznawaną i tylko jedna Postać w danym momencie może
> uzyskać możliwość wykonania tury.**”
>
> „**Na liczbę tur nie wpływają dodatkowe tury wynikające z efektu
> `add_attacks`**, występującego na przykład w umiejętności Podwójny strzał.”
>
> „**Pierwszeństwo w wykonaniu tury ma Gracz, którego przewidywany licznik czasu
> trwania ataków po zakończeniu następnej jego tury będzie najniższy.** […] Tura
> zostanie przyznana Graczowi, którego predykcyjna wartość licznika będzie
> najniższa.”
>
> „Maksymalny liczba tur w walce jest sumą liczby tur wszystkich Graczy
> uczestniczących w walce i wynosi: `max_moves = 75 * players_amount`”

Co jest akcją — rozdział „1.4. Akcje Gracza w walce”:

> „Gracz ma do dyspozycji wykonanie następujących akcji: • **Akcja domyślna -
> podstawowy atak oraz krok do przodu** • **Rzucenie umiejętności** […]”

**Wniosek dla kodu.** Turą jest jedna akcja: zwykły atak, zapowiedź
umiejętności, krok do przodu. Nie jest nią tyknięcie DoT‑a ani leczenie bez
zapowiedzi. Kilka ciosów JEDNEJ zapowiedzianej umiejętności to jedna tura;
kilka akcji tej samej postaci pod rząd to tyle tur, ile akcji — bo kolejność
wynika ze skumulowanego czasu ataku, więc szybka postać dostaje turę kilka razy
z rzędu i jest to sytuacja normalna, nie wyjątek.

⚠️ **Ten wpis unieważnia regułę, na której kod stał od początku.** `stats.ts`
definiował turę jako NIEPRZERWANY CIĄG akcji tej samej postaci (`if (actor ===
lastActor) return`), a `types.ts` zapisywał to jako „log nie numeruje tur, więc
turą jest nieprzerwany ciąg jej akcji”. Pomiar na jedynej prawdziwej walce
(`tests/walka-z-gry.ts`): „Gracz 1” wykonuje 8 ataków bez ani jednej
zapowiedzi, a panel liczył mu **4 tury** — obrażenia na turę własną wychodziły
696 zamiast 348, czyli **dokładnie dwa razy za dużo**. Naprawione 2026‑08‑05,
spec: `docs/specy/2026-08-05-tura-to-akcja.md`.

⚠️ **CZEGO NADAL NIE UMIEMY, w obie strony.**

- **W dół.** Tura utracona (ogłuszenie, sen) nie zostawia w protokole ŻADNEGO
  śladu — klucze `+stun`, `+stun2*`, `+freeze`, `+immobilize` stoją na
  komunikacie SPRAWCY i nie mówią, czyja tura przepadła. Licznik jej nie widzi.
  To ten fakt zdjął z drzewa pole `turnsLost`, które pokazywało zero jako pomiar.
- **W górę.** Dodatkowe ataki z `add_attacks` policzą się jako osobne tury,
  wbrew cytatowi wyżej. Protokół ich nie znakuje: `skillId` przypina się do
  jednego następnego komunikatu (wpis „Zasięg zapowiedzi” wyżej), więc dodatkowy
  atak przychodzi osobnym komunikatem z pustą zapowiedzią i jest nieodróżnialny
  od zwykłego ataku. **Materiału z `add_attacks` repo nie ma** — potrzebny zrzut
  walki z „Podwójnym strzałem”.

**Otwarte, do następnego zrzutu.** Czy `step` potrafi przyjść w JEDNYM
komunikacie razem z liczbami obrażeń. Dziś dekoder wypuściłby z takiego
komunikatu i `move`, i `attack`, czyli dwie tury zamiast jednej. W jedynym
zrzucie kroki przychodzą osobno i bez ani jednej liczby
(`-255967=100.00;0;step`), więc pomiaru na to nie ma.

**Czego ten wpis NIE dotyka.** `data.current` z ładunku `t` — ID postaci, której
gra przyznaje turę (`Battle.js:444,450` → `newTurn(data.current)`). To
autorytatywny sygnał i jest w ładunku, który już przechwytujemy, ale w naszym
jedynym zrzucie CAŁA walka przyszła jednym wywołaniem `update`, więc nie
rozstrzygnąłby ani jednej z 18 linii. Trop stoi w `docs/ROADMAP.md`.

### Granica walk — `data.init` zaczyna walkę, ale `Engine.battle` się NIE zmienia ✅

Pytanie: **po czym poznać, że w sesji zaczęła się NOWA walka.** Dotyczy gry,
nie nas: cudze repo czytające ten sam strumień `Engine.battle.update` ma
dokładnie ten sam problem.

**Metoda: trzeci szczebel** (`§4b`) — asset klienta, build deweloperski
`1781609507010`, plus pomiar na materiale. Pomoc gry o kształcie ładunku nie
mówi nic i mówić nie może; to nie jest pytanie o mechanikę walki, tylko
o protokół.

**Cytat 1 — `data.init` jest znacznikiem startu i klient działa na nim wprost**
(`.cache/margonem-zrodla-1781609507010/src/js/Margonem/core/battle/Battle.js:344`):

```js
this.update = (data) => {
    let notCloseNow = !isset(data.close);
    if (isset(data.init)) {
        isAutoFightForAllAvailable = null;
        self.setDateTime();
        this.closeOtherWindows();
    }
```

**Cytat 2 — na `init` klient przelicza skład od zera** (`Battle.js:954`):

```js
for (var j in test) {
    if (data.init) self.w_amount++;
```

**Cytat 3 — linia otwierająca wychodzi przy PUSTYCH drużynach, nie przy `init`**
(`Battle.js:911`, `:945`):

```js
this.updateWarriors = function (data) {
    if (!teamIDs['1'].length) {
        …
        BattleMessages.battleMsg('0;0;txt=' + _t('battle_starts_between %grp1% %grp2%', …));
```

**Pomiar, który to potwierdza i który był powodem pytania.** Zrzut z 2026‑08‑05
(`walka-tempest-2026-08-05T11-49-44-019Z.json`, świat `tempest`, build
`1785244275300`) niesie PIĘĆ wywołań i DWIE walki:

| wpis | ładunek | skład po wywołaniu |
|---|---|---|
| 0 | `endBattle`, `move` | Kazrek, Warchlak, Locha, Locha |
| 1 | `close`, `endBattle`, `move` | — (pusty) |
| 2 | **`init`**, `myteam`, `current`, `turns_warriors`, … | Kazrek, Odyniec, Odyniec |
| 3 | `w` | Kazrek, Odyniec, Odyniec |
| 4 | `endBattle`, `m` (11 komunikatów) | Kazrek, Odyniec, Odyniec |

Obsada zmienia się w całości poza graczem, a mimo to **wszystkie pięć wpisów ma
`walka: 1`**. Nasze numerowanie chodzi po TOŻSAMOŚCI obiektu `Engine.battle`
(`src/protokol-source.ts:241`), a ten obiekt gra tworzy raz i używa go dalej;
zmienia się jego stan wewnętrzny, nie referencja.

**Wniosek dla kodu.** Granicą walki jest `data.init` w ładunku, a nie zmiana
obiektu. Tożsamość obiektu jest warunkiem WYSTARCZAJĄCYM (nowy obiekt to na
pewno nowa walka), ale nie KONIECZNYM — i to jest cała różnica.

**Czego ten wpis NIE rozstrzyga.** Czy `init` przychodzi ZAWSZE, także po
przeładowaniu strony w trakcie walki (`Battle.js:827‑828` i `:833` wspominają
„reload”), oraz czy `close` bez `init` potrafi zamknąć walkę tak, że następna
nie dostanie `init`. Materiału na to nie ma — potrzebny zrzut z przeładowaniem.

⚠️ **Stało tu `Battle.js:824` i był to zły numer linii** (`AUDYT‑74`). Linia 824
to `const initLoot = isset(allData.loot) && …`; słowo „reload” pada w `455`,
`827`, `828` i `833`. Cztery pozostałe cytaty tego wpisu (`:344`, `:911`,
`:945`, `:954`) sprawdzono co do linii i trafiają.

⚠️ **Pomiar wyżej opiera się na pliku, którego w repo NIE MA** (`AUDYT‑75`).
`walka-tempest-2026-08-05T11-49-44-019Z.json` odpadł jako sklejony i nie wszedł
do `tests/fixtures/`, więc tabeli pięciu wywołań nie da się dziś odtworzyć.
Sam WNIOSEK stoi niezależnie: opierają go cztery cytaty z klienta powyżej oraz
pomiar na żywym odczycie (`AUDYT‑56` — druga walka zadawała 5568 zamiast 2784
obrażeń, dopóki granicą była tożsamość obiektu). Zapisane tutaj, bo to ten sam
gatunek zapisu, który w tym repo dwa razy skłamał o buildzie.
