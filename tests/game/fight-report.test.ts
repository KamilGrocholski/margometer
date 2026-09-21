/**
 * The figures of one fight as the handed-over file writes them, held to what the aggregate keeps:
 * a row is keyed off `CombatantFigures` and a skill off `SkillFigures`, so what a reader hands
 * over can explain every row the panel drew from either.
 */

import { assert, assertEquals } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import { composeReportFight } from "@/src/game/fight-report.ts";
import { isRecord } from "@/libs/unknown-reading.ts";
import { BLOWS_GRANTED } from "@/tests/recorded-fight.ts";

/**
 * A skill announced, its blow, and the blow the client glues to the announcement landing nothing
 * (**ADR 0078**): two swings under one name, which is the row the panel draws for it.
 */
Deno.test("a skill row in the file carries its blows, which is what the panel drew it for", () => {
    const roster = composeCombatantRoster([
        { id: 1, name: "Gracz 1", side: 1, profession: "w", level: 40, healthMaximum: 1000 },
        { id: 2, name: "Gracz 2", side: 2, profession: "w", level: 40, healthMaximum: 1000 },
    ]);
    const events = decodeFightMessages(
        [
            "1=90.00;2=80.00;tspell=Cios;skillId=1;+dmg=100;-dmg=100",
            "1=90.00;2=80.00;+dmg=100;-blok=100;-dmg=0",
        ],
        roster,
        BLOWS_GRANTED,
    );
    const statistics = composeFightStatistics(events, new Map());
    const report = composeReportFight({
        statistics,
        roster,
        place: null,
        payloads: 1,
        messagesLost: 0,
        isOver: false,
    });
    const combatants = report.combatants;
    assert(isRecord(combatants), "the report holds a row per combatant");
    const row = combatants["1"];
    assert(isRecord(row), "and the dealer has one");
    const skills = row.skills;
    assert(isRecord(skills), "with the skills it announced");
    assertEquals(skills["Cios"], {
        name: "Cios",
        uses: 1,
        dealt: 100,
        blows: 2,
        dealtByOpponent: { "2": 100 },
        restored: 0,
        restoredByOpponent: {},
    }, "the row states the blows beside what they dealt");
});
