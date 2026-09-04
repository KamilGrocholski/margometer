/** Row two: the disagreement about time, and what one row is made of. */
import { readFileSync, writeFileSync } from "node:fs";
import {
    auraRow,
    hold,
    note,
    page,
    section,
    sheet,
    tag,
    tint,
    TOKEN,
    window_,
} from "./pomocnik.mjs";

const measured = JSON.parse(readFileSync("measured.json", "utf8"));
const auras = new Map(measured.auras.map((row) => [row.skill, row]));
const OURS = TOKEN.ours;

/* ------------------------------------------------------------- C · Czas */

/** Their shape, drawn in our chrome so the comparison is about the figure and not the styling. */
function countdownRow(name, left) {
    return `<div class="pw-row"><div class="pw-cap" style="background:${OURS}"></div>` +
        `<span class="pw-name">${name}</span><span class="pw-val">${left}</span></div>`;
}

const theirs = [
    section("PODWÓJNY DECH"),
    countdownRow("Gracz 5", "4 | 1"),
    section("SZADŹ"),
    countdownRow("Gracz 2", "7"),
    section("PIĘTNO BESTII"),
    countdownRow("Gracz 3", "5"),
].join("");

const ours = [
    section("PODWÓJNY DECH", 2),
    auraRow("Gracz 5", OURS, 4, 8),
    auraRow("Gracz 9", OURS, 7, 8),
    section("SZADŹ", 1),
    auraRow("Gracz 2", OURS, 1, 8),
    section("PIĘTNO BESTII", 1),
    auraRow("Gracz 3", OURS, 3, 8),
].join("");

const evidence = `<table class="reg" style="color:#e7e7ea">
<tr><th style="border-color:#2c2c35;color:#868691">umiejętność</th>
  <th style="border-color:#2c2c35;color:#868691;text-align:right">podane</th>
  <th style="border-color:#2c2c35;color:#868691;text-align:right">bit stał najdłużej</th>
  <th style="border-color:#2c2c35;color:#868691">co z tego wynika</th></tr>
${
    [
        ["Podwójny dech", auras.get("Podwójny dech").stated, auras.get("Podwójny dech").seen, "speed_up"],
        ["Szadź", auras.get("Szadź").stated, auras.get("Szadź").seen, "swow_down"],
    ].map(([skill, stated, seen, bit]) =>
        `<tr><td style="border-color:#2c2c35">${skill}</td>
    <td class="n" style="border-color:#2c2c35">${stated} tur</td>
    <td class="n" style="border-color:#2c2c35;color:${TOKEN.suspect}">${seen} tur</td>
    <td style="border-color:#2c2c35;color:#9a9aa6">bit <span class="m" style="background:#24242a;color:#e7e7ea">${bit}</span> mówi, że ktoś jest pod <em>jakimś</em> takim efektem — nie pod tym rzutem</td></tr>`
    ).join("")
}
</table>`;

