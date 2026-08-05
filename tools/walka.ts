/**
 * Rozbicie zrzutu z `tools/walka-probe.js` na **moduł z materiałem** — i podgląd
 * tego, co w zrzucie siedzi.
 *
 * CO POWSTAJE. Plik `tests/walka-<nazwa>.ts` w kształcie, który w repo już stoi
 * (`tests/walka-z-gry.ts`): nagłówek z pochodzeniem, `KOMUNIKATY` i `SKLAD`.
 * Zasada z `AGENTS.md` — **materiał testowy powstaje W KODZIE, nie w plikach
 * danych** — i to jest cała różnica wobec katalogu z `protokol.json`
 * i `meta.json`, który stąd wychodził do 2026‑08‑04: tamten dało się dołożyć
 * do repo bez dotknięcia jednego testu, więc leżał martwy i nikt tego nie
 * widział. Moduł, którego nikt nie zaimportuje, zapala `noUnusedLocals` przy
 * pierwszej próbie użycia i widać go w `tsc`.
 *
 * CZEGO NARZĘDZIE NIE ROBI: nie opisuje walki. Trzy pola nagłówka wychodzą
 * z `DO UZUPEŁNIENIA` i mają tak wyglądać, dopóki człowiek ich nie wypełni —
 * zmyślony opis byłby gorszy niż jego brak, bo opis fixture'a czyta się potem
 * zamiast materiału.
 *
 * DLACZEGO ZRZUT Z SONDY, A NIE Z CUDZEGO SERWISU. Publiczne zrzuty walk bywają
 * PRZEKODOWANE po drodze (`=` na `.`, `+` na `@`, `dmg` skrócone do `D`) —
 * odpowiadają wtedy wyłącznie na pytanie „czy gra w ogóle emituje klucz X",
 * a nie „jak dokładnie brzmi komunikat". Sonda daje ładunek jeden do jednego
 * z klienta.
 *
 * ⚠️ **OD 2026‑08‑05 SĄ DWA WYJŚCIA, NIE JEDNO.** `--rozbij` daje moduł jak
 * wyżej; `--zachowaj` kładzie SUROWY zrzut w `tests/fixtures/`, bo moduł gubi
 * `hp.max`, ładunki i granice wywołań — a bez nich nie ma świadka spoza dekodera.
 * Powody i to, czym się to różni od katalogu skasowanego 2026‑08‑04, stoją przy
 * `zachowajZrzut`. Zwykle robi się OBIE rzeczy z jednego pliku.
 *
 * Użycie:
 *   bun tools/walka.ts --zachowaj ~/Pobrane/walka-tempest-….json --nazwa pvp-trucizna
 *   bun tools/walka.ts --rozbij ~/Pobrane/walka-tempest-….json --nazwa pvp-trucizna
 *   bun tools/walka.ts --pokaz ~/Pobrane/walka-tempest-….json
 *   bun tools/walka.ts --klucze <plik.json> […]
 */

import { existsSync } from "node:fs";
import type { RosterEntry } from "../src/roster.ts";

/** Gdzie ląduje moduł z `--rozbij`. */
const MATERIAL = new URL("../tests/", import.meta.url).pathname;

/** Gdzie ląduje SUROWY zrzut z `--zachowaj`. Patrz komentarz przy `zachowajZrzut`. */
const FIXTURY = new URL("../tests/fixtures/", import.meta.url).pathname;

/**
 * Kształt zrzutu — JEDEN typ dla obu dróg zbierania.
 *
 * ⚠️ **STAŁ TU WŁASNY, RÓWNOLEGŁY ZAPIS TEGO SAMEGO KSZTAŁTU** i zszedł
 * 2026‑08‑05, gdy zrzut zaczął powstawać także w dodatku (`src/zrzut.ts`).
 * Typ żyjący w dwóch plikach naraz to w tym repo zapisana przyczyna wszystkich
 * rozjazdów (`SOLID §11`): pole dopisane po jednej stronie i zapomniane po
 * drugiej daje tu plik, który zapisuje się poprawnie i nie daje rozebrać.
 * Kierunek importu jest taki, a nie odwrotny, bo to `src/` PISZE, a narzędzie
 * tylko czyta — i `tools/walka.ts` importuje z `src/` już wcześniej
 * (`RosterEntry`).
 */
export type { MigawkaWojownika, Wywolanie, Zrzut } from "../src/zrzut.ts";
import type { Wywolanie, Zrzut } from "../src/zrzut.ts";
import { zaczynaWalke } from "../src/zrzut.ts";

/**
 * Sprawdzenie kształtu zrzutu przy WCZYTANIU, nie przy użyciu.
 *
 * Zrzut przychodzi z przeglądarki, przez plik na dysku, czasem po ręcznej
 * edycji. Wzór z `src/recorder.ts`: sprawdzamy każde pole, bo połowicznie
 * poprawny zrzut zapisałby się jako materiał z gry i wyglądał na dowód, nie
 * niosąc go. Nagłówek zrzutu jest tutaj, każde wywołanie — w `wpisZrzutu`.
 */
