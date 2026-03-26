export default function ColumnSelector({ opciones, visibles, onToggle, isOpen, setIsOpen }) {
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-3.5 rounded-2xl border transition-all shadow-sm flex items-center gap-2 font-bold text-xs cursor-pointer ${isOpen ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
            >
                ⚙️ <span>Columnas</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 z-50 animate-in fade-in zoom-in duration-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-tighter">Personalizar Vista</p>
                    <div className="grid grid-cols-1 gap-2">
                        {opciones.map(opt => (
                            <label key={opt.id} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                <input
                                    type="checkbox"
                                    checked={visibles.includes(opt.id)}
                                    onChange={() => onToggle(opt.id)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                                    {opt.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}