## Roadmapa MergoMeter

Stan odhaczony 2026-07-30. Co jest zrobione, wynika z kodu; co zostało — z tego,
czego log nie daje albo czego jeszcze nie zbudowano. Usterki w rzeczach już
zrobionych nie wracają tutaj — siedzą w `UX-POPRAWKI.md` i `SOLID.md`.

## Faza 1 — ZROBIONA
- ✅ Okno obrażeń
- ✅ LPM na pojedynczą postać → wejście w jej rozbicie; kolejne LPM na wiersz
  będący postacią → szczebel niżej (czym padło). Zadane drążą się przez CEL,
  otrzymane przez NAPASTNIKA.
- ✅ PPM → powrót o jeden szczebel, z całego panelu. Do tego klik w okruszek
  `‹ …` robi to samo.
- ✅ Szybkie przejście Wszyscy / My / Oni
- ✅ Przełącznik „na turę”
  ⚠️ z zastrzeżeniem: `/t` znaczy dwie różne rzeczy zależnie od metryki i wiersze
  nie sumują się do drużyny przy Zadanych — `DECYZJE.md` „Na turę”, do decyzji
  projektowej, nie do łatki.
- ✅ Hover pokazuje skrót statystyk: zadane, otrzymane, leczenie, tury, utracone
  tury, **efekty w ciosach** (`procs`) i **efekty otrzymane** (`procsReceived`),
  czyli klątwy, dotyki anioła i bardzo krytyczne — po nazwie i liczbie.
  ⚠️ ale w podglądzie z archiwum dymek dziś nie działa wcale (`UX-POPRAWKI.md A7`).
- ✅ Statystyki wg drużyny: nagłówek stron z paskiem podziału i sumy zespołu
  pod listą.

## Faza 2 — ZROBIONA poza „procowaniem”
- ✅ Otrzymane obrażenia (pełne drążenie, lustro zadanych)
- ✅ Uleczone (jeden szczebel: „OD CZEGO” — patrz ograniczenie niżej)
- ⬜ **Procowanie jako osobny panel** — nadal bez pomysłu na kształt. Dane są
  (`procs`, `procsReceived` liczone dla obu stron), brakuje decyzji, czy to
  w ogóle ma być osobny widok, czy dymek wystarczy. Zderzyć z zasadą „nie robić
  trzeciego rzędu zakładek” (`UX.md §6`).

## Poza pierwotną roadmapą — zrobione
- ✅ **Rozbicie wg umiejętności, bez względu na cel** (`CZYM (ŁĄCZNIE)`) wraz
  z drążeniem w drugą stronę: umiejętność → komu zadała. Lustrzanie dla
  przyjętych. Dane (`dealtBy`) czekały policzone od początku; brakowało widoku
  i decyzji, gdzie go wpiąć — patrz `UX.md §3` i zastrzeżenie w `§6`.
- ✅ Nagrywanie surowych logów do `localStorage` z budżetem 1 MB
- ✅ Archiwum walk + wczytanie nagrania do GŁÓWNEGO panelu (pełne drążenie)
- ✅ Odtwarzanie walki linia po linii, z pauzą, przewijaniem i prędkością
- ✅ Ręczne wklejenie logu
- ✅ Kopiowanie statystyk (walka + sesja) jako JSON
  ⚠️ suma sesji ma dziś błędne `dealtToBy` — `SOLID.md §4.11`
- ✅ Rozbicie obrażeń wg typu + kolory i odznaki profesji
- ✅ Skalowanie i zapamiętywanie geometrii okna
  ⚠️ bez przycięcia do ekranu, czyli można je stracić — `UX-POPRAWKI.md A10`

