/**
 * Fetches and caches the game client's own JavaScript.
 *
 * Some questions can only be answered by reading the client: what a protocol
 * key means, and which keys exist at all. AGENTS.md §7.5 has the procedure; the
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

const CACHE_ROOT = new URL("../.cache/game-client/", import.meta.url).pathname;

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
  const inline = /\bversion:\s*(\d{10,})/.exec(html);
  if (inline?.[1] !== undefined) return inline[1];

  const fromFilename = /main\.min(\d{10,})\.js/.exec(html);
  if (fromFilename?.[1] !== undefined) return fromFilename[1];

  throw new GameSourceError("no build id on the page — the client's layout changed");
}

export async function getServedBuild(channel: GameChannel): Promise<string> {
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

/**
 * What is cached right now, or null. Carries its own provenance, because a
 * directory that does not say what it holds is a directory nobody can trust.
 */
export function getCachedClientSource(channel: GameChannel): CachedClientSource | null {
  const manifest = getManifestPath(channel);
  if (!existsSync(manifest)) return null;
  try {
    return JSON.parse(readFileSync(manifest, "utf8")) as CachedClientSource;
  } catch (cause) {
    throw new GameSourceError(`cache manifest for ${channel} is unreadable`, { cause });
  }
}

export async function writeClientSourceCache(channel: GameChannel): Promise<CachedClientSource> {
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
  writeFileSync(getManifestPath(channel), `${JSON.stringify(cached, null, 2)}\n`);
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
    const target = (channel ?? "production") as GameChannel;
    if (!(target in CHANNEL_HOSTS)) throw new GameSourceError(`unknown channel "${target}"`);
    const cached = await writeClientSourceCache(target);
    console.log(`cached ${cached.channel} build ${cached.build} → ${cached.bundlePath}`);
  } else {
    console.log("usage: bun tools/game-client-source.ts status | fetch [production|development]");
  }
}
