# Arquitectura

## Visión general
Monorepo con Next.js (App Router) como única app. La API vive en `apps/web/app/api` y comparte código con paquetes internos.

## Componentes
- `apps/web`: UI y API Routes.
- `packages/db`: Prisma schema, cliente y helper `logAuditEvent()`.
- `packages/auth`: autenticación, sesiones y autorización por rol.
- `packages/mail`: envío de correos transaccionales (Resend o consola).
- `apps/web/app/(dashboard)/usuarios`: administración de usuarios (solo ADMIN).

## Datos
PostgreSQL con Prisma. Modelos clave: usuarios, solicitudes, reservas, eventos, espacios y `AuditLog` append-only.

## Autenticación
- Login con correo y contraseña (bcrypt).
- Sesión persistida en DB, cookie HttpOnly.
- Middleware básico para proteger rutas UI y autorización por rol en cada API.

## Trazabilidad legal
Todas las acciones relevantes escriben en `AuditLog` con actor, entidad, acción, antes/después y metadatos (IP, user-agent, ruta, método).

## Notificaciones
Correo transaccional en eventos clave (solicitudes y reservas). Cada envío se registra en `AuditLog`.
