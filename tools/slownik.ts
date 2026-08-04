/**
 * Klucz protokołu walki → **dosłowne zdanie, które wypisuje gra**.
 *
 * PO CO TO ISTNIEJE, skoro jest `tools/pomoc.ts`. Bo tamta odpowiada na inne
 * pytanie. Pomoc gry mówi, JAK DZIAŁA mechanika („blok obniża obrażenia o…");
 * ten plik mówi, JAK BRZMI linia, którą gra o tym wypisze. Repo potrzebowało
 * dotąd obu, a miało tylko pierwsze — stąd wpisy w `docs/MECHANIKA.md` typu
 * „efekt zachodzi, ale nie wiemy, jak brzmi jego linia w oknie walki i nie
 * wolno tego zgadnąć". Teraz wolno: brzmienie idzie z assetu gry.
 *
 * SKĄD SIĘ BIERZE. Okno walki nie dostaje zdań — dostaje protokół. Renderer
 * klienta (`BattleMessage.js`, wkompilowany w `main.min.js`) ma na każdy klucz
 * etykietę `case`, a w niej wywołanie `_t(<identyfikator>, …)`. Identyfikatory
 * rozwiązuje osobny plik ze słownikiem. Złączenie tych dwóch daje tabelę
 * `klucz → zdanie` i rozwiązuje **223 z 233 etykiet**, z czego 10 pozostałych
 * to „gra tego nie wypisuje", a **0 do wyjaśnienia** (pomiar 2026‑08‑04, build
 * 1785244275300, `bun tools/slownik.ts --braki`).
 *
 * ⚠️ Liczba etykiet jest liczbą PO odsianiu zagnieżdżonych `switch`y — patrz
 * `etykietyRenderera`. Goły `grep -c "case '"` na źródle renderera daje więcej
 * (238 wierszy, 234 unikalne etykiety) i te nadmiarowe kluczami protokołu nie
 * są. Zdania „240 etykiet, 236 kluczy" w `docs/specy/` pochodzą sprzed tego
 * odsiania i są tą samą liczbą policzoną inaczej, nie zmianą w grze.
 *
 * CZEGO TO NIE MÓWI. Że gra tę linię wypisze W TEJ WALCE — słownik zna
 * brzmienie, nie warunek. I nie mówi, jak linia wygląda po złożeniu: `battleMsg`
 * skleja w jedno zdanie kilka kluczy, podstawia odmianę pod `#`/`$` i dokłada
 * `<br>`. To jest szablon, nie zrzut z okna. Wzorzec parsera stawia się na
 * zrzucie z gry; ten plik mówi, CZEGO w zrzucie szukać.
 *
 * Użycie:
 *   bun tools/slownik.ts                     # cała tabela
 *   bun tools/slownik.ts rage krwawieni      # filtr po kluczu i po zdaniu
 *   bun tools/slownik.ts --klucz "+wound"    # dokładnie ten klucz
 *   bun tools/slownik.ts --braki             # etykiety bez zdania
 *   bun tools/slownik.ts --zamroz            # lista etykiet → fixture
 *   bun tools/slownik.ts --odswiez           # pobierz assety na nowo
 */

import { SlownikStaly } from "../src/slownik-gry.ts";

const CACHE = new URL("../.cache/", import.meta.url).pathname;

/**
 * Świat, z którego bierzemy klienta. Dowolny publiczny wystarczy — pliki są
 * wspólne, w adresie różni się tylko poddomena. `tempest` jest w whiteliście
 * reszta narzędzi, więc nie dokłada tu nowej decyzji o tym, skąd wolno brać.
 */
const SWIAT = "tempest";

/** Adres słownika tłumaczeń. Wspólny dla wszystkich światów. */
const SLOWNIK = "https://commons.margonem.pl/js/dictionaries/dictionary_pl.js";

/**
 * Wynik dla jednego klucza protokołu.
 *
 * `zdanie: null` przy `identyfikator: null` znaczy co innego niż przy
 * identyfikatorze ustawionym, i to rozróżnienie jest tu najważniejsze:
 * pierwsze to „gra tego nie wypisuje" (etykieta z pustym ciałem — takich jest
 * kilka i są celowe), drugie to „nie umiemy znaleźć zdania" — czyli luka
 * narzędzia. Zlanie ich w jedno dałoby fałszywy negatyw, a ten zamyka temat.
 */
