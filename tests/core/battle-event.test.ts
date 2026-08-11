import { describe, expect, test } from "bun:test";
import { BATTLE_EVENT_KINDS } from "@/src/core/battle-event.ts";
import { decodeFight } from "@/src/core/fight-decoder.ts";
import { CAPTURED_FIGHTS } from "@/tests/captured-fight-catalog.ts";

const DECODED_FIGHTS = CAPTURED_FIGHTS.map((fight) => ({
  name: fight.name,
  messages: fight.dump.calls.flatMap((call) => call.protocolMessages),
  events: decodeFight(fight.dump.calls.flatMap((call) => call.protocolMessages)),
}));

describe("the event contract", () => {
  // The rule this project keeps relearning: a variant nothing produces stays
  // alive on our own test data, drags a branch of every consumer along with it,
  // and nobody notices until someone counts. Counting is this test.
/**
   * ⚠️ **`unknown-message` stopped being produced by the captures on 2026-08-11,
   * when the last key in them was read.** That is not the dead weight this test
   * hunts: it is what the decoder says when the game sends something new, and the
   * game will. So it is exempted here by name and produced on purpose below —
   * exempting it silently would have let a genuinely dead variant hide behind the
   * same excuse.
   */
  const FROM_A_LIVE_PROTOCOL = "unknown-message";

  test.each([...BATTLE_EVENT_KINDS].filter((kind) => kind !== FROM_A_LIVE_PROTOCOL))(
    "%s is produced by the decoder on real material",
    (kind) => {
      const produced = DECODED_FIGHTS.flatMap((fight) => fight.events).filter(
        (event) => event.kind === kind,
      );
      expect(produced.length).toBeGreaterThan(0);
    },
  );

  test("and the one the captures no longer carry is produced by a key the game never sent", () => {
    const [event] = decodeFight(["0;0;no_such_key=1"]);
    expect(event?.kind).toBe(FROM_A_LIVE_PROTOCOL);

    const fromMaterial = new Set(DECODED_FIGHTS.flatMap((fight) => fight.events).map((e) => e.kind));
    expect(fromMaterial.has(FROM_A_LIVE_PROTOCOL)).toBe(false);
  });

  test("the decoder produces no kind the contract does not declare", () => {
    const kinds = new Set(DECODED_FIGHTS.flatMap((fight) => fight.events).map((e) => e.kind));
    for (const kind of kinds) expect([...BATTLE_EVENT_KINDS]).toContain(kind);
    expect([...kinds].sort()).toEqual(
      [...BATTLE_EVENT_KINDS].filter((kind) => kind !== FROM_A_LIVE_PROTOCOL).sort(),
    );
  });
});

describe("over every captured fight", () => {
  // Nothing is dropped. Every message produces at least one event, whether or
  // not the decoder understood it — a message that yields nothing at all is
  // indistinguishable from a message that never arrived.
  test.each(DECODED_FIGHTS.map((fight) => [fight.name, fight] as const))(
    "%s: no message vanishes",
    (_name, fight) => {
      const silent = fight.messages.filter((message) => decodeFight([message]).length === 0);
      expect(silent).toEqual([]);
    },
  );

  test.each(DECODED_FIGHTS.map((f) => [f.name, f] as const))(
    "%s: every fight ends with a stated outcome",
    (_name, fight) => {
      const outcomes = fight.events.filter((event) => event.kind === "fight-outcome");
      expect(outcomes.map((event) => event.result).sort()).toEqual(["lost", "won"]);
      for (const outcome of outcomes) {
        expect(outcome.combatantNames.length).toBeGreaterThan(0);
        // Not merely non-empty: a name arriving with the separator's space still
        // attached would match every combatant against nothing later on.
        for (const name of outcome.combatantNames) {
          expect(name, outcome.result).toBe(name.trim());
          expect(name).not.toBe("");
        }
      }
    },
  );
});

/**
 * The reduction the protocol reports, against the reduction that actually
 * happened. Two figures meet here that the game never reconciles either, and the
 * gap between them is the finding: it is not ours to close.
 */
