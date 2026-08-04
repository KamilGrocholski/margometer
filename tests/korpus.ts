import { syntheticFight } from "../tools/synthetic-log.ts";
import { cios, leczenie, otwarcie, trafienie, tykniecie, umiejetnosc } from "./zdarzenia.ts";
import type { BattleEvent } from "../src/types.ts";

/**
 * Walki, po których chodzą NIEZMIENNIKI — budowane w kodzie, nie wczytywane.
 *
 * ⚠️ **ZASTĘPUJE KORPUS `tests/fixtures/`, USUNIĘTY 2026‑08‑04, I JEST OD NIEGO
 * SŁABSZY.** Trzeba to powiedzieć wprost, bo różnica jest w rodzaju, nie
 * w stopniu:
 *
 * - Korpus niósł **25 prawdziwych walk i 4904 zdarzenia** — walki grupowe,
 *   bossy, trucizna bez sprawcy, absorpcja, rozdzielanie instancji po tej samej
 *   nazwie. Każdy kształt tam wystąpił, bo **gra go wyprodukowała**.
 * - To, co jest tutaj, wyprodukowaliśmy MY. Niezmiennik zielony na tym
 *   materiale mówi „agregat jest wewnętrznie spójny na tym, co umiemy sobie
 *   wyobrazić" — nie „radzi sobie z tym, co robi gra".
 *
 * Praktyczny skutek: **kształt, o którym nie pomyśleliśmy, nie ma jak tu
 * wpaść.** Korpus łapał je sam z siebie; ten plik nie złapie żadnego, dopóki
 * ktoś go nie dopisze. To jest cena decyzji o usunięciu korpusu i ma być
 * widoczna w miejscu, w którym się ją płaci.
 *
 * `syntheticFight` jest deterministyczny (własny generator liczb, bez
 * `Math.random`), więc te same wywołania dają te same walki przy każdym
 * uruchomieniu — inaczej niezmienniki migałyby losowo.
 */

/**
 * Skrajności dobrane tak, żeby niezmienniki miały na czym paść:
 * 2 to samo 1v1, 20 to pełny skład z krytykami, unikami, blokami, leczeniem,
 * trucizną, wielotrafieniem i postaciami tracącymi tury.
 */
export const WALKI: { name: string; events: BattleEvent[] }[] = [2, 4, 7, 12, 20].map((n) => ({
  name: `syntetyczna-${n}`,
  events: syntheticFight(n),
}));

/**
 * Walka z kształtami, których generator NIE produkuje, a które korpus miał.
 *
 * Każda pozycja stoi tu dlatego, że odpowiadała jej konkretna walka w usuniętym
 * korpusie — nie „na wszelki wypadek".
 */
export const OSOBLIWOSCI: BattleEvent[] = [
  // Dwie postacie o TEJ SAMEJ nazwie po jednej stronie — materiał dla
  // rozdzielania instancji (`2026-07-18_lowca-vs-gnolle-rozdzielanie`).
  otwarcie(["Gracz 100h"], ["Locha 40w", "Locha 40w", "Odyniec 41w"]),
  cios("Gracz", "Locha", [trafienie(500, 300)], { targetHpPct: 70 }),
  cios("Gracz", "Locha", [trafienie(500, 280)], { targetHpPct: 45 }),
  // Trucizna BEZ SPRAWCY przy kilku przeciwnikach — jedyny kształt, w którym
  // `stats.ts` musi powiedzieć „nie wiadomo", zamiast przypisać komukolwiek.
  tykniecie("Gracz", 80, 140, "trucizny", "od", 24),
  // Absorpcja: różnica `raw - applied` bez własnego klucza.
  cios("Odyniec", "Gracz", [trafienie(900, 240)], { targetHpPct: 60 }),
  // Leczenie bez leczącego — log nie mówi, kto rzucił.
  leczenie("Gracz", 700, { targetHpPct: 90 }),
  // Zapowiedź umiejętności doklejona do NASTĘPNEGO ciosu, nie do siebie.
  umiejetnosc("Gracz", "Podwójny strzał"),
  cios("Gracz", "Odyniec", [trafienie(400, 400)], {
    targetHpPct: 20,
    ability: "Podwójny strzał",
  }),
  { kind: "fight-end", outcome: "victory", actors: ["Gracz"], result: "Zwyciężyła drużyna" },
];

/** Wszystko, po czym chodzą niezmienniki. */
export const KORPUS: { name: string; events: BattleEvent[] }[] = [
  ...WALKI,
  { name: "osobliwosci", events: OSOBLIWOSCI },
];
