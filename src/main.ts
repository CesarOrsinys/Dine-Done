import { RepositoryContainer } from './adapters/infrastructure/di/RepositoryContainer.js';
import { MenuItem } from './core/domain/entities/MenuItem.js';
import { Order } from './core/domain/entities/Order.js';
import { User } from './core/domain/entities/User.js';
import { MenuCategory } from './core/domain/enums/MenuCategory.js';
import { OrderStatus } from './core/domain/enums/OrderStatus.js';
import { PaymentMethod } from './core/domain/enums/PaymentMethod.js';
import { PaymentStatus } from './core/domain/enums/PaymentStatus.js';
import { UserRole } from './core/domain/enums/UserRole.js';
import { OrderItem } from './core/domain/value-objects/OrderItem.js';
import { AssignStaffUseCase } from './core/usecases/AssignStaffUseCase.js';
import { CreateOrderUseCase } from './core/usecases/CreateOrderUseCase.js';
import { GenerateKpiReportUseCase } from './core/usecases/GenerateKpiReportUseCase.js';
import { ManageStockUseCase } from './core/usecases/ManageStockUseCase.js';
import { ProcessCashPaymentUseCase } from './core/usecases/ProcessCashPaymentUseCase.js';
import { UpdateOrderStatusUseCase } from './core/usecases/UpdateOrderStatusUseCase.js';

// 1. Initialize Hexagonal Services & Use Cases via DI
const services = RepositoryContainer.getServices(true);
const createOrderUseCase = new CreateOrderUseCase(services.orderRepo, services.menuRepo, services.paymentGateway, services.realtimeNotifier);
const updateStatusUseCase = new UpdateOrderStatusUseCase(services.orderRepo, services.realtimeNotifier);
const assignStaffUseCase = new AssignStaffUseCase(services.orderRepo, services.realtimeNotifier);
const processCashUseCase = new ProcessCashPaymentUseCase(services.orderRepo, services.realtimeNotifier);
const manageStockUseCase = new ManageStockUseCase(services.menuRepo);
const kpiUseCase = new GenerateKpiReportUseCase(services.orderRepo);

// 2. Application State
let currentUser: User = {
  id: 'usr_cust_1',
  name: 'María López',
  email: 'maria@cliente.com',
  role: UserRole.CUSTOMER,
  active: true
};

let menuCatalog: MenuItem[] = [];
let allOrders: Order[] = [];
let allUsers: User[] = [];

// Cart State (Customer View)
interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}
let currentCart: CartItem[] = [];
let currentCategoryFilter = 'ALL';
let currentTipPercent = 0.10;
let currentPaymentMethod: PaymentMethod = PaymentMethod.STRIPE_CARD;
let cutleryCount = 2;

// DOM Elements
const toastContainer = document.getElementById('toast-container')!;
const menuCardsContainer = document.getElementById('menu-cards-container')!;
const cartItemsContainer = document.getElementById('cart-items-container')!;
const waiterOrdersContainer = document.getElementById('waiter-orders-container')!;
const chefOrdersContainer = document.getElementById('chef-orders-container')!;

// Helper: Show Toast
function showToast(message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// 3. Navigation & Role Switcher
function setupRoleSwitcher() {
  const roleButtons = document.querySelectorAll('.role-btn');
  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedRole = btn.getAttribute('data-role') as UserRole;
      switchRole(selectedRole);
    });
  });
}

