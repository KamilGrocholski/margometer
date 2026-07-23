import { JSDOM } from "jsdom";

// bunfig.toml preloaduje ten plik dla wszystkich testów. Rdzeń (parser,
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
