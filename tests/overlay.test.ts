import { beforeEach, describe, expect, test } from "bun:test";
import { EMPTY_STATS, aggregate, totalBySide } from "../src/stats.ts";
import {
  Overlay,
  tipPosition,
  type PreviewView,
  type RecorderControl,
} from "../src/overlay.ts";
import { syntheticFight } from "../tools/synthetic-log.ts";
import { cios, leczenie, nieznane, otwarcie, trafienie, tykniecie } from "./zdarzenia.ts";
import pkg from "../package.json" with { type: "json" };
import { ManualTicker } from "./manual-ticker.ts";
import { metricButton, number, rate, readEvents, shareOf } from "./helpers.ts";

/**
 * Prawy przycisk nad listą rankingu.
 *
 * Celem jest `.rows`, a nie sam shadow root, bo panel odbiera menu przeglądarki
 * WYŁĄCZNIE wewnątrz `.panel` — a zdarzenie wysłane na korzeń ma `target`,
 * którego prawdziwe kliknięcie nigdy nie ma. Ten sam szyk co w teście archiwum
 * niżej („nie cofa widoku i nie blokuje menu przeglądarki").
 */
/**
 * Czy widać okruszek powrotu.
 *
 * Nie `querySelector(".crumb") !== null`: od 2026‑08‑03 okruszek jest TRWAŁYM
 * węzłem i z drzewa nie wychodzi (`UX §4.1`) — chowa go atrybut `hidden`.
 * Asercja na obecność sprawdzałaby więc coś, co jest prawdą zawsze.
 */
function crumbVisible(overlay: Overlay): boolean {
  const crumb = overlay.shadow.querySelector<HTMLElement>(".crumb");
  return crumb !== null && !crumb.hidden;
}

function rightClick(overlay: Overlay): void {
  overlay.shadow
    .querySelector(".rows")!
    .dispatchEvent(new Event("contextmenu", { bubbles: true, cancelable: true }));
}

/**
 * ⚠️ **61 TESTÓW ZNIKŁO STĄD 2026‑08‑04, razem z materiałem z prawdziwych walk.**
 *
 * Wszystkie wymieniały NAZWY postaci i LICZBY z konkretnych walk z korpusu:
 * „Łowcożyr Kazrek zadał 10 366", „ranking ma dokładnie te trzy nazwy",
 * „pasek ma szerokość 89/2897". Materiał zniknął, a przepisanie ich na walki
 * z generatora dałoby asercje, w których panel sprawdza się przeciw temu, co
 * sam policzył z danych, które sami wyprodukowaliśmy.
 *
 * Grubsze straty, po blokach: rozbicie leczenia na źródła (5), TOP‑3 w dymku
 * z udziałami (4), licznik tur i tury utracone (4), filtr składu i procenty
 * w obrębie drużyny (4), nagłówek stron z tempem (7), blok/super‑kryt/osłabienie
 * w licznikach stopki (6), uniki pełne kontra częściowe (2) oraz 27 pozycji
 * z głównego bloku `overlay` — sortowanie, gwiazdka przy duplikatach nazw,
 * szerokość paska, drążenie w trzech szczeblach, dymki z rozbiciem.
 *
 * Co zostało: 91 testów, które pytają o ZACHOWANIE panelu bez odwołania do
 * konkretnej walki — gesty, trwałość węzłów, stan przeżywający odświeżenie,
 * kopiowanie, zdejmowanie panelu, arkusz stylów.
 */

describe("leczenie", () => {
  const load = async (name: string) => aggregate(readEvents(`new-engine/${name}`));


  test("gołe \"Przywrócono\" ląduje pod Regeneracją, bo log nie podaje źródła", () => {
    // Leczenie bez nazwy umiejętności nie ma sprawcy ani źródła — zbiorcza
    // etykieta mówi to wprost, zamiast przypisać je czemukolwiek.
    const stats = aggregate([
      otwarcie(["Gracz 1p"], ["Wilk 1w"]),
      cios("Wilk", "Gracz", [trafienie(500)], { targetHpPct: 50 }),
      leczenie("Gracz", 200, { targetHpPct: 70 }),
      leczenie("Gracz", 266, { targetHpPct: 90 }),
    ]);
    const gracz = stats.actors.find((a) => a.name === "Gracz")!;
    expect(gracz.healedBy).toEqual([{ label: "Regeneracja", amount: 466, hits: 2 }]);
  });

  test("rozbicie sumuje się do wartości na pasku", async () => {
    for (const actor of (await load("2026-07-18_tancerz-vs-tropiciel-umiejetnosci")).actors) {
      const sum = actor.healedBy.reduce((acc, row) => acc + row.amount, 0);
      expect(sum).toBe(actor.healingReceived);
    }
  });



});

/**
 * `UX §4.2` / `UX-POPRAWKI B5` — podgląd bez commitu.
 *
 * Dane (`dealtToBy` / `takenFromBy` / `healedBy`) były policzone od zawsze;
 * brakowało ich w dymku. Testy pytają o TREŚĆ, nie o obecność węzłów: sekcja,
 * która rysuje się z pustymi albo cudzymi liczbami, przeszłaby każdą asercję
 * typu „jest .tip-heading".
 */
describe("podgląd TOP-3 w dymku", () => {
  const load = async (name: string) => aggregate(readEvents(`new-engine/${name}`));

  const hover = (overlay: Overlay, actor: string) => {
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === actor)!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));
    return overlay.shadow.querySelector(".tip")!;
  };

  /** Wiersze sekcji o danym nagłówku — para etykieta/wartość. */
  const sectionRows = (tip: Element, heading: string) => {
    const section = [...tip.querySelectorAll(".tip-section")].find(
      (s) => s.querySelector(".tip-heading")?.textContent === heading,
    )!;
    return [...section.querySelectorAll(".tip-stat")].map((row) => [
      row.querySelector(".tip-stat-label")?.textContent,
      row.querySelector(".tip-stat-value")?.textContent,
    ]);
  };





  test("leczenie pokazuje OD CZEGO, bo log nie nazywa leczącego", async () => {
    const stats = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats);

    metricButton(overlay, "Leczenie").click();

    const leczony = stats.actors.find((a) => a.healedBy.length > 0)!;
    const wiersze = sectionRows(hover(overlay, leczony.name), "OD CZEGO");
    expect(wiersze.map(([label]) => label)).toEqual(
      leczony.healedBy.slice(0, 3).map((s) => s.label),
    );
  });
});

/**
 * `UX §4.1` / `UX-POPRAWKI B4` — kontekst postaci ma być WIDAĆ.
 *
 * Wybór postaci przeżywał zmianę metryki od dawna, ale okruszek budował się od
 * nowa przy każdym renderze — a panel przerysowuje się przy każdej linii logu.
 * `.crumb-back` ma regułę `:hover`, której świeży węzeł nie dostaje, dopóki
 * mysz się nie ruszy, więc podświetlenie gasło i wracało w kółko.
 *
 * Testy pytają o TOŻSAMOŚĆ węzła, nie o jego treść: treść była poprawna także
 * przed zmianą i asercja na nią przechodziłaby w obie strony.
 */
describe("okruszek jest trwałym węzłem", () => {
  const load = async () => aggregate(readEvents("new-engine/2026-07-18_lowca-vs-druzyna"));

  test("przetrwa zmianę metryki jako TEN SAM węzeł", async () => {
    const overlay = new Overlay();
    overlay.render(await load());
    overlay.shadow.querySelector<HTMLElement>(".row[data-actor]")!.click();

    const przed = overlay.shadow.querySelector(".crumb");
    const przedBack = overlay.shadow.querySelector(".crumb-back");
    expect(przed).not.toBeNull();

    metricButton(overlay, "Otrzymane").click();

    expect(overlay.shadow.querySelector(".crumb")).toBe(przed!);
    expect(overlay.shadow.querySelector(".crumb-back")).toBe(przedBack!);
  });

  test("przetrwa przerysowanie panelu nową porcją logu", async () => {
    // Najostrzejszy przypadek: to on zdarza się kilka razy na sekundę w walce.
    const overlay = new Overlay();
    const stats = await load();
    overlay.render(stats);
    overlay.shadow.querySelector<HTMLElement>(".row[data-actor]")!.click();
    const przed = overlay.shadow.querySelector(".crumb");

    overlay.render(stats);

    expect(overlay.shadow.querySelector(".crumb")).toBe(przed!);
  });

  test("po powrocie do składu chowa się, ale zostaje w drzewie", async () => {
    const overlay = new Overlay();
    overlay.render(await load());
    const crumb = overlay.shadow.querySelector<HTMLElement>(".crumb")!;
    // Przed wejściem w postać jest już w drzewie — to jest cała zmiana.
    expect(crumb.hidden).toBe(true);

    overlay.shadow.querySelector<HTMLElement>(".row[data-actor]")!.click();
    expect(crumb.hidden).toBe(false);

    overlay.shadow.querySelector<HTMLElement>(".crumb-back")!.click();
    expect(overlay.shadow.querySelector(".crumb")).toBe(crumb);
    expect(crumb.hidden).toBe(true);
  });

});

