# Wytyczne Projektu: Baza Przepisów

## 1. Środowisko i Wdrażanie (Git / Hosting / Chmura)
- **Środowisko Git & GitHub Desktop:** Użytkownik posiada lokalne repozytorium w `C:\Users\klaud\Documents\GitHub\baza-przepisow` oraz klienta GitHub Desktop (binarka: `C:\Users\klaud\AppData\Local\GitHubDesktop\app-3.6.10\resources\app\git\cmd\git.exe`).
- **Automatyzacja Wdrażania:** Wdrażanie produkcyjne realizowane jest automatycznie poprzez `python scripts/sync_to_github.py` (kopiowanie `cloudflare_build/` -> repozytorium lokalne -> `git commit` -> `git push origin main`). Nie wymagaj od użytkownika ręcznego przeciągania plików przez stronę www GitHub.
- **Hosting docelowy:** Projekt działa na **Cloudflare Pages** pod adresem `https://baza-przepisow.pages.dev/`.
- **Backend i Baza Chmurowa (Supabase BaaS):** Projekt korzysta z instancji Supabase pod adresem `https://vsrnmczaqcrpeedfejab.supabase.co` (Project Ref: `vsrnmczaqcrpeedfejab`).
- **Reguła Przekierowań Supabase Auth (Site URL):** Domyślny adres `localhost:3000` w Supabase musi być bezwzględnie zastąpiony adresem produkcyjnym `https://baza-przepisow.pages.dev/` w konfiguracji Site URL i Redirect URLs. W wywołaniach `supabase.auth.signUp(...)` zawsze jawnie przekazujemy `emailRedirectTo: window.location.origin`, aby zapobiec błędowi `ERR_CONNECTION_REFUSED` po weryfikacji maila.
- **Ścieżki zasobów:** Wszystkie odwołania do grafik to zoptymalizowany format WebP w katalogach wsadowych (`images/batch_1/`, `images/batch_2/`, `images/batch_3/`), z bezpośrednią relatywną ścieżką w `recipes.json`.

## 2. Standardy Inżynieryjne i Architektura (Clean Slate)
- **Bezkompromisowa jakość i szczerość architektoniczna:** Nigdy nie maskuj błędów projektowych doraźnymi łatkami ani nie idź na skróty. Bądź w 100% szczery technicznie, nie halucynuj. Jeśli jakikolwiek pomysł lub fundament bazy/kodu jest wadliwy od podstaw (np. brak danych odżywczych składników, błędy proporcji dań), otwarcie wskaż ryzyka i wady przed podjęciem prac.
- **Plan Implementacji jako Natywny Plik w Antigravity:** Każdy plan wdrożenia i audyt musi być prowadzony jako formalny plik-artefakt w Antigravity (`implementation_plan.md` z metadanymi). Wszystkie nowe punkty muszą być najpierw dopisane do tego planu.
- **Architektura Hybrydowa Local-First (PWA + Supabase BaaS):** 
  - Frontend pozostaje w 100% czystym Vanilla JS (ES Modules), serwowanym statycznie z Cloudflare Pages, z pełnym wsparciem offline dzięki PWA i `IndexedDB` (`BazaPrzepisowDB`).
  - Dane użytkowników (własne przepisy, jadłospis `meal_plans`, lista zakupów `shopping_items`, ulubione `favorites`) synchronizują się dwukierunkowo w chmurze Supabase w tle (optimistic updates).
  - Bezpieczeństwo danych wymusza PostgreSQL Row-Level Security (RLS) – użytkownicy mają dostęp wyłącznie do swoich prywatnych danych oraz dań publicznych.
  - Zdjęcia użytkowników: Magazyn Supabase Storage bucket `recipe-images` z obowiązkową kompresją po stronie klienta (Canvas WebP max 1000px, jakość 0.82) przed uploadem.

## 3. Interfejs i Zachowanie Aplikacji (UX)
- **Autentykacja i Konta Użytkowników:**
  - Minimalistyczny modal logowania i rejestracji (login/username, email, hasło).
  - Wskaźnik konta w nagłówku: przycisk `Zaloguj się` w trybie gościa lub pigułka `@username` z przyciskiem wylogowania w trybie zalogowanym.
- **Prywatność Dań i Plakietki Społeczności:**
  - W formularzu dodawania potrawy (`#tab-add`) dostępny jest przełącznik `🌍 Przepis publiczny (Społeczność)` vs `🔒 Przepis prywatny`.
  - Dania publiczne w katalogu wyróżniają się plakietką autora: `👤 @login`.
  - Dania prywatne widzi wyłącznie zalogowany autor z etykietą `(Prywatny)`.
  - W katalogu dań zaimplementowane są filtry źródła: `Wszystkie` | `Oficjalne (229)` | `Społeczność` | `Moje`.
