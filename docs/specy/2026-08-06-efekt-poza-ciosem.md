# Efekt może usiąść poza ciosem

Status: wdrożone · 2026-08-06 · `4039be7`

## Problem

Komunikat, w którym nie ma ani jednej liczby obrażeń, kończył się w dekoderze
wcześniej — i zabierał ze sobą całą zebraną listę `procy`. Aura, wzmocnienie
drużyny, osłona kompana: dekoder rozpoznawał klucz poprawnie, przypisywał mu
rolę z tabeli, składał `Proc` i **porzucał wynik**. Efekt nie trafiał ani do
„efektów w ciosach", ani do „otrzymanych", ani do `unknown`.

Zmierzone na `2026-08-06-tempest-grupa-vs-hildur` (603 komunikaty):

| | `lowca-vs-odyncze` | `grupa-vs-hildur` |
|---|---|---|
| komunikaty bez obrażeń niosące efekty | 1 | **91** |
| efektów ginących w całości | 1 | **247** |

Piętnaście kluczy; najczęstszy `+oth_dmg` (71×), dalej `-poison_lowdmg_per`
(47×), `combo-max` (31×), `mana` (15×).

⚠️ **Skala była nieznana przez dobę i to jest tu osobna lekcja.** `AUDYT‑98`
odraczał naprawę m.in. dlatego, że *„jedyna prawdziwa walka w repo nie ma ani
jednego takiego komunikatu"*. Zdanie przewrócił commit `412579d` — **ten sam,
który dołożył drugą prawdziwą walkę**. Materiał przyszedł, pomiaru nikt nie
powtórzył (`AUDYT‑102`).

⚠️ **Dlaczego nie zapaliło się nic.** Repo miało `unknownLines === 0`
i `unknownElements === []`, czyli pytało: *czy dekoder ROZUMIE każdy klucz?* —
i odpowiedź była twierdząca przez cały czas. Nikt nie pytał, **czy to, co
zrozumiał, gdziekolwiek WYCHODZI**. Rozpoznanie i doręczenie to dwa różne
pytania, a czujka `unknown` odpowiada tylko na pierwsze.

## Rozwiązanie

Nowy wariant kontraktu — `BattleEvent` z `kind: "effect"` — niosący strony,
listę `procs` i zapowiedzianą umiejętność, ale **bez trafień**.

Osobny wariant, a nie `attack` z pustym `hits`, bo cios bez ani jednej liczby
obrażeń nie jest ciosem: gra nie składa wtedy zdania „uderzył z siłą"
(`BattleMessages.js:1127`, warunek `attack != ''`).

Trzy decyzje, które kod pokazuje, a nie uzasadnia:

1. **`target` jest nullowalne.** Komunikat bez drugiej strony (`…;0;…`) w
   materiale JEST — `poison_lowdmg_per-enemies`. Odrzucenie go byłoby tą samą
   cichą stratą, którą runda naprawia.
2. **Samobuf liczy się raz.** Przy aurze na siebie obie strony to ta sama postać
   (44 z 91). Lustrzany wiersz pokazałby „Aura ochrony ×1" dwa razy w jednym
   dymku. Oba zdania są prawdziwe — wyzwoliła i dostała — ale rubryka „Efekty
   otrzymane" odpowiada na „co się na mnie sypie", co przy własnej aurze nie ma
   sensu. Decyzja właściciela repo.
3. **Gałąź nie woła `beginTurn`.** Aury przychodzą razem z `tspell`, więc
   `case "ability"` już otworzył turę (85 z 91). Drugie wywołanie zawyżałoby
   licznik — naprawiając jedną liczbę, popsulibyśmy inną.

**Druga połowa rozwiązania jest w etykietach i bez niej naprawa byłaby
regresją.** `etykieta()` podstawia wyłącznie `%val%`, a spora część
identyfikatorów żąda więcej (`msg_+oth_dmg %val% %name%`). Dopóki te klucze nie
docierały do panelu, nie było tego widać: **0 z 299** dzisiejszych etykiet ma
dziurę, ale po wpuszczeniu efektów spoza ciosu byłoby **147 z 546**. Zdanie
z niewypełnioną dziurą ustępuje więc KLUCZOWI.

**Dwa strażniki wyczerpania w `stats.ts`**, bo połknąłby nowy wariant dwa razy:
`namesIn` miało `default: return []` (postacie nie weszłyby do rozpoznawania
instancji — efekt siadłby na złej instancji przy zdublowanych nazwach, po cichu),
a główny `switch` nie miał niczego. To ta sama awaria co wyżej, piętro wyżej.

## Odrzucone warianty

**`attack` z pustym `hits`.** Nie wymagałby dotykania kontraktu — kuszące,
bo `procs` już tam są. Ale `stats.ts` policzyłby z tego trafienie, turę i wiersz
w rozbiciu, czyli panel pokazałby cios, którego gra nie opisała. Ma własną
asercję, bo sama obecność efektu tego nie łapie.

**Podstawianie `%name%` z pierwszej strony komunikatu — OBALONE MATERIAŁEM.**
Dałoby ładniejsze etykiety zamiast surowych kluczy. Kontrprzykłady:

```
+oth_dmg=8868,g,Gracz 10(70.85%)   | f1=Hildur Muza Śmierci   f2=Gracz 4
shout=Hildur Muza Śmierci          | f1=Gracz 4               f2=Hildur…
```

