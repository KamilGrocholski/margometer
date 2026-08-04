/**
 * Pobieranie publicznych walk z grooove.pl do korpusu referencyjnego
 * `tests/fixtures/grooove/`.
 *
 * CZEGO TO NIE ROBI, i to jest w tym narzędziu najważniejsze: **nie produkuje
 * tekstu dla parsera.** grooove.pl nie trzyma tekstu z okna walki — trzyma
 * SUROWY PROTOKÓŁ silnika, a polskie zdania powstają dopiero w przeglądarce,
 * z `battle_engine.js`, czyli cudzej reimplementacji renderera. Pomiar
 * 2026‑08‑03 na 28 publicznych walkach (5094 linie renderu): 227 linii wyszło
 * jako „Nieznany parametr", 16 różnych kluczy (`active_decblock_per` ×46,
 * `+crush_physical` ×36, `-legbon_facade` ×28 — to ostatnie gra pokazuje dziś
 * jako „Fasada opieki…" i stoi w `2026-08-03_druzyna-vs-hildur-absorpcja`).
 * Ten sam render przepuszczony przez `src/parser.ts` dał 132 z 223 zdarzeń
 * jako `unknown` — inny dialekt, nie za wąskie wzorce: grooove pisze `+1462`
 * bez odstępów, `-0-37` sklejone, `obrażeń.` z kropką i ucina HP% do całości.
 *
 * Stąd zapisujemy sam protokół. Odpowiada na pytanie „czy gra w ogóle emituje
 * X i jak często", nie na „czy parser to czyta". Powody i granice tego korpusu:
 * `tests/fixtures/grooove/README.md`.
 *
 * Użycie:
 *   bun tools/grooove.ts --lista --swiat nerthus [--strona 2]
 *   bun tools/grooove.ts --pobierz 84840537 --swiat nerthus --nazwa pvp-1v1
 *   bun tools/grooove.ts --pokaz 2026-08-03_nerthus_pvp-1v1   # albo samo ID
 *   bun tools/grooove.ts --parametry
 */

import { existsSync, readdirSync } from "node:fs";
import { PROFESSIONS, type ProfessionCode } from "../src/types.ts";
import { parse } from "../src/parser.ts";

/**
 * Światy publiczne — lista z menu `grooove.pl/battle/`, przepisana 2026‑08‑03.
 *
 * PO CO WHITELISTA. Globalny feed na stronie głównej panelu miesza światy
 * prywatne: przy przeglądaniu wpadły `luvia` i `nexos`, których w tym menu nie
 * ma. Filtr `?w=` je odsiewa, ale tylko wtedy, gdy pyta się o świat z listy —
 * a `--pobierz` dostaje samo ID i ze strony walki świata NIE da się odczytać
 * (sprawdzone: `/battle/id,N` nie niesie go ani w treści, ani w metatagach).
 * Dlatego świat podaje się ręcznie i jest sprawdzany tutaj. Zgoda na materiał
 * ze świata prywatnego to nie nasza decyzja, więc pobranie spoza listy jest
 * BŁĘDEM, nie ostrzeżeniem, które da się przeoczyć.
 */
export const SWIATY_PUBLICZNE = [
  "aether",
  "aldous",
  "berufs",
  "brutal",
  "classic",
  "fobos",
  "gefion",
  "gordion",
  "hutena",
  "jaruna",
  "katahha",
  "lelwani",
  "majuna",
  "nerthus",
  "nomada",
  "nubes",
  "pandora",
  "perkun",
  "syberia",
  "tarhuna",
  "telawel",
  "tempest",
  "unia",
  "zemyna",
  "zorza",
  // Trzy anglojęzyczne, w menu z dopiskiem [EN]; w adresach bez niego.
  "husaria",
  "cronus",
  "steamrealm",
] as const;

const KORPUS = new URL("../tests/fixtures/grooove/", import.meta.url).pathname;
const CACHE = new URL("../.cache/", import.meta.url).pathname;

