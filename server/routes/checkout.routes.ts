import { Router, Request, Response } from 'express';
import Stripe from 'stripe';

export const checkoutRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-03-25.dahlia' as any
});

/**
 * POST /api/create-checkout-session
 * Creates a Stripe Checkout Session configured for embedded form (ui_mode: "form").
 */
checkoutRouter.post('/create-checkout-session', async (_req: Request, res: Response): Promise<void> => {
  try {
    // TODO: Set mode to "subscription" if selling recurring products.
    const mode: string = "payment";

    // Use the fixed_by_ui parameters from the Field Intents section.
    // line_items is sample_only — replace with real values, then list in TODO.
    // Only include payment_method_collection when mode is "subscription".
    const sessionParams: any = {
      ui_mode: "form",
      mode,
      line_items: [{ price: "price_...", quantity: 1 }],
      billing_address_collection: "auto",
      phone_number_collection: {
        enabled: false,
      },
      automatic_tax: {
        enabled: false,
      },
      submit_type: "auto",
      integration_identifier: "custom_embedded_web_0002",
    };

    if (mode === "subscription") {
      sessionParams.payment_method_collection = "always"; // Use the fixed_by_ui value from Field Intents
    }

    try {
      const session = await stripe.checkout.sessions.create(sessionParams);
      res.json({ client_secret: session.client_secret });
    } catch (createErr: any) {
      // If the placeholder price_... does not exist in Stripe Dashboard, fallback to price_data
      if (createErr.message?.includes('price') || createErr.param === 'line_items') {
        const dynamicParams = {
          ...sessionParams,
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: { name: 'Comanda Restaurante Dine & Done' },
                unit_amount: Math.round((Number(_req.body?.amount) || 15) * 100),
              },
              quantity: 1,
            },
          ],
        };
        const session = await stripe.checkout.sessions.create(dynamicParams);
        res.json({ client_secret: session.client_secret });
        return;
      }
      throw createErr;
    }
  } catch (error: any) {
    console.error("Error creating Stripe Checkout Session:", error);
    res.status(500).json({ error: error.message || "Failed to create checkout session" });
  }
});

/**
 * Webhook handler for Stripe Checkout events
 */
export const handleStripeWebhook = (req: Request, res: Response): void => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event = req.body;

  if (endpointSecret) {
    const signature = req.headers['stripe-signature'] as string;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    } catch (err: any) {
      console.log('Webhook signature verification failed.', err.message);
      res.sendStatus(400);
      return;
    }
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('Checkout completed:', session.id);

      // Verify terms of service acceptance
      if (session.consent?.terms_of_service === 'accepted') {
        console.log('Customer accepted terms of service');
      }

      // Check promotional email consent (opt_in or opt_out)
      if (session.consent?.promotions === 'opt_in') {
        const email = session.customer_details?.email;
        console.log('Customer opted in for promotional emails:', email);
        // Add email to your marketing list
      }
      break;
    }
    case 'invoice.paid': {
      const invoice = event.data.object;
      console.log('Invoice paid successfully:', invoice.id);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      console.warn('Invoice payment failed:', invoice.id);
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      break;
    }
    default:
      console.log('Unhandled event type:', event.type);
  }

  res.sendStatus(200);
};
