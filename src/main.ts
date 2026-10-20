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

// Types for i18n supporting all 14 international and regional languages
export type Language = 'es' | 'en' | 'fr' | 'de' | 'zh' | 'ko' | 'uk' | 'pt' | 'ja' | 'ar' | 'ca' | 'va' | 'eu' | 'gl' | string;
const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('DND_SELECTED_LANG') : null;
let currentLanguage: Language = savedLang || 'es';
const translations: Record<string, any> = translationsData as Record<string, any>;

// Language metadata mapping
const LANGUAGE_META: Record<string, { flag: string; label: string; name: string }> = {
  es: { flag: '🇪🇸', label: 'ES', name: 'Español' },
  en: { flag: '🇬🇧', label: 'EN', name: 'English' },
  fr: { flag: '🇫🇷', label: 'FR', name: 'Français' },
  de: { flag: '🇩🇪', label: 'DE', name: 'Deutsch' },
  zh: { flag: '🇨🇳', label: 'ZH', name: '中文' },
  ko: { flag: '🇰🇷', label: 'KO', name: '한국어' },
  uk: { flag: '🇺🇦', label: 'UK', name: 'Українська' },
  pt: { flag: '🇵🇹', label: 'PT', name: 'Português' },
  ja: { flag: '🇯🇵', label: 'JA', name: '日本語' },
  ar: { flag: '🇸🇦', label: 'AR', name: 'العربية' },
  ca: { flag: '🟡🔴', label: 'CA', name: 'Català' },
  va: { flag: '🔵🔴', label: 'VA', name: 'Valencià' },
  eu: { flag: '🟢🔴', label: 'EU', name: 'Euskara' },
  gl: { flag: '🔵⚪', label: 'GL', name: 'Galego' }
};

// Decoupled i18n rule: only languages available across the menu items catalog appear in the selector
function getAvailableMenuLanguages(): string[] {
  if (!menuCatalog || menuCatalog.length === 0) return ['es'];

  // Base language is always Spanish ('es')
  const available: string[] = ['es'];
  const allKnownLanguages = Object.keys(translations);

  for (const lang of allKnownLanguages) {
    if (lang === 'es') continue;
    // Check if every item in the menu has this language translated
    const isAvailableInMenu = menuCatalog.every(item => {
      const itemTrans = item.translations?.[lang];
      return itemTrans && itemTrans.name && itemTrans.name.trim().length > 0;
    });

    if (isAvailableInMenu) {
      available.push(lang);
    }
  }

  return available;
}

function updateLanguageSelectorOptions() {
  const langSelector = document.getElementById('lang-selector') as HTMLSelectElement;
  if (!langSelector) return;

  const availableLangs = getAvailableMenuLanguages();

  // If currentLanguage is not among available menu languages, fallback to 'es'
  if (!availableLangs.includes(currentLanguage)) {
    currentLanguage = 'es';
  }

  langSelector.innerHTML = '';
  availableLangs.forEach(lang => {
    const meta = LANGUAGE_META[lang] || { flag: '🌐', label: lang.toUpperCase(), name: lang.toUpperCase() };
    const opt = document.createElement('option');
    opt.value = lang;
    opt.textContent = `${meta.flag} ${meta.label}`;
    opt.title = meta.name;
    if (lang === currentLanguage) {
      opt.selected = true;
    }
    langSelector.appendChild(opt);
  });
  langSelector.value = currentLanguage;
}

// 1. Initialize Hexagonal Services & Use Cases via DI
const services = RepositoryContainer.getServices(true);
const createOrderUseCase = new CreateOrderUseCase(services.orderRepo, services.menuRepo, services.paymentGateway, services.realtimeNotifier);
const updateStatusUseCase = new UpdateOrderStatusUseCase(services.orderRepo, services.realtimeNotifier);
const assignStaffUseCase = new AssignStaffUseCase(services.orderRepo, services.realtimeNotifier);
const processCashUseCase = new ProcessCashPaymentUseCase(services.orderRepo, services.realtimeNotifier);
const manageStockUseCase = new ManageStockUseCase(services.menuRepo);
const kpiUseCase = new GenerateKpiReportUseCase(services.orderRepo);

// 2. Application State & Theme Management
let currentTheme: string = (typeof localStorage !== 'undefined') ? localStorage.getItem('DND_THEME') || 'dark' : 'dark';

function applyTheme(theme: string) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('DND_THEME', theme);
  }
  const themeSelector = document.getElementById('theme-selector') as HTMLSelectElement;
  if (themeSelector && themeSelector.value !== theme) {
    themeSelector.value = theme;
  }
}

function setupThemeSelector() {
  applyTheme(currentTheme);
  const themeSelector = document.getElementById('theme-selector') as HTMLSelectElement;
  if (themeSelector) {
    themeSelector.value = currentTheme;
    themeSelector.addEventListener('change', () => {
      applyTheme(themeSelector.value);
    });
  }
}

// Requirement 4: Anonymous guest customer state (Never stored in employee database for privacy)
let currentUser: User = {
  id: 'guest_customer',
  name: 'Comensal en Sala',
  email: 'comensal@restaurante.local',
  role: UserRole.CUSTOMER,
  active: true
};

// Staff authentication session (RBAC tracking)
let authenticatedStaffUser: User | null = null;

// Operational Flow Settings (Requirement 3: Skip staff assignment)
let skipStaffAssignment: boolean = (() => {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('DND_SKIP_STAFF_ASSIGN') : null;
  if (stored !== null) return stored === 'true';
  return (restaurantConfig as any).skipStaffAssignment ?? true;
})();

function generateFallbackTranslations(name: string, description: string): Record<string, { name: string; description: string }> {
  const transMap: Record<string, { name: string; description: string }> = {};
  const allLangs = ['es', 'en', 'fr', 'de', 'zh', 'ko', 'uk', 'pt', 'ja', 'ar', 'ca', 'va', 'eu', 'gl'];
  for (const lang of allLangs) {
    transMap[lang] = { name: name, description: description };
  }
  return transMap;
}

let menuCatalog: MenuItem[] = [];
let allOrders: Order[] = [];
let allUsers: User[] = [];
let openProductEditorModal: (item?: MenuItem) => void = () => {};
let openUserEditorModal: (user?: User) => void = () => {};

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
let currentReceiptType: 'TICKET' | 'INVOICE' = 'TICKET';
let lastConfirmedOrder: Order | null = null;
let cutleryCount = 2;

// Features 2 & 3: Dietary & Allergen Filter State
let isFilterVegan = false;
let isFilterVegetarian = false;
let isFilterNoAlcohol = false;
let selectedAllergenToExclude = 'ALL';
let currentViewMode: 'compact' | 'grid' = 'compact';

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
    updateLanguageSelectorOptions();
    langSelector.value = currentLanguage;
    langSelector.addEventListener('change', () => {
      setLanguage(langSelector.value);
    });
    setLanguage(currentLanguage);
  }
}

function setLanguage(lang: string) {
  // Check if lang is available in the menu catalog
  const availableLangs = getAvailableMenuLanguages();
  if (!availableLangs.includes(lang)) {
    lang = 'es';
  }
  currentLanguage = lang;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('DND_SELECTED_LANG', lang);
  }

  // RTL and Document Language attributes
  document.documentElement.lang = lang;
  if (lang === 'ar') {
    document.documentElement.setAttribute('dir', 'rtl');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
  }

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
    'txt-tip-note': t.tipNote || '100% íntegro para el equipo de sala',
    'txt-pay-label': t.paymentMethod,
    'txt-bill-subtotal-label': t.subtotalDishes,
    'txt-bill-vat-label': t.vatLabel || 'IVA (21%):',
    'txt-bill-pack-label': t.packagingTotal,
    'txt-bill-tip-label': t.tipAmount,
    'txt-bill-total-label': t.totalToPay,
    'txt-btn-place-order': t.confirmOrder,
    'txt-modal-title': t.loginModalTitle,
    'txt-modal-desc': t.loginModalDesc,
    'lbl-login-user': t.lblLoginUser || 'Usuario o Email:',
    'lbl-login-pass': t.lblLoginPass || 'Contraseña:',
    'btn-login-submit-text': t.loginSubmit || '🔐 Iniciar Sesión',
    'footer-legal-notice': t.footerNotice,
    'footer-rights': t.footerRights,
    'footer-link-terms': t.terms,
    'footer-link-privacy': t.privacy,
    'footer-link-cookies': t.cookies,
    'footer-link-legal': t.legalNotice,
    'footer-col-restaurant': t.footerColRestaurant,
    'footer-link-menu': t.footerLinkMenu,
    'footer-link-allergens': t.footerLinkAllergens,
    'footer-link-hours': t.footerLinkHours,
    'footer-link-contact': t.footerLinkContact,
    'footer-col-legal': t.footerColLegal,
    'footer-col-sustainability': t.footerColSustainability,
    'footer-link-bags-law': t.footerLinkBagsLaw,
    'footer-link-waste-law': t.footerLinkWasteLaw,
    'footer-link-compostable': t.footerLinkCompostable,
    'footer-link-circular': t.footerLinkCircular,
    'footer-powered-by': t.footerPoweredBy,
    'footer-restaurant-desc': t.footerRestaurantDesc,
    'txt-view-cart-mobile': t.viewCartMobile || 'Ver Pedido',
    'txt-view-compact': t.viewCompact || '📱 Compacta',
    'txt-view-grid': t.viewGrid || '🖼️ Galería',
    'txt-waiter-title': t.waiterTitle || 'Panel de Comandas de Sala',
    'txt-waiter-sub': t.waiterSub || 'Supervisa las órdenes activas, atiende entregas de platos listos y gestiona cobros en efectivo.',
    'txt-chef-title': t.chefTitle || 'Kitchen Display System (KDS) 👨‍🍳🔥',
    'txt-chef-sub': t.chefSub || 'Órdenes que requieren elaboración culinaria. Pasa los platos a elaboración y avisa cuando estén listos.',
    'txt-manager-title': t.managerTitle || 'Panel Gerencial, KPIs & Control Operativo',
    'txt-manager-sub': t.managerSub || 'Métricas financieras consolidadas, control de inventario de platos y gestión del personal.'
  };

  for (const [id, val] of Object.entries(elMap)) {
    const el = document.getElementById(id);
    if (el && val) el.innerHTML = val;
  }

  // Update table bar elements
  const btnEditTable = document.getElementById('btn-toggle-edit-table');
  if (btnEditTable) {
    const isEditing = (document.getElementById('quick-table-select')?.style.display !== 'none');
    btnEditTable.innerText = isEditing ? t.save : t.changeTable;
  }

  // Update table detection badge text
  const badgeEl = document.getElementById('table-detection-badge');
  if (badgeEl) {
    const origin = badgeEl.getAttribute('data-origin') || 'url';
    if (origin === 'url') badgeEl.innerText = t.detectedTable || 'Detectada por URL';
    else if (origin === 'storage') badgeEl.innerText = t.rememberedTable || 'Mesa Recordada';
    else if (origin === 'manual') badgeEl.innerText = t.manualTable || 'Configurada Manualmente';
    else badgeEl.innerText = t.defaultTable || 'Mesa por Defecto';
  }

  // Update dietary filter buttons
  const btnVegan = document.getElementById('btn-filter-vegan');
  if (btnVegan) btnVegan.innerHTML = `<span>${t.filterVegan}</span>`;

  const btnVeg = document.getElementById('btn-filter-vegetarian');
  if (btnVeg) btnVeg.innerHTML = `<span>${t.filterVegetarian}</span>`;

  const btnNoAlc = document.getElementById('btn-filter-noalcohol');
  if (btnNoAlc) btnNoAlc.innerHTML = `<span>${t.filterNoAlcohol}</span>`;

  // Update Allergen Selector options
  const allergenSelect = document.getElementById('allergen-filter-select') as HTMLSelectElement;
  if (allergenSelect) {
    const currentVal = allergenSelect.value;
    const allergenOptions = [
      { val: 'ALL', text: t.allAllergens || '⚠️ Todos los alérgenos permitidos' },
      { val: 'Sin Gluten', text: t.noGluten || '🌾 Excluir Gluten' },
      { val: 'Sin Lácteos', text: t.noDairy || '🥛 Excluir Lácteos' },
      { val: 'Sin Huevos', text: t.noEggs || '🥚 Excluir Huevos' },
      { val: 'Sin Pescado', text: t.noFish || '🐟 Excluir Pescado' },
      { val: 'Sin Frutos de cáscara', text: t.noNuts || '🥜 Excluir Frutos de cáscara' },
      { val: 'Sin Sulfitos', text: t.noSulphites || '🍷 Excluir Sulfitos' }
    ];
    allergenSelect.innerHTML = '';
    allergenOptions.forEach(opt => {
      const optionEl = document.createElement('option');
      optionEl.value = opt.val;
      optionEl.textContent = opt.text;
      if (opt.val === currentVal) optionEl.selected = true;
      allergenSelect.appendChild(optionEl);
    });
  }

  // Update Cutlery label
  const cutleryLabel = document.getElementById('txt-pack-cutlery');
  if (cutleryLabel) cutleryLabel.innerText = `${t.cutleryOption}:`;

  // Update Staff Login / Logout buttons
  const btnStaffLogin = document.getElementById('btn-staff-login');
  if (btnStaffLogin) btnStaffLogin.innerHTML = `<span>${t.staffLogin}</span>`;

  const btnStaffLogout = document.getElementById('btn-staff-logout');
  if (btnStaffLogout) btnStaffLogout.innerHTML = `<span>${t.staffLogout}</span>`;

  // Update Role Switcher Buttons
  const btnRoleWaiter = document.querySelector('.role-btn.role-waiter');
  if (btnRoleWaiter) btnRoleWaiter.innerHTML = `<span>🏃 ${t.roleWaiter}</span>`;
  const btnRoleChef = document.querySelector('.role-btn.role-chef');
  if (btnRoleChef) btnRoleChef.innerHTML = `<span>👨‍🍳 ${t.roleChef}</span>`;
  const btnRoleManager = document.querySelector('.role-btn.role-manager');
  if (btnRoleManager) btnRoleManager.innerHTML = `<span>📊 ${t.roleManager}</span>`;

  // Update Payment Buttons
  const btnPayStripe = document.getElementById('btn-pay-stripe');
  if (btnPayStripe) {
    btnPayStripe.innerHTML = `<span>${t.payCard}</span><small style="font-size:0.7rem; color:var(--text-dim);">Stripe</small>`;
  }
  const btnPayCash = document.getElementById('btn-pay-cash');
  if (btnPayCash) {
    btnPayCash.innerHTML = `<span>${t.payCash}</span><small style="font-size:0.7rem; color:var(--text-dim);">Pagar en mesa</small>`;
  }

  // Update language selector dropdown value
  const langSelector = document.getElementById('lang-selector') as HTMLSelectElement;
  if (langSelector && langSelector.value !== lang) {
    langSelector.value = lang;
  }

  // Re-render menu cards and cart with translated values
  renderMenu();
  updateCartUI();
}

