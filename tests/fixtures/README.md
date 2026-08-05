# Surowy materiał z gry

Pliki w tym katalogu to **zrzuty `Engine.battle.update` tak, jak przysłał je
serwer gry** — bez ani jednej naszej liczby. Powstają przez
`bun tools/walka.ts --zachowaj <plik> --nazwa <slug>`; nie edytuje się ich
ręcznie, także wtedy (zwłaszcza wtedy), gdy test się o nie zapala.

Pochodzenie każdego pliku niesie on sam: `swiat`, `build`, `przy`, `zrodlo`,
`otwarcie`. **Tu opisujemy tylko to, czego maszyna nie wyprodukuje** — co dana
walka pokrywa i czego w niej nie ma. Liczby wypisuje narzędzie
(`--pokaz`, `--klucze`); liczba przepisana do prozy rozjeżdża się z materiałem,
co w tym repo już raz się stało (`tests/walka-z-gry.ts` podawał przez dobę
build deweloperski zamiast prawdziwego).

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
