import { describe, expect, test } from "bun:test";
import {
  buildKlienta,
  cialoRenderera,
  etykietyRenderera,
  identyfikatoryKandydujace,
  indeksTlumaczen,
  modulZamrozenia,
  slownikZeZamrozenia,
  tabela,
  werdykt,
  zamrozenie,
  type Zamrozenie,
  zdanieDlaIdentyfikatora,
} from "../tools/slownik.ts";

/**
 * Czego te testy pilnują: NIE tego, co wypisuje gra — to zmienia się poza nami
 * i ma własny rejestr (`docs/MECHANIKA.md`). Tego, żeby narzędzie nie zgubiło
 * zdania ani nie podało cudzego.
 *
 * Fałszywy negatyw jest tu groźniejszy niż brak narzędzia: „gra tego nie
 * wypisuje" trafia do rejestru jako odpowiedź i zamyka temat. To repo ma już
 * dwa takie zapisy, oba nieprawdziwe. Wszystkie wejścia są syntetyczne — sieci
 * w testach nie ma, wzór z `tests/pomoc.test.ts`.
 */

/** Miniatura kształtu, który ma w środku bundle klienta. */
const BUNDLE = [
  "var x=1;",
  "this.battleMsg=function(i,a,o,l,c){",
  'switch(O[0]){case"heal":_[1]+=_t("msg_heal %val%",{});break;',
  'case"a":case"b":_[1]+=_t("msg_wspolny");break;',
  'case"pusty":break;',
  'case"liczba":w+="<b>"+O[1]+"</b>";break;',
  'case"+crush_physical":case"+crush_distance":var B;',
  'switch(O[0].replace("+crush_","")){case"fire":B="ff5f5f";break;case"physical":B="ffffff"}',
  '_[1]+=_t("eng_only_+crush %val%",{});break;',
  'case"zlozony":_[1]+=_t("msg_only_val_"+O[0],{});break;',
  "}",
  "};",
  "var y=2;",
].join("");

const SLOWNIK = [
  "__translations={battle:{",
  '"msg_heal %val%":"%val% punktów życia %name%",',
  'msg_wspolny:"Wspólne zdanie",',
  '"eng_only_+crush %val%":"+Zmiażdżenie %val%%",',
  'msg_only_val_zlozony:"Zdanie złożonego",',
  '"msg_heal %val%":"DUPLIKAT, ma przegrać"',
  "}};",
].join("");

describe("cialoRenderera", () => {
  test("wycina dokładnie funkcję, bez kodu obok", () => {
    const cialo = cialoRenderera(BUNDLE);
    expect(cialo.startsWith("this.battleMsg=function")).toBe(true);
    expect(cialo.endsWith("}")).toBe(true);
    expect(cialo).not.toContain("var y=2");
    expect(cialo).not.toContain("var x=1");
  });

  test("brak renderera to błąd z powodem, nie ciche puste wyjście", () => {
    // Puste wyjście przeszłoby dalej jako „zero etykiet" i wyglądało jak
    // odpowiedź „gra nie wypisuje niczego" — czyli najgorszy możliwy wynik.
    expect(() => cialoRenderera("var a=1;")).toThrow(/battleMsg/);
  });
});

