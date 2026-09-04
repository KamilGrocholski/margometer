/**
 * Every artboard as a PNG at its own frame size, so a sheet can be looked at before it is
 * committed — `DESIGN.md`, _The Frame Is Not A Screen Rule_. Name files to shoot only those.
 */
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
const only = process.argv.slice(2);
const canvas = JSON.parse(readFileSync("canvas.json", "utf8"));
const browser = await chromium.launch({ channel: "chrome" });
for (const board of canvas.artboards) {
    if (only.length > 0 && !only.includes(board.file)) continue;
    const source = readFileSync(board.file, "utf8");
    const inner = source.slice(source.indexOf("<x-dc>") + 6, source.indexOf("</x-dc>"));
    const styled = inner.slice(inner.indexOf("<style>"), inner.indexOf("</helmet>"));
    const body = inner.slice(inner.indexOf("</helmet>") + 9);
    const page = await browser.newPage({
        viewport: { width: board.w, height: board.h },
        deviceScaleFactor: 1.6,
    });
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8">${styled}` +
        `</head><body style="margin:0">${body}</body></html>`);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `/tmp/shot-${board.file.replace(".dc.html", "")}.png` });
    await page.close();
}
await browser.close();
console.log("ok");
