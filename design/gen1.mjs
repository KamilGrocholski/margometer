import { writeFileSync } from "node:fs";
import { page, glyph, PROF } from "./shared.mjs";

const mark = (k) => `<span title="${k}">${glyph(k)}</span>`;

/* ================= Main: Stan jako ekran panelu (Opcja B) ================= */

const l1rows = [
  { n: "Gracz 4", hue: PROF.p, marks: ["zatrucie", "spowolnienie"], t: "12 tur", w: false },
  { n: "Gracz 7", hue: PROF.b, marks: ["spowolnienie"], t: "9 tur", w: true },
  { n: "Gracz 2", hue: PROF.h, marks: ["przyspieszenie"], t: "6 tur", w: false },
  { n: "Gracz 9", hue: PROF.t, marks: ["rana", "zatrucie"], t: "5 tur", w: false },
  { n: "Amaimon Soplorękie", hue: PROF.npc, marks: ["spowolnienie", "przyspieszenie", "bit"], t: "4 tury", w: false },
  { n: "Gracz 5", hue: PROF.w, marks: ["ogien"], t: "2 tury", w: false },
  { n: "Gracz 1", hue: PROF.m, marks: ["rana"], t: "1 tura", w: false },
];

const l1 = l1rows.map((r, i) =>
  `<div class="mm-row">` +
  `<div class="mm-fill" style="width:${100 - i * 11}%;background:${r.hue}"></div>` +
  `<div class="mm-cap" style="background:${r.hue}"></div>` +
  `<span class="mm-rank">${i + 1}.</span>` +
  (r.w ? `<span class="mm-warn">⚠</span>` : ``) +
  `<span class="mm-name">${r.n}</span>` +
  `<span class="mm-marks">${r.marks.map(mark).join("")}</span>` +
  `<span class="mm-val">${r.t}</span>` +
  `</div>`
).join("");

const l2standing = [["Zatrucie", "12 tur"], ["Spowolnienie", "4 tury"]];
const l2closed = [["Rana", "7 tur"], ["Spowolnienie", "5 tur"], ["Przyspieszenie", "2 tury"]];
const plain = (rows) =>
  rows.map(([a, b]) =>
    `<div class="mm-row"><span class="mm-name">${a}</span>` +
    `<span class="mm-val">${b}</span></div>`
  ).join("");

writeFileSync(
  "Main.dc.html",
  page(
    "Stan jako ekran panelu",
    `<div class="sheet">
<div class="tag"><span class="dot"></span>Gdzie · Opcja B<span class="rec">— rekomendacja</span></div>
<h1>Stan jako ekran panelu</h1>
<p class="lede">Nowa zakładka obok „Obrażenia" i „Leczenie". Wiersz na postać, znaki tego, co na niej stoi, a po prawej najdłużej stojący status. Naciśnięcie wiersza otwiera drugi poziom — wszystkie epizody tej postaci, stojące i zamknięte.</p>

<div class="stage">
  <div class="hold">
    <div class="cap">Poziom 1 — skład</div>
    <div class="mm-bar">⠿ MargoMeter <span class="mm-ver">0.12.1</span><span class="mm-ctl">☰ ⭳ —</span></div>
    <div class="mm-body">
      <div class="mm-head"><div class="mm-hl"><span>10 vs 1</span><span class="mm-out">trwa</span></div>
        <div class="mm-place">Preview (1, 1)</div></div>
      <div class="mm-tabs"><span class="mm-tab">Obrażenia</span><span class="mm-tab">Leczenie</span><span class="mm-tab on">Stan</span></div>
      <div class="mm-tabs"><span class="mm-gap"></span><span class="mm-tab on">Wszyscy</span><span class="mm-tab">My</span><span class="mm-tab">Oni</span></div>
      <div class="mm-list">
        <div class="mm-sec"><span>KTO CO MA</span><span>NAJDŁUŻEJ</span></div>
        ${l1}
      </div>
      <div class="mm-sides">
        <div class="mm-sl"><span class="ours">My 5</span><span class="mm-slab">Postacie ze stanem</span><span class="theirs">2</span></div>
        <div class="mm-track"><span class="ours" style="flex:5"></span><span class="theirs" style="flex:2"></span></div>
      </div>
    </div>
  </div>

  <div class="hold">
    <div class="cap">Poziom 2 — jedna postać</div>
    <div class="mm-bar">⠿ MargoMeter <span class="mm-ver">0.12.1</span><span class="mm-ctl">☰ ⭳ —</span></div>
    <div class="mm-body">
      <div class="mm-head"><div class="mm-hl"><span>10 vs 1</span><span class="mm-out">trwa</span></div>
        <div class="mm-place">Preview (1, 1)</div></div>
      <div class="mm-tabs"><span class="mm-tab">Obrażenia</span><span class="mm-tab">Leczenie</span><span class="mm-tab on">Stan</span></div>
      <div class="mm-crumb"><span class="mm-back">‹ skład</span><span class="mm-here">Gracz 4</span></div>
      <div class="mm-list">
        <div class="mm-sec"><span>STOI TERAZ</span><span>2</span></div>
        ${plain(l2standing)}
        <div class="mm-sec"><span>STAŁO WCZEŚNIEJ</span><span>3</span></div>
        ${plain(l2closed)}
      </div>
      <div class="mm-note">Tury policzone w turach tej postaci.<br>Ile zostało — walka tego nie podaje.</div>
    </div>
  </div>
</div>

<div class="notes">
  <div class="note"><h3 class="good">Dlaczego tutaj</h3><p>Lista panelu to jedyny region, który przewija, i ma arytmetyczną wysokość. Dwadzieścia postaci mieści się bez nowego okna i bez ruszania <span class="m">tests/e2e/panel-scroll.spec.ts</span>, który czerwieni się, gdy przewija cokolwiek poza <span class="m">.list</span>.</p></div>
  <div class="note"><h3 class="good">Drążenie już istnieje</h3><p>Poziom 2 to ten sam mechanizm, co reszta panelu: <span class="m">data-row</span> na wierszu i każdej jego komórce, przejście <span class="m">ranking → opened</span>. Nowego poziomu nie ma.</p></div>
  <div class="note"><h3 class="warn">⚠ przed nazwą</h3><p>Bit stał już wtedy, gdy panel pierwszy raz zobaczył tę postać (<span class="m">wasStandingAtFirstSight</span>). Dziewięć tur jest wtedy dolną granicą, nie pomiarem — i znak stoi przy wierszu, którego dotyczy.</p></div>
  <div class="note"><h3>Co to kosztuje</h3><p>Trzecia zakładka na górnym pasku. „Stan" nie ma kierunku, więc dolny pasek niesie tylko strony — <span class="m">Zadane / Otrzymane</span> znika, a nie robi się pusty.</p></div>
</div>
</div>`,
  ),
);