describe("etykietyRenderera", () => {
  const etykiety = etykietyRenderera(cialoRenderera(BUNDLE));
  const mapa = new Map(etykiety.map((e) => [e.klucz, e.cialo]));

  test("fallthrough daje ciało OBU kluczom łańcucha", () => {
    // Bez dziedziczenia wstecz `a` dostaje ciało puste i wypada jako „gra tego
    // nie wypisuje". Na prawdziwym bundlu kosztowało to 22 klucze z 240.
    expect(mapa.get("a")).toContain("msg_wspolny");
    expect(mapa.get("b")).toContain("msg_wspolny");
  });

  test("etykiety zagnieżdżonego switcha nie są kluczami protokołu", () => {
    // `case"fire"` i `case"physical"` w środku `+crush_*` to wybór KOLORU,
    // nie klucz protokołu. Płaski podział wciągał je do tabeli.
    expect(mapa.has("fire")).toBe(false);
    expect(mapa.has("physical")).toBe(false);
  });

  test("zagnieżdżony switch nie ucina ciała klucza, w którym stoi", () => {
    // Regresja na fałszywy negatyw: przed poprawką ciało `+crush_physical`
    // kończyło się na `case"fire"`, więc nie było w nim `_t` i narzędzie
    // meldowało „gra tego nie wypisuje" o kluczu, który linię wypisuje.
    expect(mapa.get("+crush_physical")).toContain("eng_only_+crush");
    expect(mapa.get("+crush_distance")).toContain("eng_only_+crush");
  });

  test("kolejność etykiet jest zachowana", () => {
    expect(etykiety.map((e) => e.klucz).slice(0, 3)).toEqual(["heal", "a", "b"]);
  });
});

describe("identyfikatoryKandydujace", () => {
  test("literał `_t(\"…\")` jest brany", () => {
    expect(identyfikatoryKandydujace("heal", '_t("msg_heal %val%",{})')).toContain(
      "msg_heal %val%",
    );
  });

  test("sklejenie z kluczem po lewej", () => {
    expect(identyfikatoryKandydujace("x", '_t("msg_only_val_"+O[0],{})')).toContain(
      "msg_only_val_x",
    );
  });

  test("sklejenie z obu stron", () => {
    expect(identyfikatoryKandydujace("x", '_t("eng_"+O[0]+" %name%",{})')).toContain(
      "eng_x %name%",
    );
  });

  test("ślepe strzały stoją NA KOŃCU, za tym, co mówi kod", () => {
    // Kolejność jest tu treścią: `msg_<klucz>` bywa w słowniku i wygrałby
    // z identyfikatorem, którego renderer naprawdę używa.
    const kandydaci = identyfikatoryKandydujace("heal", '_t("msg_heal %val%",{})');
    expect(kandydaci.indexOf("msg_heal %val%")).toBeLessThan(kandydaci.indexOf("heal"));
  });
});

describe("indeksTlumaczen", () => {
  const indeks = indeksTlumaczen(SLOWNIK);

  test("bierze klucze w cudzysłowach i bez", () => {
    expect(indeks.get("msg_heal %val%")).toBe("%val% punktów życia %name%");
    expect(indeks.get("msg_wspolny")).toBe("Wspólne zdanie");
  });

  test("przy powtórzeniu wygrywa pierwsze wystąpienie", () => {
    // Dwa przebiegi po pliku (klucze w cudzysłowach i gołe) mogłyby dać wynik
    // zależny od ich kolejności. Ma nie zależeć.
    expect(indeks.get("msg_heal %val%")).not.toBe("DUPLIKAT, ma przegrać");
  });
});

describe("zdanieDlaIdentyfikatora", () => {
  const indeks = indeksTlumaczen(SLOWNIK);

  test("trafienie dokładne", () => {
    expect(zdanieDlaIdentyfikatora(indeks, "msg_wspolny")?.zdanie).toBe("Wspólne zdanie");
  });

  test("dopasowanie po rdzeniu, gdy kod woła wariant z inną liczbą podstawień", () => {
    expect(zdanieDlaIdentyfikatora(indeks, "msg_heal %val0% %val1%")?.identyfikator).toBe(
      "msg_heal %val%",
    );
  });

  test("pusty rdzeń nie łapie wpisu o pustym kluczu", () => {
    // Identyfikator zaczynający się od podstawienia (`" %val%"`) ma rdzeń pusty.
    // Bez strażnika porównanie `wpis === rdzen` trafiałoby w pusty klucz
    // słownika i narzędzie podałoby CUDZE zdanie — gorzej niż brak odpowiedzi.
    //
    // Słownik z pustym kluczem jest tu konieczny: bez niego test przechodzi
    // także z usuniętym strażnikiem, czyli byłby zielony i pusty.
    const zPustym = indeksTlumaczen('{"":"cudze zdanie","msg_x":"x"}');
    expect(zPustym.get("")).toBe("cudze zdanie");
    expect(zdanieDlaIdentyfikatora(zPustym, " %val%")).toBeNull();
  });

  test("brak trafienia to null, nie wyjątek", () => {
    expect(zdanieDlaIdentyfikatora(indeks, "msg_nie_ma_takiego")).toBeNull();
  });
});

