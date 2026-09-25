/**
 * A11: the layer a reader touches asserts nothing. `src/ui/`, `src/userscript-entry.ts` and
 * `src/userscript-boot.ts` import no assertion: a broken invariant there is checked, degraded in
 * place and recorded as a defect (E12).
 */

import { assertEquals } from "@std/assert";
import {
    composeSample,
    readImportSources,
    readSourceFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";

const ASSERT_PACKAGE = "@std/assert";
const READER_FILES = ["src/userscript-entry.ts", "src/userscript-boot.ts"];
const READER_DIRECTORY = "src/ui/";

Deno.test("an assertion the reader's layer imports is flagged, and one elsewhere is not", () => {
    const sample = composeSample(['import { assert } from "@std/assert/assert";']);
    const ui = { ...sample, path: "src/ui/panel-sample.ts" };
    assertEquals(lookupReaderAsserts(ui), [
        'src/ui/panel-sample.ts imports "@std/assert/assert"',
    ], "the panel asserts nothing");
    const entry = { ...sample, path: "src/userscript-entry.ts" };
    assertEquals(lookupReaderAsserts(entry).length, 1, "and neither does the entry");
    const core = { ...sample, path: "src/core/sample.ts" };
    assertEquals(lookupReaderAsserts(core), [], "while core asserts as it should");
});

function lookupReaderAsserts(file: SourceFile): string[] {
    if (!isReaderLayer(file.path)) return [];
    const sources = readImportSources(file).filter((one) => one.startsWith(ASSERT_PACKAGE));
    return sources.map((source) => `${file.path} imports "${source}"`);
}

function isReaderLayer(path: string): boolean {
    if (path.startsWith(READER_DIRECTORY)) return true;
    return READER_FILES.includes(path);
}

Deno.test("nothing a reader touches imports an assertion", () => {
    assertEquals(readSourceFiles(["src"]).flatMap(lookupReaderAsserts), [], "A11");
});
