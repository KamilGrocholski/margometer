/**
 * The game client's own JavaScript, fetched and dated.
 *
 *     deno task client status | fetch [production|development]
 *
 * Two rules shape it: production decides and development is only for reading, and what is
 * fetched never leaves `.cache/` — the client is somebody else's work, read locally to
 * understand a protocol we already receive (NOTICE.md, SECURITY.md).
 */

import { assert } from "@std/assert";
import { composeJsonWriting, getJsonReading } from "@/libs/json-text.ts";
import { isRecord } from "@/libs/unknown-reading.ts";
import {
    getGameBuildFromScriptName,
    getGameBundleNameFromScriptName,
} from "@/src/core/game-build.ts";
import { GameSourceError } from "@/tools/margometer-tool-error.ts";

export type GameChannel = "production" | "development";

/**
 * Production is any world; they all serve the same build. `tempest` is the one the recordings in
 * `captures/` came from, so a claim read here stays comparable with the material.
 */
const CHANNEL_HOSTS: Record<GameChannel, string> = {
    production: "https://tempest.margonem.pl",
    development: "https://experimental.margonem.pl",
};

/**
 * Exported so a test can ask **git** whether this path is ignored. The whole of the promise that
 * no bundle enters the repository is this spelling agreeing with a line in `.gitignore`.
 */
export const CACHE_ROOT = ".cache/game-client/";

const MANIFEST_NAME = "provenance.json";
const BUNDLE_NAME = "main.js";
const INDENT_SPACES = 2;

export interface CachedClientSource {
    channel: GameChannel;
    build: string;
    host: string;
    fetchedAt: string;
    bundlePath: string;
}

/**
 * `Object.hasOwn` rather than `in`, which walks the prototype chain: `in` accepted `toString`,
 * and `fetch toString` then reached a host that was a function.
 */
export function getChannelFromArgument(value: string): GameChannel {
    if (!Object.hasOwn(CHANNEL_HOSTS, value)) {
        throw new GameSourceError(`unknown channel "${value}"`);
    }
    assert(value === "production" || value === "development", "a channel is one of the two");
    assert(CHANNEL_HOSTS[value].length > 0, "and the one it is has a host");
    return value;
}

/**
 * The id off the script filename, which is the one the add-on stamps onto a recording. The
 * inline `__build` a world states beside it names what every world has in common and not this
 * bundle, so the two stopped being one number on 2026-08-25.
 */
export function getBuildFromPage(html: string): string {
    const build = getGameBuildFromScriptName(html);
    if (build === null) {
        throw new GameSourceError("no build id on the page — the client's layout changed");
    }
    assert(build.length > 0, "a build id that was read says something");
    assert(!build.includes("/"), "and is an id rather than a path");
    return build;
}

/** The URL the bundle is served under, read off the page rather than composed from the id. */
export function getBundleUrlFromPage(html: string, host: string): string {
    const name = getGameBundleNameFromScriptName(html);
    if (name === null) {
        throw new GameSourceError(
            `no client bundle named on ${host} — the client's layout changed`,
        );
    }
    assert(name.length > 0, "a bundle name that was read says something");
    assert(host.startsWith("https://"), "a bundle is asked for over the protocol the world serves");
    return `${host}/js/${name}`;
}

function getCacheDirectory(channel: GameChannel): string {
    assert(CACHE_ROOT.endsWith("/"), "a root a name is joined to ends in a separator");
    assert(channel.length > 0, "a channel names its own directory");
    return `${CACHE_ROOT}${channel}/`;
}

function getManifestPath(channel: GameChannel): string {
    const path = `${getCacheDirectory(channel)}${MANIFEST_NAME}`;
    assert(path.endsWith(MANIFEST_NAME), "a manifest is named what a manifest is named");
    assert(path.startsWith(CACHE_ROOT), "and sits under the cache nothing leaves");
    return path;
}

function requireClientSourceField(value: unknown, field: string, channel: GameChannel): string {
    if (typeof value !== "string" || value === "") {
        throw new GameSourceError(`cache manifest for ${channel}: ${field} is not stated`);
    }
    assert(value.length > 0, "a field that was read says something");
    assert(field.length > 0, "and was asked for by name");
    return value;
}

/**
 * The manifest decides whether the cache is stale, so a field it does not carry stops here. Cast
 * instead and a truncated file passes as provenance, with `build` arriving as `undefined` at the
 * comparison that exists to catch exactly that.
 */
