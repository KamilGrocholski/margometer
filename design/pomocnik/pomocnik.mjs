/**
 * The Pomocnik window, drawn 1:1 on the panel's own tokens. Everything the sheets share that
 * `../shared.mjs` does not already carry lives here — the window is new, the panel beside it is not.
 *
 * One idea runs through every row: what was counted is solid, what the skill table merely states is
 * hatched. `docs/auras-standing.md` is why — the protocol never says an effect ended.
 */
import { CSS as PANEL_CSS } from "../shared.mjs";

/** Verbatim from `src/ui/panel-look.ts`; a value typed twice is a value that drifts. */
export const TOKEN = {
    surface: "#17171c",
    surfaceRaised: "#1f1f26",
    track: "#24242a",
    border: "#2c2c35",
    text: "#e7e7ea",
    quiet: "#9a9aa6",
    ours: "#6fbf8b",
    theirs: "#e0736f",
    suspect: "#c98500",
    unknown: "#8a8a80",
    rowHeight: "18px",
    barTint: 0.55,
};

export const CSS = `${PANEL_CSS}
/* ---- the Pomocnik window, values from src/ui/panel-look.ts ---- */
.pw{display:flex;flex-direction:column;}
.pw-bar{display:flex;align-items:center;gap:5px;padding:4px 8px;
  font:11px/13px system-ui,sans-serif;letter-spacing:.06em;color:${TOKEN.quiet};
  background:${TOKEN.surfaceRaised};border:1px solid ${TOKEN.border};border-bottom:none;
  border-radius:8px 8px 0 0;white-space:nowrap;}
.pw-bar .grip{opacity:.7;}
.pw-bar .ctl{margin-left:auto;display:flex;gap:5px;}
.pw-body{background:${TOKEN.surface};border:1px solid ${TOKEN.border};border-radius:0 0 8px 8px;
  font:11px/15px system-ui,sans-serif;color:${TOKEN.text};padding:5px 7px;}
.pw-sec{display:flex;justify-content:space-between;align-items:baseline;color:#868691;
  letter-spacing:.08em;font-size:10px;padding:4px 2px 2px;}
.pw-sec .n{font-variant-numeric:tabular-nums;}
.pw-row{position:relative;display:flex;justify-content:space-between;align-items:center;
  height:18px;padding:1px 7px 0;margin-bottom:2px;border-radius:3px;background:${TOKEN.track};
  overflow:hidden;}
.pw-name{position:relative;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;
  white-space:nowrap;}
.pw-val{position:relative;flex:none;padding-left:8px;font-weight:600;
  font-variant-numeric:tabular-nums;white-space:nowrap;}
.pw-val .of{font-weight:400;color:${TOKEN.quiet};}
.pw-fill{position:absolute;left:0;top:0;bottom:0;}
.pw-rest{position:absolute;top:0;bottom:0;}
.pw-cap{position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:3px 0 0 3px;}
.pw-mark{position:relative;flex:none;color:${TOKEN.suspect};padding-right:5px;}
.pw-note{color:${TOKEN.quiet};padding:1px 2px 3px;}
.pw-off{color:#6b6b75;}

/* A watched thing nobody is under: the heading stays, the rows do not. */
.pw-none{color:#6b6b75;padding:1px 2px 3px;}

/* The sheet's own legend, outside the window. */
.leg{display:flex;flex-direction:column;gap:7px;width:212px;flex:none;}
.leg .item{display:flex;gap:9px;align-items:flex-start;}
.leg .swatch{flex:none;width:34px;height:14px;border-radius:3px;background:${TOKEN.track};
  position:relative;overflow:hidden;margin-top:1px;}
.leg .txt{font:12px/1.45 "IBM Plex Sans",system-ui,sans-serif;color:#33302a;}
.leg .txt b{font-weight:600;}
.stage .leg .txt{color:#c9c9d1;}
.stage .leg .txt .m{background:#24242a;color:#e7e7ea;}
.stage .leg .txt b{color:${TOKEN.text};}

/* Two windows side by side, ours against theirs, on a comparison sheet. */
.vs{display:flex;gap:22px;align-items:flex-start;flex-wrap:wrap;}
.vs .col{display:flex;flex-direction:column;align-items:flex-start;}
`;

