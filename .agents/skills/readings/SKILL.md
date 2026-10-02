---
name: readings
description: Start a round in MargoMeter on current readings of the game — the frozen tables, the published help, the production and experimental client builds — and keep them current while the work leans on the game. Use at the start of a round, when the session-start status shows STALE or UNKNOWN, before a claim about the game, or when the user says "odśwież frozen", "pomoc", "build", "experimental", "readings".
---

# Keeping the readings of the game current in MargoMeter

The gate reaches no network, so it cannot see a reading go behind the game. **This skill owns no
rule**: when to do it is **W10**, the routine and what it writes are `frozen/AGENTS.md`, and why a
reading keeps its date is ADR 0011.

## The process

1. **Read the status.** The session-start hook in `.claude/settings.json` prints
   `margonem:readings status` and `margonem:client status` into the context. Where it is missing (a
   resumed session, or a round started later), run both yourself.
2. **Any row STALE → refresh:** `deno task margonem:readings refresh`. Its lines say `moved to` or
   `unchanged since` for each reading, then it prints a status, which should be all `current`.
3. **Read what moved:** `git diff --stat frozen/`. Empty means only the caches in `.cache/` moved,
   and there is nothing to commit. A moved file:
   - stage it by path and run the gate (`gate` skill, **W1**, **W2**); a key or a bit added, dropped
     or renamed is a name `docs/names.md` lists, and `deno task names` writes it again;
   - a guard gone red is a claim the game no longer backs, and the claim changes, never the reading
     (`frozen/AGENTS.md`, _Never_);
   - the refresh is a commit of its own, its body naming the build or date and what moved (**G3**),
     and it waits for the maintainer like any other (**G1**).
4. **The experimental build moved** (`development … STALE` in `margonem:client status`) → run
   `deno task margonem:readings preview`. A key or a bit it names is a heads-up for the next
   release: report it to the maintainer, and freeze nothing from it.
5. **Ask again during the round**, with `margonem:readings status`, before any claim that leans on
   the game: a key's meaning, a phrase of the help, a duration. Ask again before a commit whose
   round leaned on them (the `commit` checklist).

## Reading the exit

| Command   | `0`                 | `1`                              | `2`              |
| --------- | ------------------- | -------------------------------- | ---------------- |
| `status`  | every row current   | a reading went behind: refresh   | nobody could ask |
| `preview` | development matches | development adds, drops or moves | nobody could ask |

`2` is an outage, not evidence that anything moved: wait and ask again, and never file a claim on
it.

## The checklist

- [ ] The status was read at the start of the round, and every row is `current` (**W10**).
- [ ] A refresh that moved a file went through the gate, and its commit holds nothing else.
- [ ] A red guard after a refresh was reported as a claim to fix, never met by trimming a reading.
- [ ] A new experimental build was previewed, and what it named was reported.
- [ ] The status was asked again before a claim about the game.

## Gotchas paid for

- **The help goes stale by age, not by content.** Its dump is current for a week after the fetch,
  whatever the help says in the meantime. A claim that turns on the help's wording wants a refresh
  first, not only a status.
- **The development client is unminified.** The two walks accept the spacing it is served with. A
  preview that fails to lift is a finding about the walk, not about the game.
- **A refresh can move `blows-granted`**, which the decoder reads. `fight:develop` may then differ
  from `develop` @ `fa1dcce`, and that is the game moving, not the code (ADR 0005).
