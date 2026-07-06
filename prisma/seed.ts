import 'dotenv/config';
import { PrismaClient } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PASSWORD_HASH = bcrypt.hashSync('Kaushiki@123', 10);
const ADMIN_PHONE = '9175498572';

async function main() {
  console.log('Seeding database...');

  // ── USERS ─────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { phone: ADMIN_PHONE },
    update: { name: 'Rajesh Sharma', email: 'admin@kaushikiclasses.in', passwordHash: PASSWORD_HASH, role: 'ADMIN', status: 'ACTIVE', phoneVerified: true },
    create: { name: 'Rajesh Sharma', phone: ADMIN_PHONE, email: 'admin@kaushikiclasses.in', passwordHash: PASSWORD_HASH, role: 'ADMIN', status: 'ACTIVE', phoneVerified: true },
  });
  console.log('  Admin:', admin.id);

  const faculty1 = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: { name: 'Priya Kulkarni', email: 'priya.k@kaushikiclasses.in', passwordHash: PASSWORD_HASH, role: 'FACULTY', status: 'ACTIVE', phoneVerified: true },
    create: { name: 'Priya Kulkarni', phone: '9876543210', email: 'priya.k@kaushikiclasses.in', passwordHash: PASSWORD_HASH, role: 'FACULTY', status: 'ACTIVE', phoneVerified: true },
  });
  const faculty2 = await prisma.user.upsert({
    where: { phone: '9823456701' },
    update: { name: 'Amit Desai', email: 'amit.d@kaushikiclasses.in', passwordHash: PASSWORD_HASH, role: 'FACULTY', status: 'ACTIVE', phoneVerified: true },
    create: { name: 'Amit Desai', phone: '9823456701', email: 'amit.d@kaushikiclasses.in', passwordHash: PASSWORD_HASH, role: 'FACULTY', status: 'ACTIVE', phoneVerified: true },
  });
  const faculty3 = await prisma.user.upsert({
    where: { phone: '9712345678' },
    update: { name: 'Sunita Joshi', email: 'sunita.j@kaushikiclasses.in', passwordHash: PASSWORD_HASH, role: 'FACULTY', status: 'ACTIVE', phoneVerified: true },
    create: { name: 'Sunita Joshi', phone: '9712345678', email: 'sunita.j@kaushikiclasses.in', passwordHash: PASSWORD_HASH, role: 'FACULTY', status: 'ACTIVE', phoneVerified: true },
  });

  const student1 = await prisma.user.upsert({
    where: { phone: '9900112233' },
    update: { name: 'Arjun Patil', email: 'arjun.patil@gmail.com', passwordHash: PASSWORD_HASH, role: 'STUDENT', status: 'ACTIVE', phoneVerified: true },
    create: { name: 'Arjun Patil', phone: '9900112233', email: 'arjun.patil@gmail.com', passwordHash: PASSWORD_HASH, role: 'STUDENT', status: 'ACTIVE', phoneVerified: true },
  });
  const student2 = await prisma.user.upsert({
    where: { phone: '9900223344' },
    update: { name: 'Sneha Mehta', email: 'sneha.mehta@gmail.com', passwordHash: PASSWORD_HASH, role: 'STUDENT', status: 'ACTIVE', phoneVerified: true },
    create: { name: 'Sneha Mehta', phone: '9900223344', email: 'sneha.mehta@gmail.com', passwordHash: PASSWORD_HASH, role: 'STUDENT', status: 'ACTIVE', phoneVerified: true },
  });
  const student3 = await prisma.user.upsert({
    where: { phone: '9900334455' },
    update: { name: 'Rohan Kadam', email: 'rohan.kadam@gmail.com', passwordHash: PASSWORD_HASH, role: 'STUDENT', status: 'ACTIVE', phoneVerified: true },
    create: { name: 'Rohan Kadam', phone: '9900334455', email: 'rohan.kadam@gmail.com', passwordHash: PASSWORD_HASH, role: 'STUDENT', status: 'ACTIVE', phoneVerified: true },
  });

  const parent1 = await prisma.user.upsert({
    where: { phone: '9800112233' },
    update: { name: 'Suresh Patil', email: 'suresh.patil@gmail.com', passwordHash: PASSWORD_HASH, role: 'PARENT', status: 'ACTIVE', phoneVerified: true },
    create: { name: 'Suresh Patil', phone: '9800112233', email: 'suresh.patil@gmail.com', passwordHash: PASSWORD_HASH, role: 'PARENT', status: 'ACTIVE', phoneVerified: true },
  });
  const parent2 = await prisma.user.upsert({
    where: { phone: '9800223344' },
    update: { name: 'Anita Mehta', email: 'anita.mehta@gmail.com', passwordHash: PASSWORD_HASH, role: 'PARENT', status: 'ACTIVE', phoneVerified: true },
    create: { name: 'Anita Mehta', phone: '9800223344', email: 'anita.mehta@gmail.com', passwordHash: PASSWORD_HASH, role: 'PARENT', status: 'ACTIVE', phoneVerified: true },
  });

  // ── PARENT-STUDENT LINKS ───────────────────────────────
  await prisma.parentStudentLink.upsert({
    where: { parentId_studentId: { parentId: parent1.id, studentId: student1.id } },
    update: { status: 'APPROVED', approvedById: admin.id },
    create: { parentId: parent1.id, studentId: student1.id, status: 'APPROVED', approvedById: admin.id },
  });
  await prisma.parentStudentLink.upsert({
    where: { parentId_studentId: { parentId: parent2.id, studentId: student2.id } },
    update: { status: 'APPROVED', approvedById: admin.id },
    create: { parentId: parent2.id, studentId: student2.id, status: 'APPROVED', approvedById: admin.id },
  });

  // ── TRACKS ─────────────────────────────────────────────
  const trackData = [
    { name: 'CLASSES_1_5', boardCoverage: 'CBSE | ICSE | State Board', displayOrder: 1 },
    { name: 'CLASSES_6_10', boardCoverage: 'CBSE | ICSE | State Board', displayOrder: 2 },
    { name: 'CLASSES_11_12_COMMERCE', boardCoverage: 'State Board | CBSE', displayOrder: 3 },
    { name: 'CA_FOUNDATION_INTERMEDIATE', boardCoverage: null, displayOrder: 4 },
  ] as const;
  const tracks: Record<string, any> = {};
  for (const t of trackData) {
    tracks[t.name] = await prisma.track.upsert({
      where: { name: t.name },
      update: { boardCoverage: t.boardCoverage, displayOrder: t.displayOrder },
      create: { ...t },
    });
  }

  // ── SUBJECTS ──────────────────────────────────────────
  const subjectData = [
    { trackName: 'CLASSES_1_5', name: 'All Subjects' },
    { trackName: 'CLASSES_6_10', name: 'Mathematics' },
    { trackName: 'CLASSES_6_10', name: 'Science' },
    { trackName: 'CLASSES_6_10', name: 'English' },
    { trackName: 'CLASSES_6_10', name: 'Social Studies' },
    { trackName: 'CLASSES_11_12_COMMERCE', name: 'Accountancy' },
    { trackName: 'CLASSES_11_12_COMMERCE', name: 'Business Studies' },
    { trackName: 'CLASSES_11_12_COMMERCE', name: 'Economics' },
    { trackName: 'CLASSES_11_12_COMMERCE', name: 'Mathematics (SP/IP)' },
    { trackName: 'CA_FOUNDATION_INTERMEDIATE', name: 'CA Foundation' },
    { trackName: 'CA_FOUNDATION_INTERMEDIATE', name: 'CA Intermediate' },
  ];
  const subjects: Record<string, any> = {};
  for (const s of subjectData) {
    const trackId = tracks[s.trackName].id;
    const subject = await prisma.subject.upsert({
      where: { trackId_name: { trackId, name: s.name } },
      update: { trackId },
      create: { trackId, name: s.name },
    });
    subjects[`${s.trackName}_${s.name}`] = subject;
  }

  // ── BATCHES ───────────────────────────────────────────
  const batch1 = await prisma.batch.upsert({
    where: { id: 'seed-batch-math-10' },
    update: { subjectId: subjects['CLASSES_6_10_Mathematics'].id, facultyId: faculty1.id, capacity: 15, seatsFilled: 3, schedule: 'Mon / Wed / Fri — 4:00 PM to 5:30 PM', status: 'ACTIVE' },
    create: { id: 'seed-batch-math-10', subjectId: subjects['CLASSES_6_10_Mathematics'].id, facultyId: faculty1.id, capacity: 15, seatsFilled: 3, schedule: 'Mon / Wed / Fri — 4:00 PM to 5:30 PM', status: 'ACTIVE' },
  });
  const batch2 = await prisma.batch.upsert({
    where: { id: 'seed-batch-science-9' },
    update: { subjectId: subjects['CLASSES_6_10_Science'].id, facultyId: faculty2.id, capacity: 12, seatsFilled: 2, schedule: 'Tue / Thu / Sat — 5:00 PM to 6:30 PM', status: 'ACTIVE' },
    create: { id: 'seed-batch-science-9', subjectId: subjects['CLASSES_6_10_Science'].id, facultyId: faculty2.id, capacity: 12, seatsFilled: 2, schedule: 'Tue / Thu / Sat — 5:00 PM to 6:30 PM', status: 'ACTIVE' },
  });
  const batch3 = await prisma.batch.upsert({
    where: { id: 'seed-batch-accountancy-11' },
    update: { subjectId: subjects['CLASSES_11_12_COMMERCE_Accountancy'].id, facultyId: faculty1.id, capacity: 10, seatsFilled: 2, schedule: 'Mon / Wed / Fri — 6:00 PM to 7:30 PM', status: 'ACTIVE' },
    create: { id: 'seed-batch-accountancy-11', subjectId: subjects['CLASSES_11_12_COMMERCE_Accountancy'].id, facultyId: faculty1.id, capacity: 10, seatsFilled: 2, schedule: 'Mon / Wed / Fri — 6:00 PM to 7:30 PM', status: 'ACTIVE' },
  });
  const batch4 = await prisma.batch.upsert({
    where: { id: 'seed-batch-ca-foundation' },
    update: { subjectId: subjects['CA_FOUNDATION_INTERMEDIATE_CA Foundation'].id, facultyId: faculty3.id, capacity: 8, seatsFilled: 1, schedule: 'Daily — 7:00 AM to 9:00 AM', status: 'ACTIVE' },
    create: { id: 'seed-batch-ca-foundation', subjectId: subjects['CA_FOUNDATION_INTERMEDIATE_CA Foundation'].id, facultyId: faculty3.id, capacity: 8, seatsFilled: 1, schedule: 'Daily — 7:00 AM to 9:00 AM', status: 'ACTIVE' },
  });

  // ── ENROLLMENTS ───────────────────────────────────────
  const enroll1 = await prisma.enrollment.upsert({
    where: { studentId_batchId: { studentId: student1.id, batchId: batch1.id } },
    update: { status: 'ACTIVE', enrolledAt: new Date('2026-06-01') },
    create: { studentId: student1.id, batchId: batch1.id, status: 'ACTIVE', enrolledAt: new Date('2026-06-01') },
  });
  const enroll2 = await prisma.enrollment.upsert({
    where: { studentId_batchId: { studentId: student1.id, batchId: batch2.id } },
    update: { status: 'ACTIVE', enrolledAt: new Date('2026-06-01') },
    create: { studentId: student1.id, batchId: batch2.id, status: 'ACTIVE', enrolledAt: new Date('2026-06-01') },
  });
  const enroll3 = await prisma.enrollment.upsert({
    where: { studentId_batchId: { studentId: student2.id, batchId: batch3.id } },
    update: { status: 'ACTIVE', enrolledAt: new Date('2026-06-10') },
    create: { studentId: student2.id, batchId: batch3.id, status: 'ACTIVE', enrolledAt: new Date('2026-06-10') },
  });
  const enroll4 = await prisma.enrollment.upsert({
    where: { studentId_batchId: { studentId: student3.id, batchId: batch4.id } },
    update: { status: 'ACTIVE', enrolledAt: new Date('2026-06-15') },
    create: { studentId: student3.id, batchId: batch4.id, status: 'ACTIVE', enrolledAt: new Date('2026-06-15') },
  });
  const enroll5 = await prisma.enrollment.upsert({
    where: { studentId_batchId: { studentId: student2.id, batchId: batch1.id } },
    update: { status: 'ACTIVE', enrolledAt: new Date('2026-06-12') },
    create: { studentId: student2.id, batchId: batch1.id, status: 'ACTIVE', enrolledAt: new Date('2026-06-12') },
  });

  // ── PAYMENTS ──────────────────────────────────────────
  await prisma.payment.upsert({
    where: { enrollmentId: enroll1.id },
    update: { payerId: parent1.id, amount: 450000, currency: 'INR', gateway: 'razorpay', gatewayEventId: 'mock_evt_001', gatewayOrderId: 'mock_order_001', status: 'SUCCEEDED', createdAt: new Date('2026-06-01') },
    create: { enrollmentId: enroll1.id, payerId: parent1.id, amount: 450000, currency: 'INR', gateway: 'razorpay', gatewayEventId: 'mock_evt_001', gatewayOrderId: 'mock_order_001', status: 'SUCCEEDED', createdAt: new Date('2026-06-01') },
  });
  await prisma.payment.upsert({
    where: { enrollmentId: enroll2.id },
    update: { payerId: parent1.id, amount: 420000, currency: 'INR', gateway: 'razorpay', gatewayEventId: 'mock_evt_002', gatewayOrderId: 'mock_order_002', status: 'SUCCEEDED', createdAt: new Date('2026-06-01') },
    create: { enrollmentId: enroll2.id, payerId: parent1.id, amount: 420000, currency: 'INR', gateway: 'razorpay', gatewayEventId: 'mock_evt_002', gatewayOrderId: 'mock_order_002', status: 'SUCCEEDED', createdAt: new Date('2026-06-01') },
  });
  await prisma.payment.upsert({
    where: { enrollmentId: enroll3.id },
    update: { payerId: student2.id, amount: 600000, currency: 'INR', gateway: 'razorpay', gatewayEventId: 'mock_evt_003', gatewayOrderId: 'mock_order_003', status: 'SUCCEEDED', createdAt: new Date('2026-06-10') },
    create: { enrollmentId: enroll3.id, payerId: student2.id, amount: 600000, currency: 'INR', gateway: 'razorpay', gatewayEventId: 'mock_evt_003', gatewayOrderId: 'mock_order_003', status: 'SUCCEEDED', createdAt: new Date('2026-06-10') },
  });
  await prisma.payment.upsert({
    where: { enrollmentId: enroll4.id },
    update: { payerId: student3.id, amount: 800000, currency: 'INR', gateway: 'razorpay', gatewayEventId: 'mock_evt_004', gatewayOrderId: 'mock_order_004', status: 'FAILED', failureReason: 'Card declined', createdAt: new Date('2026-06-15') },
    create: { enrollmentId: enroll4.id, payerId: student3.id, amount: 800000, currency: 'INR', gateway: 'razorpay', gatewayEventId: 'mock_evt_004', gatewayOrderId: 'mock_order_004', status: 'FAILED', failureReason: 'Card declined', createdAt: new Date('2026-06-15') },
  });
  await prisma.payment.upsert({
    where: { enrollmentId: enroll5.id },
    update: { payerId: parent2.id, amount: 450000, currency: 'INR', gateway: 'razorpay', gatewayEventId: 'mock_evt_005', gatewayOrderId: 'mock_order_005', status: 'SUCCEEDED', createdAt: new Date('2026-06-12') },
    create: { enrollmentId: enroll5.id, payerId: parent2.id, amount: 450000, currency: 'INR', gateway: 'razorpay', gatewayEventId: 'mock_evt_005', gatewayOrderId: 'mock_order_005', status: 'SUCCEEDED', createdAt: new Date('2026-06-12') },
  });

  // ── ATTENDANCE ────────────────────────────────────────
  const attendanceDates = ['2026-06-02','2026-06-04','2026-06-06','2026-06-09','2026-06-11',
    '2026-06-13','2026-06-16','2026-06-18','2026-06-20','2026-06-23'];
  const attendanceRecords = [
    ...attendanceDates.map((d, i) => ({ batchId: batch1.id, studentId: student1.id, sessionDate: new Date(d), present: i !== 3 && i !== 7 })),
    ...attendanceDates.map((d, i) => ({ batchId: batch2.id, studentId: student1.id, sessionDate: new Date(d), present: i !== 5 })),
    ...attendanceDates.map((d, i) => ({ batchId: batch3.id, studentId: student2.id, sessionDate: new Date(d), present: i !== 1 && i !== 4 && i !== 8 })),
    ...attendanceDates.map((d, i) => ({ batchId: batch1.id, studentId: student2.id, sessionDate: new Date(d), present: true })),
    ...attendanceDates.map((d, i) => ({ batchId: batch4.id, studentId: student3.id, sessionDate: new Date(d), present: i % 2 === 0 })),
  ];
  for (const record of attendanceRecords) {
    await prisma.attendance.upsert({
      where: { batchId_studentId_sessionDate: { batchId: record.batchId, studentId: record.studentId, sessionDate: record.sessionDate } },
      update: { present: record.present, markedById: faculty1.id },
      create: { ...record, markedById: faculty1.id },
    });
  }

  // ── TEST SCORES ───────────────────────────────────────
  const scoreData = [
    { batchId: batch1.id, studentId: student1.id, testName: 'Unit Test 1 — Algebra', score: 78, maxScore: 100, testDate: new Date('2026-06-07'), remark: 'Good understanding, improve speed' },
    { batchId: batch1.id, studentId: student1.id, testName: 'Unit Test 2 — Geometry', score: 85, maxScore: 100, testDate: new Date('2026-06-14'), remark: 'Excellent spatial reasoning' },
    { batchId: batch1.id, studentId: student1.id, testName: 'Monthly Test — June', score: 82, maxScore: 100, testDate: new Date('2026-06-21'), remark: null },
    { batchId: batch2.id, studentId: student1.id, testName: 'Unit Test 1 — Physics', score: 91, maxScore: 100, testDate: new Date('2026-06-08'), remark: 'Top of batch' },
    { batchId: batch2.id, studentId: student1.id, testName: 'Unit Test 2 — Chemistry', score: 74, maxScore: 100, testDate: new Date('2026-06-18'), remark: 'Needs revision on organic chem' },
    { batchId: batch3.id, studentId: student2.id, testName: 'Unit Test 1 — Journal Entries', score: 88, maxScore: 100, testDate: new Date('2026-06-09'), remark: 'Very accurate' },
    { batchId: batch3.id, studentId: student2.id, testName: 'Unit Test 2 — Trial Balance', score: 93, maxScore: 100, testDate: new Date('2026-06-17'), remark: null },
    { batchId: batch1.id, studentId: student2.id, testName: 'Unit Test 1 — Algebra', score: 95, maxScore: 100, testDate: new Date('2026-06-07'), remark: 'Batch topper' },
    { batchId: batch1.id, studentId: student2.id, testName: 'Unit Test 2 — Geometry', score: 90, maxScore: 100, testDate: new Date('2026-06-14'), remark: null },
    { batchId: batch4.id, studentId: student3.id, testName: 'Mock Test 1 — Accounts', score: 62, maxScore: 100, testDate: new Date('2026-06-10'), remark: 'Focus on concept clarity' },
    { batchId: batch4.id, studentId: student3.id, testName: 'Mock Test 2 — Law', score: 71, maxScore: 100, testDate: new Date('2026-06-20'), remark: 'Improvement seen' },
  ];
  for (const s of scoreData) {
    await prisma.testScore.create({ data: s }).catch(() => {});
  }

  // ── DOUBT QUERIES ─────────────────────────────────────
  await prisma.doubtQuery.createMany({
    skipDuplicates: true,
    data: [
      { studentId: student1.id, batchId: batch1.id, questionText: 'How do we solve quadratic equations using the discriminant method? I get confused between the two roots.', status: 'ANSWERED', responseText: 'Great question Arjun! The discriminant b²-4ac tells you: if > 0 → two real roots, = 0 → one root, < 0 → no real roots. Let us go through examples in Thursday\'s class.', respondedById: faculty1.id, respondedAt: new Date('2026-06-19') },
      { studentId: student1.id, batchId: batch2.id, questionText: 'Why does ice float on water? Is it because of hydrogen bonding?', status: 'ANSWERED', responseText: 'Exactly right! Ice has a hexagonal crystal structure due to hydrogen bonds — this makes it LESS dense than liquid water, so it floats. Well observed!', respondedById: faculty2.id, respondedAt: new Date('2026-06-20') },
      { studentId: student2.id, batchId: batch3.id, questionText: 'I am confused about the difference between capital reserve and reserve capital. Can you explain?', status: 'OPEN' },
      { studentId: student3.id, batchId: batch4.id, questionText: 'For CA Foundation, how should I prioritise which subject to study first? I find Accounts and Law equally important.', status: 'OPEN' },
    ],
  });

  // ── INQUIRIES ─────────────────────────────────────────
  await prisma.inquiry.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Vijay Rathod', phone: '9823001122', email: 'vijay.r@gmail.com', message: 'My son is in Class 9, interested in Math and Science batches. Please let me know the fee structure and batch timings.', status: 'NEW', createdAt: new Date('2026-06-24') },
      { name: 'Kavita Jain', phone: '9712334455', email: null, message: 'Looking for Class 11 Commerce batches for my daughter. She needs Accountancy and Economics both.', status: 'CONTACTED', assigneeId: admin.id, createdAt: new Date('2026-06-20') },
      { name: 'Deepak Verma', phone: '9900887766', email: 'deepak.v@gmail.com', message: 'Interested in CA Foundation preparation. Is there weekend batch available?', status: 'NEW', createdAt: new Date('2026-06-25') },
      { name: 'Priya Nair', phone: '9823445566', email: null, message: 'Class 5 student, need all subjects. What is the batch strength?', status: 'ENROLLED', assigneeId: admin.id, createdAt: new Date('2026-06-01') },
      { name: 'Santosh Kumar', phone: '9867001234', email: 'santosh.k@gmail.com', message: 'Son preparing for Class 10 boards. Need Math + Science + English.', status: 'CLOSED', createdAt: new Date('2026-05-20') },
    ],
  });

  // ── SMS LOGS ──────────────────────────────────────────
  await prisma.smsLog.createMany({
    skipDuplicates: true,
    data: [
      { userId: student1.id, phone: '9900112233', templateId: 'TPL_ENROLL_CONFIRMED', triggerEvent: 'enrollment_confirmed', status: 'DELIVERED', providerId: 'MSG91_001', createdAt: new Date('2026-06-01') },
      { userId: parent1.id, phone: '9800112233', templateId: 'TPL_ENROLL_CONFIRMED', triggerEvent: 'enrollment_confirmed', status: 'DELIVERED', providerId: 'MSG91_002', createdAt: new Date('2026-06-01') },
      { userId: student2.id, phone: '9900223344', templateId: 'TPL_ENROLL_CONFIRMED', triggerEvent: 'enrollment_confirmed', status: 'DELIVERED', providerId: 'MSG91_003', createdAt: new Date('2026-06-10') },
      { userId: student3.id, phone: '9900334455', templateId: 'TPL_PAYMENT_FAILED', triggerEvent: 'payment_failed', status: 'SENT', providerId: 'MSG91_004', createdAt: new Date('2026-06-15') },
      { userId: student1.id, phone: '9900112233', templateId: 'TPL_DOUBT_ANSWERED', triggerEvent: 'doubt_answered', status: 'FAILED', failureReason: 'Transient provider error', retryCount: 3, createdAt: new Date('2026-06-19') },
    ],
  });

  // ── NOTIFICATIONS ─────────────────────────────────────
  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      { userId: student1.id, type: 'DOUBT_ANSWERED', title: 'Doubt Answered', message: 'Priya Kulkarni answered your doubt in Mathematics — How do we solve quadratic equations using the discriminant method?', link: '/dashboard/student', isRead: false, createdAt: new Date('2026-06-19') },
      { userId: student1.id, type: 'DOUBT_ANSWERED', title: 'Doubt Answered', message: 'Amit Desai answered your doubt in Science — Why does ice float on water?', link: '/dashboard/student', isRead: true, createdAt: new Date('2026-06-20') },
      { userId: student1.id, type: 'PAYMENT_CONFIRMED', title: 'Payment Confirmed', message: 'Payment of ₹4,500 for Mathematics confirmed.', link: '/dashboard/student', isRead: true, createdAt: new Date('2026-06-01') },
      { userId: student1.id, type: 'PAYMENT_CONFIRMED', title: 'Payment Confirmed', message: 'Payment of ₹4,200 for Science confirmed.', link: '/dashboard/student', isRead: true, createdAt: new Date('2026-06-01') },
      { userId: student1.id, type: 'ENROLLMENT_ACTIVE', title: 'Enrollment Active', message: 'Your enrollment in Mathematics is now active.', link: '/dashboard/student', isRead: false, createdAt: new Date('2026-06-01') },
      { userId: student2.id, type: 'DOUBT_SUBMITTED', title: 'Doubt Submitted', message: 'Sneha Mehta submitted a doubt in Accountancy — I am confused about the difference between capital reserve and reserve capital.', link: '/dashboard/faculty/doubts', isRead: false, createdAt: new Date('2026-06-22') },
      { userId: student2.id, type: 'PAYMENT_CONFIRMED', title: 'Payment Confirmed', message: 'Payment of ₹6,000 for Accountancy confirmed.', link: '/dashboard/student', isRead: true, createdAt: new Date('2026-06-10') },
      { userId: student3.id, type: 'PAYMENT_FAILED', title: 'Payment Failed', message: 'Payment of ₹8,000 for CA Foundation failed. Please try again.', link: '/dashboard/student', isRead: false, createdAt: new Date('2026-06-15') },
      { userId: parent1.id, type: 'LINK_APPROVED', title: 'Link Approved', message: 'Your link with Arjun Patil has been approved.', link: '/dashboard/parent', isRead: true, createdAt: new Date('2026-06-01') },
      { userId: parent2.id, type: 'LINK_APPROVED', title: 'Link Approved', message: 'Your link with Sneha Mehta has been approved.', link: '/dashboard/parent', isRead: true, createdAt: new Date('2026-06-01') },
      { userId: admin.id, type: 'INQUIRY_RECEIVED', title: 'New Inquiry', message: 'Vijay Rathod submitted an inquiry — My son is in Class 9, interested in Math and Science batches.', link: '/dashboard/admin/inquiries', isRead: false, createdAt: new Date('2026-06-24') },
      { userId: admin.id, type: 'INQUIRY_RECEIVED', title: 'New Inquiry', message: 'Deepak Verma submitted an inquiry — Interested in CA Foundation preparation.', link: '/dashboard/admin/inquiries', isRead: false, createdAt: new Date('2026-06-25') },
    ],
  });

  // ── SITE SETTINGS / SYSTEM CONFIG ─────────────────────
  const configs = [
    { key: 'admissions_label', value: 'Admissions Open — 2026-27' },
    { key: 'institution_phone', value: '+91 9175498572' },
    { key: 'institution_email', value: 'kaushikiclasses@klnbs.in' },
    { key: 'institution_address', value: 'Survey No. 36 S, Jambhulwadi Road, Shani Nagar, Ambegaon Khurd, Pune – 411046' },
    { key: 'institution_name', value: 'Kaushiki Classes' },
    { key: 'tagline', value: 'Learn. Grow. Excel.' },
    { key: 'admissions_cycle', value: '2026-27' },
    { key: 'fee_classes_1_5', value: '350000' },
    { key: 'fee_classes_6_10', value: '420000' },
    { key: 'fee_classes_11_12', value: '600000' },
    { key: 'fee_ca_foundation', value: '800000' },
    { key: 'default_batch_capacity', value: '15' },
  ];
  for (const c of configs) {
    await prisma.siteSetting.upsert({ where: { key: c.key }, update: { value: c.value }, create: c });
  }

  console.log('\n✅ Seed complete. Credentials: phone + password Kaushiki@123');
  console.log('  Admin:   9175498572');
  console.log('  Faculty: 9876543210 / 9823456701 / 9712345678');
  console.log('  Student: 9900112233 / 9900223344 / 9900334455');
  console.log('  Parent:  9800112233 / 9800223344');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
