import { describe, expect, test } from "bun:test";
import {
  aggregate,
  EMPTY_STATS,
  invertBreakdown,
  leadsDeeper,
  UNATTRIBUTED_SOURCE,
  BACKGROUND_ACTOR,
  totalBySide,
  type Aggregate,
} from "../src/stats.ts";
import { dotLabel, typeDisplay, type AttackerBreakdown, type BattleEvent } from "../src/types.ts";
import { TYPE_COLORS } from "../src/palette.ts";
import { EngineRosterSource, type RosterEntry } from "../src/roster.ts";
import {
  cios,
  krok,
  leczenie,
  nieznane,
  otwarcie,
  trafienie,
  tykniecie,
  umiejetnosc,
} from "./zdarzenia.ts";
import { KORPUS } from "./korpus.ts";
import { dekoduj } from "../src/protokol.ts";
import { SlownikStaly } from "../src/slownik-gry.ts";
import { KOMUNIKATY as KOMUNIKATY_Z_GRY, SKLAD as SKLAD_Z_GRY } from "./walka-z-gry.ts";


/**
 * Materiał dla niezmienników — `tests/korpus.ts`, czyli STRUMIENIE ZDARZEŃ.
 *
 * ⚠️ **DO 2026‑08‑04 STAŁO TU 25 PRAWDZIWYCH WALK**, czytanych z plików
 * i przepuszczanych przez odczyt ze zdań. Zestaw zszedł z drzewa i to jest
 * największa strata tej rundy: kształt, o którym nie pomyśleliśmy, nie ma jak
 * wpaść do materiału, który sami budujemy — a tamten łapał je sam z siebie.
 * Niezmienniki niżej zostały te same; uboższy jest materiał, po którym chodzą.
 *
 * Co konkretnie przestało być pokryte, mówi `tests/korpus.ts` i `AGENTS.md`.
 */

const tier = (label: string, by: Array<[string, number, number]>): AttackerBreakdown => ({
  label,
  amount: by.reduce((sum, [, amount]) => sum + amount, 0),
  hits: by.reduce((sum, [, , hits]) => sum + hits, 0),
  by: by.map(([leaf, amount, hits]) => ({ label: leaf, amount, hits })),
});

describe("invertBreakdown", () => {
  test("zamienia szczeble miejscami, sumując po nowym kluczu", () => {
    const byTarget = [
      tier("Regulus", [
        ["Cios mocy", 100, 2],
        ["Zwykły atak", 40, 1],
      ]),
      tier("Gnoll", [["Cios mocy", 60, 1]]),
    ];

    expect(invertBreakdown(byTarget)).toEqual([
      {
        label: "Cios mocy",
        amount: 160,
        hits: 3,
        by: [
          { label: "Regulus", amount: 100, hits: 2 },
          { label: "Gnoll", amount: 60, hits: 1 },
        ],
      },
      {
        label: "Zwykły atak",
        amount: 40,
        hits: 1,
        by: [{ label: "Regulus", amount: 40, hits: 1 }],
      },
    ]);
  });

  test("oba szczeble malejąco po obrażeniach", () => {
    const inverted = invertBreakdown([
      tier("Słaby cel", [["Kopniak", 1, 1]]),
      tier("Mocny cel", [["Kopniak", 500, 1]]),
      tier("Średni cel", [["Kopniak", 50, 1]]),
    ]);

    expect(inverted[0]!.by.map((one) => one.label)).toEqual(["Mocny cel", "Średni cel", "Słaby cel"]);
  });

  test("puste rozbicie zostaje puste", () => {
    expect(invertBreakdown([])).toEqual([]);
    expect(invertBreakdown([tier("Nikt", [])])).toEqual([]);
  });

  test("odwrócone dwa razy wraca do siebie", () => {
    const byTarget = [
      tier("Regulus", [
        ["Cios mocy", 100, 2],
        ["Zwykły atak", 40, 1],
      ]),
      tier("Gnoll", [["Cios mocy", 60, 1]]),
    ];

    expect(invertBreakdown(invertBreakdown(byTarget))).toEqual(byTarget);
  });
});

describe("leadsDeeper", () => {
  test("pozycja z kilkoma celami prowadzi głębiej", () => {
    expect(leadsDeeper(tier("Cios mocy", [["Regulus", 100, 1], ["Gnoll", 60, 1]]))).toBe(true);
  });

  test("pozycja z jednym, ale INNYM celem też prowadzi głębiej", () => {
    expect(leadsDeeper(tier("Cios mocy", [["Regulus", 100, 1]]))).toBe(true);
  });

  // Wejście w pozycję, pod którą stoi ona sama, pokazałoby wiersz powtarzający
  // sam siebie. Trucizna bez sprawcy stała tak, zanim zebrała się pod pozycją
  // „Bez sprawcy" — reguła zostaje, bo dotyczy KSZTAŁTU rozbicia, nie trucizny.
  test("pozycja wskazująca wyłącznie na samą siebie jest liściem", () => {
    expect(leadsDeeper(tier("Trucizna", [["Trucizna", 330, 3]]))).toBe(false);
  });

  test("pozycja bez celów jest liściem", () => {
    expect(leadsDeeper(tier("Cokolwiek", []))).toBe(false);
  });
});

/**
 * Niezmiennik, na którym stoi cała sekcja „CZYM (ŁĄCZNIE)”.
 *
 * Panel liczy tę listę przez odwrócenie `dealtToBy`, a nie z gotowego
 * `dealtBy` — bo drugi szczebel (komu ta umiejętność zadała) i tak musi wyjść
 * z rozbicia po parze. `dealtBy` jest tu WYROCZNIĄ: jeśli obie drogi kiedykolwiek
 * się rozjadą, panel pokaże inną sumę niż agregat i nikt tego nie zauważy.
 */
describe.each(KORPUS)("$name — odwrócenie zgadza się z dealtBy", (fixture) => {
  test("etykieta po etykiecie, nie tylko sumą", async () => {
    const stats = aggregate(fixture.events);

    for (const actor of stats.actors) {
      const inverted = new Map(invertBreakdown(actor.dealtToBy).map((one) => [one.label, one]));
      const flat = new Map(actor.dealtBy.map((one) => [one.label, one]));

      expect([...inverted.keys()].sort()).toEqual([...flat.keys()].sort());
      for (const [label, entry] of flat) {
        expect({ label, amount: inverted.get(label)?.amount, hits: inverted.get(label)?.hits }).toEqual(
          { label, amount: entry.amount, hits: entry.hits },
        );
      }
    }
  });

  test("suma odwrócenia to obrażenia zadane postaci", async () => {
    const stats = aggregate(fixture.events);

    for (const actor of stats.actors) {
      const total = invertBreakdown(actor.dealtToBy).reduce((sum, one) => sum + one.amount, 0);
      // Trucizna bez przypisanego sprawcy nie wchodzi do rozbicia po parze,
      // więc porównujemy z sumą samego rozbicia, nie z `damageDealt`.
      const viaTargets = actor.dealtToBy.reduce((sum, one) => sum + one.amount, 0);
      expect(total).toBe(viaTargets);
    }
  });
});

/**
 * ROZDZIELANIE INSTANCJI PO `id` — odczyt zamiast zgadywania.
 *
 * ⚠️ **Do 2026‑08‑05 ta korzyść z protokołu nie była zrealizowana.** `AGENTS.md`
 * uzasadniał przejście na protokół m.in. tym, że niesie on `id` po obu stronach
 * każdego zdarzenia, więc rozdzielanie postaci o tej samej nazwie jest DARMOWE —
 * a `dekoduj` zamieniał `id` na nazwę przy wejściu i identyfikator wyrzucał.
 * `stats.ts` dalej zgadywał po spadku życia, choć odpowiedź stała w komunikacie.
 *
 * Warunek jest ZERO-JEDYNKOWY per nazwa: skład musi mieć `id` przy każdym wpisie
 * tej nazwy i każde jej wystąpienie w zdarzeniach musi nieść pasujący `id`.
 * Inaczej ta sama postać dostałaby w jednej walce dwa różne numery.
 */
