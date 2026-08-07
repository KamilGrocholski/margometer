## Roadmapa MergoMeter

Stan odhaczony 2026-07-30. Co jest zrobione, wynika z kodu; co zostało — z tego,
czego log nie daje albo czego jeszcze nie zbudowano. Usterki w rzeczach już
zrobionych nie wracają tutaj — siedzą w `UX-POPRAWKI.md` i `SOLID.md`.

## Kierunek na teraz (od 2026‑08‑03) — jakość danych, nie nowe funkcje

Decyzja właściciela repo: **nowe funkcje są WSTRZYMANE**. Praca idzie w jakość,
stabilność i niezawodność liczb, które panel pokazuje.

To nie jest to samo, co sekcja „Porzucone" niżej. Tam `❌` znaczy „nie wraca";
tu chodzi o kolejność, nie o skreślenie. `⬜ Procowanie jako osobny panel`
(niżej), pozycje `B*` z `UX-POPRAWKI.md` i drill „leczenie — od kogo" **czekają
i nadal są planem** — po prostu nie teraz.

**Co liczy się jako praca w tym kierunku.** Test, czy pozycja tu należy: *czy jej
brak może sprawić, że panel pokaże złą liczbę, nie mówiąc o tym ani słowem?*

- miejsca, w których wzorzec przyjmuje więcej, niż format naprawdę dopuszcza —
  bo tam liczba potrafi być zła przy zerze `unknown` (`SOLID §6`,
  [`specy/2026-08-03-parser-tokenizer-i-gramatyka.md`](specy/2026-08-03-parser-tokenizer-i-gramatyka.md));
- czujki, które są węższe od tego, co przepuszcza kod przed nimi;
- fallbacki zamieniające brak danych w zero albo w kopię sąsiada;
- **dowód, że czujka `unknown` jest ciasna** — korpus ma zero nieznanych
  kluczy, więc sam z siebie nie mówi nic o tym, czego dekoder NIE rozpoznaje.
  Odpowiada na to `tests/klucze-protokolu.test.ts` przeciw zamrożonej tabeli
  z assetu gry.

  ⚠️ **Stało tu narzędzie `bun tools/luki.ts` i zeszło z drzewa 2026‑08‑04.**
  Składało pomoc gry, korpus protokołu z grooove.pl i **korpus tekstowy**,
  wypisując efekty, które gra dokumentuje i które w walkach zachodzą, a nasz
  korpus ich nie zna. Trzecia noga tego złączenia była korpusem parsera —
  razem z nim odpadło pytanie, na które narzędzie odpowiadało;
- niezmienniki po całym korpusie tam, gdzie dziś ich nie ma — zwłaszcza na
  ścieżce przez DOM, jedynej niosącej żywioły;
- brakujące fixture'y (sekcja „Czego brakuje w korpusie" niżej);
- rozjazdy między rejestrem a kodem — bo na nieaktualnym zdaniu z `docs/`
  podejmuje się potem decyzje.

**Czego ten kierunek NIE obejmuje.** Dług architektoniczny sam z siebie
(`R5`, `R8`, cięcie `overlay.ts`) — jest wart zrobienia, ale z innego powodu niż
poprawność liczb, i nie ma pierwszeństwa. Wyjątek: refaktor, który **kasuje całą
klasę** cichych błędów, należy tu wprost (`R4`).

## Faza 1 — ZROBIONA
- ✅ Okno obrażeń
- ✅ LPM na pojedynczą postać → wejście w jej rozbicie; kolejne LPM na wiersz
  będący postacią → szczebel niżej (czym padło). Zadane drążą się przez CEL,
  otrzymane przez NAPASTNIKA.
- ✅ PPM → powrót o jeden szczebel, z całego panelu. Do tego klik w okruszek
  `‹ …` robi to samo.
- ✅ Szybkie przejście Wszyscy / My / Oni
- ✅ Przełącznik „na turę”
  ⚠️ z zastrzeżeniem: `/t` znaczy dwie różne rzeczy zależnie od metryki i wiersze
  nie sumują się do drużyny przy Zadanych — `DECYZJE.md` „Na turę”, do decyzji
  projektowej, nie do łatki.
- ✅ Hover pokazuje skrót statystyk: zadane, otrzymane, leczenie, tury (wiersz
  „utracone tury” zszedł 2026‑08‑05 — nic go nie zasilało),
  **efekty w ciosach** (`procs`) i **efekty otrzymane** (`procsReceived`),
  czyli klątwy, dotyki anioła i bardzo krytyczne — po nazwie i liczbie.
  ⚠️ ale w podglądzie z archiwum dymek dziś nie działa wcale (`UX-POPRAWKI.md A7`).
- ✅ Statystyki wg drużyny: nagłówek stron z paskiem podziału i sumy zespołu
  pod listą.

## Faza 2 — ZROBIONA poza „procowaniem”
- ✅ Otrzymane obrażenia (pełne drążenie, lustro zadanych)
- ✅ Uleczone (jeden szczebel: „OD CZEGO” — patrz ograniczenie niżej).
  Od 2026‑08‑05 leczenie kierowane ma zapisanego LECZĄCEGO (`healingDone`),
  ale drążenie „kto leczył” to osobna, wciąż otwarta pozycja.
- ⬜ **Procowanie jako osobny panel** — nadal bez pomysłu na kształt. Dane są
  (`procs`, `procsReceived` liczone dla obu stron), brakuje decyzji, czy to
  w ogóle ma być osobny widok, czy dymek wystarczy. Zderzyć z zasadą „nie robić
  trzeciego rzędu zakładek” (`UX.md §6`).
  ⚠️ Od 2026‑08‑03 dymek ma pięć sekcji (doszło TOP‑3 rozbicia), więc argument
  „dymek wystarczy” jest mocniejszy niż był — ale i sam dymek bliżej sufitu.

## Poza pierwotną roadmapą — zrobione
- ✅ **Rozbicie wg umiejętności, bez względu na cel** (`CZYM (ŁĄCZNIE)`) wraz
  z drążeniem w drugą stronę: umiejętność → komu zadała. Lustrzanie dla
  przyjętych. Dane (`dealtBy`) czekały policzone od początku; brakowało widoku
  i decyzji, gdzie go wpiąć — patrz `UX.md §3` i zastrzeżenie w `§6`.
- ✅ Nagrywanie surowych logów do `localStorage` z budżetem 1 MB
- ✅ Archiwum walk + wczytanie nagrania do GŁÓWNEGO panelu (pełne drążenie)
- ✅ Odtwarzanie walki linia po linii, z pauzą, przewijaniem i prędkością
- ✅ Ręczne wklejenie logu
- ✅ Kopiowanie statystyk walki jako JSON
  ⚠️ do 2026‑08‑03 szło tam też „+ sesja”, z błędnym `dealtToBy` (`SOLID §4.11`,
  naprawione 2026‑07‑30). Cała suma sesji zeszła z drzewa — `AUDYT‑6`.
