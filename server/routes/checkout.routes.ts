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
    const mode: string = "payment";
    const origin = (_req.headers.origin as string) || (_req.headers.referer as string) || process.env.DOMAIN || 'http://localhost:5173';
    const cleanOrigin = origin.replace(/\/$/, '');
    const returnUrl = `${cleanOrigin}/?session_id={CHECKOUT_SESSION_ID}&payment_status=success`;

    const rawAmount = Number(_req.body?.amount) || 15;
    const amountInCents = Math.round(rawAmount * 100);
    const tableName = _req.body?.table ? `Mesa: ${_req.body.table}` : 'Sala Principal';

    // Use the fixed_by_ui parameters from the Field Intents section.
    // return_url is mandatory for ui_mode: "form" in Stripe Checkout.
    // payment_method_types: ["card"] restricts checkout exclusively to credit/debit card.
    const sessionParams: any = {
      ui_mode: "form",
      mode,
      return_url: returnUrl,
      payment_method_types: ["card"],
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
      sessionParams.payment_method_collection = "always";
    }

    try {
      const session = await stripe.checkout.sessions.create(sessionParams);
      res.json({ client_secret: session.client_secret, session_id: session.id });
    } catch (createErr: any) {
      // If the placeholder price_... does not exist in Stripe Dashboard, fallback to dynamic price_data
      if (createErr.message?.includes('price') || createErr.param === 'line_items') {
        const dynamicParams = {
          ...sessionParams,
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: { 
                  name: `Comanda Restaurante - ${tableName}`,
                  description: `Servicio gastronómico en ${tableName}`
                },
                unit_amount: amountInCents > 0 ? amountInCents : 1500,
              },
              quantity: 1,
            },
          ],
        };
        const session = await stripe.checkout.sessions.create(dynamicParams);
        res.json({ client_secret: session.client_secret, session_id: session.id });
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
 * GET /api/checkout-session/:sessionId
 * Checks session status and payment confirmation
 */
checkoutRouter.get('/checkout-session/:sessionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = String(req.params.sessionId);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      client_secret: session.client_secret
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
