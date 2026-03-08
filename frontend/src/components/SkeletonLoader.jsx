import React from "react";

export function Skeleton({ width, height, borderRadius = 8, style = {} }) {
    return (
        <div style={{
            width, height, borderRadius,
            background: "linear-gradient(90deg, var(--bg-secondary) 25%, var(--border-color) 50%, var(--bg-secondary) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s infinite",
            ...style
        }}>
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div style={{ padding: 16, border: "1px solid var(--border-color)", borderRadius: 12, marginBottom: 16, background: "var(--bg-secondary)" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                <Skeleton width={40} height={40} borderRadius="50%" />
                <div style={{ flex: 1 }}>
                    <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
                    <Skeleton width="40%" height={10} />
                </div>
            </div>
            <Skeleton width="100%" height={24} borderRadius={8} style={{ marginBottom: 12 }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Skeleton width="30%" height={32} borderRadius={8} />
                <Skeleton width="30%" height={32} borderRadius={8} />
            </div>
        </div>
    );
}

export function ListSkeleton({ count = 3 }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </>
    );
}