export function czytajZrzut(tekst: string): Zrzut {
  let dane: unknown;
  try {
    dane = JSON.parse(tekst);
  } catch {
    throw new Error("plik nie jest JSON-em — czy to na pewno wynik `margometerWalka.pobierz()`?");
  }
  const z = dane as Partial<Zrzut>;
  if (typeof z.wersja !== "number" || !Array.isArray(z.wpisy)) {
    throw new Error("zrzut nie ma pól `wersja` i `wpisy` — to nie jest wynik sondy");
  }
  if (z.wpisy.length === 0) {
    // Pusty zrzut znaczy zwykle „sonda wklejona po walce". Zapisanie go dałoby
    // moduł wyglądający jak materiał z gry i pusty w środku.
    throw new Error(
      "zrzut nie ma ani jednego wywołania — sonda była wklejona po walce " +
        "albo przed nią stała inna, która zdjęła tę.",
    );
  }
  return {
    wersja: z.wersja,
    przy: typeof z.przy === "string" ? z.przy : new Date().toISOString(),
    swiat: typeof z.swiat === "string" ? z.swiat : "nieznany",
    build: typeof z.build === "string" ? z.build : null,
    otwarcie: typeof z.otwarcie === "string" ? z.otwarcie : null,
    // Pola młodsze od sondy. Brak któregokolwiek NIE jest błędem: tak wygląda
    // każdy zrzut zebrany przed 2026‑08‑05 i te pliki mają się dalej czytać.
    ...(z.zrodlo === "dodatek" || z.zrodlo === "sonda" ? { zrodlo: z.zrodlo } : {}),
    ...(typeof z.otwarcia === "object" && z.otwarcia !== null ? { otwarcia: z.otwarcia } : {}),
    ...(typeof z.pominietych === "number" ? { pominietych: z.pominietych } : {}),
    ...(z.przepelniony === true ? { przepelniony: true } : {}),
    ...(typeof z.odchudzonych === "number" ? { odchudzonych: z.odchudzonych } : {}),
    wpisy: z.wpisy.map(wpisZrzutu),
  };
}

/**
 * Sprawdzenie POJEDYNCZEGO wywołania.
 *
 * ⚠️ **NAGŁÓWEK WYŻEJ OBIECYWAŁ „sprawdzamy każde pole" I BYŁA TO NIEPRAWDA**
 * (`AUDYT‑65`): walidacja kończyła się na `wersja` i `Array.isArray(wpisy)`,
 * a sama tablica szła dalej nietknięta. `src/zrzut.ts` obiecywał to samo
 * z drugiej strony („pisarz jest typowany, czytelnik sprawdza"). Zmierzony
 * skutek: wpis bez `komunikaty` przechodził przez `flatMap` jako `[undefined]`
 * BEZ RZUTU, więc wchodził do `FIXTURY`, do `KORPUS` i do `dekoduj` — z dziurą
 * zamiast komunikatu, w materiale, który cały jest po to, żeby być dowodem.
 *
 * Rzucamy z NUMEREM wpisu, bo plik ma setki wywołań i „zrzut jest zepsuty" bez
 * wskazania miejsca zmusza do szukania ręką.
 *
 * Pola nadmiarowe zostają nietknięte — patrz `render` w najstarszym fixturze
 * (`AUDYT‑63`). Czytelnik ma odrzucać materiał NIEPEŁNY, a nie bogatszy, niż
 * zna: zrzut z przyszłą wersją sondy ma się dać przeczytać.
 */
function wpisZrzutu(wpis: unknown, i: number): Wywolanie {
  const gdzie = `wpis ${i}`;
  if (typeof wpis !== "object" || wpis === null) {
    throw new Error(`${gdzie} nie jest obiektem — zrzut jest uszkodzony`);
  }
  const w = wpis as Partial<Wywolanie>;
  if (typeof w.nr !== "number") throw new Error(`${gdzie} nie ma numeru \`nr\``);
  if (typeof w.ladunek !== "object" || w.ladunek === null) {
    throw new Error(`${gdzie} nie ma \`ladunek\` — bez niego nie ma czego czytać`);
  }
  if (!Array.isArray(w.komunikaty) || w.komunikaty.some((k) => typeof k !== "string")) {
    throw new Error(`${gdzie} ma \`komunikaty\` inne niż lista tekstów`);
  }
  // `Przed` wolno być `null` — to znaczy „migawka nie powstała" i jest
  // odpowiedzią, nie brakiem (`AUDYT‑73`). `Po` musi być listą: powstaje po
  // oryginalnym `update`, więc jego brak znaczyłby uszkodzony zapis.
  if (w.wojownicyPrzed !== null && !Array.isArray(w.wojownicyPrzed)) {
    throw new Error(`${gdzie} ma \`wojownicyPrzed\` inne niż lista albo \`null\``);
  }
  if (!Array.isArray(w.wojownicyPo)) {
    throw new Error(`${gdzie} nie ma listy \`wojownicyPo\``);
  }
  return w as Wywolanie;
}

/**
 * Numery walk obecne w zrzucie, rosnąco.
 *
 * Pusta lista znaczy „zrzut nie numeruje walk" — tak wygląda każdy zrzut sondy,
 * bo ta żyje jedną walkę i pola `walka` nie ma. To NIE to samo, co „zrzut ma
 * zero walk".
 */
export function walkiWZrzucie(zrzut: Zrzut): number[] {
  const numery = new Set<number>();
  for (const wpis of zrzut.wpisy) {
    if (typeof wpis.walka === "number") numery.add(wpis.walka);
  }
  return [...numery].sort((a, b) => a - b);
}

