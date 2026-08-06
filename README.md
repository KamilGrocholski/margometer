# MargoMeter

Licznik obrażeń do [Margonem](https://www.margonem.pl/) — statystyki z walki,
na żywo, w okienku nad grą. To, czym dla World of Warcraft są SKADA
i Details!, tyle że Margonem jest turowy, więc i licznik liczy na tury.

Dodatek **niczego nie wysyła i niczego w grze nie zmienia**: czyta to, co gra
sama dostaje z serwera w trakcie walki, i rysuje obok własny panel. Nie
automatyzuje niczego, nie klika za Ciebie i nie wpływa na przebieg walki —
liczy to, co już się wydarzyło.

> ⚠️ **Wczesna faza (alpha).** Dodatek jest używalny, ale numery `0.x` **nie
> obiecują zgodności**: układ panelu, nazwy i zapisane ustawienia mogą się
> zmienić między wydaniami. Statystyki powstają z tego, co gra przysyła
> w trakcie walki, więc zmiana po jej stronie potrafi je popsuć do czasu
> poprawki. Panel mówi wtedy wprost, że czegoś nie rozumie, zamiast po cichu
> zaniżać liczby.
>
> Najbardziej przydatna rzecz, jaką możesz przysłać, to **nagranie walki**, na
> której coś nie zagrało: przycisk „kopiuj logi" **na pasku nagrywania
> w panelu**. Uwaga na nazwy — Margonem ma własne „Kopiuj logi" w oknie walki
> i kopiuje coś innego (zdania, które widzisz na ekranie). Dodatek ich nie
> czyta, więc w zgłoszeniu przydaje się ten pierwszy.

---

## Dodatek a regulamin Margonem

**MargoMeter nie jest autoryzowany przez Garmory** i nie ma po co udawać, że
sprawa jest oczywista. Przeczytaj to przed instalacją.

Co dodatek robi naprawdę — sprawdzalne w kodzie, nie tylko deklarowane:

- **nie wysyła niczego** — w całym `src/` nie ma ani jednego `fetch`,
  `XMLHttpRequest`, `WebSocket` ani `sendBeacon`;
- **nie automatyzuje** — nie klika, nie symuluje klawiatury, nie wykonuje
  żadnej akcji w grze;
- **nie zmienia przebiegu walki** — owija `Engine.battle.update`, ale oryginał
  leci pierwszy, a jego wynik wraca nietknięty; każda z tych gwarancji ma swój
  test i sprawdzoną mutację;
- **czyta i liczy** to, co gra sama dostała z serwera.

I mimo to: **owinięcie cudzej funkcji jest dotknięciem klienta gry**, a
[regulamin][reg] w VII.2 g) zakazuje — bez jasno wyrażonej zgody Usługodawcy —
korzystania z:

> (ii) usług, oprogramowania lub innych narzędzi technicznych bądź
> informatycznych, **bez względu na ich sposób działania**, służących do
> wspomagania […] udziału w Grze […]
>
> (iii) oprogramowania, którego użycie prowadzi do modyfikacji sposobu
> działania Gry, **w tym sposobu działania Gry na urządzeniu końcowym Gracza** […]

„Jasno wyrażona zgoda" jest tam zdefiniowana wąsko — jako oficjalny komunikat
wskazujący **konkretne** oprogramowanie. MargoMeter takiego nie ma. Sankcją
z [Taryfikatora Kar][tar] (V.4 a) za Niedozwolone Oprogramowanie jest **stała
blokada Konta**.

Z drugiej strony sam Usługodawca zakłada istnienie dodatków spoza swojej listy
— strona [Bezpieczeństwo][bez] (VII.2) mówi „Wszelkich innych dodatków używasz
na własną odpowiedzialność!", a nie „są zakazane" — i prowadzi
[Niezbędnik Dodatkopisarzy][nie], czyli oficjalną dokumentację dla piszących
dodatki.

