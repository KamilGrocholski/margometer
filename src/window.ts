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

/**
 * Ile okna musi zostać na ekranie, żeby dało się je złapać z powrotem.
 *
 * Uchwytem przeciągania jest wyłącznie nagłówek, więc okno zsunięte nad górną
 * krawędź albo za bok jest nie do odzyskania — a pozycja zapisuje się
 * w `localStorage`, więc przeżywa odświeżenie. Przycisku „przywróć” nie ma.
 */
export const KEEP_VISIBLE = 56;

/**
 * Przycina pozycję okna do widocznego obszaru.
 *
 * W pionie nie pozwalamy wyjść nad zero (nagłówek jest u góry — nad krawędzią
 * przestaje istnieć); w poziomie wolno zsunąć okno prawie całe, byle został
 * pasek `KEEP_VISIBLE`. `width` podaje wołający, bo w chwili przeciągania zna
 * ją lepiej niż DOM (panel ma szerokość ze stanu, a nie z układu).
 */
export function clampToViewport(
  x: number,
  y: number,
  width: number,
  viewport: { width: number; height: number } = {
    width: window.innerWidth,
    height: window.innerHeight,
  },
): { x: number; y: number } {
  // Zdegenerowany viewport (jsdom bez układu, okno zminimalizowane) nie może
  // przesuwać okna — lepiej zostawić pozycję, niż zepchnąć ją w róg.
  if (viewport.width <= 0 || viewport.height <= 0) return { x, y };

  const maxX = Math.max(0, viewport.width - KEEP_VISIBLE);
  // Okno zajmuje [x, x + width], więc żeby jego prawy skraj został na ekranie,
  // musi być x >= KEEP_VISIBLE - width. `min(0, …)` na wypadek okna węższego
  // niż sam margines — wtedy granicą jest po prostu lewa krawędź.
  const minX = Math.min(0, KEEP_VISIBLE - width);
  const maxY = Math.max(0, viewport.height - KEEP_VISIBLE);
  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, 0), maxY),
  };
}

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
