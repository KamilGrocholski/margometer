import { beforeEach, describe, expect, test } from "bun:test";
import { Opcje, type ZrodloZrzutu } from "../src/opcje.ts";
import { Overlay } from "../src/overlay.ts";
import { czytajZrzut } from "../tools/walka.ts";
import type { StanZrzutu, Zrzut } from "../src/zrzut.ts";
import { ManualTicker } from "./manual-ticker.ts";

/**
 * Okno ustawień i przycisk zrzutu.
 *
 * ⚠️ **NAJWAŻNIEJSZY JEST OSTATNI BLOK** — ten, który pilnuje, że okno NIE
 * podszywa się pod panel. Oba żyją w jednym shadow roocie, a testy panelu
 * czytają `shadow.querySelectorAll(".row")` i `shadow.querySelector("header")`
 * bez żadnego zawężenia. Wiersz nazwany `.row` albo okno wstawione przed
 * panelem wsypałyby je po cichu — i to jest dokładnie ta klasa błędu, którą
 * `style.ts` opisuje przy `.archive-paste-actions`.
 */

const NOW = new Date("2026-08-05T12:00:00").getTime();

/** Kolekcjoner w pamięci — okno widzi z niego sześć metod i nic więcej. */
function fakeZrzut(poczatek: Partial<StanZrzutu> = {}): ZrodloZrzutu & {
  zapis: Zrzut;
  wyczyszczony: boolean;
} {
  let wlaczony = false;
  const stan: StanZrzutu = {
    wywolan: 2,
    komunikatow: 5,
    walk: 1,
    pominietych: 0,
    przepelniony: false,
    ...poczatek,
  };
  const zapis: Zrzut = {
    wersja: 1,
    zrodlo: "dodatek",
    przy: "2026-08-05T12:00:00.000Z",
    swiat: "tempest",
    build: "1785244275300",
    otwarcie: null,
    wpisy: [
      {
        nr: 0,
        walka: 1,
        ladunek: { myteam: 1 },
        komunikaty: ["1=100.00;2=50.00;+dmgd=10;-dmgd=10"],
        wojownicyPrzed: [],
        wojownicyPo: [{ id: 1, name: "Kamil", team: 1 }],
      },
    ],
  };
  return {
    zapis,
    wyczyszczony: false,
    wlaczony: () => wlaczony,
    wlacz: (czy: boolean) => void (wlaczony = czy),
    stan: () => ({ ...stan }),
    zrzut: () => zapis,
    nazwaPliku: () => "walka-tempest-2026-08-05T12-00-00-000Z.json",
    wyczysc() {
      this.wyczyszczony = true;
      stan.wywolan = 0;
      stan.komunikatow = 0;
      stan.walk = 0;
    },
  };
}

const store = new Map<string, string>();
const storage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
};

let ticker: ManualTicker;
let overlay: Overlay;
let zapisane: { nazwa: string; tresc: string }[];

beforeEach(() => {
  store.clear();
  document.body.innerHTML = "";
  ticker = new ManualTicker();
  zapisane = [];
  overlay = new Overlay({ storage, now: () => NOW, ticker });
});

/** Okno opcji doczepione do panelu, dokładnie tak jak w `boot()`. */
const zbuduj = (zrzut: ZrodloZrzutu) => {
  const opcje = new Opcje({
    overlay,
    zrzut,
    storage,
    now: () => NOW,
    ticker,
    saveFile: (nazwa, tresc) => void zapisane.push({ nazwa, tresc }),
  });
  overlay.attachOpcje(opcje);
  return opcje;
};

const przycisk = (akcja: string) =>
  overlay.shadow.querySelector<HTMLButtonElement>(`button[data-action="${akcja}"]`);

