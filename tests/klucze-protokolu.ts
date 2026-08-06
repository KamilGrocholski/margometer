// WYGENEROWANE — nie edytuj ręcznie. Odtwarza: `bun tools/slownik.ts --zamroz`.
/**
 * Etykiety renderera walki z assetu gry — build `1785244275300`, świat
 * `tempest`, pomiar 2026-08-06.
 *
 * PO CO TU LEŻY. Dodatek rozwiązuje brzmienia w locie przez `window._t`,
 * ale identyfikatory, o które pyta, są ZASZYTE w `src/protokol.ts` — listy
 * kluczy z gry wyliczyć się nie da, bo słownik jest w produkcji domknięty
 * w module. Zaszyta kopia, która rozjedzie się z grą, daje w panelu klucz
 * zamiast zdania i robi to PO CICHU. Ten plik jest jedyną stroną, po której
 * da się ten rozjazd złapać w teście.
 *
 * `milczy` znaczy „gra ma dla tej etykiety puste ciało i świadomie nic nie
 * wypisuje" — dla dekodera to odpowiedź, nie luka.
 *
 * ⚠️ **BRZMIEŃ TU NIE MA — i to jest celowe.** `maZdanie` mówi tylko, CZY gra
 * ma dla identyfikatora zdanie; polskie teksty należą do Garmory i nie leżą
 * w tym repozytorium (`NOTICE.md`). Testom to wystarcza, dodatek bierze
 * brzmienia z żywej gry przez `window._t`. Nie dopisuj ich z powrotem.
 */
import type { Zamrozenie } from "../tools/slownik.ts";