/**
 * Zrzut zawężony do jednej walki.
 *
 * PO CO. Dodatek stoi w karcie godzinami i zbiera całą sesję, więc jeden plik
 * potrafi nieść kilka walk. Sklejenie ich w jeden moduł dałoby fixture
 * z pomieszanymi komunikatami i scalonym składem — materiał wyglądający na
 * dowód i kłamiący o tym, kto z kim walczył. `--rozbij` woli więc odmówić
 * i kazać wybrać, niż zgadnąć.
 *
 * `nr` numerujemy od nowa, żeby zawężony zrzut wyglądał jak zrzut jednej walki
 * — inaczej pierwszy wpis miałby `nr` z połowy sesji.
 *
 * ⚠️ **STAŁO TU `{ ...zrzut, otwarcie, wpisy }` I PRZEMYCAŁO METADANE CUDZYCH
 * WALK** (`AUDYT‑66`). `...zrzut` zostawiał `otwarcia` CAŁEJ sesji, więc fixture
 * jednej walki wychodził z linią otwierającą obcej pod `otwarcia["2"]`, a do
 * tego z `pominietych` i `przepelniony` policzonymi dla wszystkich walk naraz.
 * To jest dokładnie ten zarzut, który ta runda postawiła skasowanemu
 * `meta.json`: materiał dowodowy niosący metadane o materiale, którego w nim
 * nie ma. Dlatego pola wypisujemy po jednym, a nie rozsypujemy.
 *
 * `pominietych` i `przepelniony` NIE przechodzą, bo są własnością sesji, nie
 * walki, i zawężone nie dałyby się policzyć — zrzut nie mówi, ile odsiano
 * w której walce. Milczenie jest tu uczciwsze niż liczba o niejasnym zakresie.
 */
export function wybierzWalke(zrzut: Zrzut, numer: number): Zrzut {
  const wpisy = zrzut.wpisy
    .filter((w) => w.walka === numer)
    .map((w, i) => ({ ...w, nr: i }));
  if (wpisy.length === 0) {
    throw new Error(
      `w zrzucie nie ma walki ${numer} — są: ${walkiWZrzucie(zrzut).join(", ") || "brak numeracji"}`,
    );
  }
  return {
    wersja: zrzut.wersja,
    przy: zrzut.przy,
    swiat: zrzut.swiat,
    build: zrzut.build,
    // `null`, a nie `zrzut.otwarcie`: linia otwierająca sesji należy do walki,
    // przy której powstała, i podstawienie jej tutaj byłoby tym samym błędem
    // w mniejszej skali.
    otwarcie: zrzut.otwarcia?.[String(numer)] ?? null,
    ...(zrzut.zrodlo !== undefined ? { zrodlo: zrzut.zrodlo } : {}),
    wpisy,
  };
}

/**
 * Wszystkie komunikaty protokołu, w kolejności zapisu.
 *
 * Wywołania są tu granicą porcji, nie zdarzenia — jedno `update` niesie tyle
 * komunikatów, ile serwer akurat przysłał, i przy odczycie ta granica nic nie
 * znaczy. Spłaszczamy więc od razu.
 */
export function komunikaty(wpisy: Wywolanie[]): string[] {
  return wpisy.flatMap((w) => w.komunikaty);
}

/**
 * Klucze parametrów komunikatu, bez wartości.
 *
 * Kształt komunikatu to `nadawca;cel;klucz=wartość;klucz=wartość;…`; dwa
 * pierwsze segmenty to strony. Klucz kończy się na PIERWSZYM `=`, bo wartości
 * bywają złożone. Parametry bez wartości (`r`, `N`, `Y`) są całym segmentem.
 *
 * Separatorem jest `=`, czyli to, co naprawdę przysyła serwer — a nie to, co
 * z niego robią cudze serwisy z zapisami walk (kropka zamiast `=`, `@` zamiast
 * `+`). Ta funkcja czyta WYŁĄCZNIE ładunek z sondy i innej gramatyki nie zna.
 */
export function kluczeKomunikatu(komunikat: string): string[] {
  return komunikat
    .split(";")
    .slice(2)
    .filter((s) => s.length > 0)
    .map((s) => {
      const rowna = s.indexOf("=");
      return rowna === -1 ? s : s.slice(0, rowna);
    });
}

/**
 * Strony komunikatu: `id` albo `id=hpp`, albo `0` przy braku strony.
 *
 * `0` w drugim segmencie NIE jest brakiem danych do uzupełnienia — to jest
 * odpowiedź „ten komunikat nie ma celu" (tyknięcie trucizny, utrata tury).
 * Zwracamy `null`, żeby nie dało się tego pomylić z wojownikiem o id 0.
 */
export function stronyKomunikatu(
  komunikat: string,
): { id: number; hpp: number | null }[] {
  return komunikat
    .split(";")
    .slice(0, 2)
    .map((segment) => {
      const [id, hpp] = segment.split("=");
      const numer = Number(id);
      if (!Number.isFinite(numer) || numer === 0) return null;
      return { id: numer, hpp: hpp === undefined ? null : Number(hpp) };
    })
    .filter((s): s is { id: number; hpp: number | null } => s !== null);
}

/**
 * Skład walki odczytany ze zrzutu — `id`, `name` i strona.
 *
 * PO CO. Dekoder protokołu zamienia `id` na nazwę wyłącznie po tej liście,
 * a `aggregate` bierze ją jako skład autorytatywny. Bez niej porównanie obu
 * dróg mierzyłoby też różnicę w numeracji instancji, a nie same liczby.
 *
 * SKĄD `side`. Migawka niesie `team` z gry, a nasza strona 0 to drużyna GRACZA
 * — więc potrzebny jest `myteam` z ładunku, i to on decyduje. Wersja
 * „`team !== 2` to strona 0" jest kusząca, bo tak klient dzieli skład w linii
 * otwierającej (`Battle.js:935‑936`), ale opiera się na założeniu, że gracz
 * nigdy nie stoi w drużynie 2 — a tego nikt nie sprawdził. Zrzut bez `myteam`
 * ma więc paść z powodem, zamiast zgadywać stronę i cicho odwrócić drużyny.
 *
 * Wojownicy zbierani są ze WSZYSTKICH wywołań, nie z pierwszego: skład potrafi
 * urosnąć w trakcie (przyzwania, zastępowi), a późniejsza migawka nie unieważnia
 * wcześniejszej — wygrywa ostatnie wystąpienie danego `id`.
 */