async function switchRole(role: UserRole) {
  // Update currentUser matching role
  const foundUser = allUsers.find(u => u.role === role) || {
    id: `usr_${role.toLowerCase()}`,
    name: role === UserRole.CUSTOMER ? 'María López' : role === UserRole.WAITER ? 'David García' : role === UserRole.CHEF ? 'Chef Antonio Martín' : 'César Orsinys',
    email: `${role.toLowerCase()}@dinedone.com`,
    role: role,
    active: true
  };
  currentUser = foundUser;

  // Header update
  document.getElementById('header-user-name')!.innerText = currentUser.name;
  document.getElementById('header-user-role')!.innerText = `Rol: ${currentUser.role}`;
  document.getElementById('header-avatar')!.innerText = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2);

  // Buttons state
  document.querySelectorAll('.role-btn').forEach(b => {
    if (b.getAttribute('data-role') === role) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  // Views switching
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active-view'));
  const viewMap: Record<UserRole, string> = {
    [UserRole.CUSTOMER]: 'view-customer',
    [UserRole.WAITER]: 'view-waiter',
    [UserRole.CHEF]: 'view-chef',
    [UserRole.MANAGER]: 'view-manager'
  };
  document.getElementById(viewMap[role])?.classList.add('active-view');

  // Trigger role-specific rendering
  if (role === UserRole.CUSTOMER) {
    renderMenu();
  } else if (role === UserRole.WAITER) {
    renderWaiterOrders();
  } else if (role === UserRole.CHEF) {
    renderChefOrders();
  } else if (role === UserRole.MANAGER) {
    renderManagerDashboard();
  }
}

// 4. Customer: Menu & Cart Rendering
function setupCategoryFilters() {
  const pills = document.querySelectorAll('.cat-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategoryFilter = pill.getAttribute('data-cat') || 'ALL';
      renderMenu();
    });
  });
}

function renderMenu() {
  menuCardsContainer.innerHTML = '';
  const filtered = currentCategoryFilter === 'ALL'
    ? menuCatalog
    : menuCatalog.filter(m => m.category === currentCategoryFilter);

  document.getElementById('badge-menu-count')!.innerText = `${filtered.length} Platos en Carta`;

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'menu-card';
    const isOutOfStock = item.stock <= 0;

    card.innerHTML = `
      <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'}" alt="${item.name}" class="menu-img" loading="lazy">
      <div class="menu-body">
        <div class="menu-badge-row">
          <span class="badge-tag ${item.requiresCooking ? 'tag-cooking' : 'tag-direct'}">
            ${item.requiresCooking ? '🔥 Requiere Cocina' : '⚡ Entrega Directa'}
          </span>
          <span class="badge-tag ${isOutOfStock ? 'tag-cooking' : item.stock < 5 ? 'tag-low-stock' : 'tag-stock'}">
            ${isOutOfStock ? 'AGOTADO' : `Stock: ${item.stock}`}
          </span>
        </div>
        <h3 class="menu-title">${item.name}</h3>
        <p class="menu-desc">${item.description}</p>
        <div class="menu-footer">
          <span class="menu-price">${item.price.toFixed(2)} €</span>
          <button class="btn-add" data-id="${item.id}" ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            <span>${isOutOfStock ? 'Sin stock' : '+ Añadir'}</span>
          </button>
        </div>
      </div>
    `;

    card.querySelector('.btn-add')?.addEventListener('click', () => {
      addToCart(item);
    });

    menuCardsContainer.appendChild(card);
  });
}

function addToCart(item: MenuItem) {
  if (item.stock <= 0) {
    showToast(`El plato "${item.name}" está agotado.`, 'warning');
    return;
  }

  const existing = currentCart.find(c => c.menuItem.id === item.id);
  if (existing) {
    if (existing.quantity >= item.stock) {
      showToast(`No puedes añadir más unidades de "${item.name}". Stock máximo alcanzado (${item.stock}).`, 'warning');
      return;
    }
    existing.quantity++;
  } else {
    currentCart.push({ menuItem: item, quantity: 1 });
  }

  showToast(`Añadido "${item.name}" a tu comanda.`, 'success');
  updateCartUI();
}

