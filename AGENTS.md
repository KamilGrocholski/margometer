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
                  →  session.ts  → suma walk
                  →  overlay.ts  → panel w Shadow DOM
```

Poboczne: `recorder.ts` + `archive.ts` (nagrywanie i odtwarzanie),
`roster.ts` (skład z `Engine.battle`), `palette.ts`, `window.ts`,
`stored-state.ts`.

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

## Commity i przegląd

- **Przegląd PRZED commitem, nie po.** Jeden z audytów znalazł jedenaście
  rzeczy, z czego pięć było regresjami rundy czekającej właśnie na commit.
- **Dokumentacja starzeje się szybciej niż kod.** Jeśli opierasz decyzję na
  zdaniu z `docs/`, sprawdź je w kodzie; jeśli się rozjechało, popraw dokument
  w tej samej rundzie.

## Dalej

[`docs/README.md`](docs/README.md) — co gdzie siedzi, czego log o walce nie mówi
i jak wyglądały poprzednie rundy. Katalog `docs/` czyta się **wybiórczo**: każdy
plik odpowiada na inne pytanie i nikt nie czyta ich w całości.
