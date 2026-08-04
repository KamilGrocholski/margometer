/**
 * Czego parser NIGDY nie widział, a gra to robi.
 *
 * PO CO TO ISTNIEJE. Korpus tekstowy ma zero linii `unknown` — i to nie jest
 * dowód, że czujka jest ciasna, tylko że nie znamy przeciwprzykładu. Tak stoi
 * w `docs/ROADMAP.md` pod kierunkiem „jakość danych": *„korpus ma zero nieznanych
 * linii, więc sam z siebie nie mówi nic o tym, czego parser NIE rozpoznaje"*.
 *
 * To narzędzie daje spojrzenie z zewnątrz, składając trzy źródła, które są już
 * w repo i do tej pory nie rozmawiały ze sobą:
 *
 *   pomoc gry            nazwa silnikowa → nazwa polska  (`tools/pomoc.ts`)
 *   korpus protokołu     które efekty ZACHODZĄ naprawdę  (`tests/fixtures/grooove/`)
 *   korpus tekstowy      które linie parser już widział   (`tests/fixtures/new-engine/`)
 *
 * Efekt, który pomoc opisuje, protokół dowodzi w prawdziwych walkach, a korpus
 * tekstowy go nie zna, jest **kandydatem na cichą lukę parsera** — i zarazem
 * pozycją na liście zakupowej: takiej walki trzeba poszukać w grze.
 *
 * CZEGO TO NIE ROZSTRZYGA. Że linia leci w `unknown`. Protokół nie niesie
 * tekstu, więc nie wiadomo nawet, czy dany efekt w ogóle ma swoją linię
 * w oknie walki. Wynik jest listą PODEJRZANYCH, nie listą błędów — i nie jest
 * podstawą do rozszerzania wzorców w `src/parser.ts`. Najpierw zrzut z gry,
 * potem wzorzec; odwrotna kolejność to zgadywanie brzmienia linii.
 *
 * Użycie:
 *   bun tools/luki.ts             # cztery kubełki
 *   bun tools/luki.ts --odswiez   # pobierz artykuł pomocy na nowo
 *   bun tools/luki.ts --wszystko  # wypisz też ZNANE i NIEZNANE, nie samo LUKA
 */

import { Glob } from "bun";
import { parse } from "../src/parser.ts";
import { tekstArtykulu, wiek } from "./pomoc.ts";
import { czytajFixture, katalogiKorpusu, kluczeZdarzenia, zdarzenia } from "./grooove.ts";

const FIXTURES = new URL("../tests/fixtures/", import.meta.url).pathname;

/**
 * Nazwa silnikowa → nazwa polska, wyłuskane z artykułu „Mechanika walk".
 *
 * Pomoc zapisuje je konsekwentnie jako `Nazwa polska ( engine )`, z odstępami
 * w nawiasie — stąd ten wzorzec, a nie zgadywanie. Jeden nawias potrafi nieść
 * kilka nazw po przecinku („Głęboka rana ( wound0, of_wound0 )"), więc każda
 * dostaje osobny wpis.
 *
 * Pomiar 2026‑08‑03: 140 par. Tu siedzą zdarzenia i bonusy legendarne
 * (`blok`, `evade`, `anguish`, `facade`, `puncture`, `holytouch`, `glare`,
 * `lastheal`) — czyli dokładnie ta rodzina, która potrafi mieć własną linię
 * w logu.
 */
export function slownikNazw(pomoc: string): Map<string, string> {
  const slownik = new Map<string, string>();
  const wzorzec =
    /([A-ZŁŚŻŹĆÓĄĘŃ][A-Za-zĄĆĘŁŃÓŚŻŹąćęłńóśżź ]{2,38}?)\s\(\s([a-z0-9_, -]{2,40})\s\)/g;
  for (const trafienie of pomoc.matchAll(wzorzec)) {
    for (const nazwa of trafienie[2]!.split(",").map((s) => s.trim())) {
      if (nazwa.length > 0) slownik.set(nazwa, trafienie[1]!.trim());
    }
  }
  return slownik;
}

