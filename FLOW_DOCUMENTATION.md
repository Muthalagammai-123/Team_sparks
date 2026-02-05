# Complete Application Flow

## Overview
This document describes the complete end-to-end flow of the freight logistics negotiation platform.

## Flow Steps

### 1. **Shipper Creates Shipment Request**
**Location**: `app/shipper-dashboard/page.tsx`

**Shipper Inputs**:
- Source and destination locations (with map integration)
- Budget range (min/max)
- Delivery deadline and time window
- Priority level (Normal/Urgent/Seasonal)
- Special conditions (Fragile, Bulk, Refrigerated, etc.)
- Special terms/clauses
- SLA rules (penalties, tolerances)

**Process**:
1. Shipper fills out the form
2. Clicks "Initialize AI Negotiation"
3. API call to `/api/shipments/create`
4. Shipment saved to `shipment_requests` table
5. System finds all carriers in the database
6. Notifications created in `carrier_notifications` table for each carrier
7. Shipper sees success message with count of notified carriers
8. Form resets and switches to "Shipment History" view

---

### 2. **Carrier Receives Notification**
**Location**: `app/carrier-dashboard/page.tsx` → `components/CarrierNotifications.tsx`

**Process**:
1. Carrier logs in with their credentials
2. Navigates to "Shipment Requests" tab
3. Sees list of notifications (unread highlighted in cyan)
4. Unread count badge shows number of new requests

---

### 3. **Carrier Views Shipment Details**
**Location**: `components/CarrierNotifications.tsx`

**Process**:
1. Carrier clicks on a notification
2. Notification marked as "read" in database
3. Modal opens showing **Shipper Requirements**:
   - Route (source → destination)
   - Budget range
   - Deadline and time window
   - Priority level
   - Special conditions
   - Special terms
   - SLA rules

---

### 4. **Carrier Submits Response**
**Location**: `components/CarrierResponseForm.tsx`

**Carrier Inputs**:
- Available capacity (tons/pallets/containers)
- Proposed price
- Estimated delivery time (days)
- Delivery speed (Standard/Express/Overnight)
- Vehicle type (Truck/Refrigerated/Flatbed/Container)
- Insurance coverage (Yes/No)
- Real-time tracking (Yes/No)
- Additional notes

**Process**:
1. Carrier fills out response form
2. Clicks "Submit to AI Negotiation"
3. Response saved to `carrier_responses` table
4. API call to `/api/ai-negotiation`

---

### 5. **AI Negotiation (Groq)**
**Location**: `app/api/ai-negotiation/route.ts`

**AI Analysis**:
The AI agent analyzes:
- Shipper's budget range vs carrier's proposed price
- Deadline feasibility vs estimated delivery time
- Priority level and urgency
- Special conditions and their cost impact
- Fair profit margins for carriers
- Reasonable penalties for delays
- Risk factors

**AI Output** (JSON):
```json
{
  "final_price": 1200,
  "final_deadline": "2026-03-15",
  "penalty_per_day": 50,
  "max_delay_tolerance_hours": 48,
  "recommendation": "accept",
  "reasoning": "Price is within budget, delivery time is acceptable...",
  "shipper_message": "Carrier offers competitive pricing...",
  "carrier_message": "Your offer is fair and accepted..."
}
```

**Process**:
1. System prepares negotiation context with both parties' data
2. Calls Groq API with Mixtral-8x7b model
3. AI analyzes and returns fair terms
4. Result saved to `ai_negotiations` table
5. Carrier response updated with AI result

---

### 6. **Negotiation Result**
**Location**: Future implementation - AI Dashboard

**Both Parties See**:
- Final negotiated price
- Final deadline
- Penalty terms (per day, max tolerance)
- AI reasoning and recommendation
- Personalized messages for shipper and carrier

**Actions Available**:
- **Accept**: Both parties agree to AI terms
- **Counter**: Either party can propose adjustments
- **Reject**: Decline the negotiation

---

## Database Tables

### `shipment_requests`
Stores shipper requirements and shipment details.

### `carrier_notifications`
Tracks notifications sent to carriers about new shipments.

### `carrier_profiles`
Stores carrier capabilities, routes, pricing, and performance metrics.

### `carrier_responses`
History of all carrier responses to shipment requests.

### `ai_negotiations`
Stores AI analysis results and negotiated terms.

---

## API Endpoints

### `POST /api/shipments/create`
- Creates shipment request
- Notifies nearby carriers
- Returns count of notified carriers

### `POST /api/ai-negotiation`
- Analyzes shipper requirements and carrier offer
- Calls Groq AI for fair terms
- Stores negotiation result
- Returns AI recommendation

---

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_URL=your_db_url

# AI Service
GROQ_API_KEY=your_groq_api_key
```

---

## Key Features

✅ **Shipper Dashboard**
- Create shipment requests with detailed requirements
- View shipment history and track status
- See all past requests with expandable details

✅ **Carrier Dashboard**
- View notifications for new shipment requests
- See detailed shipper requirements
- Submit competitive offers with capabilities
- Track performance metrics (reliability score, on-time rate)

✅ **AI Negotiation**
- Automated fair price determination
- Deadline optimization
- Penalty term calculation
- Personalized recommendations for both parties

✅ **Real-time Updates**
- Notifications update immediately
- Status changes reflect across dashboards
- History tracking for all interactions

---

## Next Steps

1. **Run Database Schema**: Execute `database/schema.sql` in Supabase
2. **Set Environment Variables**: Add Groq API key to `.env.local`
3. **Test Flow**: Create test shipment as shipper, respond as carrier
4. **Implement AI Dashboard**: Create view for negotiation results
5. **Add Geolocation**: Filter carriers by proximity to source
6. **Implement Acceptance Flow**: Allow parties to accept/reject AI terms

---

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Framer Motion
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **AI**: Groq (Mixtral-8x7b-32768)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS (custom design system)
