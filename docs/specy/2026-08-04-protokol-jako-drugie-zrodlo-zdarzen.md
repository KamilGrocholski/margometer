# Drugie źródło `BattleEvent` — dekoder protokołu i czujka rozjazdu

Status: wdrożone · 2026-08-04 · f33a04c (3a, etap 2 i 3b)

Trzeci z trójki. Sąsiedzi:
[`2026-08-04-protokol-silnika-jako-zrodlo-parsera.md`](2026-08-04-protokol-silnika-jako-zrodlo-parsera.md)
pyta, **co** gra wysyła do okna walki, i robi etap 1 (narzędzia);
[`2026-08-04-zrodla-klienta-z-buildu-deweloperskiego.md`](2026-08-04-zrodla-klienta-z-buildu-deweloperskiego.md)
pyta, **skąd** to czytamy. Ten projektuje **etap 3**: kod w `src/`.

Nazwa mówi o **czujce**, nie o „przełączeniu źródła”, i to nie jest ostrożność
w tytule. Powód stoi w „Rozwiązaniu” i jest właściwą treścią tej rundy.

## Problem

Etap 1 dał narzędzia i wiedzę: gramatykę komunikatu, tabelę klucz → zdanie
z assetu gry, oryginalne źródła renderera. Czego nie dał — kodu, który z tego
korzysta, i pary walk do weryfikacji. Etap 2 (orakulum liczbowe) jest bez pary
zablokowany. Pytanie tej rundy brzmi więc: **czy da się zbudować cokolwiek
sensownego, zanim ktoś stoczy walkę z wklejoną sondą.**

### Stan zmierzony, nie założony (2026‑08‑04)

- `tests/fixtures/new-engine/` — **24 katalogi, 0 plików `protokol.json`**.
  Wszystkie mają `raw.txt` + `log.html` + `meta.json`. ⚠️ Pola `format` **nie ma
  w 13 z 24** (doszło 2026‑07‑28), więc zdania „wszystkie są `text+html`”
  napisać nie wolno — 3 mówią `html`, 8 `text+html`, reszta milczy.
- Pary „ta sama walka jako tekst i jako protokół” nie ma żadnej.
- Ale rozpakowane źródła klienta siedzą w `.cache/margonem-zrodla-1781609507010/`,
  a produkcyjną tabelę kluczy zwraca dziś jedna komenda:

```
$ bun tools/slownik.ts --braki
build 1785244275300 — 233 etykiet renderera, 223 ze zdaniem
10 bez zdania, w tym 0 do wyjaśnienia
```

**Blokada jest więc niesymetryczna.** Zrzutu potrzebują LICZBY. Struktury —
nie: zbiór kluczy, które gra umie wysłać, jest skończony, policzalny i policzony.

### Sprostowanie: „240 etykiet, 236 kluczy” z sąsiedniego speca to trzecia liczba w trzech dokumentach

Sąsiedni spec pisze o 240 etykietach i 236 kluczach; drugi — o 233/223; goły
`grep -c "case '"` na źródle dev daje 238 wierszy i 234 unikalnych etykiet.
Rozjazd zrobiły **zagnieżdżone przełączniki**, nie gra: `battleMsg` ma w środku
drugi `switch` po rodzaju zmiażdżenia (`fire`/`frost`/`light`/`physical`/`distance`)
i trzeci po `wrapper` (`attack`/`attack2`), a ich etykiety kluczami protokołu nie są.
`tools/slownik.ts` już to odsiewa (`etykietyRenderera` bierze tylko głębokość
pierwszą — komentarz przy funkcji opisuje, jak `case"fire"` ucinało ciało
`+crush_physical`).

**Operacyjną liczbą tego speca jest 233** — z produkcji, z builda
`1785244275300`, metodą `bun tools/slownik.ts --braki`, data 2026‑08‑04.
Każda inna liczba w repo ma przy sobie inną metodę i nie jest z tą sprzeczna.

### Trzy ustalenia ze źródła, które przewracają założenia o kształcie kodu

Cytaty z `.cache/margonem-zrodla-1781609507010/src/js/Margonem/core/battle/`,
build **deweloperski 1781609507010 (2026‑06‑16)** — sześć tygodni starszy od
produkcji, co dla struktury wystarcza, a dla brzmień nie (patrz sąsiedni spec).

**1. `fight-start` NIE JEST w protokole.** `Battle.js:945`:

```js
BattleMessages.battleMsg('0;0;txt=' + _t('battle_starts_between %grp1% %grp2%', {
        '%grp1%': flist1Join, '%grp2%': flist2Join
    }));
```

To wywołanie stoi **poza pętlą po `data.m`** (ta jest w `Battle.js:460‑462`).
Linię otwierającą klient **syntetyzuje sam**, ze składu dzielonego przez
`team != 2` (`Battle.js:935‑936`). Konsekwencja dla nas: zdarzenie `fight-start`
nie przyjdzie ze strumienia i musi powstać z listy wojowników.

**2. Gra obcina wartość na DRUGIM `=`.** `BattleMessages.js:176`:

```js
var m = msg[k].split('=');   // dalej używane wyłącznie m[0] i m[1]
```

Klucz to `m[0]`, wartość — fragment **między pierwszym a drugim** `=`. Reszta
przepada po stronie gry. Dekoder ma gubić zgodnie, ale **głośno**: trzeci
segment to sygnał, że gra też coś gubi, a my o tym nie wiedzieliśmy.

**3. Jeden komunikat to cały BLOK, nie linia.** `battleMsg` zbiera do trzech
szczelin `tm[0..2]` plus akumulatory `attack` / `take` / `takenum`, a zdania
„uderzył z siłą” / „otrzymał” powstają dopiero na końcu i tylko warunkowo
(`BattleMessages.js:1127`, w gałęzi `if (attack != '')`). Wszystko to ląduje
w **jednym** węźle `.battle-msg` (`:1196`).

To jest najważniejsza wiadomość dla projektu: **dekoder nie potrzebuje maszyny
stanów po liniach**, bo dostaje w całości to, co `src/parser.ts` mozolnie skleja
z kolejnych linii. Stan zostaje jeden — zapowiedź umiejętności, bo przychodzi
osobnym komunikatem (widać to w korpusie grooove: `…;p_.Porażenie;skillId.70`,
a obrażenia dopiero w następnym).

