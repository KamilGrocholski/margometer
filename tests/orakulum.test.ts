import { Glob } from "bun";
import { describe, expect, test } from "bun:test";
import {
  czytajZrzut,
  komunikaty,
  skladZeZrzutu,
  type Zrzut,
} from "../tools/walka.ts";
import {
  identyfikatoryZeZamrozenia,
  slownikZeZamrozenia,
  type Zamrozenie,
} from "../tools/slownik.ts";
import { odtworz } from "../tools/odtworz.ts";
import { dekoduj } from "../src/protokol.ts";
import { parse } from "../src/parser.ts";
import { pustyOdczyt, rozjazdy } from "../src/rozjazd.ts";
import { Session } from "../src/session.ts";
import { zrodloPanelu } from "../src/index.ts";

/**
 * ORAKULUM — liczby dekodera przeciw czemuś SPOZA dekodera.
 *
 * Etap 2 z `docs/specy/2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md`.
 *
 * PO CO. Każdy inny test w tym repo pyta repo o zgodność z samym sobą.
 * Niezmienniki („każda linia rozpoznana", „rozbicia sumują się do skalarów")
 * były ZIELONE także wtedy, gdy `mergeStats` gubiło sumy (`AUDYT‑6`) — bo
 * gubiło je spójnie.
 *
 * SKĄD BIERZE SIĘ DRUGA STRONA, od 2026‑08‑04. Nie ze złapanego logu, tylko
 * **ze słownika gry**: klucz protokołu → identyfikator `_t` → szablon zdania →
 * `tools/odtworz.ts` składa z tego blok tekstu → `parse` czyta go tak samo jak
 * okno walki. Materiałem jest sam `protokol.json`; nikt nie musi klikać
 * „Kopiuj logi", a fixture nie potrzebuje ani `raw.txt`, ani `log.html`.
 *
 * ⚠️ **DLACZEGO TO NIE JEST KRĘCENIE SIĘ W KÓŁKO.** Obie strony wychodzą z tego
 * samego komunikatu, ale idą przez **rozłączny kod**: `dekoduj` czyta klucze
 * i buduje zdarzenia wprost, a druga strona składa ZDANIE z szablonów gry
 * i przepuszcza je przez `parser.ts`, który o protokole nie wie nic. Wspólne
 * jest wejście, nie rozumowanie — a błąd w rozumieniu klucza rozjeżdża strony.
 * Czego ten test NIE złapie: pomyłki w samym szablonie, bo obie strony ufają
 * tej samej zamrożonej tabeli.
 *
 * ⚠️ **MA PRAWO ZAPALIĆ SIĘ NA CZERWONO** przy nowym fixturze i to jest jego
 * zadanie. Wtedy poprawia się dekoder albo odtwarzanie — **nie asercję**.
 */

const KORPUS = new URL("./fixtures/", import.meta.url).pathname;

const ZAMROZONE = (await Bun.file(`${KORPUS}klucze-protokolu.json`).json()) as Zamrozenie;
const SLOWNIK = slownikZeZamrozenia(ZAMROZONE);
const IDENTYFIKATORY = identyfikatoryZeZamrozenia(ZAMROZONE);

type Para = { nazwa: string; zrzut: Zrzut; tekst: string | null };

const pary: Para[] = await Promise.all(
  [...new Glob("*/*/protokol.json").scanSync(KORPUS)].map(async (sciezka) => {
    const katalog = sciezka.replace("/protokol.json", "");
    const plikTekstu = Bun.file(`${KORPUS}${katalog}/raw.txt`);
    return {
      nazwa: katalog,
      zrzut: czytajZrzut(await Bun.file(`${KORPUS}${sciezka}`).text()),
      tekst: (await plikTekstu.exists()) ? await plikTekstu.text() : null,
    };
  }),
);

describe("orakulum: korpus", () => {
  test("ile walk protokołowych mamy — i głośno, gdy zero", () => {
    // `test.each` po pustej tablicy jest ZIELONY I PUSTY, czyli dokładnie ten
    // kształt, przed którym ostrzega AGENTS.md.
    if (pary.length === 0) {
      console.warn(
        "[orakulum] zero walk protokołowych — ten plik NIC DZIŚ NIE DOWODZI.\n" +
          "           Jak dołożyć: nagłówek tools/walka-probe.js.",
      );
    }
    expect(pary.length).toBeGreaterThanOrEqual(0);
  });
});

