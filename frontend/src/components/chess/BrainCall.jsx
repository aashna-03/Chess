export default function BrainCall({ brainCall }) {
    if (!brainCall) return null;
    return (
        <div style={{ padding: 16, background: "#1a1a1a", borderRadius: 8, border: "1px solid #0891b2" }}>
            <p style={{ margin: 0, color: "#888", fontSize: 12 }}>Gemini says move a:</p>
            <p style={{ margin: "4px 0 0", fontSize: 24, color: "#fff" }}>
                {brainCall.piece}
            </p>
        </div>
    );
}