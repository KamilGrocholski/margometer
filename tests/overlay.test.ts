import { beforeEach, describe, expect, test } from "bun:test";
import { parse } from "../src/parser.ts";
import { aggregate, totalUnattributedDot, type Aggregate } from "../src/stats.ts";
import {
  Overlay,
  tipPosition,
  type PreviewView,
  type RecorderControl,
} from "../src/overlay.ts";
import { EMPTY_STATS, Session, splitFights } from "../src/session.ts";
import { DomLogSource, extractText, findBattleLog, StaticLogSource } from "../src/source.ts";
import { ColorAssignment, PROFESSION_COLORS, SERIES_COLORS, TYPE_COLORS } from "../src/palette.ts";
import { EngineRosterSource, type RosterEntry } from "../src/roster.ts";
import { Recorder } from "../src/recorder.ts";
import { ELEMENT_MARKER } from "../src/types.ts";
import { start } from "../src/index.ts";
import { syntheticFight } from "../tools/synthetic-log.ts";
import { ManualTicker } from "./manual-ticker.ts";

const FIXTURES = new URL("./fixtures/", import.meta.url).pathname;
const number = new Intl.NumberFormat("pl-PL");
// Musi się zgadzać z formatem tempa w overlay.ts.
const rate = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });
const readFixture = (name: string) => Bun.file(`${FIXTURES}${name}/raw.txt`).text();

/**
 * Suma WSZYSTKICH liczb w dowolnie zagnieżdżonej strukturze.
 *
 * Służy strażnikowi sumowania sesji: dzięki temu, że nie wie nic o kształcie
 * `ActorStats`, obejmuje także pola, których jeszcze nie ma.
 */
const deepSum = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (Array.isArray(value)) return value.reduce((sum: number, item) => sum + deepSum(item), 0);
  if (value && typeof value === "object") {
    return Object.values(value).reduce((sum: number, item) => sum + deepSum(item), 0);
  }
  return 0;
};

// Pasek niesie numer, nazwę i JEDNĄ liczbę wiodącą, a reszta (udział, druga
// miara) siedzi w nawiasie WEWNĄTRZ tej liczby — nie w osobnej kolumnie. Stąd
// te dwa helpery: `.value` bez czytania firstChild dałoby liczbę razem
// z nawiasem, a `.share` — cały nawias zamiast samego procentu.
/** Sama liczba wiodąca, bez nawiasu: „39,4k (21% · 1,2k/t)” → „39,4k”. */
const valueOf = (row: ParentNode | null | undefined) =>
  row?.querySelector(".value")?.firstChild?.textContent?.trim() ?? null;
/** Sam procent z nawiasu: „(21% · 1,2k/t)” → „21%”. */
const shareOf = (row: ParentNode | null | undefined) =>
  row?.querySelector(".share")?.textContent?.match(/\d+%/)?.[0] ?? null;
const metricButton = (overlay: Overlay, label: string) =>
  [...overlay.shadow.querySelectorAll("button")].find((b) => b.textContent === label)!;

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("wyciąganie tekstu z DOM", () => {
  test("zachowuje podział na linie z bloków i <br>", () => {
    document.body.innerHTML =
      "<div><div>Ktoś(50%) uderzył z siłą +100</div>Cel(90%) otrzymał(a) -80 obrażeń<br>koniec</div>";

    const text = extractText(document.body);
    expect(text.trim().split("\n").map((l) => l.trim()).filter(Boolean)).toEqual([
      "Ktoś(50%) uderzył z siłą +100",
      "Cel(90%) otrzymał(a) -80 obrażeń",
      "koniec",
    ]);
  });

  test("tekst zachowany przez extractText jest parsowalny", () => {
    document.body.innerHTML =
      "<div><div>Ktoś(50%) uderzył z siłą +100</div><div>Cel(90%) otrzymał(a) -80 obrażeń</div></div>";

    const events = parse(extractText(document.body));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ kind: "attack", source: "Ktoś", target: "Cel" });
  });
});

describe("żywioły z DOM gry", () => {
  const load = async () => {
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_mag-dom/log.html`,
    ).text();
    return parse(extractText(document.body));
  };

  test("czyta żywioł z klasy CSS, której nie ma w tekście", async () => {
    // <b class="dmgc">-46</b><b class="dmgl">-266</b> — w samym tekście logu
    // żywiołu nie widać w ogóle, tylko po kolorze na UI.
    const attack = (await load()).find((e) => e.kind === "attack");
    expect(attack).toMatchObject({
      ability: "Porażenie",
      hits: [
        { applied: 46, element: "zimno" },
        { applied: 266, element: "błyskawica" },
      ],
    });
  });

  test("rozbija obrażenia maga na żywioły, obok podziału na umiejętności", async () => {
    const mag = aggregate(await load()).actors.find((a) => a.name === "wf mushita psk")!;

    // Umiejętności zostają czyste — żywioł to osobny przekrój.
    // Każdy z tych ciosów niesie dwie liczby (zimno + błyskawica), więc pod
    // umiejętnością stoi 1, a w przekroju po żywiole obie pozycje mają po 3:
    // to te same trzy ciosy policzone raz dla każdego żywiołu, który niosły.
    expect(mag.dealtBy).toEqual([
      { label: "Lodowy pocisk", amount: 537, hits: 1 },
      { label: "Zwykły atak", amount: 386, hits: 1 },
      { label: "Porażenie", amount: 312, hits: 1 },
    ]);
    expect(mag.dealtByType).toEqual([
      { label: "błyskawica", amount: 964, hits: 3 },
      { label: "zimno", amount: 271, hits: 3 },
    ]);
  });

  test("oba przekroje sumują się do tej samej wartości", async () => {
    // To ten sam worek obrażeń pokrojony inaczej — nie dwie różne liczby.
    for (const actor of aggregate(await load()).actors) {
      const sum = (rows: { amount: number }[]) => rows.reduce((a, r) => a + r.amount, 0);
      expect(sum(actor.dealtByType)).toBe(actor.damageDealt);
      expect(sum(actor.dealtBy)).toBe(actor.damageDealt);
      expect(sum(actor.takenByType)).toBe(actor.damageTaken);
    }
  });

  test("znacznik żywiołu nie wycieka do żadnego tekstu zdarzenia", async () => {
    // Znacznik żyje tylko między extractText a wyliczeniem obrażeń; gdyby
    // przeciekł, zobaczyłby go użytkownik w nazwie postaci albo umiejętności.
    const events = await load();
    expect(JSON.stringify(events)).not.toContain(ELEMENT_MARKER);
    expect(events.filter((e) => e.kind === "unknown")).toEqual([]);
  });

  test("log wklejony jako tekst nie ma żywiołów i to nie jest błąd", async () => {
    const events = parse(await readFixture("new-engine/2026-07-18_mag-vs-druzyna-umiejetnosci"));
    const hits = events.flatMap((e) => (e.kind === "attack" ? e.hits : []));
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((hit) => hit.element === null)).toBe(true);
  });
});

describe("zadane kontra otrzymane", () => {
  const load = async () => {
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_mag-dom-fuzja/log.html`,
    ).text();
    return parse(extractText(document.body));
  };

  test("postać, która tylko obrywa, ma zerowe zadane", async () => {
    // Zgłoszenie "Furu Mulu wykonuje zwykły atak, a pisze Lodowy pocisk":
    // on w tej walce nie atakuje ani razu.
    const furu = aggregate(await load()).actors.find((a) => a.name === "Furu Mulu")!;
    expect(furu.damageDealt).toBe(0);
    expect(furu.dealtBy).toEqual([]);
    expect(furu.takenFrom).toEqual([
      { label: "wf mushita psk · Porażenie", amount: 537, hits: 1 },
      { label: "wf mushita psk · Lodowy pocisk", amount: 309, hits: 1 },
    ]);
  });

  test("etykieta przyjętych niesie napastnika, nie samą umiejętność", async () => {
    const furu = aggregate(await load()).actors.find((a) => a.name === "Furu Mulu")!;
    for (const source of furu.takenFrom) expect(source.label).toContain("wf mushita psk · ");
  });

  test("czyta żywioł obrażeń własnych umiejętności z klasy dmga", async () => {
    const mag = aggregate(await load()).actors.find((a) => a.name === "wf mushita psk")!;
    expect(mag.dealtByType).toEqual([
      { label: "błyskawica", amount: 1443, hits: 3 },
      { label: "zimno", amount: 501, hits: 3 },
      { label: "nieuchronne", amount: 12, hits: 1 },
    ]);
  });

  test("liczy ciosy, nie liczby obrażeń", async () => {
    // Gracz użył umiejętności 3 razy. Każdy cios maga niesie dwie liczby
    // (zimno + błyskawica), a Fuzja żywiołów dokłada jeszcze własne obrażenia
    // obok ciosu — licząc liczby wyszłoby 7.
    const mag = aggregate(await load()).actors.find((a) => a.name === "wf mushita psk")!;
    expect(mag.hits).toBe(3);
    // Najsilniejszy cios to suma jego liczb, nie największa z nich.
    expect(mag.maxHit).toBe(298 + 800);
  });

  test("modyfikator owinięty w <font><i> nadal jest czytany", async () => {
    const crit = (await load()).find((e) => e.kind === "attack" && e.hits.some((h) => h.crit));
    expect(crit).toMatchObject({ ability: "Fuzja żywiołów" });
  });
});

describe("znajdowanie okna walki", () => {
  test("wskazuje kontener linii rozpoczęcia walki", () => {
    document.body.innerHTML = `
      <div id="gra">
        <div id="log"><div class="linia">Rozpoczęła się walka pomiędzy A (1w) a B (1w)</div></div>
      </div>`;

    expect(findBattleLog()?.id).toBe("log");
  });

  test("zwraca null, gdy walki nie ma", () => {
    document.body.innerHTML = "<div>ekran logowania</div>";
    expect(findBattleLog()).toBeNull();
  });

  test("pogrubiona linia otwierająca nie zabiera kontenera", () => {
    // Gra pogrubia linię otwierającą — `raw.txt` zapisuje ją jako `[b]...[/b]`.
    // Najgłębszym elementem z markerem jest wtedy <b>, a jego rodzicem sama
    // linia. Branie rodzica wprost podpinało obserwatora do jednej linii i
    // licznik nie widział już ani jednego obrażenia.
    document.body.innerHTML = `
      <div id="gra">
        <div id="log">
          <div class="linia"><b>Rozpoczęła się walka pomiędzy A (1w) a B (1w)</b></div>
          <div class="linia">A(100%) uderzył z siłą  +300</div>
          <div class="linia">B(60%) otrzymał(a)  -300  obrażeń</div>
        </div>
      </div>`;

    const found = findBattleLog()!;
    expect(found.id).toBe("log");
    // Sedno: z tego kontenera da się wyczytać obrażenia, nie tylko nagłówek.
    expect(parse(extractText(found)).map((e) => e.kind)).toEqual(["fight-start", "attack"]);
  });

  test("kontenerem jest pierwszy przodek niosący więcej niż jedną linię", () => {
    // Kilka warstw opakowań wokół samej linii — żadna z nich nie jest logiem.
    document.body.innerHTML = `
      <div id="gra">
        <div id="log">
          <div class="linia"><span><font><b>Rozpoczęła się walka pomiędzy A (1w) a B (1w)</b></font></span></div>
          <div class="linia">A(100%) uderzył z siłą  +300</div>
          <div class="linia">B(60%) otrzymał(a)  -300  obrażeń</div>
        </div>
      </div>`;

    expect(findBattleLog()?.id).toBe("log");
  });
});

describe("DomLogSource", () => {
  test("emituje treść po dopisaniu linii do logu", async () => {
    const log = document.createElement("div");
    document.body.append(log);

    const seen: string[] = [];
    const stop = new DomLogSource(log).subscribe((text) => seen.push(text));

    log.append(Object.assign(document.createElement("div"), { textContent: "nowa linia" }));
    await new Promise((resolve) => queueMicrotask(() => resolve(null)));
    stop();

    expect(seen).toHaveLength(2); // emisja startowa + po mutacji
    expect(seen.at(-1)).toContain("nowa linia");
  });
});

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

  test("sumuje sesję po zniknięciu walki z bufora", async () => {
    const first = await readFixture("new-engine/2026-07-18_lowca-vs-druzyna");
    const second = await readFixture("new-engine/2026-07-18_lowca-vs-paladyni");

    const session = new Session();
    session.update(first);
    const afterFirst = session.current().actors.find((a) => a.name === "Łowcożyr Kazrek")!;

    // Gra czyści log i zaczyna nową walkę — poprzednia musi przetrwać w sesji.
    session.update(second);

    expect(session.current().actors.some((a) => a.name === "Łowcożyr Kazrek")).toBe(false);
    const inSession = session.total().actors.find((a) => a.name === "Łowcożyr Kazrek")!;
    expect(inSession.damageDealt).toBe(afterFirst.damageDealt);
    expect(session.total().actors.some((a) => a.name === "Łowca głów z psk")).toBe(true);
  });

  describe("tożsamość walki przy zmianach bufora", () => {
    const NAME = "Łowcożyr Kazrek";
    const dealt = (session: Session) =>
      session.total().actors.find((a) => a.name === NAME)?.damageDealt ?? 0;

    test("przycięcie bufora nie liczy walki drugi raz", async () => {
      // Gra przycina scrollback: walka B przesuwa się z indeksu 1 na 0.
      // Gdy tożsamością był `${indeks}|${sygnatura}`, B trafiała do archiwum
      // pod starym kluczem i żyła dalej pod nowym — `total()` liczył ją 2×.
      const a = await readFixture("new-engine/2026-07-18_tancerz-vs-kukla");
      const b = await readFixture("new-engine/2026-07-18_lowca-vs-druzyna");

      const session = new Session();
      session.update(`${a}\n${b}`);
      const once = dealt(session);
      expect(once).toBeGreaterThan(0);

      session.update(b);
      expect(dealt(session)).toBe(once);
    });

    test("utrata linii otwierającej nie liczy walki drugi raz", async () => {
      // Przycięcie potrafi zabrać sam nagłówek trwającej walki. Sygnatura
      // leciała wtedy na "bez-rozpoczecia" — znowu inny klucz, znowu dubel.
      const b = await readFixture("new-engine/2026-07-18_lowca-vs-druzyna");
      const session = new Session();
      session.update(b);
      const once = dealt(session);

      session.update(b.split("\n").filter((l) => !/Rozpoczęła się walka/.test(l)).join("\n"));
      // Bez składu z linii otwierającej trucizna traci sprawcę i przenosi się
      // do puli nieprzypisanej — suma obrażeń ma się zgadzać, nie sam licznik.
      const total = session.total();
      const after = (total.actors.find((a) => a.name === NAME)?.damageDealt ?? 0)
        + totalUnattributedDot(total.unattributedDotDamage);
      expect(after).toBe(once);
    });

    test("ta sama walka od nowa liczy się dwa razy", async () => {
      // Odwrotny biegun: gra czyści log i bijemy ten sam skład ponownie.
      // Tego dubla chcemy — to naprawdę dwie walki.
      const b = await readFixture("new-engine/2026-07-18_lowca-vs-druzyna");
      const session = new Session();
      session.update(b);
      const once = dealt(session);

      // Restart: ten sam skład, ale log zaczyna się od nowa (mniej zdarzeń).
      session.update(b.split("\n").slice(0, 6).join("\n"));
      session.update(b);
      expect(dealt(session)).toBe(once * 2);
    });

    test("kolejna walka doklejona do bufora nie rusza poprzedniej", async () => {
      const a = await readFixture("new-engine/2026-07-18_tancerz-vs-kukla");
      const b = await readFixture("new-engine/2026-07-18_lowca-vs-druzyna");
      const session = new Session();
      session.update(a);
      session.update(`${a}\n${b}`);

      // Walka B jest w sumie dokładnie raz — tyle, ile liczy ją sesja widząca
      // wyłącznie ją. Walka A nie ma tej postaci, więc nic tu nie dokłada.
      const solo = new Session();
      solo.update(b);
      expect(dealt(session)).toBe(dealt(solo));
    });

    test("wyczyszczenie logu archiwizuje poprzednie walki", async () => {
      const a = await readFixture("new-engine/2026-07-18_tancerz-vs-kukla");
      const b = await readFixture("new-engine/2026-07-18_lowca-vs-druzyna");
      const session = new Session();
      session.update(`${a}\n${b}`);
      const withB = dealt(session);

      // Gra czyści log i zaczyna zupełnie inną walkę — B musi przetrwać w sumie.
      session.update(a);
      expect(dealt(session)).toBe(withB);
    });
  });

  test("suma sesji obejmuje KAŻDE pole, także jeszcze nienapisane", async () => {
    // Strażnik na KLASĘ błędu, nie na wyliczankę pól: `mergeStats` i `copyActor`
    // wymieniają pola z palca, więc nowe pole w `ActorStats` po cichu z sumy
    // wypada. Tak wypadło `abilityUses`, a potem `dealtToBy` — i poprzednia
    // wersja tego testu drugiego nie widziała, bo wymieniała pola ręcznie.
    //
    // Dlatego test nie wie, jakie pola istnieją: schodzi w głąb dowolnej
    // struktury i sumuje WSZYSTKIE liczby. Ta sama walka policzona dwa razy musi
    // podwoić każdą z nich. Nowe pole jest objęte automatycznie.
    const text = await readFixture("new-engine/2026-07-18_tancerz-vs-tropiciel-umiejetnosci");
    const session = new Session();
    session.update(text);
    const once = session.current().actors.find((a) => a.name === "Tancogniew Kazrek")!;
    // Druga walka: gra dokleja kolejne starcie do tego samego bufora.
    session.update(`${text}\n${text}`);
    const twice = session.total().actors.find((a) => a.name === "Tancogniew Kazrek")!;

    // Pola, które z definicji się NIE sumują: tożsamość postaci i rekord.
    const notAdditive = new Set(["name", "side", "professionCode", "level", "maxHit"]);
    const keys = Object.keys(once).filter((key) => !notAdditive.has(key));
    // Sam fakt, że pętla ma po czym chodzić — inaczej test przechodzi pusty.
    expect(keys.length).toBeGreaterThan(10);

    for (const key of keys) {
      const before = deepSum(once[key as keyof typeof once]);
      // Puste pole nic nie dowodzi, ale nie jest też błędem (nie każda walka ma
      // leczenie). Interesuje nas tylko to, czy niezerowe podwaja się poprawnie.
      if (before === 0) continue;
      expect([key, deepSum(twice[key as keyof typeof twice])]).toEqual([key, before * 2]);
    }
    // `maxHit` jest maksimum, nie sumą — ta sama walka dwa razy go nie rusza.
    expect(twice.maxHit).toBe(once.maxHit);
  });

  test("suma sesji nie mutuje statystyk pojedynczej walki", async () => {
    // `copyActor` musi kopiować także nowe tablice — przy współdzielonej
    // referencji sumowanie sesji dopisywałoby do wyniku bieżącej walki.
    const text = await readFixture("new-engine/2026-07-18_tancerz-vs-tropiciel-umiejetnosci");
    const session = new Session();
    session.update(text);
    const before = JSON.stringify(session.current());
    session.total();
    session.update(`${text}\n${text}`);
    session.total();
    const fresh = new Session();
    fresh.update(text);
    expect(before).toBe(JSON.stringify(fresh.current()));
  });
});

