import Link from "next/link";
import type { Role } from "@ebv/db";

const baseLinks = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/solicitudes", label: "Solicitudes" },
  { href: "/calendario", label: "Calendario" },
  { href: "/programas", label: "Programas" },
  { href: "/dashboard/perfil", label: "Mi perfil" },
];

const adminLinks = [
  { href: "/dashboard/solicitudes-admin", label: "Solicitudes (admin)" },
  { href: "/dashboard/usuarios", label: "Usuarios" },
  { href: "/dashboard/espacios", label: "Espacios" },
  { href: "/dashboard/auditoria", label: "Auditoría" },
  { href: "/administracion", label: "Administración" },
];

export function Sidebar({ role }: { role: Role }) {
  const links = role === "ADMIN" ? [...baseLinks, ...adminLinks] : baseLinks;

  return (
    <aside style={{
      width: 240,
      padding: "24px 16px",
      background: "var(--panel)",
      borderRight: "1px solid var(--border)",
      minHeight: "100vh",
    }}>
      <div style={{ fontWeight: 700, marginBottom: 24 }}>Espacio Buen Vivir</div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <div style={{ marginTop: 24, color: "var(--muted)", fontSize: 12 }}>
        Rol: {role}
      </div>
    </aside>
  );
}
