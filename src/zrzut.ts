/**
 * Zbieranie SUROWEGO materiału dowodowego z gry — to samo, co robi sonda
 * `tools/walka-probe.js`, tyle że wewnątrz dodatku i za przełącznikiem.
 *
 * PO CO. Fixture z gry jest dziś wąskim gardłem repo: `docs/ROADMAP.md` blokuje
 * na jego braku atrybucję leczenia (`heal_target`), turę z `data.current` oraz
 * `bandage`/`vamp_time`, a `tests/walka-z-gry.ts` jest JEDYNĄ prawdziwą walką,
 * jaką mamy — bez bloku, uniku, absorpcji i zapowiedzi umiejętności. Sonda
 * konsolowa działa, ale wymaga wklejenia PRZED walką i owija
 * `Engine.battle.update` DRUGI raz, obok owinięcia dodatku.
 *
 * ⚠️ **TEN MODUŁ NIE OWIJA NICZEGO.** Wpina się w owinięcie, które już stoi
 * (`protokol-source.ts`), i to jest cały powód, dla którego powstał zamiast
 * przeniesienia sondy do `src/`. Druga warstwa na tej samej funkcji to
 * konstrukcja, wobec której `AGENTS.md` składa cztery gwarancje — nie ma sensu
 * dokładać jej samemu sobie.
 *
 * ZAPISUJE, NIE INTERPRETUJE. To jest różnica wobec `roster.ts`, która jest tu
 * zamierzona: `roster.ts` odrzuca wojownika bez `team` i cały skład bez
 * `myteam`, bo produkuje `RosterEntry` z policzoną stroną. Tutaj bierzemy, co
 * jest, i zostawiamy interpretację narzędziu offline (`tools/walka.ts`).
 * Materiał dowodowy ma być surowy — inaczej zrzut niesie już nasze wnioski.
 */

/**
 * Jedno wywołanie `Engine.battle.update` tak, jak je zapisujemy.
 *
 * ⚠️ **TO JEST KONTRAKT Z `tools/walka.ts`** i dlatego mieszka tutaj, a nie tam:
 * `czytajZrzut`, `skladZeZrzutu` i `modulZrzutu` czytają dokładnie ten kształt,
 * a typ żyjący w dwóch plikach naraz to w tym repo zapisana przyczyna
 * wszystkich rozjazdów (`SOLID §11`). Narzędzie importuje go stąd.
 *
 * `wojownicyPrzed`/`wojownicyPo` są tu `unknown[]`, choć zapisujemy
 * `MigawkaWojownika[]`. To NIE jest niedopatrzenie: zrzut wraca z dysku, czasem
 * po ręcznej edycji, więc CZYTELNIK nie ma prawa zakładać kształtu. Pisarz jest
 * typowany, czytelnik sprawdza — i od 2026‑08‑05 naprawdę sprawdza, pole po polu
 * (`wpisZrzutu` w `tools/walka.ts`); wcześniej ta obietnica była pusta
 * (`AUDYT‑65`).
 */
export type Wywolanie = {
  nr: number;
  /**
   * Numer walki w tej sesji, liczony od zera.
   *
   * Pole, którego sonda nie ma, i bez którego zrzut z dodatku byłby pułapką:
   * sonda żyje jedną walkę, dodatek stoi w karcie godzinami. Sklejenie dwóch
   * walk w jeden moduł dałoby fixture z pomieszanymi komunikatami i scalonym
   * składem — czyli materiał wyglądający na dowód i kłamiący.
   */
  walka?: number;
  ladunek: Record<string, unknown>;
  komunikaty: string[];
  /**
   * Migawka SPRZED wywołania — albo `null`, gdy nie powstała.
   *
   * ⚠️ **STAŁO TU `unknown[]` I ZAPIS ROBIŁ `przed ?? []`** (`AUDYT‑73`). Pusta
   * lista znaczy „walka nie miała wojowników"; brak migawki znaczy „nie wiemy,
   * jak wtedy wyglądali". Zlanie tych dwóch rzeczy w `[]` jest dokładnie tym,
   * czego reszta repo zabrania — `roster.ts` w tej samej sytuacji woli `null`
   * niż pusty skład, bo pusty skład kasuje odczyt.
   *
   * Kiedy migawki nie ma: `przed()` rzuciło (osłona łapie i loguje, ale wpis
   * i tak powstaje). Rzadkie — i właśnie dlatego groźne, bo w materiale
   * wyglądałoby jak walka bez uczestników.
   *
   * ⚠️ Pliki sprzed 2026‑08‑05 mają tu `[]` i nie da się dziś powiedzieć, które
   * z nich znaczyło „brak migawki". Czytelnik ich nie odrzuca; nowe zrzuty są
   * jednoznaczne.
   */
  wojownicyPrzed: unknown[] | null;
  wojownicyPo: unknown[];
};

