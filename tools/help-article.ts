/**
 * Fetches the game's published help and prints raw context around a phrase.
 *
 * AGENTS.md §3 admits three sources for a claim about the game: the client, a
 * measurement on the captures, and the game's own documentation. The third one
 * had no reader. It is the only source that says what an effect *does* — the
 * bundle only says which keys exist — and it prints the engine name in
 * parentheses beside the human one, which is what makes it joinable to a
 * protocol key at all.
 *
 * Why this and not a summarising fetch: the mechanics article is large enough
 * that a summariser answers with its table of contents, and "not found in the
 * fetched text" then looks exactly like "the game does not document it". That
 * false negative is the failure this file exists to prevent, so it prints raw
 * slices and does not interpret them — the verdict is formed by a person
 * reading the source.
 *
 * Two boundaries:
 *
 *   - what is fetched never leaves `.cache/`, like the client bundle. The help
 *     is the operator's own writing; a register entry carries a locator and our
 *     sentence, never theirs (NOTICE.md).
 *   - documentation can settle what a key *means*. It cannot settle the
 *     `*Health:*` line in `docs/protocol-keys.md`, which is measurement-only.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { composeJsonText, getValueFromJsonText } from "@/libs/json.ts";
import { getRecordFromValue } from "@/libs/record.ts";
import { composeIntegerText, getIntegerFromText, getIntegerFromValue } from "@/libs/number.ts";
import { getMillisecondsFromIsoText } from "@/libs/timestamp.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";

export class HelpArticleError extends MargoMeterToolError {
  constructor(reason: string, options?: ErrorOptions) {
    super("HelpArticle", reason, options);
  }
}

const HELP_HOST = "https://pomoc.margonem.pl";

/** "Mechanika walk" — the only article that carries combat mechanics. */
const MECHANICS_ARTICLE = "372";

const CACHE_ROOT = new URL("../.cache/help/", import.meta.url).pathname;

const MILLISECONDS_PER_DAY = 86_400_000;

/**
 * A week. Past it the tool says so rather than answering quietly, because an
 * entry reading "checked, the help is silent" written off an old dump is a
 * false negative wearing a date — and the date makes it look checked.
 */
const STALE_AFTER_DAYS = 7;

export type CachedHelpArticle = {
  article: string;
  url: string;
  fetchedAt: string;
  /** Absolute path of the cached text. */
  textPath: string;
  textLength: number;
};

/** The id names a directory, so anything but digits stops here rather than at `mkdir`. */
export function requireArticleId(text: string): string {
  if (getIntegerFromText(text) === null) {
    throw new HelpArticleError(`article id "${text}" is not a number`);
  }
  return text;
}

function getArticleUrl(article: string): string {
  return `${HELP_HOST}/index/view,${article}`;
}

/**
 * HTML to text. Script and style bodies go first: strip the tags before their
 * contents and the code stays in the output, where a search hits page machinery
 * and reports it as documentation.
 */
