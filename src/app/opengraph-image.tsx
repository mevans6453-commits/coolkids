import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CoolKids - Family Events in Cherokee County & North Georgia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(129, 140, 248, 0.15)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background: "rgba(253, 164, 175, 0.12)",
            display: "flex",
          }}
        />

        {/* Logo */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "white",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <span style={{ fontSize: "64px" }}>🎉</span>
          CoolKids
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "28px",
            color: "rgba(255, 255, 255, 0.85)",
            textAlign: "center",
            maxWidth: "700px",
            lineHeight: 1.4,
            display: "flex",
          }}
        >
          Family Events in Cherokee County & North Georgia
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            marginTop: "40px",
            padding: "20px 40px",
            borderRadius: "16px",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "36px", fontWeight: 800, color: "#fbbf24" }}>300+</span>
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Events</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "36px", fontWeight: 800, color: "#34d399" }}>80+</span>
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Venues</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: "36px", fontWeight: 800, color: "#f472b6" }}>5</span>
            <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cities</span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            fontSize: "16px",
            color: "rgba(255, 255, 255, 0.5)",
            display: "flex",
          }}
        >
          Built with ❤️ for local families • coolkidsga.com
        </div>
      </div>
    ),
    { ...size }
  );
}
