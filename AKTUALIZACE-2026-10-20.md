# IndyGames – aktualizace 20. 10. 2026

Stav: verze 3.1 navazuje na nasazenou aktualizaci 3.0 (GitHub commit 62b299d1d313e75e6c4bb3975f4a5a9619f0bb6c).
Produkce: https://indygames.cz/ (GitHub Pages, repozitář indyjonesdc/IT-quiz, větev main).

## Změny 3.2: původní vzhled denních kvízů

- Obnovena původní prezentace: DAILY CHALLENGE / INDYGAMES, barevná kategorie, štítky témat, přehled pravidel a svislá tlačítka.
- Otázky opět používají původní horní časovač a skóre, dva průběhové proužky, samostatnou kartu otázky a odpovědi A–D ve dvou sloupcích. Výsledek opět zobrazuje medaili, hodnocení a trojici statistik.
- Zachována opravená logika, 20sekundový limit jednotlivé otázky, vysvětlení, obnova rozehrané hry, zámek denního výsledku a procvičení chyb.
- Všech 90 dříve přidaných otázek zachováno beze změny. Přidáno dalších 60 otázek s vysvětlením, po 20 do IT, obecných a filmových kvízů. Celkem 1 538 otázek (1 388 archivních + 150 nových).
- Styly jsou omezené na denní kvízy. Minihry zůstávají ve verzi 3.1.

## Změny 3.1 podle zpětné vazby

- 2048 Neon je odstraněn z nabídky i z běžícího kódu.
- Nahrazuje ho **Meteorický únik**: 60sekundový let, tři dráhy, tři životy, krystaly se sériovým bonusem a štít. Obtížnost postupně roste; každá vlna ponechává bezpečnou dráhu. Šipky / A D, tlačítka, klepnutí na dráhu a přejetí prstem. Ruční pauza i automatická pauza při odchodu ze záložky. Rekord v zařízení.
- Všechny čtyři nové hry používají vzhled původních miniher: Orbitron, tmavé panely, modré akcenty, kompaktní skóre a stejný styl tlačítek. Styly jsou omezené na minihry.
- Nová verze souborů a cache pro načtení aktualizace.

## Nové hry

- **Meteorický únik (sólo):** uhýbání meteoritům, sbírání krystalů, štít a 60sekundová výzva.
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

Prošlo 12 automatických testů (`node --test tests/*.test.cjs`): bezpečné vlny Meteorického úniku, kolize, štít, nezranitelnost po zásahu, série krystalů, shodné výsledky při různém FPS, pauza, konec letu a jednorázový bonus; dále všech 64 prvních tahů Minového pole, denní otázky a časové hranice, multiplayer s osmi koly a odvetou.

V DOM testech prošlo ovládání nových sólo her, obnova a dokončení kvízu, procvičení chyb a celý průchod aplikací přes všech 15 otázek až po denní zámek a znovuotevření výsledku. Původních 11 her a nabídka byly ověřeny na inicializaci; nejde o dohrání všech variant každé původní hry.

Oba nové online duely navíc prošly přes skutečný Supabase Realtime: dva nezávislí klienti, všech osm kol, shodné konečné skóre. Testy neukládaly výsledky do produkčních žebříčků.

Náhled prošel kontrolou ve skutečném desktopovém prohlížeči: v předchozí verzi tah a skóre 2048, bezpečné odkrytí Minového pole, otázka a vysvětlení denního kvízu, nabídky obou duelů. Barevný souboj byl ověřen i ve dvou záložkách: připojení, společná kola, odeslání odpovědí, shodné vyhodnocení a oznámení ukončení hostitelem. Upraven kontrast odkrytých polí a vyhodnocených odpovědí. Samostatná vizuální kontrola na skutečném mobilním zařízení neproběhla.

Připojený Supabase účet nemá administrátorský přístup k projektu nueprvtkefezraibnlyo. Nebyly tedy ověřeny ani změněny RLS, serverové funkce, Google OAuth a databázový unikátní limit výsledků. Klientská kontrola jednoho výsledku sama nezaručuje ochranu proti souběžným nebo úmyslně upraveným požadavkům.

Kontrola 3.1: v prohlížeči prošla nabídka bez Neonu, zobrazení všech čtyř nových her v původním stylu, první tah Minového pole, start Meteorického úniku, pohyb šipkou a automatická pauza. Cloudový prohlížeč mezi interakcemi přerušuje vykreslování, takže souvislý celý let byl ověřen DOM testem s řízenými snímky: konec po třetím zásahu, uložení rekordu, restart, klepnutí/přejetí prstem, pauza a zrušení animace při odchodu. Mobilní rozvržení je responzivní; fyzický mobil nebyl použit.

## Nasazení

Produkční větev je `main`; nasazení probíhá přes GitHub Pages. Uživatel schválil aktualizaci i nasazení. Produkční HTML nezapíná automatického hosta, veřejný testovací náhled ano a má noindex. Databáze ani oprávnění se v této opravě nemění.

Výchozí commit této opravy: `62b299d1d313e75e6c4bb3975f4a5a9619f0bb6c`. Před aktualizací hlavní větve se kontroluje její aktuální SHA. Po nasazení ověřit úspěšný Pages workflow, shodu změněných souborů a otevření hry na produkční doméně.

## v3.3 – Lov na kombinaci

