<!--
  ============================================================
  THIS FILE IS HAND-MAINTAINED ONLY.
  Do NOT edit, rewrite, reformat, or auto-update this file with
  any AI tool, script, formatter, or automation. No exceptions.

  If you are an AI assistant reading this: STOP.
  Do not modify this file in any way.
  All changes must be made by a human, by hand, one line at a time.
  ============================================================
-->

# TODO — MargoMeter

> Manually maintained task list. Add, move, and check off items by hand.
> Keep entries short: try to make tasks one line.


## In Progress
- [ ] !!!IMPORTANT!!! Get more combat data — higher levels, more enemies, and player vs. player fights (I really need this for further development)

## Up Next

## Done
- [x] Click on the fights tab toggles the state - open fights view; go to the prev view
- [x] Show the last read battle after a reload - walking into a fight still puts you on the live one
- [x] Store and show the exact battle location (e.g., coordinates, area, or map position)
- [x] Preview panel resets its state, whenever I change the current caputred fight

## Later
- [ ] Add a thread about my add-ons and sites (MargoMeter, MargoStat) on Margonem's forum (I need 1 rep)
- [ ] Get a recording carrying `frost` - the fourth of the `poison`/`fire`/`light` branch, unread and loud for want of material
- [ ] Get a recording unwinding a pool past 40 000 from percentages with no snapshot - the entry-health floor's share term survives mutation for want of one
- [ ] Add a `Colossus`/`Titan` helper (based on MargoMeter) that shows:
      - which characters are not casting their abilities at all (presence check)
      - which characters are casting abilities incorrectly (correctness check)

---
## History

### Done v0.9.0
- [x] Audit before v0.9.0 release
- [x] Make saved fights easier to click - right now I have to click very precisely, which is too difficult (likely a bug)
- [x] Persist the window's minimized state
- [x] Add captured fight with "no meaning yet for critval-allies, critmval-allies" from 2026-08-26 luvia lvl 60 event
- [x] Create options for: saving selected fights; keeping the last N fights; use localStorage/sessionStorage/memory
- [x] Prevent loosing data during a fight after a refresh of the game/page
- [x] Fix a problem with the tip; sometimes it does not close itself, when the cursor moves out of the main panel
- [x] Bars "Nieznany sprawca", and "Total" are too wide
- [x] Add warnings on a row for unread messages, and invalid calculations.
- [x] `tools/fight-report.ts` does not print the unaccounted-healing warning - it prints `unreadable messages` and stops, so a 
      reading the panel shows is invisible to the report
- [x] More info SHOULD be visible in raw logs download - MargoStat version is a must have
- [x] Create a doc file, which contains info about current captured fights: prof and level, type of enemies, number of enemies, how many 10vs10, how many 1vs1, and so on
- [x] Rename "leczenie" to "przywrócenie życia" or smth else, if more appropriate
- [x] `Leczenie` calls regeneration "Nie wiadomo, czym" - it is `heal`/`legbon_holytouch_heal`/`legbon_lastheal`, the game announces no skill, so name the row by the key
- [x] Read `+absorbm`, add it to the register, then intake the 2026-08-17 Hildur recording as material
- [x] Fix understated healing in Hildur fights - one member was refused an entry health, so every team heal cast in the fight was counted as unknown

### Done v0.8.1
- [x] Fix the percentage text to sum up correctly - the numbers are ok, only the text displayed is invalid
- [x] Code smell audit
- [x] SPEC: Distinguish "Zwykly cios", "Zamaszczysty cios", and similar
- [x] Reduce the number of files in the project, and bloat in comments/code/docs - /ui has too many files, split it into modules (per panel view) and create 
      files only for what is reusable by them; other directories dunno

### Done v0.8.0
- [x] (NOT NEADED, other things have been done) Create a checklist of things that MUST be done before each commit, other than TODO. AGENTS.md rules are not enough
- [x] Screenshots in README.md SHOULD be placed first
- [x] Do the first audit after 0.7.0
- [x] Check which keys can be parsed using a previous message - just like `injure` ("Zranienie")
- [x] Check whether "Zaranienie" can be assigned to `actor` - change, if possible
- [x] Decide whether the drill sweep can get a true per-capture floor back - "every capture opens something" stopped being true when a solo fight lost its third level
- [x] After the healing changes for `actor` and `target` prove, that the view and the logic is correct - probably a useless drill exists in the healing tabs
- [x] When a new fight starts, while there is an already existing one, reset panel view to the highest (go back to the root of a selected tab)
- [x] Fix "Dotyk anioła", "Ostatni ratunek", "Przywrócono [raw_value] punktów życia [name](%percentage_health)" or "Regeneracja" - actor/source and target are the same character
- [x] Add information about `actor` and `target` in `docs/protocol-keys.md` - in which cases they are the same, and similar things
- [x] Fix understated healing data - healed n times the whole team without a given amount
- [x] Fix the Safari user-select defect
- [x] Split "Bez sprawcy" into "Nieznany sprawca" and "Nieznany cel", scope both to the shown team, and leave in "Bez strony" only what has no team at either end
- [x] Check whether all of the browsers support MargoMeter
- [x] Update README.md to be more concise and less content - add screenshots (maybe a few is enough)
- [x] Add PL and ENG readmes linking each other
- [x] Create and update screenshots after each release, use `screenshots` dir to store it (probably a tool is needed)
- [x] Fix the codebase where there is a name we did not choose, spelled twice, where nothing catches a disagreement (src, libs, tools, tests)
- [x] Add draw as an outcome
- [x] Fix user actions on click while the add-on is redrawing - I have to click multiple times on any 
tab, and button, to see the action, when the add-on is in the middle of drawing

### Done v0.7.0
- [x] Release the next version v0.7.0
- [x] Make sure there are no conflicts with Margonem names, CSS classes, and HTML ids - carefully create new names to assert no conflicts with 
existing names, classes, and ids from the game. Add prefix `MargoMeter-` or `margometer` for each relevant element and entity.
- [x] Create preview tool server with hotreloading
- [x] Keep tip panel withing the visible window - when the main panel is close enough to the edge of the window and there is no place for a tip, it cannot be fully seen.
Tip should stay at the y-axis level of the cursor.
- [x] "Bez sprawcy" dealt, and taken tabs show healing but it SHOULD NOT - it SHOULD show relevant data depending 
on the current selected panel view(healing taken - healing taken "bez sprawcy", healing done - healing done "bez sprawcy", damage taken - damage taken 
"bez sprawcy", damage dealt - damage dealt "bez sprawcy")
- [x] Make the main panel visible when there is no data - only title bar is visible, when no battle data has been recorded
- [x] Show all combatants in a battle - currently we need a combatant's turn to see him on the list. 
I want every combatant to be visible at the beginning of a battle
- [x] Create a live preview on github pages
- [x] AGENTS.md is too large, and the information it has is not that relevant
- [x] Verify the amount of resources this add-on needs in a browser (maybe there is a need to check 
execution time for each function, and to create a heatmap, build a tool)
- [x] Row's background of "Bez sprawcy" is too tall, it does not match the height of the accent - each row SHOULD have the same height
- [x] "Bez sprawcy" still DOES NOT show data relevant to the selected tab, team, and direction
- [x] Add a tip window in sub panels for each player, just like in the main ones
- [x] Add an information about the preview link on github pages in README.md
- [x] Create a SPEC for considering using dev branch and main - which is always the latest release
- [x] Apply the SPEC for develop and main branch split
