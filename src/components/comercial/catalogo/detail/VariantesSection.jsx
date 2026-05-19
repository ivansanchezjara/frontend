"use client";
import { getFullImageUrl } from "@/services/apis/catalogo.js";
import { Text, Button, Section } from "@/components/ui";
import { Trash2, Edit3, Plus, Image, Box } from "lucide-react";

/**
 * VariantesSection estandarizado.
 * Muestra la tabla de variantes del producto y sus acciones (crear, editar, desactivar),
 * utilizando los componentes del layout (Section) y atómicos (Button, Typography - Text).
 */
export default function VariantesSection({
  variants,
  onNew,
  onEdit,
  onDelete,
  deletingId,
}) {
  return (
    <Section
      title="Variantes del Producto"
      subtitle="Precios y costos → Inventario y Precios"
      action={
        <Button
          onClick={onNew}
          variant="default"
          size="sm"
          icon={Plus}
          className="rounded-xl"
        >
          Nueva Variante
        </Button>
      }
    >
      {variants.length === 0 ? (
        <div className="p-12 text-center select-none">
          <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <Text variant="bodySm" className="text-slate-500 font-medium">
            Este producto no tiene variantes todavía.
          </Text>
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 select-none">
                <th className="py-3 pl-6 pr-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Nombre
                </th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Código SKU
                </th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hidden md:table-cell">
                  Sub-Slug
                </th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                  Extras
                </th>
                <th className="py-3 pr-6 pl-4 w-20"></th>
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
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 shrink-0 shadow-sm select-none">
                          <Image className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                      <Text variant="bodySm" className="text-sm font-bold text-slate-800">
                        {v.nombre_variante}
                      </Text>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <code className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg select-all">
                      {v.product_code}
                    </code>
                  </td>
                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <Text variant="bodyXs" className="text-xs text-slate-400 font-mono">
                      {v.sub_slug}
                    </Text>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Text variant="bodyXs" className="text-xs font-bold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-xl inline-block select-none">
                      {v.imagenes?.length || 0} fotos
                    </Text>
                  </td>
                  <td className="py-3.5 pr-6 pl-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(v)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer flex items-center justify-center"
                        title="Editar variante"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(v.id)}
                        disabled={deletingId === v.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center"
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
        </div>
      )}
    </Section>
  );
}
