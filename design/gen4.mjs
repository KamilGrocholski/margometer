import { writeFileSync } from "node:fs";
import { page } from "./shared.mjs";

/** One combatant, then a line per status standing on them. The aura window's own two shapes. */
const person = (name, rows) =>
  `<div class="aw-skill">${name}</div>` +
  rows.map(([what, turns, warn]) =>
    `<div class="aw-row"><span class="aw-name" style="padding-left:8px;color:#9a9aa6">${what}</span>` +
    `<span class="aw-turns">${warn ? '<span style="color:#c98500">⚠ </span>' : ""}${turns}</span></div>`
  ).join("");

const aura = (skill, rows) =>
  `<div class="aw-skill">${skill}</div>` +
  rows.map(([who, turns]) =>
    `<div class="aw-row"><span class="aw-name" style="padding-left:8px">${who}</span>` +
    `<span class="aw-turns">${turns}</span></div>`
  ).join("");

const MY = [
  ["Gracz 7", [["zatrucie", "1 tura", false]]],
  ["Gracz 2", [["spowolnienie", "3 tury", false]]],
  ["Gracz 9", [["rana", "5 tur", false], ["zatrucie", "3 tury", false]]],
  ["Gracz 4", [["zatrucie", "12 tur", false], ["spowolnienie", "4 tury", false]]],
  ["Gracz 1", [["rana", "17 tur", true]]],
];
const ONI = [
  ["Amaimon Soplorękie", [
    ["spowolnienie", "4 tury", false],
    ["przyspieszenie", "2 tury", false],
    ["bit 10", "4 tury", false],
  ]],
  ["Draugr", [["przyspieszenie", "1 tura", false]]],
];

/* ================= J · dwa okna, My i Oni ================= */

const win = (title, side, body, w) =>
  `<div class="hold">
    <div class="aw-bar" style="width:${w}px">⠿ Stan · <span class="${side}">${title}</span></div>
    <div class="aw-body" style="width:${w}px">${body}</div>
  </div>`;

writeFileSync(
  "DwaOkna.dc.html",
  page(
    "Dwa okna, My i Oni",
    `<div class="sheet">
<div class="tag"><span class="dot"></span>Szybki wgląd · J<span class="rec">— odpowiedź na „bez klikania"</span></div>
<h1>Dwa okna, My i Oni</h1>
<p class="lede">Nic się nie otwiera i nic nie trzeba rozszyfrowywać: nazwa postaci, a pod nią słowem, co na niej stoi i od ilu tur. To ten sam kształt, co dzisiejsze okno aur — nagłówek grupy i wiersze pod nim — tylko grupą jest postać, a nie umiejętność. Aury wchodzą do tych samych okien, bo aura też należy do strony.</p>

<div class="stage">
  ${win("My", "ours", `<div class="aw-sec"><span>AURY</span><span>2</span></div>` +
      aura("Szadź", [["Gracz 2", "3 z 8 tur"], ["Gracz 7", "5 z 8 tur"]]) +
      aura("Piętno bestii", [["Gracz 4", "2 z 8 tur"]]) +
      `<div class="aw-sec"><span>NA POSTACIACH</span><span>5</span></div>` +
      MY.map(([n, r]) => person(n, r)).join(""), 200)}

  ${win("Oni", "theirs", `<div class="aw-sec"><span>AURY</span><span>1</span></div>` +
      aura("Jadowity podmuch", [["Amaimon Soplorękie", "6 z 8 tur"]]) +
      `<div class="aw-sec"><span>NA POSTACIACH</span><span>2</span></div>` +
      ONI.map(([n, r]) => person(n, r)).join(""), 200)}

  <div style="flex:1;min-width:210px;color:#9a9aa6;font:11px/1.6 system-ui,sans-serif">
    <div class="cap">Gdzie stoją</div>
    <div style="color:#e7e7ea;font-size:12px;line-height:1.6">
      Po lewej od panelu, jedno pod drugim albo obok siebie — każde ciągnie się osobno i pamięta swoje miejsce, tak jak dziś okno aur.<br><br>
      Okno gaśnie, kiedy na jego stronie nic nie stoi. Puste okno nad grą nie mówi nic, a zabiera miejsce.
    </div>
  </div>
</div>

<div class="notes">
  <div class="note"><h3 class="good">Zero gestów</h3><p>Wszystko, co jest do przeczytania, jest napisane. Żadnego wiersza się nie naciska, żadnej ikony nie trzeba pamiętać, i nic nie chowa się pod najechaniem kursorem.</p></div>
  <div class="note"><h3 class="good">Najświeższe na górze</h3><p>Postacie idą od najkrócej stojącego stanu do najdłużej. „Gracz 7 · zatrucie · 1 tura" jest tym, na co jeszcze nie zareagowałeś; „Gracz 1 · rana · 17 tur" jest tym, co już wiesz. Panel nie ocenia, który stan jest groźny — ale która wiadomość jest nowa, to jest pomiar.</p></div>
  <div class="note"><h3 class="warn">Wysokość rośnie z walką</h3><p>Pięć postaci po dwa stany to piętnaście linii, około 260 px. Przy 10 vs 10 okno „My" sięga połowy ekranu. Sufit <span class="m">66vh</span> obowiązuje, więc od pewnego składu okno musi przewijać — i to jest ta jedna rzecz, którą trzeba rozstrzygnąć przed budową.</p></div>
  <div class="note"><h3>Dlaczego dwa, a nie jedno</h3><p>Strona jest pytaniem, które zadaje się najpierw: „czy to nasze, czy ich". Rozdzielone okna odpowiadają na nie ustawieniem, zanim cokolwiek zostanie przeczytane — i można zamknąć jedno, kiedy interesuje tylko drugie. Cena: dwie rzeczy do ustawienia zamiast jednej.</p></div>
</div>
</div>`,
  ),
);