/**
 * Czy pomoc opisuje tę nazwę jako statystykę, a nie zdarzenie.
 *
 * Pomoc ma DRUGĄ notację, obok `Nazwa ( engine )`: gołe `aktywny <engine>`
 * i `pasywny <engine>`, bez polskiego odpowiednika. Tak opisane są rzeczy,
 * które zmieniają liczby, ale nie wypisują własnej linii — `antidote`, `vamp`,
 * `alllowdmg`, `achpp_per`, `vulture_perw`.
 *
 * Pytamy o KONKRETNĄ nazwę, zamiast wyciągać wszystkie tokeny po „aktywny".
 * Wyciąganie hurtem łapie polską prozę („aktywny efekt", „pasywny szansę")
 * i zaśmieca zbiór słowami, które nigdy nie są nazwą silnikową.
 *
 * Nazwy krótsze niż trzy znaki odrzucamy bez sprawdzania: protokół ma klucze
 * jednoliterowe (`w`, `l`, `p`, `k`), a zdanie „zestawu, który nie jest
 * aktywny w danej chwili" zrobiło z klucza `w` statystykę. Fałszywy STAT jest
 * groźniejszy od fałszywej LUKI, bo cicho zdejmuje pozycję z listy.
 */
export function jestStatystyka(pomoc: string, nazwa: string): boolean {
  if (nazwa.length < 3) return false;
  return new RegExp(`\\b(?:aktywny|pasywny)\\s+${nazwa}\\b`).test(pomoc);
}

/**
 * Czy nazwa stoi w TABELI BONUSÓW PRZEDMIOTÓW, a nie w opisie efektu.
 *
 * Pomoc wypisuje bonusy przedmiotów wierszami o stałym kształcie —
 * `Nazwa ( engine ) val = amt * 3 [-3 ; 10]` — i to jest maszynowa różnica
 * między statystyką a czymś, co może mieć własną linię w logu. Opis efektu
 * zaczyna się po nawiasie od `•`, nigdy od `val =`.
 *
 * PO CO OSOBNO, skoro jest już `jestStatystyka`. Bo te wiersze **mają polską
 * nazwę** i tamten test ich nie łapie. Bez tego rozróżnienia `resfrost_per`
 * („Odporność na zimno"), `reslight_per`, `critval` i `critmval` wychodziły
 * jako luki parsera — cztery z dziesięciu pozycji pierwszego przebiegu.
 */
export function jestWierszemTabeli(pomoc: string, nazwa: string): boolean {
  const nawias = `( ${nazwa} )`;
  const gdzie = pomoc.indexOf(nawias);
  if (gdzie === -1) return false;
  return /^\s*val = amt/.test(pomoc.slice(gdzie + nawias.length, gdzie + nawias.length + 20));
}

/**
 * Klucz protokołu obdarty z dekoracji, żeby trafił w słownik pomocy.
 *
 * Protokół dopisuje do nazwy silnikowej znacznik kierunku (`@` zadane,
 * `-` przyjęte, `+`), przedrostek rodziny (`legbon_` dla bonusów legendarnych,
 * `active_`, `aura-`), przyrostek wariantu (`_per`, `_perw`, `_l`) i zasięg
 * (`-enemies`, `-allies`). Rdzeniem jest to, co zostaje.
 *
 * Sprawdzone na korpusie: `@legbon_anguish` → `anguish`,
 * `legbon_holytouch_l` → `holytouch`, `active_decblock_per` → `decblock`.
 */
export function rdzenKlucza(klucz: string): string {
  return klucz
    .replace(/^[@+-]/, "")
    .replace(/^(?:legbon_|active_|aura-)/, "")
    .replace(/-(?:enemies|allies)$/, "")
    .replace(/_(?:per|perw|l)$/, "");
}

/**
 * Czy rodzina modyfikatorów z korpusu tekstowego mówi o tym samym, co nazwa
 * polska z pomocy.
 *
 * TO JEST NAJDELIKATNIEJSZA CZĘŚĆ i ma powód, dla którego nie jest zwykłym
 * `includes`. Polski odmienia: pomoc pisze „Absorpcja magiczna", a log
 * „Zniszczono 1150 absorpcji magicznej"; pomoc „Niszczenie many", log
 * „Zniszczono 10 many". Naiwne porównanie całych nazw wypisało w pierwszym
 * przejściu jedenaście „luk", z czego CZTERY były fałszywe — i to właśnie te.
 *
 * Reguła: każde słowo nazwy polskiej dłuższe niż 3 znaki przycinamy do pięciu
 * znaków i wymagamy, żeby ten rdzeń był PODCIĄGIEM rodziny. Podciąg, nie
 * przedrostek słowa — bo „Niszczenie" ma odpowiadać „Zniszczono", a tam różnica
 * siedzi z przodu. Słowa krótkie (`od`, `na`, `o`, `w`) pomijamy: dopasowałyby
 * się wszędzie.
 */
