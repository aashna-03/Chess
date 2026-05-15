import { useState, useEffect } from "react";
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
    const navigate = useNavigate();

    const [appLoading, setAppLoading] = useState(true);
    const [joinId, setJoinId] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState("");
    const [selectedMode, setSelectedMode] = useState("classic");
    const [selectedBoard, setSelectedBoard] = useState("default");
    const [selectedTime, setSelectedTime] = useState("unlimited");
    const [scoutInput, setScoutInput] = useState("");
    const [scoutPlatform, setScoutPlatform] = useState("lichess");
    const [scoutReport, setScoutReport] = useState(null);
    const [scoutLoading, setScoutLoading] = useState(false);
    const [scoutError, setScoutError] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setAppLoading(false), 2200);
        return () => clearTimeout(timer);
    }, []);


    const createRoom = async () => {
        setLoading(true);
        setToast("⏳ Waking up server... please wait up to 30 seconds on first load.");
        try {
            const params = new URLSearchParams({
                mode: selectedMode,
                board_style: selectedBoard,
                time_control: selectedTime,
            });
            const res = await fetch(`${API_URL}/game/create?${params.toString()}`, {
                method: "POST",
            });
            const data = await res.json();
            setToast("");
            navigate(`/game/${data.room_id}`);
        } catch (err) {
            setToast("❌ Could not connect. Please try again in a few seconds.");
            setTimeout(() => setToast(""), 5000);
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

    if (appLoading) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "radial-gradient(circle at 70% 0%, #ce8ff3ff 0%, #050505 60%)",
                gap: "28px",
            }}>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;900&display=swap');
                    @keyframes pawnBounce {
                        0%, 100% { transform: translateY(0px) scale(1); }
                        40% { transform: translateY(-38px) scale(1.08); }
                        55% { transform: translateY(-38px) scale(1.08); }
                        80% { transform: translateY(0px) scale(0.95); }
                    }
                    @keyframes shadowPulse {
                        0%, 100% { transform: scaleX(1); opacity: 0.35; }
                        50% { transform: scaleX(0.45); opacity: 0.1; }
                    }
                    @keyframes fadeInLoader {
                        from { opacity: 0; transform: scale(0.92); }
                        to   { opacity: 1; transform: scale(1); }
                    }
                    @keyframes dotPulse {
                        0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
                        40% { opacity: 1; transform: scale(1.2); }
                    }
                    .loader-wrap {
                        animation: fadeInLoader 0.5s ease both;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 28px;
                    }
                    .pawn-symbol {
                        font-size: 80px;
                        animation: pawnBounce 1.1s cubic-bezier(0.4,0,0.2,1) infinite;
                        filter: drop-shadow(0 0 24px rgba(139,92,246,0.7));
                        display: block;
                    }
                    .pawn-shadow {
                        width: 54px;
                        height: 10px;
                        background: rgba(139,92,246,0.35);
                        border-radius: 50%;
                        filter: blur(4px);
                        animation: shadowPulse 1.1s cubic-bezier(0.4,0,0.2,1) infinite;
                        margin-top: -18px;
                    }
                    .loader-title {
                        font-family: 'Inter', sans-serif;
                        font-size: 36px;
                        font-weight: 900;
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        letter-spacing: -1.5px;
                        margin: 0;
                    }
                    .loader-dots {
                        display: flex;
                        gap: 8px;
                        align-items: center;
                    }
                    .loader-dots span {
                        width: 9px;
                        height: 10px;
                        background: #faf8ffff;
                        border-radius: 50%;
                        display: inline-block;
                        animation: dotPulse 1.2s ease-in-out infinite;
                    }
                    .loader-dots span:nth-child(2) { animation-delay: 0.2s; }
                    .loader-dots span:nth-child(3) { animation-delay: 0.4s; }
                `}</style>
                <div className="loader-wrap">
                    <span className="pawn-symbol">♟</span>
                    <div className="pawn-shadow" />
                    <p className="loader-title">Gambit AI</p>
                    <div className="loader-dots">
                        <span /><span /><span />
                    </div>
                </div>
            </div>
        );
    }

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

                /* Hide scrollbar on mobile */
                @media (max-width: 768px) {
                    html, body {
                        overflow-x: hidden;
                        scrollbar-width: none;
                    }
                    html::-webkit-scrollbar, body::-webkit-scrollbar {
                        display: none;
                    }
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
                    font-family: 'Inter', sans-serif;
                    font-size: 14px;
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
                    filter: brightness(1.1);
                }

                .btn-outline {
                    background: fill;
                    border: 1px solid rgba(139, 92, 246, 0.3);
                    color: #a78bfa;
                    border-radius: 10px;
                    padding: 12px 20px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: 'Inter', sans-serif;
                }

                .btn-outline:hover {
                    background: rgba(163, 15, 220, 0.1);
                    border-color: #8b5cf6;
                    color: #f4f4f4ff;
                }

                .input-field {
                    background: transparent;
                    border: 1px solid #1a1a24;
                    border-radius: 10px;
                    padding: 14px 16px;
                    color: #fff;
                    font-size: 14px;
                    transition: all 0.2s;
                    font-family: 'Inter', sans-serif;
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
                    font-family: 'Inter', sans-serif;
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

            {/* Toast — centered on screen */}
            {toast && (
                <div style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "rgba(15, 12, 30, 0.96)",
                    border: "1px solid rgba(139,92,246,0.5)",
                    color: "#e9d5ff",
                    padding: "20px 36px",
                    borderRadius: 16,
                    fontSize: 15,
                    fontWeight: 600,
                    zIndex: 99999,
                    textAlign: "center",
                    maxWidth: "80vw",
                    boxShadow: "0 8px 40px rgba(139,92,246,0.35), 0 2px 12px rgba(0,0,0,0.8)",
                    backdropFilter: "blur(16px)",
                    letterSpacing: "0.2px",
                    lineHeight: "1.5",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    animation: "toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
                }}>
                    <span style={{ fontSize: 24 }}>♟</span>
                    {toast}
                </div>
            )}
            <style>{`
                @keyframes toastIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
                    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            `}</style>

            {/* Hero */}
            <div style={heroStyle}>
                <h1 style={titleStyle}>Gambit AI</h1>

            </div>

            <main style={mainContentStyle}>
                {/* Create Room */}
                <div className="glass-card" style={createCardStyle}>
                    <h2 style={sectionTitleStyle}>Create a Room</h2>

                    <p style={labelStyle}>Game Mode</p>
                    <div className="mode-selector">
                        {[
                            { id: "classic", label: "♟ Classic" },
                            { id: "coach", label: "🎓 AI Coach" },
                            { id: "dice", label: "🎲 Dice" },
                        ].map(m => (
                            <button
                                key={m.id}
                                className={`mode-btn ${selectedMode === m.id ? "active" : ""}`}
                                onClick={() => setSelectedMode(m.id)}
                            >
                                {m.label}
                            </button>
                        ))}
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

                    <button
                        className="btn-primary"
                        onClick={createRoom}
                        disabled={loading}
                        style={{ width: "100%", marginTop: "10px" }}
                    >
                        {loading ? "Creating..." : "Start Game"}
                    </button>
                </div>

                {/* Right Column */}
                <div style={rightColumnStyle}>
                    {/* Join Room */}
                    <div className="glass-card" style={joinCardStyle}>
                        <h2 style={sectionTitleStyle}>Join Room</h2>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <input
                                className="input-field"
                                value={joinId}
                                onChange={(e) => setJoinId(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                                placeholder="Enter Room ID"
                                style={{ flex: 1 }}
                            />
                            <button className="btn-primary" onClick={joinRoom}>Join</button>
                        </div>
                    </div>

                    {/* Scout */}
                    <div className="glass-card" style={scoutCardStyle}>
                        <h2 style={sectionTitleStyle}>Scout Opponent</h2>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                            <select
                                className="input-field"
                                value={scoutPlatform}
                                onChange={(e) => setScoutPlatform(e.target.value)}
                                style={{ width: "120px" }}
                            >
                                <option value="lichess">Lichess</option>
                                <option value="chesscom">Chess.com</option>
                            </select>
                            <input
                                className="input-field"
                                value={scoutInput}
                                onChange={(e) => setScoutInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && scoutPlayer()}
                                placeholder="Username or URL"
                                style={{ flex: 1 }}
                            />
                        </div>
                        <button
                            className="btn-outline"
                            onClick={scoutPlayer}
                            disabled={scoutLoading}
                            style={{ width: "100%", marginBottom: "16px", padding: "13px" }}
                        >
                            {scoutLoading ? "⏳ Scouting..." : "🔍 Scout Opponent"}
                        </button>

                        {scoutError && (
                            <p style={{ color: "#ef4444", fontSize: "12px", margin: "0 0 8px" }}>
                                {scoutError}
                            </p>
                        )}

                        {scoutReport && (
                            <div style={scoutResultStyle}>
                                <h3 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                                    @{scoutReport.username}
                                </h3>
                                <div style={{ fontSize: "12px", color: "#fffefeff", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
                                    {scoutReport.report}
                                </div>
                            </div>
                        )}
                    </div>

                    <p style={{ textAlign: "center", color: "#e8e8e8ff", fontSize: "12px", marginTop: "8px", fontWeight: "500" }}>
                        Share the Room ID with your opponent to join.
                    </p>
                </div>
            </main>

            <p style={{ color: "#eff0f1ff", fontSize: "16px", marginTop: "48px" }}>
                Developed by Aashna Ferrao. All rights reserved.
            </p>
        </div>
    );
}