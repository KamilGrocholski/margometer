import { writeFileSync } from "node:fs";

const canvas = {
  artboards: [
    { file: "Main.dc.html", x: 0, y: 0, w: 760, h: 860, title: "B · Ekran panelu" },
    { file: "OpcjaA.dc.html", x: 860, y: 0, w: 760, h: 860, title: "A · Okno obok panelu" },
    { file: "OpcjaC.dc.html", x: 1720, y: 0, w: 760, h: 860, title: "C · Tablica obu stron" },
    { file: "OpcjaD.dc.html", x: 0, y: 1000, w: 760, h: 760, title: "D · Rynna na wierszu" },
    { file: "Wiersz.dc.html", x: 860, y: 1000, w: 940, h: 760, title: "E · Anatomia wiersza" },
    { file: "Epizody.dc.html", x: 1900, y: 1000, w: 760, h: 760, title: "F · Epizody po walce" },
    { file: "Legendarne.dc.html", x: 0, y: 1900, w: 760, h: 780, title: "G · Ostatni Ratunek" },
    { file: "Kolosy.dc.html", x: 860, y: 1900, w: 940, h: 780, title: "H · Kolosy (spekulacja)" },
    { file: "Granice.dc.html", x: 1900, y: 1900, w: 940, h: 1020, title: "I · Słownik i granice" },
    { file: "DwaOkna.dc.html", x: 0, y: 3060, w: 1000, h: 900, title: "J · Dwa okna, My i Oni" },
    { file: "DwaOknaStany.dc.html", x: 1100, y: 3060, w: 1000, h: 900, title: "K · Dwa okna po stanie" },
    { file: "JednoOknoObie.dc.html", x: 2200, y: 3060, w: 880, h: 900, title: "L · Jedno okno, obie strony" },
    { file: "Zmiana.dc.html", x: 0, y: 4100, w: 1000, h: 860, title: "M · Co się właśnie zmieniło" },
  ],
  annotations: [
    {
      id: "brief",
      x: 0,
      y: -220,
      w: 700,
      text:
        "Gdzie i jak pokazać stan walki.\n\nGórny rząd: cztery miejsca, w których to może stanąć.\nŚrodkowy: jak wygląda jeden wiersz i co widać po walce.\nTrzeci: legendarne bonusy, kolosy i granice odczytu.\nCzwarty: szybki wgląd bez klikania — J, K, L, M.\n\nNic tu nie rysuje odliczania, nie nazywa rzucającego statusu i nie mówi „OR dostępne\" — protokół żadnej z tych trzech rzeczy nie niesie.",
    },
    {
      id: "rzad-gdzie",
      x: 2580,
      y: 0,
      w: 240,
      text: "GDZIE\n\nCztery umieszczenia. B jest rekomendacją, D stoi tu jako rachunek do odrzucenia świadomie.",
    },
    {
      id: "rzad-szybki",
      x: 3180,
      y: 3060,
      w: 260,
      text:
        "SZYBKI WGLĄD\n\nBez klikania, słowami zamiast ikon.\n\nJ — grupą jest postać.\nK — grupą jest stan. Ta sama treść, inne pytanie.\nL — to samo w jednym oknie zamiast dwóch.\nM — co się zmieniło od ostatniej paczki. Doklejane na górę J, K albo L.",
    },
  ],
  launch: { view: "canvas" },
};
writeFileSync("canvas.json", JSON.stringify(canvas, null, 2));
console.log("canvas ok");
