# 0028. A storage key names the window it keeps

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

ADR 0023 made the main window the meter and left the panel as the two windows together, and ADR 0024
carried those names into the DOM. Both left the storage keys alone, because `AGENTS.md` lists them
under **Ask first**. `STORE_KEY` in `src/ports/browser-store.ts` at `2722c90` therefore still
spelled names from before both:

- the meter's keys carried no window at all: `MargoMeter-folded`, `MargoMeter-place` and
  `MargoMeter-size`;
- the helper's carried its Polish screen name: `MargoMeter-pomocnik-folded`,
  `MargoMeter-pomocnik-place` and `MargoMeter-pomocnik-size`;
- a position was `place` in the key and `position` in `SETTING_KEY`, and the type step was `type`.

`CHANGELOG.md` tells a player that `0.x` promises no compatibility, saved settings included.

## Decision

Decided with the maintainer on 2026-10-03.

**Every key a setting is kept under is `MargoMeter-` and that setting's `SETTING_KEY` word.** The
meter's keys say `meter` and the helper's say `helper`: `MargoMeter-meter-position`,
`MargoMeter-helper-folded`, `MargoMeter-type-step`. `MargoMeter-fights` and `MargoMeter-storage`
already read that way and stay.

**The old keys are not read.** A reader updating loses the place, size and fold of both windows and
the chosen type step once. The panel then stands where a first install puts it, and `CHANGELOG.md`
says so.

Rejected: reading the old key where the new one is absent. Every setting would be read under two
keys at every boot, for as long as a `0.x` copy could still be out there, and that is a second path
through the browser-storage boundary kept for a layout one person sets once.

## Consequences

The keys a browser holds change at the next release, and the old ones remain in the store untouched:
nothing removes them. Changing a key after this is again **Ask first**.
