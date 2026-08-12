-- AlterTable
ALTER TABLE "email_logs" ADD COLUMN     "emailType" TEXT,
ADD COLUMN     "payloadData" JSONB,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "email_logs_emailType_idx" ON "email_logs"("emailType");
