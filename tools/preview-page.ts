/**
 * The harness page, whole, as one string — everything a browser needs in front of
 * the panel, and nothing that answers a request.
 *
 * It left `tools/preview-server.ts` at its second consumer (§7.1), which is
 * `tools/preview-site.ts` writing the same page down instead of serving it. The
 * move is `build.ts`'s own, one level up: `composeUserscriptFiles()` left the
 * writer when the server wanted the bundle in memory, and what must not be
 * spelled twice is the page rather than the bundling.
 *
 * **Every word a reader sees arrives as an option, and that is structural.** §3
 * puts the text a player reads in Polish, and a published page is read by
 * players; the local preview is read by whoever is editing `src/`, in the
 * language the rest of this repository is written in. Holding both as data keeps
 * this module free of either — which is what keeps it off the list in
 * `tests/tools/source-layout.test.ts` naming the files allowed to speak Polish,
 * and keeps that list a decision somebody makes on purpose. ⚠️ That guard reads a
 * template literal as one text span, so a Polish word smuggled into the markup
 * below would put this file on the list rather than slipping past it.
 */

import { USERSCRIPT_FILENAME } from "@/build.ts";
import { composeJsonText } from "@/libs/json.ts";

/**
 * A build id in the shape `src/core/game-build.ts` recognises.
 *
 * The page carries a script tag naming it so a recording saved from the preview
 * says which build it came from. Only the `src` attribute is ever read, so what
 * the file holds does not matter — but whether it exists does, on a host that
 * answers a miss with HTML: see `tools/preview-site.ts`.
 */
const PREVIEW_GAME_BUILD = "1785244275300";

/** The decoy's filename, composed once so the two consumers cannot disagree. */
export const PREVIEW_GAME_SCRIPT_NAME = `main.min${PREVIEW_GAME_BUILD}.js`;

/**
 * Every word the strip draws, so the language of a page is a value rather than a
 * branch inside the browser JavaScript.
 */
export type PreviewWords = {
  /** The tag `<html lang>` declares, which a browser's translation offer reads. */
  language: string;
  /** The strip's heading, and the document title beside the capture's name. */
  title: string;
  /**
   * The ⏮ button: back to before the first payload, which is the empty panel.
   *
   * It opens the page again rather than replaying, because before the first
   * payload is the one state a replay cannot reach — see `setStartOpened` below.
   */
  start: string;
  /** The ◀ button's tooltip, since the arrow says nothing about the replay behind it. */
  backHint: string;
  /** The last button: feed every payload that is left. */
  end: string;
  /** The play button, and what that same button says once it is playing. */
  play: string;
  pause: string;
  /** Drawn before the two numbers — `entry 12 / 102`. */
  entry: string;
};

/** A capture the picker offers, and where choosing it goes. */
export type PreviewFightLink = {
  name: string;
  /**
   * ⚠️ **The address is the caller's, because the two callers address a fight
   * differently.** A server answers one path and carries the choice in a query;
   * a published site is a directory of files under a repository path, so it can
   * carry nothing absolute — and a query would have to be read back into a
   * number, which `libs/` owns and this page may not do (§9.5).
   */
  address: string;
};

export type PreviewPageOptions = {
  fightName: string;
  entryIndex: number;
  /**
   * Every payload of the fight, carried in the page rather than fetched.
   *
   * ⚠️ **The replay has to finish before `load` does.** Firefox's `--screenshot`
   * waits for `load` and nothing after it, so a page that fetched its capture
   * photographed itself empty with the strip still saying `loading` — which looks
   * exactly like a panel that failed to draw. Embedding them makes the whole
   * replay synchronous, which is what the recipe in `.claude/skills/verify/SKILL.md`
   * had been doing all along and for this reason.
   */
  payloads: readonly unknown[];
  /** Every capture and where its page is, so the picker is the directory rather than a list somebody typed. */
  fights: readonly PreviewFightLink[];
  /**
   * Where both script tags point.
   *
   * `/` while a server answers every path; `./` on GitHub Pages, which serves
   * this repository under a path of its own — an absolute `src` there asks the
   * domain root for a file that belongs to no project.
   */
  scriptDirectory: string;
  words: PreviewWords;
  /** A sentence for a reader who did not start the page, or null where the reader is the one editing it. */
  introduction: string | null;
  /**
   * A second half of the driver, appended after the page's own, or null.
   *
   * It runs where it does on purpose: after `setFedTo`, so the fight has already
   * been replayed and the panel is mounted and drawn, and still synchronously,
   * so a screenshot taken at `load` sees whatever it did. Two callers use it and
   * neither is this file's business — `tools/preview-server.ts` appends hot
   * reloading, `tools/panel-screenshots.ts` appends the clicks that put the panel
   * in the state being photographed.
   *
   * ⚠️ **A page nobody rebuilds must open no stream.** The reload response opens
   * with `retry: 500`, and that is also what a browser falls back to on its own —
   * so a published copy of the server's driver would reconnect to a route that is
   * not there, twice a second, for as long as the tab is open. That is a
   * constraint on what the server passes, which is why this is a hole rather than
   * a stream this file opens.
   */
  appendedScript: string | null;
};

