import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import { parse } from "../src/parser.ts";
import { ELEMENT_MARKER, type BattleEvent } from "../src/types.ts";

/**
 * Fuzz mutacyjny — jedyny test w repo, który pyta o to, czego parser NIE
 * rozpoznaje.
 *
 * Cały pozostały zestaw sprawdza korpus takim, jaki jest, a korpus ma **zero
 * `unknown`**. To znaczy, że o granicy rozpoznawania nie mówi ani słowa: pętla
 * „każda linia rozpoznana" zostanie zielona także wtedy, gdy wzorzec poszerzy
 * się tak, że zacznie łykać cudze kształty. Dokładnie ta klasa awarii —
 * przekłamana liczba przy `unknownLines == 0` — jest tym, przed czym broni
 * reszta tego repo, i jedyną, której nie umiał złapać żaden istniejący test.
 *
 * Mutacje są DETERMINISTYCZNE (żadnego `Math.random()`), więc przebieg jest
 * powtarzalny, a czerwony wynik da się odtworzyć bez ziarna.
 *
 * Koszt zmierzony przy dokładaniu: 6085 mutacji, 307 ms razem ze startem Buna.
 * Mieści się w bramie bez próbkowania, więc próbkowania tu nie ma — cały korpus
 * tekstowy idzie linia po linii.
 *
 * **Czego ten przelot NIE obejmuje, żeby cisza nie udawała pokrycia:** zrzutów
 * `log.html`. Mutacja działa na tekście, a droga przez DOM wymaga przepuszczenia
 * każdego wariantu przez `extractText`, czyli przebudowy drzewa 6 tys. razy.
 * Znacznik żywiołu wchodzi tu więc wyłącznie jako wariant syntetyczny (niżej),
 * a nie z korpusu.
 */

const FIXTURES = new URL("./fixtures/", import.meta.url).pathname;

/** Słowo bez cyfr i bez znaczenia w logu — ma być widoczne w komunikacie błędu. */
const SLOWO = "kwiaty";

/**
 * Ile linii przed mutowaną wchodzi do okna.
 *
 * Parser jest liniowy, ale stanowy: cios (`uderzył z siłą`) czeka na linię
 * przyjętych, a między nimi stoją modyfikatory. Okno na trzy linie ROZCINAŁO
 * te bloki i mierzyło co innego, niż się wydawało — przy oknie 3 wychodziły
 * 2 ucieczki, przy 8 wychodzi 1995. Osiem linii wstecz obejmuje najdłuższy
 * blok ataku w korpusie z zapasem.
 */
const WSTECZ = 8;
const WPRZOD = 2;

/**
 * Liczby zamienione na słowo — ale NIE procent życia.
 *
 * Procent jest częścią tożsamości linii (`ACTOR`), nie jej kwotą: zepsuty
 * wywraca dopasowanie w całości i mutant staje się `unknown` z powodu, o który
 * nie pytamy. Pierwsza wersja tego mutatora używała `\d+(?!%)` i była zła
 * DWA razy: `100%` cofało się do `10` + `0`, a procent ułamkowy (`85.19%`)
 * nie był chroniony wcale, bo po `85` stoi kropka. Stąd wyprzedzenie na całą
 * końcówkę, z ułamkiem włącznie.
 */
const zepsujLiczby = (linia: string) =>
  linia.replace(/\d+/g, (m, offset: number, cala: string) =>
    /^[.,]?\d*%/.test(cala.slice(offset + m.length)) ? m : SLOWO,
  );

/**
 * Kwoty niosące OBRAŻENIA i LECZENIE — to o nie toczy się gra.
 *
 * Procenty życia, numery linii i liczniki tur celowo nie wchodzą: mutacja ich
 * nie rusza, więc ich zmiana byłaby szumem.
 */
function kwoty(events: BattleEvent[]): number[] {
  const out: number[] = [];
  for (const event of events) {
    if (event.kind === "attack") {
      for (const hit of event.hits) out.push(hit.raw, hit.applied);
      if (event.blocked !== null) out.push(event.blocked);
    } else if (event.kind === "dot" || event.kind === "heal") {
      out.push(event.amount);
    }
  }
  return out.sort((a, b) => a - b);
}

/**
 * Kształt zepsutej linii — po nim grupujemy ucieczki.
 *
 * Zamrożona LICZBA sama w sobie nie mówi, co jest zepsute, a zamrożona lista
 * 1995 linii byłaby nieczytelna. Kształt daje jedno i drugie: widać rodzinę
 * defektu i widać, ile jej zostało.
 */
function ksztalt(linia: string): string {
  const tekst = linia.replace(/\[\/?[a-zA-Z]+\]/g, "").trim();
  if (/uderzył(?:a|o|\(a\))? z siłą/.test(tekst)) return "cios: «X(pct%) uderzył z siłą …»";
  if (/^-?\s*Zablokowanie/.test(tekst)) return "blok: «Zablokowanie N obrażeń»";
  if (/otrzymał(?:a|o|\(a\))?.*obrażeń|obrażeń otrzymał/.test(tekst)) {
    return "przyjęte: «X(pct%) otrzymał … obrażeń»";
  }
  return "inne: " + tekst.replace(/\d+/g, "N");
}

