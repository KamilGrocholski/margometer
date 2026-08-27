# Somebody else read the same protocol

Status: implemented

Another add-on reads the battle protocol this one reads, and publishes what it
found. `Lootlog` is a monorepo under the MIT licence; the part that matters here
is one package, `battle-processor`, and the key-by-key reference it ships beside
itself:

- <https://github.com/lootlog/monorepo/blob/main/packages/battle-processor/src/index.ts>
- <https://github.com/lootlog/monorepo/blob/main/packages/battle-processor/COMBAT_LOG_KEYS.md>

Read on 2026-08-27, at the repository's `main`.

It is worth a spec for one reason, and it is not the code. Their corpus is
player against player, group player against player, and Otchłań; ours is a
party against a boss, over and over, and a single duel. Two readers of one
protocol, each blind where the other sees — so the difference between the key
lists is not a scoreboard. It is a description of the fights this repository has
never recorded, written in key names instead of in wishes.

That is the whole of what this round takes from them. Nothing is decoded,
nothing enters `docs/protocol-keys.md`, and no line of theirs is copied.

## What it is, and why it is not a source

Their reference cites the same published help article this register cites,
`view,372`, and their own stored payloads. So the meanings in it are partly from
the operator and partly from observation — the second half being exactly what
§7.6 calls a claim about the game, and exactly what a reference like theirs
cannot carry a build for.

Two things settle it.

**The client does not spell everything they branch on.** Against the frozen
table lifted from production build `53XkBRxF`
(`tests/frozen-protocol-keys.ts`), their handled set includes `-block`, `+slow`,
and bare `stun`, `freeze`, `parry`, `evade`, `block`, `absorb`, `combo` and
`ph` — none of which that build knows under those names. Whether they are dead
branches, an older build, or a second spelling the bundle composes elsewhere is
not decidable from their file, and the difference matters: a reader taking their
list as a key list would be adding branches to `src/core/fight-decoder.ts` that
nothing can ever reach, and the fault would be silent because an unreachable
branch is exactly as green as a working one.

**Their processor answers where the log says nothing.** Three, each of them a
rule here written the other way round:

- the winning side, where neither `winner` nor `loser` places one, falls through
  to a *deterministic default* — the first side. §5: unknown is allowed, a guess
  is not, and `src/core/fight-statistics.ts` carries `isDrawn` and a `null`
  outcome rather than a coin toss.
- maximum health is derived from damage divided by the drop in the health
  percentage. `src/core/combatant-health.ts` takes maximum health from the
  roster and from nowhere else, refuses a combatant it has no maximum for, and
  says so on the row — because a maximum inferred from a rounded percentage is a
  figure nobody wrote, and every share sized against it inherits that.
- a value that does not parse becomes `0`. §9.3: unknown is loud, never zero.

None of that makes their reader wrong for what it is. It aggregates a corpus for
a website, and a website that shows a blank winner is worse for its readers than
one that guesses. This add-on makes the opposite promise. The consequence for us
is narrow and total: **their file decides what is worth looking up, and settles
nothing.** A key still reaches the register the way §7.6 says — the published
help for the meaning, the client bundle for the shape, a recording for the
number.

## What each reader has that the other has not

Taken on 2026-08-27, against the frozen table at build `53XkBRxF` and the
`— decoded` headings of `docs/protocol-keys.md`, on the tree this spec was
written on. Names and no counts: a count here would be stale on the next
recording, and the register states the same about itself.

**Read there, decoded here: neither list is short, and that is the finding.**
The keys they read and we do not are in the next section. The keys we read and
they do not are these:

`+acdmg_destroyed`, `+critpoison_per`, `+critsa`, `+stun2`, `+stun2-c`,
`+stun2-d`, `+superspell-dispel`, `-tenacity`, `active_block_per`, `afterheal`,
`allslow_per`, `aura-ac_per`, `aura-resall`, `en-regen-cast`, `npc_heal`,
`poison_lowdmg_per-enemies`, `prepare`, `removedot-allies`, `skillId`,
`tcustom`.

Read them as a description of our corpus and they stop looking like an
advantage: a monster's own regeneration, the heavy-stun family, the auras and
the dispel a full party brings, the custom skill name a boss announces.
They are the keys a party-against-a-boss recording carries and a duel does not,
in the same way theirs are the keys a duel carries and ours do not.

There is a third list, larger than both, of keys the client knows that neither
reader touches. `frost` is in it, and is already on `TODO.md` for want of
material.

## The keys this corpus would have to grow