describe("trucizna w walce grupowej", () => {
  const load = async () => {
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_lowca-dom-trucizna/log.html`,
    ).text();
    return aggregate(parse(extractText(document.body)));
  };

  test("wskazuje sprawcę trucizny po stronie konfliktu, nie po liczbie postaci", async () => {
    // 1 vs 3: po drugiej stronie Lochy stoi dokładnie jeden gracz, więc
    // wątpliwości nie ma, choć uczestników walki jest czterech.
    const stats = await load();
    expect(totalUnattributedDot(stats.unattributedDotDamage)).toBe(0);

    const lowca = stats.actors.find((a) => a.name === "Łowcożyr Kazrek")!;
    expect(lowca.dealtBy).toEqual([
      { label: "Zwykły atak", amount: 786, hits: 2 },
      { label: "od trucizny", amount: 140, hits: 1 },
    ]);
  });

  test("rozdziela zdublowaną nazwę, gdy ciągi HP się rozjeżdżają", () => {
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Gracz (1w) a Wilk (1w), Wilk (1w)",
          "Gracz(100%) uderzył z siłą  +300",
          "Wilk(60%) otrzymał(a)  -300  obrażeń",
          // Ten sam skok w górę: 100% nie może być tym wilkiem na 60%.
          "Wilk(100%) zrobił(a) krok do przodu.",
          "Gracz(100%) uderzył z siłą  +200",
          "Wilk(20%) otrzymał(a)  -200  obrażeń",
        ].join("\n"),
      ),
    );

    // Oba trafienia w tego samego wilka: 60% → 20%. Drugi tylko zrobił krok.
    expect(stats.actors.find((a) => a.name === "Wilk #1")!.damageTaken).toBe(500);
    expect(stats.actors.find((a) => a.name === "Wilk #2")!.damageTaken).toBe(0);
    expect(stats.ambiguousNames).toEqual(["Wilk #1", "Wilk #2"]);
  });

  test("nie rozdziela zdublowanej nazwy, gdy log nie daje na to dowodu", () => {
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Gracz (1w) a Wilk (1w), Wilk (1w)",
          // Obaj przez całą walkę na 100% — nie do rozróżnienia.
          "Wilk(100%) uderzył(a) z siłą  +300",
          "Gracz(70%) otrzymał  -300  obrażeń",
          "Wilk(100%) uderzył(a) z siłą  +200",
          "Gracz(50%) otrzymał  -200  obrażeń",
        ].join("\n"),
      ),
    );

    // Jeden scalony wiersz. Rozbicie na #1/#2 przypisałoby konkretnemu wilkowi
    // obrażenia, o których log milczy — to byłoby zmyślenie, nie statystyka.
    expect(stats.actors.map((a) => a.name)).toEqual(["Wilk", "Gracz"]);
    expect(stats.actors.find((a) => a.name === "Wilk")!.damageDealt).toBe(500);
    expect(stats.ambiguousNames).toEqual(["Wilk"]);
  });

  test("rozdziela duplikaty, które oba zaczynają na 100%", async () => {
    const stats = aggregate(
      parse(await readFixture("new-engine/2026-07-18_lowca-vs-gnolle-rozdzielanie")),
    );

    // Podziału nie wymusza start (obaj na 100%), tylko linia "Gnoll łucznik(100%)
    // uderzył" stojąca PO "Gnoll łucznik(0%)" — życie nie rośnie, więc to ktoś inny.
    const first = stats.actors.find((a) => a.name === "Gnoll łucznik #1")!;
    const second = stats.actors.find((a) => a.name === "Gnoll łucznik #2")!;
    expect([first.damageTaken, first.damageDealt]).toEqual([2337, 439]);
    expect([second.damageTaken, second.damageDealt]).toEqual([1522, 460]);

    // Szaman padł bez jednej akcji, ale ma być widoczny.
    expect(stats.actors.find((a) => a.name === "Gnoll szaman")).toMatchObject({
      damageDealt: 0,
      damageTaken: 1411,
    });

    // Cały log rozpoznany — łącznie z "atak w martwego przeciwnika".
    expect(stats.unknownLines).toBe(0);
    expect(stats.ambiguousNames).toEqual(["Gnoll łucznik #1", "Gnoll łucznik #2"]);
  });

  test("skład z gry rozdziela nierozróżnialne duplikaty na osobne wiersze", () => {
    const log = [
      "Rozpoczęła się walka pomiędzy Gracz (1w) a Wilk (1w), Wilk (1w)",
      // Obaj przez całą walkę na 100% — log ich nie rozróżnia.
      "Wilk(100%) uderzył(a) z siłą  +300",
      "Gracz(70%) otrzymał  -300  obrażeń",
    ].join("\n");
    const fromGame: RosterEntry[] = [
      { id: 1, name: "Gracz", side: 0 },
      { id: 2, name: "Wilk", side: 1 },
      { id: 3, name: "Wilk", side: 1 },
    ];

    // Bez składu z gry: jeden scalony wiersz, bo log nie daje dowodu na dwa.
    expect(aggregate(parse(log)).actors.map((a) => a.name)).toEqual(["Wilk", "Gracz"]);

    // Ze składem z gry: istnienie obu wilków to fakt, więc dostają po wierszu.
    const stats = aggregate(parse(log), fromGame);
    expect(stats.actors.map((a) => a.name).sort()).toEqual(["Gracz", "Wilk #1", "Wilk #2"]);
    // Obrażeń log nie rozdzielił — całość siedzi na jednym, oba z gwiazdką.
    expect(stats.actors.find((a) => a.name === "Wilk #1")!.damageDealt).toBe(300);
    expect(stats.actors.find((a) => a.name === "Wilk #2")!.damageDealt).toBe(0);
    expect(stats.ambiguousNames).toEqual(["Wilk #1", "Wilk #2"]);
  });

  test("skład z gry pokazuje postać, o której log w ogóle nie wspomniał", () => {
    const stats = aggregate(
      parse("Rozpoczęła się walka pomiędzy Gracz (1w) a Wilk (1w)"),
      [
        { id: 1, name: "Gracz", side: 0 },
        { id: 2, name: "Wilk", side: 1 },
        // Log otwierający go pominął, ale w walce stoi.
        { id: 3, name: "Niedźwiedź", side: 1 },
      ],
    );

    expect(stats.actors.map((a) => a.name).sort()).toEqual(["Gracz", "Niedźwiedź", "Wilk"]);
    expect(stats.actors.find((a) => a.name === "Niedźwiedź")!.side).toBe(1);
  });

  test("strony bierze z myteam gry, nie z kolejności w logu", () => {
    const source = new EngineRosterSource({
      Engine: {
        battle: {
          myteam: 2,
          warriorsList: [{ name: "" }, { name: "" }],
          warriors: {
            a: { id: 10, name: "Gracz", team: 2 },
            b: { id: 11, name: "Wilk", team: 1 },
          },
        },
      },
    });

    // Gra raportuje myteam: 2, u nas drużyna gracza to zawsze strona 0.
    expect(source.current()).toEqual([
      { id: 10, name: "Gracz", side: 0 },
      { id: 11, name: "Wilk", side: 1 },
    ]);
  });

  test("czyta profesję z gry i dokłada ją tam, gdzie log jej nie podał", () => {
    const source = new EngineRosterSource({
      Engine: {
        battle: {
          myteam: 1,
          warriors: {
            a: { id: 10, name: "Gracz", team: 1, prof: "m" },
            // Starszy klient albo patch: wpis bez profesji ma nadal działać.
            b: { id: 11, name: "Wilk", team: 2 },
          },
        },
      },
    });
    const fromGame = source.current()!;
    expect(fromGame[0]).toMatchObject({ name: "Gracz", side: 0, prof: "m" });
    expect(fromGame[1]).not.toHaveProperty("prof");

    // Nagłówek wyjechał z bufora, więc profesji nie ma skąd wziąć poza grą.
    const stats = aggregate(parse("Gracz(50%): 100 obrażeń od trucizny."), fromGame);
    expect(stats.actors.find((a) => a.name === "Gracz")!.professionCode).toBe("m");
    expect(stats.actors.find((a) => a.name === "Wilk")!.professionCode).toBeNull();
  });

  test("profesja z linii otwierającej uzupełnia skład z gry", () => {
    // Skład z gry rządzi stronami, ale gdy nie niesie profesji, literę dokłada
    // log — oba źródła piszą ją tym samym alfabetem.
    const stats = aggregate(
      parse("Rozpoczęła się walka pomiędzy Gracz (85b) a Wilk (12w)"),
      [
        { id: 1, name: "Gracz", side: 0 },
        { id: 2, name: "Wilk", side: 1 },
      ],
    );
    expect(stats.actors.find((a) => a.name === "Gracz")!.professionCode).toBe("b");
    expect(stats.actors.find((a) => a.name === "Wilk")!.professionCode).toBe("w");
  });

  test("brak walki albo obcy kształt danych nie wywraca odczytu składu", () => {
    expect(new EngineRosterSource({}).current()).toBeNull();
    expect(new EngineRosterSource({ Engine: {} }).current()).toBeNull();
    // Sloty bez nazw to prealokacja poza walką, nie skład.
    expect(
      new EngineRosterSource({ Engine: { battle: { myteam: 1, warriors: [{ name: "" }] } } }).current(),
    ).toBeNull();
    // Bez myteam nie zgadujemy stron — zostawiamy je logowi.
    expect(
      new EngineRosterSource({
        Engine: { battle: { warriors: [{ id: 1, name: "X", team: 1 }] } },
      }).current(),
    ).toBeNull();
  });

  test("nie zgaduje sprawcy, gdy po drugiej stronie stoi kilku", async () => {
    // Gracz otoczony przez trzech: który z nich zatruł — nie wiadomo.
    const events = parse(
      [
        "Rozpoczęła się walka pomiędzy Gracz (1w) a A (1w), B (1w), C (1w)",
        "Gracz(50%): 100 obrażeń od trucizny.",
      ].join("\n"),
    );
    const stats = aggregate(events);
    // Sprawcy nie znamy, ale poszkodowanego tak — trucizna ląduje po stronie gracza.
    expect(stats.unattributedDotDamage).toEqual({ mine: 100, enemy: 0, loose: 0 });
    expect(stats.actors.find((a) => a.name === "A")?.damageDealt).toBe(0);
  });

  test("skład z gry wskazuje sprawcę trucizny, gdy nagłówek wyjechał z bufora", () => {
    // Przewidziany przypadek: log traci treść od góry, więc linii otwierającej
    // już nie widać. Skład z gry mówi jednak wprost, kto stoi po drugiej stronie.
    const events = parse("Gracz(50%): 280 obrażeń od trucizny.");
    const fromGame: RosterEntry[] = [
      { id: 1, name: "Gracz", side: 0 },
      { id: 2, name: "Wilk", side: 1 },
    ];

    // Bez składu nie ma po czym liczyć stron — trucizna zostaje bez sprawcy.
    expect(totalUnattributedDot(aggregate(events).unattributedDotDamage)).toBe(280);

    const stats = aggregate(events, fromGame);
    expect(totalUnattributedDot(stats.unattributedDotDamage)).toBe(0);
    expect(stats.actors.find((a) => a.name === "Wilk")!.damageDealt).toBe(280);
  });

  test("trucizna przed pierwszą turą nie wypada z osi tur", () => {
    // Bufor przycięty do tyknięcia trucizny: żadna tura jeszcze się nie otwarła,
    // a kwota nie ma prawa przepaść — Σ osi musi się zgadzać z Σ zdarzeń.
    const stats = aggregate(
      parse(
        [
          "Gracz(50%): 140 obrażeń od trucizny.",
          "Gracz(50%) uderzył z siłą  +2189",
          "Wilk(10%) otrzymał(a)  -2189  obrażeń",
        ].join("\n"),
      ),
    );

    const onAxis = stats.timeline.reduce((sum, slice) => sum + slice.damage, 0);
    expect(onAxis).toBe(140 + 2189);
    // Tura tła nie dostaje strony: log nie mówi, kto wtedy działał.
    expect(stats.timeline[0]).toMatchObject({ turn: 1, side: null, damage: 140 });
  });

  test("maks. cios nie liczy własnych obrażeń umiejętności", () => {
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Gracz (1m) a Wilk (1w)",
          "Gracz wykonuje Fuzja żywiołów.",
          // Własne obrażenia umiejętności — lecą OBOK ciosu, nie są ciosem.
          "-2000 obrażeń otrzymał(a) Wilk(50%).",
          "Gracz(100%) uderzył z siłą  +300",
          "Wilk(30%) otrzymał(a)  -300  obrażeń",
        ].join("\n"),
      ),
    );

    const gracz = stats.actors.find((a) => a.name === "Gracz")!;
    // Obrażenia liczą się w całości, rekord pojedynczego uderzenia już nie.
    expect(gracz.damageDealt).toBe(2300);
    expect(gracz.maxHit).toBe(300);
  });

  test("rozróżnia klasy obrażeń fizycznych: zwarcie kontra dystans", async () => {
    const stats = await load();
    expect(stats.actors.find((a) => a.name === "Łowcożyr Kazrek")!.dealtByType).toEqual([
      { label: "dystansowe", amount: 786, hits: 2 },
      { label: "od trucizny", amount: 140, hits: 1 },
    ]);
    // Dwa Odyńce log rozdziela: jeden zbity do 40.37%, drugi atakuje ze 100%.
    expect(stats.actors.find((a) => a.name === "Odyniec #2")!.dealtByType).toEqual([
      { label: "fizyczne", amount: 95, hits: 1 },
    ]);
    expect(stats.actors.find((a) => a.name === "Odyniec #1")!.damageTaken).toBe(455);
  });
});

describe("leczenie", () => {
  const load = async (name: string) => aggregate(parse(await readFixture(`new-engine/${name}`)));

  test("rozbija leczenie na źródła, tak jak obrażenia", async () => {
    const tropiciel = (await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci")).actors.find(
      (a) => a.name === "wf foverek psk",
    )!;
    expect(tropiciel.healingReceived).toBe(3686);
    expect(tropiciel.healedBy).toEqual([
      { label: "Ostatni ratunek", amount: 3056, hits: 1 },
      { label: "Regeneracja", amount: 630, hits: 3 },
    ]);
  });

  test("gołe \"Przywrócono\" ląduje pod Regeneracją, bo log nie podaje źródła", async () => {
    const lowca = (await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci")).actors.find(
      (a) => a.name === "Łowcosław Kazrek",
    )!;
    expect(lowca.healedBy).toEqual([{ label: "Regeneracja", amount: 466, hits: 3 }]);
  });

  test("rozbicie sumuje się do wartości na pasku", async () => {
    for (const actor of (await load("2026-07-18_tancerz-vs-tropiciel-umiejetnosci")).actors) {
      const sum = actor.healedBy.reduce((acc, row) => acc + row.amount, 0);
      expect(sum).toBe(actor.healingReceived);
    }
  });

  test("zakładka Leczenie sortuje po wyleczonym, nie po obrażeniach", async () => {
    const stats = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    metricButton(overlay, "Leczenie").click();

    // Jedna wspólna lista, bez podziału na strony — tropiciel stoi na szczycie
    // całego rankingu, bo wyleczył się mocniej niż ktokolwiek w walce.
    const first = overlay.shadow.querySelector(".row")!;
    expect(first.querySelector(".label")?.textContent).toBe("wf foverek psk");
    // Udział liczy się wobec CAŁEJ walki, więc lider nie ma automatycznie 100%.
    expect(valueOf(first)).toBe(number.format(3686));
    expect(shareOf(first)).toBe("89%");
  });

  test("rozbicie leczenia pokazuje od czego wyleczono, bez typu obrażeń", async () => {
    const stats = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    metricButton(overlay, "Leczenie").click();
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "wf foverek psk")!
      .click();

    const heads = [...overlay.shadow.querySelectorAll(".rows .side-head")].map(
      (el) => el.firstElementChild?.textContent,
    );
    // Pierwszy szczebel to źródło ("OD CZEGO"), w parze z "OD KOGO/KOMU" reszty.
    // Leczenie nie ma podziału na żywioły — sekcja typu w ogóle się nie pojawia.
    expect(heads).toEqual(["OD CZEGO"]);
    expect([...overlay.shadow.querySelectorAll(".rows .row .label")].map((el) => el.textContent))
      .toEqual(["Ostatni ratunek", "Regeneracja"]);
  });

  test("dymek wymienia obie sekcje efektów jako skrót", async () => {
    const stats = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "wf foverek psk")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector(".tip")!;
    expect([...tip.querySelectorAll(".tip-heading")].map((el) => el.textContent)).toEqual([
      "Ogólne",
      "Użycia akcji",
      "Efekty w ciosach",
      "Efekty otrzymane",
    ]);
  });
});

describe("licznik tur", () => {
  const load = async (name: string) => aggregate(parse(await readFixture(`new-engine/${name}`)));

  test("umiejętność na kilka ciosów to jedna tura", async () => {
    // "Podwójny strzał" = dwa ciosy w jednej turze; łowca ma 8 ciosów w 5 turach.
    const lowca = (await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci")).actors.find(
      (a) => a.name === "Łowcosław Kazrek",
    )!;
    expect(lowca.hits).toBe(8);
    expect(lowca.turns).toBe(5);
  });

  test("dymek podaje tury utracone wraz z udziałem", async () => {
    // Korpus ma dokładnie dwa zdarzenia "utrata tury" — to jedno z nich.
    // Utrata tury JEST turą, tylko bez akcji, więc wchodzi też do `turns`.
    const stats = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const tropiciel = stats.actors.find((a) => a.name === "wf foverek psk")!;
    expect(tropiciel.turnsLost).toBe(1);

    const overlay = new Overlay();
    overlay.render(stats, stats);
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "wf foverek psk")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector(".tip")!;
    const stat = (label: string) =>
      [...tip.querySelectorAll(".tip-stat")]
        .find((row) => row.querySelector(".tip-stat-label")?.textContent === label)
        ?.querySelector(".tip-stat-value")?.textContent;

    const share = Math.round((tropiciel.turnsLost / tropiciel.turns) * 100);
    expect(stat("Tury")).toBe(`${tropiciel.turns}`);
    expect(stat("Tury utracone")).toBe(`1 (${share}%)`);
  });

  test("dwie tury tej samej postaci pod rząd nie sklejają się w jedną", async () => {
    // Między nimi stoi tylko leczenie, więc bez znacznika "wykonuje" wyszłaby
    // jedna tura zamiast dwóch.
    const events = parse(await readFixture("new-engine/2026-07-18_lowca-vs-tropiciel-umiejetnosci"));
    const kolejnosc = events
      .filter((e) => e.kind === "ability")
      .map((e) => (e.kind === "ability" ? e.actor : ""));
    expect(kolejnosc.filter((a) => a === "Łowcosław Kazrek").length).toBeGreaterThan(1);

    const lowca = aggregate(events).actors.find((a) => a.name === "Łowcosław Kazrek")!;
    expect(lowca.turns).toBeGreaterThanOrEqual(kolejnosc.filter((a) => a === "Łowcosław Kazrek").length);
  });

  test("utrata tury liczy się jako tura", async () => {
    const tropiciel = (await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci")).actors.find(
      (a) => a.name === "wf foverek psk",
    )!;
    expect(tropiciel.turnsLost).toBe(1);
    expect(tropiciel.turns).toBe(3); // 2 z akcją + 1 utracona
  });

  // Jak wyżej: zakładki Tury nie ma w UI, licznik w `ActorStats` działa dalej.
  test.skip("zakładka Tury pokazuje liczbę tur zamiast obrażeń", async () => {
    const stats = await load("2026-07-18_wojownik-vs-druzyna-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    [...overlay.shadow.querySelectorAll("button")].find((b) => b.textContent === "Tury")!.click();

    const rows = [...overlay.shadow.querySelectorAll(".row")].map((r) => [
      r.querySelector(".label")?.textContent,
      r.querySelector(".value")?.textContent?.trim(),
    ]);
    expect(rows).toEqual([
      ["Woj Zandan Długonogi", "5 50%"],
      ["Bulu Mulu", "2 20%"],
      ["Nuna Gula", "2 20%"],
      ["Zulu Gula", "1 10%"],
    ]);
  });

  test("dymek pokazuje wszystkie widoczne metryki naraz, bez skakania po zakładkach", async () => {
    const stats = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    overlay.shadow.querySelector(".row")!.dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector(".tip")!;
    const stat = (label: string) =>
      [...tip.querySelectorAll(".tip-stat")]
        .find((row) => row.querySelector(".tip-stat-label")?.textContent === label)
        ?.querySelector(".tip-stat-value")?.textContent;

    // Zakładka stoi na "Zadane", a mimo to widać obie metryki. Postać bierzemy
    // z wiersza, nie z nazwy na sztywno — dymek dotyczy tego, co pod kursorem.
    const hovered = overlay.shadow.querySelector<HTMLElement>(".row")!.dataset.actor;
    const actor = stats.actors.find((a) => a.name === hovered)!;
    expect(stat("Zadane")).toBe(number.format(actor.damageDealt));
    expect(stat("Otrzymane")).toBe(number.format(actor.damageTaken));
    expect(stat("Leczenie")).toBe(number.format(actor.healingReceived));
    // Tury stoją tu mimo braku własnej zakładki: bez nich sumy nie mają skali.
    expect(stat("Tury")).toBe(`${actor.turns}`);

    // Tury utracone stoją ZAWSZE, także jako zero: brak wiersza czytałoby się
    // jak brak pomiaru, a nie jak brak strat.
    expect(stat("Tury utracone")).toBeDefined();

    // Aktywna metryka wyróżniona, żeby było wiadomo, wobec czego jest ranking.
    const active = [...tip.querySelectorAll(".tip-stat.is-active")];
    expect(active).toHaveLength(1);
    expect(active[0]!.querySelector(".tip-stat-label")?.textContent).toBe("Zadane");

    // Liczniki bez własnej zakładki też muszą być pod ręką.
    const note = tip.querySelector(".tip-note")?.textContent ?? "";
    expect(note).toContain(`ciosy ${actor.hits}`);
    expect(note).toContain(`kryt. ${actor.crits}`);
    expect(note).toContain(`maks. cios ${number.format(actor.maxHit)}`);
  });

  test.skip("dymek dla tur nie pokazuje rozbicia obrażeń", async () => {
    const stats = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    [...overlay.shadow.querySelectorAll("button")].find((b) => b.textContent === "Tury")!.click();
    overlay.shadow.querySelector(".row")!.dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector(".tip")!;
    expect([...tip.querySelectorAll(".tip-heading")].map((el) => el.textContent)).toEqual([
      "Ogólne",
      "Efekty w ciosach",
      "Efekty otrzymane",
      "Na co poszły",
    ]);
    expect(tip.textContent).not.toContain("Typ obrażeń");
  });
});

describe("podział na drużyny", () => {
  const load = async () =>
    aggregate(parse(await readFixture("new-engine/2026-07-18_wojownik-vs-druzyna-umiejetnosci")));

  const teamButton = (overlay: Overlay, label: string) =>
    [...overlay.shadow.querySelectorAll("button")].find((b) => b.textContent === label)!;
  const labels = (overlay: Overlay) =>
    [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);

  test("czyta strony konfliktu z linii otwierającej", async () => {
    const sides = (await load()).actors.map((a) => [a.name, a.side]);
    expect(sides).toEqual([
      ["Woj Zandan Długonogi", 0],
      ["Bulu Mulu", 1],
      ["Zulu Gula", 1],
      ["Nuna Gula", 1],
    ]);
  });

  test("filtruje wiersze do wybranej drużyny", async () => {
    const stats = await load();
    const overlay = new Overlay();
    overlay.render(stats, stats);

    expect(labels(overlay)).toHaveLength(4);

    teamButton(overlay, "My").click();
    expect(labels(overlay)).toEqual(["Woj Zandan Długonogi"]);

    teamButton(overlay, "Oni").click();
    expect(labels(overlay)).toEqual(["Bulu Mulu", "Zulu Gula", "Nuna Gula"]);

    teamButton(overlay, "Wszyscy").click();
    expect(labels(overlay)).toHaveLength(4);
  });

  test("procenty liczą się w obrębie wybranej drużyny", async () => {
    const stats = await load();
    const overlay = new Overlay();
    overlay.render(stats, stats);
    teamButton(overlay, "Oni").click();

    // 149 + 54 + 22 = 225 obrażeń drużyny przeciwnej; Bulu Mulu to 66% z tego,
    // a nie 28% z sumy całej walki.
    const shares = [...overlay.shadow.querySelectorAll(".rows .row")].map(shareOf);
    expect(shares[0]).toBe("66%");
  });

  test("filtr działa razem z przełącznikiem metryki", async () => {
    const stats = await load();
    const overlay = new Overlay();
    overlay.render(stats, stats);

    teamButton(overlay, "My").click();
    teamButton(overlay, "Otrzymane").click();
    expect(labels(overlay)).toEqual(["Woj Zandan Długonogi"]);
  });
});

describe("Ta walka kontra Sesja", () => {
  // `Aggregate`, nie `BattleStats`: helper czyta same `actors`, a wołany jest
  // i dla walki, i dla sumy sesji — a te mają teraz RÓŻNE typy.
  const dealtBy = (stats: Aggregate, name: string) =>
    stats.actors.find((a) => a.name === name)?.damageDealt ?? 0;

  /** Odtwarza doczytywanie się logu w grze: bufor rośnie linia po linii. */
  const playFight = (session: Session, lines: string[], steps: number[]) => {
    for (const upTo of steps) session.update(lines.slice(0, upTo).join("\n"));
  };

  test("kolejne walki z tym samym składem sumują się w sesji", async () => {
    // Gra czyści log między walkami, więc druga walka wraca do małego bufora.
    // Wcześniej klucz po samym składzie sklejał obie w jedną i grind przepadał.
    const lines = (await readFixture("new-engine/2026-07-18_mag-vs-druzyna-umiejetnosci")).split(
      "\n",
    );
    const session = new Session();
    const steps = [8, 20, lines.length];

    playFight(session, lines, steps);
    const jedna = dealtBy(session.current(), "wf mushita psk");
    expect(jedna).toBeGreaterThan(0);

    playFight(session, lines, steps);
    expect(dealtBy(session.current(), "wf mushita psk")).toBe(jedna);
    expect(dealtBy(session.total(), "wf mushita psk")).toBe(jedna * 2);

    playFight(session, lines, steps);
    expect(dealtBy(session.total(), "wf mushita psk")).toBe(jedna * 3);
  });

  // Zamknięte walki są od tej pory sumowane OD RAZU, a nie trzymane w tablicy
  // rosnącej przez całą sesję. Sumowanie jest łączne, więc wynik ma być ten sam
  // — i to jest jedyna rzecz, która tu naprawdę wymaga pilnowania.
  test("sumowanie po jednej walce daje to samo, co sklejenie na końcu", async () => {
    const texts = await Promise.all([
      readFixture("new-engine/2026-07-18_lowca-vs-druzyna"),
      readFixture("new-engine/2026-07-18_mag-vs-druzyna-umiejetnosci"),
      readFixture("new-engine/2026-07-18_wojownik-vs-druzyna-umiejetnosci"),
      readFixture("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp"),
    ]);

    const session = new Session();
    for (const text of texts) session.update(text);
    const total = session.total();

    // Wprost: te same walki policzone osobno i zsumowane ręcznie.
    const expected = new Map<string, number>();
    for (const text of texts) {
      for (const actor of aggregate(parse(text)).actors) {
        expected.set(actor.name, (expected.get(actor.name) ?? 0) + actor.damageDealt);
      }
    }

    expect(total.actors.length).toBe(expected.size);
    for (const actor of total.actors) {
      expect([actor.name, actor.damageDealt]).toEqual([actor.name, expected.get(actor.name)!]);
    }
  });

  test("długa sesja nie gubi ani nie dubluje liczb", async () => {
    const texts = await Promise.all([
      readFixture("new-engine/2026-07-18_lowca-vs-druzyna"),
      readFixture("new-engine/2026-07-18_mag-vs-druzyna-umiejetnosci"),
    ]);
    const jedenCykl = texts.reduce(
      (sum, text) => sum + aggregate(parse(text)).actors.reduce((n, a) => n + a.damageDealt, 0),
      0,
    );

    const session = new Session();
    for (let cycle = 0; cycle < 20; cycle += 1) for (const text of texts) session.update(text);

    const dealt = session.total().actors.reduce((n, a) => n + a.damageDealt, 0);
    expect(dealt).toBe(jedenCykl * 20);
  });

  test("reset zeruje także walki już zamknięte", async () => {
    const session = new Session();
    session.update(await readFixture("new-engine/2026-07-18_lowca-vs-druzyna"));
    session.update(await readFixture("new-engine/2026-07-18_mag-vs-druzyna-umiejetnosci"));
    expect(session.total().actors.length).toBeGreaterThan(0);

    session.reset();

    expect(session.total().actors).toEqual([]);
  });

  test("ten sam bufor wczytany dwa razy nie podwaja sesji", async () => {
    const text = await readFixture("new-engine/2026-07-18_mag-vs-druzyna-umiejetnosci");
    const session = new Session();

    session.update(text);
    session.update(text); // nic się nie zmieniło — to wciąż ta sama walka
    expect(dealtBy(session.total(), "wf mushita psk")).toBe(
      dealtBy(session.current(), "wf mushita psk"),
    );
  });

  test("sesja przeżywa podmianę kontenera logu przez grę", async () => {
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
    const first = dealtBy(session.total(), "wf mushita psk");
    expect(first).toBeGreaterThan(0);

    // Gra buduje okno walki od nowa pod następną walkę — subskrypcja leci od
    // zera, ale suma sesji ma przetrwać.
    const wojownikiem = await readFixture("new-engine/2026-07-18_wojownik-vs-druzyna-umiejetnosci");
    const stop = start(new DomLogSource(makeLog(wojownikiem)), overlay, session);

    expect(dealtBy(session.total(), "wf mushita psk")).toBe(first);
    expect(dealtBy(session.total(), "Woj Zandan Długonogi")).toBeGreaterThan(0);
    // "Ta walka" pokazuje już tylko nową.
    expect(dealtBy(session.current(), "wf mushita psk")).toBe(0);
    stop();
  });
});

describe("przypisanie kolorów", () => {
  test("kolor idzie za postacią, nie za jej pozycją w rankingu", () => {
    const colors = new ColorAssignment();
    colors.seed(["A", "B", "C"]);

    expect(colors.colorFor("B")).toBe(SERIES_COLORS[1]!);
    // Po przesortowaniu B nadal ma swój kolor.
    colors.seed(["C", "B", "A"]);
    expect(colors.colorFor("B")).toBe(SERIES_COLORS[1]!);
    expect(colors.colorFor("A")).toBe(SERIES_COLORS[0]!);
  });

  test("po wyczerpaniu palety nie generuje nowych barw", () => {
    const colors = new ColorAssignment();
    colors.seed(Array.from({ length: 12 }, (_, i) => `postać ${i}`));

    const used = new Set(
      Array.from({ length: 12 }, (_, i) => colors.colorFor(`postać ${i}`)),
    );
    expect(used.size).toBe(SERIES_COLORS.length + 1); // + kolor zbiorczy
  });

  test("pasek postaci niesie profesję", async () => {
    // Wzorzec SKADA: barwa = klasa. Ta walka ma trzy różne profesje w składzie.
    const stats = aggregate(
      parse(await readFixture("new-engine/2026-07-22_lowca-tropiciel-vs-regulus-grupowa")),
    );
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const rows = [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row")].map((row) => ({
      actor: row.dataset.actor!,
      color: row.querySelector<HTMLElement>(".bar")!.style.background,
    }));

    const asStyle = (color: string) => {
      const probe = document.createElement("div");
      probe.style.background = color;
      return probe.style.background;
    };
    const of = (name: string) => rows.find((row) => row.actor === name)!;

    expect(of("Łowcosław Kazrek").color).toBe(asStyle(PROFESSION_COLORS["h"]!));
    expect(of("wf foverek psk").color).toBe(asStyle(PROFESSION_COLORS["t"]!));
    expect(of("Regulus Mętnooki").color).toBe(asStyle(PROFESSION_COLORS["w"]!));
  });

  test("wiersz to ranking, nie tabela: numer, nazwa i jedna liczba z nawiasem", async () => {
    const stats = aggregate(
      parse(await readFixture("new-engine/2026-07-22_lowca-tropiciel-vs-regulus-grupowa")),
    );
    const overlay = new Overlay();
    overlay.render(stats, stats);

    // Trzy komórki i ani jednej więcej. Poziom i profesja NIE stoją w wierszu —
    // przy czwartej kolumnie pasek zaczyna się czytać jak wiersz tabeli, a bez
    // nagłówka kolumn i tak nie byłoby wiadomo, co która znaczy. Profesję
    // niesie barwa paska, pełną nazwę i resztę liczb — dymek.
    for (const row of overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-actor]")) {
      const cells = [...row.querySelectorAll(".row-text > *")].map((cell) => cell.className);
      expect(cells).toEqual(["rank", "label", "value"]);
    }

    const first = overlay.shadow.querySelector(".rows .row[data-actor]")!;
    expect(first.querySelector(".rank")?.textContent).toBe("1.");
    // Nawias siedzi WEWNĄTRZ liczby wiodącej, nie obok niej jako kolejna
    // kolumna — to on mówi, że procent i tempo należą do TEJ liczby.
    expect(first.querySelector(".value")?.contains(first.querySelector(".share"))).toBe(true);
    expect(first.querySelector(".share")?.textContent).toMatch(/^\(\d+% · .+\)$/);

    // Numery idą po kolei i nie gubią się przy zmianie metryki.
    const ranks = () =>
      [...overlay.shadow.querySelectorAll(".rows .row[data-actor] .rank")].map(
        (cell) => cell.textContent,
      );
    expect(ranks()).toEqual(["1.", "2.", "3."]);
    metricButton(overlay, "Otrzymane").click();
    expect(ranks()).toEqual(["1.", "2.", "3."]);
  });

  test("dwie postacie tej samej profesji mają ten sam kolor — i to jest zamierzone", async () => {
    // Trzej magowie. W SKADZIE trzech magów też ma jedną barwę: kolor odpowiada
    // na „kto tu jest czym", a od odróżniania postaci są nazwa i numer.
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_mag-dom-fuzja/log.html`,
    ).text();
    const stats = aggregate(parse(extractText(document.body)));
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const rows = [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row")];
    const colors = new Set(rows.map((row) => row.querySelector<HTMLElement>(".bar")!.style.background));
    expect(rows.length).toBe(3);
    expect(colors.size).toBe(1);
    // Nazwy nadal rozróżniają wiersze — tożsamości kolor nigdy nie niósł.
    expect(new Set(rows.map((row) => row.dataset.actor)).size).toBe(3);
  });

  test("paski umiejętności niosą rodzaj obrażeń", async () => {
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_mag-dom-fuzja/log.html`,
    ).text();
    const stats = aggregate(parse(extractText(document.body)));
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const asStyle = (color: string) => {
      const probe = document.createElement("div");
      probe.style.background = color;
      return probe.style.background;
    };
    const click = (key: string) =>
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
        .find((row) => row.dataset.actor === key || row.dataset.source === key)!
        .click();

    // Pierwszy szczebel wymienia CELE, więc barwa idzie tam za profesją.
    click("wf mushita psk");
    const target = [...overlay.shadow.querySelectorAll<HTMLElement>(".row[data-source]")].find(
      (row) => row.dataset.source === "Furu Mulu",
    )!;
    expect(target.querySelector<HTMLElement>(".bar")!.style.background).toBe(
      asStyle(PROFESSION_COLORS["m"]!),
    );

    // Dopiero po wejściu w cel etykietą jest akcja — i wtedy barwę niesie żywioł.
    click("Furu Mulu");
    const byLabel = new Map(
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row[data-source]")].map((row) => [
        row.dataset.source!,
        row.querySelector<HTMLElement>(".bar")!.style.background,
      ]),
    );
    // Obie umiejętności niosą zimno I błyskawicę w jednym ciosie, a błyskawica
    // dominuje w każdej (259/50 i 384/153) — więc obie dostają jej barwę.
    // Pasek ma jeden kolor, więc musi wybrać; podział widać niżej, w sekcji
    // TYP OBRAŻEŃ. To realna granica tego pomysłu, nie usterka.
    expect(byLabel.get("Lodowy pocisk")).toBe(asStyle(TYPE_COLORS["błyskawica"]!));
    expect(byLabel.get("Porażenie")).toBe(asStyle(TYPE_COLORS["błyskawica"]!));
  });

  test("zwykły cios i trucizna dostają w rozbiciu różne barwy", async () => {
    // Przypadek, w którym kolor typu zarabia na siebie: dziś oba wiersze
    // wyglądają identycznie, choć to zupełnie różne źródła obrażeń.
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_lowca-dom-trucizna/log.html`,
    ).text();
    const stats = aggregate(parse(extractText(document.body)));
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const asStyle = (color: string) => {
      const probe = document.createElement("div");
      probe.style.background = color;
      return probe.style.background;
    };
    const click = (key: string) =>
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
        .find((row) => row.dataset.actor === key || row.dataset.source === key)!
        .click();

    click("Łowcożyr Kazrek");
    click("Locha");

    const byLabel = new Map(
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row[data-source]")].map((row) => [
        row.dataset.source!,
        row.querySelector<HTMLElement>(".bar")!.style.background,
      ]),
    );
    expect(byLabel.get("Zwykły atak")).toBe(asStyle(TYPE_COLORS["broń"]!));
    expect(byLabel.get("od trucizny")).toBe(asStyle(TYPE_COLORS["trucizna"]!));
  });

  test("trucizna odróżnia się barwą od zwykłego ciosu", async () => {
    // Tu kolor robi najwięcej roboty: dziś oba wiersze wyglądają identycznie.
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_lowca-dom-trucizna/log.html`,
    ).text();
    const stats = aggregate(parse(extractText(document.body)));
    const lowca = stats.actors.find((a) => a.name === "Łowcożyr Kazrek")!;

    const types = new Map(lowca.typeByLabel.map((t) => [t.label, t.type]));
    expect(types.get("Zwykły atak")).toBe("broń");
    expect(types.get("od trucizny")).toBe("trucizna");
  });

  test("kolor nie zależy od liczby walk w sesji", () => {
    // Dawniej barwa szła ze wspólnej puli ośmiu slotów, więc od trzeciej walki
    // wiersze robiły się szare. Barwa z atrybutu nie ma czego wyczerpać.
    const overlay = new Overlay();
    const line = (enemy: string, code: string) =>
      aggregate(parse(`Rozpoczęła się walka pomiędzy Gracz (1m) a ${enemy} (1${code})`));

    const seen: string[] = [];
    for (const [enemy, code] of [["A", "w"], ["B", "p"], ["C", "t"], ["D", "h"], ["E", "b"]]) {
      const stats = line(enemy!, code!);
      overlay.render(stats, stats);
      const row = [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row")].find(
        (candidate) => candidate.dataset.actor === enemy,
      )!;
      seen.push(row.querySelector<HTMLElement>(".bar")!.style.background);
    }

    // Pięć profesji, pięć różnych barw — także w piątej walce z rzędu.
    expect(new Set(seen).size).toBe(5);
  });
});

describe("overlay", () => {
  const statsFrom = async (name: string) => aggregate(parse(await readFixture(name)));

  test("renderuje wiersze posortowane malejąco po obrażeniach", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const labels = [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);
    // Żadna Locha nic nie zadała, ale obie stoją w składzie i log je rozdziela
    // (spadały osobnymi ciągami HP), więc wiszą na końcu rankingu jako dwa
    // wiersze. Gwiazdka: numeracja jest nasza, wywnioskowana ze spadku życia.
    expect(labels).toEqual(["Łowcożyr Kazrek", "Odyniec", "Locha #1 *", "Locha #2 *"]);
  });

  test("pokazuje cały skład od linii otwierającej, zanim ktokolwiek zadziała", () => {
    const stats = aggregate(
      parse(
        "[b]Rozpoczęła się walka pomiędzy Łowca głów z psk (104h) a Wieczornica (93p), Południca (92p)[/b]",
      ),
    );
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const labels = [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);
    // Na samych zerach o kolejności decyduje alfabet (Ł przed P).
    expect(labels).toEqual(["Łowca głów z psk", "Południca", "Wieczornica"]);
    // Sam wiersz to za mało: zero musi być widoczne jako zero, nie jako pustka.
    expect(overlay.shadow.querySelector(".value")?.textContent).toContain("0");
  });

  test("przełącznik metryki pokazuje obrażenia przyjęte", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-paladyni");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const taken = [...overlay.shadow.querySelectorAll("button")].find(
      (b) => b.textContent === "Otrzymane",
    )!;
    taken.click();

    const labels = [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);
    // Obrywał tylko on, ale reszta składu zostaje widoczna na zerach.
    expect(labels).toEqual(["Łowca głów z psk", "Południca", "Wieczornica *"]);
  });

  test("oznacza gwiazdką postacie o zduplikowanej nazwie", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-paladyni");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const labels = [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);
    expect(labels).toContain("Wieczornica *");
  });

  test("ostrzega o nierozpoznanych liniach", () => {
    const overlay = new Overlay();
    const stats = aggregate(parse("zupełnie nowa linia\ninna nowa linia"));
    overlay.render(stats, stats);

    expect(overlay.shadow.querySelector(".warn")?.textContent).toContain("2 nierozpoznanych linii");
  });

  test("pokazuje komunikat, gdy nie ma danych", () => {
    const overlay = new Overlay();
    const empty = aggregate([]);
    overlay.render(empty, empty);

    expect(overlay.shadow.querySelector(".empty")?.textContent).toContain("czekam na walkę");
  });

  test("szerokość paska jest proporcjonalna do największej wartości", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const widths = [...overlay.shadow.querySelectorAll(".bar")].map(
      (el) => (el as HTMLElement).style.width,
    );
    expect(widths[0]).toBe("100%");
    // 2897 = 2617 z ciosów + 280 trucizny przypisanej po stronie konfliktu.
    expect(parseFloat(widths[1]!)).toBeCloseTo((89 / 2897) * 100, 5);
  });

  test("wejście w postać przeżywa przebudowę wiersza między wciśnięciem a puszczeniem", async () => {
    // Podczas odtwarzania panel przebudowuje wiersze co klatkę. `click` gubi się
    // wtedy między pointerdown a pointerup (albo pada na trwały panel-body, gdzie
    // nie ma już `.row`). Drążenie jedzie więc na pointerup, dopasowane po nazwie
    // postaci — świeży węzeł tej samej postaci ma zadziałać tak samo.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const first = overlay.shadow.querySelector<HTMLElement>(".rows .row[data-actor]")!;
    const name = first.dataset.actor!;
    first.dispatchEvent(new Event("pointerdown", { bubbles: true }));

    // Klatka odtwarzania: te same dane, ale wiersze to już inne węzły.
    overlay.render(stats, stats);
    const fresh = [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-actor]")].find(
      (row) => row.dataset.actor === name,
    )!;
    expect(fresh).not.toBe(first);
    fresh.dispatchEvent(new Event("pointerup", { bubbles: true }));

    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe(name);
  });

  test("puszczenie nad innym wierszem niż wciśnięcie nie drąży", async () => {
    // Ranking potrafi się przestawić w trakcie odtwarzania — puszczenie nad kimś
    // innym, niż się wcisnęło, nie może wejść w cudzą postać.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const list = [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-actor]")];
    list[0]!.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    list[1]!.dispatchEvent(new Event("pointerup", { bubbles: true }));

    expect(overlay.shadow.querySelector(".crumb-name")).toBeNull();
  });

  test("dymek pokazuje rozbicie zadanych obrażeń na źródła", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const tip = overlay.shadow.querySelector<HTMLElement>(".tip")!;
    expect(tip.hidden).toBe(true);

    const row = overlay.shadow.querySelector(".row")!; // Kazrek — najwięcej zadał
    row.dispatchEvent(new Event("pointerover", { bubbles: true }));

    expect(tip.hidden).toBe(false);
    expect(tip.querySelector(".tip-title")?.textContent).toBe("Tancogniew Kazrek");
    // Suma aktywnej metryki stoi w "Ogólne", nie w tytule — jedna liczba, raz.
    expect(tip.querySelector(".tip-stat.is-active .tip-stat-value")?.textContent).toBe(
      number.format(10366),
    );

    // Dymek jest SKRÓTEM — rozbicie ("czym zadane") siedzi o szczebel niżej,
    // pod lewym przyciskiem, i sprawdza je test wejścia w postać.
    expect(tip.querySelector(".tip-row")).toBeNull();
    expect(tip.querySelector(".tip-hint")?.textContent).toContain("LPM");

    row.dispatchEvent(new Event("pointerout", { bubbles: true }));
    expect(tip.hidden).toBe(true);
  });

  test("wiersz napastnika ma dymek z pełną nazwą i liczbami", async () => {
    // W 260px długa nazwa ucina się wielokropkiem, a to ona niesie odpowiedź
    // „od kogo”. Dymek jest jedynym miejscem, gdzie widać ją w całości.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    [...overlay.shadow.querySelectorAll("button")]
      .find((b) => b.textContent === "Otrzymane")!
      .click();
    overlay.shadow.querySelector<HTMLElement>(".rows .row[data-actor]")!.click();

    const row = overlay.shadow.querySelector<HTMLElement>(".rows .row[data-source]")!;
    row.dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector<HTMLElement>(".tip")!;
    expect(tip.hidden).toBe(false);
    // Pierwszy szczebel przyjętych to sam napastnik — czym uderzał, widać
    // dopiero po wejściu w niego.
    expect(tip.querySelector(".tip-title")?.textContent).toBe("Łowcożyr Kazrek");
    const stat = (label: string) =>
      [...tip.querySelectorAll(".tip-stat")]
        .find((el) => el.querySelector(".tip-stat-label")?.textContent === label)
        ?.querySelector(".tip-stat-value")?.textContent;
    expect(stat("Otrzymane")).toBe(number.format(1143));
    expect(stat("Udział")).toBe("100%");
    expect(stat("Ciosy")).toBe("3");
    // Dymek mówi też, w czyich statystykach stoimy.
    expect(tip.querySelector(".tip-hint")?.textContent).toContain("Odyniec");

    row.dispatchEvent(new Event("pointerout", { bubbles: true }));
    expect(tip.hidden).toBe(true);
  });

  test("przyjęte drążą się w trzech szczeblach: skład → napastnik → czym", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    [...overlay.shadow.querySelectorAll("button")]
      .find((b) => b.textContent === "Otrzymane")!
      .click();

    const heading = () =>
      overlay.shadow.querySelector(".rows .side-head")?.firstElementChild?.textContent;
    const labels = () =>
      [...overlay.shadow.querySelectorAll('.rows .row[data-list="sources"] .label')].map(
        (el) => el.textContent,
      );

    // Szczebel 1 → 2: wchodzimy w postać, dostajemy samych napastników.
    overlay.shadow.querySelector<HTMLElement>(".rows .row[data-actor]")!.click();
    expect(heading()).toBe("OD KOGO");
    const attacker = labels()[0]!;
    expect(attacker).not.toContain("·");

    // Szczebel 2 → 3: wchodzimy w napastnika, dostajemy jego umiejętności
    // w rankingu po obrażeniach.
    [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-list="sources"]')]
      .find((row) => row.dataset.source === attacker)!
      .click();
    expect(heading()).toBe(`CZYM — ${attacker.toUpperCase()}`);
    expect(labels().length).toBeGreaterThan(0);
    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe(attacker);
    expect(overlay.shadow.querySelector(".crumb-back")?.textContent).toContain("Odyniec");

    // Prawy przycisk zdejmuje JEDEN szczebel, nie cały stos.
    overlay.shadow.dispatchEvent(new Event("contextmenu", { bubbles: true }));
    expect(heading()).toBe("OD KOGO");
    overlay.shadow.dispatchEvent(new Event("contextmenu", { bubbles: true }));
    expect(overlay.shadow.querySelector(".rows .row[data-actor]")).not.toBeNull();
  });

  test("trucizna bez sprawcy schodzi do postaci, w którą weszliśmy", async () => {
    // Cała reszta panelu mówi wtedy o jednej postaci, więc przypis mówiący
    // o całej stronie czytałby się jak jej liczba.
    // Żaden fixture nie ma DoT bez sprawcy — w korpusie po drugiej stronie
    // stoi zawsze jeden przeciwnik, więc trucizna ma komu przypaść. Tu trzeba
    // otoczenia: przy trzech wrogach nie wiadomo, który zatruł.
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Gracz (1w) a A (1w), B (1w), C (1w)",
          "Gracz(90%) uderzył z siłą  +100",
          "A(50%) otrzymał(a)  -100  obrażeń",
          "A(100%) uderzył(a) z siłą  +40",
          "Gracz(90%) otrzymał  -40  obrażeń",
          "Gracz(80%): 100 obrażeń od trucizny.",
        ].join("\n"),
      ),
    );
    const poisoned = stats.actors.filter((a) => a.unattributedDotTaken > 0);
    expect(poisoned.length).toBeGreaterThan(0);

    const overlay = new Overlay();
    overlay.render(stats, stats);
    const note = () =>
      [...overlay.shadow.querySelectorAll("footer .note")]
        .map((el) => el.textContent ?? "")
        .find((text) => text.startsWith("Trucizna bez sprawcy"));

    const whole = totalUnattributedDot(stats.unattributedDotDamage);
    expect(note()).toContain(number.format(whole));

    const victim = poisoned[0]!;
    [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-actor]")]
      .find((row) => row.dataset.actor === victim.name)!
      .click();
    expect(note()).toBe(`Trucizna bez sprawcy: ${number.format(victim.unattributedDotTaken)}`);

    // Powrót do składu przywraca liczbę całej walki.
    overlay.shadow.dispatchEvent(new Event("contextmenu", { bubbles: true }));
    expect(note()).toContain(number.format(whole));
  });

  test("sumy napastnika zgadzają się z sumą tego, czym uderzał", async () => {
    // Drążenie nie może zgubić ani dodać obrażeń: szczebel wyżej to dokładnie
    // suma szczebla niżej, a wszyscy napastnicy razem to `damageTaken`.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    for (const actor of stats.actors) {
      const fromAll = actor.takenFromBy.reduce((sum, one) => sum + one.amount, 0);
      expect([actor.name, fromAll]).toEqual([actor.name, actor.damageTaken]);
      for (const attacker of actor.takenFromBy) {
        const byAll = attacker.by.reduce((sum, one) => sum + one.amount, 0);
        expect([attacker.label, byAll]).toEqual([attacker.label, attacker.amount]);
      }
    }
  });

  test("dymek pozycji zadanej stawia użycia obok ciosów", async () => {
    // Bez "Użycia" samo "Ciosy 6" przy "Podwójnym strzale" czytało się jak
    // sześć odpaleń umiejętności, a odpaleń były trzy.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    // Skład → postać → jej cel: umiejętności stoją dopiero o szczebel niżej,
    // bo widok postaci pokazuje najpierw KOMU zadała.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-actor]")]
      .find((row) => row.dataset.actor === "Łowcosław Kazrek")!
      .click();
    [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-source][data-list="sources"]')]
      .find((row) => row.dataset.source === "wf foverek psk")!
      .click();

    [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-source]")]
      .find((row) => row.dataset.source === "Podwójny strzał")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector<HTMLElement>(".tip")!;
    const stat = (label: string) =>
      [...tip.querySelectorAll(".tip-stat")]
        .find((el) => el.querySelector(".tip-stat-label")?.textContent === label)
        ?.querySelector(".tip-stat-value")?.textContent;
    expect(stat("Ciosy")).toBe("6");
    expect(stat("Użycia")).toBe("3");
  });

  test("przekrój po żywiole nie ma licznika ciosów", async () => {
    // Jeden cios maga niesie zimno I błyskawicę, więc licznik per żywioł
    // sumowałby się do wielokrotności ciosów postaci — trzy uderzenia czytało
    // się jako sześć. Ta sekcja odpowiada wyłącznie na "ile obrażeń czym".
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_mag-dom/log.html`,
    ).text();
    const stats = aggregate(parse(extractText(document.body)));
    const overlay = new Overlay();
    overlay.render(stats, stats);
    // Postać → jej cel: żywioł i umiejętności widać dopiero w rozbiciu na cel.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-actor]")]
      .find((row) => row.dataset.actor === "wf mushita psk")!
      .click();
    [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-source][data-list="sources"]')]
      .find((row) => row.dataset.source === "Furu Mulu")!
      .click();

    const counters = (list: string) =>
      [...overlay.shadow.querySelectorAll<HTMLElement>(`.rows .row[data-list="${list}"]`)]
        .map((row) => row.querySelector(".avg")?.textContent ?? null);

    // Bez licznika znaczy BEZ komórki — wiersz nie trzyma pustego miejsca po
    // liczbie, której w tym przekroju nie ma.
    expect(counters("types")).toEqual([null, null]);
    // Umiejętności licznik zachowują — tam znaczy "ile razy odpalone".
    expect(counters("sources")).toEqual(["×1", "×1"]);
  });

  test("licznik podaje użycia, a ciosy dokłada tylko przy rozjeździe", async () => {
    // "Podwójny strzał" to jedno użycie i dwa ciosy — wtedy obie liczby stoją.
    // Przy 13 z 17 etykiet w korpusie są równe i wtedy druga jest szumem.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    // Umiejętności stoją w rozbiciu na cel — wchodzimy w postać, potem w jej cel.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-actor]")]
      .find((row) => row.dataset.actor === "Łowcosław Kazrek")!
      .click();
    [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-source][data-list="sources"]')]
      .find((row) => row.dataset.source === "wf foverek psk")!
      .click();

    const counter = (label: string) =>
      [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-list="sources"]')]
        .find((row) => row.dataset.source === label)
        ?.querySelector(".avg")?.textContent;

    expect(counter("Podwójny strzał")).toBe("×3 · 6 c.");
    expect(counter("Błyskawiczny strzał")).toBe("×1");
  });

  test("dymek pozycji otrzymanej nie pokazuje użyć", async () => {
    // Po tej stronie etykieta znaczy "czyjś cios we mnie", a jedno użycie
    // umiejętności potrafi trafić kilka celów — liczba nie rozkłada się na nie.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    [...overlay.shadow.querySelectorAll("button")]
      .find((b) => b.textContent === "Otrzymane")!
      .click();
    overlay.shadow.querySelector<HTMLElement>(".rows .row[data-actor]")!.click();
    overlay.shadow
      .querySelector<HTMLElement>(".rows .row[data-source]")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector<HTMLElement>(".tip")!;
    const labels = [...tip.querySelectorAll(".tip-stat-label")].map((el) => el.textContent);
    expect(labels).toContain("Ciosy");
    expect(labels).not.toContain("Użycia");
  });

  test("dymek trafia we właściwy przekrój, gdy nazwa stoi w obu", async () => {
    // "od trucizny" pojawia się i w rozbiciu na pozycje, i w typie obrażeń.
    // Bez rozróżnienia list dymek pokazywałby liczby z sąsiedniej sekcji.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    overlay.shadow.querySelector<HTMLElement>(".rows .row[data-actor]")!.click();
    // "od trucizny" jako źródło stoi dopiero w rozbiciu na cel; wchodzimy w cel,
    // który dostał truciznę. W przekroju po typie (żywioł) figuruje niezależnie.
    [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-source][data-list="sources"]')]
      .find((row) => row.dataset.source === "Locha #2")!
      .click();

    const poison = [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-source]")].filter(
      (row) => row.dataset.source === "od trucizny",
    );
    expect(poison.map((row) => row.dataset.list)).toEqual(["sources", "types"]);

    const tip = overlay.shadow.querySelector<HTMLElement>(".tip")!;
    for (const row of poison) {
      row.dispatchEvent(new Event("pointerover", { bubbles: true }));
      expect(tip.querySelector(".tip-title")?.textContent).toBe("od trucizny");
      expect(tip.hidden).toBe(false);
    }
  });

  test("lewy przycisk drąży: skład → cele postaci → czym w cel", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    overlay.shadow.querySelector<HTMLElement>(".row")!.click(); // Kazrek — najwięcej zadał

    // Pierwszy szczebel postaci to KOMU zadała, nie czym — czym jest o poziom niżej.
    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe("Tancogniew Kazrek");
    const targets = [...overlay.shadow.querySelectorAll(".rows .row")].map((el) => [
      el.querySelector(".label")?.textContent,
      valueOf(el),
      shareOf(el),
    ]);
    expect(targets).toEqual([
      ["wf agar psk", number.format(10366), "100%"],
      // Drugie wejście w to samo drążenie: te same obrażenia widziane od strony
      // umiejętności, zsumowane po wszystkich celach.
      ["Zwykły atak", number.format(10036), "97%"],
      ["od trucizny", number.format(330), "3%"],
      // Przekrój po żywiole dotyczy całości obrażeń postaci — stoi na każdym szczeblu.
      ["bez żywiołu", number.format(10036), "97%"],
      ["od trucizny", number.format(330), "3%"],
    ]);
    expect([...overlay.shadow.querySelectorAll(".rows .side-head")].map((el) =>
      el.firstElementChild?.textContent,
    )).toEqual(["KOMU", "CZYM (ŁĄCZNIE)", "TYP OBRAŻEŃ"]);

    // Wejście w cel odsłania, czym w niego uderzano — ranking celów ustępuje
    // rankingowi umiejętności użytych na tym jednym celu.
    [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-source][data-list="sources"]')]
      .find((row) => row.dataset.source === "wf agar psk")!
      .click();
    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe("wf agar psk");
    const breakdown = [...overlay.shadow.querySelectorAll(".rows .row")].map((el) => [
      el.querySelector(".label")?.textContent,
      valueOf(el),
      shareOf(el),
    ]);
    expect(breakdown).toEqual([
      ["Zwykły atak", number.format(10036), "97%"],
      ["od trucizny", number.format(330), "3%"],
      ["bez żywiołu", number.format(10036), "97%"],
      ["od trucizny", number.format(330), "3%"],
    ]);
    expect([...overlay.shadow.querySelectorAll(".rows .side-head")].map((el) =>
      el.firstElementChild?.textContent,
    )).toEqual(["CZYM — WF AGAR PSK", "TYP OBRAŻEŃ"]);

    // Wiersze rozbicia to nie postacie — nie prowadzą głębiej i nie mają dymka.
    expect(overlay.shadow.querySelector(".rows .row[data-actor]")).toBeNull();

    // Prawy przycisk zdejmuje po jednym szczeblu: cel → cele → skład.
    overlay.shadow.dispatchEvent(new Event("contextmenu", { bubbles: true }));
    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe("Tancogniew Kazrek");
    overlay.shadow.dispatchEvent(new Event("contextmenu", { bubbles: true }));
    expect(overlay.shadow.querySelector(".crumb")).toBeNull();
    expect(overlay.shadow.querySelector(".rows .row[data-actor]")).not.toBeNull();
  });

  // Drugie wejście w to samo drążenie, od strony umiejętności. Odpowiada na
  // pytanie, którego lista celów nie umie zadać: "która akcja robi robotę",
  // bez względu na to, w kogo poszła.
  describe("drążenie przez umiejętność", () => {
    const GRUPOWA = "new-engine/2026-07-22_lowca-tropiciel-vs-regulus-grupowa";

    const headings = (overlay: Overlay) =>
      [...overlay.shadow.querySelectorAll(".rows .side-head")].map(
        (el) => el.firstElementChild?.textContent,
      );
    const rowsOf = (overlay: Overlay, list: string) =>
      [...overlay.shadow.querySelectorAll<HTMLElement>(`.rows .row[data-list="${list}"]`)];

    /** Wchodzi w postać, która biła kilka celów kilkoma umiejętnościami. */
    const enterRegulus = async () => {
      const stats = await statsFrom(GRUPOWA);
      const overlay = new Overlay();
      overlay.render(stats, stats);
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
        .find((row) => row.dataset.actor === "Regulus Mętnooki")!
        .click();
      return overlay;
    };

    test("sekcja sumuje umiejętność po WSZYSTKICH celach", async () => {
      const overlay = await enterRegulus();

      expect(headings(overlay)).toEqual(["KOMU", "CZYM (ŁĄCZNIE)"]);
      // Uderzenie Króla Węży poszło w dwa cele (9596 + 5072) i dopiero ta
      // sekcja pokazuje sumę — z listy celów trzeba by ją złożyć w głowie.
      const abilities = rowsOf(overlay, "abilities").map((row) => [
        row.querySelector(".label")?.textContent,
        valueOf(row),
      ]);
      expect(abilities[0]).toEqual(["Uderzenie Króla Węży", number.format(14668)]);
      expect(abilities.map(([label]) => label)).toEqual([
        "Uderzenie Króla Węży",
        "Zwykły atak",
        "Rozbryzg treści żołądkowej",
        "Plugawa inkantacja",
        "Ponowne rozgrzanie",
      ]);
    });

    test("klik w umiejętność schodzi do celów, PPM wraca", async () => {
      const overlay = await enterRegulus();

      rowsOf(overlay, "abilities")
        .find((row) => row.dataset.source === "Uderzenie Króla Węży")!
        .click();

      // Lustro "CZYM — <CEL>": ta sama mechanika, przeciwna strona ciosu.
      expect(headings(overlay)).toEqual(["KOMU — UDERZENIE KRÓLA WĘŻY"]);
      expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe(
        "Uderzenie Króla Węży",
      );
      expect(
        rowsOf(overlay, "abilities").map((row) => [
          row.querySelector(".label")?.textContent,
          valueOf(row),
        ]),
      ).toEqual([
        ["Łowcosław Kazrek", number.format(9596)],
        ["wf foverek psk", number.format(5072)],
      ]);

      overlay.shadow.dispatchEvent(new Event("contextmenu", { bubbles: true }));
      expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe("Regulus Mętnooki");
      expect(headings(overlay)).toEqual(["KOMU", "CZYM (ŁĄCZNIE)"]);
    });

    test("obie drogi prowadzą do tej samej liczby", async () => {
      const overlay = await enterRegulus();

      // Przez cel: Łowcosław → Uderzenie Króla Węży.
      rowsOf(overlay, "sources")
        .find((row) => row.dataset.source === "Łowcosław Kazrek")!
        .click();
      const throughTarget = valueOf(
        rowsOf(overlay, "sources").find(
          (row) => row.dataset.source === "Uderzenie Króla Węży",
        ),
      );

      overlay.shadow.dispatchEvent(new Event("contextmenu", { bubbles: true }));

      // Przez umiejętność: Uderzenie Króla Węży → Łowcosław.
      rowsOf(overlay, "abilities")
        .find((row) => row.dataset.source === "Uderzenie Króla Węży")!
        .click();
      const throughAbility = valueOf(
        rowsOf(overlay, "abilities").find((row) => row.dataset.source === "Łowcosław Kazrek"),
      );

      expect(throughAbility).toBe(throughTarget);
    });

    test("sekcja znika na drugim szczeblu — jesteśmy już w środku drążenia", async () => {
      const overlay = await enterRegulus();
      rowsOf(overlay, "sources")
        .find((row) => row.dataset.source === "Łowcosław Kazrek")!
        .click();

      expect(headings(overlay)).toEqual(["CZYM — ŁOWCOSŁAW KAZREK"]);
      expect(rowsOf(overlay, "abilities")).toHaveLength(0);
    });

    test("przy jednej umiejętności sekcja jest powtórzeniem sumy — nie ma jej", async () => {
      const stats = await statsFrom("new-engine/2026-07-18_tropiciel-vs-kukla");
      const overlay = new Overlay();
      overlay.render(stats, stats);
      overlay.shadow.querySelector<HTMLElement>(".row")!.click();

      expect(headings(overlay)).not.toContain("CZYM (ŁĄCZNIE)");
    });

    test("leczenie nie dostaje sekcji — jego źródłem jest efekt, nie postać", async () => {
      const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-tropiciel-umiejetnosci");
      const overlay = new Overlay();
      overlay.render(stats, stats);
      overlay.shadow.querySelector<HTMLElement>('[data-action="metric-healingReceived"]')!.click();
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
        .find((row) => row.dataset.actor === "wf foverek psk")!
        .click();

      expect(headings(overlay)).not.toContain("CZYM (ŁĄCZNIE)");
      expect(rowsOf(overlay, "abilities")).toHaveLength(0);
    });

    // Barwa idzie za TREŚCIĄ listy, nie za jej głębokością — a ta droga
    // odwraca kolejność szczebli względem drążenia przez cel.
    test("kolory odwracają się razem ze szczeblami", async () => {
      const overlay = await enterRegulus();

      const colorOf = (row: HTMLElement | undefined) =>
        row?.querySelector<HTMLElement>(".bar")?.style.background;
      const targetColor = colorOf(rowsOf(overlay, "sources")[0]);
      const abilityColor = colorOf(rowsOf(overlay, "abilities")[0]);
      expect(targetColor).not.toBe(abilityColor);

      // Po zejściu w umiejętność pierwszy szczebel wymienia POSTACIE, więc
      // wraca barwa profesji — ta sama co na liście celów wyżej.
      rowsOf(overlay, "abilities")
        .find((row) => row.dataset.source === "Uderzenie Króla Węży")!
        .click();
      expect(
        colorOf(rowsOf(overlay, "abilities").find((row) => row.dataset.source === "Łowcosław Kazrek")),
      ).toBe(targetColor);
    });

    test("zmiana metryki zdejmuje szczebel wszedłszy przez umiejętność", async () => {
      const overlay = await enterRegulus();
      rowsOf(overlay, "abilities")
        .find((row) => row.dataset.source === "Uderzenie Króla Węży")!
        .click();

      overlay.shadow.querySelector<HTMLElement>('[data-action="metric-damageTaken"]')!.click();
      expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe("Regulus Mętnooki");
      expect(headings(overlay)[0]).toBe("OD KOGO");
    });

    // Lustro po stronie przyjętych: "czym mnie bito", bez względu na to, kto.
    test("przyjęte dostają tę samą sekcję", async () => {
      const overlay = await enterRegulus();
      overlay.shadow.querySelector<HTMLElement>('[data-action="metric-damageTaken"]')!.click();

      expect(headings(overlay)).toEqual(["OD KOGO", "CZYM (ŁĄCZNIE)", "TYP OBRAŻEŃ"]);
      rowsOf(overlay, "abilities")
        .find((row) => row.dataset.source === "Podwójny strzał")!
        .click();
      expect(headings(overlay)[0]).toBe("OD KOGO — PODWÓJNY STRZAŁ");
    });

    // Trucizna bez sprawcy stoi na obu szczeblach pod tą samą nazwą, więc
    // wejście w nią pokazałoby wiersz powtarzający sam siebie.
    test("pozycja wskazująca na samą siebie nie kusi kliknięciem", async () => {
      const overlay = await enterRegulus();
      overlay.shadow.querySelector<HTMLElement>('[data-action="metric-damageTaken"]')!.click();

      const poison = rowsOf(overlay, "abilities").find(
        (row) => row.dataset.source === "od trucizny",
      )!;
      expect(poison.dataset.leaf).toBe("");

      poison.click();
      // Widok stoi tam, gdzie stał — klik nie zszedł o szczebel.
      expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe("Regulus Mętnooki");
    });
  });

  test("wejście w postać trzyma się jej mimo przebudowy panelu", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    overlay.shadow.querySelector<HTMLElement>(".row")!.click();

    // Kolejna porcja logu przebudowuje panel — widok ma zostać tam, gdzie był.
    overlay.render(stats, stats);
    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe("Tancogniew Kazrek");
  });

  test("dymek wymienia nazwy efektów wraz z liczbą wystąpień", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-kukla");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    overlay.shadow.querySelector(".row")!.dispatchEvent(new Event("pointerover", { bubbles: true }));

    const effects = [...overlay.shadow.querySelectorAll(".tip-section")].find(
      (el) => el.querySelector(".tip-heading")?.textContent === "Efekty w ciosach",
    )!;
    const rows = [...effects.querySelectorAll(".tip-stat")].map((row) => [
      row.querySelector(".tip-stat-label")?.textContent,
      row.querySelector(".tip-stat-value")?.textContent,
    ]);
    expect(rows).toEqual([
      ["Dotyk anioła", "×1"],
      ["Klątwa", "×1"],
    ]);
  });

  test("efekty widać przy każdej metryce, nie tylko przy zadanych", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-kukla");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const headings = () =>
      [...overlay.shadow.querySelectorAll(".tip-heading")].map((el) => el.textContent);

    for (const metric of ["Zadane", "Otrzymane"]) {
      [...overlay.shadow.querySelectorAll("button")]
        .find((b) => b.textContent === metric)!
        .click();
      // Najeżdżamy na TĘ SAMĄ postać, nie na pierwszy wiersz — ranking się
      // przestawia i przy "Otrzymane" na górze stoi już kto inny.
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
        .find((row) => row.dataset.actor === "Magister Kazrek")!
        .dispatchEvent(new Event("pointerover", { bubbles: true }));
      expect(headings()).toContain("Efekty w ciosach");
    }
  });

  test("wymienia wszystkie efekty, bez ucinania listy", async () => {
    // Ta walka ma ich więcej niż dawny limit czterech pozycji.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    overlay.shadow.querySelector(".row")!.dispatchEvent(new Event("pointerover", { bubbles: true }));

    const actor = stats.actors.find(
      (a) => a.name === overlay.shadow.querySelector<HTMLElement>(".row")!.dataset.actor,
    )!;
    const effects = [...overlay.shadow.querySelectorAll(".tip-section")].find(
      (el) => el.querySelector(".tip-heading")?.textContent === "Efekty w ciosach",
    )!;

    expect(actor.procs.length).toBeGreaterThan(2);
    expect(effects.querySelectorAll(".tip-stat")).toHaveLength(actor.procs.length);
    expect(effects.textContent).not.toContain("inne");
  });

  test("absorpcja celu nie jest liczona jako efekt napastnika", async () => {
    // "-Absorpcja 261 obrażeń fizycznych" to tarcza CELU. Pod napastnikiem
    // byłaby nie tą postacią, a jej wartość i tak siedzi w damageAbsorbed.
    const events = parse(
      [
        "Rozpoczęła się walka pomiędzy Gracz (1w) a Cel (1w)",
        "Gracz(100%) uderzył z siłą  +500",
        "-Absorpcja 261 obrażeń fizycznych",
        "Cel(50%) otrzymał(a)  -239  obrażeń",
      ].join("\n"),
    );

    const stats = aggregate(events);
    expect(stats.actors.find((a) => a.name === "Gracz")!.procs).toEqual([]);
    expect(stats.actors.find((a) => a.name === "Cel")!.damageAbsorbed).toBe(500 - 239);
  });

  test("dymek dla przyjętych obrażeń rozbija je na sprawców", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    [...overlay.shadow.querySelectorAll("button")]
      .find((b) => b.textContent === "Otrzymane")!
      .click();
    // Lista jest pogrupowana stronami, więc pierwszy wiersz to lider MOJEJ
    // drużyny — najmocniej obrywającego bierzemy po nazwie.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "wf agar psk")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector(".tip")!;
    expect(tip.querySelector(".tip-title")?.textContent).toBe("wf agar psk");
    expect(tip.querySelector(".tip-stat.is-active .tip-stat-label")?.textContent).toBe("Otrzymane");

    // Rozbicie na sprawców jest o szczebel niżej i trzyma się wybranej metryki:
    // wchodzimy w postać przy "Otrzymane", więc dostajemy samych napastników.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "wf agar psk")!
      .click();

    expect(overlay.shadow.querySelector(".rows .side-head")?.firstElementChild?.textContent).toBe(
      "OD KOGO",
    );
    const labels = [...overlay.shadow.querySelectorAll(".rows .row .label")].map(
      (el) => el.textContent,
    );
    expect(labels).toEqual([
      "Tancogniew Kazrek",
      // Te same obrażenia od strony umiejętności — bez względu na napastnika.
      "Zwykły atak",
      "od trucizny",
      // I ten sam worek w trzecim przekroju, po żywiole.
      "bez żywiołu",
      "od trucizny",
    ]);

    // Szczebel niżej: czym ten napastnik uderzał, w rankingu po obrażeniach.
    [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-list="sources"]')]
      .find((row) => row.dataset.source === "Tancogniew Kazrek")!
      .click();
    expect(
      [...overlay.shadow.querySelectorAll('.rows .row[data-list="sources"] .label')].map(
        (el) => el.textContent,
      ),
    ).toEqual(["Zwykły atak", "od trucizny"]);
  });

  test("dymek przeżywa przebudowę panelu pod nieruchomym kursorem", async () => {
    // W grze log mutuje przy każdej akcji, więc wiersz pod kursorem jest
    // podmieniany — bez tego dymek znikałby i nie wracał aż do ruchu myszą.
    const events = parse(await readFixture("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp"));
    const overlay = new Overlay();
    overlay.render(aggregate(events), aggregate(events));

    overlay.shadow.querySelector(".row")!.dispatchEvent(new Event("pointerover", { bubbles: true }));
    const tip = overlay.shadow.querySelector<HTMLElement>(".tip")!;
    expect(tip.hidden).toBe(false);

    // Dochodzi kolejny cios i panel jest budowany od nowa.
    const more = parse(
      "Tancogniew Kazrek(50%) uderzył z siłą  +900\nwf agar psk(10%) otrzymał  -900  obrażeń",
    );
    const grown = aggregate([...events, ...more]);
    overlay.render(grown, grown);

    expect(tip.hidden).toBe(false);
    expect(tip.querySelector(".tip-title")?.textContent).toBe("Tancogniew Kazrek");
    // Dymek ma przeliczyć się razem z panelem — sprawdzamy po liczbie, bo to
    // ona rośnie, a tytuł jest teraz stały.
    expect(tip.querySelector(".tip-stat.is-active .tip-stat-value")?.textContent).toBe(
      number.format(10366 + 900),
    );
  });

  test("dymek znika, gdy postać wypada z rankingu", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    overlay.shadow.querySelector(".row")!.dispatchEvent(new Event("pointerover", { bubbles: true }));
    const empty = aggregate([]);
    overlay.render(empty, empty);

    expect(overlay.shadow.querySelector<HTMLElement>(".tip")!.hidden).toBe(true);
  });

  test("zapamiętuje pozycję i zwinięcie", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };

    const overlay = new Overlay({ storage });
    const empty = aggregate([]);
    overlay.render(empty, empty);
    overlay.shadow
      .querySelector<HTMLButtonElement>('header button[data-action="collapse"]')!
      .click();

    expect(JSON.parse(store.get("margometer.panel")!).collapsed).toBe(true);

    const restored = new Overlay({ storage });
    restored.render(empty, empty);
    expect(restored.shadow.querySelector(".panel")!.className).toContain("collapsed");
  });

  test("przeciąganie przeżywa przebudowę panelu i zapisuje pozycję", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };

    const overlay = new Overlay({ storage });
    const empty = aggregate([]);
    overlay.render(empty, empty);

    const header = overlay.shadow.querySelector<HTMLElement>("header")!;
    const at = (type: string, x: number, y: number) =>
      Object.assign(new Event(type, { bubbles: true }), { clientX: x, clientY: y, pointerId: 1 });

    header.dispatchEvent(at("pointerdown", 100, 100));
    // W ŚRODKU przeciągania dochodzi linia logu i panel się przebudowuje. Gdy
    // nagłówek powstawał od nowa, listenery zostawały na odłączonym węźle: ruch
    // zastygał, a `pointerup` (a z nim zapis) nigdy nie padał.
    overlay.render(empty, empty);
    expect(overlay.shadow.querySelector("header")).toBe(header);

    header.dispatchEvent(at("pointermove", 140, 160));
    header.dispatchEvent(at("pointerup", 140, 160));

    // Start 16/16, chwyt w 100/100 → przesunięcie o 40/60.
    const host = overlay.shadow.host as HTMLElement;
    expect([host.style.left, host.style.top]).toEqual(["56px", "76px"]);

    const saved = JSON.parse(store.get("margometer.panel")!);
    expect([saved.x, saved.y]).toEqual([56, 76]);

    // Pozycja przeżywa odświeżenie strony.
    const restored = new Overlay({ storage });
    restored.render(empty, empty);
    const rhost = restored.shadow.host as HTMLElement;
    expect([rhost.style.left, rhost.style.top]).toEqual(["56px", "76px"]);
  });

  test("panel ma sufit wysokości, więc lista nie schodzi poniżej ekranu", () => {
    // Bez sufitu okno rosło z treścią: trzydzieści postaci to ~700 px samej
    // listy, a przy panelu postawionym niżej dolne wiersze były nieklikalne.
    const overlay = new Overlay();
    const empty = aggregate([]);
    overlay.render(empty, empty);

    const panel = overlay.shadow.querySelector<HTMLElement>(".panel")!;
    // Domyślna pozycja to 16 px od góry, 8 px luzu do dolnej krawędzi.
    expect(panel.style.maxHeight).toBe(`${window.innerHeight - 16 - 8}px`);

    // Sufit jedzie z oknem: im niżej stoi, tym mniej mu zostaje.
    const header = overlay.shadow.querySelector<HTMLElement>("header")!;
    const at = (type: string, x: number, y: number) =>
      Object.assign(new Event(type, { bubbles: true }), { clientX: x, clientY: y, pointerId: 1 });
    header.dispatchEvent(at("pointerdown", 20, 20));
    header.dispatchEvent(at("pointermove", 20, 604));
    header.dispatchEvent(at("pointerup", 20, 604));

    expect(panel.style.maxHeight).toBe(`${window.innerHeight - 600 - 8}px`);
  });

  test("uchwyt zmienia i zapamiętuje rozmiar okna", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };

    const overlay = new Overlay({ storage });
    const empty = aggregate([]);
    overlay.render(empty, empty);

    const grip = overlay.shadow.querySelector<HTMLElement>(".resize-grip")!;
    const at = (type: string, x: number, y: number) =>
      Object.assign(new Event(type, { bubbles: true }), { clientX: x, clientY: y, pointerId: 1 });
    grip.dispatchEvent(at("pointerdown", 100, 100));
    grip.dispatchEvent(at("pointermove", 160, 300));
    grip.dispatchEvent(at("pointerup", 160, 300));

    // Szerokość: 260 (domyślna) + 60. Wysokość: start 0 (jsdom bez layoutu) + 200.
    const panel = overlay.shadow.querySelector<HTMLElement>(".panel")!;
    expect(panel.style.width).toBe("320px");
    expect(panel.style.height).toBe("200px");

    const saved = JSON.parse(store.get("margometer.panel")!);
    expect(saved.width).toBe(320);
    expect(saved.height).toBe(200);

    // Rozmiar przeżywa nowy overlay z tego samego storage.
    const restored = new Overlay({ storage });
    restored.render(empty, empty);
    const rpanel = restored.shadow.querySelector<HTMLElement>(".panel")!;
    expect(rpanel.style.width).toBe("320px");
    expect(rpanel.style.height).toBe("200px");
  });
});

