import { describe, expect, test } from "bun:test";
import { parse } from "../src/parser.ts";
import { aggregate } from "../src/stats.ts";
import { DomLogSource, extractText, findBattleLog } from "../src/source.ts";
import { ELEMENT_MARKER } from "../src/types.ts";
import { FIXTURES, readFixture } from "./helpers.ts";

describe("wyciąganie tekstu z DOM", () => {
  test("zachowuje podział na linie z bloków i <br>", () => {
    document.body.innerHTML =
      "<div><div>Ktoś(50%) uderzył z siłą +100</div>Cel(90%) otrzymał(a) -80 obrażeń<br>koniec</div>";

    const text = extractText(document.body);
    expect(text.trim().split("\n").map((l) => l.trim()).filter(Boolean)).toEqual([
      "Ktoś(50%) uderzył z siłą +100",
      "Cel(90%) otrzymał(a) -80 obrażeń",
      "koniec",
    ]);
  });

  test("tekst zachowany przez extractText jest parsowalny", () => {
    document.body.innerHTML =
      "<div><div>Ktoś(50%) uderzył z siłą +100</div><div>Cel(90%) otrzymał(a) -80 obrażeń</div></div>";

    const events = parse(extractText(document.body));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ kind: "attack", source: "Ktoś", target: "Cel" });
  });
});

