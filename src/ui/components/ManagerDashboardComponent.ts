import { MenuItem } from '../../core/domain/entities/MenuItem.js';
import { User } from '../../core/domain/entities/User.js';
import { MenuCategory } from '../../core/domain/enums/MenuCategory.js';
import { UserRole } from '../../core/domain/enums/UserRole.js';
import { renderFlagHtml } from '../../core/flags.js';
import { AppState } from '../state/AppState.js';
import {
  translations,
  availableStaffRoles,
  updateRoleSelectorOptions,
  getTranslatedRole,
  createNewStaffRole,
  translateTextOnline,
  updateLanguageSelectorOptions,
  StaffRoleConfig
} from '../i18n/LanguageManager.js';
import { getLocalizedAllergenDisplay, renderModalAllergensGrid } from '../i18n/AllergenHelper.js';
import { showToast } from '../services/ToastService.js';
import { services, kpiUseCase } from '../services/UseCasesService.js';
import { renderMenu, getResponsiveImages } from './MenuComponent.js';
import { renderWaiterOrders } from './WaiterBoardComponent.js';
import { renderChefOrders } from './KitchenKdsComponent.js';
import { withCookingLoader } from '../services/CookingLoaderService.js';

export let openProductEditorModal: (item?: MenuItem) => void = () => {};
export let openUserEditorModal: (user?: User) => void = () => {};
export let handleDeleteUser: (userId: string, userName: string) => Promise<void> = async () => {};
export let deleteStaffRole: (roleId: string) => Promise<boolean> = async () => false;
export let renderRolesManagementList: () => void = () => {};
export let openManageRolesModal: () => void = () => {};
export let closeManageRolesModal: () => void = () => {};

