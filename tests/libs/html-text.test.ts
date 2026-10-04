/** Every sample here is invented: no sentence of the pages this walks enters the repository. */

import { assert, assertEquals, AssertionError, assertThrows } from "@std/assert";
import { decodeHtmlText, HTML_CHARACTERS_MAXIMUM } from "#/libs/html-text.ts";

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
    assertEquals(decodeHtmlText("<p>a &gt; b</p>"), "a > b", "a greater-than sign");
    assertEquals(decodeHtmlText("<p>&quot;a&quot;</p>"), '"a"', "and a quotation mark");
});

Deno.test("a numeric reference reads as the character it names, and one naming none stays", () => {
    assertEquals(decodeHtmlText("a&#160;b"), "a b", "a no-break space is a space, as `&nbsp;` is");
    assertEquals(decodeHtmlText("&#8730;2"), "\u221a2", "a decimal reference names its character");
    assertEquals(decodeHtmlText("&#x221A;2"), "\u221a2", "and so does a hexadecimal one");
    assertEquals(decodeHtmlText("a&amp;#160;b"), "a b", "escaped once more, it is read through");
    assertEquals(decodeHtmlText("&#160 a"), "&#160 a", "one never closed is text");
    assertEquals(decodeHtmlText("&#;"), "&#;", "and so is one with no digits");
    assertEquals(decodeHtmlText("&#0;"), "&#0;", "or one naming the character nothing is");
    assertEquals(decodeHtmlText("&#xD800;"), "&#xD800;", "or half a character");
    assertEquals(decodeHtmlText("&#1114112;"), "&#1114112;", "or one past the last there is");
    assertEquals(decodeHtmlText("&#1114111;"), "\u{10ffff}", "while the last is one");
});

Deno.test("a `<` a browser opens no tag at is text, and one it does is not", () => {
    assertEquals(decodeHtmlText("HP &lt;50% i <b>ok</b>"), "HP <50% i ok", "an escaped one stays");
    assertEquals(decodeHtmlText("a <= 2 <b>c</b>"), "a <= 2 c", "a sign before a tag stays");
    assertEquals(decodeHtmlText("a <120 lvl<br>"), "a <120 lvl", "and so does one before a digit");
    assertEquals(decodeHtmlText("a</b>b"), "a b", "a closing tag opens on its slash");
    assertEquals(decodeHtmlText("a<!-- b -->c"), "a c", "a comment on its mark");
    assertEquals(decodeHtmlText("a<?b?>c"), "a c", "and an instruction on its question mark");
    assertEquals(decodeHtmlText("a<Zb>c"), "a c", "a tag opens on a letter of either case");
});

Deno.test("a page is read up to the bound on its length, and a page past it is a broken call", () => {
    const longest = "a".repeat(HTML_CHARACTERS_MAXIMUM);
    assertEquals(decodeHtmlText(longest).length, HTML_CHARACTERS_MAXIMUM, "a page at the bound");
    assertThrows(
        () => decodeHtmlText(`${longest}a`),
        AssertionError,
        "a page stays inside the length it is walked to",
    );
});

Deno.test("whitespace is one space between words and none around them", () => {
    assertEquals(decodeHtmlText("  <b>a</b>\n\t <i>b</i>  "), "a b");
    assertEquals(decodeHtmlText(""), "", "nothing is nothing");
    assertEquals(decodeHtmlText("a<>b"), "a<>b", "and `<>` is not a tag");
});
