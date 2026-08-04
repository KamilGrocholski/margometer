import { describe, expect, test } from "bun:test";
import { EngineProtocolSource, StaticProtocolSource } from "../src/protokol-source.ts";
import type { GameGlobals, RosterEntry, RosterSource } from "../src/roster.ts";
import type { BattleEvent } from "../src/types.ts";

/**
 * Źródło zdarzeń z `Engine.battle.update`.
 *
 * CZEGO TE TESTY PILNUJĄ. Nie tego, że gra wywoła `update` z takim ładunkiem —
 * tego nie dowiedzie nic aż do zrzutu. Pilnują UMOWY Z GOSPODARZEM STRONY:
 * że oryginał leci pierwszy i wraca nietknięty, że nasz wyjątek nie wychodzi
 * do gry, że zdejmujemy wyłącznie swoją warstwę i że podmiana obiektu walki
 * nie miesza dwóch walk w jedną.
 *
 * To jest jedyny plik w `src/`, którego błąd psuje GRĘ, a nie tylko panel —
 * stąd gęstość tych przypadków.
 */

const SKLAD: RosterEntry[] = [
  { id: 1, name: "Kamil", side: 0 },
  { id: 2, name: "Locha", side: 1 },
];

const roster = (wpisy: RosterEntry[] | null = SKLAD): RosterSource => ({ current: () => wpisy });

/** Atrapa zegara: krok wywołujemy ręcznie, jak w `tests/index.test.ts`. */
function zegar() {
  let krok: (() => void) | null = null;
  let anulowany = false;
  return {
    schedule: (step: () => void) => {
      krok = step;
      return 1;
    },
    cancel: () => {
      anulowany = true;
    },
    tik: () => krok?.(),
    czyAnulowany: () => anulowany,
  };
}

function gra(update: (...a: unknown[]) => unknown) {
  const battle: Record<string, unknown> = { update };
  return { globals: { Engine: { battle } } as GameGlobals, battle };
}

describe("StaticProtocolSource", () => {
  test("oddaje zdarzenia raz i nie wymaga gry", () => {
    const widziane: BattleEvent[][] = [];
    new StaticProtocolSource(["0;0;txt=start"]).subscribe((z) => widziane.push(z));
    expect(widziane).toHaveLength(1);
    expect(widziane[0]).toEqual([{ kind: "info", line: "start" }]);
  });
});

describe("EngineProtocolSource: umowa z gospodarzem strony", () => {
  test("oryginał leci pierwszy, a jego wynik wraca NIETKNIĘTY", () => {
    const wolania: unknown[] = [];
    const { globals, battle } = gra((...a) => {
      wolania.push(a[0]);
      return "wynik oryginału";
    });
    const z = zegar();
    new EngineProtocolSource(globals, roster(), z).subscribe(() => {});

    const update = battle["update"] as (...a: unknown[]) => unknown;
    const oddane = update({ m: ["1=100.00;2=90.00;+dmg=10;-dmg=10"] });

    expect(oddane).toBe("wynik oryginału");
    expect(wolania).toHaveLength(1);
  });

  test("wyjątek z NASZEGO kodu nie wychodzi do gry", () => {
    // Gdyby wyszedł, awaria licznika zabierałaby graczowi turę. To ostrzejszy
    // wymóg niż przy panelu, gdzie wyjątek psuje tylko liczby.
    const { globals, battle } = gra(() => "ok");
    const z = zegar();
    new EngineProtocolSource(globals, roster(), z).subscribe(() => {
      throw new Error("licznik padł");
    });

    const update = battle["update"] as (...a: unknown[]) => unknown;
    expect(() => update({ m: ["0;0;txt=start"] })).not.toThrow();
    expect(update({ m: ["0;0;txt=start"] })).toBe("ok");
  });

  test("`unsubscribe` przywraca oryginał i gasi zegar", () => {
    const oryginal = () => "ok";
    const { globals, battle } = gra(oryginal);
    const z = zegar();
    const odepnij = new EngineProtocolSource(globals, roster(), z).subscribe(() => {});

    expect(battle["update"]).not.toBe(oryginal);
    odepnij();
    expect(battle["update"]).toBe(oryginal);
    expect(z.czyAnulowany()).toBe(true);
  });

  test("NIE zdejmujemy cudzej warstwy", () => {
    // Inny dodatek owinął `update` po nas. Przywrócenie naszego oryginału
    // skasowałoby go bez śladu — cudzy kod nie jest nasz do naprawiania.
    const { globals, battle } = gra(() => "ok");
    const z = zegar();
    const odepnij = new EngineProtocolSource(globals, roster(), z).subscribe(() => {});

    const cudza = () => "cudze";
    battle["update"] = cudza;
    odepnij();

    expect(battle["update"]).toBe(cudza);
  });

  test("drugie założenie warstwy na TEN SAM obiekt nie nakłada się na siebie", () => {
    let wywolania = 0;
    const { globals, battle } = gra(() => {
      wywolania += 1;
      return "ok";
    });
    const z = zegar();
    new EngineProtocolSource(globals, roster(), z).subscribe(() => {});
    const poPierwszym = battle["update"];
    z.tik();
    z.tik();

    expect(battle["update"]).toBe(poPierwszym);
    (battle["update"] as () => unknown)();
    expect(wywolania).toBe(1);
  });
});