describe("spięcie źródła z overlayem", () => {
  test("cały łańcuch: DOM gry → parser → overlay", async () => {
    // Odtwarzamy okno walki tak, jak wyglądałoby w grze: linie w <div>-ach.
    const log = document.createElement("div");
    log.id = "log-walki";
    for (const line of (await readFixture("new-engine/2026-07-18_lowca-vs-paladyni")).split("\n")) {
      log.append(Object.assign(document.createElement("div"), { textContent: line }));
    }
    document.body.append(log);

    const container = findBattleLog();
    expect(container?.id).toBe("log-walki");

    const overlay = new Overlay();
    const stop = start(new DomLogSource(container!), overlay);

    // Jeden wspólny ranking, malejąco — strona nie ma wpływu na kolejność.
    const labels = [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);
    expect(labels).toEqual(["Południca", "Wieczornica *", "Łowca głów z psk"]);

    // Po dopisaniu linii overlay musi się sam przeliczyć.
    log.append(
      Object.assign(document.createElement("div"), {
        textContent: "Południca(100%) uderzył(a) z siłą  +900",
      }),
      Object.assign(document.createElement("div"), {
        textContent: "Łowca głów z psk(0%) otrzymał  -500  obrażeń",
      }),
    );
    await new Promise((resolve) => queueMicrotask(() => resolve(null)));

    // Wiersz bierzemy po nazwie: sekcje układają moją stronę przed przeciwnikami,
    // a dopisane obrażenia zadała Południca.
    const poludnica = [...overlay.shadow.querySelectorAll<HTMLElement>(".row")].find(
      (row) => row.dataset.actor === "Południca",
    );
    expect(poludnica?.querySelector(".value")?.textContent).toContain(number.format(978 + 500));
    stop();
  });

  test("statyczne źródło renderuje statystyki walki", async () => {
    const overlay = new Overlay();
    start(new StaticLogSource(await readFixture("new-engine/2026-07-18_tancerz-vs-kukla")), overlay);

    const labels = [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);
    expect(labels).toEqual(["Magister Kazrek", "Kukła Treningowa"]);
    expect(overlay.shadow.querySelector(".value")?.textContent).toContain("36");
  });
});