## Wstrzymane (nie porzucone)
- ⏸ **Metryka „Tury”** — typ `Metric` i etykieta zostają, ale `METRICS` ma trzy
  pozycje, więc zakładki nie ma. `turnRows` (jej rozbicie w dymku) **zdjęte
  z drzewa 2026‑07‑31** razem z dwoma `test.skip`, które trzymały je przy
  pozorach życia. Kod stoi w historii: ostatnia wersja z nim to `95d02d7`.
  Do rozstrzygnięcia: dokończyć albo odpuścić. Wcześniej dochodziła do tego
  obietnica w `CHANGELOG.md` 0.1.0 — plik został usunięty z repo 2026‑07‑31,
  więc sama obietnica zniknęła, ale **pytanie o metrykę zostaje**: nie jest
  załatwione tym, że nikt jej już nikomu nie obiecuje.
- ⏸ **Oś tur i skupienie ognia** — `renderAxis`/`renderFireFocus` **zdjęte
  z drzewa 2026‑07‑31** wraz z ich CSS-em i dwoma zielonymi testami, które
  asertowały, że ich nie widać. Nie porzucone: kod stoi w historii, ostatnia
  wersja z nim to `95d02d7`, i wraca w komplecie, gdy zapadnie decyzja, CO ma
  pokazywać. Powód zdjęcia: `noUnusedLocals` jest odtąd włączone i martwy kod
  jest błędem kompilacji, a kompilator pilnujący tego jest wart więcej niż trzy
  metody czekające w drzewie.
  ⚠️ `stats.deaths` i `stats.matrix` liczą się dalej, ale od tej pory nie czyta
  ich NIC poza testami — patrz `AUDYT.md AUDYT‑25`.
- ⏸ **Zakładka zakresu (ta walka / sesja)** — `Session.total()` i `mergeStats`
  liczą się przy każdej linii dla widoku, którego nie ma (`SOLID.md §4.25`).

## Do zbadania osobno — leczenie „od kogo”
Wyleczone mają mieć drill „wg postaci” jak zadane/otrzymane, ale PYTANIE, CZY SIĘ DA.
Stan z korpusu (wszystkie linie leczenia): każde leczenie jest samoistne, log nie
nazywa leczącego. Trzy formy:
- „Przywrócono N punktów życia X” — regeneracja/kradzież życia, BEZ źródła
- „X: Ostatni ratunek, zregenerowano N” — samoratunek, źródło = X sam
- „Dotyk anioła: zregenerowano N punktów życia X” — token przed dwukropkiem to
  nazwa EFEKTU, nie postać; cel to znów X

Wniosek: literalne „która postać leczyła” zawsze = leczony (samoleczenie), drill
miałby jeden wiersz. Realne „od kogo” wymaga logu, gdzie JEDNA postać leczy DRUGĄ
(np. paladyn sojusznika) — takiej linii w korpusie NIE MA, format sprawcy nieznany.
Do zrobienia, gdy pojawi się próbka takiego logu: złapać format i przypisać
leczącego (analogicznie do napastników/trucizny). Alternatywa bez nowych danych:
pierwszy szczebel „OD CZEGO” (źródło: Regeneracja/aura/samoratunek) — to
praktycznie dzisiejsze `healedBy`, tylko jako drill. **To już jest zrobione.**
Patrz też znane ograniczenie „Leczenie bez leczącego” w `DECYZJE.md`.

## Czego brakuje w korpusie fixture'ów
Nie funkcja, ale warunek wejścia dla kilku rzeczy wyżej. Agregat pól `missing`
w `meta.json`, zweryfikowany po `covers`:
- **log właścicielki** — formy żeńskie czasownika są obsłużone w regexach, ale
  sprawdzone tylko na ręcznie pisanych stringach (`SOLID.md §4.8`);
- **walka z przyciętym nagłówkiem** — rozstrzyga, czy `SOLID.md §4.12` (sumy
  maleją) jest realne, czy `merge` w nagrywarce broni przed czymś, czego nie ma;
- **`Zablokowanie N obrażeń` na ścieżce DOM** (w tekście jest);
- **remis** — „Walka nie wyłoniła zwycięzcy” nie występuje w żadnym fixture.
