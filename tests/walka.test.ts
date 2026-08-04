import { describe, expect, test } from "bun:test";
import {
  czytajZrzut,
  histogram,
  kluczeKomunikatu,
  komunikaty,
  meta,
  renderParujeSie,
  rozjazdyParowania,
  skladZeZrzutu,
  sklejRender,
  stronyKomunikatu,
  type Wywolanie,
  type Zrzut,
} from "../tools/walka.ts";
import { extractText, findBattleLog } from "../src/source.ts";
import { parse } from "../src/parser.ts";

/**
 * Czego te testy pilnują: żeby zrzut z sondy zamienił się w fixture, który
 * NIE KŁAMIE. Sonda jest przeglądarkowa i testu jednostkowego mieć nie może;
 * wszystko, co da się sprawdzić bez gry, sprawdza się tutaj.
 *
 * Najważniejszy jest ostatni blok. Fixture z tej drogi wchodzi do globu
 * `*&#47;*&#47;log.html` w `parser.test.ts` i od razu podlega niezmiennikowi
 * „każda linia rozpoznana". Gdyby `sklejRender` dawał kształt, którego
 * `findBattleLog` nie znajduje, test parsera przeszedłby na PUSTYM wejściu —
 * zielony i pusty, czyli dokładnie to, przed czym ostrzega `AGENTS.md`.
 */

