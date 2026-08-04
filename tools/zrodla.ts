/**
 * Oryginalne źródła klienta gry, odzyskane z buildu deweloperskiego.
 *
 * PO CO TO ISTNIEJE, skoro jest `tools/slownik.ts`. Bo tamten czyta klienta
 * PRODUKCYJNEGO, a ten jest zminifikowany — nazwy zmiennych zniknęły, komentarze
 * zniknęły, a ciało renderera trzeba stamtąd wycinać dopasowywaniem klamr
 * (`cialoRenderera`). Działa, ale to heurystyka: `indexOf("this.battleMsg=function")`
 * przewraca się przy każdej zmianie kształtu minifikatu.
 *
 * SKĄD SIĘ BIERZE. `experimental.margonem.pl` serwuje build **deweloperski**
 * webpacka: bundle jest nieskompresowany, a każdy moduł kończy się inline'owym
 * source mapem z pełnym `sourcesContent`. To znaczy, że w pobranym pliku leży
 * oryginalne drzewo źródeł klienta — z komentarzami autorów, `require('@core/…')`
 * i nazwami zmiennych. Repo nie potrzebuje z tego kodu do uruchomienia; potrzebuje
 * POWODÓW, których zminifikowany bundle nie niesie.
 *
 * CZEGO TO NIE MÓWI. Że tak działa gra DZIŚ. Build deweloperski jest starszy od
 * produkcyjnego (2026‑06‑16 vs 2026‑07‑28 przy pierwszym pomiarze) i nikt nie
 * obiecuje, że zostanie odświeżony ani że w ogóle zostanie. Wyrocznią brzmień
 * pozostaje produkcja i `tools/slownik.ts`; ten plik daje strukturę i powody.
 * Rozjazd między jednym a drugim mierzy `--roznica` i to jest jego główne zadanie
 * — nie ciekawostka, tylko czujka.
 *
 * GDZIE LĄDUJE. W `.cache/`, poza gitem. To jest cudzy, zastrzeżony kod; repo
 * trzyma narzędzie i cytat z datą pomiaru, nie 5,8 MB czyjegoś drzewa źródeł.
 *
 * Użycie:
 *   bun tools/zrodla.ts                      # pobierz i rozpakuj
 *   bun tools/zrodla.ts --lista battle       # ścieżki modułów pasujące do frazy
 *   bun tools/zrodla.ts --pokaz core/battle/BattleMessages.js
 *   bun tools/zrodla.ts --roznica            # klucze `case`: dev vs produkcja
 *   bun tools/zrodla.ts --odswiez            # pobierz na nowo
 */

import { buildKlienta, cialoRenderera, pobierz } from "./slownik.ts";

const CACHE = new URL("../.cache/", import.meta.url).pathname;

/**
 * Host z buildem deweloperskim.
 *
 * Nie jest to „świat" w sensie listy światów gry — nie ma tu graczy ani walk do
 * pobrania, jest sam serwowany klient. Dlatego whitelista światów go nie
 * obejmuje i obejmować nie musi.
 */
const HOST = "experimental.margonem.pl";

/**
 * Świat produkcyjny do porównania w `--roznica`. Ten sam, co w `tools/slownik.ts`
 * — porównanie ma być z tym klientem, z którego repo bierze brzmienia zdań.
 */
const SWIAT_PRODUKCYJNY = "tempest";

/**
 * Moduły wydobyte z bundla: ścieżka źródłowa → oryginalna treść pliku.
 *
 * Webpack w trybie deweloperskim pakuje każdy moduł w `eval("…")` i dokleja na
 * końcu `//# sourceMappingURL=data:…;base64,…`. W tej mapie siedzi `sources`
 * (ścieżka w drzewie autorów) i `sourcesContent` (treść przed transpilacją).
 * Bierzemy oba i to jest cała sztuczka — nie ma tu odtwarzania niczego,
 * jest odpakowanie tego, co gra sama wysłała.
 *
 * Ścieżka przychodzi jako `webpack:///./src/js/…/Plik.js?668d`. Prefiks i sufiks
 * obcinamy: pierwszy jest protokołem webpacka, drugi skrótem, który zmienia się
 * między buildami i rozbiłby porównania ścieżka po ścieżce.
 */