const fixtures = [...new Glob("*/*/raw.txt").scanSync(FIXTURES)].map((path) => ({
  path,
  text: () => Bun.file(FIXTURES + path).text(),
}));

/**
 * ZAMROŻONE UCIECZKI — linie, w których zniszczenie liczby zmienia kwotę
 * w wyniku, a parser nie mówi o tym ani słowa.
 *
 * To nie jest lista „do zaakceptowania". To lista DO WYZEROWANIA — każda
 * pozycja jest udowodnionym miejscem, w którym panel pokaże złą liczbę bez
 * ostrzeżenia. Liczba MA maleć; rosnąć nie ma prawa, bo nowy kształt znaczy,
 * że jakiś wzorzec właśnie zaczął przyjmować więcej, niż format dopuszcza.
 *
 * **Stan wyjściowy, zmierzony 2026‑08‑03 na całym korpusie tekstowym — trzy
 * rodziny, 1995 linii:**
 *
 *   1383 · przyjęte — `Wyczxs(85.19%) otrzymał -kwiaty obrażeń` przechodziło
 *          jako cios wytłumiony do zera: `[3268, 3974] → [0, 3974]`;
 *    578 · cios — `Wyczxs(78.59%) uderzył z siłą +kwiaty` przechodziło z siłą
 *          surową PRZEPISANĄ z linii przyjętych: `[57, 92, 2289, 3010] →
 *          [57, 92, 2289, 2289]`;
 *     34 · blok — `-Zablokowanie kwiaty obrażeń` przestaje być blokiem i staje
 *          się zwykłym procem, a kwota znika z listy (`1917`).
 *
 * **Dwie pierwsze zeszły z listy w tej samej rundzie**, przez zawężenie
 * `DAMAGE_SEGMENT` w `parser.ts` — obie miały jedną przyczynę: segment obrażeń
 * opisany jako „cokolwiek". 1961 z 1995 ucieczek zamkniętych jedną zmianą.
 *
 * ⚠️ **Blok zostaje, ale NIE jest defektem — to granica tego niezmiennika**
 * i pierwsza wersja tego komentarza mówiła inaczej. Mutant niszczy liczbę
 * WŁASNEJ linii, więc kwota znika **słusznie**; parser milczy, bo
 * `-Zablokowanie kwiaty obrażeń` jest nadal poprawnym procem (`RE_MODIFIER`
 * żąda litery, nie liczby) i nie da się go odróżnić od prawdziwego efektu
 * o takiej nazwie. To ta sama sytuacja co 2698 modyfikatorów zaliczonych wyżej
 * jako „milczenie słuszne" — różni się wyłącznie tym, że akurat ta etykieta
 * niosła kwotę, więc niezmiennik ją widzi.
 *
 * Zostaje na liście mimo to, zamiast być wyciszona wyjątkiem, bo pilnuje
 * czegoś realnego: gdyby `RE_BLOCKED` albo `RE_MODIFIER` się poszerzyły,
 * liczba 34 drgnie. Zamrożona liczba jest tu strażnikiem stabilności wzorców,
 * a nie długiem do spłacenia.
 */
const ZAMROZONE_UCIECZKI: Record<string, number> = {
  "blok: «Zablokowanie N obrażeń»": 34,
};