export function nazwaPasuje(rodzina: string, polska: string): boolean {
  const cel = rodzina.toLocaleLowerCase("pl");
  const rdzenie = polska
    .toLocaleLowerCase("pl")
    .split(/\s+/)
    .filter((s) => s.length > 3)
    .map((s) => s.slice(0, 5));
  return rdzenie.length > 0 && rdzenie.every((r) => cel.includes(r));
}

/**
 * Klucze, które mają polską nazwę w pomocy, ale NIE opisują zdarzenia z linią
 * w logu — więc ich nieobecność w korpusie tekstowym nie jest luką.
 *
 * Lista jest ręczna i jawna, bo maszyna tego nie rozstrzyga: `light` ma
 * w pomocy nazwę „Obrażenia od błyskawic" i wygląda jak każdy inny efekt,
 * a jest ŻYWIOŁEM — w oknie walki siedzi w klasie CSS `dmgl`, nie w osobnej
 * linii, i parser czyta go przez `src/source.ts`, nie przez `RE_INFO`.
 * Wpis bez powodu obok jest tu zabroniony: to jest miejsce, w którym najłatwiej
 * uciszyć prawdziwą lukę.
 */
export const POZA_LOGIEM = new Map<string, string>([
  ["light", "żywioł obrażeń — w oknie walki siedzi w klasie CSS dmgl, nie w linii tekstu"],
  ["mana", "pula postaci, opisana w pomocy jak statystyka: Ulega zmianie na skutek…"],
  ["hp", "pula życia — jak wyżej; log podaje ją w procentach przy nazwie, nie osobną linią"],
  ["a1", "typ obrażeń z tabeli statystyk (dystansowe), nie zdarzenie"],
  ["a2", "typ obrażeń z tabeli statystyk (dystansowe), nie zdarzenie"],
]);

export type Kubelek = "ZNANE" | "LUKA" | "STAT" | "POZA LOGIEM" | "NIEZNANE";

export type Wpis = {
  klucz: string;
  rdzen: string;
  ile: number;
  polska: string | null;
  kubelek: Kubelek;
  powod: string;
};

/** Rodziny modyfikatorów z korpusu tekstowego — liczby zwinięte do `N`. */
export async function rodzinyModyfikatorow(): Promise<Set<string>> {
  const rodziny = new Set<string>();
  for (const sciezka of new Glob("*/*/raw.txt").scanSync(FIXTURES)) {
    for (const zdarzenie of parse(await Bun.file(FIXTURES + sciezka).text())) {
      if (zdarzenie.kind !== "attack") continue;
      for (const proc of zdarzenie.procs) rodziny.add(proc.replace(/-?\d+([.,]\d+)?/g, "N"));
    }
  }
  return rodziny;
}

/** Klucze protokołu z korpusu grooove, z liczbą wystąpień. */
export async function kluczeProtokolu(): Promise<Map<string, number>> {
  const licznik = new Map<string, number>();
  for (const katalog of await katalogiKorpusu()) {
    const { log } = czytajFixture(
      await Bun.file(`${FIXTURES}grooove/${katalog}/log.grooove.txt`).text(),
    );
    for (const zdarzenie of zdarzenia(log)) {
      for (const klucz of kluczeZdarzenia(zdarzenie)) {
        licznik.set(klucz, (licznik.get(klucz) ?? 0) + 1);
      }
    }
  }
  return licznik;
}

/**
 * Złączenie. Kolejność sprawdzeń jest istotna i zapisana w `powod`:
 * polska nazwa wygrywa z notacją „aktywny/pasywny", bo 32 nazwy stoją w obu
 * (m.in. `rage`), a to właśnie one bywają lukami.
 */
