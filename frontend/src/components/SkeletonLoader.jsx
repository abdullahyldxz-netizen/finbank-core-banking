export default function SkeletonLoader({ type = "card", count = 3 }) {
    const base = {
        background: "linear-gradient(90deg, var(--bg-secondary) 25%, var(--border-color) 37%, var(--bg-secondary) 63%)",
        backgroundSize: "400% 100%",
        animation: "shimmer 1.4s ease infinite",
        borderRadius: 12,
    };

    if (type === "text") {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 4 }}>
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} style={{ ...base, height: 14, width: `${80 - i * 15}%` }} />
                ))}
                <style>{shimmerCSS}</style>
            </div>
        );
    }

    if (type === "table") {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "12px 0" }}>
                        <div style={{ ...base, width: 40, height: 40, borderRadius: 10 }} />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ ...base, height: 14, width: "60%" }} />
                            <div style={{ ...base, height: 10, width: "35%" }} />
                        </div>
                        <div style={{ ...base, height: 18, width: 80 }} />
                    </div>
                ))}
                <style>{shimmerCSS}</style>
            </div>
        );
    }

    // Default: card
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} style={{
                    background: "var(--bg-card)", borderRadius: 18, padding: 22,
                    border: "1px solid var(--border-color)",
                }}>
                    <div style={{ ...base, width: 44, height: 44, marginBottom: 14, borderRadius: 12 }} />
                    <div style={{ ...base, height: 12, width: "50%", marginBottom: 8 }} />
                    <div style={{ ...base, height: 22, width: "70%" }} />
                </div>
            ))}
            <style>{shimmerCSS}</style>
        </div>
    );
}

const shimmerCSS = `@keyframes shimmer { 0% { background-position: -400% 0; } 100% { background-position: 400% 0; } }`;
