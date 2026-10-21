import { Router, Request, Response } from 'express';
import { config } from '../config.js';

export const paymentsRouter = Router();

/**
 * GET /api/payments/config
 * Returns public, safe payment configuration (never exposes secret keys or credentials).
 */
paymentsRouter.get('/config', (_req: Request, res: Response): void => {
  res.json({
    emulatorMode: config.payment.emulatorEnabled,
    provider: config.payment.provider,
    currency: config.payment.currency
  });
});

/**
 * POST /api/payments/process
 * Processes a card payment either through the built-in emulator or through the real gateway.
 * Strictly executed on backend to avoid exposing secret keys or gateway tokens to the client.
 */
paymentsRouter.post('/process', async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, tip = 0, currency = config.payment.currency, token } = req.body;

    const numericAmount = Number(amount);
    const numericTip = Number(tip || 0);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ error: 'El importe a cobrar debe ser superior a 0.' });
      return;
    }

    // 1. PAYMENT EMULATOR MODE (Active when PAYMENT_EMULATOR_ENABLED=true)
    if (config.payment.emulatorEnabled) {
      // Simulate gateway network latency
      if (config.payment.emulatorDelayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, config.payment.emulatorDelayMs));
      }

      const txId = `pi_emu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      res.status(200).json({
        success: true,
        transactionId: txId,
        amountCharged: numericAmount,
        tipCharged: numericTip,
        currency,
        provider: 'EMULATOR',
        processedAt: new Date().toISOString()
      });
      return;
    }

    // 2. REAL PAYMENT GATEWAY MODE (Active when PAYMENT_EMULATOR_ENABLED=false)
    if (config.payment.provider === 'STRIPE') {
      const secretKey = config.payment.stripeSecretKey;
      if (!secretKey || secretKey.trim() === '' || secretKey.includes('placeholder')) {
        res.status(500).json({
          error: 'Pasarela configurada en modo REAL pero falta STRIPE_SECRET_KEY en las variables de entorno del servidor (.env).'
        });
        return;
      }

      // Execute Stripe charge or PaymentIntent using standard Stripe REST API
      const totalInCents = Math.round((numericAmount + numericTip) * 100);
      const params = new URLSearchParams();
      params.append('amount', totalInCents.toString());
      params.append('currency', currency.toLowerCase());
      params.append('source', token || 'tok_visa');
      params.append('description', 'Dine & Done Restaurant Card Payment');

      const stripeResponse = await fetch('https://api.stripe.com/v1/charges', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const stripeData = (await stripeResponse.json()) as any;

      if (!stripeResponse.ok || stripeData.error) {
        res.status(400).json({
          success: false,
          error: stripeData.error?.message || 'Transacción rechazada por Stripe.'
        });
        return;
      }

      res.status(200).json({
        success: true,
        transactionId: stripeData.id,
        amountCharged: numericAmount,
        tipCharged: numericTip,
        currency,
        provider: 'STRIPE',
        processedAt: new Date().toISOString()
      });
      return;
    }

    // Fallback if unknown provider
    res.status(400).json({ error: `Proveedor de pagos no soportado: ${config.payment.provider}` });
  } catch (err: any) {
    console.error('Error en POST /api/payments/process:', err);
    res.status(500).json({ error: 'Error interno al procesar el pago en la pasarela.' });
  }
});
