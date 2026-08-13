import { describe, expect, test } from "bun:test";
import { getRecordFromValue, getRecordOrArrayFromValue } from "@/libs/record.ts";

/**
 * The two readers, and the one question that separates them.
 *
 * This file exists because of a mutation that lit nothing (§7.5): with the array
 * refusal deleted from `getRecordFromValue`, all 1973 tests stayed green. Every
 * consumer was reached through a path where the distinction did not happen to
 * matter, so the difference the whole two-reader split is for was held by
 * nothing — the same shape as the finding that produced the primitive.
 */

describe("admitting anything with keys", () => {
  test.each([
    ["an object", {}],
    ["an object with fields", { a: 1 }],
    ["an array, which has keys", [1, 2]],
    ["an empty array", []],
    ["an object made without a prototype", Object.create(null)],
  ])("reads %s", (_what, value) => {
    expect(getRecordOrArrayFromValue(value)).not.toBeNull();
  });

  /**
   * `typeof null === "object"` is the value nobody wrote that §9.5 admits a
   * primitive on, and it is why every call site used to carry the null check by
   * hand.
   */
  test.each([
    ["null", null],
    ["nothing", undefined],
    ["a number", 5],
    ["text", "one"],
    ["a boolean", true],
  ])("refuses %s", (_what, value) => {
    expect(getRecordOrArrayFromValue(value)).toBeNull();
  });

  test("hands back the very value, not a copy of it", () => {
    const value = { a: 1 };
    expect(getRecordOrArrayFromValue(value)).toBe(value);
  });

  test("reads an array's entries by their keys", () => {
    expect(getRecordOrArrayFromValue(["first"])?.["0"]).toBe("first");
  });
});

describe("refusing a list", () => {
  /**
   * ⚠️ The difference between the two readers, and the only test that has ever
   * held it. A stored position or a field out of a captured dump wants a list
   * refused — a list arriving where an object belongs is the file being wrong,
   * not the shape being loose.
   */
  test.each([
    ["an array", [1, 2]],
    ["an empty array", []],
  ])("refuses %s, which the other reader admits", (_what, value) => {
    expect(getRecordFromValue(value)).toBeNull();
    expect(getRecordOrArrayFromValue(value)).not.toBeNull();
  });

  test.each([
    ["an object", {}],
    ["an object with fields", { a: 1 }],
  ])("admits %s, like the other reader", (_what, value) => {
    expect(getRecordFromValue(value)).not.toBeNull();
  });

  test.each([
    ["null", null],
    ["nothing", undefined],
    ["a number", 5],
    ["text", "one"],
  ])("refuses %s, like the other reader", (_what, value) => {
    expect(getRecordFromValue(value)).toBeNull();
  });
});
