import { describe, expect, test } from "bun:test";
import { parse } from "../src/parser.ts";
import { aggregate, type Aggregate } from "../src/stats.ts";
import { Overlay } from "../src/overlay.ts";
import { Session, splitFights } from "../src/session.ts";
import { DomLogSource } from "../src/source.ts";
import { start } from "../src/index.ts";
import { readFixture } from "./helpers.ts";

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
  test("dzieli bufor na osobne walki", async () => {
    const text = `${await readFixture("new-engine/2026-07-18_tancerz-vs-kukla")}
${await readFixture("new-engine/2026-07-18_lowca-vs-druzyna")}`;

    expect(splitFights(parse(text))).toHaveLength(2);
  });

  test("zdublowana linia rozpoczęcia nie tworzy drugiej walki", async () => {
    // Log z paladynami ma linię "Rozpoczęła się walka" dwa razy pod rząd.
    const events = parse(await readFixture("new-engine/2026-07-18_lowca-vs-paladyni"));
    expect(splitFights(events)).toHaveLength(1);
  });

  test("walka skończona na samym nagłówku nie skleja się z następną", () => {
    // Ucieczka albo przerwanie: pierwsza walka nie ma nic poza nagłówkiem.
    // Dawniej wystarczało to, by drugi nagłówek uznać za dubel — obie walki
    // wpadały w jedną, ze składem pierwszej.
    const events = parse(
      [
        "Rozpoczęła się walka pomiędzy Gracz (1w) a Wilk (1w)",
        "Rozpoczęła się walka pomiędzy Gracz (1w) a Niedźwiedź (1w)",
        "Gracz(100%) uderzył z siłą  +300",
        "Niedźwiedź(60%) otrzymał(a)  -300  obrażeń",
      ].join("\n"),
    );

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
    const pierwsza = await readFixture("new-engine/2026-07-18_lowca-vs-druzyna");
    const druga = await readFixture("new-engine/2026-07-18_lowca-vs-paladyni");

    const solo = new Session();
    solo.update(pierwsza);
    expect(solo.current().actors.some((a) => a.name === "Łowcożyr Kazrek")).toBe(true);

    const session = new Session();
    session.update(`${pierwsza}\n${druga}`);
    expect(session.current().actors.some((a) => a.name === "Łowcożyr Kazrek")).toBe(false);
    expect(session.current().actors.some((a) => a.name === "Łowca głów z psk")).toBe(true);
  });

  test("ta sama walka wczytana drugi raz nie podwaja liczb bieżącej walki", async () => {
    // Bufor bywa odczytywany kilka razy bez zmiany treści (mutacja DOM-u, która
    // niczego nie dopisała). `update` liczy od zera przy każdym wywołaniu, więc
    // to musi być idempotentne — inaczej panel rósłby sam z siebie.
    const text = await readFixture("new-engine/2026-07-18_mag-vs-druzyna-umiejetnosci");
    const session = new Session();

    session.update(text);
    const jedna = session.current().actors.find((a) => a.name === "wf mushita psk")!.damageDealt;
    expect(jedna).toBeGreaterThan(0);

    session.update(text);
    expect(session.current().actors.find((a) => a.name === "wf mushita psk")!.damageDealt).toBe(
      jedna,
    );
  });

  test("skład z gry stosuje się do walki, która jest liczona", async () => {
    // `fromGame` opisuje walkę TRWAJĄCĄ. Wcześniej pilnował tego warunek
    // `i === fights.length - 1`, bo `aggregate` szło po wszystkich walkach
    // w buforze; dziś liczy się tylko ostatnia, więc warunek zniknął — a to,
    // czego pilnował, ma zostać prawdą.
    const pierwsza = await readFixture("new-engine/2026-07-18_tancerz-vs-kukla");
    const druga = await readFixture("new-engine/2026-07-18_lowca-vs-druzyna");

    const session = new Session();
    session.update(`${pierwsza}\n${druga}`, [
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

  test("po podmianie kontenera logu przez grę widać już tylko nową walkę", async () => {
    const session = new Session();
    const overlay = new Overlay();

    const makeLog = (text: string) => {
      const log = document.createElement("div");
      for (const line of text.split("\n")) {
        log.append(Object.assign(document.createElement("div"), { textContent: line }));
      }
      document.body.append(log);
      return log;
    };

    const magiem = await readFixture("new-engine/2026-07-18_mag-vs-druzyna-umiejetnosci");
    start(new DomLogSource(makeLog(magiem)), overlay, session)();
    expect(dealtBy(session.current(), "wf mushita psk")).toBeGreaterThan(0);

    // Gra buduje okno walki od nowa pod następną walkę — subskrypcja leci od
    // zera. Panel ma pokazać nową walkę, nie doklejać jej do poprzedniej.
    const wojownikiem = await readFixture("new-engine/2026-07-18_wojownik-vs-druzyna-umiejetnosci");
    const stop = start(new DomLogSource(makeLog(wojownikiem)), overlay, session);

    expect(dealtBy(session.current(), "Woj Zandan Długonogi")).toBeGreaterThan(0);
    expect(dealtBy(session.current(), "wf mushita psk")).toBe(0);
    stop();
  });

  test("rosnący bufor daje na końcu to samo, co wczytany w całości", async () => {
    // Odtwarza doczytywanie się logu w grze: bufor rośnie linia po linii.
    // Panel przerysowuje się przy każdej emisji, więc liczby po ostatniej muszą
    // być tymi, które daje jednorazowe wczytanie całości.
    const lines = (await readFixture("new-engine/2026-07-18_mag-vs-druzyna-umiejetnosci")).split(
      "\n",
    );
    const rosnaco = new Session();
    for (const upTo of [8, 20, lines.length]) rosnaco.update(lines.slice(0, upTo).join("\n"));

    const naraz = new Session();
    naraz.update(lines.join("\n"));

    expect(dealtBy(rosnaco.current(), "wf mushita psk")).toBe(
      dealtBy(naraz.current(), "wf mushita psk"),
    );
  });
});
