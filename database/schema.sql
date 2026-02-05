-- Create shipment_requests table
CREATE TABLE IF NOT EXISTS shipment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_location TEXT NOT NULL,
  destination_location TEXT NOT NULL,
  min_budget DECIMAL(10, 2) NOT NULL,
  max_budget DECIMAL(10, 2) NOT NULL,
  deadline DATE NOT NULL,
  time_window TIME,
  priority_level TEXT CHECK (priority_level IN ('Normal', 'Urgent', 'Seasonal')),
  special_conditions TEXT[],
  special_terms TEXT,
  sla_rules JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create carrier_notifications table
CREATE TABLE IF NOT EXISTS carrier_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES shipment_requests(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shipment_requests_shipper ON shipment_requests(shipper_id);
CREATE INDEX IF NOT EXISTS idx_shipment_requests_status ON shipment_requests(status);
CREATE INDEX IF NOT EXISTS idx_carrier_notifications_carrier ON carrier_notifications(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_notifications_status ON carrier_notifications(status);

-- Create carrier_profiles table
CREATE TABLE IF NOT EXISTS carrier_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  base_location TEXT,
  latitude DECIMAL(9, 6),
  longitude DECIMAL(9, 6),
  available_capacity DECIMAL(10, 2),
  capacity_unit TEXT DEFAULT 'tons',
  available_routes TEXT[],
  delivery_speed_options JSONB, -- {standard: 5-7 days, express: 2-3 days, overnight: 24hrs}
  risk_factors JSONB, -- {weather: low/medium/high, traffic: ..., region: ...}
  cost_structure JSONB, -- {base_rate: 500, per_mile: 2.5, fuel_surcharge: 10%}
  reliability_score DECIMAL(3, 2) DEFAULT 5.00, -- Out of 5.00
  total_deliveries INTEGER DEFAULT 0,
  on_time_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create carrier_responses table (history of responses to shipment requests)
CREATE TABLE IF NOT EXISTS carrier_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES shipment_requests(id) ON DELETE CASCADE,
  response_type TEXT CHECK (response_type IN ('accept', 'reject', 'counter_offer')),
  proposed_price DECIMAL(10, 2),
  estimated_delivery_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_negotiations table
CREATE TABLE IF NOT EXISTS ai_negotiations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID REFERENCES shipment_requests(id) ON DELETE CASCADE,
  carrier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shipper_requirements JSONB NOT NULL,
  carrier_offer JSONB NOT NULL,
  ai_recommendation TEXT CHECK (ai_recommendation IN ('accept', 'counter', 'reject')),
  final_price DECIMAL(10, 2),
  final_deadline DATE,
  penalty_terms JSONB,
  reasoning TEXT,
  status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for carrier tables
CREATE INDEX IF NOT EXISTS idx_carrier_profiles_carrier ON carrier_profiles(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_responses_carrier ON carrier_responses(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_responses_shipment ON carrier_responses(shipment_id);
CREATE INDEX IF NOT EXISTS idx_carrier_responses_status ON carrier_responses(status);
CREATE INDEX IF NOT EXISTS idx_ai_negotiations_shipment ON ai_negotiations(shipment_id);
CREATE INDEX IF NOT EXISTS idx_ai_negotiations_carrier ON ai_negotiations(carrier_id);
CREATE INDEX IF NOT EXISTS idx_ai_negotiations_status ON ai_negotiations(status);

-- Enable Row Level Security
ALTER TABLE shipment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_negotiations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Shippers can view their own shipment requests" ON shipment_requests;
DROP POLICY IF EXISTS "Shippers can create shipment requests" ON shipment_requests;
DROP POLICY IF EXISTS "Carriers can view pending shipment requests" ON shipment_requests;
DROP POLICY IF EXISTS "Carriers can view their own notifications" ON carrier_notifications;
DROP POLICY IF EXISTS "Carriers can update their own notifications" ON carrier_notifications;
DROP POLICY IF EXISTS "Carriers can view their own profile" ON carrier_profiles;
DROP POLICY IF EXISTS "Carriers can create their own profile" ON carrier_profiles;
DROP POLICY IF EXISTS "Carriers can update their own profile" ON carrier_profiles;
DROP POLICY IF EXISTS "Shippers can view carrier profiles" ON carrier_profiles;
DROP POLICY IF EXISTS "Carriers can view their own responses" ON carrier_responses;
DROP POLICY IF EXISTS "Carriers can create responses" ON carrier_responses;
DROP POLICY IF EXISTS "Shippers can view responses to their shipments" ON carrier_responses;
DROP POLICY IF EXISTS "Carriers can view their own negotiations" ON ai_negotiations;
DROP POLICY IF EXISTS "Shippers can view negotiations for their shipments" ON ai_negotiations;
DROP POLICY IF EXISTS "System can create negotiations" ON ai_negotiations;

-- RLS Policies for shipment_requests
CREATE POLICY "Shippers can view their own shipment requests"
  ON shipment_requests FOR SELECT
  USING (auth.uid() = shipper_id);

CREATE POLICY "Shippers can create shipment requests"
  ON shipment_requests FOR INSERT
  WITH CHECK (auth.uid() = shipper_id);

CREATE POLICY "Carriers can view pending shipment requests"
  ON shipment_requests FOR SELECT
  USING (status = 'pending');

-- RLS Policies for carrier_notifications
CREATE POLICY "Carriers can view their own notifications"
  ON carrier_notifications FOR SELECT
  USING (auth.uid() = carrier_id);

CREATE POLICY "Carriers can update their own notifications"
  ON carrier_notifications FOR UPDATE
  USING (auth.uid() = carrier_id);

-- RLS Policies for carrier_profiles
CREATE POLICY "Carriers can view their own profile"
  ON carrier_profiles FOR SELECT
  USING (auth.uid() = carrier_id);

CREATE POLICY "Carriers can create their own profile"
  ON carrier_profiles FOR INSERT
  WITH CHECK (auth.uid() = carrier_id);

CREATE POLICY "Carriers can update their own profile"
  ON carrier_profiles FOR UPDATE
  USING (auth.uid() = carrier_id);

CREATE POLICY "Shippers can view carrier profiles"
  ON carrier_profiles FOR SELECT
  USING (true);

-- RLS Policies for carrier_responses
CREATE POLICY "Carriers can view their own responses"
  ON carrier_responses FOR SELECT
  USING (auth.uid() = carrier_id);

CREATE POLICY "Carriers can create responses"
  ON carrier_responses FOR INSERT
  WITH CHECK (auth.uid() = carrier_id);

CREATE POLICY "Shippers can view responses to their shipments"
  ON carrier_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shipment_requests
      WHERE shipment_requests.id = carrier_responses.shipment_id
      AND shipment_requests.shipper_id = auth.uid()
    )
  );

-- RLS Policies for ai_negotiations
CREATE POLICY "Carriers can view their own negotiations"
  ON ai_negotiations FOR SELECT
  USING (auth.uid() = carrier_id);

CREATE POLICY "Shippers can view negotiations for their shipments"
  ON ai_negotiations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shipment_requests
      WHERE shipment_requests.id = ai_negotiations.shipment_id
      AND shipment_requests.shipper_id = auth.uid()
    )
  );