/**
 * Czy ten ładunek ZACZYNA walkę.
 *
 * ⚠️ **JEDNA DEFINICJA GRANICY DLA DODATKU I DLA NARZĘDZIA, i to jest cały
 * powód, dla którego stoi akurat tutaj** (`AUDYT‑56`). `graniceWalk`
 * w `tools/walka.ts` pilnuje granicy w MATERIALE, `protokol-source.ts` — na
 * żywo; dwa osobne warunki rozjechałyby się przy pierwszej zmianie protokołu,
 * a rozjazd byłby cichy: narzędzie odmawiałoby plikom, które dodatek uważa za
 * jedną walkę, albo odwrotnie. `src/` nie może importować z `tools/`, więc
 * wspólna definicja mieszka po tej stronie.
 *
 * Że granicą jest `init`, wie klient gry: `Battle.js:344` reaguje na
 * `isset(data.init)`, a `:954` przelicza na nim skład od zera. Cytaty i pomiar:
 * `docs/MECHANIKA.md`, wpis „Granica walk". Sprawdzamy OBECNOŚĆ, nie wartość —
 * `isset` w kliencie znaczy tyle samo, a w materiale pole niesie `"1"`.
 */
export function zaczynaWalke(ladunek: unknown): boolean {
  if (typeof ladunek !== "object" || ladunek === null) return false;
  return (ladunek as Record<string, unknown>)["init"] !== undefined;
}

export type Zrzut = {
  wersja: number;
  przy: string;
  swiat: string;
  build: string | null;
  otwarcie: string | null;
  /**
   * Linie otwierające per walka, gdy zrzut niesie ich kilka. `otwarcie` wyżej
   * zostaje dla zgodności ze zrzutami sondy i niesie linię PIERWSZEJ walki.
   */
  otwarcia?: Record<string, string | null>;
  /** Skąd wziął się zrzut. Brak pola znaczy „sonda" — tak wyglądają stare pliki. */
  zrodlo?: "sonda" | "dodatek";
  /**
   * Ile wywołań odpadło jako DOKŁADNE powtórzenie. Patrz `czyZachowac`.
   * Bez tej liczby ginie sygnał „sonda stała pół godziny po walce".
   */
  pominietych?: number;
  /** Czy bufor dobił do sufitu i zbieranie stanęło. Patrz `MAX_WPISOW`. */
  przepelniony?: boolean;
  /**
   * Ile wywołań odsiał `odchudz` przy zachowaniu zrzutu jako fixture'a.
   *
   * OSOBNO OD `pominietych`, choć reguła jest ta sama. Tamto liczy to, co odpadło
   * jeszcze W GRZE, w kolektorze; to — co odpadło OFFLINE, przy zapisie do
   * `tests/fixtures/`. Zsumowane w jedno pole nie dałyby się rozdzielić, a zrzut
   * sondy (która nie odchudza wcale) niesie tylko to drugie. Pisze je wyłącznie
   * `zachowajZrzut` w `tools/walka.ts`; dodatek go nie ustawia.
   */
  odchudzonych?: number;
  wpisy: Wywolanie[];
};

/**
 * Migawka wojownika — tylko liczby i nazwy.
 *
 * Nie `structuredClone` całego obiektu: wojownik niesie referencje do węzłów DOM
 * i do samego silnika, więc klonowanie albo rzuca, albo wciąga pół gry do
 * zrzutu. Pola przepisane z sondy co do jednego, bo to one decydują, czy zrzut
 * da się potem rozebrać: bez `team` nie ma składu, bez `hp` nie ma krzywej życia.
 */
export type MigawkaWojownika = {
  id: number | null;
  name: unknown;
  team: unknown;
  prof: unknown;
  lvl: unknown;
  hp: unknown;
  mana: unknown;
  energy: unknown;
  ac: unknown;
};

