# AGENTS.md

Licznik obrażeń do przeglądarkowej gry [Margonem](https://www.margonem.pl/) —
userscript rysujący panel ze statystykami nad grą. **Czyta i nic poza tym:
nie wysyła zapytań, nie zmienia przebiegu walki, nie automatyzuje niczego.**

Czyta **surowy protokół silnika** — przez owinięcie `Engine.battle.update`
(`protokol-source.ts`). To jest jedyna droga; okno walki w DOM zeszło z drzewa
2026‑08‑04 razem z odczytem ze zdań, bo protokół niesie `id` po obu stronach
każdego zdarzenia, żywioł jako klucz zamiast klasy CSS i rozbite składniki
redukcji, a tekst był rekonstrukcją tego wszystkiego ze zdań.

**Brzmienia bierze z gry, nie z własnego kodu.** `slownik-gry.ts` woła globalne
`window._t` — tę samą funkcję, którą renderer walki składa swoje zdania — więc
panel pokazuje `+Przebicie`, a nie klucz `+pierce`, i robi to w języku klienta,
także po aktualizacji gry. To ODCZYT, nie zapytanie: nic nie wychodzi na sieć,
a pytamy wyłącznie o identyfikatory zaszyte w `protokol.ts`, żeby chybienie
nigdy nie zaszło. Zgodności tej listy z assetem gry pilnuje zamrożona tabela
`tests/klucze-protokolu.ts` (233 klucze, build `1785244275300`) i cztery testy
wokół niej; odtwarza ją `bun tools/slownik.ts --zamroz`.

⚠️ **Tabela niesie klucze i identyfikatory, ale NIE brzmienia** (od
2026‑08‑06). Że gra dla identyfikatora zdanie ma, mówi `maZdanie: boolean`; jak
ono brzmi, mówi wyłącznie żywa gra. Powód jest licencyjny, nie techniczny —
`NOTICE.md`. Skutek uboczny wart zapamiętania: kopia cudzego tekstu leżała tam
przez trzy dni i **żaden test nigdy o nią nie zapytał**. Materiał, którego nikt
nie czyta, nie broni się sam tym, że pochodzi z gry.

⚠️ **Zdanie „nie dotyka stanu gry" stało tu do 2026‑08‑04 i przestało być
prawdziwe.** Owinięcie cudzej funkcji jest dotknięciem, choćby nic nie zmieniało
— i lepiej to napisać, niż bronić definicji słowa „dotyka". Co dodatek nadal
gwarantuje i czym to jest zabezpieczone w kodzie: oryginał leci pierwszy, jego
wynik wraca nietknięty, nasz wyjątek nie wychodzi do gry, a przy odpięciu
zdejmujemy wyłącznie SWOJĄ warstwę. Każde z tych czterech ma swój test
i sprawdzoną mutację. Powody i odrzucone warianty:
[`docs/specy/2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md`](docs/specy/2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md).

**Polski wszędzie** — komentarze, testy, dokumentacja, komunikaty commitów.

## Komendy

```bash
bun install
bun run check     # typecheck + testy + build  ← to jest brama, ma przechodzić
bun test          # same testy
bun run build     # → dist/margometer.user.js
```

Każdy commit ma przechodzić `bun run check` osobno, także przy rozbijaniu
większej zmiany na kilka.

## Układ

```
Engine.battle.update  →  protokol-source.ts → komunikaty `t.m` + skład
                      →  protokol.ts        → BattleEvent[]  (rozbiór klucz po kluczu)
                      →  slownik-gry.ts     → brzmienia efektów z `window._t`
                      →  stats.ts           → BattleStats  (agregacja, rozbicia, instancje)
                      →  session.ts         → pamięta ostatni odczyt
                      →  overlay.ts         → panel w Shadow DOM
```

⚠️ **`session.ts` stało tu jako „która walka jest TĄ" do 2026‑08‑07.** Kryterium
podziału (`splitFights`, po zdarzeniu `fight-start`) było martwe od 2026‑08‑04 —
dekoder takiego zdarzenia nie produkuje — i zeszło z drzewa razem z tym opisem
(`AUDYT‑108`). **Która walka jest TĄ, rozstrzyga dziś wyłącznie
`protokol-source.ts`**, odcinając bufor na `data.init`. To jest jeden warunek
bez drugiego świadka i tak ma być czytane.

`BattleEvent[]` (`types.ts`) jest KONTRAKTEM między źródłem a agregatem — i to
on przeżył wymianę odczytu. Nagrania trzymają surowe komunikaty, nie policzone
liczby, żeby dało się je przeliczyć nowszym dekoderem.

Poboczne: `recorder.ts` + `archive.ts` (nagrywanie i odtwarzanie),
`zrzut.ts` + `opcje.ts` (zbieranie materiału z gry i okno ustawień),
`roster.ts` (skład z `Engine.battle`), `palette.ts`, `window.ts`,
`stored-state.ts`, `confirm.ts` (pytanie „na pewno?" z wygasaniem),
`version.ts` (numer wersji w panelu i w skopiowanym JSON-ie),
`style.ts` (arkusz OBU okien — panelu i archiwum).

## Zanim napiszesz zdanie o tym, jak zachowuje się GRA

**Przejdź procedurę z [`docs/MECHANIKA.md`](docs/MECHANIKA.md).** Gra ma oficjalną
dokumentację mechaniki walk i jest w niej więcej, niż to repo zakładało — wzory
na unik i blok, kolejność redukcji obrażeń, opisy zdarzeń. Sonda:

```bash
bun tools/pomoc.ts "Blok ( blok )"
```

Dotyczy **tak samo zdań negatywnych**: „dokumentacja tego nie rozstrzyga” bez
przejścia procedury jest w tym repo już dwa razy zapisaną nieprawdą.

Test, czy to pytanie o mechanikę: **czy zdanie byłoby prawdziwe w cudzym repo
czytającym ten sam log?** Jeśli tak — to o grze, nie o nas.

## Konwencje kodu

- **Nie udawaj danych, których log nie ma.** Log nie mówi, kto nałożył truciznę
  ani kto leczył. Wolno pokazać „nie wiadomo”; nie wolno zgadnąć i pokazać
  nazwiska. Powody w `docs/DECYZJE.md`.
- **Nieznane ma być głośne.** Klucz protokołu, którego dekoder nie zna, trafia
  do `{kind: "unknown"}` i zapala ostrzeżenie w panelu. Tabela ról jest wąska
  CELOWO — szeroka połknie kiedyś klucz z liczbą i zrobi to po cichu.
- **Komentarz mówi DLACZEGO, nie CO.** Kod jest gęsto komentowany i to jest
  zamierzone: komentarze niosą powody decyzji, odrzucone warianty i pomiary.
- **Kompilator zastępuje lintera.** Nie ma ESLinta; `noUnusedLocals`
  i `noUnusedParameters` są włączone, żeby martwy kod był błędem kompilacji.
  Nie wyłączaj ich, żeby coś przeszło.

## Testy

- **Test ma móc paść.** Po napisaniu testu na naprawę **zepsuj naprawę
  i sprawdź, że test się zapala**. Zdarzyły się tu testy zielone i puste.
- **Niezmienniki > pojedyncze asercje.** Najmocniejsze testy lecą po CAŁYM
  korpusie i sprawdzają własność, nie liczbę: „każdy klucz rozpoznany”,
  „rozbicia sumują się do skalarów”.

  ⚠️ **Najmocniejszy z nich zniknął 2026‑08‑04.** Porównywał `dekoduj(protokół)`
  z odczytem tej samej walki DRUGĄ, rozłączną drogą — i to on złapał jedyny
  prawdziwy błąd dekodera. Razem z tamtym odczytem zniknęła druga strona
  porównania.

  ✅ **Częściowy świadek wrócił 2026‑08‑05** i stoi w `tests/fixtury.test.ts`.
  Protokół podaje procent życia celu, migawka wojownika niesie `hp.max`; te dwie
  liczby idą z różnych miejsc i nikt ich u nas nie uzgadnia, więc skumulowane
  obrażenia muszą trafić w podany procent. **Obejmuje tylko obrażenia** — cel,
  który padł, wypada z porównania, a uleczony wypada od chwili uleczenia
  (`AUDYT‑61`). Blok i absorpcja przez świadka **przechodzą**, bo `applied` to
  liczba PO redukcji; niesprawdzone są ich osobne składniki. Obrażenia ZADANE
  i rozbicia nadal świadka nie mają.

  ⚠️ **DRUGI FIXTURE POKAZAŁ, ŻE ŚWIADEK NIE ROŚNIE Z MATERIAŁEM** (2026‑08‑06).
  `grupa-vs-hildur` jest pięćdziesiąt razy większy od starszego pliku i robi
  **mniej porównań** — potwór leczy się niemal w każdej turze, a uleczony cel
  wypada z porównań od tej chwili. Liczby wypisuje test; nie cytuje się ich tutaj
  z tego samego powodu, co przy `702 → 718`. Wniosek zostaje: **szerokość kluczy
  i głębokość świadka to dwie różne rzeczy.** Zrzut, który ma wzmocnić świadka,
  musi być walką BEZ leczenia celu, a nie po prostu dłuższą.
- **Materiał z gry jest dowodem**, nie „danymi testowymi”. Pochodzenie (świat,
  build, daty, źródło) niesie **sam zrzut** w `tests/fixtures/`; opis tego, co
  pokrywa, czego w nim nie ma i co było trudne, stoi w `tests/fixtures/README.md`
  i **bez POLICZONYCH liczb** — te wypisuje `--pokaz`. ⚠️ Reguła brzmiała tu
  „bez liczb" i była za szeroka wobec własnego powodu (`AUDYT‑80`): README niesie
  `id` wojowników i daty, bo bez nich nie da się powiedzieć, co plik pokrywa.
  Zakaz dotyczy liczb, które maszyna umie policzyć z pliku — bo tylko one
  rozjeżdżają się po cichu. Nie edytuje się tego, żeby test
  przeszedł.

  ⚠️ Powód, dla którego pochodzenia się nie przepisuje: nagłówek
  `tests/walka-z-gry.ts` podawał build `1781609507010` — deweloperski, sześć
  tygodni starszy od walki — bo przy przenoszeniu materiału do kodu przepisywał
  go człowiek. Prawdziwy (`1785244275300`) potwierdzają dwa niezależne zapisy.
- **POLICZONE liczby nie wchodzą do plików danych; SUROWY materiał z gry —
  owszem.** Reguła brzmiała tu do 2026‑08‑05 szerzej („materiał testowy powstaje
  W KODZIE, nie w plikach danych") i była za szeroka wobec własnego powodu.
  Powodem skasowania `tests/fixtures/` 2026‑08‑04 był `zdarzenia.json`: 1,44 MB
  **wyjścia parsera, który właśnie zszedł z drzewa** — nie do zregenerowania,
  nie do sprawdzenia przeciw grze, z ewentualnym błędem tamtego parsera
  zamrożonym w środku. Surowy protokół nigdy nie był zarzutem; leżał w tym samym
  katalogu jako `protokol.json` i był chwalony.

  Gdzie dziś przebiega granica:
  - **Nasze liczby → do kodu.** `tests/zdarzenia.ts` (pojedyncze `BattleEvent`),
    `tests/korpus.ts` (walki z generatora plus jedna ręczna),
    `tests/klucze-protokolu.ts` (233 klucze renderera, WYGENEROWANE przez
    `bun tools/slownik.ts --zamroz`, nie pisane ręcznie).
  - ⛔ **BRZMIENIA GRY → NIGDZIE.** Trzecia kategoria, dopisana 2026‑08‑06.
    Klucz `+abdest` i identyfikator `msg_+abdest %val%` to nazwy funkcyjne
    i zostają; polskie zdanie spod nich („+Zniszczono %val% absorpcji") jest
    cudzą twórczością i w publicznym repozytorium na MIT nie ma go prawa być
    (`NOTICE.md`, regulamin gry VII.2 m). Zamrożenie niosło 236 takich zdań
    do 2026‑08‑06; dziś niesie `maZdanie: boolean`, a słownik dla testów
    składa szablony ZASTĘPCZE z klucza. **Kosztowało to 0 testów** — okazało
    się, że żaden nigdy nie pytał, jak zdanie brzmi, tylko czy gra je zna.
    Powrót brzmień zapala strażnika `brzmienia z gry NIE przechodzą przez
    `zamrozenie` do modułu` (`tests/slownik.test.ts`, mutacja sprawdzona).
    Ta sama reguła dotyczy pseudonimów innych graczy — na zrzutach ekranu
    też (`docs/screenshots/README.md`).
  - ⛔ **PSEUDONIMY GRACZY → DO FIXTURE'A WYŁĄCZNIE JAKO `Gracz N`.** Czwarta
    kategoria, dopisana 2026‑08‑06 — bo trzecia mówiła „ta sama reguła dotyczy
    pseudonimów" i **niczego nie pilnowała po stronie materiału z gry**. Każdy
    wojownik z `npc: 0` wchodzi do `tests/fixtures/` jako `Gracz 1`, `Gracz 2`, …;
    podstawia `pseudonimizuj` w `tools/walka.ts`, automatycznie przy każdym
    `--zachowaj`, a pilnują dwa niezmienniki w `tests/fixtury.test.ts`. `id`,
    liczby i nazwy POTWORÓW zostają nietknięte — to one są w tym pliku dowodem.
    Etykiety są **lokalne dla pliku** i nie mają nic wspólnego z `Gracz A`…
    `Gracz G` z prozy; stąd cyfra zamiast litery. Pełna procedura wejścia
    materiału: `tests/fixtures/README.md`.

    ⚠️ **Jednego kroku nie da się zautomatyzować i trzeba o tym wiedzieć.**
    Podstawienie zna wyłącznie nazwy związane z `id`. Nick niezwiązany z żadnym
    wojownikiem — wstawiony tylko w `render`, w `txt=` z łupem, należący do
    kogoś, kto wypadł przed pierwszą migawką — przechodzi przez nie nietknięty
    i **nie zapala ani jednego strażnika** (zmierzone mutacją). Dlatego procedura
    ma krok „przeczytaj `otwarcie` i `render` oczami".
  - ⛔ **OPISY UMIEJĘTNOŚCI → DO FIXTURE'A NIGDY.** Piąta kategoria, dopisana
    2026‑08‑06 tego samego dnia co czwarta i **z tego samego powodu**: trzecia
    mówiła „brzmienia gry → nigdzie", a `ladunek.skills` w pierwszym zrzucie,
    który je niósł, przeszedłby z pięcioma pełnymi zdaniami autorstwa twórców
    gry. Zdejmuje je `zdejmijOpisy` w `tools/walka.ts`, automatycznie przy każdym
    `--zachowaj`; ile zeszło, mówi pole `opisow` w pliku, a pilnują dwa
    niezmienniki w `tests/fixtury.test.ts` — jeden po położeniu pola, drugi po
    kształcie tekstu, żeby zmiana układu ładunku nie uciszyła obu naraz.
    `id` umiejętności, jej NAZWA, wymagania i parametry zostają: to nazwy
    funkcyjne, ta sama granica co przy `+abdest`.

    ⚠️ **Wniosek warty więcej niż sama kategoria.** Reguła „brzmienia gry →
    nigdzie" istniała od rana i **nie chroniła materiału**, bo pilnował jej
    strażnik po stronie SŁOWNIKA. Dwa razy pod rząd — przy pseudonimach
    i tutaj — okazało się to samo: **reguła bez strażnika po stronie danych jest
    regułą o kodzie, nie o repozytorium.** Pisząc następną, sprawdź, którędy do
    repo wchodzą pliki.
  - **Protokół tak, jak przysłał go serwer → do `tests/fixtures/*.json`**, przez
    `bun tools/walka.ts --zachowaj … --nazwa <slug>`. Bo moduł z `--rozbij`
    gubi `hp.max`, ładunki i granice wywołań, a bez `hp.max` nie ma świadka
    dekodera spoza dekodera (niżej). „Tak, jak przysłał go serwer" ma odtąd
    **dwa wyjątki** i są nimi dwie kategorie wyżej; oba są liczone w samym pliku
    (`pseudonimow`, `opisow`).

  **Warunek, pod którym katalog wrócił: niezmienniki ODKRYWAJĄ pliki same**
  (`tests/fixtury.ts` + `tests/fixtury.test.ts`, wciągane też do `KORPUS`).
  Drugi zarzut z tamtej rundy brzmiał „plik danych da się dołożyć bez dotknięcia
  jednego testu, leżał martwy i nikt tego nie widział" — i to jest prawda o
  katalogu, którego nikt nie czyta. Tu zrzut wrzucony do katalogu jest sprawdzany
  od razu; sprawdzone pomiarem **dwa razy, na dwóch różnych zestawach testów**:
  2026‑08‑05 dorzucenie pliku dało 16 testów więcej, 2026‑08‑06 — 20. ⚠️ Stało
  tu `14`, potem `16` (`AUDYT‑82`), i lekcja jest ogólniejsza od poprawki:
  **ta liczba rośnie razem z zestawem testów**, więc nie ma sensu cytować jej
  jako stałej. Znaczenie ma znak, nie wartość: nowy plik dokłada testy, zamiast
  leżeć martwo. Pomiar robi się przez usunięcie pliku i porównanie `bun test`.

  Katalog **pusty** zapala osobny test (`FIXTURY.length > 0`) — sprawdzone.
  ⚠️ Literówka w ŚCIEŻCE nie zapala testu, tylko wywraca ładowanie modułu
  (`AUDYT‑76`): `readdirSync` rzuca ENOENT na poziomie `tests/fixtury.ts`, więc
  strażnik w ogóle nie startuje, a razem z nim pada `tests/stats.test.ts`, który
  importuje `KORPUS`. Głośno — ale nie „osobnym testem", i tak to trzeba czytać.
  Zmierzoną mutacją była literówka w ROZSZERZENIU (`.jsonx`), i tylko ona kończy
  się „strażnik zapala się, reszta milczy".

  `tests/walka-z-gry.ts` **zostaje**, ale przestał być oryginałem: jest kopią
  jednego z fixture'ów dla czterech miejsc, które importują gotowe `KOMUNIKATY`
  i `SKLAD` (w tym `build.ts`, który katalogu testów nie czyta). Rozjazd kopii
  z oryginałem zapala test.

  ⚠️ **CO ODEBRAŁO SKASOWANIE 25 WALK — i ile z tego wróciło.** Kształt, o którym
  nie pomyśleliśmy, nie ma jak wpaść do materiału budowanego przez nas; 25
  prawdziwych walk łapało je samo z siebie. Od 2026‑08‑05 prawdziwe walki znów
  są w pętli niezmienników, a od 2026‑08‑06 są ich **DWIE**, nie dwadzieścia
  pięć.

  ✅ **Trzy kształty wymienione tu jako niesprawdzane PRZYSZŁY z drugą walką**
  (2026‑08‑06): przekrój po typie obrażeń w walce grupowej, blok u celu
  i super‑kryt. To nie jest zbieg okoliczności ani zasługa planowania — 25 walk
  łapało takie rzeczy same z siebie i **jedna prawdziwa walka też je złapała**,
  łącznie z błędem dekodera, o którym nikt nie wiedział (parowanie po kolejności,
  16 komunikatów `unknown`). Dowód działa w obie strony: materiał z gry naprawdę
  niesie kształty, na które nie wpadamy, i naprawdę wystarczy go MAŁO, żeby to
  pokazać.

  ⚠️ **Stało tu „dwie" do 2026‑08‑05** (`AUDYT‑58`). Runda celowała w dwa
  fixture'y, drugi odpadł jako sklejony — a liczba została w prozie i rozeszła
  się stąd do pięciu innych miejsc. `find tests/fixtures -name '*.json'` mówiło
  wtedy `1`; `ROADMAP.md` i `tests/fixtures/README.md` mówiły „jedna" od
  początku. Od 2026‑08‑06 prawdziwą liczbą jest `2` — i lekcja z tamtego
  sprostowania zostaje: **licz plikiem, nie pamięcią.**

  ✅ Co wróciło i kiedy:
  - 2026‑08‑04 — zgodność zaszytych identyfikatorów `_t` z assetem gry
    i **dwustronne** pokrycie tabeli ról przeciw 233 kluczom gry.
  - 2026‑08‑05 — **częściowy świadek dekodera spoza dekodera**. Protokół podaje
    procent życia celu, migawka wojownika niesie `hp.max`; te dwie liczby idą
    z różnych miejsc i nikt ich u nas nie uzgadnia, więc skumulowane obrażenia
    muszą trafić w podany procent (763 − 243 = 520; 520/763 = 68,15 %). Zmierzone
    na jedynej prawdziwej walce: **7 porównań, 0 rozjazdów**; dekoder sumujący
    `raw` zamiast `applied` daje **6 rozjazdów**, czyli zapala 6 z 7.
    **Obejmuje tylko obrażenia** — cel, który padł, wypada z porównania,
    a uleczony wypada od chwili uleczenia (`AUDYT‑61`: leczenie przesuwa BAZĘ,
    więc milczenie o nim dawało fałszywy alarm na poprawnym dekoderze). Blok
    i absorpcja przez świadka **przechodzą**, bo `applied` to liczba PO redukcji;
    niesprawdzone są ich osobne składniki.

    ⚠️ **Stały tu liczby z materiału, którego w repo NIE MA** (`AUDYT‑58`,
    `AUDYT‑59`): „16 trafień na dwóch walkach" i przykład `763 − 225 = 538;
    538/763 = 70,51 %` z `id -255970`. Ani `70.51`, ani `225`, ani `538`, ani
    takiego `id` nie ma w `tests/fixtures/` — przyszły z odrzuconego zrzutu
    i przeżyły go w prozie. Liczba `6` jako jedyna była prawdziwa.
  - 2026‑08‑06 — **druga prawdziwa walka**, grupowa, w ponad stu wywołaniach.
    Przyniosła blok u celu, absorpcję z własnymi kluczami, zapowiedź
    umiejętności, `heal_target` w dwóch szykach, super‑kryt, przekrój po
    żywiołach i zmienny `data.current`. **Nie weszła od razu**: dawała 16
    komunikatów `unknown` i weszła dopiero po poprawce dekodera, który parował
    zadane z przyjętymi po KOLEJNOŚCI, choć gra nie paruje ich wcale
    (`docs/MECHANIKA.md`, wpis „Zadane i przyjęte NIE SĄ PAROWANE").
    ⚠️ Świadka **nie wzmocniła** — patrz sekcja „Testy" wyżej.

  Kolejny materiał z gry ma **dwie drogi**, obie kończące się tym samym
  `bun tools/walka.ts --zachowaj … --nazwa <slug>` (i zwykle także `--rozbij`)
  oraz tym samym kształtem pliku
  (`Zrzut` w `src/zrzut.ts` — JEDEN typ dla obu stron):
  - **z dodatku**: zębatka → „Tryb deweloperski" → „Zrzut walki". Nie wymaga
    niczego przed walką, bo tryb raz włączony zostaje, i **nie owija
    `Engine.battle.update` drugi raz**. Zbiera całą sesję, więc przy kilku
    walkach `--rozbij` żąda `--walka <n>`; numery pokazuje `--pokaz`.
  - **sondą** (`tools/walka-probe.js`) wklejoną do konsoli przed walką. Zostaje
    i ma zostać: działa bez instalowania dodatku i jest jedyną drogą, gdy
    podejrzenie pada na sam dodatek — zrzut zebrany zepsutym kodem nie świadczy
    o niczym.
- **`tests/overlay.test.ts` był ostatni** i dlatego jego asercje wymieniają dziś
  nazwy z generatora. Test panelu mówi „czy panel rysuje to, co dostał"; nie
  mówi już „czy gra produkuje takie składy".

## Dwa zapisy zmian, dla dwóch czytelników

- **`CHANGELOG.md` jest DLA UŻYTKOWNIKA.** Płaska lista na wersję, każdy wpis
  zaczyna się od **Nowość** / **Zmiana** / **Poprawka**. Bez pojęć
  programistycznych — nie „parser", „regex", „cache". Pilnuje tego test
  (`tests/changelog.test.ts`), bo regułę łamie się niechcący, pisząc zaraz po
  wyjściu z kodu. Refaktory, testy i narzędzia tu **nie wchodzą**.

  **Zmiana w `src/` wymaga ruszenia listy wpisów w `CHANGELOG.md`** — w praktyce
  sekcji `[Niewydane]`, bo tam trafiają nowe. Pilnuje tego strażnik w `check.yml`
  (logika i powody: `tools/wydanie.ts`). Liczy się cały zakres PR-a albo pusha,
  nie pojedynczy commit, więc wpis wolno dołożyć osobno; poprawienie istniejącego
  wpisu też wystarcza. Porównywana jest CAŁA lista, a nie sama `[Niewydane]`:
  zakres obejmujący wydanie przenosi wpisy pod numer wersji i przy węższym
  porównaniu wyglądał jak brak wpisu (fałszywy alarm 2026‑08‑04). Typy, których użytkownik nie
  widzi (`refactor`, `test`, `docs`, `build`, `chore`, `ci`, `style`), zwalniają
  same z siebie. Gdy `feat` albo `fix` naprawdę go nie dotyczy — dopisz
  `[bez-changeloga]` do komunikatu commita. Furtka istnieje po to, żeby reguła
  wyżej („refaktory tu nie wchodzą") i strażnik nie kazały wybierać między sobą.

  **Samo wydanie** — przeniesienie sekcji, `package.json`, tag i to, co robi
  potem CI — stoi w [`docs/WYDANIE.md`](docs/WYDANIE.md). Wpis w `[Niewydane]`
  nie jest wydaniem: zmiana dociera do gracza dopiero z tagiem.
- **`docs/specy/` jest DLA PROGRAMISTY.** Jeden plik na rundę wymagającą
  zaprojektowania: problem, rozwiązanie, **odrzucone warianty**, weryfikacja.
  Sygnał, że spec jest potrzebny: łapiesz się na tym, że piszesz plan. Szablon
  i zasady — [`docs/specy/README.md`](docs/specy/README.md).

## Commity

**Komunikat commita jest tu głównym zapisem rozumowania.** Kod mówi, CO jest —
diff pokazuje to lepiej niż jakikolwiek opis. Komunikat ma powiedzieć,
**DLACZEGO tak, a nie inaczej**, i to on zostaje, gdy za miesiąc ktoś pyta
„czemu to tak działa". Rejestry w `docs/` niosą stan, specy niosą projekt,
commit niesie **decyzję w momencie jej podejmowania**.

- **Nie commituj bez proszenia.** Runda kończy się zmianami w drzewie roboczym
  i podsumowaniem, chyba że padnie inne polecenie.
- **Przegląd PRZED commitem, nie po.** Jeden z audytów znalazł jedenaście
  rzeczy, z czego pięć było regresjami rundy czekającej właśnie na commit.
- **Każdy commit przechodzi `bun run check` osobno**, także przy rozbijaniu
  większej zmiany na kilka.
- **Dokumentacja starzeje się szybciej niż kod.** Jeśli opierasz decyzję na
  zdaniu z `docs/`, sprawdź je w kodzie; jeśli się rozjechało, popraw dokument
  w tej samej rundzie — i napisz w commicie, co zastałeś.

### Nagłówek

`typ(zakres): skutek` — Conventional Commits, po polsku. Typy w użyciu:
`feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `build`.

Nagłówek nazywa **skutek**, nie czynność: „blok, super-kryt i osłabienie DoT-a
docierają do panelu", a nie „dodaj obsługę bloku". Gdy zmiana zamyka pozycję
z rejestru, jej ID idzie w nawias — `(SOLID §4.22, §4.18)`, `(AUDYT-14/17/18/19)`
— żeby dało się przejść od wpisu do zmiany i z powrotem.

### Treść

Bez limitu długości. Commit na trzydzieści linii jest tu normą, jeśli tyle
zajmuje uzasadnienie; commit na jedną linię przy nietrywialnej zmianie jest
brakiem, nie zwięzłością. Co ma się w niej znaleźć:

- **Liczby, nie przymiotniki.** „269 → 62 ms przy 190 nagraniach", nie „szybciej".
  Przy zmianach wydajnościowych pomiar przed i po, tą samą sondą. Przy zmianach
  w dekoderze i agregacie — przeliczenie na materiale z `tests/`.
- **Co rozstrzygnęło wybór.** Jeśli decydował pomiar, a nie gust, napisz to
  wprost. Jeśli decydował gust, też.
- **Odrzucone warianty i dlaczego.** Kod nigdy nie mówi, czego NIE wybrano.
  Wariant odrzucony z powodu, który kiedyś zniknie, zasługuje na osobne zdanie.
- **Czy test potrafi paść.** Po napisaniu testu zepsuj naprawę i sprawdź, że
  się zapala — a potem napisz w commicie, że to zrobiłeś i co się zapaliło.
- **Co ZOSTAJE otwarte.** „Naprawione" nie ma znaczyć więcej, niż znaczy.
  Koszty dołożone przy okazji też się tu wpisuje.
- **Sprostowania.** Jeśli zdanie z `docs/` okazało się nieprawdą — co mówiło,
  co jest naprawdę i skąd wzięła się pomyłka.
- **Wnioski na przyszłość.** Jeśli runda czegoś nauczyła, zdanie o tym jest
  warte więcej niż opis kodu. Kilka reguł z tego pliku powstało właśnie tak.

Niczego z tego nie sprawdza żaden hook ani test — dlatego jest zapisane tutaj.

### Stopka

Agent dopisuje `Co-Authored-By`. Zmiana wykonana narzędziem ma być rozpoznawalna
w historii bez pytania kogokolwiek.

## Dalej

[`docs/README.md`](docs/README.md) — co gdzie siedzi, czego log o walce nie mówi
i jak wyglądały poprzednie rundy. Katalog `docs/` czyta się **wybiórczo**: każdy
plik odpowiada na inne pytanie i nikt nie czyta ich w całości.
