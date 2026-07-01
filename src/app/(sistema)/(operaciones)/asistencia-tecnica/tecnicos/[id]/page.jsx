"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import {
  PageHeader,
  Button,
  Badge,
  Section,
  LoadingScreen,
  Modal,
  Input,
  Field,
} from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import {
  getAgendaTecnico,
  createDisponibilidad,
  deleteDisponibilidad,
  createBloqueo,
  deleteBloqueo,
} from "@/services/apis/asistencia";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo",
];

export default function TecnicoDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [showDisponibilidadModal, setShowDisponibilidadModal] = useState(false);
  const [showBloqueoModal, setShowBloqueoModal] = useState(false);

  const handleError = useCallback((err) => {
    if (err.status === 404) router.push("/asistencia-tecnica/tecnicos");
  }, [router]);

  const {
    data: agendaData,
    loading,
    execute: refetch,
  } = useApi(getAgendaTecnico, {
    auto: false,
    initialData: null,
    onError: handleError,
  });

  useEffect(() => { if (id) refetch(id); }, [id, refetch]);

  const tecnico = agendaData?.tecnico;
  const disponibilidades = agendaData?.disponibilidades || [];
  const bloqueos = agendaData?.bloqueos || [];

  const handleAddDisponibilidad = async (data) => {
    try {
      await createDisponibilidad(id, data);
      refetch(id);
      setShowDisponibilidadModal(false);
      showToast("Disponibilidad agregada.", "success");
    } catch (err) {
      showToast(err?.message || "Error.", "error");
    }
  };

  const handleDeleteDisponibilidad = async (dispId) => {
    try {
      await deleteDisponibilidad(id, dispId);
      refetch(id);
      showToast("Disponibilidad eliminada.", "success");
    } catch (err) {
      showToast(err?.message || "Error.", "error");
    }
  };

  const handleAddBloqueo = async (data) => {
    try {
      await createBloqueo(id, data);
      refetch(id);
      setShowBloqueoModal(false);
      showToast("Bloqueo agregado.", "success");
    } catch (err) {
      showToast(err?.message || "Error.", "error");
    }
  };

  const handleDeleteBloqueo = async (bloqueoId) => {
    try {
      await deleteBloqueo(id, bloqueoId);
      refetch(id);
      showToast("Bloqueo eliminado.", "success");
    } catch (err) {
      showToast(err?.message || "Error.", "error");
    }
  };

  if (loading || !tecnico) return <LoadingScreen texto="Cargando técnico..." />;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Asistencia Técnica", href: "/asistencia-tecnica" },
          { label: "Técnicos", href: "/asistencia-tecnica/tecnicos" },
          { label: tecnico.nombre_completo },
        ]}
        subtitle={
          <span className="flex items-center gap-2">
            <Badge variant={tecnico.tipo === "interno" ? "info" : "warning"}>
              {tecnico.tipo_display}
            </Badge>
            {!tecnico.activo && <Badge variant="danger">Inactivo</Badge>}
          </span>
        }
      >
        <Link href="/asistencia-tecnica/tecnicos">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>Volver</Button>
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Info */}
          <Section title="Información del Técnico">
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">Teléfono</Text>
                <Text className="font-semibold">{tecnico.telefono || "—"}</Text>
              </div>
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">Email</Text>
                <Text className="font-semibold">{tecnico.email || "—"}</Text>
              </div>
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">Usuario</Text>
                <Text className="font-semibold">{tecnico.username}</Text>
              </div>
            </div>
            {tecnico.especialidades_nombres?.length > 0 && (
              <div className="px-6 pb-6">
                <Text variant="label" className="text-slate-400 mb-1.5">Especialidades</Text>
                <div className="flex flex-wrap gap-1.5">
                  {tecnico.especialidades_nombres.map((esp, i) => (
                    <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                      {esp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Disponibilidad Semanal */}
          <Section
            title="Disponibilidad Semanal"
            action={
              <Button variant="ghost" size="sm" icon={Plus} onClick={() => setShowDisponibilidadModal(true)}>
                Agregar
              </Button>
            }
          >
            <div className="p-6">
              {disponibilidades.length === 0 ? (
                <Text variant="bodyXs" className="text-slate-400 italic">Sin horarios configurados.</Text>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {disponibilidades.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-blue-500" />
                        <div>
                          <Text variant="bodyXs" className="font-bold">{d.dia_semana_display}</Text>
                          <Text variant="bodyXs" className="text-slate-500">{d.hora_inicio} - {d.hora_fin}</Text>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDisponibilidad(d.id)}
                        className="p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={12} className="text-slate-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Bloqueos de Agenda */}
          <Section
            title="Bloqueos de Agenda"
            action={
              <Button variant="ghost" size="sm" icon={Plus} onClick={() => setShowBloqueoModal(true)}>
                Agregar
              </Button>
            }
          >
            <div className="p-6">
              {bloqueos.length === 0 ? (
                <Text variant="bodyXs" className="text-slate-400 italic">Sin bloqueos registrados.</Text>
              ) : (
                <div className="space-y-2">
                  {bloqueos.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <div>
                        <Text variant="bodyXs" className="font-bold text-amber-800">{b.motivo}</Text>
                        <Text variant="bodyXs" className="text-amber-600">
                          {new Date(b.fecha_inicio).toLocaleDateString("es-PY")} — {new Date(b.fecha_fin).toLocaleDateString("es-PY")}
                        </Text>
                      </div>
                      <button
                        onClick={() => handleDeleteBloqueo(b.id)}
                        className="p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={12} className="text-amber-400 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </div>
      </main>

      {/* Modal: Disponibilidad */}
      <DisponibilidadModal
        open={showDisponibilidadModal}
        onClose={() => setShowDisponibilidadModal(false)}
        onSave={handleAddDisponibilidad}
      />

      {/* Modal: Bloqueo */}
      <BloqueoModal
        open={showBloqueoModal}
        onClose={() => setShowBloqueoModal(false)}
        onSave={handleAddBloqueo}
      />
    </div>
  );
}

// ─── Modales ────────────────────────────────────────────────────

function DisponibilidadModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    dia_semana: 0,
    hora_inicio: "08:00",
    hora_fin: "17:00",
  });

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, dia_semana: Number(form.dia_semana) });
    setForm({ dia_semana: 0, hora_inicio: "08:00", hora_fin: "17:00" });
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar Disponibilidad">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Field label="Día de la semana">
          <select
            value={form.dia_semana}
            onChange={(e) => setForm((p) => ({ ...p, dia_semana: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {DIAS_SEMANA.map((dia, i) => (
              <option key={i} value={i}>{dia}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Hora Inicio">
            <Input
              type="time"
              value={form.hora_inicio}
              onChange={(e) => setForm((p) => ({ ...p, hora_inicio: e.target.value }))}
              required
            />
          </Field>
          <Field label="Hora Fin">
            <Input
              type="time"
              value={form.hora_fin}
              onChange={(e) => setForm((p) => ({ ...p, hora_fin: e.target.value }))}
              required
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}

function BloqueoModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    motivo: "",
  });

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    setForm({ fecha_inicio: "", fecha_fin: "", motivo: "" });
  };

  return (
    <Modal open={open} onClose={onClose} title="Agregar Bloqueo de Agenda">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <Field label="Motivo *">
          <Input
            value={form.motivo}
            onChange={(e) => setForm((p) => ({ ...p, motivo: e.target.value }))}
            placeholder="Ej: Vacaciones, Licencia médica..."
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha Inicio *">
            <Input
              type="datetime-local"
              value={form.fecha_inicio}
              onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))}
              required
            />
          </Field>
          <Field label="Fecha Fin *">
            <Input
              type="datetime-local"
              value={form.fecha_fin}
              onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))}
              required
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}
