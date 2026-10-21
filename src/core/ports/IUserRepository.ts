import { User } from '../domain/entities/User.js';
import { UserRole } from '../domain/enums/UserRole.js';

export interface IUserRepository {
  getAll(): Promise<User[]>;
  getById(id: string): Promise<User | null>;
  getByRole(role: UserRole): Promise<User[]>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<boolean>;
}
