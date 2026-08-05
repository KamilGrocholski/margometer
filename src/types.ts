/**
 * ⚠️ **STAŁY TU DWA EKSPORTY I OBA BYŁY MARTWE OD 2026‑08‑04.**
 *
 * `ELEMENT_MARKER` (`"\u0001"`) — znacznik doklejany przez `extractText` do
 * liczby obrażeń, gdy DOM gry niósł żywioł w klasie CSS (`<b class="dmgc">`).
 * W tekście logu żywiołu nie było, widać go było wyłącznie po kolorze. Protokół
 * podaje żywioł KLUCZEM, więc nie ma już czego znaczyć.
 *
 * `FIGHT_START_TEXT` (`"Rozpoczęła się walka pomiędzy"`) — zdanie otwierające.
 * Docstring twierdził, że stała decyduje o TRZECH rzeczach: znalezieniu okna
 * walki w DOM, podziale na walki przy odczycie i podziale na nagrania. Dwie
 * pierwsze zeszły z drzewa, a nagrywarka składa dziś tytuł ze SKŁADU
 * (`recorder.tytul`), bo protokół tego zdania nie musi nieść — klient
 * syntetyzuje je sam, poza `data.m`.
 *
 * ⚠️ **Dlaczego kompilator ich nie złapał, choć `noUnusedLocals` jest włączone.**
 * Ta flaga widzi zmienne LOKALNE; eksport bez ani jednego importera jest dla
 * niej poprawnym API modułu. To jest granica narzędzia, którą warto znać:
 * skasowanie czytelnika nie unieważnia tego, co czytał, a brama przechodzi na
 * zielono. Jedyne, co to łapie, to `grep -rn NAZWA --include=*.ts`.
 */

/** Kod profesji tak, jak pojawia się w logu, np. `85b`. */
export type ProfessionCode = "w" | "p" | "t" | "h" | "m" | "b";

export const PROFESSIONS: Record<ProfessionCode, string> = {
  w: "wojownik",
  p: "paladyn",
  t: "tropiciel",
  h: "łowca",
  m: "mag",
  b: "tancerz ostrzy",
};

/**
 * Litera z klasy `dmgX` w DOM gry. Fizycznych obrażeń gra tak nie znakuje.
 *
 * UWAGA: to NIE jest taksonomia żywiołów, choć nazwa na to wskazuje. Gra wrzuca
 * w tę jedną klasę odpowiedzi na trzy różne pytania i wybiera JEDNĄ z nich na
 * liczbę — czym oberwałeś, czym uderzono i w ilu naraz:
 *
 * - **żywioł**: `f`, `l`, `c`
 * - **broń/slot**: brak litery (zwarcie), `d` (dystans), `o` (broń pomocnicza)
 * - **zasięg**: `g` (globalne, czyli we WSZYSTKICH)
 * - **osobne**: `a` (nieuchronne)
 *
 * Skutek praktyczny: przy `dmgg` i `dmgo` gra podaje zasięg albo slot ZAMIAST
 * żywiołu, więc żywiołu tych liczb po prostu nie znamy. Etykieta mówi wtedy to,
 * co log naprawdę powiedział, a nie to, o co pytaliśmy.
 *
 * STOI TU, W TYPACH, A NIE PRZY CZYTELNIKU — od 2026‑08‑04. Wtedy odczyty
 * walki były dwa i obie drogi mapowały TĘ SAMĄ literę: klasa `dmgX` w DOM to
 * dosłownie klucz protokołu bez znaku wiodącego (gałąź `default` renderera gry
 * robi `substr(1)` na kluczu i wkleja wynik jako nazwę klasy). Dwie kopie
 * tabeli rozjechałyby się po cichu — a rozjazd nazwy żywiołu to złe rozbicie
 * w panelu bez ani jednego ostrzeżenia. Odczyt został jeden, ale miejsce
 * zostaje: to jest wiedza o formacie gry, nie o naszym czytelniku.
 *
 * ⚠️ DWA WPISY NIE MAJĄ ODPOWIEDNIKA W KLUCZU PROTOKOŁU. `p` to klasa `dmg`
 * bez litery — w protokole klucz brzmi po prostu `+dmg` i kod nadaje mu
 * `rolaDomyslna`. `"3"` (`THIRD_STRIKE_CODE`) też jest kodem nadanym, bo
 * protokół ma na to osobny klucz `+thirdatt`, przy okazji będący procem.
 * Wprost z litery klucza wychodzi siedem: `f l c a d o g`.
 */
