/**
 * The page, held to the things it can get wrong quietly.
 *
 * None of this needs a socket, because `composePreviewPage` is pure and the page
 * is where every past failure of this harness lived — the recipe it replaces
 * (`.claude/skills/verify/SKILL.md`) records two of them, and both were a page
 * that loaded and drew nothing rather than a page that errored. Now that it has
 * two consumers, the same is true of every hole in it: a published page carries
 * different words, different addresses and no reload stream, and each of those is
 * invisible until somebody opens the deployed URL.
 */

import { describe, expect, test } from "bun:test";

import { assertDefined } from "@/libs/assert.ts";
import { getRecordFromValue } from "@/libs/record.ts";
import { getGameBuildFromScriptName } from "@/src/core/game-build.ts";
import { isFightStart } from "@/src/game/battle-session.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";
import { getAttributeValues, getElements } from "@/tests/markup-parts.ts";
import {
  composePreviewPage,
  PREVIEW_GAME_SCRIPT_NAME,
  type PreviewPageOptions,
  type PreviewWords,
} from "@/tools/preview-page.ts";

const FIGHT = assertDefined(CAPTURED_FIGHTS[0], "the catalog carries a capture to preview");
/** A second one, because picking is the one thing that needs two. */
const OTHER = assertDefined(CAPTURED_FIGHTS[1], "the catalog carries a second capture");

const WORDS: PreviewWords = {
  language: "en",
  title: "MargoMeter preview",
  start: "to start",
  backHint: "Replays the fight up to the previous entry",
  end: "to end",
  play: "play",
  pause: "pause",
  entry: "entry",
};

function composePageOfFight(overrides: Partial<PreviewPageOptions> = {}): string {
  return composePreviewPage({
    fightName: FIGHT.name,
    entryIndex: 0,
    payloads: FIGHT.dump.calls.map((call) => call.payload),
    fights: CAPTURED_FIGHTS.map((fight) => ({
      name: fight.name,
      address: `/?fight=${fight.name}&entry=0`,
      payloadsAddress: `/payloads?fight=${fight.name}`,
    })),
    scriptDirectory: "/",
    words: WORDS,
    introduction: null,
    appendedScript: null,
    ...overrides,
  });
}

/** What the driver builds, asks for and is clicked on, with no browser under it. */
type FakeElement = {
  textContent: string;
  value: string;
  children: FakeElement[];
  // What a handler answers is `unknown` rather than `void` because one of them
  // answers something: the picker's hands back the fetch it started, which is the
  // only handle a test has on a pick that replays instead of navigating.
  handlers: Map<string, () => unknown>;
  addEventListener: (type: string, handler: () => unknown) => void;
  append: (child: FakeElement) => void;
  setAttribute: (name: string, value: string) => void;
};

function composeFakeElement(): FakeElement {
  const element: FakeElement = {
    textContent: "",
    value: "",
    children: [],
    handlers: new Map(),
    addEventListener: (type, handler) => void element.handlers.set(type, handler),
    append: (child) => void element.children.push(child),
    setAttribute: () => undefined,
  };
  return element;
}

/** One run of the page's own driver: what it fed, what it drew, what it asked for. */
type DriverRun = {
  /** Payloads the stub engine received — the replay, as the add-on would see it. */
  fedCount: number;
  reloadCount: number;
  hash: string;
  /** Where the page navigated, and the empty string while it has not. */
  href: string;
  /** What the page called itself last, which a pick that draws another fight renames. */
  title: string;
  /** Every address the page fetched, in order — empty on a page that asks for nothing. */
  fetchedAddresses: string[];
  /** Who the stub engine holds, which is what `src/game/engine-roster.ts` reads. */
  getEngineWarriorIds: () => string[];
  getCountText: () => string;
  /** What the play button says, which is the whole of whether a replay is running. */
  getPlayText: () => string;
  setClicked: (id: string) => void;
  /** Picks a capture in the strip, and answers when the page is done with it. */
  setPicked: (address: string) => Promise<void>;
};