- ✅ Rozbicie obrażeń wg typu + kolory i odznaki profesji
- ✅ Skalowanie i zapamiętywanie geometrii okna
  ⚠️ bez przycięcia do ekranu, czyli można je stracić — `UX-POPRAWKI.md A10`

## Porzucone (2026‑08‑03)

Sekcja nazywała się do 2026‑08‑03 **„Wstrzymane (nie porzucone)”** i wszystkie
trzy pozycje stały tu z `⏸`. Decyzja właściciela repo zamienia je na `❌`: żadna
nie wraca, a kod i dane, które na nie czekały, zeszły z drzewa. Zapis o tym, że
były wstrzymane, zostaje — pokazuje, ile taka pozycja potrafi kosztować, zanim
ktoś ją rozstrzygnie.
- ❌ **Metryka „Tury” — ODPUSZCZONA 2026‑08‑03.** `"turns"` zeszło z typu
  `Metric` i z obu map etykiet; `turnRows` zszedł już 2026‑07‑31 (`95d02d7`).
  Tury zostają w dymku i tam odpowiadają na swoje pytanie, a średnia na turę
  stoi w każdym wierszu — czwarta zakładka nie miała czego dołożyć. Kod wraca
  z historii, gdyby decyzja się odwróciła.
  (Wiersz „tury utracone”, wymieniany tu do 2026‑08‑05, zszedł z drzewa razem
  z polem `turnsLost` — nic go nigdy nie zasilało.)
- ❌ **Oś tur i skupienie ognia — PORZUCONE 2026‑08‑03.** Renderery zeszły
  z drzewa już 2026‑07‑31 (`95d02d7`) i czekały na decyzję „CO mają pokazywać”.
  Decyzja: nie wracają. Razem z nimi poszły **`stats.deaths` i `stats.matrix`**,
  które od tamtej pory liczyły się dla nikogo (`AUDYT‑25`) — wraz z typami
  `Death` i `DamageEdge` oraz całym `observeDeath`.
  ⚠️ Zapis „nie porzucone, wraca w komplecie” stał tu przez trzy dni i był
  szczery, ale to właśnie taka pozycja najdłużej udaje plan: kod nie kosztował
  nic, a jego DANE liczyły się przy każdej walce.
- ❌ **Zakładka zakresu (ta walka / sesja) — PORZUCONA 2026‑08‑03.**
  `Session.total()` i `mergeStats` zeszły z drzewa razem z nią (`AUDYT‑6`);
  `src/session.ts` skurczył się z 362 do 88 linii. Panel mówi wyłącznie
  o bieżącej walce, a skopiowany JSON też.

## Do zbadania osobno — leczenie „od kogo”

⚠️ **Ta sekcja opisywała stan KORPUSU TEKSTOWEGO, którego nie ma od 2026‑08‑04,
i kończyła się zdaniem „format sprawcy nieznany". Format jest znany.** Zostaje
przepisana, a nie skasowana, bo pomyłka jest tu pouczająca: „nie ma tego
w naszej próbce" zostało zapisane jako „gra tego nie ma", a to dwie różne
rzeczy. Przy pytaniu o FORMAT sięga się po kod gry, przy pytaniu o CZĘSTOŚĆ po
próbkę — reguła stoi w `MECHANIKA.md` i została tu złamana.

**Co jest znane (2026‑08‑05).** Protokół niesie leczącego przy `heal_target`
i `npc_heal`: renderer podstawia pod `%target%` pole `f2`, czyli DRUGĄ stronę
komunikatu, więc pierwszą jest rzucający (`BattleMessages.js:956‑969`).

**Co jest ZROBIONE.** Atrybucja: `BattleEvent.heal` niesie
`healer`/`healerId`/`healerHpPct`, a `stats.ts` zapisuje kwotę leczącemu
zamiast wrzucać ją do puli „bez sprawcy". Healer przestał mieć `healingDone: 0`.

**Co ZOSTAJE otwarte.** Samo drążenie „wg postaci (kto leczył)" — i **nie
z braku danych**, tylko dlatego, że dałoby się je wypełnić jedynie dla jednego
z trzech szyków leczenia:
- „Przywrócono N punktów życia X” — regeneracja/kradzież życia, BEZ sprawcy
  i klient gry też go nie zna;
- „Uleczono X o N punktów życia” — leczenie kierowane, sprawca ZNANY;
- „Dotyk anioła / Ostatni ratunek” — samoleczenie, sprawca = leczony.

Wiersz wypełniony w jednej trzeciej przypadków wygląda w panelu jak healer,
który raz leczy, a raz nie — powody w `DECYZJE.md` §„Leczenie bez leczącego”.

