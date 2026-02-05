-- Migration for carrier live location tracking
-- Run this in your Supabase SQL Editor

-- Create the carrier_live_location table
CREATE TABLE IF NOT EXISTS carrier_live_location (
  carrier_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed NUMERIC DEFAULT 0,
  heading NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE carrier_live_location ENABLE ROW LEVEL SECURITY;

-- Policy: Carriers can update their own location
CREATE POLICY "Carriers can update own location"
  ON carrier_live_location
  FOR ALL
  USING (auth.uid() = carrier_id)
  WITH CHECK (auth.uid() = carrier_id);

-- Policy: Anyone can read locations (for tracking)
CREATE POLICY "Anyone can view carrier locations"
  ON carrier_live_location
  FOR SELECT
  USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE carrier_live_location;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_carrier_live_location_updated 
  ON carrier_live_location(updated_at DESC);

-- Add comment
COMMENT ON TABLE carrier_live_location IS 'Real-time carrier location tracking for live map updates';
