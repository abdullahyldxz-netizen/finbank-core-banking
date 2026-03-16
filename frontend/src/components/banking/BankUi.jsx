import { Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function BankPageHeader({ eyebrow, title, description, actions, className = "" }) {
    return (
        <section className={cn("page-header flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between", className)}>
            <div className="max-w-3xl">
                {eyebrow ? <p className="bank-section-label mb-3">{eyebrow}</p> : null}
                <h1 className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    {title}
                </h1>
                {description ? <p>{description}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </section>
    );
}

export function BankGlassCard({ className = "", children }) {
    return (
        <section className={cn("bank-surface rounded-[1.8rem] p-5 lg:p-6", className)}>
            {children}
        </section>
    );
}

export function BankMetricCard({ icon: Icon, label, value, delta, tone = "primary", className = "" }) {
    const toneMap = {
        primary: "from-primary/20 via-primary/8 to-transparent text-primary",
        success: "from-emerald-500/20 via-emerald-500/8 to-transparent text-emerald-400",
        warning: "from-amber-500/20 via-amber-500/8 to-transparent text-amber-400",
        danger: "from-rose-500/20 via-rose-500/8 to-transparent text-rose-400",
        secondary: "from-violet-500/20 via-violet-500/8 to-transparent text-violet-400",
        gold: "from-amber-300/20 via-amber-500/10 to-transparent text-amber-300",
    };

    return (
        <BankGlassCard className={cn("relative overflow-hidden", className)}>
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", toneMap[tone] || toneMap.primary)} />
            <div className="relative flex items-start justify-between gap-4">
                <div>
                    <p className="bank-section-label mb-3 text-[11px]">{label}</p>
                    <p className="font-display text-3xl font-black tracking-[-0.06em] text-[var(--text-primary)]">{value}</p>
                    {delta ? <p className="mt-3 text-sm font-semibold text-[var(--text-secondary)]">{delta}</p> : null}
                </div>
                {Icon ? (
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-current">
                        <Icon size={20} />
                    </span>
                ) : null}
            </div>
        </BankGlassCard>
    );
}

export function BankActionTile({ icon: Icon, title, description, to, href, onClick, tone = "primary", className = "" }) {
    const toneMap = {
        primary: "text-primary border-primary/16 hover:border-primary/28 hover:bg-primary/8",
        success: "text-emerald-400 border-emerald-500/16 hover:border-emerald-500/28 hover:bg-emerald-500/8",
        warning: "text-amber-300 border-amber-500/16 hover:border-amber-500/28 hover:bg-amber-500/8",
        danger: "text-rose-400 border-rose-500/16 hover:border-rose-500/28 hover:bg-rose-500/8",
        secondary: "text-violet-400 border-violet-500/16 hover:border-violet-500/28 hover:bg-violet-500/8",
    };
    const classes = cn(
        "group flex min-h-[10.5rem] flex-col justify-between rounded-[1.7rem] border bg-white/[0.03] p-5 text-left transition hover:-translate-y-0.5",
        toneMap[tone] || toneMap.primary,
        className,
    );

    const content = (
        <>
            <span className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] border border-current/15 bg-current/10">
                {Icon ? <Icon size={24} /> : null}
            </span>
            <div className="mt-6">
                <h3 className="font-display text-lg font-bold tracking-[-0.03em] text-[var(--text-primary)]">{title}</h3>
                {description ? <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
            </div>
        </>
    );

    if (to) {
        return <Link to={to} className={classes}>{content}</Link>;
    }

    if (href) {
        return <a href={href} className={classes}>{content}</a>;
    }

    return (
        <button type="button" onClick={onClick} className={classes}>
            {content}
        </button>
    );
}

export function BankSectionCard({ title, description, action, className = "", children }) {
    return (
        <BankGlassCard className={className}>
            {(title || action || description) ? (
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        {title ? <h2 className="font-display text-xl font-bold tracking-[-0.04em] text-[var(--text-primary)]">{title}</h2> : null}
                        {description ? <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
                    </div>
                    {action ? <div className="shrink-0">{action}</div> : null}
                </div>
            ) : null}
            {children}
        </BankGlassCard>
    );
}

export function BankEmptyState({ icon: Icon, title, description, action, className = "" }) {
    return (
        <div className={cn("bank-empty-state rounded-[1.8rem] px-6 py-10", className)}>
            {Icon ? (
                <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.3rem] border border-white/10 bg-white/5 text-primary">
                    <Icon size={26} />
                </span>
            ) : null}
            <h3 className="font-display text-xl font-bold tracking-[-0.04em] text-[var(--text-primary)]">{title}</h3>
            {description ? <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
            {action ? <div className="mt-5">{action}</div> : null}
        </div>
    );
}

export function SegmentedTabs({ tabs, active, onChange, className = "" }) {
    return (
        <div className={cn("inline-flex flex-wrap gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1.5", className)}>
            {tabs.map((tab) => {
                const activeTab = tab.id === active;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            "rounded-full px-4 py-2.5 text-sm font-bold transition",
                            activeTab ? "bg-primary text-white shadow-[0_10px_24px_rgba(59,130,246,0.28)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                        )}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}

export function BankListRow({ leading, title, description, trailing, className = "" }) {
    return (
        <div className={cn("flex items-center justify-between gap-4 rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:border-white/12 hover:bg-white/[0.05]", className)}>
            <div className="flex min-w-0 items-center gap-3">
                {leading}
                <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--text-primary)]">{title}</p>
                    {description ? <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">{description}</p> : null}
                </div>
            </div>
            {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
    );
}

export { cn };
