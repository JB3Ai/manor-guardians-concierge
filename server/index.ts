import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import process from 'node:process';
import consultations from './consultations';
import { HttpError } from './http';
import payments from './payments';
import portal from './portal';
import { getSupabaseAdmin } from './supabase';
import { paystackWebhookRouter, whatsappWebhookRouter } from './webhooks';

const app = express();
const port = Number(process.env.PORT || 3001);
const frontendOrigin =
  process.env.FRONTEND_ORIGIN ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('PORT must be a valid TCP port.');
}
if (!frontendOrigin) {
  throw new Error('FRONTEND_ORIGIN must be set to the deployed frontend origin in production.');
}

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((request: Request, response: Response, next: NextFunction) => {
  const origin = request.get('origin');
  if (origin && origin !== frontendOrigin) {
    response.status(403).json({ error: 'This origin is not allowed to access the API.' });
    return;
  }
  if (origin) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type, X-Portal-Token'
    );
    response.setHeader('Access-Control-Max-Age', '600');
  }
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }
  next();
});

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use(
  '/api/webhooks/paystack',
  express.raw({ type: 'application/json', limit: '1mb' }),
  paystackWebhookRouter
);
app.use(
  '/api/webhooks/whatsapp',
  express.raw({ type: 'application/json', limit: '1mb' }),
  whatsappWebhookRouter
);

app.use(express.json({ limit: '1mb' }));
app.use('/api/consultations', consultations);
app.use('/api/portal', portal);
app.use('/api/paystack', payments);

app.use((_request, response) => {
  response.status(404).json({ error: 'API route not found.' });
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    response
      .status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400)
      .json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'The uploaded photo exceeds 10 MB.' : 'The uploaded photo is invalid.' });
    return;
  }
  if (error instanceof HttpError) {
    response.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof SyntaxError) {
    response.status(400).json({ error: 'The request body contains invalid JSON.' });
    return;
  }
  console.error('Unhandled API error:', error);
  response.status(500).json({ error: 'An unexpected server error occurred.' });
});

getSupabaseAdmin();
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Manor Guardians API listening on port ${port}.`);
});

function shutdown(): void {
  server.close((error) => {
    if (error) {
      console.error('API server shutdown failed:', error);
      process.exitCode = 1;
    }
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