export function skladZeZrzutu(zrzut: Zrzut): {
  id: number;
  name: string;
  side: number;
  prof?: string;
  lvl?: number;
}[] {
  const myteam = mojaDruzyna(zrzut);
  if (myteam === null) {
    throw new Error(
      "zrzut nie niesie `myteam` w żadnym ładunku — bez niego nie da się " +
        "odróżnić drużyny gracza od przeciwnej, a zgadnięcie odwróciłoby strony",
    );
  }

  const wg = new Map<number, { id: number; name: string; side: number; prof?: string; lvl?: number }>();
  for (const wpis of zrzut.wpisy) {
    for (const surowy of [...(wpis.wojownicyPrzed ?? []), ...wpis.wojownicyPo]) {
      if (typeof surowy !== "object" || surowy === null) continue;
      const w = surowy as Record<string, unknown>;
      const id = w["id"];
      const name = w["name"];
      const team = w["team"];
      if (typeof id !== "number" || typeof name !== "string" || name === "") continue;
      if (typeof team !== "number") continue;
      const prof = w["prof"];
      const lvl = w["lvl"];
      wg.set(id, {
        id,
        name,
        side: team === myteam ? 0 : 1,
        ...(typeof prof === "string" ? { prof } : {}),
        ...(typeof lvl === "number" ? { lvl } : {}),
      });
    }
  }
  return [...wg.values()];
}

/** `myteam` z pierwszego ładunku, który go niesie. Gra podaje je raz, przy otwarciu. */
export function mojaDruzyna(zrzut: Zrzut): number | null {
  for (const wpis of zrzut.wpisy) {
    const wartosc = wpis.ladunek["myteam"];
    if (typeof wartosc === "number") return wartosc;
  }
  return null;
}

/** Histogram kluczy, od najczęstszego. */
export function histogram(wiadomosci: string[]): [string, number][] {
  const licznik = new Map<string, number>();
  for (const komunikat of wiadomosci) {
    for (const klucz of kluczeKomunikatu(komunikat)) {
      licznik.set(klucz, (licznik.get(klucz) ?? 0) + 1);
    }
  }
  return [...licznik].sort((a, b) => b[1] - a[1]);
}

/**
 * Zrzut bez powtórzeń — wpisy, które nie wnoszą nic nowego, wypadają.
 *
 * PO CO. Gra woła `update` w pętli także wtedy, gdy nic się nie dzieje.
 * W pierwszym prawdziwym zrzucie było to **569 wywołań, z czego 567 miało
 * identyczny ładunek `{move: -1, endBattle: 1}`** — odpytywanie po zakończeniu
 * walki. Cały plik ważył 1,8 MB, a treści było w nim 15 kB.
 *
 * ⚠️ **DO 2026‑08‑04 CHUDY ZRZUT SZEDŁ DO GITA I TO BYŁ CAŁY POWÓD** tej
 * funkcji. Dziś do repo trafia sam moduł z komunikatami, więc odchudzanie nie
 * oszczędza ani bajta w historii — została mu jedna rola i dla niej zostaje:
 * powiedzieć człowiekowi zaraz po zrzucie, ile z tego, co zebrał, było TREŚCIĄ.
 * „569 wywołań, treści w 2" to jedyny sygnał, że sonda stała pół godziny po
 * walce, i lepiej go zobaczyć teraz niż przy trzecim zrzucie z rzędu.
 *
 * CO ZOSTAJE, i to jest cała ostrożność tej funkcji:
 *
 * 1. **każdy wpis z komunikatami** — bez wyjątku, to jest materiał dowodowy;
 * 2. **każdy nowy KSZTAŁT ładunku** (zbiór kluczy) — żeby nie zgubić tego, że
 *    gra w ogóle wysyła `endBattle` albo `poolTime`, choćby raz;
 * 3. **każda nowa migawka wojowników** — czyli pełna krzywa życia, bez
 *    powtórzeń tego samego stanu.
 *
 * Odrzucane są wyłącznie wpisy, które są DOKŁADNYM powtórzeniem kształtu
 * i stanu widzianego wcześniej. To nie jest „skracanie zrzutu do tego, co
 * nam pasuje" — żaden odrzucony wpis nie niesie informacji, której nie ma
 * w zachowanym.
 */
export function odchudz(wpisy: Wywolanie[]): Wywolanie[] {
  const ksztalty = new Set<string>();
  const stany = new Set<string>();
  return wpisy.filter((w) => {
    const ksztalt = JSON.stringify(Object.keys(w.ladunek).sort());
    const stan = JSON.stringify(w.wojownicyPo);
    const nowyKsztalt = !ksztalty.has(ksztalt);
    const nowyStan = !stany.has(stan);
    ksztalty.add(ksztalt);
    stany.add(stan);
    return w.komunikaty.length > 0 || nowyKsztalt || nowyStan;
  });
}

/**
 * Wywołania, w których ładunek niesie `init` — czyli GRANICE WALK.
 *
 * ⚠️ **POLE `walka` NIE WYSTARCZA I TO JEST POMIAR, NIE OSTROŻNOŚĆ.** Numerowanie
 * chodzi po tożsamości obiektu `Engine.battle` (`src/protokol-source.ts:241`),
 * a gra tworzy ten obiekt RAZ i używa go dalej — zmienia jego stan, nie
 * referencję. Pierwszy zrzut z dodatku (tempest, 2026‑08‑05) niósł przez to dwie
 * walki pod jednym numerem: wpisy 0–1 to koniec walki z warchlakami, wpis 2 ma
 * `init` i zaczyna walkę z odyńcami. `skladZeZrzutu` dawał z tego SZEŚCIU
 * wojowników, z czego trzech nie występuje w żadnym komunikacie.
 *
 * Że `init` jest znacznikiem startu, wie klient gry: `Battle.js:344` reaguje na
 * `isset(data.init)` zamknięciem okien, a `:954` przelicza na nim skład od zera.
 * Cytaty i pomiar: `docs/MECHANIKA.md`, wpis „Granica walk".
 */
