/** Row three: the same window under three pressures — a duel, a colossus, and a ten-on-ten. */
import { readFileSync, writeFileSync } from "node:fs";
import {
    auraRow,
    chargeRow,
    hold,
    note,
    page,
    plainRow,
    section,
    sheet,
    tag,
    tint,
    TOKEN,
    window_,
} from "./pomocnik.mjs";

const measured = JSON.parse(readFileSync("measured.json", "utf8"));
const auras = new Map(measured.auras.map((row) => [row.skill, row]));
const stated = (skill) => Number(auras.get(skill).stated);
const OURS = TOKEN.ours;
const THEIRS = TOKEN.theirs;

/* -------------------------------------------------------- F · Pojedynek */

const duel = [
    section("SZADŹ", 1),
    auraRow("Przeciwnik", THEIRS, 2, stated("Szadź")),
    section("PODWÓJNY DECH", 1),
    auraRow("Ja", OURS, 6, stated("Podwójny dech")),
].join("");

writeFileSync(
    "Pojedynek.dc.html",
    page(sheet({
        tag: tag("1 na 1"),
        title: "Dwa wiersze albo żadnego okna",
        lede:
            `W pojedynku Pomocnik jest prawie pusty i to jest właściwa odpowiedź, a nie brak funkcji. ` +
            `Gdy nie stoi nic z obserwowanej listy, okno <b>znika</b> — nie pokazuje pustego stanu, ` +
            `nie ma przycisku i nie zajmuje rogu ekranu, żeby powiedzieć „nic". Tak samo działa dziś ` +
            `pasek aur (<span class="m">ADR 0053</span>) i Pomocnik tej reguły nie zmienia.`,
        body: `<div class="stage" style="align-items:flex-start">
  ${hold("COŚ STOI", window_("Pomocnik", duel, 190), OURS)}
  <div class="hold">
    <div class="cap" style="color:#6b6b75">NIC NIE STOI</div>
    <div style="width:190px;height:96px;border:1px dashed #33333d;border-radius:8px;
      display:flex;align-items:center;justify-content:center;color:#5a5a63;
      font:11px/15px system-ui,sans-serif;text-align:center;padding:0 16px">
      okna nie ma<br>— nie ma czego pokazać</div>
  </div>
  <div class="leg" style="width:280px">
    <div class="item"><div class="swatch" style="background:none;border:1px dashed #5a5a63"></div>
      <div class="txt"><b>Puste okno to nie stan.</b> To pudełko na cudzej grze, które mówi
      czytelnikowi, że nic nie wie — a on to widzi i bez pudełka.</div></div>
    <div class="item"><div class="swatch">
      <div class="pw-fill" style="width:25%;background:${tint(THEIRS)}"></div>
      <div class="pw-rest" style="left:25%;width:75%;background:repeating-linear-gradient(135deg,${THEIRS}38 0 2px,transparent 2px 5px)"></div>
      <div class="pw-cap" style="background:${THEIRS}"></div></div>
      <div class="txt"><b>Ta sama zasada w małej skali.</b> Dwa wiersze czyta się tak samo jak
      dwadzieścia — nic nie zmienia kształtu przy zmianie liczby.</div></div>
  </div>
</div>`,
        notes: [
            note(
                "Dlaczego to nie jest przypadek brzegowy",
                `Pojedynek jest testem tego, czy okno umie zniknąć. Panel tego nie umie i nie musi — ` +
                    `czytelnik go otworzył. Pomocnik pojawia się sam, więc musi też sam odejść.`,
            ),
            note(
                "Co z listą obserwowanych",
                `Zostaje. Okno mówi, co stoi; lista mówi, czego pilnujemy. Rzecz obserwowana, pod którą ` +
                    `nikogo nie ma, nie dostaje nagłówka — jej nieobecność <em>jest</em> odpowiedzią. ` +
                    `Gdzie tę listę zobaczyć, mówi arkusz L.`,
            ),
            note(
                "Jedyny pojedynek w materiale",
                `<span class="m">2026-08-12-experimental-tancerz-vs-wojownik</span> — jedyna walka ` +
                    `między dwoma graczami w <span class="m">captures/</span> i jedyne nagranie ` +
                    `z <span class="m">experimental</span>, którego build jest za produkcją.`,
                "warn",
            ),
            note(
                "Węższe okno, nie inne",
                `190 pikseli zamiast 200 — bo najdłuższa nazwa jest krótsza. To jedyna rzecz, którą ` +
                    `skala walki zmienia w kształcie; wysokość wiersza i wszystko inne zostaje.`,
            ),
        ].join(""),
    })),
);

