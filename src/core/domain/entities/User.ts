import { UserRole } from '../enums/UserRole.js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}
