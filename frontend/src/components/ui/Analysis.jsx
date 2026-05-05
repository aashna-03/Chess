export default function Analysis({ text, loading, onFetch }) {
    return (
        <div style={{ padding: 16, background: "#1a1a1a", borderRadius: 8, border: "1px solid #333" }}>
            <button
                onClick={onFetch}
                disabled={loading}
                style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", width: "100%" }}
            >
                {loading ? "Analysing..." : "Get AI Analysis"}
            </button>
            {text && (
                <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "#d1d5db" }}>
                    {text}
                </div>
            )}
        </div>
    );
}