describe("pozycja dymka", () => {
  // Panel i dymek mają po 260px, odstęp 8px — te same stałe co w overlayu.
  const box = {
    panelWidth: 260,
    tipWidth: 260,
    tipHeight: 200,
    gap: 8,
    viewportWidth: 1000,
    viewportHeight: 800,
  };

  test("domyślnie stoi po prawej stronie panelu", () => {
    expect(tipPosition({ ...box, hostLeft: 100, rowTop: 300 })).toEqual({
      left: 100 + 260 + 8,
      top: 300,
    });
  });

  test("przeskakuje na lewo, gdy po prawej nie ma miejsca", () => {
    // 700 + 260 + 8 + 260 + 8 > 1000, więc w prawo się nie mieści.
    expect(tipPosition({ ...box, hostLeft: 700, rowTop: 300 }).left).toBe(700 - 260 - 8);
  });

  test("nie wyjeżdża w lewo, gdy panel stoi przy lewej krawędzi", () => {
    // Panel przy lewej i okno za wąskie na dymek po prawej: przeskok w lewo
    // dałby -268, więc dymek musi zostać dosunięty do krawędzi.
    const position = tipPosition({
      ...box,
      hostLeft: 4,
      rowTop: 300,
      viewportWidth: 500,
    });
    expect(position.left).toBe(8);
  });

  test("nie wyjeżdża w prawo, gdy panel stoi przy prawej krawędzi", () => {
    const position = tipPosition({ ...box, hostLeft: 980, rowTop: 300 });
    expect(position.left).toBeGreaterThanOrEqual(8);
    expect(position.left + box.tipWidth).toBeLessThanOrEqual(box.viewportWidth - 8);
  });

  test("nie wyjeżdża poniżej dolnej krawędzi", () => {
    // Wiersz nisko, a dymek wysoki — 780 + 200 nie zmieści się w 800.
    const position = tipPosition({ ...box, hostLeft: 100, rowTop: 780 });
    expect(position.top).toBe(800 - 200 - 8);
    expect(position.top + box.tipHeight).toBeLessThanOrEqual(box.viewportHeight - 8);
  });

  test("nie wyjeżdża ponad górną krawędź", () => {
    expect(tipPosition({ ...box, hostLeft: 100, rowTop: -50 }).top).toBe(8);
  });

  test("dymek wyższy od okna trzyma się górnej krawędzi", () => {
    // Przycięcie od dołu dałoby wartość mniejszą niż margines — wtedy ważniejsze
    // jest, żeby widać było początek dymka, a nie jego koniec.
    const position = tipPosition({
      ...box,
      hostLeft: 100,
      rowTop: 300,
      tipHeight: 900,
      viewportHeight: 500,
    });
    expect(position.top).toBe(8);
  });
});