describe("EngineProtocolSource: co dociera do słuchacza", () => {
  test("komunikaty NARASTAJĄ w obrębie walki", () => {
    // `dekoduj` bierze całą walkę, nie porcję — inaczej stan przyrostowy dałby
    // podwójne liczenie. Ten test pilnuje, że porcje się sumują.
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const widziane: BattleEvent[][] = [];
    new EngineProtocolSource(globals, roster(), z).subscribe((e) => widziane.push(e));

    const update = battle["update"] as (...a: unknown[]) => unknown;
    update({ m: ["1=100.00;2=90.00;+dmg=10;-dmg=10"] });
    update({ m: ["1=100.00;2=80.00;+dmg=20;-dmg=20"] });

    expect(widziane).toHaveLength(2);
    expect(widziane[0]!.filter((e) => e.kind === "attack")).toHaveLength(1);
    expect(widziane[1]!.filter((e) => e.kind === "attack")).toHaveLength(2);
  });

  test("podmiana obiektu walki ZERUJE bufor — druga walka nie liczy pierwszej", () => {
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const widziane: BattleEvent[][] = [];
    new EngineProtocolSource(globals, roster(), z).subscribe((e) => widziane.push(e));

    (battle["update"] as (...a: unknown[]) => unknown)({
      m: ["1=100.00;2=90.00;+dmg=10;-dmg=10"],
    });

    // Gra tworzy nowy obiekt walki przy każdej walce.
    const nowy: Record<string, unknown> = { update: () => undefined };
    (globals.Engine as { battle: unknown }).battle = nowy;
    z.tik();
    (nowy["update"] as (...a: unknown[]) => unknown)({
      m: ["1=100.00;2=70.00;+dmg=30;-dmg=30"],
    });

    expect(widziane.at(-1)!.filter((e) => e.kind === "attack")).toHaveLength(1);
  });

  test("ładunek bez `m` nie budzi słuchacza", () => {
    // `update` leci też przy samej zmianie tury albo życia. Wołanie słuchacza
    // bez nowych komunikatów przeliczałoby walkę bez powodu.
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    let wolan = 0;
    new EngineProtocolSource(globals, roster(), z).subscribe(() => {
      wolan += 1;
    });

    const update = battle["update"] as (...a: unknown[]) => unknown;
    update({ current: 3 });
    update({});
    update(undefined);

    expect(wolan).toBe(0);
  });

  test("`t.m` jako OBIEKT, nie tablica, też przechodzi", () => {
    // Gra iteruje `for (var i in data.m)`, więc jednego kształtu nie obiecuje.
    // Obrona na zapas — obiektu nikt jeszcze nie widział.
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const widziane: BattleEvent[][] = [];
    new EngineProtocolSource(globals, roster(), z).subscribe((e) => widziane.push(e));

    (battle["update"] as (...a: unknown[]) => unknown)({
      m: { "0": "1=100.00;2=90.00;+dmg=10;-dmg=10" },
    });

    expect(widziane.at(-1)!.filter((e) => e.kind === "attack")).toHaveLength(1);
  });

  test("brak składu nie wywraca źródła — zdarzenia idą do czujki jako nieznane", () => {
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const widziane: BattleEvent[][] = [];
    new EngineProtocolSource(globals, roster(null), z).subscribe((e) => widziane.push(e));

    (battle["update"] as (...a: unknown[]) => unknown)({
      m: ["1=100.00;2=90.00;+dmg=10;-dmg=10"],
    });

    expect(widziane.at(-1)!.every((e) => e.kind === "unknown")).toBe(true);
  });
});

describe("EngineProtocolSource: gra, której nie ma", () => {
  test("brak Engine nie rzuca", () => {
    const z = zegar();
    const odepnij = new EngineProtocolSource({} as GameGlobals, roster(), z).subscribe(() => {});
    expect(() => z.tik()).not.toThrow();
    expect(() => odepnij()).not.toThrow();
  });

  test("dostęp rzucający wyjątkiem jest przełknięty", () => {
    // Dostęp do wnętrzności gry potrafi rzucić przy zmianie kontekstu strony —
    // ta sama osłona co w `roster.ts:81‑87`.
    const globals = {
      get Engine(): never {
        throw new Error("kontekst zniknął");
      },
    } as unknown as GameGlobals;
    const z = zegar();
    expect(() =>
      new EngineProtocolSource(globals, roster(), z).subscribe(() => {}),
    ).not.toThrow();
  });

  test("`battle` bez `update` jest pomijany, a nie owijany", () => {
    const globals = { Engine: { battle: {} } } as GameGlobals;
    const z = zegar();
    expect(() =>
      new EngineProtocolSource(globals, roster(), z).subscribe(() => {}),
    ).not.toThrow();
  });
});
