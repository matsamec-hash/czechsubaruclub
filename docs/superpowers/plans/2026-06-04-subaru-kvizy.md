# Subaru kvízy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Přidat na czechsubaruclub.cz hub `/kviz` se dvěma kvízy (personální „Které Subaru se k tobě hodí?" + znalostní „Jak dobře znáš Subaru?"), vstupní body (homepage blok, menu, jemný modal) a sdílitelné výsledkové stránky.

**Architecture:** Definice kvízů jsou commitnuté zod-validované TS moduly v `lib/quizzes/`. Generický client `QuizRunner` řídí tok otázek a skórování (čisté funkce v `scoring.ts`). Personální výsledky jsou předrenderované statické stránky `/kviz/.../vysledek/[slug]` s vlastním OG, prolinkem na `/modely/[slug]`. Vše je static-export kompatibilní (DB se čte jen build-time).

**Tech Stack:** Next.js 16 App Router (output: export, trailingSlash), React 19, Tailwind v4, Drizzle ORM (Postgres `subaruclub` schema), zod v4, Vitest.

**Konvence projektu (z CLAUDE.md):** TDD platí pro čistou logiku v `lib/` (typy, skórování, definice). UI komponenty se neunit-testují — ověřují se přes `npm run build` (static export musí projít) + manuální smoke. Komunikace česky, kód/komentáře/commity anglicky. Tabulky jen v `subaruclub` schema. Tailwind v4 (žádný `tailwind.config.js`).

**Tmavý design (tokeny z `app/globals.css`):** pozadí `#0a0a0c`, elevace `#131316`, akcent `#4a8dff`, světlý akcent `#88b8ff`, text `#fafafa`, ztlumený `text-white/60`, linky `border-white/[0.06]`. Font Inter. Komponenty používají Tailwind utility třídy jako zbytek webu.

---

## File Structure

**Vytvořit:**
- `lib/quizzes/types.ts` — zod schémata + TS typy
- `lib/quizzes/scoring.ts` — čisté skórovací funkce
- `lib/quizzes/ktere-subaru.ts` — personální definice
- `lib/quizzes/jak-dobre-znas.ts` — znalostní definice
- `lib/quizzes/index.ts` — registr + `getQuiz()`
- `tests/unit/quizzes/scoring.test.ts`
- `tests/unit/quizzes/definitions.test.ts`
- `app/(components)/QuizRunner.tsx` — generický client engine
- `app/(components)/ShareButton.tsx` — client sdílení
- `app/(components)/QuizModal.tsx` — jednorázový modal (client)
- `app/(components)/HomeQuizBlock.tsx` — dvě karty na homepage (server)
- `app/kviz/page.tsx` — hub (server)
- `app/kviz/(components)/QuizCard.tsx` — karta na hubu (server)
- `app/kviz/ktere-subaru-se-k-tobe-hodi/page.tsx` — personální kvíz
- `app/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/[slug]/page.tsx` — výsledková stránka
- `app/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/[slug]/opengraph-image.tsx` — per-outcome OG
- `app/kviz/jak-dobre-znas-subaru/page.tsx` — znalostní kvíz

**Upravit:**
- `app/(components)/SiteHeader.tsx` — odkaz „Kvíz" do nav
- `app/page.tsx` — vložit `<HomeQuizBlock />`
- `app/layout.tsx` — mount `<QuizModal />`
- `app/sitemap.ts` — přidat kvízové routy

---

## Task 1: Typy a zod schémata kvízů

**Files:**
- Create: `lib/quizzes/types.ts`
- Test: `tests/unit/quizzes/definitions.test.ts` (založíme v Tasku 3; tady jen typy)

- [ ] **Step 1: Vytvořit `lib/quizzes/types.ts`**

```ts
import { z } from "zod";

/** Jeden výběr odpovědi. `weights` mapuje OutcomeId → body (jen personální kvíz). */
export const answerSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  icon: z.string().optional(),
  weights: z.record(z.string(), z.number()).default({}),
});

export const questionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  answers: z.array(answerSchema).min(2),
});

export const outcomeSchema = z.object({
  id: z.string().min(1),
  modelSlug: z.string().min(1),
  archetype: z.string().min(1),
  emoji: z.string().min(1),
  blurb: z.string().min(1),
});

export const knowledgeQuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  answers: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(2),
  correctId: z.string().min(1),
  explanation: z.string().min(1),
});

export const personalityQuizSchema = z.object({
  kind: z.literal("personality"),
  slug: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().min(1),
  questions: z.array(questionSchema).min(1),
  outcomes: z.array(outcomeSchema).min(2),
});

export const knowledgeQuizSchema = z.object({
  kind: z.literal("knowledge"),
  slug: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().min(1),
  questions: z.array(knowledgeQuestionSchema).min(1),
});

export const quizSchema = z.discriminatedUnion("kind", [
  personalityQuizSchema,
  knowledgeQuizSchema,
]);

export type Answer = z.infer<typeof answerSchema>;
export type Question = z.infer<typeof questionSchema>;
export type Outcome = z.infer<typeof outcomeSchema>;
export type KnowledgeQuestion = z.infer<typeof knowledgeQuestionSchema>;
export type PersonalityQuiz = z.infer<typeof personalityQuizSchema>;
export type KnowledgeQuiz = z.infer<typeof knowledgeQuizSchema>;
export type Quiz = z.infer<typeof quizSchema>;
```

- [ ] **Step 2: Ověřit kompilaci typů**

Run: `npx tsc --noEmit`
Expected: PASS (žádné chyby v `lib/quizzes/types.ts`).

- [ ] **Step 3: Commit**

```bash
git add lib/quizzes/types.ts
git commit -m "feat(quizzes): add zod schemas and types for quiz definitions"
```

---

## Task 2: Skórovací engine (TDD)

**Files:**
- Create: `lib/quizzes/scoring.ts`
- Test: `tests/unit/quizzes/scoring.test.ts`

- [ ] **Step 1: Napsat padající test**

