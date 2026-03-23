CREATE TABLE IF NOT EXISTS scan_security_patch (
  instance_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  ip INET NOT NULL,
  check_date TIMESTAMPTZ NOT NULL,
  security_patch_version TEXT NOT NULL,
  latest_status TEXT NOT NULL,
  os_name TEXT,
  patch_reference_date TEXT,
  last_scan_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_security_patch_ip
  ON scan_security_patch(ip);

CREATE INDEX IF NOT EXISTS idx_scan_security_patch_check_date
  ON scan_security_patch(check_date DESC);

CREATE INDEX IF NOT EXISTS idx_scan_security_patch_latest_status
  ON scan_security_patch(latest_status);
