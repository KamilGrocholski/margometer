/**
 * How a recording from the add-on becomes material in this repository.
 *
 * The add-on writes what the game sent, unredacted, to a file that never leaves
 * the machine it was made on. This is the other end: two redactions, and then a
 * file in `tests/captured-fights/`.
 *
 *     bun tools/captured-fight-intake.ts <recording.json> --name <slug>
 *
 * ⚠️ **This is not "editing the evidence", and the boundary is the same one
 * `src/game/fight-capture.ts` thins on.** §9.2 forbids cutting what is
 * *inconvenient* — someone deleting a call so a test goes green. Both redactions
 * here are deterministic, independent of whether anything is passing, and stated
 * in the file itself (`pseudonimow`, `opisow`). No number and no id moves, so
 * every claim the recording could support, it still supports.
 *
 * ⚠️ **Neither redaction is complete, and no test can make them so.** Each knows
 * one place: names tied to a combatant id, and `ladunek.skills`. A nickname that
 * belongs to nobody in the roster — someone who left before the first snapshot, a
 * name inside a loot message — walks through untouched. That is why the tool ends
 * by naming the step that is a person's, and why the step is not optional.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { composeIntegerText, getIntegerFromValue } from "@/libs/number.ts";
import { getValueFromJsonText } from "@/libs/json.ts";
import { getMillisecondsFromIsoText } from "@/libs/timestamp.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";
import { getRecordFromValue } from "@/libs/record.ts";

export class CapturedFightIntakeError extends MargoMeterToolError {
  constructor(reason: string, options?: ErrorOptions) {
    super("CapturedFightIntake", reason, options);
  }
}

/** Where material lives. The one directory §4 asks before touching. */
const CAPTURED_FIGHTS_DIRECTORY = "tests/captured-fights/";

/**
 * What replaces an ability description.
 *
 * Visible on purpose: a blank would read as "the game sent nothing here", and a
 * recording that lies about what the server said is worse than one with a gap in
 * it that says so.
 */
export const REMOVED_DESCRIPTION = "(description from the game — removed, NOTICE.md)";

/**
 * Every marker that means "a description already came out here".
 *
 * ⚠️ **The second one is Polish, and it is not a style slip.** It is what the
 * previous incarnation's tooling wrote, and it is sitting in
 * `tests/captured-fights/2026-08-06-tempest-grupa-vs-hildur.json` five times over.
 * Recognising only the current marker would make this tool remove that one as if
 * it were prose from the game — reporting five descriptions taken out of a file
 * that has none left, and quietly rewriting evidence to match today's spelling.
 *
 * Editing the material to carry the newer marker was the other way out, and it is
 * the one §9.2 forbids: what is in those files is what was captured, and their
 * age is a fact about them.
 */
const REMOVED_DESCRIPTIONS: readonly string[] = [
  REMOVED_DESCRIPTION,
  "(opis z gry — zdjęty, NOTICE.md)",
];

/**
 * Fields of one ability inside `ladunek.skills`, and which of them is the prose.
 *
 * ⚠️ **A claim about the game.** Measured on the recording of 2026-08-06 (world
 * `tempest`, build `1785244275300`): the array holds 70 fields for 7 abilities,
 * and within a group come id, name, two numbers, one more, the DESCRIPTION,
 * requirements (`reqp=h;lvl=25`), progress (`1/10`), parameters
 * (`red-sa=16;cooldown=5`) and an empty. Read off the material, not out of the
 * game's help — the help does not describe the payload's shape in a single
 * sentence.
 */
const FIELDS_PER_ABILITY = 10;
const DESCRIPTION_FIELD = 5;

export type Pseudonymisation = {
  dump: unknown;
  /** How many occurrences were replaced. Zero means there is nothing left to do. */
  changed: number;
  /** Which name became which label. Goes to the screen and nowhere else. */
  substitutions: Map<string, string>;
};

