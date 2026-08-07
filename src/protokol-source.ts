import { dekoduj } from "./protokol.ts";
import type { GameGlobals, RosterEntry, RosterSource } from "./roster.ts";
import { zaczynaWalke, type Kolekcjoner, type MigawkaWojownika } from "./zrzut.ts";
import { SlownikGry, SlownikStaly, type Slownik, type TranslationGlobals } from "./slownik-gry.ts";
import type { BattleEvent } from "./types.ts";

/**
 * Źródło ZDARZEŃ z protokołu silnika — jedyne miejsce w `src/`, które dotyka
 * wnętrza gry.
 *
 * ⚠️ **TU PADŁA OBIETNICA „NIE DOTYKAMY STANU GRY".** Stała w `AGENTS.md` do
 * 2026‑08‑04 i owinięcie `Engine.battle.update` przestało ją spełniać — dlatego
 * siedzi w OSOBNYM pliku, ma być widoczne w drzewie, a nie schowane w środku
 * modułu. Co dodatek nadal gwarantuje i co ma tu swój test: oryginał leci
 * pierwszy, jego wynik wraca nietknięty, nasz wyjątek nie wychodzi do gry,
 * a przy odpięciu zdejmujemy wyłącznie SWOJĄ warstwę. Powody i odrzucone
 * warianty: `docs/specy/2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md`.
 *
 * DLACZEGO OWINIĘCIE, A NIE ODPYTYWANIE. Protokół istnieje **wyłącznie
 * w argumencie wywołania** i nigdzie nie osiada: `Engine.battle` po powrocie
 * z `update` niesie STAN (wojownicy, życie, tura), nie zdarzenia. Odpytywanie —
 * czyli to, co robi `roster.ts` — daje krzywą życia i nic więcej.
 *
 * MECHANIKA PRZENIESIONA Z `tools/walka-probe.js`, nie wymyślona tutaj. Ta
 * sonda działa od rundy etapu 1 i te trzy rzeczy są w niej sprawdzone: zegar
 * pilnujący TOŻSAMOŚCI obiektu `battle` (gra podmienia go razem z walką),
 * znacznik na opakowaniu i zdejmowanie warstwy tylko wtedy, gdy na wierzchu
 * stoi nasza.
 */

/**
 * Jedna porcja z protokołu.
 *
 * Niesie i SUROWY materiał, i odczyt. Nie jest to nadmiarowość: nagrywarka
 * zapisuje `komunikaty`, żeby dało się przeliczyć stare nagranie nowszym
 * dekoderem — ta sama zasada, dla której nagrania trzymały wcześniej surowy
 * tekst, a nie policzone statystyki (`recorder.ts`). `sklad` idzie razem, bo
 * bez niego `id` nie ma jak stać się nazwą, a nagranie bez nazw jest nieczytelne.
 */
export type PorcjaProtokolu = {
  komunikaty: readonly string[];
  zdarzenia: BattleEvent[];
  sklad: readonly RosterEntry[];
};

/**
 * Źródło porcji. Obiecuje „wszystkie komunikaty walki po każdej porcji" —
 * czyli narastający strumień, nie przyrost.
 */
export type EventSource = {
  subscribe(listener: (porcja: PorcjaProtokolu) => void): () => void;
};

/**
 * Odpowiednik `StaticLogSource` — do testów i do odtwarzania `protokol.json`.
 *
 * `sklad` jest osobnym parametrem, bo bez niego `id` z komunikatów nie mają jak
 * stać się nazwami, a agregat traci strony i przynależność do składu. Domyślnie
 * pusty: część wywołań bada sam rozbiór komunikatów i nazwy są im obojętne.
 */
export class StaticProtocolSource implements EventSource {
  constructor(
    private readonly komunikaty: readonly string[],
    private readonly slownik: Slownik = new SlownikStaly([]),
    private readonly sklad: readonly RosterEntry[] = [],
  ) {}

  subscribe(listener: (porcja: PorcjaProtokolu) => void): () => void {
    listener({
      komunikaty: this.komunikaty,
      zdarzenia: dekoduj(this.komunikaty, this.sklad, this.slownik),
      sklad: this.sklad,
    });
    return () => {};
  }
}

