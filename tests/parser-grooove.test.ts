import { describe, expect, test } from "bun:test";
import { parse } from "../src/parser.ts";
import {
  czytajFixture,
  katalogiKorpusu,
  odstepPrzedPoziomem,
  zdarzenia,
} from "../tools/grooove.ts";
import { FIGHT_START_TEXT } from "../src/types.ts";

/**
 * Parser przeciw PRAWDZIWYM nazwom z korpusu protokołu.
 *
 * PO CO OSOBNY PLIK, skoro `tests/grooove.test.ts` już ten korpus czyta. Bo
 * tamten pilnuje kształtu korpusu, a ten pyta o parser. Materiał jest jednak
 * ten sam i to jest tu sedno: grooove.pl nie renderuje pól `opening` ani
 * `team`, więc **te dwa są autentyczne**, mimo że tekst, który tamta strona
 * pokazuje, jest cudzym dialektem (132 z 223 zdarzeń jako `unknown` — pomiar
 * w `tests/fixtures/grooove/README.md`). Nazwy, poziomy, kody profesji
 * i separator stron pochodzą z gry.
 *
 * Dwa źródła są przy tym NIEZALEŻNE: linia otwierająca jest tekstem, a `team`
 * strukturą (`id|nick|płeć|drużyna`) z zupełnie innego pola. Zgodność między
 * nimi coś znaczy; zgodność pola z samym sobą nie znaczyłaby nic.
 *
 * ⚠️ **Wszystko tutaj przechodzi od pierwszego uruchomienia i to nie jest
 * przeoczenie.** To są strażnicy regresji: zastępują ręcznie pisane stringi
 * 64 prawdziwymi nickami i 61 prawdziwymi nazwami umiejętności. Że mają siłę
 * rozróżniającą, a nie tylko zieloność, pokazuje `2026-08-04_tempest_dragon-
 * spacje-w-nicku` — patrz komentarz przy teście składów.
 *
 * ⚠️ **Czego ten plik NIE pilnuje, żeby zieloność nie udawała pokrycia.**
 * Rozluźnienie `RE_PARTICIPANT` z `\s\(` do `\s?\(` (odstęp przed nawiasem
 * z poziomem staje się opcjonalny) **nie zapala tutaj niczego** — sprawdzone
 * mutacją. Powód jest strukturalny: wejście przechodzi przez
 * `odstepPrzedPoziomem`, więc odstęp w nim ZAWSZE jest, a szerszy wzorzec
 * tylko dopuszcza więcej. Złapałby to dopiero nick kończący się kształtem
 * `coś(12w)`, a takiego w 191 przejrzanych nickach nie ma. Trzy pozostałe
 * mutacje (`splitSides`, obcinanie przedrostka `a|i|,`, `RE_ABILITY_USE`)
 * zapalają się i to one są tu miarą.
 */

const KORPUS = new URL("./fixtures/grooove/", import.meta.url).pathname;

const fixtures = await Promise.all(
  (await katalogiKorpusu()).map(async (nazwa) => {
    const { team } = czytajFixture(await Bun.file(`${KORPUS}${nazwa}/log.grooove.txt`).text());
    const meta = JSON.parse(await Bun.file(`${KORPUS}${nazwa}/meta.json`).text()) as {
      opening: string | null;
    };
    const pola = team.split("|");
    const sklad: string[] = [];
    for (let i = 0; i + 3 < pola.length; i += 4) sklad.push(pola[i + 1]!);
    return { nazwa, opening: meta.opening, sklad };
  }),
);

const unikalne = (nazwy: string[]) => [...new Set(nazwy)].sort();

/** Nazwy umiejętności z pola `p_` — po całym korpusie, bez powtórzeń. */
const umiejetnosci = unikalne(
  (
    await Promise.all(
      fixtures.map(async (f) => {
        const { log } = czytajFixture(await Bun.file(`${KORPUS}${f.nazwa}/log.grooove.txt`).text());
        return zdarzenia(log).flatMap((z) => {
          const trafienie = z.match(/p_\.([^;]*)/);
          return trafienie === null ? [] : [trafienie[1]!];
        });
      }),
    )
  ).flat(),
);

