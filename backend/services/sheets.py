"""
Google Sheets integration service.
"""

import gspread
from google.oauth2.service_account import Credentials
from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd
import logging

from backend.config import (
    SHEET_ID, 
    SHEET_NAME, 
    COLUMN_MAP,
    get_google_credentials
)

logger = logging.getLogger(__name__)

# Google Sheets API scopes
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly"
]


class SheetsService:
    """Service for interacting with Google Sheets."""
    
    _instance: Optional['SheetsService'] = None
    _client: Optional[gspread.Client] = None
    _cached_data: Optional[pd.DataFrame] = None
    _cache_timestamp: Optional[datetime] = None
    _cache_ttl_seconds: int = 300  # 5 minutes
    
    def __new__(cls):
        """Singleton pattern to reuse connection."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def _get_client(self) -> gspread.Client:
        """Get or create the gspread client."""
        if self._client is None:
            logger.info("Authenticating with Google Sheets...")
            creds_info = get_google_credentials()
            credentials = Credentials.from_service_account_info(
                creds_info,
                scopes=SCOPES
            )
            self._client = gspread.authorize(credentials)
        return self._client
    
    def _is_cache_valid(self) -> bool:
        """Check if cached data is still valid."""
        if self._cached_data is None or self._cache_timestamp is None:
            return False
        
        elapsed = (datetime.now() - self._cache_timestamp).total_seconds()
        return elapsed < self._cache_ttl_seconds
    
    def fetch_raw_data(self, force_refresh: bool = False) -> pd.DataFrame:
        """
        Fetch all data from the Google Sheet.
        
        Args:
            force_refresh: If True, bypass cache and fetch fresh data.
            
        Returns:
            DataFrame with all survey responses.
        """
        if not force_refresh and self._is_cache_valid():
            logger.info("Returning cached data")
            return self._cached_data.copy()
        
        logger.info(f"Fetching data from Google Sheets: {SHEET_ID}")
        
        try:
            client = self._get_client()
            spreadsheet = client.open_by_key(SHEET_ID)
            worksheet = spreadsheet.worksheet(SHEET_NAME)
            
            # Get all records
            records = worksheet.get_all_records()
            
            if not records:
                logger.warning("No data found in sheet")
                return pd.DataFrame()
            
            # Convert to DataFrame
            df = pd.DataFrame(records)
            
            # Rename columns using mapping
            df = self._rename_columns(df)
            
            # Parse timestamp
            df = self._parse_timestamps(df)
            
            # Add row ID
            df['id'] = range(1, len(df) + 1)
            
            # Cache the data
            self._cached_data = df
            self._cache_timestamp = datetime.now()
            
            logger.info(f"Fetched {len(df)} records from Google Sheets")
            return df.copy()
            
        except gspread.exceptions.SpreadsheetNotFound:
            logger.error(f"Spreadsheet not found: {SHEET_ID}")
            raise ValueError(f"Spreadsheet not found. Check SHEET_ID: {SHEET_ID}")
        
        except gspread.exceptions.WorksheetNotFound:
            logger.error(f"Worksheet not found: {SHEET_NAME}")
            raise ValueError(f"Worksheet not found: {SHEET_NAME}")
        
        except Exception as e:
            logger.error(f"Error fetching data: {str(e)}")
            raise
    
    def _rename_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Rename columns using the mapping."""
        rename_map = {}
        
        # Log original columns for debugging
        logger.debug(f"Original columns: {df.columns.tolist()}")
        
        for original, new_name in COLUMN_MAP.items():
            # Find matching column - check for exact match first
            for col in df.columns:
                col_lower = col.lower().strip()
                original_lower = original.lower().strip()
                
                # Exact match
                if col_lower == original_lower:
                    rename_map[col] = new_name
                    break
                # Partial match - original is contained in column
                elif original_lower in col_lower:
                    rename_map[col] = new_name
                    break
                # Partial match - column is contained in original  
                elif col_lower in original_lower and len(col_lower) > 5:
                    rename_map[col] = new_name
                    break
        
        logger.debug(f"Column rename map: {rename_map}")
        
        if rename_map:
            df = df.rename(columns=rename_map)
        
        logger.debug(f"Final columns: {df.columns.tolist()}")
        return df
    
    def _parse_timestamps(self, df: pd.DataFrame) -> pd.DataFrame:
        """Parse timestamp column to datetime."""
        if 'timestamp' in df.columns:
            try:
                # Try multiple date formats
                df['timestamp'] = pd.to_datetime(df['timestamp'], format='mixed', dayfirst=False)
            except Exception as e:
                logger.warning(f"Could not parse timestamps: {e}")
        
        return df
    
    def get_response_count(self) -> int:
        """Get total number of responses."""
        df = self.fetch_raw_data()
        return len(df)
    
    def get_unique_courses(self) -> List[str]:
        """Get list of unique course types."""
        df = self.fetch_raw_data()
        if 'course' in df.columns:
            return df['course'].dropna().unique().tolist()
        return []
    
    def get_unique_years(self) -> List[str]:
        """Get list of unique year types."""
        df = self.fetch_raw_data()
        if 'year' in df.columns:
            return df['year'].dropna().unique().tolist()
        return []
    
    def invalidate_cache(self):
        """Force cache invalidation."""
        self._cached_data = None
        self._cache_timestamp = None
        logger.info("Cache invalidated")


# Singleton instance
sheets_service = SheetsService()
