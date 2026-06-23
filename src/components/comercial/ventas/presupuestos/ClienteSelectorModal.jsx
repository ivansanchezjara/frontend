"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, User, Loader2, ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { getClientes, crearPresupuestoDirecto } from "@/services/apis/ventas";

/**
 * Modal para seleccionar un cliente y crear un presupuesto directo (venta rápida).
 *
 * Props:
 * - open: boolean — controla visibilidad del modal
 * - onClose: () => void — callback para cerrar el modal
 */
export default function ClienteSelectorModal({ open, onClose }) {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebounce(searchTerm, 400);

  // Buscar clientes cuando el término debounced cambia
  useEffect(() => {
    if (!open) return;

    if (debouncedSearch.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchClientes() {
      setLoading(true);
      setError(null);
      try {
        const data = await getClientes({ search: debouncedSearch });
        if (!cancelled) {
          setResults(data.results || data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Error al buscar clientes");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchClientes();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, open]);

  // Resetear estado al cerrar
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setResults([]);
      setLoading(false);
      setCreating(false);
      setError(null);
    }
  }, [open]);

  async function handleSelectCliente(cliente) {
    setCreating(true);
    setError(null);
    try {
      const presupuesto = await crearPresupuestoDirecto({
        cliente_id: cliente.id,
      });
      onClose();
      router.push(`/ventas-crm/presupuestos/${presupuesto.id}`);
    } catch (err) {
      setError("Error al crear presupuesto");
      setCreating(false);
    }
  }

  const showEmptyState =
    !loading && debouncedSearch.length >= 2 && results.length === 0;

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Presupuesto" size="md">
      <div className="p-6 space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cliente por nombre o RUC/CI..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            autoFocus
            disabled={creating}
          />
        </div>

        {/* Loading overlay when creating */}
        {creating && (
          <div className="flex items-center justify-center py-8 gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
            <span>Creando presupuesto...</span>
          </div>
        )}

        {/* Error state */}
        {error && !creating && (
          <p className="text-sm text-red-500 text-center py-2">{error}</p>
        )}

        {/* Results list */}
        {!creating && !showEmptyState && results.length > 0 && (
          <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-lg">
            {results.map((cliente) => (
              <li key={cliente.id}>
                <button
                  type="button"
                  onClick={() => handleSelectCliente(cliente)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {cliente.razon_social}
                    </p>
                    <p className="text-xs text-slate-500">
                      {cliente.ruc || cliente.ci || "Sin documento"}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Loading search results */}
        {loading && !creating && (
          <div className="flex items-center justify-center py-6 gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Buscando...</span>
          </div>
        )}

        {/* Empty state */}
        {showEmptyState && !creating && (
          <div className="text-center py-8 space-y-3">
            <User className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-500">
              No se encontraron clientes
            </p>
            <Link
              href="/ventas-crm/clientes"
              className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Crear un cliente primero
            </Link>
          </div>
        )}

        {/* Initial state — hint */}
        {!creating &&
          !loading &&
          !showEmptyState &&
          results.length === 0 &&
          debouncedSearch.length < 2 && (
            <p className="text-sm text-slate-400 text-center py-6">
              Escribí al menos 2 caracteres para buscar
            </p>
          )}
      </div>
    </Modal>
  );
}
