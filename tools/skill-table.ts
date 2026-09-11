/**
 * Every skill the game publishes, and the turns each of its effects is stated to run for.
 *
 *     deno task game:skills status | fetch | freeze
 *
 * The published table is the only source that states a duration: an effect reads `key=value@turns`,
 * once per skill level. Ids, effect keys and those turns are kept; the description column is the
 * game's own prose and stays in the cache (`SECURITY.md`, `NOTICE.md`).
 */

import { assert, assertStrictEquals } from "@std/assert";
import { parseArgs } from "@std/cli";
import { getTextFromHtml } from "@/libs/html-text.ts";
import { composeJsonWriting, getJsonReading } from "@/libs/json-text.ts";
import { composeIntegerText, getIntegerFromText } from "@/libs/number-text.ts";
import { getNumberFromUnknown, getTextFromUnknown, isRecord } from "@/libs/unknown-reading.ts";
import {
    composeAuraTurnsBySkillId,
    getStatedTurnsFromEffects,
    PROVOCATION_KEY,
    type SkillEffectTurns,
} from "@/src/core/aura-standing.ts";
import { GameUnreachableError, SkillTableError } from "@/tools/margometer-tool-error.ts";

const SKILLS_URL = "https://public-api.margonem.pl/we_get/skills/";
/** Ignored by git, and exported for the reason `tools/game-client-source.ts` gives for its own. */
export const CACHE_ROOT = ".cache/skills/";
const MANIFEST_NAME = "provenance.json";
const PAGE_NAME = "skills.html";
export const FROZEN_PATH = "frozen/skill-durations.ts";
export const FROZEN_AURA_PATH = "frozen/aura-turns.ts";

const ROW_OPEN = "<tr>";
const CELL_OPEN = "<td>";
const CELL_CLOSE = "</td>";

/**
 * The columns the page serves, in the order it serves them. Only two are read; the rest are named
 * so a page that gains or loses one is refused here rather than silently read off by one — the
 * failure that would otherwise freeze a description where the effects were.
 */
const COLUMNS = ["id", "tags", "name", "description", "profession", "levels", "effects", "needs"];
const IDENTITY_COLUMN = 0;
const EFFECTS_COLUMN = 6;

const EFFECT_TERMINATOR = ";";
const EFFECT_ASSIGNMENT = "=";
const LEVEL_SEPARATOR = ",";
const DURATION_MARKER = "@";

/** Past the row, cell and effect counts the page has ever served, so each walk is bounded. */
const MAXIMUM_ROWS = 4096;
const MAXIMUM_CELLS = 64;
const MAXIMUM_EFFECTS = 64;

export interface CachedSkillTable {
    url: string;
    fetchedAt: string;
    pagePath: string;
    pageLength: number;
}

/**
 * One effect as the table states it, level by level. `SkillEffectTurns` is what the rest of the
 * tree reads; the amounts stay here, because one key states a count in them and no other does.
 */
export interface SkillEffectReading extends SkillEffectTurns {
    /** The value in front of the `@` at each level, where the level states one. */
    amounts: readonly number[];
}

export interface SkillReading {
    id: number;
    effects: readonly SkillEffectReading[];
}

function composeCachePath(name: string): string {
    assert(name.length > 0, "a cached file is asked for by name");
    assert(CACHE_ROOT.endsWith("/"), "and the cache is a directory");
    return `${CACHE_ROOT}${name}`;
}

/** The cells of one row, as the text a person would have seen in each. */
function readCellsFromRow(row: string): string[] {
    const cells: string[] = [];
    let from = 0;
    for (let look = 0; look < MAXIMUM_CELLS; look += 1) {
        const open = row.indexOf(CELL_OPEN, from);
        if (open === -1) break;
        const close = row.indexOf(CELL_CLOSE, open + CELL_OPEN.length);
        if (close === -1) break;
        cells.push(getTextFromHtml(row.slice(open + CELL_OPEN.length, close)));
        from = close + CELL_CLOSE.length;
    }
    assert(cells.length <= MAXIMUM_CELLS, "a row stays inside its stated bound");
    assert(from <= row.length, "and the walk stays inside what it walked");
    return cells;
}

