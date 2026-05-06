import { useParams } from "react-router-dom";
import { useState } from "react";
import ChessBoard from "../components/chess/ChessBoard";
import { useChessGame } from "../hooks/useWebSocket";

const PIECE_EMOJI = {
    pawn: "♟", knight: "♞", bishop: "♝",
    rook: "♜", queen: "♛", king: "♚",
};

export default function Game() {
    const { roomId } = useParams();
    const [analysisText, setAnalysisText] = useState("");
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    const {
        connected, myColor, gameMode, boardStyle, timeControl, fen, turn, status,
        winner, gameOverReason, isCheck, lastMove,
        diceRoll, brainCall, opponentConnected, drawOffered, isMyTurn,
        coachSuggestion, setCoachSuggestion, coachLifelines,
        sendMove, rollDice, requestCoach, resign, offerDraw, acceptDraw,
        whiteTime, blackTime
    } = useChessGame(roomId);

    const formatTime = (seconds) => {
        if (seconds === null || seconds === undefined) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const fetchAnalysis = async () => {
        setLoadingAnalysis(true);
        setAnalysisText("");
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/analysis/analyse`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ room_id: roomId }),
                });
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                setAnalysisText((prev) => prev + decoder.decode(value));
            }
        } catch (err) {
            setAnalysisText("Could not fetch analysis. Make sure backend is running.");
        }
        setLoadingAnalysis(false);
    };

    return (
        <div style={{
            display: "flex",
            gap: 30,
            padding: "20px",
            minHeight: "100vh",
            background: "#0a0a0b",
            color: "#fff",
            fontFamily: "'Inter', sans-serif",
            boxSizing: "border-box",
            flexWrap: "wrap",
            justifyContent: "center",
        }}>

            {/* Board column */}
            <div style={{ flex: "0 1 auto", width: "100%", maxWidth: "575px" }} >

                {/* Status bar above board */}
                <div style={{ marginBottom: 16, fontSize: 14, fontWeight: "500" }}>
                    {!opponentConnected ? (
                        <span style={{ color: "#facc15" }}>⏳ Waiting for opponent — share room ID: <b style={{ fontSize: "16px" }}>{roomId}</b></span>
                    ) : (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ color: turn === myColor ? "#4ade80" : "#888" }}>
                                {turn === myColor ? "● Your turn" : "○ Opponent's turn"}
                                {isCheck && <span style={{ color: "#ef4444", marginLeft: 16, fontWeight: "700" }}>⚠️ CHECK!</span>}
                            </span>
                            <span style={{ color: "#666", fontSize: "12px" }}>Mode: {gameMode}</span>
                        </div>
                    )}
                </div>

                <ChessBoard
                    fen={fen}
                    myColor={myColor}
                    isMyTurn={isMyTurn}
                    onMove={sendMove}
                    gameMode={gameMode}
                    diceRoll={diceRoll}
                    brainCall={brainCall}
                    lastMove={lastMove}
                    isCheck={isCheck}
                    boardStyle={boardStyle}
                />

                {/* Action buttons below board */}
                {status === "ongoing" && (
                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                        <button onClick={offerDraw} style={{ ...btnStyle("#1a1a1c"), border: "1px solid #333" }}>Offer Draw</button>
                        <button onClick={resign} style={btnStyle("#ef4444")}>Resign</button>
                    </div>
                )}
            </div>

            {/* Side panel */}
            <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 16, maxWidth: "400px" }}>

                {/* Room info */}
                <div style={cardStyle("#111113", "#222225")}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
                        <div>
                            <p style={{ margin: 0, fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "1px" }}>Room ID</p>
                            <p style={{ margin: "2px 0 0", fontSize: 24, fontWeight: "800", color: "#facc15" }}>{roomId}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <p style={{ margin: 0, fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "1px" }}>Time Control</p>
                            <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: "600", color: "#8b5cf6" }}>{timeControl?.toUpperCase() || "UNLIMITED"}</p>
                        </div>
                    </div>

                    {/* Timer Section */}
                    {timeControl !== "unlimited" && (
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                            marginBottom: 20,
                            background: "rgba(0,0,0,0.3)",
                            padding: 12,
                            borderRadius: 12,
                            border: "1px solid #1a1a1c"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 12, color: turn === "white" ? "#fff" : "#555", fontWeight: turn === "white" ? "700" : "400" }}>WHITE</span>
                                <span style={{
                                    fontSize: 20,
                                    fontFamily: "monospace",
                                    color: whiteTime < 10 && turn === "white" ? "#ef4444" : (turn === "white" ? "#fff" : "#888"),
                                    fontWeight: "bold",
                                }}>
                                    {formatTime(whiteTime)}
                                </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: 12, color: turn === "black" ? "#fff" : "#555", fontWeight: turn === "black" ? "700" : "400" }}>BLACK</span>
                                <span style={{
                                    fontSize: 20,
                                    fontFamily: "monospace",
                                    color: blackTime < 10 && turn === "black" ? "#ef4444" : (turn === "black" ? "#fff" : "#888"),
                                    fontWeight: "bold",
                                }}>
                                    {formatTime(blackTime)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", borderTop: "1px solid #222", paddingTop: "12px" }}>
                        <div>
                            <p style={{ margin: 0, fontSize: 10, color: "#555" }}>YOU</p>
                            <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: "700", color: myColor === "white" ? "#fff" : "#aaa" }}>{myColor?.toUpperCase() || "..."}</p>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 10, color: "#555" }}>STATUS</p>
                            <p style={{ margin: "2px 0 0", fontSize: 13, color: opponentConnected ? "#4ade80" : "#facc15" }}>
                                {opponentConnected ? "Connected" : "Waiting..."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Game over */}
                {status === "game_over" && (
                    <div style={cardStyle("#1a1a1a", "#facc15")}>
                        <p style={{ margin: 0, fontSize: 18, color: "#facc15", fontWeight: "bold" }}>
                            {winner ? `${winner.toUpperCase()} WINS! 🏆` : "DRAW!"}
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>{gameOverReason}</p>
                    </div>
                )}

                {/* Dice mode */}
                {gameMode === "dice" && status === "ongoing" && (
                    <div style={cardStyle("#1a1a1a", "#7c3aed")}>
                        <p style={{ margin: "0 0 8px", fontSize: 12, color: "#888" }}>🎲 DICE ROLL</p>
                        {diceRoll ? (
                            <p style={{ margin: 0, fontSize: 22 }}>
                                {PIECE_EMOJI[diceRoll.piece]}&nbsp;
                                <span style={{ fontSize: 15 }}>Move a <b>{diceRoll.piece}</b></span>
                            </p>
                        ) : isMyTurn ? (
                            <button onClick={rollDice} style={btnStyle("#7c3aed")}>Roll Dice 🎲</button>
                        ) : (
                            <p style={{ margin: 0, fontSize: 13, color: "#888" }}>Opponent is rolling...</p>
                        )}
                    </div>
                )}

                {/* AI Coach — only in coach mode */}
                {gameMode === "coach" && status === "ongoing" && (
                    <div style={cardStyle("#1a1a1a", "#4ade80")}>
                        <p style={{ margin: "0 0 10px", fontSize: 12, color: "#888" }}>🎓 AI COACH</p>

                        {/* Lifeline icons */}
                        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                            {[1, 2, 3].map((i) => (
                                <span key={i} style={{
                                    fontSize: 20,
                                    opacity: i <= coachLifelines ? 1 : 0.2,
                                    filter: i <= coachLifelines ? "none" : "grayscale(100%)"
                                }}>
                                    🎓
                                </span>
                            ))}
                            <span style={{ fontSize: 12, color: "#888", alignSelf: "center", marginLeft: 4 }}>
                                {coachLifelines} remaining
                            </span>
                        </div>

                        {/* Suggestion display */}
                        {coachSuggestion ? (
                            <>
                                <p style={{ margin: "0 0 2px", fontSize: 15, color: "#4ade80", fontWeight: "bold" }}>
                                    Suggested: <b>{coachSuggestion.move}</b>
                                </p>
                                <p style={{ margin: "0 0 6px", fontSize: 11, color: "#facc15" }}>
                                    {coachSuggestion.evaluation}
                                </p>
                                <p style={{ margin: "0 0 10px", fontSize: 12, color: "#d1d5db", fontStyle: "italic" }}>
                                    "{coachSuggestion.reason}"
                                </p>
                                {coachSuggestion.top_moves?.length > 0 && (
                                    <p style={{ margin: "0 0 10px", fontSize: 11, color: "#888" }}>
                                        Alternatives: {coachSuggestion.top_moves.join(", ")}
                                    </p>
                                )}
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        onClick={() => { sendMove(coachSuggestion.move); setCoachSuggestion(null); }}
                                        style={{ ...btnStyle("#4ade80", "#000"), flex: 1 }}
                                    >
                                        ✅ Accept
                                    </button>
                                    <button
                                        onClick={() => setCoachSuggestion(null)}
                                        style={{ ...btnStyle("#374151"), flex: 1 }}
                                    >
                                        ❌ Reject
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={requestCoach}
                                disabled={coachLifelines <= 0 || !isMyTurn}
                                style={btnStyle(
                                    coachLifelines > 0 && isMyTurn ? "#4ade80" : "#374151",
                                    "#000"
                                )}
                            >
                                Ask Coach
                            </button>
                        )}
                    </div>
                )}

                {/* Draw offer */}
                {drawOffered && (
                    <div style={cardStyle("#1a1a1a", "#facc15")}>
                        <p style={{ margin: "0 0 8px", fontSize: 13 }}>Opponent offers a draw</p>
                        <button onClick={acceptDraw} style={btnStyle("#facc15", "#000")}>Accept Draw</button>
                    </div>
                )}

                {/* Post game analysis */}
                {status === "game_over" && (
                    <div style={cardStyle("#1a1a1a", "#333")}>
                        <button
                            onClick={fetchAnalysis}
                            disabled={loadingAnalysis}
                            style={btnStyle("#7c3aed")}
                        >
                            {loadingAnalysis ? "⏳ Analysing..." : "🤖 Get AI Analysis"}
                        </button>
                        {analysisText && (
                            <div style={{
                                marginTop: 12,
                                fontSize: 12,
                                lineHeight: 1.8,
                                whiteSpace: "pre-wrap",
                                color: "#d1d5db",
                                maxHeight: 400,
                                overflowY: "auto"
                            }}>
                                {analysisText}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div >
    );
}

function btnStyle(bg, color = "#fff") {
    return {
        background: bg,
        color,
        border: "none",
        borderRadius: "10px",
        padding: "10px 20px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
        fontFamily: "'Inter', sans-serif",
        width: "100%",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
    };
}

function cardStyle(bg, borderColor) {
    return {
        background: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    };
}