describe("licznik tur", () => {
  const load = async (name: string) => aggregate(readEvents(`new-engine/${name}`));





  test("dymek pokazuje wszystkie widoczne metryki naraz, bez skakania po zakładkach", async () => {
    const stats = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats);
    overlay.shadow.querySelector(".row")!.dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector(".tip")!;
    const stat = (label: string) =>
      [...tip.querySelectorAll(".tip-stat")]
        .find((row) => row.querySelector(".tip-stat-label")?.textContent === label)
        ?.querySelector(".tip-stat-value")?.textContent;

    // Zakładka stoi na "Zadane", a mimo to widać obie metryki. Postać bierzemy
    // z wiersza, nie z nazwy na sztywno — dymek dotyczy tego, co pod kursorem.
    const hovered = overlay.shadow.querySelector<HTMLElement>(".row")!.dataset.actor;
    const actor = stats.actors.find((a) => a.name === hovered)!;
    expect(stat("Zadane")).toBe(number.format(actor.damageDealt));
    expect(stat("Otrzymane")).toBe(number.format(actor.damageTaken));
    expect(stat("Leczenie")).toBe(number.format(actor.healingReceived));
    // Tury stoją tu mimo braku własnej zakładki: bez nich sumy nie mają skali.
    expect(stat("Tury")).toBe(`${actor.turns}`);

    // Tury utracone stoją ZAWSZE, także jako zero: brak wiersza czytałoby się
    // jak brak pomiaru, a nie jak brak strat.
    expect(stat("Tury utracone")).toBeDefined();

    // Aktywna metryka wyróżniona, żeby było wiadomo, wobec czego jest ranking.
    const active = [...tip.querySelectorAll(".tip-stat.is-active")];
    expect(active).toHaveLength(1);
    expect(active[0]!.querySelector(".tip-stat-label")?.textContent).toBe("Zadane");

    // Liczniki bez własnej zakładki też muszą być pod ręką.
    const note = tip.querySelector(".tip-note")?.textContent ?? "";
    expect(note).toContain(`ciosy ${actor.hits}`);
    expect(note).toContain(`kryt. ${actor.crits}`);
    expect(note).toContain(`maks. cios ${number.format(actor.maxHit)}`);
  });

});

describe("podział na drużyny", () => {





});

describe("overlay", () => {
  const statsFrom = async (name: string) => aggregate(readEvents(name));


  test("pokazuje cały skład od linii otwierającej, zanim ktokolwiek zadziała", () => {
    const stats = aggregate([
      otwarcie(["Łowca głów z psk 104h"], ["Wieczornica 93p", "Południca 92p"]),
    ]);
    const overlay = new Overlay();
    overlay.render(stats);

    const labels = [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);
    // Na samych zerach o kolejności decyduje alfabet (Ł przed P).
    expect(labels).toEqual(["Łowca głów z psk", "Południca", "Wieczornica"]);
    // Sam wiersz to za mało: zero musi być widoczne jako zero, nie jako pustka.
    expect(overlay.shadow.querySelector(".value")?.textContent).toContain("0");
  });



  /**
   * Uczestnik, którego nazwa stoi po obu stronach, nie ma strony — ale nadal
   * jest w składzie. Filtr pytał kiedyś o `side !== null`, czyli traktował te
   * dwie rzeczy jak jedną, i taki wiersz znikał z panelu całkiem.
   */
  test("uczestnik bez znanej strony zostaje wierszem, ale tylko w „Wszyscy”", () => {
    const stats = aggregate(
      [
        otwarcie(["Gracz 1w", "Wilk 1w"], ["Wilk 1w", "Wróg 1m"]),
        cios("Wilk", "Gracz", [trafienie(300)], { targetHpPct: 70 }),
      ],
      [
        { id: 1, name: "Gracz", side: 0 },
        { id: 2, name: "Wilk", side: 0 },
        { id: 3, name: "Wilk", side: 1 },
        { id: 4, name: "Wróg", side: 1 },
      ],
    );
    const overlay = new Overlay();
    const shown = () => {
      overlay.render(stats);
      return [...overlay.shadow.querySelectorAll<HTMLElement>(".row")].map((r) => r.dataset.actor);
    };
    const team = (which: string) =>
      [...overlay.shadow.querySelectorAll("button")].find((b) => b.textContent === which)!.click();

    // Wilk #2 nie zrobił nic, a mimo to ma wiersz: stoi w składzie.
    expect(shown()).toEqual(["Wilk #1", "Gracz", "Wilk #2", "Wróg"]);

    team("My");
    expect(shown()).toEqual(["Gracz"]);
    team("Oni");
    expect(shown()).toEqual(["Wróg"]);
  });

  test("ostrzega o nierozpoznanych liniach", () => {
    const overlay = new Overlay();
    const stats = aggregate([nieznane("zupełnie nowa linia", 1), nieznane("inna nowa linia", 2)]);
    overlay.render(stats);

    expect(overlay.shadow.querySelector(".warn")?.textContent).toContain("2 nierozpoznane linie");
  });

  test("pokazuje komunikat, gdy nie ma danych", () => {
    const overlay = new Overlay();
    const empty = aggregate([]);
    overlay.render(empty);

    expect(overlay.shadow.querySelector(".empty")?.textContent).toContain("czekam na walkę");
  });


  test("wejście w postać przeżywa przebudowę wiersza między wciśnięciem a puszczeniem", async () => {
    // Podczas odtwarzania panel przebudowuje wiersze co klatkę. `click` gubi się
    // wtedy między pointerdown a pointerup (albo pada na trwały panel-body, gdzie
    // nie ma już `.row`). Drążenie jedzie więc na pointerup, dopasowane po nazwie
    // postaci — świeży węzeł tej samej postaci ma zadziałać tak samo.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats);

    const first = overlay.shadow.querySelector<HTMLElement>(".rows .row[data-actor]")!;
    const name = first.dataset.actor!;
    first.dispatchEvent(new Event("pointerdown", { bubbles: true }));

    // Klatka odtwarzania: te same dane, ale wiersze to już inne węzły.
    overlay.render(stats);
    const fresh = [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-actor]")].find(
      (row) => row.dataset.actor === name,
    )!;
    expect(fresh).not.toBe(first);
    fresh.dispatchEvent(new Event("pointerup", { bubbles: true }));

    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe(name);
  });

  test("puszczenie nad innym wierszem niż wciśnięcie nie drąży", async () => {
    // Ranking potrafi się przestawić w trakcie odtwarzania — puszczenie nad kimś
    // innym, niż się wcisnęło, nie może wejść w cudzą postać.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats);

    const list = [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-actor]")];
    list[0]!.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    list[1]!.dispatchEvent(new Event("pointerup", { bubbles: true }));

    expect(crumbVisible(overlay)).toBe(false);
  });




  test("trucizna bez sprawcy schodzi do postaci, w którą weszliśmy", async () => {
    // Cała reszta panelu mówi wtedy o jednej postaci, więc przypis mówiący
    // o całej stronie czytałby się jak jej liczba.
    // Żadna zmierzona walka nie ma DoT bez sprawcy — po drugiej stronie
    // stoi zawsze jeden przeciwnik, więc trucizna ma komu przypaść. Tu trzeba
    // otoczenia: przy trzech wrogach nie wiadomo, który zatruł.
    const stats = aggregate([
      otwarcie(["Gracz 1w"], ["A 1w", "B 1w", "C 1w"]),
      cios("Gracz", "A", [trafienie(100)], { sourceHpPct: 90, targetHpPct: 50 }),
      cios("A", "Gracz", [trafienie(40)], { targetHpPct: 90 }),
      tykniecie("Gracz", 80, 100, "trucizny"),
    ]);
    const poisoned = stats.actors.filter((a) => a.unattributedDotTaken > 0);
    expect(poisoned.length).toBeGreaterThan(0);

    const overlay = new Overlay();
    overlay.render(stats);
    const note = () =>
      [...overlay.shadow.querySelectorAll("footer .note")]
        .map((el) => el.textContent ?? "")
        .find((text) => text.startsWith("Tykające obrażenia bez sprawcy"));

    const whole = totalBySide(stats.unattributedDotDamage);
    expect(note()).toContain(number.format(whole));

    const victim = poisoned[0]!;
    [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-actor]")]
      .find((row) => row.dataset.actor === victim.name)!
      .click();
    // W widoku postaci zostaje jej własna liczba i sam rodzaj — podział na
    // strony nie ma tu sensu, bo strona jest jedna.
    expect(note()).toBe(
      `Tykające obrażenia bez sprawcy: ${number.format(victim.unattributedDotTaken)} (Trucizna)`,
    );

    // Powrót do składu przywraca liczbę całej walki.
    rightClick(overlay);
    expect(note()).toContain(number.format(whole));
  });

  test("sumy napastnika zgadzają się z sumą tego, czym uderzał", async () => {
    // Drążenie nie może zgubić ani dodać obrażeń: szczebel wyżej to dokładnie
    // suma szczebla niżej, a wszyscy napastnicy razem to `damageTaken`.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    for (const actor of stats.actors) {
      const fromAll = actor.takenFromBy.reduce((sum, one) => sum + one.amount, 0);
      expect([actor.name, fromAll]).toEqual([actor.name, actor.damageTaken]);
      for (const attacker of actor.takenFromBy) {
        const byAll = attacker.by.reduce((sum, one) => sum + one.amount, 0);
        expect([attacker.label, byAll]).toEqual([attacker.label, attacker.amount]);
      }
    }
  });




  test("dymek pozycji otrzymanej nie pokazuje użyć", async () => {
    // Po tej stronie etykieta znaczy "czyjś cios we mnie", a jedno użycie
    // umiejętności potrafi trafić kilka celów — liczba nie rozkłada się na nie.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats);
    [...overlay.shadow.querySelectorAll("button")]
      .find((b) => b.textContent === "Otrzymane")!
      .click();
    overlay.shadow.querySelector<HTMLElement>(".rows .row[data-actor]")!.click();
    overlay.shadow
      .querySelector<HTMLElement>(".rows .row[data-source]")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector<HTMLElement>(".tip")!;
    const labels = [...tip.querySelectorAll(".tip-stat-label")].map((el) => el.textContent);
    expect(labels).toContain("Ciosy");
    expect(labels).not.toContain("Użycia");
  });



  // Drugie wejście w to samo drążenie, od strony umiejętności. Odpowiada na
  // pytanie, którego lista celów nie umie zadać: "która akcja robi robotę",
  // bez względu na to, w kogo poszła.
  describe("drążenie przez umiejętność", () => {


    /** Wchodzi w postać, która biła kilka celów kilkoma umiejętnościami. */







    // Barwa idzie za TREŚCIĄ listy, nie za jej głębokością — a ta droga
    // odwraca kolejność szczebli względem drążenia przez cel.


    // Lustro po stronie przyjętych: "czym mnie bito", bez względu na to, kto.

  });

  test("wejście w postać trzyma się jej mimo przebudowy panelu", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats);
    overlay.shadow.querySelector<HTMLElement>(".row")!.click();

    // Kolejna porcja logu przebudowuje panel — widok ma zostać tam, gdzie był.
    overlay.render(stats);
    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe("Tancogniew Kazrek");
  });




  test("absorpcja celu nie jest liczona jako efekt napastnika", async () => {
    // "-Absorpcja 261 obrażeń fizycznych" to tarcza CELU. Pod napastnikiem
    // byłaby nie tą postacią, a jej wartość i tak siedzi w damageAbsorbed.
    // Absorpcja nie jest procem: siedzi w różnicy `raw - applied`, czyli
    // w `damageAbsorbed` CELU, i pod napastnikiem byłaby nie tą postacią.
    const stats = aggregate([
      otwarcie(["Gracz 1w"], ["Cel 1w"]),
      cios("Gracz", "Cel", [trafienie(500, 239)], { targetHpPct: 50 }),
    ]);
    expect(stats.actors.find((a) => a.name === "Gracz")!.procs).toEqual([]);
    expect(stats.actors.find((a) => a.name === "Cel")!.damageAbsorbed).toBe(500 - 239);
  });



  test("dymek znika, gdy postać wypada z rankingu", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats);

    overlay.shadow.querySelector(".row")!.dispatchEvent(new Event("pointerover", { bubbles: true }));
    const empty = aggregate([]);
    overlay.render(empty);

    expect(overlay.shadow.querySelector<HTMLElement>(".tip")!.hidden).toBe(true);
  });

  test("zapamiętuje pozycję i zwinięcie", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };

    const overlay = new Overlay({ storage });
    const empty = aggregate([]);
    overlay.render(empty);
    overlay.shadow
      .querySelector<HTMLButtonElement>('header button[data-action="collapse"]')!
      .click();

    expect(JSON.parse(store.get("margometer.panel")!).collapsed).toBe(true);

    const restored = new Overlay({ storage });
    restored.render(empty);
    expect(restored.shadow.querySelector(".panel")!.className).toContain("collapsed");
  });

  test("przeciąganie przeżywa przebudowę panelu i zapisuje pozycję", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };

    const overlay = new Overlay({ storage });
    const empty = aggregate([]);
    overlay.render(empty);

    const header = overlay.shadow.querySelector<HTMLElement>("header")!;
    const at = (type: string, x: number, y: number) =>
      Object.assign(new Event(type, { bubbles: true }), { clientX: x, clientY: y, pointerId: 1 });

    header.dispatchEvent(at("pointerdown", 100, 100));
    // W ŚRODKU przeciągania dochodzi linia logu i panel się przebudowuje. Gdy
    // nagłówek powstawał od nowa, listenery zostawały na odłączonym węźle: ruch
    // zastygał, a `pointerup` (a z nim zapis) nigdy nie padał.
    overlay.render(empty);
    expect(overlay.shadow.querySelector("header")).toBe(header);

    header.dispatchEvent(at("pointermove", 140, 160));
    header.dispatchEvent(at("pointerup", 140, 160));

    // Start 16/16, chwyt w 100/100 → przesunięcie o 40/60.
    const host = overlay.shadow.host as HTMLElement;
    expect([host.style.left, host.style.top]).toEqual(["56px", "76px"]);

    const saved = JSON.parse(store.get("margometer.panel")!);
    expect([saved.x, saved.y]).toEqual([56, 76]);

    // Pozycja przeżywa odświeżenie strony.
    const restored = new Overlay({ storage });
    restored.render(empty);
    const rhost = restored.shadow.host as HTMLElement;
    expect([rhost.style.left, rhost.style.top]).toEqual(["56px", "76px"]);
  });

  test("panel ma sufit wysokości, więc lista nie schodzi poniżej ekranu", () => {
    // Bez sufitu okno rosło z treścią: trzydzieści postaci to ~700 px samej
    // listy, a przy panelu postawionym niżej dolne wiersze były nieklikalne.
    const overlay = new Overlay();
    const empty = aggregate([]);
    overlay.render(empty);

    const panel = overlay.shadow.querySelector<HTMLElement>(".panel")!;
    // Domyślna pozycja to 16 px od góry, 8 px luzu do dolnej krawędzi.
    expect(panel.style.maxHeight).toBe(`${window.innerHeight - 16 - 8}px`);

    // Sufit jedzie z oknem: im niżej stoi, tym mniej mu zostaje.
    const header = overlay.shadow.querySelector<HTMLElement>("header")!;
    const at = (type: string, x: number, y: number) =>
      Object.assign(new Event(type, { bubbles: true }), { clientX: x, clientY: y, pointerId: 1 });
    header.dispatchEvent(at("pointerdown", 20, 20));
    header.dispatchEvent(at("pointermove", 20, 604));
    header.dispatchEvent(at("pointerup", 20, 604));

    expect(panel.style.maxHeight).toBe(`${window.innerHeight - 600 - 8}px`);
  });

  test("uchwyt zmienia i zapamiętuje rozmiar okna", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };

    const overlay = new Overlay({ storage });
    const empty = aggregate([]);
    overlay.render(empty);

    const grip = overlay.shadow.querySelector<HTMLElement>(".resize-grip")!;
    const at = (type: string, x: number, y: number) =>
      Object.assign(new Event(type, { bubbles: true }), { clientX: x, clientY: y, pointerId: 1 });
    grip.dispatchEvent(at("pointerdown", 100, 100));
    grip.dispatchEvent(at("pointermove", 160, 300));
    grip.dispatchEvent(at("pointerup", 160, 300));

    // Szerokość: 260 (domyślna) + 60. Wysokość: start 0 (jsdom bez layoutu) + 200.
    const panel = overlay.shadow.querySelector<HTMLElement>(".panel")!;
    expect(panel.style.width).toBe("320px");
    expect(panel.style.height).toBe("200px");

    const saved = JSON.parse(store.get("margometer.panel")!);
    expect(saved.width).toBe(320);
    expect(saved.height).toBe(200);

    // Rozmiar przeżywa nowy overlay z tego samego storage.
    const restored = new Overlay({ storage });
    restored.render(empty);
    const rpanel = restored.shadow.querySelector<HTMLElement>(".panel")!;
    expect(rpanel.style.width).toBe("320px");
    expect(rpanel.style.height).toBe("200px");
  });
});

