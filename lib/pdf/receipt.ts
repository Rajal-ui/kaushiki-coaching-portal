import PDFDocument from 'pdfkit';

const INSTITUTION_NAME = 'Kaushiki Classes';
const INSTITUTION_ADDRESS = 'Kaushiki Classes, India';
const INSTITUTION_PHONE = '+91 9175498572';
const INSTITUTION_EMAIL = 'kaushikiclasses@klnbs.in';
const INSTITUTION_GSTIN = '22AAAAA0000A1Z5';

export interface ReceiptData {
  paymentId: string;
  receiptNumber: string;
  date: Date;
  studentName: string;
  studentPhone: string;
  studentEmail?: string;
  batchName: string;
  subjectName: string;
  schedule: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  gatewayOrderId: string;
}

function formatCurrency(amountInPaise: number, currency: string = 'INR'): string {
  const amount = amountInPaise / 100;
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${currency} ${amount.toFixed(2)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
      info: {
        Title: `Payment Receipt – ${data.receiptNumber}`,
        Author: INSTITUTION_NAME,
        Subject: 'Fee Payment Receipt',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Header ──────────────────────────────────────────────────────────
    doc
      .rect(0, 0, doc.page.width, 120)
      .fill('#2563EB');

    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#ffffff')
      .text(INSTITUTION_NAME, 50, 35, { align: 'center' })
      .font('Helvetica')
      .fontSize(10)
      .text(INSTITUTION_ADDRESS, 50, 62, { align: 'center' })
      .text(`Phone: ${INSTITUTION_PHONE}  |  Email: ${INSTITUTION_EMAIL}`, 50, 76, { align: 'center' })
      .text(`GSTIN: ${INSTITUTION_GSTIN}`, 50, 90, { align: 'center' });

    // ── Receipt Title ───────────────────────────────────────────────────
    doc
      .fillColor('#1f2937')
      .font('Helvetica-Bold')
      .fontSize(16)
      .text('FEE PAYMENT RECEIPT', 50, 140, { align: 'center' });

    // ── Receipt Info Box ────────────────────────────────────────────────
    const infoY = 170;
    doc
      .rect(50, infoY, doc.page.width - 100, 70)
      .fill('#f9fafb')
      .stroke('#e5e7eb');

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#6b7280')
      .text('Receipt No:', 65, infoY + 12)
      .text('Date:', 65, infoY + 30)
      .text('Payment ID:', 65, infoY + 48);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#1f2937')
      .text(data.receiptNumber, 160, infoY + 12)
      .text(formatDate(data.date), 160, infoY + 30)
      .text(data.paymentId, 160, infoY + 48);

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#6b7280')
      .text('Order ID:', 350, infoY + 12)
      .text('Status:', 350, infoY + 30);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#1f2937')
      .text(data.gatewayOrderId, 420, infoY + 12)
      .font('Helvetica-Bold')
      .fillColor('#16a34a')
      .text('PAID', 420, infoY + 30);

    // ── Student Details ─────────────────────────────────────────────────
    const studentY = 260;
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#2563EB')
      .text('STUDENT DETAILS', 50, studentY);

    doc
      .moveTo(50, studentY + 18)
      .lineTo(doc.page.width - 50, studentY + 18)
      .strokeColor('#e5e7eb')
      .stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#6b7280')
      .text('Name:', 65, studentY + 28)
      .text('Phone:', 65, studentY + 46);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#1f2937')
      .text(data.studentName, 160, studentY + 28)
      .text(data.studentPhone, 160, studentY + 46);

    if (data.studentEmail) {
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#6b7280')
        .text('Email:', 350, studentY + 28);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#1f2937')
        .text(data.studentEmail, 420, studentY + 28);
    }

    // ── Course Details ──────────────────────────────────────────────────
    const courseY = 340;
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#2563EB')
      .text('COURSE DETAILS', 50, courseY);

    doc
      .moveTo(50, courseY + 18)
      .lineTo(doc.page.width - 50, courseY + 18)
      .strokeColor('#e5e7eb')
      .stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#6b7280')
      .text('Program:', 65, courseY + 28)
      .text('Subject:', 65, courseY + 46)
      .text('Schedule:', 65, courseY + 64);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#1f2937')
      .text(data.batchName, 160, courseY + 28)
      .text(data.subjectName, 160, courseY + 46)
      .text(data.schedule, 160, courseY + 64);

    // ── Payment Summary ─────────────────────────────────────────────────
    const summaryY = 435;
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#2563EB')
      .text('PAYMENT SUMMARY', 50, summaryY);

    doc
      .moveTo(50, summaryY + 18)
      .lineTo(doc.page.width - 50, summaryY + 18)
      .strokeColor('#e5e7eb')
      .stroke();

    // Table header
    doc
      .rect(50, summaryY + 24, doc.page.width - 100, 22)
      .fill('#f0f4ff');

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#1f2937')
      .text('Description', 65, summaryY + 30)
      .text('Amount', 400, summaryY + 30, { width: 100, align: 'right' });

    // Table row
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#1f2937')
      .text(`Fee Payment – ${data.subjectName}`, 65, summaryY + 54)
      .text(formatCurrency(data.amount, data.currency), 400, summaryY + 54, { width: 100, align: 'right' });

    // Total row
    doc
      .moveTo(50, summaryY + 76)
      .lineTo(doc.page.width - 50, summaryY + 76)
      .strokeColor('#d1d5db')
      .stroke();

    doc
      .rect(50, summaryY + 78, doc.page.width - 100, 26)
      .fill('#2563EB');

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#ffffff')
      .text('Total Paid', 65, summaryY + 84)
      .text(formatCurrency(data.amount, data.currency), 400, summaryY + 84, { width: 100, align: 'right' });

    // ── Footer ──────────────────────────────────────────────────────────
    const footerY = doc.page.height - 100;
    doc
      .moveTo(50, footerY)
      .lineTo(doc.page.width - 50, footerY)
      .strokeColor('#e5e7eb')
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#9ca3af')
      .text(
        'This is a computer-generated receipt and does not require a physical signature.',
        50,
        footerY + 10,
        { align: 'center' }
      )
      .text(
        `For queries, contact ${INSTITUTION_EMAIL} or call ${INSTITUTION_PHONE}`,
        50,
        footerY + 24,
        { align: 'center' }
      )
      .text(
        `© ${new Date().getFullYear()} ${INSTITUTION_NAME}. All rights reserved.`,
        50,
        footerY + 38,
        { align: 'center' }
      );

    doc.end();
  });
}
