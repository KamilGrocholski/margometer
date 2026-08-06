import { describe, expect, test } from "bun:test";
import {
  KolekcjonerZrzutu,
  migawka,
  srodowiskoStrony,
  type SrodowiskoZrzutu,
} from "../src/zrzut.ts";
import { czytajZrzut, komunikaty, mojaDruzyna, skladZeZrzutu } from "../tools/walka.ts";

/**
 * Czego te testy pilnują: żeby zrzut zebrany W DODATKU dał się rozebrać tym
 * samym narzędziem, co zrzut z sondy.
 *
 * ⚠️ **NAJWAŻNIEJSZY JEST PIERWSZY BLOK** i to on jest powodem, dla którego ten
 * plik importuje z `tools/`. Kolekcjoner sprawdzany przeciw własnym asercjom
 * potrafi być zielony i produkować plik, którego `bun tools/walka.ts --rozbij`
 * nie zje — a wtedy cała zdolność jest bezużyteczna dokładnie w tym jednym
 * momencie, w którym jest potrzebna. `czytajZrzut`, `skladZeZrzutu`
 * i `mojaDruzyna` są tu **prawdziwym czytelnikiem**, nie atrapą.
 */

/** Środowisko bez gry i bez DOM — wszystkie cztery odczyty wstrzyknięte. */
const srodowisko = (nadpisz: Partial<SrodowiskoZrzutu> = {}): SrodowiskoZrzutu => ({
  swiat: () => "tempest",
  build: () => "1781609507010",
  otwarcie: () => "Rozpoczęła się walka pomiędzy Kazrek a Odyniec",
  teraz: () => "2026-08-05T12:00:00.000Z",
  ...nadpisz,
});

/** Magazyn w mapie — wzór z `tests/archive.test.ts`. */
const magazyn = (poczatek: Record<string, string> = {}) => {
  const dane = new Map(Object.entries(poczatek));
  return {
    getItem: (k: string) => dane.get(k) ?? null,
    setItem: (k: string, v: string) => void dane.set(k, v),
    dane,
  };
};

/** Obiekt walki w kształcie, który wystawia gra. */
const battle = (myteam = 1) => ({
  myteam,
  warriorsList: {
    a: { id: 482845, name: "Gracz 1", team: 1, prof: "h", lvl: 40, hp: { cur: 900, max: 900 } },
    b: { id: -255967, name: "Odyniec", team: 2, prof: "w", lvl: 41, hp: { cur: 500, max: 500 } },
  },
});

/** Kolekcjoner z włączonym trybem — w testach to stan domyślny. */
const wlaczony = (srod: SrodowiskoZrzutu = srodowisko()) => {
  const k = new KolekcjonerZrzutu(srod, magazyn());
  k.wlacz(true);
  return k;
};

/** Jedno wywołanie `update`: migawka przed, ładunek, migawka po. */
const wywolaj = (k: KolekcjonerZrzutu, b: Record<string, unknown>, ladunek: unknown) => {
  const przed = k.przed(b);
  k.po(ladunek, b, przed);
};

describe("zrzut z dodatku czyta się narzędziem od zrzutów z sondy", () => {
  test("przechodzi przez czytajZrzut, skladZeZrzutu i mojaDruzyna", () => {
    const k = wlaczony();
    const b = battle(1);
    k.nowaWalka();
    wywolaj(k, b, { myteam: 1, m: ["482845=100.00;-255967=70.07;+dmgd=466;-dmgd=223"] });
    wywolaj(k, b, { m: ["482845=100.00;-255967=0.00;+dmgd=485;-dmgd=248"] });

    // Przez tekst, bo tak zrzut trafia na dysk i tak wraca do narzędzia.
    const odczytany = czytajZrzut(JSON.stringify(k.zrzut()));

    expect(odczytany.wersja).toBe(1);
    expect(odczytany.swiat).toBe("tempest");
    expect(odczytany.build).toBe("1781609507010");
    expect(odczytany.otwarcie).toBe("Rozpoczęła się walka pomiędzy Kazrek a Odyniec");
    expect(komunikaty(odczytany.wpisy)).toHaveLength(2);

    // To jest sedno: strony liczy narzędzie, z `myteam` i surowego `team`.
    expect(mojaDruzyna(odczytany)).toBe(1);
    expect(skladZeZrzutu(odczytany)).toEqual([
      { id: 482845, name: "Gracz 1", side: 0, prof: "h", lvl: 40 },
      { id: -255967, name: "Odyniec", side: 1, prof: "w", lvl: 41 },
    ]);
  });

  test("bez `myteam` w którymkolwiek ładunku narzędzie ODMAWIA, zamiast zgadnąć strony", () => {
    const k = wlaczony();
    const b = battle(1);
    wywolaj(k, b, { m: ["482845=100.00;-255967=70.07;+dmgd=466"] });

    const odczytany = czytajZrzut(JSON.stringify(k.zrzut()));
    expect(mojaDruzyna(odczytany)).toBeNull();
    expect(() => skladZeZrzutu(odczytany)).toThrow(/myteam/);
  });
});

