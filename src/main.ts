import { UserRole } from './core/domain/enums/UserRole.js';
import { AppState } from './ui/state/AppState.js';
import { services } from './ui/services/UseCasesService.js';
import { setupThemeSelector } from './ui/services/ThemeService.js';
import { applyBusinessBranding } from './ui/services/BrandingService.js';
import { initStripeCheckoutForm } from './ui/services/StripeCheckoutService.js';
import { setupExportReport } from './ui/services/ExportService.js';
import { setupLanguageSelector } from './ui/i18n/LanguageManager.js';
import { setupTableIdentification } from './ui/components/TableComponent.js';
import { setupRoleSwitcher } from './ui/components/RoleSwitcherComponent.js';
import { setupStaffAuth } from './ui/components/AuthComponent.js';
import { setupCategoryFilters, setupDietaryAndAllergenFilters, renderMenu } from './ui/components/MenuComponent.js';
import { setupCartControls, setupMobileCartDrawer, updateCartUI } from './ui/components/CartComponent.js';
import { setupConfirmedOrderModal, checkStripeRedirectSuccess } from './ui/components/OrderModalComponent.js';
import { setupManagerModals, renderManagerDashboard } from './ui/components/ManagerDashboardComponent.js';
import { renderWaiterOrders } from './ui/components/WaiterBoardComponent.js';
import { renderChefOrders } from './ui/components/KitchenKdsComponent.js';

// Realtime reactive push updates across role views
services.realtimeNotifier.subscribe((updatedOrder) => {
  if (AppState.currentUser.role === UserRole.CUSTOMER) return;

  const idx = AppState.allOrders.findIndex(o => o.id === updatedOrder.id);
  if (idx >= 0) {
    AppState.allOrders[idx] = updatedOrder;
  } else {
    AppState.allOrders.unshift(updatedOrder);
  }

  if (AppState.currentUser.role === UserRole.WAITER) renderWaiterOrders();
  if (AppState.currentUser.role === UserRole.CHEF) renderChefOrders();
  if (AppState.currentUser.role === UserRole.MANAGER) renderManagerDashboard();
});

// Orchestrate frontend modules initialization
async function initApp() {
  setupThemeSelector();
  applyBusinessBranding();
  setupTableIdentification();

  // Load public menu catalog at startup
  AppState.menuCatalog = await services.menuRepo.getAll();
  AppState.allOrders = [];
  AppState.allUsers = [];

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
  initStripeCheckoutForm();
  await checkStripeRedirectSuccess();
}

initApp();
