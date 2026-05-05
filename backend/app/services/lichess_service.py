import httpx
import re

LICHESS_API = "https://lichess.org/api"

def extract_username(url_or_username: str) -> str:
    """
    Accepts either:
    - https://lichess.org/@/username
    - https://lichess.org/user/username  
    - just: username
    """
    url_or_username = url_or_username.strip()
    
    # extract from URL
    match = re.search(r'lichess\.org/@?/?([a-zA-Z0-9_-]+)', url_or_username)
    if match:
        return match.group(1)
    
    # assume it's already a plain username
    return url_or_username

async def get_player_profile(url_or_username: str) -> dict:
    username = extract_username(url_or_username)
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{LICHESS_API}/user/{username}")
        if res.status_code != 200:
            return {}
        return res.json()

async def get_player_games(url_or_username: str, max_games: int = 20) -> str:
    username = extract_username(url_or_username)
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{LICHESS_API}/games/user/{username}",
            params={"max": max_games},
            headers={"Accept": "application/x-chess-pgn"}
        )
        return res.text

async def scout_opponent(url_or_username: str) -> dict:
    from app.services.gemini_service import client as groq_client

    username = extract_username(url_or_username)
    
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{LICHESS_API}/user/{username}")
        if res.status_code != 200:
            return {"error": f"Player '{username}' not found on Lichess"}
        data = res.json()

    # extract useful stats
    perfs = data.get("perfs", {})
    count = data.get("count", {})
    
    total_games = count.get("all", 0)
    wins = count.get("win", 0)
    losses = count.get("loss", 0)
    draws = count.get("draw", 0)

    win_pct = round((wins / total_games) * 100, 1) if total_games else 0
    loss_pct = round((losses / total_games) * 100, 1) if total_games else 0
    draw_pct = round((draws / total_games) * 100, 1) if total_games else 0

    # ratings across formats
    ratings = {}
    for format in ["bullet", "blitz", "rapid", "classical"]:
        if format in perfs:
            ratings[format] = perfs[format].get("rating", "N/A")

    # build stats summary
    stats_summary = f"""
Username: {username}
Ratings: {ratings}
Total games: {total_games}
Win/Loss/Draw: {win_pct}% / {loss_pct}% / {draw_pct}%
Playing since: {data.get('createdAt', 'N/A')}
"""

    # groq generates the scouting report
    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": f"""You are a professional chess analyst giving a pre-game scouting report.

Player stats:
{stats_summary}

Give a scouting report in this EXACT format:

⭐ RATING
Their strongest format and rating.

📊 RECORD
Win/loss/draw breakdown and what it tells us.

💪 STRENGTH
One sentence on what they likely do well.

⚠️ WEAKNESS  
One sentence on their likely weakness based on stats.

🎯 STRATEGY
One specific tip to beat this player.

Max 80 words total. Be direct and actionable."""}],
        max_tokens=200
    )

    report = response.choices[0].message.content.strip()

    return {
        "username": username,
        "ratings": ratings,
        "record": {
            "total": total_games,
            "wins": wins,
            "losses": losses,
            "draws": draws,
            "win_pct": win_pct,
            "loss_pct": loss_pct,
            "draw_pct": draw_pct
        },
        "report": report
    }