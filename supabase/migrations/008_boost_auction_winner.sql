-- Persist auction winner for reveal overlay broadcast to all clients
ALTER TABLE event_session ADD COLUMN IF NOT EXISTS boost_auction_winner JSONB DEFAULT NULL;