export const ELEMENTS: Record<string, string> = {
  f: "ogień",
  l: "błyskawica",
  c: "zimno",
  // Klasa `dmg` bez litery — obrażenia broni bez żywiołu. W pomiarze wyłącznie
  // od profesji walczących w zwarciu (wojownik, paladyn, tancerz ostrzy).
  p: "fizyczne",
  // `dmga` niosą linie własnych obrażeń umiejętności (Fuzja żywiołów,
  // Wycieńczająca strzała). Opisy obu mówią "obrażenia nieuchronne", stąd
  // nazwa — to wniosek z opisów, nie dosłowny zapis z logu.
  a: "nieuchronne",
  // `dmgd` wyłącznie od łowcy i tropiciela, `dmg` wyłącznie od trzech profesji
  // zwarcia — 686 zmierzonych liczb, zero przecięć. To oś BRONI, nie żywiołu.
  d: "dystansowe",
  // `dmgo` stoi zawsze jako druga liczba u tancerza ostrzy, a proc
  // "+Cios krytyczny broni pomocniczej" podbija wyłącznie ją (z procem 886-1007,
  // bez proca 611-699, zero zachodzenia). Jedyna nazwa w tej mapie zapisana
  // w logu DOSŁOWNIE, a nie wywnioskowana.
  o: "broń pomocnicza",
  // `dmgg` pada, gdy umiejętność bije we WSZYSTKICH naraz — samo "w kilku" nie
  // wystarcza: `Szarża zastępcy` (5 celów z 10), `Bicie rogu` (3) i `Osobisty
  // rozrachunek` (2) niosą zwykłe `dmg`, a `Śpiew zagłady` (10 z 10) `dmgg`.
  // Nazwa z terminologii gry; w dokumentacji mechaniki walk jej NIE MA, więc
  // opiera się na tym zestawieniu i na wiedzy o grze, nie na cytacie.
  g: "globalne",
  // Nie litera z klucza, tylko kod nadany przez nas (`THIRD_STRIKE_CODE`) —
  // gra oznacza to trafienie klasą `third`. Nazwa stoi w logu DOSŁOWNIE — modyfikator
  // "+Trzeci cios" towarzyszy każdemu takiemu trafieniu — więc jest cytatem,
  // a nie wnioskiem; drugi taki przypadek w tej mapie po `broń pomocnicza`.
  "3": "trzeci cios",
};

/**
 * Nazwa żywiołu dla kodu z klasy `dmgX` albo z klucza protokołu.
 *
 * **Nieznany kod zostaje surowy jako `dmgX`** i to jest reguła, nie zaniedbanie:
 * `aggregate` zbiera takie etykiety w `unknownElements` i panel je pokazuje,
 * więc nowa klasa po stronie gry zapala się jako pytanie zamiast zniknąć pod
 * „bez żywiołu". Funkcja istnieje po to, żeby ta reguła miała JEDNO miejsce —
 * dwa czytelniki tabeli to dwie okazje, żeby jeden z nich cicho podstawił null.
 */
export function nazwaZywiolu(kod: string): string {
  return ELEMENTS[kod] ?? `dmg${kod}`;
}

export type Participant = {
  name: string;
  level: number;
  /** Kod z logu. Nieznane litery zostawiamy surowe zamiast zgadywać. */
  professionCode: string;
  /**
   * Strona konfliktu z linii otwierającej: 0 przed słowem "a", 1 po nim.
   * Log pisany jest z perspektywy gracza, więc strona 0 to jego drużyna.
   */
  side: number;
};

/**
 * Pojedyncza liczba obrażeń w ramach jednego ataku. Linia "uderzył z siłą"
 * potrafi ich nieść kilka i log NIE mówi, czym one są: u tancerza ostrzy to
 * broń główna i pomocnicza, u tropiciela żywioły (zimno, błyskawica, ogień),
 * a nazw żywiołów w logu nie ma w ogóle.
 *
 * `raw` to liczba z linii "uderzył z siłą", `applied` z linii "otrzymał".
 * Różnica to redukcja po stronie celu — NIE sumuj obu, to ta sama akcja.
 */
export type Hit = {
  raw: number;
  applied: number;
  crit: boolean;
  /** "Cios bardzo krytyczny" — występuje razem ze zwykłym krytykiem. */
  superCrit: boolean;
  /**
   * Nie pierwsza liczba w linii. Że to akurat broń pomocnicza, wiadomo tylko
   * wtedy, gdy log dopisze "Cios krytyczny broni pomocniczej".
   */
  secondary: boolean;
  /**
   * Żywioł odczytany z klasy CSS w DOM gry ("ogień", "błyskawica", "zimno").
   * null dla obrażeń fizycznych i dla logu wklejonego jako sam tekst.
   */
  element: string | null;
  /**
   * Cel uniknął tego konkretnego trafienia. "Unik" bywa częściowy — przy
   * ataku dwiema broniami główna wchodzi za 0, a pomocnicza mimo to trafia.
   */
  dodged: boolean;
};

