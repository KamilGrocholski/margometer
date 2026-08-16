/**
 * What the panel calls each name of the game's own.
 *
 * **Two answers per token, and the first one is not ours.** The client ships a
 * dictionary keyed by identifiers like `msg_+crit`, and composes its own battle
 * log out of it; the add-on runs on that page and can ask. So a token is named
 * the way the player's own client names it — in the player's own language —
 * and our phrase is what answers when the game has no name for it or is not
 * there to be asked.
 *
 * ⚠️ **The identifier is what lives here, never the sentence it resolves to.**
 * Those sentences are the operator's writing (NOTICE.md); an identifier is a
 * functional name of the same kind as a protocol key. This tree removed a table
 * of the game's own sentences once already and is not growing another.
 *
 * ⚠️ **An id is admitted only where the dictionary holds a *name*.** Most of
 * that dictionary is sentences with `%val%` holes in them — `-Zablokowanie
 * %val% obrażeń`, `+Niszczenie pancerza o %val%` — and a label is not a
 * sentence with the figure cut out of it: what comes back is a dangling
 * preposition. Those tokens keep `id: null` and a short noun of ours, written
 * from what the client's sentence says rather than from the token's spelling.
 * `src/game/game-dictionary.ts` enforces the same rule from the other side, so
 * a sentence appearing under an id we trusted falls back instead of drawing.
 *
 * Every id below was read on production build `1785244275300`.
 */

/** How a token is named, in the two places a name can come from. */
export type TokenName = {
  /**
   * The client's identifier for this name, or null where the dictionary holds
   * no name for it — only a sentence, or only a bare figure.
   */
  id: string | null;
  /** Ours. What the player reads when the client cannot answer. */
  fallback: string;
};

/**
 * A name out of the running client, or null.
 *
 * Declared here rather than imported: §9.1 names no direction from `ui` to
 * `game`, so the panel says what it needs and the entry point supplies it.
 */
export type TranslateLabel = (id: string) => string | null;

/**
 * The client keeps these in its `eq_prof` category, as capitalised headings for
 * a character sheet. A row in a ranking is not a heading, so these stay ours.
 */
export const PROFESSION_NAMES: Record<string, TokenName> = {
  w: { id: null, fallback: "wojownik" },
  p: { id: null, fallback: "paladyn" },
  t: { id: null, fallback: "tropiciel" },
  h: { id: null, fallback: "łowca" },
  m: { id: null, fallback: "mag" },
  b: { id: null, fallback: "tancerz ostrzy" },
};

/**
 * The letter in a damage key, in the player's words.
 *
 * ⚠️ **Not a taxonomy of elements, though it reads like one.** The game answers
 * three different questions with this one letter and picks whichever it has:
 * element (`f`, `l`, `c`), weapon or slot (none, `d`, `o`), reach (`g`), and
 * `a` for damage nothing reduces. So a figure keyed `dmgg` has no element we
 * know — the label says what the game said, not what we wish it had.
 *
 * All ours, and not for want of asking: the client names no element anywhere.
 * It composes a damage line out of the figure and the recipient and spends the
 * kind on a CSS class. `thirdatt` is ours for a second reason — its own entry
 * resolves to `+%val%`, a hole and no name — so its name comes from the help,
 * which calls it the Third Blow under the engine name `of-thirdatt` (article
 * view,372, read 2026-08-09).
 */
export const ELEMENT_NAMES: Record<string, TokenName> = {
  dmg: { id: null, fallback: "fizyczne" },
  dmgd: { id: null, fallback: "dystansowe" },
  dmgo: { id: null, fallback: "broń pomocnicza" },
  dmgf: { id: null, fallback: "ogień" },
  dmgc: { id: null, fallback: "zimno" },
  dmgl: { id: null, fallback: "błyskawica" },
  dmga: { id: null, fallback: "nieuchronne" },
  dmgg: { id: null, fallback: "globalne" },
  thirdatt: { id: null, fallback: "trzeci cios" },
};

/**
 * Effects that fire with a blow. The protocol states the token and stops, and
 * this is the one family the client does name — every entry here is a name in
 * the dictionary rather than a sentence, which is why every entry has an id.
 */
