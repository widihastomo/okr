-- Add tour tracking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tour_started BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS tour_started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS tour_completed_at TIMESTAMP;

-- Update existing users to have default values
UPDATE users 
SET tour_started = FALSE, tour_completed = FALSE 
WHERE tour_started IS NULL OR tour_completed IS NULL;