writeFileSync(
    "Czas.dc.html",
    page(sheet({
        tag: tag("Spór o czas", "<span class='no'>— najtrudniejsza decyzja w tym zestawie</span>"),
        title: "3 z 8 zamiast 5",
        lede:
            `Odliczanie jest szybsze do przeczytania i dlatego tamten dodatek je pisze. Nie piszemy go ` +
            `z jednego powodu: <b>protokół nigdy nie mówi, że efekt się skończył</b> — w całym ` +
            `<span class="m">captures/</span> nie ma potwierdzenia, odświeżenia ani wygaśnięcia ` +
            `(<span class="m">ADR 0053</span>). „5" byłoby wtedy naszym rachunkiem podanym jako ` +
            `stwierdzenie gry. Zamiast tego rysujemy dwie rzeczy, które są prawdziwe osobno: ile minęło, ` +
            `i ile tabela gry podaje.`,
        body: `<div class="stage">
  ${hold("TAK ROBI TAMTEN DODATEK", window_("Pomocnik", theirs), TOKEN.suspect)}
  ${hold("TAK ROBIMY MY", window_("Pomocnik", ours), OURS)}
  <div style="flex:1;min-width:330px">
    <div class="cap" style="color:${TOKEN.suspect}">Dlaczego nikt nie może sprawdzić odliczania</div>
    ${evidence}
    <p style="color:#9a9aa6;font:12.5px/1.5 'IBM Plex Sans',system-ui,sans-serif;margin:14px 0 0">
      Maska liczy <em>całą ekspozycję strony</em>: rzut kolejnego gracza nigdy nie gasi bitu, więc
      ośmiotursowy efekt czyta się jako pięćdziesięciodwutursowy. To nie jest sprzeczność — to dwie
      odpowiedzi na dwa różne pytania, i żadna z nich nie potwierdza drugiej.</p>
  </div>
</div>`,
        notes: [
            note(
                "Odejmowanie robi pasek",
                `Liczba <span class="m">3 z 8</span> nie zostaje sama: część niewypełniona wiersza ` +
                    `<em>jest</em> tym, co zostało. Oko czyta długość, nie różnicę — więc kosztu ` +
                    `w szybkości nie ma. Kreskowanie tej części dokłada jedną rzecz, której tamten ` +
                    `format nie ma: widać, że to zapowiedź, nie pomiar.`,
                "good",
            ),
            note(
                "Co ta decyzja kosztuje",
                `Wiersz jest o dwa znaki szerszy i czytelnik, który chce gołego „ile jeszcze", musi ` +
                    `spojrzeć na pasek zamiast na liczbę. To jest cały koszt i jest świadomy — ` +
                    `<span class="m">PRODUCT.md</span>, filar trzeci: figura, która może być zła, ` +
                    `nigdy nie wygląda jak figura, która jest dobra.`,
                "warn",
            ),
            note(
                "Skąd „8\"",
                `Z opublikowanej tabeli umiejętności gry, zamrożonej w ` +
                    `<span class="m">frozen/skill-durations.ts</span>, złączonej po ` +
                    `<span class="m">skillId</span> z ogłoszenia, które rzut zapowiedziało. Nie z ` +
                    `pamięci i nie z obserwacji.`,
            ),
            note(
                "Czego ten arkusz nie rozstrzyga",
                `Czy „5" tamtego dodatku bierze się z tej samej tabeli, czy z czegoś w protokole, ` +
                    `czego to repozytorium nie znalazło. Pierwsze jest prawdopodobne, drugie byłoby ` +
                    `znaleziskiem — i wtedy ten arkusz jest do wyrzucenia, a nie do obrony.`,
            ),
        ].join(""),
    })),
);

/* ------------------------------------------------------ D · Wiele rzutów */

const dech = auras.get("Podwójny dech");
const atOnce = Number(dech.atOnce);

const theirsMany = [
    section("PODWÓJNY DECH"),
    countdownRow("na sojusznikach", "7 | 4"),
].join("");

const oursMany = [
    section("PODWÓJNY DECH", atOnce),
    auraRow("Gracz 9", OURS, 7, 8),
    auraRow("Gracz 5", OURS, 4, 8),
    auraRow("Gracz 1", OURS, 4, 8),
    auraRow("Gracz 6", OURS, 1, 8),
].join("");