describe("pozycja dymka", () => {
  // Panel i dymek mają po 260px, odstęp 8px — te same stałe co w overlayu.
  const box = {
    panelWidth: 260,
    tipWidth: 260,
    tipHeight: 200,
    gap: 8,
    viewportWidth: 1000,
    viewportHeight: 800,
  };

  test("domyślnie stoi po prawej stronie panelu", () => {
    expect(tipPosition({ ...box, hostLeft: 100, rowTop: 300 })).toEqual({
      left: 100 + 260 + 8,
      top: 300,
    });
  });

  test("przeskakuje na lewo, gdy po prawej nie ma miejsca", () => {
    // 700 + 260 + 8 + 260 + 8 > 1000, więc w prawo się nie mieści.
    expect(tipPosition({ ...box, hostLeft: 700, rowTop: 300 }).left).toBe(700 - 260 - 8);
  });

  test("nie wyjeżdża w lewo, gdy panel stoi przy lewej krawędzi", () => {
    // Panel przy lewej i okno za wąskie na dymek po prawej: przeskok w lewo
    // dałby -268, więc dymek musi zostać dosunięty do krawędzi.
    const position = tipPosition({
      ...box,
      hostLeft: 4,
      rowTop: 300,
      viewportWidth: 500,
    });
    expect(position.left).toBe(8);
  });

  test("nie wyjeżdża w prawo, gdy panel stoi przy prawej krawędzi", () => {
    const position = tipPosition({ ...box, hostLeft: 980, rowTop: 300 });
    expect(position.left).toBeGreaterThanOrEqual(8);
    expect(position.left + box.tipWidth).toBeLessThanOrEqual(box.viewportWidth - 8);
  });

  test("nie wyjeżdża poniżej dolnej krawędzi", () => {
    // Wiersz nisko, a dymek wysoki — 780 + 200 nie zmieści się w 800.
    const position = tipPosition({ ...box, hostLeft: 100, rowTop: 780 });
    expect(position.top).toBe(800 - 200 - 8);
    expect(position.top + box.tipHeight).toBeLessThanOrEqual(box.viewportHeight - 8);
  });

  test("nie wyjeżdża ponad górną krawędź", () => {
    expect(tipPosition({ ...box, hostLeft: 100, rowTop: -50 }).top).toBe(8);
  });

  test("dymek wyższy od okna trzyma się górnej krawędzi", () => {
    // Przycięcie od dołu dałoby wartość mniejszą niż margines — wtedy ważniejsze
    // jest, żeby widać było początek dymka, a nie jego koniec.
    const position = tipPosition({
      ...box,
      hostLeft: 100,
      rowTop: 300,
      tipHeight: 900,
      viewportHeight: 500,
    });
    expect(position.top).toBe(8);
  });
});

describe("efekty: kto wyzwolił kontra na kim się odpalił", () => {
  const walka = [
    otwarcie(["Gracz 1w"], ["Szaman 1m"]),
    cios("Szaman", "Gracz", [trafienie(536, 261)], {
      targetHpPct: 98,
      procs: ["Oślepienie w następnej turze"],
    }),
  ];

  test("efekt liczy się u tego, kto go ma w eq, nie u ofiary", () => {
    const stats = aggregate(walka);
    const szaman = stats.actors.find((a) => a.name === "Szaman")!;
    const gracz = stats.actors.find((a) => a.name === "Gracz")!;

    // Oślepienie odpaliło się z ekwipunku szamana — to jego licznik.
    expect(szaman.procs).toEqual([{ label: "Oślepienie w następnej turze", count: 1 }]);
    expect(gracz.procs).toEqual([]);
  });

  test("ofiara ma osobny licznik tego, co się na niej odpaliło", () => {
    const stats = aggregate(walka);
    const szaman = stats.actors.find((a) => a.name === "Szaman")!;
    const gracz = stats.actors.find((a) => a.name === "Gracz")!;

    // To samo zdarzenie z drugiej strony — dwa różne pytania, dwie liczby.
    expect(gracz.procsReceived).toEqual([{ label: "Oślepienie w następnej turze", count: 1 }]);
    expect(szaman.procsReceived).toEqual([]);
  });

  test("dymek pokazuje obie sekcje osobno", () => {
    const stats = aggregate(walka);
    const overlay = new Overlay();
    overlay.render(stats);
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "Gracz")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector(".tip")!;
    const headings = [...tip.querySelectorAll(".tip-heading")].map((el) => el.textContent);
    // Gracz nic nie wyzwolił, więc ma tylko sekcję otrzymanych.
    expect(headings).toContain("Efekty otrzymane");
    expect(headings).not.toContain("Efekty w ciosach");
  });
});

