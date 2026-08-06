import { describe, expect, test } from "bun:test";
import {
  czytajZrzut,
  graniceWalk,
  histogram,
  kluczeKomunikatu,
  komunikaty,
  modulZrzutu,
  nazwaFixtura,
  odchudz,
  pseudonimizuj,
  skladZeZrzutu,
  stronyKomunikatu,
  urwany,
  walkiWZrzucie,
  wybierzWalke,
  zachowajZrzut,
  zdejmijOpisy,
  ZDJETY_OPIS,
  type Wywolanie,
  type Zrzut,
} from "../tools/walka.ts";

/**
 * Czego te testy pilnują: żeby zrzut z sondy zamienił się w materiał, który
 * NIE KŁAMIE. Sonda jest przeglądarkowa i testu jednostkowego mieć nie może;
 * wszystko, co da się sprawdzić bez gry, sprawdza się tutaj.
 *
 * ⚠️ **ZNIKŁY STĄD TRZY BLOKI — 2026‑08‑04.** Pilnowały WĘZŁÓW RENDERU: sonda
 * zbierała je obok komunikatów, a narzędzie sklejało z nich drugi format tej
 * samej walki. Cała ta ścieżka istniała po to, żeby dało się porównać protokół
 * z drugim, niezależnym odczytem. Drugiego odczytu nie ma, więc nie ma ani
 * czego porównywać, ani czym.
 */

/**
 * Dwa wywołania sondy: otwarcie walki i jeden cios. Kształt jak z gry.
 *
 * ⚠️ **`ladunek.w` NIE JEST TU OZDOBĄ** — od 2026‑08‑06 to jedyne miejsce
 * niosące `npc`, czyli jedyne, po którym `pseudonimizuj` odróżnia gracza od
 * potwora. Zrzut bez niego zatrzymuje `--zachowaj` z powodem, i tak ma być:
 * migawka `MigawkaWojownika` pola `npc` nie ma, a zgadywanie po znaku `id`
 * byłoby zdaniem o GRZE bez przejścia procedury z `docs/MECHANIKA.md`.
 */
const WPISY: Wywolanie[] = [
  {
    nr: 0,
    ladunek: {
      init: "1",
      w: {
        "1": { id: 1, name: "Kamil", npc: 0, team: 1 },
        "2": { id: 2, name: "Wilk", npc: 1, team: 2 },
      },
    },
    komunikaty: ["0;0;txt=Rozpoczęła się walka pomiędzy Kamil (10w) a Wilk (9w)"],
    wojownicyPrzed: [],
    wojownicyPo: [{ id: 1, name: "Kamil", hp: { cur: 100, max: 100 } }],
  },
  {
    nr: 1,
    ladunek: {},
    komunikaty: ["1=100.00;2=40.37;+dmgd=455;+pierce;-dmgd=455"],
    wojownicyPrzed: [{ id: 2, name: "Wilk", hp: { cur: 100, max: 100 } }],
    wojownicyPo: [{ id: 2, name: "Wilk", hp: { cur: 40, max: 100 } }],
  },
];

const ZRZUT = {
  wersja: 1,
  przy: "2026-08-04T10:00:00.000Z",
  swiat: "tempest",
  build: "1785244275300",
  otwarcie: "Rozpoczęła się walka pomiędzy Kamil (10w) a Wilk (9w)",
  wpisy: WPISY,
};

describe("czytajZrzut", () => {
  test("wczytuje poprawny zrzut", () => {
    const zrzut = czytajZrzut(JSON.stringify(ZRZUT));
    expect(zrzut.swiat).toBe("tempest");
    expect(zrzut.build).toBe("1785244275300");
    expect(zrzut.wpisy).toHaveLength(2);
  });

  test("nie-JSON daje błąd wskazujący na sondę, nie na parser", () => {
    expect(() => czytajZrzut("to nie jest json")).toThrow(/pobierz/);
  });

  test("cudzy JSON o właściwej składni odpada na polach", () => {
    expect(() => czytajZrzut('{"co":"innego"}')).toThrow(/wersja/);
  });

  test("pusty zrzut jest BŁĘDEM, nie pustym materiałem", () => {
    // Zapisany dałby moduł wyglądający jak dowód i pusty w środku —
    // a materiał z gry jest dowodem, nie „danymi testowymi".
    expect(() => czytajZrzut(JSON.stringify({ ...ZRZUT, wpisy: [] }))).toThrow(/wywołania/);
  });

  test("brak `otwarcie` przechodzi — to luka zrzutu, nie jego uszkodzenie", () => {
    // Sonda wklejona po rozpoczęciu walki nie zobaczy linii otwierającej.
    // Taki zrzut nadal niesie protokół i ma się dać zapisać.
    const zrzut = czytajZrzut(JSON.stringify({ ...ZRZUT, otwarcie: null }));
    expect(zrzut.otwarcie).toBeNull();
  });

  /**
   * ⚠️ **NAGŁÓWEK `czytajZrzut` OBIECYWAŁ „sprawdzamy każde pole" I NIE ROBIŁ
   * TEGO** (`AUDYT‑65`). Walidacja kończyła się na `wersja` i `Array.isArray`,
   * a wpisy szły dalej nietknięte — wpis bez `komunikaty` przechodził przez
   * `komunikaty()` jako `[undefined]` BEZ RZUTU i wchodził do `FIXTURY`,
   * `KORPUS` i `dekoduj`. Materiał, który cały jest po to, żeby być dowodem,
   * dostawał dziurę zamiast komunikatu.
   */
  describe("uszkodzone wywołanie odpada, i to ze wskazaniem MIEJSCA", () => {
    const zeZlymWpisem = (wpis: unknown) =>
      JSON.stringify({ ...ZRZUT, wpisy: [WPISY[0], wpis] });

    test("wpis bez `komunikaty`", () => {
      const { komunikaty: _, ...bez } = WPISY[1]!;
      expect(() => czytajZrzut(zeZlymWpisem(bez))).toThrow(/wpis 1.*komunikaty/s);
    });

    test("`komunikaty` z czymś innym niż tekst", () => {
      expect(() => czytajZrzut(zeZlymWpisem({ ...WPISY[1], komunikaty: [42] }))).toThrow(
        /wpis 1.*komunikaty/s,
      );
    });

    test("wpis bez `ladunek`", () => {
      const { ladunek: _, ...bez } = WPISY[1]!;
      expect(() => czytajZrzut(zeZlymWpisem(bez))).toThrow(/wpis 1.*ladunek/s);
    });

    test("wpis bez `wojownicyPo`", () => {
      // `Po` powstaje PO oryginalnym `update`, więc jego brak znaczy uszkodzony
      // zapis, a nie „nie wiadomo".
      const { wojownicyPo: _, ...bez } = WPISY[1]!;
      expect(() => czytajZrzut(zeZlymWpisem(bez))).toThrow(/wpis 1.*wojownicyPo/s);
    });

    test("`wojownicyPrzed: null` PRZECHODZI — to odpowiedź, nie brak", () => {
      // ⚠️ `AUDYT‑73`. Zapis robił wcześniej `przed ?? []`, więc „migawka nie
      // powstała" i „walka nie miała wojowników" wyglądały w pliku identycznie.
      // Dziś pierwsze jest `null` i czytelnik ma je przepuścić — inaczej zrzut
      // z jednym nieudanym `przed()` odpadałby w całości.
      const zrzut = czytajZrzut(zeZlymWpisem({ ...WPISY[1], wojownicyPrzed: null }));
      expect(zrzut.wpisy[1]?.wojownicyPrzed).toBeNull();
    });

    test("`wojownicyPrzed` liczbą zamiast listy odpada", () => {
      expect(() => czytajZrzut(zeZlymWpisem({ ...WPISY[1], wojownicyPrzed: 7 }))).toThrow(
        /wpis 1.*wojownicyPrzed/s,
      );
    });

    test("pole NADMIAROWE przechodzi — czytelnik odrzuca niepełne, nie bogatsze", () => {
      // Najstarszy fixture w repo niesie `render` z rendererem klienta
      // (`AUDYT‑63`), a przyszła sonda dołoży swoje pola. Zrzut bogatszy, niż
      // czytelnik zna, ma się dać przeczytać.
      const zrzut = czytajZrzut(zeZlymWpisem({ ...WPISY[1], render: ["<div>x</div>"] }));
      expect(zrzut.wpisy).toHaveLength(2);
    });
  });
});

