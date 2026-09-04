import { writeFileSync } from "node:fs";
import { page, glyph, PROF } from "./shared.mjs";

/* ================= Legendarne ================= */

const lrow = (n, hue, v, share) =>
  `<div class="mm-row"><div class="mm-fill" style="width:${share}%;background:${hue}"></div>` +
  `<div class="mm-cap" style="background:${hue}"></div>` +
  `<span class="mm-name">${n}</span><span class="mm-val">${v}</span></div>`;

writeFileSync(
  "Legendarne.dc.html",
  page(
    "Legendarne bonusy",
    `<div class="sheet">
<div class="tag"><span class="dot"></span>Jak · legendarne bonusy</div>
<h1>Kto wydał Ostatni Ratunek</h1>
<p class="lede">Tego nie trzeba dekodować — jest policzone. Ostatni ratunek i dotyk anioła to klucze leczenia i siedzą już w figurach każdej postaci. Odpalają się, panel to widzi i może to wypisać. Czego nie widzi: kto ten bonus w ogóle nosi.</p>

<div class="stage">
  <div class="hold">
    <div class="cap">Sekcja na ekranie leczenia albo na „Stanie"</div>
    <div class="mm-bar">⠿ MargoMeter <span class="mm-ver">0.12.1</span><span class="mm-ctl">☰ ⭳ —</span></div>
    <div class="mm-body">
      <div class="mm-head"><div class="mm-hl"><span>10 vs 1</span><span class="mm-out">trwa</span></div></div>
      <div class="mm-list">
        <div class="mm-sec"><span>OSTATNI RATUNEK</span><span>ODPALIŁ U 3</span></div>
        ${lrow("Gracz 4", PROF.p, "7 987", 100)}
        ${lrow("Gracz 2", PROF.h, "2 416", 30)}
        ${lrow("Amaimon Soplorękie", PROF.npc, "1 131", 14)}
        <div class="mm-sec"><span>DOTYK ANIOŁA</span><span>ODPALIŁ U 2</span></div>
        ${lrow("Gracz 7", PROF.b, "976", 100)}
        ${lrow("Gracz 5", PROF.w, "340", 35)}
      </div>
      <div class="mm-note">U kogo bonus zadziałał — tyle walka mówi.<br>Kto go jeszcze ma — tego nie podaje.</div>
    </div>
  </div>
</div>

<div class="notes">
  <div class="note"><h3 class="good">Dane już są</h3><p>Każda postać ma <span class="m">healthRestoredBySource</span>, a w nim <span class="m">legbon_lastheal</span> i <span class="m">legbon_holytouch_heal</span>. Ta plansza jest przepisaniem istniejącej mapy na sekcję, nie nowym odczytem.</p></div>
  <div class="note"><h3 class="good">Raz na walkę, poniżej 18%</h3><p>Tak opisuje ten bonus pomoc gry, i tak zamyka się to na materiale: każde wystąpienie w <span class="m">captures/</span> jest pod progiem, dwa najbliższe na 0,1675 i 0,1714 puli. Dlatego „odpalił" znaczy „nie odpali drugi raz w tej walce".</p></div>
  <div class="note"><h3 class="warn">„Dostępne" jest nie do odczytania</h3><p>Nic w protokole nie mówi, kto ten legendarny bonus nosi. Pusta lista znaczy „nikomu jeszcze nie odpalił", a nie „nikt go nie ma" — i sekcja musi być tak nazwana, żeby te dwie rzeczy się nie zlały.</p></div>
  <div class="note"><h3 class="warn">Dotyk anioła nie stoi na postaci</h3><p>To jest proca lecząca, nie stan. Da się powiedzieć, u kogo odpaliła i na ile — nie da się powiedzieć, że ktoś ją „ma na sobie". Dlatego stoi tu, obok Ostatniego Ratunku, a nie wśród statusów.</p></div>
</div>
</div>`,
  ),
);

/* ================= Kolosy ================= */

const hatch = "repeating-linear-gradient(-45deg,#e9e3d4 0 8px,#f5f3ee 8px 16px)";