Minové pole nahrazeno sólovou logickou hrou Lov na kombinaci: čtyři různé barvy ze šesti, osm pokusů, zpětná vazba pro správné barvy a pozice. Barevné žetony mají také čísla. Rozehraná hra a rekord se ukládají v zařízení, restart rozehrané hry vyžaduje potvrzení. Vzhled používá původní společný skin miniher.

Ověření: 13 testů pravidel, kvízů, Meteorického úniku a duelů; test skutečného React UI pro zpětnou vazbu, dvojité odeslání, obnovení hry, výhru, prohru a poškozené uložení; inicializace 11 původních her a nabídky.

## v3.4 – Skupinové lodě

Nová online hra pro 2–8 hráčů: každý proti každému, dva týmy s individuálními flotilami, nebo dva týmy se společnou flotilou a střídajícími se členy. Mapa 8×8, lodě délky 4/3/2, ruční i náhodné rozmístění. Kapitán rozmísťuje společnou flotilu; každý hráč přidává až dvě vlastní nástrahy (mina, rušička, vír).

Volitelné superzbraně: radar 3×3 (2 použití), plošná střela 2×2 a torpédo délky 4 (po jednom použití). Náhodné skryté předměty doplňují munici nebo přinášejí riziko. Účinky jsou jednorázové, munice je omezená na nejvýše 3 kusy od druhu. Radar spotřebuje tah, zprávy vidí pouze vlastní tým. Klasická hra může všechny doplňky vypnout.

Vlastní námořní rozhraní: textura moře, vektorové siluety lodí, animace zaměřování, radaru a výstřelu, dvousloupcové velitelství na desktopu, responzivní mobilní ovládání, zvuky s vypínačem a podpora omezeného pohybu.

Síť: hostitel vyhodnocuje pravidla, klientské příkazy mají identifikátory a kontrolu tahu/partie, přenos osobních pohledů je šifrovaný ECDH/AES-GCM. Soupeřům se neposílají neodhalené lodě, nástrahy ani radarové zprávy. Jde o přátelské místnosti s důvěryhodným hostitelem, nikoli serverový soutěžní anti-cheat. Hostitel musí nechat okno otevřené; obnovení stránky nevytváří trvalý návrat do partie. Příprava 120 s, tah 45 s, tři zmeškané tahy hráče vyřadí. Výpadky se obnovují pomocí snímků stavu a opakování nepotvrzených příkazů.

Ověření: 20 automatických testů včetně geometrie flotil, týmů, společných nástrah, skrytých dat, všech předmětů, dvojitých akcí, vítězství i vzájemného zničení, časových limitů a čtyř šifrovaných klientů. React UI test od lobby přes rozmístění a nástrahy po výstřel. Živý test dvou nezávislých klientů přes produkční Supabase Realtime v izolované QA místnosti.

## v3.5 – Pětinásobné bojiště

Mapa rozšířena z 8×8 (64) na 18×18 (324 políček, 5,06× větší plocha). Každá mapa má nezávislé přiblížení 100–300 %, posouvání a návrat na celý přehled; na mobilu začíná na 200 % pro pohodlnější zásahy. Flotily rozšířeny na 6 lodí (5/4/4/3/3/2), celkem 21 částí. Radar 5×5, plošná střela 3×3, torpédo délky 6; úvodní munice 3/2/2, zásobníky nejvýše 4. Náhodných předmětů je dvojnásobek. Nová verze místností má oddělený komunikační kanál, aby se nemíchaly rozměry se starou rozehranou partií. Ověřeno 21 testy včetně všech okrajových souřadnic a React UI se 324 políčky a zoomem.

## v3.6 – volitelné mapy lodí
- Hostitel vybírá 12×12, 18×18, 24×24 nebo 30×30; automatická velikost podle počtu hráčů.
- Každá flotila má vlastní mapu, zásah se týká jen vybraného soupeře.
- Souřadnice až AD30, dynamická geometrie a ověření pěti shodných flotil.

## v3.7 – společné moře a překryté flotily
- Jedna společná mapa, bez výběru cílového hráče. Lodě různých flotil se mohou překrývat.
- Výstřel poškodí všechny dosud nezasažené části lodí na daném místě, včetně vlastních a spojeneckých.
- Vícenásobné zásahy mají oznámení se jmény, počty a značkami ×2 / ×3 přímo na mapě.
- Spojenecké flotily jsou vidět a každá má vlastní barvu s legendou; překryvy mají více barevných značek.
- Nástrahy mohou zasáhnout spolu s cizí lodí; minové poškození nezablokuje střelbu na nezasažené překryté lodě.
- Velikosti 12×12 až 30×30 i volba automaticky zůstávají.

## v3.8 – velká taktická plocha
- Bitva automaticky využije celé okno, s volbou zmenšení.
- Mapa se přizpůsobuje výšce i šířce; zbraně a palba jsou v samostatném panelu.
- Příprava flotil má širší mapu, náhled umístění lodě a ovládání šipkami.
- Zvýraznění oblasti zbraně při najetí, barevné ukazatele stavu flotil a kompaktní oznámení.

## 3.9 – grafika flotil a oceánu
- Detailní kovové lodě, paluby, můstky a dvojité dělové věže.
- Texturovaný oceán, jemné osvětlení, animovaný oheň a kouř zásahů.
- Sjednocené kovové panely a ovládání, zachovaná velká plocha a barvy flotil.
