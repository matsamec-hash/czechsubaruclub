# Subaru kvízy — design

**Datum:** 2026-06-04
**Projekt:** czechsubaruclub.cz (Next.js 16, static export, Hostinger)
**Stav:** návrh schválen v brainstormingu, čeká na review před plánem

## 1. Cíl a kontext

Přidat na web sekci kvízů, která zvýší engagement, čas na stránce a sdílení (organická návštěvnost zdarma) a zároveň propojí návštěvníky s katalogem modelů. Web je statický export — kvízy běží **čistě client-side**, definice jsou zapečené do buildu.

Hub `/kviz` se v čase rozroste o další kvízy. Tento spec pokrývá **v1**.

## 2. Rozsah v1

**Dva kvízy:**
1. **Personální** „Které Subaru se k tobě hodí?" — ~7 otázek → 1 ze 7 modelů-archetypů, sdílitelná výsledková stránka.
2. **Znalostní** „Jak dobře znáš Subaru?" — ~10 otázek single-choice, skóre + projití odpovědí.

**Vstupní body:**
- Blok na homepage = **dvě karty vedle sebe** (personální + znalostní).
- Položka v hlavním menu (`SiteHeader`).
- **Jemný modal** propagující personální kvíz — naskočí **jen jednou na návštěvníka** (localStorage), trigger **po ~8 s na stránce** (hlavní) + **exit-intent na desktopu** (co dřív). Nezobrazuje se na `/kviz/*` stránkách.

### Non-goals (v1)
- Žádný backend, žádné ukládání odpovědí, žádné PII.
- Žádný sběr e-mailů / newsletter.
- Žádná editace kvízů přes CMS — definice se edituje v repu.
- Žádné statické stránky pro každé znalostní skóre (skóre se jen sdílí jako text).
- Bez vícejazyčnosti.

## 3. Architektura a routy

Vše statické (`output: export`), build-time.

| Route | Typ | Popis |
|---|---|---|
| `/kviz` | server | Hub — karty dostupných kvízů + intro |
| `/kviz/ktere-subaru-se-k-tobe-hodi` | server shell + client runner | Personální kvíz |
| `/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/[slug]` | server, `generateStaticParams`, `dynamicParams=false` | 7 předrenderovaných výsledkových stránek (jedna na archetyp) |
| `/kviz/jak-dobre-znas-subaru` | server shell + client runner | Znalostní kvíz |

Výsledkové stránky jsou reálné statické URL → sdílitelné, indexovatelné, vlastní OG, prolink na `/modely/[slug]`.

## 4. Data a autorství

Definice kvízů = **commitnuté TS moduly** v `lib/quizzes/`, typované a **zod-validované při importu** (build spadne při chybné definici).

```
lib/quizzes/
  types.ts          # zod schémata + TS typy (QuizDef, Question, Answer, PersonalityOutcome)
  scoring.ts        # čisté funkce skórování (TDD)
  index.ts          # registr kvízů (pole QuizDef) + helper getQuiz(slug)
  ktere-subaru.ts   # personální definice
  jak-dobre-znas.ts # znalostní definice
```

**Integrita výsledek → model:** `generateStaticParams` výsledkových stránek čte `outcomes` z personální definice; build navíc **ověří, že každý `modelSlug` existuje v katalogu** (`fetchModel(slug)` → když chybí, `throw` a build spadne hlasitě). Tím nikdy nevznikne odkaz na neexistující `/modely/[slug]`.

### Tvar definice (zkráceně)

```ts
type QuizDef =
  | { kind: "personality"; slug; title; intro; questions: Question[]; outcomes: PersonalityOutcome[] }
  | { kind: "knowledge";   slug; title; intro; questions: KnowledgeQuestion[] };

type Question = { id: string; text: string; answers: Answer[] };
type Answer = { id: string; text: string; icon?: string; weights: Record<OutcomeId, number> };

type PersonalityOutcome = { id: OutcomeId; modelSlug: string; archetype: string; emoji: string; blurb: string };

type KnowledgeQuestion = { id; text; answers: {id; text}[]; correctId: string; explanation: string };
```

