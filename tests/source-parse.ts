/**
 * The tree as a parser reads it, for the guards that need a second reading of what the line
 * readers in `tests/source-graph.ts` walk by hand. `Deno.lint.runPlugin` parses a file properly
 * and hands each node of the kinds asked for to a visitor, which is all this asks of it.
 */

/**
 * `Deno.lint` is declared only under the `deno.unstable` library, and naming that in
 * `compilerOptions.lib` would show every unstable API of the runtime to `src/` as well. C13 keeps
 * the assertion inside a test for exactly this, and the shape below is the whole of what is used.
 */
export interface AstNode {
    type: string;
    range: [number, number];
    body?: { type: string } | null;
    params?: readonly unknown[];
}
type AstVisitor = Record<string, (node: AstNode) => void>;
interface LintPlugin {
    name: string;
    rules: Record<string, { create: () => AstVisitor }>;
}
const lint = (Deno as unknown as {
    lint: { runPlugin(plugin: LintPlugin, filename: string, source: string): unknown };
}).lint;

export const FUNCTION_NODES = [
    "FunctionDeclaration",
    "FunctionExpression",
    "ArrowFunctionExpression",
];

/** Every node of the kinds asked for, in the order the parser meets them. */
export function readAstNodes(path: string, text: string, kinds: readonly string[]): AstNode[] {
    const found: AstNode[] = [];
    const visitors: AstVisitor = {};
    for (const kind of kinds) visitors[kind] = (node) => found.push(node);
    lint.runPlugin({ name: "read", rules: { walk: { create: () => visitors } } }, path, text);
    return found;
}
