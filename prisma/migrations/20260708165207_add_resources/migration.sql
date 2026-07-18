-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('NOTES', 'PRACTICE_PAPERS', 'REFERENCE_BOOKS', 'VIDEOS');

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_tracks" (
    "resourceId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,

    CONSTRAINT "resource_tracks_pkey" PRIMARY KEY ("resourceId","trackId")
);

-- CreateTable
CREATE TABLE "resource_batches" (
    "resourceId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,

    CONSTRAINT "resource_batches_pkey" PRIMARY KEY ("resourceId","batchId")
);

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_tracks" ADD CONSTRAINT "resource_tracks_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_tracks" ADD CONSTRAINT "resource_tracks_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_batches" ADD CONSTRAINT "resource_batches_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_batches" ADD CONSTRAINT "resource_batches_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