Jména modelů, foto (`heroImageUrl`) a odkaz na detail se na výsledkové stránce načtou **build-time z DB** přes stávající drizzle pattern (`db.select().from(schema.models).where(eq(slug))`), stejně jako `/modely/[slug]`. Definice drží jen `modelSlug` + kvízově specifický text (archetyp, blurb).

## 5. Mechanika (engine)

Jeden generický **`QuizRunner`** (client) řízený definicí. Skórování v `lib/quizzes/scoring.ts` jako čisté funkce (testovatelné bez UI).

### Personální — dimenzní skórování
- Každá odpověď přidá váhové body jednomu či více `outcomes` (`weights`).
- Po poslední otázce: součet bodů per outcome; **vyhrává nejvyšší**.
- **Tie-break:** při shodě rozhodne pevné pořadí priorit definované v `outcomes` (první v poli vyhrává). Deterministické, žádná náhoda.
- Po dokončení runner naviguje na `…/vysledek/[modelSlug]` vítězného outcome (client-side `router.push`).

### Znalostní — skóre
- 10 otázek single-choice; po výběru se zaznamená `correctId === answerId`.
- Skóre = počet správných (0–10). Zobrazí se skóre + **projití odpovědí** (tvá vs. správná + `explanation`).
- Skóre žije jen v client stavu (není v URL/statické stránce).

## 6. Obsah v1 (první verze — text laditelný při implementaci)

### Personální výsledky (7 archetypů → reálné slugy v katalogu)

| Outcome | modelSlug | Archetyp | Emoji |
|---|---|---|---|
| adventurer | `outback` | Dobrodruh / cestovatel | 🏔️ |
| outdoorist | `forester` | Praktický outdoorista | 🌲 |
| allrounder | `xv` | Městský all-roader (rozumný kompromis) | 🏙️ |
| rallyist | `wrx-sti` | Rallye srdcař | 🏁 |
| purist | `brz` | Řidič-purista | 🎯 |
| cruiser | `levorg` | Klidný kilometrožrout (kombík) | 🛣️ |
| original | `vivio` | Originál / sběratel kei kuriozit | ✨ |

Pořadí v tabulce = priorita pro tie-break.

> **Pozn. k zápisu vah:** v otázkách níže je váha psaná zkratkou jménem modelu = jeho outcome (`outback`=adventurer, `forester`=outdoorist, `xv`=allrounder, `wrx-sti`=rallyist, `brz`=purist, `levorg`=cruiser, `vivio`=original). Datová struktura (`Answer.weights`) referencuje vždy **`OutcomeId`**, ne `modelSlug`.

### Personální otázky (7, s váhami) — první návrh

1. **Kde nejčastěji jezdíš?** Město (xv+2, brz+1) · Šotolina/hory/chata (outback+3, forester+2) · Okruh/klikaté silnice (brz+3, rallyist+2) · Dlouhé tahy (cruiser+2, outback+1)
2. **Co od auta čekáš nejvíc?** Spolehlivý parťák na všechno (forester+3, outback+1) · Zábavu za volantem (brz+3, rallyist+2) · Pohodlí a prostor (cruiser+2, outback+2) · Něco neotřelého (original+3, brz+1)
3. **Kolik vozíš lidí/věcí?** Sám/ve dvou nalehko (brz+2, original+2, rallyist+1) · Rodina + pes + bagáž (outback+2, forester+2, cruiser+1) · Občas parta (cruiser+2, forester+1) · Sebe + kufr nářadí (original+1, forester+1)
4. **Tvůj vztah k Subaru?** Symetrický AWD a boxer (outback+2, forester+2, rallyist+1) · WRC sláva, modrá se zlatými koly (rallyist+3) · JDM kuriozity a kei (original+3, brz+1) · Praktičnost, co vydrží (forester+2, cruiser+2)
5. **Přístup k penězům?** Co nejrozumněji (xv+2, forester+1, original+1) · Připlatím si za zážitek (rallyist+2, brz+2) · Nízká spotřeba a klid (cruiser+2, xv+1) · Sbírám/renovuju (original+2, brz+1)
6. **Roční období, na které se těšíš?** Zima, sníh, hory (outback+2, forester+2, rallyist+1) · Léto, zatáčky (brz+2, rallyist+1) · Je mi to jedno, jezdím pořád (cruiser+2, xv+1) · Sezona srazů (rallyist+2, original+1)
7. **Slovo, co tě vystihuje:** Dobrodruh (adventurer/outback+3) · Praktik (forester+2, cruiser+1) · Nadšenec (rallyist+2, brz+2) · Originál (original+3, brz+1)