describe("fuzz mutacyjny — granica czujki `unknown`", () => {
  /**
   * Niezmiennik: **zniszczenie liczb w linii albo nie rusza żadnej kwoty, albo
   * zapala `unknown`.** Trzeciej możliwości — kwota się zmienia, a parser
   * milczy — być nie powinno.
   *
   * „Albo nie rusza kwoty" nie jest furtką, tylko poprawnym przypadkiem, i to
   * najliczniejszym (2698 z 6085). Modyfikator `+Piętno bestii: atak +327`
   * zepsuty do `+Piętno bestii: atak +kwiaty` JEST nadal poprawnym procem:
   * `RE_MODIFIER` żąda litery, nie liczby, a etykieta proca żadnej kwoty do
   * statystyk nie wnosi. Wymaganie `unknown` także tam dałoby 1548 fałszywych
   * alarmów i test, który uczy tylko tego, żeby go wyłączyć.
   */
  test("zmiana kwoty bez `unknown` zdarza się wyłącznie w znanych trzech rodzinach", async () => {
    const znalezione = new Map<string, number>();
    const przyklady = new Map<string, string>();
    let zbadanych = 0;
    let bezZmianyKwot = 0;
    let glosnych = 0;

    for (const fixture of fixtures) {
      const linie = (await fixture.text()).split("\n");
      for (let i = 0; i < linie.length; i++) {
        const linia = linie[i]!;
        const zepsuta = zepsujLiczby(linia);
        if (zepsuta === linia) continue;

        const od = Math.max(0, i - WSTECZ);
        const okno = linie.slice(od, Math.min(linie.length, i + WPRZOD + 1));
        const zmutowane = [...okno];
        zmutowane[i - od] = zepsuta;

        zbadanych++;
        const przed = kwoty(parse(okno.join("\n")));
        const events = parse(zmutowane.join("\n"));
        const po = kwoty(events);

        if (przed.length === po.length && przed.every((n, k) => n === po[k])) {
          bezZmianyKwot++;
          continue;
        }
        if (events.some((e) => e.kind === "unknown" && e.line.includes(SLOWO))) {
          glosnych++;
          continue;
        }

        const klucz = ksztalt(linia);
        znalezione.set(klucz, (znalezione.get(klucz) ?? 0) + 1);
        if (!przyklady.has(klucz)) {
          przyklady.set(klucz, `${fixture.path}:${i + 1} → ${JSON.stringify(przed)} → ${JSON.stringify(po)}`);
        }
      }
    }

    // Sanity całego przelotu: gdyby ładowarka albo mutator się urwały, wszystkie
    // trzy liczby poszłyby w dół naraz i test niżej byłby zielony i PUSTY.
    expect(zbadanych).toBeGreaterThan(5000);
    expect(bezZmianyKwot).toBeGreaterThan(2000);
    expect(glosnych).toBeGreaterThan(1000);

    expect(Object.fromEntries([...znalezione].sort())).toEqual(
      Object.fromEntries(Object.entries(ZAMROZONE_UCIECZKI).sort()),
    );
  });

  /**
   * Kształty syntetyczne — te same defekty, ale pokazane palcem.
   *
   * Przelot wyżej mówi ILE, te testy mówią CO. Rozdzielone, bo przelot gaśnie
   * dopiero po pełnej naprawie, a te zapalają się i gasną pojedynczo.
   */
  describe("dziury pokazane palcem", () => {
    const cios = (przyjete: string, sila = "+75") =>
      parse(`Kamil(100%) uderzył z siłą ${sila}\nWilk(50%) ${przyjete}`);

    const nieznane = (events: BattleEvent[]) =>
      events.filter((e) => e.kind === "unknown").map((e) => e.line);

    test("segment przyjętych bez liczby jest głośny, nie zerowy", () => {
      // Przed zawężeniem `DAMAGE_SEGMENT` wychodził stąd PEŁNOPRAWNY cios
      // `hits [{raw: 75, applied: 0}]` i ani jednej linii `unknown` — czyli
      // panel pokazywał „cios wytłumiony do zera" zamiast powiedzieć, że nie
      // rozumie linii. Sprawdzone mutacją: po cofnięciu zawężenia ten test
      // pada, a razem z nim przelot wyżej wraca do 1995 ucieczek.
      const events = cios("otrzymał kwiaty obrażeń");
      expect(events.some((e) => e.kind === "attack")).toBe(false);
      expect(nieznane(events)).toEqual([
        "Kamil(100%) uderzył z siłą +75",
        "Wilk(50%) otrzymał kwiaty obrażeń",
      ]);
    });

    test("segment ciosu bez liczby jest głośny, nie przepisany z przyjętych", () => {
      // Wcześniej `raw` brało się tu z linii PRZYJĘTYCH (`raw[i]?.value ??
      // appliedValue` w `buildHits`), więc obrażenia surowe były zmyślone,
      // a nie odczytane — i też bez ostrzeżenia.
      const events = cios("otrzymał -10 obrażeń", "kwiaty");
      expect(events.some((e) => e.kind === "attack")).toBe(false);
      expect(nieznane(events)).toEqual([
        "Kamil(100%) uderzył z siłą kwiaty",
        "Wilk(50%) otrzymał -10 obrażeń",
      ]);
    });

    test("separator tysięcy nadal jest głośny", () => {
      // Strażnik z `SOLID §4.19`, postawiony tu, żeby zawężanie segmentu
      // obrażeń nie zjadło go po drodze: `+10 000` to DWIE liczby, więc cios
      // rozsypuje się na trafienia widma i idzie w `unknown`. Zawężenie tego
      // NIE zmienia — `\s*` między liczbami zostawia „10" i „000" osobno,
      // dokładnie jak `(.+)` przed zmianą.
      const events = cios("otrzymał -10 000 obrażeń", "+10 000");
      expect(nieznane(events).length).toBeGreaterThan(0);
    });

    test("prawdziwy cios z żywiołami przechodzi nietknięty", () => {
      // Kontrola przeciwna do trzech wyżej: zawężenie ma odrzucać śmieci,
      // a nie zawężać to, co gra naprawdę pisze. Kształt z korpusu, w wersji
      // sklejonej przez `extractText` — bez spacji między liczbami.
      const events = parse(
        `Kamil(100%) uderzył z siłą +906${ELEMENT_MARKER}d+147${ELEMENT_MARKER}f\n` +
          `Wilk(50%) otrzymał -104${ELEMENT_MARKER}d-8${ELEMENT_MARKER}f obrażeń`,
      );
      const attack = events.find((e) => e.kind === "attack");
      expect(nieznane(events)).toEqual([]);
      expect(attack?.hits.map((h) => [h.raw, h.applied, h.element])).toEqual([
        [906, 104, "dystansowe"],
        [147, 8, "ogień"],
      ]);
    });
  });
});