describe("ładunek jest kopią, nie referencją", () => {
  test("mutacja `t` po wywołaniu nie zmienia zapisu", () => {
    const k = wlaczony();
    const b = battle();
    const ladunek: Record<string, unknown> = { myteam: 1, m: ["a;b;+dmgd=1"], move: 3 };
    wywolaj(k, b, ladunek);

    // Gra trzyma ten obiekt dalej i nadpisuje go przy następnej porcji.
    ladunek["move"] = -1;
    (ladunek["m"] as string[])[0] = "PODMIENIONE";

    const wpis = k.zrzut().wpisy[0];
    expect(wpis?.ladunek["move"]).toBe(3);
    expect(wpis?.komunikaty).toEqual(["a;b;+dmgd=1"]);
  });

  test("migawka `hp` jest kopią — zmiana życia po odczycie nie cofa się do zapisu", () => {
    const b = battle();
    const przed = migawka(b);
    b.warriorsList.a.hp.cur = 100;
    expect((przed[0]?.hp as { cur: number }).cur).toBe(900);
  });

  test("ładunek, którego nie da się zserializować, zapisuje POWÓD zamiast znikać", () => {
    const k = wlaczony();
    const b = battle();
    const cykliczny: Record<string, unknown> = { m: ["a;b;+dmgd=1"] };
    cykliczny["ja"] = cykliczny;
    wywolaj(k, b, cykliczny);

    const wpis = k.zrzut().wpisy[0];
    expect(String(wpis?.ladunek["blad"])).toMatch(/circular|cyclic|Converting/i);
    // Komunikaty czytamy z ORYGINAŁU, więc materiał dowodowy przeżywa awarię kopii.
    expect(wpis?.komunikaty).toEqual(["a;b;+dmgd=1"]);
  });
});

describe("co trafia do bufora", () => {
  test("wywołanie BEZ komunikatów też jest zapisywane", () => {
    // Odczyt na żywo je odrzuca (`protokol-source.ts:263`), bo nie niosą zdarzeń.
    // Dla zrzutu są materiałem: mówią, jakie klucze ładunku gra w ogóle wysyła.
    const k = wlaczony();
    const b = battle();
    wywolaj(k, b, { move: -1, endBattle: 1 });

    expect(k.zrzut().wpisy).toHaveLength(1);
    expect(k.zrzut().wpisy[0]?.ladunek["endBattle"]).toBe(1);
  });

  test("dokładne powtórzenie odpada i jest policzone", () => {
    const k = wlaczony();
    const b = battle();
    for (let i = 0; i < 5; i += 1) wywolaj(k, b, { move: -1, endBattle: 1 });

    const stan = k.stan();
    expect(stan.wywolan).toBe(1);
    expect(stan.pominietych).toBe(4);
  });

  test("KAŻDE wywołanie z komunikatami zostaje, choćby powtarzało kształt i stan", () => {
    const k = wlaczony();
    const b = battle();
    for (let i = 0; i < 5; i += 1) wywolaj(k, b, { m: ["a;b;+dmgd=1"] });

    expect(k.stan().wywolan).toBe(5);
    expect(k.stan().pominietych).toBe(0);
  });

  test("nowy stan wojowników zostaje, mimo tego samego kształtu ładunku", () => {
    const k = wlaczony();
    const b = battle();
    wywolaj(k, b, { move: -1 });
    b.warriorsList.a.hp.cur = 400;
    wywolaj(k, b, { move: -1 });

    expect(k.stan().wywolan).toBe(2);
  });
});

