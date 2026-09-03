/**
 * The crawl: every control the panel draws, pressed, on every screen, at every level.
 *
 * It runs **inside the page** in one `evaluate`. A press costs well under a millisecond — the
 * panel redrawing itself — and a round trip out to the driver costs milliseconds, so a crawl
 * driven from outside would be hours where this is a minute. The loops are written out rather
 * than recursive (**S1**) and bounded (**S2**). **ADR 0047.**
 */

/** Everything the crawl counted, and everything it caught. */
export interface CrawlReport {
    screens: number;
    opened: number;
    second: number;
    deeper: number;
    /** Presses that changed nothing. **ADR 0034** says there should be none. */
    leaves: number;
    closed: number;
    kinds: string[];
    faults: string[];
    presses: number;
}

/** What opens another level. The order is `getPressFromTarget`'s (`src/ui/panel-element.ts`). */
export const DESCENDING = [
    "[data-row]",
    "[data-unnamed]",
    "[data-skill]",
    "[data-source]",
    "[data-kind]",
];
/**
 * More presses than any fight can offer. **ADR 0046** measured 6244 on one screen of the deepest
 * recording, and there are twelve screens — so this stands more than an order of magnitude over
 * the whole of that, and exceeding it is a finding rather than a longer crawl (**S2**).
 */
const MAXIMUM_PRESSES = 2000000;
/** More faults than a reader would read. Past this the crawl has found its answer already. */
const FAULTS_KEPT = 40;

/** Reaching in, pressing, and the two readings every check is made of. */
function composeCrawlHelpers(): string {
    return `var host = document.getElementById("MargoMeter-Panel");
if (host === null || host.shadowRoot === null) throw new ReferenceError("no panel to crawl");
var root = host.shadowRoot;
var faults = [];
var presses = 0;
var seen = { screens: 0, opened: 0, second: 0, deeper: 0, leaves: 0, closed: 0, kinds: {} };
var all = function (selector) { return [].slice.call(root.querySelectorAll(selector)); };
var shape = function () { return root.innerHTML; };
var fault = function (said) { if (faults.length < ${FAULTS_KEPT}) faults.push(said); };
var press = function (node) {
  presses += 1;
  if (presses > ${MAXIMUM_PRESSES}) throw new RangeError("the crawl ran past its stated bound");
  node.dispatchEvent(new PointerEvent("pointerdown", {
    bubbles: true, composed: true, button: 0
  }));
};`;
}

/**
 * What must hold wherever the crawl stands. The text check is the one that catches a figure nobody
 * composed: a row drawing `undefined` is drawn, styled and wrong, and no assertion inside the
 * panel looks at the string a person actually reads.
 */
function composeCrawlCheck(): string {
    return `var check = function (where) {
  if (root.children.length === 0) fault(where + ": the panel drew nothing at all");
  if (all(".undrawn").length > 0) fault(where + ": a region gave way");
  var said = root.textContent;
  if (said.indexOf("undefined") !== -1) fault(where + ": a row reads undefined");
  if (said.indexOf("NaN") !== -1) fault(where + ": a row reads NaN");
  if (said.indexOf("[object") !== -1) fault(where + ": a row reads an object");
};
var closeTo = function (before, where) {
  var out = all("[data-back]").concat(all(".crumb-back"));
  if (out.length === 0) { fault(where + ": a level that opened offers no way out"); return; }
  press(out[0]);
  seen.closed += 1;
  if (shape() !== before) fault(where + ": the way back landed somewhere else");
};`;
}

/**
 * The second level, and the count of what a third would hold. Nothing there is pressed: what is
 * being held is that there is nothing to press, which is `docs/drill-levels.md`'s claim.
 */
function composeCrawlSecond(): string {
    return `var walkSecond = function (where) {
  var standing = shape();
  for (var b = 0; b < DESCENDING.length; b += 1) {
    var second = DESCENDING[b];
    var count = all(second).length;
    for (var two = 0; two < count; two += 1) {
      var found = all(second);
      if (two >= found.length) { fault(where + ": the second level shrank"); break; }
      press(found[two]);
      if (shape() === standing) { seen.leaves += 1; continue; }
      seen.second += 1;
      seen.kinds[second] = true;
      check(where + " " + second);
      for (var c = 0; c < DESCENDING.length; c += 1) seen.deeper += all(DESCENDING[c]).length;
      closeTo(standing, where + " " + second);
    }
  }
};`;
}

/** The first level of one screen, every control on it, each walked and closed behind. */
function composeCrawlFirst(): string {
    return `var walkScreen = function (where) {
  check(where);
  var standing = shape();
  for (var a = 0; a < DESCENDING.length; a += 1) {
    var first = DESCENDING[a];
    var count = all(first).length;
    for (var one = 0; one < count; one += 1) {
      var found = all(first);
      if (one >= found.length) { fault(where + ": the first level shrank under the crawl"); break; }
      press(found[one]);
      if (shape() === standing) { seen.leaves += 1; continue; }
      seen.opened += 1;
      seen.kinds[first] = true;
      check(where + " " + first + "#" + one);
      if (IS_DEEP) walkSecond(where + " " + first + "#" + one);
      closeTo(standing, where + " " + first + "#" + one);
    }
  }
};`;
}

/** Every screen the two strips and the audience offer, each walked to the bottom. */
function composeCrawlScreens(): string {
    return `var screenCount = all("[data-screen]").length;
var sideCount = all("[data-side]").length;
for (var s = 0; s < screenCount; s += 1) {
  for (var d = 0; d < sideCount; d += 1) {
    var tabs = all("[data-screen]");
    if (s < tabs.length) press(tabs[s]);
    var sides = all("[data-side]");
    if (d < sides.length) press(sides[d]);
    seen.screens += 1;
    walkScreen("screen " + s + " side " + d);
  }
}`;
}

/**
 * The crawl, as one expression a page can be handed. `isDeep` is what a caller trades: the second
 * level holds tens of controls per row of the first, so a sweep over every recording asks for the
 * first alone and a crawl of one recording asks for both.
 */
export function composeCrawlScript(isDeep: boolean): string {
    return `(function crawlThePanel() {
var DESCENDING = ${JSON.stringify(DESCENDING)};
var IS_DEEP = ${isDeep ? "true" : "false"};
${composeCrawlHelpers()}
${composeCrawlCheck()}
${composeCrawlSecond()}
${composeCrawlFirst()}
${composeCrawlScreens()}
return {
  screens: seen.screens, opened: seen.opened, second: seen.second, deeper: seen.deeper,
  leaves: seen.leaves, closed: seen.closed, kinds: Object.keys(seen.kinds),
  faults: faults, presses: presses
};
})()`;
}