// 5. Feature 1 & Requirement 3: Login de Personal Manual (Usuario y Contraseña)
function setupStaffAuth() {
  const modal = document.getElementById('staff-login-modal')!;
  const btnLogin = document.getElementById('btn-staff-login')!;
  const btnLogout = document.getElementById('btn-staff-logout')!;
  const btnClose = document.getElementById('btn-close-modal')!;
  const loginForm = document.getElementById('staff-login-form') as HTMLFormElement;
  const usernameInput = document.getElementById('login-username') as HTMLInputElement;
  const passwordInput = document.getElementById('login-password') as HTMLInputElement;
  const errorMsg = document.getElementById('login-error-msg')!;

  btnLogin?.addEventListener('click', () => {
    modal.style.display = 'flex';
    if (errorMsg) errorMsg.style.display = 'none';
    if (usernameInput) {
      usernameInput.value = '';
      usernameInput.focus();
    }
    if (passwordInput) passwordInput.value = '';
  });

  btnClose?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const userVal = usernameInput.value.trim().toLowerCase();
    const passVal = passwordInput.value.trim();

    // Find staff user by email, username, or role keyword
    const staffUser = allUsers.find(u => 
      u.role !== UserRole.CUSTOMER &&
      (
        u.email.toLowerCase() === userVal || 
        (u.username && u.username.toLowerCase() === userVal) ||
        (userVal === 'camarero' && u.role === UserRole.WAITER) ||
        (userVal === 'cocinero' && u.role === UserRole.CHEF) ||
        (userVal === 'gerente' && u.role === UserRole.MANAGER)
      )
    );

    if (staffUser && staffUser.password && staffUser.password === passVal) {
      authenticatedStaffUser = staffUser;
      modal.style.display = 'none';
      btnLogin.style.display = 'none';
      btnLogout.style.display = 'flex';

      updateRoleSwitcherVisibility();
      switchRole(staffUser.role);
      updateTableControlsVisibility();
      showToast(`¡Bienvenido, ${staffUser.name}! Acceso verificado como ${staffUser.role}.`, 'success');
    } else {
      if (errorMsg) {
        errorMsg.innerText = '❌ Credenciales no válidas. Revisa usuario y contraseña.';
        errorMsg.style.display = 'block';
      }
    }
  });

  btnLogout?.addEventListener('click', () => {
    authenticatedStaffUser = null;
    updateRoleSwitcherVisibility();
    btnLogout.style.display = 'none';
    btnLogin.style.display = 'flex';

    currentUser = {
      id: 'guest_customer',
      name: 'Comensal en Sala',
      email: 'comensal@restaurante.local',
      role: UserRole.CUSTOMER,
      active: true
    };

    switchRole(UserRole.CUSTOMER);
    updateTableControlsVisibility();
    showToast('Sesión de empleado cerrada. Has vuelto al modo comensal.', 'info');
  });
}

// 6. Navigation & Role Switcher (RBAC)
function setupRoleSwitcher() {
  const roleButtons = document.querySelectorAll('.role-btn');
  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedRole = btn.getAttribute('data-role') as UserRole;
      switchRole(selectedRole);
    });
  });
}

// Helper: RBAC switcher visibility:
// - Cocineros: no tienen acceso a la pestaña de camarero ni de Gerente (solo Cocina KDS)
// - Camareros: solo tienen acceso a Camarero
// - Gerente: tiene acceso a todo (Camarero, Cocina y Gerente)
function updateRoleSwitcherVisibility() {
  const staffSwitcher = document.getElementById('staff-role-switcher');
  const btnWaiter = document.querySelector('.role-btn.role-waiter') as HTMLElement;
  const btnChef = document.querySelector('.role-btn.role-chef') as HTMLElement;
  const btnManager = document.querySelector('.role-btn.role-manager') as HTMLElement;

  if (!authenticatedStaffUser) {
    if (staffSwitcher) staffSwitcher.style.display = 'none';
    return;
  }

  if (staffSwitcher) staffSwitcher.style.display = 'flex';

  const userRole = authenticatedStaffUser.role;

  if (userRole === UserRole.WAITER) {
    if (btnWaiter) btnWaiter.style.display = 'inline-flex';
    if (btnChef) btnChef.style.display = 'none';
    if (btnManager) btnManager.style.display = 'none';
  } else if (userRole === UserRole.CHEF) {
    if (btnWaiter) btnWaiter.style.display = 'none';
    if (btnChef) btnChef.style.display = 'inline-flex';
    if (btnManager) btnManager.style.display = 'none';
  } else if (userRole === UserRole.MANAGER) {
    if (btnWaiter) btnWaiter.style.display = 'inline-flex';
    if (btnChef) btnChef.style.display = 'inline-flex';
    if (btnManager) btnManager.style.display = 'inline-flex';
  }
}