/* ================= K · dwa okna, grupowane po stanie ================= */

const byStatus = (what, count, rows) =>
  `<div class="aw-skill">${what} ×${count}</div>` +
  rows.map(([who, turns, warn]) =>
    `<div class="aw-row"><span class="aw-name" style="padding-left:8px">${who}</span>` +
    `<span class="aw-turns">${warn ? '<span style="color:#c98500">⚠ </span>' : ""}${turns}</span></div>`
  ).join("");

writeFileSync(
  "DwaOknaStany.dc.html",
  page(
    "Dwa okna, grupowane po stanie",
    `<div class="sheet">
<div class="tag"><span class="dot"></span>Szybki wgląd · K</div>
<h1>Te same dwa okna, odwrócone</h1>
<p class="lede">Ta sama zawartość i ta sama zasada „nic się nie klika", tylko grupą jest stan, a nie postać. Odpowiada na inne pytanie: nie „co ma Gracz 4", tylko „ilu naszych jest zatrutych i od kiedy".</p>

<div class="stage">
  ${win("My", "ours", `<div class="aw-sec"><span>NA POSTACIACH</span><span>5</span></div>` +
      byStatus("zatrucie", 3, [["Gracz 7", "1 tura", false], ["Gracz 9", "3 tury", false], ["Gracz 4", "12 tur", false]]) +
      byStatus("spowolnienie", 2, [["Gracz 2", "3 tury", false], ["Gracz 4", "4 tury", false]]) +
      byStatus("rana", 2, [["Gracz 9", "5 tur", false], ["Gracz 1", "17 tur", true]]), 200)}

  ${win("Oni", "theirs", `<div class="aw-sec"><span>NA POSTACIACH</span><span>2</span></div>` +
      byStatus("przyspieszenie", 2, [["Draugr", "1 tura", false], ["Amaimon Soplorękie", "2 tury", false]]) +
      byStatus("spowolnienie", 1, [["Amaimon Soplorękie", "4 tury", false]]) +
      byStatus("bit 10", 1, [["Amaimon Soplorękie", "4 tury", false]]), 200)}

  <div style="flex:1;min-width:210px">
    <div class="cap">Różnica w jednym zdaniu</div>
    <div style="color:#e7e7ea;font:12px/1.6 system-ui,sans-serif">
      <span class="ours">J</span> — czytasz postać, widzisz jej stan.<br>
      <span class="theirs">K</span> — czytasz stan, widzisz kogo dotyczy.<br><br>
      <span style="color:#9a9aa6">Obie wersje pokazują dokładnie te same dane i obie mieszczą się w tym samym oknie. To wybór pytania, nie układu.</span>
    </div>
  </div>
</div>

<div class="notes">
  <div class="note"><h3 class="good">Liczba stoi w nagłówku</h3><p>„zatrucie ×3" jest odpowiedzią na „ilu ich jest" bez liczenia wierszy. W układzie J trzeba przejechać wzrokiem po wszystkich postaciach i policzyć samemu.</p></div>
  <div class="note"><h3 class="warn">Postać rozsypana po oknie</h3><p>Gracz 4 stoi tu w dwóch miejscach i nigdzie nie widać go w całości. Jeśli pytanie brzmi „co się dzieje z Graczem 4", to jest gorszy układ — i to jest pytanie, które zadaje się o siebie.</p></div>
  <div class="note"><h3>Krócej przy dużym składzie</h3><p>Przy 10 vs 10 nagłówków jest tyle, ile rodzajów stanów — najwyżej dziewięć. W układzie J nagłówków jest tyle, ile postaci ze stanem, czyli nawet dwadzieścia.</p></div>
  <div class="note"><h3>Da się mieć obie</h3><p>To jedno przełączenie w pasku okna, nie dwie implementacje: dane są te same, zmienia się tylko klucz grupowania. Jeśli obie mają sens, przełącznik jest tańszy niż wybór.</p></div>
</div>
</div>`,
  ),
);

