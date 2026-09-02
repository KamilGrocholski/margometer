# Turns taken

How many turns each combatant took, and how that count stands against the game's own numbering of
them.

**The game defines the word, and this document does not.** The published help says a turn is a
numbered action — numbered from 1 upward, held by one character at a time, and taken automatically
by the server where the player lets the clock run out (article 372 §2.1 and §2.2, read 2026-09-02).
So a count of what each combatant did on their turn is a count of their turns, and **ADR 0048**
carries why that is now stated rather than avoided.

**Read off the recordings, not written from memory.** `tests/tools/turn-count.test.ts` composes
every verdict below through `tools/turn-count.ts` and refuses a row naming a recording that is not
there, a recording no row names, or a verdict the tree does not produce. A line here that stops
being true fails the gate.

**No counts.** How many turns a recording holds changes with the next one, so it is measured rather
than written down (**V5**):

```bash
deno task turns                        # the register below
deno task turns --cases                # the counts behind each verdict
deno task turns captures/<file>.json   # one recording, payload by payload
```

## What opens a turn

The count lives in `src/core/fight-statistics.ts` as `turnsTaken`, so what a row draws and what is
graded here are one number. Four things open a turn, and two of them are the game's own default
actions — an attack and a step forward (§2.3):

| opens a turn                | which is                                                 |
| --------------------------- | -------------------------------------------------------- |
| a skill announcement        | the combatant used something they had learned            |
| a blow standing behind none | the default attack, announced as nothing                 |
| a `step` declaration        | the other default action: the combatant moved and struck |
| a `prepare` declaration     | the turn went on making a skill ready and nothing else   |

Two things look like a turn and are not. Each is an exception the material produced, not one
somebody expected:

- **An extra attack of an announcement still running.** The help says the additional attacks of a
  skill are all one turn (§2.1, and the `add_attacks` effect in §3.7, read 2026-09-02). The decoder
  glues an announcement to the message after it and no further, so the second blow of a two-hit
  skill arrives announced as nothing and would read as a turn of its own. Ten of the corpus's graded
  steps are exactly this.
- **A preparation stated beside its own combatant's action.** Where a `prepare` follows an action of
  the same combatant it is part of that turn; where it stands alone, the turn went on it. Both
  shapes occur, and the second is how three of the corpus's graded steps pass at all.

`step` and `prepare` are `docs/protocol-keys.md`'s to explain. The help documents the first and says
nothing of the second, so what `prepare` costs a combatant is measured here rather than cited.

## What the game states, and where it can be checked

**The turn number is in the envelope, not in a message.** `turns_warriors` is the queue the client
draws as its prediction list (§1.1): a turn number to the combatant who will hold it. Its least
entry is the turn in progress, and the payload's `current` names that same combatant in every
payload carrying both — asserted rather than reported, because a disagreement would be this reader
breaking rather than the game moving.

⚠️ **Only the least entry is a statement.** The nine above it are a forecast of who will hold turns
not yet taken, and `a01bf11` measured that forecast contradicted by the game's own later statements
3% of the time one turn ahead and 28% at nine. Nothing here reads them.

**A step is graded only where the ordinal advanced by exactly one.** One turn passed, the queue
names whose it was, and no forecast is involved. A wider advance covers turns this reading cannot
line up one to one — a payload may narrate several, and a turn may be narrated across two payloads —
and grading it would be inventing evidence.

## The verdicts

| verdict     | means                                                                |
| ----------- | -------------------------------------------------------------------- |
| `always`    | every step the game numbered one turn apart was counted as that turn |
| `sometimes` | some of them were                                                    |
| `never`     | none of them were                                                    |
| `in a lump` | nothing to grade: the game never numbered two turns in a row         |

A verdict outside that list is refused rather than read as silence. What one graded step came to is
one of four — `exact`, `over`, `under`, `elsewhere` — and `deno task turns --cases` states them.

## The register

