/**
 * Fetches and caches the game client's own JavaScript.
 *
 * Some questions can only be answered by reading the client: what a protocol
 * key means, and which keys exist at all. AGENTS.md §7.6 has the procedure; the
 * two rules that shape this file are:
 *
 *   - production decides, development is for reading. The development build
 *     keeps module paths and class names, which is the only reason a human can
 *     work with it, but it lags production rather than leading it.
 *   - what is fetched never leaves `.cache/`. The client is someone else's
 *     copyrighted work; we read it locally to understand a protocol we already
 *     receive, and we never republish it.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { composeJsonText, getValueFromJsonText } from "@/libs/json.ts";
import { getRecordFromValue } from "@/libs/record.ts";
import {
  getGameBuildFromInlineObject,
  getGameBuildFromScriptName,
} from "@/src/core/game-build.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";

export class GameSourceError extends MargoMeterToolError {
  constructor(reason: string, options?: ErrorOptions) {
    super("GameSource", reason, options);
  }
}

export type GameChannel = "production" | "development";

/**
 * Production is any world; they all serve the same build. `tempest` is the one
 * the captured fights came from, so claims stay comparable with the material.
 */
const CHANNEL_HOSTS: Record<GameChannel, string> = {
  production: "https://tempest.margonem.pl",
  development: "https://experimental.margonem.pl",
};

/**
 * Exported so a test can ask **git** whether this path is ignored.
 *
 * §7.6 keeps fetched client sources out of the repository by copyright
 * requirement, and the whole of that promise was this path agreeing with a line
 * in `.gitignore` — two spellings, in two files, with nothing between them. A
 * root moved out from under the ignore rule would put somebody else's minified
 * bundle in `git status` looking like work
 * (`docs/specs/2026-08-18-a-name-we-did-not-choose.md`).
 */
export const CACHE_ROOT = new URL("../.cache/game-client/", import.meta.url).pathname;

export type CachedClientSource = {
  channel: GameChannel;
  build: string;
  host: string;
  fetchedAt: string;
  /** Absolute path of the cached bundle. */
  bundlePath: string;
};

/**
 * The build id appears twice on a world page — in the script filenames and in
 * an inline `build = { version: … }`. Reading it costs one small request rather
 * than the megabytes the bundle itself weighs.
 */
export function getBuildFromPage(html: string): string {
  // Both readers live in `src/core/game-build.ts`, because the add-on stamps the
  // same number onto a recording and the two only compare if they are read the
  // same way (F18). The inline object first: a page can carry a stale script tag.
  const build = getGameBuildFromInlineObject(html) ?? getGameBuildFromScriptName(html);
  if (build === null) {
    throw new GameSourceError("no build id on the page — the client's layout changed");
  }
  return build;
}

/**
 * The channel named on the command line, or a refusal.
 *
 * `Object.hasOwn` rather than `in`, which walks the prototype chain: `in`
 * accepted `toString`, `constructor` and the rest of `Object.prototype`, so
 * `fetch toString` got past the check and reached a host that was a function.
 * §7.6 keeps the two channels apart on purpose, and a check that admits a third
 * thing is not keeping them apart.
 */
export function getChannelFromArgument(value: string): GameChannel {
  if (!Object.hasOwn(CHANNEL_HOSTS, value)) {
    throw new GameSourceError(`unknown channel "${value}"`);
  }
  return value as GameChannel;
}

async function getServedBuild(channel: GameChannel): Promise<string> {
  const host = CHANNEL_HOSTS[channel];
  const response = await fetch(host);
  if (!response.ok) {
    throw new GameSourceError(`${host} answered ${response.status}`);
  }
  return getBuildFromPage(await response.text());
}

function getCacheDirectory(channel: GameChannel): string {
  return `${CACHE_ROOT}${channel}/`;
}

function getManifestPath(channel: GameChannel): string {
  return `${getCacheDirectory(channel)}provenance.json`;
}

