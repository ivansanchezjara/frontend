"use client";
import { useState, useRef } from "react";
import { Upload, CheckCircle, XCircle, Clock, AlertTriangle, FileText } from "lucide-react";

import { Button, Badge, Section, Field, Input } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/utils";
import {
  getVerificacionesEstudiante,
  createVerificacionEstudiante,
  revisarVerificacionEstudiante,
} from "@/services/apis/ventas";

// ─── Estado visual ──────────────────────────────────────────────

const ESTADO_CONFIG = {
  pendiente: { label: "Pendiente", icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", badge: "warning" },
  aprobada: { label: "Aprobada", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", badge: "success" },
  rechazada: { label: "Rechazada", icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", badge: "danger" },
  vencida: { label: "Vencida", icon: AlertTriangle, color: "text-slate-500", bg: "bg-slate-50 border-slate-200", badge: "default" },
};

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── Componente Principal ───────────────────────────────────────

export function VerificacionEstudianteSection({ persona, onUpdated }) {
  const { showToast } = useToast();
  const { danger } = useConfirm();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [fechaEmision, setFechaEmision] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const { data: verificacionesData, loading, execute: fetchVerificaciones } = useApi(
    getVerificacionesEstudiante,
    { auto: true, args: [{ persona: persona.id }], initialData: null }
  );

  const verificaciones = verificacionesData?.results || (Array.isArray(verificacionesData) ? verificacionesData : []);
  const verificacionActiva = verificaciones.find((v) => v.estado === "aprobada" && v.vigente);
  const verificacionPendiente = verificaciones.find((v) => v.estado === "pendiente");

  // Solo mostrar esta sección si la persona es categoría estudiante
  if (persona.categoria !== "estudiante") return null;

  const formacionGrado = (persona.formaciones || []).find((f) => f.tipo === "grado");

  const handleSubir = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { showToast("Seleccioná un archivo", "error"); return; }
    if (!fechaEmision) { showToast("Ingresá la fecha de emisión de la constancia", "error"); return; }
    if (!formacionGrado) { showToast("No se encontró formación de grado para verificar", "error"); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("persona", persona.id);
      formData.append("formacion", formacionGrado.id);
      formData.append("documento", file);
      formData.append("fecha_emision", fechaEmision);

      await createVerificacionEstudiante(formData);
      showToast("Constancia enviada. Pendiente de aprobación.", "success");
      setShowForm(false);
      setFechaEmision("");
      if (fileRef.current) fileRef.current.value = "";
      fetchVerificaciones({ persona: persona.id });
      if (onUpdated) onUpdated();
    } catch (err) {
      const msg = err?.data?.non_field_errors?.[0]
        || err?.data?.documento?.[0]
        || err?.data?.fecha_emision?.[0]
        || err?.data?.detail
        || "Error al subir la constancia";
      showToast(msg, "error");
    } finally {
      setUploading(false);
    }
  };

  const handleAprobar = async (verificacion) => {
    try {
      await revisarVerificacionEstudiante(verificacion.id, { estado: "aprobada" });
      showToast("Verificación aprobada", "success");
      fetchVerificaciones({ persona: persona.id });
      if (onUpdated) onUpdated();
    } catch (err) {
      showToast(err?.data?.detail || "Error al aprobar", "error");
    }
  };

  const handleRechazar = async (verificacion) => {
    if (!motivoRechazo.trim()) {
      showToast("Ingresá el motivo del rechazo", "error");
      return;
    }
    try {
      await revisarVerificacionEstudiante(verificacion.id, {
        estado: "rechazada",
        motivo_rechazo: motivoRechazo,
      });
      showToast("Verificación rechazada", "info");
      setMotivoRechazo("");
      fetchVerificaciones({ persona: persona.id });
      if (onUpdated) onUpdated();
    } catch (err) {
      showToast(err?.data?.detail || "Error al rechazar", "error");
    }
  };

  return (
    <Section
      title="Verificación de Estudiante"
      subtitle="Constancia de alumno regular (opcional — como respaldo documental)."
      action={
        verificacionActiva ? (
          <Badge variant="success">Verificado hasta {formatFecha(verificacionActiva.fecha_vencimiento)}</Badge>
        ) : verificacionPendiente ? (
          <Badge variant="warning">Pendiente de revisión</Badge>
        ) : (
          <Badge variant="default">Sin constancia</Badge>
        )
      }
    >
      <div className="p-6 space-y-4">

        {/* Estado actual */}
        {verificacionActiva && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            <div>
              <Text variant="bodySmBold" className="text-emerald-700">Verificación aprobada</Text>
              <Text variant="mutedXs" className="text-emerald-600">
                Válida hasta {formatFecha(verificacionActiva.fecha_vencimiento)} · {verificacionActiva.formacion_institucion} — {verificacionActiva.formacion_oferta}
              </Text>
            </div>
          </div>
        )}

        {/* Pendiente — con botones de aprobar/rechazar */}
        {verificacionPendiente && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <Text variant="bodySmBold" className="text-amber-700">Verificación pendiente de revisión</Text>
                <Text variant="mutedXs" className="text-amber-600">
                  Constancia emitida el {formatFecha(verificacionPendiente.fecha_emision)} · Subida el {formatFecha(verificacionPendiente.created_at)}
                </Text>
                {verificacionPendiente.documento && (
                  <a
                    href={verificacionPendiente.documento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-700 hover:text-amber-900 underline"
                  >
                    <FileText size={12} /> Ver documento
                  </a>
                )}
              </div>
            </div>

            {/* Acciones de revisión */}
            <div className="flex items-end gap-3 pt-2 border-t border-amber-200">
              <div className="flex-1">
                <Input
                  label="Motivo (si rechaza)"
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Documento ilegible, datos no coinciden..."
                  maxLength={300}
                />
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleRechazar(verificacionPendiente)}
                className="shrink-0"
              >
                Rechazar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAprobar(verificacionPendiente)}
                className="shrink-0"
              >
                Aprobar
              </Button>
            </div>
          </div>
        )}

        {/* Formulario para subir nueva constancia */}
        {!verificacionActiva && !verificacionPendiente && !showForm && (
          <div className="text-center py-4">
            <FileText size={28} className="text-slate-300 mx-auto mb-2" />
            <Text variant="bodySm" className="text-slate-500 mb-3">
              No hay constancia cargada. Podés subir una como respaldo documental.
            </Text>
            <Button variant="ghost" size="sm" icon={Upload} onClick={() => setShowForm(true)}>
              Subir constancia
            </Button>
          </div>
        )}

        {showForm && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 space-y-3">
            <Text variant="bodySmBold" className="text-blue-700">Subir constancia de alumno regular</Text>

            {formacionGrado && (
              <Text variant="mutedXs" className="text-slate-500">
                Verificando: {formacionGrado.oferta_academica_nombre} en {formacionGrado.institucion_nombre}
              </Text>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Constancia (PDF o imagen) *">
                {(fieldProps) => (
                  <input
                    {...fieldProps}
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                )}
              </Field>
              <Input
                label="Fecha de emisión *"
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubir} disabled={uploading} icon={uploading ? undefined : Upload}>
                {uploading ? "Subiendo..." : "Enviar"}
              </Button>
            </div>
          </div>
        )}

        {/* Historial de verificaciones anteriores */}
        {verificaciones.length > 0 && (verificaciones.length > 1 || (!verificacionActiva && !verificacionPendiente)) && (
          <div className="pt-3 border-t border-slate-100">
            <Text variant="mutedXs" className="text-slate-400 uppercase font-bold tracking-wide text-[10px] mb-2">
              Historial
            </Text>
            <div className="space-y-1.5">
              {verificaciones
                .filter((v) => v.id !== verificacionActiva?.id && v.id !== verificacionPendiente?.id)
                .map((v) => {
                  const config = ESTADO_CONFIG[v.estado] || ESTADO_CONFIG.vencida;
                  const Icon = config.icon;
                  return (
                    <div key={v.id} className="flex items-center gap-2 text-xs text-slate-500">
                      <Icon size={12} className={config.color} />
                      <span>{config.label}</span>
                      <span className="text-slate-300">·</span>
                      <span>Emitida {formatFecha(v.fecha_emision)}</span>
                      {v.motivo_rechazo && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-red-500 truncate max-w-[200px]">{v.motivo_rechazo}</span>
                        </>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
