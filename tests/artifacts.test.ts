import { describe, expect, test } from "bun:test";
import { META_FILE, USERSCRIPT_FILE, distPath } from "../tools/artifacts.ts";
import { ASSETS_NOTE, releaseNotes } from "../tools/changelog.ts";
import { banner, metaField } from "../tools/userscript-meta.ts";
import pkg from "../package.json" with { type: "json" };

const root = (name: string) => new URL(`../${name}`, import.meta.url).pathname;
const README = await Bun.file(root("README.md")).text();
const RELEASE_YML = await Bun.file(root(".github/workflows/release.yml")).text();
const META = banner(pkg.version, pkg.description, pkg.homepage);

/**
 * Nazwy plików wydania żyją w pięciu miejscach, a importują je tylko trzy.
 * Ten plik pilnuje dwóch pozostałych — YAML-a i prozy — bo rozjazd którejkolwiek
 * pary jest CICHY: nagłówek wskazywałby plik, którego wydanie nie zawiera,
 * i aktualizacje przestałyby przychodzić bez jednego komunikatu o błędzie.
 */
describe("pliki wydania zgadzają się wszędzie", () => {
  test("workflow wgrywa dokładnie te pliki, które buduje `build.ts`", () => {
    const workflow = Bun.YAML.parse(RELEASE_YML) as {
      jobs: { release: { steps: { uses?: string; with?: { files?: string } }[] } };
    };
    const upload = workflow.jobs.release.steps.find((step) =>
      step.uses?.startsWith("softprops/action-gh-release"),
    );
    expect(upload).toBeDefined();

    const files = (upload!.with!.files ?? "").split("\n").filter((line) => line.trim() !== "");
    // `distPath` daje "./dist/...", workflow pisze "dist/..." — porównujemy po
    // samej nazwie pliku, bo to ona musi się zgadzać z nagłówkiem dodatku.
    expect(files.map((f) => f.trim().split("/").pop())).toEqual([USERSCRIPT_FILE, META_FILE]);
    for (const file of [USERSCRIPT_FILE, META_FILE]) {
      expect([file, RELEASE_YML.includes(distPath(file).replace("./", ""))]).toEqual([file, true]);
    }
  });

  test("nagłówek dodatku wskazuje te same pliki", () => {
    expect(metaField(META, "downloadURL")[0]!.endsWith(`/${USERSCRIPT_FILE}`)).toBe(true);
    expect(metaField(META, "updateURL")[0]!.endsWith(`/${META_FILE}`)).toBe(true);
  });

  test("link instalacyjny w README prowadzi do skryptu, nie do nagłówka", () => {
    // Pomyłka o jedno słowo daje link, po kliknięciu którego Tampermonkey
    // instaluje sam nagłówek — dodatek „się instaluje" i nie robi nic.
    expect(README).toContain(`releases/latest/download/${USERSCRIPT_FILE}`);
    expect(README).not.toContain(`releases/latest/download/${META_FILE}`);
  });

  test("stopka wydania mówi, co kliknąć, a czego nie", () => {
    expect(ASSETS_NOTE).toContain(USERSCRIPT_FILE);
    expect(ASSETS_NOTE).toContain(META_FILE);
    expect(ASSETS_NOTE).toContain("nie do klikania");
  });

  test("stopka zostaje także po wyjściu z fazy wczesnej", () => {
    // Ostrzeżenie o alfie kiedyś zniknie; informacja, który plik kliknąć, nie.
    // Sklejanie w jednym miejscu kusi, żeby powiązać je ze sobą — nie są.
    const notes = releaseNotes("### Dodane\n- coś tam");
    expect(notes).toContain("### Dodane");
    expect(notes.endsWith(ASSETS_NOTE)).toBe(true);
  });
});
