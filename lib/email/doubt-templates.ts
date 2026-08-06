interface DoubtAnsweredEmailData {
  studentName: string;
  subject: string;
  questionText: string;
  responseText: string;
  facultyName: string;
}

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function doubtAnsweredStudentTemplate(data: DoubtAnsweredEmailData) {
  const { studentName, subject, questionText, responseText, facultyName } = data;
  const safeName = escapeHtml(studentName);
  const safeSubject = escapeHtml(subject);
  const safeQuestion = escapeHtml(questionText);
  const safeResponse = escapeHtml(responseText);
  const safeFaculty = escapeHtml(facultyName);

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;">
    <h1 style="color:#fff;font-size:22px;margin:0;">Kaushiki Classes</h1>
    <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:4px 0 0;">Your doubt has been answered</p>
  </div>
  <div style="padding:28px 32px;">
    <p style="font-size:15px;color:#374151;margin:0 0 16px;">Hi <strong>${safeName}</strong>,</p>
    <p style="font-size:14px;color:#6b7280;margin:0 0 20px;">Your doubt in <strong>${safeSubject}</strong> has been answered by <strong>${safeFaculty}</strong>.</p>
    <div style="background:#f0f4ff;border-left:4px solid #6366f1;padding:14px 18px;border-radius:0 8px 8px 0;margin:0 0 16px;">
      <p style="font-size:12px;color:#6366f1;font-weight:600;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.5px;">Your Question</p>
      <p style="font-size:14px;color:#374151;margin:0;white-space:pre-wrap;">${safeQuestion}</p>
    </div>
    <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:14px 18px;border-radius:0 8px 8px 0;margin:0 0 20px;">
      <p style="font-size:12px;color:#22c55e;font-weight:600;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.5px;">Faculty Response</p>
      <p style="font-size:14px;color:#374151;margin:0;white-space:pre-wrap;">${safeResponse}</p>
    </div>
    <p style="font-size:14px;color:#6b7280;margin:0 0 8px;">You can view the full discussion in your student dashboard.</p>
  </div>
  <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
    <p style="font-size:11px;color:#9ca3af;margin:0;text-align:center;">Kaushiki Classes &bull; Near Khandoba Temple, Dahigaon Phata, Moshi 412105 &bull; +919175498572</p>
  </div>
</div>
</body>
</html>`;

  const text = `Hi ${studentName},

Your doubt in ${subject} has been answered by ${facultyName}.

Your Question:
${questionText}

Faculty Response:
${responseText}

View the full discussion in your student dashboard.

---
Kaushiki Classes | Near Khandoba Temple, Dahigaon Phata, Moshi 412105 | +919175498572`;

  return { html, text };
}
