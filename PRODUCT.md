# MargoMeter product direction

MargoMeter is a damage meter for [Margonem](https://www.margonem.pl/), shipped as a userscript that
draws a statistics panel over the running game. This document is the canonical source for what it is
for. It is a design constraint, not a description of what already works — `ARCHITECTURE.md` says
what exists.

## The product in one line

**It reads and does nothing else.** No network requests, no automation, no influence on how a fight
plays out.

## Who it is for

The **reader**: one person, running the add-on in their own browser, looking at their own fight.
There are no accounts, no groups, no shared state and no server. Everything the panel knows, it read
off the page a moment ago or off this browser's own storage.

Secondarily, whoever wants to understand the battle protocol: `docs/protocol-keys.md` is a public
record of what each key means and how we know.

## The core problem

The game's own battle log is a stream of sentences. It says what happened and never what it came to.
A player finishing a ten-on-one fight cannot say who carried it, what stopped the damage, or where
the healing went.

The hard part is not the arithmetic — it is **honesty about what the protocol does not say**. A
meter that quietly rounds an unreadable message down to zero produces a number that looks exactly
like a correct one. Everything below follows from refusing that.

## Pillars

1. **Read the whole protocol, or say which part you could not.** An unrecognised key becomes an
   explicit unknown and reaches the panel. Coverage is measured against `captures/` by the gate,
   never quoted from memory.
2. **Attribute only what the game named.** A figure is charged to a combatant when the protocol
   states that end. Where it states one end, the rules in `ARCHITECTURE.md` say exactly when the
   other may be filled and from what — each narrow, each listed.
3. **A number that might be wrong never looks like a number that is right.** Suspect and undrawn are
   visible states, placed next to the figure they concern.
4. **Be a guest.** The panel is a visitor on somebody else's page, and never costs the reader their
   game — not a frame, not a click, not an exception. `SECURITY.md` says how.

## Feature tiers

- **Core** — implements a pillar. The ranking, the decoder, the unknown-and-suspect marking, the
  summary bar.
- **Supporting** — makes a core workflow safer, clearer or easier. The drill levels, kept fights,
  the storage choice, the location line.
- **Experimental** — requires a hypothesis, a measure and a review date. Nothing is here today.
- **Deprecated** — carries an explicit removal path.

Merging something does not make it core. A tier change is a change to this file.

## Trade-offs, in order

When two of these conflict, the earlier one wins:

1. Do not interfere with the game. An exception of ours reaching the engine breaks the one promise
   the add-on makes.
2. Do not report a figure we cannot stand behind.
3. Do not cost the reader's browser more than the reading is worth.
4. Keep the code checkable by a machine.
5. Keep it small.

Panel performance is a release gate, not follow-up polish. Under pressure the panel draws less; it
never decodes less and never hides that it drew less.

## Success measures

There is no telemetry, and there will not be: the add-on sends nothing, so nothing here can be
counted remotely. That is a deliberate cost, and it means success is argued rather than measured.
Three things stand in for metrics:

- **Protocol coverage** over `captures/`, asserted by the gate rather than reported by a tool.
- **Agreement with the recordings** — figures the meter computes against health snapshots the
  protocol never states.
- **The register in `docs/protocol-keys.md`**: how many keys have a verdict backed by evidence
  rather than a guess.

A claim about the add-on in a README or a release note is backed by one of those three, or it is not
made.

## Non-goals

MargoMeter does not, and will not within this horizon:

- send anything anywhere, including anonymous statistics;
- automate movement, combat or any decision;
- change how a fight plays out, in any direction, for anybody;
- claim the operator's approval or guaranteed compliance with their terms;
- support games other than Margonem;
- carry accounts, groups, a server or shared state;
- collect, transmit or retain a player's nickname;
- present the game's own sentences as this project's work;
- divide any figure by a turn count, or state a rate per turn;
- guess a name the protocol did not carry.

## Language

The reader's language is Polish: the panel, `README.md`, `CHANGELOG.md` and the release notes.
Everything else — code, comments, tests, this document, commits, ADRs — is English. `AGENTS.md`
**L1–L3** binds.

## Governance

The maintainer decides direction. `TODO.md` is their hand-kept list and no tool writes to it. A
decision that is costly or surprising to reverse gets an ADR (`docs/adr/README.md`); everything else
lives in the commit that made it.
