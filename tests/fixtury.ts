import { readdirSync, readFileSync } from "node:fs";
import { czytajZrzut, skladZeZrzutu, komunikaty, type Zrzut } from "../tools/walka.ts";
import type { RosterEntry } from "../src/roster.ts";
import type { BattleEvent } from "../src/types.ts";

/**
 * Wczytywanie surowego materiału z gry — `tests/fixtures/*.json`.
 *
 * ⚠️ **TO JEST ODWRÓCENIE DECYZJI Z 2026‑08‑04 I MA BYĆ CZYTELNE JAKO TAKIE.**
 * Tamta runda (`eb9e76c`) skasowała `tests/fixtures/` i zapisała regułę
 * „materiał testowy powstaje W KODZIE, nie w plikach danych". Powód był jednak
 * węższy, niż brzmi reguła: w katalogu leżał `zdarzenia.json` — 1,44 MB
 * POLICZONYCH zdarzeń, wyjście parsera, który właśnie zszedł z drzewa. Materiał
 * nie do zregenerowania i nie do sprawdzenia przeciw czemukolwiek, z ewentualnym
 * błędem tamtego parsera zamrożonym w środku. **Surowy protokół nigdy nie był
 * zarzutem** — w tym samym katalogu leżał wtedy `protokol.json` i był chwalony
 * jako „pierwsza para tekst↔protokół".
 *
 * Co tu wraca, to więc druga rzecz niż to, co odeszło: **komunikaty tak, jak
 * przysłał je serwer gry, bez ani jednej naszej liczby**. Fixture da się
 * przeliczyć nowszym dekoderem; `zdarzenia.json` nie dawało się przeliczyć
 * niczym.
 *
 * ⚠️ **Jeden wyjątek od zdania wyżej, żeby nie było za szerokie** (`AUDYT‑63`):
 * najstarszy plik w katalogu niesie przy każdym wywołaniu pole `render` —
 * zdania złożone przez renderer KLIENTA, nie przysłane przez serwer. Zbierała
 * je sonda sprzed 2026‑08‑04; dziś nie zapisuje ich ani ona, ani dodatek.
 * Nic u nas tego pola nie czyta, ale „bez ani jednej naszej liczby" i „wyłącznie
 * z serwera" to nie to samo, a tylko pierwsze jest tu prawdą.
 *
 * DLACZEGO PLIK, A NIE MODUŁ TS. `tools/walka.ts --rozbij` produkuje moduł
 * z KOMUNIKATAMI I SKŁADEM, i to wystarczało, dopóki chodziło o same zdarzenia.
 * Nie wystarcza do `hp.max`, ładunku i granic wywołań — a na `hp.max` stoi
 * jedyny świadek dekodera spoza repo (patrz `tests/fixtury.test.ts`). Przepisanie
 * migawek do modułu byłoby przepisywaniem tysięcy liczb ręką, czyli dokładnie
 * tym, co już raz skłamało: nagłówek `tests/walka-z-gry.ts` podawał build
 * `1781609507010` (deweloperski, sześć tygodni starszy) zamiast `1785244275300`.
 *
 * Drugi zarzut tamtej rundy — „plik danych da się dołożyć bez dotknięcia
 * jednego testu, leżał martwy i nikt tego nie widział" — zamyka ODKRYWANIE
 * plików: `readdirSync` bierze każdy `.json`, więc martwy fixture nie ma jak
 * powstać.
 *
 * ⚠️ Stało tu „nic tu nie jest wymienione z nazwy" i było o jedno słowo za
 * mocne (`AUDYT‑77`): `tests/fixtury.test.ts` szuka po nazwie JEDNEGO pliku —
 * tego, z którego wyprowadzony jest moduł `tests/walka-z-gry.ts` — żeby
 * porównać kopię z oryginałem. Cicha zieleń z tego nie wynika, bo brak
 * dopasowania zapala osobną asercję; ale ODKRYWANIE dotyczy pętli
 * niezmienników, nie całego pliku.
 */

/** Gdzie leży surowy materiał. Jedna ścieżka dla wszystkich czytelników. */
const KATALOG = new URL("./fixtures/", import.meta.url).pathname;

export type Fixtura = {
  /** Nazwa pliku bez rozszerzenia — trafia do nazw testów, więc ma być czytelna. */
  nazwa: string;
  zrzut: Zrzut;
  komunikaty: string[];
  sklad: RosterEntry[];
  /**
   * `hp.max` po `id`, z migawek wojowników.
   *
   * JEDYNA LICZBA W TYM MODULE, KTÓREJ NIE MA W MODULE Z `--rozbij` — i cały
   * powód, dla którego fixture jest plikiem, a nie kodem. Razem z procentem
   * życia z protokołu daje świadka dekodera spoza dekodera.
   *
   * Bierzemy z DOWOLNEJ migawki, bo `hp.max` w walce się nie zmienia; gdyby
   * kiedyś zaczęło (bufy na życie), ten komentarz jest miejscem, w którym to
   * założenie stoi wypisane.
   */
  maksZycia: Map<number, number>;
};

function maksZycia(zrzut: Zrzut): Map<number, number> {
  const wynik = new Map<number, number>();
  for (const wpis of zrzut.wpisy) {
    for (const surowy of [...(wpis.wojownicyPrzed ?? []), ...wpis.wojownicyPo]) {
      if (typeof surowy !== "object" || surowy === null) continue;
      const w = surowy as Record<string, unknown>;
      const hp = w["hp"];
      if (typeof w["id"] !== "number" || typeof hp !== "object" || hp === null) continue;
      const max = (hp as Record<string, unknown>)["max"];
      if (typeof max === "number") wynik.set(w["id"], max);
    }
  }
  return wynik;
}