describe("efekty: kto wyzwolił kontra na kim się odpalił", () => {
  const log = [
    "Rozpoczęła się walka pomiędzy Gracz (1w) a Szaman (1m)",
    "Szaman(100%) uderzył(a) z siłą  +536",
    "-Oślepienie w następnej turze",
    "Gracz(98%) otrzymał  -261  obrażeń",
  ].join("\n");

  test("efekt liczy się u tego, kto go ma w eq, nie u ofiary", () => {
    const stats = aggregate(parse(log));
    const szaman = stats.actors.find((a) => a.name === "Szaman")!;
    const gracz = stats.actors.find((a) => a.name === "Gracz")!;

    // Oślepienie odpaliło się z ekwipunku szamana — to jego licznik.
    expect(szaman.procs).toEqual([{ label: "Oślepienie w następnej turze", count: 1 }]);
    expect(gracz.procs).toEqual([]);
  });

  test("ofiara ma osobny licznik tego, co się na niej odpaliło", () => {
    const stats = aggregate(parse(log));
    const szaman = stats.actors.find((a) => a.name === "Szaman")!;
    const gracz = stats.actors.find((a) => a.name === "Gracz")!;

    // To samo zdarzenie z drugiej strony — dwa różne pytania, dwie liczby.
    expect(gracz.procsReceived).toEqual([{ label: "Oślepienie w następnej turze", count: 1 }]);
    expect(szaman.procsReceived).toEqual([]);
  });

  test("dymek pokazuje obie sekcje osobno", () => {
    const stats = aggregate(parse(log));
    const overlay = new Overlay();
    overlay.render(stats, stats);
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "Gracz")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector(".tip")!;
    const headings = [...tip.querySelectorAll(".tip-heading")].map((el) => el.textContent);
    // Gracz nic nie wyzwolił, więc ma tylko sekcję otrzymanych.
    expect(headings).toContain("Efekty otrzymane");
    expect(headings).not.toContain("Efekty w ciosach");
  });
});

