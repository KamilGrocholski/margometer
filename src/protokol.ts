/**
 * Protokół silnika walki — surowe komunikaty serwera, zanim gra zrobi z nich
 * zdania.
 *
 * DRUGIE ŹRÓDŁO, NIE ZAMIENNIK. `src/parser.ts` czyta tekst z okna walki i tak
 * zostaje: nagrania są surowym tekstem, a wklejka z „Kopiuj logi" innej drogi
 * nie ma. Ten plik czyta to, co gra dostaje OD SERWERA, i istnieje po to, żeby
 * dało się zapytać, czy obie drogi liczą to samo. Projekt i powody:
 * `docs/specy/2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md`.
 *
 * KSZTAŁT KOMUNIKATU. Jedna linia protokołu wygląda tak:
 *
 *     id[=hpp];id[=hpp];klucz[=wartość];klucz[=wartość];flaga;…
 *
 * Dwa pierwsze segmenty to strony — nadawca i cel — reszta to parametry.
 * Wszystko poniżej odwzorowuje `battleMsg` z `core/battle/BattleMessages.js`
 * (build deweloperski 1781609507010, czytany przez `bun tools/zrodla.ts`),
 * bo to jedyna implementacja tego formatu, jaka istnieje, i lepiej ją odwzorować
 * niż wymyślić własną interpretację obok.
 *
 * TEN PLIK NIE DOTYKA GRY. Zero globali, zero DOM — wejściem są stringi.
 * Owinięcie `Engine.battle.update` siedzi osobno, w `src/protokol-source.ts`,
 * żeby jedyne miejsce łamiące obietnicę „nie dotykamy stanu gry" było widoczne
 * w drzewie plików, a nie schowane w środku modułu.
 */

/**
 * Strona komunikatu: identyfikator wojownika i jego życie w setnych procenta.
 *
 * `hpp` jest `null`, gdy segment niesie samo id bez `=` — gra wtedy życia nie
 * aktualizuje (`dotHp` zostaje `false`), więc my też nie mamy czego podać.
 */
export type Strona = { id: number; hpp: number | null };

/**
 * Jeden parametr komunikatu.
 *
 * `wartosc === null` to parametr-FLAGA, czyli segment bez `=` (`+pierce`, `r`,
 * `x`). Pusty ciąg to co innego — `klucz=` z wartością pustą — i te dwie rzeczy
 * trzeba rozróżniać, bo gra je rozróżnia (`m[1]` jest wtedy `undefined` kontra
 * `""`).
 *
 * `surowy` to cały segment w oryginale, dokładnie ten, który gra wkleja
 * w „Nieznany parametr" (`_t('msg_unknown_prameter %val%', {'%val%': msg[k]})`,
 * `BattleMessages.js:1117`). Nasza czujka `unknown` ma podać to samo — cytat,
 * a nie własną rekonstrukcję segmentu z klucza i wartości.
 *
 * `obciete` znaczy „w segmencie stał DRUGI `=`". Gra bierze wyłącznie `m[0]`
 * i `m[1]` (`BattleMessages.js:176`), więc resztę gubi — i my gubimy zgodnie,
 * bo odwzorowujemy grę, a nie poprawiamy ją. Ale gubimy GŁOŚNO: skoro gra też
 * coś tu obcina, to znaczy, że format niesie kształt, którego nikt z nas nie
 * przewidział, i lepiej się o tym dowiedzieć od czujki niż od złej liczby.
 */
export type Parametr = {
  klucz: string;
  wartosc: string | null;
  surowy: string;
  obciete: boolean;
};

export type Komunikat = {
  nadawca: Strona | null;
  cel: Strona | null;
  parametry: Parametr[];
};

/**
 * Segment strony → `Strona` albo `null`.
 *
 * TRZY RZECZY SĄ TU ODWZOROWANIEM GRY, NIE WYBOREM:
 *
 * 1. **`indexOf("=") > 0`, nie `!== -1`.** Tak stoi w `BattleMessages.js:124`.
 *    ⚠️ **Tu akurat jedno od drugiego NIE DA SIĘ odróżnić wynikiem** i wiadomo
 *    to z mutacji, nie z domysłu: przy segmencie zaczynającym się od `=` gałąź
 *    z `> 0` liczy `parseInt("=5")`, a gałąź z `!== -1` liczy `parseInt("")` —
 *    obie dają `NaN`, czyli brak strony. Zostaje `> 0`, żeby ta funkcja dała
 *    się czytać obok źródła gry linia w linię, ale **żaden test tego nie pilnuje
 *    i nie ma udawać, że pilnuje**. Gdyby ktoś to uprościł, nic się nie zapali.
 * 2. **`parseInt`, nie `Number`.** `parseInt("103655abc")` daje 103655, a
 *    `Number` dałoby `NaN`. Odwzorowujemy pierwsze.
 * 3. **`id === 0` to BRAK STRONY, nie wojownik o numerze zero.** Gra sprawdza
 *    `if (id1)` i przy zerze podstawia atrapę zamiast wojownika
 *    (`BattleMessages.js:145‑153`). Zwracamy `null`, żeby nie dało się tych
 *    dwóch rzeczy pomylić — to ta sama decyzja co w `tools/walka.ts`, tam
 *    opisana przy `stronyKomunikatu`.
 *
 * `NaN` traktujemy jak zero, bo gra też: `if (NaN)` jest fałszem.
 */
