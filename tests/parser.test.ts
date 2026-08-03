import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import { parse } from "../src/parser.ts";
import { extractText } from "../src/source.ts";
import { ELEMENT_MARKER } from "../src/types.ts";
import { aggregate, estimateMaxHp, totalBySide, type BattleStats } from "../src/stats.ts";

const FIXTURES = new URL("./fixtures/", import.meta.url).pathname;

const fixtures = [...new Glob("*/*/raw.txt").scanSync(FIXTURES)].map((path) => ({
  path,
  name: path.replace(/\/raw\.txt$/, ""),
  text: () => Bun.file(FIXTURES + path).text(),
}));

test("katalog fixture'ów nie jest pusty", () => {
  expect(fixtures.length).toBeGreaterThan(0);
});

// Kontrakt trzymany dla każdego zrzutu, niezależnie od wersji gry i profesji.
describe.each(fixtures)("$name", (fixture) => {
  test("każda linia jest rozpoznana", async () => {
    const unknown = parse(await fixture.text()).filter((e) => e.kind === "unknown");
    expect(unknown.map((e) => `${e.lineNo}: ${e.line}`)).toEqual([]);
  });

  test("walka ma początek z uczestnikami", async () => {
    const start = parse(await fixture.text()).find((e) => e.kind === "fight-start");
    expect(start?.participants.length).toBeGreaterThanOrEqual(2);
  });

  test("obrażenia po redukcji nie przekraczają surowych", async () => {
    for (const event of parse(await fixture.text())) {
      if (event.kind !== "attack") continue;
      for (const hit of event.hits) expect(hit.applied).toBeLessThanOrEqual(hit.raw);
    }
  });

  test("uniknięte trafienie ma zerowe obrażenia", async () => {
    for (const event of parse(await fixture.text())) {
      if (event.kind !== "attack") continue;
      for (const hit of event.hits) if (hit.dodged) expect(hit.applied).toBe(0);
      // "Unik" w logu musi się przełożyć na co najmniej jedno takie trafienie.
      if (event.dodged) expect(event.hits.some((h) => h.dodged)).toBe(true);
    }
  });
});

const htmlFixtures = [...new Glob("*/*/log.html").scanSync(FIXTURES)].map((path) => ({
  path,
  name: path.replace(/\/log\.html$/, ""),
  html: () => Bun.file(FIXTURES + path).text(),
  /** Ten sam zrzut w wersji tekstowej — jest tylko przy części fixture'ów. */
  raw: async () => {
    const file = Bun.file(`${FIXTURES}${path.replace(/log\.html$/, "raw.txt")}`);
    return (await file.exists()) ? file.text() : null;
  },
}));

/**
 * Zrzuty z DOM-u trzymają ten sam kontrakt, co tekstowe. Osobny przebieg, bo
 * droga do parsera jest inna: `extractText` skleja tekst z drzewa i dokleja
 * żywioły z klas CSS, więc może się zepsuć niezależnie od samego parsera.
 */
describe.each(htmlFixtures)("$name (html)", (fixture) => {
  const events = async () => {
    document.body.innerHTML = await fixture.html();
    return parse(extractText(document.body));
  };

  test("każda linia jest rozpoznana", async () => {
    const unknown = (await events()).filter((e) => e.kind === "unknown");
    expect(unknown.map((e) => `${e.lineNo}: ${e.line}`)).toEqual([]);
  });

  /**
   * Fixture mający OBA pliki opisuje jedną walkę dwiema drogami, więc muszą
   * dawać te same liczby. To jedyny test, który łapie rozjazd między tekstem
   * z "Kopiuj logi" a DOM-em — np. gdyby `extractText` zgubił linię, która
   * w tekście stoi osobno, a w DOM-ie siedzi w jednym węźle z sąsiednią.
   */
  test("html daje te same statystyki co raw.txt", async () => {
    const raw = await fixture.raw();
    if (raw === null) return;

    /**
     * `damageAbsorbed` NIE wchodzi do porównania — i to jest wynik pomiaru,
     * nie wygoda.
     *
     * Obie drogi widzą te same liczby zadane i te same przyjęte, więc
     * `damageDealt` i `damageTaken` muszą się zgadzać co do jednego punktu.
     * Pochłonięcie liczy się jednak PER SLOT (`raw - applied`), a o tym, która
     * przyjęta liczba trafia do którego slotu, rozstrzyga żywioł — którego
     * w tekście z „Kopiuj logi" nie ma wcale (patrz `pairApplied`).
     *
     * Zmierzone na `2026-08-03_druzyna-vs-hildur-absorpcja`, cios Przeworskiej
     * Dumy `+906 +147 +799` zamknięty `-104 -8 -278`:
     *
     *   tekst: 104→906, 8→147, 278→799            ⇒ pochłonięte 1462
     *   DOM:   104(d)→906(d), 8(c)→799(c),
     *          147(f) nietknięty, 278(a) osobno    ⇒ pochłonięte 1740
     *
     * DOM ma rację: składnik ognia został pochłonięty w całości, a 278 to
     * `Piętno bestii` doliczone PO redukcji, więc nie ma surowego odpowiednika.
     * Tekst nie ma jak tego zobaczyć. W całej walce daje to 237 127 wobec
     * 240 025 — 1,2% mniej po stronie bossa.
     *
     * Komentarz przy `pairApplied` mówił, że w tekście „slot i tak nie ma czego
     * przekłamać, bo nie ma rozbicia na rodzaje obrażeń". To prawda o ROZBICIU
     * i nieprawda o tym skalarze; ten fixture jest pierwszym w korpusie, który
     * to pokazuje. Sprostowanie stoi też w `parser.ts`.
     */
    const summary = (stats: BattleStats) =>
      stats.actors.map((actor) => ({
        name: actor.name,
        damageDealt: actor.damageDealt,
        damageTaken: actor.damageTaken,
        healingDone: actor.healingDone,
        healingReceived: actor.healingReceived,
        hits: actor.hits,
        crits: actor.crits,
        turns: actor.turns,
      }));

    expect(summary(aggregate(await events()))).toEqual(summary(aggregate(parse(raw))));
  });
});