/**
 * The recording with every player's name replaced by `Gracz 1`, `Gracz 2`, …
 *
 * **Why at all.** The repository is public and a capture goes into git forever,
 * so the first mistake is the permanent one. A nickname is a person's, and the
 * people in a group fight had no way to agree to this.
 *
 * **Pseudonymisation, not anonymisation, and the difference is worth saying out
 * loud.** Ids stay: they are what the protocol identifies combatants by
 * (`482845=100.00;…`) and what the health witness stands on. The game can still
 * map an id back to a nickname. What goes is what identifies a person to someone
 * reading GitHub.
 *
 * **`npc` decides who is a player, and nothing else does.** The tempting rule —
 * "a negative id is a monster" — would be a claim about the game that nobody
 * measured, and it is wrong in both directions at once: guess one way and the
 * material is corrupted, guess the other and a nickname enters the repository.
 * `npc` rides only in `ladunek.w`, so a combatant it cannot be read for **stops
 * the write**.
 *
 * **The substitution walks the whole document, not just `w`.** A name sits in
 * `ladunek.w.<id>.name`, in both snapshots, and inside messages (`winner=`,
 * `loser=`, `txt=`). Object *keys* are left alone — they are ids. `replaceAll`
 * rather than a pattern, because nicknames in this game contain brackets and
 * dots; longest name first, so a nickname that is a substring of another does not
 * mutilate it.
 *
 * A digit rather than a letter: `Gracz A`…`Gracz G` mean specific fixed people
 * throughout this repository's prose (`NOTICE.md`), while labels here are local
 * to one file. The same text meaning two things drifts apart silently.
 */
export function composePseudonymisedDump(dump: unknown): Pseudonymisation {
  const isPlayerById = new Map<number, boolean>();
  /**
   * ⚠️ **A set of names per id, not one name.** Keeping only the last would let a
   * nickname that appears in an earlier snapshot of the same combatant walk
   * through the substitution untouched, and nothing downstream would notice.
   */
  const namesById = new Map<number, Set<string>>();

  const setName = (id: number, name: unknown): void => {
    if (typeof name !== "string" || name === "") return;
    const known = namesById.get(id) ?? new Set<string>();
    known.add(name);
    namesById.set(id, known);
  };

  for (const call of getCalls(dump)) {
    const combatants = getRecordFromValue(call["ladunek"])?.["w"];
    for (const [key, raw] of Object.entries(getRecordFromValue(combatants) ?? {})) {
      const combatant = getRecordFromValue(raw);
      if (combatant === null) continue;
      const id = getIntegerFromValue(combatant["id"]) ?? getIntegerFromValue(key);
      if (id === null) continue;
      const npc = getIntegerFromValue(combatant["npc"]);
      if (npc !== null) isPlayerById.set(id, npc === 0);
      setName(id, combatant["name"]);
    }

    for (const raw of [...getArray(call["wojownicyPrzed"]), ...getArray(call["wojownicyPo"])]) {
      const combatant = getRecordFromValue(raw);
      const id = combatant === null ? null : getIntegerFromValue(combatant["id"]);
      if (combatant === null || id === null) continue;
      setName(id, combatant["name"]);
    }
  }

  // Numeric, not the default lexicographic sort: these are ids, and `-161518`
  // sorting between `-1` and `-2` would number the labels by their spelling.
  const undecided = [...namesById.keys()]
    .filter((id) => !isPlayerById.has(id))
    .sort((one, other) => one - other);
  if (undecided.length > 0) {
    throw new CapturedFightIntakeError(
      `cannot tell whether combatant ${undecided.join(", ")} is a player or a monster — ` +
        "`npc` rides only in `ladunek.w` and those ids are not there. Guessing one way " +
        "corrupts the material, the other lets a nickname into the repository.",
    );
  }

  const substitutions = new Map<string, string>();
  const players = [...namesById.keys()].filter((id) => isPlayerById.get(id) === true).sort((one, other) => one - other);
  players.forEach((id, order) => {
    const label = `Gracz ${composeIntegerText(order + 1)}`;
    for (const name of namesById.get(id) ?? []) {
      // Two players under one name cannot be told apart by a text substitution:
      // `w` separates them by id, but a message carries only the text. Refuse.
      if (substitutions.has(name) && substitutions.get(name) !== label) {
        throw new CapturedFightIntakeError(
          `two players share the name \`${name}\` — a text substitution has no way to separate them`,
        );
      }
      substitutions.set(name, label);
    }
  });

  const pairs = [...substitutions]
    .filter(([name, label]) => name !== label)
    .sort((one, other) => other[0].length - one[0].length);
  // A name that is also somebody's replacement label would turn the substitution
  // into a permutation applied in sequence, and one of those mutilates itself. It
  // cannot happen in a file from the add-on; it can in one edited by hand.
  const labels = new Set(pairs.map(([, label]) => label));
  const collision = pairs.find(([name]) => labels.has(name));
  if (collision !== undefined) {
    throw new CapturedFightIntakeError(
      `the name \`${collision[0]}\` is also a replacement label — the file looks hand-edited, ` +
        "and a sequential substitution cannot be done safely then",
    );
  }

  let changed = 0;
  const composeSubstitutedText = (text: string): string => {
    let result = text;
    for (const [name, label] of pairs) {
      const found = result.split(name).length - 1;
      if (found === 0) continue;
      changed += found;
      result = result.replaceAll(name, label);
    }
    return result;
  };

  return { dump: composeMappedValue(dump, composeSubstitutedText), changed, substitutions };
}

