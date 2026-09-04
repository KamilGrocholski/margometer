/** Row five: how the reader steers it, what the queue may say, and what the window refuses. */
import { readFileSync, writeFileSync } from "node:fs";
import {
    auraRow,
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
const OURS = TOKEN.ours;
const THEIRS = TOKEN.theirs;
const SUSPECT = TOKEN.suspect;

/* -------------------------------------------------------- L · Obserwuję */

/** A watchlist row: a box of the row's own height, then the name, then what stands now. */
function watchRow(name, isOn, standing) {
    const box = isOn
        ? `<span style="flex:none;width:11px;height:11px;border-radius:2px;background:${OURS};
        margin-right:7px"></span>`
        : `<span style="flex:none;width:11px;height:11px;border-radius:2px;
        border:1px solid #3a3a44;margin-right:7px"></span>`;
    const right = standing === 0
        ? `<span class="pw-val" style="font-weight:400;color:#6b6b75">—</span>`
        : `<span class="pw-val">${standing}</span>`;
    const ink = isOn ? "" : ` style="color:#6b6b75"`;
    return `<div class="pw-row" style="background:transparent;padding-left:2px">${box}` +
        `<span class="pw-name"${ink}>${name}</span>${right}</div>`;
}

/** The current choice stands on `surfaceRaised`, so colour is not the only thing saying so. */
function choiceRow(name, choices, at) {
    const words = choices.map((word, index) =>
        index === at
            ? `<span style="color:${TOKEN.text};background:${TOKEN.surfaceRaised};
        border-radius:3px;padding:1px 4px">${word}</span>`
            : `<span style="color:#6b6b75;padding:1px 4px">${word}</span>`
    ).join("");
    return `<div class="pw-row" style="background:transparent;padding-left:2px">` +
        `<span class="pw-name">${name}</span>` +
        `<span class="pw-val" style="font-weight:400">${words}</span></div>`;
}

const watchlist = [
    section("OBSERWUJĘ", "9 z 14"),
    watchRow("Piętno bestii", true, 2),
    watchRow("Szadź", true, 3),
    watchRow("Jadowity podmuch", true, 0),
    watchRow("Podwójny dech", true, 4),
    watchRow("Aura ochrony", true, 1),
    watchRow("Wyzywający okrzyk", true, 1),
    watchRow("Osłona tarczą", true, 2),
    watchRow("Ostatni Ratunek", true, 3),
    watchRow("Ładowanie przeciwnika", true, 0),
    watchRow("Prowokujący okrzyk", false, 0),
    watchRow("Stany z maski", false, 0),
    watchRow("Pancerz i odporności", false, 0),
    watchRow("Kolejka tur", false, 0),
    watchRow("Dotyk anioła", false, 0),
    `<div class="pw-sec" style="border-top:1px solid ${TOKEN.border};margin-top:4px;padding-top:6px">
    <span>OKNO</span></div>`,
    choiceRow("Tło", ["przezroczyste", "pełne"], 1),
    choiceRow("Poza walką", ["schowaj", "zostaw"], 0),
].join("");

const live = [
    section("PIĘTNO BESTII", 2),
    auraRow("Gracz 3", OURS, 3, Number(auras.get("Piętno bestii").stated)),
    auraRow("Renegat 4", THEIRS, 6, Number(auras.get("Piętno bestii").stated)),
    section("SZADŹ", 3),
    auraRow("Renegat 2", THEIRS, 1, Number(auras.get("Szadź").stated)),
    auraRow("Renegat 5", THEIRS, 4, Number(auras.get("Szadź").stated)),
    auraRow("Renegat 9", THEIRS, 7, Number(auras.get("Szadź").stated)),
].join("");

writeFileSync(
    "Obserwuje.dc.html",
    page(sheet({
        tag: tag("Sterowanie"),
        title: "Lista jest kontrolką",
        lede:
            `Bez okna ustawień, bez modala i bez kradzieży ogniskowej — <em>The Quiet Panel Rule</em> ` +
            `nie robi wyjątku dla konfiguracji. Kontrolka na pasku zamienia ciało okna w listę ` +
            `obserwowanych i z powrotem, tak samo jak półka w panelu przykrywa jego ekrany. Lista mówi ` +
            `dwie rzeczy naraz: czego pilnujemy i ile z tego stoi w tej chwili.`,
        body: `<div class="stage">
  ${hold("CO STOI", window_("Pomocnik", live), OURS)}
  ${
            hold(
                "LISTA — TA SAMA RAMKA",
                window_("Pomocnik", watchlist, 200, "≡ ⌄ ×"),
                SUSPECT,
            )
        }
  <div class="leg" style="width:290px">
    <div class="item"><div class="swatch" style="background:none;display:flex;
      align-items:center;padding-left:2px">
      <span style="width:11px;height:11px;border-radius:2px;background:${OURS}"></span></div>
      <div class="txt"><b>Pudełko, nie znaczek.</b> Ta sama sztuczka co przy pineskach półki:
      ptaszek nie jest tej samej szerokości na każdej platformie, a pudełko jest.</div></div>
    <div class="item"><div class="swatch" style="background:none;color:#6b6b75;
      display:flex;align-items:center;justify-content:flex-end;padding-right:6px;
      font:11px system-ui,sans-serif">—</div>
      <div class="txt"><b>Kreska to zero, nie brak.</b> Rzecz obserwowana, pod którą teraz
      nikogo nie ma — i dlatego nie ma jej też w oknie obok.</div></div>
    <div class="item"><div class="swatch" style="background:none;border:1px solid #3a3a44"></div>
      <div class="txt"><b>Wyłączone zostaje na liście.</b> Czytelnik ma widzieć, czego
      <em>nie</em> pilnuje — inaczej cisza w oknie jest dwuznaczna.</div></div>
  </div>
</div>`,
        notes: [
            note(
                "Dziewięć domyślnych, pięć do wzięcia",
                `Domyślne są te, o które maintainer poprosił. Reszta stoi na liście wyłączona, bo każda ` +
                    `z nich kosztuje wiersze w ustawce — stany i pancerz najwięcej, bo idą per postać, ` +
                    `a nie per rzut.`,
            ),
            note(
                "Dlaczego lista jest w tym samym oknie",
                `Drugie okno na konfigurację byłoby trzecim oknem na cudzej stronie. Ta sama ramka, ` +
                    `to samo miejsce, jedno naciśnięcie tam i z powrotem — i nic pod spodem się nie ` +
                    `przesuwa, bo okno nie zmienia szerokości.`,
                "good",
            ),
            note(
                "Dwie opcje wzięte od nich",
                `Przezroczystość tła i chowanie poza walką to sensowne ustawienia i nie ma powodu ` +
                    `wymyślać ich inaczej. Stoją pod kreską, bo dotyczą okna, a nie tego, co w nim jest ` +
                    `— tak samo jak strip półki w panelu dotyczy listy, a nie walki.`,
            ),
            note(
                "Gdzie to mieszka między walkami",
                `W magazynie przeglądarki, obok wyboru z panelu. Odmowa zapisu jest odpowiedzią, ` +
                    `nie awarią: lista wraca do domyślnej i okno mówi to raz, w jednym miejscu.`,
                "warn",
            ),
        ].join(""),
    })),
);

/* ---------------------------------------------------------- M · Kolejka */

const corpus = measured.corpus;

const queue = [
    section("TERAZ"),
    `<div class="pw-row">
    <div class="pw-fill" style="width:100%;background:${tint(OURS)}"></div>
    <div class="pw-cap" style="background:${OURS}"></div>
    <span class="pw-name">Gracz 5</span><span class="pw-val">tura 248</span></div>`,
    section("POTEM"),
    `<div class="pw-row">
    <div class="pw-rest" style="left:0;width:100%;
      background:repeating-linear-gradient(135deg,${THEIRS}38 0 2px,transparent 2px 5px)"></div>
    <div class="pw-cap" style="background:${THEIRS}"></div>
    <span class="pw-name">Renegat 2</span>
    <span class="pw-val" style="font-weight:400;color:${TOKEN.quiet}">prognoza</span></div>`,
].join("");

const refused = `<div style="width:200px">
  <div class="cap" style="color:#8a3b2e">CZEGO NIE RYSUJEMY</div>
  <div class="pw-body" style="border:1px dashed #4a2f28;border-radius:8px">
    <div class="pw-sec"><span>KOLEJKA</span><span class="n">10</span></div>
    ${
    [
        ["Gracz 5", "248", 1],
        ["Renegat 2", "249", 0.72],
        ["Gracz 9", "250", 0.6],
        ["Renegat 7", "251", 0.5],
        ["Gracz 1", "252", 0.42],
        ["Renegat 4", "253", 0.34],
        ["Gracz 3", "254", 0.28],
        ["Renegat 9", "255", 0.22],
        ["Gracz 8", "256", 0.18],
        ["Renegat 1", "257", 0.14],
    ].map(([who, turn, ink], at) =>
        `<div class="pw-row" style="opacity:${ink};background:${at === 0 ? TOKEN.track : "transparent"}">
      <span class="pw-name">${who}</span>
      <span class="pw-val" style="font-weight:400">${turn}</span></div>`
    ).join("")
}
    <div class="pw-note" style="color:#8a3b2e">dziewiąty myli się w 28%</div>
  </div>
</div>`;

writeFileSync(
    "Kolejka.dc.html",
    page(sheet({
        tag: tag("Kolejka tur", "<span class='no'>— gra podaje dziesięć, rysujemy dwie</span>"),
        title: "Teraz i jeden krok",
        lede:
            `<span class="m">turns_warriors</span> stoi w <b>${corpus.withQueue}</b> z ` +
            `${corpus.payloads} paczek korpusu i jest listą przewidywań, którą klient gry rysuje sam ` +
            `(pomoc gry, §1.1). Nic w <span class="m">src/</span> jej dziś nie czyta. Najmniejszy wpis ` +
            `to <b>stwierdzenie</b> — tura w toku, i <span class="m">current</span> nazywa tę samą ` +
            `postać w każdej paczce niosącej oba. Dziewięć powyżej to prognoza, i tyle jest z nią warta.`,
        body: `<div class="stage">
  ${hold("POMOCNIK — KOLEJKA WŁĄCZONA", window_("Pomocnik", queue), OURS)}
  ${refused}
  <div style="flex:1;min-width:290px">
    <div class="cap" style="color:${SUSPECT}">Ile myli się prognoza</div>
    <table class="reg" style="color:#e7e7ea">
      <tr><th style="border-color:#2c2c35;color:#868691">wpis</th>
        <th style="border-color:#2c2c35;color:#868691;text-align:right">myli się</th>
        <th style="border-color:#2c2c35;color:#868691">rysujemy</th></tr>
      <tr><td style="border-color:#2c2c35">najmniejszy — tura w toku</td>
        <td class="n" style="border-color:#2c2c35;color:${OURS}">nigdy</td>
        <td style="border-color:#2c2c35;color:${OURS}">tak, jako stwierdzenie</td></tr>
      <tr><td style="border-color:#2c2c35">jeden krok naprzód</td>
        <td class="n" style="border-color:#2c2c35;color:${SUSPECT}">3%</td>
        <td style="border-color:#2c2c35;color:${SUSPECT}">tak, oznaczone jako prognoza</td></tr>
      <tr><td style="border-color:#2c2c35">dziewięć kroków naprzód</td>
        <td class="n" style="border-color:#2c2c35;color:#e0736f">28%</td>
        <td style="border-color:#2c2c35;color:#e0736f">nie</td></tr>
    </table>
    <p style="color:#9a9aa6;font:12.5px/1.5 'IBM Plex Sans',system-ui,sans-serif;margin:14px 0 0">
      Zmierzone w <span class="m" style="background:#24242a;color:#e7e7ea">a01bf11</span>, przez
      porównanie prognozy z tym, co gra sama powiedziała później. Ogon kolejki nie jest „trochę
      niepewny" — co czwarty wpis jest po prostu nieprawdziwy.</p>
  </div>
</div>`,
        notes: [
            note(
                "Prognoza wygląda na prognozę",
                `Wiersz „potem" jest cały kreskowany — tak samo jak niewypełniona część wiersza aury. ` +
                    `Jedna faktura znaczy w tym oknie jedno: <em>zapowiedziane, nie zmierzone</em>.`,
                "good",
            ),
            note(
                "Dlaczego nie dziesięć z zanikającym tuszem",
                `Bo blednący wiersz nadal jest wierszem i nadal się go czyta. Prawa makieta pokazuje ` +
                    `ten pomysł i jest tu po to, żeby go odrzucić świadomie: przy 28% błędu na końcu ` +
                    `ogona to nie jest odczyt osłabiony, tylko zmyślenie z gradientem.`,
                "warn",
            ),
            note(
                "Co to daje w ustawce",
                `Jedno pytanie: czy zdążę przed nim. Dwa wiersze na nie odpowiadają, dziesięć ` +
                    `odpowiada gorzej — bo trzeba jeszcze wiedzieć, od którego przestać wierzyć.`,
            ),
            note(
                "To nie jest domyślne",
                `Kolejka stoi na liście wyłączona (arkusz L). Odpowiada na pytanie, które gra już ` +
                    `sobie odpowiada własnym paskiem inicjatywy — więc wchodzi tylko wtedy, gdy ` +
                    `czytelnik jej chce.`,
            ),
        ].join(""),
    })),
);

/* ----------------------------------------------------------- N · Odmowy */

const refusals = [
    [
        "Odliczanie — „zostało 5 tur\"",
        "Protokół nigdy nie mówi, że efekt się skończył: ani potwierdzenia, ani odświeżenia, ani wygaśnięcia w całym <span class=\"m\">captures/</span>.",
        "ADR 0050 · ADR 0053",
    ],
    [
        "Kto nałożył status",
        "Gdy bit się zapala, żaden komunikat celowany w obarczonego tego nie mówi. Najlepszy odczyt trafia 70 razy na 223.",
        "ADR 0049 · ADR 0052",
    ],
    [
        "„Ostatni Ratunek dostępny\"",
        "Protokół mówi tylko, komu bonus zadziałał. Kto go w ogóle ma, nie pada nigdzie.",
        "arkusz K",
    ],
    [
        "Kolejka dalej niż o jeden krok",
        "Prognoza myli się w 3% jedną turę naprzód i w 28% dziewięć.",
        "a01bf11 · arkusz M",
    ],
    [
        "Czas trwania pieśni barda",
        "Osiem rzutów w korpusie przychodzi pod <span class=\"m\">tcustom</span> bez <span class=\"m\">skillId</span> — nic ich nie łączy z tabelą umiejętności.",
        "docs/auras-standing.md",
    ],
    [
        "Nazwa dla bitu 10",
        "Maska go niesie, klient gry go nie rysuje, nikt go nie nazywa. Rysujemy go jako bit, którym jest.",
        "docs/statuses-standing.md",
    ],
    [
        "Cokolwiek w tipie postaci w grze",
        "Nic naszego nie sięga poza własny shadow root, i nic z gry nie sięga do środka.",
        "The Guest Rule",
    ],
    [
        "Wiersz z klucza <span class=\"m\">focus</span> — na razie",
        "Zmierzony i czysty, ale rejestr kluczy ma tam wpis <em>not looked into</em>. Wpis dostaje werdykt przed wierszem, nie po nim.",
        "arkusz G",
    ],
    [
        "Punkty kombinacji cudzej postaci",
        "<span class=\"m\">skills_combo_max</span> przychodzi wyłącznie we własnym <span class=\"m\">init</span> czytelnika.",
        "arkusz B",
    ],
    [
        "Rada, co zrobić",
        "„Rzuć teraz\", „bij w tego\" — to byłoby wpływanie na przebieg walki, a nie jej czytanie.",
        "PRODUCT.md",
    ],
    [
        "Cokolwiek wysłanego gdziekolwiek",
        "Dodatek nie wykonuje żadnego żądania sieciowego, także z tego okna.",
        "SECURITY.md",
    ],
    [
        "Ruch, miganie, dźwięk",
        "Nic się nie rusza samo, nic nie przerywa, nic nie kradnie ogniskowej — nad cudzą grą.",
        "The Quiet Panel Rule",
    ],
];

writeFileSync(
    "Odmowy.dc.html",
    page(sheet({
        tag: tag("Odmowy", "<span class='no'>— dwanaście, każda z powodem</span>"),
        title: "Czego Pomocnik nie narysuje",
        lede:
            `Zebrane w jednym miejscu, bo inaczej każda z nich musiałaby być tłumaczona osobno na ` +
            `arkuszu, na którym akurat wypadła. Żadna z tych rzeczy nie jest niemożliwa do narysowania ` +
            `— wszystkie są łatwe. Trudne jest to, że wyglądałyby dokładnie tak samo jak figury, za ` +
            `którymi to repozytorium potrafi stanąć.`,
        body: `<table class="reg">
<tr><th style="width:30%">Czego nie ma</th><th style="width:47%">Dlaczego</th>
  <th>Gdzie to stoi</th></tr>
${
    refusals.map(([what, why, where]) =>
        `<tr><td>${what}</td><td>${why}</td>
    <td class="mono" style="color:#8a8478">${where}</td></tr>`
    ).join("\n")
}
</table>`,
        notes: [
            note(
                "Odmowa to nie brak funkcji",
                `Każdy wiersz tej tabeli ma odpowiednik, który <em>rysujemy</em>: zamiast odliczania ` +
                    `przebyte z podanych, zamiast rzucającego samą długość, zamiast „dostępny" — ` +
                    `„przebity". Czytelnik dostaje odpowiedź na to samo pytanie, tylko węższą o to, ` +
                    `czego nikt nie wie.`,
                "good",
            ),
            note(
                "Cztery z nich są tymczasowe",
                `<span class="m">focus</span>, wyzwania, bit 10 i pieśni barda czekają na materiał ` +
                    `albo na wpis w rejestrze kluczy. Reszta jest trwała, bo wynika z tego, czego ` +
                    `protokół nie niesie.`,
            ),
            note(
                "Czego brakuje najbardziej",
                `Nagrania walki grupowej między graczami. Bez niego arkusz H jest kształtem, ` +
                    `<span class="m">focus</span> nie da się sprawdzić poza kolosem, a gęstość ustawki ` +
                    `jest zgadywana. To pierwsza pozycja <span class="m">TODO.md</span> i to nie ` +
                    `przypadek.`,
                "warn",
            ),
            note(
                "Ten arkusz się starzeje",
                `I dobrze. Gdy któraś odmowa przestanie być prawdziwa, znika stąd razem z wierszem, ` +
                    `który ją zastąpi — a nie zostaje jako ostrożność, której nikt już nie sprawdza.`,
            ),
        ].join(""),
    })),
);

console.log("row 5: Obserwuje.dc.html Kolejka.dc.html Odmowy.dc.html");
