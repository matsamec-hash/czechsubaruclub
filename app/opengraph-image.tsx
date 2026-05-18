import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Czech Subaru Club — Encyklopedie všech Subaru";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(ellipse at top, #0a1428 0%, #050810 70%)",
          padding: "72px",
          fontFamily: "sans-serif",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#4a8dff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "#050810",
              }}
            />
          </div>
          <span style={{ fontSize: 24, fontWeight: 500, letterSpacing: -0.5 }}>
            Czech Subaru Club
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 14,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#88b8ff",
              fontWeight: 600,
            }}
          >
            Encyklopedie
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 0.95,
              color: "#fff",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Encyklopedie</span>
            <span style={{ color: "#88b8ff" }}>všech Subaru.</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 16,
            color: "rgba(255,255,255,0.5)",
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span>czechsubaruclub.cz</span>
          <span>27 modelů · 67 let historie · Boxer motor · 4×4</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
