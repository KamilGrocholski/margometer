/**
 * The brand every failure that ships to the browser wears — this add-on shares a console with the
 * game — and abstract, so "no base is ever thrown" is held by the compiler. **ADR 0009.**
 */

export type MargoMeterErrorCode = "ProtocolMessageFormat";

export abstract class MargoMeterError extends Error {
    readonly code: MargoMeterErrorCode;

    protected constructor(code: MargoMeterErrorCode, reason: string, options?: ErrorOptions) {
        super(reason, options);
        this.code = code;
        this.name = `MargoMeter/${code}`;
    }
}
