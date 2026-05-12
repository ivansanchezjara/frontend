"use client";
import { getFullImageUrl } from "@/services/apis/catalogo.js";

export default function VariantesSection({
  variants,
  onNew,
  onEdit,
  onDelete,
  deletingId,
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Variantes del Producto
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Precios y costos → <strong>Inventario y Precios</strong>
          </p>
        </div>
        <button
          id="btn-nueva-variante"
          onClick={onNew}
          className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all active:scale-95 cursor-pointer"
        >
          + Nueva Variante
        </button>
      </div>

      {variants.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-sm font-bold text-slate-400">
            Este producto no tiene variantes todavía.
          </p>
          <button
            onClick={onNew}
            className="mt-4 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
          >
            + Agregar primera variante
          </button>
        </div>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-400">
              <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">
                Nombre
              </th>
              <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">
                Código SKU
              </th>
              <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest hidden md:table-cell">
                Sub-Slug
              </th>
              <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-center">
                Extras
              </th>
              <th className="py-3 pr-5 pl-4"></th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => (
              <tr
                key={v.id}
                className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-3.5 pl-6 pr-4">
                  <div className="flex items-center gap-3">
                    {v.imagen_url ? (
                      <img
                        src={getFullImageUrl(v.imagen_url)}
                        alt={v.nombre_variante}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 bg-white"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-xs text-slate-300 shrink-0 shadow-sm">
                        🏜️
                      </div>
                    )}
                    <span className="text-sm font-bold text-slate-800">
                      {v.nombre_variante}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <code className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                    {v.product_code}
                  </code>
                </td>
                <td className="py-3.5 px-4 hidden md:table-cell">
                  <span className="text-xs text-slate-400 font-mono">
                    {v.sub_slug}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100/80 px-2 py-1 rounded-xl">
                    {v.imagenes?.length || 0} fotos
                  </span>
                </td>
                <td className="py-3.5 pr-5 pl-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(v)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Editar variante"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(v.id)}
                      disabled={deletingId === v.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 cursor-pointer"
                      title="Desactivar variante"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
