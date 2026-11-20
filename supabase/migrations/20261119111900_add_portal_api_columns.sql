alter table public.stays
add column portal_token_hash text unique;

alter table public.clients
add column paystack_customer_code text;

alter table public.onboarding_dossiers
add column residence_name_and_address text,
add column armed_response_company_and_password text,
add column expected_return_datetime text,
add column emergency_protocol jsonb not null default '{}'::jsonb;

alter table public.daily_updates
add column slot_title text not null default 'Residence update',
add column status_checks jsonb not null default '{}'::jsonb;

create unique index payment_events_single_pending_per_stay_type
on public.payment_events (stay_id, payment_type)
where status = 'pending';
