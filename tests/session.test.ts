import { describe, expect, test } from "bun:test";
import { EMPTY_STATS, type Aggregate } from "../src/stats.ts";
import { Overlay } from "../src/overlay.ts";
import { Session } from "../src/session.ts";
import { StaticProtocolSource } from "../src/protokol-source.ts";
import { start } from "../src/index.ts";
import { dekoduj } from "../src/protokol.ts";
import { OSOBLIWOSCI, WALKI } from "./korpus.ts";
import { krok } from "./zdarzenia.ts";

/**
 * Dwie ROZŁĄCZNE walki — żadna nazwa się nie powtarza.
 *
 * ⚠️ Do 2026‑08‑04 brały się z 25 prawdziwych walk. Tamtego materiału nie ma;
 * rozłączność składów jest tu warunkiem, bez którego
 * „liczy się OSTATNIA walka" nie da się w ogóle sprawdzić.
 */
const PIERWSZA = OSOBLIWOSCI; // Gracz, Locha, Odyniec
const DRUGA = WALKI[0]!.events; // Tancogniew Kazrek, Magister Długonogi
import type { RosterEntry } from "../src/roster.ts";

/**
 * Ten plik miał do 2026‑08‑03 dwa razy tyle testów i większość dotyczyła SUMY
 * SESJI — tego, żeby walka wypychana z bufora nie policzyła się dwa razy, żeby
 * `mergeStats` nie zgubił nowego pola, żeby `copyActor` nie mutował walki
 * bieżącej. Suma zeszła z drzewa razem z nimi (`AUDYT‑6`).
 *
 * ⚠️ **A do 2026‑08‑07 stało tu „zostaje to, co `Session` nadal robi: dzieli
 * bufor na walki i mówi, która z nich jest TĄ" — i cztery testy tego
 * pilnowały.** Wszystkie cztery budowały materiał z `otwarcie()`, czyli ze
 * zdarzenia `fight-start`, którego dekoder protokołu **nigdy nie produkuje**
 * (`AUDYT‑108`). Były zielone i sprawdzały funkcję, do której na żywo nie
 * docierało nic. Zeszły razem z `splitFights`.
 *
 * ⚠️ **A 2026‑08‑09 zszedł piąty — ten jeden, który pytał materiałem z gry.**
 * Stało tu, że „zostaje test niżej — jedyny, który o tę własność pyta materiałem
 * z gry, a nie własnym". Pytał `z.kind === "fight-start"`, a wariantu nie ma już
 * w `BattleEvent`, więc pytania nie da się dziś nawet zapisać. Własność, o którą
 * pytał, przeszła z testu do systemu typów — i to jest mocniejsze miejsce, ale
 * trzeba wiedzieć, że w TYM pliku nie stoi już nic o granicy walk.
 */
