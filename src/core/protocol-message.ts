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

import { MargoMeterError } from "@/src/core/margometer-error.ts";

export class ProtocolMessageFormatError extends MargoMeterError {
  constructor(reason: string, message: string) {
    super("ProtocolMessageFormat", `${reason}: ${JSON.stringify(message)}`);
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

  const [, id, percent] = match;
  return {
    combatantId: Number.parseInt(id!, 10),
    healthPercent: percent === undefined ? null : Number.parseFloat(percent),
  };
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

  return {
    actor: parseMessageSide(segments[0]!, message),
    target: parseMessageSide(segments[1]!, message),
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
    if (side.healthPercent === null) return String(side.combatantId);
    return `${side.combatantId}=${side.healthPercent.toFixed(2)}`;
  };

  return [
    composeSide(parsed.actor),
    composeSide(parsed.target),
    ...parsed.parameters.map(({ key, value }) => (value === null ? key : `${key}=${value}`)),
  ].join(SEGMENT_SEPARATOR);
}
