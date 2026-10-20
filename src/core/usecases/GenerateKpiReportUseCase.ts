import { OrderStatus } from '../domain/enums/OrderStatus.js';
import { PaymentStatus } from '../domain/enums/PaymentStatus.js';
import { IOrderRepository } from '../ports/IOrderRepository.js';

export interface KpiReport {
  totalOrders: number;
  totalRevenue: number;
  totalTips: number;
  averageTicket: number;
  paidOrdersCount: number;
  pendingCashOrdersCount: number;
  deliveredOrdersCount: number;
  inKitchenOrdersCount: number;
  topRequestedItems: { name: string; count: number; revenue: number }[];
}

export class GenerateKpiReportUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(): Promise<KpiReport> {
    const orders = await this.orderRepo.findAll();

    const totalOrders = orders.length;
    let totalRevenue = 0;
    let totalTips = 0;
    let paidOrdersCount = 0;
    let pendingCashOrdersCount = 0;
    let deliveredOrdersCount = 0;
    let inKitchenOrdersCount = 0;

    const itemCounts: Record<string, { count: number; revenue: number }> = {};

    for (const order of orders) {
      if (order.paymentStatus === PaymentStatus.PAID) {
        paidOrdersCount++;
        totalRevenue += order.total;
        totalTips += order.tipAmount;
      } else if (order.paymentStatus === PaymentStatus.PENDING_CASH) {
        pendingCashOrdersCount++;
      }

      if (order.status === OrderStatus.DELIVERED) {
        deliveredOrdersCount++;
      } else if (order.status === OrderStatus.IN_KITCHEN || order.status === OrderStatus.PLACED) {
        inKitchenOrdersCount++;
      }

      for (const item of order.items) {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { count: 0, revenue: 0 };
        }
        itemCounts[item.name].count += item.quantity;
        itemCounts[item.name].revenue += item.quantity * item.unitPrice;
      }
    }

    const averageTicket = paidOrdersCount > 0 ? parseFloat((totalRevenue / paidOrdersCount).toFixed(2)) : 0;

    const topRequestedItems = Object.entries(itemCounts)
      .map(([name, data]) => ({ name, count: data.count, revenue: parseFloat(data.revenue.toFixed(2)) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalTips: parseFloat(totalTips.toFixed(2)),
      averageTicket,
      paidOrdersCount,
      pendingCashOrdersCount,
      deliveredOrdersCount,
      inKitchenOrdersCount,
      topRequestedItems
    };
  }
}
