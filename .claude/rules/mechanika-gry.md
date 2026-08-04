---
paths:
  - "src/protokol.ts"
  - "src/stats.ts"
  - "src/types.ts"
  - "docs/**/*.md"
  - "tests/korpus.ts"
  - "tests/walka-z-gry.ts"
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
