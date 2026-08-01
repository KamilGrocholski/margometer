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

/**
 * Nagłówek dodatku. `homepage` idzie z `package.json` — tak samo jak `version`
 * i `description`.
 *
 * Adresy wydania NIE są tu literałem z premedytacją. Zaszyty literał już raz
 * kosztował to repo kanał dostawy: `@version` stało na `0.1.0` przez
 * kilkanaście commitów funkcjonalnych, bo numer żył osobno od `package.json`.
 * Adres repozytorium jest dokładnie tą samą klasą danych.
 *
 * `releases/latest/download/...` nie zawiera numeru wersji, więc nagłówek nie
 * wymaga edycji przy żadnym kolejnym wydaniu — GitHub sam przekierowuje na
 * ostatnie. Aktualizacja sprawdza się po LEKKIM `.meta.js` (sam ten nagłówek,
 * ~1 kB), a pobiera z `.user.js`; Tampermonkey odpytuje cyklicznie, więc
 * ściąganie całego bundle'a tylko po to, żeby przeczytać jedną linię z wersją,
 * byłoby ruchem za każdym odświeżeniem.
 */
export function banner(version: string, description: string, homepage: string): string {
  const release = `${homepage}/releases/latest/download`;
  // `@match` porównuje ścieżkę RAZEM z query stringiem, więc
  // "https://*.margonem.pl/" nie łapie adresu z jakimkolwiek "?...". Świat gry
  // bywa otwierany właśnie tak — stąd "/*" i odsianie reszty przez `@exclude`.
  //
  // Lista `@exclude` z natury nie jest pełna: domena ma więcej podstron niż
  // światów. Druga linia obrony siedzi w `boot()` — bez `Engine` i bez okna
  // walki panel się nie rysuje, a pętla szukania gaśnie po kilkunastu sekundach.
  return `// ==UserScript==
// @name         MargoMeter
// @namespace    ${homepage}
// @version      ${version}
// @description  ${description}
// @author       kamil
// @homepageURL  ${homepage}
// @downloadURL  ${release}/margometer.user.js
// @updateURL    ${release}/margometer.meta.js
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
