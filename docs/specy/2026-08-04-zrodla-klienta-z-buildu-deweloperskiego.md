# Oryginalne źródła klienta gry zamiast heurystyki na minifikacie

Status: wdrożone · 2026-08-04 · 16ddc62

Sąsiad: [`2026-08-04-protokol-silnika-jako-zrodlo-parsera.md`](2026-08-04-protokol-silnika-jako-zrodlo-parsera.md)
— tamten spec pyta, **co** gra wysyła do okna walki. Ten pyta, **skąd** to
czytamy, i wymienia podstawę pod tamtym. Trzeci,
[`2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md`](2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md),
projektuje kod w `src/` i **konsumuje pozycję „reszta 647 plików”** z sekcji
„Co zostaje otwarte”: `BattleMessages.js` i `Battle.js` są tam przeczytane,
a wnioski z nich stoją w jego sekcji „Problem”.

## Problem

`tools/slownik.ts` czyta klienta produkcyjnego, a ten jest zminifikowany. Ciało
renderera trzeba stamtąd wycinać dopasowywaniem klamr — `cialoRenderera` startuje
od `indexOf("this.battleMsg=function")` i liczy nawiasy przez 26 kB. Komentarz
przy tej funkcji mówi wprost, dlaczego tak: „regexem się nie da". Zgoda — ale
kotwicą jest tu literał, którego nikt nam nie obiecał, a wszystko poniżej
(etykiety, identyfikatory, zdania) stoi na tym jednym `indexOf`.

**Sprostowanie do sąsiedniego speca.** Ten spec zapisał „16 nierozwiązanych
etykiet", z czego `+crush_*` (6 kluczy) i `+of_dmg` miały zostać niewyjaśnione.
Dzisiejsze uruchomienie mówi co innego:

```
$ bun tools/slownik.ts --braki
build 1785244275300 — 233 etykiet renderera, 223 ze zdaniem
10 bez zdania, w tym 0 do wyjaśnienia

$ bun tools/slownik.ts --klucz "+crush_fire"
  id:     eng_game_only_val_+crush %val%
  zdanie: +Zmiażdżenie %val%%
```

Obie liczby są z 2026‑08‑04 i z tego samego builda, więc różnicę (240/224 kontra
233/223) zrobiło narzędzie między jednym pomiarem a drugim, nie gra. Znaczy to
tyle, że **ten spec nie może się reklamować zamykaniem tamtych 16 luk** — one się
zamknęły same. Powód, dla którego warto sięgnąć po źródła, jest inny i stoi niżej.

## Rozwiązanie

`experimental.margonem.pl` serwuje build **deweloperski** webpacka. Bundle jest
nieskompresowany, a każdy moduł kończy się inline'owym source mapem z pełnym
`sourcesContent` — czyli w pobranym pliku leży oryginalne drzewo źródeł klienta,
z komentarzami autorów.

Pomiar 2026‑08‑04:

| Co | Wynik |
|---|---|
| `https://experimental.margonem.pl/js/main.min1781609507010.js` | 24 596 632 B, nieskompresowany |
| Modułów z inline sourcemapem | **647 / 647**, każdy z `sourcesContent` |
| Odzyskane drzewo | `./src/js/…`, **5,8 MB** |
| `core/battle/Battle.js` | 105 626 znaków |
| `core/battle/BattleMessages.js` | 51 847 znaków, 237 etykiet `case` |
| `vendors.min…js` | 25 modułów, same `node_modules/` |
| Chunków dynamicznych | brak — `deferredModules.push(["./src/js/Margonem/main.js","vendors"])` |
| `main.min1785244275300.js.map` na produkcji | **404** |

Narzędzie: `tools/zrodla.ts`. Cache‑first w `.cache/`, `--odswiez` omija —
wzór z `tools/pomoc.ts` i `tools/slownik.ts`, z których bierze też `pobierz()`
i `buildKlienta()`. Ten drugi działał na stronie experimental **bez zmiany
regexu**: `main.min.js?v=…` nie pasuje do `/main\.min(\d+)\.js/`, a
`main.min1781609507010.js` pasuje.

**Co to naprawdę daje**, skoro nie 16 luk:

1. **Powody, nie tylko brzmienia.** Słownik daje zdanie; źródło daje zdanie
   *razem z warunkiem i komentarzem autora*. Gałąź `default` renderera, którą
   sąsiedni spec musiał odczytywać z minifikatu, wygląda w oryginale tak:

   ```js
   default:
       if (m[0].substr(1, 3) == 'dmg') {
           if (m[0].charAt(0) == '+') {
               attack += '<b class=' + m[0].substr(1) + '>+' + m[1] + '</b>';
           } else {
               take += '<b class=' + m[0].substr(1) + ' prof-' + f1.prof + '>-' + m[1] + '</b>';
   ```

   To jest to samo, co tamten spec wywnioskował — ale **wywnioskował**, a tu
   stoi napisane. Różnica ma znaczenie przy zdaniach o mechanice gry, gdzie
   `docs/MECHANIKA.md` wymaga cytatu, nie wniosku.