export type StanZrzutu = {
  wywolan: number;
  komunikatow: number;
  walk: number;
  pominietych: number;
  przepelniony: boolean;
};

/**
 * Umowa z `protokol-source.ts`. Dwie metody, bo migawka „przed" musi powstać
 * PRZED oryginalnym `update`, a ładunek zapisujemy dopiero po nim.
 */
export type Kolekcjoner = {
  przed(battle: Record<string, unknown>): MigawkaWojownika[] | null;
  po(ladunek: unknown, battle: Record<string, unknown>, przed: MigawkaWojownika[] | null): void;
  /**
   * Zaczęła się nowa walka. Numeruje, NIE czyści.
   *
   * ⚠️ Stało tu „gra podmieniła obiekt walki" — opis JEDNEJ z dwóch dróg,
   * i akurat tej, którą gra chodzi rzadziej. Granicą jest `data.init`
   * (`zaczynaWalke`); wymiana obiektu jest warunkiem wystarczającym, nie
   * koniecznym (`AUDYT‑56`).
   */
  nowaWalka(): void;
};

// ⚠️ Stało tu jeszcze `wlaczony(): boolean` i było MARTWE (`AUDYT‑83`).
// `EngineProtocolSource` — jedyny konsument tego typu — nigdy go nie wołał;
// okno ustawień pyta o flagę przez własny, szerszy `ZrodloZrzutu` (`opcje.ts`).
// `noUnusedLocals` tego nie łapie, bo atrapy w testach metodę implementowały,
// więc wyglądała na używaną. Sam `KolekcjonerZrzutu.wlaczony()` zostaje — to
// on odpowiada oknu.

/** Klucz flagi. Osobny, nie w `margometer.panel` — patrz `KolekcjonerZrzutu`. */
export const KLUCZ_DEV = "margometer.dev";

/** Wersja formatu zrzutu. Ta sama co w sondzie — kształt jest ten sam. */
const WERSJA = 1;

/**
 * Sufit bufora.
 *
 * Zbieranie **staje**, gdy zostanie osiągnięty, zamiast wyrzucać najstarsze
 * wpisy. Kolejność jest tu przemyślana: fixture bez początku walki jest
 * bezużyteczny, bez końca — nadal niesie materiał. Po odchudzeniu jedna walka
 * to kilkadziesiąt wpisów, więc 2000 mieści kilkanaście walk.
 */
const MAX_WPISOW = 2000;

/**
 * Skąd kolekcjoner bierze rzeczy spoza `Engine` — wstrzykiwane, żeby dało się
 * przetestować bez jsdom i bez gry. Ta sama zasada, co przy `clipboard`
 * w `overlay.ts`.
 */
export type SrodowiskoZrzutu = {
  swiat(): string;
  build(): string | null;
  otwarcie(): string | null;
  teraz(): string;
};

/**
 * Domyślne środowisko — czyta stronę gry.
 *
 * ⚠️ **`otwarcie()` SIĘGA DO DOM I JEST TU JEDYNYM TAKIM MIEJSCEM W `src/`.**
 * Odczyt zdań z DOM zszedł z drzewa 2026‑08‑04 i nie wraca: tamten był ŹRÓDŁEM
 * ZDARZEŃ, ten jest metadaną o pochodzeniu materiału, wołaną raz na walkę
 * i wyłącznie przy włączonym trybie. Gdyby padł, zrzut traci jedno zdanie
 * w nagłówku fixture'a, a nie ani jednej liczby.
 */
export function srodowiskoStrony(
  location: { hostname: string } = globalThis.location,
  document: Document = globalThis.document,
): SrodowiskoZrzutu {
  return {
    swiat: () => location.hostname.split(".")[0] ?? "nieznany",
    // Numer builda z nazwy bundla klienta. Bez niego, gdy gra zmieni format, nie
    // da się powiedzieć KTÓRY zrzut jest sprzed zmiany — a materiał z gry bez
    // wersji klienta nie jest danymi porównywalnymi.
    build: () =>
      [...document.querySelectorAll("script[src]")]
        .map((s) => /main\.min(\d+)\.js/.exec((s as HTMLScriptElement).src)?.[1])
        .find((b) => b !== undefined) ?? null,
    // ⚠️ **OSTATNIE dopasowanie, nie pierwsze** — i to jest różnica między sondą
    // a dodatkiem, nie przepisanie tej samej linijki. Sonda żyje jedną walką na
    // świeżo otwartej konsoli, więc pierwsze dopasowanie było jej jedynym.
    // Dodatek żyje całą sesją, a czat trzyma linie WSZYSTKICH stoczonych walk —
    // pierwsze dopasowanie oznaczałoby przy trzeciej walce wpisanie do nagłówka
    // materiału linii otwierającej PIERWSZEJ. Zrzut kłamiący o tym, czym jest,
    // jest gorszy niż zrzut bez tej linii („nie udawaj danych, których log nie ma").
    otwarcie: () => {
      const linie = (document.body?.innerText ?? "").match(/Rozpoczęła się walka pomiędzy.*/g);
      return linie?.[linie.length - 1] ?? null;
    },
    teraz: () => new Date().toISOString(),
  };
}