/** `key=value@turns,value@turns` — the turns each level states, and none where it states none. */
function readEffectFromText(text: string): SkillEffectReading | null {
    const at = text.indexOf(EFFECT_ASSIGNMENT);
    if (at <= 0) return null;
    const key = text.slice(0, at).trim();
    if (key.length === 0) return null;
    const turns: number[] = [];
    const amounts: number[] = [];
    for (const level of text.slice(at + 1).split(LEVEL_SEPARATOR)) {
        const marked = level.indexOf(DURATION_MARKER);
        if (marked === -1) continue;
        const stated = getIntegerFromText(level.slice(marked + 1).trim());
        if (stated === null) continue;
        turns.push(stated);
        const amount = getIntegerFromText(level.slice(0, marked).trim());
        if (amount !== null) amounts.push(amount);
    }
    assert(key.length > 0, "an effect that was read is named");
    assert(amounts.length <= turns.length, "an amount is read only beside a duration");
    return { key, turns, amounts };
}

function readEffectsFromCell(cell: string): SkillEffectReading[] {
    const found: SkillEffectReading[] = [];
    for (const stated of cell.split(EFFECT_TERMINATOR)) {
        assert(found.length <= MAXIMUM_EFFECTS, "a skill stays inside its stated bound");
        const effect = readEffectFromText(stated.trim());
        if (effect === null) continue;
        found.push(effect);
    }
    assert(MAXIMUM_EFFECTS > 0, "and the walk was given a bound to stay inside");
    return found;
}

/**
 * A page that is no longer this shape is refused rather than read off by one: a row is taken only
 * when it carries exactly the columns named above.
 */
export function readSkillsFromPage(html: string): SkillReading[] {
    const found: SkillReading[] = [];
    const rows = html.split(ROW_OPEN);
    assert(rows.length <= MAXIMUM_ROWS, "the page stays inside its stated bound");
    for (const row of rows.slice(1)) {
        const cells = readCellsFromRow(row);
        if (cells.length !== COLUMNS.length) continue;
        const id = getIntegerFromText((cells[IDENTITY_COLUMN] ?? "").trim());
        if (id === null) continue;
        found.push({ id, effects: readEffectsFromCell(cells[EFFECTS_COLUMN] ?? "") });
    }
    if (found.length === 0) {
        throw new SkillTableError(
            `the skill table served no row of ${composeIntegerText(COLUMNS.length)} columns`,
        );
    }
    assertStrictEquals(new Set(found.map((one) => one.id)).size, found.length, "a skill once");
    return found;
}

export function requireCachedSkillTable(value: unknown): CachedSkillTable {
    if (!isRecord(value)) throw new SkillTableError("the skill cache states no manifest");
    const url = getTextFromUnknown(value["url"]);
    const fetchedAt = getTextFromUnknown(value["fetchedAt"]);
    const pagePath = getTextFromUnknown(value["pagePath"]);
    const pageLength = getNumberFromUnknown(value["pageLength"]);
    if (url === null) throw new SkillTableError("the skill cache names no url");
    if (fetchedAt === null) throw new SkillTableError("the skill cache carries no date");
    if (pagePath === null) throw new SkillTableError("the skill cache names no page");
    if (pageLength === null) throw new SkillTableError("the skill cache states no length");
    assert(fetchedAt.length > 0, "a cached reading carries the date it was taken on");
    assert(pagePath.length > 0, "and names the file it was written to");
    return { url, fetchedAt, pagePath, pageLength };
}

/** Null where nothing is cached, which is a state and not a failure — **E7**. */
export function getCachedSkillTable(): CachedSkillTable | null {
    let text: string;
    // A cache that is not there is the answer, and nothing else here reads a file.
    try {
        text = Deno.readTextFileSync(composeCachePath(MANIFEST_NAME));
    } catch {
        return null;
    }
    const reading = getJsonReading(text);
    if (!reading.isOk) throw new SkillTableError("the skill manifest is not JSON");
    assert(text.length > 0, "a manifest that was read says something");
    return requireCachedSkillTable(reading.value);
}

