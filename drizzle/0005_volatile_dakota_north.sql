CREATE TABLE "scim_provider" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"scim_token" text NOT NULL,
	"organization_id" text,
	CONSTRAINT "scim_provider_provider_id_unique" UNIQUE("provider_id"),
	CONSTRAINT "scim_provider_scim_token_unique" UNIQUE("scim_token")
);

INSERT INTO org_roles (id, org_id, key, name, description, is_system, created_at, updated_at)
SELECT
  concat(o.id, ':enterprise_admin'),
  o.id,
  'enterprise_admin',
  'Admin',
  'Full org administration',
  true,
  now(),
  now()
FROM organization o
ON CONFLICT DO NOTHING;

INSERT INTO org_roles (id, org_id, key, name, description, is_system, created_at, updated_at)
SELECT
  concat(o.id, ':lead'),
  o.id,
  'lead',
  'Lead',
  'Operational management permissions',
  true,
  now(),
  now()
FROM organization o
ON CONFLICT DO NOTHING;

INSERT INTO org_roles (id, org_id, key, name, description, is_system, created_at, updated_at)
SELECT
  concat(o.id, ':member'),
  o.id,
  'member',
  'Member',
  'Default collaboration permissions',
  true,
  now(),
  now()
FROM organization o
ON CONFLICT DO NOTHING;

INSERT INTO org_role_permissions (id, role_id, permission_key)
SELECT concat(r.id, ':', p.permission_key), r.id, p.permission_key
FROM org_roles r
JOIN (
  VALUES
    ('enterprise_admin', 'org.view'),
    ('enterprise_admin', 'org.manage'),
    ('enterprise_admin', 'members.view'),
    ('enterprise_admin', 'members.invite'),
    ('enterprise_admin', 'members.manage_roles'),
    ('enterprise_admin', 'settings.view'),
    ('enterprise_admin', 'settings.manage'),
    ('enterprise_admin', 'enterprise.manage'),
    ('enterprise_admin', 'billing.view'),
    ('enterprise_admin', 'billing.manage'),
    ('enterprise_admin', 'plugins.view'),
    ('enterprise_admin', 'plugins.manage'),
    ('enterprise_admin', 'tasks.view'),
    ('enterprise_admin', 'tasks.create'),
    ('enterprise_admin', 'tasks.edit'),
    ('enterprise_admin', 'tasks.delete'),
    ('lead', 'org.view'),
    ('lead', 'members.view'),
    ('lead', 'members.invite'),
    ('lead', 'settings.view'),
    ('lead', 'plugins.view'),
    ('lead', 'tasks.view'),
    ('lead', 'tasks.create'),
    ('lead', 'tasks.edit'),
    ('member', 'org.view'),
    ('member', 'members.view'),
    ('member', 'tasks.view'),
    ('member', 'tasks.create')
) AS p(role_key, permission_key)
  ON p.role_key = r.key
ON CONFLICT DO NOTHING;

INSERT INTO member_role_assignments (id, member_id, role_id, source, created_at)
SELECT
  concat(m.id, ':seed'),
  m.id,
  CASE
    WHEN m.role = 'owner' THEN concat(m.organization_id, ':enterprise_admin')
    WHEN m.role = 'admin' THEN concat(m.organization_id, ':lead')
    ELSE concat(m.organization_id, ':member')
  END,
  'migration',
  now()
FROM member m
ON CONFLICT DO NOTHING;
