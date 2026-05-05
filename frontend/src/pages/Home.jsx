import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Layout Styles
const containerStyle = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "60px 20px",
    background: "radial-gradient(circle at 50% 0%, #1e1b4b 0%, #050505 50%)",
    position: "relative",
};

const heroStyle = {
    textAlign: "center",
    marginBottom: "56px",
    maxWidth: "600px",
    zIndex: 1,
};

const titleStyle = {
    fontSize: "clamp(48px, 8vw, 72px)",
    fontWeight: "900",
    margin: "0 0 12px",
    background: "linear-gradient(to bottom, #fff 30%, #a78bfa 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-2px",
    filter: "drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))",
};

const subtitleStyle = {
    fontSize: "18px",
    color: "#94a3b8",
    lineHeight: "1.6",
    fontWeight: "500",
};

const mainContentStyle = {
    display: "flex",
    gap: "32px",
    width: "100%",
    maxWidth: "1100px",
    flexWrap: "wrap",
    justifyContent: "center",
    zIndex: 1,
};

const createCardStyle = {
    flex: "1 1 500px",
    maxWidth: "600px",
};

const rightColumnStyle = {
    flex: "1 1 350px",
    display: "flex",
    flexDirection: "column",
    gap: "32px",
    maxWidth: "400px",
};

const joinCardStyle = {
    padding: "28px",
};

const scoutCardStyle = {
    padding: "28px",
};

const sectionTitleStyle = {
    fontSize: "22px",
    fontWeight: "800",
    margin: "0 0 24px",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "10px",
};

const labelStyle = {
    fontSize: "11px",
    color: "#6366f1",
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    fontWeight: "700",
    margin: "0 0 12px",
};

const scoutResultStyle = {
    marginTop: "20px",
    padding: "20px",
    background: "rgba(0,0,0,0.4)",
    borderRadius: "12px",
    border: "1px solid rgba(139, 92, 246, 0.2)",
};

const BOARD_STYLES = [
    { id: "default", name: "Default (Green/White)", colors: { dark: "#779556", light: "#ebecd0" } },
    { id: "wooden", name: "Classic Wood", colors: { dark: "#b58863", light: "#f0d9b5" } },
    { id: "violet", name: "Violet White", colors: { dark: "#7d4a8d", light: "#e2e2e2" } },
    { id: "blue", name: "Deep Blue", colors: { dark: "#4b7399", light: "#dee3e6" } },
    { id: "burgandy", name: "Burgandy", colors: { dark: "#8b3a3a", light: "#e8e0d5" } },
];

const TIME_CONTROLS = [
    { id: "unlimited", name: "Unlimited", time: null },
    { id: "bullet", name: "Bullet (1+0)", time: 60 },
    { id: "blitz", name: "Blitz (3+2)", time: 180 },
    { id: "rapid", name: "Rapid (10+5)", time: 600 },
];

const PIECES = ["♟", "♞", "♝", "♜", "♛", "♚", "♙", "♘", "♗", "♖", "♕", "♔"];

function FloatingPiece({ piece, style }) {
    return (
        <span style={{
            position: "absolute",
            fontSize: "clamp(32px, 5vw, 64px)",
            color: "rgba(255,255,255,0.03)",
            userSelect: "none",
            pointerEvents: "none",
            animation: `floatPiece ${style.duration}s ease-in-out infinite`,
            animationDelay: `${style.delay}s`,
            left: `${style.x}%`,
            top: `${style.y}%`,
            zIndex: 0,
        }}>
            {piece}
        </span>
    );
}

const BG_PIECES = Array.from({ length: 12 }, (_, i) => ({
    piece: PIECES[i % PIECES.length],
    style: {
        x: (i * 17 + 5) % 90,
        y: (i * 23 + 10) % 80,
        duration: 10 + (i % 3) * 5,
        delay: -(i * 2),
    },
}));

