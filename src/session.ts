import { parse } from "./parser.ts";
import type { RosterEntry } from "./roster.ts";
import { aggregate, EMPTY_STATS, type BattleStats } from "./stats.ts";
import type { BattleEvent, Participant } from "./types.ts";

/**
 * Podpis składu z linii otwierającej. Po nim poznajemy DWA różne fakty: że
 * kolejny odczyt bufora pokazuje tę samą walkę i że powtórzony nagłówek jest
 * powtórzeniem tej samej linii, a nie początkiem następnej walki.
 */
function participantsKey(participants: Participant[]): string {
  return participants
    .map((p) => `${p.name}|${p.level}${p.professionCode}|${p.side}`)
    .join("//");
}

/** Dzieli strumień zdarzeń na osobne walki po liniach rozpoczęcia. */
export function splitFights(events: BattleEvent[]): BattleEvent[][] {
  const fights: BattleEvent[][] = [];

  for (const event of events) {
    if (event.kind === "fight-start") {
      const previous = fights.at(-1);
      // Margonem potrafi zdublować linię rozpoczęcia — powtórzenie TEGO SAMEGO
      // składu nie zaczyna drugiej walki, bo poprzednia nie ma jeszcze treści.
      //
      // Ale nagłówek INNEGO składu to już druga walka, choćby pierwsza
      // skończyła się na samym nagłówku (ucieczka, przerwanie, bufor doczytany
      // na granicy). Wcześniej wystarczał sam fakt „poprzednia ma jedno
      // zdarzenie”, więc obie zlewały się w jedną — ze składem pierwszej.
      const only = previous?.length === 1 ? previous[0]! : null;
      const isDuplicate =
        only?.kind === "fight-start" &&
        participantsKey(only.participants) === participantsKey(event.participants);
      if (!isDuplicate) fights.push([]);
    }
    if (fights.length === 0) fights.push([]);
    fights.at(-1)!.push(event);
  }

  return fights;
}

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
 * Klasa nazywa się dalej `Session`, choć nie sumuje już sesji — bo dalej
 * odpowiada za to samo, co od początku: który kawałek bufora jest TĄ walką.
 * Suma wielu walk zeszła stąd 2026‑08‑03 (`AUDYT‑6`); powód i to, co zniknęło
 * razem z nią, stoi w `docs/specy/`.
 */
export class Session {
  private currentStats: BattleStats = EMPTY_STATS;

  /**
   * `fromGame` to skład odczytany z gry dla TRWAJĄCEJ walki, więc dotyczy
   * wyłącznie ostatniej walki w buforze — a że tylko ją liczymy, stosuje się
   * bezwarunkowo. Wcześniej stał tu warunek `i === fights.length - 1`,
   * pilnujący, żeby skład z gry nie poszedł na walki wcześniejsze, liczone
   * na potrzeby sumy sesji. Sumy nie ma, wcześniejszych walk nie liczymy,
   * warunek nie ma czego chronić.
   */
  update(text: string, fromGame?: RosterEntry[] | null): void {
    this.updateEvents(parse(text), fromGame);
  }

  /**
   * To samo, co `update`, dla źródła podającego zdarzenia gotowe.
   *
   * Istnieje, bo protokół silnika (`src/protokol.ts`) wystawia `BattleEvent[]`
   * bez przechodzenia przez tekst — a `splitFights` i `aggregate` mają zostać
   * WSPÓLNE dla obu dróg. Gdyby drugie źródło dostało własny podział na walki
   * albo własny agregat, porównanie wyników przestałoby cokolwiek znaczyć:
   * mierzyłoby różnicę między dwoma agregatami, a nie między dwoma odczytami.
   *
   * `update` deleguje tutaj, więc każdy dzisiejszy test sesji jest zarazem
   * testem tej metody.
   */
  updateEvents(events: BattleEvent[], fromGame?: RosterEntry[] | null): void {
    // Liczy się WYŁĄCZNIE ostatnia walka w buforze — jedyna, o którą ktokolwiek
    // pyta. Wcześniej `aggregate` szło po każdej walce w buforze, bo zamknięte
    // trzeba było doliczyć do sumy sesji; przy logu z kilkoma walkami była to
    // praca w wątku gry na poczet widoku, którego nie ma.
    //
    // Strumień protokołu jednej walki NIE MA po czym się dzielić: linię
    // otwierającą klient syntetyzuje sam, poza `data.m` (`Battle.js:945`).
    // `splitFights` zwraca wtedy jedną walkę i to jest poprawne — `Engine.battle`
    // żyje jedną walką, a nowa dostaje nowy obiekt i wyzerowany bufor.
    const fights = splitFights(events).filter((events) => events.length > 0);
    const last = fights.at(-1);
    this.currentStats = last ? aggregate(last, fromGame) : EMPTY_STATS;
  }

  /** Statystyki ostatniej walki widocznej w logu. */
  current(): BattleStats {
    return this.currentStats;
  }
}
