**Polski** · [English](README.en.md)

# MargoMeter

Licznik obrażeń do [Margonem](https://www.margonem.pl/) — statystyki walki na żywo, w panelu nad
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

## Instalacja

1. **Zainstaluj menedżer skryptów** w przeglądarce na komputerze: [Tampermonkey][tampermonkey]
   (Chrome, Edge, Firefox, Safari) albo [Violentmonkey][violentmonkey] (bez Safari).
2. **W Chrome i Edge włącz obsługę skryptów użytkownika** na stronie rozszerzenia, w
   `chrome://extensions`. Bez tego nic się nie uruchomi i nic o tym nie powie. W Safari zamiast tego
   włącz menedżera w ustawieniach rozszerzeń przeglądarki.
3. **Kliknij [plik dodatku][install]** — menedżer zaproponuje instalację. Poprzednie wydania leżą na
   [stronie wydań][latest].
4. **Wejdź do gry i zacznij walkę.** Panel pojawi się nad grą. Jeśli go nie ma, wróć do kroku 2.

Zainstalowana kopia sama sprawdza, czy jest nowsza wersja.

[install]: https://github.com/KamilGrocholski/margometer/releases/latest/download/margometer.user.js
[latest]: https://github.com/KamilGrocholski/margometer/releases/latest
[tampermonkey]: https://www.tampermonkey.net/
[violentmonkey]: https://violentmonkey.github.io/

## Zobacz na żywo

**[kamilgrocholski.github.io/margometer][preview]** odtwarza nagraną walkę w przeglądarce, bez gry,
i otwiera się instalacją: co trzeba mieć, przycisk i wersja za nim.

[preview]: https://kamilgrocholski.github.io/margometer/