export type Wpis = {
  klucz: string;
  identyfikator: string | null;
  zdanie: string | null;
};

/**
 * Ciało `battleMsg` wycięte z bundla klienta, przez dopasowanie nawiasów.
 *
 * Regexem się nie da: ciało ma 26 kB i kilkaset nawiasów klamrowych. Szukamy
 * po nazwie własnej funkcji, bo minifikator zmienia nazwy zmiennych, ale nie
 * rusza nazw pól przypisywanych do `this`.
 */
export function cialoRenderera(bundle: string): string {
  const start = bundle.indexOf("this.battleMsg=function");
  if (start === -1) {
    throw new Error(
      "nie znalazłem `this.battleMsg` w bundlu klienta — renderer zmienił nazwę " +
        "albo kształt. To nie jest błąd sieci: plik się pobrał.",
    );
  }
  let glebokosc = 0;
  for (let i = bundle.indexOf("{", start); i < bundle.length; i += 1) {
    if (bundle[i] === "{") glebokosc += 1;
    else if (bundle[i] === "}") {
      glebokosc -= 1;
      if (glebokosc === 0) return bundle.slice(start, i + 1);
    }
  }
  throw new Error("ciało `battleMsg` nie domyka się nawiasem");
}

/**
 * Pozycje etykiet `case"…":` wraz z głębokością zagnieżdżenia w nawiasach
 * klamrowych. Literały tekstowe są pomijane, żeby klamra w treści zdania nie
 * przesuwała licznika.
 */
function pozycjeEtykiet(cialo: string): { klucz: string; od: number; do_: number; glebokosc: number }[] {
  const wynik: { klucz: string; od: number; do_: number; glebokosc: number }[] = [];
  let glebokosc = 0;
  for (let i = 0; i < cialo.length; i += 1) {
    const znak = cialo[i]!;
    if (znak === '"' || znak === "'") {
      // Etykiety też są w cudzysłowach, więc literał rozpoznajemy dopiero po
      // sprawdzeniu, czy nie stoi za słowem `case`.
      const etykieta = /^case"((?:[^"\\]|\\.)*)":/.exec(cialo.slice(i - 4, i + 200));
      if (znak === '"' && cialo.startsWith("case", i - 4) && etykieta !== null) {
        wynik.push({
          klucz: etykieta[1]!,
          od: i - 4,
          do_: i - 4 + etykieta[0].length,
          glebokosc,
        });
        i += etykieta[0].length - 5;
        continue;
      }
      i += 1;
      while (i < cialo.length && cialo[i] !== znak) i += cialo[i] === "\\" ? 2 : 1;
      continue;
    }
    if (znak === "{") glebokosc += 1;
    else if (znak === "}") glebokosc -= 1;
  }
  return wynik;
}

/**
 * Etykiety `case` GŁÓWNEGO rozgałęzienia renderera, każda ze swoim ciałem.
 *
 * Dwie rzeczy, i obie kosztowały tu po jednym błędnym wyniku:
 *
 * **1. Fallthrough.** Renderer grupuje klucze (`case"a":case"b":<wspólne
 * ciało>`), więc podział po etykietach daje pierwszym ciała PUSTE. Bez
 * dziedziczenia od końca ginie 22 klucze — te, które dzielą obsługę
 * z sąsiadem. Dziedziczenie idzie wstecz, żeby łańcuch dowolnej długości dostał
 * ciało ostatniego ogniwa. (Pomiar robiony przed poprawką 2, przy 240
 * etykietach liczonych płasko; liczby zgubionych kluczy to nie dotyczy.)
 *
 * **2. Zagnieżdżone `switch`.** `case"+crush_physical"` ma w środku własne
 * rozgałęzienie po żywiole (`case"fire"`, `case"frost"`, …). Płaski podział
 * ucinał jego ciało na pierwszej wewnętrznej etykiecie i narzędzie meldowało
 * „gra tego nie wypisuje" o kluczu, który linię wypisuje — czyli **fałszywy
 * negatyw**, klasa błędu, która w tym repo dwa razy zamknęła temat. Bierzemy
 * więc wyłącznie etykiety z tej głębokości, co pierwsza z nich.
 */
