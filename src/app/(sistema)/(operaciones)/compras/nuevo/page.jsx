"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  PageHeader, Button, Input, Field, useToast,
} from "@/components/ui";
import { MontoInput } from "@/components/ui";
import { createOrdenCompra, getSiguienteNumeroOC } from "@/services/apis/compras";

export default function NuevaOrdenCompraPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    numero: "",
    proveedor: "",
    pais_origen: "China",
    fecha_orden: new Date().toISOString().split("T")[0],
    fecha_estimada_arribo: "",
    monto_mercaderia_usd: "",
    monto_flete_usd: "",
    monto_seguro_usd: "",
    monto_aduana_usd: "",
    monto_otros_usd: "",
    observaciones: "",
  });

  // Auto-generar número
  useEffect(() => {
    getSiguienteNumeroOC()
      .then((res) => {
        if (res?.numero) setForm((f) => ({ ...f, numero: res.numero }));
      })
      .catch(() => {});
  }, []);

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleMontoChange = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.numero || !form.proveedor || !form.fecha_orden) {
      showToast("Completá los campos obligatorios (número, proveedor, fecha)", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        numero: form.numero,
        proveedor: form.proveedor,
        pais_origen: form.pais_origen || "China",
        fecha_orden: form.fecha_orden,
        fecha_estimada_arribo: form.fecha_estimada_arribo || null,
        monto_mercaderia_usd: form.monto_mercaderia_usd || 0,
        monto_flete_usd: form.monto_flete_usd || 0,
        monto_seguro_usd: form.monto_seguro_usd || 0,
        monto_aduana_usd: form.monto_aduana_usd || 0,
        monto_otros_usd: form.monto_otros_usd || 0,
        observaciones: form.observaciones,
        items: [],
      };
      await createOrdenCompra(payload);
      showToast("Orden de compra creada exitosamente", "success");
      router.push("/compras");
    } catch (err) {
      showToast(err.message || "Error al crear la orden", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Compras", href: "/compras" },
          { label: "Nueva Orden" },
        ]}
        subtitle="Registrar orden de compra / importación"
        subtitleClassName="text-blue-600"
      >
        <Link href="/compras">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>Volver</Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">

          {/* Datos principales */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Datos Generales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Número de Orden *">
                <Input
                  value={form.numero}
                  onChange={handleChange("numero")}
                  placeholder="OC-2026-001"
                />
              </Field>
              <Field label="Proveedor *">
                <Input
                  value={form.proveedor}
                  onChange={handleChange("proveedor")}
                  placeholder="Nombre del proveedor"
                />
              </Field>
              <Field label="País de Origen">
                <Input
                  value={form.pais_origen}
                  onChange={handleChange("pais_origen")}
                  placeholder="China"
                />
              </Field>
              <Field label="Fecha de Orden *">
                <Input
                  type="date"
                  value={form.fecha_orden}
                  onChange={handleChange("fecha_orden")}
                />
              </Field>
              <Field label="Fecha Estimada de Arribo">
                <Input
                  type="date"
                  value={form.fecha_estimada_arribo}
                  onChange={handleChange("fecha_estimada_arribo")}
                />
              </Field>
            </div>
          </div>

          {/* Costos */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Costos Estimados (USD)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Mercadería (FOB)">
                <MontoInput
                  value={form.monto_mercaderia_usd}
                  onChange={handleMontoChange("monto_mercaderia_usd")}
                  moneda="USD"
                  placeholder="0,00"
                />
              </Field>
              <Field label="Flete Internacional">
                <MontoInput
                  value={form.monto_flete_usd}
                  onChange={handleMontoChange("monto_flete_usd")}
                  moneda="USD"
                  placeholder="0,00"
                />
              </Field>
              <Field label="Seguro">
                <MontoInput
                  value={form.monto_seguro_usd}
                  onChange={handleMontoChange("monto_seguro_usd")}
                  moneda="USD"
                  placeholder="0,00"
                />
              </Field>
              <Field label="Aduana / Despacho">
                <MontoInput
                  value={form.monto_aduana_usd}
                  onChange={handleMontoChange("monto_aduana_usd")}
                  moneda="USD"
                  placeholder="0,00"
                />
              </Field>
              <Field label="Otros Costos">
                <MontoInput
                  value={form.monto_otros_usd}
                  onChange={handleMontoChange("monto_otros_usd")}
                  moneda="USD"
                  placeholder="0,00"
                />
              </Field>
            </div>
          </div>

          {/* Observaciones */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <Field label="Observaciones">
              <textarea
                value={form.observaciones}
                onChange={handleChange("observaciones")}
                rows={3}
                placeholder="Notas sobre la compra, tracking number, etc."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </Field>
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-3">
            <Link href="/compras">
              <Button variant="ghost">Cancelar</Button>
            </Link>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Guardando..." : "Crear Orden de Compra"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
