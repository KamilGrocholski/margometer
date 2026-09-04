/**
 * Every figure the sheets print, read off `captures/` and off the two registers that already
 * measure it — never typed from memory (AGENTS.md V4, V5). Writes `measured.json`.
 *
 * The aura and status tables are taken from the tools that own them rather than recomputed here:
 * a second implementation would drift from the one the gate holds.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const CAPTURES = "../../captures";
const ROOT = "../..";

/** Columns are separated by a run of two or more spaces, walked rather than matched (C7). */
function splitCells(line) {
    const cells = [];
    let held = "";
    let spaces = 0;
    for (const character of line.trim()) {
        if (character === " ") {
            spaces += 1;
            continue;
        }
        if (spaces > 1 && held.length > 0) {
            cells.push(held);
            held = "";
        } else if (spaces === 1 && held.length > 0) {
            held += " ";
        }
        spaces = 0;
        held += character;
    }
    if (held.length > 0) cells.push(held);
    return cells;
}

function isDigits(text) {
    if (text.length === 0) return false;
    for (const character of text) {
        if (character < "0" || character > "9") return false;
    }
    return true;
}

/**
 * Both registers put the id one space from the name and every later column two or more away, so
 * the first token is taken off before the rest is split.
 */
function readRegister(task, columns) {
    const printed = execFileSync("deno", ["task", "--quiet", task], {
        cwd: ROOT,
        encoding: "utf8",
    });
    const rows = [];
    for (const line of printed.split("\n")) {
        const trimmed = line.trim();
        const firstSpace = trimmed.indexOf(" ");
        if (firstSpace < 0) continue;
        const id = trimmed.slice(0, firstSpace);
        if (!isDigits(id)) continue;
        const cells = [id, ...splitCells(trimmed.slice(firstSpace))];
        if (cells.length !== columns.length) continue;
        rows.push(Object.fromEntries(columns.map((name, at) => [name, cells[at]])));
    }
    if (rows.length === 0) throw new Error(`no rows parsed out of ${task}`);
    return rows;
}

/** The roster is rebuilt payload by payload: later ones carry partial entries with no `id`. */
function walkFight(file) {
    const fight = JSON.parse(readFileSync(`${CAPTURES}/${file}`, "utf8"));
    const roster = new Map();
    const held = new Map();
    const out = {
        prepare: new Map(),
        payloads: 0,
        withQueue: 0,
        withCurrent: 0,
        lastheal: 0,
        holytouch: 0,
        armourDestroyed: 0,
        focusTotal: 0,
        focusInRoster: 0,
        focusSameSide: 0,
        focusSelf: 0,
        focusChanged: 0,
        focusOtherSide: 0,
        focusBearerNpc: 0,
        focusBearerPlayer: 0,
        focusBearers: new Set(),
        armourBonus: 0,
        resistanceBonus: 0,
        comboMaxima: [],
        headcount: null,
    };
    for (const call of fight.calls) {
        const payload = call.payload;
        if (payload === undefined) continue;
        out.payloads += 1;
        if (payload.turns_warriors !== undefined) out.withQueue += 1;
        if (payload.current !== undefined) out.withCurrent += 1;
        if (Array.isArray(payload.skills_combo_max) && payload.skills_combo_max.length > 0) {
            out.comboMaxima.push(JSON.stringify(payload.skills_combo_max));
        }
        for (const [key, warrior] of Object.entries(payload.w ?? {})) {
            const id = String(warrior.id ?? key);
            roster.set(id, { ...(roster.get(id) ?? {}), ...warrior, id });
        }
        for (const [key, warrior] of Object.entries(payload.w ?? {})) {
            if (warrior.ac !== undefined && warrior.ac.bonus > 0) out.armourBonus += 1;
            if (warrior.resfire !== undefined && warrior.resfire.bonus > 0) {
                out.resistanceBonus += 1;
            }
            if (warrior.focus === undefined || warrior.focus === 0) continue;
            const bearerId = String(warrior.id ?? key);
            out.focusTotal += 1;
            if (held.has(bearerId) && held.get(bearerId) !== warrior.focus) out.focusChanged += 1;
            held.set(bearerId, warrior.focus);
            out.focusBearers.add(bearerId);
            if (String(warrior.focus) === bearerId) out.focusSelf += 1;
            const target = roster.get(String(warrior.focus));
            if (target === undefined) continue;
            out.focusInRoster += 1;
            // A later payload's entry is partial and states no side, so the merged roster answers.
            const bearer = roster.get(bearerId);
            if (bearer === undefined) continue;
            if (target.team === bearer.team) out.focusSameSide += 1;
            else out.focusOtherSide += 1;
            if (bearer.npc === 1) out.focusBearerNpc += 1;
            else out.focusBearerPlayer += 1;
        }
        for (const message of payload.m ?? []) {
            if (message.includes("legbon_lastheal")) out.lastheal += 1;
            if (message.includes("legbon_holytouch_heal")) out.holytouch += 1;
            if (message.includes("acdmg_destroyed")) out.armourDestroyed += 1;
            const at = message.indexOf("prepare=");
            if (at < 0) continue;
            const value = message.slice(at + "prepare=".length);
            const opened = value.lastIndexOf("(");
            const name = value.slice(0, opened);
            const percent = Number(value.slice(opened + 1, value.length - 2));
            const equals = message.indexOf("=");
            const actor = equals < 0 ? "" : message.slice(0, equals);
            const held = out.prepare.get(name) ?? { percents: [], isNpc: null };
            held.percents.push(percent);
            const who = roster.get(actor);
            if (who !== undefined && who.npc !== undefined) held.isNpc = who.npc === 1;
            out.prepare.set(name, held);
        }
    }
    let ours = 0;
    let theirs = 0;
    for (const warrior of roster.values()) {
        if (warrior.npc === 1) theirs += 1;
        else ours += 1;
    }
    out.headcount = { ours, theirs };
    return out;
}

