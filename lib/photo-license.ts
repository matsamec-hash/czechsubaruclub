/**
 * Maps a human-readable licence name ("CC BY-SA 4.0") to the URL of the licence
 * text.
 *
 * CC BY / CC BY-SA require the licensor to be credited *and* a link (or URI) to
 * the licence itself — see CC BY-SA 4.0 art. 3(a)(1)(D). Printing only the
 * licence name is not enough, which is exactly the defect that triggered the
 * Müseler/PhotoClaim demand on a sister site on 2026-09-10.
 */

const EXPLICIT: Record<string, string> = {
  cc0: "https://creativecommons.org/publicdomain/zero/1.0/",
  "cc0 1.0": "https://creativecommons.org/publicdomain/zero/1.0/",
  "public domain": "https://creativecommons.org/publicdomain/mark/1.0/",
  "public domain mark": "https://creativecommons.org/publicdomain/mark/1.0/",
  pd: "https://creativecommons.org/publicdomain/mark/1.0/",
  "gfdl": "https://www.gnu.org/licenses/fdl-1.3.html",
};

/** `CC BY-SA 4.0` → `https://creativecommons.org/licenses/by-sa/4.0/` */
export function licenseUrl(license?: string | null): string | null {
  if (!license) return null;
  const key = license.trim().toLowerCase();
  if (EXPLICIT[key]) return EXPLICIT[key];

  const m = key.match(
    /^cc[ -]((?:by)(?:[ -](?:sa|nc|nd|nc-sa|nc-nd))?)[ -]?(\d\.\d)$/,
  );
  if (m) {
    const parts = m[1].replace(/\s+/g, "-");
    return `https://creativecommons.org/licenses/${parts}/${m[2]}/`;
  }
  return null;
}

/**
 * True when the licence obliges us to name the author. Public domain / CC0 do
 * not, but we still print the licence so the origin stays auditable.
 */
export function attributionRequired(license?: string | null): boolean {
  if (!license) return true;
  const key = license.trim().toLowerCase();
  return !(key.startsWith("cc0") || key.startsWith("public domain") || key === "pd");
}

/** Plain-text attribution used where a link cannot be nested (e.g. inside <a>). */
export function creditLine(
  credit?: string | null,
  license?: string | null,
): string | null {
  if (!credit && !license) return null;
  return `Foto: ${credit ?? "neznámý autor"}${license ? ` · ${license}` : ""}`;
}
