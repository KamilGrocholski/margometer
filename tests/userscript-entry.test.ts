/**
 * What happens to a fight once it is over: where it goes, what it costs, what the
 * reader is told when it does not go anywhere, and what a reader reading one is
 * shown while the next fight is being counted.
 *
 * All of it runs against a store that is a map and a clock that is a function, so
 * the rules are checkable without a browser — which is the whole reason the
 * keeping is a value in this file rather than a branch at the bottom of it.
 *
 * The material is real: a recording is replayed into a session and the session is
 * what is kept, so what is written down here is a fight and not a shape somebody
 * typed (§7.5).
 */

import { describe, expect, test } from "bun:test";
import {
  composeFightKeeper,
  composeStoredTextFromSettings,
  getSettingsFromStoredText,
  type FightKeeper,
} from "@/src/userscript-entry.ts";
import {
  composeEmptySession,
  composeFightReading,
  composeNextSession,
  type BattleSession,
  type FightReading,
} from "@/src/game/battle-session.ts";
import { getPayloadReading } from "@/src/game/engine-battle-wrap.ts";
import { getKeptFightsFromStoredText } from "@/src/game/kept-fights.ts";
import { CAPTURED_FIGHTS, type CapturedFight } from "@/tests/captured-fight-catalog.ts";
import type { PageStorage } from "@/src/userscript-storage.ts";

/** A browser store that behaves, and one that can be told to stop. */
function composeFakeStorage(): PageStorage & { held: Map<string, string>; refuseAbove: number } {
  const held = new Map<string, string>();
  const storage = {
    held,
    refuseAbove: Number.POSITIVE_INFINITY,
    getItem: (key: string) => held.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (value.length > storage.refuseAbove) throw new DOMException("QuotaExceededError");
      held.set(key, value);
    },
    removeItem: (key: string) => void held.delete(key),
  };
  return storage;
}

function composePage() {
  const localStorage = composeFakeStorage();
  const sessionStorage = composeFakeStorage();
  return { localStorage, sessionStorage, page: { localStorage, sessionStorage } };
}

const FIGHTS_KEY = "margometer.kept-fights";
const SETTINGS_KEY = "margometer.fight-settings";

function composeSessionOfCapture(fight: CapturedFight): BattleSession {
  let session = composeEmptySession();
  for (const call of fight.dump.calls) {
    session = composeNextSession(session, getPayloadReading(call.payload));
  }
  return session;
}

const GROUP_FIGHT = CAPTURED_FIGHTS.find(
  (fight) => fight.name === "2026-08-06-tempest-grupa-vs-hildur",
)!;
const DUEL = CAPTURED_FIGHTS.find(
  (fight) => fight.name === "2026-08-11-tempest-tancerz-vs-wermont",
)!;

/** A finished fight, and the outcome the aggregate read off it. */
function composeFinished(capture: CapturedFight, fightsStarted: number) {
  const session = { ...composeSessionOfCapture(capture), fightsStarted };
  return { session, outcome: composeFightReading(session).statistics.outcome };
}

/** One recording kept as a finished fight, which is three lines everywhere below. */
function setKept(keeper: FightKeeper, capture: CapturedFight, fightsStarted: number): void {
  const { session, outcome } = composeFinished(capture, fightsStarted);
  keeper.setFightKept(session, outcome);
}

/** A clock that moves a minute every time it is asked, so rows sort and differ. */
function composeClock(): () => string {
  let minute = 0;
  return () => {
    const at = new Date(Date.UTC(2026, 7, 26, 19, minute));
    minute += 1;
    return at.toISOString();
  };
}