- **Przypisanie do dnia (1-klik):** Po kliknięciu „Dodaj do dnia” użytkownik widzi listę 7 dni (*Poniedziałek – Niedziela*). Kliknięcie w dzień natychmiast przypisuje danie do tego dnia bez zbędnych kroków pośrednich.
- **Dodawanie potraw wprost z Jadłospisu:** W widoku planera każdy dzień i każdy wolny slot posiada przycisk `+ Dodaj danie`, który otwiera szybki selektor dań z wyszukiwarką i filtrami. 1 kliknięcie w wybraną potrawę natychmiast wstawia ją do wybranego dnia.
- **Ścisłe Sloty w Jadłospisie:** Posiłki posiadają stały `slot_index` (0..5). Puste sloty pozostają widoczne z opcją dodania dania – usunięcie śniadania nie przesuwa obiadu w górę.
- **Ustawienia liczby posiłków (3–6):** Aplikacja obsługuje personalizację liczby posiłków (od 3 do 6 dziennie), co automatycznie dostosowuje siatkę slotów każdego dnia tygodnia i sumy makro. Domyślna wartość to 4 posiłki.
- **Oficjalna taksonomia 11 kategorii BiteCraft:** Wszelkie filtry i kategoryzacja potraw bazują ściśle na 11 kategoriach:
  1. *🥣 Owsianki, puddingi i kasze*
  2. *🥛 Nabiał i skyr-bowls*
  3. *🍳 Jajka*
  4. *🥪 Kanapki i tosty*
  5. *🥞 Naleśniki, gofry i placki*
  6. *🍛 Dania główne i obiady*
  7. *🍝 Makarony i zapiekanki*
  8. *🌯 Wrapy, tortille i fit fast food*
  9. *🥗 Sałatki i wytrawne bowle*
  10. *🧁 Fit desery i słodkie wypieki*
  11. *🛒 Szybkie gotowce (SOS)*
  Każda kategoria w filtrach posiada dynamiczny licznik dań oraz możliwość jednoczesnego filtrowania czasu (`⏱️ do 15/30/60 min`) i składników.
- **Tryb Twórcy:** 
  - Kod PIN twórcy/administratora wynosi zawsze: `0000`.
  - Tylko po wpisaniu tego PIN-u aktywują się uprawnienia usuwania dań oraz eksportu bazy `recipes.json`.
- **Nawigacja i Czystość UI:**
  - Kliknięcie logo „Baza Przepisów” w lewym górnym rogu zawsze przenosi do strony startowej (katalog dań).
  - Tytuły dań są czyszczone z dopisków technicznych (np. `[Urodzinowa paczka]`), a miniatury na kartach są pozbawione etykiet źródła/diety.
  - Spójna prezentacja makro w całej aplikacji: **Kcal • B (Białko) • T (Tłuszcze) • W (Węglowodany)**.
  - **Bezstratna lista zakupów:** Generowanie z jadłospisu zachowuje 100% pozycji wpisanych ręcznie (`is_manual: true`). Smart Parser tokenizuje nazwy i gramatury, eliminując błędy scalania podciągów.
  - **Uniwersalny Scaler Porcji:** Zmiana porcji proporcjonalnie przelicza **wszystkie liczby** w miarach tekstowych oraz wagach w nawiasach (np. `7 łyżeczek (35g)` przy 2 porcjach to `14 łyżeczek (70g)`, przy 4 porcjach `28 łyżeczek (140g)`). Bezwzględny zakaz nadpisywania miar tekstowych samą wagą gramową.
  - **Dynamiczny Kreator Składników i Smart Parser:** Formularz dodawania przepisu posiada dedykowane, odrębne pola `[Nazwa składnika]` oraz `[Ilość]` dla każdego wiersza. Wklejenie tekstu z separatorem (`-`, `–`, `:`, `\t`) lub jednostką miary automatycznie rozdziela go na te pola (na zdarzenie `blur` lub przez opcję hurtowego wklejania), zapobiegając pozostawaniu ilości w polu nazwy.

## 4. Standard Stylu Fotografii Kulinarnej (Style Guide)
- Wszystkie generowane grafiki dań muszą mieć spójny styl i zachować wierność oryginałowi:
  - **Zasada 90% wierności (90% Fidelity):** Danie, jego kompozycja, kształt, składniki, dodatki i układ na talerzu muszą w **90% wiernie odwzorowywać oryginalne zdjęcie z bazy**.
  - **Pozostałe 10% zmian:** Zmieniamy **WYŁĄCZNIE tło oraz podnosimy jakość/oświetlenie zdjęcia** – zastępujemy chaotyczne/ciemne tła prostym, jasnym tłem w kolorze naturalnego lnu (*ecru / oatmeal*), na minimalistycznej ceramice w miękkim świetle dziennym.
  - **Ścisły zakaz:** Całkowity zakaz wymyślania lub podmiany składników (np. jeśli na zdjęciu i w przepisie jest pomidor, ma być pomidor).
