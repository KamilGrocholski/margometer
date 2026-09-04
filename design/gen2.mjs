import { writeFileSync } from "node:fs";
import { page, glyph, PROF } from "./shared.mjs";

const mark = (k) => `<span>${glyph(k)}</span>`;

/* ================= Opcja D: rynna na wierszu rankingu ================= */

const dmg = [
  ["Amaimon Sopl…", PROF.npc, "141 710", "37%", ["spowolnienie", "przyspieszenie"], 100],
  ["Gracz 1", PROF.m, "38 004", "10%", ["rana"], 27],
  ["Gracz 3", PROF.w, "30 068", "8%", [], 21],
  ["Gracz 4", PROF.p, "24 199", "6%", ["zatrucie", "spowolnienie"], 17],
  ["Gracz 5", PROF.w, "23 901", "6%", ["ogien"], 17],
];
const dmgPlain = [
  ["Amaimon Soplorękie", PROF.npc, "141 710", "37%", 100],
  ["Gracz 1", PROF.m, "38 004", "10%", 27],
  ["Gracz 3", PROF.w, "30 068", "8%", 21],
  ["Gracz 4", PROF.p, "24 199", "6%", 17],
  ["Gracz 5", PROF.w, "23 901", "6%", 17],
];

const rowWith = (r, i) =>
  `<div class="mm-row">` +
  `<div class="mm-fill" style="width:${r[5]}%;background:${r[1]}"></div>` +
  `<div class="mm-cap" style="background:${r[1]}"></div>` +
  `<span class="mm-rank">${i + 1}.</span><span class="mm-name">${r[0]}</span>` +
  `<span class="mm-marks">${r[4].map(mark).join("")}</span>` +
  `<span class="mm-val">${r[2]}<span class="mm-share">(${r[3]})</span></span></div>`;

const rowPlain = (r, i) =>
  `<div class="mm-row">` +
  `<div class="mm-fill" style="width:${r[4]}%;background:${r[1]}"></div>` +
  `<div class="mm-cap" style="background:${r[1]}"></div>` +
  `<span class="mm-rank">${i + 1}.</span><span class="mm-name">${r[0]}</span>` +
  `<span class="mm-val">${r[2]}<span class="mm-share">(${r[3]})</span></span></div>`;

