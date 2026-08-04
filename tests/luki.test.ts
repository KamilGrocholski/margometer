import { describe, expect, test } from "bun:test";
import {
  POZA_LOGIEM,
  jestStatystyka,
  jestWierszemTabeli,
  nazwaPasuje,
  rdzenKlucza,
  slownikNazw,
  zloz,
} from "../tools/luki.ts";

/**
 * Testy złączenia „pomoc gry × protokół × korpus tekstowy" z `tools/luki.ts`.
 *
 * OGRANICZENIE, KTÓRE WYZNACZA KSZTAŁT TEGO PLIKU: artykuł pomocy leży
 * w `.cache/`, a `.cache/` jest w `.gitignore`. Test czytający zrzut przechodził
 * u autora i padał w CI — albo, gorzej, wołałby po sieci przy każdym
 * `bun run check`. Dlatego wszystkie fragmenty pomocy są tu WKLEJONE, przepisane
 * z wyjścia `bun tools/pomoc.ts` 2026‑08‑03, i testujemy wyłącznie funkcje czyste.
 *
 * Każdy przypadek niżej odpowiada usterce, którą złączenie naprawdę miało —
 * pierwsze przejście wypisało dziesięć „luk", z czego siedem było fałszywych.
 */

/** Fragmenty artykułu „Mechanika walk", przepisane dosłownie z sondy. */
const POMOC = [
  "Blok ( blok ) • Ulega zmianie na skutek zmiany ekwipunku, umiejętności oraz",
  "różnicy poziomów podczas walki. • Zdarzenie zachodzi podczas obrony.",
  "Głęboka rana ( wound0, of_wound0 ) • Działanie: zadaje obrażenia w czasie.",
  "Krwawa udręka ( anguish ) • Działanie: podczas walki istnieje prawdopodobieństwo",
  "na zajście zdarzenia, podczas którego na cel ataku zostają zaaplikowane",
  "obrażenia od krwawienia rozłożone w czasie na pięć tur.",
  "Wściekłość ( rage ) • Odpowiada za wyzwolenie efektu Wściekłości , wraz z każdym",
  "trafionym w potwora ciosem krytycznym, na określoną liczbę tur.",
  "Odporność na zimno ( resfrost ) val = amt * 3 [-3 ; 10] Odporność na błyskawice",
  "( reslight ) val = amt * 3 [-3 ; 10]",
  "• Wyzwolenie: statystyki bazowe Postaci. pasywny achpp_per • Działanie: dodaje",
  "1% pancerza za każdą część brakującego zdrowia.",
  "Nie można modyfikować zestawu do walki, który nie jest aktywny w danej chwili",
  "na Postaci.",
].join(" ");

describe("słownik nazw silnikowych z pomocy", () => {
  test("czyta notację „Nazwa polska ( engine )”", () => {
    const slownik = slownikNazw(POMOC);
    expect(slownik.get("blok")).toBe("Blok");
    expect(slownik.get("anguish")).toBe("Krwawa udręka");
    expect(slownik.get("rage")).toBe("Wściekłość");
  });

  test("jeden nawias z kilkoma nazwami daje kilka wpisów", () => {
    // „Głęboka rana ( wound0, of_wound0 )" — bez rozbicia po przecinku
    // `of_wound0` zostaje bez polskiej nazwy i wygląda jak nieznany klucz.
    const slownik = slownikNazw(POMOC);
    expect(slownik.get("wound0")).toBe("Głęboka rana");
    expect(slownik.get("of_wound0")).toBe("Głęboka rana");
  });
});

describe("odróżnianie statystyki od zdarzenia", () => {
  test("„pasywny <nazwa>” to statystyka", () => {
    expect(jestStatystyka(POMOC, "achpp_per")).toBe(true);
  });

  test("nazwa krótsza niż trzy znaki NIE jest statystyką", () => {
    // Protokół ma klucze jednoliterowe, a w pomocy stoi zdanie „zestawu, który
    // nie jest aktywny w danej chwili" — bez tego progu klucz `w` (27 wystąpień)
    // wychodził jako statystyka i cicho znikał z listy.
    expect(jestStatystyka(POMOC, "w")).toBe(false);
  });

  test("wiersz tabeli bonusów (`val = amt`) to statystyka mimo polskiej nazwy", () => {
    // Cztery z dziesięciu pozycji pierwszego przebiegu były właśnie tym:
    // odporności i siły krytyka mają polskie nazwy i wyglądają jak efekty.
    expect(jestWierszemTabeli(POMOC, "resfrost")).toBe(true);
    expect(jestWierszemTabeli(POMOC, "reslight")).toBe(true);
  });

  test("opis efektu (`• Działanie:`) wierszem tabeli NIE jest", () => {
    expect(jestWierszemTabeli(POMOC, "anguish")).toBe(false);
    expect(jestWierszemTabeli(POMOC, "rage")).toBe(false);
  });
});