export function etykietyRenderera(cialo: string): { klucz: string; cialo: string }[] {
  const wszystkie = pozycjeEtykiet(cialo);
  if (wszystkie.length === 0) return [];
  const glowna = wszystkie[0]!.glebokosc;
  const etykiety = wszystkie.filter((e) => e.glebokosc === glowna);

  const ciala = etykiety.map((e, i) =>
    cialo.slice(e.do_, etykiety[i + 1]?.od ?? cialo.length),
  );
  for (let i = ciala.length - 2; i >= 0; i -= 1) {
    if (ciala[i]!.trim() === "") ciala[i] = ciala[i + 1]!;
  }
  return etykiety.map((e, i) => ({ klucz: e.klucz, cialo: ciala[i]! }));
}

/**
 * Identyfikatory tłumaczeń, których może użyć ciało etykiety — po kolei, od
 * najpewniejszego.
 *
 * Renderer woła `_t` na trzy sposoby i wszystkie trzy trzeba umieć złożyć:
 * literałem (`_t("msg_heal %val%")`), sklejeniem z kluczem
 * (`_t("msg_only_val_"+O[0])`) i sklejeniem z obu stron
 * (`_t("eng_game_"+O[0]+" %name%")`). Na końcu dwa ślepe strzały — `msg_<klucz>`
 * i sam klucz — bo słownik bywa spójniejszy niż kod.
 */
export function identyfikatoryKandydujace(klucz: string, cialo: string): string[] {
  const kandydaci: string[] = [];
  for (const m of cialo.matchAll(/_t\("([^"]*)"\+O\[0\]\+"([^"]*)"/g)) {
    kandydaci.push(m[1]! + klucz + m[2]!);
  }
  for (const m of cialo.matchAll(/_t\("([^"]*)"\+O\[0\]/g)) {
    kandydaci.push(m[1]! + klucz);
  }
  const literal = cialo.match(/_t\("((?:[^"\\]|\\.)*)"/);
  if (literal !== null) kandydaci.push(literal[1]!);
  kandydaci.push(`msg_${klucz}`, klucz);
  return kandydaci;
}

/**
 * Słownik tłumaczeń spłaszczony do mapy `identyfikator → zdanie`.
 *
 * Plik jest literałem JS, nie JSON-em: część kluczy stoi w cudzysłowach
 * (`"msg_-blok %val%":"…"`), część nie (`msg_only_val_active_block_per:"…"`),
 * i jedno i drugie trzeba złapać. Nie `eval` ani `JSON.parse` — to jest cudzy
 * kod ze strony, a my potrzebujemy z niego wyłącznie par tekstowych.
 *
 * `setdefault`, nie nadpisywanie: przy powtórzonym identyfikatorze wygrywa
 * pierwsze wystąpienie, żeby wynik nie zależał od kolejności dwóch przebiegów.
 */
export function indeksTlumaczen(js: string): Map<string, string> {
  const indeks = new Map<string, string>();
  const dodaj = (klucz: string, zdanie: string) => {
    if (!indeks.has(klucz)) indeks.set(klucz, zdanie);
  };
  for (const m of js.matchAll(/"((?:[^"\\]|\\.)*)":"((?:[^"\\]|\\.)*)"/g)) dodaj(m[1]!, m[2]!);
  for (const m of js.matchAll(/([A-Za-z_][\w+\-]*):"((?:[^"\\]|\\.)*)"/g)) dodaj(m[1]!, m[2]!);
  return indeks;
}

/**
 * Zdanie dla identyfikatora, także wtedy, gdy kod i słownik różnią się listą
 * podstawień.
 *
 * Identyfikator w słowniku niesie nazwy podstawień (`msg_heal %gain_lost%
 * %name% %val%`), a kod potrafi wołać wariant z inną ich liczbą — stąd dopasowanie
 * po rdzeniu, czyli po fragmencie przed pierwszym `%`. Rdzeń pusty odrzucamy,
 * bo `" %val%"` zmatchowałby pierwszy lepszy wpis w słowniku.
 */
