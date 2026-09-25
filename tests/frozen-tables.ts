/**
 * The published tables the tests read. The three the bundle carries stand in `frozen/`, and are
 * composed here as the entry composes them; the rest are read out of `develop:frozen/` in git.
 */

import { assert } from "@std/assert";
import {
    indexAuraTurnsBySkillId,
    indexShoutsBySkillId,
    type StatedSkills,
} from "#/src/core/aura-standing.ts";
import { type DecoderTables, indexBlowsGrantedBySkillId } from "#/src/core/fight-decoder.ts";
import { FROZEN_AURA_TURNS } from "#/frozen/aura-turns.ts";
import { FROZEN_BLOWS_GRANTED } from "#/frozen/blows-granted.ts";
import { RECORDINGS_REVISION } from "./recording-revision.ts";

export const BLOWS_GRANTED: DecoderTables = {
    blowsGrantedBySkillId: indexBlowsGrantedBySkillId(FROZEN_BLOWS_GRANTED.skills),
};

export const STATED_SKILLS: StatedSkills = {
    turnsBySkillId: indexAuraTurnsBySkillId(FROZEN_AURA_TURNS.skills),
    shoutsBySkillId: indexShoutsBySkillId(FROZEN_AURA_TURNS.shouts),
};

/**
 * A `develop:frozen/` module too wide to copy by hand, read out of git at the revision the
 * recordings are read at and imported as it stands, so what a test holds cannot drift from it.
 */
export async function readFrozenModule(name: string): Promise<Record<string, unknown>> {
    const shown = new Deno.Command("git", {
        args: ["show", `${RECORDINGS_REVISION}:frozen/${name}.ts`],
        stdout: "piped",
    }).outputSync();
    assert(shown.success, `develop:frozen/${name}.ts is there at ${RECORDINGS_REVISION}`);
    const text = new TextDecoder().decode(shown.stdout);
    return await import(`data:application/typescript,${encodeURIComponent(text)}`);
}
