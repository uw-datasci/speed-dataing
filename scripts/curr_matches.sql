-- Setup Current Matches Table
-- Run this in your Supabase SQL editor

-- Create curr_matches table if it doesn't exist
CREATE TABLE IF NOT EXISTS curr_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person1_id UUID NOT NULL,
  person2_id UUID NOT NULL,
  similarity_score FLOAT8 NOT NULL,
  emoji TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_curr_matches_person1_id ON curr_matches(person1_id);
CREATE INDEX IF NOT EXISTS idx_curr_matches_person2_id ON curr_matches(person2_id);
CREATE INDEX IF NOT EXISTS idx_curr_matches_similarity_score ON curr_matches(similarity_score);

-- Add constraint to prevent duplicate matches (regardless of order)
CREATE UNIQUE INDEX IF NOT EXISTS idx_curr_matches_unique_pair 
ON curr_matches (LEAST(person1_id, person2_id), GREATEST(person1_id, person2_id));