writeFileSync(
  "Kolosy.dc.html",
  page(
    "Kolosy — spekulacja",
    `<div class="sheet" style="background:${hatch}">
<div class="tag"><span class="dot"></span>Spekulacja<span class="no">— nie ma na to materiału</span></div>
<h1>Ładowany cios kolosa</h1>
<p class="lede">Ta plansza nie jest odczytem. Nic w tym repozytorium nie czyta ładowanego ciosu — ani jednego nagrania z kolosem, ani jednego klucza, który by o tym mówił. Rysunek jest tu po to, żeby nazwać, czego by brakowało.</p>

<div class="stage" style="border-color:#c9a86a">
  <div class="hold">
    <div class="cap" style="color:#c98500">Gdyby protokół to niósł</div>
    <div class="mm-bar" style="width:200px">⠿ Stan</div>
    <div class="mm-body" style="width:200px">
      <div class="mm-list">
        <div class="mm-sec"><span>ŁADUJE</span><span>1</span></div>
        <div class="mm-row">
          <div class="mm-fill" style="width:66%;background:#e0736f"></div>
          <div class="mm-cap" style="background:#e0736f"></div>
          <span class="mm-name">Zamaszysty cios</span><span class="mm-val">2 z 3</span>
        </div>
        <div class="mm-row" style="background:transparent">
          <span class="mm-name" style="color:#9a9aa6;padding-left:0">Amaimon Soplorękie</span>
        </div>
      </div>
    </div>
  </div>

  <div style="flex:1;min-width:280px;color:#e7e7ea;font:13px/1.55 'IBM Plex Sans',system-ui,sans-serif">
    <div class="cap" style="color:#c98500">Czego brakuje</div>
    <table class="reg" style="color:#e7e7ea">
      <tr><td style="border-color:#2c2c35;width:46%">Klucz mówiący, że cios jest ładowany</td>
        <td style="border-color:#2c2c35;color:#9a9aa6">Jest tylko <span class="m" style="background:#24242a;color:#e7e7ea">prepare</span> — deklaracja bez figury, która otwiera turę i nic poza tym nie mówi</td></tr>
      <tr><td style="border-color:#2c2c35">Ile tur trwa ładowanie</td>
        <td style="border-color:#2c2c35;color:#9a9aa6">Opublikowana tabela umiejętności nie podaje tego dla <span class="m" style="background:#24242a;color:#e7e7ea">prepare</span></td></tr>
      <tr><td style="border-color:#2c2c35">W kogo pójdzie</td>
        <td style="border-color:#2c2c35;color:#9a9aa6">Protokół nie zapowiada celu — cel jest znany dopiero z ciosu</td></tr>
      <tr><td style="border-color:#2c2c35">Nagranie z kolosem</td>
        <td style="border-color:#2c2c35;color:#9a9aa6">Ani jedno w <span class="m" style="background:#24242a;color:#e7e7ea">captures/</span></td></tr>
    </table>
  </div>
</div>

<div class="notes" style="border-color:#c9a86a">
  <div class="note"><h3 class="warn">Dlaczego to nie jest wiersz jak inne</h3><p>Wszystkie pozostałe plansze rysują coś, co da się dziś policzyć na nagraniach. Ta rysuje kształt pod dane, których nie ma — i gdyby ją zbudować, byłaby pierwszą rzeczą w panelu, która wygląda jak odczyt, a nie jest nim.</p></div>
  <div class="note"><h3>Co zamiast tego</h3><p>Najpierw materiał: nagranie walki z kolosem, potem sprawdzenie, czym naprawdę jest <span class="m">prepare</span> na tym materiale, potem wpis w rejestrze kluczy. Dopiero wtedy ten rysunek ma o czym mówić.</p></div>
  <div class="note"><h3>To już jest na liście</h3><p><span class="m">TODO.md</span> ma osobny pomysł na pomocnika Kolos/Titan — kto w ogóle nie rzuca umiejętności i kto rzuca je źle. To inna rzecz niż ładowany cios przeciwnika i nie zastępuje jej.</p></div>
  <div class="note"><h3>Gdyby jednak</h3><p>Kształt po lewej jest jedynym uczciwym: <span class="m">2 z 3</span>, przebyte z podanych, tak jak aura. Nigdy odliczanie — z tego samego powodu, dla którego aura go nie ma.</p></div>
</div>
</div>`,
  ),
);

/* ================= Granice ================= */

const reg = [
  ["0", "deep_wound", "głęboka rana", "kolizja", "4", "10"],
  ["1", "wound", "rana", "", "39", "17"],
  ["2", "critical_deep_wound", "—", "brak", "0", "—"],
  ["3", "poisoned", "zatrucie", "", "48", "47"],
  ["4", "fire", "podpalenie", "", "5", "2"],
  ["5", "swow_down", "spowolnienie", "", "130", "52"],
  ["6", "speed_up", "przyspieszenie", "", "223", "22"],
  ["7", "frostbite", "—", "brak", "0", "—"],
  ["8", "shock", "wstrząs", "kolizja", "7", "20"],
  ["10", "—", "bit 10", "bez nazwy", "1", "7"],
];

