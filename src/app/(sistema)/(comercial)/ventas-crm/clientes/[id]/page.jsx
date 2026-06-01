"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SearchX, Globe, ShoppingBag, Plus } from "lucide-react";
import Link from "next/link";

import ClienteForm from "@/components/ventas/ClienteForm";
import InteraccionTimeline from "@/components/ventas/InteraccionTimeline";
import {
  Button,
  Badge,
  LoadingScreen,
  PageHeader,
  Pagination,
  Section,
  EmptyState,
  useConfirm,
} from "@/components/ui";
import { Heading, Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import {
  getCliente,
  updateCliente,
  habilitarCuentaOnline,
  getInteracciones,
  getVentas,
} from "@/services/apis/ventas";

// ─── Helpers ────────────────────────────────────────────────────

function formatFecha(fechaStr) {
  if (!fechaStr) return "—";
  return new Date(fechaStr).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMonto(monto, moneda = "USD") {
  if (monto == null) return "—";
  if (moneda === "PYG") {
    return `₲ ${Number(monto).toLocaleString("es-PY")}`;
  }
  return `$ ${Number(monto).toFixed(2)}`;
}

const TIER_LABELS = {
  publico: "Público",
  estudiante: "Estudiante",
  reventa: "Reventa",
  mayorista: "Mayorista",
  intercompany: "Intercompany",
};

// ─── Componente de Historial de Compras ─────────────────────────

function HistorialCompras({ clienteId }) {
  const [page, setPage] = useState(1);

  const { data: ventasData, loading: ventasLoading } = useApi(getVentas, {
    auto: true,
    args: [{ cliente: clienteId, estado: "confirmado", page }],
  });

  const ventas = ventasData?.results || [];
  const count = ventasData?.count || 0;

  if (ventasLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (ventas.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          titulo="Sin compras registradas"
          descripcion="Este cliente aún no tiene ventas confirmadas."
          icon="🛒"
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">
                Comprobante
              </th>
              <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">
                Fecha
              </th>
              <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">
                Origen
              </th>
              <th className="text-right py-2 px-3 text-[11px] font-bold uppercase text-slate-400">
                Total USD
              </th>
              <th className="text-right py-2 px-3 text-[11px] font-bold uppercase text-slate-400">
                Total Moneda
              </th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => (
              <tr
                key={venta.id}
                className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
              >
                <td className="py-2.5 px-3">
                  <Link
                    href={`/ventas-crm/ventas/${venta.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {venta.comprobante?.numero
                      ? `#${venta.comprobante.numero}`
                      : `V-${venta.id}`}
                  </Link>
                </td>
                <td className="py-2.5 px-3 text-slate-600">
                  {formatFecha(venta.confirmed_at || venta.created_at)}
                </td>
                <td className="py-2.5 px-3">
                  <Badge variant={venta.origen === "sucursal" ? "primary" : "success"}>
                    {venta.origen}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                  {formatMonto(venta.total_usd, "USD")}
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-500">
                  {formatMonto(venta.total_moneda_negociacion, venta.moneda_negociacion)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        count={count}
        pageSize={24}
        currentPage={page}
        onPageChange={setPage}
      />
    </div>
  );
}

// ─── Página Principal ───────────────────────────────────────────

export default function PerfilClientePage() {
  const { id } = useParams();
  const router = useRouter();
  const { alert: showAlert, danger } = useConfirm();

  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErrors, setSaveErrors] = useState(null);
  const [habilitando, setHabilitando] = useState(false);

  // ─── Fetch cliente ──────────────────────────────────────────
  const handleClienteError = useCallback((err) => {
    if (err.status === 404) setNotFound(true);
  }, []);

  const {
    data: cliente,
    loading,
    execute: refetchCliente,
    setData: setCliente,
  } = useApi(getCliente, {
    auto: false,
    initialData: null,
    args: [id],
    onError: handleClienteError,
  });

  // ─── Fetch interacciones ────────────────────────────────────
  const {
    data: interaccionesData,
    loading: interaccionesLoading,
  } = useApi(getInteracciones, {
    auto: !!id,
    args: [{ cliente: id, ordering: "-fecha" }],
    initialData: null,
  });

  const interacciones = interaccionesData?.results || [];

  useEffect(() => {
    if (id) {
      setNotFound(false);
      refetchCliente();
    }
  }, [id, refetchCliente]);

  // ─── Guardar datos del cliente ──────────────────────────────
  const handleSave = async (formData) => {
    setSaving(true);
    setSaveErrors(null);
    try {
      const updated = await updateCliente(id, formData);
      setCliente(updated);
      showAlert("Datos del cliente actualizados correctamente.", "Éxito");
    } catch (err) {
      if (err?.status === 400 && err?.data) {
        setSaveErrors(err.data);
      } else if (err && typeof err === "object" && !(err instanceof Error)) {
        setSaveErrors(err);
      } else {
        showAlert(err?.message || "Error al guardar.", "Error");
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Habilitar cuenta online ────────────────────────────────
  const handleHabilitarCuenta = async () => {
    const ok = await danger(
      "¿Habilitar la cuenta online para este cliente? Se creará un usuario con acceso al portal.",
      "Habilitar Cuenta Online",
      { confirmText: "Habilitar" }
    );
    if (!ok) return;

    setHabilitando(true);
    try {
      const result = await habilitarCuentaOnline(id);
      setCliente((prev) => ({ ...prev, cuenta_online_habilitada: true }));
      showAlert(
        `Cuenta online habilitada. Contraseña temporal: ${result.password_temporal || "(enviada al correo)"}`,
        "Cuenta Creada"
      );
    } catch (err) {
      showAlert(
        err?.detail || err?.message || "No se pudo habilitar la cuenta online.",
        "Error"
      );
    } finally {
      setHabilitando(false);
    }
  };

  // ─── Estados de carga y error ───────────────────────────────
  if (loading) return <LoadingScreen texto="Cargando perfil del cliente..." />;

  if (notFound) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-6 inline-flex rounded-3xl bg-slate-900 p-4 text-white shadow-2xl shadow-emerald-500/20">
            <SearchX size={44} strokeWidth={2.5} />
          </div>
          <Heading level={3}>Cliente no encontrado</Heading>
          <Text className="mt-2">
            El cliente solicitado no existe o fue desactivado.
          </Text>
          <Button
            as={Link}
            href="/ventas-crm/clientes"
            className="mt-6 bg-slate-900 text-white font-black hover:bg-slate-800 shadow-lg active:scale-[0.98]"
          >
            Volver a Clientes
          </Button>
        </div>
      </main>
    );
  }

  if (!cliente) return null;

  const puedeHabilitarCuenta =
    !cliente.cuenta_online_habilitada && !!cliente.correo_electronico;

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-slate-50/50">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Clientes", href: "/ventas-crm/clientes" },
          { label: cliente.razon_social },
        ]}
        subtitle={
          <span className="flex items-center gap-2">
            <Badge variant="info">{TIER_LABELS[cliente.tier_precio] || cliente.tier_precio}</Badge>
            {cliente.cuenta_online_habilitada && (
              <Badge variant="success">Cuenta Online</Badge>
            )}
          </span>
        }
        subtitleClassName="text-emerald-600"
      >
        {puedeHabilitarCuenta && (
          <Button
            variant="success"
            icon={Globe}
            onClick={handleHabilitarCuenta}
            disabled={habilitando}
            size="sm"
          >
            {habilitando ? "Habilitando..." : "Habilitar Cuenta Online"}
          </Button>
        )}
      </PageHeader>

      {/* Contenido principal */}
      <main className="min-w-0 flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Sección: Datos del Cliente */}
          <Section
            title="Datos del Cliente"
            subtitle="Información completa del cliente. Los campos con * son obligatorios."
            action={
              cliente.ruc && (
                <Text variant="bodyXs" className="text-slate-400">
                  RUC: <span className="font-bold text-slate-600">{cliente.ruc}</span>
                </Text>
              )
            }
          >
            <ClienteForm
              cliente={cliente}
              onSave={handleSave}
              saving={saving}
              errors={saveErrors}
            />
          </Section>

          {/* Sección: Historial de Compras */}
          <Section
            title="Historial de Compras"
            subtitle="Ventas confirmadas asociadas a este cliente."
            action={
              <div className="flex items-center gap-1.5 text-slate-400">
                <ShoppingBag size={14} />
                <Text variant="bodyXs">Confirmadas</Text>
              </div>
            }
          >
            <HistorialCompras clienteId={id} />
          </Section>

          {/* Sección: Interacciones */}
          <Section
            title="Interacciones"
            subtitle="Historial de contacto con el cliente, más recientes primero."
            action={
              <Link href={`/ventas-crm/clientes/${id}/nueva-interaccion`}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Plus}
                >
                  Nueva
                </Button>
              </Link>
            }
          >
            <InteraccionTimeline
              interacciones={interacciones}
              loading={interaccionesLoading}
            />
          </Section>
        </div>
      </main>
    </div>
  );
}
