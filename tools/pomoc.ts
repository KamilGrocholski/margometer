/**
 * Sonda po oficjalnej pomocy Margonem — pobiera artykuł i pokazuje kontekst
 * wokół szukanych słów.
 *
 * PO CO TO ISTNIEJE, skoro jest `WebFetch`. Bo `WebFetch` na artykule
 * „Mechanika walk" (`view,372`) oddaje praktycznie sam SPIS TREŚCI: poproszony
 * o treść podsekcji odpowiada „nie znaleziono w pobranym tekście" i wypisuje
 * tytuły. Ten sam adres pobrany `curl`-em to 669 kB HTML-a i ~399 tys. znaków
 * tekstu — z wzorami, tabelami statystyk NPC i pełnymi opisami zdarzeń.
 *
 * Różnica nie jest akademicka: to ona wyprodukowała w tym repo dwa zapisy
 * „sprawdzone w pomocy, milczy", które były nieprawdą — a wyglądały jak fakt,
 * bo miały datę. Patrz `docs/MECHANIKA.md` (procedura i rejestr) oraz `AUDYT‑40`.
 *
 * Narzędzie NIE streszcza i nie interpretuje. Drukuje surowe fragmenty, żeby do
 * rejestru trafił cytat, a nie parafraza.
 *
 * Użycie:
 *   bun tools/pomoc.ts unik blok            # domyślnie „Mechanika walk"
 *   bun tools/pomoc.ts "Unik ( evade )"     # fraza w cudzysłowie — patrz niżej
 *   bun tools/pomoc.ts --artykul 205 łup    # inny artykuł pomocy
 *   bun tools/pomoc.ts --kontekst 800 blok  # szerszy wycinek wokół trafienia
 *
 * SZUKAJ FRAZĄ, NIE RDZENIEM. Dopasowanie jest zwykłym `indexOf`, więc „unik"
 * łapie też „unikatowy" — a tych w artykule jest kilkadziesiąt (opisy rzadkości
 * przedmiotów) i wypychają prawdziwe trafienie poza limit. Pomoc podaje przy
 * każdym zdarzeniu nazwę silnikową w nawiasie, i to ona jest najlepszą frazą:
 * „Unik ( evade )", „Blok ( blok )", „Głęboka rana ( wound0, of_wound0 )".
 * Odstępy w nawiasie są w źródle i muszą być we frazie.
 *
 * Kod wyjścia: 0 gdy KAŻDE szukane słowo ma trafienie, 1 gdy któreś nie ma.
 * Dzięki temu „nie znaleziono" jest widoczne także dla skryptu, nie tylko
 * dla czytającego.
 */

/** Artykuł „Mechanika walk" — jedyny, w którym siedzi mechanika walki. */
const DOMYSLNY_ARTYKUL = "372";
const KATALOG = new URL("../.cache/", import.meta.url).pathname;

/**
 * Tekst artykułu, z pamięci podręcznej albo z sieci.
 *
 * Zapis na dysk jest tu po to, żeby kolejne pytania o ten sam artykuł nie biły
 * w serwer gry — jedno pobranie to 669 kB, a przy szukaniu synonimów odpala się
 * sondę kilka razy pod rząd. `.cache/` jest w `.gitignore`.
 */
async function tekstArtykulu(id: string): Promise<string> {
  const plik = `${KATALOG}pomoc-${id}.txt`;
  const zapisany = Bun.file(plik);
  if (await zapisany.exists()) return zapisany.text();

  const adres = `https://pomoc.margonem.pl/index/view,${id}`;
  console.error(`pobieram ${adres} …`);
  const odpowiedz = await fetch(adres);
  if (!odpowiedz.ok) throw new Error(`${adres} → HTTP ${odpowiedz.status}`);

  const tekst = odtaguj(await odpowiedz.text());
  await Bun.write(plik, tekst);
  console.error(`zapisane w ${plik} (${tekst.length} znaków)`);
  return tekst;
}

/**
 * HTML → tekst. Skrypty i style lecą PRZED zdejmowaniem tagów, inaczej ich
 * zawartość zostaje w wyniku i szukane słowo trafia w kod strony zamiast
 * w treść artykułu.
 */
