import { describe, it, expect } from "vitest";
import {
  models,
  generations,
  trims,
  media,
  czContext,
  subaruclub,
} from "@/lib/db/schema";

describe("subaruclub namespace", () => {
  it("exportuje schema 'subaruclub'", () => {
    expect(subaruclub.schemaName).toBe("subaruclub");
  });
});

describe("models schema", () => {
  it("má všechny required sloupce", () => {
    const cols = Object.keys(models);
    expect(cols).toContain("id");
    expect(cols).toContain("slug");
    expect(cols).toContain("name");
    expect(cols).toContain("nameFull");
    expect(cols).toContain("taglineCs");
    expect(cols).toContain("descriptionCs");
    expect(cols).toContain("descriptionEnRaw");
    expect(cols).toContain("category");
    expect(cols).toContain("productionStart");
    expect(cols).toContain("productionEnd");
    expect(cols).toContain("heroImageUrl");
    expect(cols).toContain("wikidataQid");
    expect(cols).toContain("contentTier");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
  });
});

describe("generations schema", () => {
  it("má všechny required sloupce", () => {
    const cols = Object.keys(generations);
    expect(cols).toContain("id");
    expect(cols).toContain("modelId");
    expect(cols).toContain("slug");
    expect(cols).toContain("code");
    expect(cols).toContain("name");
    expect(cols).toContain("yearStart");
    expect(cols).toContain("yearEnd");
    expect(cols).toContain("descriptionCs");
    expect(cols).toContain("descriptionEnRaw");
    expect(cols).toContain("heroImageUrl");
    expect(cols).toContain("chassisCodes");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
  });
});

describe("trims schema", () => {
  it("má všechny required sloupce", () => {
    const cols = Object.keys(trims);
    expect(cols).toContain("id");
    expect(cols).toContain("generationId");
    expect(cols).toContain("name");
    expect(cols).toContain("engineCode");
    expect(cols).toContain("engineDisplacementCc");
    expect(cols).toContain("powerHp");
    expect(cols).toContain("torqueNm");
    expect(cols).toContain("drivetrain");
    expect(cols).toContain("transmission");
    expect(cols).toContain("topSpeedKmh");
    expect(cols).toContain("zeroToHundredS");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
  });
});

describe("media schema", () => {
  it("má všechny required sloupce", () => {
    const cols = Object.keys(media);
    expect(cols).toContain("id");
    expect(cols).toContain("entityType");
    expect(cols).toContain("entityId");
    expect(cols).toContain("url");
    expect(cols).toContain("altCs");
    expect(cols).toContain("credit");
    expect(cols).toContain("sortOrder");
    expect(cols).toContain("createdAt");
  });
});

describe("cz_context schema", () => {
  it("má všechny required sloupce", () => {
    const cols = Object.keys(czContext);
    expect(cols).toContain("id");
    expect(cols).toContain("modelId");
    expect(cols).toContain("generationId");
    expect(cols).toContain("topic");
    expect(cols).toContain("contentCs");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("updatedAt");
  });
});