function composeKeeper(over: { isRefusingSettings?: boolean } = {}) {
  const { localStorage, sessionStorage, page } = composePage();
  const settingsStore = {
    getText: (key: string) => localStorage.getItem(key),
    /**
     * The answer this hands back is the whole of F1: a browser that will not keep
     * the reader's choice, which is the ordinary case on the origin the game
     * already fills (`src/userscript-storage.ts`).
     */
    setText: (key: string, text: string) => {
      if (over.isRefusingSettings === true) return false;
      localStorage.setItem(key, text);
      return true;
    },
    removeText: (key: string) => localStorage.removeItem(key),
  };
  let live: FightReading | null = null;
  const keeper = composeFightKeeper(page, settingsStore, () => live, composeClock());
  return {
    keeper,
    localStorage,
    sessionStorage,
    setLive: (reading: FightReading | null) => void (live = reading),
  };
}

describe("what the reader has chosen about keeping fights", () => {
  test("comes back as it was written", () => {
    const settings = { storage: "session" } as const;
    expect(getSettingsFromStoredText(composeStoredTextFromSettings(settings))).toEqual(settings);
  });

  test("defaults where nothing has been written", () => {
    expect(getSettingsFromStoredText("")).toEqual({ storage: "local" });
  });

  /** §9.6: validated on read, and never repaired into something near it. */
  test("refuses a place it cannot read", () => {
    expect(getSettingsFromStoredText('{"storage":"cookie"}')).toEqual({ storage: "local" });
    expect(getSettingsFromStoredText('{"storage":42}')).toEqual({ storage: "local" });
    expect(getSettingsFromStoredText("[]")).toEqual({ storage: "local" });
    expect(getSettingsFromStoredText("{")).toEqual({ storage: "local" });
  });

  /**
   * A limit is no longer the reader's to set, so an answer stored by a build that
   * still had the strip is not carried forward — obeying it would be the add-on
   * acting on a control that is not on the screen. Neither is it written back.
   */
  test("neither reads nor writes a limit an older build stored", () => {
    expect(getSettingsFromStoredText('{"storage":"session","keepLimit":3}')).toEqual({
      storage: "session",
    });
    expect(composeStoredTextFromSettings({ storage: "local" })).not.toContain("keepLimit");
  });
});

describe("a fight that is over", () => {
  test("is written down, and comes back off the shelf as a row", () => {
    const { keeper, localStorage } = composeKeeper();
    const { session, outcome } = composeFinished(GROUP_FIGHT, 1);
    keeper.setFightKept(session, outcome);

    expect(getKeptFightsFromStoredText(localStorage.held.get(FIGHTS_KEY) ?? "")).toHaveLength(1);
    const rows = keeper.shelf.getFights();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.isLive).toBe(false);
    expect(rows[0]?.at).not.toBeNull();
    expect(rows[0]?.sideCounts.length).toBeGreaterThan(1);
  });

  /**
   * A finished fight can be called into again. What must not happen is a second
   * row for it — and what must happen is that the newest messages are the ones
   * kept.
   */
  test("keeps its row when the same fight states more", () => {
    const { keeper } = composeKeeper();
    const { session, outcome } = composeFinished(GROUP_FIGHT, 1);
    keeper.setFightKept(session, outcome);
    keeper.setFightKept({ ...session, messages: [...session.messages, "0;0;txt=x"] }, outcome);
    expect(keeper.shelf.getFights()).toHaveLength(1);
  });

  test("gets a row of its own when it is a different fight", () => {
    const { keeper } = composeKeeper();
    setKept(keeper, GROUP_FIGHT, 1);
    setKept(keeper, DUEL, 2);
    expect(keeper.shelf.getFights()).toHaveLength(2);
  });

  test("stands above the ones before it", () => {
    const { keeper } = composeKeeper();
    setKept(keeper, DUEL, 1);
    const first = keeper.shelf.getFights()[0]?.id;
    setKept(keeper, DUEL, 2);
    expect(keeper.shelf.getFights()[0]?.id).not.toBe(first);
    expect(keeper.shelf.getFights()[1]?.id).toBe(first);
  });
});

