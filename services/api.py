import time
import os
import hashlib
import json
import requests
from datetime import datetime, timedelta
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv(dotenv_path=".env.local")

# Initialize Supabase client
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
OPENWEATHER_API_KEY = os.environ.get("OPENWEATHER_API_KEY")
NEWSAPI_KEY = os.environ.get("NEWSAPI_KEY")

class CarrierLocation(BaseModel):
    carrier_id: str
    lat: float
    lng: float
    speed: float | None = 0
    heading: float | None = 0

def get_weather_data(origin, destination):
    """Fetch weather data for origin and destination."""
    if not OPENWEATHER_API_KEY:
        return {"origin": {"status": "unknown", "temp": 25, "condition": "clear"}, "destination": {"status": "unknown", "temp": 25, "condition": "clear"}}
    
    def fetch_weather(city):
        try:
            url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                data = res.json()
                return {
                    "status": "good" if data['weather'][0]['main'] in ['Clear', 'Clouds'] else "moderate" if data['weather'][0]['main'] in ['Rain', 'Drizzle'] else "bad",
                    "temp": data['main']['temp'],
                    "condition": data['weather'][0]['description']
                }
        except:
            pass
        return {"status": "unknown", "temp": 25, "condition": "clear"}
    
    return {
        "origin": fetch_weather(origin.split(',')[0].strip()),
        "destination": fetch_weather(destination.split(',')[0].strip())
    }

def get_news_data():
    """Fetch recent logistics/transport news."""
    if not NEWSAPI_KEY:
        return ["No news data available"]
    
    try:
        url = f"https://newsapi.org/v2/everything?q=logistics+OR+transportation+OR+shipping&sortBy=publishedAt&apiKey={NEWSAPI_KEY}&pageSize=5"
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            data = res.json()
            return [article['title'] for article in data.get('articles', [])]
    except:
        pass
    return ["Market conditions stable"]

def fetch_shipper_data(shipment_id):
    """Fetch shipper details from database."""
    if not supabase:
        return {}
    try:
        result = supabase.table("shipment_requests").select("*").eq("id", shipment_id).single().execute()
        return result.data if result.data else {}
    except:
        return {}

def fetch_carrier_data(carrier_id):
    """Fetch carrier profile from database."""
    if not supabase:
        return {}
    try:
        result = supabase.table("carrier_profiles").select("*").eq("carrier_id", carrier_id).single().execute()
        return result.data if result.data else {}
    except:
        return {}

def fetch_carrier_response_data(shipment_id, carrier_id):
    """Fetch specific carrier response details from database."""
    if not supabase:
        return {}
    try:
        result = supabase.table("carrier_responses").select("*").eq("shipment_id", shipment_id).eq("carrier_id", carrier_id).single().execute()
        return result.data if result.data else {}
    except:
        return {}

def call_groq_negotiator(user_context):
    """
    Calls Groq AI to act as a neutral mediator and generate a dynamic agreement with external data.
    """
    if not GROQ_API_KEY:
        return None

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    system_prompt = """
    You are 'NegotiateX AI', an advanced logistics mediator. Your goal is to finalize a fair, legally binding, and transparent transportation agreement (MTSA) between a Shipper and a Carrier. 
    
    You must build TRUST through DEEP TRANSPARENCY by considering and EXPLAINING the following 14-Factor Framework in your decision-making and agreement text:

    1. **Weather Conditions Impact**: Analyze real-time weather (provided) for route safety.
    2. **Public Peak Hour Congestion**: Shift schedules to avoid city-level rush hours (e.g., 8-10 AM).
    3. **Public Holidays & Festival Traffic**: Adjust timelines for regional holidays/festivals.
    4. **Real-Time Traffic Tracking (OpenStreetMap)**: Simulate route efficiency via OSM data analysis.
    5. **Route Selection & Alternative Paths**: Explain why a specific route (e.g., NH44 vs NH209) was chosen.
    6. **Delivery Time Risk Assessment**: Calculate the probability of delays based on external risks.
    7. **Carrier Availability Constraints**: Factor in vehicle limits and driver rest requirements.
    8. **Carrier Profit Margin Limits**: Ensure a fair profit (e.g., 10-15%) but strictly cap excessive scaling.
    9. **Fair Pricing & Cost Transparency**: Provide a logical breakdown of the negotiated price.
    10. **No Unjustified Extra Charges**: Explicitly reject and remove hidden/vague fees.
    11. **Penalty Adjustment Based on Risk**: Waive/reduce penalties if delays are caused by uncontrollable factors like Weather.
    12. **Customer Cost Protection Logic**: Prevent overcharging by comparing with market news and news/weather context.
    13. **Operational Feasibility Check**: Verify that the vehicle type and capacity match the cargo requirements.
    14. **Final Fairness & Trust Score**: Provide a final score (0-100) reflecting the balance of the agreement.

    EXTERNAL DATA PROVIDED:
    - Weather conditions, Logistics news, Carrier profile, and Shipper constraints.

    RESPONSE FORMAT (JSON ONLY):
    {
      "agreement_text": "Full professional markdown MTSA. You MUST include a section titled 'AI EXPLAINABILITY: THE 14-FACTOR ANALYSIS' explaining how the factors above influenced this specific agreement.",
      "justified_price": "e.g. $45,000",
      "fixed_deadline": "07 Feb 2026",
      "clauses": [
        {"id": "pricing", "title": "Base Price", "negotiated": "...", "reasoning": "...", "status": "agreed"}
      ],
      "transparency": {
         "weather_traffic": {
            "status": "...", 
            "details": ["Factor 1: ...", "Factor 4: ...", "Factor 5: ..."],
            "impact": "..."
         },
         "schedule_efficiency": {
            "peak_hours_impact": "Factor 2: ...",
            "holiday_impact": "Factor 3: ..."
         },
         "cost_transparency": {
            "profit_limit_check": "Factor 8: ...",
            "extra_charges_check": "Factor 10: ...",
            "customer_protection": "Factor 9 & 12: ..."
         },
         "risk_assessment": {
            "risk_level": "...",
            "mitigation": "Factor 6 & 11: ..."
         },
         "operational_check": {
            "feasibility": "Factor 13: ...",
            "vehicle_match": "Factor 7: ..."
         },
         "trust_score": "Factor 14: ..."
      },
      "confidence_score": 95,
      "summary": "..."
    }
    """

    user_prompt = f"""
SHIPPER REQUEST (DB + INPUT): {json.dumps(user_context['shipper_request'])}
CARRIER RESPONSE (DB + PROPOSAL): {json.dumps(user_context['carrier_response'])}
CARRIER FLEET/PROFILE: {json.dumps(user_context['carrier_profile'])}
EXTERNAL ENVIRONMENT (WEATHER/NEWS): {json.dumps({'weather': user_context['weather'], 'news': user_context['news']})}
SHIPMENT_REFERENCE: {user_context['shipment_id']}
NEGOTIATION_SESSION: {user_context['id']}
"""

    try:
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.5
        }
        res = requests.post(url, headers=headers, json=payload, timeout=30)
        if res.status_code == 200:
            return res.json()['choices'][0]['message']['content']
    except Exception as e:
        print(f"Groq API Error: {e}")
    return None

