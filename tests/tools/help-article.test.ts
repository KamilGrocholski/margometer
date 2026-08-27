import { spawnSync } from "node:child_process";
import { describe, expect, test } from "bun:test";
import { getMillisecondsFromIsoText } from "@/libs/timestamp.ts";
import {
  CACHE_ROOT,
  composeAgeText,
  getFragments,
  getOccurrenceCount,
  getPhraseCounts,
  getTextFromHtml,
  HelpArticleError,
  requireArticleId,
  MECHANICS_ARTICLE,
  requireCachedHelpArticle,
} from "@/tools/help-article.ts";
import { FROZEN_HELP_PHRASES } from "@/tests/frozen-help-phrases.ts";

const MILLISECONDS_PER_DAY = 86_400_000;
const READ_AT = "2026-08-09T12:00:00.000Z";
const READ_AT_MILLISECONDS = getMillisecondsFromIsoText(READ_AT)!;

describe("turning the page into text", () => {
  // Strip the tags before the script bodies and the page's own code stays in the
  // result, where a search hits it and reports machinery as documentation.
  test("drops what sits inside a script", () => {
    const html = "<p>Blok</p><script>var evade = 1;</script><p>Unik</p>";
    const text = getTextFromHtml(html);

    expect(text).toBe("Blok Unik");
    expect(text).not.toContain("evade");
  });

  test("drops style bodies and unescapes what the page escaped", () => {
    expect(getTextFromHtml("<style>a{b:c}</style><p>1 &lt; 2 &amp; 3</p>")).toBe("1 < 2 & 3");
  });
});

describe("slicing context around a phrase", () => {
  test("shows one fragment when two hits fall inside the same window", () => {
    const text = `${"a".repeat(50)}NEEDLE${"b".repeat(10)}NEEDLE${"c".repeat(50)}`;

    expect(getFragments(text, "needle", 90, 6)).toHaveLength(1);
    expect(getOccurrenceCount(text, "needle")).toBe(2);
  });

  // The regression the previous incarnation of this tool recorded: keying a
  // repeat on the fragment's first characters collapses two hits that are
  // preceded by the same content — a table, a repeated heading — and the hit
  // from elsewhere in the article disappears without saying so.
  test("keeps two distant hits whose surroundings read identically", () => {
    const block = `${"x".repeat(40)}NEEDLE${"y".repeat(40)}`;
    const text = `${block}${"z".repeat(500)}${block}`;

    const fragments = getFragments(text, "needle", 90, 6);
    expect(fragments).toHaveLength(2);
    expect(fragments[0]?.slice(0, 60)).toBe(fragments[1]?.slice(0, 60) ?? "");
  });

  test("stops at the maximum asked for", () => {
    const text = Array.from({ length: 5 }, () => `NEEDLE${"q".repeat(400)}`).join("");

    expect(getFragments(text, "needle", 90, 2)).toHaveLength(2);
  });

  test("finds a phrase regardless of case, and reports none when there is none", () => {
    expect(getFragments("Unik ( evade )", "unik ( EVADE )", 90, 6)).toHaveLength(1);
    expect(getFragments("Unik ( evade )", "blok", 90, 6)).toEqual([]);
  });

  test("refuses an empty phrase rather than matching everywhere", () => {
    expect(() => getFragments("anything", "", 90, 6)).toThrow(HelpArticleError);
  });
});

describe("how old the dump is", () => {
  test("says today, and in UTC, so the file's own clock cannot be blamed", () => {
    const text = composeAgeText(READ_AT, READ_AT_MILLISECONDS + 3 * 3_600_000);

    expect(text).toContain("2026-08-09 12:00 UTC");
    expect(text).toEndWith("today");
  });

  test("says yesterday", () => {
    expect(composeAgeText(READ_AT, READ_AT_MILLISECONDS + MILLISECONDS_PER_DAY)).toEndWith(
      "yesterday",
    );
  });

  // The threshold is the whole value of this function: an entry reading "checked,
  // the help is silent" written off a dump this old is a false negative wearing
  // a date, and the date is what makes it look checked.
  test("stays quiet below a week and asks for a re-fetch at one", () => {
    const sixDays = composeAgeText(READ_AT, READ_AT_MILLISECONDS + 6 * MILLISECONDS_PER_DAY);
    const sevenDays = composeAgeText(READ_AT, READ_AT_MILLISECONDS + 7 * MILLISECONDS_PER_DAY);

    expect(sixDays).toContain("6 days ago");
    expect(sixDays).not.toContain("⚠");
    expect(sevenDays).toContain("7 days ago");
    expect(sevenDays).toContain("⚠");
  });

  test("calls an unreadable date stale rather than fresh", () => {
    expect(composeAgeText("9 August 2026", READ_AT_MILLISECONDS)).toContain("stale");
  });
});