/* ================= L · jedno okno, obie strony ================= */

writeFileSync(
  "JednoOknoObie.dc.html",
  page(
    "Jedno okno, obie strony",
    `<div class="sheet">
<div class="tag"><span class="dot"></span>Szybki wgląd · L</div>
<h1>Jedno okno zamiast dwóch</h1>
<p class="lede">Ta sama treść co w J, ale w jednym oknie szerokości panelu, z dwiema sekcjami. Jedna rzecz do ustawienia i jedna do zamknięcia — za cenę wysokości, która sumuje obie strony.</p>

<div class="stage">
  <div class="hold">
    <div class="cap">260 px, jak panel</div>
    <div class="aw-bar" style="width:260px">⠿ Stan</div>
    <div class="aw-body" style="width:260px">
      <div class="aw-sec"><span class="ours">MY</span><span>5 postaci · 2 aury</span></div>
      ${aura("Szadź", [["Gracz 2", "3 z 8 tur"], ["Gracz 7", "5 z 8 tur"]])}
      ${aura("Piętno bestii", [["Gracz 4", "2 z 8 tur"]])}
      ${MY.map(([n, r]) => person(n, r)).join("")}
      <div class="aw-sec"><span class="theirs">ONI</span><span>2 postaci · 1 aura</span></div>
      ${aura("Jadowity podmuch", [["Amaimon Soplorękie", "6 z 8 tur"]])}
      ${ONI.map(([n, r]) => person(n, r)).join("")}
    </div>
  </div>

  <div style="flex:1;min-width:230px">
    <div class="cap">Rachunek</div>
    <div style="color:#e7e7ea;font:12px/1.65 system-ui,sans-serif">
      <strong>Za:</strong> jedno okno do ustawienia, jedna pozycja w pamięci, jeden border nad grą. Szersze o 60 px, więc długie nazwy się nie skracają.<br><br>
      <strong>Przeciw:</strong> wysokość jest sumą obu stron. Przy 10 vs 10 to ponad czterdzieści linii — jedno okno musi wtedy przewijać, dwa mogą stać obok siebie i nie muszą.<br><br>
      <span style="color:#9a9aa6">I nie da się zamknąć samego „Oni", kiedy interesują tylko swoi.</span>
    </div>
  </div>
</div>

<div class="notes">
  <div class="note"><h3 class="good">Panel i okno tej samej szerokości</h3><p>Dwie rzeczy tej samej szerokości, stojące jedna nad drugą albo obok siebie, czytają się jak jedno narzędzie. Dwa wąskie okna po 200 px zawsze będą wyglądały jak coś doklejonego.</p></div>
  <div class="note"><h3 class="warn">Nagłówek strony musi być przyklejony</h3><p>Przy przewijaniu „MY" i „ONI" muszą zostać na górze swojej sekcji — inaczej wiersz przeczytany pod złym nagłówkiem przypisze stan nie tej stronie. Panel ma już tę regułę dla swoich nagłówków cięć.</p></div>
  <div class="note"><h3>Kiedy to wygrywa</h3><p>Przy 1 vs 1 i małych składach — wtedy suma obu stron to sześć linii i dwa okna są przesadą.</p></div>
  <div class="note"><h3>Kiedy przegrywa</h3><p>Przy 10 vs 10, czyli dokładnie wtedy, kiedy szybki wgląd jest do czegoś potrzebny.</p></div>
</div>
</div>`,
  ),
);