### Czego z narzędzi etapu 1 wziąć NIE można

`stronyKomunikatu` z `tools/walka.ts:144‑157` kończy się filtrem:

```ts
.filter((s): s is { id: number; hpp: number | null } => s !== null);
```

Dla `"0;103655=96.08;…"` zwraca tablicę **jednoelementową**, w której nie da się
odróżnić nadawcy od celu. Do histogramu to wystarcza, do dekodowania nie —
`src/protokol.ts` potrzebuje jawnych pól `nadawca` / `cel`, oba `| null`.

## Rozwiązanie

**Etap 3 dzieli się na dwie części o różnym stopniu zablokowania.** To jest
sedno tej rundy.

- **3a — dekoder i czujka.** Nie jest zablokowana niczym. Puszcza protokół
  **obok** tekstu i porównuje wyniki. Produktem jest **głos**, nie liczba.
- **3b — panel liczy z protokołu.** Zablokowana twardo: bez pary nie da się
  odróżnić „nowe liczby są lepsze” od „nowe liczby są inne”. Tu leży też cały
  koszt nagrań i archiwum.

### Dlaczego czujka, a nie od razu przełącznik

Test przynależności z `docs/ROADMAP.md`:

> *czy jej brak może sprawić, że panel pokaże złą liczbę, nie mówiąc o tym ani
> słowem?*

**3a odpowiada TAK** — i to jest najmocniejszy argument tej rundy. Dziś, gdy
`parse` odczyta liczbę źle przy zerze `unknown`, panel pokaże złą liczbę i nie
powie nic. Nic tego nie złapie, bo wszystkie testy są wewnętrzne — i były
zielone także wtedy, gdy `mergeStats` gubiło sumy (`AUDYT‑6`). Protokół jest
jedynym niezależnym świadkiem w zasięgu.

**3b odpowiada NIE.** Przełączenie źródła bez pary nie zmniejsza szansy na złą
liczbę — przenosi ją na kod, o którym wiemy mniej.

Różnica jest w trybie awarii i ona rozstrzygnęła: **czujka, która myli się
o protokole, wypisze fałszywy alarm; przełącznik, który myli się o protokole,
pokaże złą liczbę po cichu.**

### Cztery warstwy, jedna zależność w dół

```
komunikat: string
   │  1 — rozbiór (składnia, zero semantyki)
   ▼
Komunikat { nadawca, cel, parametry[] }
   │  2 — tabela KLUCZE (dane, nie kod)
   ▼
Rola per parametr
   │  3 — dekoduj() (redukcja parametrów do zdarzenia)
   ▼
BattleEvent[]
   ▲  4 — EngineProtocolSource (owija Engine.battle.update)
```

Trzy pierwsze są czyste i testowalne offline. Czwarta dotyka gry i dlatego
siedzi w osobnym pliku — ma być widoczna w drzewie, nie schowana.

**Warstwa 1 — `src/protokol.ts`, rozbiór bez trybu porażki.**

```ts
/** Strona komunikatu. `null` = „ten komunikat nie ma tej strony”, nie „id 0”. */
export type Strona = { id: number; hpp: number | null };

/**
 * `wartosc === null` to parametr-flaga (`+pierce`, `r`).
 * `obciete === true` — w segmencie stał drugi `=`; gra też go gubi
 * (`BattleMessages.js:176`), więc gubimy zgodnie, ale zapalamy czujkę.
 */
export type Parametr = { klucz: string; wartosc: string | null; obciete: boolean };

export type Komunikat = {
  nadawca: Strona | null;
  cel: Strona | null;
  parametry: Parametr[];
  /** Segment w oryginale — materiał dla `unknown.line`. */
  surowy: string;
};

export function rozbierz(komunikat: string): Komunikat;
```

Brak trybu porażki jest odwzorowaniem gry: `msg.split(';')` nie zawodzi.
Porażka ma być widoczna nie tu, tylko na **kluczu** — jako `unknown`. To ta sama
zasada, co „leksyka totalna” z [`2026-08-03-parser-tokenizer-i-gramatyka.md`](2026-08-03-parser-tokenizer-i-gramatyka.md),
tyle że po stronie protokołu wychodzi za darmo.

**Warstwa 2 — tabela kluczy jako DANE.**

```ts
export type Rola =
  | { typ: "cios" }                                        // +dmgX  (reguła, nie wpis)
  | { typ: "przyjete" }                                    // -dmgX
  | { typ: "ciosProc"; etykieta: string }                  // +thirdatt: liczba I proc
  | { typ: "proc"; etykieta: string }                      // +crit, +pierce, +wound, +rage…
  | { typ: "blok" } | { typ: "unik" }                      // -blok=N, -evade
  | { typ: "dot"; rodzaj: string; przyimek: "od" | "po" }  // poison, wound, anguish…
  | { typ: "leczenie"; self: boolean }                     // heal, afterheal, heal_target
  | { typ: "zapowiedz" }                                   // tspell, prepare
  | { typ: "koniec"; wynik: "victory" | "defeat" | "draw" }
  | { typ: "tekst" }                                       // txt
  | { typ: "tlo"; powod: string }                          // gra pisze zdanie, my nie liczymy
  | { typ: "cisza"; powod: string };                       // gra NIE pisze nic

export const KLUCZE: Readonly<Record<string, Rola>>;
/** Gałąź `default` renderera, obliczana zamiast wyliczana wpisami. */
export function rolaDomyslna(klucz: string): Rola | null;
```

Dwie rzeczy w tej warstwie mają uzasadnienie w źródle, nie w guście:

- **`{typ:"cisza"}` to nie to samo, co brak wpisu.** Gra ma klucze z pustym
  ciałem (`case 'skillId': break;`, `balloflight`, `active_decblock_per`).
  Brak wpisu u nas = luka; `cisza` = „gra też milczy”. Rozróżnienie istnieje już
  w `tools/slownik.ts` jako `werdykt: "nic" | "bez-zdania" | "luka"` i tu wraca
  jako typ. Dziś takich kluczy jest **10 z 233**, w tym **0 do wyjaśnienia**.
