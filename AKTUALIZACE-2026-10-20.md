# IndyGames – aktualizace 20. 10. 2026

Stav: ověřená aktualizace připravená k produkčnímu nasazení po obnovení oprávnění GitHubu.
Náhled: https://review-v3.indygames-preview.pages.dev
Deployment: e111029f-ba8b-4186-9966-49ef80f4a44e (Cloudflare: success).
Výchozí GitHub repozitář: indyjonesdc/IT-quiz, main 17ebcf0135f0906b3e53981f723c36d325f03cac.
Součástí je také dříve připravené bezplatné Cloudflare Web Analytics.

## Nové hry

- **2048 Neon (sólo):** slučování dlaždic, šipky, dotyková gesta a tlačítka, rozehraná hra a rekord v zařízení, vyhodnocení konce hry.
- **Minové pole (sólo):** 8 × 8 polí / 10 min, první odkrytí včetně sousedů bezpečné, odkrývání prázdných oblastí, vlaječky i na mobilu, čas a rekord v zařízení.
- **Barevný souboj (online):** 2–8 hráčů, šestiznakové kódy, osm kol, rozhoduje barva textu, nikoli jeho význam.
- **Paměťový duel (online):** 2–8 hráčů, osm kol, délka mizejícího kódu postupně roste od 3 do 6 číslic.

Online duely validuje hostitel místnosti: identifikátor zápasu a kola, čas pro odpověď, právě jednu odpověď hráče a bodování. Odveta vynuluje předchozí skóre. Připojení do rozehrané hry a devátý hráč jsou odmítnuti. Výpadek hostitele se zobrazí; pořadí se ukládá jen po dobu místnosti. Jde o přátelský multiplayer nad veřejným Supabase Realtime, nikoli serverově chráněný soutěžní režim proti podvádění.

## Denní kvízy

- Nové rozhraní, 20 sekund na otázku, bez časového tlaku během vysvětlení.
- 90 nových otázek s vysvětlením (30 IT, 30 obecné, 30 filmové).
- Zachováno 1 388 platných a neduplicitních původních otázek. Z původních 1 400 položek bylo vyřazeno 11 duplicit a otázka ID 1298 s nejednoznačnými možnostmi.
- Celkem 1 478 otázek. Denní sada obsahuje 5 nových a 10 původních. Je deterministická pro datum a kategorii, včetně pořadí odpovědí; všichni používají stejný lokální snapshot.
- Nový den se počítá v Europe/Prague.
- Bodování 100–1 000 za správnou odpověď dle času, +100 za třetí a další správnou odpověď v řadě, +2 000 pouze za všech 15 správně. Náhodný Lucky Box je z denního pořadí odstraněn.
- Průběh se ukládá zvlášť podle uživatele a kategorie. Obnovení nevrací čas rozběhnuté otázce.
- Přehled odpovědí, procvičení chyb a samostatný trénink bez časového limitu a bez zápisu do pořadí.
- Opakované dokončení nepřepisuje již nalezený denní výsledek. Chyba zápisu není vydávána za úspěšné uložení; výsledek lze znovu otevřít a odeslat.
- Historické výsledky se nemění. Nová pravidla mají jiný bodový rozsah než předchozí verze; při vyhodnocování dlouhodobých součtů je nutné počítat se změnou pravidel.

## Opravy původních her

- Stopky měří okamžik stisku, ne poslední vykreslený snímek. Ochrana před opakovaným stop/resume; ukončení po příliš dlouhém čekání; zrušení čekajícího výsledku při odchodu. Původní zrychlený chod stopek zachován.
- Střelnice má skutečný časový deadline, právě jeden zásah na terč, právě jedno vyhodnocení a zrušení časovačů po odchodu. Umístění terčů respektuje skutečnou šířku mobilního pole.
- Slepá mapa ČR, Kvízová aréna, 5 z 10 a Zastav čas – aréna ruší předplatná a zbývající časovače při odchodu.
- Pořadí kola mapy ČR odpovídá uděleným bodům včetně časového bonusu.
- Rekordová hláška se neukáže, pokud se výsledek nepodařilo uložit.
- Žebříček minihry nenechá po chybě požadavku nekonečné načítání.
- Service worker nevrací HTML místo chybějícího JS/CSS a aktualizace samovolně nerestartuje skrytou rozehranou hru.
- Denní stránka již neobsahuje starou duplicitní kopii miniher a mapových dat. Nový kód je oddělen do souborů assets/.

## Ověření a meze

Prošlo 9 automatických testů pravidel a multiplayer stavů (v adresáři `web`: `node --test tests/*.test.cjs`), včetně všech 64 možných prvních tahů Minového pole, slučování 2048, časových hranic, duplicitní odpovědi, osmi kol a odvety.

V DOM testech prošlo ovládání nových sólo her, obnova a dokončení kvízu, procvičení chyb a celý průchod aplikací přes všech 15 otázek až po denní zámek a znovuotevření výsledku. Původních 11 her a nabídka byly ověřeny na inicializaci; nejde o dohrání všech variant každé původní hry.

Oba nové online duely navíc prošly přes skutečný Supabase Realtime: dva nezávislí klienti, všech osm kol, shodné konečné skóre. Testy neukládaly výsledky do produkčních žebříčků.

Náhled prošel kontrolou ve skutečném desktopovém prohlížeči: tah a skóre 2048, bezpečné odkrytí Minového pole, otázka a vysvětlení denního kvízu, nabídky obou duelů. Barevný souboj byl ověřen i ve dvou záložkách: připojení, společná kola, odeslání odpovědí, shodné vyhodnocení a oznámení ukončení hostitelem. Upraven kontrast odkrytých polí a vyhodnocených odpovědí. Samostatná vizuální kontrola na skutečném mobilním zařízení neproběhla.

Připojený Supabase účet nemá administrátorský přístup k projektu nueprvtkefezraibnlyo. Nebyly tedy ověřeny ani změněny RLS, serverové funkce, Google OAuth a databázový unikátní limit výsledků. Klientská kontrola jednoho výsledku sama nezaručuje ochranu proti souběžným nebo úmyslně upraveným požadavkům.

## Nasazení

Celý obsah adresáře `web/` v ZIPu patří do kořene stávajícího webu, zejména i nový adresář `assets/`. Bez něj se stránky nespustí. Zachovat doménu a existující Supabase projekt. Nejsou potřeba migrace databáze.

Uživatel výslovně schválil nasazení. Oprávnění GitHubu byla obnovena a vytvoření větve codex/indygames-v3-20261020 již prošlo. Hlavní web běží přes GitHub Pages z větve main.

Veřejný náhled na Cloudflare byl po schválení nahrán a nasazen úspěšně. Automaticky používá hosta náhledu a má noindex. Produkční zdrojové HTML v tomto repozitáři automatické přihlášení hosta neobsahuje.

Nasazení: commit změn navazující na main, aktualizace main, kontrola úspěšného GitHub Pages deploymentu a souborů na indygames.cz. Pro návrat lze obnovit výchozí commit 17ebcf0135f0906b3e53981f723c36d325f03cac; databáze nebyla měněna.
