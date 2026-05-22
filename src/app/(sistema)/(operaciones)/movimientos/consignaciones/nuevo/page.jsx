"use client";
import { PageHeader, Button, Heading, Text, Input } from '@/components/ui';
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Package,
  MapPin,
  User,
  Calendar,
  Trash2,
  Info,
  LayoutGrid,
} from "lucide-react";
import ProductSearchModal from "@/components/movimientos/ProductSearchModal";
import { useApi } from "@/hooks/useApi";
import { getStockLotes } from "@/services/apis/inventario";
import { crearConsignacion } from "@/services/apis/movimientos";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";

export default function NuevaConsignacionPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // --- API & DATA ---
  const { execute: fetchLotes } = useApi(getStockLotes);
  const { execute: createConsignacionAction, loading: isSubmitting } = useApi(crearConsignacion, { auto: false });

  const [header, setHeader] = useState({
    responsable: "",
    destino: "",
    fecha_esperada_devolucion: "",
    observaciones: "",
  });

  const [items, setItems] = useState([]);

  const handleChangeHeader = (e) => {
    setHeader({ ...header, [e.target.name]: e.target.value });
  };

  const addItem = async (selection) => {
    let targetLote = selection;

    // Si viene de modo variante, buscamos el "mejor" lote automáticamente del servidor
    if (selection.isVariante) {
      try {
        const data = await fetchLotes({ variante: selection.id, limit: 100 });
        const variantLotes = (data?.results || data || []).filter(l => l.cantidad > 0);

        if (variantLotes.length === 0) {
          showToast("No hay stock disponible para esta variante.", "error");
          return;
        }

        // Ordenar por FEFO (Vencimiento más próximo) y luego FIFO (Entrada más antigua)
        targetLote = [...variantLotes].sort((a, b) => {
          if (a.vencimiento && b.vencimiento) {
            const dateA = new Date(a.vencimiento);
            const dateB = new Date(b.vencimiento);
            if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
          } else if (a.vencimiento) return -1;
          else if (b.vencimiento) return 1;

          return new Date(a.fecha_entrada) - new Date(b.fecha_entrada);
        })[0];
      } catch (err) {
        showToast("Error al cargar los lotes disponibles", "error");
        return;
      }
    }

    if (!targetLote || items.find((i) => i.lote === targetLote.id)) return;

    setItems([
      ...items,
      {
        lote: targetLote.id,
        variante_nombre: targetLote.variante_nombre || "Producto",
        nombre_variante: targetLote.nombre_variante,
        lote_codigo: targetLote.lote_codigo,
        deposito_nombre: targetLote.deposito_nombre,
        stock_max: targetLote.cantidad,
        cantidad: 1,
      },
    ]);
    setIsSearchOpen(false);
  };

  const updateItemCantidad = (idx, value) => {
    const newItems = [...items];

    // Permitir borrar el campo temporalmente
    if (value === "") {
      newItems[idx].cantidad = "";
    } else {
      const cant = parseInt(value, 10);
      // Asegurarse de no superar el stock disponible
      newItems[idx].cantidad = Math.min(cant, newItems[idx].stock_max);
    }

    setItems(newItems);
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      isSubmitting ||
      items.length === 0 ||
      !header.responsable ||
      !header.destino
    )
      return;

    // Validar que ninguna cantidad haya quedado vacía o en 0
    for (const item of items) {
      if (!item.cantidad || Number(item.cantidad) <= 0) {
        showToast(`La cantidad para el lote ${item.lote_codigo} debe ser mayor a 0.`, "error");
        return;
      }
    }

    const isConfirmed = await confirm(
      "¿Estás seguro de registrar esta consignación?",
      "Registrar Salida"
    );

    if (!isConfirmed) return;

    try {
      const payload = {
        ...header,
        fecha_esperada_devolucion: header.fecha_esperada_devolucion || null,
        items: items.map((i) => ({
          lote: i.lote,
          cantidad: Number(i.cantidad),
        })),
      };

      await createConsignacionAction(payload);
      showToast("Consignación registrada con éxito", "success");
      router.push("/movimientos/consignaciones");
    } catch (err) {
      showToast("Error al registrar la consignación", "error");
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Consignaciones", href: "/movimientos/consignaciones" },
          { label: "Nueva Consignación" },
        ]}
        subtitle={
          <>
            <Package size={12} />
            Registrá mercadería enviada a clientes o vendedores en calidad de
            préstamo.
          </>
        }
      >
        <Button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            items.length === 0 ||
            !header.responsable ||
            !header.destino
          }
          variant="primary"
          className="uppercase tracking-widest font-black"
        >
          {isSubmitting ? "PROCESANDO..." : "REGISTRAR SALIDA"}
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1800px] mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel lateral: Datos de Cabecera */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                <Heading level={6} className="flex items-center gap-2">
                  <Info size={14} /> Datos del receptor
                </Heading>

                <div className="space-y-4">
                  <Input
                    label="Responsable / Cliente"
                    icon={User}
                    type="text"
                    name="responsable"
                    value={header.responsable}
                    onChange={handleChangeHeader}
                    placeholder="Nombre de la persona..."
                  />

                  <Input
                    label="Destino / Lugar"
                    icon={MapPin}
                    type="text"
                    name="destino"
                    value={header.destino}
                    onChange={handleChangeHeader}
                    placeholder="Ej: Clínica X, Vendedor Juan..."
                  />

                  <Input
                    label="Fecha Retorno (Est.)"
                    icon={Calendar}
                    type="date"
                    name="fecha_esperada_devolucion"
                    value={header.fecha_esperada_devolucion}
                    onChange={handleChangeHeader}
                  />
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden">
                <LayoutGrid className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24" />
                <Heading level={6} className="mb-4 text-slate-400">
                  Notas Internas
                </Heading>
                <textarea
                  name="observaciones"
                  value={header.observaciones}
                  onChange={handleChangeHeader}
                  rows="4"
                  className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                  placeholder="Comentarios adicionales..."
                />
              </div>
            </div>

            {/* Grid principal: Ítems */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm min-h-[400px]">
                <div className="flex justify-between items-center mb-8">
                  <Heading level={6} className="flex items-center gap-2 text-slate-400">
                    <Package size={16} /> Productos a enviar
                  </Heading>
                  <Button
                    onClick={() => setIsSearchOpen(true)}
                    variant="outline"
                    className="text-purple-600 border-purple-200 hover:bg-purple-50 uppercase tracking-widest text-[10px]"
                  >
                    <Plus size={14} /> Seleccionar de Stock
                  </Button>
                </div>

                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-300 border-2 border-dashed border-slate-100 rounded-[30px] bg-slate-50/50">
                    <Package size={48} className="opacity-20 mb-4" />
                    <Text variant="muted" className="text-[10px] uppercase tracking-widest">
                      No hay productos seleccionados
                    </Text>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-slate-100 p-6 rounded-[30px] flex items-center gap-6 animate-in slide-in-from-right-4 duration-300"
                      >
                        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 font-black shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Text className="text-[9px] text-purple-400 uppercase tracking-widest">
                            {item.lote_codigo}
                          </Text>
                          <Heading level={4} className="text-slate-800 truncate">
                            {item.variante_nombre}{" "}
                            <Text as="span" variant="muted" className="text-xs">
                              | {item.nombre_variante}
                            </Text>
                          </Heading>
                          <Text variant="muted" className="text-[10px] uppercase tracking-widest">
                            En: {item.deposito_nombre}
                          </Text>
                        </div>
                        <div className="w-32">
                          <Text variant="muted" className="text-[9px] uppercase tracking-widest mb-1 text-center">
                            Cantidad
                          </Text>
                          <Input
                            type="number"
                            value={item.cantidad}
                            onChange={(e) =>
                              updateItemCantidad(idx, e.target.value)
                            }
                            className="text-center font-black"
                            min="1"
                            max={item.stock_max}
                          />
                          <Text variant="muted" className="text-[8px] text-center mt-1">
                            Stock disp: {item.stock_max}
                          </Text>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          icon={Trash2}
                          onClick={() => removeItem(idx)}
                          className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal de búsqueda de stock */}
          <ProductSearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onSelect={addItem}
            apiFunc={getStockLotes}
            mode="variante"
            placeholder="Buscar por nombre de producto o variante..."
            emptyMessage="No se encontraron productos con stock disponible."
          />
        </div>
      </main>
    </div>
  );
}
