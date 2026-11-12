-- Run this in the Supabase SQL editor before deploying manual admin pairing.

CREATE TABLE IF NOT EXISTS manual_match_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person1_id UUID NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  person2_id UUID NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT manual_match_pairs_distinct_people CHECK (person1_id <> person2_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_manual_match_pairs_unique_pair
  ON manual_match_pairs (LEAST(person1_id, person2_id), GREATEST(person1_id, person2_id));

ALTER TABLE manual_match_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on manual_match_pairs" ON manual_match_pairs
  FOR ALL USING (true) WITH CHECK (true);
