import httpx
import re

CHESSCOM_API = "https://api.chess.com/pub"

def extract_username(url_or_username: str) -> str:
    """
    Accepts:
    - https://www.chess.com/member/username
    - https://chess.com/player/username
    - just: username
    """
    url_or_username = url_or_username.strip()
    match = re.search(r'chess\.com/(?:member|player|@)?/?([a-zA-Z0-9_-]+)', url_or_username)
    if match:
        return match.group(1)
    return url_or_username

async def get_player_profile(username: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{CHESSCOM_API}/player/{username}")
        if res.status_code != 200:
            return {}
        return res.json()

async def get_player_stats(username: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{CHESSCOM_API}/player/{username}/stats")
        if res.status_code != 200:
            return {}
        return res.json()

async def scout_opponent(url_or_username: str) -> dict:
    from app.services.gemini_service import client as groq_client

    username = extract_username(url_or_username)

    async with httpx.AsyncClient() as client:
        profile_res = await client.get(f"{CHESSCOM_API}/player/{username}")
        if profile_res.status_code != 200:
            return {"error": f"Player '{username}' not found on Chess.com"}
        profile = profile_res.json()

        stats_res = await client.get(f"{CHESSCOM_API}/player/{username}/stats")
        stats = stats_res.json() if stats_res.status_code == 200 else {}

    # Extract ratings
    ratings = {}
    format_map = {
        "chess_bullet": "bullet",
        "chess_blitz": "blitz",
        "chess_rapid": "rapid"
        
    }
    for key, label in format_map.items():
        if key in stats and "last" in stats[key]:
            ratings[label] = stats[key]["last"]["rating"]

    # Extract win/loss/draw totals
    total_games = wins = losses = draws = 0
    for key in ["chess_bullet", "chess_blitz", "chess_rapid"]:
        if key in stats and "record" in stats[key]:
            r = stats[key]["record"]
            wins += r.get("win", 0)
            losses += r.get("loss", 0)
            draws += r.get("draw", 0)
    total_games = wins + losses + draws

    win_pct = round((wins / total_games) * 100, 1) if total_games else 0
    loss_pct = round((losses / total_games) * 100, 1) if total_games else 0
    draw_pct = round((draws / total_games) * 100, 1) if total_games else 0

    stats_summary = f"""
Username: {username}
Ratings: {ratings}
Total games: {total_games}
Win/Loss/Draw: {win_pct}% / {loss_pct}% / {draw_pct}%
Joined: {profile.get('joined', 'N/A')}
Country: {profile.get('country', 'N/A')}
"""

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": f"""You are a professional chess analyst giving a pre-game scouting report.

Player stats (Chess.com):
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
            "draw_pct": draw_pct,
        },
        "report": report,
    }
