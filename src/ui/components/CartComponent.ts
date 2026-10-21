import { MenuItem } from '../../core/domain/entities/MenuItem.js';
import { UserRole } from '../../core/domain/enums/UserRole.js';
import { PaymentMethod } from '../../core/domain/enums/PaymentMethod.js';
import { AppState } from '../state/AppState.js';
import { translations } from '../i18n/LanguageManager.js';
import { showToast } from '../services/ToastService.js';
import { handlePlaceOrder } from './OrderModalComponent.js';

export function addToCart(item: MenuItem) {
  const t = translations[AppState.currentLanguage] || translations['es'];
  const trans = (item.translations as any)?.[AppState.currentLanguage];
  const displayName = trans?.name || item.name;

  if (item.stock <= 0) {
    showToast((t.toastItemSoldOut || 'El plato "{name}" está agotado.').replace('{name}', displayName), 'warning');
    return;
  }

  const existing = AppState.currentCart.find(c => c.menuItem.id === item.id);
  if (existing) {
    if (existing.quantity >= item.stock) {
      showToast((t.toastMaxStockReached || 'No puedes añadir más unidades de "{name}". Stock máximo alcanzado ({stock}).')
        .replace('{name}', displayName)
        .replace('{stock}', item.stock.toString()), 'warning');
      return;
    }
    existing.quantity++;
  } else {
    AppState.currentCart.push({ menuItem: item, quantity: 1 });
  }

  const toastTemplate = t.toastAddedToCart || t.toastDishAdded || 'Añadido "{name}" a tu comanda.';
  showToast(toastTemplate.replace('{name}', displayName), 'success');
  updateCartUI();
}

export function calculatePackagingCost(): number {
  const hasBags = (document.getElementById('pack-bags') as HTMLInputElement)?.checked ?? false;
  const hasPlastic = (document.getElementById('pack-plastic') as HTMLInputElement)?.checked ?? false;
  let packCost = 0;
  if (hasBags) packCost += 0.10; // R.D. 293/2018 sobre bolsas de plástico
  if (hasPlastic) packCost += 0.15; // Ley 7/2022 de envases de un solo uso
  packCost += AppState.cutleryCount * 0.10; // Cubiertos ecológicos biodegradables
  return parseFloat(packCost.toFixed(2));
}

export function updateBillTotals(rawSubtotal: number) {
  const vatAmount = parseFloat((rawSubtotal * 0.21).toFixed(2));
  const subtotalNet = parseFloat((rawSubtotal - vatAmount).toFixed(2));

  const packagingAmount = calculatePackagingCost();
  const tipAmount = parseFloat((rawSubtotal * AppState.currentTipPercent).toFixed(2));
  const total = parseFloat((subtotalNet + vatAmount + packagingAmount + tipAmount).toFixed(2));

  const subtotalEl = document.getElementById('bill-subtotal');
  if (subtotalEl) subtotalEl.innerText = `${subtotalNet.toFixed(2)} €`;

  const vatEl = document.getElementById('bill-vat');
  if (vatEl) vatEl.innerText = `+${vatAmount.toFixed(2)} €`;

  const packEl = document.getElementById('bill-packaging');
  if (packEl) packEl.innerText = `${packagingAmount.toFixed(2)} €`;

  const tipEl = document.getElementById('bill-tip');
  if (tipEl) tipEl.innerText = `${tipAmount.toFixed(2)} € (${(AppState.currentTipPercent * 100).toFixed(0)}%)`;

  const totalEl = document.getElementById('bill-total');
  if (totalEl) totalEl.innerText = `${total.toFixed(2)} €`;

  const mobileCountEl = document.getElementById('mobile-cart-count');
  const totalCount = AppState.currentCart.reduce((acc, c) => acc + c.quantity, 0);
  if (mobileCountEl) {
    mobileCountEl.innerText = totalCount.toString();
  }
  const mobileTotalEl = document.getElementById('mobile-cart-total');
  if (mobileTotalEl) {
    mobileTotalEl.innerText = `${total.toFixed(2)} €`;
  }
  const mobileCartBar = document.getElementById('mobile-cart-bar');
  if (mobileCartBar) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 1025;
    if (totalCount > 0 && AppState.currentUser.role === UserRole.CUSTOMER && isMobile) {
      mobileCartBar.style.display = 'flex';
    } else {
      mobileCartBar.style.display = 'none';
    }
  }
}