describe("żywioły z DOM gry", () => {
  const load = async () => {
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_mag-dom/log.html`,
    ).text();
    return parse(extractText(document.body));
  };

  test("czyta żywioł z klasy CSS, której nie ma w tekście", async () => {
    // <b class="dmgc">-46</b><b class="dmgl">-266</b> — w samym tekście logu
    // żywiołu nie widać w ogóle, tylko po kolorze na UI.
    const attack = (await load()).find((e) => e.kind === "attack");
    expect(attack).toMatchObject({
      ability: "Porażenie",
      hits: [
        { applied: 46, element: "zimno" },
        { applied: 266, element: "błyskawica" },
      ],
    });
  });

  test("rozbija obrażenia maga na żywioły, obok podziału na umiejętności", async () => {
    const mag = aggregate(await load()).actors.find((a) => a.name === "wf mushita psk")!;

    // Umiejętności zostają czyste — żywioł to osobny przekrój.
    // Każdy z tych ciosów niesie dwie liczby (zimno + błyskawica), więc pod
    // umiejętnością stoi 1, a w przekroju po żywiole obie pozycje mają po 3:
    // to te same trzy ciosy policzone raz dla każdego żywiołu, który niosły.
    expect(mag.dealtBy).toEqual([
      { label: "Lodowy pocisk", amount: 537, hits: 1 },
      { label: "Zwykły atak", amount: 386, hits: 1 },
      { label: "Porażenie", amount: 312, hits: 1 },
    ]);
    expect(mag.dealtByType).toEqual([
      { label: "błyskawica", amount: 964, hits: 3 },
      { label: "zimno", amount: 271, hits: 3 },
    ]);
  });

  test("oba przekroje sumują się do tej samej wartości", async () => {
    // To ten sam worek obrażeń pokrojony inaczej — nie dwie różne liczby.
    for (const actor of aggregate(await load()).actors) {
      const sum = (rows: { amount: number }[]) => rows.reduce((a, r) => a + r.amount, 0);
      expect(sum(actor.dealtByType)).toBe(actor.damageDealt);
      expect(sum(actor.dealtBy)).toBe(actor.damageDealt);
      expect(sum(actor.takenByType)).toBe(actor.damageTaken);
    }
  });

  test("znacznik żywiołu nie wycieka do żadnego tekstu zdarzenia", async () => {
    // Znacznik żyje tylko między extractText a wyliczeniem obrażeń; gdyby
    // przeciekł, zobaczyłby go użytkownik w nazwie postaci albo umiejętności.
    const events = await load();
    expect(JSON.stringify(events)).not.toContain(ELEMENT_MARKER);
    expect(events.filter((e) => e.kind === "unknown")).toEqual([]);
  });

  test("log wklejony jako tekst nie ma żywiołów i to nie jest błąd", async () => {
    const events = parse(await readFixture("new-engine/2026-07-18_mag-vs-druzyna-umiejetnosci"));
    const hits = events.flatMap((e) => (e.kind === "attack" ? e.hits : []));
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((hit) => hit.element === null)).toBe(true);
  });
});

describe("zadane kontra otrzymane", () => {
  const load = async () => {
    document.body.innerHTML = await Bun.file(
      `${FIXTURES}new-engine/2026-07-18_mag-dom-fuzja/log.html`,
    ).text();
    return parse(extractText(document.body));
  };

  test("postać, która tylko obrywa, ma zerowe zadane", async () => {
    // Zgłoszenie "Furu Mulu wykonuje zwykły atak, a pisze Lodowy pocisk":
    // on w tej walce nie atakuje ani razu.
    const furu = aggregate(await load()).actors.find((a) => a.name === "Furu Mulu")!;
    expect(furu.damageDealt).toBe(0);
    expect(furu.dealtBy).toEqual([]);
    expect(furu.takenFrom).toEqual([
      { label: "wf mushita psk · Porażenie", amount: 537, hits: 1 },
      { label: "wf mushita psk · Lodowy pocisk", amount: 309, hits: 1 },
    ]);
  });

  test("etykieta przyjętych niesie napastnika, nie samą umiejętność", async () => {
    const furu = aggregate(await load()).actors.find((a) => a.name === "Furu Mulu")!;
    for (const source of furu.takenFrom) expect(source.label).toContain("wf mushita psk · ");
  });

  test("czyta żywioł obrażeń własnych umiejętności z klasy dmga", async () => {
    const mag = aggregate(await load()).actors.find((a) => a.name === "wf mushita psk")!;
    expect(mag.dealtByType).toEqual([
      { label: "błyskawica", amount: 1443, hits: 3 },
      { label: "zimno", amount: 501, hits: 3 },
      { label: "nieuchronne", amount: 12, hits: 1 },
    ]);
  });

  test("liczy ciosy, nie liczby obrażeń", async () => {
    // Gracz użył umiejętności 3 razy. Każdy cios maga niesie dwie liczby
    // (zimno + błyskawica), a Fuzja żywiołów dokłada jeszcze własne obrażenia
    // obok ciosu — licząc liczby wyszłoby 7.
    const mag = aggregate(await load()).actors.find((a) => a.name === "wf mushita psk")!;
    expect(mag.hits).toBe(3);
    // Najsilniejszy cios to suma jego liczb, nie największa z nich.
    expect(mag.maxHit).toBe(298 + 800);
  });

  test("modyfikator owinięty w <font><i> nadal jest czytany", async () => {
    const crit = (await load()).find((e) => e.kind === "attack" && e.hits.some((h) => h.crit));
    expect(crit).toMatchObject({ ability: "Fuzja żywiołów" });
  });
});

describe("znajdowanie okna walki", () => {
  test("wskazuje kontener linii rozpoczęcia walki", () => {
    document.body.innerHTML = `
      <div id="gra">
        <div id="log"><div class="linia">Rozpoczęła się walka pomiędzy A (1w) a B (1w)</div></div>
      </div>`;

    expect(findBattleLog()?.id).toBe("log");
  });

  test("zwraca null, gdy walki nie ma", () => {
    document.body.innerHTML = "<div>ekran logowania</div>";
    expect(findBattleLog()).toBeNull();
  });

  test("pogrubiona linia otwierająca nie zabiera kontenera", () => {
    // Gra pogrubia linię otwierającą — `raw.txt` zapisuje ją jako `[b]...[/b]`.
    // Najgłębszym elementem z markerem jest wtedy <b>, a jego rodzicem sama
    // linia. Branie rodzica wprost podpinało obserwatora do jednej linii i
    // licznik nie widział już ani jednego obrażenia.
    document.body.innerHTML = `
      <div id="gra">
        <div id="log">
          <div class="linia"><b>Rozpoczęła się walka pomiędzy A (1w) a B (1w)</b></div>
          <div class="linia">A(100%) uderzył z siłą  +300</div>
          <div class="linia">B(60%) otrzymał(a)  -300  obrażeń</div>
        </div>
      </div>`;

    const found = findBattleLog()!;
    expect(found.id).toBe("log");
    // Sedno: z tego kontenera da się wyczytać obrażenia, nie tylko nagłówek.
    expect(parse(extractText(found)).map((e) => e.kind)).toEqual(["fight-start", "attack"]);
  });

  test("kontenerem jest pierwszy przodek niosący więcej niż jedną linię", () => {
    // Kilka warstw opakowań wokół samej linii — żadna z nich nie jest logiem.
    document.body.innerHTML = `
      <div id="gra">
        <div id="log">
          <div class="linia"><span><font><b>Rozpoczęła się walka pomiędzy A (1w) a B (1w)</b></font></span></div>
          <div class="linia">A(100%) uderzył z siłą  +300</div>
          <div class="linia">B(60%) otrzymał(a)  -300  obrażeń</div>
        </div>
      </div>`;

    expect(findBattleLog()?.id).toBe("log");
  });
});

describe("DomLogSource", () => {
  test("emituje treść po dopisaniu linii do logu", async () => {
    const log = document.createElement("div");
    document.body.append(log);

    const seen: string[] = [];
    const stop = new DomLogSource(log).subscribe((text) => seen.push(text));

    log.append(Object.assign(document.createElement("div"), { textContent: "nowa linia" }));
    await new Promise((resolve) => queueMicrotask(() => resolve(null)));
    stop();

    expect(seen).toHaveLength(2); // emisja startowa + po mutacji
    expect(seen.at(-1)).toContain("nowa linia");
  });
});