describe("obdzieranie klucza protokołu z dekoracji", () => {
  test.each([
    ["@legbon_anguish", "anguish"],
    ["-legbon_facade", "facade"],
    ["legbon_holytouch_l", "holytouch"],
    ["active_decblock_per", "decblock"],
    ["hp_per-allies", "hp"],
    ["critval-enemies", "critval"],
    ["@Dd", "Dd"],
  ])("%s → %s", (klucz, rdzen) => {
    expect(rdzenKlucza(klucz)).toBe(rdzen);
  });
});

describe("dopasowanie nazwy polskiej do rodziny modyfikatorów", () => {
  test("odmiana nie psuje dopasowania", () => {
    // TO JEST TEN PRZYPADEK, na którym poległo naiwne `includes`: pomoc pisze
    // mianownikiem, log dopełniaczem, a różnica bywa też z PRZODU słowa
    // („Niszczenie" ↔ „Zniszczono"), więc porównanie po przedrostku nie starczy.
    expect(nazwaPasuje("Zniszczono N absorpcji magicznej", "Absorpcja magiczna")).toBe(true);
    expect(nazwaPasuje("Zniszczono N many", "Niszczenie many")).toBe(true);
    expect(nazwaPasuje("Zniszczono N energii", "Niszczenie energii")).toBe(true);
  });

  test("efekt, którego korpus nie zna, NIE dopasowuje się do niczego", () => {
    const rodziny = [
      "Klątwa",
      "Dotyk anioła",
      "Piętno bestii: atak +N",
      "Głęboka rana",
      "Zniszczono N absorpcji magicznej",
    ];
    for (const nazwa of ["Krwawa udręka", "Wściekłość"]) {
      expect([nazwa, rodziny.some((r) => nazwaPasuje(r, nazwa))]).toEqual([nazwa, false]);
    }
  });

  test("„Piętno bestii” dopasowuje się do rodziny z dwukropkiem i liczbą", () => {
    expect(nazwaPasuje("Piętno bestii: atak +N", "Piętno bestii")).toBe(true);
  });
});

describe("złączenie w całości", () => {
  const rodziny = new Set(["Dotyk anioła", "Zniszczono N absorpcji magicznej", "Klątwa"]);
  const slownik = slownikNazw(POMOC);

  test("kubełki rozkładają się tak, jak mówi rejestr", () => {
    const wpisy = zloz(
      new Map([
        ["@rage", 32],
        ["@legbon_anguish", 3],
        ["resfrost_per", 6],
        ["w", 27],
        ["blok", 1],
      ]),
      slownik,
      POMOC,
      rodziny,
    );
    const kubelek = (klucz: string) => wpisy.find((w) => w.klucz === klucz)!.kubelek;
    expect(kubelek("@rage")).toBe("LUKA");
    expect(kubelek("@legbon_anguish")).toBe("LUKA");
    expect(kubelek("resfrost_per")).toBe("STAT");
    // `w` nie jest ani statystyką, ani nazwą z pomocy — ma zostać NIEZNANE,
    // czyli w kubełku, który niczego nie przesądza.
    expect(kubelek("w")).toBe("NIEZNANE");
    // `blok` jest tu LUKĄ tylko dlatego, że zestaw `rodziny` w tym teście jest
    // sztuczny i nie ma „Zablokowanie N obrażeń". W prawdziwym przebiegu
    // `active_block_per` wychodzi jako ZNANE — chodzi o sprawdzenie ścieżki
    // „nazwa z pomocy jest, rodziny brak", nie o twierdzenie o korpusie.
    expect(kubelek("blok")).toBe("LUKA");
  });

  test("każdy wpis ma powód, także ZNANE", () => {
    // Powód jest tu jedyną rzeczą, którą czyta człowiek podejmujący decyzję.
    const wpisy = zloz(new Map([["legbon_holytouch_l", 43]]), slownik, POMOC, rodziny);
    expect(wpisy).toHaveLength(1);
    expect(wpisy[0]!.powod.length).toBeGreaterThan(0);
  });
});

describe("lista wyjątków POZA_LOGIEM", () => {
  test("każdy wpis ma powód dłuższy niż nazwa", () => {
    // Ta lista cicho zdejmuje pozycje z listy luk, więc wpis bez uzasadnienia
    // jest w niej najgroźniejszą rzeczą, jaka może się znaleźć.
    for (const [klucz, powod] of POZA_LOGIEM) {
      expect([klucz, powod.length > klucz.length + 20]).toEqual([klucz, true]);
    }
  });
});
