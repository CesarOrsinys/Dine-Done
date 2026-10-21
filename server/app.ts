import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes.js';
import { menuRouter } from './routes/menu.routes.js';
import { ordersRouter } from './routes/orders.routes.js';
import { staffRouter } from './routes/staff.routes.js';
import { paymentsRouter } from './routes/payments.routes.js';
import { checkoutRouter, handleStripeWebhook } from './routes/checkout.routes.js';

export const app = express();

app.use(cors());

// Stripe Webhook requires raw body for signature verification
app.post('/api/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());

// API Routes
app.use('/api', checkoutRouter);
app.use('/', checkoutRouter);
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/staff', staffRouter);
app.use('/api/payments', paymentsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