/**
 * The page's browser JavaScript, run.
 *
 * ⚠️ **The driver is the half of this harness no compiler reads**, so every test
 * above this one asks whether a string contains something. That is enough for a
 * hole the caller has to fill and not enough for behaviour: `od początku` moved
 * the counter to `0 / 52` and left the panel showing the finished fight, and a
 * page containing the words `preview-start` passes either way. This runs the
 * script blocks the page carries — the engine stub and the driver, in the order
 * the page has them — over a document small enough to be checkable, the way
 * `tests/ui/panel-element.test.ts` does for the panel.
 */
function composeDriverRun(
  page: string,
  hash = "",
  /**
   * What a fetch answers, by address. A miss rejects, which is a server that has
   * gone away — and the page has to stay usable through it.
   */
  payloadsByAddress: ReadonlyMap<string, readonly unknown[]> = new Map(),
): DriverRun {
  // The two the page writes itself. A script with a `src` carries no text and
  // is somebody else's file — the decoy and the add-on both arrive that way.
  const blocks = getElements(page, "script")
    .filter((one) => one.attributes === "")
    .map((one) => one.text);
  expect(blocks.length).toBe(2);

  const elements = new Map<string, FakeElement>();
  function getFakeElement(id: string): FakeElement {
    const known = elements.get(id);
    if (known !== undefined) return known;
    const fresh = composeFakeElement();
    elements.set(id, fresh);
    return fresh;
  }

  let fedCount = 0;
  let reloadCount = 0;
  const fetchedAddresses: string[] = [];
  const location = {
    hash,
    href: "",
    reload: () => {
      reloadCount += 1;
    },
  };
  const window = {
    Engine: null as unknown,
    location,
    setTimeout: () => 0,
    // A `TypeError` because that is what a browser rejects a fetch with, and the
    // page's refusal path is written for what it will actually be handed.
    fetch: (address: string) => {
      fetchedAddresses.push(address);
      const payloads = payloadsByAddress.get(address);
      if (payloads === undefined) {
        return Promise.reject(new TypeError(`nothing answers ${address}`));
      }
      return Promise.resolve({ json: () => Promise.resolve(payloads) });
    },
  };
  const document = {
    title: "",
    getElementById: (id: string) => getFakeElement(id),
    createElement: () => composeFakeElement(),
  };

  // The two blocks are run apart and the count goes on between them, which is
  // where the add-on itself sits: the bundle's tag is after the stub and before
  // the driver, and `src/game/engine-battle-wrap.ts` wraps exactly this method. So
  // what is counted is what the panel would have been handed.
  const defineEngine = new Function("window", blocks[0] ?? "") as (page: unknown) => void;
  defineEngine(window);

  const engine = window.Engine as { battle: { updateData: (payload: unknown) => unknown } };
  const original = engine.battle.updateData;
  engine.battle.updateData = (payload: unknown) => {
    fedCount += 1;
    return original(payload);
  };

  const driveReplay = new Function("window", "document", blocks[1] ?? "") as (
    page: unknown,
    documentGiven: unknown,
  ) => void;
  driveReplay(window, document);

  const battle = (window.Engine as { battle: { w: Record<string, unknown> } }).battle;

  return {
    get fedCount() {
      return fedCount;
    },
    get reloadCount() {
      return reloadCount;
    },
    get hash() {
      return location.hash;
    },
    get href() {
      return location.href;
    },
    get title() {
      return document.title;
    },
    fetchedAddresses,
    // Read off the engine rather than off the page, because that is where the
    // add-on reads it: `src/game/engine-roster.ts` takes the roster from `w`.
    getEngineWarriorIds: () => Object.keys(battle.w),
    getCountText: () => getFakeElement("preview-count").textContent,
    getPlayText: () => getFakeElement("preview-play").textContent,
    setClicked: (id) => {
      const handler = getFakeElement(id).handlers.get("click");
      assertDefined(handler, `${id} listens for a click`)();
    },
    // The strip's own value moves first, exactly as a browser would move it, and
    // the handler hands back the fetch it started so a test can wait for it.
    setPicked: async (address) => {
      const picker = getFakeElement("preview-fight");
      picker.value = address;
      const handler = picker.handlers.get("change");
      await assertDefined(handler, "the picker listens for a change")();
    },
  };
}