/** Kolekcja wojowników. `warriorsList` jest tym, po czym chodzi renderer. */
function wojownicy(battle: Record<string, unknown>): Record<string, unknown>[] {
  // ⚠️ KOLEJNOŚĆ ODWROTNA NIŻ W `roster.ts:44`, i to jest świadome. Tamta czyta
  // `warriors` najpierw, bo „warriorsList bywa tablicą pustych slotów"; sonda
  // czyta `warriorsList`, bo po nim chodzi renderer. Zrzut trzyma się SONDY,
  // żeby materiał z obu dróg dał się porównać co do bajta. Oba warianty i tak
  // odsiewają wpisy bez nazwy i spadają do drugiego pola, gdy pierwsze jest puste.
  for (const pole of ["warriorsList", "warriors"]) {
    const kolekcja = battle[pole];
    if (!kolekcja || typeof kolekcja !== "object") continue;
    const lista = Object.values(kolekcja as Record<string, unknown>).filter(
      (w): w is Record<string, unknown> =>
        typeof w === "object" &&
        w !== null &&
        typeof (w as Record<string, unknown>)["name"] === "string" &&
        (w as Record<string, unknown>)["name"] !== "",
    );
    if (lista.length > 0) return lista;
  }
  return [];
}

/** Migawka stanu wojowników — kopie, nie referencje. */
export function migawka(battle: Record<string, unknown>): MigawkaWojownika[] {
  return wojownicy(battle).map((w) => {
    const id = w["id"] ?? w["originalId"] ?? null;
    const hp = w["hp"];
    const ac = w["ac"];
    return {
      id: typeof id === "number" ? id : null,
      name: w["name"],
      team: w["team"] ?? null,
      prof: w["prof"] ?? null,
      lvl: w["lvl"] ?? null,
      // `hp` i `ac` są obiektami gry (`{cur, max}`) i żyją dalej po naszym
      // powrocie — kopiujemy płytko, żeby migawka „przed" nie pokazała stanu
      // sprzed jednej linijki jako stanu „po".
      hp: typeof hp === "object" && hp !== null ? { ...hp } : (hp ?? null),
      mana: w["mana"] ?? null,
      energy: w["energy"] ?? null,
      ac: typeof ac === "object" && ac !== null ? { ...ac } : (ac ?? null),
    };
  });
}

/** `t.m` → lista komunikatów. Kształt jak w `protokol-source.ts:89`. */
function komunikatyZ(m: unknown): string[] {
  const surowe: unknown[] = Array.isArray(m)
    ? m
    : typeof m === "object" && m !== null
      ? Object.values(m)
      : [];
  return surowe.filter((x): x is string => typeof x === "string");
}

/**
 * Zbiera surowe wywołania i składa z nich `Zrzut`.
 *
 * FLAGA JEST WŁASNA (`margometer.dev`), a nie polem w `PanelState`, i to jest
 * decyzja, nie wygoda. Wzór stoi w `recorder.ts:34` — `margometer.rec.on`
 * z komentarzem „nagrywanie przeżywa odświeżenie gry". Tu ta sama racja
 * obowiązuje podwójnie: zbieranie musi ruszyć PRZED pierwszą walką, czyli
 * zanim ktokolwiek narysuje panel, a kolekcjoner czytający własną flagę daje
 * się przetestować bez panelu w ogóle.
 */
