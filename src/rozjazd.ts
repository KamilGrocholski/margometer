import type { ActorStats, BattleEvent } from "./types.ts";
import type { BattleStats } from "./stats.ts";

/**
 * Czujka rozjazdu — czy dwa niezależne odczyty tej samej walki dają te same
 * liczby.
 *
 * PO CO TO ISTNIEJE. Dziś, gdy `parse` odczyta liczbę źle przy zerze linii
 * nierozpoznanych, panel pokaże złą liczbę i nie powie nic. Nic tego nie
 * złapie: wszystkie testy są wewnętrzne i były zielone także wtedy, gdy
 * `mergeStats` gubiło sumy (`AUDYT‑6`). Protokół silnika jest jedynym
 * niezależnym świadkiem w zasięgu — a dwa świadectwa mają wartość tylko wtedy,
 * gdy ktoś je porównuje.
 *
 * DLACZEGO CZUJKA, A NIE PRZEŁĄCZENIE ŹRÓDŁA. Różnica jest w trybie awarii:
 * czujka myląca się o protokole wypisze fałszywy alarm, a przełącznik pokaże
 * złą liczbę PO CICHU. Projekt i odrzucone warianty:
 * `docs/specy/2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md`.
 */

export type Rozjazd = {
  etykieta: string;
  pole: string;
  zTekstu: number;
  zProtokolu: number;
};

/**
 * Skalary, które porównujemy — i tylko one.
 *
 * ROZBIĆ I PROCÓW TU NIE MA celowo. Tam różnica bywa różnicą DEFINICJI, a nie
 * błędem: protokół rozdziela składniki redukcji osobnymi kluczami, tekst je
 * skleja, a `damageAbsorbed` ma udokumentowany, nieusuwalny rozjazd nawet
 * między dwiema drogami tekstowymi (237 127 wobec 240 025, `parser.ts:561‑578`).
 * Czujka, która krzyczy z powodu definicji, uczy tylko tego, żeby ją ignorować.
 */
const POLA = [
  "damageDealt",
  "damageTaken",
  "healingDone",
  "healingReceived",
] as const satisfies readonly (keyof ActorStats)[];

/** Nazwy pól po ludzku — trafiają do panelu, więc nie mogą brzmieć jak kod. */
const OPIS: Record<(typeof POLA)[number], string> = {
  damageDealt: "obrażenia zadane",
  damageTaken: "obrażenia otrzymane",
  healingDone: "leczenie",
  healingReceived: "leczenie otrzymane",
};

/**
 * Porównanie dwóch odczytów tej samej walki.
 *
 * PORÓWNUJEMY WYŁĄCZNIE POSTACIE ZNANE OBU STRONOM. Postać widziana tylko przez
 * jedną drogę to inny problem niż zła liczba — najczęściej różnica w numeracji
 * instancji („Locha #1"), która po stronie protokołu bierze się z `id`, a po
 * stronie tekstu ze spadku życia. Wrzucenie jej tutaj zalałoby czujkę szumem
 * i utopiło przypadek, dla którego powstała.
 *
 * ⚠️ **BEZ TOLERANCJI, bo tolerancji nikt nie zmierzył.** Próg dobrany „na oko"
 * ukrywałby dokładnie te małe rozjazdy, których szukamy. Pierwsza walka
 * zapisana obiema drogami ma go ustalić — do tego czasu równość jest dokładna
 * i to jest świadome źródło fałszywych alarmów.
 */
export function rozjazdy(zTekstu: BattleStats, zProtokolu: BattleStats): Rozjazd[] {
  const wgProtokolu = new Map(zProtokolu.actors.map((a) => [a.name, a]));
  const wynik: Rozjazd[] = [];

  for (const aktor of zTekstu.actors) {
    const drugi = wgProtokolu.get(aktor.name);
    if (drugi === undefined) continue;
    for (const pole of POLA) {
      if (aktor[pole] !== drugi[pole]) {
        wynik.push({
          etykieta: aktor.name,
          pole: OPIS[pole],
          zTekstu: aktor[pole],
          zProtokolu: drugi[pole],
        });
      }
    }
  }
  return wynik;
}

/**
 * Czy w tej porcji walka się skończyła.
 *
 * PORÓWNUJEMY DOPIERO NA KOŃCU WALKI i to nie jest oszczędność. W trakcie obie
 * drogi mają inną kadencję — DOM budzi się z `MutationObserver`, protokół
 * z `update` — więc porównanie w locie zapalałoby się z samego przesunięcia
 * w czasie, na liczbach, które za sekundę i tak się zrównają.
 */
export function walkaZakonczona(zdarzenia: readonly BattleEvent[]): boolean {
  return zdarzenia.some((z) => z.kind === "fight-end");
}

/**
 * Czy ten odczyt jest PUSTY — ma wiersze, ale nie ma w nich ani jednej liczby.
 *
 * ⚠️ **WIERSZE NIE ŚWIADCZĄ O TREŚCI.** `aggregate` buduje je ze SKŁADU
 * podanego z gry, nie ze zdarzeń: sesja, która nie zobaczyła ani jednego ciosu,
 * ma komplet postaci i same zera. To nie jest teoria — pierwsze uruchomienie
 * w grze (2026‑08‑04) pokazało dokładnie taki odczyt, bo owinięcie
 * `Engine.battle.update` podpięło się już po pierwszej porcji komunikatów,
 * a w tej porcji potrafi przyjść CAŁA walka.
 *
 * Rozróżnienie jest potrzebne w dwóch miejscach i to są dwa różne pytania:
 * „z której drogi rysować panel" (`zrodloPanelu`) i „co powiedzieć
 * użytkownikowi" — bo „nie zdążyliśmy się podpiąć" to inna wiadomość niż
 * „dwa odczyty się nie zgadzają".
 */
export function pustyOdczyt(stats: BattleStats): boolean {
  return !stats.actors.some(
    (a) =>
      a.damageDealt > 0 ||
      a.damageTaken > 0 ||
      a.healingDone > 0 ||
      a.healingReceived > 0 ||
      a.hits > 0,
  );
}
