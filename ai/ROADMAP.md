## Roadmapa MergoMeter

## Faza 1 - w trakcie (juz bardziej wiem)
- Okno obrażeń
- Lewy przycisk myszki na pojedynczą postać -> wchodzisz głębiej w staty tej postaci; statysyki wielu postaci -> statystyki jednego goscia/rzeczy
    np. obrazenia: ranking wedlug obrazen kazdej postaci -> ranking obrazen wedlug umiejetnosci
- Prawy przycisk myszki na pojedynczą postać -> wracasz z stat tej postaci/rzeczy
- Szybkie przejscie z Wszyscy, My, Oni
- Toggle do turowych statystyk
- Hover na pojedyncz postac pokazuje skrot statystyk: zadane calkowite, otrzymane calkowite, 
    ilosc efektow zprocowanych + ilosc efektow zprocowanych przez przeciwnika na sobie, 
    czyli chodzi mi o efekty z legend, ktore beda liczone -> dotyk aniola xN, klatwa xN, cios bardzo krytyczy xN itd
- Gdzie dac statystyki wedlug teamu, czy to jest wazne? Chodzi mi o mozliwosc porownania dwoch my i oni, gdzie to dac, jak, nie wiem

## Faza 2 (nie wiem jeszcze)
- Otrzymane obrazenia
- Uleczone
- Procowanie (panel pod wszystkie efekty z legend, nie mam pojecia, jak to ma wygladac, to jest cos grubszego lub przesada)

## Do zbadania osobno - leczenie "od kogo"
Wyleczone maja miec drill "wg postaci" jak zadane/otrzymane, ale PYTANIE, CZY SIE DA.
Stan z korpusu (wszystkie linie leczenia): kazde leczenie jest samoistne, log nie
nazywa leczacego. Trzy formy:
- "Przywrocono N punktow zycia X" - regeneracja/kradziez zycia, BEZ zrodla
- "X: Ostatni ratunek, zregenerowano N" - samoratunek, zrodlo = X sam
- "Dotyk aniola: zregenerowano N punktow zycia X" - token przed dwukropkiem to
  nazwa EFEKTU, nie postac; cel to znow X
Wniosek: literalne "ktora postac leczyla" zawsze = leczony (samoleczenie), drill
mialby jeden wiersz. Realne "od kogo" wymaga logu, gdzie JEDNA postac leczy DRUGA
(np. paladyn sojusznika) - takiej linii w korpusie NIE MA, format sprawcy nieznany.
Do zrobienia, gdy pojawi sie probka takiego logu: zlapac format i przypisac leczacego
(analogicznie do napastnikow/trucizny). Alternatywa bez nowych danych: pierwszy
szczebel "OD CZEGO" (zrodlo: Regeneracja/aura/samoratunek) - to praktycznie dzisiejsze
healedBy, tylko jako drill. Patrz tez znane ograniczenie "Leczenie bez leczacego" w README.
