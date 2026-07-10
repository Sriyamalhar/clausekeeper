import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ClauseKeeper — Contract and licensing tracking for creative freelancers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fafaf8",
          padding: "80px",
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 600,
            color: "#2a6f63",
            marginBottom: 24,
          }}
        >
          ClauseKeeper
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 600,
            color: "#161b26",
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          Never miss the clause that costs you the job
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#5b6270",
            marginTop: 24,
            textAlign: "center",
          }}
        >
          Contract & licensing tracking for creative freelancers
        </div>
      </div>
    ),
    { ...size }
  );
}
