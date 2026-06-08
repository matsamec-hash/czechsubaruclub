import { readModelsFile } from "@/lib/data/models-file";

function pct(n: number, total: number): number {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}

function main() {
  console.log("=== CzechSubaruClub content audit ===\n");
  const models = readModelsFile();

  const tierCounts = new Map<string, number>();
  for (const m of models) tierCounts.set(m.contentTier, (tierCounts.get(m.contentTier) ?? 0) + 1);
  console.log("Tier distribution:");
  for (const [tier, count] of [...tierCounts].sort()) console.log(`  ${tier.padEnd(10)} ${count}`);

  const total = models.length;
  const withImage = models.filter((m) => m.heroImageUrl).length;
  const withTagline = models.filter((m) => m.taglineCs).length;
  const withDescription = models.filter((m) => m.descriptionCs).length;
  const withEnRaw = models.filter((m) => m.descriptionEnRaw).length;

  console.log("\nCompleteness:");
  console.log(`  Total models           ${total}`);
  console.log(`  Hero image             ${withImage}/${total} (${pct(withImage, total)}%)`);
  console.log(`  Tagline CS             ${withTagline}/${total} (${pct(withTagline, total)}%)`);
  console.log(`  Description CS         ${withDescription}/${total} (${pct(withDescription, total)}%)`);
  console.log(`  Description EN raw     ${withEnRaw}/${total} (${pct(withEnRaw, total)}%)`);

  const missingImage = models.filter((m) => !m.heroImageUrl);
  if (missingImage.length > 0) {
    console.log(`\nMissing hero_image_url (${missingImage.length}):`);
    for (const m of missingImage) console.log(`  - ${m.slug.padEnd(15)} qid=${m.wikidataQid ?? "MISSING"}`);
  }
}

main();
