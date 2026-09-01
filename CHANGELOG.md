<!--
  What a player is told changed, release by release. SemVer, and `0.x` promises nothing.

  How an entry is written:
  - Newest at the top. `[Niewydane]` collects what has not gone out yet.
  - One flat list per version. Every entry opens with its kind — **Nowość**, **Zmiana** or
    **Poprawka** — and the kinds run in that order inside a version.
  - One to three sentences. Whoever wants the detail has the history.
  - From the player's side, in what they can see in the game and in the panel. Never a word of
    ours and never a key of the game's (AGENTS.md **L3**). The test: would somebody who plays
    Margonem and has never seen the code understand it?
  - What a player cannot see — a refactor, a test, a tool — is not an entry. That work is in the
    commit that did it, and in `docs/adr/` where it was costly to decide.
  - At a release: move `[Niewydane]` under the new number with its date, bump `version` in
    `deno.json`, and push in the order AGENTS.md **G7** states. The rest is
    `.github/workflows/release.yml`, which takes this version's section as the body of the
    release (`tools/changelog.ts`) and attaches the built files.

  A section past its tag is not touched — somebody already has that release.

  This file is Polish because a player reads it, which is AGENTS.md **L2**'s exception. This
  comment is not read by a player, so it is English like everything else here.
-->

# Zmiany

Wszystkie istotne zmiany w tym dodatku są tu notowane.

> ⚠️ **Wczesna faza (alpha).** Numery `0.x` nie obiecują zgodności — układ panelu, nazwy i zapisane
> ustawienia mogą się zmienić między wydaniami. Zgodnie z SemVer: przy zerowej wersji głównej
> wszystko może się zmienić w każdej chwili. Do czasu `1.0.0` czytaj wpisy oznaczone **Zmiana**
> przed aktualizacją.

## [0.12.1] — 2026-09-01

- **Poprawka** — Przyciski „My" i „Oni" nad listą znów przełączają. Gdy po jednej ze stron walki
  stała tylko jedna postać — grupa przeciw jednemu bossowi albo ty sam przeciw kilku — naciśnięcie
  ich nie robiło nic, a panel zostawał na tym, co narysował wcześniej, i do końca walki nie
  dopisywał już kolejnych ciosów. Wracał do siebie dopiero przy następnej walce.

## [0.12.0] — 2026-09-01

- **Nowość** — Wiersze „Nieznany sprawca" i „Nieznany cel" znów mówią, z czego są. Po najechaniu
  stoi tam, czego gra nie podała, i — co ważniejsze — czy tę liczbę masz doliczyć do listy nad nią,
  czy jest w niej już policzona. Przy wybranej drużynie dochodzi trzecie zdanie: z której strony ta
  liczba jest.

- **Nowość** — W te wiersze można teraz wejść. Pod „Nieznanym sprawcą" stoi lista tych, którym ubyło
  albo przybyło życia, a pod „Nieznanym celem" — lista tych, którzy uderzyli. To ten koniec ciosu,
  który gra podała: drugiego dodatek dalej nie zgaduje i nie poda żadnego imienia.

- **Nowość** — I widać w nich, **czym** to poszło. Pod listą osób stoi druga: typy obrażeń, z
  udziałami, sumujące się do tej samej liczby. Na nagraniach z testów prawie dziewięć dziesiątych
  tego, czego nikt nie zadał, to trucizna — czyli liczba, która wyglądała na zgubioną, jest zwykłym
  zatruciem tykającym poza ciosami.

- **Nowość** — Obie te listy da się otworzyć. Naciśnij osobę, żeby zobaczyć, czym ubyło jej życia;
  naciśnij typ obrażeń, żeby zobaczyć, komu. To ta sama liczba oglądana z dwóch stron, więc jedna
  lista zawsze zgadza się z drugą.

- **Nowość** — Typy obrażeń widać już po samym najechaniu, bez wchodzenia w wiersz. Karta nad
  „Nieznanym sprawcą" i „Nieznanym celem" wypisuje je z liczbami i udziałami — te same wiersze i w
  tej samej kolejności co lista w środku, więc naciśnięcie tylko potwierdza to, co już widać. Gdy
  typów jest więcej, niż się mieści, ostatni wiersz zbiera resztę, żeby lista zawsze sumowała się do
  liczby nad nią.

## [0.11.0] — 2026-08-31

Dodatek jest napisany **od zera**, drugi raz po `0.6.0`. Z wersji `0.10.1` nie zostało nic poza
nagraniami walk, na których sprawdzane są liczby: panel, odczyt walki i to, co dodatek trzyma w
przeglądarce, są nowe. Kilku rzeczy, które były w `0.10.1`, tu po prostu nie ma — stoją niżej wśród
**Zmian** i warto je przeczytać przed aktualizacją.

Wszystko, co dodatek zapamiętał, zaczyna się od zera: zapisane walki, położenie panelu, to, czy był
zwinięty, i wybór miejsca, w którym walki są trzymane. Trzyma to teraz pod innymi nazwami, więc
starego nie znajdzie, a zapisanych wcześniej walk nie da się już odzyskać.

- **Nowość** — Każdy wiersz, pod którym cokolwiek stoi, da się teraz otworzyć. Wejście w postać
  prowadzi do tego, co między wami padło — również wtedy, gdy leczyła sama siebie i gdy stoi tam
  jeden wiersz. Wejście w umiejętność, w rodzaj obrażeń albo w to, czym gra nazwała leczenie,
  pokazuje, kogo to dosięgło, osoba po osobie. Wcześniej połowa tych wierszy nie robiła nic, a
  jedynym znakiem, że nie robi, był kursor.

- **Nowość** — Na leczeniu widać wreszcie, czym kto leczył — także wtedy, gdy leczył wyłącznie
  siebie. Lista tego, czym poszło zdrowie, stoi teraz zawsze, nawet jeśli jest na niej jedna pozycja
  i jedna osoba.

- **Nowość** — Na zakładce „otrzymane" widać wreszcie, czym cię trafili. Pod postacią, która ci
  zadała obrażenia, stoi teraz lista jej umiejętności z liczbami, a to, czego gra niczym nie
  zapowiedziała, zbiera się na dole w jednym wierszu „Zwykły cios". Dotąd ta zakładka mówiła tylko
  kto i jakim typem obrażeń.

- **Nowość** — Karta postaci mówi teraz, ile obrażeń padło przed redukcją, obok liczby, która
  naprawdę weszła. Pod liczbami stoi zdanie, czego z tych dwóch nie da się wyliczyć: różnicy nie
  zatrzymała sama obrona, bo pancerza ani odporności gra nie podaje.

