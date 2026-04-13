-- Witness mode: master can designate a witness player who confirms a challenge
ALTER TABLE master_validations ADD COLUMN IF NOT EXISTS witness_player_id UUID DEFAULT NULL;
ALTER TABLE master_validations ADD COLUMN IF NOT EXISTS witness_status TEXT DEFAULT NULL;

-- Player pseudo can be renamed by master
-- (no migration needed — pseudo column already exists on players table)
