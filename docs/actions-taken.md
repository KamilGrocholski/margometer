# Actions taken

What a combatant did on their turn, counted — and how that count stands against the one statement
the game makes about turns while a fight is running.

**An action is not a turn, and nothing here says it is.** `PRODUCT.md` rules a turn count out and
`CONTEXT.md` says why: the game numbers one ordinal in a fast fight, so a count of turns is not a
figure this add-on can state. What this document measures is whether a count of **actions** stands
where a count of turns cannot — and it is measured because a figure that multiplies into other
figures was withdrawn once already, for being wrong in a way nobody could see (**ADR 0048**).

**Read off the recordings, not written from memory.** `tests/tools/action-count.test.ts` composes
every verdict below through `tools/action-count.ts` and refuses a row naming a recording that is not
there, a recording no row names, or a verdict the tree does not produce. A line here that stops
being true fails the gate.

**No counts.** How many actions a recording holds changes with the next one, so it is measured
rather than written down (**V5**):

```bash
deno task actions                        # the register below
deno task actions --cases                # the counts behind each verdict
deno task actions captures/<file>.json   # one recording, payload by payload
```

## What an action is

Two readings, and the register grades both. Neither is a claim about the game's own numbering; each
is a claim about what this repository counted.

| reading   | counts                                                                  |
| --------- | ----------------------------------------------------------------------- |
| `struck`  | an announcement, or a blow carrying none                                |
| `stepped` | the same, and a `step` — the game's word for a combatant who only moved |

`struck` is what `a01bf11`'s commit body describes. `stepped` is what its deleted implementation
counted: over `captures/2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json` on 2026-09-01,
`struck` charges the two boars nothing and one, and `stepped` charges them one and three — which is
the split that commit reports. `docs/protocol-keys.md` owns what `step` means.

**The count is read twice and the two must agree.** `struck` is what the statistics already hold —
`skills[*].uses` and `blowsWithoutSkill`, summed over the rows — and it is also counted straight off
the events, where an action the protocol named no actor for is visible and a row cannot hold one. A
disagreement between the two is a finding, not a rounding, and an assertion stands on it.

## What the game says, and when

**`current` names who acts _next_.** The payload carrying it states whose turn is beginning, and the
actions of that turn arrive in the payload **after** it — measured over `captures/` on 2026-09-01,
where grading a payload against its own `current` puts every recording at `never`.

That is the whole of the reference. It is a statement per payload, not per turn, and a fight the
game delivers in one payload makes it once or not at all.

## The outcomes

What one graded payload came to, against the combatant the payload before it named.

| outcome   | means                                                    |
| --------- | -------------------------------------------------------- |
| `alone`   | the payload carried one action, and it was theirs        |
| `leading` | they acted, and somebody else acted in the same payload  |
| `silent`  | the payload carried actions and none of them were theirs |
| `empty`   | the payload carried no action at all                     |

`empty` grades nothing and is counted apart. A payload with no action in it says neither that the
reading works nor that it does not, and folding it in either direction would be inventing evidence.

## The verdicts

| verdict     | means                                                           |
| ----------- | --------------------------------------------------------------- |
| `always`    | the named combatant acted in every graded payload               |
| `sometimes` | in some of them                                                 |
| `never`     | in none of them                                                 |
| `in a lump` | nothing to grade: the game never named who acts next twice over |

A verdict outside that list is refused rather than read as silence.

## The register

