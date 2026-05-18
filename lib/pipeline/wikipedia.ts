import { throttledFetch } from "./fetch";

// MARK: - Sitelink resolution
//
// Wikidata entity carries sitelinks like:
//   sitelinks: {
//     cswiki: { site: "cswiki", title: "Subaru Forester" },
//     enwiki: { site: "enwiki", title: "Subaru Forester" }
//   }
//
// We need to follow these to the Wikipedia REST API to grab the
// summary paragraph. The Wikidata enrich pipeline already has
// `fetchWikidataEntity` but only parses claims, not sitelinks — so we
// re-fetch with a `props=sitelinks` query to avoid bloating the existing
// parser.

const SITELINKS_URL = (qid: string) =>
  `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;

export async function fetchSitelinks(
  qid: string,
  userAgent: string,
): Promise<Record<string, string>> {
  const res = await throttledFetch(SITELINKS_URL(qid), { userAgent });
  if (!res.ok) {
    throw new Error(`Wikidata sitelinks fetch ${qid} returned ${res.status}`);
  }
  const json = (await res.json()) as {
    entities?: Record<
      string,
      {
        sitelinks?: Record<string, { site: string; title: string }>;
      }
    >;
  };
  const entity = json.entities?.[qid];
  if (!entity?.sitelinks) return {};
  const result: Record<string, string> = {};
  for (const [siteKey, sitelink] of Object.entries(entity.sitelinks)) {
    // siteKey is e.g. "cswiki" -> language code "cs"
    const lang = siteKey.replace(/wiki$/, "");
    result[lang] = sitelink.title;
  }
  return result;
}

// MARK: - REST summary fetch
//
// Wikipedia REST API summary endpoint returns:
//   { type: "standard", title, extract, ... }
// extract = plain-text first paragraph(s), localized.
// We're conservative and use the SUMMARY endpoint not /content/page/{title}
// so the response stays bounded.

const SUMMARY_URL = (lang: string, title: string) =>
  `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title.replace(/ /g, "_"),
  )}`;

export type WikipediaSummary = {
  lang: string;
  title: string;
  extract: string;
  /// Full canonical URL on Wikipedia.
  url: string;
};

export async function fetchWikipediaSummary(
  lang: string,
  title: string,
  userAgent: string,
): Promise<WikipediaSummary | null> {
  const res = await throttledFetch(SUMMARY_URL(lang, title), { userAgent });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(
      `Wikipedia summary ${lang}:${title} returned ${res.status}`,
    );
  }
  const json = (await res.json()) as {
    type?: string;
    title?: string;
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
  };

  // Disambig pages have type=disambiguation — we don't want those.
  if (json.type === "disambiguation") return null;

  if (!json.extract || !json.title) return null;

  return {
    lang,
    title: json.title,
    extract: json.extract,
    url:
      json.content_urls?.desktop?.page ??
      `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(json.title.replace(/ /g, "_"))}`,
  };
}

// MARK: - Composite helper
//
// One-shot: given a QID, return both CS and EN Wikipedia summaries (when
// present). Returns nulls for missing language coverage — caller decides
// what to do (skip / fall back to other language / leave column null).

export async function fetchCsEnSummariesByQid(
  qid: string,
  userAgent: string,
): Promise<{
  qid: string;
  cs: WikipediaSummary | null;
  en: WikipediaSummary | null;
}> {
  const sitelinks = await fetchSitelinks(qid, userAgent);

  const [cs, en] = await Promise.all([
    sitelinks.cs
      ? fetchWikipediaSummary("cs", sitelinks.cs, userAgent).catch((e) => {
          console.warn(`[wikipedia] CS fetch failed for ${qid}: ${e.message}`);
          return null;
        })
      : Promise.resolve(null),
    sitelinks.en
      ? fetchWikipediaSummary("en", sitelinks.en, userAgent).catch((e) => {
          console.warn(`[wikipedia] EN fetch failed for ${qid}: ${e.message}`);
          return null;
        })
      : Promise.resolve(null),
  ]);

  return { qid, cs, en };
}
