-- CreateTable
CREATE TABLE "vehicle_property_fields" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'TEXT',
    "esPredefinida" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_property_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_properties" (
    "id" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,

    CONSTRAINT "vehicle_properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_property_fields_nombre_esPredefinida_key" ON "vehicle_property_fields"("nombre", "esPredefinida");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_properties_vehicleId_fieldId_key" ON "vehicle_properties"("vehicleId", "fieldId");

-- AddForeignKey
ALTER TABLE "vehicle_properties" ADD CONSTRAINT "vehicle_properties_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_properties" ADD CONSTRAINT "vehicle_properties_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "vehicle_property_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
