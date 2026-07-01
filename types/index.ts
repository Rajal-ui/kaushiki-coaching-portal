// Core shared interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'PARENT' | 'FACULTY' | 'ADMIN';
}
