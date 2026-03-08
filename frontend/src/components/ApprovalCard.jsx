import { useState, useRef } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { useSwipe } from "../hooks/useSwipe";

export default function ApprovalCard({ request, onApprove, onReject, isCeo }) {
    const { handlers, swiping, offset } = useSwipe({
        onSwipedLeft: () => onReject(request.id),
        onSwipedRight: () => onApprove(request.id),
        threshold: 80
    });

    const isHoveringRight = offset > 40;
    const isHoveringLeft = offset < -40;

    return (
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, marginBottom: 12, border: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>

            {/* Background actions revealed on swipe */}
            <div style={{
                position: "absolute", inset: 0,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0 20px",
                background: isHoveringRight ? "var(--success)" : isHoveringLeft ? "var(--danger)" : "var(--border-color)",
                color: "#fff", transition: "background 0.3s ease",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: offset > 0 ? 1 : 0, transition: "opacity 0.2s" }}>
                    <CheckCircle /> Onayla
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: offset < 0 ? 1 : 0, transition: "opacity 0.2s" }}>
                    Reddet <XCircle />
                </div>
            </div>

            {/* Foreground Card */}
            <div
                {...handlers}
                style={{
                    position: "relative", zIndex: 10,
                    background: "var(--bg-secondary)",
                    transform: `translateX(${offset}px)`,
                    transition: swiping ? "none" : "transform 0.3s ease",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "16px 20px", flexWrap: "wrap", gap: 12,
                    borderLeft: `4px solid ${request.risk_score === "HIGH" ? "var(--danger)" : request.risk_score === "MEDIUM" ? "var(--warning)" : "var(--success)"}`
                }}
            >
                <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
                            {request.request_type.replace(/_/g, " ")}
                        </div>
                        <span style={{
                            padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                            background: request.risk_score === "HIGH" ? "rgba(239,68,68,0.15)" : request.risk_score === "MEDIUM" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
                            color: request.risk_score === "HIGH" ? "#ef4444" : request.risk_score === "MEDIUM" ? "#f59e0b" : "#10b981"
                        }}>
                            Risk: {request.risk_score}
                        </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
                        <strong>Müşteri:</strong> {request.user_name || request.user_id}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                        <strong>Tutar:</strong> ₺{request.amount?.toLocaleString("tr-TR")} | <strong>Açıklama:</strong> {request.description || "-"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, display: "none" }} className="swipe-hint">
                        💡 İşlem için sağa (onayla) veya sola (reddet) kaydırın
                    </div>
                </div>

                <div style={{ display: "flex", gap: 8 }} className="desktop-actions">
                    <button
                        onClick={() => onApprove(request.id)}
                        style={{
                            padding: "8px 16px", borderRadius: 10, border: "none",
                            background: "linear-gradient(135deg, #10b981, #34d399)",
                            color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer"
                        }}
                    >
                        {isCeo ? "Nihai Onay Ver" : "CEO'ya İlet"}
                    </button>
                    <button
                        onClick={() => onReject(request.id)}
                        style={{
                            padding: "8px 16px", borderRadius: 10, border: "none",
                            background: "linear-gradient(135deg, #ef4444, #f87171)",
                            color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer"
                        }}
                    >
                        Reddet
                    </button>
                </div>
            </div>
            {/* Some CSS for mobile swipe hint vs desktop buttons */}
            <style>{`
                @media (max-width: 768px) {
                    .desktop-actions { display: none !important; }
                    .swipe-hint { display: block !important; }
                }
            `}</style>
        </div>
    );
}