describe("tancerz ostrzy vs kukła treningowa", () => {
  const load = async () =>
    parse(await Bun.file(`${FIXTURES}new-engine/2026-07-18_tancerz-vs-kukla/raw.txt`).text());

  test("czyta uczestników z linii otwierającej", async () => {
    const start = (await load()).find((e) => e.kind === "fight-start");
    expect(start?.participants).toEqual([
      { name: "Magister Kazrek", level: 85, professionCode: "b", side: 0 },
      { name: "Kukła Treningowa", level: 1, professionCode: "w", side: 1 },
    ]);
  });

  test("łączy atak z linią obrażeń w dwa trafienia", async () => {
    const attack = (await load()).find((e) => e.kind === "attack");
    expect(attack).toMatchObject({
      source: "Magister Kazrek",
      target: "Kukła Treningowa",
      targetHpPct: 99.97,
      hits: [
        { raw: 4053, applied: 4052, crit: true, secondary: false },
        { raw: 2729, applied: 2728, crit: true, secondary: true },
      ],
      procs: [],
    });
  });

  test("stary log bez linii \"wykonuje\" ma tylko zwykłe ataki", async () => {
    const kazrek = aggregate(await load()).actors.find((a) => a.name === "Magister Kazrek")!;
    expect(kazrek.dealtBy.map((source) => source.label)).toEqual([
      "Zwykły atak",
      // Tykający efekt stoi w kolumnie nazw akcji, więc i on jest rzeczownikiem
      // — fraza z logu („od trucizny") łamała gramatykę całej listy.
      "Trucizna",
    ]);
  });

  test("efekty bez własnych obrażeń trafiają do procs, nie do trafień", async () => {
    const events = await load();
    const withProc = events.filter((e) => e.kind === "attack" && e.procs.length > 0);

    expect(withProc.map((e) => e.kind === "attack" && e.procs)).toEqual([
      ["Dotyk anioła"],
      ["Klątwa"],
    ]);
    // Proc nie jest osobnym trafieniem — obrażenia nadal dwa, jak bez niego.
    for (const event of withProc) {
      expect(event.kind === "attack" && event.hits).toHaveLength(2);
    }
  });

  test("czyta leczenie o wartości zero", async () => {
    const heal = (await load()).find((e) => e.kind === "heal");
    expect(heal).toEqual({
      kind: "heal",
      ability: "Dotyk anioła",
      target: "Magister Kazrek",
      amount: 0,
      targetHpPct: 0.01,
      self: true,
    });
  });

  test("czyta obrażenia od trucizny wraz z osłabieniem", async () => {
    const dot = (await load()).find((e) => e.kind === "dot");
    expect(dot).toEqual({
      kind: "dot",
      target: "Kukła Treningowa",
      targetHpPct: 99.18,
      amount: 302,
      weakenedPct: 25,
      via: "od",
      dotType: "trucizny",
    });
  });

  test("czyta utratę tury i zakończenie walki", async () => {
    const events = await load();
    expect(events.find((e) => e.kind === "turn-lost")).toEqual({
      kind: "turn-lost",
      actor: "Kukła Treningowa",
    });
    expect(events.find((e) => e.kind === "fight-end")).toEqual({
      kind: "fight-end",
      outcome: "draw",
      actors: [],
      result: "Walka nie wyłoniła zwycięzcy",
    });
  });

  test("sumuje obrażenia zadane i przyjęte", async () => {
    const stats = aggregate(await load());
    const kazrek = stats.actors.find((a) => a.name === "Magister Kazrek")!;
    const kukla = stats.actors.find((a) => a.name === "Kukła Treningowa")!;

    // 5 ataków po 2 trafienia, wszystkie krytyczne, + trucizna przypisana 1v1.
    const meleeDamage = 4052 + 2728 + 4440 + 2959 + 4344 + 2833 + 4330 + 3108 + 4573 + 3090;
    expect(kazrek.damageDealt).toBe(meleeDamage + 302);
    // 5 ciosów, nie 10 liczb obrażeń: tancerz niesie w jednym ciosie dwie.
    expect(kazrek.hits).toBe(5);
    // Kryt liczy się per broń — obie ręce trafiły krytycznie w każdym ciosie.
    expect(kazrek.crits).toBe(10);
    expect(kazrek.maxHit).toBe(4573 + 3090); // najsilniejszy cios, obie liczby

    expect(kukla.damageTaken).toBe(meleeDamage + 302);
    expect(kukla.damageAbsorbed).toBe(10); // 1 pkt na trafienie
    expect(kukla.damageDealt).toBe(0);
    expect(kukla.turnsLost).toBe(1);

    expect(totalBySide(stats.unattributedDotDamage)).toBe(0);
    expect(stats.unknownLines).toBe(0);
  });

  test("szacuje maksymalne HP celu ze spadku procentowego", async () => {
    const maxHp = estimateMaxHp(await load(), "Kukła Treningowa");
    expect(maxHp).toBeGreaterThan(0);
  });
});

describe("łowca vs drużyna paladynów", () => {
  const load = async () =>
    parse(await Bun.file(`${FIXTURES}new-engine/2026-07-18_lowca-vs-paladyni/raw.txt`).text());

  test("czyta atak przeciwnika ze znaczników [i]", async () => {
    const attack = (await load()).find((e) => e.kind === "attack" && e.source === "Południca");
    expect(attack).toMatchObject({
      source: "Południca",
      target: "Łowca głów z psk",
      dodged: false,
      hits: [
        { raw: 816, applied: 192, secondary: false },
        { raw: 536, applied: 184, secondary: true },
      ],
    });
  });

  test("unik daje zerowe obrażenia mimo niezerowej siły ciosu", async () => {
    const dodged = (await load()).find((e) => e.kind === "attack" && e.dodged);
    expect(dodged).toMatchObject({
      source: "Wieczornica",
      dodged: true,
      hits: [
        { raw: 878, applied: 0 },
        { raw: 570, applied: 0 },
      ],
    });
  });

  test("czyta zablokowaną wartość obrażeń", async () => {
    const blocked = (await load()).find((e) => e.kind === "attack" && e.blocked !== null);
    expect(blocked?.kind === "attack" && blocked.blocked).toBe(23);
  });

  test("rozróżnia cios krytyczny od bardzo krytycznego", async () => {
    const superCrit = (await load()).find(
      (e) => e.kind === "attack" && e.hits.some((h) => h.superCrit),
    );
    expect(superCrit).toMatchObject({
      hits: [{ raw: 272, crit: true, superCrit: true }],
      procs: ["Szybka strzała", "Niszczenie pancerza o 16"],
    });
  });

  test("czyta zwycięstwo drużyny i porażkę gracza", async () => {
    const ends = (await load()).filter((e) => e.kind === "fight-end");
    expect(ends).toEqual([
      {
        kind: "fight-end",
        outcome: "victory",
        actors: ["Wieczornica", "Wieczornica", "Południca"],
        result: "Zwyciężyła drużyna Wieczornica, Wieczornica, Południca",
      },
      {
        kind: "fight-end",
        outcome: "defeat",
        actors: ["Łowca głów z psk"],
        result: "Poległ Łowca głów z psk",
      },
    ]);
  });

  test("zlicza obrażenia przyjęte przez gracza", async () => {
    const stats = aggregate(await load());
    const player = stats.actors.find((a) => a.name === "Łowca głów z psk")!;

    expect(player.damageTaken).toBe(217 + 187 + 192 + 184 + 213 + 389);
    expect(player.damageDealt).toBe(0); // wszystkie jego ciosy weszły za -0
    expect(stats.unknownLines).toBe(0);
  });

  test("zgłasza zduplikowaną nazwę w drużynie", async () => {
    // Dwie "Wieczornice" są nierozróżnialne — log nie daje identyfikatora.
    expect(aggregate(await load()).ambiguousNames).toEqual(["Wieczornica"]);
  });

  test("nie szacuje HP, gdy pod nazwą kryją się dwie postacie", async () => {
    const events = parse(
      await Bun.file(`${FIXTURES}new-engine/2026-07-18_lowca-vs-druzyna/raw.txt`).text(),
    );
    // HP "Lochy" skacze w górę, bo to naprzemiennie dwa różne moby.
    expect(estimateMaxHp(events, "Locha")).toBeNull();
  });
});

