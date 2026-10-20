import restaurantConfig from '../mock_data/restaurant_config.json' with { type: 'json' };
import translationsData from '../mock_data/translations.json' with { type: 'json' };
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

// Types for i18n
type Language = 'es' | 'en' | 'fr' | 'de';
let currentLanguage: Language = 'es';
const translations: Record<Language, any> = translationsData as Record<Language, any>;

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

// Cart & Table State (Customer View)
let currentAssignedTable = 'Mesa 4';

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

// Features 2 & 3: Dietary & Allergen Filter State
let isFilterVegan = false;
let isFilterVegetarian = false;
let isFilterNoAlcohol = false;
let selectedAllergenToExclude = 'ALL';

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

// 3. Feature 9 & 5: Branding desacoplado (Header exclusivo de restaurante, Dine & Done en Footer)
function applyBusinessBranding() {
  document.title = `${restaurantConfig.businessName} | ${restaurantConfig.tagline}`;
  
  const titleEl = document.getElementById('brand-header-title');
  if (titleEl) {
    const parts = restaurantConfig.businessName.split(' ');
    if (parts.length > 1) {
      const last = parts.pop();
      titleEl.innerHTML = `${parts.join(' ')} <span>${last}</span>`;
    } else {
      titleEl.innerHTML = `<span>${restaurantConfig.businessName}</span>`;
    }
  }

  const tagEl = document.getElementById('brand-header-tagline');
  if (tagEl) {
    tagEl.innerText = `${restaurantConfig.tagline} • ${restaurantConfig.address}`;
  }

  // Footer branding
  const footerNameEl = document.getElementById('footer-restaurant-name');
  if (footerNameEl) footerNameEl.innerText = restaurantConfig.businessName;

  const footerDescEl = document.getElementById('footer-restaurant-desc');
  if (footerDescEl) footerDescEl.innerText = `${restaurantConfig.tagline} • ${restaurantConfig.address}`;
}

// 4. Feature 6: Selector de Idioma Multilingüe (i18n)
function setupLanguageSelector() {
  const langSelector = document.getElementById('lang-selector') as HTMLSelectElement;
  if (langSelector) {
    langSelector.value = currentLanguage;
    langSelector.addEventListener('change', () => {
      setLanguage(langSelector.value as Language);
    });
  }
}

function setLanguage(lang: Language) {
  currentLanguage = lang;
  const t = translations[lang] || translations['es'];

  // Static UI Elements dictionary update
  const elMap: Record<string, string> = {
    'txt-menu-title': t.menuTitle,
    'txt-menu-sub': t.menuSubtitle,
    'pill-cat-all': t.allDishes,
    'pill-cat-starter': t.starters,
    'pill-cat-main': t.mains,
    'pill-cat-dessert': t.desserts,
    'pill-cat-beverage': t.beverages,
    'txt-table-title': t.tableIdentification,
    'txt-cart-title': t.yourOrder,
    'txt-cart-empty': t.emptyCart,
    'txt-cart-table-label': t.tableAssigned,
    'txt-pack-title': t.servicePackaging,
    'txt-pack-law': `⚖️ ${t.packagingLawNote}`,
    'txt-pack-bags': t.bagOption,
    'txt-pack-plastic': t.plasticOption,
    'txt-tip-label': t.tipSection,
    'txt-pay-label': t.paymentMethod,
    'txt-bill-subtotal-label': t.subtotalDishes,
    'txt-bill-pack-label': t.packagingTotal,
    'txt-bill-tip-label': t.tipAmount,
    'txt-bill-total-label': t.totalToPay,
    'txt-btn-place-order': t.confirmOrder,
    'txt-modal-title': t.loginModalTitle,
    'txt-modal-desc': t.loginModalDesc,
    'footer-legal-notice': t.footerNotice,
    'footer-rights': t.footerRights,
    'footer-link-terms': t.terms,
    'footer-link-privacy': t.privacy,
    'footer-link-cookies': t.cookies,
    'footer-link-legal': t.legalNotice
  };

  for (const [id, val] of Object.entries(elMap)) {
    const el = document.getElementById(id);
    if (el && val) el.innerHTML = val;
  }

  const btnVegan = document.getElementById('btn-filter-vegan');
  if (btnVegan) btnVegan.innerHTML = `<span>${t.filterVegan}</span>`;

  const btnVeg = document.getElementById('btn-filter-vegetarian');
  if (btnVeg) btnVeg.innerHTML = `<span>${t.filterVegetarian}</span>`;

  const btnNoAlc = document.getElementById('btn-filter-noalcohol');
  if (btnNoAlc) btnNoAlc.innerHTML = `<span>${t.filterNoAlcohol}</span>`;

  const cutleryLabel = document.getElementById('txt-pack-cutlery');
  if (cutleryLabel) cutleryLabel.innerText = `${t.cutleryOption}:`;

  const btnStaffLogin = document.getElementById('btn-staff-login');
  if (btnStaffLogin) btnStaffLogin.innerHTML = `<span>${t.staffLogin}</span>`;

  const btnStaffLogout = document.getElementById('btn-staff-logout');
  if (btnStaffLogout) btnStaffLogout.innerHTML = `<span>${t.staffLogout}</span>`;

  // Re-render menu cards and cart with translated values
  renderMenu();
  updateCartUI();
}

