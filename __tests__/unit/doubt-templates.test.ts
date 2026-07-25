import { doubtAnsweredStudentTemplate } from '@/lib/email/doubt-templates';

describe('doubt-templates', () => {
  const base = {
    studentName: 'Rahul Patil',
    subject: 'Mathematics',
    questionText: 'What is the derivative of x squared?',
    responseText: 'The derivative of x² is 2x, using the power rule.',
    facultyName: 'Prof. Sharma',
  };

  it('produces HTML containing student name and faculty name', () => {
    const { html } = doubtAnsweredStudentTemplate(base);
    expect(html).toContain('Rahul Patil');
    expect(html).toContain('Prof. Sharma');
  });

  it('produces HTML containing subject name', () => {
    const { html } = doubtAnsweredStudentTemplate(base);
    expect(html).toContain('Mathematics');
  });

  it('escapes HTML in question and response', () => {
    const data = { ...base, questionText: '<script>alert(1)</script>', responseText: '<img onerror=alert(1)>' };
    const { html } = doubtAnsweredStudentTemplate(data);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;img');
  });

  it('produces plain text version', () => {
    const { text } = doubtAnsweredStudentTemplate(base);
    expect(text).toContain('Rahul Patil');
    expect(text).toContain('Prof. Sharma');
    expect(text).toContain('Mathematics');
    expect(text).toContain('power rule');
  });
});
