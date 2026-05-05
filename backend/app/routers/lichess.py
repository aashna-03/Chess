from fastapi import APIRouter, HTTPException
from app.services.lichess_service import scout_opponent, get_player_profile
from pydantic import BaseModel

router = APIRouter()

class ScoutRequest(BaseModel):
    url_or_username: str

@router.post("/scout")
async def scout(request: ScoutRequest):
    result = await scout_opponent(request.url_or_username)
    if "error" in result:
        raise HTTPException(404, result["error"])
    return result

@router.get("/profile/{username}")
async def profile(username: str):
    data = await get_player_profile(username)
    if not data:
        raise HTTPException(404, "Player not found")
    return data