describe("the fight happening now", () => {
  test("is the first row, and is the one the panel opens on", () => {
    const { keeper, setLive } = composeKeeper();
    setKept(keeper, DUEL, 1);
    setLive(composeFightReading({ ...composeSessionOfCapture(GROUP_FIGHT), fightsStarted: 2 }));

    const rows = keeper.shelf.getFights();
    expect(rows[0]?.isLive).toBe(true);
    expect(rows[0]?.isSelected).toBe(true);
    expect(rows[0]?.at).toBeNull();
  });

  test("is not a row at all before a payload has arrived", () => {
    const { keeper } = composeKeeper();
    expect(keeper.shelf.getFights()).toEqual([]);
  });

  /**
   * The whole point of `isLive` travelling back with the reading: without it a
   * payload landing while somebody reads a finished fight replaces their screen.
   */
  test("says so when it is chosen, and a kept fight says the opposite", () => {
    const { keeper, setLive } = composeKeeper();
    setKept(keeper, DUEL, 1);
    // The fight *after* the one that was kept, which is what the meter would be
    // holding — a live reading still counting the kept fight is the same fight,
    // and the shelf deliberately draws that as one row.
    setLive(composeFightReading({ ...composeSessionOfCapture(GROUP_FIGHT), fightsStarted: 2 }));
    const kept = keeper.shelf.getFights().find((fight) => !fight.isLive)!;

    const opened = keeper.shelf.onFightChosen(kept.id);
    expect(opened.isLive).toBe(false);
    expect(opened.reading).not.toBeNull();
    expect(keeper.shelf.getFights().find((fight) => fight.isLive)?.isSelected).toBe(false);

    const back = keeper.shelf.onFightChosen("live");
    expect(back.isLive).toBe(true);
    expect(back.reading).not.toBeNull();
  });

  test("a row for a fight that is no longer here changes nothing", () => {
    const { keeper, setLive } = composeKeeper();
    setLive(composeFightReading({ ...composeSessionOfCapture(GROUP_FIGHT), fightsStarted: 2 }));
    const chosen = keeper.shelf.onFightChosen("nobody");
    expect(chosen.reading).toBeNull();
    expect(chosen.isLive).toBe(true);
  });
});

describe("a fight that has ended but is still the one being counted", () => {
  /**
   * ⚠️ Driven in Firefox on 2026-08-26, where it drew twice — once as *teraz ·
   * trwa* and once under its own clock. A fight is over when it states a winner,
   * and it stays the live fight until the next one opens.
   */
  test("is one row, which says how it ended and can still be pinned", () => {
    const { keeper, setLive } = composeKeeper();
    const { session, outcome } = composeFinished(GROUP_FIGHT, 1);
    keeper.setFightKept(session, outcome);
    setLive(composeFightReading(session));

    const rows = keeper.shelf.getFights();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.isLive).toBe(true);
    expect(rows[0]?.isPinnable).toBe(true);
    expect(rows[0]?.outcome).not.toBeNull();
    expect(rows[0]?.isSelected).toBe(true);
  });

  test("stays the live fight when that one row is chosen", () => {
    const { keeper, setLive } = composeKeeper();
    const { session, outcome } = composeFinished(GROUP_FIGHT, 1);
    keeper.setFightKept(session, outcome);
    setLive(composeFightReading(session));

    const chosen = keeper.shelf.onFightChosen(keeper.shelf.getFights()[0]!.id);
    expect(chosen.isLive).toBe(true);
  });

  test("becomes a row of its own once the next fight opens", () => {
    const { keeper, setLive } = composeKeeper();
    const { session, outcome } = composeFinished(GROUP_FIGHT, 1);
    keeper.setFightKept(session, outcome);
    setLive(composeFightReading({ ...composeSessionOfCapture(DUEL), fightsStarted: 2 }));

    const rows = keeper.shelf.getFights();
    expect(rows).toHaveLength(2);
    expect(rows[0]?.isLive).toBe(true);
    expect(rows[0]?.isPinnable).toBe(false);
    expect(rows[1]?.isLive).toBe(false);
  });
});

