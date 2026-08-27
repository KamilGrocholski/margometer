/**
 * Where a fight is happening, asked of the page.
 *
 * The battle protocol does not say. Every key a payload carries was read off the
 * material held on 2026-08-27 — `auto, battleground, close, current, endBattle,
 * init, m, mi, move, myteam, poolTime, skills, skills_combo_max,
 * skills_disabled, start_move, turns_warriors, w` — and the only candidate,
 * `battleground`, is the picture behind the fight: `dd4.jpg` names both the
 * Hildur recordings and the Draugr ones, on two different worlds
 * (`docs/specs/2026-08-27-somebody-else-read-the-same-protocol.md`). The map
 * travels in a sibling of `f` that our seam never sees, so the answer comes from
 * the client's own state instead — which is `game`'s work and nobody else's
 * (§9.1).
 *
 * Read on production build `53XkBRxF` (cached 2026-08-25, read 2026-08-27), and
 * confirmed in the unpacked development build `1781609507010`: the map is
 * `Engine.map.d.name` — `core/Engine.js:508` builds one `Map` for the life of the
 * tab exactly as it builds one battle, and `core/map/Map.js:24` gives it the same
 * `this.d = {}` bag every updateable object here has. The standing position is
 * `Engine.hero.d.x` and `Engine.hero.d.y`; the client's own *copy location with
 * coordinates* menu composes `${Engine.map.d.name} (${Engine.hero.getCords()})`,
 * and `core/characters/Hero.js:2480` shows that call is nothing but those two
 * fields joined.
 *
 * ⚠️ **Properties, never `getCords()`.** Calling into somebody else's program is
 * a larger intrusion than reading it, it can throw for reasons that are none of
 * ours, and §9.5 wants a reader that answers `null`. The join is ours to write,
 * in the panel's own words.
 *
 * ⚠️ **`d` is empty for as long as a map is loading.** `Map.js:1227-1240`
 * (`onClear`, "called before new map loads") resets it, so an ill-timed read
 * yields no name. That is not a case to engineer around — a fight does not open
 * mid-load — and if it ever happened the answer is `null` and the panel says
 * nothing, which is the honest reading rather than a stale one.
 */

import { getIntegerFromText, getIntegerFromValue } from "@/libs/number.ts";
import { getRecordFromValue } from "@/libs/record.ts";
import { getEnginesFromPage, type GameWindow } from "@/src/game/engine-attachment.ts";

/**
 * The client's own names for what says where somebody is.
 *
 * ⚠️ **`name` is spelled here and in `src/game/engine-warrior.ts`, and they are
 * not the same field.** That one owns the fields of a *combatant*; this is the
 * name of a map, which merely happens to be the same English word. Holding them
 * to one constant would tie a map to a warrior, so that the day the client
 * renamed one, the other would follow it silently. The distinction is the one
 * `src/game/kept-fights.ts` draws for its stored fields, one object along.
 */
const ENGINE_MAP_FIELD = "map";
const ENGINE_HERO_FIELD = "hero";
/** The bag every updateable object of the client's keeps its state in. */
const ENGINE_DATA_FIELD = "d";
const MAP_NAME_FIELD = "name";
const HERO_X_FIELD = "x";
const HERO_Y_FIELD = "y";

/**
 * Where a fight was fought, as much of it as the page would say.
 *
 * Three fields that fail apart rather than together: a map mid-load has neither,
 * and nothing guarantees a client that answers one answers the other. Null per
 * field, never `""` and never `0` — a coordinate of zero is a tile somebody can
 * stand on (§9.3).
 */
export type FightPlace = {
  mapName: string | null;
  x: number | null;
  y: number | null;
};

function getDataFromEngineField(engine: unknown, field: string): Record<string, unknown> | null {
  const held = getRecordFromValue(engine)?.[field];
  return getRecordFromValue(getRecordFromValue(held)?.[ENGINE_DATA_FIELD]);
}

/**
 * One tile of the map, whichever way the client happens to be holding it.
 *
 * ⚠️ **Both spellings, and that is the client's looseness rather than ours.** The
 * engine does arithmetic on these — `Math.abs(this.ry - this.d.y)`,
 * `core/characters/Hero.js:288` of the unpacked development build — and compares
 * them with `==` fifty lines below it (`:337`), which is a program that does not
 * mind which it is handed. Reading only one would stop answering the day the
 * server sent the other, silently and with no way to notice.
 * `src/game/battle-session.ts` reads the fight's own opening flag the same way
 * for the same reason.
 */
function getCoordinateFromValue(value: unknown): number | null {
  return typeof value === "string" ? getIntegerFromText(value) : getIntegerFromValue(value);
}

/**
 * The place, or null where the page said nothing at all.
 *
 * Null rather than a `FightPlace` of three nulls, so a caller can tell *no game
 * here* from *a game that would not say* — the distinction
 * `src/game/game-dictionary.ts` draws for the same reason.
 *
 * ⚠️ **Wrapped, because reaching into another program's object graph can
 * throw.** This is §9.5's named exception and the same boundary
 * `getBattleFromWindow` sits on: a page tearing a context down turns a property
 * read into an exception, and this one is called from inside the engine's own
 * call stack.
 */
export function getPlaceFromWindow(page: GameWindow): FightPlace | null {
  try {
    for (const engine of getEnginesFromPage(page)) {
      const map = getDataFromEngineField(engine, ENGINE_MAP_FIELD);
      const hero = getDataFromEngineField(engine, ENGINE_HERO_FIELD);
      if (map === null && hero === null) continue;

      const stated = map?.[MAP_NAME_FIELD];
      const place: FightPlace = {
        mapName: typeof stated === "string" && stated !== "" ? stated : null,
        x: getCoordinateFromValue(hero?.[HERO_X_FIELD]),
        y: getCoordinateFromValue(hero?.[HERO_Y_FIELD]),
      };
      // A candidate that held the objects and none of the values is the same
      // answer as no candidate at all, so the other spelling still gets its turn.
      if (place.mapName !== null || place.x !== null || place.y !== null) return place;
    }
    return null;
  } catch {
    return null;
  }
}
