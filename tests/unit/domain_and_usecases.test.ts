import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { CreateOrderUseCase } from '../../src/core/usecases/CreateOrderUseCase.js';
import { UpdateOrderStatusUseCase } from '../../src/core/usecases/UpdateOrderStatusUseCase.js';
import { AssignStaffUseCase } from '../../src/core/usecases/AssignStaffUseCase.js';
import { ProcessCashPaymentUseCase } from '../../src/core/usecases/ProcessCashPaymentUseCase.js';
import { ManageStockUseCase } from '../../src/core/usecases/ManageStockUseCase.js';
import { GenerateKpiReportUseCase } from '../../src/core/usecases/GenerateKpiReportUseCase.js';
import { JsonOrderRepository } from '../../src/adapters/storage/JsonOrderRepository.js';
import { JsonMenuRepository } from '../../src/adapters/storage/JsonMenuRepository.js';
import { StripePaymentGatewayMock } from '../../src/adapters/storage/StripePaymentGatewayMock.js';
import { LocalEventRealtimeNotifier } from '../../src/adapters/infrastructure/LocalEventRealtimeNotifier.js';
import { PaymentMethod } from '../../src/core/domain/enums/PaymentMethod.js';
import { PaymentStatus } from '../../src/core/domain/enums/PaymentStatus.js';
import { OrderStatus } from '../../src/core/domain/enums/OrderStatus.js';

