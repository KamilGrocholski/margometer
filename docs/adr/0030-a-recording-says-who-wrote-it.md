# 0030. A recording is spelled in English, and says which builds it stands between

- **Status:** Accepted
- **Date:** 2026-08-30

## Context

The file a reader hands over after a fight (**ADR 0027**) carried an envelope written in Polish and
in abbreviations: `wersja`, `dodatek`, `przy`, `swiat`, `build`, `przegladarka`, `raport`,
`pominietych`, `urwany`, `wpisy`, `nr`, `ladunek`, `komunikaty`, `wojownicyPrzed`, `wojownicyPo`.
Two of those numbers are versions and two are builds, and `build` alone does not say whose.

The envelope was treated as the game's, and it never was. The game's words are inside `payload` —
`w`, `id`, `npc`, `team`, `prof` — and they arrive with the material. Everything around them is this
repository's own writing, so **L2**'s exception was protecting a rule from itself.

The names of the files said less than the files did. A recording was `<date>-<world>-<slug>.json`,
while the two questions asked of one — which build of the game it came off, which build of the
add-on wrote it — could be answered only by opening it. Measured over `captures/` on 2026-08-30,
five of the 28 state an add-on version at all and three state no game build; nothing said either
without being read.

## Decision

**The envelope is spelled in English, and each name says whose number it is**: `formatVersion`,
`addOnVersion`, `capturedAt`, `world`, `gameBuild`, `userAgent`, `report`, `droppedCalls`,
`isTruncated`, `calls`, `index`, `payload`, `messages`, `combatantsBefore`, `combatantsAfter`, plus
`namesSubstituted` and `descriptionsRemoved`, which intake writes. `CAPTURE_FORMAT_VERSION` is 3.

**What is inside `payload` is untouched**, along with every message and every snapshot: the game's
keys are the game's, and the migration below renamed nothing there and no value anywhere.

**`captures/` was migrated in one run**, so the tree holds one vocabulary rather than two. The
recordings' own `formatVersion` stays at the number their writer wrote — a migration does not make
an older recording a version-3 recording — and the older writers' words that nothing reads
(`otwarcie`, `zrodlo`, `otwarcia`, `odchudzonych`) were left exactly as they were.

**`tools/capture-intake.ts` reads both spellings and writes one.** A reader running an older add-on
downloads a Polish envelope today, so that is the format arriving at the door rather than history.
Nothing below intake knows the older spelling.

**A file is named for the two versions it states.** A recording is
`<date>-<world>-<slug>-<gameBuild>-<addOnVersion>.json` and a downloaded file is
`margometer-<world>-<gameBuild>-<addOnVersion>-<capturedAt>.json`, with `none` where the page stated
no build. Both are composed from what the file says, never from what a hand typed, and
`tests/tools/captured-fight-register.test.ts` holds every name to its own contents.

## Consequences

Easy: reading a recording without a glossary, and telling from a filename which build a fight was
fought on and which build of the add-on counted it. The register states the add-on version beside
the build for every recording.

Hard: every citation of a recording moved — 197 of them across the documents and the tests. Two in
`docs/adr/0022-a-tick-belongs-to-the-wound-that-is-ticking.md` were left as they were written,
because an ADR is a dated snapshot, and they are listed in `tests/repository/cited-paths.test.ts` as
paths that no longer exist and why.

Also true: names are longer, and the preview's picker shows them in full. That is the cost of a name
that answers a question.

Obliged: a change to a field name from here on migrates `captures/` in the same commit and leaves
intake able to read what came before it, which is the shape this change is the precedent for.

## Alternatives

**Keep the older spelling in `captures/` and write English only in new files.** Two vocabularies in
one tree for good, every reader of a recording having to know both, and a guard that could not say
which one a file should be in.

**Rename the files but leave the envelope.** The names would then answer a question the fields still
could not, and `build` would go on not saying whose it is.

**Put nothing in the filenames and state both versions in the register only.** The register is in
this repository; a file attached to a report is not, and that is where the question is asked.
