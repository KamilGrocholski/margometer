# Surowy materiał z gry wraca do repo, a niezmienniki chodzą po nim same

Status: wdrożone · 2026-08-05

## Problem

`tests/korpus.ts:19‑22` opisuje lukę, którą repo świadomie przyjęło 2026‑08‑04:

> Kształt, o którym nie pomyśleliśmy, nie ma jak tu wpaść. Prawdziwe walki
> łapały je same z siebie; ten plik nie złapie żadnego, dopóki ktoś go nie
> dopisze.

Do tego `AGENTS.md` nazywa największą otwartą lukę: „Składanie zdarzeń nie ma
dziś świadka spoza repo" — zniknął razem z `tests/orakulum.test.ts`.

Obie luki mają to samo źródło: w repo nie ma surowego materiału z gry. Jest
`tests/walka-z-gry.ts`, ale to 18 komunikatów i skład, **przepisane ręką** —
i właśnie ta ręka okazała się problemem. Nagłówek podawał build
`1781609507010`, czyli build DEWELOPERSKI rozpakowanych źródeł klienta,
sześć tygodni starszy od walki. Prawdziwy to `1785244275300`; potwierdzają go
dwa niezależne zapisy — sam zrzut i skasowany `meta.json`
(`git show eb9e76c^:tests/fixtures/new-engine/2026-08-04_tempest_lowca-vs-odyncze/meta.json`).
**Jedyny materiał dowodowy w repo miał błędny opis pochodzenia.**

## Rozwiązanie

Surowe zrzuty wracają jako `tests/fixtures/*.json`, przez nową flagę
`bun tools/walka.ts --zachowaj … --nazwa <slug>`.

### Dlaczego to NIE jest cofnięcie decyzji z 2026‑08‑04

Bo tamta decyzja dotyczyła czego innego, i to widać w jej własnym uzasadnieniu
(`eb9e76c`): skasowano `zdarzenia.json` — 1,44 MB **policzonych zdarzeń**,
wyjścia parsera, który w tym samym commicie zszedł z drzewa. „Nie do
zregenerowania, nie do sprawdzenia przeciw grze, a błąd tamtego parsera byłby
w nim zamrożony na stałe." Surowy protokół nie był zarzutem ani razu — leżał
w tym samym katalogu jako `protokol.json` i był chwalony jako „pierwsza para
tekst↔protokół".

Granica, której regule brakowało: **plik danych jest zły, gdy zamraża NASZ
ODCZYT; jest dowodem, gdy zamraża CUDZE WEJŚCIE.** Fixture dekoduje `dekoduj`
przy każdym `bun test`, więc poprawka dekodera od razu zmienia to, po czym
chodzą niezmienniki.

Drugi zarzut tamtej rundy (`6fc7ef6`) był mocniejszy i wymagał odpowiedzi
technicznej, nie retorycznej: „katalog z fixture'em dało się dołożyć do repo bez
dotknięcia jednego testu — leżał wtedy martwy i nikt tego nie widział".
Odpowiedzią jest **odkrywanie plików**: `tests/fixtury.ts` czyta katalog przez
`readdirSync`, nic nie jest wymienione z nazwy, a osobny test pilnuje, żeby
katalog nie był pusty. Sprawdzone pomiarem: dorzucenie jednego pliku dało
**14 testów więcej**.

### Świadek spoza dekodera

To jest najcenniejsza część rundy i nie dało się jej zrobić modułem z `--rozbij`.

Protokół podaje przy każdym komunikacie procent życia celu (`-255967=68.15`).
Migawka wojownika niesie `hp.max` (763). Liczby idą **z dwóch różnych miejsc**
i nikt ich u nas nie uzgadnia — pierwsza przechodzi przez `rozbierz`, druga nie
dotyka dekodera w ogóle. Skumulowane obrażenia muszą więc trafić w podany
procent: `763 − 243 = 520; 520/763 = 68,15 %`.

Zmierzone: **7 porównań, 0 rozjazdów**, tolerancja 0,02 pp. Dekoder sumujący
`raw` zamiast `applied` daje **6 rozjazdów**, czyli zapala 6 z 7.

⚠️ **SPROSTOWANIE 2026‑08‑05 (`AUDYT‑58`, `AUDYT‑59`).** Stało tu
`-255970=70.51` i `763 − 225 = 538; 538/763 = 70,51 %` oraz „16 trafień" —
wszystko z pomiaru na DWÓCH walkach, z których druga odpadła jako sklejona
i do repo nie weszła. W `tests/fixtures/` nie ma ani `70.51`, ani `225`, ani
`538`, ani `id -255970`. Liczba `6` była jedyną prawdziwą, bo mutacja zapala
się w tej samej proporcji. Tabela mutacji niżej mówi „oba pliki" z tego samego
powodu i znaczy dziś „jedyny plik".

Świadek jest CZĘŚCIOWY i jest tak opisany w kodzie: obejmuje wyłącznie
obrażenia, a cel, który padł, wypada z porównania — protokół podaje wtedy
`0.00` i przebicie ponad pulę życia nie ma jak być widoczne.