function updateCartUI() {
  const container = document.getElementById('cart-items-container')!;
  const counterEl = document.getElementById('cart-items-counter')!;

  const totalCount = currentCart.reduce((acc, c) => acc + c.quantity, 0);
  counterEl.innerText = `${totalCount} ${totalCount === 1 ? 'ítem' : 'ítems'}`;

  if (currentCart.length === 0) {
    container.innerHTML = `
      <p style="color:var(--text-dim); text-align:center; padding:30px 0; font-size:0.88rem;">
        Tu bandeja está vacía.<br>¡Añade platos desde el menú!
      </p>
    `;
    updateBillTotals(0);
    return;
  }

  container.innerHTML = '';
  let subtotal = 0;

  currentCart.forEach((item, index) => {
    subtotal += item.menuItem.price * item.quantity;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${item.menuItem.name}</div>
        <div class="cart-item-price">${(item.menuItem.price * item.quantity).toFixed(2)} € (${item.menuItem.price.toFixed(2)} €/ud)</div>
      </div>
      <div class="cart-qty-ctrl">
        <button class="btn-qty btn-minus" data-idx="${index}">-</button>
        <span style="font-size:0.85rem; font-weight:700; width:16px; text-align:center;">${item.quantity}</span>
        <button class="btn-qty btn-plus" data-idx="${index}">+</button>
      </div>
    `;

    row.querySelector('.btn-minus')?.addEventListener('click', () => {
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        currentCart.splice(index, 1);
      }
      updateCartUI();
    });

    row.querySelector('.btn-plus')?.addEventListener('click', () => {
      if (item.quantity >= item.menuItem.stock) {
        showToast(`Stock máximo disponible para este plato: ${item.menuItem.stock}`, 'warning');
        return;
      }
      item.quantity++;
      updateCartUI();
    });

    container.appendChild(row);
  });

  updateBillTotals(subtotal);
}

function updateBillTotals(subtotal: number) {
  const tipAmount = subtotal * currentTipPercent;
  const total = subtotal + tipAmount;

  document.getElementById('bill-subtotal')!.innerText = `${subtotal.toFixed(2)} €`;
  document.getElementById('bill-tip')!.innerText = `${tipAmount.toFixed(2)} € (${(currentTipPercent * 100).toFixed(0)}%)`;
  document.getElementById('bill-total')!.innerText = `${total.toFixed(2)} €`;
}

function setupCartControls() {
  // Cutlery counter
  document.getElementById('btn-cutlery-minus')?.addEventListener('click', () => {
    if (cutleryCount > 0) {
      cutleryCount--;
      document.getElementById('cutlery-count-display')!.innerText = cutleryCount.toString();
    }
  });

  document.getElementById('btn-cutlery-plus')?.addEventListener('click', () => {
    cutleryCount++;
    document.getElementById('cutlery-count-display')!.innerText = cutleryCount.toString();
  });

  // Tip chips
  document.querySelectorAll('.chip-tip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip-tip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentTipPercent = parseFloat(chip.getAttribute('data-tip') || '0');
      const subtotal = currentCart.reduce((acc, c) => acc + (c.menuItem.price * c.quantity), 0);
      updateBillTotals(subtotal);
    });
  });

  // Payment methods
  document.getElementById('btn-pay-stripe')?.addEventListener('click', () => {
    document.getElementById('btn-pay-stripe')!.classList.add('active');
    document.getElementById('btn-pay-cash')!.classList.remove('active');
    currentPaymentMethod = PaymentMethod.STRIPE_CARD;
  });

  document.getElementById('btn-pay-cash')?.addEventListener('click', () => {
    document.getElementById('btn-pay-cash')!.classList.add('active');
    document.getElementById('btn-pay-stripe')!.classList.remove('active');
    currentPaymentMethod = PaymentMethod.CASH;
  });

  // Place Order Submit Button
  document.getElementById('btn-place-order')?.addEventListener('click', handlePlaceOrder);
}

async function handlePlaceOrder() {
  if (currentCart.length === 0) {
    showToast('Por favor añade al menos un plato a la comanda.', 'warning');
    return;
  }

  const tableInput = (document.getElementById('cart-table-input') as HTMLInputElement).value.trim();
  if (!tableInput) {
    showToast('Por favor introduce el número o nombre de mesa.', 'warning');
    return;
  }

  const hasBags = (document.getElementById('pack-bags') as HTMLInputElement).checked;
  const hasPlastic = (document.getElementById('pack-plastic') as HTMLInputElement).checked;

  const orderItems: OrderItem[] = currentCart.map(c => ({
    menuItemId: c.menuItem.id,
    name: c.menuItem.name,
    unitPrice: c.menuItem.price,
    quantity: c.quantity,
    requiresCooking: c.menuItem.requiresCooking,
    notes: c.notes
  }));

  const subtotal = currentCart.reduce((acc, c) => acc + (c.menuItem.price * c.quantity), 0);
  const tipAmount = parseFloat((subtotal * currentTipPercent).toFixed(2));

  try {
    showToast('Procesando pedido y verificando existencias...', 'info');

    const createdOrder = await createOrderUseCase.execute({
      tableNumber: tableInput,
      customerName: currentUser.name,
      items: orderItems,
      packaging: {
        bags: hasBags,
        plasticContainers: hasPlastic,
        cutleryCount: cutleryCount
      },
      paymentMethod: currentPaymentMethod,
      tipAmount: tipAmount,
      stripeToken: 'tok_visa_success'
    });

    const payMsg = createdOrder.paymentMethod === PaymentMethod.STRIPE_CARD
      ? '¡Pago con tarjeta verificado mediante Stripe!'
      : 'Cobro marcado en efectivo. El camarero cobrará en mesa.';

    showToast(`🎉 ¡Comanda ${createdOrder.orderNumber} confirmada con éxito! ${payMsg}`, 'success');

    // Reset Cart
    currentCart = [];
    updateCartUI();

    // Reload menu to show updated stock
    menuCatalog = await services.menuRepo.getAll();
    renderMenu();
    allOrders = await services.orderRepo.findAll();
  } catch (error: any) {
    showToast(`❌ Error al procesar el pedido: ${error.message}`, 'danger');
  }
}

// 5. Camarero: Comandas Board
function renderWaiterOrders() {
  waiterOrdersContainer.innerHTML = '';
  if (allOrders.length === 0) {
    waiterOrdersContainer.innerHTML = `<p style="color:var(--text-muted); padding:30px;">No hay comandas registradas en sala.</p>`;
    return;
  }

  allOrders.forEach(order => {
    const card = document.createElement('div');
    const statusClass = order.status === OrderStatus.PLACED ? 'status-placed'
      : order.status === OrderStatus.IN_KITCHEN ? 'status-in-kitchen'
      : order.status === OrderStatus.READY_TO_SERVE ? 'status-ready'
      : 'status-delivered';

    card.className = `order-card ${statusClass}`;

    const isPaid = order.paymentStatus === PaymentStatus.PAID;
    const isPendingCash = order.paymentStatus === PaymentStatus.PENDING_CASH;

    card.innerHTML = `
      <div class="order-header">
        <div>
          <div class="order-num">${order.orderNumber}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${order.customerName}</div>
        </div>
        <span class="order-table-badge">${order.tableNumber}</span>
      </div>

      <div class="order-items-box">
        ${order.items.map(i => `
          <div class="order-item-row">
            <span><strong>${i.quantity}x</strong> ${i.name}</span>
            <span style="color:var(--text-muted); font-size:0.8rem;">${(i.unitPrice * i.quantity).toFixed(2)} €</span>
          </div>
          ${i.notes ? `<div class="order-item-notes">Nota: ${i.notes}</div>` : ''}
        `).join('')}
      </div>

      <!-- Feature 1: Packaging tags -->
      <div class="order-pack-tags">
        ${order.packaging.bags ? '<span class="pack-tag-pill">🛍️ Con bolsa</span>' : ''}
        ${order.packaging.plasticContainers ? '<span class="pack-tag-pill">♻️ Envases</span>' : ''}
        <span class="pack-tag-pill">🍴 ${order.packaging.cutleryCount} cubiertos</span>
      </div>

      <!-- Feature 8: Staff assignment -->
      <div class="order-staff-row">
        <div>🏃 Camarero: <strong>${order.waiterName || 'Sin asignar'}</strong></div>
        <div>👨‍🍳 Cocinero: <strong>${order.chefName || 'Sin asignar'}</strong></div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:0.82rem;">
        <div>Estado: <strong style="color:var(--accent-orange);">${order.status}</strong></div>
        <div>Pago: <strong style="color:${isPaid ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">${order.paymentStatus}</strong></div>
      </div>

      <div class="order-actions-bar">
        ${!order.waiterId ? `
          <button class="btn-action btn-waiter-deliver btn-assign-waiter" data-id="${order.id}">
            🏃 Atender comanda
          </button>
        ` : ''}

        ${order.status === OrderStatus.READY_TO_SERVE ? `
          <button class="btn-action btn-kitchen-ready btn-mark-delivered" data-id="${order.id}">
            🍽️ Entregar a mesa
          </button>
        ` : ''}

        ${isPendingCash ? `
          <button class="btn-action btn-waiter-cash btn-confirm-cash" data-id="${order.id}">
            💵 Cobrar ${order.total.toFixed(2)} € en efectivo
          </button>
        ` : ''}
      </div>
    `;

    card.querySelector('.btn-assign-waiter')?.addEventListener('click', async () => {
      await assignStaffUseCase.execute({
        orderId: order.id,
        waiterId: currentUser.id,
        waiterName: currentUser.name
      });
      showToast(`Te has asignado como camarero de la ${order.tableNumber}.`, 'success');
      refreshAll();
    });

    card.querySelector('.btn-mark-delivered')?.addEventListener('click', async () => {
      await updateStatusUseCase.execute(order.id, OrderStatus.DELIVERED);
      showToast(`Comanda ${order.orderNumber} entregada a la ${order.tableNumber}.`, 'success');
      refreshAll();
    });

    card.querySelector('.btn-confirm-cash')?.addEventListener('click', async () => {
      await processCashUseCase.execute(order.id);
      showToast(`Cobro en efectivo confirmado para comanda ${order.orderNumber}.`, 'success');
      refreshAll();
    });

    waiterOrdersContainer.appendChild(card);
  });
}

// 6. Cocina: Kitchen Display System (KDS - Feature 4)
function renderChefOrders() {
  chefOrdersContainer.innerHTML = '';

  // Filter orders that have cooking items and are not finished
  const kitchenOrders = allOrders.filter(o => 
    o.status !== OrderStatus.DELIVERED && 
    o.status !== OrderStatus.CANCELLED &&
    o.items.some(i => i.requiresCooking)
  );

  document.getElementById('kds-pending-badge')!.innerText = `${kitchenOrders.length} Comandas en Cocina`;

  if (kitchenOrders.length === 0) {
    chefOrdersContainer.innerHTML = `<p style="color:var(--text-muted); padding:30px;">👨‍🍳 No hay pedidos pendientes de cocción en este momento. ¡Todo servido!</p>`;
    return;
  }

  kitchenOrders.forEach(order => {
    const card = document.createElement('div');
    const isUnderCooking = order.status === OrderStatus.IN_KITCHEN;
    card.className = `order-card ${isUnderCooking ? 'status-in-kitchen' : 'status-placed'}`;

    const cookingItems = order.items.filter(i => i.requiresCooking);

    card.innerHTML = `
      <div class="order-header">
        <div>
          <div class="order-num" style="color:#ef4444;">${order.orderNumber}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${order.tableNumber} • Creado hace instantes</div>
        </div>
        <span class="badge-tag tag-cooking">${order.status}</span>
      </div>

      <div class="order-items-box">
        <h4 style="font-size:0.82rem; color:var(--accent-amber); margin-bottom:4px;">REQUERIMIENTOS DE COCINA:</h4>
        ${cookingItems.map(i => `
          <div class="order-item-row" style="padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
            <span><strong style="color:#fff; font-size:1.05rem;">${i.quantity}x</strong> ${i.name}</span>
          </div>
          ${i.notes ? `<div class="order-item-notes">Nota de preparación: ${i.notes}</div>` : ''}
        `).join('')}
      </div>

      <!-- Feature 8: Staff assignment -->
      <div class="order-staff-row">
        <div>👨‍🍳 Cocinero asignado: <strong>${order.chefName || 'Sin asignar'}</strong></div>
      </div>

      <div class="order-actions-bar">
        ${!order.chefId ? `
          <button class="btn-action btn-kitchen-start btn-assign-chef" data-id="${order.id}">
            👨‍🍳 Asignarme
          </button>
        ` : ''}

        ${order.status === OrderStatus.PLACED ? `
          <button class="btn-action btn-kitchen-start btn-start-cook" data-id="${order.id}">
            🔥 Empezar a Cocinar
          </button>
        ` : ''}

        ${order.status === OrderStatus.IN_KITCHEN ? `
          <button class="btn-action btn-kitchen-ready btn-ready-cook" data-id="${order.id}">
            ✅ ¡Plato Listo para Servir!
          </button>
        ` : ''}
      </div>
    `;

    card.querySelector('.btn-assign-chef')?.addEventListener('click', async () => {
      await assignStaffUseCase.execute({
        orderId: order.id,
        chefId: currentUser.id,
        chefName: currentUser.name
      });
      showToast(`Te has asignado como cocinero de la orden ${order.orderNumber}.`, 'success');
      refreshAll();
    });

    card.querySelector('.btn-start-cook')?.addEventListener('click', async () => {
      await updateStatusUseCase.execute(order.id, OrderStatus.IN_KITCHEN);
      showToast(`Comanda ${order.orderNumber} en cocción.`, 'info');
      refreshAll();
    });

    card.querySelector('.btn-ready-cook')?.addEventListener('click', async () => {
      await updateStatusUseCase.execute(order.id, OrderStatus.READY_TO_SERVE);
      showToast(`Comanda ${order.orderNumber} marcada como lista. Notificando a sala.`, 'success');
      refreshAll();
    });

    chefOrdersContainer.appendChild(card);
  });
}

// 7. Gerente: KPIs & Tablas (Features 5, 6, 7)
async function renderManagerDashboard() {
  const report = await kpiUseCase.execute();

  document.getElementById('kpi-revenue')!.innerText = `${report.totalRevenue.toFixed(2)} €`;
  document.getElementById('kpi-tips')!.innerText = `${report.totalTips.toFixed(2)} €`;
  document.getElementById('kpi-avg-ticket')!.innerText = `${report.averageTicket.toFixed(2)} €`;
  document.getElementById('kpi-orders-count')!.innerText = report.totalOrders.toString();
  document.getElementById('kpi-orders-sub')!.innerText = `${report.inKitchenOrdersCount} en cocina / ${report.deliveredOrdersCount} servidas`;

  // Top Items Table
  const topTbody = document.getElementById('top-items-tbody')!;
  topTbody.innerHTML = '';
  report.topRequestedItems.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.name}</strong></td>
      <td>${item.count} pedidos</td>
      <td style="color:var(--accent-emerald); font-weight:700;">${item.revenue.toFixed(2)} €</td>
    `;
    topTbody.appendChild(tr);
  });

  // Feature 6: Live Stock Table
  const stockTbody = document.getElementById('stock-tbody')!;
  stockTbody.innerHTML = '';
  menuCatalog.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name}</td>
      <td><span class="badge-tag tag-direct">${item.category}</span></td>
      <td>
        <input type="number" class="stock-input" id="stock-input-${item.id}" value="${item.stock}" min="0">
      </td>
      <td>
        <button class="btn-action btn-waiter-deliver btn-save-stock" data-id="${item.id}" style="padding:4px 8px; font-size:0.75rem;">
          💾 Guardar
        </button>
      </td>
    `;

    tr.querySelector('.btn-save-stock')?.addEventListener('click', async () => {
      const inputEl = document.getElementById(`stock-input-${item.id}`) as HTMLInputElement;
      const newStock = parseInt(inputEl.value, 10);
      if (isNaN(newStock) || newStock < 0) {
        showToast('El stock debe ser un número entero mayor o igual a cero.', 'warning');
        return;
      }
      await manageStockUseCase.execute(item.id, newStock);
      showToast(`Stock de "${item.name}" actualizado a ${newStock}.`, 'success');
      menuCatalog = await services.menuRepo.getAll();
      renderManagerDashboard();
    });

    stockTbody.appendChild(tr);
  });

  // Feature 7: User Management Table
  const userTbody = document.getElementById('users-tbody')!;
  userTbody.innerHTML = '';
  allUsers.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-family:'JetBrains Mono'; font-size:0.78rem;">${u.id}</td>
      <td><strong>${u.name}</strong></td>
      <td style="color:var(--text-muted);">${u.email}</td>
      <td><span class="badge-tag tag-direct">${u.role}</span></td>
      <td>
        <span class="badge-tag ${u.active ? 'tag-stock' : 'tag-cooking'}">
          ${u.active ? 'ACTIVO' : 'INACTIVO'}
        </span>
      </td>
    `;
    userTbody.appendChild(tr);
  });
}