// 5. Feature 1: Login de Personal (Modal arriba derecha; comensal por defecto)
function setupStaffAuth() {
  const modal = document.getElementById('staff-login-modal')!;
  const btnLogin = document.getElementById('btn-staff-login')!;
  const btnLogout = document.getElementById('btn-staff-logout')!;
  const btnClose = document.getElementById('btn-close-modal')!;
  const staffSwitcher = document.getElementById('staff-role-switcher')!;

  btnLogin?.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  btnClose?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  const staffCards = document.querySelectorAll('.staff-select-card');
  staffCards.forEach(card => {
    card.addEventListener('click', () => {
      const role = card.getAttribute('data-staff-role') as UserRole;
      const staffName = card.getAttribute('data-staff-name') || 'Empleado';

      modal.style.display = 'none';
      staffSwitcher.style.display = 'flex';
      btnLogin.style.display = 'none';
      btnLogout.style.display = 'flex';

      switchRole(role);
      showToast(`¡Bienvenido, ${staffName}! Panel de ${role} activado.`, 'success');
    });
  });

  btnLogout?.addEventListener('click', () => {
    staffSwitcher.style.display = 'none';
    btnLogout.style.display = 'none';
    btnLogin.style.display = 'flex';

    currentUser = allUsers.find(u => u.role === UserRole.CUSTOMER) || {
      id: 'usr_cust_1',
      name: 'María López',
      email: 'maria@cliente.com',
      role: UserRole.CUSTOMER,
      active: true
    };

    switchRole(UserRole.CUSTOMER);
    showToast('Sesión de empleado cerrada. Has vuelto al modo comensal.', 'info');
  });
}

// 6. Navigation & Role Switcher
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

  // Header update (if user info display exists)
  const uNameEl = document.getElementById('header-user-name');
  if (uNameEl) uNameEl.innerText = currentUser.name;
  const uRoleEl = document.getElementById('header-user-role');
  if (uRoleEl) uRoleEl.innerText = `Rol: ${currentUser.role}`;

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

