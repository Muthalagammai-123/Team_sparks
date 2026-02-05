# Dynamic Agreement Generation & PDF Download - Implementation Guide

## Overview
The agreement generation system has been enhanced to create fully dynamic contracts that include carrier-specific details, qualifications, and performance metrics. Each agreement is unique to the carrier and includes real-time data from their profile.

## Key Enhancements

### 1. **Carrier-Specific Dynamic Factors**

The agreement now automatically includes:

#### Carrier Credentials
- **Base Location**: Operating hub of the carrier
- **Fleet Capacity**: Available capacity in tons/units
- **Vehicle Type**: Type of vehicle (e.g., "Refrigerated Truck", "Flatbed")
- **Insurance Coverage**: Active insurance amount
- **Certifications**: ISO, DOT, and other certifications
- **Reliability Score**: Performance rating out of 5.00
- **On-Time Delivery Rate**: Percentage based on historical data
- **Total Deliveries**: Number of completed shipments

#### Cost Structure
- **Base Rate**: Carrier's base operational cost
- **Per Mile Cost**: Cost per mile traveled
- **Fuel Surcharge**: Percentage fuel adjustment

#### Risk Assessment
- **Weather Risk**: LOW/MEDIUM/HIGH based on route analysis
- **Traffic Risk**: Congestion probability
- **Regional Risk**: Area-specific challenges

### 2. **Enhanced Agreement Sections**

The generated agreement includes:

```markdown
## 3. CARRIER QUALIFICATIONS & CREDENTIALS
**[Carrier Name]** operates from **[Location]** and brings the following verified capabilities:

- Fleet Capacity: [X] tons
- Vehicle Type: [Type]
- Insurance Coverage: $[Amount]
- Certifications: [List]
- Reliability Score: [X]/5.00 ([Y]% on-time delivery rate)
- Total Completed Deliveries: [N]

### 3.1 Risk Assessment Profile
- Weather Risk: [LEVEL]
- Traffic Congestion Risk: [LEVEL]
- Regional Risk: [LEVEL]

## 4. FINAL NEGOTIATED COMMERCIALS
### 4.1 Freight Remuneration
**Cost Breakdown (Carrier's Structure):**
- Base Rate: $[X]
- Per Mile: $[Y]
- Fuel Surcharge: [Z]%

## 6. INSURANCE & LIABILITY
The Carrier maintains active insurance coverage of **$[Amount]** and agrees to provide proof of coverage upon request.
```

### 3. **Dynamic PDF Generation**

The PDF download now includes:

#### Multi-Page Support
- Automatically splits long agreements across multiple pages
- Maintains proper formatting and readability
- High-quality rendering (2x scale)

#### Dynamic Filenames
Format: `[CONTRACT_NUM]_[CARRIER_NAME]_[DATE].pdf`

Example: `NEX-45678_ABC_Logistics_2026-02-05.pdf`

Components:
- **Contract Number**: Extracted from agreement (e.g., NEX-45678)
- **Carrier Name**: Sanitized carrier name (max 20 chars)
- **Date**: ISO format date (YYYY-MM-DD)

#### Error Handling
- Try-catch wrapper for robust PDF generation
- User-friendly error messages
- Console logging for debugging

## Database Integration

### Carrier Profile Schema
```sql
carrier_profiles:
  - carrier_id: UUID
  - base_location: TEXT
  - available_capacity: DECIMAL
  - capacity_unit: TEXT
  - reliability_score: DECIMAL (0-5.00)
  - total_deliveries: INTEGER
  - on_time_deliveries: INTEGER
  - cost_structure: JSONB
    {
      "base_rate": 500,
      "per_mile": 2.5,
      "fuel_surcharge": "10%"
    }
  - risk_factors: JSONB
    {
      "weather": "low",
      "traffic": "medium",
      "region": "low"
    }
```

### Carrier Constraints (Frontend)
```json
{
  "carrier_id": "uuid",
  "business_details": {
    "company_name": "ABC Logistics",
    "vehicle_type": "Refrigerated Truck",
    "insurance_coverage": "$2,000,000",
    "certifications": ["ISO 9001", "DOT Certified", "HACCP"]
  }
}
```

## API Flow

### 1. Negotiation Request
```javascript
POST /api/negotiate-contract
{
  "shipperTerms": { ... },
  "carrierConstraints": {
    "carrier_id": "uuid",
    "business_details": { ... }
  }
}
```

