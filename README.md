**Polski** · [English](README.en.md)

# MargoMeter

Miernik obrażeń do [Margonem](https://www.margonem.pl/) — statystyki walki na żywo, w panelu nad
grą. SKADA albo Details!, dla Margonem.

<table>
<tr>
<td valign="top" align="center">
<img src="screenshots/panel-ranking.png" width="390"
alt="Ranking walczących po otrzymanych obrażeniach, a obok okno Pomocnika">
<br><sub><b>Ranking</b></sub>
<br><br>
<img src="screenshots/panel-deep.png" width="390"
alt="Najgłębszy poziom: co przeszło między tą dwójką">
<br><sub><b>Trzeci poziom</b></sub>
<br><br>
<img src="screenshots/panel-shelf.png" width="390"
alt="Półka z walkami, które są jeszcze zapisane">
<br><sub><b>Półka walk</b></sub>
</td>
<td valign="top" align="center">
<img src="screenshots/panel-opened.png" width="390"
alt="Rozwinięty wiersz: od kogo padły obrażenia">
<br><sub><b>Rozwinięty wiersz</b></sub>
<br><br>
<img src="screenshots/panel-half-named.png" width="390"
alt="Rozwinięty „Nieznany sprawca”: kogo dosięgło i czym poszło">
<br><sub><b>Nieznany sprawca</b></sub>
</td>
</tr>
<tr>
<td colspan="2" align="center">
<img src="screenshots/panel-card.png" width="530"
alt="Karta postaci otwarta obok panelu">
<br><sub><b>Karta postaci</b></sub>
</td>
</tr>
</table>

Walka dziesięciu na jednego, na ekranie obrażeń otrzymanych.

- Obrażenia i przywracanie życia, zadane i otrzymane, dla każdej postaci, w każdej walce.
- Wiersz się rozwija, i to trzy poziomy w głąb: kto komu, potem czym — umiejętnością, typem obrażeń
  albo wierszem „Zwykły cios", pod którym stoi to, czego gra żadną umiejętnością nie nazwała; na
  ekranach obrażeń bywa on pierwszy. Rozwija się kliknięciem, a wraca kliknięciem prawym przyciskiem
  w dowolnym miejscu panelu albo w ścieżkę nad listą.
- Najedź na wiersz postaci — na liście albo w rozwiniętym wierszu — żeby zobaczyć jej kartę: tę
  liczbę, o którą pytasz ekranem, i każdą z pozostałych trzech, która nie jest zerem, tury wykonane
  i te utracone, krytyki, co zatrzymała obrona i co zniszczył atak. To samo na każdym ekranie.
  Liczba, która znaczy węziej, niż mówi jej nazwa, ma obok siebie znak, a pod kartą zdanie
  wyjaśniające, czego gra nie podaje.
- Skończone walki trafiają na półkę i można do nich wrócić. Każda mówi, którego dnia i o której się
  odbyła, a obok — gdzie. Na nazwę miejsca zostaje przez to mniej miejsca i dłuższa bywa ucięta;
  pełną widać w okienku wiersza.
- Obok panelu stoi drugie okno: mówi, czyja jest tura i co w tej chwili stoi na walce — umiejętności
  rzucone na całą stronę i okrzyki — z tym, ile tur minęło z tych, które podaje gra. Nigdy z tym,
  ile zostało: tego gra nie mówi. Kiedy ktoś szykuje cios specjalny, stoi tam osobno — z tym, ile
  tur ładowania minęło, i czym się skończyło.
- Tylko sumy, bez przeliczników. To, czego log nikomu nie przypisuje, dostaje własny wiersz i własną
  liczbę — nigdy nie doklejamy tego do czyjegoś wyniku. Ten wiersz mówi, czego gra nie podała, i też
  się rozwija: widać w nim, kogo to dosięgło i czym poszło.
- Tylko odczyt: żadnej sieci, żadnej automatyzacji, żadnego wpływu na przebieg walki.

## Instalacja

Potrzebne są dwie rzeczy: przeglądarka na komputerze i menedżer skryptów użytkownika — rozszerzenie,
które uruchamia dodatki takie jak ten. MargoMeter działa w każdej aktualnej przeglądarce: Chrome,
Edge, Firefox i Safari.

1. **Zainstaluj menedżer skryptów.** [Tampermonkey][tampermonkey] jest na każdą z tych przeglądarek,
   [Violentmonkey][violentmonkey] na Chrome, Edge i Firefoksa. Wystarczy jeden.
2. **W Chrome i w Edge włącz obsługę skryptów użytkownika.** Na stronie rozszerzenia, w
   `chrome://extensions`. Bez tego nic się nie uruchomi i nic o tym nie powie. Firefox i Safari nie
   wymagają tego kroku.
3. **Otwórz [najnowsze wydanie][latest] i kliknij `margometer.user.js`.** Menedżer rozpozna plik i
   zaproponuje instalację. Na tej samej stronie leży `margometer.meta.js` — plik służbowy, nie do
   klikania: niesie sam nagłówek, bez ani jednej linii kodu.
4. **Wejdź do gry i zacznij walkę.** Panel pojawi się nad grą. Jeśli go nie ma, wróć do kroku 2.

Zainstalowana kopia sama sprawdza, czy jest nowsza wersja.

[latest]: https://github.com/KamilGrocholski/margometer/releases/latest
[tampermonkey]: https://www.tampermonkey.net/
[violentmonkey]: https://violentmonkey.github.io/

## Zobacz na żywo

**[kamilgrocholski.github.io/margometer][preview]** odtwarza nagraną walkę w Twojej przeglądarce,
rysowaną przez plik z najnowszego wydania. Nic tam nie łączy się z grą.

[preview]: https://kamilgrocholski.github.io/margometer/
