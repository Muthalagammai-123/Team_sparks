import streamlit as st

def render_header():
    """
    Renders a clean, professional header for the Enterprise view.
    """
    st.markdown("""
        <style>
        /* Typography - Inter Font */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .stApp {
            font-family: 'Inter', sans-serif;
        }
        
        /* Header Styling */
        .app-header {
            padding-bottom: 1.5rem;
            border-bottom: 1px solid #E2E8F0;
            margin-bottom: 2rem;
        }
        .app-header h1 {
            color: #0F172A;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.02em;
        }
        .app-header p {
            color: #64748B;
            font-size: 1.1rem;
            margin-top: 0.5rem;
        }

        /* Clean Card/Container Styling */
        .block-container {
            max-width: 1200px;
        }
        
        div[data-testid="stVerticalBlock"] > div {
             background-color: transparent; 
        }

        /* Input Label Styling */
        label {
            color: #334155 !important;
            font-weight: 500 !important;
            font-size: 0.95rem !important;
        }
        </style>
        
        <div class="app-header">
            <h1>NegotiateX</h1>
            <p>AI-Driven Contract Intelligence & Automation</p>
        </div>
    """, unsafe_allow_html=True)