- **Nowość** — Karta mówi też, co padło, kiedy to ciebie trafiali — uniki, kontry, zatrzymane ciosy
  — obok tego, co padło przy Twoich własnych. Każda z tych połówek stoi pod własnym nagłówkiem, a
  doszły do nich najmocniejszy przyjęty cios i to, ile z każdej liczby postaci padło pod nieznanym
  końcem.

- **Zmiana** — Zapisane walki są od teraz trzymane tak, jak przysłała je gra, a nie jako gotowe
  liczby. Dzięki temu poprawka w odczycie sięga też walk sprzed niej: stara walka z listy pokazuje
  liczby policzone przez wersję, którą masz teraz, a nie przez tę, która ją zapisała.

- **Zmiana** — Kiedy w przeglądarce brakuje miejsca, najstarsze walki ustępują nowej, zamiast nowej
  nie zapisać w ogóle. Przypięte zostają, a panel mówi wprost, że musiał zrobić miejsce, i
  przypomina, żeby przypiąć te, których nie chcesz stracić.

- **Zmiana** — Na belce jest teraz jeden przycisk `⭳` zamiast dwóch. Wcześniej stały tam osobno:
  jeden kopiował same liczby do schowka, drugi zapisywał surowy zapis walki do pliku — teraz jeden
  plik niesie jedno i drugie, a w jego nazwie stoi wersja gry i wersja dodatku. Do zgłoszeń
  wystarczy go załączyć.

- **Zmiana** — Panel otwiera się na środku ekranu, a nie w prawym górnym rogu. Przeciągnięty raz
  zostaje tam, gdzie go postawisz — tak samo jak dotąd.

- **Zmiana** — Lista w panelu nie ma już paska przewijania przy prawej krawędzi. Przewija się
  dokładnie tak samo, kółkiem i palcem, a miejsce po pasku dostały nazwy postaci — mieści się ich
  więcej, zanim zostaną ucięte. To, że lista sięga dalej w dół, widać dopiero po przewinięciu.

- **Zmiana** — Przy nazwie postaci nie stoi już litera profesji. Profesję niesie sam kolor wiersza,
  a jej nazwę — „Wojownik", „Mag" — razem z poziomem mówi karta, która otwiera się po najechaniu na
  wiersz. Dwie profesje o zbliżonym kolorze trudniej teraz rozróżnić na samej liście.

- **Zmiana** — To, co pada przy ciosie, nazywa się krócej i naszymi słowami: „krytyk" zamiast „cios
  krytyczny", „kontra" zamiast „kontratak", „blok" zamiast „zablokowane", „trzeci atak" zamiast
  „trzeci cios". Dotąd dodatek pytał najpierw Twój własny klient gry i brał nazwę, którą widzisz w
  oknie walki; teraz pyta go tylko tam, gdzie własnej nazwy nie ma — przy czterech bonusach
  legendarnych i dwóch rzeczach, o których poradnik gry milczy.

- **Zmiana** — Ostrzeżenia stoją teraz w dwóch miejscach naraz. Znak ⚠ przy nazwie postaci działa
  jak dotąd: po najechaniu karta mówi, czego przy tej jednej postaci nie dało się odczytać. Pod tym
  zdaniem stoi jeszcze to, co dotyczy całej walki — to samo, co pod listą — więc widać obie
  odpowiedzi bez odrywania wzroku od wiersza.

- **Zmiana** — Wiersze „Nieznany sprawca" i „Nieznany cel" mówią mniej. Nie tłumaczą już w karcie,
  czego gra nie podała ani czy ta liczba jest już policzona w liście nad nimi, i nie da się w nie
  wejść, żeby zobaczyć, co w tej puli siedzi. Zniknął też trzeci taki wiersz, „Nie do przypisania".
  Same wiersze stoją tak jak dotąd — również wtedy, gdy patrzysz tylko na swoją albo tylko na drugą
  stronę, z liczbą po tej stronie, którą gra podała po drugim końcu ciosu. To, czego nie przypisała
  żadnej ze stron, dalej widać wyłącznie pod „Wszyscy".

- **Zmiana** — Karta postaci nie rozdziela już liczby na „z ciosów" i „poza ciosem". Trucizna, ogień
  i zranienie liczą się do tej samej liczby co ciosy, ale nie widać już, ile z niej padło bez ciosu.

- **Zmiana** — Karta nie mówi już o prawym przycisku myszy. Kończy się linijką „LPM — rozbicie" i
  stoi ona tylko tam, gdzie naciśnięcie faktycznie coś otwiera — prawy przycisk wraca tak jak dotąd,
  tylko nic o tym nie mówi.

- **Zmiana** — Umiejętność, którą ktoś uderzył, a cios został w całości zatrzymany, stoi teraz w
  rozbiciu przy zerze i mówi, ile razy poszła w ruch. Wcześniej znikała z listy, więc wyglądało to
  tak, jakby nikt jej nie użył.

- **Zmiana** — Po odświeżeniu strony panel otwiera się na najnowszej zapisanej walce, a nie na tej,
  którą miałeś wtedy na ekranie. Kiedy zaczyna się następna walka, panel przechodzi na nią — tak jak
  dotąd.

- **Poprawka** — Naciśnięcie nazwy albo liczby w wierszu z umiejętnością działa tak samo jak
  naciśnięcie samego wiersza. Dotąd trafienie w napis nie robiło nic.

- **Poprawka** — Cofanie z listy „kogo dosięgła" wraca do postaci, z której się w nią weszło, a nie
  na sam początek zakładki.

## [0.10.1] — 2026-08-28

- **Poprawka** — Górna belka panelu, ta z nazwą i przyciskami, znów mieści się w jednej linii. W
  `0.10.0` rozjeżdżała się na dwie, a przycisk `{ }` pękał na pół — panel zabierał przez to trochę
  więcej miejsca na ekranie, niż powinien.

## [0.10.0] — 2026-08-28

- **Nowość** — Po odświeżeniu strony panel wraca do walki, którą miałeś na ekranie, zamiast napisu,
  że walki jeszcze nie było; jeśli żadnej nie wybierałeś, pokazuje ostatnią zapisaną. Na liście `☰`
  ta walka jest zaznaczona, żeby było widać, którą oglądasz. Kiedy wejdziesz w następną walkę, panel
  sam przechodzi na nią.

- **Nowość** — Panel mówi, gdzie toczyła się walka: nazwa mapy i pole, na którym stałeś, stoją w
  nagłówku, a na liście `☰` każdy wiersz nosi nazwę mapy. Dwie podobne walki o tej samej godzinie
  da się wreszcie od siebie odróżnić.

