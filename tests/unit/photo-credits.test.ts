/**
 * Ratchet for photo attribution.
 *
 * Background: on 2026-09-10 a lawyer's demand (Müseler / PhotoClaim, case
 * 52-06966, EUR 2 169.95) landed on a sister site because a CC BY-SA photo
 * carried only "Foto: Wikimedia Commons" — the source instead of the author.
 *
 * These tests make sure the same defect cannot come back here: every model
 * photo must carry author + licence + source, the licence must resolve to a
 * URL we can link to, and no component that renders a model photo may do so
 * without a credit.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { listModels } from "@/lib/data/models";
import { attributionRequired, creditLine, licenseUrl } from "@/lib/photo-license";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (rel: string) => readFileSync(root + rel, "utf8");

describe("photo-license", () => {
  it("maps Creative Commons names to the licence deed", () => {
    expect(licenseUrl("CC BY-SA 4.0")).toBe(
      "https://creativecommons.org/licenses/by-sa/4.0/",
    );
    expect(licenseUrl("CC BY-SA 3.0")).toBe(
      "https://creativecommons.org/licenses/by-sa/3.0/",
    );
    expect(licenseUrl("CC BY 2.0")).toBe(
      "https://creativecommons.org/licenses/by/2.0/",
    );
    expect(licenseUrl("CC0")).toBe(
      "https://creativecommons.org/publicdomain/zero/1.0/",
    );
    expect(licenseUrl("Public domain")).toBe(
      "https://creativecommons.org/publicdomain/mark/1.0/",
    );
  });

  it("returns null rather than guessing an unknown licence", () => {
    expect(licenseUrl("All rights reserved")).toBeNull();
    expect(licenseUrl(null)).toBeNull();
  });

  it("knows which licences oblige us to name the author", () => {
    expect(attributionRequired("CC BY-SA 4.0")).toBe(true);
    expect(attributionRequired("CC BY 2.0")).toBe(true);
    expect(attributionRequired("CC0")).toBe(false);
    expect(attributionRequired("Public domain")).toBe(false);
  });

  it("builds a plain credit line", () => {
    expect(creditLine("Mytho88", "CC BY-SA 3.0")).toBe(
      "Foto: Mytho88 · CC BY-SA 3.0",
    );
    expect(creditLine(null, null)).toBeNull();
  });
});

describe("data/models.json attribution", () => {
  const withPhoto = listModels().filter((m) => m.heroImageUrl);

  it("has photos to check", () => {
    expect(withPhoto.length).toBeGreaterThan(0);
  });

  it("every photo names an author", () => {
    const missing = withPhoto
      .filter((m) => !m.heroImageCredit?.trim())
      .map((m) => m.slug);
    expect(missing).toEqual([]);
  });

  it("no author is the generic source string", () => {
    const bogus = /^(wikimedia commons|wikipedia|commons|own work|unknown|neznámý)$/i;
    const bad = withPhoto
      .filter((m) => bogus.test((m.heroImageCredit ?? "").trim()))
      .map((m) => `${m.slug}: ${m.heroImageCredit}`);
    expect(bad).toEqual([]);
  });

  it("every photo names a licence we can link to", () => {
    const bad = withPhoto
      .filter((m) => !m.heroImageLicense || !licenseUrl(m.heroImageLicense))
      .map((m) => `${m.slug}: ${m.heroImageLicense}`);
    expect(bad).toEqual([]);
  });

  it("every photo links to the source file", () => {
    const bad = withPhoto
      .filter((m) => !m.heroImageSource?.startsWith("https://"))
      .map((m) => m.slug);
    expect(bad).toEqual([]);
  });
});

describe("every place that renders a model photo also renders a credit", () => {
  // file -> how many <img>/poster usages of heroImageUrl it may contain
  const renderers = [
    "app/page.tsx",
    "app/modely/page.tsx",
    "app/modely/[slug]/page.tsx",
    "app/(components)/ModelsCatalog.tsx",
    "app/kviz/ktere-subaru-se-k-tobe-hodi/vysledek/[slug]/page.tsx",
  ];

  for (const rel of renderers) {
    it(`${rel} imports a credit component`, () => {
      const src = read(rel);
      const showsPhoto = /heroImageUrl/.test(src);
      if (!showsPhoto) return;
      expect(src).toMatch(/PhotoCredit(Plain|s)?\b/);
    });
  }

  it("no component hotlinks a third-party media host", () => {
    // Wikimedia hotlinks are tolerated (WMF allows them); everything else is not.
    const banned = /https?:\/\/(videos\.pexels\.com|images\.unsplash\.com|[a-z0-9.-]*\.?(?:shutterstock|gettyimages|istockphoto)\.com)/i;
    for (const rel of [...renderers, "app/layout.tsx", "app/fotografie/page.tsx"]) {
      expect(read(rel), `${rel} hotlinks external media`).not.toMatch(banned);
    }
  });

  it("the homepage has no invented club members", () => {
    const src = read("app/page.tsx");
    expect(src).not.toMatch(/FAKE_USERS/);
  });
});
