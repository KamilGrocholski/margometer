/**
 * Every skill the game publishes, and the turns each of its effects is stated to run for.
 *
 *     deno task game:skills status | fetch | freeze
 *
 * The published table is the only source that states a duration: an effect reads `key=value@turns`,
 * once per skill level. Ids, effect keys and those turns are kept; the description column is the
 * game's own prose and stays in the cache (SECURITY.md, NOTICE.md).
 */

import { assert, assertStrictEquals } from "@std/assert";
import { getTextFromHtml } from "@/libs/html-text.ts";
import { composeJsonWriting, getJsonReading } from "@/libs/json-text.ts";
import { composeIntegerText, getIntegerFromText } from "@/libs/number-text.ts";
import { getNumberFromUnknown, isRecord } from "@/libs/unknown-reading.ts";
import { getStatedTurnsFromEffects } from "@/src/core/aura-standing.ts";
import { SkillTableError } from "@/tools/margometer-tool-error.ts";

const SKILLS_URL = "https://public-api.margonem.pl/we_get/skills/";

/** Ignored by git, and exported for the reason `tools/game-client-source.ts` gives for its own. */
export const CACHE_ROOT = ".cache/skills/";

const MANIFEST_NAME = "provenance.json";
const PAGE_NAME = "skills.html";
const FROZEN_PATH = "frozen/skill-durations.ts";
const FROZEN_AURA_PATH = "frozen/aura-turns.ts";
const INDENT_SPACES = 2;

const ROW_OPEN = "<tr>";
const ROW_CLOSE = "</tr>";
const CELL_OPEN = "<td>";
const CELL_CLOSE = "</td>";
const TABLE_OPEN = "<table";

/**
 * The columns the page serves, by the order it serves them in. Only two are read; the rest are
 * named so a page that gains or loses one is refused here rather than silently read off by one.
 */
const COLUMNS = ["id", "tags", "name", "description", "profession", "levels", "effects", "needs"];
const IDENTITY_COLUMN = 0;
const EFFECTS_COLUMN = 6;

const EFFECT_TERMINATOR = ";";
const EFFECT_ASSIGNMENT = "=";
const EFFECT_SEPARATOR = ",";
const DURATION_MARKER = "@";

/** Past the row, cell and effect counts the page has ever served, so each walk is bounded. */
const MAXIMUM_ROWS = 4096;
const MAXIMUM_CELLS = 64;
const MAXIMUM_EFFECTS = 64;

/** One key a skill states, and the turns the page says it runs for. Empty where it states none. */
export interface SkillEffect {
    key: string;
    turns: readonly number[];
}

export interface SkillReading {
    id: number;
    effects: readonly SkillEffect[];
}

export interface CachedSkillTable {
    url: string;
    fetchedAt: string;
    pagePath: string;
    pageLength: number;
}

/** Each `<tr>…</tr>` of the table, as the markup inside it. */
function readRowsFromHtml(html: string): string[] {
    const table = html.indexOf(TABLE_OPEN);
    if (table === -1) throw new SkillTableError(`no ${TABLE_OPEN} in the page — it is not a table`);
    const rows: string[] = [];
    let from = table;
    for (let look = 0; look < MAXIMUM_ROWS; look += 1) {
        const open = html.indexOf(ROW_OPEN, from);
        if (open === -1) break;
        const close = html.indexOf(ROW_CLOSE, open);
        if (close === -1) break;
        rows.push(html.slice(open + ROW_OPEN.length, close));
        from = close + ROW_CLOSE.length;
    }
    assert(
        rows.length <= MAXIMUM_ROWS,
        "a page stays inside the row count this walk is bounded by",
    );
    assert(from >= table, "and the walk never runs backwards over it");
    return rows;
}

/** Each cell of one row, as the words a person would have read in it. */
function readCellsFromRow(row: string): string[] {
    const cells: string[] = [];
    let from = 0;
    for (let look = 0; look < MAXIMUM_CELLS; look += 1) {
        const open = row.indexOf(CELL_OPEN, from);
        if (open === -1) break;
        const close = row.indexOf(CELL_CLOSE, open);
        if (close === -1) break;
        cells.push(getTextFromHtml(row.slice(open + CELL_OPEN.length, close)));
        from = close + CELL_CLOSE.length;
    }
    assert(
        cells.length <= MAXIMUM_CELLS,
        "a row stays inside the cell count this walk is bounded by",
    );
    assert(from >= 0, "and the walk stays inside the row");
    return cells;
}

