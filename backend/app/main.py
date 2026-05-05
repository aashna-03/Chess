from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import game, analysis, lichess, chesscom
from app.core.config import settings

app = FastAPI(title="Chess App", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(lichess.router, prefix="/lichess", tags=["lichess"])
app.include_router(chesscom.router, prefix="/chesscom", tags=["chesscom"])
app.include_router(game.router, prefix="/game", tags=["game"])
app.include_router(analysis.router, prefix="/analysis", tags=["analysis"])

@app.get("/")
async def root():
    return {"status": "Chess API running"}