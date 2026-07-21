-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "facultyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resources" JSONB,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_batches" (
    "assignmentId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,

    CONSTRAINT "assignment_batches_pkey" PRIMARY KEY ("assignmentId", "batchId")
);

-- CreateTable
CREATE TABLE "assignment_submissions" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "submissionText" TEXT,
    "fileUrls" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grade" INTEGER,
    "feedback" TEXT,
    "feedbackPublished" BOOLEAN NOT NULL DEFAULT false,
    "feedbackPublishedAt" TIMESTAMP(3),

    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_assignmentId_studentId_key" ON "assignment_submissions"("assignmentId", "studentId");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_batches" ADD CONSTRAINT "assignment_batches_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_batches" ADD CONSTRAINT "assignment_batches_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'FEEDBACK_PUBLISHED';
ALTER TYPE "NotificationType" ADD VALUE 'LIVE_SESSION_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'LIVE_SESSION_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE 'RECORDING_PUBLISHED';

-- CreateEnum
CREATE TYPE "MeetingPlatform" AS ENUM ('ZOOM', 'GOOGLE_MEET', 'MICROSOFT_TEAMS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "LiveSessionStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "live_sessions" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "platform" "MeetingPlatform" NOT NULL,
    "meetingUrl" TEXT NOT NULL,
    "meetingId" TEXT,
    "passcode" TEXT,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "status" "LiveSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringPattern" JSONB,
    "providerMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_session_attendance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "duration" INTEGER,
    "source" TEXT,
    "metadata" JSONB,

    CONSTRAINT "live_session_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recordings" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "batchId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "password" TEXT,
    "duration" INTEGER,
    "thumbnail" TEXT,
    "platform" "MeetingPlatform" NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recordings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "live_sessions_batchId_scheduledStart_idx" ON "live_sessions"("batchId", "scheduledStart");

-- CreateIndex
CREATE INDEX "live_sessions_facultyId_scheduledStart_idx" ON "live_sessions"("facultyId", "scheduledStart");

-- CreateIndex
CREATE INDEX "live_sessions_status_idx" ON "live_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "live_session_attendance_sessionId_studentId_key" ON "live_session_attendance"("sessionId", "studentId");

-- CreateIndex
CREATE INDEX "recordings_batchId_published_idx" ON "recordings"("batchId", "published");

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_attendance" ADD CONSTRAINT "live_session_attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_attendance" ADD CONSTRAINT "live_session_attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
