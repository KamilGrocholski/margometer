/**
 * Drugi podgląd: 20 postaci, żeby zobaczyć, jak lista trzyma się przy pełnym
 * składzie — długie nicki, dwucyfrowe miejsca, wysoki panel.
 *
 * Log jest SYNTETYCZNY, w odróżnieniu od fixture'ów. Do testów by się nie
 * nadawał (nie dowodzi niczego o prawdziwym formacie), ale do oglądania układu
 * wystarczy: kształty linii przepisane z prawdziwych walk.
 *
 * Dane są celowo ROZSTRZELONE. Podgląd ma pokazywać, czy układ znosi skrajności,
 * więc skład rozciąga się od głównego damagera po postać, która przez całą walkę
 * traci tury, a obok obrażeń lecą krytyki, uniki, bloki, leczenie, trucizna
 * i śmierci. Przy równych liczbach wszystkie paski wyglądały tak samo i nie było
 * czego oceniać.
 */

type Profile = {
  name: string;
  level: number;
  /** Kod profesji z logu — patrz PROFESSIONS w src/types.ts. */
  profession: string;
  /** Średnia siła pojedynczej liczby obrażeń. Rozpiętość jest tu sednem. */
  power: number;
  /** Punkty życia. Decyduje, jak nisko zejdzie pasek i kto polegnie. */
  hp: number;
  /** Udział krytyków, 0..1. */
  crit: number;
  /** Szansa, że TA postać uniknie wymierzonego w nią ciosu, 0..1. */
  dodge: number;
  /** Druga liczba w ciosie: broń pomocnicza (tancerz) albo drugi żywioł (mag). */
  secondary: boolean;
  /** Ile obrażeń potrafi zablokować, 0 = nie blokuje. */
  block: number;
  /** Leczenie rzucane co turę na najbardziej poobijanego sojusznika. */
  heal: number;
  /** Trucizna nakładana na cel — tyka co turę do końca walki. */
  poison: number;
  /** Udział tur straconych, 0..1. */
  stun: number;
  abilities: string[];
  procs: string[];
};

/**
 * Ile OSOBNYCH bloków ciosu wypuszcza umiejętność. Domyślnie jeden.
 *
 * To cecha umiejętności, nie postaci. Wcześniej stał tu licznik przy profilu
 * (`strikes`), przez co tancerz wypuszczał trzy bloki na każdą akcję i w
 * podglądzie „Rozpraszający atak” miał 3 użycia przy 9 ciosach. W prawdziwych
 * logach ta umiejętność ma dokładnie 1,00 ciosu na użycie.
 *
 * Uwaga na dwie różne rzeczy, które łatwo pomylić: walka dwiema broniami to
 * `secondary` — JEDEN blok niosący dwie liczby (`+1041  +595`). Wielotrafienie
 * to kilka osobnych bloków pod jedną zapowiedzią.
 *
 * Lista jest krótka celowo — wpisane są wyłącznie umiejętności, dla których
 * wielotrafienie widać w korpusie fixture'ów (`Podwójny strzał` 1,75 ciosu na
 * użycie, bo cel czasem pada po pierwszej strzale; `Podwójne trafienie` 2,00).
 * Reszta nazw brzmi wielotrafieniowo, ale dowodu na to nie ma.
 */
const MULTI_STRIKE: Record<string, number> = {
  "Podwójny strzał": 2,
  "Podwójne trafienie": 2,
};

/**
 * Dwadzieścia sylwetek zamiast jednej formuły. Formuła dawała dwadzieścia
 * wariantów tej samej postaci; tu każdy wiersz listy ma inny powód, żeby
 * wyglądać inaczej — inny wynik, inny kształt rozbicia w dymku.
 */
