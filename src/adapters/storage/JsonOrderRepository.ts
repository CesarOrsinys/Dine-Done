import { Order } from '../../core/domain/entities/Order.js';
import { OrderStatus } from '../../core/domain/enums/OrderStatus.js';
import { PaymentStatus } from '../../core/domain/enums/PaymentStatus.js';
import { IOrderRepository } from '../../core/ports/IOrderRepository.js';
import initialOrders from '../../../mock_data/orders.json' with { type: 'json' };

export class JsonOrderRepository implements IOrderRepository {
  private orders: Order[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('DND_ORDERS');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.orders = parsed.map((o: any) => ({
            ...o,
            createdAt: new Date(o.createdAt),
            updatedAt: new Date(o.updatedAt)
          }));
          return;
        } catch (e) {
          console.warn('Error reading orders from localStorage, falling back to seed.');
        }
      }
    }

    this.orders = (initialOrders as any[]).map(o => ({
      ...o,
      createdAt: new Date(o.createdAt),
      updatedAt: new Date(o.updatedAt)
    }));
    this.save();
  }

  private save() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('DND_ORDERS', JSON.stringify(this.orders));
    }
  }

  async create(order: Order): Promise<Order> {
    this.orders.unshift(order);
    this.save();
    return JSON.parse(JSON.stringify(order));
  }

  async findById(id: string): Promise<Order | null> {
    const order = this.orders.find(o => o.id === id);
    return order ? JSON.parse(JSON.stringify(order)) : null;
  }

  async findAll(): Promise<Order[]> {
    return JSON.parse(JSON.stringify(this.orders));
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = this.orders.find(o => o.id === id);
    if (!order) {
      throw new Error(`Comanda con ID ${id} no encontrada.`);
    }
    order.status = status;
    order.updatedAt = new Date();
    this.save();
    return JSON.parse(JSON.stringify(order));
  }

  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Order> {
    const order = this.orders.find(o => o.id === id);
    if (!order) {
      throw new Error(`Comanda con ID ${id} no encontrada.`);
    }
    order.paymentStatus = status;
    order.updatedAt = new Date();
    this.save();
    return JSON.parse(JSON.stringify(order));
  }

  async assignStaff(id: string, waiterId?: string, waiterName?: string, chefId?: string, chefName?: string): Promise<Order> {
    const order = this.orders.find(o => o.id === id);
    if (!order) {
      throw new Error(`Comanda con ID ${id} no encontrada.`);
    }
    if (waiterId) order.waiterId = waiterId;
    if (waiterName) order.waiterName = waiterName;
    if (chefId) order.chefId = chefId;
    if (chefName) order.chefName = chefName;
    order.updatedAt = new Date();
    this.save();
    return JSON.parse(JSON.stringify(order));
  }
}
