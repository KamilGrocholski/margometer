import { beforeEach, describe, expect, test } from "bun:test";
import { parse } from "../src/parser.ts";
import { EMPTY_STATS, UNATTRIBUTED_SOURCE, aggregate, totalBySide } from "../src/stats.ts";
import {
  Overlay,
  tipPosition,
  type PreviewView,
  type RecorderControl,
} from "../src/overlay.ts";
import { extractText } from "../src/source.ts";
import { syntheticFight } from "../tools/synthetic-log.ts";
import pkg from "../package.json" with { type: "json" };
import { ManualTicker } from "./manual-ticker.ts";
import { FIXTURES, metricButton, number, rate, readFixture, shareOf, valueOf } from "./helpers.ts";

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

describe("leczenie", () => {
  const load = async (name: string) => aggregate(parse(await readFixture(`new-engine/${name}`)));

  test("rozbija leczenie na źródła, tak jak obrażenia", async () => {
    const tropiciel = (await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci")).actors.find(
      (a) => a.name === "wf foverek psk",
    )!;
    expect(tropiciel.healingReceived).toBe(3686);
    expect(tropiciel.healedBy).toEqual([
      { label: "Ostatni ratunek", amount: 3056, hits: 1 },
      { label: "Regeneracja", amount: 630, hits: 3 },
    ]);
  });

  test("gołe \"Przywrócono\" ląduje pod Regeneracją, bo log nie podaje źródła", async () => {
    const lowca = (await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci")).actors.find(
      (a) => a.name === "Łowcosław Kazrek",
    )!;
    expect(lowca.healedBy).toEqual([{ label: "Regeneracja", amount: 466, hits: 3 }]);
  });

  test("rozbicie sumuje się do wartości na pasku", async () => {
    for (const actor of (await load("2026-07-18_tancerz-vs-tropiciel-umiejetnosci")).actors) {
      const sum = actor.healedBy.reduce((acc, row) => acc + row.amount, 0);
      expect(sum).toBe(actor.healingReceived);
    }
  });

  test("zakładka Leczenie sortuje po wyleczonym, nie po obrażeniach", async () => {
    const stats = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats);
    metricButton(overlay, "Leczenie").click();

    // Jedna wspólna lista, bez podziału na strony — tropiciel stoi na szczycie
    // całego rankingu, bo wyleczył się mocniej niż ktokolwiek w walce.
    const first = overlay.shadow.querySelector(".row")!;
    expect(first.querySelector(".label")?.textContent).toBe("wf foverek psk");
    // Udział liczy się wobec CAŁEJ walki, więc lider nie ma automatycznie 100%.
    expect(valueOf(first)).toBe(number.format(3686));
    expect(shareOf(first)).toBe("89%");
  });

  test("rozbicie leczenia pokazuje od czego wyleczono, bez typu obrażeń", async () => {
    const stats = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats);
    metricButton(overlay, "Leczenie").click();
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "wf foverek psk")!
      .click();

    const heads = [...overlay.shadow.querySelectorAll(".rows .side-head")].map(
      (el) => el.firstElementChild?.textContent,
    );
    // Pierwszy szczebel to źródło ("OD CZEGO"), w parze z "OD KOGO/KOMU" reszty.
    // Leczenie nie ma podziału na żywioły — sekcja typu w ogóle się nie pojawia.
    expect(heads).toEqual(["OD CZEGO"]);
    expect([...overlay.shadow.querySelectorAll(".rows .row .label")].map((el) => el.textContent))
      .toEqual(["Ostatni ratunek", "Regeneracja"]);
  });

  test("dymek wymienia obie sekcje efektów jako skrót", async () => {
    const stats = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats);
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "wf foverek psk")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector(".tip")!;
    // Kolejność sekcji, nie sam ich zestaw: „KOMU" stoi zaraz po sumach, bo
    // „ile" i „od czego" to jedno pytanie w dwóch krokach.
    expect([...tip.querySelectorAll(".tip-heading")].map((el) => el.textContent)).toEqual([
      "Ogólne",
      "KOMU",
      "Użycia akcji",
      "Efekty w ciosach",
      "Efekty otrzymane",
    ]);
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
  const load = async (name: string) => aggregate(parse(await readFixture(`new-engine/${name}`)));

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

  test("pokazuje trzy najsilniejsze cele z udziałem, zgodnie z rozbiciem", async () => {
    const stats = await load("2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats);

    const actor = stats.actors.find((a) => a.name === "Łowcożyr Kazrek")!;
    // Wprost z danych, nie z drugiego przebiegu tego samego kodu: gdyby sekcja
    // czytała nie tę listę, co trzeba, te liczby by się nie zgodziły.
    const oczekiwane = actor.dealtToBy
      .slice(0, 3)
      .map((s) => [
        s.label,
        `${number.format(s.amount)} (${Math.round((s.amount / actor.damageDealt) * 100)}%)`,
      ]);
    expect(oczekiwane.length).toBe(3);

    expect(sectionRows(hover(overlay, "Łowcożyr Kazrek"), "KOMU")).toEqual(oczekiwane);
  });

  test("nie wypisuje wszystkiego — mówi, ile zostało niżej", async () => {
    // Walka drużynowa: boss bije dziesięć celów, więc trójka to naprawdę skrót.
    const stats = await load("2026-07-31_druzyna-vs-hildur-zwyciestwo");
    const overlay = new Overlay();
    overlay.render(stats);

    const actor = stats.actors.find((a) => a.name === "Hildur Muza Śmierci")!;
    expect(actor.dealtToBy.length).toBe(10);

    const tip = hover(overlay, "Hildur Muza Śmierci");
    expect(sectionRows(tip, "KOMU")).toHaveLength(3);
    // Bez tego przypisu „TOP 3" czyta się jak „to wszystko".
    const przypis = [...tip.querySelectorAll(".tip-section")]
      .find((s) => s.querySelector(".tip-heading")?.textContent === "KOMU")!
      .querySelector(".tip-note")?.textContent;
    expect(przypis).toBe("+ 7 pozycji niżej");
  });

  test("idzie za zakładką metryki — po przełączeniu mówi OD KOGO", async () => {
    const stats = await load("2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats);

    metricButton(overlay, "Otrzymane").click();

    const actor = stats.actors.find((a) => a.name === "Łowcożyr Kazrek")!;
    const oczekiwane = actor.takenFromBy
      .slice(0, 3)
      .map((s) => [
        s.label,
        `${number.format(s.amount)} (${Math.round((s.amount / actor.damageTaken) * 100)}%)`,
      ]);
    expect(oczekiwane.length).toBeGreaterThan(0);

    const wiersze = sectionRows(hover(overlay, "Łowcożyr Kazrek"), "OD KOGO");
    expect(wiersze).toEqual(oczekiwane);
    // Nagłówka „KOMU" ma już nie być — inaczej dymek pokazywałby obie strony
    // naraz i nie wiadomo, do której listy prowadzi kliknięcie.
    const naglowki = [...hover(overlay, "Łowcożyr Kazrek").querySelectorAll(".tip-heading")].map(
      (el) => el.textContent,
    );
    expect(naglowki).not.toContain("KOMU");
  });

  test("w trybie „na turę” liczba jest tempem, a udział zostaje z sum surowych", async () => {
    // To samo rozstrzygnięcie, co przy `A2`: procent opisuje strukturę obrażeń,
    // więc nie może zmieniać się wraz z trybem. Gdyby liczył się z temp,
    // trójka wierszy sumowałaby się do innej liczby niż ta sama trójka
    // w rozbiciu.
    const stats = await load("2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats);

    const actor = stats.actors.find((a) => a.name === "Łowcożyr Kazrek")!;
    const pierwszy = actor.dealtToBy[0]!;
    const udzial = Math.round((pierwszy.amount / actor.damageDealt) * 100);

    const przed = sectionRows(hover(overlay, "Łowcożyr Kazrek"), "KOMU")[0]!;
    expect(przed[1]).toBe(`${number.format(pierwszy.amount)} (${udzial}%)`);

    overlay.shadow.querySelector<HTMLElement>('[data-action="per-turn"]')!.click();

    const po = sectionRows(hover(overlay, "Łowcożyr Kazrek"), "KOMU")[0]!;
    // Zadane dzielą się przez tury WŁASNE — ten sam dzielnik, co w wierszu.
    expect(po[1]).toBe(`${rate.format(pierwszy.amount / actor.turns)}/t (${udzial}%)`);
  });

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
  const load = async () => aggregate(parse(await readFixture("new-engine/2026-07-18_lowca-vs-druzyna")));

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

  test("odznaka profesji opisuje TEN szczebel, nie poprzedni", async () => {
    // Cena trwałości węzła: odznaka jest ATRYBUTEM (`data-prof`) plus dwiema
    // własnościami CSS, więc podmiana tekstu jej NIE zdejmuje. Na węźle
    // budowanym od nowa nie było czego czyścić — tu jest.
    //
    // Przejście postać → postać niczego nie dowodzi: `markIfCharacter` po
    // prostu NADPISUJE atrybut i test przechodzi także bez czyszczenia
    // (sprawdzone mutacją). Dziurę widać dopiero tam, gdzie nowa nazwa NIE
    // jest postacią — czyli po wejściu w umiejętność z listy „CZYM (ŁĄCZNIE)".
    const overlay = new Overlay();
    overlay.render(await load());

    [...overlay.shadow.querySelectorAll<HTMLElement>(".row[data-actor]")]
      .find((row) => row.dataset.actor === "Łowcożyr Kazrek")!
      .click();
    const name = overlay.shadow.querySelector<HTMLElement>(".crumb-name")!;
    // Postać ma odznakę — bez tego reszta testu nie dowodzi niczego.
    expect(name.dataset.prof).toBe("H");
    expect(name.style.getPropertyValue("--prof-bg")).not.toBe("");

    const ability = [...overlay.shadow.querySelectorAll<HTMLElement>(".row[data-source]")].find(
      (row) => row.dataset.list === "abilities",
    )!;
    const label = ability.dataset.source!;
    ability.click();

    expect(overlay.shadow.querySelector(".crumb-name")!.textContent).toBe(label);
    // Umiejętność nie ma profesji — litera po łowcy byłaby tu kłamstwem.
    expect(name.dataset.prof).toBeUndefined();
    expect(name.style.getPropertyValue("--prof-bg")).toBe("");
  });
});

describe("licznik tur", () => {
  const load = async (name: string) => aggregate(parse(await readFixture(`new-engine/${name}`)));

  test("umiejętność na kilka ciosów to jedna tura", async () => {
    // "Podwójny strzał" = dwa ciosy w jednej turze; łowca ma 8 ciosów w 5 turach.
    const lowca = (await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci")).actors.find(
      (a) => a.name === "Łowcosław Kazrek",
    )!;
    expect(lowca.hits).toBe(8);
    expect(lowca.turns).toBe(5);
  });

  test("dymek podaje tury utracone wraz z udziałem", async () => {
    // Korpus ma dokładnie dwa zdarzenia "utrata tury" — to jedno z nich.
    // Utrata tury JEST turą, tylko bez akcji, więc wchodzi też do `turns`.
    const stats = await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const tropiciel = stats.actors.find((a) => a.name === "wf foverek psk")!;
    expect(tropiciel.turnsLost).toBe(1);

    const overlay = new Overlay();
    overlay.render(stats);
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "wf foverek psk")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector(".tip")!;
    const stat = (label: string) =>
      [...tip.querySelectorAll(".tip-stat")]
        .find((row) => row.querySelector(".tip-stat-label")?.textContent === label)
        ?.querySelector(".tip-stat-value")?.textContent;

    const share = Math.round((tropiciel.turnsLost / tropiciel.turns) * 100);
    expect(stat("Tury")).toBe(`${tropiciel.turns}`);
    expect(stat("Tury utracone")).toBe(`1 (${share}%)`);
  });

  test("dwie tury tej samej postaci pod rząd nie sklejają się w jedną", async () => {
    // Między nimi stoi tylko leczenie, więc bez znacznika "wykonuje" wyszłaby
    // jedna tura zamiast dwóch.
    const events = parse(await readFixture("new-engine/2026-07-18_lowca-vs-tropiciel-umiejetnosci"));
    const kolejnosc = events
      .filter((e) => e.kind === "ability")
      .map((e) => (e.kind === "ability" ? e.actor : ""));
    expect(kolejnosc.filter((a) => a === "Łowcosław Kazrek").length).toBeGreaterThan(1);

    const lowca = aggregate(events).actors.find((a) => a.name === "Łowcosław Kazrek")!;
    expect(lowca.turns).toBeGreaterThanOrEqual(kolejnosc.filter((a) => a === "Łowcosław Kazrek").length);
  });

  test("utrata tury liczy się jako tura", async () => {
    const tropiciel = (await load("2026-07-18_lowca-vs-tropiciel-umiejetnosci")).actors.find(
      (a) => a.name === "wf foverek psk",
    )!;
    expect(tropiciel.turnsLost).toBe(1);
    expect(tropiciel.turns).toBe(3); // 2 z akcją + 1 utracona
  });

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
  const load = async () =>
    aggregate(parse(await readFixture("new-engine/2026-07-18_wojownik-vs-druzyna-umiejetnosci")));

  const teamButton = (overlay: Overlay, label: string) =>
    [...overlay.shadow.querySelectorAll("button")].find((b) => b.textContent === label)!;
  const labels = (overlay: Overlay) =>
    [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);

  test("czyta strony konfliktu z linii otwierającej", async () => {
    const sides = (await load()).actors.map((a) => [a.name, a.side]);
    expect(sides).toEqual([
      ["Woj Zandan Długonogi", 0],
      ["Bulu Mulu", 1],
      ["Zulu Gula", 1],
      ["Nuna Gula", 1],
    ]);
  });

  test("filtruje wiersze do wybranej drużyny", async () => {
    const stats = await load();
    const overlay = new Overlay();
    overlay.render(stats);

    expect(labels(overlay)).toHaveLength(4);

    teamButton(overlay, "My").click();
    expect(labels(overlay)).toEqual(["Woj Zandan Długonogi"]);

    teamButton(overlay, "Oni").click();
    expect(labels(overlay)).toEqual(["Bulu Mulu", "Zulu Gula", "Nuna Gula"]);

    teamButton(overlay, "Wszyscy").click();
    expect(labels(overlay)).toHaveLength(4);
  });

  test("procenty liczą się w obrębie wybranej drużyny", async () => {
    const stats = await load();
    const overlay = new Overlay();
    overlay.render(stats);
    teamButton(overlay, "Oni").click();

    // 149 + 54 + 22 = 225 obrażeń drużyny przeciwnej; Bulu Mulu to 66% z tego,
    // a nie 28% z sumy całej walki.
    const shares = [...overlay.shadow.querySelectorAll(".rows .row")].map(shareOf);
    expect(shares[0]).toBe("66%");
  });

  test("filtr działa razem z przełącznikiem metryki", async () => {
    const stats = await load();
    const overlay = new Overlay();
    overlay.render(stats);

    teamButton(overlay, "My").click();
    teamButton(overlay, "Otrzymane").click();
    expect(labels(overlay)).toEqual(["Woj Zandan Długonogi"]);
  });
});

