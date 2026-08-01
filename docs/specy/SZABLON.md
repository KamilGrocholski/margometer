# {Tytuł — co się zmienia, po ludzku}

Status: projekt
<!-- po wdrożeniu: `Status: wdrożone · RRRR-MM-DD · {skrót commita}` -->

## Problem

Co jest źle DZIŚ i skąd to wiadomo. Liczba, cytat z logu albo odtworzenie —
nie „wydaje się". Jeśli teza opiera się na zdaniu z `docs/`, sprawdź je
w kodzie i napisz, co zastałeś: dokumentacja starzeje się szybciej niż kod.

Jeśli problem dotyczy zachowania GRY, a nie naszego kodu — najpierw procedura
z [`../MECHANIKA.md`](../MECHANIKA.md). Dotyczy to także zdań negatywnych.

## Rozwiązanie

Co robimy i **dlaczego akurat to**. Nie opis kodu — kod będzie w repo. Tu ma
stać rozumowanie, którego z kodu nie widać.

## Odrzucone warianty

**Najważniejsza sekcja tego szablonu.** Kod mówi, co wybrano; nigdy nie mówi,
czego nie wybrano i dlaczego. Bez tego następna osoba przechodzi tę samą drogę
od zera — albo, gorzej, „naprawia" świadomą decyzję.

Po jednym akapicie na wariant: na czym polegał i co go przekreśliło. Wariant
odrzucony z powodu, który później zniknie, zasługuje na osobne zdanie — to
kandydat do powrotu.

## Plan wdrożenia

Kolejność kroków. Jeśli runda rozbija się na kilka commitów, każdy ma osobno
przechodzić `bun run check`.

## Weryfikacja

Jak sprawdzimy, że działa — i jak sprawdzimy, że **test potrafi paść**.
Po napisaniu testu na naprawę zepsuj naprawę i potwierdź, że test się zapala;
zdarzyły się tu testy zielone i puste.

Przy zmianach wydajnościowych: pomiar przed i po, tą samą sondą.

## Co zostaje otwarte

Czego ta runda świadomie NIE domyka i dlaczego. „Naprawione" nie ma znaczyć
więcej, niż znaczy — a to, co tu zapiszesz, jest punktem wyjścia następnej rundy.

## Zmiany wpisu

- **RRRR-MM-DD** — powstał.
