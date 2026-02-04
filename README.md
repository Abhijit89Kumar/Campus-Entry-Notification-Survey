# Campus Entry Notification Survey Dashboard

A comprehensive analytics dashboard for analyzing student survey responses about campus entry notification policies. Built with **Next.js** (frontend) and **FastAPI** (backend).

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-green)

## Features

### Decision Support Tools
- **Decision Summary** - Executive overview with key findings and recommendations
- **Compare Groups** - Side-by-side demographic comparison with statistical significance
- **Key Findings Engine** - Auto-generated insights ranked by importance
- **Recommendations Engine** - Data-driven policy recommendations

### Analytics
- **Real-time Data** - Fetches directly from Google Sheets
- **Demographic Analysis** - Breakdowns by course and year
- **Sentiment Analysis** - NLP-based comment analysis
- **Concern Classification** - Automatic categorization of student concerns
- **Data Quality Scoring** - Response validation and filtering

### Export Options
- **Committee Report** - Professional PDF-ready reports with confidence intervals
- **CSV Export** - Full data download
- **Executive Summary** - Quick text summary

## Tech Stack

- **Frontend**: Next.js 15, React, TailwindCSS, Framer Motion, Recharts
- **Backend**: FastAPI, Python, Pandas, Scipy
- **Data Source**: Google Sheets API
- **Deployment**: Vercel

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- Python 3.10+
- Google Cloud Service Account with Sheets API enabled

### 1. Clone the repository
```bash
git clone https://github.com/Abhijit89Kumar/Campus-Entry-Notification-Survey.git
cd Campus-Entry-Notification-Survey
```

### 2. Set up the Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file:
```env
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_CREDENTIALS_PATH=./your-credentials.json
```

Run the backend:
```bash
uvicorn main:app --reload --port 8000
```

### 3. Set up the Frontend
```bash
cd frontend
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the frontend:
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Deployment

### Deploy Frontend (Vercel)

1. Go to [Vercel](https://vercel.com) and import this repository
2. Set the **Root Directory** to `frontend`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = Your backend URL (from Railway, see below)
4. Deploy

### Deploy Backend (Railway)

The backend uses pandas/numpy/scipy which exceed Vercel's 250MB limit. Use **Railway** instead:

1. Go to [Railway](https://railway.app) and create a new project
2. Click **"Deploy from GitHub repo"** and select this repository
3. In Settings, set **Root Directory** to `backend`
4. Add environment variables:
   - `GOOGLE_SHEET_ID` = `1stdFSjVe3hg6qFJb8dZlFdhREdsLwJFnqB-zN_hE2yQ`
   - `GOOGLE_CREDENTIALS_JSON` = Your service account JSON (as a single line)
   - `PORT` = `8000`
5. Railway will auto-detect Python and deploy using the Procfile
6. Copy the generated URL (e.g., `https://your-app.railway.app`)

### Alternative: Deploy Backend on Render

1. Go to [Render](https://render.com) and create a new **Web Service**
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Set **Build Command**: `pip install -r requirements.txt`
5. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables (same as Railway)

### Setting up Google Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a Service Account with Sheets API access
3. Download the JSON key file
4. Paste the entire JSON content as the `GOOGLE_CREDENTIALS_JSON` environment variable

---

## Project Structure

```
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── routers/
│   │   ├── analytics.py        # Analytics API endpoints
│   │   └── data.py             # Data API endpoints
│   ├── services/
│   │   ├── sheets.py           # Google Sheets integration
│   │   ├── precompute.py       # Analytics pre-computation
│   │   ├── confidence.py       # Statistical calculations
│   │   ├── findings_generator.py
│   │   ├── recommendations.py
│   │   ├── comparison.py
│   │   └── nlp/                # NLP services
│   ├── requirements.txt
│   └── vercel.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js pages
│   │   │   ├── page.tsx        # Overview
│   │   │   ├── decision-summary/
│   │   │   ├── compare/
│   │   │   ├── demographics/
│   │   │   ├── insights/
│   │   │   ├── explorer/
│   │   │   └── export/
│   │   ├── components/         # React components
│   │   └── lib/                # Utilities & API client
│   ├── package.json
│   └── vercel.json
│
├── cache/                      # Pre-computed analytics cache
├── .env.example
└── README.md
```

---

## API Endpoints

### Analytics
| Endpoint | Description |
|----------|-------------|
| `GET /api/analytics/overview` | Summary metrics |
| `GET /api/analytics/demographics` | Demographic breakdowns |
| `GET /api/analytics/key-findings` | Auto-generated findings |
| `GET /api/analytics/recommendations` | Policy recommendations |
| `GET /api/analytics/compare` | Compare two groups |
| `GET /api/analytics/decision-summary` | Complete summary |

### Data
| Endpoint | Description |
|----------|-------------|
| `GET /api/data/responses` | Survey responses |
| `GET /api/data/metadata` | Available filters |
| `POST /api/data/refresh` | Refresh data cache |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is for educational and research purposes.

---

## Contact

**Abhijit Kumar** - [GitHub](https://github.com/Abhijit89Kumar)
