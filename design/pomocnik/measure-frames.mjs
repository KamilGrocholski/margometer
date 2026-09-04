/**
 * What each artboard actually needs, measured in the browser rather than guessed — a canvas frame
 * neither scales nor crops, so a frame short of its sheet clips it with no warning.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const canvas = JSON.parse(readFileSync("canvas.json", "utf8"));
const browser = await chromium.launch({ channel: "chrome" });
const measured = [];

for (const board of canvas.artboards) {
    const source = readFileSync(board.file, "utf8");
    const opened = source.indexOf("<x-dc>") + "<x-dc>".length;
    const inner = source.slice(opened, source.indexOf("</x-dc>"));
    const styled = inner.slice(inner.indexOf("<style>"), inner.indexOf("</helmet>"));
    const body = inner.slice(inner.indexOf("</helmet>") + "</helmet>".length);
    const page = await browser.newPage({ viewport: { width: board.w, height: 600 } });
    await page.setContent(
        `<!doctype html><html><head><meta charset="utf-8">${styled}</head><body style="margin:0">` +
            `${body}</body></html>`,
    );
    await page.waitForTimeout(400);
    const height = await page.evaluate(() => document.body.scrollHeight);
    const overflow = await page.evaluate(() => document.body.scrollWidth);
    measured.push({ file: board.file, w: board.w, wanted: height, scrollWidth: overflow });
    await page.close();
}

await browser.close();

/** Ten pixels of air, so a font the machine renders a shade taller does not clip the last line. */
const AIR = 10;
/** The canvas asks for at least 80px between frames in a row and 120px between rows. */
const GAP_ACROSS = 100;
const GAP_DOWN = 130;
/** Which sheets stand together, in the order the brief reads them. */
const ROWS = [
    ["Main.dc.html", "Roznice.dc.html"],
    ["Czas.dc.html", "WieleRzutow.dc.html", "Wiersz.dc.html"],
    ["Pojedynek.dc.html", "Kolos.dc.html", "Ustawka.dc.html"],
    ["Pancerz.dc.html", "Stany.dc.html", "Ratunek.dc.html"],
    ["Obserwuje.dc.html", "Kolejka.dc.html", "Odmowy.dc.html"],
];

const byFile = new Map(canvas.artboards.map((board) => [board.file, board]));
const rowTop = [];
let top = 0;
for (const row of ROWS) {
    rowTop.push(top);
    let left = 0;
    let tallest = 0;
    for (const file of row) {
        const board = byFile.get(file);
        const held = measured.find((entry) => entry.file === file);
        board.h = Math.ceil((held.wanted + AIR) / 10) * 10;
        board.x = left;
        board.y = top;
        left += board.w + GAP_ACROSS;
        tallest = Math.max(tallest, board.h);
    }
    top += tallest + GAP_DOWN;
}
canvas.artboards = ROWS.flat().map((file) => byFile.get(file));

/** A note beside a row travels with it. */
const NOTE_ROW = { "rzad-czas": 1, "rzad-ksztalty": 2 };
const widest = Math.max(
    ...canvas.artboards.map((board) => board.x + board.w),
);
for (const annotation of canvas.annotations) {
    const at = NOTE_ROW[annotation.id];
    if (at === undefined) continue;
    annotation.y = rowTop[at];
    annotation.x = widest + GAP_ACROSS;
}

writeFileSync("canvas.json", `${JSON.stringify(canvas, null, 2)}\n`);
for (const row of measured) {
    const wide = row.scrollWidth > row.w ? ` ⚠ szerokość ${row.scrollWidth}` : "";
    console.log(`${row.file.padEnd(22)} ${row.w} × ${row.wanted}${wide}`);
}