describe("there is something to look at", () => {
  test("the catalog carries captures to preview", () => {
    expect(CAPTURED_FIGHTS.length).toBeGreaterThan(0);
  });
});

describe("the page the harness draws", () => {
  /**
   * The one fault the skill calls out by name: `src/game/engine-roster.ts` reads
   * `w` and `src/game/fight-capture.ts` reads `warriorsList`, so a stub folding
   * into only the first leaves every combatant snapshot in a saved recording
   * empty — and says nothing about it.
   */
  test("the engine stub folds the roster into both names the add-on reads", () => {
    const page = composePageOfFight();
    expect(page).toContain("warriorsList");
    expect(page).toContain("Engine.battle.w[id]");
    expect(page).toContain("Engine.battle.warriorsList[id]");
  });

  // Order, not presence: the wrap goes on while the bundle's tag runs, so a
  // driver above it would feed a game nobody was reading.
  test("the game is defined before the bundle, and the bundle before the driver", () => {
    const page = composePageOfFight();
    const engineAt = page.indexOf("window.Engine =");
    const bundleAt = page.indexOf("margometer.user.js");
    const driverAt = page.indexOf("var PREVIEW =");
    expect(engineAt).toBeGreaterThan(-1);
    expect(engineAt).toBeLessThan(bundleAt);
    expect(bundleAt).toBeLessThan(driverAt);
  });

  /**
   * ⚠️ **This page loads the real add-on, so once fights could be kept it wrote one
   * into a stranger's browser.** The published preview runs whole against
   * `kamilgrocholski.github.io`, and a visitor who let the recording play to its end
   * had that fight under `margometer.kept-fights` — up to five of them, plus the
   * settings and the position — waiting for them on a second visit.
   *
   * Order and not presence, for the reason the test above gives twice over: the add-on
   * reads the page's stores as it starts, so a stand-in defined after the bundle's tag
   * would be a page that keeps everything and says it keeps nothing.
   */
  test("both stores are taken away before the bundle can reach them", () => {
    const page = composePageOfFight();
    const storeAt = page.indexOf("setNothingKept");
    const bundleAt = page.indexOf("margometer.user.js");
    expect(storeAt).toBeGreaterThan(-1);
    expect(storeAt).toBeLessThan(bundleAt);
    for (const name of ["localStorage", "sessionStorage"]) {
      expect(page).toContain(`"${name}"`);
    }
  });

  /**
   * Asked as "which of the page's scripts states a build" rather than by looking
   * for the game's own filename: the shape of that name is
   * `src/core/game-build.ts`'s to know (§9.3), and a guard spelling it here would
   * be the second place it lives.
   */
  test("the decoy script names a build the add-on can read", () => {
    const named = getAttributeValues(composePageOfFight(), "src")
      .map((address) => address.slice(address.lastIndexOf("/") + 1))
      .filter((name) => getGameBuildFromScriptName(name) !== null);

    expect(named).toEqual([PREVIEW_GAME_SCRIPT_NAME]);
  });

  test("the page replays the fight it was asked for, from where it was asked", () => {
    expect(composePageOfFight({ entryIndex: 7 })).toContain(`"entryIndex":7`);
    expect(composePageOfFight()).toContain(FIGHT.name);
  });

  test("every payload of the fight travels in the page", () => {
    expect(composePageOfFight()).toContain(`"entryCount":${FIGHT.dump.calls.length}`);
  });

  /**
   * ⚠️ **An HTML parser ends a script block at the text `</script>`** and knows
   * nothing about the JavaScript string around it, so one in a recorded message
   * would spill the rest of the fight onto the page as markup. Driven with a
   * payload carrying the sequence rather than by reading the escape back, because
   * what matters is that the closing tag cannot appear, however it is spelled.
   */
  test("a payload that spells a closing tag cannot end the script", () => {
    const page = composePageOfFight({ payloads: [{ m: ["</script><b>escaped</b>"] }] });
    expect(page).not.toContain("</script><b>");
    expect(page).toContain("<\\/script>");
  });

  /**
   * §9.6's question, kept answerable on a preview page: two tests read a document
   * and ask whether everything named `MargoMeter-` says whose it is. The harness
   * is not the add-on's, so nothing it draws may borrow that name — otherwise the
   * page teaches the opposite of what those tests check.
   */
  test("nothing the harness draws is named as the add-on's", () => {
    const markup = composePageOfFight().split("<script")[0] ?? "";
    expect(markup).toContain("preview-strip");
    expect(markup).not.toContain("MargoMeter-");
  });

  test("the picker offers every capture rather than a list somebody typed", () => {
    const page = composePageOfFight();
    for (const fight of CAPTURED_FIGHTS) expect(page).toContain(fight.name);
  });
});