export function zloz(
  klucze: Map<string, number>,
  slownik: Map<string, string>,
  pomoc: string,
  rodziny: Set<string>,
): Wpis[] {
  const wpisy: Wpis[] = [];
  for (const [klucz, ile] of klucze) {
    const rdzen = rdzenKlucza(klucz);
    const polska = slownik.get(rdzen) ?? slownik.get(klucz) ?? null;

    if (polska === null) {
      const stat = jestStatystyka(pomoc, rdzen) || jestStatystyka(pomoc, klucz);
      wpisy.push({
        klucz,
        rdzen,
        ile,
        polska,
        kubelek: stat ? "STAT" : "NIEZNANE",
        powod: stat
          ? "pomoc opisuje jako aktywny/pasywny — statystyka, nie zdarzenie"
          : "pomoc nie zna tej nazwy; nazwa własna protokołu albo inny artykuł",
      });
      continue;
    }

    // Wiersz tabeli bonusów przedmiotów ma polską nazwę, ale opisuje liczbę
    // z ekwipunku, nie zdarzenie — sprawdzany PRZED dopasowaniem do korpusu.
    if (jestWierszemTabeli(pomoc, rdzen) || jestWierszemTabeli(pomoc, klucz)) {
      wpisy.push({
        klucz,
        rdzen,
        ile,
        polska,
        kubelek: "STAT",
        powod: "wiersz tabeli bonusów przedmiotów w pomocy (`val = amt * …`)",
      });
      continue;
    }

    const poza = POZA_LOGIEM.get(rdzen) ?? POZA_LOGIEM.get(klucz);
    if (poza !== undefined) {
      wpisy.push({ klucz, rdzen, ile, polska, kubelek: "POZA LOGIEM", powod: poza });
      continue;
    }

    const rodzina = [...rodziny].find((r) => nazwaPasuje(r, polska));
    wpisy.push({
      klucz,
      rdzen,
      ile,
      polska,
      kubelek: rodzina === undefined ? "LUKA" : "ZNANE",
      powod: rodzina === undefined ? "korpus tekstowy nie ma żadnej takiej linii" : rodzina,
    });
  }
  return wpisy;
}

if (import.meta.main) {
  const argumenty = process.argv.slice(2);
  const { tekst: pomoc, pobrane } = await tekstArtykulu("372", argumenty.includes("--odswiez"));
  const slownik = slownikNazw(pomoc);
  const klucze = await kluczeProtokolu();
  const rodziny = await rodzinyModyfikatorow();
  const wpisy = zloz(klucze, slownik, pomoc, rodziny);

  console.log(
    `pomoc: ${slownik.size} nazw silnikowych (${wiek(pobrane, new Date())})\n` +
      `protokół: ${klucze.size} kluczy z ${(await katalogiKorpusu()).length} walk\n` +
      `korpus tekstowy: ${rodziny.size} rodzin modyfikatorów\n`,
  );

  const kubelki: Kubelek[] = argumenty.includes("--wszystko")
    ? ["LUKA", "ZNANE", "POZA LOGIEM", "STAT", "NIEZNANE"]
    : ["LUKA", "ZNANE", "POZA LOGIEM"];

  for (const kubelek of kubelki) {
    const w = wpisy.filter((x) => x.kubelek === kubelek).sort((a, b) => b.ile - a.ile);
    console.log("=".repeat(72));
    console.log(`${kubelek} — ${w.length} kluczy`);
    console.log("=".repeat(72));
    for (const x of w) {
      console.log(`${String(x.ile).padStart(5)}×  ${x.klucz.padEnd(24)} ${x.polska ?? ""}`);
      if (kubelek !== "ZNANE") console.log(`        ${x.powod}`);
    }
    console.log();
  }

  const luk = wpisy.filter((x) => x.kubelek === "LUKA").length;
  if (!argumenty.includes("--wszystko")) {
    const reszta = wpisy.filter((x) => x.kubelek === "STAT" || x.kubelek === "NIEZNANE").length;
    console.log(`(${reszta} kluczy w STAT i NIEZNANE — pokaże je --wszystko)`);
  }
  // Kod wyjścia mówi tylko „są kandydaci", nie „są błędy". Luka jest pozycją
  // na liście zakupowej zrzutów, nie awarią — dlatego to nie jest brama.
  console.log(`\nkandydatów na lukę: ${luk}`);
}