describe("nagłówek stron i tempo", () => {
  const statsFrom = async (name: string) => aggregate(readEvents(name));
  const perTurnButton = (overlay: Overlay) =>
    [...overlay.shadow.querySelectorAll("button")].find((b) => b.textContent === "na turę")!;

  test("nagłówek sumuje obie strony i dzieli pasek proporcjonalnie", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats);

    const mine = stats.actors
      .filter((a) => a.side === 0)
      .reduce((sum, a) => sum + a.damageDealt, 0);
    const enemy = stats.actors
      .filter((a) => a.side !== null && a.side !== 0)
      .reduce((sum, a) => sum + a.damageDealt, 0);

    expect(overlay.shadow.querySelector(".side-mine")?.textContent).toBe(
      `${number.format(mine)} my`,
    );
    expect(overlay.shadow.querySelector(".side-enemy")?.textContent).toBe(
      `${number.format(enemy)} oni`,
    );

    const fill = overlay.shadow.querySelector<HTMLElement>(".fill-mine")!;
    expect(fill.style.width).toBe(`${(mine / (mine + enemy)) * 100}%`);
  });


  test("trucizna bez sprawcy idzie za filtrem składu", () => {
    // Sprawcy log nie podaje (po drugiej stronie stoi trzech), ale ofiarę tak —
    // więc przypis ma mówić o tej stronie, którą właśnie widać.
    const stats = aggregate([
      otwarcie(["Gracz 1w"], ["A 1w", "B 1w", "C 1w"]),
      tykniecie("Gracz", 50, 100, "trucizny"),
    ]);
    const overlay = new Overlay();
    overlay.render(stats);
    const note = () =>
      [...overlay.shadow.querySelectorAll("footer .note")]
        .map((el) => el.textContent)
        .find((text) => text?.startsWith("Tykające obrażenia"));

    // Przy "Wszyscy" suma plus rozbicie — sama liczba nie mówi, kogo to boli.
    expect(note()).toBe("Tykające obrażenia bez sprawcy: 100 (Trucizna · my 100 · oni 0)");

    [...overlay.shadow.querySelectorAll("button")].find((b) => b.textContent === "Oni")!.click();
    // Truciznę oberwał gracz, nie oni — przy "Oni" przypis nie ma o czym mówić.
    expect(note()).toBeUndefined();

    [...overlay.shadow.querySelectorAll("button")].find((b) => b.textContent === "My")!.click();
    expect(note()).toBe("Tykające obrażenia bez sprawcy: 100 (Trucizna)");
  });

  /**
   * Lustro testu wyżej po drugiej stronie bilansu. Leczenie bez leczącego było
   * JEDNĄ liczbą, więc filtr składu pokazywał tę samą kwotę przy „My" i przy
   * „Oni" — a leczono tylko jedną stronę.
   */
  test("leczenie bez sprawcy też idzie za filtrem składu", () => {
    const stats = aggregate([
      otwarcie(["Gracz 1w"], ["Wilk 1w"]),
      leczenie("Gracz", 700, { targetHpPct: 90 }),
    ]);
    const overlay = new Overlay();
    overlay.render(stats);
    const note = () =>
      [...overlay.shadow.querySelectorAll("footer .note")]
        .map((el) => el.textContent)
        .find((text) => text?.startsWith("Leczenie bez sprawcy"));

    expect(note()).toBe("Leczenie bez sprawcy: 700 (my 700 · oni 0)");

    metricButton(overlay, "Oni").click();
    expect(note()).toBeUndefined();

    metricButton(overlay, "My").click();
    expect(note()).toBe("Leczenie bez sprawcy: 700");

    // I schodzi razem z widokiem: w postaci przypis mówi o NIEJ, zamiast
    // znikać, choć to ona tę kwotę dostała.
    overlay.shadow.querySelector<HTMLElement>(".rows .row[data-actor]")!.click();
    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe("Gracz");
    expect(note()).toBe("Leczenie bez sprawcy: 700");
  });

  test("nie ma nagłówka, gdy log nie dał podziału na strony", () => {
    const overlay = new Overlay();
    overlay.render(EMPTY_STATS);
    expect(overlay.shadow.querySelector(".sides")).toBeNull();
  });

  test("dymek mówi, co jest dzielnikiem trybu na turę", async () => {
    // Zadane dzielą się przez tury WŁASNE, przyjęte przez tury WALKI, a wiersz
    // podpisuje oba tym samym „/t" — bez tego przełączenie zakładki zmieniało
    // skalę liczby o rząd wielkości bez żadnego sygnału.
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats);
    perTurnButton(overlay).click();

    const generalNote = () =>
      [...overlay.shadow.querySelectorAll(".tip-note")].map((el) => el.textContent);
    const sourceLabels = () =>
      [...overlay.shadow.querySelectorAll(".tip-stat-label")].map((el) => el.textContent);

    // Dymek postaci: jedno zdanie o obu dzielnikach, bo pokazuje trzy metryki naraz.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "Tancogniew Kazrek")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));
    expect(generalNote().join(" ")).toContain("zadane na turę własną");

    // Wewnątrz postaci metryka jest jedna, więc dymek pozycji nazywa dzielnik wprost.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "Tancogniew Kazrek")!
      .click();
    overlay.shadow
      .querySelector<HTMLElement>(".row[data-source]")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));
    expect(sourceLabels()).toContain("Na turę własną");

    // Ta sama pozycja przy obrażeniach przyjętych dzieli się przez tury walki.
    [...overlay.shadow.querySelectorAll("button")]
      .find((b) => b.textContent === "Otrzymane")!
      .click();
    overlay.shadow
      .querySelector<HTMLElement>(".row[data-source]")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));
    expect(sourceLabels()).toContain("Na turę walki");
  });

  test("pasek stron przy zerowej sumie zostaje pusty, nie na pół", () => {
    // Skład jest, walka jeszcze się nie zaczęła. 50/50 czytało się jak remis.
    const stats = aggregate([otwarcie(["Gracz 1w"], ["Wilk 1w"])]);
    const overlay = new Overlay();
    overlay.render(stats);

    const fills = [...overlay.shadow.querySelectorAll<HTMLElement>(".sides-track > span")];
    expect(fills.map((fill) => fill.style.width)).toEqual(["0%", "0%"]);
  });


  test("dymek liczy w tym samym trybie co wiersz, a tury zostają surowe", async () => {
    // Dymek pokazywał sumy niezależnie od przełącznika, więc ta sama postać
    // miała w wierszu tempo, a w dymku sumę — i nic nie mówiło, że to dwie
    // miary tej samej rzeczy.
    const stats = await statsFrom("new-engine/2026-07-18_wojownik-vs-druzyna-umiejetnosci");
    const actor = stats.actors.find((a) => a.turns > 1 && a.damageDealt > 0)!;
    const fightTurns = stats.timeline.length;

    const overlay = new Overlay();
    overlay.render(stats);
    perTurnButton(overlay).click();
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === actor.name)!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector(".tip")!;
    const stat = (label: string) =>
      [...tip.querySelectorAll(".tip-stat")]
        .find((row) => row.querySelector(".tip-stat-label")?.textContent === label)
        ?.querySelector(".tip-stat-value")?.textContent;

    // Każda metryka swoim dzielnikiem: zadane przez tury własne, przyjęte przez
    // tury walki — tak samo jak po kliknięciu w jej zakładkę.
    expect(stat("Zadane")).toBe(`${rate.format(actor.damageDealt / actor.turns)}/t`);
    expect(stat("Otrzymane")).toBe(`${rate.format(actor.damageTaken / fightTurns)}/t`);

    // Mianownik zostaje sobą: tury na turę to z definicji 1.
    expect(stat("Tury")).toBe(`${actor.turns}`);
  });





});

