import { Glob } from "bun";
import { describe, expect, test } from "bun:test";
import { czytajZrzut, komunikaty, skladZeZrzutu } from "../tools/walka.ts";
import { dekoduj } from "../src/protokol.ts";
import { parse } from "../src/parser.ts";
import { rozjazdy } from "../src/rozjazd.ts";
import { Session } from "../src/session.ts";

/**
 * ORAKULUM — liczby parsera przeciw czemuś SPOZA parsera.
 *
 * Etap 2 z `docs/specy/2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md`.
 *
 * PO CO. Dziś każdy test w tym repo pyta repo o zgodność z samym sobą.
 * Niezmienniki („każda linia rozpoznana", „rozbicia sumują się do skalarów")
 * są mocne, ale były ZIELONE także wtedy, gdy `mergeStats` gubiło sumy
 * (`AUDYT‑6`) — bo gubiło je spójnie. Walka zapisana OBIEMA drogami jest
 * jedynym materiałem, który tego nie wybacza: protokół i tekst powstają
 * w grze niezależnie i nie mają jak się wspólnie pomylić.
 *
 * ⚠️ **TEN PLIK MA PRAWO ZAPALIĆ SIĘ NA CZERWONO PRZY PIERWSZYM FIXTURZE
 * I TO JEST JEGO ZADANIE, NIE AWARIA.** Dekoder protokołu powstał bez ani
 * jednej walki do sprawdzenia (`src/protokol.ts`: „to jest najmniej pewna
 * warstwa"). Pierwsza para powie, gdzie się myli — i wtedy poprawia się
 * DEKODER albo, jeśli to on ma rację, parser. **Czego nie wolno zrobić, to
 * poluzować asercji, żeby przeszło**: fixture'a się nie edytuje pod test,
 * a testu pod fixture'a.
 *
 * CO JEST CZYM. `raw.txt` to tekst z „Kopiuj logi" — dokładnie to, co gra
 * pokazała graczowi. `protokol.json` to ładunki `Engine.battle.update` z tej
 * samej walki, zebrane `tools/walka-probe.js`. Jak dołożyć parę: nagłówek
 * tamtego pliku.
 */

const KORPUS = new URL("./fixtures/", import.meta.url).pathname;

const pary = await Promise.all(
  [...new Glob("*/*/protokol.json").scanSync(KORPUS)].map(async (sciezka) => {
    const katalog = sciezka.replace("/protokol.json", "");
    const zrzut = czytajZrzut(await Bun.file(`${KORPUS}${sciezka}`).text());
    const plikTekstu = Bun.file(`${KORPUS}${katalog}/raw.txt`);
    return {
      nazwa: katalog,
      zrzut,
      tekst: (await plikTekstu.exists()) ? await plikTekstu.text() : null,
    };
  }),
);

describe("orakulum: korpus", () => {
  test("ile par mamy — i głośno, gdy zero", () => {
    // `test.each` po pustej tablicy jest ZIELONY I PUSTY, czyli dokładnie ten
    // kształt, przed którym ostrzega AGENTS.md. Ten test istnieje po to, żeby
    // stan „nie ma czego sprawdzać" był widoczny w wyjściu, a nie udawał
    // przechodzącego pokrycia.
    if (pary.length === 0) {
      console.warn(
        "[orakulum] zero par tekst↔protokół — ten plik NIC DZIŚ NIE DOWODZI.\n" +
          "           Jak dołożyć: nagłówek tools/walka-probe.js.",
      );
    }
    expect(pary.length).toBeGreaterThanOrEqual(0);
  });

  test.each(pary)("$nazwa — ma OBIE strony pary", ({ tekst }) => {
    // Sam `protokol.json` bez `raw.txt` nie jest parą i nie da się z niego
    // zrobić orakulum. Pada głośno, zamiast cicho wypaść z porównań niżej.
    expect(tekst).not.toBeNull();
  });
});

describe.each(pary.filter((p) => p.tekst !== null))("orakulum: $nazwa", (para) => {
  const tekst = para.tekst as string;
  const sklad = skladZeZrzutu(para.zrzut);
  const wiadomosci = komunikaty(para.zrzut.wpisy);

  const zProtokolu = () => {
    const sesja = new Session();
    sesja.updateEvents(dekoduj(wiadomosci, sklad), sklad);
    return sesja.current();
  };
  const zTekstu = () => {
    const sesja = new Session();
    sesja.update(tekst, sklad);
    return sesja.current();
  };

  test("protokół nie zawiera ani jednego nierozpoznanego klucza", () => {
    // Tabela ról jest domknięta na ZAMROŻONEJ liście etykiet, ale zamrożenie
    // opisuje build, nie tę walkę. Prawdziwy zrzut jest pierwszym miejscem,
    // w którym da się sprawdzić, czy gra przysyła to, co lista obiecuje.
    const nieznane = dekoduj(wiadomosci, sklad).filter((z) => z.kind === "unknown");
    expect(nieznane.map((z) => (z.kind === "unknown" ? z.line : ""))).toEqual([]);
  });

  test("obie drogi widzą te same postacie", () => {
    // Przed porównaniem liczb: jeśli składy się różnią, `rozjazdy` po cichu
    // pomija różniące się nazwy i porównanie robi się słabsze, niż wygląda.
    const nazwy = (s: ReturnType<typeof zTekstu>) => s.actors.map((a) => a.name).sort();
    expect(nazwy(zProtokolu())).toEqual(nazwy(zTekstu()));
  });

  test("skalary zgadzają się co do jednego punktu", () => {
    // Sedno pliku. Porównanie idzie tą samą funkcją, co czujka w panelu, więc
    // czerwień tutaj znaczy dokładnie tyle, co ostrzeżenie u gracza.
    expect(rozjazdy(zTekstu(), zProtokolu())).toEqual([]);
  });

  test("suma obrażeń zadanych zgadza się globalnie", () => {
    // Osobno od porównania per postać: gdyby dekoder przypisywał obrażenia
    // złej postaci, tamto by się zapaliło, a to nie — i różnica między tymi
    // dwoma wynikami mówi, czy pomyłka jest w LICZENIU, czy w PRZYPISANIU.
    const suma = (s: ReturnType<typeof zTekstu>) =>
      s.actors.reduce((acc, a) => acc + a.damageDealt, 0);
    expect(suma(zProtokolu())).toBe(suma(zTekstu()));
  });

  test("tekst i protokół opisują tę samą walkę", () => {
    // Strażnik na pomyłkę przy składaniu fixture'a: `raw.txt` z innej walki niż
    // `protokol.json` dałby rozjazdy wyglądające na błąd dekodera. Nazwy ze
    // składu muszą padać w tekście, bo linia otwierająca je wymienia.
    for (const wojownik of sklad) expect(tekst).toContain(wojownik.name);
  });

  test("parser tekstu nie ma nierozpoznanych linii", () => {
    // Kontrola strony przeciwnej: gdyby to tekst był nieczytelny, rozjazdy
    // wyżej obciążałyby protokół bez powodu.
    expect(parse(tekst).filter((z) => z.kind === "unknown")).toEqual([]);
  });
});
