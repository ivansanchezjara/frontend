export default function Header({ title, subtitle, className = "", subtitleClassName = "text-blue-600", children }) {
    return (
        <header className={`h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0 z-10 ${className}`}>
            <div>
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h2>
                {subtitle && (
                    <div className={`text-[10px] font-bold uppercase flex items-center gap-1.5 mt-0.5 ${subtitleClassName}`}>
                        {subtitle}
                    </div>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-3">
                    {children}
                </div>
            )}
        </header>
    );
}