// 7. Feature 11: Intelligent Table Identification (URL Detection + Manual Edit)
function setupTableIdentification() {
  const urlParams = new URLSearchParams(window.location.search);
  const fromParam = urlParams.get('table') || urlParams.get('mesa') || urlParams.get('m');
  const badgeEl = document.getElementById('table-detection-badge')!;

  if (fromParam) {
    currentAssignedTable = fromParam.startsWith('Mesa') ? fromParam : `Mesa ${fromParam}`;
    localStorage.setItem('DND_SELECTED_TABLE', currentAssignedTable);
    badgeEl.innerText = 'Detectada por URL';
    badgeEl.className = 'badge-tag tag-stock';
  } else {
    const stored = localStorage.getItem('DND_SELECTED_TABLE');
    if (stored) {
      currentAssignedTable = stored;
      badgeEl.innerText = 'Mesa Recordada';
      badgeEl.className = 'badge-tag tag-direct';
    } else {
      badgeEl.innerText = 'Mesa por Defecto';
      badgeEl.className = 'badge-tag tag-stock';
    }
  }

  updateTableUI();

  // Manual edit toggle
  const editBtn = document.getElementById('btn-toggle-edit-table')!;
  const quickInput = document.getElementById('quick-table-input') as HTMLInputElement;

  editBtn.addEventListener('click', () => {
    if (quickInput.style.display === 'none') {
      quickInput.style.display = 'inline-block';
      quickInput.value = currentAssignedTable;
      quickInput.focus();
      editBtn.innerText = '💾 Guardar';
      editBtn.style.background = 'var(--accent-orange)';
    } else {
      saveManualTable();
    }
  });

  quickInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      saveManualTable();
    }
  });

  function saveManualTable() {
    const val = quickInput.value.trim();
    if (val) {
      currentAssignedTable = val.startsWith('Mesa') ? val : `Mesa ${val}`;
      localStorage.setItem('DND_SELECTED_TABLE', currentAssignedTable);
      badgeEl.innerText = 'Configurada Manualmente';
      badgeEl.className = 'badge-tag tag-cooking';
      showToast(`Mesa actualizada a "${currentAssignedTable}".`, 'success');
    }
    quickInput.style.display = 'none';
    editBtn.innerText = '✏️ Cambiar Mesa';
    editBtn.style.background = 'rgba(255,255,255,0.08)';
    updateTableUI();
  }
}

function updateTableUI() {
  const displayEl = document.getElementById('current-table-display');
  if (displayEl) displayEl.innerText = currentAssignedTable;

  const cartTableInput = document.getElementById('cart-table-input') as HTMLInputElement;
  if (cartTableInput) cartTableInput.value = currentAssignedTable;
}

// 8. Features 2 & 3: Filtros de Categorías, Dietas (Vegano, Vegetariano, 0 Alcohol) y Alérgenos
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

function setupDietaryAndAllergenFilters() {
  const btnVegan = document.getElementById('btn-filter-vegan');
  btnVegan?.addEventListener('click', () => {
    isFilterVegan = !isFilterVegan;
    btnVegan.classList.toggle('active-vegan', isFilterVegan);
    renderMenu();
  });

  const btnVeg = document.getElementById('btn-filter-vegetarian');
  btnVeg?.addEventListener('click', () => {
    isFilterVegetarian = !isFilterVegetarian;
    btnVeg.classList.toggle('active-veg', isFilterVegetarian);
    renderMenu();
  });

  const btnNoAlc = document.getElementById('btn-filter-noalcohol');
  btnNoAlc?.addEventListener('click', () => {
    isFilterNoAlcohol = !isFilterNoAlcohol;
    btnNoAlc.classList.toggle('active-noalc', isFilterNoAlcohol);
    renderMenu();
  });

  const allergenSelect = document.getElementById('allergen-filter-select') as HTMLSelectElement;
  allergenSelect?.addEventListener('change', () => {
    selectedAllergenToExclude = allergenSelect.value;
    renderMenu();
  });
}

