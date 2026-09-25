/**
 * The published tables the tests read. The three the bundle carries stand in `frozen/`, and are
 * taken from the entry's `composeRuntimeTables`; the rest are read out of `develop:frozen/` in git.
 */

import { assert } from "@std/assert";
import type { StatedSkills } from "#/src/core/aura-standing.ts";
import type { DecoderTables } from "#/src/core/fight-decoder.ts";
import { composeRuntimeTables } from "#/src/userscript-entry.ts";
import { DEVELOP_REVISION } from "./recording-sources.ts";

/** The entry's own composition, so a test reads the tables the add-on reads, composed once. */
const TABLES = composeRuntimeTables();
export const BLOWS_GRANTED: DecoderTables = TABLES.decoder;
export const STATED_SKILLS: StatedSkills = TABLES.tooltip.statedSkills;

/**
 * A `develop:frozen/` module too wide to copy by hand, read out of git at the revision the
 * recordings are read at and imported as it stands, so what a test holds cannot drift from it.
 */
export async function readFrozenModule(name: string): Promise<Record<string, unknown>> {
    const shown = new Deno.Command("git", {
        args: ["show", `${DEVELOP_REVISION}:frozen/${name}.ts`],
        stdout: "piped",
    }).outputSync();
    assert(shown.success, `develop:frozen/${name}.ts is there at ${DEVELOP_REVISION}`);
    const text = new TextDecoder().decode(shown.stdout);
    return await import(`data:application/typescript,${encodeURIComponent(text)}`);
}
