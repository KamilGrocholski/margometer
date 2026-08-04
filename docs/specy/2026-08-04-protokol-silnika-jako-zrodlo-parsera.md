# Protokół silnika zamiast zdrapywania DOM — źródło danych parsera

Status: projekt

## Problem

Runda zaczęła się od pytania „czy `battle_engine.js` jest lepszym źródłem niż
DOM". Odpowiedź wymagała zejścia do kodu klienta gry i przewróciła dwa zdania,
które to repo miało za ustalone.

### Sprostowanie 1: `battle_engine.js` nie należy do gry

`tests/fixtures/grooove/README.md:22` i `tools/grooove.ts:8` mówią o nim jako
o „cudzej reimplementacji renderera gry" — i to jest prawda, ale łatwo przeczytać
ten plik jako coś, co gra też ma. **Nie ma.** Adres to
`https://grooove.pl/battle/js/battle_engine.js?v=7` (25 964 B, **222 etykiety
`case`**); w samej grze pliku o tej nazwie nie ma pod żadną z czterech ścieżek,
pod którymi mógłby stać (`www.margonem.pl/js/`, `/_js/pl/`, `commons.margonem.pl/js/`,
`<świat>.margonem.pl/js/` — wszystkie 404, sprawdzone 2026‑08‑04).

Że jest do tyłu, było zmierzone (227 linii „Nieznany parametr" na 5094 liniach
renderu). Teraz jest na to dowód ostrzejszy niż licznik: dla klucza `+wound`
grooove pisze **„+Ciężka rana"**, a gra — **„+Głęboka rana"**. W korpusie
tekstowym `tests/fixtures/new-engine/` „Głęboka rana" pada **19 razy**,
„Ciężka rana" — **ani razu**. To nie jest ten sam renderer i nigdy nie był.

### Sprostowanie 2: kanał podający surowy protokół ISTNIEJE

`docs/DECYZJE.md:228‑283` opisuje `Engine.battle` jako źródło **stanu** i wprost
zawiesza sprawę: „Warto też zbadać `API.addCallbackToEvent`". `docs/ROADMAP.md:134‑151`
nazywa parę tekst‑protokół „jedyną pozycją, której nie da się załatać bez gracza",
bo protokół zna wyłącznie z grooove.pl. Oba zdania powstały bez przeczytania
klienta.

Klient gry to `https://tempest.margonem.pl/js/main.min1785244275300.js`
(2 977 825 B, build `1785244275300`, pobrany 2026‑08‑04). Wszystkie dane walki
przechodzą przez **jedno wywołanie**, `Engine.battle.update(t)`:

```js
if (isset(t.m)) {
  …
  var l = $("<div>");
  for (var a in t.m) L.battleMsg(t.m[a], !e, t.m, a, l);
  L.addToLogLogContent(l);
}
```

`t.m[a]` to **surowy komunikat serwera**, jeszcze przed złożeniem zdania:

```
id[=hpp];id[=hpp];klucz=wartość;klucz=wartość;flaga;…
```

Dwa pierwsze segmenty to strony (nadawca, cel) — dokładnie ten sam kształt, który
korpus grooove zapisuje jako `id.życie.setne`. Obok, w tym samym `t`: `w`
(wojownicy z `hp.cur`/`hp.max`), `init`, `close`, `current`, `myteam`,
`turns_warriors`, `endBattle`, `skills`, `battleground`.

### Sprostowanie 3: parser odtwarza wstecz tabelę tłumaczeń klienta

Renderer nazywa się `BattleMessage.js` (nazwa z jego własnych `console.log`)
i jest wkompilowany w `main.min.js`. Funkcja `battleMsg` ma **26 041 znaków**
i **240 etykiet `case`** (236 różnych kluczy). Jej gałąź `default` rozstrzyga
pochodzenie wszystkiego, co dziś zdrapuje `src/source.ts`:

```js
default: "dmg" == O[0].substr(1, 3)
  ? "+" == O[0].charAt(0)
    ? (…, w += "<b class=" + O[0].substr(1) + ">+" + O[1] + "</b>")
    : (T += "<b class=" + O[0].substr(1) + " prof-" + h.prof + ">-" + O[1] + "</b>", C -= O[1])
  : _[2] += _t("msg_unknown_prameter %val%", { "%val%": i[y] })
```

Czyli:

- **klasa `dmgX` to dosłownie klucz protokołu bez znaku.** `DAMAGE_CLASS`
  w `src/source.ts:49`, przemyt przez `ELEMENT_MARKER` (`src/types.ts:6`)
  i para `marked`/`line` w parserze istnieją wyłącznie po to, żeby przenieść
  przez tekst informację, która w protokole stoi wprost;
- **atrybut `prof-X`** z `docs/DECYZJE.md:308‑320` to `warriorsList[nadawca].prof` —
  czyli nadawca, którego linia tekstu nie niesie;
- **gra ma własne „nieznane"**: `msg_unknown_prameter`. Nasza czujka `unknown`
  jest jej odpowiednikiem o piętro niżej — na linii zamiast na kluczu.

Reszta jest podstawieniem przez `_t(id, params)`. Tekst, który czyta
`src/parser.ts`, to wyjście tej funkcji.

### Konsekwencja, której nikt tu nie zakładał: zdania gry są do pobrania

Tabela tłumaczeń stoi pod
`https://commons.margonem.pl/js/dictionaries/dictionary_pl.js` (337 973 B).
Złączenie „etykieta `case` → identyfikator `_t` → zdanie ze słownika" rozwiązuje
**224 z 240 etykiet**. Szesnaście nierozwiązanych to w większości klucze, które
gra renderuje jako **nic** (`balloflight`, `active_decblock_per`,
`active_absorbdest_per` mają w `battleMsg` puste ciało z samym `break`) albo
strukturalne (`txt`, `skillId`, `attack2`).

To zamyka dwa pytania z sekcji „Otwarte" w `docs/MECHANIKA.md` — i to
odpowiedzią z **assetu gry**, nie z cudzego renderera:

| klucz | identyfikator | zdanie gry |
|---|---|---|
| `+rage` | `msg_+rage %val%` | `+Wściekłość: atak +%val%` |
| `anguish` | `msg_anguish %name% %hpp% %val0%` | `%name%(%hpp%%): %val0% obrażeń od krwawienia.` |

`docs/MECHANIKA.md:339` mówi o pierwszym: „⚠️ **Czego ten wpis NIE mówi.** Że gra
wypisuje z tego powodu jakąkolwiek linię." Wypisuje, i brzmienie jest identyczne
z tym, które grooove składa ze swojego klucza — tyle że teraz pochodzi z gry
i wolno je przepisać do wzorca. Żadnego z tych dwóch zdań nie ma w korpusie
tekstowym (0 trafień na „Wściekłość" i na „krwawieni*"), więc to są **dwie ciche
luki parsera potwierdzone źródłem**.

## Rozwiązanie

**Trzy etapy. Ta runda robi pierwszy i nie rusza `src/`.**

Powód tej kolejności jest jeden i twardy: repo nie ma **ani jednej walki
zapisanej obiema drogami**. Bez niej przełączenie źródła jest nieweryfikowalne —
nie da się odróżnić „nowe liczby są lepsze" od „nowe liczby są inne". Etap 1
produkuje dokładnie tę parę.

### Etap 1 — narzędzia (ta runda)

- **`tools/walka-probe.js`** — sonda do konsoli gry. Owija `Engine.battle.update`,
  zapisuje ładunek `t` bez interpretacji, migawki `warriorsList` przed i po
  każdym wywołaniu oraz **węzły renderu doklejone w tym samym wywołaniu**.
  Ostatnie jest właściwą nagrodą: daje odpowiedniość **komunikat ↔ zdanie, jeden
  do jednego**, czyli materiał, z którego mapowanie protokół→parser wyprowadza
  się z danych zamiast zgadywać.