export function mapyModulow(bundle: string): Map<string, string> {
  // `charset=utf-8` jest w tym kształcie ZAWSZE (647/647 modułów, pomiar
  // 2026‑08‑04) i wąski wzorzec jest tu celowy — szeroki złapałby kiedyś mapę
  // z innego narzędzia i wsypał ją do drzewa gry po cichu.
  const wzorzec = /sourceMappingURL=data:application\/json;charset=utf-8;base64,([A-Za-z0-9+/=]+)/g;
  const zrodla = new Map<string, string>();

  for (const trafienie of bundle.matchAll(wzorzec)) {
    // `Buffer`, nie `atob`: to drugie oddaje ciąg BAJTÓW, więc każdy polski znak
    // w komentarzu autorów gry rozpadłby się na dwa krzaki. Zauważone testem —
    // syntetyczny moduł z „ktoś" w treści nie przechodził.
    const mapa = JSON.parse(Buffer.from(trafienie[1]!, "base64").toString("utf8")) as {
      sources?: unknown;
      sourcesContent?: unknown;
    };
    // Cudzy JSON wchodzi jako `unknown` i jest zawężany, wzór z `src/roster.ts`.
    const sciezki = Array.isArray(mapa.sources) ? mapa.sources : [];
    const tresci = Array.isArray(mapa.sourcesContent) ? mapa.sourcesContent : [];

    for (const [i, sciezka] of sciezki.entries()) {
      const tresc = tresci[i];
      if (typeof sciezka !== "string" || typeof tresc !== "string") continue;
      zrodla.set(sciezka.replace(/^webpack:\/\/\//, "").replace(/\?[0-9a-f]+$/, ""), tresc);
    }
  }

  // Zero trafień to NIE jest puste drzewo — to znaczy, że gra przestała serwować
  // build deweloperski (albo przestała dokładać mapy) i całe narzędzie mówi od
  // teraz nieprawdę. Ciche puste wyjście zamieniłoby to w „nic nie znalazłem",
  // czyli w odpowiedź. Ma być głośne, jak `{kind: "unknown"}` w parserze.
  if (zrodla.size === 0) {
    throw new Error(
      `nie znalazłem ani jednego source mapa w bundlu — ${HOST} przestał serwować ` +
        "build deweloperski albo zmienił jego kształt. To nie jest błąd sieci: plik się pobrał.",
    );
  }

  return zrodla;
}

/**
 * Ścieżka bezpieczna do zapisu pod `katalog`, albo `null`.
 *
 * Wejście pochodzi z pliku pobranego z cudzego serwera, więc `../../` w polu
 * `sources` zapisałoby plik poza katalogiem docelowym — to jest zip‑slip.
 * Dziś żadna ścieżka w bundlu tak nie wygląda; sprawdzenie jest po to, żeby
 * jutro też nie miało znaczenia, jak wygląda.
 */
export function sciezkaDocelowa(katalog: string, sciezkaZrodla: string): string | null {
  if (sciezkaZrodla.startsWith("/")) return null;
  const czlony = sciezkaZrodla.split("/").filter((c) => c !== "" && c !== ".");
  if (czlony.some((c) => c === "..")) return null;
  if (czlony.length === 0) return null;
  return `${katalog.replace(/\/$/, "")}/${czlony.join("/")}`;
}

/** Zapis drzewa na dysk. Zwraca liczbę zapisanych plików. */
export async function rozpakuj(zrodla: Map<string, string>, katalog: string): Promise<number> {
  let zapisane = 0;
  for (const [sciezka, tresc] of zrodla) {
    const cel = sciezkaDocelowa(katalog, sciezka);
    if (cel === null) {
      console.error(`pomijam podejrzaną ścieżkę: ${sciezka}`);
      continue;
    }
    await Bun.write(cel, tresc);
    zapisane += 1;
  }
  return zapisane;
}

/** Zbiór kluczy `case "…":` z dowolnego kawałka JS-a. */
export function kluczeCase(js: string): Set<string> {
  // `\s*` po `case`, bo minifikat pisze `case"winner":`, a źródło `case 'winner':`.
  return new Set([...js.matchAll(/case\s*["']([^"']*)["']\s*:/g)].map((t) => t[1]!));
}

/**
 * Rozjazd między buildem deweloperskim a produkcyjnym, liczony na kluczach
 * protokołu.
 *
 * Po co: build dev jest starszy i to jest jedyna rzecz, która może po cichu
 * unieważnić każde zdanie zacytowane ze źródeł. Niepusty wynik nie znaczy „coś
 * jest zepsute" — znaczy „gra ruszyła renderer, sprawdź, czy cytat w specu
 * jeszcze stoi".
 */
export function roznicaKluczy(
  zrodloDev: string,
  cialoProdukcji: string,
): { tylkoDev: string[]; tylkoProdukcja: string[] } {
  const dev = kluczeCase(zrodloDev);
  const produkcja = kluczeCase(cialoProdukcji);
  return {
    tylkoDev: [...dev].filter((k) => !produkcja.has(k)),
    tylkoProdukcja: [...produkcja].filter((k) => !dev.has(k)),
  };
}

/** Ścieżka renderera w drzewie źródeł — jedyny plik, którego to narzędzie szuka po nazwie. */
const RENDERER = "./src/js/Margonem/core/battle/BattleMessages.js";

/** CLI za bramką, żeby dało się ten plik zaimportować — jak w `tools/pomoc.ts`. */
if (import.meta.main) {
  const argumenty = process.argv.slice(2);
  const odswiez = argumenty.includes("--odswiez");
  const roznica = argumenty.includes("--roznica");
  const gdzieLista = argumenty.indexOf("--lista");
  const gdziePokaz = argumenty.indexOf("--pokaz");
  // `--lista` bez frazy wypisuje całe drzewo; kolejna flaga za nim nie jest
  // frazą, bo `--lista --odswiez` dałoby zero trafień zamiast pełnej listy.
  const poLiscie = argumenty[gdzieLista + 1];
  const fraza =
    gdzieLista === -1 ? null : poLiscie === undefined || poLiscie.startsWith("--") ? "" : poLiscie;
  const doPokazania = gdziePokaz === -1 ? null : argumenty[gdziePokaz + 1];
  if (gdziePokaz !== -1 && doPokazania === undefined) throw new Error("--pokaz wymaga ścieżki");

  const strona = await pobierz(`https://${HOST}/`, `margonem-${HOST}.html`, odswiez);
  const build = buildKlienta(strona);
  const bundle = await pobierz(
    `https://${HOST}/js/main.min${build}.js`,
    `margonem-dev-${build}.js`,
    odswiez,
  );

  const zrodla = mapyModulow(bundle);
  const znakow = [...zrodla.values()].reduce((suma, t) => suma + t.length, 0);
  console.error(
    `build ${build} (${HOST}) — ${zrodla.size} modułów, ${(znakow / 1048576).toFixed(1)} MB źródeł\n`,
  );

  if (fraza !== null) {
    const pasujace = [...zrodla.keys()].filter((s) => s.toLowerCase().includes(fraza.toLowerCase()));
    for (const sciezka of pasujace.sort()) {
      console.log(`${String(zrodla.get(sciezka)!.length).padStart(7)}  ${sciezka}`);
    }
    console.error(`\n${pasujace.length} z ${zrodla.size}`);
    process.exit(pasujace.length > 0 ? 0 : 1);
  }

  if (doPokazania !== null && doPokazania !== undefined) {
    // Dopasowanie po końcówce, żeby nie trzeba było przepisywać `./src/js/Margonem/`.
    const trafienia = [...zrodla.keys()].filter((s) => s.endsWith(doPokazania));
    if (trafienia.length !== 1) {
      console.error(
        trafienia.length === 0
          ? `nie ma modułu kończącego się na „${doPokazania}"`
          : `„${doPokazania}" pasuje do ${trafienia.length} modułów:\n  ${trafienia.join("\n  ")}`,
      );
      process.exit(1);
    }
    console.log(zrodla.get(trafienia[0]!)!);
    process.exit(0);
  }

  if (roznica) {
    const zrodloRenderera = zrodla.get(RENDERER);
    if (zrodloRenderera === undefined) {
      throw new Error(`nie ma ${RENDERER} w drzewie — renderer zmienił ścieżkę`);
    }
    // Po stronie produkcji trzeba nadal wycinać klamrami: tam nie ma map.
    // Po stronie dev `cialoRenderera` NIE zadziała i to nie jest błąd — źródło
    // pisze `this.battleMsg = function` ze spacjami, a całość siedzi w `eval`.
    const stronaProd = await pobierz(
      `https://${SWIAT_PRODUKCYJNY}.margonem.pl/`,
      `margonem-${SWIAT_PRODUKCYJNY}.html`,
      odswiez,
    );
    const buildProd = buildKlienta(stronaProd);
    const bundleProd = await pobierz(
      `https://${SWIAT_PRODUKCYJNY}.margonem.pl/js/main.min${buildProd}.js`,
      `margonem-klient-${buildProd}.js`,
      odswiez,
    );
    const { tylkoDev, tylkoProdukcja } = roznicaKluczy(
      zrodloRenderera,
      cialoRenderera(bundleProd),
    );

    console.log(`dev ${build} vs produkcja ${buildProd} (${SWIAT_PRODUKCYJNY})`);
    console.log(`  tylko dev:       ${tylkoDev.join(", ") || "—"}`);
    console.log(`  tylko produkcja: ${tylkoProdukcja.join(", ") || "—"}`);

    // Kod 1 przy JAKIEJKOLWIEK różnicy. Odwrotnie niż w `tools/slownik.ts`, gdzie
    // brak trafienia bywa odpowiedzią: tutaj różnica zawsze znaczy, że cytaty ze
    // źródeł trzeba przejrzeć, i ma być rozpoznawalna dla skryptu, nie tylko dla oka.
    process.exit(tylkoDev.length + tylkoProdukcja.length > 0 ? 1 : 0);
  }

  const katalog = `${CACHE}margonem-zrodla-${build}`;
  const zapisane = await rozpakuj(zrodla, katalog);
  console.log(`${zapisane} plików → ${katalog}`);
  process.exit(zapisane === zrodla.size ? 0 : 1);
}
