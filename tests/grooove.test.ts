import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import {
  SWIATY_ANGLOJEZYCZNE,
  SWIATY_PUBLICZNE,
  czytajFixture,
  katalogiKorpusu,
  kluczeZdarzenia,
  zdarzenia,
} from "../tools/grooove.ts";

/**
 * Korpus protokołu z grooove.pl — testy KSZTAŁTU, nie parsera.
 *
 * Parser tych plików nie czyta i czytać nie ma: to surowy protokół silnika,
 * a nie tekst z okna walki. Powody, liczby i granice: `tests/fixtures/grooove/README.md`.
 * Tu pilnujemy trzech rzeczy, których nie widzi żaden inny test w repo:
 * że korpus ma spójny kształt, że opisy w `meta.json` zgadzają się z zawartością
 * plików, i — najważniejsze — że korpus NIE wchodzi do pętli parsera.
 */

const KORPUS = new URL("./fixtures/grooove/", import.meta.url).pathname;
const katalogi = await katalogiKorpusu();

const fixtures = await Promise.all(
  katalogi.map(async (nazwa) => ({
    nazwa,
    tekst: await Bun.file(`${KORPUS}${nazwa}/log.grooove.txt`).text(),
    meta: JSON.parse(await Bun.file(`${KORPUS}${nazwa}/meta.json`).text()) as {
      client: string;
      format: string;
      capturedAt: string;
      world: string;
      fightId: number;
      sourceUrl: string;
      participants: Array<{ name: string; level: number | null; team: number }>;
      covers: string[];
      missing: string[];
      notes: string;
    },
  })),
);

/** Klucze parametrów per katalog — policzone raz, używane w kilku testach. */
const kluczePlikow = new Map<string, Set<string>>(
  fixtures.map((f) => {
    const klucze = new Set<string>();
    for (const zdarzenie of zdarzenia(czytajFixture(f.tekst).log)) {
      for (const klucz of kluczeZdarzenia(zdarzenie)) klucze.add(klucz);
    }
    return [f.nazwa, klucze] as const;
  }),
);

test("korpus nie jest pusty", () => {
  expect(fixtures.length).toBeGreaterThan(0);
});

/**
 * Dwie listy światów muszą pozostać rozłączne — inaczej `sprawdzSwiat`
 * przepuściłby świat anglojęzyczny, a `meta.world` z takiego zrzutu przeszedłby
 * test kształtu niżej bez słowa.
 *
 * To jest ta jedna mutacja, po której cała reszta odsiewu milknie: wystarczy
 * wkleić „cronus" z powrotem do `SWIATY_PUBLICZNE` i nic innego się nie zapala,
 * dopóki ktoś faktycznie takiej walki nie pobierze. Powód decyzji stoi przy
 * `SWIATY_ANGLOJEZYCZNE` w `tools/grooove.ts`.
 */
test("światy anglojęzyczne nie są jednocześnie publiczne", () => {
  const publiczne = new Set<string>(SWIATY_PUBLICZNE);
  expect(SWIATY_ANGLOJEZYCZNE.filter((w) => publiczne.has(w))).toEqual([]);
  expect(SWIATY_ANGLOJEZYCZNE.length).toBeGreaterThan(0);
});

describe("korpus grooove nie wchodzi do pętli parsera", () => {
  /**
   * TO JEST NAJWAŻNIEJSZY TEST W TYM PLIKU i jedyny, który pilnuje decyzji,
   * a nie danych.
   *
   * Globy w `parser.test.ts`, `stats.test.ts` i `mutanty.test.ts` szukają
   * dwa poziomy w głąb `tests/fixtures/` plików `raw.txt` oraz `log.html` —
   * czyli KAŻDY nowy katalog klienta wchodzi do nich sam, bez rejestrowania
   * gdziekolwiek. Gdyby pliki tego
   * korpusu nazwać `raw.txt`, wpadłby do niezmiennika „każda linia rozpoznana"
   * i albo by go wywalił, albo — gorzej — popchnął do rozszerzania wzorców
   * parsera pod cudzy, przestarzały renderer. Zmierzone: render grooove'a
   * przepuszczony przez `parse()` dał 132 z 223 zdarzeń jako `unknown`.
   *
   * Nazwa pliku jest tu więc mechanizmem, nie estetyką — i dlatego ma test.
   */
  test("nie ma tu ani jednego raw.txt i log.html", () => {
    const znalezione = [
      ...new Glob("*/raw.txt").scanSync(KORPUS),
      ...new Glob("*/log.html").scanSync(KORPUS),
    ];
    expect(znalezione).toEqual([]);
  });

  test("pliki korpusu nazywają się log.grooove.txt", () => {
    expect([...new Glob("*/log.grooove.txt").scanSync(KORPUS)].length).toBe(fixtures.length);
  });
});

