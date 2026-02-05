import requests
import time
import math
import random

# Configuration
API_URL = "http://localhost:8000/carrier/live-location"
CARRIER_ID = "fb1229db-3774-4619-89c8-7779138f3932"

# Start coordinates (Chennai area or as per your map settings)
START_LAT = 13.0827
START_LNG = 80.2707

def simulate_movement():
    print(f"Starting simulation for carrier: {CARRIER_ID}")
    print(f"Target URL: {API_URL}")
    
    step = 0
    lat = START_LAT
    lng = START_LNG
    
    while True:
        try:
            # Simulate a small movement (approx 20-40 meters)
            # 0.0001 degrees is roughly 11 meters
            lat_change = (math.sin(step * 0.1) * 0.0002) + 0.0001
            lng_change = (math.cos(step * 0.1) * 0.0002) + 0.0001
            
            lat += lat_change
            lng += lng_change
            
            # Calculate heading in degrees (0-360)
            heading = (step * 5) % 360
            
            # Simulate realistic speed (40-65 km/h)
            speed = 45 + (random.random() * 10)
            
            payload = {
                "carrier_id": CARRIER_ID,
                "lat": lat,
                "lng": lng,
                "speed": speed,
                "heading": heading
            }
            
            response = requests.post(API_URL, json=payload, timeout=5)
            
            if response.status_code == 200:
                print(f"[{time.strftime('%H:%M:%S')}] Step {step}: Updated -> Lat: {lat:.6f}, Lng: {lng:.6f}, Speed: {speed:.1f} km/h")
            else:
                print(f"[{time.strftime('%H:%M:%S')}] Failed to update. Status: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"[{time.strftime('%H:%M:%S')}] Connection Error: Is the server.py running on port 8000?")
        except Exception as e:
            print(f"[{time.strftime('%H:%M:%S')}] Error: {str(e)}")
            
        step += 1
        time.sleep(1) # Send update every second

if __name__ == "__main__":
    simulate_movement()
