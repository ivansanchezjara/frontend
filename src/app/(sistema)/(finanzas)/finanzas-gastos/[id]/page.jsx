"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  XCircle,
  Receipt,
  Edit2,
  DollarSign,
  Calendar,
  Tag,
  User,
  FileText,
} from "lucide-react";
import Link from "next/link";
import {
  PageHeader,
  Button,
  Badge,
  Section,
  LoadingScreen,
  Input,
  Field,
  Modal,
} from "@/components/ui";
import { useConfirm, useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { getGasto, pagarGasto, anularGasto } from "@/services/apis/finanzas";

// ─── Helpers ────────────────────────────────────────────────────

function formatFecha(fechaStr) {
  if (!fechaStr) return "—";
  return new Date(fechaStr).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMonto(monto, moneda) {
  const num = Number(monto);
  if (moneda === "PYG") {
    return num.toLocaleString("es-PY") + " ₲";
  }
  if (moneda === "BRL") {
    return "R$ " + num.toLocaleString("es-PY", { minimumFractionDigits: 2 });
  }
  return "US$ " + num.toLocaleString("es-PY", { minimumFractionDigits: 2 });
}

const ESTADO_BADGE = {
  pendiente: "warning",
  pagado: "success",
  anulado: "danger",
};

const METODO_LABELS = {
  efectivo: "Efectivo",
  transferencia: "Transferencia Bancaria",
  cheque: "Cheque",
  tarjeta: "Tarjeta",
  otro: "Otro",
};

// ─── Page ───────────────────────────────────────────────────────

export default function GastoDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [showPagarModal, setShowPagarModal] = useState(false);

  const handleError = useCallback(
    (err) => {
      if (err.status === 404) router.push("/finanzas-gastos");
    },
    [router]
  );

  const {
    data: gasto,
    loading,
    execute: refetch,
    setData: setGasto,
  } = useApi(getGasto, { auto: false, initialData: null, onError: handleError });

  useEffect(() => {
    if (id) refetch(id);
  }, [id, refetch]);

  // ─── Acciones ─────────────────────────────────────────────────

  const handlePagar = async (metodoPago, fechaPago) => {
    try {
      const res = await pagarGasto(id, {
        metodo_pago: metodoPago,
        fecha_pago: fechaPago || undefined,
      });
      setGasto(res);
      setShowPagarModal(false);
      showToast("Gasto marcado como pagado.", "success");
    } catch (err) {
      showToast(err?.data?.detail || err?.message || "Error al pagar.", "error");
    }
  };

  const handleAnular = async () => {
    const ok = await confirm(
      "¿Estás seguro de que querés anular este gasto? Esta acción no se puede deshacer.",
      "Anular Gasto",
      { confirmText: "Anular", variant: "danger" }
    );
    if (!ok) return;
    try {
      const res = await anularGasto(id);
      setGasto(res);
      showToast("Gasto anulado.", "success");
    } catch (err) {
      showToast(
        err?.data?.detail || err?.message || "Error al anular.",
        "error"
      );
    }
  };

  // ─── Render ───────────────────────────────────────────────────

  if (loading || !gasto) return <LoadingScreen texto="Cargando gasto..." />;

  const puedePagar = gasto.estado === "pendiente";
  const puedeAnular = gasto.estado !== "anulado";

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Finanzas y Gastos", href: "/finanzas-gastos" },
          { label: gasto.concepto },
        ]}
        subtitle={
          <span className="flex items-center gap-2">
            <Badge variant={ESTADO_BADGE[gasto.estado]}>
              {gasto.estado}
            </Badge>
          </span>
        }
      >
        <div className="flex items-center gap-2 flex-wrap">
          {puedePagar && (
            <Button
              variant="primary"
              size="sm"
              icon={CreditCard}
              onClick={() => setShowPagarModal(true)}
            >
              Marcar Pagado
            </Button>
          )}
          {puedeAnular && (
            <Button
              variant="danger"
              size="sm"
              icon={XCircle}
              onClick={handleAnular}
            >
              Anular
            </Button>
          )}
          <Link href="/finanzas-gastos">
            <Button variant="ghost" size="sm" icon={ArrowLeft}>
              Volver
            </Button>
          </Link>
        </div>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Montos */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <Text
                  variant="label"
                  className="text-slate-400 mb-1 uppercase text-[11px]"
                >
                  Monto Original
                </Text>
                <p className="text-2xl font-bold text-gray-900">
                  {formatMonto(gasto.monto_original, gasto.moneda_original)}
                </p>
              </div>
              <div className="text-center">
                <Text
                  variant="label"
                  className="text-slate-400 mb-1 uppercase text-[11px]"
                >
                  Equivalente USD
                </Text>
                <p className="text-2xl font-bold text-purple-700">
                  {formatMonto(gasto.monto_usd, "USD")}
                </p>
              </div>
              <div className="text-center">
                <Text
                  variant="label"
                  className="text-slate-400 mb-1 uppercase text-[11px]"
                >
                  Tipo de Cambio
                </Text>
                <p className="text-2xl font-bold text-gray-600">
                  {gasto.tipo_cambio_usado
                    ? Number(gasto.tipo_cambio_usado).toLocaleString("es-PY")
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Información General */}
          <Section title="Información del Gasto">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">
                  Categoría
                </Text>
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-purple-500" />
                  <Text className="font-semibold">
                    {gasto.categoria_nombre}
                  </Text>
                </div>
              </div>
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">
                  Fecha del Gasto
                </Text>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <Text className="font-semibold">
                    {formatFecha(gasto.fecha_gasto)}
                  </Text>
                </div>
              </div>
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">
                  Método de Pago
                </Text>
                <div className="flex items-center gap-2">
                  <CreditCard size={14} className="text-slate-400" />
                  <Text className="font-semibold">
                    {gasto.metodo_pago
                      ? METODO_LABELS[gasto.metodo_pago] || gasto.metodo_pago
                      : "—"}
                  </Text>
                </div>
              </div>
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">
                  Fecha de Pago
                </Text>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <Text className="font-semibold">
                    {formatFecha(gasto.fecha_pago)}
                  </Text>
                </div>
              </div>
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">
                  Registrado por
                </Text>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <Text className="font-semibold">
                    {gasto.registrado_por_username}
                  </Text>
                </div>
              </div>
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">
                  Registrado el
                </Text>
                <Text className="font-semibold">
                  {new Date(gasto.created_at).toLocaleDateString("es-PY", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </div>
              {gasto.observaciones && (
                <div className="col-span-full">
                  <Text variant="label" className="text-slate-400 mb-0.5">
                    Observaciones
                  </Text>
                  <Text className="whitespace-pre-wrap">
                    {gasto.observaciones}
                  </Text>
                </div>
              )}
            </div>
          </Section>

          {/* Factura / Comprobante */}
          {gasto.factura && (
            <Section title="Comprobante / Factura">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text variant="label" className="text-slate-400 mb-0.5">
                    RUC Emisor
                  </Text>
                  <Text className="font-semibold">
                    {gasto.factura.ruc_emisor || "—"}
                  </Text>
                </div>
                <div>
                  <Text variant="label" className="text-slate-400 mb-0.5">
                    Razón Social
                  </Text>
                  <Text className="font-semibold">
                    {gasto.factura.razon_social_emisor || "—"}
                  </Text>
                </div>
                <div>
                  <Text variant="label" className="text-slate-400 mb-0.5">
                    Timbrado
                  </Text>
                  <Text className="font-semibold font-mono">
                    {gasto.factura.timbrado || "—"}
                  </Text>
                </div>
                <div>
                  <Text variant="label" className="text-slate-400 mb-0.5">
                    Nro. Factura
                  </Text>
                  <Text className="font-semibold font-mono">
                    {gasto.factura.numero_factura || "—"}
                  </Text>
                </div>
                <div>
                  <Text variant="label" className="text-slate-400 mb-0.5">
                    Fecha Emisión
                  </Text>
                  <Text className="font-semibold">
                    {formatFecha(gasto.factura.fecha_emision)}
                  </Text>
                </div>
              </div>
            </Section>
          )}
        </div>
      </main>

      {/* Modal: Pagar Gasto */}
      <PagarModal
        open={showPagarModal}
        onClose={() => setShowPagarModal(false)}
        onPagar={handlePagar}
      />
    </div>
  );
}

// ─── Modal Pagar ────────────────────────────────────────────────

function PagarModal({ open, onClose, onPagar }) {
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [fechaPago, setFechaPago] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onPagar(metodoPago, fechaPago);
    setSaving(false);
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Registrar Pago">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Método de Pago">
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia Bancaria</option>
            <option value="cheque">Cheque</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="otro">Otro</option>
          </select>
        </Field>

        <Field label="Fecha de Pago">
          <Input
            type="date"
            value={fechaPago}
            onChange={(e) => setFechaPago(e.target.value)}
          />
        </Field>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={CreditCard}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Confirmar Pago"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
