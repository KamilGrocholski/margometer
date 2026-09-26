/**
 * The game client's own JavaScript, fetched and dated. Production decides and development is only
 * for reading, and what is fetched never leaves `.cache/`: the client is somebody else's work, read
 * locally to understand a protocol the add-on already receives (`NOTICE.md`, `SECURITY.md`).
 *
 *     deno task game:client status | fetch [production|development]
 */

import { assert, assertStrictEquals } from "@std/assert";
import { encodeJson, parseJson } from "#/libs/json-text.ts";
import * as errors from "#/libs/errors.ts";
import { isOneOf, type VocabularyWord } from "#/libs/vocabulary.ts";
import { isRecord } from "#/libs/unknown-value.ts";
import { parseGameBuild, parseGameBundleName } from "#/src/game/game-build.ts";
import { GameSourceError, GameUnreachableError } from "./margometer-tool-error.ts";

export const GAME_CHANNEL = { production: "production", development: "development" } as const;
export type GameChannel = VocabularyWord<typeof GAME_CHANNEL>;

export interface CachedClientSource {
    channel: GameChannel;
    build: string;
    host: string;
    fetchedAt: string;
    bundlePath: string;
}

const GAME_CHANNELS = Object.values(GAME_CHANNEL);
/**
 * Production is any world; they all serve the same build. `tempest` is the one most recordings in
 * `captures/` came from, so a claim read here stays comparable with the material.
 */
const CHANNEL_HOSTS: Readonly<Record<GameChannel, string>> = {
    [GAME_CHANNEL.production]: "https://tempest.margonem.pl",
    [GAME_CHANNEL.development]: "https://experimental.margonem.pl",
};
/** Exported so a test asks git whether it is ignored: that line is the promise no bundle enters. */
export const CACHE_ROOT = ".cache/game-client/";
const MANIFEST_NAME = "provenance.json";
const BUNDLE_NAME = "main.js";
const INDENT_SPACES = 2;
const MANIFEST_FIELDS = ["build", "host", "fetchedAt", "bundlePath"] as const;

/** A channel named at a terminal, or a refusal naming it. */
export function requireGameChannel(value: string): GameChannel {
    if (!isOneOf(GAME_CHANNELS, value)) throw new GameSourceError(`unknown channel "${value}"`);
    return value;
}

/**
 * The id off the script filename, which is the one the add-on stamps onto a recording. The inline
 * `__build` a world states beside it names what every world shares, not this bundle (2026-08-25).
 */
export function requirePageBuild(html: string): string {
    const build = parseGameBuild(html);
    if (build === null) throw new GameSourceError("no build id on the page — the layout changed");
    assert(!build.includes("/"), "a build is an id rather than a path");
    return build;
}

/** The address the bundle is served under, read off the page rather than composed from the id. */
export function requirePageBundleAddress(html: string, host: string): string {
    assert(host.startsWith("https://"), "a bundle is asked for over the protocol the world serves");
    const name = parseGameBundleName(html);
    if (name === null) {
        throw new GameSourceError(`no client bundle named on ${host} — the layout changed`);
    }
    return `${host}/js/${name}`;
}

/** What is cached right now, or null. Absence is an answer; an unreadable manifest is not. */
export function readCachedClientSource(channel: GameChannel): CachedClientSource | null {
    const text = errors.attempt(() => Deno.readTextFileSync(composeManifestPath(channel)));
    if (text instanceof Error) return null;
    const parsed = parseJson(text);
    if (parsed instanceof Error) {
        throw new GameSourceError(`cache manifest for ${channel} is unreadable`, {
            cause: parsed,
        });
    }
    return requireCachedClientSource(parsed, channel);
}

function composeManifestPath(channel: GameChannel): string {
    const path = `${CACHE_ROOT}${channel}/${MANIFEST_NAME}`;
    assert(path.startsWith(CACHE_ROOT), "a manifest sits under the cache nothing leaves");
    return path;
}

/**
 * The manifest decides whether the cache is stale, so a field it does not carry stops here rather
 * than reaching the comparison as `undefined` (C13).
 */
