import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { FIXTURY, swiadekZycia, type Fixtura } from "./fixtury.ts";
import { cios, leczenie, trafienie } from "./zdarzenia.ts";
import { graniceWalk, stronyKomunikatu } from "../tools/walka.ts";
import { KOMUNIKATY, SKLAD } from "./walka-z-gry.ts";
import { dekoduj } from "../src/protokol.ts";
import { aggregate } from "../src/stats.ts";

/**
 * Niezmienniki chodzące po SUROWYM materiale z gry — `tests/fixtures/*.json`.
 *
 * ⚠️ **TEN PLIK JEST WARUNKIEM, POD KTÓRYM KATALOG Z PLIKAMI DANYCH W OGÓLE
 * WRÓCIŁ.** Zarzut, który 2026‑08‑04 przeważył na rzecz modułów TS, brzmiał:
 * „katalog z fixture'em dało się dołożyć do repo bez dotknięcia jednego testu —
 * leżał wtedy martwy i nikt tego nie widział" (`6fc7ef6`). Odpowiedzią nie jest
 * obietnica, że ktoś dopisze test; odpowiedzią jest **odkrywanie plików**.
 * Zrzut wrzucony do katalogu jest sprawdzany od razu, a nikt go nigdzie nie
 * wymienia z nazwy. Martwy fixture nie ma tu jak powstać.
 *
 * DLACZEGO OSOBNO OD `tests/stats.test.ts`. Tamte niezmienniki widzą już tylko
 * `BattleEvent[]` — po dekoderze. Tutaj stoi to, co wymaga SUROWEGO zrzutu:
 * `hp.max` z migawki, ładunek z `myteam`, nagłówek z pochodzeniem. Fixture'y
 * przechodzą przez OBA miejsca: `tests/korpus.ts` wciąga je do `KORPUS`, więc
 * niezmienniki agregatu obejmują je bez ani jednej asercji dopisanej tam.
 */

/**
 * Katalog nie może być pusty, a ścieżka do niego nie może być literówką.
 *
 * OSOBNY TEST, nie asercja w pętli — i to jest cała jego racja bytu. Pętla po
 * pustym katalogu jest zielona i nie robi nic; repo ma to zapisane wprost
 * („zdarzyły się tu testy zielone i puste", `AGENTS.md`). Bez tego strażnika
 * przemianowanie katalogu wygaszałoby wszystkie niezmienniki niżej po cichu.
 */
test("katalog fixture'ów istnieje i coś w nim leży", () => {
  expect(FIXTURY.length).toBeGreaterThan(0);
});

/**
 * Moduł `tests/walka-z-gry.ts` jest KOPIĄ jednego z fixture'ów i ma nią zostać.
 *
 * Powód jest zmierzony, nie teoretyczny: dopóki moduł był jedynym zapisem tej
 * walki, jego nagłówek podawał build `1781609507010` — deweloperski, sześć
 * tygodni starszy od materiału. Nikt tego nie zauważył przez dobę, bo nie było
 * z czym porównać. Teraz jest.
 *
 * Test porównuje DANE, nie nagłówek: gdyby ktoś poprawił komunikat w module,
 * żeby test przeszedł, zapali się tutaj.
 */
test("moduł z tej walki nie rozjeżdża się z fixture'em", () => {
  const f = FIXTURY.find((x) => x.nazwa === "2026-08-04-tempest-lowca-vs-odyncze");
  // Sam `find` nie wystarcza: gdyby fixture zniknął albo zmienił nazwę, test
  // bez tej asercji byłby zielony i pusty.
  expect(f).toBeDefined();
  expect(f!.komunikaty).toEqual(KOMUNIKATY);
  expect(f!.sklad).toEqual(SKLAD);
});