⚠️ **DRUGIE SPROSTOWANIE, WAŻNIEJSZE (`AUDYT‑61`).** Stało tu, że „leczenie,
absorpcja i blok przez niego nie przechodzą", i było to podwójnie nieścisłe.
Blok i absorpcja **przechodzą** — `applied` jest liczbą PO redukcji, więc ich
skutek jest w porównaniu; niesprawdzone są ich osobne składniki. Leczenie za to
nie było „poza pokryciem", tylko **psuło bazę**: uleczenie przesuwa punkt
odniesienia dla każdego późniejszego porównania tego celu, więc pierwszy fixture
z leczeniem w środku walki zapaliłby świadka na POPRAWNYM dekoderze. Dziś
uleczony cel wypada z porównań od chwili uleczenia, a reguła ma własne testy na
zdarzeniach budowanych w kodzie — bo materiał na nią nie starcza.

### Co znalazł korpus w dniu powrotu

Pierwszy zrzut z dodatku (tempest, 2026‑08‑05) **nie wszedł do repo**: niesie
DWIE walki w jednym pliku. Pięć wywołań, wpisy 0–1 to koniec starcia
z warchlakami (`endBattle`, `close`), wpis 2 ma `init` i zaczyna starcie
z odyńcami — a wszystkie mają `walka: 1`. `skladZeZrzutu` dawał z tego sześciu
wojowników, z czego trzech nie pada w żadnym komunikacie.

Powód: nasze numerowanie chodzi po TOŻSAMOŚCI obiektu `Engine.battle`
(`protokol-source.ts:241`), a gra tego obiektu nie wymienia. Granicą jest
`data.init` — wie o tym klient gry (`Battle.js:344`, `:954`), cytaty i pomiar
w `docs/MECHANIKA.md`, wpis „Granica walk".

**To jest dokładnie to, po co ten korpus wraca**: kształt, o którym nikt nie
pomyślał, złapany przez prawdziwy materiał w pierwszym dniu. Żaden test
zbudowany przez nas nie miał jak go zawierać, bo nikt nie wiedział, że gra tak
robi.

## Odrzucone warianty

**Same moduły `.ts` w podkatalogu `tests/fixtures/`.** Najtańsze i zgodne
z literą dotychczasowej reguły. Odrzucone, bo nie rozwiązuje ANI JEDNEGO
z dwóch problemów: `--rozbij` gubi `hp.max` (więc nie ma świadka), ładunki
(więc nie ma `data.current`) i granice wywołań (więc nie ma jak dojść do walki
turowej). Przepisanie migawek do modułu ręką to tysiące liczb tą samą metodą,
która właśnie skłamała o buildzie.

**Zrzut JSON jako źródło + moduł generowany obok.** Wybrane częściowo:
`tests/walka-z-gry.ts` zostaje, bo cztery miejsca importują gotowe `KOMUNIKATY`
i `SKLAD`, a `build.ts` katalogu testów nie czyta. Odrzucone jako reguła
ogólna — druga kopia każdej walki to drugie miejsce, w którym pochodzenie się
rozjedzie. Kopia jest związana z oryginałem testem, więc rozjazd zapala się
zamiast trwać.