### Znalostní otázky (10) — první návrh

1. Co znamená „boxer" u motoru Subaru? → **Válce leží vodorovně proti sobě** (protiběžné písty, nízké těžiště).
2. Jak se jmenuje pohon všech kol Subaru? → **Symmetrical AWD** (symetrický stálý pohon).
3. V kterém roce získalo Subaru první titul mistra světa značek v rallye (WRC)? → **1995**.
4. Který jezdec získal se Subaru titul mistra světa v rallye (1995) a zahynul 2007? → **Colin McRae**.
5. Co je „EJ20"? → **Legendární dvoulitrový boxer turbo motor**.
6. Který současný model Subaru je zadokolka (RWD), ne AWD? → **BRZ**.
7. Jak se jmenuje sportovní divize Subaru? → **STI (Subaru Tecnica International)**.
8. Z jaké země značka Subaru pochází? → **Japonsko**.
9. Co znázorňuje šest hvězd v logu Subaru? → **Souhvězdí Plejády** (japonsky „Subaru").
10. Který z těchto modelů je kultovní japonský kei car? → **Vivio**.

Každá otázka má 1 správnou + 3 distraktory + krátké `explanation`.

## 7. UX a vizuál (schváleno v mockupech)

Tmavý styl webu: `--color-bg #0a0a0c`, elevace `#131316`, akcent `#4a8dff`, sklo `rgba(255,255,255,.04)`, font Inter. Komponenty respektují stávající tokeny z `globals.css`.

- **Homepage blok** = dvě karty vedle sebe (na mobilu pod sebou): „Které Subaru se k tobě hodí?" (personální, primární CTA) + „Jak dobře znáš Subaru?" (znalostní, ghost CTA). Vloží se do `app/page.tsx`.
- **Obrazovka s otázkou** = tečkový progress nahoře, otázka, odpovědi jako **dlaždice 2×2 s ikonou/emoji**. Plynulý přechod mezi otázkami (`Reveal` pattern). Plně klávesnicově/touch ovladatelné, responsivní.
- **Výsledek personální** = archetyp label, foto modelu (`heroImageUrl`), „Tvé Subaru je **{name}**", blurb, CTA „Prohlédnout {name} →" na `/modely/[slug]`, „Zkusit znovu", sdílení.
- **Výsledek znalostní** = velké skóre `{n}/10`, krátký komentář dle pásma, projití chybných odpovědí (✅/❌ + správná + vysvětlení), „Zkusit znovu" + „Sdílet skóre".
- **Modal** = glass karta na ztmavené stránce, headline personálního kvízu, „Spustit kvíz →" + „Teď ne, díky" + křížek. Jednorázový (localStorage `csc_quiz_modal_seen`), trigger 8 s / exit-intent (desktop).

## 8. Sdílení

`ShareButton` (client):
- **Native share** přes `navigator.share` (mobil), fallback **kopírovat odkaz** + toast.
- Kanály: **kopírovat odkaz**, **X** (intent URL), **Facebook** (sharer URL). *(Instagram nemá web share intent → vynecháno, ať není mrtvé tlačítko; lze později řešit downloadem obrázku.)*
- **Personální**: sdílí se URL výsledkové stránky (`…/vysledek/outback`) s vlastním OG (title/desc/foto modelu).
- **Znalostní**: sdílí se text „Dal jsem **{n}/10** v kvízu Jak dobře znáš Subaru — zvládneš víc?" + URL kvízu.

## 9. SEO

- Hub, kvízové i výsledkové stránky **indexovatelné**; přidat do `app/sitemap.ts`.
- Výsledkové stránky = hodnotné landing pages („Tvé Subaru je Outback"); každá má `generateMetadata` (title/description) + **vlastní OG obrázek** přes `app/kviz/…/vysledek/[slug]/opengraph-image.tsx` (build-time PNG, stejný pattern jako stávající `app/opengraph-image.tsx`).
- Interní prolink výsledek → `/modely/[slug]` (posílení modelových stránek).
- Volitelně lehké JSON-LD (`BreadcrumbList`) — není blokující pro v1.

## 10. Analytika

Eventy přes stávající `Analytics` (gtag/dataLayer):
- `quiz_start` `{ quiz }`
- `quiz_complete` `{ quiz }`
- `quiz_result_model` `{ slug }` (personální)
- `quiz_score` `{ score }` (znalostní)
- `quiz_modal_open` / `quiz_modal_cta`

## 11. Komponenty (soupis)

| Soubor | Typ | Účel |
|---|---|---|
| `app/kviz/page.tsx` | server | Hub |
| `app/kviz/(components)/QuizCard.tsx` | server | Karta kvízu na hubu |
| `app/kviz/ktere-subaru-se-k-tobe-hodi/page.tsx` | server shell | Personální kvíz (renderuje `QuizRunner`) |
| `app/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/[slug]/page.tsx` | server | Výsledková stránka (+ `generateStaticParams`, integrita) |
| `app/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/[slug]/opengraph-image.tsx` | server | Per-outcome OG |
| `app/kviz/jak-dobre-znas-subaru/page.tsx` | server shell | Znalostní kvíz |
| `app/(components)/QuizRunner.tsx` | client | Generický engine (otázky, progress, skóre, navigace) |
| `app/(components)/QuizModal.tsx` | client | Jednorázový modal |
| `app/(components)/HomeQuizBlock.tsx` | server | Dvě karty na homepage |
| `app/(components)/ShareButton.tsx` | client | Sdílení |
| `lib/quizzes/*` | lib | Definice, typy, skórování, registr |
| `app/(components)/SiteHeader.tsx` | edit | Přidat odkaz „Kvíz" |
| `app/page.tsx` | edit | Vložit `HomeQuizBlock` |
| `app/sitemap.ts` | edit | Přidat kvízové routy |

## 12. Testy

- **TDD** `lib/quizzes/scoring.ts`: personální (váhy → vítěz, tie-break determinismus), znalostní (tally 0–10).
- Zod validační test definic (každá otázka má odpovědi, znalostní má platné `correctId`, personální `weights` referencují existující `OutcomeId`).
- Build-time integrita: `generateStaticParams` výsledkových stránek throwne, když `modelSlug` chybí v katalogu (ověřeno smoke buildem).
- Render smoke: hub / personální runner / znalostní runner / výsledková stránka se vykreslí bez chyby.

## 13. Constraints (static export)

- Žádné runtime API/SSR — vše build-time nebo client.
- DB se čte jen **build-time** (drizzle) pro jména/foto modelů a `generateStaticParams`.
- `QuizRunner`, `QuizModal`, `ShareButton` jsou `"use client"`.
- Sdílení a modal stav přes `navigator`/`localStorage` (graceful, když chybí).

## 14. Budoucí rozšíření (mimo v1)

- Další znalostní kvízy podle témat (historie, motory, WRC, modely) — hub je na to připravený.
- Editace kvízů přes content-network CMS.
- Sběr e-mailů / newsletter u výsledku.
- Dynamický OG i pro znalostní skóre.
- Instagram sdílení přes generovaný obrázek.
