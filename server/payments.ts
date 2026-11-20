import { randomUUID } from 'node:crypto';
import { Request, Response, Router } from 'express';
import process from 'node:process';
import { requireTeamAdmin } from './auth';
import { asyncRoute, HttpError } from './http';
import { getSupabaseAdmin } from './supabase';

const router = Router();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

interface PaystackApiResult {
  response: globalThis.Response;
  payload: unknown;
}

async function callPaystack(
  secretKey: string,
  path: string,
  body?: Record<string, unknown>
): Promise<PaystackApiResult> {
  let response: globalThis.Response;
  try {
    response = await fetch(`https://api.paystack.co${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    console.error('Paystack request failed:', error);
    throw new HttpError(502, 'Paystack could not be reached. Please try again.');
  }
  return {
    response,
    payload: await response.json().catch(() => null),
  };
}

function providerData(result: PaystackApiResult, action: string): Record<string, unknown> {
  if (
    !result.response.ok ||
    !isRecord(result.payload) ||
    result.payload.status !== true ||
    !isRecord(result.payload.data)
  ) {
    const message =
      isRecord(result.payload) && typeof result.payload.message === 'string'
        ? result.payload.message
        : 'Unexpected response from Paystack.';
    console.error(`Paystack ${action} failed:`, message);
    throw new HttpError(502, `Paystack could not ${action}. Please try again.`);
  }
  return result.payload.data;
}

function customerCode(data: Record<string, unknown>): string {
  if (typeof data.customer_code !== 'string' || !data.customer_code) {
    throw new HttpError(502, 'Paystack did not return a customer code.');
  }
  return data.customer_code;
}

async function ensurePaystackCustomer(
  client: {
    id: string;
    full_name: string;
    email: string;
    whatsapp_number: string;
    paystack_customer_code: string | null;
  },
  secretKey: string,
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<string> {
  if (client.paystack_customer_code) return client.paystack_customer_code;

  const lookup = await callPaystack(
    secretKey,
    `/customer/${encodeURIComponent(client.email)}`
  );
  let code: string;
  if (lookup.response.ok) {
    code = customerCode(providerData(lookup, 'load the customer'));
  } else if (lookup.response.status === 404) {
    const nameParts = client.full_name.trim().split(/\s+/);
    const created = await callPaystack(secretKey, '/customer', {
      email: client.email,
      first_name: nameParts[0] || client.full_name,
      last_name: nameParts.slice(1).join(' '),
      phone: client.whatsapp_number,
    });
    if (created.response.ok) {
      code = customerCode(providerData(created, 'create the customer'));
    } else {
      const retryLookup = await callPaystack(
        secretKey,
        `/customer/${encodeURIComponent(client.email)}`
      );
      if (!retryLookup.response.ok) {
        providerData(created, 'create the customer');
        throw new HttpError(502, 'Paystack did not return a customer record.');
      }
      code = customerCode(providerData(retryLookup, 'load the customer'));
    }
  } else {
    providerData(lookup, 'load the customer');
    throw new HttpError(502, 'Paystack did not return a customer record.');
  }

  const { error } = await supabase
    .from('clients')
    .update({ paystack_customer_code: code })
    .eq('id', client.id);
  if (error) {
    console.error('Paystack customer code save failed:', error.message);
    throw new HttpError(502, 'The Paystack customer record could not be saved.');
  }
  return code;
}

router.post(
  '/invoice',
  asyncRoute(async (request: Request, response: Response) => {
    await requireTeamAdmin(request);
    if (!isRecord(request.body)) throw new HttpError(400, 'An invoice JSON body is required.');
    const quoteRef =
      typeof request.body.quoteRef === 'string'
        ? request.body.quoteRef.trim().replace(/^#/, '').toUpperCase()
        : '';
    const paymentType = request.body.paymentType;
    if (!/^PE-\d{4}-\d{4}$/.test(quoteRef)) {
      throw new HttpError(400, 'Enter a valid residence booking reference.');
    }
    if (paymentType !== 'deposit_50' && paymentType !== 'final_settlement') {
      throw new HttpError(400, 'Choose a valid invoice type.');
    }

    const supabase = getSupabaseAdmin();
    const { data: stay, error: stayError } = await supabase
      .from('stays')
      .select('id, quote_ref, status, total_zar, deposit_zar, client_id')
      .eq('quote_ref', quoteRef)
      .maybeSingle();
    if (stayError) {
      console.error('Invoice stay lookup failed:', stayError.message);
      throw new HttpError(502, 'The residence file could not be loaded.');
    }
    if (!stay) throw new HttpError(404, 'No residence file was found for that booking reference.');

    const [{ data: client, error: clientError }, { data: payments, error: paymentsError }] =
      await Promise.all([
        supabase
          .from('clients')
          .select('id, full_name, email, whatsapp_number, paystack_customer_code')
          .eq('id', stay.client_id)
          .single(),
        supabase
          .from('payment_events')
          .select('amount_zar, payment_type, status')
          .eq('stay_id', stay.id),
      ]);
    if (clientError || paymentsError) {
      console.error('Invoice customer or payment lookup failed:', clientError?.message, paymentsError?.message);
      throw new HttpError(502, 'The invoice details could not be loaded.');
    }
    if (!client.email) throw new HttpError(409, 'Add a client email before creating an invoice.');

    const events = payments || [];
    let amountZar: number;
    let description: string;
    let lineItems: Array<{ name: string; amount: number; quantity: number }>;

    if (paymentType === 'deposit_50') {
      if (stay.status !== 'vetting_approved') {
        throw new HttpError(409, 'A deposit can only be invoiced after vetting is approved.');
      }
      if (events.some((event) => event.payment_type === 'deposit_50' && event.status === 'paid')) {
        throw new HttpError(409, 'The deposit has already been paid.');
      }
      if (events.some((event) => event.payment_type === 'deposit_50' && event.status === 'pending')) {
        throw new HttpError(409, 'A deposit invoice is already pending.');
      }
      amountZar = Number(stay.deposit_zar);
      description = `50% booking deposit for ${quoteRef}`;
      lineItems = [
        { name: `50% booking deposit: ${quoteRef}`, amount: Math.round(amountZar * 100), quantity: 1 },
      ];
    } else {
      if (stay.status !== 'confirmed' && stay.status !== 'active') {
        throw new HttpError(409, 'Final settlement is available only for a confirmed or active stay.');
      }
      const paidDeposit = events
        .filter((event) => event.payment_type === 'deposit_50' && event.status === 'paid')
        .reduce((sum, event) => sum + Number(event.amount_zar), 0);
      const paidFinal = events
        .filter((event) => event.payment_type === 'final_settlement' && event.status === 'paid')
        .reduce((sum, event) => sum + Number(event.amount_zar), 0);
      if (events.some((event) => event.payment_type === 'final_settlement' && event.status === 'pending')) {
        throw new HttpError(409, 'A final settlement invoice is already pending.');
      }
      const { data: incidentals, error: incidentalError } = await supabase
        .from('incidentals')
        .select('amount_zar')
        .eq('stay_id', stay.id);
      if (incidentalError) {
        console.error('Invoice incidental lookup failed:', incidentalError.message);
        throw new HttpError(502, 'The final balance could not be calculated.');
      }
      const incidentalTotal = (incidentals || []).reduce(
        (sum, item) => sum + Number(item.amount_zar),
        0
      );
      const remainingBookingBalance = Math.max(
        0,
        Number(stay.total_zar) - paidDeposit - paidFinal
      );
      amountZar = remainingBookingBalance + incidentalTotal;
      if (amountZar <= 0) throw new HttpError(409, 'There is no outstanding final balance.');
      description = `Final stay settlement and incidentals for ${quoteRef}`;
      lineItems = [
        ...(remainingBookingBalance > 0
          ? [
              {
                name: `Remaining stay balance: ${quoteRef}`,
                amount: Math.round(remainingBookingBalance * 100),
                quantity: 1,
              },
            ]
          : []),
        ...(incidentalTotal > 0
          ? [
              {
                name: `Logged stay incidentals: ${quoteRef}`,
                amount: Math.round(incidentalTotal * 100),
                quantity: 1,
              },
            ]
          : []),
      ];
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) throw new HttpError(503, 'Paystack server credentials are not configured.');
    const customerCode = await ensurePaystackCustomer(
      client,
      secretKey,
      supabase
    );
    const paymentReference = `MG-${quoteRef}-${paymentType === 'deposit_50' ? 'DEP' : 'FINAL'}-${randomUUID().slice(0, 12)}`;
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const createdRequest = await callPaystack(secretKey, '/paymentrequest', {
      customer: customerCode,
      currency: 'ZAR',
      description,
      due_date: dueDate.toISOString(),
      line_items: lineItems,
      metadata: JSON.stringify({
        internal_reference: paymentReference,
        stay_id: stay.id,
        payment_type: paymentType,
      }),
      send_notification: false,
    });
    const paystackData = providerData(createdRequest, 'create the payment request');
    const requestCode =
      typeof paystackData.request_code === 'string' ? paystackData.request_code : '';
    const expectedMinorAmount = Math.round(amountZar * 100);
    if (
      !requestCode ||
      paystackData.currency !== 'ZAR' ||
      paystackData.amount !== expectedMinorAmount
    ) {
      console.error('Paystack returned an invalid payment request:', {
        requestCode,
        currency: paystackData.currency,
        amount: paystackData.amount,
      });
      throw new HttpError(502, 'Paystack returned an invalid payment request.');
    }

    const { error: eventError } = await supabase.from('payment_events').insert({
      stay_id: stay.id,
      paystack_reference: requestCode,
      payment_type: paymentType,
      amount_zar: amountZar,
      status: 'pending',
    });
    if (eventError) {
      if (eventError.code === '23505') {
        throw new HttpError(409, 'A payment request is already pending for this stay.');
      }
      console.error('Payment event insert failed:', eventError.message);
      throw new HttpError(502, 'The invoice could not be initialized. Please try again.');
    }

    let emailSent = true;
    try {
      const notification = await callPaystack(
        secretKey,
        `/paymentrequest/notify/${encodeURIComponent(requestCode)}`,
        {}
      );
      emailSent =
        notification.response.ok &&
        isRecord(notification.payload) &&
        notification.payload.status === true;
      if (!emailSent) {
        const message =
          isRecord(notification.payload) && typeof notification.payload.message === 'string'
            ? notification.payload.message
            : 'Unexpected response from Paystack.';
        console.error('Paystack invoice notification failed:', message);
      }
    } catch (error) {
      if (!(error instanceof HttpError)) throw error;
      emailSent = false;
    }

    response.status(201).json({
      provider: 'paystack',
      requestCode,
      amountZar,
      amountKoboOrCents: expectedMinorAmount,
      currency: 'ZAR',
      expiresAtIso: dueDate.toISOString(),
      emailSent,
    });
  })
);

export default router;
