const INSTITUTION_NAME = 'Kaushiki Classes';
const INSTITUTION_PHONE = '+91 9175498572';

function formatCurrency(amountInPaise: number): string {
  const amount = amountInPaise / 100;
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export interface PaymentReceiptEmailData {
  studentName: string;
  batchName: string;
  subjectName: string;
  schedule: string;
  amount: number;
  receiptNumber: string;
  paymentId: string;
  date: Date;
}

export function paymentSuccessHtml(data: PaymentReceiptEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${INSTITUTION_NAME} – Payment Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:#16a34a;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">Payment Confirmed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px 24px;">
              <h2 style="margin:0 0 12px;color:#1f2937;font-size:22px;font-weight:600;">Thank You, ${data.studentName}!</h2>
              <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6;">
                Your payment of <strong style="color:#16a34a;">${formatCurrency(data.amount)}</strong> has been successfully received.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#f0fdf4;border-radius:10px;padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;width:130px;">Receipt No:</td>
                        <td style="padding:6px 0;color:#1f2937;font-size:13px;font-weight:600;">${data.receiptNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;">Date:</td>
                        <td style="padding:6px 0;color:#1f2937;font-size:13px;">${formatDate(data.date)}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;">Program:</td>
                        <td style="padding:6px 0;color:#1f2937;font-size:13px;">${data.batchName}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;">Subject:</td>
                        <td style="padding:6px 0;color:#1f2937;font-size:13px;">${data.subjectName}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;">Schedule:</td>
                        <td style="padding:6px 0;color:#1f2937;font-size:13px;">${data.schedule}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;">Amount Paid:</td>
                        <td style="padding:6px 0;color:#16a34a;font-size:15px;font-weight:700;">${formatCurrency(data.amount)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.6;">
                Your enrollment is now <strong style="color:#16a34a;">active</strong>. You can access your batch and study materials from the student dashboard.
              </p>

              <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">
                Please find the detailed payment receipt attached to this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;text-align:center;">For queries, call us at ${INSTITUTION_PHONE}</p>
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} ${INSTITUTION_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function paymentSuccessText(data: PaymentReceiptEmailData): string {
  return [
    `${INSTITUTION_NAME} – Payment Confirmation`,
    ``,
    `Dear ${data.studentName},`,
    ``,
    `Your payment of ${formatCurrency(data.amount)} has been successfully received.`,
    ``,
    `Receipt No: ${data.receiptNumber}`,
    `Date: ${formatDate(data.date)}`,
    `Program: ${data.batchName}`,
    `Subject: ${data.subjectName}`,
    `Schedule: ${data.schedule}`,
    `Amount Paid: ${formatCurrency(data.amount)}`,
    ``,
    `Your enrollment is now active. You can access your batch from the student dashboard.`,
    ``,
    `Please find the detailed payment receipt attached to this email.`,
    ``,
    `© ${new Date().getFullYear()} ${INSTITUTION_NAME}`,
  ].join('\n');
}

export function paymentFailedHtml(data: { studentName: string; batchName: string; amount: number }): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${INSTITUTION_NAME} – Payment Failed</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:#dc2626;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">Payment Failed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px 24px;">
              <h2 style="margin:0 0 12px;color:#1f2937;font-size:22px;font-weight:600;">Payment Unsuccessful</h2>
              <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6;">
                Dear ${data.studentName}, your payment of <strong style="color:#dc2626;">${formatCurrency(data.amount)}</strong> for <strong>${data.batchName}</strong> could not be processed.
              </p>
              <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6;">
                Please try again or contact our support team for assistance.
              </p>
              <a href="tel:${INSTITUTION_PHONE.replace(/\s/g, '')}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Contact Support</a>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} ${INSTITUTION_NAME}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function paymentFailedText(data: { studentName: string; batchName: string; amount: number }): string {
  return [
    `${INSTITUTION_NAME} – Payment Failed`,
    ``,
    `Dear ${data.studentName},`,
    ``,
    `Your payment of ${formatCurrency(data.amount)} for ${data.batchName} could not be processed.`,
    `Please try again or contact our support team at ${INSTITUTION_PHONE}.`,
    ``,
    `© ${new Date().getFullYear()} ${INSTITUTION_NAME}`,
  ].join('\n');
}