/* ------------------------------------------------------------ G · Kolos */

const amaimon = measured.prepare.filter((row) => row.file.includes("amaimon"));
const cycles = new Map();
for (const row of amaimon) {
    const held = cycles.get(row.name);
    if (held === undefined || row.stops.length > held.stops.length) cycles.set(row.name, row);
}
const longest = [...cycles.values()].sort((one, two) => two.stops.length - one.stops.length)[0];
const focus = measured.corpus.focus;

const colossus = [
    section("ŁADUJE", 1),
    chargeRow(longest.name, THEIRS, 75),
    section("CEL", 1),
    plainRow("Gracz 4", "wskazany", THEIRS),
    section("PIĘTNO BESTII", 1),
    auraRow("Gracz 3", OURS, 3, stated("Piętno bestii")),
    section("AURA OCHRONY", 1),
    auraRow("Gracz 1", OURS, 6, stated("Aura ochrony")),
].join("");

const cycleTable = `<table class="reg" style="color:#e7e7ea">
<tr><th style="border-color:#2c2c35;color:#868691">umiejętność</th>
  <th style="border-color:#2c2c35;color:#868691">procenty, jakie padły</th>
  <th style="border-color:#2c2c35;color:#868691;text-align:right">krok</th>
  <th style="border-color:#2c2c35;color:#868691;text-align:right">wystąpień</th></tr>
${
    [...cycles.values()].map((row) =>
        `<tr><td style="border-color:#2c2c35">${row.name}</td>
    <td class="mono" style="border-color:#2c2c35;color:#9a9aa6">${row.stops.join(" · ")}%</td>
    <td class="n" style="border-color:#2c2c35">${row.step}</td>
    <td class="n" style="border-color:#2c2c35;color:#9a9aa6">${row.occurrences}</td></tr>`
    ).join("")
}
</table>`;

writeFileSync(
    "Kolos.dc.html",
    page(sheet({
        tag: tag("1 na 10 — kolos", "<span class='rec'>— zmierzone, nie zgadnięte</span>"),
        title: "Co ładuje i na kogo patrzy",
        lede:
            `Dwie rzeczy o przeciwniku, obie stwierdzone przez samą grę. <b>Ładowanie</b> przychodzi jako ` +
            `<span class="m">prepare=Nazwa(procent%)</span> — nazwa i procent, ${amaimon.reduce((sum, row) => sum + row.occurrences, 0)} ` +
            `wystąpień na dwóch nagraniach z Amaimonem, ${measured.prepare.length} serii na ` +
            `${new Set(measured.prepare.map((row) => row.file)).size} nagraniach w całym korpusie — ` +
            `i <b>ani jedna z nich nie należy do gracza</b>. <b>Cel</b> przychodzi jako ` +
            `<span class="m">focus</span> w wpisie postaci.`,
        body: `<div class="stage">
  ${hold("POMOCNIK W WALCE Z KOLOSEM", window_("Pomocnik", colossus), THEIRS)}
  <div style="flex:1;min-width:340px">
    <div class="cap" style="color:${THEIRS}">Cykl ładowania — Amaimon Soploręki, 10 na 1</div>
    ${cycleTable}
    <div class="cap" style="color:${THEIRS};margin-top:18px">Klucz <span class="m"
      style="background:#24242a;color:#e7e7ea">focus</span>, nad całym korpusem</div>
    <table class="reg" style="color:#e7e7ea">
      <tr><td style="border-color:#2c2c35;width:56%">odczytów niezerowych</td>
        <td class="n" style="border-color:#2c2c35">${focus.total}</td></tr>
      <tr><td style="border-color:#2c2c35">z nich trafia w kogoś z rostera</td>
        <td class="n" style="border-color:#2c2c35;color:${OURS}">${focus.inRoster}</td></tr>
      <tr><td style="border-color:#2c2c35">wskazuje <b>drugą stronę</b></td>
        <td class="n" style="border-color:#2c2c35;color:${OURS}">${focus.otherSide}</td></tr>
      <tr><td style="border-color:#2c2c35">niesiony przez postać gracza</td>
        <td class="n" style="border-color:#2c2c35">${focus.bearerPlayer}</td></tr>
      <tr><td style="border-color:#2c2c35">zmienia się w trakcie walki</td>
        <td class="n" style="border-color:#2c2c35">${focus.changed}</td></tr>
      <tr><td style="border-color:#2c2c35">nagrań, które go niosą</td>
        <td class="n" style="border-color:#2c2c35;color:#9a9aa6">${focus.recordings} z ${measured.corpus.recordings}</td></tr>
    </table>
  </div>
</div>`,
        notes: [
            note(
                "To poprawia wcześniejszą makietę",
                `Plansza <span class="m">H · Kolosy</span> z <span class="m">0988cfc</span> nazywa to ` +
                    `spekulacją i mówi, że <span class="m">prepare</span> jest deklaracją bez figury. ` +
                    `Rejestr kluczy mówił co innego już wtedy (<span class="m">docs/protocol-keys.md</span>, ` +
                    `wpis <span class="m">prepare</span>), a korpus niesie ${measured.prepare.length} serii. ` +
                    `Tamten arkusz zostaje — to jest ten, który go prostuje (<b>V6</b>).`,
                "warn",
            ),
            note(
                "Procent, nigdy „za dwie tury\"",
                `Krok mówi, ile jest stopni — ${longest.name} ma ${longest.stops.length}. Ale że jeden ` +
                    `stopień to jedna tura przeciwnika, jest <em>naszym</em> wnioskiem, a nie słowem gry. ` +
                    `Rysujemy więc procent, który gra podaje, i pasek pełny na całej długości: tu nie ma ` +
                    `nic zapowiedzianego, więc nie ma czego kreskować.`,
                "good",
            ),
            note(
                "Cel jest stwierdzeniem, ale wąskim",
                `Wszystkie ${focus.total} odczyty niesie postać niebędąca graczem, po jednej na walkę, ` +
                    `i żaden nie zmienia się do końca. To wystarcza na wiersz „na kogo patrzy kolos" ` +
                    `i <b>nie</b> wystarcza na „kto na kim się skupia w ustawce" — w korpusie nie ma ` +
                    `ani jednej walki między drużynami graczy.`,
                "warn",
            ),
            note(
                "Czego rejestr kluczy jeszcze nie mówi",
                `<span class="m">focus</span> ma tam wpis <em>not looked into</em>. Zanim ten wiersz ` +
                    `powstanie w kodzie, wpis dostaje werdykt — pomiar bez wpisu w rejestrze to nie jest ` +
                    `odczyt, tylko notatka.`,
            ),
        ].join(""),
    })),
);

