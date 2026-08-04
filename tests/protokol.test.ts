import { describe, expect, test } from "bun:test";
import { czlony, liczba, rozbierz } from "../src/protokol.ts";

/**
 * Rozbiór komunikatu protokołu.
 *
 * SKĄD BIORĄ SIĘ WEJŚCIA. Dwa źródła, oba prawdziwe, i to jest tu ważne:
 *
 * - **korpus protokołu** (`tests/fixtures/grooove/`) — kształty z prawdziwych
 *   walk, przepisane na dialekt gry (grooove rozdziela klucz od wartości
 *   kropką, gra znakiem `=`; powody w README tamtego katalogu);
 * - **źródło renderera gry** — przypadki brzegowe, których w korpusie nie ma,
 *   ale które `battleMsg` obsługuje jawnie i dlatego wiadomo, że istnieją.
 *
 * Czego te testy NIE dowodzą: że gra wysyła dokładnie takie komunikaty. Tego
 * nie dowiedzie nic aż do zrzutu z gry — repo nie ma dziś ani jednej walki
 * zapisanej protokołem (`tests/fixtures/new-engine/`: 24 katalogi, 0 plików
 * `protokol.json`). Tutaj sprawdzamy, że rozbiór odwzorowuje `battleMsg`
 * znak w znak, a nie że wejście jest autentyczne.
 */

describe("rozbierz: strony", () => {
  test("obie strony z życiem", () => {
    const k = rozbierz("1=100.00;2=40.37;+dmgd=455");
    expect(k.nadawca).toEqual({ id: 1, hpp: 100 });
    expect(k.cel).toEqual({ id: 2, hpp: 40.37 });
  });

  test("brak celu to null, a nie wojownik o id 0", () => {
    // Kształt tyknięcia DoT-a z korpusu: `119444.6.71;0;anguish.3615`.
    // Gra sprawdza `if (id2)` i przy zerze podstawia atrapę zamiast wojownika,
    // więc zero NIE jest identyfikatorem. Zwrócenie `{id: 0}` dałoby zdarzenia
    // przypisane nieistniejącej postaci.
    const k = rozbierz("119444=6.71;0;anguish=3615");
    expect(k.nadawca).toEqual({ id: 119444, hpp: 6.71 });
    expect(k.cel).toBeNull();
  });

  test("strona bez życia — samo id, bez znaku równości", () => {
    const k = rozbierz("1;2;+dmg=10");
    expect(k.nadawca).toEqual({ id: 1, hpp: null });
    expect(k.cel).toEqual({ id: 2, hpp: null });
  });

  test("obie strony puste — komunikat systemowy", () => {
    // `0;0;txt=…` i `0;0;winner.…` z korpusu: linia otwierająca i rozstrzygnięcie.
    const k = rozbierz("0;0;winner=Baylan");
    expect(k.nadawca).toBeNull();
    expect(k.cel).toBeNull();
    expect(k.parametry).toHaveLength(1);
  });

  test("segment zaczynający się od `=` nie daje strony", () => {
    // ⚠️ Ten test pilnuje ZACHOWANIA, a nie zapisu warunku w `strona()`.
    // Sprawdzone mutacją: zamiana `indexOf('=') > 0` (tak jak w grze) na
    // `!== -1` nie zapala tutaj niczego, bo obie gałęzie kończą na NaN.
    // Zapisane, żeby komentarz przy tamtym warunku nie obiecywał osłony,
    // której nie ma — zielony test to nie to samo, co test rozróżniający.
    expect(rozbierz("=5;2;+dmg=10").nadawca).toBeNull();
  });

  test("id ze śmieciem na końcu czyta się jak w grze", () => {
    // parseInt('103655abc') to 103655; Number dałoby NaN i zgubiłoby stronę.
    expect(rozbierz("103655abc;0;heal=5").nadawca).toEqual({ id: 103655, hpp: null });
  });

  test("życie nieliczbowe daje null, a nie zero", () => {
    // Zero to poprawna wartość życia — postać martwa (`439082.0.00` w korpusie).
    // Zlanie „nie umiem odczytać" z „zero procent" ogłaszałoby zgony.
    expect(rozbierz("1=nic;0;heal=5").nadawca).toEqual({ id: 1, hpp: null });
    expect(rozbierz("1=0.00;0;heal=5").nadawca).toEqual({ id: 1, hpp: 0 });
  });
});

