import { parse } from "./parser.ts";
import type { RosterEntry } from "./roster.ts";
import { aggregate, type BattleStats } from "./stats.ts";
import type {
  ActorStats,
  AttackerBreakdown,
  BattleEvent,
  DamageSource,
  LabelType,
  Participant,
  ProcCount,
} from "./types.ts";

/** Skleja rozbicia z kilku walk po etykiecie, sumując wartości. */
function mergeSources(into: DamageSource[], from: DamageSource[]): DamageSource[] {
  const merged = new Map(into.map((s) => [s.label, { ...s }]));
  for (const source of from) {
    const entry = merged.get(source.label);
    if (entry) {
      entry.amount += source.amount;
      entry.hits += source.hits;
    } else merged.set(source.label, { ...source });
  }
  return [...merged.values()].sort((a, b) => b.amount - a.amount);
}

function mergeProcs(into: ProcCount[], from: ProcCount[]): ProcCount[] {
  const merged = new Map(into.map((p) => [p.label, { ...p }]));
  for (const proc of from) {
    const entry = merged.get(proc.label);
    if (entry) entry.count += proc.count;
    else merged.set(proc.label, { ...proc });
  }
  return [...merged.values()].sort((a, b) => b.count - a.count);
}

/** Skleja dwuszczeblowe rozbicie przyjętych: najpierw napastnik, potem czym. */
function mergeAttackers(into: AttackerBreakdown[], from: AttackerBreakdown[]): AttackerBreakdown[] {
  const merged = new Map(into.map((a) => [a.label, { ...a, by: a.by.map((s) => ({ ...s })) }]));
  for (const attacker of from) {
    const entry = merged.get(attacker.label);
    if (entry) {
      entry.amount += attacker.amount;
      entry.hits += attacker.hits;
      entry.by = mergeSources(entry.by, attacker.by);
    } else merged.set(attacker.label, { ...attacker, by: attacker.by.map((s) => ({ ...s })) });
  }
  return [...merged.values()].sort((a, b) => b.amount - a.amount);
}

/** Kopia głęboka na tyle, żeby sumowanie sesji nie mutowało walk źródłowych. */
function copyActor(actor: ActorStats): ActorStats {
  return {
    ...actor,
    dealtBy: actor.dealtBy.map((s) => ({ ...s })),
    takenFrom: actor.takenFrom.map((s) => ({ ...s })),
    dealtByType: actor.dealtByType.map((s) => ({ ...s })),
    takenByType: actor.takenByType.map((s) => ({ ...s })),
    healedBy: actor.healedBy.map((s) => ({ ...s })),
    procs: actor.procs.map((p) => ({ ...p })),
    procsReceived: actor.procsReceived.map((p) => ({ ...p })),
    abilityUses: actor.abilityUses.map((p) => ({ ...p })),
    takenFromBy: actor.takenFromBy.map((a) => ({ ...a, by: a.by.map((s) => ({ ...s })) })),
    typeByLabel: actor.typeByLabel.map((t) => ({ ...t })),
  };
}

/**
 * Skleja przypisanie typu do etykiety. Pierwsza walka wygrywa: „Lodowy pocisk"
 * niesie zimno w każdej walce, a gdyby kiedyś przestał, sesja i tak nie ma jak
 * rozstrzygnąć, która wersja jest prawdziwa — a barwa paska ma być stabilna.
 */
function mergeTypes(into: LabelType[], from: LabelType[]): LabelType[] {
  const merged = new Map(into.map((t) => [t.label, { ...t }]));
  for (const entry of from) if (!merged.has(entry.label)) merged.set(entry.label, { ...entry });
  return [...merged.values()].sort((a, b) => a.label.localeCompare(b.label, "pl"));
}

/**
 * Podpis składu z linii otwierającej. Po nim poznajemy DWA różne fakty: że
 * kolejny odczyt bufora pokazuje tę samą walkę i że powtórzony nagłówek jest
 * powtórzeniem tej samej linii, a nie początkiem następnej walki.
 */
function participantsKey(participants: Participant[]): string {
  return participants
    .map((p) => `${p.name}|${p.level}${p.professionCode}|${p.side}`)
    .join("//");
}