export async function writeSkillTableCache(): Promise<CachedSkillTable> {
    let response: Response;
    // The network, which is `tools/`'s own boundary — **E5**.
    try {
        response = await fetch(SKILLS_URL);
    } catch (cause) {
        throw new GameUnreachableError(`${SKILLS_URL} did not answer`, { cause });
    }
    if (!response.ok) {
        throw new GameUnreachableError(`${SKILLS_URL} answered ${response.status}`);
    }
    const html = await response.text();
    const pagePath = composeCachePath(PAGE_NAME);
    Deno.mkdirSync(CACHE_ROOT, { recursive: true });
    Deno.writeTextFileSync(pagePath, html);
    const cached: CachedSkillTable = {
        url: SKILLS_URL,
        fetchedAt: new Date().toISOString(),
        pagePath,
        pageLength: html.length,
    };
    const written = composeJsonWriting(cached, 2);
    if (!written.isOk) throw new SkillTableError("the skill manifest could not be written");
    Deno.writeTextFileSync(composeCachePath(MANIFEST_NAME), `${written.text}\n`);
    assert(html.length > 0, "a page that was fetched says something");
    assert(cached.fetchedAt.length > 0, "and is dated by the fetch that took it");
    return cached;
}

/** The page as it was cached, refused rather than guessed at where nothing is. */
export function requireCachedSkills(): { cached: CachedSkillTable; skills: SkillReading[] } {
    const cached = getCachedSkillTable();
    if (cached === null) {
        throw new SkillTableError("nothing cached — run `deno task game:skills fetch` first");
    }
    const html = Deno.readTextFileSync(cached.pagePath);
    assert(html.length > 0, "a cached page says something");
    assert(cached.pageLength >= 0, "and was measured when it was written");
    return { cached, skills: readSkillsFromPage(html) };
}

export const FROZEN_SKILL_BANNER =
    "// Generated by `deno task game:skills freeze`. Do not edit by hand.\n//\n" +
    "// Ids, effect keys and stated turns only, and `tools/skill-table.ts` says why the\n" +
    "// description column the page serves beside them stays in the cache.\n";

/** Why the date is the page's and not the reader's, said in the file a reader opens. */
const DATE_NOTE =
    "    /** When the page these were read from was fetched, not when a person read it. */";

const FROZEN_AURA_BANNER =
    "// Generated by `deno task game:skills freeze`. Do not edit by hand.\n//\n" +
    "// The skills whose effects reach more than one combatant, and the turns the published\n" +
    "// table states each runs for. `src/core/aura-standing.ts` owns which keys those are.\n" +
    "//\n// A shout states a count of characters where the others state a share, so it is\n" +
    "// frozen apart: its own turns, and the fewest it covers at any level.\n";

/**
 * One effect to a line, whatever a skill states. A generated file the formatter would rewrite
 * fails the gate on the run after it is generated, so the shape written is the shape `deno fmt`
 * leaves alone.
 */
function composeFrozenSkills(skills: readonly SkillReading[]): string {
    const lines: string[] = [];
    for (const skill of skills) {
        lines.push(`        {`);
        lines.push(`            id: ${composeIntegerText(skill.id)},`);
        lines.push(`            effects: [`);
        for (const effect of skill.effects) {
            const turns = effect.turns.map((one) => composeIntegerText(one)).join(", ");
            lines.push(
                `                { key: ${JSON.stringify(effect.key)}, turns: [${turns}] },`,
            );
        }
        lines.push(`            ],`);
        lines.push(`        },`);
    }
    assert(skills.length > 0, "a frozen reading holds the skills the page served");
    assert(lines.length >= skills.length, "and writes at least a line for each");
    return lines.join("\n");
}

/** The small table the bundle carries: the skills reaching a side, and nothing else. */
export function composeAuraSkills(
    skills: readonly SkillReading[],
): { id: number; turns: number }[] {
    const found: { id: number; turns: number }[] = [];
    for (const skill of skills) {
        const turns = getStatedTurnsFromEffects(skill.effects);
        if (turns === null) continue;
        found.push({ id: skill.id, turns });
    }
    assert(found.length <= skills.length, "no more skills reach a side than the page served");
    assert(composeAuraTurnsBySkillId(found).size === found.length, "and each is named once");
    return found;
}