```ts
// tests/unit/quizzes/scoring.test.ts
import { describe, it, expect } from "vitest";
import { scorePersonality, scoreKnowledge } from "@/lib/quizzes/scoring";
import type { PersonalityQuiz, KnowledgeQuiz } from "@/lib/quizzes/types";

const personality: PersonalityQuiz = {
  kind: "personality",
  slug: "p",
  title: "P",
  intro: "i",
  outcomes: [
    { id: "alpha", modelSlug: "a", archetype: "A", emoji: "🅰️", blurb: "b" },
    { id: "beta", modelSlug: "b", archetype: "B", emoji: "🅱️", blurb: "b" },
  ],
  questions: [
    {
      id: "q1",
      text: "q1",
      answers: [
        { id: "q1a", text: "a", weights: { alpha: 3 } },
        { id: "q1b", text: "b", weights: { beta: 1 } },
      ],
    },
    {
      id: "q2",
      text: "q2",
      answers: [
        { id: "q2a", text: "a", weights: { beta: 2 } },
        { id: "q2b", text: "b", weights: { alpha: 1 } },
      ],
    },
  ],
};

const knowledge: KnowledgeQuiz = {
  kind: "knowledge",
  slug: "k",
  title: "K",
  intro: "i",
  questions: [
    { id: "k1", text: "k1", correctId: "k1b", explanation: "e", answers: [
      { id: "k1a", text: "a" }, { id: "k1b", text: "b" } ] },
    { id: "k2", text: "k2", correctId: "k2a", explanation: "e", answers: [
      { id: "k2a", text: "a" }, { id: "k2b", text: "b" } ] },
  ],
};

describe("scorePersonality", () => {
  it("picks the outcome with the highest total weight", () => {
    // alpha: 3 (q1a) ; beta: 2 (q2a) -> alpha wins
    expect(scorePersonality(personality, { q1: "q1a", q2: "q2a" })).toBe("alpha");
  });

  it("ignores missing/unknown answers", () => {
    // only q2b answered -> alpha 1, beta 0 -> alpha
    expect(scorePersonality(personality, { q2: "q2b" })).toBe("alpha");
  });

  it("breaks ties by outcome order (first outcome wins)", () => {
    // q1b -> beta 1 ; q2b -> alpha 1 ; tie -> first outcome 'alpha'
    expect(scorePersonality(personality, { q1: "q1b", q2: "q2b" })).toBe("alpha");
  });
});

describe("scoreKnowledge", () => {
  it("counts correct answers", () => {
    expect(scoreKnowledge(knowledge, { k1: "k1b", k2: "k2a" })).toEqual({ score: 2, total: 2 });
  });

  it("counts wrong/missing as incorrect", () => {
    expect(scoreKnowledge(knowledge, { k1: "k1a" })).toEqual({ score: 0, total: 2 });
  });
});
```

- [ ] **Step 2: Spustit test — musí padnout**

Run: `npm run test -- scoring`
Expected: FAIL ("Cannot find module '@/lib/quizzes/scoring'").

- [ ] **Step 3: Implementovat `lib/quizzes/scoring.ts`**

```ts
import type { PersonalityQuiz, KnowledgeQuiz } from "./types";

/** Vrátí OutcomeId s nejvyšším součtem vah. Tie-break = pořadí v `quiz.outcomes`. */
export function scorePersonality(
  quiz: PersonalityQuiz,
  answers: Record<string, string>,
): string {
  const totals: Record<string, number> = {};
  for (const o of quiz.outcomes) totals[o.id] = 0;

  for (const q of quiz.questions) {
    const ans = q.answers.find((a) => a.id === answers[q.id]);
    if (!ans) continue;
    for (const [outcomeId, weight] of Object.entries(ans.weights)) {
      totals[outcomeId] = (totals[outcomeId] ?? 0) + weight;
    }
  }

  // Strict `>` znamená, že při shodě zůstane dříve iterovaný (vyšší priorita) outcome.
  let bestId = quiz.outcomes[0].id;
  let bestScore = -Infinity;
  for (const o of quiz.outcomes) {
    if (totals[o.id] > bestScore) {
      bestScore = totals[o.id];
      bestId = o.id;
    }
  }
  return bestId;
}

export function scoreKnowledge(
  quiz: KnowledgeQuiz,
  answers: Record<string, string>,
): { score: number; total: number } {
  let score = 0;
  for (const q of quiz.questions) {
    if (answers[q.id] === q.correctId) score += 1;
  }
  return { score, total: quiz.questions.length };
}
```

- [ ] **Step 4: Spustit test — musí projít**

Run: `npm run test -- scoring`
Expected: PASS (5 testů).

- [ ] **Step 5: Commit**

```bash
git add lib/quizzes/scoring.ts tests/unit/quizzes/scoring.test.ts
git commit -m "feat(quizzes): add personality and knowledge scoring engine"
```

---

## Task 3: Definice kvízů + registr + integrity test

**Files:**
- Create: `lib/quizzes/ktere-subaru.ts`, `lib/quizzes/jak-dobre-znas.ts`, `lib/quizzes/index.ts`
- Test: `tests/unit/quizzes/definitions.test.ts`

- [ ] **Step 1: Vytvořit `lib/quizzes/ktere-subaru.ts`**

