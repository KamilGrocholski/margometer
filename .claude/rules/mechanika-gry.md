---
paths:
  - "src/protokol.ts"
  - "src/protokol-source.ts"
  - "src/stats.ts"
  - "src/types.ts"
  - "src/zrzut.ts"
  - "docs/**/*.md"
  - "tests/fixtury.ts"
  - "tests/fixtury.test.ts"
  - "tests/korpus.ts"
  - "tests/walka-z-gry.ts"
  - "tests/fixtures/README.md"
  - "tools/walka.ts"
---

# Zdanie o mechanice gry wymaga dowodu ze źródła

Reguła ładuje się przy plikach, w których takie zdania powstają: dekoder
protokołu, agregat, typy, dokumentacja w `docs/` i opisy materiału z gry.

⚠️ **Ta lista ścieżek zawiodła już DWA RAZY z tego samego powodu.** Do
2026‑08‑04 stał tu `src/parser.ts`, potem `tests/fixtures/**/meta.json` —
oba wzorce przeżyły pliki, do których wskazywały, więc reguła **nie ładowała
się tam, gdzie zdania o mechanice gry naprawdę powstają**. Ścieżka, która nigdy
się nie dopasuje, wygląda w pliku dokładnie tak samo jak działająca. Kasując
plik z `src/` albo `tests/`, sprawdź tę listę.

⚠️ **A trzeci raz zawiodła INACZEJ — nie przez ścieżkę martwą, tylko przez
BRAKUJĄCĄ** (`AUDYT‑92`, 2026‑08‑05). Lista wymieniała trzy pliki `src/`
i przez dobę nie było wśród nich `src/protokol-source.ts` ani `src/zrzut.ts` —
a to tam przeniosła się granica walki (`data.init`), czyli zdanie o grze tak
czyste, że dostało **najnowszy wpis tego rejestru**. Brakowało też
`tests/fixtury.ts`, gdzie mieszka świadek dekodera i trzy twierdzenia o tym, co
protokół podaje przy zgonie i po uleczeniu. Wniosek jest szerszy od poprawki:
lista starzeje się nie tylko wtedy, gdy plik ZNIKA, ale i wtedy, gdy wiedza
PRZEPROWADZA SIĘ do pliku, którego na liście nie było. Pisząc nowy wpis
rejestru, sprawdź, czy plik, którego dotyczy, tu stoi.

⚠️ **Czwarty raz, znów przez ścieżkę BRAKUJĄCĄ** (`AUDYT‑100`, 2026‑08‑06):
`tools/walka.ts` nie stał tu, a od tej rundy mieszka w nim zdanie o grze
sprawdzalne w cudzym repo — **`npc: 0` w `ladunek.w` znaczy „gracz"**, i to na
nim stoi cała redakcja pseudonimów. Razem z nim doszedł `tests/fixtury.test.ts`,
gdzie stoją twierdzenia o tym, co protokół podaje przy zgonie i po uleczeniu.
Wniosek jest ten sam co przy trzecim razie i wart powtórzenia: lista starzeje
się także wtedy, gdy wiedza PRZEPROWADZA SIĘ do pliku, którego na niej nie było.

⚠️ Uwaga przy `tests/fixtures/README.md`: katalog wrócił 2026‑08‑05, ale
**`meta.json` nie wraca** — opis materiału stoi dziś w jednym `README.md`, a nie
w pliku na walkę. Stary wzorzec `tests/fixtures/**/meta.json` byłby dziś martwy
po raz drugi z tego samego powodu.

**Kiedy dotyczy.** Gdy piszesz (w kodzie, komentarzu, dokumencie albo w
odpowiedzi) zdanie o tym, jak zachowuje się GRA, a nie nasz kod. Test: **czy
byłoby prawdziwe w cudzym repo czytającym ten sam log?** Jeśli tak — dotyczy.
Zdania negatywne („log tego nie mówi”, „dokumentacja tego nie rozstrzyga”) też.

**Co zrobić.** Pełna procedura z rejestrem odpowiedzi: `docs/MECHANIKA.md`.
W skrócie: (1) sprawdź rejestr — wpis negatywny wiąże tylko z metodą i datą;
(2) `bun tools/pomoc.ts "Blok ( blok )"` — pełny tekst artykułu, **nie**
`WebFetch`, który na tym artykule oddaje sam spis treści; (3) szukaj FRAZĄ,
najlepiej nazwą silnikową z nawiasu, bo rdzeń „unik” łapie „unikatowy”;
(4) do rejestru wklej **dosłowny cytat** z wyjścia sondy, nie przepisuj;
(5) dopiero teraz zmierz materiał (`tests/walka-z-gry.ts`, `tests/korpus.ts`);
(6) rozjazd między pomiarem a pomocą jest wpisem w rejestrze — w kodzie wygrywa
pomiar.

**Dlaczego to nie jest przesada.** To repo dwa razy zapisało „sprawdzone
w pomocy, milczy” o rzeczach, które pomoc opisuje wprost — raz z adnotacją
„nie badać drugi raz”. Fałszywy negatyw kosztuje więcej niż brak wpisu, bo
zamyka temat.
