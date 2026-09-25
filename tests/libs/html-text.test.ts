/** Every sample here is invented: no sentence of the pages this walks enters the repository. */

import { assert, assertEquals } from "@std/assert";
import { decodeHtmlText } from "#/libs/html-text.ts";

Deno.test("what a browser reads as machinery never reaches the search", () => {
    // Strip tags before script bodies and the page's own code reaches a search as documentation.
    const text = decodeHtmlText("<p>Blok</p><script>var evade = 1;</script><p>Unik</p>");
    assertEquals(text, "Blok Unik", "the script's body came out with its tag");
    assert(!text.includes("evade"), "and took the name inside it along");
    assertEquals(decodeHtmlText("<style>a{b:c}</style><p>1 &lt; 2</p>"), "1 < 2", "style too");
    assertEquals(decodeHtmlText("<SCRIPT>x</SCRIPT>a"), "a", "whatever case the tag is in");
    assertEquals(decodeHtmlText("a <script>b"), "a b", "an unclosed one keeps its body");
});

Deno.test("an entity is unescaped as many times as the page escaped it", () => {
    // Each pass runs over what the one before produced, so `&amp;lt;` reaches `<`.
    assertEquals(decodeHtmlText("<p>a &amp;lt; b</p>"), "a < b", "twice-escaped comes out once");
    assertEquals(decodeHtmlText("<p>a&nbsp;b</p>"), "a b", "and a space that was not one");
    assertEquals(decodeHtmlText("<p>a&nbspb</p>"), "a b", "with or without its semicolon");
});

Deno.test("whitespace is one space between words and none around them", () => {
    assertEquals(decodeHtmlText("  <b>a</b>\n\t <i>b</i>  "), "a b");
    assertEquals(decodeHtmlText(""), "", "nothing is nothing");
    assertEquals(decodeHtmlText("a<>b"), "a<>b", "and `<>` is not a tag");
});