describe("tancerz vs tropiciel (pvp)", () => {
  const load = async () =>
    parse(
      await Bun.file(`${FIXTURES}new-engine/2026-07-18_tancerz-vs-tropiciel-pvp/raw.txt`).text(),
    );

  test("unik zdejmuje tylko trafienie, które weszło za zero", async () => {
    const partial = (await load()).find(
      (e) => e.kind === "attack" && e.dodged && e.hits.some((h) => h.applied > 0),
    );
    expect(partial).toMatchObject({
      source: "Tancogniew Kazrek",
      dodged: true,
      hits: [
        { raw: 1041, applied: 0, dodged: true },
        { raw: 595, applied: 284, dodged: false, secondary: true },
      ],
    });
  });

  test("unik liczy się raz na atak, niezależnie od liczby obrażeń w ciosie", async () => {
    // Ten sam unik dawałby 1 u łowcy (jedna liczba) i 2 u tropiciela (dwie),
    // więc licznik nie dałby się porównywać między profesjami.
    //
    // Sumujemy OBA liczniki, bo pełny i częściowy to ten sam unik widziany
    // z dwóch stron — rozdzielone są dlatego, że częściowy jest jednocześnie
    // ciosem, a nie dlatego, że przestał być unikiem.
    const events = await load();
    const dodgedAttacks = events.filter((e) => e.kind === "attack" && e.dodged);
    const stats = aggregate(events);
    const total = stats.actors.reduce(
      (sum, actor) => sum + actor.misses + actor.partialMisses,
      0,
    );

    expect(dodgedAttacks.length).toBeGreaterThan(0);
    expect(total).toBe(dodgedAttacks.length);
  });

  test("obrażenia broni pomocniczej po uniku nie giną w statystykach", async () => {
    const stats = aggregate(await load());
    const kazrek = stats.actors.find((a) => a.name === "Tancogniew Kazrek")!;

    // Dwa ataki z częściowym unikiem: 284 + 234 wchodzi, main hand przepada.
    // Ani jeden atak nie przepadł w CAŁOŚCI, więc `misses` jest zerem — i to
    // jest cała różnica: te dwa ataki weszły, choć log zgłosił przy nich „Unik".
    expect(kazrek.misses).toBe(0);
    expect(kazrek.partialMisses).toBe(2);
    // Dwanaście ataków, dwanaście ciosów — nic do dodania do siebie.
    expect(kazrek.hits + kazrek.misses).toBe(12);
    expect(kazrek.damageDealt).toBe(10366);
    expect(stats.unknownLines).toBe(0);
  });

  test("komunikaty tła nie lądują w unknown", async () => {
    const info = (await load()).filter((e) => e.kind === "info");
    expect(info.map((e) => e.kind === "info" && e.line)).toEqual([
      "Tancogniew Kazrek spowija się trującą mgłą: -3% obrażeń zadawanych przez zatrutych przeciwników.",
      "Walka bez Punktów Honoru - gracze są z tego samego klanu.",
    ]);
  });

  test("atak w martwego przeciwnika to komunikat tła", () => {
    const events = parse("[b]Łowcosław Kazrek - atak w martwego przeciwnika.[/b]");
    expect(events).toEqual([
      { kind: "info", line: "Łowcosław Kazrek - atak w martwego przeciwnika." },
    ]);
  });

  test("linia z łupem to komunikat tła, nie nieznana linia", () => {
    const events = parse(
      "[b]Gnoll łucznik: zdobyto Niebieskawy pancerz gnolla[/b]",
    );
    expect(events).toEqual([
      { kind: "info", line: "Gnoll łucznik: zdobyto Niebieskawy pancerz gnolla" },
    ]);
    // Nazwa przed dwukropkiem nie może zrobić z potwora aktora ze statystykami.
    expect(aggregate(events).actors).toEqual([]);
  });

  test("czyta ruch zapisany bez końcówki (a)", async () => {
    expect((await load()).find((e) => e.kind === "move")).toEqual({
      kind: "move",
      actor: "Tancogniew Kazrek",
      hpPct: 92.84,
      description: "krok do przodu",
    });
  });

  test("rozdziela leczenie ze źródłem od bezimiennego", async () => {
    const stats = aggregate(await load());
    const kazrek = stats.actors.find((a) => a.name === "Tancogniew Kazrek")!;

    expect(kazrek.healingDone).toBe(777 + 777 + 505); // Dotyk anioła — źródło znane
    expect(kazrek.healingReceived).toBe(518 + 2059); // + regeneracja "Przywrócono"
    // Gołe "Przywrócono" nie mówi, kto leczy — ale mówi, KOGO wyleczyło, więc
    // pula dzieli się po stronie leczonego, tak jak trucizna po poszkodowanym.
    expect(totalBySide(stats.unattributedHealing)).toBe(518 + 2546);
  });

  test("czyta zwycięstwo i porażkę w walce 1v1", async () => {
    expect((await load()).filter((e) => e.kind === "fight-end")).toEqual([
      {
        kind: "fight-end",
        outcome: "victory",
        actors: ["Tancogniew Kazrek"],
        result: "Zwyciężył Tancogniew Kazrek",
      },
      {
        kind: "fight-end",
        outcome: "defeat",
        actors: ["wf agar psk"],
        result: "Poległ wf agar psk",
      },
    ]);
  });
});

describe("tropiciel vs kukła treningowa", () => {
  const load = async () =>
    parse(await Bun.file(`${FIXTURES}new-engine/2026-07-18_tropiciel-vs-kukla/raw.txt`).text());

  test("Przebicie znosi redukcję celu", async () => {
    const attacks = (await load()).filter((e) => e.kind === "attack" && e.source === "Magister Dwa");
    const withPiercing = attacks.filter((e) => e.kind === "attack" && e.procs.includes("Przebicie"));
    const without = attacks.filter((e) => e.kind === "attack" && !e.procs.includes("Przebicie"));

    for (const event of withPiercing) {
      for (const hit of event.kind === "attack" ? event.hits : []) {
        expect(hit.applied).toBe(hit.raw);
      }
    }
    for (const event of without) {
      for (const hit of event.kind === "attack" ? event.hits : []) {
        expect(hit.raw - hit.applied).toBe(1);
      }
    }
  });

  test("cios bez zapowiedzi umiejętności trafia pod zwykły atak", async () => {
    const dwa = aggregate(await load()).actors.find((a) => a.name === "Magister Dwa")!;
    expect(dwa.dealtBy.map((source) => source.label)).toEqual(["Zwykły atak"]);
  });

  test("czyta profesję tropiciela z linii otwierającej", async () => {
    const start = (await load()).find((e) => e.kind === "fight-start");
    expect(start?.participants[0]).toEqual({
      name: "Magister Dwa",
      level: 64,
      professionCode: "t",
      side: 0,
    });
  });
});

describe("nazwy umiejętności", () => {
  const load = async () =>
    parse(
      await Bun.file(
        `${FIXTURES}new-engine/2026-07-18_tancerz-vs-tropiciel-umiejetnosci/raw.txt`,
      ).text(),
    );

  test("przypisuje cios do zapowiedzianej umiejętności", async () => {
    const attack = (await load()).find(
      (e) => e.kind === "attack" && e.source === "Tancogniew Kazrek",
    );
    expect(attack).toMatchObject({ ability: "Błyskawiczny cios", source: "Tancogniew Kazrek" });
  });

  test("jedna zapowiedź obejmuje wszystkie ciosy bloku", async () => {
    // "Podwójne trafienie" to dwa osobne bloki ataku pod jedną nazwą.
    const doubles = (await load()).filter(
      (e) => e.kind === "attack" && e.ability === "Podwójne trafienie",
    );
    expect(doubles).toHaveLength(2);
  });

  test("cios po leczeniu nie dziedziczy poprzedniej umiejętności", async () => {
    const plain = (await load()).filter((e) => e.kind === "attack" && e.ability === null);
    expect(plain).not.toHaveLength(0);
    expect(plain.every((e) => e.kind === "attack" && e.source === "wf agar psk")).toBe(true);
  });

  test("czyta obrażenia zadane przez samą umiejętność", async () => {
    // Odwrócony szyk: "-507 obrażeń otrzymał(a) X(75.08%)." bez "uderzył z siłą".
    const own = (await load()).find(
      (e) => e.kind === "attack" && e.ability === "Wycieńczająca strzała",
    );
    expect(own).toMatchObject({
      source: "wf agar psk",
      target: "Tancogniew Kazrek",
      targetHpPct: 75.08,
      hits: [{ raw: 507, applied: 507 }],
    });
  });

  test("czyta DoT zapisany w szyku 'otrzymał N obrażeń od X'", async () => {
    const dot = (await load()).find((e) => e.kind === "dot" && e.dotType === "błyskawic");
    expect(dot).toEqual({
      kind: "dot",
      target: "Tancogniew Kazrek",
      targetHpPct: 80,
      amount: 162,
      weakenedPct: null,
      via: "od",
      dotType: "błyskawic",
    });
  });

  test("modyfikator z liczbą tuż po znaku nie rozbija bloku ataku", async () => {
    // "+14 energii" wywracało parser: cios lądował jako nierozpoznana linia.
    const attack = (await load()).find(
      (e) => e.kind === "attack" && e.ability === "Rozpraszający atak",
    );
    expect(attack).toMatchObject({ hits: [{ applied: 719 }, { applied: 298 }] });
    expect(attack?.kind === "attack" && attack.procs).toContain("14 energii");
  });

  test("sumuje obrażenia per umiejętność", async () => {
    const kazrek = aggregate(await load()).actors.find((a) => a.name === "Tancogniew Kazrek")!;
    // Tancerz uderza dwiema broniami, więc jeden cios niesie dwie liczby —
    // `hits` liczy ciosy, nie liczby, więc na dwa użycia wypada 2, nie 4.
    expect(kazrek.dealtBy).toEqual([
      { label: "Rozpraszający atak", amount: 2100, hits: 2 },
      { label: "Błyskawiczny cios", amount: 1731, hits: 2 },
      { label: "Trujące pchnięcie", amount: 221, hits: 1 },
      { label: "Trucizna", amount: 184, hits: 2 },
    ]);
  });
});