/**
 * ⚠️ **`*Id` TO TOŻSAMOŚĆ POSTACI, NIE OZDOBA.** Protokół niesie `id` po obu
 * stronach każdego zdarzenia i to jest jedyna droga, żeby rozdzielić dwie
 * postacie o tej samej nazwie CZYTAJĄC, zamiast wnioskując ze spadku życia.
 * Pola są opcjonalne, bo materiał budowany w kodzie (`tests/zdarzenia.ts`,
 * `tools/synthetic-log.ts`) ich nie ma — i ma dalej chodzić heurystyką.
 * Wypełnia je WYŁĄCZNIE `dekoduj`.
 *
 * ⚠️ Ta sama reguła — **pole, którego nikt nie ustawia, jest gorsze niż jego
 * brak** — zdjęła stąd 2026‑08‑05 całe zdarzenie `turn-lost` i licznik
 * `turnsLost`. Dekoder protokołu nigdy takiego zdarzenia nie emitował (klucze
 * ogłuszenia siedzą w tabeli `PROCE` i nie niosą skutku), więc panel pokazywał
 * „Tury utracone 0" jako POMIAR, którym to nie było. Powody:
 * `docs/specy/2026-08-05-tura-to-akcja.md`.
 */
export type BattleEvent =
  | { kind: "fight-start"; participants: Participant[] }
  | {
      kind: "attack";
      source: string;
      target: string;
      /** Tożsamość bijącego i celu z protokołu — patrz nagłówek nad `BattleEvent`. */
      sourceId?: number;
      targetId?: number;
      /**
       * `null`, gdy log nie podaje życia bijącego — tak jest przy własnych
       * obrażeniach umiejętności ("-507 obrażeń otrzymał(a) X"). Zaślepka `0`
       * była tu wcześniej czytana jako zgon, więc rzucający kończył walkę na
       * liście poległych.
       */
      sourceHpPct: number | null;
      targetHpPct: number;
      hits: Hit[];
      /** Log zgłosił "Unik". Które trafienia faktycznie przepadły — patrz `hits`. */
      dodged: boolean;
      /** Ile obrażeń cel zablokował ("Zablokowanie 47 obrażeń"). */
      blocked: number | null;
      /** Efekty bez własnych liczb obrażeń: "Klątwa", "Szybka strzała", ... */
      procs: string[];
      /**
       * Umiejętność zapowiedziana linią "X wykonuje Y." albo null dla zwykłego
       * ciosu. Jedna umiejętność potrafi objąć kilka ataków pod rząd.
       */
      ability: string | null;
      /**
       * Czy to cios z linii "uderzył z siłą". `false` dla własnych obrażeń
       * umiejętności ("-507 obrażeń otrzymał(a) X") — te lecą obok ciosu w tej
       * samej turze, więc liczone osobno zawyżałyby liczbę ciosów.
       */
      strike: boolean;
    }
  /** `ability` jest null, gdy log nie podaje źródła (linia "Przywrócono N..."). */
  | {
      kind: "heal";
      ability: string | null;
      target: string;
      targetId?: number;
      amount: number;
      /**
       * Czy leczonym jest ten sam, kto leczył — jedyne, co o sprawcy mówi
       * komunikat Z PUSTĄ DRUGĄ STRONĄ. `true` dla proc-ów i samoratunku
       * ("Dotyk anioła", "Ostatni ratunek"), gdzie efekt z definicji siada
       * na trafionym.
       *
       * Nie wystarczy tu `ability !== null`. "Uleczono X o N punktów życia."
       * TEŻ niesie nazwę umiejętności, ale rzucił ją ktoś inny — i tylko to
       * pole trzyma statystyki z dala od dopisania leczonemu cudzej roboty.
       *
       * ⚠️ Do 2026‑08‑05 stało tu „kto konkretnie leczył, nadal nie wychodzi
       * z logu". Dla `heal`/`afterheal` to nadal prawda; dla leczenia
       * KIEROWANEGO nie — patrz `healer` niżej.
       */
      self: boolean;
      /**
       * Kto leczył — wypełnione WYŁĄCZNIE tam, gdzie komunikat ma obie strony
       * (`heal_target`, `npc_heal`). `undefined` znaczy „nie wiadomo", i tak
       * ma zostać: `heal=99` przychodzi jako `482845=100.00;0;heal=99`, więc
       * leczącego nie zna ani log, ani sam klient gry.
       *
       * Nazwane `healer`, a nie `source`, bo „źródło" w leczeniu jest już
       * zajęte przez `ActorStats.healedBy` i znaczy CO (Regeneracja, aura),
       * a nie KTO. Dwa różne pytania nie mają dzielić nazwy.
       *
       * `self` zostaje osobno i nie jest tym samym: obsługuje proce, których
       * komunikat drugiej strony nie ma w ogóle.
       */
      healer?: string;
      healerId?: number;
      /** Życie leczącego, do rozdzielenia instancji o tej samej nazwie. */
      healerHpPct?: number | null;
      /**
       * Życie celu PO wyleczeniu — log podaje je przy większości linii leczenia.
       * `null` tylko tam, gdzie go faktycznie nie ma (leczenie potwora bez
       * procentu). Bez tego pola leczenie przy zdublowanych nazwach lgnęło do
       * "ostatnio aktywnej" instancji, choć dana stała w logu.
       */
      targetHpPct: number | null;
    }
  | {
      kind: "dot";
      target: string;
      targetId?: number;
      targetHpPct: number;
      amount: number;
      /** Przyimek z logu: "od trucizny" kontra "po zranieniu". */
      via: "od" | "po";
      dotType: string;
      /** "osłabione o 25%" → 25. */
      weakenedPct: number | null;
    }
  | { kind: "move"; actor: string; actorId?: number; hpPct: number; description: string }
  | {
      kind: "fight-end";
      outcome: "victory" | "defeat" | "draw";
      /** Kto wygrał/poległ. Pusta lista dla walki bez rozstrzygnięcia. */
      actors: string[];
      result: string;
    }
  /** Zapowiedź umiejętności; obrażenia niosą dopiero kolejne linie. */
  | { kind: "ability"; actor: string; actorId?: number; name: string }
  /** Komunikat tła bez wpływu na statystyki (aura, brak Punktów Honoru, ...). */
  | { kind: "info"; line: string }
  /**
   * Komunikat, którego dekoder nie rozumie. Nie połykamy go po cichu —
   * niezerowa liczba takich zdarzeń oznacza, że format protokołu się zmienił
   * i statystyki są niepełne.
   */
  | { kind: "unknown"; line: string; lineNo: number };