describe("werdykt", () => {
  test("puste ciało to odpowiedź „gra tego nie wypisuje”", () => {
    expect(werdykt("break;")).toBe("nic");
  });

  test("doklejanie bez słownika to osobna odpowiedź, nie luka", () => {
    expect(werdykt('w+="<b>"+O[1]+"</b>";break;')).toBe("bez-zdania");
  });

  test("wołanie `_t` bez znalezionego zdania to LUKA narzędzia", () => {
    expect(werdykt('_[1]+=_t("msg_czegos");break;')).toBe("luka");
  });
});

describe("tabela", () => {
  const wpisy = tabela(BUNDLE, SLOWNIK);
  const mapa = new Map(wpisy.map((w) => [w.klucz, w]));

  test("każdy klucz ze zdaniem dostaje też swój identyfikator", () => {
    for (const wpis of wpisy) {
      if (wpis.zdanie !== null) expect(wpis.identyfikator).not.toBeNull();
    }
  });

  test("klucze bez zdania mają identyfikator null — dwa braki się nie mieszają", () => {
    expect(mapa.get("pusty")).toEqual({ klucz: "pusty", identyfikator: null, zdanie: null });
    expect(mapa.get("liczba")?.zdanie).toBeNull();
  });

  test("złożony identyfikator rozwiązuje się do zdania", () => {
    expect(mapa.get("zlozony")?.zdanie).toBe("Zdanie złożonego");
  });

  test("klucz z zagnieżdżonym switchem dostaje SWOJE zdanie", () => {
    expect(mapa.get("+crush_physical")?.zdanie).toBe("+Zmiażdżenie %val%%");
  });
});

describe("buildKlienta", () => {
  test("czyta numer z nazwy bundla", () => {
    expect(buildKlienta('<script src="js/main.min1785244275300.js"></script>')).toBe(
      "1785244275300",
    );
  });

  test("brak numeru to błąd — inaczej adres bundla powstałby z pustego builda", () => {
    expect(() => buildKlienta("<html></html>")).toThrow(/builda/);
  });
});

