import { prisma } from '@/lib/db/prisma';
import type { NotificationType } from '@/lib/generated/prisma/client';

const typeLabels: Record<string, string> = {
  DOUBT_ANSWERED: 'Doubt Answered',
  DOUBT_SUBMITTED: 'New Doubt',
  PAYMENT_CONFIRMED: 'Payment Confirmed',
  PAYMENT_FAILED: 'Payment Failed',
  ENROLLMENT_ACTIVE: 'Enrollment Active',
  LINK_APPROVED: 'Link Approved',
  LINK_REQUESTED: 'Link Requested',
  ATTENDANCE_LOW: 'Low Attendance',
  INQUIRY_RECEIVED: 'New Inquiry',
  SYSTEM: 'System Notification',
  FEEDBACK_PUBLISHED: 'Feedback Published',
};

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title?: string;
  message: string;
  link?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title || typeLabels[data.type] || 'Notification',
        message: data.message,
        link: data.link || null,
      },
    });
  } catch (err) {
    console.error('[Notification] Failed to create:', err);
  }
}

export async function createNotificationForEnrollment(enrollmentId: string, batchName: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { student: { select: { id: true } } },
  });
  if (!enrollment) return;

  return createNotification({
    userId: enrollment.student.id,
    type: 'ENROLLMENT_ACTIVE',
    message: `Your enrollment in ${batchName} is now active.`,
    link: '/dashboard/student',
  });
}

export async function createNotificationForPayment(paymentId: string, status: string, amount: number) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      payer: { select: { id: true, name: true } },
      enrollment: { include: { batch: { select: { subject: { select: { name: true } } } } } },
    },
  });
  if (!payment) return;

  const batchName = payment.enrollment?.batch?.subject?.name || 'Batch';
  const isParentFlow = payment.payer.id !== payment.enrollment?.studentId;

  const notifications: Promise<unknown>[] = [];

  if (status === 'SUCCEEDED') {
    notifications.push(
      createNotification({
        userId: payment.payer.id,
        type: 'PAYMENT_CONFIRMED',
        message: `Payment of ₹${(amount / 100).toLocaleString()} for ${batchName} confirmed.`,
        link: '/dashboard/student',
      })
    );
    if (payment.enrollment) {
      notifications.push(
        createNotificationForEnrollment(payment.enrollmentId, batchName)
      );
    }
  } else if (status === 'FAILED') {
    notifications.push(
      createNotification({
        userId: payment.payer.id,
        type: 'PAYMENT_FAILED',
        message: `Payment of ₹${(amount / 100).toLocaleString()} for ${batchName} failed. Please try again.`,
        link: '/dashboard/student',
      })
    );
  }

  await Promise.all(notifications);
}

export async function createNotificationForDoubtAnswered(doubtId: string) {
  const doubt = await prisma.doubtQuery.findUnique({
    where: { id: doubtId },
    include: {
      student: { select: { id: true, name: true } },
      batch: { select: { subject: { select: { name: true } } } },
      respondedBy: { select: { name: true } },
    },
  });
  if (!doubt || doubt.status !== 'ANSWERED' || !doubt.respondedBy) return;

  return createNotification({
    userId: doubt.student.id,
    type: 'DOUBT_ANSWERED',
    message: `${doubt.respondedBy.name} answered your doubt in ${doubt.batch.subject.name}.`,
    link: '/dashboard/student',
  });
}

export async function createNotificationForDoubtSubmitted(doubtId: string) {
  const doubt = await prisma.doubtQuery.findUnique({
    where: { id: doubtId },
    include: {
      student: { select: { id: true, name: true } },
      batch: { select: { facultyId: true, subject: { select: { name: true } } } },
    },
  });
  if (!doubt) return;

  return createNotification({
    userId: doubt.batch.facultyId,
    type: 'DOUBT_SUBMITTED',
    message: `${doubt.student.name} submitted a doubt in ${doubt.batch.subject.name}.`,
    link: '/dashboard/faculty/doubts',
  });
}

export async function createNotificationForFeedbackPublished(submissionId: string) {
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: { select: { title: true } },
      student: { select: { id: true, name: true } },
    },
  });
  if (!submission || !submission.feedbackPublished) return;

  return createNotification({
    userId: submission.student.id,
    type: 'FEEDBACK_PUBLISHED',
    message: `Your feedback for "${submission.assignment.title}" has been published.`,
    link: '/dashboard/student/assignments',
  });
}

export async function createNotificationForLinkApproved(linkId: string, status: string) {
  const link = await prisma.parentStudentLink.findUnique({
    where: { id: linkId },
    include: { parent: { select: { id: true, name: true } }, student: { select: { id: true, name: true } } },
  });
  if (!link) return;

  if (status === 'APPROVED') {
    await Promise.all([
      createNotification({
        userId: link.parent.id,
        type: 'LINK_APPROVED',
        message: `Your link with ${link.student.name} has been approved.`,
        link: '/dashboard/parent',
      }),
      createNotification({
        userId: link.student.id,
        type: 'LINK_APPROVED',
        message: `Your link with ${link.parent.name} has been approved.`,
        link: '/dashboard/student',
      }),
    ]);
  }
}