export const ZAMROZENIE: Zamrozenie = {
  "build": "1785244275300",
  "swiat": "tempest",
  "zmierzone": "2026-08-06",
  "metoda": "bun tools/slownik.ts --zamroz",
  "klucze": [
    {
      "klucz": "+abdest",
      "id": "msg_+abdest %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+abdest_per",
      "id": "msg_only_val_+abdest_per",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+abmdest_per",
      "id": "msg_only_val_+abmdest_per",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+absorb",
      "id": "msg_+absorb %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+absorbm",
      "id": "msg_+absorbm %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+acdmg",
      "id": "msg_+acdmg %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+acdmg_destroyed",
      "id": "msg_+acdmg_destroyed",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+actdmg",
      "id": "msg_+actdmg %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+crit",
      "id": "msg_+crit",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+critpierce",
      "id": "eng_game_only_val_+critpierce %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+critpoison_per",
      "id": "msg_+critpoison_per %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+critsa",
      "id": "msg_+critsa %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+critsa_per",
      "id": "msg_+critsa_per %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+critslow",
      "id": "msg_+hithurt %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+critslow_per",
      "id": "msg_+critslow_per= %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+critwound",
      "id": "msg_+critwound",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+crush",
      "id": "eng_game_only_val_+crush %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+crush_distance",
      "id": "eng_game_only_val_+crush %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+crush_fire",
      "id": "eng_game_only_val_+crush %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+crush_frost",
      "id": "eng_game_only_val_+crush %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+crush_light",
      "id": "eng_game_only_val_+crush %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+crush_physical",
      "id": "eng_game_only_val_+crush %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+distract",
      "id": "msg_+distract",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+endest",
      "id": "msg_+endest %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+energy",
      "id": "msg_+energy %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+engback",
      "id": "msg_+engback %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+exp",
      "id": "msg_+exp %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+fastarrow",
      "id": "msg_+fastarrow",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+firearrow",
      "id": "msg_+firearrow",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+freeze",
      "id": "msg_+freeze",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+immobilize",
      "id": "msg_+immobilize",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+injure",
      "id": "msg_+injure %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+legbon_anguish",
      "id": "msg_+legbon_anguish %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+legbon_curse",
      "id": "msg_+legbon_curse",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+legbon_frenzy_main",
      "id": "msg_+legbon_frenzy_main %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+legbon_frenzy_off",
      "id": "msg_+legbon_frenzy_off %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+legbon_holytouch",
      "id": "msg_+legbon_holytouch %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+legbon_puncture",
      "id": "msg_+legbon_puncture %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+legbon_pushback",
      "id": "msg_+legbon_pushback",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+legbon_verycrit",
      "id": "msg_+legbon_verycrit",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+lowheal2turns",
      "id": "msg_+lowheal2turns %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+manadest",
      "id": "msg_+manadest %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+mcurse",
      "id": "msg_+mcurse",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+of_crit",
      "id": "msg_+of_crit",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+of_dmg",
      "id": null,
      "maZdanie": false,
      "milczy": false
    },
    {
      "klucz": "+of_wound",
      "id": "msg_+of_wound",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+of_woundmagic",
      "id": "msg_of_woundmagic %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+of_woundpoison",
      "id": "msg_of_woundpoison %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+oth_cover",
      "id": "msg_+oth_cover %val% %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+oth_dmg",
      "id": "msg_+oth_dmg %val% %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+ph",
      "id": "msg_+ph %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+pierce",
      "id": "msg_+pierce",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+rage",
      "id": "msg_+rage %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+resdmg",
      "id": "msg_+resdmg %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+resdmgc",
      "id": "msg_+resdmgc %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+resdmgf",
      "id": "msg_+resdmgf %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+resdmgl",
      "id": "msg_+resdmgl %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+rotatingblade",
      "id": "msg_+rotatingblade",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+spell-taken_dmg",
      "id": "eng_game_only_nick_+spell-taken_dmg %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+spell-taken_dmg-all",
      "id": "end-game-without-percent+spell-taken_dmg-all",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+spell-vamp_time",
      "id": "eng_game_only_nick_+spell-vamp_time %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+stun",
      "id": "msg_+stun",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+stun2",
      "id": "msg_+stun2",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+stun2-c",
      "id": "msg_+stun2-c",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+stun2-d",
      "id": "msg_+stun2-d",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+stun2-f",
      "id": "msg_+stun2-f",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+stun2-l",
      "id": "msg_+stun2-l",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+superspell-dispel",
      "id": "msg_+dispel",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+superspell-prevented",
      "id": "msg_+superspell-prevented",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+swing",
      "id": "msg_+swing",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+taken_dmg",
      "id": "eng_game_only_val_+taken_dmg %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+thirdatt",
      "id": "+third_strike",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+verycrit",
      "id": "msg_+verycrit",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+vulture",
      "id": "msg_+vulture= %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+wound",
      "id": "msg_+wound",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+woundfrost",
      "id": "msg_woundfrost %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+woundmagic",
      "id": "msg_woundmagic %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "+woundpoison",
      "id": "msg_woundpoison %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-absorb",
      "id": "msg_-absorb %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-absorbm",
      "id": "msg_-absorbm %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-arrowblock",
      "id": "msg_-arrowblock",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-blok",
      "id": "msg_-blok %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-contra",
      "id": "msg_-contra",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-endest",
      "id": "msg_-endest %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-evade",
      "id": "msg_-evade",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-immunity_to_dmg",
      "id": "end-game-without-percent-immunity_to_dmg",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-legbon_cleanse",
      "id": "msg_-legbon_cleanse",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-legbon_critred",
      "id": "msg_-legbon_critred %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-legbon_dmgred",
      "id": "msg_-legbon_dmgred %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-legbon_facade",
      "id": "msg_-legbon_facade %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-legbon_glare",
      "id": "msg_-legbon_glare",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-legbon_resgain",
      "id": "msg_-legbon_resgain",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-legbon_retaliation",
      "id": "msg_-legbon_retaliation %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-lowcritallval",
      "id": "msg_-lowcritallval %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-manadest",
      "id": "msg_-manadest %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-parry",
      "id": "msg_-parry",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-pierceb",
      "id": "msg_-pierceb",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-poison_lowdmg_per",
      "id": "msg_-poison_lowdmg_per %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-rage",
      "id": "msg_-rage",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-redabdest_per",
      "id": "msg_redabdest_per %m1%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-redacdmg",
      "id": "msg_-redacdmg %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-redacdmg_per",
      "id": "msg_-redacdmg_per %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-reddest_per",
      "id": "msg_-reddest_per %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-reddest_per0",
      "id": null,
      "maZdanie": false,
      "milczy": true
    },
    {
      "klucz": "-redendest",
      "id": "msg_-redendest %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-redendest_per",
      "id": "msg_-redendest_per %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-redmanadest",
      "id": "msg_-redmanadest %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-redmanadest_per",
      "id": "msg_-redmanadest_per %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-resmanaendest",
      "id": "msg_-resmanaendest %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-spell-distortion",
      "id": "eng_game_nick_and_opponent_-spell-distortion %name% %target%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-spell-immunity_to_dmg",
      "id": "eng_game_nick_and_friendnick_-spell-immunity_to_dmg %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-tenacity",
      "id": "msg_-tenacity",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "-thirdatt",
      "id": null,
      "maZdanie": false,
      "milczy": false
    },
    {
      "klucz": "absolute",
      "id": "msg_absolute %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "achpp_per",
      "id": "achpp_per",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "active_absorbdest_per",
      "id": null,
      "maZdanie": false,
      "milczy": true
    },
    {
      "klucz": "active_block_per",
      "id": "msg_only_val_active_block_per",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "active_decblock_per",
      "id": null,
      "maZdanie": false,
      "milczy": true
    },
    {
      "klucz": "active_decblock_per-enemies",
      "id": "msg_only_val_active_decblock_per-enemies",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "active_resall_per",
      "id": "msg_only_val_active_resall_per",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "afterheal",
      "id": "msg_afterheal %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "alllowdmg",
      "id": "msg_alllowdmg %val% %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "allslow",
      "id": "msg_allslow",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "allslow_per",
      "id": "msg_allslow_per %val% %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "anguish",
      "id": "msg_anguish %name% %hpp% %val0%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "ansgame",
      "id": "msg_ansgame",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "antidote",
      "id": "msg_antidote %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "arrowrain",
      "id": "msg_arrowrain",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "aura-ac",
      "id": "msg_aura-ac %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "aura-ac_per",
      "id": "msg_aura-ac_per %val% %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "aura-adddmg2_per-meele",
      "id": "msg_blesswords_perw %val% %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "aura-resall",
      "id": "msg_aura-resall %val% %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "aura-sa",
      "id": "msg_aura-sa %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "aura-sa_per",
      "id": "msg_aura-sa_per_new %val% %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "balloflight",
      "id": null,
      "maZdanie": false,
      "milczy": true
    },
    {
      "klucz": "bandage",
      "id": "msg_aura-bandage %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "blackout",
      "id": "msg_blackout",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "blizzard",
      "id": "msg_blizzard",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "chainlightning",
      "id": null,
      "maZdanie": false,
      "milczy": true
    },
    {
      "klucz": "chainlightning_perw",
      "id": "msg_chainlightning_perw %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "combo-max",
      "id": "msg_combo-max",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "cover",
      "id": "msg_cover",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "critmval-allies",
      "id": "eng_game_only_val_critmval-allies %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "critmval-enemies",
      "id": "eng_game_only_val_critmval-enemies %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "critstagnation",
      "id": "msg_critstagnation",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "critval-allies",
      "id": "eng_game_only_val_critval-allies %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "critval-enemies",
      "id": "eng_game_only_val_critval-enemies %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "critwound",
      "id": "msg_critwound %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "daggerthrow",
      "id": null,
      "maZdanie": false,
      "milczy": true
    },
    {
      "klucz": "distortion",
      "id": "eng_game_only_nick_distortion %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "distractshoot",
      "id": "msg_distractshoot",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "disturb",
      "id": "msg_disturb",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "disturbshoot",
      "id": "msg_disturbshoot",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "dloot",
      "id": "msg_dloot %name% %g1% %m1%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "dmg-target_physical",
      "id": "eng_game_opponent_nick_and_value_dmg-target_physical %target% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "dmg_hpp",
      "id": "msg_-dmg_hpp",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "doubleshoot",
      "id": "msg_doubleshoot %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "en-regen",
      "id": "msg_en-regen %gain_lost% %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "en-regen-cast",
      "id": "msg_en-regen-cast %name% %target%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "energy",
      "id": "msg_energy %name% %gain_loss% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "energyout",
      "id": "msg_energyout %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "fire",
      "id": "msg_fire %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "fireshield",
      "id": "msg_fireshield %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "firewall",
      "id": "msg_firewall %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "flee",
      "id": "msg_flee %name% %hp%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "footshoot",
      "id": "msg_footshoot %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "frost",
      "id": "msg_frost %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "frostshield",
      "id": "msg_frostshield %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "heal",
      "id": "msg_heal %gain_lost% %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "heal_per",
      "id": "msg_heal_per %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "heal_per-allies",
      "id": "eng_game_nick_and_value_heal_per-allies %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "heal_per-enemies",
      "id": "eng_game_nick_and_value_heal_per-enemies %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "heal_target",
      "id": "msg_heal_target %target% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "healall",
      "id": "msg_healall %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "healall_per",
      "id": "msg_healall_per %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "hp_per-allies",
      "id": "eng_game_nick_and_value_hp_per-allies %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "hp_per-enemies",
      "id": "eng_game_nick_and_value_hp_per-enemies %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "injure",
      "id": "msg_injure %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "insult",
      "id": "msg_insult %name% %name2% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "legbon_holytouch_heal",
      "id": "msg_legbon_holytouch_heal %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "legbon_lastheal",
      "id": "msg_legbon_lastheal %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "light",
      "id": "msg_light %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "lightshield",
      "id": "msg_lightshield %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "lightshield2",
      "id": "msg_lightshield2 %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "loot",
      "id": "msg_loot %name% %g1% %m1%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "loser",
      "id": "loser_is %name% %posfix%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "lowheal_per-enemies",
      "id": "msg_lowheal_per-enemies val",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "mana",
      "id": "msg_receivemana %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "managain",
      "id": "msg_managain %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "manatransfer",
      "id": "msg_manatransfer %name% %val% %name2%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "mlightshiled",
      "id": "msg_mlightshiled %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "npc_heal",
      "id": "msg_heal_target %target% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "of-woundstart",
      "id": "msg_of-woundstart",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "physical",
      "id": "msg_physical %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "poison",
      "id": "msg_poison %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "poison_lowdmg_per-enemies",
      "id": "msg_poison_lowdmg_per-enemies %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "poisonspread",
      "id": "msg_poisonspread",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "poisonspread_failkey",
      "id": "msg_poisonspread_failkey",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "prepare",
      "id": "msg_prepare %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "removedot",
      "id": "skill_removedot",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "removedot-allies",
      "id": "skill_removedot-allies",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "removeslow-allies",
      "id": "msg_removeslow-allies",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "removestun",
      "id": "skill_removestun",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "removestun-allies",
      "id": "msg_removestun-allies",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "resfire_per",
      "id": "msg_resfire_per %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "resfrost_per",
      "id": "msg_resfrost_per %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "reslight_per",
      "id": "msg_reslight_per %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "reusearrows",
      "id": "msg_reusearrows_one",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "rime_per",
      "id": "msg_rime_per %val% %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "shout",
      "id": "msg_shout %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "skillId",
      "id": null,
      "maZdanie": false,
      "milczy": true
    },
    {
      "klucz": "soullink",
      "id": "msg_soullink %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "spell-taken_dmg",
      "id": "eng_game_nick_and_opponent_spell-taken_dmg %name% %target%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "stealmana",
      "id": "msg_stealmana %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "step",
      "id": "msg_step %name% %g1%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "stinkbomb",
      "id": "msg_stinkbomb %name% %name2%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "stinkbomb_crit",
      "id": "eng_game_only_nick_stinkbomb_crit %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "stinkbomb_pierce",
      "id": "eng_game_only_nick_stinkbomb_pierce %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "storm",
      "id": "msg_storm %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "sunreduction",
      "id": "msg_sunreduction %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "sunshield",
      "id": "msg_sunshield %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "sunshield_per",
      "id": "msg_sunshield %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "surpass_bonus_total",
      "id": "surpass_bonus_total %val% %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "tcustom",
      "id": "msg_tcustom_target %target% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "thunder",
      "id": "msg_thunder %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "trickyknife",
      "id": "msg_trickyknife %name% %target%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "tspell",
      "id": "msg_tspell %name%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "txt",
      "id": null,
      "maZdanie": false,
      "milczy": false
    },
    {
      "klucz": "vamp",
      "id": "msg_vamp %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "vamp_time",
      "id": "eng_game_only_val_vamp_time %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "winner",
      "id": "battle_no_winner",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "wound",
      "id": "msg_wound %name% %val%",
      "maZdanie": true,
      "milczy": false
    },
    {
      "klucz": "woundextend",
      "id": "msg_woundextend %name% %target%",
      "maZdanie": true,
      "milczy": false
    }
  ],
  "ramy": {
    "msg_dmgdone %name1% %hpp% %val%": true,
    "msg_dmgtaken %name1% %hpp% %val%": true,
    "winner_is %name% %posfix%": true,
    "winner_team_is %name% %posfix%": true,
    "loser_is %name% %posfix%": true,
    "loser_team_is %name% %posfix%": true,
    "battle_no_winner": true,
    "msg_poison %name% %val0% %val1%": true,
    "msg_wound_multi %name% %val0% %val1%": true,
    "msg_injure %name% %val0% %val1%": true,
    "msg_anguish %name% %hpp% %val0% %val1%": true,
    "part_gained": true,
    "part_lost": true
  }
};