~~**Czego brakuje do domknięcia:** zrzutu z gry z kluczem `heal_target`.~~
✅ **MATERIAŁ JEST — 2026‑08‑06.** `2026-08-06-tempest-grupa-vs-hildur` niesie
`heal_target` w dwóch szykach naraz: samoleczenie (`Osłona tarczą`, obie strony
komunikatu to ten sam `id`) i leczenie CUDZE (`Leczenie ran`, dwa różne `id`) —
czyli dokładnie ta para, na której odczyt renderera („pierwsza strona to
rzucający") daje się sprawdzić przeciw materiałowi. Atrybucja przestała stać na
samym kodzie gry.

⚠️ **To nie zamyka pozycji, tylko jej podstawę.** Otwarte zostaje to samo, co
wyżej — drążenie „wg postaci (kto leczył)" nadal dałoby się wypełnić tylko dla
jednego z trzech szyków, a to jest decyzja projektowa, nie brak danych.

## Tura z autorytatywnego sygnału — `data.current`

Znalezione przy naprawie licznika tur 2026‑08‑05, **nie zrobione**. Licznik jest
dziś WNIOSKIEM ze strumienia komunikatów („akcja = tura”) i z tego powodu myli
się w obie strony: nie widzi tur bez akcji (ogłuszenie) i liczy podwójnie
dodatkowe ataki z `add_attacks`. Powody i pomiary:
[`specy/2026-08-05-tura-to-akcja.md`](specy/2026-08-05-tura-to-akcja.md).

Sygnał autorytatywny **jest w ładunku, który już przechwytujemy**: `data.current`
niesie `id` postaci, której gra przyznaje turę (`Battle.js:444,450` →
`self.newTurn(data.current)`). Co go dziś blokuje:

- ~~**W jedynym zrzucie cała walka (18 komunikatów) przyszła w JEDNYM wywołaniu
  `update`**~~ — to była walka automatyczna, którą silnik liczy sekwencyjnie
  i oddaje w całości. ✅ **Przestało blokować 2026‑08‑06:**
  `2026-08-06-tempest-grupa-vs-hildur` przyszedł w ponad stu wywołaniach,
  a `current` zmienia się między nimi. Materiał do sprawdzenia, ile `current`
  pokrywa, JEST.
- `recorder.ts` zapisuje wyłącznie komunikaty, więc dopięcie `current` zmienia
  FORMAT nagrań — czyli powtarza „nagrania sprzed tej wersji przepadają”.
  **To zostaje jedynym powodem, dla którego pozycja jest otwarta**, i jest to
  koszt, nie brak.

⚠️ **Czego materiał z 2026‑08‑06 NIE rozstrzyga.** To walka grupowa z potworem,
nie PvP i nie ręczna z NPC. `current` w niej jest, ale nikt nie sprawdził, czy
walka sterowana ręcznie porcjuje wywołania tak samo — a to od tego zależy, ile
`current` naprawdę zmienia. Zdanie „brakuje zrzutu z walki TUROWEJ" schodzi więc
tylko o tyle, o ile dotyczyło GRANIC WYWOŁAŃ.

## Leczenie, które nie liczy się do niczego — `bandage` i `vamp_time` ✅

✅ **ZROBIONE 2026‑08‑06** (`AUDYT‑96`). Oba klucze są w tabeli ról jako
leczenie; komunikat `bandage=200` daje `{kind:"heal", amount:200}` zamiast zera
zdarzeń. Otwarty zostaje **drugi człon wartości** — procent osłabienia leczenia,
którego `BattleEvent.heal` nie ma gdzie położyć (tyknięcia mają na to
`weakenedPct`, leczenie nie). Kwota z członu zerowego stoi już PO osłabieniu,
więc liczba w panelu jest prawdziwa; tracimy „ile osłabienie zdjęło”.

⚠️ **SPROSTOWANIE — akapit zamykający tę sekcję był NIEPRAWDĄ w chwili
pisania.** Stało tu: *„Czego brakuje: zrzutu z walki, w której któryś z tych
kluczy pada — bez niego byłoby to przeniesienie do ról na podstawie samego
brzmienia"*. Brzmienie nie było jedynym dowodem, jaki repo miało. Dowodem jest
PODSTAWIENIE w rendererze (`'%name%': f1.name`, `:378‑392`), a asset klienta
leżał w `.cache/` przez cały ten czas — pozycja czekała na materiał, którego
jej pytanie nie wymagało.

**Wniosek, przez który to zdanie tu zostaje:** warunek „potrzebny zrzut” bywa
odruchem, nie diagnozą. Zrzut odpowiada na pytanie CZY I JAK CZĘSTO klucz pada;
na pytanie CO ON ZNACZY odpowiada klient gry. Rozdział tych dwóch pytań stoi
w `MECHANIKA.md` od dawna i został tu złamany przez nas. Zrzut nadal jest wart
zebrania — jako POTWIERDZENIE, nie jako warunek napisania wpisu.

Poniższy opis zostaje jako zapis stanu sprzed naprawy. Oba klucze stały w tabeli
`PROCE` (`src/protokol.ts`), czyli „gra wypisuje zdanie, ale my nie liczymy
z niego niczego" — a oba niosą leczenie **w punktach życia**:

- `bandage` → „Uleczono %name% o %val% punktów życia.” Renderer:
  `'%val%': a[0]`, `'%name%': f1.name` (`BattleMessages.js:378‑392`), czyli
  kwota w punktach na pierwszej stronie komunikatu.
- `vamp_time` → „+Uleczono za %val% punktów życia” (`BattleMessages.js:1018‑1039`).

To leczenie, które w panelu **nie istniało wcale**: nie wchodziło ani do
`healingReceived`, ani do puli nieprzypisanej, więc nie zostawiało po sobie nawet
przypisu. Kwalifikowało się do kierunku „jakość danych” wprost: panel pokazywał
złą liczbę i nie mówił o tym ani słowem.

⚠️ Stało tu jeszcze „To NIE jest «bez sprawcy» — sprawca jest znany (to `f1`)”
i było to za mocne o jeden klucz. Przy `bandage` renderer podstawia nazwę
wprost; przy `vamp_time` zdanie **nie podstawia żadnej** („+Uleczono za %val%
punktów życia”), więc pierwszy segment jest tam wnioskiem z konwencji, nie
odczytem. W kodzie oba mają dziś `wlasne: false`, a różnica siły dowodu stoi
przy nich w komentarzu.

~~Czego brakuje: zrzutu z walki, w której któryś z tych kluczy pada — bez niego
byłoby to przeniesienie do ról na podstawie samego brzmienia.~~ **Skreślone
2026‑08‑06 — patrz sprostowanie na początku sekcji.** Docstring `PROCE` ostrzega
przed przenoszeniem z brzmienia („czyta się to «nie udowodniono, że niesie
liczbę, którą liczymy», a nie «na pewno nie niesie»”) i to ostrzeżenie zostaje
w mocy; przeniesienie stanęło na kodzie renderera, nie na brzmieniu.

## Trzy klucze z liczbami, które nadal się nie liczą

Znalezione 2026‑08‑06 tym samym skanem co dwa wyżej (`AUDYT‑99`). Ze skanu 197
kluczy `PROCE` przeciw słownikowi gry wyszło jedenaście niosących punkty;
osiem naprawiono, zostają trzy. Pełna tabela z cytatami: `MECHANIKA.md`, wpis
„Które klucze protokołu niosą PUNKTY życia".

⚠️ **Stały tu CZTERY do 2026‑08‑06.** Nagłówek z liczbą starzeje się razem
z pozycją — ta sama lekcja, co przy „dwóch fixture'ach" (`AUDYT‑58`): licz
listą, nie nagłówkiem.

- ~~**`dmg-target_physical`**~~ ✅ **ZROBIONE 2026‑08‑06** (`fea3874`). Weszło
  do `ROLE` jako obrażenia o stałej wartości zadane CELOWI, `strike: false`,
  `raw === applied` (katalog: „nie są redukowane przez pancerz"). ⚠️ Klucz nie
  pada w żadnym materiale — zero wystąpień w obu fixture'ach i w `KORPUS` —
  więc świadka nie ma i mieć nie będzie; wpis stoi na kliencie gry. Ryzyko
  podwojenia, gdyby gra wysyłała przy nim także `-dmgX`, zostaje **otwarte**
  i jest jedyną rzeczą, do której zrzut jest tu naprawdę potrzebny.
- **`vamp`** („zadał %val% obrażeń %target% lecząc za nie siebie") — otwarte
  z JEDNEGO powodu i warto go nazwać dokładnie: nie wiadomo, czy ta liczba
  dubluje się z `-dmgd` tego samego komunikatu. Katalog mówi „zadaje **stałe
  obrażenia od umiejętności** oraz przywraca Postaci punkty zdrowia o tę samą
  wartość", co przemawia za osobną liczbą — ale nie rozstrzyga, bo nie mówi
  o zapisie w protokole. Rozstrzygnie to zrzut z walki z tym kluczem: suma
  obrażeń przeciw procentowi życia u świadka pokaże, czy liczyć raz, czy dwa.
  **To jest pozycja, którą materiał NAPRAWDĘ domyka** — w odróżnieniu od tych,
  które na zrzut czekały niepotrzebnie.
- **`+oth_cover`, `+oth_dmg`** — **format ZNANY, liczenie OTWARTE**
  (`AUDYT‑106`). Wartość jest trójczłonowa i klient mówi, czym jest każdy człon:
  `mm[0]` kwota, **`mm[1]` KOD ŻYWIOŁU** (wchodzi w `class=dmg{mm[1]}`),
  `mm[2]` nazwa odbiorcy. ✅ Na tym stanęła naprawa etykiet (`e7087a3`):
  71 efektów pokazuje dziś zdanie gry zamiast klucza.

  ⚠️ **STAŁO TU „(osłona kompana)", potem „NAZWA BEZ POKRYCIA" — i oba były
  nieścisłe.** Pierwsze sklejało dwa różne klucze; drugie (moje, z 2026‑08‑06)
  ogłaszało brak wiedzy po sprawdzeniu JEDNEGO źródła. Katalog pomocy istotnie
  nie zna obu kluczy, ale klient opisuje je we własnym komentarzu i leżał
  rozpakowany w `.cache/`. Dziś wiadomo: `+oth_cover` to przejęcie obrażeń,
  a `+oth_dmg` to **lista celów umiejętności obszarowej** — do 20 wpisów
  w jednym komunikacie, i dlatego adresatem bywa boss.

  ⚠️ Wartość niesie też **nazwę TRZECIEJ postaci**, a kontrakt zdarzeń stoi na
  dwóch stronach komunikatu — to zostaje prawdą i to jest praca projektowa,
  gdy przyjdzie liczyć.

  ⚠️ **A liczby są duże i to jest najpilniejsza część tej pozycji.** Świadek
  `hp.max` przeciw procentowi zaszytemu w wartości: **bez doliczenia `+oth_dmg`
  0 trafień** — i to w obu modelach leczenia (0/18 przy pomijaniu uleczonych,
  0/71 przy modelowaniu). Trafione postacie wychodzą u nas na 100 % życia, gdy
  log mówi 52–70 %. Doliczenie daje 5 i 25, więc kierunek jest pewny, wielkość
  nie. **Domknie to zrzut z walki BEZ leczenia** — ten sam, którego potrzebuje
  świadek, więc jedna walka zamyka dwie pozycje. Pomiary: `AUDYT‑106`.

  ⚠️ **`+oth_dmg` GINĄŁ PODWÓJNIE i to ustawiło kolejność prac** (`AUDYT‑102`).
  Pada w `grupa-vs-hildur` **71 razy**, i za każdym z nich komunikat nie niesie
  ani jednej liczby obrażeń — więc wypadał w całości przez pozycję „Efekty
  z komunikatu bez obrażeń przepadają" wyżej, zanim ta tabela zdążyła cokolwiek
  o nim postanowić. Przeniesienie go do ról nie dałoby wtedy nic.

  ✅ **Pierwsza połowa zdjęta 2026‑08‑06** (`4039be7`): klucz jest dziś
  WIDOCZNY w dymku. ⚠️ Nadal **NIELICZONY** — i to jest cała reszta tej pozycji.
  Do tego jego etykieta pokazuje sam klucz, nie zdanie, bo `%name%` w
  `msg_+oth_dmg %val% %name%` nie ma czym się wypełnić: nick stoi WEWNĄTRZ
  wartości i nie jest ani pierwszą, ani drugą stroną komunikatu. Zmierzone —
  `+oth_dmg=8868,g,Gracz 10(70.85%)` przy `f1=Hildur`, `f2=Gracz 4`. To ta sama
  trzecia postać, o której mówi akapit wyżej, tyle że widziana od strony
  brzmienia.

## Efekty z komunikatu bez obrażeń przepadają w całości ✅

✅ **ZROBIONE 2026‑08‑06** (`AUDYT‑98`, commit `4039be7`). `BattleEvent` ma
wariant `kind: "effect"` — efekt bez trafień. Efekty docierające do panelu:
**299 → 546**. Projekt, odrzucone warianty i pomiary:
[`specy/2026-08-06-efekt-poza-ciosem.md`](specy/2026-08-06-efekt-poza-ciosem.md).

⚠️ **Promień był mniejszy, niż zapowiadał ten wpis.** Stało tu „a za nią
`stats.ts`, `overlay.ts` i odtwarzania nagrań". Ruszyły `types.ts`,
`protokol.ts` i `stats.ts`; `overlay.ts` renderuje `actor.procs` ogólnie,
a nagrania trzymają surowe komunikaty i przeliczają się nowym dekoderem same.

⚠️ **Naprawa wymagała drugiej połowy, której ten wpis nie przewidywał.**
`etykieta()` podstawia wyłącznie `%val%`, więc samo wpuszczenie efektów
podniosłoby liczbę etykiet z niewypełnioną dziurą z **0 z 299** do **147 z 546**
— gracz zobaczyłby w dymku dosłowne „%name%". Zdanie z dziurą ustępuje dziś
KLUCZOWI. Wniosek na przyszłość: pozycja „dołóż miejsce w kontrakcie" potrafi
mieć drugą połowę po stronie PREZENTACJI, a widać ją dopiero po pomiarze.

Poniższy opis zostaje jako zapis stanu sprzed naprawy. Komunikat, w którym nie
ma ani jednej liczby obrażeń, kończył się w dekoderze wcześniej — i zabierał ze
sobą zebraną listę efektów. Zmierzone: `tspell=Tarcza;resfire_per=20` dawało
**samo zdarzenie `ability`**, a `resfire_per` nie trafiał nigdzie: ani do
„efektów w ciosach", ani do „otrzymanych", ani do `unknown`.

⚠️ **STAŁO TU „nie wiadomo, jak często gra takie komunikaty wysyła […] jedyna
prawdziwa walka w repo nie ma ani jednego" I PRZESTAŁO BYĆ PRAWDĄ TEGO SAMEGO
DNIA** (`AUDYT‑102`). Przewrócił to commit `412579d` — ten sam, który dołożył
drugą prawdziwą walkę. Zdanie o rendererze (`tm[1]` wypełnia się niezależnie od
warunku `attack != ''`) zostaje; zdanie o materiale nie.

✅ **ZAKRES JEST DZIŚ ZMIERZONY**, na `2026-08-06-tempest-grupa-vs-hildur`:
**91 takich komunikatów, 247 ginących efektów**, 15 różnych kluczy. Najczęstszy
to `+oth_dmg` (71×) — ten sam, który stoi w sekcji „Cztery klucze…" niżej, więc
**ginie podwójnie** i kolejność obu pozycji nie jest dowolna. Rozkład i cytaty:
`docs/AUDYT.md`, `AUDYT‑102`.

✅ **ZAKRES NAPRAWY JEST WĘŻSZY, NIŻ MÓWI OPIS.** Wczesny powrót zabiera też
`blok`, `unik` i `kryt`, ale tych BEZ obrażeń nie ma w materiale ani razu
(0/0/0 na obu fixture'ach) — ginie wyłącznie lista efektów. Potrzebne jest więc
miejsce dla EFEKTU poza ciosem; blok i unik mają już swoją gałąź (`kind: "info"`).

⚠️ **Wniosek ogólniejszy od tej pozycji.** Warunek „brakuje zrzutu" potrafi
zniknąć **bez niczyjej decyzji**, bo materiał wchodzi do repo inną drogą niż
rejestr — i wtedy nie zapala się nic. Wchodzący fixture powinien być momentem
przejrzenia pozycji, które na fixture czekały; dziś nie jest.

## Czego brakuje w korpusie fixture'ów

✅ **ZBIERANIE MATERIAŁU PRZESTAŁO WYMAGAĆ KONSOLI — 2026‑08‑05.** Cztery
pozycje kończą się zdaniem „brakuje zrzutu z gry" — **trzy wyżej** (`heal_target`,
`data.current`, `bandage`/`vamp_time`) i **jedna niżej**, w liście zakupowej
(blok/unik/absorpcja/zapowiedź). ⚠️ Stało tu „cztery pozycje wyżej" (`AUDYT‑79`).
Wszystkie cztery czekały na to samo: wklejenie sondy do konsoli PRZED walką, czyli na to, żeby
ktoś przewidział, w której walce padnie szukany klucz. Od tej rundy zrzut robi
sam dodatek — zębatka → „Tryb deweloperski" → „Zrzut walki" — raz włączony
zbiera całą sesję, a plik ma ten sam kształt, więc `bun tools/walka.ts --rozbij`
czyta go bez zmian. Powody, odrzucone warianty i to, czego runda NIE domyka:
[`specy/2026-08-05-zrzut-fixturow-z-dodatku.md`](specy/2026-08-05-zrzut-fixturow-z-dodatku.md).

⚠️ **To zmienia koszt, a nie stan.** Żadna z czterech pozycji nie jest zamknięta:
narzędzie nie jest materiałem. Do dziś nie wiadomo też, czy zrzut z dodatku
zgadza się ze zrzutem sondy z tej samej walki — sprawdzone jest wyłącznie to,
że oba mają ten sam kształt.

✅ **MATERIAŁ PRZYSZEDŁ — 2026‑08‑06.** `2026-08-06-tempest-grupa-vs-hildur`
zamyka po stronie MATERIAŁU trzy z tych czterech pozycji: `heal_target`,
granice wywołań dla `data.current` i całą listę zakupową poza unikiem.
Zdanie wyżej („narzędzie nie jest materiałem") było trafne i to jest jego
rozstrzygnięcie: pierwszy zrzut zebrany dodatkiem, a nie konsolą, wystarczył.
Czego NIE zamyka, stoi przy każdej pozycji z osobna; `bandage`/`vamp_time`
i unik nadal czekają.

⚠️ **Zdanie o zgodności dwóch dróg ZOSTAJE nierozstrzygnięte i zmienił się
tylko jego kontekst.** Katalog ma dziś po jednym pliku z każdej drogi — ale
z dwóch RÓŻNYCH walk, więc porównać ich nie ma jak. Do domknięcia trzeba tej
samej walki zebranej oboma sposobami naraz, a to wymaga włączonego dodatku
i wklejonej sondy jednocześnie.

✅ **SUROWY MATERIAŁ WRÓCIŁ DO REPO — 2026‑08‑05.** `tests/fixtures/*.json`
niesie zrzuty tak, jak przysłał je serwer, a niezmienniki ODKRYWAJĄ pliki same
(`tests/fixtury.ts`, `tests/fixtury.test.ts`, wciągnięcie do `KORPUS`). Dzięki
`hp.max` z migawek repo ma znów **częściowego świadka dekodera spoza dekodera**:
skumulowane obrażenia muszą trafić w procent życia podany przez protokół
(**7 porównań, 0 rozjazdów**; mutacja `raw` zamiast `applied` zapala 6 z 7 —
stało tu „16 trafień", liczba z odrzuconego zrzutu, `AUDYT‑58`). Powody
i granica wobec decyzji z 2026‑08‑04:
[`specy/2026-08-05-surowy-material-z-gry-wraca-do-repo.md`](specy/2026-08-05-surowy-material-z-gry-wraca-do-repo.md).

⚠️ **W katalogu leży JEDNA walka, nie dwie** — i to jest znalezisko tej rundy,
opisane niżej: pierwszy zrzut z dodatku okazał się dwiema walkami w jednym
pliku i został odrzucony. ✅ **Druga weszła 2026‑08‑06** (`grupa-vs-hildur`),
innym zrzutem, z jedną walką w pliku.

⚠️ **Świadek nie urósł proporcjonalnie i tak trzeba to czytać.** Nowy plik jest
pięćdziesiąt razy większy i daje **mniej porównań niż stary**, bo potwór leczy
się niemal w każdej turze, a uleczony cel wypada z porównań (`AUDYT‑61`).
Zmierzone liczby stoją w `tests/fixtury.test.ts` i wypisuje je test. Wniosek
ogólniejszy od tej pozycji: **szerokość kluczy i głębokość świadka to dwie różne
rzeczy**, a materiał potrafi dać pierwszą, nie dając drugiej.

⚠️ **Dopisane 2026‑08‑07 (`AUDYT‑113`): część drogi da się przejść materiałem,
który JUŻ jest.** Akapit wyżej mówi, czego nowy plik nie dał, i to prawda —
świadek robi dziś **10 porównań na 1448 zdarzeń** całego `KORPUS` (7 na małym
fixturze, 3 na dużym, 251 porzuconych po leczeniu). Ale wszystkie **108**
zdarzeń `heal` w dużym fixturze niosą jednocześnie `amount`, `targetHpPct`
i znane `hp.max` (zmierzone 108/108/108), czyli komplet do dwóch ruchów bez
nowego zrzutu: **świadka LECZENIA** (dziś leczenie nie ma świadka wcale)
i **ponownego zakotwiczenia po uleczeniu** zamiast wykluczania celu na zawsze.
Reguła z `AUDYT‑61` uzasadnia niedoliczanie `amount` do bazy — nie uzasadnia
odrzucenia nowego punktu odniesienia, który protokół podaje w tym samym
zdarzeniu. **Zdanie „domknie to zrzut z walki BEZ leczenia" zostaje w mocy**;
zmienia się tylko to, że nie na wszystko trzeba czekać.

## Granica walk — nasze numerowanie nie widzi drugiej walki w sesji

**To jest pozycja o BŁĘDZIE, nie o brakującej funkcji**, i zdaje test kierunku
wprost: panel może pokazać złą liczbę, nie mówiąc o tym ani słowem.

`protokol-source.ts:241` zeruje komunikaty i skład, gdy zmieni się TOŻSAMOŚĆ
obiektu `Engine.battle`. Pierwszy prawdziwy zrzut z dodatku pokazał, że gra tego
obiektu **nie wymienia** — pięć wywołań, dwie walki (koniec starcia z warchlakami,
`close`, potem `init` i starcie z odyńcami), wszystkie z `walka: 1`, a
`skladZeZrzutu` daje z tego sześciu wojowników, z czego trzech nie pada w żadnym
komunikacie. Że granicą jest `data.init`, wie klient gry — cytaty z `Battle.js`
i pomiar: `docs/MECHANIKA.md`, wpis „Granica walk".

**Co już zrobione:** `--zachowaj` odmawia sklejonym zrzutom, a dwa niezmienniki
łapią taki plik, gdyby ktoś wrzucił go ręcznie („jeden plik to jedna walka",
„skład nie ma duchów"). Materiał do repo nie wejdzie po cichu.

✅ **ODCZYT NA ŻYWO NAPRAWIONY — 2026‑08‑05** (`AUDYT‑56`, `AUDYT‑57`). Do tej
rundy nic w `src/` nie czytało `init`, więc druga walka w sesji liczyła się
razem z pierwszą i rozwiązywała `id` po nazwach z tamtej. Stało tu, że nie
zmierzono, czy panel to pokazuje, i że `session.ts` może to maskować — **nie
maskował**. Pomiar tą samą sondą przed i po, dwie walki przez
`EngineProtokolSource` → `Session`, obiekt `battle` ani razu nie wymieniony:
druga walka zadawała **5568 zamiast 2784** obrażeń, 16 zamiast 8 trafień i 24
zamiast 12 tur. To samo sklejenie szło do archiwum — dwie walki w jednym
nagraniu.

Granicą jest dziś `data.init`; predykat `zaczynaWalke` stoi w `src/zrzut.ts`
i woła go **zarówno dodatek, jak i `graniceWalk` w narzędziu**, żeby definicja
granicy nie mogła się rozjechać po cichu.

⚠️ **Co nadal otwarte:** czy `init` przychodzi ZAWSZE — także po przeładowaniu
strony w trakcie walki — i czy `close` bez `init` potrafi zamknąć walkę tak, że
następna go nie dostanie. Oba przypadki nazywa `docs/MECHANIKA.md` i żadnego nie
rozstrzyga materiał. Potrzebny zrzut z przeładowaniem.

⚠️ **Dopisane 2026‑08‑07 (`AUDYT‑108`): granica stoi na JEDNYM warunku, a druga
obrona była martwa.** Akapit wyżej mówi „granicą jest dziś `data.init`" i to
prawda — ale `session.ts` miał być drugą warstwą i nią nie był. `splitFights`
dzielił po zdarzeniu `fight-start`, którego **dekoder protokołu nie produkuje od
2026‑08‑04**; jedynymi producentami w repo są generator i budowniczy testowy.
Zmierzone: bufor z dwiema kopiami tej samej walki daje **2883 → 5766 obrażeń
i 12 → 24 tury**, dokładnie jak przed naprawą z `AUDYT‑57`. Strumień niesie przy
tym `fight-end` — 2× na walkę w obu fixture'ach — i nikt go do podziału nie
czyta.

✅ **Martwa obrona skasowana tego samego dnia** — `splitFights` zszedł
z `src/session.ts`, a liczby na obu fixture'ach nie drgnęły (pomiar przed i po
przez `Session`, wszystkie pola identyczne). **To nie jest naprawa granicy, tylko
usunięcie złudzenia, że jest podwójna.** Granica nadal stoi na jednym warunku
i tryb awarii jest niezmieniony — zmieniło się tyle, że `session.ts` już nie
udaje drugiego świadka.

⚠️ **Co z tego ZOSTAJE otwarte:** podział po `fight-end` jako druga, niezależna
granica. To zmiana ZACHOWANIA, nie sprzątanie — trzeba rozstrzygnąć, co robić ze
zdarzeniami między `fight-end` a następnym `init`, i to zasługuje na spec.
Otwarte zostaje też `stats.ts:805` (zwraca na żywo zawsze `[]`, choć komentarz
obok obiecuje odczyt „z linii otwierającej") — z tym, że **nie jest to gałąź
martwa, tylko żywa wyłącznie dla korpusu syntetycznego**: wisi na niej
`tools/synthetic-log.ts` i kilkadziesiąt testów panelu. Sprostowanie i powód
przy wpisie `AUDYT‑108`.

⚠️ **Dopisane 2026‑08‑07 (`AUDYT‑107`): drugie źródło podwojenia, niezależne od
granicy walki.** Gdy cudzy dodatek owinie `Engine.battle.update` **po nas**,
warunek pomijający w `zapewnijOwiniecie` nie zachodzi i owijamy drugi raz —
jedno wywołanie gry przechodzi przez odczyt dwa razy. Zmierzone na atrapie:
**300 → 600 obrażeń, 3 → 6 komunikatów, zero ostrzeżeń.** Ta pozycja mówi
„nasze numerowanie nie widzi drugiej walki"; `AUDYT‑107` pokazuje, że **liczby
potrafią się podwoić także w obrębie JEDNEJ walki**, i to bez udziału gry.

Nie funkcja, ale warunek wejścia dla kilku rzeczy wyżej. Agregat pól `missing`
w `meta.json`, zweryfikowany po `covers`:
- ~~**Para: ta sama walka jako tekst i jako protokół.**~~ **ZAŁATANA 2026‑08‑04**
  — dziś w kodzie, jako `tests/walka-z-gry.ts`. Zdanie
  „nie da się bez gracza" było prawdziwe do końca: parę zebrał gracz, sondą
  w konsoli i przyciskiem „Kopiuj logi".

  **Co dała, w liczbach.** Obie drogi zgodziły się co do jednostki na wszystkim
  poza jedną pozycją: obrażenia zadane 2784, przyjęte 99/831/834/1119, zero
  zdarzeń `unknown`, zero kluczy protokołu spoza tabeli ról. **Numeracja
  instancji też wypadła identycznie**, mimo że każda droga liczy ją inaczej
  (tekst po spadku życia, protokół po `id`) — dwa NPC o nazwie `Odyniec`
  rozdzieliły się na `#1` i `#2` tak samo.

  **Co złapała.** Jedną usterkę dekodera przy pierwszym uruchomieniu: leczenie
  z pustą drugą stroną komunikatu było kredytowane postaci, o której log milczy
  (`d4be27e`). Drugą usterkę — gubione osłabienie DoT‑a — złapał odczyt
  słownika, a nie orakulum, bo `damageWeakened` nie wchodzi do porównywanych
  skalarów (`a5e9150`). Wniosek: **czujka i czytanie źródeł łapią co innego.**

  **Czego ta para nie ma:** ~~bloku~~, uniku, ~~absorpcji~~, ~~zapowiedzi
  umiejętności~~. To jest lista zakupowa na następny zrzut. (Stało tu jeszcze
  „ani `log.html`" — bezprzedmiotowe od 2026‑08‑04, sonda nie zbiera już węzłów
  renderu.)

  ✅ **Trzy z czterech skreślone 2026‑08‑06** przez
  `2026-08-06-tempest-grupa-vs-hildur`: `-blok` (dziewięć linii, wszystkie u tego
  samego celu), `-absorb` i `-absorbm` z własnymi kluczami razem z ich
  niszczeniem, `prepare=` rozłożone na kilka wywołań aż do `(100%)`. **Zostaje
  UNIK** — i to jest cała dzisiejsza lista zakupowa, razem z `bandage`
  i `vamp_time` z pozycji wyżej.

  ⚠️ **Skreślenie znaczy „materiał JEST", nie „przeliczone i zgodne".** Świadek
  `hp.max` obejmuje wyłącznie obrażenia i przechodzi po sumie `applied`, więc
  blok i absorpcja przechodzą przezeń jako składnik już odjęty; ich OSOBNE
  składniki nadal nie mają świadka spoza dekodera. To samo zastrzeżenie, co
  w `AGENTS.md`.

  Poniższy akapit opisuje stan sprzed tej pary i zostaje jako zapis drogi:

  Protokół
  z grooove.pl jest wewnętrznie spójny co do promila: z par (spadek życia
  w procentach, suma kluczy `-D*`) wychodzi to samo maksymalne HP z pięciu
  i sześciu niezależnych obserwacji, rozrzut 0,0–0,1 % (zmierzone 2026‑08‑04 na
  `2026-08-03_pandora_wojownik-vs-mag-fuzja`). Gdyby istniała JEDNA walka
  zapisana obiema drogami, protokół byłby **niezależnym orakulem liczbowym**
  dla `parse` i `aggregate`: obrażenia przyjęte per postać, bloki, leczenie,
  krzywa życia. Dziś nic w repo nie sprawdza tych liczb przeciw czemukolwiek
  spoza repo — testy pilnują niezmienników i spójności wewnętrznej, a nie
  tego, czy suma się zgadza z prawdą.

  **Czego już nie trzeba szukać u kogoś innego.** Droga przez grooove.pl była
  ślepa: wyszukiwarka przyjmuje **ID gracza, nie nick**, a wklejarka
  `/battle/wklej-walke` **wyłącznie protokół z dodatku „Panel walk"**.
  Od 2026‑08‑04 protokół bierze się wprost z gry, sondą `tools/walka-probe.js`
  (owija `Engine.battle.update`), a `bun tools/walka.ts --rozbij` składa z tego
  fixture. Zostaje **jeden krok, którego nie da się zautomatyzować**: przycisk
  „Kopiuj logi" w oknie walki. Tekst forumowy powstaje w tej samej pętli
  renderera, ale instancja `BattleMessages` jest w kliencie prywatna modułowo
  (`Battle.js:36`), więc sonda go nie dosięgnie — i dlatego „bez gracza" zostaje
  prawdą.

  ⚠️ **ORAKULUM ZESZŁO Z DRZEWA 2026‑08‑04 I TO JEST DZIŚ NAJWIĘKSZA OTWARTA
  LUKA.** `tests/orakulum.test.ts` porównywało `dekoduj(komunikaty)` z
  `parse(odtworz(komunikaty))` — dwa rozłączne kody czytające ten sam komunikat
  — i to ono złapało pierwszy prawdziwy błąd dekodera (leczenie przypisywane
  sobie). Razem z parserem tekstu zniknęła druga strona porównania; skasowanie
  było świadomą decyzją, nie przeoczeniem.

  ⚠️ **Stało tu „JEDYNY prawdziwy błąd dekodera" i przestało być prawdą
  2026‑08‑06.** Drugi znalazł się bez orakulum: parowanie zadanych z przyjętymi
  po kolejności, złapane przez sam MATERIAŁ — nowy fixture dał 16 komunikatów
  `unknown` i nie chciał wejść. To osłabia zdanie „dekoder nie ma dziś świadka
  spoza repo" o tyle, o ile prawdziwa walka jest takim świadkiem: nie sprawdza
  liczby po liczbie, ale kształtu, którego nie umiemy wymyślić, dostarcza sama.
  Luka **zostaje otwarta** — jedna walka nie zastępuje orakulum — ale nie jest
  już prawdą, że nic spoza repo dekodera nie sprawdza.

  **Dekoder nie ma dziś świadka spoza repo.** Wszystkie pozostałe testy pytają
  repo o zgodność z samym sobą — a to jest dokładnie ten kształt, który był
  zielony wtedy, gdy `mergeStats` gubiło sumy (`AUDYT‑6`). Odbudowa wymaga
  drugiego, niezależnego czytelnika komunikatów; nikt takiego nie ma napisanego
  i nie jest to praca na jedną rundę.
- **Krwawa udręka ( anguish )** — 11 wystąpień w korpusie protokołu, zero
  w tekstowym (rdzeń „udrę");
- **Wściekłość ( rage )** — 26 wystąpień w korpusie protokołu, zero
  w tekstowym; najczęstszy klucz bez odpowiednika.

  ⚠️ **Oba te punkty ZMALAŁY 2026‑08‑04 i trzeba powiedzieć, o ile.** Stało tu,
  że są to kandydaci na ciche luki parsera i że brzmienia nie wolno przepisać,
  bo znamy je tylko z cudzego renderera. Brzmienia znamy dziś **z assetu gry**
  (`bun tools/slownik.ts`), a sprawdzenie ich przez `parse` pokazało, że
  **parser czyta OBA już teraz**: linia krwawienia wchodzi jako `kind: "dot"`
  (wzorzec jest ogólny co do rodzaju), a Wściekłość jako proc z liczbą
  znormalizowaną do `+N`. Cytaty i pomiary: `MECHANIKA.md`.

  Zostaje więc luka **KORPUSU, nie parsera**: zrzut jest wart zebrania jako
  potwierdzenie, nie jako warunek napisania wzorca. Nadal nie da się go zrobić
  z grooove.pl (tamten korpus niesie protokół, nie tekst), a oba efekty są
  bonusami legendarnymi, więc potrzebny jest ekwipunek, który je ma.
- **Siedem kluczy protokołu, które wyszły z korpusu 2026‑08‑04** razem z dwiema
  walkami z Cronusa, gdy korpus stał się tylko polskojęzyczny: `z__crit`,
  `z__pierce`, `spell-taken_D`, `critval-allies`, `critmval-allies`, `rk_per`,
  `g_`. Żadna polska walka w korpusie ich nie niesie. Pozycja słabsza od dwóch
  wyżej — o żadnym z nich nie wiadomo nawet, czy odpowiada zdarzeniu w logu —
  ale to cena tamtej decyzji i ma być zapisana, a nie przemilczana. Tę akurat
  lukę **da się** załatać z grooove.pl, na polskim świecie. Powody decyzji:
  README korpusu grooove — plik zszedł z drzewa 2026‑08‑04 razem z korpusem;
- ~~**log właścicielki**~~ — **bezprzedmiotowe od 2026‑08‑04.** Chodziło o formy
  ŻEŃSKIE czasownika („uderzyła"), obsłużone w regexach parsera i sprawdzone
  tylko na ręcznie pisanych stringach (`SOLID.md §4.8`). Protokół nie niesie
  czasowników — niesie `id` i klucze — więc płeć postaci przestała być
  ryzykiem odczytu;
- ~~**walka z przyciętym nagłówkiem**~~ — **bezprzedmiotowe od 2026‑08‑04.**
  Rozstrzygało `SOLID.md §4.12`, czyli przycinanie bufora DOM od góry.
  Protokół nie ma bufora do przycięcia;
- ~~**`Zablokowanie N obrażeń` na ścieżce DOM**~~ — **skreślone 2026‑08‑03:**
  zamknięte 2026‑08‑01, `2026-08-01_druzyna-vs-hildur-drugi-sklad` dostał
  wtedy `log.html` (`SOLID §10`). Ten plik trzymał to jako brak trzy dni dłużej
  — status żyjący w dwóch miejscach, po raz kolejny. (Ścieżki DOM ani tamtego
  pliku nie ma od 2026‑08‑04; wpis zostaje jako zapis, jak wygląda ta choroba.)
- ~~**remis**~~ — **skreślone 2026‑08‑01, bo było nieprawdą.** „Walka nie
  wyłoniła zwycięzcy” występowało wtedy w `2026-07-18_tancerz-vs-kukla/raw.txt:36`
  i `2026-07-18_tropiciel-vs-kukla/raw.txt:31` (pliki zeszły z drzewa
  2026‑08‑04; zdarzenie siedzi dalej w ich `zdarzenia.json`). Skąd błąd i jak go
  nie powtórzyć — `SOLID.md §10`.

## Rejestr, do którego odsyła dokumentacja, rozjechał się ze stanem repo

Dopisane 2026‑08‑07 (`AUDYT‑115`, `AUDYT‑116`). Pozycja zdaje test kierunku
pośrednio, przez wpis z sekcji „Co liczy się jako praca w tym kierunku":
**rozjazdy między rejestrem a kodem**. Nie chodzi o liczbę w panelu, tylko
o to, że lista otwartych spraw pokazuje mniej, niż jest — a decyzje o kolejności
prac podejmuje się właśnie z niej.

**✓ Zmierzone, dwie konwencje w `docs/AUDYT.md`:** wpisów z własnym nagłówkiem
`### AUDYT‑N` jest **97**, wierszy w tabeli `§0` — **55**, czyli **42 ID nie ma
wiersza** (wszystko od 2026‑08‑05). Łańcuch akapitów `**Dopisane …**`
w preambule urywa się na sekcji `K`: sekcje `L` i `M` nie mają w nim ani jednego
zdania. `docs/README.md:342` odsyła po „aktualny stan" właśnie do tabeli `§0`.

**✓ Zmierzone, `docs/specy/README.md`:** katalog ma **11** speców, tabela „Spis"
wymienia **9**. Brakuje `2026-08-04-parser-tekstu-i-korpus-schodza-z-drzewa.md`
i `2026-08-06-efekt-poza-ciosem.md` — ten drugi powstał w rundzie, która sama
siebie audytowała.

⚠️ **Wspólna przyczyna jest jedna i ma już nazwę w `AGENTS.md`:** *reguła bez
strażnika po stronie danych jest regułą o kodzie, nie o repozytorium.* Zapisano
ją tam dwa razy 2026‑08‑06 (pseudonimy, opisy umiejętności) — obie o materiale
z gry. Tu ta sama reguła zawodzi na samej dokumentacji. Dowód porównawczy jest
tańszy niż wywód: `CHANGELOG.md` ma test (`tests/changelog.test.ts`) i nie
zdążył się rozjechać ani razu; trzy spisy bez testu rozjechały się wszystkie.

**Czego ta pozycja NIE rozstrzyga.** Czy tabelę `§0` uzupełnić, czy skasować.
`§G` tego samego pliku nosi od 2026‑08‑02 wniosek „tabela ze statusem cudzej
pozycji jest długiem — docelowo zostawić same odsyłacze", opisany tam jako
najtańsza otwarta robota w `docs/` i nadal niewykonany. `§0` jest tą samą
konstrukcją o pięć razy większej skali, więc obie drogi prowadzą w przeciwne
strony i **żadnej nie wolno wybrać mimochodem**. Sekcja `N` rejestru celowo nie
dokłada do `§0` własnych wierszy.

**Co da się zrobić niezależnie od tej decyzji:** strażnik na `docs/specy/README.md`
po wzorze `tests/fixtury.ts` — `readdirSync` odkrywa pliki, tabela musi je
wymieniać. Pliki odkrywane, nie wpisywane, inaczej strażnik zestarzeje się tak
samo jak spis.