export type DescriptionRemoval = { dump: unknown; removed: number };

/**
 * The recording without the ability descriptions the game wrote.
 *
 * **The reason is licensing, not caution.** `ladunek.skills` carries whole
 * sentences by the game's authors. That is someone else's work, and it has no
 * business in a public MIT repository — the same ground as `NOTICE.md` gives for
 * the client's rendered sentences.
 *
 * **Untouched:** the ability's id, its NAME, requirements, progress and
 * parameters. Those are functional names, not prose — the same boundary that
 * keeps `+abdest` and drops the sentence the client builds from it. The name also
 * stays because the protocol carries it independently (`tspell=`), so cutting it
 * here would change nothing.
 *
 * **An unfamiliar shape stops the write.** Groups of ten is a claim about the
 * game (above), so an array that does not divide by ten is one this function does
 * not understand — and quietly cutting field 5 out of some other layout would
 * remove the wrong thing, on evidence.
 */
export function removeSkillDescriptions(dump: unknown): DescriptionRemoval {
  let removed = 0;

  for (const call of getCalls(dump)) {
    const payload = getRecordFromValue(call["ladunek"]);
    const abilities = payload === null ? null : payload["skills"];
    if (!Array.isArray(abilities)) continue;

    if (abilities.length % FIELDS_PER_ABILITY !== 0) {
      throw new CapturedFightIntakeError(
        `\`ladunek.skills\` holds ${composeIntegerText(abilities.length)} fields, which is not a whole ` +
          `number of groups of ${composeIntegerText(FIELDS_PER_ABILITY)} — the layout this tool was ` +
          "measured against changed, and cutting a field out of an unknown one removes the wrong thing",
      );
    }

    for (let field = DESCRIPTION_FIELD; field < abilities.length; field += FIELDS_PER_ABILITY) {
      if (typeof abilities[field] !== "string" || abilities[field] === "") continue;
      if (REMOVED_DESCRIPTIONS.includes(abilities[field] as string)) continue;
      abilities[field] = REMOVED_DESCRIPTION;
      removed += 1;
    }
  }

  return { dump, removed };
}

/**
 * Both redactions, in the order that matters.
 *
 * Nicknames first: any other order leaves a step where a real nickname is still
 * in the data "only for a moment", and a moment is enough for whatever runs next
 * to write it somewhere. Counts are summed rather than overwritten, so a file put
 * through this twice still says how much was replaced in total.
 */
