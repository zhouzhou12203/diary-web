-- Safe password reset helper.
-- Before running this file in production, set ADMIN_BOOTSTRAP_PASSWORD
-- and, if needed, APP_BOOTSTRAP_PASSWORD as Cloudflare secrets.

DELETE FROM app_settings
WHERE setting_key IN (
    'admin_password',
    'admin_password_hash',
    'app_password',
    'app_password_hash'
);

INSERT INTO app_settings (setting_key, setting_value, updated_at)
VALUES ('app_password_enabled', 'false', CURRENT_TIMESTAMP)
ON CONFLICT(setting_key)
DO UPDATE SET setting_value = excluded.setting_value, updated_at = CURRENT_TIMESTAMP;
