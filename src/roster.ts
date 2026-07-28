/**
 * Skład walki odczytany z gry, nie z logu.
 *
 * Log niesie same nazwy, więc dwie postacie o tej samej nazwie są w nim
 * nierozróżnialne. Gra trzyma je jako osobne obiekty z własnym `id` — i to
 * jedyne, po co tu sięgamy. Obrażenia nadal liczymy z logu: jego format nie
 * drgnął przez kilkanaście zrzutów, a wewnętrzne struktury klienta takiej
 * gwarancji nie mają.
 */
export type RosterEntry = {
  id: number;
  name: string;
  /** Nasza numeracja: 0 to drużyna gracza. NIE jest to `team` z gry. */
  side: number;
  /**
   * Kod profesji (`prof` z wojownika gry) — ten sam alfabet co w logu.
   * Opcjonalny, bo skład bywa też podstawiany w testach, a przy patchu gry pole
   * może zniknąć: wtedy profesja zostaje ta z linii otwierającej.
   */
  prof?: string;
  /** Poziom (`lvl` z wojownika gry). Opcjonalny z tego samego powodu co `prof`. */
  lvl?: number;
};

export type RosterSource = {
  /** null, gdy walka nie trwa albo gra nie wystawia stanu. */
  current(): RosterEntry[] | null;
};

/** Kształt, którego potrzebujemy od gry. Reszta pól wojownika nas nie obchodzi. */
type Warrior = {
  id?: unknown;
  originalId?: unknown;
  name?: unknown;
  team?: unknown;
  /** Kod profesji, np. `"h"`. Ten sam alfabet, którym pisze log. */
  prof?: unknown;
  lvl?: unknown;
};

function warriorsOf(battle: Record<string, unknown>): Warrior[] {
  // Gra trzyma wojowników w `warriors`; `warriorsList` obok bywa tablicą
  // pustych slotów, więc kolejność sprawdzania ma znaczenie.
  for (const field of ["warriors", "warriorsList"]) {
    const value = battle[field];
    if (!value || typeof value !== "object") continue;
    const list = Object.values(value as Record<string, Warrior>).filter(
      (w) => w && typeof w === "object" && typeof w.name === "string" && w.name !== "",
    );
    if (list.length > 0) return list;
  }
  return [];
}

/**
 * Czyta skład z `Engine.battle`.
 *
 * Każdy odczyt jest osobny i defensywny: gra potrafi podmienić albo wyzerować
 * `battle` między turami, a przy patchu te pola mogą zniknąć zupełnie. Brak
 * danych zwracamy jako null i wtedy reszta programu leci ze składu z logu.
 */
export class EngineRosterSource implements RosterSource {
  constructor(private readonly window: Record<string, any> = globalThis as any) {}

  current(): RosterEntry[] | null {
    let battle: Record<string, unknown> | undefined;
    try {
      const engine = this.window.Engine ?? this.window.getEngine?.();
      battle = engine?.battle;
    } catch {
      // Dostęp do wnętrzności gry może rzucić przy zmianie kontekstu strony.
      return null;
    }
    if (!battle || typeof battle !== "object") return null;

    const warriors = warriorsOf(battle);
    if (warriors.length === 0) return null;

    // Numeracja drużyn w grze to nie nasza: u nas strona 0 to drużyna gracza,
    // a gra podaje jej numer w `myteam`. Bez tego pola nie zgadujemy stron —
    // zostawiamy je logowi, który pisze z perspektywy gracza.
    const myteam = battle.myteam;
    if (typeof myteam !== "number") return null;

    const entries: RosterEntry[] = [];
    for (const warrior of warriors) {
      const id = typeof warrior.id === "number" ? warrior.id : warrior.originalId;
      if (typeof id !== "number" || typeof warrior.name !== "string") continue;
      if (typeof warrior.team !== "number") continue;
      entries.push({
        id,
        name: warrior.name,
        side: warrior.team === myteam ? 0 : 1,
        // Profesji ani poziomu nie wymuszamy: brak pola nie unieważnia wpisu,
        // bo jedno i drugie niesie też linia otwierająca.
        ...(typeof warrior.prof === "string" && warrior.prof !== "" ? { prof: warrior.prof } : {}),
        ...(typeof warrior.lvl === "number" ? { lvl: warrior.lvl } : {}),
      });
    }

    return entries.length > 0 ? entries : null;
  }
}

/** Źródło ze stałym składem — do testów i podglądu. */
export class StaticRosterSource implements RosterSource {
  constructor(private readonly entries: RosterEntry[] | null) {}

  current(): RosterEntry[] | null {
    return this.entries;
  }
}