2. **Kolory żywiołów dla `+crush_*`** stoją w źródle wprost: `fire` → `ff5f5f`,
   `frost` → `52edff`, `light` → `eedc86`, `physical` → `ffffff`,
   `distance` → `9dff9f`. Zdanie jest jedno dla wszystkich pięciu kluczy
   (`eng_game_only_val_+crush %val%`), więc **w tekście logu żywioł ginie**,
   a w DOM-ie zostaje jako `<font color>`. `src/source.ts` czyta dziś żywioł
   z klasy `dmgX`, nie z `color` — to jest osobna ścieżka i tą rundą jej nie
   ruszamy, ale przestała być domysłem.

3. **`Battle.js`, 105 kB czytelnego kodu** — kontrakt `update(data)`, na którym
   stoi etap 2 i 3 sąsiedniego speca. Do tej pory dostępny tylko jako minifikat.

4. **Czujka rozjazdu.** `--roznica` porównuje zbiory kluczy `case` po obu
   stronach. To odpowiedź na pozycję „trwałość `case`-ów" zostawioną otwartą
   w sąsiednim specu, gdzie jedyną odpowiedzią był ręczny `--odswiez`.

Rozjazd jest realny i dlatego czujka nie jest ozdobą. Build dev to
**2026‑06‑16**, produkcyjny **2026‑07‑28** — sześć tygodni. Mimo to:

```
$ bun tools/zrodla.ts --roznica
dev 1781609507010 vs produkcja 1785244275300 (tempest)
  tylko dev:       allcritmval, allcritval
  tylko produkcja: npc_heal
```

Trzy klucze na 237. Źródło jest wiarygodnym lustrem produkcji — i jednocześnie
dowodem, że **nie wolno go traktować jak prawdy o dzisiejszej grze**.

## Odrzucone warianty

**Wcommitować rozpakowane źródła do repo.** Kusi, bo `tests/fixtures/` działa
w tym repo na zasadzie „fixture jest dowodem", a cytat w specu bez dowodu obok
siebie jest słabszy. Przekreślone przez to, czym ten materiał jest: 5,8 MB
cudzego, zastrzeżonego kodu w historii gita, na zawsze. Fixture'y niosą **zrzuty
z gry** — to, co gra pokazała graczowi. To jest kod gry i to inna kategoria.
Cena: cytaty w tym specu są odtwarzalne jedną komendą, ale nie da się ich
zweryfikować bez sieci.

**Przepiąć `tools/slownik.ts` na źródła już teraz.** Najbardziej kuszący
wariant: `cialoRenderera` mogłoby zniknąć, a z nim heurystyka klamr. Przekreślone
na tę rundę przez arytmetykę dat — związanie działającego narzędzia z buildem
o sześć tygodni starszym zamieniłoby dzisiejsze 223 zdania z produkcji na 223
zdania sprzed półtora miesiąca. Sensowny kształt to źródła jako **weryfikacja**
wyniku z produkcji, nie jako jego zamiennik, i to jest osobna runda.
**To jest wariant do powrotu** — wystarczy, żeby gra odświeżyła build dev.

**Wziąć źródła z produkcji.** Nie ma czego wziąć: `.js.map` → 404 pod dwiema
ścieżkami, bundle zminifikowany. Sprawdzone, nie założone.

**Traktować dev jako prawdę zamiast produkcji.** Trzy klucze różnicy dowodzą, że
nie. Produkcja zostaje wyrocznią brzmień; źródło daje strukturę i powody.

**Trzymać `pobierz()` w czwartej kopii.** `tools/pomoc.ts`, `tools/grooove.ts`
i `tools/slownik.ts` mają dziś po własnym `fetch` + `Bun.write` + cache. Piąta
kopia byłaby kosztem bez powodu, więc `zrodla.ts` importuje wersję ze
`slownik.ts` (jedyna zmiana w tym pliku: `export`). Odrzucone: wyciąganie tego
do wspólnego `tools/cache.ts` — to refaktor trzech działających plików przy
okazji czwartego, a nie jest o co kruszyć kopii dzisiaj.

## Plan wdrożenia

Jeden commit, `bun run check` przechodzi.

