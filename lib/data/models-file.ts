import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Model } from "./models";

const FILE = resolve(process.cwd(), "data/models.json");

export function readModelsFile(): Model[] {
  return JSON.parse(readFileSync(FILE, "utf8")) as Model[];
}

/** Deterministic serialization: sorted by slug (byte order), 2-space indent, trailing newline. */
export function serializeModels(models: Model[]): string {
  const sorted = [...models].sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  return JSON.stringify(sorted, null, 2) + "\n";
}

export function writeModelsFile(models: Model[]): void {
  writeFileSync(FILE, serializeModels(models));
}