describe("łowca vs tropiciel — zasoby i leczenie w środku bloku", () => {
  const load = async (name: string) =>
    parse(await Bun.file(`${FIXTURES}new-engine/${name}/raw.txt`).text());

  test("przyrost energii nie kończy bloku umiejętności", async () => {
    // "X otrzymuje 15 energii." stoi MIĘDZY zapowiedzią a ciosem — gdyby
    // kończyło blok, cios zgubiłby nazwę i wpadł do "Zwykły atak".
    const events = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const attack = events.find((e) => e.kind === "attack" && e.ability === "Błyskawiczny strzał");
    expect(attack).toMatchObject({ hits: [{ applied: 967 }] });
  });

  test("czyta leczenie w szyku 'X: Umiejętność, zregenerowano N'", async () => {
    const events = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    expect(events.find((e) => e.kind === "heal" && e.ability === "Ostatni ratunek")).toEqual({
      kind: "heal",
      ability: "Ostatni ratunek",
      target: "wf foverek psk",
      amount: 3056,
      targetHpPct: 38,
      self: true,
    });
  });

  test("leczenie w środku bloku ataku nie gubi ciosu", async () => {
    // Log wcisnął "Ostatni ratunek" MIĘDZY linię ciosu a linię obrażeń.
    const events = await load("2026-07-18_lowca-vs-tropiciel-glebokarana");
    const attack = events.find(
      (e) => e.kind === "attack" && e.hits.some((hit) => hit.applied === 1363),
    );
    expect(attack).toMatchObject({ source: "Łowcomir Kazrek", target: "wf regulus psk" });
    expect(events.filter((e) => e.kind === "unknown")).toEqual([]);
  });

  test("rozróżnia obrażenia 'od' czegoś i 'po' czymś", async () => {
    const stats = aggregate(await load("2026-07-18_lowca-vs-tropiciel-glebokarana"));
    const lowca = stats.actors.find((a) => a.name === "Łowcomir Kazrek")!;
    expect(lowca.dealtBy.map((source) => source.label)).toEqual([
      "Zwykły atak",
      // Dwa różne rodzaje mimo wspólnej rodziny „rana" — rozróżnienie żyje tu,
      // w kolumnie akcji; scala je dopiero przekrój „TYP OBRAŻEŃ".
      "Głęboka rana",
      "Zranienie",
    ]);
  });

  test("czyta DoT z osłabieniem w szyku 'otrzymał'", async () => {
    const events = await load("2026-07-18_lowca-vs-tropiciel-glebokarana");
    expect(events.find((e) => e.kind === "dot" && e.dotType === "ognia")).toEqual({
      kind: "dot",
      target: "Łowcomir Kazrek",
      targetHpPct: 67.58,
      amount: 236,
      weakenedPct: 19,
      via: "od",
      dotType: "ognia",
    });
  });
});

