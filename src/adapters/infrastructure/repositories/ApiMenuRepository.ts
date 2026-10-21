import { MenuItem } from '../../../core/domain/entities/MenuItem.js';
import { IMenuRepository } from '../../../core/ports/IMenuRepository.js';
import { HttpApiClient } from '../api/HttpApiClient.js';

export class ApiMenuRepository implements IMenuRepository {
  async getAll(): Promise<MenuItem[]> {
    return await HttpApiClient.request<MenuItem[]>('/api/menu');
  }

  async getById(id: string): Promise<MenuItem | null> {
    const all = await this.getAll();
    return all.find(i => i.id === id) || null;
  }

  async deductStock(_items: { menuItemId: string; quantity: number }[]): Promise<void> {
    // El servidor se encarga de deducir el stock automáticamente al registrar la orden en /api/orders
  }

  async updateStock(menuItemId: string, newStock: number): Promise<MenuItem> {
    return await HttpApiClient.request<MenuItem>(`/api/menu/${menuItemId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock: newStock })
    });
  }

  async updateItem(item: MenuItem): Promise<MenuItem> {
    return await HttpApiClient.request<MenuItem>(`/api/menu/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify(item)
    });
  }

  async createItem(item: MenuItem): Promise<MenuItem> {
    return await HttpApiClient.request<MenuItem>('/api/menu', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }
}
