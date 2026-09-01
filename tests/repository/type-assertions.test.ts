/**
 * C13, and the two crossings that have no narrowing to offer.
 *
 * Read both ways, because a register is two claims: nothing outside it asserts a type, and every
 * file in it still does. A reader proved only on what it must flag calls a tree clean once the
 * thing it looks for has moved.
 */

import { assert, assertEquals } from "@std/assert";
import { getCodeOutsideStrings, isCommentLine } from "@/tests/source-line.ts";
import { getSourcePaths } from "@/tests/source-paths.ts";

const SHIPPED_ROOTS = ["libs/", "project/", "src/", "tools/"];

/**
 * The whole register, and the reason for each, held here so no two files carry one copy of it.
 * `userscript-boot.ts` takes a browser's `Window`, which states far more than the entry asks of
 * it. `engine-battle-wrap.ts` and `game-dictionary.ts` name a signature `typeof` cannot give:
 * it narrows to `Function`, which answers `any` to a call, and a call nobody typed is worse than
 * the assertion that types it.
 */
const ASSERTIONS_WITH_A_REASON = [
    "src/game/engine-battle-wrap.ts",
    "src/game/game-dictionary.ts",
    "src/userscript-boot.ts",
];

/** The identifier standing at the front of `text`, so `constant` is not read as `const`. */
function getFirstWord(text: string): string {
    let at = 0;
    while (at < text.length) {
        const character = text.charAt(at);
        const isLetter = (character >= "a" && character <= "z") ||
            (character >= "A" && character <= "Z");
        if (!isLetter) return text.slice(0, at);
        at += 1;
    }
    return text;
}

/**
 * C13: a line overriding the compiler. `as const` and `satisfies` check a literal against a type
 * rather than overriding one, and an `import` renaming a name is not asserting anything about it.
 */
function getTypeAssertionLines(text: string): number[] {
    const found: number[] = [];
    for (const [offset, line] of text.split("\n").entries()) {
        if (isCommentLine(line)) continue;
        const code = getCodeOutsideStrings(line).trimStart();
        if (code.startsWith("import ")) continue;
        if (code.startsWith("export {")) continue;
        let at = code.indexOf(" as ");
        let steps = 0;
        while (at !== -1) {
            steps += 1;
            assert(steps <= code.length, "the scan stays inside the line's bound");
            if (getFirstWord(code.slice(at + " as ".length)) !== "const") {
                found.push(offset + 1);
                break;
            }
            at = code.indexOf(" as ", at + " as ".length);
        }
    }
    assert(found.every((one) => one > 0), "a line number is one-based");
    assert(found.length <= text.length, "no more findings than characters");
    return found;
}

Deno.test("no value wears a type nobody checked", () => {
    const named = "    const engineUpdate = original as EngineUpdate;";
    assertEquals(getTypeAssertionLines(named), [1], "the reader flags an assertion");
    const doubled = "startFromWindow(window as unknown as UserscriptWindow);";
    assertEquals(getTypeAssertionLines(doubled), [1], "and reads a doubled one as the one it is");
    assertEquals(getTypeAssertionLines("] as const;"), [], "a literal checked is not overridden");
    const satisfied = '] as const satisfies readonly BattleEvent["kind"][];';
    assertEquals(getTypeAssertionLines(satisfied), [], "and neither is one checked against a type");
    const constant = "const held = value as constant;";
    assertEquals(getTypeAssertionLines(constant), [1], "a longer word is not the keyword");
    const renamed = 'import { assert as check } from "@std/assert/assert";';
    assertEquals(getTypeAssertionLines(renamed), [], "a rename asserts nothing about a value");
    assertEquals(getTypeAssertionLines(" * read as text"), [], "prose is not code");
    assertEquals(
        getTypeAssertionLines('const said = "read as text";'),
        [],
        "and neither is a string",
    );

    const outside: string[] = [];
    const registered = new Set<string>();
    for (const path of getSourcePaths()) {
        if (!SHIPPED_ROOTS.some((root) => path.startsWith(root))) continue;
        const lines = getTypeAssertionLines(Deno.readTextFileSync(path));
        if (lines.length === 0) continue;
        if (ASSERTIONS_WITH_A_REASON.includes(path)) {
            registered.add(path);
            continue;
        }
        for (const line of lines) outside.push(`${path}:${line}`);
    }
    assertEquals(outside, [], "C13: a value narrowed by assertion rather than by a guard");
    assertEquals(
        [...registered].sort(),
        [...ASSERTIONS_WITH_A_REASON].sort(),
        "C13: a register naming a crossing that no longer asserts anything",
    );
});
