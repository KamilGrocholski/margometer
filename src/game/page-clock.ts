/** The page's clock, which owns every moment the runtime states (`docs/design.md` §5). */

export interface Clock {
    readNowMilliseconds(): number;
}

export function initPageClock(): Clock {
    return { readNowMilliseconds: () => Date.now() };
}
