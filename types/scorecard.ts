export interface TestResultPayload {
  studentId: string;
  testTitle: string;
  totalMarks: number;
  score: number;
  remarks?: string | null;
  gradedAt?: Date;
}

export type ScorecardRelation = 'STUDENT' | 'PARENT';

export interface ScorecardRecipient {
  name: string;
  email: string;
  relation: ScorecardRelation;
}

export interface ScorecardDispatchResult {
  success: boolean;
  total: number;
  sent: number;
  failed: number;
  recipients: string[];
  errors: string[];
}