describe("licznik użyć umiejętności", () => {
  const load = async (name: string) =>
    aggregate(parse(await Bun.file(`${FIXTURES}new-engine/${name}/raw.txt`).text()));

  const uses = (stats: BattleStats, name: string) =>
    stats.actors.find((a) => a.name === name)!.abilityUses;

  test("liczy zapowiedzi, nie ciosy, które z nich wyszły", async () => {
    // Sedno: "Podwójny strzał" to JEDNA zapowiedź i DWA bloki ciosu. Licznik
    // ciosów czytało się jak liczbę odpaleń umiejętności.
    const stats = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const lowca = stats.actors.find((a) => a.name === "Łowcosław Kazrek")!;

    expect(uses(stats, "Łowcosław Kazrek")).toContainEqual({
      label: "Podwójny strzał",
      count: 3,
    });
    expect(lowca.dealtBy.find((s) => s.label === "Podwójny strzał")!.hits).toBe(6);
  });

  test("użycie wyunikane w całości liczy się mimo zera ciosów", async () => {
    // Bez tego licznik gubiłby akcje, które nie weszły — a to właśnie one
    // tłumaczą turę, w której postać "nic nie zrobiła".
    const stats = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const tropiciel = stats.actors.find((a) => a.name === "wf foverek psk")!;

    expect(uses(stats, "wf foverek psk")).toContainEqual({
      label: "Strzała z niespodzianką",
      count: 1,
    });
    expect(tropiciel.dealtBy.find((s) => s.label === "Strzała z niespodzianką")).toBeUndefined();
  });

  test("zwykły atak liczy się jako użycie, choć nie ma zapowiedzi", async () => {
    // Przeciwnicy NPC nie zapowiadają nic — bez tego ich wiersz byłby pusty.
    const stats = await load("2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const gnoll = stats.actors.find((a) => a.name.startsWith("Gnoll łucznik"))!;

    expect(gnoll.abilityUses.some((use) => use.label === "Zwykły atak")).toBe(true);
  });

  test("dwie liczby z jednego ciosu to jeden cios, nie dwa", async () => {
    // Tancerz uderza dwiema broniami: jedna zapowiedź, jeden blok, dwie liczby
    // obrażeń. To jedno użycie i JEDEN cios — dwa źródła obrażeń, nie dwa
    // uderzenia. Wcześniej rozbicie liczyło liczby, więc pokazywało dwa razy
    // tyle ciosów, co użyć, i czytało się jak "zwykły atak x2".
    const stats = await load("2026-07-18_tancerz-vs-tropiciel-umiejetnosci");
    const tancerz = stats.actors.find((a) => a.name === "Tancogniew Kazrek")!;

    expect(uses(stats, "Tancogniew Kazrek")).toContainEqual({
      label: "Błyskawiczny cios",
      count: 2,
    });
    expect(tancerz.dealtBy.find((s) => s.label === "Błyskawiczny cios")!.hits).toBe(2);
  });

  test("umiejętność bijąca dwa razy daje dwa ciosy z jednego użycia", async () => {
    // Odwrotny biegun tej samej reguły: "Podwójne trafienie" to DWA osobne
    // bloki ciosu pod jedną zapowiedzią. Tu rozjazd 1:2 jest prawdziwy — i
    // spada do 1:1, gdy cel padnie po pierwszym trafieniu.
    const stats = await load("2026-07-18_tancerz-vs-tropiciel-umiejetnosci");
    const tropiciel = stats.actors.find((a) => a.name === "wf agar psk")!;

    expect(uses(stats, "wf agar psk")).toContainEqual({
      label: "Podwójne trafienie",
      count: 1,
    });
    expect(tropiciel.dealtBy.find((s) => s.label === "Podwójne trafienie")!.hits).toBe(2);
  });

  test("zwykły atak nigdy nie ma więcej ciosów niż użyć", async () => {
    // Zwykły atak to zawsze jedno uderzenie, choćby niosło kilka liczb.
    for (const name of ["2026-07-18_tancerz-vs-kukla", "2026-07-18_tancerz-vs-tropiciel-pvp"]) {
      const stats = await load(name);
      for (const actor of stats.actors) {
        const used = actor.abilityUses.find((use) => use.label === "Zwykły atak");
        if (!used) continue;
        const hits = actor.dealtBy.find((s) => s.label === "Zwykły atak")?.hits ?? 0;
        expect(hits).toBeLessThanOrEqual(used.count);
      }
    }
  });

  test("postać bez własnej tury nie ma żadnych użyć", async () => {
    const stats = await load("2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const szaman = stats.actors.find((a) => a.name === "Gnoll szaman")!;

    expect(szaman.turns).toBe(0);
    expect(szaman.abilityUses).toEqual([]);
  });
});

describe("walka grupowa z umiejętnościami", () => {
  const load = async () =>
    parse(
      await Bun.file(
        `${FIXTURES}new-engine/2026-07-18_wojownik-vs-druzyna-umiejetnosci/raw.txt`,
      ).text(),
    );

  test("umiejętność nie przechodzi na przeciwnika, który uderza zaraz po niej", async () => {
    // Kontekst umiejętności był globalny: po zapowiedzi gracza uderzali
    // przeciwnicy i ich ciosy dostawały jego nazwę.
    const foreign = (await load()).filter(
      (e) => e.kind === "attack" && e.ability !== null && e.source !== "Woj Zandan Długonogi",
    );
    expect(foreign).toEqual([]);
  });

  test("rozbija zadane gracza na umiejętność i zwykły cios", async () => {
    const player = aggregate(await load()).actors.find(
      (a) => a.name === "Woj Zandan Długonogi",
    )!;
    expect(player.dealtBy).toEqual([
      { label: "Błyskawiczny atak", amount: 207, hits: 2 },
      { label: "Zwykły atak", amount: 172, hits: 2 },
    ]);
  });

  test("rozbija otrzymane na poszczególnych napastników", async () => {
    const player = aggregate(await load()).actors.find(
      (a) => a.name === "Woj Zandan Długonogi",
    )!;
    expect(player.takenFrom.map((source) => source.label)).toEqual([
      "Bulu Mulu · Zwykły atak",
      "Zulu Gula · Zwykły atak",
      "Nuna Gula · Zwykły atak",
    ]);
  });

  test("rozbija zadane na cele, a pod każdym celem na czym padło", async () => {
    // Lustro `takenFromBy`: ten sam cios drugi raz, kierunek odwrócony. Suma
    // celów równa się `dealtBy` (207 + 141 + 31 = 379), a "Zwykły atak" (172)
    // rozkłada się między dwa cele — czego płaski `dealtBy` nie pokazuje.
    const player = aggregate(await load()).actors.find(
      (a) => a.name === "Woj Zandan Długonogi",
    )!;
    expect(player.dealtToBy).toEqual([
      { label: "Zulu Gula", amount: 207, hits: 2, by: [{ label: "Błyskawiczny atak", amount: 207, hits: 2 }] },
      { label: "Nuna Gula", amount: 141, hits: 1, by: [{ label: "Zwykły atak", amount: 141, hits: 1 }] },
      { label: "Bulu Mulu", amount: 31, hits: 1, by: [{ label: "Zwykły atak", amount: 31, hits: 1 }] },
    ]);
  });

  test("czyta skład drużyny przeciwnej i jej porażkę", async () => {
    const events = await load();
    expect(events.find((e) => e.kind === "fight-start")?.participants).toHaveLength(4);
    expect(events.filter((e) => e.kind === "fight-end").at(-1)).toMatchObject({
      outcome: "defeat",
      actors: ["Bulu Mulu", "Zulu Gula", "Nuna Gula"],
    });
  });

  // Doświadczenie przestało być osobnym zdarzeniem (decyzja z `SOLID §4.22`:
  // jedyna liczba z tamtej czwórki opisująca WALKĘ, a nie postać, więc licznik
  // obrażeń nie ma dla niej miejsca). Test zostaje, tylko pilnuje czego innego:
  // usunięcie pola nie może zamienić dwóch linii logu w linie NIEZNANE, bo
  // `unknown` zapala w panelu ostrzeżenie „statystyki są niepełne".
  test("linie doświadczenia są znane, choć nieliczone", async () => {
    const events = await load();
    const xp = events.filter((e) => e.kind === "info" && e.line.includes("doświadczenia"));
    expect(xp.map((e) => e.kind === "info" && e.line)).toEqual([
      "Zwycięzca zdobył łącznie 2043 punktów doświadczenia",
      "Dodatkowe punkty doświadczenia z przedmiotów +1021.",
    ]);
    expect(events.filter((e) => e.kind === "unknown")).toHaveLength(0);
  });
});

describe("mag — umiejętności jedna po drugiej", () => {
  const load = async () =>
    parse(
      await Bun.file(
        `${FIXTURES}new-engine/2026-07-18_mag-vs-druzyna-umiejetnosci/raw.txt`,
      ).text(),
    );

  test("nowa zapowiedź nadpisuje poprzednią zamiast się z nią kleić", async () => {
    const abilities = (await load())
      .filter((e) => e.kind === "attack" && e.source === "wf mushita psk")
      .map((e) => e.kind === "attack" && e.ability);
    expect(abilities).toEqual([
      "Porażenie",
      "Lodowy pocisk",
      "Fuzja żywiołów", // obrażenia własne umiejętności
      "Fuzja żywiołów", // i cios tej samej tury
    ]);
  });

  test("sumuje obrażenia własne umiejętności razem z ciosem tury", async () => {
    const mag = aggregate(await load()).actors.find((a) => a.name === "wf mushita psk")!;
    // Sumy zostają, ciosy nie: mag zadaje zimno i błyskawicę jednym ciosem, a
    // "Fuzja żywiołów" dokłada do niego własne obrażenia osobnym zdarzeniem.
    // To jedno użycie i jeden cios, choć liczb obrażeń jest trzy.
    expect(mag.dealtBy).toEqual([
      { label: "Porażenie", amount: 1131, hits: 1 },
      { label: "Lodowy pocisk", amount: 542, hits: 1 },
      { label: "Fuzja żywiołów", amount: 345, hits: 1 }, // 14 własne + 45 + 286
    ]);
  });
});

describe("własność umiejętności", () => {
  test("cios przeciwnika tuż po zapowiedzi gracza nie dostaje jego nazwy", () => {
    // Bez ciosu gracza pomiędzy — przeciwnik uderza jako pierwszy po zapowiedzi.
    const events = parse(
      [
        "wf mushita psk wykonuje Lodowy pocisk.",
        "Furu Mulu(50%) uderzył(a) z siłą  +100",
        "wf mushita psk(90%) otrzymał  -50  obrażeń",
      ].join("\n"),
    );
    expect(events.find((e) => e.kind === "attack")).toMatchObject({
      source: "Furu Mulu",
      ability: null,
    });
  });

  test("czyta zakończenie walki z rodzajem w nawiasie", () => {
    // Tak gra pisze o potworach, u których nie zna formy gramatycznej.
    const events = parse(
      ["Zwyciężył Łowcosław Kazrek", "Poległ(a) Szalony purpurowy bazyliszek"].join("\n"),
    );
    expect(events).toEqual([
      {
        kind: "fight-end",
        outcome: "victory",
        actors: ["Łowcosław Kazrek"],
        result: "Zwyciężył Łowcosław Kazrek",
      },
      {
        kind: "fight-end",
        outcome: "defeat",
        actors: ["Szalony purpurowy bazyliszek"],
        result: "Poległ(a) Szalony purpurowy bazyliszek",
      },
    ]);
  });

  test("nazwę dostaje wyłącznie cios tego, kto ją zapowiedział", () => {
    const events = parse(
      [
        "A wykonuje Lodowy pocisk.",
        "B(50%) uderzył(a) z siłą  +100",
        "A(90%) otrzymał  -50  obrażeń",
        "A(90%) uderzył z siłą  +200",
        "B(40%) otrzymał  -150  obrażeń",
      ].join("\n"),
    );
    const attacks = events.filter((e) => e.kind === "attack");
    // Blok zamyka się na cudzym ciosie — drugi cios A jest już zwykły.
    expect(attacks.map((e) => e.kind === "attack" && e.ability)).toEqual([null, null]);
  });
});

describe("odporność na zmianę formatu", () => {
  test("nieznana linia jest raportowana, nie połykana", () => {
    const events = parse("Magister Kazrek(50%) zrobił coś zupełnie nowego");
    expect(events).toEqual([
      { kind: "unknown", line: "Magister Kazrek(50%) zrobił coś zupełnie nowego", lineNo: 1 },
    ]);
  });

  test("atak bez linii obrażeń nie jest cicho gubiony", () => {
    const events = parse("Magister Kazrek(50%) uderzył z siłą  +100");
    expect(events).toEqual([
      { kind: "unknown", line: "Magister Kazrek(50%) uderzył z siłą +100", lineNo: 1 },
    ]);
  });

  test("linia obrażeń bez zapowiedzi umiejętności trafia do unknown, nie do proc-ów", () => {
    // Ta klasa linii zaczyna się od znaku, więc dawniej łapał ją catch-all
    // `RE_MODIFIER`: obrażenia znikały, a czujka zmiany formatu milczała.
    const events = parse(
      [
        "Magister Kazrek(50%) zrobił(a) krok do przodu.",
        "-507 obrażeń otrzymał(a) Kukła Treningowa(75.08%).",
      ].join("\n"),
    );

    expect(events.map((e) => e.kind)).toEqual(["move", "unknown"]);
    expect(events[1]).toMatchObject({ lineNo: 2 });
    // Żaden proc się nie doklejił — kwota nie została „wyjaśniona" po cichu.
    expect(events.some((e) => e.kind === "attack")).toBe(false);
  });

  test("modyfikator z procentem życia w treści nie jest modyfikatorem", () => {
    // Modyfikatory są gołymi etykietami. Procent życia niesie pełne zdarzenie,
    // więc taka linia w środku bloku ataku ma zgłosić się, a nie doklejić do
    // proc-ów ciosu.
    const events = parse(
      [
        "Ktoś(50%) uderzył z siłą  +100",
        "-1234 obrażeń otrzymał(a) Cel(10%).",
        "Cel(90%) otrzymał(a)  -80  obrażeń",
      ].join("\n"),
    );

    // Cały blok zgłasza się jako nierozpoznany: cios bez domknięcia, wtrącona
    // linia i osierocona linia obrażeń. Awaria jest głośna, i o to chodzi —
    // wcześniej wtrącenie wsiąkało w proc-i, a blok wyglądał na policzony.
    expect(events.filter((e) => e.kind === "unknown")).toHaveLength(3);
    // Prawdziwe modyfikatory nadal działają — zawężenie ich nie objęło.
    const withProc = parse(
      ["Ktoś(50%) uderzył z siłą  +100", "+Klątwa", "Cel(90%) otrzymał(a)  -80  obrażeń"].join("\n"),
    );
    expect(withProc[0]).toMatchObject({ kind: "attack", procs: ["Klątwa"] });
  });

  test("proc z procentem w nawiasie nie rozbija bloku ataku", () => {
    // Format HIPOTETYCZNY — w korpusie procenty przy procach stoją gołe
    // ("+Zmiażdżenie 25%"), a nawiasy niosą liczby ("+Zranienie (182)").
    // Test nie twierdzi, że gra tak pisze; pilnuje, że strażnik HP nie zabiera
    // ze sobą całej klasy modyfikatorów, gdy kiedyś tak napisze. Przed
    // zawężeniem `RE_CARRIES_HP` ten blok dawał trzy `unknown` i gubił 80
    // obrażeń, bo procent w nawiasie wystarczał, żeby linia przestała być
    // modyfikatorem.
    const events = parse(
      [
        "Ktoś(50%) uderzył z siłą  +100",
        "+Wampiryzm (10%)",
        "Cel(90%) otrzymał(a)  -80  obrażeń",
      ].join("\n"),
    );

    expect(events.filter((e) => e.kind === "unknown")).toHaveLength(0);
    expect(events[0]).toMatchObject({
      kind: "attack",
      procs: ["Wampiryzm (10%)"],
      hits: [{ raw: 100, applied: 80 }],
    });
  });

  test("atak jednoręczny daje jedno trafienie", () => {
    const events = parse(
      "Ktoś(50%) uderzył z siłą  +100\nCel(90%) otrzymał(a)  -80  obrażeń",
    );
    expect(events[0]).toMatchObject({
      kind: "attack",
      hits: [{ raw: 100, applied: 80, crit: false, secondary: false }],
    });
  });
});

describe("głośne awarie zamiast cichych", () => {
  /** Żywioł dokleja się do liczby znacznikiem — patrz `extractText`. */
  const el = (letter: string) => `${ELEMENT_MARKER}${letter}`;

  test("nieznana klasa dmgX nie wsiąka w „bez żywiołu”", () => {
    // Cały kontrakt parsera stoi na tym, że nieznany kształt jest głośny.
    // Nieznana litera trafiała dotąd do tego samego worka co log wklejony jako
    // tekst — czyli zmiana formatu przechodziła bez śladu.
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Kamil (120h) a Wilk (10w)",
          `Kamil(100%) uderzył z siłą  +120${el("z")}`,
          `Wilk(50%) otrzymał(a)  -80${el("z")}  obrażeń`,
        ].join("\n"),
      ),
    );

    expect(stats.unknownElements).toEqual(["dmgz"]);
    // Linia jest zrozumiana, liczby się zgadzają — niepewny jest sam rodzaj.
    expect(stats.unknownLines).toBe(0);
    const kamil = stats.actors.find((a) => a.name === "Kamil")!;
    expect(kamil.damageDealt).toBe(80);
    // Nazwa klasy zostaje w nawiasie — to jedyne, co o tym rodzaju wiadomo,
    // i to ona ma trafić do zgłoszenia. Sam wiersz mówi wprost, że rodzaju nie
    // znamy, zamiast udawać kolejny żywioł.
    expect(kamil.dealtByType.map((t) => t.label)).toEqual(["Nieznany (dmgz)"]);
  });

  test("znana klasa nadal ma swoją nazwę", () => {
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Kamil (120h) a Wilk (10w)",
          `Kamil(100%) uderzył z siłą  +120${el("f")}`,
          `Wilk(50%) otrzymał(a)  -80${el("f")}  obrażeń`,
        ].join("\n"),
      ),
    );

    expect(stats.unknownElements).toEqual([]);
    expect(stats.actors.find((a) => a.name === "Kamil")!.dealtByType[0]?.label).toBe("Ogień");
  });

  /**
   * `dmgo` i `dmgg` nie są żywiołami — gra podaje przy nich SLOT BRONI albo
   * ZASIĘG zamiast rodzaju obrażeń. Siedzą w tej samej mapie, bo `dmgd`
   * („dystansowe") jest dokładnie tym samym: osią broni, nie żywiołem.
   *
   * Test pilnuje dwóch rzeczy naraz: że parser ma dla nich NAZWĘ (czyli nie
   * zapalają ostrzeżenia o nieznanym rodzaju) i że nazwa jest TA, a nie
   * zgadnięta na nowo przy kolejnym czytaniu logu.
   *
   * Nazwa parsera i wiersz w panelu to dwie różne rzeczy i test trzyma obie:
   * `broń pomocnicza` wpada do rodziny „Broń", a `globalne` rodziny nie ma —
   * bo to zasięg, nie rodzaj — więc w przekroju stoi jako jawnie nieznane.
   */
  test.each([
    ["o", "broń pomocnicza", "Broń"],
    ["g", "globalne", "Nieznany (obszarowe)"],
  ])("klasa dmg%s to „%s”, nie nieznany rodzaj", (letter, element, row) => {
    const log = [
      "Rozpoczęła się walka pomiędzy Kamil (120b) a Wilk (10w)",
      `Kamil(100%) uderzył z siłą  +120${el(letter)}`,
      `Wilk(50%) otrzymał(a)  -80${el(letter)}  obrażeń`,
    ].join("\n");
    const events = parse(log);
    const stats = aggregate(events);

    const attack = events.find((e) => e.kind === "attack");
    expect(attack?.kind === "attack" && attack.hits[0]?.element).toBe(element);
    expect(stats.unknownElements).toEqual([]);
    expect(stats.actors.find((a) => a.name === "Kamil")!.dealtByType[0]?.label).toBe(row);
  });

  test("separator tysięcy zgłasza się zamiast obcinać liczbę", () => {
    // "+10 000" rozpada się na 10 i 000, czyli cios za dziesięć zamiast
    // dziesięciu tysięcy plus widmowa broń pomocnicza — i to bez ani jednego
    // `unknown`. Formatu nie potwierdzono, ale pomyłka o trzy rzędy wielkości
    // nie może przechodzić po cichu.
    const events = parse(
      ["Kamil(100%) uderzył z siłą  +10 000", "Wilk(50%) otrzymał(a)  -8 000  obrażeń"].join("\n"),
    );

    expect(events.map((e) => e.kind)).toEqual(["unknown", "unknown"]);
    expect(events.some((e) => e.kind === "attack")).toBe(false);
  });

  test("znacznik żywiołu bierze dokładnie jedną literę", () => {
    // `extractText` dokleja do liczby POJEDYNCZĄ literę klasy. Zachłanne
    // `[a-z]+` brało razem z nią początek tego, co stało dalej — i zamiast
    // ognia wychodził żywioł o nazwie sklejonej z sąsiednim słowem.
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Kamil (120h) a Wilk (10w)",
          `Kamil(100%) uderzył z siłą  +120${el("f")}x`,
          `Wilk(50%) otrzymał(a)  -80${el("f")}  obrażeń`,
        ].join("\n"),
      ),
    );

    expect(stats.unknownElements).toEqual([]);
    expect(stats.actors.find((a) => a.name === "Kamil")!.dealtByType[0]?.label).toBe("Ogień");
  });
});

