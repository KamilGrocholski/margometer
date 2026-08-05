/**
 * Sonda protokołu walki — zbiera surowy materiał dowodowy z gry.
 *
 * PO CO. Ten zrzut jest **jedynym materiałem, który da się sprawdzić przeciw
 * grze** — wszystko inne w testach repo produkuje samo. Rozbija go na moduł
 * `bun tools/walka.ts --rozbij`.
 *
 * ⚠️ **OD 2026‑08‑05 TO SAMO ROBI DODATEK** (zębatka → „Tryb deweloperski" →
 * „Zrzut walki", `src/zrzut.ts`) i produkuje plik w TYM SAMYM kształcie —
 * `Zrzut` mieszka dziś w `src/zrzut.ts`, a to narzędzie importuje go stamtąd.
 * Dodatek jest wygodniejszy w każdym zwykłym przypadku: nie trzeba pamiętać
 * przed walką i nie zakłada DRUGIEJ warstwy na `Engine.battle.update`.
 *
 * **Ta sonda mimo to zostaje i ma zostać**, bo odpowiada na pytanie, na które
 * dodatek odpowiedzieć nie może: działa bez instalowania czegokolwiek i jest
 * jedyną drogą, gdy podejrzenie pada na SAM DODATEK. Zrzut zebrany kodem,
 * który się bada, nie świadczy o niczym. Jedna różnica przy rozbijaniu: sonda
 * nie numeruje walk (żyje jedną), więc jej pliki nie wymagają `--walka <n>`.
 *
 * ⚠️ **ZBIERAŁA TU JESZCZE WĘZŁY RENDERU — do 2026‑08‑04.** Dokładała do
 * każdego wywołania linie `.battle-msg` doklejone przez klienta, indeksowane
 * równolegle do `t.m`, żeby dało się wyprowadzić odpowiedniość
 * komunikat ↔ zdanie JEDEN DO JEDNEGO. Na tym stało porównanie protokołu
 * z drugim, niezależnym odczytem walki. Drugiego odczytu nie ma, więc zbieranie
 * węzłów było kosztem bez odbiorcy i zeszło razem z nim.
 *
 * SKĄD BIERZE PROTOKÓŁ. Gra nie dostaje z serwera zdań — dostaje protokół, i cały
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
 * CO ZBIERA POZA SAMYM PROTOKOŁEM, i to jest cały powód, dla którego zrzut
 * z gry bije publiczne zapisy walk: MIGAWKI WOJOWNIKÓW przed i po każdym
 * wywołaniu (`hp.cur`, `hp.max`) oraz `myteam` z ładunku. Bez migawek nie ma
 * krzywej życia (`docs/DECYZJE.md` — „osobna, znacznie głębsza integracja,
 * i nie jest zrobiona"), a bez `myteam` nie da się odróżnić drużyny gracza od
 * przeciwnej — `tools/walka.ts` woli wtedy paść niż zgadnąć.
 *
 * UŻYCIE
 *   1. Otwórz walkę w grze i wklej ten plik do konsoli (sonda potrzebuje
 *      `Engine.battle`, który powstaje dopiero z walką — ale sama na niego
 *      czeka, więc wklejenie zawczasu też jest w porządku).
 *   2. Stocz walkę do końca.
 *   3. `margometerWalka.pobierz()` — zapisuje plik JSON.
 *   4. `bun tools/walka.ts --rozbij <plik> --nazwa <slug>`
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

  const wpisy = [];
  let owinieta = null;
  let oryginal = null;
  let otwarcie = null;

  const zapisz = (t, przed, po) => {
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
      wojownicyPrzed: przed,
      wojownicyPo: po,
    });
  };

  const owin = (battle) => {
    oryginal = battle.update;
    const opakowanie = function (t) {
      const przed = migawka(battle);
      const wynik = oryginal.apply(this, arguments);
      // Migawka PO oryginale: klient aktualizuje wojowników w środku `update`,
      // więc para przed/po obejmuje dokładnie tę porcję zdarzeń.
      zapisz(t, przed, migawka(battle));
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
      console.log(`[walka] wywołań: ${wpisy.length}, komunikatów: ${komunikaty}`);
      if (komunikaty === 0 && wpisy.length > 0) {
        console.warn("[walka] zero komunikatów — `t.m` zmieniło kształt?");
      }
      return { wywolan: wpisy.length, komunikaty, otwarcie };
    },

    zrzut: () => ({
      wersja: WERSJA,
      // ⚠️ **SONDA TEGO POLA NIE PISAŁA I DLATEGO NARZĘDZIE ZGADYWAŁO**
      // (`AUDYT‑64`). `--pokaz` drukowało „źródło: sonda" z wartości domyślnej,
      // nie z pliku — więc zrzut z dodatku bez pola wyglądałby identycznie.
      // Od kiedy piszą je OBIE drogi, brak pola znaczy dokładnie jedno:
      // plik sprzed 2026‑08‑05, o pochodzeniu nie do ustalenia z niego samego.
      zrodlo: "sonda",
      przy: new Date().toISOString(),
      swiat: location.hostname.split(".")[0],
      // Numer builda klienta z nazwy bundla. Bez niego, gdy gra zmieni format,
      // nie da się powiedzieć KTÓRY zrzut jest sprzed zmiany — a materiał
      // z gry bez wersji klienta nie jest danymi porównywalnymi.
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
      // Kotwica w dokumencie, zwolnienie URL-a w następnym takcie — ta sama
      // poprawka co w `src/zrzut.ts` (`AUDYT‑69`) i z tego samego powodu:
      // odczepiony węzeł plus natychmiastowy `revoke` potrafią w Firefoksie
      // przerwać pobieranie po cichu. Sonda ma zostać zamienna z dodatkiem
      // co do bajta, więc obie drogi zapisują tak samo.
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
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
      `Potem: bun tools/walka.ts --rozbij <pobrany plik> --nazwa <slug>`,
  );
})();
