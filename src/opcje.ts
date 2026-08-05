import { Confirm } from "./confirm.ts";
import { plural } from "./overlay.ts";
import { storedBoolean, storedNumber, storedRecord } from "./stored-state.ts";
import { clampToViewport, makeDraggable, realTicker, type Ticker } from "./window.ts";
import { zapiszPlik, type StanZrzutu, type ZapisPliku, type Zrzut } from "./zrzut.ts";

/**
 * Okno ustawień dodatku — dziś z jedną pozycją, i to jest świadome.
 *
 * DLACZEGO OSOBNY MODUŁ, A NIE PASEK W PANELU. `overlay.ts` ma ponad trzy
 * tysiące linii i `SOLID R7` planuje go ciąć, a nie dokładać do niego ósmy
 * widok. Drugi powód jest za to funkcjonalny: paski panelu (`renderRecordBar`)
 * znikają przy zwinięciu, bo opisują STAN WALKI. Ustawienia stanem walki nie
 * są — opcja schowana przy zwiniętym panelu byłaby usterką, nie oszczędnością
 * miejsca.
 *
 * ⚠️ **WSZYSTKIE KLASY MAJĄ PREFIKS `.opcje-` I TO NIE JEST KOSMETYKA.** Shadow
 * root jest JEDEN i dzielimy go z panelem oraz archiwum: `style.ts` zapisało już
 * raz, że kolizja `.row` była objawem wspólnego zasięgu. Do tego testy panelu
 * czytają `shadow.querySelectorAll(".row")` i `shadow.querySelector("header")`
 * bez żadnego zawężenia — wiersz nazwany `.row` albo okno wstawione PRZED
 * panelem wsypałoby je po cichu. Dlatego okno idzie zawsze przez `append`.
 */

/** Tyle, ile okno potrzebuje od panelu. Wzór `PreviewHost` w `archive.ts`. */
export type OpcjeHost = {
  shadow: ShadowRoot;
  refresh(): void;
};

/**
 * Tyle, ile okno potrzebuje od kolekcjonera.
 *
 * Wąsko z tego samego powodu, co `ArchiveRecorder`: okno ma pokazywać
 * i przełączać, a nie mieć dostęp do bufora. Atrapa w teście to cztery metody.
 */
export type ZrodloZrzutu = {
  wlaczony(): boolean;
  wlacz(czy: boolean): void;
  stan(): StanZrzutu;
  zrzut(): Zrzut;
  nazwaPliku(): string;
  wyczysc(): void;
};

export type OpcjeOptions = {
  overlay: OpcjeHost;
  zrzut: ZrodloZrzutu;
  storage?: Pick<Storage, "getItem" | "setItem"> | undefined;
  /**
   * Zapis pliku — wstrzykiwany z tego samego powodu co `clipboard`
   * w `OverlayOptions`: bez tego o kliknięciu w „Zrzut walki" dałoby się
   * powiedzieć tylko tyle, że nie rzuciło. Test ma pytać, CO zapisano.
   */
  saveFile?: ZapisPliku;
  now?: () => number;
  ticker?: Ticker;
};

type OpcjeState = { x: number; y: number; open: boolean };

const STORAGE_KEY = "margometer.opcje";
/** Musi się zgadzać z `width` w arkuszu — przycinanie pozycji liczy się z niej. */
const OPCJE_WIDTH = 300;
const DEFAULT_STATE: OpcjeState = { x: 340, y: 60, open: false };
/** Jak długo stoi odpowiedź na kliknięcie, które nic nie zrobiło. */
const NOTICE_MS = 4000;

export class Opcje {
  private readonly overlay: OpcjeHost;
  private readonly zrzut: ZrodloZrzutu;
  private readonly storage: Pick<Storage, "getItem" | "setItem"> | undefined;
  private readonly saveFile: ZapisPliku;
  private readonly ticker: Ticker;
  private readonly now: () => number;
  private readonly confirmClear: Confirm<void>;
  private readonly window: HTMLElement;
  private state: OpcjeState;
  private notice: string | null = null;
  private noticeHandle: number | null = null;

  constructor(options: OpcjeOptions) {
    this.overlay = options.overlay;
    this.zrzut = options.zrzut;
    this.storage = options.storage;
    this.saveFile = options.saveFile ?? zapiszPlik;
    this.ticker = options.ticker ?? realTicker;
    this.now = options.now ?? Date.now;
    this.confirmClear = new Confirm<void>({
      now: this.now,
      ticker: this.ticker,
      onExpire: () => this.render(),
    });
    this.state = this.loadState();

    // Arkusza NIE wstrzykujemy — reguły siedzą w `src/style.ts` i wchodzą do
    // shadow roota raz, razem z panelem. Powód i pomiar: `archive.ts`.
    this.window = document.createElement("div");
    this.window.className = "opcje";
    this.window.hidden = true;
    // APPEND, nigdy `prepend` — patrz nagłówek pliku.
    this.overlay.shadow.append(this.window);

    if (this.state.open) this.render();
  }

