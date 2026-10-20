import { MenuItem } from '../domain/entities/MenuItem.js';

export interface IMenuRepository {
  getAll(): Promise<MenuItem[]>;
  getById(id: string): Promise<MenuItem | null>;
  deductStock(items: { menuItemId: string; quantity: number }[]): Promise<void>;
  updateStock(menuItemId: string, newStock: number): Promise<MenuItem>;
  updateItem(item: MenuItem): Promise<MenuItem>;
  createItem(item: MenuItem): Promise<MenuItem>;
}
