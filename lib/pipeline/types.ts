export type FetchOptions = {
  userAgent?: string;
  timeoutMs?: number;
  retries?: number;
};

export type WikidataClaim = {
  property: string;
  value: string | number | { id: string } | null;
  rank: "preferred" | "normal" | "deprecated";
};

export type WikidataEntity = {
  qid: string;
  labels: Record<string, string>;
  descriptions: Record<string, string>;
  claims: Record<string, WikidataClaim[]>;
};

export type WikidataModelCore = {
  qid: string;
  imageFileName: string | null;
  imageUrl: string | null;
  inceptionYear: number | null;
  manufacturer: string | null;
};
