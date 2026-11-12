-- Key previous_matches by email instead of form response id.
--
-- Why: resetting a round deletes the responses of people who did not opt in.
-- previous_matches had foreign keys to form_responses, which blocked that delete
-- (Reset failed with a 500). Storing emails keeps the history after a response is
-- deleted, so if someone signs up again later they are still not re-matched with
-- a past partner.
--
-- Run this in the Supabase SQL editor BEFORE anyone presses Reset, while the
-- responses still exist, so step 2 can copy every email across. Safe to re-run.

-- 1. Email columns for both people in the pair.
ALTER TABLE previous_matches
  ADD COLUMN IF NOT EXISTS person1_email TEXT,
  ADD COLUMN IF NOT EXISTS person2_email TEXT;

-- 2. Fill in emails for existing rows from the current responses.
UPDATE previous_matches pm
SET person1_email = LOWER(TRIM(f.email))
FROM form_responses f
WHERE f.id = pm.person1_id
  AND pm.person1_email IS NULL;

UPDATE previous_matches pm
SET person2_email = LOWER(TRIM(f.email))
FROM form_responses f
WHERE f.id = pm.person2_id
  AND pm.person2_email IS NULL;

-- 3. Remove the foreign keys from previous_matches to form_responses, so responses
--    can be deleted at reset. The id columns stay, for reference only.
DO $$
DECLARE
  fk RECORD;
BEGIN
  FOR fk IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'previous_matches'::regclass
      AND confrelid = 'form_responses'::regclass
      AND contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE previous_matches DROP CONSTRAINT %I', fk.conname);
  END LOOP;
END $$;

-- 4. Lookups by email (history page, matching).
CREATE INDEX IF NOT EXISTS idx_previous_matches_person1_email ON previous_matches (person1_email);
CREATE INDEX IF NOT EXISTS idx_previous_matches_person2_email ON previous_matches (person2_email);

-- 5. Check: rows_missing_email should be 0, and remaining_foreign_keys should be 0.
SELECT
  (SELECT COUNT(*) FROM previous_matches) AS total_rows,
  (SELECT COUNT(*) FROM previous_matches
     WHERE person1_email IS NULL OR person2_email IS NULL) AS rows_missing_email,
  (SELECT COUNT(*) FROM pg_constraint
     WHERE conrelid = 'previous_matches'::regclass
       AND confrelid = 'form_responses'::regclass
       AND contype = 'f') AS remaining_foreign_keys;
