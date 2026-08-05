import type { RosterEntry } from "../src/roster.ts";

/**
 * Prawdziwa walka z gry, wygodna do importu — łowca przeciw odyńcom.
 *
 * Świat `tempest`, build `1785244275300`, zrzut `tools/walka-probe.js`
 * z 2026‑08‑04.
 *
 * ⚠️ **BUILD STAŁ TU BŁĘDNY DO 2026‑08‑05: `1781609507010`.** To jest numer
 * builda DEWELOPERSKIEGO rozpakowanych źródeł klienta (experimental.margonem.pl,
 * `docs/specy/2026-08-04-zrodla-klienta-z-buildu-deweloperskiego.md`), sześć
 * tygodni starszego od walki. Wziął się stąd, że nagłówek przepisywał człowiek
 * przy przenoszeniu materiału z plików danych do kodu — a dwa numery builda
 * leżały wtedy obok siebie. Prawdziwy potwierdzają dwa niezależne zapisy:
 * sam zrzut i skasowany `meta.json`
 * (`git show eb9e76c^:tests/fixtures/new-engine/2026-08-04_tempest_lowca-vs-odyncze/meta.json`).
 * **To jest cały argument za tym, żeby pochodzenia nie przepisywać ręką.**
 *
 * ⚠️ **PRZESTAŁ TU STAĆ NAPIS „JEDYNA PRAWDZIWA WALKA, JAKA ZOSTAŁA".** Od
 * 2026‑08‑05 surowy materiał wrócił do `tests/fixtures/` i to on jest oryginałem:
 * ten moduł niesie DOKŁADNIE te same komunikaty i skład, co
 * `tests/fixtures/2026-08-04-tempest-lowca-vs-odyncze.json`, i pilnuje tego test
 * („moduł z tej walki nie rozjeżdża się z fixture'em"). Fixture niesie ponadto
 * to, czego moduł zmieścić nie może: ładunki, granice wywołań i `hp.max`, na
 * którym stoi jedyny świadek dekodera spoza dekodera.
 *
 * PO CO WIĘC MODUŁ. Cztery miejsca importują tę walkę jako gotowe `KOMUNIKATY`
 * i `SKLAD` (`archive.test.ts`, `index.test.ts`, `stats.test.ts` oraz `build.ts`
 * jako seed podglądu), a `build.ts` nie ma jak czytać katalogu testów. Moduł
 * jest wygodą, nie źródłem — i dlatego wolno go regenerować, a nie edytować.
 *
 * Jedna walka to jedna walka: nie ma tu bloku, uniku, absorpcji z własnym
 * kluczem ani zapowiedzi umiejętności. Lista zakupowa na następny zrzut stoi
 * w `docs/ROADMAP.md`.
 *
 * **Niczego się tu nie edytuje, żeby test przeszedł.** Gdy coś się nie zgadza,
 * wraca się do fixture'a — a od 2026‑08‑05 jest do czego wracać.
 *
 * Co w niej siedzi: łowca (`+dmgd`, dystansowe) przeciw trzem potworom, dwa
 * krytyki, przebicie, redukcja pancerzem (`+acdmg`), tyknięcie trucizny
 * osłabione o 14%, cios potwora z `-legbon_facade` (Fasada opieki), leczenie
 * bez leczącego i rozstrzygnięcie z `winner`/`loser`.
 */
export const KOMUNIKATY: string[] = [
  "482845=100.00;-161518=70.07;+dmgd=466;+acdmg=5;-dmgd=223",
  "482845=100.00;-161518=21.34;+crit;+dmgd=612;+acdmg=5;-dmgd=363",
  "-255967=100.00;0;step",
  "-255969=100.00;0;step",
  "482845=100.00;-161518=0.00;+dmgd=485;+acdmg=5;-dmgd=248",
  "482845=100.00;-255969=13.76;+crit;+pierce;+dmgd=658;+acdmg=5;-dmgd=658",
  "-255967=100.00;0;step",
  "482845=100.00;-255969=0.00;+pierce;+dmgd=461;+acdmg=5;-dmgd=461",
  "482845=100.00;-255967=68.15;+dmgd=498;+acdmg=5;-dmgd=243",
  "482845=100.00;-255967=37.61;+dmgd=483;+acdmg=5;-dmgd=233",
  "-255967=19.27;0;poison=140,14",
  "-255967=19.27;482845=98.30;+dmg=331;-legbon_facade=13;-dmg=99",
  "482845=100.00;0;heal=99",
  "482845=100.00;-255967=0.00;+dmgd=458;+acdmg=5;-dmgd=215",
  "0;0;winner=Łowcożyr Kazrek",
  "0;0;loser=Odyniec, Odyniec, Locha",
  "0;0;+exp=3973",
  "0;0;txt=Locha: zdobyto Skóra z dzika",
];

/**
 * Skład tej samej walki, odczytany z `Engine.battle.warriors` przez
 * `skladZeZrzutu`. Strona 0 to drużyna gracza (`myteam`), ujemne `id` to potwory.
 *
 * Dwa Odyńce mają RÓŻNE `id` i tę samą nazwę — to jest materiał dla
 * rozdzielania instancji, i w protokole jest ono darmowe, bo `id` rozstrzyga.
 */
export const SKLAD: RosterEntry[] = [
  { id: 482845, name: "Łowcożyr Kazrek", side: 0, prof: "h", lvl: 40 },
  { id: -161518, name: "Locha", side: 1, prof: "w", lvl: 40 },
  { id: -255967, name: "Odyniec", side: 1, prof: "w", lvl: 41 },
  { id: -255969, name: "Odyniec", side: 1, prof: "w", lvl: 41 },
];