export function zdanieDlaIdentyfikatora(
  indeks: Map<string, string>,
  identyfikator: string,
): { identyfikator: string; zdanie: string } | null {
  const dokladne = indeks.get(identyfikator);
  if (dokladne !== undefined) return { identyfikator, zdanie: dokladne };

  const rdzen = identyfikator.split(" %")[0]!;
  if (rdzen === "") return null;
  for (const [wpis, zdanie] of indeks) {
    if (wpis === rdzen || wpis.startsWith(`${rdzen} %`)) return { identyfikator: wpis, zdanie };
  }
  return null;
}

/** Pełna tabela: każda etykieta renderera ze swoim zdaniem albo bez. */
export function tabela(bundle: string, slownik: string): Wpis[] {
  const indeks = indeksTlumaczen(slownik);
  return etykietyRenderera(cialoRenderera(bundle)).map(({ klucz, cialo }) => {
    for (const kandydat of identyfikatoryKandydujace(klucz, cialo)) {
      const trafienie = zdanieDlaIdentyfikatora(indeks, kandydat.trim());
      if (trafienie !== null) return { klucz, ...trafienie };
    }
    return { klucz, identyfikator: null, zdanie: null };
  });
}

/**
 * Dlaczego etykieta nie ma zdania. Trzy różne odpowiedzi, i zlanie ich w jedno
 * „brak" dałoby fałszywy negatyw — a ten w tym repo dwa razy zamknął temat.
 *
 * - `"nic"` — ciało puste, sam `break`. Gra świadomie nie wypisuje NICZEGO
 *   (`balloflight`, `chainlightning`, `active_decblock_per`). To jest odpowiedź.
 * - `"bez-zdania"` — ciało coś dokleja, ale nie przez słownik: samą liczbę
 *   (`+of_dmg`, `-thirdatt` → `<b class=…>` z wartością) albo tekst przysłany
 *   przez serwer (`txt`). Też odpowiedź, tyle że inna.
 * - `"luka"` — ciało woła `_t`, a my zdania nie znaleźliśmy. **Tylko to jest
 *   brakiem narzędzia** i tylko tego trzeba szukać.
 */
export type Werdykt = "nic" | "bez-zdania" | "luka";

export function werdykt(cialo: string): Werdykt {
  if (cialo.includes("_t(")) return "luka";
  return cialo.includes("+=") ? "bez-zdania" : "nic";
}

const OPIS_WERDYKTU: Record<Werdykt, string> = {
  nic: "gra tego nie wypisuje",
  "bez-zdania": "wypisuje bez zdania ze słownika (liczba albo tekst z serwera)",
  luka: "LUKA — ciało woła _t, zdania nie znaleziono",
};

/**
 * Pobranie z cache'em w `.cache/`. Wystawione, bo `tools/zrodla.ts` bierze
 * z tego samego katalogu i tym samym trybem (cache‑first, `--odswiez` omija) —
 * czwarta kopia tego samego `fetch` + `Bun.write` w `tools/` byłaby kosztem
 * bez powodu.
 */
export async function pobierz(
  adres: string,
  plikCache: string,
  odswiez: boolean,
): Promise<string> {
  const sciezka = `${CACHE}${plikCache}`;
  const plik = Bun.file(sciezka);
  if (!odswiez && (await plik.exists())) return plik.text();

  console.error(`pobieram ${adres} …`);
  const odpowiedz = await fetch(adres, { headers: { "User-Agent": "margometer-tools (bun)" } });
  if (!odpowiedz.ok) throw new Error(`${adres} → HTTP ${odpowiedz.status}`);
  const tresc = await odpowiedz.text();
  await Bun.write(sciezka, tresc);
  return tresc;
}

/**
 * Numer builda klienta z adresu bundla na stronie świata.
 *
 * Nazwa pliku niesie build (`main.min1785244275300.js`) i zmienia się przy
 * każdej aktualizacji gry, więc nie da się go wpisać na stałe. Ten sam numer
 * idzie potem do adresu słownika — gdyby się rozjechały, brzmienia byłyby
 * z dwóch różnych wersji gry.
 */
