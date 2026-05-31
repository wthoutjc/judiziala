-- CreateEnum
CREATE TYPE "RolSujeto" AS ENUM ('demandante', 'demandado', 'fiscalia', 'defensor', 'apoderado_victima', 'numero_interno', 'otro');

-- CreateEnum
CREATE TYPE "EstadoProceso" AS ENUM ('activo', 'en_despacho', 'urgente', 'suspendido', 'archivado');

-- CreateEnum
CREATE TYPE "EstadoActuacion" AS ENUM ('completado', 'actual', 'pendiente');

-- CreateEnum
CREATE TYPE "AlertaTipo" AS ENUM ('urgente', 'info', 'advertencia');

-- CreateTable
CREATE TABLE "Proceso" (
    "id" TEXT NOT NULL,
    "cpnuIdProceso" INTEGER NOT NULL,
    "cpnuIdConexion" INTEGER NOT NULL,
    "radicado" VARCHAR(23) NOT NULL,
    "despacho" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "ponente" TEXT,
    "tipoProceso" TEXT,
    "claseProceso" TEXT,
    "subclaseProceso" TEXT,
    "recurso" TEXT,
    "ubicacion" TEXT,
    "esPrivado" BOOLEAN NOT NULL DEFAULT false,
    "fechaRadicacion" TIMESTAMP(3) NOT NULL,
    "fechaUltimaActuacion" TIMESTAMP(3) NOT NULL,
    "ultimaActualizacion" TIMESTAMP(3),
    "estado" "EstadoProceso" NOT NULL DEFAULT 'activo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sujeto" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "rol" "RolSujeto" NOT NULL,
    "nombre" TEXT NOT NULL,
    "raw" TEXT NOT NULL,

    CONSTRAINT "Sujeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actuacion" (
    "id" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "consActuacion" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicial" TIMESTAMP(3),
    "fechaFinal" TIMESTAMP(3),
    "fechaRegistro" TIMESTAMP(3) NOT NULL,
    "conDocumentos" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoActuacion" NOT NULL DEFAULT 'completado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actuacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoreoProceso" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitoreoProceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerta" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "procesoId" TEXT NOT NULL,
    "radicado" VARCHAR(23) NOT NULL,
    "tipo" "AlertaTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "actuacionId" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proceso_cpnuIdProceso_key" ON "Proceso"("cpnuIdProceso");

-- CreateIndex
CREATE UNIQUE INDEX "Proceso_radicado_key" ON "Proceso"("radicado");

-- CreateIndex
CREATE INDEX "Proceso_estado_idx" ON "Proceso"("estado");

-- CreateIndex
CREATE INDEX "Proceso_fechaUltimaActuacion_idx" ON "Proceso"("fechaUltimaActuacion");

-- CreateIndex
CREATE INDEX "Sujeto_procesoId_idx" ON "Sujeto"("procesoId");

-- CreateIndex
CREATE INDEX "Sujeto_procesoId_rol_idx" ON "Sujeto"("procesoId", "rol");

-- CreateIndex
CREATE INDEX "Actuacion_procesoId_fecha_idx" ON "Actuacion"("procesoId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Actuacion_procesoId_consActuacion_key" ON "Actuacion"("procesoId", "consActuacion");

-- CreateIndex
CREATE INDEX "MonitoreoProceso_userId_idx" ON "MonitoreoProceso"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MonitoreoProceso_userId_procesoId_key" ON "MonitoreoProceso"("userId", "procesoId");

-- CreateIndex
CREATE INDEX "Alerta_userId_leida_idx" ON "Alerta"("userId", "leida");

-- CreateIndex
CREATE INDEX "Alerta_userId_createdAt_idx" ON "Alerta"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Alerta_procesoId_idx" ON "Alerta"("procesoId");

-- AddForeignKey
ALTER TABLE "Sujeto" ADD CONSTRAINT "Sujeto_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "Proceso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actuacion" ADD CONSTRAINT "Actuacion_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "Proceso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoreoProceso" ADD CONSTRAINT "MonitoreoProceso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitoreoProceso" ADD CONSTRAINT "MonitoreoProceso_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "Proceso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_procesoId_fkey" FOREIGN KEY ("procesoId") REFERENCES "Proceso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_actuacionId_fkey" FOREIGN KEY ("actuacionId") REFERENCES "Actuacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
