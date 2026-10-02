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
import {
    parseMargonemClientBuildId,
    parseMargonemClientBundleName,
} from "#/src/game/margonem-client-build.ts";
import { MargonemClientSourceError, MargonemUnreachableError } from "./margometer-tool-error.ts";

export const MARGONEM_CHANNEL = { production: "production", development: "development" } as const;
export type MargonemChannel = VocabularyWord<typeof MARGONEM_CHANNEL>;

export interface CachedMargonemClientSource {
    channel: MargonemChannel;
    build: string;
    host: string;
    fetchedAt: string;
    bundlePath: string;
}

const MARGONEM_CHANNELS = Object.values(MARGONEM_CHANNEL);
/**
 * Production is any world; they all serve the same build. `tempest` is the one most recordings in
 * `captures/` came from, so a claim read here stays comparable with the material.
 */
const CHANNEL_HOSTS: Readonly<Record<MargonemChannel, string>> = {
    [MARGONEM_CHANNEL.production]: "https://tempest.margonem.pl",
    [MARGONEM_CHANNEL.development]: "https://experimental.margonem.pl",
};
/** Exported so a test asks git whether it is ignored: that line is the promise no bundle enters. */
export const CACHE_ROOT = ".cache/game-client/";
const MANIFEST_NAME = "provenance.json";
const BUNDLE_NAME = "main.js";
const INDENT_SPACES = 2;
const MANIFEST_FIELDS = ["build", "host", "fetchedAt", "bundlePath"] as const;

/** A channel named at a terminal, or a refusal naming it. */
export function requireMargonemChannel(value: string): MargonemChannel {
    if (!isOneOf(MARGONEM_CHANNELS, value)) {
        throw new MargonemClientSourceError(`unknown channel "${value}"`);
    }
    return value;
}

/**
 * The id off the script filename, which is the one the add-on stamps onto a recording. The inline
 * `__build` a world states beside it names what every world shares, not this bundle (2026-08-25).
 */
export function requireMargonemWorldPageBuild(html: string): string {
    const build = parseMargonemClientBuildId(html);
    if (build === null) {
        throw new MargonemClientSourceError("no build id on the page — the layout changed");
    }
    assert(!build.includes("/"), "a build is an id rather than a path");
    return build;
}

/** The address the bundle is served under, read off the page rather than composed from the id. */
export function requireMargonemWorldPageBundleAddress(html: string, host: string): string {
    assert(host.startsWith("https://"), "a bundle is asked for over the protocol the world serves");
    const name = parseMargonemClientBundleName(html);
    if (name === null) {
        throw new MargonemClientSourceError(
            `no client bundle named on ${host} — the layout changed`,
        );
    }
    return `${host}/js/${name}`;
}

/** What is cached right now, or null. Absence is an answer; an unreadable manifest is not. */
export function readCachedMargonemClientSource(
    channel: MargonemChannel,
): CachedMargonemClientSource | null {
    const text = errors.attempt(() => Deno.readTextFileSync(composeManifestPath(channel)));
    if (text instanceof Error) return null;
    const parsed = parseJson(text);
    if (parsed instanceof Error) {
        throw new MargonemClientSourceError(`cache manifest for ${channel} is unreadable`, {
            cause: parsed,
        });
    }
    return requireCachedMargonemClientSource(parsed, channel);
}

function composeManifestPath(channel: MargonemChannel): string {
    const path = `${CACHE_ROOT}${channel}/${MANIFEST_NAME}`;
    assert(path.startsWith(CACHE_ROOT), "a manifest sits under the cache nothing leaves");
    return path;
}

/** The build a frozen table would be lifted from, refusing rather than reading an empty cache. */
export function requireCachedBuild(): string {
    const cached = readCachedMargonemClientSource(MARGONEM_CHANNEL.production);
    if (cached === null) {
        throw new MargonemClientSourceError(
            "nothing cached for production — run `deno task game:client fetch production`",
        );
    }
    assertStrictEquals(
        cached.channel,
        MARGONEM_CHANNEL.production,
        "the channel the table stands on",
    );
    return cached.build;
}