/**
 * `t.m` → lista komunikatów.
 *
 * Gra iteruje ten ładunek przez `for (var i in data.m)` (`Battle.js:460`), więc
 * **nie obiecuje jednego kształtu**: tablica i obiekt zachowują się tam tak
 * samo. Sonda z etapu 1 broni się przed obydwoma i to jest obrona na zapas,
 * nie wniosek z pomiaru — obiektu nikt jeszcze nie widział.
 *
 * Elementy nie-tekstowe odpadają zamiast lecieć do dekodera jako `String(x)`:
 * `"[object Object]"` rozbiłby się na komunikat o pustych stronach i zapalił
 * czujkę w miejscu, które z protokołem nie ma nic wspólnego.
 */
function porcjaKomunikatow(m: unknown): string[] {
  const surowe: unknown[] = Array.isArray(m)
    ? m
    : typeof m === "object" && m !== null
      ? Object.values(m)
      : [];
  return surowe.filter((x): x is string => typeof x === "string");
}

/**
 * Skład walki narastająco: unia po `id`, późniejsza migawka NADPISUJE wpis,
 * ale go nie kasuje.
 *
 * ⚠️ **BEZ TEGO JEDNA PUSTA MIGAWKA UNIEWAŻNIA CAŁĄ WALKĘ.** Dekoder zamienia
 * `id` na nazwę wyłącznie po tej liście, a dekodujemy CAŁĄ walkę od nowa przy
 * każdej porcji — więc skład, który na chwilę zniknie, zabiera ze sobą także to,
 * co zostało odczytane wcześniej. Zmierzone na `tests/walka-z-gry.ts`: ze składem
 * 17 zdarzeń, 0 nieznanych i 2883 obrażeń zadanych; bez składu te same
 * 17 komunikatów daje **14 nieznanych i 0 obrażeń**.
 *
 * Kiedy migawka bywa pusta: `EngineRosterSource.current()` zwraca `null` przy
 * braku `battle`, pustych `warriors` i braku `myteam` — a nasz odczyt leci PO
 * oryginalnym `update`, więc na komunikacie zamykającym walkę gra może mieć stan
 * już posprzątany.
 *
 * To jest ta sama reguła, którą `skladZeZrzutu` w `tools/walka.ts` stosuje do
 * zrzutów („skład potrafi urosnąć w trakcie […] a późniejsza migawka nie
 * unieważnia wcześniejszej"). Do dziś stosowało ją wyłącznie narzędzie, a odczyt
 * na żywo brał samą bieżącą migawkę — i ta asymetria była całym błędem.
 *
 * Kolejność pierwszego wystąpienia zostaje: skład bywa tytułem nagrania
 * (`recorder.tytul`), a tytuł przestawiający postacie przy każdej porcji
 * wyglądałby na inną walkę.
 */
export function scalSklad(
  dotychczas: readonly RosterEntry[],
  migawka: readonly RosterEntry[],
): RosterEntry[] {
  const wg = new Map(dotychczas.map((w) => [w.id, w]));
  for (const w of migawka) wg.set(w.id, w);
  return [...wg.values()];
}

/** Znacznik na opakowaniu — patrz `zdejmij`. Wersja, żeby dwie różne dały się rozpoznać. */
const ZNACZNIK = "__margometerProtokol";
const WERSJA = 1;

type Opakowanie = ((...argumenty: unknown[]) => unknown) & { [ZNACZNIK]?: number };

/**
 * Co ile sprawdzać, czy gra nie podmieniła obiektu walki.
 *
 * ⚠️ **TO JEST WYŚCIG I ZOSTAJE WYŚCIGIEM.** Gra tworzy NOWY obiekt walki przy
 * każdej walce, więc między jej startem a naszym tikiem jest okno, w którym
 * `update` leci nieowinięte. Okno jest groźniejsze, niż wygląda: w jedynym
 * zrzucie, jaki mamy, **wszystkie 18 komunikatów walki przyszło w JEDNYM
 * wywołaniu**, więc jedna przegapiona porcja to cała walka.
 *
 * 500 → 150 ms zwęża okno ponad trzykrotnie i nic nie kosztuje: sprawdzenie to
 * odczyt jednej właściwości i porównanie tożsamości obiektu. Ale **nie zamyka**
 * wyścigu i nie ma udawać, że zamyka — zamykają go dopiero dwie rzeczy po
 * stronie panelu: pusty odczyt nie przejmuje liczb (`zrodloPanelu`), a gracz
 * dostaje osobny komunikat o spóźnionym podpięciu zamiast fałszywego
 * ostrzeżenia o rozjeździe.
 */
const CZESTOTLIWOSC_MS = 150;

