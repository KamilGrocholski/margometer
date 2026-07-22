import { boot } from "./index.ts";

// Jedyny plik z efektem ubocznym — dzięki temu import czegokolwiek z `src/`
// w testach nie podnosi overlaya ani nie zostawia działającego interwału.
boot();
