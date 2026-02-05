import requests
import time
import math
import random

# CONFIGURATION
API_URL = "http://localhost:8000/carrier/live-location"
CARRIER_ID = "fb1229db-3774-4619-89c8-7779138f3932"

# Extended Route with dynamic traffic regions
ROUTE = [
    (13.0067, 80.2206), # Guindy (Start)
    (13.0120, 80.2250),
    (13.0210, 80.2310),
    (13.0280, 80.2420), # T-Nagar area (Simulated High Traffic)
    (13.0350, 80.2500),
    (13.0420, 80.2620), 
    (13.0480, 80.2750), # Mylapore
    (13.0500, 80.2824)  # Marina Beach (End)
]

def calculate_heading(p1, p2):
    lat1, lon1 = p1
    lat2, lon2 = p2
    dLon = (lon2 - lon1)
    y = math.sin(dLon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dLon)
    brng = math.atan2(y, x)
    return (math.degrees(brng) + 360) % 360

def run_simulation():
    print("\n[REAL-TIME LOGISTICS SIMULATOR ACTIVE]")
    print(f"TARGET ID: {CARRIER_ID}")
    print("ROUTE: Guindy -> Marina Beach (Via T-Nagar)")
    print("-" * 50)
    
    while True:
        for i in range(len(ROUTE) - 1):
            start_node = ROUTE[i]
            end_node = ROUTE[i+1]
            
            steps = 60 
            is_traffic_zone = 2 <= i <= 4
            
            for step in range(steps):
                progress = step / steps
                curr_lat = start_node[0] + (end_node[0] - start_node[0]) * progress
                curr_lng = start_node[1] + (end_node[1] - start_node[1]) * progress
                
                heading = calculate_heading(start_node, end_node)

                # --- RANDOM ANOMALY: 2-SECOND BURST ---
                if random.random() < 0.02: 
                    print("\n[ANOMALY DETECTED: SUDDEN ACCELERATION]")
                    burst_speed = random.randint(110, 135)
                    for b in range(4):
                        curr_lat += (end_node[0] - start_node[0]) * 0.02
                        curr_lng += (end_node[1] - start_node[1]) * 0.02
                        
                        payload = {
                            "carrier_id": CARRIER_ID,
                            "lat": curr_lat,
                            "lng": curr_lng,
                            "speed": burst_speed,
                            "heading": heading
                        }
                        try:
                            requests.post(API_URL, json=payload)
                            print(f"BURST: {curr_lat:.4f}, {curr_lng:.4f} | {burst_speed} KM/H")
                        except: pass
                        time.sleep(0.5)
                    print("ANOMALY RESOLVED - RETURNING TO NORMAL FLOW\n")
                
                if is_traffic_zone:
                    speed = random.randint(12, 22)
                    status = "CONGESTED"
                else:
                    speed = random.randint(45, 62)
                    status = "SMOOTH"
                
                payload = {
                    "carrier_id": CARRIER_ID,
                    "lat": curr_lat,
                    "lng": curr_lng,
                    "speed": speed,
                    "heading": heading
                }
                
                try:
                    res = requests.post(API_URL, json=payload)
                    print(f"Pos: {curr_lat:.4f}, {curr_lng:.4f} | {speed} KM/H | {status}")
                except Exception as e:
                    print(f"CONNECTION ERROR: {e}")
                
                time.sleep(0.8) 
        
        print("\n[DESTINATION REACHED - RECALIBRATING ROUTE]\n")
        time.sleep(3)

if __name__ == "__main__":
    run_simulation()
