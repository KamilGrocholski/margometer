import { describe, expect, test } from "bun:test";
import {
  czytajZrzut,
  histogram,
  kluczeKomunikatu,
  komunikaty,
  modulZrzutu,
  odchudz,
  skladZeZrzutu,
  stronyKomunikatu,
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

/** Dwa wywołania sondy: otwarcie walki i jeden cios. Kształt jak z gry. */
const WPISY: Wywolanie[] = [
  {
    nr: 0,
    ladunek: { init: "1" },
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