function odtaguj(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;?/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fragmenty wokół trafień, bez powtórzeń.
 *
 * Ten sam akapit potrafi zawierać szukane słowo kilka razy i bez odsiewania
 * wypisałby się tyle samo razy — a wtedy prawdziwe trafienie z innego miejsca
 * artykułu ucieka poniżej limitu.
 */
function fragmenty(tekst: string, slowo: string, kontekst: number, ile: number): string[] {
  const znalezione: string[] = [];
  const widziane = new Set<string>();
  const igla = slowo.toLocaleLowerCase("pl");
  const stog = tekst.toLocaleLowerCase("pl");

  let od = 0;
  while (znalezione.length < ile) {
    const trafienie = stog.indexOf(igla, od);
    if (trafienie === -1) break;
    od = trafienie + igla.length;

    const fragment = tekst
      .slice(Math.max(0, trafienie - Math.round(kontekst / 3)), trafienie + kontekst)
      .trim();
    const klucz = fragment.slice(0, 60);
    if (widziane.has(klucz)) continue;
    widziane.add(klucz);
    znalezione.push(fragment);
  }
  return znalezione;
}

function liczba(argumenty: string[], flaga: string, domyslna: number): number {
  const gdzie = argumenty.indexOf(flaga);
  if (gdzie === -1) return domyslna;
  const wartosc = Number(argumenty[gdzie + 1]);
  if (!Number.isFinite(wartosc)) throw new Error(`${flaga} wymaga liczby`);
  argumenty.splice(gdzie, 2);
  return wartosc;
}

function tekstowa(argumenty: string[], flaga: string, domyslna: string): string {
  const gdzie = argumenty.indexOf(flaga);
  if (gdzie === -1) return domyslna;
  const wartosc = argumenty[gdzie + 1];
  if (wartosc === undefined) throw new Error(`${flaga} wymaga wartości`);
  argumenty.splice(gdzie, 2);
  return wartosc;
}

const argumenty = process.argv.slice(2);
const artykul = tekstowa(argumenty, "--artykul", DOMYSLNY_ARTYKUL);
const kontekst = liczba(argumenty, "--kontekst", 420);
// Sześć, nie trzy: rdzeń szukanego słowa łapie też słowa niezwiązane („unik"
// → „unikatowy"), a przy niskim limicie prawdziwe trafienie nie mieści się
// w wyniku i wygląda jak jego brak. To ta sama klasa błędu, przed którą stoi
// cała ta sonda, tylko o jedno piętro niżej.
const ile = liczba(argumenty, "--ile", 6);
const slowa = argumenty.filter((a) => !a.startsWith("--"));

if (slowa.length === 0) {
  console.error("użycie: bun tools/pomoc.ts [--artykul N] [--kontekst N] [--ile N] słowo …");
  process.exit(2);
}

const tekst = await tekstArtykulu(artykul);
console.log(`artykuł view,${artykul} — ${tekst.length} znaków tekstu\n`);

let brakujace = 0;
for (const slowo of slowa) {
  const trafienia = fragmenty(tekst, slowo, kontekst, ile);
  const wszystkie = tekst.toLocaleLowerCase("pl").split(slowo.toLocaleLowerCase("pl")).length - 1;

  console.log("=".repeat(72));
  console.log(`„${slowo}" — ${wszystkie} wystąpień, pokazuję ${trafienia.length}`);
  console.log("=".repeat(72));

  if (trafienia.length === 0) {
    // Zdanie sformułowane tak, żeby dało się je przekleić do rejestru bez
    // przerabiania. „Nie znaleziono" to nie to samo, co „nie ma" — a różnica
    // między nimi jest dokładnie tym, na czym poległ wpis przy `AUDYT‑40`.
    console.log(`NIE ZNALEZIONO w artykule view,${artykul}. Sprawdź synonimy`);
    console.log(`i nazwę silnikową (pomoc podaje ją w nawiasie, np. „Unik ( evade )").`);
    brakujace += 1;
    continue;
  }
  for (const fragment of trafienia) console.log(`\n… ${fragment} …`);
  console.log();
}

process.exit(brakujace > 0 ? 1 : 0);
