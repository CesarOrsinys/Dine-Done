import { UserRole } from '../enums/UserRole.js';

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  password?: string;
  role: UserRole;
  active: boolean;
  avatarUrl?: string;
}
