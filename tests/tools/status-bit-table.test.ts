/**
 * The status bits, lifted off invented bundles written to have the client's shape and nothing of
 * its text. The position a name is registered at is the bit it reads, so order is what is held.
 */

import { assert, assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import { FROZEN_STATUS_BITS } from "#/frozen/status-bits.ts";
import { LITERAL_CHARACTERS_MAXIMUM, RUN_CHARACTERS_MAXIMUM } from "#/libs/text-walk.ts";
import { STATUS_BITS_MAXIMUM } from "#/src/core/carried-status.ts";
import {
    FROZEN_STATUS_BANNER,
    LOOKS_MAXIMUM,
    requireStatusBits,
} from "#/tools/status-bit-table.ts";
import { StatusBitTableError } from "#/tools/margometer-tool-error.ts";

Deno.test("the statuses are the entries filed under `buff`, in the order they are registered", () => {
    const bundle = 'ae=[new Q("wound",null,"buff"),new Q("stun",null,"debuff"),' +
        'new Q("poisoned",null,"buff"),f("fire",null,`buff`)];';
    assertEquals(
        requireStatusBits(bundle),
        ["wound", "poisoned", "fire"],
        "source order is bit order",
    );
    const unminified = 'var buffNames = [\n\t_t("wound", null, "buff"),\n\t_t( "fire" , null ,' +
        ' "buff" ),\n\t_t("stun", null, "debuff")\n];';
    assertEquals(requireStatusBits(unminified), ["wound", "fire"], "and spaced, as development is");
});

Deno.test("an entry that is not a registration is passed over, not read as a bit", () => {
    const bundle = 'x("wound",null,"buff");y("glued"x,null,"buff");z(,null,"buff");' +
        'w("",null,"buff");v("open,null,"buff");u("a",nullish,"buff");t("b",null,"buff"x)';
    assertEquals(requireStatusBits(bundle), ["wound"], "only a name closing on the arguments");
});

Deno.test("a bundle registering nothing is refused rather than frozen as an empty table", () => {
    // An empty reading looks exactly like a game that dropped the feature.
    assertThrows(() => requireStatusBits("var a=1;"), StatusBitTableError, "no status");
    assertThrows(() => requireStatusBits('x("a",null,"debuff")'), StatusBitTableError, "no status");
});

Deno.test("a bundle past the places the walk looks is refused, and one at them is read", () => {
    assertThrows(
        () => requireStatusBits("null,".repeat(LOOKS_MAXIMUM)),
        StatusBitTableError,
        "no status",
        "every place looked at, and none of them a registration",
    );
    assertThrows(
        () => requireStatusBits("null,".repeat(LOOKS_MAXIMUM + 1)),
        StatusBitTableError,
        "stop short",
        "one place past them, which a walk returning what it had would have frozen",
    );
});

Deno.test("more statuses than a mask has bits are refused, and as many as it has are read", () => {
    const registering = (count: number) =>
        Array.from({ length: count }, (_, index) => `x("s${index}",null,"buff")`).join(";");
    assertStrictEquals(
        requireStatusBits(registering(STATUS_BITS_MAXIMUM)).length,
        STATUS_BITS_MAXIMUM,
    );
    assertThrows(
        () => requireStatusBits(registering(STATUS_BITS_MAXIMUM + 1)),
        StatusBitTableError,
        "a mask holds",
    );
});

Deno.test("a status registered at two bits is refused, and two statuses are read", () => {
    assertEquals(requireStatusBits('x("a",null,"buff");x("b",null,"buff")'), ["a", "b"]);
    assertThrows(
        () => requireStatusBits('x("a",null,"buff");x("a",null,"buff")'),
        StatusBitTableError,
        "two bits",
    );
});

Deno.test("whitespace running past the walk's bound is refused, and up to it is read", () => {
    const spaced = (count: number) => `x("a",null${" ".repeat(count)},"buff")`;
    assertEquals(requireStatusBits(spaced(RUN_CHARACTERS_MAXIMUM - 1)), ["a"], "under the bound");
    assertThrows(
        () => requireStatusBits(spaced(RUN_CHARACTERS_MAXIMUM)),
        StatusBitTableError,
        "runs past",
    );
});

Deno.test("a literal running past the walk's bound is refused, and one at it is read", () => {
    const naming = (count: number) => `x("a",null,"${"b".repeat(count)}");y("c",null,"buff")`;
    assertEquals(requireStatusBits(naming(LITERAL_CHARACTERS_MAXIMUM)), ["c"], "at the bound");
    assertThrows(
        () => requireStatusBits(naming(LITERAL_CHARACTERS_MAXIMUM + 1)),
        StatusBitTableError,
        "runs past",
    );
});

Deno.test("the frozen bits stand under the banner their generator writes, and fit one mask", () => {
    const frozen = Deno.readTextFileSync("frozen/status-bits.ts");
    assert(
        frozen.startsWith(FROZEN_STATUS_BANNER),
        "frozen/status-bits.ts was written by an older tool",
    );
    assert(FROZEN_STATUS_BITS.bits.length > 0, "the table names a bit");
    assert(FROZEN_STATUS_BITS.bits.length <= STATUS_BITS_MAXIMUM, "and fits the integer a mask is");
    assertStrictEquals(
        new Set(FROZEN_STATUS_BITS.bits).size,
        FROZEN_STATUS_BITS.bits.length,
        "each once",
    );
});