Two readings side by side. The verdict is the sharp one — every step the game numbered a single turn
apart. `granted`, `taken` and `short` are the wider one, over the stretch between the game's first
statement of an ordinal and its last; a recording it never numbered twice has no stretch, and that
is written as a dash rather than as a zero (**E10**).

| recording                                                         | the game agrees | granted | taken | short |
| ----------------------------------------------------------------- | --------------- | ------- | ----- | ----- |
| 2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none            | `in a lump`     | —       | —     | —     |
| 2026-08-06-tempest-grupa-vs-hildur-1785244275300-none             | `always`        | 298     | 276   | 22    |
| 2026-08-11-tempest-tancerz-vs-wermont-1786441768914-none          | `in a lump`     | —       | —     | —     |
| 2026-08-12-experimental-tancerz-vs-wojownik-1781609507010-none    | `in a lump`     | —       | —     | —     |
| 2026-08-12-tempest-grupa-vs-draugr-1-1786514810315-none           | `always`        | 197     | 191   | 6     |
| 2026-08-12-tempest-grupa-vs-draugr-2-1786514810315-none           | `always`        | 217     | 204   | 13    |
| 2026-08-12-tempest-grupa-vs-hildur-1-1786514810315-none           | `always`        | 281     | 270   | 11    |
| 2026-08-12-tempest-grupa-vs-hildur-2-1786514810315-none           | `always`        | 230     | 227   | 3     |
| 2026-08-14-tempest-grupa-vs-draugr-1-1786514810315-none           | `always`        | 186     | 179   | 7     |
| 2026-08-14-tempest-grupa-vs-draugr-2-1786514810315-none           | `always`        | 218     | 203   | 15    |
| 2026-08-14-tempest-grupa-vs-hildur-1786514810315-none             | `always`        | 242     | 230   | 12    |
| 2026-08-15-tempest-grupa-vs-draugr-1-1786514810315-none           | `always`        | 59      | 57    | 2     |
| 2026-08-15-tempest-grupa-vs-draugr-2-1786514810315-none           | `always`        | 216     | 204   | 12    |
| 2026-08-15-tempest-grupa-vs-hildur-1-1786514810315-none           | `always`        | 56      | 54    | 2     |
| 2026-08-15-tempest-grupa-vs-hildur-2-1786514810315-none           | `always`        | 239     | 226   | 13    |
| 2026-08-15-tempest-grupa-vs-hildur-3-1786514810315-none           | `always`        | 214     | 206   | 8     |
| 2026-08-15-tempest-grupa-vs-hildur-4-1786514810315-none           | `always`        | 214     | 206   | 8     |
| 2026-08-17-tempest-grupa-vs-hildur-1786514810315-none             | `always`        | 123     | 115   | 8     |
| 2026-08-23-tempest-grupa-vs-hildur-1786514810315-none             | `always`        | 186     | 180   | 6     |
| 2026-08-23-tempest-grupa-vs-hildur-auto-1786514810315-none        | `in a lump`     | —       | —     | —     |
| 2026-08-24-tempest-tropiciel-vs-centaur-1786514810315-none        | `in a lump`     | —       | —     | —     |
| 2026-08-24-tempest-tropiciel-vs-centaury-auto-1786514810315-0.8.1 | `in a lump`     | —       | —     | —     |
| 2026-08-25-luvia-grupa-vs-draugr-auto-none-none                   | `in a lump`     | —       | —     | —     |
| 2026-08-25-luvia-grupa-vs-draugr-none-none                        | `always`        | 45      | 45    | 0     |
| 2026-08-25-luvia-grupa-vs-mamlambo-auto-none-0.8.1                | `in a lump`     | —       | —     | —     |
| 2026-08-26-luvia-grupa-vs-draugr-53XkBRxF-0.8.1                   | `in a lump`     | —       | —     | —     |
| 2026-08-27-luvia-grupa-vs-amaimon-2-53XkBRxF-0.9.0                | `always`        | 305     | 280   | 25    |
| 2026-08-27-luvia-grupa-vs-amaimon-53XkBRxF-0.9.0                  | `always`        | 26      | 24    | 2     |