const PROFILES: Profile[] = [
  // Strona 0 — drużyna gracza.
  { name: "Tancogniew Kazrek", level: 168, profession: "b", power: 1180, hp: 9400, crit: 0.45, dodge: 0.05, secondary: true, block: 0, heal: 0, poison: 0, stun: 0, abilities: ["Błyskawiczny cios", "Rozpraszający atak", "Taniec ostrzy"], procs: ["Klątwa", "Niszczenie pancerza"] },
  { name: "Magister Długonogi", level: 165, profession: "m", power: 860, hp: 6200, crit: 0.3, dodge: 0.04, secondary: true, block: 0, heal: 0, poison: 0, stun: 0, abilities: ["Lodowy pocisk", "Fuzja żywiołów"], procs: ["Spowolnienie"] },
  { name: "Łowcosław z Krzywego Rogu", level: 159, profession: "h", power: 540, hp: 7100, crit: 0.22, dodge: 0.1, secondary: false, block: 0, heal: 0, poison: 190, stun: 0, abilities: ["Zatruta strzała", "Podwójny strzał"], procs: ["Zatrucie"] },
  { name: "Wieczornica Nocna", level: 154, profession: "p", power: 260, hp: 12800, crit: 0.12, dodge: 0.06, secondary: false, block: 340, heal: 520, poison: 0, stun: 0, abilities: ["Uderzenie tarczą", "Modlitwa"], procs: [] },
  { name: "Odyniec Wielki", level: 151, profession: "w", power: 430, hp: 15600, crit: 0.18, dodge: 0.03, secondary: false, block: 210, heal: 0, poison: 0, stun: 0, abilities: ["Potężny cios"], procs: ["Ogłuszenie"] },
  { name: "Tropiciel Cichy", level: 148, profession: "t", power: 380, hp: 6400, crit: 0.25, dodge: 0.28, secondary: true, block: 0, heal: 0, poison: 0, stun: 0, abilities: ["Porażająca strzała"], procs: ["Szybka strzała"] },
  { name: "Bulu psk", level: 132, profession: "b", power: 210, hp: 5200, crit: 0.15, dodge: 0.12, secondary: true, block: 0, heal: 0, poison: 0, stun: 0, abilities: ["Podwójne trafienie"], procs: [] },
  { name: "Nuna Mała", level: 121, profession: "m", power: 150, hp: 3900, crit: 0.08, dodge: 0.05, secondary: false, block: 0, heal: 180, poison: 0, stun: 0.15, abilities: ["Lodowy pocisk"], procs: [] },
  { name: "Furu", level: 98, profession: "w", power: 90, hp: 4300, crit: 0.05, dodge: 0.04, secondary: false, block: 0, heal: 0, poison: 0, stun: 0.3, abilities: [], procs: [] },
  { name: "Zulu Cichy", level: 74, profession: "t", power: 45, hp: 2600, crit: 0.0, dodge: 0.08, secondary: false, block: 0, heal: 0, poison: 0, stun: 0.55, abilities: [], procs: [] },
  // Strona 1 — przeciwnicy.
  { name: "Zandan Nocny", level: 170, profession: "w", power: 990, hp: 18200, crit: 0.35, dodge: 0.06, secondary: false, block: 460, heal: 0, poison: 0, stun: 0, abilities: ["Cios przez pancerz", "Wir ostrzy"], procs: ["Krwawienie", "Niszczenie pancerza"] },
  { name: "Mushita Gula", level: 166, profession: "h", power: 720, hp: 7800, crit: 0.28, dodge: 0.15, secondary: false, block: 0, heal: 0, poison: 310, stun: 0, abilities: ["Zatruta strzała", "Grad strzał"], procs: ["Zatrucie"] },
  { name: "Foverek Mulu", level: 162, profession: "m", power: 610, hp: 5900, crit: 0.4, dodge: 0.02, secondary: true, block: 0, heal: 0, poison: 0, stun: 0, abilities: ["Kula ognia", "Porażenie"], procs: ["Podpalenie"] },
  { name: "Szaman z Krzywego Rogu", level: 157, profession: "p", power: 190, hp: 11400, crit: 0.1, dodge: 0.05, secondary: false, block: 280, heal: 940, poison: 0, stun: 0, abilities: ["Modlitwa", "Ostatni ratunek"], procs: [] },
  // Nazwy są UNIKALNE. Duplikaty ("Locha", "Locha") uruchomiłyby rozdzielanie
  // instancji po HP, a ten podgląd sprawdza układ listy, nie tę heurystykę.
  { name: "Gnoll łucznik", level: 143, profession: "t", power: 330, hp: 4800, crit: 0.2, dodge: 0.22, secondary: false, block: 0, heal: 0, poison: 0, stun: 0, abilities: ["Podwójny strzał"], procs: [] },
  { name: "Gnoll oszczepnik", level: 143, profession: "t", power: 300, hp: 4800, crit: 0.2, dodge: 0.22, secondary: false, block: 0, heal: 0, poison: 0, stun: 0, abilities: ["Rzut oszczepem"], procs: [] },
  { name: "Locha Wielka", level: 138, profession: "w", power: 260, hp: 9200, crit: 0.14, dodge: 0.03, secondary: false, block: 120, heal: 0, poison: 0, stun: 0, abilities: [], procs: ["Ogłuszenie"] },
  { name: "Locha z Krzywego Rogu", level: 138, profession: "w", power: 240, hp: 9200, crit: 0.14, dodge: 0.03, secondary: false, block: 120, heal: 0, poison: 0, stun: 0, abilities: [], procs: [] },
  { name: "Kukła Treningowa", level: 110, profession: "w", power: 0, hp: 24000, crit: 0, dodge: 0, secondary: false, block: 0, heal: 0, poison: 0, stun: 1, abilities: [], procs: [] },
  { name: "Wojownik Kazrek", level: 105, profession: "b", power: 120, hp: 4100, crit: 0.06, dodge: 0.09, secondary: true, block: 0, heal: 0, poison: 0, stun: 0.2, abilities: [], procs: [] },
];