1. `tools/zrodla.ts` — `mapyModulow`, `sciezkaDocelowa`, `rozpakuj`,
   `kluczeCase`, `roznicaKluczy`, CLI.
2. `tools/slownik.ts` — `export` przy `pobierz()`, bez zmiany zachowania.
3. `tests/zrodla.test.ts` — offline.
4. Ten plik + wiersz w [`README.md`](README.md) + odsyłacz w sąsiednim specu.

`src/` nietknięte, `CHANGELOG.md` bez wpisu: to `tools` i `docs`, a te zwalniają
strażnika same z siebie i nie dotyczą gracza.

## Weryfikacja

Wszystko zmierzone przed napisaniem tego zdania:

- `bun run check` → 1137 testów, 0 fail, build przechodzi.
- `bun tools/zrodla.ts` → `647 modułów, 5.8 MB źródeł`, `647 plików` na dysk.
- `bun tools/zrodla.ts --roznica` → trzy klucze wypisane wyżej, kod wyjścia 1.
- `bun tools/zrodla.ts --pokaz core/battle/BattleMessages.js | head` →
  `Created by Michnik on 2016-01-08` i `require('@core/Templates')`.
- `bun tools/slownik.ts --braki` przed i po → **identyczne co do bajta**. Ta
  runda nie miała prawa ruszyć tabeli słownika i nie ruszyła.

**Czy test potrafi paść** — psute dwa razy, oba razy się zapaliło:

1. `Buffer.from(…, "base64")` → `atob` w `mapyModulow`: padły dwa testy,
   w tym „polskie znaki przechodzą całe". To nie było ćwiczenie —
   **pierwsza wersja narzędzia miała tam `atob`** i test ją złapał na
   `Zażółć gęślą jaźń`. `atob` oddaje ciąg bajtów, więc każdy komentarz
   autorów gry z polskim znakiem rozpadłby się na krzaki, a spec cytowałby je
   dalej z pełnym przekonaniem.
2. `if (zrodla.size === 0) throw` → `if (false)`: padł test „brak map to błąd
   z powodem, nie ciche puste drzewo", `Received value: Map {}`.

## Co zostaje otwarte

- **Trwałość buildu deweloperskiego.** Nikt nie obiecał, że
  `experimental.margonem.pl` zostanie przy tym trybie ani że mapy nie znikną
  przy najbliższym wdrożeniu. Odpowiedzi są dwie i obie ręczne: `--odswiez`
  i `--roznica`. Gdy mapy znikną, `mapyModulow` rzuci z powodem — to jedyna
  część, którą dało się zabezpieczyć kodem.
- **Sześć tygodni różnicy.** Nic nie pilnuje, żeby cytat wklejony ze źródeł do
  `docs/` był potem sprawdzony w produkcji. `--roznica` widzi tylko klucze
  `case`, nie treść gałęzi ani nie zdania.
- **Reszta 647 plików.** Ta runda otworzyła drzwi i zajrzała do `BattleMessages.js`.
  `Battle.js`, `battleEffects/` i `Communication.js` doczytane 2026‑08‑04 przy
  pytaniu „kto bije trucizną" — wynik negatywny i zapisany w `MECHANIKA.md`
  §„Sprawca DoT‑a"; `battleEffects/character` i `/screen` okazały się animacjami.
  `OneWarrior.js` i `Warriors.js` nadal nieprzeczytane.
- **Pole `mi` w ładunku `t`.** Niesione przez serwer, **nieczytane przez żaden
  z 547 plików klienta** (`grep -rn "data\.mi\b"` → 0). W obu znanych próbkach
  identyczność (`[0..17]` przy 18 komunikatach). Jedyne pole protokołu, którego
  nie rozumiemy.
- **Żywioł przy `+crush_*`.** Ustalone, że w tekście ginie, a w DOM-ie zostaje
  jako `<font color>`; nieustalone, czy `src/source.ts` powinien go stamtąd brać.
  To wymaga zrzutu z gry, nie kolejnego czytania źródeł.
- **Przepięcie `tools/slownik.ts`** — patrz „Odrzucone warianty", wariant
  z terminem ważności.

## Zmiany wpisu

- **2026-08-04** — powstał.
- **2026-08-04** — wdrożone w `16ddc62`; plan przeszedł bez zmian. Pozycja
  „reszta 647 plików" z sekcji niżej została **skonsumowana** przez
  [`2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md`](2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md):
  `BattleMessages.js` i `Battle.js` są przeczytane, a trzy ustalenia z nich
  (syntetyczna linia otwarcia, obcięcie na drugim `=`, komunikat jako blok)
  stoją w „Problemie" tamtego speca. `OneWarrior.js`, `Warriors.js`
  i `characterEffects/` nadal nie.