describe('Dine & Done - Core Hexagonal Domain & Use Cases Suite', () => {
  let orderRepo: JsonOrderRepository;
  let menuRepo: JsonMenuRepository;
  let paymentGateway: StripePaymentGatewayMock;
  let notifier: LocalEventRealtimeNotifier;

  let createOrderUseCase: CreateOrderUseCase;
  let updateStatusUseCase: UpdateOrderStatusUseCase;
  let assignStaffUseCase: AssignStaffUseCase;
  let processCashUseCase: ProcessCashPaymentUseCase;
  let manageStockUseCase: ManageStockUseCase;
  let kpiUseCase: GenerateKpiReportUseCase;

  beforeEach(() => {
    orderRepo = new JsonOrderRepository();
    menuRepo = new JsonMenuRepository();
    paymentGateway = new StripePaymentGatewayMock();
    notifier = new LocalEventRealtimeNotifier();

    createOrderUseCase = new CreateOrderUseCase(orderRepo, menuRepo, paymentGateway, notifier);
    updateStatusUseCase = new UpdateOrderStatusUseCase(orderRepo, notifier);
    assignStaffUseCase = new AssignStaffUseCase(orderRepo, notifier);
    processCashUseCase = new ProcessCashPaymentUseCase(orderRepo, notifier);
    manageStockUseCase = new ManageStockUseCase(menuRepo);
    kpiUseCase = new GenerateKpiReportUseCase(orderRepo);
  });

  it('HU-01 & HU-02: Should create order with packaging, calculate tip, deduct stock and process Stripe payment', async () => {
    const initialItem = await menuRepo.getById('menu_1');
    assert.ok(initialItem);
    const initialStock = initialItem.stock;

    const order = await createOrderUseCase.execute({
      tableNumber: 'Mesa 12',
      customerName: 'Laura Fernández',
      items: [
        {
          menuItemId: 'menu_1',
          name: 'Tequeños Artesanales de Queso (5 uds)',
          unitPrice: 8.50,
          quantity: 2,
          requiresCooking: true
        }
      ],
      packaging: {
        bags: true,
        plasticContainers: true,
        cutleryCount: 2
      },
      paymentMethod: PaymentMethod.STRIPE_CARD,
      tipAmount: 2.00,
      stripeToken: 'tok_visa_custom'
    });

    assert.strictEqual(order.subtotal, 17.00);
    assert.strictEqual(order.packagingCost, 0.45);
    assert.strictEqual(order.tipAmount, 2.00);
    assert.strictEqual(order.total, 19.45);
    assert.strictEqual(order.paymentStatus, PaymentStatus.PAID);
    assert.strictEqual(order.status, OrderStatus.PLACED);
    assert.strictEqual(order.packaging.bags, true);
    assert.strictEqual(order.packaging.cutleryCount, 2);

    // Verify stock was deducted atomically
    const updatedItem = await menuRepo.getById('menu_1');
    assert.strictEqual(updatedItem?.stock, initialStock - 2);
  });

  it('HU-02 & HU-06: Should fail order creation if requested quantity exceeds stock', async () => {
    await assert.rejects(
      async () => {
        await createOrderUseCase.execute({
          tableNumber: 'Mesa 1',
          customerName: 'Test Overstock',
          items: [
            {
              menuItemId: 'menu_4',
              name: 'Salmón Noruego',
              unitPrice: 17.50,
              quantity: 9999, // Impossible stock
              requiresCooking: true
            }
          ],
          packaging: { bags: false, plasticContainers: false, cutleryCount: 0 },
          paymentMethod: PaymentMethod.CASH
        });
      },
      /Stock insuficiente/
    );
  });

  it('HU-02: Should create cash payment with PENDING_CASH and confirm payment later', async () => {
    const order = await createOrderUseCase.execute({
      tableNumber: 'Mesa 5',
      customerName: 'Mario Bros',
      items: [
        {
          menuItemId: 'menu_8',
          name: 'Cerveza Artesanal',
          unitPrice: 3.80,
          quantity: 1,
          requiresCooking: false
        }
      ],
      packaging: { bags: false, plasticContainers: false, cutleryCount: 0 },
      paymentMethod: PaymentMethod.CASH
    });

    assert.strictEqual(order.paymentStatus, PaymentStatus.PENDING_CASH);

    const paidOrder = await processCashUseCase.execute(order.id);
    assert.strictEqual(paidOrder.paymentStatus, PaymentStatus.PAID);
  });

  it('HU-03 & HU-04: Should transition order status from PLACED to IN_KITCHEN and READY_TO_SERVE', async () => {
    const allOrders = await orderRepo.findAll();
    const orderId = allOrders[0].id;

    const inKitchen = await updateStatusUseCase.execute(orderId, OrderStatus.IN_KITCHEN);
    assert.strictEqual(inKitchen.status, OrderStatus.IN_KITCHEN);

    const ready = await updateStatusUseCase.execute(orderId, OrderStatus.READY_TO_SERVE);
    assert.strictEqual(ready.status, OrderStatus.READY_TO_SERVE);

    const delivered = await updateStatusUseCase.execute(orderId, OrderStatus.DELIVERED);
    assert.strictEqual(delivered.status, OrderStatus.DELIVERED);
  });

  it('HU-05: Should assign waiter and chef to order for staff traceability', async () => {
    const allOrders = await orderRepo.findAll();
    const orderId = allOrders[0].id;

    const assigned = await assignStaffUseCase.execute({
      orderId,
      waiterId: 'usr_waiter_1',
      waiterName: 'David García',
      chefId: 'usr_chef_2',
      chefName: 'Chef Elena Vega'
    });

    assert.strictEqual(assigned.waiterId, 'usr_waiter_1');
    assert.strictEqual(assigned.waiterName, 'David García');
    assert.strictEqual(assigned.chefId, 'usr_chef_2');
    assert.strictEqual(assigned.chefName, 'Chef Elena Vega');
  });

  it('HU-06: Should allow manager to update item stock and reject negative values', async () => {
    const updated = await manageStockUseCase.execute('menu_2', 50);
    assert.strictEqual(updated.stock, 50);

    await assert.rejects(
      async () => {
        await manageStockUseCase.execute('menu_2', -5);
      },
      /El stock no puede ser un valor negativo/
    );
  });

  it('HU-08: Should aggregate KPI metrics correctly for managerial reports', async () => {
    const report = await kpiUseCase.execute();

    assert.ok(report.totalOrders > 0);
    assert.ok(typeof report.totalRevenue === 'number');
    assert.ok(Array.isArray(report.topRequestedItems));
  });

  it('HU-10: Should allow retrieving dishes with ingredients/allergens and updating price and stock', async () => {
    const item = await menuRepo.getById('menu_1');
    assert.ok(item);
    assert.ok(item.ingredients && item.ingredients.length > 0);
    assert.ok(item.allergens && item.allergens.includes('Gluten'));

    const updated = await menuRepo.updateItem({
      ...item,
      price: 9.95,
      stock: 40
    });

    assert.strictEqual(updated.price, 9.95);
    assert.strictEqual(updated.stock, 40);

    const reloaded = await menuRepo.getById('menu_1');
    assert.strictEqual(reloaded?.price, 9.95);
    assert.strictEqual(reloaded?.stock, 40);
  });
});