export function requireCachedClientSource(
    value: unknown,
    channel: GameChannel,
): CachedClientSource {
    if (!isRecord(value)) throw new GameSourceError(`cache manifest for ${channel} is no object`);
    if (value.channel !== channel) {
        throw new GameSourceError(`cache manifest for ${channel} says it holds ${value.channel}`);
    }
    const stated: Record<string, string> = {};
    for (const field of MANIFEST_FIELDS) {
        const held = value[field];
        if (typeof held !== "string") {
            throw new GameSourceError(`cache manifest for ${channel}: ${field} is not stated`);
        }
        if (held.length === 0) {
            throw new GameSourceError(`cache manifest for ${channel}: ${field} is empty`);
        }
        stated[field] = held;
    }
    const read = {
        channel,
        build: stated.build ?? "",
        host: stated.host ?? "",
        fetchedAt: stated.fetchedAt ?? "",
        bundlePath: stated.bundlePath ?? "",
    };
    assert(read.build.length > 0, "a reading that was admitted knows its own build");
    return read;
}

/** The cached bundle, refusing rather than pretending when there is none. */
export function readCachedBundle(channel: GameChannel): string {
    const cached = readCachedClientSource(channel);
    if (cached === null) {
        throw new GameSourceError(
            `nothing cached for ${channel} — run \`deno task game:client fetch ${channel}\``,
        );
    }
    const bundle = Deno.readTextFileSync(cached.bundlePath);
    assert(bundle.length > 0, "a bundle that was cached says something");
    return bundle;
}

/** The page and the bundle it names, from one request so the id and the file belong together. */
export async function writeClientSourceCache(channel: GameChannel): Promise<CachedClientSource> {
    const host = CHANNEL_HOSTS[channel];
    const page = await readWorldPage(channel);
    const build = requirePageBuild(page);
    const bundle = await (await readAnsweredResponse(requirePageBundleAddress(page, host))).text();
    const directory = `${CACHE_ROOT}${channel}/`;
    Deno.mkdirSync(directory, { recursive: true });
    const bundlePath = `${directory}${BUNDLE_NAME}`;
    Deno.writeTextFileSync(bundlePath, bundle);
    const fetchedAt = new Date().toISOString();
    const cached: CachedClientSource = { channel, build, host, fetchedAt, bundlePath };
    const text = encodeJson(cached, INDENT_SPACES);
    if (text instanceof Error) {
        throw new GameSourceError(`provenance for ${channel} cannot be written`, {
            cause: text,
        });
    }
    Deno.writeTextFileSync(composeManifestPath(channel), `${text}\n`);
    return cached;
}

async function readWorldPage(channel: GameChannel): Promise<string> {
    const html = await (await readAnsweredResponse(CHANNEL_HOSTS[channel])).text();
    assert(html.length > 0, "a world that answered said something");
    return html;
}

/**
 * A request and its answer. The network is one of the two boundaries a tool has (E5): a world that
 * is down throws the runtime's own `TypeError`, and a caller that cannot tell that from a page it
 * read would call a reading stale on the strength of somebody else's outage.
 */
async function readAnsweredResponse(address: string): Promise<Response> {
    assert(address.startsWith("https://"), "a world is asked over the protocol it serves");
    let response: Response;
    try {
        response = await fetch(address);
    } catch (failure) {
        throw new GameUnreachableError(`${address} did not answer`, { cause: failure });
    }
    if (!response.ok) throw new GameUnreachableError(`${address} answered ${response.status}`);
    return response;
}

/** The build a world is serving right now. */
export async function readServedBuild(channel: GameChannel): Promise<string> {
    return requirePageBuild(await readWorldPage(channel));
}

async function writeClientStatusReport(): Promise<void> {
    for (const channel of GAME_CHANNELS) {
        const cached = readCachedClientSource(channel);
        const served = await readServedBuild(channel);
        const state = cached === null
            ? "nothing cached"
            : cached.build === served
            ? "current"
            : "STALE";
        console.log(
            `${channel.padEnd(12)} served ${served}  cached ${cached?.build ?? "-"}  ${state}`,
        );
    }
    assertStrictEquals(GAME_CHANNELS[0], GAME_CHANNEL.production, "production is reported first");
}

if (import.meta.main) {
    const [command, channel] = Deno.args;
    if (command === "status") {
        await writeClientStatusReport();
    } else if (command === "fetch") {
        const cached = await writeClientSourceCache(requireGameChannel(channel ?? "production"));
        console.log(`cached ${cached.channel} build ${cached.build} → ${cached.bundlePath}`);
    } else {
        throw new GameSourceError("usage: deno task game:client status | fetch [channel]");
    }
}
