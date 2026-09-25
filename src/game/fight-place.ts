/**
 * Where a fight was fought, as the client states it: the map's name and the reader's square on it.
 * The three fail apart, as they do when they are read off the client.
 */

export interface FightPlace {
    mapName: string | null;
    x: number | null;
    y: number | null;
}
