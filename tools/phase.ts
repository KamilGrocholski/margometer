/**
 * Faza projektu — jedno miejsce, z którego bierze ją wszystko inne.
 *
 * Dlaczego osobny moduł na jedno słowo: „alpha" ma być widoczna w czterech
 * miejscach (nazwa w Tampermonkey, README, CHANGELOG, opis wydania), a to jest
 * dokładnie ten kształt, na którym to repo już się przejechało — `SOLID §11`
 * i `AUDYT §G` opisują status żyjący w dwóch miejscach naraz i rozjeżdżający
 * się, bo poprawia się to, co się czyta. Cztery kopie słowa „alpha" skończyłyby
 * tak samo: dodatek zostałby alfą jeszcze długo po tym, jak README przestałoby
 * nią być.
 *
 * Wyjście z fazy wczesnej ma być JEDNĄ zmianą tutaj plus poprawką dwóch tekstów,
 * a test w `tests/phase.test.ts` pilnuje, że te teksty faktycznie się zgadzają.
 *
 * SemVer i tak niesie to samo w numerze („Major version zero (0.y.z) is for
 * initial development. Anything MAY change at any time."), ale numer czyta
 * garstka ludzi, a nazwę skryptu widzi każdy przy instalacji.
 */

/** Słowo fazy. `null` znaczy „wydanie zwykłe" — wtedy znikają wszystkie oznaczenia. */
export const PHASE: string | null = "alpha";

/** Dopisek do `@name`. Pusty, gdy faza się skończyła. */
export const PHASE_LABEL = PHASE === null ? "" : ` (${PHASE})`;

/**
 * Akapit doklejany NAD treścią wydania z CHANGELOG-a.
 *
 * Stoi w wydaniu, a nie tylko w README, bo do wydania trafia się prosto
 * z linku — z pominięciem strony repozytorium i wszystkiego, co na niej stoi.
 */
export const PHASE_NOTE =
  PHASE === null
    ? ""
    : [
        `> ⚠️ **Wczesna faza (${PHASE}).** Dodatek jest używalny, ale numery \`0.x\``,
        "> nie obiecują zgodności: układ panelu, nazwy i zapisane ustawienia mogą",
        "> się zmienić między wydaniami. Statystyki liczą się z okna walki, więc",
        "> zmiana formatu logu po stronie gry potrafi je popsuć do czasu poprawki.",
        "> Zgłoszenia i logi z takich walk są najbardziej przydatną rzeczą, jaką",
        "> można teraz przysłać.",
      ].join("\n");
