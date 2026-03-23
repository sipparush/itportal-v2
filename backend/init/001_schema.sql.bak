CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY,
  owner_user_id UUID,
  name TEXT NOT NULL,
  target TEXT NOT NULL,
  current_target TEXT,
  expect TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  owner_user_id UUID,
  assign_to_user_id UUID,
  name TEXT NOT NULL,
  target TEXT NOT NULL,
  response_person TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS abilities (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  owner_user_id UUID,
  assign_to_user_id UUID,
  name TEXT NOT NULL,
  target TEXT NOT NULL,
  response_person TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY,
  ability_id UUID NOT NULL REFERENCES abilities(id) ON DELETE CASCADE,
  owner_user_id UUID,
  assign_to_user_id UUID,
  title TEXT NOT NULL,
  target TEXT NOT NULL,
  response_person TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS action_plan_rows (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  phase TEXT,
  item_no INTEGER,
  action_text TEXT NOT NULL,
  status TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  exp_start TIMESTAMPTZ,
  exp_end TIMESTAMPTZ,
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ability_files (
  id UUID PRIMARY KEY,
  ability_id UUID REFERENCES abilities(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  uploader_user_id UUID,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL UNIQUE,
  mime_type TEXT,
  size_bytes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  orphaned_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  name TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  is_super BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  page_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_name TEXT NOT NULL REFERENCES roles(name) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_name, permission_key)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL REFERENCES roles(name) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_name)
);

ALTER TABLE goals ADD CONSTRAINT goals_owner_fk FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD CONSTRAINT projects_owner_fk FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD CONSTRAINT projects_assign_to_fk FOREIGN KEY (assign_to_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE abilities ADD CONSTRAINT abilities_owner_fk FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE abilities ADD CONSTRAINT abilities_assign_to_fk FOREIGN KEY (assign_to_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD CONSTRAINT tickets_owner_fk FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD CONSTRAINT tickets_assign_to_fk FOREIGN KEY (assign_to_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ability_files ADD CONSTRAINT ability_files_uploader_fk FOREIGN KEY (uploader_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_goal_id ON projects(goal_id);
CREATE INDEX IF NOT EXISTS idx_abilities_project_id ON abilities(project_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ability_id ON tickets(ability_id);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);
CREATE INDEX IF NOT EXISTS idx_abilities_end_date ON abilities(end_date);
CREATE INDEX IF NOT EXISTS idx_tickets_end_date ON tickets(end_date);
CREATE INDEX IF NOT EXISTS idx_goals_owner_user_id ON goals(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_user_id ON projects(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_assign_to_user_id ON projects(assign_to_user_id);
CREATE INDEX IF NOT EXISTS idx_abilities_owner_user_id ON abilities(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_abilities_assign_to_user_id ON abilities(assign_to_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_owner_user_id ON tickets(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assign_to_user_id ON tickets(assign_to_user_id);
CREATE INDEX IF NOT EXISTS idx_action_plan_rows_ticket_id ON action_plan_rows(ticket_id);
CREATE INDEX IF NOT EXISTS idx_action_plan_rows_sort_order ON action_plan_rows(ticket_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_ability_files_ability_id ON ability_files(ability_id);
CREATE INDEX IF NOT EXISTS idx_ability_files_project_id ON ability_files(project_id);
CREATE INDEX IF NOT EXISTS idx_ability_files_deleted_at ON ability_files(deleted_at);
CREATE INDEX IF NOT EXISTS idx_ability_files_orphaned_at ON ability_files(orphaned_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_name ON role_permissions(role_name);

INSERT INTO roles (name, label, is_super)
VALUES
  ('admin', 'Admin', TRUE),
  ('manager', 'Manager', FALSE),
  ('staff', 'Staff', FALSE)
ON CONFLICT (name) DO UPDATE
SET label = EXCLUDED.label,
    is_super = EXCLUDED.is_super;

INSERT INTO permissions (key, label, page_path)
VALUES
  ('overview.view', 'ดูหน้า Overview', '/'),
  ('goals.view', 'Goals: View', '/goals'),
  ('goals.add', 'Goals: Add', NULL),
  ('goals.edit', 'Goals: Edit', NULL),
  ('goals.delete', 'Goals: Delete', NULL),
  ('projects.view', 'Projects: View', '/projects'),
  ('projects.add', 'Projects: Add', NULL),
  ('projects.edit', 'Projects: Edit', NULL),
  ('projects.delete', 'Projects: Delete', NULL),
  ('abilities.view', 'Abilities: View', '/abilities'),
  ('abilities.add', 'Abilities: Add', NULL),
  ('abilities.edit', 'Abilities: Edit', NULL),
  ('abilities.delete', 'Abilities: Delete', NULL),
  ('tickets.view', 'Tickets: View', '/tickets'),
  ('tickets.add', 'Tickets: Add', NULL),
  ('tickets.edit', 'Tickets: Edit', NULL),
  ('tickets.delete', 'Tickets: Delete', NULL),
  ('action-plans.view', 'Action Plans: View', '/action-plan'),
  ('action-plans.add', 'Action Plans: Add', NULL),
  ('action-plans.edit', 'Action Plans: Edit', NULL),
  ('action-plans.delete', 'Action Plans: Delete', NULL),
  ('timeline.view', 'ดู Timeline', '/timeline'),
  ('users.view', 'Users: View', '/users'),
  ('users.add', 'Users: Add', NULL),
  ('users.edit', 'Users: Edit', NULL),
  ('users.delete', 'Users: Delete', NULL)
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
    page_path = EXCLUDED.page_path;

INSERT INTO role_permissions (role_name, permission_key)
VALUES
  ('manager', 'overview.view'),
  ('manager', 'goals.view'),
  ('manager', 'goals.add'),
  ('manager', 'goals.edit'),
  ('manager', 'goals.delete'),
  ('manager', 'projects.view'),
  ('manager', 'projects.add'),
  ('manager', 'projects.edit'),
  ('manager', 'projects.delete'),
  ('manager', 'abilities.view'),
  ('manager', 'abilities.add'),
  ('manager', 'abilities.edit'),
  ('manager', 'abilities.delete'),
  ('manager', 'timeline.view'),
  ('staff', 'overview.view'),
  ('staff', 'abilities.view'),
  ('staff', 'abilities.add'),
  ('staff', 'abilities.edit'),
  ('staff', 'abilities.delete'),
  ('staff', 'tickets.view'),
  ('staff', 'tickets.add'),
  ('staff', 'tickets.edit'),
  ('staff', 'tickets.delete'),
  ('staff', 'action-plans.view'),
  ('staff', 'action-plans.add'),
  ('staff', 'action-plans.edit'),
  ('staff', 'action-plans.delete'),
  ('staff', 'timeline.view')
ON CONFLICT (role_name, permission_key) DO NOTHING;

DELETE FROM role_permissions WHERE permission_key LIKE '%.manage';
DELETE FROM permissions WHERE key LIKE '%.manage';

INSERT INTO users (id, username, password_hash, role, is_active)
VALUES
  ('2a2111f4-28de-4dcf-92ff-4374af4f8c31', 'admin', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'admin', TRUE),
  ('31e00d76-5249-4ad1-b1cd-49032f48eec0', 'manager', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'manager', TRUE),
  ('f1032b9f-e129-4488-9f8e-5fda6caef5de', 'user1', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'staff', TRUE),
  ('42cd2dbb-6aa8-4ca7-bcd6-fcfef5cc95de', 'user2', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'staff', TRUE),
  ('1e7543fd-0026-4f38-b839-fc7ec57cf018', 'user3', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'staff', TRUE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_roles (user_id, role_name)
SELECT u.id, u.role
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.role_name = u.role
WHERE ur.user_id IS NULL;
