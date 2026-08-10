/**
 * Base for every error this add-on throws.
 *
 * The add-on runs inside someone else's page, next to the game and possibly
 * next to other add-ons, and writes into the same console. An error that does
 * not say whose it is costs the person reporting it and costs us reading the
 * report, so the brand goes in `name` where the console shows it first.
 *
 * Abstract on purpose: every kind of failure gets its own named subclass, so a
 * caller can tell them apart without matching on message text.
 */

/** Every failure the add-on can raise. One entry per subclass. */
export type MargoMeterErrorCode = "ProtocolMessageFormat" | "EngineBattleWrap";

export abstract class MargoMeterError extends Error {
  readonly code: MargoMeterErrorCode;

  protected constructor(code: MargoMeterErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.code = code;
    this.name = `MargoMeter/${code}`;
  }
}