- **`tools/walka.ts`** — rozbicie zrzutu na fixture, podgląd, histogram kluczy.
- **`tools/slownik.ts`** — złączenie opisane wyżej: klucz protokołu → zdanie gry.
  Siostra `tools/pomoc.ts`: tamta odpowiada „co mówi dokumentacja gry", ta —
  „co wypisuje klient gry".

### Etap 2 — orakulum (osobna runda, zablokowana do czasu pary)

Test liczący sumy z protokołu per postać i porównujący je z
`aggregate(parse(raw.txt))` na TEJ SAMEJ walce. Dziś nic w repo nie sprawdza
liczb parsera przeciw czemukolwiek spoza repo — testy pilnują niezmienników
i spójności wewnętrznej, a te były zielone także wtedy, gdy `mergeStats` gubiło
sumy (`AUDYT‑6`).

### Etap 3 — protokół jako źródło dodatku (decyzja podjęta, termin nie)

> **Etap 3 ma od 2026‑08‑04 własny spec:**
> [`2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md`](2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md).
> Rozstrzyga tam dwie rzeczy, których poniższy akapit nie przewidywał. Po
> pierwsze, etap 3 **dzieli się na dwie części o różnym stopniu zablokowania**:
> dekoder i czujka rozjazdu nie potrzebują pary i dają się zbudować dziś,
> przełączenie panelu potrzebuje i jest za bramą. Po drugie, pierwszym wpięciem
> jest **czujka porównująca obie drogi**, a nie zamiana źródła — bo czujka
> myląca się o protokole wypisze fałszywy alarm, a przełącznik pokaże złą liczbę
> po cichu.

Nowy `src/protokol.ts` wystawiający ten sam `BattleEvent[]`, żeby `stats.ts`,
`session.ts` i `overlay.ts` nie wiedziały, skąd przyszły dane. `src/source.ts`
i `src/parser.ts` **zostają** — patrz „Co zostaje otwarte".

