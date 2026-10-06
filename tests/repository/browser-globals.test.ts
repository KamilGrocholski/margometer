/**
 * `SECURITY.md`: the panel is handed its document and never reaches for one. A name in `src/ui/`
 * that only a browser's global scope declares is flagged; the same name bound in the file — a
 * parameter, a local, an import — is the slice the panel was handed, and a property or a key is
 * not a reference at all. That keeps what the panel asks of a browser declared rather than ambient.
 */

import { assert, assertEquals } from "@std/assert";
import {
    type AstNode,
    composeSample,
    formatNodePlace,
    FUNCTION_NODES,
    readAstNodes,
    readBoundNames,
    readChildNode,
    readSourceFiles,
    type SourceFile,
} from "#/tests/source-tree.ts";

/** A name a file binds, and the stretch of text where it stands for that binding. */
interface Binding {
    name: string;
    scope: readonly [number, number];
}

const PANEL_DIRECTORY = "src/ui";
/** What a browser declares on its global scope and the panel is handed instead, never reaches. */
const BROWSER_GLOBALS = [
    "window",
    "self",
    "globalThis",
    "document",
    "navigator",
    "location",
    "history",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "fetch",
    "XMLHttpRequest",
    "WebSocket",
    "console",
    "setTimeout",
    "setInterval",
    "requestAnimationFrame",
    "innerWidth",
    "innerHeight",
];
const IDENTIFIER_NODE = "Identifier";
const MEMBER_NODE = "MemberExpression";
/** Where an identifier is a key: of an object, a class or an interface, never a reference. */
const KEYED_NODES = [
    "Property",
    "PropertyDefinition",
    "MethodDefinition",
    "TSPropertySignature",
    "TSMethodSignature",
];
/** Where an identifier names a type, which no browser's global scope is asked for. */
const TYPE_NAME_NODES = ["TSTypeReference", "TSQualifiedName", "TSTypeQuery"];
/** What opens a scope a name bound inside it stands in. */
const SCOPE_NODES = [
    ...FUNCTION_NODES,
    "Program",
    "BlockStatement",
    "StaticBlock",
    "ForStatement",
    "ForInStatement",
    "ForOfStatement",
    "SwitchStatement",
    "CatchClause",
];
const IMPORT_SPECIFIER_NODES = [
    "ImportSpecifier",
    "ImportDefaultSpecifier",
    "ImportNamespaceSpecifier",
];
/** What binds its name in the scope around it rather than in its own. */
const DECLARED_NODES = ["VariableDeclarator", "FunctionDeclaration", "ClassDeclaration"];
const BINDING_NODES = [
    ...FUNCTION_NODES,
    ...IMPORT_SPECIFIER_NODES,
    ...DECLARED_NODES,
    "CatchClause",
];
/** Past the depth of any parse here, so the climb to a scope carries a stated bound. */
const CLIMB_MAXIMUM = 512;

Deno.test("a global the panel reaches for is flagged, and a name it was handed is not", () => {
    const sample = composeSample([
        "const height = window.innerHeight;",
        "function drawPanel(document: PanelDocument): void { document.createElement('b'); }",
        "const place = { location: 1, window };",
        "function tallyWidths(sizes: { window: number }): number {",
        "    const navigator = 1;",
        "    return sizes.window + navigator;",
        "}",
        "const stored = localStorage;",
        "import { console } from './sample-console.ts';",
        "console.error(navigator);",
        "type Place = typeof location;",
    ]);
    assertEquals(lookupBrowserGlobals(sample), [
        "sample.ts:1 window",
        "sample.ts:3 window",
        "sample.ts:8 localStorage",
        "sample.ts:10 navigator",
    ], "a global is flagged where it is reached, and outside the scope a binding shadows it");
});

function lookupBrowserGlobals(file: SourceFile): string[] {
    const bindings = readBindings(file);
    const reaching: string[] = [];
    for (const identifier of readAstNodes(file, [IDENTIFIER_NODE])) {
        const name = identifier.name ?? "";
        if (!BROWSER_GLOBALS.includes(name)) continue;
        if (!isReference(identifier)) continue;
        if (bindings.some((binding) => isBindingOver(binding, identifier))) continue;
        reaching.push(`${formatNodePlace(file, identifier)} ${name}`);
    }
    // A shorthand `{ window }` is visited as its key and as its value, which are one place.
    return [...new Set(reaching)];
}

/** Every name the file binds, each with the scope it is bound in. */
function readBindings(file: SourceFile): Binding[] {
    const bindings: Binding[] = [];
    const wholeFile = [0, file.text.length] as const;
    for (const binder of readAstNodes(file, BINDING_NODES)) {
        const patterns: [AstNode | null, readonly [number, number]][] = [];
        if (IMPORT_SPECIFIER_NODES.includes(binder.type)) {
            patterns.push([binder.local ?? null, wholeFile]);
        } else if (binder.type === "CatchClause") {
            patterns.push([binder.param ?? null, binder.range]);
        } else if (DECLARED_NODES.includes(binder.type)) {
            const scope = lookupScopeRange(binder.parent ?? null, wholeFile);
            patterns.push([binder.id ?? null, scope]);
        } else {
            patterns.push([binder.id ?? null, binder.range]);
        }
        for (const parameter of binder.params ?? []) patterns.push([parameter, binder.range]);
        for (const [pattern, scope] of patterns) {
            for (const name of readBoundNames(pattern)) bindings.push({ name, scope });
        }
    }
    return bindings;
}

/** The scope a node stands in, itself included, or the whole file where none encloses it. */
function lookupScopeRange(
    start: AstNode | null,
    wholeFile: readonly [number, number],
): readonly [number, number] {
    let ancestor = start;
    for (let depth = 0; ancestor !== null; depth += 1) {
        assert(depth < CLIMB_MAXIMUM, "a parse stays inside the depth a climb states");
        if (SCOPE_NODES.includes(ancestor.type)) return ancestor.range;
        ancestor = ancestor.parent ?? null;
    }
    return wholeFile;
}

/** Whether an identifier is read as a value: not a property after a dot, a key, or a type. */
function isReference(identifier: AstNode): boolean {
    const parent = identifier.parent ?? null;
    if (parent === null) return true;
    if (TYPE_NAME_NODES.includes(parent.type)) return false;
    if (parent.type === MEMBER_NODE) {
        if (parent.computed === true) return true;
        return !isSameRange(parent.property ?? null, identifier);
    }
    if (!KEYED_NODES.includes(parent.type)) return true;
    if (parent.computed === true) return true;
    if (!isSameRange(parent.key ?? null, identifier)) return true;
    // A shorthand `{ window }` is its key and its value at once, and the value is a reference.
    return isSameRange(readChildNode(parent.value), identifier);
}

function isSameRange(candidate: AstNode | null, identifier: AstNode): boolean {
    if (candidate === null) return false;
    if (candidate.range[0] !== identifier.range[0]) return false;
    return candidate.range[1] === identifier.range[1];
}

function isBindingOver(binding: Binding, identifier: AstNode): boolean {
    if (binding.name !== identifier.name) return false;
    if (binding.scope[0] > identifier.range[0]) return false;
    return binding.scope[1] >= identifier.range[1];
}

Deno.test("the panel reaches for no browser global, and takes what it uses as an argument", () => {
    const files = readSourceFiles([PANEL_DIRECTORY]);
    assertEquals(files.flatMap(lookupBrowserGlobals), [], "SECURITY.md: the panel is handed");
});
