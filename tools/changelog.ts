/**
 * Wycięcie jednej sekcji z `CHANGELOG.md` — treści wydania na GitHubie.
 *
 * Osobny moduł z czystą funkcją, a nie skrypt z efektami ubocznymi, z tego
 * samego powodu co `userscript-meta.ts`: to ma być testowalne. Alternatywą był
 * `sed`/`awk` wklejony w YAML-a, czyli kod, którego nie uruchamia nic poza
 * wypchnięciem taga — a wtedy literówkę widać dopiero przy wydaniu, kiedy
 * naprawianie jest najdroższe.
 *
 * Bez tego wydanie miałoby albo pustą treść, albo automatyczną listę commitów —
 * czyli zapis dla programisty w miejscu, które czyta użytkownik.
 */

/**
 * Treść sekcji danej wersji, bez jej nagłówka. `null`, gdy sekcji nie ma —
 * i to jest sygnał do przerwania wydania, nie do wypuszczenia pustki.
 */
export function changelogSection(changelog: string, version: string): string | null {
  const lines = changelog.split("\n");
  // Nagłówek wersji, nie dowolne wystąpienie numeru: `## [0.3.0] — 2026-08-01`.
  // Numer bywa też w treści wpisów („wycofana z opisu wydania 0.1.0"), więc
  // szukanie po samej liczbie trafiłoby w środek cudzej sekcji.
  const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));
  if (start === -1) return null;

  const rest = lines.slice(start + 1);
  // Koniec to następny nagłówek WERSJI (`## `), nie podsekcji (`### `) —
  // inaczej wydanie ogłosiłoby same „Dodane" i urwało resztę.
  const end = rest.findIndex((line) => line.startsWith("## "));
  const body = (end === -1 ? rest : rest.slice(0, end)).join("\n").trim();
  return body;
}

if (import.meta.main) {
  const version = process.argv[2];
  if (version === undefined) {
    console.error("użycie: bun tools/changelog.ts <wersja>");
    process.exit(2);
  }
  const section = changelogSection(await Bun.file("./CHANGELOG.md").text(), version);
  if (section === null || section === "") {
    // Twardo, nie ostrzeżeniem: wydanie bez opisu zmian jest dokładnie tym
    // stanem, z którego ta runda wyprowadza projekt.
    console.error(`CHANGELOG.md nie ma sekcji [${version}] albo jest ona pusta`);
    process.exit(1);
  }
  console.log(section);
}
