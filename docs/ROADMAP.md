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

**Czego brakuje do domknięcia:** zrzutu z gry z kluczem `heal_target`. Jedyna
prawdziwa walka w repo ma sam `heal=99`, więc atrybucja stoi dziś na odczycie
renderera, a nie na materiale.

## Tura z autorytatywnego sygnału — `data.current`

Znalezione przy naprawie licznika tur 2026‑08‑05, **nie zrobione**. Licznik jest
dziś WNIOSKIEM ze strumienia komunikatów („akcja = tura”) i z tego powodu myli
się w obie strony: nie widzi tur bez akcji (ogłuszenie) i liczy podwójnie
dodatkowe ataki z `add_attacks`. Powody i pomiary:
[`specy/2026-08-05-tura-to-akcja.md`](specy/2026-08-05-tura-to-akcja.md).

Sygnał autorytatywny **jest w ładunku, który już przechwytujemy**: `data.current`
niesie `id` postaci, której gra przyznaje turę (`Battle.js:444,450` →
`self.newTurn(data.current)`). Co go dziś blokuje:

- **W jedynym zrzucie cała walka (18 komunikatów) przyszła w JEDNYM wywołaniu
  `update`** — to była walka automatyczna, którą silnik liczy sekwencyjnie
  i oddaje w całości. Dla takiej walki `current` nie rozstrzyga ani jednej linii.
- `recorder.ts` zapisuje wyłącznie komunikaty, więc dopięcie `current` zmienia
  FORMAT nagrań — czyli powtarza „nagrania sprzed tej wersji przepadają”.

**Czego brakuje do domknięcia:** zrzutu z walki TUROWEJ (PvP albo ręcznej z NPC),
w której porcje przychodzą osobno — dopiero on pokaże, ile `current` naprawdę
pokrywa i czy warto za to płacić formatem nagrań.

## Leczenie, które nie liczy się do niczego — `bandage` i `vamp_time`

Znalezione przy okazji 2026‑08‑05, **nie zrobione**. Oba klucze stoją w tabeli
`PROCE` (`src/protokol.ts`), czyli „gra wypisuje zdanie, ale my nie liczymy
z niego niczego" — a oba niosą leczenie **w punktach życia**:

- `bandage` → „Uleczono %name% o %val% punktów życia.” Renderer:
  `'%val%': a[0]`, `'%name%': f1.name` (`BattleMessages.js:378‑392`), czyli
  kwota w punktach na pierwszej stronie komunikatu.
- `vamp_time` → „+Uleczono za %val% punktów życia” (`BattleMessages.js:1018‑1039`).

To NIE jest „bez sprawcy” — sprawca jest znany (to `f1`). To leczenie, które
w panelu **nie istnieje wcale**: nie wchodzi ani do `healingReceived`, ani do
puli nieprzypisanej, więc nie zostawia po sobie nawet przypisu. Kwalifikuje się
do kierunku „jakość danych” wprost: panel pokazuje złą liczbę i nie mówi o tym
ani słowem.

Czego brakuje: zrzutu z walki, w której któryś z tych kluczy pada — bez niego
byłoby to przeniesienie do ról na podstawie samego brzmienia. Docstring `PROCE`
ostrzega przed dokładnie tym („czyta się to «nie udowodniono, że niesie liczbę,
którą liczymy», a nie «na pewno nie niesie»”).

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
pliku i został odrzucony.

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

  **Czego ta para nie ma:** bloku, uniku, absorpcji, zapowiedzi umiejętności.
  To jest lista zakupowa na następny zrzut. (Stało tu jeszcze „ani `log.html`" —
  bezprzedmiotowe od 2026‑08‑04, sonda nie zbiera już węzłów renderu.)

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
  — i to ono złapało jedyny prawdziwy błąd dekodera (leczenie przypisywane
  sobie). Razem z parserem tekstu zniknęła druga strona porównania; skasowanie
  było świadomą decyzją, nie przeoczeniem.

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
