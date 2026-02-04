"""
Script to analyze Google Sheet data structure
"""

import gspread
from google.oauth2.service_account import Credentials
from pathlib import Path
import json

CREDENTIALS_FILE = "campus-shi-74302de0ea32.json"
SHEET_ID = "1stdFSjVe3hg6qFJb8dZlFdhREdsLwJFnqB-zN_hE2yQ"

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly"
]

def main():
    script_dir = Path(__file__).parent
    credentials_path = script_dir / CREDENTIALS_FILE
    
    print("Connecting to Google Sheets...")
    credentials = Credentials.from_service_account_file(
        credentials_path,
        scopes=SCOPES
    )
    client = gspread.authorize(credentials)
    
    print(f"Opening sheet: {SHEET_ID}")
    spreadsheet = client.open_by_key(SHEET_ID)
    
    # List all worksheets
    print("\n=== WORKSHEETS ===")
    for ws in spreadsheet.worksheets():
        print(f"  - {ws.title}")
    
    # Get the first worksheet
    worksheet = spreadsheet.sheet1
    print(f"\n=== ANALYZING: {worksheet.title} ===")
    
    # Get all data
    all_data = worksheet.get_all_records()
    
    print(f"\nTotal Records: {len(all_data)}")
    
    if all_data:
        # Get column names
        columns = list(all_data[0].keys())
        print(f"\n=== COLUMNS ({len(columns)}) ===")
        for i, col in enumerate(columns, 1):
            print(f"  {i}. {col}")
        
        # Show sample data
        print("\n=== SAMPLE DATA (First 3 rows) ===")
        for i, row in enumerate(all_data[:3], 1):
            print(f"\n--- Row {i} ---")
            for key, value in row.items():
                # Truncate long values
                val_str = str(value)
                if len(val_str) > 100:
                    val_str = val_str[:100] + "..."
                print(f"  {key}: {val_str}")
        
        # Analyze data types and unique values
        print("\n=== COLUMN ANALYSIS ===")
        for col in columns:
            values = [row[col] for row in all_data if row[col]]
            unique_count = len(set(str(v) for v in values))
            print(f"\n{col}:")
            print(f"  - Non-empty values: {len(values)}/{len(all_data)}")
            print(f"  - Unique values: {unique_count}")
            
            # Show unique values if there are few (likely categorical)
            if unique_count <= 10 and unique_count > 0:
                unique_vals = list(set(str(v) for v in values))
                print(f"  - Values: {unique_vals}")

if __name__ == "__main__":
    main()
