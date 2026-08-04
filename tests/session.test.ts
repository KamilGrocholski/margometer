import { describe, expect, test } from "bun:test";
import { aggregate, EMPTY_STATS, type Aggregate } from "../src/stats.ts";
import { Overlay } from "../src/overlay.ts";
import { Session, splitFights } from "../src/session.ts";
import { StaticProtocolSource } from "../src/protokol-source.ts";
import { start } from "../src/index.ts";
import { dekoduj } from "../src/protokol.ts";
import { OSOBLIWOSCI, WALKI } from "./korpus.ts";

/**
 * Dwie ROZŁĄCZNE walki — żadna nazwa się nie powtarza.
 *
 * ⚠️ Do 2026‑08‑04 brały się z korpusu (`tancerz-vs-kukla`, `lowca-vs-druzyna`
 * i inne). Korpusu nie ma; rozłączność składów jest tu warunkiem, bez którego
 * „liczy się OSTATNIA walka" nie da się w ogóle sprawdzić.
 */
const PIERWSZA = OSOBLIWOSCI; // Gracz, Locha, Odyniec
const DRUGA = WALKI[0]!.events; // Tancogniew Kazrek, Magister Długonogi
import { cios, otwarcie, trafienie } from "./zdarzenia.ts";
import type { RosterEntry } from "../src/roster.ts";

/**
 * Ten plik miał do 2026‑08‑03 dwa razy tyle testów i większość dotyczyła SUMY
 * SESJI — tego, żeby walka wypychana z bufora nie policzyła się dwa razy, żeby
 * `mergeStats` nie zgubił nowego pola, żeby `copyActor` nie mutował walki
 * bieżącej. Suma zeszła z drzewa razem z nimi (`AUDYT‑6`).
 *
 * Zostaje to, co `Session` nadal robi: **dzieli bufor na walki i mówi, która
 * z nich jest TĄ**. Reszta była kosztem funkcji, której nie ma.
 */
describe("sesja", () => {
  test("dzieli bufor na osobne walki", () => {
    expect(splitFights([...PIERWSZA, ...DRUGA])).toHaveLength(2);
  });

  test("zdublowana linia rozpoczęcia nie tworzy drugiej walki", () => {
    // Margonem potrafi zdublować nagłówek. Powtórzenie TEGO SAMEGO składu nie
    // zaczyna drugiej walki, bo poprzednia nie ma jeszcze treści.
    const [naglowek] = PIERWSZA;
    expect(splitFights([naglowek!, ...PIERWSZA])).toHaveLength(1);
  });

  test("walka skończona na samym nagłówku nie skleja się z następną", () => {
    // Ucieczka albo przerwanie: pierwsza walka nie ma nic poza nagłówkiem.
    // Dawniej wystarczało to, by drugi nagłówek uznać za dubel — obie walki
    // wpadały w jedną, ze składem pierwszej.
    const events = [
      otwarcie(["Gracz 1w"], ["Wilk 1w"]),
      otwarcie(["Gracz 1w"], ["Niedźwiedź 1w"]),
      cios("Gracz", "Niedźwiedź", [trafienie(300)], { targetHpPct: 60 }),
    ];

    const fights = splitFights(events);
    expect(fights).toHaveLength(2);
    // Skład drugiej walki jest jej własny, nie odziedziczony po pierwszej.
    expect(aggregate(fights[1]!).actors.map((a) => a.name).sort()).toEqual([
      "Gracz",
      "Niedźwiedź",
    ]);
  });

  test("z bufora z kilkoma walkami liczy się OSTATNIA, nie wszystkie", async () => {
    // Podział ma sens tylko wtedy, gdy wybiera ostatnią walkę, a nie sumuje
    // bufor. Test wymaga postaci, która występuje WYŁĄCZNIE w pierwszej walce:
    // gdyby liczyły się obie, znalazłaby się w wyniku.
    const solo = new Session();
    solo.updateEvents(PIERWSZA);
    expect(solo.current().actors.some((a) => a.name === "Gracz")).toBe(true);

    const session = new Session();
    session.updateEvents([...PIERWSZA, ...DRUGA]);
    // `Gracz` występuje WYŁĄCZNIE w pierwszej — gdyby liczyły się obie, byłby.
    expect(session.current().actors.some((a) => a.name === "Gracz")).toBe(false);
    expect(session.current().actors.some((a) => a.name === "Tancogniew Kazrek")).toBe(true);
  });

  test("ta sama walka wczytana drugi raz nie podwaja liczb bieżącej walki", async () => {
    // Bufor bywa odczytywany kilka razy bez zmiany treści (mutacja DOM-u, która
    // niczego nie dopisała). `update` liczy od zera przy każdym wywołaniu, więc
    // to musi być idempotentne — inaczej panel rósłby sam z siebie.
    const session = new Session();
    const bijacy = "Tancogniew Kazrek";

    session.updateEvents(DRUGA);
    const jedna = session.current().actors.find((a) => a.name === bijacy)!.damageDealt;
    expect(jedna).toBeGreaterThan(0);

    session.updateEvents(DRUGA);
    expect(session.current().actors.find((a) => a.name === bijacy)!.damageDealt).toBe(jedna);
  });

  test("skład z gry stosuje się do walki, która jest liczona", async () => {
    // `fromGame` opisuje walkę TRWAJĄCĄ. Wcześniej pilnował tego warunek
    // `i === fights.length - 1`, bo `aggregate` szło po wszystkich walkach
    // w buforze; dziś liczy się tylko ostatnia, więc warunek zniknął — a to,
    // czego pilnował, ma zostać prawdą.
    const session = new Session();
    session.updateEvents([...PIERWSZA, ...DRUGA], [
      { id: 1, name: "Podstawiony", side: 0, prof: "w", lvl: 1 },
    ]);

    // Postać z rostera wchodzi do składu OSTATNIEJ walki, a nie pierwszej.
    const zRostera = session.current().actors.find((a) => a.name === "Podstawiony");
    expect(zRostera?.inRoster).toBe(true);
  });
});