- **`rolaDomyslna` odwzorowuje `default:` z `BattleMessages.js:1102‑1117`**
  (`substr(1,3) === "dmg"`). Nie wpisujemy kluczy `+dmg*` ręcznie, bo gra ich
  też nie wpisuje — a wpisanie zamknęłoby listę tam, gdzie gra ma ją otwartą.

**Warstwa 3 — dekoder, czysty.**

```ts
/**
 * Zamienia komunikaty JEDNEJ walki na zdarzenia.
 *
 * Bierze całą walkę, nie porcję — tak samo jak `session.ts:53‑57` parsuje cały
 * bufor od nowa zamiast doklejać przyrosty. Powód jest ten sam (stan przyrostowy
 * to podwójne liczenie), a zysk dodatkowy: funkcja zostaje czysta, więc daje się
 * przetestować bez gry.
 *
 * `sklad` służy WYŁĄCZNIE zamianie `id` na nazwę — nazwa jest kluczem-etykietą
 * w `stats.ts`. Bez składu zdarzenia nie powstają: zmyślenie nazwy jest zakazane.
 */
export function dekoduj(
  komunikaty: readonly string[],
  sklad: readonly RosterEntry[],
): BattleEvent[];
```

**Warstwa 4 — `src/protokol-source.ts`, jedyne miejsce dotykające gry.**

```ts
/**
 * Źródło ZDARZEŃ, nie tekstu. Osobny typ, nie generyk nad `LogSource`:
 * tamten obiecuje „pełna treść bufora po każdej zmianie”, ten — „wszystkie
 * zdarzenia walki po każdej porcji”. Wspólna jest tylko nazwa metody.
 */
export type EventSource = {
  subscribe(listener: (events: BattleEvent[]) => void): () => void;
};

export class StaticProtocolSource implements EventSource { … }   // odpowiednik StaticLogSource
export class EngineProtocolSource implements EventSource {
  constructor(window: GameGlobals, roster: RosterSource);
}
```

Mechanika owinięcia **przeniesiona z `tools/walka-probe.js:46‑168`**, nie
wymyślona tutaj: zegar pilnujący TOŻSAMOŚCI obiektu `battle` (gra go podmienia
między walkami), znacznik `__margometer`, zdjęcie warstwy tylko wtedy, gdy na
wierzchu stoi nasza. Trzy twarde wymagania, każde z powodem:

1. **Oryginał leci pierwszy, jego wynik wraca nietknięty.** To nie wygoda, tylko
   warunek obietnicy „nie zmieniamy przebiegu walki”.
2. **Wyjątek z naszego kodu nie wychodzi do gry.** `try/catch` szczelniejszy niż
   `index.ts:38‑44` — bo tam awaria psuje panel, a tu psułaby **turę graczowi**.
3. **`unsubscribe` przywraca oryginał.** Inaczej `boot()`/`stop()` zostawia łatę
   na cudzej funkcji do końca życia karty.

### Wpięcie w istniejący łańcuch

`src/session.ts` — druga metoda, trzy linie, zero ryzyka:

```ts
update(text: string, fromGame?: RosterEntry[] | null): void {
  this.updateEvents(parse(text), fromGame);          // ← jedyna zmiana ciała
}

updateEvents(events: BattleEvent[], fromGame?: RosterEntry[] | null): void {
  const fights = splitFights(events).filter((e) => e.length > 0);
  const last = fights.at(-1);
  this.currentStats = last ? aggregate(last, fromGame) : EMPTY_STATS;
}
```

`splitFights` działa bez zmian — dzieli po `fight-start`, a ten z protokołu
powstaje z klucza `txt`. **`index.ts:153` nie jest ruszany**: `DomLogSource`
dalej karmi panel, nagrywarkę i archiwum. Czujka wchodzi obok, drugim spięciem.

### Nagrywarka i archiwum — NIE RUSZAMY, i to jest projekt, nie odkładanie

Dopóki panel liczy z tekstu, trzy zdania z repo zostają prawdziwe:
`recorder.ts:1‑16` („pozwala przeliczyć stare nagrania nowym parserem”),
`index.ts:31‑32` („nagranie odtwarza WEJŚCIE licznika”) i cztery wywołania
`parse` w `archive.ts`. Z tego ostatniego `archive.ts:380` przewija walkę
**linia po linii** (`replay.lines.slice(0, at)`) — a protokół nie ma linii, ma
komunikaty. To nie podmiana wywołania, tylko inna jednostka przewijania.

3b unieważnia wszystkie trzy **naraz** i dlatego jest osobną rundą.

### Odwzorowanie klucz → zdarzenie

Kształt tabeli to **redukcja parametrów do akumulatora**, odwzorowująca to, co
robi `battleMsg` swoimi `attack`/`take`/`takenum`/`tm[]`. Odwzorowanie struktury,
której źródło umiemy przeczytać, jest tu argumentem samym w sobie.

```
"1=100.00;2=40.37;+dmgd=455;+pierce;-dmgd=455"
   ├─ nadawca {id:1, hpp:100}        → source, sourceHpPct
   ├─ cel     {id:2, hpp:40.37}      → target, targetHpPct
   ├─ +dmgd=455   rolaDomyslna→cios      → hits[0].raw = 455, element = ELEMENTS["d"]
   ├─ +pierce     KLUCZE→proc            → procs.push("Przebicie")
   └─ -dmgd=455   rolaDomyslna→przyjete  → hits[0].applied = 455
                                        ⇒ jedno {kind:"attack", strike:true, …}
```

Kilka gałęzi wprost ze źródła, żeby tabela nie była zgadywana:

