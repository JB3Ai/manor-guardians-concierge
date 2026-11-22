PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  whatsapp_number TEXT NOT NULL UNIQUE,
  bsuid TEXT UNIQUE,
  suburb TEXT,
  estate_address TEXT,
  paystack_customer_code TEXT,
  vetting_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (vetting_status IN ('pending', 'scheduled', 'approved', 'declined')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stays (
  id TEXT PRIMARY KEY,
  quote_ref TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_tier TEXT NOT NULL CHECK (service_tier IN ('care_247', 'care_checkin')),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  airport_trips INTEGER NOT NULL DEFAULT 0,
  day_trips INTEGER NOT NULL DEFAULT 0,
  welcome_refresh INTEGER NOT NULL DEFAULT 0 CHECK (welcome_refresh IN (0, 1)),
  custom_notes TEXT,
  consult_format TEXT CHECK (consult_format IN ('in_home', 'online')),
  preferred_consult_time TEXT,
  subtotal_zar REAL NOT NULL,
  festive_surcharge_zar REAL NOT NULL DEFAULT 0,
  total_zar REAL NOT NULL,
  deposit_zar REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'vetting_requested'
    CHECK (status IN (
      'vetting_requested', 'vetting_approved', 'deposit_sent', 'confirmed',
      'active', 'completed', 'cancelled'
    )),
  google_calendar_event_id TEXT,
  portal_token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS onboarding_dossiers (
  id TEXT PRIMARY KEY,
  stay_id TEXT NOT NULL UNIQUE REFERENCES stays(id) ON DELETE CASCADE,
  residence_name_and_address TEXT,
  gate_access_procedure TEXT,
  armed_response_company_and_password TEXT,
  water_and_db_locations TEXT,
  house_quirks TEXT,
  welcome_groceries_and_flowers TEXT,
  laundry_instructions TEXT,
  pet_profiles TEXT NOT NULL DEFAULT '[]',
  expected_return_datetime TEXT,
  emergency_protocol TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_updates (
  id TEXT PRIMARY KEY,
  stay_id TEXT NOT NULL REFERENCES stays(id) ON DELETE CASCADE,
  caretaker_name TEXT NOT NULL,
  slot_title TEXT NOT NULL DEFAULT 'Residence update',
  pets_status TEXT NOT NULL,
  property_security_status TEXT NOT NULL,
  status_checks TEXT NOT NULL DEFAULT '{}',
  notes TEXT,
  photo_key TEXT,
  sent_via_whatsapp INTEGER NOT NULL DEFAULT 0 CHECK (sent_via_whatsapp IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS incidentals (
  id TEXT PRIMARY KEY,
  stay_id TEXT NOT NULL REFERENCES stays(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount_zar REAL NOT NULL CHECK (amount_zar > 0),
  receipt_key TEXT,
  logged_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payment_events (
  id TEXT PRIMARY KEY,
  stay_id TEXT NOT NULL REFERENCES stays(id) ON DELETE CASCADE,
  paystack_reference TEXT NOT NULL UNIQUE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit_50', 'final_settlement')),
  amount_zar REAL NOT NULL CHECK (amount_zar > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id TEXT PRIMARY KEY,
  client_key TEXT NOT NULL,
  attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consultation_attempts (
  id TEXT PRIMARY KEY,
  client_key TEXT NOT NULL,
  attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS admin_login_attempts_client_time_idx
  ON admin_login_attempts(client_key, attempted_at);
CREATE INDEX IF NOT EXISTS consultation_attempts_client_time_idx
  ON consultation_attempts(client_key, attempted_at);
CREATE INDEX IF NOT EXISTS stays_client_id_idx ON stays(client_id);
CREATE INDEX IF NOT EXISTS daily_updates_stay_created_idx ON daily_updates(stay_id, created_at DESC);
CREATE INDEX IF NOT EXISTS incidentals_stay_created_idx ON incidentals(stay_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_events_stay_idx ON payment_events(stay_id);
CREATE UNIQUE INDEX IF NOT EXISTS payment_events_single_pending_per_stay_type
  ON payment_events(stay_id, payment_type) WHERE status = 'pending';