function requireStringField(value: unknown, field: string, channel: GameChannel): string {
  if (typeof value !== "string" || value === "") {
    throw new GameSourceError(`cache manifest for ${channel}: ${field} is not a non-empty string`);
  }
  return value;
}

/**
 * The manifest decides whether the cache is stale, so a field it does not carry
 * has to stop here. Cast to the type instead, and a truncated file passes as
 * provenance, with `build` arriving as `undefined` at the comparison that is
 * supposed to catch exactly that.
 */
function requireCachedClientSource(value: unknown, channel: GameChannel): CachedClientSource {
  const record = getRecordFromValue(value);
  if (record === null) {
    throw new GameSourceError(`cache manifest for ${channel} is not an object`);
  }

  const stated = requireStringField(record["channel"], "channel", channel);
  if (stated !== channel) {
    throw new GameSourceError(`cache manifest for ${channel} says it holds ${stated}`);
  }

  return {
    channel,
    build: requireStringField(record["build"], "build", channel),
    host: requireStringField(record["host"], "host", channel),
    fetchedAt: requireStringField(record["fetchedAt"], "fetchedAt", channel),
    bundlePath: requireStringField(record["bundlePath"], "bundlePath", channel),
  };
}

/**
 * What is cached right now, or null. Carries its own provenance, because a
 * directory that does not say what it holds is a directory nobody can trust.
 */
export function getCachedClientSource(channel: GameChannel): CachedClientSource | null {
  const manifest = getManifestPath(channel);
  if (!existsSync(manifest)) return null;

  const { value, syntaxError } = getValueFromJsonText(readFileSync(manifest, "utf8"));
  if (syntaxError !== null) {
    throw new GameSourceError(`cache manifest for ${channel} is unreadable`, {
      cause: syntaxError,
    });
  }
  // Checked after, not inside a `try`: a manifest that parsed fine and said the
  // wrong thing is not a manifest that could not be read.
  return requireCachedClientSource(value, channel);
}

async function writeClientSourceCache(channel: GameChannel): Promise<CachedClientSource> {
  const host = CHANNEL_HOSTS[channel];
  const build = await getServedBuild(channel);

  const bundleUrl = `${host}/js/main.min${build}.js`;
  const response = await fetch(bundleUrl);
  if (!response.ok) {
    throw new GameSourceError(`${bundleUrl} answered ${response.status}`);
  }

  const directory = getCacheDirectory(channel);
  mkdirSync(directory, { recursive: true });

  const bundlePath = `${directory}main.js`;
  writeFileSync(bundlePath, await response.text());

  const cached: CachedClientSource = {
    channel,
    build,
    host,
    fetchedAt: new Date().toISOString(),
    bundlePath,
  };
  writeFileSync(getManifestPath(channel), `${composeJsonText(cached, 2)}\n`);
  return cached;
}

/** Reads a cached bundle, refusing rather than pretending when it is absent. */
export function getCachedBundle(channel: GameChannel): string {
  const cached = getCachedClientSource(channel);
  if (cached === null) {
    throw new GameSourceError(`nothing cached for ${channel} — fetch it first`);
  }
  return readFileSync(cached.bundlePath, "utf8");
}

async function writeStatusReport(): Promise<void> {
  for (const channel of Object.keys(CHANNEL_HOSTS) as GameChannel[]) {
    const cached = getCachedClientSource(channel);
    const served = await getServedBuild(channel);
    const state =
      cached === null ? "nothing cached" : cached.build === served ? "current" : "STALE";
    console.log(
      `${channel.padEnd(12)} served ${served}  cached ${cached?.build ?? "-"}  ${state}`,
    );
  }
}

if (import.meta.main) {
  const [command, channel] = process.argv.slice(2);
  if (command === "status") {
    await writeStatusReport();
  } else if (command === "fetch") {
    const cached = await writeClientSourceCache(getChannelFromArgument(channel ?? "production"));
    console.log(`cached ${cached.channel} build ${cached.build} → ${cached.bundlePath}`);
  } else {
    console.log("usage: bun tools/game-client-source.ts status | fetch [production|development]");
  }
}
