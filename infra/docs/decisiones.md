# Decisiones técnicas

- **Next.js App Router**: unifica UI + API en un solo deploy compatible con Vercel Free.
- **PostgreSQL + Prisma**: modelos claros, migraciones simples y tipado fuerte.
- **Sesiones en DB**: evita JWT y permite revocación y trazabilidad completa.
- **bcryptjs**: hashing compatible con bcrypt sin dependencias nativas.
- **AuditLog append-only**: no se exponen endpoints de actualización/eliminación.
- **Soft delete de espacios**: se desactiva con `activo=false` para mantener historial.
- **Correo con Resend (abstracción)**: proveedor opcional; si no hay API key, se registra error.
- **Administración interna**: módulo simple de usuarios y cambio de contraseña para autogestión.
