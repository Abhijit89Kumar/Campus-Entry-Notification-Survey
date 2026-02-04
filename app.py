"""
Campus Entry Notification System Dashboard
Fetches data from Google Sheets and displays it in a dashboard
"""

import streamlit as st
import pandas as pd
import gspread
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv
import os
from pathlib import Path

# Load environment variables
load_dotenv()

# Configuration
CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json")
SHEET_ID = os.getenv("GOOGLE_SHEET_ID")
SHEET_NAME = os.getenv("SHEET_NAME", "Sheet1")

# Google Sheets API scopes
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly"
]


@st.cache_data(ttl=60)  # Cache data for 60 seconds
def fetch_sheet_data() -> pd.DataFrame:
    """
    Fetch data from Google Sheets and return as a DataFrame.
    Cached for 60 seconds to avoid excessive API calls.
    """
    try:
        # Get the directory where this script is located
        script_dir = Path(__file__).parent
        credentials_path = script_dir / CREDENTIALS_FILE
        
        # Authenticate with Google Sheets
        credentials = Credentials.from_service_account_file(
            credentials_path,
            scopes=SCOPES
        )
        client = gspread.authorize(credentials)
        
        # Open the spreadsheet and get the worksheet
        spreadsheet = client.open_by_key(SHEET_ID)
        worksheet = spreadsheet.worksheet(SHEET_NAME)
        
        # Get all data as a list of dictionaries
        data = worksheet.get_all_records()
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        return df
    
    except FileNotFoundError:
        st.error(f"Credentials file not found: {CREDENTIALS_FILE}")
        st.info("Make sure your service account JSON file is in the project directory.")
        return pd.DataFrame()
    
    except gspread.exceptions.SpreadsheetNotFound:
        st.error("Spreadsheet not found. Check your GOOGLE_SHEET_ID in .env")
        st.info("Make sure you've shared the sheet with your service account email.")
        return pd.DataFrame()
    
    except gspread.exceptions.WorksheetNotFound:
        st.error(f"Worksheet '{SHEET_NAME}' not found in the spreadsheet.")
        return pd.DataFrame()
    
    except Exception as e:
        st.error(f"Error fetching data: {str(e)}")
        return pd.DataFrame()


def main():
    """Main dashboard application"""
    
    # Page configuration
    st.set_page_config(
        page_title="Campus Entry Notification System",
        page_icon="🏫",
        layout="wide"
    )
    
    # Header
    st.title("🏫 Campus Entry Notification System")
    st.markdown("---")
    
    # Check configuration
    if not SHEET_ID or SHEET_ID == "your_sheet_id_here":
        st.warning("⚠️ Please configure your Google Sheet ID in the `.env` file")
        st.code("""
# In your .env file, set:
GOOGLE_SHEET_ID=your_actual_sheet_id_here

# Find your Sheet ID in the URL:
# https://docs.google.com/spreadsheets/d/SHEET_ID_IS_HERE/edit
        """)
        return
    
    # Sidebar with refresh button
    with st.sidebar:
        st.header("Controls")
        if st.button("🔄 Refresh Data", use_container_width=True):
            st.cache_data.clear()
            st.rerun()
        
        st.markdown("---")
        st.markdown("### Info")
        st.markdown(f"**Sheet ID:** `{SHEET_ID[:20]}...`")
        st.markdown(f"**Worksheet:** `{SHEET_NAME}`")
    
    # Fetch and display data
    with st.spinner("Fetching data from Google Sheets..."):
        df = fetch_sheet_data()
    
    if df.empty:
        st.info("No data found or unable to fetch data.")
        return
    
    # Display metrics
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Records", len(df))
    with col2:
        st.metric("Columns", len(df.columns))
    with col3:
        st.metric("Data Status", "✅ Loaded")
    
    st.markdown("---")
    
    # Display data table
    st.subheader("📊 Data Table")
    st.dataframe(df, use_container_width=True, hide_index=True)
    
    # Download button
    csv = df.to_csv(index=False)
    st.download_button(
        label="📥 Download as CSV",
        data=csv,
        file_name="campus_entry_data.csv",
        mime="text/csv"
    )


if __name__ == "__main__":
    main()
