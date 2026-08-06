# Zrzuty ekranu do README

Tu wrzucamy obrazki, do których odwołuje się `README.md` w korzeniu repo.

## Nazewnictwo

`margometer_<widok>_<szczebel>.png` — małymi literami, bez polskich znaków,
podkreślnik zamiast spacji. Przykłady w użyciu:

| plik | co pokazuje |
|---|---|
| `margometer_zadane_postac.png` | zakładka **Zadane**, widok pojedynczej postaci |
| `margometer_otrzymane_postac.png` | zakładka **Otrzymane**, widok pojedynczej postaci |

## Pseudonimy innych graczy się ZAKRYWA

Oba pliki wyżej przeszły 2026‑08‑06 redakcję: pikselizacja blokiem 10 px plus
rozmycie, na pięciu obszarach naraz — pasek z nazwą walki (niesie dwa
pseudonimy przed `+8`) i kolumna nazw w rankingu. Zniknęło **dziesięć**
pseudonimów: tylu graczy wymienia `zadane`, a `otrzymane` pokazuje dziewięciu
z tych samych. Został `+8 vs Hildur Muza Śmierci`, bo boss jest NPC‑em, oraz
wiersze `od trucizny` i `od ognia`, bo o nich mówi tekst w `README.md`.

**Powód, i nie jest nim ostrożność.** Repozytorium jest publiczne, a
pseudonimy to dane pseudonimizowane osób, które nie miały jak się na to
zgodzić. Regulamin gry ([XIX.4](https://pomoc.margonem.pl/index/view,323))
osobno zawęża rozpowszechnianie opracowań elementów Gry do samego Serwisu
i **nie obejmuje** „innych stron internetowych". Szczegóły: [`NOTICE.md`](../../NOTICE.md).

**Przy następnym zrzucie łatwiej jest tego uniknąć niż naprawiać.** Zrób go
w walce solo albo z postaciami, których pseudonimy wolno pokazać. Jeśli nie da
się inaczej — zakryj przed wrzuceniem, a nie po. Współrzędne mierz linijką
pikselową nałożoną na obrazek, nie na oko: pierwsze podejście do tej redakcji
ucięło nick w połowie i zostawiło czytelne „…sztof", bo szacowałem je ze
skalowanego wycinka.

⚠️ Redakcja jest **nieodwracalna i zrobiona na miejscu**, więc w historii gita
oryginały zostają. To świadoma granica: przepisywanie historii publicznego
repozytorium kosztuje więcej, niż daje przy dziesięciu pseudonimach, które
i tak są jawne w grze. Gdyby ktoś tego zażądał — `git filter-repo` i wymuszony
push, świadomie, osobną decyzją.

## O czym pamiętać przy robieniu zrzutu

- **Pisz w README, z jakiej walki jest zrzut.** Liczby na obrazku znaczą co
  innego w starciu 1v1 niż w dziesiątce na bossa, a po roku nikt tego nie
  odtworzy z samego pliku.
- Zrzut ma obejmować **cały panel razem z nagłówkiem i stopką** — w stopce stoją
  przypisy o rzeczach, których log nie przypisuje nikomu (tykające obrażenia bez
  sprawcy, leczenie bez sprawcy). To część tego, co panel mówi.
- PNG, bez skalowania w dół — tekst w panelu jest mały i rozmywa się pierwszy.
