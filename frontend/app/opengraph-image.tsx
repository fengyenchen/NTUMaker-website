import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "NTUMaker 台大自造者社";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#F7F6F2",
          color: "#2F2E2A",
          display: "flex",
          height: "100%",
          padding: "42px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            border: "2px solid #D8D5CD",
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "54px",
            position: "relative",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", gap: "18px" }}>
            <div
              style={{
                background: "#C13F4A",
                display: "flex",
                height: "28px",
                width: "28px",
              }}
            />
            <div style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-1px" }}>
              NTUMaker
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: "#2F5E9E", fontSize: "24px", fontWeight: 700, letterSpacing: "2px" }}>
              BUILD · LEARN · SHARE
            </div>
            <div style={{ fontSize: "78px", fontWeight: 900, letterSpacing: "-5px", lineHeight: 1.05, marginTop: "18px" }}>
              動手把想法做出來
            </div>
            <div style={{ color: "#6F6E69", fontSize: "30px", marginTop: "22px" }}>
              台大自造者社 · 課程 · 工作坊 · 專案
            </div>
          </div>

          <div style={{ alignItems: "flex-end", display: "flex", justifyContent: "space-between" }}>
            <div style={{ color: "#6F6E69", fontSize: "22px" }}>NTU MAKER CLUB</div>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ background: "#C13F4A", height: "26px", width: "26px" }} />
              <div style={{ background: "#2F5E9E", height: "26px", width: "26px" }} />
              <div style={{ background: "#A9572C", height: "26px", width: "26px" }} />
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