// 8. Realtime Subscriptions & Refresh
async function refreshAll() {
  menuCatalog = await services.menuRepo.getAll();
  allOrders = await services.orderRepo.findAll();
  allUsers = await services.userRepo.getAll();

  if (currentUser.role === UserRole.CUSTOMER) {
    renderMenu();
  } else if (currentUser.role === UserRole.WAITER) {
    renderWaiterOrders();
  } else if (currentUser.role === UserRole.CHEF) {
    renderChefOrders();
  } else if (currentUser.role === UserRole.MANAGER) {
    renderManagerDashboard();
  }
}

// Setup Export Report (Feature 5)
function setupExportReport() {
  document.getElementById('btn-export-report')?.addEventListener('click', async () => {
    const report = await kpiUseCase.execute();
    const exportData = {
      restaurant: 'Dine & Done Madrid',
      exportDate: new Date().toISOString(),
      report: report,
      ordersSnapshot: allOrders
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DineAndDone_InformeGerencial_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Informe gerencial descargado con éxito.', 'success');
  });

  document.getElementById('btn-refresh-waiter')?.addEventListener('click', () => {
    refreshAll();
    showToast('Comandas de sala sincronizadas.', 'info');
  });
}

// Subscribe to real-time events across the app
services.realtimeNotifier.subscribe((updatedOrder) => {
  const idx = allOrders.findIndex(o => o.id === updatedOrder.id);
  if (idx >= 0) {
    allOrders[idx] = updatedOrder;
  } else {
    allOrders.unshift(updatedOrder);
  }

  // Update visible view
  if (currentUser.role === UserRole.WAITER) renderWaiterOrders();
  if (currentUser.role === UserRole.CHEF) renderChefOrders();
  if (currentUser.role === UserRole.MANAGER) renderManagerDashboard();
});

// Boot Application
async function initApp() {
  menuCatalog = await services.menuRepo.getAll();
  allOrders = await services.orderRepo.findAll();
  allUsers = await services.userRepo.getAll();

  setupRoleSwitcher();
  setupCategoryFilters();
  setupCartControls();
  setupExportReport();

  renderMenu();
  updateCartUI();
}

initApp();