describe("overlay", () => {
  const statsFrom = async (name: string) => aggregate(parse(await readFixture(name)));

  test("renderuje wiersze posortowane malejąco po obrażeniach", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats);

    const labels = [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);
    // Żadna Locha nic nie zadała, ale obie stoją w składzie i log je rozdziela
    // (spadały osobnymi ciągami HP), więc wiszą na końcu rankingu jako dwa
    // wiersze. Gwiazdka: numeracja jest nasza, wywnioskowana ze spadku życia.
    expect(labels).toEqual(["Łowcożyr Kazrek", "Odyniec", "Locha #1 *", "Locha #2 *"]);
  });

  test("pokazuje cały skład od linii otwierającej, zanim ktokolwiek zadziała", () => {
    const stats = aggregate(
      parse(
        "[b]Rozpoczęła się walka pomiędzy Łowca głów z psk (104h) a Wieczornica (93p), Południca (92p)[/b]",
      ),
    );
    const overlay = new Overlay();
    overlay.render(stats);

    const labels = [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);
    // Na samych zerach o kolejności decyduje alfabet (Ł przed P).
    expect(labels).toEqual(["Łowca głów z psk", "Południca", "Wieczornica"]);
    // Sam wiersz to za mało: zero musi być widoczne jako zero, nie jako pustka.
    expect(overlay.shadow.querySelector(".value")?.textContent).toContain("0");
  });

  test("przełącznik metryki pokazuje obrażenia przyjęte", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-paladyni");
    const overlay = new Overlay();
    overlay.render(stats);

    const taken = [...overlay.shadow.querySelectorAll("button")].find(
      (b) => b.textContent === "Otrzymane",
    )!;
    taken.click();

    const labels = [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);
    // Obrywał tylko on, ale reszta składu zostaje widoczna na zerach.
    expect(labels).toEqual(["Łowca głów z psk", "Południca", "Wieczornica *"]);
  });

  test("oznacza gwiazdką postacie o zduplikowanej nazwie", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-paladyni");
    const overlay = new Overlay();
    overlay.render(stats);

    const labels = [...overlay.shadow.querySelectorAll(".label")].map((el) => el.textContent);
    expect(labels).toContain("Wieczornica *");
  });

  /**
   * Uczestnik, którego nazwa stoi po obu stronach, nie ma strony — ale nadal
   * jest w składzie. Filtr pytał kiedyś o `side !== null`, czyli traktował te
   * dwie rzeczy jak jedną, i taki wiersz znikał z panelu całkiem.
   */
  test("uczestnik bez znanej strony zostaje wierszem, ale tylko w „Wszyscy”", () => {
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Gracz (1w), Wilk (1w) a Wilk (1w), Wróg (1m)",
          "Wilk(100%) uderzył z siłą +300",
          "Gracz(70%) otrzymał -300 obrażeń",
        ].join("\n"),
      ),
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
    const stats = aggregate(parse("zupełnie nowa linia\ninna nowa linia"));
    overlay.render(stats);

    expect(overlay.shadow.querySelector(".warn")?.textContent).toContain("2 nierozpoznane linie");
  });

  test("pokazuje komunikat, gdy nie ma danych", () => {
    const overlay = new Overlay();
    const empty = aggregate([]);
    overlay.render(empty);

    expect(overlay.shadow.querySelector(".empty")?.textContent).toContain("czekam na walkę");
  });

  test("szerokość paska jest proporcjonalna do największej wartości", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats);

    const widths = [...overlay.shadow.querySelectorAll(".bar")].map(
      (el) => (el as HTMLElement).style.width,
    );
    expect(widths[0]).toBe("100%");
    // 2897 = 2617 z ciosów + 280 trucizny przypisanej po stronie konfliktu.
    expect(parseFloat(widths[1]!)).toBeCloseTo((89 / 2897) * 100, 5);
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

  test("dymek pokazuje rozbicie zadanych obrażeń na źródła", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats);

    const tip = overlay.shadow.querySelector<HTMLElement>(".tip")!;
    expect(tip.hidden).toBe(true);

    const row = overlay.shadow.querySelector(".row")!; // Kazrek — najwięcej zadał
    row.dispatchEvent(new Event("pointerover", { bubbles: true }));

    expect(tip.hidden).toBe(false);
    expect(tip.querySelector(".tip-title")?.textContent).toBe("Tancogniew Kazrek");
    // Suma aktywnej metryki stoi w "Ogólne", nie w tytule — jedna liczba, raz.
    expect(tip.querySelector(".tip-stat.is-active .tip-stat-value")?.textContent).toBe(
      number.format(10366),
    );

    expect(tip.querySelector(".tip-hint")?.textContent).toContain("LPM");

    row.dispatchEvent(new Event("pointerout", { bubbles: true }));
    expect(tip.hidden).toBe(true);
  });

  test("wiersz napastnika ma dymek z pełną nazwą i liczbami", async () => {
    // W 260px długa nazwa ucina się wielokropkiem, a to ona niesie odpowiedź
    // „od kogo”. Dymek jest jedynym miejscem, gdzie widać ją w całości.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats);
    [...overlay.shadow.querySelectorAll("button")]
      .find((b) => b.textContent === "Otrzymane")!
      .click();
    overlay.shadow.querySelector<HTMLElement>(".rows .row[data-actor]")!.click();

    const row = overlay.shadow.querySelector<HTMLElement>(".rows .row[data-source]")!;
    row.dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector<HTMLElement>(".tip")!;
    expect(tip.hidden).toBe(false);
    // Pierwszy szczebel przyjętych to sam napastnik — czym uderzał, widać
    // dopiero po wejściu w niego.
    expect(tip.querySelector(".tip-title")?.textContent).toBe("Łowcożyr Kazrek");
    const stat = (label: string) =>
      [...tip.querySelectorAll(".tip-stat")]
        .find((el) => el.querySelector(".tip-stat-label")?.textContent === label)
        ?.querySelector(".tip-stat-value")?.textContent;
    expect(stat("Otrzymane")).toBe(number.format(1143));
    expect(stat("Udział")).toBe("100%");
    expect(stat("Ciosy")).toBe("3");
    // Dymek mówi też, w czyich statystykach stoimy.
    expect(tip.querySelector(".tip-hint")?.textContent).toContain("Odyniec");

    row.dispatchEvent(new Event("pointerout", { bubbles: true }));
    expect(tip.hidden).toBe(true);
  });

  test("przyjęte drążą się w trzech szczeblach: skład → napastnik → czym", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats);
    [...overlay.shadow.querySelectorAll("button")]
      .find((b) => b.textContent === "Otrzymane")!
      .click();

    const heading = () =>
      overlay.shadow.querySelector(".rows .side-head")?.firstElementChild?.textContent;
    const labels = () =>
      [...overlay.shadow.querySelectorAll('.rows .row[data-list="sources"] .label')].map(
        (el) => el.textContent,
      );

    // Szczebel 1 → 2: wchodzimy w postać, dostajemy samych napastników.
    overlay.shadow.querySelector<HTMLElement>(".rows .row[data-actor]")!.click();
    expect(heading()).toBe("OD KOGO");
    const attacker = labels()[0]!;
    expect(attacker).not.toContain("·");

    // Szczebel 2 → 3: wchodzimy w napastnika, dostajemy jego umiejętności
    // w rankingu po obrażeniach.
    [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-list="sources"]')]
      .find((row) => row.dataset.source === attacker)!
      .click();
    expect(heading()).toBe(`CZYM — ${attacker.toUpperCase()}`);
    expect(labels().length).toBeGreaterThan(0);
    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe(attacker);
    expect(overlay.shadow.querySelector(".crumb-back")?.textContent).toContain("Odyniec");

    // Prawy przycisk zdejmuje JEDEN szczebel, nie cały stos.
    rightClick(overlay);
    expect(heading()).toBe("OD KOGO");
    rightClick(overlay);
    expect(overlay.shadow.querySelector(".rows .row[data-actor]")).not.toBeNull();
  });

  test("trucizna bez sprawcy schodzi do postaci, w którą weszliśmy", async () => {
    // Cała reszta panelu mówi wtedy o jednej postaci, więc przypis mówiący
    // o całej stronie czytałby się jak jej liczba.
    // Żaden fixture nie ma DoT bez sprawcy — w korpusie po drugiej stronie
    // stoi zawsze jeden przeciwnik, więc trucizna ma komu przypaść. Tu trzeba
    // otoczenia: przy trzech wrogach nie wiadomo, który zatruł.
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Gracz (1w) a A (1w), B (1w), C (1w)",
          "Gracz(90%) uderzył z siłą  +100",
          "A(50%) otrzymał(a)  -100  obrażeń",
          "A(100%) uderzył(a) z siłą  +40",
          "Gracz(90%) otrzymał  -40  obrażeń",
          "Gracz(80%): 100 obrażeń od trucizny.",
        ].join("\n"),
      ),
    );
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

  test("dymek pozycji zadanej stawia użycia obok ciosów", async () => {
    // Bez "Użycia" samo "Ciosy 6" przy "Podwójnym strzale" czytało się jak
    // sześć odpaleń umiejętności, a odpaleń były trzy.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats);
    // Skład → postać → jej cel: umiejętności stoją dopiero o szczebel niżej,
    // bo widok postaci pokazuje najpierw KOMU zadała.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-actor]")]
      .find((row) => row.dataset.actor === "Łowcosław Kazrek")!
      .click();
    [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-source][data-list="sources"]')]
      .find((row) => row.dataset.source === "wf foverek psk")!
      .click();

    [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-source]")]
      .find((row) => row.dataset.source === "Podwójny strzał")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector<HTMLElement>(".tip")!;
    const stat = (label: string) =>
      [...tip.querySelectorAll(".tip-stat")]
        .find((el) => el.querySelector(".tip-stat-label")?.textContent === label)
        ?.querySelector(".tip-stat-value")?.textContent;
    expect(stat("Ciosy")).toBe("6");
    expect(stat("Użycia")).toBe("3");
  });

  test("przekrój po żywiole nie ma licznika ciosów", async () => {
    // Jeden cios maga niesie zimno I błyskawicę, więc licznik per żywioł
    // sumowałby się do wielokrotności ciosów postaci — trzy uderzenia czytało
    // się jako sześć. Ta sekcja odpowiada wyłącznie na "ile obrażeń czym".
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_mag-dom/log.html`,
    ).text();
    const stats = aggregate(parse(extractText(document.body)));
    const overlay = new Overlay();
    overlay.render(stats);
    // Postać → jej cel: żywioł i umiejętności widać dopiero w rozbiciu na cel.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-actor]")]
      .find((row) => row.dataset.actor === "wf mushita psk")!
      .click();
    [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-source][data-list="sources"]')]
      .find((row) => row.dataset.source === "Furu Mulu")!
      .click();

    const counters = (list: string) =>
      [...overlay.shadow.querySelectorAll<HTMLElement>(`.rows .row[data-list="${list}"]`)]
        .map((row) => row.querySelector(".avg")?.textContent ?? null);

    // Bez licznika znaczy BEZ komórki — wiersz nie trzyma pustego miejsca po
    // liczbie, której w tym przekroju nie ma.
    expect(counters("types")).toEqual([null, null]);
    // Umiejętności licznik zachowują — tam znaczy "ile razy odpalone".
    expect(counters("sources")).toEqual(["×1", "×1"]);
  });

  test("licznik podaje użycia, a ciosy dokłada tylko przy rozjeździe", async () => {
    // "Podwójny strzał" to jedno użycie i dwa ciosy — wtedy obie liczby stoją.
    // Przy 13 z 17 etykiet w korpusie są równe i wtedy druga jest szumem.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats);
    // Umiejętności stoją w rozbiciu na cel — wchodzimy w postać, potem w jej cel.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-actor]")]
      .find((row) => row.dataset.actor === "Łowcosław Kazrek")!
      .click();
    [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-source][data-list="sources"]')]
      .find((row) => row.dataset.source === "wf foverek psk")!
      .click();

    const counter = (label: string) =>
      [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-list="sources"]')]
        .find((row) => row.dataset.source === label)
        ?.querySelector(".avg")?.textContent;

    expect(counter("Podwójny strzał")).toBe("×3 · 6 c.");
    expect(counter("Błyskawiczny strzał")).toBe("×1");
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

  test("dymek trafia we właściwy przekrój, gdy nazwa stoi w obu", async () => {
    // "Trucizna" pojawia się i w rozbiciu na pozycje, i w typie obrażeń.
    // Bez rozróżnienia list dymek pokazywałby liczby z sąsiedniej sekcji.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-druzyna");
    const overlay = new Overlay();
    overlay.render(stats);
    overlay.shadow.querySelector<HTMLElement>(".rows .row[data-actor]")!.click();
    // "Trucizna" jako źródło stoi dopiero w rozbiciu na cel; wchodzimy w cel,
    // który dostał truciznę. W przekroju po typie (żywioł) figuruje niezależnie.
    [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-source][data-list="sources"]')]
      .find((row) => row.dataset.source === "Locha #2")!
      .click();

    const poison = [...overlay.shadow.querySelectorAll<HTMLElement>(".rows .row[data-source]")].filter(
      (row) => row.dataset.source === "Trucizna",
    );
    expect(poison.map((row) => row.dataset.list)).toEqual(["sources", "types"]);

    const tip = overlay.shadow.querySelector<HTMLElement>(".tip")!;
    for (const row of poison) {
      row.dispatchEvent(new Event("pointerover", { bubbles: true }));
      expect(tip.querySelector(".tip-title")?.textContent).toBe("Trucizna");
      expect(tip.hidden).toBe(false);
    }
  });

  test("lewy przycisk drąży: skład → cele postaci → czym w cel", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats);

    overlay.shadow.querySelector<HTMLElement>(".row")!.click(); // Kazrek — najwięcej zadał

    // Pierwszy szczebel postaci to KOMU zadała, nie czym — czym jest o poziom niżej.
    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe("Tancogniew Kazrek");
    const targets = [...overlay.shadow.querySelectorAll(".rows .row")].map((el) => [
      el.querySelector(".label")?.textContent,
      valueOf(el),
      shareOf(el),
    ]);
    expect(targets).toEqual([
      ["wf agar psk", number.format(10366), "100%"],
      // Drugie wejście w to samo drążenie: te same obrażenia widziane od strony
      // umiejętności, zsumowane po wszystkich celach.
      ["Zwykły atak", number.format(10036), "97%"],
      ["Trucizna", number.format(330), "3%"],
      // Przekrój po żywiole dotyczy całości obrażeń postaci — stoi na każdym szczeblu.
      ["Nieznany", number.format(10036), "97%"],
      ["Trucizna", number.format(330), "3%"],
    ]);
    expect([...overlay.shadow.querySelectorAll(".rows .side-head")].map((el) =>
      el.firstElementChild?.textContent,
    )).toEqual(["KOMU", "CZYM (ŁĄCZNIE)", "TYP OBRAŻEŃ"]);

    // Wejście w cel odsłania, czym w niego uderzano — ranking celów ustępuje
    // rankingowi umiejętności użytych na tym jednym celu.
    [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-source][data-list="sources"]')]
      .find((row) => row.dataset.source === "wf agar psk")!
      .click();
    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe("wf agar psk");
    const breakdown = [...overlay.shadow.querySelectorAll(".rows .row")].map((el) => [
      el.querySelector(".label")?.textContent,
      valueOf(el),
      shareOf(el),
    ]);
    expect(breakdown).toEqual([
      ["Zwykły atak", number.format(10036), "97%"],
      ["Trucizna", number.format(330), "3%"],
      ["Nieznany", number.format(10036), "97%"],
      ["Trucizna", number.format(330), "3%"],
    ]);
    expect([...overlay.shadow.querySelectorAll(".rows .side-head")].map((el) =>
      el.firstElementChild?.textContent,
    )).toEqual(["CZYM — WF AGAR PSK", "TYP OBRAŻEŃ"]);

    // Wiersze rozbicia to nie postacie — nie prowadzą głębiej i nie mają dymka.
    expect(overlay.shadow.querySelector(".rows .row[data-actor]")).toBeNull();

    // Prawy przycisk zdejmuje po jednym szczeblu: cel → cele → skład.
    rightClick(overlay);
    expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe("Tancogniew Kazrek");
    rightClick(overlay);
    expect(crumbVisible(overlay)).toBe(false);
    expect(overlay.shadow.querySelector(".rows .row[data-actor]")).not.toBeNull();
  });

  // Drugie wejście w to samo drążenie, od strony umiejętności. Odpowiada na
  // pytanie, którego lista celów nie umie zadać: "która akcja robi robotę",
  // bez względu na to, w kogo poszła.
  describe("drążenie przez umiejętność", () => {
    const GRUPOWA = "new-engine/2026-07-22_lowca-tropiciel-vs-regulus-grupowa";

    const headings = (overlay: Overlay) =>
      [...overlay.shadow.querySelectorAll(".rows .side-head")].map(
        (el) => el.firstElementChild?.textContent,
      );
    const rowsOf = (overlay: Overlay, list: string) =>
      [...overlay.shadow.querySelectorAll<HTMLElement>(`.rows .row[data-list="${list}"]`)];

    /** Wchodzi w postać, która biła kilka celów kilkoma umiejętnościami. */
    const enterRegulus = async () => {
      const stats = await statsFrom(GRUPOWA);
      const overlay = new Overlay();
      overlay.render(stats);
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
        .find((row) => row.dataset.actor === "Regulus Mętnooki")!
        .click();
      return overlay;
    };

    test("sekcja sumuje umiejętność po WSZYSTKICH celach", async () => {
      const overlay = await enterRegulus();

      expect(headings(overlay)).toEqual(["KOMU", "CZYM (ŁĄCZNIE)"]);
      // Uderzenie Króla Węży poszło w dwa cele (9596 + 5072) i dopiero ta
      // sekcja pokazuje sumę — z listy celów trzeba by ją złożyć w głowie.
      const abilities = rowsOf(overlay, "abilities").map((row) => [
        row.querySelector(".label")?.textContent,
        valueOf(row),
      ]);
      expect(abilities[0]).toEqual(["Uderzenie Króla Węży", number.format(14668)]);
      expect(abilities.map(([label]) => label)).toEqual([
        "Uderzenie Króla Węży",
        "Zwykły atak",
        "Rozbryzg treści żołądkowej",
        "Plugawa inkantacja",
        "Ponowne rozgrzanie",
      ]);
    });

    test("klik w umiejętność schodzi do celów, PPM wraca", async () => {
      const overlay = await enterRegulus();

      rowsOf(overlay, "abilities")
        .find((row) => row.dataset.source === "Uderzenie Króla Węży")!
        .click();

      // Lustro "CZYM — <CEL>": ta sama mechanika, przeciwna strona ciosu.
      expect(headings(overlay)).toEqual(["KOMU — UDERZENIE KRÓLA WĘŻY"]);
      expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe(
        "Uderzenie Króla Węży",
      );
      expect(
        rowsOf(overlay, "abilities").map((row) => [
          row.querySelector(".label")?.textContent,
          valueOf(row),
        ]),
      ).toEqual([
        ["Łowcosław Kazrek", number.format(9596)],
        ["wf foverek psk", number.format(5072)],
      ]);

      rightClick(overlay);
      expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe("Regulus Mętnooki");
      expect(headings(overlay)).toEqual(["KOMU", "CZYM (ŁĄCZNIE)"]);
    });

    test("obie drogi prowadzą do tej samej liczby", async () => {
      const overlay = await enterRegulus();

      // Przez cel: Łowcosław → Uderzenie Króla Węży.
      rowsOf(overlay, "sources")
        .find((row) => row.dataset.source === "Łowcosław Kazrek")!
        .click();
      const throughTarget = valueOf(
        rowsOf(overlay, "sources").find(
          (row) => row.dataset.source === "Uderzenie Króla Węży",
        ),
      );

      rightClick(overlay);

      // Przez umiejętność: Uderzenie Króla Węży → Łowcosław.
      rowsOf(overlay, "abilities")
        .find((row) => row.dataset.source === "Uderzenie Króla Węży")!
        .click();
      const throughAbility = valueOf(
        rowsOf(overlay, "abilities").find((row) => row.dataset.source === "Łowcosław Kazrek"),
      );

      expect(throughAbility).toBe(throughTarget);
    });

    test("sekcja znika na drugim szczeblu — jesteśmy już w środku drążenia", async () => {
      const overlay = await enterRegulus();
      rowsOf(overlay, "sources")
        .find((row) => row.dataset.source === "Łowcosław Kazrek")!
        .click();

      expect(headings(overlay)).toEqual(["CZYM — ŁOWCOSŁAW KAZREK"]);
      expect(rowsOf(overlay, "abilities")).toHaveLength(0);
    });

    test("przy jednej umiejętności sekcja jest powtórzeniem sumy — nie ma jej", async () => {
      const stats = await statsFrom("new-engine/2026-07-18_tropiciel-vs-kukla");
      const overlay = new Overlay();
      overlay.render(stats);
      overlay.shadow.querySelector<HTMLElement>(".row")!.click();

      expect(headings(overlay)).not.toContain("CZYM (ŁĄCZNIE)");
    });

    test("leczenie nie dostaje sekcji — jego źródłem jest efekt, nie postać", async () => {
      const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-tropiciel-umiejetnosci");
      const overlay = new Overlay();
      overlay.render(stats);
      overlay.shadow.querySelector<HTMLElement>('[data-action="metric-healingReceived"]')!.click();
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
        .find((row) => row.dataset.actor === "wf foverek psk")!
        .click();

      expect(headings(overlay)).not.toContain("CZYM (ŁĄCZNIE)");
      expect(rowsOf(overlay, "abilities")).toHaveLength(0);
    });

    // Barwa idzie za TREŚCIĄ listy, nie za jej głębokością — a ta droga
    // odwraca kolejność szczebli względem drążenia przez cel.
    test("kolory odwracają się razem ze szczeblami", async () => {
      const overlay = await enterRegulus();

      const colorOf = (row: HTMLElement | undefined) =>
        row?.querySelector<HTMLElement>(".bar")?.style.background;
      const targetColor = colorOf(rowsOf(overlay, "sources")[0]);
      const abilityColor = colorOf(rowsOf(overlay, "abilities")[0]);
      expect(targetColor).not.toBe(abilityColor);

      // Po zejściu w umiejętność pierwszy szczebel wymienia POSTACIE, więc
      // wraca barwa profesji — ta sama co na liście celów wyżej.
      rowsOf(overlay, "abilities")
        .find((row) => row.dataset.source === "Uderzenie Króla Węży")!
        .click();
      expect(
        colorOf(rowsOf(overlay, "abilities").find((row) => row.dataset.source === "Łowcosław Kazrek")),
      ).toBe(targetColor);
    });

    test("zmiana metryki zdejmuje szczebel wszedłszy przez umiejętność", async () => {
      const overlay = await enterRegulus();
      rowsOf(overlay, "abilities")
        .find((row) => row.dataset.source === "Uderzenie Króla Węży")!
        .click();

      overlay.shadow.querySelector<HTMLElement>('[data-action="metric-damageTaken"]')!.click();
      expect(overlay.shadow.querySelector(".crumb-name")?.textContent).toBe("Regulus Mętnooki");
      expect(headings(overlay)[0]).toBe("OD KOGO");
    });

    // Lustro po stronie przyjętych: "czym mnie bito", bez względu na to, kto.
    test("przyjęte dostają tę samą sekcję", async () => {
      const overlay = await enterRegulus();
      overlay.shadow.querySelector<HTMLElement>('[data-action="metric-damageTaken"]')!.click();

      expect(headings(overlay)).toEqual(["OD KOGO", "CZYM (ŁĄCZNIE)", "TYP OBRAŻEŃ"]);
      rowsOf(overlay, "abilities")
        .find((row) => row.dataset.source === "Podwójny strzał")!
        .click();
      expect(headings(overlay)[0]).toBe("OD KOGO — PODWÓJNY STRZAŁ");
    });

    /**
     * Trucizna bez sprawcy stała dotąd na OBU szczeblach pod tą samą nazwą,
     * więc wejście w nią pokazywało wiersz powtarzający sam siebie — i dlatego
     * była liściem. Odkąd pierwszym szczeblem jest pozycja zbiorcza
     * „Bez sprawcy", szczeble mówią dwie różne rzeczy i wejście ma sens: pytanie
     * „czym mnie tyka" dostaje odpowiedź „truciznę nałożył ktoś, kogo log nie
     * nazywa". Reguła o liściu nie znika — pilnuje jej `leadsDeeper`
     * w `stats.test.ts`; tu sprawdzamy, że ta konkretna droga już nie kończy
     * się w ślepym zaułku.
     */
    test("tykający efekt schodzi do pozycji zbiorczej, nie do samego siebie", async () => {
      const overlay = await enterRegulus();
      overlay.shadow.querySelector<HTMLElement>('[data-action="metric-damageTaken"]')!.click();

      const poison = rowsOf(overlay, "abilities").find(
        (row) => row.dataset.source === "Trucizna",
      )!;
      expect(poison.dataset.leaf).toBeUndefined();

      poison.click();
      expect(headings(overlay)[0]).toBe("OD KOGO — TRUCIZNA");
      expect(rowsOf(overlay, "abilities").map((row) => row.dataset.source)).toEqual([
        UNATTRIBUTED_SOURCE,
      ]);
    });
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

  test("dymek wymienia nazwy efektów wraz z liczbą wystąpień", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-kukla");
    const overlay = new Overlay();
    overlay.render(stats);

    overlay.shadow.querySelector(".row")!.dispatchEvent(new Event("pointerover", { bubbles: true }));

    const effects = [...overlay.shadow.querySelectorAll(".tip-section")].find(
      (el) => el.querySelector(".tip-heading")?.textContent === "Efekty w ciosach",
    )!;
    const rows = [...effects.querySelectorAll(".tip-stat")].map((row) => [
      row.querySelector(".tip-stat-label")?.textContent,
      row.querySelector(".tip-stat-value")?.textContent,
    ]);
    expect(rows).toEqual([
      ["Dotyk anioła", "×1"],
      ["Klątwa", "×1"],
    ]);
  });

  test("efekty widać przy każdej metryce, nie tylko przy zadanych", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-kukla");
    const overlay = new Overlay();
    overlay.render(stats);

    const headings = () =>
      [...overlay.shadow.querySelectorAll(".tip-heading")].map((el) => el.textContent);

    for (const metric of ["Zadane", "Otrzymane"]) {
      [...overlay.shadow.querySelectorAll("button")]
        .find((b) => b.textContent === metric)!
        .click();
      // Najeżdżamy na TĘ SAMĄ postać, nie na pierwszy wiersz — ranking się
      // przestawia i przy "Otrzymane" na górze stoi już kto inny.
      [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
        .find((row) => row.dataset.actor === "Magister Kazrek")!
        .dispatchEvent(new Event("pointerover", { bubbles: true }));
      expect(headings()).toContain("Efekty w ciosach");
    }
  });

  test("wymienia wszystkie efekty, bez ucinania listy", async () => {
    // Ta walka ma ich więcej niż dawny limit czterech pozycji.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const overlay = new Overlay();
    overlay.render(stats);
    overlay.shadow.querySelector(".row")!.dispatchEvent(new Event("pointerover", { bubbles: true }));

    const actor = stats.actors.find(
      (a) => a.name === overlay.shadow.querySelector<HTMLElement>(".row")!.dataset.actor,
    )!;
    const effects = [...overlay.shadow.querySelectorAll(".tip-section")].find(
      (el) => el.querySelector(".tip-heading")?.textContent === "Efekty w ciosach",
    )!;

    expect(actor.procs.length).toBeGreaterThan(2);
    expect(effects.querySelectorAll(".tip-stat")).toHaveLength(actor.procs.length);
    expect(effects.textContent).not.toContain("inne");
  });

  test("absorpcja celu nie jest liczona jako efekt napastnika", async () => {
    // "-Absorpcja 261 obrażeń fizycznych" to tarcza CELU. Pod napastnikiem
    // byłaby nie tą postacią, a jej wartość i tak siedzi w damageAbsorbed.
    const events = parse(
      [
        "Rozpoczęła się walka pomiędzy Gracz (1w) a Cel (1w)",
        "Gracz(100%) uderzył z siłą  +500",
        "-Absorpcja 261 obrażeń fizycznych",
        "Cel(50%) otrzymał(a)  -239  obrażeń",
      ].join("\n"),
    );

    const stats = aggregate(events);
    expect(stats.actors.find((a) => a.name === "Gracz")!.procs).toEqual([]);
    expect(stats.actors.find((a) => a.name === "Cel")!.damageAbsorbed).toBe(500 - 239);
  });

  test("dymek dla przyjętych obrażeń rozbija je na sprawców", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats);

    [...overlay.shadow.querySelectorAll("button")]
      .find((b) => b.textContent === "Otrzymane")!
      .click();
    // Lista jest pogrupowana stronami, więc pierwszy wiersz to lider MOJEJ
    // drużyny — najmocniej obrywającego bierzemy po nazwie.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "wf agar psk")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector(".tip")!;
    expect(tip.querySelector(".tip-title")?.textContent).toBe("wf agar psk");
    expect(tip.querySelector(".tip-stat.is-active .tip-stat-label")?.textContent).toBe("Otrzymane");

    // Rozbicie na sprawców jest o szczebel niżej i trzyma się wybranej metryki:
    // wchodzimy w postać przy "Otrzymane", więc dostajemy samych napastników.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "wf agar psk")!
      .click();

    expect(overlay.shadow.querySelector(".rows .side-head")?.firstElementChild?.textContent).toBe(
      "OD KOGO",
    );
    const labels = [...overlay.shadow.querySelectorAll(".rows .row .label")].map(
      (el) => el.textContent,
    );
    expect(labels).toEqual([
      "Tancogniew Kazrek",
      // Te same obrażenia od strony umiejętności — bez względu na napastnika.
      "Zwykły atak",
      "Trucizna",
      // I ten sam worek w trzecim przekroju, po żywiole.
      "Nieznany",
      "Trucizna",
    ]);

    // Szczebel niżej: czym ten napastnik uderzał, w rankingu po obrażeniach.
    [...overlay.shadow.querySelectorAll<HTMLElement>('.rows .row[data-list="sources"]')]
      .find((row) => row.dataset.source === "Tancogniew Kazrek")!
      .click();
    expect(
      [...overlay.shadow.querySelectorAll('.rows .row[data-list="sources"] .label')].map(
        (el) => el.textContent,
      ),
    ).toEqual(["Zwykły atak", "Trucizna"]);
  });

  test("dymek przeżywa przebudowę panelu pod nieruchomym kursorem", async () => {
    // W grze log mutuje przy każdej akcji, więc wiersz pod kursorem jest
    // podmieniany — bez tego dymek znikałby i nie wracał aż do ruchu myszą.
    const events = parse(await readFixture("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp"));
    const overlay = new Overlay();
    overlay.render(aggregate(events));

    overlay.shadow.querySelector(".row")!.dispatchEvent(new Event("pointerover", { bubbles: true }));
    const tip = overlay.shadow.querySelector<HTMLElement>(".tip")!;
    expect(tip.hidden).toBe(false);

    // Dochodzi kolejny cios i panel jest budowany od nowa.
    const more = parse(
      "Tancogniew Kazrek(50%) uderzył z siłą  +900\nwf agar psk(10%) otrzymał  -900  obrażeń",
    );
    const grown = aggregate([...events, ...more]);
    overlay.render(grown);

    expect(tip.hidden).toBe(false);
    expect(tip.querySelector(".tip-title")?.textContent).toBe("Tancogniew Kazrek");
    // Dymek ma przeliczyć się razem z panelem — sprawdzamy po liczbie, bo to
    // ona rośnie, a tytuł jest teraz stały.
    expect(tip.querySelector(".tip-stat.is-active .tip-stat-value")?.textContent).toBe(
      number.format(10366 + 900),
    );
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
  const log = [
    "Rozpoczęła się walka pomiędzy Gracz (1w) a Szaman (1m)",
    "Szaman(100%) uderzył(a) z siłą  +536",
    "-Oślepienie w następnej turze",
    "Gracz(98%) otrzymał  -261  obrażeń",
  ].join("\n");

  test("efekt liczy się u tego, kto go ma w eq, nie u ofiary", () => {
    const stats = aggregate(parse(log));
    const szaman = stats.actors.find((a) => a.name === "Szaman")!;
    const gracz = stats.actors.find((a) => a.name === "Gracz")!;

    // Oślepienie odpaliło się z ekwipunku szamana — to jego licznik.
    expect(szaman.procs).toEqual([{ label: "Oślepienie w następnej turze", count: 1 }]);
    expect(gracz.procs).toEqual([]);
  });

  test("ofiara ma osobny licznik tego, co się na niej odpaliło", () => {
    const stats = aggregate(parse(log));
    const szaman = stats.actors.find((a) => a.name === "Szaman")!;
    const gracz = stats.actors.find((a) => a.name === "Gracz")!;

    // To samo zdarzenie z drugiej strony — dwa różne pytania, dwie liczby.
    expect(gracz.procsReceived).toEqual([{ label: "Oślepienie w następnej turze", count: 1 }]);
    expect(szaman.procsReceived).toEqual([]);
  });

  test("dymek pokazuje obie sekcje osobno", () => {
    const stats = aggregate(parse(log));
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
  const statsFrom = async (name: string) => aggregate(parse(await readFixture(name)));
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

  test("podział na strony stoi pod listą i tylko przy zakładce Wszyscy", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp");
    const overlay = new Overlay();
    overlay.render(stats);

    // Zamyka korpus — pod listą i pod stopką. Lista jest wtedy jednym rankingiem
    // bez sekcji, więc to jedyne miejsce, które mówi, jak wypadły drużyny.
    const blocks = [...overlay.shadow.querySelector(".panel-body")!.children].map((el) => el.className);
    expect(blocks.at(-1)).toBe("sides");

    // Przy "Wszyscy" to porównanie stron: dwie sumy i pasek podziału.
    expect(overlay.shadow.querySelector(".sides-track")).not.toBeNull();

    // Przy jednej drużynie porównywać nie ma z czym, więc pasek ustępuje jej
    // sumom — wszystkie metryki naraz, nie tylko ta z aktywnej zakładki.
    [...overlay.shadow.querySelectorAll("button")]
      .find((b) => b.textContent === "My")!
      .click();

    expect(overlay.shadow.querySelector(".sides-track")).toBeNull();
    const totals = [...overlay.shadow.querySelectorAll(".team-total")].map((el) => [
      el.firstElementChild?.textContent,
      el.querySelector(".team-total-value")?.textContent,
    ]);
    const mine = stats.actors.filter((a) => a.side === 0);
    const sum = (pick: (a: (typeof mine)[number]) => number) =>
      number.format(mine.reduce((acc, a) => acc + pick(a), 0));
    expect(totals).toEqual([
      ["Zadane", sum((a) => a.damageDealt)],
      ["Otrzymane", sum((a) => a.damageTaken)],
      ["Leczenie", sum((a) => a.healingReceived)],
    ]);
    // Aktywna metryka wyróżniona, żeby było wiadomo, co rządzi listą wyżej.
    expect(overlay.shadow.querySelector(".team-total.is-active")?.firstElementChild?.textContent)
      .toBe("Zadane");
    expect(overlay.shadow.querySelectorAll(".row")).toHaveLength(1);
  });

  test("trucizna bez sprawcy idzie za filtrem składu", () => {
    // Sprawcy log nie podaje (po drugiej stronie stoi trzech), ale ofiarę tak —
    // więc przypis ma mówić o tej stronie, którą właśnie widać.
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Gracz (1w) a A (1w), B (1w), C (1w)",
          "Gracz(50%): 100 obrażeń od trucizny.",
        ].join("\n"),
      ),
    );
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
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Gracz (1w) a Wilk (1w)",
          "Przywrócono 700 punktów życia Gracz(90%).",
        ].join("\n"),
      ),
    );
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
    const stats = aggregate(parse("Rozpoczęła się walka pomiędzy Gracz (1w) a Wilk (1w)"));
    const overlay = new Overlay();
    overlay.render(stats);

    const fills = [...overlay.shadow.querySelectorAll<HTMLElement>(".sides-track > span")];
    expect(fills.map((fill) => fill.style.width)).toEqual(["0%", "0%"]);
  });

  test("na turę przestawia ranking, bo tury utracone przestają karać", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_wojownik-vs-druzyna-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats);
    perTurnButton(overlay).click();

    const rows = [...overlay.shadow.querySelectorAll(".row")].map((r) => [
      r.querySelector(".label")?.textContent,
      valueOf(r),
    ]);

    // Bulu Mulu zadał 149 do 379 wojownika, ale w dwóch turach zamiast pięciu —
    // po podzieleniu bije niemal tak samo mocno i staje tuż za nim we wspólnym
    // rankingu. Udziały liczą się wobec całej walki, nie w obrębie strony.
    expect(rows[0]![0]).toBe("Woj Zandan Długonogi");
    expect(rows[1]![0]).toBe("Bulu Mulu");
    // Liczba wiodąca niesie "/t", bo w tym trybie to ona jest tempem. Udział
    // w nawiasie zostaje przy SUROWYCH sumach: 379 z 600 to 63% obrażeń walki
    // i tyle samo pokazuje tryb sum. Dawniej dzielił się przez Σ(temp) — liczbę
    // bez sensu fizycznego, której panel nigdzie nie pokazuje — więc Bulu Mulu
    // z 25% realnych obrażeń dostawał ten sam procent co wojownik z 63%.
    // Jednostka stoi przy liczbie, bo nagłówka kolumn nie ma i nie będzie —
    // bez "/t" nic by nie mówiło, że to tempo, a nie suma.
    expect(rows[0]![1]).toBe("75,8/t");
    expect(rows[1]![1]).toBe("74,5/t");
    const shares = [...overlay.shadow.querySelectorAll(".rows .row")].map(shareOf);
    expect(shares.slice(0, 2)).toEqual(["63%", "25%"]);
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

  test("pasek niesie jedną liczbę wiodącą, a reszta stoi przy niej w nawiasie", async () => {
    // Wzorzec SKADA/Details!: na pasku nazwa i wynik, reszta po najechaniu.
    // Wcześniej stały tu obie miary naraz i w walce grupowej zjadały nazwę.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const idle = stats.actors.find((a) => a.damageDealt === 0 && a.turns === 0)!;
    const single = stats.actors.find((a) => a.turns === 1 && a.damageDealt > 0)!;

    const overlay = new Overlay();
    overlay.render(stats);

    const cells = (name: string) => {
      const row = [...overlay.shadow.querySelectorAll<HTMLElement>(".row")].find(
        (candidate) => candidate.dataset.actor === name,
      )!;
      return [
        valueOf(row),
        shareOf(row),
        // Druga miara nie ma własnej kolumny — wchodzi do tego samego nawiasu
        // co udział. To jest treść tego testu.
        row.querySelector(".avg"),
      ];
    };

    const total = stats.actors.reduce((sum, a) => sum + a.damageDealt, 0);
    const share = Math.round((single.damageDealt / total) * 100);

    expect(cells(idle.name)).toEqual(["0", "0%", null]);
    expect(cells(single.name)).toEqual([number.format(single.damageDealt), `${share}%`, null]);

    // W nawiasie stoi udział, a za nim tempo — jedna liczba wiodąca, reszta
    // przy niej.
    const nawias = [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === single.name)!
      .querySelector(".share")?.textContent;
    expect(nawias).toBe(`(${share}% · ${rate.format(single.damageDealt / single.turns)}/t)`);

    // Suma nie znika z panelu — dymek pokazuje komplet metryk tej postaci.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === single.name)!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));
    const tipValue = [...overlay.shadow.querySelectorAll(".tip-stat")]
      .find((row) => row.querySelector(".tip-stat-label")?.textContent === "Zadane")
      ?.querySelector(".tip-stat-value")?.textContent;
    expect(tipValue).toBe(number.format(single.damageDealt));
  });

  test("otrzymane na turę liczy tury walki, nie tury poszkodowanego", async () => {
    // Gnoll szaman ginie w pierwszej turze łowcy, więc sam nie zdążył zagrać
    // ani razu. Przy dzieleniu przez tury WŁASNE pokazywał "0 na turę" mimo
    // 2375 przyjętych obrażeń — obrywa się w turach przeciwnika, nie swoich.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const szaman = stats.actors.find((a) => a.name === "Gnoll szaman")!;
    expect(szaman.turns).toBe(0);
    expect(szaman.damageTaken).toBeGreaterThan(0);

    const overlay = new Overlay();
    overlay.render(stats);
    [...overlay.shadow.querySelectorAll("button")]
      .find((b) => b.textContent === "Otrzymane")!
      .click();
    perTurnButton(overlay).click();

    const row = [...overlay.shadow.querySelectorAll<HTMLElement>(".row")].find(
      (candidate) => candidate.dataset.actor === "Gnoll szaman",
    )!;
    const expected = szaman.damageTaken / stats.timeline.length;
    expect(valueOf(row)).toBe(`${rate.format(expected)}/t`);
  });

  test("zadane na turę nadal dzieli się przez tury własne", async () => {
    // Druga strona tej samej reguły: tempo zadawania ma karać stojącego
    // bezczynnie, więc tu dzielnikiem zostaje licznik akcji postaci.
    const stats = await statsFrom("new-engine/2026-07-18_lowca-vs-gnolle-rozdzielanie");
    const lowca = stats.actors.find((a) => a.name === "Łowcosław Kazrek")!;
    expect(lowca.turns).toBeLessThan(stats.timeline.length);

    const overlay = new Overlay();
    overlay.render(stats);
    perTurnButton(overlay).click();

    const row = [...overlay.shadow.querySelectorAll<HTMLElement>(".row")].find(
      (candidate) => candidate.dataset.actor === "Łowcosław Kazrek",
    )!;
    const expected = lowca.damageDealt / lowca.turns;
    expect(valueOf(row)).toBe(`${rate.format(expected)}/t`);
  });

  test("duże liczby na pasku są skracane, żeby zostało miejsce na nazwę", async () => {
    const stats = aggregate(
      parse(await readFixture("new-engine/2026-07-22_lowca-tropiciel-vs-regulus-grupowa")),
    );
    const overlay = new Overlay();
    overlay.render(stats);

    const value = (name: string) =>
      valueOf(
        [...overlay.shadow.querySelectorAll<HTMLElement>(".row")].find(
          (row) => row.dataset.actor === name,
        ),
      );

    // Od pięciu cyfr wchodzi skrót — 39 352 to "39,4k".
    expect(value("Regulus Mętnooki")).toBe("39,4k");
    // Do czterech cyfr pełna liczba i tak się mieści, więc zostaje dokładna.
    expect(value("Łowcosław Kazrek")).toBe(number.format(4379));

    // Dymek zawsze podaje pełną liczbę — skrót jest tylko oszczędnością miejsca.
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "Regulus Mętnooki")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));
    const tipValue = [...overlay.shadow.querySelectorAll(".tip-stat")]
      .find((row) => row.querySelector(".tip-stat-label")?.textContent === "Zadane")
      ?.querySelector(".tip-stat-value")?.textContent;
    expect(tipValue).toBe(number.format(39352));
  });

  test("tempo strony to jej suma dzielona przez jej tury, nie suma temp", async () => {
    const stats = await statsFrom("new-engine/2026-07-18_wojownik-vs-druzyna-umiejetnosci");
    const overlay = new Overlay();
    overlay.render(stats);
    perTurnButton(overlay).click();

    const enemies = stats.actors.filter((a) => a.side !== null && a.side !== 0);
    const damage = enemies.reduce((sum, a) => sum + a.damageDealt, 0);
    const turns = enemies.reduce((sum, a) => sum + a.turns, 0);

    // Suma temp dałaby liczbę rosnącą z liczebnością drużyny, a nie tempo.
    const sumOfRates = enemies.reduce((sum, a) => sum + a.damageDealt / a.turns, 0);
    expect(overlay.shadow.querySelector(".side-enemy")?.textContent).toBe(
      `${new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 }).format(damage / turns)} oni`,
    );
    expect(damage / turns).not.toBeCloseTo(sumOfRates);
  });
});

describe("oś tur", () => {
  const statsFrom = async (name: string) => aggregate(parse(await readFixture(name)));

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
    // 9 ciosach. W korpusie prawdziwych logów rekord to 2 ciosy na użycie
    // ("Podwójne trafienie"), a zwykły atak nigdy nie przekracza jednego.
    const stats = aggregate(parse(syntheticFight(20)));

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
    const stats = aggregate(parse(syntheticFight(20)));
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
    const stats = aggregate(parse(syntheticFight(4)));
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
    const stats = aggregate(parse(syntheticFight(4)));
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
    const stats = aggregate(parse(syntheticFight(2)));
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
    const stats = aggregate(parse(syntheticFight(2)));
    const overlay = new Overlay({ clipboard: () => {} });
    overlay.render(stats);

    button(overlay, "copy-stats")!.click();
    await Promise.resolve();
    expect(button(overlay, "copy-stats")!.textContent).toBe("✓");

    await new Promise((resolve) => setTimeout(resolve, 1600));
    expect(button(overlay, "copy-stats")!.textContent).toBe("⧉");
  });

  test("odmowa schowka nie udaje sukcesu", async () => {
    const stats = aggregate(parse(syntheticFight(2)));
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
    const stats = aggregate(parse(syntheticFight(2)));
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
    const stats = aggregate(parse(syntheticFight(2)));
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
      const stats = aggregate(parse(syntheticFight(2)));
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
    const stats = aggregate(parse(syntheticFight(2)));
    const overlay = new Overlay();
    overlay.render(stats);

    expect(button(overlay, "record")).toBeNull();
    expect(overlay.shadow.querySelector(".rec-bar")).toBeNull();
  });

  test("przycisk nagrywania przełącza stan i pokazuje go", () => {
    const stats = aggregate(parse(syntheticFight(2)));
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
    const stats = aggregate(parse(syntheticFight(2)));
    const { control } = fakeRecorder();
    const overlay = new Overlay({ recorder: control });
    overlay.render(stats);

    // 5000 znaków to ~10 kB, bo przeglądarka liczy po dwa bajty na znak.
    expect(overlay.shadow.querySelector(".rec-bar .grow")!.textContent).toBe("2 walki · 10 kB");
  });

  test("licznik walk odmienia się poprawnie", () => {
    const stats = aggregate(parse(syntheticFight(2)));
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
    const stats = aggregate(parse(syntheticFight(2)));
    const { control } = fakeRecorder({ count: () => 0 });
    const overlay = new Overlay({ recorder: control });
    overlay.render(stats);

    expect(overlay.shadow.querySelector(".rec-bar")).toBeNull();
  });

  test("kopiuje nagrane logi, nie statystyki", async () => {
    const stats = aggregate(parse(syntheticFight(2)));
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
    const stats = aggregate(parse(syntheticFight(2)));
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
    const stats = aggregate(parse(syntheticFight(2)));
    const { control } = fakeRecorder({ isFailed: () => true, count: () => 0 });
    const overlay = new Overlay({ recorder: control });
    overlay.render(stats);

    expect(overlay.shadow.querySelector(".rec-bar")!.textContent).toContain("Brak miejsca");
    expect(overlay.shadow.querySelector(".rec-bar")!.className).toContain("warn");
  });

  test("oba komunikaty paska zaczynają się tak samo — wielką literą", () => {
    // AUDYT-17: jeden element niósł raz „nagrywam…", raz „Brak miejsca…".
    // Ta sama szczelina, dwie konwencje — czyta się jak literówka (`UX.md §1.6`).
    const stats = aggregate(parse(syntheticFight(2)));
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
  const load = async () => aggregate(parse(await readFixture("new-engine/2026-07-18_lowca-vs-druzyna")));

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
  const load = async () => aggregate(parse(await readFixture("new-engine/2026-07-18_lowca-vs-druzyna")));

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
  const load = async () => aggregate(parse(await readFixture("new-engine/2026-07-18_lowca-vs-druzyna")));

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
  const load = async (name: string) => aggregate(parse(await readFixture(`new-engine/${name}`)));

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

  test("przy zbieżności nazw dymek bierze liczby z nagrania", async () => {
    // Gorszy wariant tego samego błędu: postać o tej samej nazwie JEST w walce
    // na żywo, więc dymek się pokazywał — tylko z cudzymi liczbami.
    const text = await readFixture("new-engine/2026-07-18_lowca-vs-tropiciel-umiejetnosci");
    const archived = aggregate(parse(text));
    // Ta sama walka urwana w połowie: te same nazwy, mniejsze liczby.
    const live = aggregate(parse(text.split("\n").slice(0, 12).join("\n")));

    const overlay = new Overlay();
    overlay.render(live);
    overlay.showPreview(archived, view());

    const name = "Łowcosław Kazrek";
    const dealtInArchive = archived.actors.find((a) => a.name === name)!.damageDealt;
    const dealtLive = live.actors.find((a) => a.name === name)!.damageDealt;
    expect(dealtInArchive).toBeGreaterThan(dealtLive);

    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === name)!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));

    const values = [...overlay.shadow.querySelectorAll(".tip .tip-stat-value")].map(
      (el) => el.textContent,
    );
    expect(values).toContain(new Intl.NumberFormat("pl-PL").format(dealtInArchive));
    expect(values).not.toContain(new Intl.NumberFormat("pl-PL").format(dealtLive));
  });
});

describe("prawy przycisk odbiera menu tylko wtedy, gdy coś daje w zamian", () => {
  const load = async () =>
    aggregate(parse(await readFixture("new-engine/2026-07-18_tancerz-vs-kukla")));

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
    const stats = aggregate(parse(await readFixture("new-engine/2026-07-18_tancerz-vs-kukla")));
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
    const stats = aggregate(parse(await readFixture("new-engine/2026-07-18_tancerz-vs-kukla")));
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
    const stats = aggregate(parse(await readFixture("new-engine/2026-07-18_tancerz-vs-kukla")));
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
    const stats = aggregate(parse(await readFixture("new-engine/2026-07-18_tancerz-vs-kukla")));
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
describe("boss z Hildur — co widać w panelu", () => {
  const HILDUR = "new-engine/2026-07-31_druzyna-vs-hildur-zwyciestwo";

  /** Zrzut z DOM-u: żywioł siedzi wyłącznie w klasie CSS. */
  const enterBoss = async (metric: "Zadane" | "Otrzymane") => {
    document.body.innerHTML = await Bun.file(`${FIXTURES}${HILDUR}/log.html`).text();
    const stats = aggregate(parse(extractText(document.body)));
    const overlay = new Overlay();
    overlay.render(stats);
    metricButton(overlay, metric).click();
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row")]
      .find((row) => row.dataset.actor === "Hildur Muza Śmierci")!
      .click();
    return overlay;
  };
  const sectionRows = (overlay: Overlay, heading: string) => {
    const rows: HTMLElement[] = [];
    let inside = false;
    for (const node of overlay.shadow.querySelectorAll<HTMLElement>(".rows > *")) {
      if (node.classList.contains("side-head")) {
        inside = node.firstElementChild?.textContent === heading;
        continue;
      }
      if (inside && node.classList.contains("row")) rows.push(node);
    }
    return rows;
  };
  const labelsOf = (rows: HTMLElement[]) =>
    rows.map((row) => row.querySelector(".label")?.textContent);

  test("ranking OD KOGO wymienia postacie, a resztę zbiera na końcu", async () => {
    const overlay = await enterBoss("Otrzymane");
    const rows = sectionRows(overlay, "OD KOGO");

    expect(labelsOf(rows).at(-1)).toBe(UNATTRIBUTED_SOURCE);
    expect(rows.at(-1)!.dataset.unattributed).toBe("");
    // Żaden inny wiersz nie udaje pozycji zbiorczej.
    expect(rows.filter((row) => row.dataset.unattributed !== undefined)).toHaveLength(1);
  });

  test("pozycja zbiorcza prowadzi głębiej, do tego, co w niej siedzi", async () => {
    const overlay = await enterBoss("Otrzymane");
    const row = sectionRows(overlay, "OD KOGO").at(-1)!;
    // Nie jest liściem, więc kursor i klik obiecują to samo.
    expect(row.dataset.leaf).toBeUndefined();

    row.click();
    expect(
      [...overlay.shadow.querySelectorAll(".rows .side-head")].map(
        (el) => el.firstElementChild?.textContent,
      )[0],
    ).toBe(`CZYM — ${UNATTRIBUTED_SOURCE.toUpperCase()}`);
    expect(labelsOf(sectionRows(overlay, `CZYM — ${UNATTRIBUTED_SOURCE.toUpperCase()}`))).toEqual([
      "Trucizna",
      "Ogień",
    ]);
  });

  test("TYP OBRAŻEŃ wymienia rodziny, po jednej na wiersz", async () => {
    const overlay = await enterBoss("Otrzymane");
    const labels = labelsOf(sectionRows(overlay, "TYP OBRAŻEŃ"));

    expect(labels).toEqual(["Broń", "Zimno", "Trucizna", "Ogień", "Błyskawica", "Nieuchronne", "Rana"]);
  });

  test("rodzaj, którego log nie podaje, nazywa się w liście wprost", async () => {
    const overlay = await enterBoss("Zadane");
    // `dmgg` to ZASIĘG podany zamiast żywiołu — 79% obrażeń bossa. Wiersz mówi,
    // że rodzaju nie znamy, zamiast udawać kolejny typ.
    expect(labelsOf(sectionRows(overlay, "TYP OBRAŻEŃ"))).toContain("Nieznany (obszarowe)");
  });

  test("akcja bez ciosów nie melduje zera ciosów", async () => {
    const overlay = await enterBoss("Zadane");
    const rows = sectionRows(overlay, "CZYM (ŁĄCZNIE)");
    const counter = (label: string) =>
      rows.find((row) => row.querySelector(".label")?.textContent === label)
        ?.querySelector(".avg")?.textContent;

    // „Śpiew zagłady" zadaje linią „-N obrażeń otrzymał(a) X", która ciosem nie
    // jest — wiersz mówił przez to „×3 · 0 c." przy 79% obrażeń postaci.
    expect(counter("Śpiew zagłady")).toBe("×3");
    // Tam, gdzie ciosy PADŁY i zgadzają się z użyciami, też zostaje sama liczba.
    expect(counter("Zwykły atak")).toBe("×14");
  });

  /**
   * Ta sama nieprawda, jeden szczebel wyżej: na liście CELÓW etykietą jest
   * nazwa postaci, więc żadne użycie się nie dopasowuje i zostaje sam licznik
   * ciosów. Cel trafiony wyłącznie „Śpiewem zagłady" miał przy 27 945 obrażeń
   * napisane „×0".
   */
  test("cel trafiony wyłącznie akcją bez ciosów nie melduje zera", async () => {
    const overlay = await enterBoss("Zadane");
    const rows = sectionRows(overlay, "KOMU");
    const row = (label: string) =>
      rows.find((one) => one.querySelector(".label")?.textContent === label)!;

    expect(row("Łowcomir Kazrek").querySelector(".avg")).toBeNull();
    // Kontrapunkt: gdzie ciosy padły, licznik nadal stoi.
    expect(row("Zsz Przeworsk").querySelector(".avg")?.textContent).toBe("×18");
  });
});

/**
 * Usterki znalezione w audycie 2026‑08‑01. Każdy test opisuje KONKRETNY zły
 * wynik, który panel dawał przed poprawką — bo to on jest tu jedyną
 * specyfikacją.
 */
describe("audyt 2026-08-01", () => {
  const HILDUR = "new-engine/2026-07-31_druzyna-vs-hildur-zwyciestwo";
  const enterBoss = async (metric: "Zadane" | "Otrzymane") => {
    document.body.innerHTML = await Bun.file(`${FIXTURES}${HILDUR}/log.html`).text();
    const stats = aggregate(parse(extractText(document.body)));
    const overlay = new Overlay();
    overlay.render(stats);
    metricButton(overlay, metric).click();
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row[data-actor]")]
      .find((row) => row.dataset.actor === "Hildur Muza Śmierci")!
      .click();
    return overlay;
  };
  const headings = (overlay: Overlay) =>
    [...overlay.shadow.querySelectorAll(".rows .side-head")].map((head) => ({
      title: head.firstElementChild?.textContent,
      sum: head.lastElementChild?.textContent,
    }));

  test("wiersze TYP OBRAŻEŃ są liśćmi, więc kursor nie obiecuje kliknięcia", async () => {
    // Reguła `.row[data-source]:not([data-leaf]) { cursor: pointer }` malowała
    // łapkę nad przekrojem po typie, w który `rowIdentity` i tak nie wchodzi.
    const overlay = await enterBoss("Otrzymane");
    const types = [...overlay.shadow.querySelectorAll<HTMLElement>('.row[data-list="types"]')];

    expect(types.length).toBeGreaterThan(1);
    for (const row of types) expect(row.dataset.leaf).toBe("");
  });

  test("suma nagłówka na drugim szczeblu dotyczy tego, co sekcja wymienia", async () => {
    // „CZYM — DIETA-MIÓD" niosło 403 206 (całość bossa), choć wiersze pod nim
    // sumowały się do 104 005, a udziały do 26 % zamiast 100 %.
    const overlay = await enterBoss("Otrzymane");
    [...overlay.shadow.querySelectorAll<HTMLElement>('.row[data-list="sources"]')]
      .find((row) => row.dataset.source === "Dieta-Miód")!
      .click();

    const rows = [...overlay.shadow.querySelectorAll<HTMLElement>('.row[data-list="sources"]')];
    const shares = rows.map((row) => Number(shareOf(row)!.replace("%", "")));
    expect(headings(overlay)[0]).toEqual({ title: "CZYM — DIETA-MIÓD", sum: number.format(104005) });
    expect(shares.reduce((sum, share) => sum + share, 0)).toBe(100);
  });

  test("dymek działa na sekcji CZYM (ŁĄCZNIE)", async () => {
    // Handler zawężał `data-list` do dwóch wartości, więc wiersze `abilities`
    // pytały o pozycję w liście CELÓW i dymek nie przychodził wcale.
    const overlay = await enterBoss("Zadane");
    const row = [...overlay.shadow.querySelectorAll<HTMLElement>('.row[data-list="abilities"]')].find(
      (one) => one.dataset.source === "Śpiew zagłady",
    )!;
    row.dispatchEvent(new Event("pointerover", { bubbles: true }));

    const tip = overlay.shadow.querySelector<HTMLElement>(".tip")!;
    expect(tip.hidden).toBe(false);
    expect(tip.querySelector(".tip-title")?.textContent).toBe("Śpiew zagłady");
    // Akcja bez ciosów nie melduje ich zera także tutaj — wiersz przestał
    // pokazywać „×3 · 0 c.", a dymek mówił dalej „Ciosy 0".
    const stats = [...tip.querySelectorAll(".tip-stat")].map((s) => s.firstElementChild?.textContent);
    expect(stats).toContain("Użycia");
    expect(stats).not.toContain("Ciosy");
  });

  test("na najwyższym szczeblu dymek nie obiecuje powrotu", async () => {
    // AUDYT-18: podpowiedź mówiła „PPM — powrót" także w składzie, gdzie nie ma
    // dokąd wracać. To jedyna instrukcja nawigacji w panelu.
    const stats = aggregate(parse(await readFixture("new-engine/2026-07-18_tancerz-vs-kukla")));
    const overlay = new Overlay();
    overlay.render(stats);

    const row = overlay.shadow.querySelector<HTMLElement>(".row[data-actor]")!;
    row.dispatchEvent(new Event("pointerover", { bubbles: true }));
    const top = overlay.shadow.querySelector(".tip-hint")?.textContent;
    expect(top).toContain("LPM");
    expect(top).not.toContain("PPM");

    // Po zejściu szczebel niżej człon o PPM ma się pojawić. Wiersze mają tam
    // `data-list`, a nie `data-actor` — to już rozbicie, nie skład.
    row.click();
    overlay.shadow
      .querySelector<HTMLElement>(".row[data-list]")!
      .dispatchEvent(new Event("pointerover", { bubbles: true }));
    expect(overlay.shadow.querySelector(".tip-hint")?.textContent).toContain("PPM");
  });

  test("dymek drążalnego wiersza mówi także o LPM", async () => {
    // AUDYT-18: podpowiedź wymieniała sam PPM, choć LPM schodzi stamtąd niżej.
    // Milczenie o drodze w dół czyta się jak „nie ma tam nic".
    const overlay = await enterBoss("Zadane");
    const row = overlay.shadow.querySelector<HTMLElement>('.row[data-list="sources"]:not([data-leaf])')!;
    row.dispatchEvent(new Event("pointerover", { bubbles: true }));

    expect(overlay.shadow.querySelector(".tip-hint")?.textContent).toContain("LPM");
  });

  test("dymek liścia o LPM milczy, bo wejścia tam nie ma", async () => {
    const overlay = await enterBoss("Otrzymane");
    const leaf = overlay.shadow.querySelector<HTMLElement>(".row[data-list][data-leaf]");
    if (!leaf) return; // brak liścia w tym przekroju — nie ma czego pilnować
    leaf.dispatchEvent(new Event("pointerover", { bubbles: true }));

    const hint = overlay.shadow.querySelector(".tip-hint")?.textContent;
    expect(hint).toContain("PPM");
    expect(hint).not.toContain("LPM");
  });

  test("podpowiedź w dymku mówi, dokąd naprawdę wraca PPM", async () => {
    const overlay = await enterBoss("Zadane");
    const row = overlay.shadow.querySelector<HTMLElement>('.row[data-list="sources"]')!;
    row.dispatchEvent(new Event("pointerover", { bubbles: true }));

    // PPM zdejmuje JEDEN szczebel, a nie wraca do składu.
    expect(overlay.shadow.querySelector(".tip-hint")?.textContent).toContain("o szczebel wyżej");
  });

  test("przypis rozbija dokładnie tę liczbę, którą pokazuje", async () => {
    // Kwota szła za filtrem i za wybraną postacią, a rodzaje zawsze z całej
    // walki — nawias potrafił być WIĘKSZY niż liczba przed nim.
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy A (1w), B (1w) a X (1w), Y (1w)",
          "A(50%): 300 obrażeń od trucizny.",
          "B(50%): 900 obrażeń od ognia.",
        ].join("\n"),
      ),
    );
    const overlay = new Overlay();
    overlay.render(stats);
    const note = () =>
      [...overlay.shadow.querySelectorAll("footer .note")]
        .map((el) => el.textContent)
        .find((text) => text?.startsWith("Tykające"));

    expect(note()).toContain("1200");
    expect(note()).toContain("Ogień 900");

    [...overlay.shadow.querySelectorAll<HTMLElement>(".row[data-actor]")]
      .find((row) => row.dataset.actor === "A")!
      .click();
    expect(note()).toBe("Tykające obrażenia bez sprawcy: 300 (Trucizna)");
  });

  test("puste rozbicie nie zabiera liczników, które są prawdziwe", async () => {
    // Postać, która tylko obrywała, pokazywała pod „Zadane" jedno zdanie
    // i pustkę — mimo że ciosy, tury i uniki były policzone.
    const stats = aggregate(
      parse(
        [
          "Rozpoczęła się walka pomiędzy Bity (1w) a Bijący (1w)",
          "Bijący(100%) uderzył z siłą  +300",
          "Bity(50%) otrzymał(a)  -300  obrażeń",
        ].join("\n"),
      ),
    );
    const overlay = new Overlay();
    overlay.render(stats);
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row[data-actor]")]
      .find((row) => row.dataset.actor === "Bity")!
      .click();
    metricButton(overlay, "Zadane").click();

    // Zdanie po polsku, a nie mianownik zakładki po dwukropku („Brak rozbicia: zadane.").
    expect(overlay.shadow.querySelector(".empty")?.textContent).toBe("Brak zadanych obrażeń.");
    expect(overlay.shadow.querySelector(".rows .note")?.textContent).toContain("tury");
  });

  test("puste stany składu mówią zdaniem, nie mianownikiem zakładki", () => {
    // Bufor bez linii otwierającej: stron nie znamy, więc oba filtry składu
    // nie mają czego pokazać — a to najczęstszy pusty stan na starcie walki.
    const stats = aggregate(
      parse(["Bijący(100%) uderzył z siłą  +300", "Bity(50%) otrzymał(a)  -300  obrażeń"].join("\n")),
    );
    const overlay = new Overlay();
    overlay.render(stats);
    const empty = () => overlay.shadow.querySelector(".empty")?.textContent;

    metricButton(overlay, "Oni").click();
    expect(empty()).toBe("Brak danych po stronie przeciwnika.");
    metricButton(overlay, "My").click();
    expect(empty()).toBe("Brak danych po naszej stronie.");
  });

  test("stan okna z magazynu nie może przykryć gry ani zabrać pozycji", async () => {
    const stats = aggregate(parse(await readFixture("new-engine/2026-07-18_lowca-vs-druzyna")));
    const load = (raw: unknown) =>
      new Overlay({
        storage: { getItem: () => JSON.stringify(raw), setItem: () => {} } as unknown as Storage,
      });

    // Panel na miliard pikseli przykrywał całą grę razem z uchwytem, którym
    // dałoby się go zmniejszyć.
    const wide = load({ width: 1e9 });
    wide.render(stats);
    expect(
      Number(wide.shadow.querySelector<HTMLElement>(".panel")!.style.width.replace("px", "")),
    ).toBeLessThanOrEqual(window.innerWidth);

    // Tekst zamiast liczby dawał NaN, który przechodził przez `clampToViewport`
    // i zabierał hostowi `left`.
    const broken = load({ width: "szeroko", x: "abc" });
    broken.render(stats);
    expect((broken.shadow.host as HTMLElement).style.left).toBe("16px");
    expect(broken.shadow.querySelector<HTMLElement>(".panel")!.style.width).toBe("260px");

    // Prawdziwy string jest prawdziwy — panel zwijał się na starcie bez powodu.
    const collapsed = load({ collapsed: "nope" });
    collapsed.render(stats);
    expect(collapsed.shadow.querySelector(".panel")?.className).toBe("panel");
  });
});

/**
 * `AUDYT‑40`: atak z częściowym unikiem jest jednocześnie ciosem, więc doliczony
 * do „uników" kazał czytelnikowi policzyć go dwa razy — „ciosy 12 · uniki 2"
 * przy dwunastu atakach czytało się jako czternaście.
 */
describe("uniki pełne i częściowe w stopce", () => {
  const counters = (overlay: Overlay) =>
    overlay.shadow.querySelector(".rows .note")?.textContent ?? "";
  const enter = async (fixture: string, actor: string) => {
    const stats = aggregate(parse(await readFixture(fixture)));
    const overlay = new Overlay();
    overlay.render(stats);
    [...overlay.shadow.querySelectorAll<HTMLElement>(".row[data-actor]")]
      .find((row) => row.dataset.actor === actor)!
      .click();
    return overlay;
  };

  test("tancerz: dwa uniki częściowe stoją osobno od pełnych", async () => {
    const overlay = await enter("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp", "Tancogniew Kazrek");

    // Dwanaście ataków, wszystkie weszły — żaden nie przepadł w całości.
    expect(counters(overlay)).toContain("ciosy 12");
    expect(counters(overlay)).toContain("uniki 0 (+2 częściowe)");
  });

  test("profesja bijąca jedną bronią ma wiersz bez zmian", async () => {
    // Unik jednej broni jest zawsze pełny, więc członu o częściowych nie ma —
    // nie zaśmieca zwykłego przypadku.
    const overlay = await enter("new-engine/2026-07-18_tancerz-vs-tropiciel-pvp", "wf agar psk");

    expect(counters(overlay)).toContain("uniki 2");
    expect(counters(overlay)).not.toContain("częściow");
  });
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
  const load = async (fixture: string, actor: string) => {
    const stats = aggregate(parse(await readFixture(fixture)));
    const overlay = new Overlay();
    overlay.render(stats);
    const row = [...overlay.shadow.querySelectorAll<HTMLElement>(".row[data-actor]")].find(
      (r) => r.dataset.actor === actor,
    )!;
    // Dymek dla liczników z pochłoniętymi, stopka po wejściu w postać dla krytów.
    row.dispatchEvent(new Event("pointerover", { bubbles: true }));
    const tip = overlay.shadow.querySelector(".tip-note")?.textContent ?? "";
    row.click();
    const footer = overlay.shadow.querySelector(".rows .note")?.textContent ?? "";
    return { tip, footer };
  };

  test("blok stoi w nawiasie przy pochłoniętych", async () => {
    const { tip } = await load("new-engine/2026-07-31_druzyna-vs-hildur-zwyciestwo", "Zsz Przeworsk");
    expect(tip).toContain(`pochłonięte ${number.format(52882)} (blok ${number.format(5302)})`);
  });

  test("bez bloku nawias nie dochodzi", async () => {
    const { tip } = await load(
      "new-engine/2026-07-31_druzyna-vs-hildur-zwyciestwo",
      "Hildur Muza Śmierci",
    );
    expect(tip).toContain(`pochłonięte ${number.format(236007)}`);
    expect(tip).not.toContain("blok");
  });

  test("super-kryt siedzi w liczbie krytów, a nie obok niej", async () => {
    const { tip, footer } = await load(
      "new-engine/2026-07-31_druzyna-vs-hildur-zwyciestwo",
      "Hildur Muza Śmierci",
    );
    // "w tym", nie "+": dodanie obu liczb dałoby osiem krytów przy siedmiu.
    expect(tip).toContain("kryt. 7 (w tym 1 bardzo)");
    expect(footer).toContain("kryt. 7 (w tym 1 bardzo)");
  });

  test("bez super-kryta zostaje sama liczba", async () => {
    const { tip } = await load("new-engine/2026-07-31_druzyna-vs-hildur-zwyciestwo", "Zsz Przeworsk");
    expect(tip).toContain("kryt. 0");
    expect(tip).not.toContain("bardzo");
  });

  test("osłabienie trucizny dochodzi jako osobny człon", async () => {
    const { tip } = await load("new-engine/2026-07-28_druzyna-vs-draugr-zwyciestwo", "Draugr Zastępowy");
    // Osobny człon, a nie dopisek do pochłoniętych: tamte są policzone wprost
    // z logu, a to jest odtworzone z zaokrąglonego procentu.
    expect(tip).toContain(`osłabione ${number.format(2932)}`);
    expect(tip).toContain(`pochłonięte ${number.format(85380)}`);
  });

  test("bez osłabień członu nie ma wcale", async () => {
    const { tip } = await load("new-engine/2026-07-31_druzyna-vs-hildur-zwyciestwo", "Zsz Przeworsk");
    expect(tip).not.toContain("osłabione");
  });
});
