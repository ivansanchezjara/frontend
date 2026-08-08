"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader, Button, Text, Heading, Badge, LoadingScreen,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { getCupon, actualizarCupon, toggleCupon, asignarCupon } from "@/services/apis/cupones";
import { getCuentas } from "@/services/apis/ventas";
import {
  Ticket, ArrowLeft, Save, Power, Users, Clock, Percent, DollarSign,
  ShieldCheck, Package, BarChart3, Calendar, Search, UserPlus, X,
} from "lucide-react";
import Link from "next/link";

export default function DetalleCuponPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [cupon, setCupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCupon();
  }, [id]);

  async function fetchCupon() {
    try {
      setLoading(true);
      const data = await getCupon(id);
      setCupon(data);
    } catch {
      showToast("No se pudo cargar el cupón.", "error");
      router.push("/gestion-comercial/cupones");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle() {
    try {
      await toggleCupon(id);
      showToast(cupon.activo ? "Desactivado" : "Activado", "success");
      fetchCupon();
    } catch {
      showToast("Error al cambiar estado", "error");
    }
  }

  function formatFecha(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-PY", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  if (loading) return <LoadingScreen message="Cargando cupón..." />;
  if (!cupon) return null;

  const stats = cupon.estadisticas || {};

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Gestión Comercial", href: "/gestion-comercial" },
          { label: "Cupones", href: "/gestion-comercial/cupones" },
          { label: cupon.codigo },
        ]}
        subtitle={
          <>
            <Ticket size={12} />
            Detalle del cupón
          </>
        }
        subtitleClassName="text-emerald-600"
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToggle} className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
            <Power size={14} />
            {cupon.activo ? "Desactivar" : "Activar"}
          </Button>
          <Link href="/gestion-comercial/cupones">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft size={14} /> Volver
            </Button>
          </Link>
        </div>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 min-w-0">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Estado general */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                cupon.esta_vigente ? "bg-emerald-100" : "bg-slate-100"
              }`}>
                {cupon.tipo_descuento === "porcentaje" ? (
                  <Percent size={24} className={cupon.esta_vigente ? "text-emerald-600" : "text-slate-400"} />
                ) : (
                  <DollarSign size={24} className={cupon.esta_vigente ? "text-emerald-600" : "text-slate-400"} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Heading level={3} className="tracking-wider font-mono">{cupon.codigo}</Heading>
                  {cupon.activo && cupon.esta_vigente && <Badge variant="success">Vigente</Badge>}
                  {cupon.activo && !cupon.esta_vigente && <Badge variant="danger">Vencido</Badge>}
                  {!cupon.activo && <Badge variant="secondary">Inactivo</Badge>}
                </div>
                {cupon.descripcion && (
                  <Text className="text-slate-500 mt-0.5">{cupon.descripcion}</Text>
                )}
              </div>
              <div className="ml-auto text-right">
                <Text className="text-2xl font-black text-emerald-600">
                  {cupon.tipo_descuento === "porcentaje" ? `${cupon.valor}%` : `US$ ${cupon.valor}`}
                </Text>
                {cupon.descuento_maximo_usd && (
                  <Text variant="bodySm" className="text-slate-400">Máx US$ {cupon.descuento_maximo_usd}</Text>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<BarChart3 size={16} />} label="Usos" value={`${stats.usos_actuales || 0}/${cupon.uso_maximo_global || "∞"}`} />
            <StatCard icon={<Users size={16} />} label="Clientes asignados" value={stats.clientes_asignados || 0} />
            <StatCard icon={<ShieldCheck size={16} />} label="Que lo usaron" value={stats.clientes_que_usaron || 0} />
            <StatCard icon={<Clock size={16} />} label="Días restantes" value={stats.dias_restantes || 0} />
          </div>

          {/* Detalles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vigencia */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Calendar size={14} className="text-emerald-600" />
                <Text className="font-bold text-slate-700">Vigencia</Text>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Desde</span>
                  <span className="font-medium">{formatFecha(cupon.fecha_inicio)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hasta</span>
                  <span className="font-medium">{formatFecha(cupon.fecha_fin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monto mínimo</span>
                  <span className="font-medium">
                    {parseFloat(cupon.monto_minimo_usd) > 0 ? `US$ ${cupon.monto_minimo_usd}` : "Sin mínimo"}
                  </span>
                </div>
              </div>
            </section>

            {/* Restricciones */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Package size={14} className="text-emerald-600" />
                <Text className="font-bold text-slate-700">Restricciones</Text>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Alcance</span>
                  <span className="font-medium">{cupon.es_global ? "Global" : "Solo asignados"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Primera compra</span>
                  <span className="font-medium">{cupon.solo_primera_compra ? "Sí" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Usos/cliente</span>
                  <span className="font-medium">{cupon.uso_maximo_por_cliente}</span>
                </div>
                {cupon.marcas?.length > 0 && (
                  <div>
                    <span className="text-slate-500 block mb-1">Marcas:</span>
                    <div className="flex flex-wrap gap-1">
                      {cupon.marcas.map((m) => (
                        <span key={m} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{m}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Clientes asignados + Asignar */}
          <AsignarClientesSection
            cupon={cupon}
            onAsignado={fetchCupon}
            showToast={showToast}
          />
        </div>
      </main>
    </div>
  );
}

function AsignarClientesSection({ cupon, onAsignado, showToast }) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [asignando, setAsignando] = useState(false);

  async function buscarClientes() {
    if (!busqueda.trim()) return;
    try {
      setBuscando(true);
      const data = await getCuentas({ search: busqueda.trim() });
      const lista = data.results || data;
      // Excluir los ya asignados
      const asignadosIds = new Set((cupon.clientes_asignados || []).map((a) => a.cuenta__id));
      setResultados(lista.filter((c) => !asignadosIds.has(c.id)));
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }

  async function handleAsignar(cuentaId) {
    try {
      setAsignando(true);
      await asignarCupon(cupon.id, [cuentaId]);
      showToast("Cliente asignado al cupón", "success");
      setResultados((prev) => prev.filter((c) => c.id !== cuentaId));
      onAsignado();
    } catch {
      showToast("Error al asignar", "error");
    } finally {
      setAsignando(false);
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-emerald-600" />
          <Text className="font-bold text-slate-700">Clientes Asignados</Text>
          {!cupon.es_global && (
            <Badge variant="outline" className="text-[10px]">Solo asignados</Badge>
          )}
        </div>
      </div>

      {/* Lista de asignados */}
      {cupon.clientes_asignados?.length > 0 ? (
        <div className="space-y-2">
          {cupon.clientes_asignados.map((asig) => (
            <div key={asig.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
              <span className="text-slate-700">{asig.cuenta__razon_social}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  Usos: {asig.veces_usado}
                </span>
                {asig.usado ? (
                  <Badge variant="secondary" className="text-[10px]">Usado</Badge>
                ) : (
                  <Badge variant="success" className="text-[10px]">Disponible</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Text variant="bodySm" className="text-slate-400">
          {cupon.es_global
            ? "Este cupón es global — todos los clientes pueden usarlo."
            : "No hay clientes asignados. Buscá y asigná clientes abajo."}
        </Text>
      )}

      {/* Buscador para asignar */}
      <div className="pt-3 border-t border-slate-100">
        <Text variant="bodySm" className="font-bold text-slate-600 mb-2">Asignar a clientes</Text>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscarClientes(); } }}
              placeholder="Buscar por nombre o RUC..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={buscarClientes}
            disabled={buscando || !busqueda.trim()}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            {buscando ? "..." : "Buscar"}
          </Button>
        </div>

        {/* Resultados */}
        {resultados.length > 0 && (
          <div className="mt-3 max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
            {resultados.map((cuenta) => (
              <div key={cuenta.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50">
                <div>
                  <Text variant="bodySm" className="font-medium text-slate-700">{cuenta.razon_social}</Text>
                  {cuenta.ruc && <Text variant="bodyXs" className="text-slate-400">{cuenta.ruc}</Text>}
                </div>
                <button
                  onClick={() => handleAsignar(cuenta.id)}
                  disabled={asignando}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                >
                  <UserPlus size={12} />
                  Asignar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
      <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">
        {icon}
        <Text variant="bodySm" className="text-slate-500">{label}</Text>
      </div>
      <Text className="text-xl font-black text-slate-800">{value}</Text>
    </div>
  );
}
