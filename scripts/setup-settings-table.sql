-- Setup Settings Table
-- Run this in your Supabase SQL editor

-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Enable RLS (optional - for security)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policy (allow all operations for now)
CREATE POLICY "Allow all operations on settings" ON settings
  FOR ALL USING (true);

-- Insert default session state if it doesn't exist
INSERT INTO settings (key, value) 
VALUES ('session_state', 'idle')
ON CONFLICT (key) DO NOTHING;

-- Verify the setup
SELECT 'Settings table setup complete' as status;
SELECT * FROM settings; 