| recording                                                         | struck      | stepped     |
| ----------------------------------------------------------------- | ----------- | ----------- |
| 2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none            | `in a lump` | `in a lump` |
| 2026-08-06-tempest-grupa-vs-hildur-1785244275300-none             | `sometimes` | `sometimes` |
| 2026-08-11-tempest-tancerz-vs-wermont-1786441768914-none          | `in a lump` | `in a lump` |
| 2026-08-12-experimental-tancerz-vs-wojownik-1781609507010-none    | `in a lump` | `in a lump` |
| 2026-08-12-tempest-grupa-vs-draugr-1-1786514810315-none           | `always`    | `always`    |
| 2026-08-12-tempest-grupa-vs-draugr-2-1786514810315-none           | `sometimes` | `sometimes` |
| 2026-08-12-tempest-grupa-vs-hildur-1-1786514810315-none           | `sometimes` | `sometimes` |
| 2026-08-12-tempest-grupa-vs-hildur-2-1786514810315-none           | `always`    | `always`    |
| 2026-08-14-tempest-grupa-vs-draugr-1-1786514810315-none           | `sometimes` | `always`    |
| 2026-08-14-tempest-grupa-vs-draugr-2-1786514810315-none           | `always`    | `always`    |
| 2026-08-14-tempest-grupa-vs-hildur-1786514810315-none             | `sometimes` | `sometimes` |
| 2026-08-15-tempest-grupa-vs-draugr-1-1786514810315-none           | `always`    | `always`    |
| 2026-08-15-tempest-grupa-vs-draugr-2-1786514810315-none           | `always`    | `always`    |
| 2026-08-15-tempest-grupa-vs-hildur-1-1786514810315-none           | `always`    | `always`    |
| 2026-08-15-tempest-grupa-vs-hildur-2-1786514810315-none           | `sometimes` | `sometimes` |
| 2026-08-15-tempest-grupa-vs-hildur-3-1786514810315-none           | `sometimes` | `always`    |
| 2026-08-15-tempest-grupa-vs-hildur-4-1786514810315-none           | `sometimes` | `always`    |
| 2026-08-17-tempest-grupa-vs-hildur-1786514810315-none             | `sometimes` | `sometimes` |
| 2026-08-23-tempest-grupa-vs-hildur-1786514810315-none             | `always`    | `always`    |
| 2026-08-23-tempest-grupa-vs-hildur-auto-1786514810315-none        | `in a lump` | `in a lump` |
| 2026-08-24-tempest-tropiciel-vs-centaur-1786514810315-none        | `in a lump` | `in a lump` |
| 2026-08-24-tempest-tropiciel-vs-centaury-auto-1786514810315-0.8.1 | `in a lump` | `in a lump` |
| 2026-08-25-luvia-grupa-vs-draugr-auto-none-none                   | `in a lump` | `in a lump` |
| 2026-08-25-luvia-grupa-vs-draugr-none-none                        | `always`    | `always`    |
| 2026-08-25-luvia-grupa-vs-mamlambo-auto-none-0.8.1                | `in a lump` | `in a lump` |
| 2026-08-26-luvia-grupa-vs-draugr-53XkBRxF-0.8.1                   | `always`    | `always`    |
| 2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0                | `sometimes` | `sometimes` |
| 2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0                  | `sometimes` | `sometimes` |

## What the register says

**`stepped` grades no worse than `struck` on any recording, and better on some.** Where the two
differ, it is always `sometimes` under `struck` becoming `always` under `stepped`, and never the
reverse — a combatant the game named who struck nothing had moved, and `struck` cannot see it. The
table above is where to read which recordings those are.

**`in a lump` is not a failure of the reading.** It is a recording the game numbered once, which is
the case `a01bf11` withdrew the whole feature over: a fast fight delivers its entire log in one
payload, and there is no second statement of the game's for a count to stand against. Both solo
recordings and every `auto` recording sit there.

**No action in the corpus arrives without an actor**, 2026-09-01 — so over this material the rows
hold every action the events do. The reading keeps the term anyway, because the protocol can name
one end and not the other, and a count that quietly dropped those would be short by an amount
nothing states (**E10**).

## What this cannot answer

- **How many turns a fight ran.** No key names a turn (`docs/protocol-keys.md`), and `current` is a
  statement about the next one rather than a count of those taken.
- **Whether a payload is a turn.** `leading` is common, so a payload frequently carries the actions
  of more than one combatant. A count of payloads is not a count of anything a player would
  recognise.
- **Whether the count is right in a fight nobody recorded.** Every verdict here is a claim about
  `captures/` and about nothing else (**V4**).
