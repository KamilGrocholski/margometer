# A recording that names no build

Status: implemented

The add-on stamps the client's build id onto every recording, and writes `null`
where the page did not state one — deliberately, because §7.6 holds that material
from the game without the client's version is not comparable material, and a
recording quietly claiming a build would be worse than one admitting it has none.

`tools/fight-dump-parser.ts` then required that field to be a string. The two
sentences together said: a recording the add-on could not date is one this
repository cannot read at all. Nothing decided that; it fell out of a
`requireString` and a comment in `src/game/fight-capture.ts` claiming the intake
tool refused such a file "by name" — which it never did. `composeIntakePath`
checks `przy` and `swiat` and has never looked at `build`. The refusal was the
parser's, one step later, and it arrived after the file was already written into
`tests/captured-fights/`: the intake succeeded, and the next run of the gate went
red on every guard that walks the material.

That was found by a recording worth having.
`tests/captured-fights/2026-08-25-luvia-grupa-vs-mamlambo-auto.json` is the first
fight from a third world, and it brought four protocol keys no earlier recording
carried. Its `build` is `null`.

## What this settles

**A recording that names no build is material, and the register says so.**

- `tools/fight-dump-parser.ts` reads `gameBuild` as `string | null`. Only an
  explicit `null` passes: a recording with no such field, or one stating a
  number, an empty string or an object, still stops the read. *The recording says
  it does not know* and *this tool cannot read the recording* are different
  answers and stay that way.
- `docs/captured-fights.md` states the absence in words, in the build column,
  where somebody deciding what to record next can see it. That is where §7.6's
  consequence now lives: the row says the fight is comparable with nothing, and a
  reader weighs it.
- `tests/tools/captured-fight-catalog.test.ts` keeps `""` refused. An empty build
  is a recording claiming to know one it does not, and the assertion that used to
  catch it — `not.toBe("")` — goes green on `null` without checking anything.

**What did not change.** Nothing infers a build. The absence is carried, never
filled from a neighbouring recording, from the capture date or from the newest
build the repository knows — each of which would be §5's guess wearing a date.

## Rejected alternatives

**Refuse the recording, as the parser already did.** The honest reading of §7.6,
and it costs a world, a fight and four keys for a field that decides nothing about
what the file holds. A build dates a *claim about the client* — how a message is
composed, what a key means. It does not date the protocol the file recorded: the
messages, the snapshots and the percentages are what they are, and every guard
that walks the material reads those. Refusing the file protected no claim and
deleted the evidence.

**Substitute the newest build the repository knows.** Turns an unknown into a
figure nobody wrote, which §9.3 and §9.5's table both refuse. It would also be
wrong here in a way nothing could notice: this recording was made by a client
newer than the last one the tooling could identify.

**Fix the reader instead, so no recording is ever buildless.** Out of scope for
this round and not a substitute for it in any case. The recording is frozen
evidence (§9.2) and would stay buildless however the reader is fixed, so the
parser has to admit one either way.

**Keep the refusal but move it into `tools/captured-fight-intake.ts`, making the
comment true.** Tempting, because it fails before a file is written rather than
after. Same loss, one step earlier — and it would have made the register's build
column a field that can only ever hold a build, which is exactly the column that
should be able to say *none*.