export async function renderManagerDashboard() {
  const report = await kpiUseCase.execute();
  const t = translations[AppState.currentLanguage] || translations['es'];

  const kpiRev = document.getElementById('kpi-revenue');
  if (kpiRev) kpiRev.innerText = `${report.totalRevenue.toFixed(2)} €`;

  const kpiTips = document.getElementById('kpi-tips');
  if (kpiTips) kpiTips.innerText = `${report.totalTips.toFixed(2)} €`;

  const kpiAvg = document.getElementById('kpi-avg-ticket');
  if (kpiAvg) kpiAvg.innerText = `${report.averageTicket.toFixed(2)} €`;

  const kpiCount = document.getElementById('kpi-orders-count');
  if (kpiCount) kpiCount.innerText = report.totalOrders.toString();

  const kpiSub = document.getElementById('kpi-orders-sub');
  if (kpiSub) kpiSub.innerText = `${report.inKitchenOrdersCount} ${t.kpiOrdersSubInKitchen || 'en cocina'} / ${report.deliveredOrdersCount} ${t.kpiOrdersSubDelivered || 'servidas'}`;

  // Top Items Table
  const topTbody = document.getElementById('top-items-tbody');
  if (topTbody) {
    topTbody.innerHTML = '';
    report.topRequestedItems.forEach(item => {
      const itemCatalog = AppState.menuCatalog.find(m => m.name === item.name || Object.values(m.translations || {}).some((tr: any) => tr?.name === item.name));
      const itemTrans = (itemCatalog?.translations as any)?.[AppState.currentLanguage];
      const itemName = itemTrans?.name || item.name;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${itemName}</strong></td>
        <td>${item.count} ${t.ordersCountUnit || 'pedidos'}</td>
        <td style="color:var(--accent-emerald); font-weight:700;">${item.revenue.toFixed(2)} €</td>
      `;
      topTbody.appendChild(tr);
    });
  }

  // Live Stock & Price Editor
  const stockTbody = document.getElementById('stock-tbody');
  if (stockTbody) {
    stockTbody.innerHTML = '';
    AppState.menuCatalog.forEach(item => {
      const itemTrans = (item.translations as any)?.[AppState.currentLanguage];
      const itemName = itemTrans?.name || item.name;

      const catKey = item.category.toLowerCase();
      const catLabel = catKey === 'starter' ? (t.starters || item.category)
        : catKey === 'main' ? (t.mains || item.category)
        : catKey === 'dessert' ? (t.desserts || item.category)
        : catKey === 'beverage' ? (t.beverages || item.category)
        : item.category;

      const tr = document.createElement('tr');
      tr.className = 'stock-table-row';
      tr.innerHTML = `
        <td class="stock-td-info">
          <div class="stock-title-badge-wrap">
            <strong class="stock-item-name">${itemName}</strong>
            <span class="badge-tag tag-direct stock-inline-category">${catLabel}</span>
          </div>
          ${item.allergens && item.allergens.length > 0 ? `<div class="stock-item-allergens" style="font-size:0.72rem; color:#f472b6; margin-top:3px;">⚠️ ${t.allergens || 'Alérgenos'}: ${item.allergens.map((a: string) => {
            const loc = getLocalizedAllergenDisplay(a, AppState.currentLanguage);
            return `${loc.icon} ${loc.name}`;
          }).join(', ')}</div>` : ''}
        </td>
        <td class="stock-td-category-desktop"><span class="badge-tag tag-direct">${catLabel}</span></td>
        <td class="stock-td-price">
          <span class="stock-cell-label">${t.thPrice || 'Precio (€)'}:</span>
          <div class="stock-input-wrap">
            <input type="number" step="0.5" class="stock-input" id="price-input-${item.id}" value="${item.price.toFixed(2)}" min="0" style="width:75px;">
            <span class="stock-currency-symbol">€</span>
          </div>
        </td>
        <td class="stock-td-stock">
          <span class="stock-cell-label">${t.thStock || 'Stock'}:</span>
          <input type="number" class="stock-input" id="stock-input-${item.id}" value="${item.stock}" min="0" style="width:70px;">
        </td>
        <td class="stock-td-actions">
          <div class="stock-actions-flex">
            <button class="btn-action btn-edit-product-full" data-id="${item.id}" title="Editar Información Completa del Plato" style="padding:6px 10px; font-size:0.76rem; background:linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color:#fff; border:none; border-radius:var(--radius-sm); cursor:pointer; display:inline-flex; align-items:center; gap:4px; font-weight:600; box-shadow:0 2px 6px rgba(37,99,235,0.35);">
              ${t.btnEdit || '✏️ Editar'}
            </button>
            <button class="btn-action btn-waiter-deliver btn-save-item" data-id="${item.id}" title="Guardar Cambios Rápidos de Precio y Stock" style="padding:6px 10px; font-size:0.76rem;">
              ${t.btnSave || '💾 Guardar'}
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
          showToast(t.toastStockPositiveInteger || 'El stock debe ser un número entero mayor o igual a cero.', 'warning');
          return;
        }
        if (isNaN(newPrice) || newPrice < 0) {
          showToast(t.toastPriceNonNegative || 'El precio debe ser un número mayor o igual a cero.', 'warning');
          return;
        }

        const updated = await services.menuRepo.updateItem({
          ...item,
          price: newPrice,
          stock: newStock
        });

        const updatedName = (updated.translations as any)?.[AppState.currentLanguage]?.name || updated.name;
        showToast((t.toastStockQuickUpdated || 'Plato "{name}" actualizado: {price} € | Stock: {stock}.')
          .replace('{name}', updatedName)
          .replace('{price}', newPrice.toFixed(2))
          .replace('{stock}', newStock.toString()), 'success');
        AppState.menuCatalog = await services.menuRepo.getAll();
        renderManagerDashboard();
      });

      stockTbody.appendChild(tr);
    });
  }

  // User Management Cards
  const usersGrid = document.getElementById('users-cards-grid');
  if (usersGrid) {
    usersGrid.innerHTML = '';
    const staffOnly = AppState.allUsers.filter(u => u.role !== UserRole.CUSTOMER);
    staffOnly.forEach(u => {
      const staffRoleCfg = availableStaffRoles.find(
        sr => sr.id.toUpperCase() === (u.role || '').toUpperCase() || sr.name.toUpperCase() === (u.role || '').toUpperCase()
      );
      const baseRole = staffRoleCfg ? staffRoleCfg.baseRole : u.role;
      const roleLabel = getTranslatedRole(u.role, t);

      let roleTagClass = 'tag-direct';
      let roleBorder = '#3b82f6';
      let defaultAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

      if (baseRole === UserRole.MANAGER || u.role === UserRole.MANAGER) {
        roleTagClass = 'tag-stock';
        roleBorder = '#10b981';
        defaultAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80';
      } else if (baseRole === UserRole.CHEF || u.role === UserRole.CHEF) {
        roleTagClass = 'tag-cooking';
        roleBorder = '#ef4444';
        defaultAvatar = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80';
      }

      const avatarSrc = u.avatarUrl || defaultAvatar;
      const statusText = u.active ? (t.userActive || 'ACTIVO') : (t.userInactive || 'INACTIVO');
      const statusTitle = u.active ? (t.userActiveTooltip || 'Usuario Activo') : (t.userInactiveTooltip || 'Usuario Inactivo');

      const card = document.createElement('div');
      card.className = 'user-profile-card';
      card.innerHTML = `
        <div class="user-card-header">
          <div class="user-avatar-wrap">
            <img src="${avatarSrc}" alt="${u.name}" class="user-avatar-img" style="border-color:${roleBorder};" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=334155&color=fff&bold=true'">
            <span class="user-status-dot ${u.active ? 'active' : 'inactive'}" title="${statusTitle}"></span>
          </div>
          <div class="user-card-info">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
              <h4 class="user-card-name" title="${u.name}">${u.name}</h4>
              <div style="display:flex; gap:4px; align-items:center; flex-shrink:0;">
                <button class="btn-action btn-edit-user" data-id="${u.id}" title="${t.btnEdit || 'Editar'}" style="padding:2px 7px; font-size:0.72rem; background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; border-radius:4px; cursor:pointer; font-weight:600; display:inline-flex; align-items:center; gap:3px;">
                  ${t.btnEdit || '✏️ Editar'}
                </button>
                <button class="btn-action btn-delete-user-card" data-id="${u.id}" data-name="${u.name}" title="${t.btnDeleteUser || 'Eliminar'}" style="padding:2px 6px; font-size:0.72rem; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#ef4444; border-radius:4px; cursor:pointer; font-weight:600; display:inline-flex; align-items:center;">
                  🗑️
                </button>
              </div>
            </div>
            <div class="user-card-meta">
              <span class="badge-tag ${roleTagClass}" style="font-size:0.72rem; padding:2px 7px;">${roleLabel}</span>
              <span class="badge-tag ${u.active ? 'tag-stock' : 'tag-cooking'}" style="font-size:0.68rem; padding:1px 6px;">
                ${statusText}
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
              <span>${t.userLoginLabel || 'Login:'}</span>
              <span class="user-login-badge">${u.username || u.id}</span>
            </div>
            <span style="font-family:'JetBrains Mono',monospace; font-size:0.7rem; color:var(--text-muted); opacity:0.8;" title="${t.userIdTooltip || 'ID Interno'}">${u.id}</span>
          </div>
        </div>
      `;

      card.querySelector('.btn-edit-user')?.addEventListener('click', () => {
        openUserEditorModal(u);
      });

      card.querySelector('.btn-delete-user-card')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        await handleDeleteUser(u.id, u.name);
      });

      usersGrid.appendChild(card);
    });
  }

  // Operational Settings
  const chkSkip = document.getElementById('chk-skip-staff-assignment') as HTMLInputElement;
  if (chkSkip) {
    chkSkip.checked = AppState.skipStaffAssignment;
    chkSkip.onchange = () => {
      AppState.skipStaffAssignment = chkSkip.checked;
      localStorage.setItem('DND_SKIP_STAFF_ASSIGN', AppState.skipStaffAssignment ? 'true' : 'false');
      showToast(
        AppState.skipStaffAssignment 
          ? (t.toastFlowSkipStaff || 'Flujo operativo: asignación obligatoria a personal omitida.')
          : (t.toastFlowRequireStaff || 'Flujo operativo: asignación obligatoria a personal requerida.'),
        'info'
      );
      if (AppState.currentUser.role === UserRole.WAITER) renderWaiterOrders();
      if (AppState.currentUser.role === UserRole.CHEF) renderChefOrders();
    };
  }
}

