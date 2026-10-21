import restaurantConfig from '../../../mock_data/restaurant_config.json' with { type: 'json' };
import { UserRole } from '../../core/domain/enums/UserRole.js';
import { AppState } from '../state/AppState.js';
import { translations } from '../i18n/LanguageManager.js';
import { showToast } from './ToastService.js';
import { services, kpiUseCase } from './UseCasesService.js';
import { renderMenu } from '../components/MenuComponent.js';
import { renderWaiterOrders } from '../components/WaiterBoardComponent.js';
import { renderChefOrders } from '../components/KitchenKdsComponent.js';
import { renderManagerDashboard } from '../components/ManagerDashboardComponent.js';

export async function refreshAll() {
  AppState.menuCatalog = await services.menuRepo.getAll();

  if (AppState.currentUser.role === UserRole.CUSTOMER) {
    renderMenu();
  } else if (AppState.currentUser.role === UserRole.WAITER) {
    AppState.allOrders = await services.orderRepo.findAll();
    renderWaiterOrders();
  } else if (AppState.currentUser.role === UserRole.CHEF) {
    AppState.allOrders = await services.orderRepo.findAll();
    renderChefOrders();
  } else if (AppState.currentUser.role === UserRole.MANAGER) {
    AppState.allOrders = await services.orderRepo.findAll();
    AppState.allUsers = await services.userRepo.getAll();
    renderManagerDashboard();
  }
}

export function setupExportReport() {
  document.getElementById('btn-export-report')?.addEventListener('click', async () => {
    const report = await kpiUseCase.execute();
    const exportData = {
      restaurant: restaurantConfig.businessName,
      tagline: restaurantConfig.tagline,
      address: restaurantConfig.address,
      exportDate: new Date().toISOString(),
      report: report,
      menuSnapshot: AppState.menuCatalog,
      ordersSnapshot: AppState.allOrders
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${restaurantConfig.businessName.replace(/\s+/g, '_')}_InformeGerencial_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const t = translations[AppState.currentLanguage] || translations['es'];
    showToast(t.toastReportDownloaded || 'Informe gerencial descargado con éxito.', 'success');
  });

  document.getElementById('btn-refresh-waiter')?.addEventListener('click', () => {
    refreshAll();
    const t = translations[AppState.currentLanguage] || translations['es'];
    showToast(t.toastOrdersSynced || 'Comandas de sala sincronizadas.', 'info');
  });
}