async function switchRole(role: UserRole) {
  // Authorization check (RBAC Security)
  if (role !== UserRole.CUSTOMER) {
    if (!authenticatedStaffUser) {
      showToast('Acceso denegado: debes iniciar sesión como personal.', 'danger');
      return;
    }
    if (authenticatedStaffUser.role === UserRole.WAITER && role !== UserRole.WAITER) {
      showToast('Acceso restringido: los camareros solo tienen acceso a su panel de sala.', 'warning');
      return;
    }
    if (authenticatedStaffUser.role === UserRole.CHEF && role !== UserRole.CHEF) {
      showToast('Acceso restringido: los cocineros no tienen acceso a la pestaña de camarero ni de gerente.', 'warning');
      return;
    }
    // Gerente (MANAGER) tiene acceso a todo
  }

  // Update currentUser matching role
  const foundUser = (role === UserRole.CUSTOMER)
    ? {
        id: 'guest_customer',
        name: 'Comensal en Sala',
        email: 'comensal@restaurante.local',
        role: UserRole.CUSTOMER,
        active: true
      }
    : (authenticatedStaffUser && authenticatedStaffUser.role === role)
      ? authenticatedStaffUser
      : allUsers.find(u => u.role === role) || {
          id: `usr_${role.toLowerCase()}`,
          name: role === UserRole.WAITER ? 'David García' : role === UserRole.CHEF ? 'Chef Antonio Martín' : 'César Orsinys',
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

  // Update staff table controls visibility
  updateTableControlsVisibility();

  // Responsive mobile cart bar visibility
  const mobileCartBar = document.getElementById('mobile-cart-bar');
  if (mobileCartBar) {
    const totalCount = currentCart.reduce((acc, c) => acc + c.quantity, 0);
    mobileCartBar.style.display = (role === UserRole.CUSTOMER && totalCount > 0) ? 'flex' : 'none';
  }
  const cartPanel = document.getElementById('cart-panel');
  const backdrop = document.getElementById('cart-backdrop');
  cartPanel?.classList.remove('mobile-drawer-open');
  backdrop?.classList.remove('active');
  document.body.style.overflow = '';

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

// Helper: Visibility of table change controls (Only accessible by staff, never customer)
function updateTableControlsVisibility() {
  const staffTableControls = document.getElementById('staff-table-controls');
  if (staffTableControls) {
    const isStaff = authenticatedStaffUser !== null && authenticatedStaffUser.role !== UserRole.CUSTOMER;
    staffTableControls.style.display = isStaff ? 'flex' : 'none';
  }
}

// 7. Feature 11 & Requirements 1 y 2: Identificación Inteligente de Mesa (Select configurable en restaurant_config.json y exclusivo para personal)
function setupTableIdentification() {
  const urlParams = new URLSearchParams(window.location.search);
  const fromParam = urlParams.get('table') || urlParams.get('mesa') || urlParams.get('m');
  const badgeEl = document.getElementById('table-detection-badge')!;
  const t = translations[currentLanguage] || translations['es'];

  // Requirement 1: Load available tables configured in restaurant_config.json
  const availableTables: string[] = (restaurantConfig as any).availableTables || [
    'Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6', 'Mesa 7', 'Mesa 8', 'Terraza 1', 'Terraza 2', 'Barra 1'
  ];

  // Populate select dropdown
  const quickSelect = document.getElementById('quick-table-select') as HTMLSelectElement;
  if (quickSelect) {
    quickSelect.innerHTML = '';
    availableTables.forEach(tbl => {
      const opt = document.createElement('option');
      opt.value = tbl;
      opt.textContent = `📍 ${tbl}`;
      quickSelect.appendChild(opt);
    });
  }

  if (fromParam) {
    currentAssignedTable = fromParam.startsWith('Mesa') ? fromParam : `Mesa ${fromParam}`;
    localStorage.setItem('DND_SELECTED_TABLE', currentAssignedTable);
    badgeEl.setAttribute('data-origin', 'url');
    badgeEl.innerText = t.detectedTable || 'Detectada por URL';
    badgeEl.className = 'badge-tag tag-stock';
  } else {
    const stored = localStorage.getItem('DND_SELECTED_TABLE');
    if (stored) {
      currentAssignedTable = stored;
      badgeEl.setAttribute('data-origin', 'storage');
      badgeEl.innerText = t.rememberedTable || 'Mesa Recordada';
      badgeEl.className = 'badge-tag tag-direct';
    } else {
      currentAssignedTable = availableTables[0] || 'Mesa 4';
      badgeEl.setAttribute('data-origin', 'default');
      badgeEl.innerText = t.defaultTable || 'Mesa por Defecto';
      badgeEl.className = 'badge-tag tag-stock';
    }
  }

  updateTableUI();
  updateTableControlsVisibility();

  // Requirement 2: Manual edit toggle for staff only
  const editBtn = document.getElementById('btn-toggle-edit-table');
  if (editBtn && quickSelect) {
    editBtn.addEventListener('click', () => {
      const curT = translations[currentLanguage] || translations['es'];
      if (quickSelect.style.display === 'none') {
        quickSelect.style.display = 'inline-block';
        quickSelect.value = currentAssignedTable;
        quickSelect.focus();
        editBtn.innerText = curT.save || '💾 Guardar';
        editBtn.style.background = 'var(--accent-orange)';
        editBtn.style.color = '#fff';
      } else {
        saveStaffTable();
      }
    });

    quickSelect.addEventListener('change', () => {
      saveStaffTable();
    });
  }

  function saveStaffTable() {
    const curT = translations[currentLanguage] || translations['es'];
    const val = quickSelect.value;
    if (val) {
      currentAssignedTable = val;
      localStorage.setItem('DND_SELECTED_TABLE', currentAssignedTable);
      badgeEl.setAttribute('data-origin', 'manual');
      badgeEl.innerText = curT.manualTable || 'Configurada por Personal';
      badgeEl.className = 'badge-tag tag-cooking';
      showToast(`${curT.manualTableSet || 'Mesa actualizada a'} "${currentAssignedTable}".`, 'success');
    }
    quickSelect.style.display = 'none';
    if (editBtn) {
      editBtn.innerText = curT.changeTable || '✏️ Cambiar Mesa';
      editBtn.style.background = 'var(--bg-card)';
      editBtn.style.color = 'var(--text-main)';
    }
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

  // View Mode switcher (Feature: Multi-dimension image view mode toggle)
  const btnCompact = document.getElementById('btn-view-compact');
  const btnGrid = document.getElementById('btn-view-grid');

  btnCompact?.addEventListener('click', () => {
    currentViewMode = 'compact';
    renderMenu();
  });

  btnGrid?.addEventListener('click', () => {
    currentViewMode = 'grid';
    renderMenu();
  });
}

// Helper: Generates responsive multi-dimension images for all viewport form factors
function getResponsiveImages(item: MenuItem): { thumbnail: string; medium: string; large: string } {
  if (item.images?.thumbnail && item.images?.medium && item.images?.large) {
    return item.images;
  }
  const base = item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';
  const clean = base.split('?')[0];
  return {
    thumbnail: `${clean}?w=240&h=240&fit=crop&q=80`,
    medium: `${clean}?w=600&h=380&fit=crop&q=80`,
    large: `${clean}?w=900&h=550&fit=crop&q=85`
  };
}

// Helper: Identificación y mapeo de iconos gráficos de alérgenos en todos los idiomas soportados (14 alérgenos oficiales UE)
const ALLERGEN_ICON_MAP: Record<string, string> = {
  // 1. Gluten: 🌾
  gluten: '🌾', trigo: '🌾', cebada: '🌾', avena: '🌾', centeno: '🌾',
  wheat: '🌾', barley: '🌾', oats: '🌾', rye: '🌾',
  blé: '🌾', orge: '🌾', avoine: '🌾',
  weizen: '🌾', gerste: '🌾', hafer: '🌾',
  麸质: '🌾', 小麦: '🌾',
  '小麦(グルテン)': '🌾', グルテン: '🌾',
  글루텐: '🌾', 밀: '🌾',
  глютен: '🌾', пшениця: '🌾',
  glúten: '🌾',
  غلوتين: '🌾', قمح: '🌾',
  glutena: '🌾', glute: '🌾', blat: '🌾',

  // 2. Crustáceos: 🦐
  crustáceos: '🦐', crustaceos: '🦐', marisco: '🦐', gambas: '🦐', langostinos: '🦐',
  crustaceans: '🦐', shellfish: '🦐', shrimp: '🦐', prawns: '🦐', lobster: '🦐', crab: '🦐',
  crustacés: '🦐', crevettes: '🦐',
  krebstiere: '🦐', garnelen: '🦐',
  甲壳类: '🦐', 甲壳动物: '🦐', 虾: '🦐', 蟹: '🦐',
  甲殻類: '🦐', エビ: '🦐', カニ: '🦐',
  갑각류: '🦐', 새우: '🦐', 게: '🦐',
  ракоподібні: '🦐', креветки: '🦐',
  قشريات: '🦐', جمبري: '🦐',
  crustacis: '🦐', krustazeoak: '🦐',

  // 3. Huevos: 🥚
  huevos: '🥚', huevo: '🥚',
  eggs: '🥚', egg: '🥚',
  oeufs: '🥚', oeuf: '🥚',
  eier: '🥚', ei: '🥚',
  蛋类: '🥚', 鸡蛋: '🥚', 蛋: '🥚',
  卵: '🥚', たまご: '🥚', 玉子: '🥚',
  계란: '🥚', 달걀: '🥚',
  яйця: '🥚', яйце: '🥚',
  ovos: '🥚', ovo: '🥚',
  بيض: '🥚', بيضة: '🥚',
  ous: '🥚', ou: '🥚',
  arrautzak: '🥚', arrautza: '🥚',

  // 4. Pescado: 🐟
  pescado: '🐟', pez: '🐟', atún: '🐟', salmón: '🐟',
  fish: '🐟', tuna: '🐟', salmon: '🐟',
  poisson: '🐟',
  fisch: '🐟',
  鱼类: '🐟', 鱼: '🐟',
  魚介類: '🐟', 魚: '🐟', さかな: '🐟',
  생선: '🐟', 물고기: '🐟',
  риба: '🐟',
  peixe: '🐟',
  أسماك: '🐟', سمك: '🐟',
  peix: '🐟',
  arraina: '🐟',

  // 5. Cacahuetes: 🥜
  cacahuetes: '🥜', cacahuate: '🥜', maní: '🥜', mani: '🥜',
  peanuts: '🥜', peanut: '🥜',
  arachides: '🥜', arachide: '🥜',
  erdnüsse: '🥜', erdnuss: '🥜',
  花生: '🥜', 落花生: '🥜',
  ピーナッツ: '🥜',
  땅콩: '🥜',
  арахіс: '🥜',
  amendoins: '🥜', amendoim: '🥜',
  'فول سوداني': '🥜',
  cacauets: '🥜', cacauet: '🥜',
  kakahueteak: '🥜',

  // 6. Soja: 🌱
  soja: '🌱',
  soy: '🌱', soya: '🌱', soybean: '🌱',
  大豆: '🌱',
  '大豆(ソイ)': '🌱',
  대두: '🌱', 콩: '🌱',
  соя: '🌱',
  soia: '🌱',
  صويا: '🌱',

  // 7. Lácteos: 🥛
  lácteos: '🥛', lacteos: '🥛', leche: '🥛', queso: '🥛', mantequilla: '🥛', nata: '🥛', yogur: '🥛',
  dairy: '🥛', milk: '🥛', cheese: '🥛', butter: '🥛', cream: '🥛', yogurt: '🥛',
  lactose: '🥛', lait: '🥛', fromage: '🥛', beurre: '🥛', crème: '🥛',
  laktose: '🥛', milch: '🥛', käse: '🥛', sahne: '🥛',
  乳制品: '🥛', 牛奶: '🥛', 奶酪: '🥛', 乳: '🥛',
  乳製品: '🥛', ミルク: '🥛', チーズ: '🥛', 牛乳: '🥛',
  유제품: '🥛', 우유: '🥛', 치즈: '🥛',
  лактоза: '🥛', молоко: '🥛', сир: '🥛',
  laticínios: '🥛', laticinios: '🥛', leite: '🥛', queijo: '🥛',
  'مشتقات الحليب': '🥛', حليب: '🥛', جبن: '🥛',
  lactis: '🥛', làctics: '🥛', lactics: '🥛', llet: '🥛', formatge: '🥛',
  esnekiak: '🥛', esnea: '🥛', gazta: '🥛',

  // 8. Frutos de cáscara: 🌰
  'frutos de cáscara': '🌰', 'frutos de cascara': '🌰', nueces: '🌰', almendras: '🌰', avellanas: '🌰', pistachos: '🌰', anacardos: '🌰',
  nuts: '🌰', 'tree nuts': '🌰', walnuts: '🌰', almonds: '🌰', hazelnuts: '🌰', cashews: '🌰', pistachios: '🌰',
  'fruits à coque': '🌰', 'fruits a coque': '🌰', noix: '🌰', amandes: '🌰', noisettes: '🌰', pistaches: '🌰',
  schalenfrüchte: '🌰', schalenfruechte: '🌰', nüsse: '🌰', nuesse: '🌰', mandeln: '🌰', haselnüsse: '🌰',
  坚果: '🌰', 核桃: '🌰', 杏仁: '🌰', 榛子: '🌰',
  ナッツ: '🌰', くるみ: '🌰', アーモンド: '🌰',
  견과류: '🌰', 호두: '🌰', 아몬드: '🌰',
  горіхи: '🌰', мигдаль: '🌰', фундук: '🌰',
  nozes: '🌰', amêndoas: '🌰', avelãs: '🌰',
  مكسرات: '🌰', جوز: '🌰', لوز: '🌰',
  'fruits de closca': '🌰', 'fruits de corfa': '🌰', nous: '🌰', ametlles: '🌰',
  'fruitu lehorrak': '🌰', intxaurrak: '🌰',
  'froitos de casca': '🌰',

  // 9. Apio: 🌿
  apio: '🌿',
  celery: '🌿',
  céleri: '🌿', celeri: '🌿',
  sellerie: '🌿',
  芹菜: '🌿',
  セロリ: '🌿',
  샐러리: '🌿',
  селера: '🌿',
  aipo: '🌿',
  كرفس: '🌿',
  api: '🌿',
  ziazerba: '🌿',

  // 10. Mostaza: 🌭
  mostaza: '🌭',
  mustard: '🌭',
  moutarde: '🌭',
  senf: '🌭',
  芥末: '🌭',
  マスタード: '🌭', からし: '🌭',
  겨자: '🌭', 머스터드: '🌭',
  гірчиця: '🌭',
  mostarda: '🌭',
  خردل: '🌭',
  mostassa: '🌭',
  mustarda: '🌭',

  // 11. Sésamo: 🥯
  sésamo: '🥯', sesamo: '🥯',
  sesame: '🥯',
  sésame: '🥯',
  sesam: '🥯',
  芝麻: '🥯',
  ゴマ: '🥯', 胡麻: '🥯', ごま: '🥯',
  참깨: '🥯', 깨: '🥯',
  кунжут: '🥯',
  سمسم: '🥯',
  sèsam: '🥯',
  sesamoa: '🥯',

  // 12. Sulfitos: 🍷
  sulfitos: '🍷', sulfito: '🍷',
  sulphites: '🍷', sulfites: '🍷', sulphite: '🍷', sulfite: '🍷',
  亚硫酸盐: '🍷',
  亜硫酸塩: '🍷',
  아황산염: '🍷',
  сульфіти: '🍷', сульфиты: '🍷',
  كبريتات: '🍷',
  sulfits: '🍷',
  sulfitoak: '🍷',

  // 13. Altramuces: 🌾
  altramuces: '🌾', altramuz: '🌾',
  lupin: '🌾', lupine: '🌾', lupins: '🌾',
  羽扇豆: '🌾',
  ルピナス: '🌾',
  루핀: '🌾',
  люпин: '🌾',
  tremoço: '🌾', tremoços: '🌾', tremoce: '🌾',
  ترمس: '🌾',
  llobí: '🌾', llobins: '🌾',
  lupinuak: '🌾',

  // 14. Moluscos: 🦪
  moluscos: '🦪', molusco: '🦪',
  molluscs: '🦪', mollusks: '🦪', mollusc: '🦪', mollusk: '🦪',
  mollusques: '🦪',
  weichtiere: '🦪',
  软体动物: '🦪',
  軟体動物: '🦪',
  연체동물: '🦪',
  молюски: '🦪',
  رخويات: '🦪',
  'mol·luscs': '🦪',
  moluskuak: '🦪'
};

function getAllergenIcon(name: string, canonicalName?: string): string {
  const norm = (str?: string) => (str || '').toLowerCase().trim();
  const searchCandidates = [norm(name), norm(canonicalName)].filter(Boolean);

  for (const s of searchCandidates) {
    if (ALLERGEN_ICON_MAP[s]) return ALLERGEN_ICON_MAP[s];
    for (const [key, icon] of Object.entries(ALLERGEN_ICON_MAP)) {
      if (s.includes(key)) return icon;
    }
  }
  return '⚠️';
}

function renderMenu() {
  menuCardsContainer.innerHTML = '';
  
  // Apply current view mode class to container
  if (currentViewMode === 'compact') {
    menuCardsContainer.classList.add('compact-view');
    menuCardsContainer.classList.remove('grid-view');
  } else {
    menuCardsContainer.classList.add('grid-view');
    menuCardsContainer.classList.remove('compact-view');
  }

  // Update view mode toggle buttons
  const btnCompact = document.getElementById('btn-view-compact');
  const btnGrid = document.getElementById('btn-view-grid');
  if (btnCompact && btnGrid) {
    btnCompact.classList.toggle('active', currentViewMode === 'compact');
    btnGrid.classList.toggle('active', currentViewMode === 'grid');
  }

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
  if (countBadge) countBadge.innerText = `${filtered.length} ${t.items || t.allDishes || 'Platos'}`;

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

    const ingLabel = t.ingredientsLabel || 'Ingredientes';
    const ingredientsHtml = displayIngredients.length > 0 ? `
      <div style="font-size:0.77rem; color:var(--text-muted); margin-bottom:8px; line-height:1.4;">
        🌿 <strong>${ingLabel}:</strong> ${displayIngredients.join(', ')}
      </div>
    ` : '';

    const noAllergenLabel = t.allergenFree || 'Libre de alérgenos';
    const allergensHtml = displayAllergens.length > 0 ? `
      <div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:12px;">
        ${displayAllergens.map((a: string, idx: number) => {
          const icon = getAllergenIcon(a, item.allergens?.[idx]);
          return `<span class="badge-tag" style="background:rgba(236,72,153,0.15); color:#f472b6; border:1px solid rgba(236,72,153,0.3); font-size:0.67rem;">${icon} ${a}</span>`;
        }).join('')}
      </div>
    ` : `
      <div style="margin-bottom:12px;">
        <span class="badge-tag" style="background:rgba(16,185,129,0.1); color:#34d399; font-size:0.67rem;">✅ ${noAllergenLabel}</span>
      </div>
    `;

    const miniAllergensHtml = displayAllergens.length > 0 ? `
      <div class="menu-mini-allergens">
        ${displayAllergens.map((a: string, idx: number) => {
          const icon = getAllergenIcon(a, item.allergens?.[idx]);
          return `<span class="allergen-mini-icon" title="${a}">${icon}</span>`;
        }).join('')}
      </div>
    ` : `
      <div class="menu-mini-allergens">
        <span class="allergen-mini-pill" title="${noAllergenLabel}">✅ ${noAllergenLabel}</span>
      </div>
    `;

    const cookingLabel = item.requiresCooking ? t.requiresCooking : t.directDelivery;
    const stockLabel = isOutOfStock ? t.outOfStock : `${t.stock}: ${item.stock}`;
    const addBtnText = isOutOfStock ? t.outOfStock : t.addToCart;

    // Multi-dimension responsive picture
    const responsiveImgs = getResponsiveImages(item);

    const isManager = currentUser.role === UserRole.MANAGER || (authenticatedStaffUser !== null && authenticatedStaffUser.role === UserRole.MANAGER);
    const managerEditBtn = isManager ? `
      <button class="btn-manager-edit-dish" data-id="${item.id}" title="Editar plato completo" style="background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.35); color:#60a5fa; border-radius:4px; font-size:0.72rem; padding:2px 7px; cursor:pointer; font-weight:700; margin-left:6px; display:inline-flex; align-items:center; gap:3px;">
        ✏️ Editar
      </button>
    ` : '';

    card.innerHTML = `
      <!-- Columna Principal / Información -->
      <div class="menu-body">
        <div>
          <div class="menu-badge-row">
            <div style="display:flex; align-items:center;">
              <span class="badge-tag ${item.requiresCooking ? 'tag-cooking' : 'tag-direct'}">
                ${cookingLabel}
              </span>
              ${managerEditBtn}
            </div>
            <span class="badge-tag desktop-stock-badge ${isOutOfStock ? 'tag-cooking' : item.stock < 5 ? 'tag-low-stock' : 'tag-stock'}">
              ${stockLabel}
            </span>
          </div>
          <h3 class="menu-title">${displayName}</h3>
          <p class="menu-desc">${displayDesc}</p>
          
          <!-- Ingredientes y Alérgenos expandidos (visibles en modo cuadrícula) -->
          <div class="menu-meta-details">
            ${ingredientsHtml}
            ${allergensHtml}
          </div>
        </div>

        <div class="menu-footer">
          <div class="menu-price-allergens-wrap">
            <span class="menu-price">${item.price.toFixed(2)} €</span>
            ${miniAllergensHtml}
          </div>
          <button class="btn-add desktop-btn-add" data-id="${item.id}" ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            <span>${addBtnText}</span>
          </button>
        </div>
      </div>

      <!-- Columna Lateral: En móvil contiene Stock arriba, Imagen en medio, Botón Añadir abajo -->
      <div class="menu-side-col">
        <span class="badge-tag mobile-stock-badge ${isOutOfStock ? 'tag-cooking' : item.stock < 5 ? 'tag-low-stock' : 'tag-stock'}">
          ${stockLabel}
        </span>
        <picture class="menu-card-picture">
          <source media="(max-width: 640px)" srcset="${responsiveImgs.thumbnail}">
          <source media="(max-width: 1024px)" srcset="${responsiveImgs.medium}">
          <img src="${responsiveImgs.large}" alt="${displayName}" class="menu-img" loading="lazy" width="300" height="200">
        </picture>
        <button class="btn-add mobile-btn-add" data-id="${item.id}" ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
          <span>${addBtnText}</span>
        </button>
      </div>
    `;

    card.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', () => {
        addToCart(item);
      });
    });

    card.querySelectorAll('.btn-manager-edit-dish').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openProductEditorModal(item);
      });
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
  counterEl.innerText = `${totalCount} ${t.items || (totalCount === 1 ? 'ítem' : 'ítems')}`;

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

    // A todos los productos en el apartado de pago se les quita el 21% (precio base sin IVA)
    const netUnitPrice = parseFloat((item.menuItem.price * 0.79).toFixed(2));
    const netLine = parseFloat((netUnitPrice * item.quantity).toFixed(2));

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; width:100%; min-width:0;">
        <div style="width:38px; height:38px; border-radius:6px; overflow:hidden; flex-shrink:0; background:rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center;">
          ${item.menuItem.imageUrl 
            ? `<img src="${item.menuItem.imageUrl}" alt="${displayName}" style="width:100%; height:100%; object-fit:cover;">`
            : `<span style="font-size:1.15rem;">🍽️</span>`
          }
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name" title="${displayName}">${displayName}</div>
          <div class="cart-item-price">
            <strong style="color:var(--text-main);">${netLine.toFixed(2)} €</strong>
            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:400; margin-left:3px;">(${netUnitPrice.toFixed(2)} €/ud sin IVA)</span>
          </div>
        </div>
        <div class="cart-qty-ctrl">
          <button class="btn-qty btn-minus" data-idx="${index}" title="Reducir cantidad">-</button>
          <span style="font-size:0.85rem; font-weight:700; width:16px; text-align:center;">${item.quantity}</span>
          <button class="btn-qty btn-plus" data-idx="${index}" title="Aumentar cantidad">+</button>
          <button class="btn-qty btn-remove" data-idx="${index}" title="Eliminar plato" style="color:#ef4444; border-color:rgba(239,68,68,0.3); margin-left:4px;">🗑️</button>
        </div>
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

    row.querySelector('.btn-remove')?.addEventListener('click', () => {
      currentCart.splice(index, 1);
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

function updateBillTotals(rawSubtotal: number) {
  // A todos los productos se les quita el 21% (Base Imponible) y luego se suma como IVA (21%)
  const vatAmount = parseFloat((rawSubtotal * 0.21).toFixed(2));
  const subtotalNet = parseFloat((rawSubtotal - vatAmount).toFixed(2));

  const packagingAmount = calculatePackagingCost();
  const tipAmount = parseFloat((rawSubtotal * currentTipPercent).toFixed(2));
  const total = parseFloat((subtotalNet + vatAmount + packagingAmount + tipAmount).toFixed(2));

  const subtotalEl = document.getElementById('bill-subtotal');
  if (subtotalEl) subtotalEl.innerText = `${subtotalNet.toFixed(2)} €`;

  const vatEl = document.getElementById('bill-vat');
  if (vatEl) vatEl.innerText = `+${vatAmount.toFixed(2)} €`;

  const packEl = document.getElementById('bill-packaging');
  if (packEl) packEl.innerText = `${packagingAmount.toFixed(2)} €`;

  const tipEl = document.getElementById('bill-tip');
  if (tipEl) tipEl.innerText = `${tipAmount.toFixed(2)} € (${(currentTipPercent * 100).toFixed(0)}%)`;

  const totalEl = document.getElementById('bill-total');
  if (totalEl) totalEl.innerText = `${total.toFixed(2)} €`;

  // Update floating mobile cart bar (Responsive Phone / Tablet UX)
  const mobileCountEl = document.getElementById('mobile-cart-count');
  const totalCount = currentCart.reduce((acc, c) => acc + c.quantity, 0);
  if (mobileCountEl) {
    mobileCountEl.innerText = totalCount.toString();
  }
  const mobileTotalEl = document.getElementById('mobile-cart-total');
  if (mobileTotalEl) {
    mobileTotalEl.innerText = `${total.toFixed(2)} €`;
  }
  const mobileCartBar = document.getElementById('mobile-cart-bar');
  if (mobileCartBar) {
    if (totalCount > 0 && currentUser.role === UserRole.CUSTOMER) {
      mobileCartBar.style.display = 'flex';
    } else {
      mobileCartBar.style.display = 'none';
    }
  }
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

  // Receipt / Invoice type selection
  const btnTypeTicket = document.getElementById('btn-type-ticket');
  const btnTypeInvoice = document.getElementById('btn-type-invoice');
  const invoiceContainer = document.getElementById('invoice-fields-container');

  btnTypeTicket?.addEventListener('click', () => {
    currentReceiptType = 'TICKET';
    btnTypeTicket.classList.add('active');
    btnTypeInvoice?.classList.remove('active');
    if (invoiceContainer) invoiceContainer.style.display = 'none';
  });

  btnTypeInvoice?.addEventListener('click', () => {
    currentReceiptType = 'INVOICE';
    btnTypeInvoice.classList.add('active');
    btnTypeTicket?.classList.remove('active');
    if (invoiceContainer) invoiceContainer.style.display = 'flex';
  });

  // Place Order Submit Button
  document.getElementById('btn-place-order')?.addEventListener('click', handlePlaceOrder);
}

// 10. Feature: Mobile Slide-Up Cart Drawer (Touch & Phone-First UX)
function setupMobileCartDrawer() {
  const btnOpen = document.getElementById('btn-view-cart-mobile');
  const btnClose = document.getElementById('btn-close-cart-mobile');
  const backdrop = document.getElementById('cart-backdrop');
  const cartPanel = document.getElementById('cart-panel');

  function openDrawer() {
    cartPanel?.classList.add('mobile-drawer-open');
    backdrop?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    cartPanel?.classList.remove('mobile-drawer-open');
    backdrop?.classList.remove('active');
    document.body.style.overflow = '';
  }

  btnOpen?.addEventListener('click', openDrawer);
  btnClose?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);
}

// 11. Modal: Pop-up de Confirmación de Pedido y Comprobante (Ticket / Factura)
function showOrderConfirmedModal(order: Order) {
  const modal = document.getElementById('order-confirmed-modal');
  if (!modal) return;
  lastConfirmedOrder = order;

  (document.getElementById('conf-order-number') as HTMLElement).innerText = `#${order.orderNumber}`;
  (document.getElementById('conf-order-table') as HTMLElement).innerText = order.tableNumber;
  (document.getElementById('conf-order-date') as HTMLElement).innerText = new Date(order.createdAt).toLocaleString('es-ES', { 
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
  });

  const payStatusEl = document.getElementById('conf-payment-status') as HTMLElement;
  if (order.paymentMethod === PaymentMethod.STRIPE_CARD) {
    payStatusEl.innerHTML = '💳 Pagado con Tarjeta (Pasarela Stripe)';
    payStatusEl.style.color = 'var(--accent-emerald)';
  } else {
    payStatusEl.innerHTML = '💵 Pago en Efectivo (A cobrar en mesa)';
    payStatusEl.style.color = 'var(--accent-amber)';
  }

  const receiptBadge = document.getElementById('conf-receipt-badge') as HTMLElement;
  const invoiceBox = document.getElementById('conf-invoice-box') as HTMLElement;

  if (order.receiptType === 'INVOICE' && order.invoiceDetails) {
    receiptBadge.className = 'badge-tag tag-cooking';
    receiptBadge.innerText = '📑 Factura Fiscal';
    invoiceBox.style.display = 'block';
    (document.getElementById('conf-inv-nif') as HTMLElement).innerText = order.invoiceDetails.nifCif;
    (document.getElementById('conf-inv-name') as HTMLElement).innerText = order.invoiceDetails.legalName;
    (document.getElementById('conf-inv-address') as HTMLElement).innerText = order.invoiceDetails.address || 'No indicada';
    (document.getElementById('conf-inv-email') as HTMLElement).innerText = order.invoiceDetails.email || 'No indicado';
  } else {
    receiptBadge.className = 'badge-tag tag-stock';
    receiptBadge.innerText = '🧾 Ticket de Pago';
    invoiceBox.style.display = 'none';
  }

  // Populate generous scrollable product list
  const itemsContainer = document.getElementById('conf-items-list') as HTMLElement;
  const itemsCountEl = document.getElementById('conf-items-count') as HTMLElement;
  itemsContainer.innerHTML = '';
  const totalItems = order.items.reduce((acc, i) => acc + i.quantity, 0);
  itemsCountEl.innerText = `${totalItems} productos en comanda`;

  order.items.forEach(i => {
    const netUnit = parseFloat((i.unitPrice * 0.79).toFixed(2));
    const lineTotal = parseFloat((i.unitPrice * i.quantity).toFixed(2));
    const itemRow = document.createElement('div');
    itemRow.style.display = 'flex';
    itemRow.style.justifyContent = 'space-between';
    itemRow.style.alignItems = 'center';
    itemRow.style.padding = '8px 12px';
    itemRow.style.background = 'rgba(255,255,255,0.03)';
    itemRow.style.borderRadius = 'var(--radius-sm)';
    itemRow.style.border = '1px solid var(--border-subtle)';
    itemRow.style.fontSize = '0.85rem';

    itemRow.innerHTML = `
      <div style="min-width:0; flex:1; padding-right:8px;">
        <div style="font-weight:700; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          <span style="color:var(--accent-orange); margin-right:4px;">${i.quantity}x</span> ${i.name}
        </div>
        <div style="font-size:0.72rem; color:var(--text-muted); margin-top:1px;">
          ${netUnit.toFixed(2)} €/ud base • ${i.unitPrice.toFixed(2)} € PVP
        </div>
      </div>
      <div style="font-weight:700; color:var(--text-main); font-family:'JetBrains Mono',monospace; flex-shrink:0;">
        ${lineTotal.toFixed(2)} €
      </div>
    `;
    itemsContainer.appendChild(itemRow);
  });

  // Fiscal breakdown
  (document.getElementById('conf-subtotal-net') as HTMLElement).innerText = `${(order.subtotalNet ?? (order.subtotal * 0.79)).toFixed(2)} €`;
  (document.getElementById('conf-vat') as HTMLElement).innerText = `+${(order.vatAmount ?? (order.subtotal * 0.21)).toFixed(2)} €`;
  (document.getElementById('conf-packaging') as HTMLElement).innerText = `${(order.packagingCost ?? 0).toFixed(2)} €`;
  (document.getElementById('conf-tip') as HTMLElement).innerText = `${order.tipAmount.toFixed(2)} €`;
  (document.getElementById('conf-total') as HTMLElement).innerText = `${order.total.toFixed(2)} €`;

  modal.style.display = 'flex';
}

function setupConfirmedOrderModal() {
  const modal = document.getElementById('order-confirmed-modal');
  const btnClose = document.getElementById('btn-close-confirmed-modal');
  const btnDismiss = document.getElementById('btn-dismiss-confirmed-modal');
  const btnPrint = document.getElementById('btn-print-receipt');
  const btnDownload = document.getElementById('btn-download-receipt');

  function closeModal() {
    if (modal) modal.style.display = 'none';
  }

  btnClose?.addEventListener('click', closeModal);
  btnDismiss?.addEventListener('click', closeModal);

  btnPrint?.addEventListener('click', () => {
    if (!lastConfirmedOrder) return;
    const isInvoice = lastConfirmedOrder.receiptType === 'INVOICE';
    const docTitle = isInvoice ? `Factura_${lastConfirmedOrder.orderNumber}` : `Ticket_${lastConfirmedOrder.orderNumber}`;
    
    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (!printWindow) {
      window.print();
      return;
    }
    
    const itemsHtml = lastConfirmedOrder.items.map(i => `
      <tr>
        <td style="padding:4px 0;">${i.quantity}x ${i.name}</td>
        <td style="text-align:right; padding:4px 0;">${(i.unitPrice * i.quantity).toFixed(2)} €</td>
      </tr>
    `).join('');

    const invoiceHeader = isInvoice && lastConfirmedOrder.invoiceDetails ? `
      <div style="border-top:1px dashed #999; border-bottom:1px dashed #999; padding:8px 0; margin:10px 0; font-size:12px;">
        <strong>DATOS FISCALES DEL CLIENTE:</strong><br>
        NIF/CIF: ${lastConfirmedOrder.invoiceDetails.nifCif}<br>
        Nombre/Razón: ${lastConfirmedOrder.invoiceDetails.legalName}<br>
        Dirección: ${lastConfirmedOrder.invoiceDetails.address || 'N/A'}<br>
        Email: ${lastConfirmedOrder.invoiceDetails.email || 'N/A'}
      </div>
    ` : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${docTitle}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 13px; color: #000; padding: 20px; max-width: 380px; margin: 0 auto; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="center">
          <h2 style="margin:0;">BISTRO GRAN VÍA</h2>
          <div>CIF: B-87654321 • Calle Gran Vía 28, Madrid</div>
          <div class="bold" style="margin-top:6px;">${isInvoice ? 'FACTURA FISCAL SIMPLIFICADA' : 'TICKET DE VENTA'}</div>
          <div>Comanda: #${lastConfirmedOrder.orderNumber} • ${lastConfirmedOrder.tableNumber}</div>
          <div>Fecha: ${new Date(lastConfirmedOrder.createdAt).toLocaleString('es-ES')}</div>
        </div>
        ${invoiceHeader}
        <hr>
        <table>
          <thead>
            <tr style="border-bottom:1px solid #000;">
              <th style="text-align:left; padding:4px 0;">Concepto</th>
              <th style="text-align:right; padding:4px 0;">Importe</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <hr>
        <div style="display:flex; justify-content:space-between;">
          <span>Base Imponible (neto):</span>
          <span>${(lastConfirmedOrder.subtotalNet ?? (lastConfirmedOrder.subtotal * 0.79)).toFixed(2)} €</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>IVA (21%):</span>
          <span>${(lastConfirmedOrder.vatAmount ?? (lastConfirmedOrder.subtotal * 0.21)).toFixed(2)} €</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>Empaques Ley 7/2022:</span>
          <span>${(lastConfirmedOrder.packagingCost ?? 0).toFixed(2)} €</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>Propina:</span>
          <span>${lastConfirmedOrder.tipAmount.toFixed(2)} €</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:bold; margin-top:8px; border-top:1px solid #000; padding-top:6px;">
          <span>TOTAL:</span>
          <span>${lastConfirmedOrder.total.toFixed(2)} €</span>
        </div>
        <div style="margin-top:14px; text-align:center; font-size:11px;">
          Pago: ${lastConfirmedOrder.paymentMethod === PaymentMethod.STRIPE_CARD ? 'Tarjeta (Stripe Verificado)' : 'Efectivo en mesa'}<br>
          ¡Gracias por su visita a Bistro Gran Vía!
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  });

  btnDownload?.addEventListener('click', () => {
    if (!lastConfirmedOrder) return;
    const isInvoice = lastConfirmedOrder.receiptType === 'INVOICE';
    const content = JSON.stringify(lastConfirmedOrder, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${isInvoice ? 'Factura' : 'Ticket'}_${lastConfirmedOrder.orderNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Comprobante ${lastConfirmedOrder.orderNumber} descargado con éxito.`, 'success');
  });
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

  let invoiceDetails: { nifCif: string; legalName: string; address: string; email: string; } | undefined = undefined;
  if (currentReceiptType === 'INVOICE') {
    const nif = (document.getElementById('inv-nif') as HTMLInputElement)?.value.trim();
    const name = (document.getElementById('inv-name') as HTMLInputElement)?.value.trim();
    const address = (document.getElementById('inv-address') as HTMLInputElement)?.value.trim();
    const email = (document.getElementById('inv-email') as HTMLInputElement)?.value.trim();

    if (!nif || !name) {
      showToast('Por favor completa al menos el NIF/CIF y Razón Social para emitir la factura.', 'warning');
      return;
    }
    invoiceDetails = { nifCif: nif, legalName: name, address, email };
  }

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
      stripeToken: 'tok_visa_success',
      receiptType: currentReceiptType,
      invoiceDetails: invoiceDetails
    });

    const payMsg = createdOrder.paymentMethod === PaymentMethod.STRIPE_CARD
      ? '¡Pago con tarjeta verificado mediante Stripe!'
      : 'Cobro marcado en efectivo. El camarero cobrará en mesa.';

    const packNotice = createdOrder.packagingCost ? ` (Empaque Ley 7/2022: +${createdOrder.packagingCost.toFixed(2)} €)` : '';
    showToast(`🎉 ¡Comanda ${createdOrder.orderNumber} confirmada para la ${createdOrder.tableNumber}!${packNotice} ${payMsg}`, 'success');

    // Reset Cart
    currentCart = [];
    updateCartUI();

    // Close mobile cart drawer if open
    const cartPanel = document.getElementById('cart-panel');
    const backdrop = document.getElementById('cart-backdrop');
    cartPanel?.classList.remove('mobile-drawer-open');
    backdrop?.classList.remove('active');
    document.body.style.overflow = '';

    // Show Order Confirmation Popup & Receipt / Invoice
    showOrderConfirmedModal(createdOrder);

    // Reload menu to show updated stock
    menuCatalog = await services.menuRepo.getAll();
    renderMenu();
    allOrders = await services.orderRepo.findAll();
  } catch (error: any) {
    showToast(`❌ Error al procesar el pedido: ${error.message}`, 'danger');
  }
}

// Helper to translate order status across all views
function getTranslatedStatus(status: OrderStatus, t: any): string {
  switch (status) {
    case OrderStatus.PLACED: return t.statusPlaced || 'Pendiente';
    case OrderStatus.IN_KITCHEN: return t.statusCooking || 'En Cocina';
    case OrderStatus.READY_TO_SERVE: return t.statusReady || 'Listo';
    case OrderStatus.DELIVERED: return t.statusDelivered || 'Entregado';
    default: return status;
  }
}

// 10. Camarero: Comandas Board (Requisitos 2 y 3: Sin nombre de comensal, opción omitir asignación, bloqueo de entrega si pendiente efectivo)
function renderWaiterOrders() {
  waiterOrdersContainer.innerHTML = '';
  const t = translations[currentLanguage] || translations['es'];
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
          <!-- Requisito 2: Se elimina el nombre del comensal por privacidad estricta (RGPD) -->
          <div style="font-size:0.75rem; color:var(--text-muted);">${order.items.length} productos en comanda</div>
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

      <!-- Staff assignment (Omitible según Requisito 3) -->
      ${!skipStaffAssignment ? `
        <div class="order-staff-row">
          <div>🏃 ${t.roleWaiter || 'Camarero'}: <strong>${order.waiterName || 'Sin asignar'}</strong></div>
          <div>👨‍🍳 ${t.roleChef || 'Cocinero'}: <strong>${order.chefName || 'Sin asignar'}</strong></div>
        </div>
      ` : ''}

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:0.82rem;">
        <div>Estado: <strong style="color:var(--accent-orange);">${getTranslatedStatus(order.status, t)}</strong></div>
        <div>Pago: <strong style="color:${isPaid ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">${order.paymentStatus}</strong></div>
      </div>

      <div class="order-actions-bar">
        ${(!skipStaffAssignment && !order.waiterId) ? `
          <button class="btn-action btn-waiter-deliver btn-assign-waiter" data-id="${order.id}">
            🏃 Atender comanda
          </button>
        ` : ''}

        ${order.status === OrderStatus.READY_TO_SERVE ? (
          isPendingCash ? `
            <div style="font-size:0.8rem; color:#ef4444; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-sm); padding:6px 10px; font-weight:700; width:100%;">
              ⚠️ Bloqueo de entrega: Pendiente de cobro en efectivo en sala
            </div>
          ` : `
            <button class="btn-action btn-kitchen-ready btn-mark-delivered" data-id="${order.id}">
              🍽️ Entregar a mesa
            </button>
          `
        ) : ''}

        ${isPendingCash ? `
          <button class="btn-action btn-waiter-cash btn-confirm-cash" data-id="${order.id}" style="background:var(--accent-amber); color:#000; font-weight:700;">
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
      // Requisito 3: Bloqueo estricto de entrega si pendiente en efectivo
      if (order.paymentStatus === PaymentStatus.PENDING_CASH) {
        showToast('⚠️ No se puede entregar a la mesa: la comanda tiene pendiente el cobro en efectivo.', 'warning');
        return;
      }
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

// 11. Cocina: Kitchen Display System (KDS) (Requisito 3: Bloqueo de cocción si pendiente de pago en efectivo)
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
    const isPendingCash = order.paymentStatus === PaymentStatus.PENDING_CASH;

    const t = translations[currentLanguage] || translations['es'];
    card.innerHTML = `
      <div class="order-header">
        <div>
          <div class="order-num" style="color:#ef4444;">${order.orderNumber}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${order.tableNumber} • Creado hace instantes</div>
        </div>
        <span class="badge-tag tag-cooking">${getTranslatedStatus(order.status, t)}</span>
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

      <!-- Staff assignment (Omitible según Requisito 3) -->
      ${!skipStaffAssignment ? `
        <div class="order-staff-row">
          <div>👨‍🍳 Cocinero asignado: <strong>${order.chefName || 'Sin asignar'}</strong></div>
        </div>
      ` : ''}

      <div class="order-actions-bar">
        ${(!skipStaffAssignment && !order.chefId) ? `
          <button class="btn-action btn-kitchen-start btn-assign-chef" data-id="${order.id}">
            👨‍🍳 Asignarme
          </button>
        ` : ''}

        ${order.status === OrderStatus.PLACED ? (
          isPendingCash ? `
            <div style="font-size:0.8rem; color:#ef4444; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-sm); padding:8px 12px; font-weight:700; width:100%;">
              ⚠️ Esperando cobro en efectivo en sala: No puede pasar a cocina hasta que sea cobrado.
            </div>
          ` : `
            <button class="btn-action btn-kitchen-start btn-start-cook" data-id="${order.id}">
              🔥 Empezar a Cocinar
            </button>
          `
        ) : ''}

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
      // Requisito 3: Bloqueo estricto de inicio de preparación si pendiente en efectivo
      if (order.paymentStatus === PaymentStatus.PENDING_CASH) {
        showToast('⚠️ No se puede iniciar la preparación: El pedido debe ser cobrado previamente en efectivo por el camarero.', 'warning');
        return;
      }
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
  const t = translations[currentLanguage] || translations['es'];

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
    tr.className = 'stock-table-row';
    tr.innerHTML = `
      <td class="stock-td-info">
        <div class="stock-title-badge-wrap">
          <strong class="stock-item-name">${item.name}</strong>
          <span class="badge-tag tag-direct stock-inline-category">${item.category}</span>
        </div>
        ${item.allergens && item.allergens.length > 0 ? `<div class="stock-item-allergens" style="font-size:0.72rem; color:#f472b6; margin-top:3px;">⚠️ ${t.allergens || 'Alérgenos'}: ${item.allergens.map((a: string) => `${getAllergenIcon(a)} ${a}`).join(', ')}</div>` : ''}
      </td>
      <td class="stock-td-category-desktop"><span class="badge-tag tag-direct">${item.category}</span></td>
      <td class="stock-td-price">
        <span class="stock-cell-label">Precio (€):</span>
        <div class="stock-input-wrap">
          <input type="number" step="0.5" class="stock-input" id="price-input-${item.id}" value="${item.price.toFixed(2)}" min="0" style="width:75px;">
          <span class="stock-currency-symbol">€</span>
        </div>
      </td>
      <td class="stock-td-stock">
        <span class="stock-cell-label">Stock:</span>
        <input type="number" class="stock-input" id="stock-input-${item.id}" value="${item.stock}" min="0" style="width:70px;">
      </td>
      <td class="stock-td-actions">
        <div class="stock-actions-flex">
          <button class="btn-action btn-edit-product-full" data-id="${item.id}" title="Editar Información Completa del Plato" style="padding:6px 10px; font-size:0.76rem; background:linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color:#fff; border:none; border-radius:var(--radius-sm); cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-weight:600; box-shadow:0 2px 6px rgba(37,99,235,0.35);">
            ✏️ Editar
          </button>
          <button class="btn-action btn-waiter-deliver btn-save-item" data-id="${item.id}" title="Guardar Cambios Rápidos de Precio y Stock" style="padding:6px 10px; font-size:0.76rem;">
            💾 Guardar
          </button>
        </div>
      </td>
    `;

    tr.querySelector('.btn-edit-product-full')?.addEventListener('click', () => {
      openProductEditorModal(item);
    });

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

  // User Management Cards (Compact Profile Cards: Foto, Nombre, Cargo, Estado, Email, ID/Login)
  const usersGrid = document.getElementById('users-cards-grid');
  if (usersGrid) {
    usersGrid.innerHTML = '';
    const staffOnly = allUsers.filter(u => u.role !== UserRole.CUSTOMER);
    staffOnly.forEach(u => {
      // Role details and colors
      let roleLabel = 'Personal';
      let roleTagClass = 'tag-direct';
      let roleBorder = '#3b82f6';
      let defaultAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

      if (u.role === UserRole.MANAGER) {
        roleLabel = '🛡️ Gerente';
        roleTagClass = 'tag-stock';
        roleBorder = '#10b981';
        defaultAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80';
      } else if (u.role === UserRole.CHEF) {
        roleLabel = '👨‍🍳 Cocinero';
        roleTagClass = 'tag-cooking';
        roleBorder = '#ef4444';
        defaultAvatar = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80';
      } else if (u.role === UserRole.WAITER) {
        roleLabel = '🏃 Camarero';
        roleTagClass = 'tag-direct';
        roleBorder = '#3b82f6';
        defaultAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
      }

      const avatarSrc = u.avatarUrl || defaultAvatar;

      const card = document.createElement('div');
      card.className = 'user-profile-card';
      card.innerHTML = `
        <div class="user-card-header">
          <div class="user-avatar-wrap">
            <img src="${avatarSrc}" alt="${u.name}" class="user-avatar-img" style="border-color:${roleBorder};" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=334155&color=fff&bold=true'">
            <span class="user-status-dot ${u.active ? 'active' : 'inactive'}" title="${u.active ? 'Usuario Activo' : 'Usuario Inactivo'}"></span>
          </div>
          <div class="user-card-info">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
              <h4 class="user-card-name" title="${u.name}">${u.name}</h4>
              <button class="btn-action btn-edit-user" data-id="${u.id}" title="Editar Empleado" style="padding:2px 7px; font-size:0.72rem; background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; border-radius:4px; cursor:pointer; font-weight:600; flex-shrink:0; display:inline-flex; align-items:center; gap:3px;">
                ✏️ Editar
              </button>
            </div>
            <div class="user-card-meta">
              <span class="badge-tag ${roleTagClass}" style="font-size:0.72rem; padding:2px 7px;">${roleLabel}</span>
              <span class="badge-tag ${u.active ? 'tag-stock' : 'tag-cooking'}" style="font-size:0.68rem; padding:1px 6px;">
                ${u.active ? 'ACTIVO' : 'INACTIVO'}
              </span>
            </div>
          </div>
        </div>

        <div class="user-card-details">
          <div class="user-detail-row">
            <span style="font-size:0.85rem;">✉️</span>
            <span style="color:var(--text-main); font-weight:500;">${u.email}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-top:2px;">
            <div style="display:flex; align-items:center; gap:5px; color:var(--text-muted);">
              <span>🔑</span>
              <span>Login:</span>
              <span class="user-login-badge">${u.username || u.id}</span>
            </div>
            <span style="font-family:'JetBrains Mono',monospace; font-size:0.7rem; color:var(--text-muted); opacity:0.8;" title="ID Interno">${u.id}</span>
          </div>
        </div>
      `;

      card.querySelector('.btn-edit-user')?.addEventListener('click', () => {
        openUserEditorModal(u);
      });

      usersGrid.appendChild(card);
    });
  }
  // Operational Settings (Requisito 3)
  const chkSkip = document.getElementById('chk-skip-staff-assignment') as HTMLInputElement;
  if (chkSkip) {
    chkSkip.checked = skipStaffAssignment;
    chkSkip.onchange = () => {
      skipStaffAssignment = chkSkip.checked;
      localStorage.setItem('DND_SKIP_STAFF_ASSIGN', skipStaffAssignment ? 'true' : 'false');
      showToast(
        skipStaffAssignment 
          ? 'Flujo operativo: asignación obligatoria a personal omitida.'
          : 'Flujo operativo: asignación obligatoria a personal requerida.',
        'info'
      );
      if (currentUser.role === UserRole.WAITER) renderWaiterOrders();
      if (currentUser.role === UserRole.CHEF) renderChefOrders();
    };
  }
}

// 13. Setup Manager Modals: Añadir Usuario y Añadir Producto al Stock (Requisito 4)
function setupManagerModals() {
  // Modal Añadir / Editar Usuario
  const modalAddUser = document.getElementById('add-user-modal')!;
  const btnOpenAddUser = document.getElementById('btn-open-add-user');
  const btnCloseAddUser = document.getElementById('btn-close-add-user-modal');
  const btnCancelAddUser = document.getElementById('btn-cancel-add-user');
  const formAddUser = document.getElementById('add-user-form') as HTMLFormElement;
  const editUserIdInput = document.getElementById('edit-user-id') as HTMLInputElement;
  const userModalTitle = document.getElementById('user-modal-title');
  const userModalSubtitle = document.getElementById('user-modal-subtitle');
  const btnSubmitUser = document.getElementById('btn-submit-user') as HTMLButtonElement;
  const userActiveWrap = document.getElementById('user-active-wrap');
  const editUserActive = document.getElementById('edit-user-active') as HTMLInputElement;
  const passwordInput = document.getElementById('new-user-password') as HTMLInputElement;
  const passwordLabel = document.getElementById('lbl-user-password');

  function closeAddUserModal() {
    modalAddUser.style.display = 'none';
  }

  openUserEditorModal = (user?: User) => {
    formAddUser.reset();
    if (user) {
      if (editUserIdInput) editUserIdInput.value = user.id;
      if (userModalTitle) userModalTitle.textContent = `✏️ Editar Empleado: ${user.name}`;
      if (userModalSubtitle) {
        userModalSubtitle.textContent = 'Modifica los datos del empleado. Deja la contraseña en blanco si deseas conservar la actual.';
      }
      if (btnSubmitUser) btnSubmitUser.textContent = '💾 Guardar Cambios';

      (document.getElementById('new-user-name') as HTMLInputElement).value = user.name;
      (document.getElementById('new-user-username') as HTMLInputElement).value = user.username || '';
      (document.getElementById('new-user-email') as HTMLInputElement).value = user.email;
      (document.getElementById('new-user-role') as HTMLSelectElement).value = user.role;
      (document.getElementById('new-user-avatar') as HTMLInputElement).value = user.avatarUrl || '';

      if (userActiveWrap) userActiveWrap.style.display = 'flex';
      if (editUserActive) editUserActive.checked = user.active !== false;

      passwordInput.required = false;
      passwordInput.placeholder = '•••••••• (Dejar en blanco para conservar actual)';
      if (passwordLabel) {
        passwordLabel.textContent = 'Contraseña de Acceso (opcional para mantener):';
      }
    } else {
      if (editUserIdInput) editUserIdInput.value = '';
      if (userModalTitle) userModalTitle.textContent = '👤 Registrar Nuevo Empleado';
      if (userModalSubtitle) {
        userModalSubtitle.textContent = 'Añade un nuevo miembro al equipo interno del restaurante. Por política estricta de privacidad (RGPD), no se admiten roles de cliente.';
      }
      if (btnSubmitUser) btnSubmitUser.textContent = '💾 Guardar Empleado';

      if (userActiveWrap) userActiveWrap.style.display = 'none';
      if (editUserActive) editUserActive.checked = true;

      passwordInput.required = true;
      passwordInput.placeholder = '••••••••';
      if (passwordLabel) {
        passwordLabel.textContent = 'Contraseña de Acceso:';
      }
    }
    modalAddUser.style.display = 'flex';
  };

  btnOpenAddUser?.addEventListener('click', () => {
    openUserEditorModal();
  });

  btnCloseAddUser?.addEventListener('click', closeAddUserModal);
  btnCancelAddUser?.addEventListener('click', closeAddUserModal);

  formAddUser?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEditing = Boolean(editUserIdInput && editUserIdInput.value.trim());
    const targetUserId = isEditing ? editUserIdInput.value.trim() : '';

    const name = (document.getElementById('new-user-name') as HTMLInputElement).value.trim();
    const username = (document.getElementById('new-user-username') as HTMLInputElement).value.trim();
    const email = (document.getElementById('new-user-email') as HTMLInputElement).value.trim();
    const roleVal = (document.getElementById('new-user-role') as HTMLSelectElement).value;
    const password = passwordInput.value.trim();
    const isActive = editUserActive ? editUserActive.checked : true;

    if (!name || !username || !email) {
      showToast('Por favor completa los campos obligatorios del empleado.', 'warning');
      return;
    }

    if (!isEditing && !password) {
      showToast('Por favor ingresa una contraseña para el nuevo empleado.', 'warning');
      return;
    }

    // Role check: Only internal staff allowed (RGPD Privacy)
    if (roleVal !== UserRole.WAITER && roleVal !== UserRole.CHEF && roleVal !== UserRole.MANAGER) {
      showToast('Rol no permitido: solo se pueden registrar empleados internos.', 'danger');
      return;
    }

    const avatarInput = (document.getElementById('new-user-avatar') as HTMLInputElement)?.value.trim();
    let defaultAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
    if (roleVal === UserRole.MANAGER) {
      defaultAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80';
    } else if (roleVal === UserRole.CHEF) {
      defaultAvatar = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80';
    }

    try {
      if (isEditing) {
        const existingUser = allUsers.find(u => u.id === targetUserId);
        if (!existingUser) {
          showToast('No se encontró el empleado a editar.', 'danger');
          return;
        }

        const updatedUser: User = {
          ...existingUser,
          name,
          username,
          email,
          role: roleVal as UserRole,
          active: isActive,
          avatarUrl: avatarInput || existingUser.avatarUrl || defaultAvatar,
          password: password ? password : existingUser.password
        };

        await services.userRepo.update(updatedUser);
        allUsers = await services.userRepo.getAll();

        if (currentUser.id === updatedUser.id) {
          currentUser = updatedUser;
          sessionStorage.setItem('DND_LOGGED_USER', JSON.stringify(currentUser));
        }

        renderManagerDashboard();
        closeAddUserModal();
        showToast(`¡Empleado ${updatedUser.name} actualizado con éxito!`, 'success');
      } else {
        const avatarUrl = avatarInput || defaultAvatar;
        const newUser: User = {
          id: `usr_${Date.now()}`,
          name,
          username,
          email,
          role: roleVal as UserRole,
          password,
          active: true,
          avatarUrl
        };

        await services.userRepo.create(newUser);
        allUsers = await services.userRepo.getAll();
        renderManagerDashboard();
        closeAddUserModal();
        showToast(`¡Empleado ${newUser.name} registrado con éxito como ${newUser.role}!`, 'success');
      }
    } catch (err: any) {
      showToast(`Error al guardar empleado: ${err.message}`, 'danger');
    }
  });

  // Modal Añadir / Editar Producto en la Carta con Traducción a 14 Idiomas e Imágenes Multi-Dispositivo
  const modalAddProduct = document.getElementById('add-product-modal')!;
  const btnOpenAddProduct = document.getElementById('btn-open-add-product');
  const btnCloseAddProduct = document.getElementById('btn-close-add-product-modal');
  const btnCancelAddProduct = document.getElementById('btn-cancel-add-product');
  const formAddProduct = document.getElementById('add-product-form') as HTMLFormElement;
  const editProductIdInput = document.getElementById('edit-product-id') as HTMLInputElement;
  const productModalTitle = document.getElementById('product-modal-title');
  const productModalSubtitle = document.getElementById('product-modal-subtitle');
  const btnSubmitProduct = document.getElementById('btn-submit-product') as HTMLButtonElement;
  const btnAutoTranslate = document.getElementById('btn-auto-translate-dish');
  const fileImgInput = document.getElementById('new-product-file') as HTMLInputElement;
  const urlImgInput = document.getElementById('new-product-image-url') as HTMLInputElement;
  const previewImg = document.getElementById('new-product-img-preview') as HTMLImageElement;
  const transStatusEl = document.getElementById('translation-status');
  let uploadedDishDataUrl: string = '';

  const ALL_ADD_LANGS = [
    { code: 'en', flag: '🇬🇧', name: 'English' },
    { code: 'fr', flag: '🇫🇷', name: 'Français' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
    { code: 'zh', flag: '🇨🇳', name: '中文' },
    { code: 'ko', flag: '🇰🇷', name: '한국어' },
    { code: 'uk', flag: '🇺🇦', name: 'Українська' },
    { code: 'pt', flag: '🇵🇹', name: 'Português' },
    { code: 'ja', flag: '🇯🇵', name: '日本語' },
    { code: 'ar', flag: '🇸🇦', name: 'العربية' },
    { code: 'ca', flag: '🟡🔴', name: 'Català' },
    { code: 'va', flag: '🔵🔴', name: 'Valencià' },
    { code: 'eu', flag: '🟢🔴', name: 'Euskara' },
    { code: 'gl', flag: '🔵⚪', name: 'Galego' }
  ];

  async function translateTextOnline(text: string, targetLang: string): Promise<string> {
    if (!text || !text.trim()) return '';
    const langMap: Record<string, string> = {
      zh: 'zh-CN',
      va: 'ca' // El valenciano comparte soporte lexicográfico con catalán en la API
    };
    const gtxLang = langMap[targetLang] || targetLang;
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${encodeURIComponent(gtxLang)}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((chunk: any) => chunk[0]).join('');
        return translated || text;
      }
      return text;
    } catch {
      return text; // Fallback seguro
    }
  }

  function initTranslationFields() {
    const container = document.getElementById('translations-inputs-container');
    if (!container) return;
    container.innerHTML = '';
    ALL_ADD_LANGS.forEach(l => {
      const block = document.createElement('div');
      block.style.background = 'var(--bg-dark)';
      block.style.padding = '8px 10px';
      block.style.borderRadius = 'var(--radius-sm)';
      block.style.border = '1px solid var(--border-subtle)';
      block.innerHTML = `
        <div style="font-size:0.78rem; font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
          <span>${l.flag}</span> <span>${l.name} (${l.code.toUpperCase()})</span>
        </div>
        <input type="text" id="trans-name-${l.code}" placeholder="Título en ${l.name}..." style="width:100%; padding:6px 8px; font-size:0.8rem; background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:4px; color:var(--text-main); margin-bottom:4px; outline:none;">
        <textarea id="trans-desc-${l.code}" rows="2" placeholder="Descripción en ${l.name}..." style="width:100%; padding:6px 8px; font-size:0.76rem; background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:4px; color:var(--text-main); resize:vertical; outline:none;"></textarea>
      `;
      container.appendChild(block);
    });
  }

  // Carga de archivo de imagen con previsualización
  fileImgInput?.addEventListener('change', () => {
    const file = fileImgInput.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        uploadedDishDataUrl = dataUrl;
        if (previewImg) previewImg.src = dataUrl;
        if (urlImgInput) urlImgInput.value = '';
      };
      reader.readAsDataURL(file);
    }
  });

  // URL directa de imagen
  urlImgInput?.addEventListener('input', () => {
    const val = urlImgInput.value.trim();
    if (val && previewImg) {
      uploadedDishDataUrl = '';
      previewImg.src = val;
    }
  });

  // Botón Traducir Automáticamente a 14 Idiomas
  btnAutoTranslate?.addEventListener('click', async () => {
    const nameVal = (document.getElementById('new-product-name') as HTMLInputElement).value.trim();
    const descVal = (document.getElementById('new-product-desc') as HTMLTextAreaElement).value.trim();
    const detailsEl = document.getElementById('details-translations') as HTMLDetailsElement;

    if (!nameVal) {
      showToast('Por favor escribe el nombre en español antes de solicitar la traducción.', 'warning');
      return;
    }

    if (transStatusEl) {
      transStatusEl.innerText = '⏳ Traduciendo a 14 idiomas...';
      transStatusEl.style.color = 'var(--accent-orange)';
    }

    try {
      const promises = ALL_ADD_LANGS.map(async (l) => {
        const tName = await translateTextOnline(nameVal, l.code);
        const tDesc = descVal ? await translateTextOnline(descVal, l.code) : '';
        const inName = document.getElementById(`trans-name-${l.code}`) as HTMLInputElement;
        const inDesc = document.getElementById(`trans-desc-${l.code}`) as HTMLTextAreaElement;
        if (inName) inName.value = tName;
        if (inDesc) inDesc.value = tDesc;
      });

      await Promise.all(promises);

      if (transStatusEl) {
        transStatusEl.innerText = '✅ ¡14 idiomas traducidos!';
        transStatusEl.style.color = '#34d399';
      }
      if (detailsEl) detailsEl.open = true;
      showToast('¡Nombre y descripción traducidos con éxito a los 14 idiomas!', 'success');
    } catch {
      if (transStatusEl) transStatusEl.innerText = '⚠️ Error parcial al conectar con el traductor.';
    }
  });

  openProductEditorModal = (item?: MenuItem) => {
    formAddProduct.reset();
    uploadedDishDataUrl = '';
    if (fileImgInput) fileImgInput.value = '';

    if (item) {
      // Modo Edición
      if (editProductIdInput) editProductIdInput.value = item.id;
      if (productModalTitle) productModalTitle.innerText = `✏️ Editar Producto: ${item.name}`;
      if (productModalSubtitle) productModalSubtitle.innerText = 'Modifica los datos, descripciones, traducciones a los 14 idiomas, alérgenos, categoría o imágenes del plato seleccionado.';
      if (btnSubmitProduct) btnSubmitProduct.innerText = '💾 Guardar Cambios';

      (document.getElementById('new-product-name') as HTMLInputElement).value = item.name;
      (document.getElementById('new-product-desc') as HTMLTextAreaElement).value = item.description;
      (document.getElementById('new-product-category') as HTMLSelectElement).value = item.category;
      (document.getElementById('new-product-price') as HTMLInputElement).value = item.price.toString();
      (document.getElementById('new-product-stock') as HTMLInputElement).value = item.stock.toString();
      (document.getElementById('new-product-cooking') as HTMLInputElement).checked = Boolean(item.requiresCooking);
      (document.getElementById('new-product-vegan') as HTMLInputElement).checked = Boolean(item.isVegan);
      (document.getElementById('new-product-veg') as HTMLInputElement).checked = Boolean(item.isVegetarian);
      (document.getElementById('new-product-0alcohol') as HTMLInputElement).checked = Boolean(item.isAlcoholFree);

      const responsiveImgs = getResponsiveImages(item);
      if (previewImg) previewImg.src = responsiveImgs.thumbnail || responsiveImgs.large || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=240';
      if (urlImgInput) urlImgInput.value = item.imageUrl || responsiveImgs.large || '';
      const thumbIn = document.getElementById('new-product-img-thumb') as HTMLInputElement;
      const medIn = document.getElementById('new-product-img-medium') as HTMLInputElement;
      const largeIn = document.getElementById('new-product-img-large') as HTMLInputElement;
      if (thumbIn) thumbIn.value = item.images?.thumbnail || '';
      if (medIn) medIn.value = item.images?.medium || '';
      if (largeIn) largeIn.value = item.images?.large || '';

      const allergenCheckboxes = document.querySelectorAll<HTMLInputElement>('input[name="new-product-allergen"]');
      allergenCheckboxes.forEach(cb => {
        cb.checked = item.allergens ? item.allergens.includes(cb.value) : false;
      });

      initTranslationFields();
      ALL_ADD_LANGS.forEach(l => {
        const transObj = (item.translations as any)?.[l.code];
        const inName = document.getElementById(`trans-name-${l.code}`) as HTMLInputElement;
        const inDesc = document.getElementById(`trans-desc-${l.code}`) as HTMLTextAreaElement;
        if (inName) inName.value = transObj?.name || '';
        if (inDesc) inDesc.value = transObj?.description || '';
      });

      if (transStatusEl) {
        transStatusEl.innerText = 'Traducciones cargadas para edición.';
        transStatusEl.style.color = 'var(--text-muted)';
      }
    } else {
      // Modo Añadir Nuevo
      if (editProductIdInput) editProductIdInput.value = '';
      if (productModalTitle) productModalTitle.innerText = '🍽️ Añadir Nuevo Producto / Plato';
      if (productModalSubtitle) productModalSubtitle.innerText = 'Incorpora un nuevo plato a la carta con stock inicial, traducción automática a los 14 idiomas soportados, imágenes optimizadas para móvil/tablet/escritorio y ficha de alérgenos.';
      if (btnSubmitProduct) btnSubmitProduct.innerText = '💾 Incorporar a Carta';

      if (previewImg) previewImg.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=240';
      if (urlImgInput) urlImgInput.value = '';
      const thumbIn = document.getElementById('new-product-img-thumb') as HTMLInputElement;
      const medIn = document.getElementById('new-product-img-medium') as HTMLInputElement;
      const largeIn = document.getElementById('new-product-img-large') as HTMLInputElement;
      if (thumbIn) thumbIn.value = '';
      if (medIn) medIn.value = '';
      if (largeIn) largeIn.value = '';
      if (transStatusEl) transStatusEl.innerText = '';
      (document.getElementById('new-product-cooking') as HTMLInputElement).checked = true;

      const allergenCheckboxes = document.querySelectorAll<HTMLInputElement>('input[name="new-product-allergen"]');
      allergenCheckboxes.forEach(cb => { cb.checked = false; });

      initTranslationFields();
    }

    modalAddProduct.style.display = 'flex';
  };

  btnOpenAddProduct?.addEventListener('click', () => {
    openProductEditorModal();
  });

  function closeAddProductModal() {
    modalAddProduct.style.display = 'none';
  }

  btnCloseAddProduct?.addEventListener('click', closeAddProductModal);
  btnCancelAddProduct?.addEventListener('click', closeAddProductModal);

  formAddProduct?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEditing = Boolean(editProductIdInput && editProductIdInput.value.trim());
    const editingId = editProductIdInput ? editProductIdInput.value.trim() : '';

    const name = (document.getElementById('new-product-name') as HTMLInputElement).value.trim();
    const description = (document.getElementById('new-product-desc') as HTMLTextAreaElement).value.trim();
    const category = (document.getElementById('new-product-category') as HTMLSelectElement).value as MenuCategory;
    const price = parseFloat((document.getElementById('new-product-price') as HTMLInputElement).value);
    const stock = parseInt((document.getElementById('new-product-stock') as HTMLInputElement).value, 10);
    const requiresCooking = (document.getElementById('new-product-cooking') as HTMLInputElement).checked;
    const isVegan = (document.getElementById('new-product-vegan') as HTMLInputElement).checked;
    const isVegetarian = (document.getElementById('new-product-veg') as HTMLInputElement).checked;
    const isAlcoholFree = (document.getElementById('new-product-0alcohol') as HTMLInputElement).checked;

    if (!name || isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
      showToast('Por favor introduce datos válidos para el producto (precio y stock no negativos).', 'warning');
      return;
    }

    const allergenCheckboxes = document.querySelectorAll<HTMLInputElement>('input[name="new-product-allergen"]:checked');
    const allergens = Array.from(allergenCheckboxes).map(cb => cb.value);

    // Imágenes multi-dispositivo (Móvil, Tablet, Escritorio)
    const primaryImg = uploadedDishDataUrl || urlImgInput.value.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&auto=format&fit=crop&q=80';
    const customThumb = (document.getElementById('new-product-img-thumb') as HTMLInputElement)?.value.trim();
    const customMed = (document.getElementById('new-product-img-medium') as HTMLInputElement)?.value.trim();
    const customLarge = (document.getElementById('new-product-img-large') as HTMLInputElement)?.value.trim();

    const isDataUrl = primaryImg.startsWith('data:');
    const baseCleanUrl = isDataUrl ? primaryImg : primaryImg.split('?')[0];

    const responsiveImages = {
      thumbnail: customThumb || (isDataUrl ? primaryImg : `${baseCleanUrl}?w=240&h=240&fit=crop&q=80`),
      medium: customMed || (isDataUrl ? primaryImg : `${baseCleanUrl}?w=600&h=380&fit=crop&q=80`),
      large: customLarge || (isDataUrl ? primaryImg : `${baseCleanUrl}?w=900&h=550&fit=crop&q=85`)
    };

    // Traducción completa a los 14 idiomas garantizada
    const dishTranslations: Record<string, { name: string; description: string }> = {
      es: { name, description }
    };

    for (const l of ALL_ADD_LANGS) {
      const inName = (document.getElementById(`trans-name-${l.code}`) as HTMLInputElement)?.value.trim();
      const inDesc = (document.getElementById(`trans-desc-${l.code}`) as HTMLTextAreaElement)?.value.trim();
      if (inName) {
        dishTranslations[l.code] = {
          name: inName,
          description: inDesc || description
        };
      } else {
        // Traducción automática al vuelo si el usuario no pulsó el botón
        const autoName = await translateTextOnline(name, l.code);
        const autoDesc = description ? await translateTextOnline(description, l.code) : '';
        dishTranslations[l.code] = {
          name: autoName || name,
          description: autoDesc || description
        };
      }
    }

    if (isEditing) {
      const existing = menuCatalog.find(i => i.id === editingId);
      if (!existing) {
        showToast('Error: No se encontró el plato para editar.', 'danger');
        return;
      }
      const updatedDish: MenuItem = {
        ...existing,
        name,
        description,
        price,
        category,
        stock,
        requiresCooking,
        isVegan,
        isVegetarian,
        isAlcoholFree,
        allergens,
        imageUrl: responsiveImages.large,
        images: responsiveImages,
        translations: dishTranslations
      };
      try {
        await services.menuRepo.updateItem(updatedDish);
        menuCatalog = await services.menuRepo.getAll();
        updateLanguageSelectorOptions();
        renderManagerDashboard();
        renderMenu();
        closeAddProductModal();
        showToast(`¡Plato "${updatedDish.name}" actualizado con éxito!`, 'success');
      } catch (err: any) {
        showToast(`Error al actualizar el plato: ${err.message}`, 'danger');
      }
    } else {
      const newDish: MenuItem = {
        id: `item_custom_${Date.now()}`,
        name,
        description,
        price,
        category,
        stock,
        requiresCooking,
        isVegan,
        isVegetarian,
        isAlcoholFree,
        allergens,
        imageUrl: responsiveImages.large,
        images: responsiveImages,
        translations: dishTranslations
      };

      try {
        await services.menuRepo.createItem(newDish);
        menuCatalog = await services.menuRepo.getAll();
        updateLanguageSelectorOptions();
        renderManagerDashboard();
        renderMenu();
        closeAddProductModal();
        showToast(`¡Plato "${newDish.name}" incorporado con éxito con traducción a 14 idiomas e imágenes adaptadas!`, 'success');
      } catch (err: any) {
        showToast(`Error al crear producto: ${err.message}`, 'danger');
      }
    }
  });
}

// 14. Realtime Subscriptions & Refresh
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
  setupThemeSelector();
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
  setupMobileCartDrawer();
  setupExportReport();
  setupManagerModals();
  setupConfirmedOrderModal();

  renderMenu();
  updateCartUI();
}

initApp();
