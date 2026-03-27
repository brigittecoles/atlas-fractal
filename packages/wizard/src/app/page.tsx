import Link from "next/link";

export default function Home() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-app)",
      color: "var(--text-1)",
      fontFamily: "var(--font-body)",
      padding: "var(--sp-2xl)",
    }}>
      <h1 style={{
        fontSize: "var(--fs-xl)",
        fontWeight: "var(--fw-bold)",
        marginBottom: "var(--sp-md)",
        letterSpacing: "-0.5px",
      }}>
        ATLAS-Fractal
      </h1>
      <p style={{
        fontSize: "var(--fs-md)",
        color: "var(--text-2)",
        marginBottom: "var(--sp-2xl)",
        maxWidth: 500,
        textAlign: "center",
        lineHeight: "var(--lh)",
      }}>
        AI-Native Agent Configuration Engine with Structural NPV.
        Design fractal agent systems where every node earns its existence.
      </p>
      <Link
        href="/wizard/intake"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--sp-sm)",
          padding: "var(--sp-md) var(--sp-xl)",
          background: "var(--accent)",
          color: "var(--text-inv)",
          borderRadius: "var(--radius-md)",
          textDecoration: "none",
          fontSize: "var(--fs-md)",
          fontWeight: "var(--fw-bold)",
          fontFamily: "var(--font-body)",
          transition: "background var(--trans)",
        }}
      >
        Start New Session
      </Link>
    </div>
  );
}
