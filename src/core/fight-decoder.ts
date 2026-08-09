import type { BattleEvent } from "@/src/core/battle-event.ts";
import { parseProtocolMessage, type ProtocolMessage } from "@/src/core/protocol-message.ts";

/**
 * Turns the protocol of one fight into events.
 *
 * Two rules hold for every message, and everything else is detail:
 *
 *   1. No message is dropped. A message the decoder cannot read still produces
 *      an event, and that event says so. A number that is quietly too low looks
 *      exactly like a number that is right.
 *   2. Nothing is invented. A key with no meaning yet is reported as unread,
 *      never guessed at from a neighbouring key.
 */

/** Names arrive as one string. The game has no escaping for a name containing this. */
const NAME_SEPARATOR = ", ";

const OUTCOME_KEYS: Record<string, "won" | "lost"> = {
  winner: "won",
  loser: "lost",
};

function decodeMessage(message: string): BattleEvent[] {
  let parsed: ProtocolMessage;
  try {
    parsed = parseProtocolMessage(message);
  } catch (error) {
    return [{ kind: "unknown-message", message, reason: (error as Error).message }];
  }

  const events: BattleEvent[] = [];
  const unreadKeys: string[] = [];

  for (const { key, value } of parsed.parameters) {
    const result = OUTCOME_KEYS[key];
    if (result !== undefined && value !== null) {
      events.push({ kind: "fight-outcome", result, combatantNames: value.split(NAME_SEPARATOR) });
      continue;
    }
    unreadKeys.push(key);
  }

  // Reported even when the message also produced something readable: a message
  // half understood is not the same as a message understood.
  if (unreadKeys.length > 0) {
    events.push({
      kind: "unknown-message",
      message,
      reason: `no meaning yet for ${unreadKeys.join(", ")}`,
    });
  }

  return events;
}

export function decodeFight(messages: readonly string[]): BattleEvent[] {
  return messages.flatMap(decodeMessage);
}