/**
 * NAGŁÓWEK MODUŁU TEŻ MA SIĘ ZGADZAĆ Z ORYGINAŁEM — i to jest test, którego
 * właśnie brakowało (`AUDYT‑78`).
 *
 * Test wyżej porównuje DANE i mówi o sobie, że nagłówka nie rusza. Tyle że
 * całą motywacją tamtego testu jest błędny build `1781609507010` w nagłówku:
 * numer przepisany ręką, sześć tygodni starszy od walki, niezauważony przez
 * dobę. **Ten sam błąd przeszedłby dziś tak samo cicho** — `f.zrzut.build`
 * leżał w tamtym teście obok, nieporównywany.
 *
 * Czytamy plik jako TEKST, bo build stoi w prozie komentarza, a nie w eksporcie.
 * To jedyne miejsce w testach, które tak robi, i ma powód: nagłówek jest
 * twierdzeniem o pochodzeniu materiału, więc podlega tej samej regule co dane.
 */
test("nagłówek modułu podaje build i świat z fixture'a, nie z pamięci człowieka", () => {
  const f = FIXTURY.find((x) => x.nazwa === "2026-08-04-tempest-lowca-vs-odyncze");
  expect(f).toBeDefined();
  const zrodlo = readFileSync(new URL("./walka-z-gry.ts", import.meta.url).pathname, "utf8");
  const naglowek = zrodlo.slice(0, zrodlo.indexOf("*/"));

  expect(naglowek).toContain(f!.zrzut.build!);
  expect(naglowek).toContain(f!.zrzut.swiat);
});