/**
 * ⚠️ **Everything below is read by `tests/tools/source-layout.test.ts` as
 * source.** The guards strip comments and leave string literals alone, so the
 * browser JavaScript in here is held to the same rules as the TypeScript around
 * it — verbs on function names, prefixes on booleans, and none of the value
 * readers `libs/` owns. That last one is why **the caller does the converting**:
 * the entry index arrives already a number, and nothing in the page turns text
 * into one.
 *
 * ⚠️ **Nothing of the harness is named `MargoMeter-`.** Two tests read a page and
 * ask whether everything named that way says whose it is; a preview page has to
 * keep that question answerable, so the harness calls its own things `preview-`
 * and every `MargoMeter-` node in the document is still the add-on's.
 *
 * ⚠️ **No block comment goes inside the template.** The guards strip comments
 * from the whole file before reading it, so a `/* … *` + `/` in here blinds them
 * to whatever it spans — and an unclosed one would pair with the next docblock's
 * end and blank the code between. The strip's own layer is the one thing that
 * would have wanted a note: it sits bottom-left below `z-index: 9999`, because
 * the panel starts in the top-right corner and may be dragged anywhere, and
 * harness chrome that covered the thing under test would be worse than useless.
 */
export function composePreviewPage(options: PreviewPageOptions): string {
  /**
   * ⚠️ **`</` is escaped, or the payloads end the script tag.** An HTML parser
   * looks for the closing tag as text and knows nothing about the JavaScript
   * string it is inside, so one `</` in a recorded message would end the block
   * early and leave the rest of the fight on the page as markup.
   */
  const settings = composeJsonText({
    fightName: options.fightName,
    entryIndex: options.entryIndex,
    entryCount: options.payloads.length,
    fights: options.fights,
    words: options.words,
    payloads: options.payloads,
  }).replaceAll("</", "<\\/");

  const introduction =
    options.introduction === null
      ? ""
      : `<p class="preview-intro">${options.introduction}</p>`;

  return `<!doctype html>
<html lang="${options.words.language}">
<head>
<meta charset="utf-8">
<title>${options.words.title} — ${options.fightName}</title>
<style>
  html, body { margin: 0; height: 100%; background: #14171c; color: #c8cdd6;
    font: 13px/1.5 ui-sans-serif, system-ui, sans-serif; }
  .preview-intro { margin: 0; padding: 18px 20px; max-width: 46em; color: #8f9bb0; }
  .preview-intro a { color: #8fb8e8; }
  .preview-strip { position: fixed; left: 12px; bottom: 12px; z-index: 9000;
    display: flex; flex-direction: column; gap: 6px; padding: 10px 12px;
    background: #1c2027; border: 1px solid #2c323c; border-radius: 8px;
    box-shadow: 0 6px 24px rgba(0,0,0,.5); max-width: min(560px, calc(100vw - 24px)); }
  .preview-line { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .preview-strip button, .preview-strip select {
    font: inherit; color: inherit; background: #262c35; border: 1px solid #39404b;
    border-radius: 5px; padding: 3px 9px; cursor: pointer; }
  .preview-strip button:hover { background: #2f3742; }
  .preview-title { font-weight: 600; color: #8f9bb0; letter-spacing: .04em; }
  .preview-count { font-variant-numeric: tabular-nums; color: #8f9bb0; }
  .preview-build { margin-left: auto; }
  .preview-ok { color: #7fd18a; }
  .preview-bad { color: #e8836f; }
  .preview-log { display: none; margin: 0; padding: 8px; overflow: auto;
    max-height: 30vh; white-space: pre-wrap; background: #12151a;
    border: 1px solid #43301f; border-radius: 5px; color: #e8b48b;
    font: 12px/1.45 ui-monospace, monospace; }
  .preview-log[data-shown="yes"] { display: block; }
</style>
</head>
<body>

${introduction}

<div class="preview-strip">
  <div class="preview-line">
    <span class="preview-title">${options.words.title}</span>
    <select id="preview-fight"></select>
    <span class="preview-build" id="preview-build"></span>
  </div>
  <div class="preview-line">
    <button id="preview-start">${options.words.start}</button>
    <button id="preview-back" title="${options.words.backHint}">&#9664;</button>
    <button id="preview-next">&#9654;</button>
    <button id="preview-play">${options.words.play}</button>
    <button id="preview-end">${options.words.end}</button>
    <span class="preview-count" id="preview-count"></span>
  </div>
  <pre class="preview-log" id="preview-log"></pre>
</div>

<script>
  /*
   * The page keeps nothing, and it has to take the store away before the bundle
   * runs. This harness loads the real add-on rather than a mock of it, so once
   * fights could be kept, a visitor to the published preview had a demo fight
   * written into their own browser — around 34 kB of it, up to five, plus the
   * settings and the panel position — and a second visit opened onto a shelf
   * holding what the first one left. Nobody chose that; it followed from the
   * shelf. See docs/audits/2026-08-26-the-whole-tree-read-a-fifth-time.md, F7.
   *
   * A stand-in rather than a flag the add-on reads: getStoreFromPage already
   * falls back to a store that outlives nothing where a browser offers none
   * (src/userscript-storage.ts), so the preview stays the add-on exactly as
   * shipped and the shelf still works for the length of a visit. What is bought
   * is that it stops at the tab.
   *
   * An engine that will not give the property up leaves its own store in place,
   * which is this page as it was before — no worse, and never a reason to stop
   * drawing. Measured working on Firefox 140.13.0esr, 2026-08-26.
   */
  (function setNothingKept() {
    function composeForgettingStore() {
      var held = {};
      return {
        getItem: function (key) {
          return Object.prototype.hasOwnProperty.call(held, key) ? held[key] : null;
        },
        // What the add-on hands this is already text, so there is nothing to
        // coerce — and a coercion here would be libs/number.ts's to spell (§9.5).
        setItem: function (key, value) {
          held[key] = value;
        },
        removeItem: function (key) {
          delete held[key];
        },
      };
    }
    var names = ["localStorage", "sessionStorage"];
    for (var at = 0; at < names.length; at += 1) {
      try {
        Object.defineProperty(window, names[at], {
          value: composeForgettingStore(),
          configurable: true,
        });
      } catch (refusal) {
        void refusal;
      }
    }
  })();

  // The game, as much of it as the add-on touches. Both names are needed:
  // src/game/engine-roster.ts reads "w", src/game/fight-capture.ts reads
  // "warriorsList", and with only the first every combatant snapshot in a saved
  // recording comes out empty with nothing saying why.
  window.Engine = {
    battle: {
      w: {},
      warriorsList: {},
      myteam: null,
      updateData: function handlePayload(payload) {
        var roster = payload && payload.w;
        if (roster) {
          for (var id in roster) {
            window.Engine.battle.w[id] = roster[id];
            window.Engine.battle.warriorsList[id] = roster[id];
          }
        }
        return "preview-engine";
      },
    },
  };
</script>

<script src="${options.scriptDirectory}${PREVIEW_GAME_SCRIPT_NAME}"></script>
<script src="${options.scriptDirectory}${USERSCRIPT_FILENAME}"></script>

<script>
  var PREVIEW = ${settings};

  function getElement(id) {
    var found = document.getElementById(id);
    if (found === null) throw new ReferenceError("preview is missing " + id);
    return found;
  }

  var countLabel = getElement("preview-count");
  var picker = getElement("preview-fight");

  var fedCount = 0;
  var isPlaying = false;

  function renderCount() {
    countLabel.textContent = PREVIEW.words.entry + " " + fedCount + " / " + PREVIEW.entryCount;
  }

  // The address is the caller's, so choosing a capture is a value the page was
  // handed rather than a path it composed: a served page carries a query, a
  // published one carries a filename, and neither belongs in here.
  function renderPicker() {
    for (var i = 0; i < PREVIEW.fights.length; i += 1) {
      var option = document.createElement("option");
      option.value = PREVIEW.fights[i].address;
      option.textContent = PREVIEW.fights[i].name;
      option.selected = PREVIEW.fights[i].name === PREVIEW.fightName;
      picker.append(option);
    }
  }

  // One payload into the game's own method, which the add-on has already wrapped:
  // the wrap goes on synchronously while the bundle's script tag runs, so by the
  // time this file executes there is nothing to wait for.
  function setNextFed() {
    if (fedCount >= PREVIEW.payloads.length) return false;
    window.Engine.battle.updateData(PREVIEW.payloads[fedCount]);
    fedCount += 1;
    renderCount();
    return true;
  }

  function handlePlay() {
    isPlaying = !isPlaying;
    getElement("preview-play").textContent = isPlaying ? PREVIEW.words.pause : PREVIEW.words.play;
    function handleTick() {
      if (!isPlaying) return;
      if (!setNextFed()) {
        isPlaying = false;
        getElement("preview-play").textContent = PREVIEW.words.play;
        return;
      }
      window.setTimeout(handleTick, 220);
    }
    handleTick();
  }

  // Rewinding is replaying. The first payload of every capture carries "init",
  // which resets the session, so feeding the fight again from zero lands on any
  // earlier entry — and the panel keeps the tab the reader chose, which a reload
  // would throw away.
  //
  // ⚠️ It does not keep the drill level, and that is the add-on being right
  // rather than the rewind being wrong: "init" is what a fight opening looks
  // like, and a fight opening puts the reader back at the top of their tab
  // (composeStateAfterFightStart, src/ui/panel-screen.ts). Nothing in a game
  // rewinds; here it means a step back off entry 2 closes a breakdown that was
  // open.
  function setFedTo(target) {
    if (target < fedCount) fedCount = 0;
    while (fedCount < target && setNextFed()) { /* forward to where we were asked */ }
    renderCount();
  }

  // The address of this page, before its first payload.
  var START_HASH = "#start";

  // ⚠️ Replaying reaches entry 1 at the lowest, so entry 0 is a reload and not a
  // rewind, and this button did neither until it was driven: feeding no payloads
  // leaves the add-on holding the whole fight it had already accumulated, and the
  // stub engine holding the whole roster. Measured on the published page, at the
  // finished fight — the counter went to "0 / 52" and all 12 rows kept the totals
  // they had, which is exactly what §9.6 forbids: a number that may be wrong
  // looking like a number that is right. Only a page that has fed nothing is the
  // empty panel. The hash is what carries the ask across the reload, because it is
  // the one part of an address both callers have — a served page keeps its query
  // and a published page is a file with none.
  function setStartOpened() {
    window.location.hash = START_HASH;
    // Assigning a hash the address already carries navigates nowhere, so the
    // reload is what answers the click either way.
    window.location.reload();
  }

  getElement("preview-next").addEventListener("click", function handleNext() {
    setNextFed();
  });
  getElement("preview-end").addEventListener("click", function handleEnd() {
    setFedTo(PREVIEW.payloads.length);
  });
  getElement("preview-play").addEventListener("click", handlePlay);
  // One step back off the first payload is the same ask as the button beside it,
  // and it was the same silent no-op.
  getElement("preview-back").addEventListener("click", function handleBack() {
    if (fedCount <= 1) {
      setStartOpened();
      return;
    }
    setFedTo(fedCount - 1);
  });
  getElement("preview-start").addEventListener("click", setStartOpened);
  picker.addEventListener("change", function handlePick() {
    window.location.href = picker.value;
  });

  renderPicker();
  // Synchronously, before load fires: a screenshot is taken at load and nothing
  // after it, so a replay that waited would photograph an empty panel.
  //
  // The hash wins over the entry the caller baked in, which is what makes the
  // empty panel reachable on a page whose entry is not in its address at all.
  setFedTo(window.location.hash === START_HASH ? 0 : PREVIEW.entryIndex);
${options.appendedScript ?? ""}
</script>

</body>
</html>
`;
}