```ts
import { personalityQuizSchema, type PersonalityQuiz } from "./types";

// OutcomeId -> modelSlug:
// adventurer=outback, outdoorist=forester, allrounder=xv,
// rallyist=wrx-sti, purist=brz, cruiser=levorg, original=vivio
const def = {
  kind: "personality",
  slug: "ktere-subaru-se-k-tobe-hodi",
  title: "Které Subaru se k tobě hodí?",
  intro: "Sedm rychlých otázek a víš, který model je tvůj parťák.",
  outcomes: [
    { id: "adventurer", modelSlug: "outback", archetype: "Dobrodruh", emoji: "🏔️",
      blurb: "Chceš zajet na chatu po šotolině i pohodlně přejet republiku. Vysoký podvozek, symetrický AWD a kombík prostor — parťák na výlety i všední dny." },
    { id: "outdoorist", modelSlug: "forester", archetype: "Praktický outdoorista", emoji: "🌲",
      blurb: "Spolehlivý, prostorný a nezničitelný společník do každého počasí. Když má auto sloužit a vydržet, Forester je jistota." },
    { id: "allrounder", modelSlug: "xv", archetype: "Městský all-roader", emoji: "🏙️",
      blurb: "Rozumný kompromis: kompaktní do města, přesto se neztratíš na polňačce. Jeden vůz, který zvládne skoro všechno." },
    { id: "rallyist", modelSlug: "wrx-sti", archetype: "Rallye srdcař", emoji: "🏁",
      blurb: "Modrá se zlatými koly ti není ukradená. Turbo boxer, WRC geny a chuť po pořádné porci adrenalinu — tvoje krev je rallye." },
    { id: "purist", modelSlug: "brz", archetype: "Řidič-purista", emoji: "🎯",
      blurb: "Žádný balast, jen ty, volant a zatáčky. Lehká zadokolka pro radost z čisté jízdy." },
    { id: "cruiser", modelSlug: "levorg", archetype: "Klidný kilometrožrout", emoji: "🛣️",
      blurb: "Najezdíš hodně a chceš to v klidu a pohodlí. Moderní kombík, co spolkne kilometry i bagáž bez stresu." },
    { id: "original", modelSlug: "vivio", archetype: "Originál", emoji: "✨",
      blurb: "Nechceš to, co má každý. JDM kei kuriozity a srdcovky, co rozsvítí každý sraz — tvoje volba je o lásce, ne o rozumu." },
  ],
  questions: [
    { id: "kde", text: "Kde nejčastěji jezdíš?", answers: [
      { id: "mesto", text: "Město a okolí", icon: "🏙️", weights: { allrounder: 2, purist: 1 } },
      { id: "teren", text: "Šotolina, hory, chata", icon: "🏔️", weights: { adventurer: 3, outdoorist: 2 } },
      { id: "okruh", text: "Okruh / klikaté silnice", icon: "🏁", weights: { purist: 3, rallyist: 2 } },
      { id: "dalnice", text: "Dlouhé tahy přes republiku", icon: "🛣️", weights: { cruiser: 2, adventurer: 1 } },
    ] },
    { id: "ocekavani", text: "Co od auta čekáš nejvíc?", answers: [
      { id: "partak", text: "Spolehlivý parťák na všechno", icon: "🤝", weights: { outdoorist: 3, adventurer: 1 } },
      { id: "zabava", text: "Zábavu za volantem", icon: "😈", weights: { purist: 3, rallyist: 2 } },
      { id: "pohodli", text: "Pohodlí a prostor", icon: "🛋️", weights: { cruiser: 2, adventurer: 2 } },
      { id: "neotrele", text: "Něco neotřelého", icon: "✨", weights: { original: 3, purist: 1 } },
    ] },
    { id: "naklad", text: "Kolik vozíš lidí a věcí?", answers: [
      { id: "nalehko", text: "Sám nebo ve dvou, nalehko", icon: "🎒", weights: { purist: 2, original: 2, rallyist: 1 } },
      { id: "rodina", text: "Rodina, pes a bagáž", icon: "🐕", weights: { adventurer: 2, outdoorist: 2, cruiser: 1 } },
      { id: "parta", text: "Občas parta kamarádů", icon: "🧑‍🤝‍🧑", weights: { cruiser: 2, outdoorist: 1 } },
      { id: "naradi", text: "Hlavně sebe a kufr nářadí", icon: "🧰", weights: { original: 1, outdoorist: 1 } },
    ] },
    { id: "vztah", text: "Tvůj vztah k Subaru?", answers: [
      { id: "awd", text: "Symetrický AWD a boxer, jinak nedám", icon: "⚙️", weights: { adventurer: 2, outdoorist: 2, rallyist: 1 } },
      { id: "wrc", text: "WRC sláva, modrá se zlatými koly", icon: "🏆", weights: { rallyist: 3 } },
      { id: "jdm", text: "JDM kuriozity a kei srdcovky", icon: "🇯🇵", weights: { original: 3, purist: 1 } },
      { id: "vydrz", text: "Praktičnost, co vydrží", icon: "🔧", weights: { outdoorist: 2, cruiser: 2 } },
    ] },
    { id: "penize", text: "Jaký máš přístup k penězům?", answers: [
      { id: "rozumne", text: "Co nejrozumněji", icon: "💡", weights: { allrounder: 2, outdoorist: 1, original: 1 } },
      { id: "zazitek", text: "Připlatím si za zážitek", icon: "💸", weights: { rallyist: 2, purist: 2 } },
      { id: "spotreba", text: "Hlavně nízká spotřeba a klid", icon: "⛽", weights: { cruiser: 2, allrounder: 1 } },
      { id: "sbiram", text: "Sbírám a renovuju, peníze řeším potom", icon: "🛠️", weights: { original: 2, purist: 1 } },
    ] },
    { id: "sezona", text: "Na které roční období se těšíš?", answers: [
      { id: "zima", text: "Zima, sníh, hory", icon: "❄️", weights: { adventurer: 2, outdoorist: 2, rallyist: 1 } },
      { id: "leto", text: "Léto, otevřené okno, zatáčky", icon: "☀️", weights: { purist: 2, rallyist: 1 } },
      { id: "porad", text: "Je mi to jedno, jezdím pořád", icon: "🔁", weights: { cruiser: 2, allrounder: 1 } },
      { id: "srazy", text: "Sezona srazů a tuningu", icon: "🔊", weights: { rallyist: 2, original: 1 } },
    ] },
    { id: "slovo", text: "Vyber slovo, co tě vystihuje:", answers: [
      { id: "dobrodruh", text: "Dobrodruh", icon: "🧭", weights: { adventurer: 3 } },
      { id: "praktik", text: "Praktik", icon: "📐", weights: { outdoorist: 2, cruiser: 1 } },
      { id: "nadsenec", text: "Nadšenec", icon: "🔥", weights: { rallyist: 2, purist: 2 } },
      { id: "original", text: "Originál", icon: "💎", weights: { original: 3, purist: 1 } },
    ] },
  ],
} satisfies PersonalityQuiz;

// Validace při importu — build spadne na chybné definici.
export const ktereSubaru: PersonalityQuiz = personalityQuizSchema.parse(def);
```

- [ ] **Step 2: Vytvořit `lib/quizzes/jak-dobre-znas.ts`**

