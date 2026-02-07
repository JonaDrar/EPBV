-- Rename old enum and create the new state set
ALTER TYPE "SolicitudEstado" RENAME TO "SolicitudEstado_old";

CREATE TYPE "SolicitudEstado" AS ENUM (
  'RECIBIDA',
  'EN_PROCESO',
  'APROBADA',
  'RECHAZADA',
  'LISTA'
);

ALTER TABLE "Solicitud" ALTER COLUMN "estado" DROP DEFAULT;

ALTER TABLE "Solicitud"
ALTER COLUMN "estado" TYPE "SolicitudEstado"
USING (
  CASE
    WHEN "estado"::text = 'PENDIENTE' THEN 'RECIBIDA'
    WHEN "estado"::text = 'EN_PROCESO' THEN 'EN_PROCESO'
    WHEN "estado"::text = 'RESUELTA' THEN 'APROBADA'
    WHEN "estado"::text = 'RECHAZADA' THEN 'RECHAZADA'
    ELSE 'RECIBIDA'
  END
)::"SolicitudEstado";

DROP TYPE "SolicitudEstado_old";

ALTER TABLE "Solicitud"
ALTER COLUMN "estado" SET DEFAULT 'RECIBIDA';

-- Structured fields for space requests
ALTER TABLE "Solicitud"
ADD COLUMN "espacioSolicitadoId" TEXT,
ADD COLUMN "fechaInicioSolicitada" TIMESTAMP(3),
ADD COLUMN "fechaFinSolicitada" TIMESTAMP(3);

CREATE INDEX "Solicitud_tipo_estado_idx" ON "Solicitud"("tipo", "estado");
CREATE INDEX "Solicitud_fechaFinSolicitada_idx" ON "Solicitud"("fechaFinSolicitada");
CREATE INDEX "Solicitud_espacioSolicitadoId_idx" ON "Solicitud"("espacioSolicitadoId");

ALTER TABLE "Solicitud"
ADD CONSTRAINT "Solicitud_espacioSolicitadoId_fkey"
FOREIGN KEY ("espacioSolicitadoId")
REFERENCES "Espacio"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
