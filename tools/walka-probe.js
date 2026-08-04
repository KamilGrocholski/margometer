/**
 * Sonda protokołu walki — zbiera to, CZEGO REPO NIE MA: jedną walkę zapisaną
 * naraz jako protokół silnika i jako tekst z okna.
 *
 * PO CO. `docs/ROADMAP.md` nazywa tę parę „największą dziś dziurą i jedyną
 * pozycją, której nie da się załatać bez gracza". Bez niej protokół i tekst są
 * dwoma korpusami odpowiadającymi na różne pytania i nic nie sprawdza liczb
 * parsera przeciw czemukolwiek spoza repo. Z nią protokół staje się
 * NIEZALEŻNYM ORAKULEM: obrażenia per postać, bloki, leczenie, krzywa życia.
 *
 * SKĄD BIERZE PROTOKÓŁ. Okno walki nie dostaje zdań — dostaje protokół, i cały
 * przechodzi przez jedno wywołanie `Engine.battle.update(t)`. `t.m` to tablica
 * surowych komunikatów serwera (`id=hpp;id=hpp;klucz=wartość;…`), z których
 * renderer klienta dopiero składa polskie zdania. Sonda owija to wywołanie,
 * zapisuje ładunek BEZ INTERPRETACJI i przepuszcza dalej.
 *
 * ⚠️ TO PODMIENIA FUNKCJĘ SILNIKA GRY. Dodatek tego nie robi — `AGENTS.md`
 * obiecuje „nie dotyka stanu gry" i ta obietnica jest prawdziwa dopóty, dopóki
 * podmiana siedzi tutaj, w `tools/`. Sonda niczego nie wysyła i nie zmienia
 * przebiegu walki: woła oryginał, zwraca jego wynik, a zapis trzyma w pamięci
 * karty do czasu `pobierz()`.
 *
 * CO ZBIERA, poza samym protokołem — bo protokół sam w sobie mamy już
 * z grooove.pl, a tego nie mamy:
 *   1. WĘZŁY RENDERU doklejone w tym samym wywołaniu, indeksowane równolegle
 *      do `t.m`. To daje odpowiedniość komunikat ↔ zdanie JEDEN DO JEDNEGO,
 *      czyli materiał, z którego mapowanie protokół→parser wyprowadza się
 *      z danych, zamiast być zgadywane.
 *   2. MIGAWKI WOJOWNIKÓW przed i po każdym wywołaniu (`hp.cur`, `hp.max`).
 *      To jest krzywa życia z `docs/DECYZJE.md:277` — „osobna, znacznie głębsza
 *      integracja, i nie jest zrobiona".
 *
 * UŻYCIE
 *   1. Otwórz walkę w grze i wklej ten plik do konsoli (sonda potrzebuje
 *      `Engine.battle`, który powstaje dopiero z walką — ale sama na niego
 *      czeka, więc wklejenie zawczasu też jest w porządku).
 *   2. Stocz walkę do końca.
 *   3. `margometerWalka.pobierz()` — zapisuje plik JSON.
 *   4. W oknie walki naciśnij „Kopiuj logi" i wklej wynik do `raw.txt`.
 *      Sonda tego NIE robi za ciebie: tekst z tego przycisku jest osobnym
 *      dowodem i ma pochodzić z gry, nie z naszego sklejania węzłów.
 *   5. `bun tools/walka.ts --rozbij <plik> --nazwa <slug>`
 *
 * Podgląd bez zapisu: `margometerWalka.stan()`. Zdjęcie sondy: `.stop()`.
 */
