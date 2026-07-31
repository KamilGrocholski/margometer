<!--
  Standardowy changelog dodatku do Margonem. Każdy kolejny dodatek trzyma ten sam
  format, żeby wszystkie wyglądały tak samo. Konwencja: Keep a Changelog
  (https://keepachangelog.com/pl/) + wersjonowanie SemVer (https://semver.org/lang/pl/).

  Zasady:
  - Najnowsze na górze. Sekcja [Niewydane] zbiera zmiany przed kolejnym wydaniem.
  - Nagłówki zmian tylko z tego zestawu: Dodane, Zmienione, Naprawione, Usunięte,
    Wycofane (deprecated), Bezpieczeństwo.
  - Pisz z perspektywy użytkownika (co się zmienia w dodatku), nie z perspektywy kodu.
  - Przy wydaniu: przenieś [Niewydane] pod nowy numer wersji z datą RRRR-MM-DD.
-->

# Zmiany

Wszystkie istotne zmiany w tym dodatku są tu notowane.

## [Niewydane]

### Dodane
- **Rozbicie wg umiejętności, bez względu na cel.** W widoku postaci, pod listą
  celów, stoi druga sekcja „CZYM (ŁĄCZNIE)": te same obrażenia widziane od
  strony akcji, zsumowane po wszystkich celach. Odpowiada na pytanie „która
  umiejętność faktycznie robi robotę", którego wcześniej nie dało się zadać —
  trzeba było obejść wszystkie cele i dodać w głowie.
- **Drążenie z drugiej strony.** Klik w umiejętność pokazuje, komu zadała
  („KOMU — UDERZENIE KRÓLA WĘŻY"), tak jak klik w cel pokazuje, czym w niego
  poszło. Ten sam gest, przeciwna strona ciosu; prawy przycisk wraca identycznie
  z obu dróg. Działa też dla obrażeń otrzymanych.

### Naprawione
- **Nagrania potrafiły zajmować miejsce mimo skasowania.** Gdy spis nagrań uległ
  uszkodzeniu, same logi zostawały w pamięci przeglądarki na zawsze — niewidoczne
  dla licznika i dla „wyczyść", a zajmujące miejsce, które dodatek dzieli z grą.
- **Nagrywanie wracało włączone po komunikacie o braku miejsca.** Wystarczyło
  odświeżyć stronę: nagrywanie startowało z powrotem, a czerwony pasek znikał,
  choć w pamięci przeglądarki nic się nie zmieniło.
- **Jedna walka trafiała do archiwum jako dwa nagrania**, gdy gra rozjechała
  pogrubienie linii otwierającej albo zmieniła w niej odstępy. Panel pokazywał
  wtedy jedną walkę, a archiwum dwie — w tym jedną pustą.
- **Awaria licznika zabierała ze sobą nagrywanie**, czyli jedyny zapis, z którego
  dałoby się tę awarię odtworzyć. Teraz zapis idzie pierwszy i przeżywa
  niezależnie od reszty.

- **Kopiowanie potrafiło zameldować sukces nad pustym schowkiem.** Gdy
  przeglądarka odmówiła zapisu albo nie było czego kopiować, przycisk i tak
  migał „✓" — dowiadywało się o tym dopiero przy wklejaniu. Teraz mówi „✕".
- **„wyczyść" wyglądał na zepsuty.** Pytanie „na pewno?" wygasało po pięciu
  sekundach, ale napis na przycisku zostawał, a kolejny klik po cichu pytał od
  nowa — z ekranu nic się nie zmieniało. Teraz przycisk sam wraca do „wyczyść".
- **Pytanie o skasowanie nagrania nie wygasało w ogóle.** Wystarczyło kliknąć ✕
  przy nagraniu, odejść i wrócić po godzinie w to samo miejsce, żeby skasować
  bez pytania. Oba potwierdzenia działają teraz identycznie i gasną po pięciu
  sekundach; zamknięcie okna archiwum też je zdejmuje.

- **Kopiowanie w podglądzie dawało co innego, niż widać na ekranie.** Przycisk ⧉
  brał zawsze walkę na żywo, także gdy oglądałeś nagranie z archiwum. Teraz
  kopiuje to, co widzisz, i dopisuje, skąd to jest.
- **Zwinięty panel udawał, że pokazuje bieżącą walkę.** W trakcie oglądania
  nagrania zwinięcie chowało pasek PODGLĄD razem z wyjściem „na żywo", a
  odtwarzanie leciało dalej. Pasek zostaje teraz również po zwinięciu.
- **Trzy kliknięcia nie dawały żadnej odpowiedzi**: „wczytaj" przy pustym polu,
  wiersz nagrania, którego nie ma już w pamięci przeglądarki, oraz wiersz
  umiejętności w rozbiciu leczenia. Dwa pierwsze mówią teraz, o co chodzi;
  trzeci przestał udawać, że da się w niego wejść.

### Zmienione
- **Nagrywanie mniej obciąża grę.** Przy pełnym archiwum spis nagrań był
  przepisywany od nowa przy każdej linii logu — w tym samym wątku, w którym
  chodzi gra. Teraz idzie do pamięci przeglądarki tylko wtedy, gdy naprawdę się
  zmienia: ok. **48× mniej zapisów** w trakcie walki.

## [0.2.0] — 2026-07-30

### Dodane
- Drążenie obrażeń **zadanych wg celu**: wejście w postać pokazuje najpierw komu
  zadała, a po wejściu w cel — czym (broń, umiejętności, trucizna).
- **Skalowanie okna nakładki** za róg w prawym dolnym rogu (jak w textarea);
  rozmiar zapamiętuje się między sesjami, tak jak pozycja.
- **Kopiowanie statystyk** (przycisk ⧉ w nagłówku) — bieżąca walka i cała sesja
  jako JSON w schowku, niezależnie od tego, co akurat widać na ekranie.
- **Nagrywanie walk** (przycisk ⏺, domyślnie wyłączone): surowe logi lądują
  w pamięci przeglądarki, a pasek pod nagłówkiem pokazuje, ile walk i ile
  miejsca zajmują. Stamtąd można je skopiować albo wyczyścić. Nagrywanie
  przeżywa odświeżenie gry, a zapis pilnuje limitu 1 MB — najstarsze walki
  wypadają same, żeby nie zabrakło miejsca samej grze.
- **Okno archiwum** (przycisk ▤): lista nagranych walk ze składem, godziną,
  liczbą tur, sumą obrażeń i wynikiem. Kliknięcie wczytuje walkę do panelu —
  z pełnym drążeniem, filtrami i przełącznikiem „na turę", tak jak na żywo.
  Okno przeciąga się i pamięta pozycję oraz to, czy było otwarte.
- **Odtwarzanie walki** przyciskiem ▶ przy wierszu: log leci linia po linii,
  z pauzą, przewijaniem i prędkością 1×/2×/4× — widać, jak ranking przestawiał
  się w trakcie walki.
- **Ręczne wklejenie logu** w archiwum — liczy się tak samo jak nagranie,
  ale nie zajmuje miejsca w pamięci przeglądarki.
- Żółty pasek **PODGLĄD** mówi wprost, skąd dane („z archiwum · 19:04" albo
  „wklejony log") i czyja to walka. Licznik na żywo leci w tle bez przerwy,
  a „na żywo" wraca do bieżącej walki.

- **Rozbicie obrażeń według rodzaju** (ogień, zimno, błyskawice, trucizna,
  krwawienie…) jako drugi przekrój obok „czym zadane".
- **Kolor paska według profesji** i literowa odznaka przy nazwie — postać
  poznaje się po barwie, a nie po miejscu na liście. Odznaka jest tu warunkiem,
  nie ozdobą: przy daltonizmie sam kolor sześciu profesji nie rozróżnia.

### Zmienione
- Rozbicie **leczenia** nazwane „OD CZEGO" (źródło: regeneracja, aura,
  samoratunek) — spójnie z „OD KOGO / KOMU" przy obrażeniach.
- Dodatek **nie uruchamia się poza grą**: podstrony w rodzaju pomocy są
  wykluczone, a tam, gdzie nie widać ani gry, ani okna walki, panel się nie
  rysuje i przeszukiwanie strony samo gaśnie.
- Zakładka **Tury** wycofana z opisu wydania 0.1.0 — nigdy nie dało się jej
  wybrać w panelu. Średnia „na turę" jest za to w każdym wierszu.

### Naprawione
- Poprawna obsługa **walk grupowych** i nowych linii logu: leczenie potworów bez
  procenta życia, utrata tury z powodem w nawiasie, wzmocnienie za małą grupę,
  ładowanie ciosów specjalnych, „Przerwanie ciosu specjalnego" oraz leczenie
  „Ostatni ratunek" wcięte w środek tury — wcześniej gubiły część statystyk.
- **Dymek nad wierszem wczytanego nagrania** znów się pokazuje. Wcześniej dla
  walki z archiwum nie pojawiał się wcale, a gdy w tle trwała walka z postacią
  o tej samej nazwie — pokazywał jej liczby.
- **Kliknięcia w trakcie odtwarzania** nie giną: zakładki, okruszek i przyciski
  nagrywania działają także wtedy, gdy panel przebudowuje się co klatkę.
  Wcześniej przy prędkości 4× nie dało się nawet wyjść z podglądu bez pauzy.
- **Okna nie da się już zgubić za krawędzią ekranu.** Panel i archiwum zostają
  w zasięgu myszy także po zmianie rozdzielczości albo po otwarciu gry na
  węższym ekranie niż ten, na którym ustawiono położenie.
- **Prawy przycisk w polu wklejania logu** otwiera normalne menu przeglądarki
  zamiast cofać widok — bez tego nie dało się wkleić logu myszą.
- **Wpisany log nie znika** po zakończeniu walki w tle, a lista archiwum nie
  przewija się sama na górę.
- **Dymek rysuje się nad panelem i nad archiwum**, a nie pod nimi.
- **Suma sesji** liczy poprawnie rozbicie „komu zadał" — dotąd zatrzymywała się
  na pierwszej walce (widoczne w kopiowanych statystykach).

## [0.1.0] — pierwsze wydanie

### Dodane
- Nakładka z licznikiem obrażeń nad grą, czytana na żywo z okna walki.
- Metryki: **Zadane**, **Otrzymane**, **Leczenie**.
- Filtr składu: **Wszyscy / Mój zespół / Przeciwnicy** oraz przełącznik **na turę**.
- Dymek ze skrótem statystyk postaci; przeciąganie i zwijanie nakładki
  z zapamiętaną pozycją.
- Wsparcie domen `*.margonem.pl` i `*.margonem.com`.
