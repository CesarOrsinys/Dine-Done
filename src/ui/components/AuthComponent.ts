import { RepositoryContainer } from '../../adapters/infrastructure/di/RepositoryContainer.js';
import { UserRole } from '../../core/domain/enums/UserRole.js';
import { AppState } from '../state/AppState.js';
import { translations, getTranslatedRole } from '../i18n/LanguageManager.js';
import { showToast } from '../services/ToastService.js';
import { switchRole, updateRoleSwitcherVisibility } from './RoleSwitcherComponent.js';
import { updateTableControlsVisibility } from './TableComponent.js';

export function setupStaffAuth() {
  const services = RepositoryContainer.getServices();
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

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userVal = usernameInput.value.trim().toLowerCase();
    const passVal = passwordInput.value.trim();

    const submitBtn = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    if (submitBtn) submitBtn.disabled = true;

    try {
      // Secure server-side authentication
      const staffUser = await services.userRepo.authenticate(userVal, passVal);

      if (staffUser) {
        AppState.authenticatedStaffUser = staffUser;
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('DND_AUTH_STAFF', JSON.stringify(staffUser));
        }
        modal.style.display = 'none';
        btnLogin.style.display = 'none';
        btnLogout.style.display = 'flex';

        updateRoleSwitcherVisibility();
        await switchRole(staffUser.role);
        updateTableControlsVisibility();
        const curT = translations[AppState.currentLanguage] || translations['es'];
        const welcomeMsg = (curT.toastStaffWelcome || '¡Bienvenido, {name}! Acceso verificado como {role}.')
          .replace('{name}', staffUser.name)
          .replace('{role}', getTranslatedRole(staffUser.role, AppState.currentLanguage, curT));
        showToast(welcomeMsg, 'success');
      } else {
        if (errorMsg) {
          const curT = translations[AppState.currentLanguage] || translations['es'];
          errorMsg.innerText = curT.errInvalidCredentials || '❌ Credenciales no válidas. Revisa usuario y contraseña.';
          errorMsg.style.display = 'block';
        }
      }
    } catch (err: any) {
      console.error('Error during staff authentication:', err);
      if (errorMsg) {
        errorMsg.innerText = `❌ Error en login: ${err.message || 'Error de conexión'}`;
        errorMsg.style.display = 'block';
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  btnLogout?.addEventListener('click', async () => {
    AppState.authenticatedStaffUser = null;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('DND_AUTH_STAFF');
    }
    AppState.allOrders = [];
    AppState.allUsers = [];

    // Clear personal views from DOM
    const waiterGrid = document.getElementById('waiter-orders-grid');
    if (waiterGrid) waiterGrid.innerHTML = '';
    const chefGrid = document.getElementById('chef-orders-grid');
    if (chefGrid) chefGrid.innerHTML = '';
    const usersGrid = document.getElementById('users-cards-grid');
    if (usersGrid) usersGrid.innerHTML = '';

    updateRoleSwitcherVisibility();
    btnLogout.style.display = 'none';
    btnLogin.style.display = 'flex';

    const curT = translations[AppState.currentLanguage] || translations['es'];
    AppState.currentUser = {
      id: 'guest_customer',
      name: curT.roleCustomer || 'Comensal en Sala',
      email: 'comensal@restaurante.local',
      role: UserRole.CUSTOMER,
      active: true
    };

    await switchRole(UserRole.CUSTOMER);
    updateTableControlsVisibility();
    showToast(curT.toastStaffLogout || 'Sesión de empleado cerrada. Has vuelto al modo comensal.', 'info');
  });

  // Restaurar automáticamente la sesión del trabajador si ya estaba autenticado al recargar
  if (typeof sessionStorage !== 'undefined') {
    const savedStaffRaw = sessionStorage.getItem('DND_AUTH_STAFF');
    if (savedStaffRaw) {
      try {
        const staffUser = JSON.parse(savedStaffRaw);
        AppState.authenticatedStaffUser = staffUser;
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'flex';
        updateRoleSwitcherVisibility();
        switchRole(staffUser.role);
        updateTableControlsVisibility();
      } catch (err) {
        sessionStorage.removeItem('DND_AUTH_STAFF');
      }
    }
  }
}