| klucz | źródło | zdarzenie |
|---|---|---|
| `+dmgX` / `-dmgX` | `default`, `:1109` / `:1113` | `attack.hits[]`, żywioł z litery `X` |
| `+thirdatt=N` | `:622‑625` — **`tm[1]` I `attack +=`** | `hits[]` **oraz** proc „+Trzeci cios” |
| `-blok=N` | `case '-blok'` → `msg_-blok %val%` | `attack.blocked` |
| `-evade` | `case '-evade'` | `attack.dodged` |
| `heal=N` / `N,M` | `case 'heal'`, `msg_heal %gain_lost% …` | `heal`; znak `N` daje „Przywrócono/Stracono” |
| `anguish=N` | `case 'anguish'` | `dot` |
| `tspell=N` | `case 'tspell'` → `msg_tspell %name%` | `ability` („X wykonuje Y”) |
| `skillId=N` | `case 'skillId'` → puste ciało | `cisza` — klucz strukturalny |
| `winner` / `loser` | `case 'winner'` … | `fight-end` |
| `txt=` | `case 'txt'` | `info`; tędy wchodzi syntetyczna linia otwarcia |

**Parowanie `+dmgX` z `-dmgX` idzie po KOLEJNOŚCI w komunikacie** — tak jak gra
skleja `attack` i `take` w kolejności pętli `for (var k in msg)`. To **inny
algorytm** niż `pairApplied`/`buildHits` w `parser.ts` i to jest zamierzone
(odrzucony wariant 6).

### Nieznane ma być głośne — na poziomie KLUCZA

Gra ma własne `unknown` i ono dyktuje kształt naszego (`BattleMessages.js:1117`):

```js
else tm[2] += _t('msg_unknown_prameter %val%', {'%val%': msg[k]}) + '</b><br>';
```

`%val%` to **cały segment `klucz=wartosc`**. Więc:

```ts
{ kind: "unknown", line: parametr.surowy, lineNo: nrKomunikatu }
```

- `line` = cały segment, dosłownie ten, który gra by wypisała. Cytat, nie wynalazek.
- `lineNo` = indeks komunikatu w walce — ten sam ordinal, który gra przekazuje do
  `battleMsg` jako `indexMsg`. Nie zmyślamy numeru linii, bo linii nie ma.
- **Nieznany klucz NIE kasuje reszty komunikatu.** Emitujemy `attack` *i*
  `unknown`. To ostrzej niż dziś, gdzie nierozpoznana bywa cała linia albo nic.

### Dowód pokrycia — rzecz, której ścieżka tekstowa mieć nie może

Do repo wchodzi `tests/fixtures/klucze-protokolu.json`: nazwa builda, data,
metoda i lista etykiet. Kilka kilobajtów. Test offline sprawdza **domknięcie
zbioru w obie strony**: każdy klucz gry ma u nas wpis, `rolaDomyslna` albo jawną
pozycję na liście znanych luk; każdy nasz wpis stoi na liście gry.

Korpus tekstowy ma zero `unknown` i — jak mówi `ROADMAP.md` — „sam z siebie nie
mówi nic o tym, czego parser NIE rozpoznaje”. Tu lista tego, co gra umie
powiedzieć, jest skończona i policzalna. **To jest jedyne miejsce w repo, gdzie
pokrycie da się domknąć, a nie tylko oszacować.**

Wcommitowanie **listy kluczy** (nie źródeł) rozstrzyga napięcie zostawione przez
sąsiedni spec: tamten słusznie odrzucił 5,8 MB cudzego kodu w historii gita, ale
zostawił cytaty niesprawdzalne bez sieci. Lista kluczy to trzecia kategoria —
nie kod gry, tylko **nasz pomiar gry z datą i numerem builda**, dokładnie jak
`clientBuild` w `meta.json`.

### Kształt czujki

- Porównanie **wyłącznie na koniec walki** (klucz `{typ:"koniec"}`). W trakcie
  obie drogi mają inną kadencję — DOM z `MutationObserver`, protokół z `update` —
  i porównanie w locie dałoby fałszywe alarmy z samego przesunięcia.
- Porównywane **skalary per etykieta**: zadane, przyjęte, leczenie. Rozbicia
  i procy nie — tam różnica bywa różnicą definicji, nie błędem.
- Wynik idzie **osobnym wejściem do overlaya**, nie przez `BattleStats`:

```ts
export type Rozjazd = { etykieta: string; pole: string; zTekstu: number; zProtokolu: number };
export function rozjazdy(zTekstu: BattleStats, zProtokolu: BattleStats): Rozjazd[];
```

Powód, żeby NIE wkładać tego w `BattleStats`: `aggregate` nie wie o protokole
i nie ma się dowiedzieć, a archiwum trzyma `BattleStats` z nagrań, w których
protokołu nie było — pole zawsze puste twierdziłoby „zgodne”, czyli kłamałoby
o niczym.

### Jedna tabela żywiołów, ale tylko siedem wpisów

`ELEMENTS` (`parser.ts:25‑55`) przenosi się do `types.ts`, gdzie stoją już
`PROFESSIONS`, `ELEMENT_MARKER` i `UNKNOWN_ELEMENT`. ⚠️ **Dwa z dziewięciu
wpisów do protokołu nie należą** i zostają przy ścieżce tekstowej:

- `p → fizyczne` — kod `p` wymyśla `source.ts:80` (`damage[1] || "p"`) dla klasy
  `dmg` bez litery; klucza `+dmgp` w protokole nie ma;
- `"3" → trzeci cios` — to `THIRD_STRIKE_CODE` z `source.ts:57`, nasz. Protokół
  ma na to osobny klucz `+thirdatt`, który przy okazji jest procem.

Przechodzi więc siedem: `f l c a d o g`.

## Odrzucone warianty

**1. Konwerter protokół → tekst gry, podawany istniejącemu `parse`.** Najtańszy:
zero zmian w `session.ts`, cała siła dzisiejszych testów parsera za darmo.
Sąsiedni spec zauważył, że zakaz z `tests/fixtures/grooove/README.md:34` osłabł,
bo brzmienia da się wziąć z assetu. **Przekreśla go jednak co innego: konwerter
czyni czujkę ślepą.** Obie strony porównania przechodziłyby przez `parse`, więc
błąd `parse` byłby niewidoczny — a to jedyny powód, dla którego ta runda
istnieje. Do tego zamiana klucza `+dmgd` na zdanie i z powrotem to krok w stronę,
z której uciekamy. ⚠️ **Wariant zostaje właściwą odpowiedzią na INNE pytanie** —
„jak wpuścić korpus grooove do parsera” — i tam może wrócić.