describe("damage a defence stopped, over every captured fight", () => {
  const ATTACKS = DECODED_FIGHTS.flatMap((fight) => fight.events).filter(
    (event) => event.kind === "attack",
  );
  const DEFENDED = ATTACKS.filter((attack) => attack.prevented.length > 0);

  function getTotal(amounts: readonly { amount: number }[]): number {
    return amounts.reduce((sum, one) => sum + one.amount, 0);
  }

  function getGap(attack: (typeof ATTACKS)[number]): number {
    return getTotal(attack.dealt) - getTotal(attack.taken);
  }

  test("occurs at all", () => {
    expect(DEFENDED.length).toBeGreaterThan(0);
  });

  // It is part of what the blow lost on its way to the target, so it can never
  // be more than the whole. Reading it into `taken` — the obvious mistake, and
  // the one that would inflate every defender's losses — breaks this at once.
  test("never exceeds what the blow lost between being dealt and being taken", () => {
    const over = DEFENDED.filter((attack) => getTotal(attack.prevented) > getGap(attack));
    expect(over.map((attack) => `${attack.actorId}->${attack.targetId}`)).toEqual([]);
  });

  // AGENTS.md §10 claimed that difference *was* the absorbed figure until this
  // was measured: it is wider in 62 of the 68 messages carrying a defence,
  // because armour and resistance reduce as well and the protocol reports
  // neither. Deriving "absorbed" from the gap would state a number nobody sent.
  test("is not that difference, because the protocol reports only part of the reduction", () => {
    const wider = DEFENDED.filter((attack) => getTotal(attack.prevented) < getGap(attack));
    expect(wider.length).toBeGreaterThan(DEFENDED.length / 2);
  });
});

/**
 * What the captures say about a skill announcement, re-earned rather than
 * quoted from the register: both properties below are why the decoder reads the
 * two keys as one fact and refuses a lone identifier.
 */
describe("a skill announcement, over every captured fight", () => {
  const MESSAGES = DECODED_FIGHTS.flatMap((fight) =>
    fight.messages.map((message) => ({ message, events: decodeFight([message]) })),
  );
  const ANNOUNCEMENTS = MESSAGES.filter((one) =>
    one.events.some((event) => event.kind === "skill-used"),
  );

  test("occurs at all", () => {
    expect(ANNOUNCEMENTS.length).toBeGreaterThan(0);
  });

  // The announcement is not the blow. Whatever the skill does arrives in later
  // messages and nothing in the protocol joins the two, so any consumer tying
  // damage back to a skill is inferring rather than reading.
  test("never carries damage of its own", () => {
    const carrying = ANNOUNCEMENTS.filter((one) =>
      one.events.some((event) => event.kind === "attack"),
    );
    expect(carrying.map((one) => one.message)).toEqual([]);
  });

  // The identifier is optional and the name is not, which is the whole reason
  // the event is built on the name. If a capture ever carries a lone id, the
  // decoder reports it unread — and this is where that would first show.
  test("never states an identifier without a name", () => {
    const lone = MESSAGES.filter(
      (one) =>
        !one.events.some((event) => event.kind === "skill-used") &&
        one.events.some(
          (event) => event.kind === "unknown-message" && event.reason.includes("skillId"),
        ),
    );
    expect(lone.map((one) => one.message)).toEqual([]);
  });
});