writeFileSync(
    "WieleRzutow.dc.html",
    page(sheet({
        tag: tag("Kilka rzutów tej samej rzeczy"),
        title: "Cztery naraz, a format mieści dwa",
        lede:
            `Gdy ta sama umiejętność stoi kilka razy, tamten dodatek pokazuje dwa najmocniejsze czasy ` +
            `jako <span class="m">x | y</span>. W korpusie <span class="m">Podwójny dech</span> stoi ` +
            `w <b>${atOnce}</b> instancjach naraz (${dech.casts} rzutów, ${dech.casters} rzucających, ` +
            `<span class="m">deno task fight:auras</span>) — więc ten format gubi dwie z czterech ` +
            `i nie mówi, że coś zgubił. U nas rzut jest wierszem, a rzucający jest jego nazwą.`,
        body: `<div class="stage">
  ${hold("DWA NAJMOCNIEJSZE", window_("Pomocnik", theirsMany), TOKEN.suspect)}
  ${hold(`WIERSZ NA RZUCAJĄCEGO — ${atOnce} NARAZ`, window_("Pomocnik", oursMany), OURS)}
  <div class="leg" style="width:270px">
    <div class="item"><div class="swatch" style="display:flex;gap:2px;padding:2px;background:none">
      <span style="flex:1;background:${tint(OURS)};border-radius:1px"></span>
      <span style="flex:1;background:${tint(OURS)};border-radius:1px"></span>
      <span style="flex:1;border:1px dashed #5a5a63;border-radius:1px"></span>
      <span style="flex:1;border:1px dashed #5a5a63;border-radius:1px"></span></div>
      <div class="txt"><b>Co gubi <span class="m">x | y</span>.</b> Nie tylko dwa czasy — także to,
      <em>na kim</em> stoją. W ustawce to jest całe pytanie.</div></div>
    <div class="item"><div class="swatch">
      <div class="pw-fill" style="width:87%;background:${tint(OURS)}"></div>
      <div class="pw-rest" style="left:87%;width:13%;background:repeating-linear-gradient(135deg,${OURS}38 0 2px,transparent 2px 5px)"></div>
      <div class="pw-cap" style="background:${OURS}"></div></div>
      <div class="txt"><b>Kolejność.</b> Najdalej posunięty na górze — ten skończy się pierwszy
      i o niego trzeba zadbać najpierw.</div></div>
    <div class="item"><div class="swatch"></div>
      <div class="txt"><b>Liczba przy nagłówku.</b> Ile ich jest, zanim oko zejdzie do wierszy.</div></div>
  </div>
</div>`,
        notes: [
            note(
                "Cztery wiersze to cztery wiersze",
                `Osiemnaście pikseli każdy. Przy siedmiu obserwowanych rzeczach i kilku rzutach na ` +
                    `każdą okno rośnie szybciej, niż mieści się na ekranie — dlatego arkusz H istnieje ` +
                    `i dlatego kompresja jest osobną decyzją, a nie efektem ubocznym.`,
                "warn",
            ),
            note(
                "Osiem rzutów, których nie da się zadatować",
                `Pieśni barda przychodzą pod <span class="m">tcustom</span> bez ` +
                    `<span class="m">skillId</span>, więc nic ich nie łączy z tabelą umiejętności. ` +
                    `Nie mają wiersza w ogóle — ani z liczbą, ani z „nieznane" ` +
                    `(<span class="m">docs/auras-standing.md</span>).`,
            ),
            note(
                "Rzut, nie odświeżenie",
                `Drugi rzut tego samego rzucającego odświeża jego wiersz, nie dokłada nowego. Rejestr ` +
                    `liczy tak samo, więc liczba przy nagłówku i liczba w rejestrze mówią to samo.`,
            ),
            note(
                `Skąd liczba ${atOnce}`,
                `<span class="m">deno task fight:auras</span>, kolumna <span class="m">at once</span>, ` +
                    `nad całym <span class="m">captures/</span>. Ten arkusz jej nie przepisuje — ` +
                    `<span class="m">measure.mjs</span> bierze ją z tego narzędzia przy każdym ` +
                    `generowaniu.`,
                "good",
            ),
        ].join(""),
    })),
);

/* ----------------------------------------------------------- E · Wiersz */

const blown = `<div class="hold">
  <div class="cap">3×</div>
  <div style="position:relative;height:152px;width:600px">
    <div style="transform:scale(3);transform-origin:0 0;width:200px">
      <div class="pw-body" style="border-radius:3px">
        ${section("PIĘTNO BESTII", 2)}
        ${auraRow("Gracz 3", OURS, 3, 8)}
      </div>
    </div>
  </div>
</div>`;

