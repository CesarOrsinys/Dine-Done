import { OrderStatus } from '../../core/domain/enums/OrderStatus.js';
import { PaymentStatus } from '../../core/domain/enums/PaymentStatus.js';
import { AppState } from '../state/AppState.js';
import { translations } from '../i18n/LanguageManager.js';
import { showToast } from '../services/ToastService.js';
import { formatTableDisplay } from './TableComponent.js';
import { getTranslatedStatus } from './WaiterBoardComponent.js';
import { assignStaffUseCase, updateStatusUseCase } from '../services/UseCasesService.js';
import { refreshAll } from '../services/ExportService.js';

export function renderChefOrders() {
  const chefOrdersContainer = document.getElementById('chef-orders-container');
  if (!chefOrdersContainer) return;

  chefOrdersContainer.innerHTML = '';

  const kitchenOrders = AppState.allOrders.filter(o => 
    o.status !== OrderStatus.DELIVERED && 
    o.status !== OrderStatus.CANCELLED &&
    o.items.some(i => i.requiresCooking)
  );

  const t = translations[AppState.currentLanguage] || translations['es'];
  const pendingBadge = document.getElementById('kds-pending-badge');
  if (pendingBadge) {
    pendingBadge.innerText = `${kitchenOrders.length} ${t.kdsPendingBadge || 'Comandas en Cocina'}`;
  }

  if (kitchenOrders.length === 0) {
    chefOrdersContainer.innerHTML = `<p style="color:var(--text-muted); padding:30px;">${t.kdsNoOrders || '👨‍🍳 No hay pedidos pendientes de cocción en este momento. ¡Todo servido!'}</p>`;
    return;
  }

  kitchenOrders.forEach(order => {
    const card = document.createElement('div');
    const isUnderCooking = order.status === OrderStatus.IN_KITCHEN;
    card.className = `order-card ${isUnderCooking ? 'status-in-kitchen' : 'status-placed'}`;

    const cookingItems = order.items.filter(i => i.requiresCooking);
    const isPendingCash = order.paymentStatus === PaymentStatus.PENDING_CASH;

    card.innerHTML = `
      <div class="order-header">
        <div>
          <div class="order-num" style="color:#ef4444;">${order.orderNumber}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${formatTableDisplay(order.tableNumber, t)} • ${t.kdsCreatedJustNow || 'Creado hace instantes'}</div>
        </div>
        <span class="badge-tag tag-cooking">${getTranslatedStatus(order.status, t)}</span>
      </div>

      <div class="order-items-box">
        <h4 style="font-size:0.82rem; color:var(--accent-amber); margin-bottom:4px;">${t.kdsKitchenRequirements || 'REQUERIMIENTOS DE COCINA:'}</h4>
        ${cookingItems.map(i => {
          const itemCatalog = AppState.menuCatalog.find(m => m.id === i.menuItemId);
          const itemTrans = (itemCatalog?.translations as any)?.[AppState.currentLanguage];
          const itemName = itemTrans?.name || i.name;
          return `
            <div class="order-item-row" style="padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.04);">
              <span><strong style="color:#fff; font-size:1.05rem;">${i.quantity}x</strong> ${itemName}</span>
            </div>
            ${i.notes ? `<div class="order-item-notes">${t.kdsPrepNote || 'Nota de preparación:'} ${i.notes}</div>` : ''}
          `;
        }).join('')}
      </div>

      ${!AppState.skipStaffAssignment ? `
        <div class="order-staff-row">
          <div>👨‍🍳 ${t.kdsAssignedChef || 'Cocinero asignado:'} <strong>${order.chefName || t.unassigned || 'Sin asignar'}</strong></div>
        </div>
      ` : ''}

      <div class="order-actions-bar">
        ${(!AppState.skipStaffAssignment && !order.chefId) ? `
          <button class="btn-action btn-kitchen-start btn-assign-chef" data-id="${order.id}">
            ${t.kdsBtnAssignMe || '👨‍🍳 Asignarme'}
          </button>
        ` : ''}

        ${order.status === OrderStatus.PLACED ? (
          isPendingCash ? `
            <div style="font-size:0.8rem; color:#ef4444; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-sm); padding:8px 12px; font-weight:700; width:100%;">
              ${t.kdsCashBlocked || '⚠️ Esperando cobro en efectivo en sala: No puede pasar a cocina hasta que sea cobrado.'}
            </div>
          ` : `
            <button class="btn-action btn-kitchen-start btn-start-cook" data-id="${order.id}">
              ${t.kdsBtnStartCook || '🔥 Empezar a Cocinar'}
            </button>
          `
        ) : ''}

        ${order.status === OrderStatus.IN_KITCHEN ? `
          <button class="btn-action btn-kitchen-ready btn-ready-cook" data-id="${order.id}">
            ${t.kdsBtnReadyCook || '✅ ¡Plato Listo para Servir!'}
          </button>
        ` : ''}
      </div>
    `;

    card.querySelector('.btn-assign-chef')?.addEventListener('click', async () => {
      await assignStaffUseCase.execute({
        orderId: order.id,
        chefId: AppState.currentUser.id,
        chefName: AppState.currentUser.name
      });
      showToast((t.toastAssignedChef || 'Te has asignado como cocinero de la orden {orderNumber}.').replace('{orderNumber}', order.orderNumber), 'success');
      refreshAll();
    });

    card.querySelector('.btn-start-cook')?.addEventListener('click', async () => {
      if (order.paymentStatus === PaymentStatus.PENDING_CASH) {
        showToast(t.toastCookingPendingCash || '⚠️ No se puede iniciar la preparación: El pedido debe ser cobrado previamente en efectivo por el camarero.', 'warning');
        return;
      }
      await updateStatusUseCase.execute(order.id, OrderStatus.IN_KITCHEN);
      showToast((t.toastOrderCooking || 'Comanda {orderNumber} en cocción.').replace('{orderNumber}', order.orderNumber), 'info');
      refreshAll();
    });

    card.querySelector('.btn-ready-cook')?.addEventListener('click', async () => {
      await updateStatusUseCase.execute(order.id, OrderStatus.READY_TO_SERVE);
      showToast((t.toastOrderReady || 'Comanda {orderNumber} marcada como lista. Notificando a sala.').replace('{orderNumber}', order.orderNumber), 'success');
      refreshAll();
    });

    chefOrdersContainer.appendChild(card);
  });
}
