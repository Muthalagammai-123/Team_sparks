import streamlit as st
import datetime

def render_input_form():
    """
    Renders the structured input form for NegotiateX.
    Includes new fields: Role, Peak Season, Delay Penalty.
    """
    with st.container():
        st.subheader("Contract Parameters")
        st.markdown("---")
        
        col1, col2 = st.columns(2, gap="large")
        
        with col1:
            # 1. User Role Selection
            user_role = st.radio(
                "I am representing the:",
                ["Shipper", "Carrier"],
                horizontal=True
            )
            
            st.markdown("<br>", unsafe_allow_html=True) # Spacer

            # 2. Delivery Priority
            delivery_priority = st.selectbox(
                "Delivery Priority Strategy",
                ["Fast Delivery", "Balanced", "Cost Optimized"],
                help="Select the primary goal for this contract interaction."
            )
            
            # 3. Budget Range
            budget_range = st.slider(
                "Budget Range (Annual or Per Shipment)",
                min_value=1000, max_value=100000, value=(10000, 25000), step=1000,
                format="$%d"
            )
            
            # 4. Dates
            deadline = st.date_input(
                "Target Start / Delivery Date",
                min_value=datetime.date.today(),
                value=datetime.date.today() + datetime.timedelta(days=30)
            )

        with col2:
            # 5. Risk & Penalties
            risk_tolerance = st.selectbox(
                "Liability / Risk Tolerance",
                ["Low (Strict)", "Medium (Standard)", "High (Flexible)"],
                index=1
            )

            delay_penalty = st.selectbox(
                "Delay Penalty Preference",
                ["Low (Standard Interest)", "Medium (Definite Fees)", "High (Strict Forfeiture)"],
                help="Desired severity of penalties for missed deadlines."
            )

            # 6. Peak Season
            st.markdown("<br>", unsafe_allow_html=True)
            peak_season = st.checkbox("Include Peak Season / Holiday Clauses?", value=False)
            
            # 7. Additional Notes
            notes = st.text_area(
                "Additional Notes / Special Conditions",
                placeholder="Enter any specific clauses or operational constraints...",
                height=130
            )

        # Validation
        is_valid = True # In this robust mode, we assume defaults are usable, or add checks if critical.

    return {
        "user_role": user_role,
        "delivery_priority": delivery_priority,
        "budget_min": budget_range[0],
        "budget_max": budget_range[1],
        "risk_tolerance": risk_tolerance,
        "delay_penalty": delay_penalty,
        "peak_season": peak_season,
        "deadline": str(deadline),
        "notes": notes,
        "is_valid": is_valid
    }
