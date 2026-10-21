import { Order } from '../../core/domain/entities/Order.js';
import { OrderItem } from '../../core/domain/value-objects/OrderItem.js';
import { PaymentMethod } from '../../core/domain/enums/PaymentMethod.js';
import { AppState } from '../state/AppState.js';
import { translations } from '../i18n/LanguageManager.js';
import { showToast } from '../services/ToastService.js';
import { formatTableDisplay } from './TableComponent.js';
import { createOrderUseCase, services } from '../services/UseCasesService.js';
import { updateCartUI } from './CartComponent.js';
import { renderMenu } from './MenuComponent.js';

export function showOrderConfirmedModal(order: Order) {
  const modal = document.getElementById('order-confirmed-modal');
  if (!modal) return;
  AppState.lastConfirmedOrder = order;
  const t = translations[AppState.currentLanguage] || translations['es'];

  (document.getElementById('conf-order-number') as HTMLElement).innerText = `#${order.orderNumber}`;
  (document.getElementById('conf-order-table') as HTMLElement).innerText = formatTableDisplay(order.tableNumber, t);
  (document.getElementById('conf-order-date') as HTMLElement).innerText = new Date(order.createdAt).toLocaleString(AppState.currentLanguage === 'en' ? 'en-US' : 'es-ES', { 
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
  });

  const payStatusEl = document.getElementById('conf-payment-status') as HTMLElement;
  if (order.paymentMethod === PaymentMethod.STRIPE_CARD) {
    payStatusEl.innerHTML = t.lblPaidCardStripe || '💳 Pagado con Tarjeta (Pasarela Stripe)';
    payStatusEl.style.color = 'var(--accent-emerald)';
  } else {
    payStatusEl.innerHTML = t.lblPendingCashTable || '💵 Pago en Efectivo (A cobrar en mesa)';
    payStatusEl.style.color = 'var(--accent-amber)';
  }

  const receiptBadge = document.getElementById('conf-receipt-badge') as HTMLElement;
  const invoiceBox = document.getElementById('conf-invoice-box') as HTMLElement;

  if (order.receiptType === 'INVOICE' && order.invoiceDetails) {
    receiptBadge.className = 'badge-tag tag-cooking';
    receiptBadge.innerText = t.receiptInvoice || '📑 Factura Fiscal';
    invoiceBox.style.display = 'block';
    (document.getElementById('conf-inv-nif') as HTMLElement).innerText = order.invoiceDetails.nifCif;
    (document.getElementById('conf-inv-name') as HTMLElement).innerText = order.invoiceDetails.legalName;
    (document.getElementById('conf-inv-address') as HTMLElement).innerText = order.invoiceDetails.address || (t.notSpecified || 'No indicada');
    (document.getElementById('conf-inv-email') as HTMLElement).innerText = order.invoiceDetails.email || (t.notSpecified || 'No indicado');
  } else {
    receiptBadge.className = 'badge-tag tag-stock';
    receiptBadge.innerText = t.receiptTicket || '🧾 Ticket de Pago';
    invoiceBox.style.display = 'none';
  }

  const itemsContainer = document.getElementById('conf-items-list') as HTMLElement;
  const itemsCountEl = document.getElementById('conf-items-count') as HTMLElement;
  itemsContainer.innerHTML = '';
  const totalItems = order.items.reduce((acc, i) => acc + i.quantity, 0);
  itemsCountEl.innerText = `${totalItems} ${t.itemsCountSuffix || 'productos en comanda'}`;

  order.items.forEach(i => {
    const itemCatalog = AppState.menuCatalog.find(m => m.id === i.menuItemId);
    const itemTrans = (itemCatalog?.translations as any)?.[AppState.currentLanguage];
    const itemName = itemTrans?.name || i.name;
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
          <span style="color:var(--accent-orange); margin-right:4px;">${i.quantity}x</span> ${itemName}
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

  (document.getElementById('conf-subtotal-net') as HTMLElement).innerText = `${(order.subtotalNet ?? (order.subtotal * 0.79)).toFixed(2)} €`;
  (document.getElementById('conf-vat') as HTMLElement).innerText = `+${(order.vatAmount ?? (order.subtotal * 0.21)).toFixed(2)} €`;
  (document.getElementById('conf-packaging') as HTMLElement).innerText = `${(order.packagingCost ?? 0).toFixed(2)} €`;
  (document.getElementById('conf-tip') as HTMLElement).innerText = `${order.tipAmount.toFixed(2)} €`;
  (document.getElementById('conf-total') as HTMLElement).innerText = `${order.total.toFixed(2)} €`;

  modal.style.display = 'flex';
}

export function setupConfirmedOrderModal() {
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
    if (!AppState.lastConfirmedOrder) return;
    const isInvoice = AppState.lastConfirmedOrder.receiptType === 'INVOICE';
    const docTitle = isInvoice ? `Factura_${AppState.lastConfirmedOrder.orderNumber}` : `Ticket_${AppState.lastConfirmedOrder.orderNumber}`;
    
    const printWindow = window.open('', '_blank', 'width=450,height=600');
    if (!printWindow) {
      window.print();
      return;
    }
    
    const itemsHtml = AppState.lastConfirmedOrder.items.map(i => `
      <tr>
        <td style="padding:4px 0;">${i.quantity}x ${i.name}</td>
        <td style="text-align:right; padding:4px 0;">${(i.unitPrice * i.quantity).toFixed(2)} €</td>
      </tr>
    `).join('');

    const invoiceHeader = isInvoice && AppState.lastConfirmedOrder.invoiceDetails ? `
      <div style="border-top:1px dashed #999; border-bottom:1px dashed #999; padding:8px 0; margin:10px 0; font-size:12px;">
        <strong>DATOS FISCALES DEL CLIENTE:</strong><br>
        NIF/CIF: ${AppState.lastConfirmedOrder.invoiceDetails.nifCif}<br>
        Nombre/Razón: ${AppState.lastConfirmedOrder.invoiceDetails.legalName}<br>
        Dirección: ${AppState.lastConfirmedOrder.invoiceDetails.address || 'N/A'}<br>
        Email: ${AppState.lastConfirmedOrder.invoiceDetails.email || 'N/A'}
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
          <div>Comanda: #${AppState.lastConfirmedOrder.orderNumber} • ${AppState.lastConfirmedOrder.tableNumber}</div>
          <div>Fecha: ${new Date(AppState.lastConfirmedOrder.createdAt).toLocaleString('es-ES')}</div>
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
          <span>${(AppState.lastConfirmedOrder.subtotalNet ?? (AppState.lastConfirmedOrder.subtotal * 0.79)).toFixed(2)} €</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>IVA (21%):</span>
          <span>${(AppState.lastConfirmedOrder.vatAmount ?? (AppState.lastConfirmedOrder.subtotal * 0.21)).toFixed(2)} €</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>Empaques Ley 7/2022:</span>
          <span>${(AppState.lastConfirmedOrder.packagingCost ?? 0).toFixed(2)} €</span>
        </div>
        <div style="display:flex; justify-content:space-between;">
          <span>Propina:</span>
          <span>${AppState.lastConfirmedOrder.tipAmount.toFixed(2)} €</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:bold; margin-top:8px; border-top:1px solid #000; padding-top:6px;">
          <span>TOTAL:</span>
          <span>${AppState.lastConfirmedOrder.total.toFixed(2)} €</span>
        </div>
        <div style="margin-top:14px; text-align:center; font-size:11px;">
          Pago: ${AppState.lastConfirmedOrder.paymentMethod === PaymentMethod.STRIPE_CARD ? 'Tarjeta (Stripe Verificado)' : 'Efectivo en mesa'}<br>
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
    if (!AppState.lastConfirmedOrder) return;
    const curT = translations[AppState.currentLanguage] || translations['es'];
    const isInvoice = AppState.lastConfirmedOrder.receiptType === 'INVOICE';
    const content = JSON.stringify(AppState.lastConfirmedOrder, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${isInvoice ? 'Factura' : 'Ticket'}_${AppState.lastConfirmedOrder.orderNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast((curT.toastReceiptDownloaded || 'Comprobante {orderNumber} descargado con éxito.').replace('{orderNumber}', AppState.lastConfirmedOrder.orderNumber), 'success');
  });
}

export async function handlePlaceOrder() {
  const t = translations[AppState.currentLanguage] || translations['es'];
  if (AppState.currentCart.length === 0) {
    showToast(t.toastCartEmptyWarning || 'Por favor añade al menos un plato a la comanda.', 'warning');
    return;
  }

  const tableInput = (document.getElementById('cart-table-input') as HTMLInputElement).value.trim() || AppState.currentAssignedTable;
  if (!tableInput) {
    showToast(t.toastTableRequired || 'Por favor introduce el número o nombre de mesa.', 'warning');
    return;
  }

  const hasBags = (document.getElementById('pack-bags') as HTMLInputElement).checked;
  const hasPlastic = (document.getElementById('pack-plastic') as HTMLInputElement).checked;

  let invoiceDetails: { nifCif: string; legalName: string; address: string; email: string; } | undefined = undefined;
  if (AppState.currentReceiptType === 'INVOICE') {
    const nif = (document.getElementById('inv-nif') as HTMLInputElement)?.value.trim();
    const name = (document.getElementById('inv-name') as HTMLInputElement)?.value.trim();
    const address = (document.getElementById('inv-address') as HTMLInputElement)?.value.trim();
    const email = (document.getElementById('inv-email') as HTMLInputElement)?.value.trim();

    if (!nif || !name) {
      showToast(t.toastInvoiceFieldsRequired || 'Por favor completa al menos el NIF/CIF y Razón Social para emitir la factura.', 'warning');
      return;
    }
    invoiceDetails = { nifCif: nif, legalName: name, address, email };
  }

  const orderItems: OrderItem[] = AppState.currentCart.map(c => ({
    menuItemId: c.menuItem.id,
    name: c.menuItem.name,
    unitPrice: c.menuItem.price,
    quantity: c.quantity,
    requiresCooking: c.menuItem.requiresCooking,
    notes: c.notes
  }));

  const subtotal = AppState.currentCart.reduce((acc, c) => acc + (c.menuItem.price * c.quantity), 0);
  const tipAmount = parseFloat((subtotal * AppState.currentTipPercent).toFixed(2));

  try {
    showToast(t.toastOrderProcessing || 'Procesando pedido y verificando existencias...', 'info');

    const createdOrder = await createOrderUseCase.execute({
      tableNumber: tableInput,
      customerName: AppState.currentUser.name,
      items: orderItems,
      packaging: {
        bags: hasBags,
        plasticContainers: hasPlastic,
        cutleryCount: AppState.cutleryCount
      },
      paymentMethod: AppState.currentPaymentMethod,
      tipAmount: tipAmount,
      stripeToken: 'tok_visa_success',
      receiptType: AppState.currentReceiptType,
      invoiceDetails: invoiceDetails
    });

    const payMsg = createdOrder.paymentMethod === PaymentMethod.STRIPE_CARD
      ? (t.orderPaidCardMsg || '¡Pago con tarjeta verificado mediante Stripe!')
      : (t.orderPendingCashMsg || 'Cobro marcado en efectivo. El camarero cobrará en mesa.');

    const packNotice = createdOrder.packagingCost ? ` (${t.servicePackaging}: +${createdOrder.packagingCost.toFixed(2)} €)` : '';
    const confToast = (t.toastOrderConfirmed || '🎉 ¡Comanda {orderNumber} confirmada para la {table}!{packNotice} {payMsg}')
      .replace('{orderNumber}', createdOrder.orderNumber)
      .replace('{table}', formatTableDisplay(createdOrder.tableNumber, t))
      .replace('{packaging}', packNotice)
      .replace('{packNotice}', packNotice)
      .replace('{payment}', payMsg)
      .replace('{payMsg}', payMsg);
    showToast(confToast, 'success');

    // Reset Cart
    AppState.currentCart = [];
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
    AppState.menuCatalog = await services.menuRepo.getAll();
    renderMenu();
    AppState.allOrders = await services.orderRepo.findAll();
  } catch (error: any) {
    showToast((t.toastOrderError || '❌ Error al procesar el pedido: {error}').replace('{error}', error.message), 'danger');
  }
}
