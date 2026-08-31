/**
 * The one place a version is written down, read back two ways.
 *
 * The reader carries a sample it must flag and a sample it must not, because a reader that has
 * stopped finding its subject passes every walk. The second test is what stands between a
 * development build and the release whose number it would otherwise wear.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import { CONFIGURATION_FILE } from "@/project/repository-layout.ts";
import { getDeclaredVersion, getDevelopmentVersion } from "@/tools/declared-version.ts";
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