export default function Home() {
    const [joinId, setJoinId] = useState("");
    const [loading, setLoading] = useState(false);

    // Room Configuration
    const [selectedMode, setSelectedMode] = useState("classic");
    const [selectedBoard, setSelectedBoard] = useState("default");
    const [selectedTime, setSelectedTime] = useState("unlimited");

    // Scout state
    const [scoutInput, setScoutInput] = useState("");
    const [scoutPlatform, setScoutPlatform] = useState("lichess");
    const [scoutReport, setScoutReport] = useState(null);
    const [scoutLoading, setScoutLoading] = useState(false);
    const [scoutError, setScoutError] = useState("");

    const navigate = useNavigate();

    const createRoom = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                mode: selectedMode,
                board_style: selectedBoard,
                time_control: selectedTime
            });
            const res = await fetch(`${API_URL}/game/create?${params.toString()}`, {
                method: "POST",
            });
            const data = await res.json();
            navigate(`/game/${data.room_id}`);
        } catch (err) {
            alert("Could not connect to server. Make sure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const joinRoom = () => {
        if (joinId.trim()) navigate(`/game/${joinId.trim().toUpperCase()}`);
    };

    const scoutPlayer = async () => {
        if (!scoutInput.trim()) return;
        setScoutLoading(true);
        setScoutError("");
        setScoutReport(null);
        try {
            const endpoint = scoutPlatform === "chesscom"
                ? `${API_URL}/chesscom/scout`
                : `${API_URL}/lichess/scout`;

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url_or_username: scoutInput.trim() }),
            });
            if (!res.ok) {
                setScoutError("Player not found. Check the username or URL.");
                return;
            }
            const data = await res.json();
            setScoutReport(data);
        } catch {
            setScoutError("Could not connect to server.");
        } finally {
            setScoutLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            {BG_PIECES.map((p, i) => (
                <FloatingPiece key={i} piece={p.piece} style={p.style} />
            ))}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                
                body {
                    margin: 0;
                    background: #050505;
                    font-family: 'Inter', sans-serif;
                    color: #fff;
                    overflow-x: hidden;
                }

                @keyframes floatPiece {
                    0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.02; }
                    50% { transform: translateY(-40px) rotate(10deg); opacity: 0.05; }
                }

                .glass-card {
                    background: rgba(13, 13, 18, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(139, 92, 246, 0.15);
                    border-radius: 20px;
                    padding: 32px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
                }

                .btn-primary {
                    background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
                    color: #fff;
                    border: none;
                    border-radius: 10px;
                    padding: 14px 24px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
                    filter: brightness(1.1);
                }

                .btn-outline {
                    background: transparent;
                    border: 1px solid rgba(139, 92, 246, 0.3);
                    color: #a78bfa;
                    border-radius: 10px;
                    padding: 12px 20px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-outline:hover {
                    background: rgba(139, 92, 246, 0.1);
                    border-color: #8b5cf6;
                    color: #fff;
                }

                .input-field {
                    background: #0a0a0c;
                    border: 1px solid #1a1a24;
                    border-radius: 10px;
                    padding: 14px 16px;
                    color: #fff;
                    font-size: 14px;
                    transition: all 0.2s;
                }

                .input-field:focus {
                    outline: none;
                    border-color: #8b5cf6;
                    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
                }

                .selection-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .select-item {
                    background: #0f0f15;
                    border: 1px solid #1a1a24;
                    border-radius: 10px;
                    padding: 12px;
                    text-align: center;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    color: #888;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .select-item:hover {
                    border-color: rgba(139, 92, 246, 0.5);
                    color: #fff;
                }

                .select-item.active {
                    border-color: #8b5cf6;
                    background: rgba(139, 92, 246, 0.15);
                    color: #fff;
                    box-shadow: inset 0 0 10px rgba(139, 92, 246, 0.1);
                }

                .mode-selector {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 28px;
                }

                .mode-btn {
                    flex: 1;
                    padding: 14px;
                    border-radius: 10px;
                    border: 1px solid #1a1a24;
                    background: #0f0f15;
                    color: #777;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }

                .mode-btn:hover {
                    border-color: rgba(139, 92, 246, 0.5);
                }

                .mode-btn.active {
                    background: #8b5cf6;
                    color: #fff;
                    border-color: #8b5cf6;
                    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
                }

                @media (max-width: 600px) {
                    .glass-card {
                        padding: 24px;
                    }
                    .mode-selector {
                        flex-direction: column;
                    }
                }
            `}</style>

            <div style={heroStyle}>
                <h1 style={titleStyle}>

                    Gambit AI
                </h1>
                <p style={subtitleStyle}>A little guidance to help you play smarter every move</p>
            </div>

            <main style={mainContentStyle}>
                {/* Create Room Section */}
                <div className="glass-card" style={createCardStyle}>
                    <h2 style={sectionTitleStyle}>Create a Room</h2>

                    <p style={labelStyle}>Game Mode</p>
                    <div className="mode-selector">
                        <button
                            className={`mode-btn ${selectedMode === "classic" ? "active" : ""}`}
                            onClick={() => setSelectedMode("classic")}
                        >
                            ♟ Classic
                        </button>
                        <button
                            className={`mode-btn ${selectedMode === "coach" ? "active" : ""}`}
                            onClick={() => setSelectedMode("coach")}
                        >
                            🎓 AI Coach
                        </button>
                        <button
                            className={`mode-btn ${selectedMode === "dice" ? "active" : ""}`}
                            onClick={() => setSelectedMode("dice")}
                        >
                            🎲 Dice
                        </button>
                    </div>

                    <p style={labelStyle}>Board Style</p>
                    <div className="selection-grid">
                        {BOARD_STYLES.map(style => (
                            <div
                                key={style.id}
                                className={`select-item ${selectedBoard === style.id ? "active" : ""}`}
                                onClick={() => setSelectedBoard(style.id)}
                            >
                                <div style={{
                                    width: "20px",
                                    height: "20px",
                                    background: style.colors.dark,
                                    margin: "0 auto 6px",
                                    borderRadius: "4px"
                                }} />
                                {style.name}
                            </div>
                        ))}
                    </div>

                    <p style={labelStyle}>Time Control</p>
                    <div className="selection-grid">
                        {TIME_CONTROLS.map(control => (
                            <div
                                key={control.id}
                                className={`select-item ${selectedTime === control.id ? "active" : ""}`}
                                onClick={() => setSelectedTime(control.id)}
                            >
                                {control.name}
                            </div>
                        ))}
                    </div>

                    <button className="btn-primary" onClick={createRoom} disabled={loading} style={{ width: "100%", marginTop: "10px" }}>
                        {loading ? "Creating..." : "Start Game"}
                    </button>
                </div>

                <div style={rightColumnStyle}>
                    {/* Join Room Section */}
                    <div className="glass-card" style={joinCardStyle}>
                        <h2 style={sectionTitleStyle}>Join Room</h2>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input
                                className="input-field"
                                value={joinId}
                                onChange={(e) => setJoinId(e.target.value)}
                                placeholder="Enter Room ID"
                                style={{ flex: 1 }}
                            />
                            <button className="btn-primary" onClick={joinRoom}>Join</button>
                        </div>
                    </div>

                    {/* Scout Section */}
                    <div className="glass-card" style={scoutCardStyle}>
                        <h2 style={sectionTitleStyle}>Scout Opponent</h2>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                            <select
                                className="input-field"
                                value={scoutPlatform}
                                onChange={(e) => setScoutPlatform(e.target.value)}
                                style={{ width: "100px" }}
                            >
                                <option value="lichess">Lichess</option>
                                <option value="chesscom">Chess.com</option>
                            </select>
                            <input
                                className="input-field"
                                value={scoutInput}
                                onChange={(e) => setScoutInput(e.target.value)}
                                placeholder="Username"
                                style={{ flex: 1 }}
                            />
                            <button className="btn-outline" onClick={scoutPlayer} disabled={scoutLoading}>
                                {scoutLoading ? "..." : "Scout"}
                            </button>
                        </div>

                        {scoutError && <p style={{ color: "#ef4444", fontSize: "12px" }}>{scoutError}</p>}

                        {scoutReport && (
                            <div style={scoutResultStyle}>
                                <h3 style={{ margin: "0 0 8px", fontSize: "16px" }}>@{scoutReport.username}</h3>
                                <div style={{ fontSize: "12px", color: "#aaa", lineHeight: "1.6" }}>
                                    {scoutReport.report}
                                </div>
                            </div>
                        )}
                    </div>

                    <p style={{ textAlign: "center", color: "#334155", fontSize: "12px", marginTop: "40px", fontWeight: "500" }}>
                        Shared Room ID is required for your opponent to join.
                    </p>


                </div>
            </main>

            <p> Developed by Aashna Ferrao. All rights reserved. 2026</p>

        </div>
    );
}