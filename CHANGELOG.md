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
- Drążenie obrażeń **zadanych wg celu**: wejście w postać pokazuje najpierw komu
  zadała, a po wejściu w cel — czym (broń, umiejętności, trucizna).
- **Skalowanie okna nakładki** za róg w prawym dolnym rogu (jak w textarea);
  rozmiar zapamiętuje się między sesjami, tak jak pozycja.

### Zmienione
- Rozbicie **leczenia** nazwane „OD CZEGO" (źródło: regeneracja, aura,
  samoratunek) — spójnie z „OD KOGO / KOMU" przy obrażeniach.

### Naprawione
- Poprawna obsługa **walk grupowych** i nowych linii logu: leczenie potworów bez
  procenta życia, utrata tury z powodem w nawiasie, wzmocnienie za małą grupę,
  ładowanie ciosów specjalnych, „Przerwanie ciosu specjalnego" oraz leczenie
  „Ostatni ratunek" wcięte w środek tury — wcześniej gubiły część statystyk.

## [0.1.0] — pierwsze wydanie

### Dodane
- Nakładka z licznikiem obrażeń nad grą, czytana na żywo z okna walki.
- Metryki: **Zadane**, **Otrzymane**, **Leczenie**, **Tury**.
- Filtr składu: **Wszyscy / Mój zespół / Przeciwnicy** oraz przełącznik **na turę**.
- Dymek ze skrótem statystyk postaci; przeciąganie i zwijanie nakładki
  z zapamiętaną pozycją.
- Wsparcie domen `*.margonem.pl` i `*.margonem.com`.