writeFileSync(
  "OpcjaD.dc.html",
  page(
    "Rynna na wierszu rankingu",
    `<div class="sheet">
<div class="tag"><span class="dot"></span>Gdzie · Opcja D<span class="no">— odrzucona</span></div>
<h1>Rynna na wierszu rankingu</h1>
<p class="lede">Znaki w tym samym wierszu, co obrażenia — nic nie trzeba otwierać ani przełączać. Rysunek jest tu po to, żeby pokazać rachunek, a nie żeby go polecić.</p>

<div class="stage">
  <div class="hold">
    <div class="cap">Dziś</div>
    <div class="mm-bar">⠿ MargoMeter <span class="mm-ver">0.12.1</span><span class="mm-ctl">☰ ⭳ —</span></div>
    <div class="mm-body">
      <div class="mm-tabs"><span class="mm-tab on">Obrażenia</span><span class="mm-tab">Leczenie</span></div>
      <div class="mm-tabs"><span class="mm-tab">zadane</span><span class="mm-tab on">otrzymane</span><span class="mm-gap"></span><span class="mm-tab on">Wszyscy</span><span class="mm-tab">My</span><span class="mm-tab">Oni</span></div>
      <div class="mm-list">${dmgPlain.map(rowPlain).join("")}</div>
    </div>
  </div>
  <div class="hold">
    <div class="cap">Ze znakami</div>
    <div class="mm-bar">⠿ MargoMeter <span class="mm-ver">0.12.1</span><span class="mm-ctl">☰ ⭳ —</span></div>
    <div class="mm-body">
      <div class="mm-tabs"><span class="mm-tab on">Obrażenia</span><span class="mm-tab">Leczenie</span></div>
      <div class="mm-tabs"><span class="mm-tab">zadane</span><span class="mm-tab on">otrzymane</span><span class="mm-gap"></span><span class="mm-tab on">Wszyscy</span><span class="mm-tab">My</span><span class="mm-tab">Oni</span></div>
      <div class="mm-list">${dmg.map(rowWith).join("")}</div>
    </div>
  </div>
</div>

<div class="notes">
  <div class="note"><h3 class="warn">To już raz przegrało</h3><p>ADR 0023 usunął z wiersza literę profesji 2026-08-29, bo zabierała szerokość jedynej komórce, która się skraca. Dwa znaki po 10 px plus odstępy to ten sam koszt jeszcze raz — po lewej „Amaimon Soplorękie", po prawej „Amaimon Sopl…".</p></div>
  <div class="note"><h3 class="warn">Wiersz mówi o czymś innym</h3><p>Ten wiersz jest o jednej liczbie i o udziale w niej. Znak stanu nie jest cięciem tej liczby ani niczym, co się do niej sumuje — stoi w niej jak obce zdanie.</p></div>
  <div class="note"><h3 class="warn">Cztery ekrany, jeden komplet znaków</h3><p>Rynna stoi wtedy na Zadanych, Otrzymanych i na obu ekranach leczenia, bo wiersz jest jeden. Ta sama informacja cztery razy, i cztery razy w miejscu, o które nikt nie pytał.</p></div>
  <div class="note"><h3>Co z tego zostaje</h3><p>Jedno: znak stanu i tak musi być na tyle mały, żeby zmieścił się w 18 px obok tekstu 11 px. Ten rachunek obowiązuje w każdym z pozostałych układów — plansza obok jest o tym.</p></div>
</div>
</div>`,
  ),
);

/* ================= Wiersz: anatomia ================= */

const cand = (title, rows, verdict, verdictKind) =>
  `<div class="hold">
    <div class="cap">${title}</div>
    <div class="mm-body" style="border-radius:8px">
      <div class="mm-list">${rows}</div>
    </div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;
      text-transform:uppercase;margin-top:9px;color:${verdictKind === "no" ? "#c98500" : "#8a8a80"}">${verdict}</div>
  </div>`;

const rowGlyphs = (n, hue, marks, t) =>
  `<div class="mm-row"><div class="mm-cap" style="background:${hue}"></div>` +
  `<span class="mm-name" style="padding-left:5px">${n}</span>` +
  `<span class="mm-marks">${marks.map(mark).join("")}</span>` +
  `<span class="mm-val">${t}</span></div>`;

const rowLetters = (n, hue, txt, t) =>
  `<div class="mm-row"><div class="mm-cap" style="background:${hue}"></div>` +
  `<span class="mm-name" style="padding-left:5px">${n}</span>` +
  `<span class="mm-marks"><span style="font:10px/1 ui-monospace,monospace;letter-spacing:.1em;color:#9a9aa6">${txt}</span></span>` +
  `<span class="mm-val">${t}</span></div>`;

const rowWords = (n, hue, words) =>
  `<div class="mm-row"><div class="mm-cap" style="background:${hue}"></div>` +
  `<span class="mm-name" style="padding-left:5px">${n}</span>` +
  `<span class="mm-val" style="font-weight:400;color:#9a9aa6;min-width:0;overflow:hidden;text-overflow:ellipsis;flex:1;text-align:right">${words}</span></div>`;

const rowBar = (n, hue, segs, t) =>
  `<div class="mm-row"><div class="mm-cap" style="background:${hue}"></div>` +
  `<span class="mm-name" style="padding-left:5px">${n}</span>` +
  `<span class="mm-marks"><span style="display:flex;width:56px;height:4px;border-radius:3px;overflow:hidden;background:#24242a;border:1px solid #2c2c35">${segs}</span></span>` +
  `<span class="mm-val">${t}</span></div>`;

