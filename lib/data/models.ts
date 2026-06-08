import modelsJson from "@/data/models.json";

export type Model = {
  id: string;
  slug: string;
  name: string;
  nameFull: string;
  taglineCs: string | null;
  descriptionCs: string | null;
  descriptionEnRaw: string | null;
  category: string;
  productionStart: number | null;
  productionEnd: number | null;
  heroImageUrl: string | null;
  wikidataQid: string | null;
  contentTier: string;
  createdAt: string;
  updatedAt: string;
};

const models = modelsJson as Model[];

/** All models sorted by slug using byte/code-point order (mirrors Postgres ORDER BY text). */
export function listModels(): Model[] {
  return [...models].sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
}

export function getModel(slug: string): Model | null {
  return models.find((m) => m.slug === slug) ?? null;
}