export function buildKlienta(html: string): string {
  const trafienie = html.match(/main\.min(\d+)\.js/);
  if (trafienie === null) throw new Error("nie znalazłem numeru builda na stronie świata");
  return trafienie[1]!;
}

/**
 * Zamrożona lista etykiet renderera — jedyny fakt o grze, który da się
 * sprawdzić bez sieci.
 *
 * PO CO. Dekoder protokołu (`src/protokol.ts`) musi wiedzieć o KAŻDYM kluczu,
 * który gra umie wysłać, bo nierozpoznany klucz to cicho niepoliczone obrażenia.
 * Korpus tekstowy na to pytanie nie odpowiada: ma zero linii `unknown`, co —
 * jak mówi `docs/ROADMAP.md` — „samo z siebie nie mówi nic o tym, czego parser
 * NIE rozpoznaje". Zbiór kluczy gry jest za to skończony i policzalny, więc
 * pokrycie da się DOMKNĄĆ, a nie tylko oszacować.
 *
 * DLACZEGO SAMA LISTA, A NIE ŹRÓDŁO. Wcommitowanie renderera odrzucone
 * w `docs/specy/2026-08-04-zrodla-klienta-z-buildu-deweloperskiego.md`: to cudzy,
 * zastrzeżony kod, na zawsze w historii gita. Lista nazw jest inną kategorią —
 * **naszym pomiarem gry, z datą i numerem builda**, dokładnie jak `clientBuild`
 * w `meta.json` przy fixture'ach.
 *
 * `milczy` oznacza etykiety z werdyktem `"nic"` — gra ma dla nich puste ciało
 * i świadomie nie wypisuje niczego. Dla dekodera to NIE jest luka, tylko
 * odpowiedź, i test pokrycia musi umieć te dwie rzeczy rozróżnić.
 *
 * NIESIE TEŻ IDENTYFIKATOR I SZABLON, od 2026‑08‑04. Powód: dodatek rozwiązuje
 * brzmienia w locie przez `window._t`, ale **listy kluczy z gry wyliczyć się
 * nie da** — `_dict` jest w produkcji domknięty w module. Mapa
 * `klucz → identyfikator` musi więc zostać w repo, a skoro i tak zostaje,
 * to szablon obok niej jest darmowy i pozwala testom obejść się bez
 * przeglądarki. Ten plik jest **plikiem źródłowym**, na którym stoi i dodatek,
 * i weryfikacja.
 */
/**
 * Gdzie `--zamroz` odkłada tabelę.
 *
 * ⚠️ Plik **nie istnieje od 2026‑08‑04** — `tests/fixtures/` zeszło z drzewa,
 * a razem z nim dwa testy pilnujące, że zaszyte u nas identyfikatory zgadzają
 * się z grą. Ścieżka zostaje, bo to jedyna droga powrotna: `--zamroz` odtworzy
 * plik, a testy trzeba będzie napisać od nowa (`AGENTS.md`).
 */
const ZAMROZENIE = new URL("../tests/fixtures/klucze-protokolu.json", import.meta.url).pathname;

export type WpisZamrozony = {
  klucz: string;
  /** Identyfikator `_t`, np. `msg_+rage %val%`. `null`, gdy zdania nie ma. */
  id: string | null;
  /** Szablon ze słownika gry, z podstawieniami `%val%`, `%name%`, `%hpp%`. */
  zdanie: string | null;
  /** Gra ma puste ciało i nie wypisuje NICZEGO — odpowiedź, nie luka. */
  milczy: boolean;
};

