-- Runs once, when the data directory is first created.
--
-- The image ships the extension's files; a database still has to enable it, and
-- doing that here means the application never has to run DDL to get started.
CREATE EXTENSION IF NOT EXISTS vector;
