"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Receipt, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import {
  PageHeader,
  Button,
  Input,
  Field,
  Section,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { createGasto, getCategoriasGasto } from "@/services/apis/finanzas";

export default function NuevoGastoPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [mostrarFactura, setMostrarFactura] = useState(false);

  const [form, setForm] = useState({
    categoria: "",
    concepto: "",
    monto_original: "",
    moneda_original: "PYG",
    fecha_gasto: new Date().toISOString().split("T")[0],
    fecha_pago: "",
    metodo_pago: "",
    observaciones: "",
  });

  const [factura, setFactura] = useState({
    ruc_emisor: "",
    razon_social_emisor: "",
    timbrado: "",
    numero_factura: "",
    fecha_emision: "",
  });

  const { data: categoriasData } = useApi(getCategoriasGasto, {
    auto: true,
    initialData: [],
  });
  const categorias = categoriasData?.results || categoriasData || [];

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleFacturaChange = (field, value) => {
    setFactura((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    // Validación local
    const newErrors = {};
    if (!form.categoria) newErrors.categoria = "Seleccione una categoría.";
    if (!form.concepto.trim()) newErrors.concepto = "El concepto es requerido.";
    if (!form.monto_original || Number(form.monto_original) <= 0)
      newErrors.monto_original = "El monto debe ser mayor a cero.";
    if (!form.fecha_gasto) newErrors.fecha_gasto = "La fecha es requerida.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSaving(false);
      return;
    }

    try {
      const payload = {
        categoria: Number(form.categoria),
        concepto: form.concepto,
        monto_original: form.monto_original,
        moneda_original: form.moneda_original,
        fecha_gasto: form.fecha_gasto,
        fecha_pago: form.fecha_pago || null,
        metodo_pago: form.metodo_pago || null,
        observaciones: form.observaciones,
      };

      // Incluir factura si se llenó algún dato
      const tieneFactura = Object.values(factura).some((v) => v.trim());
      if (mostrarFactura && tieneFactura) {
        payload.factura = {
          ruc_emisor: factura.ruc_emisor,
          razon_social_emisor: factura.razon_social_emisor,
          timbrado: factura.timbrado,
          numero_factura: factura.numero_factura,
          fecha_emision: factura.fecha_emision || null,
        };
      }

      await createGasto(payload);
      showToast("Gasto registrado exitosamente.", "success");
      router.push("/finanzas-gastos");
    } catch (err) {
      if (err?.data) {
        setErrors(err.data);
      } else {
        showToast(err?.message || "Error al registrar gasto.", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Finanzas y Gastos", href: "/finanzas-gastos" },
          { label: "Nuevo Gasto" },
        ]}
        subtitle="Registrar gasto"
        subtitleClassName="text-purple-600"
      >
        <Link href="/finanzas-gastos">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Volver
          </Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          {/* Datos del Gasto */}
          <Section title="Datos del Gasto">
            <div className="p-6 space-y-4">
              <Field label="Categoría *" error={errors.categoria}>
                <select
                  value={form.categoria}
                  onChange={(e) => handleChange("categoria", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Seleccionar categoría...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parent_nombre
                        ? `${cat.parent_nombre} > ${cat.nombre}`
                        : cat.nombre}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Concepto *" error={errors.concepto}>
                <Input
                  value={form.concepto}
                  onChange={(e) => handleChange("concepto", e.target.value)}
                  placeholder="Ej: Pago de alquiler mes de Junio"
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Monto *" error={errors.monto_original}>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.monto_original}
                    onChange={(e) =>
                      handleChange("monto_original", e.target.value)
                    }
                    placeholder="0"
                  />
                </Field>

                <Field label="Moneda">
                  <select
                    value={form.moneda_original}
                    onChange={(e) =>
                      handleChange("moneda_original", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PYG">Guaraní (PYG)</option>
                    <option value="USD">Dólar (USD)</option>
                    <option value="BRL">Real (BRL)</option>
                  </select>
                </Field>

                <Field label="Fecha del Gasto *" error={errors.fecha_gasto}>
                  <Input
                    type="date"
                    value={form.fecha_gasto}
                    onChange={(e) =>
                      handleChange("fecha_gasto", e.target.value)
                    }
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Método de Pago">
                  <select
                    value={form.metodo_pago}
                    onChange={(e) =>
                      handleChange("metodo_pago", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Sin especificar</option>
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
                    value={form.fecha_pago}
                    onChange={(e) =>
                      handleChange("fecha_pago", e.target.value)
                    }
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Si se completa, el gasto se marca como pagado.
                  </p>
                </Field>
              </div>

              <Field label="Observaciones">
                <textarea
                  value={form.observaciones}
                  onChange={(e) =>
                    handleChange("observaciones", e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Notas adicionales..."
                />
              </Field>
            </div>
          </Section>

          {/* Datos de Factura (colapsable) */}
          <Section
            title={
              <button
                type="button"
                onClick={() => setMostrarFactura(!mostrarFactura)}
                className="flex items-center gap-2 w-full text-left"
              >
                <Receipt className="w-4 h-4 text-purple-500" />
                <span>Datos de Factura / Comprobante</span>
                {mostrarFactura ? (
                  <ChevronUp className="w-4 h-4 ml-auto text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                )}
              </button>
            }
          >
            {mostrarFactura && (
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500 mb-2">
                  Datos fiscales del comprobante recibido (opcional).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="RUC Emisor">
                    <Input
                      value={factura.ruc_emisor}
                      onChange={(e) =>
                        handleFacturaChange("ruc_emisor", e.target.value)
                      }
                      placeholder="80012345-6"
                    />
                  </Field>

                  <Field label="Razón Social Emisor">
                    <Input
                      value={factura.razon_social_emisor}
                      onChange={(e) =>
                        handleFacturaChange(
                          "razon_social_emisor",
                          e.target.value
                        )
                      }
                      placeholder="Nombre de la empresa emisora"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Timbrado">
                    <Input
                      value={factura.timbrado}
                      onChange={(e) =>
                        handleFacturaChange("timbrado", e.target.value)
                      }
                      placeholder="12345678"
                    />
                  </Field>

                  <Field label="Nro. Factura">
                    <Input
                      value={factura.numero_factura}
                      onChange={(e) =>
                        handleFacturaChange("numero_factura", e.target.value)
                      }
                      placeholder="001-001-0001234"
                    />
                  </Field>

                  <Field label="Fecha Emisión">
                    <Input
                      type="date"
                      value={factura.fecha_emision}
                      onChange={(e) =>
                        handleFacturaChange("fecha_emision", e.target.value)
                      }
                    />
                  </Field>
                </div>
              </div>
            )}
          </Section>

          {/* Botones */}
          <div className="flex justify-end gap-3">
            <Link href="/finanzas-gastos">
              <Button variant="ghost" type="button">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              disabled={saving}
              className="shadow-lg"
            >
              {saving ? "Guardando..." : "Registrar Gasto"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
