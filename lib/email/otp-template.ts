export function otpEmailHtml(otp: string, purpose: 'login' | 'signup' = 'login'): string {
  const heading = purpose === 'signup' ? 'Verify your email' : 'Your login code';
  const body = purpose === 'signup'
    ? 'Use the code below to complete your registration.'
    : 'Use the code below to sign in to your account.';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kaushiki Classes – OTP Verification</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:#2563EB;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">Kaushiki Classes</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px 24px;">
              <h2 style="margin:0 0 12px;color:#1f2937;font-size:22px;font-weight:600;">${heading}</h2>
              <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">${body}</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 28px;">
                    <div style="background:#f0f4ff;border:2px dashed #2563EB;border-radius:10px;padding:18px 0;display:inline-block;min-width:220px;">
                      <span style="font-size:32px;font-weight:700;letter-spacing:10px;color:#1e3a5f;font-family:'Courier New',monospace;">${otp}</span>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;text-align:center;">This code expires in <strong style="color:#6b7280;">5 minutes</strong>.</p>
              <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">If you did not request this, please ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} Kaushiki Classes. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function otpEmailText(otp: string, purpose: 'login' | 'signup' = 'login'): string {
  const heading = purpose === 'signup' ? 'Verify your email' : 'Your login code';
  return `Kaushiki Classes – ${heading}\n\nYour OTP is: ${otp}\n\nThis code expires in 5 minutes.\nIf you did not request this, ignore this email.`;
}