CREATE POLICY "System can create negotiations"
  ON ai_negotiations FOR INSERT
  WITH CHECK (true);
-- Create shipper_notifications table
CREATE TABLE IF NOT EXISTS shipper_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES shipment_requests(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('carrier_found', 'negotiation_ready', 'status_update')),
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipper_notifications_shipper ON shipper_notifications(shipper_id);

ALTER TABLE shipper_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shippers can view their own notifications" ON shipper_notifications;
CREATE POLICY "Shippers can view their own notifications"
  ON shipper_notifications FOR SELECT
  USING (auth.uid() = shipper_id);

DROP POLICY IF EXISTS "Shippers can update their own notifications" ON shipper_notifications;
CREATE POLICY "Shippers can update their own notifications"
  ON shipper_notifications FOR UPDATE
  USING (auth.uid() = shipper_id);
-- Create carrier_live_location table for real-time tracking
CREATE TABLE IF NOT EXISTS carrier_live_location (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  latitude DECIMAL(9, 6) NOT NULL,
  longitude DECIMAL(9, 6) NOT NULL,
  speed DECIMAL(5, 2) DEFAULT 0,
  heading DECIMAL(5, 2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE carrier_live_location ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view live locations" ON carrier_live_location;
CREATE POLICY "Anyone can view live locations"
  ON carrier_live_location FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Carriers can update their own live location" ON carrier_live_location;
CREATE POLICY "Carriers can update their own live location"
  ON carrier_live_location FOR ALL
  USING (auth.uid() = carrier_id);
-- Create carrier_reviews table to track performance
CREATE TABLE IF NOT EXISTS carrier_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shipper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE carrier_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reviews" ON carrier_reviews;
CREATE POLICY "Anyone can view reviews"
  ON carrier_reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Shippers can post reviews" ON carrier_reviews;
CREATE POLICY "Shippers can post reviews"
  ON carrier_reviews FOR INSERT
  WITH CHECK (auth.uid() = shipper_id);