```ts
import { knowledgeQuizSchema, type KnowledgeQuiz } from "./types";

const def = {
  kind: "knowledge",
  slug: "jak-dobre-znas-subaru",
  title: "Jak dobře znáš Subaru?",
  intro: "Deset otázek z historie, techniky i legend značky. Zvládneš plný počet?",
  questions: [
    { id: "boxer", text: "Co znamená „boxer\" u motoru Subaru?",
      answers: [
        { id: "boxer-a", text: "Válce uspořádané do V" },
        { id: "boxer-b", text: "Válce leží vodorovně proti sobě" },
        { id: "boxer-c", text: "Válce v jedné řadě za sebou" },
        { id: "boxer-d", text: "Válce do hvězdy" },
      ], correctId: "boxer-b",
      explanation: "Protilehlé písty „boxují\" proti sobě. Plochá konstrukce dává nízké těžiště a typický zvuk." },
    { id: "awd", text: "Jak se jmenuje pohon všech kol Subaru?",
      answers: [
        { id: "awd-a", text: "Quattro" },
        { id: "awd-b", text: "xDrive" },
        { id: "awd-c", text: "Symmetrical AWD" },
        { id: "awd-d", text: "4Matic" },
      ], correctId: "awd-c",
      explanation: "Symetrický stálý pohon všech kol — souměrné rozložení hnacího ústrojí kolem osy vozu." },
    { id: "wrc-rok", text: "Kdy získalo Subaru první titul mistra světa značek v rallye (WRC)?",
      answers: [
        { id: "wrc-a", text: "1990" },
        { id: "wrc-b", text: "1993" },
        { id: "wrc-c", text: "1995" },
        { id: "wrc-d", text: "2001" },
      ], correctId: "wrc-c",
      explanation: "Subaru vyhrálo titul značek 1995, 1996 i 1997 s vozem Impreza 555." },
    { id: "mcrae", text: "Který jezdec získal se Subaru titul mistra světa v rallye (1995) a zahynul 2007?",
      answers: [
        { id: "mcrae-a", text: "Colin McRae" },
        { id: "mcrae-b", text: "Richard Burns" },
        { id: "mcrae-c", text: "Petter Solberg" },
        { id: "mcrae-d", text: "Tommi Mäkinen" },
      ], correctId: "mcrae-a",
      explanation: "Colin McRae — ikona značky. Mistr světa 1995, zahynul při havárii vrtulníku v roce 2007." },
    { id: "ej20", text: "Co je „EJ20\"?",
      answers: [
        { id: "ej20-a", text: "Model Subaru z 80. let" },
        { id: "ej20-b", text: "Legendární dvoulitrový boxer turbo motor" },
        { id: "ej20-c", text: "Typ převodovky" },
        { id: "ej20-d", text: "Závodní tým" },
      ], correctId: "ej20-b",
      explanation: "EJ20 = kultovní 2,0l boxer, srdce Imprezy WRX/STI po mnoho generací." },
    { id: "rwd", text: "Který současný model Subaru je zadokolka (RWD), ne AWD?",
      answers: [
        { id: "rwd-a", text: "Impreza" },
        { id: "rwd-b", text: "Forester" },
        { id: "rwd-c", text: "BRZ" },
        { id: "rwd-d", text: "Outback" },
      ], correctId: "rwd-c",
      explanation: "BRZ je výjimka — lehké sportovní kupé s pohonem zadních kol, vyvinuté s Toyotou (GR86)." },
    { id: "sti", text: "Jak se jmenuje sportovní divize Subaru?",
      answers: [
        { id: "sti-a", text: "AMG" },
        { id: "sti-b", text: "STI (Subaru Tecnica International)" },
        { id: "sti-c", text: "Nismo" },
        { id: "sti-d", text: "M Power" },
      ], correctId: "sti-b",
      explanation: "STI = Subaru Tecnica International, závodní a high-performance divize značky." },
    { id: "zeme", text: "Z jaké země značka Subaru pochází?",
      answers: [
        { id: "zeme-a", text: "Německo" },
        { id: "zeme-b", text: "Korea" },
        { id: "zeme-c", text: "Japonsko" },
        { id: "zeme-d", text: "USA" },
      ], correctId: "zeme-c",
      explanation: "Japonsko — Subaru je automobilová divize společnosti Subaru Corporation (dříve Fuji Heavy Industries)." },
    { id: "logo", text: "Co znázorňuje šest hvězd v logu Subaru?",
      answers: [
        { id: "logo-a", text: "Souhvězdí Plejády" },
        { id: "logo-b", text: "Šest zakladatelů firmy" },
        { id: "logo-c", text: "Šest kontinentů" },
        { id: "logo-d", text: "Velký vůz" },
      ], correctId: "logo-a",
      explanation: "„Subaru\" je japonský název hvězdokupy Plejády. Hvězdy odkazují na šest firem spojených do Fuji Heavy Industries." },
    { id: "kei", text: "Který z těchto modelů je kultovní japonský kei car?",
      answers: [
        { id: "kei-a", text: "Outback" },
        { id: "kei-b", text: "Legacy" },
        { id: "kei-c", text: "Vivio" },
        { id: "kei-d", text: "Tribeca" },
      ], correctId: "kei-c",
      explanation: "Vivio je drobný kei car — miniaturní třída japonských vozů s přísnými limity rozměrů a objemu motoru." },
  ],
} satisfies KnowledgeQuiz;

export const jakDobreZnas: KnowledgeQuiz = knowledgeQuizSchema.parse(def);
```

- [ ] **Step 3: Vytvořit `lib/quizzes/index.ts`**

```ts
import { ktereSubaru } from "./ktere-subaru";
import { jakDobreZnas } from "./jak-dobre-znas";
import type { Quiz } from "./types";

export const QUIZZES: Quiz[] = [ktereSubaru, jakDobreZnas];

export function getQuiz(slug: string): Quiz | undefined {
  return QUIZZES.find((q) => q.slug === slug);
}

export { ktereSubaru, jakDobreZnas };
export * from "./types";
```

- [ ] **Step 4: Napsat integrity test `tests/unit/quizzes/definitions.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { QUIZZES, ktereSubaru, jakDobreZnas } from "@/lib/quizzes";

describe("quiz registry", () => {
  it("má unikátní slugy", () => {
    const slugs = QUIZZES.map((q) => q.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("personální definice", () => {
  const outcomeIds = new Set(ktereSubaru.outcomes.map((o) => o.id));

  it("všechny váhy odkazují na existující OutcomeId", () => {
    for (const q of ktereSubaru.questions) {
      for (const a of q.answers) {
        for (const key of Object.keys(a.weights)) {
          expect(outcomeIds.has(key), `${q.id}/${a.id} -> ${key}`).toBe(true);
        }
      }
    }
  });

  it("každý outcome má neprázdný modelSlug", () => {
    for (const o of ktereSubaru.outcomes) {
      expect(o.modelSlug.length).toBeGreaterThan(0);
    }
  });

  it("má 7 otázek", () => {
    expect(ktereSubaru.questions.length).toBe(7);
  });
});

describe("znalostní definice", () => {
  it("correctId vždy ukazuje na existující odpověď", () => {
    for (const q of jakDobreZnas.questions) {
      const ids = q.answers.map((a) => a.id);
      expect(ids).toContain(q.correctId);
    }
  });

  it("má 10 otázek", () => {
    expect(jakDobreZnas.questions.length).toBe(10);
  });
});
```

- [ ] **Step 5: Spustit test — musí projít**

Run: `npm run test -- definitions`
Expected: PASS (6 testů). Pokud zod při importu vyhodí chybu, oprav definici (chyba ukáže konkrétní pole).

- [ ] **Step 6: Commit**

```bash
git add lib/quizzes/ktere-subaru.ts lib/quizzes/jak-dobre-znas.ts lib/quizzes/index.ts tests/unit/quizzes/definitions.test.ts
git commit -m "feat(quizzes): add personality + knowledge quiz definitions and registry"
```

---

## Task 4: QuizRunner (generický client engine)

**Files:**
- Create: `app/(components)/QuizRunner.tsx`

UI vychází ze schválených mockupů: tečkový progress, otázka, odpovědi jako dlaždice 2×2 s ikonou. Personální kvíz po dokončení naviguje na výsledkovou stránku; znalostní zobrazí skóre + projití odpovědí inline.

