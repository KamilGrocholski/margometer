import type { Ticker } from "../src/window.ts";

/**
 * Zegar sterowany ręcznie — czas płynie dopiero po `tick()`.
 *
 * Używany przez dwa rodzaje testów: odtwarzanie nagrania (kolejne klatki)
 * i wygasanie potwierdzeń „na pewno?". W obu przypadkach czekanie na prawdziwy
 * `setInterval` zamieniłoby test w loterię.
 */
export class ManualTicker implements Ticker {
  private steps = new Map<number, () => void>();
  private next = 1;
  everyMs = 0;

  start(step: () => void, everyMs: number): number {
    this.everyMs = everyMs;
    const handle = this.next++;
    this.steps.set(handle, step);
    return handle;
  }

  stop(handle: number): void {
    this.steps.delete(handle);
  }

  get running(): boolean {
    return this.steps.size > 0;
  }

  tick(times = 1): void {
    // Kopia listy: krok potrafi się wyrejestrować (potwierdzenie gaśnie po
    // pierwszym wystrzale), a iteracja po żywej mapie gubiłaby wtedy sąsiada.
    for (let i = 0; i < times; i += 1) for (const step of [...this.steps.values()]) step();
  }
}