const anatomy = `<table class="reg">
<tr><th style="width:20%">Komórka</th><th style="width:26%">Skąd</th><th>Czego nie mówi</th></tr>
<tr><td>Nagłówek — nazwa umiejętności</td>
  <td class="mono">tspell + skillId</td>
  <td>Nie mówi, ile stoi <em>u przeciwnika</em>, dopóki wiersza pod nim nie ma.</td></tr>
<tr><td>Liczba przy nagłówku</td><td>ile wierszy jest pod spodem</td>
  <td>Nie jest sumą rzutów w walce — tylko tym, co stoi teraz.</td></tr>
<tr><td>Nazwa w wierszu</td><td>roster, po id rzucającego</td>
  <td>Gdy roster go nie zna, wiersz mówi <em>Nieznany rzucający</em> — nigdy nazwy naszej roboty.</td></tr>
<tr><td>Kolor paska i kreski</td><td class="mono">myteam</td>
  <td>Rysowany tylko tam, gdzie klient powiedział, która strona jest czytelnika.</td></tr>
<tr><td>Część pełna</td><td>tury rzucającego, policzone</td>
  <td>To nie są tury <em>obarczonego</em> — aura należy do rzucającego i jego turami się mierzy.</td></tr>
<tr><td>Część kreskowana</td><td class="mono">frozen/skill-durations.ts</td>
  <td>Nie mówi, że efekt jeszcze trwa. Mówi tylko, na ile go zapowiedziano.</td></tr>
<tr><td>Liczba po prawej</td><td>obie powyżej</td>
  <td>Nigdy „zostało". Odejmowanie jest czytelnika i pasek mu je pokazuje.</td></tr>
</table>`;

writeFileSync(
    "Wiersz.dc.html",
    page(sheet({
        tag: tag("Anatomia"),
        title: "Z czego jest zrobiony jeden wiersz",
        lede:
            `Ten sam wiersz w skali 1:1 i powiększony trzykrotnie. Siedem komórek, każda z własnym ` +
            `źródłem i własną granicą — i to te granice, a nie kształt, są powodem, dla którego ` +
            `Pomocnik wygląda inaczej niż dodatek robiący to samo.`,
        body: `<div class="stage" style="align-items:center">
  ${hold("1:1", window_("Pomocnik", section("PIĘTNO BESTII", 2) + auraRow("Gracz 3", OURS, 3, 8)))}
  ${blown}
</div>
<div style="margin-top:4px">${anatomy}</div>`,
        notes: [
            note(
                "Wysokość jest ta sama, zawsze",
                `Osiemnaście pikseli — wiersz aury, wiersz stanu, wiersz ładowania i wiersz Ostatniego ` +
                    `Ratunku. Wiersz wyższy od sąsiada czyta się jako inny rodzaj wiersza, a nie jest.`,
            ),
            note(
                "Figura się nie łamie",
                `<span class="m">3 z 8</span> to jedno słowo. Gdy zabraknie miejsca, skraca się nazwa ` +
                    `z wielokropkiem — nigdy liczba.`,
            ),
            note(
                "Nic tu nie miga",
                `Wiersz, który się właśnie pojawił, wygląda tak samo jak ten, który stoi od dziesięciu ` +
                    `tur. <em>The Quiet Panel Rule</em> — nad cudzą grą nic się nie rusza samo.`,
            ),
            note(
                "Kreskowanie zamiast drugiego koloru",
                `Kolor jest już zajęty przez stronę. Trzeci kanał musiałby konkurować z ` +
                    `<span class="m">ours</span> i <span class="m">theirs</span>, więc różnicę niesie ` +
                    `faktura — działa też, gdy kolorów nie ma, bo strona nieznana.`,
                "good",
            ),
        ].join(""),
    })),
);

console.log("row 2: Czas.dc.html WieleRzutow.dc.html Wiersz.dc.html");
