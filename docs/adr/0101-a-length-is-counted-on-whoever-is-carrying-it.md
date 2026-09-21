# 0101. A length is counted on whoever is carrying it, not on whoever cast it

- **Status:** Accepted
- **Date:** 2026-09-21

## Context

**ADR 0059** put a length in the window as elapsed of stated, and counted the elapsed half on the
caster. Its own Context said the caster; its own Decision said the bearer; the code has always taken
the clock off `casterId`. Nobody noticed, because on a cast reaching a side the caster is a bearer
too, and the row drawn under them reads right for exactly one of the people it covers.

A player said the opposite in passing — that an aura runs for the turns of whoever received it — and
two sources were asked. Both answer the same way, and neither had been read for this question.

**The published help dates a length to the bearer, key by key.** Article `view,372`, read
2026-09-15. Six of the keys this repository draws carry `wykonanych przez nich tur`, of the caster
**and their allies**; `active_decblock_per-enemies` carries `od tur przeciwników`. The control is in
the same article: `active_decblock_per`, the single-target spelling of that same effect, carries
`tur ukończonych przez Postać rzucającą`. So the help distinguishes the two, and every team-wide key
it dates is dated to the bearer. It dates `shout` nowhere.

**The recordings agree, on a channel nothing here had read.** `w[].buffs` is one integer per
combatant restated in every payload, and `ADR 0061` set it aside as the source that would answer per
combatant but could not be joined to a cast. Joining it to a cast is not needed to time it.
`tools/aura-lifetime.ts` walks every recording for moments that light one status on several
combatants at once, and `docs/auras-standing.md` carries the register. The column that settles it is
`apart+agree`: bearers who carried a status for the **same count of their own turns** and went out
at **different moments**. One clock on the caster produces one going-out.

And the figure lands: the length most runs of `speed_up` came to is the same eight the published
table gives `Podwójny dech`, counted on the bearer.

## Decision

**A length is the bearer's, and this repository says so before it draws anything differently.** The
document states it, the register re-earns it, and `src/core/aura-standing.ts` is unchanged in the
commit that lands this. Measuring and repairing in one move would have put a new model in front of a
player on the strength of a reading nobody could yet check.

**What the window draws today joins two clocks**, and the document says that where the fraction is
described rather than only where the model is. `3 z 8 tur` counts the numerator on the caster and
takes the denominator from a table that means the bearer. Both halves stay honest alone; the join is
the claim, and it is nobody's.

**The mask is read by tooling and not by the bundle.** `frozen/buff-bits.ts` names the nine statuses
in the order the client registers them, because a mask is read by position and a bit inserted ahead
of another renames every status after it without changing a count. `deno task game:readings` reports
it beside the key table, dated by the same build.

**What has no witness stays open.** No bit stands for a provocation, and the help dates `shout`
nowhere, so the claim that a shout runs on the shouted character's turns is neither carried nor
refused. The document says that rather than leaving the silence to read as agreement.

## Consequences

Easy: the reading is cheap to re-earn. Two `deno task` lines produce both halves, and a guard holds
the document to the measured one in both directions.

Hard: **the repair is not obvious, and that is why it is not here.** Naming a bearer is what **ADR
0061** refuses — the mask carries no caster and no stated total, so a per-bearer countdown would
draw rows nothing can attribute. The choices are to say the figure is the caster's where it is
drawn, to drop the fraction, or to reopen 0061 on the strength of this channel. Each is a different
panel, and none of them is a measurement.

Also: **a refresh nobody saw reads as one long run.** A second cast landing while a bit is lit makes
no edge, so the closing run is the pair. The register reports the length most runs came to rather
than a mean, which is what survives that.

## Alternatives

**Repairing the panel in the same round.** Rejected, and this is the whole of the reason: the model
being wrong is now measured, and the model that replaces it would not be.

**Taking the player's word.** It was right, and it was still a claim about somebody else's system
with nothing behind it. Had the two sources disagreed with it, the finding would have been the
disagreement (**V6**) rather than the claim.

**Reading the mask into `src/`.** The bundle would carry a reader for a channel the panel draws
nothing from. `tools/` is where a reading that settles a document belongs until a panel needs it.
