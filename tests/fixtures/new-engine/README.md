# Korpus walk — `zdarzenia.json`

22 walki jako **strumienie `BattleEvent[]`**. To jest materiał dowodowy dla
`src/stats.ts` — agregatu, który liczy wszystko, co widać w panelu.

## Dlaczego zdarzenia, a nie tekst

Do 2026‑08‑04 leżały tu `raw.txt` (tekst z „Kopiuj logi") i `log.html` (zrzut
DOM), a testy przepuszczały je przez `src/parser.ts`. **Parser tekstowy został
usunięty** — dodatek czyta wyłącznie protokół silnika. Zostawienie tamtych
plików zostawiłoby korpus bez czytelnika.

Zamiast tego korpus przeszedł **jednorazową konwersję**: `parse(raw.txt)` →
`zdarzenia.json`, wykonaną ostatnim uruchomieniem parsera przed jego
skasowaniem. Zawartość jest więc odczytem tamtego parsera, zamrożonym.

## Co to daje i czego NIE daje

**Daje:** `stats.ts` zachowuje 22 walki materiału zamiast jednej. Agregat jest
najbardziej zawiłym plikiem w repo (ponad 1200 linii, rozbicia, instancje,
przypisania DoT‑a) i to on ma tu swoje pokrycie — a `BattleEvent[]` jest
niezależne od źródła, więc te same fixture'y opisują dziś strumień z protokołu
tak samo dobrze jak wczoraj z tekstu.

⚠️ **NIE daje weryfikacji ODCZYTU.** Te pliki są wyjściem parsera, którego już
nie ma; nie da się ich zregenerować ani sprawdzić przeciw grze. Gdyby tamten
parser czytał coś źle, błąd jest tu zamrożony razem z resztą. Pytanie „czy
dobrze czytamy grę" ma dziś inną odpowiedź — `tests/orakulum.test.ts`
i `protokol.json` przy walkach, które go mają.

**Fixture'a się nie edytuje, żeby test przeszedł** — ta reguła obowiązuje tu tak
samo jak przy zrzutach. Różnica jest taka, że tu nie ma już do czego wrócić po
oryginał.

## `meta.json`

Opis każdej walki: co pokrywa, czego w niej nie ma, co było trudne. Pola
`format` i `source` opisują stan sprzed konwersji — zostawione, bo mówią,
skąd wzięły się zdarzenia.

## `protokol.json`

Tam, gdzie jest — surowy ładunek `Engine.battle.update` z tej samej walki.
To **jedyny** materiał, który da się dziś sprawdzić przeciw grze, i jedyny,
z którego rosną nowe fixture'y (`tools/walka.ts --rozbij`).