**2. `protokol.ts` jako trzeci `LogSource`.** Albo emituje tekst (wtedy to
wariant 1), albo trzeba uogólnić `LogSource` do `LogSource<T>`. Odrzucone na
kontrakcie: `LogSource` obiecuje „pełna treść bufora po każdej zmianie” i tę
obietnicę spełniają oba dzisiejsze źródła. Protokół obiecuje co innego.
Trzylinijkowy `EventSource` jest tańszy niż generyk wiążący `MutationObserver`
z podmianą funkcji silnika i zmuszający `start()` do rozgałęzienia po ładunku.

**3. Przepisanie `parse` na protokół i porzucenie tekstu.** Odrzucone trzema
faktami z repo, nie preferencją. (a) Nagrania są surowym tekstem z uzasadnieniem
(`recorder.ts:1‑16`); przełączenie unieważniłoby zawartość kubełka użytkownika.
(b) Wklejka z „Kopiuj logi” nie ma innej drogi — a `forumLog`
(`BattleMessages.js:1186`) powstaje z tego samego `tm`, więc tekst z gry nie
zniknie. (c) 24 fixture'y to materiał dowodowy o **tekście**; skasowanie
czytelnika kasuje ich sens. Etap 3 znaczy **dwa źródła obok siebie — więcej
kodu, nie mniej.**

**4. Odłożenie całości do czasu zrzutu.** Wariant najuczciwiej wyglądający
i dlatego wart najdłuższego akapitu. Odrzucony, bo **blokada jest
niesymetryczna**: struktura wyprowadza się dziś ze źródła, zrzutu potrzebują
wyłącznie liczby. 3a zamienia „brak zrzutu blokuje wszystko” w „brak zrzutu
blokuje ostatni krok”. ⚠️ **Kontrargument, który musi tu stać, bo jest
prawdziwy:** dekoder, którego nie umiemy zweryfikować, może być pewny siebie
i błędny. Dlatego pierwsze wpięcie jest CZUJKĄ — i to jest cała różnica.

**5. Rozszerzenie `roster.ts` zamiast nowego pliku.** Odrzucone dwa razy.
Mechanicznie: protokół istnieje **wyłącznie w argumencie wywołania**, a
`roster.ts` odpytuje stan i tego argumentu nigdy nie zobaczy. Postawą:
`roster.ts` na każdą wątpliwość zwraca `null` — właściwe dla tożsamości,
zabójcze dla zdarzeń, bo po cichu zgubione zdarzenie to dokładnie „zła liczba
bez słowa”. `roster.ts` zostaje bez zmian i **jest importowany** przez
`protokol.ts`: to on daje `id → nazwa`.

**6. Współdzielenie `pairApplied` / `buildHits` z `parser.ts`.** Kuszące, bo te
algorytmy są nietrywialne (unik częściowy, `secondary`). **Odrzucone, bo
duplikacja jest tu produktem.** Wspólna implementacja oślepiłaby czujkę dokładnie
tam, gdzie parser jest najsłabszy: parowanie surowych z przyjętymi po kolejności,
na tekście, jest heurystyką. W protokole `+dmgd` i `-dmgd` stoją w JEDNYM
komunikacie i ich parowanie jest faktem. Jeśli heurystyka się myli, ta różnica
jest jedyną rzeczą, która to pokaże.

**7. Przełączenie panelu w tej samej rundzie.** Odrzucone testem przynależności
z `ROADMAP.md`: tryb awarii to panel inaczej zły, bez ostrzeżenia. Dodatkowo
pociąga `recorder v: 2`, cztery wywołania `parse` w `archive.ts` i przewijanie po
komunikatach zamiast po liniach — rundę większą niż ta, na kodzie, którego nie ma
jak sprawdzić.

**8. Wcommitowanie `BattleMessages.js` jako fixture'a.** Odrzucone tym samym
argumentem, co w sąsiednim specu: cudzy, zastrzeżony kod, na zawsze w historii
gita. Lista kluczy jest kategorią trzecią — patrz „Dowód pokrycia”.

**9. Wspólny `ELEMENTS` przez `export` z `parser.ts`.** Odrzucone na kierunku
zależności: `protokol.ts` importujący z `parser.ts` wiąże dwa źródła, które mają
być niezależne. Stąd przeniesienie do `types.ts`.

## Plan wdrożenia

Każdy commit przechodzi `bun run check` osobno.

| # | commit | `src/` | CHANGELOG |
|---|---|---|---|
| 1 | `docs(specy): protokół jako drugie źródło zdarzeń` | — | zwolniony (`docs`) |
| 2 | `refactor(types): tabela żywiołów wraca do types.ts` | tak | zwolniony |
| 3 | `test(protokol): lista kluczy renderera wchodzi do repo` | — | zwolniony |
| 4 | `feat(protokol): komunikat rozkłada się na strony i parametry` | tak | `[bez-changeloga]` |
| 5 | `feat(protokol): tabela kluczy pokrywa etykiety renderera` | tak | `[bez-changeloga]` |
| 6 | `feat(protokol): dekoduj składa BattleEvent z komunikatów` | tak | `[bez-changeloga]` |
| 7 | `feat(protokol): źródło zdarzeń z Engine.battle.update` | tak | `[bez-changeloga]` |
| 8 | `feat(session): sesja przyjmuje gotowe zdarzenia` | tak | `[bez-changeloga]` |
| 9 | `feat(overlay,index): panel mówi, gdy protokół i tekst liczą inaczej` | tak | **wpis w `[Niewydane]`** |
| — | ⛔ **BRAMA — dalej potrzebny zrzut z gry** | | |
| 10 | etap 2: orakulum liczbowe na pierwszym `protokol.json` | — | |
| 11 | 3b: panel z protokołu, `recorder v: 2`, rozgałęzienie `archive.ts` | tak | wpis |

- **Kolejność 2 przed 4** jest wymuszona: `ELEMENTS` musi stać w `types.ts`,
  zanim dekoder go zaimportuje, a przeniesienie chcemy mieć jako osobny diff
  pusty w skutku.
