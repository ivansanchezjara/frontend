"use client";
import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  SearchX, ShoppingBag, Plus, Save, Loader2,
} from "lucide-react";

import InteraccionTimeline from "@/components/comercial/ventas/clientes/InteraccionTimeline";
import {
  Button, Badge, LoadingScreen, PageHeader, Pagination, Section, EmptyState,
  Input, Field, AddressInput, PhoneInput, validatePhone, buildPhoneValue, useConfirm,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { Heading, Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { cn, formatFecha } from "@/lib/utils";
import { DEPARTAMENTOS, CIUDADES_POR_DEPARTAMENTO } from "@/config/paraguay";
import {
  getMayorista, updateMayorista, getInteracciones, getVentas,
} from "@/services/apis/ventas";

// Leaflet no soporta SSR
const MapaPicker = dynamic(() => import("@/components/ui/basics/MapaPicker"), { ssr: false });

// ─── Constantes ─────────────────────────────────────────────────

const TIER_LABELS = {
  publico: "Público", estudiante: "Estudiante", reventa: "Reventa",
  mayorista: "Mayorista", intercompany: "Intercompany",
};

const selectClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500";

// ─── Helpers ────────────────────────────────────────────────────

function formatMonto(monto, moneda = "USD") {
  if (monto == null) return "—";
  if (moneda === "PYG") return `₲ ${Number(monto).toLocaleString("es-PY")}`;
  return `$ ${Number(monto).toFixed(2)}`;
}

/**
 * Parsea un valor de teléfono guardado ("+595 981000000") en prefix + number.
 */
function parsePhoneValue(value) {
  if (!value) return { prefix: "+595", number: "" };
  const prefixes = ["+595", "+55", "+54"];
  for (const p of prefixes) {
    if (value.startsWith(p)) {
      return { prefix: p, number: value.slice(p.length).trim() };
    }
  }
  return { prefix: "+other", number: value };
}

// ─── Componente: Historial de Compras ───────────────────────────

function HistorialCompras({ mayoristaId }) {
  const [page, setPage] = useState(1);

  const { data: ventasData, loading: ventasLoading } = useApi(getVentas, {
    auto: true,
    args: [{ cliente: mayoristaId, estado: "confirmado", page }],
  });

  const ventas = ventasData?.results || [];
  const count = ventasData?.count || 0;

  if (ventasLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-slate-100" />)}
        </div>
      </div>
    );
  }

  if (ventas.length === 0) {
    return (
      <div className="p-6">
        <EmptyState titulo="Sin compras registradas" descripcion="Este mayorista aún no tiene ventas confirmadas." icon="🛒" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Comprobante</th>
              <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Fecha</th>
              <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Origen</th>
              <th className="text-right py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Total USD</th>
              <th className="text-right py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Total Moneda</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => (
              <tr key={venta.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-3">
                  <Link href={`/ventas-crm/ventas/${venta.id}`} className="text-purple-600 hover:text-purple-800 font-medium">
                    {venta.comprobante?.numero ? `#${venta.comprobante.numero}` : `V-${venta.id}`}
                  </Link>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{formatFecha(venta.confirmed_at || venta.created_at)}</td>
                <td className="py-2.5 px-3">
                  <Badge variant={venta.origen === "sucursal" ? "primary" : "success"}>{venta.origen}</Badge>
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-700">{formatMonto(venta.total_usd, "USD")}</td>
                <td className="py-2.5 px-3 text-right font-medium text-slate-500">{formatMonto(venta.total_moneda_negociacion, venta.moneda_negociacion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {count > 24 && <Pagination count={count} pageSize={24} currentPage={page} onPageChange={setPage} />}
    </div>
  );
}

// ─── Componente: Formulario de Datos ────────────────────────────

function DatosMayoristaForm({ mayorista, onSaved }) {
  const { showToast } = useToast();
  const { alert: showAlert } = useConfirm();

  const parsedPhone = parsePhoneValue(mayorista.telefono);

  const [form, setForm] = useState({
    razon_social: mayorista.razon_social || "",
    ruc: mayorista.ruc || "",
    telefonoPrefijo: parsedPhone.prefix,
    telefono: parsedPhone.number,
    correo_electronico: mayorista.correo_electronico || "",
    contacto_nombre: mayorista.contacto_nombre || "",
    transportadora_preferida: mayorista.transportadora_preferida || "",
    tier_precio: mayorista.tier_precio || "mayorista",
    departamento: mayorista.departamento || "",
    ciudad: mayorista.ciudad || "",
    direccion: mayorista.direccion || "",
    latitud: mayorista.latitud || null,
    longitud: mayorista.longitud || null,
    notas: mayorista.notas || "",
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [touched, setTouched] = useState({});

  const ciudades = form.departamento
    ? (CIUDADES_POR_DEPARTAMENTO[form.departamento] || [])
    : [];

  const handleChange = useCallback((field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }, [errors]);

  const handleDepartamentoChange = useCallback((e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, departamento: value, ciudad: "" }));
    setIsDirty(true);
  }, []);

  const validateField = useCallback((field) => {
    const validators = {
      razon_social: (v) => !v.trim() ? "La razón social es obligatoria." : null,
      ruc: (v) => !v.trim() ? "El RUC es obligatorio." : null,
      telefono: () => {
        if (!form.telefono.trim()) return "El teléfono es obligatorio.";
        return validatePhone(form.telefonoPrefijo, form.telefono);
      },
    };
    const validate = validators[field];
    if (!validate) return;
    const error = validate(form[field]);
    setErrors((prev) => {
      if (error) return { ...prev, [field]: error };
      const n = { ...prev };
      delete n[field];
      return n;
    });
  }, [form]);

  const handleBlur = useCallback((field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  }, [validateField]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const newErrors = {};
    if (!form.razon_social.trim()) newErrors.razon_social = "La razón social es obligatoria.";
    if (!form.ruc.trim()) newErrors.ruc = "El RUC es obligatorio.";
    if (!form.telefono.trim()) {
      newErrors.telefono = "El teléfono es obligatorio.";
    } else {
      const phoneErr = validatePhone(form.telefonoPrefijo, form.telefono);
      if (phoneErr) newErrors.telefono = phoneErr;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ razon_social: true, ruc: true, telefono: true });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const { telefonoPrefijo, telefono, ...rest } = form;
      const payload = {
        ...rest,
        telefono: buildPhoneValue(telefonoPrefijo, telefono),
      };
      const updated = await updateMayorista(mayorista.id, payload);
      setIsDirty(false);
      setTouched({});
      showToast("Datos actualizados correctamente", "success");
      if (onSaved) onSaved(updated);
    } catch (err) {
      if (err?.status === 400 && err?.data) {
        const fieldErrors = {};
        for (const [key, val] of Object.entries(err.data)) {
          fieldErrors[key] = Array.isArray(val) ? val.join(" ") : val;
        }
        setErrors(fieldErrors);
        setTouched(Object.fromEntries(Object.keys(fieldErrors).map((k) => [k, true])));
      } else {
        showAlert(err?.data?.detail || err?.message || "Error al guardar.", "Error");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>

      {/* ─── Identificación ────────────────────────────── */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Identificación
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Razón Social *"
            value={form.razon_social}
            onChange={handleChange("razon_social")}
            onBlur={handleBlur("razon_social")}
            placeholder="Nombre legal de la empresa"
            maxLength={200}
            error={touched.razon_social ? errors.razon_social : undefined}
          />
          <Input
            label="RUC *"
            value={form.ruc}
            onChange={handleChange("ruc")}
            onBlur={handleBlur("ruc")}
            placeholder="80000000-0"
            maxLength={20}
            error={touched.ruc ? errors.ruc : undefined}
          />
        </div>
      </div>

      {/* ─── Contacto ──────────────────────────────────── */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Contacto
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PhoneInput
            label="Teléfono"
            required
            prefix={form.telefonoPrefijo}
            onPrefixChange={(p) => { setForm((prev) => ({ ...prev, telefonoPrefijo: p })); setIsDirty(true); }}
            value={form.telefono}
            onChange={handleChange("telefono")}
            error={touched.telefono ? errors.telefono : undefined}
          />
          <Input
            label="Correo Electrónico"
            type="email"
            value={form.correo_electronico}
            onChange={handleChange("correo_electronico")}
            placeholder="ventas@empresa.com"
            maxLength={254}
            error={errors.correo_electronico}
          />
          <Input
            label="Persona de Contacto"
            value={form.contacto_nombre}
            onChange={handleChange("contacto_nombre")}
            placeholder="Nombre de quien gestiona pedidos"
            maxLength={100}
          />
        </div>
      </div>

      {/* ─── Distribución ──────────────────────────────── */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Datos de Distribución
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Transportadora Preferida"
            value={form.transportadora_preferida}
            onChange={handleChange("transportadora_preferida")}
            placeholder="Nombre de la transportadora"
            maxLength={100}
          />
          <Field label="Tier de Precio">
            {(fieldProps) => (
              <select
                {...fieldProps}
                className={selectClass}
                value={form.tier_precio || "mayorista"}
                onChange={(e) => { setForm((p) => ({ ...p, tier_precio: e.target.value })); setIsDirty(true); }}
              >
                <option value="publico">Público</option>
                <option value="estudiante">Estudiante</option>
                <option value="reventa">Reventa</option>
                <option value="mayorista">Mayorista</option>
                <option value="intercompany">Intercompany</option>
              </select>
            )}
          </Field>
        </div>
      </div>

      {/* ─── Ubicación ─────────────────────────────────── */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Ubicación
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Departamento">
            {(fieldProps) => (
              <select
                {...fieldProps}
                className={selectClass}
                value={form.departamento}
                onChange={handleDepartamentoChange}
              >
                <option value="">— Seleccionar —</option>
                {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
          </Field>
          <Field label="Ciudad">
            {(fieldProps) => (
              <select
                {...fieldProps}
                className={selectClass}
                value={form.ciudad}
                onChange={handleChange("ciudad")}
                disabled={!form.departamento}
              >
                <option value="">— Seleccionar —</option>
                {ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </Field>
          <div className="md:col-span-2">
            <AddressInput
              label="Dirección"
              value={form.direccion}
              onChange={handleChange("direccion")}
              placeholder="Calle, número, barrio"
              maxLength={500}
              context={[form.ciudad, form.departamento].filter(Boolean).join(", ")}
              onSelect={({ lat, lng }) => {
                setForm((p) => ({ ...p, latitud: lat, longitud: lng }));
                setIsDirty(true);
              }}
            />
          </div>
          <div className="md:col-span-2">
            <Field label="Ubicación en mapa">
              <MapaPicker
                latitud={form.latitud}
                longitud={form.longitud}
                centerOn={[form.ciudad, form.departamento].filter(Boolean).join(", ")}
                onChange={({ lat, lng, departamentoRaw, ciudad, direccion }) => {
                  setForm((p) => {
                    const update = { ...p, latitud: lat, longitud: lng };
                    if (departamentoRaw) {
                      const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                      const deptoNorm = norm(departamentoRaw);
                      const match = DEPARTAMENTOS.find((d) => norm(d) === deptoNorm)
                        || DEPARTAMENTOS.find((d) => deptoNorm.includes(norm(d)) || norm(d).includes(deptoNorm));
                      if (match) {
                        update.departamento = match;
                        update.ciudad = "";
                        if (ciudad) {
                          const ciudadesDepto = CIUDADES_POR_DEPARTAMENTO[match] || [];
                          const ciudadNorm = norm(ciudad);
                          const ciudadMatch = ciudadesDepto.find((c) => norm(c) === ciudadNorm)
                            || ciudadesDepto.find((c) => ciudadNorm.includes(norm(c)) || norm(c).includes(ciudadNorm));
                          if (ciudadMatch) update.ciudad = ciudadMatch;
                        }
                      }
                    }
                    if (direccion) update.direccion = direccion;
                    return update;
                  });
                  setIsDirty(true);
                }}
                height="350px"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* ─── Notas ─────────────────────────────────────── */}
      <div>
        <Field label="Notas internas">
          {(fieldProps) => (
            <textarea
              {...fieldProps}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none placeholder:text-slate-400"
              rows={3}
              value={form.notas}
              onChange={handleChange("notas")}
              placeholder="Notas internas sobre este mayorista..."
              maxLength={1000}
            />
          )}
        </Field>
      </div>

      {/* ─── Submit ────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <Text variant="mutedXs" className="text-slate-400">
          {isDirty ? "Hay cambios sin guardar" : "Sin cambios"}
        </Text>
        <Button
          type="submit"
          variant="primary"
          disabled={saving || !isDirty}
          icon={saving ? Loader2 : Save}
          className={cn("rounded-xl font-bold text-xs", saving && "[&_svg]:animate-spin")}
        >
          {saving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
        </Button>
      </div>

      {errors.non_field_errors && (
        <p className="text-sm text-red-600 font-medium">{errors.non_field_errors}</p>
      )}
    </form>
  );
}

// ─── Página Principal ───────────────────────────────────────────

export default function PerfilMayoristaPage() {
  const { id } = useParams();

  const [notFound, setNotFound] = useState(false);

  const handleError = useCallback((err) => {
    if (err.status === 404) setNotFound(true);
  }, []);

  const {
    data: mayorista,
    loading,
    setData: setMayorista,
  } = useApi(getMayorista, {
    auto: true,
    initialData: null,
    args: [id],
    onError: handleError,
  });

  const {
    data: interaccionesData,
    loading: interaccionesLoading,
  } = useApi(getInteracciones, {
    auto: !!id,
    args: [{ cliente: id, ordering: "-fecha" }],
    initialData: null,
  });

  const interacciones = interaccionesData?.results || [];

  // ─── Estados de carga y error ───────────────────────────────
  if (loading) return <LoadingScreen texto="Cargando perfil de mayorista..." />;

  if (notFound) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-6 inline-flex rounded-3xl bg-slate-900 p-4 text-white shadow-2xl shadow-purple-500/20">
            <SearchX size={44} strokeWidth={2.5} />
          </div>
          <Heading level={3}>Mayorista no encontrado</Heading>
          <Text className="mt-2">El mayorista solicitado no existe o fue desactivado.</Text>
          <Button
            as={Link}
            href="/ventas-crm/contactos/mayoristas"
            className="mt-6 bg-slate-900 text-white font-black hover:bg-slate-800 shadow-lg active:scale-[0.98]"
          >
            Volver a Mayoristas
          </Button>
        </div>
      </main>
    );
  }

  if (!mayorista) return null;

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Contactos", href: "/ventas-crm/contactos" },
          { label: "Mayoristas", href: "/ventas-crm/contactos/mayoristas" },
          { label: mayorista.razon_social },
        ]}
        subtitle={
          <span className="flex items-center gap-2 flex-wrap">
            <Badge variant="info">{TIER_LABELS[mayorista.tier_precio] || mayorista.tier_precio}</Badge>
            {mayorista.etapa === "prospecto" && <Badge variant="warning">Prospecto</Badge>}
            {mayorista.etapa === "inactivo" && <Badge variant="danger">Inactivo</Badge>}
          </span>
        }
        subtitleClassName="text-purple-600"
      />

      <main className="min-w-0 flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl space-y-6">

          {/* Datos del Mayorista */}
          <Section
            title="Datos del Mayorista"
            subtitle="Información completa. Los campos con * son obligatorios."
            action={
              mayorista.ruc && (
                <Text variant="bodyXs" className="text-slate-400">
                  RUC: <span className="font-bold text-slate-600">{mayorista.ruc}</span>
                </Text>
              )
            }
          >
            <DatosMayoristaForm mayorista={mayorista} onSaved={(updated) => setMayorista(updated)} />
          </Section>

          {/* Historial de Compras */}
          <Section
            title="Historial de Compras"
            subtitle="Ventas confirmadas asociadas a este mayorista."
            action={
              <div className="flex items-center gap-1.5 text-slate-400">
                <ShoppingBag size={14} aria-hidden="true" />
                <Text variant="bodyXs">Confirmadas</Text>
              </div>
            }
          >
            <HistorialCompras mayoristaId={id} />
          </Section>

          {/* Interacciones */}
          <Section
            title="Interacciones"
            subtitle="Historial de contacto, más recientes primero."
            action={
              <Button
                as={Link}
                href={`/ventas-crm/contactos/${id}/nueva-interaccion`}
                variant="ghost"
                size="sm"
                icon={Plus}
              >
                Nueva
              </Button>
            }
          >
            <InteraccionTimeline interacciones={interacciones} loading={interaccionesLoading} />
          </Section>

        </div>
      </main>
    </div>
  );
}
