import { Order } from '../../../core/domain/entities/Order.js';
import { OrderStatus } from '../../../core/domain/enums/OrderStatus.js';
import { PaymentStatus } from '../../../core/domain/enums/PaymentStatus.js';
import { IOrderRepository } from '../../../core/ports/IOrderRepository.js';
import { HttpApiClient } from '../api/HttpApiClient.js';

export class ApiOrderRepository implements IOrderRepository {
  async create(order: Order): Promise<Order> {
    return await HttpApiClient.request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(order)
    });
  }

  async findById(id: string): Promise<Order | null> {
    const orders = await this.findAll();
    return orders.find(o => o.id === id) || null;
  }

  async findAll(): Promise<Order[]> {
    const orders = await HttpApiClient.request<any[]>('/api/orders');
    return orders.map(o => ({
      ...o,
      createdAt: new Date(o.createdAt),
      updatedAt: new Date(o.updatedAt)
    }));
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return await HttpApiClient.request<Order>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Order> {
    return await HttpApiClient.request<Order>(`/api/orders/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async assignStaff(id: string, waiterId?: string, waiterName?: string, chefId?: string, chefName?: string): Promise<Order> {
    const updated = await HttpApiClient.request<Order>(`/api/orders/${id}/staff`, {
      method: 'PATCH',
      body: JSON.stringify({ waiterId, chefId })
    });
    if (waiterName) updated.waiterName = waiterName;
    if (chefName) updated.chefName = chefName;
    return updated;
  }
}