export function updateCartUI() {
  const container = document.getElementById('cart-items-container');
  const counterEl = document.getElementById('cart-items-counter');
  if (!container || !counterEl) return;

  const totalCount = AppState.currentCart.reduce((acc, c) => acc + c.quantity, 0);
  const t = translations[AppState.currentLanguage] || translations['es'];
  counterEl.innerText = `${totalCount} ${t.items || (totalCount === 1 ? 'ítem' : 'ítems')}`;

  if (AppState.currentCart.length === 0) {
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

  AppState.currentCart.forEach((item, index) => {
    subtotal += item.menuItem.price * item.quantity;
    const trans = (item.menuItem.translations as any)?.[AppState.currentLanguage];
    const displayName = trans?.name || item.menuItem.name;

    const netUnitPrice = parseFloat((item.menuItem.price * 0.79).toFixed(2));
    const netLine = parseFloat((netUnitPrice * item.quantity).toFixed(2));

    const unitPriceFormatted = (t.unitPriceExclVat || '{price} €/ud sin IVA').replace('{price}', netUnitPrice.toFixed(2));
    const unitPriceSpan = item.quantity > 1
      ? `<span style="font-size:0.72rem; color:var(--text-muted); font-weight:400; margin-left:3px;">(${unitPriceFormatted})</span>`
      : '';

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.style.display = 'flex';
    row.style.flexDirection = 'column';
    row.style.alignItems = 'stretch';
    row.style.gap = '6px';

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
            ${unitPriceSpan}
          </div>
        </div>
        <div class="cart-qty-ctrl">
          <button class="btn-qty btn-minus" data-idx="${index}" title="Reducir cantidad">-</button>
          <span style="font-size:0.85rem; font-weight:700; width:16px; text-align:center;">${item.quantity}</span>
          <button class="btn-qty btn-plus" data-idx="${index}" title="Aumentar cantidad">+</button>
          <button class="btn-qty btn-remove" data-idx="${index}" title="Eliminar plato" style="color:#ef4444; border-color:rgba(239,68,68,0.3); margin-left:4px;">🗑️</button>
        </div>
      </div>
      <div style="width:100%;">
        <input type="text" class="cart-item-note-input" data-idx="${index}" value="${item.notes || ''}" placeholder="${t.dishNotePlaceholder || 'Nota de cocina (ej. sin cebolla, punto de carne...)'}" style="width:100%; box-sizing:border-box; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:4px; padding:3px 8px; font-size:0.72rem; color:var(--text-main); outline:none;">
      </div>
    `;

    const noteInput = row.querySelector('.cart-item-note-input') as HTMLInputElement;
    noteInput?.addEventListener('input', (e) => {
      item.notes = (e.target as HTMLInputElement).value;
    });

    row.querySelector('.btn-minus')?.addEventListener('click', () => {
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        AppState.currentCart.splice(index, 1);
      }
      updateCartUI();
    });

    row.querySelector('.btn-plus')?.addEventListener('click', () => {
      if (item.quantity >= item.menuItem.stock) {
        showToast((t.toastMaxStockForDish || 'Stock máximo disponible para este plato: {stock}')
          .replace('{stock}', item.menuItem.stock.toString()), 'warning');
        return;
      }
      item.quantity++;
      updateCartUI();
    });

    row.querySelector('.btn-remove')?.addEventListener('click', () => {
      AppState.currentCart.splice(index, 1);
      updateCartUI();
    });

    container.appendChild(row);
  });

  updateBillTotals(subtotal);
}

export function setupCartControls() {
  const packBags = document.getElementById('pack-bags');
  packBags?.addEventListener('change', () => {
    const subtotal = AppState.currentCart.reduce((acc, c) => acc + (c.menuItem.price * c.quantity), 0);
    updateBillTotals(subtotal);
  });

  const packPlastic = document.getElementById('pack-plastic');
  packPlastic?.addEventListener('change', () => {
    const subtotal = AppState.currentCart.reduce((acc, c) => acc + (c.menuItem.price * c.quantity), 0);
    updateBillTotals(subtotal);
  });

  document.getElementById('btn-cutlery-minus')?.addEventListener('click', () => {
    if (AppState.cutleryCount > 0) {
      AppState.cutleryCount--;
      document.getElementById('cutlery-count-display')!.innerText = AppState.cutleryCount.toString();
      const subtotal = AppState.currentCart.reduce((acc, c) => acc + (c.menuItem.price * c.quantity), 0);
      updateBillTotals(subtotal);
    }
  });

  document.getElementById('btn-cutlery-plus')?.addEventListener('click', () => {
    AppState.cutleryCount++;
    document.getElementById('cutlery-count-display')!.innerText = AppState.cutleryCount.toString();
    const subtotal = AppState.currentCart.reduce((acc, c) => acc + (c.menuItem.price * c.quantity), 0);
    updateBillTotals(subtotal);
  });

  document.querySelectorAll('.chip-tip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip-tip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      AppState.currentTipPercent = parseFloat(chip.getAttribute('data-tip') || '0');
      const subtotal = AppState.currentCart.reduce((acc, c) => acc + (c.menuItem.price * c.quantity), 0);
      updateBillTotals(subtotal);
    });
  });

  document.getElementById('btn-pay-stripe')?.addEventListener('click', () => {
    document.getElementById('btn-pay-stripe')!.classList.add('active');
    document.getElementById('btn-pay-cash')!.classList.remove('active');
    AppState.currentPaymentMethod = PaymentMethod.STRIPE_CARD;
  });

  document.getElementById('btn-pay-cash')?.addEventListener('click', () => {
    document.getElementById('btn-pay-cash')!.classList.add('active');
    document.getElementById('btn-pay-stripe')!.classList.remove('active');
    AppState.currentPaymentMethod = PaymentMethod.CASH;
  });

  const btnTypeTicket = document.getElementById('btn-type-ticket');
  const btnTypeInvoice = document.getElementById('btn-type-invoice');
  const invoiceContainer = document.getElementById('invoice-fields-container');

  btnTypeTicket?.addEventListener('click', () => {
    AppState.currentReceiptType = 'TICKET';
    btnTypeTicket.classList.add('active');
    btnTypeInvoice?.classList.remove('active');
    if (invoiceContainer) invoiceContainer.style.display = 'none';
  });

  btnTypeInvoice?.addEventListener('click', () => {
    AppState.currentReceiptType = 'INVOICE';
    btnTypeInvoice.classList.add('active');
    btnTypeTicket?.classList.remove('active');
    if (invoiceContainer) invoiceContainer.style.display = 'flex';
  });

  document.getElementById('btn-place-order')?.addEventListener('click', handlePlaceOrder);
}

export function setupMobileCartDrawer() {
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

  window.addEventListener('resize', () => {
    const isMobile = window.innerWidth <= 1025;
    const mobileCartBar = document.getElementById('mobile-cart-bar');
    const totalCount = AppState.currentCart.reduce((acc, c) => acc + c.quantity, 0);
    if (!isMobile) {
      closeDrawer();
      if (mobileCartBar) mobileCartBar.style.display = 'none';
    } else {
      if (mobileCartBar) {
        mobileCartBar.style.display = (totalCount > 0 && AppState.currentUser.role === UserRole.CUSTOMER) ? 'flex' : 'none';
      }
    }
  });
}
