import { syntheticFight } from "../tools/synthetic-log.ts";
import { cios, leczenie, otwarcie, trafienie, tykniecie, umiejetnosc } from "./zdarzenia.ts";
import { FIXTURY } from "./fixtury.ts";
import { dekoduj } from "../src/protokol.ts";
import type { BattleEvent } from "../src/types.ts";

/**
 * Walki, po których chodzą NIEZMIENNIKI.
 *
 * ⚠️ **DO 2026‑08‑05 STAŁO TU „budowane w kodzie, nie wczytywane" i przestało
 * być prawdą**: `WALKI_Z_GRY` na dole pliku wczytuje surowy materiał
 * z `tests/fixtures/`. Ostrzeżenie niżej zostaje mimo to w całości, bo dotyczy
 * SKALI, a ta się nie zmieniła: prawdziwa walka jest w korpusie jedna, nie
 * dwadzieścia pięć.
 *
 * ⚠️ **TO, CO NIŻEJ, ZASTĘPUJE ZESTAW 25 PRAWDZIWYCH WALK, USUNIĘTY 2026‑08‑04,
 * I JEST OD NIEGO SŁABSZE.** Trzeba to powiedzieć wprost, bo różnica jest
 * w rodzaju, nie w stopniu:
 *
 * - Tamten zestaw niósł **25 prawdziwych walk i 4904 zdarzenia** — walki
 *   grupowe, bossy, trucizna bez sprawcy, absorpcja, rozdzielanie instancji po
 *   tej samej nazwie. Każdy kształt tam wystąpił, bo **gra go wyprodukowała**.
 * - To, co jest tutaj, wyprodukowaliśmy MY. Niezmiennik zielony na tym
 *   materiale mówi „agregat jest wewnętrznie spójny na tym, co umiemy sobie
 *   wyobrazić" — nie „radzi sobie z tym, co robi gra".
 *
 * Praktyczny skutek: **kształt, o którym nie pomyśleliśmy, nie ma jak tu
 * wpaść.** Prawdziwe walki łapały je same z siebie; ten plik nie złapie
 * żadnego, dopóki ktoś go nie dopisze. To jest cena tamtej decyzji i ma być
 * widoczna w miejscu, w którym się ją płaci.
 *
 * `syntheticFight` jest deterministyczny (własny generator liczb, bez
 * `Math.random`), więc te same wywołania dają te same walki przy każdym
 * uruchomieniu — inaczej niezmienniki migałyby losowo.
 */

/**
 * Skrajności dobrane tak, żeby niezmienniki miały na czym paść:
 * 2 to samo 1v1, 20 to pełny skład z krytykami, unikami, blokami, leczeniem,
 * trucizną, wielotrafieniem i postaciami, które tracą turę (czyli milczą przez
 * całą swoją kolejkę — tak wygląda ogłuszenie w protokole).
 *
 * ⚠️ **Czego generator NIE produkuje: dwóch akcji tej samej postaci pod rząd.**
 * Daje jedną akcję na postać na rundę i przeplata postacie, więc kształt, na
 * którym pękało liczenie tur do 2026‑08‑05, nie ma tu jak wystąpić. Niezmiennik
 * „każda akcja z logu ma swoją turę na osi” chodzi po tych pięciu walkach i
 * mutacja cofająca tamtą naprawę NIE zapala go na żadnej z nich — łapie ją
 * wyłącznie `OSOBLIWOSCI` niżej. Sprawdzone, nie domyślone.
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
  // Zarazem JEDYNY w korpusie świadek reguły „tura to akcja”: dwa ciosy Gracza
  // wyżej to dwie tury, a zapowiedź plus jej cios — jedna.
  umiejetnosc("Gracz", "Podwójny strzał"),
  cios("Gracz", "Odyniec", [trafienie(400, 400)], {
    targetHpPct: 20,
    ability: "Podwójny strzał",
  }),
  { kind: "fight-end", outcome: "victory", actors: ["Gracz"], result: "Zwyciężyła drużyna" },
];

/**
 * Prawdziwe walki z `tests/fixtures/` — przeliczone dekoderem przy każdym
 * uruchomieniu, nie zamrożone.
 *
 * ⚠️ **TO JEST CZĘŚCIOWA ODPOWIEDŹ NA OSTRZEŻENIE Z GÓRY TEGO PLIKU.** Stało
 * tam — i nadal stoi — że kształt, o którym nie pomyśleliśmy, nie ma jak wpaść
 * do materiału budowanego przez nas. Od 2026‑08‑05 wpada, choć na razie
 * z JEDNEJ walki, a nie z dwudziestu pięciu. Ostrzeżenie zostaje, bo różnica
 * między jedną a dwudziestoma pięcioma jest w tym miejscu istotą sprawy.
 *
 * ⚠️ Stało tu „z DWÓCH walk" (`AUDYT‑58`) — runda celowała w dwa fixture'y,
 * drugi odpadł jako sklejony, a liczba została. `WALKI_Z_GRY.length` mówi `1`.
 *
 * Kluczowa różnica wobec skasowanego `zdarzenia.json`: tam leżały POLICZONE
 * zdarzenia, więc błąd parsera był w nich zamrożony i testy sprawdzały się
 * przeciw niemu. Tu leży surowy protokół, a `dekoduj` chodzi po nim przy każdym
 * `bun test` — poprawka dekodera od razu zmienia to, po czym chodzą niezmienniki.
 */
export const WALKI_Z_GRY: { name: string; events: BattleEvent[] }[] = FIXTURY.map((f) => ({
  name: f.nazwa,
  events: dekoduj(f.komunikaty, f.sklad),
}));

/** Wszystko, po czym chodzą niezmienniki. */
export const KORPUS: { name: string; events: BattleEvent[] }[] = [
  ...WALKI,
  { name: "osobliwosci", events: OSOBLIWOSCI },
  ...WALKI_Z_GRY,
];
