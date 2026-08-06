# Surowy materiał z gry

Pliki w tym katalogu to **zrzuty `Engine.battle.update` tak, jak przysłał je
serwer gry** — bez ani jednej naszej liczby, z jedną redakcją opisaną niżej
(pseudonimy graczy). Powstają przez
`bun tools/walka.ts --zachowaj <plik> --nazwa <slug>`; nie edytuje się ich
ręcznie, także wtedy (zwłaszcza wtedy), gdy test się o nie zapala.

Pochodzenie każdego pliku niesie on sam: `swiat`, `build`, `przy`, `otwarcie`,
a od 2026‑08‑05 także `zrodlo`. **Tu opisujemy tylko to, czego maszyna nie
wyprodukuje** — co dana walka pokrywa i czego w niej nie ma. Liczby wypisuje
narzędzie (`--pokaz`, `--klucze`); liczba przepisana do prozy rozjeżdża się
z materiałem, co w tym repo już raz się stało (`tests/walka-z-gry.ts` podawał
przez dobę build deweloperski zamiast prawdziwego).

⚠️ Zdanie o `zrodlo` stało tu bez zastrzeżenia i było o jeden plik za szerokie:
jedyny fixture w katalogu tego pola **nie ma**, bo zebrała go sonda sprzed
2026‑08‑05. Narzędzie ma dla tego przypadku osobne zdanie („Zrzut o NIEUSTALONYM
pochodzeniu"), a nie zgadywanie.

## Jak materiał wchodzi do tego katalogu

Kroki stały dotąd rozsypane w czterech miejscach (`docs/README.md`, `AGENTS.md`,
nagłówek wyżej, tekst użycia narzędzia) i w żadnym nie było kroków 4, 6, 7 i 8.

1. **Zbierz zrzut.** Dodatek: zębatka → „Tryb deweloperski" → „Zrzut walki"
   (zbiera całą sesję). Albo sonda `tools/walka-probe.js` wklejona do konsoli
   PRZED walką — działa bez instalowania dodatku i jest jedyną drogą, gdy
   podejrzenie pada na sam dodatek.
2. **`bun tools/walka.ts --pokaz <plik>`** — ile walk siedzi w pliku, gdzie
   przebiegają granice, czy zrzut nie jest urwany.
3. **`bun tools/walka.ts --zachowaj <plik> --nazwa <slug> [--walka <n>]`.**
   Narzędzie **odmawia** zrzutom sklejonym z kilku walk, zrzutom bez `myteam`
   i takim, w których nie da się ustalić, kto jest graczem, a kto potworem.
   Wypisuje mapę podstawionych pseudonimów — obejrzyj ją; to jedyny moment,
   w którym widać, że ktoś został wzięty za kogo innego.
4. **Przeczytaj `otwarcie` i `render` w zapisanym pliku — OCZAMI.** To jedyny
   krok, którego żaden test nie domknie: podstawienie zna wyłącznie nazwy
   związane z `id`, a nick niezwiązany z żadnym wojownikiem przechodzi przez
   nie nietknięty (mutacja z 2026‑08‑06: nazwa wstawiona tylko w `render` nie
   zapala ani jednego strażnika).
5. **`--rozbij`** tylko wtedy, gdy moduł TS jest naprawdę potrzebny — dziś
   potrzebuje go `build.ts`, który katalogu testów nie czyta.
6. **Dopisz sekcję `## <nazwa pliku>`** z trójką **Co pokrywa / Czego nie ma /
   Co było trudne**, i bez POLICZONYCH liczb — te wypisuje `--pokaz`.
7. **`bun run check`.** Nowy plik ma dołożyć testy, nie leżeć martwo.
8. **Skreśl, co domknął**, na liście zakupowej w `docs/ROADMAP.md`.

## Pseudonimy graczy się PODSTAWIA, i robi to narzędzie

Każdy wojownik, którego gra oznaczyła `npc: 0`, wchodzi tu jako `Gracz 1`,
`Gracz 2`, … Podstawienie robi `pseudonimizuj` w `tools/walka.ts` — automatycznie,
przy każdym `--zachowaj`. Pilnują tego dwa niezmienniki w `tests/fixtury.test.ts`.

**Powód, i nie jest nim ostrożność.** Repozytorium jest publiczne, fixture idzie
do gita NA ZAWSZE, a `docs/screenshots/README.md` zapisuje wprost, że historii
tego repo się nie przepisuje — więc pierwsza pomyłka jest nieodwracalna.
Pseudonimy to dane osób, które nie miały jak się na to zgodzić; szczegóły
i podstawa w [`NOTICE.md`](../../NOTICE.md).

Co zostaje NIETKNIĘTE i dlaczego: `id`, `lvl`, `prof`, wszystkie liczby i nazwy
POTWORÓW. `id` jest tym, po czym protokół identyfikuje strony i na czym stoi
świadek `hp.max`; nazwy potworów są elementem gry, nie danymi człowieka, i to po
nich widać, że dwie instancje o tej samej nazwie rozdzielają się po `id`.
Nazwijmy więc rzecz po imieniu: to jest **pseudonimizacja, nie anonimizacja** —
gra nadal umie odwzorować `id` na nick.

⚠️ **Etykiety są LOKALNE DLA PLIKU.** `Gracz 1` w jednym fixturze i `Gracz 1`
w innym to dwie różne osoby, a z `Gracz A`…`Gracz G` z prozy repo nie mają nic
wspólnego — tamte znaczą konkretne postacie konsekwentnie w każdym pliku
(`NOTICE.md`). Stąd cyfra zamiast litery: ten sam napis o dwóch znaczeniach
rozjechałby się po cichu.

Numeracja idzie po `id` rosnąco, a mapa `nick → Gracz N` **nie jest nigdzie
zapisywana** — leci na ekran przy zapisie i tyle. Słownik wiążący nick
z liczbami byłby gorszy od samego nicka.

## Dlaczego to jest katalog z plikami, skoro `AGENTS.md` każe budować materiał w kodzie

Bo reguła broni czego innego. Katalog `tests/fixtures/` zszedł z drzewa
2026‑08‑04 przez `zdarzenia.json` — 1,44 MB **policzonych zdarzeń**, wyjścia
parsera, który właśnie skasowano: nie do zregenerowania, nie do sprawdzenia
przeciw grze, z ewentualnym błędem tamtego parsera zamrożonym w środku. Surowy
protokół nie był zarzutem; leżał obok jako `protokol.json` i był chwalony.

Różnica praktyczna: te pliki dekoduje `dekoduj` przy KAŻDYM `bun test`, więc
poprawka dekodera od razu zmienia to, po czym chodzą niezmienniki. Nic tu nie
jest zamrożone poza wejściem z gry.

Warunek, pod którym katalog wrócił: **niezmienniki odkrywają pliki same**
(`tests/fixtury.ts`, `tests/fixtury.test.ts`, plus wciągnięcie do `KORPUS`
w `tests/korpus.ts`). Zarzut z 2026‑08‑04 brzmiał „plik danych da się dołożyć
bez dotknięcia jednego testu — leżał martwy i nikt tego nie widział"; tutaj
dorzucony plik jest sprawdzany od razu, a pusty katalog zapala osobny test.

## 2026-08-04-tempest-lowca-vs-odyncze.json

Zrzut sondy `tools/walka-probe.js`. Łowca (`+dmgd`, dystansowe) przeciw trzem
potworom, w tym dwóm o TEJ SAMEJ nazwie („Odyniec", `id` −255967 i −255969) —
protokół rozdziela je po `id`, więc heurystyka po spadku życia nie ma tu prawa
się odezwać.

⚠️ **`Gracz 1` w tym pliku to REDAKCJA z 2026‑08‑06, nie nazwa z gry.** Plik
wszedł do repo, zanim podstawienie w ogóle istniało, i niósł prawdziwą nazwę
postaci w 34 miejscach; przepisał go `bun tools/walka.ts --pseudonimizuj`.
Pole `pseudonimow` w pliku mówi ile, `odchudzonych` zostało nietknięte. Redakcja
jest nieodwracalna i zrobiona na miejscu, więc **w historii gita oryginał
zostaje** — ta sama świadoma granica, co przy zrzutach ekranu
(`docs/screenshots/README.md`).

**Co pokrywa:** dwa krytyki, przebicie, redukcja pancerzem (`+acdmg`), tyknięcie
trucizny z osłabieniem w drugim członie wartości, cios potwora z
`-legbon_facade` (Fasada opieki), leczenie bez podanego leczącego,
rozstrzygnięcie `winner`/`loser`, `+exp` i `txt` z łupem.

**Czego nie ma:** bloku, uniku, absorpcji z własnym kluczem, zapowiedzi
umiejętności, `heal_target`, `bandage`, `vamp_time`. Lista zakupowa na następny
zrzut stoi w `docs/ROADMAP.md`.

**Co było trudne:** cała walka przyszła JEDNYM wywołaniem `update`, więc granice
wywołań nic tu nie rozstrzygają — a to jest dokładnie to, czego wymaga otwarta
pozycja o turze z `data.current`. Migawka „po" pokazuje wszystkich przeciwników
na zerze życia i gracza z pełnym, więc porównanie „spadek życia = suma obrażeń"
na tym materiale nie przechodzi; działa dopiero porównanie przez `hp.max`
i procenty (`tests/fixtury.test.ts`, świadek spoza dekodera).

Z tego pliku wyprowadzony jest moduł `tests/walka-z-gry.ts`, importowany
w czterech miejscach; rozjazd kopii z oryginałem zapala test.

⚠️ **TEGO PLIKU NIE ODTWORZY DZIŚ ŻADNA Z DWÓCH DRÓG** (`AUDYT‑63`). Każde
wywołanie niesie w nim pole `render` — gotowe zdania złożone przez renderer
klienta, w HTML‑u. Zbierała je sonda w wersji sprzed 2026‑08‑04, gdy repo miało
drugi, niezależny odczyt walki i te dwa formaty dawały się zestawić. Tamten
odczyt zszedł z drzewa razem z węzłami renderu; ani dzisiejsza sonda, ani
kolekcjoner w dodatku `render` nie zapisują.

Co z tego wynika i czego NIE:
- Plik **zostaje**. Jest dowodem, a nie wynikiem naszego kodu; pole pochodzi
  z gry, tyle że z jej warstwy widoku, nie z protokołu. Wycięcie go byłoby
  edytowaniem materiału dowodowego, czego `AGENTS.md` zabrania.
- Czytelnik (`czytajZrzut`) pól nadmiarowych **nie odrzuca** i to jest decyzja,
  nie niedopatrzenie: ma odrzucać materiał NIEPEŁNY, nie bogatszy, niż zna —
  inaczej wypadłby ten plik i każdy zrzut z przyszłej wersji sondy.
- Zdanie „surowy protokół tak, jak przysłał go serwer" trzeba czytać z tym
  wyjątkiem: `komunikaty` i `ladunek` są z serwera, `render` jest z klienta.
  Niczego u nas nie karmi — żaden test ani `--rozbij` go nie czyta.

## Czego w tym katalogu NIE MA, a powinno

Zrzut z 2026‑08‑05 (dodatek, ten sam świat i ta sama postać) **nie wszedł**:
niesie dwie walki w jednym pliku, bo gra nie wymienia obiektu `Engine.battle`
między starciami, a nasze numerowanie chodzi właśnie po jego tożsamości.
`--zachowaj` odmawia takim plikom. Powód, cytaty z klienta gry i pomiar:
`docs/MECHANIKA.md`, wpis „Granica walk"; skutek dla dodatku stoi
w `docs/ROADMAP.md`.

Skutek dla korpusu: **jest tu JEDNA walka**, a nie dwie, o które ta runda
zabiegała.