describe("nagłówek stron i tempo", () => {
  const statsFrom = async (name: string) => aggregate(parse(await readFixture(name)));
  const perTurnButton = (overlay: Overlay) =>
    [...overlay.shadow.querySelectorAll("button")].find((b) => b.textContent === "na turę")!;

  test("nagłówek sumuje obie strony i dzieli pasek proporcjonalnie", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const mine = stats.actors
      .filter((a) => a.side === 0)
      .reduce((sum, a) => sum + a.damageDealt, 0);
    const enemy = stats.actors
      .filter((a) => a.side !== null && a.side !== 0)
      .reduce((sum, a) => sum + a.damageDealt, 0);

    expect(overlay.shadow.querySelector(".side-mine")?.textContent).toBe(
      `${number.format(mine)} my`,
    );
    expect(overlay.shadow.querySelector(".side-enemy")?.textContent).toBe(
      `${number.format(enemy)} oni`,
    );

    const fill = overlay.shadow.querySelector<HTMLElement>(".fill-mine")!;
    expect(fill.style.width).toBe(`${(mine / (mine + enemy)) * 100}%`);
  });

  test("podział na strony stoi pod listą i tylko przy zakładce Wszyscy", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    // Zamyka korpus — pod listą i pod stopką. Lista jest wtedy jednym rankingiem
    // bez sekcji, więc to jedyne miejsce, które mówi, jak wypadły drużyny.
    const blocks = [...overlay.shadow.querySelector(".panel-body")!.children].map((el) => el.className);
    expect(blocks.at(-1)).toBe("sides");

    // Przy "Wszyscy" to porównanie stron: dwie sumy i pasek podziału.
    expect(overlay.shadow.querySelector(".sides-track")).not.toBeNull();

    // Przy jednej drużynie porównywać nie ma z czym, więc pasek ustępuje jej
    // sumom — wszystkie metryki naraz, nie tylko ta z aktywnej zakładki.
    [...overlay.shadow.querySelectorAll("button")]
      .find((b) => b.textContent === "My")!
      .click();

    expect(overlay.shadow.querySelector(".sides-track")).toBeNull();
    const totals = [...overlay.shadow.querySelectorAll(".team-total")].map((el) => [
      el.firstElementChild?.textContent,
      el.querySelector(".team-total-value")?.textContent,
    ]);
    const mine = stats.actors.filter((a) => a.side === 0);
    const sum = (pick: (a: (typeof mine)[number]) => number) =>
      number.format(mine.reduce((acc, a) => acc + pick(a), 0));
    expect(totals).toEqual([
      ["Zadane", sum((a) => a.damageDealt)],
      ["Otrzymane", sum((a) => a.damageTaken)],
      ["Leczenie", sum((a) => a.healingReceived)],
    ]);
    // Aktywna metryka wyróżniona, żeby było wiadomo, co rządzi listą wyżej.
    expect(overlay.shadow.querySelector(".team-total.is-active")?.firstElementChild?.textContent)
      .toBe("Zadane");
    expect(overlay.shadow.querySelectorAll(".row")).toHaveLength(1);
  });

  test("trucizna bez sprawcy idzie za filtrem składu", () => {
    // Sprawcy log nie podaje (po drugiej stronie stoi trzech), ale ofiarę tak —
    // więc przypis ma mówić o tej stronie, którą właśnie widać.
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Gracz (1w) a A (1w), B (1w), C (1w)",
          "Gracz(50%): 100 obrażeń od trucizny.",
        ].join("\n"),
      ),
    );
    const overlay = new Overlay();
    overlay.render(stats, stats);
    const note = () =>
      [...overlay.shadow.querySelectorAll("footer .note")]
        .map((el) => el.textContent)
        .find((text) => text?.startsWith("Trucizna"));

    // Przy "Wszyscy" suma plus rozbicie — sama liczba nie mówi, kogo to boli.
    expect(note()).toBe("Trucizna bez sprawcy: 100 (my 100 · oni 0)");

    [...overlay.shadow.querySelectorAll("button")].find((b) => b.textContent === "Oni")!.click();
    // Truciznę oberwał gracz, nie oni — przy "Oni" przypis nie ma o czym mówić.
    expect(note()).toBeUndefined();

    [...overlay.shadow.querySelectorAll("button")].find((b) => b.textContent === "My")!.click();
    expect(note()).toBe("Trucizna bez sprawcy: 100");
  });

  test("nie ma nagłówka, gdy log nie dał podziału na strony", () => {
    const overlay = new Overlay();
    overlay.render(EMPTY_STATS, EMPTY_STATS);
    expect(overlay.shadow.querySelector(".sides")).toBeNull();
  });

  test("dymek mówi, co jest dzielnikiem trybu na turę", async () => {
    // Zadane dzielą się przez tury WŁASNE, przyjęte przez tury WALKI, a wiersz
    // podpisuje oba tym samym „/t" — bez tego przełączenie zakładki zmieniało
    // skalę liczby o rząd wielkości bez żadnego sygnału.
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    perTurnButton(overlay).click();

    const generalNote = () =>
      [...overlay.shadow.querySelectorAll(".tip-note")].map((el) => el.textContent);
    const sourceLabels = () =>
      [...overlay.shadow.querySelectorAll(".tip-stat-label")].map((el) => el.textContent);

    // Dymek postaci: jedno zdanie o obu dzielnikach, bo pokazuje trzy metryki naraz.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "Tancogniew Kazrek")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));
    expect(generalNote().join(" ")).toContain("zadane na turę własną");

    // Wewnątrz postaci metryka jest jedna, więc dymek pozycji nazywa dzielnik wprost.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "Tancogniew Kazrek")!
      .click();
    overlay.shadow
      .querySelector<HTMLElement>(".row[data-source]")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));
    expect(sourceLabels()).toContain("Na turę własną");

    // Ta sama pozycja przy obrażeniach przyjętych dzieli się przez tury walki.
    [...overlay.shadow.querySelectorAll("button")]
      .find((b) => b.textContent === "Otrzymane")!
      .click();
    overlay.shadow
      .querySelector<HTMLElement>(".row[data-source]")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));
    expect(sourceLabels()).toContain("Na turę walki");
  });

  test("pasek stron przy zerowej sumie zostaje pusty, nie na pół", () => {
    // Skład jest, walka jeszcze się nie zaczęła. 50/50 czytało się jak remis.
    const stats = aggregate(parse("Rozpoczęła się walka pomiędzy Gracz (1w) a Wilk (1w)"));
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const fills = [...overlay.shadow.querySelectorAll<HTMLElement>(".sides-track > span")];
    expect(fills.map((fill) => fill.style.width)).toEqual(["0%", "0%"]);
  });

  test("na turę przestawia ranking, bo tury utracone przestają karać", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_wojownik-vs-druzyna-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    perTurnButton(overlay).click();

    const rows = [...overlay.shadow.querySelectorAll(".row")].map((r) => [
      r.querySelector(".label")?.textContent,
      valueOf(r),
    ]);

    // Bulu Mulu zadał 149 do 379 wojownika, ale w dwóch turach zamiast pięciu —
    // po podzieleniu bije niemal tak samo mocno i staje tuż za nim we wspólnym
    // rankingu. Udziały liczą się wobec całej walki, nie w obrębie strony.
    expect(rows[0]![0]).toBe("Woj Zandan Długonogi");
    expect(rows[1]![0]).toBe("Bulu Mulu");
    // Liczba wiodąca niesie "/t", bo w tym trybie to ona jest tempem. Udział
    // w nawiasie zostaje przy SUROWYCH sumach: 379 z 600 to 63% obrażeń walki
    // i tyle samo pokazuje tryb sum. Dawniej dzielił się przez Σ(temp) — liczbę
    // bez sensu fizycznego, której panel nigdzie nie pokazuje — więc Bulu Mulu
    // z 25% realnych obrażeń dostawał ten sam procent co wojownik z 63%.
    // Jednostka stoi przy liczbie, bo nagłówka kolumn nie ma i nie będzie —
    // bez "/t" nic by nie mówiło, że to tempo, a nie suma.
    expect(rows[0]![1]).toBe("75,8/t");
    expect(rows[1]![1]).toBe("74,5/t");
    const shares = [...overlay.shadow.querySelectorAll(".rows .row")].map(shareOf);
    expect(shares.slice(0, 2)).toEqual(["63%", "25%"]);
  });

  test("dymek liczy w tym samym trybie co wiersz, a tury zostają surowe", async () => {
    // Dymek pokazywał sumy niezależnie od przełącznika, więc ta sama postać
    // miała w wierszu tempo, a w dymku sumę — i nic nie mówiło, że to dwie
    // miary tej samej rzeczy.
    const stats = await statsFrom("new-engine/2026-07-18_wojownik-vs-druzyna-umiejetnosci");
    const actor = stats.actors.find((a) => a.turns > 1 && a.damageDealt > 0)!;
    const fightTurns = stats.timeline.length;

    const overlay = new Overlay();
    overlay.render(stats, stats);
    perTurnButton(overlay).click();
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === actor.name)!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector(".tip")!;
    const stat = (label: string) =>
      [...tip.querySelectorAll(".tip-stat")]
        .find((row) => row.querySelector(".tip-stat-label")?.textContent === label)
        ?.querySelector(".tip-stat-value")?.textContent;

    // Każda metryka swoim dzielnikiem: zadane przez tury własne, przyjęte przez
    // tury walki — tak samo jak po kliknięciu w jej zakładkę.
    expect(stat("Zadane")).toBe(`${rate.format(actor.damageDealt / actor.turns)}/t`);
    expect(stat("Otrzymane")).toBe(`${rate.format(actor.damageTaken / fightTurns)}/t`);

    // Mianownik zostaje sobą: tury na turę to z definicji 1.
    expect(stat("Tury")).toBe(`${actor.turns}`);
  });

  test("pasek niesie jedną liczbę wiodącą, a reszta stoi przy niej w nawiasie", async () => {
    // Wzorzec SKADA/Details!: na pasku nazwa i wynik, reszta po najechaniu.
    // Wcześniej stały tu obie miary naraz i w walce grupowej zjadały nazwę.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const idle = stats.actors.find((a) => a.damageDealt === 0 && a.turns === 0)!;
    const single = stats.actors.find((a) => a.turns === 1 && a.damageDealt > 0)!;

    const overlay = new Overlay();
    overlay.render(stats, stats);

    const cells = (name: string) => {
      const row = [...overlay.shadow.querySelectorAll<HTMLElement>(".row")].find(
        (candidate) => candidate.dataset.actor === name,
      )!;
      return [
        valueOf(row),
        shareOf(row),
        // Druga miara nie ma własnej kolumny — wchodzi do tego samego nawiasu
        // co udział. To jest treść tego testu.
        row.querySelector(".avg"),
      ];
    };

    const total = stats.actors.reduce((sum, a) => sum + a.damageDealt, 0);
    const share = Math.round((single.damageDealt / total) * 100);

    expect(cells(idle.name)).toEqual(["0", "0%", null]);
    expect(cells(single.name)).toEqual([number.format(single.damageDealt), `${share}%`, null]);

    // W nawiasie stoi udział, a za nim tempo — jedna liczba wiodąca, reszta
    // przy niej.
    const nawias = [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === single.name)!
      .querySelector(".share")?.textContent;
    expect(nawias).toBe(`(${share}% · ${rate.format(single.damageDealt / single.turns)}/t)`);

    // Suma nie znika z panelu — dymek pokazuje komplet metryk tej postaci.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === single.name)!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));
    const tipValue = [...overlay.shadow.querySelectorAll(".tip-stat")]
      .find((row) => row.querySelector(".tip-stat-label")?.textContent === "Zadane")
      ?.querySelector(".tip-stat-value")?.textContent;
    expect(tipValue).toBe(number.format(single.damageDealt));
  });

  test("otrzymane na turę liczy tury walki, nie tury poszkodowanego", async () => {
    // Gnoll szaman ginie w pierwszej turze łowcy, więc sam nie zdążył zagrać
    // ani razu. Przy dzieleniu przez tury WŁASNE pokazywał "0 na turę" mimo
    // 2375 przyjętych obrażeń — obrywa się w turach przeciwnika, nie swoich.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const szaman = stats.actors.find((a) => a.name === "Gnoll szaman")!;
    expect(szaman.turns).toBe(0);
    expect(szaman.damageTaken).toBeGreaterThan(0);

    const overlay = new Overlay();
    overlay.render(stats, stats);
    [...overlay.shadow.querySelectorAll("button")]
      .find((b) => b.textContent === "Otrzymane")!
      .click();
    perTurnButton(overlay).click();

    const row = [...overlay.shadow.querySelectorAll<HTMLElement>(".row")].find(
      (candidate) => candidate.dataset.actor === "Gnoll szaman",
    )!;
    const expected = szaman.damageTaken / stats.timeline.length;
    expect(valueOf(row)).toBe(`${rate.format(expected)}/t`);
  });

  test("zadane na turę nadal dzieli się przez tury własne", async () => {
    // Druga strona tej samej reguły: tempo zadawania ma karać stojącego
    // bezczynnie, więc tu dzielnikiem zostaje licznik akcji postaci.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const lowca = stats.actors.find((a) => a.name === "Łowcosław Kazrek")!;
    expect(lowca.turns).toBeLessThan(stats.timeline.length);

    const overlay = new Overlay();
    overlay.render(stats, stats);
    perTurnButton(overlay).click();

    const row = [...overlay.shadow.querySelectorAll<HTMLElement>(".row")].find(
      (candidate) => candidate.dataset.actor === "Łowcosław Kazrek",
    )!;
    const expected = lowca.damageDealt / lowca.turns;
    expect(valueOf(row)).toBe(`${rate.format(expected)}/t`);
  });

  test("duże liczby na pasku są skracane, żeby zostało miejsce na nazwę", async () => {
    const stats = aggregate(
      parse(await readFixture("new-engine/2026-07-22_lowca-tropiciel-vs-regulus-grupowa")),
    );
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const value = (name: string) =>
      valueOf(
        [...overlay.shadow.querySelectorAll<HTMLElement>(".row")].find(
          (row) => row.dataset.actor === name,
        ),
      );

    // Od pięciu cyfr wchodzi skrót — 39 352 to "39,4k".
    expect(value("Regulus Mętnooki")).toBe("39,4k");
    // Do czterech cyfr pełna liczba i tak się mieści, więc zostaje dokładna.
    expect(value("Łowcosław Kazrek")).toBe(number.format(4379));

    // Dymek zawsze podaje pełną liczbę — skrót jest tylko oszczędnością miejsca.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "Regulus Mętnooki")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));
    const tipValue = [...overlay.shadow.querySelectorAll(".tip-stat")]
      .find((row) => row.querySelector(".tip-stat-label")?.textContent === "Zadane")
      ?.querySelector(".tip-stat-value")?.textContent;
    expect(tipValue).toBe(number.format(39352));
  });

  test("tempo strony to jej suma dzielona przez jej tury, nie suma temp", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_wojownik-vs-druzyna-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats, stats);
    perTurnButton(overlay).click();

    const enemies = stats.actors.filter((a) => a.side !== null && a.side !== 0);
    const damage = enemies.reduce((sum, a) => sum + a.damageDealt, 0);
    const turns = enemies.reduce((sum, a) => sum + a.turns, 0);

    // Suma temp dałaby liczbę rosnącą z liczebnością drużyny, a nie tempo.
    const sumOfRates = enemies.reduce((sum, a) => sum + a.damageDealt / a.turns, 0);
    expect(overlay.shadow.querySelector(".side-enemy")?.textContent).toBe(
      `${new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 }).format(damage / turns)} oni`,
    );
    expect(damage / turns).not.toBeCloseTo(sumOfRates);
  });
});

