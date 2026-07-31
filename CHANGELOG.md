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
