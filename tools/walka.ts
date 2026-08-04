/**
 * Rozbicie zrzutu z `tools/walka-probe.js` na fixture korpusu — i podgląd tego,
 * co w zrzucie siedzi.
 *
 * CO POWSTAJE. Katalog w `tests/fixtures/new-engine/` z dwoma plikami — ⚠️ ten
 * katalog **nie istnieje od 2026‑08‑04** (materiał testowy powstaje w kodzie,
 * `AGENTS.md`). Narzędzie go odtworzy przy pierwszym zrzucie i to jest jego
 * dzisiejsza rola: droga powrotna do materiału z gry.
 *
 *   protokol.json — surowe ładunki `Engine.battle.update` i migawki wojowników.
 *   meta.json     — szkielet opisu, z `covers`/`missing`/`notes` do wypełnienia.
 *
 * ⚠️ **TRZECIM PLIKIEM BYŁ `log.html` i zniknął 2026‑08‑04.** Sonda zbierała
 * obok komunikatów WĘZŁY RENDERU, a narzędzie sklejało z nich kontener
 * `.scroll-pane` — dokładnie ten kształt, który czytał `src/source.ts`. Sens
 * miało to jeden: dało się tę samą walkę przepuścić drugą drogą (`extractText`
 * + `parse`) i porównać liczby. Parser tekstu zszedł z drzewa, więc `log.html`
 * nie ma czytelnika, a zbieranie węzłów było kosztem bez odbiorcy.
 *
 * DLACZEGO `protokol.json` z sondy, a nie z cudzego serwisu. ⚠️ Do 2026‑08‑04
 * repo miało drugi korpus — `tests/fixtures/grooove/`, protokół z publicznych
 * walk na grooove.pl. Był PRZEKODOWANY przez tamten serwis (`=` na `.`,
 * `+` na `@`, `dmg` skrócone do `D`), więc odpowiadał wyłącznie na pytanie
 * „czy gra w ogóle emituje klucz X". Zszedł z drzewa razem z całym
 * `tests/fixtures/`. Tutaj leży ładunek jeden do jednego z klienta.
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
 * Separatorem jest `=`, czyli to, co naprawdę
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

/**
 * Skład walki odczytany ze zrzutu — `id`, `name` i strona.
 *
 * PO CO. Dekoder protokołu zamienia `id` na nazwę wyłącznie po tej liście,
 * a `aggregate` bierze ją jako skład autorytatywny. Bez niej porównanie obu
 * dróg mierzyłoby też różnicę w numeracji instancji, a nie same liczby.
 *
 * SKĄD `side`. Migawka niesie `team` z gry, a nasza strona 0 to drużyna GRACZA
 * — więc potrzebny jest `myteam` z ładunku, i to on decyduje. Wersja
 * „`team !== 2` to strona 0" jest kusząca, bo tak klient dzieli skład w linii
 * otwierającej (`Battle.js:935‑936`), ale opiera się na założeniu, że gracz
 * nigdy nie stoi w drużynie 2 — a tego nikt nie sprawdził. Zrzut bez `myteam`
 * ma więc paść z powodem, zamiast zgadywać stronę i cicho odwrócić drużyny.
 *
 * Wojownicy zbierani są ze WSZYSTKICH wywołań, nie z pierwszego: skład potrafi
 * urosnąć w trakcie (przyzwania, zastępowi), a późniejsza migawka nie unieważnia
 * wcześniejszej — wygrywa ostatnie wystąpienie danego `id`.
 */
export function skladZeZrzutu(zrzut: Zrzut): {
  id: number;
  name: string;
  side: number;
  prof?: string;
  lvl?: number;
}[] {
  const myteam = mojaDruzyna(zrzut);
  if (myteam === null) {
    throw new Error(
      "zrzut nie niesie `myteam` w żadnym ładunku — bez niego nie da się " +
        "odróżnić drużyny gracza od przeciwnej, a zgadnięcie odwróciłoby strony",
    );
  }

  const wg = new Map<number, { id: number; name: string; side: number; prof?: string; lvl?: number }>();
  for (const wpis of zrzut.wpisy) {
    for (const surowy of [...wpis.wojownicyPrzed, ...wpis.wojownicyPo]) {
      if (typeof surowy !== "object" || surowy === null) continue;
      const w = surowy as Record<string, unknown>;
      const id = w["id"];
      const name = w["name"];
      const team = w["team"];
      if (typeof id !== "number" || typeof name !== "string" || name === "") continue;
      if (typeof team !== "number") continue;
      const prof = w["prof"];
      const lvl = w["lvl"];
      wg.set(id, {
        id,
        name,
        side: team === myteam ? 0 : 1,
        ...(typeof prof === "string" ? { prof } : {}),
        ...(typeof lvl === "number" ? { lvl } : {}),
      });
    }
  }
  return [...wg.values()];
}