- [ ] **Step 1: Vytvořit `app/(components)/QuizRunner.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { scorePersonality, scoreKnowledge } from "@/lib/quizzes/scoring";
import type { Quiz } from "@/lib/quizzes/types";
import { ShareButton } from "./ShareButton";

function track(event: string, params: Record<string, unknown>) {
  if (typeof window !== "undefined") window.gtag?.("event", event, params);
}

export function QuizRunner({ quiz }: { quiz: Quiz }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const total = quiz.questions.length;
  const question = quiz.questions[index];

  function pick(answerId: string) {
    if (!started) {
      setStarted(true);
      track("quiz_start", { quiz: quiz.slug });
    }
    const next = { ...answers, [question.id]: answerId };
    setAnswers(next);

    if (index + 1 < total) {
      setIndex(index + 1);
      return;
    }
    // Poslední otázka -> vyhodnocení.
    track("quiz_complete", { quiz: quiz.slug });
    if (quiz.kind === "personality") {
      const outcomeId = scorePersonality(quiz, next);
      const outcome = quiz.outcomes.find((o) => o.id === outcomeId)!;
      track("quiz_result_model", { slug: outcome.modelSlug });
      router.push(`/kviz/${quiz.slug}/vysledek/${outcome.modelSlug}/`);
    } else {
      setFinished(true);
    }
  }

  if (finished && quiz.kind === "knowledge") {
    return <KnowledgeResult quiz={quiz} answers={answers} onRetry={reset} />;
  }

  function reset() {
    setIndex(0);
    setAnswers({});
    setStarted(false);
    setFinished(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* tečkový progress */}
      <div className="flex gap-1.5 mb-6">
        {quiz.questions.map((q, i) => (
          <span
            key={q.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= index ? "bg-[#4a8dff]" : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <div className="text-[11px] uppercase tracking-[0.12em] text-white/40 mb-2">
        Otázka {index + 1} / {total}
      </div>
      <h1 className="text-[clamp(20px,3vw,28px)] font-semibold tracking-tight text-white mb-8 leading-snug">
        {question.text}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.answers.map((a) => (
          <button
            key={a.id}
            onClick={() => pick(a.id)}
            className="text-left rounded-xl border border-white/10 bg-[#16161b] px-4 py-4 hover:border-[#4a8dff] hover:bg-[#4a8dff]/10 transition focus:outline-none focus:border-[#4a8dff]"
          >
            {a.icon && <span className="block text-2xl mb-2">{a.icon}</span>}
            <span className="text-[14px] text-white/90">{a.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function KnowledgeResult({
  quiz,
  answers,
  onRetry,
}: {
  quiz: Extract<Quiz, { kind: "knowledge" }>;
  answers: Record<string, string>;
  onRetry: () => void;
}) {
  const { score, total } = scoreKnowledge(quiz, answers);
  const comment =
    score >= 9 ? "Subaru guru! Klobouk dolů." :
    score >= 6 ? "Slušný přehled. Pár chytáků tě dostalo." :
    score >= 3 ? "Základ máš, je co dohánět." :
    "Tady je prostor růst — projdi si odpovědi níž.";
  const shareText = `Dal jsem ${score}/${total} v kvízu Jak dobře znáš Subaru — zvládneš víc?`;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-[11px] uppercase tracking-[0.12em] text-[#4a8dff] mb-3">
        🏁 {quiz.title}
      </div>
      <div className="text-[clamp(44px,8vw,64px)] font-extrabold tracking-tight leading-none">
        <span className="text-[#4a8dff]">{score}</span>
        <span className="text-white/40">/{total}</span>
      </div>
      <p className="text-white/70 mt-3 mb-8">{comment}</p>

      <div className="space-y-2 mb-10">
        {quiz.questions.map((q) => {
          const picked = answers[q.id];
          const correct = picked === q.correctId;
          const correctText = q.answers.find((a) => a.id === q.correctId)?.text ?? "";
          const pickedText = q.answers.find((a) => a.id === picked)?.text ?? "—";
          return (
            <div key={q.id} className="rounded-lg border border-white/[0.08] bg-[#16161b] p-3 text-[13px]">
              <div className="flex gap-2">
                <span>{correct ? "✅" : "❌"}</span>
                <div>
                  <div className="text-white/90">{q.text}</div>
                  {!correct && (
                    <div className="text-white/50 mt-1">
                      tvá: <span className="text-[#ff9f9f]">{pickedText}</span>
                      {" · "}správně: <span className="text-[#9fe0a0]">{correctText}</span>
                    </div>
                  )}
                  <div className="text-white/40 mt-1">{q.explanation}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onRetry}
          className="rounded-lg bg-[#4a8dff] text-white font-semibold text-sm px-5 py-2.5 hover:bg-[#3a7def] transition"
        >
          Zkusit znovu
        </button>
        <ShareButton
          url={`https://czechsubaruclub.cz/kviz/${quiz.slug}/`}
          title={quiz.title}
          text={shareText}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Ověřit typy (ShareButton zatím neexistuje → očekávej chybu)**

Run: `npx tsc --noEmit`
Expected: chyba „Cannot find module './ShareButton'" — vyřeší se v Tasku 5. Jinak žádné jiné chyby v `QuizRunner.tsx`.

- [ ] **Step 3: Commit**

```bash
git add "app/(components)/QuizRunner.tsx"
git commit -m "feat(quizzes): add generic QuizRunner client engine"
```

---

## Task 5: ShareButton

**Files:**
- Create: `app/(components)/ShareButton.tsx`

- [ ] **Step 1: Vytvořit `app/(components)/ShareButton.tsx`**

```tsx
"use client";

import { useState } from "react";

export function ShareButton({
  url,
  title,
  text,
}: {
  url: string;
  title: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  async function nativeOrCopy() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* uživatel zavřel share sheet — spadneme do kopírování */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard nedostupný — tichý no-op */
    }
  }

  const enc = encodeURIComponent;
  const x = `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;

  const pill =
    "inline-flex items-center justify-center h-9 px-3 rounded-lg border border-white/12 bg-[#16161b] text-[13px] text-white/80 hover:border-[#4a8dff] hover:text-white transition";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={nativeOrCopy} className={pill} aria-label="Sdílet / kopírovat odkaz">
        {copied ? "✓ Zkopírováno" : "🔗 Sdílet"}
      </button>
      <a href={x} target="_blank" rel="noopener noreferrer" className={pill} aria-label="Sdílet na X">
        𝕏
      </a>
      <a href={fb} target="_blank" rel="noopener noreferrer" className={pill} aria-label="Sdílet na Facebooku">
        f
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Ověřit typy**

Run: `npx tsc --noEmit`
Expected: PASS (i `QuizRunner.tsx` teď projde).

- [ ] **Step 3: Commit**

```bash
git add "app/(components)/ShareButton.tsx"
git commit -m "feat(quizzes): add ShareButton (native share + copy + X/FB)"
```

---

## Task 6: Stránka personálního kvízu

**Files:**
- Create: `app/kviz/ktere-subaru-se-k-tobe-hodi/page.tsx`

- [ ] **Step 1: Vytvořit `app/kviz/ktere-subaru-se-k-tobe-hodi/page.tsx`**