writeFileSync(
  "Wiersz.dc.html",
  page(
    "Anatomia wiersza",
    `<div class="sheet">
<div class="tag"><span class="dot"></span>Jak · anatomia wiersza</div>
<h1>Cztery sposoby na jeden wiersz</h1>
<p class="lede">Osiemnaście pikseli wysokości, jedenaście pikseli tekstu, dwieście czterdzieści cztery piksele szerokości — z czego nazwa jest jedyną komórką, która się skraca. Cokolwiek tu stanie, musi się zmieścić obok niej.</p>

<div class="stage tight">
  ${cand("1 · Znaki", [
      rowGlyphs("Gracz 4", PROF.p, ["zatrucie", "spowolnienie"], "12 tur"),
      rowGlyphs("Gracz 9", PROF.t, ["rana", "zatrucie"], "5 tur"),
      rowGlyphs("Amaimon Soplorękie", PROF.npc, ["spowolnienie", "przyspieszenie", "bit"], "4 tury"),
    ].join(""), "Najmniej szerokości · trzeba się nauczyć", "ok")}
  ${cand("2 · Litery", [
      rowLetters("Gracz 4", PROF.p, "ZA SP", "12 tur"),
      rowLetters("Gracz 9", PROF.t, "RA ZA", "5 tur"),
      rowLetters("Amaimon Soplorękie", PROF.npc, "SP PR 10", "4 tury"),
    ].join(""), "Czytelne od razu · dwa razy więcej szerokości", "ok")}
  ${cand("3 · Słowa", [
      rowWords("Gracz 4", PROF.p, "zatrucie, spowolnienie"),
      rowWords("Gracz 9", PROF.t, "rana, zatrucie"),
      rowWords("Amaimon Sop…", PROF.npc, "spowolnienie, przy…"),
    ].join(""), "Nic do nauczenia · zjada nazwę i gubi tury", "ok")}
  ${cand("4 · Pasek tur", [
      rowBar("Gracz 4", PROF.p, `<span style="flex:12;background:#d55181"></span><span style="flex:4;background:#199e70"></span>`, "12 tur"),
      rowBar("Gracz 9", PROF.t, `<span style="flex:5;background:#c98500"></span><span style="flex:2;background:#d95926"></span>`, "5 tur"),
      rowBar("Amaimon Sop…", PROF.npc, `<span style="flex:4;background:#8a8a80"></span>`, "4 tury"),
    ].join(""), "Odrzucony · pasek obiecuje koniec, którego nie ma", "no")}
</div>

<div class="notes">
  <div class="note"><h3 class="warn">Litery się zderzają</h3><p>Spowolnienie i… no właśnie. Jednoliterowy skrót daje <span class="m">S</span> dwa razy, więc skrót musi być dwuliterowy — i wtedy trzy statusy to osiem znaków plus odstępy, czyli około 50 px z nazwy.</p></div>
  <div class="note"><h3 class="warn">Kolor nigdy sam</h3><p>Znaki są rysowane jednym atramentem, nie kolorem na status. Osiem odcieni jest już wydane na profesje, a reguła z <span class="m">DESIGN.md</span> mówi, że kolor nigdy nie niesie znaczenia sam — więc kształt musi wystarczyć bez niego.</p></div>
  <div class="note"><h3 class="warn">Dlaczego pasek odpada</h3><p>Pasek długości jest czytany jako „tyle zostało". Statusowi nic nie zostaje do odczytania: bit stoi, dopóki stoi, i protokół nigdy nie mówi, że przestał. To jest ta jedna rzecz, której ta plansza nie może narysować (ADR 0050).</p></div>
  <div class="note"><h3>Bit bez nazwy</h3><p>Bit 10 dostaje pusty kwadrat i szary atrament, a w wariancie z literami — <span class="m">10</span>. Klient gry nie ma dla niego słowa, więc panel też nie wymyśla.</p></div>
</div>
</div>`,
  ),
);

/* ================= Epizody ================= */