describe("instancje po identyfikatorze", () => {
  const DWA_ODYNCE: RosterEntry[] = [
    { id: 1, name: "Kamil", side: 0 },
    { id: 3, name: "Odyniec", side: 1 },
    { id: 4, name: "Odyniec", side: 1 },
  ];

  test("dwie postacie o tej samej nazwie i tym samym życiu dostają SWOJE obrażenia", () => {
    // Sedno. Obie schodzą do 90%, więc heurystyka nie ma czego rozróżnić —
    // „ostatnio aktywna" zgarniała obie linie i pokazywała 20/0.
    const stats = aggregate(
      dekoduj(
        ["1=100.00;3=90.00;+dmg=10;-dmg=10", "1=100.00;4=90.00;+dmg=10;-dmg=10"],
        DWA_ODYNCE,
      ),
      DWA_ODYNCE,
    );
    const taken = (name: string) => stats.actors.find((a) => a.name === name)!.damageTaken;

    expect(taken("Odyniec #1")).toBe(10);
    expect(taken("Odyniec #2")).toBe(10);
    // Numer jest odczytany, nie zgadnięty — więc gwiazdki niepewności nie ma.
    expect(stats.ambiguousNames).toEqual([]);
  });

  test("numer idzie z kolejności SKŁADU, nie z kolejności ujawniania w logu", () => {
    // ⚠️ Dlaczego to jest osobny test: heurystyka numerowała w kolejności, w
    // jakiej log pokazuje postacie. Log rośnie, a przeliczamy go CAŁY przy
    // każdej porcji — numer potrafił się więc przesunąć między klatkami panelu.
    // Z pozycji w składzie jest stały, choćby pierwszy oberwał ten drugi.
    const stats = aggregate(
      dekoduj(["1=100.00;4=90.00;+dmg=10;-dmg=10"], DWA_ODYNCE),
      DWA_ODYNCE,
    );
    const taken = (name: string) => stats.actors.find((a) => a.name === name)!.damageTaken;

    // `id: 4` jest DRUGI w składzie, więc jest `#2` — mimo że ujawnił się pierwszy.
    expect(taken("Odyniec #2")).toBe(10);
    expect(taken("Odyniec #1")).toBe(0);
  });

  test("CZĘŚCIOWE identyfikatory wyłączają tryb `id` dla całej nazwy", () => {
    // Gdyby część wystąpień szła po `id`, a część po spadku życia, ta sama
    // postać dostałaby w jednej walce dwa różne numery — błąd gorszy od tego,
    // który naprawiamy. Wystarczy JEDNO zdarzenie bez `id`, żeby cała nazwa
    // wróciła do heurystyki (i odzyskała gwiazdkę).
    const stats = aggregate(
      [...dekoduj(["1=100.00;3=90.00;+dmg=10;-dmg=10"], DWA_ODYNCE), krok("Odyniec", 90)],
      DWA_ODYNCE,
    );
    expect(stats.ambiguousNames).toEqual(["Odyniec #1", "Odyniec #2"]);
  });

  test("materiał z gry przestaje mieć gwiazdkę, a liczby zostają te same", () => {
    // Jedyna prawdziwa walka, jaką repo ma. Liczby nie mają drgnąć — zmiana
    // dotyczy tego, KOMU są przypisane, a nie ile ich jest.
    const stats = aggregate(dekoduj(KOMUNIKATY_Z_GRY, SKLAD_Z_GRY), SKLAD_Z_GRY);
    const dealt = (name: string) => stats.actors.find((a) => a.name === name)!.damageDealt;
    const taken = (name: string) => stats.actors.find((a) => a.name === name)!.damageTaken;

    expect(dealt("Łowcożyr Kazrek")).toBe(2784);
    // `-255967` stoi w składzie jako pierwszy Odyniec, więc jest `#1` — i to on
    // oddał cios za 99 oraz przyjął tyknięcie trucizny.
    expect(dealt("Odyniec #1")).toBe(99);
    expect(taken("Odyniec #1")).toBe(831);
    expect(taken("Odyniec #2")).toBe(1119);
    expect(stats.ambiguousNames).toEqual([]);
  });
});

describe("EMPTY_STATS jest współdzielonym singletonem", () => {
  // Siedzi naraz w `Session`, w `Overlay` i w obu argumentach pierwszego
  // `render()`. Dopóki nikt go nie mutuje, wszystko działa — a zamrożenie jest
  // tańsze niż nadzieja, że tak zostanie.
  test("nie da się go zmutować", () => {
    expect(Object.isFrozen(EMPTY_STATS)).toBe(true);
    // Zamrożenie obiektu jest płytkie, więc tablice osobno.
    expect(Object.isFrozen(EMPTY_STATS.actors)).toBe(true);
    expect(Object.isFrozen(EMPTY_STATS.timeline)).toBe(true);
    expect(Object.isFrozen(EMPTY_STATS.unattributedDotDamage)).toBe(true);
  });

  test("jest pusty pod każdym względem", () => {
    expect(EMPTY_STATS.actors).toEqual([]);
    expect(EMPTY_STATS.unknownLines).toBe(0);
    expect(totalBySide(EMPTY_STATS.unattributedDotDamage)).toBe(0);
  });
});
/**
 * Zranienie to JEDYNY DoT, przy którym log nazywa sprawcę wprost: proc
 * „+Zranienie (N)" stoi przy jego ciosie i zapowiada kwotę tyknięcia. Cała
 * atrybucja tego rodzaju stoi na tym, że kwota z proca zgadza się z kwotą
 * tyknięcia — więc jeśli kiedykolwiek przestanie, wiązanie trzeba wycofać, a nie
 * naprawiać. Ten test jest po to, żeby to było widać od razu.
 */
describe.each(KORPUS)("$name — zranienie zgadza się z proca", (fixture) => {
  test("każde tyknięcie ma proc o tej samej kwocie", async () => {
    const events = fixture.events;
    /** Ostatni proc na cel — jeden obejmuje kilka tyknięć pod rząd. */
    const announced = new Map<string, number>();
    const mismatched: string[] = [];

    for (const event of events) {
      if (event.kind === "attack") {
        for (const proc of event.procs) {
          // Po KLUCZU, nie po zdaniu — tak samo jak `stats.ts` od `AUDYT‑89`.
          // Test dopasowujący się do polskiego brzmienia byłby zielony także
          // wtedy, gdy kod przestałby wiązać cokolwiek na kliencie nie‑polskim.
          if (proc.key === "+injure" && proc.value !== null) {
            announced.set(event.target, parseInt(proc.value, 10));
          }
        }
      }
      if (event.kind === "dot" && `${event.via} ${event.dotType}` === "po zranieniu") {
        if (announced.get(event.target) !== event.amount) {
          mismatched.push(`${event.target}: tyknięcie ${event.amount}, proc ${announced.get(event.target)}`);
        }
      }
    }

    expect(mismatched).toEqual([]);
  });
});

/**
 * ⚠️ **ZNIKŁY STĄD DWA BLOKI I SIEDEM ASERCJI — 2026‑08‑04, razem z korpusem.**
 *
 * Stały na jednej walce (`2026-07-31_druzyna-vs-hildur-zwyciestwo`: dziesięciu
 * graczy przeciw bossowi) i to ona była w nich dowodem. Co dokładnie przestało
 * być sprawdzane — zapisuję z liczbami, bo bez nich ten wpis nie ma wartości:
 *
 * - **zranienie ma sprawcę mimo tłumu po drugiej stronie.** `opponentOf`
 *   milczy przy dziesięciu przeciwnikach, ale proc „+Zranienie (N)" nazywa
 *   sprawcę wprost — `Łowcomir Kazrek` miał z tego 3380. Reszta puli zostawała
 *   bez sprawcy i rozkładała się na `Trucizna 40435` + `Ogień 556`, czyli
 *   przestawała udawać samą truciznę.
 * - **scalanie rodzin w przekroju po typie.** „ogień" z klasy CSS i „od ognia"
 *   z tykającego efektu miały wyjść JEDNYM wierszem: `38005 + 556`.
 * - **leczenie bez leczącego idzie za stronami**, nie jedną liczbą: suma
 *   `133867` rozkładała się na strony i zgadzała z sumą po postaciach.
 *
 * Wszystkie trzy są własnościami `stats.ts`, nie tamtej walki — ale **żadna nie
 * ma dziś materiału, na którym mogłaby paść.** Generator syntetyczny nie
 * produkuje ani proca „Zranienie (N)", ani żywiołów z dwóch źródeł naraz.
 * To jest luka do zamknięcia, nie sprzątanie.
 */

/**
 * Leczenie kierowane — kwota trafia do LECZĄCEGO, nie do puli „bez sprawcy".
 *
 * Do 2026‑08‑05 cała trójka szyków leczenia lądowała w jednym worku poza
 * dwoma procami samoratunku, bo `BattleEvent.heal` nie miało pola na
 * leczącego. Skutkiem były dwie nieprawdy naraz: healer w PvP grupowym miał
 * `healingDone: 0` mimo stu tysięcy wyleczonych punktów, a stopka twierdziła
 * „nie wiadomo kto" o czymś, co protokół podaje wprost.
 *
 * ⚠️ **Materiał jest budowany ręcznie i to jest tu słabym miejscem.** Jedyna
 * prawdziwa walka w repo (`tests/walka-z-gry.ts`) ma `heal=99` bez leczącego,
 * a klucza `heal_target` nie ma w ogóle — dowód, że leczącym jest pierwszy
 * segment, pochodzi z odczytu renderera gry, nie ze zrzutu. Te testy dowodzą
 * więc REGUŁY agregatu, nie tego, że reguła zgadza się z grą.
 */
