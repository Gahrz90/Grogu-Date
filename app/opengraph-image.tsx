import { ImageResponse } from "next/og";

export const alt = "Mi chiedo se ti andrebbe di uscire con me?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #0b2418 0%, #030b08 55%, #06110d 100%)",
          color: "#f4ead4",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#a8d38a",
          }}
        >
          Trasmissione in arrivo
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 88,
            fontWeight: 700,
            letterSpacing: -2,
          }}
        >
          Grogu si chiede se ti andrebbe una date con me?
        </div>
        <div style={{ display: "flex", marginTop: 26, fontSize: 32, color: "#f4ead499" }}>
          Due pulsanti. Uno dei due scappa.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 56,
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "18px 52px",
              borderRadius: 999,
              background: "#a8d38a",
              color: "#030b08",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            Sì
          </div>
          <div
            style={{
              display: "flex",
              padding: "18px 52px",
              borderRadius: 999,
              border: "2px solid #f4ead440",
              color: "#f4ead4aa",
              fontSize: 34,
              transform: "rotate(-9deg) translateX(30px)",
            }}
          >
            No
          </div>
        </div>
      </div>
    ),
    size,
  );
}