describe("the cache manifest", () => {
  const manifest = {
    article: "372",
    url: "https://pomoc.margonem.pl/index/view,372",
    fetchedAt: READ_AT,
    textPath: "/tmp/text.txt",
    textLength: 12,
  };

  test("reads back what was written", () => {
    expect(requireCachedHelpArticle(manifest, "372")).toEqual(manifest);
  });

  // Cast instead of checking and a truncated manifest passes as provenance, with
  // the missing field arriving as `undefined` at the age check meant to catch it.
  test("refuses a manifest missing a field", () => {
    const { fetchedAt: _removed, ...withoutDate } = manifest;

    expect(() => requireCachedHelpArticle(withoutDate, "372")).toThrow("fetchedAt");
  });

  test("refuses a manifest describing a different article", () => {
    expect(() => requireCachedHelpArticle(manifest, "240")).toThrow(HelpArticleError);
  });

  test("refuses a length that is not a whole number", () => {
    expect(() => requireCachedHelpArticle({ ...manifest, textLength: "12" }, "372")).toThrow(
      "textLength",
    );
  });

  test("refuses anything that is not an object", () => {
    expect(() => requireCachedHelpArticle([manifest], "372")).toThrow(HelpArticleError);
    expect(() => requireCachedHelpArticle(null, "372")).toThrow(HelpArticleError);
  });
});

describe("the article id", () => {
  // It names a directory under `.cache/`, so it stops here rather than at mkdir.
  test("refuses anything that is not digits", () => {
    expect(() => requireArticleId("../game-client")).toThrow(HelpArticleError);
    expect(() => requireArticleId("372x")).toThrow(HelpArticleError);
    expect(requireArticleId("372")).toBe("372");
  });
});

/**
 * The numbers `tests/frozen-help-phrases.ts` is made of.
 *
 * ⚠️ **Nothing named this function.** Every register claim about what the
 * published help does or does not document is re-earned on each run against a
 * table this produces — so the guard was held to its input and the input was
 * held to nobody (`docs/audits/2026-08-14-the-whole-tree-read-again.md`, F24).
 */
describe("the counts a freeze is made of", () => {
  const TEXT = "unik and unik and evade";

  test("counts each phrase in the text it was given", () => {
    expect(getPhraseCounts(TEXT, ["unik", "evade"])).toEqual([
      ["evade", 1],
      ["unik", 2],
    ]);
  });

  // Zero is the answer the register leans on hardest: a claim that the help is
  // silent about a key is exactly a count of none, so it has to be reported and
  // not dropped.
  test("a phrase that is not there counts none rather than going missing", () => {
    expect(getPhraseCounts(TEXT, ["legbon_facade"])).toEqual([["legbon_facade", 0]]);
  });

  test("asking twice does not count twice, and the order is the phrase's", () => {
    expect(getPhraseCounts(TEXT, ["unik", "evade", "unik"])).toEqual([
      ["evade", 1],
      ["unik", 2],
    ]);
  });

  test("asking nothing answers nothing", () => {
    expect(getPhraseCounts(TEXT, [])).toEqual([]);
  });
});

/**
 * The frozen counts and the article they were taken from.
 *
 * `docs/protocol-keys.md` re-earns every claim about what the help documents
 * against `tests/frozen-help-phrases.ts`, so the counts are only evidence while
 * they describe the article the tool still reads. The table records which one it
 * came from and nothing compared the two: changing `MECHANICS_ARTICLE` left the
 * whole gate green with every count describing a different document.
 */
describe("the frozen counts and the article they came from", () => {
  test("were taken from the article the tool reads", () => {
    expect(FROZEN_HELP_PHRASES.article).toBe(MECHANICS_ARTICLE);
  });
});

/**
 * The cache this tool writes into, and git's own opinion of it.
 *
 * §7.6 keeps fetched sources out of the repository by copyright requirement, and
 * until this the whole promise was one path here agreeing with one line in
 * `.gitignore`. Nothing compared them, so a root moved out from under the ignore
 * rule would leave somebody else's material sitting in `git status`
 * (`docs/specs/2026-08-18-a-name-we-did-not-choose.md`).
 *
 * Asked of `git check-ignore` rather than by reading `.gitignore`: git is what
 * decides, and a pattern read by hand is a second implementation of matching
 * rules this repository has no reason to own. `-q` so the status carries the
 * answer and nothing is parsed (§7.5).
 */
function isIgnoredByGit(path: string): boolean {
  const done = spawnSync("git", ["check-ignore", "-q", path], {
    cwd: new URL("../../", import.meta.url).pathname,
  });
  return done.status === 0;
}

describe("what the tool writes outside git", () => {
  test("caches under a path git is told to ignore", () => {
    expect(CACHE_ROOT).toContain("/.cache/");
    expect(isIgnoredByGit(CACHE_ROOT), CACHE_ROOT).toBe(true);
  });
});