describe("decoding a single message", () => {
  test("reads the winners of a fight", () => {
    expect(decodeFight(["0;0;winner=Gracz 1, Gracz 2"])).toEqual([
      { kind: "fight-outcome", result: "won", combatantNames: ["Gracz 1", "Gracz 2"] },
    ]);
  });

  test("reads the losers of a fight", () => {
    expect(decodeFight(["0;0;loser=Locha"])).toEqual([
      { kind: "fight-outcome", result: "lost", combatantNames: ["Locha"] },
    ]);
  });

  test("reports a key it has no meaning for, naming the key", () => {
    // Invented on purpose. Every key the captured material carries is read now,
    // so the only honest example of an unread one is a key the game never sent.
    const [event] = decodeFight(["0;0;no_such_key=13"]);
    expect(event).toEqual({
      kind: "unknown-message",
      message: "0;0;no_such_key=13",
      reason: "no meaning yet for no_such_key",
      unreadKeys: ["no_such_key"],
    });
  });

  test("reads damage dealt and damage taken as separate figures", () => {
    expect(decodeFight(["482845=100.00;-161518=70.07;+dmgd=466;-dmgd=223"])).toEqual([
      {
        kind: "attack",
        actorId: 482845,
        targetId: -161518,
        dealt: [{ damageType: "dmgd", amount: 466 }],
        taken: [{ damageType: "dmgd", amount: 223 }],
        prevented: [],
        procs: [],
        destroyed: [],
        declared: [],
      },
    ]);
  });

  // The client recognises damage by shape, not from a list, so a kind it has
  // never sent before still decodes. Mirroring that is the point.
  test("reads a damage kind it has never seen before", () => {
    const [event] = decodeFight(["1=100.00;2=50.00;+dmgz=7"]);
    expect(event).toMatchObject({ dealt: [{ damageType: "dmgz", amount: 7 }] });
  });

  test("keeps each damage kind apart rather than summing them", () => {
    const [event] = decodeFight(["1=100.00;2=50.00;+dmgf=10;+dmgc=20"]);
    expect(event).toMatchObject({
      dealt: [
        { damageType: "dmgf", amount: 10 },
        { damageType: "dmgc", amount: 20 },
      ],
    });
  });

  // A damage key whose value will not read as a number is worse than an unknown
  // key: it looks like a figure and is not one.
  test("reports a damage key whose value is not a number instead of counting it", () => {
    const events = decodeFight(["1=100.00;2=50.00;+dmgf=lots"]);
    expect(events.map((event) => event.kind)).toEqual(["unknown-message"]);
  });

  // The expensive one, and the reason the decoder no longer calls `Number()`:
  // `Number("")` is `0`, `0` is a valid damage figure, and an empty field would
  // have arrived as a measurement nobody could tell from a real zero.
  test("reports an empty damage value rather than reading it as zero", () => {
    const events = decodeFight(["1=100.00;2=50.00;+dmgf="]);
    expect(events.map((event) => event.kind)).toEqual(["unknown-message"]);
  });

  test.each([" 5 ", "0x10", "1e3", "+5"])(
    "refuses a damage value of %p, which the protocol never writes",
    (value) => {
      const events = decodeFight([`1=100.00;2=50.00;+dmgf=${value}`]);
      expect(events.map((event) => event.kind)).toEqual(["unknown-message"]);
    },
  );

  // Absorption and a block ride the message that carries the blow and belong to
  // the target, as `taken` does. Kept out of `taken` on purpose: this is damage
  // that never landed, and adding it there would inflate the target's losses.
  test("reads what a defence stopped, apart from what the target took", () => {
    const [event] = decodeFight(["1=100.00;2=50.00;+dmg=10917;-absorb=7399;-dmg=2466"]);
    expect(event).toMatchObject({
      taken: [{ damageType: "dmg", amount: 2466 }],
      prevented: [{ prevention: "absorb", amount: 7399 }],
    });
  });

  test("keeps each defence apart rather than summing them", () => {
    const [event] = decodeFight(["1=100.00;2=50.00;+dmgd=809;-absorb=283;-absorbm=814;-dmgd=526"]);
    expect(event).toMatchObject({
      prevented: [
        { prevention: "absorb", amount: 283 },
        { prevention: "absorbm", amount: 814 },
      ],
    });
  });

  // Armour is in points and resistance in percentage points, so these are not
  // damage and cannot be totalled with it. The damage family is recognised by
  // characters 1 to 3, which are `acd` and `res` here — nothing was reading
  // them as figures before, and nothing may start.
  test("reads a statistic the blow destroyed without counting it as damage", () => {
    const [event] = decodeFight(["1=100.00;2=50.00;+dmgd=466;+acdmg=50;+resdmg=1"]);
    expect(event).toMatchObject({
      dealt: [{ damageType: "dmgd", amount: 466 }],
      destroyed: [
        { statistic: "acdmg", amount: 50 },
        { statistic: "resdmg", amount: 1 },
      ],
    });
  });

  test("reads an effect that fired with the blow and states no figure", () => {
    const [event] = decodeFight(["1=100.00;2=50.00;+crit;+pierce;+dmgd=466"]);
    expect(event).toMatchObject({ procs: ["crit", "pierce"] });
  });

  // Every occurrence in the captures arrives bare. A figure beside one is
  // something nothing here explains, and reading the key as a flag anyway would
  // drop that figure without a word.
  test("reports an effect that arrives with a figure rather than reading it as a flag", () => {
    const events = decodeFight(["1=100.00;2=50.00;+crit=1"]);
    expect(events.map((event) => event.kind)).toEqual(["unknown-message"]);
  });

  test("reports a defence whose value is not a number rather than counting it", () => {
    const events = decodeFight(["1=100.00;2=50.00;-absorb=plenty"]);
    expect(events.map((event) => event.kind)).toEqual(["unknown-message"]);
  });

  // Not in the captures, where every annotation rides a message that also
  // carries damage. It is a possible message rather than an impossible state,
  // and emitting nothing for it would drop a blow that did happen.
  test("reports an attack that carries an effect and no figures at all", () => {
    const [event] = decodeFight(["1=100.00;2=50.00;+crit"]);
    expect(event).toMatchObject({ kind: "attack", dealt: [], taken: [], procs: ["crit"] });
  });

  // Names here are invented, as the captures' player names are. The skill names
  // the protocol actually carries are the game's own and are not written down
  // in this repository — NOTICE.md.
  test("reads a skill announcement with the game's identifier for it", () => {
    expect(decodeFight(["467968=100.00;-10000249=100.00;tspell=Skill One;skillId=23"])).toEqual([
      {
        kind: "skill-used",
        actorId: 467968,
        targetId: -10000249,
        skillName: "Skill One",
        skillId: 23,
        declared: [],
      },
    ]);
  });

  // 15 of the 197 announcements in the captures carry no identifier, which is
  // why the name is what the event is built on rather than the other way round.
  test("reads an announcement that carries no identifier", () => {
    const [event] = decodeFight(["-10000249=100.00;0;tspell=Skill Two"]);
    expect(event).toMatchObject({ skillName: "Skill Two", skillId: null, targetId: null });
  });

  // The protocol has never sent one — 0 of 197 — so reading it would mean
  // describing a message nobody has seen, and inventing the name it lacks.
  //
  // The reason is asserted, not just the kind: without the branch that reports
  // it, this message produces no event at all and the decoder's last-resort
  // "carries no parameters" fallback answers with an `unknown-message` too. A
  // test reading only the kind passes on the wrong one — it did, until a
  // mutation lit nothing and said so.
  test("reports an identifier that arrives without a name, naming the key", () => {
    const [event] = decodeFight(["1=100.00;2=50.00;skillId=23"]);
    expect(event).toEqual({
      kind: "unknown-message",
      message: "1=100.00;2=50.00;skillId=23",
      reason: "no meaning yet for skillId",
      unreadKeys: ["skillId"],
    });
  });

  test("reports a blank name rather than announcing a skill nobody can name", () => {
    const [event] = decodeFight(["1=100.00;2=50.00;tspell=;skillId=23"]);
    expect(event).toMatchObject({
      kind: "unknown-message",
      reason: "no meaning yet for tspell, skillId",
    });
  });

  test("reports an identifier that is not a number rather than reading past it", () => {
    const events = decodeFight(["1=100.00;2=50.00;tspell=Skill One;skillId=twenty"]);
    expect(events.map((event) => event.kind)).toEqual(["skill-used", "unknown-message"]);
  });

  // Order is not guaranteed by anything, and the two keys are one fact.
  test("reads the two halves whichever way round they arrive", () => {
    const [event] = decodeFight(["1=100.00;2=50.00;skillId=23;tspell=Skill One"]);
    expect(event).toMatchObject({ skillName: "Skill One", skillId: 23 });
  });

  test("reports an empty side rather than a fight won by one nameless combatant", () => {
    const events = decodeFight(["0;0;winner="]);
    expect(events.map((event) => event.kind)).toEqual(["unknown-message"]);
  });

  test("reports damage against an empty name rather than attributing it to nobody", () => {
    const events = decodeFight(["1=100.00;2=50.00;+oth_dmg=5,f,(50.00%)"]);
    expect(events.map((event) => event.kind)).toEqual(["unknown-message"]);
  });

  // An id longer than 2^53 would come back as its nearest neighbour, which is a
  // combatant who does not exist. It is a format problem, so it becomes a loud
  // unknown rather than an exception travelling into the game.
  test("reports an id too large to read rather than attributing damage to its neighbour", () => {
    const [event] = decodeFight(["9007199254740993=100.00;0;+dmgf=5"]);
    expect(event?.kind).toBe("unknown-message");
    expect((event as { reason: string }).reason).toMatch(/unusable id/);
  });

  // The protocol names the recipient here instead of giving an id, and states
  // that combatant's health rather than the message target's.
  test("reads damage reported against a name", () => {
    expect(decodeFight(["447544=100.00;-10000249=71.86;+oth_dmg=247,a,Hildur(71.86%)"])).toEqual([
      {
        kind: "damage-to-named-combatant",
        actorId: 447544,
        targetName: "Hildur",
        // No roster was handed in, so the name resolves to nobody rather than
        // to a guess.
        targetId: null,
        targetHealthPercent: 71.86,
        damage: { damageType: "dmga", amount: 247 },
      },
    ]);
  });

  test("keeps a name the protocol states without a percentage", () => {
    const [event] = decodeFight(["1=100.00;2=50.00;+oth_dmg=5,f,Odyniec"]);
    expect(event).toMatchObject({ targetName: "Odyniec", targetHealthPercent: null });
  });

  test("reports damage against a name that arrives in the wrong shape", () => {
    const events = decodeFight(["1=100.00;2=50.00;+oth_dmg=5,f"]);
    expect(events.map((event) => event.kind)).toEqual(["unknown-message"]);
  });

  // Found by mutation testing: this used to trip an assertion and take the
  // panel down. A message with no parameters is odd but possible, so it is
  // reported like anything else the decoder cannot read.
  test("reports a message that carries no parameters at all", () => {
    expect(decodeFight(["0;0"])).toEqual([
      // No key to name — the message had none, which is not the same claim as
      // a key nobody has read yet.
      { kind: "unknown-message", message: "0;0", reason: "carries no parameters", unreadKeys: [] },
    ]);
  });

  // A bare `catch` would turn every failure into "the game changed its format",
  // including our own bugs. Here the parser fails for a reason that is not a
  // format problem at all, and it has to travel rather than be relabelled.
  test("lets a failure that is not a format problem travel instead of relabelling it", () => {
    const notAMessage = null as unknown as string;
    expect(() => decodeFight([notAMessage])).toThrow(TypeError);
  });

  test("reports a message it cannot even read as a message", () => {
    const [event] = decodeFight(["winner;0;step"]);
    expect(event?.kind).toBe("unknown-message");
    expect((event as { reason: string }).reason).toMatch(/side segment/);
  });

  // Half understood is not understood. Without this, a message carrying one
  // known key beside three unknown ones would look fully read.
  test("reports the unread keys of a message it partly understood", () => {
    const events = decodeFight(["0;0;winner=Gracz 1;no_such_key=13"]);
    expect(events.map((event) => event.kind)).toEqual(["fight-outcome", "unknown-message"]);
  });
});