describe.each(FIXTURY)("$nazwa", (f: Fixtura) => {
  const zdarzenia = dekoduj(f.komunikaty, f.sklad);
  const stats = aggregate(zdarzenia, f.sklad);

  test("nagłówek mówi, skąd materiał pochodzi", () => {
    // Bez świata i builda zrzut przestaje być materiałem porównywalnym: gdy gra
    // zmieni format, nie da się powiedzieć, KTÓRY plik jest sprzed zmiany.
    expect(f.zrzut.swiat).not.toBe("");
    expect(f.zrzut.swiat).not.toBe("nieznany");
    expect(f.zrzut.build).not.toBeNull();
  });

  /**
   * JEDEN PLIK TO JEDNA WALKA — i to jest niezmiennik, który już raz zadziałał.
   *
   * `--zachowaj` odmawia sklejonym zrzutom, ale narzędzie chroni tylko drogę
   * przez narzędzie; plik skopiowany ręcznie omija je w całości. Sklejony
   * fixture jest najgorszym rodzajem błędu, jaki to repo zna: przechodzi każdy
   * inny niezmiennik i kłamie o tym, kto z kim walczył.
   *
   * Sprawdzone na materiale: pierwszy zrzut z dodatku niósł dwie walki pod
   * jednym numerem `walka`, bo gra nie wymienia obiektu `Engine.battle` między
   * starciami. Cytaty z klienta: `docs/MECHANIKA.md`, wpis „Granica walk".
   */
  test("jeden plik to jedna walka — `init` dokładnie raz i na początku", () => {
    const granice = graniceWalk(f.zrzut.wpisy);

    // ⚠️ **STAŁO TU `toBeLessThanOrEqual(1)`, CZYLI ZERO TEŻ PRZECHODZIŁO**
    // (`AUDYT‑60`). Zero granic to nie „plik czysty", tylko **plik, o którym
    // nie wiadomo** — zrzut zebrany od środka walki wygląda tak samo jak ogon
    // walki pierwszej sklejony z całą drugą. To była ślepa plamka dokładnie tam,
    // gdzie sito miało patrzeć, a razem z dziurą w teście duchów niżej sklejony
    // fixture bez `init` przechodził OBA niezmienniki.
    //
    // Koszt tej zmiany, żeby nie był niespodzianką: materiał zbierany od środka
    // walki do repo nie wejdzie. Obie udokumentowane drogi dają `init` — sondę
    // wkleja się PRZED walką, a tryb deweloperski raz włączony zostaje.
    // Gdy kiedyś przyjdzie zrzut bez `init`, ten test zapali się głośno i wtedy
    // zapadnie decyzja; cicha zieleń jej nie zastąpi.
    expect(granice.length).toBe(1);
    expect(granice[0]).toBe(f.zrzut.wpisy[0]?.nr);
  });

  test("skład nie ma duchów — każdy wojownik pada w komunikacie", () => {
    // Druga strona tego samego sita, od strony skutku: sklejenie dwóch walk
    // wciąga do składu postacie, których w komunikatach nie ma. Gdyby gra
    // kiedyś przysłała przyzwanie w trakcie walki, ten test zapali się
    // FAŁSZYWIE — i to jest właściwe zachowanie („nieznane ma być głośne”),
    // bo takiego materiału repo dziś nie ma i nikt nie wie, jak wygląda.
    //
    // ⚠️ **STAŁO TU `wSurowym.includes(String(w.id))` I SITO BYŁO DZIURAWE**
    // (`AUDYT‑60`). Podciąg cyfr trafia się wszędzie, więc duch przechodził, gdy
    // jego `id` siedziało w cudzym `id`, w kwocie obrażeń albo w nagrodzie.
    // Zmierzone na TYM materiale — niewykryte byłyby duchy `2845` (w `482845`),
    // `-25596` (w `-255967`), `255967` bez minusa (czyli INNY wojownik), `466`
    // (z `+dmgd=466`), `3973` (z `+exp=3973`) i `13` (z `-legbon_facade=13`).
    // `stronyKomunikatu` rozcina komunikat tak, jak robi to dekoder, więc
    // porównanie idzie po REALNYCH stronach zdarzenia, nie po cyfrach w tekście.
    const wKomunikatach = new Set(
      f.komunikaty.flatMap((komunikat) => stronyKomunikatu(komunikat).map((s) => s.id)),
    );
    const duchy = f.sklad.filter((w) => !wKomunikatach.has(w.id)).map((w) => w.name);

    expect(duchy).toEqual([]);
  });

  test("skład da się wyprowadzić — zrzut niesie `myteam`", () => {
    // `skladZeZrzutu` woli paść niż zgadnąć strony, więc fixture bez `myteam`
    // przewróciłby ładowanie. Tu sprawdzamy skutek: skład jest i ma obie strony.
    expect(f.sklad.length).toBeGreaterThan(1);
    expect(new Set(f.sklad.map((w) => w.side))).toEqual(new Set([0, 1]));
  });

  test("dekoder coś z tego składa", () => {
    // Zero zdarzeń przy niezerowej liczbie komunikatów znaczy, że dekoder
    // przestał rozumieć materiał W CAŁOŚCI — a wtedy każdy niezmiennik niżej
    // jest zielony, bo nie ma po czym chodzić.
    expect(f.komunikaty.length).toBeGreaterThan(0);
    expect(zdarzenia.length).toBeGreaterThan(0);
  });

  test("każdy klucz rozpoznany — zero nieznanych komunikatów", () => {
    expect(stats.unknownLines).toBe(0);
  });

  test("każdy żywioł nazwany — zero nieznanych kodów `dmgX`", () => {
    expect(stats.unknownElements).toEqual([]);
  });

  /**
   * ŚWIADEK SPOZA DEKODERA — i jedyny, jaki to repo dziś ma.
   *
   * `AGENTS.md` nazywa największą otwartą lukę: „Składanie zdarzeń nie ma dziś
   * świadka spoza repo". Zniknął razem z `tests/orakulum.test.ts`, który
   * porównywał dekoder z DRUGIM, rozłącznym odczytem tej samej walki. Drugiego
   * odczytu nie ma i nie będzie — ale okazuje się, że sam protokół niesie dość,
   * żeby część tej roli odtworzyć.
   *
   * KONSTRUKCJA. Protokół podaje przy każdym komunikacie procent życia celu
   * (`-255967=68.15`). Migawka wojownika niesie `hp.max` (763). To są liczby
   * **z dwóch różnych miejsc** i nikt u nas ich nie uzgadnia — pierwsza idzie
   * przez `rozbierz`, druga w ogóle nie przechodzi przez dekoder. Skumulowane
   * obrażenia muszą więc trafić w podany procent:
   *
   *     763 − 243 = 520;  520 / 763 = 68,15 %
   *
   * ⚠️ **STAŁ TU PRZYKŁAD `763 − 225 = 538; 538/763 = 70,51 %` Z `id -255970`
   * I NIE POCHODZIŁ Z ŻADNEGO MATERIAŁU** (`AUDYT‑59`). Żadnej z tych liczb nie
   * ma w `tests/fixtures/` — ani `70.51`, ani `225`, ani `538`, ani takiego `id`.
   * Przyszły z zrzutu, który odpadł jako sklejony, i zostały w prozie. Powyższy
   * przykład jest policzony z pliku, który leży w repo.
   *
   * ZMIERZONE na materiale, który JEST: **7 porównań, 0 rozjazdów**. Dekoder
   * sumujący `raw` zamiast `applied` daje **6 rozjazdów**, czyli zapala 6 z 7 —
   * i ta jedna liczba z dawnego opisu była prawdziwa. („16 trafień na dwóch
   * walkach" nie było; `AUDYT‑58`.)
   *
   * ⚠️ **CZEGO TEN ŚWIADEK NIE OBEJMUJE.** Tylko obrażenia. Cel, który padł,
   * wypada z porównania, bo protokół podaje wtedy `0.00` i nie widać przebicia.
   * Blok i absorpcja **przechodzą** przez `applied` (to liczby PO redukcji),
   * więc niesprawdzone są wyłącznie ich osobne składniki — a tych w materiale
   * nie ma. Świadek jest CZĘŚCIOWY i tak ma być opisany.
   *
   * ⚠️ **LECZENIE NIE JEST „POZA POKRYCIEM" — ONO PSUJE BAZĘ** (`AUDYT‑61`).
   * Stało tu, że leczenie „nie zmienia procentu w sposób, który da się stąd
   * sprawdzić", i było to niedopowiedzenie: uleczenie przesuwa punkt odniesienia
   * dla KAŻDEGO późniejszego porównania tego celu, więc suma obrażeń przestaje
   * odpowiadać procentowi. Test przechodził wyłącznie przez przypadek materiału
   * — jedyne leczenie w tym pliku pada na gracza po jego ostatnim zranieniu.
   * Pierwszy fixture z leczeniem w ŚRODKU walki zapaliłby świadka na POPRAWNYM
   * dekoderze, czyli dałby sygnał, który uczy ludzi ignorować test.
   *
   * Dlatego uleczony cel wypada z porównań od chwili uleczenia. Doliczanie
   * `amount` do bazy byłoby dokładniejsze tylko pozornie: leczenie ponad pulę
   * życia jest ucinane przez grę i log nie mówi, ile z niego weszło. To jest ta
   * sama reguła co wszędzie indziej — nie udawaj danych, których log nie ma.
   *
   * Tolerancja 0,02 punktu procentowego, bo gra podaje procent zaokrąglony do
   * dwóch miejsc — nie dlatego, że coś się nie zgadza.
   */
  test("procent życia z protokołu zgadza się z obrażeniami z dekodera", () => {
    const wynik = swiadekZycia(zdarzenia, f.maksZycia);

    expect(wynik.rozjazdy).toEqual([]);
    // Bez tego test byłby zielony także wtedy, gdyby `maksZycia` przestało
    // cokolwiek nieść — czyli gdyby świadka po prostu zabrakło.
    expect(wynik.sprawdzonych).toBeGreaterThan(0);
    // ⚠️ **A TO JEST ODPOWIEDŹ NA CICHĄ DEGRADACJĘ** (`AUDYT‑61`). Strażnik
    // wyżej łapie wyłącznie CAŁKOWITY zanik świadka: gdyby `hp.max` przestało
    // się czytać dla trzech celów z czterech, test przechodziłby na jednym
    // porównaniu i nikt by tego nie zobaczył. Tu stoi mocniejsze zdanie —
    // **każdy cel, który nadawał się do porównania, ma znane `hp.max`**. Gdy
    // kiedyś nie będzie miał, to jest wiadomość o materiale albo o migawkach
    // i ma zapalić się głośno, zamiast odjąć jedno porównanie po cichu.
    expect(wynik.bezMaksa).toBe(0);
  });
});

