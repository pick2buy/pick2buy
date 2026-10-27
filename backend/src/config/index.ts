import dotenv from 'dotenv';
// Local OAuth settings stay out of the tracked backend/.env file.
dotenv.config({ path: '.env.local' });
dotenv.config();

// Local development can keep the hosted database URL outside the legacy SQLite .env file.
// Deployment platforms should provide DATABASE_URL directly.
if (process.env.NODE_ENV !== 'test' && process.env.POSTGRES_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.POSTGRES_DATABASE_URL;
}

if (process.env.NODE_ENV === 'production' &&
    (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET ||
     process.env.JWT_SECRET.includes('change_in_production') || process.env.JWT_REFRESH_SECRET.includes('change_in_production'))) {
  throw new Error('JWT secrets must be configured for production');
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  // Comma-separated origins let the apex and www storefront domains coexist.
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  // Used in transactional-email links; the first configured storefront origin
  // is the canonical one.
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')[0]
    .trim(),
  backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    productImageBucket: process.env.SUPABASE_PRODUCT_IMAGE_BUCKET || 'product-images',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret_pick2buy_jwt_access_key_2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_pick2buy_jwt_refresh_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_pick2buy_placeholder_key',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_pick2buy_placeholder_secret',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || 'pick2buy.in@gmail.com',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'Pick2Buy India <pick2buy.in@gmail.com>',
  },

  cod: {
    enabled: true,
    maxAmount: 15000,
    fee: 49,
    restrictedPincodes: ['111111', '999999'],
  },
};
