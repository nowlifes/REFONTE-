-- Add auction type to support both boost (gift taunt token) and sabotage (apply taunt directly)
ALTER TABLE event_session ADD COLUMN IF NOT EXISTS boost_auction_type TEXT DEFAULT 'boost';
