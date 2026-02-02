# Espacio por el Buen Vivir

Sistema interno para gestión de solicitudes, espacios, reservas y eventos con trazabilidad legal.

## Requisitos
- Node.js 18+
- PostgreSQL

## Setup rápido
1) Instalar dependencias:
```
npm install
```

2) Configurar variables de entorno:
```
cp .env.example .env
```
En monorepo, Next y Prisma leen `.env` desde `apps/web` y `packages/db`.
Puedes copiar o crear symlinks:
```
cp .env apps/web/.env
cp .env packages/db/.env
```
Si usas Neon, recomienda:
- `DATABASE_URL` = pooled (host con `-pooler`, puerto 6432, `?sslmode=require`)
- `DIRECT_DATABASE_URL` = direct (host sin `-pooler`, puerto 5432, `?sslmode=require`)
En local, el runtime usa `DIRECT_DATABASE_URL` si existe (mejor para redes que bloquean 6432).

3) Generar cliente Prisma y migrar:
```
npm run prisma:generate
npm run prisma:migrate
```

4) Crear usuario admin inicial:
```
ADMIN_EMAIL="admin@tu-dominio.cl" ADMIN_PASSWORD="tu-password" ADMIN_NAME="Administrador" \
  npm --workspace @ebv/db run prisma:seed
```

5) Iniciar el proyecto:
```
npm run dev
```

## Scripts útiles
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm --workspace @ebv/db run prisma:seed`
- `npm --workspace @ebv/db run prisma:studio`

## Notas
- Las notificaciones se envían por correo (Resend). Si no hay API key, se registra el fallo en AuditLog.
- Las rutas API aplican autorización por rol y registran trazabilidad legal en `AuditLog`.
- `AuditLog.id` usa UUID; si tu PostgreSQL no tiene `pgcrypto`, habilita la extensión antes de migrar.
- Existe un módulo de administración de usuarios (solo ADMIN) para creación, roles, activación y reset de contraseña por correo.
- Variables útiles: `APP_URL` (base para links de reset) y `PASSWORD_RESET_TTL_MINUTES` (expiración del código).
