import { Archive } from "./archive.ts";
import { Overlay } from "./overlay.ts";
import { Recorder } from "./recorder.ts";
import { EngineRosterSource, type RosterSource } from "./roster.ts";
import { EMPTY_STATS, Session } from "./session.ts";
import { DomLogSource, findBattleLog, type LogSource } from "./source.ts";

/** Ile czekać na pojawienie się okna walki w DOM, zanim odpuścimy. */
const LOOKUP_INTERVAL_MS = 1000;
/**
 * Ile razy z rzędu wolno nie znaleźć gry, zanim uznamy, że to nie jest jej
 * strona.
 *
 * `@match` obejmuje całą domenę, więc dodatek startuje także na podstronach,
 * które grą nie są (pomoc, opisy światów). Bez tego licznika zostawałby tam
 * `setInterval` przeczesujący CAŁY dokument co sekundę do końca życia karty.
 */
const GIVE_UP_AFTER = 20;

export function start(
  source: LogSource,
  overlay: Overlay,
  session: Session = new Session(),
  roster?: RosterSource,
  recorder?: Recorder,
): () => void {
  return source.subscribe((text) => {
    // Nagrywanie idzie PIERWSZE i we własnej osłonie. Kolejność nie jest
    // kosmetyką: gdyby parser się wysypał, zabrałby ze sobą zapis — czyli
    // jedyny surowy log, którym dałoby się tę awarię odtworzyć. Nagranie ma
    // przeżyć licznik, nie odwrotnie.
    try {
      // Ten sam tekst, który dostaje parser — nagranie odtwarza WEJŚCIE
      // licznika, a nie jego wynik.
      recorder?.capture(text);
    } catch (error) {
      console.error("[MargoMeter] nagrywanie padło", error);
    }

    // Callback leci z mikrotaska, więc nieprzechwycony wyjątek wypada do
    // kontekstu STRONY GRY i powtarza się przy każdej mutacji DOM. Ta sama
    // zasada co przy archiwum niżej: dodatek ma paść cicho, nie zasypać konsoli
    // gry przy każdej linii logu.
    try {
      // Skład czytamy przy każdej zmianie logu, nie raz na starcie: gra
      // podmienia `battle` między walkami, a odczyt jest tani i defensywny.
      session.update(text, roster?.current());
      // Sumę sesji podajemy jako funkcję: policzy się dopiero, gdy ktoś jej
      // zażąda (dziś tylko przycisk kopiowania), a nie przy każdej linii logu.
      overlay.render(session.current(), () => session.total());
    } catch (error) {
      console.error("[MargoMeter] licznik padł na tej porcji logu", error);
    }
  });
}

/**
 * Czy to w ogóle strona gry.
 *
 * Sprawdzamy najpierw globalne `Engine` (tanie, jedno pole), a dopiero potem
 * okno walki w DOM (przeczesuje dokument). Kolejność ma znaczenie: na stronie
 * pomocy pierwszy warunek odpada od razu i drugi już nie rusza.
 */
function looksLikeGame(window: Record<string, any>, findLog: () => Element | null): boolean {
  try {
    if (window.Engine ?? window.getEngine) return true;
  } catch {
    // Dostęp do wnętrzności gry może rzucić przy zmianie kontekstu strony.
  }
  return findLog() !== null;
}

export type BootOptions = {
  /** Cykliczne sprawdzanie — wstrzykiwane, żeby dało się je przewinąć w teście. */
  schedule?: (step: () => void, everyMs: number) => number;
  cancel?: (handle: number) => void;
  /** Gdzie szukać okna walki. */
  findLog?: () => Element | null;
  /** Globalne obiekty gry; osobno od `document`, bo tylko stąd czytamy `Engine`. */
  window?: Record<string, any>;
  storage?: Storage;
};

/**
 * Punkt wejścia userscriptu: czeka, aż w DOM pojawi się log walki, i wtedy
 * podpina overlay. Log istnieje dopiero po wejściu w walkę, więc szukamy go
 * cyklicznie zamiast raz przy starcie.
 *
 * Zwraca funkcję zatrzymującą — userscript jej nie woła, ale bez niej nie dało
 * się sprawdzić, że pętla faktycznie gaśnie poza grą.
 */
export function boot(options: BootOptions = {}): () => void {
  const schedule = options.schedule ?? ((step, everyMs) => setInterval(step, everyMs) as never);
  const cancel = options.cancel ?? ((handle: number) => clearInterval(handle));
  const findLog = options.findLog ?? findBattleLog;
  const globals = options.window ?? (globalThis as any);
  const storage = options.storage ?? safeStorage();

  let overlay: Overlay | null = null;
  let recorder: Recorder | null = null;
  // Sesja żyje dłużej niż subskrypcja: gra potrafi podmienić kontener logu
  // między walkami, a wtedy suma z całej sesji nie może się wyzerować.
  const session = new Session();
  const roster = new EngineRosterSource(globals);
  let unsubscribe: (() => void) | null = null;
  let container: Element | null = null;
  let missing = 0;
  let handle: number | null = null;

  const stop = () => {
    if (handle !== null) cancel(handle);
    handle = null;
    unsubscribe?.();
    unsubscribe = null;
  };

  handle = schedule(() => {
    if (!looksLikeGame(globals, findLog)) {
      missing += 1;
      // Nie na stronie gry — gasimy pętlę zamiast przeczesywać cudzy dokument
      // w kółko. Panel się tu nie pojawił, więc nie ma czego sprzątać.
      if (missing >= GIVE_UP_AFTER) stop();
      return;
    }
    missing = 0;

    if (!overlay) {
      recorder = new Recorder({ storage });
      overlay = new Overlay({ storage, recorder });
      // Panel rysujemy PRZED czymkolwiek dodatkowym. Licznik jest produktem,
      // archiwum dodatkiem — i to dodatek ma paść pierwszy, jeśli coś pójdzie źle.
      overlay.render(EMPTY_STATS, EMPTY_STATS);
      try {
        // Archiwum rysuje się w shadow roocie overlaya, więc powstaje po nim, a nie
        // w jego opcjach.
        overlay.attachArchive(new Archive({ recorder, overlay, storage }));
      } catch (error) {
        // Rozsypane archiwum nie może zabrać ze sobą licznika obrażeń.
        console.error("[MargoMeter] archiwum nie wystartowało", error);
      }
    }

    const found = findLog();
    if (!found || found === container) return;

    unsubscribe?.();
    container = found;
    unsubscribe = start(new DomLogSource(found), overlay, session, roster, recorder ?? undefined);
  }, LOOKUP_INTERVAL_MS);

  return stop;
}

function safeStorage(): Storage | undefined {
  try {
    // Dostęp do localStorage potrafi rzucić przy zablokowanych ciasteczkach.
    localStorage.getItem("margometer.probe");
    return localStorage;
  } catch {
    return undefined;
  }
}
