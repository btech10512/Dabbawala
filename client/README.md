# Dabbawala frontend

A responsive React + Vite dashboard for the FastAPI routes shown in your Swagger screenshot.

## Run it

1. Start your FastAPI backend on `http://127.0.0.1:8000`.
2. In this folder run:
   ```bash
   npm install
   cp .env.example .env
   npm run dev
   ```
3. Open `http://localhost:5173`.

## API contract used

- `GET /orders/?skip=0&limit=8&status=preparing&created_date=YYYY-MM-DD`
- `POST /orders/` with `{ "customer_name": "...", "delivery_address": "...", "items": "..." }`
- `GET /stats/daily?summary_date=YYYY-MM-DD`

The UI accepts either `item` or `items` when displaying an order. The create form currently sends `items`, matching the `OrderCreate` schema from the latest code shared in the conversation. If your actual schema uses `item`, change the `items` key in `src/App.jsx` to `item`.

## CORS

Because the frontend runs on port 5173 and FastAPI on port 8000, allow the frontend origin in your FastAPI app:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Add this middleware after creating `app = FastAPI(...)` and before serving requests.