  isOpen(): boolean {
    return this.state.open;
  }

  /** Patrz `OpcjeControl.trybCzynny` — zębatka pokazuje CZYNNY tryb dev. */
  trybCzynny(): boolean {
    return this.zrzut.wlaczony();
  }

  toggle(): void {
    // Zamknięte okno nie zostawia uzbrojonego czyszczenia: po ponownym otwarciu
    // przycisk wyglądałby normalnie, a pierwszy klik już by kasował.
    this.confirmClear.cancel();
    this.state.open = !this.state.open;
    this.saveState();
    if (this.state.open) this.render();
    else this.window.hidden = true;
    // Zębatka w nagłówku panelu pokazuje stan okna — musi się odświeżyć.
    this.overlay.refresh();
  }

  destroy(): void {
    this.confirmClear.cancel();
    if (this.noticeHandle !== null) this.ticker.stop(this.noticeHandle);
    this.noticeHandle = null;
    this.window.remove();
  }

  private render(): void {
    // ⚠️ **PIERWSZA LINIA, NIE OZDOBA** (`AUDYT‑62`). `render()` wołają także
    // zegary — gasnąca odpowiedź z `powiedz()` i wygasające `confirmClear` —
    // a te odliczają dalej po zamknięciu okna. Bez tego strażnika ticker po
    // `NOTICE_MS` ustawiał `hidden = false` i **okno wracało na ekran samo**,
    // przy `state.open === false` i zębatce mówiącej „zamknięte"; pierwszy klik
    // w zębatkę wtedy nie zamykał, bo ustawiał `open = true`.
    //
    // `archive.ts:510` ma tę linię od początku — wypadła przy przepisywaniu
    // okna, razem z niczym innym. Ticker ZOSTAJE uruchomiony, tak samo jak
    // w archiwum: gaśnie sam po czterech sekundach i wtedy czyści `notice`,
    // więc ponowne otwarcie nie pokazuje starej odpowiedzi. Zatrzymanie go tutaj
    // wymagałoby wyzerowania `notice` w tym samym miejscu, inaczej odpowiedź
    // zostałaby w oknie na zawsze.
    if (!this.state.open) return;
    this.window.hidden = false;
    this.window.replaceChildren();
    this.window.style.left = `${this.state.x}px`;
    this.window.style.top = `${this.state.y}px`;
    this.window.append(this.renderHeader(), this.renderDev());
    if (this.notice !== null) {
      this.window.append(
        Object.assign(document.createElement("div"), {
          className: "opcje-notice",
          textContent: this.notice,
        }),
      );
    }
  }

  private renderHeader(): HTMLElement {
    const header = document.createElement("header");
    const title = document.createElement("span");
    title.className = "title";
    title.textContent = "Ustawienia";

    const close = document.createElement("button");
    close.type = "button";
    close.dataset.action = "opcje-close";
    close.textContent = "✕";
    close.setAttribute("aria-label", "Zamknij ustawienia");
    close.addEventListener("click", () => this.toggle());

    header.append(title, close);
    makeDraggable(header, {
      position: () => ({ x: this.state.x, y: this.state.y }),
      move: (x, y) => this.moveTo(x, y),
      end: () => this.saveState(),
    });
    return header;
  }

  /** Sekcja deweloperska: przełącznik i to, co się pod nim odsłania. */
  private renderDev(): HTMLElement {
    const sekcja = document.createElement("div");
    sekcja.className = "opcje-section";

    const wlaczony = this.zrzut.wlaczony();
    const przelacznik = document.createElement("button");
    przelacznik.type = "button";
    przelacznik.dataset.action = "dev-toggle";
    przelacznik.className = "opcje-toggle";
    przelacznik.textContent = "Tryb deweloperski";
    przelacznik.setAttribute("aria-pressed", String(wlaczony));
    przelacznik.addEventListener("click", () => {
      this.zrzut.wlacz(!this.zrzut.wlaczony());
      this.confirmClear.cancel();
      this.render();
      // Zębatka nosi znacznik trybu, więc przełączenie musi ją odświeżyć —
      // inaczej znacznik pojawiałby się dopiero przy następnym renderze panelu.
      this.overlay.refresh();
    });

    const opis = document.createElement("p");
    opis.className = "opcje-hint";
    opis.textContent = wlaczony
      ? "Dodatek zapamiętuje surowy przebieg walk, żeby dało się go zapisać do pliku."
      : "Pozwala zapisać do pliku surowy przebieg walk — przydaje się przy zgłaszaniu błędów.";

    sekcja.append(przelacznik, opis);
    if (!wlaczony) return sekcja;

    const stan = this.zrzut.stan();
    const licznik = document.createElement("p");
    licznik.className = "opcje-stan";
    licznik.textContent = `Zebrane: ${stan.walk} ${walkaSlowo(stan.walk)}, ${stan.komunikatow} ${wierszSlowo(stan.komunikatow)}.`;
    sekcja.append(licznik);

    // NIEZNANE MA BYĆ GŁOŚNE: bufor, który stanął, wygląda z zewnątrz tak samo
    // jak bufor, w którym nic się nie dzieje. Bez tego wiersza gracz zrzuciłby
    // plik urwany w połowie sesji i nie dowiedziałby się o tym.
    if (stan.przepelniony) {
      sekcja.append(
        Object.assign(document.createElement("p"), {
          className: "opcje-warn",
          textContent: "Pamięć zapisu się skończyła — nowe walki nie są już zbierane. Zapisz plik i wyczyść.",
        }),
      );
    }

    const akcje = document.createElement("div");
    akcje.className = "opcje-actions";

    const pobierz = document.createElement("button");
    pobierz.type = "button";
    pobierz.dataset.action = "zrzut-pobierz";
    pobierz.textContent = "Zrzut walki";
    pobierz.addEventListener("click", () => this.pobierz());

    const wyczysc = document.createElement("button");
    wyczysc.type = "button";
    wyczysc.dataset.action = "zrzut-wyczysc";
    wyczysc.textContent = this.confirmClear.pending(undefined) ? "na pewno?" : "wyczyść";
    wyczysc.addEventListener("click", () => {
      if (!this.confirmClear.ask(undefined)) {
        this.render();
        return;
      }
      this.zrzut.wyczysc();
      this.powiedz("Zapis wyczyszczony.");
    });

    akcje.append(pobierz, wyczysc);
    sekcja.append(akcje);
    return sekcja;
  }