describe("oś tur, zgony i skupienie ognia", () => {
  const statsFrom = async (name: string) => aggregate(parse(await readFixture(name)));

  test("oś tur rozkłada dokładnie tyle obrażeń, ile padło w walce", async () => {
    // Niezmiennik: oś to inny przekrój tych samych obrażeń, nie druga pula.
    for (const name of [
      "new-engine/2026-07-18_tancerz-vs-tropiciel-pvp",
      "new-engine/2026-07-18_wojownik-vs-druzyna-umiejetnosci",
      "new-engine/2026-07-18_lowca-vs-druzyna",
    ]) {
      const stats = await statsFrom(name);
      const onAxis = stats.timeline.reduce((sum, slice) => sum + slice.damage, 0);
      const dealt =
        stats.actors.reduce((sum, a) => sum + a.damageDealt, 0) + totalUnattributedDot(stats.unattributedDotDamage);
      expect(onAxis).toBe(dealt);
    }
  });

  test("zgon poznajemy po zejściu życia do zera, raz na postać", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    expect(stats.deaths.map((d) => d.name)).toEqual(["Locha #1", "Locha #2", "Odyniec"]);
    // Kolejność jest chronologiczna, a numer tury rośnie.
    const turns = stats.deaths.map((d) => d.turn);
    expect([...turns].sort((a, b) => a - b)).toEqual(turns);
    // Wszyscy trzej stali po stronie przeciwnej.
    expect(stats.deaths.every((d) => d.side !== 0)).toBe(true);
  });

  test("macierz zgadza się z sumą zadanych każdej postaci", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_wojownik-vs-druzyna-umiejetnosci");
    for (const actor of stats.actors) {
      const fromMatrix = stats.matrix
        .filter((edge) => edge.source === actor.name)
        .reduce((sum, edge) => sum + edge.damage, 0);
      expect(fromMatrix).toBe(actor.damageDealt);
    }
  });

  test("sesja nie skleja osi tur ani zgonów z różnych walk", async () => {
    const session = new Session();
    session.update(await readFixture("new-engine/2026-07-18_lowca-vs-druzyna"));
    // Tura 3 z jednej walki nie jest turą 3 z drugiej, a ten sam potwór ginie
    // w każdej z osobna — sklejone nie znaczyłyby nic.
    //
    // Granicy pilnuje dziś TYP (`SessionStats` nie ma tych pól, więc odwołanie
    // się do nich nie kompiluje), ale test zostaje na drugą stronę tej umowy:
    // że `mergeStats` nie dokłada ich z powrotem jako pustych tablic. Wtedy
    // sesja znów udawałaby pełne `BattleStats` w każdym miejscu czytającym
    // strukturę dynamicznie — choćby w JSON-ie ze schowka.
    const total: Record<string, unknown> = session.total();
    expect(Object.keys(total)).not.toContain("timeline");
    expect(Object.keys(total)).not.toContain("deaths");
    expect(Object.keys(total)).not.toContain("matrix");
    expect(session.current().timeline.length).toBeGreaterThan(0);
  });

  // Oś tur jest ODŁĄCZONA od renderu do czasu przemyślenia, co ma mówić —
  // patrz komentarz przy renderAxis. Dane (`timeline`, `deaths`) liczą się dalej
  // i pilnują ich testy wyżej; ten sprawdza tylko, że oś nie wchodzi do panelu.
  test("oś tur nie jest dziś pokazywana", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats, stats);

    expect(stats.timeline.length).toBeGreaterThan(0);
    expect(overlay.shadow.querySelector(".axis")).toBeNull();
  });

  // Skupienie ognia ("ogień na" / "obrywa") jest ODŁĄCZONE od renderu do czasu
  // przemyślenia układu — patrz komentarz przy renderFocus. Test pilnuje, że
  // sekcja faktycznie nie wchodzi do panelu; treść linijek sprawdzi test
  // przywrócony razem z funkcją.
  test("generator syntetyczny nie produkuje ciosów niemożliwych w grze", () => {
    // Podgląd stał na `strikes` per postać, przez co tancerz wypuszczał trzy
    // bloki na każdą akcję i "Rozpraszający atak" pokazywał 3 użycia przy
    // 9 ciosach. W korpusie prawdziwych logów rekord to 2 ciosy na użycie
    // ("Podwójne trafienie"), a zwykły atak nigdy nie przekracza jednego.
    const stats = aggregate(parse(syntheticFight(20)));

    for (const actor of stats.actors) {
      const hits = new Map(actor.dealtBy.map((source) => [source.label, source.hits]));
      for (const use of actor.abilityUses) {
        const perUse = (hits.get(use.label) ?? 0) / use.count;
        expect([actor.name, use.label, perUse <= 2]).toEqual([actor.name, use.label, true]);
        if (use.label === "Zwykły atak") {
          expect([actor.name, perUse <= 1]).toEqual([actor.name, true]);
        }
      }
    }

    // Wielotrafienie ma nadal WYSTĘPOWAĆ — inaczej podgląd przestałby pokazywać
    // rozjazd użyć do ciosów, czyli to, po co ten licznik powstał.
    const multi = stats.actors.flatMap((actor) => {
      const hits = new Map(actor.dealtBy.map((source) => [source.label, source.hits]));
      return actor.abilityUses.filter((use) => (hits.get(use.label) ?? 0) > use.count);
    });
    expect(multi.length).toBeGreaterThan(0);
  });

  test("skupienie ognia nie jest dziś pokazywane", () => {
    const stats = aggregate(parse(syntheticFight(6)));
    const overlay = new Overlay();
    overlay.render(stats, stats);
    expect(overlay.shadow.querySelector(".focus")).toBeNull();
  });

  test("lista pokazuje cały skład naraz, bez zwijania i bez sekcji stron", () => {
    const stats = aggregate(parse(syntheticFight(20)));
    const overlay = new Overlay();
    overlay.render(stats, stats);

    // Dwadzieścia postaci to dwadzieścia wierszy — nic nie chowa się pod "jeszcze N".
    expect(overlay.shadow.querySelectorAll(".rows .row")).toHaveLength(20);
    expect(overlay.shadow.querySelector(".more")).toBeNull();
    // "Wszyscy" to jeden wspólny ranking, więc nagłówków stron w liście nie ma.
    expect(overlay.shadow.querySelector(".rows .side-head")).toBeNull();

    // Kolejność jest czysto malejąca — strony nie grupują listy.
    const order = [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row")].map(
      (row) => row.dataset.actor,
    );
    const expected = [...stats.actors]
      .sort((a, b) => b.damageDealt - a.damageDealt || a.name.localeCompare(b.name, "pl"))
      .map((actor) => actor.name);
    expect(order).toEqual(expected);
  });

  test("udziały sumują się do 100% w obrębie całej listy", () => {
    const stats = aggregate(parse(syntheticFight(4)));
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const rows = [...overlay.shadow.querySelectorAll(".row")];
    const shares = rows.map((r) => parseInt(shareOf(r)!, 10));
    // Zaokrąglenie do pełnych procent potrafi zjeść albo dołożyć punkt.
    expect(Math.abs(shares.reduce((a, b) => a + b, 0) - 100)).toBeLessThanOrEqual(2);

    // Pasek mierzy wobec lidera: pełną szerokość ma dokładnie jeden wiersz.
    const widths = rows.map((r) => parseFloat((r.querySelector(".bar") as HTMLElement).style.width));
    expect(widths.filter((w) => w === 100)).toHaveLength(1);
  });
});

describe("kopiowanie i nagrywanie", () => {
  /** Nagrywarka w pamięci — overlay ma znać tylko ten interfejs. */
  const fakeRecorder = (overrides: Partial<RecorderControl> = {}) => {
    const state = { on: false, fights: 2, cleared: false, toggles: 0 };
    const control: RecorderControl = {
      isRecording: () => state.on,
      toggle: () => {
        state.on = !state.on;
        state.toggles += 1;
      },
      count: () => state.fights,
      chars: () => 5000,
      dump: () => "=== walka 1 ===\nRozpoczęła się walka pomiędzy A(1w) a B(1x)",
      clear: () => {
        state.cleared = true;
        state.fights = 0;
      },
      isFailed: () => false,
      ...overrides,
    };
    return { control, state };
  };

  const button = (overlay: Overlay, action: string) =>
    overlay.shadow.querySelector<HTMLElement>(`button[data-action="${action}"]`);

  test("kopiuje statystyki walki i sesji jako JSON", async () => {
    const stats = aggregate(parse(syntheticFight(4)));
    let copied = "";
    const overlay = new Overlay({ clipboard: (text) => void (copied = text) });
    overlay.render(stats, stats);

    button(overlay, "copy-stats")!.click();
    await Promise.resolve();

    const parsed = JSON.parse(copied);
    expect(parsed.tool).toBe("MargoMeter");
    // Kopiujemy pełne statystyki, nie widok — filtry i drążenie nie mają tu wpływu.
    expect(parsed.fight.actors).toHaveLength(stats.actors.length);
    expect(parsed.session.actors[0].damageDealt).toBe(stats.actors[0]!.damageDealt);
  });

  test("kopiowanie potwierdza się w przycisku i wraca do ikony", async () => {
    const stats = aggregate(parse(syntheticFight(2)));
    const overlay = new Overlay({ clipboard: () => {} });
    overlay.render(stats, stats);

    button(overlay, "copy-stats")!.click();
    await Promise.resolve();
    expect(button(overlay, "copy-stats")!.textContent).toBe("✓");

    await new Promise((resolve) => setTimeout(resolve, 1600));
    expect(button(overlay, "copy-stats")!.textContent).toBe("⧉");
  });

  test("odmowa schowka nie udaje sukcesu", async () => {
    const stats = aggregate(parse(syntheticFight(2)));
    const overlay = new Overlay({
      clipboard: () => {
        throw new Error("brak uprawnienia");
      },
    });
    overlay.render(stats, stats);

    button(overlay, "copy-stats")!.click();
    await Promise.resolve();

    expect(button(overlay, "copy-stats")!.textContent).toBe("✕");
  });

  // `execCommand("copy")` przy odmowie ZWRACA `false`, a nie rzuca — wartość
  // szła dotąd w próżnię, więc panel migał „✓" nad pustym schowkiem.
  test("zapasowa droga do schowka też nie udaje sukcesu", async () => {
    const stats = aggregate(parse(syntheticFight(2)));
    const execCommand = (document as unknown as { execCommand?: unknown }).execCommand;
    (document as unknown as { execCommand: unknown }).execCommand = () => false;
    // Bez wstrzykniętego schowka idzie prawdziwa ścieżka: `navigator.clipboard`
    // w jsdom nie istnieje, więc spada do `execCommand`.
    const overlay = new Overlay();
    overlay.render(stats, stats);

    try {
      button(overlay, "copy-stats")!.click();
      await Promise.resolve();
      await Promise.resolve();
      expect(button(overlay, "copy-stats")!.textContent).toBe("✕");
    } finally {
      (document as unknown as { execCommand?: unknown }).execCommand = execCommand;
    }
  });

  // `dump()` zwraca null, gdy indeks obiecuje nagrania, których pod kluczami
  // już nie ma. Wcześniej szło `?? ""` — pusty schowek i „✓".
  test("kopiowanie logów bez logów melduje porażkę, nie sukces", async () => {
    const stats = aggregate(parse(syntheticFight(2)));
    let copied: string | null = null;
    const { control } = fakeRecorder({ dump: () => null });
    const overlay = new Overlay({
      recorder: control,
      clipboard: (text) => void (copied = text),
    });
    overlay.render(stats, stats);

    button(overlay, "copy-logs")!.click();
    await Promise.resolve();

    expect(button(overlay, "copy-logs")!.textContent).toBe("✕");
    expect(copied).toBeNull();
  });

  // Wygaśnięcie było dotąd czysto obliczeniowe: na przycisku zostawało „na
  // pewno?", a klik w niego trafiał w pytanie nieaktywne i po cichu uzbrajał je
  // od nowa. Z ekranu nic się nie zmieniało, więc przycisk wyglądał na zepsuty
  // dokładnie w chwili, w której jest najbardziej niebezpieczny.
  describe("potwierdzenie kasowania wygasa WIDOCZNIE", () => {
    const armed = () => {
      const stats = aggregate(parse(syntheticFight(2)));
      const ticker = new ManualTicker();
      let clock = 1_000;
      const { control, state } = fakeRecorder();
      const overlay = new Overlay({ recorder: control, ticker, now: () => clock });
      overlay.render(stats, stats);
      button(overlay, "clear-recordings")!.click();
      return { overlay, ticker, state, advance: (ms: number) => void (clock += ms) };
    };

    test("pierwszy klik tylko pyta", () => {
      const { overlay, state } = armed();
      expect(button(overlay, "clear-recordings")!.textContent).toBe("na pewno?");
      expect(state.cleared).toBe(false);
    });

    test("etykieta dla czytnika idzie za stanem, nie za samym napisem", () => {
      const { overlay } = armed();
      expect(button(overlay, "clear-recordings")!.getAttribute("aria-label")).toBe(
        "Potwierdź usunięcie nagrań",
      );
    });

    test("drugi klik kasuje", () => {
      const { overlay, state } = armed();
      button(overlay, "clear-recordings")!.click();
      expect(state.cleared).toBe(true);
      // Pasek nagrywania znika razem z ostatnim nagraniem — nie ma już czego
      // pokazywać, więc i przycisku nie ma.
      expect(button(overlay, "clear-recordings")).toBeNull();
    });

    test("po wygaśnięciu przycisk SAM wraca do „wyczyść”", () => {
      const { overlay, ticker, advance } = armed();

      advance(6_000);
      ticker.tick();

      expect(button(overlay, "clear-recordings")!.textContent).toBe("wyczyść");
      expect(button(overlay, "clear-recordings")!.getAttribute("aria-label")).toBe("Usuń nagrania");
    });

    test("klik po wygaśnięciu pyta od nowa, a nie kasuje", () => {
      const { overlay, ticker, state, advance } = armed();
      advance(6_000);
      ticker.tick();

      button(overlay, "clear-recordings")!.click();

      expect(state.cleared).toBe(false);
      expect(button(overlay, "clear-recordings")!.textContent).toBe("na pewno?");
    });

    test("wyłączenie nagrywania zdejmuje otwarte pytanie", () => {
      const { overlay } = armed();
      button(overlay, "record")!.click();
      expect(button(overlay, "clear-recordings")?.textContent).not.toBe("na pewno?");
    });
  });

  test("bez nagrywarki nie ma ani przycisku, ani paska", () => {
    const stats = aggregate(parse(syntheticFight(2)));
    const overlay = new Overlay();
    overlay.render(stats, stats);

    expect(button(overlay, "record")).toBeNull();
    expect(overlay.shadow.querySelector(".rec-bar")).toBeNull();
  });

  test("przycisk nagrywania przełącza stan i pokazuje go", () => {
    const stats = aggregate(parse(syntheticFight(2)));
    const { control, state } = fakeRecorder();
    const overlay = new Overlay({ recorder: control });
    overlay.render(stats, stats);

    expect(button(overlay, "record")!.getAttribute("aria-pressed")).toBe("false");
    button(overlay, "record")!.click();

    expect(state.toggles).toBe(1);
    expect(button(overlay, "record")!.getAttribute("aria-pressed")).toBe("true");
    expect(button(overlay, "record")!.className).toContain("is-on");
  });

  test("pasek podaje liczbę nagranych walk i zajętość", () => {
    const stats = aggregate(parse(syntheticFight(2)));
    const { control } = fakeRecorder();
    const overlay = new Overlay({ recorder: control });
    overlay.render(stats, stats);

    // 5000 znaków to ~10 kB, bo przeglądarka liczy po dwa bajty na znak.
    expect(overlay.shadow.querySelector(".rec-bar .grow")!.textContent).toBe("2 walki · 10 kB");
  });

  test("licznik walk odmienia się poprawnie", () => {
    const stats = aggregate(parse(syntheticFight(2)));
    const word = (count: number) => {
      const { control } = fakeRecorder({ count: () => count });
      const overlay = new Overlay({ recorder: control });
      overlay.render(stats, stats);
      return overlay.shadow.querySelector(".rec-bar .grow")!.textContent!.split(" · ")[0];
    };

    expect(word(1)).toBe("1 walka");
    expect(word(2)).toBe("2 walki");
    expect(word(4)).toBe("4 walki");
    // Dopełniacz od "walka" to "walk", nie "walek" — "walek" jest od "wałek".
    expect(word(5)).toBe("5 walk");
    expect(word(21)).toBe("21 walk");
    // Nastki idą jak 5-20, mimo końcówki 2-4: "12 walk", nie "12 walki".
    expect(word(12)).toBe("12 walk");
    expect(word(13)).toBe("13 walk");
    expect(word(22)).toBe("22 walki");
    expect(word(112)).toBe("112 walk");
  });

  test("pasek znika, gdy nie ma nagrań ani nagrywania", () => {
    const stats = aggregate(parse(syntheticFight(2)));
    const { control } = fakeRecorder({ count: () => 0 });
    const overlay = new Overlay({ recorder: control });
    overlay.render(stats, stats);

    expect(overlay.shadow.querySelector(".rec-bar")).toBeNull();
  });

  test("kopiuje nagrane logi, nie statystyki", async () => {
    const stats = aggregate(parse(syntheticFight(2)));
    const { control } = fakeRecorder();
    let copied = "";
    const overlay = new Overlay({ recorder: control, clipboard: (text) => void (copied = text) });
    overlay.render(stats, stats);

    button(overlay, "copy-logs")!.click();
    await Promise.resolve();

    expect(copied).toContain("Rozpoczęła się walka pomiędzy");
    expect(copied).not.toContain("MargoMeter");
  });

  test("czyszczenie nagrań wymaga potwierdzenia", () => {
    const stats = aggregate(parse(syntheticFight(2)));
    const { control, state } = fakeRecorder();
    const overlay = new Overlay({ recorder: control });
    overlay.render(stats, stats);

    button(overlay, "clear-recordings")!.click();
    expect(state.cleared).toBe(false);
    expect(button(overlay, "clear-recordings")!.textContent).toBe("na pewno?");

    button(overlay, "clear-recordings")!.click();
    expect(state.cleared).toBe(true);
    // Nagrań nie ma, więc pasek gaśnie razem z nimi.
    expect(overlay.shadow.querySelector(".rec-bar")).toBeNull();
  });

  test("brak miejsca w magazynie widać w pasku", () => {
    const stats = aggregate(parse(syntheticFight(2)));
    const { control } = fakeRecorder({ isFailed: () => true, count: () => 0 });
    const overlay = new Overlay({ recorder: control });
    overlay.render(stats, stats);

    expect(overlay.shadow.querySelector(".rec-bar")!.textContent).toContain("Brak miejsca");
    expect(overlay.shadow.querySelector(".rec-bar")!.className).toContain("warn");
  });
});

