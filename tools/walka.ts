/**
 * Rozbicie zrzutu z `tools/walka-probe.js` na fixture korpusu — i podgląd tego,
 * co w zrzucie siedzi.
 *
 * CO POWSTAJE. Katalog w `tests/fixtures/new-engine/` z trzema plikami:
 *
 *   log.html      — węzły renderu w kontenerze `.scroll-pane`, czyli DOKŁADNIE
 *                   ten kształt, który mają dzisiejsze fixture'y HTML i który
 *                   czyta `src/source.ts`. Wchodzi do globu `*&#47;*&#47;log.html`,
 *                   więc od razu przechodzi niezmienniki parsera.
 *   protokol.json — surowe ładunki `Engine.battle.update`, migawki wojowników
 *                   i indeksowanie węzłów renderu równolegle do komunikatów.
 *   meta.json     — szkielet opisu, z `covers`/`missing`/`notes` do wypełnienia.
 *
 * DLACZEGO `protokol.json`, a nie `log.grooove.txt`. Bo to nie jest ten sam
 * materiał. Korpus grooove ma protokół PRZEKODOWANY przez cudzy serwis
 * (`=` na `.`, `+` na `@`, `dmg` skrócone do `D`) i bez renderu gry obok. Tutaj
 * leży ładunek jeden do jednego z klienta plus zdania, które gra z niego
 * ułożyła. Nazwa musi się też różnić od `raw.txt` i `log.html`, żeby NIE wpaść
 * w globy testowe parsera — powód opisany w `tests/fixtures/grooove/README.md`.
 *
 * CZEGO TO NIE ROBI. Nie składa `raw.txt`. Tekst z przycisku „Kopiuj logi" jest
 * osobnym dowodem i ma pochodzić z gry; sklejanie go z węzłów renderu byłoby
 * naszą rekonstrukcją udającą zrzut. Plik dokłada się ręcznie, obok.
 *
 * Użycie:
 *   bun tools/walka.ts --rozbij ~/Pobrane/walka-tempest-….json --nazwa pvp-trucizna
 *   bun tools/walka.ts --pokaz 2026-08-04_tempest_pvp-trucizna
 *   bun tools/walka.ts --klucze [katalog]
 */

import { existsSync, readdirSync } from "node:fs";

const KORPUS = new URL("../tests/fixtures/new-engine/", import.meta.url).pathname;

/** Jedno wywołanie `Engine.battle.update` tak, jak zapisała je sonda. */
export type Wywolanie = {
  nr: number;
  ladunek: Record<string, unknown>;
  komunikaty: string[];
  render: string[];
  wojownicyPrzed: unknown[];
  wojownicyPo: unknown[];
};

export type Zrzut = {
  wersja: number;
  przy: string;
  swiat: string;
  build: string | null;
  otwarcie: string | null;
  wpisy: Wywolanie[];
};

/**
 * Sprawdzenie kształtu zrzutu przy WCZYTANIU, nie przy użyciu.
 *
 * Zrzut przychodzi z przeglądarki, przez plik na dysku, czasem po ręcznej
 * edycji. Wzór z `src/recorder.ts:110-131`: sprawdzamy każde pole, bo połowicznie
 * poprawny zrzut zapisałby się jako fixture i wyglądał na dowód, nie niosąc go.
 */
export function czytajZrzut(tekst: string): Zrzut {
  let dane: unknown;
  try {
    dane = JSON.parse(tekst);
  } catch {
    throw new Error("plik nie jest JSON-em — czy to na pewno wynik `margometerWalka.pobierz()`?");
  }
  const z = dane as Partial<Zrzut>;
  if (typeof z.wersja !== "number" || !Array.isArray(z.wpisy)) {
    throw new Error("zrzut nie ma pól `wersja` i `wpisy` — to nie jest wynik sondy");
  }
  if (z.wpisy.length === 0) {
    // Pusty zrzut znaczy zwykle „sonda wklejona po walce". Zapisanie go dałoby
    // katalog wyglądający jak fixture i pusty w środku.
    throw new Error(
      "zrzut nie ma ani jednego wywołania — sonda była wklejona po walce " +
        "albo przed nią stała inna, która zdjęła tę.",
    );
  }
  return {
    wersja: z.wersja,
    przy: typeof z.przy === "string" ? z.przy : new Date().toISOString(),
    swiat: typeof z.swiat === "string" ? z.swiat : "nieznany",
    build: typeof z.build === "string" ? z.build : null,
    otwarcie: typeof z.otwarcie === "string" ? z.otwarcie : null,
    wpisy: z.wpisy,
  };
}

/**
 * Węzły renderu sklejone w kontener `.scroll-pane`.
 *
 * Kształt przepisany z dzisiejszych fixture'ów HTML (`log.html` w korpusie),
 * bo to on jest wejściem `findBattleLog`/`extractText`. Bez kontenera zrzut
 * miałby kilkaset korzeni i `findBattleLog` szukałby wspólnego rodzica poza
 * naszym plikiem.
 */