**Czego z tego nie wiemy:** jak Garmory zakwalifikuje akurat licznik, który
tylko czyta. To ich decyzja, nie nasza, i nikt jej dotąd nie pytał.
**Co z tego wynika dla Ciebie:** instalujesz na własne ryzyko, a ryzykiem jest
konto. Jeśli to dla Ciebie za dużo — nie instaluj, i to jest rozsądny wybór.

Garmory: jeżeli cokolwiek tu jest nie tak, [Panel Kontaktowy][kon] — poprawimy
albo zdejmiemy.

[reg]: https://pomoc.margonem.pl/index/view,323
[tar]: https://pomoc.margonem.pl/index/view,331
[bez]: https://pomoc.margonem.pl/index/view,240
[nie]: https://pomoc.margonem.pl/index/view,409
[kon]: https://www.margonem.pl/?task=contact

---

## Jak zainstalować

**1. Zainstaluj [Tampermonkey](https://www.tampermonkey.net/)** — rozszerzenie do
przeglądarki, które uruchamia dodatki użytkownika. Na stronie są wersje na
Chrome, Firefoksa, Edge i resztę.

**2. Kliknij w plik dodatku:**
[**margometer.user.js**](https://github.com/KamilGrocholski/margometer/releases/latest/download/margometer.user.js)

Tampermonkey przechwyci to sam i pokaże okno instalacji — wystarczy
potwierdzić. **Aktualizacje przychodzą potem same**: rozszerzenie sprawdza,
czy jest nowsza wersja, i proponuje podmianę.

**3. Wejdź do gry i zacznij walkę.** Panel pojawi się sam. Nic nie trzeba
włączać — dodatek startuje na światach `*.margonem.pl` i `*.margonem.com`,
a poza walką po prostu nic nie rysuje.

Co się zmieniało między wersjami, mówi [`CHANGELOG.md`](CHANGELOG.md).

<details>
<summary>Wolisz zbudować u siebie?</summary>

Potrzebny [Bun](https://bun.sh/):

```bash
bun install
bun run build
```

Powstanie `dist/margometer.user.js` — ikona Tampermonkey → **Utwórz nowy
skrypt**, wyczyść okienko, wklej **całą** zawartość pliku i zapisz (Ctrl+S).
Tak zainstalowany dodatek **nie aktualizuje się sam**.

`dist/` jest w `.gitignore`, więc w repozytorium tego pliku nie ma — gotowy
leży przy [wydaniu](https://github.com/KamilGrocholski/margometer/releases/latest).

</details>

---

## Co to jest

Panel pokazuje, **kto ile zrobił** — w bieżącej walce, na bieżąco.

**Trzy zakładki:** `Zadane` · `Otrzymane` · `Leczenie`. W danej chwili ranking
pokazuje jedną z nich; reszta jest o jedno kliknięcie.

**Trzy filtry składu:** `Wszyscy` · `My` · `Oni`.

**Wchodzenie w szczegóły to jeden gest.** Lewy przycisk wchodzi, prawy wychodzi
— na każdym szczeblu ten sam:

- klik w postać z rankingu → **komu** zadała (albo **od kogo** dostała);
- klik w cel → **czym** w niego poszło;
- osobna sekcja **CZYM (ŁĄCZNIE)** sumuje umiejętności po wszystkich celach,
  a klik w umiejętność pokazuje, komu zadała — ten sam gest z drugiej strony.

**Najechanie pokazuje szczegół, zanim klikniesz** — udział procentowy, średnią
na turę, liczbę ciosów. Jest też przełącznik `na turę` dla całej listy.

**Panel mówi też, czego NIE wie.** W stopce stoją przypisy o liczbach, których
log nie przypisuje nikomu — bo np. przy dziesięciu graczach na jednego bossa
nie da się wskazać, kto zatruł. Licznik woli to powiedzieć, niż zgadnąć.

Dodatkowo: nagrywanie walk do pamięci przeglądarki wraz z archiwum
i odtwarzaniem, kopiowanie statystyk do schowka, kolory profesji i rozbicie
obrażeń na rodzaje. Okno przeciąga się i zwija, a jego położenie przeżywa F5.

---

## Zrzuty ekranu

Obie ilustracje pochodzą z tej samej walki: **dziesięciu graczy przeciwko
bossowi Hildur Muza Śmierci** z najnowszego eventu wakacyjnego. Na obu wszedłem
w samego bossa, więc widać jego stronę starcia.

> ⚠️ Zrzuty są sprzed poprawek z 1 sierpnia 2026 i **nie pokazują już panelu
> takim, jaki jest**: rodzaje obrażeń zwinęły się w rodziny (dziewięć wierszy →
> siedem), pozycje bez sprawcy zeszły do jednego wiersza na końcu rankingu,
> a paski są jaśniejsze, żeby tekst na nich przechodził próg czytelności.
> Do wymiany.
>
> **Pseudonimy dziesięciu graczy są na obu obrazkach zakryte** — to publiczne
> repozytorium, a oni nie mieli jak się na to zgodzić. Paski, liczby i procenty
> zostały nietknięte, bo to o nich są te ilustracje. Procedura i powody:
> [`docs/screenshots/README.md`](docs/screenshots/README.md).

**Zadane — co boss zadał i czym**

Ranking `KOMU` mówi, kogo bił, `CZYM (ŁĄCZNIE)` — którą umiejętnością, po
wszystkich celach naraz. Na dole przypis o obrażeniach, których log nie
przypisuje nikomu: przy dziesięciu graczach nie da się wskazać, kto zatruł.

![MargoMeter: zakładka Zadane, widok bossa — komu zadał, czym i jakiego rodzaju](docs/screenshots/margometer_zadane_postac.png)

**Otrzymane — od kogo boss oberwał**

Ta sama walka z drugiej strony: `OD KOGO` to ranking bijących w niego,
a `TYP OBRAŻEŃ` rozbija te 403 206 na rodzaje. Ranking wymienia same postacie —
to, czego log nie przypisał nikomu, zbiera się pod nim w jednym wierszu
`Bez sprawcy`, a klik w niego mówi, co w tej puli siedzi.

![MargoMeter: zakładka Otrzymane, widok bossa — od kogo dostał i jakiego rodzaju](docs/screenshots/margometer_otrzymane_postac.png)

---

## Dla programistów

```bash
bun install
bun run check     # typecheck + testy + build
bun test          # same testy
```

Dlaczego kod wygląda, jak wygląda, i czego log o walce nie mówi — w katalogu
[`docs/`](docs/). Zaczynaj od [`docs/README.md`](docs/README.md): mówi, co gdzie
siedzi, jakie zasady obowiązują w tym repo i jak wyglądały poprzednie rundy
pracy — reszta katalogu jest do czytania wybiórczo, nie od deski do deski.

Pracujesz tu z agentem AI (Claude Code, Codex, Cursor…)? Instrukcje projektu
stoją w [`AGENTS.md`](AGENTS.md) — otwartym formacie, który te narzędzia czytają
same.

Materiał, na którym stoją testy: **nasze** liczby powstają w kodzie
([`tests/korpus.ts`](tests/korpus.ts), `tests/klucze-protokolu.ts`), a **surowy
protokół tak, jak przysłał go serwer** leży w `tests/fixtures/` — niezmienniki
odkrywają te pliki same. [`tests/walka-z-gry.ts`](tests/walka-z-gry.ts) jest
dziś kopią jednego z fixture'ów dla miejsc, które importują gotowe komunikaty;
rozjazd kopii z oryginałem zapala test. Granica między jednym a drugim i powód,
dla którego przebiega właśnie tam — w [`AGENTS.md`](AGENTS.md).

---

## Licencja

Kod jest na [licencji MIT](LICENSE) — rób z nim, co chcesz, zostaw tylko notę.

Margonem jest grą **Garmory sp. z o.o. sp.k.** i MIT jej **nie obejmuje**: ani
nazwy, ani grafik, ani tekstów, ani kodu klienta. Co dokładnie z gry siedzi
w tym repozytorium, na jakiej podstawie i czego celowo tu nie ma —
[`NOTICE.md`](NOTICE.md).
