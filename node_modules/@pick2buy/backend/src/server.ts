import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { config } from './config';
import apiRoutes from './routes';
import { authenticateJwt } from './middlewares/auth';
import { errorHandler } from './middlewares/error';

const app = express();

// Security and utility middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost dev servers or matching frontend
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiter for general endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

// JWT token extraction middleware
app.use(authenticateJwt);

// Mount API routes
app.use('/api', apiRoutes);

// Centralized error handler
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Pick2Buy Backend running at http://localhost:${PORT}`);
  console.log(`💼 Official Brand Contact: pick2buy.in@gmail.com`);
  console.log(`🌐 Target: pick2buy.in (India / INR ₹)`);
  console.log(`=======================================================`);
});

export default app;
