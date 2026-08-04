---
paths:
  - "src/protokol.ts"
  - "src/stats.ts"
  - "src/types.ts"
  - "docs/**/*.md"
  - "tests/fixtures/**/meta.json"
---

# Zdanie o mechanice gry wymaga dowodu ze źródła

Reguła ładuje się przy plikach, w których takie zdania powstają: dekoder
protokołu, agregat, typy, dokumentacja w `docs/` i opisy fixture'ów.

⚠️ Do 2026‑08‑04 pierwszą ścieżką był `src/parser.ts`. Parser tekstu zszedł
z drzewa, a reguła została z martwym wzorcem — czyli **nie ładowała się tam,
gdzie zdania o mechanice gry naprawdę powstają**. Ścieżka, która nigdy się nie
dopasuje, wygląda w pliku dokładnie tak samo jak działająca.

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
(5) dopiero teraz zmierz korpus; (6) rozjazd między pomiarem a pomocą jest
wpisem w rejestrze — w kodzie wygrywa korpus.

**Dlaczego to nie jest przesada.** To repo dwa razy zapisało „sprawdzone
w pomocy, milczy” o rzeczach, które pomoc opisuje wprost — raz z adnotacją
„nie badać drugi raz”. Fałszywy negatyw kosztuje więcej niż brak wpisu, bo
zamyka temat.