/** The tint is measured, not chosen: `DESIGN.md` § The palette. */
export function tint(hue, over = TOKEN.track) {
    const read = (at) => parseInt(hue.slice(1 + at * 2, 3 + at * 2), 16);
    const under = (at) => parseInt(over.slice(1 + at * 2, 3 + at * 2), 16);
    const mixed = [0, 1, 2].map((at) =>
        Math.round(under(at) * (1 - TOKEN.barTint) + read(at) * TOKEN.barTint)
    );
    return `rgb(${mixed.join(" ")})`;
}

/**
 * What was counted, solid. `turns` of `stated` have passed in the bearer's own turns, and the rest
 * of the row is what the skill table says and nothing witnessed.
 */
export function elapsedBar(hue, turns, stated) {
    const share = Math.min(100, (turns / stated) * 100);
    const rest = 100 - share;
    return `<div class="pw-fill" style="width:${share}%;background:${tint(hue)}"></div>` +
        `<div class="pw-rest" style="left:${share}%;width:${rest}%;` +
        `background:repeating-linear-gradient(135deg,${hue}38 0 2px,transparent 2px 5px)"></div>` +
        `<div class="pw-cap" style="background:${hue}"></div>`;
}

/** A figure the game itself states, so nothing on the row is hatched. */
export function statedBar(hue, percent) {
    return `<div class="pw-fill" style="width:${percent}%;background:${tint(hue)}"></div>` +
        `<div class="pw-cap" style="background:${hue}"></div>`;
}

/** An elapsed with no total behind it gets no bar at all — there is nothing to fill against. */
export function plainRow(name, value, hue = null) {
    const cap = hue === null ? "" : `<div class="pw-cap" style="background:${hue}"></div>`;
    return `<div class="pw-row">${cap}<span class="pw-name">${name}</span>` +
        `<span class="pw-val">${value}</span></div>`;
}

export function auraRow(name, hue, turns, stated) {
    return `<div class="pw-row">${elapsedBar(hue, turns, stated)}` +
        `<span class="pw-name">${name}</span>` +
        `<span class="pw-val">${turns}<span class="of"> z ${stated}</span></span></div>`;
}

export function chargeRow(name, hue, percent) {
    return `<div class="pw-row">${statedBar(hue, percent)}` +
        `<span class="pw-name">${name}</span>` +
        `<span class="pw-val">${percent}%</span></div>`;
}

export function section(title, count) {
    const right = count === undefined ? "" : `<span class="n">${count}</span>`;
    return `<div class="pw-sec"><span>${title}</span>${right}</div>`;
}

export function window_(title, body, width = 200, controls = "⌄ ×") {
    return `<div class="pw" style="width:${width}px">` +
        `<div class="pw-bar"><span class="grip">⠿</span>${title}` +
        `<span class="ctl">${controls}</span></div>` +
        `<div class="pw-body">${body}</div></div>`;
}

/** A named holder, so a sheet can say what it is showing without a paragraph. */
export function hold(caption, body, colour = "#75705f") {
    return `<div class="hold"><div class="cap" style="color:${colour}">${caption}</div>` +
        `${body}</div>`;
}

export function note(title, body, kind = "") {
    return `<div class="note"><h3 class="${kind}">${title}</h3><p>${body}</p></div>`;
}

export function page(body) {
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>${CSS}</style>
</helmet>
${body}
</x-dc>
</body>
</html>
`;
}

/** Every sheet opens the same way: what it is, what it answers. */
export function sheet({ tag, title, lede, body, notes = "", background = "" }) {
    const style = background === "" ? "" : ` style="background:${background}"`;
    return `<div class="sheet"${style}>
${tag}
<h1>${title}</h1>
<p class="lede">${lede}</p>
${body}
${notes === "" ? "" : `<div class="notes">${notes}</div>`}
</div>`;
}

export function tag(words, mark = "") {
    return `<div class="tag"><span class="dot"></span>${words}${mark}</div>`;
}