**`meta.json` obok każdego zrzutu, jak w skasowanym katalogu.** Odrzucone
wprost przez własną historię: `meta.json` niósł `world`, `clientBuild`,
`capturedAt`, `participants` — wszystkie **przepisane ręcznie z materiału, który
leżał obok**. To jest ta sama praktyka, która dała błędny build. Pochodzenie
niesie dziś sam zrzut; człowiekowi zostaje `README.md` z prozą, której maszyna
nie wyprodukuje („co pokrywa, czego nie ma, co było trudne") i **bez liczb**.

**Ciche przycięcie sklejonego zrzutu do ostatniej walki.** Kuszące, bo dałoby
drugi fixture od ręki. Odrzucone: narzędzie wycinające materiał po swojemu
przestaje być świadkiem. `--zachowaj` odmawia i pokazuje, gdzie leży granica.

**Trzymanie zrzutów poza repo, u gracza na dysku.** Stan sprzed tej rundy.
Odrzucone, bo materiał, którego nie ma w repo, nie chodzi w `bun run check` —
a to jedyne miejsce, w którym cokolwiek się tu sprawdza.

## Weryfikacja

`bun run check`: **682 zielone, 0 błędów**, build przechodzi (przed rundą 663).

**Dwanaście mutacji sprawdzonych**, każda zapaliła zamierzony test:

| co zepsute | co się zapaliło |
|---|---|
| fixture zapisany bez migawek (jak moduł) | „niesie ŁADUNEK i MIGAWKI" |
| komunikaty sklejone w jedno wywołanie | 3 testy `zachowajZrzut` |
| brak odchudzania | 2 testy `zachowajZrzut` |
| zapis zminifikowany zamiast wciętego | „jest wcięty i kończy się nową linią" |
| literówka w rozszerzeniu (`.jsonx`) | **strażnik pustego katalogu — i NIC więcej**, 0 pass |
| świadek liczy `raw` zamiast `applied` | świadek `hp.max`, oba pliki |
| `maksZycia` nic nie zbiera | świadek `hp.max`, oba pliki |
| klucz `poison` wyjęty z tabeli ról | „każdy klucz rozpoznany" |
| `skladZeZrzutu` z zawsze `side: 0` | „skład da się wyprowadzić" |
| komunikat podmieniony w `tests/walka-z-gry.ts` | „moduł nie rozjeżdża się z fixture'em" |
| sklejony zrzut wrzucony do katalogu ręcznie | „jeden plik to jedna walka" + „skład nie ma duchów" |

Osobno, poza mutacjami — **dowód, że pętla jest pętlą**: skopiowanie fixture'a
pod inną nazwą podniosło liczbę testów ze 121 na 135; po usunięciu wróciła.
To jest odpowiedź na zarzut „martwy plik danych", sprawdzona, a nie obiecana.

## Co zostaje otwarte

- **W katalogu jest JEDNA walka.** Runda celowała w dwie; druga odpadła jako
  sklejona. „Kształty łapią się same" wróciło w stopniu, nie w skali: jedna
  walka wobec dwudziestu pięciu, jeden świat, jedna postać.
- **Cztery pozycje `ROADMAP.md` zostają otwarte** — `heal_target`,
  `data.current`, `bandage`/`vamp_time`, blok/unik/absorpcja/zapowiedź. Żaden
  z tych kluczy nie pada w materiale, który jest.
- ~~**Granica walk na żywo nie jest naprawiona.**~~ **ZAMKNIĘTE 2026‑08‑05**
  (`AUDYT‑56`, `AUDYT‑57`). Runda zabezpieczyła wtedy MATERIAŁ (odmowa + dwa
  niezmienniki), a odczyt na żywo został jako „osobna runda, zaczynająca się od
  odtworzenia". Odtworzenie zrobił audyt — i pokazał, że `session.ts` **nie
  maskuje**: druga walka zadawała 5568 zamiast 2784 obrażeń i 24 zamiast 12 tur.
  Granicą jest dziś `data.init`, wspólny predykat `zaczynaWalke` w `src/zrzut.ts`
  woła i dodatek, i narzędzie. Otwarte zostają dwa przypadki, których materiał
  nie rozstrzyga: `init` po przeładowaniu strony i `close` bez `init`.
- **`--rozbij` i `--zachowaj` istnieją obok siebie** i trzeba wiedzieć, po co
  która. Rozważane było zejście `--rozbij` razem z `modulZrzutu`; odrzucone
  w tej rundzie, bo `build.ts` potrzebuje modułu, a jedna zmiana naraz.
- **Świadek nie obejmuje obrażeń ZADANYCH ani rozbić.** Do tego potrzebny jest
  drugi, niezależny czytelnik komunikatów — a jego nie ma i nie zanosi się.
- ~~**Prywatność.** Repo jest publiczne. Fixture niesie nazwę postaci, świat
  i statystyki (`hp.max` 5815, `ac.cur` 239) — wchodzi to do historii gita na
  stałe i nie da się tego wycofać podmianą pliku.~~ **ZAMKNIĘTE CO DO NAZW —
  2026‑08‑06.** Podstawia je `pseudonimizuj` w `tools/walka.ts` przy każdym
  `--zachowaj`, pilnują dwa niezmienniki w `tests/fixtury.test.ts`, a istniejący
  plik przeszedł redakcję (34 wystąpienia). Procedura: `tests/fixtures/README.md`.

  **Co z tej pozycji ZOSTAJE otwarte** — i zdanie „nie da się wycofać podmianą
  pliku" było tu prawdziwe, więc zostaje: oryginał siedzi w historii gita
  i tam zostanie, bo przepisywanie historii publicznego repo kosztuje więcej,
  niż daje (ta sama granica, co przy zrzutach ekranu). Zostają też `id`, świat
  i statystyki — to pseudonimizacja, nie anonimizacja. I zostaje **krok, którego
  nie da się zautomatyzować**: nazwa niezwiązana z żadnym `id` przechodzi przez
  podstawienie nietknięta i nie zapala ani jednego strażnika (zmierzone).

## Zmiany wpisu

- **2026-08-05** — powstał i został wdrożony w tej samej rundzie.
- **2026-08-05, po audycie** — sprostowane liczby świadka (`AUDYT‑58`,
  `AUDYT‑59`: „16 trafień" → 7, przykład rachunkowy → policzony z materiału,
  który leży w repo) oraz opis jego granic (`AUDYT‑61`: leczenie psuło bazę,
  blok i absorpcja przechodzą przez `applied`). Wpis o sicie na duchy
  i o granicy walk — `AUDYT‑60` — jest w `docs/AUDYT.md`.
