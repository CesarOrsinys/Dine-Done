import { RepositoryContainer } from '../../adapters/infrastructure/di/RepositoryContainer.js';
import { UserRole } from '../../core/domain/enums/UserRole.js';
import { AppState } from '../state/AppState.js';
import { translations, availableStaffRoles, getTranslatedRole } from '../i18n/LanguageManager.js';
import { showToast } from '../services/ToastService.js';
import { updateTableControlsVisibility } from './TableComponent.js';

type ViewRenderer = () => void | Promise<void>;

let onRenderMenu: ViewRenderer | null = null;
let onRenderWaiter: ViewRenderer | null = null;
let onRenderChef: ViewRenderer | null = null;
let onRenderManager: ViewRenderer | null = null;

export function registerViewRenderers(renderers: {
  renderMenu: ViewRenderer;
  renderWaiter: ViewRenderer;
  renderChef: ViewRenderer;
  renderManager: ViewRenderer;
}) {
  onRenderMenu = renderers.renderMenu;
  onRenderWaiter = renderers.renderWaiter;
  onRenderChef = renderers.renderChef;
  onRenderManager = renderers.renderManager;
}

export function updateRoleSwitcherVisibility() {
  const staffSwitcher = document.getElementById('staff-role-switcher');
  const btnWaiter = document.querySelector('.role-btn.role-waiter') as HTMLElement;
  const btnChef = document.querySelector('.role-btn.role-chef') as HTMLElement;
  const btnManager = document.querySelector('.role-btn.role-manager') as HTMLElement;

  if (!AppState.authenticatedStaffUser) {
    if (staffSwitcher) staffSwitcher.style.display = 'none';
    return;
  }

  if (staffSwitcher) staffSwitcher.style.display = 'flex';

  const userRole = AppState.authenticatedStaffUser.role;

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

export async function switchRole(role: UserRole | string) {
  const services = RepositoryContainer.getServices();
  const curT = translations[AppState.currentLanguage] || translations['es'];
  
  // Resolve base role for RBAC if custom hospitality role
  const staffRoleCfg = availableStaffRoles.find(
    sr => sr.id.toUpperCase() === (role || '').toUpperCase() || sr.name.toUpperCase() === (role || '').toUpperCase()
  );
  const baseRole = staffRoleCfg ? staffRoleCfg.baseRole : role;

  // Authorization check (RBAC Security)
  if (role !== UserRole.CUSTOMER) {
    if (!AppState.authenticatedStaffUser) {
      showToast(curT.toastAccessDeniedStaff || 'Acceso denegado: debes iniciar sesión como personal.', 'danger');
      return;
    }
    const authStaffCfg = availableStaffRoles.find(
      sr => sr.id.toUpperCase() === (AppState.authenticatedStaffUser!.role || '').toUpperCase()
    );
    const authBaseRole = authStaffCfg ? authStaffCfg.baseRole : AppState.authenticatedStaffUser.role;

    if (authBaseRole === UserRole.WAITER && baseRole !== UserRole.WAITER) {
      showToast(curT.toastAccessRestrictedWaiters || 'Acceso restringido: los camareros solo tienen acceso a su panel de sala.', 'warning');
      return;
    }
    if (authBaseRole === UserRole.CHEF && baseRole !== UserRole.CHEF) {
      showToast(curT.toastAccessRestrictedChefs || 'Acceso restringido: los cocineros no tienen acceso a la pestaña de camarero ni de gerente.', 'warning');
      return;
    }
    // Gerente (MANAGER) tiene acceso a todo
  }

  // Update currentUser matching role
  const foundUser = (role === UserRole.CUSTOMER)
    ? {
        id: 'guest_customer',
        name: curT.roleCustomer || 'Comensal en Sala',
        email: 'comensal@restaurante.local',
        role: UserRole.CUSTOMER,
        active: true
      }
    : (AppState.authenticatedStaffUser && AppState.authenticatedStaffUser.role === role)
      ? AppState.authenticatedStaffUser
      : AppState.allUsers.find(u => u.role === role) || {
          id: `usr_${role.toLowerCase()}`,
          name: baseRole === UserRole.WAITER ? 'David García' : baseRole === UserRole.CHEF ? 'Antonio Martín' : 'César Orsinys',
          email: `${role.toLowerCase()}@dinedone.com`,
          role: role as UserRole,
          active: true
        };

  AppState.currentUser = foundUser;

  // Header update
  const uNameEl = document.getElementById('header-user-name');
  if (uNameEl) uNameEl.innerText = AppState.currentUser.name;
  const uRoleEl = document.getElementById('header-user-role');
  if (uRoleEl) uRoleEl.innerText = `${curT.roleLabel || 'Rol'}: ${getTranslatedRole(AppState.currentUser.role, AppState.currentLanguage, curT)}`;

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
  const viewMap: Record<string, string> = {
    [UserRole.CUSTOMER]: 'view-customer',
    [UserRole.WAITER]: 'view-waiter',
    [UserRole.CHEF]: 'view-chef',
    [UserRole.MANAGER]: 'view-manager'
  };
  const targetViewId = viewMap[role] || viewMap[baseRole] || 'view-customer';
  document.getElementById(targetViewId)?.classList.add('active-view');

  // Update staff table controls visibility
  updateTableControlsVisibility();

  // Responsive mobile cart bar visibility
  const mobileCartBar = document.getElementById('mobile-cart-bar');
  if (mobileCartBar) {
    const totalCount = AppState.currentCart.reduce((acc, c) => acc + c.quantity, 0);
    mobileCartBar.style.display = (role === UserRole.CUSTOMER && totalCount > 0) ? 'flex' : 'none';
  }
  const cartPanel = document.getElementById('cart-panel');
  const backdrop = document.getElementById('cart-backdrop');
  cartPanel?.classList.remove('mobile-drawer-open');
  backdrop?.classList.remove('active');
  document.body.style.overflow = '';

  // Trigger role-specific rendering (Lazy loading de datos según el Rol autenticado)
  if (role === UserRole.CUSTOMER) {
    if (onRenderMenu) onRenderMenu();
  } else if (role === UserRole.WAITER) {
    AppState.allOrders = await services.orderRepo.findAll();
    if (onRenderWaiter) onRenderWaiter();
  } else if (role === UserRole.CHEF) {
    AppState.allOrders = await services.orderRepo.findAll();
    if (onRenderChef) onRenderChef();
  } else if (role === UserRole.MANAGER) {
    AppState.allOrders = await services.orderRepo.findAll();
    AppState.allUsers = await services.userRepo.getAll();
    if (onRenderManager) onRenderManager();
  }
}

export function setupRoleSwitcher() {
  const roleButtons = document.querySelectorAll('.role-btn');
  roleButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const selectedRole = btn.getAttribute('data-role') as UserRole;
      await switchRole(selectedRole);
    });
  });
}