export function getTextFromHtml(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;?/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function getOccurrenceCount(text: string, phrase: string): number {
  return text.toLocaleLowerCase("pl").split(phrase.toLocaleLowerCase("pl")).length - 1;
}

/**
 * Slices around each hit, without repeating one that is already on screen.
 *
 * A repeat is recognised by the slices **overlapping**, not by keying on the
 * first characters of the fragment: where the same content precedes two hits — a
 * table, a repeated heading — the keys collide and hits from different parts of
 * the article vanish as duplicates. Silently, which is the objectionable part.
 */
export function getFragments(
  text: string,
  phrase: string,
  context: number,
  maximum: number,
): string[] {
  if (phrase === "") throw new HelpArticleError("an empty phrase matches everywhere");

  const needle = phrase.toLocaleLowerCase("pl");
  const haystack = text.toLocaleLowerCase("pl");
  const before = Math.round(context / 3);

  const found: string[] = [];
  let from = 0;
  let previousEnd = -1;
  while (found.length < maximum) {
    const hit = haystack.indexOf(needle, from);
    if (hit === -1) break;
    from = hit + needle.length;

    if (hit < previousEnd) continue;
    const end = hit + context;
    found.push(text.slice(Math.max(0, hit - before), end).trim());
    previousEnd = end;
  }
  return found;
}

/** How old the dump is, in words, and loudly once it is worth re-fetching. */
export function composeAgeText(fetchedAt: string, now: number): string {
  const milliseconds = getMillisecondsFromIsoText(fetchedAt);
  if (milliseconds === null) return "read date unreadable — treat this dump as stale";

  // UTC is spelled out: without it a file `ls` shows at 20:30 reads here as
  // 18:30 and looks like the tool got it wrong, which puts the rest in doubt.
  const when = `${fetchedAt.slice(0, 16).replace("T", " ")} UTC`;
  const days = Math.floor((now - milliseconds) / MILLISECONDS_PER_DAY);
  if (days <= 0) return `read ${when}, today`;
  if (days === 1) return `read ${when}, yesterday`;

  const warning = days >= STALE_AFTER_DAYS ? " ⚠ re-fetch before deciding" : "";
  return `read ${when}, ${composeIntegerText(days)} days ago${warning}`;
}

function getCacheDirectory(article: string): string {
  return `${CACHE_ROOT}${article}/`;
}

function getManifestPath(article: string): string {
  return `${getCacheDirectory(article)}provenance.json`;
}

function requireStringField(value: unknown, field: string, article: string): string {
  if (typeof value !== "string" || value === "") {
    throw new HelpArticleError(`cache manifest for ${article}: ${field} is not a non-empty string`);
  }
  return value;
}

/**
 * The manifest dates every claim made from this dump, so a field it does not
 * carry has to stop here. Cast instead, and a truncated file passes as
 * provenance with `fetchedAt` arriving as `undefined` at the age check that
 * exists to catch exactly that.
 */
export function requireCachedHelpArticle(value: unknown, article: string): CachedHelpArticle {
  const record = getRecordFromValue(value);
  if (record === null) {
    throw new HelpArticleError(`cache manifest for ${article} is not an object`);
  }

  const stated = requireStringField(record["article"], "article", article);
  if (stated !== article) {
    throw new HelpArticleError(`cache manifest for ${article} says it holds ${stated}`);
  }

  const textLength = getIntegerFromValue(record["textLength"]);
  if (textLength === null) {
    throw new HelpArticleError(`cache manifest for ${article}: textLength is not a whole number`);
  }

  return {
    article,
    url: requireStringField(record["url"], "url", article),
    fetchedAt: requireStringField(record["fetchedAt"], "fetchedAt", article),
    textPath: requireStringField(record["textPath"], "textPath", article),
    textLength,
  };
}

/** What is cached for this article, or null. Absence is an answer, not a failure. */
function getCachedHelpArticle(article: string): CachedHelpArticle | null {
  const manifest = getManifestPath(article);
  if (!existsSync(manifest)) return null;

  const { value, syntaxError } = getValueFromJsonText(readFileSync(manifest, "utf8"));
  if (syntaxError !== null) {
    throw new HelpArticleError(`cache manifest for ${article} is unreadable`, {
      cause: syntaxError,
    });
  }
  return requireCachedHelpArticle(value, article);
}

async function getServedArticleText(article: string): Promise<string> {
  const url = getArticleUrl(article);
  const response = await fetch(url);
  if (!response.ok) {
    throw new HelpArticleError(`${url} answered ${response.status}`);
  }
  return getTextFromHtml(await response.text());
}

async function writeHelpArticleCache(article: string): Promise<CachedHelpArticle> {
  const text = await getServedArticleText(article);

  const directory = getCacheDirectory(article);
  mkdirSync(directory, { recursive: true });

  const textPath = `${directory}text.txt`;
  writeFileSync(textPath, text);

  const cached: CachedHelpArticle = {
    article,
    url: getArticleUrl(article),
    fetchedAt: new Date().toISOString(),
    textPath,
    textLength: text.length,
  };
  writeFileSync(getManifestPath(article), `${composeJsonText(cached, 2)}\n`);
  return cached;
}

/** Refuses rather than fetching behind the caller's back: a claim is dated by its dump. */
function getCachedArticleText(article: string): { cached: CachedHelpArticle; text: string } {
  const cached = getCachedHelpArticle(article);
  if (cached === null) {
    throw new HelpArticleError(
      `nothing cached for article ${article} — run \`bun tools/help-article.ts fetch ${article}\``,
    );
  }
  return { cached, text: readFileSync(cached.textPath, "utf8") };
}

function writeStatusReport(article: string): void {
  const cached = getCachedHelpArticle(article);
  if (cached === null) {
    console.log(`view,${article}  nothing cached`);
    return;
  }
  console.log(
    `view,${article}  ${composeIntegerText(cached.textLength)} characters  ${composeAgeText(cached.fetchedAt, Date.now())}`,
  );
}

/** Returns how many phrases found nothing, so the caller can make silence visible. */
function writeSearchReport(
  article: string,
  phrases: readonly string[],
  context: number,
  maximum: number,
): number {
  const { cached, text } = getCachedArticleText(article);
  console.log(
    `article view,${article} — ${composeIntegerText(text.length)} characters (${composeAgeText(cached.fetchedAt, Date.now())})\n`,
  );

  let missing = 0;
  for (const phrase of phrases) {
    const fragments = getFragments(text, phrase, context, maximum);
    const total = getOccurrenceCount(text, phrase);

    console.log("=".repeat(72));
    console.log(
      `"${phrase}" — ${composeIntegerText(total)} occurrences, showing ${composeIntegerText(fragments.length)}`,
    );
    console.log("=".repeat(72));

    if (fragments.length === 0) {
      // Worded so it can go into the register unchanged. "Not found" is not the
      // same claim as "not documented", and the difference is the whole point.
      console.log(`NOT FOUND in article view,${article}. Try the engine name — the help`);
      console.log(`prints it in parentheses beside the human one, as in "Unik ( evade )".`);
      missing += 1;
      continue;
    }
    for (const fragment of fragments) console.log(`\n… ${fragment} …`);
    console.log();
  }
  return missing;
}

const FROZEN_PATH = new URL("../tests/frozen-help-phrases.ts", import.meta.url).pathname;

/**
 * How often each phrase occurs, in the order asked, deduplicated and sorted so
 * that re-freezing shows real change and not argument order.
 */
export function getPhraseCounts(text: string, phrases: readonly string[]): [string, number][] {
  const distinct = [...new Set(phrases)].sort();
  return distinct.map((phrase) => [phrase, getOccurrenceCount(text, phrase)]);
}

/**
 * Counts, and deliberately nothing else.
 *
 * The help is the operator's own writing and none of its sentences enter this
 * repository (NOTICE.md). A count is our measurement of the article rather than
 * any of it, which is the same footing the frozen key list stands on: functional
 * names and figures we produced, never prose we did not.
 *
 * `fetchedAt` is the dump's date, not the day a person read it. The two differ
 * legitimately — a register entry is dated when someone formed a verdict — so
 * nothing holds them equal; what the field is for is saying which dump these
 * counts were taken from, so a stale table and a stale cache cannot agree
 * quietly about an article nobody has looked at in a month.
 */
function composeFrozenModule(
  article: string,
  fetchedAt: string,
  counts: readonly [string, number][],
): string {
  return `// Generated by \`bun tools/help-article.ts freeze <phrase> …\`. Do not edit by hand.
//
// How often each phrase the register cites occurs in the game's published help.
// Counts only — the help's own sentences stay out of this repository (NOTICE.md),
// and a count is our measurement of the article rather than a piece of it.
//
// What it is for: a claim in \`docs/protocol-keys.md\` that the help does **or does
// not** document a key is re-earned against this table on every gate. A negative
// recorded from a search nobody re-runs is how four keys came to be filed as
// undocumented while the help described all four — see the notice in that file.

export const FROZEN_HELP_PHRASES = {
  article: ${composeJsonText(article)},
  /** When the dump these counts were taken from was fetched, not when it was read. */
  fetchedAt: ${composeJsonText(fetchedAt)},
  counts: {
${counts.map(([phrase, count]) => `    ${composeJsonText(phrase)}: ${composeIntegerText(count)},`).join("\n")}
  },
} as const;
`;
}

/** Takes the flag and its value out of the arguments, leaving the phrases behind. */
function removeFlagValue(argv: string[], flag: string, fallback: number): number {
  const at = argv.indexOf(flag);
  if (at === -1) return fallback;

  const text = argv[at + 1];
  const value = text === undefined ? null : getIntegerFromText(text);
  if (value === null || value <= 0) {
    throw new HelpArticleError(`${flag} takes a positive whole number`);
  }
  argv.splice(at, 2);
  return value;
}

function removeFlagText(argv: string[], flag: string, fallback: string): string {
  const at = argv.indexOf(flag);
  if (at === -1) return fallback;

  const value = argv[at + 1];
  if (value === undefined) throw new HelpArticleError(`${flag} takes a value`);
  argv.splice(at, 2);
  return value;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const article = requireArticleId(removeFlagText(argv, "--article", MECHANICS_ARTICLE));
  const context = removeFlagValue(argv, "--context", 420);
  // Six rather than three: a phrase that is part of a longer word matches it too,
  // and with a low limit the real hit falls off the end and reads as its absence.
  const count = removeFlagValue(argv, "--count", 6);

  const [command, ...phrases] = argv;
  if (command === "status") {
    writeStatusReport(article);
  } else if (command === "fetch") {
    const cached = await writeHelpArticleCache(article);
    console.log(
      `cached view,${cached.article} — ${composeIntegerText(cached.textLength)} characters → ${cached.textPath}`,
    );
  } else if (command === "search") {
    if (phrases.length === 0) throw new HelpArticleError("search takes at least one phrase");
    // Non-zero exit is the point: silence has to be visible to a script and not
    // only to whoever is reading the terminal, because §3 wants evidence for a
    // negative claim as much as for a positive one.
    if (writeSearchReport(article, phrases, context, count) > 0) process.exit(1);
  } else if (command === "freeze") {
    if (phrases.length === 0) throw new HelpArticleError("freeze takes at least one phrase");
    const { cached, text } = getCachedArticleText(article);
    const counts = getPhraseCounts(text, phrases);
    writeFileSync(FROZEN_PATH, composeFrozenModule(article, cached.fetchedAt, counts));
    console.log(
      `froze ${composeIntegerText(counts.length)} phrases from view,${article} (${composeAgeText(cached.fetchedAt, Date.now())}) → ${FROZEN_PATH}`,
    );
    // A zero here is a real answer, not a failure — but it is the answer that
    // gets written into a register as "not documented", so it is said out loud.
    const silent = counts.filter(([, found]) => found === 0).map(([phrase]) => phrase);
    if (silent.length > 0) console.log(`found nothing for: ${silent.join(", ")}`);
  } else {
    console.log(
      "usage: bun tools/help-article.ts [--article N] [--context N] [--count N] status | fetch | search <phrase> … | freeze <phrase> …",
    );
  }
}