/* ---------------------------------------------------------- H · Ustawka */

const watched = [
    ["PIĘTNO BESTII", 2, 1],
    ["SZADŹ", 0, 3],
    ["PODWÓJNY DECH", 3, 1],
    ["AURA OCHRONY", 1, 1],
    ["WYZYWAJĄCY OKRZYK", 1, 0],
    ["OSŁONA TARCZĄ", 2, 0],
    ["JADOWITY PODMUCH", 0, 1],
    ["OSTATNI RATUNEK", 1, 2],
];

/**
 * The compressed answer: one row per watched thing, both sides on it, nobody named.
 * Length is the row against the biggest count on screen — the panel's own rule for a bar — and the
 * split inside that length is whose.
 */
const busiest = Math.max(...watched.map(([, mine, other]) => mine + other));

function tallyRow(name, mine, theirsCount) {
    const total = mine + theirsCount;
    if (total === 0) return "";
    const length = (total / busiest) * 100;
    const mineShare = (mine / total) * length;
    return `<div class="pw-row">
    <div class="pw-fill" style="width:${mineShare}%;background:${tint(OURS)}"></div>
    <div class="pw-fill" style="left:${mineShare}%;width:${length - mineShare}%;background:${tint(THEIRS)}"></div>
    <span class="pw-name" style="font-size:10px;letter-spacing:.04em">${name}</span>
    <span class="pw-val"><span style="color:${OURS}">${mine}</span>
      <span class="of">/</span><span style="color:${THEIRS}">${theirsCount}</span></span></div>`;
}

const compressed = watched.map(([name, mine, other]) => tallyRow(name, mine, other)).join("");

const opened = [
    tallyRow("PIĘTNO BESTII", 2, 1),
    section("RZUCAJĄCY", 3),
    auraRow("Gracz 3", OURS, 3, stated("Piętno bestii")),
    auraRow("Gracz 7", OURS, 6, stated("Piętno bestii")),
    auraRow("Renegat 4", THEIRS, 1, stated("Piętno bestii")),
    tallyRow("SZADŹ", 0, 3),
    tallyRow("PODWÓJNY DECH", 3, 1),
].join("");

