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
- [ ] Panel does not respond immediately to user actions - dragging/moving the panel, changing tabs, navigating into a section, and going back.
- [ ] Show all combatants in a battle - currently we need a combatant's turn to see him on the list. 
I want every combatant to be visible at the beginning of a battle
- [ ] Create and update screenshots after each release, use `screenshots` dir to store it
- [ ] Add draw as an outcome

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

## Later
- [ ] Read battle messages incrementaly
- [ ] Use constants instead of literals for protocol keys (maybe everything except the ui text, not only protocol keys)