describe("spięcie nagrywarki ze źródłem logu", () => {
  test("start() podaje nagrywarce ten sam tekst, który dostał parser", async () => {
    const text = await readFixture("new-engine/2026-07-18_tancerz-vs-kukla");
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    const recorder = new Recorder({ storage });
    recorder.toggle();
    const overlay = new Overlay({ recorder });

    start(new StaticLogSource(text), overlay, new Session(), undefined, recorder);

    expect(recorder.count()).toBe(1);
    // Overlay pokazuje ten sam stan, co nagrywarka zapisała.
    expect(overlay.shadow.querySelector(".rec-bar .grow")!.textContent).toContain("1 walka");
    const recorded = recorder.dump() ?? "";
    for (const line of text.split("\n").filter((l) => l.trim() !== "")) {
      expect(recorded).toContain(line);
    }
  });

  // Nagranie ma przeżyć licznik, nie odwrotnie: gdy wysypie się parsowanie,
  // surowy log jest JEDYNĄ rzeczą, którą da się tę awarię odtworzyć. Dlatego
  // zapis idzie pierwszy i we własnej osłonie.
  test("awaria licznika nie zabiera ze sobą nagrywania", async () => {
    const text = await readFixture("new-engine/2026-07-18_tancerz-vs-kukla");
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    const recorder = new Recorder({ storage });
    recorder.toggle();

    const session = new Session();
    session.update = () => {
      throw new Error("parser padł");
    };
    const errors: unknown[] = [];
    const console_error = console.error;
    console.error = (...args: unknown[]) => void errors.push(args);

    try {
      // Nie może wylecieć na zewnątrz: callback leci z mikrotaska, więc
      // wyjątek wypadłby do kontekstu STRONY GRY i powtarzał się przy każdej
      // mutacji DOM.
      expect(() =>
        start(new StaticLogSource(text), new Overlay({ recorder }), session, undefined, recorder),
      ).not.toThrow();
    } finally {
      console.error = console_error;
    }

    expect(recorder.count()).toBe(1);
    expect(errors).toHaveLength(1);
  });
});

// Zapisywała się dotąd sama geometria, przez co panel wyglądał na zapamiętany
// — stał tam, gdzie się go postawiło — a widok w środku wracał do domyślnego.
describe("ustawienia widoku przeżywają odświeżenie", () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  };
  const load = async () => aggregate(parse(await readFixture("new-engine/2026-07-18_lowca-vs-druzyna")));

  beforeEach(() => store.clear());

  test("metryka, skład i „na turę” wracają po F5", async () => {
    const stats = await load();
    const first = new Overlay({ storage });
    first.render(stats, stats);
    first.shadow.querySelector<HTMLElement>('[data-action="metric-damageTaken"]')!.click();
    first.shadow.querySelector<HTMLElement>('[data-action="team-enemy"]')!.click();
    first.shadow.querySelector<HTMLElement>('[data-action="per-turn"]')!.click();

    const second = new Overlay({ storage });
    second.render(stats, stats);

    const pressed = (overlay: Overlay, action: string) =>
      overlay.shadow.querySelector(`[data-action="${action}"]`)?.getAttribute("aria-pressed");
    expect(pressed(second, "metric-damageTaken")).toBe("true");
    expect(pressed(second, "team-enemy")).toBe("true");
    expect(pressed(second, "per-turn")).toBe("true");
  });

  test("wejście w postać świadomie NIE wraca — tamtej walki już nie ma", async () => {
    const stats = await load();
    const first = new Overlay({ storage });
    first.render(stats, stats);
    first.shadow.querySelector<HTMLElement>(".row")!.click();
    expect(first.shadow.querySelector(".crumb")).not.toBeNull();

    const second = new Overlay({ storage });
    second.render(stats, stats);

    expect(second.shadow.querySelector(".crumb")).toBeNull();
  });

  test("zapis z nieznaną metryką nie wywraca panelu", async () => {
    const stats = await load();
    store.set("margometer.panel", JSON.stringify({ metric: "czegoTakiegoNieMa", team: "obcy" }));

    const overlay = new Overlay({ storage });
    overlay.render(stats, stats);

    const pressed = (action: string) =>
      overlay.shadow.querySelector(`[data-action="${action}"]`)?.getAttribute("aria-pressed");
    expect(pressed("metric-damageDealt")).toBe("true");
    expect(pressed("team-all")).toBe("true");
  });
});

// Metoda istniała, ale robiła tylko `host.remove()`: zostawiała listener
// `resize` na `window` i odliczający timeout, który po zniknięciu panelu wołał
// `rerender()` na drzewie, którego już nie ma. I nikt jej nie wołał.
describe("zdejmowanie panelu", () => {
  test("destroy zdejmuje nasłuch zmiany rozmiaru okna", async () => {
    const stats = aggregate(parse(await readFixture("new-engine/2026-07-18_lowca-vs-druzyna")));
    const overlay = new Overlay();
    overlay.render(stats, stats);

    overlay.destroy();

    // Gdyby listener został, `moveTo` sięgnęłoby po zdjęty już panel.
    expect(() => window.dispatchEvent(new Event("resize"))).not.toThrow();
    expect(document.getElementById("margometer")).toBeNull();
  });

  test("destroy gasi odliczanie ikony kopiowania", async () => {
    const stats = aggregate(parse(await readFixture("new-engine/2026-07-18_lowca-vs-druzyna")));
    const overlay = new Overlay({ clipboard: () => {} });
    overlay.render(stats, stats);
    overlay.shadow.querySelector<HTMLElement>('button[data-action="copy-stats"]')!.click();
    await Promise.resolve();

    overlay.destroy();

    // Timeout dobiegłby tu końca i przerysował panel, którego nie ma.
    await new Promise((resolve) => setTimeout(resolve, 1600));
    expect(document.getElementById("margometer")).toBeNull();
  });
});

describe("podgląd wczytanej walki", () => {
  const load = async (name: string) => aggregate(parse(await readFixture(`new-engine/${name}`)));

  /** Widok podglądu bez odtwarzania — tyle, ile overlay potrzebuje do paska. */
  const view = (): PreviewView => ({
    source: "z archiwum · 19:04",
    title: "test",
    replay: null,
    close: () => {},
  });

  // Przycisk wyglądał tak samo, mówił to samo i kopiował CO INNEGO niż to, na
  // co patrzysz — dowiadywałeś się o tym dopiero po wklejeniu.
  test("kopiowanie w podglądzie daje nagranie, nie walkę na żywo", async () => {
    const live = await load("2026-07-18_tancerz-vs-kukla");
    const archived = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    let copied = "";
    const overlay = new Overlay({ clipboard: (text) => void (copied = text) });
    overlay.render(live, live);
    overlay.showPreview(archived, view());

    overlay.shadow.querySelector<HTMLElement>('button[data-action="copy-stats"]')!.click();
    await Promise.resolve();

    const parsed = JSON.parse(copied);
    expect(parsed.source).toBe("z archiwum · 19:04");
    expect(parsed.fight.actors.map((a: { name: string }) => a.name)).toEqual(
      archived.actors.map((a) => a.name),
    );
    // Nagranie z archiwum nie jest częścią sesji, więc dokładanie jej obok
    // sugerowałoby, że te liczby się ze sobą wiążą.
    expect(parsed.session).toBeNull();
  });

  test("po wyjściu z podglądu kopiowanie znów daje walkę na żywo", async () => {
    const live = await load("2026-07-18_tancerz-vs-kukla");
    const archived = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    let copied = "";
    const overlay = new Overlay({ clipboard: (text) => void (copied = text) });
    overlay.render(live, live);
    overlay.showPreview(archived, view());
    overlay.closePreview();

    overlay.shadow.querySelector<HTMLElement>('button[data-action="copy-stats"]')!.click();
    await Promise.resolve();

    const parsed = JSON.parse(copied);
    expect(parsed.source).toBe("na żywo");
    expect(parsed.session).not.toBeNull();
  });

  // Zwinięty panel był nieodróżnialny od zwiniętego panelu na żywo, choć
  // pokazywał nagranie sprzed godziny — a odtwarzanie leciało dalej.
  test("zwinięcie nie chowa śladu, że to nie jest walka na żywo", async () => {
    const live = await load("2026-07-18_tancerz-vs-kukla");
    const archived = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(live, live);
    overlay.showPreview(archived, view());

    overlay.shadow.querySelector<HTMLElement>('button[data-action="collapse"]')!.click();

    expect(overlay.shadow.querySelector(".preview-bar")).not.toBeNull();
    // A z nim jedyne wyjście z podglądu.
    expect(overlay.shadow.querySelector('button[data-action="exit-preview"]')).not.toBeNull();
    // Pasek nagrywania dalej znika — on niesie liczby, nie tożsamość widoku.
    expect(overlay.shadow.querySelector(".rec-bar")).toBeNull();
  });

  test("zwinięty panel bez podglądu zostaje samym nagłówkiem", async () => {
    const live = await load("2026-07-18_tancerz-vs-kukla");
    const overlay = new Overlay();
    overlay.render(live, live);

    overlay.shadow.querySelector<HTMLElement>('button[data-action="collapse"]')!.click();

    expect(overlay.shadow.querySelector(".preview-bar")).toBeNull();
  });

  test("dymek opisuje wczytane nagranie, nie walkę na żywo", async () => {
    // Składy są rozłączne, więc szukanie postaci w walce na żywo nie znajduje
    // NICZEGO — dokładnie tak dymek w archiwum milczał.
    const live = await load("2026-07-18_tancerz-vs-kukla");
    const archived = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(live, live);
    overlay.showPreview(archived, view());

    const row = overlay.shadow.querySelector<HTMLElement>(".row")!;
    const name = row.dataset.actor!;
    expect(archived.actors.some((actor) => actor.name === name)).toBe(true);
    row.dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector<HTMLElement>(".tip")!;
    expect(tip.hidden).toBe(false);
    expect(tip.querySelector(".tip-title")?.textContent).toBe(name);
  });

  test("przy zbieżności nazw dymek bierze liczby z nagrania", async () => {
    // Gorszy wariant tego samego błędu: postać o tej samej nazwie JEST w walce
    // na żywo, więc dymek się pokazywał — tylko z cudzymi liczbami.
    const text = await readFixture("new-engine/2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const archived = aggregate(parse(text));
    // Ta sama walka urwana w połowie: te same nazwy, mniejsze liczby.
    const live = aggregate(parse(text.split("\n").slice(0, 12).join("\n")));

    const overlay = new Overlay();
    overlay.render(live, live);
    overlay.showPreview(archived, view());

    const name = "Łowcosław Kazrek";
    const dealtInArchive = archived.actors.find((a) => a.name === name)!.damageDealt;
    const dealtLive = live.actors.find((a) => a.name === name)!.damageDealt;
    expect(dealtInArchive).toBeGreaterThan(dealtLive);

    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === name)!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const values = [...overlay.shadow.querySelectorAll(".tip .tip-stat-value")].map(
      (el) => el.textContent,
    );
    expect(values).toContain(new Intl.NumberFormat("pl-PL").format(dealtInArchive));
    expect(values).not.toContain(new Intl.NumberFormat("pl-PL").format(dealtLive));
  });
});

describe("prawy przycisk w polu tekstowym", () => {
  test("nie cofa widoku i nie blokuje menu przeglądarki", async () => {
    // Archiwum rysuje pole wklejania w TYM SAMYM shadow roocie co panel, więc
    // globalny handler PPM zabierał mu natywne menu — jedyne miejsce, gdzie to
    // menu jest naprawdę potrzebne — i przy okazji cofał widok o szczebel.
    const stats = aggregate(parse(await readFixture("new-engine/2026-07-18_tancerz-vs-kukla")));
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const row = overlay.shadow.querySelector<HTMLElement>(".row[data-actor]")!;
    const name = row.dataset.actor!;
    row.click();
    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe(name);

    const area = document.createElement("textarea");
    overlay.shadow.append(area);
    const event = new Event("contextmenu", { bubbles: true, cancelable: true });
    area.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    // Widok stoi tam, gdzie stał — PPM z pola tekstowego nic nie cofa.
    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe(name);

    // Poza polem tekstowym PPM działa jak dotąd: wraca do składu.
    const outside = new Event("contextmenu", { bubbles: true, cancelable: true });
    overlay.shadow.querySelector(".rows")!.dispatchEvent(outside);
    expect(outside.defaultPrevented).toBe(true);
    expect(overlay.shadow.querySelector(".crumb-name")).toBeNull();
  });
});

describe("przyciski panelu przeżywają przebudowę w środku gestu", () => {
  const press = (node: Element, kind: string) =>
    node.dispatchEvent(new Event(kind, { bubbles: true }));

  test("zakładka metryki działa, choć panel przebudował się między wciśnięciem a puszczeniem", async () => {
    // Tak wygląda odtwarzanie: klatka co 62,5 ms przy 4×, więc zwykły klik
    // (~100 ms) zawsze trafia w przebudowę. Węzeł spod kursora znika, natywny
    // `click` nie pada, a zakładki przestają działać — z podglądu nie dawało się
    // wyjść bez wcześniejszej pauzy.
    const stats = aggregate(parse(await readFixture("new-engine/2026-07-18_tancerz-vs-kukla")));
    const overlay = new Overlay();
    overlay.render(stats, stats);

    press(metricButton(overlay, "Otrzymane"), "pointerdown");
    // Nowa klatka: cała treść korpusu powstaje od nowa.
    overlay.render(stats, stats);
    press(metricButton(overlay, "Otrzymane"), "pointerup");

    expect(metricButton(overlay, "Otrzymane").getAttribute("aria-pressed")).toBe("true");
    expect(metricButton(overlay, "Zadane").getAttribute("aria-pressed")).toBe("false");
  });

  test("zwykły klik nie wykonuje akcji dwa razy", async () => {
    // `pointerup` już ją wykonał, a przeglądarka dokłada za nim `click` —
    // bez flagi „obsłużone” przełącznik wracałby na miejsce.
    const stats = aggregate(parse(await readFixture("new-engine/2026-07-18_tancerz-vs-kukla")));
    const overlay = new Overlay();
    overlay.render(stats, stats);

    const perTurn = () =>
      [...overlay.shadow.querySelectorAll("button")].find((b) => b.textContent === "na turę")!;
    press(perTurn(), "pointerdown");
    press(perTurn(), "pointerup");
    press(perTurn(), "click");

    expect(perTurn().getAttribute("aria-pressed")).toBe("true");
  });

  test("puszczenie nad INNYM przyciskiem niczego nie przełącza", async () => {
    const stats = aggregate(parse(await readFixture("new-engine/2026-07-18_tancerz-vs-kukla")));
    const overlay = new Overlay();
    overlay.render(stats, stats);

    press(metricButton(overlay, "Otrzymane"), "pointerdown");
    press(metricButton(overlay, "Leczenie"), "pointerup");

    expect(metricButton(overlay, "Zadane").getAttribute("aria-pressed")).toBe("true");
  });
});

describe("koszt sumy sesji", () => {
  test("suma sesji nie liczy się przy każdej linii logu", async () => {
    // `mergeStats` głęboko kopiuje i sortuje każde rozbicie każdej postaci,
    // a panel nie ma dziś zakładki sesji — czyta ją tylko przycisk kopiowania.
    // Liczenie jej co linię było pracą w wątku gry na nic.
    class CountingSession extends Session {
      totals = 0;
      override total() {
        this.totals += 1;
        return super.total();
      }
    }

    /** Źródło sterowane ręcznie — log rośnie linia po linii, jak w grze. */
    class GrowingSource {
      private listener: ((text: string) => void) | null = null;
      subscribe(listener: (text: string) => void) {
        this.listener = listener;
        return () => {
          this.listener = null;
        };
      }
      emit(text: string) {
        this.listener?.(text);
      }
    }

    const text = await readFixture("new-engine/2026-07-18_tancerz-vs-kukla");
    const lines = text.split("\n");
    const source = new GrowingSource();
    const session = new CountingSession();
    const overlay = new Overlay();
    start(source, overlay, session);

    for (let i = 1; i <= lines.length; i += 1) source.emit(lines.slice(0, i).join("\n"));

    expect(overlay.shadow.querySelectorAll(".row").length).toBeGreaterThan(0);
    expect(session.totals).toBe(0);

    // Ale gdy ktoś naprawdę pyta — liczba jest na miejscu.
    expect(session.total().actors.length).toBeGreaterThan(0);
  });
});
