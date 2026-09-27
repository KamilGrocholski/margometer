/**
 * Reading the panel's stylesheet back, for the guards that check what it says rather than what a
 * browser would make of it. Here because two test files ask the same question of it.
 */

import { assert, assertNotStrictEquals } from "@std/assert";

export interface SheetRule {
    selector: string;
    body: string;
}

/**
 * What the sheet holds at its widest, measured over `composeStyleSheet()` on 2026-08-29: 78 rules,
 * the longest of them `:host` at 790 characters, which is the tokens and the frame together.
 */
export const RULES_IN_A_SHEET = 200;
export const LONGEST_RULE = 1024;

/** Read rather than matched, so a length typed into a rule is caught as a token misspent is. */
export function getRuleBody(sheet: string, selector: string): string {
    assert(selector.startsWith("."), "a rule is looked up by the class it selects");
    const opener = `${selector}{`;
    // The selector has to stand on its own: `.list{` sits inside `.panel>.list{` too, and that
    // rule states a `flex` and nothing a guard adds up.
    let at = sheet.indexOf(opener);
    let tried = 0;
    while (at > 0) {
        assert(tried < RULES_IN_A_SHEET, "a lookup stays inside the sheet's stated bound");
        tried += 1;
        if (sheet[at - 1] === "}") break;
        at = sheet.indexOf(opener, at + 1);
    }
    assertNotStrictEquals(at, -1, `${selector} is a rule of its own the sheet does not carry`);
    const from = at + opener.length;
    const to = sheet.indexOf("}", from);
    assertNotStrictEquals(to, -1, `${selector} opens a rule the sheet never closes`);
    return sheet.slice(from, to);
}

/** The last one written wins, which is what a browser does with the same rule. */
export function getDeclaration(body: string, property: string): string | null {
    assert(property.length > 0, "a declaration is looked up by name");
    assert(body.length <= LONGEST_RULE, "a rule stays inside its stated bound");
    let found: string | null = null;
    for (const stated of body.split(";")) {
        const at = stated.indexOf(":");
        if (at === -1) continue;
        if (stated.slice(0, at).trim() !== property) continue;
        found = stated.slice(at + 1).trim();
    }
    return found;
}

/** Every rule in the order it is written. The sheet nests nothing, so a rule ends at its first `}`. */
export function readRules(sheet: string): SheetRule[] {
    const rules: SheetRule[] = [];
    let from = 0;
    for (let step = 0; step < RULES_IN_A_SHEET; step += 1) {
        if (from >= sheet.length) break;
        const opened = sheet.indexOf("{", from);
        assertNotStrictEquals(opened, -1, "what follows the last rule is another rule");
        const closed = sheet.indexOf("}", opened);
        assertNotStrictEquals(closed, -1, "every rule the sheet opens is closed");
        rules.push({ selector: sheet.slice(from, opened), body: sheet.slice(opened + 1, closed) });
        from = closed + 1;
    }
    assert(from >= sheet.length, "the sheet holds no more rules than its stated bound");
    return rules;
}
