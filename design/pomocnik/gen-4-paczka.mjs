/** Row four: three things the payload already carries that nothing in `src/` reads yet. */
import { readFileSync, writeFileSync } from "node:fs";
import {
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
const OURS = TOKEN.ours;
const THEIRS = TOKEN.theirs;
const SUSPECT = TOKEN.suspect;

/* --------------------------------------------------------- I · Pancerz */

/** What is left of a statistic, against what it opened at. Loss grows leftward from full. */
function strippedRow(name, left, full, hue) {
    const share = (left / full) * 100;
    return `<div class="pw-row">
    <div class="pw-fill" style="width:${share}%;background:${tint(hue)}"></div>
    <div class="pw-rest" style="left:${share}%;width:${100 - share}%;
      background:repeating-linear-gradient(135deg,${SUSPECT}55 0 2px,transparent 2px 5px)"></div>
    <div class="pw-cap" style="background:${hue}"></div>
    <span class="pw-name">${name}</span>
    <span class="pw-val">${left}<span class="of"> z ${full}</span></span></div>`;
}

const armour = [
    section("PANCERZ", 3),
    strippedRow("Renegat 4", 812, 1687, THEIRS),
    strippedRow("Gracz 3", 1351, 1351, OURS),
    `<div class="pw-row">
    <div class="pw-rest" style="left:0;width:100%;
      background:repeating-linear-gradient(135deg,${SUSPECT}55 0 2px,transparent 2px 5px)"></div>
    <div class="pw-cap" style="background:${THEIRS}"></div>
    <span class="pw-name">Renegat 2</span>
    <span class="pw-mark">⚠</span>
    <span class="pw-val">zniszczony</span></div>`,
    section("ODPORNOŚCI", 1),
    plainRow("Renegat 4 · ogień", "4 z 30", THEIRS),
].join("");

writeFileSync(
    "Pancerz.dc.html",
    page(sheet({
        tag: tag("Co jeszcze niesie paczka", "<span class='no'>— i nikt tego nie czyta</span>"),
        title: "Pancerz i odporności",
        lede:
            `Każdy wpis postaci w każdej paczce niesie <span class="m">ac</span> i trzy odporności, ` +
            `jako <span class="m">cur</span> obok <span class="m">bonus</span> — a ` +
            `<span class="m">grep -rn "resfire" src/</span> nie zwraca dziś niczego. Osobno jest ` +
            `stwierdzenie, że pancerza już nie ma: <span class="m">+acdmg_destroyed</span>, ` +
            `zdekodowane, <b>${measured.corpus.armourDestroyed}</b> wystąpień w korpusie. To nie jest ` +
            `figura — to zdanie gry, że doszło do zera.`,
        body: `<div class="stage">
  ${hold("POMOCNIK — PANCERZ WŁĄCZONY", window_("Pomocnik", armour), SUSPECT)}
  <div class="leg" style="width:300px">
    <div class="item"><div class="swatch">
      <div class="pw-fill" style="width:48%;background:${tint(THEIRS)}"></div>
      <div class="pw-rest" style="left:48%;width:52%;background:repeating-linear-gradient(135deg,${SUSPECT}55 0 2px,transparent 2px 5px)"></div>
      <div class="pw-cap" style="background:${THEIRS}"></div></div>
      <div class="txt"><b>Pełne to, co zostało.</b> Kreskowane to, co zdjęto — i rośnie
      w przeciwną stronę niż na wierszu aury, bo to ubytek, a nie upływ.</div></div>
    <div class="item"><div class="swatch">
      <div class="pw-rest" style="left:0;width:100%;background:repeating-linear-gradient(135deg,${SUSPECT}55 0 2px,transparent 2px 5px)"></div></div>
      <div class="txt"><b>Zero to nie brak odczytu.</b> Pusty pasek plus słowo
      <span class="m">zniszczony</span> — bo <span class="m">0</span> jest pomiarem.</div></div>
    <div class="item"><div class="swatch" style="background:none;color:${SUSPECT};
      display:flex;align-items:center;justify-content:center;font-size:12px">⚠</div>
      <div class="txt"><b>Znak stoi przy swojej konsekwencji.</b> Na wierszu, którego dotyczy,
      nigdy na całym oknie.</div></div>
  </div>
  <div style="flex:1;min-width:270px">
    <div class="cap" style="color:${SUSPECT}">Co dokładnie stoi we wpisie postaci</div>
    <table class="reg" style="color:#e7e7ea">
      <tr><td class="mono" style="border-color:#2c2c35;width:38%">ac.cur / ac.bonus</td>
        <td style="border-color:#2c2c35;color:#9a9aa6">pancerz teraz i ile z tego dołożyły aury</td></tr>
      <tr><td class="mono" style="border-color:#2c2c35">resfire · resfrost · reslight</td>
        <td style="border-color:#2c2c35;color:#9a9aa6">to samo, w punktach procentowych</td></tr>
      <tr><td class="mono" style="border-color:#2c2c35">+acdmg</td>
        <td style="border-color:#2c2c35;color:#9a9aa6">ile zdjął ten cios — figura</td></tr>
      <tr><td class="mono" style="border-color:#2c2c35">+acdmg_destroyed</td>
        <td style="border-color:#2c2c35;color:#9a9aa6">że pancerza już nie ma — nie figura</td></tr>
      <tr><td class="mono" style="border-color:#2c2c35">+resdmg</td>
        <td style="border-color:#2c2c35;color:#9a9aa6">ile punktów odporności zdjął</td></tr>
    </table>
  </div>
</div>`,
        notes: [
            note(
                "Dwie jednostki, nigdy jedna liczba",
                `Pancerz jest w punktach, odporność w punktach procentowych. ` +
                    `<span class="m">CONTEXT.md</span> nazywa to <em>Destroyed</em> i mówi wprost: ` +
                    `to nie są obrażenia, nie sumuje się tego z niczym, i jego własne składniki też ` +
                    `nie są w jednej jednostce.`,
            ),
            note(
                "„Z 1687\" jest odczytem, nie pamięcią",
                `Mianownik to <span class="m">ac.cur</span> z pierwszej paczki, w której postać ` +
                    `w ogóle się pojawiła. Gdy czytelnik wszedł w walkę w połowie, mianownika nie ma — ` +
                    `i wtedy wiersz mówi samą wartość bez „z", zamiast zmyślać sufit.`,
                "warn",
            ),
            note(
                "Co to daje w ustawce",
                `Odpowiedź na „w kogo bić" bez otwierania cudzej karty: pusty pasek pancerza po ` +
                    `czerwonej stronie to cel. To jest jedyne miejsce w Pomocniku, gdzie odczyt ` +
                    `podpowiada decyzję — i podpowiada ją tak, jak zrobiłby to sam log gry.`,
                "good",
            ),
            note(
                "Osobna decyzja: to nie jest domyślne",
                `Pancerz i odporności to dwadzieścia wierszy w ustawce. Na liście domyślnej ich nie ma; ` +
                    `są do włączenia, i arkusz L jest o tym, jak.`,
            ),
        ].join(""),
    })),
);

/* ------------------------------------------------------------ J · Stany */

const statuses = measured.statuses;
const WORDS = {
    deep_wound: "głęboka rana",
    wound: "rana",
    poisoned: "zatrucie",
    fire: "podpalenie",
    swow_down: "spowolnienie",
    speed_up: "przyspieszenie",
    shock: "wstrząs",
};

const stateRows = [
    section("SPOWOLNIENIE", 3),
    plainRow("Renegat 2", "od 4 tur", THEIRS),
    plainRow("Renegat 5", "od 1 tury", THEIRS),
    plainRow("Renegat 9", "od 12 tur", THEIRS),
    section("ZATRUCIE", 1),
    plainRow("Gracz 7", "od 9 tur", OURS),
    section("BIT 10", 1),
    `<div class="pw-row"><div class="pw-cap" style="background:${TOKEN.unknown}"></div>
    <span class="pw-name" style="color:${TOKEN.quiet}">Renegat 1</span>
    <span class="pw-val" style="color:${TOKEN.quiet}">od 7 tur</span></div>`,
].join("");

const bitsTable = `<table class="reg" style="color:#e7e7ea">
<tr><th style="border-color:#2c2c35;color:#868691;text-align:right">bit</th>
  <th style="border-color:#2c2c35;color:#868691">klucz klienta</th>
  <th style="border-color:#2c2c35;color:#868691">nasze słowo</th>
  <th style="border-color:#2c2c35;color:#868691;text-align:right">epizodów</th>
  <th style="border-color:#2c2c35;color:#868691;text-align:right">najdłuższy</th></tr>
${
    statuses.map((row) => {
        const words = WORDS[row.status] ?? "—";
        const quiet = words === "—" ? `color:${TOKEN.unknown}` : "";
        return `<tr><td class="n" style="border-color:#2c2c35">${row.bit}</td>
    <td class="mono" style="border-color:#2c2c35;color:#9a9aa6">${row.status}</td>
    <td style="border-color:#2c2c35;${quiet}">${words}</td>
    <td class="n" style="border-color:#2c2c35">${row.episodes}</td>
    <td class="n" style="border-color:#2c2c35;color:#9a9aa6">${row.longest}</td></tr>`;
    }).join("")
}
</table>`;

writeFileSync(
    "Stany.dc.html",
    page(sheet({
        tag: tag("Stany z maski", "<span class='no'>— bez rzucającego i bez reszty</span>"),
        title: "Osiem bitów, jedna liczba całkowita",
        lede:
            `Gra podaje na postać <b>jedną liczbę</b> — <span class="m">payload.w.&lt;id&gt;.buffs</span> ` +
            `— i nic więcej: bez czasu trwania, bez rzucającego, bez tego, ile zostało. Klient czyta ` +
            `z niej dziewięć bitów. Wiersz stanu ma więc kształt inny niż wiersz aury: <b>nie ma paska</b>, ` +
            `bo nie ma podanego końca, wobec którego cokolwiek by się wypełniało.`,
        body: `<div class="stage">
  ${hold("POMOCNIK — STANY WŁĄCZONE", window_("Pomocnik", stateRows), SUSPECT)}
  <div style="flex:1;min-width:400px">
    <div class="cap">Rejestr — <span class="m" style="background:#24242a;color:#e7e7ea">deno task
      fight:statuses</span>, nad całym <span class="m" style="background:#24242a;color:#e7e7ea">captures/</span></div>
    ${bitsTable}
  </div>
</div>`,
        notes: [
            note(
                "Bit 10 rysujemy jako bit 10",
                `Nie ma nazwy, a pętla klienta kończy się na ósmym — więc żaden klient tego nie rysuje. ` +
                    `Maska <span class="m">1056</span> pada 12 razy w jednym nagraniu. Zgadywanie, co to ` +
                    `jest, byłoby nazwą naszej roboty; rozbieżność między tym, co gra wysyła, a tym, co ` +
                    `czyta jej własny klient, <em>jest</em> znaleziskiem (<b>V6</b>).`,
                "warn",
            ),
            note(
                "Słowo, którego nie wolno użyć drugi raz",
                `<span class="m">HEALTH_LOSS_WORDS</span> oddaje „głęboka rana" kluczowi ` +
                    `<span class="m">wound</span>, a maska niesie <span class="m">wound</span> ` +
                    `i <span class="m">deep_wound</span> osobno. Tabela słów dla stanów, która ` +
                    `sięgnie po tamten wpis, postawi dwa różne odczyty pod jednym słowem w dwóch ` +
                    `miejscach — i nic się przy tym nie zepsuje (<b>N13</b>).`,
                "warn",
            ),
            note(
                "„Od 4 tur\", nigdy „przez 4 tury\"",
                `Długość to tyle, ile bit stoi <em>nieprzerwanie</em>, w turach obarczonego. Efekt ` +
                    `nałożony ponownie nigdy nie gasi bitu, więc jeden epizod to nie jedno nałożenie — ` +
                    `w korpusie jeden ciągnie się przez 47 tur, przy tabeli mówiącej o dwóch.`,
            ),
            note(
                "Rzucającego nie ma i nie będzie",
                `Gdy bit się zapala, żaden komunikat celowany w obarczonego tego nie mówi — stoją tam ` +
                    `klucze ciosu i nic o tym, co po nim zostało. Najlepszy odczyt trafia 70 razy na 223 ` +
                    `(<span class="m">ADR 0052</span>), a to nie jest figura, którą się rysuje.`,
            ),
        ].join(""),
    })),
);

/* ---------------------------------------------------------- K · Ratunek */

const lastheal = measured.corpus.lasthealRecordings;
const holytouch = measured.corpus.holytouchRecordings;

const rescue = [
    section("OSTATNI RATUNEK", 2),
    plainRow("Renegat 1", "przebity", THEIRS),
    plainRow("Gracz 8", "przebity", OURS),
    section("DOTYK ANIOŁA", 1),
    plainRow("Gracz 2", "3 razy", OURS),
].join("");

const cannot = `<div style="width:200px">
  <div class="cap" style="color:#8a3b2e">CZEGO TU NIGDY NIE BĘDZIE</div>
  <div class="pw-body" style="border:1px dashed #4a2f28;border-radius:8px">
    <div class="pw-sec"><span>OSTATNI RATUNEK</span><span class="n">8</span></div>
    ${["Renegat 3", "Renegat 5", "Gracz 1"].map((who) =>
        `<div class="pw-row" style="opacity:.4">
      <span class="pw-name">${who}</span><span class="pw-val">dostępny</span></div>`
    ).join("")}
    <div class="pw-note" style="color:#8a3b2e">nic nie mówi, kto ten bonus ma</div>
  </div>
</div>`;

writeFileSync(
    "Ratunek.dc.html",
    page(sheet({
        tag: tag("Ostatni Ratunek i leczenia"),
        title: "Komu już przebity",
        lede:
            `To, co tamten dodatek chowa w tipie postaci, u nas stoi w oknie — i nie wymaga ani jednej ` +
            `linijki dekodowania: <span class="m">legbon_lastheal</span> panel liczy już dziś, per ` +
            `postać, w <span class="m">healthRestoredBySource</span>. Pada w ` +
            `<b>${lastheal.length}</b> nagraniach z ${measured.corpus.recordings}; ` +
            `<span class="m">legbon_holytouch_heal</span> w ${holytouch.length}. Brakuje tylko sekcji, ` +
            `która to pokaże w trakcie walki, a nie po niej.`,
        body: `<div class="stage">
  ${hold("POMOCNIK — CO JUŻ PADŁO", window_("Pomocnik", rescue), OURS)}
  ${cannot}
  <div class="leg" style="width:290px">
    <div class="item"><div class="swatch" style="background:none;border-left:3px solid ${THEIRS};
      border-radius:0"></div>
      <div class="txt"><b>„Przebity" to zdarzenie, nie stan.</b> Padło i zostaje w tej walce —
      więc wiersz nie znika, tak jak nie znika, gdy efekt wygasa.</div></div>
    <div class="item"><div class="swatch" style="background:none;border:1px dashed #4a2f28"></div>
      <div class="txt"><b>„Dostępny" byłoby zmyśleniem.</b> Protokół mówi tylko, komu bonus
      <em>zadziałał</em>. Kto go w ogóle ma, nie pada nigdzie.</div></div>
    <div class="item"><div class="swatch"></div>
      <div class="txt"><b>Liczba przy nagłówku jest liczbą wierszy.</b> Nigdy liczbą tych,
      którym jeszcze został.</div></div>
  </div>
</div>`,
        notes: [
            note(
                "Dlaczego to jest najtańsza rzecz w całym zestawie",
                `Nie ma tu nic do zdekodowania, nic do zmierzenia i nic do rozstrzygnięcia. ` +
                    `<span class="m">healthRestoredBySource</span> trzyma ten klucz per postać od dawna; ` +
                    `Pomocnik tylko pyta o niego w trakcie walki zamiast po.`,
                "good",
            ),
            note(
                "Ten sam ruch dla dotyku anioła",
                `<span class="m">legbon_holytouch_heal</span>, z tego samego miejsca i z tą samą ` +
                    `granicą: ile razy zadziałał, nigdy ile razy jeszcze może.`,
            ),
            note(
                "Osiem twarzy, których nie znamy",
                `Prawa makieta pokazuje kształt, który wyglądałby jak odczyt i nim nie jest. Osiem ` +
                    `to liczba postaci w walce, a nie liczba posiadaczy bonusu — i właśnie dlatego ` +
                    `tego wiersza nie będzie.`,
                "warn",
            ),
            note(
                "Skąd te liczby nagrań",
                `<span class="m">measure.mjs</span> przechodzi po ` +
                    `<span class="m">captures/</span> i liczy komunikaty niosące każdy z tych dwóch ` +
                    `kluczy. Arkusz ich nie przepisuje — bierze je przy każdym generowaniu.`,
            ),
        ].join(""),
    })),
);

console.log("row 4: Pancerz.dc.html Stany.dc.html Ratunek.dc.html");
