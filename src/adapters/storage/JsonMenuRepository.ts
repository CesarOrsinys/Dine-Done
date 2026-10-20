import { MenuItem } from '../../core/domain/entities/MenuItem.js';
import { IMenuRepository } from '../../core/ports/IMenuRepository.js';
import initialMenu from '../../../mock_data/menu.json' with { type: 'json' };

export class JsonMenuRepository implements IMenuRepository {
  private items: MenuItem[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('DND_MENU_ITEMS');
      if (stored) {
        try {
          this.items = JSON.parse(stored);
          return;
        } catch (e) {
          console.warn('Error reading menu from localStorage, falling back to initial seed.');
        }
      }
    }
    this.items = JSON.parse(JSON.stringify(initialMenu));
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
}