- **Nowość** — Napis, który się nie mieści i jest ucięty, pokazuje się w całości po najechaniu myszą
  — nazwa umiejętności, imię przeciwnika, mapa czy wiersz na liście walk.

- **Nowość** — Panel czyta trzy rzeczy, które dotąd pokazywał tak, jak zapisała je gra: bandażowanie
  ran, potężne ogłuszenie mrozem oraz obrażenia od trucizny zadane komuś obok głównego celu. Liczby
  były i wcześniej — teraz mają nazwy.

- **Zmiana** — Przycisk `☰` działa teraz w obie strony. Pierwsze kliknięcie pokazuje listę
  zapisanych walk, drugie wraca dokładnie do tego, co miałeś na ekranie — ta sama zakładka i ten sam
  wiersz, który miałeś otwarty. Napis `‹ wróć` działa jak dotąd.

- **Zmiana** — Tykająca trucizna nazywa się w panelu „zatrucie". Słowo „trucizna" należy teraz do
  rodzaju obrażeń, tak jak „ogień" należy do niego obok „podpalenia": to dwie różne liczby i nie
  mogą stać pod jedną nazwą.

- **Poprawka** — Kiedy w walce pada umiejętność osłabiająca leczenie przeciwnej drużyny, panel nie
  twierdzi już, że czegoś nie zdołał odczytać, i nie zaniża leczenia. Takie osłabienie działa na
  drugą drużynę, więc leczenie rzucone na całą twoją drużynę jest liczone tak samo jak zwykle. Panel
  przestaje je liczyć tylko wtedy, kiedy osłabienie poszło w twoją stronę — i mówi to przy wierszu
  osoby, która leczyła.

- **Poprawka** — Wybór `Trzymaj: tylko teraz` naprawdę nie zostawia już niczego po sobie. Panel
  przestał pamiętać, którą walkę miałeś otwartą — po odświeżeniu strony wita cię tak, jakby żadnej
  nie było, bo żadnej nie ma.

## [0.9.0] — 2026-08-26

- **Nowość** — Skończone walki zostają. Przycisk `☰` na belce otwiera listę ostatnich dwudziestu
  walk: ta, która trwa, i te, które już się skończyły — z godziną, wielkością i tym, jak się
  skończyły. Kliknięcie wiersza pokazuje tamtą walkę w panelu tak samo, jak pokazuje bieżącą; prawy
  przycisk myszy wraca. Gwiazdką przypniesz walkę, żeby nie zniknęła, kiedy zrobi się miejsce dla
  nowych.

- **Nowość** — Na tej samej liście wybierasz, gdzie walki mają być trzymane — na stałe, do
  zamknięcia karty, albo tylko teraz. Zmiana miejsca przenosi to, co już masz, i czyści poprzednie.
  Jeśli przeglądarka nie przyjmie walki, panel to napisze zamiast po cichu jej nie zapisać.

- **Nowość** — Panel liczy teraz obrażenia i leczenie, które wcześniej mu umykały: porażenie,
  głęboką ranę, krwawienie i regenerację potwora — życie, które przeciwnik przywraca sam sobie. Te
  punkty nie trafiały dotąd do żadnej liczby, więc sumy potrafiły być zaniżone, a panel jedynie
  ostrzegał, że czegoś nie umie odczytać. Rozpoznaje też potężne ogłuszenie, które potrafi paść przy
  ciosie przeciwnika.

- **Nowość** — Ostrzeżenie stoi teraz przy tym, kogo dotyczy. Jeśli przy konkretnej postaci czegoś
  nie dało się odczytać, obok jej nazwy pojawia się ⚠, a szczegóły są w okienku, które otwiera ten
  wiersz. Wcześniej takie ostrzeżenie wisiało pod całą listą i nie było wiadomo, czyich liczb
  dotyczy. Pod listą zostaje to, czego nie da się przypisać nikomu.

- **Nowość** — Plik zapisywany przyciskiem `{ }` — ten do zgłoszeń — mówi teraz, która wersja
  MargoMeter go zapisała i w jakiej przeglądarce działała. Wcześniej opisywał samą walkę, więc
  zgłoszenie przysłane bez słowa komentarza nie mówiło nic o tym, u kogo się to zdarzyło.

- **Nowość** — Zwinięty panel zostaje zwinięty. Jeśli schowasz go przyciskiem `—` na belce, następne
  wejście do gry zastanie go schowanym — dotąd wracał rozwinięty po każdym odświeżeniu strony.
  Rozwinięcie zapamiętuje się tak samo.

- **Zmiana** — Panel nazywa teraz leczenie tak, jak nazywa je gra, i rozdziela dwie rzeczy, które
  wcześniej stały pod jednym słowem. „Przywracanie życia" to własna statystyka postaci — leczy co
  turę wyłącznie ją samą i słabnie z każdym wyzwoleniem. „Uleczenie wskazanego" i „uleczenie
  sojuszników" to ktoś, kto uleczył kogoś innego. Wcześniej wszystkie trzy były „leczeniem".

- **Zmiana** — Wiersz „ujemne leczenie" nazywa się teraz „ujemne przywracanie życia". To ta sama
  statystyka, tylko zeszła poniżej zera — wtedy zamiast dodawać życie, zabiera je co turę.

- **Poprawka** — Leczenie całej drużyny nie przepada już przez ułamek punktu życia. Gra podaje życie
  w procentach, więc odtworzona liczba potrafi wypaść o pół punktu ponad maksimum postaci — panel
  uznawał wtedy, że nie wie, z jakim życiem ta postać weszła do walki, i razem z nią przestawał
  liczyć każde drużynowe leczenie po tej stronie. Teraz mieści się w tej niedokładności i liczy
  dalej.

- **Poprawka** — W rozbiciu „Leczenie" zniknął wiersz „Nie wiadomo, czym". Leczenie, którego nic nie
  zapowiedziało, stoi teraz pod własnymi nazwami — gra je nazywa, tylko panel tego nie pokazywał i
  wrzucał wszystko do jednego worka.

- **Poprawka** — Panel nie ostrzega już, że nie umie policzyć drużynowego leczenia, w walkach, w
  których policzył je i wyszło zero. Ostrzeżenie zostaje tam, gdzie odpowiedzi naprawdę nie ma.

- **Poprawka** — Cios, przy którym gra podała liczbę z przecinkiem, nie gubi już wszystkich swoich
  obrażeń. Wystarczyła jedna taka wartość obok, żeby pięć liczb z tego samego ciosu nie trafiło do
  żadnej sumy.