describe("rozdzielanie walk", () => {
  test("druga walka dostaje inny numer, a bufor NIE jest czyszczony", () => {
    const k = wlaczony();
    k.nowaWalka();
    const pierwsza = battle();
    wywolaj(k, pierwsza, { myteam: 1, m: ["a;b;+dmgd=1"] });

    k.nowaWalka();
    const druga = battle();
    druga.warriorsList.a.name = "Ktoś inny";
    wywolaj(k, druga, { myteam: 1, m: ["c;d;+dmgd=2"] });

    const wpisy = k.zrzut().wpisy;
    expect(wpisy).toHaveLength(2);
    expect(wpisy[0]?.walka).not.toBe(wpisy[1]?.walka);
    expect(k.stan().walk).toBe(2);
  });

  test("linia otwierająca zapisuje się PER WALKA", () => {
    let nr = 0;
    const k = wlaczony(srodowisko({ otwarcie: () => `walka ${(nr += 1)}` }));
    k.nowaWalka();
    const b = battle();
    wywolaj(k, b, { m: ["a;b;+dmgd=1"] });
    k.nowaWalka();
    b.warriorsList.a.hp.cur = 1;
    wywolaj(k, b, { m: ["c;d;+dmgd=2"] });

    const zrzut = k.zrzut();
    // `otwarcie` niesie PIERWSZĄ walkę — tak wygląda zrzut z sondy.
    expect(zrzut.otwarcie).toBe("walka 1");
    expect(Object.values(zrzut.otwarcia ?? {})).toEqual(["walka 1", "walka 2"]);
  });

  test("tryb włączony W TRAKCIE walki dogania linię otwierającą", () => {
    // Prawdziwy przypadek, nie wymyślony: pierwszy zrzut zebrany dodatkiem
    // w grze (tempest, 2026‑08‑05) przyszedł z `otwarcie: null` i `otwarcia: {}`,
    // bo gracz włącza tryb dopiero wtedy, gdy widzi, że walka jest warta
    // zebrania. Czat wciąż niesie wtedy tę linię.
    const k = new KolekcjonerZrzutu(srodowisko(), magazyn());
    k.nowaWalka(); // walka rusza przy WYŁĄCZONYM trybie
    k.wlacz(true);
    wywolaj(k, battle(), { m: ["a;b;+dmgd=1"] });

    expect(k.zrzut().otwarcie).toBe("Rozpoczęła się walka pomiędzy Kazrek a Odyniec");
  });

  test("przełączanie w kółko nie nadpisuje linii zapisanej na czas", () => {
    let nr = 0;
    const k = wlaczony(srodowisko({ otwarcie: () => `walka ${(nr += 1)}` }));
    k.nowaWalka(); // zapisuje „walka 1"
    k.wlacz(false);
    k.wlacz(true); // nie ma prawa wpisać „walka 2" pod tę samą walkę
    wywolaj(k, battle(), { m: ["a;b;+dmgd=1"] });

    expect(k.zrzut().otwarcie).toBe("walka 1");
  });

  test("włączenie trybu przed PIERWSZĄ walką nie wpisuje linii pod numer 0", () => {
    // Numer 0 nie należy do żadnego wywołania — wpis pod nim byłby w zrzucie
    // linią przypisaną do walki, której tam nie ma.
    const k = new KolekcjonerZrzutu(srodowisko(), magazyn());
    k.wlacz(true);

    expect(k.zrzut().otwarcia).toEqual({});
  });

  test("`stan().walk` liczy walki, które NAPRAWDĘ coś zapisały", () => {
    const k = wlaczony();
    k.nowaWalka();
    k.nowaWalka(); // walka, w której gra nie zdążyła nic przysłać
    k.nowaWalka();
    wywolaj(k, battle(), { m: ["a;b;+dmgd=1"] });

    expect(k.stan().walk).toBe(1);
  });
});

describe("tryb wyłączony nic nie kosztuje", () => {
  test("nie powstaje ANI JEDNA migawka, gdy tryb jest wyłączony", () => {
    const k = new KolekcjonerZrzutu(srodowisko(), magazyn());
    let odczytow = 0;
    const podgladany = {
      myteam: 1,
      get warriorsList() {
        odczytow += 1;
        return battle().warriorsList;
      },
    };

    wywolaj(k, podgladany, { m: ["a;b;+dmgd=1"] });

    expect(odczytow).toBe(0);
    expect(k.zrzut().wpisy).toHaveLength(0);
  });

  test("flaga wraca z magazynu i przeżywa powstanie nowego kolekcjonera", () => {
    const store = magazyn();
    const pierwszy = new KolekcjonerZrzutu(srodowisko(), store);
    expect(pierwszy.wlaczony()).toBe(false);
    pierwszy.wlacz(true);

    expect(new KolekcjonerZrzutu(srodowisko(), store).wlaczony()).toBe(true);
  });

  test("brak magazynu nie przewraca kolekcjonera", () => {
    const k = new KolekcjonerZrzutu(srodowisko(), undefined);
    expect(k.wlaczony()).toBe(false);
    expect(() => k.wlacz(true)).not.toThrow();
    // Tryb działa do końca sesji także wtedy, gdy nie da się go zapamiętać.
    expect(k.wlaczony()).toBe(true);
  });
});