Every key below is read by their processor, is in the client's frozen table at
build `53XkBRxF`, and has no entry in `docs/protocol-keys.md` — or has one only
under *Keys the captures have never carried*.

**None of them occurs in any recording here.** Measured on 2026-08-27 over every
message of every file in `tests/captured-fights/`: zero occurrences, each key,
under either the bare form or a valued one. That is the same absence
`tools/decoding-status.ts` reports from the other direction when it prints no
unread keys at all.

The observation that makes the list worth having: **almost every one of them is
the far half of a pair whose near half this decoder already reads.** What is
missing is not a design. It is a fight.

| What a reading would settle | Keys |
|---|---|
| A fight's ending, and there is no state for it | `flee` |
| Corroboration only — already `investigated` | `critwound`, `+critwound`, `-parry`, `+swing` |
| A figure in a unit already kept | `-arrowblock`, `+abdest`, `+actdmg`, `-redacdmg_per`, `-redabdest_per` |
| A figure in a unit no total keeps | `+endest`, `+energy`, `energyout`, `-manadest`, `stealmana` |
| No figure to carry at all | `+critpierce`, `+critsa_per`, `+crush_distance`, `+distract`, `+of_wound`, `+woundpoison`, `absolute`, `achpp_per` |

**`flee` is the one that is not a number.** `FightOutcomeEvent` knows won, lost
and drawn, and a fight somebody ran from is none of them. The register has no
entry for the key at all, and the panel has no word for the ending. Everything
else in the table would move a figure; this one would change what the panel can
*say* about a fight, which is why it sits alone.

The `investigated` keys need nothing from this spec. `critwound` and
`+critwound` already carry their help reading and the client's own composition,
and already carry the refusal: `+critwound` announces no figure, so the reading
`injure` gets is not available to it, and no resemblance is going to supply one.
`-parry` and `+swing` sit under the extra blow the game grants. What their
reference adds is one fact and it is about material, not meaning — every one of
them occurs in fights somebody has recorded. The absence here is our corpus,
not the game.

The middle two rows are the pairs. `-arrowblock` would join `-blok`, `-absorb`
and `-absorbm` in what a blow reports as prevented. `+abdest` stands beside
`+abdest_per` and `+abmdest_per`, `+actdmg` beside `+acdmg` and `+resdmg`, in
what a blow reports as destroyed. `-redacdmg_per` and `-redabdest_per` are
reductions of exactly those, in the shape `-poison_lowdmg_per` already takes on
a blow. The resource row is the same story one layer down: `-endest`, `mana`,
`energy`, `+engback` and `en-regen` are read as declarations because §10's test
puts them there — an outcome in a unit no total here keeps — and `+endest`,
`+energy`, `energyout`, `-manadest` and `stealmana` are their siblings, so what
a lookup settles for them is placement and never arithmetic.

The last row is the cheapest and the least interesting. `+critsa` and
`+crush_physical` are read; `+critsa_per` and `+crush_distance` are the same
effects stated the other way. What the help says about each decides whether it
is a proc on a blow or a valueless declaration, and neither answer moves a
figure.

⚠️ **Nothing here is an entry, and the ranking is not a plan to write one.** An
entry in `docs/protocol-keys.md` costs a help lookup at the engine name, the
client bundle's own composition of the message, and a measured absence or a
measured shape — the `critwound` entry is what that costs, and it is the
template. Doing that on their word instead is what §3 forbids. This table says
which lookups would repay themselves first, and the round that does one will be
a round that has the recording.

## The payload beyond the messages and the roster

Their client package types the battle envelope whole, which is worth writing
down because we read it a field at a time and have never listed what is in it:

- <https://github.com/lootlog/monorepo/blob/main/packages/margonem/src/game-events/f.ts>

It names `close`, `endBattle`, `m`, `mi`, `auto`, `battleground`, `current`,
`init`, `move`, `myteam` and `w`; and a sibling of the battle object,
`match_summary`, carrying an arena rating, a placement, a rating delta and a
daily stage.

**The comparison runs both ways here, and this direction is the surprising
one.** Measured on 2026-08-27 over the payloads of every file in
`tests/captured-fights/`, the envelope states fields their type does not name:
`skills`, `skills_disabled`, `skills_combo_max`, `poolTime`, `start_move` and
`turns_warriors`. Every recording carries the first three; the other three are
in most and not all, so they ride a payload rather than the opening one, and
which payload is not settled here. Their type is a description of what their
reader needs, not of what the game sends — which is the same thing this spec
says about their key list, arriving from the other side.

