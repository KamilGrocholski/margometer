import { Archive } from "./archive.ts";
import { Overlay } from "./overlay.ts";
import { Recorder } from "./recorder.ts";
import { EngineProtocolSource, type EventSource } from "./protokol-source.ts";
import { EngineRosterSource, type GameGlobals } from "./roster.ts";
import { pustyOdczyt, walkaZakonczona } from "./rozjazd.ts";
import { Session } from "./session.ts";
import { EMPTY_STATS } from "./stats.ts";

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
 * Spina protokół silnika z panelem, archiwum i nagrywarką.
 *
 * ⚠️ **NAZYWAŁO SIĘ TO `startKontrola` i było CZUJKĄ** — drugim odczytem walki,
 * który tylko porównywał się z pierwszym (tekstowym) i nie miał prawa karmić
 * panelu liczbami. Powód tamtej ostrożności: bez walki zapisanej obiema drogami
 * nie dało się odróżnić „nowe liczby są lepsze" od „nowe liczby są inne".
 * Walka zapisana obiema drogami przyszła 2026‑08‑04 i rozstrzygnęła to na
 * korzyść protokołu, więc czujka przestała być czujką, a odczyt tekstowy zszedł
 * z drzewa. Została jedna droga i to ona rysuje panel.
 *
 * Wszystko jest tu w try/catch nie z ostrożności wobec własnego kodu, tylko
 * dlatego, że **ten callback leci ze środka `Engine.battle.update`**: wyjątek,
 * który stąd wyjdzie, przewraca graczowi TURĘ, a nie panel.
 */
export function start(
  source: EventSource,
  overlay: Overlay,
  sesja: Session = new Session(),
  recorder?: Recorder,
): () => void {
  return source.subscribe((porcja) => {
    // Nagrywanie idzie PIERWSZE i we własnej osłonie. Kolejność nie jest
    // kosmetyką: gdyby dekoder się wysypał, zabrałby ze sobą zapis — czyli
    // jedyny surowy materiał, którym dałoby się tę awarię odtworzyć. Nagranie
    // ma przeżyć licznik, nie odwrotnie.
    try {
      // Te same komunikaty, które dostaje dekoder — nagranie odtwarza WEJŚCIE
      // licznika, a nie jego wynik.
      recorder?.capture(porcja);
    } catch (error) {
      console.error("[MargoMeter] nagrywanie padło", error);
    }

    try {
      sesja.updateEvents(porcja.zdarzenia, [...porcja.sklad]);
      const odczyt = sesja.current();

      // OSTRZEŻENIE GAŚNIE RAZEM Z WALKĄ. Bez tego napis z walki, do której
      // nie zdążyliśmy się podpiąć, wisiał nad następną — i to jest dokładnie
      // to, co zobaczył pierwszy gracz.
      //
      // Wyrokujemy dopiero na KOŃCU walki, bo w trakcie „zero liczb" znaczy
      // po prostu „jeszcze nikt nie uderzył".
      overlay.setSpoznionePodpiecie(walkaZakonczona(porcja.zdarzenia) && pustyOdczyt(odczyt));
      overlay.render(odczyt);
    } catch (error) {
      console.error("[MargoMeter] licznik padł na tej porcji", error);
    }
  });
}

/**
 * Czy to w ogóle strona gry.
 *
 * Pytamy WYŁĄCZNIE o globalne `Engine`. Do 2026‑08‑04 był tu jeszcze drugi
 * warunek — okno walki w DOM — bo stamtąd brał się log. Dziś czytamy
 * `Engine.battle`, więc strona z oknem walki, ale bez `Engine`, nie dałaby nam
 * NICZEGO do przeczytania: drugi warunek obiecywałby grę tam, gdzie dodatek
 * i tak stanąłby pusty. Przy okazji znika przeczesywanie całego dokumentu co
 * sekundę na podstronach, które grą nie są.
 */
function looksLikeGame(window: GameGlobals): boolean {
  try {
    return Boolean(window.Engine ?? window.getEngine);
  } catch {
    // Dostęp do wnętrzności gry może rzucić przy zmianie kontekstu strony.
    return false;
  }
}

export type BootOptions = {
  /** Cykliczne sprawdzanie — wstrzykiwane, żeby dało się je przewinąć w teście. */
  schedule?: (step: () => void, everyMs: number) => number;
  cancel?: (handle: number) => void;
  /** Globalne obiekty gry; osobno od `document`, bo tylko stąd czytamy `Engine`. */
  window?: GameGlobals;
  storage?: Storage;
};

/**
 * Punkt wejścia userscriptu: czeka, aż na stronie pojawi się `Engine`, i wtedy
 * podpina panel. Cyklicznie, a nie raz na starcie, bo skrypt wstaje razem
 * z dokumentem, a silnik gry chwilę później.
 *
 * ⚠️ **PĘTLA UPROŚCIŁA SIĘ 2026‑08‑04 i to jest cała jej treść.** Wcześniej
 * musiała jeszcze pilnować, KTÓRY węzeł DOM niesie okno walki: gra potrafi
 * podmienić kontener w trakcie walki, więc trzeba było przepinać obserwatora
 * i trzymać sesję poza subskrypcją, żeby liczby zostały na ekranie. Protokół
 * nie ma kontenera — `Engine.battle` żyje niezależnie od DOM — więc podpinamy
 * się RAZ i to wszystko.
 *
 * Zwraca funkcję zatrzymującą — userscript jej nie woła, ale bez niej nie dało
 * się sprawdzić, że pętla faktycznie gaśnie poza grą.
 */
export function boot(options: BootOptions = {}): () => void {
  const schedule = options.schedule ?? ((step, everyMs) => setInterval(step, everyMs) as never);
  const cancel = options.cancel ?? ((handle: number) => clearInterval(handle));
  const globals = options.window ?? (globalThis as GameGlobals);
  const storage = options.storage ?? safeStorage();

  let overlay: Overlay | null = null;
  let recorder: Recorder | null = null;
  const sesja = new Session();
  const roster = new EngineRosterSource(globals);
  let odepnij: (() => void) | null = null;
  let missing = 0;
  let handle: number | null = null;

  const stop = () => {
    if (handle !== null) cancel(handle);
    handle = null;
    odepnij?.();
    odepnij = null;
    // Panel MÓGŁ już powstać: `missing` zeruje się przy każdym udanym odczycie,
    // więc strona potrafi przestać wyglądać na grę długo po jego narysowaniu.
    overlay?.destroy();
    overlay = null;
  };

  handle = schedule(() => {
    if (!looksLikeGame(globals)) {
      missing += 1;
      // Nie na stronie gry — gasimy pętlę zamiast tykać w kółko do końca życia
      // karty. `stop()` zdejmuje przy okazji panel, jeśli zdążył powstać.
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

    if (odepnij === null) {
      try {
        odepnij = start(
          new EngineProtocolSource(globals, roster),
          overlay,
          sesja,
          recorder ?? undefined,
        );
      } catch (error) {
        // Panel stoi już na ekranie i ma na nim zostać, choćby pusty —
        // ta sama zasada, co przy archiwum wyżej.
        console.error("[MargoMeter] odczyt protokołu nie wystartował", error);
      }
    }
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
