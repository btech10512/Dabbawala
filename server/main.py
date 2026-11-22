from contextlib import asynccontextmanager
from fastapi import FastAPI
from database import create_tables
from routes.orders import router as orders_router
from routes.stats import router as stats_router
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app : FastAPI):
    create_tables()
    print("Database tables created")
    yield
    print("Application shutdown")

app = FastAPI(
    title="Dabbawala",
    description="API for managing dabbawala deliveries and tracking order status",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://dabbawala.vercel.app",
        "https://dabbawala-git-main-ankits-projects-2342d1a2.vercel.app",
    ],
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(orders_router)
app.include_router(stats_router)

@app.get("/health", tags=["health"])
def health_check():
    return {"status":"ok"}



