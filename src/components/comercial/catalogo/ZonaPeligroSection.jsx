"use client";
import Section from "./Section";

export default function ZonaPeligroSection({
  producto,
  isDeletingProd,
  onDeleteProducto,
}) {
  return (
    <div className="pt-10 pb-20">
      <Section
        title="Zona de Peligro"
        subtitle="Acciones críticas que afectan la visibilidad del producto en el sistema."
      >
        <div className="p-6 bg-red-50/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="text-sm font-bold text-slate-800">
              Desactivar Producto
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Archiva el producto y sus {producto.variants?.length || 0}{" "}
              variantes. Dejarán de estar visibles en el catálogo e inventario.
            </p>
          </div>
          <button
            onClick={onDeleteProducto}
            disabled={isDeletingProd}
            className="bg-white border border-red-200 text-red-600 px-8 py-3 rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 whitespace-nowrap disabled:opacity-50"
          >
            {isDeletingProd ? "PROCESANDO..." : "DESACTIVAR PRODUCTO"}
          </button>
        </div>
      </Section>
    </div>
  );
}
