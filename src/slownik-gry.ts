/**
 * Brzmienia z gry, a nie z naszego kodu.
 *
 * PO CO. Dekoder protokołu zna KLUCZE (`+pierce`, `-blok`), a panel ma pokazać
 * ZDANIA („+Przebicie", „-Zablokowanie N obrażeń"). Do 2026‑08‑04 do `procs`
 * szedł surowy klucz, więc gracz widziałby `+pierce`. Alternatywą było zaszycie
 * 200 polskich zdań w userscripcie — i to jest wariant odrzucony: brzmienia
 * należą do gry, zmieniają się z jej aktualizacją i zależą od języka klienta.
 * Kopia w naszym kodzie zestarzałaby się po cichu.
 *
 * SKĄD BIERZEMY. Strona gry ma globalne `window._t(identyfikator, parametry)`
 * — tę samą funkcję, którą renderer walki składa swoje zdania
 * (`core/Translations.js:338`). Wołamy ją i bierzemy wynik.
 *
 * ⚠️ **CZEGO NIE DA SIĘ ZROBIĆ, i dlatego mapa kluczy zostaje w repo.** Samego
 * słownika nie da się z dodatku wylistować: `const _dict = __translations` jest
 * domknięty w module, a w zminifikowanym bundlu to lokalne `r`. `_t` potrafi
 * ROZWIĄZAĆ znany identyfikator i nic ponad to.
 *
 * ⚠️ **WOŁAMY WYŁĄCZNIE IDENTYFIKATORY, KTÓRE ZNAMY.** Przy chybieniu klient
 * wrzuca identyfikator do kolejki i po 500 ms woła funkcję raportującą braki.
 * Jej ciało jest zakomentowane — w źródle dev wprost, a w produkcyjnym bundlu
 * nie ma ciągu `messages/add` w ogóle (sprawdzone 2026‑08‑04) — więc dziś nic
 * nie wychodzi na sieć. To jest jednak stan cudzego kodu, nie nasza gwarancja,
 * a obietnica „nie wysyła zapytań" z `AGENTS.md` jest nasza. Dlatego dekoder
 * pyta wyłącznie o identyfikatory z zamrożonej tabeli.
 */

/** Globalne gry, których dotykamy. Osobno od `GameGlobals` w `roster.ts` — tam chodzi o `Engine`. */
export type TranslationGlobals = {
  _t?: (identyfikator: string, parametry?: Record<string, string>) => string | undefined;
};

export type Slownik = {
  /** Zdanie dla identyfikatora albo `null`, gdy gra go nie zna. */
  zdanie(identyfikator: string, parametry?: Record<string, string>): string | null;
};

/**
 * Czyta `window._t` ze strony gry.
 *
 * Defensywnie jak `src/roster.ts:79‑119`: dostęp do wnętrzności gry potrafi
 * rzucić przy zmianie kontekstu strony, a `_t` przy chybieniu zwraca
 * `undefined`, nie rzuca.
 */
export class SlownikGry implements Slownik {
  constructor(private readonly window: TranslationGlobals) {}

  zdanie(identyfikator: string, parametry?: Record<string, string>): string | null {
    try {
      const tlumacz = this.window._t;
      if (typeof tlumacz !== "function") return null;
      const wynik = tlumacz(identyfikator, parametry);
      // Pusty ciąg to nie to samo, co brak: gra ma klucze renderowane jako nic.
      // Ale dla panelu pusta etykieta jest bezużyteczna, więc traktujemy ją
      // jak brak i czytelnik zostaje przy kluczu, który przynajmniej coś znaczy.
      return typeof wynik === "string" && wynik !== "" ? wynik : null;
    } catch {
      return null;
    }
  }
}

/**
 * Słownik z zamrożonej tabeli — testy i archiwum.
 *
 * Istnieje, bo poza stroną gry `window._t` nie ma, a zdarzenia trzeba umieć
 * odczytać także z nagrania sprzed tygodnia i w teście bez przeglądarki.
 * Tabelę zamraża `bun tools/slownik.ts --zamroz` do `tests/klucze-protokolu.ts`.
 */
export class SlownikStaly implements Slownik {
  private readonly wpisy: ReadonlyMap<string, string>;

  constructor(wpisy: Iterable<readonly [string, string]>) {
    this.wpisy = new Map(wpisy);
  }

  zdanie(identyfikator: string, parametry?: Record<string, string>): string | null {
    const szablon = this.wpisy.get(identyfikator);
    if (szablon === undefined) return null;
    return parametry === undefined ? szablon : podstaw(szablon, parametry);
  }
}

/**
 * Podstawienie parametrów w szablonie — odwzorowanie `getTranslationsWithParameters`.
 *
 * Gra podmienia dosłownie, `replaceAll` po kluczu parametru (`%val%`, `%name%`),
 * bez wyrażeń regularnych. Robimy tak samo, żeby nazwa postaci zawierająca
 * znaki specjalne regexa nie wywróciła podstawienia — a nicki w tej grze
 * potrafią zawierać nawiasy i kropki.
 */
function podstaw(szablon: string, parametry: Record<string, string>): string {
  let wynik = szablon;
  for (const [nazwa, wartosc] of Object.entries(parametry)) {
    wynik = wynik.replaceAll(nazwa, wartosc);
  }
  return wynik;
}

/**
 * Słownik, który nic nie wie — dla ścieżek, gdzie brzmienia nie są potrzebne.
 *
 * Nie jest zaślepką „na wszelki wypadek": czytelnik dostający `null` zostaje
 * przy kluczu protokołu, a klucz jest PRAWDĄ. Zmyślone brzmienie nie byłoby.
 */
export const BEZ_SLOWNIKA: Slownik = { zdanie: () => null };
