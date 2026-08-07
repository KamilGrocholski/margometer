import type { RosterEntry } from "./roster.ts";
import { aggregate, EMPTY_STATS, type BattleStats } from "./stats.ts";
import type { BattleEvent } from "./types.ts";

/**
 * ⚠️ **STAŁY TU `splitFights` I `participantsKey` — MARTWE KRYTERIUM PODZIAŁU**
 * (`AUDYT‑108`, skasowane 2026‑08‑07). Dzieliły strumień na walki po zdarzeniu
 * `fight-start`, a dekoder protokołu **nigdy takiego zdarzenia nie produkuje**:
 * klient syntetyzuje linię otwierającą sam, poza `data.m` (`Battle.js:945`).
 * Jedynymi producentami w całym repo byli `tools/synthetic-log.ts` i
 * `tests/zdarzenia.ts` — czyli generator i budowniczy testowy.
 *
 * Strażnik, który nie ma z czego wystrzelić, jest gorszy od jego braku: ten
 * udawał, że `Session` broni się przed sklejeniem dwóch walk, a nie bronił.
 * Zmierzone przed skasowaniem — bufor z dwiema kopiami tej samej walki dawał
 * `5766` obrażeń zamiast `2883` i `24` tury zamiast `12`, **z `splitFights`
 * w drzewie**.
 */

// Stał tu re-eksport `EMPTY_STATS` ze `stats.ts` — „żeby import z sesji dalej
// działał tam, gdzie tak było wygodniej". Zdjęty 2026‑08‑02 (`AUDYT‑51`):
// `AUDYT‑5` przenosiło tę stałą do `stats.ts` z argumentem WARSTWOWYM
// („overlay importuje z session zero dla typu należącego do stats"), a re-eksport
// zostawiał dokładnie tę zależność, którą przeniesienie miało skasować.
// Przeniesiona była definicja, nie zależność.

/**
 * Trzyma statystyki bieżącej walki.
 *
 * Przy każdej zmianie logu parsujemy CAŁY bufor od nowa, zamiast doklejać
 * przyrosty. Parsowanie kilkuset linii to ułamek milisekundy, a stan
 * przyrostowy byłby źródłem błędów podwójnego liczenia.
 *
 * ⚠️ **NAZWA JEST DZIŚ SZERSZA OD ROBOTY.** Klasa nazywała się `Session`, bo
 * sumowała sesję (zeszło 2026‑08‑03, `AUDYT‑6`), i została przy tej nazwie, bo
 * „mówiła, który kawałek bufora jest TĄ walką". Od 2026‑08‑07 nie mówi tego
 * także — kryterium podziału było martwe (patrz komentarz na górze pliku).
 * Zostaje pamięć ostatniego wyniku i jedno wywołanie `aggregate`. Nazwy nie
 * zmieniam w tej samej rundzie, w której znika powód: przemianowanie dotknęłoby
 * wszystkich wywołań po to, żeby nic nie policzyć inaczej, a wtedy jedna runda
 * niosłaby i sprostowanie, i szum.
 */
export class Session {
  private currentStats: BattleStats = EMPTY_STATS;

  /**
   * `fromGame` to skład odczytany z gry dla TRWAJĄCEJ walki i stosuje się
   * bezwarunkowo. Stały tu kolejno dwa warunki chroniące go przed pójściem na
   * cudzą walkę — `i === fights.length - 1` (zdjęty razem z sumą sesji,
   * `AUDYT‑6`) i wybór ostatniej walki z `splitFights` (zdjęty razem z martwym
   * kryterium, `AUDYT‑108`). Dziś nie ma czego chronić z innego powodu niż
   * wtedy: **walka w buforze jest jedna, bo odciął ją `protokol-source.ts`**,
   * a nie dlatego, że ten plik którąś wybrał.
   *
   * ⚠️ **STAŁA TU JESZCZE `update(text)`**, która najpierw czytała zdania,
   * a potem wołała to samo. Zniknęła 2026‑08‑04 razem z tamtym odczytem: zdarzenia przychodzą
   * dziś jedną drogą, wprost z protokołu silnika. Nazwa `updateEvents` została,
   * choć nie ma już od czego się odróżniać — zmiana kosztowałaby dotknięcie
   * wszystkich wywołań po to, żeby nic nie zmienić.
   */
  updateEvents(events: BattleEvent[], fromGame?: RosterEntry[] | null): void {
    // ⚠️ **TA FUNKCJA ZAKŁADA, ŻE BUFOR NIESIE JEDNĄ WALKĘ, I NIE MA JAK TEGO
    // SPRAWDZIĆ.** Zdanie stało tu wcześniej z zastrzeżeniem „warunku pilnuje
    // `protokol-source.ts`" — i było prawdziwe, tyle że obok stał `splitFights`,
    // który wyglądał na drugiego świadka. Nie był nim (`AUDYT‑108`): dzielił po
    // zdarzeniu, którego dekoder nie produkuje.
    //
    // Co z tego zostaje po skasowaniu martwego kryterium: **granica walki stoi
    // dziś na JEDNYM warunku** — `protokol-source.ts` odcina bufor na
    // `data.init`. Jeśli tamten warunek przestanie działać, tryb awarii jest
    // dokładnie ten z `AUDYT‑57`: druga walka doliczy się do pierwszej
    // (2644 → 5288 obrażeń, 12 → 24 tury), po cichu. Tak było też PRZED tą
    // zmianą — usunięcie `splitFights` niczego nie odsłoniło, tylko przestało
    // to zasłaniać.
    //
    // Sygnał na drugiego świadka w strumieniu JEST i nikt go nie czyta:
    // `fight-end` pada dokładnie 2× na walkę w obu fixture'ach. Oparcie na nim
    // podziału to zmiana ZACHOWANIA, nie sprzątanie — trzeba rozstrzygnąć, co
    // robić ze zdarzeniami między `fight-end` a następnym `init`. Druga połowa
    // `AUDYT‑108`, otwarta.
    this.currentStats = events.length > 0 ? aggregate(events, fromGame) : EMPTY_STATS;
  }

  /** Statystyki walki, którą niósł ostatni bufor. */
  current(): BattleStats {
    return this.currentStats;
  }
}
