**Polski** · [English](README.en.md)

# MargoMeter

Miernik obrażeń do [Margonem](https://www.margonem.pl/) — statystyki walki na żywo, w panelu nad
grą. SKADA albo Details!, dla Margonem.

![Ranking walczących po otrzymanych obrażeniach](screenshots/panel-ranking.png)

![Rozwinięty wiersz: od kogo padły obrażenia i jakiego były typu](screenshots/panel-opened.png)

![Najgłębszy poziom: co przeszło między tą dwójką, po typach obrażeń](screenshots/panel-deep.png)

![Karta postaci otwarta obok panelu](screenshots/panel-card.png)

![Półka z walkami, które są jeszcze zapisane](screenshots/panel-shelf.png)

Walka dziesięciu na jednego, na zakładce obrażeń otrzymanych.

- Obrażenia i przywracanie życia, zadane i otrzymane, dla każdej postaci, w każdej walce.
- Wiersz się rozwija, i to trzy poziomy w głąb: kto komu, potem czym — umiejętnością albo typem
  obrażeń.
- Najedź na wiersz, żeby zobaczyć kartę postaci: wszystkie cztery liczby, krytyki, największy cios,
  co zatrzymała obrona i co zniszczył atak.
- Skończone walki trafiają na półkę i można do nich wrócić. Panel mówi, gdzie się toczyły.
- Tylko sumy, bez przeliczników. To, czego log nikomu nie przypisuje, dostaje własny wiersz i własną
  liczbę — nigdy nie doklejamy tego do czyjegoś wyniku.
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
