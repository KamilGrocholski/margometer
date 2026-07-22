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
  body { margin: 0; background: #0d0d10; color: #8c8c85; font: 12px/1.5 ui-monospace, monospace; }
  #log { padding: 16px; max-width: 620px; white-space: pre-wrap; }
</style>
<div id="log">${escaped
    .split("\n")
    .map((line) => `<div>${line}</div>`)
    .join("\n")}</div>
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