export function setupManagerModals() {
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
    if (modalAddUser) modalAddUser.style.display = 'none';
  }

  openUserEditorModal = (user?: User) => {
    formAddUser.reset();
    const t = translations[AppState.currentLanguage] || translations['es'];
    updateRoleSelectorOptions(user ? user.role : undefined);
    const btnDeleteUser = document.getElementById('btn-delete-user');

    if (user) {
      if (editUserIdInput) editUserIdInput.value = user.id;
      if (userModalTitle) userModalTitle.textContent = `${t.modalEditUserTitle || '✏️ Editar Empleado'}: ${user.name}`;
      if (userModalSubtitle) {
        userModalSubtitle.textContent = t.modalEditUserSub || 'Modifica los datos del empleado. Deja la contraseña en blanco si deseas conservar la actual.';
      }
      if (btnSubmitUser) btnSubmitUser.textContent = t.btnUpdateUser || '💾 Guardar Cambios';

      (document.getElementById('new-user-name') as HTMLInputElement).value = user.name;
      (document.getElementById('new-user-username') as HTMLInputElement).value = user.username || '';
      (document.getElementById('new-user-email') as HTMLInputElement).value = user.email;
      (document.getElementById('new-user-role') as HTMLSelectElement).value = user.role;
      (document.getElementById('new-user-avatar') as HTMLInputElement).value = user.avatarUrl || '';

      if (userActiveWrap) userActiveWrap.style.display = 'flex';
      if (editUserActive) editUserActive.checked = user.active !== false;

      passwordInput.required = false;
      passwordInput.placeholder = t.phPasswordOptional || '•••••••• (Dejar en blanco para conservar actual)';
      if (passwordLabel) {
        passwordLabel.textContent = t.lblAccessPasswordOptional || 'Contraseña de Acceso (opcional para mantener):';
      }

      if (btnDeleteUser) {
        btnDeleteUser.style.display = 'inline-flex';
        btnDeleteUser.onclick = () => {
          handleDeleteUser(user.id, user.name);
        };
      }
    } else {
      if (editUserIdInput) editUserIdInput.value = '';
      if (userModalTitle) userModalTitle.textContent = t.modalNewUserTitle || '👤 Registrar Nuevo Empleado';
      if (userModalSubtitle) {
        userModalSubtitle.textContent = t.modalNewUserSub || 'Añade un nuevo miembro al equipo interno del restaurante. Por política estricta de privacidad (RGPD), no se admiten roles de cliente.';
      }
      if (btnSubmitUser) btnSubmitUser.textContent = t.btnSaveUser || '💾 Guardar Empleado';

      if (userActiveWrap) userActiveWrap.style.display = 'none';
      if (editUserActive) editUserActive.checked = true;

      passwordInput.required = true;
      passwordInput.placeholder = t.phPasswordRequired || '••••••••';
      if (passwordLabel) {
        passwordLabel.textContent = t.lblAccessPassword || 'Contraseña de Acceso:';
      }

      if (btnDeleteUser) {
        btnDeleteUser.style.display = 'none';
        btnDeleteUser.onclick = null;
      }
    }
    modalAddUser.style.display = 'flex';
  };

  handleDeleteUser = async (userId: string, userName: string) => {
    const t = translations[AppState.currentLanguage] || translations['es'];
    const confirmMsg = (t.confirmDeleteUser || '¿Estás seguro de que deseas eliminar permanentemente al empleado "{name}"? Esta acción no se puede deshacer.')
      .replace('{name}', userName);
    if (!window.confirm(confirmMsg)) return;

    try {
      const deleted = await withCookingLoader(async () => {
        return await services.userRepo.delete(userId);
      }, 'Eliminando empleado...');
      if (deleted) {
        AppState.allUsers = await services.userRepo.getAll();
        closeAddUserModal();
        renderManagerDashboard();
        showToast((t.toastUserDeleted || 'Empleado {name} eliminado correctamente.').replace('{name}', userName), 'success');
      } else {
        showToast('No se pudo eliminar el usuario', 'danger');
      }
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar usuario', 'danger');
    }
  };

  btnOpenAddUser?.addEventListener('click', () => {
    openUserEditorModal();
  });

  btnCloseAddUser?.addEventListener('click', closeAddUserModal);
  btnCancelAddUser?.addEventListener('click', closeAddUserModal);

  // Hook up Create / Edit Role Modal handlers
  const modalCreateRole = document.getElementById('create-role-modal');
  const btnOpenCreateRole = document.getElementById('btn-open-create-role');
  const btnOpenCreateRoleManager = document.getElementById('btn-open-create-role-manager');
  const btnCloseCreateRole = document.getElementById('btn-close-create-role-modal');
  const btnCancelCreateRole = document.getElementById('btn-cancel-create-role');
  const formCreateRole = document.getElementById('create-role-form') as HTMLFormElement;
  const roleTransStatus = document.getElementById('role-translation-status');
  const btnSubmitRole = document.getElementById('btn-submit-create-role') as HTMLButtonElement;

  function closeCreateRoleModal() {
    if (modalCreateRole) modalCreateRole.style.display = 'none';
    if (formCreateRole) formCreateRole.reset();
    if (roleTransStatus) roleTransStatus.innerText = '';
    if (btnSubmitRole) btnSubmitRole.disabled = false;
  }

  function openCreateRoleModal(roleToEdit?: StaffRoleConfig) {
    if (formCreateRole) formCreateRole.reset();
    if (roleTransStatus) roleTransStatus.innerText = '';
    if (btnSubmitRole) btnSubmitRole.disabled = false;
    const editRoleIdInput = document.getElementById('edit-role-id') as HTMLInputElement;
    const roleTitle = document.getElementById('txt-create-role-title');
    const nameInput = document.getElementById('new-role-name') as HTMLInputElement;
    const iconInput = document.getElementById('new-role-icon') as HTMLInputElement;
    const permSelect = document.getElementById('new-role-permission') as HTMLSelectElement;
    const t = translations[AppState.currentLanguage] || translations['es'];

    if (roleToEdit) {
      if (editRoleIdInput) editRoleIdInput.value = roleToEdit.id;
      if (nameInput) nameInput.value = roleToEdit.name;
      if (iconInput) iconInput.value = roleToEdit.icon || '💼';
      if (permSelect) permSelect.value = roleToEdit.baseRole || 'WAITER';
      if (roleTitle) roleTitle.textContent = `${t.btnEdit || '✏️ Editar Rol'}: ${roleToEdit.name}`;
      if (btnSubmitRole) btnSubmitRole.innerText = t.btnUpdateUser || '💾 Guardar Cambios';
    } else {
      if (editRoleIdInput) editRoleIdInput.value = '';
      if (iconInput) iconInput.value = '💼';
      if (roleTitle) roleTitle.textContent = t.btnCreateRole || '🎭 Crear Nuevo Rol de Personal';
      if (btnSubmitRole) btnSubmitRole.innerText = t.btnSaveRole || '✨ Traducir y Guardar Rol';
    }

    if (modalCreateRole) modalCreateRole.style.display = 'flex';
  }

  btnOpenCreateRole?.addEventListener('click', () => openCreateRoleModal());
  btnOpenCreateRoleManager?.addEventListener('click', () => openCreateRoleModal());
  btnCloseCreateRole?.addEventListener('click', closeCreateRoleModal);
  btnCancelCreateRole?.addEventListener('click', closeCreateRoleModal);

  // Hook up Manage Roles Modal
  const modalManageRoles = document.getElementById('manage-roles-modal');
  const btnOpenManageRoles = document.getElementById('btn-open-manage-roles');
  const btnCloseManageRoles = document.getElementById('btn-close-manage-roles-modal');
  const btnDismissManageRoles = document.getElementById('btn-dismiss-manage-roles');
  const btnCreateRoleFromManager = document.getElementById('btn-create-role-from-manager');

  deleteStaffRole = async (roleId: string): Promise<boolean> => {
    const t = translations[AppState.currentLanguage] || translations['es'];
    const roleIndex = availableStaffRoles.findIndex(r => r.id === roleId);
    if (roleIndex < 0) return false;
    const role = availableStaffRoles[roleIndex];
    const confirmMsg = (t.confirmDeleteRole || '¿Estás seguro de que deseas eliminar el rol "{role}"?')
      .replace('{role}', role.name);
    if (!window.confirm(confirmMsg)) return false;

    availableStaffRoles.splice(roleIndex, 1);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('DND_CUSTOM_ROLES', JSON.stringify(availableStaffRoles));
      } catch (e) {
        console.error('Error persisting custom roles:', e);
      }
    }
    updateRoleSelectorOptions();
    renderRolesManagementList();
    renderManagerDashboard();
    showToast((t.toastRoleDeleted || 'Rol "{role}" eliminado con éxito.').replace('{role}', role.name), 'success');
    return true;
  };

  renderRolesManagementList = () => {
    const listContainer = document.getElementById('roles-management-list');
    if (!listContainer) return;
    const t = translations[AppState.currentLanguage] || translations['es'];
    listContainer.innerHTML = '';

    availableStaffRoles.forEach(role => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.padding = '8px 12px';
      row.style.background = 'rgba(255,255,255,0.03)';
      row.style.border = '1px solid var(--border-subtle)';
      row.style.borderRadius = 'var(--radius-sm)';
      row.style.fontSize = '0.85rem';

      const localizedName = role.translations?.[AppState.currentLanguage] || role.name;
      const baseRoleBadge = `<span class="badge-tag ${role.baseRole === 'MANAGER' ? 'tag-stock' : role.baseRole === 'CHEF' ? 'tag-cooking' : 'tag-direct'}" style="font-size:0.68rem; padding:2px 6px;">${role.baseRole}</span>`;

      row.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">
          <span style="font-size:1.2rem; flex-shrink:0;">${role.icon || '💼'}</span>
          <div style="min-width:0;">
            <div style="font-weight:700; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${localizedName} ${role.name !== localizedName ? `<span style="font-size:0.75rem; color:var(--text-muted); font-weight:400;">(${role.name})</span>` : ''}
            </div>
            <div style="font-size:0.72rem; color:var(--text-muted); display:flex; align-items:center; gap:5px; margin-top:2px;">
              <span>ID: <code>${role.id}</code></span> • ${baseRoleBadge}
            </div>
          </div>
        </div>
        <div style="display:flex; gap:6px; align-items:center; flex-shrink:0;">
          <button type="button" class="btn-action btn-edit-role-item" data-id="${role.id}" title="${t.btnEdit || 'Editar'}" style="padding:4px 8px; font-size:0.75rem; background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; border-radius:4px; cursor:pointer; font-weight:600; display:inline-flex; align-items:center; gap:3px;">
            ✏️
          </button>
          <button type="button" class="btn-action btn-delete-role-item" data-id="${role.id}" title="${t.btnDeleteRole || 'Eliminar rol'}" style="padding:4px 8px; font-size:0.75rem; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#ef4444; border-radius:4px; cursor:pointer; font-weight:600; display:inline-flex; align-items:center;">
            🗑️
          </button>
        </div>
      `;

      row.querySelector('.btn-edit-role-item')?.addEventListener('click', () => {
        closeManageRolesModal();
        openCreateRoleModal(role);
      });

      row.querySelector('.btn-delete-role-item')?.addEventListener('click', async () => {
        await deleteStaffRole(role.id);
      });

      listContainer.appendChild(row);
    });
  };

  openManageRolesModal = () => {
    renderRolesManagementList();
    if (modalManageRoles) modalManageRoles.style.display = 'flex';
  };

  closeManageRolesModal = () => {
    if (modalManageRoles) modalManageRoles.style.display = 'none';
  };

  btnOpenManageRoles?.addEventListener('click', openManageRolesModal);
  btnCloseManageRoles?.addEventListener('click', closeManageRolesModal);
  btnDismissManageRoles?.addEventListener('click', closeManageRolesModal);
  btnCreateRoleFromManager?.addEventListener('click', () => {
    closeManageRolesModal();
    openCreateRoleModal();
  });

  formCreateRole?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const t = translations[AppState.currentLanguage] || translations['es'];
    const editRoleIdInput = document.getElementById('edit-role-id') as HTMLInputElement;
    const editRoleId = editRoleIdInput?.value.trim();
    const nameInput = document.getElementById('new-role-name') as HTMLInputElement;
    const iconInput = document.getElementById('new-role-icon') as HTMLInputElement;
    const permSelect = document.getElementById('new-role-permission') as HTMLSelectElement;

    const spanishName = nameInput.value.trim();
    if (!spanishName) {
      showToast(t.toastRoleNameRequired || 'Por favor introduce el nombre del rol en español.', 'warning');
      return;
    }

    if (btnSubmitRole) {
      btnSubmitRole.disabled = true;
      btnSubmitRole.innerText = '⏳ Guardando y traduciendo a 14 idiomas...';
    }
    if (roleTransStatus) {
      roleTransStatus.innerText = '🌐 Procesando rol y traducciones automáticamente con IA...';
      roleTransStatus.style.color = 'var(--accent-orange)';
    }

    try {
      if (editRoleId) {
        const existingRole = availableStaffRoles.find(r => r.id === editRoleId);
        if (existingRole) {
          existingRole.name = spanishName;
          existingRole.icon = iconInput.value.trim() || '💼';
          existingRole.baseRole = permSelect.value || 'WAITER';
          if (!existingRole.translations) existingRole.translations = { es: spanishName };
          existingRole.translations.es = spanishName;

          const allLangs = ['en', 'fr', 'de', 'zh', 'ko', 'uk', 'pt', 'ja', 'ar', 'ca', 'va', 'eu', 'gl'];
          for (const lang of allLangs) {
            try {
              const trans = await translateTextOnline(spanishName, lang);
              if (trans) existingRole.translations[lang] = trans;
            } catch {
              // fallback
            }
          }

          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem('DND_CUSTOM_ROLES', JSON.stringify(availableStaffRoles));
            } catch (errStorage) {
              console.error('Error persisting custom roles:', errStorage);
            }
          }
          updateRoleSelectorOptions(existingRole.id);
          renderRolesManagementList();
          renderManagerDashboard();
          showToast((t.toastRoleUpdated || 'Rol "{role}" actualizado correctamente.').replace('{role}', spanishName), 'success');
          closeCreateRoleModal();
        }
      } else {
        const createdRole = await createNewStaffRole(
          spanishName,
          iconInput.value.trim() || '💼',
          permSelect.value || 'WAITER'
        );
        if (roleTransStatus) {
          roleTransStatus.innerText = '✅ Rol traducido y guardado exitosamente.';
          roleTransStatus.style.color = '#34d399';
        }
        showToast((t.toastRoleCreated || '¡Rol "{name}" creado y traducido a 14 idiomas con éxito!').replace('{name}', createdRole.name), 'success');
        renderRolesManagementList();
        renderManagerDashboard();
        setTimeout(() => {
          closeCreateRoleModal();
          updateRoleSelectorOptions(createdRole.id);
        }, 500);
      }
    } catch (err: any) {
      if (roleTransStatus) {
        roleTransStatus.innerText = '⚠️ Error al procesar rol.';
        roleTransStatus.style.color = '#f87171';
      }
      showToast(err.message || 'Error al guardar el rol', 'danger');
    } finally {
      if (btnSubmitRole) {
        btnSubmitRole.disabled = false;
        btnSubmitRole.innerText = t.btnSaveRole || '✨ Traducir y Guardar Rol';
      }
    }
  });

  formAddUser?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const t = translations[AppState.currentLanguage] || translations['es'];
    const isEditing = Boolean(editUserIdInput && editUserIdInput.value.trim());
    const targetUserId = isEditing ? editUserIdInput.value.trim() : '';

    const name = (document.getElementById('new-user-name') as HTMLInputElement).value.trim();
    const username = (document.getElementById('new-user-username') as HTMLInputElement).value.trim();
    const email = (document.getElementById('new-user-email') as HTMLInputElement).value.trim();
    const roleVal = (document.getElementById('new-user-role') as HTMLSelectElement).value;
    const password = passwordInput.value.trim();
    const isActive = editUserActive ? editUserActive.checked : true;

    if (!name || !username || !email) {
      showToast(t.toastUserFieldsRequired || 'Por favor completa los campos obligatorios del empleado.', 'warning');
      return;
    }

    if (!isEditing && !password) {
      showToast(t.toastUserPasswordRequired || 'Por favor ingresa una contraseña para el nuevo empleado.', 'warning');
      return;
    }

    const isCustomer = roleVal === UserRole.CUSTOMER || roleVal.toLowerCase() === 'customer';
    if (isCustomer) {
      showToast(t.toastUserRoleNotAllowed || 'Rol no permitido: solo se pueden registrar empleados internos.', 'danger');
      return;
    }

    const avatarInput = (document.getElementById('new-user-avatar') as HTMLInputElement)?.value.trim();
    let defaultAvatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
    if (roleVal === UserRole.MANAGER || roleVal.toUpperCase() === 'MANAGER') {
      defaultAvatar = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80';
    } else if (roleVal === UserRole.CHEF || roleVal.toUpperCase() === 'CHEF') {
      defaultAvatar = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80';
    }

    try {
      if (isEditing) {
        const existingUser = AppState.allUsers.find(u => u.id === targetUserId);
        if (!existingUser) {
          showToast(t.toastUserNotFound || 'No se encontró el empleado a editar.', 'danger');
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

        await withCookingLoader(async () => {
          await services.userRepo.update(updatedUser);
          AppState.allUsers = await services.userRepo.getAll();
        }, 'Actualizando empleado en tiempo real...');

        if (AppState.currentUser.id === updatedUser.id) {
          AppState.currentUser = updatedUser;
          sessionStorage.setItem('DND_LOGGED_USER', JSON.stringify(AppState.currentUser));
        }

        renderManagerDashboard();
        closeAddUserModal();
        showToast((t.toastUserUpdated || '¡Empleado {name} actualizado con éxito!').replace('{name}', updatedUser.name), 'success');
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

        await withCookingLoader(async () => {
          await services.userRepo.create(newUser);
          AppState.allUsers = await services.userRepo.getAll();
        }, 'Registrando nuevo empleado en tiempo real...');
        renderManagerDashboard();
        closeAddUserModal();
        showToast((t.toastUserCreated || '¡Empleado {name} registrado con éxito como {role}!').replace('{name}', newUser.name).replace('{role}', getTranslatedRole(newUser.role, t)), 'success');
      }
    } catch (err: any) {
      showToast((t.toastUserError || 'Error al guardar empleado: {error}').replace('{error}', err.message), 'danger');
    }
  });

  // Modal Añadir / Editar Producto
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
    { code: 'en', flag: renderFlagHtml('en'), name: 'English' },
    { code: 'fr', flag: renderFlagHtml('fr'), name: 'Français' },
    { code: 'de', flag: renderFlagHtml('de'), name: 'Deutsch' },
    { code: 'zh', flag: renderFlagHtml('zh'), name: '中文' },
    { code: 'ko', flag: renderFlagHtml('ko'), name: '한국어' },
    { code: 'uk', flag: renderFlagHtml('uk'), name: 'Українська' },
    { code: 'pt', flag: renderFlagHtml('pt'), name: 'Português' },
    { code: 'ja', flag: renderFlagHtml('ja'), name: '日本語' },
    { code: 'ar', flag: renderFlagHtml('ar'), name: 'العربية' },
    { code: 'ca', flag: renderFlagHtml('ca'), name: 'Català' },
    { code: 'va', flag: renderFlagHtml('va'), name: 'Valencià' },
    { code: 'eu', flag: renderFlagHtml('eu'), name: 'Euskara' },
    { code: 'gl', flag: renderFlagHtml('gl'), name: 'Galego' }
  ];

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

  urlImgInput?.addEventListener('input', () => {
    const val = urlImgInput.value.trim();
    if (val && previewImg) {
      uploadedDishDataUrl = '';
      previewImg.src = val;
    }
  });

  btnAutoTranslate?.addEventListener('click', async () => {
    const nameVal = (document.getElementById('new-product-name') as HTMLInputElement).value.trim();
    const descVal = (document.getElementById('new-product-desc') as HTMLTextAreaElement).value.trim();
    const detailsEl = document.getElementById('details-translations') as HTMLDetailsElement;

    const t = translations[AppState.currentLanguage] || translations['es'];
    if (!nameVal) {
      showToast(t.toastDishNameRequiredForTrans || 'Por favor escribe el nombre en español antes de solicitar la traducción.', 'warning');
      return;
    }

    if (transStatusEl) {
      transStatusEl.innerText = t.transTranslating14 || '⏳ Traduciendo a 14 idiomas...';
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
        transStatusEl.innerText = t.transDone14 || '✅ ¡14 idiomas traducidos!';
        transStatusEl.style.color = '#34d399';
      }
      if (detailsEl) detailsEl.open = true;
      showToast(t.toastDishTranslatedSuccess || '¡Nombre y descripción traducidos con éxito a los 14 idiomas!', 'success');
    } catch {
      if (transStatusEl) transStatusEl.innerText = t.transErrorPartial || '⚠️ Error parcial al conectar con el traductor.';
    }
  });

  openProductEditorModal = (item?: MenuItem) => {
    formAddProduct.reset();
    uploadedDishDataUrl = '';
    if (fileImgInput) fileImgInput.value = '';
    const t = translations[AppState.currentLanguage] || translations['es'];

    if (item) {
      if (editProductIdInput) editProductIdInput.value = item.id;
      const transObjCurrent = (item.translations as any)?.[AppState.currentLanguage];
      const displayName = transObjCurrent?.name || item.name;
      if (productModalTitle) productModalTitle.innerText = `${t.modalEditProductTitle || '✏️ Editar Producto'}: ${displayName}`;
      if (productModalSubtitle) productModalSubtitle.innerText = t.modalEditProductSub || 'Modifica los datos, descripciones, traducciones a los 14 idiomas, alérgenos, categoría o imágenes del plato seleccionado.';
      if (btnSubmitProduct) btnSubmitProduct.innerText = t.btnSaveProductChanges || '💾 Guardar Cambios';

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

      renderModalAllergensGrid(item.allergens || []);

      initTranslationFields();
      ALL_ADD_LANGS.forEach(l => {
        const transObj = (item.translations as any)?.[l.code];
        const inName = document.getElementById(`trans-name-${l.code}`) as HTMLInputElement;
        const inDesc = document.getElementById(`trans-desc-${l.code}`) as HTMLTextAreaElement;
        if (inName) inName.value = transObj?.name || '';
        if (inDesc) inDesc.value = transObj?.description || '';
      });

      if (transStatusEl) {
        transStatusEl.innerText = t.transLoadedForEdit || 'Traducciones cargadas para edición.';
        transStatusEl.style.color = 'var(--text-muted)';
      }
    } else {
      if (editProductIdInput) editProductIdInput.value = '';
      if (productModalTitle) productModalTitle.innerText = t.modalNewProductTitle || '🍽️ Añadir Nuevo Producto / Plato';
      if (productModalSubtitle) productModalSubtitle.innerText = t.modalNewProductSub || 'Incorpora un nuevo plato a la carta con stock inicial, traducción automática a los 14 idiomas soportados, imágenes optimizadas para móvil/tablet/escritorio y ficha de alérgenos.';
      if (btnSubmitProduct) btnSubmitProduct.innerText = t.btnSaveProduct || '💾 Incorporar a Carta';

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

      renderModalAllergensGrid([]);

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
    const t = translations[AppState.currentLanguage] || translations['es'];
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
      showToast(t.toastProductInvalidData || 'Por favor introduce datos válidos para el producto (precio y stock no negativos).', 'warning');
      return;
    }

    const allergenCheckboxes = document.querySelectorAll<HTMLInputElement>('input[name="new-product-allergen"]:checked');
    const allergens = Array.from(allergenCheckboxes).map(cb => cb.value);

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
        const autoName = await translateTextOnline(name, l.code);
        const autoDesc = description ? await translateTextOnline(description, l.code) : '';
        dishTranslations[l.code] = {
          name: autoName || name,
          description: autoDesc || description
        };
      }
    }

    if (isEditing) {
      const existing = AppState.menuCatalog.find(i => i.id === editingId);
      if (!existing) {
        showToast(t.toastProductNotFound || 'Error: No se encontró el plato para editar.', 'danger');
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
        await withCookingLoader(async () => {
          await services.menuRepo.updateItem(updatedDish);
          AppState.menuCatalog = await services.menuRepo.getAll();
        }, 'Actualizando plato en carta y cocina...');
        updateLanguageSelectorOptions();
        renderManagerDashboard();
        renderMenu();
        closeAddProductModal();
        showToast((t.toastProductUpdated || '¡Plato "{name}" actualizado con éxito!').replace('{name}', updatedDish.name), 'success');
      } catch (err: any) {
        showToast((t.toastProductUpdateError || 'Error al actualizar el plato: {error}').replace('{error}', err.message), 'danger');
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
        await withCookingLoader(async () => {
          await services.menuRepo.createItem(newDish);
          AppState.menuCatalog = await services.menuRepo.getAll();
        }, 'Registrando nuevo plato en carta...');
        updateLanguageSelectorOptions();
        renderManagerDashboard();
        renderMenu();
        closeAddProductModal();
        showToast((t.toastProductCreated || '¡Plato "{name}" incorporado con éxito con traducción a 14 idiomas e imágenes adaptadas!').replace('{name}', newDish.name), 'success');
      } catch (err: any) {
        showToast((t.toastProductCreateError || 'Error al crear producto: {error}').replace('{error}', err.message), 'danger');
      }
    }
  });
}