export function sklejRender(wpisy: Wywolanie[]): string {
  return `<div class="scroll-pane">${wpisy.flatMap((w) => w.render).join("")}</div>\n`;
}

/**
 * Wszystkie komunikaty protokołu, w kolejności zapisu.
 *
 * Wywołania są tu granicą porcji, nie zdarzenia — jedno `update` niesie tyle
 * komunikatów, ile serwer akurat przysłał, i przy odczycie ta granica nic nie
 * znaczy. Spłaszczamy więc od razu.
 */
export function komunikaty(wpisy: Wywolanie[]): string[] {
  return wpisy.flatMap((w) => w.komunikaty);
}

/**
 * Klucze parametrów komunikatu, bez wartości.
 *
 * Kształt komunikatu to `nadawca;cel;klucz=wartość;klucz=wartość;…`; dwa
 * pierwsze segmenty to strony. Klucz kończy się na PIERWSZYM `=`, bo wartości
 * bywają złożone. Parametry bez wartości (`r`, `N`, `Y`) są całym segmentem.
 *
 * Odpowiednik `kluczeZdarzenia` z `tools/grooove.ts` — tam separatorem jest
 * kropka, bo grooove przekodowuje protokół. Tu jest `=`, czyli to, co naprawdę
 * przysyła serwer. Dwie funkcje zamiast jednej z parametrem, żeby nie dało się
 * przez pomyłkę puścić jednego korpusu drugą gramatyką.
 */
export function kluczeKomunikatu(komunikat: string): string[] {
  return komunikat
    .split(";")
    .slice(2)
    .filter((s) => s.length > 0)
    .map((s) => {
      const rowna = s.indexOf("=");
      return rowna === -1 ? s : s.slice(0, rowna);
    });
}

/**
 * Strony komunikatu: `id` albo `id=hpp`, albo `0` przy braku strony.
 *
 * `0` w drugim segmencie NIE jest brakiem danych do uzupełnienia — to jest
 * odpowiedź „ten komunikat nie ma celu" (tyknięcie trucizny, utrata tury).
 * Zwracamy `null`, żeby nie dało się tego pomylić z wojownikiem o id 0.
 */
export function stronyKomunikatu(
  komunikat: string,
): { id: number; hpp: number | null }[] {
  return komunikat
    .split(";")
    .slice(0, 2)
    .map((segment) => {
      const [id, hpp] = segment.split("=");
      const numer = Number(id);
      if (!Number.isFinite(numer) || numer === 0) return null;
      return { id: numer, hpp: hpp === undefined ? null : Number(hpp) };
    })
    .filter((s): s is { id: number; hpp: number | null } => s !== null);
}

/** Histogram kluczy, od najczęstszego. */
export function histogram(wiadomosci: string[]): [string, number][] {
  const licznik = new Map<string, number>();
  for (const komunikat of wiadomosci) {
    for (const klucz of kluczeKomunikatu(komunikat)) {
      licznik.set(klucz, (licznik.get(klucz) ?? 0) + 1);
    }
  }
  return [...licznik].sort((a, b) => b[1] - a[1]);
}

/**
 * Czy komunikaty i węzły renderu dają się indeksować równolegle.
 *
 * To jest jedyny sprawdzian tego, czy para w ogóle jest parą. Renderer składa
 * jeden węzeł na komunikat, więc rozjazd znaczy, że sonda przegapiła węzły
 * (zmieniona klasa `.battle-msg`) albo złapała cudze. Wtedy `log.html`
 * i `protokol.json` opisują różne rzeczy, a fixture kłamie po cichu.
 */
export function rozjazdyParowania(wpisy: Wywolanie[]): { nr: number; komunikatow: number; wezlow: number }[] {
  return wpisy
    .map((w) => ({ nr: w.nr, komunikatow: w.komunikaty.length, wezlow: w.render.length }))
    .filter((w) => w.komunikatow !== w.wezlow);
}

/** Szkielet `meta.json` w schemacie korpusu `new-engine`. */
export function meta(zrzut: Zrzut, dzis: string): string {
  return `${JSON.stringify(
    {
      client: "new-engine",
      capturedAt: dzis,
      clientBuild: zrzut.build,
      world: zrzut.swiat,
      source:
        "tools/walka-probe.js — ładunki Engine.battle.update (protokol.json) " +
        "i węzły renderu z tej samej walki (log.html)",
      format: "protokol+html",
      opening: zrzut.otwarcie,
      participants: [],
      covers: ["DO UZUPEŁNIENIA — co siedzi w tej walce, po przejrzeniu"],
      missing: ["DO UZUPEŁNIENIA"],
      notes: "DO UZUPEŁNIENIA",
    },
    null,
    2,
  )}\n`;
}

/** Katalogi korpusu, posortowane. */
export function katalogiKorpusu(): string[] {
  if (!existsSync(KORPUS)) return [];
  return readdirSync(KORPUS, { withFileTypes: true })
    .filter((w) => w.isDirectory())
    .map((w) => w.name)
    .sort();
}