export function graniceWalk(wpisy: Wywolanie[]): number[] {
  // Predykat z `src/zrzut.ts`, nie własny — patrz `zaczynaWalke`. Narzędzie
  // i dodatek muszą mówić o granicy TO SAMO, inaczej rozjazd jest cichy.
  return wpisy.filter((w) => zaczynaWalke(w.ladunek)).map((w) => w.nr);
}

/**
 * Skąd wziął się materiał — jednym zdaniem, do nagłówka modułu i do `--pokaz`.
 *
 * Pochodzenie musi się zgadzać co do narzędzia: nagłówek mówiący „zrzut sondy"
 * nad materiałem zebranym dodatkiem byłby nieprawdą o tym, JAK powstał dowód,
 * a to pierwsza rzecz, o którą pyta się przy rozjeździe.
 *
 * ⚠️ **BRAK POLA `zrodlo` ZNACZY „NIE WIADOMO", A NIE „SONDA"** (`AUDYT‑64`).
 * Trzy miejsca w tym pliku podstawiały wcześniej sondę pod brak pola — `--pokaz`
 * drukowało `źródło: sonda` z wartości domyślnej, nie z pliku. Powód nie był
 * lenistwem narzędzia: **sonda tego pola w ogóle nie pisała**, więc każdy jej
 * zrzut, także przyszły, byłby zgadywany. Naprawa poszła od strony pisarza —
 * sonda zapisuje dziś `zrodlo: "sonda"` — a tutaj zostaje reguła repo
 * zastosowana do nas samych: wolno pokazać „nie wiadomo", nie wolno zgadnąć.
 */
export function pochodzenie(zrzut: Zrzut): string {
  if (zrzut.zrodlo === "dodatek") return "Zrzut z dodatku (tryb deweloperski, `src/zrzut.ts`)";
  if (zrzut.zrodlo === "sonda") return "Zrzut sondy `tools/walka-probe.js`";
  return "Zrzut o NIEUSTALONYM pochodzeniu (plik bez pola `zrodlo`, sprzed 2026‑08‑05)";
}

/**
 * Czy zrzut jest URWANY — bufor kolekcjonera dobił do sufitu i stanął.
 *
 * ⚠️ **NARZĘDZIE MILCZAŁO O TYM DO 2026‑08‑05** (`AUDYT‑86`). Pole
 * `przepelniony` istnieje po to, żeby urwany zrzut nie wyglądał jak kompletny —
 * okno ustawień mówi o nim graczowi, `czytajZrzut` przepuszcza je dalej, a od
 * `AUDYT‑72` ma nawet swój test. Tylko że OFFLINE, czyli w jedynym momencie,
 * w którym materiał wchodzi do repo, nie oglądał go nikt: ani `--pokaz`, ani
 * `--zachowaj`. Fixture z urwanym końcem walki wyglądałby jak walka, która
 * po prostu tak się skończyła.
 */
export function urwany(zrzut: Zrzut): string | null {
  if (zrzut.przepelniony !== true) return null;
  return (
    "zrzut jest URWANY — bufor zbierania dobił do sufitu i stanął, " +
    "więc końca walki w nim nie ma. Materiał nadal bywa użyteczny, " +
    "ale nie wolno z niego wnioskować o tym, jak walka się skończyła."
  );
}

/** Nazwa pliku fixture'a: data, świat, opis. Data z przodu, żeby katalog sortował się sam. */
export function nazwaFixtura(zrzut: Zrzut, nazwa: string): string {
  return `${zrzut.przy.slice(0, 10)}-${zrzut.swiat}-${nazwa}.json`;
}

/**
 * Zrzut jako tekst pliku do `tests/fixtures/` — SUROWY materiał, nie moduł.
 *
 * PO CO OSOBNO OD `modulZrzutu`. Moduł niesie wyłącznie komunikaty i skład;
 * przepada cały `ladunek` (`myteam`, `endBattle`, `poolTime`), migawki
 * `hp`/`mana`/`energy`/`ac` przed i po każdym wywołaniu oraz GRANICE WYWOŁAŃ.
 * Dwie z tych rzeczy są dziś potrzebne do sprawdzeń, których bez nich nie ma:
 *
 * - `hp.max` z migawki razem z procentem życia z protokołu daje **świadka spoza
 *   dekodera** — skumulowane obrażenia muszą trafić w podany procent (763 − 243
 *   = 520; 520/763 = 68,15 %). Zmierzone na jedynej prawdziwej walce:
 *   **7 porównań, 0 rozjazdów**; dekoder sumujący `raw` zamiast `applied`
 *   zapala 6 z 7. (Stały tu liczby `16 trafień` i przykład `763 − 225 = 538`
 *   z materiału, który do repo nie wszedł — `AUDYT‑58`, `AUDYT‑59`.)
 * - granice wywołań są jedyną drogą do walki TUROWEJ z `data.current`
 *   (otwarta pozycja `docs/ROADMAP.md`).
 *
 * ⚠️ **TO NIE JEST POWRÓT DO SKASOWANEGO `tests/fixtures/`.** Tamten katalog
 * zszedł 2026‑08‑04, bo trzymał `zdarzenia.json` — POLICZONE wyjście parsera,
 * którego już nie ma, więc nie do sprawdzenia przeciw czemukolwiek. Tu ląduje
 * to, co przysłał serwer gry, bez ani jednej naszej liczby. Drugi zarzut z
 * tamtej rundy — „plik danych da się dołożyć bez dotknięcia jednego testu,
 * leżał martwy" — zamyka `tests/fixtury.test.ts`, który odkrywa pliki SAM.
 *
 * WCIĘTY, nie zminifikowany: 28 kB zamiast 16 kB przy największym zrzucie, za to
 * diff przy podmianie materiału daje się przeczytać. Ten sam wybór, co przy
 * zamrożonej tabeli kluczy (`tools/slownik.ts --zamroz`).
 */