export type ProtocolSourceOptions = {
  /** Wstrzykiwane, żeby dało się przewinąć zegar w teście — jak w `index.ts`. */
  schedule?: (step: () => void, everyMs: number) => number;
  cancel?: (handle: number) => void;
  /**
   * Zbieranie surowego materiału do fixture'ów (`src/zrzut.ts`).
   *
   * ⚠️ **JEST TU PO TO, ŻEBY NIE OWIJAĆ `update` DRUGI RAZ.** Sonda
   * `tools/walka-probe.js` zakłada własną warstwę obok naszej i to jest jej
   * jedyna wada: dwie warstwy na tej samej funkcji znoszą sens czterech
   * gwarancji, które ten plik składa. Kolekcjoner dostaje więc te same
   * argumenty, które i tak przez to opakowanie przechodzą — i nic poza tym.
   *
   * Nieobecny domyślnie: dodatek bez trybu deweloperskiego nie płaci nic.
   */
  kolekcjoner?: Kolekcjoner;
};

export class EngineProtocolSource implements EventSource {
  private komunikaty: string[] = [];
  /** Skład TEJ walki, narastająco — patrz `scalSklad`. Zerowany razem z `komunikaty`. */
  private sklad: RosterEntry[] = [];
  /** Obiekt walki, na którym stoi nasze opakowanie — tożsamość, nie zawartość. */
  private owiniety: Record<string, unknown> | null = null;
  /**
   * Czy od ostatniego odcięcia nie przeszło przez nas ani jedno wywołanie.
   *
   * Istnieje dla JEDNEGO przypadku i bez niego byłby regres: podpięcie się
   * przed pierwszą walką odcina ją (nowy obiekt `battle`), a chwilę potem
   * przychodzi jej `init` — bez tej flagi ta sama walka policzyłaby się dwa
   * razy i pierwszy fixture w sesji nosiłby numer 2.
   */
  private swiezaWalka = false;
  private oryginal: ((...argumenty: unknown[]) => unknown) | null = null;

  /**
   * `window` niesie tu DWIE różne rzeczy z gry: `Engine` (protokół) i `_t`
   * (brzmienia). Trzymane razem, bo to ten sam obiekt strony — ale typy stoją
   * osobno, żeby widać było, że dotykamy dwóch niezależnych rzeczy.
   */
  constructor(
    private readonly window: GameGlobals & TranslationGlobals,
    private readonly roster: RosterSource,
    private readonly options: ProtocolSourceOptions = {},
    private readonly slownik: Slownik = new SlownikGry(window),
  ) {}

  subscribe(listener: (porcja: PorcjaProtokolu) => void): () => void {
    const schedule =
      this.options.schedule ?? ((step, everyMs) => setInterval(step, everyMs) as never);
    const cancel = this.options.cancel ?? ((handle: number) => clearInterval(handle));

    const uchwyt = schedule(() => this.zapewnijOwiniecie(listener), CZESTOTLIWOSC_MS);
    this.zapewnijOwiniecie(listener);

    return () => {
      cancel(uchwyt);
      this.zdejmij();
    };
  }

  /**
   * Odczyt `Engine.battle` w try/catch i bez `any` — wzór `roster.ts:79‑91`.
   * Dostęp do wnętrzności gry potrafi rzucić przy zmianie kontekstu strony,
   * a `any` na wejściu z cudzego kodu jest tu gorsze niż gdziekolwiek indziej.
   */
  private battle(): Record<string, unknown> | null {
    let surowy: unknown;
    try {
      const engine = this.window.Engine ?? this.window.getEngine?.();
      surowy = engine?.battle;
    } catch {
      return null;
    }
    return typeof surowy === "object" && surowy !== null
      ? (surowy as Record<string, unknown>)
      : null;
  }