export class KolekcjonerZrzutu implements Kolekcjoner {
  private readonly wpisy: Wywolanie[] = [];
  private readonly ksztalty = new Set<string>();
  private readonly stany = new Set<string>();
  private readonly otwarcia = new Map<number, string | null>();
  private walka = 0;
  private pominietych = 0;
  private przepelniony = false;
  private wlaczonyTryb: boolean;

  constructor(
    private readonly srodowisko: SrodowiskoZrzutu,
    private readonly storage?: Pick<Storage, "getItem" | "setItem"> | undefined,
    /**
     * Sufit bufora — wstrzykiwany WYŁĄCZNIE po to, żeby dał się przetestować
     * (`AUDYT‑72`).
     *
     * Zachowanie przy suficie było jedyną rzeczą w tym pliku bez ani jednej
     * asercji: `przepelniony` pojawiało się w testach tylko jako `false` na
     * świeżym kolekcjonerze i jako atrapa ustawiona z ręki w oknie opcji.
     * Test na prawdziwym `MAX_WPISOW` kosztowałby 2000 iteracji z różnymi
     * stanami, więc albo wstrzyknięcie, albo brak świadka — a brak świadka
     * dotyczył gałęzi, która MILCZY: bufor staje i przestaje zbierać.
     */
    private readonly maksWpisow: number = MAX_WPISOW,
  ) {
    this.wlaczonyTryb = this.odczytajFlage();
  }

  private odczytajFlage(): boolean {
    try {
      return this.storage?.getItem(KLUCZ_DEV) === "1";
    } catch {
      // Dostęp do localStorage rzuca przy zablokowanych ciasteczkach.
      return false;
    }
  }

  wlaczony(): boolean {
    return this.wlaczonyTryb;
  }

  wlacz(czy: boolean): void {
    this.wlaczonyTryb = czy;
    try {
      this.storage?.setItem(KLUCZ_DEV, czy ? "1" : "0");
    } catch {
      // Tryb działa do końca sesji także wtedy, gdy nie da się go zapamiętać.
    }
    // Włączenie w TRAKCIE walki: `nowaWalka()` już przeszło z wyłączonym trybem
    // i linii otwierającej nie zapisało, a walka trwa dalej i jej wywołania
    // wejdą do zrzutu. Bez tego pierwszy prawdziwy zrzut z dodatku przyszedł
    // z `otwarcie: null` i `otwarcia: {}` — dokładnie ten przypadek, bo gracz
    // włącza tryb wtedy, kiedy widzi, że walka jest warta zebrania.
    //
    // Czat wciąż niesie tę linię, więc nie jest to zgadywanie, tylko odczyt
    // spóźniony o kilka sekund. Warunki są dwa i oba są konieczne: musi już
    // trwać jakaś walka (`walka > 0` — inaczej wpisalibyśmy linię pod numer,
    // którego żadne wywołanie nie nosi) i nie może być dla niej zapisu, żeby
    // przełączanie w kółko nie nadpisywało linii zapisanej na czas.
    if (!czy || this.walka === 0 || this.otwarcia.has(this.walka)) return;
    try {
      this.otwarcia.set(this.walka, this.srodowisko.otwarcie());
    } catch {
      // Jak w `nowaWalka()`: to metadana, nie liczba.
    }
  }

  /**
   * Migawka PRZED oryginałem — albo `null`, gdy tryb wyłączony.
   *
   * Przy wyłączonym trybie nie powstaje ANI JEDNA migawka: to jest cały koszt
   * tej zdolności dla gracza, który jej nie włączył, i ma zostać zerem.
   */
  przed(battle: Record<string, unknown>): MigawkaWojownika[] | null {
    if (!this.wlaczonyTryb || this.przepelniony) return null;
    return migawka(battle);
  }

  nowaWalka(): void {
    // Numerujemy ZAWSZE, także przy wyłączonym trybie: gdy gracz włączy go
    // w trakcie sesji, kolejne walki mają dostać kolejne numery, a nie zacząć
    // od zera i zlać się z niczym.
    this.walka += 1;
    if (!this.wlaczonyTryb) return;
    let linia: string | null = null;
    try {
      linia = this.srodowisko.otwarcie();
    } catch {
      // Brak linii otwierającej kosztuje jedno zdanie w nagłówku fixture'a.
    }
    this.otwarcia.set(this.walka, linia);
  }