describe.each(pary)("orakulum: $nazwa", (para) => {
  const sklad = skladZeZrzutu(para.zrzut);
  const nazwy = new Map(sklad.map((w) => [w.id, w.name]));
  const wiadomosci = komunikaty(para.zrzut.wpisy);
  const kontekst = { nazwy, identyfikatory: IDENTYFIKATORY, slownik: SLOWNIK };

  const zProtokolu = () => {
    const sesja = new Session();
    sesja.updateEvents(dekoduj(wiadomosci, sklad, SLOWNIK), sklad);
    return sesja.current();
  };

  test("każdy klucz protokołu jest rozpoznany", () => {
    // Tabela ról jest domknięta na ZAMROŻONEJ liście, ale zamrożenie opisuje
    // build, nie tę walkę. Prawdziwy zrzut jest jedynym miejscem, w którym da
    // się sprawdzić, czy gra przysyła to, co lista obiecuje.
    const nieznane = dekoduj(wiadomosci, sklad, SLOWNIK).filter((z) => z.kind === "unknown");
    expect(nieznane.map((z) => (z.kind === "unknown" ? z.line : ""))).toEqual([]);
  });

  test("każdy komunikat daje się odtworzyć ze słownika gry", () => {
    // Komunikat nieodtworzony wypadłby z porównania niżej, więc bez tego testu
    // niezmiennik robiłby się słabszy w miarę, jak gra dokłada klucze — i nikt
    // by tego nie zauważył, bo pozostałe testy dalej by przechodziły.
    const wynik = odtworz(wiadomosci, kontekst);
    expect(wynik.nieodtworzone).toEqual([]);
    expect(wynik.pominiete).toBe(0);
  });

  test("odtworzone zdania są dla parsera CZYTELNE", () => {
    // Odtworzenie, którego `parse` nie rozumie, dałoby puste zdarzenia i zerowy
    // rozjazd — czyli zielony test bez treści.
    const tekst = odtworz(wiadomosci, kontekst).tekst;
    const nieznane = parse(tekst).filter((z) => z.kind === "unknown");
    expect(nieznane.map((z) => (z.kind === "unknown" ? z.line : ""))).toEqual([]);
  });

  test("dekoder i odtworzone zdania dają TE SAME liczby", () => {
    // Sedno pliku, i porównanie idzie tą samą funkcją, co czujka w panelu —
    // więc czerwień tutaj znaczy dokładnie tyle, co ostrzeżenie u gracza.
    const sesja = new Session();
    sesja.updateEvents(parse(odtworz(wiadomosci, kontekst).tekst), sklad);
    expect(rozjazdy(sesja.current(), zProtokolu())).toEqual([]);
  });

  test("zdarzenia nie są puste — inaczej zgodność wyżej nic nie znaczy", () => {
    const zdarzenia = dekoduj(wiadomosci, sklad, SLOWNIK);
    expect(zdarzenia.filter((z) => z.kind === "attack").length).toBeGreaterThan(0);
  });
});

/**
 * ZŁAPANY LOG — dodatkowy świadek, gdy akurat jest.
 *
 * Nowy parser go NIE POTRZEBUJE: niezmiennik wyżej stoi na samym protokole
 * i słowniku gry. Ale `raw.txt` pochodzi z gry W CAŁOŚCI, łącznie ze składaniem
 * zdania, odmianą i kolejnością — czyli z tym, czego odtwarzanie świadomie nie
 * reprodukuje. Gdzie jest, tam jest mocniejszym świadkiem i szkoda go nie użyć.
 */
describe.each(pary.filter((p) => p.tekst !== null))("orakulum ze zrzutem tekstu: $nazwa", (para) => {
  const sklad = skladZeZrzutu(para.zrzut);
  const wiadomosci = komunikaty(para.zrzut.wpisy);
  const tekst = para.tekst as string;

  test("skalary zgadzają się ze zrzutem z gry", () => {
    const zTekstu = new Session();
    zTekstu.update(tekst, sklad);
    const zProtokolu = new Session();
    zProtokolu.updateEvents(dekoduj(wiadomosci, sklad, SLOWNIK), sklad);
    expect(rozjazdy(zTekstu.current(), zProtokolu.current())).toEqual([]);
  });

  test("tekst i protokół opisują tę samą walkę", () => {
    // Strażnik na pomyłkę przy składaniu fixture'a: `raw.txt` z innej walki
    // dałby rozjazdy wyglądające na błąd dekodera.
    for (const wojownik of sklad) expect(tekst).toContain(wojownik.name);
  });
});

/**
 * SPÓŹNIONE PODPIĘCIE — usterka z pierwszego uruchomienia w grze (2026‑08‑04).
 *
 * `EngineProtocolSource` owija `Engine.battle.update` z zegara, a gra tworzy
 * nowy obiekt walki przy każdej walce. Gdy pierwsza porcja komunikatów przyjdzie
 * przed naszym tikiem, protokół traci CAŁĄ walkę — bo w jedynym zrzucie, jaki
 * mamy, wszystkie 18 komunikatów przyszło w jednym wywołaniu.
 *
 * Wtedy sesja protokołu ma komplet postaci ze SKŁADU i same zera, a panel
 * wybierał ją zamiast poprawnego odczytu z tekstu. Ten test odtwarza to na
 * prawdziwym materiale i padał przed naprawą.
 */
describe.each(pary.filter((p) => p.tekst !== null))("spóźnione podpięcie: $nazwa", (para) => {
  const sklad = skladZeZrzutu(para.zrzut);
  const wiadomosci = komunikaty(para.zrzut.wpisy);

  test("protokół, który złapał tylko końcówkę, NIE przejmuje panelu", () => {
    const zTekstu = new Session();
    zTekstu.update(para.tekst as string, sklad);

    // Cztery ostatnie komunikaty to rozstrzygnięcie walki i łup — zero obrażeń.
    const spozniony = new Session();
    spozniony.updateEvents(dekoduj(wiadomosci.slice(-4), sklad, SLOWNIK), sklad);

    expect(spozniony.current().actors.length).toBeGreaterThan(0);
    expect(pustyOdczyt(spozniony.current())).toBe(true);

    const wybrane = zrodloPanelu(zTekstu.current(), spozniony.current());
    const suma = wybrane.actors.reduce((a, x) => a + x.damageDealt, 0);
    expect(suma).toBe(zTekstu.current().actors.reduce((a, x) => a + x.damageDealt, 0));
    expect(suma).toBeGreaterThan(0);
  });

  test("pełny protokół panel PRZEJMUJE — inaczej naprawa zabiłaby całą ścieżkę", () => {
    const zTekstu = new Session();
    zTekstu.update(para.tekst as string, sklad);
    const pelny = new Session();
    pelny.updateEvents(dekoduj(wiadomosci, sklad, SLOWNIK), sklad);

    expect(pustyOdczyt(pelny.current())).toBe(false);
    expect(zrodloPanelu(zTekstu.current(), pelny.current())).toBe(pelny.current());
  });
});
