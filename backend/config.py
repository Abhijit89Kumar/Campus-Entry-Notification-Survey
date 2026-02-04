"""
Configuration settings for the Campus Entry Survey Analytics backend.
Updated: 2026-01-30
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Paths
BASE_DIR = Path(__file__).parent.parent

# Google Credentials - Support both file-based and environment variable
CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", "campus-shi-74302de0ea32.json")
CREDENTIALS_PATH = BASE_DIR / CREDENTIALS_FILE
CREDENTIALS_JSON = os.getenv("GOOGLE_CREDENTIALS_JSON", None)  # For Vercel deployment

def get_google_credentials():
    """Get Google credentials from environment variable or file."""
    if CREDENTIALS_JSON:
        # Parse JSON from environment variable (for Vercel)
        return json.loads(CREDENTIALS_JSON)
    elif CREDENTIALS_PATH.exists():
        # Read from file (for local development)
        with open(CREDENTIALS_PATH, 'r') as f:
            return json.load(f)
    else:
        raise FileNotFoundError(
            "Google credentials not found. Set GOOGLE_CREDENTIALS_JSON env var "
            f"or place credentials file at {CREDENTIALS_PATH}"
        )

# Google Sheets
SHEET_ID = os.getenv("GOOGLE_SHEET_ID", "1stdFSjVe3hg6qFJb8dZlFdhREdsLwJFnqB-zN_hE2yQ")
# Force the correct sheet name
SHEET_NAME = "Form Responses 1"

# API Settings
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# CORS - Allow frontend to access API
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    # Add your Vercel frontend URLs
    os.getenv("FRONTEND_URL", ""),
    "https://*.vercel.app",
]
# Filter out empty strings
CORS_ORIGINS = [origin for origin in CORS_ORIGINS if origin]

# Column mappings - Map long Google Form column names to short aliases
COLUMN_MAP = {
    "Timestamp": "timestamp",
    "Full Name": "name",
    "Roll Number": "roll_no",
    "Course of Study": "course",
    "Current Year": "year",
    "Do you support the implementation of this automated parent notification system for campus entry and exit?": "q1_parent_notification",
    "Do you support the Implementation of the 24/7 entry exit monitoring policy?": "q2_monitoring",
    "Please provide your reasoning for the answer above, along with any specific concerns (e.g., privacy, safety, necessity) or suggestions.": "comments"
}

# Reverse mapping for display
COLUMN_DISPLAY_NAMES = {v: k for k, v in COLUMN_MAP.items()}

# Course categories
COURSE_TYPES = ["Undergraduate (UG)", "Postgraduate (PG)", "PhD", "Research Scholar (RS)"]

# Year categories  
YEAR_TYPES = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]

# Concern categories for NLP classification
CONCERN_CATEGORIES = {
    "privacy": {
        "keywords": ["privacy", "surveillance", "track", "tracking", "monitor", "monitoring", 
                     "watch", "data", "spy", "spying", "confidential", "private"],
        "display_name": "Privacy Concerns",
        "color": "#ef4444"
    },
    "autonomy": {
        "keywords": ["adult", "adults", "independent", "independence", "freedom", "choice", 
                     "autonomy", "mature", "grown", "18", "age", "infantil", "child", "children"],
        "display_name": "Autonomy & Independence",
        "color": "#f97316"
    },
    "trust": {
        "keywords": ["trust", "distrust", "believe", "faith", "doubt", "suspicion", 
                     "mistrust", "confidence"],
        "display_name": "Trust Issues",
        "color": "#eab308"
    },
    "safety": {
        "keywords": ["safety", "safe", "secure", "security", "protection", "emergency", 
                     "risk", "danger", "dangerous", "harm"],
        "display_name": "Safety & Security",
        "color": "#22c55e"
    },
    "parental": {
        "keywords": ["parent", "parents", "family", "guardian", "mother", "father", 
                     "mom", "dad", "inform", "notify", "notification"],
        "display_name": "Parental Involvement",
        "color": "#3b82f6"
    },
    "necessity": {
        "keywords": ["unnecessary", "need", "needed", "why", "pointless", "waste", 
                     "useless", "required", "necessary", "essential"],
        "display_name": "Questioning Necessity",
        "color": "#8b5cf6"
    },
    "implementation": {
        "keywords": ["how", "practical", "feasible", "implement", "system", "work", 
                     "technical", "logistics", "infrastructure"],
        "display_name": "Implementation Concerns",
        "color": "#ec4899"
    }
}

# Quality thresholds
QUALITY_THRESHOLDS = {
    "min_valid_score": 40,  # Minimum score to be included in analysis
    "review_threshold": 60,  # Below this, flag for review
    "min_word_count": 3,     # Minimum meaningful words
}

# Profanity word list (basic - expand as needed)
PROFANITY_WORDS = [
    # Add words as needed - keeping minimal for now
    "fuck", "shit", "ass", "damn", "bitch", "crap", "bastard",
    "idiot", "stupid", "dumb", "moron", "retard"
]

# Keyboard spam patterns
KEYBOARD_PATTERNS = [
    "qwerty", "asdf", "zxcv", "qweasd", "12345", "abcde",
    "qazwsx", "wasd", "hjkl", "yuiop"
]
