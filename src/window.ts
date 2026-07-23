/**
 * Wspólna mechanika okien nakładki.
 *
 * Panel ze statystykami i okno archiwum przeciąga się dokładnie tak samo,
 * a różnią się tym, gdzie trzymają swoją pozycję — stąd sama obsługa wskaźnika
 * tutaj, a stan po stronie wołającego.
 */

export type DragTarget = {
  /** Skąd zaczynamy — pozycja okna w chwili chwycenia. */
  position(): { x: number; y: number };
  /** Nowa pozycja w trakcie ciągnięcia. */
  move(x: number, y: number): void;
  /** Puszczono przycisk — moment na zapis stanu. */
  end?(): void;
};

export function makeDraggable(handle: HTMLElement, target: DragTarget): void {
  handle.addEventListener("pointerdown", (event) => {
    // Przyciski w pasku tytułu mają działać jak przyciski, a nie chwytać okno.
    if ((event.target as Element).tagName === "BUTTON") return;

    const start = target.position();
    const offsetX = event.clientX - start.x;
    const offsetY = event.clientY - start.y;
    handle.classList.add("dragging");
    // jsdom nie ma tej metody — stąd wywołanie warunkowe.
    handle.setPointerCapture?.(event.pointerId);

    const move = (moveEvent: PointerEvent) => {
      target.move(moveEvent.clientX - offsetX, moveEvent.clientY - offsetY);
    };

    const up = () => {
      handle.classList.remove("dragging");
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      target.end?.();
    };

    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
  });
}

/**
 * Zegar odtwarzania. Wstrzykiwany, bo testy nie mają jak przewinąć
 * `setInterval`, a odtwarzanie bez sprawdzenia kolejnych klatek nie znaczy nic.
 */
export type Ticker = {
  start(step: () => void, everyMs: number): number;
  stop(handle: number): void;
};

export const realTicker: Ticker = {
  start: (step, everyMs) => setInterval(step, everyMs) as unknown as number,
  stop: (handle) => clearInterval(handle),
};
