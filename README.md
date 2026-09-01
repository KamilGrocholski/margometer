**Polski** · [English](README.en.md)

# MargoMeter

Miernik obrażeń do [Margonem](https://www.margonem.pl/) — statystyki walki na żywo, w panelu nad
grą. SKADA albo Details!, dla Margonem.

<table>
<tr>
<td valign="top" align="center">
<img src="screenshots/panel-ranking.png" width="276"
alt="Ranking walczących po otrzymanych obrażeniach">
<br><sub><b>Ranking</b></sub>
<br><br>
<img src="screenshots/panel-deep.png" width="276"
alt="Najgłębszy poziom: co przeszło między tą dwójką">
<br><sub><b>Trzeci poziom</b></sub>
<br><br>
<img src="screenshots/panel-shelf.png" width="276"
alt="Półka z walkami, które są jeszcze zapisane">
<br><sub><b>Półka walk</b></sub>
</td>
<td valign="top" align="center">
<img src="screenshots/panel-opened.png" width="276"
alt="Rozwinięty wiersz: od kogo padły obrażenia">
<br><sub><b>Rozwinięty wiersz</b></sub>
<br><br>
<img src="screenshots/panel-half-named.png" width="276"
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

Walka dziesięciu na jednego, na zakładce obrażeń otrzymanych.

- Obrażenia i przywracanie życia, zadane i otrzymane, dla każdej postaci, w każdej walce.
- Wiersz się rozwija, i to trzy poziomy w głąb: kto komu, potem czym — umiejętnością albo typem
  obrażeń.
- Najedź na wiersz postaci — na liście albo w rozwiniętym wierszu — żeby zobaczyć jej kartę:
  wszystkie cztery liczby, krytyki, największy cios, co zatrzymała obrona i co zniszczył atak. To
  samo na każdej zakładce.
- Skończone walki trafiają na półkę i można do nich wrócić. Panel mówi, gdzie się toczyły.
- Tylko sumy, bez przeliczników. To, czego log nikomu nie przypisuje, dostaje własny wiersz i własną
  liczbę — nigdy nie doklejamy tego do czyjegoś wyniku. Ten wiersz mówi, czego gra nie podała, i też
  się rozwija: widać w nim, kogo to dosięgło i czym poszło.
- Tylko odczyt: żadnej sieci, żadnej automatyzacji, żadnego wpływu na przebieg walki.

## Instalacja

Otwórz [najnowsze wydanie][latest] i kliknij `margometer.user.js` — Tampermonkey rozpozna plik,
zainstaluje go i będzie aktualizował.

Działa w każdej aktualnej przeglądarce na komputerze: Chrome, Edge, Firefox i Safari. W Chrome i w
Edge trzeba jeszcze włączyć obsługę skryptów użytkownika na stronie rozszerzenia, w
`chrome://extensions` — bez tego nic się nie uruchomi i nic o tym nie powie.

[latest]: https://github.com/KamilGrocholski/margometer/releases/latest

## Zobacz na żywo

**[kamilgrocholski.github.io/margometer][preview]** odtwarza nagraną walkę w Twojej przeglądarce,
rysowaną przez plik z najnowszego wydania. Nic tam nie łączy się z grą.

[preview]: https://kamilgrocholski.github.io/margometer/
