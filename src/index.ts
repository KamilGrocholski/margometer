import { Archive } from "./archive.ts";
import { Overlay } from "./overlay.ts";
import { Recorder } from "./recorder.ts";
import { EngineProtocolSource, type EventSource } from "./protokol-source.ts";
import { EngineRosterSource, type GameGlobals, type RosterSource } from "./roster.ts";
import { pustyOdczyt, rozjazdy, walkaZakonczona } from "./rozjazd.ts";
import { Session } from "./session.ts";
import { EMPTY_STATS, type BattleStats } from "./stats.ts";
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

/**
 * Z której drogi panel bierze liczby.
 *
 * **Protokół, gdy cokolwiek POLICZYŁ; tekst w przeciwnym razie.**
 *
 * ⚠️ Warunkiem jest TREŚĆ, nie liczba wierszy — i ta różnica kosztowała jedno
 * złe wskazanie w grze (2026‑08‑04). Wiersze biorą się ze składu podanego
 * z gry, więc sesja protokołu, która nie zobaczyła ani jednego ciosu, ma
 * komplet postaci i same zera. Warunek „są wiersze" wybierał wtedy zera zamiast
 * poprawnego odczytu z tekstu.
 *
 * DLACZEGO PROTOKÓŁ WYGRYWA. Niesie `id` po obu stronach każdego zdarzenia,
 * żywioł jako klucz zamiast klasy CSS, rozbite składniki redukcji i brzmienia
 * prosto z gry. Tekst jest rekonstrukcją tego wszystkiego ze zdań.
 *
 * DLACZEGO TEKST ZOSTAJE. Nagrania to surowy tekst (`recorder.ts:1‑16`),
 * wklejony log nie ma innej drogi, archiwum odtwarza przez `parse` — i żadna
 * z tych ścieżek nie ma `Engine.battle`.
 *
 * ⚠️ **TRYB AWARII, KTÓREGO TO NIE ZAMYKA.** Gdyby owinięcie `update` padło
 * w POŁOWIE walki, sesja protokołu zamarza z niepustym składem i panel
 * pokazywałby liczby sprzed awarii, podczas gdy tekst leci dalej. Łapie to
 * czujka na koniec walki — ostrzeżeniem, nie ciszą — ale dopiero wtedy.
 */
export function zrodloPanelu(zTekstu: BattleStats, zProtokolu: BattleStats): BattleStats {
  return pustyOdczyt(zProtokolu) ? zTekstu : zProtokolu;
}

export function start(
  source: LogSource,
  overlay: Overlay,
  session: Session = new Session(),
  roster?: RosterSource,
  recorder?: Recorder,
  sesjaProtokolu?: Session,
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
      overlay.render(
        sesjaProtokolu === undefined
          ? session.current()
          : zrodloPanelu(session.current(), sesjaProtokolu.current()),
      );
    } catch (error) {
      console.error("[MargoMeter] licznik padł na tej porcji logu", error);
    }
  });
}

/**
 * Drugi odczyt tej samej walki — z protokołu silnika — i porównanie go
 * z pierwszym.
 *
 * NIE KARMI PANELU LICZBAMI. Panel dalej liczy z tekstu; stąd idzie wyłącznie
 * odpowiedź na pytanie „czy obie drogi zgadzają się co do skalarów". Powód
 * stoi w `docs/specy/2026-08-04-protokol-jako-drugie-zrodlo-zdarzen.md`:
 * bez walki zapisanej obiema drogami nie da się odróżnić „nowe liczby są
 * lepsze" od „nowe liczby są inne", więc protokół dostaje głos, nie władzę.
 *
 * Cała ścieżka jest w try/catch, bo to najmłodszy kod w repo i ma prawo się
 * mylić — ale nie ma prawa zabrać ze sobą licznika, który działa.
 */
