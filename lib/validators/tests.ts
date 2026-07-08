import { z } from 'zod';

export const createTestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  timeLimit: z.number().int().positive('Time limit must be a positive integer'),
  totalMarks: z.number().int().positive('Total marks must be a positive integer'),
  batchId: z.string().min(1, 'Batch ID is required'),
});

export const updateTestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  timeLimit: z.number().int().positive().optional(),
  totalMarks: z.number().int().positive().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const questionSchema = z.object({
  type: z.enum(['MCQ', 'SUBJECTIVE']),
  questionText: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).optional().nullable(),
  correctOption: z.string().optional().nullable(),
  marks: z.number().int().positive('Marks must be a positive integer'),
  displayOrder: z.number().int().min(1),
});

export const questionsBulkSchema = z.object({
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
});

export const answerEntrySchema = z.object({
  questionId: z.string(),
  selectedOption: z.string().optional().nullable(),
  subjectiveAnswer: z.string().optional().nullable(),
});

export const attemptAnswerSchema = z.object({
  action: z.enum(['save_answers', 'submit']),
  answers: z.array(answerEntrySchema),
});

export const manualGradeEntrySchema = z.object({
  questionId: z.string(),
  marksObtained: z.number().int().min(0, 'Marks cannot be negative'),
  feedback: z.string().optional().nullable(),
});

export const manualGradeSchema = z.object({
  grades: z.array(manualGradeEntrySchema).min(1, 'At least one grade entry is required'),
  globalFeedback: z.string().optional().nullable(),
});

export type CreateTestInput = z.infer<typeof createTestSchema>;
export type UpdateTestInput = z.infer<typeof updateTestSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type QuestionsBulkInput = z.infer<typeof questionsBulkSchema>;
export type AttemptAnswerInput = z.infer<typeof attemptAnswerSchema>;
export type ManualGradeInput = z.infer<typeof manualGradeSchema>;
