/**
 * The status bits, lifted off invented bundles written to have the client's shape and nothing of
 * its text. The position a name is registered at is the bit it reads, so order is what is held.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import { FROZEN_BUFF_BITS } from "#/frozen/buff-bits.ts";
import { STATUS_BITS_MAXIMUM } from "#/src/core/carried-status.ts";
import { FROZEN_BUFF_BANNER, LOOKS_MAXIMUM, requireBuffBits } from "#/tools/buff-bit-table.ts";
import { BuffBitTableError } from "#/tools/margometer-tool-error.ts";

Deno.test("the statuses are the entries filed as a buff, in the order they are registered", () => {
    const bundle = 'ae=[new Q("wound",null,"buff"),new Q("stun",null,"debuff"),' +
        'new Q("poisoned",null,"buff"),f("fire",null,`buff`)];';
    assertEquals(
        requireBuffBits(bundle),
        ["wound", "poisoned", "fire"],
        "source order is bit order",
    );
    const unminified = 'var buffNames = [\n\t_t("wound", null, "buff"),\n\t_t( "fire" , null ,' +
        ' "buff" ),\n\t_t("stun", null, "debuff")\n];';
    assertEquals(requireBuffBits(unminified), ["wound", "fire"], "and spaced, as development is");
});

Deno.test("an entry that is not a registration is passed over, not read as a bit", () => {
    const bundle = 'x("wound",null,"buff");y("glued"x,null,"buff");z(,null,"buff");' +
        'w("",null,"buff");v("open,null,"buff");u("a",nullish,"buff");t("b",null,"buff"x)';
    assertEquals(requireBuffBits(bundle), ["wound"], "only a name closing on the arguments");
});

Deno.test("a bundle registering nothing is refused rather than frozen as an empty table", () => {
    // An empty reading looks exactly like a game that dropped the feature.
    assertThrows(() => requireBuffBits("var a=1;"), BuffBitTableError, "no status");
    assertThrows(() => requireBuffBits('x("a",null,"debuff")'), BuffBitTableError, "no status");
});

Deno.test("a bundle past the places the walk looks is refused, and one at them is read", () => {
    assertThrows(
        () => requireBuffBits("null,".repeat(LOOKS_MAXIMUM)),
        BuffBitTableError,
        "no status",
        "every place looked at, and none of them a registration",
    );
    assertThrows(
        () => requireBuffBits("null,".repeat(LOOKS_MAXIMUM + 1)),
        BuffBitTableError,
        "stop short",
        "one place past them, which a walk returning what it had would have frozen",
    );
});

Deno.test("the frozen bits stand under the banner their generator writes, and fit one mask", () => {
    const frozen = Deno.readTextFileSync("frozen/buff-bits.ts");
    assert(
        frozen.startsWith(FROZEN_BUFF_BANNER),
        "frozen/buff-bits.ts was written by an older tool",
    );
    assert(FROZEN_BUFF_BITS.bits.length > 0, "the table names a bit");
    assert(FROZEN_BUFF_BITS.bits.length <= STATUS_BITS_MAXIMUM, "and fits the integer a mask is");
    assertEquals(new Set(FROZEN_BUFF_BITS.bits).size, FROZEN_BUFF_BITS.bits.length, "each once");
});
