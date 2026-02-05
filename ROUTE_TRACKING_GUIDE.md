# Vehicle Tracking with Route Visualization - Implementation Guide

## Overview
The tracking page now fetches and displays the shipment's source and destination from the shipper's request, showing the complete route on the map with visual markers.

## Features Implemented

### 1. **Route Data Fetching**
- Fetches source and destination from `shipment_requests` table
- Uses Mapbox Geocoding API to convert location names to coordinates
- Displays route information in real-time

### 2. **Visual Route Display**
- **Source Marker**: Green pin with label showing origin
- **Destination Marker**: Purple pin with label showing destination  
- **Truck Marker**: Cyan/Red marker showing current position with speed indicator
- **Breadcrumb Trail**: Cyan line showing the path traveled

### 3. **HUD Enhancements**
- Route information panel in the left Unit Info card
- Visual gradient line connecting source to destination
- Color-coded indicators (Green for source, Purple for destination)

## How to Use

### Step 1: Create a Test Shipment
Run the test script to create a shipment with source and destination:

```bash
node scripts/create_test_shipment.js
```

This will output a URL like:
```
http://localhost:3000/track?carrier=fb1229db-3774-4619-89c8-7779138f3932&shipment=<shipment-id>
```

### Step 2: Start the Backend Server
```bash
python server.py
```

### Step 3: Start the Truck Simulation
```bash
python simulate_truck.py
```

### Step 4: View the Tracking Page
Open the URL from Step 1 in your browser. You should see:
- The truck moving along the route
- Green marker at the source (Guindy, Chennai)
- Purple marker at the destination (Marina Beach, Chennai)
- Route information in the left panel

## URL Parameters

The tracking page accepts two query parameters:

1. **carrier** (required): The carrier/truck ID to track
   - Example: `fb1229db-3774-4619-89c8-7779138f3932`

2. **shipment** (optional): The shipment ID to display route for
   - Example: `<uuid-from-database>`
   - If not provided, only the truck will be shown without route markers

## Database Schema

The feature uses the following tables:

### shipment_requests
```sql
- id: UUID
- source_location: TEXT (e.g., "Guindy, Chennai")
- destination_location: TEXT (e.g., "Marina Beach, Chennai")
- status: TEXT
```

### carrier_live_location
```sql
- carrier_id: UUID
- latitude: DECIMAL
- longitude: DECIMAL
- speed: DECIMAL
- heading: DECIMAL
- updated_at: TIMESTAMP
```

## API Integration

### Mapbox Geocoding API
Used to convert location names to coordinates:
```
GET https://api.mapbox.com/geocoding/v5/mapbox.places/{location}.json?access_token={token}
```

Returns:
```json
{
  "features": [
    {
      "center": [longitude, latitude]
    }
  ]
}
```

## Visual Design

### Color Scheme
- **Source**: Green (#10b981)
- **Destination**: Purple (#a855f7)
- **Truck (Normal)**: Cyan (#06b6d4)
- **Truck (Congested)**: Red (#ef4444)
- **Trail**: Cyan (#06b6d4)

### Marker Styles
- Circular pins with gradient backgrounds
- Glow effects for better visibility
- Labels with location names
- Responsive hover states

## Troubleshooting

### Route markers not showing
- Ensure `shipment` parameter is in the URL
- Check that the shipment exists in the database
- Verify Mapbox API key is valid

### Geocoding fails
- Check internet connection
- Verify location names are recognizable (use city names)
- Check browser console for API errors

### Truck not moving
- Ensure `carrier` ID matches the simulation
- Check that `server.py` is running
- Verify `simulate_truck.py` is sending data

## Future Enhancements

1. **Route Line**: Draw a line connecting source → truck → destination
2. **ETA Calculation**: Show estimated time of arrival
3. **Distance Tracking**: Display remaining distance
4. **Multiple Waypoints**: Support intermediate stops
5. **Historical Routes**: Show past deliveries on the map
