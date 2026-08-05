# Zacznij tutaj

Punkt wejścia do katalogu `docs/` — dla człowieka, który wraca po miesiącu, i dla
modelu, który widzi to repo pierwszy raz. Odpowiada na trzy pytania: **co to
jest**, **gdzie czego szukać** i **jak się tu pracuje**.

Czego tu NIE ma: liczb, statusów i list usterek. Wszystko, co się zmienia,
mieszka w plikach niżej — ten ma zostać aktualny przez rok. Jeśli znajdziesz tu
konkretną liczbę, to znaczy, że ktoś ją tu wstawił wbrew tej zasadzie.

> Ten katalog nazywał się do 2026‑08‑01 `ai/`. Odsyłacze z tamtą nazwą pochodzą
> sprzed przeniesienia — treść jest ta sama, ścieżka inna.

---

## Co to jest

Licznik obrażeń do przeglądarkowej gry [Margonem](https://www.margonem.pl/) —
userscript rysujący panel ze statystykami nad grą. To, czym dla WoW‑a są SKADA
i Details!, tyle że Margonem jest turowy.

Dodatek **czyta i nic poza tym**: nie wysyła zapytań, nie zmienia przebiegu
walki, nie automatyzuje niczego. Źródłem danych jest **protokół silnika** —
ładunek, który serwer i tak przysyła do okna walki.

⚠️ Zdanie „nie dotyka stanu gry" stało tu do 2026‑08‑04 i przestało być
prawdziwe: owinięcie `Engine.battle.update` jest dotknięciem. Co dodatek nadal
gwarantuje i czym to jest zabezpieczone — `AGENTS.md`.

Potok w jednym zdaniu:

```
Engine.battle.update  →  protokol-source.ts → komunikaty `t.m` + skład
                      →  protokol.ts        → BattleEvent[]  (rozbiór klucz po kluczu)
                      →  slownik-gry.ts     → brzmienia efektów z `window._t`
                      →  stats.ts           → BattleStats  (agregacja, rozbicia, instancje)
                      →  session.ts         → która walka jest TĄ
                      →  overlay.ts         → panel w Shadow DOM
```

⚠️ **Stała tu droga przez DOM** (`source.ts` → `parser.ts`) i zeszła z drzewa
2026‑08‑04. Protokół niesie `id` po obu stronach każdego zdarzenia, żywioł jako
klucz zamiast klasy CSS i rozbite składniki redukcji; tekst był rekonstrukcją
tego wszystkiego ze zdań. Powody i koszt: `AGENTS.md` oraz `docs/specy/`.

Poboczne: `recorder.ts` + `archive.ts` (nagrywanie i odtwarzanie walk),
`zrzut.ts` + `opcje.ts` (zbieranie surowego materiału z gry i okno ustawień
z trybem deweloperskim), `roster.ts` (skład z `Engine.battle`), `palette.ts`
(barwy), `window.ts` (geometria okna), `stored-state.ts` (stan z `localStorage`),
`confirm.ts` (pytanie „na pewno?" z wygasaniem, wspólne dla panelu i archiwum),
`version.ts` (numer wersji dla wnętrza bundle'a), `style.ts` (arkusz obu okien:
tokeny → prymitywy wspólne → panel → archiwum).

```bash
bun install
bun run check     # typecheck + testy + build  ← to jest brama
bun test          # same testy
```

---

## Gdzie czego szukać

Czytaj **wybiórczo**. Te pliki mają razem kilka tysięcy linii i nikt nie czyta
ich w całości — każdy odpowiada na inne pytanie.

| Plik | Odpowiada na pytanie | Kiedy tu zajrzeć |
|---|---|---|
| [`MECHANIKA.md`](MECHANIKA.md) | **Jak zachowuje się GRA — i skąd to wiadomo?** Procedura sprawdzania oficjalnej pomocy plus rejestr odpowiedzi z dosłownymi cytatami (albo jawnym „nie znaleziono”). | Zanim napiszesz JAKIEKOLWIEK zdanie o zachowaniu gry, także negatywne |
| [`DECYZJE.md`](DECYZJE.md) | **Dlaczego kod wygląda tak, jak wygląda?** Czego log NIE mówi i co z tego wynika. Sekcje o truciźnie bez sprawcy, leczeniu bez leczącego, duplikatach nazw, kolorach, „na turę". | Zawsze, zanim zmienisz cokolwiek w `protokol.ts` albo `stats.ts` |
| [`AUDYT.md`](AUDYT.md) | **Co jest zepsute i co już naprawiono?** Rejestr z ID (`AUDYT‑N`), wagą, kosztem i — przy naprawionych — opisem, co konkretnie zrobiono. | Zanim zgłosisz „znalazłem błąd" — sprawdź, czy nie jest już zapisany albo świadomie odrzucony |
| [`SOLID.md`](SOLID.md) | **Gdzie jest dług i czego nie widzą testy?** Usterki `§4.*`, architektura `§8`, martwy kod `§9`, luki zestawu `§10`. | Przy refaktorze i przy pytaniu „czy to jest pokryte?" |
| [`UX.md`](UX.md) | **Jak panel ma się zachowywać?** Spec gestów i zasad, z ✅ (jest) i 🎯 (postulat). | Przy każdej zmianie w `overlay.ts` |
| [`UX-POPRAWKI.md`](UX-POPRAWKI.md) | **Co poprawić w panelu?** Lista `A*` (usterki) i `B*` (wygody). | Gdy szukasz roboty o dobrym zwrocie |
| [`ROADMAP.md`](ROADMAP.md) | **Co jest zrobione, co wstrzymane — i co jest KIERUNKIEM teraz?** Od 2026‑08‑03 pierwsza sekcja mówi, na czym skupia się praca i co się do tego liczy. | Gdy pytasz „czy ta funkcja w ogóle miała powstać?" — i zanim zaproponujesz nową |
| [`TOOLING.md`](TOOLING.md) | **Jak to się buduje i trafia do użytkownika?** `@match`, wersjonowanie, CI. | Przy `build.ts`, `tools/`, wydaniu |
| [`WYDANIE.md`](WYDANIE.md) | **Jak wypuścić nową wersję — i pod jakim numerem?** SemVer w tym repo (dlaczego `0.4.1` nie powstaje), trzy kroki człowieka, reszta na tagu; co robią dwaj strażnicy i co się przy wydaniu psuje CICHO. | Przy wydaniu, przy pytaniu „który numer" i gdy strażnik `wydanie` zapali bramę |
| [`specy/`](specy/) | **Jak rozumowaliśmy przy TEJ zmianie?** Jeden plik na rundę pracy — problem, wybrane rozwiązanie i **odrzucone warianty**. Reszta tej tabeli to rejestry per temat; to jest oś prostopadła. | Zanim zaprojektujesz większą zmianę — i zaraz po tym, jak ją zaprojektujesz |
| [`screenshots/`](screenshots/) | Obrazki do `README.md` w korzeniu, z konwencją nazw i listą rzeczy, o których trzeba pamiętać przy robieniu zrzutu. | Gdy zrzuty w README przestały pokazywać panel takim, jaki jest |

Poza `docs/`: **materiał testowy powstaje W KODZIE.** Pliki danych obok testów
zeszły z drzewa 2026‑08‑04 w całości. Co jest zamiast:

- [`tests/zdarzenia.ts`](../tests/zdarzenia.ts) — pojedyncze `BattleEvent`
  budowane wprost, do testów opisujących jeden kształt;
- [`tests/korpus.ts`](../tests/korpus.ts) — walki, po których chodzą
  NIEZMIENNIKI: pięć z generatora ([`tools/synthetic-log.ts`](../tools/synthetic-log.ts))
  plus jedna ręczna z kształtami, których generator nie produkuje;
- [`tests/walka-z-gry.ts`](../tests/walka-z-gry.ts) — **jedyny materiał
  nie‑syntetyczny**: 18 komunikatów i skład z prawdziwego zrzutu
  `Engine.battle.update`. Karmi testy archiwum, `index` i podglądy w `dist/`;
- [`tests/klucze-protokolu.ts`](../tests/klucze-protokolu.ts) — 233 klucze
  renderera z assetu klienta, WYGENEROWANE przez `bun tools/slownik.ts --zamroz`.
  Plik nosi to w pierwszej linii: nie edytuje się go ręcznie.

⚠️ **Co to odebrało.** Kształt, o którym nie pomyśleliśmy, nie ma jak wpaść do
materiału, który sami budujemy — a 25 prawdziwych walk łapało je samo z siebie.
Zestaw zszedł z 914 do 557 testów. Największe pozycje: przekrój po typie obrażeń
w walce grupowej, blok u celu / super‑kryt / osłabienie DoT‑a z liczbami
odtwarzalnymi ręcznie oraz 61 testów panelu. Każde miejsce ma ⚠️ z liczbami.

✅ **Część wróciła tego samego dnia**, gdy tabela kluczy dostała miejsce
w kodzie: zgodność zaszytych identyfikatorów `_t` z assetem gry i dwustronne
pokrycie tabeli ról przeciw 233 kluczom (569 testów).

✅ **Druga część wróciła 2026‑08‑05**: `tests/fixtures/*.json` niesie znów
SUROWY protokół, a niezmienniki odkrywają pliki same (`tests/fixtury.ts`).
Zrzut robi albo sam dodatek (zębatka → tryb deweloperski → „Zrzut walki”), albo
`tools/walka-probe.js` w konsoli; `bun tools/walka.ts --zachowaj … --nazwa <slug>`
zapisuje fixture, `--rozbij` robi z niego moduł w `tests/`. ⚠️ Prawdziwa walka
jest w korpusie **jedna**, nie dwadzieścia pięć — skala nie wróciła.

---

## Źródła poza repo — i czego wśród nich NIE ma

**Wiedza o FORMACIE LOGU pochodzi w tym projekcie wyłącznie z pomiaru na
korpusie.** Gra nie ma opisu tego formatu i nie należy zakładać, że gdzieś taki
opis istnieje.

⚠️ **To zdanie brzmiało do 2026‑08‑01 szerzej — „wiedza o grze pochodzi
w przeważającej części z POMIARU, a nie z dokumentacji” — i było przez to
szkodliwe.** O formacie logu jest prawdziwe; o MECHANICE nie. Gra ma
dokumentację mechaniki walk na **399 tys. znaków**, z wzorami na unik i blok,
kolejnością redukcji obrażeń i opisem każdego zdarzenia — a repo dwa razy
zapisało, że „pomoc milczy” w sprawach, które ta dokumentacja rozstrzyga wprost.
Procedura, żeby to się nie powtórzyło: [`MECHANIKA.md`](MECHANIKA.md).

| Dokąd | Po co |
|---|---|
| [margonem.pl](https://www.margonem.pl/) | Sama gra. Dodatek startuje na światach `*.margonem.pl` i `*.margonem.com` — listę wraz z wykluczeniami trzyma [`tools/userscript-meta.ts`](../tools/userscript-meta.ts) |
| [**Mechanika walk**](https://pomoc.margonem.pl/index/view,372) | **Pełna specyfikacja mechaniki na ~399 tys. znaków** — nie skrót. System walki, system tur, statystyki postaci i NPC, efekty umiejętności, atrakcje; wzory (`evade`, `block`, `crit gain`), kolejność redukcji obrażeń, opis każdego zdarzenia z nazwą silnikową. Czytaj sondą `tools/pomoc.ts`, nie streszczeniem — dlaczego, mówi [`MECHANIKA.md`](MECHANIKA.md) |
| [pomoc.margonem.pl](https://pomoc.margonem.pl/) | Reszta oficjalnej pomocy. `view,3` odsyła całą walkę do artykułu wyżej, `view,183` (Słowniczek) nie zna ani uniku, ani bloku — sprawdzone 2026‑08‑01. Reszty nie przeglądaliśmy; znajdziesz coś, dopisz **razem z cytatem** |
| [grooove.pl/battle](https://grooove.pl/battle/) | Publiczne zrzuty walk graczy w postaci **surowego protokołu silnika**. Filtr `?w=<świat>`, pojedyncza walka pod `/battle/id,<ID>`. ⚠️ Repo miało z tego korpus 12 walk i narzędzie `tools/grooove.ts` — oba zeszły z drzewa 2026‑08‑04. Uwaga przy ewentualnym powrocie: protokół jest tam PRZEKODOWANY (kropka zamiast `=`), a tekst składa WŁASNY renderer serwisu i jest do tyłu za grą |
| [tampermonkey.net](https://www.tampermonkey.net/) | Rozszerzenie, które uruchamia zbudowany `dist/margometer.user.js` |
| [bun.sh](https://bun.sh/) | Cały toolchain: runtime, testy, bundler |

**Nie dopisuj tu linków „z pamięci".** Adres artykułu pomocy, którego nie
otworzyłeś, jest w tym repo gorszy niż jego brak — dokumentacja ma być
sprawdzalna, a zmyślony odsyłacz wygląda dokładnie jak prawdziwy.

**Co pomoc rozstrzyga, a czego w niej nie ma — w [`MECHANIKA.md`](MECHANIKA.md),
nie tutaj.** Ten plik ma zostać aktualny przez rok, a tamta lista rośnie.

Stał tu wcześniej akapit „Czego «Mechanika walk» NIE rozstrzyga” z datą
i adnotacją „żeby nikt nie szukał drugi raz”. **Był nieprawdziwy** — twierdził,
że artykuł nie mówi nic o granularności uniku ani o broni pomocniczej, a mówi
o obu wprost. Powstał z jednego zapytania narzędziem, które streszcza. Zapis
o tym, jak to się stało, jest w `MECHANIKA.md`; zostawiam tu samo ostrzeżenie,
bo to jedyny znany nam sposób, w jaki ten plik potrafi skłamać.

### Skąd brać wiedzę, której tu nie ma

Pięć dróg; cztery pierwsze były już używane, piąta powstała 2026‑08‑03 razem
z korpusem, do którego odsyła. **Kolejność nie jest przypadkowa: najpierw
sprawdź, czy odpowiedź jest już napisana, a dopiero potem ją mierz.**

0. **Oficjalna pomoc gry.** `bun tools/pomoc.ts "Blok ( blok )"` — sonda po
   pełnym tekście artykułu „Mechanika walk”. Procedura, rejestr odpowiedzi
   i powód, dla którego NIE robi się tego `WebFetch`-em: [`MECHANIKA.md`](MECHANIKA.md).
   Ta droga została dopisana 2026‑08‑01 i jest tu zerowa, bo przez rok była
   pomijana — a odpowiadała na pytania, które mierzyliśmy z korpusu.
1. **Nowy zrzut walki — dwie drogi, jeden kształt pliku.**
   - **Z dodatku:** zębatka → „Tryb deweloperski" → „Zrzut walki". Nie wymaga
     niczego przed walką (tryb raz włączony zostaje) i nie owija
     `Engine.battle.update` drugi raz. Zbiera całą sesję, więc przy kilku
     walkach `--rozbij`/`--zachowaj` żądają `--walka <n>`.
   - **Sondą:** [`tools/walka-probe.js`](../tools/walka-probe.js) wklejony do
     konsoli PRZED walką. Zostaje i ma zostać — działa bez instalowania dodatku
     i jest jedyną drogą, gdy podejrzenie pada na sam dodatek.

   Potem `bun tools/walka.ts --zachowaj <plik> --nazwa <slug>` zapisze fixture
   w `tests/fixtures/` (surowy protokół z migawkami `hp.max` — po nim chodzą
   niezmienniki), a `--rozbij <plik> --nazwa <slug>` zapisze
   `tests/walka-<slug>.ts` — moduł z komunikatami, składem i nagłówkiem,
   w którym trzy pola opisu czekają na wypełnienie przez człowieka.

   ⚠️ **Stało tu co innego do 2026‑08‑04**: „nowy fixture ma mieć DWA pliki —
   `raw.txt` (tekst z «Kopiuj logi») i `log.html` (zrzut DOM, bo żywioł siedzi
   wyłącznie w klasie CSS)". Obu formatów nie ma już w repo i nie ma czym ich
   przeczytać; żywioł przychodzi dziś kluczem protokołu. Ten akapit nosił
   wcześniej dwa sprostowania (2026‑08‑02, 2026‑08‑03) o tym, ILE fixture'ów ma
   oba pliki — pytanie zniknęło razem z plikami.
2. **Sonda w konsoli gry.** [`tools/engine-probe.js`](../tools/engine-probe.js)
   — wkleja się do konsoli na karcie z grą i pokazuje, co naprawdę siedzi
   w `Engine.battle`. Tak ustalono, że stan klienta **nie** niesie źródła
   efektów (`buffs` to licznik, nie lista ze sprawcą), więc trucizny nie da się
   przypisać nawet z pominięciem logu. Sonda niczego nie zakłada o kształcie
   obiektu — najpierw go wypisuje.
3. **Przelot po materiale.** `bun -e '…'` z importem `aggregate` i pętlą po
   `tests/korpus.ts`. To najtańszy sposób odpowiedzi
   na „ile razy w ogóle występuje X" — i standardowy krok przed każdym
   twierdzeniem o zachowaniu gry. ⚠️ Pętla chodziła do 2026‑08‑04 po `raw.txt`
   i przepuszczała go przez `parse`; dziś korpus jest już ODCZYTANY, więc
   przelot mierzy zdarzenia, a nie rozpoznawanie linii.
4. ~~**Korpus protokołu z grooove.pl.**~~ — **zszedł z drzewa 2026‑08‑04**
   razem z całym `tests/fixtures/` i narzędziem `tools/grooove.ts`. Odpowiadał
   na pytanie „czy gra to w ogóle emituje i jak często" na 12 publicznych
   walkach, a jego klucze były w dużej części nazwami silnikowymi używanymi
   przez pomoc gry (`legbon_facade` → „Fasada opieki ( facade )") — czyli
   prowadziła z niego krótka droga z powrotem do punktu 0.

   Dziś tej odpowiedzi nie ma skąd wziąć bez ponownego pobrania. Zostaje
   punkt 0 (pomoc) i zrzut z gry (punkt 1).

---

## Zasady, które nie wynikają z kodu

To są rzeczy, o które łatwo się potknąć, bo wyglądają jak brak, a są decyzją.

**Nie udawaj danych, których log nie ma.** Log nie mówi, kto nałożył truciznę
ani kto leczył. Wolno pokazać „nie wiadomo"; nie wolno zgadnąć i pokazać nazwiska.
Cała sekcja o tym jest w `DECYZJE.md` — łącznie z tym, które piętra wnioskowania
zostały świadomie odrzucone i dlaczego. Zanim „naprawisz" brakującą atrybucję,
przeczytaj ją.

**Nieznane ma być głośne.** Klucz protokołu, którego dekoder nie zna, trafia do
`{kind: "unknown"}` i zapala ostrzeżenie w panelu. Tabela ról w `protokol.ts`
jest wąska CELOWO — szeroka połknie kiedyś klucz niosący liczbę i zrobi to po
cichu. To już się zdarzyło kilka razy po stronie odczytu ze zdań, gdzie jeden
szeroki wzorzec połykał całe klasy linii; każdy przypadek ma swoje ID
w `AUDYT.md` i reguła przeszła na dekoder razem z odczytem.

**Materiał z gry jest dowodem.** ⚠️ Zdanie mówiło kiedyś o katalogu ze zrzutami,
skasowanym 2026‑08‑04 — **katalog wrócił 2026‑08‑05** i reguła dotyczy dziś
znów jego: `tests/fixtures/*.json` niesie surowy protokół tak, jak przysłał go
serwer. Obok stoją `tests/walka-z-gry.ts` (kopia jednego z fixture'ów, związana
z oryginałem testem) i `tests/klucze-protokolu.ts` (odczyt assetu gry) —
twierdzenia o zachowaniu gry wolno opierać na nich.
Wszystko inne w testach produkujemy sami i dowodem NIE JEST. Materiału z gry nie
edytuje się ręcznie, żeby test przeszedł — a tabeli kluczy nie edytuje się
w ogóle: jest wygenerowana i mówi to w pierwszej linii.

**Komentarz mówi DLACZEGO, nie CO.** Kod jest gęsto komentowany i to jest
zamierzone — komentarze niosą powody decyzji, odrzucone warianty i pomiary.
Komentarz powtarzający kod jest tu błędem, tak samo jak jego brak nad
nieoczywistą decyzją.

**Kompilator zastępuje lintera.** Nie ma ESLinta. `noUnusedLocals`
i `noUnusedParameters` są włączone właśnie po to, żeby martwy kod był błędem
kompilacji. Nie wyłączaj ich, żeby coś przeszło.

**Polski wszędzie** — komentarze, testy, dokumentacja, komunikaty commitów.

---

## Jak się tu pracuje

Wzorzec z poprzednich rund. Nie jest obowiązkowy, ale to on daje w tym repo
dobre wyniki.

**0. Zanim zmierzysz, sprawdź, czy nie jest opisane.** Dotyczy wyłącznie zdań
o zachowaniu GRY (nie naszego kodu) — te idą przez procedurę z
[`MECHANIKA.md`](MECHANIKA.md). Pomiar na korpusie odpowiada, co log POKAZUJE;
pomoc gry — co gra ZAMIERZA. Rachunek z 20 obserwacji, dla którego istnieje
zdanie w specyfikacji, jest słabszym dowodem tego samego.

**1. Zmierz, zanim powiesz.** Twierdzenie „X jest zepsute" bez odtworzonego
scenariusza jest w tym repo bezwartościowe — kilka „usterek" okazało się
nieporozumieniem, a kilka „drobiazgów" miało cztery rzędy wielkości. Napisz
sondę (`bun -e '…'` po korpusie), zmierz i dopiero wtedy pisz. Wpisy w `AUDYT.md`
mają przy sobie znacznik ✓, gdy teza została **zreprodukowana albo zmierzona**.

**2. Sprawdź, czy to nie jest już rozstrzygnięte.** `AUDYT.md` ma wpisy odrzucone
(`AUDYT‑7`) i wstrzymane decyzją, a `UX.md §6` ma listę rzeczy, których świadomie
NIE robimy (brak skrótów klawiszowych, brak trzeciego rzędu zakładek, brak
modali). Zderz pomysł z nimi, zanim go wdrożysz.

**3. Test ma móc paść.** Zdarzyły się tu testy zielone i puste — asertujące
zdania prawdziwe niezależnie od kodu. Po napisaniu testu na naprawę **zepsuj
naprawę i sprawdź, że test się zapala**. Jeśli się nie zapala, testujesz coś
innego, niż myślisz.

**4. Niezmienniki > pojedyncze asercje.** Najmocniejsze testy w tym repo lecą
po CAŁYM korpusie i sprawdzają własność, a nie liczbę: „każda linia rozpoznana",
„rozbicia sumują się do skalarów", „HTML daje to samo co tekst", „żadna nazwa
z gry nie koliduje z etykietą, którą wymyśliliśmy". Nowa reguła najlepiej wchodzi
jako kolejny taki przelot.

**5. Przegląd PRZED commitem, nie po.** Ostatni audyt znalazł jedenaście rzeczy,
z czego **pięć było regresjami rundy, która właśnie czekała na commit**. Duży
zestaw zmian wart jest osobnego przejścia po sobie samym, zanim wjedzie do
historii.

**6. Duże zmiany rozbijaj na commity, ale sprawdzaj każdy.** Przy rozbijaniu
buduj każdy stan od tego samego punktu wyjścia (`git checkout <baza> -- .`
plus łatka tematu), a nie doklejaj do poprzedniego — inaczej przesunięcia hunków
kumulują się i po cichu psują treść. Każdy commit ma przechodzić `bun run check`
osobno.

**7. Dokumentacja starzeje się szybciej niż kod.** `SOLID.md §10` i `TOOLING.md`
opisywały kiedyś stan sprzed dwóch rund i były przy tym cytowane jako lista
zadań — z pozycjami 🔴, które od dawna były zrobione. Jeśli opierasz decyzję na
zdaniu z `docs/`, **sprawdź je w kodzie**. Jeśli się rozjechało, popraw dokument
w tej samej rundzie.

---

## Pułapki, na które się tu wpada

- **`overlay.ts` jest ogromny** i robi wiele rzeczy naraz. `SOLID.md §8` ma
  gotowy podział na pliki wraz z tym, co do którego trafia — zajrzyj tam, zanim
  wymyślisz własny.
- **Arkusz CSS OBU okien siedzi w szablonie literałowym** w `src/style.ts`
  (od 2026‑08‑02; wcześniej w `overlay.ts`, a archiwum miało własny). Backtick
  w komentarzu CSS **zamyka literał** i wywala kompilację w miejscu, które
  wygląda na niezwiązane. Nie pisz `` `foo` `` w komentarzach wewnątrz arkusza —
  ta pułapka złapała nas przy okazji ostatnio.
- **Wartość, która pada w arkuszu drugi raz, ma być tokenem.** Nie jako zasada
  estetyczna: druga kopia rozjeżdża się z pierwszą i nikt tego nie zauważa —
  tak panel i archiwum doszły do dwóch różnych kryć tego samego tła.
- **Panel przerysowuje się przy każdej linii logu.** Węzły nie przeżywają
  renderu, więc zdarzenia idą przez delegację po `data-action` / `data-actor` /
  `data-source`, a nie przez listenery na węzłach. Nowy przycisk musi wejść w ten
  sam wzorzec, inaczej gubi kliknięcia.
- **Etykiety bywają sklejane** (`Napastnik · Umiejętność`), ale nigdy nie są
  rozbierane z powrotem — drążenie idzie strukturą dwuszczeblową. Nie próbuj
  parsować etykiety, żeby wyciągnąć z niej nazwę.
- **Nazwy, które WYMYŚLAMY** (`Bez sprawcy`, `Zwykły atak`, `Regeneracja`,
  nazwy rodzin obrażeń, `Nazwa #1`) dzielą przestrzeń nazw z tym, co przychodzi
  z gry. Pilnuje tego test kolizji w `stats.test.ts`; dokładając kolejną etykietę,
  dopisz ją tam.
- **`bun run check` jest bramą.** Build też — bo to on składa userscript, a błąd
  w nim nie wychodzi z samych testów.

---

## Co jest teraz otwarte

Nie przepisuję tu listy, bo zdezaktualizuje się w tydzień. Aktualny stan:

- **`AUDYT.md`** — tabela na górze pliku; przekreślone ID są zamknięte.
- **`SOLID.md §11`** — kolejność prac wg wpływu na liczby.
- **`UX-POPRAWKI.md §0`** — skrót z kosztami.
- **`ROADMAP.md`** — co wstrzymane i dlaczego.

Rzeczy **zablokowane decyzją, nie robotą**, są w tych plikach oznaczone wprost —
jeśli trafisz na taką, potrzebna jest rozmowa z właścicielem repo, a nie kod.
