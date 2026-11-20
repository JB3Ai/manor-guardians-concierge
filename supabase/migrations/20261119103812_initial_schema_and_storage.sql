-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- 1. CLIENTS TABLE
create table public.clients (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text,
  whatsapp_number text not null unique,
  bsuid text unique,
  suburb text,
  estate_address text,
  vetting_status text not null default 'pending' check (vetting_status in ('pending', 'scheduled', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

-- 2. CONSULTATIONS & STAYS (Bookings + Quotes)
create table public.stays (
  id uuid primary key default uuid_generate_v4(),
  quote_ref text not null unique,
  client_id uuid references public.clients(id) on delete cascade,
  service_tier text not null check (service_tier in ('care_247', 'care_checkin')),
  start_date date not null,
  end_date date not null,
  airport_trips int not null default 0,
  day_trips int not null default 0,
  welcome_refresh boolean not null default false,
  custom_notes text,
  consult_format text check (consult_format in ('in_home', 'online')),
  preferred_consult_time text,
  subtotal_zar numeric(10,2) not null,
  festive_surcharge_zar numeric(10,2) not null default 0,
  total_zar numeric(10,2) not null,
  deposit_zar numeric(10,2) not null,
  status text not null default 'vetting_requested' check (
    status in ('vetting_requested', 'vetting_approved', 'deposit_sent', 'confirmed', 'active', 'completed', 'cancelled')
  ),
  google_calendar_event_id text,
  created_at timestamptz not null default now()
);

-- 3. RESIDENCE ONBOARDING DOSSIER & PET PROFILES
create table public.onboarding_dossiers (
  id uuid primary key default uuid_generate_v4(),
  stay_id uuid references public.stays(id) on delete cascade unique,
  gate_access_procedure text,
  armed_response_company text,
  armed_response_password text,
  water_and_db_locations text,
  house_quirks text,
  welcome_groceries_and_flowers text,
  laundry_instructions text,
  pet_profiles jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 4. LIVE STAY DAILY UPDATES
create table public.daily_updates (
  id uuid primary key default uuid_generate_v4(),
  stay_id uuid references public.stays(id) on delete cascade,
  caretaker_name text not null,
  pets_status text not null,
  property_security_status text not null,
  notes text,
  photo_url text,
  sent_via_whatsapp boolean not null default false,
  created_at timestamptz not null default now()
);

-- 5. INCIDENTALS & FINAL BILLING LEDGER
create table public.incidentals (
  id uuid primary key default uuid_generate_v4(),
  stay_id uuid references public.stays(id) on delete cascade,
  description text not null,
  amount_zar numeric(10,2) not null,
  receipt_url text,
  logged_by text,
  created_at timestamptz not null default now()
);

-- 6. PAYSTACK PAYMENT EVENTS (Idempotent Webhook Log)
create table public.payment_events (
  id uuid primary key default uuid_generate_v4(),
  stay_id uuid references public.stays(id) on delete cascade,
  paystack_reference text not null unique,
  payment_type text not null check (payment_type in ('deposit_50', 'final_settlement')),
  amount_zar numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ENABLE ROW LEVEL SECURITY (RLS)
alter table public.clients enable row level security;
alter table public.stays enable row level security;
alter table public.onboarding_dossiers enable row level security;
alter table public.daily_updates enable row level security;
alter table public.incidentals enable row level security;
alter table public.payment_events enable row level security;

-- Allow authenticated team admins full access; server API uses service_role key
create policy "Admin full access on clients" on public.clients for all using (auth.role() = 'authenticated');
create policy "Admin full access on stays" on public.stays for all using (auth.role() = 'authenticated');
create policy "Admin full access on dossiers" on public.onboarding_dossiers for all using (auth.role() = 'authenticated');
create policy "Admin full access on updates" on public.daily_updates for all using (auth.role() = 'authenticated');
create policy "Admin full access on incidentals" on public.incidentals for all using (auth.role() = 'authenticated');
create policy "Admin full access on payments" on public.payment_events for all using (auth.role() = 'authenticated');

-- STORAGE BUCKET FOR DAILY STAY PHOTOS & RECEIPTS
insert into storage.buckets (id, name, public)
values ('stay-media', 'stay-media', true)
on conflict (id) do nothing;

create policy "Authenticated upload to stay-media"
on storage.objects for insert
with check (bucket_id = 'stay-media' and auth.role() = 'authenticated');

create policy "Public read access on stay-media"
on storage.objects for select
using (bucket_id = 'stay-media');
