# Co obejmuje licencja, a co nie

MargoMeter jest na [licencji MIT](LICENSE). Obejmuje ona **kod i dokumentację
napisane w tym repozytorium** — i tylko je.

> `package.json` ma nadal `"private": true`. To pole blokuje wyłącznie
> `npm publish` i **nie znaczy „zamknięte źródło"** — MargoMeter nie jest paczką
> npm, tylko userscriptem, więc zostaje jako zabezpieczenie przed przypadkową
> publikacją w rejestrze. Licencję niesie pole `"license": "MIT"` obok i plik
> `LICENSE`.

Margonem jest grą **Garmory sp. z o.o. sp.k.** Ten dodatek nie jest z nią
związany, nie jest przez nią autoryzowany ani sprawdzony. Nazwa „Margonem",
logotypy, grafiki, teksty i kod klienta gry należą do Usługodawcy; MIT ich
**nie obejmuje** i nie może objąć, bo nie są nasze. Licencja gracza na
korzystanie z Serwisu jest wąska — [regulamin XIX.2][reg] daje ją „w celach
osobistych (niezawodowych i niezarobkowych)" i na zwielokrotnianie w pamięci
własnego urządzenia, nie na rozpowszechnianie.

## Co z gry siedzi w tym repozytorium

Dodatek musi rozmawiać z grą, więc pewne rzeczy z niej mieć musi. Co dokładnie
i na jakiej podstawie:

