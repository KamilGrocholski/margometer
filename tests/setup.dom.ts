import { beforeEach } from "bun:test";
import { JSDOM } from "jsdom";

// bunfig.toml preloaduje ten plik dla wszystkich testów. Rdzeń (dekoder,
// agregacja) DOM-u nie potrzebuje — jest tu dla warstwy overlaya.
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://tempest.margonem.pl/",
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  Node: dom.window.Node,
  MutationObserver: dom.window.MutationObserver,
  // Bun ma własny Event, którego jsdom nie przyjmuje w dispatchEvent.
  Event: dom.window.Event,
});

// Dokument jest WSPÓLNY dla wszystkich plików testowych, więc węzeł zostawiony
// przez jeden test potrafi zmylić `findBattleLog` w zupełnie innym pliku.
// Czyszczenie stało dotąd lokalnie w `overlay.test.ts` i przy rozbiciu go na
// pliki modułowe okazało się, że chroniło przy okazji całą resztę.
beforeEach(() => {
  dom.window.document.body.innerHTML = "";
});