/** Dwa wywołania sondy: otwarcie walki i jeden cios. Kształt jak z gry. */
const WPISY: Wywolanie[] = [
  {
    nr: 0,
    ladunek: { init: "1" },
    komunikaty: ["0;0;txt=Rozpoczęła się walka pomiędzy Kamil (10w) a Wilk (9w)"],
    render: [
      '<div class="battle-msg txt">Rozpoczęła się walka pomiędzy Kamil (10w) a Wilk (9w)</div>',
    ],
    wojownicyPrzed: [],
    wojownicyPo: [{ id: 1, name: "Kamil", hp: { cur: 100, max: 100 } }],
  },
  {
    nr: 1,
    ladunek: {},
    komunikaty: ["1=100.00;2=40.37;+dmgd=455;+pierce;-dmgd=455"],
    render: [
      '<div class="battle-msg attack">Kamil(100%) uderzył z siłą <b class="dmgd">+455</b>' +
        '<br><font color="82ff88">+Przebicie</font><br>' +
        'Wilk(40.37%) otrzymał(a) <b class="dmgd" prof-w="">-455</b> obrażeń<br></div>',
    ],
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

  test("pusty zrzut jest BŁĘDEM, nie pustym fixture'em", () => {
    // Zapisany dałby katalog wyglądający jak dowód i pusty w środku —
    // a fixture jest dowodem, nie „danymi testowymi".
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

describe("rozjazdyParowania", () => {
  test("zgodne wywołania nie zgłaszają nic", () => {
    expect(rozjazdyParowania(WPISY)).toEqual([]);
  });

  test("węzeł bez komunikatu jest zgłoszony", () => {
    // To jedyny sprawdzian, czy para jest parą. Bez niego `log.html`
    // i `protokol.json` mogłyby opisywać różne rzeczy, a fixture kłamałby cicho.
    const zepsute = [{ ...WPISY[1]!, render: [...WPISY[1]!.render, "<div>obce</div>"] }];
    expect(rozjazdyParowania(zepsute)).toEqual([{ nr: 1, komunikatow: 1, wezlow: 2 }]);
  });
});

describe("meta", () => {
  const opis = JSON.parse(meta(czytajZrzut(JSON.stringify(ZRZUT)), "2026-08-04", true));
  const bezRenderu = JSON.parse(meta(czytajZrzut(JSON.stringify(ZRZUT)), "2026-08-04", false));

  test("trzyma się schematu korpusu new-engine", () => {
    expect(opis.client).toBe("new-engine");
    expect(opis.format).toBe("protokol+html");
    expect(opis.clientBuild).toBe("1785244275300");
  });

  test("bez renderu `format` NIE kłamie, że render tam jest", () => {
    // Fixture bez `log.html` opisany jako `protokol+html` kazałby następnemu
    // czytelnikowi szukać pliku, którego nie ma — albo, gorzej, uznać, że
    // zniknął przez pomyłkę.
    expect(bezRenderu.format).toBe("protokol");
    expect(bezRenderu.source).not.toContain("log.html");
  });

  test("bez renderu POWÓD stoi w `missing`, a nie tylko w konsoli", () => {
    // Ostrzeżenie z `--rozbij` widzi wyłącznie ten, kto rozbijał zrzut.
    // Powód ma przeżyć w pliku, bo to on trafia do repo.
    expect(bezRenderu.missing[0]).toContain("log.html");
    expect(bezRenderu.missing[0]).toContain("węzłów renderu");
  });

  test("covers/missing/notes czekają na człowieka", () => {
    // Ta sama konwencja co w `tools/grooove.ts` — narzędzie nie zmyśla opisu,
    // a niewypełniony fixture ma być widoczny na pierwszy rzut oka.
    expect(opis.covers[0]).toContain("DO UZUPEŁNIENIA");
    expect(opis.missing[0]).toContain("DO UZUPEŁNIENIA");
    expect(opis.notes).toContain("DO UZUPEŁNIENIA");
  });

  test("participants zostaje PUSTE, a nie zgadnięte z linii otwierającej", () => {
    // Skład da się wyciągnąć z `otwarcie`, ale poziom i profesja z protokołu
    // nie wychodzą. Wpisanie tu połowicznych danych byłoby udawaniem.
    expect(opis.participants).toEqual([]);
  });
});

describe("sklejRender — fixture musi być czytelny dla parsera", () => {
  const html = sklejRender(WPISY);

  test("kształt jest ten sam co w dzisiejszych log.html", () => {
    expect(html.startsWith('<div class="scroll-pane">')).toBe(true);
    expect(html.trimEnd().endsWith("</div>")).toBe(true);
  });

  test("`findBattleLog` znajduje kontener w tym kształcie", () => {
    // Gdyby nie znajdował, niezmiennik „każda linia rozpoznana" leciałby po
    // pustym wejściu i był zielony bez treści.
    document.body.innerHTML = html;
    expect(findBattleLog(document)).not.toBeNull();
  });

  test("droga przez DOM daje te same zdarzenia, co niosą komunikaty", () => {
    document.body.innerHTML = html;
    const zdarzenia = parse(extractText(findBattleLog(document)!));
    expect(zdarzenia.filter((z) => z.kind === "unknown")).toEqual([]);
    expect(zdarzenia.some((z) => z.kind === "fight-start")).toBe(true);

    const cios = zdarzenia.find((z) => z.kind === "attack");
    expect(cios).toBeDefined();
    // Liczba z renderu i liczba z protokołu (`+dmgd=455`) to ta sama liczba —
    // to jest w miniaturze cały pomysł na orakulum z etapu 2.
    expect(cios?.kind === "attack" && cios.hits[0]?.raw).toBe(455);
  });

  test("żywioł z klasy CSS przeżywa drogę do parsera", () => {
    document.body.innerHTML = html;
    const zdarzenia = parse(extractText(findBattleLog(document)!));
    const cios = zdarzenia.find((z) => z.kind === "attack");
    expect(cios?.kind === "attack" && cios.hits[0]?.element).toBe("dystansowe");
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
    render: [],
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

describe("renderParujeSie — czy render wolno zapisać jako dowód", () => {
  test("tyle samo węzłów co komunikatów — render wchodzi", () => {
    expect(renderParujeSie(WPISY)).toBe(true);
  });

  test("nadmiarowy węzeł blokuje zapis renderu", () => {
    // Kształt z pierwszego prawdziwego zrzutu: gra przerysowuje węzły, więc
    // przyrost liczony po długości listy łapie te same linie po kilka razy.
    // Rekonstrukcja z takiego materiału zawyżyła obrażenia (5345 zamiast 2784).
    const zdublowane = [{ ...WPISY[1]!, render: [...WPISY[1]!.render, "<div>ten sam</div>"] }];
    expect(renderParujeSie(zdublowane)).toBe(false);
  });

  test("brakujący węzeł też blokuje — rozjazd w drugą stronę liczy się tak samo", () => {
    const bezWezla = [{ ...WPISY[1]!, render: [] }];
    expect(renderParujeSie(bezWezla)).toBe(false);
  });
});
