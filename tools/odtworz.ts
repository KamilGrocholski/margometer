/**
 * Zdanie gry składane z komunikatu protokołu.
 *
 * PO CO. Żeby dało się sprawdzić dekoder protokołu **bez złapanego logu**.
 * Do 2026‑08‑04 orakulum porównywało `dekoduj(protokol)` z `parse(raw.txt)`,
 * czyli wymagało, żeby ktoś kliknął „Kopiuj logi" przy każdej walce. Tutaj
 * tekst powstaje z tego, co gra sama o sobie mówi: klucz → identyfikator `_t`
 * → szablon ze słownika. Nowy niezmiennik brzmi:
 *
 *     dekoduj(komunikaty)  ≟  parse(odtworz(komunikaty))
 *
 * Obie strony dają `BattleEvent[]` i porównują się tą samą funkcją, co czujka
 * w panelu — a materiałem jest sam `protokol.json`.
 *
 * ⚠️ **TO JEST REIMPLEMENTACJA CUDZEGO KODU I NIE UDAJE, ŻE NIE JEST.**
 * `battleMsg` składa zdanie z trzech szczelin (`tm[0..2]`), akumulatorów
 * `attack`/`take`, podstawień `_t` i odmiany pod `#`/`$`. Odtwarzamy z tego
 * tyle, ile potrzeba, żeby `parse` rozpoznał ZDARZENIA — nie po to, żeby
 * wyprodukować bajt w bajt ten sam log.
 *
 * CZEGO ŚWIADOMIE NIE ODTWARZAMY:
 *
 * - **odmiany** — `#` i `$` znikają (forma męska). Zrzut sondy nie niesie
 *   `gender`, a `parser.ts` i tak przyjmuje wszystkie trzy formy (`GENDER`
 *   jest opcjonalne). Na liczby to nie wpływa.
 * - **podziału na `tm[1]` i `tm[2]`** — u gry część modyfikatorów ląduje przed
 *   zdaniem „otrzymał", część po. Wrzucamy wszystkie między „uderzył"
 *   a „otrzymał", bo dla `parse` liczy się przynależność do bloku ciosu,
 *   a nie kolejność w nim. Gdyby się okazało, że jednak liczy — niezmiennik
 *   to pokaże i wtedy trzeba będzie tę kolejność odtworzyć.
 * - **`<br>`, BBCode i `++`→`+`** — to warstwa prezentacji, nie treść.
 *
 * ⚠️ **Wynik NIE JEST fixture'em i nie wolno go nim uczynić.** Fixture to
 * zrzut z gry; to jest nasza rekonstrukcja. Zapisanie jej jako `raw.txt`
 * dałoby korpus, który potwierdza sam siebie.
 */

import type { Slownik } from "../src/slownik-gry.ts";
import { czlony, rola, rozbierz, type Parametr } from "../src/protokol.ts";

export type Kontekst = {
  /** `id` wojownika → nazwa. Z `skladZeZrzutu`. */
  nazwy: ReadonlyMap<number, string>;
  /** Klucz protokołu → identyfikator `_t`. Z zamrożonej tabeli. */
  identyfikatory: ReadonlyMap<string, string | null>;
  slownik: Slownik;
};

export type Odtworzone = {
  tekst: string;
  /**
   * Czy odtworzenie jest PEŁNE — bez nierozwiązanych podstawień i bez kluczy,
   * dla których nie znaleźliśmy szablonu.
   *
   * Niepełne komunikaty wypadają z porównania JAWNIE, zamiast wchodzić do
   * niego jako linie, których `parse` nie rozpozna. Rozjazd z powodu naszej
   * nieudolnej rekonstrukcji wyglądałby jak błąd dekodera.
   */
  pelne: boolean;
  /** Klucze, których nie umieliśmy odtworzyć — materiał do zapisania, nie do ukrycia. */
  nieodtworzone: string[];
};

/** Podstawienia, które zostawia gra: `#` to rodzaj nadawcy, `$` celu. */
function bezOdmiany(tekst: string): string {
  return tekst.replaceAll("#", "").replaceAll("$", "");
}