describe("urwany zrzut", () => {
  // ⚠️ `AUDYT‑86`. Pole `przepelniony` znaczy „bufor stanął, końca walki nie ma".
  // Okno ustawień mówiło o tym graczowi, ale narzędzie — czyli jedyne miejsce,
  // przez które materiał wchodzi do repo — milczało w obu poleceniach.
  test("zrzut z pełnym buforem daje ostrzeżenie", () => {
    const z = czytajZrzut(JSON.stringify({ ...ZRZUT, przepelniony: true }));
    expect(urwany(z)).toContain("URWANY");
  });

  test("zwykły zrzut nie daje żadnego", () => {
    expect(urwany(czytajZrzut(JSON.stringify(ZRZUT)))).toBeNull();
  });

  test("`przepelniony: false` to NIE to samo co brak pola, ale też nie ostrzeżenie", () => {
    // Stary zrzut sondy pola nie ma wcale; nowy z dodatku ma je ustawione na
    // `false`. Żaden z nich nie jest urwany i oba mają milczeć.
    expect(urwany(czytajZrzut(JSON.stringify({ ...ZRZUT, przepelniony: false })))).toBeNull();
  });
});

describe("kluczeKomunikatu", () => {
  test("dwa pierwsze segmenty to strony, nie klucze", () => {
    expect(kluczeKomunikatu("1=100.00;2=40.37;+dmgd=455")).toEqual(["+dmgd"]);
  });

  test("klucz kończy się na PIERWSZYM `=`, bo wartość bywa złożona", () => {
    expect(kluczeKomunikatu("1;2;X=1053,a,Dark Laser(92.90%)")).toEqual(["X"]);
  });

  test("parametr bez wartości jest całym segmentem", () => {
    expect(kluczeKomunikatu("1;2;+pierce;r;+dmgd=10")).toEqual(["+pierce", "r", "+dmgd"]);
  });

  test("komunikat bez parametrów daje pustą listę, nie wyjątek", () => {
    expect(kluczeKomunikatu("0;0")).toEqual([]);
  });
});

describe("stronyKomunikatu", () => {
  test("czyta id i życie obu stron", () => {
    expect(stronyKomunikatu("1=100.00;2=40.37;+dmgd=455")).toEqual([
      { id: 1, hpp: 100 },
      { id: 2, hpp: 40.37 },
    ]);
  });

  test("`0` to brak strony, nie wojownik o id 0", () => {
    // Tyknięcie trucizny ma pustą drugą stronę i to jest ODPOWIEDŹ:
    // protokół nie mówi, kto ją nałożył. Zamiana na id 0 zrobiłaby
    // z tej luki nazwisko.
    expect(stronyKomunikatu("119444=6.71;0;anguish=3615")).toEqual([{ id: 119444, hpp: 6.71 }]);
  });

  test("strona bez życia jest dopuszczalna", () => {
    expect(stronyKomunikatu("718280;0;e=17696")).toEqual([{ id: 718280, hpp: null }]);
  });
});

describe("histogram", () => {
  test("liczy klucze po całym zbiorze, od najczęstszego", () => {
    expect(histogram(["1;2;a=1;b=2", "1;2;a=3"])).toEqual([
      ["a", 2],
      ["b", 1],
    ]);
  });
});

