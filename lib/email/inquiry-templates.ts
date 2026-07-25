const INSTITUTION_PHONE = '9175498572';
const INSTITUTION_NAME = 'Kaushiki Classes';

export function inquiryConfirmationHtml(name: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${INSTITUTION_NAME} – Inquiry Received</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:#2563EB;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">${INSTITUTION_NAME}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px 24px;">
              <h2 style="margin:0 0 12px;color:#1f2937;font-size:22px;font-weight:600;">Thank You, ${name}!</h2>
              <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6;">
                We have received your inquiry and our team will get back to you within <strong style="color:#1f2937;">24 hours</strong>.
              </p>
              <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6;">
                For any urgent queries, feel free to call us at
                <a href="tel:+${INSTITUTION_PHONE}" style="color:#2563EB;text-decoration:none;font-weight:600;">+${INSTITUTION_PHONE}</a>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td style="background:#f0f4ff;border-radius:10px;padding:20px;">
                    <p style="margin:0 0 8px;color:#1f2937;font-size:14px;font-weight:600;">What happens next?</p>
                    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                      1. Our admissions counselor will contact you shortly<br/>
                      2. We'll answer all your questions about courses and batches<br/>
                      3. We'll help you find the right program for your needs
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} ${INSTITUTION_NAME}. All rights reserved.</p>
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">This is an automated confirmation. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function inquiryConfirmationText(name: string): string {
  return `Kaushiki Classes – Inquiry Received\n\nDear ${name},\n\nThank you for your inquiry! We have received your message and our team will get back to you within 24 hours.\n\nFor urgent queries, call us at +${INSTITUTION_PHONE}.\n\nWhat happens next?\n1. Our admissions counselor will contact you shortly\n2. We'll answer all your questions about courses and batches\n3. We'll help you find the right program for your needs\n\n© ${new Date().getFullYear()} Kaushiki Classes`;
}

export function adminAlertHtml(data: {
  name: string;
  phone: string;
  email?: string;
  message: string;
  trackName?: string;
}): string {
  const trackRow = data.trackName
    ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:120px;">Program Interest:</td><td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:500;">${data.trackName}</td></tr>`
    : '';

  const emailRow = data.email
    ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:120px;">Email:</td><td style="padding:8px 0;color:#1f2937;font-size:14px;"><a href="mailto:${data.email}" style="color:#2563EB;text-decoration:none;">${data.email}</a></td></tr>`
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${INSTITUTION_NAME} – New Inquiry Alert</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:#F59E0B;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">New Inquiry Received</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px 24px;">
              <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6;">
                A new inquiry has been submitted on the website. Here are the details:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#f9fafb;border-radius:10px;padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:120px;">Name:</td><td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;">${data.name}</td></tr>
                      <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Phone:</td><td style="padding:8px 0;color:#1f2937;font-size:14px;"><a href="tel:+91${data.phone}" style="color:#2563EB;text-decoration:none;">+91 ${data.phone}</a></td></tr>
                      ${emailRow}
                      ${trackRow}
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#f0f4ff;border-left:4px solid #2563EB;border-radius:0 10px 10px 0;padding:16px 20px;">
                    <p style="margin:0 0 4px;color:#1f2937;font-size:13px;font-weight:600;">Message:</p>
                    <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">${data.message}</p>
                  </td>
                </tr>
              </table>
              <a href="tel:+91${data.phone}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">Call ${data.name}</a>
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

export function adminAlertText(data: {
  name: string;
  phone: string;
  email?: string;
  message: string;
  trackName?: string;
}): string {
  const lines = [
    `Kaushiki Classes – New Inquiry Received`,
    ``,
    `Name: ${data.name}`,
    `Phone: +91 ${data.phone}`,
  ];
  if (data.email) lines.push(`Email: ${data.email}`);
  if (data.trackName) lines.push(`Program Interest: ${data.trackName}`);
  lines.push(``, `Message: ${data.message}`, ``, `© ${new Date().getFullYear()} Kaushiki Classes`);
  return lines.join('\n');
}