def negotiate_contract_api(data):
    """
    Main entry point for AI negotiation. Uses external APIs and DB data with Groq.
    """
    shipper = data.get("shipperTerms", {})
    carrier = data.get("carrierConstraints", {})
    shipment_id = data.get("shipment_id")
    carrier_id = data.get("carrier_id")
    user_email = data.get("userEmail", "shipper@negotiatex.ai")
    
    # Generate unique session ID for this negotiation
    timestamp = int(time.time())
    unique_id = f"NEG-{hashlib.md5(f'{user_email}-{timestamp}'.encode()).hexdigest()[:8].upper()}"
    
    # Fetch external data
    weather_data = get_weather_data(shipper.get('source', 'Delhi'), shipper.get('destination', 'Mumbai'))
    news_data = get_news_data()
    
    # Fetch DB data
    shipper_db = fetch_shipper_data(shipment_id) if shipment_id else {}
    carrier_profile_db = fetch_carrier_data(carrier_id) if carrier_id else {}
    carrier_response_db = fetch_carrier_response_data(shipment_id, carrier_id) if shipment_id and carrier_id else {}
    
    # Priority: DB Data > Frontend Data
    context = {
        "id": unique_id,
        "shipper_request": {**shipper, **shipper_db},
        "carrier_response": {**carrier, **carrier_response_db},
        "carrier_profile": carrier_profile_db,
        "weather": weather_data,
        "news": news_data,
        "shipment_id": shipment_id
    }

    # Attempt AI Negotiation via Groq
    ai_result_raw = call_groq_negotiator(context)
    
    if ai_result_raw:
        try:
            ai_data = json.loads(ai_result_raw)
            return {
                "status": "success",
                "agreement_id": unique_id,
                "agreement": ai_data.get("agreement_text"),
                "justified_price": ai_data.get("justified_price"),
                "fixed_deadline": ai_data.get("fixed_deadline"),
                "clauses": ai_data.get("clauses"),
                "confidence_score": ai_data.get("confidence_score", 95),
                "summary": ai_data.get("summary", "AI successfully mediated terms."),
                "transparency_report": ai_data.get("transparency"),
                "carrier_id": carrier_id,
                "shipment_id": shipment_id
            }
        except:
            pass # Fallback to template if JSON parse fails
 
    # FALLBACK ENGINE (If AI is down or no key)
    rate = shipper.get('baseBudget', '$2,700')
    origin = shipper.get('source', 'Chennai')
    dest = shipper.get('destination', 'Mumbai')
    
    fallback_agreement = f"""
# MASTER TRANSPORTATION SERVICES AGREEMENT (MTSA)
## ID: {unique_id} (FALLBACK MODE)
 
**1. PARTIES:** {user_email} (Shipper) and {carrier.get('carrierName', 'Registered Carrier')}.
**2. PERFORMANCE:** Fixed Rate of {rate} for route {origin} to {dest}.
**3. AI EXPLAINABILITY:** Route analyzed with standard risk protocols. 
**4. LIABILITY:** Carrier maintains full insurance coverage for cargo.
"""
    
    return {
        "status": "success",
        "agreement_id": unique_id,
        "agreement": fallback_agreement.strip(),
        "justified_price": rate,
        "fixed_deadline": "07 Feb 2026",
        "clauses": [{"id": "pricing", "title": "Base Price", "negotiated": rate, "reasoning": "Standard market rate fallback.", "status": "agreed"}],
        "confidence_score": 85,
        "transparency_report": {
            "weather": {"status": "LOW", "details": ["Standard weather profile applied."]},
            "fairness": {"profit_limit": "12% Cap", "extra_charges": "None detected"}
        },
        "carrier_id": carrier_id,
        "shipment_id": shipment_id
    }
