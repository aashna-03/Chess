from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

from stockfish import Stockfish
import os

# stockfish exe lives at the backend root (two levels up from this file)
STOCKFISH_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "stockfish-windows-x86-64-avx2.exe")

def get_stockfish():
    return Stockfish(
        path=STOCKFISH_PATH,
        depth=15,
        parameters={"Threads": 2, "Minimum Thinking Time": 100}
    )

async def get_coach_suggestion(board_fen: str, move_history: list[str], turn: str, available_moves: list[str]) -> dict:
    
    # Step 1 — Stockfish finds the best move
    try:
        sf = get_stockfish()
        sf.set_fen_position(board_fen)
        best_move = sf.get_best_move()
        evaluation = sf.get_evaluation()  # {"type": "cp", "value": 120}
        top_moves = sf.get_top_moves(3)   # top 3 moves with scores
    except Exception as e:
        print(f"Stockfish error: {e}")
        best_move = available_moves[0] if available_moves else None
        evaluation = {"type": "cp", "value": 0}
        top_moves = []

    if not best_move:
        return {"move": available_moves[0], "reason": "Best available move."}

    # Step 2 — format evaluation for Groq
    eval_text = ""
    if evaluation["type"] == "cp":
        cp = evaluation["value"]
        if abs(cp) < 50:
            eval_text = "Position is roughly equal."
        elif cp > 0:
            eval_text = f"White is better by {cp/100:.1f} pawns."
        else:
            eval_text = f"Black is better by {abs(cp)/100:.1f} pawns."
    elif evaluation["type"] == "mate":
        eval_text = f"Mate in {abs(evaluation['value'])} moves!"

    # Step 3 — Groq explains the move in natural language
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": f"""You are a chess coach explaining a move to a beginner.

        Position (FEN): {board_fen}
        Current evaluation: {eval_text}
        Best move found: {best_move}
        Top alternatives: {', '.join([m['Move'] for m in top_moves]) if top_moves else 'N/A'}

        Explain in ONE sentence why {best_move} is the best move right now.
        Be specific about the tactical or strategic reason.
        No jargon. Max 20 words."""}],
        max_tokens=60
    )

    reason = response.choices[0].message.content.strip()

    return {
        "move": best_move,
        "reason": reason,
        "evaluation": eval_text,
        "top_moves": [m["Move"] for m in top_moves] if top_moves else []
    }
async def stream_game_analysis(pgn: str, white: str, black: str):
    stream = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": f"""You are a professional chess coach giving post-game feedback.

            Game: {white} (White) vs {black} (Black)
            PGN: {pgn}

            Respond in this exact format:

            🏆 RESULT
            One sentence on who won and how.

            ⚔️ TURNING POINT
            The single move or moment that decided the game.

            ⚪ {white}
            Strength: one sentence.
            Mistake: one sentence.
            Tip: one actionable improvement.

            ⚫ {black}
            Strength: one sentence.
            Mistake: one sentence.
            Tip: one actionable improvement.

            🎯 VERDICT
            One punchy closing sentence about the game overall.

            Rules: Be precise, professional, and brutally honest. No filler words. Max 120 words total."""}],
        max_tokens=250,
        stream=True
    )
    for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content