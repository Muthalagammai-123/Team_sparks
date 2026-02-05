# Database Setup Guide

## Step 1: Run the SQL Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (`whkyqkdbynadffgbmvtw`)
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `database/schema.sql`
6. Click **Run** to execute the SQL

This will create:
- `shipment_requests` table - stores all shipment requests from shippers
- `carrier_notifications` table - stores notifications sent to carriers
- Indexes for better query performance
- Row Level Security (RLS) policies for data protection

## Step 2: Verify Tables

1. Click on **Table Editor** in the left sidebar
2. You should see the new tables:
   - `shipment_requests`
   - `carrier_notifications`

## Step 3: Test the Flow

1. Log in as a **Shipper**
2. Go to Shipper Dashboard
3. Fill in all required fields:
   - Budget range (min/max)
   - Delivery deadline and time
   - Source and destination locations
   - Priority level
   - Special conditions (optional)
4. Click **Initialize AI Negotiation**
5. The system will:
   - Create a shipment request in the database
   - Find all carriers in the system
   - Send notifications to each carrier
   - Show success message with number of notified carriers

## Step 4: View Notifications (Carrier Side)

To implement the carrier notification view, we'll need to create a Carrier Dashboard that:
- Fetches notifications from `carrier_notifications` table
- Displays shipment details
- Allows carriers to accept/reject requests

## Database Schema Overview

### shipment_requests
- `id` - Unique identifier
- `shipper_id` - Reference to the shipper user
- `source_location` - Pickup location
- `destination_location` - Delivery location
- `min_budget` / `max_budget` - Budget range
- `deadline` - Delivery deadline
- `time_window` - Preferred delivery time
- `priority_level` - Normal/Urgent/Seasonal
- `special_conditions` - Array of special requirements
- `sla_rules` - JSON object with penalty rules
- `status` - pending/matched/in_progress/completed/cancelled

### carrier_notifications
- `id` - Unique identifier
- `carrier_id` - Reference to the carrier user
- `shipment_id` - Reference to the shipment request
- `message` - Notification message
- `status` - unread/read/dismissed
- `created_at` / `read_at` - Timestamps

## Next Steps

1. Run the SQL schema in Supabase
2. Test creating a shipment request
3. Implement Carrier Dashboard to view notifications
4. Add geolocation-based carrier filtering (optional enhancement)