- **Poprawka** — Kilka zdarzeń, których panel nie rozumiał, jest już czytanych: umiejętności nazwane
  przez grę po swojemu, zdejmowanie efektów z sojuszników, drużynowe wzmocnienia ciosów krytycznych
  i odnowiona absorpcja. Każde z nich stawiało wcześniej ostrzeżenie, że liczby mogą być zaniżone,
  choć żadne z nich niczego nie zaniżało.

- **Poprawka** — Liczebniki w zdaniach panelu odmieniają się poprawnie: „3 zdarzenia" zamiast „3
  zdarzeń".

- **Poprawka** — Okienko ze szczegółami zamyka się, kiedy kursor zjedzie z panelu. Potrafiło zostać
  nad grą i czekało, aż najedziesz na coś innego — najczęściej wtedy, gdy walka już się skończyła i
  panel nic nie przerysowywał.

- **Poprawka** — Wszystkie paski mają jedną szerokość. Pasek „Nieznany sprawca" i pasek podsumowania
  na dole rysowały się szersze od pasków postaci nad nimi, więc ta sama liczba wychodziła na nich
  dłuższa, niż powinna.

- **Poprawka** — Wybór miejsca, w którym trzymane są walki, nie przepada już po cichu. Jeśli
  przeglądarka nie przyjmie takiego ustawienia, panel zostawia wszystko tak, jak było, i napisze o
  tym. Wcześniej zaznaczał nowy wybór jako przyjęty, a po wejściu do gry następnym razem walki
  potrafiły zniknąć z listy.

- **Poprawka** — Rozbicie otwarte na skończonej walce zostaje otwarte, kiedy zaczyna się nowa. Panel
  wracał na górę listy również komuś, kto oglądał walkę sprzed godziny — a wiersze pod spodem i tak
  należały do tamtej walki.

## [0.8.1] — 2026-08-22

- **Poprawka** — Procenty w nawiasach sumują się teraz do 100. Wcześniej każdy z nich zaokrąglał się
  osobno i cała kolumna potrafiła wyjść 97 albo 102 — liczby obok były poprawne, mylił tylko sam
  procent. Dotyczy zarówno listy postaci, jak i sekcji, które otwierają się po kliknięciu w wiersz.

- **Poprawka** — W rozbiciu „Leczenie" sekcja „OD CZEGO" jest teraz ułożona od największej liczby do
  najmniejszej, tak jak każda inna lista w panelu. Wcześniej pozycje stały w kolejności przypadkowej
  i mniejsza liczba potrafiła stać nad większą.

## [0.8.0] — 2026-08-19

- **Nowość** — Leczenie całej drużyny trafia teraz do liczb. Wcześniej panel tylko ostrzegał, że
  takie leczenie się wydarzyło i że liczby są przez to zaniżone — teraz pokazuje, ile życia wróciło
  każdej postaci i komu to zawdzięcza. Ostrzeżenie zostaje tylko dla walk, w których nie da się tego
  policzyć: gdy panel wpiął się w trakcie walki i nie wie, z jakim życiem ktoś do niej wszedł.

- **Nowość** — Nagłówek panelu mówi teraz „remis", gdy walka skończyła się bez zwycięzcy — tak
  kończy się walka, która dobiła do limitu tur. Wcześniej w takiej walce nagłówek nie mówił nic.
  Remis widać niezależnie od tego, po której stronie się stało.

- **Zmiana** — Wiersz „Bez sprawcy" rozdzielił się na dwa, bo mówił naraz o dwóch różnych rzeczach.
  „Nieznany sprawca" to punkty, przy których gra nie podaje, kto je zadał albo kto leczył; „Nieznany
  cel" — takie, przy których nie podaje, kogo spotkały. Oba liczą teraz wybrany zespół i oba stoją z
  procentem mówiącym, jaka to część tego, co widać nad nimi.

- **Zmiana** — Pasek pod listą nie wrzuca już do „Bez strony" punktów, które stronę mają. Trucizna,
  ogień czy ubytek życia bez podanego sprawcy liczą się teraz tej drużynie, której dotyczą —
  obrażenia w poprzek stron, leczenie po swojej. „Bez strony" zostaje wyłącznie na to, przy czym gra
  nie nazywa żadnego z końców, więc w praktyce nie widać go wcale.

- **Zmiana** — Okienko postaci dzieli teraz „Zadane" i „Otrzymane" na „z ciosów" i „poza ciosem" —
  to drugie to trucizna, ogień i zranienie, czyli życie, które ubywa bez ciosu. Wcześniej ta druga
  linijka nazywała się „bez sprawcy", a to już nieprawda: sprawca części z tych punktów jest znany.
  Zranienie ma też własny wiersz w rozbiciu na umiejętności, pod nazwą, którą daje mu gra.

- **Zmiana** — Nowa walka wraca na główną listę tej zakładki, w której akurat stoisz. Wcześniej,
  jeśli panel był wtedy wejściem w postać albo w umiejętność, następna walka rysowała się od razu w
  tym rozbiciu — na poziomie, o który nikt nie prosił. Wybrana zakładka, zespół i zwinięcie panelu
  zostają takie, jak je ustawisz.

- **Poprawka** — Panel odpowiada teraz za pierwszym razem, także w środku walki. Wcześniej
  kliknięcie w zakładkę albo w wiersz często przepadało, jeśli akurat w tej samej chwili z walki
  przychodziły nowe informacje — trzeba było klikać po kilka razy, żeby cokolwiek się przełączyło.
  Teraz zmiana zakładki, wejście w postać i cofnięcie się łapią się od razu, niezależnie od tego, co
  dzieje się w walce.

- **Poprawka** — W Safari przeciąganie panelu nie zaznacza już tekstu pod kursorem. Wcześniej
  złapanie panelu za belkę tytułową albo pociągnięcie myszką po zakładkach zaznaczało napisy zamiast
  przesunąć panel. W pozostałych przeglądarkach tego problemu nie było.

- **Poprawka** — Regeneracja, „Dotyk anioła" i „Ostatni ratunek" trafiają wreszcie do postaci, którą
  leczą. Gra nie podaje przy nich, kto leczy, bo leczą tego, na kim stoją — a panel zostawiał te
  punkty w wierszu „Nieznany sprawca", choć nie było tu czego zgadywać. W każdej walce, na której to
  sprawdzono, takie leczenie się pojawiało.

- **Poprawka** — Zranienie, które sączy się przez kolejne tury, trafia teraz do tego, kto je zadał,
  i liczy się do jego „Zadane". Gra przy samym ubywaniu życia nie podaje napastnika, ale podaje go
  cios, który to zranienie założył — panel łączy jedno z drugim. Tam, gdzie nie da się tego
  rozstrzygnąć, punkty zostają w wierszu „Nieznany sprawca".