/**
 * What the table states about a shout, which is a different reading from every other key here:
 * the value in front of the `@` is a **count of characters** rather than a share.
 *
 * The turns are the longest stated, as an aura's are. The coverage is the **fewest** stated,
 * because the panel does not know the caster's skill level and may only rely on what holds at
 * every one of them. Measured 2026-09-08: both skills state 3 turns at all ten levels, and a
 * coverage rising from 6 to 10.
 */
export function composeShoutSkills(
    skills: readonly SkillReading[],
): { id: number; turns: number; coverageMinimum: number }[] {
    const found: { id: number; turns: number; coverageMinimum: number }[] = [];
    for (const skill of skills) {
        const shout = skill.effects.find((one) => one.key === PROVOCATION_KEY);
        if (shout === undefined) continue;
        if (shout.turns.length === 0) continue;
        if (shout.amounts.length === 0) continue;
        found.push({
            id: skill.id,
            turns: Math.max(...shout.turns),
            coverageMinimum: Math.min(...shout.amounts),
        });
    }
    assert(found.length <= skills.length, "no more skills shout than the page served");
    assert(found.every((one) => one.coverageMinimum > 0), "and a shout covers somebody");
    return found;
}

export function writeFrozenSkillTable(): { fetchedAt: string; skills: number; auras: number } {
    const { cached, skills } = requireCachedSkills();
    const auras = composeAuraSkills(skills);
    const shouts = composeShoutSkills(skills);
    Deno.writeTextFileSync(
        FROZEN_PATH,
        `${FROZEN_SKILL_BANNER}\nexport const FROZEN_SKILL_DURATIONS = {\n` +
            `${DATE_NOTE}\n` +
            `    fetchedAt: ${JSON.stringify(cached.fetchedAt)},\n    skills: [\n` +
            `${composeFrozenSkills(skills)}\n    ],\n} as const;\n`,
    );
    const rows = auras
        .map((one) => `        { id: ${composeIntegerText(one.id)}, turns: ${one.turns} },`)
        .join("\n");
    const shouted = shouts
        .map((one) =>
            `        { id: ${composeIntegerText(one.id)}, turns: ${one.turns}, ` +
            `coverageMinimum: ${one.coverageMinimum} },`
        )
        .join("\n");
    Deno.writeTextFileSync(
        FROZEN_AURA_PATH,
        `${FROZEN_AURA_BANNER}\nexport const FROZEN_AURA_TURNS = {\n` +
            `${DATE_NOTE}\n` +
            `    fetchedAt: ${JSON.stringify(cached.fetchedAt)},\n    skills: [\n` +
            `${rows}\n    ],\n    shouts: [\n${shouted}\n    ],\n} as const;\n`,
    );
    assert(skills.length > 0, "a freeze writes what the page served");
    assert(auras.length <= skills.length, "and no more auras than there were skills");
    assert(shouts.length <= auras.length, "a shout reaches a side, so it is among them");
    return { fetchedAt: cached.fetchedAt, skills: skills.length, auras: auras.length };
}

if (import.meta.main) {
    const parsed = parseArgs(Deno.args, {});
    const [command] = parsed._.filter((one): one is string => typeof one === "string");

    if (command === "status") {
        const cached = getCachedSkillTable();
        if (cached === null) console.log("skill table   nothing cached");
        else {
            const { skills } = requireCachedSkills();
            console.log(
                `skill table   cached ${cached.fetchedAt}  ${
                    composeIntegerText(skills.length)
                } skills`,
            );
        }
    } else if (command === "fetch") {
        const cached = await writeSkillTableCache();
        console.log(
            `cached ${cached.url} — ${
                composeIntegerText(cached.pageLength)
            } characters → ${cached.pagePath}`,
        );
    } else if (command === "freeze") {
        const frozen = writeFrozenSkillTable();
        console.log(
            `froze ${composeIntegerText(frozen.skills)} skills → ${FROZEN_PATH}, and ${
                composeIntegerText(frozen.auras)
            } reaching a side → ${FROZEN_AURA_PATH}`,
        );
    } else {
        throw new SkillTableError(`unknown command "${command ?? ""}" — status, fetch or freeze`);
    }
}