/** The turns one effect's values state, distinct and in order. A value stating none adds none. */
function readTurnsFromValues(values: string): number[] {
    const found = new Set<number>();
    for (const value of values.split(EFFECT_SEPARATOR)) {
        const marker = value.indexOf(DURATION_MARKER);
        if (marker === -1) continue;
        const turns = getIntegerFromText(value.slice(marker + DURATION_MARKER.length).trim());
        if (turns === null) continue;
        found.add(turns);
    }
    assert(found.size <= values.length, "no more turns than there were values to state them");
    assert([...found].every((turns) => turns >= 0), "and none of them below nothing");
    return [...found].sort((one, other) => one - other);
}

/** Every `key=values` the effect cell states, in the order the page states them. */
function readEffectsFromCell(cell: string): SkillEffect[] {
    const effects: SkillEffect[] = [];
    const stated = cell.split(EFFECT_TERMINATOR);
    assert(stated.length <= MAXIMUM_EFFECTS, "a cell stays inside the effect count it is read by");
    for (const entry of stated) {
        const assignment = entry.indexOf(EFFECT_ASSIGNMENT);
        if (assignment === -1) continue;
        const key = entry.slice(0, assignment).trim();
        if (key.length === 0) continue;
        effects.push({ key, turns: readTurnsFromValues(entry.slice(assignment + 1)) });
    }
    assert(effects.every((effect) => effect.key.length > 0), "an effect that was read is named");
    return effects;
}

/**
 * ⚠️ **A row shorter than the table is refused, not read.** The two columns wanted sit at fixed
 * offsets, so a page that drops one would hand this the description where the effects were.
 */
function readSkillFromCells(cells: readonly string[]): SkillReading | null {
    if (cells.length !== COLUMNS.length) return null;
    const id = getIntegerFromText(cells[IDENTITY_COLUMN]?.trim() ?? "");
    if (id === null) return null;
    assert(id >= 0, "an id that was read is not below nothing");
    assertStrictEquals(cells.length, COLUMNS.length, "and stood in a row the table's own width");
    return { id, effects: readEffectsFromCell(cells[EFFECTS_COLUMN] ?? "") };
}

/** Every skill the page states, refusing a page that states none rather than freezing nothing. */
export function readSkillsFromHtml(html: string): SkillReading[] {
    const skills: SkillReading[] = [];
    for (const row of readRowsFromHtml(html)) {
        const skill = readSkillFromCells(readCellsFromRow(row));
        if (skill === null) continue;
        skills.push(skill);
    }
    if (skills.length === 0) throw new SkillTableError("the page holds no skill this reader knows");
    assert(skills.length > 0, "a table that was read names something");
    assert(new Set(skills.map((one) => one.id)).size === skills.length, "and names each once");
    return skills;
}

function getSkillManifestPath(): string {
    assert(CACHE_ROOT.endsWith("/"), "a root a name is joined to ends in a separator");
    assert(MANIFEST_NAME.length > 0, "and the name joined to it says something");
    return `${CACHE_ROOT}${MANIFEST_NAME}`;
}

function requireSkillTableField(value: unknown, field: string): string {
    if (typeof value !== "string" || value.length === 0) {
        throw new SkillTableError(`the skill cache manifest: ${field} is not text`);
    }
    assert(value.length > 0, "a field that was read says something");
    assert(field.length > 0, "and was asked for by name");
    return value;
}

/** **C13** over a manifest, as `tools/help-article.ts` puts it for the dump beside this one. */
export function requireCachedSkillTable(value: unknown): CachedSkillTable {
    if (!isRecord(value)) throw new SkillTableError("the skill cache manifest is not an object");
    const pageLength = getNumberFromUnknown(value["pageLength"]);
    if (pageLength === null) {
        throw new SkillTableError("the skill cache manifest: pageLength is not a number");
    }
    assert(pageLength >= 0, "a manifest states a length that is one");
    assert(isRecord(value), "and was a record before any field was read off it");
    return {
        url: requireSkillTableField(value["url"], "url"),
        fetchedAt: requireSkillTableField(value["fetchedAt"], "fetchedAt"),
        pagePath: requireSkillTableField(value["pagePath"], "pagePath"),
        pageLength,
    };
}

