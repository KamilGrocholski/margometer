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
- [ ] Verify the amount of resources this add-on needs in a browser (maybe there is a need to check execution time for each function, and to create a heatmap)
- [ ] Panel does not respond immediately to user actions - dragging/moving the panel, changing tabs, navigating into a section, and going back.

## Done
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

## Later
- [ ] Add draw as an outcome (there is a problem with the protocol key, to make it work - do it later)
- [ ] Read a battle messages incrementaly (just do a SPEC for now, nothing else)
- [ ] Use constants instead of literals for the protocol keys (maybe everything except the ui text, not only the protocol keys)
- [ ] Create and update screenshots after each release, use `screenshots` dir to store it