/**
 * Wszystkie fixture'y, posortowane po nazwie.
 *
 * Sortowanie jest po to, żeby kolejność testów nie zależała od systemu plików —
 * inaczej `describe.each` numeruje je raz tak, raz inaczej i diff wyjścia
 * przestaje cokolwiek znaczyć.
 *
 * ⚠️ Czytamy PRAWDZIWYM czytelnikiem (`czytajZrzut`, `skladZeZrzutu`
 * z `tools/walka.ts`), nie własnym `JSON.parse`. Fixture, który przechodzi tu,
 * a nie daje się rozebrać narzędziem, byłby najgorszym z możliwych: zielony
 * w testach i bezużyteczny w tym jedynym momencie, w którym jest potrzebny.
 */
export const FIXTURY: Fixtura[] = readdirSync(KATALOG)
  .filter((plik) => plik.endsWith(".json"))
  .sort()
  .map((plik) => {
    const zrzut = czytajZrzut(readFileSync(`${KATALOG}${plik}`, "utf8"));
    return {
      nazwa: plik.replace(/\.json$/, ""),
      zrzut,
      komunikaty: komunikaty(zrzut.wpisy),
      sklad: skladZeZrzutu(zrzut),
      maksZycia: maksZycia(zrzut),
    };
  });

/** Wynik świadka: rozjazdy do pokazania, plus rozliczenie, co się nie odbyło. */
export type WynikSwiadka = {
  /** Opisy niezgodności — puste znaczy „dekoder trafia w procent gry”. */
  rozjazdy: string[];
  /** Ile porównań FAKTYCZNIE się odbyło. */
  sprawdzonych: number;
  /** Ile odpadło przez nieznane `hp.max` — powód NIEDOZWOLONY, patrz test. */
  bezMaksa: number;
  /** Ile odpadło przez wcześniejsze uleczenie celu — powód dozwolony. */
  poLeczeniu: number;
};

/**
 * ŚWIADEK DEKODERA SPOZA DEKODERA — porównanie procentu życia z sumą obrażeń.
 *
 * ⚠️ **STAŁ W CIELE TESTU I DLATEGO JEDNEJ JEGO CZĘŚCI NIE DAŁO SIĘ SPRAWDZIĆ**
 * (`AUDYT‑61`). Materiał, który mamy, nie zawiera leczenia w środku walki, więc
 * obsługa leczenia była kodem bez ani jednego świadka — zdjęcie jej niczego nie
 * zapalało. Wyciągnięta tutaj, dostaje test na zdarzeniach zbudowanych w kodzie,
 * niezależny od tego, co akurat leży w `tests/fixtures/`.
 *
 * Pełny opis konstrukcji, tolerancji i granic stoi przy teście, który tę funkcję
 * woła — tam, gdzie czyta go ktoś patrzący na wynik.
 */
export function swiadekZycia(
  zdarzenia: readonly BattleEvent[],
  maks: Map<number, number>,
): WynikSwiadka {
  const rozjazdy: string[] = [];
  const zebrane = new Map<number, number>();
  // Cele, dla których BAZA przestała być znana. Uleczenie przesuwa punkt
  // odniesienia dla każdego późniejszego porównania tego celu, a log nie mówi,
  // ile z leczenia weszło (nadmiar gra ucina). Doliczanie `amount` byłoby
  // dokładne tylko pozornie — to jest ta sama reguła co wszędzie indziej:
  // nie udawaj danych, których log nie ma.
  const uleczeni = new Set<number>();
  let sprawdzonych = 0;
  let bezMaksa = 0;
  let poLeczeniu = 0;

  for (const z of zdarzenia) {
    if (z.kind === "heal" && z.targetId !== undefined) uleczeni.add(z.targetId);

    let id: number | undefined;
    let kwota = 0;
    let hpp: number | null = null;
    if (z.kind === "attack" && z.targetId !== undefined) {
      id = z.targetId;
      kwota = z.hits.reduce((s, h) => s + (h.dodged ? 0 : h.applied), 0);
      hpp = z.targetHpPct;
    } else if (z.kind === "dot" && z.targetId !== undefined) {
      id = z.targetId;
      kwota = z.amount;
      hpp = z.targetHpPct;
    }
    if (id === undefined || hpp === null) continue;

    zebrane.set(id, (zebrane.get(id) ?? 0) + kwota);
    // Cel, który padł, wypada: protokół podaje wtedy `0.00`, a przebicie ponad
    // pulę życia nie ma jak być widoczne. Porównanie byłoby fałszywe w obie
    // strony i zapalałoby się na POPRAWNYM dekoderze.
    if (hpp <= 0) continue;

    // Od tego miejsca zdarzenie nadawało się do porównania, więc każdy powód,
    // dla którego się nie odbywa, ma własny licznik i własną nazwę.
    if (uleczeni.has(id)) {
      poLeczeniu += 1;
      continue;
    }
    const max = maks.get(id);
    if (max === undefined || max <= 0) {
      bezMaksa += 1;
      continue;
    }

    const suma = zebrane.get(id)!;
    const oczekiwany = ((max - suma) / max) * 100;
    sprawdzonych += 1;
    // Tolerancja 0,02 punktu procentowego, bo gra podaje procent zaokrąglony do
    // dwóch miejsc — nie dlatego, że coś się nie zgadza.
    if (Math.abs(oczekiwany - hpp) > 0.02) {
      rozjazdy.push(`id=${id}: ${oczekiwany.toFixed(2)}% ≠ ${hpp}% (max ${max}, suma ${suma})`);
    }
  }

  return { rozjazdy, sprawdzonych, bezMaksa, poLeczeniu };
}
