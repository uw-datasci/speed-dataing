-- Setup Previous Matches Table
-- Run this in your Supabase SQL editor

-- Create previous_matches table if it doesn't exist
CREATE TABLE IF NOT EXISTS previous_matches (
  id UUID PRIMARY KEY,
  matched_with UUID[] NOT NULL DEFAULT '{}',
  similarity_score FLOAT8[] NOT NULL,
  emoji TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups on the user_id
CREATE INDEX IF NOT EXISTS idx_previous_matches_user_id ON previous_matches(user_id);

-- Optional: Create a GIN index for faster array operations (searching within the array)
CREATE INDEX IF NOT EXISTS idx_previous_matches_prev_matches_gin ON previous_matches USING GIN(matched_with);