/**
 * Identyfikatory, których NIE MA wśród etykiet `case`, a bez których nie da się
 * złożyć zdania.
 *
 * `battleMsg` woła je poza `switch`em: rama ciosu („uderzył z siłą" /
 * „otrzymał N obrażeń"), rozstrzygnięcie walki i warianty DWUCZŁONOWE
 * DoT‑ów — te ostatnie mają inny identyfikator niż wariant z jedną wartością,
 * więc tabela `klucz → id` ich nie zna.
 *
 * Lista jest RĘCZNA i taka zostaje: to nie jest zbiór, który da się wyliczyć
 * z renderera, tylko te miejsca, w których czytaliśmy jego kod i widzieliśmy
 * wywołanie `_t`.
 *
 * ⚠️ **Brakujący identyfikator nie ma już kto zgłosić.** Do 2026‑08‑04 objawiał
 * się jako nieodtworzony komunikat w `tools/odtworz.ts` — narzędziu składającym
 * z tych ram zdania gry na potrzeby orakulum. Orakulum i `odtworz.ts` zeszły
 * z drzewa razem z parserem tekstu, więc luka w tej liście jest dziś cicha.
 * To jest koszt tamtej decyzji, nie przeoczenie.
 */
const RAMY = [
  "msg_dmgdone %name1% %hpp% %val%",
  "msg_dmgtaken %name1% %hpp% %val%",
  "winner_is %name% %posfix%",
  "winner_team_is %name% %posfix%",
  "loser_is %name% %posfix%",
  "loser_team_is %name% %posfix%",
  "battle_no_winner",
  "msg_poison %name% %val0% %val1%",
  "msg_wound_multi %name% %val0% %val1%",
  "msg_injure %name% %val0% %val1%",
  "msg_anguish %name% %hpp% %val0% %val1%",
  "part_gained",
  "part_lost",
] as const;

export type Zamrozenie = {
  build: string;
  swiat: string;
  zmierzone: string;
  metoda: string;
  klucze: WpisZamrozony[];
  /** Szablony spoza tabeli kluczy — patrz `RAMY`. `null` znaczy „gra tego nie zna". */
  ramy: Record<string, string | null>;
};

/**
 * Zamrożona tabela → słownik do użycia poza przeglądarką.
 *
 * Jedno miejsce, żeby testy i narzędzia budowały go tak samo; różnice
 * w składaniu (np. pominięcie `ramy`) dałyby ciche „nie znam identyfikatora",
 * a to w odtwarzaniu wygląda jak brak szablonu w grze.
 */
export function slownikZeZamrozenia(z: Zamrozenie): SlownikStaly {
  const wpisy: [string, string][] = [];
  for (const w of z.klucze) if (w.id !== null && w.zdanie !== null) wpisy.push([w.id, w.zdanie]);
  for (const [id, szablon] of Object.entries(z.ramy)) if (szablon !== null) wpisy.push([id, szablon]);
  return new SlownikStaly(wpisy);
}

/** Klucz protokołu → identyfikator `_t`, dla narzędzi odtwarzających zdania. */
export function identyfikatoryZeZamrozenia(z: Zamrozenie): Map<string, string | null> {
  return new Map(z.klucze.map((w) => [w.klucz, w.id]));
}

/** Same nazwy — wygodne tam, gdzie pytanie brzmi „czy wiemy o tym kluczu". */
export function nazwyKluczy(z: Zamrozenie): string[] {
  return z.klucze.map((w) => w.klucz);
}

export function zamrozenie(
  build: string,
  dzis: string,
  wpisy: Wpis[],
  ciala: Map<string, string>,
  indeks: Map<string, string> = new Map(),
): Zamrozenie {
  const klucze = [...wpisy]
    .sort((a, b) => (a.klucz < b.klucz ? -1 : a.klucz > b.klucz ? 1 : 0))
    .map((w) => ({
      klucz: w.klucz,
      id: w.identyfikator,
      zdanie: w.zdanie,
      milczy: w.zdanie === null && werdykt(ciala.get(w.klucz) ?? "") === "nic",
    }));
  const ramy: Record<string, string | null> = {};
  for (const id of RAMY) ramy[id] = indeks.get(id) ?? null;

  return {
    build,
    swiat: SWIAT,
    zmierzone: dzis,
    metoda: "bun tools/slownik.ts --zamroz",
    klucze,
    ramy,
  };
}