- **Poprawka** — Leczenie zapowiedziane z imienia trafia do tego, kto leczył, nawet jeśli panel nie
  potrafi rozpoznać leczonej postaci. Wcześniej takie punkty nie stały w żadnym wierszu ani w żadnej
  sumie, a panel pisał przy nich, że nic ich nie zapowiedziało — chociaż gra zapowiedziała.

- **Poprawka** — Wiersz, pod którym nie ma nic nowego, nie otwiera się już wcale. Wcześniej wejście
  w niektóre wiersze — najczęściej w zakładkach z leczeniem — pokazywało jeden wiersz powtarzający
  dokładnie tę liczbę, w którą się kliknęło.

## [0.7.0] — 2026-08-18

- **Nowość** — Okienko z opisem postaci otwiera się teraz wszędzie tam, gdzie postać stoi na liście,
  a nie tylko na głównym rankingu. Wejdź w kogoś i najedź na wiersz w „KOMU" albo „OD KOGO" —
  zobaczysz to samo, co na liście głównej: kto to jest, ile zadał i dostał, jak bił, co mu weszło.
  Liczby w okienku dotyczą całej walki, nie tylko tego jednego wiersza, i okienko mówi to wprost.

- **Zmiana** — Na liście stoją wszyscy, którzy biorą udział w walce, od pierwszej chwili. Wcześniej
  postać pojawiała się dopiero wtedy, gdy coś zrobiła albo coś ją spotkało, więc na początku dużej
  walki lista potrafiła mieć dwa wiersze zamiast jedenastu — a brak wiersza wygląda tak, jakby kogoś
  w ogóle w tej walce nie było. Teraz każdy stoi na zerze i wychodzi w górę, kiedy zacznie. Na
  starcie kolejność jest ta, w której gra wypisuje walczących. Liczba nad listą liczy dokładnie
  tych, których widać, i to samo widać w skopiowanym zgłoszeniu.
- **Poprawka** — Panel mówi teraz, kiedy część walki do niego nie dotarła, zamiast pokazywać resztę
  tak, jakby to była całość. Gdy gra przyśle coś w postaci, której dodatek już nie rozpoznaje, na
  górze pojawia się zdanie o tym, że liczby są zaniżone — wcześniej taka walka po prostu wychodziła
  na zero i nic tego nie sygnalizowało.
- **Poprawka** — Dwie zainstalowane kopie dodatku nie policzą już walki dwa razy. Jeśli któraś kopia
  jest szybsza, druga odsuwa się i mówi o tym w konsoli, zamiast dokładać drugi panel liczący to
  samo.
- **Poprawka** — To samo dla składu: jeśli którejś postaci nie da się odczytać, panel to napisze.
  Wcześniej taka postać znikała po cichu, a obrażenia zadane jej z imienia lądowały w wierszu „bez
  sprawcy".
- **Poprawka** — Wiersz „Bez sprawcy" pokazuje wreszcie to, co masz wybrane: liczy ten zespół —
  „Wszyscy", „My" albo „Oni" — i tę zakładkę, na której stoisz. Wcześniej stała w nim jedna liczba z
  całej walki, ta sama wszędzie, więc przy przełączaniu zespołu zmieniała się cała lista, a ona nie
  — a procent obok niej potrafił wyjść większy niż sto. Podpis pod liczbą mówi teraz wprost, czyjego
  życia dotyczy: komu ubyło albo komu przybyło.
- **Zmiana** — Efekty w ciosach nazywają się tak, jak nazywa je Twoja własna gra. Dodatek pyta o
  nazwę klienta, w którym grasz, więc pojawia się dokładnie to słowo, które widzisz w oknie walki —
  i w tym języku, w którym grasz. Tam, gdzie gra nazwy nie ma, dodatek nadal podaje własną.
- **Poprawka** — Kilka nazw było po prostu nie z tej beczki. `contra` to **kontratak**, a nie
  „kontra"; przerwanie ciosu specjalnego opisywaliśmy jako „rozproszenie zaklęcia", czyli coś
  zupełnie innego; niszczona **absorpcja** chodziła jako „osłona".
- **Poprawka** — Dwie różne rzeczy przestały się nazywać tak samo: niszczenie pancerza (w punktach)
  i zniszczenie pancerza do końca stały jedna nad drugą pod jednym podpisem i nie dało się ich
  rozróżnić.
- **Poprawka** — Obrażenia fizyczne zadane komuś, kogo gra wskazuje z imienia, trafiały czasem do
  osobnego wiersza wyglądającego identycznie jak ten obok. To jeden wiersz, tak jak w grze.
- **Poprawka** — Trzeci cios ma wreszcie nazwę; wcześniej stał w panelu jako surowe słowo z
  protokołu.
- **Zmiana** — Okno dodatku ma wreszcie własną nazwę na stronie. Wcześniej było na niej zwykłym
  kawałkiem bez nazwy, nie do odróżnienia od reszty strony — teraz widać, że należy do dodatku, i
  widać przy nim numer wersji. Żadna z tych nazw nie może się już zderzyć z niczym, co gra nazywa po
  swojemu. Tego, co pokazuje samo okno, to nie zmienia.

## [0.6.0] — 2026-08-12

Dodatek jest napisany **od zera**. Z poprzedniej wersji nie zostało nic poza nagraniami walk, na
których sprawdzane są liczby. Kilku rzeczy, które były w 0.5.0, tu po prostu nie ma — stoją niżej
wśród **Zmian** i warto je przeczytać przed aktualizacją. Kto ma zainstalowaną 0.5.0, dostanie tę
wersję sam.

- **Nowość** — Wejście w postać pokazuje, z kim się biła, a wejście w przeciwnika — **czym** w niego
  biła i jakimi rodzajami obrażeń. Każdy poziom zamyka się w liczbie, z której się w niego weszło,
  więc widać, gdzie idzie reszta.
- **Nowość** — Wiersz **„Bez sprawcy"** stoi na każdym ekranie, nie tylko na jednym. To, czego nie
  da się nikomu przypisać — trucizna, tykające rany, leczenie bez podanego uzdrowiciela — jest wtedy
  widoczne wszędzie tam, gdzie wpływa na wynik, zamiast po cichu podnosić czyjś udział.
- **Nowość** — Pasek pod listą podsumowuje walkę: ile zrobili moi, ile oni i ile nie należy do
  żadnej strony. Dzieli tę samą całość co ranking nad nim, więc udziały na obu zgadzają się co do
  punktu.
- **Nowość** — Leczenie czyta się w dwie strony. Postać ma osobno to, co **dostała**, i to, co
  **dała** — a to są dwie różne liczby, których wcześniej nie dało się zestawić.