export function requireCachedClientSource(
    value: unknown,
    channel: GameChannel,
): CachedClientSource {
    if (!isRecord(value)) {
        throw new GameSourceError(`cache manifest for ${channel} is not an object`);
    }
    const stated = requireClientSourceField(value["channel"], "channel", channel);
    if (stated !== channel) {
        throw new GameSourceError(`cache manifest for ${channel} says it holds ${stated}`);
    }
    assert(stated === channel, "a manifest names the channel it was asked for");
    const read: CachedClientSource = {
        channel,
        build: requireClientSourceField(value["build"], "build", channel),
        host: requireClientSourceField(value["host"], "host", channel),
        fetchedAt: requireClientSourceField(value["fetchedAt"], "fetchedAt", channel),
        bundlePath: requireClientSourceField(value["bundlePath"], "bundlePath", channel),
    };
    assert(read.build.length > 0, "a reading that was admitted knows its own build");
    return read;
}

/** What is cached right now, or null. Absence is an answer; an unreadable manifest is not. */
export function getCachedClientSource(channel: GameChannel): CachedClientSource | null {
    const manifest = getManifestPath(channel);
    let text = "";
    try {
        text = Deno.readTextFileSync(manifest);
    } catch {
        // A cache nobody has filled is a cache nobody has filled: the caller decides what to do.
        return null;
    }
    const reading = getJsonReading(text);
    if (!reading.isOk) {
        throw new GameSourceError(`cache manifest for ${channel} is unreadable`, {
            cause: reading.cause,
        });
    }
    assert(text.length > 0, "a manifest that was read says something");
    return requireCachedClientSource(reading.value, channel);
}

/** The cached bundle, refusing rather than pretending when there is none. */
export function getCachedBundle(channel: GameChannel): string {
    const cached = getCachedClientSource(channel);
    if (cached === null) {
        throw new GameSourceError(
            `nothing cached for ${channel} — run \`deno task client fetch ${channel}\``,
        );
    }
    const bundle = Deno.readTextFileSync(cached.bundlePath);
    assert(bundle.length > 0, "a bundle that was cached says something");
    assert(cached.build.length > 0, "and is dated by the build it was served as");
    return bundle;
}

async function getPageOfWorld(channel: GameChannel): Promise<string> {
    const host = CHANNEL_HOSTS[channel];
    const response = await fetch(host);
    if (!response.ok) {
        throw new GameSourceError(`${host} answered ${response.status}`);
    }
    const html = await response.text();
    assert(html.length > 0, "a world that answered said something");
    assert(host.length > 0, "and was asked for by name");
    return html;
}

async function writeClientSourceCache(channel: GameChannel): Promise<CachedClientSource> {
    const host = CHANNEL_HOSTS[channel];
    // One request for the page, read twice: the id the cache is dated by and the name the bundle
    // is served under come from the same markup, so they cannot be a build and a file that do not
    // belong together.
    const page = await getPageOfWorld(channel);
    const build = getBuildFromPage(page);
    const bundleUrl = getBundleUrlFromPage(page, host);

    const response = await fetch(bundleUrl);
    if (!response.ok) {
        throw new GameSourceError(`${bundleUrl} answered ${response.status}`);
    }
    const directory = getCacheDirectory(channel);
    Deno.mkdirSync(directory, { recursive: true });
    const bundlePath = `${directory}${BUNDLE_NAME}`;
    Deno.writeTextFileSync(bundlePath, await response.text());

    const cached: CachedClientSource = {
        channel,
        build,
        host,
        fetchedAt: new Date().toISOString(),
        bundlePath,
    };
    const writing = composeJsonWriting(cached, INDENT_SPACES);
    if (!writing.isOk) {
        throw new GameSourceError(`provenance for ${channel} cannot be written`, {
            cause: writing.cause,
        });
    }
    Deno.writeTextFileSync(getManifestPath(channel), `${writing.text}\n`);
    assert(cached.build.length > 0, "what was cached is dated by a build");
    return cached;
}

async function writeClientStatusReport(): Promise<void> {
    const channels: GameChannel[] = ["production", "development"];
    for (const channel of channels) {
        const cached = getCachedClientSource(channel);
        const served = getBuildFromPage(await getPageOfWorld(channel));
        const state = cached === null
            ? "nothing cached"
            : cached.build === served
            ? "current"
            : "STALE";
        console.log(
            `${channel.padEnd(12)} served ${served}  cached ${cached?.build ?? "-"}  ${state}`,
        );
    }
    assert(channels.length === 2, "both channels were reported on");
    assert(channels[0] === "production", "and production is the one that decides");
}

if (import.meta.main) {
    const [command, channel] = Deno.args;
    if (command === "status") {
        await writeClientStatusReport();
    } else if (command === "fetch") {
        const cached = await writeClientSourceCache(
            getChannelFromArgument(channel ?? "production"),
        );
        console.log(`cached ${cached.channel} build ${cached.build} → ${cached.bundlePath}`);
    } else {
        console.log("usage: deno task client status | fetch [production|development]");
    }
}
