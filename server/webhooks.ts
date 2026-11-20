import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { Request, Response, Router } from 'express';
import process from 'node:process';
import { asyncRoute, HttpError } from './http';
import { getSupabaseAdmin } from './supabase';

export const paystackWebhookRouter = Router();
export const whatsappWebhookRouter = Router();

export function signatureMatches(
  rawBody: Buffer,
  providedSignature: string | undefined,
  secret: string,
  algorithm: 'sha512' | 'sha256',
  prefix = ''
): boolean {
  if (!providedSignature) return false;
  const expected = createHmac(algorithm, secret).update(rawBody).digest();
  const suppliedHex = providedSignature.startsWith(prefix)
    ? providedSignature.slice(prefix.length)
    : providedSignature;
  if (!/^[\da-f]+$/i.test(suppliedHex) || suppliedHex.length !== expected.length * 2) {
    return false;
  }
  const supplied = Buffer.from(suppliedHex, 'hex');
  return supplied.length === expected.length && timingSafeEqual(expected, supplied);
}

paystackWebhookRouter.post(
  '/',
  asyncRoute(async (request: Request, response: Response) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new HttpError(503, 'Paystack webhook credentials are not configured.');
    if (!Buffer.isBuffer(request.body)) {
      throw new HttpError(400, 'A raw Paystack webhook body is required.');
    }
    if (!signatureMatches(request.body, request.get('x-paystack-signature'), secret, 'sha512')) {
      throw new HttpError(401, 'Paystack webhook signature is invalid.');
    }

    let payload: unknown;
    try {
      payload = JSON.parse(request.body.toString('utf8'));
    } catch {
      throw new HttpError(400, 'The Paystack webhook body is invalid JSON.');
    }
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('event' in payload) ||
      !('data' in payload) ||
      typeof payload.data !== 'object' ||
      payload.data === null
    ) {
      throw new HttpError(400, 'The Paystack webhook payload is incomplete.');
    }

    const eventName = payload.event;
    const data = payload.data as Record<string, unknown>;
    if (
      eventName !== 'charge.success' &&
      eventName !== 'charge.failed' &&
      eventName !== 'paymentrequest.success'
    ) {
      response.status(200).json({ received: true });
      return;
    }
    const paymentReference =
      eventName === 'paymentrequest.success' ? data.request_code : data.reference;
    if (typeof paymentReference !== 'string' || typeof data.amount !== 'number') {
      throw new HttpError(400, 'The Paystack payment event is missing its reference or amount.');
    }

    const supabase = getSupabaseAdmin();
    const { data: payment, error: paymentError } = await supabase
      .from('payment_events')
      .select('id, stay_id, payment_type, amount_zar, status')
      .eq('paystack_reference', paymentReference)
      .maybeSingle();
    if (paymentError) {
      console.error('Paystack event lookup failed:', paymentError.message);
      throw new HttpError(502, 'The payment event could not be processed.');
    }
    if (!payment) {
      console.error('Paystack event has an unknown reference:', paymentReference);
      response.status(200).json({ received: true });
      return;
    }
    if (eventName === 'charge.failed') {
      if (payment.status !== 'paid' && payment.status !== 'failed') {
        const { error: failedPaymentError } = await supabase
          .from('payment_events')
          .update({ status: 'failed' })
          .eq('id', payment.id)
          .eq('status', 'pending');
        if (failedPaymentError) {
          console.error('Paystack failed-event update failed:', failedPaymentError.message);
          throw new HttpError(502, 'The failed payment event could not be recorded.');
        }
      }
      response.status(200).json({ received: true });
      return;
    }
    const expectedAmount = Math.round(Number(payment.amount_zar) * 100);
    if (
      data.currency !== 'ZAR' ||
      (eventName === 'charge.success' &&
        data.status !== undefined &&
        data.status !== 'success') ||
      !Number.isSafeInteger(data.amount) ||
      data.amount !== expectedAmount
    ) {
      throw new HttpError(400, 'The Paystack payment amount does not match the invoice.');
    }
    const newStayStatus =
      payment.payment_type === 'deposit_50' ? 'confirmed' : 'completed';
    if (payment.status === 'paid') {
      const { error: stayError } = await supabase
        .from('stays')
        .update({ status: newStayStatus })
        .eq('id', payment.stay_id);
      if (stayError) {
        console.error('Stay payment status update failed:', stayError.message);
        throw new HttpError(502, 'The payment was recorded but the stay status could not be updated.');
      }
      response.status(200).json({ received: true, duplicate: true });
      return;
    }

    const { data: updatedPayment, error: updatePaymentError } = await supabase
      .from('payment_events')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', payment.id)
      .in('status', ['pending', 'failed'])
      .select('id')
      .maybeSingle();
    if (updatePaymentError) {
      console.error('Paystack event update failed:', updatePaymentError.message);
      throw new HttpError(502, 'The payment event could not be recorded.');
    }
    if (!updatedPayment) {
      const { error: stayError } = await supabase
        .from('stays')
        .update({ status: newStayStatus })
        .eq('id', payment.stay_id);
      if (stayError) {
        console.error('Stay payment status update failed:', stayError.message);
        throw new HttpError(502, 'The payment was recorded but the stay status could not be updated.');
      }
      response.status(200).json({ received: true, duplicate: true });
      return;
    }

    const { error: stayError } = await supabase
      .from('stays')
      .update({ status: newStayStatus })
      .eq('id', payment.stay_id);
    if (stayError) {
      console.error('Stay payment status update failed:', stayError.message);
      throw new HttpError(502, 'The payment was recorded but the stay status could not be updated.');
    }
    response.status(200).json({ received: true });
  })
);

whatsappWebhookRouter.get(
  '/',
  (request: Request, response: Response) => {
    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;
    const mode = request.query['hub.mode'];
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];
    if (
      !verifyToken ||
      mode !== 'subscribe' ||
      typeof token !== 'string' ||
      token !== verifyToken ||
      typeof challenge !== 'string'
    ) {
      response.status(403).json({ error: 'WhatsApp webhook verification failed.' });
      return;
    }
    response.status(200).type('text/plain').send(challenge);
  }
);

whatsappWebhookRouter.post(
  '/',
  asyncRoute(async (request: Request, response: Response) => {
    const secret = process.env.META_APP_SECRET;
    if (!secret) throw new HttpError(503, 'WhatsApp webhook credentials are not configured.');
    if (!Buffer.isBuffer(request.body)) {
      throw new HttpError(400, 'A raw WhatsApp webhook body is required.');
    }
    if (
      !signatureMatches(
        request.body,
        request.get('x-hub-signature-256'),
        secret,
        'sha256',
        'sha256='
      )
    ) {
      throw new HttpError(401, 'WhatsApp webhook signature is invalid.');
    }
    response.status(200).json({ received: true });
  })
);