describe("leczenie kierowane", () => {
  const log = (...lines: string[]) =>
    ["Rozpoczęła się walka pomiędzy Medyk (50p), Tank (50w) a Wilk (10w)", ...lines].join("\n");

  test("bierze nazwę umiejętności z zapowiedzi stojącej nad nim", () => {
    const heal = parse(
      log("Medyk wykonuje Leczenie ran.", "Uleczono Tank o 1200 punktów życia."),
    ).find((e) => e.kind === "heal");

    expect(heal).toEqual({
      kind: "heal",
      ability: "Leczenie ran",
      target: "Tank",
      amount: 1200,
      // Ten szyk NIE niesie procentu życia celu — nigdy.
      targetHpPct: null,
      self: false,
    });
  });

  /**
   * Sedno pola `self`. Ta sama umiejętność, ta sama linia leczenia — raz na
   * siebie, raz na kogoś innego. `ability !== null` (dawne kryterium) nie
   * odróżnia tych dwóch przypadków, więc leczony wychodził na leczącego.
   */
  test("odróżnia leczenie siebie od leczenia kogoś innego", () => {
    const stats = aggregate(
      parse(
        log(
          "Tank wykonuje Leczenie ran.",
          "Uleczono Tank o 500 punktów życia.",
          "Medyk wykonuje Leczenie ran.",
          "Uleczono Tank o 1200 punktów życia.",
        ),
      ),
    );

    const tank = stats.actors.find((a) => a.name === "Tank")!;
    expect(tank.healingReceived).toBe(1700);
    // Własne jest tylko to, co rzucił na siebie; cudze 1200 nie ma sprawcy.
    expect(tank.healingDone).toBe(500);
    expect(totalBySide(stats.unattributedHealing)).toBe(1200);
    expect(tank.unattributedHealingReceived).toBe(1200);
    // Nazwa umiejętności jest znana w OBU przypadkach — to ona jest wygraną.
    expect(tank.healedBy.map((h) => h.label)).toEqual(["Leczenie ran"]);
  });

  test("poza blokiem umiejętności zostaje bez nazwy, ale z kwotą", () => {
    const heal = parse(log("Uleczono Tank o 300 punktów życia.")).find((e) => e.kind === "heal");

    expect(heal).toMatchObject({ ability: null, amount: 300, target: "Tank", self: false });
  });

  test("leczenie grupowe z ułamkiem procentu jest znane, ale nie liczone", () => {
    const events = parse(log("Medyk wykonuje Fala leczenia.", "Uleczono sojuszników o 22.5% życia."));

    expect(events.filter((e) => e.kind === "unknown")).toEqual([]);
    // Log nie rozbija tej puli na postacie, więc nie ma czego przypisać.
    expect(events.some((e) => e.kind === "heal")).toBe(false);
  });
});

