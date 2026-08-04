/**
 * Rozbicie zrzutu z `tools/walka-probe.js` na **moduł z materiałem** — i podgląd
 * tego, co w zrzucie siedzi.
 *
 * CO POWSTAJE. Plik `tests/walka-<nazwa>.ts` w kształcie, który w repo już stoi
 * (`tests/walka-z-gry.ts`): nagłówek z pochodzeniem, `KOMUNIKATY` i `SKLAD`.
 * Zasada z `AGENTS.md` — **materiał testowy powstaje W KODZIE, nie w plikach
 * danych** — i to jest cała różnica wobec katalogu z `protokol.json`
 * i `meta.json`, który stąd wychodził do 2026‑08‑04: tamten dało się dołożyć
 * do repo bez dotknięcia jednego testu, więc leżał martwy i nikt tego nie
 * widział. Moduł, którego nikt nie zaimportuje, zapala `noUnusedLocals` przy
 * pierwszej próbie użycia i widać go w `tsc`.
 *
 * CZEGO NARZĘDZIE NIE ROBI: nie opisuje walki. Trzy pola nagłówka wychodzą
 * z `DO UZUPEŁNIENIA` i mają tak wyglądać, dopóki człowiek ich nie wypełni —
 * zmyślony opis byłby gorszy niż jego brak, bo opis fixture'a czyta się potem
 * zamiast materiału.
 *
 * DLACZEGO ZRZUT Z SONDY, A NIE Z CUDZEGO SERWISU. Publiczne zrzuty walk bywają
 * PRZEKODOWANE po drodze (`=` na `.`, `+` na `@`, `dmg` skrócone do `D`) —
 * odpowiadają wtedy wyłącznie na pytanie „czy gra w ogóle emituje klucz X",
 * a nie „jak dokładnie brzmi komunikat". Sonda daje ładunek jeden do jednego
 * z klienta.
 *
 * Użycie:
 *   bun tools/walka.ts --rozbij ~/Pobrane/walka-tempest-….json --nazwa pvp-trucizna
 *   bun tools/walka.ts --pokaz ~/Pobrane/walka-tempest-….json
 *   bun tools/walka.ts --klucze <plik.json> […]
 */

import { existsSync } from "node:fs";
import type { RosterEntry } from "../src/roster.ts";

/** Gdzie ląduje moduł z `--rozbij`. */
const MATERIAL = new URL("../tests/", import.meta.url).pathname;

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
 * edycji. Wzór z `src/recorder.ts`: sprawdzamy każde pole, bo połowicznie
 * poprawny zrzut zapisałby się jako materiał z gry i wyglądał na dowód, nie
 * niosąc go.
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
    // moduł wyglądający jak materiał z gry i pusty w środku.
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
 * Separatorem jest `=`, czyli to, co naprawdę przysyła serwer — a nie to, co
 * z niego robią cudze serwisy z zapisami walk (kropka zamiast `=`, `@` zamiast
 * `+`). Ta funkcja czyta WYŁĄCZNIE ładunek z sondy i innej gramatyki nie zna.
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

/**
 * Zrzut bez powtórzeń — wpisy, które nie wnoszą nic nowego, wypadają.
 *
 * PO CO. Gra woła `update` w pętli także wtedy, gdy nic się nie dzieje.
 * W pierwszym prawdziwym zrzucie było to **569 wywołań, z czego 567 miało
 * identyczny ładunek `{move: -1, endBattle: 1}`** — odpytywanie po zakończeniu
 * walki. Cały plik ważył 1,8 MB, a treści było w nim 15 kB.
 *
 * ⚠️ **DO 2026‑08‑04 CHUDY ZRZUT SZEDŁ DO GITA I TO BYŁ CAŁY POWÓD** tej
 * funkcji. Dziś do repo trafia sam moduł z komunikatami, więc odchudzanie nie
 * oszczędza ani bajta w historii — została mu jedna rola i dla niej zostaje:
 * powiedzieć człowiekowi zaraz po zrzucie, ile z tego, co zebrał, było TREŚCIĄ.
 * „569 wywołań, treści w 2" to jedyny sygnał, że sonda stała pół godziny po
 * walce, i lepiej go zobaczyć teraz niż przy trzecim zrzucie z rzędu.
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

/**
 * Zrzut jako tekst modułu TS z materiałem.
 *
 * Nagłówek niesie POCHODZENIE (świat, build, data zrzutu i rozbicia) oraz linię
 * otwierającą, bo bez niej nie da się potem powiedzieć, czyja to walka.
 * `DO UZUPEŁNIENIA` zostaje dosłownie takie — patrz nagłówek pliku.
 *
 * Skład idzie z migawek `Engine.battle.warriors` przez `skladZeZrzutu`, a nie
 * z linii otwierającej: tamta niesie nazwę, poziom i profesję, ale NIE niesie
 * `id`, a bez `id` protokół nie ma jak stać się nazwą. Zrzut bez `myteam` pada
 * tutaj, zanim cokolwiek powstanie — moduł ze zgadniętymi stronami wyglądałby
 * jak materiał z gry i kłamałby o tym, kto z kim walczył.
 */