function strona(segment: string | undefined): Strona | null {
  if (segment === undefined) return null;

  const zRownaniem = segment.indexOf("=") > 0;
  const id = Number.parseInt(zRownaniem ? segment.slice(0, segment.indexOf("=")) : segment, 10);
  if (!Number.isFinite(id) || id === 0) return null;

  if (!zRownaniem) return { id, hpp: null };
  const hpp = Number(segment.slice(segment.indexOf("=") + 1));
  return { id, hpp: Number.isFinite(hpp) ? hpp : null };
}

/**
 * Rozbiór komunikatu na strony i parametry. Składnia, zero semantyki.
 *
 * **BEZ TRYBU PORAŻKI — każdy string daje `Komunikat`, choćby pusty.** Gra też
 * go nie ma: `msg.split(';')` nie zawodzi, a `msg.splice(0, 2)` na krótkiej
 * tablicy po prostu nic nie zdejmuje. Porażka ma być widoczna nie tutaj, tylko
 * PIĘTRO WYŻEJ, na nierozpoznanym kluczu — czyli tam, gdzie da się powiedzieć,
 * czego konkretnie nie rozumiemy. Rozbiór, który rzuca, zamieniłby jeden
 * nieznany klucz w utratę całego komunikatu.
 *
 * To ta sama zasada, co „leksyka totalna" w
 * `docs/specy/2026-08-03-parser-tokenizer-i-gramatyka.md` — tyle że po stronie
 * protokołu wychodzi za darmo, bo format jest pozycyjny, a nie zdaniowy.
 */
export function rozbierz(komunikat: string): Komunikat {
  const segmenty = komunikat.split(";");
  return {
    nadawca: strona(segmenty[0]),
    cel: strona(segmenty[1]),
    parametry: segmenty.slice(2).map(parametr),
  };
}

function parametr(surowy: string): Parametr {
  const pierwszy = surowy.indexOf("=");
  if (pierwszy === -1) return { klucz: surowy, wartosc: null, surowy, obciete: false };

  const reszta = surowy.slice(pierwszy + 1);
  const drugi = reszta.indexOf("=");
  return {
    klucz: surowy.slice(0, pierwszy),
    wartosc: drugi === -1 ? reszta : reszta.slice(0, drugi),
    surowy,
    obciete: drugi !== -1,
  };
}

/**
 * Wartość wieloczłonowa: gra rozdziela przecinkiem (`m[1].split(',')`) i sięga
 * po `multi[0]`, `multi[1]` — na przykład przy `heal`, `wound`, `anguish`.
 *
 * ⚠️ **Co znaczy druga liczba, nie wiadomo** i tego nie rozstrzyga ani źródło
 * renderera, ani słownik: widać tylko, że przy dwóch wartościach idzie inny
 * szablon zdania. Dlatego ta funkcja niczego nie interpretuje — oddaje człony
 * i zostawia decyzję czytelnikowi, który musi ją podjąć jawnie.
 */
export function czlony(wartosc: string | null): string[] {
  return wartosc === null || wartosc === "" ? [] : wartosc.split(",");
}

/**
 * Liczba z parametru albo `null`.
 *
 * `Number.parseInt` po to samo, co przy id: gra wszędzie w `battleMsg` traktuje
 * wartości liczbowe przez `parseInt`/arytmetykę na stringu, a nie przez ścisłą
 * konwersję. Wartość, której nie da się odczytać jako liczby, ma dać `null`
 * i zapalić czujkę u czytelnika — nie zero, bo zero jest poprawną liczbą
 * obrażeń i zlanie tych dwóch przypadków ukryłoby zmianę formatu.
 */
export function liczba(wartosc: string | null): number | null {
  if (wartosc === null || wartosc.trim() === "") return null;
  const n = Number.parseInt(wartosc, 10);
  return Number.isFinite(n) ? n : null;
}