### 2. Backend Processing
```python
def negotiate_contract_api(data):
    # 1. Extract carrier_id
    carrier_id = carrier.get('carrier_id')
    
    # 2. Fetch carrier profile from Supabase
    carrier_profile = supabase.table("carrier_profiles")
        .select("*")
        .eq("carrier_id", carrier_id)
        .execute()
    
    # 3. Generate dynamic agreement
    agreement = generate_dynamic_agreement(
        data, 
        clauses, 
        carrier_profile
    )
    
    # 4. Return with profile data
    return {
        "agreement": agreement,
        "carrier_profile": carrier_profile
    }
```

### 3. Frontend Display
```tsx
// Contract page displays the agreement
<div ref={contractRef}>
  <ReactMarkdown>{negotiationData.agreement}</ReactMarkdown>
</div>

// Download button triggers PDF generation
<button onClick={downloadPDF}>
  Download PDF
</button>
```

## Usage Examples

### Example 1: Basic Carrier Profile
```json
{
  "carrier_id": "123e4567-e89b-12d3-a456-426614174000",
  "base_location": "Chicago, IL",
  "available_capacity": 25.5,
  "capacity_unit": "tons",
  "reliability_score": 4.75,
  "total_deliveries": 342,
  "on_time_deliveries": 325,
  "cost_structure": {
    "base_rate": 650,
    "per_mile": 3.2,
    "fuel_surcharge": "12%"
  },
  "risk_factors": {
    "weather": "medium",
    "traffic": "high",
    "region": "low"
  }
}
```

**Generated Agreement Section:**
```
## 3. CARRIER QUALIFICATIONS & CREDENTIALS
**ABC Logistics** operates from **Chicago, IL** and brings the following verified capabilities:

- Fleet Capacity: 25.5 tons
- Vehicle Type: Refrigerated Truck
- Insurance Coverage: $2,000,000
- Certifications: ISO 9001, DOT Certified, HACCP
- Reliability Score: 4.75/5.00 (95.0% on-time delivery rate)
- Total Completed Deliveries: 342

### 3.1 Risk Assessment Profile
- Weather Risk: MEDIUM
- Traffic Congestion Risk: HIGH
- Regional Risk: LOW
```

### Example 2: PDF Filename Generation
```
Input:
- Contract Number: NEX-45678
- Carrier: "ABC Logistics & Transport Co."
- Date: 2026-02-05

Output Filename:
NEX-45678_ABC_Logistics___Tr_2026-02-05.pdf
```

## Testing

### 1. Test Carrier Profile Creation
```bash
# Create a test carrier profile
node scripts/create_test_carrier_profile.js
```

### 2. Test Agreement Generation
1. Navigate to `/negotiation`
2. Fill in shipper terms
3. Fill in carrier constraints (include carrier_id)
4. Click "Negotiate"
5. View generated agreement with carrier details

### 3. Test PDF Download
1. On the contract page (`/contract`)
2. Click "Download PDF"
3. Verify filename format: `NEX-[NUM]_[CARRIER]_[DATE].pdf`
4. Open PDF and verify multi-page rendering

## Benefits

### For Shippers
- **Transparency**: See carrier qualifications upfront
- **Risk Assessment**: Understand route-specific challenges
- **Performance Metrics**: View carrier's historical reliability
- **Cost Breakdown**: Detailed pricing structure

### For Carriers
- **Credibility**: Showcase certifications and performance
- **Fair Pricing**: Cost structure is transparent
- **Risk Recognition**: Weather/traffic risks are acknowledged
- **Professional Documentation**: High-quality PDF contracts

### For Both Parties
- **Dynamic Contracts**: Each agreement is unique and specific
- **Audit Trail**: AI reasoning is documented
- **Legal Compliance**: Insurance and liability clearly stated
- **Easy Archival**: Organized PDF filenames for record-keeping

## Future Enhancements

1. **Digital Signatures**: Add e-signature integration
2. **Version Control**: Track agreement revisions
3. **Template Customization**: Allow custom agreement templates
4. **Blockchain Integration**: Immutable contract storage
5. **Multi-Language Support**: Generate agreements in different languages
6. **Real-Time Updates**: Update risk factors dynamically during negotiation
