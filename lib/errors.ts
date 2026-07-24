export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'INVALID_JSON'
  | 'RATE_LIMIT_EXCEEDED'
  | 'OTP_EXPIRED'
  | 'OTP_EXHAUSTED'
  | 'INVALID_OTP'
  | 'USER_NOT_FOUND'
  | 'ACCOUNT_SUSPENDED'
  | 'PHONE_EXISTS'
  | 'EMAIL_EXISTS'
  | 'INVALID_REFRESH_TOKEN'
  | 'REFRESH_TOKEN_REVOKED'
  | 'REFRESH_TOKEN_MISMATCH'
  | 'BATCH_CAPACITY_EXCEEDED'
  | 'NOT_FOUND';

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number = 400,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}
