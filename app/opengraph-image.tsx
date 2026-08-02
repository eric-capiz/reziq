import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "#0B0F14",
          color: "white",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#7CFFB2",
          }}
        >
          Career signal, not spin
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 96, lineHeight: 0.95 }}>
            <span style={{ color: "#FF5C35", fontStyle: "italic" }}>Rez</span>
            <span>IQ</span>
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 820,
              fontSize: 34,
              lineHeight: 1.3,
              color: "rgba(255,255,255,0.78)",
              fontFamily: "sans-serif",
            }}
          >
            Evidence based resume fit analysis. Match your resume to a real job
            with proof.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "rgba(255,255,255,0.5)",
            fontFamily: "sans-serif",
          }}
        >
          Free AI resume help without invented experience
        </div>
      </div>
    ),
    size
  );
}
