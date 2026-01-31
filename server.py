from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from services.api import negotiate_contract_api
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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