const regRows = reg.map(([b, k, w, flag, e, l]) =>
  `<tr><td class="n mono">${b}</td>` +
  `<td class="mono${k === "—" ? " none" : ""}">${k}</td>` +
  `<td${w === "—" ? ' class="none"' : ""}>${w}${flag === "kolizja" ? ' <span class="flag">⚠</span>' : ""}</td>` +
  `<td class="${flag ? "flag" : "none"}">${flag === "kolizja" ? "zderza się" : flag === "brak" ? "brak materiału" : flag === "bez nazwy" ? "klient nie nazywa" : "—"}</td>` +
  `<td class="n">${e}</td><td class="n">${l}</td></tr>`
).join("");

const limits = [
  ["Ile statusowi zostało", "Protokół nie niesie reszty. Tylko ile już stoi, w turach nosiciela.", "ADR 0050"],
  ["Kto rzucił status", "Kiedy bit zapala się, żadna wiadomość celowana w nosiciela tego nie mówi. Najlepszy odczyt: 70 z 223.", "ADR 0049, 0052"],
  ["Czy aura zaraz zniknie", "Przebyte z podanych. Złączenie policzonej połowy z opublikowaną nie ma świadka.", "ADR 0053"],
  ["Kto ma Ostatni Ratunek", "Widać tylko, u kogo odpalił. Kto go nosi — nigdzie tego nie ma.", "protocol-keys"],
  ["Co znaczy bit 10", "Pętla klienta gry kończy się na bicie 8. Panel rysuje bit, nie zgadnięte słowo.", "V6"],
  ["Ile razy status nałożono", "Odnowiony, zanim minie, nigdy nie gasi bitu. Epizod to nie jedno rzucenie.", "CONTEXT.md"],
];

const limitRows = limits.map(([q, a, src]) =>
  `<tr><td style="width:26%;font-weight:500">${q}</td><td>${a}</td>` +
  `<td class="mono none" style="width:18%">${src}</td></tr>`
).join("");

writeFileSync(
  "Granice.dc.html",
  page(
    "Słownik i granice",
    `<div class="sheet">
<div class="tag"><span class="dot"></span>Słownik i granice</div>
<h1>Dziewięć bitów i sześć odmów</h1>
<p class="lede">Maska jest jedną liczbą na postać. Klient gry czyta z niej dziewięć bitów, nagrania zapalają osiem, a jeden z nich nie ma nazwy nigdzie. Poniżej: co panel ma po polsku powiedzieć i czego nie powie w ogóle.</p>

<div>
  <div class="cap">Rejestr — liczby z nagrań, słowa do rozstrzygnięcia</div>
  <table class="reg">
    <tr><th class="n">bit</th><th>klucz gry</th><th>proponowane słowo</th><th>uwaga</th>
      <th class="n">epizody</th><th class="n">najdłuższy</th></tr>
    ${regRows}
  </table>
</div>

<div>
  <div class="cap">Czego panel nie narysuje</div>
  <table class="reg">
    ${limitRows}
  </table>
</div>

<div class="notes">
  <div class="note"><h3 class="warn">Dwa słowa są już zajęte</h3><p>„Głęboka rana" jest dziś polskim słowem dla klucza utraty życia <span class="m">wound</span>, a „porażenie" dla <span class="m">light</span>. Statusowa maska ma osobno <span class="m">wound</span> i <span class="m">deep_wound</span>, i osobno <span class="m">shock</span>. Bez własnej tabeli dwa różne odczyty dostaną to samo słowo w dwóch miejscach panelu — i nikt tego nie zauważy, bo nic się nie zepsuje.</p></div>
  <div class="note"><h3 class="warn">Słowo dla bitu nie jest przepisane</h3><p>Klient gry ma dla ośmiu z nich swoje podpowiedzi. To cudza proza i nie wchodzi do tego repozytorium — kolumna „proponowane słowo" jest nasza i jest do rozstrzygnięcia, nie do zatwierdzenia.</p></div>
  <div class="note"><h3>Jak nazwać ekran</h3><p>„Status" i „aura" są słowami tego repozytorium, nie gracza, a „efekt", „buff" i „debuff" są wprost odradzone w <span class="m">CONTEXT.md</span>. Zostają trzy: <strong>Stan</strong>, <strong>Na postaciach</strong>, <strong>Co stoi</strong>.</p></div>
  <div class="note"><h3>Nowy region musi umieć się nie narysować</h3><p>Każdy region panelu ma wpis w <span class="m">REGION_WORDS</span>, żeby móc powiedzieć „nie udało się narysować…" na swoim własnym miejscu. Bez tego nowa sekcja przy awarii wygasza panel zamiast siebie.</p></div>
</div>
</div>`,
  ),
);

console.log("gen3 ok");