/**
 * Świadek na zdarzeniach ZBUDOWANYCH W KODZIE — i to nie jest dublowanie pętli
 * wyżej.
 *
 * ⚠️ **POWÓD JEST TAKI, ŻE MATERIAŁU NA TO NIE MA** (`AUDYT‑61`). Jedyne
 * leczenie w `tests/fixtures/` pada na gracza PO jego ostatnim zranieniu, więc
 * obsługa leczenia w świadku niczego tam nie zmienia: zdjęcie jej zostawia
 * 7 porównań i 0 rozjazdów, dokładnie jak przedtem. Kod bez ani jednego
 * świadka jest kodem, o którym nie wiadomo, czy działa — a ten akurat pilnuje,
 * żeby świadek nie zapalał się FAŁSZYWIE na poprawnym dekoderze.
 *
 * Fixture'ów to nie zastępuje i nie ma zastępować: tu sprawdzamy REGUŁĘ, tam
 * materiał. Gdy kiedyś wejdzie zrzut z leczeniem w środku walki, to on będzie
 * właściwym świadkiem, a ten test zostanie jako opis intencji.
 */
describe("świadek życia — reguła leczenia", () => {
  const MAKS = new Map([[7, 1000]]);

  test("uleczony cel wypada z porównań, zamiast zapalać fałszywy rozjazd", () => {
    // 1000 → −300 (70 %) → uleczony do 900 (90 %) → −100 (80 %).
    // Sumujący ślepo dekoder policzyłby (1000 − 400) / 1000 = 60 % i zgłosił
    // rozjazd, choć zarówno gra, jak i dekoder mają rację.
    const wynik = swiadekZycia(
      [
        cios("Gracz", "Cel", [trafienie(300)], { targetId: 7, targetHpPct: 70 }),
        leczenie("Cel", 200, { targetId: 7 }),
        cios("Gracz", "Cel", [trafienie(100)], { targetId: 7, targetHpPct: 80 }),
      ],
      MAKS,
    );

    expect(wynik.rozjazdy).toEqual([]);
    expect(wynik.sprawdzonych).toBe(1);
    expect(wynik.poLeczeniu).toBe(1);
  });

  test("bez leczenia ten sam cel jest porównywany do końca", () => {
    // Para dla testu wyżej: gdyby świadek odrzucał cele z byle powodu, tamten
    // byłby zielony z niewłaściwej przyczyny. Tu ma policzyć OBA porównania.
    const wynik = swiadekZycia(
      [
        cios("Gracz", "Cel", [trafienie(300)], { targetId: 7, targetHpPct: 70 }),
        cios("Gracz", "Cel", [trafienie(100)], { targetId: 7, targetHpPct: 60 }),
      ],
      MAKS,
    );

    expect(wynik.rozjazdy).toEqual([]);
    expect(wynik.sprawdzonych).toBe(2);
    expect(wynik.poLeczeniu).toBe(0);
  });

  test("nieznane `hp.max` jest liczone osobno, a nie pomijane po cichu", () => {
    const wynik = swiadekZycia(
      [cios("Gracz", "Cel", [trafienie(300)], { targetId: 99, targetHpPct: 70 })],
      MAKS,
    );

    expect(wynik.sprawdzonych).toBe(0);
    expect(wynik.bezMaksa).toBe(1);
  });
});