/** Wpis z listy walk. Nazwy pól są ze strony — jednoliterowe i takie zostają. */
export type WpisListy = {
  /** ID walki; adres to `/battle/id,<i>`. */
  i: number;
  /** ID właściciela zrzutu (profil w grze). */
  p: number;
  /** Świat, małymi literami. */
  w: string;
  /** Nick właściciela zrzutu. */
  n: string;
  /** Linia otwierająca walkę, ta sama, którą widzi gracz. */
  o: string;
  /** Czas dodania, uniksowy w sekundach. */
  d: number;
};

/** Protokół jednej walki — dwa pola, dokładnie tak, jak serwuje je strona. */
export type Protokol = { team: string; log: string };

/**
 * Uczestnik w `meta.json` korpusu. `null` znaczy „dane tego nie niosą" — pola
 * NIE są opcjonalne, żeby luka była widoczna w pliku, a nie tylko w jego braku.
 */
export type UczestnikKorpusu = {
  name: string;
  level: number | null;
  professionCode: string | null;
  profession: string | null;
  /** `m` / `f` z pola `team`; strona używa tego do odmiany, my tylko przepisujemy. */
  gender: string;
  /** Numer drużyny z pola `team` — 1 albo 2. */
  team: number;
};

async function pobierzHtml(adres: string, plikCache: string): Promise<string> {
  const plik = Bun.file(`${CACHE}${plikCache}`);
  if (await plik.exists()) return plik.text();

  console.error(`pobieram ${adres} …`);
  const odpowiedz = await fetch(adres, {
    // Bez tego nagłówka strona oddaje 403. Nie udajemy przeglądarki po to, żeby
    // coś obejść — panel walk jest publiczny; to tylko wymóg formalny serwera.
    headers: { "User-Agent": "margometer-fixtures (bun)" },
  });
  if (!odpowiedz.ok) throw new Error(`${adres} → HTTP ${odpowiedz.status}`);
  const html = await odpowiedz.text();
  await Bun.write(`${CACHE}${plikCache}`, html);
  return html;
}

/**
 * Lista walk z jednej strony wyników.
 *
 * `Page.data` jest tu STRINGIEM z JSON-em (na stronie pojedynczej walki jest
 * literałem JS — patrz `czytajProtokol`). Dwa różne kształty pod tą samą nazwą,
 * stąd dwie osobne funkcje zamiast jednej „uniwersalnej".
 */
export function czytajListe(html: string): WpisListy[] {
  const trafienie = html.match(/Page\.data = '(.*?)';/s);
  if (trafienie === null) throw new Error("brak Page.data na stronie listy");
  const dane = JSON.parse(trafienie[1]!) as { items?: WpisListy[] };
  return dane.items ?? [];
}

/**
 * Protokół ze strony pojedynczej walki albo `null`, gdy walki nie ma.
 *
 * `null` NIE jest sytuacją wyjątkową: właściciel zrzutu może go ukryć albo
 * usunąć, a strona oddaje wtedy zwykłe HTTP 200 bez `Page.data`. Przy pobieraniu
 * 30 walk trafiły się dwie takie. Zapisanie w takim wypadku pustego fixture'a
 * byłoby gorsze niż błąd — plik wyglądałby jak dowód, nie niosąc niczego.
 *
 * Wartości wyciągamy regexem i puszczamy przez `JSON.parse`, żeby odkręcić
 * sekwencje `\"` i `\u…`. Nie `eval` — to jest cudzy kod ze strony.
 */
export function czytajProtokol(html: string): Protokol | null {
  // `\b` z przodu, żeby „log" nie złapało się w środku innej nazwy pola.
  const pole = (nazwa: string) =>
    html.match(new RegExp(`\\b${nazwa}: "((?:[^"\\\\]|\\\\.)*)"`))?.[1];
  const team = pole("team");
  const log = pole("log");
  if (team === undefined || log === undefined) return null;
  return {
    team: JSON.parse(`"${team}"`) as string,
    log: JSON.parse(`"${log}"`) as string,
  };
}

/** Linia otwierająca walkę — jedyne miejsce z poziomami i profesjami. */
export function czytajOpis(html: string): string | null {
  return html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? null;
}

