"use client";
import Link from "next/link";

export default function ProductoHeader({
  producto,
  isDirty,
  saving,
  saveSuccess,
  saveError,
  onSave,
}) {
  return (
    <header className="bg-white border-b border-slate-200 px-10 py-4 shrink-0 z-10 flex items-center justify-between gap-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Link
            href="/catalogo"
            className="hover:text-emerald-600 transition-colors"
          >
            Catálogo
          </Link>
          <span>/</span>
          <span className="text-slate-700 truncate">
            {producto.nombre_general}
          </span>
        </div>
        <p className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5 font-mono">
          {producto.slug}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {saveSuccess && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            ✓ Cambios guardados
          </span>
        )}
        {saveError && (
          <span
            className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200 max-w-xs truncate"
            title={saveError}
          >
            ✕ {saveError}
          </span>
        )}
        <button
          id="btn-guardar-producto"
          onClick={onSave}
          disabled={!isDirty || saving}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </header>
  );
}
