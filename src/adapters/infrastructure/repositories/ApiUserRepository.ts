import { User } from '../../../core/domain/entities/User.js';
import { UserRole } from '../../../core/domain/enums/UserRole.js';
import { IUserRepository } from '../../../core/ports/IUserRepository.js';
import { HttpApiClient } from '../api/HttpApiClient.js';

export class ApiUserRepository implements IUserRepository {
  async getAll(): Promise<User[]> {
    return await HttpApiClient.request<User[]>('/api/staff');
  }

  async getById(id: string): Promise<User | null> {
    const all = await this.getAll();
    return all.find(u => u.id === id) || null;
  }

  async getByRole(role: UserRole): Promise<User[]> {
    const all = await this.getAll();
    return all.filter(u => u.role === role);
  }

  async create(user: User): Promise<User> {
    return await HttpApiClient.request<User>('/api/staff', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  }

  async update(user: User): Promise<User> {
    return await HttpApiClient.request<User>(`/api/staff/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify(user)
    });
  }

  async delete(id: string): Promise<boolean> {
    await HttpApiClient.request(`/api/staff/${id}`, {
      method: 'DELETE'
    });
    return true;
  }

  async authenticate(identifier: string, password: string): Promise<User | null> {
    try {
      const res = await HttpApiClient.request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      });

      if (res && res.token && res.user) {
        HttpApiClient.setToken(res.token);
        return res.user;
      }
      return null;
    } catch (err) {
      console.warn('Fallo en autenticación:', err);
      return null;
    }
  }
}
