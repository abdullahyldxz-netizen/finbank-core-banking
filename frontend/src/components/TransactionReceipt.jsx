import React from "react";

export default function TransactionReceipt({ transaction, onPreviewClose }) {
    if (!transaction) return null;

    const handlePrint = () => {
        window.print();
    };

    const fmtCurrency = (val) =>
        new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val || 0);

    const isPositive = transaction.type === "deposit" || transaction.amount > 0;

    return (
        <div className="receipt-overlay">
            {/* Action Bar (Not visible when printing) */}
            <div className="receipt-actions no-print">
                <button onClick={handlePrint} className="receipt-btn primary">
                    Yazdır / PDF Kaydet
                </button>
                <button onClick={onPreviewClose} className="receipt-btn secondary">
                    Kapat
                </button>
            </div>

            {/* A4 Paper Container */}
            <div className="receipt-paper">
                <div className="receipt-header">
                    <div className="receipt-logo">
                        <span className="logo-icon">👑</span>
                        <div className="logo-text">
                            <h1>FinBank</h1>
                            <span>A.Ş.</span>
                        </div>
                    </div>
                    <div className="receipt-meta">
                        <h2>İŞLEM DEKONTU</h2>
                        <div className="meta-line">
                            <span>Tarih:</span>
                            <strong>
                                {transaction.created_at
                                    ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(new Date(transaction.created_at))
                                    : "Bilinmiyor"}
                            </strong>
                        </div>
                        <div className="meta-line">
                            <span>İşlem No:</span>
                            <strong>{transaction.transaction_ref || transaction.id || transaction.entry_id || "Bkz. Liste"}</strong>
                        </div>
                    </div>
                </div>

                <div className="receipt-body">
                    <div className="receipt-section">
                        <h3>İşlem Detayları</h3>
                        <table className="receipt-table">
                            <tbody>
                                <tr>
                                    <td>İşlem Tipi</td>
                                    <td>
                                        {transaction.type === "deposit" ? "Para Yatırma / Gelen Transfer" : ""}
                                        {transaction.type === "withdrawal" ? "Para Çekme / Giden Transfer" : ""}
                                        {transaction.type === "transfer" ? "Havale / EFT" : ""}
                                        {transaction.type === "payment" ? "Fatura Ödemesi" : ""}
                                        {!["deposit", "withdrawal", "transfer", "payment"].includes(transaction.type) && (transaction.type || "İşlem")}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Kategori</td>
                                    <td style={{ textTransform: "capitalize" }}>{transaction.category || "-"}</td>
                                </tr>
                                <tr>
                                    <td>Hesap / Kaynak</td>
                                    <td>{transaction.account_id || "Sistem Geneli"}</td>
                                </tr>
                                <tr>
                                    <td>Açıklama</td>
                                    <td>{transaction.description || "Açıklama bulunmuyor."}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="receipt-amount-box">
                        <div className="amount-label">İşlem Tutarı</div>
                        <div className={`amount-value ${isPositive ? "text-green" : "text-red"}`}>
                            {isPositive ? "+" : "-"} {fmtCurrency(Math.abs(transaction.amount))}
                        </div>
                    </div>

                    <div className="receipt-footer">
                        <p>Bu belge FinBank A.Ş. elektronik bankacılık sistemleri tarafından üretilmiştir.</p>
                        <p>Mali değeri yoktur, bilgilendirme amaçlıdır.</p>
                        <div className="footer-signature">
                            <div className="sig-line"></div>
                            <span>Finansal Operasyonlar Merkezi</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                /* Overlay for the modal */
                .receipt-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 40px;
                    overflow-y: auto;
                    backdrop-filter: blur(4px);
                }

                /* Actions bar */
                .receipt-actions {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .receipt-btn {
                    padding: 10px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    font-size: 14px;
                    transition: all 0.2s;
                }

                .receipt-btn.primary {
                    background: #d4af37;
                    color: #000;
                }
                
                .receipt-btn.primary:hover {
                    background: #f1cf5b;
                }

                .receipt-btn.secondary {
                    background: #334155;
                    color: #fff;
                }

                .receipt-btn.secondary:hover {
                    background: #475569;
                }

                /* A4 Paper Configuration */
                .receipt-paper {
                    background: #ffffff;
                    width: 210mm;
                    min-height: 297mm;
                    padding: 20mm;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    color: #1e293b;
                    font-family: 'Inter', system-ui, sans-serif;
                    position: relative;
                }

                /* Header */
                .receipt-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 24px;
                    margin-bottom: 32px;
                }

                .receipt-logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .logo-icon {
                    font-size: 32px;
                }

                .logo-text h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: -0.5px;
                }

                .logo-text span {
                    font-size: 11px;
                    color: #64748b;
                    letter-spacing: 1px;
                }

                .receipt-meta h2 {
                    margin: 0 0 12px 0;
                    font-size: 20px;
                    font-weight: 700;
                    color: #0f172a;
                    text-align: right;
                }

                .meta-line {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    font-size: 12px;
                    margin-bottom: 4px;
                }

                .meta-line span {
                    color: #64748b;
                }

                /* Body */
                .receipt-section {
                    margin-bottom: 40px;
                }

                .receipt-section h3 {
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #64748b;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 8px;
                    margin-bottom: 16px;
                }

                .receipt-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .receipt-table td {
                    padding: 12px 0;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 14px;
                }

                .receipt-table td:first-child {
                    color: #64748b;
                    width: 40%;
                }

                .receipt-table td:last-child {
                    font-weight: 600;
                    color: #0f172a;
                }

                /* Amount Box */
                .receipt-amount-box {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 24px;
                    text-align: right;
                    margin-bottom: 60px;
                }

                .amount-label {
                    font-size: 13px;
                    color: #64748b;
                    margin-bottom: 8px;
                }

                .amount-value {
                    font-size: 32px;
                    font-weight: 800;
                    letter-spacing: -1px;
                }

                .text-green { color: #16a34a; }
                .text-red { color: #dc2626; }

                /* Footer */
                .receipt-footer {
                    margin-top: auto;
                    text-align: center;
                    font-size: 11px;
                    color: #94a3b8;
                    position: absolute;
                    bottom: 20mm;
                    left: 20mm;
                    right: 20mm;
                }

                .receipt-footer p {
                    margin: 4px 0;
                }

                .footer-signature {
                    margin-top: 40px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .sig-line {
                    width: 200px;
                    border-top: 1px solid #cbd5e1;
                    margin-bottom: 8px;
                }

                /* Print Styles */
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .no-print, .no-print * {
                        display: none !important;
                    }
                    .receipt-overlay {
                        position: absolute;
                        left: 0;
                        top: 0;
                        padding: 0;
                        background: none;
                        backdrop-filter: none;
                    }
                    .receipt-paper {
                        visibility: visible;
                        box-shadow: none;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        position: absolute;
                        left: 0;
                        top: 0;
                    }
                    .receipt-paper * {
                        visibility: visible;
                    }
                    /* Ensure colors print correctly */
                    .receipt-amount-box {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        background-color: #f8fafc !important;
                    }
                }
            `}</style>
        </div>
    );
}
