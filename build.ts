/**
 * Buduje pojedynczy plik .user.js dla Tampermonkey.
 *
 * Tampermonkey nie ładuje modułów ES, więc wszystko musi wylądować w jednym
 * pliku IIFE z nagłówkiem metadanych na samej górze.
 */
import pkg from "./package.json" with { type: "json" };
import { KOMUNIKATY, SKLAD } from "./tests/walka-z-gry.ts";
import { banner } from "./tools/userscript-meta.ts";
import { META_FILE, USERSCRIPT_FILE, distPath } from "./tools/artifacts.ts";

const BANNER = banner(pkg.version, pkg.description, pkg.homepage);

const result = await Bun.build({
  entrypoints: ["./src/userscript.ts"],
  target: "browser",
  format: "iife",
  minify: false,
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

const [output] = result.outputs;
if (!output) throw new Error("build nie wyprodukował żadnego pliku");

const bundle = await output.text();

const path = distPath(USERSCRIPT_FILE);
await Bun.write(path, BANNER + bundle);
console.log(`zbudowano ${path}`);

// Sam nagłówek, bez bundle'a — to jego pobiera Tampermonkey, sprawdzając, czy
// jest nowa wersja (`@updateURL`). Bez tego pliku każde sprawdzenie ściągałoby
// cały skrypt po to, żeby przeczytać z niego jedną linię.
const metaPath = distPath(META_FILE);
await Bun.write(metaPath, BANNER);
console.log(`zbudowano ${metaPath}`);

/**
 * Strony podglądu: udawana gra + ten sam bundle co w Margonemie.
 *
 * ⚠️ **PRZEBUDOWANE 2026‑08‑04 i to jest zmiana kształtu.** Do tej pory podgląd
 * wstawiał zdania W DOM i dodatek czytał je stamtąd. Czytamy dziś
 * `Engine.battle.update`, więc podgląd musi udawać SILNIK: wystawia
 * `Engine.battle` ze składem i pustym `update`, czeka, aż dodatek je owinie,
 * i dopiero wtedy wpuszcza komunikaty.
 *
 * Zysk poza samą poprawnością: podgląd idzie odtąd DOKŁADNIE tą drogą co gra,
 * razem z owijaniem `update` i wyścigiem o podpięcie. Wcześniej omijał ją całą.
 */
function page(title: string, seed: string): string {
  return `<!doctype html>
<meta charset="utf-8">
<title>MargoMeter — ${title}</title>
<style>
  html, body { margin: 0; min-height: 100vh; background: #101014; }
</style>
<script>${seed}</script>
<script>${bundle}</script>
`;
}

/**
 * Seed udający grę: skład w `Engine.battle.warriors`, a komunikaty puszczone
 * z opóźnieniem — dodatek szuka `Engine` co sekundę, więc musi zdążyć owinąć
 * `update`, zanim cokolwiek przez nie przejdzie.
 *
 * ⚠️ Materiał brał się do 2026‑08‑04 z pliku danych obok testów. Ta sama walka
 * leży dziś w kodzie, w `tests/walka-z-gry.ts`, i to jedyne miejsce w repo,
 * w którym została.
 */
function udawanaGra(): string {
  // `warriors` w kształcie, jakiego oczekuje `roster.ts`: mapa po `id`.
  const warriors = Object.fromEntries(
    SKLAD.map((w) => [
      String(w.id),
      { id: w.id, name: w.name, team: w.side === 0 ? 1 : 2, prof: w.prof, lvl: w.lvl },
    ]),
  );
  return `
(() => {
  const warriors = ${JSON.stringify(warriors)};
  window.Engine = { battle: { warriors, myteam: 1, update: () => {} } };
  const m = ${JSON.stringify(KOMUNIKATY).replace(/<\//g, "<\\/")};
  // Dwie sekundy: pętla \`boot\` tyka co 1000 ms, więc jedno tyknięcie na pewno
  // zdąży owinąć \`update\`. Bez tego podgląd pokazywałby pusty panel.
  setTimeout(() => window.Engine.battle.update({ m }), 2000);
})();
`;
}

await Bun.write("./dist/preview.html", page("podgląd", udawanaGra()));
console.log("zbudowano ./dist/preview.html");

/**
 * ⚠️ **`preview-20.html` ZNIKŁ 2026‑08‑04.** Pokazywał układ listy przy pełnym
 * składzie — dwudziestu postaciach z rozstrzelonymi liczbami — i brał je
 * z `tools/synthetic-log.ts`, który składał ZDANIA gry. Generator oddaje dziś
 * `BattleEvent[]` (testy panelu stoją na nim dalej), a podgląd idzie przez
 * udawany silnik, więc potrzebowałby syntetycznych KOMUNIKATÓW protokołu.
 * Napisanie ich to osobna robota: trzeba zakodować klucze krytyka, bloku,
 * proców i leczenia tak, jak robi to gra — a zgadnięcie choćby jednego dałoby
 * podgląd, który wygląda poprawnie i kłamie.
 *
 * Do zrobienia razem z drugim zrzutem protokołu z walki grupowej.
 */

/**
 * Podgląd archiwum: nagrania wstawione prosto do localStorage, zanim wystartuje
 * bundle. Bez tego okno archiwum dałoby się obejrzeć dopiero po rozegraniu
 * kilku walk w grze.
 *
 * Nagrania są dziś w formacie `v: 2` — komunikaty protokołu plus skład. Mamy
 * JEDEN zrzut, więc cztery wiersze to ta sama walka przycięta na różnych
 * długościach: lista ma pokazać różne godziny, tury i kwoty, a nie różne walki.
 */
const seedArchiwum = (() => {
  const sklad = SKLAD.map((w) => ({ ...w }));
  const nagrania = [4, 8, 12, KOMUNIKATY.length].map((ile) => ({
    komunikaty: KOMUNIKATY.slice(0, ile),
    sklad,
  }));
  return `
(() => {
  // "</" rozbite na dwa znaki: parser HTML kończy <script> na pierwszym
  // "</script>" W TREŚCI, a escapowanie JSON-a samo tego nie neutralizuje.
  const nagrania = ${JSON.stringify(nagrania).replace(/<\//g, "<\\/")};
  const now = Date.now();
  const fights = nagrania.map((nagranie, i) => {
    const tresc = JSON.stringify(nagranie);
    localStorage.setItem("margometer.rec." + (i + 1), tresc);
    const strona = (side) => nagranie.sklad.filter((w) => w.side === side).map((w) => w.name);
    const skrot = (n) => (n.length <= 2 ? n.join(", ") : n[0] + ", " + n[1] + " +" + (n.length - 2));
    return {
      id: i + 1,
      title: skrot(strona(0)) + " vs " + skrot(strona(1)),
      chars: tresc.length,
      // Walki co kwadrans wstecz — lista ma pokazać różne godziny.
      at: now - (nagrania.length - i) * 15 * 60 * 1000,
    };
  });
  localStorage.setItem("margometer.rec.index", JSON.stringify({ v: 2, next: nagrania.length + 1, fights }));
  localStorage.setItem("margometer.archive", JSON.stringify({ x: 300, y: 16, open: true }));
})();
`;
})();

await Bun.write(
  "./dist/preview-archive.html",
  page("podgląd — archiwum", seedArchiwum + udawanaGra()),
);
console.log("zbudowano ./dist/preview-archive.html");
