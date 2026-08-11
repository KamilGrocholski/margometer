# Reading a live fight

Status: implemented

How the add-on gets the battle protocol out of a running game, and what it
promises the game in exchange. Everything below about the client was read from
the cached bundles and carries the build it was read on (§7.6).

## Why a wrapper and not polling

The protocol exists **only in the argument of one call** and settles nowhere.
After that call, `Engine.battle` holds *state* — warriors, health, whose turn —
not events. Polling it yields a health curve and nothing about what happened, so
there is no version of this add-on that reads the protocol without wrapping.

That is worth stating plainly because it is the point where the add-on stops
being a pure observer: it replaces a function on an object belonging to someone
else's program. What it promises in return is the whole of §5 and the list below.

## Where the payload arrives

`Engine.battle.updateData(v, data)`, where `v` carries `init`, the warrior map
`w`, and the message list `m`.

*Evidence:* production build `1785244275300` — `on_f:function(e,t){…,
Engine.battle.updateData(e,t)}` — and the same in development build
`1781609507010`, where the handler is readable and checks `v.init == 1` before
handing over.

⚠️ **The previous incarnation wrapped `Engine.battle.update` and that name is not
the one this build calls.** It was read from `main`, not from the client, and
this entry exists so the next reader does not inherit it. A wrap on the wrong
function reads nothing at all and looks exactly like a fight nobody fought.

## The battle object is built once, not per fight

`Engine.battle` is constructed during Engine initialisation and never replaced:
production `1785244275300` contains exactly one assignment to it,
`this.battle=new Wt`, beside `this.rajWindowEvents.init()`. The other two
matches for `.battle=` set a boolean on an unrelated object. The development
build shows the same line unminified, with the per-fight construction
(`if (!Engine.battle) { Engine.battle = new Battle(); }`) **commented out**.

This matters because it removes a whole mechanism. The previous incarnation ran a
timer every 150 ms comparing the identity of `Engine.battle`, because it believed
the game swapped the object with each fight. On this build there is nothing to
watch: wrap it once and the wrap stays.

## The race that remains, and its size

A window still exists, but a different one: between the page creating
`Engine.battle` and our script running. A fight already in progress when the user
installs or reloads is simply not ours to count.

**Measured on the captured material, because the size of this window decides how
loudly it must be reported:** the boar fight delivers all 18 of its messages in a
*single* engine call — 100% of the fight in one payload. The group fight's
largest call carries 22 of 603, about 4%. So a short fight is all-or-nothing, and
a missed attach cannot be treated as a small gap in a total.

The answer is not a tighter timer. It is that a fight we joined late is **said to
be** joined late, rather than shown as a total that happens to be low — which is
§9.6's rule about a number that might be wrong never looking like one that is
right.

## What the wrap promises

Five properties, each with a test:

1. **The original runs first, and its return value comes back untouched.** We are
   a bystander in someone else's call stack.
2. **No exception of ours reaches the game.** The reading is wrapped so that a
   bug in the decoder cannot break the game's own script — the single worst
   outcome available to this add-on.
3. **Detaching removes only our layer.** The wrapper carries a marker with a
   version; if something else has since wrapped on top of us, we leave it alone
   rather than tearing out its work.
4. **Wrapping twice does nothing.** Two layers on one function would make every
   promise above unverifiable.
5. **Detach restores what was actually there.** `updateData` reaches the object
   through its prototype, so assigning the original back would leave an own
   property shadowing the class forever. The wrap records whether the object owned
   the function before, and either restores it or deletes the own property.

## Sides

The roster comes from `Engine.battle`'s warrior map, and each warrior states a
`team`. Which team is the **player's own** is stated separately, as
`myteam` — production `1785244275300` carries `myteam:1` beside warriors holding
`team:2`.

That answers a question `src/core/combatant-roster.ts` deliberately left open.
`core` groups sides by their bare number and favours none, because a capture does
not record who recorded it. Ours-and-theirs is knowable **only here**, and stays
here: no core type changes, so the decoder/aggregator contract is untouched.

**The roster accumulates and is never replaced by an empty snapshot.** Measured:
both captures contain a call whose warrior list is empty, and the fight-closing
message can arrive after the game has already tidied its state. A roster that
vanishes takes every name resolution with it, and names are how damage stated
against a name reaches a row at all.

## Rejected alternatives

- **Polling `Engine.battle` instead of wrapping.** Cannot work: the events are
  not there afterwards. This is why the add-on accepts the cost of replacing a
  function at all.
- **Wrapping `Engine.battle.update`**, as the previous incarnation did. Not the
  function this build calls — see above.
- **A timer watching the battle object's identity.** Defends against a swap this
  build does not perform. It would be machinery whose failure mode is invisible:
  a timer that never fires looks identical to one that has nothing to do.
- **Reading through the game's own event bus** rather than the function. Nothing
  in the bundle publishes the raw payload; `on_f` hands it straight on.
- **Assigning the original function back on detach.** Leaves an own property
  where the class had none, so the object is permanently altered by an add-on
  that has been removed.
- **Reaching for `window.Engine` inside the wrap.** Taking the engine as an
  argument keeps the module testable without a browser and keeps every global
  access in one place a reader can audit.
