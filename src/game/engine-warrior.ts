/**
 * The client's own names for the fields of a combatant, in one place.
 *
 * Two readers ask the engine for the same person and want different things of
 * them: `src/game/engine-roster.ts` builds the roster the panel groups by side,
 * and `src/game/fight-capture.ts` copies a snapshot so a fight can be written to
 * a file. Both spelled these five by hand, and `engine-roster.ts` spelled four of
 * them twice within itself — once to read a combatant and once in the list of
 * fields that says an entry is describing somebody rather than changing them
 * (`docs/specs/2026-08-18-a-name-we-did-not-choose.md`).
 *
 * ⚠️ **The tools that read a *recording* must keep spelling these themselves.**
 * `tools/fight-dump-parser.ts` reads the same five names out of a captured file,
 * and it looks like a third consumer. It is not: what binds it is the format on
 * disk, which the recordings in `tests/captured-fights/` have already frozen. If
 * the game renamed `prof` tomorrow this file would follow it and every existing
 * capture would still say `prof` — so importing from here would make the parser
 * change its mind about material it must not reinterpret (§9.2).
 *
 * Six, and not the ten a combatant carries. `originalId`, `mana`, `energy` and
 * `ac` have one reader each and §7.1 keeps them there; a name here is a name two
 * files had to agree on. `hp` joined when the second reader arrived: the roster
 * needs a combatant's maximum before a share of it can become a figure
 * (`src/core/combatant-health.ts`), and the capture has always needed the whole
 * object.
 */

export const WARRIOR_ID_FIELD = "id";
export const WARRIOR_NAME_FIELD = "name";
/** The game states a bare side number; which one is the player's is elsewhere. */
export const WARRIOR_SIDE_FIELD = "team";
export const WARRIOR_PROFESSION_FIELD = "prof";
export const WARRIOR_LEVEL_FIELD = "lvl";
/**
 * The health object, and the two members inside it anything here reads.
 *
 * ⚠️ **`cur` is not a property of the roster and must not become one.** It changes
 * on every payload, and the roster's identity is what the session uses to decide
 * whether a fight needs reading again — so a current health inside a combatant
 * would re-decode the whole fight several times a turn. It is read on its own,
 * once, at the fight's start (`src/game/engine-roster.ts`).
 */
export const WARRIOR_HEALTH_FIELD = "hp";
export const HEALTH_MAXIMUM_FIELD = "max";
export const HEALTH_CURRENT_FIELD = "cur";