  po(
    ladunek: unknown,
    battle: Record<string, unknown>,
    przed: MigawkaWojownika[] | null,
  ): void {
    if (!this.wlaczonyTryb || this.przepelniony) return;
    if (typeof ladunek !== "object" || ladunek === null) return;

    const surowy = ladunek as Record<string, unknown>;
    const komunikaty = komunikatyZ(surowy["m"]);
    const po = migawka(battle);

    // ⚠️ **DECYZJA PRZED KOPIĄ, NIE PO NIEJ** (`AUDYT‑81`). Kolejność była
    // odwrotna: najpierw pełny `JSON.parse(JSON.stringify(t))` razem z `w`
    // (wszyscy wojownicy, wszystkie pola), potem dopiero pytanie „czy to nie
    // powtórzenie". W pierwszym prawdziwym zrzucie odpadło **565 z 569 wywołań**,
    // więc 99 % z nich płaciło pełną serializację po to, żeby ją wyrzucić —
    // w callbacku wewnątrz `Engine.battle.update`, czyli w torze, który opóźnia
    // grze turę. Kształt liczymy dziś z ORYGINAŁU (te same klucze), a kopiujemy
    // wyłącznie to, co naprawdę zostaje.
    if (!this.czyZachowac(surowy, komunikaty, po)) {
      this.pominietych += 1;
      return;
    }

    if (this.wpisy.length >= this.maksWpisow) {
      // STAJEMY, zamiast wyrzucać najstarsze. Fixture bez początku walki jest
      // bezużyteczny; bez końca — nadal niesie materiał.
      this.przepelniony = true;
      return;
    }

    // `t` jest cudzym obiektem i żyje dalej po naszym powrocie — kopiujemy go
    // przez JSON, żeby zrzut nie pokazał stanu z KOŃCA walki zamiast z chwili
    // wywołania. To samo dotyczy `t.m`.
    let kopia: Record<string, unknown>;
    try {
      kopia = JSON.parse(JSON.stringify(surowy)) as Record<string, unknown>;
    } catch (blad) {
      kopia = { blad: String(blad) };
    }

    this.wpisy.push({
      nr: this.wpisy.length,
      walka: this.walka,
      ladunek: kopia,
      komunikaty,
      wojownicyPrzed: przed,
      wojownicyPo: po,
    });
  }

  /**
   * Odchudzanie NA ŻYWO — ta sama reguła, co `odchudz` w `tools/walka.ts`.
   *
   * Sonda żyje minuty i zapisuje wszystko; dodatek stoi w karcie godzinami,
   * więc bufor musi być ograniczony. Ograniczamy go tak, żeby nie stracić ani
   * jednej informacji: gra woła `update` także wtedy, gdy nic się nie dzieje —
   * w pierwszym prawdziwym zrzucie **567 z 569 wywołań** miało identyczny
   * ładunek `{move: -1, endBattle: 1}`.
   *
   * Zostaje: każde wywołanie z komunikatami (to jest materiał dowodowy), każdy
   * nowy KSZTAŁT ładunku (żeby nie zgubić, że gra w ogóle wysyła `endBattle`)
   * i każda nowa migawka wojowników (pełna krzywa życia). Odpada wyłącznie
   * DOKŁADNE powtórzenie kształtu i stanu widzianego wcześniej.
   */
  private czyZachowac(
    ladunek: Record<string, unknown>,
    komunikaty: string[],
    po: MigawkaWojownika[],
  ): boolean {
    const ksztalt = JSON.stringify(Object.keys(ladunek).sort());
    const stan = JSON.stringify(po);
    const nowyKsztalt = !this.ksztalty.has(ksztalt);
    const nowyStan = !this.stany.has(stan);
    this.ksztalty.add(ksztalt);
    this.stany.add(stan);
    return komunikaty.length > 0 || nowyKsztalt || nowyStan;
  }

  stan(): StanZrzutu {
    return {
      wywolan: this.wpisy.length,
      komunikatow: this.wpisy.reduce((suma, w) => suma + w.komunikaty.length, 0),
      // Walki liczone po tym, co NAPRAWDĘ trafiło do bufora — walka bez ani
      // jednego zapisanego wywołania nie jest walką, którą da się rozebrać.
      walk: new Set(this.wpisy.map((w) => w.walka)).size,
      pominietych: this.pominietych,
      przepelniony: this.przepelniony,
    };
  }

