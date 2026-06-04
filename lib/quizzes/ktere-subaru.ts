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