describe("a fight read back off the shelf", () => {
  test("folds to what the fight itself folded to", () => {
    const { keeper } = composeKeeper();
    const { session, outcome } = composeFinished(GROUP_FIGHT, 1);
    keeper.setFightKept(session, outcome);

    const id = keeper.shelf.getFights()[0]!.id;
    const restored = keeper.shelf.onFightChosen(id).reading!;
    expect(restored.statistics).toEqual(composeFightReading(session).statistics);
  });

  test("is folded once, however often it is opened", () => {
    const { keeper } = composeKeeper();
    setKept(keeper, GROUP_FIGHT, 1);
    const id = keeper.shelf.getFights()[0]!.id;
    expect(keeper.shelf.onFightChosen(id).reading).toBe(keeper.shelf.onFightChosen(id).reading);
  });

  test("says how it ended, on the row and in the reading", () => {
    const { keeper } = composeKeeper();
    const { session, outcome } = composeFinished(GROUP_FIGHT, 1);
    expect(outcome).not.toBeNull();
    keeper.setFightKept(session, outcome);
    expect(keeper.shelf.getFights()[0]?.outcome).not.toBeNull();
  });
});

/**
 * ⚠️ **Twenty is spelled here, not imported.** The entry point holds the limit as
 * a constant of its own, and a test that read it back would hold the rotation and
 * the number to be the same thing and neither to be right (§7.5). So this file
 * states what the shelf is supposed to hold and the fights are counted against it.
 */
const KEPT_FIGHTS_LIMIT = 20;

describe("the rotation, which the reader no longer sets", () => {
  test("keeps no more than twenty", () => {
    const { keeper } = composeKeeper();
    for (let fight = 1; fight <= KEPT_FIGHTS_LIMIT + 2; fight += 1) {
      setKept(keeper, DUEL, fight);
    }
    expect(keeper.shelf.getFights()).toHaveLength(KEPT_FIGHTS_LIMIT);
  });

  test("never drops what the reader pinned", () => {
    const { keeper } = composeKeeper();
    setKept(keeper, DUEL, 1);
    const first = keeper.shelf.getFights()[0]!.id;
    keeper.shelf.onPinToggled(first);
    expect(keeper.shelf.getFights()[0]?.isPinned).toBe(true);

    for (let fight = 2; fight <= KEPT_FIGHTS_LIMIT + 2; fight += 1) {
      setKept(keeper, DUEL, fight);
    }
    expect(keeper.shelf.getFights().map((one) => one.id)).toContain(first);
  });

  /** The reader's explicit choice beats the automatic one, and the panel says so. */
  test("refuses a new fight rather than dropping a pinned one, and says which", () => {
    const { keeper } = composeKeeper();
    for (let fight = 1; fight <= KEPT_FIGHTS_LIMIT; fight += 1) setKept(keeper, DUEL, fight);
    for (const held of keeper.shelf.getFights()) keeper.shelf.onPinToggled(held.id);
    setKept(keeper, DUEL, KEPT_FIGHTS_LIMIT + 1);

    expect(keeper.shelf.getFights()).toHaveLength(KEPT_FIGHTS_LIMIT);
    expect(keeper.shelf.getReading().isEverySlotPinned).toBe(true);
    expect(keeper.shelf.getReading().hasStoreRefused).toBe(false);
  });

  test("a pin survives the same fight being kept again", () => {
    const { keeper } = composeKeeper();
    const { session, outcome } = composeFinished(DUEL, 1);
    keeper.setFightKept(session, outcome);
    keeper.shelf.onPinToggled(keeper.shelf.getFights()[0]!.id);
    keeper.setFightKept({ ...session, messages: [...session.messages, "0;0;txt=x"] }, outcome);
    expect(keeper.shelf.getFights()[0]?.isPinned).toBe(true);
  });
});