describe("sesja", () => {
  /**
   * ⚠️ **STAŁ TU TEST „walka z gry nie niesie ani jednej granicy" I ZSZEDŁ
   * 2026‑08‑09 RAZEM Z WARIANTEM.** Pytał `events.filter(z => z.kind ===
   * "fight-start")` o długość zero — czyli o coś, czego dziś **nie da się
   * napisać**: wariant nie istnieje w `BattleEvent`, więc porównanie jest
   * błędem kompilacji. To wzmocnienie, nie utrata: `toHaveLength(0)` sprawdzało
   * jeden materiał przy jednym uruchomieniu, a system typów sprawdza wszystkie.
   *
   * Zdanie o grze, które ten test niósł, zostaje prawdziwe i nie ma go gdzie
   * zgubić — stoi w `src/protokol-source.ts` przy granicy `data.init`.
   *
   * Razem z nim zszedł jego strażnik pustki („korpus z gry jest niepusty"),
   * bo pilnował **tamtego** niezmiennika i po nim nie zostało nic do pilnowania.
   * Że `tests/fixtures/` nie jest puste, mówi `tests/fixtury.test.ts`.
   */

  test("bufor z dwiema walkami SUMUJE — granica nie stoi już w tym pliku", () => {
    // ⚠️ To NIE jest test naprawy, tylko zapis znanej dziury (`AUDYT‑108`).
    // Dwie rozłączne walki w jednym buforze dają jeden wynik obejmujący obie.
    // Stoi tu po to, żeby przyszła naprawa (podział po `fight-end`) miała co
    // odwrócić, i żeby nikt nie uznał sumowania za zamierzone.
    //
    // ⚠️ Stało tu do 2026‑08‑09, że materiał jest syntetyczny i „`fight-start`
    // niesie, więc przed zmianą ten test by padł". Wariantu nie ma już w ogóle:
    // skład jechał wtedy strumieniem, dziś idzie osobnym argumentem, a nazwy
    // w asercjach niżej biorą się z samych ciosów. Zdanie o granicy zostaje
    // prawdziwe — po prostu nie ma już czym jej nawet udawać.
    const session = new Session();
    session.updateEvents([...PIERWSZA, ...DRUGA]);
    const nazwy = session.current().actors.map((a) => a.name);
    expect(nazwy).toContain("Gracz"); // wyłącznie z PIERWSZEJ
    expect(nazwy).toContain("Tancogniew Kazrek"); // wyłącznie z DRUGIEJ
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

  test("skład z gry dociera do liczonej walki", async () => {
    // `fromGame` opisuje walkę TRWAJĄCĄ i stosuje się bezwarunkowo.
    //
    // ⚠️ Komentarz stał tu w wersji „wchodzi do składu OSTATNIEJ walki, a nie
    // pierwszej" i opisywał `splitFights`, którego nie ma. Test zostaje, bo
    // pyta o coś, co nadal jest prawdą i nadal ma znaczenie: skład podany
    // z gry ma dojść do agregatu. Przestał pytać o wybór walki, bo wyboru
    // nie ma.
    const session = new Session();
    session.updateEvents(DRUGA, [
      { id: 1, name: "Podstawiony", side: 0, prof: "w", lvl: 1 },
    ]);

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
    // drugim, nieistniejącym już źródłem; dziś jedyną drogą jest `EventSource`.
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
 * `updateEvents` — jedyne wejście do agregatu na żywo.
 *
 * ⚠️ **Nagłówek brzmiał „wspólne wejście dla OBU źródeł" i uzasadniał się
 * porównaniem dwóch odczytów.** Drugi odczyt zszedł z drzewa 2026‑08‑04,
 * a `splitFights`, do którego oba miały trafiać, 2026‑08‑07 (`AUDYT‑108`).
 * Z całego tamtego zdania zostaje `aggregate`.
 */
describe("Session.updateEvents", () => {
  test("korpus jest niepusty — inaczej niezmiennik niżej byłby zielony i pusty", () => {
    expect(WALKI.length).toBeGreaterThan(3);
  });

  /**
   * ⚠️ Niezmiennik chodził do 2026‑08‑04 po 25 prawdziwych walkach
   * — 25 prawdziwych walk. Chodzi dziś po walkach budowanych w kodzie
   * (`tests/korpus.ts`), więc sprawdza tę samą WŁASNOŚĆ na uboższym materiale.
   */
  test.each(WALKI)("$name — walka z korpusu daje niepusty odczyt", ({ events, sklad }) => {
    // ⚠️ Test pytał do 2026‑08‑07 także o `splitFights(events)` z wynikiem `1`
    // i to była jego mocniejsza połowa. Zdjęta razem z funkcją: pytała, czy
    // materiał, który sami zbudowaliśmy, ma jeden nagłówek — a nie o nic, co
    // dzieje się na żywo.
    const sesja = new Session();
    sesja.updateEvents(events, sklad);
    expect(sesja.current().actors.length).toBeGreaterThan(0);
  });

  test("skład z gry dociera tą samą drogą", () => {
    // Zdarzenia NIE wymieniają Kamila — jedynym źródłem jego wiersza jest skład.
    // Do 2026‑08‑09 stało tu obok `otwarcie()`, czyli drugi skład wpuszczony
    // strumieniem, więc nie było widać, którym z dwóch kanałów Kamil dotarł.
    //
    // ⚠️ Zdarzenie musi tu być, i to nie jest ozdoba: `updateEvents` przy pustej
    // liście oddaje `EMPTY_STATS`, nie zaglądając do składu (niżej, `:81`).
    // Pierwsza wersja tej poprawki podawała `[]` i test padał — na zachowaniu,
    // które jest zamierzone, a nie na regresji.
    const sesja = new Session();
    sesja.updateEvents([krok("Locha", 100)], [
      { id: 7, name: "Kamil", side: 0 },
      { id: 8, name: "Locha", side: 1 },
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