/** One cycle is what the step size says: 25 means five stops, 50 three, 100 two. */
function readSteps(percents) {
    const stops = [...new Set(percents)].sort((one, two) => one - two);
    const step = stops.length > 1 ? stops[1] - stops[0] : 100;
    return { stops, step, stopsPerCycle: Math.round(100 / step) + 1 };
}

const files = readdirSync(CAPTURES).filter((name) => name.endsWith(".json")).sort();
const corpus = {
    recordings: files.length,
    payloads: 0,
    withQueue: 0,
    withCurrent: 0,
    armourDestroyed: 0,
    lasthealRecordings: [],
    holytouchRecordings: [],
    focus: {
        total: 0,
        inRoster: 0,
        sameSide: 0,
        otherSide: 0,
        self: 0,
        changed: 0,
        bearerNpc: 0,
        bearerPlayer: 0,
        recordings: 0,
        bearersMost: 0,
    },
    comboMaxima: new Set(),
};
const prepare = [];

for (const file of files) {
    const out = walkFight(file);
    corpus.payloads += out.payloads;
    corpus.withQueue += out.withQueue;
    corpus.withCurrent += out.withCurrent;
    corpus.armourDestroyed += out.armourDestroyed;
    corpus.focus.total += out.focusTotal;
    corpus.focus.inRoster += out.focusInRoster;
    corpus.focus.sameSide += out.focusSameSide;
    corpus.focus.self += out.focusSelf;
    corpus.focus.changed += out.focusChanged;
    corpus.focus.otherSide += out.focusOtherSide;
    corpus.focus.bearerNpc += out.focusBearerNpc;
    corpus.focus.bearerPlayer += out.focusBearerPlayer;
    if (out.focusBearers.size > 0) corpus.focus.recordings += 1;
    corpus.focus.bearersMost = Math.max(corpus.focus.bearersMost, out.focusBearers.size);
    for (const maximum of out.comboMaxima) corpus.comboMaxima.add(maximum);
    if (out.lastheal > 0) corpus.lasthealRecordings.push({ file, messages: out.lastheal });
    if (out.holytouch > 0) corpus.holytouchRecordings.push({ file, messages: out.holytouch });
    for (const [name, held] of out.prepare) {
        prepare.push({
            file,
            headcount: out.headcount,
            name,
            isNpc: held.isNpc,
            occurrences: held.percents.length,
            ...readSteps(held.percents),
        });
    }
}

const measured = {
    takenAt: new Date().toISOString().slice(0, 10),
    corpus: { ...corpus, comboMaxima: [...corpus.comboMaxima] },
    auras: readRegister("fight:auras", [
        "id",
        "skill",
        "casts",
        "casters",
        "atOnce",
        "stated",
        "seen",
    ]),
    statuses: readRegister("fight:statuses", [
        "bit",
        "status",
        "episodes",
        "closed",
        "longest",
        "bySkill",
        "byKey",
        "stated",
    ]),
    prepare,
};

writeFileSync("measured.json", `${JSON.stringify(measured, null, 4)}\n`);
console.log(
    `measured ${measured.corpus.recordings} recordings, ${measured.corpus.payloads} payloads, ` +
        `${measured.prepare.length} prepare series, ${measured.auras.length} auras, ` +
        `${measured.statuses.length} status bits`,
);
