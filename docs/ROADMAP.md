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
  ⚠️ Od 2026‑08‑03 dymek ma pięć sekcji (doszło TOP‑3 rozbicia), więc argument
  „dymek wystarczy” jest mocniejszy niż był — ale i sam dymek bliżej sufitu.

## Poza pierwotną roadmapą — zrobione
- ✅ **Rozbicie wg umiejętności, bez względu na cel** (`CZYM (ŁĄCZNIE)`) wraz
  z drążeniem w drugą stronę: umiejętność → komu zadała. Lustrzanie dla
  przyjętych. Dane (`dealtBy`) czekały policzone od początku; brakowało widoku
  i decyzji, gdzie go wpiąć — patrz `UX.md §3` i zastrzeżenie w `§6`.
- ✅ Nagrywanie surowych logów do `localStorage` z budżetem 1 MB
- ✅ Archiwum walk + wczytanie nagrania do GŁÓWNEGO panelu (pełne drążenie)
- ✅ Odtwarzanie walki linia po linii, z pauzą, przewijaniem i prędkością
- ✅ Ręczne wklejenie logu
- ✅ Kopiowanie statystyk walki jako JSON
  ⚠️ do 2026‑08‑03 szło tam też „+ sesja”, z błędnym `dealtToBy` (`SOLID §4.11`,
  naprawione 2026‑07‑30). Cała suma sesji zeszła z drzewa — `AUDYT‑6`.
- ✅ Rozbicie obrażeń wg typu + kolory i odznaki profesji
- ✅ Skalowanie i zapamiętywanie geometrii okna
  ⚠️ bez przycięcia do ekranu, czyli można je stracić — `UX-POPRAWKI.md A10`

## Porzucone (2026‑08‑03)

Sekcja nazywała się do 2026‑08‑03 **„Wstrzymane (nie porzucone)”** i wszystkie
trzy pozycje stały tu z `⏸`. Decyzja właściciela repo zamienia je na `❌`: żadna
nie wraca, a kod i dane, które na nie czekały, zeszły z drzewa. Zapis o tym, że
były wstrzymane, zostaje — pokazuje, ile taka pozycja potrafi kosztować, zanim
ktoś ją rozstrzygnie.
- ❌ **Metryka „Tury” — ODPUSZCZONA 2026‑08‑03.** `"turns"` zeszło z typu
  `Metric` i z obu map etykiet; `turnRows` zszedł już 2026‑07‑31 (`95d02d7`).
  Tury i tury utracone zostają w dymku i tam odpowiadają na swoje pytanie,
  a średnia na turę stoi w każdym wierszu — czwarta zakładka nie miała czego
  dołożyć. Kod wraca z historii, gdyby decyzja się odwróciła.
- ❌ **Oś tur i skupienie ognia — PORZUCONE 2026‑08‑03.** Renderery zeszły
  z drzewa już 2026‑07‑31 (`95d02d7`) i czekały na decyzję „CO mają pokazywać”.
  Decyzja: nie wracają. Razem z nimi poszły **`stats.deaths` i `stats.matrix`**,
  które od tamtej pory liczyły się dla nikogo (`AUDYT‑25`) — wraz z typami
  `Death` i `DamageEdge` oraz całym `observeDeath`.
  ⚠️ Zapis „nie porzucone, wraca w komplecie” stał tu przez trzy dni i był
  szczery, ale to właśnie taka pozycja najdłużej udaje plan: kod nie kosztował
  nic, a jego DANE liczyły się przy każdej walce.
- ❌ **Zakładka zakresu (ta walka / sesja) — PORZUCONA 2026‑08‑03.**
  `Session.total()` i `mergeStats` zeszły z drzewa razem z nią (`AUDYT‑6`);
  `src/session.ts` skurczył się z 362 do 88 linii. Panel mówi wyłącznie
  o bieżącej walce, a skopiowany JSON też.

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
- ~~**`Zablokowanie N obrażeń` na ścieżce DOM**~~ — **skreślone 2026‑08‑03:**
  zamknięte 2026‑08‑01, `2026-08-01_druzyna-vs-hildur-drugi-sklad` dostał
  `log.html` (`SOLID §10`). Ten plik trzymał to jako brak trzy dni dłużej —
  status żyjący w dwóch miejscach, po raz kolejny.
- ~~**remis**~~ — **skreślone 2026‑08‑01, bo było nieprawdą.** „Walka nie
  wyłoniła zwycięzcy” występuje w `2026-07-18_tancerz-vs-kukla/raw.txt:36`
  i `2026-07-18_tropiciel-vs-kukla/raw.txt:31`. Skąd błąd i jak go nie powtórzyć
  — `SOLID.md §10`.
