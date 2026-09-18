# 0099. The published preview opens with the install, and Greasy Fork is a second way in

- **Status:** Accepted
- **Date:** 2026-09-18

## Context

There is one way in, and it is a page on a code-hosting site with two files on it, one of which must
not be clicked. `TODO.md` names that as discouraging to somebody who does not read code, and the
release path agrees with them: `tools/changelog.ts` appends a paragraph to every release note
explaining which of the two files is not for clicking.

The prerequisite that actually stops people is worse than the file picking. Chrome and Edge refuse
to run any userscript until a switch on the extension's own page is thrown, and until it is, the
install succeeds, the game loads, and nothing appears. `docs/browser-support.md` states it: "Without
it no userscript runs at all, and the failure is silent." That sentence lives in a README, which
nobody arriving at the published preview has read.

A front door already exists. **ADR 0017** publishes the panel over a recording at one address, drawn
by the release's own build (**ADR 0037**), and both READMEs already point a stranger at it. What it
opened with was one paragraph in which installation was the second of two links.

Greasy Fork is the other half. Measured against their published code rules on 2026-09-18, the built
file qualifies with no change to the build: it is not minified (10,009 lines, identifiers intact,
longest line 2,648 characters), it is 365,337 bytes against their 2 MB ceiling, it needs no
`@require` and no `@resource`, and every inlined `@std` module already carries the bundler's own
`// deno:https://jsr.io/@std/assert/1.0.19/…` line, which is the library attribution they ask for.

What it does not buy is discovery, and that is worth writing down rather than discovering later.
Their `by-site` listing for `margonem.pl` held three scripts on 2026-09-18, with 17, 5 and 1
installs. It is a second one-click way in and a page where somebody suspicious of an add-on can read
the code without a clone. It is not where players of this game look.

## Decision

**One page keeps carrying everything.** The published preview opens with a band — the name, one
sentence of what the add-on is, a button, the version behind it, and the whole of what has to be
done, numbered, with the step whose failure is silent marked where it stands. The replay stays
directly beneath as the proof. Nothing is folded behind a disclosure: a reader who does not open one
gets a panel that never appears and no reason for it, which is the failure the band exists to
pre-empt.

**The page puts both windows in the corner, and that is what makes room for the band.** A panel
opens **centred** in the window it is drawn over — `src/ui/panel-drag.ts`, `composeDefaultPosition`
— leaving 131px above it on a 1024×768 window and 119px on 1366×700, measured in Chrome on
2026-09-18. A band stacked into that strip came out 216px tall and drew half its own sentences
behind the panel and the window beside it, at every size tried. So the page moves them, to the
corner they already stand in on every picture in the READMEs, and the band takes the left: 38px
clear of the windows at 1024 and 180px at 1280.

They are moved **by their own bars**, which is `tools/panel-screenshots.ts`'s way and now a module
under both — `tools/preview-windows.ts`, at the second consumer. Never by a style written onto the
host: a card opens on whichever side of the panel has room and reads the position the panel keeps,
which a `left` set behind its back does not move. That is what once photographed a card over the
panel.

**The button offers `releases/latest/download/margometer.user.js`**, built from the same constant
`@downloadURL` is, so the address a reader saves and the address their installed copy polls cannot
drift apart.

**The add-on is additionally listed on Greasy Fork, posted by hand at each release**, from the asset
that release attached. `docs/releasing.md` §5 carries the step.

## Consequences

A per-release obligation no machine holds, in a release path whose residue was already the part held
by a person (`ARCHITECTURE.md`, known gaps).

A second population of installed copies this repository does not control. Greasy Fork replaces
`@downloadURL` and `@updateURL` with its own when it serves a script, so those copies poll Greasy
Fork and never this repository — a release not posted there leaves them where they are, and says
nothing to the person running one. That is the same shape as a release published without
`margometer.meta.js`, and it joins the protected contracts for the same reason.

The install is now stated in three places — both READMEs and the band — so step 1 of a release reads
all three rather than two.

The page gains no request of any kind: no font, no picture, no counter. That is held by a guard over
the composed pages rather than by this sentence, because the build's outbound-call check stands over
the bundle and never reached the page around it.

`index.html` stays a byte-for-byte copy of one recording's own page, which is what stops the band
saying anything about the fight underneath it.

The published page now runs a gesture of its own, on load and on resize. It is the one thing here no
guard finishes: a test reads that the page carries the move and that the band is capped where the
windows begin, but it cannot open a window and see the two agree. A move that stopped moving
anything would leave the panel over the band with nothing looking wrong — the failure a set of
pictures had on 2026-09-09. `docs/releasing.md` step 1 reads the band with the READMEs, and that is
where it is caught.

The capture is given back straight after the move, unlike on a photographed page, which is closed
the moment its picture is taken. A visitor drags the panel with a real hand, and a hand captures
fine.

## Alternatives

**A band short enough to stand above a centred panel.** It fits — measured at 64px on 1920×1080 and
89px on 1024×768 — but only by holding one sentence about what a reader needs and one about the
switch, with the numbered steps left to a link. The whole of the point is that somebody who will not
read a README can install this, so the steps belong on the page.

**Lend the panel a position through the store the page hands it.** No gesture, so nothing to fail
quietly. It needs the harness to spell a key the add-on owns, which `tools/preview-state.ts` exists
not to do, and a position that depends on the window the visitor has, which a store written at
compose time cannot state.

**A separate landing page, with the replay one navigation away.** Two documents saying what the
add-on is drift, and the proof stops being the thing a visitor lands on. **ADR 0017**'s one page,
three consumers holds and nothing measured has changed under it.

**Serve the install from the copy already beside the page.** `dist/preview/margometer.user.js` is
really there and installing from it would work. But the published site redeploys on every push to
`main`, so that copy is whatever `main` last held, while the release asset is only ever a tagged
build — and the address a reader saves would then differ from the one their copy polls, for nothing.

**A custom domain.** A shorter address, against a renewal nobody will remember and a DNS record that
outlives the interest in it.

**OpenUserJS as a third host.** Every host is another hand step with the same silent stranding
behind it. Two is what one person carries honestly; a third needs a measurement first.

**Automatic Greasy Fork sync.** Their published help documents external-URL sync for **library**
scripts. Webhook sync for an ordinary script is not in that help, and the reports of it are mixed.
There is also nothing here to sync from: this repository commits no built file, so the only address
would be a redirect to a release asset. Revisit after observing a sync fire at two consecutive tags.

**An install count, or a badge, on the page.** `PRODUCT.md` forbids telemetry and a badge is a
request per visit. Greasy Fork's own count is theirs, and no claim here is backed by it.