- **Kroki 4‑8 dokładają do `src/` kod, którego nic nie woła.** To napięcie
  z rundą `2026-08-03-porzucone-funkcje-schodza-z-drzewa.md`, gdzie kod bez
  czytelnika zszedł z drzewa. Rozstrzygnięcie: **okno „ciemnego” kodu trwa tyle,
  co ta runda, a runda kończy się dopiero commitem 9.** Rozbicie służy
  `bun run check` i czytelności diffu, nie wydawaniu — do wydania idzie całość
  albo nic.
- **`AGENTS.md:3‑5` przepisuje commit 7, nie 9.** Obietnica „nie dotyka stanu
  gry” przestaje być prawdziwa w chwili, gdy `EngineProtocolSource` trafia do
  `src/`, nawet jeśli nikt go jeszcze nie woła.
- **Wariant „sonda jako flaga budowania” z sąsiedniego speca wraca i trzeba to
  powiedzieć.** Tamten odrzucił go kosztem („ścieżka kodu, której nikt nie
  testuje”). Usprawiedliwia to różnica: tam owinięcie było **narzędziem** bez
  testów, tu jest **produktem** z testami w jsdom i ze ścieżką przywrócenia.

## Weryfikacja

**Co da się sprawdzić offline, dziś:**

| co | czym | dlaczego to nie jest zgadywanie |
|---|---|---|
| `rozbierz` | syntetyki + niezmienniki | Gra rozbiera komunikat sześcioma liniami (`:120‑140`, `:176`), które umiemy przeczytać. Nasz rozbiór ma być z nimi znak w znak, łącznie z `indexOf('=') > 0` (nie `!== -1`). |
| pokrycie `KLUCZE` | `tests/fixtures/klucze-protokolu.json` | Zbiór kluczy gry jest skończony. Ten test nie pyta, czy rozumiemy klucz — pyta, czy o nim WIEMY. |
| etykiety proców | `tools/slownik.ts` | Brzmienia z assetu produkcji, nie z grooove (który pisze „Ciężka rana”, gdzie gra pisze „Głęboka rana”). |
| `dekoduj` — kształt | pary: komunikat + **dosłowny** HTML z istniejących `log.html` | Wzór stoi w `tests/walka.test.ts:192‑203`. HTML jest z gry; komunikat jest naszą rekonstrukcją — i to trzeba powiedzieć wprost. |
| `EngineProtocolSource` | jsdom + atrapa `GameGlobals` (wzór `roster.ts`) | Zakłada warstwę raz, przeżywa podmianę `battle`, zdejmuje tylko swoją, oddaje wynik oryginału. |
| `updateEvents` | 24 fixture'y | `Session.updateEvents(parse(text))` daje **bajt w bajt** to samo, co dzisiejsze `Session.update(text)`. Darmowe, pilnuje commita 8. |

**Że testy potrafią paść** — do wykonania i wpisania w commity:

- usuń wpis z `KLUCZE` → test pokrycia pada z nazwą klucza; dołóż klucz, którego
  gra nie ma → pada jako zwietrzała tabela;
- `indexOf("=") > 0` → `!== -1` → pada komunikat zaczynający się od `=`;
- usuń obcięcie na drugim `=` → pada czujka `obciete`;
- usuń warunek `__margometer` przy zdejmowaniu → pada „nie zdejmujemy cudzej
  warstwy”; wywal `try/catch` wokół listenera → pada „wyjątek nie wychodzi do gry”.

**Czego offline sprawdzić NIE można — i to nie jest do obejścia:**

1. **Znaczenia drugiej wartości przy kluczach wieloczłonowych.** `wound=a,b`,
   `heal=a,b`, `poison=a,b`. Źródło mówi tylko, że przy dwóch wartościach idzie
   inny szablon; **co znaczy druga liczba, nie mówi ani ono, ani słownik**.
2. **Że dzisiejsza produkcja emituje ten sam zestaw.** Build dev jest z
   2026‑06‑16, produkcyjny z 2026‑07‑28; `--roznica` zmierzył trzy klucze
   różnicy. Lista jest **z pewnością nieaktualna o co najmniej jeden klucz**
   i test pokrycia zamraża to jako fakt, nie jako prawdę.
3. **Że kształt `t` się nie zmienił.** `Battle.js` da się przeczytać, ale nikt
   nam `t.m` nie obiecał.
4. **Że czujka nie krzyczy bez powodu.** Test „czy potrafi paść” jest tu
   trywialny; test „czy nie hałasuje” da się wykonać **dopiero na żywej walce**.
   Mówimy to wprost, zamiast chować pod pokryciem jednostkowym.
5. **Liczby.** Bez pary nie ma orakulum. Etap 2 zostaje zablokowany.

## Co zostaje otwarte

- **Pary nadal nie ma.** Ta runda jej nie zdobywa i nie ma udawać, że zdobywa.
- **Nagrania i archiwum.** Czy `v: 2` niesie komunikaty, czy oba formaty obok
  siebie, i co ze starymi nagraniami — nierozstrzygnięte. Cena 3b, nie 3a.
- **Co robić, gdy czujka krzyknie.** Dziś: napis. Czy kiedyś „wierzymy
  protokołowi” — celowo nierozstrzygnięte: pierwsza odpowiedź ma przyjść
  z danych, nie z projektu.
- **Próg tolerancji czujki.** `damageAbsorbed` ma udokumentowany, nieusuwalny
  rozjazd tekst‑DOM (237 127 wobec 240 025, `parser.ts:561‑578`). Próg ma być
  **zmierzony**, nie wybrany — inaczej użytkownik nauczy się ignorować alarm.
- **Klucze wieloczłonowe.** Dekoder ma je zgłaszać jako `unknown` albo brać
  pierwszą wartość i zapalić czujkę. **Milcząco brać pierwszej nie wolno.**
- **233 klucze to praca, którą łatwo zrobić w 60%.** Tabela z połową ról „na
  razie proc” działa i wygląda na skończoną. Test pokrycia broni przed brakiem
  WPISU, nie przed wpisem złym. To znana granica i jest tu napisana.
