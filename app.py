import streamlit as st
from components.header import render_header
from components.inputs import render_input_form
from components.outputs import render_negotiation_result
from services.api import negotiate_contract_api

# Page Configuration
st.set_page_config(
    page_title="NegotiateX",
    page_icon="🤝",
    layout="wide",
    initial_sidebar_state="collapsed"
)

def main():
    render_header()
    
    # We use session state to store the result after form submission
    if "negotiation_result" not in st.session_state:
        st.session_state.negotiation_result = None

    # Layout: Split or Stacked? 
    # For a contract tool, width is good. Let's do a top-down approach for better focus flow.
    
    # INPUT SECTION
    form_data = render_input_form()

    # ACTION BUTTON
    submit_col, _ = st.columns([1, 4])
    with submit_col:
        # Only enable if valid
        if  st.button("Start AI Negotiation", type="primary", disabled=not form_data["is_valid"], use_container_width=True):
            with st.spinner("AI is analyzing constraints and drafting terms..."):
                response = negotiate_contract_api(form_data)
                st.session_state.negotiation_result = response
                st.success("Contract Generated Successfully!")

    # OUTPUT SECTION
    if st.session_state.negotiation_result:
        render_negotiation_result(st.session_state.negotiation_result)

if __name__ == "__main__":
    main()