describe("parowanie liczb ciosu z liczbami przyjętymi", () => {
  /** Znacznik żywiołu doklejany do liczby przez `extractText` (klasa `dmgX`). */
  const el = (letter: string) => `${ELEMENT_MARKER}${letter}`;
  const log = (strike: string, taken: string) =>
    [
      "Rozpoczęła się walka pomiędzy Kamil (120t) a Wilk (10w)",
      `Kamil(100%) uderzył z siłą  ${strike}`,
      `Wilk(50%) otrzymał(a)  ${taken}  obrażeń`,
    ].join("\n");

  /**
   * Cel wytłumił środkową liczbę do zera, więc log jej w linii przyjętych nie
   * napisał. Parowanie po indeksie dawało tu cios PRZYJĘTY większy od zadanego.
   */
  test("pomija slot, którego cel wytłumił do zera", () => {
    const attack = parse(log("+930  +147  +799", "-426  -375")).find((e) => e.kind === "attack")!;

    expect(attack.hits.map((h) => [h.raw, h.applied])).toEqual([
      [930, 426],
      [147, 0],
      [799, 375],
    ]);
  });

  /**
   * Tu sam warunek wielkości NIE wystarcza: 17 mieści się w 159, więc zimno
   * wsiąkłoby pod ogień, nie łamiąc niczego widocznego. Rozstrzyga żywioł.
   */
  test("żywioł rozstrzyga tam, gdzie wielkość nie wystarcza", () => {
    const stats = aggregate(
      parse(
        log(
          `+1054${el("d")}  +159${el("f")}  +1143${el("c")}`,
          `-179${el("d")}  -17${el("c")}`,
        ),
      ),
    );

    const kamil = stats.actors.find((a) => a.name === "Kamil")!;
    // Wytłumiony slot zostaje z zerem (ogień) — liczy się to, gdzie wylądowały
    // liczby niezerowe: 17 pod zimnem, nie pod ogniem. Przekrój nazywa RODZINY,
    // więc „dystansowe" stoi w nim jako „Broń".
    expect(kamil.dealtByType.filter((t) => t.amount > 0).map((t) => [t.label, t.amount])).toEqual([
      ["Broń", 179],
      ["Zimno", 17],
    ]);
  });

  test("liczba dołożona po redukcji zostaje osobnym trafieniem", () => {
    // "Zmiażdżenie 25%" dokłada w linii przyjętych wartość, której w ciosie
    // surowym nie było — surowej log dla niej nie podaje.
    const attack = parse(log("+900", "-400  -120")).find((e) => e.kind === "attack")!;

    expect(attack.hits.map((h) => [h.raw, h.applied])).toEqual([
      [900, 400],
      [120, 120],
    ]);
  });
});

