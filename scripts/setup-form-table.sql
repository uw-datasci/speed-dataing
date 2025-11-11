-- Setup Form Responses Table
-- Run this in your Supabase SQL editor

-- Create form_responses table if it doesn't exist
CREATE TABLE IF NOT EXISTS form_responses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  pronouns VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  program VARCHAR(255),
  year VARCHAR(50),
  social_media_links TEXT,
  career TEXT,
  friend_traits TEXT,
  self_desc TEXT,
  goal TEXT,
  fun TEXT,
  music TEXT,
  class_seat VARCHAR(10),
  evil_hobby VARCHAR(10),
  most_likely_to VARCHAR(10),
  caught_watching VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_form_responses_email ON form_responses(email);
CREATE INDEX IF NOT EXISTS idx_form_responses_created_at ON form_responses(created_at);

-- Enable RLS (optional - for security)
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policy (allow all operations for now)
CREATE POLICY "Allow all operations on form_responses" ON form_responses
  FOR ALL USING (true);

-- Verify the setup
SELECT 'Form responses table setup complete' as status;
SELECT COUNT(*) as current_responses FROM form_responses; 