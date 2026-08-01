"use client";
import { useCallback, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  SearchX, ShoppingBag, Plus, Save, Loader2, MapPin, X, Search, UserPlus,
} from "lucide-react";

import InteraccionTimeline from "@/components/comercial/ventas/clientes/InteraccionTimeline";
import {
  Button, Badge, LoadingScreen, PageHeader, Pagination, Section, EmptyState,
  Input, Field, PhoneInput, validatePhone, buildPhoneValue, AddressInput, useConfirm,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { Heading, Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { useKeySave } from "@/hooks/useKeySave";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { DEPARTAMENTOS, CIUDADES_POR_DEPARTAMENTO } from "@/config/paraguay";
import { TIER_LABELS } from "@/config/personas";
import {
  getClinica, updateClinica, getInteracciones, getVentas,
  createVinculoLaboral, deleteVinculoLaboral, updateVinculoLaboral, getPersonas,
} from "@/services/apis/ventas";

// Leaflet no soporta SSR
const MapaPicker = dynamic(() => import("@/components/ui/basics/MapaPicker"), { ssr: false });

const selectClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

// ─── Helpers ────────────────────────────────────────────────────

function formatFecha(fechaStr) {
  if (!fechaStr) return "—";
  return new Date(fechaStr).toLocaleDateString("es-PY", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatMonto(monto, moneda = "USD") {
  if (monto == null) return "—";
  if (moneda === "PYG") return `₲ ${Number(monto).toLocaleString("es-PY")}`;
  return `$ ${Number(monto).toFixed(2)}`;
}

// ─── Componente: Historial de Compras ───────────────────────────

function HistorialCompras({ clinicaId }) {
  const [page, setPage] = useState(1);

  const { data: ventasData, loading: ventasLoading } = useApi(getVentas, {
    auto: true,
    args: [{ cliente: clinicaId, estado: "confirmado", page }],
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
        <EmptyState titulo="Sin compras registradas" descripcion="Esta clínica aún no tiene ventas confirmadas." icon="🛒" />
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
                  <Link href={`/ventas-crm/ventas/${venta.id}`} className="text-emerald-600 hover:text-emerald-800 font-medium">
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

// ─── Helpers: Phone parsing ─────────────────────────────────────

function parsePhone(telefono) {
  if (!telefono) return { prefix: "+595", number: "" };
  const match = telefono.match(/^(\+\d{1,4})\s+(.*)$/);
  if (match) return { prefix: match[1], number: match[2] };
  return { prefix: "+595", number: telefono };
}

// ─── Componente: Formulario de Datos ────────────────────────────

function DatosClinicaForm({ clinica, onSaved }) {
  const { showToast } = useToast();
  const { alert: showAlert } = useConfirm();

  const phoneParsed = parsePhone(clinica.telefono);
  const comprasPhoneParsed = parsePhone(clinica.contacto_compras_telefono);

  const [form, setForm] = useState({
    razon_social: clinica.razon_social || "",
    nombre_comercial: clinica.nombre_comercial || "",
    ruc: clinica.ruc || "",
    telefonoPrefijo: phoneParsed.prefix,
    telefono: phoneParsed.number,
    correo_electronico: clinica.correo_electronico || "",
    contacto_compras_nombre: clinica.contacto_compras_nombre || "",
    contacto_compras_prefijo: comprasPhoneParsed.prefix,
    contacto_compras_telefono: comprasPhoneParsed.number,
    departamento: clinica.departamento || "",
    ciudad: clinica.ciudad || "",
    direccion: clinica.direccion || "",
    direccion_entrega: clinica.direccion_entrega || "",
    latitud: clinica.latitud || null,
    longitud: clinica.longitud || null,
    notas: clinica.notas || "",
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const ciudades = form.departamento
    ? (CIUDADES_POR_DEPARTAMENTO[form.departamento] || [])
    : [];

  // Protección de cambios sin guardar
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.razon_social.trim()) newErrors.razon_social = "La razón social es obligatoria.";
    if (form.telefono.trim()) {
      const phoneErr = validatePhone(form.telefonoPrefijo, form.telefono);
      if (phoneErr) newErrors.telefono = phoneErr;
    }
    if (form.contacto_compras_telefono.trim()) {
      const phoneErr = validatePhone(form.contacto_compras_prefijo, form.contacto_compras_telefono);
      if (phoneErr) newErrors.contacto_compras_telefono = phoneErr;
    }
    if (form.correo_electronico.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_electronico)) {
      newErrors.correo_electronico = "Formato de correo inválido.";
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSaving(true);
    setErrors({});
    try {
      const { telefonoPrefijo, contacto_compras_prefijo, telefono, contacto_compras_telefono, ...rest } = form;
      const payload = {
        ...rest,
        telefono: buildPhoneValue(telefonoPrefijo, telefono),
        contacto_compras_telefono: buildPhoneValue(contacto_compras_prefijo, contacto_compras_telefono),
        latitud: form.latitud || null,
        longitud: form.longitud || null,
      };
      const updated = await updateClinica(clinica.id, payload);
      setIsDirty(false);
      showToast("Datos actualizados correctamente", "success");
      if (onSaved) onSaved(updated);
    } catch (err) {
      if (err?.status === 400 && err?.data) {
        const fieldErrors = {};
        for (const [key, val] of Object.entries(err.data)) {
          fieldErrors[key] = Array.isArray(val) ? val.join(" ") : val;
        }
        setErrors(fieldErrors);
      } else {
        showAlert(err?.data?.detail || err?.message || "Error al guardar.", "Error");
      }
    } finally {
      setSaving(false);
    }
  };

  useKeySave(() => handleSubmit({ preventDefault: () => {} }), { disabled: saving || !isDirty });

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">

      {/* Identificación */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Identificación
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Razón Social *" value={form.razon_social} onChange={handleChange("razon_social")} placeholder="Nombre legal" maxLength={200} error={errors.razon_social} />
          <Input label="Nombre Comercial" value={form.nombre_comercial} onChange={handleChange("nombre_comercial")} placeholder="OdontoCenter..." maxLength={200} />
          <Input label="RUC" value={form.ruc} onChange={handleChange("ruc")} placeholder="80000000-0" maxLength={20} error={errors.ruc} />
        </div>
      </div>

      {/* Contacto */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Contacto
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PhoneInput
            label="Teléfono"
            prefix={form.telefonoPrefijo}
            onPrefixChange={(p) => { setForm((prev) => ({ ...prev, telefonoPrefijo: p })); setIsDirty(true); }}
            value={form.telefono}
            onChange={handleChange("telefono")}
            error={errors.telefono}
          />
          <Input label="Correo Electrónico" type="email" value={form.correo_electronico} onChange={handleChange("correo_electronico")} placeholder="admin@clinica.com" maxLength={254} error={errors.correo_electronico} />
          <Input label="Contacto de Compras" value={form.contacto_compras_nombre} onChange={handleChange("contacto_compras_nombre")} placeholder="Nombre de quien gestiona pedidos" maxLength={100} />
          <PhoneInput
            label="Tel. Contacto Compras"
            prefix={form.contacto_compras_prefijo}
            onPrefixChange={(p) => { setForm((prev) => ({ ...prev, contacto_compras_prefijo: p })); setIsDirty(true); }}
            value={form.contacto_compras_telefono}
            onChange={handleChange("contacto_compras_telefono")}
            error={errors.contacto_compras_telefono}
          />
        </div>
      </div>

      {/* Ubicación */}
      <div>
        <Text variant="label" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4 block">
          Ubicación y Entrega
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Departamento">
            <select className={selectClass} value={form.departamento} onChange={(e) => { setForm((p) => ({ ...p, departamento: e.target.value, ciudad: "" })); setIsDirty(true); }}>
              <option value="">— Seleccionar —</option>
              {DEPARTAMENTOS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Ciudad">
            <select className={selectClass} value={form.ciudad} onChange={handleChange("ciudad")} disabled={!form.departamento}>
              <option value="">— Seleccionar —</option>
              {ciudades.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
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
        <div className="mt-4">
          <Input label="Dirección de Entrega (si difiere)" value={form.direccion_entrega} onChange={handleChange("direccion_entrega")} placeholder="Dirección alternativa para entregas" maxLength={500} />
        </div>
        <div className="mt-4">
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

      {/* Notas */}
      <div>
        <Field label="Notas internas">
          <textarea
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none placeholder:text-slate-400"
            rows={3}
            value={form.notas}
            onChange={handleChange("notas")}
            placeholder="Notas internas sobre esta clínica..."
            maxLength={1000}
          />
        </Field>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <Text variant="mutedXs" className={cn("text-xs", isDirty ? "text-amber-600 font-medium" : "text-slate-400")}>
          {isDirty ? "Cambios sin guardar" : "Sin cambios"}
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

// ─── Componente: Profesionales vinculados ───────────────────────

function AddProfesionalForm({ clinicaId, onCreated, onCancel }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounced = useDebounce(busqueda, 300);
  const [persona, setPersona] = useState(null);
  const [cargo, setCargo] = useState("");
  const [especialidad, setEspecialidad] = useState("");

  const { data: personasData, loading: buscando } = useApi(getPersonas, {
    auto: busquedaDebounced.length >= 2,
    args: [{ search: busquedaDebounced, page_size: 8 }],
    initialData: null,
  });

  const resultados = personasData?.results || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!persona) return;
    setSaving(true);
    try {
      await createVinculoLaboral({
        persona: persona.id,
        clinica: clinicaId,
        cargo,
        especialidad,
        activo: true,
      });
      showToast("Profesional vinculado", "success");
      onCreated();
    } catch (err) {
      showToast(err?.data?.detail || err?.data?.non_field_errors?.[0] || "Error al vincular", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Text variant="bodySmBold" className="text-emerald-700">Vincular Profesional</Text>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>

      {persona ? (
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-emerald-200">
          <UserPlus size={12} className="text-emerald-500" />
          <Text variant="bodySm" className="text-emerald-700 font-medium">{persona.razon_social}</Text>
          <button type="button" onClick={() => { setPersona(null); setBusqueda(""); }} className="ml-auto text-slate-400 hover:text-red-500">
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar persona por nombre..."
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          {busquedaDebounced.length >= 2 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
              {buscando && <div className="px-3 py-2 text-xs text-slate-400">Buscando...</div>}
              {!buscando && resultados.length === 0 && <div className="px-3 py-2 text-xs text-slate-400">Sin resultados</div>}
              {resultados.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                  onClick={() => { setPersona(p); setBusqueda(""); }}
                >
                  <span className="font-medium text-slate-700">{p.razon_social}</span>
                  {p.categoria && <span className="text-slate-400 text-xs ml-2">{p.categoria}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input label="Cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ej: Director Clínico, Asociado" />
        <Input label="Especialidad" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} placeholder="Ej: Endodoncia, Implantes" />
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="sm" disabled={saving || !persona} icon={saving ? Loader2 : undefined}>
          {saving ? "Vinculando..." : "Vincular"}
        </Button>
      </div>
    </form>
  );
}

function ProfesionalItem({ vinculo, onDelete, onUpdated }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [cargo, setCargo] = useState(vinculo.cargo || "");
  const [especialidad, setEspecialidad] = useState(vinculo.especialidad || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateVinculoLaboral(vinculo.id, { cargo, especialidad });
      showToast("Actualizado", "success");
      setEditing(false);
      if (onUpdated) onUpdated();
    } catch {
      showToast("Error al actualizar", "error");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-white border border-emerald-200 rounded-xl p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input type="text" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Cargo" className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-400" />
          <input type="text" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} placeholder="Especialidad" className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-emerald-400" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">Cancelar</button>
          <button type="button" onClick={handleSave} disabled={saving} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 disabled:opacity-50">{saving ? "..." : "Guardar"}</button>
        </div>
      </div>
    );
  }

  const subtitulo = [vinculo.cargo, vinculo.especialidad].filter(Boolean).join(" · ");

  return (
    <div
      className="flex items-center gap-3 py-2.5 px-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-slate-200 transition-colors cursor-pointer"
      onClick={() => router.push(`/ventas-crm/contactos/personas/${vinculo.persona_id}`)}
    >
      <div className="flex-1 min-w-0">
        <Text variant="bodySmBold" className="text-slate-800 truncate">
          {vinculo.persona_tratamiento ? `${vinculo.persona_tratamiento} ` : ""}
          {vinculo.persona_nombre || `Persona #${vinculo.persona_id}`}
        </Text>
        {subtitulo && <Text variant="mutedXs" className="text-slate-500">{subtitulo}</Text>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-emerald-500 p-1"
          title="Editar"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500 p-1"
          title="Eliminar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function ProfesionalesSection({ clinicaId, profesionales, onChanged }) {
  const { showToast } = useToast();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="p-6 space-y-3">
      {showAdd && (
        <AddProfesionalForm
          clinicaId={clinicaId}
          onCreated={() => { setShowAdd(false); if (onChanged) onChanged(); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {(!profesionales || profesionales.length === 0) && !showAdd && (
        <EmptyState
          titulo="Sin profesionales vinculados"
          descripcion="Aún no hay profesionales asociados a esta clínica."
          icon="👨‍⚕️"
        />
      )}

      {profesionales && profesionales.length > 0 && (
        <div className="space-y-2">
          {profesionales.map((vinculo) => (
            <ProfesionalItem
              key={vinculo.id}
              vinculo={vinculo}
              onDelete={async () => {
                try { await deleteVinculoLaboral(vinculo.id); showToast("Eliminado", "success"); if (onChanged) onChanged(); }
                catch { showToast("Error al eliminar", "error"); }
              }}
              onUpdated={onChanged}
            />
          ))}
        </div>
      )}

      {!showAdd && (
        <Button variant="ghost" size="sm" icon={Plus} onClick={() => setShowAdd(true)}>
          Agregar profesional
        </Button>
      )}
    </div>
  );
}

// ─── Página Principal ───────────────────────────────────────────

export default function PerfilClinicaPage() {
  const { id } = useParams();

  const [notFound, setNotFound] = useState(false);

  const handleError = useCallback((err) => {
    if (err.status === 404) setNotFound(true);
  }, []);

  const {
    data: clinica,
    loading,
    setData: setClinica,
    refetch: refetchClinica,
  } = useApi(getClinica, {
    auto: true,
    initialData: null,
    args: [id],
    onError: handleError,
  });

  const {
    data: interaccionesData,
    loading: interaccionesLoading,
  } = useApi(getInteracciones, {
    auto: true,
    args: [{ cliente: id, ordering: "-fecha" }],
    initialData: null,
  });

  const interacciones = interaccionesData?.results || [];

  // ─── Estados de carga y error ───────────────────────────────
  if (loading) return <LoadingScreen texto="Cargando perfil de clínica..." />;

  if (notFound) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-6 inline-flex rounded-3xl bg-slate-900 p-4 text-white shadow-2xl shadow-emerald-500/20">
            <SearchX size={44} strokeWidth={2.5} />
          </div>
          <Heading level={3}>Clínica no encontrada</Heading>
          <Text className="mt-2">La clínica solicitada no existe o fue desactivada.</Text>
          <Button
            as={Link}
            href="/ventas-crm/contactos/clinicas"
            className="mt-6 bg-slate-900 text-white font-black hover:bg-slate-800 shadow-lg active:scale-[0.98]"
          >
            Volver a Clínicas
          </Button>
        </div>
      </main>
    );
  }

  if (!clinica) return null;

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Contactos", href: "/ventas-crm/contactos" },
          { label: "Clínicas", href: "/ventas-crm/contactos/clinicas" },
          { label: clinica.nombre_comercial || clinica.razon_social },
        ]}
        subtitle={
          <span className="flex items-center gap-2 flex-wrap">
            <Badge variant="info">{TIER_LABELS[clinica.tier_precio] || clinica.tier_precio}</Badge>
            {clinica.etapa === "prospecto" && <Badge variant="warning">Prospecto</Badge>}
            {clinica.etapa === "inactivo" && <Badge variant="danger">Inactivo</Badge>}
            {clinica.ciudad && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={12} /> {clinica.ciudad}
              </span>
            )}
          </span>
        }
        subtitleClassName="text-emerald-600"
      />

      <main className="min-w-0 flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl space-y-6">

          {/* Datos de la Clínica */}
          <Section
            title="Datos de la Clínica"
            subtitle="Información completa. Los campos con * son obligatorios."
            action={
              clinica.ruc && (
                <Text variant="bodyXs" className="text-slate-400">
                  RUC: <span className="font-bold text-slate-600">{clinica.ruc}</span>
                </Text>
              )
            }
          >
            <DatosClinicaForm clinica={clinica} onSaved={(updated) => setClinica(updated)} />
          </Section>

          {/* Profesionales vinculados */}
          <Section
            title={`Profesionales (${clinica.profesionales?.length || 0})`}
            subtitle="Doctores y profesionales que trabajan en esta clínica."
          >
            <ProfesionalesSection clinicaId={id} profesionales={clinica.profesionales} onChanged={refetchClinica} />
          </Section>

          {/* Tier de Precio */}
          {/* Historial de Compras */}
          <Section
            title="Historial de Compras"
            subtitle="Ventas confirmadas asociadas a esta clínica."
            action={
              <div className="flex items-center gap-1.5 text-slate-400">
                <ShoppingBag size={14} />
                <Text variant="bodyXs">Confirmadas</Text>
              </div>
            }
          >
            <HistorialCompras clinicaId={id} />
          </Section>

          {/* Interacciones */}
          <Section
            title="Interacciones"
            subtitle="Historial de contacto, más recientes primero."
            action={
              <Link href={`/ventas-crm/contactos/${id}/nueva-interaccion`}>
                <Button variant="ghost" size="sm" icon={Plus}>Nueva</Button>
              </Link>
            }
          >
            <InteraccionTimeline interacciones={interacciones} loading={interaccionesLoading} />
          </Section>

        </div>
      </main>
    </div>
  );
}
