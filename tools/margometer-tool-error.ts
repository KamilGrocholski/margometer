/**
 * Base for every error the development tooling throws.
 *
 * Deliberately a separate hierarchy from the add-on's `MargoMeterError`. These
 * are two different worlds — one runs inside the game's page, the other in a
 * terminal — and nothing should catch one believing it caught the other.
 *
 * Throwing is the right behaviour here: a tool handed bad material must refuse
 * it loudly rather than read half of it and carry on.
 */

/** Every failure the tooling can raise. One entry per subclass. */
export type MargoMeterToolErrorCode =
  | "FightDumpFormat"
  | "Bundle"
  | "GameSource"
  | "HelpArticle"
  | "ProtocolKeyTable"
  | "ProtocolKeyRegister"
  | "CapturedFightIntake"
  | "Changelog";

export abstract class MargoMeterToolError extends Error {
  readonly code: MargoMeterToolErrorCode;

  protected constructor(code: MargoMeterToolErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.code = code;
    this.name = `MargoMeterTool/${code}`;
  }
}
