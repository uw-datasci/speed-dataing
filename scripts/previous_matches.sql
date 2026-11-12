-- Setup Previous Matches Table
-- Run this in your Supabase SQL editor
--
-- One row per past pair. People are identified by email, which stays the same
-- across rounds; form responses are deleted when a round resets, so the id
-- columns are kept for reference only and have no foreign keys.
-- Existing installs: run previous-matches-by-email.sql instead.

CREATE TABLE IF NOT EXISTS previous_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person1_id UUID,
  person2_id UUID,
  person1_email TEXT NOT NULL,
  person2_email TEXT NOT NULL,
  similarity_score FLOAT8,
  emoji TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_previous_matches_person1_email ON previous_matches (person1_email);
CREATE INDEX IF NOT EXISTS idx_previous_matches_person2_email ON previous_matches (person2_email);
