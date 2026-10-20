import { Order } from '../domain/entities/Order.js';
import { PaymentStatus } from '../domain/enums/PaymentStatus.js';
import { IOrderRepository } from '../ports/IOrderRepository.js';
import { IRealtimeNotifier } from '../ports/IRealtimeNotifier.js';

export class ProcessCashPaymentUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly notifier: IRealtimeNotifier
  ) {}

  async execute(orderId: string): Promise<Order> {
    const existing = await this.orderRepo.findById(orderId);
    if (!existing) {
      throw new Error(`La comanda con ID ${orderId} no existe.`);
    }

    const updated = await this.orderRepo.updatePaymentStatus(orderId, PaymentStatus.PAID);
    this.notifier.notifyOrderUpdate(updated);
    return updated;
  }
}
