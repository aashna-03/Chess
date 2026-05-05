import uuid
import json
import time
import asyncio
from fastapi import WebSocket
from typing import Optional
from app.services.chess_service import chess_service

TIME_CONTROLS = {
    "bullet": {"time": 60, "increment": 0},
    "blitz": {"time": 180, "increment": 2},
    "rapid": {"time": 600, "increment": 5},
    "unlimited": {"time": None, "increment": 0}
}

class Room:
    def __init__(self, room_id: str, mode: str = "classic", board_style: str = "default", time_control: str = "unlimited"):
        self.room_id = room_id
        self.mode = mode
        self.board_style = board_style
        self.time_control = time_control
        self.players: dict[str, WebSocket] = {}
        self.spectators: list[WebSocket] = []
        self.ready = False
        
        # Timer state
        config = TIME_CONTROLS.get(time_control, TIME_CONTROLS["unlimited"])
        self.white_time = config["time"]
        self.black_time = config["time"]
        self.increment = config["increment"]
        self.last_move_time = None
        self.active_turn = "white"
        self.game_started = False
        self.game_over = False
        self.timer_task = None

    async def start_timer_broadcast(self):
        if self.white_time is None:
            return
            
        while not self.game_over and self.ready:
            self.update_time()
            times = self.get_times()
            if times:
                await self.broadcast({
                    "type": "time_update",
                    "white_time": times["white"],
                    "black_time": times["black"]
                })
                
                # Check for flag fall
                if times["white"] <= 0:
                    self.game_over = True
                    await self.broadcast({
                        "type": "game_over",
                        "reason": "out_of_time",
                        "winner": "black"
                    })
                    break
                elif times["black"] <= 0:
                    self.game_over = True
                    await self.broadcast({
                        "type": "game_over",
                        "reason": "out_of_time",
                        "winner": "white"
                    })
                    break
                    
            await asyncio.sleep(1.0)

    def start_game(self):
        if not self.game_started and self.ready:
            self.game_started = True
            self.last_move_time = time.time()
            return True
        return False

    def update_time(self):
        if not self.game_started or self.white_time is None or self.game_over:
            return

        now = time.time()
        elapsed = now - self.last_move_time
        self.last_move_time = now

        if self.active_turn == "white":
            self.white_time = max(0, self.white_time - elapsed)
        else:
            self.black_time = max(0, self.black_time - elapsed)

    def handle_move(self, new_turn: str):
        if self.white_time is not None and not self.game_over:
            self.update_time()
            # Add increment to the player who just moved
            if self.active_turn == "white":
                self.white_time += self.increment
            else:
                self.black_time += self.increment
            
            self.active_turn = new_turn

    def get_times(self):
        if self.white_time is None:
            return None
        return {
            "white": round(self.white_time, 1),
            "black": round(self.black_time, 1)
        }

    def add_player(self, websocket: WebSocket) -> Optional[str]:
        if "white" not in self.players:
            self.players["white"] = websocket
            if "black" in self.players:
                self.ready = True
            return "white"
        elif "black" not in self.players:
            self.players["black"] = websocket
            self.ready = True
            return "black"
        return None

    def remove_player(self, color: str):
        self.players.pop(color, None)
        self.ready = False
        self.game_started = False # Stop timer if someone leaves

    async def broadcast(self, message: dict, exclude: str = None):
        data = json.dumps(message)
        for color, ws in self.players.items():
            if color != exclude:
                try:
                    await ws.send_text(data)
                except Exception:
                    pass
        for ws in self.spectators:
            try:
                await ws.send_text(data)
            except Exception:
                pass

    async def send_to(self, color: str, message: dict):
        ws = self.players.get(color)
        if ws:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                pass


class RoomService:
    def __init__(self):
        self.rooms: dict[str, Room] = {}

    def create_room(self, mode: str = "classic", board_style: str = "default", time_control: str = "unlimited") -> str:
        room_id = str(uuid.uuid4())[:8].upper()
        self.rooms[room_id] = Room(room_id, mode, board_style, time_control)
        chess_service.create_game(room_id)
        return room_id

    def get_room(self, room_id: str) -> Optional[Room]:
        return self.rooms.get(room_id)

    def delete_room(self, room_id: str):
        self.rooms.pop(room_id, None)
        chess_service.delete_game(room_id)

    def room_exists(self, room_id: str) -> bool:
        return room_id in self.rooms


room_service = RoomService()