  private zapewnijOwiniecie(listener: (porcja: PorcjaProtokolu) => void): void {
    const battle = this.battle();
    if (battle === null) return;

    const update = battle["update"];
    if (typeof update !== "function") return;

    // TOŻSAMOŚĆ, nie obecność. Gra tworzy nowy obiekt walki przy każdej walce,
    // więc „update jest już owinięty" trzeba pytać o TEN obiekt, nie w ogóle.
    if (this.owiniety === battle && (update as Opakowanie)[ZNACZNIK] === WERSJA) return;

    // Nowy OBIEKT walki to na pewno nowa walka. Warunek WYSTARCZAJĄCY, ale nie
    // konieczny — patrz `odetnijWalke` i `zaczynaWalke`.
    if (this.owiniety !== battle) this.odetnijWalke();

    const oryginal = update as (...argumenty: unknown[]) => unknown;
    const owinieta: Opakowanie = (...argumenty: unknown[]): unknown => {
      // ⚠️ **GRANICĄ WALKI JEST `data.init`, A NIE WYMIANA OBIEKTU** (`AUDYT‑56`).
      // Warunek wyżej stał tu sam i był NIEKONIECZNY: gra tworzy `Engine.battle`
      // raz i używa go dalej, zmieniając stan, nie referencję. Zmierzone na
      // panelu, nie wywnioskowane — ten sam strumień podany dwa razy dawał
      // 2644 → 5288 obrażeń i 12 → 24 tury. Druga walka w sesji liczyła się
      // razem z pierwszą i rozwiązywała `id` po nazwach z tamtej.
      //
      // ⚠️ **I NIC W DÓŁ POTOKU TEGO NIE ŁAPIE — TO JEST JEDYNA GRANICA.**
      // Zdanie stało tu jako „bo `splitFights` nie ma po czym dzielić", czyli
      // wskazywało na drugą warstwę, która **od 2026‑08‑04 była martwa**:
      // dzieliła po `fight-start`, a protokół takiego zdarzenia nie niesie
      // (klient syntetyzuje linię otwierającą poza `data.m`). Zeszła z drzewa
      // 2026‑08‑07 (`AUDYT‑108`). Odcięcie niżej jest więc JEDYNYM miejscem,
      // w którym dwie walki przestają być jedną — pomyłka tutaj jest po prostu
      // podwojoną liczbą w panelu, bez ostrzeżenia.
      //
      // Odcięcie leci PRZED wszystkim innym w tym wywołaniu, bo kolekcjoner
      // zapisuje ładunek `init` już pod NOWYM numerem walki — inaczej wpis
      // otwierający trafiałby do poprzedniej.
      try {
        if (zaczynaWalke(argumenty[0]) && !this.swiezaWalka) this.odetnijWalke();
      } catch (error) {
        // Jak wszystko przed oryginałem: nasz błąd nie ma prawa przewrócić tury.
        console.error("[MargoMeter] granica walki nie została odczytana", error);
      }

      // ⚠️ **JEDYNY NASZ KOD PRZED ORYGINAŁEM — I DLATEGO MA WŁASNĄ OSŁONĘ.**
      // Migawka „przed" musi powstać, zanim gra przeliczy porcję, bo inaczej nie
      // ma z czym porównać stanu „po". Ale wyjątek stąd przewróciłby graczowi
      // turę, ZANIM cokolwiek się policzy — czyli gorzej niż wyjątek z odczytu.
      // Osłona niżej go nie obejmuje, bo tamta stoi za `oryginal.apply`.
      let przed: MigawkaWojownika[] | null = null;
      try {
        przed = this.options.kolekcjoner?.przed(battle) ?? null;
      } catch (error) {
        console.error("[MargoMeter] zrzut padł przed porcją", error);
      }

      // ⚠️ **`finally`, NIE ZWYKŁA LINIA NA KOŃCU.** Wyjątek z `oryginal.apply`
      // jest błędem GRY i ma lecieć dalej nietknięty — ale gdyby zabrał ze sobą
      // wyzerowanie flagi, `swiezaWalka` zostałaby `true` na zawsze i NASTĘPNY
      // `init` zostałby przeoczony jako „ta sama świeża walka". Czyli dokładnie
      // sklejenie dwóch walk, które ten plik przed chwilą naprawił (`AUDYT‑56`),
      // wróciłoby wąskim wejściem: jedna awaria gry i licznik znów sumuje.
      try {
        // ORYGINAŁ LECI PIERWSZY, a jego wynik wraca NIETKNIĘTY. To nie wygoda —
        // to warunek obietnicy „nie zmieniamy przebiegu walki".
        const wynik = oryginal.apply(battle, argumenty);

        // OSOBNA OSŁONA, nie wspólna z odczytem — i to jest różnica, która ma
        // znaczenie. Zrzut leci PRZED dekoderem z tego samego powodu, dla którego
        // nagrywanie wyprzedza licznik w `index.ts:48`: gdyby dekoder się wysypał,
        // zabrałby ze sobą surowy materiał, którym dałoby się tę awarię odtworzyć.
        // Ale odwrotnie już NIE: narzędzie deweloperskie nie ma prawa zatrzymać
        // licznika, który jest produktem. We wspólnym `try` rzucone `po()`
        // przeskakiwałoby `przyjmij` i panel zamarłby po cichu.
        try {
          this.options.kolekcjoner?.po(argumenty[0], battle, przed);
        } catch (error) {
          console.error("[MargoMeter] zrzut padł na tej porcji", error);
        }

        try {
          this.przyjmij(argumenty[0], listener);
        } catch (error) {
          // Wyjątek z NASZEGO kodu nie ma prawa wyjść do gry. Osłona szczelniejsza
          // niż w `index.ts:45`, bo tam awaria psuje panel, a tu psułaby TURĘ.
          console.error("[MargoMeter] protokół padł na tej porcji", error);
        }
        return wynik;
      } finally {
        // Wywołanie przez nas przeszło, więc świeżość odcięcia się kończy:
        // następny `init` opisuje już NASTĘPNĄ walkę. Zerujemy na wyjściu,
        // nie na wejściu, żeby `init` PIERWSZEJ walki po podpięciu nie liczył
        // jej drugi raz — patrz `odetnijWalke`.
        this.swiezaWalka = false;
      }
    };
    owinieta[ZNACZNIK] = WERSJA;

    battle["update"] = owinieta;
    this.owiniety = battle;
    this.oryginal = oryginal;
  }