describe("modulZrzutu", () => {
  /**
   * Zrzut z `myteam` i `team`, bo bez nich składu nie da się odczytać — i to
   * jest część kontraktu tej funkcji, nie tło testu.
   */
  const PELNY: Zrzut = {
    wersja: 1,
    przy: "2026-08-04T10:00:00.000Z",
    swiat: "tempest",
    build: "1785244275300",
    otwarcie: "Rozpoczęła się walka pomiędzy Kamil (10w) a Wilk (9w)",
    wpisy: [
      {
        nr: 0,
        ladunek: { myteam: 1 },
        komunikaty: ['1=100.00;2=40.37;+dmgd=455;txt=Kamil: "cios\\ostatni"'],
        wojownicyPrzed: [],
        wojownicyPo: [
          { id: 1, name: "Kamil", team: 1, prof: "m", lvl: 100 },
          { id: -2, name: "Wilk", team: 2 },
        ],
      },
    ],
  };
  const kod = modulZrzutu(PELNY, "2026-08-05", "kamil-vs-wilk");

  test("wynik jest modułem TypeScriptu, a nie tekstem, który go przypomina", () => {
    // Najtańszy sposób sprawdzenia całości naraz: jeśli cokolwiek w składaniu
    // się rozjedzie (niezamknięty cudzysłów w komunikacie, przecinek w składzie),
    // transpilacja padnie. Bez tego test sprawdzałby fragmenty tekstu i przepuścił
    // plik, którego `bun` nie wczyta.
    expect(() => new Bun.Transpiler({ loader: "ts" }).transformSync(kod)).not.toThrow();
  });

  test("komunikat z cudzysłowem i ukośnikiem przechodzi bez uszkodzenia", () => {
    // Serwer wkleja w `txt=` treść od gracza — z apostrofami, cudzysłowami
    // i ukośnikami. To jest dokładnie ten kształt, na którym własny serializator
    // by poległ, a `JSON.stringify` nie.
    expect(kod).toContain(JSON.stringify(PELNY.wpisy[0]!.komunikaty[0]!));
  });

  test("nagłówek niesie POCHODZENIE — świat, build i obie daty", () => {
    // Materiał bez pochodzenia jest nieodróżnialny od syntetycznego, a to jest
    // jedyna rzecz, która go w tym repo wyróżnia.
    expect(kod).toContain("tempest");
    expect(kod).toContain("1785244275300");
    expect(kod).toContain("2026-08-04"); // zebrany
    expect(kod).toContain("2026-08-05"); // rozbity
    expect(kod).toContain("kamil-vs-wilk");
  });

  test("opis czeka na człowieka — narzędzie go nie zmyśla", () => {
    // Trzy pola, wszystkie puste. Zmyślony opis fixture'a czyta się potem
    // ZAMIAST materiału i jest wtedy gorszy niż jego brak.
    expect(kod.match(/DO UZUPEŁNIENIA/g)).toHaveLength(3);
  });

  test("skład idzie z migawek wojowników, a NIE z linii otwierającej", () => {
    // Linia otwierająca niesie nazwę, poziom i profesję — ale nie `id`, więc
    // złożony z niej skład nie miałby jak związać protokołu z nazwą. `-2` może
    // wyjść tylko z migawki.
    expect(kod).toContain("{ id: -2, name: \"Wilk\", side: 1 },");
    expect(kod).toContain("{ id: 1, name: \"Kamil\", side: 0, prof: \"m\", lvl: 100 },");
  });

  test("zrzut bez `myteam` nie produkuje modułu z odwróconymi stronami", () => {
    // Pada zamiast zgadywać — moduł ze zgadniętymi stronami wyglądałby jak
    // materiał z gry i kłamał o tym, kto z kim walczył.
    const bezDruzyny: Zrzut = {
      ...PELNY,
      wpisy: [{ ...PELNY.wpisy[0]!, ladunek: {} }],
    };
    expect(() => modulZrzutu(bezDruzyny, "2026-08-05", "x")).toThrow(/myteam/);
  });

  test("brak linii otwierającej jest ZAPISANY, a nie przemilczany", () => {
    const bezOtwarcia = modulZrzutu({ ...PELNY, otwarcie: null }, "2026-08-05", "x");
    expect(bezOtwarcia).toContain("BEZ LINII OTWIERAJĄCEJ");
  });
});

describe("komunikaty", () => {
  test("granica wywołania znika przy odczycie", () => {
    // Jedno `update` niesie tyle komunikatów, ile serwer akurat przysłał —
    // ta granica nie znaczy nic dla treści walki.
    expect(komunikaty(WPISY)).toHaveLength(2);
  });
});

describe("skladZeZrzutu", () => {
  const wpis = (ladunek: Record<string, unknown>, wojownicy: unknown[]): Wywolanie => ({
    nr: 0,
    ladunek,
    komunikaty: [],
    wojownicyPrzed: [],
    wojownicyPo: wojownicy,
  });
  const zrzut = (wpisy: Wywolanie[]): Zrzut => ({
    wersja: 1,
    przy: "2026-08-04T10:00:00.000Z",
    swiat: "tempest",
    build: "1785244275300",
    otwarcie: null,
    wpisy,
  });

  const KAMIL = { id: 1, name: "Kamil", team: 1, prof: "m", lvl: 100 };
  const LOCHA = { id: 2, name: "Locha", team: 2, prof: "w", lvl: 50 };

  test("strona 0 to drużyna gracza, wskazana przez `myteam`", () => {
    const sklad = skladZeZrzutu(zrzut([wpis({ myteam: 1 }, [KAMIL, LOCHA])]));
    expect(sklad).toEqual([
      { id: 1, name: "Kamil", side: 0, prof: "m", lvl: 100 },
      { id: 2, name: "Locha", side: 1, prof: "w", lvl: 50 },
    ]);
  });

  test("gracz w drużynie 2 odwraca strony — i to jest cały powód, dla którego czytamy `myteam`", () => {
    // Wersja „team !== 2 to strona 0" dałaby tu odwrotnie. Nikt nie sprawdził,
    // czy gracz bywa drużyną 2, więc zgadywanie tu byłoby cichym odwróceniem
    // drużyn w panelu.
    const sklad = skladZeZrzutu(zrzut([wpis({ myteam: 2 }, [KAMIL, LOCHA])]));
    expect(sklad.find((w) => w.name === "Locha")?.side).toBe(0);
    expect(sklad.find((w) => w.name === "Kamil")?.side).toBe(1);
  });

  test("zrzut bez `myteam` PADA z powodem, zamiast zgadywać stronę", () => {
    expect(() => skladZeZrzutu(zrzut([wpis({}, [KAMIL])]))).toThrow(/myteam/);
  });

  test("skład zbiera się ze WSZYSTKICH wywołań, nie z pierwszego", () => {
    // Przyzwania i zastępowi dochodzą w trakcie walki.
    const przyzwany = { id: 3, name: "Wilk", team: 1, prof: "w", lvl: 20 };
    const sklad = skladZeZrzutu(
      zrzut([wpis({ myteam: 1 }, [KAMIL]), wpis({}, [KAMIL, przyzwany])]),
    );
    expect(sklad.map((w) => w.name).sort()).toEqual(["Kamil", "Wilk"]);
  });

  test("wpisy bez id, nazwy albo drużyny są pomijane, a nie wpisywane z zerami", () => {
    const sklad = skladZeZrzutu(
      zrzut([
        wpis({ myteam: 1 }, [
          KAMIL,
          { id: null, name: "Bez id", team: 1 },
          { id: 9, name: "", team: 1 },
          { id: 10, name: "Bez drużyny", team: null },
        ]),
      ]),
    );
    expect(sklad).toHaveLength(1);
  });

  test("pola opcjonalne nie wchodzą jako undefined, gdy zrzut ich nie ma", () => {
    const sklad = skladZeZrzutu(
      zrzut([wpis({ myteam: 1 }, [{ id: 1, name: "Kamil", team: 1, prof: null, lvl: null }])]),
    );
    expect(sklad[0]).toEqual({ id: 1, name: "Kamil", side: 0 });
  });
});

