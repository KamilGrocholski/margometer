/**
 * Buduje pojedynczy plik .user.js dla Tampermonkey.
 *
 * Tampermonkey nie ładuje modułów ES, więc wszystko musi wylądować w jednym
 * pliku IIFE z nagłówkiem metadanych na samej górze.
 */
import { syntheticFight } from "./tools/synthetic-log.ts";

const BANNER = `// ==UserScript==
// @name         MargoMeter
// @namespace    https://github.com/margometer
// @version      0.1.0
// @description  Licznik obrażeń do Margonem — statystyki z okna walki
// @author       kamil
// @match        https://*.margonem.pl/*
// @match        https://*.margonem.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
`;

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

const path = "./dist/margometer.user.js";
await Bun.write(path, BANNER + bundle);
console.log(`zbudowano ${path}`);

// Strony podglądu: log w DOM + ten sam bundle co w grze. Pozwalają obejrzeć
// overlay bez wchodzenia do Margonema.
function page(title: string, log: string): string {
  const escaped = log.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<!doctype html>
<meta charset="utf-8">
<title>MargoMeter — ${title}</title>
<style>
  html, body { margin: 0; min-height: 100vh; }
  body {
    /* Neutralne, ciemne tło jak kadr z gry — nakładka ma się na nim wybijać. */
    background: radial-gradient(130% 100% at 50% -10%, #20202a 0%, #101015 55%, #0b0b0e 100%);
    color: #8c8c85;
    font: 12px/1.5 ui-monospace, monospace;
  }
  /* Surowy log jest ukryty pod screeny — overlay czyta go z DOM mimo
     display:none (findBattleLog patrzy na textContent, nie na widoczność).
     Przycisk w rogu odsłania go do podejrzenia. */
  #log {
    display: none;
    position: fixed; right: 12px; bottom: 46px; z-index: 3;
    width: min(440px, 46vw); max-height: 66vh; overflow: auto;
    padding: 12px; white-space: pre-wrap;
    background: rgba(8, 8, 10, 0.92); border: 1px solid #2c2c33; border-radius: 8px;
  }
  body.show-log #log { display: block; }
  #log-toggle {
    position: fixed; right: 12px; bottom: 12px; z-index: 4;
    padding: 5px 10px; cursor: pointer; opacity: 0.5;
    font: 11px/1 ui-sans-serif, system-ui, sans-serif;
    color: #cfcfca; background: #1b1b22; border: 1px solid #35353b; border-radius: 6px;
  }
  #log-toggle:hover { opacity: 1; }
</style>
<div id="log">${escaped
    .split("\n")
    .map((line) => `<div>${line}</div>`)
    .join("\n")}</div>
<button id="log-toggle" onclick="document.body.classList.toggle('show-log')">log</button>
<script>${bundle}</script>
`;
}

// Walka pvp z nazwami umiejętności — rozbicie w dymku ma co pokazać.
const FIXTURE =
  "./tests/fixtures/new-engine/2026-07-18_tancerz-vs-tropiciel-umiejetnosci/raw.txt";
await Bun.write("./dist/preview.html", page("podgląd", await Bun.file(FIXTURE).text()));
console.log("zbudowano ./dist/preview.html");

await Bun.write("./dist/preview-20.html", page("podgląd — 20 postaci", syntheticFight(20)));
console.log("zbudowano ./dist/preview-20.html");
