import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase.js';
import { config } from '../config.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      return;
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanPass = String(password).trim();

    // 1. Consultar usuario interno (solo por el backend intermediario)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, username, email, password_hash, role_id, avatar_url, active')
      .or(`email.ilike.${cleanId},username.ilike.${cleanId}`)
      .limit(1);

    if (error || !users || users.length === 0) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const user = users[0];
    if (user.active === false || user.role_id === 'CUSTOMER') {
      res.status(403).json({ error: 'Cuenta inactiva o no autorizada' });
      return;
    }

    // 2. Comprobar contraseña de forma segura (bcrypt o texto directo de migración)
    let passwordMatches = false;
    if (user.password_hash.startsWith('$2')) {
      passwordMatches = bcrypt.compareSync(cleanPass, user.password_hash);
    } else {
      passwordMatches = user.password_hash === cleanPass;
    }

    if (!passwordMatches) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    // 3. Generar token de sesión JWT
    const payload = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role_id,
      avatarUrl: user.avatar_url
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });

    res.json({
      token,
      user: payload
    });
  } catch (err: any) {
    console.error('Error en /api/auth/login:', err);
    res.status(500).json({ error: 'Error interno en el servidor de autenticación' });
  }
});

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});