describe("odczyt strony gry", () => {
  /** Tyle dokumentu, ile czyta `srodowiskoStrony` — reszty nie udajemy. */
  const dokument = (innerText: string, skrypty: string[] = []) =>
    ({
      body: { innerText },
      querySelectorAll: () => skrypty.map((src) => ({ src })),
    }) as unknown as Document;

  test("linią otwierającą jest OSTATNIA w czacie, nie pierwsza", () => {
    // Dodatek żyje całą sesją, a czat trzyma linie wszystkich stoczonych walk.
    // Pierwsze dopasowanie wpisałoby przy trzeciej walce linię pierwszej —
    // materiał kłamiący o tym, czym jest.
    const srod = srodowiskoStrony(
      { hostname: "tempest.margonem.pl" },
      dokument(
        "Rozpoczęła się walka pomiędzy Kazrek a Warchlak\n" +
          "coś tam\n" +
          "Rozpoczęła się walka pomiędzy Kazrek a Odyniec",
      ),
    );

    expect(srod.otwarcie()).toBe("Rozpoczęła się walka pomiędzy Kazrek a Odyniec");
  });

  test("brak linii w czacie to `null`, nie puste zdanie", () => {
    const srod = srodowiskoStrony({ hostname: "tempest.margonem.pl" }, dokument("nic tu nie ma"));

    expect(srod.otwarcie()).toBeNull();
  });

  test("świat i build czyta ze strony", () => {
    const srod = srodowiskoStrony(
      { hostname: "tempest.margonem.pl" },
      dokument("", ["https://micc.garmory-cdn.cloud/img/main.min1785244275300.js"]),
    );

    expect(srod.swiat()).toBe("tempest");
    expect(srod.build()).toBe("1785244275300");
  });
});

describe("sprzątanie i nazwa pliku", () => {
  test("wyczysc zeruje zapis i liczniki, ale NIE numerację walk", () => {
    const k = wlaczony();
    k.nowaWalka();
    wywolaj(k, battle(), { m: ["a;b;+dmgd=1"] });
    wywolaj(k, battle(), { move: -1 });
    k.wyczysc();

    expect(k.stan()).toEqual({
      wywolan: 0,
      komunikatow: 0,
      walk: 0,
      pominietych: 0,
      przepelniony: false,
    });

    // ⚠️ **TEN TEST ŻĄDAŁ WCZEŚNIEJ `walka: 1` PO CZYSZCZENIU** — „pierwsza
    // zapisana walka ma być pierwszą, nie ósmą" (`AUDYT‑70`). Życzenie
    // kosmetyczne, którego ceną był numer 0: czyszczenie W TRAKCIE walki
    // zostawiało wpisy pod numerem, którego żadna walka nie nosi, `otwarcie`
    // zostawało `null`, a doganianie linii otwierającej stawało się martwe,
    // bo jego strażnik odrzuca `walka === 0`.
    //
    // Numer mówi, DO KTÓREJ walki należy wpis. Czyszczenie kasuje zapis, nie
    // przebieg sesji — więc trwająca walka zachowuje swój numer.
    wywolaj(k, battle(), { m: ["a;b;+dmgd=1"] });
    expect(k.zrzut().wpisy[0]?.walka).toBe(1);

    // A następna walka dostaje następny numer, nie ten sam.
    k.nowaWalka();
    wywolaj(k, battle(), { m: ["c;d;+dmgd=2"] });
    expect(k.zrzut().wpisy.at(-1)?.walka).toBe(2);
  });

  test("nazwa pliku niesie świat i chwilę zrzutu, bez znaków zakazanych w nazwach", () => {
    const nazwa = wlaczony().nazwaPliku();
    expect(nazwa).toBe("walka-tempest-2026-08-05T12-00-00-000Z.json");
    // Dwukropków z ISO nie ma wcale, a kropka zostaje wyłącznie w rozszerzeniu —
    // inaczej system plików dostaje nazwę, której nie przyjmie.
    expect(nazwa).not.toContain(":");
    expect(nazwa.split(".")).toHaveLength(2);
  });
});

