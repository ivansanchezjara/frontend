"use client";
import { Suspense, useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Clock,
  MapPin,
  Shield,
} from "lucide-react";
import {
  PageHeader,
  Button,
  Badge,
  Text,
  EmptyState,
  LoadingScreen,
  Modal,
  Input,
  Field,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getTiposServicio,
  createTipoServicio,
  updateTipoServicio,
} from "@/services/apis/asistencia";

function TiposServicioContent() {
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const {
    data: tiposData,
    loading,
    execute: refetch,
  } = useApi(getTiposServicio, {
    auto: true,
    initialData: { results: [] },
  });
  const tipos = tiposData?.results || tiposData || [];

  const handleSave = async (data) => {
    try {
      if (editando) {
        await updateTipoServicio(editando.id, data);
        showToast("Tipo de servicio actualizado.", "success");
      } else {
        await createTipoServicio(data);
        showToast("Tipo de servicio creado.", "success");
      }
      setShowModal(false);
      setEditando(null);
      refetch();
    } catch (err) {
      showToast(err?.message || "Error al guardar.", "error");
    }
  };

  if (loading && tipos.length === 0) {
    return <LoadingScreen texto="Cargando tipos de servicio..." />;
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Asistencia Técnica", href: "/asistencia-tecnica" },
          { label: "Tipos de Servicio" },
        ]}
        subtitle={`${tipos.length} tipos configurados`}
        subtitleClassName="text-blue-600"
      >
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => { setEditando(null); setShowModal(true); }}
          className="rounded-xl font-bold text-xs shadow-lg"
        >
          NUEVO TIPO
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-5xl mx-auto">
          {tipos.length === 0 ? (
            <EmptyState
              titulo="Sin tipos de servicio"
              descripcion="Configurá los tipos de servicio para poder crear órdenes de trabajo."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tipos.map((tipo) => (
                <div
                  key={tipo.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Text className="font-bold text-slate-800">{tipo.nombre}</Text>
                    <button
                      onClick={() => { setEditando(tipo); setShowModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 size={14} className="text-slate-400" />
                    </button>
                  </div>

                  {tipo.descripcion && (
                    <Text variant="bodyXs" className="text-slate-500 mb-3">
                      {tipo.descripcion}
                    </Text>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-slate-400" />
                      <Text variant="bodyXs" className="text-slate-600">
                        Duración estimada: {tipo.duracion_estimada_horas}h
                      </Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-slate-400" />
                      <Text variant="bodyXs" className="text-slate-600">
                        {tipo.requiere_visita ? "Requiere visita" : "Sin visita"}
                      </Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield size={12} className="text-slate-400" />
                      <Text variant="bodyXs" className="text-slate-600">
                        SLA: {tipo.sla_horas_respuesta}h respuesta / {tipo.sla_horas_resolucion}h resolución
                      </Text>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <Badge variant={tipo.activo ? "success" : "danger"}>
                      {tipo.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <TipoServicioModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditando(null); }}
        onSave={handleSave}
        tipo={editando}
      />
    </div>
  );
}

function TipoServicioModal({ open, onClose, onSave, tipo }) {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    duracion_estimada_horas: "1",
    requiere_visita: true,
    sla_horas_respuesta: "24",
    sla_horas_resolucion: "72",
    activo: true,
  });

  // Sync form on open
  useEffect(() => {
    if (!open) return;
    if (tipo) {
      setForm({
        nombre: tipo.nombre || "",
        descripcion: tipo.descripcion || "",
        duracion_estimada_horas: String(tipo.duracion_estimada_horas || "1"),
        requiere_visita: tipo.requiere_visita ?? true,
        sla_horas_respuesta: String(tipo.sla_horas_respuesta || "24"),
        sla_horas_resolucion: String(tipo.sla_horas_resolucion || "72"),
        activo: tipo.activo ?? true,
      });
    } else {
      setForm({
        nombre: "", descripcion: "", duracion_estimada_horas: "1",
        requiere_visita: true, sla_horas_respuesta: "24",
        sla_horas_resolucion: "72", activo: true,
      });
    }
  }, [tipo, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      nombre: form.nombre,
      descripcion: form.descripcion,
      duracion_estimada_horas: Number(form.duracion_estimada_horas),
      requiere_visita: form.requiere_visita,
      sla_horas_respuesta: Number(form.sla_horas_respuesta),
      sla_horas_resolucion: Number(form.sla_horas_resolucion),
      activo: form.activo,
    });
    setForm({
      nombre: "", descripcion: "", duracion_estimada_horas: "1",
      requiere_visita: true, sla_horas_respuesta: "24",
      sla_horas_resolucion: "72", activo: true,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tipo ? "Editar Tipo de Servicio" : "Nuevo Tipo de Servicio"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Field label="Nombre *">
          <Input
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            placeholder="Ej: Instalación, Reparación..."
            required
          />
        </Field>

        <Field label="Descripción">
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Descripción del tipo de servicio..."
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Duración estimada (horas)">
            <Input
              type="number"
              step="0.5"
              min="0.5"
              value={form.duracion_estimada_horas}
              onChange={(e) => setForm((p) => ({ ...p, duracion_estimada_horas: e.target.value }))}
            />
          </Field>
          <Field label="SLA Respuesta (horas)">
            <Input
              type="number"
              min="1"
              value={form.sla_horas_respuesta}
              onChange={(e) => setForm((p) => ({ ...p, sla_horas_respuesta: e.target.value }))}
            />
          </Field>
          <Field label="SLA Resolución (horas)">
            <Input
              type="number"
              min="1"
              value={form.sla_horas_resolucion}
              onChange={(e) => setForm((p) => ({ ...p, sla_horas_resolucion: e.target.value }))}
            />
          </Field>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.requiere_visita}
              onChange={(e) => setForm((p) => ({ ...p, requiere_visita: e.target.checked }))}
              className="rounded"
            />
            <Text variant="bodyXs">Requiere visita al cliente</Text>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))}
              className="rounded"
            />
            <Text variant="bodyXs">Activo</Text>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit">
            {tipo ? "Guardar Cambios" : "Crear Tipo"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function TiposServicioPage() {
  return (
    <Suspense fallback={<LoadingScreen texto="Cargando tipos de servicio..." />}>
      <TiposServicioContent />
    </Suspense>
  );
}
