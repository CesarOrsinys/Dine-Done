import { Order } from '../domain/entities/Order.js';
import { OrderStatus } from '../domain/enums/OrderStatus.js';
import { IOrderRepository } from '../ports/IOrderRepository.js';
import { IRealtimeNotifier } from '../ports/IRealtimeNotifier.js';

export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly notifier: IRealtimeNotifier
  ) {}

  async execute(orderId: string, newStatus: OrderStatus): Promise<Order> {
    const existing = await this.orderRepo.findById(orderId);
    if (!existing) {
      throw new Error(`La comanda con ID ${orderId} no existe.`);
    }

    const updated = await this.orderRepo.updateStatus(orderId, newStatus);
    this.notifier.notifyOrderUpdate(updated);
    return updated;
  }
}