describe("panel dostaje bieżącą walkę, nie historię", () => {
  const dealtBy = (stats: Aggregate, name: string) =>
    stats.actors.find((a) => a.name === name)?.damageDealt ?? 0;

  test("nowa walka zastępuje poprzednią, zamiast się do niej doklejać", async () => {
    // Do 2026‑08‑04 opisywał to PODMIANĘ KONTENERA logu przez grę: subskrypcja
    // szła od zera razem z nowym węzłem DOM. Protokół nie ma kontenera —
    // `EngineProtocolSource` zeruje bufor komunikatów przy nowym obiekcie
    // walki — ale wymóg wobec sesji jest ten sam i to jego pilnujemy.
    const session = new Session();
    const overlay = new Overlay();

    session.updateEvents(PIERWSZA);
    overlay.render(session.current());
    expect(dealtBy(session.current(), "Gracz")).toBeGreaterThan(0);

    session.updateEvents(DRUGA);
    overlay.render(session.current());

    expect(dealtBy(session.current(), "Tancogniew Kazrek")).toBeGreaterThan(0);
    expect(dealtBy(session.current(), "Gracz")).toBe(0);
  });

  test("rosnący strumień daje na końcu to samo, co wczytany w całości", async () => {
    // Odtwarza doczytywanie się walki w grze: `EngineProtocolSource` dekoduje
    // CAŁY prefiks przy każdej porcji, więc sesja dostaje coraz dłuższą listę.
    // Liczby po ostatniej porcji muszą być tymi, które daje jedno wczytanie.
    const rosnaco = new Session();
    for (const upTo of [8, 20, DRUGA.length]) rosnaco.updateEvents(DRUGA.slice(0, upTo));

    const naraz = new Session();
    naraz.updateEvents(DRUGA);

    expect(dealtBy(rosnaco.current(), "Tancogniew Kazrek")).toBe(
      dealtBy(naraz.current(), "Tancogniew Kazrek"),
    );
  });

  test("start() karmi sesję i panel z jednego strumienia", async () => {
    // Spięcie źródło → sesja → panel. Wcześniej pilnował tego test wyżej,
    // przez `DomLogSource`; dziś jedyną drogą jest `EventSource`.
    const session = new Session();
    const overlay = new Overlay();
    const SKLAD: RosterEntry[] = [
      { id: 1, name: "Kamil", side: 0 },
      { id: 2, name: "Locha", side: 1 },
    ];

    start(
      new StaticProtocolSource(["1=100.00;2=40.37;+dmgd=455;-dmgd=455"], undefined, SKLAD),
      overlay,
      session,
    );

    expect(dealtBy(session.current(), "Kamil")).toBe(455);
    expect(
      [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent),
    ).toContain("Kamil");
  });
});

/**
 * `updateEvents` — wspólne wejście dla obu źródeł.
 *
 * Metoda istnieje po to, żeby protokół silnika trafiał do TEGO SAMEGO
 * `splitFights` i `aggregate`, co tekst. Gdyby drugie źródło dostało własny
 * podział na walki albo własny agregat, porównanie wyników przestałoby cokolwiek
 * znaczyć: mierzyłoby różnicę między dwoma agregatami, a nie między odczytami.
 */
describe("Session.updateEvents", () => {
  test("korpus jest niepusty — inaczej niezmiennik niżej byłby zielony i pusty", () => {
    expect(WALKI.length).toBeGreaterThan(3);
  });

  /**
   * ⚠️ Niezmiennik chodził do 2026‑08‑04 po katalogach `tests/fixtures/`
   * — 25 prawdziwych walk. Chodzi dziś po walkach budowanych w kodzie
   * (`tests/korpus.ts`), więc sprawdza tę samą WŁASNOŚĆ na uboższym materiale.
   */
  test.each(WALKI)("$name — jedna walka w korpusie to jedna walka w sesji", ({ events }) => {
    expect(splitFights(events).filter((f) => f.length > 0)).toHaveLength(1);

    const sesja = new Session();
    sesja.updateEvents(events);
    expect(sesja.current().actors.length).toBeGreaterThan(0);
  });

  test("skład z gry dociera tą samą drogą", () => {
    const sesja = new Session();
    sesja.updateEvents([otwarcie(["Kamil 100m"], ["Locha 50w"])], [
      { id: 7, name: "Kamil", side: 0 },
    ]);
    expect(sesja.current().actors.some((a) => a.name === "Kamil")).toBe(true);
  });

  test("zdarzenia z protokołu idą tą samą drogą, co z korpusu", () => {
    const SKLAD: RosterEntry[] = [
      { id: 1, name: "Kamil", side: 0 },
      { id: 2, name: "Locha", side: 1 },
    ];
    const sesja = new Session();
    sesja.updateEvents(dekoduj(["1=100.00;2=40.37;+dmgd=455;-dmgd=455"], SKLAD), SKLAD);
    expect(sesja.current().actors.find((a) => a.name === "Kamil")?.damageDealt).toBe(455);
  });

  test("pusta lista zdarzeń daje zerowe statystyki, a nie wyjątek", () => {
    const sesja = new Session();
    sesja.updateEvents([]);
    expect(sesja.current()).toEqual(EMPTY_STATS);
  });
});