  zrzut(): Zrzut {
    const pierwsza = this.wpisy[0]?.walka;
    return {
      wersja: WERSJA,
      zrodlo: "dodatek",
      przy: this.srodowisko.teraz(),
      swiat: this.srodowisko.swiat(),
      build: this.srodowisko.build(),
      otwarcie: pierwsza === undefined ? null : (this.otwarcia.get(pierwsza) ?? null),
      otwarcia: Object.fromEntries([...this.otwarcia].map(([nr, linia]) => [String(nr), linia])),
      pominietych: this.pominietych,
      przepelniony: this.przepelniony,
      wpisy: this.wpisy,
    };
  }

  /** Nazwa pliku w tym samym kształcie, co daje sonda. */
  nazwaPliku(): string {
    const przy = this.srodowisko.teraz().replace(/[:.]/g, "-");
    return `walka-${this.srodowisko.swiat()}-${przy}.json`;
  }

  wyczysc(): void {
    this.wpisy.length = 0;
    this.ksztalty.clear();
    this.stany.clear();
    this.otwarcia.clear();
    this.pominietych = 0;
    this.przepelniony = false;
    // ⚠️ **NUMERACJA ZOSTAJE — I TO JEST ZMIANA** (`AUDYT‑70`). Stało tu
    // `this.walka = 0` z uzasadnieniem „po wyczyszczeniu pierwsza zapisana
    // walka ma być pierwszą, a nie ósmą". Życzenie kosmetyczne, a koszt realny:
    // czyszczenie W TRAKCIE walki zostawiało numer 0, którego żadna walka nie
    // nosi, więc kolejne wpisy tej samej walki szły pod `walka: 0`, `otwarcie`
    // zostawało `null`, a strażnik `walka === 0` w `wlacz(true)` czynił
    // doganianie linii otwierającej martwym. Numer ma mówić, DO KTÓREJ walki
    // należy wpis — a nie ile ich zostało w buforze.
    //
    // Cena: po czyszczeniu numery zaczynają się od bieżącego, więc bywają
    // nieciągłe. `--pokaz` wypisuje prawdziwe, a spec zrzutu zapisał tę
    // nieciągłość jako dopuszczalną, zanim jeszcze zaszła.
  }
}

/** Domyślny zapis pliku — `Blob` zamiast schowka, patrz `Opcje`. */
export type ZapisPliku = (nazwa: string, tresc: string) => void;

/**
 * Zapis do pliku, nie do schowka.
 *
 * Zrzut z dziesięciominutowej walki to setki kilobajtów, a `navigator.clipboard`
 * bywa na tyle odmowny bez gestu użytkownika, że nie nadaje się na jedyną drogę
 * wyjścia. Sonda robi dokładnie to samo i z tego samego powodu
 * (`walka-probe.js:169‑187`). `@grant none` w nagłówku nie przeszkadza — `Blob`
 * i `URL.createObjectURL` to zwykłe API strony, nie API Tampermonkey.
 */
export function zapiszPlik(nazwa: string, tresc: string): void {
  const url = URL.createObjectURL(new Blob([tresc], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nazwa;
  // ⚠️ **KOTWICA W DOKUMENCIE I ZWOLNIENIE URL‑A W NASTĘPNYM TAKCIE**
  // (`AUDYT‑69`). Stało tu `a.click()` na węźle odczepionym, a `revokeObjectURL`
  // w `finally` — czyli synchronicznie zaraz po kliknięciu. Chromium to
  // przepuszcza, Firefox potrafi przerwać pobieranie, bo unieważniamy źródło,
  // zanim zdąży je przeczytać. Awaria jest w najgorszym gatunku: `zapiszPlik`
  // nie rzuca, więc okno mówi „Zapisano 1 walkę", a pliku nie ma.
  //
  // Tego miejsca nie ma jak pokryć testem — `click()` na `<a download>` nie
  // robi w jsdom nic, a wstrzykiwana atrapa (`saveFile` w `Opcje`) omija
  // dokładnie tę funkcję. Sprawdzenie jest ręczne, w przeglądarce.
  document.body.append(a);
  try {
    a.click();
  } finally {
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/** Kolekcjoner gotowy do wpięcia w `boot()`. */
export function kolekcjonerStrony(
  storage?: Pick<Storage, "getItem" | "setItem"> | undefined,
): KolekcjonerZrzutu {
  return new KolekcjonerZrzutu(srodowiskoStrony(), storage);
}