describe("when the browser will not take a fight", () => {
  test("the reader is told, and nothing throws", () => {
    const { keeper, localStorage } = composeKeeper();
    localStorage.refuseAbove = 10;
    expect(() => setKept(keeper, DUEL, 1)).not.toThrow();
    expect(keeper.shelf.getReading().hasStoreRefused).toBe(true);
  });

  /**
   * The budget's own job: a browser that takes two fights and refuses three keeps
   * two, rather than the shelf emptying itself over one bad write.
   */
  test("what fits is kept and the rest is given up", () => {
    const { keeper, localStorage } = composeKeeper();
    setKept(keeper, DUEL, 1);
    const oneFight = (localStorage.held.get(FIGHTS_KEY) ?? "").length;

    localStorage.refuseAbove = oneFight + 40;
    setKept(keeper, DUEL, 2);
    expect(keeper.shelf.getFights()).toHaveLength(1);
    expect(keeper.shelf.getReading().hasStoreRefused).toBe(false);
  });
});

describe("moving the fights to another place", () => {
  test("takes them with it and empties the one they came from", () => {
    const { keeper, localStorage, sessionStorage } = composeKeeper();
    setKept(keeper, DUEL, 1);
    expect(localStorage.held.has(FIGHTS_KEY)).toBe(true);

    keeper.shelf.onStorageChosen("session");
    expect(localStorage.held.has(FIGHTS_KEY)).toBe(false);
    expect(sessionStorage.held.has(FIGHTS_KEY)).toBe(true);
    expect(keeper.shelf.getFights()).toHaveLength(1);
    expect(keeper.shelf.getReading().storage).toBe("session");
  });

  /** A reader choosing *tylko teraz* is saying they want nothing left behind. */
  test("leaves nothing on disk where the reader asked for nothing on disk", () => {
    const { keeper, localStorage, sessionStorage } = composeKeeper();
    setKept(keeper, DUEL, 1);
    keeper.shelf.onStorageChosen("memory");
    expect(localStorage.held.has(FIGHTS_KEY)).toBe(false);
    expect(sessionStorage.held.has(FIGHTS_KEY)).toBe(false);
    expect(keeper.shelf.getFights()).toHaveLength(1);
  });

  /**
   * The answer itself stays where a browser keeps things for good: kept in the
   * place it names, it would be unreadable the moment somebody chose the place
   * that forgets.
   */
  test("the answer is remembered where it can be read next time", () => {
    const { keeper, localStorage } = composeKeeper();
    keeper.shelf.onStorageChosen("memory");
    expect(getSettingsFromStoredText(localStorage.held.get(SETTINGS_KEY) ?? "").storage).toBe(
      "memory",
    );
  });

  test("choosing the place it is already in changes nothing", () => {
    const { keeper, localStorage } = composeKeeper();
    setKept(keeper, DUEL, 1);
    const before = localStorage.held.get(FIGHTS_KEY);
    keeper.shelf.onStorageChosen("local");
    expect(localStorage.held.get(FIGHTS_KEY)).toBe(before);
  });
});

/**
 * The answer is what tells the next page where to look, so a refused one may not
 * be acted on: the fights would go somewhere nothing ever opens again, under a
 * panel drawing the choice as taken
 * (`docs/audits/2026-08-26-the-whole-tree-read-a-fifth-time.md`, F1).
 */
describe("when the browser will not keep the reader's choice", () => {
  test("the fights stay where they are and the panel says the place did not change", () => {
    const { keeper, localStorage, sessionStorage } = composeKeeper({ isRefusingSettings: true });
    setKept(keeper, DUEL, 1);
    keeper.shelf.onStorageChosen("session");

    expect(localStorage.held.has(FIGHTS_KEY)).toBe(true);
    expect(sessionStorage.held.has(FIGHTS_KEY)).toBe(false);
    expect(keeper.shelf.getReading().storage).toBe("local");
    expect(keeper.shelf.getReading().hasChoiceRefused).toBe(true);
  });

  /** §9.6: a failure is state, and a later answer that lands clears it. */
  test("a choice that lands afterwards clears it", () => {
    const { keeper } = composeKeeper();
    expect(keeper.shelf.getReading().hasChoiceRefused).toBe(false);
    keeper.shelf.onStorageChosen("session");
    expect(keeper.shelf.getReading().hasChoiceRefused).toBe(false);
  });
});