```tsx
import type { Metadata } from "next";
import { ktereSubaru } from "@/lib/quizzes";
import { QuizRunner } from "@/app/(components)/QuizRunner";

export const metadata: Metadata = {
  title: "Které Subaru se k tobě hodí? — kvíz",
  description:
    "Krátký kvíz: odpověz na 7 otázek a zjisti, který model Subaru je přesně pro tebe — od Outbacku po BRZ.",
  alternates: { canonical: "/kviz/ktere-subaru-se-k-tobe-hodi" },
};

export default function Page() {
  return <QuizRunner quiz={ktereSubaru} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/kviz/ktere-subaru-se-k-tobe-hodi/page.tsx
git commit -m "feat(quizzes): add personality quiz page"
```

---

## Task 7: Výsledková stránka [slug] + integrita

**Files:**
- Create: `app/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/[slug]/page.tsx`

Stránka je předrenderovaná pro každý `modelSlug` z outcomes. Build **spadne**, když model v katalogu chybí (integrita). Načítá jméno/foto modelu z DB stejně jako `/modely/[slug]`.

- [ ] **Step 1: Vytvořit `app/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { ktereSubaru } from "@/lib/quizzes";
import { ShareButton } from "@/app/(components)/ShareButton";

export const dynamicParams = false;

function outcomeForSlug(slug: string) {
  return ktereSubaru.outcomes.find((o) => o.modelSlug === slug);
}

async function fetchModel(slug: string) {
  const rows = await db
    .select()
    .from(schema.models)
    .where(eq(schema.models.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export function generateStaticParams() {
  return ktereSubaru.outcomes.map((o) => ({ slug: o.modelSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const outcome = outcomeForSlug(slug);
  const model = await fetchModel(slug);
  const name = model?.name ?? slug;
  const title = `Tvé Subaru je ${name}`;
  const desc = outcome?.blurb ?? `Výsledek kvízu: ${name}.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/${slug}` },
    openGraph: { title, description: desc, type: "article" },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const outcome = outcomeForSlug(slug);
  if (!outcome) notFound();

  const model = await fetchModel(slug);
  // Integrita: outcome odkazuje na model, který v katalogu musí existovat.
  if (!model) {
    throw new Error(
      `[kviz] Výsledek odkazuje na neexistující model "${slug}". Oprav modelSlug v lib/quizzes/ktere-subaru.ts nebo doplň model do katalogu.`,
    );
  }

  const shareUrl = `https://czechsubaruclub.cz/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/${slug}/`;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div
        className="rounded-2xl border border-white/[0.08] p-6 sm:p-8"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(74,141,255,.16), transparent 60%), #0e0e12",
        }}
      >
        <div className="text-[11px] uppercase tracking-[0.14em] text-[#4a8dff] mb-3">
          {outcome.emoji} Tvůj typ je {outcome.archetype.toLowerCase()}
        </div>

        {model.heroImageUrl && (
          <img
            src={model.heroImageUrl}
            alt={model.name}
            className="w-full h-48 sm:h-56 object-cover rounded-xl border border-white/[0.08] mb-5"
          />
        )}

        <div className="text-[11px] uppercase tracking-[0.14em] text-white/40 mb-1">
          Tvé Subaru je
        </div>
        <h1 className="text-[clamp(28px,5vw,40px)] font-extrabold tracking-tight text-white mb-4 leading-none">
          {model.name}
        </h1>
        <p className="text-[15px] text-white/70 leading-relaxed mb-7">
          {outcome.blurb}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/modely/${slug}`}
            className="rounded-lg bg-[#4a8dff] text-white font-semibold text-sm px-5 py-2.5 hover:bg-[#3a7def] transition"
          >
            Prohlédnout {model.name} →
          </Link>
          <Link
            href="/kviz/ktere-subaru-se-k-tobe-hodi"
            className="rounded-lg border border-white/12 text-white/80 text-sm px-5 py-2.5 hover:border-[#4a8dff] hover:text-white transition"
          >
            Zkusit znovu
          </Link>
        </div>

        <div className="mt-6">
          <ShareButton
            url={shareUrl}
            title={`Tvé Subaru je ${model.name}`}
            text={`Můj výsledek: ${model.name}. Které Subaru se hodí k tobě?`}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Ověřit typy**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "app/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/[slug]/page.tsx"
git commit -m "feat(quizzes): add personality result pages with catalog integrity check"
```

---

## Task 8: Per-outcome OG obrázek

**Files:**
- Create: `app/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/[slug]/opengraph-image.tsx`

Text-only OG (žádné remote obrázky → robustní build). Vychází z patternu stávajícího `app/opengraph-image.tsx`.

- [ ] **Step 1: Vytvořit `app/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/[slug]/opengraph-image.tsx`**

```tsx
import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { ktereSubaru } from "@/lib/quizzes";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return ktereSubaru.outcomes.map((o) => ({ slug: o.modelSlug }));
}

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const outcome = ktereSubaru.outcomes.find((o) => o.modelSlug === slug);
  const rows = await db
    .select({ name: schema.models.name })
    .from(schema.models)
    .where(eq(schema.models.slug, slug))
    .limit(1);
  const name = rows[0]?.name ?? slug;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(ellipse 90% 70% at 50% 0%, rgba(74,141,255,0.25), transparent 60%), #0a0a0c",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, color: "#4a8dff", letterSpacing: 2 }}>
          {outcome?.emoji ?? "🚗"} {(outcome?.archetype ?? "Výsledek kvízu").toUpperCase()}
        </div>
        <div style={{ fontSize: 34, color: "#a1a1a8", marginTop: 24 }}>
          Tvé Subaru je
        </div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1 }}>{name}</div>
        <div style={{ fontSize: 26, color: "#88b8ff", marginTop: 40 }}>
          czechsubaruclub.cz — Které Subaru se k tobě hodí?
        </div>
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/[slug]/opengraph-image.tsx"
git commit -m "feat(quizzes): add per-outcome OG image for result pages"
```

---

## Task 9: Stránka znalostního kvízu

**Files:**
- Create: `app/kviz/jak-dobre-znas-subaru/page.tsx`

- [ ] **Step 1: Vytvořit `app/kviz/jak-dobre-znas-subaru/page.tsx`**

```tsx
import type { Metadata } from "next";
import { jakDobreZnas } from "@/lib/quizzes";
import { QuizRunner } from "@/app/(components)/QuizRunner";

export const metadata: Metadata = {
  title: "Jak dobře znáš Subaru? — kvíz",
  description:
    "Otestuj své znalosti Subaru v 10 otázkách: boxer motory, symetrický AWD, rallye historie, JDM legendy. Kolik dáš?",
  alternates: { canonical: "/kviz/jak-dobre-znas-subaru" },
};

export default function Page() {
  return <QuizRunner quiz={jakDobreZnas} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/kviz/jak-dobre-znas-subaru/page.tsx
git commit -m "feat(quizzes): add knowledge quiz page"
```

