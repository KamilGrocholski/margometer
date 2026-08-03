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

Dodatek **czyta okno walki i nic więcej**: nie wysyła zapytań, nie dotyka stanu
gry, nie automatyzuje niczego. Całe źródło danych to tekst, który gracz i tak ma
na ekranie.

Potok w jednym zdaniu:

```
okno walki (DOM)  →  source.ts   → tekst z żywiołami z klas CSS
                  →  parser.ts   → BattleEvent[]  (maszyna stanów, linia po linii)
                  →  stats.ts    → BattleStats    (agregacja, rozbicia, instancje)
                  →  session.ts  → podział bufora na walki; która z nich jest TĄ
                  →  overlay.ts  → panel w Shadow DOM
```

Poboczne: `recorder.ts` + `archive.ts` (nagrywanie i odtwarzanie walk),
`roster.ts` (skład z `Engine.battle`, gdy log go nie podaje), `palette.ts`
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
| [`DECYZJE.md`](DECYZJE.md) | **Dlaczego kod wygląda tak, jak wygląda?** Czego log NIE mówi i co z tego wynika. Sekcje o truciźnie bez sprawcy, leczeniu bez leczącego, duplikatach nazw, kolorach, „na turę". | Zawsze, zanim zmienisz cokolwiek w `parser.ts` albo `stats.ts` |
| [`AUDYT.md`](AUDYT.md) | **Co jest zepsute i co już naprawiono?** Rejestr z ID (`AUDYT‑N`), wagą, kosztem i — przy naprawionych — opisem, co konkretnie zrobiono. | Zanim zgłosisz „znalazłem błąd" — sprawdź, czy nie jest już zapisany albo świadomie odrzucony |
| [`SOLID.md`](SOLID.md) | **Gdzie jest dług i czego nie widzą testy?** Usterki `§4.*`, architektura `§8`, martwy kod `§9`, luki zestawu `§10`. | Przy refaktorze i przy pytaniu „czy to jest pokryte?" |
| [`UX.md`](UX.md) | **Jak panel ma się zachowywać?** Spec gestów i zasad, z ✅ (jest) i 🎯 (postulat). | Przy każdej zmianie w `overlay.ts` |
| [`UX-POPRAWKI.md`](UX-POPRAWKI.md) | **Co poprawić w panelu?** Lista `A*` (usterki) i `B*` (wygody). | Gdy szukasz roboty o dobrym zwrocie |
| [`ROADMAP.md`](ROADMAP.md) | **Co jest zrobione, co wstrzymane — i co jest KIERUNKIEM teraz?** Od 2026‑08‑03 pierwsza sekcja mówi, na czym skupia się praca i co się do tego liczy. | Gdy pytasz „czy ta funkcja w ogóle miała powstać?" — i zanim zaproponujesz nową |
| [`TOOLING.md`](TOOLING.md) | **Jak to się buduje i trafia do użytkownika?** `@match`, wersjonowanie, CI. | Przy `build.ts`, `tools/`, wydaniu |
| [`WYDANIE.md`](WYDANIE.md) | **Jak wypuścić nową wersję?** Trzy kroki człowieka, reszta na tagu; co robią dwaj strażnicy i co się przy wydaniu psuje CICHO. | Przy wydaniu i gdy strażnik `wydanie` zapali bramę |
| [`specy/`](specy/) | **Jak rozumowaliśmy przy TEJ zmianie?** Jeden plik na rundę pracy — problem, wybrane rozwiązanie i **odrzucone warianty**. Reszta tej tabeli to rejestry per temat; to jest oś prostopadła. | Zanim zaprojektujesz większą zmianę — i zaraz po tym, jak ją zaprojektujesz |
| [`screenshots/`](screenshots/) | Obrazki do `README.md` w korzeniu, z konwencją nazw i listą rzeczy, o których trzeba pamiętać przy robieniu zrzutu. | Gdy zrzuty w README przestały pokazywać panel takim, jaki jest |

Poza `docs/`: **[`tests/fixtures/`](../tests/fixtures/new-engine/)** — przy każdym
zrzucie walki stoi `meta.json` z opisem, co ten fixture pokrywa (`covers`), czego
w nim nie ma (`missing`) i co było w nim trudnego (`notes`). To najszybsza droga
do pytania „czy mam próbkę z X?".

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

