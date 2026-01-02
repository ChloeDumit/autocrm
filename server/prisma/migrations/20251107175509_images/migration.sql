-- AlterTable
ALTER TABLE "payment_documents" ADD COLUMN     "contenido" TEXT,
ADD COLUMN     "mimetype" TEXT;

-- AlterTable
ALTER TABLE "vehicle_documents" ADD COLUMN     "contenido" TEXT,
ADD COLUMN     "mimetype" TEXT;