/**
 * The four holes the second consumer opened, each of them a failure that shows
 * up on a deployed page and on nothing else.
 */
describe("what the caller decides and the page does not", () => {
  test("the picker goes where the caller said, not where the page decided", () => {
    const page = composePageOfFight({
      fights: [
        { name: "first", address: "./first.html", payloadsAddress: null },
        { name: "second", address: "./second.html", payloadsAddress: null },
      ],
    });
    expect(page).toContain(`"address":"./first.html"`);
    expect(page).toContain(`"address":"./second.html"`);
    expect(page).not.toContain(`"/?fight=`);
  });

  /**
   * ⚠️ **The one that would be permanent and silent.** A published page has no
   * `/reload` behind it, and the stream reconnects on its own — twice a second,
   * for as long as the tab is open — so the fragment has to be absent rather than
   * merely useless. Held from both sides: a page given one opens a stream.
   */
  test("a page with no reload script opens no stream, and one with it does", () => {
    expect(composePageOfFight()).not.toContain("EventSource");
    expect(composePageOfFight({ appendedScript: `new EventSource("/reload");` })).toContain(
      `new EventSource("/reload")`,
    );
  });

  test("the words the caller gave are the words the page draws", () => {
    const page = composePageOfFight({
      words: {
        language: "xx",
        title: "TITLE-MARK",
        start: "START-MARK",
        backHint: "BACK-MARK",
        end: "END-MARK",
        play: "PLAY-MARK",
        pause: "PAUSE-MARK",
        entry: "ENTRY-MARK",
      },
    });
    expect(page).toContain(`lang="xx"`);
    for (const mark of ["TITLE-MARK", "START-MARK", "BACK-MARK", "END-MARK", "PLAY-MARK"]) {
      expect(page).toContain(mark);
    }
    // The two the driver reads rather than the markup, so they have to survive
    // the settings and not only the buttons.
    expect(page).toContain(`"pause":"PAUSE-MARK"`);
    expect(page).toContain(`"entry":"ENTRY-MARK"`);
  });

  /**
   * GitHub Pages serves a project under a path of its own, so an absolute `src`
   * asks the domain root for a file belonging to no project — and the panel
   * simply never appears, while the same page is perfect on `file://` and on
   * localhost. Both tags, because parameterising one of the two is the shape of
   * the bug rather than its fix.
   */
  test("both script tags sit in the directory the caller named", () => {
    const page = composePageOfFight({ scriptDirectory: "./" });
    expect(page).toContain(`src="./${PREVIEW_GAME_SCRIPT_NAME}"`);
    expect(page).toContain(`src="./margometer.user.js"`);
    expect(page).not.toContain(`src="/`);
  });

  test("an introduction is drawn where there is one and nothing where there is not", () => {
    expect(composePageOfFight({ introduction: "INTRO-MARK" })).toContain("INTRO-MARK");
    expect(composePageOfFight()).not.toContain("preview-intro\"");
  });
});

/**
 * The one state the replay cannot reach, and what it cost to find out.
 *
 * Before the first payload is not entry 1 with something subtracted: replaying
 * from zero lands on entry 1 at the lowest, and feeding nothing at all leaves the
 * add-on holding whatever it had already accumulated. So `od początku` used to
 * move the counter to `0 / 52` under a panel still showing every row of the
 * finished fight — measured on the published page in Firefox, all 12 rows and the
 * same totals — which is the failure §9.6 names first: a number that may be wrong
 * looking exactly like one that is right.
 */