- **Nowość** — Przycisk, który zrzuca do pliku stan **tej jednej walki**, na którą patrzysz, tak jak
  przyszedł z serwera. To nie jest nagrywanie: nic się nie zbiera, nic nie zostaje w przeglądarce i
  nie ma czego przeglądać później. Plik jest po to, żeby dołączyć go do zgłoszenia — bez niego
  zgłoszenie mówi „liczba wygląda źle" i nic więcej. Obok stoi drugi przycisk, który kopiuje same
  liczby razem z numerem wersji.
- **Zmiana** — **Archiwum walk, nagrywanie i odtwarzanie zniknęły**, i nic ich nie zastępuje. Panel
  pokazuje walkę, która trwa, i zostaje na niej do początku następnej — po niej nie ma do czego
  wracać. Nagrania zrobione w 0.5.0 staną się nie do otwarcia: jeśli któreś jest Ci potrzebne,
  skopiuj je z archiwum, **zanim** zaktualizujesz dodatek.
- **Zmiana** — Dodatek nie trzyma w przeglądarce żadnej walki. Odświeżenie strony przeżywa jedno:
  **położenie panelu**. Wybrana zakładka i filtr składu wracają do domyślnych.
- **Zmiana** — **Trybu „na turę" nie ma.** W szybkiej walce gra numeruje kilka akcji jednym numerem
  tury, więc liczba dzielona przez tury bywała nieprawdziwa i nic tego nie zdradzało. Panel pokazuje
  sumy.
- **Zmiana** — Dymek ze skrótem statystyk zniknął; to samo, i więcej, pokazuje wejście w postać.
- **Zmiana** — Skalowanie okna za róg zniknęło. Panel sam nie przekracza wysokości okna, a gdy
  brakuje miejsca, ustępuje lista, nie nagłówek.
- **Zmiana** — Zamiast trzech zakładek są dwie — **Obrażenia** i **Leczenie** — a „zadane /
  otrzymane" jest przełącznikiem obok. Ten sam ranking na dwóch osiach zamiast dwóch osobnych
  ekranów.
- **Zmiana** — Efekt, dla którego dodatek nie ma jeszcze polskiej nazwy, pokazuje się tak, jak
  nazywa go gra. Brzydko i prawdziwie — poprzednio takie rzeczy potrafiły nie pokazać się wcale.
- **Poprawka** — Gdy jakiegoś fragmentu panelu nie da się narysować, znika sam ten fragment i mówi o
  tym wprost. Reszta liczb zostaje na ekranie; wcześniej awaria potrafiła zabrać ze sobą całość.

## [0.5.0] — 2026-08-05

- **Zmiana** — Panel liczy z tego, co gra dostaje z serwera w trakcie walki, a nie ze zdań
  wypisanych w oknie walki. Liczby są te same, ale nazwy efektów biorą się wprost z gry, więc
  zgadzają się z tym, co widać w oknie — także po aktualizacji Margonema.
- **Zmiana** — Archiwum zapisuje walki w nowym formacie i **nagrania sprzed tej wersji przepadają**.
  Lista zaczyna się od zera; jeśli zależy Ci na starych walkach, skopiuj je z archiwum, zanim
  zaktualizujesz dodatek.
- **Zmiana** — Zniknęło ręczne wklejanie logu do archiwum. Panel czyta dziś walkę wprost z gry, a
  tekst spod przycisku **„Kopiuj logi" w oknie walki Margonema** nie jest już dla niego czytelny.
  Przycisk „kopiuj logi" na pasku nagrywania **w panelu** to co innego i działa jak dotąd — to on
  kopiuje nagrane walki i to jego wynik przydaje się w zgłoszeniu.
- **Zmiana** — Gdy licznik nie zdąży podpiąć się do walki, mówi o tym wyraźnym ostrzeżeniem pod
  statystykami. Bez podpięcia w panelu stoją same zera, które bez tej informacji wyglądałyby jak
  wynik walki. Zdarza się to przy walkach zaczynających się natychmiast po wejściu na mapę.
- **Poprawka** — W nagraniach lista postaci po obu stronach jest znów pełna: podział „moi /
  przeciwnicy" i postacie, które nic nie zdążyły zrobić, pokazują się tak samo jak w trwającej
  walce.
- **Poprawka** — Postacie o tej samej nazwie dostają w panelu SWOJE liczby. Dotąd panel zgadywał,
  która to która, po spadku życia — a gdy obie stały na tyle samo, cała kwota lądowała na jednej z
  nich. Gra podaje tę informację wprost, więc znika też gwiazdka „liczba niepewna" przy takich
  wierszach, a przy tej samej nazwie po obu stronach widać wreszcie, kto jest czyj.
- **Poprawka** — Leczenie rzucone na kogoś innego trafiało w całości do puli „bez sprawcy", choć gra
  podaje, kto leczył. Teraz zapisuje się leczącemu, a przypis w stopce liczy już tylko to, czego
  naprawdę nie da się nikomu przypisać — samo „Przywrócono N punktów życia" i tykające efekty. W
  drużynie z uzdrowicielem ta różnica potrafi iść w setki tysięcy punktów.

## [0.4.0] — 2026-08-04

- **Nowość** — Panel pokazuje numer wersji dodatku, a skopiowane statystyki niosą go razem z
  liczbami. Zgłaszając, że coś nie zagrało, nie trzeba już zgadywać, której wersji to dotyczy —
  zwłaszcza że dodatek aktualizuje się sam.
- **Nowość** — Najechanie na postać pokazuje w dymku trzy jej najsilniejsze pozycje wraz z udziałem
  — komu zadała, od kogo obrywa albo z czego się leczy, zależnie od wybranej zakładki. Na pytanie
  „co go tak boli?" odpowiada teraz samo najechanie, bez wchodzenia w postać i wracania. Gdy pozycji
  jest więcej, dymek mówi, ile zostało na pełnej liście.
- **Zmiana** — Odznaka z literą profesji stoi teraz przy nazwie postaci wszędzie: na liście składu,
  w rozbiciu „komu" i „od kogo", w ścieżce powrotu i w dymkach. Sam kolor nie wystarczał, bo dwie
  postacie tej samej profesji mają go wspólny.
- **Zmiana** — Panel i okno archiwum wyglądają jak jedno narzędzie: to samo tło, ta sama ramka, to
  samo podświetlenie pod kursorem.
- **Zmiana** — Skopiowane statystyki opisują już tylko tę jedną walkę, na którą patrzysz. Wcześniej
  doklejała się do nich suma wszystkich walk od włączenia gry — liczba, której panel nigdzie nie
  pokazywał i o której nie było jak się dowiedzieć inaczej niż wklejając skopiowany tekst gdzieś
  indziej.
