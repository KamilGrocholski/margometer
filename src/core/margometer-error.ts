/**
 * The brand every failure that ships to the browser wears: this add-on shares a console with
 * the game and with other add-ons, and `name` is what a console prints first.
 */

export type MargoMeterErrorCode = "ProtocolMessageFormat";

export class MargoMeterError extends Error {
    readonly code: MargoMeterErrorCode;

    constructor(code: MargoMeterErrorCode, reason: string, options?: ErrorOptions) {
        super(reason, options);
        this.code = code;
        this.name = `MargoMeter/${code}`;
    }
}