describe("oś tur", () => {
  const statsFrom = async (name: string) => aggregate(readEvents(name));

  test("oś tur rozkłada dokładnie tyle obrażeń, ile padło w walce", async () => {
    // Niezmiennik: oś to inny przekrój tych samych obrażeń, nie druga pula.
    for (const name of [
      "new-engine/2026-07-18_tancerz-vs-tropiciel-pvp",
      "new-engine/2026-07-18_wojownik-vs-druzyna-umiejetnosci",
      "new-engine/2026-07-18_lowca-vs-druzyna",
    ]) {
      const stats = await statsFrom(name);
      const onAxis = stats.timeline.reduce((sum, slice) => sum + slice.damage, 0);
      const dealt =
        stats.actors.reduce((sum, a) => sum + a.damageDealt, 0) + totalBySide(stats.unattributedDotDamage);
      expect(onAxis).toBe(dealt);
    }
  });




  // Skupienie ognia ("ogień na" / "obrywa") jest ODŁĄCZONE od renderu do czasu
  // przemyślenia układu — patrz komentarz przy renderFocus. Test pilnuje, że
  // sekcja faktycznie nie wchodzi do panelu; treść linijek sprawdzi test
  // przywrócony razem z funkcją.
  test("generator syntetyczny nie produkuje ciosów niemożliwych w grze", () => {
    // Podgląd stał na `strikes` per postać, przez co tancerz wypuszczał trzy
    // bloki na każdą akcję i "Rozpraszający atak" pokazywał 3 użycia przy
    // 9 ciosach. W zmierzonych prawdziwych walkach rekord to 2 ciosy na użycie
    // ("Podwójne trafienie"), a zwykły atak nigdy nie przekracza jednego.
    const stats = aggregate(syntheticFight(20));

    for (const actor of stats.actors) {
      const hits = new Map(actor.dealtBy.map((source) => [source.label, source.hits]));
      for (const use of actor.abilityUses) {
        const perUse = (hits.get(use.label) ?? 0) / use.count;
        expect([actor.name, use.label, perUse <= 2]).toEqual([actor.name, use.label, true]);
        if (use.label === "Zwykły atak") {
          expect([actor.name, perUse <= 1]).toEqual([actor.name, true]);
        }
      }
    }

    // Wielotrafienie ma nadal WYSTĘPOWAĆ — inaczej podgląd przestałby pokazywać
    // rozjazd użyć do ciosów, czyli to, po co ten licznik powstał.
    const multi = stats.actors.flatMap((actor) => {
      const hits = new Map(actor.dealtBy.map((source) => [source.label, source.hits]));
      return actor.abilityUses.filter((use) => (hits.get(use.label) ?? 0) > use.count);
    });
    expect(multi.length).toBeGreaterThan(0);
  });

  test("lista pokazuje cały skład naraz, bez zwijania i bez sekcji stron", () => {
    const stats = aggregate(syntheticFight(20));
    const overlay = new Overlay();
    overlay.render(stats);

    // Dwadzieścia postaci to dwadzieścia wierszy — nic nie chowa się pod "jeszcze N".
    expect(overlay.shadow.querySelectorAll(".rows .row")).toHaveLength(20);
    // "Wszyscy" to jeden wspólny ranking, więc nagłówków stron w liście nie ma.
    expect(overlay.shadow.querySelector(".rows .side-head")).toBeNull();

    // Kolejność jest czysto malejąca — strony nie grupują listy.
    const order = [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row")].map(
      (row) => row.dataset.actor,
    );
    const expected = [...stats.actors]
      .sort((a, b) => b.damageDealt - a.damageDealt || a.name.localeCompare(b.name, "pl"))
      .map((actor) => actor.name);
    expect(order).toEqual(expected);
  });

  test("udziały sumują się do 100% w obrębie całej listy", () => {
    const stats = aggregate(syntheticFight(4));
    const overlay = new Overlay();
    overlay.render(stats);

    const rows = [...overlay.shadow.querySelectorAll(".row")];
    const shares = rows.map((r) => parseInt(shareOf(r)!, 10));
    // Zaokrąglenie do pełnych procent potrafi zjeść albo dołożyć punkt.
    expect(Math.abs(shares.reduce((a, b) => a + b, 0) - 100)).toBeLessThanOrEqual(2);

    // Pasek mierzy wobec lidera: pełną szerokość ma dokładnie jeden wiersz.
    const widths = rows.map((r) => parseFloat((r.querySelector(".bar") as HTMLElement).style.width));
    expect(widths.filter((w) => w === 100)).toHaveLength(1);
  });
});

describe("kopiowanie i nagrywanie", () => {
  /** Nagrywarka w pamięci — overlay ma znać tylko ten interfejs. */
  const fakeRecorder = (overrides: Partial<RecorderControl> = {}) => {
    const state = { on: false, fights: 2, cleared: false, toggles: 0 };
    const control: RecorderControl = {
      isRecording: () => state.on,
      toggle: () => {
        state.on = !state.on;
        state.toggles += 1;
      },
      count: () => state.fights,
      chars: () => 5000,
      dump: () => "=== walka 1 ===\nRozpoczęła się walka pomiędzy A(1w) a B(1x)",
      clear: () => {
        state.cleared = true;
        state.fights = 0;
      },
      isFailed: () => false,
      ...overrides,
    };
    return { control, state };
  };

  const button = (overlay: Overlay, action: string) =>
    overlay.shadow.querySelector<HTMLElement>(`button[data-action="${action}"]`);

  test("kopiuje statystyki walki jako JSON", async () => {
    const stats = aggregate(syntheticFight(4));
    let copied = "";
    const overlay = new Overlay({ clipboard: (text) => void (copied = text) });
    overlay.render(stats);

    button(overlay, "copy-stats")!.click();
    await Promise.resolve();

    const parsed = JSON.parse(copied);
    expect(parsed.tool).toBe("MargoMeter");
    // Kopiujemy pełne statystyki, nie widok — filtry i drążenie nie mają tu wpływu.
    expect(parsed.fight.actors).toHaveLength(stats.actors.length);
    expect(parsed.fight.actors[0].damageDealt).toBe(stats.actors[0]!.damageDealt);
    // Klucza `session` NIE MA i ma nie wrócić. Stała tu suma wszystkich walk —
    // jedyne wyjście sumy sesji do użytkownika, zdjęte razem z nią (`AUDYT‑6`).
    // Asercja na NIEOBECNOŚĆ, bo `parsed.session` byłoby `undefined` i tak,
    // gdyby ktoś wstawił klucz z inną nazwą.
    expect(Object.keys(parsed)).not.toContain("session");
  });

  test("skopiowany JSON mówi, z której wersji pochodzi", async () => {
    // Od 0.3.0 dodatek aktualizuje się sam, a README prosi wprost o przysyłanie
    // logów z zepsutych walk. Zgłoszenie bez wersji nie daje się uszeregować:
    // nie wiadomo, czy dotyczy czegoś, co już jest naprawione.
    const stats = aggregate(syntheticFight(2));
    let copied = "";
    const overlay = new Overlay({ clipboard: (text) => void (copied = text) });
    overlay.render(stats);

    button(overlay, "copy-stats")!.click();
    await Promise.resolve();

    // Porównanie z `package.json`, nie z literałem: literał trzeba byłoby
    // poprawiać przy każdym wydaniu, a zapomniana poprawka daje zielony test
    // pilnujący nieprawdy.
    expect(JSON.parse(copied).version).toBe(pkg.version);
  });

  test("nagłówek pokazuje wersję, a nazwa zostaje samą nazwą", () => {
    // Zgłoszenia przychodzą zrzutem ekranu równie często jak JSON-em, więc numer
    // musi być WIDOCZNY. Druga asercja pilnuje lekcji z `AUDYT-14`: dołożony
    // węzeł potrafi po cichu zmienić `textContent` sąsiada i psuje odczyty nazw.
    const overlay = new Overlay({});
    overlay.render(EMPTY_STATS);

    expect(overlay.shadow.querySelector(".version")?.textContent).toBe(`v${pkg.version}`);
    expect(overlay.shadow.querySelector(".title")?.textContent).toBe("MargoMeter");
  });

  test("kopiowanie potwierdza się w przycisku i wraca do ikony", async () => {
    const stats = aggregate(syntheticFight(2));
    const overlay = new Overlay({ clipboard: () => {} });
    overlay.render(stats);

    button(overlay, "copy-stats")!.click();
    await Promise.resolve();
    expect(button(overlay, "copy-stats")!.textContent).toBe("✓");

    await new Promise((resolve) => setTimeout(resolve, 1600));
    expect(button(overlay, "copy-stats")!.textContent).toBe("⧉");
  });

  test("odmowa schowka nie udaje sukcesu", async () => {
    const stats = aggregate(syntheticFight(2));
    const overlay = new Overlay({
      clipboard: () => {
        throw new Error("brak uprawnienia");
      },
    });
    overlay.render(stats);

    button(overlay, "copy-stats")!.click();
    await Promise.resolve();

    expect(button(overlay, "copy-stats")!.textContent).toBe("✕");
  });

  // `execCommand("copy")` przy odmowie ZWRACA `false`, a nie rzuca — wartość
  // szła dotąd w próżnię, więc panel migał „✓" nad pustym schowkiem.
  test("zapasowa droga do schowka też nie udaje sukcesu", async () => {
    const stats = aggregate(syntheticFight(2));
    const execCommand = (document as unknown as { execCommand?: unknown }).execCommand;
    (document as unknown as { execCommand: unknown }).execCommand = () => false;
    // Bez wstrzykniętego schowka idzie prawdziwa ścieżka: `navigator.clipboard`
    // w jsdom nie istnieje, więc spada do `execCommand`.
    const overlay = new Overlay();
    overlay.render(stats);

    try {
      button(overlay, "copy-stats")!.click();
      await Promise.resolve();
      await Promise.resolve();
      expect(button(overlay, "copy-stats")!.textContent).toBe("✕");
    } finally {
      (document as unknown as { execCommand?: unknown }).execCommand = execCommand;
    }
  });

  // `dump()` zwraca null, gdy indeks obiecuje nagrania, których pod kluczami
  // już nie ma. Wcześniej szło `?? ""` — pusty schowek i „✓".
  test("kopiowanie logów bez logów melduje porażkę, nie sukces", async () => {
    const stats = aggregate(syntheticFight(2));
    let copied: string | null = null;
    const { control } = fakeRecorder({ dump: () => null });
    const overlay = new Overlay({
      recorder: control,
      clipboard: (text) => void (copied = text),
    });
    overlay.render(stats);

    button(overlay, "copy-logs")!.click();
    await Promise.resolve();

    expect(button(overlay, "copy-logs")!.textContent).toBe("✕");
    expect(copied).toBeNull();
  });

  // Wygaśnięcie było dotąd czysto obliczeniowe: na przycisku zostawało „na
  // pewno?", a klik w niego trafiał w pytanie nieaktywne i po cichu uzbrajał je
  // od nowa. Z ekranu nic się nie zmieniało, więc przycisk wyglądał na zepsuty
  // dokładnie w chwili, w której jest najbardziej niebezpieczny.
  describe("potwierdzenie kasowania wygasa WIDOCZNIE", () => {
    const armed = () => {
      const stats = aggregate(syntheticFight(2));
      const ticker = new ManualTicker();
      let clock = 1_000;
      const { control, state } = fakeRecorder();
      const overlay = new Overlay({ recorder: control, ticker, now: () => clock });
      overlay.render(stats);
      button(overlay, "clear-recordings")!.click();
      return { overlay, ticker, state, advance: (ms: number) => void (clock += ms) };
    };

    test("pierwszy klik tylko pyta", () => {
      const { overlay, state } = armed();
      expect(button(overlay, "clear-recordings")!.textContent).toBe("na pewno?");
      expect(state.cleared).toBe(false);
    });

    test("etykieta dla czytnika idzie za stanem, nie za samym napisem", () => {
      const { overlay } = armed();
      expect(button(overlay, "clear-recordings")!.getAttribute("aria-label")).toBe(
        "Potwierdź usunięcie nagrań",
      );
    });

    test("drugi klik kasuje", () => {
      const { overlay, state } = armed();
      button(overlay, "clear-recordings")!.click();
      expect(state.cleared).toBe(true);
      // Pasek nagrywania znika razem z ostatnim nagraniem — nie ma już czego
      // pokazywać, więc i przycisku nie ma.
      expect(button(overlay, "clear-recordings")).toBeNull();
    });

    test("po wygaśnięciu przycisk SAM wraca do „wyczyść”", () => {
      const { overlay, ticker, advance } = armed();

      advance(6_000);
      ticker.tick();

      expect(button(overlay, "clear-recordings")!.textContent).toBe("wyczyść");
      expect(button(overlay, "clear-recordings")!.getAttribute("aria-label")).toBe("Usuń nagrania");
    });

    test("klik po wygaśnięciu pyta od nowa, a nie kasuje", () => {
      const { overlay, ticker, state, advance } = armed();
      advance(6_000);
      ticker.tick();

      button(overlay, "clear-recordings")!.click();

      expect(state.cleared).toBe(false);
      expect(button(overlay, "clear-recordings")!.textContent).toBe("na pewno?");
    });

    test("wyłączenie nagrywania zdejmuje otwarte pytanie", () => {
      const { overlay } = armed();
      button(overlay, "record")!.click();
      expect(button(overlay, "clear-recordings")?.textContent).not.toBe("na pewno?");
    });
  });

  test("bez nagrywarki nie ma ani przycisku, ani paska", () => {
    const stats = aggregate(syntheticFight(2));
    const overlay = new Overlay();
    overlay.render(stats);

    expect(button(overlay, "record")).toBeNull();
    expect(overlay.shadow.querySelector(".rec-bar")).toBeNull();
  });

  test("przycisk nagrywania przełącza stan i pokazuje go", () => {
    const stats = aggregate(syntheticFight(2));
    const { control, state } = fakeRecorder();
    const overlay = new Overlay({ recorder: control });
    overlay.render(stats);

    expect(button(overlay, "record")!.getAttribute("aria-pressed")).toBe("false");
    button(overlay, "record")!.click();

    expect(state.toggles).toBe(1);
    expect(button(overlay, "record")!.getAttribute("aria-pressed")).toBe("true");
    expect(button(overlay, "record")!.className).toContain("is-on");
  });

  test("pasek podaje liczbę nagranych walk i zajętość", () => {
    const stats = aggregate(syntheticFight(2));
    const { control } = fakeRecorder();
    const overlay = new Overlay({ recorder: control });
    overlay.render(stats);

    // 5000 znaków to ~10 kB, bo przeglądarka liczy po dwa bajty na znak.
    expect(overlay.shadow.querySelector(".rec-bar .grow")!.textContent).toBe("2 walki · 10 kB");
  });

  test("licznik walk odmienia się poprawnie", () => {
    const stats = aggregate(syntheticFight(2));
    const word = (count: number) => {
      const { control } = fakeRecorder({ count: () => count });
      const overlay = new Overlay({ recorder: control });
      overlay.render(stats);
      return overlay.shadow.querySelector(".rec-bar .grow")!.textContent!.split(" · ")[0];
    };

    expect(word(1)).toBe("1 walka");
    expect(word(2)).toBe("2 walki");
    expect(word(4)).toBe("4 walki");
    // Dopełniacz od "walka" to "walk", nie "walek" — "walek" jest od "wałek".
    expect(word(5)).toBe("5 walk");
    expect(word(21)).toBe("21 walk");
    // Nastki idą jak 5-20, mimo końcówki 2-4: "12 walk", nie "12 walki".
    expect(word(12)).toBe("12 walk");
    expect(word(13)).toBe("13 walk");
    expect(word(22)).toBe("22 walki");
    expect(word(112)).toBe("112 walk");
  });

  test("pasek znika, gdy nie ma nagrań ani nagrywania", () => {
    const stats = aggregate(syntheticFight(2));
    const { control } = fakeRecorder({ count: () => 0 });
    const overlay = new Overlay({ recorder: control });
    overlay.render(stats);

    expect(overlay.shadow.querySelector(".rec-bar")).toBeNull();
  });

  test("kopiuje nagrane logi, nie statystyki", async () => {
    const stats = aggregate(syntheticFight(2));
    const { control } = fakeRecorder();
    let copied = "";
    const overlay = new Overlay({ recorder: control, clipboard: (text) => void (copied = text) });
    overlay.render(stats);

    button(overlay, "copy-logs")!.click();
    await Promise.resolve();

    expect(copied).toContain("Rozpoczęła się walka pomiędzy");
    expect(copied).not.toContain("MargoMeter");
  });

  test("czyszczenie nagrań wymaga potwierdzenia", () => {
    const stats = aggregate(syntheticFight(2));
    const { control, state } = fakeRecorder();
    const overlay = new Overlay({ recorder: control });
    overlay.render(stats);

    button(overlay, "clear-recordings")!.click();
    expect(state.cleared).toBe(false);
    expect(button(overlay, "clear-recordings")!.textContent).toBe("na pewno?");

    button(overlay, "clear-recordings")!.click();
    expect(state.cleared).toBe(true);
    // Nagrań nie ma, więc pasek gaśnie razem z nimi.
    expect(overlay.shadow.querySelector(".rec-bar")).toBeNull();
  });

  test("brak miejsca w magazynie widać w pasku", () => {
    const stats = aggregate(syntheticFight(2));
    const { control } = fakeRecorder({ isFailed: () => true, count: () => 0 });
    const overlay = new Overlay({ recorder: control });
    overlay.render(stats);

    expect(overlay.shadow.querySelector(".rec-bar")!.textContent).toContain("Brak miejsca");
    expect(overlay.shadow.querySelector(".rec-bar")!.className).toContain("warn");
  });

  test("oba komunikaty paska zaczynają się tak samo — wielką literą", () => {
    // AUDYT-17: jeden element niósł raz „nagrywam…", raz „Brak miejsca…".
    // Ta sama szczelina, dwie konwencje — czyta się jak literówka (`UX.md §1.6`).
    const stats = aggregate(syntheticFight(2));
    const message = (failed: boolean) => {
      const { control } = fakeRecorder({
        isFailed: () => failed,
        isRecording: () => !failed,
        count: () => 0,
      });
      const overlay = new Overlay({ recorder: control });
      overlay.render(stats);
      return overlay.shadow.querySelector(".rec-bar .grow")!.textContent!;
    };

    for (const text of [message(false), message(true)]) {
      expect(text[0]).toBe(text[0]!.toUpperCase());
    }
  });
});