---

## Task 10: Hub `/kviz` + QuizCard

**Files:**
- Create: `app/kviz/(components)/QuizCard.tsx`, `app/kviz/page.tsx`

- [ ] **Step 1: Vytvořit `app/kviz/(components)/QuizCard.tsx`**

```tsx
import Link from "next/link";

export function QuizCard({
  href,
  label,
  title,
  desc,
  cta,
  primary,
}: {
  href: string;
  label: string;
  title: string;
  desc: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-white/[0.08] bg-[#131316] p-6 hover:border-[#4a8dff]/60 transition"
    >
      <div className="text-[10px] uppercase tracking-[0.12em] text-[#4a8dff] mb-2">
        {label}
      </div>
      <h2 className="text-[20px] font-semibold tracking-tight text-white mb-2">
        {title}
      </h2>
      <p className="text-[13px] text-white/60 leading-relaxed mb-5">{desc}</p>
      <span
        className={
          primary
            ? "inline-block rounded-lg bg-[#4a8dff] text-white font-semibold text-sm px-4 py-2 group-hover:bg-[#3a7def] transition"
            : "inline-block rounded-lg border border-white/12 text-white/80 text-sm px-4 py-2 group-hover:border-[#4a8dff] group-hover:text-white transition"
        }
      >
        {cta}
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Vytvořit `app/kviz/page.tsx`**

```tsx
import type { Metadata } from "next";
import { QuizCard } from "./(components)/QuizCard";

export const metadata: Metadata = {
  title: "Subaru kvízy",
  description:
    "Klubové kvízy o Subaru: zjisti, který model se k tobě hodí, nebo otestuj své znalosti značky.",
  alternates: { canonical: "/kviz" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-8 py-20">
      <div className="text-[11px] uppercase tracking-[0.14em] text-[#4a8dff] mb-3">
        🚗 Klubové kvízy
      </div>
      <h1 className="text-[clamp(30px,5vw,48px)] font-extrabold tracking-tight text-white mb-3 leading-none">
        Subaru kvízy
      </h1>
      <p className="text-white/60 max-w-xl mb-12">
        Zábava pro fanoušky i nováčky. Zjisti, který model je přesně pro tebe, nebo si otestuj, jak dobře značku znáš.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuizCard
          href="/kviz/ktere-subaru-se-k-tobe-hodi"
          label="Personální"
          title="Které Subaru se k tobě hodí?"
          desc="7 otázek a víš, který model je tvůj parťák — od Outbacku po BRZ."
          cta="Spustit →"
          primary
        />
        <QuizCard
          href="/kviz/jak-dobre-znas-subaru"
          label="Znalostní"
          title="Jak dobře znáš Subaru?"
          desc="10 otázek z historie, techniky i legend značky. Kolik dáš?"
          cta="Spustit →"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/kviz/(components)/QuizCard.tsx" app/kviz/page.tsx
git commit -m "feat(quizzes): add /kviz hub page with quiz cards"
```

---

## Task 11: Blok na homepage

**Files:**
- Create: `app/(components)/HomeQuizBlock.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Vytvořit `app/(components)/HomeQuizBlock.tsx`**

```tsx
import { QuizCard } from "@/app/kviz/(components)/QuizCard";
import { Reveal } from "./Reveal";

export function HomeQuizBlock() {
  return (
    <section className="mx-auto max-w-7xl px-8 pt-32">
      <Reveal>
        <div className="text-[11px] uppercase tracking-[0.14em] text-[#4a8dff] mb-3">
          🚗 Klubové kvízy
        </div>
        <h2 className="text-[clamp(26px,4vw,40px)] font-medium tracking-tight text-white mb-8">
          Jaké Subaru jsi?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <QuizCard
            href="/kviz/ktere-subaru-se-k-tobe-hodi"
            label="Personální"
            title="Které Subaru se k tobě hodí?"
            desc="7 otázek a víš, který model je tvůj parťák."
            cta="Spustit kvíz →"
            primary
          />
          <QuizCard
            href="/kviz/jak-dobre-znas-subaru"
            label="Znalostní"
            title="Jak dobře znáš Subaru?"
            desc="Otestuj své znalosti značky v 10 otázkách."
            cta="Spustit →"
          />
        </div>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 2: Importovat v `app/page.tsx`**

Přidej k importům nahoře (po řádku importujícím `Reveal`):

```tsx
import { HomeQuizBlock } from "./(components)/HomeQuizBlock";
```

- [ ] **Step 3: Vložit blok do JSX `app/page.tsx`**

Najdi v `return (...)` sekci, která začíná (cca řádek 328):

```tsx
      <section className="pt-32">
```

Bezprostředně **PŘED** tento řádek vlož:

```tsx
      <HomeQuizBlock />
```

- [ ] **Step 4: Ověřit typy**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(components)/HomeQuizBlock.tsx" app/page.tsx
git commit -m "feat(quizzes): add quiz block to homepage"
```

---

## Task 12: Odkaz v menu

**Files:**
- Modify: `app/(components)/SiteHeader.tsx`

- [ ] **Step 1: Přidat odkaz „Kvíz" do nav v `app/(components)/SiteHeader.tsx`**

Najdi v `<nav ...>` blok s odkazem na Modely:

```tsx
          <Link href="/modely" className="hover:text-white transition">
            Modely
          </Link>
```

Bezprostředně **ZA** tento `</Link>` vlož:

```tsx
          <Link href="/kviz" className="hover:text-white transition">
            Kvíz
          </Link>
```

- [ ] **Step 2: Ověřit typy**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "app/(components)/SiteHeader.tsx"
git commit -m "feat(quizzes): add Kvíz link to site nav"
```

---

## Task 13: Jemný modal

**Files:**
- Create: `app/(components)/QuizModal.tsx`
- Modify: `app/layout.tsx`

Modal naskočí **jen jednou na návštěvníka** (localStorage `csc_quiz_modal_seen`), trigger po 8 s nebo na exit-intent (desktop). Nezobrazuje se na `/kviz/*`.

- [ ] **Step 1: Vytvořit `app/(components)/QuizModal.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SEEN_KEY = "csc_quiz_modal_seen";

function track(event: string) {
  if (typeof window !== "undefined") window.gtag?.("event", event, { quiz: "ktere-subaru-se-k-tobe-hodi" });
}

export function QuizModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/kviz")) return;
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      seen = true; // bez storage modal raději nezobrazuj
    }
    if (seen) return;

    function show() {
      setOpen((already) => {
        if (already) return already;
        try {
          localStorage.setItem(SEEN_KEY, "1");
        } catch {
          /* ignore */
        }
        track("quiz_modal_open");
        return true;
      });
    }

    const timer = window.setTimeout(show, 8000);
    function onExit(e: MouseEvent) {
      if (e.clientY <= 0) show();
    }
    document.addEventListener("mouseout", onExit);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mouseout", onExit);
    };
  }, [pathname]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Subaru kvíz"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/12 p-7 shadow-2xl"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 0%, rgba(74,141,255,.2), transparent 60%), #131316",
        }}
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Zavřít"
          className="absolute top-3 right-3 text-white/40 hover:text-white text-lg leading-none"
        >
          ✕
        </button>
        <div className="text-[10px] uppercase tracking-[0.14em] text-[#4a8dff] mb-2">
          🚗 Klubový kvíz
        </div>
        <h2 className="text-[20px] font-bold tracking-tight text-white mb-2">
          Které Subaru se k tobě hodí?
        </h2>
        <p className="text-[13px] text-white/60 mb-5 leading-relaxed">
          7 rychlých otázek a víš, který model je tvůj. Zkusíš?
        </p>
        <Link
          href="/kviz/ktere-subaru-se-k-tobe-hodi"
          onClick={() => {
            track("quiz_modal_cta");
            setOpen(false);
          }}
          className="inline-block rounded-lg bg-[#4a8dff] text-white font-semibold text-sm px-5 py-2.5 hover:bg-[#3a7def] transition"
        >
          Spustit kvíz →
        </Link>
        <button
          onClick={() => setOpen(false)}
          className="block mt-3 text-[12px] text-white/40 hover:text-white/70 transition"
        >
          Teď ne, díky
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Mount v `app/layout.tsx`**

