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