describe("odchudz — zrzut bez powtórzeń", () => {
  const wpis = (nr: number, ladunek: Record<string, unknown>, wojownicy: unknown[] = [], kom: string[] = []): Wywolanie => ({
    nr,
    ladunek,
    komunikaty: kom,
    wojownicyPrzed: [],
    wojownicyPo: wojownicy,
  });

  test("dokładne powtórzenie kształtu i stanu wypada", () => {
    // Kształt z pierwszego prawdziwego zrzutu: 567 wywołań `{move, endBattle}`
    // po zakończeniu walki, wszystkie identyczne. 1,8 MB pliku na 15 kB treści.
    const wpisy = [wpis(0, { move: -1, endBattle: 1 }), wpis(1, { move: -1, endBattle: 1 }), wpis(2, { move: -1, endBattle: 1 })];
    expect(odchudz(wpisy)).toHaveLength(1);
  });

  test("wpis z komunikatami zostaje ZAWSZE, choćby był powtórzeniem", () => {
    const wpisy = [wpis(0, { m: 1 }, [], ["0;0;txt=a"]), wpis(1, { m: 1 }, [], ["0;0;txt=b"])];
    expect(odchudz(wpisy)).toHaveLength(2);
  });

  test("nowy KSZTAŁT ładunku zostaje, nawet bez komunikatów", () => {
    // Inaczej zgubilibyśmy fakt, że gra w ogóle wysyła `endBattle`.
    const wpisy = [wpis(0, { move: -1 }), wpis(1, { move: -1 }), wpis(2, { move: -1, endBattle: 1 })];
    expect(odchudz(wpisy).map((w) => w.nr)).toEqual([0, 2]);
  });

  test("nowa migawka wojowników zostaje — krzywa życia nie może się urwać", () => {
    const wpisy = [
      wpis(0, { move: -1 }, [{ id: 1, hp: 100 }]),
      wpis(1, { move: -1 }, [{ id: 1, hp: 100 }]),
      wpis(2, { move: -1 }, [{ id: 1, hp: 60 }]),
    ];
    expect(odchudz(wpisy).map((w) => w.nr)).toEqual([0, 2]);
  });

  test("nic do odrzucenia — zrzut przechodzi bez zmian", () => {
    const wpisy = [wpis(0, { a: 1 }), wpis(1, { b: 2 })];
    expect(odchudz(wpisy)).toHaveLength(2);
  });
});

/**
 * `pseudonimizuj` — pseudonimy graczy nie wchodzą do publicznego repo.
 *
 * ⚠️ **NAZWY W TYM BLOKU SĄ ZMYŚLONE I MAJĄ TAKIE ZOSTAĆ.** Wstawienie tu
 * prawdziwego nicka byłoby wniesieniem do repo dokładnie tego, czego ta funkcja
 * ma się pozbywać — a test „anonimizator działa" niosący cudzy pseudonim jest
 * najgłupszą możliwą wersją tego błędu.
 */
