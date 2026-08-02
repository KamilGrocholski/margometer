/**
 * Wersja dodatku — dla KODU, nie dla nagłówka.
 *
 * `tools/userscript-meta.ts` bierze numer z `package.json` i wpisuje go
 * w `@version`; to jest ta sama liczba wzięta tą samą drogą, tylko dla wnętrza
 * bundle'a. Kopii nie ma i mieć nie może: numer w `@version` steruje
 * aktualizacją u użytkownika, a numer w zgłoszeniu ma mówić, czego to zgłoszenie
 * dotyczy — rozjazd między nimi znaczy, że jedno z dwóch kłamie.
 *
 * PO CO to w ogóle jest. Od `0.3.0` dodatek aktualizuje się sam, a `README`
 * i treść każdego wydania proszą wprost o przysyłanie logów z zepsutych walk.
 * Do tej pory ani panel, ani skopiowany JSON nie mówiły, z której wersji
 * pochodzą — czyli zgłoszenia z automatycznie zaktualizowanego dodatku
 * przychodziły bez jedynej informacji, która pozwala je uszeregować.
 *
 * Import JSON-a, a nie `define` z `Bun.build`: stała ma mieć tę samą wartość
 * w teście co w bundle'u. Podstawienie przy budowaniu dałoby w testach albo
 * zaślepkę, albo `ReferenceError` — i test na „JSON niesie wersję" pilnowałby
 * wtedy zaślepki.
 *
 * Import NAZWANY, nie domyślny, i to jest różnica mierzalna: `import pkg from`
 * wstawia do bundle'a CAŁY `package.json` (skrypty, `devDependencies` —
 * 157 686 B), bo bundler nie ma jak odsiać nieużywanych pól obiektu.
 * `import { version } from` zostawia jedną linię `var version = "0.3.0"`
 * (157 026 B). Do pliku, który użytkownik dostaje do wklejenia, nie ma po co
 * jechać nasza lista zależności deweloperskich.
 */
import { version } from "../package.json" with { type: "json" };

export const VERSION: string = version;