describe("the panel before any payload", () => {
  const payloads = FIGHT.dump.calls.map((call) => call.payload);

  test("a page opened plainly replays to the entry the caller baked in", () => {
    const run = composeDriverRun(composePageOfFight({ entryIndex: 4 }));
    expect(run.fedCount).toBe(4);
    expect(run.reloadCount).toBe(0);
    expect(run.getCountText()).toBe(`entry 4 / ${payloads.length}`);
  });

  /**
   * The hash beats the entry the page was composed with, and that is the whole
   * mechanism: a published page carries its entry in the file rather than in the
   * address, so there is nothing else a reload could say.
   */
  test("a page opened at the start hash feeds nothing at all", () => {
    const run = composeDriverRun(composePageOfFight({ entryIndex: payloads.length }), "#start");
    expect(run.fedCount).toBe(0);
    expect(run.getCountText()).toBe(`entry 0 / ${payloads.length}`);
  });

  test("the start button asks for the page again instead of moving the counter alone", () => {
    const run = composeDriverRun(composePageOfFight({ entryIndex: payloads.length }));
    run.setClicked("preview-start");
    expect(run.reloadCount).toBe(1);
    expect(run.hash).toBe("#start");
    // The failure this replaces, from the other side: the counter said 0 while the
    // add-on still held the whole fight.
    expect(run.fedCount).toBe(payloads.length);
    expect(run.getCountText()).toBe(`entry ${payloads.length} / ${payloads.length}`);
  });

  test("one step back off the first payload is the same ask, and answered the same", () => {
    const run = composeDriverRun(composePageOfFight({ entryIndex: 1 }));
    run.setClicked("preview-back");
    expect(run.reloadCount).toBe(1);
    expect(run.hash).toBe("#start");
  });

  test("a step back anywhere else stays a replay, with no reload", () => {
    const run = composeDriverRun(composePageOfFight({ entryIndex: 3 }));
    run.setClicked("preview-back");
    expect(run.reloadCount).toBe(0);
    expect(run.getCountText()).toBe(`entry 2 / ${payloads.length}`);
    // Replayed rather than rewound: three fed on the way in, two more on the way
    // back, because `src/game/battle-session.ts` resets on the first payload.
    expect(run.fedCount).toBe(5);
  });
});

/**
 * Picking a capture, which is where everything the reader set used to go.
 *
 * A pick navigated, and a fresh document is a fresh add-on: the store this page
 * installs outlives nothing on purpose (audit F7), so the panel came back at its
 * default position, un-minimized, on the default tab, over an empty fight. None of
 * that is visible in a page that contains the word `preview-fight`, which is why
 * these run the driver.
 */
