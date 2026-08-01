@AGENTS.md

## Claude Code

Instrukcje projektu siedzą w `AGENTS.md` — otwartym formacie, który czyta też
reszta narzędzi (Codex, Cursor, Copilot, Gemini CLI). Import zamiast symlinka,
bo poniżej stoją rzeczy dotyczące wyłącznie Claude Code, a symlink na to nie
pozwala.

- **Brama przed commitem:** `bun run check`. Sam `bun test` nie wystarcza —
  build składa userscript i potrafi paść osobno.
- **Plan mode przy zmianach w `src/parser.ts`, `src/stats.ts` i `src/types.ts`.**
  Tam mieszka kontrakt danych: jedno pole dopisane do typu i zapomniane
  w `mergeStats` daje liczby, które cicho maleją. Zdarzyło się dwa razy.
- **Zdania o mechanice gry** przechodzą przez `docs/MECHANIKA.md`, także te
  negatywne. Szczegóły w `AGENTS.md`; procedura ładuje się sama przy plikach,
  których dotyczy (`.claude/rules/mechanika-gry.md`).

Zasady pisania commitów (kiedy, co ma być w treści, jak brzmi nagłówek) stoją
w `AGENTS.md` → **Commity** — dotyczą każdego narzędzia, nie tylko tego.
Wcześniej „nie commituj bez proszenia" stało tu osobno; jest tam, żeby reguła
nie żyła w dwóch miejscach naraz.
