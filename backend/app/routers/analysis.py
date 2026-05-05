from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.services.chess_service import chess_service
from app.services.gemini_service import stream_game_analysis
from pydantic import BaseModel

router = APIRouter()

class AnalysisRequest(BaseModel):
    room_id: str
    white_player: str = "White"
    black_player: str = "Black"

@router.post("/analyse")
async def analyse_game(request: AnalysisRequest):
    pgn = chess_service.get_pgn(
        request.room_id,
        request.white_player,
        request.black_player
    )
    if not pgn:
        raise HTTPException(404, "Game not found or no moves played")
    return StreamingResponse(
        stream_game_analysis(pgn, request.white_player, request.black_player),
        media_type="text/plain"
    )

@router.get("/{room_id}/pgn")
async def get_pgn(room_id: str, white: str = "White", black: str = "Black"):
    pgn = chess_service.get_pgn(room_id, white, black)
    if not pgn:
        raise HTTPException(404, "Game not found")
    return {"pgn": pgn}