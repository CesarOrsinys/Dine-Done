import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const menuRouter = Router();

function mapRowToMenuItem(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price),
    category: row.category_id,
    requiresCooking: Boolean(row.requires_cooking),
    stock: Number(row.stock),
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    allergens: Array.isArray(row.allergens) ? row.allergens : [],
    isVegan: Boolean(row.is_vegan),
    isVegetarian: Boolean(row.is_vegetarian),
    isAlcoholFree: Boolean(row.is_alcohol_free),
    imageUrl: row.image_url || undefined,
    images: row.images && typeof row.images === 'object' && Object.keys(row.images).length > 0 ? row.images : undefined,
    translations: row.translations || {}
  };
}

// 1. Obtener carta pública del menú (sin exponer base de datos)
menuRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('active', true)
      .order('id', { ascending: true });

    if (error) throw error;
    res.json((data || []).map(mapRowToMenuItem));
  } catch (err: any) {
    console.error('Error en GET /api/menu:', err);
    res.status(500).json({ error: 'Error al obtener la carta del menú' });
  }
});

// 2. Crear plato (Solo Gerente)
menuRouter.post('/', requireAuth, requireRole(['MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const item = req.body;
    const row = {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category_id: item.category,
      requires_cooking: item.requiresCooking,
      stock: item.stock,
      ingredients: item.ingredients || [],
      allergens: item.allergens || [],
      is_vegan: Boolean(item.isVegan),
      is_vegetarian: Boolean(item.isVegetarian),
      is_alcohol_free: Boolean(item.isAlcoholFree),
      image_url: item.imageUrl || null,
      images: item.images || {},
      translations: item.translations || {},
      active: true
    };

    const { data, error } = await supabase
      .from('menu_items')
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(mapRowToMenuItem(data));
  } catch (err: any) {
    console.error('Error en POST /api/menu:', err);
    res.status(500).json({ error: 'Error al crear plato en la carta' });
  }
});

// 3. Modificar plato (Solo Gerente)
menuRouter.put('/:id', requireAuth, requireRole(['MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = req.body;
    const row = {
      name: item.name,
      description: item.description,
      price: item.price,
      category_id: item.category,
      requires_cooking: item.requiresCooking,
      stock: item.stock,
      ingredients: item.ingredients || [],
      allergens: item.allergens || [],
      is_vegan: Boolean(item.isVegan),
      is_vegetarian: Boolean(item.isVegetarian),
      is_alcohol_free: Boolean(item.isAlcoholFree),
      image_url: item.imageUrl || null,
      images: item.images || {},
      translations: item.translations || {},
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('menu_items')
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(mapRowToMenuItem(data));
  } catch (err: any) {
    console.error('Error en PUT /api/menu/:id:', err);
    res.status(500).json({ error: 'Error al actualizar plato' });
  }
});

// 4. Actualizar stock (Solo Gerente)
menuRouter.patch('/:id/stock', requireAuth, requireRole(['MANAGER']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    if (typeof stock !== 'number' || stock < 0) {
      res.status(400).json({ error: 'El stock debe ser un número mayor o igual a 0' });
      return;
    }

    const { data, error } = await supabase
      .from('menu_items')
      .update({ stock, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(mapRowToMenuItem(data));
  } catch (err: any) {
    console.error('Error en PATCH /api/menu/:id/stock:', err);
    res.status(500).json({ error: 'Error al actualizar stock' });
  }
});
