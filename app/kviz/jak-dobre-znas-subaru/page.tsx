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
