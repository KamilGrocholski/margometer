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

## Up Next
- [ ] Add support to all of the browsers

## Done
- [x] Fix the codebase where there is a name we did not choose, spelled twice, where nothing catches a disagreement (src, libs, tools, tests)
- [x] Add draw as an outcome
- [x] Fix user actions on click while the add-on is redrawing - I have to click multiple times on any 
tab, and button, to see the action, when the add-on is in the middle of drawing

## Later
- [ ] Create and update screenshots after each release, use `screenshots` dir to store it

---
## History

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
