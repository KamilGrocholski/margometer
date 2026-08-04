# AGENTS.md

Licznik obrażeń do przeglądarkowej gry [Margonem](https://www.margonem.pl/) —
userscript rysujący panel ze statystykami nad grą. Czyta okno walki i nic
więcej: nie wysyła zapytań, nie dotyka stanu gry, nie automatyzuje niczego.

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
okno walki (DOM)  →  source.ts   → tekst z żywiołami z klas CSS
                  →  parser.ts   → BattleEvent[]  (maszyna stanów, linia po linii)
                  →  stats.ts    → BattleStats    (agregacja, rozbicia, instancje)
                  →  session.ts  → podział bufora na walki; która z nich jest TĄ
                  →  overlay.ts  → panel w Shadow DOM
```

Poboczne: `recorder.ts` + `archive.ts` (nagrywanie i odtwarzanie),
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
- **Nieznane ma być głośne.** Linia, której parser nie rozumie, trafia do
  `{kind: "unknown"}` i zapala ostrzeżenie w panelu. Wzorce są wąskie CELOWO —
  szeroki połknie kiedyś linię z liczbą i zrobi to po cichu.
- **Komentarz mówi DLACZEGO, nie CO.** Kod jest gęsto komentowany i to jest
  zamierzone: komentarze niosą powody decyzji, odrzucone warianty i pomiary.
- **Kompilator zastępuje lintera.** Nie ma ESLinta; `noUnusedLocals`
  i `noUnusedParameters` są włączone, żeby martwy kod był błędem kompilacji.
  Nie wyłączaj ich, żeby coś przeszło.

## Testy

- **Test ma móc paść.** Po napisaniu testu na naprawę **zepsuj naprawę
  i sprawdź, że test się zapala**. Zdarzyły się tu testy zielone i puste.
- **Niezmienniki > pojedyncze asercje.** Najmocniejsze testy lecą po CAŁYM
  korpusie i sprawdzają własność, nie liczbę: „każda linia rozpoznana”,
  „rozbicia sumują się do skalarów”, „HTML daje to samo co tekst”.
- **Fixture jest dowodem**, nie „danymi testowymi”. Zrzuty w
  `tests/fixtures/new-engine/` mają `meta.json` z opisem, co pokrywają, czego
  w nich nie ma i co było trudne. Fixture'a się nie edytuje, żeby test przeszedł.
- **Są DWA korpusy i odpowiadają na różne pytania.** `new-engine/` to tekst
  i DOM z okna walki — materiał parsera. `grooove/` to surowy protokół silnika
  z publicznych walk na grooove.pl — „czy gra w ogóle emituje X”. Parser tego
  drugiego nie czyta; pliki nazywają się tam `log.grooove.txt`, żeby nie wpadły
  do globów testowych. Powody i granice: `tests/fixtures/grooove/README.md`.

## Dwa zapisy zmian, dla dwóch czytelników

- **`CHANGELOG.md` jest DLA UŻYTKOWNIKA.** Płaska lista na wersję, każdy wpis
  zaczyna się od **Nowość** / **Zmiana** / **Poprawka**. Bez pojęć
  programistycznych — nie „parser", „regex", „cache". Pilnuje tego test
  (`tests/changelog.test.ts`), bo regułę łamie się niechcący, pisząc zaraz po
  wyjściu z kodu. Refaktory, testy i narzędzia tu **nie wchodzą**.

  **Zmiana w `src/` wymaga ruszenia sekcji `[Niewydane]`** — pilnuje tego
  strażnik w `check.yml` (logika i powody: `tools/wydanie.ts`). Liczy się cały
  zakres PR-a albo pusha, nie pojedynczy commit, więc wpis wolno dołożyć osobno;
  poprawienie istniejącego wpisu też wystarcza. Typy, których użytkownik nie
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
  w parserze i agregacie — przeliczenie na korpusie.
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
