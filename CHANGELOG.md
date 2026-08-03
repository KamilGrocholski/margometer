<!--
  Changelog DLA UŻYTKOWNIKÓW dodatku. Wersjonowanie: SemVer
  (https://semver.org/lang/pl/).

  Zasady:
  - Najnowsze na górze. Sekcja [Niewydane] zbiera zmiany przed kolejnym wydaniem.
  - Jedna płaska lista na wersję. Każdy wpis zaczyna się typem: **Nowość**,
    **Zmiana** albo **Poprawka**. Kolejność w obrębie wersji: nowości, zmiany,
    poprawki.
  - Jeden wpis to jedno–trzy zdania. Kto chce szczegółów, ma historię gita.
  - PISZ Z PERSPEKTYWY UŻYTKOWNIKA i bez pojęć programistycznych. Nie „parser",
    „regex", „DoT", „cache" — tylko to, co widać w grze i w panelu. Test:
    czy zrozumie to ktoś, kto gra w Margonem i nigdy nie widział kodu?
  - Rzeczy, które użytkownika nie dotyczą (refaktory, testy, narzędzia), tu
    NIE WCHODZĄ. Praca programistyczna opisana jest w `docs/specy/`.
  - Przy wydaniu: przenieś [Niewydane] pod nowy numer wersji z datą RRRR-MM-DD.
    To pierwszy z trzech kroków; pozostałe dwa (package.json, tag) i to, co
    robi dalej CI, opisuje docs/WYDANIE.md.
-->

# Zmiany

Wszystkie istotne zmiany w tym dodatku są tu notowane.

> ⚠️ **Wczesna faza (alpha).** Numery `0.x` nie obiecują zgodności — układ
> panelu, nazwy i zapisane ustawienia mogą się zmienić między wydaniami.
> Zgodnie z SemVer: przy zerowej wersji głównej wszystko może się zmienić
> w każdej chwili. Do czasu `1.0.0` czytaj wpisy oznaczone **Zmiana** przed
> aktualizacją.

## [Niewydane]

- **Poprawka** — Gdy okno walki napisze linię obrażeń w kształcie, którego
  licznik nie rozumie, panel mówi o tym wprost zamiast pokazywać liczbę wziętą
  z sąsiedniej linii albo cios „za zero". Do tej pory taka linia potrafiła
  przejść bez ostrzeżenia, a w statystykach zostawała wartość, której w logu
  nie było.
- **Poprawka** — Zablokowane obrażenia nie gubią się, gdy gra napisze o nich
  poza opisem ciosu. Wcześniej taka kwota po prostu znikała ze statystyk.
- **Poprawka** — Ostrzeżenie o nieznanym rodzaju obrażeń zapala się także wtedy,
  gdy gra oznaczy go cyfrą, a nie literą. Do tej pory taki rodzaj pojawiał się
  w rozbiciu jako „Nieznany", ale panel o nim nie uprzedzał.

## [0.4.0] — 2026-08-03

- **Nowość** — Panel pokazuje numer wersji dodatku, a skopiowane statystyki
  niosą go razem z liczbami. Zgłaszając, że coś nie zagrało, nie trzeba już
  zgadywać, której wersji to dotyczy — zwłaszcza że dodatek aktualizuje się sam.
- **Nowość** — Najechanie na postać pokazuje w dymku trzy jej najsilniejsze
  pozycje wraz z udziałem — komu zadała, od kogo obrywa albo z czego się leczy,
  zależnie od wybranej zakładki. Na pytanie „co go tak boli?" odpowiada teraz
  samo najechanie, bez wchodzenia w postać i wracania. Gdy pozycji jest więcej,
  dymek mówi, ile zostało na pełnej liście.
- **Zmiana** — Odznaka z literą profesji stoi teraz przy nazwie postaci wszędzie:
  na liście składu, w rozbiciu „komu" i „od kogo", w ścieżce powrotu i w dymkach.
  Sam kolor nie wystarczał, bo dwie postacie tej samej profesji mają go wspólny.
- **Zmiana** — Panel i okno archiwum wyglądają jak jedno narzędzie: to samo tło,
  ta sama ramka, to samo podświetlenie pod kursorem.
- **Zmiana** — Skopiowane statystyki opisują już tylko tę jedną walkę, na którą
  patrzysz. Wcześniej doklejała się do nich suma wszystkich walk od włączenia
  gry — liczba, której panel nigdzie nie pokazywał i o której nie było jak się
  dowiedzieć inaczej niż wklejając skopiowany tekst gdzieś indziej.
- **Poprawka** — Zamknięcie okna archiwum kończy liczenie podsumowań. Wcześniej
  liczyły się dalej, w tle, choć okna nie było już na ekranie — a robiły to
  kosztem płynności gry.
- **Poprawka** — Usunięcie jednego nagrania nie każe liczyć od nowa wszystkich
  pozostałych.
- **Poprawka** — Dodatek nie uruchamia się już na stronie głównej Margonema
  (adres bez „www") ani na forum i commonsach w domenie `.com`.
- **Poprawka** — Ubytki życia, które nie pochodzą od niczyjego ciosu, wchodzą
  teraz do obrażeń przyjętych zamiast zapalać ostrzeżenie. W walkach, w których
  ktoś z drużyny rzucał trującą mgłę, panel pokazywał tym postaciom mniej
  obrażeń, niż naprawdę oberwały. Przy takim ubytku panel pisze **„Bez
  sprawcy"** — nie zgaduje, że zadał go przeciwnik.
- **Poprawka** — Kilka komunikatów z walk drużynowych przestaje być
  niezrozumiałych dla licznika: okrzyk wzmacniający całą drużynę, czar rzucony
  na siebie i utrata energii. Ostrzeżenie „nieznane linie" zapalało się wtedy
  bez powodu.
- **Poprawka** — Trzeci cios tancerza ostrzy ma w rozbiciu własną pozycję.
  Wcześniej jego obrażenia były liczone, ale nie dało się zobaczyć, skąd
  pochodzą.
- **Poprawka** — Nazwa postaci, w którą się weszło, nie mruga już przy
  przełączaniu zakładek ani w trakcie walki. Wcześniej podświetlenie pod
  kursorem gasło kilka razy na sekundę, właśnie na tym napisie, który ma dawać
  znać, że panel trzyma wybraną postać.
- **Poprawka** — Energia, którą postać sama zyskuje przy ciosie, nie jest już
  wypisywana w dymku jako efekt sprzętu. Stała tam obok klątw i niszczenia
  pancerza, czyli obok rzeczy, które cios robi przeciwnikowi — a to jest zysk
  własny. Zabranie energii lub many przeciwnikowi zostaje, bo efektem jest.

## [0.3.0] — 2026-08-01

Pierwsze wydanie, które **da się pobrać i które samo się aktualizuje**.
Wcześniejsze numery istniały tylko w repozytorium — jedyną drogą było zbudowanie
pliku u siebie.

- **Nowość** — Instalacja jednym kliknięciem i automatyczne aktualizacje.
  Dodatek ma stały adres pobierania, a rozszerzenie samo proponuje nowszą wersję.
- **Nowość** — Odznaka z literą profesji przy nazwie postaci. Sam kolor nie
  wystarczał przy dłuższej liście ani przy wadach wzroku.
- **Nowość** — Rozbicie według umiejętności, bez względu na cel. Sekcja
  „CZYM (ŁĄCZNIE)" odpowiada, która umiejętność faktycznie robi robotę —
  wcześniej trzeba było obejść wszystkie cele i dodać w głowie.
- **Nowość** — Klik w umiejętność pokazuje, komu zadała. Ten sam gest
  z przeciwnej strony ciosu; działa też dla obrażeń otrzymanych.
- **Nowość** — Zablokowane obrażenia i ciosy bardzo krytyczne widać w dymku,
  a osłabione obrażenia od trucizny nie zaniżają już sumy.
- **Nowość** — Panel nazywa już wszystkie rodzaje obrażeń, jakie widział.
  Doszły **broń pomocnicza** (drugie ostrze tancerza) i **globalne** (ciosy
  bijące we wszystkich naraz).
- **Zmiana** — Rodzaje obrażeń zwinęły się w rodziny: dziewięć wierszy
  w rozbiciu zrobiło się siedem.
- **Zmiana** — Paski są jaśniejsze, żeby tekst na nich dało się przeczytać.
  Pełną barwę trzyma teraz nasadka na końcu paska.
- **Zmiana** — Pozycje bez sprawcy zeszły do jednego wiersza na końcu rankingu,
  zamiast udawać postać wśród postaci. Klik mówi, co w tej puli siedzi.
- **Zmiana** — Panel pamięta też ustawienia, nie tylko położenie. Wybrana
  zakładka, filtr składu i tryb „na turę" wracają po odświeżeniu strony.
- **Zmiana** — Długa sesja przestała rosnąć w pamięci: po 195 walkach **21×
  mniej zajętej pamięci** i **59× szybsze** liczenie sumy, przy tym samym wyniku.
- **Zmiana** — Nagrywanie mniej obciąża grę: około **48× mniej zapisów**
  w trakcie walki.
- **Poprawka** — Otwarcie archiwum zacinało grę. Przy 190 nagraniach było to
  ćwierć sekundy zamrożonej gry za każdym razem; teraz panel liczy tylko to,
  co widać, a reszta dolicza się w tle.
- **Poprawka** — Uniki pełne i częściowe liczyły się razem, więc licznik uników
  pokazywał więcej, niż się wydarzyło.
- **Poprawka** — Dwie postacie o tej samej nazwie po obu stronach wypadały
  z podziału na zespoły.
- **Poprawka** — Obrażenia od zranienia nie miały właściciela, choć walka podaje
  sprawcę wprost. W starciu z Hildur wracają dzięki temu 3 380 punktów dla łowcy.
- **Poprawka** — Przypis o truciźnie nazywał tak również ogień i rany. Teraz
  wypisuje, co w tej puli faktycznie jest.
- **Poprawka** — Leczenia bez sprawcy nie było widać nigdzie — w starciu
  z Hildur 133 867 punktów. Teraz stoi w stopce, obok trucizny.
- **Poprawka** — Walki z bossami meldowały nierozpoznane linie, a leczenie
  drużyny znikało. „Uleczono X o N punktów życia" nie było w ogóle rozumiane,
  więc kilkadziesiąt tysięcy wyleczonych punktów po prostu nie istniało.
- **Poprawka** — Leczenie cudzą ręką dopisywało się leczonemu. Teraz jako własne
  liczy się tylko to, co postać rzuciła na siebie.
- **Poprawka** — Cios o trzech liczbach potrafił trafić w niewłaściwy rodzaj
  obrażeń: gdy przeciwnik wytłumił jedną z nich do zera, obrażenia od zimna
  lądowały pod ogniem. Suma się zgadzała, więc nic tego nie zdradzało.
- **Poprawka** — Nagrania potrafiły zajmować miejsce mimo skasowania.
- **Poprawka** — Nagrywanie wracało włączone po komunikacie o braku miejsca.
- **Poprawka** — Jedna walka trafiała do archiwum jako dwa nagrania, w tym jedno
  puste.
- **Poprawka** — Awaria licznika zabierała ze sobą nagrywanie, czyli jedyny
  zapis, z którego dałoby się ją odtworzyć.
- **Poprawka** — Kopiowanie meldowało sukces nad pustym schowkiem. Teraz przy
  odmowie mówi „✕".
- **Poprawka** — „wyczyść" wyglądał na zepsuty: pytanie „na pewno?" wygasało po
  pięciu sekundach, ale napis na przycisku zostawał.
- **Poprawka** — Pytanie o skasowanie nagrania nie wygasało wcale. Wystarczyło
  kliknąć ✕, odejść i wrócić po godzinie, żeby skasować bez pytania.
- **Poprawka** — Kopiowanie w podglądzie dawało co innego, niż widać na ekranie.
- **Poprawka** — Zwinięty panel udawał, że pokazuje bieżącą walkę, choć leciało
  odtwarzanie nagrania.
- **Poprawka** — Trzy kliknięcia nie dawały żadnej odpowiedzi: „wczytaj" przy
  pustym polu, wiersz nagrania, którego już nie ma, i wiersz w rozbiciu leczenia.

## [0.2.0] — 2026-07-30

- **Nowość** — Drążenie obrażeń zadanych według celu: wejście w postać pokazuje,
  komu zadała, a wejście w cel — czym.
- **Nowość** — Skalowanie okna za róg w prawym dolnym rogu, jak w polu
  tekstowym. Rozmiar zapamiętuje się między sesjami, tak jak pozycja.
- **Nowość** — Kopiowanie statystyk przyciskiem ⧉: bieżąca walka i cała sesja
  trafiają do schowka.
- **Nowość** — Nagrywanie walk przyciskiem ⏺ (domyślnie wyłączone). Pasek pod
  nagłówkiem pokazuje, ile walk i ile miejsca zajmują; nagrywanie przeżywa
  odświeżenie gry, a limit 1 MB pilnuje, żeby nie zabrakło miejsca samej grze.
- **Nowość** — Okno archiwum przyciskiem ▤: lista nagranych walk ze składem,
  godziną, liczbą tur, sumą obrażeń i wynikiem. Kliknięcie wczytuje walkę do
  panelu z pełnym drążeniem i filtrami, tak jak na żywo.
- **Nowość** — Odtwarzanie walki przyciskiem ▶: linia po linii, z pauzą,
  przewijaniem i prędkością 1×/2×/4×. Widać, jak ranking przestawiał się
  w trakcie starcia.
- **Nowość** — Ręczne wklejenie zapisu walki w archiwum. Liczy się tak samo jak
  nagranie, ale nie zajmuje miejsca w pamięci przeglądarki.
- **Nowość** — Żółty pasek PODGLĄD mówi wprost, skąd dane i czyja to walka.
  Licznik na żywo leci w tle bez przerwy, a „na żywo" wraca do bieżącej walki.
- **Nowość** — Rozbicie obrażeń według rodzaju (ogień, zimno, błyskawice,
  trucizna, krwawienie…) jako drugi przekrój obok „czym zadane".
- **Nowość** — Kolor paska według profesji. Postać poznaje się po barwie,
  a nie po miejscu na liście.
- **Zmiana** — Rozbicie leczenia nazwane „OD CZEGO", spójnie z „OD KOGO / KOMU"
  przy obrażeniach.
- **Zmiana** — Dodatek nie uruchamia się poza grą: podstrony w rodzaju pomocy są
  wykluczone, a tam, gdzie nie widać ani gry, ani okna walki, panel się nie
  rysuje.
- **Zmiana** — Zakładka „Tury" wycofana z opisu wydania 0.1.0 — nigdy nie dało
  się jej wybrać. Średnia „na turę" jest za to w każdym wierszu.
- **Poprawka** — Walki grupowe gubiły część statystyk. Leczenie potworów,
  utrata tury z powodem, wzmocnienie za małą grupę, ładowanie ciosów specjalnych
  i „Ostatni ratunek" są już rozumiane.
- **Poprawka** — Dymek nad wierszem wczytanego nagrania znów się pokazuje.
  Wcześniej nie pojawiał się wcale, a przy walce z postacią o tej samej nazwie
  pokazywał cudze liczby.
- **Poprawka** — Kliknięcia w trakcie odtwarzania nie giną. Przy prędkości 4×
  nie dało się wcześniej nawet wyjść z podglądu bez pauzy.
- **Poprawka** — Okna nie da się już zgubić za krawędzią ekranu, także po
  zmianie rozdzielczości.
- **Poprawka** — Prawy przycisk w polu wklejania otwiera normalne menu
  przeglądarki zamiast cofać widok. Bez tego nie dało się wkleić myszą.
- **Poprawka** — Wpisany tekst nie znika po zakończeniu walki w tle, a lista
  archiwum nie przewija się sama na górę.
- **Poprawka** — Dymek rysuje się nad panelem i nad archiwum, a nie pod nimi.
- **Poprawka** — Suma sesji liczy poprawnie rozbicie „komu zadał". Dotąd
  zatrzymywała się na pierwszej walce.

## [0.1.0] — pierwsze wydanie

- **Nowość** — Nakładka z licznikiem obrażeń nad grą, czytana na żywo z okna
  walki.
- **Nowość** — Zakładki: **Zadane**, **Otrzymane**, **Leczenie**.
- **Nowość** — Filtr składu **Wszyscy / Mój zespół / Przeciwnicy** oraz
  przełącznik **na turę**.
- **Nowość** — Dymek ze skrótem statystyk postaci; przeciąganie i zwijanie
  nakładki z zapamiętaną pozycją.
- **Nowość** — Obsługa światów `*.margonem.pl` i `*.margonem.com`.
