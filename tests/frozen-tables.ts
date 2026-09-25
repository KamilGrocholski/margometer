/**
 * The published tables the bundle carries, taken from the entry's `composeRuntimeTables` so a test
 * reads the tables the add-on reads. The readings the bundle does not carry are imported from
 * `frozen/` where a test needs them.
 */

import type { StatedSkills } from "#/src/core/aura-standing.ts";
import type { DecoderTables } from "#/src/core/fight-decoder.ts";
import { composeRuntimeTables } from "#/src/userscript-entry.ts";

/** The entry's own composition, so a test reads the tables the add-on reads, composed once. */
const TABLES = composeRuntimeTables();
export const BLOWS_GRANTED: DecoderTables = TABLES.decoder;
export const STATED_SKILLS: StatedSkills = TABLES.tooltip.statedSkills;