describe("pseudonimizuj", () => {
  const walka = (
    wojownicy: Record<string, unknown>,
    kom: string[] = [],
    dodatkowe: Partial<Zrzut> = {},
  ): Zrzut => ({
    wersja: 1,
    przy: "2026-08-06T10:00:00.000Z",
    swiat: "tempest",
    build: "1785244275300",
    otwarcie: null,
    ...dodatkowe,
    wpisy: [
      {
        nr: 0,
        ladunek: { init: "1", myteam: 1, w: wojownicy },
        komunikaty: kom,
        wojownicyPrzed: [],
        wojownicyPo: Object.values(wojownicy),
      },
    ],
  });

  const GRACZ = { id: 1, name: "Nazwa Gracza", npc: 0, team: 1 };
  const POTWOR = { id: -2, name: "Odyniec", npc: 1, team: 2 };

  test("gracz dostaje etykietę, potwór zostaje sobą", () => {
    // Nazwy potworów są elementem gry, nie danymi człowieka, i są dowodem:
    // to po nich widać, że dwie instancje o tej samej nazwie rozdzielają się
    // po `id`. Podstawienie ich zabrałoby materiał i nie dałoby nic w zamian.
    const wynik = pseudonimizuj(walka({ "1": GRACZ, "-2": POTWOR }));
    const w = wynik.zrzut.wpisy[0]!.ladunek["w"] as Record<string, { name: string }>;

    expect(w["1"]!.name).toBe("Gracz 1");
    expect(w["-2"]!.name).toBe("Odyniec");
    expect(wynik.mapa.get("Nazwa Gracza")).toBe("Gracz 1");
  });

  test("podstawienie łapie komunikaty, migawki, `render` i `otwarcie`, nie sam `w{}`", () => {
    // To jest cały powód, dla którego funkcja chodzi po całym JSON-ie: nazwa
    // siedzi w zrzucie w pięciu miejscach naraz, a podmiana w jednym zostawia
    // plik, który wygląda na zredagowany i nie jest.
    const zrzut = walka({ "1": GRACZ, "-2": POTWOR }, ["0;0;winner=Nazwa Gracza"], {
      otwarcie: "Rozpoczęła się walka pomiędzy Nazwa Gracza (40h) a Odyniec (41w)",
    });
    (zrzut.wpisy[0] as unknown as Record<string, unknown>)["render"] = [
      "<div>Nazwa Gracza(100%) uderzył z siłą</div>",
    ];
    const wynik = pseudonimizuj(zrzut);
    const wpis = wynik.zrzut.wpisy[0] as unknown as Record<string, unknown>;

    expect(wynik.zrzut.wpisy[0]!.komunikaty).toEqual(["0;0;winner=Gracz 1"]);
    expect(wynik.zrzut.otwarcie).toBe("Rozpoczęła się walka pomiędzy Gracz 1 (40h) a Odyniec (41w)");
    expect(wpis["render"]).toEqual(["<div>Gracz 1(100%) uderzył z siłą</div>"]);
    expect((wynik.zrzut.wpisy[0]!.wojownicyPo[0] as { name: string }).name).toBe("Gracz 1");
  });

  test("liczby i `id` przechodzą NIETKNIĘTE — plik ma zostać dowodem", () => {
    const zrzut = walka({ "1": { ...GRACZ, hp: { max: 5815, cur: 900 } }, "-2": POTWOR }, [
      "1=100.00;-2=68.15;+dmgd=498;-dmgd=243",
    ]);
    const wynik = pseudonimizuj(zrzut);
    const w = wynik.zrzut.wpisy[0]!.ladunek["w"] as Record<string, { id: number; hp: unknown }>;

    expect(w["1"]!.id).toBe(1);
    expect(w["1"]!.hp).toEqual({ max: 5815, cur: 900 });
    expect(wynik.zrzut.wpisy[0]!.komunikaty[0]).toBe("1=100.00;-2=68.15;+dmgd=498;-dmgd=243");
  });

  test("nazwa będąca PODCIĄGIEM innej nie kaleczy tamtej", () => {
    // Bez sortowania od najdłuższej „Aro" podstawione pierwsze zrobiłoby
    // z „Aro Wielki" napis „Gracz 2 Wielki" — postać, której nie ma.
    const zrzut = walka(
      {
        "1": { id: 1, name: "Aro Wielki", npc: 0, team: 1 },
        "2": { id: 2, name: "Aro", npc: 0, team: 1 },
      },
      ["0;0;winner=Aro Wielki, Aro"],
    );

    expect(pseudonimizuj(zrzut).zrzut.wpisy[0]!.komunikaty[0]).toBe("0;0;winner=Gracz 1, Gracz 2");
  });

  test("wojownik bez `npc` ZATRZYMUJE zapis, zamiast zgadywać", () => {
    // `npc` niesie wyłącznie `ladunek.w`; migawka go nie ma. Zgadnięcie
    // „gracz" psułoby nazwy potworów, zgadnięcie „potwór" wpuszczałoby nick.
    const zrzut = walka({ "1": GRACZ });
    zrzut.wpisy[0]!.wojownicyPo = [{ id: 7, name: "Ktoś Obcy", team: 2 }];

    expect(() => pseudonimizuj(zrzut)).toThrow(/nie da się ustalić/);
  });

  test("dwóch graczy o tej samej nazwie ZATRZYMUJE zapis", () => {
    // W `w{}` rozdziela ich `id`, ale w `render` i `winner=` stoi sam napis.
    const zrzut = walka({
      "1": { id: 1, name: "Ta Sama", npc: 0, team: 1 },
      "2": { id: 2, name: "Ta Sama", npc: 0, team: 2 },
    });

    expect(() => pseudonimizuj(zrzut)).toThrow(/tę samą nazwę/);
  });

  test("drugi przebieg nie zmienia nic — na tym stoi strażnik fixture'ów", () => {
    const raz = pseudonimizuj(walka({ "1": GRACZ, "-2": POTWOR }, ["0;0;winner=Nazwa Gracza"]));
    const dwa = pseudonimizuj(raz.zrzut);

    expect(raz.zmienionych).toBeGreaterThan(0);
    expect(dwa.zmienionych).toBe(0);
    expect(dwa.zrzut).toEqual(raz.zrzut);
  });

  test("`pseudonimow` mówi, ile podstawiono, i SUMUJE się przy powtórnym przebiegu", () => {
    // Bez sumowania plik przepuszczony drugi raz zapominałby, że przeszedł
    // redakcję — a to jedyny ślad odróżniający `Gracz 1` od czyjegoś nicka.
    const zapisany = JSON.parse(zachowajZrzut(walka({ "1": GRACZ, "-2": POTWOR }))) as Zrzut;
    expect(zapisany.pseudonimow).toBe(2);

    const powtornie = JSON.parse(zachowajZrzut(czytajZrzut(JSON.stringify(zapisany)))) as Zrzut;
    expect(powtornie.pseudonimow).toBe(2);
  });
});

/**
 * `zdejmijOpisy` — zdania napisane przez twórców gry nie wchodzą do repo na MIT.
 *
 * Druga kategoria po pseudonimach i z tego samego powodu: `NOTICE.md`, regulamin
 * gry VII.2 m. Reguła ⛔ **BRZMIENIA GRY → NIGDZIE** stała w `AGENTS.md` od
 * 2026‑08‑06 i po stronie materiału nie pilnowało jej nic — dokładnie ta sama
 * dziura, którą tego samego dnia zamknięto po stronie nicków.
 *
 * ⚠️ **ZDANIA W TYM BLOKU SĄ ZMYŚLONE I MAJĄ TAKIE ZOSTAĆ**, z tego samego
 * powodu, co zmyślone nicki wyżej: test „usuwacz cudzej treści działa" niosący
 * cudzą treść jest najgłupszą wersją tego błędu.
 */