describe("modulZamrozenia", () => {
  const ZRODLO: Zamrozenie = {
    build: "1785244275300",
    swiat: "tempest",
    zmierzone: "2026-08-04",
    metoda: "bun tools/slownik.ts --zamroz",
    klucze: [
      // Cudzysłów i ukośnik — dokładnie to, na czym poległby własny
      // serializator, a `JSON.stringify` nie. Do 2026‑08‑06 niosło je pole
      // `zdanie`; po wycięciu brzmień gry (`NOTICE.md`) jedynym polem, które
      // takie znaki niesie, jest `id` — więc test przeniósł się na nie, zamiast
      // zniknąć razem ze zdaniem.
      { klucz: "+x", id: 'msg_+x \\ "%val%"', maZdanie: true, milczy: false },
      { klucz: "+cichy", id: null, maZdanie: false, milczy: true },
    ],
    ramy: { battle_no_winner: true },
  };
  const kod = modulZamrozenia(ZRODLO);

  test("wynik jest modułem TypeScriptu, a nie tekstem, który go przypomina", () => {
    // Plik idzie prosto do `tests/` i importują go dwa pliki testowe. Gdyby
    // składanie się rozjechało, padłby cały przebieg, a nie jedna asercja —
    // ten test ma to złapać w narzędziu, nie w skutkach.
    expect(() => new Bun.Transpiler({ loader: "ts" }).transformSync(kod)).not.toThrow();
  });

  test("nagłówek niesie build i datę pomiaru", () => {
    // Zamrożenie jest POMIAREM gry. Pomiar bez daty i wersji klienta nie jest
    // danymi porównywalnymi — to reguła, na której to repo już się przejechało
    // przy procentach pokrycia (`docs/TOOLING.md`).
    expect(kod).toContain("1785244275300");
    expect(kod).toContain("2026-08-04");
  });

  test("mówi wprost, że pliku się nie edytuje, i podaje komendę odtwarzającą", () => {
    // Plik wygląda jak zwykły moduł z tablicą — jedyne, co powstrzyma kogoś
    // przed „poprawieniem" zdania, żeby test przeszedł, to pierwsza linia.
    expect(kod.split("\n")[0]).toContain("--zamroz");
  });

  test("wraca przez `slownikZeZamrozenia` do szablonów zastępczych", () => {
    // Pętla domknięta: to, co narzędzie wypisuje, ma się dać odczytać z powrotem
    // tą samą drogą, którą czytają testy. Bez tego moduł mógłby być poprawnym
    // TypeScriptem i pustym słownikiem naraz.
    //
    // Zdania są ZASTĘPCZE (klucz + podstawienia z identyfikatora), bo brzmień
    // gry w repozytorium nie ma. Pytanie, na które ten słownik odpowiada, brzmi
    // „czy gra zna ten identyfikator", a nie „jak to brzmi po polsku".
    const slownik = slownikZeZamrozenia(ZRODLO);
    expect(slownik.zdanie('msg_+x \\ "%val%"')).toBe("+x %val%");
    expect(slownik.zdanie("battle_no_winner")).toBe("battle_no_winner");
    expect(kod).toContain(JSON.stringify('msg_+x \\ "%val%"'));
  });

  test("identyfikator bez zdania nie trafia do słownika", () => {
    // `maZdanie: false` ma znaczyć „gra tego nie zna", a nie „mamy pusty
    // szablon". Bez tej asercji zastępnik mógłby powstawać dla każdego wpisu
    // i test wyżej (`zaszyte identyfikatory kontra asset gry`) zrobiłby się
    // zielony i pusty — odpowiadałby zawsze.
    expect(slownikZeZamrozenia(ZRODLO).zdanie("msg_+cichy")).toBeNull();
  });

  test("brzmienia z gry NIE przechodzą przez `zamrozenie` do modułu", () => {
    // Strażnik licencyjny, nie stylistyczny. Do 2026‑08‑06 zamrożenie niosło
    // 223 polskie zdania przepisane z assetu gry; wróciłyby jednym polem
    // dopisanym w `zamrozenie()` — i wróciłyby po cichu, bo żaden test ich nie
    // czytał. Wejście CELOWO niesie brzmienie: gdyby wyciekło, test je znajdzie.
    // Powody: `NOTICE.md`.
    const modul = modulZamrozenia(
      zamrozenie(
        "1785244275300",
        "2026-08-06",
        [{ klucz: "+x", identyfikator: "msg_+x %val%", zdanie: "+Brzmienie z gry %val%" }],
        new Map(),
        new Map([["battle_no_winner", "Walka nie wyłoniła zwycięzcy"]]),
      ),
    );
    expect(modul).not.toContain("Brzmienie z gry");
    expect(modul).not.toContain("Walka nie wyłoniła zwycięzcy");
    // …a sam fakt „gra to zna" ma przejść, inaczej strażnik chroniłby pustki.
    expect(modul).toContain('"maZdanie": true');
    expect(modul).toContain('"battle_no_winner": true');
  });
});