## What the register says

**Where the game numbers a single turn, it agrees with this count every time it can be asked.** No
recording grades `sometimes` or `never`, and no step grades `over`, `under` or `elsewhere`.

**`in a lump` is not a failure of the reading.** It is a recording the game numbered once, which is
the case `a01bf11` withdrew the whole feature over: a fast fight delivers its log in one payload and
states its numbering once, so there is no second statement for a count to stand against. Both solo
recordings and every `auto` recording sit there. The count is still drawn on those fights, because
it comes from what the combatants did and not from the numbering — which is the difference between
this and the divisor that was withdrawn.

**No combatant enters a fight by stepping or preparing alone**, 2026-09-02: counting the two
declarations adds turns to rows that exist and creates none, so the fights `tools/fight-figures.ts`
prints hold exactly the rows they held before.

## Taken, not granted

⚠️ **The two columns do not meet, and the gap is the point of carrying them both.** `short` is never
zero on most of the corpus, it is never negative anywhere, and the sharp verdict cannot see it: a
step the game numbers one turn apart is a step where nothing goes missing.

**The difference is a turn the game granted and nobody spent.** A stunned combatant is given their
turn, does nothing with it, and the game says so in a line of its own naming them — a line this
register does not quote, because it is the game's own prose (`NOTICE.md`). Measured over `captures/`
on 2026-09-02: of the 130 steps where the count came up short, **127 are short by exactly the number
of such lines the same payload carried**.

The other three have causes of their own, and neither is the reading miscounting a turn it saw:

- one is a payload stating an ordinal thirteen further on while carrying two messages — the turns it
  covers were narrated in the payload before it, so the count is in the fight and not in that step;
- two are a `prepare` at nought per cent standing after its own combatant's blow, where this reading
  treats it as riding that blow's turn. Both directions cost something and the sharp test is what
  picked this one: counting such a preparation unconditionally makes two steps of the corpus
  overstate instead.

**So the figure is turns _taken_, and the card says so.** `Tury wykonane` is the game's own wording
— the published help counts a combatant's turns with the same verb (article 372 §2.1, read
2026-09-02).

## Who else counts this

Two independent readings were looked at before this one was settled, and neither is a source this
repository can lean on — but what they do says which figure is the one to show.

**The game's client does not count turns at all.** `newTurn(data.current)` decides whether it is the
reader's move and sets a sound; `updateTurnPredictions(turns)` walks the queue with
`for (let i in
turns)` and reads only its values, never its keys. Development build `1781609507010`,
read 2026-09-02. The turn-loss sentence is in neither the client nor its dictionary, so the server
composes it.

**`grooove.pl` counts turns per combatant and counts the same figure this does.** Its fight viewer
keeps `X.Xtury` and increments it on an enumerated list of action keys; the key carrying that
sentence is displayed and never counted, so its figure is turns taken as well. Read 2026-09-02.
Every key on that list was checked against `captures/` the same day: each one arrives on a skill
announcement this reading already counts as one turn, and the only one standing alone is a
declaration in the opening payload of a fight, which is a passive effect rather than an action. A
list of keys is the reading `a01bf11` refused, and that check is why it stays refused.

## What this cannot answer

- **How many turns a fight ran.** The ordinal span would say, and it is not drawn: five recordings
  join a fight already in progress, so the span is short by an amount nothing states, and a fight
  the game numbered once has no span at all. No figure on the panel is a fight's turn count.
- **How many turns somebody was granted.** That is `taken` plus the turns they lost, and which
  combatant lost one is stated only in prose, in the language of the world the fight was fought on.
  **ADR 0048** says why that is not read.
- **Whether anything divides by a turn.** Nothing does, and **ADR 0048** is why.
- **Whether the count is right in a fight nobody recorded.** Every verdict here is a claim about
  `captures/` and about nothing else (**V4**).
