/**
 * A node that answers every call the panel makes of one, and records nothing.
 *
 * `src/ui/` declares the slice of the DOM it uses and takes it as an argument
 * (§9.9), so a test that only needs the panel to *draw* needs exactly this
 * surface and no more. Five copies of it were spelled out inside
 * `tests/game/engine-attachment.test.ts` before this file existed.
 *
 * ⚠️ **Inert on purpose.** A test asking what the panel *put* somewhere wants a
 * node that remembers — where the panel sits, what a click reached, which
 * children a region drew — and those stay written out beside the test that reads
 * them, because what each records is the whole of what it is for. This one is for
 * the tests that only need the drawing not to throw.
 */
export type InertNode = Record<string, unknown>;

export function composeInertNode(): InertNode {
  const node: InertNode = {
    className: "",
    id: "",
    setAttribute: (): void => {},
    textContent: "",
    title: "",
    style: { setProperty: (): void => {} },
    append: (): void => {},
    replaceChildren: (): void => {},
    addEventListener: (): void => {},
    attachShadow: (): unknown => composeInertNode(),
  };
  return node;
}

/**
 * A page whose document makes those nodes.
 *
 * `createElement` is taken as an argument so the one test that needs a tag to
 * throw can say which tag, rather than rebuilding the page around it.
 */
export type InertPage = {
  document: { createElement: (tag: string) => unknown; body: { append: () => void } };
};

export function composeInertPage(
  createElement: (tag: string) => unknown = composeInertNode,
): InertPage {
  return {
    document: {
      createElement,
      body: { append: (): void => {} },
    },
  };
}
