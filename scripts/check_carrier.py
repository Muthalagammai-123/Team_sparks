import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

load_dotenv(dotenv_path=".env.local")

supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
supabase: Client = create_client(supabase_url, supabase_key)

def check_carrier():
    carrier_id = 'fb1229db-3774-4619-89c8-7779138f3932'
    print(f"Checking carrier: {carrier_id}")
    
    response = supabase.table("carrier_live_location").select("*").eq("carrier_id", carrier_id).execute()
    print("Carrier data:", json.dumps(response.data, indent=2))

if __name__ == "__main__":
    check_carrier()
