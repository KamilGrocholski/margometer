/** Every sample here is invented: no sentence of the pages this walks enters the repository. */

import { assert, assertEquals } from "@std/assert";
import { getTextFromHtml } from "@/libs/html-text.ts";

Deno.test("what a browser reads as machinery never reaches the search", () => {
    // Strip the tags before the script bodies and the page's own code stays in the result, where
    // a search hits it and reports machinery as documentation.
    const text = getTextFromHtml("<p>Blok</p><script>var evade = 1;</script><p>Unik</p>");
    assertEquals(text, "Blok Unik", "the script's body came out with its tag");
    assert(!text.includes("evade"), "and took the name inside it along");
    assertEquals(getTextFromHtml("<style>a{b:c}</style><p>1 &lt; 2</p>"), "1 < 2", "style too");
});

Deno.test("an entity is unescaped as many times as the page escaped it", () => {
    // Each pass runs over what the one before produced, so `&amp;lt;` reaches `<`. One pass over
    // the original stops at `&lt;`, which is a different answer to the same input.
    assertEquals(getTextFromHtml("<p>a &amp;lt; b</p>"), "a < b", "twice-escaped comes out once");
    assertEquals(getTextFromHtml("<p>a&nbsp;b</p>"), "a b", "and a space that was not one");
});
