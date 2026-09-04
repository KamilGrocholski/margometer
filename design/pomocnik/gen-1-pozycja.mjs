/** Row one: what the window is, and how it differs from the add-on that already does this. */
import { writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { auraRow, hold, note, page, plainRow, section, sheet, tag, TOKEN, window_ } from "./pomocnik.mjs";

const measured = JSON.parse(readFileSync("measured.json", "utf8"));
const auras = new Map(measured.auras.map((row) => [row.skill, row]));
const stated = (skill) => Number(auras.get(skill).stated);

const OURS = TOKEN.ours;
const THEIRS = TOKEN.theirs;

/* ---------------------------------------------------------------- A · Main */

const ustawka = [
    section("PIĘTNO BESTII", 2),
    auraRow("Gracz 3", OURS, 3, stated("Piętno bestii")),
    auraRow("Renegat 4", THEIRS, 6, stated("Piętno bestii")),
    section("SZADŹ", 1),
    auraRow("Renegat 2", THEIRS, 1, stated("Szadź")),
    section("PODWÓJNY DECH", 2),
    auraRow("Gracz 5", OURS, 4, stated("Podwójny dech")),
    auraRow("Gracz 9", OURS, 7, stated("Podwójny dech")),
    section("AURA OCHRONY", 1),
    auraRow("Gracz 1", OURS, 2, stated("Aura ochrony")),
    section("WYZYWAJĄCY OKRZYK", 1),
    auraRow("Renegat 6", THEIRS, 5, stated("Wyzywający okrzyk")),
    section("OSŁONA TARCZĄ", 1),
    auraRow("Gracz 6", OURS, 1, stated("Osłona tarczą")),
    section("OSTATNI RATUNEK", 2),
    plainRow("Renegat 1", "przebity", THEIRS),
    plainRow("Gracz 8", "przebity", OURS),
].join("");

const panel = `<div class="hold">
  <div class="mm-bar">⠿ MargoMeter <span class="mm-ver">0.12.1</span>
    <span class="mm-ctl">☰ ↓ —</span></div>
  <div class="mm-body">
    <div class="mm-head"><div class="mm-hl"><span>10 na 10</span>
      <span class="mm-out">TRWA</span></div>
      <div class="mm-place">Thuzal (12, 84)</div></div>
    <div class="mm-tabs"><span class="mm-tab on">Obrażenia</span>
      <span class="mm-tab">Leczenie</span></div>
    <div class="mm-tabs"><span class="mm-tab on">zadane</span><span class="mm-tab">otrzymane</span>
      <span class="mm-gap"></span><span class="mm-tab on">Wszyscy</span>
      <span class="mm-tab">My</span><span class="mm-tab">Oni</span></div>
    <div class="mm-list">
      ${
    [
        ["1.", "Gracz 3", "84 210", "(18%)", "#d95926", 100],
        ["2.", "Renegat 4", "71 004", "(15%)", "#3987e5", 84],
        ["3.", "Gracz 9", "60 118", "(13%)", "#199e70", 71],
        ["4.", "Gracz 5", "52 663", "(11%)", "#008300", 63],
        ["5.", "Renegat 2", "44 201", "(9%)", "#d55181", 52],
    ].map(([rank, name, figure, share, hue, width]) =>
        `<div class="mm-row">
        <div class="mm-fill" style="width:${width}%;background:${hue}"></div>
        <div class="mm-cap" style="background:${hue}"></div>
        <span class="mm-rank">${rank}</span><span class="mm-name">${name}</span>
        <span class="mm-val">${figure}<span class="mm-share">${share}</span></span></div>`
    ).join("")
}
    </div>
    <div class="mm-sides"><div class="mm-sl"><span class="ours">231 004</span>
      <span class="mm-slab">My / Oni</span><span class="theirs">218 776</span></div>
      <div class="mm-track"><span class="ours" style="flex:51"></span>
      <span class="theirs" style="flex:49"></span></div></div>
  </div>
</div>`;

const legend = `<div class="leg">
  <div class="item"><div class="swatch">
    <div class="pw-fill" style="width:45%;background:#4a6a55"></div>
    <div class="pw-rest" style="left:45%;width:55%;background:repeating-linear-gradient(135deg,${OURS}38 0 2px,transparent 2px 5px)"></div>
    <div class="pw-cap" style="background:${OURS}"></div></div>
    <div class="txt"><b>Pełne — policzone.</b> Tyle tur minęło rzucającemu.</div></div>
  <div class="item"><div class="swatch">
    <div class="pw-rest" style="left:0;width:100%;background:repeating-linear-gradient(135deg,${OURS}38 0 2px,transparent 2px 5px)"></div></div>
    <div class="txt"><b>Kreskowane — podane.</b> Tyle mówi tabela gry i nic tego nie potwierdza.</div></div>
  <div class="item"><div class="swatch"></div>
    <div class="txt"><b>Bez paska.</b> Coś, co stoi, ale nie ma podanego końca.</div></div>
</div>`;

writeFileSync(
    "Main.dc.html",
    page(sheet({
        tag: tag("Pomocnik w walce", "<span class='rec'>— rekomendacja</span>"),
        title: "Co teraz stoi, na kim i od kiedy",
        lede:
            `Jedno okno obok panelu, w skali 1:1. Panel mówi, co z walki wyszło; Pomocnik mówi, co w ` +
            `niej stoi w tej chwili. To nie jest trzecie okno — to <span class="m">MargoMeter-auras</span>, ` +
            `pasek aur wysyłany od 0.12.1, który urósł o stany, ładowanie przeciwnika i Ostatni Ratunek. ` +
            `Każdy wiersz niesie dwie rzeczy naraz: ile już minęło, i ile tabela gry <em>podaje</em> — ` +
            `pełne jest policzone, kreskowane jest tylko zapowiedziane.`,
        body: `<div class="stage">
  ${panel}
  ${hold("POMOCNIK — LISTA DOMYŚLNA", window_("Pomocnik", ustawka), OURS)}
  ${legend}
</div>`,
        notes: [
            note(
                "Dlaczego grupą jest umiejętność",
                `W ustawce czytelnik pyta „czy Piętno stoi i na kim", a nie „co stoi na Graczu 7". ` +
                    `Nagłówek jest obserwowaną rzeczą, wiersze pod nim to ci, na których stoi, a liczba ` +
                    `przy nagłówku mówi, ile ich jest, zanim oko zejdzie niżej.`,
            ),
            note(
                "Odejmowanie robi pasek",
                `Konkurencja pisze <span class="m">5</span> i to jest szybsze do przeczytania niż ` +
                    `<span class="m">3 z 8</span>. Dlatego liczby nie zostawiamy samej: część niewypełniona ` +
                    `<em>jest</em> tym, co zostało, a że jest kreskowana, widać przy okazji, że nikt tego ` +
                    `nie potwierdził.`,
                "good",
            ),
            note(
                "Zielony i czerwony to strony, nie ocena",
                `Ta sama zasada co w panelu: <span class="m">ours</span> i <span class="m">theirs</span> ` +
                    `mówią, kto to jest, i nic więcej. Rysowane wyłącznie tam, gdzie klient powiedział, ` +
                    `która strona jest czytelnika — inaczej wszystkie wiersze są jednakowe.`,
            ),
            note(
                "Skład jest zmyślony, gęstość nie",
                `W <span class="m">captures/</span> nie ma ani jednej walki grupowej między graczami ` +
                    `(<span class="m">docs/captured-fights.md</span>), więc te nazwiska są kształtem. ` +
                    `Wysokość wiersza, szerokość okna i wszystkie kolory są wzięte wprost z ` +
                    `<span class="m">src/ui/panel-look.ts</span>.`,
                "warn",
            ),
        ].join(""),
    })),
);

/* ------------------------------------------------------------ B · Roznice */

const rows = [
    ["Nazwa, poziom, profesja, zdrowie", "bierzemy", "Karta postaci w panelu już to niesie; w Pomocniku wiersz mówi to, co go dotyczy."],
    ["Pancerz i odporności", "bierzemy", "<span class=\"m\">ac</span> i trzy odporności stoją w każdej paczce i nic w <span class=\"m\">src/</span> ich dziś nie czyta."],
    ["Czy pancerz zniszczony", "bierzemy", "<span class=\"m\">+acdmg_destroyed</span> jest u nas zdekodowany od dawna — to stwierdzenie gry, nie nasz rachunek."],
    ["Umiejętność specjalna kolosa", "inaczej", "Rysujemy procent, który podaje sama gra, i nazwę. Nigdy „za 2 tury\" — krok procentu to nasz wniosek, nie jej słowo."],
    ["Klątwy, oślepienia, ogłuszenia", "inaczej", "Maska niesie osiem bitów i ani jednego rzucającego. Piszemy „od 4 tur\", nigdy „od kogo\"."],
    ["Czasy działania efektów", "inaczej", "Przebyte z podanych zamiast odliczania. Cały arkusz C jest o tym."],
    ["Dwa najmocniejsze czasy jako <span class=\"m\">x | y</span>", "inaczej", "Wiersz na rzucającego. W korpusie <span class=\"m\">Podwójny dech</span> stoi w czterech instancjach naraz — <span class=\"m\">x | y</span> pokazuje dwie."],
    ["Użyty ostatni ratunek", "bierzemy", "Wychodzi z okna gry do naszego: <span class=\"m\">legbon_lastheal</span> panel liczy już dziś."],
    ["Użyte leczenia i leczenia grupowe", "bierzemy", "To samo źródło co ranking leczenia — nic do dekodowania."],
    ["Dotyk anioła", "bierzemy", "<span class=\"m\">legbon_holytouch_heal</span>, zdekodowany."],
    ["Punkty kombinacji", "tylko dla czytelnika", "<span class=\"m\">skills_combo_max</span> przychodzi wyłącznie w jego własnym <span class=\"m\">init</span>. O cudzej postaci protokół nie mówi nic."],
    ["Wyzwania", "nie wiemy", "Nie zmierzone. Póki nie ma wpisu w rejestrze kluczy, nie ma wiersza."],
    ["Informacje w tipie postaci w grze", "nie robimy", "<em>The Guest Rule</em> — nic naszego nie sięga poza własny shadow root. To kosztuje nas powierzchnię i jest świadomym kosztem."],
    ["Przy wielu wrogach — pierwszy żyjący", "nie robimy", "Ustawka jest powodem, dla którego to okno powstaje. Arkusz H pokazuje, co robimy zamiast."],
    ["Przezroczystość tła, widoczność w walce", "bierzemy", "Dwie sensowne opcje. Arkusz L."],
];

const verdictColour = {
    "bierzemy": "#2c6b4c",
    "inaczej": "#a8600b",
    "nie robimy": "#8a3b2e",
    "nie wiemy": "#8a8478",
    "tylko dla czytelnika": "#8a8478",
};

const table = `<table class="reg">
<tr><th style="width:31%">Funkcja, którą tamten dodatek ma</th><th style="width:15%">U nas</th>
  <th>Dlaczego tak</th></tr>
${
    rows.map(([what, verdict, why]) =>
        `<tr><td>${what}</td><td class="mono" style="color:${verdictColour[verdict]}">${verdict}</td>` +
        `<td>${why}</td></tr>`
    ).join("\n")
}
</table>`;

writeFileSync(
    "Roznice.dc.html",
    page(sheet({
        tag: tag("Pozycjonowanie", "<span class='no'>— ta funkcja już istnieje</span>"),
        title: "Co bierzemy, co robimy inaczej, czego nie robimy",
        lede:
            `Pomocnik nie powstaje na pustym polu: dodatek o tym samym zakresie jest już w użyciu. ` +
            `Ta tabela jest po to, żeby żadna decyzja na pozostałych arkuszach nie wyglądała na ` +
            `przypadek. Trzy rzeczy robimy inaczej z tego samego powodu — protokół nie mówi, że efekt ` +
            `się skończył, nie mówi kto rzucił status, i nie wpuszcza nas do cudzego okna.`,
        body: `<div style="display:flex;flex-direction:column;gap:14px">${table}</div>`,
        notes: [
            note(
                "„Inaczej\" nie znaczy „mniej\"",
                `Każdy z trzech wierszy oznaczonych <span class="m">inaczej</span> niesie tyle samo ` +
                    `informacji co ich odpowiednik — różnica jest w tym, czego <em>nie</em> dopowiada. ` +
                    `Arkusze C i D pokazują to na jednym ekranie obok siebie.`,
            ),
            note(
                "Nazwy funkcji, nie cudze zdania",
                `Kolumna po lewej jest opisem zakresu własnymi słowami. Ani jedno zdanie tamtego dodatku ` +
                    `nie wchodzi do tego repozytorium, tak samo jak nie wchodzą zdania gry.`,
            ),
            note(
                "Tip w grze to nie tylko zasada",
                `Rezygnacja z tipów kosztuje sześć rzeczy, które oni mieszczą za darmo na cudzej ` +
                    `powierzchni. Arkusze I i K pokazują, gdzie te sześć rzeczy ląduje u nas i ile ` +
                    `kosztują we własnym oknie.`,
                "warn",
            ),
            note(
                "Czego nie ma w tej tabeli",
                `Rzeczy, których tamten dodatek nie pokazuje, a paczka je niesie: kolejka tur ` +
                    `(<span class="m">turns_warriors</span>) i cel przeciwnika (<span class="m">focus</span>). ` +
                    `Arkusze M i G.`,
                "good",
            ),
        ].join(""),
    })),
);

console.log("row 1: Main.dc.html Roznice.dc.html");
