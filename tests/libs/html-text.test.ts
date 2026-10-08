/** Every sample here is invented: no sentence of the pages this walks enters the repository. */

import { assert, AssertionError, assertStrictEquals, assertThrows } from "@std/assert";
import { decodeHtmlText, HTML_CHARACTERS_MAXIMUM } from "#/libs/html-text.ts";
import { RUN_CHARACTERS_MAXIMUM } from "#/libs/text-walk.ts";

Deno.test("what a browser reads as machinery never reaches the search", () => {
    // Strip tags before script bodies and the page's own code reaches a search as documentation.
    const text = decodeHtmlText("<p>Blok</p><script>var evade = 1;</script><p>Unik</p>");
    assertStrictEquals(text, "Blok Unik", "the script's body came out with its tag");
    assert(!text.includes("evade"), "and took the name inside it along");
    assertStrictEquals(
        decodeHtmlText("<style>a{b:c}</style><p>1 &lt; 2</p>"),
        "1 < 2",
        "style too",
    );
    assertStrictEquals(decodeHtmlText("<SCRIPT>x</SCRIPT>a"), "a", "whatever case the tag is in");
    assertStrictEquals(decodeHtmlText("a <script>b"), "a b", "an unclosed one keeps its body");
    assertStrictEquals(
        decodeHtmlText("<script>x</script >a"),
        "a",
        "a closing tag may carry a space",
    );
});

Deno.test("an element is the one its whole name names, and not one its name begins", () => {
    assertStrictEquals(
        decodeHtmlText("<styled-note>a</styled-note>"),
        "a",
        "a name that starts as `style` is another element, whose words are read",
    );
    assertStrictEquals(
        decodeHtmlText("<style type=x>a{b:c}</style>b"),
        "b",
        "a name ends at a space",
    );
    assertStrictEquals(decodeHtmlText("<style/>a{b:c}</style>b"), "b", "and at a slash");
});

Deno.test("an entity is unescaped once, as a browser shows it", () => {
    assertStrictEquals(
        decodeHtmlText("<p>a &amp;lt; b</p>"),
        "a &lt; b",
        "an escaped `&lt;` is shown",
    );
    assertStrictEquals(
        decodeHtmlText("<p>a&amp;nbsp;b</p>"),
        "a&nbsp;b",
        "and so is an escaped space",
    );
    assertStrictEquals(decodeHtmlText("<p>a&nbsp;b</p>"), "a b", "a space that was not one is one");
    assertStrictEquals(decodeHtmlText("<p>a&nbspb</p>"), "a b", "with or without its semicolon");
    assertStrictEquals(decodeHtmlText("<p>a &gt; b</p>"), "a > b", "a greater-than sign");
    assertStrictEquals(decodeHtmlText("<p>&quot;a&quot;</p>"), '"a"', "a quotation mark");
    assertStrictEquals(decodeHtmlText("max x &in; X"), "max x \u2208 X", "and an element-of sign");
    assertStrictEquals(
        decodeHtmlText("a &b; c&"),
        "a &b; c&",
        "while a name no browser knows stays",
    );
});

Deno.test("a numeric reference reads as the character it names, and one naming none stays", () => {
    assertStrictEquals(
        decodeHtmlText("a&#160;b"),
        "a b",
        "a no-break space is a space, as `&nbsp;` is",
    );
    assertStrictEquals(
        decodeHtmlText("&#8730;2"),
        "\u221a2",
        "a decimal reference names its character",
    );
    assertStrictEquals(decodeHtmlText("&#x221A;2"), "\u221a2", "and so does a hexadecimal one");
    assertStrictEquals(
        decodeHtmlText("a&amp;#160;b"),
        "a&#160;b",
        "escaped once more, it is shown",
    );
    assertStrictEquals(decodeHtmlText("&#160 a"), "&#160 a", "one never closed is text");
    assertStrictEquals(decodeHtmlText("&#;"), "&#;", "and so is one with no digits");
    assertStrictEquals(decodeHtmlText("&#x;"), "&#x;", "in either base");
    assertStrictEquals(decodeHtmlText("a&#"), "a&#", "or one the text ends inside");
    assertStrictEquals(decodeHtmlText("a&#x"), "a&#x", "past its base, too");
    assertStrictEquals(decodeHtmlText("&#0;"), "&#0;", "or one naming the character nothing is");
    assertStrictEquals(decodeHtmlText("&#1;"), "\u0001", "while the character after it is one");
    assertStrictEquals(
        decodeHtmlText("&#xD7FF;"),
        "\ud7ff",
        "the last character before the halves",
    );
    assertStrictEquals(decodeHtmlText("&#127;"), "\u007f", "the last character before C1");
    assertStrictEquals(decodeHtmlText("&#128;"), "&#128;", "and not the first C1 control");
    assertStrictEquals(decodeHtmlText("&#x9F;"), "&#x9F;", "nor the last, which a browser remaps");
    assertStrictEquals(decodeHtmlText("a&#xA0;b"), "a b", "while the first after them reads");
    assertStrictEquals(decodeHtmlText("&#xD800;"), "&#xD800;", "and not the first half of one");
    assertStrictEquals(decodeHtmlText("&#xDFFF;"), "&#xDFFF;", "nor the last");
    assertStrictEquals(decodeHtmlText("&#xE000;"), "\ue000", "while the first after them is one");
    assertStrictEquals(decodeHtmlText("&#1114112;"), "&#1114112;", "or one past the last there is");
    assertStrictEquals(decodeHtmlText("&#1114111;"), "\u{10ffff}", "while the last is one");
});

