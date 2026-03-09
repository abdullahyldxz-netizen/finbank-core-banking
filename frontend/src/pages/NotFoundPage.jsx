import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFoundPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 text-center max-w-lg w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 md:p-14 shadow-2xl"
            >
                {/* 404 Text */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative inline-block mb-6"
                >
                    <div className="text-8xl md:text-9xl font-black tracking-tighter bg-gradient-to-br from-indigo-400 to-emerald-400 bg-clip-text text-transparent opacity-80">
                        404
                    </div>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
                        Sayfa Bulunamadı
                    </h1>
                    <p className="text-white/60 text-base md:text-lg mb-8 leading-relaxed">
                        Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
                        Lütfen bağlantıyı kontrol edin.
                    </p>
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm w-full sm:w-auto"
                    >
                        <ArrowLeft size={18} /> Geri Dön
                    </button>

                    <Link
                        to="/"
                        className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/25 text-sm w-full sm:w-auto"
                    >
                        <Home size={18} /> Ana Sayfaya Git
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
