import type { Ticker } from "./window.ts";

/**
 * Ile stoi pytanie „na pewno?".
 *
 * Pytanie zadane i porzucone nie może czekać w nieskończoność na przypadkowy
 * klik, bo kasowania nie da się cofnąć: klik, odejście od komputera i powrót po
 * godzinie nie mogą razem znaczyć „tak".
 */
export const CONFIRM_MS = 5000;

export type ConfirmOptions = {
  now: () => number;
  ticker: Ticker;
  /**
   * Wołane, gdy pytanie wygasło SAMO — widok musi się przerysować, żeby zdjąć
   * z przycisku napis „na pewno?".
   *
   * Bez tego wygaśnięcie było czysto obliczeniowe: etykieta zostawała, a klik
   * w nią trafiał w „pytanie nieaktywne" i po cichu uzbrajał je od nowa. Z
   * ekranu nic się nie zmieniało, więc przycisk wyglądał na zepsuty dokładnie
   * w chwili, w której jest najbardziej niebezpieczny.
   */
  onExpire: () => void;
  afterMs?: number;
};

/**
 * Dwuklikowe potwierdzenie nieodwracalnej akcji.
 *
 * Jedna implementacja dla panelu („wyczyść" całe archiwum) i dla okna archiwum
 * (✕ przy pojedynczym nagraniu). Wcześniej były dwie i zachowywały się
 * ODWROTNIE: w panelu pytanie wygasało, ale niewidocznie; w archiwum nie
 * wygasało wcale, więc uzbrojona destrukcja wisiała bez końca.
 *
 * `K` to tożsamość akcji — `void` przy jednym przycisku, `number` przy liście,
 * gdzie każde nagranie pyta osobno i uzbrojenie jednego ma rozbrajać poprzednie.
 */
export class Confirm<K> {
  private armed: { key: K; at: number } | null = null;
  private handle: number | null = null;

  constructor(private readonly options: ConfirmOptions) {}

  private get afterMs(): number {
    return this.options.afterMs ?? CONFIRM_MS;
  }

  /** Czy pytanie o TĘ akcję jeszcze stoi. */
  pending(key: K): boolean {
    if (this.armed === null || this.armed.key !== key) return false;
    // Sprawdzamy czas także tutaj, nie tylko w zegarze: widok potrafi zapytać
    // wcześniej, niż zegar zdąży wystrzelić, a wtedy odpowiedź ma być już „nie".
    if (this.options.now() - this.armed.at >= this.afterMs) {
      this.disarm();
      return false;
    }
    return true;
  }

  /** Czy cokolwiek jest w tej chwili uzbrojone. */
  isPending(): boolean {
    return this.armed !== null && this.pending(this.armed.key);
  }

  /**
   * Zgłasza kliknięcie w akcję.
   *
   * `true` znaczy „wykonaj", `false` — „właśnie zadaliśmy pytanie". Wołający
   * i tak przerysowuje widok po każdym kliknięciu, więc `onExpire` NIE leci
   * stąd; jest wyłącznie od wygaśnięcia bez udziału użytkownika.
   */
  ask(key: K): boolean {
    if (this.pending(key)) {
      this.disarm();
      return true;
    }
    this.arm(key);
    return false;
  }

  /** Zdejmuje pytanie bez wykonywania akcji — np. gdy widok się zamyka. */
  cancel(): void {
    this.disarm();
  }

  private arm(key: K): void {
    this.disarm();
    this.armed = { key, at: this.options.now() };
    this.handle = this.options.ticker.start(() => {
      // Jednorazowo: `Ticker` stoi na `setInterval`, więc gasimy sami zamiast
      // pytać go o wariant „raz". Rozbrajamy PRZED `onExpire`, żeby przerysowanie
      // zastało już właściwy stan.
      this.disarm();
      this.options.onExpire();
    }, this.afterMs);
  }

  private disarm(): void {
    this.armed = null;
    if (this.handle === null) return;
    this.options.ticker.stop(this.handle);
    this.handle = null;
  }
}
