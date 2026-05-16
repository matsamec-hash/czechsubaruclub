import { describe, it, expect } from "vitest";
import fixture from "./fixtures/wikidata-Q391342.json" with { type: "json" };
import {
  parseWikidataEntity,
  extractModelCore,
  buildCommonsImageUrl,
} from "@/lib/pipeline/wikidata";

describe("parseWikidataEntity", () => {
  it("parsuje Subaru Impreza Q391342 do strukturované entity", () => {
    const entity = parseWikidataEntity(fixture, "Q391342");
    expect(entity.qid).toBe("Q391342");
    expect(entity.labels.en).toContain("Impreza");
    expect(Object.keys(entity.claims).length).toBeGreaterThan(5);
  });

  it("hodí error pro mismatched QID", () => {
    expect(() => parseWikidataEntity(fixture, "Q999999")).toThrow();
  });
});

describe("extractModelCore", () => {
  it("extrahuje P18 image z Impreza Q391342", () => {
    const entity = parseWikidataEntity(fixture, "Q391342");
    const core = extractModelCore(entity);

    expect(core.qid).toBe("Q391342");
    // preferred-rank claim in fixture is the Auto Zuerich 2023 image
    expect(core.imageFileName).toBe(
      "Subaru Impreza (GU) Auto Zuerich 2023 1X7A1263.jpg",
    );
    expect(core.imageUrl).toMatch(
      /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//,
    );
    // parentheses are not encoded by encodeURIComponent (RFC 3986 unreserved)
    expect(core.imageUrl).toContain(
      "Subaru_Impreza_(GU)_Auto_Zuerich_2023_1X7A1263.jpg",
    );
  });

  it("vrátí null pro inceptionYear (Subaru modely typicky nemají P571 na Wikidatech)", () => {
    const entity = parseWikidataEntity(fixture, "Q391342");
    const core = extractModelCore(entity);
    expect(core.inceptionYear).toBeNull();
  });

  it("extrahuje P176 manufacturer entity ID", () => {
    const entity = parseWikidataEntity(fixture, "Q391342");
    const core = extractModelCore(entity);
    expect(core.manufacturer).toMatch(/^Q\d+$/);
  });

  it("vrátí null pro úplně prázdnou entitu", () => {
    const entity = {
      qid: "Q1",
      labels: {},
      descriptions: {},
      claims: {},
    };
    const core = extractModelCore(entity);
    expect(core.imageUrl).toBeNull();
    expect(core.inceptionYear).toBeNull();
    expect(core.manufacturer).toBeNull();
  });
});

describe("buildCommonsImageUrl", () => {
  it("vrátí Commons URL pro file name s podtržítky místo mezer", () => {
    const url = buildCommonsImageUrl("Subaru Impreza WRX STI.jpg");
    expect(url).toMatch(/upload\.wikimedia\.org\/wikipedia\/commons\//);
    expect(url).toContain("Subaru_Impreza_WRX_STI.jpg");
  });

  it("URL-encoduje special chars (&)", () => {
    const url = buildCommonsImageUrl("Auto&Co.jpg");
    expect(url).toContain("Auto%26Co.jpg");
  });

  it("md5 hash struktura: /first/first2/<file>", () => {
    const url = buildCommonsImageUrl("test.jpg");
    expect(url).toMatch(
      /\/wikipedia\/commons\/[0-9a-f]\/[0-9a-f]{2}\/test\.jpg/,
    );
  });
});
