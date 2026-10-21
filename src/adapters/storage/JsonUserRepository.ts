import { User } from '../../core/domain/entities/User.js';
import { UserRole } from '../../core/domain/enums/UserRole.js';
import { IUserRepository } from '../../core/ports/IUserRepository.js';
import initialUsers from '../../../mock_data/users.json' with { type: 'json' };

export class JsonUserRepository implements IUserRepository {
  private users: User[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('DND_USERS');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Requirement 4: Purge any legacy CUSTOMER user to strictly protect guest privacy
          // Also strip any legacy role parentheses from employee names
          this.users = parsed
            .filter((u: User) => u.role !== UserRole.CUSTOMER)
            .map((u: User) => ({
              ...u,
              name: (u.name || '')
                .replace(/\s*\((?:Camarero|Camarera|Cocinero|Cocinera|Gerente|Chef|Waiter|Manager)\)/gi, '')
                .replace(/^Chef\s+/i, '')
                .trim()
            }));
          // If all users got purged or missing credentials, reseed with initialUsers
          if (this.users.length === 0 || !this.users[0].password) {
            this.users = JSON.parse(JSON.stringify(initialUsers));
          }
          this.save();
          return;
        } catch (e) {
          console.warn('Error reading users from localStorage, falling back to seed.');
        }
      }
    }
    this.users = JSON.parse(JSON.stringify(initialUsers));
    this.save();
  }

  private save() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('DND_USERS', JSON.stringify(this.users));
    }
  }

  async getAll(): Promise<User[]> {
    return JSON.parse(JSON.stringify(this.users));
  }

  async getById(id: string): Promise<User | null> {
    const user = this.users.find(u => u.id === id);
    return user ? JSON.parse(JSON.stringify(user)) : null;
  }

  async getByRole(role: UserRole): Promise<User[]> {
    const filtered = this.users.filter(u => u.role === role);
    return JSON.parse(JSON.stringify(filtered));
  }

  async create(user: User): Promise<User> {
    this.users.push(user);
    this.save();
    return JSON.parse(JSON.stringify(user));
  }

  async update(user: User): Promise<User> {
    const idx = this.users.findIndex(u => u.id === user.id);
    if (idx < 0) {
      throw new Error(`Usuario ${user.id} no encontrado.`);
    }
    this.users[idx] = user;
    this.save();
    return JSON.parse(JSON.stringify(user));
  }

  async delete(id: string): Promise<boolean> {
    const initialLen = this.users.length;
    this.users = this.users.filter(u => u.id !== id);
    if (this.users.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}