export const EFFECT_NAMES: Record<string, TokenName> = {
  crit: { id: "msg_+crit", fallback: "cios krytyczny" },
  of_crit: { id: "msg_+of_crit", fallback: "cios krytyczny bronią pomocniczą" },
  legbon_verycrit: { id: "msg_+legbon_verycrit", fallback: "cios bardzo krytyczny" },
  evade: { id: "msg_-evade", fallback: "unik" },
  fastarrow: { id: "msg_+fastarrow", fallback: "szybka strzała" },
  contra: { id: "msg_-contra", fallback: "kontratak" },
  pierce: { id: "msg_+pierce", fallback: "przebicie" },
  pierceb: { id: "msg_-pierceb", fallback: "zablokowane przebicie" },
  stun: { id: "msg_+stun", fallback: "ogłuszenie" },
  freeze: { id: "msg_+freeze", fallback: "zamrożenie" },
  legbon_curse: { id: "msg_+legbon_curse", fallback: "klątwa" },
  legbon_cleanse: { id: "msg_-legbon_cleanse", fallback: "płomienne oczyszczenie" },
  legbon_glare: { id: "msg_-legbon_glare", fallback: "oślepienie" },
  // The client renders this one through a sentence named for `dispel` rather
  // than for the key, which `docs/protocol-keys.md` already records. What that
  // sentence says is not what our phrase used to: a special blow is
  // interrupted, and no spell is dispelled.
  "superspell-dispel": { id: "msg_+dispel", fallback: "przerwany cios specjalny" },
  acdmg_destroyed: { id: "msg_+acdmg_destroyed", fallback: "pancerz zniszczony do końca" },
  tenacity: { id: "msg_-tenacity", fallback: "wytrwałość" },
};

/** All sentences in the dictionary — `-Absorpcja %val% obrażeń fizycznych`. */
export const DEFENCE_NAMES: Record<string, TokenName> = {
  absorb: { id: null, fallback: "pochłonięte" },
  absorbm: { id: null, fallback: "pochłonięte magicznie" },
  blok: { id: null, fallback: "zablokowane" },
};

/**
 * Sentences too. Worth naming what changed anyway: the `_per` pair is announced
 * as destroying **absorption**, not the "osłona" this table used to invent for
 * it, and `acdmg` is the figure whose floor `acdmg_destroyed` announces — two
 * quantities that used to share one label.
 */
export const DESTRUCTION_NAMES: Record<string, TokenName> = {
  acdmg: { id: null, fallback: "niszczenie pancerza" },
  resdmg: { id: null, fallback: "niszczenie odporności magicznych" },
  abdest_per: { id: null, fallback: "zniszczona absorpcja" },
  abmdest_per: { id: null, fallback: "zniszczona absorpcja magiczna" },
};

/** Where health went when no blow moved it. */
export const HEALTH_SOURCE_NAMES: Record<string, TokenName> = {
  poison: { id: null, fallback: "trucizna" },
  // Not "ogień", which is `dmgf`'s word above for the damage element: this is the
  // burn ticking afterwards, and two quantities under one label is a wrong number
  // that looks right. The client's own entry for it is a sentence with two holes,
  // so there is no name to ask it for.
  fire: { id: null, fallback: "podpalenie" },
  // The old phrase was "rana", which is the game's word for `wound` — a
  // different key, and one this meter also reads.
  injure: { id: null, fallback: "zranienie" },
  heal: { id: null, fallback: "leczenie" },
  heal_target: { id: null, fallback: "leczenie na wskazanego" },
  // Its own id resolves to a sentence; the proc that causes it resolves to the
  // effect's name, and the name is what a row wants. The register ties the two
  // keys already, so this is a reading rather than a guess.
  legbon_holytouch_heal: { id: "msg_+legbon_holytouch", fallback: "dotyk anioła" },
  legbon_lastheal: { id: null, fallback: "ostatni ratunek" },
};

/**
 * A name for a token: the client's, then ours, then the token itself.
 *
 * The last rung is deliberate and is the whole reason this is one function: the
 * game can send something we have never named, and a row that vanished or read
 * "nieznane" would hide a real figure behind our own ignorance. What the player
 * sees then is ugly and true.
 */
export function getPhrase(
  names: Record<string, TokenName>,
  token: string,
  translate: TranslateLabel | null,
): string {
  const name = names[token];
  if (name === undefined) return token;
  const stated = name.id === null || translate === null ? null : translate(name.id);
  return stated ?? name.fallback;
}
