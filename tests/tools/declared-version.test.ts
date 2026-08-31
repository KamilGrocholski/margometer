/**
 * The one place a version is written down, read back two ways.
 *
 * The reader carries a sample it must flag and a sample it must not, because a reader that has
 * stopped finding its subject passes every walk. The second test is what stands between a
 * development build and the release whose number it would otherwise wear.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import { CONFIGURATION_FILE } from "@/project/repository-layout.ts";
import {
    getDeclaredVersion,
    getDevelopmentVersion,
    getReleaseVersion,
    getVersionForRun,
    isVersionOfTree,
    RELEASE_FLAG,
} from "@/tools/declared-version.ts";
import { DeclaredVersionError } from "@/tools/margometer-tool-error.ts";

Deno.test("the version this tree declares is read out of its configuration", () => {
    const sample = '{\n    "version": "1.2.3",\n    "tasks": {}\n}\n';
    assertEquals(getDeclaredVersion(sample), "1.2.3", "the reader finds its own sample");
    const commented =
        '{\n    // "version": "9.9.9" was the shape before\n    "version": "1.2.3"\n}';
    assertEquals(getDeclaredVersion(commented), "1.2.3", "a comment is not a declaration");
    assertThrows(
        () => getDeclaredVersion('{\n    "tasks": {}\n}\n'),
        DeclaredVersionError,
    );
    const declared = getDeclaredVersion(Deno.readTextFileSync(CONFIGURATION_FILE));
    assert(declared.length > 0, "and the tree itself declares one");
});

Deno.test("a build nobody tagged says the declaration and is not mistaken for it", () => {
    const declared = getDeclaredVersion(Deno.readTextFileSync(CONFIGURATION_FILE));
    const development = getDevelopmentVersion();
    assertEquals(development, `${declared}-dev`, "the number comes from the one declaration");
    assert(development !== declared, "and never reads as the release of that number");
    assert(development.length > declared.length, "the mark is added rather than substituted");
});

/**
 * The flag, both ways. A run told nothing is the case every task here is, so only the second half
 * proves the flag does anything — and a release that quietly built at the marked version would
 * put `-dev` on the front page of a release with nothing looking wrong.
 */
Deno.test("a run that says it is the release states the declaration, and no other run does", () => {
    const declared = getDeclaredVersion(Deno.readTextFileSync(CONFIGURATION_FILE));
    assertEquals(getReleaseVersion(), declared, "a release is the number the tree declares");
    assertEquals(getVersionForRun([RELEASE_FLAG]), declared, "and the flag is what asks for it");
    assertEquals(getVersionForRun([]), `${declared}-dev`, "a run told nothing marks itself");
    assertEquals(
        getVersionForRun(["--browser", "google-chrome"]),
        `${declared}-dev`,
        "and a flag that is not this one asks for nothing",
    );
});

/**
 * ⚠️ **The negative samples are the half that matters.** A reader returning `true` for everything
 * passes the two above and lets a set from the previous release sit where a README points at it.
 */
Deno.test("a version belongs to the tree when it is the declaration, marked or not", () => {
    assert(isVersionOfTree("0.12.0", "0.12.0"), "the release of the number the tree declares");
    assert(isVersionOfTree("0.12.0-dev", "0.12.0"), "and a build off that tree, marked as one");
    assert(!isVersionOfTree("0.11.0", "0.12.0"), "the release before it is another version");
    assert(!isVersionOfTree("0.11.0-dev", "0.12.0"), "and so is a build off the tree before it");
    assert(!isVersionOfTree("0.12.0-dev-dev", "0.12.0"), "the mark is added once or not at all");
});
