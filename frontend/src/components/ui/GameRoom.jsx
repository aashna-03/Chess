export default function GameRoom({ roomId, myColor, mode, opponentConnected }) {
    return (
        <div style={{ padding: 16, background: "#1a1a1a", borderRadius: 8, border: "1px solid #333" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#888" }}>
                Room: <b style={{ color: "#fff" }}>{roomId}</b>
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                You are: <b style={{ color: myColor === "white" ? "#f0f0f0" : "#aaa" }}>{myColor}</b>
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>
                Mode: <b style={{ color: "#7c3aed" }}>{mode}</b>
            </p>
            {!opponentConnected && (
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "#facc15" }}>
                    ⏳ Share this room ID with your opponent: <b>{roomId}</b>
                </p>
            )}
        </div>
    );
}