/**
 * Odstęp między nazwą a nawiasem z poziomem: `Baylan(83w)` → `Baylan (83w)`.
 *
 * PO CO. `RE_PARTICIPANT` w parserze wymaga `\s` przed nawiasem, bo okno walki
 * pisze `Łowca głów z psk (104h)`. grooove w swojej linii otwierającej pisze
 * bez odstępu i bez tej poprawki `parse` oddaje pustą listę uczestników.
 *
 * Poprawka siedzi TUTAJ, nie w parserze, i to jest cała jej treść: wzorce
 * parsera są wąskie celowo i nie mają się rozjeżdżać pod cudze źródło. To jest
 * przeformatowanie pola grooove'a, a nie dopisywanie tekstu, którego gra nie
 * wypowiedziała — zmienia się jeden odstęp, żadna liczba ani nazwa.
 */
export function odstepPrzedPoziomem(opis: string): string {
  return opis.replace(/(\S)\((\d+)([a-zA-Z])\)/g, "$1 ($2$3)");
}

/**
 * Uczestnicy walki z dwóch źródeł, bez uzupełniania luk zgadywaniem.
 *
 * `team` niesie ID, nick, płeć i numer drużyny — po czwórkach, rozdzielone `|`.
 * Poziomu ani profesji tam NIE MA; te są w linii otwierającej (`Baylan(218w)`),
 * którą umie już czytać `parse` — łącznie z rozdzieleniem stron po słowie „a".
 * Zamiast pisać drugi wzorzec na ten sam format, przepuszczamy opis przez
 * parser i sklejamy po nazwie.
 *
 * Nazwy potrafią się powtarzać, więc sklejanie po nazwie bywa niejednoznaczne —
 * ale POWTÓRZENIE SAMO W SOBIE nie jest konfliktem. Linia otwierająca z grooove
 * potrafi wyliczyć każdego dwa razy (`Baylan(83w), Baylan(83w) a Dark Laser(64p),
 * Dark Laser(64p)` przy dwuosobowym `team`), a bywa i nie potrafi — walka
 * 84840888 z tej samej listy ma skład wypisany raz. Dwa identyczne wpisy niosą
 * tę samą wartość, więc nic nie tracimy. `null` wstawiamy dopiero wtedy, gdy ta
 * sama nazwa przychodzi z RÓŻNYM poziomem albo profesją — wtedy naprawdę nie
 * wiadomo, który jest który, a zgadnięcie byłoby nazwiskiem z sufitu.
 */
export function uczestnicy(team: string, opis: string | null): UczestnikKorpusu[] {
  const zOpisu = new Map<string, { level: number; professionCode: string } | null>();
  if (opis !== null) {
    for (const zdarzenie of parse(odstepPrzedPoziomem(opis))) {
      if (zdarzenie.kind !== "fight-start") continue;
      for (const uczestnik of zdarzenie.participants) {
        const nowy = { level: uczestnik.level, professionCode: uczestnik.professionCode };
        if (!zOpisu.has(uczestnik.name)) {
          zOpisu.set(uczestnik.name, nowy);
          continue;
        }
        const stary = zOpisu.get(uczestnik.name);
        const zgodny =
          stary !== null &&
          stary !== undefined &&
          stary.level === nowy.level &&
          stary.professionCode === nowy.professionCode;
        if (!zgodny) zOpisu.set(uczestnik.name, null);
      }
    }
  }

  const czworki: UczestnikKorpusu[] = [];
  const pola = team.split("|");
  for (let i = 0; i + 3 < pola.length; i += 4) {
    const name = pola[i + 1]!;
    const opisany = zOpisu.get(name) ?? null;
    const kod = opisany?.professionCode ?? null;
    czworki.push({
      name,
      level: opisany?.level ?? null,
      professionCode: kod,
      profession: kod !== null && kod in PROFESSIONS ? PROFESSIONS[kod as ProfessionCode] : null,
      gender: pola[i + 2]!,
      team: Number(pola[i + 3]),
    });
  }
  return czworki;
}

/**
 * Zdarzenia protokołu: `log` rozbity po `|`.
 *
 * Podział jest bezstratny i odwracalny (`zdarzenia(log).join("|")` odtwarza
 * wejście z dokładnością do wiodącego separatora), więc wolno go robić przy
 * czytaniu. W PLIKU fixture'a `log` zostaje jedną linią — dowodem jest to, co
 * serwuje strona, nie nasze formatowanie.
 */