describe("zębatka w nagłówku panelu", () => {
  test("nie ma jej, dopóki okno nie jest doczepione", () => {
    expect(przycisk("opcje")).toBeNull();
  });

  test("pojawia się po attachOpcje i otwiera okno", () => {
    zbuduj(fakeZrzut());
    const zebatka = przycisk("opcje");
    expect(zebatka?.textContent).toBe("⚙");
    expect(zebatka?.getAttribute("aria-pressed")).toBe("false");

    zebatka?.click();
    expect(przycisk("opcje")?.getAttribute("aria-pressed")).toBe("true");
    expect(overlay.shadow.querySelector(".opcje")?.hasAttribute("hidden")).toBe(false);
  });

  test("stan otwarcia przeżywa powstanie okna od nowa", () => {
    zbuduj(fakeZrzut()).toggle();
    const drugie = new Opcje({ overlay, zrzut: fakeZrzut(), storage, now: () => NOW, ticker });
    expect(drugie.isOpen()).toBe(true);
  });

  test("zębatka pokazuje CZYNNY tryb deweloperski, i to nie samym kolorem", () => {
    // ⚠️ `AUDYT‑84`. Flaga trybu przeżywa odświeżenie strony, a jedyny sygnał
    // o niej siedział w ZAMKNIĘTYM oknie ustawień. Gracz, który włączył tryb raz
    // i zapomniał, płacił migawkę przy każdym wywołaniu `update` i rósł do
    // sufitu bufora, nie mając jak się o tym dowiedzieć.
    const zrzut = fakeZrzut();
    const opcje = zbuduj(zrzut);
    const zebatka = () => przycisk("opcje")!;

    expect(zebatka().classList.contains("opcje-dev-czynny")).toBe(false);
    expect(zebatka().getAttribute("aria-label")).toBe("Ustawienia");

    opcje.toggle();
    przycisk("dev-toggle")?.click();

    // Znacznik pojawia się OD RAZU, bez czekania na następny render panelu.
    expect(zebatka().classList.contains("opcje-dev-czynny")).toBe(true);
    // Nazwa też go niesie — sam kolor nie jest informacją dla czytnika ekranu.
    expect(zebatka().getAttribute("aria-label")).toContain("tryb deweloperski");

    przycisk("dev-toggle")?.click();
    expect(zebatka().classList.contains("opcje-dev-czynny")).toBe(false);
  });

  test("destroy panelu zdejmuje okno ustawień", () => {
    zbuduj(fakeZrzut()).toggle();
    overlay.destroy();
    expect(overlay.shadow.querySelector(".opcje")).toBeNull();
  });
});

describe("przełącznik trybu deweloperskiego", () => {
  test("przycisk zrzutu jest schowany, dopóki tryb wyłączony", () => {
    zbuduj(fakeZrzut()).toggle();
    expect(przycisk("dev-toggle")?.getAttribute("aria-pressed")).toBe("false");
    expect(przycisk("zrzut-pobierz")).toBeNull();
  });

  test("włączenie trybu odsłania zrzut i licznik zebranego materiału", () => {
    const zrzut = fakeZrzut();
    zbuduj(zrzut).toggle();
    przycisk("dev-toggle")?.click();

    expect(zrzut.wlaczony()).toBe(true);
    expect(przycisk("dev-toggle")?.getAttribute("aria-pressed")).toBe("true");
    expect(przycisk("zrzut-pobierz")).not.toBeNull();
    expect(overlay.shadow.querySelector(".opcje-stan")?.textContent).toBe(
      "Zebrane: 1 walka, 5 wierszy.",
    );
  });

  test("liczebniki odmieniają się po polsku", () => {
    const zrzut = fakeZrzut({ walk: 2, komunikatow: 1 });
    zbuduj(zrzut).toggle();
    przycisk("dev-toggle")?.click();
    expect(overlay.shadow.querySelector(".opcje-stan")?.textContent).toBe(
      "Zebrane: 2 walki, 1 wiersz.",
    );
  });

  test("pełny bufor mówi o tym GŁOŚNO", () => {
    // Bufor, który stanął, wygląda z zewnątrz tak samo jak bufor, w którym nic
    // się nie dzieje. Bez tego wiersza gracz zrzuciłby plik urwany w połowie.
    const zrzut = fakeZrzut({ przepelniony: true });
    zbuduj(zrzut).toggle();
    przycisk("dev-toggle")?.click();
    expect(overlay.shadow.querySelector(".opcje-warn")?.textContent).toContain(
      "Pamięć zapisu się skończyła",
    );
  });
});