Přidej k importům (po řádku `import { Analytics } ...`):

```tsx
import { QuizModal } from "./(components)/QuizModal";
```

Najdi v `<body>`:

```tsx
        <Analytics />
```

Bezprostředně **ZA** tento řádek vlož:

```tsx
        <QuizModal />
```

- [ ] **Step 3: Ověřit typy**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "app/(components)/QuizModal.tsx" app/layout.tsx
git commit -m "feat(quizzes): add gentle one-time quiz modal"
```

---

## Task 14: Sitemap

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Prozkoumat `app/sitemap.ts`**

Run: `cat app/sitemap.ts`
Cíl: zjistit tvar návratového pole (typ `MetadataRoute.Sitemap`), `baseUrl` a jak se přidávají statické routy.

- [ ] **Step 2: Přidat kvízové routy do `app/sitemap.ts`**

Naimportuj nahoře:

```ts
import { ktereSubaru } from "@/lib/quizzes";
```

Do pole, které funkce vrací, přidej (uprav `baseUrl` na proměnnou, kterou soubor už používá — typicky `"https://czechsubaruclub.cz"`):

```ts
    { url: `${baseUrl}/kviz`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/kviz/ktere-subaru-se-k-tobe-hodi`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/kviz/jak-dobre-znas-subaru`, changeFrequency: "monthly", priority: 0.7 },
    ...ktereSubaru.outcomes.map((o) => ({
      url: `${baseUrl}/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/${o.modelSlug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
```

Pozn.: pokud `app/sitemap.ts` používá jiný název konstanty než `baseUrl` (např. `SITE`), použij ten. Pokud nepoužívá žádnou proměnnou, nahraď `${baseUrl}` literálem `https://czechsubaruclub.cz`.

- [ ] **Step 3: Ověřit typy**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat(quizzes): add quiz routes to sitemap"
```

---

## Task 15: Plný build + smoke + finální commit

**Files:** žádné nové — ověření celku.

- [ ] **Step 1: Spustit všechny testy**

Run: `npm run test`
Expected: PASS (scoring 5 + definitions 6 + stávající testy projektu).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: bez chyb (varování OK).

- [ ] **Step 3: Plný static-export build**

Run: `npm run build`
Expected: build projde; v `out/` vzniknou:
- `out/kviz/index.html`
- `out/kviz/ktere-subaru-se-k-tobe-hodi/index.html`
- `out/kviz/jak-dobre-znas-subaru/index.html`
- `out/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/outback/index.html` (a dalších 6 modelů)
- OG PNG pro každý výsledek

Ověř: `ls out/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/`
Expected: adresáře `outback forester xv wrx-sti brz levorg vivio`.

Pokud build spadne na „Výsledek odkazuje na neexistující model …", oprav příslušný `modelSlug` v `lib/quizzes/ktere-subaru.ts` (musí přesně sedět na slug v katalogu modelů).

- [ ] **Step 4: Lokální smoke**

Run: `npx serve out -l 4321` (nebo `python3 -m http.server 4321 -d out`) a v prohlížeči ověř:
- `/kviz/` — hub se dvěma kartami
- `/kviz/ktere-subaru-se-k-tobe-hodi/` — proklikání 7 otázek → redirect na výsledek modelu
- výsledková stránka — foto, blurb, CTA na `/modely/[slug]`, sdílení
- `/kviz/jak-dobre-znas-subaru/` — 10 otázek → skóre + projití odpovědí
- homepage — kvízový blok; po 8 s naskočí modal (jen jednou — po zavření už ne); na `/kviz` se modal neukáže
- nav obsahuje „Kvíz"

- [ ] **Step 5: Finální commit (pokud build vyžádal úpravy)**

```bash
git add -A
git commit -m "chore(quizzes): fixes from full build/smoke verification"
```

---

## Deploy (po schválení)

Není součástí exekuce plánu — pouští se ručně po review:

```bash
npm run build
(cd out && zip -rq ../czechsubaruclub_deploy.zip .)
# pak Hostinger MCP hosting_deployStaticWebsite s archivem (zip OBSAHU out/, ne vnořené)
```

---

## Pokrytí spec → task (self-review)

- Hub `/kviz` → Task 10 ✓
- Personální kvíz + 7 otázek + 7 archetypů → Task 3, 6 ✓
- Znalostní kvíz + 10 otázek + skóre + projití → Task 3, 9, QuizRunner Task 4 ✓
- Generický engine + dimenzní/skóre logika (TDD) → Task 2, 4 ✓
- Výsledkové stránky + integrita slugů + OG → Task 7, 8 ✓
- Homepage dvě karty → Task 11 ✓
- Menu odkaz → Task 12 ✓
- Jemný modal (1×, 8 s/exit-intent, ne na /kviz) → Task 13 ✓
- Sdílení (native+copy+X+FB, bez IG) → Task 5 ✓
- Analytika eventy → Task 4 (start/complete/result/score), Task 13 (modal) ✓
- SEO/sitemap/metadata/canonical → Task 6,7,9,10,14 ✓
- Data jako commitnuté zod TS soubory → Task 1, 3 ✓
- Static-export kompatibilita → Task 15 build ✓
- Testy: TDD scoring + zod integrity → Task 2, 3 ✓
