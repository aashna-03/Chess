import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────
// Manages the WebSocket connection to the FastAPI backend.
// Handles all incoming message types and exposes actions.
// ─────────────────────────────────────────

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";

export function useChessGame(roomId) {
    const ws = useRef(null);
    const [connected, setConnected] = useState(false);
    const [myColor, setMyColor] = useState(null);
    const [gameMode, setGameMode] = useState("classic");
    const [boardStyle, setBoardStyle] = useState("default");
    const [timeControl, setTimeControl] = useState("unlimited");
    const [fen, setFen] = useState("start");
    const [turn, setTurn] = useState("white");
    const [status, setStatus] = useState("waiting"); // waiting | ongoing | game_over
    const [winner, setWinner] = useState(null);
    const [gameOverReason, setGameOverReason] = useState(null);
    const [isCheck, setIsCheck] = useState(false);
    const [legalMoves, setLegalMoves] = useState([]);
    const [lastMove, setLastMove] = useState(null);
    const [diceRoll, setDiceRoll] = useState(null);       // { piece, legal_moves }
    const [opponentConnected, setOpponentConnected] = useState(false);
    const [drawOffered, setDrawOffered] = useState(false);
    const [coachSuggestion, setCoachSuggestion] = useState(null);
    const [coachLifelines, setCoachLifelines] = useState(3);
    
    // Timer state
    const [whiteTime, setWhiteTime] = useState(null);
    const [blackTime, setBlackTime] = useState(null);

    useEffect(() => {
        if (!roomId) return;

        ws.current = new WebSocket(`${WS_URL}/game/${roomId}/ws`);

        ws.current.onopen = () => setConnected(true);
        ws.current.onclose = () => setConnected(false);

        ws.current.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            handleMessage(msg);
        };

        return () => {
            ws.current?.close();
        };
    }, [roomId]);

    const handleMessage = useCallback((msg) => {
        switch (msg.type) {

            case "assigned":
                setMyColor(msg.color);
                setGameMode(msg.mode);
                setBoardStyle(msg.board_style || "default");
                setTimeControl(msg.time_control || "unlimited");
                break;

            case "opponent_joined":
                setOpponentConnected(true);
                setStatus("ongoing");
                break;

            case "state":
                setFen(msg.fen);
                setTurn(msg.turn);
                setIsCheck(msg.is_check);
                setLegalMoves(msg.legal_moves || []);
                if (msg.white_time !== undefined) setWhiteTime(msg.white_time);
                if (msg.black_time !== undefined) setBlackTime(msg.black_time);
                break;

            case "move_made":
                setFen(msg.fen);
                setTurn(msg.turn);
                setIsCheck(msg.is_check);
                setLegalMoves(msg.legal_moves || []);
                setLastMove(msg.last_move);
                setDiceRoll(null);
                if (msg.white_time !== undefined) setWhiteTime(msg.white_time);
                if (msg.black_time !== undefined) setBlackTime(msg.black_time);
                break;

            case "time_update":
                setWhiteTime(msg.white_time);
                setBlackTime(msg.black_time);
                break;

            case "dice_roll":
                setDiceRoll({ piece: msg.piece, legalMoves: msg.legal_moves });
                break;

            case "coach_suggestion":
                setCoachSuggestion({
                    move: msg.move,
                    reason: msg.reason,
                    evaluation: msg.evaluation || "",
                    top_moves: msg.top_moves || [],
                });
                if (msg.remaining !== undefined) {
                    setCoachLifelines(msg.remaining);
                }
                break;

            case "coach_lifelines":
                setCoachLifelines(msg.remaining);
                break;

            case "game_over":
                setStatus("game_over");
                setWinner(msg.winner);
                setGameOverReason(msg.reason);
                break;

            case "draw_offered":
                setDrawOffered(true);
                break;

            case "opponent_disconnected":
                setOpponentConnected(false);
                setStatus("waiting");
                break;

            case "error":
                console.error("Server error:", msg.message);
                break;
        }
    }, []);

    // ── Actions ──────────────────────────────────────────────
    const sendMove = useCallback((uciMove) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: "move", uci: uciMove }));
        }
    }, []);

    const rollDice = useCallback(() => {
        ws.current?.send(JSON.stringify({ type: "roll_dice" }));
    }, []);

    const requestCoach = useCallback(() => {
        if (coachLifelines <= 0) return;
        ws.current?.send(JSON.stringify({ type: "request_coach" }));
    }, [coachLifelines]);


    const resign = useCallback(() => {
        ws.current?.send(JSON.stringify({ type: "resign" }));
    }, []);

    const offerDraw = useCallback(() => {
        ws.current?.send(JSON.stringify({ type: "offer_draw" }));
    }, []);

    const acceptDraw = useCallback(() => {
        ws.current?.send(JSON.stringify({ type: "accept_draw" }));
        setDrawOffered(false);
    }, []);

    const isMyTurn = myColor === turn && status === "ongoing";

    return {
        // state
        connected, myColor, gameMode, boardStyle, timeControl, fen, turn, status,
        winner, gameOverReason, isCheck, legalMoves, lastMove,
        diceRoll, coachSuggestion, setCoachSuggestion, coachLifelines, opponentConnected,
        drawOffered, isMyTurn, whiteTime, blackTime,
        // actions
        sendMove, rollDice, requestCoach, resign, offerDraw, acceptDraw,
    };
}