export function zachowajZrzut(zrzut: Zrzut): string {
  // ODCHUDZANIE ROBI NARZĘDZIE, NIE CZŁOWIEK. Ręczne wycinanie wpisów byłoby
  // edytowaniem materiału dowodowego, czego `AGENTS.md` zabrania; `odchudz`
  // robi to deterministycznie i nie gubi informacji (zostaje każde wywołanie
  // z komunikatami, każdy nowy kształt ładunku i każda nowa migawka).
  const chude = odchudz(zrzut.wpisy);
  return `${JSON.stringify(
    {
      ...zrzut,
      // Ile odpadło TU, przy zachowaniu — osobno od `pominietych`, które niesie
      // to, co odsiał kolekcjoner jeszcze w grze. Zsumowane w jedno pole nie
      // dałoby się już rozdzielić, a to dwa różne fakty o materiale.
      odchudzonych: zrzut.wpisy.length - chude.length,
      wpisy: chude,
    },
    null,
    2,
  )}\n`;
}

/**
 * Zrzut jako tekst modułu TS z materiałem.
 *
 * Nagłówek niesie POCHODZENIE (świat, build, data zrzutu i rozbicia) oraz linię
 * otwierającą, bo bez niej nie da się potem powiedzieć, czyja to walka.
 * `DO UZUPEŁNIENIA` zostaje dosłownie takie — patrz nagłówek pliku.
 *
 * Skład idzie z migawek `Engine.battle.warriors` przez `skladZeZrzutu`, a nie
 * z linii otwierającej: tamta niesie nazwę, poziom i profesję, ale NIE niesie
 * `id`, a bez `id` protokół nie ma jak stać się nazwą. Zrzut bez `myteam` pada
 * tutaj, zanim cokolwiek powstanie — moduł ze zgadniętymi stronami wyglądałby
 * jak materiał z gry i kłamałby o tym, kto z kim walczył.
 */
export function modulZrzutu(zrzut: Zrzut, dzis: string, nazwa: string): string {
  const sklad = skladZeZrzutu(zrzut);
  const wiadomosci = komunikaty(zrzut.wpisy);
  const wpis = (w: RosterEntry): string =>
    `  { id: ${w.id}, name: ${JSON.stringify(w.name)}, side: ${w.side}` +
    `${w.prof === undefined ? "" : `, prof: ${JSON.stringify(w.prof)}`}` +
    `${w.lvl === undefined ? "" : `, lvl: ${w.lvl}`} },`;

  const zdodatku = zrzut.zrodlo === "dodatek";
  const skad = pochodzenie(zrzut);

  return [
    "/**",
    ` * Walka z gry — \`${nazwa}\`.`,
    " *",
    ` * ${skad}: świat \`${zrzut.swiat}\`, build`,
    ` * \`${zrzut.build ?? "nieznany"}\`, zebrany ${zrzut.przy.slice(0, 10)}, rozbity ${dzis}`,
    ` * przez \`bun tools/walka.ts --rozbij … --nazwa ${nazwa}\`.`,
    " *",
    zrzut.otwarcie === null
      ? // Powód braku jest INNY po każdej ze stron, a zły powód w nagłówku
        // materiału dowodowego myli bardziej niż jego brak.
        zdodatku
        ? " * ⚠️ BEZ LINII OTWIERAJĄCEJ — dodatek podpiął się po rozpoczęciu walki."
        : " * ⚠️ BEZ LINII OTWIERAJĄCEJ — sonda była wklejona po rozpoczęciu walki."
      : ` * Linia otwierająca: ${JSON.stringify(zrzut.otwarcie)}`,
    " *",
    " * CO POKRYWA: DO UZUPEŁNIENIA — co siedzi w tej walce, po przejrzeniu.",
    " * CZEGO NIE MA: DO UZUPEŁNIENIA.",
    " * CO BYŁO TRUDNE: DO UZUPEŁNIENIA.",
    " *",
    " * **Materiału się nie edytuje, żeby test przeszedł.** Pochodzi z gry i nie",
    " * ma jak powstać ponownie inaczej niż nowym zrzutem. Wypełnić wolno wyłącznie",
    " * trzy pola wyżej.",
    " */",
    'import type { RosterEntry } from "../src/roster.ts";',
    "",
    "export const KOMUNIKATY: string[] = [",
    ...wiadomosci.map((k) => `  ${JSON.stringify(k)},`),
    "];",
    "",
    "/**",
    " * Skład tej walki z `Engine.battle.warriors`. Strona 0 to drużyna gracza",
    " * (`myteam` z ładunku), ujemne `id` to potwory.",
    " */",
    "export const SKLAD: RosterEntry[] = [",
    ...sklad.map(wpis),
    "];",
    "",
  ].join("\n");
}

function tekstowa(argumenty: string[], flaga: string): string | null {
  const gdzie = argumenty.indexOf(flaga);
  if (gdzie === -1) return null;
  const wartosc = argumenty[gdzie + 1];
  if (wartosc === undefined) throw new Error(`${flaga} wymaga wartości`);
  argumenty.splice(gdzie, 2);
  return wartosc;
}

/**
 * Jedna walka ze zrzutu, albo odmowa.
 *
 * ZRZUT Z KILKU WALK NIE ROZBIJA SIĘ SAM. Dodatek zbiera całą sesję, więc plik
 * potrafi nieść ich kilka; sklejenie dałoby materiał z pomieszanymi komunikatami
 * i scalonym składem. Milczące wzięcie pierwszej byłoby gorsze od błędu, bo
 * wyglądałoby na dowód.
 */