describe("picking another capture", () => {
  const payloads = FIGHT.dump.calls.map((call) => call.payload);
  const otherPayloads = OTHER.dump.calls.map((call) => call.payload);
  const otherAddress = `/?fight=${OTHER.name}&entry=0`;
  const otherPayloadsAddress = `/payloads?fight=${OTHER.name}`;
  const answers = new Map([[otherPayloadsAddress, otherPayloads]]);

  /** Who a capture names, read off the material rather than off the page. */
  function getWarriorIdsOfFight(fight: typeof FIGHT): string[] {
    const ids = new Set<string>();
    for (const call of fight.dump.calls) {
      const payload = getRecordFromValue(call.payload);
      const roster = payload === null ? null : getRecordFromValue(payload["w"]);
      if (roster !== null) for (const id of Object.keys(roster)) ids.add(id);
    }
    return [...ids].sort();
  }

  test("the capture arrives in the page already open, with nothing torn down", async () => {
    const run = composeDriverRun(composePageOfFight({ entryIndex: 2 }), "", answers);
    await run.setPicked(otherAddress);
    expect(run.fetchedAddresses).toEqual([otherPayloadsAddress]);
    // The two ways a page could have been thrown away, and the panel with it.
    expect(run.href).toBe("");
    expect(run.reloadCount).toBe(0);
    expect(run.getCountText()).toBe(`entry ${otherPayloads.length} / ${otherPayloads.length}`);
    // Two on the way in, then every payload of the capture picked: the finished
    // fight, because a capture somebody chose is one they want counted.
    expect(run.fedCount).toBe(2 + otherPayloads.length);
    expect(run.title).toBe(`${WORDS.title} — ${OTHER.name}`);
  });

  /**
   * ⚠️ **The failure nothing on screen would call a failure.** The stub merges
   * every roster it is handed and never clears, and `src/game/engine-roster.ts`
   * reads exactly that map — so a pick that left it alone would draw the fight
   * being left behind as rows of the fight arriving, under their own names and
   * with plausible figures.
   */
  test("the engine holds the capture picked and nobody from the one before it", async () => {
    const run = composeDriverRun(composePageOfFight({ entryIndex: payloads.length }), "", answers);
    expect(run.getEngineWarriorIds().sort()).toEqual(getWarriorIdsOfFight(FIGHT));
    await run.setPicked(otherAddress);
    expect(run.getEngineWarriorIds().sort()).toEqual(getWarriorIdsOfFight(OTHER));
  });

  test("a replay that was running stops, rather than feeding into the capture picked", async () => {
    const run = composeDriverRun(composePageOfFight(), "", answers);
    run.setClicked("preview-play");
    expect(run.getPlayText()).toBe(WORDS.pause);
    await run.setPicked(otherAddress);
    expect(run.getPlayText()).toBe(WORDS.play);
  });

  /**
   * The server it fetches from is a process, and a process can be stopped between
   * two clicks. Falling back costs the state a pick exists to keep; a picker that
   * moved and did nothing costs the reader's trust in what is on screen.
   */
  test("a fetch nothing answers opens that capture's own page instead", async () => {
    const run = composeDriverRun(composePageOfFight({ entryIndex: 2 }));
    await run.setPicked(otherAddress);
    expect(run.fetchedAddresses).toEqual([otherPayloadsAddress]);
    expect(run.href).toBe(otherAddress);
    expect(run.getCountText()).toBe(`entry 2 / ${payloads.length}`);
  });

  /** A published site is files: there is nothing to fetch, so a pick is a page. */
  test("a caller that named nowhere to fetch from navigates, and asks for nothing", async () => {
    const run = composeDriverRun(
      composePageOfFight({
        fights: [
          { name: FIGHT.name, address: "./first.html", payloadsAddress: null },
          { name: OTHER.name, address: "./second.html", payloadsAddress: null },
        ],
      }),
    );
    await run.setPicked("./second.html");
    expect(run.href).toBe("./second.html");
    expect(run.fetchedAddresses).toEqual([]);
  });

  test("a page fetches nothing until somebody picks", () => {
    expect(composeDriverRun(composePageOfFight({ entryIndex: 2 })).fetchedAddresses).toEqual([]);
  });

  /**
   * ⚠️ **The address of the page stops naming what is on screen the moment a pick
   * replays**, and ⏮ is the one thing that reads it: reloading here would open the
   * empty panel of a capture nobody is looking at any more.
   */
  test("the start button after a pick opens the capture on screen", async () => {
    const run = composeDriverRun(composePageOfFight({ entryIndex: 1 }), "", answers);
    await run.setPicked(otherAddress);
    run.setClicked("preview-start");
    expect(run.href).toBe(`${otherAddress}#start`);
    expect(run.reloadCount).toBe(0);
  });
});

/**
 * The rewind rests on this and nothing else.
 *
 * Going back a step re-feeds the fight from its first payload, which is only a
 * rewind because that payload resets the session — `composeNextSession` starts
 * over on `init`. A recording arriving without it, or carrying a second one part
 * way through, would make the button land somewhere nobody asked for and no
 * figure on screen would look wrong. So it is re-measured on every recording
 * here rather than written down once as a count (§3).
 */
describe("the fight start every capture opens with", () => {
  test.each(CAPTURED_FIGHTS.map((fight) => [fight.name, fight] as const))(
    "%s starts its fight on its first payload and nowhere else",
    (_name, fight) => {
      const starts = fight.dump.calls
        .map((call, index) => (isFightStart(call.payload) ? index : -1))
        .filter((index) => index >= 0);
      expect(starts).toEqual([0]);
    },
  );
});