const ep = (name, from, width, open, turns) =>
  `<div class="mm-row"><span class="mm-name" style="flex:none;width:88px">${name}</span>` +
  `<span style="position:relative;flex:1;height:4px;border-radius:3px;background:#24242a;margin:0 6px">` +
  `<span style="position:absolute;left:${from}%;width:${width}%;top:0;bottom:0;background:#8a8a80;` +
  `border-radius:${open ? "3px 0 0 3px" : "3px"}"></span>` +
  (open ? `<span style="position:absolute;right:0;top:-2px;bottom:-2px;width:1px;background:#2c2c35"></span>` : "") +
  `</span><span class="mm-val">${turns}</span></div>`;

writeFileSync(
  "Epizody.dc.html",
  page(
    "Epizody po walce",
    `<div class="sheet">
<div class="tag"><span class="dot"></span>Jak · po walce</div>
<h1>Kiedy stało, a kiedy zniknęło</h1>
<p class="lede">To jedyne miejsce, w którym „kiedy znika" jest odczytane, a nie zgadnięte — dla epizodów, które walka zamknęła. Oś to zdarzenia walki, od pierwszego do ostatniego. Epizod, który wciąż stoi, nie ma prawego końca, bo nic go nie postawiło.</p>

<div class="stage">
  <div class="hold">
    <div class="cap">Poziom 2 · walka z półki</div>
    <div class="mm-bar">⠿ MargoMeter <span class="mm-ver">0.12.1</span><span class="mm-ctl">☰ ⭳ —</span></div>
    <div class="mm-body">
      <div class="mm-head"><div class="mm-hl"><span>10 vs 1</span><span class="mm-out">przegrana</span></div>
        <div class="mm-place">Krypta Wygnańców (12, 43)</div></div>
      <div class="mm-crumb"><span class="mm-back">‹ skład</span><span class="mm-here">Gracz 4</span></div>
      <div class="mm-list">
        <div class="mm-sec"><span>KIEDY STAŁO</span><span>5</span></div>
        ${ep("Zatrucie", 4, 62, false, "12 tur")}
        ${ep("Rana", 12, 22, false, "7 tur")}
        ${ep("Spowolnienie", 30, 18, false, "5 tur")}
        ${ep("Przyspieszenie", 51, 8, false, "2 tury")}
        ${ep("Spowolnienie", 74, 26, true, "4 tury")}
      </div>
      <div class="mm-note">Ostatni pasek dobiega końca walki i tam się urywa.<br>Gra nigdy nie powiedziała, że ten stan minął.</div>
    </div>
  </div>
</div>

<div class="notes">
  <div class="note"><h3 class="good">To jest odczyt, nie rysunek</h3><p>Sesja trzyma dla każdego epizodu indeks zdarzenia, na którym się zaczął, i tego, na którym się skończył (<span class="m">CombatantStatusEpisode</span>). Pasek jest tymi dwoma liczbami i niczym więcej.</p></div>
  <div class="note"><h3 class="warn">Statystyki tego nie niosą</h3><p><span class="m">StatusRun</span> na <span class="m">FightStatistics</span> ma już tylko <span class="m">turns</span>. Żeby ten pasek narysować, epizody muszą dojść do panelu z sesji — to jedyna zmiana kontraktu, jakiej ta plansza wymaga, i jest to pytanie „najpierw zapytaj".</p></div>
  <div class="note"><h3>Dwa spowolnienia, nie jedno</h3><p>Ten sam status stoi tu dwa razy, bo między nimi bit zgasł. Jeden nieprzerwany epizod to nie jedno rzucenie: odnowione, zanim minie, nigdy nie gasi bitu i czyta się jako jeden długi.</p></div>
  <div class="note"><h3>Dla półki, nie dla tury</h3><p>W trakcie walki ten pasek zmienia się co kilka sekund i nie ma na nim czego czytać. Sensu nabiera po walce, kiedy oś jest już zamknięta — więc mieszka na walce z półki, a nie na żywej.</p></div>
</div>
</div>`,
  ),
);
console.log("gen2 ok");