/**
 * The manifest decides whether the cache is stale, so a field it does not carry stops here rather
 * than reaching the comparison as `undefined` (C13).
 */
export function requireCachedMargonemClientSource(
    value: unknown,
    channel: MargonemChannel,
): CachedMargonemClientSource {
    if (!isRecord(value)) {
        throw new MargonemClientSourceError(`cache manifest for ${channel} is no object`);
    }
    if (value.channel !== channel) {
        throw new MargonemClientSourceError(
            `cache manifest for ${channel} says it holds ${value.channel}`,
        );
    }
    const stated: Record<string, string> = {};
    for (const field of MANIFEST_FIELDS) {
        const held = value[field];
        if (typeof held !== "string") {
            throw new MargonemClientSourceError(
                `cache manifest for ${channel}: ${field} is not stated`,
            );
        }
        if (held.length === 0) {
            throw new MargonemClientSourceError(`cache manifest for ${channel}: ${field} is empty`);
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
export function readCachedBundle(channel: MargonemChannel): string {
    const cached = readCachedMargonemClientSource(channel);
    if (cached === null) {
        throw new MargonemClientSourceError(
            `nothing cached for ${channel} — run \`deno task game:client fetch ${channel}\``,
        );
    }
    const bundle = Deno.readTextFileSync(cached.bundlePath);
    assert(bundle.length > 0, "a bundle that was cached says something");
    return bundle;
}

/** The page and the bundle it names, from one request so the id and the file belong together. */
export async function writeMargonemClientSourceCache(
    channel: MargonemChannel,
): Promise<CachedMargonemClientSource> {
    const host = CHANNEL_HOSTS[channel];
    const page = await readMargonemWorldPage(channel);
    const build = requireMargonemWorldPageBuild(page);
    const bundle =
        await (await readAnsweredResponse(requireMargonemWorldPageBundleAddress(page, host)))
            .text();
    const directory = `${CACHE_ROOT}${channel}/`;
    Deno.mkdirSync(directory, { recursive: true });
    const bundlePath = `${directory}${BUNDLE_NAME}`;
    Deno.writeTextFileSync(bundlePath, bundle);
    const fetchedAt = new Date().toISOString();
    const cached: CachedMargonemClientSource = { channel, build, host, fetchedAt, bundlePath };
    const text = encodeJson(cached, INDENT_SPACES);
    if (text instanceof Error) {
        throw new MargonemClientSourceError(`provenance for ${channel} cannot be written`, {
            cause: text,
        });
    }
    Deno.writeTextFileSync(composeManifestPath(channel), `${text}\n`);
    return cached;
}

async function readMargonemWorldPage(channel: MargonemChannel): Promise<string> {
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
        throw new MargonemUnreachableError(`${address} did not answer`, { cause: failure });
    }
    if (!response.ok) throw new MargonemUnreachableError(`${address} answered ${response.status}`);
    return response;
}

/** The build a world is serving right now. */
export async function readServedBuild(channel: MargonemChannel): Promise<string> {
    return requireMargonemWorldPageBuild(await readMargonemWorldPage(channel));
}

async function writeMargonemClientStatusReport(): Promise<void> {
    for (const channel of MARGONEM_CHANNELS) {
        const cached = readCachedMargonemClientSource(channel);
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
    assertStrictEquals(
        MARGONEM_CHANNELS[0],
        MARGONEM_CHANNEL.production,
        "production is reported first",
    );
}

if (import.meta.main) {
    const [command, channel] = Deno.args;
    if (command === "status") {
        await writeMargonemClientStatusReport();
    } else if (command === "fetch") {
        const cached = await writeMargonemClientSourceCache(
            requireMargonemChannel(channel ?? "production"),
        );
        console.log(`cached ${cached.channel} build ${cached.build} → ${cached.bundlePath}`);
    } else {
        throw new MargonemClientSourceError(
            "usage: deno task game:client status | fetch [channel]",
        );
    }
}
