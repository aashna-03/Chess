from fastapi import APIRouter, HTTPException
from app.services.chesscom_service import scout_opponent
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
