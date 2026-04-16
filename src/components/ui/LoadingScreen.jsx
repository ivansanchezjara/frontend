export default function LoadingScreen({ texto, message }) {
    const displayText = texto || message || "Cargando";

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-transparent min-h-[400px] animate-in fade-in duration-1000">
            <div className="relative flex items-center justify-center mb-6">
                {/* Minimalist Spinner */}
                <div className="w-12 h-12 border-[1.5px] border-slate-200 rounded-full"></div>
                <div className="absolute w-12 h-12 border-[1.5px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div className="text-center">
                <h5 className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.4em] animate-pulse">
                    {displayText}
                </h5>
            </div>
        </div>
    );
}