describe("leczenie kierowane ma leczącego", () => {
  const walka = (nadpisz: Parameters<typeof leczenie>[2]): Aggregate =>
    aggregate([
      otwarcie(["Kapłan 100p", "Wojownik 100w"], ["Boss 150w"]),
      leczenie("Wojownik", 500, nadpisz),
    ]);

  test("kwota idzie do leczącego, a pula „bez sprawcy” o nią maleje", () => {
    const stats = walka({ healer: "Kapłan", ability: "Modlitwa" });
    const kaplan = stats.actors.find((a) => a.name === "Kapłan")!;
    const wojownik = stats.actors.find((a) => a.name === "Wojownik")!;

    expect(kaplan.healingDone).toBe(500);
    expect(wojownik.healingReceived).toBe(500);
    expect(totalBySide(stats.unattributedHealing)).toBe(0);
    expect(wojownik.unattributedHealingReceived).toBe(0);
    // Leczący nie dostaje cudzego leczenia w drugą stronę — to osobna liczba.
    expect(kaplan.healingReceived).toBe(0);
  });

  test("rozbicie zostaje „OD CZEGO” — leczący NIE wchodzi do niego", () => {
    // Świadome ograniczenie zakresu: znamy leczącego, ale widok leczenia ma
    // jeden szczebel i ma go zachować. Szczebel „kto leczył" dałoby się
    // wypełnić tylko dla JEDNEGO z trzech szyków, więc w panelu wyglądałby
    // jak healer, który raz leczy, a raz nie (`docs/DECYZJE.md`).
    const wojownik = walka({ healer: "Kapłan", ability: "Modlitwa" }).actors.find(
      (a) => a.name === "Wojownik",
    )!;
    expect(wojownik.healedBy).toEqual([{ label: "Modlitwa", amount: 500, hits: 1 }]);
  });

  test("leczenie kierowane na SIEBIE liczy się raz, nie dwa", () => {
    // Układ `id1 == id2` — gra wyodrębnia go sama (`BattleMessages.js:953`).
    // Tu leczący i leczony sprowadzają się do tego samego klucza, więc obie
    // liczby siadają na jednej postaci i żadna nie może się zdublować.
    const stats = aggregate([
      otwarcie(["Kapłan 100p"], ["Boss 150w"]),
      leczenie("Kapłan", 700, { healer: "Kapłan", ability: "Modlitwa" }),
    ]);
    const kaplan = stats.actors.find((a) => a.name === "Kapłan")!;
    expect(kaplan.healingDone).toBe(700);
    expect(kaplan.healingReceived).toBe(700);
    expect(totalBySide(stats.unattributedHealing)).toBe(0);
  });

  test("bez leczącego kwota ZOSTAJE bez sprawcy", () => {
    // Strażnik regresji `d4be27e` po stronie agregatu: „Przywrócono N punktów
    // życia X" nie ma drugiej strony i nie wolno go nikomu dopisać.
    const stats = walka({});
    expect(totalBySide(stats.unattributedHealing)).toBe(500);
    for (const a of stats.actors) expect(a.healingDone).toBe(0);
  });

  test("`self` nadal działa dla proców — leczącego w komunikacie nie ma", () => {
    const stats = aggregate([
      otwarcie(["Kapłan 100p"], ["Boss 150w"]),
      leczenie("Kapłan", 120, { self: true, ability: "Dotyk anioła" }),
    ]);
    const kaplan = stats.actors.find((a) => a.name === "Kapłan")!;
    expect(kaplan.healingDone).toBe(120);
    expect(totalBySide(stats.unattributedHealing)).toBe(0);
  });

  test("dwóch leczących o tej samej nazwie rozdziela `id`, a nie spadek życia", () => {
    // Cała droga naraz — komunikaty protokołu, dekoder, agregat — bo to jedyny
    // sposób, żeby przejść ŚCIEŻKĄ PO `id`, a ta jest tu istotna: dwóch Kapłanów
    // leczy tę samą postać, więc heurystyka po życiu nie ma czego rozdzielić.
    //
    // To zarazem strażnik `namesIn`: leczący musi być w obu przebiegach
    // rozpoznawczych. Bez niego `poId` nie widzi drugiego Kapłana i oba
    // leczenia schodzą się w jeden wiersz z sumą 1400.
    const sklad: RosterEntry[] = [
      { id: 1, name: "Kapłan", side: 0 },
      { id: 2, name: "Kapłan", side: 0 },
      { id: 3, name: "Wojownik", side: 0 },
      { id: 4, name: "Boss", side: 1 },
    ];
    const stats = aggregate(
      dekoduj(["1=100.00;3=40.00;heal_target=500", "2=100.00;3=80.00;heal_target=900"], sklad),
      sklad,
    );
    const done = (name: string) => stats.actors.find((a) => a.name === name)!.healingDone;
    expect(done("Kapłan #1")).toBe(500);
    expect(done("Kapłan #2")).toBe(900);
    expect(stats.actors.find((a) => a.name === "Wojownik")!.healingReceived).toBe(1400);
    expect(totalBySide(stats.unattributedHealing)).toBe(0);
  });

  test("leczący liczy się do rozpoznawania instancji, choć sam nie jest leczony", () => {
    // Ten sam układ BEZ składu z gry, czyli ścieżką po życiu zamiast po `id`.
    // Pilnuje `namesIn`: leczący musi wchodzić do OBU przebiegów rozpoznawczych,
    // a nie tylko do właściwego liczenia.
    //
    // Bez tego dwaj Kapłani, którzy w całej walce nie oberwali ani razu, nie
    // ujawniają się w przebiegu rozpoznawczym w ogóle — więc nazwa dostaje
    // ZERO wierszy, numeracja się nie włącza i obie kwoty schodzą się w jeden
    // wiersz `Kapłan 1400`. Zmierzone na mutacji, nie wydedukowane.
    const stats = aggregate([
      otwarcie(["Kapłan 100p", "Kapłan 100p", "Wojownik 100w"], ["Boss 150w"]),
      leczenie("Wojownik", 500, { healer: "Kapłan", healerHpPct: 40 }),
      leczenie("Wojownik", 900, { healer: "Kapłan", healerHpPct: 90 }),
    ]);
    const done = (name: string) => stats.actors.find((a) => a.name === name)?.healingDone;
    expect(done("Kapłan #1")).toBe(500);
    expect(done("Kapłan #2")).toBe(900);
    expect(done("Kapłan")).toBeUndefined();
  });
});