/* ================= Opcja A: okno obok panelu ================= */

const auraGroup = (skill, rows) =>
  `<div class="aw-skill">${skill}</div>` +
  rows.map(([n, t, side]) =>
    `<div class="aw-row"><span class="aw-name ${side}">${n}</span>` +
    `<span class="aw-turns">${t}</span></div>`
  ).join("");

writeFileSync(
  "OpcjaA.dc.html",
  page(
    "Okno Stan obok panelu",
    `<div class="sheet">
<div class="tag"><span class="dot"></span>Gdzie · Opcja A</div>
<h1>Okno „Stan" obok panelu</h1>
<p class="lede">Okno aur już istnieje, już się przeciąga i już ma zapamiętane miejsce. Rośnie o drugą sekcję i o trzydzieści pikseli. Grupa to jeden status, wiersz to jedna postać — więc <em>ilu ich jest</em> stoi w nagłówku, a nie trzeba liczyć wierszy.</p>

<div class="stage">
  <div class="hold">
    <div class="cap">Dziś — 170 px</div>
    <div class="aw-bar" style="width:170px">⠿ Aury</div>
    <div class="aw-body" style="width:170px">
      ${auraGroup("Szadź ×3", [["Gracz 2", "3 z 8 tur", "ours"], ["Gracz 7", "5 z 8 tur", "ours"], ["Amaimon Sopl…", "1 z 8 tur", "theirs"]])}
      ${auraGroup("Piętno bestii ×2", [["Gracz 4", "2 z 8 tur", "ours"], ["Gracz 9", "6 z 8 tur", "ours"]])}
    </div>
  </div>

  <div class="hold">
    <div class="cap">Propozycja — 200 px</div>
    <div class="aw-bar" style="width:200px">⠿ Stan</div>
    <div class="aw-body" style="width:200px">
      <div class="aw-sec"><span>NA STRONIE</span><span>2</span></div>
      ${auraGroup("Szadź ×3", [["Gracz 2", "3 z 8 tur", "ours"], ["Gracz 7", "5 z 8 tur", "ours"], ["Amaimon Soplorękie", "1 z 8 tur", "theirs"]])}
      ${auraGroup("Piętno bestii ×2", [["Gracz 4", "2 z 8 tur", "ours"], ["Gracz 9", "6 z 8 tur", "ours"]])}
      <div class="aw-sec"><span>NA POSTACIACH</span><span>4</span></div>
      ${auraGroup("Spowolnienie ×3", [["Gracz 4", "12 tur", "ours"], ["Gracz 7", "⚠ 9 tur", "ours"], ["Amaimon Soplorękie", "4 tury", "theirs"]])}
      ${auraGroup("Zatrucie ×2", [["Gracz 4", "12 tur", "ours"], ["Gracz 9", "5 tur", "ours"]])}
      ${auraGroup("Rana ×1", [["Gracz 1", "1 tura", "ours"]])}
      ${auraGroup("Bit 10 ×1", [["Amaimon Soplorękie", "4 tury", "theirs"]])}
    </div>
  </div>
</div>

<div class="notes">
  <div class="note"><h3 class="good">Odpowiada na „ilu"</h3><p>Liczba przy nazwie statusu jest tą odpowiedzią wprost. W układzie z wierszem na postać trzeba ją policzyć wzrokiem po znakach w siedmiu wierszach.</p></div>
  <div class="note"><h3 class="warn">Okno rośnie i przewija</h3><p>Przy 10 vs 10 i czterech statusach to ponad czterdzieści wierszy. Ciało okna ma dziś <span class="m">overflow-y:auto</span> i przechodzi tylko dlatego, że mieści się w swojej wysokości — pełny skład je przekracza i <span class="m">panel-scroll.spec.ts</span> robi się czerwony.</p></div>
  <div class="note"><h3 class="warn">Nie mówi, co ma jedna postać</h3><p>Żeby zobaczyć wszystko, co stoi na Graczu 4, trzeba przeczytać wszystkie grupy i wyłuskać go z każdej. To jest dokładnie to pytanie, które zadaje się w turze.</p></div>
  <div class="note"><h3>Wariant do rozważenia</h3><p>Zostawić aury osobno, jak są, a statusy dać do panelu — obie rzeczy zachowują wtedy swój kształt, a okno nie zaczyna być drugim panelem.</p></div>
</div>
</div>`,
  ),
);