/**
 * TEN TEST PILNUJE DECYZJI, NIE DANYCH — jak „w tym katalogu nie ma `raw.txt`"
 * w `tests/grooove.test.ts`.
 *
 * Do 2026‑08‑04 korpus miał dwie walki z Cronusa, świata anglojęzycznego, i test
 * stojący tutaj wymagał, żeby BYŁY — jako dowód, że klucze protokołu są na tych
 * światach te same, a angielskie są tylko nazwy. Decyzja właściciela repo
 * odwróciła wymóg: korpus bierze wyłącznie światy polskojęzyczne, bo margometer
 * czyta polskie okno walki, a materiał z `[EN]` wchodził do liczników i progów
 * tak, jakby odpowiadał na pytania tego repo. Powody i co z tym wyszło —
 * `tests/fixtures/grooove/README.md`.
 *
 * Odwrócony wymóg zapala się przy pierwszym zrzucie z `[EN]`, który ktoś tu
 * położy. Drugą stronę tej samej decyzji trzyma `SWIATY_ANGLOJEZYCZNE`
 * w `tools/grooove.ts` — tam nie da się takiego zrzutu w ogóle pobrać.
 */
test("każdy fixture jest ze świata polskojęzycznego", () => {
  expect(fixtures.length).toBeGreaterThan(0);
  const obce = fixtures.filter((f) => !f.opening?.startsWith(FIGHT_START_TEXT));
  expect(obce.map((f) => f.nazwa)).toEqual([]);
});

describe("skład z linii otwierającej zgadza się ze składem z pola team", () => {
  /**
   * TEN TEST MA SIŁĘ ROZRÓŻNIAJĄCĄ I DA SIĘ TO POKAZAĆ.
   *
   * `splitSides` w parserze rozcina strony wzorcem `/\)\s+a\s+/` — z wymogiem
   * nawiasu przed separatorem. Wymóg wygląda na ozdobnik do chwili, gdy w logu
   * stanie nick zawierający „ a ” w środku. Zasymulowane na 191 nickach ze 142
   * przejrzanych walk, wzorzec rozluźniony do `/\s+a\s+/`:
   *
   *   „D r a g o n (392h) a Absolwemt (301w)”
   *      poprawnie → ["D r a g o n", "Absolwemt"]
   *      luźno     → ["g o n", "Absolwemt"]          ← ten test się zapala
   *
   * „D r a g o n” jest JEDYNYM nickiem ze 191, który rozróżnia te dwie wersje
   * NA PRAWDZIWYCH liniach otwierających. Drugi i ostatni nick z „ a ”
   * w środku, „Tears of a Clown”, stał w swojej walce PO separatorze — luźny
   * wzorzec trafiał tam przypadkiem w to samo miejsce i nic nie zauważał.
   * (W teście round-trip niżej, gdzie nick stoi PIERWSZY, rozróżniał już oba —
   * sprawdzone mutacją: zapalały się wtedy trzy testy, nie jeden.)
   *
   * ⚠️ Tamta walka jest z Cronusa i od 2026‑08‑04 **nie leży już w korpusie**
   * (patrz test wyżej). Pomiar zostaje, bo szedł po 191 nickach ze 142
   * PRZEJRZANYCH walk, nie po korpusie — skreślenie go zamieniłoby liczbę
   * w gołe twierdzenie. Praktyczny skutek jest taki, że round-trip niżej ma
   * dziś tylko jeden nick sprawdzający tę ścieżkę zamiast dwóch.
   *
   * Dlatego walka 84840836 leży w korpusie i dlatego ten test nie jest ozdobą.
   */
  test.each(fixtures)("$nazwa", ({ opening, sklad }) => {
    // `odstepPrzedPoziomem` wstawia spację przed nawiasem z poziomem, bo
    // grooove pisze `Baylan(83w)`, a okno walki `Baylan (83w)`. To korekta
    // ŹRÓDŁA, nie rozluźnienie parsera — wzorce zostają takie, jakie są.
    const zdarzenie = parse(odstepPrzedPoziomem(opening!)).find((e) => e.kind === "fight-start");
    expect(zdarzenie).toBeDefined();
    const zLinii = unikalne(
      (zdarzenie as { kind: "fight-start"; participants: Array<{ name: string }> }).participants.map(
        (u) => u.name,
      ),
    );
    expect(zLinii).toEqual(unikalne(sklad));
  });

  test("strony rozdzielają się na dwie drużyny, nie na jedną", () => {
    // Osobno, bo poprzedni test porównuje ZBIORY nazw i przeżyłby zlanie stron.
    const grupowa = fixtures.find((f) => f.nazwa.endsWith("_grupowa-10v10"))!;
    const zdarzenie = parse(odstepPrzedPoziomem(grupowa.opening!)).find(
      (e) => e.kind === "fight-start",
    ) as { participants: Array<{ side: number }> };
    expect(unikalne(zdarzenie.participants.map((u) => String(u.side)))).toEqual(["0", "1"]);
  });
});

