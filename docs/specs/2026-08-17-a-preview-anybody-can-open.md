# A preview anybody can open

Status: implemented

## What was wrong

There were two ways to see the panel and both cost more than a stranger will
spend: install a userscript into a game whose terms of service README.md spends a
section being candid about, or clone the repository and run `bun run preview`.

That is a bad trade for the person deciding whether to install. The one question
they have — *what does this actually look like, and can I trust what it says* — is
answerable from a screenshot in a way it is not from a description, and this
repository already had everything needed to answer it. `composePreviewPage()` is
pure. It returns the whole harness page as one string, with a capture's payloads
inlined and the replay synchronous, because
`docs/specs/2026-08-17-a-panel-you-can-watch-change.md` needed a screenshot taken
at `load` to catch a drawn panel. **A page that needs no server at load time is a
page a static host can serve**, and nobody had noticed.

## What was decided

**The same page, written to files, published to GitHub Pages on every push to
`main`.**

`tools/preview-site.ts` writes one page per capture plus a landing page,
`.github/workflows/pages.yml` runs the gate and deploys, and the address is in
README.md.

### The page left the server, and what it kept is holes

`composePreviewPage` moved to `tools/preview-page.ts` at its second consumer
(§7.1) — `build.ts`'s own move, one level up. What is parameterised is exactly
what the two consumers must **not** agree on, and every one of them is a failure
that loads cleanly and is wrong:

| Hole | Served | Published | What it costs to get wrong |
|---|---|---|---|
| `scriptDirectory` | `/` | `./` | A host serving the site under a path of its own asks the domain root for a file belonging to no project. The panel never appears — and the same page is perfect from disk and from localhost. |
| `fights[].address` | a query | a filename | One broken control on every page at once, since each page's picker offers all of them. |
| `reloadScript` | the stream | nothing | A published page has no `/reload`, and `EventSource` reconnects on its own — twice a second, for as long as the tab is open. |
| `words` | English | Polish | §3, below. |
| `introduction` | nothing | a sentence | Whoever started the server knows what they started. |

The build label and the log went with the reload half rather than staying in the
page: a page with nothing rebuilding it saying `build ok` in green is asserting
something about a build nobody ran.

### The words are two vocabularies, not one

§3 puts the text a player reads in Polish, and a published page is read by
players; a development server is read by whoever is editing `src/`. So the site's
words are Polish, the server's are English, and **the module they share holds
neither** — which is what keeps it off the list in
`tests/tools/source-layout.test.ts` naming the files allowed to speak Polish,
while `tools/preview-site.ts` joins that list as its tenth entry. Holding the
words as data rather than as a branch is what makes that structural instead of a
convention: the guard reads a template literal as one span, so a Polish word in
the shared markup would be caught rather than tolerated.

### A published page opens on the finished fight

The server opens on nothing, because whoever started it is usually chasing the
early states — the empty panel, the roster before anyone has acted. A visitor
asking what the add-on looks like is answered by populated rows and the totals a
fight came to.

Both states stayed reachable by adding a **to-start** button to the shared strip.
The empty panel had been reachable only by editing the address bar, which a
published page does not offer, since its entry is not in the address at all — and
it cannot be, because reading it back means turning text into a number and
`libs/` owns that (§9.5).

### Nothing generated is committed, and NOTICE.md says what is published

The pages carry §9.2's material inlined. A tracked page carrying a capture would
fail the gate on its own — `tests/tools/source-layout.test.ts` refuses a name the
game gave an ability outside the recordings — so the output goes under `dist/`,
which git ignores, and CI publishes an artifact rather than a branch.

What the page carries was checked rather than assumed: the `render` field, which
is the only place a recording holds sentences the game composed, sits **beside**
the engine payload in a dump and not inside it, so none of it travels. NOTICE.md
now names the page, what does travel, and on what basis.

## Rejected alternatives

- **A `--write <directory>` flag on `tools/preview-server.ts`** instead of a
  second tool. One file fewer, and it puts the published page's Polish, its
  landing rule and its file layout inside a module whose subject is a socket —
  and it would put that module on the Polish list, where the point of the list is
  that it is short and deliberate.
- **Fetching each capture as JSON** rather than inlining it. It would make the
  landing page tiny. It also breaks the property the whole page rests on — the
  replay finishing before `load` — for a saving that is not there: the payloads
  of every capture come to 1 965 KB across the 17 captures of 2026-08-17, and the
  largest single page is 214 KB of them.
- **Publishing from `docs/`,** the conventional Pages root. §8 admits a register,
  a dated spec, a design a spec names and a dated audit there and nothing else,
  and the output must not be tracked at all.
- **Pushing to a `gh-pages` branch.** It puts generated pages carrying the
  captures into git, which is the one thing ruled out above, and adds branch
  bookkeeping nothing else here has.
- **Deploying on a `v*` tag instead of on `main`.** The page would show the last
  released version, matching what a visitor can install. It would also be stale
  for most of the life of the repository, and the thing worth looking at is
  usually the thing just built.
- **Running the preview server in CI and saving what it answers.** A process, a
  port and a readiness wait, to produce files a pure function already produces.
- **Leaving the decoy build script to 404,** as the server does. Only its name is
  ever read, so the file's contents do not matter — but a static host answers a
  miss with its own HTML, and the tag then puts a syntax error in every visitor's
  console on a page whose whole purpose is to look like nothing is wrong. It is
  one line of a file to remove that.
- **Landing on the first capture,** which is what the server defaults to. The
  first is the oldest, and it is a short solo hunt that fills two rows. The
  landing page is the newest instead — still a rule over the discovered directory
  rather than a filename somebody typed (§9.2).
- **Enabling Pages from the workflow** with `configure-pages`'s `enablement`,
  which is documented to create the site and is what the first failure's own error
  message recommends. It does not work here, and the way that was established is
  the point: the run then warns rather than errors on the missing site and fails
  on the create call instead — `No server is currently available to service your
  request` — on a public repository with `pages: write`, which is every condition
  the reference names. Resubmitting, which that message asks for, changes nothing.

  ⚠️ **Written down because it was got wrong in the other direction first.** The
  workflow shipped with a note saying the switch had to be thrown by hand and that
  no file could do it; the second half read like an untested excuse, so it was
  replaced by `enablement: true` on the strength of the documentation, and the
  documentation was not the thing that had to be true. Both halves are now dated
  to what a run printed. §7.5's order applies to somebody else's API too: what a
  machine can hold, it should — and what it demonstrably cannot is a sentence,
  carrying the evidence.
- **`<meta name="robots" content="noindex">`.** Whether an unauthorised add-on's
  demo should be a search result is a real question, and the answer taken is that
  the repository is already public and README.md already links the page. One line
  to reverse.
