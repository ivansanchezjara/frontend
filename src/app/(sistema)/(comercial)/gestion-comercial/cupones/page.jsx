"use client";
import { useState, useEffect, useCallback } from "react";
import {
  PageHeader, SearchBar, LoadingScreen, Text, Heading, Button, Badge, Modal, Input,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { getCupones, toggleCupon, eliminarCupon } from "@/services/apis/cupones";
import {
  Ticket, Plus, Power, Trash2, Eye, Percent, DollarSign, Clock,
  Users, ShieldCheck, AlertTriangle, Search, Filter,
} from "lucide-react";
import Link from "next/link";

const FILTROS_ESTADO = [
  { id: "", label: "Todos" },
  { id: "vigentes", label: "Vigentes" },
  { id: "activos", label: "Activos" },
  { id: "vencidos", label: "Vencidos" },
  { id: "inactivos", label: "Inactivos" },
];

export default function CuponesPage() {
  const { showToast } = useToast();
  const [cupones, setCupones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const busquedaDebounced = useDebounce(busqueda, 400);

  const fetchCupones = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (busquedaDebounced) params.buscar = busquedaDebounced;
      const data = await getCupones(params);
      setCupones(data);
    } catch (err) {
      showToast("No se pudieron cargar los cupones.", "error");
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, busquedaDebounced, showToast]);

  useEffect(() => {
    fetchCupones();
  }, [fetchCupones]);

  async function handleToggle(cupon) {
    try {
      await toggleCupon(cupon.id);
      showToast(cupon.activo ? "Cupón desactivado" : "Cupón activado", "success");
      fetchCupones();
    } catch {
      showToast("No se pudo cambiar el estado.", "error");
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await eliminarCupon(confirmDelete.id);
      showToast("Cupón eliminado", "success");
      setConfirmDelete(null);
      fetchCupones();
    } catch {
      showToast("No se pudo eliminar.", "error");
    }
  }

  function getEstadoBadge(cupon) {
    if (!cupon.activo) return <Badge variant="secondary">Inactivo</Badge>;
    if (cupon.esta_vigente) return <Badge variant="success">Vigente</Badge>;
    return <Badge variant="danger">Vencido</Badge>;
  }

  function formatFecha(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-PY", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Gestión Comercial", href: "/gestion-comercial" },
          { label: "Cupones de Descuento" },
        ]}
        subtitle={
          <>
            <Ticket size={12} />
            Crear, administrar y asignar cupones de descuento
          </>
        }
        subtitleClassName="text-emerald-600"
      >
        <Link href="/gestion-comercial/cupones/nuevo">
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-emerald-200">
            <Plus size={14} /> Nuevo Cupón
          </Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por código..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
                />
              </div>
            </div>
            <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
              {FILTROS_ESTADO.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltroEstado(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filtroEstado === f.id
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingScreen message="Cargando cupones..." />
            </div>
          ) : cupones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <Ticket size={28} className="text-emerald-300" />
              </div>
              <Heading level={5} className="text-slate-600">No hay cupones</Heading>
              <Text variant="bodySm" className="mt-2 text-slate-400 max-w-sm">
                {busqueda
                  ? "No se encontraron cupones con ese código."
                  : "Creá tu primer cupón de descuento para tus clientes del e-commerce."}
              </Text>
              {!busqueda && (
                <Link href="/gestion-comercial/cupones/nuevo" className="mt-4">
                  <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-emerald-200">
                    <Plus size={14} /> Crear primer cupón
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {cupones.map((cupon) => (
                <div
                  key={cupon.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Icono */}
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${
                      cupon.activo && cupon.esta_vigente ? "bg-emerald-100" : "bg-slate-100"
                    }`}>
                      {cupon.tipo_descuento === "porcentaje" ? (
                        <Percent size={20} className={cupon.esta_vigente ? "text-emerald-600" : "text-slate-400"} />
                      ) : (
                        <DollarSign size={20} className={cupon.esta_vigente ? "text-emerald-600" : "text-slate-400"} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-sm font-bold text-slate-800 tracking-wider">
                          {cupon.codigo}
                        </code>
                        {getEstadoBadge(cupon)}
                        {cupon.es_global && (
                          <Badge variant="outline" className="text-[10px]">
                            <Users size={9} className="mr-0.5" /> Global
                          </Badge>
                        )}
                        {cupon.solo_primera_compra && (
                          <Badge variant="outline" className="text-[10px]">
                            <ShieldCheck size={9} className="mr-0.5" /> 1ª compra
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                        <span className="font-bold text-slate-700">
                          {cupon.tipo_descuento === "porcentaje"
                            ? `${cupon.valor}% OFF`
                            : `US$ ${cupon.valor} OFF`}
                          {cupon.descuento_maximo_usd && ` (máx US$ ${cupon.descuento_maximo_usd})`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {formatFecha(cupon.fecha_inicio)} → {formatFecha(cupon.fecha_fin)}
                        </span>
                        <span>
                          Usos: {cupon.usos_actuales}/{cupon.uso_maximo_global || "∞"}
                        </span>
                        {cupon.monto_minimo_usd > 0 && (
                          <span>Mín: US$ {parseFloat(cupon.monto_minimo_usd).toFixed(0)}</span>
                        )}
                      </div>

                      {cupon.descripcion && (
                        <Text variant="bodySm" className="mt-1 text-slate-400 truncate">
                          {cupon.descripcion}
                        </Text>
                      )}

                      {cupon.categorias_nombres?.length > 0 && (
                        <div className="mt-1.5 flex gap-1 flex-wrap">
                          {cupon.categorias_nombres.map((cat) => (
                            <span key={cat} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link href={`/gestion-comercial/cupones/${cupon.id}`}>
                        <button className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <Eye size={16} />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleToggle(cupon)}
                        className={`p-2 rounded-lg transition-colors ${
                          cupon.activo
                            ? "text-amber-500 hover:bg-amber-50"
                            : "text-emerald-500 hover:bg-emerald-50"
                        }`}
                        title={cupon.activo ? "Desactivar" : "Activar"}
                      >
                        <Power size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(cupon)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de confirmación */}
      {confirmDelete && (
        <Modal open onClose={() => setConfirmDelete(null)} title="Eliminar Cupón">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
              <AlertTriangle size={20} className="text-red-500" />
              <Text variant="bodySm" className="text-red-700">
                ¿Desactivar el cupón <strong>{confirmDelete.codigo}</strong>? Los clientes ya no podrán usarlo.
              </Text>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Desactivar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