(() => {
  const WERSJA = 1;
  // Zdjęcie poprzedniej sondy PRZED założeniem nowej. Bez tego drugie wklejenie
  // zakłada warstwę na warstwie i każdy komunikat zapisuje się dwa razy.
  window.margometerWalka?.stop?.();

  const silnik = () => window.Engine ?? window.getEngine?.() ?? null;

  /** Kolekcja wojowników. `warriorsList` jest tym, po czym chodzi renderer. */
  const wojownicy = (battle) => {
    if (!battle || typeof battle !== "object") return [];
    for (const pole of ["warriorsList", "warriors"]) {
      const kolekcja = battle[pole];
      if (!kolekcja || typeof kolekcja !== "object") continue;
      const lista = Object.values(kolekcja).filter(
        (w) => w && typeof w === "object" && typeof w.name === "string" && w.name !== "",
      );
      if (lista.length > 0) return lista;
    }
    return [];
  };

  /**
   * Migawka stanu wojowników — tylko liczby i nazwy.
   *
   * Nie `structuredClone` całego obiektu: wojownik niesie referencje do węzłów
   * DOM i do samego silnika, więc klonowanie albo rzuca, albo wciąga pół gry
   * do zrzutu. Pola wybrane pod pytanie „komu i ile spadło", plus te, które
   * `docs/DECYZJE.md:236‑264` już raz zweryfikowało sondą `engine-probe.js`.
   */
  const migawka = (battle) =>
    wojownicy(battle).map((w) => ({
      id: w.id ?? w.originalId ?? null,
      name: w.name,
      team: w.team ?? null,
      prof: w.prof ?? null,
      lvl: w.lvl ?? null,
      hp: w.hp && typeof w.hp === "object" ? { ...w.hp } : (w.hp ?? null),
      mana: w.mana ?? null,
      energy: w.energy ?? null,
      ac: w.ac && typeof w.ac === "object" ? { ...w.ac } : (w.ac ?? null),
    }));

  /**
   * Węzły renderu. `battle-msg` to klasa nadawana przez klienta każdej linii
   * logu (widać ją w `tests/fixtures/new-engine/*&#47;log.html`).
   *
   * Selektor jest tu świadomym wyjątkiem od zasady z `src/source.ts`, gdzie
   * kontener szukamy PO TREŚCI, bo selektory gra potrafi zmienić. Tam kosztem
   * pomyłki jest panel liczący źle u gracza; tu — jedno nieudane zbieranie
   * fixture'a, które widać od razu (`stan()` pokaże zero węzłów). Za tę cenę
   * dostajemy granicę linii dokładnie tam, gdzie stawia ją klient.
   */
  const wezly = () => [...document.querySelectorAll(".battle-msg")];

  const wpisy = [];
  let owinieta = null;
  let oryginal = null;
  let otwarcie = null;

  const zapisz = (t, przed, po, nowe) => {
    // `t` jest cudzym obiektem i żyje dalej po naszym powrocie — kopiujemy go
    // przez JSON, żeby zrzut nie pokazał stanu z KOŃCA walki zamiast z chwili
    // wywołania. To samo dotyczy `t.m`.
    let ladunek;
    try {
      ladunek = JSON.parse(JSON.stringify(t));
    } catch (blad) {
      ladunek = { blad: String(blad) };
    }
    const komunikaty = Array.isArray(t?.m)
      ? [...t.m]
      : t?.m && typeof t.m === "object"
        ? Object.values(t.m)
        : [];

    wpisy.push({
      nr: wpisy.length,
      ladunek,
      komunikaty,
      render: nowe.map((w) => w.outerHTML),
      wojownicyPrzed: przed,
      wojownicyPo: po,
    });

    // Rozjazd liczb jest jedyną rzeczą, która psuje parę cicho — węzeł bez
    // komunikatu albo odwrotnie znaczy, że indeksowanie równoległe nie trzyma.
    if (komunikaty.length !== nowe.length) {
      console.warn(
        `[walka] wywołanie ${wpisy.length - 1}: ${komunikaty.length} komunikatów, ` +
          `${nowe.length} węzłów renderu — para dla tego wywołania jest niepewna.`,
      );
    }
  };

  const owin = (battle) => {
    oryginal = battle.update;
    const opakowanie = function (t) {
      const przed = migawka(battle);
      const bylo = wezly().length;
      const wynik = oryginal.apply(this, arguments);
      // Migawka PO oryginale: klient aktualizuje wojowników w środku `update`,
      // więc para przed/po obejmuje dokładnie tę porcję zdarzeń.
      zapisz(t, przed, migawka(battle), wezly().slice(bylo));
      return wynik;
    };
    opakowanie.__margometer = WERSJA;
    battle.update = opakowanie;
    owinieta = battle;

    const linia = document.body?.innerText?.match(/Rozpoczęła się walka pomiędzy.*/);
    otwarcie = linia?.[0] ?? null;
    console.log(`[walka v${WERSJA}] podpięta pod Engine.battle.update — bij.`);
  };

  // `Engine.battle` powstaje razem z walką i bywa podmieniany między walkami,
  // więc pilnujemy tożsamości obiektu, a nie samego faktu, że sonda już stała.
  const zegar = setInterval(() => {
    const battle = silnik()?.battle;
    if (!battle || typeof battle.update !== "function") return;
    if (battle === owinieta && battle.update.__margometer === WERSJA) return;
    owin(battle);
  }, 500);

  window.margometerWalka = {
    stan: () => {
      const komunikaty = wpisy.reduce((suma, w) => suma + w.komunikaty.length, 0);
      const render = wpisy.reduce((suma, w) => suma + w.render.length, 0);
      console.log(
        `[walka] wywołań: ${wpisy.length}, komunikatów: ${komunikaty}, węzłów renderu: ${render}`,
      );
      if (render === 0 && komunikaty > 0) {
        console.warn("[walka] zero węzłów renderu — klasa `.battle-msg` się zmieniła?");
      }
      return { wywolan: wpisy.length, komunikaty, render, otwarcie };
    },

    zrzut: () => ({
      wersja: WERSJA,
      przy: new Date().toISOString(),
      swiat: location.hostname.split(".")[0],
      // Numer builda klienta z nazwy bundla. `meta.json` w korpusie ma pole
      // `clientBuild` i we WSZYSTKICH dzisiejszych fixture'ach stoi w nim
      // `null` — bo dotąd nie było skąd go wziąć. Stąd, kiedy gra zmieni
      // format, da się powiedzieć KTÓRY zrzut jest sprzed zmiany.
      build: [...document.querySelectorAll("script[src]")]
        .map((s) => s.src.match(/main\.min(\d+)\.js/)?.[1])
        .find((b) => b !== undefined) ?? null,
      otwarcie,
      wpisy,
    }),

    /**
     * Zapis do pliku zamiast do schowka. Zrzut z dziesięciominutowej walki to
     * kilkaset kilobajtów — `navigator.clipboard` bywa na tyle odmowny bez
     * gestu użytkownika, że nie nadaje się na jedyną drogę wyjścia.
     */
    pobierz: () => {
      const dane = window.margometerWalka.zrzut();
      const nazwa = `walka-${dane.swiat}-${dane.przy.replace(/[:.]/g, "-")}.json`;
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(dane)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = nazwa;
      a.click();
      URL.revokeObjectURL(url);
      console.log(`[walka] zapisane: ${nazwa}`);
      return nazwa;
    },

    wyczysc: () => {
      wpisy.length = 0;
      console.log("[walka] zapis wyczyszczony.");
    },

    stop: () => {
      clearInterval(zegar);
      // Przywrócenie oryginału tylko wtedy, gdy na wierzchu stoi NASZE
      // opakowanie — inaczej zdjęlibyśmy cudzą warstwę założoną po nas.
      if (owinieta && owinieta.update?.__margometer === WERSJA && oryginal) {
        owinieta.update = oryginal;
      }
      console.log("[walka] zatrzymana.");
    },

    wpisy,
  };

  console.log(
    `[walka v${WERSJA}] czekam na walkę. Po walce: margometerWalka.pobierz()\n` +
      `Potem osobno przycisk „Kopiuj logi" w oknie walki — to jest drugi dowód.`,
  );
})();
