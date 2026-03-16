import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCcw, HandCoins, ArrowLeftRight, HelpCircle, X, Wallet } from "lucide-react";
import toast from "react-hot-toast";

export default function InvestmentsPage() {
    const [cryptoData, setCryptoData] = useState([]);
    const [stockData, setStockData] = useState([]);
    const [portfolio, setPortfolio] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("crypto"); // "crypto", "stocks", "portfolio"
    
    // Modal state
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [modalAction, setModalAction] = useState(null); // 'buy' or 'sell'
    const [searchTerm, setSearchTerm] = useState("");

    const fetchMarketData = async () => {
        setLoading(true);
        try {
            const [cryptoRes, stockRes, portRes, accountsRes] = await Promise.all([
                fetch("/api/v1/market/crypto", {
                    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
                }),
                fetch("/api/v1/market/stocks", {
                    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
                }),
                fetch("/api/v1/market/portfolio", {
                    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
                }),
                fetch("/api/v1/accounts/my", {
                     headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
                })
            ]);

            if (cryptoRes.ok) setCryptoData(await cryptoRes.json());
            if (stockRes.ok) setStockData(await stockRes.json());
            if (portRes.ok) setPortfolio(await portRes.json());
            if (accountsRes.ok) {
                const accs = await accountsRes.json();
                // Filter out credit cards, only checking/savings have real fiat balances for this purpose
                setAccounts(accs.filter(a => a.account_type !== "credit" && a.status === "active"));
            }
        } catch (error) {
            console.error("Market data fetch failed", error);
            toast.error("Unable to load market data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarketData();
        const interval = setInterval(fetchMarketData, 60000); // refresh every minute
        return () => clearInterval(interval);
    }, []);

    const formatMoney = (amount) => {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
    };

    const filteredCryptoData = cryptoData.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredStockData = stockData.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            {/* Header */}
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Investment Markets</h1>
                    <p className="text-sm text-[var(--text-secondary)]">Buy and sell cryptocurrency and global stocks</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchMarketData} disabled={loading} className="bank-secondary-btn" aria-label="Refresh">
                        <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
                        <span>Refresh</span>
                    </button>
                    <button className="bank-primary-btn">
                        <ArrowLeftRight size={16} />
                        <span>Buy / Sell</span>
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex items-center gap-2 rounded-[1.2rem] border border-white/10 bg-white/5 p-1">
                {[
                    { id: "crypto", label: "Cryptocurrencies" },
                    { id: "stocks", label: "Stocks" },
                    { id: "portfolio", label: "My Portfolio" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 rounded-[1rem] px-4 py-2 text-sm font-semibold transition ${
                            activeTab === tab.id
                                ? "bg-white/10 text-[var(--text-primary)] shadow-sm"
                                : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-white"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab !== "portfolio" && (
                <div className="relative">
                    <input
                        type="text"
                        placeholder={`Search ${activeTab === 'crypto' ? 'cryptos' : 'stocks'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-[var(--text-primary)] focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition shadow-lg"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                        <TrendingUp size={18} />
                    </div>
                </div>
            )}

            {/* Content Body */}
            <div className="rounded-[1.5rem] border border-white/10 bg-[#0A0D18] p-4 shadow-xl sm:p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
                
                {loading && (cryptoData.length === 0 && stockData.length === 0) ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-r-transparent"></div>
                    </div>
                ) : activeTab === "crypto" ? (
                    <div className="space-y-4">
                        <MarketList data={filteredCryptoData} formatMoney={formatMoney} onAction={(asset, action) => { setSelectedAsset(asset); setModalAction(action); }} />
                    </div>
                ) : activeTab === "stocks" ? (
                    <div className="space-y-4">
                        <MarketList data={filteredStockData} formatMoney={formatMoney} onAction={(asset, action) => { setSelectedAsset(asset); setModalAction(action); }} />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {portfolio.length === 0 ? (
                            <div className="py-12 text-center text-[var(--text-secondary)]">
                                <HandCoins size={48} className="mx-auto mb-4 opacity-50" />
                                <p>You don't have any assets in your portfolio yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {portfolio.map((item) => {
                                    // Find live price
                                    const liveData = (item.asset_type === "crypto" ? cryptoData : stockData).find(a => a.id === item.asset_id || a.symbol.toLowerCase() === item.asset_id.toLowerCase());
                                    const currentPrice = liveData ? liveData.current_price : item.average_buy_price;
                                    const currentValue = currentPrice * item.quantity;
                                    const totalCost = item.average_buy_price * item.quantity;
                                    const profit = currentValue - totalCost;
                                    const profitPct = (profit / totalCost) * 100;
                                    const isProfit = profit >= 0;

                                    return (
                                        <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-white text-lg">{item.symbol}</span>
                                                    <div className={`text-xs px-2 py-0.5 rounded-full font-bold ${isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                        {isProfit ? '+' : ''}{profitPct.toFixed(2)}%
                                                    </div>
                                                </div>
                                                <div className="flex items-baseline gap-2 mb-4">
                                                    <span className="text-2xl font-bold text-[var(--text-primary)]">{item.quantity}</span>
                                                    <span className="text-sm text-[var(--text-secondary)]">Units</span>
                                                </div>
                                                
                                                <div className="space-y-1 mb-4 border-t border-white/5 pt-3">
                                                    <div className="text-sm flex justify-between">
                                                        <span className="text-[var(--text-secondary)]">Current Price:</span>
                                                        <span className="text-white font-medium">{formatMoney(currentPrice)}</span>
                                                    </div>
                                                    <div className="text-sm flex justify-between">
                                                        <span className="text-[var(--text-secondary)]">Avg. Cost:</span>
                                                        <span className="text-white font-medium">{formatMoney(item.average_buy_price)}</span>
                                                    </div>
                                                    <div className="text-sm flex justify-between">
                                                        <span className="text-[var(--text-secondary)]">Total Value:</span>
                                                        <span className="text-white font-bold">{formatMoney(currentValue)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <button 
                                                    onClick={() => { setSelectedAsset({ ...item, current_price: currentPrice, type: item.asset_type, name: item.symbol }); setModalAction('buy'); }} 
                                                    className="rounded-xl bg-emerald-500/10 py-2 text-sm font-semibold text-emerald-500 hover:bg-emerald-500 hover:text-white transition"
                                                >
                                                    Buy
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedAsset({ ...item, current_price: currentPrice, type: item.asset_type, name: item.symbol }); setModalAction('sell'); }} 
                                                    className="rounded-xl bg-rose-500/10 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-500 hover:text-white transition"
                                                >
                                                    Sell
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-4">
                <div className="rounded-full bg-primary/20 p-2 text-primary">
                    <HelpCircle size={20} />
                </div>
                <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">Commission Fees</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">A <span className="font-bold text-primary">1.5% commission</span> is applied to every buy and sell transaction. This fee is clearly shown on the confirmation form and deducted during the process.</p>
                </div>
            </div>

            {selectedAsset && modalAction && (
                <TradeModal 
                    asset={selectedAsset} 
                    action={modalAction} 
                    accounts={accounts} 
                    onClose={() => { setSelectedAsset(null); setModalAction(null); }} 
                    onSuccess={() => { setSelectedAsset(null); setModalAction(null); fetchMarketData(); }}
                    formatMoney={formatMoney}
                />
            )}
        </div>
    );
}

function MarketList({ data, formatMoney, onAction }) {
    if (!data || data.length === 0) {
        return <div className="text-center py-8 text-[var(--text-secondary)]">No data found.</div>;
    }

    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                    <tr className="border-b border-white/5 text-[var(--text-secondary)]">
                        <th className="pb-3 pl-4 font-medium">Asset</th>
                        <th className="pb-3 font-medium">Price (USD)</th>
                        <th className="pb-3 font-medium text-right">24h Change</th>
                        <th className="pb-3 pr-4 font-medium text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {data.map((item) => {
                        const isPositive = item.price_change_percentage_24h >= 0;
                        return (
                            <tr key={item.id} className="group transition hover:bg-white/[0.02]">
                                <td className="py-4 pl-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 font-bold text-white shadow-sm border border-white/10 group-hover:border-white/20 transition">
                                            {item.symbol.substring(0, 2)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[var(--text-primary)]">{item.name}</p>
                                            <p className="text-xs tracking-wider text-[var(--text-secondary)] uppercase">{item.symbol}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 font-semibold text-white">
                                    {formatMoney(item.current_price)}
                                </td>
                                <td className="py-4 text-right">
                                    <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                        isPositive 
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                    }`}>
                                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {Math.abs(item.price_change_percentage_24h).toFixed(2)}%
                                    </div>
                                </td>
                                <td className="py-4 pr-4 text-right flex justify-end gap-2">
                                    <button onClick={() => onAction(item, 'buy')} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 font-semibold text-emerald-500 transition hover:bg-emerald-500 hover:text-white">
                                        Buy
                                    </button>
                                    <button onClick={() => onAction(item, 'sell')} className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 font-semibold text-rose-500 transition hover:bg-rose-500 hover:text-white">
                                        Sell
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function TradeModal({ asset, action, accounts, onClose, onSuccess, formatMoney }) {
    const [quantity, setQuantity] = useState("");
    const [accountId, setAccountId] = useState(accounts[0]?.account_id || "");
    const [loading, setLoading] = useState(false);

    const isBuy = action === "buy";
    const parsedQuantity = parseFloat(quantity) || 0;
    const totalValue = parsedQuantity * asset.current_price;
    const commission = totalValue * 0.015;
    const totalCost = isBuy ? totalValue + commission : totalValue - commission;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!parsedQuantity || parsedQuantity <= 0) return toast.error("Please enter a valid amount.");
        if (!accountId) return toast.error("You must select an account.");

        setLoading(true);
        try {
            const res = await fetch(`/api/v1/market/${action}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    asset_id: asset.id || asset.asset_id,
                    asset_type: asset.type,
                    quantity: parsedQuantity,
                    source_account_id: accountId
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Transaction failed.");
            
            toast.success(data.message || "Transaction completed successfully.");
            onSuccess();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0B0E17] p-6 shadow-2xl animate-[bankFadeUp_0.3s_ease]">
                <button onClick={onClose} className="absolute right-5 top-5 text-[var(--text-secondary)] hover:text-white">
                    <X size={20} />
                </button>
                
                <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-xl font-bold">
                        {asset.symbol.substring(0, 2)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{isBuy ? "Confirm Purchase" : "Confirm Sale"}: {asset.name}</h2>
                        <p className="text-sm text-[var(--text-secondary)]">Current Price: <span className="text-white font-medium">{formatMoney(asset.current_price)}</span></p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="bank-label">Source Account</label>
                        <select
                            className="bank-input"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            required
                        >
                            {accounts.map(acc => (
                                <option key={acc.account_id} value={acc.account_id}>
                                    {acc.currency} - {acc.account_number} ({acc.balance} {acc.currency})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="bank-label">Quantity</label>
                        <input
                            type="number"
                            step="any"
                            min="0.000001"
                            className="bank-input"
                            placeholder="e.g.: 0.5 or 10"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                        />
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-white/5 p-4 space-y-2 text-sm">
                        <div className="flex justify-between text-[var(--text-secondary)]">
                            <span>Asset Value</span>
                            <span className="text-white font-medium">{formatMoney(totalValue)}</span>
                        </div>
                        <div className="flex justify-between text-[var(--text-secondary)]">
                            <span>Commission (1.5%)</span>
                            <span className="text-primary font-medium">{formatMoney(commission)}</span>
                        </div>
                        <div className="my-2 border-t border-white/10" />
                        <div className="flex justify-between font-bold">
                            <span className="text-white">{isBuy ? "Total Amount" : "Received Amount"}</span>
                            <span className={isBuy ? "text-rose-400" : "text-emerald-400"}>{formatMoney(totalCost)}</span>
                        </div>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] italic text-center">
                        This transaction will be executed at current market prices and cannot be reversed.
                    </p>

                    <button
                        type="submit"
                        disabled={loading || parsedQuantity <= 0}
                        className={`w-full rounded-[1.2rem] py-3.5 font-bold text-white shadow-lg transition ${
                            isBuy 
                                ? "bg-primary hover:bg-primary-hover shadow-primary/20 hover:shadow-primary/40" 
                                : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 hover:shadow-emerald-500/40"
                        } disabled:opacity-50 disabled:cursor-not-allowed flex justify-center`}
                    >
                        {loading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                        ) : (
                            isBuy ? "Confirm Buy Order" : "Confirm Sell Order"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
