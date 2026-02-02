export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      <div style={{ padding: "24px 0 8px" }}>
        <img src="/EPBV.svg" alt="Espacio por el Buen Vivir" style={{ width: 160, height: "auto" }} />
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
        {children}
      </div>
    </div>
  );
}