Of the fields they do name, `myteam`, `mi`, `auto`, `init`, `current`
and `move` are read here, and `endBattle` is spelled only by
`tools/fight-dump-parser.ts`. `battleground` is in every recording and is read
nowhere, correctly: it is the picture behind the fight.

⚠️ **`match_summary` is not merely absent — it is out of reach at this seam,
and an arena recording would not carry it either.** It is a sibling of `f`
inside the whole server event, and the seam here is `Engine.battle.updateData`,
whose first argument is `f` itself: every field `ladunek` holds is one of `f`'s,
and a sibling of `f` is not among them. Their reader sits a layer up, on the
game's own inbound dispatcher, so the whole event is what it is handed. Whether
the method's second argument carries anything is unknown and unread — the
wrapper takes `args[0]` and nothing else.

None of that is a defect, and saying why is the point of the section.
`parseFightDump` reads the fields it names and passes the payload through whole,
so an arena recording would not refuse at intake — the unread fields ride along
and are there for a later round. `match_summary` is the one that would not, and
reaching it means moving the seam, which is a decision about the promise §5
makes and not a detail. It would be worth little: by §10's test it is a
declaration, reporting what happened outside the fight in units no total here
keeps.

⚠️ **`turns_warriors` is not an invitation.** A turn is §10's one warned term
and nothing here counts them; the field being in the material was already true
before this spec noticed their type omits it, and it stays as unread as it was.

## What it would take for a foreign recording to be evidence here

`TODO.md`'s standing request is more material — higher levels, more opponents,
player against player. They have a corpus of exactly that. So the question has
to be asked plainly, and the answer is mostly no.

**Their unit is not ours.** They process rows out of the payload's message list.
A recording here is engine calls, each carrying the roster before, the roster
after, and the payload (`tools/fight-dump-parser.ts`).

**The roster would survive.** A payload stating `w` and no snapshots is a shape
this repository already handles: a fight fought on auto arrives whole in one
call, both snapshots empty, and `composeCombatantsOfPayloads` reads the roster
out of the payload —
`tests/captured-fights/2026-08-24-tempest-tropiciel-vs-centaury-auto.json` is
that recording.

**The entry health would not.** `src/core/combatant-health.ts` anchors on the
first whole figure stated about a combatant and falls back to the opening
snapshot, which is the only place a whole number appears for somebody the
messages never name; a percentage quantises, and a refusal is per combatant and
final. No entry health means no team heal can be sized and
`tests/core/health-witness.test.ts` has nothing to agree with — and those two
measurements are what §9.6's clauses are held by, not comments. A corpus that
cannot feed either would grow the key coverage while shrinking the evidence
behind the arithmetic.

**The nicknames.** A player-against-player recording is players at both ends.
§9.2 puts substitution in `tools/captured-fight-intake.ts`, which refuses what
it cannot redact, and it tells a player from a monster by the payload's own
`npc` flag. Whether a foreign payload carries that flag is unchecked, and it is
the first thing anybody would have to check — a recording that cannot be
redacted cannot enter the repository at all.

**The provenance.** A recording states when, which world, and which build. A
recording naming no build is already a shape this repository handles. A
recording whose world and hour are somebody else's is a different claim about
the material, and `docs/captured-fights.md` is written as a register of fights
somebody here fought.

So the conclusion runs the other way from the question. The cheapest route to
the top three rows of the table above is **one arena or player-against-player
session recorded through this add-on**: it would carry `flee`, the resource
keys and the block family at once, in a file that passes intake, states its
build, and feeds the health witness. What their work contributes is not the
material. It is knowing what to go and record, which is the part that was
missing.

## Rejected alternatives

**Filing the keys as `investigated` entries now.** The register's own template
costs a help lookup at the engine name, the client's composition of the message,
and a measurement — per key. Filing them on a third party's word instead is §3's
flat no, and the entry would read exactly like one that had been checked.
Deferred to the round that has the recording.

**Reading `flee` into the outcome now.** `src/core/battle-event.ts` is `[ASK]`
under §4, and no recording carries the key, so a fourth result would ship with
nothing to measure it against — the position `docs/protocol-keys.md` already
takes for `+critwound` and takes for the same reason.

**Adopting their coverage report.** Their processor returns a per-key handled
and unhandled tally so a page can show it. `tools/decoding-status.ts` answers
that question here, on demand, and §5 is why the answer is never quoted into
prose.

**Writing this as an audit.** §7.7's audit measures *this* repository against
its own rules and carries the commit it read. This reads somebody else's tree
and decides what we do about it, which is a design record.

**Putting the key list in `TODO.md`.** §5, and there is no version of it that is
not writing to that file.
