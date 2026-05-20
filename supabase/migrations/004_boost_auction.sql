-- Boost auction: master triggers a group vote to give a free taunt to a chosen player
ALTER TABLE event_session
  ADD COLUMN IF NOT EXISTS boost_auction_ends_at TIMESTAMPTZ DEFAULT NULL;

CREATE TABLE IF NOT EXISTS boost_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  voter_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, voter_id)
);

ALTER TABLE boost_votes REPLICA IDENTITY FULL;
ALTER TABLE boost_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boost_votes_all" ON boost_votes FOR ALL USING (true) WITH CHECK (true);

-- Extend activities table to support BOOST_WON type (alter check constraint if exists)
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