- **Identyfikatory `_t` i klucze protokołu** — `tests/klucze-protokolu.ts`
  (233 pozycje) oraz te same identyfikatory zaszyte w `src/protokol.ts`. To są
  **nazwy funkcyjne**, nie treść: `+abdest`, `msg_+abdest %val%`. Bez nich nie
  da się zdekodować protokołu, a wymóg interoperacyjności jest w prawie
  autorskim przewidziany osobno (art. 75 ust. 2 pkt 3 pr. aut., dyrektywa
  2009/24/WE art. 6).

  ⚠️ **Zdań gry tu NIE MA i mieć nie będzie.** Do 2026‑08‑06 ten plik niósł
  także 236 polskich brzmień przepisanych z assetu — 223 przy kluczach plus 13
  szablonów ramowych („+Zniszczono %val% absorpcji"). To cudza twórczość i nie
  ma powodu, żeby leżała w publicznym repozytorium: sprawdzone pomiarem —
  testom wystarczy wiedza
  **czy** gra ma dla identyfikatora zdanie, nie **jak ono brzmi**. Zostało
  `maZdanie: boolean`, ubyło 0 testów. Dodatek brzmienia bierze z żywej gry
  przez `window._t`, więc użytkownik niczego nie traci.

- **Zrzut własnej walki** — `tests/fixtures/*.json`. Zapis jednej walki własną
  postacią przeciw potworom, tak jak przysłał go serwer. Pole `render` niesie
  36 zdań złożonych przez klienta gry (6,4 kB) — nasz kod ich nie czyta,
  a wycięcie ich byłoby edytowaniem materiału dowodowego, czego `AGENTS.md`
  zabrania. To zapis własnej rozgrywki, nie wyciąg ze słownika gry, i tak jest
  tu traktowany.

  **Nazwy postaci są w tych plikach podstawione** — `Gracz 1`, `Gracz 2`, …
  Robi to `pseudonimizuj` w `tools/walka.ts`, przy każdym wejściu materiału do
  repo, a pilnują dwa niezmienniki w `tests/fixtury.test.ts`. ⚠️ Do 2026‑08‑06
  stało tu „Nie ma w nim danych innych graczy" — i było to prawdą **o tym
  jednym pliku**, a nie o procedurze: jedyny fixture to walka solo z potworami,
  więc nie było czego wpuścić. Lista brakującego materiału (blok, unik,
  absorpcja, walka turowa) prowadzi wprost do walk grupowych i PvP, więc
  przypadek przestałby wystarczać przy następnym zrzucie.

  Zostają `id`, poziomy i wszystkie liczby — bez `id` protokół nie ma jak
  wskazać stron, a liczby są w tym pliku dowodem. To jest więc
  **pseudonimizacja, nie anonimizacja**: gra nadal umie odwzorować `id` na nick.
  Redakcja jest nieodwracalna i zrobiona na miejscu, więc w historii gita
  oryginał zostaje — ta sama świadoma granica, co przy zrzutach ekranu.

- **Zrzuty ekranu** — `docs/screenshots/`. Pokazują panel dodatku, nie grafikę
  gry. Pseudonimy dziesięciu innych graczy są **zamazane**; powód i procedura
  w [`docs/screenshots/README.md`](docs/screenshots/README.md).

- **Pomiary z walk grupowych w `docs/`, `src/` i `tests/`** — pseudonimy innych
  graczy zastąpione 2026‑08‑06 etykietami `Gracz A`…`Gracz L`, **konsekwentnie
  w całym repozytorium**: ta sama etykieta znaczy tę samą postać w każdym
  pliku. Wszystkie liczby zostały nietknięte, bo to one są w tych zapisach
  dowodem — pseudonim nigdy niczego nie dowodził.

  ⚠️ **Pierwsze podejście skończyło się na `G` i pominęło cały blok** — trzy
  nazwy w surowych danych walki grupowej, dwie w tabeli kodów profesji, jedną
  w komentarzu w `src/style.ts`. Domknięte tego samego dnia (`AUDYT‑101`).
  Razem z jedną podmianą W DRUGĄ STRONĘ: `Regulus Mętnooki` to NPC i etykieta
  wróciła do nazwy, bo napis „regulus" siedział w tym materiale dwa razy — raz
  jako boss, raz w nicku gracza — a redakcja robiona okiem skleiła je w jedno.

  **Postacie autora zostają** — w prozie, w `tools/synthetic-log.ts` i w testach.
  Zgoda jest, a te same nazwy niosą generator i historia gita. W plikach
  `tests/fixtures/` nie zostają: tam podstawienie jest mechaniczne i nie ma jak
  rozpoznać właściciela, więc nie próbuje.

  Robione razem z redakcją zrzutów ekranu i z tego samego powodu: bez tego
  zakrywanie nicków na obrazkach byłoby teatrem. `docs/specy/2026-08-03-porzucone-funkcje-schodza-z-drzewa.md`
  wymieniał te same trzy nazwy z **dokładnie tymi liczbami**, które przed chwilą
  zniknęły z rankingu na zrzucie — czyli pozwalał go odtworzyć jednym `grep`‑em.

  Wyjątek: `docs/specy/2026-08-03-parser-tokenizer-i-gramatyka.md` dostał
  zastępniki o tym samym kształcie leksykalnym, a nie etykiety, bo cały tamten
  akapit dowodzi czegoś o BUDOWIE nazw. Powód stoi na miejscu, w pliku.

- **Krótkie cytaty z kodu i dokumentacji gry** — w `docs/specy/`
  i `docs/MECHANIKA.md`, każdy z podaniem źródła, na potrzeby uzasadnienia
  decyzji. To prawo cytatu (art. 29 pr. aut.).

## Czego w tym repozytorium celowo NIE MA

- **Źródeł klienta gry.** `tools/zrodla.ts` potrafi je odzyskać z map źródeł
  builda deweloperskiego (5,8 MB), ale odkłada je do `.cache/`, który jest
  w `.gitignore`. Decyzja i odrzucone warianty:
  [`docs/specy/2026-08-04-zrodla-klienta-z-buildu-deweloperskiego.md`](docs/specy/2026-08-04-zrodla-klienta-z-buildu-deweloperskiego.md).
  Te narzędzia są instrumentami badawczymi i **nie należy** ich używać do
  redystrybucji czegokolwiek, co pobiorą.
- **Grafik, dźwięków i assetów gry.**
- **Danych innych graczy** w jakiejkolwiek postaci.

## Zastrzeżenie

To nie jest opinia prawna, tylko opis tego, co autor zastał i jak to
poukładał. Status dodatku wobec regulaminu gry opisuje README — sekcja
„Dodatek a regulamin Margonem"; nie jest on autoryzowany przez Usługodawcę.
W razie zastrzeżeń Garmory: [Panel Kontaktowy](https://www.margonem.pl/?task=contact)
— usuniemy albo poprawimy to, co wskaże.

[reg]: https://pomoc.margonem.pl/index/view,323
