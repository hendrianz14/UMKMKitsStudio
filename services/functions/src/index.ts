import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import * as functions from 'firebase-functions';
import healthRouter from './routes/health.js';
import aiRouter from './routes/ai.js';
import paymentsRouter from './routes/payments.js';

const app = express();

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '10mb' }));

app.use((req, _res, next) => {
  const uid = req.header('x-user-id');
  if (uid) {
    req.user = {
      uid,
      email: req.header('x-user-email') ?? undefined
    };
  }
  next();
});

app.get('/', (_req, res) => {
  res.json({ status: 'online' });
});

app.use(healthRouter);
app.use(aiRouter);
app.use(paymentsRouter);

export { app };

export const api = functions.region('asia-southeast2').https.onRequest(app);

if (process.env.NODE_ENV !== 'production' && !process.env.FUNCTION_NAME) {
  const port = Number(process.env.PORT ?? 5001);
  app.listen(port, () => {
    console.log(`Local functions server listening on http://localhost:${port}`);
  });
}