/* ================= M · co się właśnie zmieniło ================= */

const change = (who, what, side) =>
  `<div class="aw-row"><span class="aw-name ${side}" style="flex:none;width:96px">${who}</span>` +
  `<span class="aw-name" style="color:#9a9aa6">${what}</span></div>`;

writeFileSync(
  "Zmiana.dc.html",
  page(
    "Co się właśnie zmieniło",
    `<div class="sheet">
<div class="tag"><span class="dot"></span>Szybki wgląd · M</div>
<h1>Co się właśnie zmieniło</h1>
<p class="lede">Stan, który stoi dwanaście tur, nie jest wiadomością — jest tłem. Wiadomością jest ten, który właśnie stanął albo właśnie zszedł. Sesja i tak porównuje maskę z poprzednią przy każdej paczce, żeby otwierać i zamykać epizody; ta plansza rysuje tę różnicę zamiast ją wyrzucać.</p>

<div class="stage">
  <div class="hold">
    <div class="cap">Pasek nad resztą okna</div>
    <div class="aw-bar" style="width:200px">⠿ Stan · <span class="ours">My</span></div>
    <div class="aw-body" style="width:200px">
      <div class="aw-sec"><span>WŁAŚNIE STANĘŁO</span><span>2</span></div>
      ${change("Gracz 7", "zatrucie", "ours")}
      ${change("Gracz 2", "spowolnienie", "ours")}
      <div class="aw-sec"><span>WŁAŚNIE ZESZŁO</span><span>1</span></div>
      ${change("Gracz 5", "podpalenie", "ours")}
      <div class="aw-sec"><span>NA POSTACIACH</span><span>5</span></div>
      ${MY.map(([n, r]) => person(n, r)).join("")}
    </div>
  </div>

  <div style="flex:1;min-width:250px">
    <div class="cap">Co tu jest odczytem</div>
    <div style="color:#e7e7ea;font:12px/1.65 system-ui,sans-serif">
      <strong>„Stanęło"</strong> — bit, którego w poprzedniej masce nie było, a w tej jest.<br><br>
      <strong>„Zeszło"</strong> — bit, który był, a nie ma go. To jedyne miejsce w całym panelu, gdzie da się powiedzieć, że coś się skończyło: gra gasi bit i to widać. Aura tego nie ma — jej koniec nikt nigdy nie ogłasza.<br><br>
      <span style="color:#9a9aa6">Obie sekcje znikają, kiedy nic się nie zmieniło. Nic nie miga, nic się nie przesuwa — pojawiają się i gasną, tak jak całe okno.</span>
    </div>
  </div>
</div>

<div class="notes">
  <div class="note"><h3 class="good">Odpowiada na „mam szybko zareagować"</h3><p>Dwie linie na górze okna są tym, czego jeszcze nie widziałeś. Reszta okna zostaje tam, gdzie była, i nie trzeba jej czytać od nowa co paczkę.</p></div>
  <div class="note"><h3 class="good">To już jest policzone</h3><p><span class="m">addStatusMaskToSession</span> porównuje starą maskę z nową przy każdej paczce, żeby otworzyć albo zamknąć epizod. Ta różnica istnieje — dziś tylko nikt jej nie pokazuje.</p></div>
  <div class="note"><h3 class="warn">Jak długo to stoi</h3><p>Do następnej paczki czy do następnej tury nosiciela? Paczka przychodzi częściej, więc „stanęło" gasłoby, zanim zdążysz przeczytać. Tura nosiciela jest jednostką, w której panel liczy wszystko inne — i to jest odpowiedź do rozstrzygnięcia przed budową.</p></div>
  <div class="note"><h3 class="warn">Panel nie ocenia, co ważne</h3><p>Nigdzie tu nie ma „groźne" ani „pilne". Kolejność jest pomiarem — co nowe stoi wyżej — a nie sądem o tym, na co warto zareagować. To zostaje przy Tobie, i tak ma zostać.</p></div>
</div>
</div>`,
  ),
);
console.log("gen4 ok");
