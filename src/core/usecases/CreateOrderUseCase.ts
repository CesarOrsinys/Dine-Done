import { Order } from '../domain/entities/Order.js';
import { OrderStatus } from '../domain/enums/OrderStatus.js';
import { PaymentMethod } from '../domain/enums/PaymentMethod.js';
import { PaymentStatus } from '../domain/enums/PaymentStatus.js';
import { OrderItem } from '../domain/value-objects/OrderItem.js';
import { PackagingOptions } from '../domain/value-objects/PackagingOptions.js';
import { IMenuRepository } from '../ports/IMenuRepository.js';
import { IOrderRepository } from '../ports/IOrderRepository.js';
import { IPaymentGateway } from '../ports/IPaymentGateway.js';
import { IRealtimeNotifier } from '../ports/IRealtimeNotifier.js';

export interface CreateOrderDTO {
  tableNumber: string;
  customerName: string;
  items: OrderItem[];
  packaging: PackagingOptions;
  paymentMethod: PaymentMethod;
  tipAmount?: number;
  stripeToken?: string;
  waiterId?: string;
  waiterName?: string;
  chefId?: string;
  chefName?: string;
  receiptType?: 'TICKET' | 'INVOICE';
  invoiceDetails?: {
    nifCif: string;
    legalName: string;
    address: string;
    email: string;
  };
}

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly menuRepo: IMenuRepository,
    private readonly paymentGateway: IPaymentGateway,
    private readonly notifier: IRealtimeNotifier
  ) {}

  async execute(dto: CreateOrderDTO): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new Error('El pedido debe contener al menos un producto del menú.');
    }

    if (!dto.tableNumber || dto.tableNumber.trim() === '') {
      throw new Error('Debe especificarse el número de mesa.');
    }

    // 1. Stock validation & atomic deduction
    await this.menuRepo.deductStock(
      dto.items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity }))
    );

    // 2. Subtotal, IVA (21%) and packaging calculation (Spanish Law: R.D. 293/2018 and Ley 7/2022)
    const subtotal = dto.items.reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0);
    const vatAmount = parseFloat((subtotal * 0.21).toFixed(2));
    const subtotalNet = parseFloat((subtotal - vatAmount).toFixed(2));
    const packagingCost = (dto.packaging.bags ? 0.10 : 0) +
                          (dto.packaging.plasticContainers ? 0.15 : 0) +
                          (dto.packaging.cutleryCount > 0 ? dto.packaging.cutleryCount * 0.10 : 0);
    const tip = dto.tipAmount && dto.tipAmount > 0 ? dto.tipAmount : 0;
    const total = parseFloat((subtotal + packagingCost + tip).toFixed(2));

    // 3. Payment Processing
    let paymentStatus = PaymentStatus.PENDING_CASH;
    let transactionId: string | undefined;
    if (dto.paymentMethod === PaymentMethod.STRIPE_CARD) {
      const paymentResult = await this.paymentGateway.processPayment({
        amount: subtotal + packagingCost,
        tip: tip,
        token: dto.stripeToken || 'tok_visa'
      });

      if (!paymentResult.success) {
        throw new Error('La pasarela de pago Stripe rechazó la transacción.');
      }
      paymentStatus = PaymentStatus.PAID;
      transactionId = paymentResult.transactionId;
    }

    // 4. Generate order
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      id: `ord_${Date.now()}_${randomSuffix}`,
      orderNumber: `DND-${randomSuffix}`,
      tableNumber: dto.tableNumber,
      customerName: dto.customerName || 'Comensal',
      items: dto.items,
      packaging: dto.packaging,
      status: OrderStatus.PLACED,
      paymentStatus: paymentStatus,
      paymentMethod: dto.paymentMethod,
      transactionId: transactionId,
      subtotal: parseFloat(subtotal.toFixed(2)),
      subtotalNet: subtotalNet,
      vatAmount: vatAmount,
      packagingCost: parseFloat(packagingCost.toFixed(2)),
      tipAmount: parseFloat(tip.toFixed(2)),
      total: total,
      waiterId: dto.waiterId,
      waiterName: dto.waiterName,
      chefId: dto.chefId,
      chefName: dto.chefName,
      receiptType: dto.receiptType || 'TICKET',
      invoiceDetails: dto.invoiceDetails,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const savedOrder = await this.orderRepo.create(newOrder);
    this.notifier.notifyOrderUpdate(savedOrder);
    return savedOrder;
  }
}