describe("rozbierz: parametry", () => {
  test("klucz z wartością i flaga bez wartości stoją obok siebie", () => {
    // `+pierce` i `r` z korpusu to flagi — segment bez znaku równości.
    const k = rozbierz("1=100.00;2=98.29;+dmgd=455;+pierce;-dmgd=455");
    expect(k.parametry.map((p) => p.klucz)).toEqual(["+dmgd", "+pierce", "-dmgd"]);
    expect(k.parametry[0]!.wartosc).toBe("455");
    expect(k.parametry[1]!.wartosc).toBeNull();
  });

  test("flaga (brak `=`) to nie to samo, co wartość pusta (`klucz=`)", () => {
    // Gra rozróżnia: `m[1]` jest wtedy `undefined` kontra `""`. Zlanie ich
    // kazałoby czytać flagę jak parametr o pustej wartości.
    expect(rozbierz("0;0;flaga").parametry[0]!.wartosc).toBeNull();
    expect(rozbierz("0;0;klucz=").parametry[0]!.wartosc).toBe("");
  });

  test("wartość urywa się na DRUGIM znaku równości i to jest zapalone", () => {
    // BattleMessages.js:176 — `msg[k].split('=')`, dalej wyłącznie m[0] i m[1].
    // Gra gubi resztę, więc gubimy zgodnie; ale `obciete` mówi, że format
    // niesie kształt, którego nikt nie przewidział.
    const p = rozbierz("0;0;klucz=a=b").parametry[0]!;
    expect(p.klucz).toBe("klucz");
    expect(p.wartosc).toBe("a");
    expect(p.obciete).toBe(true);
  });

  test("zwykły parametr nie jest oznaczony jako obcięty", () => {
    expect(rozbierz("0;0;klucz=a").parametry[0]!.obciete).toBe(false);
  });

  test("`surowy` to cały segment, dosłownie ten, który gra wkleiłaby w „Nieznany parametr”", () => {
    // `_t('msg_unknown_prameter %val%', {'%val%': msg[k]})` — %val% to CAŁY
    // segment. Czujka `unknown` ma podać cytat, nie rekonstrukcję.
    expect(rozbierz("1=100.00;0;X=1053,a,Dark Laser(92.90%)").parametry[0]!.surowy).toBe(
      "X=1053,a,Dark Laser(92.90%)",
    );
  });

  test("nazwa umiejętności z nawiasami i przecinkami przechodzi w całości", () => {
    // Prawdziwy kształt z korpusu: `p_.Wyzywający okrzyk;skillId.188;n.Toffi-Pawełek`.
    const k = rozbierz("498891=91.53;439082=73.83;tspell=Wyzywający okrzyk;skillId=188");
    expect(k.parametry[0]!.wartosc).toBe("Wyzywający okrzyk");
    expect(k.parametry[1]!.wartosc).toBe("188");
  });
});

describe("rozbierz: wejścia zdegenerowane nie wywracają rozbioru", () => {
  // Bez trybu porażki — porażka ma być widoczna na nierozpoznanym KLUCZU,
  // piętro wyżej. Rozbiór, który rzuca, zamieniłby jeden nieznany klucz
  // w utratę całego komunikatu.
  test("pusty string", () => {
    expect(rozbierz("")).toEqual({ nadawca: null, cel: null, parametry: [] });
  });

  test("sam nadawca, bez celu i bez parametrów", () => {
    const k = rozbierz("1=100.00");
    expect(k.nadawca).toEqual({ id: 1, hpp: 100 });
    expect(k.cel).toBeNull();
    expect(k.parametry).toEqual([]);
  });

  test("puste segmenty na końcu dają puste klucze, nie wyjątek", () => {
    const k = rozbierz("0;0;;");
    expect(k.parametry.map((p) => p.klucz)).toEqual(["", ""]);
  });
});

describe("czlony", () => {
  test("rozdziela przecinkiem, tak jak gra", () => {
    // `heal=1356,-15` z korpusu (`l.1356,-15`) — gra robi m[1].split(',')
    // i sięga po multi[0], multi[1].
    expect(czlony("1356,-15")).toEqual(["1356", "-15"]);
  });

  test("jedna wartość to jeden człon", () => {
    expect(czlony("3615")).toEqual(["3615"]);
  });

  test("brak wartości i wartość pusta dają pustą listę", () => {
    expect(czlony(null)).toEqual([]);
    expect(czlony("")).toEqual([]);
  });
});

describe("liczba", () => {
  test("czyta wartości dodatnie i ujemne", () => {
    // Ujemne są realne: `l.-58` z korpusu to utrata życia, nie leczenie.
    expect(liczba("455")).toBe(455);
    expect(liczba("-58")).toBe(-58);
  });

  test("zero jest liczbą, a nie brakiem", () => {
    // `-D.0` pada w korpusie i znaczy „obrażenia zredukowane do zera".
    expect(liczba("0")).toBe(0);
  });

  test("brak wartości i śmieć dają null, żeby czytelnik musiał się zdecydować", () => {
    expect(liczba(null)).toBeNull();
    expect(liczba("")).toBeNull();
    expect(liczba("nic")).toBeNull();
  });
});
