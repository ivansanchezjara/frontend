"use client";
import { useState, useEffect } from "react";
import { getProductos } from "@/services/apis/catalogo.js";
import { useApi } from "@/hooks/useApi";
import { Package, Check } from "lucide-react";
import { Button, Heading, Text, SearchBar } from "@/components/ui";

export default function BulkAssignModal({
  isOpen,
  onClose,
  onAssign,
  selectedCount,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]); // Array de IDs (pueden ser productos o variantes)
  const [targetType, setTargetType] = useState("gallery"); // 'gallery', 'product_main', 'variant_main'

  const {
    data: productosData,
    loading,
    execute: refetchProductos,
  } = useApi(getProductos, {
    auto: false,
    initialData: [],
  });

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
      setTargetType("gallery");
      refetchProductos();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Procesar datos para extraer resultados
  const productos = Array.isArray(productosData?.results)
    ? productosData.results
    : Array.isArray(productosData)
      ? productosData
      : [];

  const handleAssignClick = () => {
    if (selectedIds.length === 0) return;
    onAssign(selectedIds, targetType);
  };

  const toggleId = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((vId) => vId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredProductos = productos.filter(
    (p) =>
      p.nombre_general.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.variants.some(
        (v) =>
          v.nombre_variante.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.product_code.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <Heading level={4}>
            Asignación de Medios
          </Heading>
          <Text variant="bodySm" className="mt-1">
            Vas a asignar <strong className="font-semibold text-slate-700">{selectedCount}</strong>{" "}
            {selectedCount === 1 ? "imagen" : "imágenes"} al catálogo.
          </Text>
        </div>

        {/* Selector de tipo de asignación */}
        <div className="px-6 py-4 bg-white border-b border-slate-100 flex gap-2">
          {[
            { id: "gallery", label: "Galería Extra" },
            { id: "variant_main", label: "Imagen SKU" },
            { id: "product_main", label: "Principal Producto" },
          ].map((type) => (
            <Button
              key={type.id}
              onClick={() => setTargetType(type.id)}
              variant={targetType === type.id ? "primary" : "secondary"}
              size="sm"
              className="flex-1"
            >
              {type.label}
            </Button>
          ))}
        </div>

        <div className="p-4 border-b border-slate-100">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar producto o SKU..."
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-10 text-center text-slate-400 text-xs font-bold animate-pulse">
              Cargando catálogo...
            </div>
          ) : (
            <div className="space-y-1">
              {filteredProductos.map((p) => (
                <div key={p.id} className="space-y-1">
                  {targetType === "product_main" ? (
                    <button
                      onClick={() => toggleId(p.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left border ${selectedIds.includes(p.id) ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500/10" : "hover:bg-slate-50 border-transparent"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs overflow-hidden">
                          {p.imagen_principal_url ? (
                            <img
                              src={p.imagen_principal_url}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={14} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">
                            {p.nombre_general}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
                            {p.general_code}
                          </p>
                        </div>
                      </div>
                      {selectedIds.includes(p.id) && (
                        <Check size={16} className="text-blue-500" />
                      )}
                    </button>
                  ) : (
                    <>
                      <Text
                        variant="label"
                        className="px-3 py-1.5 bg-slate-50/50 rounded-lg"
                      >
                        {p.nombre_general}
                      </Text>
                      {p.variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => toggleId(v.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left border ${selectedIds.includes(v.id) ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500/10" : "hover:bg-slate-50 border-transparent"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs overflow-hidden">
                              {v.imagen_url ? (
                                <img
                                  src={v.imagen_url}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package size={14} className="text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-700">
                                {v.nombre_variante}
                              </p>
                              <p className="text-[10px] font-mono text-slate-400">
                                {v.product_code}
                              </p>
                            </div>
                          </div>
                          {selectedIds.includes(v.id) && (
                            <Check size={16} className="text-blue-500" />
                          )}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            disabled={selectedIds.length === 0}
            onClick={handleAssignClick}
            variant="primary"
            className="flex-1"
          >
            Asignar a {selectedIds.length}{" "}
            {selectedIds.length === 1 ? "elemento" : "elementos"}
          </Button>
        </div>
      </div>
    </div>
  );
}