/* ================= Opcja C: tablica obu stron ================= */

const boardRow = (n, hue, marks) =>
  `<div class="mm-row" style="padding:1px 6px 0">` +
  `<div class="mm-cap" style="background:${hue}"></div>` +
  `<span class="mm-name" style="padding-left:5px">${n}</span>` +
  `<span class="mm-marks">${marks.map(mark).join("")}</span>` +
  `</div>`;

writeFileSync(
  "OpcjaC.dc.html",
  page(
    "Tablica obu stron",
    `<div class="sheet">
<div class="tag"><span class="dot"></span>Gdzie · Opcja C</div>
<h1>Tablica obu stron</h1>
<p class="lede">Trzecie okno, szersze od panelu: dwie kolumny, wiersz na postać, cały skład naraz. Najwięcej widać jednym spojrzeniem — i najwięcej to kosztuje.</p>

<div class="stage">
  <div class="hold">
    <div class="cap">Nowe okno — 300 px</div>
    <div class="mm-bar" style="width:300px">⠿ Stan</div>
    <div class="mm-body" style="width:300px">
      <div class="mm-list" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 7px">
        <div>
          <div class="mm-sec"><span class="ours">MY</span><span>5</span></div>
          ${boardRow("Gracz 4", PROF.p, ["zatrucie", "spowolnienie"])}
          ${boardRow("Gracz 7", PROF.b, ["spowolnienie"])}
          ${boardRow("Gracz 2", PROF.h, ["przyspieszenie"])}
          ${boardRow("Gracz 9", PROF.t, ["rana", "zatrucie"])}
          ${boardRow("Gracz 1", PROF.m, ["rana"])}
          ${boardRow("Gracz 3", PROF.w, [])}
          ${boardRow("Gracz 5", PROF.w, ["ogien"])}
        </div>
        <div>
          <div class="mm-sec"><span class="theirs">ONI</span><span>2</span></div>
          ${boardRow("Amaimon Sopl…", PROF.npc, ["spowolnienie", "bit"])}
          ${boardRow("Draugr", PROF.npc, ["przyspieszenie"])}
          ${boardRow("Draugr", PROF.npc, [])}
          ${boardRow("Draugr", PROF.npc, [])}
        </div>
      </div>
      <div class="mm-note">Ile stoi — po naciśnięciu wiersza.</div>
    </div>
  </div>
</div>

<div class="notes">
  <div class="note"><h3 class="good">Jedno spojrzenie</h3><p>Obie strony naraz, w kolejności składu, bez rankingu i bez zakładek. To jedyny z czterech układów, w którym „kto z nich nie ma nic" jest widoczne od razu — puste wiersze są odpowiedzią.</p></div>
  <div class="note"><h3 class="warn">Nie mieści tur</h3><p>Przy dwóch kolumnach na 300 px komórka na nazwę ma niecałe 130 px. Liczba tur musiałaby zabrać nazwie ostatnie znaki, więc trafia dopiero na poziom niżej — a to jest połowa tego, po co ten ekran powstaje.</p></div>
  <div class="note"><h3 class="warn">Trzecie okno nad grą</h3><p>Panel i okno aur już zajmują prawy górny róg. Trzecia rzecz szersza od panelu zaczyna zasłaniać planszę, a <span class="m">PRODUCT.md</span> stawia „nie przeszkadzać grze" przed każdym innym kompromisem.</p></div>
  <div class="note"><h3>Nowy ADR</h3><p>ADR 0053 uzasadnia jedno okno obok panelu i wymienia odrzucone alternatywy. Drugie okno to nowa decyzja i nowy wpis, nie rozszerzenie tamtego.</p></div>
</div>
</div>`,
  ),
);
console.log("gen1 ok");