function tekstowa(argumenty: string[], flaga: string): string | null {
  const gdzie = argumenty.indexOf(flaga);
  if (gdzie === -1) return null;
  const wartosc = argumenty[gdzie + 1];
  if (wartosc === undefined) throw new Error(`${flaga} wymaga wartości`);
  argumenty.splice(gdzie, 2);
  return wartosc;
}

/** CLI za bramką, żeby dało się ten plik zaimportować — jak w `tools/pomoc.ts`. */
if (import.meta.main) {
  const argumenty = process.argv.slice(2);
  const rozbij = tekstowa(argumenty, "--rozbij");
  const nazwa = tekstowa(argumenty, "--nazwa");
  const pokaz = tekstowa(argumenty, "--pokaz");
  const klucze = argumenty.includes("--klucze");

  if (rozbij !== null) {
    if (nazwa === null) throw new Error("wymagane --nazwa (krótki opis do nazwy katalogu)");
    const zrzut = czytajZrzut(await Bun.file(rozbij).text());
    const dzis = new Date().toISOString().slice(0, 10);
    const katalog = `${KORPUS}${dzis}_${zrzut.swiat}_${nazwa}/`;
    if (existsSync(katalog)) {
      throw new Error(`${katalog} już istnieje — fixture'a się nie nadpisuje`);
    }

    await Bun.write(`${katalog}log.html`, sklejRender(zrzut.wpisy));
    await Bun.write(`${katalog}protokol.json`, `${JSON.stringify(zrzut, null, 2)}\n`);
    await Bun.write(`${katalog}meta.json`, meta(zrzut, dzis));

    const wiadomosci = komunikaty(zrzut.wpisy);
    const rozjazdy = rozjazdyParowania(zrzut.wpisy);
    console.log(`zapisane: ${katalog}`);
    console.log(
      `  wywołań: ${zrzut.wpisy.length}, komunikatów: ${wiadomosci.length}, ` +
        `kluczy: ${histogram(wiadomosci).length}`,
    );
    if (zrzut.otwarcie === null) {
      console.warn(
        "  ⚠ brak linii otwierającej — sonda była wklejona po rozpoczęciu walki. " +
          "Fixture jest użyteczny, ale parser nie pozna z niego składu.",
      );
    }
    if (rozjazdy.length > 0) {
      console.warn(
        `  ⚠ ${rozjazdy.length} wywołań ma inną liczbę komunikatów niż węzłów renderu — ` +
          "para dla nich jest niepewna, sprawdź przed użyciem jako orakulum.",
      );
    }
    console.log("  raw.txt dołóż ręcznie z przycisku „Kopiuj logi” — narzędzie go nie składa");
    console.log("  covers/missing/notes czekają na wypełnienie — narzędzie ich nie zmyśla");
    process.exit(0);
  }

  if (pokaz !== null) {
    const sciezka = existsSync(`${KORPUS}${pokaz}/protokol.json`)
      ? `${KORPUS}${pokaz}/protokol.json`
      : pokaz;
    const zrzut = czytajZrzut(await Bun.file(sciezka).text());
    console.log(`świat: ${zrzut.swiat}, build: ${zrzut.build ?? "—"}`);
    console.log(`otwarcie: ${zrzut.otwarcie ?? "—"}\n`);
    for (const komunikat of komunikaty(zrzut.wpisy)) console.log(komunikat);
    process.exit(0);
  }

  if (klucze) {
    const katalogi = argumenty.filter((a) => !a.startsWith("--"));
    const wybrane =
      katalogi.length > 0
        ? katalogi
        : katalogiKorpusu().filter((k) => existsSync(`${KORPUS}${k}/protokol.json`));
    if (wybrane.length === 0) {
      console.error(
        "w korpusie nie ma ani jednego `protokol.json` — zbierz walkę sondą " +
          "`tools/walka-probe.js` i rozbij ją przez --rozbij",
      );
      process.exit(1);
    }
    const wszystkie: string[] = [];
    for (const katalog of wybrane) {
      const zrzut = czytajZrzut(await Bun.file(`${KORPUS}${katalog}/protokol.json`).text());
      wszystkie.push(...komunikaty(zrzut.wpisy));
    }
    const licznik = histogram(wszystkie);
    console.log(`${wybrane.length} walk, ${wszystkie.length} komunikatów, ${licznik.length} kluczy\n`);
    for (const [klucz, ile] of licznik) console.log(`${String(ile).padStart(6)}  ${klucz}`);
    process.exit(0);
  }

  console.error(
    [
      "użycie:",
      "  bun tools/walka.ts --rozbij <plik.json> --nazwa <slug>",
      "  bun tools/walka.ts --pokaz <katalog|plik.json>",
      "  bun tools/walka.ts --klucze [katalog …]",
      "",
      "zrzut robi `tools/walka-probe.js` wklejony do konsoli gry.",
    ].join("\n"),
  );
  process.exit(2);
}
