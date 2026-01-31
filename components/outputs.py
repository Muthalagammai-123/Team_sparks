import streamlit as st

def render_negotiation_result(data):
    """
    Displays the structured negotiation results.
    """
    if not data:
        return

    st.markdown("---")
    st.subheader("📝 Generated Contract Draft")
    
    # 1. Reasoning Summary
    with st.expander("AI Strategy & Reasoning", expanded=False):
        st.info(data.get("reasoning"))

    # 2. Structured Contract Sections
    sections = data.get("contract_sections", {})
    
    col_left, col_right = st.columns([2, 1])
    
    with col_left:
        with st.container():
            st.markdown("### 🚚 Delivery & Service")
            st.markdown(sections.get("delivery_terms", ""))
            st.divider()
            
            st.markdown("### 💰 Financial Terms")
            st.markdown(sections.get("cost_terms", ""))
            st.divider()

            st.markdown("### ⚠️ Penalties & Exceptions")
            st.markdown(sections.get("penalties", ""))
            st.divider()

            st.markdown("### 📋 Special Conditions")
            st.markdown(sections.get("special_conditions", ""))

    with col_right:
        st.warning("Action Required")
        st.markdown("Review the terms carefully before exporting.")
        
        st.download_button(
            "Download PDF",
            data=data.get("full_text", "Contract"),
            file_name="contract.pdf",
            mime="application/pdf",
            use_container_width=True
        )
        st.download_button(
            "Download Text",
            data=data.get("full_text", "Contract"),
            file_name="contract.txt",
            mime="text/plain",
            use_container_width=True
        )
        
        if st.button("Start New Negotiation", use_container_width=True):
             st.session_state.negotiation_result = None
             st.rerun()