/** `myteam` z pierwszego ładunku, który go niesie. Gra podaje je raz, przy otwarciu. */
export function mojaDruzyna(zrzut: Zrzut): number | null {
  for (const wpis of zrzut.wpisy) {
    const wartosc = wpis.ladunek["myteam"];
    if (typeof wartosc === "number") return wartosc;
  }
  return null;
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

/** Szkielet `meta.json` w schemacie korpusu `new-engine`. */
/**
 * Zrzut bez powtórzeń — wpisy, które nie wnoszą nic nowego, wypadają.
 *
 * PO CO. Gra woła `update` w pętli także wtedy, gdy nic się nie dzieje.
 * W pierwszym prawdziwym zrzucie było to **569 wywołań, z czego 567 miało
 * identyczny ładunek `{move: -1, endBattle: 1}`** — odpytywanie po zakończeniu
 * walki. Cały plik ważył 1,8 MB, a treści było w nim 15 kB. Fixture idzie do
 * gita NA ZAWSZE i 1,8 MB szumu jest ceną, której nikt nigdy nie odzyska.
 *
 * CO ZOSTAJE, i to jest cała ostrożność tej funkcji:
 *
 * 1. **każdy wpis z komunikatami** — bez wyjątku, to jest materiał dowodowy;
 * 2. **każdy nowy KSZTAŁT ładunku** (zbiór kluczy) — żeby nie zgubić tego, że
 *    gra w ogóle wysyła `endBattle` albo `poolTime`, choćby raz;
 * 3. **każda nowa migawka wojowników** — czyli pełna krzywa życia, bez
 *    powtórzeń tego samego stanu.
 *
 * Odrzucane są wyłącznie wpisy, które są DOKŁADNYM powtórzeniem kształtu
 * i stanu widzianego wcześniej. To nie jest „skracanie zrzutu do tego, co
 * nam pasuje" — żaden odrzucony wpis nie niesie informacji, której nie ma
 * w zachowanym.
 */
export function odchudz(wpisy: Wywolanie[]): Wywolanie[] {
  const ksztalty = new Set<string>();
  const stany = new Set<string>();
  return wpisy.filter((w) => {
    const ksztalt = JSON.stringify(Object.keys(w.ladunek).sort());
    const stan = JSON.stringify(w.wojownicyPo);
    const nowyKsztalt = !ksztalty.has(ksztalt);
    const nowyStan = !stany.has(stan);
    ksztalty.add(ksztalt);
    stany.add(stan);
    return w.komunikaty.length > 0 || nowyKsztalt || nowyStan;
  });
}

export function meta(zrzut: Zrzut, dzis: string): string {
  return `${JSON.stringify(
    {
      client: "new-engine",
      capturedAt: dzis,
      clientBuild: zrzut.build,
      world: zrzut.swiat,
      source: "tools/walka-probe.js — ładunki Engine.battle.update (protokol.json)",
      format: "protokol",
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

    const chude = odchudz(zrzut.wpisy);
    await Bun.write(
      `${katalog}protokol.json`,
      `${JSON.stringify({ ...zrzut, wpisy: chude }, null, 2)}\n`,
    );
    await Bun.write(`${katalog}meta.json`, meta(zrzut, dzis));

    const wiadomosci = komunikaty(zrzut.wpisy);
    console.log(`zapisane: ${katalog}`);
    if (chude.length < zrzut.wpisy.length) {
      console.log(
        `  odchudzone: ${zrzut.wpisy.length} → ${chude.length} wywołań ` +
          "(odrzucone są wyłącznie dokładne powtórzenia kształtu ładunku i stanu wojowników)",
      );
    }
    console.log(
      `  wywołań: ${zrzut.wpisy.length}, komunikatów: ${wiadomosci.length}, ` +
        `kluczy: ${histogram(wiadomosci).length}`,
    );
    if (zrzut.otwarcie === null) {
      console.warn(
        "  ⚠ brak linii otwierającej — sonda była wklejona po rozpoczęciu walki. " +
          "Fixture jest użyteczny, ale nie pozna z niego składu nikt, kto go czyta.",
      );
    }
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
