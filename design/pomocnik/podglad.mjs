/**
 * One scrolling page out of the same artboards — for somebody who only wants to look.
 * Skips an artboard that has not been generated yet, so it is runnable mid-round.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { CSS } from "./pomocnik.mjs";

const order = JSON.parse(readFileSync("canvas.json", "utf8")).artboards
    .filter(({ file }) => existsSync(file));

function getBody(file) {
    const source = readFileSync(file, "utf8");
    const opened = source.indexOf("<x-dc>") + "<x-dc>".length;
    const closed = source.indexOf("</x-dc>");
    const inner = source.slice(opened, closed);
    const afterHelmet = inner.indexOf("</helmet>");
    return inner.slice(afterHelmet + "</helmet>".length).trim();
}

const sections = order.map(({ file, title }, at) =>
    `<section id="a${at}"><div class="mark">${title}</div>` +
    `<div class="board">${getBody(file)}</div></section>`
).join("\n");

const contents = order.map(({ title }, at) => `<li><a href="#a${at}">${title}</a></li>`).join("");

writeFileSync(
    "margometer-pomocnik-podglad.html",
    `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MargoMeter — Pomocnik w walce</title>
<style>
${CSS}
html{background:#e9e5dc;}
body{margin:0;}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px 80px;}
.intro{padding:56px 0 34px;}
.intro .tag{margin-bottom:10px;}
.intro h1{font-size:34px;margin:0;}
.intro p{max-width:64ch;}
.toc{margin:26px 0 0;padding:0;list-style:none;display:grid;
  grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:4px 22px;}
.toc a{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:11.5px;
  text-decoration:none;border-bottom:1px solid #d9d5cc;padding:3px 0;display:block;}
.toc a:hover{border-bottom-color:#a8600b;}
section{margin-top:34px;}
.mark{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:#8a8478;padding:0 0 7px;}
.board{border:1px solid #d9d5cc;overflow:hidden;}
.board .sheet{min-height:0;}
</style>
</head>
<body>
<div class="wrap">
<div class="intro">
  <div class="tag"><span class="dot"></span>MargoMeter · makiety</div>
  <h1>Pomocnik w walce</h1>
  <p class="lede">Jedno okno obok panelu: co teraz stoi, na kim i od kiedy. Czternaście makiet
  w skali 1:1 — wszystkie kolory, wysokości wierszy i odstępy są wzięte wprost z
  <span class="m">src/ui/panel-look.ts</span>, a każda liczba na arkuszach jest odczytem
  z <span class="m">captures/</span> przez <span class="m">measure.mjs</span>.</p>
  <ul class="toc">${contents}</ul>
</div>
${sections}
</div>
</body>
</html>
`,
);
console.log(`podglad: ${order.length} arkuszy`);
