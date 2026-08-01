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
import { PHASE_NOTE } from "./phase.ts";
import { META_FILE, USERSCRIPT_FILE } from "./artifacts.ts";

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

/**
 * Stopka wydania: który plik kliknąć.
 *
 * Powód jest konkretny. Wydanie pokazuje CZTERY pozycje — dwa nasze assety
 * plus archiwa źródeł, które GitHub dokłada sam i których nie da się zdjąć.
 * `margometer.meta.js` wygląda wtedy jak drugi skrypt do zainstalowania, a jest
 * plikiem służbowym dla Tampermonkey. Kto go kliknie, zainstaluje sam nagłówek
 * bez ani jednej linii kodu — dodatek „się zainstaluje" i nie zrobi nic.
 *
 * Nie zależy od fazy projektu: ta stopka zostaje także po wyjściu z alfy.
 */
export const ASSETS_NOTE = [
  "---",
  "",
  `**Instalacja:** kliknij **\`${USERSCRIPT_FILE}\`** poniżej — Tampermonkey`,
  "przechwyci to sam i pokaże okno instalacji.",
  "",
  `\`${META_FILE}\` jest dla Tampermonkey (sprawdzanie wersji), nie do klikania.`,
  "Archiwa źródeł dokłada GitHub — są dla tych, którzy chcą zbudować dodatek sami.",
].join("\n");

/**
 * Pełna treść wydania: ostrzeżenie o fazie, zmiany, stopka o plikach.
 *
 * Osobna funkcja, a nie sklejanie w CLI, bo to jedyna rzecz w tym pliku, którą
 * widzi użytkownik — a CLI uruchamia się dopiero przy tagu, czyli tam, gdzie
 * pomyłka jest najdroższa.
 */
export function releaseNotes(section: string): string {
  return [PHASE_NOTE, section, ASSETS_NOTE].filter((part) => part !== "").join("\n\n");
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
  console.log(releaseNotes(section));
}
