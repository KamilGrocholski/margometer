/**
 * Nagłówek metadanych userscriptu i reguły, po których Tampermonkey decyduje,
 * gdzie dodatek wstrzyknąć.
 *
 * Osobny moduł, bo `build.ts` to skrypt z efektami ubocznymi — nie da się go
 * zaimportować w teście, nie budując przy okazji całego pliku. A ta jedna
 * rzecz testu potrzebuje: błąd w `@match` trafił użytkowników już DWA razy
 * (`eddde5b`, potem `2016e59` „dodatek nie wstrzykiwał się do gry”), za każdym
 * razem cicho — dodatek po prostu nie startował.
 */

export function banner(version: string, description: string): string {
  // `@match` porównuje ścieżkę RAZEM z query stringiem, więc
  // "https://*.margonem.pl/" nie łapie adresu z jakimkolwiek "?...". Świat gry
  // bywa otwierany właśnie tak — stąd "/*" i odsianie reszty przez `@exclude`.
  //
  // Lista `@exclude` z natury nie jest pełna: domena ma więcej podstron niż
  // światów. Druga linia obrony siedzi w `boot()` — bez `Engine` i bez okna
  // walki panel się nie rysuje, a pętla szukania gaśnie po kilkunastu sekundach.
  return `// ==UserScript==
// @name         MargoMeter
// @namespace    https://github.com/margometer
// @version      ${version}
// @description  ${description}
// @author       kamil
// @match        https://*.margonem.pl/*
// @match        https://*.margonem.com/*
// @exclude      https://www.margonem.pl/*
// @exclude      https://www.margonem.com/*
// @exclude      https://forum.margonem.pl/*
// @exclude      https://commons.margonem.pl/*
// @exclude      https://pomoc.margonem.pl/*
// @exclude      https://pomoc.margonem.com/*
// @noframes
// @grant        none
// @run-at       document-idle
// ==/UserScript==
`;
}

/** Wartości jednego pola nagłówka, w kolejności wystąpienia. */
export function metaField(banner: string, name: string): string[] {
  return banner
    .split("\n")
    .map((line) => new RegExp(`^// @${name}\\s+(.*)$`).exec(line)?.[1]?.trim())
    .filter((value): value is string => value !== undefined && value !== "");
}

/**
 * Czy wzorzec `@match`/`@exclude` obejmuje adres.
 *
 * Uproszczona wersja reguł rozszerzeń: schemat dosłownie, host z opcjonalnym
 * `*.` z przodu, ścieżka jako glob. Tyle wystarcza dla wzorców, których
 * używamy, a chodzi o wyłapanie literówki, nie o drugą implementację
 * Tampermonkey.
 */
function patternMatches(pattern: string, url: string): boolean {
  const parsed = /^(\*|https?):\/\/([^/]+)(\/.*)$/.exec(pattern);
  if (!parsed) return false;
  const [, scheme, host, path] = parsed as unknown as [string, string, string, string];

  const target = new URL(url);
  if (scheme !== "*" && `${scheme}:` !== target.protocol) return false;

  if (host.startsWith("*.")) {
    const base = host.slice(2);
    if (target.hostname !== base && !target.hostname.endsWith(`.${base}`)) return false;
  } else if (host !== "*" && host !== target.hostname) return false;

  const glob = new RegExp(
    `^${path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`,
  );
  return glob.test(target.pathname + target.search);
}

/** Czy dodatek w ogóle wystartuje pod tym adresem. */
export function appliesTo(banner: string, url: string): boolean {
  const included = metaField(banner, "match").some((pattern) => patternMatches(pattern, url));
  if (!included) return false;
  return !metaField(banner, "exclude").some((pattern) => patternMatches(pattern, url));
}
