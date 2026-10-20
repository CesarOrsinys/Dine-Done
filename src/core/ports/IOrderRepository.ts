import { Order } from '../domain/entities/Order.js';
import { OrderStatus } from '../domain/enums/OrderStatus.js';
import { PaymentStatus } from '../domain/enums/PaymentStatus.js';

export interface IOrderRepository {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findAll(): Promise<Order[]>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  updatePaymentStatus(id: string, status: PaymentStatus): Promise<Order>;
  assignStaff(id: string, waiterId?: string, waiterName?: string, chefId?: string, chefName?: string): Promise<Order>;
}