/** What is cached, or null. Absence is an answer; an unreadable file is not. */
export function getCachedSkillTable(): CachedSkillTable | null {
    let text = "";
    try {
        text = Deno.readTextFileSync(getSkillManifestPath());
    } catch {
        // A page nobody has fetched is an answer, not a failure. `freeze` refuses on it.
        return null;
    }
    const reading = getJsonReading(text);
    if (!reading.isOk) {
        throw new SkillTableError("the skill cache manifest is unreadable", {
            cause: reading.cause,
        });
    }
    assert(text.length > 0, "a manifest that was read says something");
    return requireCachedSkillTable(reading.value);
}

/** Refuses rather than fetching behind the caller's back: a claim is dated by its page. */
function getCachedSkillPage(): { cached: CachedSkillTable; html: string } {
    const cached = getCachedSkillTable();
    if (cached === null) {
        throw new SkillTableError("nothing cached — run `deno task game:skills fetch`");
    }
    const html = Deno.readTextFileSync(cached.pagePath);
    assert(html.length > 0, "a page that was cached says something");
    assert(cached.fetchedAt.length > 0, "and is dated by when it was fetched");
    return { cached, html };
}

export async function writeSkillTableCache(): Promise<CachedSkillTable> {
    const response = await fetch(SKILLS_URL);
    if (!response.ok) throw new SkillTableError(`${SKILLS_URL} answered ${response.status}`);
    const html = await response.text();
    Deno.mkdirSync(CACHE_ROOT, { recursive: true });
    const pagePath = `${CACHE_ROOT}${PAGE_NAME}`;
    Deno.writeTextFileSync(pagePath, html);
    const cached: CachedSkillTable = {
        url: SKILLS_URL,
        fetchedAt: new Date().toISOString(),
        pagePath,
        pageLength: html.length,
    };
    const writing = composeJsonWriting(cached, INDENT_SPACES);
    if (!writing.isOk) {
        throw new SkillTableError("the skill cache manifest cannot be written", {
            cause: writing.cause,
        });
    }
    Deno.writeTextFileSync(getSkillManifestPath(), `${writing.text}\n`);
    assert(cached.pageLength > 0, "what was cached says something");
    return cached;
}

/** What stands over the frozen table, exported for the reason the two beside it are. */
export const FROZEN_SKILL_BANNER =
    `// Generated by \`deno task game:skills freeze\`. Do not edit by hand.
//
// Ids, effect keys and stated turns only, and \`tools/skill-table.ts\` says why the description
// column the page serves beside them stays in the cache.
`;

/** The frozen table's own text for one value, or a refusal branded as this tool's. */
function requireWrittenText(value: string): string {
    const writing = composeJsonWriting(value);
    if (!writing.isOk) throw new SkillTableError(`"${value}" cannot be written down`);
    assert(writing.text.length > 0, "a value that was written says something");
    assert(value.length > 0, "and was something before it was written");
    return writing.text;
}

function composeEffectText(effect: SkillEffect): string {
    const turns = effect.turns.map((one) => composeIntegerText(one)).join(", ");
    assert(effect.key.length > 0, "an effect that is written down is named");
    assert(turns.length >= 0, "and states the turns it runs for, or none");
    return `{ key: ${requireWrittenText(effect.key)}, turns: [${turns}] }`;
}

/** One effect to a line, which is the shape `deno fmt` leaves alone whatever a skill states. */
function composeSkillText(skill: SkillReading): string {
    const effects = skill.effects
        .map((effect) => `                ${composeEffectText(effect)},`)
        .join("\n");
    assert(skill.id >= 0, "a skill that is written down states an id");
    assert(effects.length >= 0, "and the effects it states, however few");
    return `        {
            id: ${composeIntegerText(skill.id)},
            effects: [
${effects}
            ],
        },`;
}

