import type { RosterEntry } from "../src/roster.ts";

/**
 * JEDYNA prawdziwa walka, jaka została w repo — przepisana do kodu.
 *
 * Pochodzi ze zrzutu `tools/walka-probe.js` (świat `tempest`, build
 * `1781609507010`, łowca przeciw odyńcom). Leżał do 2026‑08‑04 jako plik danych
 * obok testów; ten materiał **nie jest syntetyczny** i dlatego zostaje —
 * 18 komunikatów mieści się w pliku źródłowym, a plik danych nie był tu do
 * niczego potrzebny. Kolejny taki moduł składa `bun tools/walka.ts --rozbij`.
 *
 * ⚠️ **TO JEST CAŁY MATERIAŁ, KTÓRY MOŻNA SPRAWDZIĆ PRZECIW GRZE.** Wszystko
 * inne w testach produkujemy sami (`tests/korpus.ts`, `tools/synthetic-log.ts`).
 * Jedna walka to jedna walka: nie ma tu bloku, uniku, absorpcji z własnym
 * kluczem ani zapowiedzi umiejętności. Lista zakupowa na następny zrzut stoi
 * w `docs/ROADMAP.md`.
 *
 * **Niczego się tu nie edytuje, żeby test przeszedł.** Ta sama reguła, która
 * obowiązywała fixture'y — z tą różnicą, że tutaj nie ma już do czego wrócić
 * po oryginał.
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
