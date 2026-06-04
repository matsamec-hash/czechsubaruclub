import { ktereSubaru } from "./ktere-subaru";
import { jakDobreZnas } from "./jak-dobre-znas";
import type { Quiz } from "./types";

export const QUIZZES: Quiz[] = [ktereSubaru, jakDobreZnas];

export function getQuiz(slug: string): Quiz | undefined {
  return QUIZZES.find((q) => q.slug === slug);
}

export { ktereSubaru, jakDobreZnas };
export * from "./types";