describe("prawdziwe nazwy przeżywają round-trip przez parser", () => {
  const nicki = unikalne(fixtures.flatMap((f) => f.sklad));

  test("korpus daje dość nazw, żeby to coś znaczyło", () => {
    expect(nicki.length).toBeGreaterThan(50);
  });

  test.each(nicki)("nick „%s” wychodzi z linii otwierającej bez zmian", (nick) => {
    // Wzorzec uczestnika obcina wiodące `a `, `i ` i przecinek — separatory
    // z poprzedniego dopasowania. Nick, który sam zaczyna się od takiego słowa,
    // straciłby je po cichu. W 191 przejrzanych nickach nie ma ani jednego
    // takiego, więc ta ścieżka jest sprawdzona tylko od strony „nie psuje
    // niewinnych” — najbliżej stoi „talerz i hantle” ze spójnikiem w środku.
    const linia = `${FIGHT_START_TEXT} ${nick} (100w) a Ktoś Inny (99m)`;
    const start = parse(linia).find((e) => e.kind === "fight-start") as {
      participants: Array<{ name: string }>;
    };
    expect(start.participants.map((u) => u.name)).toEqual([nick, "Ktoś Inny"]);
  });

  test("korpus daje dość nazw umiejętności", () => {
    // Próg stał na 70 do 2026‑08‑04, przy 83 nazwach. Dwie walki z Cronusa
    // wniosły 22 z nich — WSZYSTKIE angielskie (Frost Arrow, Rampage, First
    // Aid…), więc dla parsera czytającego polskie okno walki nie znaczyły nic
    // ponad to, że jest ich dużo. Zostaje 61 polskich i to one są tu miarą.
    expect(umiejetnosci.length).toBeGreaterThan(55);
  });

  test.each(umiejetnosci)("umiejętność „%s” trafia do pola ability", (umiejetnosc) => {
    // Blok w takiej właśnie postaci: zapowiedź, cios, linia przyjętych.
    // Parser jest maszyną stanów, więc sama linia „wykonuje” nie wystarczy —
    // nazwa dokleja się dopiero do ataku, który po niej idzie.
    const blok = [
      `Bohater wykonuje ${umiejetnosc}.`,
      "Bohater(100%) uderzył z siłą  +10",
      "Cel(99%) otrzymał  -10  obrażeń",
    ].join("\n");
    const atak = parse(blok).find((e) => e.kind === "attack") as { ability: string | null };
    expect(atak?.ability).toBe(umiejetnosc);
  });
});