W pierwszym nick z wartości nie jest **ani `f1`, ani `f2`** — to trzecia postać
(`ROADMAP.md`, „osłona kompana"). W drugim `%name%` to sama WARTOŚĆ, nie strona.
Reguła podstawiania jest różna dla różnych kluczy, więc jedna wspólna skłamałaby
w 71 ze 147 przypadków — dokładnie to uogólnienie, które kosztowało `AUDYT‑93`
i `AUDYT‑94`. **Wariant do powrotu**, gdy ktoś przejdzie procedurę
z `MECHANIKA.md` klucz po kluczu; wtedy dziura zniknie u źródła.

**Osobna rubryka w dymku („Aury i efekty poza ciosem").** Rozróżniałaby efekt
z ciosu od aury. Odrzucone: dymek ma już pięć sekcji i `ROADMAP.md` notuje, że
jest bliżej sufitu (`UX.md §6` — bez trzeciego rzędu zakładek). Efekt to efekt;
to, czy towarzyszył ciosowi, jest szczegółem protokołu, nie pytaniem gracza.

**`unknown` dla komunikatu bez obu stron.** Pierwsza wersja tak robiła i zapaliła
`unknownLines` na mniejszym fixturze. Zła odpowiedź: `unknown` znaczy „nie
rozumiem klucza" i zapala graczowi ostrzeżenie o niepełnych statystykach, a tu
rozumiemy wszystko — tylko log nie mówi, czyj to efekt (`0;0;+exp=3973`).
Idzie do `info`. Przypisanie graczowi byłoby zgadywaniem: oczywistym, ale
`docs/DECYZJE.md` nie robi wyjątku dla oczywistych.

**`throw` w strażniku wyczerpania.** Pierwsza wersja rzucała. Odrzucone z tego
samego powodu, co przy `rola()` w `protokol.ts`: wyjątek w agregacie zdejmuje
graczowi CAŁY panel za pomyłkę programisty, która i tak nie przeszłaby przez
`bun run check`. Strażnik ma stać w bramie, nie w produkcie.

## Plan wdrożenia

1. Niezmiennik korpusu w `tests/fixtury.test.ts` — **napisany pierwszy**.
2. `types.ts` + `protokol.ts` — wariant, wczesny powrót, strażnik etykiet.
3. `stats.ts` — `namesIn`, `case "effect"`, dwa strażniki wyczerpania.
4. Testy jednostkowe, `CHANGELOG.md`, rejestry.

Weszło jednym commitem (`4039be7`), bo rozbicie zostawiłoby pośredni stan,
w którym niezmiennik korpusu jest czerwony.

## Weryfikacja

**Niezmiennik napisany PIERWSZY i sprawdzony, że pada** — 299 ≠ 546 oraz
11 ≠ 12. To jest test, który złapałby tę usterkę sam; jego brak sprawił, że
247 efektów ginęło niezauważone.

Cztery mutacje, każda uruchomiona i cofnięta:

| co zepsute | co się zapaliło |
|---|---|
| brak `case "effect"` w `namesIn` | `TS2366` — kompilacja |
| brak `case "effect"` w `aggregate` | `TS2322` — kompilacja |
| samobuf bez wyjątku `owner === other` | „samobuf nie pokazuje się dwa razy" |
| `beginTurn` w gałęzi efektu | mój test **oraz** niezmiennik korpusu |

Ostatnia jest najciekawsza: decyzja o turze stoi na prawdziwym materiale, nie na
moim zdaniu. Do tego para dla strażnika etykiet — zdanie BEZ dziury ma przejść
normalnie, żeby „zawsze zwracaj klucz" nie przeszło.

**Sprawdzone, że nic innego się nie ruszyło** (`git stash` samej naprawy,
pomiar przed i po): `unknownLines` zostaje `0` na obu fixture'ach, świadek życia
daje tę samą liczbę porównań — **7 i 3, zero rozjazdów**. Efekty nie niosą
obrażeń, więc nie miały prawa go ruszyć, i nie ruszyły.

**Promień zmiany okazał się mniejszy, niż zapowiadał `AUDYT‑98`** („za nią
`stats.ts`, `overlay.ts` i odtwarzanie nagrań"). `overlay.ts` renderuje
`actor.procs` ogólnie, a nagrania trzymają surowe komunikaty i `archive.ts` woła
`dekoduj` od nowa — więc ani jedno, ani drugie nie wymagało zmiany, a stare
nagrania przeliczą się same.

## Co zostaje otwarte

- **`AUDYT‑99` przy `+oth_dmg`.** Klucz jest teraz WIDOCZNY, ale nadal
  NIELICZONY: niesie kwotę i trzecią postać w wartości (`kwota,klasa,nick`),
  a kontrakt zdarzeń stoi na dwóch stronach komunikatu. To pozycja projektowa
  i ta runda jej nie tyka.
- **Etykiety 147 efektów pokazują klucz, nie zdanie.** Świadoma cena wyboru
  wyżej. Zniknie, gdy ktoś rozstrzygnie `%name%` klucz po kluczu.
- **Materiał to nadal jedna walka grupowa.** 91 komunikatów pochodzi z jednego
  pliku; nie wiadomo, czy PvP i walki turowe mają ten kształt równie często.
- **Aury nie otwierają tury i nikt nie sprawdził, czy powinny.** Zachowanie jest
  takie samo jak przed zmianą (wtedy nie dawały żadnego zdarzenia), więc runda
  niczego nie psuje — ale też niczego nie rozstrzyga.

## Zmiany wpisu

- **2026-08-06** — powstał; wdrożony tego samego dnia (`4039be7`).
