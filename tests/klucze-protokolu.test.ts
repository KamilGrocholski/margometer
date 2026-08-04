import { describe, expect, test } from "bun:test";
import { zamrozenie, type Wpis, type Zamrozenie } from "../tools/slownik.ts";

/**
 * Zamrożona lista etykiet renderera — czego ten plik pilnuje, a czego nie.
 *
 * **NIE pilnuje tego, co mówi gra.** To zmienia się poza nami i ma własną
 * odpowiedź (`bun tools/slownik.ts --zamroz` po aktualizacji klienta). Zielony
 * test przy 233 kluczach nie znaczy, że gra ma dziś 233 klucze — znaczy, że
 * plik, który tak twierdzi, nie jest uszkodzony.
 *
 * **Pilnuje kształtu, bo od niego zależy test pokrycia dekodera.** Fixture
 * z urwaną listą albo z `milczace` spoza `klucze` dałby pokrycie, które
 * przechodzi, bo pyta o mniej — czyli zieloność udającą dowód. To ta sama
 * klasa błędu, przed którą broni reguła „test ma móc paść".
 *
 * Zero sieci: `zamrozenie()` jest czyste, a fixture leży na dysku.
 */

const ZAMROZONE = (await Bun.file(
  new URL("./fixtures/klucze-protokolu.json", import.meta.url).pathname,
).json()) as Zamrozenie;

const wpis = (klucz: string, zdanie: string | null): Wpis => ({
  klucz,
  identyfikator: zdanie === null ? null : `msg_${klucz}`,
  zdanie,
});

describe("fixture: zamrożona lista etykiet", () => {
  test("niesie build, świat, datę i metodę — bez nich pomiar jest anegdotą", () => {
    expect(ZAMROZONE.build).toMatch(/^\d+$/);
    expect(ZAMROZONE.swiat).not.toBe("");
    expect(ZAMROZONE.zmierzone).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(ZAMROZONE.metoda).toContain("--zamroz");
  });

  test("lista jest niepusta", () => {
    // Próg jest luźny CELOWO: ma złapać plik urwany albo pusty, a nie zmianę
    // w grze. Zaciśnięcie go do dokładnej liczby zamieniłoby ten test
    // w strażnika wersji klienta, którym nie jest.
    expect(ZAMROZONE.klucze.length).toBeGreaterThan(100);
  });

  test("jest posortowana i bez powtórzeń", () => {
    expect(ZAMROZONE.klucze).toEqual([...ZAMROZONE.klucze].sort());
    expect(new Set(ZAMROZONE.klucze).size).toBe(ZAMROZONE.klucze.length);
  });

  test("każda milcząca etykieta stoi też na liście pełnej", () => {
    // Gdyby `milczace` zawierało klucz spoza `klucze`, test pokrycia dekodera
    // zwalniałby z obsługi klucz, o którym nic nie wie.
    for (const klucz of ZAMROZONE.milczace) expect(ZAMROZONE.klucze).toContain(klucz);
  });

  test("milczących jest mniej niż wszystkich — inaczej gra nie wypisywałaby nic", () => {
    expect(ZAMROZONE.milczace.length).toBeLessThan(ZAMROZONE.klucze.length);
  });
});

describe("zamrozenie()", () => {
  const ciala = new Map([
    ["ma_zdanie", 'tm[1] += _t("msg_ma_zdanie");'],
    ["milczy", ""],
    ["sama_liczba", 'take += "<b>" + m[1] + "</b>";'],
    ["luka", 'tm[1] += _t("msg_czego_nie_znamy");'],
  ]);
  const wpisy = [
    wpis("ma_zdanie", "Coś się stało."),
    wpis("milczy", null),
    wpis("sama_liczba", null),
    wpis("luka", null),
  ];

  test("bierze wszystkie klucze, posortowane", () => {
    const z = zamrozenie("123", "2026-08-04", wpisy, ciala);
    expect(z.klucze).toEqual(["luka", "ma_zdanie", "milczy", "sama_liczba"]);
  });

  test("milczące to WYŁĄCZNIE werdykt „nic”, nie każdy brak zdania", () => {
    // Sedno tego pliku. `sama_liczba` i `luka` też nie mają zdania, ale gra
    // przy nich COŚ wypisuje — wrzucenie ich do `milczace` kazałoby dekoderowi
    // uznać, że wolno je pominąć, i zjadłoby obrażenia bez ostrzeżenia.
    const z = zamrozenie("123", "2026-08-04", wpisy, ciala);
    expect(z.milczace).toEqual(["milczy"]);
  });

  test("etykieta bez znanego ciała nie wchodzi do milczących na wiarę", () => {
    // Brak wpisu w mapie ciał to brak wiedzy, a nie „gra milczy”. Pusty ciąg
    // dałby werdykt „nic”, więc ten przypadek trzeba trzymać na oku: dopóki
    // `zamrozenie` czyta ciała z tej samej tabeli co `tabela()`, nie zachodzi.
    const z = zamrozenie("123", "2026-08-04", [wpis("sierota", null)], new Map());
    expect(z.klucze).toEqual(["sierota"]);
    expect(z.milczace).toEqual(["sierota"]);
  });

  test("przepisuje build i datę bez zmian", () => {
    const z = zamrozenie("1785244275300", "2026-08-04", wpisy, ciala);
    expect(z.build).toBe("1785244275300");
    expect(z.zmierzone).toBe("2026-08-04");
  });
});