describe("zapis zrzutu", () => {
  const otworzZTrybem = (zrzut: ZrodloZrzutu) => {
    zbuduj(zrzut).toggle();
    przycisk("dev-toggle")?.click();
  };

  test("zapisuje plik, który czyta narzędzie od fixture'ów", () => {
    const zrzut = fakeZrzut();
    otworzZTrybem(zrzut);
    przycisk("zrzut-pobierz")?.click();

    expect(zapisane).toHaveLength(1);
    expect(zapisane[0]?.nazwa).toBe("walka-tempest-2026-08-05T12-00-00-000Z.json");
    // Sedno: przez PRAWDZIWY czytnik `tools/walka.ts`, nie przez własną asercję.
    const odczytany = czytajZrzut(zapisane[0]!.tresc);
    expect(odczytany.zrodlo).toBe("dodatek");
    expect(odczytany.wpisy[0]?.komunikaty).toEqual(["1=100.00;2=50.00;+dmgd=10;-dmgd=10"]);
  });

  test("pusty zapis NIE tworzy pliku, tylko mówi dlaczego", () => {
    // Plik z `wpisy: []` wygląda jak materiał i nie jest nim; narzędzie odrzuci
    // go dopiero po stronie dysku, czyli o kwadrans za późno.
    otworzZTrybem(fakeZrzut({ wywolan: 0, komunikatow: 0, walk: 0 }));
    przycisk("zrzut-pobierz")?.click();

    expect(zapisane).toEqual([]);
    expect(overlay.shadow.querySelector(".opcje-notice")?.textContent).toContain(
      "Nie ma czego zapisać",
    );
  });

  test("odpowiedź po zapisie gaśnie sama", () => {
    otworzZTrybem(fakeZrzut());
    przycisk("zrzut-pobierz")?.click();
    expect(overlay.shadow.querySelector(".opcje-notice")).not.toBeNull();

    ticker.tick();
    expect(overlay.shadow.querySelector(".opcje-notice")).toBeNull();
  });

  test("gasnąca odpowiedź NIE otwiera zamkniętego okna z powrotem", () => {
    // `AUDYT‑62`. Test siostrzany do tego wyżej i pytający o coś innego: tamten
    // sprawdza, że zegar gasi odpowiedź, ten — że gasząc ją, nie wskrzesza
    // okna. Zegar `powiedz()` odlicza dalej po zamknięciu, więc `render()`
    // wołany z jego wnętrza musi wyjść przed `hidden = false`.
    const opcje = zbuduj(fakeZrzut());
    opcje.toggle();
    przycisk("dev-toggle")?.click();
    przycisk("zrzut-pobierz")?.click();
    expect(overlay.shadow.querySelector(".opcje-notice")).not.toBeNull();

    opcje.toggle();
    expect(overlay.shadow.querySelector(".opcje")?.hasAttribute("hidden")).toBe(true);

    ticker.tick();

    // Okno zostaje zamknięte, a zębatka dalej mówi prawdę o jego stanie.
    expect(overlay.shadow.querySelector(".opcje")?.hasAttribute("hidden")).toBe(true);
    expect(opcje.isOpen()).toBe(false);
    expect(przycisk("opcje")?.getAttribute("aria-pressed")).toBe("false");
  });

  test("awaria zapisu nie przewraca okna", () => {
    const zrzut = fakeZrzut();
    zbuduj(zrzut);
    // Własne okno z zapisem, który rzuca — jak zablokowane pobieranie.
    const opcje = new Opcje({
      overlay,
      zrzut,
      storage,
      now: () => NOW,
      ticker,
      saveFile: () => {
        throw new Error("przeglądarka odmówiła pobrania");
      },
    });
    overlay.attachOpcje(opcje);
    opcje.toggle();
    przycisk("dev-toggle")?.click();

    expect(() => przycisk("zrzut-pobierz")?.click()).not.toThrow();
    expect(overlay.shadow.querySelector(".opcje-notice")?.textContent).toContain(
      "Nie udało się zapisać",
    );
  });

  test("czyszczenie wymaga DWÓCH kliknięć", () => {
    const zrzut = fakeZrzut();
    otworzZTrybem(zrzut);

    przycisk("zrzut-wyczysc")?.click();
    expect(zrzut.wyczyszczony).toBe(false);
    expect(przycisk("zrzut-wyczysc")?.textContent).toBe("na pewno?");

    przycisk("zrzut-wyczysc")?.click();
    expect(zrzut.wyczyszczony).toBe(true);
  });

  test("zamknięcie okna rozbraja uzbrojone czyszczenie", () => {
    const zrzut = fakeZrzut();
    const opcje = zbuduj(zrzut);
    opcje.toggle();
    przycisk("dev-toggle")?.click();
    przycisk("zrzut-wyczysc")?.click();

    opcje.toggle();
    opcje.toggle();
    // Po ponownym otwarciu pierwszy klik ma znowu PYTAĆ, a nie kasować.
    expect(przycisk("zrzut-wyczysc")?.textContent).toBe("wyczyść");
    przycisk("zrzut-wyczysc")?.click();
    expect(zrzut.wyczyszczony).toBe(false);
  });
});

describe("okno ustawień nie podszywa się pod panel", () => {
  test("`header` i `.row` w shadow roocie należą dalej do panelu", () => {
    const przedRzedy = overlay.shadow.querySelectorAll(".row").length;
    const panelowyHeader = overlay.shadow.querySelector("header");

    zbuduj(fakeZrzut()).toggle();
    przycisk("dev-toggle")?.click();

    // Gdyby okno szło `prepend`, `querySelector("header")` oddałby JEGO nagłówek
    // — i `tests/overlay.test.ts` przestałby sprawdzać to, co myśli, że sprawdza.
    expect(overlay.shadow.querySelector("header")).toBe(panelowyHeader);
    expect(overlay.shadow.querySelectorAll(".row")).toHaveLength(przedRzedy);
  });

  test("wszystkie własne klasy okna są prefiksowane", () => {
    zbuduj(fakeZrzut()).toggle();
    przycisk("dev-toggle")?.click();

    const okno = overlay.shadow.querySelector(".opcje");
    const klasy = [...(okno?.querySelectorAll("[class]") ?? [])]
      .flatMap((el) => [...el.classList])
      // `title` dzieli z archiwum i panelem świadomie — to nagłówek okna.
      .filter((nazwa) => nazwa !== "title");
    expect(klasy.filter((nazwa) => !nazwa.startsWith("opcje-"))).toEqual([]);
  });
});
