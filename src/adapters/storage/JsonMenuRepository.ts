import { MenuItem } from '../../core/domain/entities/MenuItem.js';
import { IMenuRepository } from '../../core/ports/IMenuRepository.js';
import initialMenu from '../../../mock_data/menu.json' with { type: 'json' };

export class JsonMenuRepository implements IMenuRepository {
  private items: MenuItem[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const seedItems = JSON.parse(JSON.stringify(initialMenu)) as MenuItem[];

    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('DND_MENU_ITEMS');
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as MenuItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Merge custom stored price/stock while always updating translations and assets
            const seedIds = new Set(seedItems.map(s => s.id));
            const merged = seedItems.map(seed => {
              const existing = parsed.find(p => p.id === seed.id);
              if (existing) {
                return {
                  ...seed,
                  price: typeof existing.price === 'number' ? existing.price : seed.price,
                  stock: typeof existing.stock === 'number' ? existing.stock : seed.stock,
                  translations: {
                    ...seed.translations,
                    ...(existing.translations || {})
                  }
                };
              }
              return seed;
            });
            // Append custom products created by the manager
            const customItems = parsed.filter(p => !seedIds.has(p.id));
            this.items = [...merged, ...customItems];
            this.save();
            return;
          }
        } catch (e) {
          console.warn('Error reading menu from localStorage, falling back to initial seed.');
        }
      }
    }
    this.items = seedItems;
    this.save();
  }

  private save() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('DND_MENU_ITEMS', JSON.stringify(this.items));
    }
  }

  async getAll(): Promise<MenuItem[]> {
    return JSON.parse(JSON.stringify(this.items));
  }

  async getById(id: string): Promise<MenuItem | null> {
    const item = this.items.find(i => i.id === id);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  async deductStock(requestedItems: { menuItemId: string; quantity: number }[]): Promise<void> {
    // 1. Check all stock availability before deducting
    for (const req of requestedItems) {
      const item = this.items.find(i => i.id === req.menuItemId);
      if (!item) {
        throw new Error(`El producto con ID ${req.menuItemId} no existe en la carta.`);
      }
      if (item.stock < req.quantity) {
        throw new Error(`Stock insuficiente para "${item.name}". Disponibles: ${item.stock}, solicitados: ${req.quantity}.`);
      }
    }

    // 2. Perform atomic deduction
    for (const req of requestedItems) {
      const item = this.items.find(i => i.id === req.menuItemId)!;
      item.stock -= req.quantity;
    }

    this.save();
  }

  async updateStock(menuItemId: string, newStock: number): Promise<MenuItem> {
    const item = this.items.find(i => i.id === menuItemId);
    if (!item) {
      throw new Error(`El producto con ID ${menuItemId} no existe.`);
    }
    item.stock = newStock;
    this.save();
    return JSON.parse(JSON.stringify(item));
  }

  async updateItem(updatedItem: MenuItem): Promise<MenuItem> {
    const idx = this.items.findIndex(i => i.id === updatedItem.id);
    if (idx < 0) {
      throw new Error(`El producto con ID ${updatedItem.id} no existe.`);
    }
    this.items[idx] = { ...updatedItem };
    this.save();
    return JSON.parse(JSON.stringify(this.items[idx]));
  }

  async createItem(item: MenuItem): Promise<MenuItem> {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      throw new Error(`Ya existe un producto con el ID ${item.id}.`);
    }
    this.items.push(item);
    this.save();
    return JSON.parse(JSON.stringify(item));
  }
}
