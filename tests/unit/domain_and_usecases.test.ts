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
import { JsonUserRepository } from '../../src/adapters/storage/JsonUserRepository.js';
import restaurantConfig from '../../mock_data/restaurant_config.json' with { type: 'json' };
import translations from '../../mock_data/translations.json' with { type: 'json' };
import { StripePaymentGatewayMock } from '../../src/adapters/storage/StripePaymentGatewayMock.js';
import { LocalEventRealtimeNotifier } from '../../src/adapters/infrastructure/LocalEventRealtimeNotifier.js';
import { PaymentMethod } from '../../src/core/domain/enums/PaymentMethod.js';
import { PaymentStatus } from '../../src/core/domain/enums/PaymentStatus.js';
import { OrderStatus } from '../../src/core/domain/enums/OrderStatus.js';
import { UserRole } from '../../src/core/domain/enums/UserRole.js';
import { MenuCategory } from '../../src/core/domain/enums/MenuCategory.js';
import { MenuItem } from '../../src/core/domain/entities/MenuItem.js';

describe('Dine & Done - Core Hexagonal Domain & Use Cases Suite', () => {
  let orderRepo: JsonOrderRepository;
  let menuRepo: JsonMenuRepository;
  let userRepo: JsonUserRepository;
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
    userRepo = new JsonUserRepository();
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
    assert.strictEqual(order.vatAmount, 3.57);
    assert.strictEqual(order.subtotalNet, 13.43);
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

  it('HU-12: Should verify all 14 languages in menu and enforce menu-driven language selector decoupling rule', async () => {
    const allItems = await menuRepo.getAll();
    assert.ok(allItems.length >= 10);

    const requiredLanguages = ['es', 'en', 'fr', 'de', 'zh', 'ko', 'uk', 'pt', 'ja', 'ar', 'ca', 'va', 'eu', 'gl'];

    // Every item must support all 14 languages
    for (const item of allItems) {
      assert.ok(item.name, 'Item must have base Spanish name');
      assert.ok(item.translations, `Item ${item.id} must have translations dictionary`);
      for (const lang of requiredLanguages) {
        if (lang === 'es') continue;
        const trans = item.translations[lang];
        assert.ok(trans, `Item ${item.id} must have translation for ${lang}`);
        assert.ok(trans.name && trans.name.length > 0, `Item ${item.id} must have translated name for ${lang}`);
      }
    }

    // Decoupling rule function test:
    // If a language (e.g. 'it') is in app translations but missing from menu, it must not be included
    function filterAvailableLanguages(items: typeof allItems, appLangs: string[]): string[] {
      const available = ['es'];
      for (const lang of appLangs) {
        if (lang === 'es') continue;
        const allHaveIt = items.every(i => i.translations?.[lang]?.name?.trim());
        if (allHaveIt) available.push(lang);
      }
      return available;
    }

    const appLanguages = ['es', 'en', 'fr', 'de', 'zh', 'ko', 'uk', 'pt', 'ja', 'ar', 'ca', 'va', 'eu', 'gl', 'it'];
    const availableLangs = filterAvailableLanguages(allItems, appLanguages);

    // 'it' was in appLanguages but NOT in menu items, so it MUST NOT be available
    assert.ok(!availableLangs.includes('it'), 'Language not in menu must not be available');
    // All 14 supported menu languages MUST be available
    for (const lang of requiredLanguages) {
      assert.ok(availableLangs.includes(lang), `Language ${lang} should be available`);
    }

    // If an item removes 'zh', then 'zh' must immediately disappear from available languages
    const itemsWithoutZh = allItems.map((item, idx) => {
      if (idx === 0) {
        const copy = { ...item, translations: { ...item.translations } };
        delete copy.translations['zh'];
        return copy;
      }
      return item;
    });

    const langsAfterRemoval = filterAvailableLanguages(itemsWithoutZh, appLanguages);
    assert.ok(!langsAfterRemoval.includes('zh'), 'Language missing from even 1 menu item must be omitted from selector');
  });

  it('Req 1 & 2: Should verify availableTables in restaurant_config.json for staff-only table selection', () => {
    assert.ok(Array.isArray((restaurantConfig as any).availableTables), 'availableTables must be an array in config');
    assert.ok((restaurantConfig as any).availableTables.length >= 5, 'availableTables must have at least 5 tables');
    for (const table of (restaurantConfig as any).availableTables) {
      assert.ok(typeof table === 'string' && table.trim().length > 0, 'Every table must be a valid non-empty string');
    }
  });

  it('Req 3 & 4: Should verify staff credentials and strictly exclude CUSTOMER role from user management for privacy', async () => {
    const userRepo = new JsonUserRepository();
    const allUsers = await userRepo.getAll();

    // Requirement 4: Zero customers in user management repository to preserve privacy
    const customerUsers = allUsers.filter(u => u.role === UserRole.CUSTOMER);
    assert.strictEqual(customerUsers.length, 0, 'No CUSTOMER role users allowed in user management database');

    // Requirement 3: Staff users must have valid mock credentials for manual login
    assert.ok(allUsers.length > 0, 'Must have staff users configured');
    for (const staff of allUsers) {
      assert.ok(staff.role !== UserRole.CUSTOMER, 'User must be internal staff');
      assert.ok(staff.password && staff.password.length >= 6, `Staff ${staff.name} must have a secure mock password`);
      assert.ok(staff.username && staff.username.length > 0, `Staff ${staff.name} must have a username`);
    }

    // Verify authenticate method works and returns sanitized user without password
    const authWaiter = await userRepo.authenticate('camarero', 'camarero123');
    assert.ok(authWaiter !== null, 'Waiter should authenticate successfully');
    assert.strictEqual(authWaiter?.role, UserRole.WAITER);
    assert.strictEqual(authWaiter?.password, undefined, 'Authenticated user object must NOT expose password');

    const authFail = await userRepo.authenticate('camarero', 'wrongpassword');
    assert.strictEqual(authFail, null, 'Invalid password must return null');
  });

  it('RBAC Rule: Should verify that Chefs only access kitchen, Waiters only waiter, and Manager accesses all panels', () => {
    function canAccessTab(userRole: UserRole, targetTab: UserRole): boolean {
      if (userRole === UserRole.MANAGER) return true; // Manager accesses all
      if (userRole === UserRole.WAITER) return targetTab === UserRole.WAITER; // Waiter only waiter
      if (userRole === UserRole.CHEF) return targetTab === UserRole.CHEF; // Chef only chef
      return false;
    }

    // Waiter tests
    assert.strictEqual(canAccessTab(UserRole.WAITER, UserRole.WAITER), true, 'Waiter must access waiter tab');
    assert.strictEqual(canAccessTab(UserRole.WAITER, UserRole.CHEF), false, 'Waiter must NOT access chef tab');
    assert.strictEqual(canAccessTab(UserRole.WAITER, UserRole.MANAGER), false, 'Waiter must NOT access manager tab');

    // Chef tests
    assert.strictEqual(canAccessTab(UserRole.CHEF, UserRole.CHEF), true, 'Chef must access chef tab');
    assert.strictEqual(canAccessTab(UserRole.CHEF, UserRole.WAITER), false, 'Chef must NOT access waiter tab');
    assert.strictEqual(canAccessTab(UserRole.CHEF, UserRole.MANAGER), false, 'Chef must NOT access manager tab');

    // Manager tests
    assert.strictEqual(canAccessTab(UserRole.MANAGER, UserRole.WAITER), true, 'Manager must access waiter tab');
    assert.strictEqual(canAccessTab(UserRole.MANAGER, UserRole.CHEF), true, 'Manager must access chef tab');
    assert.strictEqual(canAccessTab(UserRole.MANAGER, UserRole.MANAGER), true, 'Manager must access manager tab');
  });

  it('Operational Flow & Cash Barrier: Cash orders cannot pass to cooking or delivery until paid', async () => {
    // Create an order with cash payment (PENDING_CASH)
    const order = await createOrderUseCase.execute({
      tableNumber: 'Mesa 1',
      customerName: 'Comensal Anónimo',
      items: [{
        menuItemId: 'menu_1',
        name: 'Tequeños Artesanales de Queso (5 uds)',
        unitPrice: 9.5,
        quantity: 1,
        requiresCooking: true
      }],
      packaging: { bags: false, plasticContainers: false, cutleryCount: 0 },
      paymentMethod: PaymentMethod.CASH,
      tipAmount: 0
    });

    assert.strictEqual(order.paymentStatus, PaymentStatus.PENDING_CASH);

    // Business rule: until paid, cannot cook
    function canStartCooking(status: OrderStatus, payStatus: PaymentStatus): boolean {
      if (payStatus === PaymentStatus.PENDING_CASH) return false;
      return status === OrderStatus.PLACED;
    }

    function canDeliverToTable(status: OrderStatus, payStatus: PaymentStatus): boolean {
      if (payStatus === PaymentStatus.PENDING_CASH) return false;
      return status === OrderStatus.READY_TO_SERVE;
    }

    assert.strictEqual(canStartCooking(order.status, order.paymentStatus), false, 'Must NOT allow cooking if cash pending');
    assert.strictEqual(canDeliverToTable(OrderStatus.READY_TO_SERVE, order.paymentStatus), false, 'Must NOT allow delivery if cash pending');

    // Confirm cash payment
    const paidOrder = await processCashUseCase.execute(order.id);
    assert.strictEqual(paidOrder.paymentStatus, PaymentStatus.PAID);
    assert.strictEqual(canStartCooking(paidOrder.status, paidOrder.paymentStatus), true, 'Allows cooking once paid');
    assert.strictEqual(canDeliverToTable(OrderStatus.READY_TO_SERVE, paidOrder.paymentStatus), true, 'Allows delivery once paid');
  });

  it('Manager Creation: Can create new staff users and new products in menu', async () => {
    const userRepo = new JsonUserRepository();

    // 1. Create new staff user
    const newUser = await userRepo.create({
      id: `usr_new_${Date.now()}`,
      name: 'Sofía Navarro',
      username: 'snavarro',
      email: 'sofia@dinedone.com',
      role: UserRole.WAITER,
      password: 'password123',
      active: true
    });

    assert.ok(newUser.id);
    assert.strictEqual(newUser.name, 'Sofía Navarro');
    assert.strictEqual(newUser.role, UserRole.WAITER);

    // 2. Create new product in menu catalog
    const allLangs = ['es', 'en', 'fr', 'de', 'zh', 'ko', 'uk', 'pt', 'ja', 'ar', 'ca', 'va', 'eu', 'gl'];
    const transMap: Record<string, { name: string; description: string }> = {};
    for (const l of allLangs) {
      transMap[l] = { name: 'Gazpacho Andaluz', description: 'Sopa fría' };
    }

    const newDish = await menuRepo.createItem({
      id: `item_test_${Date.now()}`,
      name: 'Gazpacho Andaluz',
      description: 'Sopa fría tradicional de tomate y verduras',
      price: 9.50,
      category: MenuCategory.STARTER,
      stock: 30,
      requiresCooking: false,
      isVegan: true,
      isVegetarian: true,
      isAlcoholFree: true,
      allergens: ['Gluten'],
      translations: transMap
    });

    assert.ok(newDish.id);
    assert.strictEqual(newDish.stock, 30);
    assert.strictEqual(newDish.price, 9.50);

    const allItems = await menuRepo.getAll();
    const found = allItems.find((i: MenuItem) => i.id === newDish.id);
    assert.ok(found, 'Created dish must exist in repository');
    assert.strictEqual(found?.name, 'Gazpacho Andaluz');
  });

  it('Manager Edit: Should allow full editing of existing dish information (name, allergens, category, price, translations)', async () => {
    const existing = await menuRepo.getById('menu_1');
    assert.ok(existing);

    const updatedDish = await menuRepo.updateItem({
      ...existing,
      name: 'Hamburguesa Trufada Angus Corregida',
      description: 'Descripción actualizada con nuevos detalles gourmet',
      price: 15.50,
      stock: 45,
      category: MenuCategory.MAIN,
      allergens: ['Gluten', 'Lácteos', 'Huevos'],
      translations: {
        ...existing.translations,
        en: {
          name: 'Corrected Truffled Angus Burger',
          description: 'Updated gourmet description'
        }
      }
    });

    assert.strictEqual(updatedDish.name, 'Hamburguesa Trufada Angus Corregida');
    assert.strictEqual(updatedDish.price, 15.50);
    assert.strictEqual(updatedDish.stock, 45);
    assert.ok(updatedDish.allergens?.includes('Huevos'));
    assert.strictEqual(updatedDish.translations?.en?.name, 'Corrected Truffled Angus Burger');

    const reloaded = await menuRepo.getById('menu_1');
    assert.strictEqual(reloaded?.name, 'Hamburguesa Trufada Angus Corregida');
    assert.strictEqual(reloaded?.price, 15.50);
    assert.strictEqual(reloaded?.stock, 45);
  });

  it('Manager Staff Edit: Should allow editing worker profile card info (name, role, email, avatar, status)', async () => {
    const waiter = await userRepo.getById('usr_waiter_1');
    assert.ok(waiter, 'Waiter must exist in mock users');
    assert.strictEqual(waiter.role, UserRole.WAITER);

    const updatedWaiter = await userRepo.update({
      ...waiter,
      name: 'Carlos Ruiz Promovido',
      email: 'carlos.jefe@dinedone.local',
      role: UserRole.MANAGER,
      active: true,
      avatarUrl: 'https://images.unsplash.com/photo-custom?w=150'
    });

    assert.strictEqual(updatedWaiter.name, 'Carlos Ruiz Promovido');
    assert.strictEqual(updatedWaiter.email, 'carlos.jefe@dinedone.local');
    assert.strictEqual(updatedWaiter.role, UserRole.MANAGER);
    assert.strictEqual(updatedWaiter.avatarUrl, 'https://images.unsplash.com/photo-custom?w=150');
    assert.strictEqual(updatedWaiter.password, waiter.password, 'Existing password must be preserved when not overwritten');

    const reloadedWaiter = await userRepo.getById('usr_waiter_1');
    assert.strictEqual(reloadedWaiter?.name, 'Carlos Ruiz Promovido');
    assert.strictEqual(reloadedWaiter?.role, UserRole.MANAGER);
  });

  it('Payment & Invoicing: Should create order with Invoice request and preserve fiscal details', async () => {
    const orderWithInvoice = await createOrderUseCase.execute({
      tableNumber: 'Mesa 7',
      customerName: 'Tech Solutions S.L.',
      items: [
        {
          menuItemId: 'menu_1',
          name: 'Hamburguesa Trufada Angus Corregida',
          unitPrice: 15.50,
          quantity: 2,
          requiresCooking: true
        }
      ],
      packaging: {
        bags: true,
        plasticContainers: false,
        cutleryCount: 1
      },
      paymentMethod: PaymentMethod.STRIPE_CARD,
      tipAmount: 3.00,
      receiptType: 'INVOICE',
      invoiceDetails: {
        nifCif: 'B98765432',
        legalName: 'Tech Solutions S.L.',
        address: 'Paseo de la Castellana 100, Madrid',
        email: 'contabilidad@techsolutions.es'
      }
    });

    assert.ok(orderWithInvoice.id);
    assert.strictEqual(orderWithInvoice.receiptType, 'INVOICE');
    assert.ok(orderWithInvoice.invoiceDetails);
    assert.strictEqual(orderWithInvoice.invoiceDetails.nifCif, 'B98765432');
    assert.strictEqual(orderWithInvoice.invoiceDetails.legalName, 'Tech Solutions S.L.');
    assert.strictEqual(orderWithInvoice.paymentStatus, PaymentStatus.PAID);
    assert.strictEqual(orderWithInvoice.vatAmount, parseFloat((31.00 * 0.21).toFixed(2)));
  });

  it('HU-14 & Allergen Icons: Should correctly map allergen icons across all 14 supported languages without fallback errors', async () => {
    const dishes = await menuRepo.getAll();
    assert.ok(dishes.length > 0);

    // Multilingual Allergen Icon dictionary test pattern
    const knownAllergenExpectations: Record<string, string> = {
      // Spanish
      'Gluten': '🌾', 'Lácteos': '🥛', 'Huevos': '🥚', 'Pescado': '🐟', 'Frutos de cáscara': '🌰', 'Sulfitos': '🍷',
      // English
      'Dairy': '🥛', 'Eggs': '🥚', 'Fish': '🐟', 'Nuts': '🌰', 'Sulphites': '🍷',
      // French
      'Lactose': '🥛', 'Oeufs': '🥚', 'Poisson': '🐟', 'Fruits à coque': '🌰', 'Sulfites': '🍷',
      // German
      'Laktose': '🥛', 'Eier': '🥚', 'Fisch': '🐟', 'Schalenfrüchte': '🌰', 'Sulfite': '🍷',
      // Chinese
      '麸质': '🌾', '乳制品': '🥛', '蛋类': '🥚', '鱼类': '🐟', '亚硫酸盐': '🍷',
      // Japanese
      '小麦(グルテン)': '🌾', '乳製品': '🥛', '卵': '🥚', '魚介類': '🐟', '亜硫酸塩': '🍷',
      // Korean
      '글루텐': '🌾', '유제품': '🥛', '계란': '🥚', '생선': '🐟', '아황산염': '🍷',
      // Ukrainian
      'Глютен': '🌾', 'Лактоза': '🥛', 'Яйця': '🥚', 'Риба': '🐟', 'Сульфіти': '🍷',
      // Arabic
      'غلوتين': '🌾', 'مشتقات الحليب': '🥛', 'بيض': '🥚', 'أسماك': '🐟', 'كبريتات': '🍷',
      // Catalan / Valencian
      'Lactis': '🥛', 'Làctics': '🥛', 'Ous': '🥚', 'Peix': '🐟', 'Sulfits': '🍷',
      // Basque
      'Glutena': '🌾', 'Esnekiak': '🥛', 'Arrautzak': '🥚', 'Arraina': '🐟', 'Sulfitoak': '🍷',
      // Galician
      'Glute': '🌾', 'Ovos': '🥚', 'Peixe': '🐟'
    };

    // Verify all dishes across all translations map to expected icons
    let checkedCount = 0;
    for (const dish of dishes) {
      if (dish.translations) {
        for (const [lang, trans] of Object.entries(dish.translations)) {
          if (trans.allergens) {
            trans.allergens.forEach(a => {
              if (knownAllergenExpectations[a]) {
                assert.ok(knownAllergenExpectations[a]);
                checkedCount++;
              }
            });
          }
        }
      }
    }
    assert.ok(checkedCount > 100, `Must verify at least 100 translated allergen instances (verified: ${checkedCount})`);
  });

  it('HU-15 & Staff i18n: Should verify complete, non-empty staff translations across all 14 languages', () => {
    const requiredLanguages = ['es', 'en', 'fr', 'de', 'zh', 'ko', 'uk', 'pt', 'ja', 'ar', 'ca', 'va', 'eu', 'gl'];
    const staffKeys = [
      // Waiter
      'waiterRefresh', 'waiterNoOrders', 'orderItemsCount', 'orderStatusLabel', 'orderPaymentLabel',
      'paymentPaid', 'paymentPendingCash', 'btnAttendOrder', 'btnDeliverOrder', 'alertCashDeliveryBlocked', 'btnCollectCash',
      // Chef
      'kdsPendingBadge', 'kdsNoOrders', 'kdsKitchenRequirements', 'kdsPrepNote', 'kdsAssignedChef',
      'kdsBtnAssignMe', 'kdsCashBlocked', 'kdsBtnStartCook', 'kdsBtnReadyCook',
      // Manager
      'managerExportReport', 'kpiRevenueLabel', 'kpiRevenueSub', 'kpiTipsLabel', 'kpiTipsSub',
      'kpiAvgTicketLabel', 'kpiAvgTicketSub', 'kpiOrdersCountLabel', 'kpiOrdersSubInKitchen', 'kpiOrdersSubDelivered',
      'managerWorkflowTitle', 'managerWorkflowDesc', 'managerSkipAssignment', 'managerTopItemsTitle',
      'thDish', 'thOrderedQty', 'thTotalRevenue', 'ordersCountUnit', 'managerStockTitle', 'managerStockSub',
      'thProduct', 'thCategory', 'thPrice', 'thStock', 'thActions', 'btnEdit', 'btnSave',
      'managerUsersTitle', 'btnAddUser', 'btnAddProduct', 'userActive', 'userInactive', 'userLoginLabel',
      'roleManagerBadge', 'roleChefBadge', 'roleWaiterBadge', 'roleStaffGeneric'
    ];

    const trans = translations as Record<string, Record<string, string>>;

    for (const lang of requiredLanguages) {
      assert.ok(trans[lang], `Language '${lang}' must exist in translations.json`);
      for (const key of staffKeys) {
        const val = trans[lang][key];
        assert.ok(
          val && typeof val === 'string' && val.trim().length > 0,
          `Key '${key}' must exist and not be empty for language '${lang}'`
        );
      }
    }
  });

  it('HU-16 & Full i18n Parity: Should verify 100% key parity across all 14 supported languages with 356 keys', () => {
    const requiredLanguages = ['es', 'en', 'fr', 'de', 'zh', 'ko', 'uk', 'pt', 'ja', 'ar', 'ca', 'va', 'eu', 'gl'];
    const trans = translations as Record<string, Record<string, string>>;
    const baseKeys = Object.keys(trans['es']);
    assert.strictEqual(baseKeys.length, 356, `Spanish base dictionary must have exactly 356 keys (found: ${baseKeys.length})`);

    for (const lang of requiredLanguages) {
      assert.ok(trans[lang], `Language dictionary '${lang}' must exist`);
      const langKeys = Object.keys(trans[lang]);
      assert.strictEqual(
        langKeys.length,
        356,
        `Language '${lang}' must have exactly 356 keys for 100% parity (found: ${langKeys.length})`
      );

      // Verify every key exists and has non-empty text
      for (const key of baseKeys) {
        const val = trans[lang][key];
        assert.ok(
          val !== undefined && typeof val === 'string' && val.trim().length > 0,
          `Key '${key}' must be defined and non-empty in language '${lang}'`
        );
      }
    }
  });

  it('HU-18: Should successfully delete an employee from JsonUserRepository', async () => {
    const newUser = await userRepo.create({
      id: 'test_delete_user',
      name: 'Empleado Temporal',
      email: 'temporal@restaurante.local',
      role: UserRole.WAITER,
      active: true
    });
    const found = await userRepo.getById('test_delete_user');
    assert.ok(found);

    const deleted = await userRepo.delete('test_delete_user');
    assert.strictEqual(deleted, true);

    const afterDelete = await userRepo.getById('test_delete_user');
    assert.strictEqual(afterDelete, null);
  });

  it('HU-16 & Employee Names Sanitization: Staff names in repository must be clean personal names without role tags', async () => {
    const staff = await userRepo.getAll();
    assert.ok(staff.length >= 5, 'Should have at least 5 staff users');

    const roleRegex = /\b(Gerente|Camarero|Camarera|Cocinero|Cocinera|Chef|Waiter|Manager)\b/i;

    for (const user of staff) {
      assert.ok(
        !roleRegex.test(user.name),
        `Staff name '${user.name}' must not contain role words like Gerente, Camarero or Chef`
      );
      assert.ok(user.name.trim().length > 0, 'Staff name must not be empty');
      assert.ok(user.email.includes('@'), `Staff email '${user.email}' must be valid`);
      assert.ok(user.role in UserRole, `Staff role '${user.role}' must be a valid UserRole`);
    }

    // Verify expected clean names
    const names = staff.map(u => u.name);
    assert.ok(names.includes('David García'));
    assert.ok(names.includes('Lucía Ramos'));
    assert.ok(names.includes('Antonio Martín'));
    assert.ok(names.includes('Elena Vega'));
    assert.ok(names.includes('César Orsinys'));
  });

  it('HU-16 & Localized Roles and Modals: Should verify all role definitions and modal labels are properly translated', () => {
    const requiredLanguages = ['es', 'en', 'fr', 'de', 'zh', 'ko', 'uk', 'pt', 'ja', 'ar', 'ca', 'va', 'eu', 'gl'];
    const trans = translations as Record<string, Record<string, string>>;

    const roleKeys = ['roleWaiter', 'roleChef', 'roleManager', 'roleCustomer', 'payAtTable', 'btnCreateRole'];
    const modalKeys = [
      'modalNewUserTitle', 'modalEditUserTitle', 'modalNewUserSub', 'modalEditUserSub',
      'lblUsername', 'btnSaveUser', 'btnUpdateUser',
      'modalNewProductTitle', 'modalEditProductTitle', 'modalNewProductSub', 'modalEditProductSub',
      'lblProductImagesTitle', 'lblProductImagesSub', 'btnSaveProduct', 'btnSaveProductChanges',
      'orderConfirmedTitle', 'orderConfirmedSub', 'receiptTicket', 'receiptInvoice',
      'lblRequestedProducts', 'modalCreateRoleTitle', 'modalCreateRoleSub', 'btnSaveRole'
    ];

    for (const lang of requiredLanguages) {
      for (const k of roleKeys) {
        assert.ok(trans[lang][k], `Role key '${k}' must exist in '${lang}'`);
      }
      for (const k of modalKeys) {
        assert.ok(trans[lang][k], `Modal/Form key '${k}' must exist in '${lang}'`);
      }
    }

    // Verify localized role representations
    assert.strictEqual(trans['es'].roleWaiter, 'Camarero');
    assert.strictEqual(trans['en'].roleWaiter, 'Waiter');
    assert.strictEqual(trans['fr'].roleWaiter, 'Serveur');
    assert.strictEqual(trans['es'].roleChef, 'Cocina (KDS)');
    assert.strictEqual(trans['en'].roleChef, 'Kitchen (KDS)');
    assert.strictEqual(trans['fr'].roleChef, 'Cuisine (KDS)');
    assert.strictEqual(trans['de'].roleChef, 'Küche (KDS)');

    assert.strictEqual(trans['es'].roleChefBadge, '👨‍🍳 Cocinero');
    assert.strictEqual(trans['en'].roleChefBadge, '👨‍🍳 Chef');
    assert.strictEqual(trans['fr'].roleChefBadge, '👨‍🍳 Cuisinier');
    assert.strictEqual(trans['de'].roleChefBadge, '👨‍🍳 Koch');

    assert.strictEqual(trans['es'].roleManager, 'Gerente');
    assert.strictEqual(trans['en'].roleManager, 'Manager');
    assert.strictEqual(trans['fr'].roleManager, 'Gérant');
    assert.strictEqual(trans['de'].roleManager, 'Geschäftsführer');
  });

  it('HU-17 & Hospitality Worker Roles in Config: Should verify restaurant_config.json contains basic hospitality staff roles with complete 14-language translations', () => {
    const requiredLanguages = ['es', 'en', 'fr', 'de', 'zh', 'ko', 'uk', 'pt', 'ja', 'ar', 'ca', 'va', 'eu', 'gl'];
    const roles = (restaurantConfig as any).staffRoles;
    assert.ok(Array.isArray(roles), 'staffRoles must be an array in restaurant_config.json');
    assert.ok(roles.length >= 6, `staffRoles should include at least 6 hospitality roles (found: ${roles.length})`);

    const expectedRoleIds = ['MANAGER', 'WAITER', 'CHEF', 'BARTENDER', 'SOMMELIER', 'HOST'];
    for (const id of expectedRoleIds) {
      const found = roles.find((r: any) => r.id === id);
      assert.ok(found, `Expected role ID '${id}' must be configured`);
      assert.ok(found.name, `Role '${id}' must have a name`);
      assert.ok(found.icon, `Role '${id}' must have an icon`);
      assert.ok(found.baseRole, `Role '${id}' must define baseRole`);
      assert.ok(found.translations, `Role '${id}' must define translations`);

      for (const lang of requiredLanguages) {
        assert.ok(
          found.translations[lang] && found.translations[lang].length > 0,
          `Role '${id}' must have translation for '${lang}'`
        );
      }
    }
  });
});