function jednaWalka(wczytany: Zrzut, wybrana: string | null, sciezka: string): Zrzut {
  const dostepne = walkiWZrzucie(wczytany);
  if (wybrana === null && dostepne.length > 1) {
    throw new Error(
      `zrzut niesie ${dostepne.length} walk (${dostepne.join(", ")}) — wskaż jedną: ` +
        `--walka <n>. Podgląd: bun tools/walka.ts --pokaz ${sciezka}`,
    );
  }
  return wybrana === null ? wczytany : wybierzWalke(wczytany, Number(wybrana));
}

/** CLI za bramką, żeby dało się ten plik zaimportować — jak w `tools/pomoc.ts`. */
if (import.meta.main) {
  const argumenty = process.argv.slice(2);
  const rozbij = tekstowa(argumenty, "--rozbij");
  const zachowaj = tekstowa(argumenty, "--zachowaj");
  const nazwa = tekstowa(argumenty, "--nazwa");
  const wybranaWalka = tekstowa(argumenty, "--walka");
  const pokaz = tekstowa(argumenty, "--pokaz");
  const klucze = argumenty.includes("--klucze");

  if (zachowaj !== null) {
    if (nazwa === null) throw new Error("wymagane --nazwa (krótki opis do nazwy pliku)");
    const zrzut = jednaWalka(czytajZrzut(await Bun.file(zachowaj).text()), wybranaWalka, zachowaj);

    // DRUGIE sito na sklejone walki, po polu `walka`. Tamto łapie zrzut,
    // w którym gra wymieniła obiekt `battle`; to łapie zrzut, w którym go NIE
    // wymieniła, a walka i tak się zmieniła. Bez niego pierwszy prawdziwy zrzut
    // z dodatku wszedł do repo jako jeden fixture z dwóch walk — i wyglądałby
    // na dowód. Odmowa, nie ciche przycięcie: gdzie przebiega granica, widać
    // w `--pokaz`, a wycięcie po swojemu byłoby edytowaniem materiału.
    const granice = graniceWalk(odchudz(zrzut.wpisy));
    if (granice.length > 1 || (granice.length === 1 && granice[0] !== odchudz(zrzut.wpisy)[0]?.nr)) {
      throw new Error(
        `zrzut niesie granicę walki (\`init\`) w wywołaniu ${granice.join(", ")}, ` +
          "a nie na samym początku — to więcej niż jedna walka w jednym pliku. " +
          `Podgląd: bun tools/walka.ts --pokaz ${zachowaj}. Powód i cytaty z klienta gry: ` +
          "docs/MECHANIKA.md, wpis „Granica walk”.",
      );
    }

    const plik = `${FIXTURY}${nazwaFixtura(zrzut, nazwa)}`;
    if (existsSync(plik)) {
      throw new Error(`${plik} już istnieje — materiału z gry się nie nadpisuje`);
    }
    // Skład liczymy PRZED zapisem po to, żeby zrzut bez `myteam` padł, zanim
    // powstanie plik. Fixture, po którym chodzą niezmienniki, a którego nie da
    // się rozebrać, zapala je wszystkie naraz i nic z tego nie wynika.
    const sklad = skladZeZrzutu(zrzut);
    const tresc = zachowajZrzut(zrzut);
    await Bun.write(plik, tresc);

    const wiadomosci = komunikaty(zrzut.wpisy);
    console.log(`zapisane: ${plik} (${tresc.length} B)`);
    // OSTRZEŻENIE, nie odmowa: urwany zrzut nadal niesie materiał, a wycięcie
    // go po swojemu byłoby edytowaniem dowodu. Ale człowiek ma to wiedzieć
    // ZANIM opisze fixture w `tests/fixtures/README.md` — bo „czego nie ma"
    // w takim pliku znaczy co innego.
    const ostrzezenieZapisu = urwany(zrzut);
    if (ostrzezenieZapisu !== null) console.warn(`  ⚠ ${ostrzezenieZapisu}`);
    console.log(
      `  wywołań: ${zrzut.wpisy.length} → ${odchudz(zrzut.wpisy).length}, ` +
        `komunikatów: ${wiadomosci.length}, kluczy: ${histogram(wiadomosci).length}, ` +
        `w składzie: ${sklad.length}`,
    );
    console.log("  niezmienniki z `tests/fixtury.test.ts` obejmą go bez dopisywania czegokolwiek");
    process.exit(0);
  }

  if (rozbij !== null) {
    if (nazwa === null) throw new Error("wymagane --nazwa (krótki opis do nazwy pliku)");
    const zrzut = jednaWalka(czytajZrzut(await Bun.file(rozbij).text()), wybranaWalka, rozbij);
    const dzis = new Date().toISOString().slice(0, 10);
    const plik = `${MATERIAL}walka-${nazwa}.ts`;
    if (existsSync(plik)) {
      throw new Error(`${plik} już istnieje — materiału z gry się nie nadpisuje`);
    }

    // Odchudzenie liczymy PRZED zapisem, żeby dało się powiedzieć w wyjściu, ile
    // z tego zrzutu było odpytywaniem po walce. Do modułu i tak idą wyłącznie
    // komunikaty, więc odchudzanie niczego tam nie zmienia — zmienia to, co
    // człowiek wie o zrzucie, który właśnie zebrał.
    const chude = odchudz(zrzut.wpisy);
    await Bun.write(plik, modulZrzutu(zrzut, dzis, nazwa));

    const wiadomosci = komunikaty(zrzut.wpisy);
    console.log(`zapisane: ${plik}`);
    if (chude.length < zrzut.wpisy.length) {
      console.log(
        `  zrzut niósł ${zrzut.wpisy.length} wywołań, treści było w ${chude.length} ` +
          "(reszta to dokładne powtórzenia kształtu ładunku i stanu wojowników)",
      );
    }
    console.log(
      `  komunikatów: ${wiadomosci.length}, kluczy: ${histogram(wiadomosci).length}, ` +
        `w składzie: ${skladZeZrzutu(zrzut).length}`,
    );
    if (zrzut.otwarcie === null) {
      // Ten sam rozdział powodów, co w nagłówku modułu (`modulZrzutu`) — i to
      // jest naprawa, nie ozdoba: pierwszy prawdziwy zrzut z dodatku wypisał
      // tutaj „sonda była wklejona", choć sondy w ogóle nie było w grze.
      // Ostrzeżenie mylące o pochodzeniu materiału jest gorsze niż jego brak.
      console.warn(
        (zrzut.zrodlo === "dodatek"
          ? "  ⚠ brak linii otwierającej — tryb deweloperski włączono po rozpoczęciu walki. "
          : zrzut.zrodlo === "sonda"
            ? "  ⚠ brak linii otwierającej — sonda była wklejona po rozpoczęciu walki. "
            : "  ⚠ brak linii otwierającej — zbieranie zaczęło się po rozpoczęciu walki. ") +
          "Materiał jest użyteczny, ale nie pozna z niego kontekstu nikt, kto go czyta.",
      );
    }
    console.log("  trzy pola nagłówka czekają na wypełnienie — narzędzie ich nie zmyśla");
    process.exit(0);
  }

  if (pokaz !== null) {
    const zrzut = czytajZrzut(await Bun.file(pokaz).text());
    console.log(`świat: ${zrzut.swiat}, build: ${zrzut.build ?? "—"}`);
    console.log(`źródło: ${pochodzenie(zrzut)}`);
    console.log(`otwarcie: ${zrzut.otwarcie ?? "—"}`);
    if (zrzut.pominietych !== undefined) {
      console.log(`odsiane w grze jako powtórzenia: ${zrzut.pominietych}`);
    }
    const ostrzezenie = urwany(zrzut);
    if (ostrzezenie !== null) console.warn(`⚠ ${ostrzezenie}`);

    const dostepne = walkiWZrzucie(zrzut);
    if (dostepne.length === 0) {
      console.log("");
      for (const komunikat of komunikaty(zrzut.wpisy)) console.log(komunikat);
      process.exit(0);
    }

    // Z numeracją pokazujemy walka po walce — bo to po tym podglądzie człowiek
    // wybiera `--walka <n>`, a płaska lista nie mówi, gdzie przebiega granica.
    for (const numer of dostepne) {
      const jedna = wybierzWalke(zrzut, numer);
      const linia = jedna.otwarcie === null ? "" : ` — ${jedna.otwarcie}`;
      console.log(`\n=== walka ${numer}${linia} ===`);
      for (const komunikat of komunikaty(jedna.wpisy)) console.log(komunikat);
    }
    process.exit(0);
  }

  if (klucze) {
    const pliki = argumenty.filter((a) => !a.startsWith("--"));
    if (pliki.length === 0) {
      console.error(
        "podaj co najmniej jeden plik zrzutu — zbierz walkę sondą " +
          "`tools/walka-probe.js` i wskaż pobrany JSON",
      );
      process.exit(1);
    }
    const wszystkie: string[] = [];
    for (const plik of pliki) {
      const zrzut = czytajZrzut(await Bun.file(plik).text());
      wszystkie.push(...komunikaty(zrzut.wpisy));
    }
    const licznik = histogram(wszystkie);
    console.log(`${pliki.length} walk, ${wszystkie.length} komunikatów, ${licznik.length} kluczy\n`);
    for (const [klucz, ile] of licznik) console.log(`${String(ile).padStart(6)}  ${klucz}`);
    process.exit(0);
  }

  console.error(
    [
      "użycie:",
      // `--zachowaj` STOI PIERWSZY, bo to on robi materiał wchodzący do repo,
      // a przez chwilę nie było go tu wcale (`AUDYT‑67`) — mimo że polecają go
      // `AGENTS.md` i `tests/fixtures/README.md`. Tekst użycia jest jedynym
      // spisem poleceń, który ktoś naprawdę czyta z terminala.
      "  bun tools/walka.ts --zachowaj <plik.json> --nazwa <slug> → tests/fixtures/<data>-<świat>-<slug>.json",
      "  bun tools/walka.ts --zachowaj <plik.json> --nazwa <slug> --walka <n>",
      "  bun tools/walka.ts --rozbij <plik.json> --nazwa <slug>   → tests/walka-<slug>.ts",
      "  bun tools/walka.ts --rozbij <plik.json> --nazwa <slug> --walka <n>",
      "  bun tools/walka.ts --pokaz <plik.json>",
      "  bun tools/walka.ts --klucze <plik.json> […]",
      "",
      "`--zachowaj` zapisuje SUROWY zrzut jako fixture — z migawkami `hp.max`,",
      "ładunkami i granicami wywołań. `--rozbij` robi z niego moduł TS",
      "z komunikatami i składem; modułu potrzebuje `build.ts`, fixture'a —",
      "niezmienniki w `tests/fixtury.test.ts`.",
      "",
      "zrzut robi albo dodatek (zębatka → tryb deweloperski → „Zrzut walki”),",
      "albo `tools/walka-probe.js` wklejony do konsoli gry. Zrzut z dodatku",
      "obejmuje całą sesję, więc przy kilku walkach wymaga `--walka <n>`;",
      "numery pokazuje `--pokaz`.",
    ].join("\n"),
  );
  process.exit(2);
}
