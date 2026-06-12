from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import game, analysis, lichess, chesscom
from app.core.config import settings
from app.services.gemini_service import get_stockfish, STOCKFISH_PATH  # 👈 add this

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://gambitai.vercel.app",
        "http://localhost:5173",
        settings.FRONTEND_URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")                          # 👈 add this
async def test_stockfish_on_startup():
    try:
        sf = get_stockfish()
        sf.set_fen_position("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
        move = sf.get_best_move()
        print(f"✅ Stockfish OK. Move: {move}, Path: {STOCKFISH_PATH}")
    except Exception as e:
        print(f"❌ Stockfish FAILED: {e} | Path: {STOCKFISH_PATH}")

app.include_router(lichess.router, prefix="/lichess", tags=["lichess"])
app.include_router(chesscom.router, prefix="/chesscom", tags=["chesscom"])
app.include_router(game.router, prefix="/game", tags=["game"])
app.include_router(analysis.router, prefix="/analysis", tags=["analysis"])

@app.get("/")
async def root():
    return {"status": "Chess API running"}