/**
 * Sonda do zbadania, czy `Engine.battle` nadaje się na źródło przypisania
 * obrażeń do konkretnego wojownika.
 *
 * Pytanie, na które ma odpowiedzieć: czy życie wojownika zmienia się w rytm
 * linii logu (wtedy da się powiedzieć "te -878 zabrał wojownik 473373"), czy
 * skacze raz na turę / z opóźnieniem (wtedy przypisanie po id jest nierealne).
 *
 * Niczego nie zakłada o kształcie obiektu — najpierw go pokazuje. Sama czeka
 * na początek walki, więc można ją wkleić zawczasu.
 *
 * Użycie: wklej w konsolę na karcie z grą, wejdź w walkę z dwoma potworami
 * o tej samej nazwie, po walce wywołaj `margometerProbe.dump()`.
 */
(() => {
  const PROBE_VERSION = 3;
  window.margometerProbe?.stop?.();

  const engineOf = () => window.Engine ?? window.getEngine?.() ?? null;

  /** Płaski podgląd obiektu: same pola proste + nazwy pól zagnieżdżonych. */
  const shallow = (value, depth = 0) => {
    if (value === null || typeof value !== "object") return value;
    if (depth > 1) return `{${Object.keys(value).join(",")}}`;
    const out = {};
    for (const [key, inner] of Object.entries(value)) {
      if (typeof inner === "function") continue;
      out[key] = shallow(inner, depth + 1);
    }
    return out;
  };

  /**
   * Lista wojowników. Nie wiemy, czy `warriors` to tablica, obiekt czy mapa,
   * ani czy w ogóle tak się nazywa — więc bierzemy pierwsze pole battle, które
   * wygląda jak kolekcja postaci z nazwami.
   */
  const warriorsOf = (battle) => {
    if (!battle || typeof battle !== "object") return { field: null, list: [] };
    // Najpierw pola, które gra faktycznie ma (potwierdzone zrzutem kluczy),
    // dopiero potem ślepe skanowanie. Bez tej kolejności trafialiśmy na
    // `warriorsList` z 26 pustymi slotami zamiast na właściwą kolekcję.
    const preferred = ["warriors", "warriorsList"];
    const fields = [...preferred, ...Object.keys(battle).filter((k) => !preferred.includes(k))];

    for (const field of fields) {
      const value = battle[field];
      if (!value || typeof value !== "object") continue;
      const list = value instanceof Map ? [...value.values()] : Object.values(value);
      const named = list.filter(
        (w) => w && typeof w === "object" && typeof w.name === "string" && w.name !== "",
      );
      if (named.length > 0) return { field, list: named };
    }
    return { field: null, list: [] };
  };

  /** Życie wojownika — nazwa pola nieznana, więc szukamy czegoś sensownego. */
  const hpOf = (w) => {
    if (w.hp && typeof w.hp === "object") return w.hp.cur ?? w.hp.hpp ?? null;
    return w.hp ?? w.cur ?? w.hpp ?? null;
  };
  const idOf = (w) => w.id ?? w.originalId ?? w.uid ?? null;

  const timeline = [];
  /** Kształt obiektu gry — zbierany raz, oddawany razem z timeline. */
  const shape = { polaBattle: null, kolekcja: null, surowyWojownik: null };
  let previous = new Map();
  let seenLines = 0;
  let container = null;
  let observer = null;

  const record = (lines) => {
    const battle = engineOf()?.battle;
    const { field, list } = warriorsOf(battle);

    if (list.length === 0) {
      timeline.push({ lines, uwaga: "brak wojowników z nazwą — walka nieaktywna?" });
      return;
    }

    if (shape.surowyWojownik === null) {
      // Same pola danych — metod jest ponad setka i zalałyby wynik.
      shape.polaBattle = Object.keys(battle).filter((k) => typeof battle[k] !== "function");
      shape.kolekcja = `battle.${field}`;
      shape.surowyWojownik = shallow(list[0]);
      console.log(`[sonda] kolekcja: battle.${field}`, shape.surowyWojownik);
    }

    const stan = list.map((w) => ({ id: idOf(w), name: w.name, team: w.team ?? null, hp: hpOf(w) }));

    const deltas = [];
    for (const w of stan) {
      const before = previous.get(w.id);
      if (before != null && before !== w.hp) {
        deltas.push({ id: w.id, name: w.name, spadek: before - w.hp });
      }
    }
    previous = new Map(stan.map((w) => [w.id, w.hp]));

    timeline.push({ lines, deltas, stan });
    if (deltas.length > 0) console.log("[sonda] ubytki:", deltas, "przy:", lines);
  };

  /** Log walki szukamy po treści — selektory gra potrafi zmienić. */
  const findLog = () => {
    const hits = [...document.querySelectorAll("*")].filter((el) =>
      /Rozpoczęła się walka pomiędzy/.test(el.textContent ?? ""),
    );
    if (hits.length === 0) return null;
    // Najgłębszy element z tą linią to sama linia; kontenerem jest jego rodzic.
    const deepest = hits.reduce((best, el) => (el.contains(best) ? best : el));
    return deepest.parentElement ?? deepest;
  };

  const attach = (found) => {
    observer?.disconnect();
    container = found;
    seenLines = 0;
    previous = new Map();
    observer = new MutationObserver(() => {
      const all = (container.innerText ?? container.textContent ?? "")
        .split("\n")
        .filter((l) => l.trim());
      const fresh = all.slice(seenLines);
      seenLines = all.length;
      if (fresh.length > 0) record(fresh);
    });
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    console.log("[sonda] podpięta pod log walki — bij.");
    record(["(podpięcie)"]);
  };

  // Log pojawia się dopiero po wejściu w walkę, więc szukamy go cyklicznie.
  const timer = setInterval(() => {
    const found = findLog();
    if (found && found !== container) attach(found);
  }, 1000);

  window.margometerProbe = {
    dump: () => {
      // Wersja w wyniku, żeby dało się poznać, czy w karcie nie siedzi jeszcze
      // stara sonda — raz już nas to kosztowało jedną walkę na darmo.
      const out = { wersja: PROBE_VERSION, ksztalt: shape, wpisy: timeline };
      console.log(JSON.stringify(out, null, 2));
      return out;
    },
    stop: () => {
      clearInterval(timer);
      observer?.disconnect();
      console.log("[sonda] zatrzymana.");
    },
    timeline,
  };

  console.log(`[sonda v${PROBE_VERSION}] czekam na walkę. Po walce: margometerProbe.dump()`);
})();