// Zapisywała się dotąd sama geometria, przez co panel wyglądał na zapamiętany
// — stał tam, gdzie się go postawiło — a widok w środku wracał do domyślnego.
describe("ustawienia widoku przeżywają odświeżenie", () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  };
  const load = async () => aggregate(readEvents("new-engine/2026-07-18_lowca-vs-druzyna"));

  beforeEach(() => store.clear());

  test("metryka, skład i „na turę” wracają po F5", async () => {
    const stats = await load();
    const first = new Overlay({ storage });
    first.render(stats);
    first.shadow.querySelector<HTMLElement>('[data-action="metric-damageTaken"]')!.click();
    first.shadow.querySelector<HTMLElement>('[data-action="team-enemy"]')!.click();
    first.shadow.querySelector<HTMLElement>('[data-action="per-turn"]')!.click();

    const second = new Overlay({ storage });
    second.render(stats);

    const pressed = (overlay: Overlay, action: string) =>
      overlay.shadow.querySelector(`[data-action="${action}"]`)?.getAttribute("aria-pressed");
    expect(pressed(second, "metric-damageTaken")).toBe("true");
    expect(pressed(second, "team-enemy")).toBe("true");
    expect(pressed(second, "per-turn")).toBe("true");
  });

  test("wejście w postać świadomie NIE wraca — tamtej walki już nie ma", async () => {
    const stats = await load();
    const first = new Overlay({ storage });
    first.render(stats);
    first.shadow.querySelector<HTMLElement>(".row")!.click();
    expect(crumbVisible(first)).toBe(true);

    const second = new Overlay({ storage });
    second.render(stats);

    expect(crumbVisible(second)).toBe(false);
  });

  test("zapis z nieznaną metryką nie wywraca panelu", async () => {
    const stats = await load();
    store.set("margometer.panel", JSON.stringify({ metric: "czegoTakiegoNieMa", team: "obcy" }));

    const overlay = new Overlay({ storage });
    overlay.render(stats);

    const pressed = (action: string) =>
      overlay.shadow.querySelector(`[data-action="${action}"]`)?.getAttribute("aria-pressed");
    expect(pressed("metric-damageDealt")).toBe("true");
    expect(pressed("team-all")).toBe("true");
  });

  test("zapis z metryką „Tury” wraca do domyślnej, a nie do pustej listy", async () => {
    // `"turns"` była wartością typu `Metric` do 2026‑08‑03, choć `METRICS` nigdy
    // jej nie wystawiał — czyli z UI nie dało się jej wybrać, ale w magazynie
    // mogła stać po ręcznej edycji albo po nieudanym eksperymencie. Po jej
    // zdjęciu `storedOneOf` ma ją odrzucić jak każdą inną nieznaną wartość.
    // Osobny test od tego wyżej, bo to JEDYNA nieznana wartość, która kiedyś
    // znana była — i jedyna, dla której ktoś mógłby chcieć zrobić wyjątek.
    const stats = await load();
    store.set("margometer.panel", JSON.stringify({ metric: "turns" }));

    const overlay = new Overlay({ storage });
    overlay.render(stats);

    expect(
      overlay.shadow.querySelector('[data-action="metric-damageDealt"]')?.getAttribute("aria-pressed"),
    ).toBe("true");
    // Zakładki są trzy i żadna z nich nie jest „Tury".
    const zakladki = [...overlay.shadow.querySelectorAll('[data-action^="metric-"]')].map(
      (b) => b.textContent,
    );
    expect(zakladki).toEqual(["Zadane", "Otrzymane", "Leczenie"]);
    // Ranking ma wiersze — brak dopasowanej metryki nie zostawia pustki.
    expect(overlay.shadow.querySelectorAll(".rows .row").length).toBeGreaterThan(0);
  });
});