/** Dzieli strumień zdarzeń na osobne walki po liniach rozpoczęcia. */
export function splitFights(events: BattleEvent[]): BattleEvent[][] {
  const fights: BattleEvent[][] = [];

  for (const event of events) {
    if (event.kind === "fight-start") {
      const previous = fights.at(-1);
      // Margonem potrafi zdublować linię rozpoczęcia — powtórzenie TEGO SAMEGO
      // składu nie zaczyna drugiej walki, bo poprzednia nie ma jeszcze treści.
      //
      // Ale nagłówek INNEGO składu to już druga walka, choćby pierwsza
      // skończyła się na samym nagłówku (ucieczka, przerwanie, bufor doczytany
      // na granicy). Wcześniej wystarczał sam fakt „poprzednia ma jedno
      // zdarzenie”, więc obie zlewały się w jedną — ze składem pierwszej.
      const only = previous?.length === 1 ? previous[0]! : null;
      const isDuplicate =
        only?.kind === "fight-start" &&
        participantsKey(only.participants) === participantsKey(event.participants);
      if (!isDuplicate) fights.push([]);
    }
    if (fights.length === 0) fights.push([]);
    fights.at(-1)!.push(event);
  }

  return fights;
}

function mergeStats(all: BattleStats[]): BattleStats {
  const actors = new Map<string, BattleStats["actors"][number]>();
  const ambiguousNames = new Set<string>();
  const unattributedDotDamage = { mine: 0, enemy: 0, loose: 0 };
  let unattributedHealing = 0;
  let unknownLines = 0;

  for (const stats of all) {
    for (const actor of stats.actors) {
      const merged = actors.get(actor.name);
      if (!merged) {
        actors.set(actor.name, copyActor(actor));
        continue;
      }
      merged.damageDealt += actor.damageDealt;
      merged.damageTaken += actor.damageTaken;
      merged.damageAbsorbed += actor.damageAbsorbed;
      merged.healingDone += actor.healingDone;
      merged.healingReceived += actor.healingReceived;
      merged.hits += actor.hits;
      merged.misses += actor.misses;
      merged.crits += actor.crits;
      merged.turns += actor.turns;
      merged.turnsLost += actor.turnsLost;
      merged.maxHit = Math.max(merged.maxHit, actor.maxHit);
      merged.dealtBy = mergeSources(merged.dealtBy, actor.dealtBy);
      merged.takenFrom = mergeSources(merged.takenFrom, actor.takenFrom);
      merged.dealtByType = mergeSources(merged.dealtByType, actor.dealtByType);
      merged.takenByType = mergeSources(merged.takenByType, actor.takenByType);
      merged.healedBy = mergeSources(merged.healedBy, actor.healedBy);
      merged.procs = mergeProcs(merged.procs, actor.procs);
      merged.procsReceived = mergeProcs(merged.procsReceived, actor.procsReceived);
      merged.abilityUses = mergeProcs(merged.abilityUses, actor.abilityUses);
      merged.takenFromBy = mergeAttackers(merged.takenFromBy, actor.takenFromBy);
      merged.typeByLabel = mergeTypes(merged.typeByLabel, actor.typeByLabel);
      // Profesja jest cechą postaci, nie walki — bierzemy pierwszą, którą
      // ktokolwiek podał. Wcześniejsza walka mogła nie mieć składu z gry.
      merged.professionCode ??= actor.professionCode;
      merged.level ??= actor.level;
      merged.unattributedDotTaken += actor.unattributedDotTaken;
    }
    for (const name of stats.ambiguousNames) ambiguousNames.add(name);
    unattributedDotDamage.mine += stats.unattributedDotDamage.mine;
    unattributedDotDamage.enemy += stats.unattributedDotDamage.enemy;
    unattributedDotDamage.loose += stats.unattributedDotDamage.loose;
    unattributedHealing += stats.unattributedHealing;
    unknownLines += stats.unknownLines;
  }

  return {
    actors: [...actors.values()].sort((a, b) => b.damageDealt - a.damageDealt),
    unattributedDotDamage,
    unattributedHealing,
    ambiguousNames: [...ambiguousNames],
    unknownLines,
    // Oś tur, zgony i macierz są własnością POJEDYNCZEJ walki. Sklejone przez
    // sesję nie znaczyłyby nic: tura 3 z jednej walki nie jest turą 3 z drugiej,
    // a ten sam przeciwnik ginie w każdej z osobna.
    timeline: [],
    deaths: [],
    matrix: [],
  };
}

/** Pusty komplet — punkt startowy overlaya i sesji bez walk. */
export const EMPTY_STATS: BattleStats = {
  actors: [],
  unattributedDotDamage: { mine: 0, enemy: 0, loose: 0 },
  unattributedHealing: 0,
  ambiguousNames: [],
  unknownLines: 0,
  timeline: [],
  deaths: [],
  matrix: [],
};

