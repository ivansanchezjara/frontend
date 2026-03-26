"use client";

export default function Error({ error, reset }) {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <span className="text-6xl mb-6">⚠️</span>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Algo salió mal</h2>
            <p className="text-slate-500 mb-8 max-w-xs">{error.message || "Ocurrió un error inesperado en el sistema."}</p>
            <button
                onClick={() => reset()}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg"
            >
                Intentar de nuevo
            </button>
        </div>
    );
}