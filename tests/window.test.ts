import { describe, expect, test } from "bun:test";
import { clampToViewport, KEEP_VISIBLE } from "../src/window.ts";

const viewport = { width: 1000, height: 800 };

describe("przycinanie pozycji okna do ekranu", () => {
  test("pozycja w środku ekranu zostaje nietknięta", () => {
    expect(clampToViewport(120, 90, 260, viewport)).toEqual({ x: 120, y: 90 });
  });

  test("okno zsunięte nad górną krawędź wraca do zera", () => {
    // Uchwytem jest nagłówek — nad krawędzią nie da się go już chwycić.
    expect(clampToViewport(120, -400, 260, viewport).y).toBe(0);
  });

  test("okno zsunięte pod dolną krawędź zostawia pasek do złapania", () => {
    expect(clampToViewport(120, 5000, 260, viewport).y).toBe(viewport.height - KEEP_VISIBLE);
  });

  test("okno zsunięte za prawą krawędź zostawia pasek do złapania", () => {
    expect(clampToViewport(5000, 20, 260, viewport).x).toBe(viewport.width - KEEP_VISIBLE);
  });

  test("okno zsunięte w lewo wolno schować prawie całe, ale nie całe", () => {
    // W lewo chowamy chętniej niż w prawo: panel przy krawędzi to normalne
    // ustawienie, byle jego prawy skraj został widoczny.
    const { x } = clampToViewport(-5000, 20, 260, viewport);
    expect(x).toBe(KEEP_VISIBLE - 260);
    expect(x + 260).toBeGreaterThanOrEqual(KEEP_VISIBLE);
  });

  test("pozycja zapisana na szerszym ekranie wraca w kadr", () => {
    // Ten przypadek nie wymaga żadnego przeciągania: wystarczy otworzyć grę
    // na węższym ekranie niż ten, na którym panel ustawiono.
    expect(clampToViewport(1600, 20, 260, viewport).x).toBe(viewport.width - KEEP_VISIBLE);
  });

  test("zdegenerowany viewport nie rusza pozycji", () => {
    // Zminimalizowane okno albo brak układu (jsdom) zgłasza zera. Zepchnięcie
    // panelu w róg byłoby wtedy gorsze niż zostawienie go, gdzie stał.
    expect(clampToViewport(400, 300, 260, { width: 0, height: 0 })).toEqual({ x: 400, y: 300 });
  });
});
