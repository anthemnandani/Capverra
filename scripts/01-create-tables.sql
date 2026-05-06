-- Create identities table
CREATE TABLE IF NOT EXISTS identities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('individual', 'entity', 'trust', 'partnership', 'corporation', 'llc')),
  citizenship TEXT[], -- Array of countries for multiple citizenships
  residency VARCHAR(100),
  risk_profile VARCHAR(20) NOT NULL CHECK (risk_profile IN ('low', 'medium', 'aggressive')),
  goals TEXT[], -- Array of goals
  additional_information TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  owner_id UUID REFERENCES identities(id) ON DELETE CASCADE,
  location_state VARCHAR(100),
  location_country VARCHAR(100) NOT NULL,
  purchase_value DECIMAL(15,2),
  purchase_date DATE,
  latest_valuation DECIMAL(15,2),
  latest_valuation_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assets_owner_id ON assets(owner_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_identities_user_id ON identities(user_id);
CREATE INDEX IF NOT EXISTS idx_identities_type ON identities(type);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

-- Create function to calculate value change
CREATE OR REPLACE FUNCTION calculate_value_change(purchase_val DECIMAL, current_val DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  IF purchase_val IS NULL OR purchase_val = 0 THEN
    RETURN NULL;
  END IF;
  RETURN ((current_val - purchase_val) / purchase_val) * 100;
END;
$$ LANGUAGE plpgsql;

-- Enable row-level security
ALTER TABLE identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Policies for identities
DROP POLICY IF EXISTS "users_can_select_own_identities" ON identities;
CREATE POLICY "users_can_select_own_identities" ON identities
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_can_insert_own_identities" ON identities;
CREATE POLICY "users_can_insert_own_identities" ON identities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_can_update_own_identities" ON identities;
CREATE POLICY "users_can_update_own_identities" ON identities
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_can_delete_own_identities" ON identities;
CREATE POLICY "users_can_delete_own_identities" ON identities
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for assets
DROP POLICY IF EXISTS "users_can_select_own_assets" ON assets;
CREATE POLICY "users_can_select_own_assets" ON assets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_can_insert_own_assets" ON assets;
CREATE POLICY "users_can_insert_own_assets" ON assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_can_update_own_assets" ON assets;
CREATE POLICY "users_can_update_own_assets" ON assets
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users_can_delete_own_assets" ON assets;
CREATE POLICY "users_can_delete_own_assets" ON assets
  FOR DELETE USING (auth.uid() = user_id);