- **`docs/DECYZJE.md:266`** („uzupełnienie, nie zamiennik; z gry warto brać
  wyłącznie roster”) **zostaje PRAWDZIWE po 3a** — panel dalej liczy z tekstu,
  a z gry bierzemy roster plus głos kontrolny. Umiera dopiero w 3b i wtedy zdanie
  schodzi z rejestru, nie wcześniej. To rozstrzygnięcie kolizji, nie przeniesienie.
- **Runda tokenizera** traci jeden z trzech filarów, ale **warunkowo**. Jej
  problem 3 (żywioł przemytem przez `ELEMENT_MARKER`, regex dwa razy) protokół
  znosi za darmo — **ale dopiero w 3b**; dopóki panel liczy z tekstu, `marked`,
  `line` i podwójny `exec` są potrzebne w całości. Filarów 1 i 2 (kolejność
  drabiny, `(.+?)`) protokół nie dotyka wcale, a to one niosą tam pomiar.
  Sugerowana kolejność: **3a → tokenizer → 3b**, bo tokenizer w środku dostaje
  czujkę jako niezależnego świadka, którego dziś nie ma.
- **Sprawca DoT‑a i leczącego nadal nieznany.** Druga strona pusta
  (`119444=6.71;0;anguish=3615`). `docs/DECYZJE.md:99‑207` obowiązuje bez zmian.
- **Czy gracz bywa drużyną 2.** `types.ts:40‑43` mówi „strona 0 to drużyna
  gracza”, a `Battle.js:935‑936` dzieli skład przez `team != 2`, niezależnie od
  `myteam`. Obserwowano `myteam: 1` (`DECYZJE.md:281‑283`), więc dziś się to
  zgadza. **Zapisane jako pytanie, nie jako sprostowanie** — dowodu na rozjazd
  nie ma.
- **`docs/MECHANIKA.md` ma dziś dwa szczeble dowodu** (pomoc gry, korpus).
  Źródło klienta jest trzecim i zasługuje na dopisanie do procedury — razem
  z granicą: build dev jest o sześć tygodni starszy od produkcji.
- **Największa nagroda nie wchodzi tutaj.** `id` po obu stronach zdarzenia
  mogłoby zastąpić heurystykę numeracji instancji ze `stats.ts:74‑270`
  (dopasowanie po spadku HP). To zmiana w `stats.ts` i ma własną rundę.
- **Ryzyko, którego nie da się złagodzić projektem:** błąd
  w `EngineProtocolSource` psuje **grę**, nie tylko panel. Stąd trzy wymagania
  z warstwy 4 i `try/catch` szczelniejszy niż gdziekolwiek indziej w `src/`.

## Zmiany wpisu

- **2026-08-04** — powstał.
- **2026-08-04** — **etap 3a wdrożony** (kroki 1‑9, `88e2cf5`…`9a39bb8`).
  Cztery rzeczy wyszły inaczej, niż ten spec zakładał, i wszystkie na korzyść:

  1. **Tabela kluczy jest DUŻO prostsza.** Spec straszył „233 kluczami jako
     pracą łatwą do zrobienia w 60%". Pomiar na ciałach gałęzi: liczby niosą
     **cztery klucze** (`+of_dmg`, `+thirdatt`, `-thirdatt` i gałąź `default`),
     a 217 z 233 tylko wypisuje zdanie. Ciężar leży w leczeniu i DoT‑ach,
     nie w obrażeniach.
  2. **Odwzorowanie DoT‑ów trafia w istniejący kontrakt co do słowa.** Przyimki
     ze słownika gry („obrażeń **od** trucizny", „**po** zranieniu") są
     dokładnie polem `via: "od" | "po"` z `types.ts`. A `heal_target` celujący
     w `f2` jest STRUKTURALNYM dowodem na `heal.self === false`, gdzie
     `types.ts:117‑128` miało dotąd wniosek z brzmienia zdania.
  3. **`KLUCZE` nie niosą polskich etykiet proców** — wbrew szkicowi
     `{typ:"proc"; etykieta:string}` w tym specu. Czujka porównuje SKALARY,
     więc etykiety nie są jej do niczego potrzebne, a 201 zdań powiększyłoby
     userscript bez czytelnika. Etykiety wchodzą dopiero z 3b, jeśli protokół
     kiedyś zasili rozbicia.
  4. **Koszt w userscripcie: 154 622 → 174 038 B (+12%)**, i cały przyrost
     przyszedł w OSTATNIM commicie. Wcześniejsze dawały +0 B, bo bundler wciąga
     tylko to, co osiągalne z `src/index.ts`.

  Sprostowanie do sekcji „Weryfikacja" tego pliku: zapowiadała mutację
  `indexOf("=") > 0` → `!== -1` jako sprawdzian rozbioru. **Ta mutacja nie
  zapala niczego** — obie formy kończą na `NaN`, więc są nierozróżnialne
  wynikiem. Zapis gry został dla czytelności, ale komentarz i test mówią teraz
  wprost, że nic go nie pilnuje.
