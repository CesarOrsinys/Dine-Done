/**
 * Stripe Checkout Embedded Form Service
 * Manages the Stripe Checkout modal popup (Dahlia SDK) on demand when placing card orders.
 */

declare const Stripe: any;

export interface StripePaymentOptions {
  amount: number;
  tableNumber: string;
  onSuccess: (paymentData: { session_id?: string }) => Promise<void> | void;
  onCancel?: () => void;
}

let activePaymentOptions: StripePaymentOptions | null = null;
let currentCheckoutSdk: any = null;

export function closeStripePaymentModal(cancelledByUser: boolean = false): void {
  const modal = document.getElementById('stripe-payment-modal');
  if (modal) modal.style.display = 'none';

  const formContainer = document.getElementById('checkout-form');
  if (formContainer) formContainer.innerHTML = '';

  const loadingEl = document.getElementById('stripe-modal-loading');
  if (loadingEl) loadingEl.style.display = 'block';

  const errorEl = document.getElementById('stripe-modal-error');
  if (errorEl) errorEl.style.display = 'none';

  if (cancelledByUser && activePaymentOptions?.onCancel) {
    activePaymentOptions.onCancel();
  }
  activePaymentOptions = null;
  currentCheckoutSdk = null;
}

export async function openStripePaymentModal(options: StripePaymentOptions): Promise<void> {
  activePaymentOptions = options;
  const modal = document.getElementById('stripe-payment-modal');
  if (!modal) return;

  const modalAmount = document.getElementById('stripe-modal-amount');
  if (modalAmount) {
    modalAmount.innerText = `Total a pagar: ${options.amount.toFixed(2)} €`;
  }

  const loadingEl = document.getElementById('stripe-modal-loading');
  const errorEl = document.getElementById('stripe-modal-error');
  const formContainer = document.getElementById('checkout-form');

  if (loadingEl) loadingEl.style.display = 'block';
  if (errorEl) errorEl.style.display = 'none';
  if (formContainer) formContainer.innerHTML = '';

  modal.style.display = 'flex';

  const publishableKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51UT6rCDT7chPC0NZPNvdhbxYVCY03gGGtCp1bDcbvKrmYZ9QhM2fXdcDJgN2Fw0wUTMMsnHO2ZPEfdBRnRHj8arj00aG5QfHzs';
  
  if (typeof Stripe === 'undefined') {
    if (errorEl) {
      errorEl.innerText = 'El SDK seguro de Stripe no está cargado. Por favor recarga la página.';
      errorEl.style.display = 'block';
    }
    if (loadingEl) loadingEl.style.display = 'none';
    return;
  }

  const stripe = Stripe(publishableKey);

  const appearance = {
    theme: "stripe",
    labels: "auto",
    inputs: "spaced",
    variables: {
      borderRadius: "6px",
      colorBackground: "#ffffff",
      colorDanger: "#ef4444",
      colorPrimary: "#f97316",
      colorSuccess: "#10b981",
      colorText: "#1e293b",
      fontFamily: "Inter, system-ui, sans-serif",
      fontSizeBase: "15px",
      spacingUnit: "4px"
    }
  };

  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: options.amount,
        table: options.tableNumber
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    const { client_secret, session_id } = await res.json();
    if (!client_secret) {
      throw new Error('No se recibió client_secret desde el servidor de pagos.');
    }

    const checkout = stripe.initCheckoutFormSdk({ clientSecret: client_secret, appearance });
    currentCheckoutSdk = checkout;

    const form = checkout.createForm({ layout: 'expanded' });
    form.mount('#checkout-form');

    const loadActionsResult = await checkout.loadActions();
    if (loadingEl) loadingEl.style.display = 'none';

    if (loadActionsResult.type === 'success') {
      form.on('confirm', async (event: any) => {
        try {
          if (loadingEl) {
            loadingEl.style.display = 'block';
            const txt = document.getElementById('txt-stripe-modal-loading');
            if (txt) txt.innerText = 'Verificando y confirmando pago con Stripe...';
          }
          if (errorEl) errorEl.style.display = 'none';

          // Stripe Checkout Session ya tiene configurado return_url en el servidor.
          // Por normativa de Stripe, no se debe enviar returnUrl en confirm() si ya existe en la sesión.
          const confirmResult = await loadActionsResult.actions.confirm({
            formConfirmEvent: event
          });

          if (confirmResult?.error) {
            throw new Error(confirmResult.error.message || 'Error al procesar el pago.');
          }

          // Si el pago no requirió redirección externa y se completó directamente:
          if (!confirmResult || confirmResult.status === 'succeeded' || !confirmResult.error) {
            const successCb = activePaymentOptions?.onSuccess;
            closeStripePaymentModal(false);
            if (successCb) {
              await successCb({ session_id });
            }
          }
        } catch (confirmError: any) {
          console.error('Payment confirmation error:', confirmError);
          if (loadingEl) loadingEl.style.display = 'none';
          if (errorEl) {
            errorEl.innerText = confirmError.message || 'Error al procesar el pago. Por favor revisa los datos de tu tarjeta.';
            errorEl.style.display = 'block';
          }
        }
      });
    }
  } catch (error: any) {
    console.error('Failed to initialize Stripe Checkout Form SDK:', error);
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
      errorEl.innerText = error.message || 'Error al conectar con la pasarela de pago.';
      errorEl.style.display = 'block';
    }
  }
}

export function initStripeCheckoutForm(): void {
  const btnClose = document.getElementById('btn-close-stripe-modal');
  const btnCancel = document.getElementById('btn-cancel-stripe-payment');
  const modal = document.getElementById('stripe-payment-modal');

  btnClose?.addEventListener('click', () => closeStripePaymentModal(true));
  btnCancel?.addEventListener('click', () => closeStripePaymentModal(true));

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeStripePaymentModal(true);
    }
  });
}