describe.each(fixtures)("$nazwa", ({ nazwa, tekst, meta }) => {
  test("plik to dwie linie: team= i log=", () => {
    // Format jest celowo ubogi: dwa pola, tyle ile serwuje strona. Gdyby ktoś
    // dopisał trzecią linię „dla wygody", fixture przestałby być kopią źródła.
    expect(tekst.split("\n").filter((l) => l.length > 0)).toHaveLength(2);
    const protokol = czytajFixture(tekst);
    expect(protokol.team.length).toBeGreaterThan(0);
    expect(protokol.log.length).toBeGreaterThan(0);
  });

  test("każde zdarzenie ma co najmniej trzy segmenty, dwa pierwsze to strony", () => {
    const lista = zdarzenia(czytajFixture(tekst).log);
    expect(lista.length).toBeGreaterThan(0);
    // Strona to `0` (brak), `id.HP.HP` albo SAMO `id` bez życia. Ten trzeci
    // kształt wychodzi tylko przy zdarzeniach z kluczem `e.` i znalazł go
    // dopiero ten test — pierwsza wersja wzorca dopuszczała dwa pierwsze
    // i zapaliła się na czterech plikach naraz (np. `718280;0;e.17696`).
    const strona = /^\d+(?:\.\d+\.\d+)?$/;
    const zle = lista.filter((z) => {
      const segmenty = z.split(";");
      return segmenty.length < 3 || !strona.test(segmenty[0]!) || !strona.test(segmenty[1]!);
    });
    expect(zle).toEqual([]);
  });

  test("meta.json opisuje ten sam materiał, co plik z protokołem", () => {
    expect(meta.client).toBe("grooove");
    expect(meta.format).toBe("protokol");
    expect(SWIATY_PUBLICZNE).toContain(meta.world as (typeof SWIATY_PUBLICZNE)[number]);
    expect(meta.sourceUrl).toBe(`https://grooove.pl/battle/id,${meta.fightId}`);
    expect(nazwa.startsWith(`${meta.capturedAt}_${meta.world}_`)).toBe(true);
  });

  test("participants pokrywają się ze składem z pola team", () => {
    const pola = czytajFixture(tekst).team.split("|");
    const zTeam: string[] = [];
    for (let i = 0; i + 3 < pola.length; i += 4) zTeam.push(pola[i + 1]!);
    expect(meta.participants.map((u) => u.name)).toEqual(zTeam);
  });

  test("opis ma treść, nie zaślepkę z narzędzia", () => {
    // `--pobierz` wpisuje „DO UZUPEŁNIENIA", żeby brak opisu był widoczny.
    // Fixture bez opisu jest w tym repo danymi testowymi, a nie dowodem.
    const wszystko = [...meta.covers, ...meta.missing, meta.notes].join(" ");
    expect(wszystko).not.toContain("DO UZUPEŁNIENIA");
    expect(meta.covers.length).toBeGreaterThan(0);
    expect(meta.missing.length).toBeGreaterThan(0);
  });
});

/**
 * Niezmiennik po CAŁYM korpusie: każdy klucz protokołu wymieniony w opisie
 * naprawdę jest (albo naprawdę go nie ma) w opisywanym pliku.
 *
 * PO CO. `covers`/`missing` to jedyna droga do pytania „czy mam próbkę z X?",
 * a pisze się je ręcznie, patrząc na wyjście narzędzia. Przy pierwszym podejściu
 * ten test złapał cztery zdania, które się rozjechały — m.in. „cc_per tylko
 * tutaj" przy kluczu obecnym w dwóch plikach. Opis, który kłamie, jest gorszy
 * od braku opisu, bo wygląda na sprawdzony.
 *
 * Wzorzec dopasowuje tylko tokeny, które SĄ kluczami gdziekolwiek w korpusie —
 * zwykłe słowa opisu przechodzą obok.
 */
describe("opisy zgadzają się z zawartością plików", () => {
  const wszystkieKlucze = new Map<string, number>();
  for (const klucze of kluczePlikow.values()) {
    for (const klucz of klucze) wszystkieKlucze.set(klucz, (wszystkieKlucze.get(klucz) ?? 0) + 1);
  }
  const TOKEN = /(?:^|[\s(,])((?:@|-)?[A-Za-z_][A-Za-z0-9_@-]{1,26})(?=[\s,.)]|$)/g;
  const tokeny = (tekst: string) =>
    [...tekst.matchAll(TOKEN)].map((m) => m[1]!).filter((t) => wszystkieKlucze.has(t));

  test.each(fixtures)("$nazwa — klucze z covers są w pliku", ({ nazwa, meta }) => {
    const klucze = kluczePlikow.get(nazwa)!;
    const brakujace = meta.covers.flatMap(tokeny).filter((t) => !klucze.has(t));
    expect(brakujace).toEqual([]);
  });

  test.each(fixtures)("$nazwa — kluczy z missing w pliku NIE ma", ({ nazwa, meta }) => {
    const klucze = kluczePlikow.get(nazwa)!;
    const obecne = meta.missing.flatMap(tokeny).filter((t) => klucze.has(t));
    expect(obecne).toEqual([]);
  });

  test.each(fixtures)("$nazwa — wyłączność znaczy naprawdę wyłączność", ({ meta }) => {
    const wylaczne = meta.covers
      .filter((c) => /tylko tutaj|nigdzie indziej|Jedyne w korpusie|jedyny taki plik/i.test(c))
      .flatMap(tokeny)
      .filter((t) => wszystkieKlucze.get(t) !== 1);
    expect(wylaczne).toEqual([]);
  });
});
