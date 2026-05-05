export default function DiceRoller({ diceRoll, onRoll }) {
    return (
        <div style={{ padding: 16, background: "#1a1a1a", borderRadius: 8, border: "1px solid #7c3aed" }}>
            <p style={{ margin: 0, color: "#888", fontSize: 12 }}>Dice Roll</p>
            {diceRoll ? (
                <p style={{ margin: "4px 0 0", fontSize: 24, color: "#fff" }}>
                    Move a {diceRoll.piece}
                </p>
            ) : (
                <button onClick={onRoll} style={{ marginTop: 8, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer" }}>
                    Roll Dice
                </button>
            )}
        </div>
    );
}