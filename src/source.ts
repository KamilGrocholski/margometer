import { ELEMENT_MARKER, FIGHT_START_TEXT } from "./types.ts";

/**
 * Źródło tekstu logu walki.
 *
 * Rdzeń nie wie, skąd tekst pochodzi — dzięki temu testy podstawiają zrzut
 * z pliku, a w grze siedzi za tym MutationObserver.
 */
export type LogSource = {
  /** Zwraca funkcję odsubskrybowującą. */
  subscribe(listener: (text: string) => void): () => void;
};

const FIGHT_START_MARKER = new RegExp(FIGHT_START_TEXT);

const BLOCK_TAGS = new Set([
  "DIV",
  "P",
  "LI",
  "TR",
  "SECTION",
  "ARTICLE",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
]);

/**
 * Wyciąga tekst z zachowaniem podziału na linie.
 *
 * `textContent` sklejałby linie logu w jeden ciąg (parser jest liniowy, więc
 * to by go zabiło), a `innerText` nie istnieje w jsdom, więc nie da się go
 * przetestować. Stąd własne przejście po drzewie.
 */
/**
 * `<b class="dmgc">` — litera po `dmg` to żywioł: c/l/f. Samo `dmg` bez litery
 * bierzemy za obrażenia fizyczne (auto-atak wojownika, paladyna, tancerza).
 *
 * `third` to jedyna klasa liczby obrażeń, która NIE zaczyna się od `dmg` —
 * niesie ją trzecie trafienie tancerza ostrzy, opisane w logu modyfikatorem
 * "+Trzeci cios". Bez tej alternatywy liczba i tak przechodziła do parsera
 * (`<b>` nie jest blokiem, więc `walk` wciągał jej tekst), ale BEZ żywiołu —
 * czyli nie do odróżnienia od zrzutu tekstowego, w którym klas nie ma wcale.
 * Milcząco, a `unknownElements` to jedyna czujka na zmianę nazw klas.
 */
const DAMAGE_CLASS = /(?:^|\s)(?:dmg([a-z]*)|(third))(?:\s|$)/;
/**
 * Kod klasy `third` w znaczniku. CYFRA, nie litera, i to jest wybór na lata:
 * znacznik niesie dokładnie jeden znak, a każda wolna dziś litera może jutro
 * stać się prawdziwą klasą `dmgX` gry i wtedy jej liczby dostałyby po cichu
 * etykietę "trzeci cios". Klasa `dmg3` jest niemożliwa — wzorzec wyżej czyta
 * po `dmg` wyłącznie `[a-z]` — więc kolizji nie będzie.
 */
const THIRD_STRIKE_CODE = "3";

export function extractText(node: Node): string {
  let out = "";

  const walk = (current: Node) => {
    for (const child of Array.from(current.childNodes)) {
      if (child.nodeType === 3 /* TEXT_NODE */) {
        out += child.nodeValue ?? "";
        continue;
      }
      if (child.nodeType !== 1 /* ELEMENT_NODE */) continue;

      const element = child as Element;
      if (element.tagName === "BR") {
        out += "\n";
        continue;
      }

      // Żywioł siedzi TYLKO w klasie CSS. Doklejamy go do liczby znacznikiem,
      // bo po drodze do parsera zostaje z DOM-u sam tekst.
      const damage = DAMAGE_CLASS.exec(element.getAttribute("class") ?? "");
      if (damage) {
        const code = damage[2] ? THIRD_STRIKE_CODE : damage[1] || "p";
        out += `${element.textContent ?? ""}${ELEMENT_MARKER}${code}`;
        continue;
      }

      const isBlock = BLOCK_TAGS.has(element.tagName);
      if (isBlock && !out.endsWith("\n")) out += "\n";
      walk(element);
      if (isBlock && !out.endsWith("\n")) out += "\n";
    }
  };

  walk(node);
  return out;
}

/** Treść bez znaczenia dla porównań: same znaki, bez układu białych znaków. */
function normalized(element: Element): string {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}

/** Dokąd najwyżej wolno się wspinać — poza tym nie ma już żadnego kontenera. */
function isRoot(element: Element): boolean {
  return element.tagName === "BODY" || element.tagName === "HTML";
}

/**
 * Szuka kontenera logu walki w DOM gry.
 *
 * Nie zgadujemy selektora (zmieniłby się przy pierwszym patchu) — szukamy
 * elementu po treści, po linii rozpoczęcia walki.
 *
 * Od najgłębszego elementu z tą linią wspinamy się w górę tak długo, jak rodzic
 * NIE dokłada nic do treści. Taki rodzic jest tylko opakowaniem tej samej linii
 * (`<b>`, `<span>`, `<font>`), a kontenerem jest dopiero pierwszy przodek, który
 * niesie coś więcej — czyli kolejne linie logu.
 *
 * Poprzednia wersja brała po prostu rodzica najgłębszego elementu. Gdy gra
 * pogrubiała linię otwierającą — a `raw.txt` zapisuje ją jako `[b]...[/b]` —
 * najgłębszym elementem był ten `<b>`, więc „kontenerem” zostawała pojedyncza
 * linia. Obserwator pilnował jednej linii i licznik nie widział ani jednego
 * obrażenia do końca walki, bo `boot()` przy `found === container` nie próbuje
 * ponownie.
 */
export function findBattleLog(root: ParentNode = document): Element | null {
  const candidates = Array.from(root.querySelectorAll("*")).filter((element) =>
    FIGHT_START_MARKER.test(element.textContent ?? ""),
  );
  if (candidates.length === 0) return null;

  const deepest = candidates.reduce((best, element) => {
    let depth = 0;
    for (let node: Element | null = element; node; node = node.parentElement) depth += 1;

    let bestDepth = 0;
    for (let node: Element | null = best; node; node = node.parentElement) bestDepth += 1;

    return depth > bestDepth ? element : best;
  });

  let node = deepest;
  while (node.parentElement && !isRoot(node.parentElement)) {
    const parent = node.parentElement;
    if (normalized(parent) !== normalized(node)) return parent;
    node = parent;
  }

  // Żaden przodek nie dokłada treści, czyli w logu stoi na razie SAMA linia
  // otwierająca. Wtedy z treści nie da się odróżnić kontenera logu od dowolnej
  // ramki nad nim, więc bierzemy rodzica linii — jak przed tą zmianą.
  // Naprawia się samo: gdy dojdzie druga linia, pętla wyżej znajdzie prawdziwy
  // kontener, `boot()` zobaczy inny element i przepnie obserwatora.
  return deepest.parentElement ?? deepest;
}

/** Obserwuje element logu i emituje jego pełną treść po każdej zmianie. */
export class DomLogSource implements LogSource {
  constructor(private readonly container: Element) {}

  subscribe(listener: (text: string) => void): () => void {
    let scheduled = false;
    const emit = () => {
      scheduled = false;
      listener(extractText(this.container));
    };

    // Log potrafi urosnąć o kilka węzłów naraz — zbieramy je w jedną emisję.
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(emit);
    });

    observer.observe(this.container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    emit();
    return () => observer.disconnect();
  }
}

/** Źródło ze stałym tekstem — do testów i podglądu zapisanych logów. */
export class StaticLogSource implements LogSource {
  constructor(private readonly text: string) {}

  subscribe(listener: (text: string) => void): () => void {
    listener(this.text);
    return () => {};
  }
}
