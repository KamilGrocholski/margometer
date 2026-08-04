import { describe, expect, test } from "bun:test";
import { nazwyKluczy, zamrozenie, type Wpis, type Zamrozenie } from "../tools/slownik.ts";

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
    const nazwy = nazwyKluczy(ZAMROZONE);
    expect(nazwy).toEqual([...nazwy].sort());
    expect(new Set(nazwy).size).toBe(nazwy.length);
  });

  test("milczących jest mniej niż wszystkich — inaczej gra nie wypisywałaby nic", () => {
    expect(ZAMROZONE.klucze.filter((w) => w.milczy).length).toBeLessThan(ZAMROZONE.klucze.length);
  });

  test("klucz ze zdaniem ma też IDENTYFIKATOR — to on idzie do `window._t`", () => {
    // Dodatek rozwiązuje brzmienia w locie po identyfikatorze. Wpis ze zdaniem,
    // ale bez id, byłby w przeglądarce bezużyteczny — a w teście przechodziłby,
    // bo test miałby zdanie pod ręką.
    const zeZdaniemBezId = ZAMROZONE.klucze.filter((w) => w.zdanie !== null && w.id === null);
    expect(zeZdaniemBezId).toEqual([]);
  });

  test("milczący klucz NIE ma zdania — inaczej „milczy” byłoby nieprawdą", () => {
    expect(ZAMROZONE.klucze.filter((w) => w.milczy && w.zdanie !== null)).toEqual([]);
  });

  test("większość kluczy ma zdanie — plik bez brzmień nie niósłby nic nowego", () => {
    const zeZdaniem = ZAMROZONE.klucze.filter((w) => w.zdanie !== null).length;
    expect(zeZdaniem).toBeGreaterThan(ZAMROZONE.klucze.length / 2);
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
    expect(nazwyKluczy(z)).toEqual(["luka", "ma_zdanie", "milczy", "sama_liczba"]);
  });

  test("przenosi identyfikator i szablon bez zmian", () => {
    // To one jadą do `window._t` i do weryfikacji offline; przepisanie ich
    // „po swojemu" zerwałoby zgodność z tym, co gra faktycznie wypisze.
    const z = zamrozenie("123", "2026-08-04", wpisy, ciala);
    const maZdanie = z.klucze.find((w) => w.klucz === "ma_zdanie");
    expect(maZdanie).toEqual({
      klucz: "ma_zdanie",
      id: "msg_ma_zdanie",
      zdanie: "Coś się stało.",
      milczy: false,
    });
  });

  test("milczące to WYŁĄCZNIE werdykt „nic”, nie każdy brak zdania", () => {
    // Sedno tego pliku. `sama_liczba` i `luka` też nie mają zdania, ale gra
    // przy nich COŚ wypisuje — oznaczenie ich jako milczących kazałoby
    // dekoderowi uznać, że wolno je pominąć, i zjadłoby obrażenia bez
    // ostrzeżenia.
    const z = zamrozenie("123", "2026-08-04", wpisy, ciala);
    expect(z.klucze.filter((w) => w.milczy).map((w) => w.klucz)).toEqual(["milczy"]);
  });

  test("etykieta bez znanego ciała nie wchodzi do milczących na wiarę", () => {
    // Brak wpisu w mapie ciał to brak wiedzy, a nie „gra milczy”. Pusty ciąg
    // dałby werdykt „nic”, więc ten przypadek trzeba trzymać na oku: dopóki
    // `zamrozenie` czyta ciała z tej samej tabeli co `tabela()`, nie zachodzi.
    const z = zamrozenie("123", "2026-08-04", [wpis("sierota", null)], new Map());
    expect(nazwyKluczy(z)).toEqual(["sierota"]);
    expect(z.klucze[0]!.milczy).toBe(true);
  });

  test("przepisuje build i datę bez zmian", () => {
    const z = zamrozenie("1785244275300", "2026-08-04", wpisy, ciala);
    expect(z.build).toBe("1785244275300");
    expect(z.zmierzone).toBe("2026-08-04");
  });
});