/** Deterministycznie, bez Math.random: ten sam build ma dawać ten sam podgląd. */
function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

type Actor = Profile & { side: number; label: string; life: number; poisoned: number };

export function syntheticFight(count: number): string {
  const random = rng(20260719);

  const actors: Actor[] = Array.from({ length: count }, (_, i) => {
    const profile = PROFILES[i % PROFILES.length]!;
    // Powtórki przy count > 20 muszą mieć własne nicki, inaczej podgląd
    // testowałby rozdzielanie instancji zamiast układu listy.
    const suffix = i >= PROFILES.length ? ` ${Math.floor(i / PROFILES.length) + 1}` : "";
    return {
      ...profile,
      name: profile.name + suffix,
      side: i < Math.ceil(count / 2) ? 0 : 1,
      label: profile.name + suffix,
      life: profile.hp,
      poisoned: 0,
    };
  });

  const alive = (a: Actor) => a.life > 0;
  /** Zawsze z procentem — bez niego parser nie rozpozna aktora w linii. */
  const pct = (a: Actor) => `${Math.max(0, (a.life / a.hp) * 100).toFixed(2)}%`;
  const roster = (side: number) =>
    actors
      .filter((a) => a.side === side)
      .map((a) => `${a.name} (${a.level}${a.profession})`)
      .join(", ");

  const lines: string[] = [
    `[b]Rozpoczęła się walka pomiędzy ${roster(0)} a ${roster(1)}[/b]`,
  ];

  const hurt = (actor: Actor, amount: number) => {
    actor.life = Math.max(0, actor.life - amount);
  };

  for (let turn = 0; turn < 8; turn++) {
    for (const actor of actors) {
      if (!alive(actor)) continue;

      if (actor.stun > 0 && random() < actor.stun) {
        lines.push(`${actor.name} - utrata tury`, "");
        continue;
      }

      // Trucizna tyka na początku tury zatrutego — tak jak w prawdziwym logu.
      if (actor.poisoned > 0) {
        const tick = Math.round(actor.poisoned * (0.9 + random() * 0.2));
        hurt(actor, tick);
        lines.push(`[b]  ${actor.name}(${pct(actor)}): ${tick} (osłabione o 24%) obrażeń od trucizny.[/b]`);
        if (!alive(actor)) {
          lines.push(`Poległ ${actor.name}`, "");
          continue;
        }
      }

      if (actor.heal > 0) {
        const wounded = actors
          .filter((a) => a.side === actor.side && alive(a) && a.life < a.hp)
          .sort((a, b) => a.life / a.hp - b.life / b.hp)[0];
        if (wounded) {
          const amount = Math.round(actor.heal * (0.8 + random() * 0.4));
          wounded.life = Math.min(wounded.hp, wounded.life + amount);
          // Dwa szyki z prawdziwego logu: goły "Przywrócono" bez źródła leci
          // pod "Regeneracja", nazwany rozbija leczenie w dymku na umiejętności.
          lines.push(
            random() < 0.5
              ? `[b]  Przywrócono ${amount} punktów życia ${wounded.name}(${pct(wounded)})[/b]`
              : `[b]  ${wounded.name}(${pct(wounded)}): Modlitwa, zregenerowano ${amount} punktów życia.[/b]`,
            "",
          );
        }
      }

      if (actor.power === 0) continue;

      const foes = actors.filter((a) => a.side !== actor.side && alive(a));
      if (foes.length === 0) continue;
      const target = foes[Math.floor(random() * foes.length)]!;

      const ability = actor.abilities.length > 0 && random() < 0.6
        ? actor.abilities[Math.floor(random() * actor.abilities.length)]!
        : null;
      if (ability) lines.push(`${actor.name} wykonuje ${ability}.`, "");

      // Zwykły atak to zawsze jeden blok; kilka bloków dają tylko umiejętności
      // z `MULTI_STRIKE`. Pętla i tak urywa się na śmierci celu, więc użycie
      // wielotrafieniowe potrafi skończyć się jednym ciosem — tak jak w grze.
      const strikes = ability ? (MULTI_STRIKE[ability] ?? 1) : 1;
      for (let strike = 0; strike < strikes; strike++) {
        if (!alive(target)) break;

        const crit = random() < actor.crit;
        const dodged = random() < target.dodge;
        const numbers = actor.secondary ? 2 : 1;

        const raws: number[] = [];
        const applied: number[] = [];
        for (let n = 0; n < numbers; n++) {
          // Druga liczba to broń pomocnicza — słabsza, i to ma być widać
          // w rozbiciu obrażeń.
          const scale = (n === 0 ? 1 : 0.55) * (crit ? 1.8 : 1) * (0.75 + random() * 0.5);
          const raw = Math.round(actor.power * scale);
          // Unik częściowy: główna broń wchodzi za 0, pomocnicza mimo to trafia.
          const missed = dodged && n === 0;
          const reduction = 0.55 + random() * 0.25;
          raws.push(raw);
          applied.push(missed ? 0 : Math.round(raw * reduction));
        }

        const modifiers: string[] = [];
        if (crit) modifiers.push("  +Cios krytyczny");
        if (crit && actor.secondary && random() < 0.4) modifiers.push("   +Cios krytyczny broni pomocniczej");
        if (dodged) modifiers.push("  -Unik");
        for (const proc of actor.procs) {
          if (random() < 0.35) modifiers.push(`+${proc}`);
        }
        if (target.block > 0 && random() < 0.4) {
          const blocked = Math.round(target.block * (0.6 + random() * 0.8));
          modifiers.push(`  -Zablokowanie ${blocked} obrażeń`);
        }

        const total = applied.reduce((sum, n) => sum + n, 0);
        hurt(target, total);

        lines.push(
          `${actor.name}(${pct(actor)}) uderzył z siłą  ${raws.map((n) => `+${n}`).join("  ")}`,
          ...modifiers,
          `${target.name}(${pct(target)}) otrzymał  ${applied.map((n) => `-${n}`).join("  ")}  obrażeń`,
          "",
        );

        if (actor.poison > 0 && target.poisoned === 0 && alive(target)) {
          target.poisoned = actor.poison;
        }
        if (!alive(target)) lines.push(`Poległ ${target.name}`, "");
      }
    }
  }

  const winners = actors.filter((a) => a.side === 0 && alive(a)).map((a) => a.name);
  lines.push(
    `[b]Zwyciężyła drużyna ${winners.join(", ")}[/b]`,
    "[b]Zwycięzca zdobył łącznie 184320 punktów doświadczenia[/b]",
    "[b]Dodatkowe punkty doświadczenia z przedmiotów +21504.[/b]",
  );

  return lines.join("\n");
}
