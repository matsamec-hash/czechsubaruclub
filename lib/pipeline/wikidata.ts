import { createHash } from "node:crypto";
import { throttledFetch } from "./fetch";
import type {
  WikidataEntity,
  WikidataClaim,
  WikidataModelCore,
} from "./types";

const ENTITY_URL = (qid: string) =>
  `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;

export async function fetchWikidataEntity(
  qid: string,
  userAgent: string,
): Promise<WikidataEntity> {
  const res = await throttledFetch(ENTITY_URL(qid), { userAgent });
  if (!res.ok) {
    throw new Error(`Wikidata fetch ${qid} returned ${res.status}`);
  }
  const json = await res.json();
  return parseWikidataEntity(json, qid);
}

export function parseWikidataEntity(
  raw: unknown,
  qid: string,
): WikidataEntity {
  const entities = (raw as { entities?: Record<string, unknown> }).entities;
  if (!entities || !entities[qid]) {
    throw new Error(`Wikidata response missing entities[${qid}]`);
  }
  const entity = entities[qid] as Record<string, unknown>;

  const labels = parseLabels(entity.labels);
  const descriptions = parseLabels(entity.descriptions);
  const claims = parseClaims(entity.claims);

  return { qid, labels, descriptions, claims };
}

function parseLabels(raw: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!raw || typeof raw !== "object") return result;
  for (const [lang, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v && typeof v === "object" && "value" in v) {
      result[lang] = String((v as { value: unknown }).value);
    }
  }
  return result;
}

function parseClaims(raw: unknown): Record<string, WikidataClaim[]> {
  const result: Record<string, WikidataClaim[]> = {};
  if (!raw || typeof raw !== "object") return result;
  for (const [prop, claimList] of Object.entries(
    raw as Record<string, unknown>,
  )) {
    if (!Array.isArray(claimList)) continue;
    result[prop] = claimList
      .map((c) => parseClaim(prop, c))
      .filter((c): c is WikidataClaim => c !== null);
  }
  return result;
}

function parseClaim(property: string, raw: unknown): WikidataClaim | null {
  if (!raw || typeof raw !== "object") return null;
  const mainsnak = (raw as { mainsnak?: Record<string, unknown> }).mainsnak;
  const rank = ((raw as { rank?: string }).rank ?? "normal") as
    | "preferred"
    | "normal"
    | "deprecated";
  if (!mainsnak || mainsnak.snaktype !== "value") return null;

  const datavalue = mainsnak.datavalue as
    | { type: string; value: unknown }
    | undefined;
  if (!datavalue) return null;

  let value: WikidataClaim["value"] = null;
  if (datavalue.type === "string") {
    value = String(datavalue.value);
  } else if (datavalue.type === "wikibase-entityid") {
    const v = datavalue.value as { id?: string };
    if (v.id) value = { id: v.id };
  } else if (datavalue.type === "time") {
    const v = datavalue.value as { time?: string };
    if (v.time) value = v.time;
  } else if (datavalue.type === "quantity") {
    const v = datavalue.value as { amount?: string };
    if (v.amount) value = parseFloat(v.amount);
  }

  return { property, value, rank };
}

export function extractModelCore(entity: WikidataEntity): WikidataModelCore {
  const imageFileName = firstStringClaim(entity, "P18");
  const inceptionTime = firstStringClaim(entity, "P571");
  const manufacturer = firstEntityClaim(entity, "P176");

  return {
    qid: entity.qid,
    imageFileName,
    imageUrl: imageFileName ? buildCommonsImageUrl(imageFileName) : null,
    inceptionYear: parseInceptionYear(inceptionTime),
    manufacturer,
  };
}

function firstStringClaim(
  entity: WikidataEntity,
  prop: string,
): string | null {
  const claims = entity.claims[prop];
  if (!claims || claims.length === 0) return null;
  const preferred = claims.find((c) => c.rank === "preferred") ?? claims[0];
  return typeof preferred.value === "string" ? preferred.value : null;
}

function firstEntityClaim(
  entity: WikidataEntity,
  prop: string,
): string | null {
  const claims = entity.claims[prop];
  if (!claims || claims.length === 0) return null;
  const preferred = claims.find((c) => c.rank === "preferred") ?? claims[0];
  if (
    preferred.value &&
    typeof preferred.value === "object" &&
    "id" in preferred.value
  ) {
    return (preferred.value as { id: string }).id;
  }
  return null;
}

function parseInceptionYear(time: string | null): number | null {
  if (!time) return null;
  const match = /^[+-]?(\d{4})/.exec(time);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  if (year < 1950 || year > 2030) return null;
  return year;
}

export function buildCommonsImageUrl(fileName: string): string {
  const normalized = fileName.replace(/ /g, "_");
  const md5 = createHash("md5").update(normalized).digest("hex");
  const encoded = encodeURIComponent(normalized);
  return `https://upload.wikimedia.org/wikipedia/commons/${md5[0]}/${md5.slice(0, 2)}/${encoded}`;
}
