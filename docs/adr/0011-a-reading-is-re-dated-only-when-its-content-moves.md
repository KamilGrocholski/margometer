# 0011. A reading is re-dated only when its content moves

- **Status:** Accepted
- **Date:** 2026-09-27

## Context

ADR 0005 has `deno task game:readings refresh` write every frozen file from what it has just
fetched. Every file in `frozen/` carries the build or the fetch it was read on, so a refresh rewrote
all six even when the game had said nothing new: the help and the skill table re-fetched on
2026-09-27 gave the same 119 counts and 226 skills as the fetch of 2026-09-23, and the refresh still
moved four dates. A refresh was therefore a diff to commit every time, and it was run only when a
status went STALE, a week at the least for the help.

`status` decided the same way: a frozen reading was current where its date equalled the cached
fetch's. After any re-fetch, every frozen row read STALE until a refresh wrote the same content
under a new date.

The maintainer asked for the readings to be current at the start of every round, and during one
where the work leans on the game (2026-09-27).

## Decision

Decided with the maintainer on 2026-09-27.

**A frozen reading carries the build or fetch that first gave its content.** A freeze encodes what
the cache gives under the date the file already carries. Where that is the file byte for byte, the
file stays as it stands. Otherwise every file written off that fetch is written under the new date:
the three skill readings move together, because they date together (ADR 0005). This is
`tools/frozen-files.ts`, and every freezer goes through it.

**A frozen row of `status` asks whether a freeze would change the file**, not whether two dates
match. It is current where what the cache gives is what stands. The client row and the two dump rows
keep their own comparisons: the served build, and the week `tools/help-article.ts` states.

**Byte for byte, not field by field.** A change to an encoder re-dates the reading just as a new key
does. That is rare, and it is the safe side to fail on.

**The development channel is previewed, never frozen.** `deno task game:readings preview` lifts the
keys and the bit order from the development client and names what differs from what production
froze. Production decides (ADR 0005), so a preview writes nothing under `frozen/`. The two walks
accept the unminified shape the development channel serves.

Rejected: **committing every refresh under a new date.** It needed no change to any tool, but a
routine refresh would have been a commit per round, and a commit that moves only dates is noise that
hides the one where a key moved.

Rejected: **restoring a refreshed file from a copy when only its date moved.** `status` would then
have compared the older date with the newer fetch and called the reading STALE.

Rejected: **a second date in each file for the latest fetch that confirmed it.** That date moves on
every refresh, which is the diff this decision exists to remove.

## Consequences

- A refresh changes `frozen/` only where the game changed, so it can be run at the start of any
  round. `git diff frozen/` after it is the finding.
- The comment beside each date still reads "when the dump … was fetched". That is true of the first
  fetch, and rewording it would re-date every reading.
- `status` parses the cached bundle and the two pages to answer the frozen rows. The whole report
  took under a second on 2026-09-27.
- The development client was `CzdTQ32j` on 2026-09-27. Its preview named no key and no bit apart
  from production's `Bb28FQty`.