- **Poprawka** — Gdy okno walki napisze linię obrażeń w kształcie, którego licznik nie rozumie,
  panel mówi o tym wprost zamiast pokazywać liczbę wziętą z sąsiedniej linii albo cios „za zero". Do
  tej pory taka linia potrafiła przejść bez ostrzeżenia, a w statystykach zostawała wartość, której
  w logu nie było.
- **Poprawka** — Zablokowane obrażenia liczą się także wtedy, gdy gra napisze o nich poza opisem
  ciosu, a gdy licznik nie potrafi ich przypisać do żadnego ciosu — mówi o tym zamiast po cichu je
  pominąć.
- **Poprawka** — Ostrzeżenie o nieznanym rodzaju obrażeń zapala się także wtedy, gdy gra oznaczy go
  cyfrą, a nie literą. Do tej pory taki rodzaj pojawiał się w rozbiciu jako „Nieznany", ale panel o
  nim nie uprzedzał.
- **Poprawka** — Zamknięcie okna archiwum kończy liczenie podsumowań. Wcześniej liczyły się dalej, w
  tle, choć okna nie było już na ekranie — a robiły to kosztem płynności gry.
- **Poprawka** — Usunięcie jednego nagrania nie każe liczyć od nowa wszystkich pozostałych.
- **Poprawka** — Dodatek nie uruchamia się już na stronie głównej Margonema (adres bez „www") ani na
  forum i commonsach w domenie `.com`.
- **Poprawka** — Ubytki życia, które nie pochodzą od niczyjego ciosu, wchodzą teraz do obrażeń
  przyjętych zamiast zapalać ostrzeżenie. W walkach, w których ktoś z drużyny rzucał trującą mgłę,
  panel pokazywał tym postaciom mniej obrażeń, niż naprawdę oberwały. Przy takim ubytku panel pisze
  **„Bez sprawcy"** — nie zgaduje, że zadał go przeciwnik.
- **Poprawka** — Kilka komunikatów z walk drużynowych przestaje być niezrozumiałych dla licznika:
  okrzyk wzmacniający całą drużynę, czar rzucony na siebie i utrata energii. Ostrzeżenie „nieznane
  linie" zapalało się wtedy bez powodu.
- **Poprawka** — Trzeci cios tancerza ostrzy ma w rozbiciu własną pozycję. Wcześniej jego obrażenia
  były liczone, ale nie dało się zobaczyć, skąd pochodzą.
- **Poprawka** — Nazwa postaci, w którą się weszło, nie mruga już przy przełączaniu zakładek ani w
  trakcie walki. Wcześniej podświetlenie pod kursorem gasło kilka razy na sekundę, właśnie na tym
  napisie, który ma dawać znać, że panel trzyma wybraną postać.
- **Poprawka** — Energia, którą postać sama zyskuje przy ciosie, nie jest już wypisywana w dymku
  jako efekt sprzętu. Stała tam obok klątw i niszczenia pancerza, czyli obok rzeczy, które cios robi
  przeciwnikowi — a to jest zysk własny. Zabranie energii lub many przeciwnikowi zostaje, bo efektem
  jest.

## [0.3.0] — 2026-08-01

Pierwsze wydanie, które **da się pobrać i które samo się aktualizuje**. Wcześniejsze numery istniały
tylko w repozytorium — jedyną drogą było zbudowanie pliku u siebie.

- **Nowość** — Instalacja jednym kliknięciem i automatyczne aktualizacje. Dodatek ma stały adres
  pobierania, a rozszerzenie samo proponuje nowszą wersję.
- **Nowość** — Odznaka z literą profesji przy nazwie postaci. Sam kolor nie wystarczał przy dłuższej
  liście ani przy wadach wzroku.
- **Nowość** — Rozbicie według umiejętności, bez względu na cel. Sekcja „CZYM (ŁĄCZNIE)" odpowiada,
  która umiejętność faktycznie robi robotę — wcześniej trzeba było obejść wszystkie cele i dodać w
  głowie.
- **Nowość** — Klik w umiejętność pokazuje, komu zadała. Ten sam gest z przeciwnej strony ciosu;
  działa też dla obrażeń otrzymanych.
- **Nowość** — Zablokowane obrażenia i ciosy bardzo krytyczne widać w dymku, a osłabione obrażenia
  od trucizny nie zaniżają już sumy.
- **Nowość** — Panel nazywa już wszystkie rodzaje obrażeń, jakie widział. Doszły **broń pomocnicza**
  (drugie ostrze tancerza) i **globalne** (ciosy bijące we wszystkich naraz).
- **Zmiana** — Rodzaje obrażeń zwinęły się w rodziny: dziewięć wierszy w rozbiciu zrobiło się
  siedem.
- **Zmiana** — Paski są jaśniejsze, żeby tekst na nich dało się przeczytać. Pełną barwę trzyma teraz
  nasadka na końcu paska.
- **Zmiana** — Pozycje bez sprawcy zeszły do jednego wiersza na końcu rankingu, zamiast udawać
  postać wśród postaci. Klik mówi, co w tej puli siedzi.
- **Zmiana** — Panel pamięta też ustawienia, nie tylko położenie. Wybrana zakładka, filtr składu i
  tryb „na turę" wracają po odświeżeniu strony.
- **Zmiana** — Długa sesja przestała rosnąć w pamięci: po 195 walkach **21× mniej zajętej pamięci**
  i **59× szybsze** liczenie sumy, przy tym samym wyniku.
- **Zmiana** — Nagrywanie mniej obciąża grę: około **48× mniej zapisów** w trakcie walki.
- **Poprawka** — Otwarcie archiwum zacinało grę. Przy 190 nagraniach było to ćwierć sekundy
  zamrożonej gry za każdym razem; teraz panel liczy tylko to, co widać, a reszta dolicza się w tle.
- **Poprawka** — Uniki pełne i częściowe liczyły się razem, więc licznik uników pokazywał więcej,
  niż się wydarzyło.
- **Poprawka** — Dwie postacie o tej samej nazwie po obu stronach wypadały z podziału na zespoły.
- **Poprawka** — Obrażenia od zranienia nie miały właściciela, choć walka podaje sprawcę wprost. W
  starciu z Hildur wracają dzięki temu 3 380 punktów dla łowcy.
- **Poprawka** — Przypis o truciźnie nazywał tak również ogień i rany. Teraz wypisuje, co w tej puli
  faktycznie jest.
- **Poprawka** — Leczenia bez sprawcy nie było widać nigdzie — w starciu z Hildur 133 867 punktów.
  Teraz stoi w stopce, obok trucizny.
- **Poprawka** — Walki z bossami meldowały nierozpoznane linie, a leczenie drużyny znikało.
  „Uleczono X o N punktów życia" nie było w ogóle rozumiane, więc kilkadziesiąt tysięcy wyleczonych
  punktów po prostu nie istniało.
- **Poprawka** — Leczenie cudzą ręką dopisywało się leczonemu. Teraz jako własne liczy się tylko to,
  co postać rzuciła na siebie.
- **Poprawka** — Cios o trzech liczbach potrafił trafić w niewłaściwy rodzaj obrażeń: gdy przeciwnik
  wytłumił jedną z nich do zera, obrażenia od zimna lądowały pod ogniem. Suma się zgadzała, więc nic
  tego nie zdradzało.
- **Poprawka** — Nagrania potrafiły zajmować miejsce mimo skasowania.
- **Poprawka** — Nagrywanie wracało włączone po komunikacie o braku miejsca.
- **Poprawka** — Jedna walka trafiała do archiwum jako dwa nagrania, w tym jedno puste.
- **Poprawka** — Awaria licznika zabierała ze sobą nagrywanie, czyli jedyny zapis, z którego dałoby
  się ją odtworzyć.
- **Poprawka** — Kopiowanie meldowało sukces nad pustym schowkiem. Teraz przy odmowie mówi „✕".
- **Poprawka** — „wyczyść" wyglądał na zepsuty: pytanie „na pewno?" wygasało po pięciu sekundach,
  ale napis na przycisku zostawał.
- **Poprawka** — Pytanie o skasowanie nagrania nie wygasało wcale. Wystarczyło kliknąć ✕, odejść i
  wrócić po godzinie, żeby skasować bez pytania.
- **Poprawka** — Kopiowanie w podglądzie dawało co innego, niż widać na ekranie.
- **Poprawka** — Zwinięty panel udawał, że pokazuje bieżącą walkę, choć leciało odtwarzanie
  nagrania.
- **Poprawka** — Trzy kliknięcia nie dawały żadnej odpowiedzi: „wczytaj" przy pustym polu, wiersz
  nagrania, którego już nie ma, i wiersz w rozbiciu leczenia.

## [0.2.0] — 2026-07-30

- **Nowość** — Drążenie obrażeń zadanych według celu: wejście w postać pokazuje, komu zadała, a
  wejście w cel — czym.
- **Nowość** — Skalowanie okna za róg w prawym dolnym rogu, jak w polu tekstowym. Rozmiar
  zapamiętuje się między sesjami, tak jak pozycja.
- **Nowość** — Kopiowanie statystyk przyciskiem ⧉: bieżąca walka i cała sesja trafiają do schowka.
- **Nowość** — Nagrywanie walk przyciskiem ⏺ (domyślnie wyłączone). Pasek pod nagłówkiem pokazuje,
  ile walk i ile miejsca zajmują; nagrywanie przeżywa odświeżenie gry, a limit 1 MB pilnuje, żeby
  nie zabrakło miejsca samej grze.
- **Nowość** — Okno archiwum przyciskiem ▤: lista nagranych walk ze składem, godziną, liczbą tur,
  sumą obrażeń i wynikiem. Kliknięcie wczytuje walkę do panelu z pełnym drążeniem i filtrami, tak
  jak na żywo.
- **Nowość** — Odtwarzanie walki przyciskiem ▶: linia po linii, z pauzą, przewijaniem i prędkością
  1×/2×/4×. Widać, jak ranking przestawiał się w trakcie starcia.
- **Nowość** — Ręczne wklejenie zapisu walki w archiwum. Liczy się tak samo jak nagranie, ale nie
  zajmuje miejsca w pamięci przeglądarki.
- **Nowość** — Żółty pasek PODGLĄD mówi wprost, skąd dane i czyja to walka. Licznik na żywo leci w
  tle bez przerwy, a „na żywo" wraca do bieżącej walki.
- **Nowość** — Rozbicie obrażeń według rodzaju (ogień, zimno, błyskawice, trucizna, krwawienie…)
  jako drugi przekrój obok „czym zadane".
- **Nowość** — Kolor paska według profesji. Postać poznaje się po barwie, a nie po miejscu na
  liście.
- **Zmiana** — Rozbicie leczenia nazwane „OD CZEGO", spójnie z „OD KOGO / KOMU" przy obrażeniach.
- **Zmiana** — Dodatek nie uruchamia się poza grą: podstrony w rodzaju pomocy są wykluczone, a tam,
  gdzie nie widać ani gry, ani okna walki, panel się nie rysuje.
- **Zmiana** — Zakładka „Tury" wycofana z opisu wydania 0.1.0 — nigdy nie dało się jej wybrać.
  Średnia „na turę" jest za to w każdym wierszu.
- **Poprawka** — Walki grupowe gubiły część statystyk. Leczenie potworów, utrata tury z powodem,
  wzmocnienie za małą grupę, ładowanie ciosów specjalnych i „Ostatni ratunek" są już rozumiane.
- **Poprawka** — Dymek nad wierszem wczytanego nagrania znów się pokazuje. Wcześniej nie pojawiał
  się wcale, a przy walce z postacią o tej samej nazwie pokazywał cudze liczby.
- **Poprawka** — Kliknięcia w trakcie odtwarzania nie giną. Przy prędkości 4× nie dało się wcześniej
  nawet wyjść z podglądu bez pauzy.
- **Poprawka** — Okna nie da się już zgubić za krawędzią ekranu, także po zmianie rozdzielczości.
- **Poprawka** — Prawy przycisk w polu wklejania otwiera normalne menu przeglądarki zamiast cofać
  widok. Bez tego nie dało się wkleić myszą.
- **Poprawka** — Wpisany tekst nie znika po zakończeniu walki w tle, a lista archiwum nie przewija
  się sama na górę.
- **Poprawka** — Dymek rysuje się nad panelem i nad archiwum, a nie pod nimi.
- **Poprawka** — Suma sesji liczy poprawnie rozbicie „komu zadał". Dotąd zatrzymywała się na
  pierwszej walce.

## [0.1.0] — pierwsze wydanie

- **Nowość** — Nakładka z licznikiem obrażeń nad grą, czytana na żywo z okna walki.
- **Nowość** — Zakładki: **Zadane**, **Otrzymane**, **Leczenie**.
- **Nowość** — Filtr składu **Wszyscy / Mój zespół / Przeciwnicy** oraz przełącznik **na turę**.
- **Nowość** — Dymek ze skrótem statystyk postaci; przeciąganie i zwijanie nakładki z zapamiętaną
  pozycją.
- **Nowość** — Obsługa światów `*.margonem.pl` i `*.margonem.com`.
