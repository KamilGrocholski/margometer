# Specyfikacje — praca programistyczna

Jeden plik na **rundę pracy**, nie na temat. Reszta `docs/` jest odwrotnie:
`SOLID.md`, `AUDYT.md`, `DECYZJE.md` to rejestry per temat, do których dopisuje
się wpisy. Oba układy są tu potrzebne i odpowiadają na inne pytania:

| pytanie | gdzie |
|---|---|
| co jest otwarte w agregacie? | `SOLID.md`, `AUDYT.md` |
| dlaczego kod wygląda tak? | `DECYZJE.md` |
| **jak rozumowaliśmy przy TEJ zmianie?** | **tutaj** |

## Skąd to się wzięło

Duże rundy były dotąd projektowane w pliku planu **poza repozytorium**
(`~/.claude/plans/`). Plan zawierał problem, wybrane rozwiązanie, odrzucone
warianty i sposób weryfikacji — czyli dokładnie to, czego potem nie dało się
odtworzyć. Po zatwierdzeniu treść przeżywała tylko w komunikacie commita,
a wnioski rozlewały się po rejestrach. Następny człowiek (albo agent) widział
**wynik**, nie **rozumowanie** — a najdroższe jest odtwarzanie tego drugiego.

Szablon jest **celowo krótki**. Rozbudowane systemy specyfikacji mają zwykle
kilkanaście sekcji — modele danych, kontrakty API, ścieżkę migracji. Tu nie ma
ani API, ani migracji, a sekcja wypełniana „nie dotyczy" uczy tylko tego, że
szablon się olewa. Zostało siedem: tyle, ile ten projekt utrzyma.

## Kiedy pisać

**Gdy zmiana wymaga zaprojektowania przed napisaniem kodu** — czyli wtedy, gdy
istnieje więcej niż jeden sensowny wariant i wybór trzeba uzasadnić.

Nie pisz speca do poprawki literówki, dopisania wzorca do parsera ani zmiany
tekstu. Sygnał, że spec jest potrzebny: łapiesz się na tym, że piszesz plan.

## Nazwa i status

`{RRRR-MM-DD}-{tytuł-z-myślnikami}.md` — data powstania, nie wdrożenia.
Sortuje się chronologicznie i nie wymaga pilnowania licznika.

Status stoi w drugiej linii pliku, jednym z dwóch słów:

- **`projekt`** — napisany, jeszcze nie wdrożony;
- **`wdrożone`** — plus data i skrót commita.

Plików **nie przenosimy** do podkatalogu po wdrożeniu — to spotykany wariant,
ale tu byłaby to zmiana ścieżki, do której odsyłają commity. Status w nagłówku
wystarcza, a listę otwartych daje:

```bash
grep -l "^Status: projekt" docs/specy/*.md | grep -v SZABLON
```

Ani kotwica `^`, ani `grep -v` nie są tu ozdobą (poprawione 2026‑08‑02,
`AUDYT‑44`). Przepis stał tu bez obu i wypisywał **`SZABLON.md`** jako pierwszy
„otwarty spec", bo szablon też ma w drugiej linii status projektu. Kotwica
odsiewa z kolei ten plik: sama nazwa statusu pada w akapicie wyżej. Przepis
podany w dokumencie ma działać po wklejeniu — inaczej uczy tylko tego, żeby
dokumentowi nie ufać.

## Szablon

[`SZABLON.md`](SZABLON.md) — siedem sekcji. Najważniejsza jest
**Odrzucone warianty**: to jedyna część, której NIE da się odtworzyć z kodu
później. Kod mówi, co wybrano; nie mówi, czego nie wybrano i dlaczego.

## Spis

| spec | status |
|---|---|
| — | jeszcze żadnego |

Pierwszy powstanie przy najbliższej rundzie wymagającej projektowania.
Tabelę uzupełnia się ręcznie przy dodaniu pliku.
