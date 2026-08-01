import { describe, expect, test } from "bun:test";
import { parse } from "../src/parser.ts";
import { aggregate, totalBySide, UNATTRIBUTED_SOURCE, type Aggregate } from "../src/stats.ts";
import { Overlay } from "../src/overlay.ts";
import { Session, splitFights } from "../src/session.ts";
import { DomLogSource } from "../src/source.ts";
import { start } from "../src/index.ts";
import { deepSum, readFixture } from "./helpers.ts";

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
        + totalBySide(total.unattributedDotDamage);
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

/**
 * Sesja to suma walk — i to, czego log nie przypisał nikomu, też musi się w niej
 * sumować w tym samym kształcie, co w pojedynczej walce. Inaczej przypis pod
 * listą przestaje się zgadzać dokładnie wtedy, gdy walk jest więcej niż jedna.
 */
describe("suma sesji trzyma pule bez sprawcy", () => {
  const fight = (victim: string, poison: number, heal: number) =>
    [
      "Rozpoczęła się walka pomiędzy Gracz (1w) a Wilk (1w), Niedźwiedź (1w)",
      `${victim}(50%): ${poison} obrażeń od trucizny.`,
      `Przywrócono ${heal} punktów życia ${victim}(90%).`,
    ].join("\n");

  test("leczenie i trucizna bez sprawcy sumują się po stronach", async () => {
    const session = new Session();
    session.update(fight("Gracz", 100, 700));
    session.update(`${fight("Gracz", 100, 700)}\n${fight("Gracz", 40, 300)}`);

    const total = session.total();
    // Dwie walki po stronie gracza — obie pule mają wylądować pod „my”, a nie
    // rozdzielić się po równo ani powtórzyć na obu zakładkach filtra.
    expect(total.unattributedHealing).toEqual({ mine: 1000, enemy: 0, loose: 0 });
    expect(total.unattributedDotDamage.mine).toBe(140);
    expect(total.unattributedDotDamage.enemy).toBe(0);
    expect(totalBySide(total.unattributedDotDamage)).toBe(140);
    // Ta sama liczba widziana od strony postaci.
    const gracz = total.actors.find((a) => a.name === "Gracz")!;
    expect(gracz.unattributedHealingReceived).toBe(1000);
    expect(gracz.unattributedDotTaken).toBe(140);
  });

  test("pozycja zbiorcza zostaje na końcu rozbicia po sklejeniu walk", async () => {
    const session = new Session();
    session.update(
      [
        "Rozpoczęła się walka pomiędzy Gracz (1w) a Wilk (1w), Niedźwiedź (1w)",
        "Wilk(100%) uderzył z siłą  +50",
        "Gracz(90%) otrzymał(a)  -50  obrażeń",
        "Gracz(50%): 100 obrażeń od trucizny.",
      ].join("\n"),
    );

    const gracz = session.total().actors.find((a) => a.name === "Gracz")!;
    expect(gracz.takenFromBy.at(-1)?.label).toBe(UNATTRIBUTED_SOURCE);
    expect(gracz.takenFromBy.at(-1)?.amount).toBe(100);
  });
});

/**
 * Strona jest cechą POSTACI, nie walki — tak jak profesja i poziom, które
 * `mergeStats` uzupełniał od dawna. Bez tego suma sesji miała `null` u każdego,
 * kto choć raz wystąpił w buforze bez linii otwierającej, a `matchesTeam`
 * odrzuca `null` poza „Wszyscy": ci gracze znikali z „My"/„Oni" mimo że inna
 * walka ich stronę znała.
 */
describe("suma sesji nie gubi strony", () => {
  const pelna = [
    "Rozpoczęła się walka pomiędzy Gracz (100h) a Wróg (70m)",
    "Gracz(100%) uderzył z siłą  +100",
    "Wróg(80%) otrzymał(a)  -100  obrażeń",
  ].join("\n");
  const ogon = ["Gracz(100%) uderzył z siłą  +50", "Wróg(90%) otrzymał(a)  -50  obrażeń"].join("\n");

  test("stronę dokłada walka, która ją zna", () => {
    const session = new Session();
    session.update(ogon);
    session.update(`${ogon}\n${pelna}`);

    const sides = (stats: Aggregate) =>
      Object.fromEntries(stats.actors.map((actor) => [actor.name, actor.side]));
    expect(sides(session.current())).toEqual({ Gracz: 0, Wróg: 1 });
    expect(sides(session.total())).toEqual({ Gracz: 0, Wróg: 1 });
  });
});