function signatureOf(events: BattleEvent[]): string {
  const start = events.find((e) => e.kind === "fight-start");
  if (!start) return "bez-rozpoczecia";
  return participantsKey(start.participants);
}

/**
 * Trzyma statystyki bieżącej walki i całej sesji.
 *
 * Przy każdej zmianie logu parsujemy CAŁY bufor od nowa, zamiast doklejać
 * przyrosty. Parsowanie kilkuset linii to ułamek milisekundy, a stan
 * przyrostowy byłby źródłem błędów podwójnego liczenia.
 */
/** Walka widoczna w buforze wraz z tym, po czym poznajemy ją przy kolejnym odczycie. */
type ActiveFight = {
  stats: BattleStats;
  events: number;
  signature: string;
  /** Czy w buforze widać jeszcze linię otwierającą tej walki. */
  hasStart: boolean;
};

/**
 * Czy `current` to ta sama walka co `previous`, tylko doczytana.
 *
 * Nowa walka ZAWSZE zaczyna się linią otwierającą. Jej brak znaczy więc, że
 * patrzymy na ogon walki, której nagłówek wyjechał już z bufora — czymś nowym
 * być nie może.
 */
function continues(previous: ActiveFight, current: ActiveFight): boolean {
  if (!current.hasStart) return true;
  if (current.signature !== previous.signature) return false;
  // Ten sam skład, ale MNIEJ zdarzeń: gra wyczyściła log i bijemy to samo
  // od nowa. Walka doczytana nigdy nie chudnie.
  return current.events >= previous.events;
}

export class Session {
  /** Walki widoczne w buforze, w kolejności, w jakiej w nim stoją. */
  private active: ActiveFight[] = [];
  private readonly archived: BattleStats[] = [];
  private currentStats: BattleStats = EMPTY_STATS;

  /**
   * `fromGame` to skład odczytany z gry dla TRWAJĄCEJ walki, więc stosujemy go
   * tylko do ostatniej walki w buforze. Wcześniejsze są już zamknięte i skład
   * z gry ich nie dotyczy — poszedłby na nie skład zupełnie innej walki.
   */
  update(text: string, fromGame?: RosterEntry[] | null): void {
    const fights = splitFights(parse(text)).filter((events) => events.length > 0);
    const next: ActiveFight[] = new Array(fights.length);

    // Walki dopasowujemy od KOŃCA bufora, bo log traci treść od góry, a dorasta
    // na dole. Wcześniej tożsamością był `${indeks}|${sygnatura}` — obie części
    // zmieniają się przy przycięciu bufora, więc ta sama walka trafiała do
    // archiwum pod starym kluczem i żyła dalej pod nowym. `total()` liczył ją
    // wtedy dwa razy.
    let oldIndex = this.active.length - 1;

    for (let i = fights.length - 1; i >= 0; i -= 1) {
      const events = fights[i]!;
      // Skład z gry dotyczy TRWAJĄCEJ walki, więc tylko ostatniej w buforze.
      const roster = i === fights.length - 1 ? fromGame : null;
      const fight: ActiveFight = {
        stats: aggregate(events, roster),
        events: events.length,
        signature: signatureOf(events),
        hasStart: events.some((event) => event.kind === "fight-start"),
      };

      const previous = oldIndex >= 0 ? this.active[oldIndex] : undefined;
      // Dopasowana walka jest tą samą co poprzednio — jej nowe statystyki
      // zastępują stare. Niedopasowana zostaje na miejscu i wpadnie do
      // archiwum niżej.
      if (previous && continues(previous, fight)) oldIndex -= 1;
      next[i] = fight;
    }

    // Cokolwiek zostało z przodu, wyjechało z bufora albo zostało zastąpione —
    // tamte walki są zakończone i ich statystyki zamykamy w archiwum.
    for (let k = 0; k <= oldIndex; k += 1) this.archived.push(this.active[k]!.stats);

    this.active = next;
    this.currentStats = next.at(-1)?.stats ?? EMPTY_STATS;
  }

  /** Statystyki ostatniej walki widocznej w logu. */
  current(): BattleStats {
    return this.currentStats;
  }

  /** Statystyki zsumowane ze wszystkich walk sesji. */
  total(): BattleStats {
    return mergeStats([...this.archived, ...this.active.map((fight) => fight.stats)]);
  }

  reset(): void {
    this.active = [];
    this.archived.length = 0;
    this.currentStats = EMPTY_STATS;
  }
}
