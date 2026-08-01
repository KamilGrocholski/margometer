/**
 * Nazwy plików wydania — jedno miejsce.
 *
 * Te dwie nazwy występują w PIĘCIU: w `@downloadURL`/`@updateURL` w nagłówku,
 * w `build.ts` (co zapisać), w stopce treści wydania (co kliknąć), w liście
 * assetów w `release.yml` i w linku instalacyjnym w `README.md`. Rozjazd
 * którejkolwiek pary jest cichy i kosztowny: nagłówek wskazywałby plik, którego
 * wydanie nie zawiera, i aktualizacje po prostu przestałyby przychodzić.
 *
 * Trzy z tych miejsc importują stąd. Dwóch pozostałych — YAML-a i prozy — nie
 * da się, więc pilnuje ich `tests/artifacts.test.ts`: czyta workflow i README
 * i sprawdza, że mówią o tych samych plikach. Niezmiennik zamiast dyscypliny.
 */

export const USERSCRIPT_FILE = "margometer.user.js";
/**
 * Sam nagłówek, bez bundle'a — po ten plik sięga Tampermonkey, sprawdzając
 * wersję. Dla człowieka jest bezużyteczny i dlatego stopka wydania mówi wprost,
 * żeby go nie klikać: na stronie wydania wygląda jak drugi skrypt do instalacji.
 */
export const META_FILE = "margometer.meta.js";

/** Katalog wyjściowy builda. Poza repozytorium — patrz `.gitignore`. */
export const DIST_DIR = "./dist";

export const distPath = (file: string): string => `${DIST_DIR}/${file}`;
