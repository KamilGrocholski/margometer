import type { BattleEvent } from "./types.ts";
import type { BattleStats } from "./stats.ts";

/**
 * Dwa pytania o STAN ODCZYTU, na które panel musi umieć odpowiedzieć.
 *
 * ⚠️ **PLIK NAZYWAŁ SIĘ `rozjazd.ts` I MIESZKAŁA W NIM CZUJKA.** Porównywała
 * dwa niezależne odczyty tej samej walki i miała zapalać ostrzeżenie, gdy podadzą
 * inne liczby. Straciła sens w chwili, w której odczyt został jeden: nie ma czego
 * z czym porównać, a czujka porównująca odczyt z samym sobą jest zawsze zielona
 * i przez to gorsza niż jej brak. Powody:
 * `docs/specy/2026-08-04-parser-tekstu-i-korpus-schodza-z-drzewa.md`.
 *
 * To jest STRATA, nie uproszczenie, i warto ją nazwać: czujka była **jedynym
 * miejscem w dodatku, w którym błąd odczytu mógł się ujawnić W GRZE, a nie
 * w teście**. Dziś nie ujawni się nigdzie poza testem, a testy pytają repo
 * o zgodność z samym sobą.
 *
 * Zostaje to, co opisuje odczyt SAM W SOBIE i dalej ma czytelnika — a skoro
 * czujki nie ma, nazwa pliku też przestała o niej mówić.
 */

/**
 * Czy w tej porcji walka się skończyła.
 *
 * Potrzebne, bo o stanie odczytu wolno wyrokować dopiero na KOŃCU walki:
 * w trakcie „zero liczb" znaczy po prostu „jeszcze nikt nie uderzył".
 */
export function walkaZakonczona(zdarzenia: readonly BattleEvent[]): boolean {
  return zdarzenia.some((z) => z.kind === "fight-end");
}

/**
 * Czy ten odczyt jest PUSTY — ma wiersze, ale nie ma w nich ani jednej liczby.
 *
 * ⚠️ **WIERSZE NIE ŚWIADCZĄ O TREŚCI.** `aggregate` buduje je ze SKŁADU
 * podanego z gry, nie ze zdarzeń: sesja, która nie zobaczyła ani jednego ciosu,
 * ma komplet postaci i same zera. To nie jest teoria — pierwsze uruchomienie
 * w grze (2026‑08‑04) pokazało dokładnie taki odczyt, bo owinięcie
 * `Engine.battle.update` podpięło się już po pierwszej porcji komunikatów,
 * a w tej porcji potrafi przyjść CAŁA walka.
 *
 * Po co wciąż jest, skoro czujka zniknęła: pusty odczyt na koniec walki znaczy
 * „nie zdążyliśmy się podpiąć do tej walki" i gracz ma to usłyszeć wprost.
 * Bez tego panel po prostu pokazywałby same zera — czyli wyglądałby na
 * działający.
 */
export function pustyOdczyt(stats: BattleStats): boolean {
  return !stats.actors.some(
    (a) =>
      a.damageDealt > 0 ||
      a.damageTaken > 0 ||
      a.healingDone > 0 ||
      a.healingReceived > 0 ||
      a.hits > 0,
  );
}