  /**
   * Zapis pliku — albo odpowiedź, dlaczego nie.
   *
   * PUSTY ZRZUT NIE ZAPISUJE SIĘ NIGDY. Plik z `wpisy: []` wygląda jak materiał
   * i nie jest nim; `czytajZrzut` odrzuca go dopiero po stronie narzędzia,
   * czyli o kwadrans za późno, gdy gracz zdążył go już komuś wysłać.
   */
  private pobierz(): void {
    const stan = this.zrzut.stan();
    if (stan.wywolan === 0) {
      this.powiedz("Nie ma czego zapisać — stocz walkę przy włączonym trybie.");
      return;
    }
    try {
      this.saveFile(this.zrzut.nazwaPliku(), JSON.stringify(this.zrzut.zrzut()));
      this.powiedz(`Zapisano ${stan.walk} ${walkaSlowo(stan.walk)}.`);
    } catch (error) {
      console.error("[MargoMeter] zrzut nie zapisał się", error);
      this.powiedz("Nie udało się zapisać pliku.");
    }
  }

  /** Odpowiedź, która sama gaśnie. Wzór `notice` w `archive.ts`. */
  private powiedz(tekst: string): void {
    this.notice = tekst;
    if (this.noticeHandle !== null) this.ticker.stop(this.noticeHandle);
    this.noticeHandle = this.ticker.start(() => {
      if (this.noticeHandle !== null) this.ticker.stop(this.noticeHandle);
      this.noticeHandle = null;
      this.notice = null;
      this.render();
    }, NOTICE_MS);
    this.render();
  }

  private moveTo(x: number, y: number): void {
    const { x: nx, y: ny } = clampToViewport(x, y, OPCJE_WIDTH);
    this.state.x = nx;
    this.state.y = ny;
    this.window.style.left = `${nx}px`;
    this.window.style.top = `${ny}px`;
  }

  /** Ta sama ostrożność co przy panelu — patrz `stored-state.ts`. */
  private loadState(): OpcjeState {
    const stored = storedRecord(this.storage, STORAGE_KEY);
    if (!stored) return { ...DEFAULT_STATE };
    const maxX = Math.max(1, window.innerWidth);
    const maxY = Math.max(1, window.innerHeight);
    return {
      x: storedNumber(stored["x"], DEFAULT_STATE.x, -maxX, maxX),
      y: storedNumber(stored["y"], DEFAULT_STATE.y, -maxY, maxY),
      open: storedBoolean(stored["open"], DEFAULT_STATE.open),
    };
  }

  private saveState(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Brak magazynu nie jest powodem, żeby przewrócić okno.
    }
  }
}

/**
 * Odmiana przez liczbę — przez `plural` z `overlay.ts`, nie własnym ciałem.
 *
 * ⚠️ **STAŁY TU DWA RĘCZNE ODPOWIEDNIKI `plural`** (`AUDYT‑71`), a uzasadnienie
 * brzmiało „osobno, bo tamta odmienia turę" — i wskazywało na `turnWord`, czyli
 * na WYWOŁANIE, nie na funkcję. Sama `plural` jest eksportowana, `archive.ts`
 * importuje z `overlay.ts` bez problemu, a `fightWord` w `overlay.ts` ma nawet
 * te same trzy formy co tutejsze `walkaSlowo`.
 */
const walkaSlowo = (n: number) => plural(n, ["walka", "walki", "walk"]);
const wierszSlowo = (n: number) => plural(n, ["wiersz", "wiersze", "wierszy"]);