function renderMenu() {
  menuCardsContainer.innerHTML = '';
  
  let filtered = currentCategoryFilter === 'ALL'
    ? menuCatalog
    : menuCatalog.filter(m => m.category === currentCategoryFilter);

  // Apply Dietary Filters (Feature 3)
  if (isFilterVegan) {
    filtered = filtered.filter(m => m.isVegan === true);
  }
  if (isFilterVegetarian) {
    filtered = filtered.filter(m => m.isVegetarian === true || m.isVegan === true);
  }
  if (isFilterNoAlcohol) {
    filtered = filtered.filter(m => m.isAlcoholFree === true);
  }

  // Apply Allergen Exclusion Filter (Feature 2)
  if (selectedAllergenToExclude !== 'ALL') {
    const allergenExclusionMap: Record<string, string[]> = {
      'Sin Gluten': ['gluten'],
      'Sin Lácteos': ['lácteo', 'lacteo', 'dairy', 'lactose'],
      'Sin Huevos': ['huevo', 'egg', 'oeuf'],
      'Sin Pescado': ['pescado', 'fish', 'poisson'],
      'Sin Frutos de cáscara': ['fruto', 'cáscara', 'nut', 'noix'],
      'Sin Sulfitos': ['sulfito', 'sulphite']
    };

    const targetKeywords = allergenExclusionMap[selectedAllergenToExclude] || [];
    if (targetKeywords.length > 0) {
      filtered = filtered.filter(m => {
        if (!m.allergens || m.allergens.length === 0) return true;
        const hasExclusion = m.allergens.some(a => 
          targetKeywords.some(kw => a.toLowerCase().includes(kw))
        );
        return !hasExclusion;
      });
    }
  }

  const t = translations[currentLanguage] || translations['es'];
  const countBadge = document.getElementById('badge-menu-count');
  if (countBadge) countBadge.innerText = `${filtered.length} ${t.allDishes || 'Platos'}`;

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'menu-card';
    const isOutOfStock = item.stock <= 0;

    // Multi-language translation lookup (Feature 6)
    const trans = (item.translations as any)?.[currentLanguage];
    const displayName = trans?.name || item.name;
    const displayDesc = trans?.description || item.description;
    const displayIngredients = trans?.ingredients || item.ingredients || [];
    const displayAllergens = trans?.allergens || item.allergens || [];

    const ingLabel = currentLanguage === 'en' ? 'Ingredients' : currentLanguage === 'fr' ? 'Ingrédients' : currentLanguage === 'de' ? 'Zutaten' : 'Ingredientes';
    const ingredientsHtml = displayIngredients.length > 0 ? `
      <div style="font-size:0.77rem; color:var(--text-muted); margin-bottom:8px; line-height:1.4;">
        🌿 <strong>${ingLabel}:</strong> ${displayIngredients.join(', ')}
      </div>
    ` : '';

    const noAllergenLabel = currentLanguage === 'en' ? 'Allergen Free' : currentLanguage === 'fr' ? 'Sans allergènes' : currentLanguage === 'de' ? 'Allergenfrei' : 'Libre de alérgenos';
    const allergensHtml = displayAllergens.length > 0 ? `
      <div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:12px;">
        ${displayAllergens.map((a: string) => `<span class="badge-tag" style="background:rgba(236,72,153,0.15); color:#f472b6; border:1px solid rgba(236,72,153,0.3); font-size:0.67rem;">⚠️ ${a}</span>`).join('')}
      </div>
    ` : `
      <div style="margin-bottom:12px;">
        <span class="badge-tag" style="background:rgba(16,185,129,0.1); color:#34d399; font-size:0.67rem;">✅ ${noAllergenLabel}</span>
      </div>
    `;

    const cookingLabel = item.requiresCooking ? t.requiresCooking : t.directDelivery;
    const stockLabel = isOutOfStock ? t.outOfStock : `${t.stock}: ${item.stock}`;
    const addBtnText = isOutOfStock ? t.outOfStock : t.addToCart;

    card.innerHTML = `
      <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'}" alt="${displayName}" class="menu-img" loading="lazy">
      <div class="menu-body">
        <div class="menu-badge-row">
          <span class="badge-tag ${item.requiresCooking ? 'tag-cooking' : 'tag-direct'}">
            ${cookingLabel}
          </span>
          <span class="badge-tag ${isOutOfStock ? 'tag-cooking' : item.stock < 5 ? 'tag-low-stock' : 'tag-stock'}">
            ${stockLabel}
          </span>
        </div>
        <h3 class="menu-title">${displayName}</h3>
        <p class="menu-desc">${displayDesc}</p>
        
        <!-- Ingredients and Allergens -->
        ${ingredientsHtml}
        ${allergensHtml}

        <div class="menu-footer">
          <span class="menu-price">${item.price.toFixed(2)} €</span>
          <button class="btn-add" data-id="${item.id}" ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            <span>${addBtnText}</span>
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
  const t = translations[currentLanguage] || translations['es'];
  counterEl.innerText = `${totalCount} ${totalCount === 1 ? 'ítem' : 'ítems'}`;

  if (currentCart.length === 0) {
    container.innerHTML = `
      <p style="color:var(--text-dim); text-align:center; padding:30px 0; font-size:0.88rem;">
        ${t.emptyCart || 'Tu bandeja está vacía.'}
      </p>
    `;
    updateBillTotals(0);
    return;
  }

  container.innerHTML = '';
  let subtotal = 0;

  currentCart.forEach((item, index) => {
    subtotal += item.menuItem.price * item.quantity;
    const trans = (item.menuItem.translations as any)?.[currentLanguage];
    const displayName = trans?.name || item.menuItem.name;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${displayName}</div>
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

// 9. Feature 4: Normativa Española de Empaques y Bolsas (R.D. 293/2018 y Ley 7/2022)
function calculatePackagingCost(): number {
  const hasBags = (document.getElementById('pack-bags') as HTMLInputElement)?.checked ?? false;
  const hasPlastic = (document.getElementById('pack-plastic') as HTMLInputElement)?.checked ?? false;
  let packCost = 0;
  if (hasBags) packCost += 0.10; // R.D. 293/2018 sobre bolsas de plástico
  if (hasPlastic) packCost += 0.15; // Ley 7/2022 de envases de un solo uso
  packCost += cutleryCount * 0.10; // Cubiertos ecológicos biodegradables
  return parseFloat(packCost.toFixed(2));
}

function updateBillTotals(subtotal: number) {
  const packagingAmount = calculatePackagingCost();
  const tipAmount = parseFloat((subtotal * currentTipPercent).toFixed(2));
  const total = parseFloat((subtotal + packagingAmount + tipAmount).toFixed(2));

  const subtotalEl = document.getElementById('bill-subtotal');
  if (subtotalEl) subtotalEl.innerText = `${subtotal.toFixed(2)} €`;

  const packEl = document.getElementById('bill-packaging');
  if (packEl) packEl.innerText = `${packagingAmount.toFixed(2)} €`;

  const tipEl = document.getElementById('bill-tip');
  if (tipEl) tipEl.innerText = `${tipAmount.toFixed(2)} € (${(currentTipPercent * 100).toFixed(0)}%)`;

  const totalEl = document.getElementById('bill-total');
  if (totalEl) totalEl.innerText = `${total.toFixed(2)} €`;
}

function setupCartControls() {
  // Packaging checkboxes change listeners (Feature 4 live calculation)
  const packBags = document.getElementById('pack-bags');
  packBags?.addEventListener('change', () => {
    const subtotal = currentCart.reduce((acc, c) => acc + (c.menuItem.price * c.quantity), 0);
    updateBillTotals(subtotal);
  });

  const packPlastic = document.getElementById('pack-plastic');
  packPlastic?.addEventListener('change', () => {
    const subtotal = currentCart.reduce((acc, c) => acc + (c.menuItem.price * c.quantity), 0);
    updateBillTotals(subtotal);
  });

  // Cutlery counter
  document.getElementById('btn-cutlery-minus')?.addEventListener('click', () => {
    if (cutleryCount > 0) {
      cutleryCount--;
      document.getElementById('cutlery-count-display')!.innerText = cutleryCount.toString();
      const subtotal = currentCart.reduce((acc, c) => acc + (c.menuItem.price * c.quantity), 0);
      updateBillTotals(subtotal);
    }
  });

  document.getElementById('btn-cutlery-plus')?.addEventListener('click', () => {
    cutleryCount++;
    document.getElementById('cutlery-count-display')!.innerText = cutleryCount.toString();
    const subtotal = currentCart.reduce((acc, c) => acc + (c.menuItem.price * c.quantity), 0);
    updateBillTotals(subtotal);
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

  const tableInput = (document.getElementById('cart-table-input') as HTMLInputElement).value.trim() || currentAssignedTable;
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

    const packNotice = createdOrder.packagingCost ? ` (Empaque Ley 7/2022: +${createdOrder.packagingCost.toFixed(2)} €)` : '';
    showToast(`🎉 ¡Comanda ${createdOrder.orderNumber} confirmada para la ${createdOrder.tableNumber}!${packNotice} ${payMsg}`, 'success');

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

// 10. Camarero: Comandas Board
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

      <!-- Feature 4: Packaging breakdown tags under Spanish Law -->
      <div class="order-pack-tags">
        ${order.packaging.bags ? '<span class="pack-tag-pill">🛍️ Bolsa (R.D. 293/2018)</span>' : ''}
        ${order.packaging.plasticContainers ? '<span class="pack-tag-pill">♻️ Envases (Ley 7/2022)</span>' : ''}
        <span class="pack-tag-pill">🍴 ${order.packaging.cutleryCount} cubiertos eco</span>
        ${order.packagingCost ? `<span class="pack-tag-pill" style="color:var(--accent-orange);">+${order.packagingCost.toFixed(2)} €</span>` : ''}
      </div>

      <!-- Staff assignment -->
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

// 11. Cocina: Kitchen Display System (KDS)
function renderChefOrders() {
  chefOrdersContainer.innerHTML = '';

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

      <!-- Staff assignment -->
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

// 12. Gerente: KPIs, Precios y Stock
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

  // Live Stock & Price Editor
  const stockTbody = document.getElementById('stock-tbody')!;
  stockTbody.innerHTML = '';
  menuCatalog.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${item.name}</strong>
        ${item.allergens && item.allergens.length > 0 ? `<div style="font-size:0.7rem; color:#f472b6;">Alérgenos: ${item.allergens.join(', ')}</div>` : ''}
      </td>
      <td><span class="badge-tag tag-direct">${item.category}</span></td>
      <td>
        <input type="number" step="0.5" class="stock-input" id="price-input-${item.id}" value="${item.price.toFixed(2)}" min="0" style="width:75px;">
      </td>
      <td>
        <input type="number" class="stock-input" id="stock-input-${item.id}" value="${item.stock}" min="0">
      </td>
      <td>
        <button class="btn-action btn-waiter-deliver btn-save-item" data-id="${item.id}" style="padding:5px 10px; font-size:0.75rem;">
          💾 Guardar
        </button>
      </td>
    `;

    tr.querySelector('.btn-save-item')?.addEventListener('click', async () => {
      const stockInput = document.getElementById(`stock-input-${item.id}`) as HTMLInputElement;
      const priceInput = document.getElementById(`price-input-${item.id}`) as HTMLInputElement;

      const newStock = parseInt(stockInput.value, 10);
      const newPrice = parseFloat(priceInput.value);

      if (isNaN(newStock) || newStock < 0) {
        showToast('El stock debe ser un número entero mayor o igual a cero.', 'warning');
        return;
      }
      if (isNaN(newPrice) || newPrice < 0) {
        showToast('El precio debe ser un número mayor o igual a cero.', 'warning');
        return;
      }

      const updated = await services.menuRepo.updateItem({
        ...item,
        price: newPrice,
        stock: newStock
      });

      showToast(`Plato "${updated.name}" actualizado: ${newPrice.toFixed(2)} € | Stock: ${newStock}.`, 'success');
      menuCatalog = await services.menuRepo.getAll();
      renderManagerDashboard();
    });

    stockTbody.appendChild(tr);
  });

  // User Management Table
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

// 13. Realtime Subscriptions & Refresh
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

// Setup Export Report
function setupExportReport() {
  document.getElementById('btn-export-report')?.addEventListener('click', async () => {
    const report = await kpiUseCase.execute();
    const exportData = {
      restaurant: restaurantConfig.businessName,
      tagline: restaurantConfig.tagline,
      address: restaurantConfig.address,
      exportDate: new Date().toISOString(),
      report: report,
      menuSnapshot: menuCatalog,
      ordersSnapshot: allOrders
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${restaurantConfig.businessName.replace(/\s+/g, '_')}_InformeGerencial_${new Date().toISOString().substring(0, 10)}.json`;
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
  applyBusinessBranding();
  setupTableIdentification();

  menuCatalog = await services.menuRepo.getAll();
  allOrders = await services.orderRepo.findAll();
  allUsers = await services.userRepo.getAll();

  setupRoleSwitcher();
  setupStaffAuth();
  setupLanguageSelector();
  setupCategoryFilters();
  setupDietaryAndAllergenFilters();
  setupCartControls();
  setupExportReport();

  renderMenu();
  updateCartUI();
}

initApp();
