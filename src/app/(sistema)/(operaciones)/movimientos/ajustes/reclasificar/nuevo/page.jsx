"use client";
import { PageHeader, Button, Heading, Text, Input } from '@/components/ui';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Package,
  Shuffle,
  ArrowRight,
  MapPin,
  Plus,
  Trash2,
} from "lucide-react";
import ProductSearchModal from "@/components/movimientos/ProductSearchModal";
import SelectedProductCard from "@/components/movimientos/SelectedProductCard";
import { useApi } from "@/hooks/useApi";
import { getStockLotes } from "@/services/apis/inventario";
import { getDepositos, crearAjuste } from "@/services/apis/movimientos";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";

export default function NuevaReclasificacionPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { execute: fetchDepositos } = useApi(getDepositos, { auto: false });
  const { execute: fetchVarianteLotes } = useApi(getStockLotes, {
    auto: false,
    initialData: { results: [] },
  });

  const { loading: isSubmitting, execute: submitAjuste } = useApi(crearAjuste, {
    auto: false,
  });

  // --- ESTADO LOCAL ---
  const [depositos, setDepositos] = useState([]);
  const [selectedDeposito, setSelectedDeposito] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [selectedVariante, setSelectedVariante] = useState(null);
  const [lotes, setLotes] = useState([]); // Lotes disponibles de la variante en el depósito
  const [items, setItems] = useState([]); // Líneas de reclasificación

  // Cargar depósitos al montar
  useEffect(() => {
    async function loadDepositos() {
      try {
        const data = await fetchDepositos();
        setDepositos(data?.results || data || []);
      } catch (err) {
        setDepositos([]);
      }
    }
    loadDepositos();
  }, []);

  const handleDepositoChange = (e) => {
    setSelectedDeposito(e.target.value);
    // Limpiar selección de producto y lotes al cambiar depósito
    setSelectedVariante(null);
    setLotes([]);
    setItems([]);
  };

  const selectVariante = async (v) => {
    setSelectedVariante(v);
    setIsSearchOpen(false);
    setItems([]);

    try {
      const data = await fetchVarianteLotes({ variante: v.id, deposito: selectedDeposito, limit: 1000 });
      const lotesFetch = data?.results || data || [];
      setLotes(
        lotesFetch.map((l) => ({
          id: l.id,
          lote_codigo: l.lote_codigo,
          deposito_nombre: l.deposito_nombre,
          cantidad: l.cantidad,
          vencimiento: l.vencimiento || "",
        }))
      );
    } catch (err) {
      setLotes([]);
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), lote_origen: "", lote_destino: "", nuevo_lote_codigo: "", cantidad: "", useNewLote: false },
    ]);
  };

  const removeItem = (itemId) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateItem = (itemId, field, value) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const updated = { ...item, [field]: value };
        if (field === "useNewLote") {
          if (value) updated.lote_destino = "";
          else updated.nuevo_lote_codigo = "";
        }
        return updated;
      })
    );
  };

  const getOrigenStock = (loteOrigenId) => {
    const lote = lotes.find((l) => l.id === Number(loteOrigenId));
    return lote ? lote.cantidad : 0;
  };

  const hasValidItems = items.length > 0 && items.every((item) => {
    const hasOrigen = item.lote_origen !== "";
    const hasDestino = item.useNewLote ? item.nuevo_lote_codigo.trim() !== "" : item.lote_destino !== "";
    const hasCantidad = item.cantidad !== "" && Number(item.cantidad) >= 1;
    return hasOrigen && hasDestino && hasCantidad;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVariante || !selectedDeposito || isSubmitting) return;

    if (!motivo.trim()) {
      showToast("Debes describir el motivo de la reclasificación.", "error");
      return;
    }

    if (items.length === 0) {
      showToast("Debes agregar al menos una línea de reclasificación.", "error");
      return;
    }

    // Validar stock suficiente por lote origen
    const cantidadPorOrigen = {};
    for (const item of items) {
      const origenId = Number(item.lote_origen);
      cantidadPorOrigen[origenId] = (cantidadPorOrigen[origenId] || 0) + Number(item.cantidad);
    }
    for (const [origenId, totalSolicitado] of Object.entries(cantidadPorOrigen)) {
      const stockDisponible = getOrigenStock(Number(origenId));
      if (totalSolicitado > stockDisponible) {
        const lote = lotes.find((l) => l.id === Number(origenId));
        showToast(
          `Stock insuficiente en lote '${lote?.lote_codigo}'. Disponible: ${stockDisponible}, Solicitado: ${totalSolicitado}.`,
          "error"
        );
        return;
      }
    }

    const isConfirmed = await confirm(
      "¿Guardar esta reclasificación? Quedará en estado borrador hasta ser aprobada.",
      "Guardar Reclasificación"
    );

    if (!isConfirmed) return;

    const payload = {
      variante: selectedVariante.id,
      motivo,
      observaciones,
      items: items.map((item) => ({
        lote_origen: Number(item.lote_origen),
        ...(item.useNewLote
          ? { nuevo_lote_codigo: item.nuevo_lote_codigo }
          : { lote_destino: Number(item.lote_destino) }),
        cantidad: Number(item.cantidad),
      })),
    };

    try {
      await submitAjuste(payload);
      showToast("Reclasificación guardada con éxito", "success");
      router.push("/movimientos/ajustes/reclasificar");
    } catch (error) {
      showToast("Error al guardar la reclasificación", "error");
    }
  };

  const depositoNombre = depositos.find(d => d.id === Number(selectedDeposito))?.nombre || '';

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Reclasificar Inventario", href: "/movimientos/ajustes/reclasificar" },
          { label: "Nueva Reclasificación" },
        ]}
        subtitle={
          <>
            <Shuffle size={12} />
            Mover unidades entre lotes dentro de un mismo depósito.
          </>
        }
      >
        <Button
          disabled={isSubmitting || !selectedVariante || !selectedDeposito || !hasValidItems || !motivo.trim()}
          onClick={handleSubmit}
          variant="primary"
          className="uppercase tracking-widest font-black"
        >
          {isSubmitting ? "GUARDANDO..." : "GUARDAR"}
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* SECCIÓN 1: DEPÓSITO */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <Heading level={3} className="text-xs text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <MapPin size={14} /> Depósito
            </Heading>

            <div className="max-w-md">
              <select
                value={selectedDeposito}
                onChange={handleDepositoChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              >
                <option value="">Seleccionar depósito...</option>
                {depositos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
              <Text variant="bodyXs" className="text-slate-400 mt-2">
                Los movimientos de lotes se realizarán dentro de este depósito.
              </Text>
            </div>
          </div>

          {/* SECCIÓN 2: PRODUCTO (solo si hay depósito) */}
          {selectedDeposito && (
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
              <Heading level={3} className="text-xs text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Package size={14} /> Producto
              </Heading>

              {!selectedVariante ? (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="w-full p-10 border-2 border-dashed border-slate-200 rounded-[24px] text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all flex flex-col items-center gap-4 bg-slate-50/50"
                >
                  <Search size={40} className="opacity-20" />
                  <Text variant="label" className="uppercase tracking-widest">
                    Click para buscar producto en stock
                  </Text>
                </button>
              ) : (
                <SelectedProductCard
                  codigo={selectedVariante.product_code}
                  titulo={selectedVariante.producto_nombre}
                  subtitulo={selectedVariante.nombre_variante}
                  onClear={() => {
                    setSelectedVariante(null);
                    setLotes([]);
                    setItems([]);
                  }}
                />
              )}

              {selectedVariante && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <Input
                    label="Motivo de la reclasificación"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej: Reorganización de lotes, Error de asignación..."
                  />
                  <Input
                    label="Observaciones (opcional)"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Comentarios adicionales..."
                  />
                </div>
              )}
            </div>
          )}

          {/* SECCIÓN 3: LÍNEAS DE RECLASIFICACIÓN */}
          {selectedVariante && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Heading level={3} className="text-xs text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                  <Shuffle size={14} /> Movimientos entre Lotes
                  {depositoNombre && (
                    <span className="text-blue-500 ml-2">— {depositoNombre}</span>
                  )}
                </Heading>
                <Button
                  onClick={addItem}
                  variant="secondary"
                  className="text-[10px] uppercase tracking-widest font-black"
                  disabled={lotes.filter((l) => l.cantidad > 0).length === 0}
                >
                  <Plus size={14} /> Agregar Línea
                </Button>
              </div>

              {lotes.filter((l) => l.cantidad > 0).length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50/50">
                  <Text variant="label" className="text-slate-400 uppercase tracking-widest">
                    No hay lotes con stock para este producto en el depósito seleccionado
                  </Text>
                </div>
              ) : items.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50/50">
                  <Text variant="label" className="text-slate-400 uppercase tracking-widest">
                    Agregá una línea para mover stock entre lotes
                  </Text>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <Text variant="label" className="text-xs uppercase tracking-widest text-slate-400">
                          Línea {idx + 1}
                        </Text>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-rose-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] gap-4 items-end">
                        {/* Lote Origen */}
                        <div className="space-y-2">
                          <Text variant="label" className="text-[10px] uppercase tracking-widest text-slate-500">
                            Lote Origen
                          </Text>
                          <select
                            value={item.lote_origen}
                            onChange={(e) => updateItem(item.id, "lote_origen", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                          >
                            <option value="">Seleccionar lote...</option>
                            {lotes
                              .filter((l) => l.cantidad > 0)
                              .map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.lote_codigo} ({l.cantidad} u.)
                                </option>
                              ))}
                          </select>
                          {item.lote_origen && (
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <MapPin size={12} />
                              <span>Stock disponible: {getOrigenStock(item.lote_origen)} u.</span>
                            </div>
                          )}
                        </div>

                        {/* Flecha */}
                        <div className="hidden md:flex items-center justify-center pb-6">
                          <ArrowRight size={20} className="text-blue-400" />
                        </div>

                        {/* Lote Destino */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Text variant="label" className="text-[10px] uppercase tracking-widest text-slate-500">
                              Lote Destino
                            </Text>
                            <button
                              type="button"
                              onClick={() => updateItem(item.id, "useNewLote", !item.useNewLote)}
                              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                            >
                              {item.useNewLote ? "Usar existente" : "Crear nuevo"}
                            </button>
                          </div>

                          {item.useNewLote ? (
                            <input
                              type="text"
                              value={item.nuevo_lote_codigo}
                              onChange={(e) => updateItem(item.id, "nuevo_lote_codigo", e.target.value)}
                              placeholder="Código del nuevo lote..."
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                            />
                          ) : (
                            <select
                              value={item.lote_destino}
                              onChange={(e) => updateItem(item.id, "lote_destino", e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                            >
                              <option value="">Seleccionar lote destino...</option>
                              {lotes
                                .filter((l) => l.id !== Number(item.lote_origen))
                                .map((l) => (
                                  <option key={l.id} value={l.id}>
                                    {l.lote_codigo} ({l.cantidad} u.)
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>

                        {/* Cantidad */}
                        <div className="space-y-2">
                          <Text variant="label" className="text-[10px] uppercase tracking-widest text-slate-500">
                            Cantidad
                          </Text>
                          <input
                            type="number"
                            min="1"
                            max={item.lote_origen ? getOrigenStock(item.lote_origen) : undefined}
                            value={item.cantidad}
                            onChange={(e) => updateItem(item.id, "cantidad", e.target.value)}
                            placeholder="0"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {isSearchOpen && (
          <ProductSearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            mode="variante"
            onSelect={(item) => {
              selectVariante({
                id: item.variante,
                product_code: item.variante_codigo,
                producto_nombre: item.variante_nombre,
                nombre_variante: item.nombre_variante,
              });
            }}
            apiFunc={getStockLotes}
            extraParams={{ deposito: selectedDeposito }}
          />
        )}
      </main>
    </div>
  );
}