Cztery drogi, wszystkie użyte w przeszłości. **Kolejność nie jest przypadkowa:
najpierw sprawdź, czy odpowiedź jest już napisana, a dopiero potem ją mierz.**

0. **Oficjalna pomoc gry.** `bun tools/pomoc.ts "Blok ( blok )"` — sonda po
   pełnym tekście artykułu „Mechanika walk”. Procedura, rejestr odpowiedzi
   i powód, dla którego NIE robi się tego `WebFetch`-em: [`MECHANIKA.md`](MECHANIKA.md).
   Ta droga została dopisana 2026‑08‑01 i jest tu zerowa, bo przez rok była
   pomijana — a odpowiadała na pytania, które mierzyliśmy z korpusu.
1. **Nowy zrzut walki.** W oknie walki jest przycisk „Kopiuj logi" (tekst) —
   a dla żywiołów potrzebny jest zrzut DOM‑u, bo żywioł siedzi WYŁĄCZNIE w klasie
   CSS (`dmgf`, `dmgc`, `dmgl`…) i w tekście go nie ma. Stąd **nowy fixture ma
   mieć dwa pliki**: `raw.txt` i `log.html`. Zrzut trafia do `tests/fixtures/`
   razem z `meta.json` i od razu wchodzi do wszystkich pętli testowych.

   ⚠️ To NORMA, nie opis stanu — stało tu „fixture'y mają dwa pliki" i brzmiało
   jak fakt (sprostowane 2026‑08‑02, przeliczone 2026‑08‑03). Policzone: na
   24 fixture'y **8 ma oba** pliki, 13 ma sam `raw.txt`, a **3 mają sam `log.html`**
   (`2026-07-18_lowca-dom-trucizna`, `_mag-dom`, `_mag-dom-fuzja`). Dla tych
   trzech test różnicowy „HTML daje to samo co tekst" przechodzi PUSTY —
   `parser.test.ts` ma w środku `if (raw === null) return;`. Zna to `SOLID §10`;
   tutaj stało zdanie odwrotne.
2. **Sonda w konsoli gry.** [`tools/engine-probe.js`](../tools/engine-probe.js)
   — wkleja się do konsoli na karcie z grą i pokazuje, co naprawdę siedzi
   w `Engine.battle`. Tak ustalono, że stan klienta **nie** niesie źródła
   efektów (`buffs` to licznik, nie lista ze sprawcą), więc trucizny nie da się
   przypisać nawet z pominięciem logu. Sonda niczego nie zakłada o kształcie
   obiektu — najpierw go wypisuje.
3. **Przelot po korpusie.** `bun -e '…'` z importem `parse`/`aggregate` i pętlą
   po `tests/fixtures/*/*/raw.txt`. To najtańszy sposób odpowiedzi na „ile razy
   w ogóle występuje X" — i standardowy krok przed każdym twierdzeniem
   o zachowaniu gry.

---

## Zasady, które nie wynikają z kodu

To są rzeczy, o które łatwo się potknąć, bo wyglądają jak brak, a są decyzją.

**Nie udawaj danych, których log nie ma.** Log nie mówi, kto nałożył truciznę
ani kto leczył. Wolno pokazać „nie wiadomo"; nie wolno zgadnąć i pokazać nazwiska.
Cała sekcja o tym jest w `DECYZJE.md` — łącznie z tym, które piętra wnioskowania
zostały świadomie odrzucone i dlaczego. Zanim „naprawisz" brakującą atrybucję,
przeczytaj ją.

**Nieznane ma być głośne.** Linia, której parser nie rozumie, trafia do
`{kind: "unknown"}` i zapala ostrzeżenie w panelu. Wzorce w `RE_INFO` są wąskie
CELOWO — szeroki wzorzec połyka kiedyś linię niosącą liczbę i robi to po cichu.
To już się zdarzyło kilka razy; każdy przypadek ma swoje ID w `AUDYT.md`.

**Fixture jest dowodem.** Zrzuty w `tests/fixtures/` to nie „dane testowe", tylko
materiał dowodowy: twierdzenia o zachowaniu gry opierają się na nich i są w nich
policzone. Nowy fixture dostaje `meta.json`. Fixture'a się nie edytuje ręcznie,
żeby test przeszedł.

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