writeFileSync(
    "Ustawka.dc.html",
    page(sheet({
        tag: tag("10 na 10", "<span class='no'>— arkusz ciśnienia</span>"),
        title: "Dwadzieścia postaci w dwustu pikselach",
        lede:
            `Pełne grupowanie z arkusza A daje w ustawce siedemnaście wierszy i rośnie dalej. To się ` +
            `mieści na ekranie i <em>nie</em> mieści się w jednym spojrzeniu między turami. Odpowiedzią ` +
            `jest <b>zliczenie zamiast wyliczenia</b>: jeden wiersz na obserwowaną rzecz, obie strony ` +
            `na nim, i nikt z nazwiska — dopóki czytelnik nie naciśnie.`,
        body: `<div class="stage">
  ${hold("PEŁNE — 17 WIERSZY", window_("Pomocnik", [
        section("PIĘTNO BESTII", 3),
        auraRow("Gracz 3", OURS, 3, 8),
        auraRow("Gracz 7", OURS, 6, 8),
        auraRow("Renegat 4", THEIRS, 1, 8),
        section("SZADŹ", 3),
        auraRow("Renegat 2", THEIRS, 1, 8),
        auraRow("Renegat 5", THEIRS, 4, 8),
        auraRow("Renegat 9", THEIRS, 7, 8),
        section("PODWÓJNY DECH", 4),
        auraRow("Gracz 5", OURS, 4, 8),
        auraRow("Gracz 9", OURS, 7, 8),
        auraRow("Gracz 1", OURS, 2, 8),
        auraRow("Renegat 1", THEIRS, 5, 8),
        section("…", "+6"),
    ].join("")), TOKEN.suspect)}
  ${hold("ZLICZONE — 7 WIERSZY", window_("Pomocnik", compressed), OURS)}
  ${hold("ZLICZONE, JEDNO OTWARTE", window_("Pomocnik", opened), OURS)}
  <div class="leg" style="width:236px">
    <div class="item"><div class="swatch" style="display:flex">
      <span style="flex:2;background:${tint(OURS)}"></span>
      <span style="flex:1;background:${tint(THEIRS)}"></span></div>
      <div class="txt"><b>Jeden pasek, dwie strony.</b> Długość mówi, ile stoi, wobec
      najliczniejszego wiersza; podział w środku mówi, czyje.</div></div>
    <div class="item"><div class="swatch"></div>
      <div class="txt"><b>Zero nie ma wiersza.</b> Rzecz, pod którą nikogo nie ma, znika
      z okna — jej brak jest odpowiedzią.</div></div>
    <div class="item"><div class="swatch" style="background:${tint(OURS)}"></div>
      <div class="txt"><b>Naciśnięcie otwiera jedną.</b> Wiersze z nazwiskami wchodzą pod nią
      i nic powyżej się nie przesuwa.</div></div>
  </div>
</div>`,
        notes: [
            note(
                "Rekomendacja: zliczone, z otwieraniem",
                `Siedem wierszy zamiast siedemnastu, a odpowiedź na „czy Szadź stoi i ilu ich ma" ` +
                    `jest w jednym spojrzeniu. Nazwiska są o jedno naciśnięcie dalej i to jest właściwa ` +
                    `odległość: w ustawce najpierw pyta się <em>ile</em>, potem <em>kto</em>.`,
                "good",
            ),
            note(
                "Co to kosztuje",
                `Kto konkretnie ma Piętno, nie jest już widoczne bez gestu — a przy trzech otwartych ` +
                    `rzeczach okno wraca do siedemnastu wierszy. Dlatego otwarta może być <b>jedna</b> ` +
                    `naraz, tak samo jak w panelu poziom drugi zamyka poprzedni.`,
                "warn",
            ),
            note(
                "Tego kształtu nie widział żaden pomiar",
                `W <span class="m">captures/</span> nie ma ani jednej walki grupowej między graczami, ` +
                    `a najszersza strona przeciwna to trzech ` +
                    `(<span class="m">docs/captured-fights.md</span>). Wszystkie liczby na tym arkuszu ` +
                    `są kształtem, nie odczytem — i to jest powód, dla którego pierwsza pozycja ` +
                    `<span class="m">TODO.md</span> prosi o nagrania PvP.`,
                "warn",
            ),
            note(
                "Czego tu nie ma i nie będzie",
                `Wyboru „pierwszy żyjący wróg". Ustawka jest powodem, dla którego to okno powstaje — ` +
                    `okno, które przy dziesięciu przeciwnikach pokazuje jednego, odpowiada na inne ` +
                    `pytanie niż zadane.`,
            ),
        ].join(""),
    })),
);

console.log("row 3: Pojedynek.dc.html Kolos.dc.html Ustawka.dc.html");