- **2026-08-04** — **para przyszła, brama etapu 2 otwarta** (`b04af97`…`4f51db5`).
  Ten spec zakładał, że orakulum „ma prawo zapalić się na czerwono przy pierwszym
  fixturze i to jest jego zadanie". Zapaliło się — **dokładnie raz i dokładnie
  jedną pozycją**, a reszta walki zgodziła się co do jednostki.

  1. **Usterka, którą złapało:** `heal` z pustą drugą stroną komunikatu.
     Dekoder wyprowadzał `self` ze strony i kredytował leczenie postaci,
     o której log milczy. To unieważnia zdanie z commita `75b62e0`
     („protokół podaje OBIE strony, więc to fakt, a nie wniosek") — prawdziwe
     tylko dla `heal_target`/`npc_heal`.
  2. **Usterka, której NIE mogło złapać:** gubione `weakenedPct` przy
     `poison=140,14`. `damageWeakened` nie wchodzi do czterech porównywanych
     skalarów. Znalazł ją odczyt słownika gry. **Czujka i czytanie źródeł łapią
     co innego** i żadne z dwojga nie zastępuje drugiego.
  3. **Najmocniejszy pojedynczy dowód nie był liczbą, tylko zgodnością dwóch
     heurystyk.** Dwa NPC o nazwie `Odyniec` rozdzieliły się na `#1` i `#2`
     identycznie, mimo że tekst liczy instancje po spadku życia, a protokół
     po `id`. Pozycja „największa nagroda — `id` zamiast heurystyki
     ze `stats.ts`" z sekcji „Co zostaje otwarte" właśnie dostała pomiar:
     heurystyka miała rację na tym materiale.
  4. **Test NAPISANY POD BŁĄD.** Istniejący test twierdził `self: true` dla
     `heal` i przechodził — powstał razem z dekoderem, z tego samego założenia.
     Wniosek szerszy niż runda: **zielony test nie jest dowodem, gdy autor testu
     i autor kodu wierzą w to samo.**
  5. Dwie rzeczy o sondzie, których spec nie przewidywał: render zbierany po
     długości listy **dubluje węzły** (38 na 18 komunikatów; rekonstrukcja dała
     5345 obrażeń zamiast 2784), a zrzut niesie **569 wywołań, z czego 567
     identycznych** (1,8 MB przy 28 kB treści). Oba załatane po stronie
     narzędzia (`b04af97`, `b18ae10`); przyczyna w sondzie zostaje otwarta.
- **2026-08-04** — **odrzucony wariant 1 WRACA i zostaje wybrany**
  (`248d607`…`2e88825`). Ten spec skreślił „konwerter protokół → tekst gry"
  zdaniem: *„musiałby wymyślać brzmienie zdań"* i drugim: *„konwerter czyni
  czujkę ślepą"*. Pierwszy powód **wygasł** — brzmienia idą z assetu gry
  (`tools/slownik.ts`), więc nic nie jest wymyślane. Drugi **nie dotyczy tego
  zastosowania**: konwerter nie zastępuje czujki w panelu, tylko daje ORAKULUM
  drugą stronę, gdy nie ma złapanego logu. Czujka porównuje protokół z tekstem
  z okna i zostaje bez zmian.

  Co z tego wyszło:

  1. **Fixture protokołowy nie potrzebuje `raw.txt` ani `log.html`.** Niezmiennik
     `dekoduj(komunikaty) ≟ parse(odtworz(komunikaty))` stoi na samym
     `protokol.json`; na pierwszej parze daje 18/18 odtworzonych komunikatów,
     zero linii nierozpoznanych przez `parse` i zero rozjazdów.
  2. **Brzmienia zeszły z kodu.** `procs` dostają zdanie z `window._t`, a nie
     surowy klucz. Zaszyte zostają identyfikatory, bo **listy kluczy z gry
     wylistować się nie da** (`_dict` domknięty w module). Reguły na
     identyfikator nie ma — tylko 108 z 223 pasuje do `msg_<klucz>[ %val%]`.
  3. **Zamrożona tabela urosła o `ramy`** — 13 identyfikatorów, których gra woła
     poza `switch`em (rama ciosu, rozstrzygnięcie, warianty dwuczłonowe DoT‑ów).
     Bez nich odtwarzało się 7 z 18 komunikatów.
  4. Pozycja „`KLUCZE` nie niosą polskich etykiet proców" z wpisu wyżej jest
     **nieaktualna**: niosą identyfikatory, a etykiety przychodzą w locie.
- **2026-08-04** — **3b wdrożone** (`f33a04c`): panel liczy z protokołu, tekst
  zostaje drogą zapasową i kontrolną. Bramę otworzyła pierwsza para; zgodę na
  przejście dało **porównanie pełnych statystyk pole po polu**, nie zieloność
  testów. Pierwsze takie porównanie pokazało trzy regresje protokołu (`crits`
  2 → 0, znak wiodący w etykiecie proca, `+Cios krytyczny` jako proc); po
  naprawach zero różnic w trzynastu polach.

  Wniosek do zapamiętania: **czujka porównywała cztery skalary i żadnej z tych
  trzech nie widziała.** Cztery pola wystarczały, dopóki protokół był tylko
  świadkiem; do przełączenia trzeba było zajrzeć we wszystkie. Zakres
  porównania musi rosnąć razem z odpowiedzialnością porównywanego kodu.

  `docs/DECYZJE.md` „uzupełnienie, nie zamiennik" skreślone w tym samym dniu,
  z zapisem, co je obaliło.
- **2026-08-04** — **pierwsze uruchomienie w grze znalazło trzy usterki**
  (`418bb0e`, `3a643a7`) i żadnej z nich nie złapały ani orakulum, ani czujka.
  To jest najważniejszy wniosek tej rundy.

  Objaw: ostrzeżenie „dwa odczyty walki dały różne liczby: 2595 kontra 0
  (i 6 różnic)" przy poprawnie wyglądających statystykach. Diagnoza z samego
  zrzutu: siedem różnic zgadza się co do sztuki z liczbą niezerowych pól
  (3+2+1+1), czyli **protokół miał komplet wierszy i same zera**.

  1. **`zrodloPanelu` pytało o liczbę WIERSZY, nie o treść.** Wiersze biorą się
     ze składu podanego z gry, więc sesja bez ani jednego ciosu wygrywała
     z poprawnym odczytem tekstowym i panel mógł pokazać zera.
  2. **Ostrzeżenie nigdy nie gasło** — napis z jednej walki wisiał nad następną.
  3. **Wyścig przy podpięciu.** Owinięcie `Engine.battle.update` idzie z zegara,
     a gra tworzy nowy obiekt walki przy każdej walce. Okno zwężone z 500 do
     150 ms, ale **nie zamknięte** — i zamknąć się go tym sposobem nie da.

  **Dlaczego nie złapały tego testy, które mamy.** Orakulum i czujka sprawdzają
  DEKODER: dostają komunikaty i pytają, czy liczby się zgadzają. Te trzy usterki
  siedzą w SPIĘCIU — w tym, co robimy, gdy komunikatów NIE MA. Cała weryfikacja
  tej rundy zakładała, że dane są; pierwszy kontakt z grą był pierwszym testem
  założenia.

  Usterka 1 jest teraz odtworzona offline, na prawdziwym fixturze: komunikaty
  obcięte do czterech ostatnich dają sesję z wierszami i zerami, a przed naprawą
  panel brał z niej 0 zamiast 2784.