/**
 * Sufit bufora i migawka „przed" — dwie rzeczy, które do 2026‑08‑05 nie miały
 * ani jednej asercji (`AUDYT‑72`).
 *
 * Obie milczą, gdy się zepsują: bufor po prostu przestaje zbierać, a `przed`
 * po prostu nie ląduje we wpisie. `przepelniony` pojawiało się dotąd w testach
 * wyłącznie jako `false` na świeżym kolekcjonerze — asercja, która nie ma jak
 * nie przejść — i jako atrapa ustawiona z ręki w oknie opcji.
 */
describe("sufit bufora", () => {
  /** Sufit wstrzykiwany; na prawdziwym (2000) test kosztowałby tyle iteracji. */
  const zSufitem = (maks: number) => {
    const k = new KolekcjonerZrzutu(srodowisko(), magazyn(), maks);
    k.wlacz(true);
    return k;
  };

  test("po dobiciu do sufitu zbieranie STAJE i mówi o tym", () => {
    const k = zSufitem(2);
    for (const n of [1, 2, 3, 4]) wywolaj(k, battle(), { m: [`a;b;+dmgd=${n}`] });

    const zrzut = k.zrzut();
    expect(zrzut.wpisy).toHaveLength(2);
    expect(k.stan().przepelniony).toBe(true);
    expect(zrzut.przepelniony).toBe(true);
  });

  test("wpisy sprzed sufitu zostają NIETKNIĘTE", () => {
    // Sufit zatrzymuje zbieranie, nie rotuje buforem: fixture bez początku
    // walki jest bezużyteczny, bez końca — nadal niesie materiał.
    const k = zSufitem(2);
    for (const n of [1, 2, 3]) wywolaj(k, battle(), { m: [`a;b;+dmgd=${n}`] });

    expect(k.zrzut().wpisy.map((w) => w.komunikaty[0])).toEqual([
      "a;b;+dmgd=1",
      "a;b;+dmgd=2",
    ]);
  });

  test("po suficie `przed()` przestaje robić migawki", () => {
    // Migawka jest najdroższą rzeczą w tej ścieżce i leci PRZED oryginałem,
    // czyli w torze, który opóźnia grze turę. Po zatrzymaniu zbierania nie ma
    // dla kogo powstawać.
    const k = zSufitem(1);
    wywolaj(k, battle(), { m: ["a;b;+dmgd=1"] });
    wywolaj(k, battle(), { m: ["a;b;+dmgd=2"] });

    expect(k.przed(battle())).toBeNull();
  });
});

describe("migawka „przed” trafia do wpisu", () => {
  test("wpis niesie stan SPRZED wywołania, różny od stanu po", () => {
    // ⚠️ To jedyny powód, dla którego nasz kod leci PRZED oryginałem i dla
    // którego kontrakt ma dwie metody zamiast jednej — a nie miał ani jednej
    // asercji na zawartość: wstawienie `[]` zamiast `przed` przechodziło cały
    // zestaw (`AUDYT‑72`).
    const k = wlaczony();
    const b = battle();
    const przed = k.przed(b);
    // Gra przelicza turę: życie spada.
    b.warriorsList.b.hp.cur = 120;
    k.po({ m: ["a;b;+dmgd=380"] }, b, przed);

    const wpis = k.zrzut().wpisy[0]!;
    const zycie = (lista: unknown[] | null, id: number) =>
      (lista ?? []).map((w) => w as { id: number; hp: { cur: number } }).find((w) => w.id === id)
        ?.hp.cur;

    expect(zycie(wpis.wojownicyPrzed, -255967)).toBe(500);
    expect(zycie(wpis.wojownicyPo, -255967)).toBe(120);
  });

  test("gdy migawka NIE powstała, wpis mówi `null`, a nie „brak wojowników”", () => {
    // ⚠️ `AUDYT‑73`. `przed ?? []` zamieniało „nie wiemy" w „nikogo nie było".
    const k = wlaczony();
    k.po({ m: ["a;b;+dmgd=1"] }, battle(), null);

    expect(k.zrzut().wpisy[0]?.wojownicyPrzed).toBeNull();
  });
});