/** CLI za bramką, żeby dało się ten plik zaimportować — jak w `tools/pomoc.ts`. */
if (import.meta.main) {
  const argumenty = process.argv.slice(2);
  const odswiez = argumenty.includes("--odswiez");
  const braki = argumenty.includes("--braki");
  const zamroz = argumenty.includes("--zamroz");
  const gdzieKlucz = argumenty.indexOf("--klucz");
  const dokladnyKlucz = gdzieKlucz === -1 ? null : argumenty[gdzieKlucz + 1];
  if (gdzieKlucz !== -1) {
    if (dokladnyKlucz === undefined) throw new Error("--klucz wymaga wartości");
    argumenty.splice(gdzieKlucz, 2);
  }
  const frazy = argumenty.filter((a) => !a.startsWith("--"));

  const strona = await pobierz(
    `https://${SWIAT}.margonem.pl/`,
    `margonem-${SWIAT}.html`,
    odswiez,
  );
  const build = buildKlienta(strona);
  const bundle = await pobierz(
    `https://${SWIAT}.margonem.pl/js/main.min${build}.js`,
    `margonem-klient-${build}.js`,
    odswiez,
  );
  const slownik = await pobierz(SLOWNIK, `margonem-slownik-${build}.js`, odswiez);

  const cialo = cialoRenderera(bundle);
  const etykiety = new Map(etykietyRenderera(cialo).map((e) => [e.klucz, e.cialo]));
  const wszystkie = tabela(bundle, slownik);
  const zeZdaniem = wszystkie.filter((w) => w.zdanie !== null).length;

  console.error(
    `build ${build} — ${wszystkie.length} etykiet renderera, ${zeZdaniem} ze zdaniem\n`,
  );

  if (zamroz) {
    const dzis = new Date().toISOString().slice(0, 10);
    const zapis = zamrozenie(build, dzis, wszystkie, etykiety, indeksTlumaczen(slownik));
    await Bun.write(ZAMROZENIE, `${JSON.stringify(zapis, null, 2)}\n`);
    console.log(
      `zamrożono ${zapis.klucze.length} etykiet (${zapis.klucze.filter((w) => w.milczy).length} milczących, ${zapis.klucze.filter((w) => w.zdanie !== null).length} ze zdaniem) → ${ZAMROZENIE}`,
    );
    process.exit(0);
  }

  if (braki) {
    const bez = wszystkie.filter((w) => w.zdanie === null);
    for (const wpis of bez) {
      console.log(`${wpis.klucz.padEnd(24)} ${OPIS_WERDYKTU[werdykt(etykiety.get(wpis.klucz) ?? "")]}`);
    }
    const luki = bez.filter((w) => werdykt(etykiety.get(w.klucz) ?? "") === "luka").length;
    console.error(`\n${bez.length} bez zdania, w tym ${luki} do wyjaśnienia`);
    // Kod 1 tylko wtedy, gdy zostaje coś, czego narzędzie nie umie wyjaśnić —
    // „gra tego nie wypisuje" jest odpowiedzią i nie ma wywracać skryptu.
    process.exit(luki > 0 ? 1 : 0);
  }

  const pasuje = (wpis: Wpis): boolean => {
    if (dokladnyKlucz !== null && dokladnyKlucz !== undefined) return wpis.klucz === dokladnyKlucz;
    if (frazy.length === 0) return true;
    const stog = `${wpis.klucz} ${wpis.identyfikator ?? ""} ${wpis.zdanie ?? ""}`.toLowerCase();
    return frazy.some((f) => stog.includes(f.toLowerCase()));
  };

  const wybrane = wszystkie.filter(pasuje);
  for (const wpis of wybrane) {
    console.log(wpis.klucz);
    console.log(`  id:     ${wpis.identyfikator ?? "—"}`);
    console.log(
      `  zdanie: ${wpis.zdanie ?? `(${OPIS_WERDYKTU[werdykt(etykiety.get(wpis.klucz) ?? "")]})`}`,
    );
    console.log();
  }

  // Kod wyjścia jak w `tools/pomoc.ts`: brak trafienia jest ODPOWIEDZIĄ, ale
  // ma być rozpoznawalny dla skryptu, a nie tylko dla oka.
  process.exit(wybrane.length > 0 ? 0 : 1);
}
