export type FieldErrors = Record<string, string[]>;

export class ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[] | FieldErrors;
  timestamp: string;

  static ok<T>(data: T, message?: string): ApiResponse<T> {
    return { success: true, data, message, timestamp: new Date().toISOString() };
  }

  static error<T>(message: string, errors?: string[] | FieldErrors): ApiResponse<T> {
    return { success: false, message, errors, timestamp: new Date().toISOString() };
  }
}
