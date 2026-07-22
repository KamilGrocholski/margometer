<!--
  Standardowy opis dodatku do Margonem. Każdy kolejny dodatek trzyma DOKŁADNIE ten
  sam szkielet sekcji, żeby wszystkie wyglądały tak samo — wypełniasz treścią
  danego dodatku, nie ruszasz kolejności ani nagłówków.

  Szkielet (w tej kolejności):
    # <Nazwa> + jednozdaniowe hasło
    ## Zrzuty ekranu
    ## Opis            (co robi, co pokazuje, przekroje)
    ## Znane ograniczenia   (jeśli są; inaczej pomiń)
    ## Wersja          (+ wspierane domeny)
    ## Instalacja i użycie
    ## Wsparcie
    ## Linki
-->

# MargoMeter

Licznik obrażeń do [Margonema](https://www.margonem.pl) — statystyki z okna walki,
na żywo, w nakładce nad grą. Odpowiednik SKADY czy DPS-metra znanego z World of
Warcraft, przełożony na turową mechanikę Margonema.

## Zrzuty ekranu

<!-- TODO: podmienić na prawdziwe zrzuty -->
| | |
|---|---|
| ![Nakładka w trakcie walki](screenshots/overlay.png) | ![Rozbicie obrażeń w dymku](screenshots/tooltip.png) |
| Nakładka w trakcie walki | Rozbicie obrażeń po najechaniu na wiersz |

## Opis

MargoMeter czyta na bieżąco tekst z okna walki i przelicza go na statystyki
każdego uczestnika — twoich i przeciwników. Nie modyfikuje gry, nie wysyła
niczego na zewnątrz, niczego nie klika za ciebie: tylko czyta to, co i tak masz
przed oczami, i pokazuje w formie tabeli.

**Co pokazuje:**

- **Zadane** — obrażenia zadane, z podziałem na cele (komu) i dalej na źródła
  (broń, umiejętności, trucizna, głęboka rana) oraz na typy (żywioły, efekty)
- **Otrzymane** — obrażenia przyjęte, z podziałem na to, kto je zadał, i czym
- **Leczenie** — leczenie otrzymane wraz ze źródłem (regeneracja, aura, samoratunek)
- **Tury** — liczba tur, w których postać działała, plus tury utracone

**Przekroje:**

- **Wszyscy** / **Mój zespół** / **Przeciwnicy** — filtr składu
- **Na turę** — przełącznik: sumy albo średnia na turę

**Nawigacja (mysz):** lewy przycisk wchodzi w postać i drąży rozbicie o szczebel
głębiej (ranking → komu/od kogo → czym), prawy przycisk wraca o szczebel. Pod
każdym wierszem najechanie pokazuje skrót statystyk postaci.

**W dymku pod wierszem:** trafienia i uniki, krytyki, największy pojedynczy cios,
obrażenia pochłonięte oraz efekty nałożone i przyjęte (klątwy, zranienia,
podpalenia).

Nakładkę można przeciągać, zwijać i **skalować za róg** (jak textarea) — pozycja
i rozmiar zapamiętują się między sesjami.

## Znane ograniczenia

Kilka rzeczy log walki po prostu przemilcza, więc MargoMeter oznacza je zamiast
zgadywać:

- **Trucizna bez sprawcy** — linia `traci N pkt. życia od trucizny` nie mówi, kto
  otruł. Przy dokładnie jednym przeciwniku obrażenia trafiają do niego, w innym
  wypadku lądują w stopce jako „Trucizna bez sprawcy”.
- **Leczenie bez leczącego** — log nie nazywa leczącego, więc leczenie rozbijamy
  po źródle (od czego), a nie po postaci.
- **Dwie postacie o tej samej nazwie** — gdy log ich nie rozróżnia, dostają jeden
  wspólny wiersz, a nazwa oznaczona jest gwiazdką (`*`). To znak, że liczba
  obejmuje więcej niż jedną postać.
- **Nierozpoznane linie** — jeśli w logu pojawi się coś, czego parser nie zna,
  stopka pokaże ostrzeżenie. Statystyki są wtedy niepełne — to dobry moment na
  zgłoszenie błędu.

## Wersja

**0.1.0** — pierwsze wydanie. Pełna historia zmian: [CHANGELOG.md](CHANGELOG.md).

Wspierane domeny: `*.margonem.pl`, `*.margonem.com`.

## Instalacja i użycie

1. Zainstaluj [Tampermonkey](https://www.tampermonkey.net) w swojej przeglądarce.
2. Otwórz plik `margometer.user.js` — Tampermonkey sam zaproponuje instalację.
3. Wejdź do gry. Nakładka pojawi się w rogu ekranu.
4. Wejdź w walkę — tabela zacznie się wypełniać od pierwszej tury.

Nakładka działa sama z siebie, nie ma nic do skonfigurowania. Sterowanie:

| Element | Działanie |
|---|---|
| Pasek tytułu | Przeciągnij, aby przesunąć nakładkę |
| Róg w prawym dolnym rogu | Pociągnij, aby zmienić rozmiar okna |
| `—` / `▢` | Zwiń / rozwiń |
| Zakładki u góry | Zmiana metryki i filtru drużyny |
| Lewy przycisk na wierszu | Wejście w postać / głębiej w rozbicie |
| Prawy przycisk | Powrót o szczebel |
| Najechanie na wiersz | Skrót statystyk postaci |

Statystyki walki zerują się przy wejściu w kolejne starcie.

## Wsparcie

Błędy i propozycje zgłaszaj przez GitHub Issues:

<!-- TODO: podmienić na prawdziwy adres repozytorium -->
**https://github.com/USER/margometer/issues**

Zgłaszając błąd w statystykach, dołącz **tekst z okna walki** (zaznacz i skopiuj
całą treść logu) — bez niego nie da się odtworzyć problemu. Przydaje się też
nazwa przeglądarki i wersja MargoMetra.

## Linki

<!-- TODO: uzupełnić po opublikowaniu repozytorium -->

- [Repozytorium na GitHubie](https://github.com/USER/margometer)
- [Zgłoszenia błędów](https://github.com/USER/margometer/issues)
- [Tampermonkey](https://www.tampermonkey.net) — wymagane rozszerzenie
- [Margonem](https://www.margonem.pl) — gra
