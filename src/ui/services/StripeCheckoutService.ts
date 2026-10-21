/**
 * Stripe Checkout Embedded Form Service
 * Initializes Stripe.js (Dahlia) and mounts embedded payment form.
 */

declare const Stripe: any;

export async function initStripeCheckoutForm(): Promise<void> {
  const container = document.getElementById('checkout-form');
  if (!container) return;

  const publishableKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...';
  
  if (typeof Stripe === 'undefined') {
    console.warn('Stripe.js (Dahlia) is not loaded.');
    return;
  }

  const stripe = Stripe(publishableKey);

  const appearance = {
    "theme": "stripe",
    "labels": "auto",
    "inputs": "spaced",
    "variables": {
      "borderRadius": "4px",
      "colorBackground": "#ffffff",
      "colorDanger": "#df1b41",
      "colorPrimary": "#0570de",
      "colorSuccess": "#00c853",
      "colorText": "#30313d",
      "fontFamily": "default",
      "fontSizeBase": "16px",
      "spacingUnit": "4px"
    }
  };

  try {
    const clientSecret = fetch('/api/create-checkout-session', { method: 'POST' })
      .then((response) => response.json())
      .then((json) => json.client_secret);

    const checkout = stripe.initCheckoutFormSdk({ clientSecret, appearance });

    const form = checkout.createForm({ layout: 'expanded' });
    form.mount('#checkout-form');

    const loadActionsResult = await checkout.loadActions();
    if (loadActionsResult.type === 'success') {
      form.on('confirm', async (event: any) => {
        try {
          await loadActionsResult.actions.confirm({ formConfirmEvent: event });
        } catch (error) {
          console.error('Payment confirmation error:', error);
        }
      });
    }
  } catch (error) {
    console.error('Failed to initialize Stripe Checkout Form SDK:', error);
  }
}
