-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'INTERNAL');

-- CreateEnum
CREATE TYPE "SolicitudTipo" AS ENUM ('MANTENCION', 'ADMINISTRACION', 'DIFUSION', 'OTRO');

-- CreateEnum
CREATE TYPE "SolicitudEstado" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "EspacioTipo" AS ENUM ('SALA', 'SALON', 'CANCHA');

-- CreateEnum
CREATE TYPE "ReservaEstado" AS ENUM ('ACTIVA', 'CANCELADA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" TEXT NOT NULL,
    "tipo" "SolicitudTipo" NOT NULL,
    "estado" "SolicitudEstado" NOT NULL DEFAULT 'PENDIENTE',
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudComentario" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "comentario" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitudComentario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Espacio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "EspacioTipo" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Espacio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "espacioId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" "ReservaEstado" NOT NULL DEFAULT 'ACTIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "espacioId" TEXT NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Solicitud_estado_idx" ON "Solicitud"("estado");

-- CreateIndex
CREATE INDEX "Reserva_fechaInicio_fechaFin_idx" ON "Reserva"("fechaInicio", "fechaFin");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudComentario" ADD CONSTRAINT "SolicitudComentario_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudComentario" ADD CONSTRAINT "SolicitudComentario_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_espacioId_fkey" FOREIGN KEY ("espacioId") REFERENCES "Espacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_espacioId_fkey" FOREIGN KEY ("espacioId") REFERENCES "Espacio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