/**
 * Jeden wiersz rozbicia obrażeń, pokazywany po najechaniu na pasek.
 *
 * Log nie nazywa zwykłych ciosów żadną umiejętnością, więc po stronie zadanych
 * rozróżniamy je po broni; nazwane są tylko efekty (trucizna, proc-i).
 */
export type DamageSource = {
  label: string;
  amount: number;
  /**
   * Ciosy, nie liczby obrażeń. Jeden cios potrafi nieść kilka liczb — tancerz
   * bije dwiema broniami, mag zadaje zimno i błyskawicę naraz — a to nadal
   * jedno uderzenie z kilku źródeł. Rozjazd z `abilityUses` jest wtedy
   * prawdziwy tylko tam, gdzie umiejętność faktycznie uderza kilka razy
   * ("Podwójny strzał"), i sam z siebie spada do 1, gdy cel padnie po
   * pierwszym trafieniu.
   */
  hits: number;
};

/** Efekt bez własnych obrażeń — log podaje samą nazwę, np. "Klątwa". */
export type ProcCount = { label: string; count: number };

/**
 * Jeden napastnik w rozbiciu obrażeń przyjętych, wraz z tym, CZYM uderzał.
 *
 * Dwa poziomy zamiast jednej sklejonej etykiety „Napastnik · Umiejętność”:
 * pytanie „od kogo obrywam” zadaje się częściej niż „którą umiejętnością”,
 * a przy kilku przeciwnikach płaska lista mieszała oba porządki naraz.
 *
 * `label` to nazwa napastnika, a przy DoT bez sprawcy — nazwa samego efektu
 * („od trucizny”), bo log nie mówi, kto go nałożył.
 */
/**
 * Dwuszczeblowe rozbicie: postać po drugiej stronie ciosu, a pod nią czym padło.
 * Służy obu kierunkom — napastnikom (`takenFromBy`) i celom (`dealtToBy`) — bo
 * pytanie jest symetryczne, zmienia się tylko strona: „od kogo” kontra „na kim”.
 */
export type AttackerBreakdown = {
  label: string;
  amount: number;
  hits: number;
  /** Czym uderzano — malejąco po obrażeniach. */
  by: DamageSource[];
};

/** Rodzina typu obrażeń przypięta do etykiety rozbicia — patrz `ActorStats.typeByLabel`. */
export type LabelType = { label: string; type: string };

/**
 * Sprowadza etykietę typu obrażeń do RODZINY.
 *
 * Log nazywa tę samą rzecz dwojako, zależnie od tego, którędy przyszła: żywioł
 * odczytany z klasy CSS mówi „ogień", a tykający efekt „od ognia". W pomiarze
 * takich etykiet jest dwanaście, a rodzin siedem — i to rodzina jest jednostką,
 * w której warto o tym myśleć.
 *
 * Nierozpoznane zostaje bez rodziny: „bez żywiołu" (log wklejony jako sam
 * tekst) ma znaczyć „nie wiadomo", a nie udawać kolejnego typu. Tak samo każdy
 * typ, którego gra dopiero dorobi — zgadywanie byłoby gorsze niż brak koloru.
 *
 * Mieszka tu, a nie w palecie, bo to podział DZIEDZINY, nie decyzja o wyglądzie:
 * korzysta z niego i agregacja (dominujący typ umiejętności), i widok (barwa).
 */
