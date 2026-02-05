DROP TABLE IF EXISTS carrier_reviews;

CREATE TABLE carrier_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shipper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shipment_id UUID REFERENCES shipment_requests(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_positive BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE carrier_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view reviews" ON carrier_reviews FOR SELECT USING (true);
-- Relaxed policy for seeding/demo purposes if needed, otherwise standard:
CREATE POLICY "Shippers can create reviews" ON carrier_reviews FOR INSERT WITH CHECK (auth.uid() = shipper_id);
-- Allow service role (seeding) to bypass RLS implicitly, but explicit policy helps if using anon key
CREATE POLICY "Service role full access" ON carrier_reviews USING (true) WITH CHECK (true);