export function zdarzenia(log: string): string[] {
  return log.split("|").filter((z) => z.length > 0);
}

/**
 * Klucze parametrów użyte w zdarzeniu, bez wartości.
 *
 * Zdarzenie ma kształt `atakujący;cel;klucz.wartość;klucz.wartość;…`; dwa
 * pierwsze segmenty to strony, reszta to parametry. Klucz kończy się na
 * pierwszej kropce, bo wartości bywają złożone (`X.1053,a,Dark Laser(92.90%)`).
 * Parametry bez wartości (`r`, `x`, `P`, `flee`) są całym segmentem.
 */
export function kluczeZdarzenia(zdarzenie: string): string[] {
  return zdarzenie
    .split(";")
    .slice(2)
    .filter((s) => s.length > 0)
    .map((s) => {
      const kropka = s.indexOf(".");
      return kropka === -1 ? s : s.slice(0, kropka);
    });
}

/** Katalogi korpusu, posortowane. Pusty, gdy korpusu jeszcze nie ma. */
export async function katalogiKorpusu(): Promise<string[]> {
  if (!existsSync(KORPUS)) return [];
  return readdirSync(KORPUS, { withFileTypes: true })
    .filter((w) => w.isDirectory())
    .map((w) => w.name)
    .sort();
}

/** Zapis fixture'a: `team=` i `log=` w dwóch liniach, wartości nietknięte. */
export function tresc(protokol: Protokol): string {
  return `team=${protokol.team}\nlog=${protokol.log}\n`;
}

/** Odczyt fixture'a. Rzuca, gdy plik nie ma obu pól — patrz `tests/grooove.test.ts`. */
export function czytajFixture(tekst: string): Protokol {
  const linie = tekst.split("\n").filter((l) => l.length > 0);
  const team = linie.find((l) => l.startsWith("team="))?.slice("team=".length);
  const log = linie.find((l) => l.startsWith("log="))?.slice("log=".length);
  if (team === undefined || log === undefined) {
    throw new Error("plik korpusu musi mieć linię `team=` i linię `log=`");
  }
  return { team, log };
}

function tekstowa(argumenty: string[], flaga: string, domyslna: string | null): string | null {
  const gdzie = argumenty.indexOf(flaga);
  if (gdzie === -1) return domyslna;
  const wartosc = argumenty[gdzie + 1];
  if (wartosc === undefined) throw new Error(`${flaga} wymaga wartości`);
  argumenty.splice(gdzie, 2);
  return wartosc;
}

