# Surowy materiał z gry

Pliki w tym katalogu to **zrzuty `Engine.battle.update` tak, jak przysłał je
serwer gry** — bez ani jednej naszej liczby, z DWIEMA redakcjami opisanymi
niżej (pseudonimy graczy, opisy umiejętności). Powstają przez
`bun tools/walka.ts --zachowaj <plik> --nazwa <slug>`; nie edytuje się ich
ręcznie, także wtedy (zwłaszcza wtedy), gdy test się o nie zapala.

Pochodzenie każdego pliku niesie on sam: `swiat`, `build`, `przy`, `otwarcie`,
a od 2026‑08‑05 także `zrodlo`. **Tu opisujemy tylko to, czego maszyna nie
wyprodukuje** — co dana walka pokrywa i czego w niej nie ma. Liczby wypisuje
narzędzie (`--pokaz`, `--klucze`); liczba przepisana do prozy rozjeżdża się
z materiałem, co w tym repo już raz się stało (`tests/walka-z-gry.ts` podawał
przez dobę build deweloperski zamiast prawdziwego).

⚠️ Zdanie o `zrodlo` stało tu bez zastrzeżenia i było o jeden plik za szerokie:
najstarszy fixture w katalogu tego pola **nie ma**, bo zebrała go sonda sprzed
2026‑08‑05. Narzędzie ma dla tego przypadku osobne zdanie („Zrzut o NIEUSTALONYM
pochodzeniu"), a nie zgadywanie. Plik z 2026‑08‑06 `zrodlo` już niesie.

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
4. **Przeczytaj `otwarcie`, `render` i `txt=` w zapisanym pliku — OCZAMI.** To
   jedyny krok, którego żaden test nie domknie, i dotyczy OBU redakcji.
   Podstawienie zna wyłącznie nazwy związane z `id`, a nick niezwiązany
   z żadnym wojownikiem przechodzi przez nie nietknięty (mutacja z 2026‑08‑06:
   nazwa wstawiona tylko w `render` nie zapala ani jednego strażnika).
   `zdejmijOpisy` zna wyłącznie `ladunek.skills` — zdanie z gry wstawione
   gdziekolwiek indziej przechodzi tak samo. Przy pliku z 2026‑08‑06 ten krok
   dał wynik pozytywny: `shout=`, `loser=` i `txt=` z łupem niosą wyłącznie
   nazwę potwora i nazwy przedmiotów, czyli elementy gry, które zostają.
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

## Opisy umiejętności SCHODZĄ, i robi to narzędzie

Druga redakcja, dopisana 2026‑08‑06. `ladunek.skills` niesie pełne opisy
umiejętności napisane przez twórców gry („Wzmacniasz truciznę, którą nasączona
jest twoja strzała…"). To cudza twórczość i w publicznym repozytorium na MIT nie
ma jej prawa być — **ta sama podstawa, co przy szablonach renderera**
([`NOTICE.md`](../../NOTICE.md), regulamin gry VII.2 m). Zdejmuje je
`zdejmijOpisy` w `tools/walka.ts`, automatycznie przy każdym `--zachowaj`; ile
zeszło, mówi pole `opisow` w pliku.

**Dlaczego to nie jest ta sama reguła, co przy nickach, tylko RÓWNOLEGŁA.**
Tamta broni danych osoby, ta broni cudzej twórczości. Zbiegły się w czasie
i mają ten sam kształt — automat, licznik w pliku, dwa strażniki — ale gdyby
kiedyś jedna miała odejść, druga zostaje.

Co zostaje NIETKNIĘTE i dlaczego: `id` umiejętności, jej **nazwa**, wymagania
(`reqp=h;reqw=dis;lvl=25`), postęp (`1/10`) i parametry
(`red-sa=16;cooldown=5`). To nazwy funkcyjne, nie proza — dokładnie ta sama
granica, co przy kluczu `+abdest` kontra zdanie, które gra pod nim wyświetla
(`AGENTS.md`, kategoria ⛔ BRZMIENIA GRY). Nazwa umiejętności zostaje także
dlatego, że protokół niesie ją niezależnie (`tspell=Zatruta strzała`) i wycięcie
jej z ładunku niczego by nie zmieniło.

⚠️ **Reguła istniała o dobę dłużej niż to, co jej pilnuje.** Kategoria
⛔ BRZMIENIA GRY weszła do `AGENTS.md` 2026‑08‑06 rano, a po stronie MATERIAŁU
nie pilnowało jej nic — tak samo, jak dzień wcześniej było z pseudonimami.
Wyszło to dopiero przy pierwszym zrzucie, który takie opisy niósł. **Reguła bez
strażnika po stronie danych jest regułą o kodzie, nie o repozytorium.**

## Dlaczego to jest katalog z plikami, skoro `AGENTS.md` każe budować materiał w kodzie

Bo reguła broni czego innego. Katalog `tests/fixtures/` zszedł z drzewa
2026‑08‑04 przez `zdarzenia.json` — 1,44 MB **policzonych zdarzeń**, wyjścia
parsera, który właśnie skasowano: nie do zregenerowania, nie do sprawdzenia
przeciw grze, z ewentualnym błędem tamtego parsera zamrożonym w środku. Surowy
protokół nie był zarzutem; leżał obok jako `protokol.json` i był chwalony.

Różnica praktyczna: te pliki dekoduje `dekoduj` przy KAŻDYM `bun test`, więc
poprawka dekodera od razu zmienia to, po czym chodzą niezmienniki. Nic tu nie
jest zamrożone poza wejściem z gry.

⚠️ **ZBIEG OKOLICZNOŚCI, KTÓRY TRZEBA NAZWAĆ: plik z 2026‑08‑06 waży mniej
więcej tyle, co skasowany `zdarzenia.json`.** Rozmiar nie był jednak zarzutem
ani wtedy, ani teraz — zarzutem było, CO w środku. Tamto było wyjściem naszego
parsera, nie do sprawdzenia przeciw czemukolwiek; to jest wejściem z gry, które
`dekoduj` przelicza na nowo przy każdym uruchomieniu testów, a jego poprawność
sprawdza świadek `hp.max` spoza dekodera. Gdyby kiedyś ktoś kasował ten katalog
drugi raz, ma to przeczytać, zanim powoła się na megabajt.

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
umiejętności, `heal_target`, `bandage`, `vamp_time`. ✅ Wszystko poza **unikiem,
`bandage` i `vamp_time`** przyniósł plik z 2026‑08‑06; lista zakupowa na
następny zrzut stoi w `docs/ROADMAP.md`.

**Co było trudne:** cała walka przyszła JEDNYM wywołaniem `update`, więc granice
wywołań nic tu nie rozstrzygają — a to jest dokładnie to, czego wymaga otwarta
pozycja o turze z `data.current`. ✅ Domyka to plik z 2026‑08‑06: ponad sto
wywołań i `current` zmienny między nimi. Migawka „po" pokazuje wszystkich przeciwników
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

## 2026-08-06-tempest-grupa-vs-hildur.json

Zrzut z dodatku (tryb deweloperski). Dziesięcioro graczy przeciw jednemu
potworowi — walka grupowa, w kilkudziesięciu wywołaniach `update`, a nie
w jednym. **Pierwszy fixture, w którym `zrodlo` naprawdę stoi w pliku**; drugi
plik w tym katalogu i pierwszy zebrany bez konsoli.

**Co pokrywa** — i jest tego tyle, że warto powiedzieć wprost, czego dotąd nie
było: blok u celu (`-blok`), absorpcja z własnymi kluczami (`-absorb`,
`-absorbm`) razem z jej niszczeniem (`+abdest_per`, `+abmdest_per`), zapowiedź
umiejętności rozłożona na kilka wywołań (`prepare=…(0%)`, `(50%)`, `(100%)`),
leczenie kierowane Z PODANYM leczącym (`heal_target` w komunikacie o dwóch
różnych stronach), super‑kryt (`+legbon_verycrit`), przekrój po żywiołach
w jednym ciosie (`dmg`, `dmgd`, `dmgf`, `dmgc`, `dmgl` naraz), ogłuszenie
i zamrożenie (`+stun`, `+freeze`), zwrot energii (`+engback`), aury
(`aura-ac_per`, `aura-sa_per`, `aura-resall`), leczenie obszarowe
(`healall_per`), mana i energia jako osobne klucze, obrażenia poboczne
(`+oth_dmg`), oczyszczanie (`-legbon_cleanse`) i `-tenacity`.

**Czego nie ma:** uniku, `bandage`, `vamp_time`. To jest cała reszta listy
zakupowej z `docs/ROADMAP.md` po tej rundzie.

**Co było trudne — i jest to ostrzeżenie, nie ciekawostka.** Potwór leczy się
niemal w każdej turze, a świadek `hp.max` wypisuje z porównań każdy cel od
chwili pierwszego uleczenia (`AUDYT‑61`: leczenie przesuwa BAZĘ). Skutek: ten
plik, przy całej swojej szerokości, robi **mniej porównań świadka niż plik
starszy i dwadzieścia razy mniejszy** — resztę zdarzeń liczy jako „po
leczeniu". Liczby wypisuje `--pokaz` i `tests/fixtury.test.ts`; wniosek zapisuje
się tutaj, bo bez niego łatwo pomyśleć, że więcej materiału to automatycznie
mocniejszy świadek. **Szerokość kluczy i głębokość świadka to dwie różne
rzeczy** i ten plik daje pierwszą, nie drugą.

Drugą rzeczą trudną było to, że materiał **nie chciał wejść**: dawał 16
komunikatów `unknown`, wszystkie o jednym kształcie (`+dmgX` bez pary `-dmgX`).
Nie był to defekt materiału, tylko dekodera — parował zadane z przyjętymi po
KOLEJNOŚCI, a gra nie paruje ich wcale. Cytat z klienta gry i pomiar:
`docs/MECHANIKA.md`, wpis „Zadane i przyjęte NIE SĄ PAROWANE". Fixture wszedł
dopiero po tej poprawce i to jest dokładnie to, po co ten katalog istnieje.

⚠️ **Ten plik jest DUŻY** — rząd 1 MB, wobec 28 kB starszego. Bierze się to
z tego, że każde z ponad stu wywołań niesie własną migawkę jedenastu wojowników
(`ladunek.w`, `wojownicyPrzed`, `wojownicyPo`). Nic z tego nie jest naszą
liczbą i nic się nie wycina: `hp.max` z tych migawek jest jedynym świadkiem
dekodera spoza dekodera.

⚠️ **`Gracz 1`…`Gracz 10` są LOKALNE DLA TEGO PLIKU** i nie mają nic wspólnego
z `Gracz 1` w pliku obok. Numeracja idzie po `id` rosnąco.

⚠️ **`opisow: 5` w nagłówku znaczy, że plik przeszedł DRUGI zabieg** poza
pseudonimizacją: `ladunek.skills` niósł pięć pełnych opisów umiejętności
napisanych przez twórców gry, a to cudza twórczość i w repo na MIT nie ma jej
prawa być (`NOTICE.md`). Zdjął je `zdejmijOpisy` automatycznie przy
`--zachowaj`. `id` umiejętności, ich NAZWY, wymagania i parametry
(`red-sa=16;cooldown=5`) zostały nietknięte — to nazwy funkcyjne, a nie proza,
i po nich widać, o którą umiejętność chodzi. Pilnują tego dwa strażniki
w `tests/fixtury.test.ts`, jeden po offsecie, drugi po kształcie tekstu.

## Czego w tym katalogu NIE MA, a powinno

Zrzut z 2026‑08‑05 (dodatek, ten sam świat i ta sama postać) **nie wszedł**:
niesie dwie walki w jednym pliku, bo gra nie wymienia obiektu `Engine.battle`
między starciami, a nasze numerowanie chodzi właśnie po jego tożsamości.
`--zachowaj` odmawia takim plikom. Powód, cytaty z klienta gry i pomiar:
`docs/MECHANIKA.md`, wpis „Granica walk"; skutek dla dodatku stoi
w `docs/ROADMAP.md`.

Skutek dla korpusu tamtej rundy: została **JEDNA walka**, a nie dwie, o które
zabiegała. ✅ Druga weszła 2026‑08‑06 — innym zrzutem, z jedną walką w pliku,
więc `--zachowaj` nie miał czego odmówić.

⚠️ **Czego nadal tu nie ma:** uniku, `bandage` i `vamp_time`. To cała pozostała
lista zakupowa; szczegóły w `docs/ROADMAP.md`. Brakuje też do dziś odpowiedzi na
pytanie, **czy zrzut z dodatku zgadza się ze zrzutem sondy z TEJ SAMEJ walki** —
sprawdzone jest wyłącznie to, że oba mają ten sam kształt, a katalog ma teraz po
jednym pliku z każdej drogi i wciąż z dwóch RÓŻNYCH walk.