describe("zdejmijOpisy", () => {
  // Układ z gry: dziesięć pól na umiejętność, opis na piątym.
  const umiejetnosc = (opis: string) => [
    "85",
    "Nazwa Umiejętności",
    "5",
    "9",
    "4",
    opis,
    "reqp=h;lvl=25",
    "1/10",
    "red-sa=16;cooldown=5",
    "",
  ];
  const zeSkillami = (skills: unknown[]): Zrzut => ({
    wersja: 1,
    przy: "2026-08-06T10:00:00.000Z",
    swiat: "tempest",
    build: "1785244275300",
    otwarcie: null,
    wpisy: [
      {
        nr: 0,
        ladunek: { init: "1", myteam: 1, skills },
        komunikaty: [],
        wojownicyPrzed: [],
        wojownicyPo: [],
      },
    ],
  });

  const skills = (z: Zrzut) => z.wpisy[0]!.ladunek["skills"] as string[];

  test("opis schodzi, a `id`, nazwa, wymagania i parametry ZOSTAJĄ", () => {
    // To jest cała granica tej funkcji: nazwy funkcyjne są materiałem i zostają,
    // proza jest cudzą twórczością i schodzi. Ta sama linia, co przy `+abdest`
    // kontra zdanie spod tego klucza.
    const wynik = zdejmijOpisy(zeSkillami(umiejetnosc("Zmyślone zdanie o czymś tam.")));

    expect(wynik.zdjetych).toBe(1);
    expect(skills(wynik.zrzut)[5]).toBe(ZDJETY_OPIS);
    expect(skills(wynik.zrzut)[0]).toBe("85");
    expect(skills(wynik.zrzut)[1]).toBe("Nazwa Umiejętności");
    expect(skills(wynik.zrzut)[6]).toBe("reqp=h;lvl=25");
    expect(skills(wynik.zrzut)[8]).toBe("red-sa=16;cooldown=5");
  });

  test("pusty opis nie jest zdjęciem — nie ma czego liczyć", () => {
    // Umiejętność bez opisu wygląda tak samo w zrzucie z gry; liczenie jej
    // podniosłoby `opisow` o coś, czego nigdy w pliku nie było.
    expect(zdejmijOpisy(zeSkillami(umiejetnosc(""))).zdjetych).toBe(0);
  });

  test("drugi przebieg nie zmienia nic — na tym stoi strażnik fixture'ów", () => {
    const raz = zdejmijOpisy(zeSkillami(umiejetnosc("Zmyślone zdanie o czymś tam.")));
    const dwa = zdejmijOpisy(raz.zrzut);

    expect(dwa.zdjetych).toBe(0);
    expect(dwa.zrzut).toEqual(raz.zrzut);
  });

  test("tablica o nieznanym układzie ZATRZYMUJE zapis, zamiast ciąć po numerze", () => {
    // Grupa po dziesięć jest zdaniem o GRZE (`docs/MECHANIKA.md`). Gdyby gra
    // przestawiła układ, wycięcie pola 5 usunęłoby nie to, co trzeba — i zrobiło
    // to na materiale dowodowym, po cichu.
    expect(() => zdejmijOpisy(zeSkillami(["85", "Nazwa", "5"]))).toThrow(/wielokrotność/);
  });

  test("`opisow` mówi, ile zdjęto, i SUMUJE się przy powtórnym przebiegu", () => {
    const zapisany = JSON.parse(
      zachowajZrzut(zeSkillami(umiejetnosc("Zmyślone zdanie o czymś tam."))),
    ) as Zrzut;
    expect(zapisany.opisow).toBe(1);

    const powtornie = JSON.parse(zachowajZrzut(czytajZrzut(JSON.stringify(zapisany)))) as Zrzut;
    expect(powtornie.opisow).toBe(1);
  });
});

/**
 * `--zachowaj` — SUROWY zrzut do `tests/fixtures/`.
 *
 * Czego ten blok pilnuje: żeby fixture był tym samym materiałem, co zrzut, a nie
 * jego streszczeniem. Moduł z `--rozbij` gubi `hp.max`, ładunki i granice
 * wywołań; gdyby to samo gubił fixture, cała runda byłaby bez sensu, bo świadek
 * spoza dekodera stoi właśnie na `hp.max`.
 */
describe("zachowajZrzut", () => {
  const zachowany = (z: Zrzut) => JSON.parse(zachowajZrzut(z)) as Zrzut;

  test("niesie ŁADUNEK i MIGAWKI, czyli wszystko, co gubi moduł", () => {
    const wynik = zachowany(czytajZrzut(JSON.stringify(ZRZUT)));

    expect(wynik.wpisy[1]?.ladunek).toEqual({});
    // To jest cała stawka: `hp.max` przepada w `--rozbij`, a bez niego nie da
    // się sprawdzić procentu życia z protokołu przeciw obrażeniom z dekodera.
    expect(wynik.wpisy[1]?.wojownicyPrzed).toEqual([{ id: 2, name: "Wilk", hp: { cur: 100, max: 100 } }]);
    expect(wynik.wpisy[1]?.wojownicyPo).toEqual([{ id: 2, name: "Wilk", hp: { cur: 40, max: 100 } }]);
  });

  test("granice wywołań zostają — komunikaty NIE zlewają się w jedną listę", () => {
    // Bez granic nie ma jak dojść do walki turowej z `data.current`: porcje
    // przychodzą tam osobnymi wywołaniami i to jest cała informacja.
    const wynik = zachowany(czytajZrzut(JSON.stringify(ZRZUT)));

    expect(wynik.wpisy).toHaveLength(2);
    expect(wynik.wpisy.map((w) => w.komunikaty.length)).toEqual([1, 1]);
  });

  test("odchudza i zapisuje, ILE odchudził", () => {
    const powtorki: Wywolanie[] = [0, 1, 2].map((nr) => ({
      nr,
      ladunek: { move: -1, endBattle: 1 },
      komunikaty: [],
      wojownicyPrzed: [],
      wojownicyPo: [],
    }));
    const wynik = zachowany({ ...ZRZUT, wpisy: [...WPISY, ...powtorki] });

    expect(wynik.wpisy).toHaveLength(3);
    expect(wynik.odchudzonych).toBe(2);
  });

  test("`odchudzonych` przeżywa drogę przez `czytajZrzut`", () => {
    // Inaczej liczba byłaby w pliku, ale znikałaby przy każdym odczycie — czyli
    // nie dałoby się jej sprawdzić testem ani pokazać w `--pokaz`.
    const cisza: Wywolanie = {
      nr: 9,
      ladunek: { move: -1 },
      komunikaty: [],
      wojownicyPrzed: [],
      wojownicyPo: [],
    };

    expect(czytajZrzut(zachowajZrzut({ ...ZRZUT, wpisy: [...WPISY] })).odchudzonych).toBe(0);
    expect(czytajZrzut(zachowajZrzut({ ...ZRZUT, wpisy: [...WPISY, cisza, cisza] })).odchudzonych).toBe(1);
  });

  test("jest wcięty i kończy się nową linią", () => {
    // Wcięcie kupuje czytelny diff przy podmianie materiału; nowa linia na końcu
    // to zwykła higiena pliku w repo.
    const tekst = zachowajZrzut(czytajZrzut(JSON.stringify(ZRZUT)));

    expect(tekst).toContain('\n  "wersja": 1');
    expect(tekst.endsWith("}\n")).toBe(true);
  });

  test("granicą walki jest `init` w ładunku, nie pole `walka`", () => {
    // Kształt z PRAWDZIWEGO zrzutu (tempest, 2026‑08‑05): koniec poprzedniej
    // walki, `close`, potem `init` nowej — wszystko pod jednym numerem `walka`,
    // bo gra nie wymieniła obiektu `Engine.battle`.
    const sesja: Wywolanie[] = [
      { nr: 0, walka: 1, ladunek: { endBattle: 1, move: -1 }, komunikaty: [], wojownicyPrzed: [], wojownicyPo: [] },
      { nr: 1, walka: 1, ladunek: { close: 1 }, komunikaty: [], wojownicyPrzed: [], wojownicyPo: [] },
      { nr: 2, walka: 1, ladunek: { init: "1", myteam: 1 }, komunikaty: [], wojownicyPrzed: [], wojownicyPo: [] },
    ];

    expect(graniceWalk(sesja)).toEqual([2]);
    expect(walkiWZrzucie({ ...ZRZUT, wpisy: sesja })).toEqual([1]);
  });

  test("nazwa pliku zaczyna się datą, żeby katalog sortował się sam", () => {
    expect(nazwaFixtura(czytajZrzut(JSON.stringify(ZRZUT)), "kamil-vs-wilk")).toBe(
      "2026-08-04-tempest-kamil-vs-wilk.json",
    );
  });
});

