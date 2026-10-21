import { User } from '../../../core/domain/entities/User.js';
import { UserRole } from '../../../core/domain/enums/UserRole.js';
import { IUserRepository } from '../../../core/ports/IUserRepository.js';
import { getSupabaseClient } from '../supabase/supabaseClient.js';

function mapRowToUser(row: any): User {
  return {
    id: row.id,
    name: (row.name || '')
      .replace(/\s*\((?:Camarero|Camarera|Cocinero|Cocinera|Gerente|Chef|Waiter|Manager)\)/gi, '')
      .replace(/^Chef\s+/i, '')
      .trim(),
    username: row.username,
    email: row.email,
    password: row.password_hash,
    role: row.role_id as UserRole,
    active: Boolean(row.active),
    avatarUrl: row.avatar_url || undefined
  };
}

function mapUserToRow(user: User): any {
  return {
    id: user.id,
    name: user.name,
    username: user.username || user.email.split('@')[0],
    email: user.email,
    password_hash: user.password || '$2a$10$defaultHashPlaceholderForMockOrNewUser',
    role_id: user.role,
    avatar_url: user.avatarUrl || null,
    active: user.active !== false
  };
}

export class SupabaseUserRepository implements IUserRepository {
  private client = getSupabaseClient();

  async getAll(): Promise<User[]> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching users from Supabase:', error);
      throw new Error(`Error en Supabase al obtener usuarios: ${error.message}`);
    }

    return (data || [])
      .filter((u: any) => u.role_id !== 'CUSTOMER')
      .map(mapRowToUser);
  }

  async getById(id: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error(`Error fetching user ${id} from Supabase:`, error);
      throw new Error(`Error en Supabase al buscar usuario ${id}: ${error.message}`);
    }

    return data ? mapRowToUser(data) : null;
  }

  async getByRole(role: UserRole): Promise<User[]> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('role_id', role)
      .order('name', { ascending: true });

    if (error) {
      console.error(`Error fetching users with role ${role} from Supabase:`, error);
      throw new Error(`Error en Supabase al filtrar usuarios por rol: ${error.message}`);
    }

    return (data || []).map(mapRowToUser);
  }

  async create(user: User): Promise<User> {
    const row = mapUserToRow(user);
    const { data, error } = await this.client
      .from('users')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('Error creating user in Supabase:', error);
      throw new Error(`Error al crear empleado en Supabase: ${error.message}`);
    }

    return mapRowToUser(data);
  }

  async update(user: User): Promise<User> {
    const row = mapUserToRow(user);
    const { data, error } = await this.client
      .from('users')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating user ${user.id} in Supabase:`, error);
      throw new Error(`Error al actualizar empleado en Supabase: ${error.message}`);
    }

    return mapRowToUser(data);
  }

  async delete(id: string): Promise<boolean> {
    const { error, count } = await this.client
      .from('users')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) {
      console.error(`Error deleting user ${id} from Supabase:`, error);
      throw new Error(`Error al eliminar empleado en Supabase: ${error.message}`);
    }

    return (count ?? 0) > 0;
  }
}