describe("leczenie przy zdublowanej nazwie", () => {
  /**
   * Dwa "Wilki" po jednej stronie, rozdzielone spadkiem życia. Leczenie niesie
   * procent życia CELU — na nim stoi cała ta gałąź rozdzielania, a do tej pory
   * nie miała ani jednego testu.
   */
  const log = (heal: string) =>
    [
      "Rozpoczęła się walka pomiędzy Kamil (120h) a Wilk (10w), Wilk (10w)",
      "Kamil(100%) uderzył z siłą  +100",
      "Wilk(40%) otrzymał(a)  -100  obrażeń",
      "Kamil(100%) uderzył z siłą  +50",
      "Wilk(80%) otrzymał(a)  -50  obrażeń",
      heal,
    ].join("\n");

  test("leczenie trafia w instancję, która stała najbliżej POD wynikiem", () => {
    // Ranny Wilk stoi na 40%, drugi na 80%. Wyleczenie do 55% mógł dostać
    // tylko ten pierwszy — drugi musiałby stracić życie, a leczenie go dodaje.
    const stats = aggregate(parse(log("Przywrócono 30 punktów życia Wilk(55%).")));
    const healed = stats.actors.filter((a) => a.healingReceived > 0);

    expect(healed).toHaveLength(1);
    expect(healed[0]!.healingReceived).toBe(30);
    // To ta instancja, która wcześniej oberwała mocniej.
    expect(healed[0]!.damageTaken).toBe(100);
  });

  test("leczenie nie zakłada nowej instancji", () => {
    // Wyleczenie ponad wszystkich (do pełna) nie dowodzi niczyjego istnienia —
    // inaczej każde pełne uleczenie rodziłoby postać-widmo.
    const stats = aggregate(parse(log("Przywrócono 30 punktów życia Wilk(100%).")));
    const wolves = stats.actors.filter((a) => a.name.startsWith("Wilk"));

    expect(wolves).toHaveLength(2);
    expect(wolves.reduce((sum, one) => sum + one.healingReceived, 0)).toBe(30);
  });

  test("leczenie bez procentu życia lgnie do ostatnio aktywnej instancji", () => {
    // Druga niepokryta gałąź: potwory bywają leczone linią bez HP.
    const stats = aggregate(parse(log("Przywrócono 30 punktów życia Wilk")));
    const healed = stats.actors.filter((a) => a.healingReceived > 0);

    expect(healed).toHaveLength(1);
    // Ostatnia akcja dotyczyła instancji, która zeszła do 80%.
    expect(healed[0]!.damageTaken).toBe(50);
  });
});

/**
 * Szyki, które wywrócił korpus z 2026-08-03 (trzy walki 10 vs 1, patrz
 * `tests/fixtures/new-engine/2026-08-03_*`). Każdy z nich lądował wcześniej
 * w `unknown`, a fixture'y łapią je już całą walką — te testy trzymają
 * pojedyncze linie, żeby przy zmianie wzorca padał konkretny szyk, a nie
 * „gdzieś w 451 zdarzeniach coś jest nie tak".
 */
describe("szyki z korpusu 2026-08-03", () => {
  const start = "Rozpoczęła się walka pomiędzy Kamil (120h) a Wilk (10w)";

  test("ubytek życia bez sprawcy liczy się jako tyknięcie", () => {
    // Minus przed liczbą to ozdobnik zapisu, nie negacja: procent życia w tej
    // samej linii SPADA. Dowód pomiarowy stoi przy `RE_HP_LOST` w parser.ts.
    const events = parse([start, "Stracono -92 punktów życia Kamil(99.52%)"].join("\n"));
    const dot = events.find((e) => e.kind === "dot");

    expect(dot).toEqual({
      kind: "dot",
      target: "Kamil",
      targetHpPct: 99.52,
      amount: 92,
      weakenedPct: null,
      via: "od",
      dotType: "ubytku życia",
    });
  });

  test("ubytek życia wchodzi do obrażeń przyjętych i do puli bez sprawcy", () => {
    const stats = aggregate(
      parse([start, "Stracono -92 punktów życia Kamil(99.52%)"].join("\n")),
    );
    const kamil = stats.actors.find((a) => a.name === "Kamil")!;

    expect(kamil.damageTaken).toBe(92);
    expect(stats.unknownLines).toBe(0);
    // Wiersz mówi „Nieznany", i tak ma być: rodziny nie dostaje to, czego
    // rodzaju log NIE PODAJE — dokładnie jak przy „globalne" (patrz
    // `classify` w types.ts). Nazwa w nawiasie jest nasza, bo innej nie ma;
    // gdyby gra kiedyś dopisała rodzaj, ten test ma paść.
    expect(kamil.takenByType.map((t) => t.label)).toEqual(["Nieznany (Ubytek życia)"]);
  });

  test("ubytek MANY albo ENERGII to tylko komunikat tła", () => {
    // Bliźniak wyżej różni się jednym słowem, a znaczy co innego: many
    // i energii nie liczymy. Oba szyki muszą się rozejść.
    const events = parse([start, "Stracono 0 energii Kamil(28.41%)."].join("\n"));

    expect(events.at(-1)).toEqual({ kind: "info", line: "Stracono 0 energii Kamil(28.41%)." });
  });

  test.each([
    ["Wzmocnienie obrażeń fizycznych od mieczy dla wszystkich w drużynie +5%"],
    ["Czar został rzucony na siebie."],
  ])("„%s” jest znaną linią tła", (line) => {
    const events = parse([start, line].join("\n"));

    expect(events.at(-1)?.kind).toBe("info");
    expect(aggregate(events).unknownLines).toBe(0);
  });

  test("trzeci cios tancerza ostrzy ma własny rodzaj, nie „bez żywiołu”", () => {
    // Klasa `third` jako jedyna nie zaczyna się od `dmg`. Bez alternatywy
    // w `DAMAGE_CLASS` liczba przechodziła, ale z `element: null` — czyli
    // nie do odróżnienia od zrzutu tekstowego, w którym klas nie ma wcale.
    document.body.innerHTML = `<div class="battle-msg attack">${start}</div><div class="battle-msg attack">Kamil(100%) uderzył z siłą <b class="dmg">+1882</b><b class="dmgo">+732</b><b class="third">+1012</b><br>+Trzeci cios<br>Wilk(0%) otrzymał(a) <b class="dmg">-1426</b><b class="dmgo">-324</b><b class="third">-582</b> obrażeń<br></div>`;
    const events = parse(extractText(document.body));
    const attack = events.find((e) => e.kind === "attack")!;

    expect(attack.kind === "attack" && attack.hits.map((h) => h.element)).toEqual([
      "fizyczne",
      "broń pomocnicza",
      "trzeci cios",
    ]);
    expect(aggregate(events).unknownElements).toEqual([]);
  });
});
