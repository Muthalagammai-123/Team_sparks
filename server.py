from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from services.api import negotiate_contract_api, CarrierLocation, supabase
import uvicorn

app = FastAPI()

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/negotiate")
async def negotiate(request: Request):
    data = await request.json()
    return negotiate_contract_api(data)


@app.post("/carrier/live-location")
async def update_live_location(data: CarrierLocation):
    """
    Update carrier's live location for real-time tracking.
    """
    if not supabase:
        return {"status": "error", "message": "Supabase not configured"}
    
    try:
        response = supabase.table("carrier_live_location").upsert({
            "carrier_id": data.carrier_id,
            "latitude": data.lat,
            "longitude": data.lng,
            "speed": data.speed,
            "heading": data.heading,
            "updated_at": "now()"
        }).execute()
        
        # Verbose logging for terminal visibility
        try:
            print(f"TELEMETRY: Carrier {data.carrier_id[:8]} | Speed: {data.speed} KM/H | Pos: {data.lat},{data.lng}")
        except:
            pass
        
        return {"status": "live location updated"}
    except Exception as e:
        try:
            print(f"Error updating location: {str(e)}")
        except:
            pass
        return {"status": "error", "message": str(e)}


@app.get("/carrier/live-location/{carrier_id}")
async def get_live_location(carrier_id: str):
    """
    Get carrier's current live location.
    """
    if not supabase:
        return {"status": "error", "message": "Supabase not configured"}
    
    result = supabase.table("carrier_live_location").select("*").eq("carrier_id", carrier_id).single().execute()
    
    if result.data:
        return {"status": "success", "location": result.data}
    else:
        return {"status": "not_found", "message": "Carrier location not available"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