/**
 * Zrzut z DODATKU — kilka walk w jednym pliku.
 *
 * Sonda żyje jedną walkę, więc do 2026‑08‑05 pytanie „która to walka" nie
 * istniało. Dodatek zbiera całą sesję i to zmienia stawkę: sklejenie dwóch
 * walk w jeden moduł dałoby fixture z pomieszanymi komunikatami i scalonym
 * składem — materiał wyglądający na dowód i kłamiący o tym, kto z kim walczył.
 */
describe("zrzut z kilku walk", () => {
  const wpisSesji = (nr: number, walka: number, kom: string[]): Wywolanie => ({
    nr,
    walka,
    ladunek: { myteam: 1 },
    komunikaty: kom,
    wojownicyPrzed: [],
    wojownicyPo: [{ id: nr + 1, name: `Ktoś ${walka}`, team: 1 }],
  });

  const SESJA: Zrzut = {
    wersja: 1,
    zrodlo: "dodatek",
    przy: "2026-08-05T10:00:00.000Z",
    swiat: "tempest",
    build: "1785244275300",
    otwarcie: "Rozpoczęła się walka pomiędzy A a B",
    otwarcia: { "1": "Rozpoczęła się walka pomiędzy A a B", "2": "Rozpoczęła się walka pomiędzy C a D" },
    wpisy: [
      wpisSesji(0, 1, ["1=100.00;2=50.00;+dmgd=10;-dmgd=10"]),
      wpisSesji(1, 2, ["3=100.00;4=50.00;+dmgd=20;-dmgd=20"]),
      wpisSesji(2, 2, ["3=100.00;4=00.00;+dmgd=30;-dmgd=30"]),
    ],
  };

  test("czytajZrzut przepuszcza pola młodsze od sondy", () => {
    const z = czytajZrzut(JSON.stringify(SESJA));
    expect(z.zrodlo).toBe("dodatek");
    expect(z.otwarcia?.["2"]).toBe("Rozpoczęła się walka pomiędzy C a D");
  });

  test("stary zrzut sondy czyta się dalej, bez numeracji walk", () => {
    // To jest cała cena zgodności wstecz i ma być sprawdzona: pliki zebrane
    // przed 2026‑08‑05 nie mają ani `zrodlo`, ani `walka`.
    const z = czytajZrzut(JSON.stringify(ZRZUT));
    expect(z.zrodlo).toBeUndefined();
    expect(walkiWZrzucie(z)).toEqual([]);
  });

  test("walkiWZrzucie wypisuje numery rosnąco, bez powtórzeń", () => {
    expect(walkiWZrzucie(czytajZrzut(JSON.stringify(SESJA)))).toEqual([1, 2]);
  });

  test("wybierzWalke bierze TYLKO jej wpisy i numeruje je od zera", () => {
    const jedna = wybierzWalke(czytajZrzut(JSON.stringify(SESJA)), 2);
    expect(jedna.wpisy).toHaveLength(2);
    expect(jedna.wpisy.map((w) => w.nr)).toEqual([0, 1]);
    expect(komunikaty(jedna.wpisy)).toEqual([
      "3=100.00;4=50.00;+dmgd=20;-dmgd=20",
      "3=100.00;4=00.00;+dmgd=30;-dmgd=30",
    ]);
  });

  test("wybierzWalke podstawia linię otwierającą TEJ walki", () => {
    expect(wybierzWalke(czytajZrzut(JSON.stringify(SESJA)), 2).otwarcie).toBe(
      "Rozpoczęła się walka pomiędzy C a D",
    );
  });

  test("wybór walki, której nie ma, pada z listą tych, które są", () => {
    expect(() => wybierzWalke(czytajZrzut(JSON.stringify(SESJA)), 7)).toThrow(/1, 2/);
  });

  test("wybierzWalke NIE przenosi metadanych cudzych walk", () => {
    // ⚠️ `AUDYT‑66`. Stało tu `{ ...zrzut, otwarcie, wpisy }`, więc fixture
    // jednej walki wychodził z `otwarcia` CAŁEJ sesji — czyli z linią
    // otwierającą walki, której w pliku nie ma — a do tego z `pominietych`
    // policzonym dla wszystkich walk naraz. To ten sam zarzut, który ta runda
    // postawiła skasowanemu `meta.json`.
    const jedna = wybierzWalke(
      czytajZrzut(JSON.stringify({ ...SESJA, pominietych: 57 })),
      2,
    );

    expect(jedna.otwarcia).toBeUndefined();
    // `pominietych` jest LICZNIKIEM sesji: zawężony nie da się policzyć, bo
    // zrzut nie mówi, ile odsiano w której walce.
    expect(jedna.pominietych).toBeUndefined();
    // Pochodzenie zostaje — ono dotyczy pliku, nie walki.
    expect(jedna.zrodlo).toBe("dodatek");
    expect(jedna.swiat).toBe("tempest");
    expect(jedna.otwarcie).toBe("Rozpoczęła się walka pomiędzy C a D");
  });

  /**
   * `przepelniony` STAŁO W TEŚCIE WYŻEJ JAKO `toBeUndefined()` — czyli usterka
   * była zakodowana jako oczekiwanie (`AUDYT‑103`).
   *
   * Zbiorcze zdanie „`pominietych` i `przepelniony` są własnością sesji" jest
   * prawdą o liczniku i nieprawdą o fladze: ta nie jest liczbą do rozdzielenia,
   * tylko faktem o KOŃCU bufora. Którą walkę bufor uciął, wynika z naszego
   * własnego kodu — `KolekcjonerZrzutu.po` po przepełnieniu wychodzi wcześniej
   * i nie zapisuje już nic — więc urwana jest walka o NAJWYŻSZYM numerze.
   *
   * Skutek był zmierzony i trafiał dokładnie w drogę materiału z dodatku:
   * `--zachowaj … --walka <n>` woła `urwany()` na zrzucie JUŻ zawężonym, więc
   * ostrzeżenie z `AUDYT‑86` milczało — i to przy walce, którą się zwykle
   * wybiera, bo ostatniej.
   */
  test("urwany zrzut ZOSTAJE urwany po zawężeniu do ostatniej walki", () => {
    const ostatnia = wybierzWalke(
      czytajZrzut(JSON.stringify({ ...SESJA, przepelniony: true })),
      2,
    );

    expect(ostatnia.przepelniony).toBe(true);
    expect(urwany(ostatnia)).toContain("URWANY");
  });

  test("walka WCZEŚNIEJSZA nie dziedziczy urwania — bufor jej nie tknął", () => {
    // Para dla testu wyżej. Bez niej „przepuszczaj zawsze" przechodziłoby tak
    // samo, a to byłoby ostrzeganie o urwaniu walki, która skończyła się cała.
    // Fałszywe ostrzeżenie na materiale dowodowym uczy ludzi je ignorować.
    const pierwsza = wybierzWalke(
      czytajZrzut(JSON.stringify({ ...SESJA, przepelniony: true })),
      1,
    );

    expect(pierwsza.przepelniony).toBeUndefined();
    expect(urwany(pierwsza)).toBeNull();
  });

  test("moduł ze zrzutu dodatku nie podaje się za zrzut sondy", () => {
    const modul = modulZrzutu(wybierzWalke(czytajZrzut(JSON.stringify(SESJA)), 1), "2026-08-05", "test");
    expect(modul).toContain("Zrzut z dodatku");
    expect(modul).not.toContain("walka-probe");
  });

  /**
   * Zrzut sondy w pełnym kształcie — z `myteam` i surowym `team`.
   *
   * `ZRZUT` wyżej ich nie ma, bo powstał do testów samego czytania. `modulZrzutu`
   * woła `skladZeZrzutu`, a ten bez `myteam` PADA z rozmysłem — i dobrze, że tak
   * jest: właśnie ta asercja przypomniała, że moduł bez stron byłby materiałem
   * z odwróconymi drużynami.
   */
  const ZRZUT_SONDY: Zrzut = {
    ...ZRZUT,
    wpisy: [
      {
        ...WPISY[0]!,
        ladunek: { myteam: 1 },
        wojownicyPo: [{ id: 1, name: "Kamil", team: 1 }],
      },
    ],
  };

  test("moduł ze zrzutu sondy nadal mówi, że jest ze sondy", () => {
    // `zrodlo: "sonda"` pisze dziś sama sonda (`AUDYT‑64`) — wcześniej pola nie
    // było wcale, a narzędzie podstawiało sondę pod jego brak.
    const zSonda = { ...ZRZUT_SONDY, zrodlo: "sonda" as const };
    const modul = modulZrzutu(czytajZrzut(JSON.stringify(zSonda)), "2026-08-05", "test");
    expect(modul).toContain("walka-probe.js");
    expect(modul).not.toContain("Zrzut z dodatku");
  });

  test("plik BEZ `zrodlo` mówi „nie wiadomo”, zamiast podstawiać sondę", () => {
    // ⚠️ `AUDYT‑64`. Trzy miejsca w narzędziu czytały brak pola jako „sonda",
    // więc zrzut z dodatku sprzed dołożenia pola opisywałby się cudzym
    // narzędziem. Reguła repo: wolno pokazać „nie wiadomo", nie wolno zgadnąć.
    const modul = modulZrzutu(czytajZrzut(JSON.stringify(ZRZUT_SONDY)), "2026-08-05", "test");
    expect(modul).toContain("NIEUSTALONYM pochodzeniu");
    expect(modul).not.toContain("walka-probe.js");
    expect(modul).not.toContain("Zrzut z dodatku");
  });

  test("brak linii otwierającej tłumaczy się INNYM powodem po każdej ze stron", () => {
    const zDodatku = czytajZrzut(JSON.stringify({ ...SESJA, otwarcie: null, otwarcia: {} }));
    expect(modulZrzutu(zDodatku, "2026-08-05", "t")).toContain("dodatek podpiął się");

    const zSondy = czytajZrzut(JSON.stringify({ ...ZRZUT_SONDY, otwarcie: null }));
    expect(modulZrzutu(zSondy, "2026-08-05", "t")).toContain("sonda była wklejona");
  });
});
