import chess
import chess.pgn
import random
import io
from typing import Optional

# ─────────────────────────────────────────
# This service wraps python-chess and handles:
# - Move validation (includes castling, en passant, promotion)
# - Check / checkmate / stalemate detection
# - Dice chess (forced piece type)
# - Hand & Brain (return piece type only)
# - PGN export for analysis
# ─────────────────────────────────────────

PIECE_NAMES = {
    chess.PAWN: "pawn",
    chess.KNIGHT: "knight",
    chess.BISHOP: "bishop",
    chess.ROOK: "rook",
    chess.QUEEN: "queen",
    chess.KING: "king",
}

PIECE_FROM_NAME = {v: k for k, v in PIECE_NAMES.items()}

DICE_FACES = ["pawn", "pawn", "knight", "bishop", "rook", "queen"]


class ChessService:
    def __init__(self):
        # each game_id maps to a chess.Board instance
        self.boards: dict[str, chess.Board] = {}
        self.move_history: dict[str, list[str]] = {}

    # ── Room management ──────────────────────────────────────
    def create_game(self, game_id: str) -> dict:
        board = chess.Board()
        self.boards[game_id] = board
        self.move_history[game_id] = []
        return self._board_state(board)

    def get_game(self, game_id: str) -> Optional[chess.Board]:
        return self.boards.get(game_id)

    def delete_game(self, game_id: str):
        self.boards.pop(game_id, None)
        self.move_history.pop(game_id, None)

    # ── Move handling ─────────────────────────────────────────
    def make_move(self, game_id: str, uci_move: str) -> dict:
        """
        Accepts a move in UCI format e.g. 'e2e4', 'e1g1' (castling),
        'e5d6' (en passant), 'e7e8q' (promotion).
        python-chess handles ALL of these natively.
        Returns updated board state or error.
        """
        board = self.boards.get(game_id)
        if not board:
            return {"error": "Game not found"}

        try:
            move = chess.Move.from_uci(uci_move)
        except ValueError:
            return {"error": "Invalid move format"}

        if move not in board.legal_moves:
            return {"error": "Illegal move"}

        # detect special moves for frontend feedback
        is_castling = board.is_castling(move)
        is_en_passant = board.is_en_passant(move)
        is_capture = board.is_capture(move)
        gives_check = board.gives_check(move)

        board.push(move)
        self.move_history[game_id].append(uci_move)

        state = self._board_state(board)
        state.update({
            "last_move": uci_move,
            "is_castling": is_castling,
            "is_en_passant": is_en_passant,
            "is_capture": is_capture,
            "gives_check": gives_check,
        })
        return state

    # ── Move filtering for game modes ────────────────────────
    def legal_moves_for_piece_type(self, game_id: str, piece_name: str) -> list[str]:
        """
        Returns all legal moves filtered to a specific piece type.
        Used for both Dice Chess and Hand & Brain.
        """
        board = self.boards.get(game_id)
        if not board:
            return []

        piece_type = PIECE_FROM_NAME.get(piece_name.lower())
        if not piece_type:
            return []

        filtered = []
        for move in board.legal_moves:
            piece = board.piece_at(move.from_square)
            if piece and piece.piece_type == piece_type:
                filtered.append(move.uci())
        return filtered

    def has_legal_moves_for_piece(self, game_id: str, piece_name: str) -> bool:
        return len(self.legal_moves_for_piece_type(game_id, piece_name)) > 0

    # ── Dice Chess ───────────────────────────────────────────
    def roll_dice(self, game_id: str) -> dict:
        """
        Rolls dice, re-rolls if the piece has no legal moves.
        Weighted: pawn appears twice (more common).
        """
        board = self.boards.get(game_id)
        if not board:
            return {"error": "Game not found"}

        attempts = 0
        while attempts < 20:
            piece_name = random.choice(DICE_FACES)
            if self.has_legal_moves_for_piece(game_id, piece_name):
                return {
                    "piece": piece_name,
                    "legal_moves": self.legal_moves_for_piece_type(game_id, piece_name)
                }
            attempts += 1

        # fallback: find any piece with legal moves
        for piece_name in ["queen", "rook", "bishop", "knight", "pawn", "king"]:
            if self.has_legal_moves_for_piece(game_id, piece_name):
                return {
                    "piece": piece_name,
                    "legal_moves": self.legal_moves_for_piece_type(game_id, piece_name)
                }

        return {"error": "No legal moves available"}

    # ── Game state ───────────────────────────────────────────
    def _board_state(self, board: chess.Board) -> dict:
        """
        Returns full board state including all terminal conditions.
        python-chess handles: checkmate, stalemate, insufficient material,
        50-move rule, threefold repetition.
        """
        status = "ongoing"
        winner = None

        if board.is_checkmate():
            status = "checkmate"
            # the side that just moved wins
            winner = "black" if board.turn == chess.WHITE else "white"
        elif board.is_stalemate():
            status = "stalemate"
        elif board.is_insufficient_material():
            status = "draw_insufficient_material"
        elif board.is_fifty_moves():
            status = "draw_fifty_moves"
        elif board.is_repetition(3):
            status = "draw_repetition"

        return {
            "fen": board.fen(),
            "turn": "white" if board.turn == chess.WHITE else "black",
            "is_check": board.is_check(),
            "status": status,
            "winner": winner,
            "legal_moves": [m.uci() for m in board.legal_moves],
            "move_number": board.fullmove_number,
        }

    def get_state(self, game_id: str) -> dict:
        board = self.boards.get(game_id)
        if not board:
            return {"error": "Game not found"}
        return self._board_state(board)

    # ── PGN export for analysis ──────────────────────────────
    def get_pgn(self, game_id: str, white: str = "White", black: str = "Black") -> str:
        """
        Exports the full game as PGN string.
        Sent to Gemini for post-game analysis.
        """
        board = self.boards.get(game_id)
        if not board:
            return ""

        game = chess.pgn.Game()
        game.headers["White"] = white
        game.headers["Black"] = black

        # replay moves from history
        temp_board = chess.Board()
        node = game
        for uci in self.move_history.get(game_id, []):
            move = chess.Move.from_uci(uci)
            node = node.add_variation(move)
            temp_board.push(move)

        exporter = chess.pgn.StringExporter(headers=True, variations=True, comments=True)
        return game.accept(exporter)

    # ── All legal moves for a square ─────────────────────────
    def legal_moves_from_square(self, game_id: str, square_name: str) -> list[str]:
        """
        Returns all legal destination squares for a piece on a given square.
        e.g. square_name = 'e2' returns ['e3', 'e4']
        Used by frontend to highlight valid squares.
        """
        board = self.boards.get(game_id)
        if not board:
            return []
        try:
            square = chess.parse_square(square_name)
        except ValueError:
            return []
        return [
            chess.square_name(m.to_square)
            for m in board.legal_moves
            if m.from_square == square
        ]


chess_service = ChessService()