export function composeIntakeText(dump: unknown): {
  text: string;
  changed: number;
  removed: number;
  substitutions: Map<string, string>;
} {
  const named = composePseudonymisedDump(dump);
  const described = removeSkillDescriptions(named.dump);
  const header = getRecordFromValue(described.dump);
  if (header === null) {
    throw new CapturedFightIntakeError("the recording is not an object");
  }

  const written = {
    ...header,
    pseudonimow: (getIntegerFromValue(header["pseudonimow"]) ?? 0) + named.changed,
    opisow: (getIntegerFromValue(header["opisow"]) ?? 0) + described.removed,
  };
  return {
    // Indented, so a difference between two recordings is something a person can
    // read. It costs bytes and buys the only kind of review this material gets.
    text: `${JSON.stringify(written, null, 2)}\n`,
    changed: named.changed,
    removed: described.removed,
    substitutions: named.substitutions,
  };
}

/**
 * The name material enters the repository under: the day it was recorded, the
 * world it came from, and what a person called it.
 */
export function composeIntakePath(dump: unknown, slug: string): string {
  const header = getRecordFromValue(dump);
  const recordedAt = header === null ? null : header["przy"];
  if (typeof recordedAt !== "string" || getMillisecondsFromIsoText(recordedAt) === null) {
    throw new CapturedFightIntakeError("`przy` is not a timestamp — the recording says nothing about when");
  }
  const world = header?.["swiat"];
  if (typeof world !== "string" || world === "") {
    throw new CapturedFightIntakeError("`swiat` is missing — the recording says nothing about where");
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    throw new CapturedFightIntakeError(`\`--name ${slug}\` is not a kebab-case slug`);
  }
  return `${CAPTURED_FIGHTS_DIRECTORY}${recordedAt.slice(0, 10)}-${world}-${slug}.json`;
}

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getCalls(dump: unknown): Record<string, unknown>[] {
  const calls = getRecordFromValue(dump)?.["wpisy"];
  return getArray(calls)
    .map(getRecordFromValue)
    .filter((call): call is Record<string, unknown> => call !== null);
}

/** Every string in the document, mapped. Keys are left alone — they are ids. */
function composeMappedValue(value: unknown, composeText: (text: string) => string): unknown {
  if (typeof value === "string") return composeText(value);
  if (Array.isArray(value)) return value.map((one) => composeMappedValue(one, composeText));
  const object = getRecordFromValue(value);
  if (object === null) return value;
  return Object.fromEntries(
    Object.entries(object).map(([key, one]) => [key, composeMappedValue(one, composeText)]),
  );
}

function writeIntake(source: string, slug: string): void {
  const { value, syntaxError } = getValueFromJsonText(readFileSync(source, "utf8"));
  if (syntaxError !== null) {
    throw new CapturedFightIntakeError(`${source} is not JSON`, { cause: syntaxError });
  }

  const target = composeIntakePath(value, slug);
  // Material is never overwritten. A recording already in the repository is
  // evidence somebody may have written a test against.
  if (existsSync(target)) {
    throw new CapturedFightIntakeError(`${target} already exists — material is not overwritten`);
  }

  const intake = composeIntakeText(value);
  writeFileSync(target, intake.text);

  console.log(`wrote ${target}`);
  console.log(
    `  ${composeIntegerText(intake.changed)} nickname occurrences substituted, ` +
      `${composeIntegerText(intake.removed)} ability descriptions removed`,
  );
  // To the screen and nowhere else. A dictionary tying a nickname to a label
  // would be worse to keep than the nickname was.
  for (const [name, label] of intake.substitutions) console.log(`  ${name} → ${label}`);
  console.log("");
  console.log("Still yours, and no test closes it: read `txt=`, `shout=` and `loser=` in");
  console.log("`komunikaty` with your eyes. The substitution knows only names tied to a");
  console.log("combatant id, so a nickname belonging to nobody in the roster walks through it.");
}

if (import.meta.main) {
  const [source, ...rest] = process.argv.slice(2);
  const slug = rest[0] === "--name" ? rest[1] : undefined;
  if (source === undefined || slug === undefined) {
    console.log("usage: bun tools/captured-fight-intake.ts <recording.json> --name <slug>");
  } else {
    writeIntake(source, slug);
  }
}