export function startKontrola(
  source: EventSource,
  zTekstu: Session,
  overlay: Overlay,
  sesjaProtokolu: Session = new Session(),
): () => void {
  return source.subscribe((porcja) => {
    try {
      sesjaProtokolu.updateEvents(porcja.zdarzenia, [...porcja.sklad]);
      const zProtokolu = sesjaProtokolu.current();

      // OSTRZEŻENIE GAŚNIE RAZEM Z WALKĄ. Bez tego napis z walki, w której
      // protokół się nie podpiął, wisiał nad następną — i to jest dokładnie
      // to, co zobaczył pierwszy gracz: poprawne liczby w panelu i ostrzeżenie
      // o rozjeździe z poprzedniej walki.
      if (!walkaZakonczona(porcja.zdarzenia)) overlay.setRozjazdy([]);
      else if (pustyOdczyt(zProtokolu)) {
        // INNA USTERKA, INNY KOMUNIKAT. Pusty odczyt nie znaczy „liczby się
        // różnią" — znaczy „nie zdążyliśmy się podpiąć do tej walki".
        // Nazwanie tego rozjazdem opisywałoby objaw jako przyczynę.
        overlay.setRozjazdy([]);
        overlay.setSpoznionePodpiecie(true);
      } else {
        overlay.setSpoznionePodpiecie(false);
        overlay.setRozjazdy(rozjazdy(zTekstu.current(), zProtokolu));
      }
      overlay.render(zrodloPanelu(zTekstu.current(), zProtokolu));
    } catch (error) {
      console.error("[MargoMeter] czujka protokołu padła", error);
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
function looksLikeGame(window: GameGlobals, findLog: () => Element | null): boolean {
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
  window?: GameGlobals;
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
  const globals = options.window ?? (globalThis as GameGlobals);
  const storage = options.storage ?? safeStorage();

  let overlay: Overlay | null = null;
  let recorder: Recorder | null = null;
  // Sesja żyje dłużej niż subskrypcja, bo gra potrafi podmienić kontener logu
  // w trakcie walki — wtedy przepinamy obserwatora, a liczby bieżącej walki
  // mają zostać na ekranie.
  const session = new Session();
  // Jedna sesja protokołu na cały `boot`, wspólna dla obu spięć: karmi ją
  // czujka, a czyta z niej panel. Dwie osobne rozjechałyby się o porcję.
  const sesjaProtokolu = new Session();
  const roster = new EngineRosterSource(globals);
  let unsubscribe: (() => void) | null = null;
  // Czujka podpina się RAZ, do globali, a nie do kontenera logu: `Engine.battle`
  // żyje niezależnie od tego, który węzeł DOM akurat niesie okno walki.
  let odepnijKontrole: (() => void) | null = null;
  let container: Element | null = null;
  let missing = 0;
  let handle: number | null = null;

  const stop = () => {
    if (handle !== null) cancel(handle);
    handle = null;
    unsubscribe?.();
    unsubscribe = null;
    odepnijKontrole?.();
    odepnijKontrole = null;
    // Panel MÓGŁ już powstać: `missing` zeruje się przy każdym udanym odczycie,
    // więc strona potrafi przestać wyglądać na grę długo po jego narysowaniu.
    // Komentarz niżej („panel się tu nie pojawił") zakładał inaczej.
    overlay?.destroy();
    overlay = null;
  };

  handle = schedule(() => {
    if (!looksLikeGame(globals, findLog)) {
      missing += 1;
      // Nie na stronie gry — gasimy pętlę zamiast przeczesywać cudzy dokument
      // w kółko. `stop()` zdejmuje przy okazji panel, jeśli zdążył powstać.
      if (missing >= GIVE_UP_AFTER) stop();
      return;
    }
    missing = 0;

    if (!overlay) {
      recorder = new Recorder({ storage });
      overlay = new Overlay({ storage, recorder });
      // Panel rysujemy PRZED czymkolwiek dodatkowym. Licznik jest produktem,
      // archiwum dodatkiem — i to dodatek ma paść pierwszy, jeśli coś pójdzie źle.
      overlay.render(EMPTY_STATS);
      try {
        // Archiwum rysuje się w shadow roocie overlaya, więc powstaje po nim, a nie
        // w jego opcjach.
        overlay.attachArchive(new Archive({ recorder, overlay, storage }));
      } catch (error) {
        // Rozsypane archiwum nie może zabrać ze sobą licznika obrażeń.
        console.error("[MargoMeter] archiwum nie wystartowało", error);
      }
    }

    if (overlay && odepnijKontrole === null) {
      try {
        odepnijKontrole = startKontrola(
          new EngineProtocolSource(globals, roster),
          session,
          overlay,
          sesjaProtokolu,
        );
      } catch (error) {
        // Czujka jest dodatkiem do dodatku. Gdy nie wstanie, licznik ma działać
        // dalej — ta sama zasada, co przy archiwum wyżej.
        console.error("[MargoMeter] czujka protokołu nie wystartowała", error);
      }
    }

    const found = findLog();
    if (!found || found === container) return;

    unsubscribe?.();
    container = found;
    unsubscribe = start(
      new DomLogSource(found),
      overlay,
      session,
      roster,
      recorder ?? undefined,
      sesjaProtokolu,
    );
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
