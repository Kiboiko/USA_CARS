/**
 * Global test setup: provide the env vars required by config parsing and force
 * an in-memory database so every test run is isolated and leaves no files.
 */
process.env.DATABASE_PATH = ":memory:";
process.env.JWT_SECRET = "test-secret-key-please-change";
process.env.JWT_EXPIRES_IN = "12h";
process.env.UPLOAD_DIR = "public/uploads";
process.env.PUBLIC_UPLOAD_PATH = "/uploads";
process.env.MAX_UPLOAD_BYTES = "1048576";

// Ensure integration secrets are absent by default so the lead flow degrades
// gracefully in tests that don't explicitly configure them.
delete process.env.SMTP_HOST;
delete process.env.SMTP_USER;
delete process.env.SMTP_PASSWORD;
delete process.env.GOOGLE_SHEETS_ID;
delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
delete process.env.GOOGLE_PRIVATE_KEY;