/**
 * Pamięć wyników `typeFamily` i `typeDisplay`.
 *
 * Obie funkcje są czystymi odwzorowaniami na ZAMKNIĘTYM zbiorze etykiet
 * (dwanaście z logu plus nazwy umiejętności), a `aggregate` woła je ~3 000 razy
 * na przebieg — i przebiega przy KAŻDEJ linii logu, w wątku gry. Zmierzone na
 * walce z Hildur: 0,613 ms → 0,046 ms na jedno `aggregate`, czyli ponad
 * ćwierć jego kosztu, za dwie mapy.
 *
 * Bez limitu rozmiaru świadomie: kluczem są nazwy z logu jednej sesji, więc
 * zbiór rośnie do kilkudziesięciu pozycji i tam zostaje.
 */
const familyMemo = new Map<string, string | null>();
const displayMemo = new Map<string, string>();

export function typeFamily(label: string): string | null {
  const cached = familyMemo.get(label);
  if (cached !== undefined || familyMemo.has(label)) return cached ?? null;
  const family = classify(label);
  familyMemo.set(label, family);
  return family;
}

function classify(label: string): string | null {
  const text = label.toLowerCase();
  if (text.includes("ogni") || text.includes("ogień")) return "ogień";
  if (text.includes("błyskaw")) return "błyskawica";
  if (text.includes("zimn")) return "zimno";
  if (text.includes("truci")) return "trucizna";
  if (text.includes("ran")) return "rana";
  if (text.includes("nieuchron")) return "nieuchronne";
  // Cztery nazwy z osi BRONI, nie żywiołu: zwarcie, dystans, broń pomocnicza
  // i trzeci cios tancerza ostrzy. Dla patrzącego to jedna rodzina —
  // „obrażenia z broni".
  //
  // „Trzeci cios" dołączył tu razem z klasą `third` (pomiar 2026-08-03) i to
  // NIE jest zgadywanie żywiołu: log nazywa go wprost modyfikatorem „+Trzeci
  // cios" przy tym samym ciosie, w którym stoją trafienia główne i pomocnicze.
  // Rodziny nie dostaje tylko to, czego żywiołu naprawdę nie znamy — patrz
  // „globalne" niżej.
  if (
    text.includes("fizyczn") ||
    text.includes("dystans") ||
    text.includes("pomocnicz") ||
    text.includes("trzeci")
  ) {
    return "broń";
  }
  // „globalne" rodziny NIE dostaje świadomie: gra podaje przy tych liczbach
  // ZASIĘG zamiast żywiołu, więc żywioł jest nieznany, a nie inny. Zgadywanie
  // barwy byłoby tu wymyślaniem rodzaju obrażeń.
  return null;
}

/**
 * Typ obrażeń, gdy żywiołu nie znamy: log wklejony jako tekst albo klasa CSS,
 * której jeszcze nie rozpoznajemy (obrażenia fizyczne). Nie nazywamy tego
 * "fizyczne", bo dla maga w logu tekstowym byłoby to nieprawdą.
 *
 * Stoi tu, a nie w `stats.ts`, bo czyta go też `typeDisplay` — to jedna z nazw
 * DZIEDZINY, jak `typeFamily`, a nie szczegół agregacji.
 */
export const UNKNOWN_ELEMENT = "bez żywiołu";

/** Nazwa wiersza dla wszystkiego, czego rodzaju log nie podał. */
const UNKNOWN_TYPE = "Nieznany";

/**
 * Co dopisać w nawiasie przy `Nieznany`, gdy log powiedział COŚ, tyle że nie
 * o żywiole. `globalne` to ZASIĘG (umiejętność bije we wszystkich naraz) —
 * po polsku czyta się to jako "obszarowe", a nie jako rodzaj obrażeń.
 *
 * Etykiety spoza tej mapy (surowe `dmgX`) wchodzą do nawiasu dosłownie: to
 * jedyne, co o nich wiadomo, i to ona ma trafić do zgłoszenia.
 *
 * ⚠️ **Jeden wyjątek od zasady „w nawiasie to, co podał log": „Ubytek życia".**
 * Tam log nie podaje rodzaju ANI RAZU — nazwa jest nasza (patrz `DOT_LABELS`).
 * Zostaje mimo to, bo alternatywą jest goły
 * wiersz „Nieznany", w którym ubytek życia zlałby się w jedno z nierozpoznanymi
 * klasami `dmgX` — a to skasowałoby informację zamiast dodać uczciwości.
 * Sam wyraz „Nieznany" niesie tu resztę: rodziny nie zgadujemy.
 */
const UNKNOWN_DETAIL: Record<string, string> = {
  globalne: "obszarowe",
};