Deno.test("zeros in front of a reference name nothing, however many a page writes", () => {
    assertStrictEquals(decodeHtmlText("&#000000065;"), "A", "past the most digits a name has");
    assertStrictEquals(decodeHtmlText("&#x00010FFFF;"), "\u{10ffff}", "in either base");
    assertStrictEquals(decodeHtmlText("&#00;"), "&#00;", "and zeros alone still name nothing");
    const zeros = "0".repeat(RUN_CHARACTERS_MAXIMUM);
    assertStrictEquals(decodeHtmlText(`&#${zeros}65;`), "A", "past the bound on a run, too");
    assertStrictEquals(
        decodeHtmlText("&#10000000;"),
        "&#10000000;",
        "while eight digits are past one",
    );
});

Deno.test("a `<` a browser opens no tag at is text, and one it does is not", () => {
    assertStrictEquals(
        decodeHtmlText("HP &lt;50% i <b>ok</b>"),
        "HP <50% i ok",
        "an escaped one stays",
    );
    assertStrictEquals(decodeHtmlText("a <= 2 <b>c</b>"), "a <= 2 c", "a sign before a tag stays");
    assertStrictEquals(
        decodeHtmlText("a <120 lvl<br>"),
        "a <120 lvl",
        "and so does one before a digit",
    );
    assertStrictEquals(decodeHtmlText("a</b>b"), "a b", "a closing tag opens on its slash");
    assertStrictEquals(decodeHtmlText("a<!-- b -->c"), "a c", "a comment on its mark");
    assertStrictEquals(decodeHtmlText("a<?b?>c"), "a c", "and an instruction on its question mark");
    assertStrictEquals(decodeHtmlText("a<Zb>c"), "a c", "a tag opens on a letter of either case");
});

Deno.test("a `>` inside a comment or a quoted value closes nothing", () => {
    assertStrictEquals(
        decodeHtmlText("a<!-- b > c -->d"),
        "a d",
        "a comment closes at its own mark",
    );
    assertStrictEquals(decodeHtmlText("a<!-->b"), "a b", "and one written closed is closed");
    assertStrictEquals(decodeHtmlText("a<!--->b"), "a b", "however many dashes close it");
    assertStrictEquals(decodeHtmlText("a<!-- <script> -->b"), "a b", "and opens no element inside");
    assertStrictEquals(decodeHtmlText('a<b title="1>2">c'), "a c", "a quoted value holds its `>`");
    assertStrictEquals(decodeHtmlText("a<b title = '1>2'>c"), "a c", "in either quoting");
    assertStrictEquals(
        decodeHtmlText('a<b c"d>e'),
        "a e",
        "while a quote outside a value is a letter",
    );
    assertStrictEquals(
        decodeHtmlText('a<!b="1>2">c'),
        'a 2">c',
        "while `<!` closes at its first `>`",
    );
    assertStrictEquals(decodeHtmlText('a<?b="1>2">c'), 'a 2">c', "and so does `<?`");
});

/** Where this reads a page otherwise than a browser does, on purpose, so a change of it is seen. */
Deno.test("an unclosed comment is kept as text, and a tag inside a word parts it", () => {
    assertStrictEquals(decodeHtmlText("a<!-- b"), "a<!-- b", "where a browser hides the rest");
    assertStrictEquals(decodeHtmlText("Bl<b>o</b>k"), "Bl o k", "where a browser joins the word");
});

Deno.test("a page is read up to the bound on its length, and a page past it is a broken call", () => {
    const longest = "a".repeat(HTML_CHARACTERS_MAXIMUM);
    assertStrictEquals(
        decodeHtmlText(longest).length,
        HTML_CHARACTERS_MAXIMUM,
        "a page at the bound",
    );
    assertThrows(
        () => decodeHtmlText(`${longest}a`),
        AssertionError,
        "a page stays inside the length it is walked to",
    );
});

Deno.test("whitespace is walked under the bound on a page, never under the one on a run", () => {
    const run = " ".repeat(RUN_CHARACTERS_MAXIMUM - 1);
    assertStrictEquals(decodeHtmlText(`${run}a`), "a", "a run one short of the bound on a run");
    assertStrictEquals(decodeHtmlText(`${run} a`), "a", "and one at it, which a page may write");
    const page = " ".repeat(HTML_CHARACTERS_MAXIMUM);
    assertStrictEquals(decodeHtmlText(page), "", "and one as long as a page is");
});

Deno.test("whitespace is one space between words and none around them", () => {
    assertStrictEquals(decodeHtmlText("  <b>a</b>\n\t <i>b</i>  "), "a b");
    assertStrictEquals(decodeHtmlText(""), "", "nothing is nothing");
    assertStrictEquals(decodeHtmlText("a<>b"), "a<>b", "and `<>` is not a tag");
});
