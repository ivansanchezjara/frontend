"use client";
import { LoadingScreen, PageHeader, Text, Heading, Button } from '@/components/ui';
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Search, Check, MapPin, Trash2, Package } from "lucide-react";
import ProductSearchModal from "@/components/movimientos/ProductSearchModal";
import { useApi } from "@/hooks/useApi";
import { getDepositos, getTransferencia, actualizarTransferencia } from "@/services/apis/movimientos";
import { getStockLotes } from "@/services/apis/inventario";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";

export default function EditarTransferenciaPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [stockLotes, setStockLotes] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [transf, setTransf] = useState({
    deposito_origen: "",
    deposito_destino: "",
    observaciones: "",
  });

  const [items, setItems] = useState([]);

  // Cargar la transferencia existente
  const { data: transfData, loading: loadingTransf } = useApi(getTransferencia, {
    auto: true,
    args: [id],
  });

  const { execute: fetchStock } = useApi(getStockLotes);
  const { execute: fetchDepositos } = useApi(getDepositos);
  const { execute: updateAction, loading: isSubmitting } = useApi(actualizarTransferencia, {
    auto: false,
  });

  // Cargar datos auxiliares
  useEffect(() => {
    async function loadData() {
      try {
        const [dataStock, dDep] = await Promise.all([
          fetchStock(),
          fetchDepositos(),
        ]);

        if (dataStock) {
          setStockLotes(
            Array.isArray(dataStock) ? dataStock : dataStock.results || [],
          );
        }
        if (dDep) {
          setDepositos(Array.isArray(dDep) ? dDep : dDep.results || []);
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    }
    loadData();
  }, []);

  // Pre-poblar datos cuando se carga la transferencia
  useEffect(() => {
    if (transfData) {
      setTransf({
        deposito_origen: transfData.deposito_origen || "",
        deposito_destino: transfData.deposito_destino || "",
        observaciones: transfData.observaciones || "",
      });

      if (transfData.items) {
        setItems(
          transfData.items.map((item) => ({
            lote_origen: item.lote_origen,
            lote_codigo: item.lote_codigo,
            variante_nombre: item.variante_nombre,
            nombre_variante: item.variante_codigo,
            stock_disponible: null, // Se actualizará con stockLotes
            cantidad: item.cantidad,
          }))
        );
      }
    }
  }, [transfData]);

  // Actualizar stock disponible cuando se cargan los lotes
  useEffect(() => {
    if (stockLotes.length > 0 && items.length > 0) {
      setItems((prev) =>
        prev.map((item) => {
          const lote = stockLotes.find((l) => l.id === item.lote_origen);
          return {
            ...item,
            stock_disponible: lote ? lote.cantidad + item.cantidad : item.stock_disponible,
          };
        })
      );
    }
  }, [stockLotes]);

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setTransf((prev) => ({ ...prev, [name]: value }));

    if (name === "deposito_origen") {
      setItems([]);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = (lote) => {
    if (items.some((i) => i.lote_origen === lote.id)) {
      showToast("Este lote ya ha sido agregado.", "info");
      return;
    }

    const newItem = {
      lote_origen: lote.id,
      lote_codigo: lote.lote_codigo,
      variante_nombre: lote.variante_nombre,
      nombre_variante: lote.nombre_variante,
      stock_disponible: lote.cantidad,
      cantidad: 1,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !transf.deposito_origen ||
      !transf.deposito_destino ||
      items.length === 0 ||
      isSubmitting
    )
      return;

    if (transf.deposito_origen === transf.deposito_destino) {
      showToast("El depósito de destino no puede ser el mismo que el de origen.", "error");
      return;
    }

    for (const item of items) {
      if (!item.cantidad || item.cantidad <= 0) {
        showToast(`La cantidad para ${item.lote_codigo} debe ser mayor a 0.`, "error");
        return;
      }
      if (item.stock_disponible && item.cantidad > item.stock_disponible) {
        showToast(
          `Stock insuficiente para ${item.lote_codigo}. Máximo: ${item.stock_disponible}`,
          "error",
        );
        return;
      }
    }

    const confirmed = await confirm(
      "¿Estás seguro de guardar los cambios en esta transferencia?",
      "Guardar Cambios"
    );
    if (!confirmed) return;

    try {
      const payload = {
        deposito_origen: transf.deposito_origen,
        deposito_destino: transf.deposito_destino,
        observaciones: transf.observaciones,
        items: items.map((i) => ({
          lote_origen: i.lote_origen,
          cantidad: Number(i.cantidad),
        })),
      };

      await updateAction(id, payload);
      showToast("Transferencia actualizada con éxito.", "success");
      router.push("/movimientos/transferencias");
    } catch (error) {
      // Error handling is managed by useApi / useErrorHandler
    }
  };

  if (loadingTransf) {
    return <LoadingScreen message="Cargando transferencia..." />;
  }

  if (!transfData) {
    return (
      <div className="p-20 text-center font-black uppercase text-slate-400 h-screen flex items-center justify-center">
        Transferencia no encontrada
      </div>
    );
  }

  if (transfData.estado !== "BORRADOR") {
    return (
      <div className="p-20 text-center font-black uppercase text-slate-400 h-screen flex items-center justify-center flex-col gap-4">
        <Text variant="muted" className="mb-4">Solo se pueden editar transferencias en estado BORRADOR</Text>
        <Button
          onClick={() => router.push("/movimientos/transferencias")}
          variant="primary"
          className="uppercase tracking-widest"
        >
          Volver a Transferencias
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Transferencias Internas", href: "/movimientos/transferencias" },
          { label: `Editar Transferencia #${id}` },
        ]}
        subtitle={
          <>
            <Package size={12} />
            Editá los datos de esta transferencia antes de aprobarla.
          </>
        }
      >
        <button
          disabled={
            isSubmitting ||
            !transf.deposito_origen ||
            !transf.deposito_destino ||
            items.length === 0
          }
          onClick={handleSubmit}
          className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg ${!transf.deposito_origen || !transf.deposito_destino || items.length === 0 ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100"}`}
        >
          {isSubmitting ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
        </button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Cabecera: Depósitos */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <Heading level={6} className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <MapPin size={14} className="text-slate-400" /> Definición de Depósitos
            </Heading>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-700">
              <div>
                <Text variant="label" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Depósito de Origen
                </Text>
                <select
                  name="deposito_origen"
                  value={transf.deposito_origen}
                  onChange={handleHeaderChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[20px] p-4 font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
                >
                  <option value="">Seleccionar origen...</option>
                  {depositos.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Text variant="label" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Depósito de Destino
                </Text>
                <select
                  name="deposito_destino"
                  value={transf.deposito_destino}
                  onChange={handleHeaderChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[20px] p-4 font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
                >
                  <option value="">Seleccionar destino...</option>
                  {depositos
                    .filter((d) => d.id !== parseInt(transf.deposito_origen))
                    .map((dep) => (
                      <option key={dep.id} value={dep.id}>
                        {dep.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <Text variant="label" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Notas del movimiento
                </Text>
                <textarea
                  name="observaciones"
                  value={transf.observaciones}
                  onChange={handleHeaderChange}
                  rows="1"
                  placeholder="Ej: Reposición de stock mensual..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-[24px] p-5 font-medium text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Tabla de Items */}
          <div
            className={`bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px] transition-all ${!transf.deposito_origen || !transf.deposito_destino ? "opacity-50 pointer-events-none" : "opacity-100"}`}
          >
            <div className="p-6 border-b border-slate-100 flex flex-col gap-4 md:flex-row md:justify-between md:items-center bg-white sticky top-0 z-20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <Check size={18} />
                </div>
                <div>
                  <Heading level={4} className="text-slate-800 font-black">
                    Productos a Transferir
                  </Heading>
                  <Text as="span" variant="label" className="block text-[11px] text-slate-500 uppercase tracking-widest mt-1">
                    Ítems agregados:{" "}
                    <Text as="span" variant="label" className="font-black text-slate-900">
                      {items.length}
                    </Text>
                  </Text>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
              >
                <Search size={16} /> BUSCAR PRODUCTOS
              </button>
            </div>

            <div className="overflow-auto flex-1">
              <table className="w-full border-collapse text-[11px]">
                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-100 uppercase text-slate-400 font-black">
                  <tr>
                    <th className="p-4 text-left">Producto / Lote</th>
                    <th className="p-4 text-center w-32">Stock Origen</th>
                    <th className="p-4 text-center w-32">Cant. a Mover</th>
                    <th className="p-4 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]"
                      >
                        Usa el botón &quot;Buscar Productos&quot; para agregar ítems de{" "}
                        {depositos.find(
                          (d) => d.id === parseInt(transf.deposito_origen),
                        )?.nombre || "origen"}
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50 transition-all group"
                      >
                        <td className="p-4">
                          <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
                            {item.lote_codigo}
                          </div>
                          <div className="font-black text-slate-800 text-sm">
                            {item.variante_nombre}{" "}
                            <Text as="span" variant="bodySm" className="text-slate-400 font-bold">
                              | {item.nombre_variante}
                            </Text>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-block px-3 py-1 bg-slate-100 rounded-full font-black text-slate-600">
                            {item.stock_disponible != null ? `${item.stock_disponible} unid.` : "—"}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center">
                            <input
                              type="number"
                              min="1"
                              max={item.stock_disponible || undefined}
                              value={item.cantidad}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleItemChange(
                                  idx,
                                  "cantidad",
                                  val === "" ? "" : parseInt(val, 10),
                                );
                              }}
                              className={`w-24 text-center px-3 py-2 border rounded-xl font-black text-sm outline-none focus:ring-2 ${item.stock_disponible && (item.cantidad > item.stock_disponible || !item.cantidad) ? "border-red-500 bg-red-50 text-red-600" : "border-slate-200 bg-white text-slate-900 focus:ring-blue-500/20"}`}
                            />
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => removeItem(idx)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de búsqueda */}
      <ProductSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={addItem}
        lotes={(stockLotes || []).filter((l) => {
          const depositoId =
            typeof l.deposito === "object" ? l.deposito.id : l.deposito;
          const origenId = parseInt(transf.deposito_origen);
          return depositoId === origenId;
        })}
        placeholder={`Buscar stock en ${(depositos || []).find((d) => d.id === parseInt(transf.deposito_origen))?.nombre || "depósito"}...`}
        emptyMessage="No se encontró stock disponible en este depósito."
      />
    </div>
  );
}