**Obietnica z `AGENTS.md:3‑5` („nie dotyka stanu gry") przestaje być prawdziwa
w dniu, w którym dodatek owinie `Engine.battle.update`, i ma być przepisana w tym
samym commicie.** Decyzja zapadła 2026‑08‑04 i jest tu zapisana po to, żeby nie
wróciła jako pytanie.

### Co protokół daje ponad DOM

| dziś | z protokołu |
|---|---|
| „Locha #1" — numer NASZ, log nie ma id (`src/stats.ts:13‑20`, `59‑75`) | `id` po obu stronach **każdego** zdarzenia |
| `sourceHpPct = null` — „log nie podaje życia bijącego" (`src/types.ts:83‑86`) | życie obu stron, w setnych procenta |
| żywioł tylko z klasy CSS, przemycany znacznikiem (`src/source.ts:44‑48`) | żywioł = klucz, bez zdrapywania i bez `ELEMENT_MARKER` |
| `damageAbsorbed`: 237 127 (tekst) vs 240 025 (DOM), rozjazd nieusuwalny (`src/parser.ts:561‑578`) | składniki redukcji rozbite osobnymi kluczami |
| nazwa umiejętności po polsku | `skillId` — liczba, niewrażliwa na brzmienie |
| przeparsowanie CAŁEGO bufora przy każdej mutacji DOM (`src/session.ts:53‑57`) | strumień: jedno wywołanie = jedna porcja |
| `unknown` = cała nierozpoznana linia | nierozpoznany **klucz**, plus lista 236 kluczy, których szukać |
| `hp.cur` nieśledzone (`docs/DECYZJE.md:277`) | `t.w` przy każdej porcji |

### Czego protokół NIE naprawia

Trzy rzeczy, i milczenie o nich byłoby dokładnie tym, przed czym broni reguła
„Nie udawaj danych, których log nie ma".

**Sprawcy DoT‑a ani leczącego nadal nie ma.** W korpusie tyknięcia mają drugą
stronę pustą: `119444.6.71;0;anguish.3615`, `103655.98.03;0;l.1356,-15`.
Nałożenie efektu niesie obie strony, więc korelacja po `id` jest znacznie lepiej
ugruntowana niż dzisiejsze `opponentOf` po nazwie — ale to nadal **wnioskowanie,
nie fakt**, i `docs/DECYZJE.md:99‑207` obowiązuje bez zmian.

**Parsera tekstowego nie da się usunąć.** Nagrania to surowy tekst i to jest
decyzja z uzasadnieniem (`src/recorder.ts:1‑16`: „Statystyki zamrożone w JSON‑ie
są bezużyteczne w dniu, w którym łatamy lukę w parserze"), a wklejanie logu
z „Kopiuj logi" nie ma innej drogi. Etap 3 znaczy **dwa źródła obok siebie**,
nie zamianę — czyli więcej kodu, nie mniej.

**Sprzężenie z wnętrzem klienta rośnie.** `docs/DECYZJE.md:266`: format tekstu nie
drgnął przez kilkanaście zrzutów, wewnętrzne struktury takiej gwarancji nie mają.
Kształt `t` jest kontraktem, którego nikt nam nie obiecał; `battleMsg` z `case`
per klucz jest za to najlepszą możliwą listą tego, czego szukać, gdy się zmieni.

## Odrzucone warianty

**Renderer grooove `battle_engine.js` jako źródło.** Pytanie wyjściowe tej rundy.
222 etykiety wobec 240 w kliencie gry, dialekt kluczy skompresowany (`dmg`→`D`,
`heal`→`l`, plus jednoliterowe aliasy: `T`=blok, `U`=unik, `R`/`O`=absorpcja
fizyczna/magiczna, `P`=kontra, `E`=przebicie, `F`=obniżenie pancerza), 227 linii
„Nieznany parametr" w pomiarze repo — i rozjazd brzmień („Ciężka rana" wobec
„Głęboka rana"). Cudza reimplementacja zawsze będzie do tyłu za grą; ta jest
z 2021 roku (`v=7`, `Page.version: '12-05-2021-1'`). **Jeden pożytek zostaje:**
jej plik jest słownikiem skrótów, którym korpus grooove daje się przełożyć na
klucze gry. To argument za przeczytaniem go raz, nie za oparciem się na nim.

**Odpytywanie `Engine.battle` bez podmiany `update`** — czyli rozbudowa tego, co
robi już `src/roster.ts`. Przekreślone mechaniką: protokół istnieje **wyłącznie
w argumencie wywołania** i nigdzie nie osiada. `Engine.battle` po zakończeniu
`update` niesie stan (wojownicy, życie, tura), nie zdarzenia. Odpytywanie daje
krzywą życia i nic więcej — to jest wariant „bez protokołu".

**`API.addCallbackToEvent`** — furtka zapisana w `docs/DECYZJE.md:245`. Daje
sygnał „coś się stało", nie ładunek `t`. Zastąpiłaby `MutationObserver` jako
wyzwalacz, zostawiając źródło danych bez zmian. Wariant do powrotu, gdyby
podmiana `update` okazała się zbyt krucha — wtedy jako tańszy wyzwalacz dla
dzisiejszej ścieżki tekstowej, nie jako źródło.

**Konwerter protokół → tekst gry, żeby korpus grooove wszedł do parsera.**
Zabroniony przez `tests/fixtures/grooove/README.md:34` i zabroniony słusznie:
musiałby wymyślać brzmienie zdań. ⚠️ **Ten powód częściowo zniknął 2026‑08‑04** —
`tools/slownik.ts` bierze brzmienia z assetu gry, więc nie są wymyślone. Nie
przywraca to wariantu w całości (zdanie składa się nie tylko z szablonu: dochodzi
odmiana przez `#`/`$`, sklejanie kilku kluczy w jedną linię, kolejność, `<br>`),
ale **przestaje być niemożliwy i zasługuje na ponowne zważenie**, gdyby korpus
tekstowy nadal nie pokrywał jakiegoś klucza.

**Przełączenie źródła w tej rundzie.** Nie ma pary, więc nie ma jak zweryfikować.
Dodatkowo `src/parser.ts` ma otwartą własną rundę
(`2026-08-03-parser-tokenizer-i-gramatyka.md`, status `projekt`) — dwie
przebudowy tego samego pliku naraz nie mają jak się nawzajem sprawdzić.

**Sonda jako flaga budowania w userscripcie zamiast wklejki do konsoli.**
Odrzucone kosztem: `tools/engine-probe.js` działa od miesiąca jako wklejka
i to wystarcza do zebrania fixture'ów. Flaga w `build.ts` dokłada ścieżkę kodu,
która musi przeżyć każdą zmianę i której nikt nie testuje.

## Plan wdrożenia

Każdy commit przechodzi `bun run check` osobno. `src/` nietknięte, więc wpis
w `CHANGELOG.md` nie jest potrzebny — `docs`, `test` i `build` zwalniają same
z siebie (`SILENT_TYPE` w `tools/wydanie.ts`).

1. **`docs(specy): protokół silnika jako źródło parsera`** — ten plik plus
   wiersz w `docs/specy/README.md`.
2. **`build(slownik): klucz protokołu dostaje dosłowne zdanie z assetu gry`** —
   `tools/slownik.ts` + `tests/slownik.test.ts`.
3. **`build(walka): sonda protokołu i rozbicie zrzutu na fixture`** —
   `tools/walka-probe.js`, `tools/walka.ts` + `tests/walka.test.ts`.
4. **`docs(mechanika,roadmap)`** — wpisy o `+rage` i `anguish` przechodzą
   z „nie wiemy, jak brzmi" na cytat z assetu; `ROADMAP.md:134‑151` traci zdanie
   o niemożliwości zebrania pary.

Kroki 2 i 3 są niezależne — kolejność wynika z tego, że słownik jest gotowy do
użycia od razu, a sonda czeka na to, aż ktoś stoczy walkę.

## Weryfikacja

**Czego te testy pilnują.** Nie tego, co mówi gra — to zmienia się poza nami
i ma własny rejestr. Tego, żeby narzędzie nie **zgubiło** trafienia ani nie
podało **cudzego**: fałszywy negatyw zamyka temat w repo, co zdarzyło się tu
dwa razy (`docs/MECHANIKA.md`).

- **`tests/slownik.test.ts`** — na syntetycznych wejściach, bez sieci (wzór
  `tests/pomoc.test.ts`). Przypadki: fallthrough `case"a":case"b":` daje zdanie
  OBU kluczom; `_t("msg_only_val_"+O[0])` skleja identyfikator; klucz z pustym
  ciałem (`case"x":break`) daje „gra tego nie wypisuje", a nie „nie znaleziono" —
  to dwie różne odpowiedzi i tylko druga jest luką.
- **`tests/walka.test.ts`** — round‑trip rozbicia ładunku, niezmiennik „liczba
  komunikatów `t.m` = liczba sparowanych węzłów renderu", szkielet `meta.json`
  z `"DO UZUPEŁNIENIA"` (konwencja z `tools/grooove.ts:410`).

**Że test potrafi paść.** Na zielonych testach zepsuć dziedziczenie fallthrough
w `kluczeRenderera` (usunąć pętlę wstecz) i potwierdzić, że zapala się przypadek
`case"a":case"b":` — dokładnie ten defekt zjadł tu 22 klucze przy pierwszym
podejściu (202 → 224 rozwiązanych po naprawie). Wynik wpisać w komunikat commita.

**Sonda jest przeglądarkowa i testu jednostkowego mieć nie będzie** — to trzeba
powiedzieć wprost, a nie ukryć pod pokryciem `walka.ts`. Weryfikuje ją jedno
przejście na żywo: wklejenie w konsolę, stoczenie walki, `zrzut()`,
`bun tools/walka.ts --rozbij`, `--pokaz`, i ręczne porównanie pierwszych
zdarzeń z tym, co pokazało okno walki.

## Co zostaje otwarte

- **Pary nadal nie ma.** Etap 2 jest zablokowany do czasu, aż ktoś stoczy walkę
  z wklejoną sondą i naciśnie „Kopiuj logi". Ta runda usuwa przeszkodę
  narzędziową, nie samą lukę.
- **Tabela mapowania żywiołów** protokół ↔ `dmgX` nie powstaje tutaj. Wyprowadza
  się ją z pary, a nie zgaduje — mimo że gałąź `default` w `battleMsg` sugeruje
  odpowiedniość wprost, sugestia nie jest pomiarem.
- **Nagrania.** `src/recorder.ts` ma jedyne w repo wersjonowanie formatu (`v: 1`)
  i trzyma surowy tekst. Źródło protokołowe będzie wymagało `v: 2` albo drugiego
  formatu — nierozstrzygnięte, bo zależy od etapu 3.
- **Trwałość `case`‑ów.** 236 kluczy to stan builda `1785244275300`. Nic nie
  pilnuje, czy się nie rozjechał; `tools/slownik.ts --odswiez` to jedyna dziś
  odpowiedź i jest ręczna, tak samo jak `wiek()` w `tools/pomoc.ts`.
- **16 nierozwiązanych etykiet** — rozdzielenie „gra tego nie wypisuje" od
  „nie umiemy znaleźć zdania" jest zrobione dla pustych ciał, ale `+crush_*`
  (6 kluczy) i `+of_dmg` zostają niewyjaśnione.
- **Sprzeczność z `docs/DECYZJE.md:266`** („uzupełnienie, nie zamiennik") nie
  jest tą rundą rozstrzygnięta, tylko przeniesiona: decyzja o etapie 3 zapadła,
  ale zdanie w rejestrze zostaje, dopóki kod go nie unieważni.

## Zmiany wpisu

- **2026-08-04** — powstał.
- **2026-08-04** — dwa sprostowania z rundy
  [`2026-08-04-zrodla-klienta-z-buildu-deweloperskiego.md`](2026-08-04-zrodla-klienta-z-buildu-deweloperskiego.md).
  (1) Pozycja „16 nierozwiązanych etykiet" wyżej jest nieaktualna: `--braki`
  daje dziś 233 etykiety, 223 ze zdaniem, **0 do wyjaśnienia**, a `+crush_*`
  rozwiązuje się przez `eng_game_only_val_+crush %val%` → „+Zmiażdżenie %val%%".
  Obie liczby są z tej samej doby i tego samego builda — rozjazd zrobiło
  narzędzie między pomiarami, nie gra. (2) Odtwarzanie renderera przez
  dopasowywanie klamr ma teraz alternatywę: `experimental.margonem.pl` serwuje
  build deweloperski z inline'owymi source mapami, więc `BattleMessages.js`
  i `Battle.js` da się czytać w oryginale (`bun tools/zrodla.ts --pokaz …`).
  Wnioski o gałęzi `default` z tego speca **potwierdziły się** w źródle.
- **2026-08-04** — trzy sprostowania z rundy
  [`2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md`](2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md).
  (1) **„240 etykiet `case`, 236 kluczy” liczy za dużo.** `battleMsg` ma w środku
  zagnieżdżone przełączniki (rodzaj zmiażdżenia, `wrapper`), których etykiety
  kluczami protokołu nie są. Operacyjna liczba to **233**, z produkcji, metodą
  `bun tools/slownik.ts --braki` — narzędzie odsiewa je od 2026‑08‑04.
  (2) **Linii otwierającej walkę w protokole NIE MA.** `Battle.js:945` pokazuje,
  że klient sam woła `battleMsg('0;0;txt=' + _t('battle_starts_between …'))`,
  poza pętlą po `data.m`. Tabela „co protokół daje ponad DOM” tego nie
  przewidywała — `fight-start` trzeba będzie syntetyzować ze składu.
  (3) **Para tekst↔protokół per komunikat jest z zewnątrz nieosiągalna.** Tekst
  forumowy powstaje w tej samej pętli (`BattleMessages.js:1186`), ale instancja
  `BattleMessages` jest modułowo prywatna (`Battle.js:36`). „Kopiuj logi”
  zostaje krokiem ręcznym, a sonda musi dalej zbierać węzły `.battle-msg`.
