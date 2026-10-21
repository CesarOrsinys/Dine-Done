import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  jwtSecret: process.env.JWT_SECRET || 'dine-done-default-dev-secret-key-2026',
  supabaseUrl: (process.env.SUPABASE_URL || 'https://uwiraasvvfdwrpxwsgbf.supabase.co').replace(/\/rest\/v1\/?$/, ''),
  supabaseKey: process.env.SUPABASE_ANON_KEY || 'sb_publishable_GCaIaUwOlegZSbCHE7iRUA_U_XJ161F',
  useMock: process.env.USE_MOCK_DB === 'true',
  payment: {
    emulatorEnabled: process.env.PAYMENT_EMULATOR_ENABLED !== 'false', // Default to true for development and risk-free testing
    provider: (process.env.PAYMENT_PROVIDER || 'STRIPE').toUpperCase(),
    currency: (process.env.PAYMENT_CURRENCY || 'EUR').toUpperCase(),
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    emulatorDelayMs: process.env.PAYMENT_EMULATOR_DELAY_MS ? parseInt(process.env.PAYMENT_EMULATOR_DELAY_MS, 10) : 300
  }
};