describe("trucizna w walce grupowej", () => {
  test("wskazuje sprawcę trucizny po STRONIE konfliktu, nie po liczbie postaci", () => {
    // 1 vs 3: po drugiej stronie Lochy stoi dokładnie JEDEN gracz, więc
    // wątpliwości nie ma, choć uczestników walki jest czterech. Liczy się
    // strona, nie rozmiar walki — i to jest cała treść tego testu.
    //
    // ⚠️ Do 2026‑08‑04 stała za tym prawdziwa walka z korpusu
    // (`2026-07-18_lowca-dom-trucizna`), w której łowca miał
    // `Zwykły atak 786 (2 ciosy)` + `Trucizna 140 (1)`. Materiał jest dziś
    // pisany ręcznie, więc test dowodzi REGUŁY, a nie tego, że reguła zgadza
    // się z grą.
    const stats = aggregate([
      otwarcie(["Łowca 100h"], ["Locha 40w", "Locha 40w", "Odyniec 41w"]),
      cios("Łowca", "Locha", [trafienie(400, 393)], { targetHpPct: 60 }),
      cios("Łowca", "Locha", [trafienie(400, 393)], { targetHpPct: 20 }),
      tykniecie("Locha", 10, 140, "trucizny"),
    ]);

    // Sprawca ustalony: po drugiej stronie Lochy stoi tylko Łowca.
    expect(totalBySide(stats.unattributedDotDamage)).toBe(0);
    const lowca = stats.actors.find((a) => a.name === "Łowca")!;
    expect(lowca.dealtBy).toEqual([
      { label: "Zwykły atak", amount: 786, hits: 2 },
      { label: "Trucizna", amount: 140, hits: 1 },
    ]);
  });

  test("rozdziela zdublowaną nazwę, gdy ciągi HP się rozjeżdżają", () => {
    const stats = aggregate(
      [
        otwarcie(["Gracz 1w"], ["Wilk 1w", "Wilk 1w"]),
        cios("Gracz", "Wilk", [trafienie(300)], { targetHpPct: 60 }),
        // Ten sam skok w górę: 100% nie może być tym wilkiem na 60%.
        krok("Wilk", 100),
        cios("Gracz", "Wilk", [trafienie(200)], { targetHpPct: 20 }),
      ],
    );

    // Oba trafienia w tego samego wilka: 60% → 20%. Drugi tylko zrobił krok.
    expect(stats.actors.find((a) => a.name === "Wilk #1")!.damageTaken).toBe(500);
    expect(stats.actors.find((a) => a.name === "Wilk #2")!.damageTaken).toBe(0);
    expect(stats.ambiguousNames).toEqual(["Wilk #1", "Wilk #2"]);
  });

  test("nie rozdziela zdublowanej nazwy, gdy log nie daje na to dowodu", () => {
    const stats = aggregate(
      [
        otwarcie(["Gracz 1w"], ["Wilk 1w", "Wilk 1w"]),
        // Obaj przez całą walkę na 100% — nie do rozróżnienia.
        cios("Wilk", "Gracz", [trafienie(300)], { targetHpPct: 70 }),
        cios("Wilk", "Gracz", [trafienie(200)], { targetHpPct: 50 }),
      ],
    );

    // Jeden scalony wiersz. Rozbicie na #1/#2 przypisałoby konkretnemu wilkowi
    // obrażenia, o których log milczy — to byłoby zmyślenie, nie statystyka.
    expect(stats.actors.map((a) => a.name)).toEqual(["Wilk", "Gracz"]);
    expect(stats.actors.find((a) => a.name === "Wilk")!.damageDealt).toBe(500);
    expect(stats.ambiguousNames).toEqual(["Wilk"]);
  });

  test("rozdziela duplikaty, które oba zaczynają na 100%", () => {
    // Podziału nie wymusza START (obaj na 100%), tylko akcja postaci o życiu
    // WYŻSZYM niż ostatnio widziane pod tą nazwą — życie nie rośnie, więc to
    // ktoś inny. To najtrudniejszy przypadek rozdzielania instancji.
    //
    // ⚠️ Stała za tym walka `2026-07-18_lowca-vs-gnolle-rozdzielanie`
    // (usunięta 2026‑08‑04): `Gnoll łucznik #1` miał `2337/439`,
    // `#2` — `1522/460`, a `Gnoll szaman` padł bez jednej akcji i mimo to miał
    // wiersz z `0/1411`. Materiał jest dziś pisany ręcznie.
    const stats = aggregate([
      otwarcie(["Łowca 100h"], ["Gnoll łucznik 40t", "Gnoll łucznik 40t"]),
      cios("Łowca", "Gnoll łucznik", [trafienie(300)], { targetHpPct: 0 }),
      // Ten sam nick na 100% PO tym, jak spadł do zera — to musi być drugi.
      cios("Gnoll łucznik", "Łowca", [trafienie(120)], { sourceHpPct: 100, targetHpPct: 80 }),
      cios("Łowca", "Gnoll łucznik", [trafienie(200)], { targetHpPct: 30 }),
    ]);

    const first = stats.actors.find((a) => a.name === "Gnoll łucznik #1")!;
    const second = stats.actors.find((a) => a.name === "Gnoll łucznik #2")!;
    expect([first.damageTaken, first.damageDealt]).toEqual([300, 0]);
    expect([second.damageTaken, second.damageDealt]).toEqual([200, 120]);
    expect(stats.unknownLines).toBe(0);
    expect(stats.ambiguousNames).toEqual(["Gnoll łucznik #1", "Gnoll łucznik #2"]);
  });

  test("skład z gry rozdziela nierozróżnialne duplikaty na osobne wiersze", () => {
    const log = [
      otwarcie(["Gracz 1w"], ["Wilk 1w", "Wilk 1w"]),
      // Obaj przez całą walkę na 100% — log ich nie rozróżnia.
      cios("Wilk", "Gracz", [trafienie(300)], { targetHpPct: 70 }),
    ];
    const fromGame: RosterEntry[] = [
      { id: 1, name: "Gracz", side: 0 },
      { id: 2, name: "Wilk", side: 1 },
      { id: 3, name: "Wilk", side: 1 },
    ];

    // Bez składu z gry: jeden scalony wiersz, bo log nie daje dowodu na dwa.
    expect(aggregate(log).actors.map((a) => a.name)).toEqual(["Wilk", "Gracz"]);

    // Ze składem z gry: istnienie obu wilków to fakt, więc dostają po wierszu.
    const stats = aggregate(log, fromGame);
    expect(stats.actors.map((a) => a.name).sort()).toEqual(["Gracz", "Wilk #1", "Wilk #2"]);
    // Obrażeń log nie rozdzielił — całość siedzi na jednym, oba z gwiazdką.
    expect(stats.actors.find((a) => a.name === "Wilk #1")!.damageDealt).toBe(300);
    expect(stats.actors.find((a) => a.name === "Wilk #2")!.damageDealt).toBe(0);
    expect(stats.ambiguousNames).toEqual(["Wilk #1", "Wilk #2"]);
  });

  /**
   * Numer instancji nadaje heurystyka śledząca HP, w kolejności ujawniania przez
   * log — a ta nie ma nic wspólnego z kolejnością składu. Przy tej samej nazwie
   * po obu stronach nie da się więc powiedzieć, który wiersz jest czyj, i to
   * dotyczy KAŻDEJ instancji, także pierwszej.
   */
  const LOG_DWA_WILKI = [
    otwarcie(["Gracz 1w", "Wilk 1w"], ["Wilk 1w", "Wróg 1m"]),
    // ⚠️ Gołe „otrzymał" bez poprzedzającego ciosu jest zdarzeniem
    // NIEROZPOZNANYM i do statystyk nie wchodzi. Zostaje wiernie:
    // te dwa testy stoją wyłącznie na składzie, a nie na obrażeniach.
    nieznane("Wilk(80%) otrzymał -100 obrażeń", 2),
  ];

  test("ta sama nazwa po obu stronach BEZ identyfikatorów nie dostaje żadnej strony", () => {
    // Zdarzenia budowane w kodzie NIE mają `id` (tak wygląda materiał
    // syntetyczny i tak wyglądały nagrania sprzed protokołu), więc numer
    // instancji nadaje kolejność UJAWNIANIA w logu — a ta nie ma nic wspólnego
    // z kolejnością składu. „Wilk #1" nie znaczy wtedy „ten nasz”.
    // Nie "obie po stronie 0" — to było twierdzenie, i fałszywe.
    const stats = aggregate(
      [...LOG_DWA_WILKI, krok("Wilk", 80), krok("Wilk", 60)],
      [
        { id: 1, name: "Gracz", side: 0 },
        { id: 2, name: "Wilk", side: 0 },
        { id: 3, name: "Wilk", side: 1 },
        { id: 4, name: "Wróg", side: 1 },
      ],
    );
    const side = (name: string) => stats.actors.find((a) => a.name === name)!.side;

    expect(side("Wilk #1")).toBeNull();
    expect(side("Wilk #2")).toBeNull();
    expect(side("Gracz")).toBe(0);
    expect(side("Wróg")).toBe(1);
    // I gwiazdka ZOSTAJE — tu numer naprawdę jest domysłem.
    expect(stats.ambiguousNames).toEqual(["Wilk #1", "Wilk #2"]);
  });

  test("ta sama nazwa po obu stronach Z identyfikatorami dostaje PRAWDZIWE strony", () => {
    // ⚠️ **TO JEST ZMIANA Z 2026‑08‑05, nie regresja poprzedniego testu.**
    // Gdy skład niesie `id`, wiersz `#n` to KONKRETNY wpis składu — ten n‑ty
    // w jego kolejności — więc strona jest odczytana, a nie zgadnięta.
    // `null` znaczyło „nie wiadomo"; tutaj wiadomo, a `null` byłby wtedy
    // zaniżeniem tego, co repo naprawdę wie.
    const stats = aggregate(LOG_DWA_WILKI, [
      { id: 1, name: "Gracz", side: 0 },
      { id: 2, name: "Wilk", side: 0 },
      { id: 3, name: "Wilk", side: 1 },
      { id: 4, name: "Wróg", side: 1 },
    ]);
    const side = (name: string) => stats.actors.find((a) => a.name === name)!.side;

    expect(side("Wilk #1")).toBe(0);
    expect(side("Wilk #2")).toBe(1);
    expect(side("Gracz")).toBe(0);
    expect(side("Wróg")).toBe(1);
    // I nie ma przy nich gwiazdki: numer nie jest domysłem.
    expect(stats.ambiguousNames).toEqual([]);
  });

  test("dwie postacie tej samej nazwy po JEDNEJ stronie stronę zachowują", () => {
    const log = [
      otwarcie(["Gracz 1w"], ["Wilk 1w", "Wilk 1w"]),
      nieznane("Wilk(80%) otrzymał -100 obrażeń", 2),
    ];
    const stats = aggregate(log, [
      { id: 1, name: "Gracz", side: 0 },
      { id: 2, name: "Wilk", side: 1 },
      { id: 3, name: "Wilk", side: 1 },
    ]);

    // Nazwa zdublowana, ale bezspornie ich — więc "nie wiadomo" byłoby stratą.
    expect(stats.actors.find((a) => a.name === "Wilk #1")!.side).toBe(1);
    expect(stats.actors.find((a) => a.name === "Wilk #2")!.side).toBe(1);
  });

  /**
   * Sprawca tykającego efektu liczy się przez wykluczenie: jeżeli po drugiej
   * stronie stoi dokładnie jeden, to on. Wiersz o nieznanej stronie MOŻE być
   * przeciwnikiem, więc przestaje być "dokładnie jeden" i przypisanie znika.
   */
  test("nazwa po obu stronach zabiera pewność, kto nałożył truciznę", () => {
    const events = [
      otwarcie(["Gracz 1w", "Wilk 1w"], ["Wilk 1w", "Wróg 1m"]),
      tykniecie("Gracz", 90, 30, "trucizny"),
    ];
    const roster: RosterEntry[] = [
      { id: 1, name: "Gracz", side: 0 },
      { id: 2, name: "Wilk", side: 0 },
      { id: 3, name: "Wilk", side: 1 },
      { id: 4, name: "Wróg", side: 1 },
    ];

    const stats = aggregate(events, roster);
    // Wrogi Wilk mógł zatruć tak samo jak Wróg — nie ma jednego kandydata.
    expect(stats.actors.find((a) => a.name === "Wróg")!.damageDealt).toBe(0);
    expect(stats.unattributedDotDamage.mine).toBe(30);

    // Kontrola: bez zdublowanej nazwy sprawca jest jeden i przypis ma zostać.
    const clear = aggregate(events, [roster[0]!, roster[3]!]);
    expect(clear.actors.find((a) => a.name === "Wróg")!.damageDealt).toBe(30);
    expect(clear.unattributedDotDamage.mine).toBe(0);
  });

  test("skład z gry pokazuje postać, o której log w ogóle nie wspomniał", () => {
    const stats = aggregate(
      [otwarcie(["Gracz 1w"], ["Wilk 1w"])],
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
    const stats = aggregate([tykniecie("Gracz", 50, 100, "trucizny")], fromGame);
    expect(stats.actors.find((a) => a.name === "Gracz")!.professionCode).toBe("m");
    expect(stats.actors.find((a) => a.name === "Wilk")!.professionCode).toBeNull();
  });

  test("profesja z linii otwierającej uzupełnia skład z gry", () => {
    // Skład z gry rządzi stronami, ale gdy nie niesie profesji, literę dokłada
    // log — oba źródła piszą ją tym samym alfabetem.
    const stats = aggregate(
      [otwarcie(["Gracz 85b"], ["Wilk 12w"])],
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
    const events = [
      otwarcie(["Gracz 1w"], ["A 1w", "B 1w", "C 1w"]),
      tykniecie("Gracz", 50, 100, "trucizny"),
    ];
    const stats = aggregate(events);
    // Sprawcy nie znamy, ale poszkodowanego tak — trucizna ląduje po stronie gracza.
    expect(stats.unattributedDotDamage).toEqual({
      mine: 100,
      enemy: 0,
      loose: 0,
      // Pula wie, CO w niej jest — inaczej przypis w panelu nazwałby trucizną
      // także ogień i rany.
      types: [{ label: "Trucizna", amount: 100 }],
    });
    expect(stats.actors.find((a) => a.name === "A")?.damageDealt).toBe(0);
  });

  test("skład z gry wskazuje sprawcę trucizny, gdy nagłówek wyjechał z bufora", () => {
    // Przewidziany przypadek: log traci treść od góry, więc linii otwierającej
    // już nie widać. Skład z gry mówi jednak wprost, kto stoi po drugiej stronie.
    const events = [tykniecie("Gracz", 50, 280, "trucizny")];
    const fromGame: RosterEntry[] = [
      { id: 1, name: "Gracz", side: 0 },
      { id: 2, name: "Wilk", side: 1 },
    ];

    // Bez składu nie ma po czym liczyć stron — trucizna zostaje bez sprawcy.
    expect(totalBySide(aggregate(events).unattributedDotDamage)).toBe(280);

    const stats = aggregate(events, fromGame);
    expect(totalBySide(stats.unattributedDotDamage)).toBe(0);
    expect(stats.actors.find((a) => a.name === "Wilk")!.damageDealt).toBe(280);
  });

  test("trucizna przed pierwszą turą nie wypada z osi tur", () => {
    // Bufor przycięty do tyknięcia trucizny: żadna tura jeszcze się nie otwarła,
    // a kwota nie ma prawa przepaść — Σ osi musi się zgadzać z Σ zdarzeń.
    const stats = aggregate(
      [
        tykniecie("Gracz", 50, 140, "trucizny"),
        cios("Gracz", "Wilk", [trafienie(2189)], { sourceHpPct: 50, targetHpPct: 10 }),
      ],
    );

    const onAxis = stats.timeline.reduce((sum, slice) => sum + slice.damage, 0);
    expect(onAxis).toBe(140 + 2189);
    // Tura tła nie dostaje strony: log nie mówi, kto wtedy działał.
    expect(stats.timeline[0]).toMatchObject({ turn: 1, side: null, damage: 140 });
  });

  test("maks. cios nie liczy własnych obrażeń umiejętności", () => {
    const stats = aggregate(
      [
        otwarcie(["Gracz 1m"], ["Wilk 1w"]),
        umiejetnosc("Gracz", "Fuzja żywiołów"),
        // Własne obrażenia umiejętności — lecą OBOK ciosu, nie są ciosem
        // (`strike: false`) i dlatego nie liczą się do `maxHit`.
        cios("Gracz", "Wilk", [trafienie(2000)], {
          sourceHpPct: null,
          targetHpPct: 50,
          ability: "Fuzja żywiołów",
          strike: false,
        }),
        cios("Gracz", "Wilk", [trafienie(300)], {
          targetHpPct: 30,
          ability: "Fuzja żywiołów",
        }),
      ],
    );

    const gracz = stats.actors.find((a) => a.name === "Gracz")!;
    // Obrażenia liczą się w całości, rekord pojedynczego uderzenia już nie.
    expect(gracz.damageDealt).toBe(2300);
    expect(gracz.maxHit).toBe(300);
  });

  /**
   * Rozróżnienie zwarcie/dystans żyje w PARSERZE — `dmg` odyńca kontra `dmgd`
   * łowcy — i tam się go pilnuje. Przekrój w panelu nazywa RODZINY, więc obie
   * klasy stoją w nim pod „Bronią": to ta sama oś (czym uderzono), a nie dwa
   * różne rodzaje obrażeń. Test trzyma oba szczeble naraz, bo dopiero razem
   * mówią, że informacja nie ginie — tylko nie jest wierszem rankingu.
   */
  test("rozróżnia klasy obrażeń fizycznych: zwarcie kontra dystans", () => {
    // Dwie różne klasy z protokołu (`+dmgd` łowcy kontra `+dmg` odyńca) mają
    // zostać rozróżnione w `hit.element`, a mimo to trafić do JEDNEJ rodziny
    // „Broń" w przekroju panelu. To ta sama oś (czym uderzono), nie dwa rodzaje.
    const walka = [
      otwarcie(["Łowca 100h"], ["Odyniec 41w"]),
      cios("Łowca", "Odyniec", [trafienie(400, 393, { element: "dystansowe" })], {
        targetHpPct: 60,
      }),
      cios("Łowca", "Odyniec", [trafienie(400, 393, { element: "dystansowe" })], {
        targetHpPct: 20,
      }),
      tykniecie("Odyniec", 10, 140, "trucizny"),
      cios("Odyniec", "Łowca", [trafienie(100, 95, { element: "fizyczne" })], {
        sourceHpPct: 10,
        targetHpPct: 90,
      }),
    ];
    const elementsOf = (name: string) =>
      new Set(
        walka.flatMap((event) =>
          event.kind === "attack" && event.source === name
            ? event.hits.map((hit) => hit.element)
            : [],
        ),
      );
    expect(elementsOf("Łowca")).toEqual(new Set(["dystansowe"]));
    expect(elementsOf("Odyniec")).toEqual(new Set(["fizyczne"]));

    const stats = aggregate(walka);
    // Obie klasy pod jedną rodziną, a trucizna osobno.
    expect(stats.actors.find((a) => a.name === "Łowca")!.dealtByType).toEqual([
      { label: "Broń", amount: 786, hits: 2 },
      { label: "Trucizna", amount: 140, hits: 1 },
    ]);
    expect(stats.actors.find((a) => a.name === "Odyniec")!.dealtByType).toEqual([
      { label: "Broń", amount: 95, hits: 1 },
    ]);
  });
});
/**
 * Niezmienniki agregacji — po każdej walce z korpusu i po SUMIE SESJI.
 *
 * Przelot był dotąd jednorazowym pomiarem robionym ręcznie przy audycie. Skoro
 * ma znaczyć „liczby się domykają", musi lecieć przy każdym `bun test`: to
 * jedyny test, który złapie rozjazd w rozbiciu, którego nikt nie wymienił
 * z nazwy — łącznie z polem, którego jeszcze nie ma.
 */
describe("niezmienniki liczb", () => {
  const sum = (rows: ReadonlyArray<{ amount: number }>) =>
    rows.reduce((total, row) => total + row.amount, 0);

  /** Wszystkie rozjazdy naraz, żeby raport mówił CO nie gra, a nie tylko że. */
  const mismatches = (stats: Aggregate): string[] => {
    const found: string[] = [];
    for (const a of stats.actors) {
      const check = (what: string, got: number, want: number) => {
        if (got !== want) found.push(`${a.name}: ${what} ${got} ≠ ${want}`);
      };
      check("dealtBy", sum(a.dealtBy), a.damageDealt);
      check("dealtByType", sum(a.dealtByType), a.damageDealt);
      check("takenFrom", sum(a.takenFrom), a.damageTaken);
      check("takenByType", sum(a.takenByType), a.damageTaken);
      check("takenFromBy", sum(a.takenFromBy), a.damageTaken);
      check("healedBy", sum(a.healedBy), a.healingReceived);
      // Pule bez sprawcy są CZĘŚCIĄ sum postaci, nie dodatkiem obok nich.
      check("rodzaje DoT-u bez sprawcy", sum(a.unattributedDotTypes), a.unattributedDotTaken);
      if (a.unattributedDotTaken > a.damageTaken) found.push(`${a.name}: DoT bez sprawcy > przyjęte`);
      if (a.unattributedHealingReceived > a.healingReceived) {
        found.push(`${a.name}: leczenie bez sprawcy > otrzymane`);
      }
      // Obie liczby panel pokazuje W NAWIASIE przy większej z pary („pochłonięte
      // 55 923 (blok 10 568)", „kryt. 7 (w tym 1 bardzo)"), więc przekroczenie
      // znaczyłoby, że nawias mówi więcej niż to, co rzekomo rozbija — a czytający
      // nie ma jak tego zauważyć. Podzbiór jest tu kontraktem, nie obserwacją.
      if (a.damageBlocked > a.damageAbsorbed) found.push(`${a.name}: blok > pochłonięte`);
      if (a.superCrits > a.crits) found.push(`${a.name}: bardzo krytyczne > krytyczne`);
    }
    const total = (pick: (a: Aggregate["actors"][number]) => number) =>
      stats.actors.reduce((s, a) => s + pick(a), 0);
    // Każdy punkt obrażeń ma dokładnie jednego właściciela albo trafia do puli.
    if (total((a) => a.damageDealt) + totalBySide(stats.unattributedDotDamage) !== total((a) => a.damageTaken)) {
      found.push("Σ zadane + DoT bez sprawcy ≠ Σ przyjęte");
    }
    if (total((a) => a.healingDone) + totalBySide(stats.unattributedHealing) !== total((a) => a.healingReceived)) {
      found.push("Σ leczenie zadane + bez sprawcy ≠ Σ otrzymane");
    }
    // Podział na strony i podział na postacie muszą dawać tę samą liczbę.
    if (total((a) => a.unattributedDotTaken) !== totalBySide(stats.unattributedDotDamage)) {
      found.push("DoT bez sprawcy: suma per postać ≠ suma per strona");
    }
    if (total((a) => a.unattributedHealingReceived) !== totalBySide(stats.unattributedHealing)) {
      found.push("leczenie bez sprawcy: suma per postać ≠ suma per strona");
    }
    return found;
  };

  /**
   * Jeden zestaw asercji po CAŁYM materiale.
   *
   * ⚠️ Do 2026‑08‑04 przeloty były DWA, bo te same walki dawały różne strumienie
   * zdarzeń zależnie od tego, którą drogą je odczytano. Droga jest dziś jedna
   * i ta redukcja niczego nie kosztowała — kosztowało usunięcie materiału,
   * po którym oba chodziły.
   */
  const przelot = (fixture: { events: BattleEvent[] }) => {
    test("rozbicia domykają się ze skalarami", async () => {
      expect(mismatches(aggregate(fixture.events))).toEqual([]);
    });

    /**
     * Każdy atak jest albo ciosem, albo unikiem — nigdy obydwoma i nigdy żadnym.
     *
     * To jest niezmiennik, dla którego rozdzielono uniki pełne od częściowych
     * (`AUDYT‑40`). Dopóki trzyma, „ciosy N · uniki M" w stopce można dodać
     * i wyjdzie liczba ataków; wcześniej atak z częściowym unikiem podbijał oba
     * liczniki i suma była o niego za duża.
     */
    test("ciosy i uniki sumują się do liczby ataków", async () => {
      const events = fixture.events;
      const stats = aggregate(events);
      const ataki = events.filter((e) => e.kind === "attack" && e.strike).length;
      const ciosy = stats.actors.reduce((sum, a) => sum + a.hits, 0);
      const uniki = stats.actors.reduce((sum, a) => sum + a.misses, 0);

      expect(ciosy + uniki).toBe(ataki);
    });

    /**
     * Każda AKCJA z logu ma swoją turę na osi, i nic poza akcjami i tłem tam
     * nie stoi. Ta sama para asercji co przy ciosach: raz od strony postaci
     * (Σ `turns`), raz od strony osi (`timeline.length`).
     *
     * Rozjazd między nimi to DOKŁADNIE liczba tur tła — a to jest wiązanie
     * dwóch liczb, które panel i archiwum podpisują tym samym słowem „tur”
     * (`overlay.ts` sumuje `actor.turns`, `archive.ts` bierze `timeline.length`).
     *
     * ⚠️ **Ten niezmiennik stoi na JEDNYM fixture z sześciu.** Mutacja cofająca
     * naprawę (`if (actor === lastActor) return` w `beginTurn`) zapala go
     * wyłącznie na `OSOBLIWOSCI`; pięć walk syntetycznych przechodzi ją bez
     * drgnięcia, bo generator daje jedną akcję na postać na rundę i przeplata
     * postacie, więc dwie akcje tej samej postaci pod rząd tam nie powstają.
     * Sprawdzone, nie domyślone.
     */
    test("każda akcja z logu ma swoją turę na osi", async () => {
      const events = fixture.events;
      const stats = aggregate(events);
      const akcje = events.filter(
        (e) =>
          (e.kind === "attack" && e.strike && e.ability === null) ||
          e.kind === "ability" ||
          e.kind === "move",
      ).length;
      const tury = stats.actors.reduce((sum, a) => sum + a.turns, 0);
      const tlo = stats.timeline.filter((s) => s.actor === BACKGROUND_ACTOR).length;

      expect(tury).toBe(akcje);
      expect(stats.timeline).toHaveLength(akcje + tlo);
    });
  };

  describe.each(KORPUS)("$name", (fixture) => {
    przelot(fixture);

    /**
     * `typeByLabel` mówi widokowi, jakim kolorem pomalować pasek danej etykiety
     * (`palette.ts`), i do 2026‑08‑03 nie miał ANI JEDNEGO niezmiennika.
     *
     * ⚠️ Chodził wcześniej TYLKO po walkach odczytanych z DOM-u, bo tylko one
     * niosły żywioł: ta sama walka miała 31 wpisów z DOM-u wobec 4 ze zdań.
     * Protokół niesie żywioł kluczem, więc rozróżnienie zniknęło i przelot
     * obejmuje wszystko, co jest.
     *
     * Dwie własności, obie łamliwe przy zmianie sortowania albo scalania rodzin:
     * etykieta nie może paść dwa razy (widok wziąłby pierwszą i cicho zgubił
     * drugą), a rodzina musi być KLUCZEM `TYPE_COLORS` — inaczej pasek dostaje
     * barwę „nie wiadomo", nie do odróżnienia od „Nieznany". Ten drugi błąd
     * repo już miało („Broń" traciła kolor, `SOLID §10`).
     *
     * ⚠️ Rodzina NIE jest sprawdzana przez `typeFamily(type) === type` i to
     * pomyłka warta zapisania, bo kusi: `typeFamily` nie jest idempotentne.
     * `classify` rozpoznaje rodzinę po PODCIĄGU nazwy zapisanej w logu, więc
     * „ogień" mapuje się na siebie, ale `typeFamily("broń")` daje `null` —
     * ta rodzina powstaje z „fizyczne" i „dystansowe" i sama nie zawiera
     * żadnego wzorca. Asercja postawiona tak zapalała 52 fałszywe alarmy na
     * jednym fixture. Zamknięty zbiór rodzin trzyma `TYPE_COLORS` i to on jest
     * tu kontraktem.
     */
    test("typeByLabel: etykiety bez duplikatów, rodziny znane palecie", async () => {
      const stats = aggregate(fixture.events);
      const problemy: string[] = [];
      for (const actor of stats.actors) {
        const widziane = new Set<string>();
        for (const { label, type } of actor.typeByLabel) {
          if (widziane.has(label)) problemy.push(`${actor.name}: etykieta „${label}" dwa razy`);
          widziane.add(label);
          if (!(type in TYPE_COLORS)) {
            problemy.push(`${actor.name}: „${label}" ma rodzinę „${type}", której paleta nie zna`);
          }
        }
      }
      expect(problemy).toEqual([]);
    });
  });

});
/**
 * ⚠️ **ZNIKŁ STĄD BLOK „blok, super-kryt i osłabienie DoT-a" — 4 testy,
 * 2026‑08‑04, razem z korpusem** (`SOLID §4.22`).
 *
 * Każda asercja stała na konkretnej walce i dawała się odtworzyć z logu
 * ręcznie — dlatego liczby były konkretne, a nie „większe od zera". Co przestało
 * być sprawdzane:
 *
 * - **blok siada u CELU, nie u napastnika** — „Zablokowanie 23 obrażeń" stało
 *   w bloku ciosu łowcy, ale mówiło o tarczy `Wieczornicy`: ona miała
 *   `damageBlocked 23`, łowca `0`, a `damageAbsorbed` Wieczornicy `497`
 *   (blok jest CZĘŚCIĄ pochłoniętych, nie liczbą obok nich);
 * - **super-kryt jest podzbiorem krytów** — boss `crits 7 / superCrits 1`,
 *   a w innej walce `Wyczxs` miał `3 / 3`, czyli skrajny przypadek, w którym
 *   nawias powtarza liczbę wiodącą i jest to POPRAWNE;
 * - **osłabienie DoT-a odtwarza się z kwoty po osłabieniu** — z linii
 *   „236 (osłabione o 19%)" wychodzi baza 236 / 0,81 = 291, czyli
 *   `damageWeakened 55`, przy `damageTaken 1188` liczonym z kwot Z LOGU;
 * - **bez takiej linii pola stoją na ZERZE** — walka z kukłą, gdzie zero jest
 *   wynikiem, nie brakiem: panel na jego podstawie CHOWA człony liczników.
 *
 * Generator syntetyczny produkuje bloki i super-kryty, ale **nie da się z niego
 * wyprowadzić liczby sprawdzalnej ręcznie** — sam ją policzył. Test na takim
 * materiale sprawdzałby agregat przeciw agregatowi.
 */

/**
 * Etykiety, które WYMYŚLAMY, kontra nazwy, które przychodzą z gry.
 *
 * `Bez sprawcy`, `Trucizna`, `Broń` czy `Locha #1` są zwykłymi kluczami mapy,
 * więc postać albo umiejętność o takiej nazwie skleiłaby się z nimi w jeden
 * wiersz — dwie różne rzeczy pod jedną liczbą. Nicki Margonem tego nie
 * dopuszczają i nie bronimy się przed tym na zapas, ale zamiana etykiet DoT-u
 * na zwykłe rzeczowniki („od ognia" → „Ogień") podniosła ryzyko: gra ma
 * umiejętności jednowyrazowe.
 *
 * Ten test nie naprawia kolizji — pilnuje, żeby dzień, w którym pojawi się
 * pierwsza, był dniem czerwonego zestawu, a nie cichej pomyłki w panelu.
 */
describe("zarezerwowane etykiety nie kolidują z nazwami z gry", () => {
  const RESERVED = new Set([
    UNATTRIBUTED_SOURCE,
    "Zwykły atak",
    "Regeneracja",
    ...["ogień", "błyskawica", "zimno", "trucizna", "rana", "nieuchronne", "broń"].map(typeDisplay),
    ...[
      ["od", "trucizny"],
      ["od", "głębokiej rany"],
      ["od", "ognia"],
      ["po", "zranieniu"],
      ["od", "błyskawic"],
    ].map(([via, type]) => dotLabel(via!, type!)),
  ]);

  test.each(KORPUS)("$name", async (fixture) => {
    const names = new Set<string>();
    for (const event of fixture.events) {
      if (event.kind === "ability") {
        names.add(event.name);
        names.add(event.actor);
      }
      if (event.kind === "fight-start") for (const p of event.participants) names.add(p.name);
    }
    expect([...names].filter((name) => RESERVED.has(name))).toEqual([]);
  });
});

/**
 * TURA JEST AKCJĄ — reguła wzięta z pomocy gry, rozdział „2. System tur”:
 *
 * > Tura w systemie tur to numerowana (od 1 wzwyż) akcja, którą Postać może
 * > wykonać […]. Tura jest akcją przyznawaną i tylko jedna Postać w danym
 * > momencie może uzyskać możliwość wykonania tury.
 *
 * ⚠️ **Do 2026‑08‑05 kod robił coś przeciwnego i NIC tego nie pilnowało.**
 * Turą był nieprzerwany ciąg akcji tej samej postaci, więc szybka postać —
 * a kolejność tur wynika ze skumulowanego czasu ataku, czyli szybka postać
 * dostaje turę kilka razy z rzędu rutynowo — miała tury sklejone. Cały zestaw
 * przechodził tę pomyłkę na zielono.
 */
describe("tura jest akcją", () => {
  /**
   * NAJMOCNIEJSZY z tych testów, bo jedyny sprawdzalny przeciw grze: prawdziwy
   * zrzut `Engine.battle.update`, nie materiał, który sami wyprodukowaliśmy.
   */
  test("materiał z gry: osiem ataków to osiem tur, nie cztery", async () => {
    const stats = aggregate(dekoduj(KOMUNIKATY_Z_GRY, SKLAD_Z_GRY), SKLAD_Z_GRY);
    const tury = (name: string) => stats.actors.find((a) => a.name === name)!.turns;

    // Osiem osobnych ataków w komunikatach i ANI JEDNEJ zapowiedzi umiejętności
    // w całej walce, więc osiem akcji i osiem tur. Panel liczył cztery.
    expect(tury("Łowcożyr Kazrek")).toBe(8);
    expect(tury("Odyniec #1")).toBe(3); // dwa kroki do przodu + jeden cios
    expect(tury("Odyniec #2")).toBe(1); // sam krok do przodu
    expect(tury("Locha")).toBe(0); // zginęła, zanim dostała turę
    expect(stats.timeline).toHaveLength(12); // 9 ataków + 3 kroki

    // Sedno zgłoszenia: średnia „na turę” była zawyżona DOKŁADNIE dwukrotnie.
    const kazrek = stats.actors.find((a) => a.name === "Łowcożyr Kazrek")!;
    expect(kazrek.damageDealt).toBe(2784);
    expect(kazrek.damageDealt / kazrek.turns).toBe(348); // było 696
  });

  /**
   * Druga strona tej samej reguły — bez niej „tura = akcja” zrobiłaby
   * z wielotrafienia tyle tur, ile ciosów. Turę otwiera ZAPOWIEDŹ; ciosy, które
   * do niej należą, są tą samą akcją.
   */
  test("kilka ciosów jednej zapowiedzi to JEDNA tura", async () => {
    const stats = aggregate([
      otwarcie(["Gracz 100t"], ["Wilk 40w"]),
      umiejetnosc("Gracz", "Lodowa strzała"),
      cios("Gracz", "Wilk", [trafienie(300)], { ability: "Lodowa strzała", targetHpPct: 70 }),
      cios("Gracz", "Wilk", [trafienie(300)], { ability: "Lodowa strzała", targetHpPct: 40 }),
    ]);

    expect(stats.actors.find((a) => a.name === "Gracz")!.turns).toBe(1);
    expect(stats.timeline).toHaveLength(1);
  });

  /**
   * Krok do przodu jest akcją — pomoc gry, „Akcja domyślna – podstawowy atak
   * oraz krok do przodu”. Dwa kroki pod rząd to dwie tury i jest to układ
   * z prawdziwej walki: postać z pozycji pierwszej podchodzi do trzeciej
   * dwoma krokami, w dwóch osobnych turach.
   */
  test("dwa kroki tej samej postaci to dwie tury", async () => {
    const stats = aggregate([
      otwarcie(["Gracz 100h"], ["Wilk 40w"]),
      krok("Wilk", 100),
      krok("Wilk", 100),
    ]);

    expect(stats.actors.find((a) => a.name === "Wilk")!.turns).toBe(2);
  });

  /**
   * Własne obrażenia umiejętności (`strike: false`) nie są akcją POSZKODOWANEGO.
   * Na buforze przyciętym w środku umiejętności zapowiedzi nie widać, więc
   * reguła musi trzymać sama ze strażnika `strike`, a nie przez to, że
   * zapowiedź akurat była.
   */
  test("własne obrażenia umiejętności nie otwierają tury poszkodowanemu", async () => {
    const stats = aggregate([
      otwarcie(["Gracz 100m"], ["Wilk 40w"]),
      cios("Wilk", "Wilk", [trafienie(507)], { strike: false, targetHpPct: 60 }),
    ]);

    expect(stats.actors.find((a) => a.name === "Wilk")!.turns).toBe(0);
    // Kwota nie przepada — trafia do tury tła, czyli tam, gdzie agregat trzyma
    // „nie wiemy, czyja to tura”.
    expect(stats.timeline.reduce((sum, s) => sum + s.damage, 0)).toBe(507);
  });
});

/**
 * Efekty w dymku — kto je wyzwolił, a na kim się odpaliły (`AUDYT‑87`).
 *
 * Do 2026‑08‑05 KAŻDY efekt szedł na konto bijącego, więc napastnik miał
 * w rubryce „Efekty w ciosach" napisane, że sparował i pochłonął cios, który
 * sam zadał. Gra mówi co innego: 24 klucze renderuje po stronie bitego, w tym
 * samym kubełku, w którym stoją blok i unik (`STRONA_CELU` w `protokol.ts`).
 */
describe("strona efektu decyduje, czyj jest licznik", () => {
  const SKLAD: RosterEntry[] = [
    { id: 1, name: "Napastnik", side: 0 },
    { id: 2, name: "Cel", side: 1 },
  ];
  const stats = aggregate(
    dekoduj(["1=100.00;2=50.00;+dmgd=500;-dmgd=300;+pierce;-parry;-absorb=200"], SKLAD),
    SKLAD,
  );
  const napastnik = stats.actors.find((a) => a.name === "Napastnik")!;
  const cel = stats.actors.find((a) => a.name === "Cel")!;

  test("obronne liczą się BITEMU, nie bijącemu", () => {
    // Parowanie i absorpcja to tarcza celu. Gdyby wróciło stare `sourceKey`
    // na sztywno, obie pozycje przeskoczyłyby do napastnika i test się zapali.
    expect(cel.procs.map((p) => p.label).sort()).toEqual(["-absorb", "-parry"]);
    expect(napastnik.procsReceived.map((p) => p.label).sort()).toEqual(["-absorb", "-parry"]);
  });

  test("zaczepne zostają przy bijącym", () => {
    expect(napastnik.procs.map((p) => p.label)).toEqual(["+pierce"]);
    expect(cel.procsReceived.map((p) => p.label)).toEqual(["+pierce"]);
  });

  test("żaden efekt nie ginie i żaden nie liczy się dwa razy", () => {
    // Niezmiennik ponad pojedynczą asercją: sumy obu rubryk po obu postaciach
    // mają się zgadzać z liczbą efektów w komunikacie (3).
    const wyzwolone = stats.actors.reduce((s, a) => s + a.procs.length, 0);
    const otrzymane = stats.actors.reduce((s, a) => s + a.procsReceived.length, 0);
    expect([wyzwolone, otrzymane]).toEqual([3, 3]);
  });
});

/**
 * Przypisanie sprawcy zranienia nie zależy od JĘZYKA KLIENTA (`AUDYT‑89`).
 *
 * Wiązanie szło kiedyś wyrażeniem regularnym po polskim zdaniu ze słownika GRY.
 * Zdanie należy do gry, więc na kliencie nie‑polskim — albo po przeformułowaniu
 * przy aktualizacji — wiązanie gasło BEZ OSTRZEŻENIA, a 150 obrażeń przenosiło
 * się z konta łowcy do puli „Bez sprawcy".
 */
describe("zranienie wiąże się po kluczu, nie po brzmieniu", () => {
  const SKLAD: RosterEntry[] = [
    { id: 1, name: "Łowca", side: 0 },
    { id: 2, name: "Mag", side: 0 },
    { id: 3, name: "Wilk", side: 1 },
    { id: 4, name: "Niedźwiedź", side: 1 },
  ];
  // Dwie postacie po stronie przeciwnej, żeby `opponentOf` NIE mogło podstawić
  // sprawcy — inaczej test przechodzi z powodu, którego nie bada.
  const KOMUNIKATY = [
    "1=100.00;3=90.00;+dmgd=400;-dmgd=400;+injure=150",
    "3=80.00;0;injure=150",
  ];

  test.each([
    ["polski", "+Zranienie (%val%)"],
    ["angielski", "+Wound (%val%)"],
    ["klient bez tego zdania", null],
  ])("brzmienie „%s” nie zmienia liczb", (_nazwa, zdanie) => {
    const slownik = new SlownikStaly(zdanie === null ? [] : [["msg_+injure %val%", zdanie]]);
    const stats = aggregate(dekoduj(KOMUNIKATY, SKLAD, slownik), SKLAD);
    const lowca = stats.actors.find((a) => a.name === "Łowca")!;

    // 400 z ciosu + 150 z tyknięcia zranienia, które ten cios zapowiedział.
    expect(lowca.damageDealt).toBe(550);
    // Nic nie wpada do puli bez sprawcy — sprawca stoi w komunikacie.
    expect(totalBySide(stats.unattributedDotDamage)).toBe(0);
  });
});

/**
 * Ubytek życia nie ma sprawcy — i to jest ODPOWIEDŹ, nie luka (`AUDYT‑88`).
 *
 * `opponentOf` zna regułę „gdy po drugiej stronie stoi dokładnie jeden
 * przeciwnik, to on nałożył tykający efekt". Dla trucizny jest słuszna; tutaj
 * byłaby fałszem, bo pomiar w `docs/MECHANIKA.md` wskazuje źródło po TEJ SAMEJ
 * stronie co cel. Układ 1 vs 1 jest tu celowy: to jedyny, w którym `opponentOf`
 * ma kogo podstawić, więc tylko on bada `SELF_INFLICTED_DOTS`.
 */
describe("„Stracono N punktów życia” liczy się jako obrażenia bez sprawcy", () => {
  const SKLAD: RosterEntry[] = [
    { id: 1, name: "Gracz", side: 0 },
    { id: 2, name: "Boss", side: 1 },
  ];
  const stats = aggregate(dekoduj(["1=88.00;0;heal=-92"], SKLAD), SKLAD);
  const gracz = stats.actors.find((a) => a.name === "Gracz")!;
  const boss = stats.actors.find((a) => a.name === "Boss")!;

  test("kwota jest obrażeniami, a nie leczeniem na minusie", () => {
    expect(gracz.damageTaken).toBe(92);
    // Zero, nie −92: przed poprawką stała tu ujemna liczba, a wiersz rozbicia
    // nazywał się „Regeneracja".
    expect(gracz.healingReceived).toBe(0);
    expect(gracz.healedBy).toEqual([]);
  });

  test("sprawcy NIE zgadujemy, choć przeciwnik jest tylko jeden", () => {
    expect(gracz.takenFromBy.map((t) => t.label)).toEqual([UNATTRIBUTED_SOURCE]);
    // Boss nie tknął nikogo — doliczenie mu tej kwoty byłoby twierdzeniem,
    // którego log nie niesie.
    expect(boss.damageDealt).toBe(0);
  });

  test("pula bez sprawcy mówi, CO w niej siedzi", () => {
    expect(stats.unattributedDotDamage.mine).toBe(92);
    expect(stats.unattributedDotDamage.types).toEqual([{ label: "Ubytek życia", amount: 92 }]);
    // Leczenie zostaje nietknięte — to nie jest jego pula.
    expect(totalBySide(stats.unattributedHealing)).toBe(0);
  });
});
