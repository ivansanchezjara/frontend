"use client";
import { getFullImageUrl } from "@/services/apis/catalogo.js";
import { Text, Button } from "@/components/ui";
import { Trash2, Edit3, Plus, Image, Box } from "lucide-react";

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
          <Text variant="label" className="text-xs font-black text-slate-500 uppercase tracking-widest" as="h2">
            Variantes del Producto
          </Text>
          <Text className="text-[11px] text-slate-400 mt-0.5">
            Precios y costos → <strong>Inventario y Precios</strong>
          </Text>
        </div>
        <Button
          onClick={onNew}
          variant="default"
          size="sm"
          icon={Plus}
        >
          Nueva Variante
        </Button>

      </div>

      {variants.length === 0 ? (
        <div className="p-12 text-center">
          <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <Text variant="bodySm">
            Este producto no tiene variantes todavía.
          </Text>
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
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 shrink-0 shadow-sm">
                        <Image className="w-4 h-4 text-slate-300" />
                      </div>
                    )}
                    <Text variant="bodySm" className="text-sm font-bold text-slate-800">
                      {v.nombre_variante}
                    </Text>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <code className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                    {v.product_code}
                  </code>
                </td>
                <td className="py-3.5 px-4 hidden md:table-cell">
                  <Text variant="mono" className="text-xs text-slate-400 font-mono">
                    {v.sub_slug}
                  </Text>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <Text variant="bodyXs" className="text-xs font-bold text-slate-500 bg-slate-100/80 px-2 py-1 rounded-xl inline-block">
                    {v.imagenes?.length || 0} fotos
                  </Text>
                </td>
                <td className="py-3.5 pr-5 pl-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(v)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Editar variante"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(v.id)}
                      disabled={deletingId === v.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 cursor-pointer"
                      title="Desactivar variante"
                    >
                      <Trash2 className="w-4 h-4" />
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