function capitalized(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Nazwa RODZINY tak, jak ma stać w wierszu przekroju „TYP OBRAŻEŃ".
 *
 * Sekcja wymienia rodziny, nie surowe etykiety — inaczej ta sama rzecz stoi
 * w niej dwa razy pod dwiema gramatykami („ogień" z klasy CSS i „od ognia"
 * z tykającego efektu), a suma rozsypuje się na wiersze, których nikt nie
 * potrafi ze sobą zestawić.
 *
 * Nierozpoznane NIE dostaje wymyślonej rodziny: mówi wprost „Nieznany", a
 * w nawiasie to, co log naprawdę podał. Zgadywanie byłoby tu gorsze niż
 * przyznanie się, że rodzaju nie znamy.
 */
export function typeDisplay(type: string): string {
  const cached = displayMemo.get(type);
  if (cached !== undefined) return cached;
  const family = typeFamily(type);
  const shown =
    family !== null
      ? capitalized(family)
      : type === UNKNOWN_ELEMENT
        ? UNKNOWN_TYPE
        : `${UNKNOWN_TYPE} (${UNKNOWN_DETAIL[type] ?? type})`;
  displayMemo.set(type, shown);
  return shown;
}

/**
 * Nazwy tykających efektów w mianowniku — te same rzeczowniki, które stoją
 * w logu, tylko wyjęte z przyimka.
 *
 * Log pisze o nich zdaniem („N obrażeń **od trucizny**"), a w panelu stoją
 * w kolumnie obok nazw umiejętności („Niszczycielski cios"). Fraza przyimkowa
 * w takiej kolumnie czyta się jak usterka, bo nią jest: to jedyne pozycje,
 * które łamią gramatykę całej listy.
 *
 * Mapa, a nie odmiana z reguł: pięć rodzajów w całym pomiarze, a złe odmienienie
 * szóstego byłoby gorsze niż zostawienie go w spokoju.
 */
const DOT_LABELS: Record<string, string> = {
  "od trucizny": "Trucizna",
  "od głębokiej rany": "Głęboka rana",
  "od ognia": "Ogień",
  "po zranieniu": "Zranienie",
  "od błyskawic": "Błyskawica",
  // Jedyna pozycja tej mapy, której odpowiednika NIE MA w logu: „Stracono
  // -92 punktów życia X" podaje kwotę i postać, ale nie nazywa źródła. Nazwa
  // jest więc nasza i celowo opisuje SKUTEK ("ubyło życia"), a nie zgadniętą
  // przyczynę — wpis w `docs/MECHANIKA.md`.
  "od ubytku życia": "Ubytek życia",
};

/**
 * Etykieta tykającego efektu. Rodzaj spoza mapy zostaje DOSŁOWNIE taki, jak
 * w logu — nowy format ma być widać, a nie zniknąć pod wygładzoną nazwą.
 */
export function dotLabel(via: string, dotType: string): string {
  const raw = `${via} ${dotType}`;
  return DOT_LABELS[raw] ?? raw;
}

export type ActorStats = {
  name: string;
  /**
   * Strona z linii otwierającej albo ze składu z gry. `null` znaczy „nie
   * wiadomo” i pada z DWÓCH powodów: postaci nie było w składzie, albo ta sama
   * nazwa stała po obu stronach i numer instancji nie mówi, która to.
   *
   * Do pytania „czy ta postać w ogóle jest w składzie" służy `inRoster` —
   * `side !== null` odpowiadało na nie tylko przypadkiem.
   */
  side: number | null;
  /**
   * Czy wiersz pochodzi ze SKŁADU, a nie z samej wzmianki w logu. Rozstrzyga,
   * czy postać bez ani jednej liczby ma dostać pusty wiersz: przy uczestniku
   * walki brak wiersza czytałby się jak „nie ma takiej postaci”.
   */
  inRoster: boolean;
  /**
   * Kod profesji z logu (`85b` → `b`), null dla postaci spoza składu. Litera,
   * nie nazwa: `PROFESSIONS` tłumaczy ją na tekst, a nierozpoznanej litery nie
   * zgadujemy — log potrafi dodać profesję, której jeszcze nie znamy.
   */
  professionCode: string | null;
  /** Poziom z linii otwierającej albo ze składu z gry; null dla postaci spoza składu. */
  level: number | null;
  damageDealt: number;
  damageTaken: number;
  /** Obrażenia pochłonięte przez cel (raw - applied). */
  damageAbsorbed: number;
  /**
   * Ile z `damageAbsorbed` zdjął BLOK — z linii "Zablokowanie 47 obrażeń".
   *
   * Liczba należy do CELU, bo to on zablokował, choć log podaje ją w bloku
   * ciosu napastnika. Jest PODZBIOREM `damageAbsorbed`, nie liczbą obok, i nie
   * jest to wniosek z pomiaru, tylko cytat z dokumentacji gry: blok redukuje
   * obrażenia "podczas przyjętego ataku o 30%", a robi to PRZED pancerzem,
   * absorpcją i odpornościami (`docs/MECHANIKA.md`, wpis o bloku). Zgadza się to
   * z pomiarem co do joty na 20 wystąpieniach. Dlatego panel pokazuje blok
   * w nawiasie przy pochłoniętych, a nie jako osobną pozycję do dodania.
   */
  damageBlocked: number;
  /**
   * Obrażenia trucizn i krwawień, które zdjęło OSŁABIENIE ("osłabione o 25%").
   *
   * Osobne pole, a nie doliczenie do `damageAbsorbed`, bo to jedyna z tych liczb
   * ODTWORZONA, a nie odczytana: log podaje kwotę już PO osłabieniu i procent
   * zaokrąglony do liczby całkowitej, więc pełna kwota wychodzi z dzielenia
   * `amount / (1 - p)`. Zmierzone — odtworzona baza trafia w tik
   * tego samego DoT-a bez osłabienia 16/16 razy z błędem ≤ 2 %. Wlane do
   * `damageAbsorbed` zamieniłoby liczbę dokładną w szacunek bez ostrzeżenia.
   */
  damageWeakened: number;
  healingDone: number;
  healingReceived: number;
  /**
   * Ciosy, które weszły (bez uników). Liczymy CIOSY, nie liczby obrażeń: jeden
   * cios maga niesie dwie liczby (zimno + błyskawica), a to nadal jeden cios.
   */
  hits: number;
  /**
   * Ataki zakończone unikiem celu — czyli takie, w których NIC nie weszło.
   *
   * Rozłączne z `hits`: każdy atak jest albo ciosem, albo unikiem, więc
   * `hits + misses` to liczba ataków i tyle właśnie wychodzi z dodawania.
   * Atak, w którym przepadła tylko część trafień, jest ciosem i stoi
   * w `partialMisses` — patrz niżej.
   */
  misses: number;
  /**
   * Ataki, w których cel uniknął CZĘŚCI trafień, a reszta weszła.
   *
   * Zdarza się przy jednym ciosie niosącym kilka liczb: tancerz ostrzy bije
   * dwiema broniami i główna potrafi przepaść, gdy pomocnicza trafia. W całym
   * pomiarze takie ataki są trzy i wszystkie są jego.
   *
   * Osobne pole, a nie doliczenie do `misses`, bo taki atak jest JEDNOCZEŚNIE
   * ciosem. Doliczony tam dawał `ciosy 12 · uniki 2` przy dwunastu atakach —
   * czytający dodawał je do siebie i wychodziło czternaście.
   */
  partialMisses: number;
  crits: number;
  /**
   * Trafienia oznaczone w logu jako "Cios bardzo krytyczny".
   *
   * PODZBIÓR `crits`, nie kategoria obok: w całym pomiarze każde z dziesięciu
   * takich trafień niesie jednocześnie zwykłego kryta. Stąd forma "kryt. 12
   * (w tym 2 bardzo)" — dodawanie obu liczb do siebie dałoby czternaście
   * krytów przy dwunastu, tak samo jak przy unikach częściowych.
   */
  superCrits: number;
  /**
   * Tury postaci. **Tura jest AKCJĄ** — tak definiuje ją gra (pomoc, „2. System
   * tur"): „numerowana (od 1 wzwyż) akcja […] przyznawana" jednej postaci naraz.
   * Akcją jest zwykły atak, zapowiedź umiejętności i krok do przodu; tyknięcie
   * DoT-a i leczenie bez zapowiedzi — nie.
   *
   * Kilka ciosów jednej zapowiedzianej umiejętności to JEDNA tura, bo turę
   * otworzyła zapowiedź. Kilka akcji tej samej postaci pod rząd to natomiast
   * tyle tur, ile akcji: kolejność wynika ze skumulowanego czasu ataku, więc
   * szybka postać rutynowo dostaje turę kilka razy z rzędu.
   *
   * ⚠️ **Liczba jest przybliżeniem od DWÓCH stron i żadnej z nich nie umiemy
   * dziś domknąć.** W dół: tura bez akcji (ogłuszenie, sen) nie zostawia
   * w protokole śladu, więc jej tu nie ma. W górę: dodatkowe ataki z
   * `add_attacks` („Podwójny strzał") policzą się jako osobne tury, choć pomoc
   * gry mówi wprost, że na liczbę tur nie wpływają — protokół ich nie znakuje.
   * Szczegóły i pomiary: `beginTurn` w `stats.ts` oraz `docs/MECHANIKA.md`.
   */
  turns: number;
  /** Najsilniejszy pojedynczy cios — suma jego liczb, nie największa z nich. */
  maxHit: number;
  /** Z czego złożyły się obrażenia zadane, malejąco. */
  dealtBy: DamageSource[];
  /**
   * To samo w dwóch szczeblach, lustro `takenFromBy`: komu postać zadała, a po
   * zejściu w konkretny cel — czym w niego uderzała. Płaski przekrój „czym
   * zadane w ogóle” zostaje w `dealtBy`; tu chodzi o rozbicie po celu.
   */
  dealtToBy: AttackerBreakdown[];
  /**
   * Od kogo/od czego przyszły obrażenia przyjęte, malejąco. Etykieta skleja
   * napastnika z ciosem („Wilk · Zwykły atak”) — płaski przekrój na potrzeby
   * sum i dymków. Do drążenia służy `takenFromBy`.
   */
  takenFrom: DamageSource[];
  /** To samo w dwóch szczeblach: najpierw napastnik, potem czym uderzał. */
  takenFromBy: AttackerBreakdown[];
  /**
   * Obrażenia od DoT-u, którego sprawcy log nie podał — ta część `damageTaken`,
   * której nie da się nikomu przypisać. Wliczona w `damageTaken`, więc NIE
   * dodawaj jej osobno; służy do przypisu „trucizna bez sprawcy” w widoku tej
   * jednej postaci.
   */
  unattributedDotTaken: number;
  /**
   * Co siedzi w `unattributedDotTaken` — te same nazwy, co w
   * `UnattributedDot.types`, tylko dla TEJ jednej postaci.
   *
   * Osobne pole, bo przypis w panelu zmienia zakres razem z widokiem (postać,
   * strona, cała walka), a rodzaje szły dotąd zawsze z całej walki. Przy dwóch
   * rodzajach na dwóch postaciach nawias potrafił być większy od liczby, którą
   * rzekomo rozbijał.
   */
  unattributedDotTypes: Array<{ label: string; amount: number }>;
  /**
   * Leczenie, które ta postać dostała, a którego log nikomu nie przypisuje —
   * lustro `unattributedDotTaken` po drugiej stronie bilansu. Wliczone
   * w `healingReceived`, więc NIE dodawaj go osobno; służy do przypisu w widoku
   * tej jednej postaci.
   */
  unattributedHealingReceived: number;
  /**
   * Te same obrażenia w drugim przekroju: wg typu (żywioł, trucizna, głęboka
   * rana...). Suma jest identyczna jak w `dealtBy` — to inny podział, nie
   * dodatkowe obrażenia.
   */
  dealtByType: DamageSource[];
  /** Jak `dealtByType`, ale dla obrażeń przyjętych. */
  takenByType: DamageSource[];
  /**
   * Skąd wzięło się leczenie, malejąco. Log nie podaje leczącego, więc gołe
   * "Przywrócono N punktów życia" idzie pod "Regeneracja".
   */
  healedBy: DamageSource[];
  /**
   * Efekty, które ta postać WYZWOLIŁA w swoich ciosach — czyli te, które ma
   * z ekwipunku. Malejąco po liczbie wystąpień.
   */
  procs: ProcCount[];
  /**
   * Ten sam worek widziany z drugiej strony: efekty, które ktoś wyzwolił NA
   * tej postaci. Osobne pole, bo to inne pytanie — "co ja nakładam" kontra
   * "co się na mnie sypie" — a jedna liczba nie odpowiada na oba.
   */
  procsReceived: ProcCount[];
  /**
   * Ile razy postać ODPALIŁA daną akcję, malejąco. To nie to samo, co `hits`
   * w `dealtBy`: "Podwójny strzał" to jedno użycie i dwa ciosy, a akcja
   * wyunikana w całości ma użycie i zero ciosów.
   *
   * Osobne pole, a nie kolejna kolumna w `DamageSource`, bo użycie ma sens
   * wyłącznie po stronie zadających. W rozbiciu obrażeń przyjętych ta sama
   * etykieta znaczy "czyjeś uderzenie we mnie", a jedno użycie umiejętności
   * potrafi trafić kilka celów — liczba użyć nie rozkłada się wtedy na cele.
   */
  abilityUses: ProcCount[];
  /**
   * Rodzina typu obrażeń dla etykiet rozbicia — po niej overlay dobiera barwę
   * paska („Lodowy pocisk" → zimno, „od trucizny" → trucizna).
   *
   * Osobne pole, a nie kolumna w `DamageSource`, z dwóch powodów: ta sama
   * etykieta pada w kilku rozbiciach naraz (płaskim, dwuszczeblowym, po typie),
   * a typ jest jej wspólną własnością — powtarzanie go w każdej pozycji
   * rozjeżdżałoby się przy sumowaniu sesji. Etykiety niosące kilka żywiołów
   * (Fuzja żywiołów: zimno + błyskawica + nieuchronne) dostają ten, który
   * DOMINUJE obrażeniami — pasek ma jeden kolor, więc musi wybrać.
   */
  typeByLabel: LabelType[];
};
