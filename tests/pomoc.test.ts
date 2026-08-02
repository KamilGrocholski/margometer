import { describe, expect, test } from "bun:test";
import { fragmenty, odtaguj, wiek } from "../tools/pomoc.ts";

/**
 * Sonda po oficjalnej pomocy gry nie miała ani jednego testu — mimo dwóch
 * czystych funkcji w środku i mimo tego, że stoi na niej CAŁA procedura
 * z `docs/MECHANIKA.md`. Powód był mechaniczny: plik wykonywał CLI przy samym
 * imporcie, więc testu nie dało się napisać. Bramka `import.meta.main` zdjęła
 * tę przeszkodę (`AUDYT-43`).
 *
 * Czego te testy pilnują: nie tego, co mówi pomoc gry (to zmienia się poza nami
 * i ma własny rejestr), tylko tego, żeby sonda nie ZGUBIŁA trafienia ani nie
 * podała cudzego. Fałszywy negatyw tego narzędzia zamyka temat w repo —
 * zdarzyło się dwa razy.
 */
describe("odtaguj", () => {
  test("treść skryptów i styli nie zostaje w wyniku", () => {
    // Klasa błędu wprost: szukane słowo trafiłoby w kod strony i sonda
    // zaraportowałaby „jest", pokazując fragment JavaScriptu.
    const html = `<p>Blok obniża obrażenia.</p>
      <script>var blok = "blok blok blok";</script>
      <style>.blok { color: red }</style>`;
    const tekst = odtaguj(html);
    expect(tekst).toContain("Blok obniża obrażenia.");
    expect(tekst).not.toContain("var");
    expect(tekst).not.toContain("color: red");
  });

  test("encje wracają do znaków, a białe znaki zwijają się do spacji", () => {
    expect(odtaguj("<p>a&nbsp;&amp;&nbsp;b</p>")).toBe("a & b");
    expect(odtaguj("<p>x</p>\n\n\n<p>y</p>")).toBe("x y");
  });

  test("tekst rozbity znacznikami nie skleja się w jedno słowo", () => {
    // Bez spacji w miejscu tagu „blok<em>ada</em>" dałoby „blokada" i sonda
    // meldowałaby trafienie na frazę, której w treści nie ma.
    expect(odtaguj("<p>blok<em>ada</em></p>")).toBe("blok ada");
  });
});

describe("fragmenty", () => {
  const tekst = `Unik ( evade ) opisuje szansę na uniknięcie ciosu. ${"x".repeat(500)} ` +
    `Przedmiot unikatowy nie ma z tym nic wspólnego. ${"y".repeat(500)} ` +
    `Blok ( blok ) wymaga tarczy.`;

  test("brak trafienia daje pustą listę, nie wyjątek", () => {
    // „Nie znaleziono" jest odpowiedzią, którą CLI przepisuje do rejestru —
    // musi wychodzić z tej funkcji jako zwykły wynik.
    expect(fragmenty(tekst, "Zaklęcie ( spell )", 420, 6)).toEqual([]);
  });

  test("szuka bez względu na wielkość liter", () => {
    expect(fragmenty(tekst, "BLOK ( BLOK )", 420, 6)).toHaveLength(1);
  });

  test("limit obcina liczbę fragmentów, nie ich treść", () => {
    // Przekładki dłuższe niż okno kontekstu (420 + 140), żeby trafienia NIE
    // nakładały się na siebie — inaczej mierzylibyśmy odsiewanie, nie limit.
    const duzo = Array.from({ length: 10 }, (_, i) => `${"z".repeat(700)} igła numer ${i}`).join(
      " ",
    );
    expect(fragmenty(duzo, "igła", 420, 3)).toHaveLength(3);
    expect(fragmenty(duzo, "igła", 420, 20)).toHaveLength(10);
  });

  test("trafienia z tego samego wycinka dają JEDEN fragment", () => {
    // Bez odsiewania powtórzeń ten sam akapit wypisałby się tyle razy, ile ma
    // w sobie szukanego słowa — i wypchnął prawdziwe trafienie z innego miejsca
    // artykułu poza limit.
    expect(fragmenty("unik unik unik", "unik", 420, 6)).toHaveLength(1);
  });

  test("ta sama treść PRZED trafieniami nie kasuje drugiego trafienia", () => {
    // Odsiewanie szło kiedyś po pierwszych 60 znakach fragmentu. Gdy przed
    // dwoma trafieniami stoi ta sama treść — tabela, powtórzony nagłówek —
    // klucze wychodziły identyczne i drugie trafienie znikało jako
    // „powtórzenie", choć jest z zupełnie innego miejsca artykułu.
    // Przedrostek musi być dłuższy niż okno kontekstu wstecz (140 znaków),
    // inaczej pierwszy wycinek zaczyna się od początku tekstu, drugi od środka
    // przedrostka — i klucze różnią się z powodu, którego w artykule nie ma.
    const przedrostek = "Tabela statystyk. ".repeat(10);
    const tekst = `${przedrostek}igła pierwsza.${"-".repeat(900)}${przedrostek}igła druga.`;
    const wynik = fragmenty(tekst, "igła", 420, 6);
    expect(wynik).toHaveLength(2);
    expect(wynik[0]).toContain("igła pierwsza");
    expect(wynik[1]).toContain("igła druga");
  });

  test("fragment niesie kontekst PRZED trafieniem, nie tylko po nim", () => {
    // Zdanie urwane od słowa kluczowego nie nadaje się na cytat do rejestru.
    const [fragment] = fragmenty(tekst, "Blok ( blok )", 420, 1);
    expect(fragment).toContain("Blok ( blok ) wymaga tarczy.");
    expect(fragment!.startsWith("Blok")).toBe(false);
  });
});

describe("wiek zrzutu", () => {
  const teraz = new Date("2026-08-02T10:00:00Z");

  test("świeże pobranie mówi to wprost", () => {
    expect(wiek(null, teraz)).toBe("świeżo pobrane");
  });

  test("dzisiejszy i wczorajszy zrzut nazywają się różnie", () => {
    expect(wiek(new Date("2026-08-02T08:00:00Z"), teraz)).toContain("dzisiejszy");
    expect(wiek(new Date("2026-08-01T08:00:00Z"), teraz)).toContain("sprzed doby");
  });

  test("data zrzutu jest w wyniku i podpisana strefą", () => {
    // Bez „UTC" godzina rozjeżdża się z tym, co pokazuje `ls`, i wygląda na
    // pomyłkę narzędzia.
    expect(wiek(new Date("2026-07-20T08:30:00Z"), teraz)).toContain("2026-07-20 08:30 UTC");
  });

  test("zrzut sprzed tygodnia SAM prosi o odświeżenie", () => {
    // To jest cała treść tej funkcji: rejestr `MECHANIKA.md` stoi na cytatach
    // z tej sondy, a data przy wpisie mówi, kiedy PYTANO, nie z kiedy jest
    // treść. Stary zrzut wyglądał identycznie jak świeży.
    expect(wiek(new Date("2026-07-26T10:00:00Z"), teraz)).toContain("--odswiez");
    expect(wiek(new Date("2026-07-29T10:00:00Z"), teraz)).not.toContain("--odswiez");
  });
});
