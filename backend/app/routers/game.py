from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import StreamingResponse
from app.services.room_service import room_service
from app.services.chess_service import chess_service
from app.services.gemini_service import stream_game_analysis,get_coach_suggestion
import json


coach_lifelines = {}
router = APIRouter()


# ── REST: Create a room ───────────────────────────────────────
@router.post("/create")
async def create_room(mode: str = "classic", board_style: str = "default", time_control: str = "unlimited"):
    """
    mode: "classic" | "coach" | "dice"
    Returns room_id which is shared with the opponent.
    """
    if mode not in ("classic", "coach", "dice"):
        raise HTTPException(400, "Invalid mode")
    room_id = room_service.create_room(mode, board_style, time_control)
    return {"room_id": room_id, "mode": mode, "board_style": board_style, "time_control": time_control}


# ── REST: Room info ───────────────────────────────────────────
@router.get("/{room_id}/state")
async def get_state(room_id: str):
    room = room_service.get_room(room_id)
    if not room:
        raise HTTPException(404, "Room not found")
    return chess_service.get_state(room_id)


# ── WebSocket: Main game connection ──────────────────────────
@router.websocket("/{room_id}/ws")
async def game_websocket(websocket: WebSocket, room_id: str):
    """
    Each player connects here. Server assigns white/black automatically.

    Message types FROM client:
      { "type": "move", "uci": "e2e4" }
      { "type": "roll_dice" }
      { "type": "request_brain_call" }
      { "type": "resign" }
      { "type": "offer_draw" }
      { "type": "accept_draw" }

    Message types TO client:
      { "type": "assigned", "color": "white" }
      { "type": "opponent_joined" }
      { "type": "state", ...board_state }
      { "type": "move_made", ...state, "last_move": "e2e4" }
      { "type": "dice_roll", "piece": "knight", "legal_moves": [...] }
      { "type": "brain_call", "piece": "bishop" }
      { "type": "game_over", "reason": "checkmate", "winner": "white" }
      { "type": "error", "message": "..." }
    """
    room = room_service.get_room(room_id)
    if not room:
        await websocket.close(code=4004, reason="Room not found")
        return

    await websocket.accept()

    color = room.add_player(websocket)
    if not color:
        await websocket.send_text(json.dumps({"type": "error", "message": "Room is full"}))
        await websocket.close()
        return

    # tell this player their color and room settings
    await websocket.send_text(json.dumps({
        "type": "assigned",
        "color": color,
        "mode": room.mode,
        "board_style": room.board_style,
        "time_control": room.time_control,
        "room_id": room_id
    }))

    # initialise coach lifelines for this room (once)
    if room_id not in coach_lifelines:
        coach_lifelines[room_id] = {"white": 3, "black": 3}

    # send this player their current lifeline count
    await websocket.send_text(json.dumps({
        "type": "coach_lifelines",
        "remaining": coach_lifelines[room_id].get(color, 3)
    }))

    # tell both players if game is ready
    if room.ready:
        await room.broadcast({"type": "opponent_joined", "message": "Both players connected. Game starts!"})
        state = chess_service.get_state(room_id)
        
        # Start timer
        room.start_game()
        import asyncio
        asyncio.create_task(room.start_timer_broadcast())
        
        times = room.get_times()
        await room.broadcast({
            "type": "state", 
            **state, 
            "white_time": times["white"] if times else None,
            "black_time": times["black"] if times else None
        })

        # if dice mode, roll immediately for white
        if room.mode == "dice":
            dice = chess_service.roll_dice(room_id)
            await room.broadcast({"type": "dice_roll", **dice})

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            msg_type = msg.get("type")

            # ── Make a move ──────────────────────────────────
            if msg_type == "move":
                uci = msg.get("uci", "")
                result = chess_service.make_move(room_id, uci)

                if "error" in result:
                    await websocket.send_text(json.dumps({"type": "error", "message": result["error"]}))
                    continue

                # Update timer on move
                room.handle_move(result["turn"])
                times = room.get_times()

                # broadcast move to both players
                await room.broadcast({
                    "type": "move_made", 
                    **result,
                    "white_time": times["white"] if times else None,
                    "black_time": times["black"] if times else None
                })

                # handle game over
                if result["status"] != "ongoing":
                    room.game_over = True
                    await room.broadcast({
                        "type": "game_over",
                        "reason": result["status"],
                        "winner": result.get("winner")
                    })
                    continue

                # after move: handle mode-specific next step
                if room.mode == "dice":
                    dice = chess_service.roll_dice(room_id)
                    await room.broadcast({"type": "dice_roll", **dice})

            # ── Roll dice (manual re-roll or initial) ────────
            elif msg_type == "roll_dice":
                if room.mode != "dice":
                    await websocket.send_text(json.dumps({"type": "error", "message": "Not in dice mode"}))
                    continue
                dice = chess_service.roll_dice(room_id)
                await room.broadcast({"type": "dice_roll", **dice})

            

            # ── Resign ───────────────────────────────────────
            elif msg_type == "resign":
                winner = "black" if color == "white" else "white"
                await room.broadcast({
                    "type": "game_over",
                    "reason": "resignation",
                    "winner": winner,
                    "resigned": color
                })

            # ── Draw offer ───────────────────────────────────
            elif msg_type == "offer_draw":
                await room.broadcast({"type": "draw_offered", "by": color}, exclude=color)

            elif msg_type == "accept_draw":
                await room.broadcast({"type": "game_over", "reason": "draw_agreed", "winner": None})
            
            elif msg_type == "request_coach":
                remaining = coach_lifelines.get(room_id, {}).get(color, 0)
    
                if remaining <= 0:
                    await room.send_to(color, {
                        "type": "error",
                        "message": "No coach lifelines remaining!"
                    })
                    continue

                # deduct lifeline
                coach_lifelines[room_id][color] -= 1
                remaining_after = coach_lifelines[room_id][color]

                state = chess_service.get_state(room_id)
                history = chess_service.move_history.get(room_id, [])
                available_moves = state["legal_moves"]

                suggestion = await get_coach_suggestion(
                    state["fen"],
                    history,
                    state["turn"],
                    available_moves
                )

                await room.send_to(color, {
                    "type": "coach_suggestion",
                    "move": suggestion["move"],
                    "reason": suggestion["reason"],
                    "evaluation": suggestion.get("evaluation", ""),
                    "top_moves": suggestion.get("top_moves", []),
                    "remaining": remaining_after
                })

    except WebSocketDisconnect:
        room.remove_player(color)
        await room.broadcast({"type": "opponent_disconnected", "color": color})
        if not room.players:
            room_service.delete_room(room_id)
            coach_lifelines.pop(room_id, None)
