import { Archive } from "./archive.ts";
import { Overlay } from "./overlay.ts";
import { Recorder } from "./recorder.ts";
import { EngineRosterSource, type RosterSource } from "./roster.ts";
import { EMPTY_STATS, Session } from "./session.ts";
import { DomLogSource, findBattleLog, type LogSource } from "./source.ts";

/** Ile czekać na pojawienie się okna walki w DOM, zanim odpuścimy. */
const LOOKUP_INTERVAL_MS = 1000;

export function start(
  source: LogSource,
  overlay: Overlay,
  session: Session = new Session(),
  roster?: RosterSource,
  recorder?: Recorder,
): () => void {
  return source.subscribe((text) => {
    // Skład czytamy przy każdej zmianie logu, nie raz na starcie: gra podmienia
    // `battle` między walkami, a odczyt jest tani i defensywny.
    session.update(text, roster?.current());
    // Nagrywamy ten sam tekst, który dostał parser — nagranie ma odtwarzać
    // wejście licznika, a nie jego wynik.
    recorder?.capture(text);
    overlay.render(session.current(), session.total());
  });
}

/**
 * Punkt wejścia userscriptu: czeka, aż w DOM pojawi się log walki, i wtedy
 * podpina overlay. Log istnieje dopiero po wejściu w walkę, więc szukamy go
 * cyklicznie zamiast raz przy starcie.
 */
export function boot(): void {
  const storage = safeStorage();
  const recorder = new Recorder({ storage });
  const overlay = new Overlay({ storage, recorder });
  // Archiwum rysuje się w shadow roocie overlaya, więc powstaje po nim, a nie
  // w jego opcjach.
  overlay.attachArchive(new Archive({ recorder, overlay, storage }));
  // Sesja żyje dłużej niż subskrypcja: gra potrafi podmienić kontener logu
  // między walkami, a wtedy suma z całej sesji nie może się wyzerować.
  const session = new Session();
  const roster = new EngineRosterSource();
  let unsubscribe: (() => void) | null = null;
  let container: Element | null = null;

  overlay.render(EMPTY_STATS, EMPTY_STATS);

  setInterval(() => {
    const found = findBattleLog();
    if (!found || found === container) return;

    unsubscribe?.();
    container = found;
    unsubscribe = start(new DomLogSource(found), overlay, session, roster, recorder);
  }, LOOKUP_INTERVAL_MS);
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
