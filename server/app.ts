import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes.js';
import { menuRouter } from './routes/menu.routes.js';
import { ordersRouter } from './routes/orders.routes.js';
import { staffRouter } from './routes/staff.routes.js';
import { paymentsRouter } from './routes/payments.routes.js';

export const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/staff', staffRouter);
app.use('/api/payments', paymentsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
