# Notice

What in this repository is somebody else's, and on what basis it is here.

MargoMeter itself is MIT licensed (`LICENSE`). That covers what was written here, and nothing else.

## Margonem

MargoMeter is an unofficial add-on for [Margonem](https://www.margonem.pl/), a game operated by
Garmory. It is not affiliated with, endorsed by, or approved by the operator.

**What is here.** Raw battle protocol captured from real fights, in `captures/`, and the functional
names the protocol uses — keys, field names, identifiers — wherever the code and the documents must
spell them. Functional names are how a machine addresses a thing; they are not the operator's
authored text.

**What is deliberately not here.** The game's own displayed sentences, its client source, its
assets, and the text of its published help. Ability descriptions are stripped from recordings before
they are admitted. Where this repository states what an effect does, it does so in its own words,
with a locator and a read date, and never by quotation.

**Player nicknames never enter this repository.** They are substituted by tooling before a recording
is admitted, never by hand, and a recording that cannot be redacted is refused.

Client sources fetched for reading live only in `.cache/`, outside git.

## Deno standard library

The userscript built from this repository bundles modules from the Deno standard library, which is
MIT licensed. Copyright the Deno authors. The bundle is a combined work of this project's code and
those modules; the licences of both apply to their own parts.

This is a change from MargoMeter v1, which shipped no third-party code. The reasoning is recorded in
`docs/adr/0001-deno-instead-of-bun.md`.

## Everything else

The design, the rules, the documents, the tooling and the panel are this project's own work, under
`LICENSE`.
