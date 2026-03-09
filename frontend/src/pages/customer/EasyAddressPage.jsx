import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
    BookOpen,
    PlusCircle,
    Trash2,
    Smartphone,
    Mail,
    CreditCard,
    RefreshCw,
    Wallet
} from "lucide-react";
import { accountApi } from "../../services/api";
import { motion, AnimatePresence } from "framer-motion";

const ALIAS_TYPES = {
    phone: { label: "Cep Telefonu", icon: Smartphone, placeholder: "5XX1234567" },
    email: { label: "E-Posta", icon: Mail, placeholder: "ornek@email.com" },
    tc_kimlik: { label: "TC Kimlik No", icon: CreditCard, placeholder: "11 Haneli TC Kimlik No" },
};

export default function EasyAddressPage() {
    const [addresses, setAddresses] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [formData, setFormData] = useState({
        account_id: "",
        alias_type: "phone",
        alias_value: "",
        label: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [addressesRes, accountsRes] = await Promise.all([
                accountApi.listEasyAddresses(),
                accountApi.listMine()
            ]);
            setAddresses(Array.isArray(addressesRes.data) ? addressesRes.data : []);

            const activeAccounts = Array.isArray(accountsRes.data)
                ? accountsRes.data.filter(a => a.status === "active")
                : [];
            setAccounts(activeAccounts);

            if (activeAccounts.length > 0 && !formData.account_id) {
                setFormData(prev => ({ ...prev, account_id: activeAccounts[0].id || activeAccounts[0].account_id }));
            }
        } catch (error) {
            toast.error("Kolay adres verileri yüklenemedi.");
            setAddresses([]);
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.account_id || !formData.alias_value) {
            toast.error("Lütfen tüm zorunlu alanları doldurun.");
            return;
        }

        setActionLoading(true);
        try {
            await accountApi.createEasyAddress({
                account_id: formData.account_id,
                alias_type: formData.alias_type,
                alias_value: formData.alias_value,
                label: formData.label || undefined
            });
            toast.success("Kolay adres başarıyla tanımlandı.");
            setFormData(prev => ({ ...prev, alias_value: "", label: "" }));
            await loadData();
        } catch (error) {
            let errorMsg = "Kolay adres oluşturulamadı.";
            if (error.response?.data?.detail) {
                errorMsg = typeof error.response.data.detail === "string"
                    ? error.response.data.detail
                    : JSON.stringify(error.response.data.detail);
            }
            toast.error(errorMsg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu kolay adresi silmek istediğinize emin misiniz?")) return;

        setActionLoading(true);
        try {
            await accountApi.deleteEasyAddress(id);
            toast.success("Kolay adres silindi.");
            await loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Silinemedi.");
        } finally {
            setActionLoading(false);
        }
    };

    const formatAliasValue = (type, value) => {
        if (!value) return "";
        if (type === "phone" && value.length === 10) {
            return `0 (${value.slice(0, 3)}) ${value.slice(3, 6)} ${value.slice(6)}`;
        }
        return value;
    };

    const getAccountDisplay = (accountId) => {
        const account = accounts.find(a => (a.id || a.account_id) === accountId);
        return account;
    };

    const formatMoney = (amount, currency = "TRY") => {
        return new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 md:mb-10"
            >
                <h1 className="text-3xl md:text-4xl font-black mb-3 flex items-center gap-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 text-white">
                        <BookOpen size={28} />
                    </div>
                    Kolay Adres
                </h1>
                <p className="text-gray-400 text-sm md:text-base max-w-2xl">
                    IBAN ezberlemeye son! Telefon, TCKN veya E-Posta adresinizi banka hesabınıza bağlayın, para transferlerini kolaylaştırın.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Create Form */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl"
                >
                    <h2 className="text-xl font-bold text-white mb-6">Yeni Kolay Adres Bağla</h2>

                    <form onSubmit={handleCreate} className="space-y-6">
                        {/* Type Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300 ml-1">Adres Tipi</label>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.entries(ALIAS_TYPES).map(([type, { label, icon: Icon }]) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, alias_type: type, alias_value: "" }))}
                                        className={`flex flex-col items-center justify-center gap-2 p-4 md:p-5 rounded-2xl border transition-all duration-300 ${formData.alias_type === type
                                                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-inner'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <Icon size={24} className={formData.alias_type === type ? "text-indigo-400" : "text-gray-500"} />
                                        <span className="text-xs md:text-sm font-semibold">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Value Input */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300 ml-1">Adres Değeri</label>
                            <input
                                className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                                value={formData.alias_value}
                                onChange={(e) => setFormData(prev => ({ ...prev, alias_value: e.target.value }))}
                                placeholder={ALIAS_TYPES[formData.alias_type].placeholder}
                                required
                            />
                        </div>

                        {/* Account Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300 ml-1">Bağlanacak Hesap</label>
                            <select
                                className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-white text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner appearance-none cursor-pointer"
                                style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 1rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em", paddingRight: "3rem" }}
                                value={formData.account_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                                required
                            >
                                <option value="" disabled className="bg-gray-800 text-gray-400">Hesap Seçin</option>
                                {accounts.map(acc => (
                                    <option key={acc.id || acc.account_id} value={acc.id || acc.account_id} className="bg-gray-800 text-white">
                                        {acc.account_number} • {formatMoney(acc.balance, acc.currency)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Label Input */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300 ml-1">Etiket / Açıklama (Opsiyonel)</label>
                            <input
                                className="w-full px-5 py-4 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-gray-500 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                                value={formData.label}
                                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                                placeholder="Örn: Şahsi Numaram, Şirket Hattım"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={actionLoading || accounts.length === 0}
                            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all duration-300 mt-2 ${actionLoading || accounts.length === 0
                                    ? 'bg-indigo-500/50 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 hover:shadow-indigo-500/25 hover:scale-[1.02] active:scale-95'
                                }`}
                        >
                            {actionLoading ? <RefreshCw size={20} className="animate-spin" /> : <PlusCircle size={20} />}
                            Kolay Adresi Kaydet
                        </button>
                    </form>
                </motion.div>

                {/* List */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col h-full"
                >
                    <h2 className="text-xl font-bold text-white mb-6">Tanımlı Adreslerim</h2>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {addresses.length === 0 ? (
                            <div className="text-center py-10 px-6 bg-white/5 rounded-2xl border border-white/5 text-gray-400 flex flex-col items-center">
                                <BookOpen size={48} className="mb-4 text-gray-600" opacity={0.5} />
                                <p>Henüz tanımlanmış bir kolay adresiniz bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                <AnimatePresence>
                                    {addresses.map((address, index) => {
                                        const typeConfig = ALIAS_TYPES[address.alias_type] || ALIAS_TYPES.phone;
                                        const Icon = typeConfig.icon;
                                        const addressId = address.id || address.address_id;
                                        const linkedAccount = getAccountDisplay(address.account_id);

                                        return (
                                            <motion.div
                                                key={addressId}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex items-center justify-between hover:bg-white/10 transition-colors group"
                                            >
                                                <div className="flex gap-4 items-center">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
                                                        <Icon size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white text-base md:text-lg mb-1 tracking-wide">
                                                            {formatAliasValue(address.alias_type, address.alias_value)}
                                                        </div>
                                                        <div className="text-xs md:text-sm text-gray-400 flex items-center gap-2 flex-wrap">
                                                            <span className="bg-white/10 px-2 py-0.5 rounded-md text-gray-300">
                                                                {address.label || typeConfig.label}
                                                            </span>
                                                            {linkedAccount && (
                                                                <>
                                                                    <span className="opacity-50">•</span>
                                                                    <span className="flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
                                                                        <Wallet size={12} />
                                                                        {linkedAccount.account_number}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(addressId)}
                                                    disabled={actionLoading}
                                                    className={`p-3 rounded-xl transition-all ${actionLoading
                                                            ? 'opacity-50 cursor-not-allowed text-gray-500'
                                                            : 'text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95'
                                                        }`}
                                                    title="Sil"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
