CREATE TABLE IF NOT EXISTS scan_security_patch_prod (
  instance_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ip INET NOT NULL,
  scan_batch_id TEXT,
  check_date TIMESTAMPTZ NOT NULL,
  security_patch_version TEXT NOT NULL,
  latest_status TEXT NOT NULL,
  os_name TEXT,
  patch_reference_date TEXT,
  last_scan_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE scan_security_patch_prod
  ADD COLUMN IF NOT EXISTS scan_batch_id TEXT;

CREATE INDEX IF NOT EXISTS idx_scan_security_patch_prod_ip
  ON scan_security_patch_prod(ip);

CREATE INDEX IF NOT EXISTS idx_scan_security_patch_prod_scan_batch_id
  ON scan_security_patch_prod(scan_batch_id);

CREATE INDEX IF NOT EXISTS idx_scan_security_patch_prod_check_date
  ON scan_security_patch_prod(check_date DESC);

CREATE INDEX IF NOT EXISTS idx_scan_security_patch_prod_latest_status
  ON scan_security_patch_prod(latest_status);
