"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  SearchX,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Calendar,
  UserCheck,
} from "lucide-react";

import ProspectoForm from "@/components/ventas/ProspectoForm";
import {
  Button,
  Badge,
  LoadingScreen,
  PageHeader,
  Section,
  useConfirm,
} from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import {
  getProspecto,
  updateProspecto,
  convertirProspecto,
  getInteracciones,
} from "@/services/apis/ventas";

const TIPO_INTERACCION_ICONS = {
  llamada: Phone,
  visita: MapPin,
  correo: Mail,
  whatsapp: MessageSquare,
  nota: MessageSquare,
};

const TIPO_INTERACCION_COLORS = {
  llamada: "bg-blue-100 text-blue-600",
  visita: "bg-emerald-100 text-emerald-600",
  correo: "bg-purple-100 text-purple-600",
  whatsapp: "bg-green-100 text-green-600",
  nota: "bg-slate-100 text-slate-600",
};

function getInitialFormData(prospecto) {
  return {
    nombre: prospecto.nombre || "",
    telefono: prospecto.telefono || "",
    correo_electronico: prospecto.correo_electronico || "",
    empresa: prospecto.empresa || "",
    direccion: prospecto.direccion || "",
    ruc: prospecto.ruc || "",
    notas: prospecto.notas || "",
    tier_precio_sugerido: prospecto.tier_precio_sugerido || "",
    estado: prospecto.estado || "nuevo",
  };
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProspectoDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const { alert: showAlert, danger } = useConfirm();

  const [notFound, setNotFound] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleProspectoError = useCallback((err) => {
    if (err.status === 404) setNotFound(true);
  }, []);

  const {
    data: prospecto,
    loading,
    execute: refetchProspecto,
  } = useApi(getProspecto, {
    auto: false,
    initialData: null,
    args: [id],
    onError: handleProspectoError,
  });

  const {
    data: interaccionesData,
    loading: interaccionesLoading,
    execute: refetchInteracciones,
  } = useApi(getInteracciones, {
    auto: false,
    initialData: null,
    args: [{ prospecto: id, ordering: "-fecha" }],
  });

  useEffect(() => {
    if (id) {
      setNotFound(false);
      refetchProspecto();
      refetchInteracciones();
    }
  }, [id, refetchProspecto, refetchInteracciones]);

  useEffect(() => {
    if (!prospecto) return;
    setFormData((current) => {
      if (current && isDirty) return current;
      return getInitialFormData(prospecto);
    });
  }, [prospecto, isDirty]);

  const field = (key) => (value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors({});
    try {
      const payload = { ...formData };
      delete payload.estado;
      await updateProspecto(id, payload);
      setIsDirty(false);
      await refetchProspecto();
    } catch (err) {
      if (err && typeof err === "object" && !(err instanceof Error)) {
        setErrors(err);
      } else {
        showAlert(
          err?.message || "Error al guardar el prospecto.",
          "Error",
          "danger"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTransition = async (nuevoEstado) => {
    setSaving(true);
    try {
      await updateProspecto(id, { estado: nuevoEstado });
      setIsDirty(false);
      await refetchProspecto();
    } catch (err) {
      const msg =
        err?.detail || err?.estado?.[0] || "No se pudo cambiar el estado.";
      showAlert(msg, "Error", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleConvertir = async () => {
    const ok = await danger(
      "¿Convertir este prospecto a cliente? Se creará un registro de cliente con los datos actuales del prospecto.",
      "Convertir a Cliente",
      { confirmText: "Convertir" }
    );
    if (!ok) return;

    setSaving(true);
    try {
      const result = await convertirProspecto(id);
      await refetchProspecto();
      showAlert(
        `Cliente creado exitosamente. ID: ${result.cliente_id || result.id || ""}`,
        "Éxito"
      );
    } catch (err) {
      const msg =
        err?.detail || err?.correo_electronico?.[0] || "No se pudo convertir el prospecto.";
      showAlert(msg, "Error", "danger");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen texto="Cargando prospecto..." />;

  if (notFound) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-6 inline-flex rounded-3xl bg-slate-900 p-4 text-white shadow-2xl shadow-emerald-500/20">
            <SearchX size={44} strokeWidth={2.5} />
          </div>
          <Text as="h3" variant="heading">
            Prospecto no encontrado
          </Text>
          <Text className="mt-2 text-slate-500">
            El prospecto solicitado no existe o fue eliminado.
          </Text>
          <Button
            as={Link}
            href="/ventas-crm/prospectos"
            className="mt-6 bg-slate-900 text-white font-black hover:bg-slate-800 shadow-lg active:scale-[0.98]"
          >
            Volver a Prospectos
          </Button>
        </div>
      </main>
    );
  }

  if (!prospecto || !formData) return null;

  const interacciones = interaccionesData?.results || interaccionesData || [];

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Prospectos", href: "/ventas-crm/prospectos" },
          { label: prospecto.nombre },
        ]}
      >
        <Button
          as={Link}
          href="/ventas-crm/prospectos"
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
        >
          Volver
        </Button>
      </PageHeader>

      <main className="min-w-0 flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Info rápida */}
          <div className="flex items-center gap-4 flex-wrap">
            <Text as="h1" variant="heading" className="text-xl font-bold text-slate-800">
              {prospecto.nombre}
            </Text>
            {prospecto.cliente_convertido && (
              <Badge variant="success">
                <UserCheck size={12} className="mr-1" />
                Convertido
              </Badge>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            {prospecto.created_at && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                Creado: {formatDate(prospecto.created_at)}
              </span>
            )}
            {prospecto.vendedor_nombre && (
              <span>Vendedor: {prospecto.vendedor_nombre}</span>
            )}
          </div>

          {/* Formulario */}
          <ProspectoForm
            formData={formData}
            onChange={field}
            onSave={handleSave}
            onTransition={handleTransition}
            onConvertir={handleConvertir}
            saving={saving}
            errors={errors}
          />

          {/* Timeline de interacciones */}
          <Section
            title="Interacciones"
            subtitle="Historial de contacto con este prospecto"
          >
            <div className="p-6">
              {interaccionesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-300 border-t-blue-600" />
                </div>
              ) : interacciones.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  No hay interacciones registradas aún.
                </p>
              ) : (
                <div className="relative">
                  {/* Línea vertical del timeline */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

                  <div className="space-y-6">
                    {interacciones.map((interaccion) => {
                      const Icon =
                        TIPO_INTERACCION_ICONS[interaccion.tipo] || MessageSquare;
                      const colorClass =
                        TIPO_INTERACCION_COLORS[interaccion.tipo] ||
                        "bg-slate-100 text-slate-600";

                      return (
                        <div
                          key={interaccion.id}
                          className="relative flex gap-4 pl-2"
                        >
                          {/* Icono del timeline */}
                          <div
                            className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}
                          >
                            <Icon size={16} />
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0 pb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant={
                                  interaccion.tipo === "visita"
                                    ? "success"
                                    : interaccion.tipo === "llamada"
                                    ? "primary"
                                    : "default"
                                }
                              >
                                {interaccion.tipo}
                              </Badge>
                              <span className="text-xs text-slate-400">
                                {formatDateTime(interaccion.fecha)}
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                              {interaccion.resumen}
                            </p>
                            {interaccion.proxima_accion_fecha && (
                              <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5 w-fit">
                                <Calendar size={12} />
                                <span>
                                  Próxima acción:{" "}
                                  {formatDate(interaccion.proxima_accion_fecha)}
                                  {interaccion.proxima_accion_descripcion &&
                                    ` — ${interaccion.proxima_accion_descripcion}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Link al cliente convertido */}
          {prospecto.cliente_convertido && (
            <Section title="Cliente Vinculado">
              <div className="p-6 flex items-center justify-between">
                <div>
                  <Text className="text-sm font-medium text-slate-700">
                    Este prospecto fue convertido a cliente.
                  </Text>
                  <Text className="text-xs text-slate-500 mt-1">
                    ID Cliente: {prospecto.cliente_convertido}
                  </Text>
                </div>
                <Button
                  as={Link}
                  href={`/ventas-crm/clientes/${prospecto.cliente_convertido}`}
                  variant="outline"
                  size="sm"
                >
                  Ver Cliente
                </Button>
              </div>
            </Section>
          )}
        </div>
      </main>
    </div>
  );
}
