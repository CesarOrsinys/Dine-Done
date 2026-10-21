import restaurantConfig from '../../../mock_data/restaurant_config.json' with { type: 'json' };
import { AppState } from '../state/AppState.js';
import { translations, formatTableDisplay } from '../i18n/LanguageManager.js';
import { showToast } from '../services/ToastService.js';
import { UserRole } from '../../core/domain/enums/UserRole.js';

export { formatTableDisplay };

export function updateTableControlsVisibility() {
  const staffTableControls = document.getElementById('staff-table-controls');
  if (staffTableControls) {
    const isStaff = AppState.authenticatedStaffUser !== null && AppState.authenticatedStaffUser.role !== UserRole.CUSTOMER;
    staffTableControls.style.display = isStaff ? 'flex' : 'none';
  }
}

export function updateTableUI() {
  const t = translations[AppState.currentLanguage] || translations['es'];
  const formatted = formatTableDisplay(AppState.currentAssignedTable, AppState.currentLanguage, t);
  const displayEl = document.getElementById('current-table-display');
  if (displayEl) displayEl.innerText = formatted;

  const cartTableInput = document.getElementById('cart-table-input') as HTMLInputElement;
  if (cartTableInput) cartTableInput.value = formatted;
}

export function setupTableIdentification() {
  const urlParams = new URLSearchParams(window.location.search);
  const fromParam = urlParams.get('table') || urlParams.get('mesa') || urlParams.get('m');
  const badgeEl = document.getElementById('table-detection-badge')!;
  const t = translations[AppState.currentLanguage] || translations['es'];

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
    AppState.currentAssignedTable = fromParam.startsWith('Mesa') ? fromParam : `Mesa ${fromParam}`;
    localStorage.setItem('DND_SELECTED_TABLE', AppState.currentAssignedTable);
    if (badgeEl) {
      badgeEl.setAttribute('data-origin', 'url');
      badgeEl.innerText = t.detectedTable || 'Detectada por URL';
      badgeEl.className = 'badge-tag tag-stock';
    }
  } else {
    const stored = localStorage.getItem('DND_SELECTED_TABLE');
    if (stored) {
      AppState.currentAssignedTable = stored;
      if (badgeEl) {
        badgeEl.setAttribute('data-origin', 'storage');
        badgeEl.innerText = t.rememberedTable || 'Mesa Recordada';
        badgeEl.className = 'badge-tag tag-direct';
      }
    } else {
      AppState.currentAssignedTable = availableTables[0] || 'Mesa 4';
      if (badgeEl) {
        badgeEl.setAttribute('data-origin', 'default');
        badgeEl.innerText = t.defaultTable || 'Mesa por Defecto';
        badgeEl.className = 'badge-tag tag-stock';
      }
    }
  }

  updateTableUI();
  updateTableControlsVisibility();

  // Requirement 2: Manual edit toggle for staff only
  const editBtn = document.getElementById('btn-toggle-edit-table');
  if (editBtn && quickSelect) {
    editBtn.addEventListener('click', () => {
      const curT = translations[AppState.currentLanguage] || translations['es'];
      if (quickSelect.style.display === 'none') {
        quickSelect.style.display = 'inline-block';
        quickSelect.value = AppState.currentAssignedTable;
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
    const curT = translations[AppState.currentLanguage] || translations['es'];
    const val = quickSelect.value;
    if (val) {
      AppState.currentAssignedTable = val;
      localStorage.setItem('DND_SELECTED_TABLE', AppState.currentAssignedTable);
      if (badgeEl) {
        badgeEl.setAttribute('data-origin', 'manual');
        badgeEl.innerText = curT.manualTable || 'Configurada por Personal';
        badgeEl.className = 'badge-tag tag-cooking';
      }
      showToast(`${curT.manualTableSet || 'Mesa actualizada a'} "${formatTableDisplay(AppState.currentAssignedTable, AppState.currentLanguage, curT)}".`, 'success');
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