/** Czy w tekście został nierozwiązany parametr w rodzaju `%name2%`. */
function maNierozwiazane(tekst: string): boolean {
  return /%[a-z_0-9]+%/i.test(tekst);
}

/**
 * Nazwa z życiem w nawiasie — `Odyniec(19.27%)`.
 *
 * Gra robi to dla komunikatów JEDNOSTRONNYCH: `f1.name += '(' + f1.tmpHpp + '%)'`
 * przy ostatnim segmencie, gdy `id2 == 0` (`BattleMessages.js:169‑182`). Stąd
 * linie DoT‑ów i leczenia mają życie doklejone do nazwy, a nie osobnym
 * parametrem — z wyjątkiem szablonów, które `%hpp%` mają wprost (`anguish`).
 */
function zZyciem(nazwa: string, hpp: number | null): string {
  return hpp === null ? nazwa : `${nazwa}(${hpp}%)`;
}

/**
 * Jeden komunikat → blok tekstu.
 *
 * Kolejność odwzorowuje `battleMsg`: najpierw „uderzył z siłą" (`tm[0]`),
 * potem modyfikatory, na końcu „otrzymał N obrażeń" (`tm[2]` domykane
 * po pętli, `:1127‑1128`).
 */
export function odtworzKomunikat(komunikat: string, k: Kontekst): Odtworzone {
  const { nadawca, cel, parametry } = rozbierz(komunikat);
  const nazwaNadawcy = nadawca === null ? null : (k.nazwy.get(nadawca.id) ?? null);
  const nazwaCelu = cel === null ? null : (k.nazwy.get(cel.id) ?? null);
  const jednostronny = nadawca !== null && cel === null;

  const zadane: string[] = [];
  const przyjete: string[] = [];
  const srodek: string[] = [];
  const nieodtworzone: string[] = [];

  /**
   * Identyfikator dla TEGO wystąpienia klucza.
   *
   * Tabela `klucz → id` zna jeden identyfikator na klucz, a gra wybiera go
   * WARUNKOWO: inny przy jednej wartości, inny przy dwóch (`multi.length == 1`
   * w ciałach `poison`/`wound`/`injure`/`anguish`), a przy rozstrzygnięciu
   * walki jeszcze inny, zależnie od tego, czy wygrała jedna postać, czy
   * drużyna (`m[1].indexOf(',') < 0`). Te warunki są przepisane z renderera.
   */
  const identyfikatorDla = (p: Parametr, dwuczlonowa: boolean): string | null => {
    if (p.klucz === "winner" || p.klucz === "loser") {
      if (p.wartosc === "?") return "battle_no_winner";
      const druzyna = (p.wartosc ?? "").includes(",");
      const rdzen = p.klucz === "winner" ? "winner" : "loser";
      return druzyna ? `${rdzen}_team_is %name% %posfix%` : `${rdzen}_is %name% %posfix%`;
    }
    if (dwuczlonowa) {
      const warianty: Record<string, string> = {
        poison: "msg_poison %name% %val0% %val1%",
        wound: "msg_wound_multi %name% %val0% %val1%",
        injure: "msg_injure %name% %val0% %val1%",
        anguish: "msg_anguish %name% %hpp% %val0% %val1%",
      };
      const wariant = warianty[p.klucz];
      if (wariant !== undefined) return wariant;
    }
    return k.identyfikatory.get(p.klucz) ?? null;
  };

  const szablon = (p: Parametr): string | null => {
    // `txt` niesie GOTOWY tekst od serwera, nie identyfikator — gra wkleja go
    // wprost (`tm[1] += m[1]`). Szukanie go w słowniku byłoby pomyłką.
    if (p.klucz === "txt") return p.wartosc ?? "";

    const czlonyWartosci = czlony(p.wartosc);
    const id = identyfikatorDla(p, czlonyWartosci.length > 1);
    if (id === null) return null;
    const parametryPodstawienia: Record<string, string> = {
      "%val%": p.wartosc ?? "",
      "%val0%": czlonyWartosci[0] ?? "",
      "%val1%": czlonyWartosci[1] ?? "",
      // Przy rozstrzygnięciu walki `%name%` to WARTOŚĆ klucza (lista nazw),
      // a nie nadawca — komunikat `0;0;winner=…` nie ma stron.
      "%name%":
        p.klucz === "winner" || p.klucz === "loser"
          ? (p.wartosc ?? "")
          : zZyciem(nazwaNadawcy ?? "", jednostronny ? (nadawca?.hpp ?? null) : null),
      // „Przywrócono" albo „Stracono" — gra wybiera po znaku wartości
      // (`m[1] >= 0` w ciele `heal`).
      "%gain_lost%":
        (k.slownik.zdanie(
          Number(czlonyWartosci[0] ?? "0") >= 0 ? "part_gained" : "part_lost",
        ) ?? ""),
      "%name1%": nazwaNadawcy ?? "",
      "%target%": nazwaCelu ?? "",
      "%hpp%": String(nadawca?.hpp ?? ""),
      "%posfix%": "",
      "%g1%": "",
      "%m1%": p.wartosc ?? "",
    };
    return k.slownik.zdanie(id, parametryPodstawienia);
  };

  for (const p of parametry) {
    if (p.klucz === "") continue;
    const r = rola(p.klucz);
    if (r === null) {
      nieodtworzone.push(p.klucz);
      continue;
    }
    switch (r.typ) {
      case "cios":
      case "ciosProc":
        zadane.push(`+${p.wartosc ?? ""}`);
        if (r.typ === "ciosProc") {
          const zdanie = szablon(p);
          if (zdanie === null) nieodtworzone.push(p.klucz);
          else srodek.push(zdanie);
        }
        break;
      case "przyjete":
        przyjete.push(`-${p.wartosc ?? ""}`);
        break;
      case "cisza":
        break;
      default: {
        const zdanie = szablon(p);
        if (zdanie === null) nieodtworzone.push(p.klucz);
        else srodek.push(zdanie);
      }
    }
  }

  const linie: string[] = [];
  if (zadane.length > 0) {
    const naglowek = k.slownik.zdanie("msg_dmgdone %name1% %hpp% %val%", {
      "%name1%": nazwaNadawcy ?? "",
      "%hpp%": String(nadawca?.hpp ?? ""),
      "%val%": ` ${zadane.join(" ")} `,
    });
    if (naglowek === null) nieodtworzone.push("msg_dmgdone");
    else linie.push(naglowek);
  }
  linie.push(...srodek);
  if (zadane.length > 0) {
    const stopka = k.slownik.zdanie("msg_dmgtaken %name1% %hpp% %val%", {
      "%name1%": nazwaCelu ?? "",
      "%hpp%": String(cel?.hpp ?? ""),
      "%val%": ` ${przyjete.join(" ")} `,
    });
    if (stopka === null) nieodtworzone.push("msg_dmgtaken");
    else linie.push(stopka);
  }

  const tekst = bezOdmiany(linie.join("\n"));
  return {
    tekst,
    pelne: nieodtworzone.length === 0 && !maNierozwiazane(tekst),
    nieodtworzone,
  };
}

/** Cała walka. Komunikaty niepełne są pomijane, a ich klucze zwracane osobno. */
export function odtworz(
  komunikaty: readonly string[],
  k: Kontekst,
): { tekst: string; pominiete: number; nieodtworzone: string[] } {
  const linie: string[] = [];
  const nieodtworzone = new Set<string>();
  let pominiete = 0;

  for (const komunikat of komunikaty) {
    const wynik = odtworzKomunikat(komunikat, k);
    for (const klucz of wynik.nieodtworzone) nieodtworzone.add(klucz);
    if (!wynik.pelne) {
      pominiete += 1;
      continue;
    }
    if (wynik.tekst !== "") linie.push(wynik.tekst);
  }

  return { tekst: `${linie.join("\n\n")}\n`, pominiete, nieodtworzone: [...nieodtworzone].sort() };
}
