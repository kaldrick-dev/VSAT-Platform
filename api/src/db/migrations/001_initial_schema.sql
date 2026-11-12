CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('vendor', 'admin');
CREATE TYPE site_status AS ENUM ('available', 'allocated', 'inactive');
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');
CREATE TYPE allocation_outcome AS ENUM ('approved', 'rejected', 'revoked');
CREATE TYPE flag_status AS ENUM ('open', 'under_review', 'resolved', 'dismissed');

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role user_role NOT NULL DEFAULT 'vendor',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  district text NOT NULL,
  description text,
  latitude numeric(9, 6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric(9, 6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  size_square_metres numeric(10, 2) CHECK (size_square_metres > 0),
  fee_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  fee_currency char(3) NOT NULL DEFAULT 'RWF',
  terms text NOT NULL,
  status site_status NOT NULL DEFAULT 'available',
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(id),
  vendor_id uuid NOT NULL REFERENCES users(id),
  statement text,
  status application_status NOT NULL DEFAULT 'pending',
  applied_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (site_id, vendor_id)
);

CREATE TABLE allocation_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(id),
  application_id uuid NOT NULL REFERENCES applications(id),
  outcome allocation_outcome NOT NULL,
  reason text NOT NULL,
  decided_by uuid NOT NULL REFERENCES users(id),
  decided_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_decision_id uuid NOT NULL REFERENCES allocation_decisions(id),
  submitted_by uuid REFERENCES users(id),
  reason text NOT NULL,
  status flag_status NOT NULL DEFAULT 'open',
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX sites_district_status_idx ON sites (district, status);
CREATE INDEX applications_queue_idx ON applications (site_id, applied_at, id)
  WHERE status = 'pending';
CREATE INDEX allocation_decisions_sequence_idx ON allocation_decisions (site_id, decided_at, id);
CREATE INDEX flags_public_log_idx ON flags (created_at DESC);

CREATE FUNCTION reject_allocation_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'allocation_decisions is append-only; % is not allowed', TG_OP
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$;

CREATE TRIGGER allocation_decisions_prevent_update
BEFORE UPDATE ON allocation_decisions
FOR EACH ROW EXECUTE FUNCTION reject_allocation_mutation();

CREATE TRIGGER allocation_decisions_prevent_delete
BEFORE DELETE ON allocation_decisions
FOR EACH ROW EXECUTE FUNCTION reject_allocation_mutation();

CREATE VIEW public_allocation_outcomes AS
SELECT
  ad.id,
  ad.site_id,
  s.name AS site_name,
  s.district,
  s.status AS site_status,
  ad.outcome,
  ad.reason,
  ad.decided_at
FROM allocation_decisions ad
JOIN sites s ON s.id = ad.site_id;