/** CLI za bramką, żeby dało się ten plik zaimportować — jak w `tools/pomoc.ts`. */
if (import.meta.main) {
  const argumenty = process.argv.slice(2);
  const swiat = tekstowa(argumenty, "--swiat", null);
  const nazwa = tekstowa(argumenty, "--nazwa", null);
  const strona = tekstowa(argumenty, "--strona", "1")!;
  const pobierz = tekstowa(argumenty, "--pobierz", null);
  const pokaz = tekstowa(argumenty, "--pokaz", null);

  const sprawdzSwiat = (w: string | null): string => {
    if (w === null) throw new Error("wymagane --swiat (lista: " + SWIATY_PUBLICZNE.join(", ") + ")");
    if (!(SWIATY_PUBLICZNE as readonly string[]).includes(w)) {
      throw new Error(
        `„${w}" nie jest światem publicznym. Korpus bierze wyłącznie światy z menu ` +
          `grooove.pl/battle/ — powód w tests/fixtures/grooove/README.md`,
      );
    }
    return w;
  };

  if (argumenty.includes("--lista")) {
    const w = sprawdzSwiat(swiat);
    const html = await pobierzHtml(
      `https://grooove.pl/battle/?w=${w}&page=${strona}`,
      `grooove-lista-${w}-${strona}.html`,
    );
    const wpisy = czytajListe(html);
    console.log(`${w}, strona ${strona} — ${wpisy.length} walk\n`);
    for (const wpis of wpisy) {
      // Świat z wpisu, nie z zapytania: gdyby filtr kiedyś przepuścił obcy
      // rekord, ma to być widać w wyjściu, a nie dopiero po pobraniu.
      console.log(`bun tools/grooove.ts --pobierz ${wpis.i} --swiat ${wpis.w} --nazwa …`);
      console.log(`  ${wpis.o}\n`);
    }
    process.exit(0);
  }

  if (pobierz !== null) {
    const w = sprawdzSwiat(swiat);
    if (nazwa === null) throw new Error("wymagane --nazwa (krótki opis do nazwy katalogu)");

    const html = await pobierzHtml(
      `https://grooove.pl/battle/id,${pobierz}`,
      `grooove-walka-${pobierz}.html`,
    );
    const protokol = czytajProtokol(html);
    if (protokol === null) {
      console.error(
        `walka ${pobierz} nie ma protokołu — właściciel ją ukrył albo usunął.\n` +
          `Strona oddaje na to HTTP 200, więc to nie jest błąd sieci. Wybierz inną.`,
      );
      process.exit(1);
    }

    const opis = czytajOpis(html);
    const dzis = new Date().toISOString().slice(0, 10);
    const katalog = `${KORPUS}${dzis}_${w}_${nazwa}/`;
    const lista = uczestnicy(protokol.team, opis);

    await Bun.write(`${katalog}log.grooove.txt`, tresc(protokol));
    await Bun.write(
      `${katalog}meta.json`,
      `${JSON.stringify(
        {
          client: "grooove",
          format: "protokol",
          capturedAt: dzis,
          clientBuild: null,
          world: w,
          fightId: Number(pobierz),
          sourceUrl: `https://grooove.pl/battle/id,${pobierz}`,
          source:
            "grooove.pl — pole Page.data.log, protokół silnika, NIE tekst z okna walki",
          opening: opis,
          participants: lista,
          covers: ["DO UZUPEŁNIENIA — co siedzi w tym pliku, po przejrzeniu"],
          missing: ["DO UZUPEŁNIENIA"],
          notes: "DO UZUPEŁNIENIA",
        },
        null,
        2,
      )}\n`,
    );

    console.log(`zapisane: ${katalog}`);
    console.log(`  zdarzeń: ${zdarzenia(protokol.log).length}, uczestników: ${lista.length}`);
    console.log(`  covers/missing/notes czekają na wypełnienie — narzędzie ich nie zmyśla`);
    process.exit(0);
  }

  if (pokaz !== null) {
    const plik = Bun.file(`${KORPUS}${pokaz}/log.grooove.txt`);
    const protokol = (await plik.exists())
      ? czytajFixture(await plik.text())
      : czytajProtokol(
          await pobierzHtml(
            `https://grooove.pl/battle/id,${pokaz}`,
            `grooove-walka-${pokaz}.html`,
          ),
        );
    if (protokol === null) throw new Error(`nie znalazłem ani fixture'a, ani walki ${pokaz}`);

    console.log(`team: ${protokol.team}\n`);
    for (const zdarzenie of zdarzenia(protokol.log)) console.log(zdarzenie);
    process.exit(0);
  }

  if (argumenty.includes("--parametry")) {
    const licznik = new Map<string, number>();
    const katalogi = await katalogiKorpusu();
    for (const katalog of katalogi) {
      const { log } = czytajFixture(await Bun.file(`${KORPUS}${katalog}/log.grooove.txt`).text());
      for (const zdarzenie of zdarzenia(log)) {
        for (const klucz of kluczeZdarzenia(zdarzenie)) {
          licznik.set(klucz, (licznik.get(klucz) ?? 0) + 1);
        }
      }
    }
    console.log(`korpus: ${katalogi.length} walk, ${licznik.size} różnych kluczy\n`);
    for (const [klucz, ile] of [...licznik].sort((a, b) => b[1] - a[1])) {
      console.log(`${String(ile).padStart(6)}  ${klucz}`);
    }
    process.exit(0);
  }

  console.error(
    [
      "użycie:",
      "  bun tools/grooove.ts --lista --swiat nerthus [--strona 2]",
      "  bun tools/grooove.ts --pobierz <ID> --swiat <świat> --nazwa <slug>",
      "  bun tools/grooove.ts --pokaz <katalog|ID>",
      "  bun tools/grooove.ts --parametry",
    ].join("\n"),
  );
  process.exit(2);
}
