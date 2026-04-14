-- Migration 0150: Add unique constraint on users.phone_number
-- Prevents duplicate phone numbers across accounts, closing the auth-conflict
-- security hole where an admin's phone could be reused to create a student account.
-- 
-- Step 1: Null-out duplicate phone numbers (keep only the earliest record per number).
-- Step 2: Create the UNIQUE constraint (NULLs are treated as distinct in PostgreSQL).

BEGIN;

UPDATE users
SET phone_number = NULL
WHERE id NOT IN (
  SELECT MIN(id)
  FROM users
  WHERE phone_number IS NOT NULL
  GROUP BY phone_number
)
AND phone_number IS NOT NULL;

ALTER TABLE users
  ADD CONSTRAINT users_phone_number_unique
  UNIQUE (phone_number);

COMMIT;