  /**
   * Odcina TĘ walkę od poprzedniej — jedno miejsce dla obu granic.
   *
   * Woła się z dwóch stron i to jest cała historia `AUDYT‑56`: z wymiany
   * obiektu `Engine.battle` (warunek WYSTARCZAJĄCY — nowy obiekt to na pewno
   * nowa walka) i z `data.init` w ładunku (warunek KONIECZNY — bo obiektu gra
   * nie wymienia). Dopóki stała tu tylko pierwsza droga, druga walka w sesji
   * doliczała się do pierwszej.
   *
   * Bufor komunikatów i skład lecą do zera, bo nie należą do nowej walki.
   * Kolekcjoner dostaje NUMER, ale swojego zapisu nie czyści: zrzut ma
   * obejmować całą sesję, a granicę niesie pole `walka` w każdym wpisie.
   */
  private odetnijWalke(): void {
    this.komunikaty = [];
    this.sklad = [];
    this.swiezaWalka = true;
    try {
      this.options.kolekcjoner?.nowaWalka();
    } catch (error) {
      console.error("[MargoMeter] zrzut nie odnotował nowej walki", error);
    }
  }

  /**
   * Ładunek `t` → zdarzenia. Wszystko tu jest defensywne, bo kształt `t` jest
   * kontraktem, którego nikt nam nie obiecał.
   */
  private przyjmij(ladunek: unknown, listener: (porcja: PorcjaProtokolu) => void): void {
    if (typeof ladunek !== "object" || ladunek === null) return;
    const t = ladunek as Record<string, unknown>;

    const porcja = porcjaKomunikatow(t["m"]);
    if (porcja.length === 0) return;

    this.komunikaty.push(...porcja);
    // Migawka DOKŁADA się do składu walki, zamiast go zastępować. `null` znaczy
    // „gra akurat nie wystawia stanu", a nie „walka nie ma uczestników" —
    // potraktowanie tego jako pustego składu kasowało cały dotychczasowy odczyt.
    const migawka = this.roster.current();
    if (migawka !== null) this.sklad = scalSklad(this.sklad, migawka);
    const sklad = this.sklad;
    // Dekodujemy CAŁĄ walkę od nowa, nie przyrost. Ta sama decyzja co
    // w `session.ts:53‑57`: stan przyrostowy byłby źródłem podwójnego liczenia,
    // a walka ma kilkadziesiąt komunikatów, więc koszt jest bez znaczenia.
    listener({
      komunikaty: [...this.komunikaty],
      zdarzenia: dekoduj(this.komunikaty, sklad, this.slownik),
      sklad,
    });
  }

  /**
   * Przywrócenie oryginału — i to jest połowa umowy z gospodarzem strony.
   *
   * ZDEJMUJEMY WYŁĄCZNIE SWOJE. Jeśli na wierzchu stoi cudza warstwa (inny
   * dodatek owinął `update` po nas), przywrócenie naszego oryginału skasowałoby
   * ją bez śladu. Wtedy zostawiamy wszystko tak, jak jest — cudzy kod nie jest
   * nasz do naprawiania.
   */
  private zdejmij(): void {
    const battle = this.owiniety;
    const oryginal = this.oryginal;
    this.owiniety = null;
    this.oryginal = null;
    this.komunikaty = [];
    this.sklad = [];
    if (battle === null || oryginal === null) return;

    const biezacy = battle["update"];
    if (typeof biezacy === "function" && (biezacy as Opakowanie)[ZNACZNIK] === WERSJA) {
      battle["update"] = oryginal;
    }
  }
}
