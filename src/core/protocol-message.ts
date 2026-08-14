/**
 * Grammar of one protocol message. Structure only — what a key *means* is the
 * decoder's job.
 *
 *   actor;target;key=value;key=value;flag
 *
 * Both sides come first, each an integer combatant id optionally followed by a
 * health percentage. `0` in a side position means the protocol named nobody.
 *
 * Strict on purpose: anything the grammar does not cover throws. The decoder is
 * the layer that has to survive surprises, and it does so by turning a throw
 * here into a loud unknown event — not by letting a half-read message through
 * as if it were understood.
 */

import { composeJsonText } from "@/libs/json.ts";
import { assertDefined } from "@/libs/assert.ts";
import {
  composeDecimalText,
  composeIntegerText,
  getDecimalFromText,
  getIntegerFromText,
} from "@/libs/number.ts";
import { MargoMeterError } from "@/src/core/margometer-error.ts";

export class ProtocolMessageFormatError extends MargoMeterError {
  constructor(reason: string, message: string) {
    super("ProtocolMessageFormat", `${reason}: ${composeJsonText(message)}`);
  }
}

export type MessageSide = {
  combatantId: number;
  /** Health the protocol states for this combatant, or null when it states none. */
  healthPercent: number | null;
};

export type MessageParameter = {
  key: string;
  /** Null for a segment with no `=` at all. An empty value would be `""`, which is different. */
  value: string | null;
};

export type ProtocolMessage = {
  /**
   * The two sides, in protocol order. Null when the protocol wrote `0`.
   *
   * Measured on the captured fights: in messages carrying dealt damage, the
   * second side lost health in almost every case and was never left unchanged,
   * while the first side was unchanged in most. Hence actor and target rather
   * than first and second.
   */
  actor: MessageSide | null;
  target: MessageSide | null;
  parameters: MessageParameter[];
};

const SIDE_PATTERN = /^(-?\d+)(?:=(\d+\.\d{2}))?$/;
const SEGMENT_SEPARATOR = ";";
const NO_COMBATANT = "0";

function parseMessageSide(segment: string, whole: string): MessageSide | null {
  if (segment === NO_COMBATANT) return null;

  const match = SIDE_PATTERN.exec(segment);
  if (!match) throw new ProtocolMessageFormatError(`side segment "${segment}" is not an id`, whole);

  // The pattern proves the shape — digits, and a two-place percentage — so that
  // the groups exist is an invariant of ours. That the digits fit in a number is
  // not: the protocol could state an id longer than 2^53, and reading it as its
  // nearest neighbour would attribute damage to a combatant who does not exist.
  // Magnitude is therefore the game's business and refused like any other
  // format problem, which the decoder turns into a loud unknown.
  const id = assertDefined(match[1], "SIDE_PATTERN captures the id");
  const percent = match[2];

  const combatantId = getIntegerFromText(id);
  if (combatantId === null) {
    throw new ProtocolMessageFormatError(`side segment "${segment}" states an unusable id`, whole);
  }

  if (percent === undefined) return { combatantId, healthPercent: null };

  const healthPercent = getDecimalFromText(percent);
  if (healthPercent === null) {
    throw new ProtocolMessageFormatError(
      `side segment "${segment}" states an unusable percentage`,
      whole,
    );
  }
  return { combatantId, healthPercent };
}

function parseMessageParameter(segment: string): MessageParameter {
  const separator = segment.indexOf("=");
  if (separator === -1) return { key: segment, value: null };
  return { key: segment.slice(0, separator), value: segment.slice(separator + 1) };
}

export function parseProtocolMessage(message: string): ProtocolMessage {
  const segments = message.split(SEGMENT_SEPARATOR);
  if (segments.length < 2) {
    throw new ProtocolMessageFormatError("fewer than two side segments", message);
  }

  const [actor, target] = segments;
  return {
    actor: parseMessageSide(assertDefined(actor, "message has a first segment"), message),
    target: parseMessageSide(assertDefined(target, "message has a second segment"), message),
    parameters: segments.slice(2).map(parseMessageParameter),
  };
}

/**
 * Rebuilds the wire text from the parsed structure.
 *
 * Exists for one reason: it makes "the parser loses nothing" a testable claim
 * over the whole corpus. A field silently dropped during parsing is exactly the
 * kind of fault that turns into a number that is quietly too low.
 */
export function composeProtocolMessage(parsed: ProtocolMessage): string {
  const composeSide = (side: MessageSide | null): string => {
    if (side === null) return NO_COMBATANT;
    const id = composeIntegerText(side.combatantId);
    if (side.healthPercent === null) return id;
    // Two places, the same two `SIDE_PATTERN` insists on when reading. A value
    // that will not write back at that width never parsed in the first place,
    // which is why this asserts rather than returning something.
    return `${id}=${composeDecimalText(side.healthPercent, 2)}`;
  };

  return [
    composeSide(parsed.actor),
    composeSide(parsed.target),
    ...parsed.parameters.map(({ key, value }) => (value === null ? key : `${key}=${value}`)),
  ].join(SEGMENT_SEPARATOR);
}
