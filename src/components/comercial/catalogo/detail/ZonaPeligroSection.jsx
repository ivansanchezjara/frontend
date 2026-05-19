"use client";
import { Section, Button, Text } from "@/components/ui";

/**
 * ZonaPeligroSection estandarizado.
 * Contenedor de acciones críticas (como desactivar/eliminar un producto),
 * que utiliza los componentes del layout (Section) y atómicos (Button, Typography - Text).
 */
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
        <div className="p-6 dark:bg-red-950/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <Text variant="bodySm" className="font-black text-slate-800">
              Desactivar Producto
            </Text>
            <Text variant="bodyXs" className="text-slate-500 mt-1 max-w-md">
              Archiva el producto y sus {producto.variants?.length || 0}{" "}
              variantes. Dejarán de estar visibles en el catálogo e inventario.
            </Text>
          </div>
          <Button
            variant="danger"
            onClick={onDeleteProducto}
            disabled={isDeletingProd}
            className="px-8 h-11 text-[10px] font-black uppercase tracking-widest rounded-xl whitespace-nowrap shadow-md shadow-red-200/20 active:scale-95 transition-all"
          >
            {isDeletingProd ? "PROCESANDO..." : "DESACTIVAR PRODUCTO"}
          </Button>
        </div>
      </Section>
    </div>
  );
}
