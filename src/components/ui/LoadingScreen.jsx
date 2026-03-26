// src/components/ui/LoadingScreen.jsx
export default function LoadingScreen({ texto = "Cargando Thalys ERP..." }) {
    return (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center animate-pulse">
                <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center font-black text-white text-2xl">
                    T
                </div>
                <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                    {texto}
                </p>
            </div>
        </div>
    );
}