function composeFrozenSkillModule(fetchedAt: string, skills: readonly SkillReading[]): string {
    const written = skills.map((skill) => composeSkillText(skill)).join("\n");
    assert(written.length > 0, "a table that is written down says something");
    assert(fetchedAt.length > 0, "and is dated by the page it was taken from");
    return `${FROZEN_SKILL_BANNER}
export const FROZEN_SKILL_DURATIONS = {
    /** When the page these were read from was fetched, not when a person read it. */
    fetchedAt: ${requireWrittenText(fetchedAt)},
    skills: [
${written}
    ],
} as const;
`;
}

/** What stands over the aura table, exported for the reason the banner beside it is. */
export const FROZEN_AURA_BANNER =
    `// Generated by \`deno task game:skills freeze\`. Do not edit by hand.
//
// The skills whose effects reach more than one combatant, and the turns the published table
// states each runs for. \`src/core/aura-standing.ts\` owns which keys those are.
`;

/**
 * The small table, and it is small on purpose: what the bundle carries is thirteen numbers rather
 * than every effect of 226 skills, which is 53 kB against a built file of 321 kB (2026-09-04).
 */
function composeFrozenAuraModule(fetchedAt: string, skills: readonly SkillReading[]): string {
    const written: string[] = [];
    for (const skill of skills) {
        const turns = getStatedTurnsFromEffects(skill.effects);
        if (turns === null) continue;
        written.push(
            `        { id: ${composeIntegerText(skill.id)}, turns: ${composeIntegerText(turns)} },`,
        );
    }
    assert(written.length > 0, "a table that is written down names something");
    assert(fetchedAt.length > 0, "and is dated by the page it was read from");
    return `${FROZEN_AURA_BANNER}
export const FROZEN_AURA_TURNS = {
    /** When the page these were read from was fetched, not when a person read it. */
    fetchedAt: ${requireWrittenText(fetchedAt)},
    skills: [
${written.join("\n")}
    ],
} as const;
`;
}

/** Both tables written to `frozen/`, dated by the page they were read from. */
export function writeFrozenSkillTable(): { fetchedAt: string; count: number; auras: number } {
    const { cached, html } = getCachedSkillPage();
    const skills = readSkillsFromHtml(html);
    Deno.writeTextFileSync(FROZEN_PATH, composeFrozenSkillModule(cached.fetchedAt, skills));
    const auras = composeFrozenAuraModule(cached.fetchedAt, skills);
    Deno.writeTextFileSync(FROZEN_AURA_PATH, auras);
    assert(skills.length > 0, "a table that was written down counts something");
    assert(cached.fetchedAt.length > 0, "and says which page it was counted over");
    return {
        fetchedAt: cached.fetchedAt,
        count: skills.length,
        auras: auras.split("{ id:").length - 1,
    };
}

function writeSkillStatusReport(): void {
    const cached = getCachedSkillTable();
    if (cached === null) {
        console.log("skills  nothing cached");
        return;
    }
    const skills = readSkillsFromHtml(Deno.readTextFileSync(cached.pagePath));
    const stating = skills.filter((skill) => skill.effects.some((one) => one.turns.length > 0));
    console.log(
        `skills  ${composeIntegerText(skills.length)} read, ${
            composeIntegerText(stating.length)
        } stating a duration  fetched ${cached.fetchedAt.slice(0, 16).replace("T", " ")} UTC`,
    );
}

if (import.meta.main) {
    const command = Deno.args[0] ?? "status";
    if (command === "fetch") {
        const cached = await writeSkillTableCache();
        console.log(
            `fetched ${composeIntegerText(cached.pageLength)} characters → ${cached.pagePath}`,
        );
    } else if (command === "freeze") {
        const { fetchedAt, count, auras } = writeFrozenSkillTable();
        console.log(
            `froze ${composeIntegerText(count)} skills read ${fetchedAt} → ${FROZEN_PATH}`,
        );
        console.log(
            `      ${composeIntegerText(auras)} of them reach a side → ${FROZEN_AURA_PATH}`,
        );
    } else if (command === "status") {
        writeSkillStatusReport();
    } else {
        console.error(`unknown command "${command}" — status | fetch | freeze`);
        Deno.exit(1);
    }
}
