import { describe, expect, test } from "bun:test";
import {
  EngineProtocolSource,
  StaticProtocolSource,
  type PorcjaProtokolu,
} from "../src/protokol-source.ts";
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

/** Jeden cios Kamila w Lochę za 100 — komunikat, nie zdarzenie. */
const CIOS = "1=100.00;2=40.37;+dmgd=100;-dmgd=100";

/** Suma obrażeń SUROWYCH ze zdarzeń — po niej widać podwojenie. */
function obrazenia(zdarzenia: BattleEvent[]): number {
  return zdarzenia
    .filter((z) => z.kind === "attack")
    .reduce((suma, z) => suma + z.hits.reduce((s, h) => s + h.raw, 0), 0);
}

describe("StaticProtocolSource", () => {
  test("oddaje zdarzenia raz i nie wymaga gry", () => {
    const widziane: BattleEvent[][] = [];
    new StaticProtocolSource(["0;0;txt=start"]).subscribe((p) => widziane.push(p.zdarzenia));
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

  /**
   * ⚠️ **DRUGA POŁOWA UMOWY, KTÓREJ NIE BYŁO DO 2026‑08‑07** (`AUDYT‑107`).
   * Test wyżej („NIE zdejmujemy cudzej warstwy") pilnował ZDEJMOWANIA; przy
   * ZAKŁADANIU ta sama sytuacja nie była rozpoznawana i kosztowała ×2 na
   * liczbach, całkowicie po cichu.
   *
   * Dlaczego to jest gorsze niż zamilknięcie: zamilknięcie zapala graczowi
   * komunikat o spóźnionym podpięciu (`stan-odczytu.ts`), a podwojona liczba
   * nie zapala niczego — `unknownLines` zostaje zerem, bo każdy komunikat jest
   * poprawny. Jest po prostu policzony dwa razy.
   */
  test("cudza warstwa NA WIERZCHU nie każe nam owijać drugi raz", () => {
    const { globals, battle } = gra(() => "ok");
    const z = zegar();
    const porcje: PorcjaProtokolu[] = [];
    new EngineProtocolSource(globals, roster(), z).subscribe((p) => porcje.push(p));

    // Inny dodatek owija to, co zastał — czyli NASZE opakowanie. Nasza warstwa
    // nadal siedzi w łańcuchu i nadal widzi każde wywołanie dokładnie raz.
    const nasza = battle["update"] as (...a: unknown[]) => unknown;
    battle["update"] = function (this: unknown, ...a: unknown[]) {
      return nasza.apply(this, a);
    };
    const cudza = battle["update"];

    z.tik();
    z.tik();

    // Nie podmieniamy cudzej warstwy — tak samo jak przy zdejmowaniu.
    expect(battle["update"]).toBe(cudza);

    (battle["update"] as (t: unknown) => unknown)({ m: [CIOS] });

    // JEDEN cios w gra = JEDEN komunikat w buforze. Przed naprawą były dwa,
    // bo nasze opakowanie stało w łańcuchu dwa razy i oba dopisywały do tego
    // samego bufora.
    expect(porcje.at(-1)!.komunikaty).toEqual([CIOS]);
    expect(obrazenia(porcje.at(-1)!.zdarzenia)).toBe(100);
  });
});

describe("EngineProtocolSource: co dociera do słuchacza", () => {
  test("komunikaty NARASTAJĄ w obrębie walki", () => {
    // `dekoduj` bierze całą walkę, nie porcję — inaczej stan przyrostowy dałby
    // podwójne liczenie. Ten test pilnuje, że porcje się sumują.
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const widziane: BattleEvent[][] = [];
    new EngineProtocolSource(globals, roster(), z).subscribe((p) => widziane.push(p.zdarzenia));

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
    new EngineProtocolSource(globals, roster(), z).subscribe((p) => widziane.push(p.zdarzenia));

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

  /**
   * GRANICĄ WALKI JEST `data.init` — i to jest ważniejszy test od tego wyżej.
   *
   * ⚠️ Tamten opisuje warunek WYSTARCZAJĄCY, którym gra się nie posługuje:
   * `Engine.battle` powstaje raz i żyje całą sesję, zmienia się jego stan, nie
   * referencja (`docs/MECHANIKA.md`, wpis „Granica walk"). Dopóki zerowanie
   * stało wyłącznie na tożsamości obiektu, druga walka doliczała się do
   * pierwszej — zmierzone na panelu: 2644 → 5288 obrażeń, 12 → 24 tury
   * (`AUDYT‑56`). Ten test pilnuje drogi, którą gra NAPRAWDĘ chodzi.
   */
  test("`data.init` ZERUJE bufor, choć obiekt walki zostaje ten sam", () => {
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const widziane: BattleEvent[][] = [];
    new EngineProtocolSource(globals, roster(), z).subscribe((p) => widziane.push(p.zdarzenia));
    const update = battle["update"] as (...a: unknown[]) => unknown;

    update({ m: ["1=100.00;2=90.00;+dmg=10;-dmg=10"] });
    expect(widziane.at(-1)!.filter((e) => e.kind === "attack")).toHaveLength(1);

    // Koniec pierwszej walki i początek drugiej — TEN SAM obiekt `battle`,
    // dokładnie tak, jak w jedynym zrzucie z gry, który to pokazał.
    update({ init: "1", myteam: 1 });
    update({ m: ["1=100.00;2=70.00;+dmg=30;-dmg=30"] });

    // Jedno trafienie, nie dwa: komunikat pierwszej walki nie należy do drugiej.
    expect(widziane.at(-1)!.filter((e) => e.kind === "attack")).toHaveLength(1);
  });

  test("`init` PIERWSZEJ walki po podpięciu nie odcina jej drugi raz", () => {
    // Podpięcie się już odcięło walkę (nowy obiekt `battle`), więc jej własny
    // `init` nie ma czego dzielić. Bez tego pierwszy zrzut w sesji nosiłby
    // numer 2, a `otwarcia` szukałyby linii pod numerem, którego nikt nie ma.
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const walki: number[] = [];
    let numer = 0;
    new EngineProtocolSource(globals, roster(), {
      ...z,
      kolekcjoner: {
        nowaWalka: () => void walki.push((numer += 1)),
        przed: () => null,
        po: () => {},
      },
    }).subscribe(() => {});

    const update = battle["update"] as (...a: unknown[]) => unknown;
    update({ init: "1", myteam: 1 });

    // Jedno odcięcie — z podpięcia. `init` tej samej walki go nie powtarza.
    expect(walki).toEqual([1]);

    // Ale `init` NASTĘPNEJ walki już tak.
    update({ m: ["1=100.00;2=90.00;+dmg=10;-dmg=10"] });
    update({ init: "1", myteam: 1 });
    expect(walki).toEqual([1, 2]);
  });

  test("awaria GRY tuż po odcięciu nie gubi granicy NASTĘPNEJ walki", () => {
    // ⚠️ Znalezione przy przeglądzie własnej naprawy `AUDYT‑56`, nie w audycie —
    // i pierwsza wersja tego testu była ZIELONA przy zepsutym kodzie, bo
    // odtwarzała nie ten moment. Flaga `swiezaWalka` jest `true` tylko TUŻ PO
    // odcięciu; żeby awaria gry miała znaczenie, musi paść dokładnie wtedy.
    //
    // Wyjątek z `oryginal.apply` jest błędem GRY i leci dalej nietknięty. Gdyby
    // zabrał ze sobą wyzerowanie flagi (czyli gdyby nie stała w `finally`),
    // NASTĘPNY `init` zostałby przeoczony jako „ta sama świeża walka" — i zrzut
    // zapisałby dwie walki pod jednym numerem.
    let psuj = true;
    const { globals, battle } = gra(() => {
      if (psuj) throw new Error("gra padła na tej porcji");
      return undefined;
    });
    const z = zegar();
    const walki: number[] = [];
    let numer = 0;
    new EngineProtocolSource(globals, roster(), {
      ...z,
      kolekcjoner: {
        nowaWalka: () => void walki.push((numer += 1)),
        przed: () => null,
        po: () => {},
      },
    }).subscribe(() => {});
    const update = battle["update"] as (...a: unknown[]) => unknown;

    // Podpięcie odcięło pierwszą walkę, więc flaga jest podniesiona.
    expect(walki).toEqual([1]);

    // I właśnie teraz gra się wywraca. Jej wyjątek MA wyjść do gry.
    expect(() => update({ m: ["1=100.00;2=90.00;+dmg=10;-dmg=10"] })).toThrow(/gra padła/);
    psuj = false;

    // Granica następnej walki musi nadal działać.
    update({ init: "1", myteam: 1 });
    expect(walki).toEqual([1, 2]);
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
    new EngineProtocolSource(globals, roster(), z).subscribe((p) => widziane.push(p.zdarzenia));

    (battle["update"] as (...a: unknown[]) => unknown)({
      m: { "0": "1=100.00;2=90.00;+dmg=10;-dmg=10" },
    });

    expect(widziane.at(-1)!.filter((e) => e.kind === "attack")).toHaveLength(1);
  });

  test("brak składu nie wywraca źródła — zdarzenia idą do czujki jako nieznane", () => {
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const widziane: BattleEvent[][] = [];
    new EngineProtocolSource(globals, roster(null), z).subscribe((p) => widziane.push(p.zdarzenia));

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

describe("porcja niesie SUROWY materiał, nie tylko odczyt", () => {
  /**
   * Nagrywarka zapisuje `komunikaty`, a nie `zdarzenia` — ta sama zasada, dla
   * której nagrania trzymały wcześniej surowy tekst zamiast policzonych
   * statystyk: nagranie ma dać się przeliczyć NOWSZYM dekoderem. Bez tego
   * pierwsza łatka w dekoderze unieważnia całe archiwum.
   */
  test("komunikaty jadą razem ze zdarzeniami i NARASTAJĄ", () => {
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const widziane: (readonly string[])[] = [];
    new EngineProtocolSource(globals, roster(), z).subscribe((p) => widziane.push(p.komunikaty));

    const update = battle["update"] as (...a: unknown[]) => unknown;
    update({ m: ["1=100.00;2=90.00;+dmg=10;-dmg=10"] });
    update({ m: ["0;0;winner=Kamil"] });

    expect(widziane[0]).toEqual(["1=100.00;2=90.00;+dmg=10;-dmg=10"]);
    expect(widziane[1]).toEqual(["1=100.00;2=90.00;+dmg=10;-dmg=10", "0;0;winner=Kamil"]);
  });

  test("skład jedzie razem — bez niego `id` nie ma jak stać się nazwą", () => {
    // Archiwum odtwarza nagranie po zamknięciu gry, więc nie ma skąd wziąć
    // rostera. Musi przyjść w porcji i zostać zapisany razem z komunikatami.
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const widziane: RosterEntry[][] = [];
    new EngineProtocolSource(globals, roster(), z).subscribe((p) => widziane.push([...p.sklad]));

    (battle["update"] as (...a: unknown[]) => unknown)({
      m: ["1=100.00;2=90.00;+dmg=10;-dmg=10"],
    });

    expect(widziane.at(-1)).toEqual(SKLAD);
  });

  test("kopia, nie żywa referencja — kolejna porcja nie przepisuje poprzedniej", () => {
    // `this.komunikaty` rośnie w miejscu. Oddanie go wprost sprawiłoby, że
    // nagranie zapisane przy porcji 1 zmieniłoby się po porcji 2 — a nagrywarka
    // porównuje z nim treść, żeby wiedzieć, czy jest co zapisywać.
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const widziane: (readonly string[])[] = [];
    new EngineProtocolSource(globals, roster(), z).subscribe((p) => widziane.push(p.komunikaty));

    const update = battle["update"] as (...a: unknown[]) => unknown;
    update({ m: ["0;0;txt=a"] });
    update({ m: ["0;0;txt=b"] });

    expect(widziane[0]).toHaveLength(1);
  });
});

/** Roster oddający kolejne migawki — gra podaje przy każdym wywołaniu inny stan. */
const rosterKolejno = (...migawki: (RosterEntry[] | null)[]): RosterSource => {
  let i = 0;
  return { current: () => migawki[Math.min(i++, migawki.length - 1)] ?? null };
};

/**
 * Skład NARASTA i nie ma prawa zniknąć w trakcie walki.
 *
 * ⚠️ **TU SIEDZIAŁ NAJDROŻSZY BŁĄD TEGO PLIKU** (znaleziony audytem 2026‑08‑05).
 * Źródło brało samą BIEŻĄCĄ migawkę i podawało `?? []` dalej, a dekoder zamienia
 * `id` na nazwę wyłącznie po tej liście — przy czym dekodujemy CAŁĄ walkę od
 * nowa przy każdej porcji. Jedna migawka, której gra nie wystawiła, unieważniała
 * więc cały dotychczasowy odczyt: zmierzone na `tests/walka-z-gry.ts` 17 zdarzeń,
 * 0 nieznanych i 2883 obrażeń zadanych zamieniało się w 14 nieznanych i 0 obrażeń.
 *
 * Kosztowało to podwójnie, bo `Recorder.capture` nadpisuje składem nagranie —
 * pusta migawka na końcu walki zapisywała się NA TRWAŁE.
 */
describe("EngineProtocolSource: skład walki narasta", () => {
  test("migawka `null` nie kasuje tego, co już wiemy", () => {
    // `null` znaczy „gra akurat nie wystawia stanu", a nie „walka nie ma
    // uczestników". Odczyt leci PO oryginalnym `update`, więc na komunikacie
    // zamykającym walkę gra może mieć stan już posprzątany.
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const widziane: RosterEntry[][] = [];
    new EngineProtocolSource(globals, rosterKolejno(SKLAD, null), z).subscribe((p) =>
      widziane.push([...p.sklad]),
    );

    const update = battle["update"] as (...a: unknown[]) => unknown;
    update({ m: ["1=100.00;2=90.00;+dmg=10;-dmg=10"] });
    update({ m: ["0;0;winner=Kamil"] });

    expect(widziane.at(-1)).toEqual(SKLAD);
  });

  test("liczby przeżywają zniknięcie składu, a nie tylko nazwy", () => {
    // Sedno, i dlatego asercja idzie po ZDARZENIACH, a nie po `p.sklad`:
    // to nie skład jest produktem, tylko odczyt, który bez niego pada do zera.
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const widziane: BattleEvent[][] = [];
    new EngineProtocolSource(globals, rosterKolejno(SKLAD, null), z).subscribe((p) =>
      widziane.push(p.zdarzenia),
    );

    const update = battle["update"] as (...a: unknown[]) => unknown;
    update({ m: ["1=100.00;2=90.00;+dmg=10;-dmg=10"] });
    update({ m: ["1=100.00;2=80.00;+dmg=10;-dmg=10"] });

    const ostatnie = widziane.at(-1)!;
    expect(ostatnie.filter((e) => e.kind === "unknown")).toEqual([]);
    expect(ostatnie.filter((e) => e.kind === "attack")).toHaveLength(2);
  });

  test("uboższa migawka nie zdejmuje nikogo — postać, która padła, zostaje w składzie", () => {
    // Gra potrafi podać przy kolejnym wywołaniu mniej wojowników. Gdyby skład
    // szedł za tym w dół, komunikaty POLEGŁEJ postaci — już odczytane — stałyby
    // się nieznane przy następnym przeliczeniu i jej obrażenia zniknęłyby
    // z panelu w środku walki.
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const widziane: RosterEntry[][] = [];
    new EngineProtocolSource(globals, rosterKolejno(SKLAD, [SKLAD[0]!]), z).subscribe((p) =>
      widziane.push([...p.sklad]),
    );

    const update = battle["update"] as (...a: unknown[]) => unknown;
    update({ m: ["1=100.00;2=90.00;+dmg=10;-dmg=10"] });
    update({ m: ["1=100.00;2=0.00;+dmg=10;-dmg=10"] });

    expect(widziane.at(-1)).toEqual(SKLAD);
  });

  test("późniejsza migawka NADPISUJE wpis o tym samym `id`", () => {
    // Narastanie nie znaczy zamrożenia: przyzwany dochodzi, a poprawiona nazwa
    // albo strona ma wygrać. Inaczej pierwsza migawka rządziłaby całą walką.
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const widziane: RosterEntry[][] = [];
    const poprawiony: RosterEntry[] = [{ id: 2, name: "Locha", side: 1, lvl: 40 }];
    new EngineProtocolSource(globals, rosterKolejno(SKLAD, poprawiony), z).subscribe((p) =>
      widziane.push([...p.sklad]),
    );

    const update = battle["update"] as (...a: unknown[]) => unknown;
    update({ m: ["0;0;txt=a"] });
    update({ m: ["0;0;txt=b"] });

    expect(widziane.at(-1)).toEqual([SKLAD[0]!, { id: 2, name: "Locha", side: 1, lvl: 40 }]);
  });

  test("NOWA walka zaczyna od pustego składu, a nie od poprzedniego", () => {
    // Druga strona tej samej reguły. Gdyby skład przeżył podmianę obiektu walki,
    // `id` z nowej walki rozwiązywałyby się po nazwach ze starej — czyli panel
    // pokazywałby postacie, których w tej walce nie ma.
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    const widziane: RosterEntry[][] = [];
    const drugi: RosterEntry[] = [{ id: 9, name: "Wilk", side: 1 }];
    new EngineProtocolSource(globals, rosterKolejno(SKLAD, drugi), z).subscribe((p) =>
      widziane.push([...p.sklad]),
    );

    (battle["update"] as (...a: unknown[]) => unknown)({ m: ["0;0;txt=a"] });

    // Gra podmienia obiekt walki razem z walką — tożsamość, nie zawartość.
    const nowaBattle: Record<string, unknown> = { update: () => undefined };
    (globals.Engine as { battle?: unknown }).battle = nowaBattle;
    z.tik();
    (nowaBattle["update"] as (...a: unknown[]) => unknown)({ m: ["0;0;txt=b"] });

    expect(widziane.at(-1)).toEqual(drugi);
  });
});

/**
 * Kolekcjoner zrzutu (`src/zrzut.ts`) wpięty w TO SAMO owinięcie.
 *
 * Po co osobny blok: zbieranie fixture'ów dokłada nasz kod PRZED oryginalnym
 * `update` — a do tej pory wszystko, co robiliśmy, działo się po nim. To jedyne
 * miejsce, w którym nasza awaria potrafi przewrócić graczowi turę, zanim gra
 * cokolwiek policzy. Te testy pilnują, że nie potrafi.
 */
describe("EngineProtocolSource: zbieranie zrzutu", () => {
  /** Atrapa kolekcjonera z zapisem kolejności wywołań. */
  function kolekcjoner(rzuc: { przed?: boolean; po?: boolean } = {}) {
    const slad: string[] = [];
    return {
      slad,
      atrapa: {
        przed: () => {
          slad.push("przed");
          if (rzuc.przed) throw new Error("kolekcjoner padł przed oryginałem");
          return [{ id: 1, name: "Kamil", team: 1, prof: null, lvl: null, hp: null, mana: null, energy: null, ac: null }];
        },
        po: () => {
          slad.push("po");
          if (rzuc.po) throw new Error("kolekcjoner padł po oryginale");
        },
        nowaWalka: () => void slad.push("nowaWalka"),
      },
    };
  }

  test("migawka „przed” powstaje PRZED oryginałem, a zapis PO nim", () => {
    const k = kolekcjoner();
    const { globals, battle } = gra(() => void k.slad.push("oryginał"));
    new EngineProtocolSource(globals, roster(), {
      ...zegar(),
      kolekcjoner: k.atrapa,
    }).subscribe(() => {});

    (battle["update"] as (...a: unknown[]) => unknown)({ m: ["0;0;txt=a"] });

    // `nowaWalka` leci przy podpięciu, bo to pierwsza walka tej sesji.
    expect(k.slad).toEqual(["nowaWalka", "przed", "oryginał", "po"]);
  });

  test("rzucający kolekcjoner PRZED oryginałem nie przewraca `update`", () => {
    const k = kolekcjoner({ przed: true });
    const { globals, battle } = gra(() => "wynik oryginału");
    const widziane: unknown[] = [];
    new EngineProtocolSource(globals, roster(), {
      ...zegar(),
      kolekcjoner: k.atrapa,
    }).subscribe((p) => widziane.push(p.zdarzenia));

    const update = battle["update"] as (...a: unknown[]) => unknown;
    expect(() => update({ m: ["0;0;txt=a"] })).not.toThrow();
    expect(update({ m: ["0;0;txt=b"] })).toBe("wynik oryginału");
    // Odczyt leci dalej, mimo że zbieranie padło.
    expect(widziane).toHaveLength(2);
  });

  test("rzucający kolekcjoner PO oryginale nie zatrzymuje licznika", () => {
    // Narzędzie deweloperskie nie ma prawa zamrozić panelu. We wspólnym `try`
    // rzucone `po()` przeskakiwałoby `przyjmij` i panel stanąłby po cichu.
    const k = kolekcjoner({ po: true });
    const { globals, battle } = gra(() => undefined);
    const widziane: unknown[] = [];
    new EngineProtocolSource(globals, roster(), {
      ...zegar(),
      kolekcjoner: k.atrapa,
    }).subscribe((p) => widziane.push(p.zdarzenia));

    (battle["update"] as (...a: unknown[]) => unknown)({ m: ["0;0;txt=a"] });

    expect(widziane).toHaveLength(1);
  });

  test("podmiana obiektu walki zgłasza kolekcjonerowi NOWĄ WALKĘ", () => {
    const k = kolekcjoner();
    const { globals, battle } = gra(() => undefined);
    const z = zegar();
    new EngineProtocolSource(globals, roster(), { ...z, kolekcjoner: k.atrapa }).subscribe(() => {});
    (battle["update"] as (...a: unknown[]) => unknown)({ m: ["0;0;txt=a"] });

    const nowaBattle: Record<string, unknown> = { update: () => undefined };
    (globals.Engine as { battle?: unknown }).battle = nowaBattle;
    z.tik();

    expect(k.slad.filter((s) => s === "nowaWalka")).toHaveLength(2);
  });

  test("bez kolekcjonera nic się nie zmienia", () => {
    const { globals, battle } = gra(() => "wynik oryginału");
    const widziane: unknown[] = [];
    new EngineProtocolSource(globals, roster(), zegar()).subscribe((p) =>
      widziane.push(p.zdarzenia),
    );

    expect((battle["update"] as (...a: unknown[]) => unknown)({ m: ["0;0;txt=a"] })).toBe(
      "wynik oryginału",
    );
    expect(widziane).toHaveLength(1);
  });
});