// Metoda istniała, ale robiła tylko `host.remove()`: zostawiała listener
// `resize` na `window` i odliczający timeout, który po zniknięciu panelu wołał
// `rerender()` na drzewie, którego już nie ma. I nikt jej nie wołał.
/**
 * Oba testy sprawdzały wcześniej zdania, które są prawdziwe NIEZALEŻNIE od
 * tego, czy `destroy()` cokolwiek zrobiło: „zapis w styl odczepionego węzła nie
 * rzuca" i „host, którego nie ma w dokumencie, nadal go nie ma". Zielone i puste.
 *
 * Teraz pytamy o skutek wprost — o pozycję, którą listener by ruszył, i o zegar,
 * który `destroy()` ma zgasić. Przy okazji znika 3,2 s prawdziwych snów.
 */
describe("zdejmowanie panelu", () => {
  const load = async () => aggregate(readEvents("new-engine/2026-07-18_lowca-vs-druzyna"));

  /** Zwęża okno, żeby `onResize` miał co przyciąć — i oddaje poprzednią szerokość. */
  const shrinkViewport = (width: number) => {
    const previous = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
    return () => Object.defineProperty(window, "innerWidth", { value: previous, configurable: true });
  };

  /** Panel postawiony daleko po prawej — pozycja wchodzi przez zapamiętany stan. */
  const farRight = () =>
    new Overlay({
      storage: {
        getItem: () => JSON.stringify({ x: 900, y: 40 }),
        setItem: () => {},
      } as unknown as Storage,
    });

  test("destroy zdejmuje nasłuch zmiany rozmiaru okna", async () => {
    const stats = await load();
    const overlay = farRight();
    overlay.render(stats);
    const host = overlay.shadow.host as HTMLElement;
    expect(host.style.left).toBe("900px");

    // Najpierw dowód, że listener W OGÓLE działa: okno się zwęża, a `onResize`
    // przyciąga panel do widoku. Bez tej połowy druga niczego by nie dowodziła.
    let restore = shrinkViewport(400);
    window.dispatchEvent(new Event("resize"));
    expect(host.style.left).not.toBe("900px");
    restore();

    // A teraz to samo po zdjęciu panelu — pozycja ma zostać nietknięta.
    const removed = farRight();
    removed.render(stats);
    const removedHost = removed.shadow.host as HTMLElement;
    removed.destroy();
    restore = shrinkViewport(400);
    window.dispatchEvent(new Event("resize"));
    expect(removedHost.style.left).toBe("900px");
    restore();
  });

  test("destroy gasi odliczanie ikony kopiowania", async () => {
    const stats = await load();
    const ticker = new ManualTicker();
    const overlay = new Overlay({ clipboard: () => {}, ticker });
    overlay.render(stats);
    overlay.shadow.querySelector<HTMLElement>('button[data-action="copy-stats"]')!.click();
    await Promise.resolve();
    // Odliczanie faktycznie ruszyło — inaczej test niżej nie miałby czego gasić.
    expect(ticker.running).toBe(true);

    overlay.destroy();

    expect(ticker.running).toBe(false);
  });
});

// Arkusz obiecywał fokus na wierszach, okruszku i suwaku — trzy martwe reguły,
// bo `tabindex` nie ustawiał nic, a okruszek i suwak były `div`-ami.
describe("fokus jest tam, gdzie arkusz go obiecuje", () => {
  const load = async () => aggregate(readEvents("new-engine/2026-07-18_lowca-vs-druzyna"));

  test("okruszek powrotu to prawdziwy przycisk", async () => {
    const stats = await load();
    const overlay = new Overlay();
    overlay.render(stats);
    overlay.shadow.querySelector<HTMLElement>(".row")!.click();

    const back = overlay.shadow.querySelector(".crumb-back")!;
    expect(back.tagName).toBe("BUTTON");
    expect(back.getAttribute("aria-label")).toBe("Wróć o szczebel");
  });

  test("i nadal wraca o szczebel", async () => {
    const stats = await load();
    const overlay = new Overlay();
    overlay.render(stats);
    overlay.shadow.querySelector<HTMLElement>(".row")!.click();
    expect(crumbVisible(overlay)).toBe(true);

    overlay.shadow.querySelector<HTMLElement>(".crumb-back")!.click();

    expect(crumbVisible(overlay)).toBe(false);
  });

  // Świadoma granica z `UX.md §6`: dwadzieścia przystanków Taba nad grą, która
  // sama łapie klawisze, to dokładnie to, przed czym broni się ta zasada.
  test("wiersze rankingu zostają myszą — żadnego tabindex", async () => {
    const stats = await load();
    const overlay = new Overlay();
    overlay.render(stats);

    const rows = [...overlay.shadow.querySelectorAll(".rows .row")];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.hasAttribute("tabindex"))).toBe(false);
  });

  test("arkusz nie obiecuje fokusu tam, gdzie go nie ma", () => {
    const sheet = new Overlay().shadow.querySelector("style")!.textContent!;
    // Zostaje jedyny selektor, który ma pokrycie w drzewie.
    expect(sheet).toContain("button:focus-visible");
    expect(sheet).not.toContain(".row[tabindex]:focus-visible");
    expect(sheet).not.toContain(".replay-track:focus-visible");
  });
});

/**
 * Wygląd obu okien ma JEDNO źródło.
 *
 * Panel i archiwum rysują się w tym samym shadow roocie i do 2026‑08‑02 każde
 * wstrzykiwało własny arkusz. Skutek nie był teoretyczny: chrome okna stało
 * w dwóch kopiach, różniących się kryciem tła o 0,02 — nie z wyboru, tylko
 * dlatego, że drugie okno powstało przez skopiowanie pierwszego. Te testy nie
 * pilnują konkretnych wartości (od tego są tokeny), tylko tego, że wartość jest
 * JEDNA. Rozjazd wraca dokładnie tą drogą, którą przyszedł: przez drugą kopię.
 */
describe("jedno źródło wyglądu dla obu okien", () => {
  const sheet = () => new Overlay().shadow.querySelector("style")!.textContent!;

  test("arkusz panelu niesie też reguły archiwum", () => {
    // „Jeden arkusz" ma znaczyć „oba okna w jednym", a nie „archiwum straciło
    // swój". Że nie dochodzi drugi `<style>` przy `attachArchive`, pilnuje
    // `archive.test.ts` — tam oba okna faktycznie powstają.
    expect(sheet()).toContain(".archive-row");
  });

  test("chrome okna opisuje JEDNA reguła, wspólna dla panelu i archiwum", () => {
    const css = sheet();
    // Żadne z okien nie ma własnej deklaracji tła — obie czytają token.
    for (const selector of [".panel", ".archive"]) {
      const own = new RegExp(`^\\${selector} \\{[^}]*background:`, "m").exec(css);
      expect([selector, own]).toEqual([selector, null]);
    }
    expect(css).toContain(".panel, .archive {");
  });

  test("każdy token pada w arkuszu dokładnie raz jako deklaracja", () => {
    const css = sheet();
    // Druga deklaracja tego samego tokenu to ta sama pułapka co druga kopia
    // wartości, tylko lepiej ukryta: wygrywa ostatnia i nikt nie wie która.
    const deklaracje = [...css.matchAll(/^\s*(--[a-z-]+):/gm)].map((match) => match[1]!);
    const powtorzone = deklaracje.filter((name, at) => deklaracje.indexOf(name) !== at);
    expect(powtorzone).toEqual([]);
  });

  test("wartości, które mają być wspólne, nie stoją w arkuszu z palca", () => {
    const css = sheet();
    // Barwa toru padała w trzech regułach (wiersz, suwak odtwarzania, podział
    // stron); tło okna — w dwóch, i w dwóch różnych wersjach. Liczymy zwykłym
    // dzieleniem, nie wyrażeniem regularnym: escapowanie nawiasów w `rgba(`
    // jest dokładnie tym rodzajem szczegółu, na którym test cicho przestaje
    // cokolwiek liczyć.
    const ile = (value: string) => css.split(value).length - 1;
    for (const value of ["#24242a", "rgba(22, 22, 26,"]) {
      expect([value, ile(value)]).toEqual([value, 1]);
    }
  });
});

