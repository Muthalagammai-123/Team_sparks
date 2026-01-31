import time

def negotiate_contract_api(data):
    """
    Simulates a dual-agent clause-level negotiation.
    """
    time.sleep(1.5) # Simulate brain processing
    
    shipper = data.get("shipperTerms", {})
    carrier = data.get("carrierConstraints", {})
    
    # Simulate Clause-by-Clause Negotiation
    clauses = [
        {
            "id": "pricing",
            "title": "Base Pricing & Rate",
            "shipper_position": f"${shipper.get('baseBudget', 600)}",
            "carrier_position": f"${carrier.get('baseOperationalCost', 450) + 150}",
            "negotiated": f"${(shipper.get('baseBudget', 600) + carrier.get('baseOperationalCost', 450) + 150) // 2}",
            "reasoning": "Balanced Shipper's budget cap with Carrier's operational overhead. Final rate includes a 12% margin.",
            "status": "agreed"
        },
        {
            "id": "penalty",
            "title": "SLA & Delay Penalties",
            "shipper_position": f"{shipper.get('slaRules', {}).get('delayPenalty', 15)}% per 24h",
            "carrier_position": "5% max cap",
            "negotiated": "10% progressive",
            "reasoning": "Carrier accepted higher liability in exchange for price stability on the North-East route.",
            "status": "agreed"
        },
        {
            "id": "fuel",
            "title": "Fuel Surcharge & Volatility",
            "shipper_position": f"{shipper.get('slaRules', {}).get('fuelAdjustmentCap', 5)}% cap",
            "carrier_position": f"Impact level: {carrier.get('fuelConstraintLevel', 'medium')}",
            "negotiated": "Flexible (BCO standard)",
            "reasoning": "Dynamic adjustment enabled due to high fuel volatility reported in Carrier's risk assessment.",
            "status": "agreed"
        },
        {
            "id": "holidays",
            "title": "Peak Season & Holidays",
            "shipper_position": f"{shipper.get('slaRules', {}).get('peakChargeMultiplier', 1.2)}x multiplier",
            "carrier_position": "1.5x during risk events",
            "negotiated": "1.25x tiered",
            "reasoning": "Tiered multiplier based on port congestion data and historical peak signals.",
            "status": "agreed"
        }
    ]
    
    return {
        "status": "success",
        "clauses": clauses,
        "summary": "Dual AI agents successfully resolved 4 core clauses. Pricing aligned with Shipper budget while respecting Carrier's fuel risk profile.",
        "confidence_score": 94,
        "negotiation_rounds": 6
    }
