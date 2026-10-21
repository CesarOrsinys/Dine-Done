import { OrderStatus } from '../../core/domain/enums/OrderStatus.js';
import { PaymentStatus } from '../../core/domain/enums/PaymentStatus.js';
import { AppState } from '../state/AppState.js';
import { translations } from '../i18n/LanguageManager.js';
import { showToast } from '../services/ToastService.js';
import { formatTableDisplay } from './TableComponent.js';
import { assignStaffUseCase, updateStatusUseCase, processCashUseCase } from '../services/UseCasesService.js';
import { refreshAll } from '../services/ExportService.js';

export function getTranslatedStatus(status: OrderStatus, t: any): string {
  switch (status) {
    case OrderStatus.PLACED: return t.statusPlaced || 'Pendiente';
    case OrderStatus.IN_KITCHEN: return t.statusCooking || 'En Cocina';
    case OrderStatus.READY_TO_SERVE: return t.statusReady || 'Listo';
    case OrderStatus.DELIVERED: return t.statusDelivered || 'Entregado';
    default: return status;
  }
}

export function getTranslatedPaymentStatus(status: PaymentStatus, t: any): string {
  if (status === PaymentStatus.PAID) return t.paymentPaid || 'Pagado';
  if (status === PaymentStatus.PENDING_CASH) return t.paymentPendingCash || 'Efectivo Pendiente';
  return status;
}

export function renderWaiterOrders() {
  const waiterOrdersContainer = document.getElementById('waiter-orders-container');
  if (!waiterOrdersContainer) return;

  waiterOrdersContainer.innerHTML = '';
  const t = translations[AppState.currentLanguage] || translations['es'];
  if (AppState.allOrders.length === 0) {
    waiterOrdersContainer.innerHTML = `<p style="color:var(--text-muted); padding:30px;">${t.waiterNoOrders || 'No hay comandas registradas en sala.'}</p>`;
    return;
  }

  AppState.allOrders.forEach(order => {
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
          <div style="font-size:0.75rem; color:var(--text-muted);">${order.items.length} ${t.orderItemsCount || 'productos en comanda'}</div>
        </div>
        <span class="order-table-badge">${order.tableNumber}</span>
      </div>

      <div class="order-items-box">
        ${order.items.map(i => {
          const itemCatalog = AppState.menuCatalog.find(m => m.id === i.menuItemId);
          const itemTrans = (itemCatalog?.translations as any)?.[AppState.currentLanguage];
          const itemName = itemTrans?.name || i.name;
          return `
            <div class="order-item-row">
              <span><strong>${i.quantity}x</strong> ${itemName}</span>
              <span style="color:var(--text-muted); font-size:0.8rem;">${(i.unitPrice * i.quantity).toFixed(2)} €</span>
            </div>
            ${i.notes ? `<div class="order-item-notes">${t.orderNote || 'Nota'}: ${i.notes}</div>` : ''}
          `;
        }).join('')}
      </div>

      <div class="order-pack-tags">
        ${order.packaging.bags ? `<span class="pack-tag-pill">🛍️ ${t.packagingBag || 'Bolsa (R.D. 293/2018)'}</span>` : ''}
        ${order.packaging.plasticContainers ? `<span class="pack-tag-pill">♻️ ${t.packagingContainers || 'Envases (Ley 7/2022)'}</span>` : ''}
        <span class="pack-tag-pill">🍴 ${order.packaging.cutleryCount} ${t.packagingCutlery || 'cubiertos eco'}</span>
        ${order.packagingCost ? `<span class="pack-tag-pill" style="color:var(--accent-orange);">+${order.packagingCost.toFixed(2)} €</span>` : ''}
      </div>

      ${!AppState.skipStaffAssignment ? `
        <div class="order-staff-row">
          <div>🏃 ${t.roleWaiter || 'Camarero'}: <strong>${order.waiterName || t.unassigned || 'Sin asignar'}</strong></div>
          <div>👨‍🍳 ${t.roleChef || 'Cocinero'}: <strong>${order.chefName || t.unassigned || 'Sin asignar'}</strong></div>
        </div>
      ` : ''}

      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:0.82rem;">
        <div>${t.orderStatusLabel || 'Estado'}: <strong style="color:var(--accent-orange);">${getTranslatedStatus(order.status, t)}</strong></div>
        <div>${t.orderPaymentLabel || 'Pago'}: <strong style="color:${isPaid ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">${getTranslatedPaymentStatus(order.paymentStatus, t)}</strong></div>
      </div>

      <div class="order-actions-bar">
        ${(!AppState.skipStaffAssignment && !order.waiterId) ? `
          <button class="btn-action btn-waiter-deliver btn-assign-waiter" data-id="${order.id}">
            ${t.btnAttendOrder || '🏃 Atender comanda'}
          </button>
        ` : ''}

        ${order.status === OrderStatus.READY_TO_SERVE ? (
          isPendingCash ? `
            <div style="font-size:0.8rem; color:#ef4444; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-sm); padding:6px 10px; font-weight:700; width:100%;">
              ${t.alertCashDeliveryBlocked || '⚠️ Bloqueo de entrega: Pendiente de cobro en efectivo en sala'}
            </div>
          ` : `
            <button class="btn-action btn-kitchen-ready btn-mark-delivered" data-id="${order.id}">
              ${t.btnDeliverOrder || '🍽️ Entregar a mesa'}
            </button>
          `
        ) : ''}

        ${isPendingCash ? `
          <button class="btn-action btn-waiter-cash btn-confirm-cash" data-id="${order.id}" style="background:var(--accent-amber); color:#000; font-weight:700;">
            ${t.btnCollectCash || '💵 Cobrar'} ${order.total.toFixed(2)} € ${t.inCash || 'en efectivo'}
          </button>
        ` : ''}
      </div>
    `;

    card.querySelector('.btn-assign-waiter')?.addEventListener('click', async () => {
      await assignStaffUseCase.execute({
        orderId: order.id,
        waiterId: AppState.currentUser.id,
        waiterName: AppState.currentUser.name
      });
      showToast((t.toastAssignedWaiter || 'Te has asignado como camarero de la {table}.').replace('{table}', formatTableDisplay(order.tableNumber, t)), 'success');
      refreshAll();
    });

    card.querySelector('.btn-mark-delivered')?.addEventListener('click', async () => {
      if (order.paymentStatus === PaymentStatus.PENDING_CASH) {
        showToast(t.toastDeliveryPendingCash || '⚠️ No se puede entregar a la mesa: la comanda tiene pendiente el cobro en efectivo.', 'warning');
        return;
      }
      await updateStatusUseCase.execute(order.id, OrderStatus.DELIVERED);
      showToast((t.toastOrderDelivered || 'Comanda {orderNumber} entregada a la {table}.').replace('{orderNumber}', order.orderNumber).replace('{table}', formatTableDisplay(order.tableNumber, t)), 'success');
      refreshAll();
    });

    card.querySelector('.btn-confirm-cash')?.addEventListener('click', async () => {
      await processCashUseCase.execute(order.id);
      showToast((t.toastCashConfirmed || 'Cobro en efectivo confirmado para comanda {orderNumber}.').replace('{orderNumber}', order.orderNumber), 'success');
      refreshAll();
    });

    waiterOrdersContainer.appendChild(card);
  });
}
