import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../db/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const staffRouter = Router();

// Todas las rutas de personal exigen ser Gerente autenticado
staffRouter.use(requireAuth, requireRole(['MANAGER']));

function mapRowToStaff(row: any) {
  return {
    id: row.id,
    name: (row.name || '')
      .replace(/\s*\((?:Camarero|Camarera|Cocinero|Cocinera|Gerente|Chef|Waiter|Manager)\)/gi, '')
      .replace(/^Chef\s+/i, '')
      .trim(),
    username: row.username,
    email: row.email,
    role: row.role_id,
    active: Boolean(row.active),
    avatarUrl: row.avatar_url || undefined
  };
}

// 1. Listar equipo interno (NUNCA expone password_hash)
staffRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, username, email, role_id, avatar_url, active')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json((data || []).filter((u: any) => u.role_id !== 'CUSTOMER').map(mapRowToStaff));
  } catch (err: any) {
    console.error('Error en GET /api/staff:', err);
    res.status(500).json({ error: 'Error al obtener personal' });
  }
});

// 2. Crear empleado con contraseña cifrada
staffRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.body;
    const plainPass = user.password || 'camarero123';
    const hash = bcrypt.hashSync(plainPass, 10);

    const row = {
      id: user.id || `usr_staff_${Date.now()}`,
      name: user.name,
      username: user.username || user.email.split('@')[0],
      email: user.email,
      password_hash: hash,
      role_id: user.role,
      avatar_url: user.avatarUrl || null,
      active: user.active !== false
    };

    const { data, error } = await supabase
      .from('users')
      .insert(row)
      .select('id, name, username, email, role_id, avatar_url, active')
      .single();

    if (error) throw error;
    res.status(201).json(mapRowToStaff(data));
  } catch (err: any) {
    console.error('Error en POST /api/staff:', err);
    res.status(500).json({ error: 'Error al registrar empleado' });
  }
});

// 3. Modificar empleado
staffRouter.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.body;
    const updates: any = {
      name: user.name,
      email: user.email,
      role_id: user.role,
      active: user.active !== false,
      updated_at: new Date().toISOString()
    };

    if (user.avatarUrl) updates.avatar_url = user.avatarUrl;
    if (user.username) updates.username = user.username;
    if (user.password && user.password.trim().length > 0) {
      updates.password_hash = bcrypt.hashSync(user.password.trim(), 10);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, name, username, email, role_id, avatar_url, active')
      .single();

    if (error) throw error;
    res.json(mapRowToStaff(data));
  } catch (err: any) {
    console.error('Error en PUT /api/staff/:id:', err);
    res.status(500).json({ error: 'Error al actualizar empleado' });
  }
});

// 4. Eliminar empleado
staffRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error en DELETE /api/staff/:id:', err);
    res.status(500).json({ error: 'Error al eliminar empleado' });
  }
});
