import { MenuItem } from '../../../core/domain/entities/MenuItem.js';
import { MenuCategory } from '../../../core/domain/enums/MenuCategory.js';
import { IMenuRepository } from '../../../core/ports/IMenuRepository.js';
import { getSupabaseClient } from '../supabase/supabaseClient.js';

function mapRowToMenuItem(row: any): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price),
    category: row.category_id as MenuCategory,
    requiresCooking: Boolean(row.requires_cooking),
    stock: Number(row.stock),
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    allergens: Array.isArray(row.allergens) ? row.allergens : [],
    isVegan: Boolean(row.is_vegan),
    isVegetarian: Boolean(row.is_vegetarian),
    isAlcoholFree: Boolean(row.is_alcohol_free),
    imageUrl: row.image_url || undefined,
    images: row.images && typeof row.images === 'object' && Object.keys(row.images).length > 0 ? row.images : undefined,
    translations: row.translations && typeof row.translations === 'object' ? row.translations : {}
  };
}

function mapMenuItemToRow(item: MenuItem): any {
  return {
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
}

export class SupabaseMenuRepository implements IMenuRepository {
  private client = getSupabaseClient();

  async getAll(): Promise<MenuItem[]> {
    const { data, error } = await this.client
      .from('menu_items')
      .select('*')
      .eq('active', true)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching menu items from Supabase:', error);
      throw new Error(`Error en Supabase al obtener la carta: ${error.message}`);
    }

    return (data || []).map(mapRowToMenuItem);
  }

  async getById(id: string): Promise<MenuItem | null> {
    const { data, error } = await this.client
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Row not found
      console.error(`Error fetching menu item ${id} from Supabase:`, error);
      throw new Error(`Error en Supabase al buscar producto ${id}: ${error.message}`);
    }

    return data ? mapRowToMenuItem(data) : null;
  }

  async deductStock(requestedItems: { menuItemId: string; quantity: number }[]): Promise<void> {
    // 1. Fetch current stock for all requested items
    const ids = requestedItems.map(r => r.menuItemId);
    const { data: currentItems, error } = await this.client
      .from('menu_items')
      .select('id, name, stock')
      .in('id', ids);

    if (error) {
      throw new Error(`Error al verificar stock en Supabase: ${error.message}`);
    }

    const itemsMap = new Map((currentItems || []).map(i => [i.id, i]));

    for (const req of requestedItems) {
      const item = itemsMap.get(req.menuItemId);
      if (!item) {
        throw new Error(`El producto con ID ${req.menuItemId} no existe en la carta.`);
      }
      if (item.stock < req.quantity) {
        throw new Error(`Stock insuficiente para "${item.name}". Disponibles: ${item.stock}, solicitados: ${req.quantity}.`);
      }
    }

    // 2. Decrement stock atomically per item
    for (const req of requestedItems) {
      const item = itemsMap.get(req.menuItemId)!;
      const newStock = item.stock - req.quantity;
      const { error: updateError } = await this.client
        .from('menu_items')
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', req.menuItemId);

      if (updateError) {
        console.warn(`Error updating stock for ${req.menuItemId}:`, updateError.message);
      }
    }
  }

  async updateStock(menuItemId: string, newStock: number): Promise<MenuItem> {
    const { data, error } = await this.client
      .from('menu_items')
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', menuItemId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar stock de ${menuItemId} en Supabase: ${error.message}`);
    }

    return mapRowToMenuItem(data);
  }

  async updateItem(item: MenuItem): Promise<MenuItem> {
    const row = mapMenuItemToRow(item);
    const { data, error } = await this.client
      .from('menu_items')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', item.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar producto ${item.id} en Supabase: ${error.message}`);
    }

    return mapRowToMenuItem(data);
  }

  async createItem(item: MenuItem): Promise<MenuItem> {
    const row = mapMenuItemToRow(item);
    const { data, error } = await this.client
      .from('menu_items')
      .insert(row)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear producto ${item.id} en Supabase: ${error.message}`);
    }

    return mapRowToMenuItem(data);
  }
}