describe("podgląd wczytanej walki", () => {
  const load = async (name: string) => aggregate(readEvents(`new-engine/${name}`));

  /** Widok podglądu bez odtwarzania — tyle, ile overlay potrzebuje do paska. */
  const view = (): PreviewView => ({
    source: "z archiwum · 19:04",
    title: "test",
    replay: null,
    close: () => {},
  });

  // Przycisk wyglądał tak samo, mówił to samo i kopiował CO INNEGO niż to, na
  // co patrzysz — dowiadywałeś się o tym dopiero po wklejeniu.
  test("kopiowanie w podglądzie daje nagranie, nie walkę na żywo", async () => {
    const live = await load("2026-07-18_tancerz-vs-kukla");
    const archived = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    let copied = "";
    const overlay = new Overlay({ clipboard: (text) => void (copied = text) });
    overlay.render(live);
    overlay.showPreview(archived, view());

    overlay.shadow.querySelector<HTMLElement>('button[data-action="copy-stats"]')!.click();
    await Promise.resolve();

    const parsed = JSON.parse(copied);
    expect(parsed.source).toBe("z archiwum · 19:04");
    expect(parsed.fight.actors.map((a: { name: string }) => a.name)).toEqual(
      archived.actors.map((a) => a.name),
    );
  });

  test("po wyjściu z podglądu kopiowanie znów daje walkę na żywo", async () => {
    const live = await load("2026-07-18_tancerz-vs-kukla");
    const archived = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    let copied = "";
    const overlay = new Overlay({ clipboard: (text) => void (copied = text) });
    overlay.render(live);
    overlay.showPreview(archived, view());
    overlay.closePreview();

    overlay.shadow.querySelector<HTMLElement>('button[data-action="copy-stats"]')!.click();
    await Promise.resolve();

    const parsed = JSON.parse(copied);
    expect(parsed.source).toBe("na żywo");
    expect(parsed.fight.actors.map((a: { name: string }) => a.name)).toEqual(
      live.actors.map((a) => a.name),
    );
  });

  // Zwinięty panel był nieodróżnialny od zwiniętego panelu na żywo, choć
  // pokazywał nagranie sprzed godziny — a odtwarzanie leciało dalej.
  test("zwinięcie nie chowa śladu, że to nie jest walka na żywo", async () => {
    const live = await load("2026-07-18_tancerz-vs-kukla");
    const archived = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(live);
    overlay.showPreview(archived, view());

    overlay.shadow.querySelector<HTMLElement>('button[data-action="collapse"]')!.click();

    expect(overlay.shadow.querySelector(".preview-bar")).not.toBeNull();
    // A z nim jedyne wyjście z podglądu.
    expect(overlay.shadow.querySelector('button[data-action="exit-preview"]')).not.toBeNull();
    // Pasek nagrywania dalej znika — on niesie liczby, nie tożsamość widoku.
    expect(overlay.shadow.querySelector(".rec-bar")).toBeNull();
  });

  test("zwinięty panel bez podglądu zostaje samym nagłówkiem", async () => {
    const live = await load("2026-07-18_tancerz-vs-kukla");
    const overlay = new Overlay();
    overlay.render(live);

    overlay.shadow.querySelector<HTMLElement>('button[data-action="collapse"]')!.click();

    expect(overlay.shadow.querySelector(".preview-bar")).toBeNull();
  });

  test("dymek opisuje wczytane nagranie, nie walkę na żywo", async () => {
    // Składy są rozłączne, więc szukanie postaci w walce na żywo nie znajduje
    // NICZEGO — dokładnie tak dymek w archiwum milczał.
    const live = await load("2026-07-18_tancerz-vs-kukla");
    const archived = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(live);
    overlay.showPreview(archived, view());

    const row = overlay.shadow.querySelector<HTMLElement>(".row")!;
    const name = row.dataset.actor!;
    expect(archived.actors.some((actor) => actor.name === name)).toBe(true);
    row.dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector<HTMLElement>(".tip")!;
    expect(tip.hidden).toBe(false);
    expect(tip.querySelector(".tip-title")?.textContent).toBe(name);
  });

});

describe("prawy przycisk odbiera menu tylko wtedy, gdy coś daje w zamian", () => {
  const load = async () =>
    aggregate(readEvents("new-engine/2026-07-18_tancerz-vs-kukla"));

  test("na najwyższym szczeblu menu zostaje, bo nie ma czego zdjąć", async () => {
    // `back()` wychodził wtedy bez efektu, ale `preventDefault()` leciał i tak.
    const overlay = new Overlay();
    overlay.render(await load());

    const event = new Event("contextmenu", { bubbles: true, cancelable: true });
    overlay.shadow.querySelector(".rows")!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  test("nad listą nagrań menu zostaje, choć w panelu jest co zdjąć", async () => {
    // Archiwum stoi w tym samym shadow roocie, ale POZA `.panel` — tak samo jak
    // prawdziwe (`archive.ts`: `window.className = "archive"`, doklejane przez
    // `overlay.shadow.append`). Sam wyjątek na pola tekstowe tu nie wystarczał:
    // nad LISTĄ nagrań nie ma czego wpisywać, a menu i tak się należy.
    const overlay = new Overlay();
    overlay.render(await load());
    overlay.shadow.querySelector<HTMLElement>(".row[data-actor]")!.click();
    expect(crumbVisible(overlay)).toBe(true);

    const archive = document.createElement("div");
    archive.className = "archive";
    const list = document.createElement("div");
    list.className = "archive-list";
    archive.append(list);
    overlay.shadow.append(archive);

    const event = new Event("contextmenu", { bubbles: true, cancelable: true });
    list.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    // I — co ważniejsze — nie zdjął szczebla w niewidocznym panelu pod spodem.
    expect(crumbVisible(overlay)).toBe(true);
  });

  test("nie cofa widoku i nie blokuje menu przeglądarki", async () => {
    // Archiwum rysuje pole wklejania w TYM SAMYM shadow roocie co panel, więc
    // globalny handler PPM zabierał mu natywne menu — jedyne miejsce, gdzie to
    // menu jest naprawdę potrzebne — i przy okazji cofał widok o szczebel.
    const stats = aggregate(readEvents("new-engine/2026-07-18_tancerz-vs-kukla"));
    const overlay = new Overlay();
    overlay.render(stats);

    const row = overlay.shadow.querySelector<HTMLElement>(".row[data-actor]")!;
    const name = row.dataset.actor!;
    row.click();
    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe(name);

    const area = document.createElement("textarea");
    overlay.shadow.append(area);
    const event = new Event("contextmenu", { bubbles: true, cancelable: true });
    area.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    // Widok stoi tam, gdzie stał — PPM z pola tekstowego nic nie cofa.
    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe(name);

    // Poza polem tekstowym PPM działa jak dotąd: wraca do składu.
    const outside = new Event("contextmenu", { bubbles: true, cancelable: true });
    overlay.shadow.querySelector(".rows")!.dispatchEvent(outside);
    expect(outside.defaultPrevented).toBe(true);
    expect(crumbVisible(overlay)).toBe(false);
  });
});

describe("przyciski panelu przeżywają przebudowę w środku gestu", () => {
  const press = (node: Element, kind: string) =>
    node.dispatchEvent(new Event(kind, { bubbles: true }));

  test("zakładka metryki działa, choć panel przebudował się między wciśnięciem a puszczeniem", async () => {
    // Tak wygląda odtwarzanie: klatka co 62,5 ms przy 4×, więc zwykły klik
    // (~100 ms) zawsze trafia w przebudowę. Węzeł spod kursora znika, natywny
    // `click` nie pada, a zakładki przestają działać — z podglądu nie dawało się
    // wyjść bez wcześniejszej pauzy.
    const stats = aggregate(readEvents("new-engine/2026-07-18_tancerz-vs-kukla"));
    const overlay = new Overlay();
    overlay.render(stats);

    press(metricButton(overlay, "Otrzymane"), "pointerdown");
    // Nowa klatka: cała treść korpusu powstaje od nowa.
    overlay.render(stats);
    press(metricButton(overlay, "Otrzymane"), "pointerup");

    expect(metricButton(overlay, "Otrzymane").getAttribute("aria-pressed")).toBe("true");
    expect(metricButton(overlay, "Zadane").getAttribute("aria-pressed")).toBe("false");
  });

  test("zwykły klik nie wykonuje akcji dwa razy", async () => {
    // `pointerup` już ją wykonał, a przeglądarka dokłada za nim `click` —
    // bez flagi „obsłużone” przełącznik wracałby na miejsce.
    const stats = aggregate(readEvents("new-engine/2026-07-18_tancerz-vs-kukla"));
    const overlay = new Overlay();
    overlay.render(stats);

    const perTurn = () =>
      [...overlay.shadow.querySelectorAll("button")].find((b) => b.textContent === "na turę")!;
    press(perTurn(), "pointerdown");
    press(perTurn(), "pointerup");
    press(perTurn(), "click");

    expect(perTurn().getAttribute("aria-pressed")).toBe("true");
  });

  test("puszczenie nad INNYM przyciskiem niczego nie przełącza", async () => {
    const stats = aggregate(readEvents("new-engine/2026-07-18_tancerz-vs-kukla"));
    const overlay = new Overlay();
    overlay.render(stats);

    press(metricButton(overlay, "Otrzymane"), "pointerdown");
    press(metricButton(overlay, "Leczenie"), "pointerup");

    expect(metricButton(overlay, "Zadane").getAttribute("aria-pressed")).toBe("true");
  });
});

/**
 * Walka z bossem: dziesięciu graczy, tykająca trucizna bez sprawcy i akcje,
 * które zadają obrażenia poza linią ciosu. Wszystkie trzy usterki tej rundy
 * widać na tym jednym zrzucie, więc i testy stoją na nim razem.
 */
/**
 * ⚠️ **ZNIKŁY STĄD DWA BLOKI — 12 testów, 2026‑08‑04, razem z korpusem.**
 *
 * „boss z Hildur — co widać w panelu" i „audyt 2026-08-01" stały w CAŁOŚCI na
 * jednym zrzucie (`2026-07-31_druzyna-vs-hildur-zwyciestwo`: dziesięciu graczy
 * przeciw bossowi, zrzut DOM z żywiołami w klasach CSS). Były najbliższą rzeczą,
 * jaką panel miał do testu na PRAWDZIWEJ walce grupowej — sekcje po stronach,
 * przekrój po typie obrażeń, wiersze‑liście bez kursora‑łapki, nagłówki z sumami,
 * drążenie w bossa z obu metryk.
 *
 * Odtworzenie ich na materiale syntetycznym byłoby fikcją: pytały „czy panel
 * radzi sobie z TĄ walką", a walki nie ma. Wersja generatorowa pytałaby „czy
 * panel radzi sobie z tym, co sami wyprodukowaliśmy" — zielona z definicji.
 *
 * Wraca to dopiero z nowym zrzutem walki grupowej (`docs/ROADMAP.md`).
 */

describe("uniki pełne i częściowe w stopce", () => {


});

/**
 * `SOLID §4.22`: blok, cios bardzo krytyczny i osłabienie trucizny były
 * parsowane, otestowane i wyrzucane. Trzy człony liczników pokazują je tam,
 * gdzie już stoją liczby tej samej rodziny.
 *
 * Każdy z nich pojawia się TYLKO gdy jest niezerowy — tak samo jak człon
 * o unikach częściowych wyżej i z tego samego powodu: zero mówi o postaci mniej
 * niż nic, a linia liczników jest wąska.
 */
describe("blok, super-kryt i osłabienie w licznikach", () => {






});