export function modulZrzutu(zrzut: Zrzut, dzis: string, nazwa: string): string {
  const sklad = skladZeZrzutu(zrzut);
  const wiadomosci = komunikaty(zrzut.wpisy);
  const wpis = (w: RosterEntry): string =>
    `  { id: ${w.id}, name: ${JSON.stringify(w.name)}, side: ${w.side}` +
    `${w.prof === undefined ? "" : `, prof: ${JSON.stringify(w.prof)}`}` +
    `${w.lvl === undefined ? "" : `, lvl: ${w.lvl}`} },`;

  return [
    "/**",
    ` * Walka z gry — \`${nazwa}\`.`,
    " *",
    ` * Zrzut sondy \`tools/walka-probe.js\`: świat \`${zrzut.swiat}\`, build`,
    ` * \`${zrzut.build ?? "nieznany"}\`, zebrany ${zrzut.przy.slice(0, 10)}, rozbity ${dzis}`,
    ` * przez \`bun tools/walka.ts --rozbij … --nazwa ${nazwa}\`.`,
    " *",
    zrzut.otwarcie === null
      ? " * ⚠️ BEZ LINII OTWIERAJĄCEJ — sonda była wklejona po rozpoczęciu walki."
      : ` * Linia otwierająca: ${JSON.stringify(zrzut.otwarcie)}`,
    " *",
    " * CO POKRYWA: DO UZUPEŁNIENIA — co siedzi w tej walce, po przejrzeniu.",
    " * CZEGO NIE MA: DO UZUPEŁNIENIA.",
    " * CO BYŁO TRUDNE: DO UZUPEŁNIENIA.",
    " *",
    " * **Materiału się nie edytuje, żeby test przeszedł.** Pochodzi z gry i nie",
    " * ma jak powstać ponownie inaczej niż nowym zrzutem. Wypełnić wolno wyłącznie",
    " * trzy pola wyżej.",
    " */",
    'import type { RosterEntry } from "../src/roster.ts";',
    "",
    "export const KOMUNIKATY: string[] = [",
    ...wiadomosci.map((k) => `  ${JSON.stringify(k)},`),
    "];",
    "",
    "/**",
    " * Skład tej walki z `Engine.battle.warriors`. Strona 0 to drużyna gracza",
    " * (`myteam` z ładunku), ujemne `id` to potwory.",
    " */",
    "export const SKLAD: RosterEntry[] = [",
    ...sklad.map(wpis),
    "];",
    "",
  ].join("\n");
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
    if (nazwa === null) throw new Error("wymagane --nazwa (krótki opis do nazwy pliku)");
    const zrzut = czytajZrzut(await Bun.file(rozbij).text());
    const dzis = new Date().toISOString().slice(0, 10);
    const plik = `${MATERIAL}walka-${nazwa}.ts`;
    if (existsSync(plik)) {
      throw new Error(`${plik} już istnieje — materiału z gry się nie nadpisuje`);
    }

    // Odchudzenie liczymy PRZED zapisem, żeby dało się powiedzieć w wyjściu, ile
    // z tego zrzutu było odpytywaniem po walce. Do modułu i tak idą wyłącznie
    // komunikaty, więc odchudzanie niczego tam nie zmienia — zmienia to, co
    // człowiek wie o zrzucie, który właśnie zebrał.
    const chude = odchudz(zrzut.wpisy);
    await Bun.write(plik, modulZrzutu(zrzut, dzis, nazwa));

    const wiadomosci = komunikaty(zrzut.wpisy);
    console.log(`zapisane: ${plik}`);
    if (chude.length < zrzut.wpisy.length) {
      console.log(
        `  zrzut niósł ${zrzut.wpisy.length} wywołań, treści było w ${chude.length} ` +
          "(reszta to dokładne powtórzenia kształtu ładunku i stanu wojowników)",
      );
    }
    console.log(
      `  komunikatów: ${wiadomosci.length}, kluczy: ${histogram(wiadomosci).length}, ` +
        `w składzie: ${skladZeZrzutu(zrzut).length}`,
    );
    if (zrzut.otwarcie === null) {
      console.warn(
        "  ⚠ brak linii otwierającej — sonda była wklejona po rozpoczęciu walki. " +
          "Materiał jest użyteczny, ale nie pozna z niego kontekstu nikt, kto go czyta.",
      );
    }
    console.log("  trzy pola nagłówka czekają na wypełnienie — narzędzie ich nie zmyśla");
    process.exit(0);
  }

  if (pokaz !== null) {
    const zrzut = czytajZrzut(await Bun.file(pokaz).text());
    console.log(`świat: ${zrzut.swiat}, build: ${zrzut.build ?? "—"}`);
    console.log(`otwarcie: ${zrzut.otwarcie ?? "—"}\n`);
    for (const komunikat of komunikaty(zrzut.wpisy)) console.log(komunikat);
    process.exit(0);
  }

  if (klucze) {
    const pliki = argumenty.filter((a) => !a.startsWith("--"));
    if (pliki.length === 0) {
      console.error(
        "podaj co najmniej jeden plik zrzutu — zbierz walkę sondą " +
          "`tools/walka-probe.js` i wskaż pobrany JSON",
      );
      process.exit(1);
    }
    const wszystkie: string[] = [];
    for (const plik of pliki) {
      const zrzut = czytajZrzut(await Bun.file(plik).text());
      wszystkie.push(...komunikaty(zrzut.wpisy));
    }
    const licznik = histogram(wszystkie);
    console.log(`${pliki.length} walk, ${wszystkie.length} komunikatów, ${licznik.length} kluczy\n`);
    for (const [klucz, ile] of licznik) console.log(`${String(ile).padStart(6)}  ${klucz}`);
    process.exit(0);
  }

  console.error(
    [
      "użycie:",
      "  bun tools/walka.ts --rozbij <plik.json> --nazwa <slug>   → tests/walka-<slug>.ts",
      "  bun tools/walka.ts --pokaz <plik.json>",
      "  bun tools/walka.ts --klucze <plik.json> […]",
      "",
      "zrzut robi `tools/walka-probe.js` wklejony do konsoli gry.",
    ].join("\n"),
  );
  process.exit(2);
}
