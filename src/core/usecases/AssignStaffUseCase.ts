import { Order } from '../domain/entities/Order.js';
import { IOrderRepository } from '../ports/IOrderRepository.js';
import { IRealtimeNotifier } from '../ports/IRealtimeNotifier.js';

export interface AssignStaffDTO {
  orderId: string;
  waiterId?: string;
  waiterName?: string;
  chefId?: string;
  chefName?: string;
}

export class AssignStaffUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly notifier: IRealtimeNotifier
  ) {}

  async execute(dto: AssignStaffDTO): Promise<Order> {
    const existing = await this.orderRepo.findById(dto.orderId);
    if (!existing) {
      throw new Error(`La comanda con ID ${dto.orderId} no existe.`);
    }

    const updated = await this.orderRepo.assignStaff(
      dto.orderId,
      dto.waiterId,
      dto.waiterName,
      dto.chefId,
      dto.chefName
    );

    this.notifier.notifyOrderUpdate(updated);
    return updated;
  }
}
