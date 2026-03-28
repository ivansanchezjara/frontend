export default function EmptyState({ titulo, descripcion, onAction, textoBoton }) {
    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-16 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
            <span className="text-6xl mb-4">🔍</span>
            <h3 className="text-xl font-black text-slate-900 mb-2">{titulo}</h3>
            <p className="text-slate-500 font-medium text-sm max-w-sm mx-auto">
                {descripcion}
            </p>
            {onAction && (
                <button
                    onClick={onAction}
                    className="mt-6 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs uppercase tracking-widest cursor-pointer"
                >
                    {textoBoton}
                </button>
            )}
        </div>
    );
}