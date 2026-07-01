"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Play,
  CheckCircle2,
  XCircle,
  Plus,
  MapPin,
  Clock,
  AlertTriangle,
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
import {
  getOrden,
  asignarOrden,
  iniciarOrden,
  completarOrden,
  cancelarOrden,
  createNota,
  createMaterial,
  getTecnicos,
} from "@/services/apis/asistencia";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────

function formatFecha(fechaStr) {
  if (!fechaStr) return "—";
  return new Date(fechaStr).toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ESTADO_BADGE = {
  pendiente: "warning",
  asignada: "info",
  en_progreso: "primary",
  completada: "success",
  cancelada: "danger",
};

const PRIORIDAD_COLORS = {
  baja: "text-slate-500",
  media: "text-sky-600",
  alta: "text-orange-600",
  urgente: "text-red-600 font-black",
};

// ─── Page ───────────────────────────────────────────────────────

export default function OrdenDetallePage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm, danger } = useConfirm();

  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  const handleError = useCallback((err) => {
    if (err.status === 404) router.push("/asistencia-tecnica/ordenes");
  }, [router]);

  const {
    data: orden,
    loading,
    execute: refetch,
    setData: setOrden,
  } = useApi(getOrden, { auto: false, initialData: null, onError: handleError });

  const { data: tecnicosData } = useApi(getTecnicos, {
    auto: true,
    initialData: { results: [] },
    args: [{ activo: "true" }],
  });
  const tecnicos = tecnicosData?.results || tecnicosData || [];

  useEffect(() => { if (id) refetch(id); }, [id, refetch]);

  // ─── Acciones ─────────────────────────────────────────────────

  const handleAsignar = async (tecnicoId) => {
    try {
      const updated = await asignarOrden(id, tecnicoId);
      setOrden(updated);
      setShowAsignarModal(false);
      showToast("Técnico asignado correctamente.", "success");
    } catch (err) {
      showToast(err?.message || "Error al asignar.", "error");
    }
  };

  const handleIniciar = async () => {
    const ok = await confirm(
      "¿Iniciar el trabajo en esta orden?",
      "Iniciar Trabajo",
      { confirmText: "Iniciar" }
    );
    if (!ok) return;
    try {
      const updated = await iniciarOrden(id);
      setOrden(updated);
      showToast("Trabajo iniciado.", "success");
    } catch (err) {
      showToast(err?.message || "Error al iniciar.", "error");
    }
  };

  const handleCompletar = async () => {
    const observaciones = prompt("Observaciones de cierre (opcional):");
    if (observaciones === null) return;
    try {
      const updated = await completarOrden(id, observaciones);
      setOrden(updated);
      showToast("Orden completada.", "success");
    } catch (err) {
      showToast(err?.message || "Error al completar.", "error");
    }
  };

  const handleCancelar = async () => {
    const motivo = prompt("Motivo de cancelación:");
    if (!motivo) return;
    try {
      const updated = await cancelarOrden(id, motivo);
      setOrden(updated);
      showToast("Orden cancelada.", "success");
    } catch (err) {
      showToast(err?.message || "Error al cancelar.", "error");
    }
  };

  const handleNota = async (contenido, esInterna) => {
    try {
      await createNota(id, { contenido, es_interna: esInterna });
      refetch(id);
      setShowNotaModal(false);
      showToast("Nota agregada.", "success");
    } catch (err) {
      showToast(err?.message || "Error al agregar nota.", "error");
    }
  };

  const handleMaterial = async (data) => {
    try {
      await createMaterial(id, data);
      refetch(id);
      setShowMaterialModal(false);
      showToast("Material registrado.", "success");
    } catch (err) {
      showToast(err?.message || "Error al registrar material.", "error");
    }
  };

  // ─── Render ───────────────────────────────────────────────────

  if (loading || !orden) return <LoadingScreen texto="Cargando orden..." />;

  const puedeAsignar = orden.estado === "pendiente";
  const puedeIniciar = orden.estado === "asignada";
  const puedeCompletar = orden.estado === "en_progreso";
  const puedeCancelar = ["pendiente", "asignada"].includes(orden.estado);
  const puedeAgregarMaterial = orden.estado === "en_progreso";

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Asistencia Técnica", href: "/asistencia-tecnica" },
          { label: "Órdenes", href: "/asistencia-tecnica/ordenes" },
          { label: `OT-${orden.numero}` },
        ]}
        subtitle={
          <span className="flex items-center gap-2">
            <Badge variant={ESTADO_BADGE[orden.estado]}>{orden.estado_display}</Badge>
            <span className={cn("text-xs font-bold uppercase", PRIORIDAD_COLORS[orden.prioridad])}>
              {orden.prioridad_display}
            </span>
          </span>
        }
      >
        <div className="flex items-center gap-2 flex-wrap">
          {puedeAsignar && (
            <Button variant="primary" size="sm" icon={User} onClick={() => setShowAsignarModal(true)}>
              Asignar
            </Button>
          )}
          {puedeIniciar && (
            <Button variant="primary" size="sm" icon={Play} onClick={handleIniciar}>
              Iniciar
            </Button>
          )}
          {puedeCompletar && (
            <Button variant="success" size="sm" icon={CheckCircle2} onClick={handleCompletar}>
              Completar
            </Button>
          )}
          {puedeCancelar && (
            <Button variant="danger" size="sm" icon={XCircle} onClick={handleCancelar}>
              Cancelar
            </Button>
          )}
        </div>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Info general */}
          <Section title="Información General">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">Cliente</Text>
                <Text className="font-semibold">{orden.cliente_nombre}</Text>
              </div>
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">Tipo de Servicio</Text>
                <Text className="font-semibold">{orden.tipo_servicio_nombre}</Text>
              </div>
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">Técnico Asignado</Text>
                <Text className="font-semibold">{orden.tecnico_nombre || "Sin asignar"}</Text>
              </div>
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">Producto Atendido</Text>
                <Text className="font-semibold">{orden.producto_nombre || "N/A"}</Text>
              </div>
              <div className="col-span-full">
                <Text variant="label" className="text-slate-400 mb-0.5">Descripción</Text>
                <Text className="whitespace-pre-wrap">{orden.descripcion_problema}</Text>
              </div>
            </div>
          </Section>

          {/* Ubicación */}
          <Section title="Ubicación" action={
            orden.latitud && orden.longitud && (
              <a
                href={`https://www.google.com/maps?q=${orden.latitud},${orden.longitud}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <MapPin size={12} /> Ver en mapa
              </a>
            )
          }>
            <div className="p-6">
              <Text>{orden.direccion_servicio}</Text>
              {orden.latitud && orden.longitud && (
                <Text variant="bodyXs" className="text-slate-400 mt-1">
                  Coords: {orden.latitud}, {orden.longitud}
                </Text>
              )}
            </div>
          </Section>

          {/* SLA */}
          <Section title="SLA y Tiempos">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">Creación</Text>
                <Text variant="bodyXs">{formatFecha(orden.fecha_creacion)}</Text>
              </div>
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">Asignación</Text>
                <Text variant="bodyXs">{formatFecha(orden.fecha_asignacion)}</Text>
              </div>
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">Inicio</Text>
                <Text variant="bodyXs">{formatFecha(orden.fecha_inicio_trabajo)}</Text>
              </div>
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">Completada</Text>
                <Text variant="bodyXs">{formatFecha(orden.fecha_completada)}</Text>
              </div>
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">Límite Respuesta</Text>
                <div className="flex items-center gap-1.5">
                  <Text variant="bodyXs">{formatFecha(orden.fecha_limite_respuesta)}</Text>
                  {orden.sla_respuesta_cumplido === true && <CheckCircle2 size={12} className="text-emerald-500" />}
                  {orden.sla_respuesta_cumplido === false && <AlertTriangle size={12} className="text-red-500" />}
                </div>
              </div>
              <div>
                <Text variant="label" className="text-slate-400 mb-0.5">Límite Resolución</Text>
                <div className="flex items-center gap-1.5">
                  <Text variant="bodyXs">{formatFecha(orden.fecha_limite_resolucion)}</Text>
                  {orden.sla_resolucion_cumplido === true && <CheckCircle2 size={12} className="text-emerald-500" />}
                  {orden.sla_resolucion_cumplido === false && <AlertTriangle size={12} className="text-red-500" />}
                </div>
              </div>
            </div>
          </Section>

          {/* Notas */}
          <Section
            title="Notas Técnicas"
            action={
              <Button variant="ghost" size="sm" icon={Plus} onClick={() => setShowNotaModal(true)}>
                Agregar
              </Button>
            }
          >
            <div className="p-6 space-y-3">
              {(!orden.notas || orden.notas.length === 0) ? (
                <Text variant="bodyXs" className="text-slate-400 italic">Sin notas registradas.</Text>
              ) : (
                orden.notas.map((nota) => (
                  <div key={nota.id} className={cn(
                    "p-3 rounded-lg border",
                    nota.es_interna ? "bg-amber-50 border-amber-100" : "bg-slate-50 border-slate-100"
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <Text variant="label" className="font-bold text-slate-700">
                        {nota.autor_nombre}
                        {nota.es_interna && <Badge variant="warning" className="ml-2 text-[9px]">Interna</Badge>}
                      </Text>
                      <Text variant="bodyXs" className="text-slate-400">{formatFecha(nota.fecha)}</Text>
                    </div>
                    <Text variant="bodyXs" className="whitespace-pre-wrap">{nota.contenido}</Text>
                  </div>
                ))
              )}
            </div>
          </Section>

          {/* Materiales */}
          <Section
            title="Materiales Utilizados"
            action={puedeAgregarMaterial && (
              <Button variant="ghost" size="sm" icon={Plus} onClick={() => setShowMaterialModal(true)}>
                Agregar
              </Button>
            )}
          >
            <div className="p-6">
              {(!orden.materiales || orden.materiales.length === 0) ? (
                <Text variant="bodyXs" className="text-slate-400 italic">Sin materiales registrados.</Text>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 text-[11px] font-bold uppercase text-slate-400">Material</th>
                      <th className="text-center py-2 text-[11px] font-bold uppercase text-slate-400">Cantidad</th>
                      <th className="text-center py-2 text-[11px] font-bold uppercase text-slate-400">Origen</th>
                      <th className="text-right py-2 text-[11px] font-bold uppercase text-slate-400">Costo USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orden.materiales.map((mat) => (
                      <tr key={mat.id} className="border-b border-slate-50">
                        <td className="py-2">
                          <Text variant="bodyXs" className="font-medium">
                            {mat.variante_codigo || mat.descripcion}
                          </Text>
                          {mat.variante_nombre && (
                            <Text variant="bodyXs" className="text-slate-400">{mat.variante_nombre}</Text>
                          )}
                        </td>
                        <td className="py-2 text-center">{mat.cantidad}</td>
                        <td className="py-2 text-center">
                          <Badge variant={mat.origen === "inventario" ? "info" : "warning"}>
                            {mat.origen}
                          </Badge>
                        </td>
                        <td className="py-2 text-right font-medium">${Number(mat.costo_usd).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Section>

          {/* Observaciones de cierre */}
          {orden.observaciones_cierre && (
            <Section title="Observaciones de Cierre">
              <div className="p-6">
                <Text className="whitespace-pre-wrap">{orden.observaciones_cierre}</Text>
              </div>
            </Section>
          )}
        </div>
      </main>

      {/* Modal: Asignar Técnico */}
      <AsignarModal
        open={showAsignarModal}
        onClose={() => setShowAsignarModal(false)}
        tecnicos={tecnicos}
        onAsignar={handleAsignar}
      />

      {/* Modal: Nueva Nota */}
      <NotaModal
        open={showNotaModal}
        onClose={() => setShowNotaModal(false)}
        onSave={handleNota}
      />

      {/* Modal: Nuevo Material */}
      <MaterialModal
        open={showMaterialModal}
        onClose={() => setShowMaterialModal(false)}
        onSave={handleMaterial}
      />
    </div>
  );
}

// ─── Modales ────────────────────────────────────────────────────

function AsignarModal({ open, onClose, tecnicos, onAsignar }) {
  if (!open) return null;
  return (
    <Modal isOpen={open} onClose={onClose} title="Asignar Técnico">
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {tecnicos.map((t) => (
          <button
            key={t.id}
            onClick={() => onAsignar(t.id)}
            className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all"
          >
            <Text className="font-semibold">{t.nombre_completo}</Text>
            <Text variant="bodyXs" className="text-slate-500">
              {t.tipo_display} · {t.especialidades_nombres?.join(", ") || "Sin especialidad"}
            </Text>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function NotaModal({ open, onClose, onSave }) {
  const [contenido, setContenido] = useState("");
  const [esInterna, setEsInterna] = useState(false);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contenido.trim()) return;
    onSave(contenido, esInterna);
    setContenido("");
    setEsInterna(false);
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Agregar Nota Técnica">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Contenido">
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Escribir nota..."
            required
          />
        </Field>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={esInterna}
            onChange={(e) => setEsInterna(e.target.checked)}
            className="rounded"
          />
          <Text variant="bodyXs">Nota interna (solo visible para coordinadores)</Text>
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit">Guardar</Button>
        </div>
      </form>
    </Modal>
  );
}

function MaterialModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    origen: "externo",
    descripcion: "",
    cantidad: "1",
    costo_usd: "0",
    variante: "",
  });

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      origen: form.origen,
      cantidad: Number(form.cantidad),
      costo_usd: Number(form.costo_usd),
    };
    if (form.origen === "inventario" && form.variante) {
      data.variante = Number(form.variante);
    }
    if (form.descripcion) data.descripcion = form.descripcion;
    onSave(data);
    setForm({ origen: "externo", descripcion: "", cantidad: "1", costo_usd: "0", variante: "" });
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Registrar Material">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Origen">
          <select
            value={form.origen}
            onChange={(e) => setForm((p) => ({ ...p, origen: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="inventario">Inventario propio</option>
            <option value="externo">Compra externa</option>
          </select>
        </Field>

        {form.origen === "inventario" && (
          <Field label="ID Variante">
            <Input
              value={form.variante}
              onChange={(e) => setForm((p) => ({ ...p, variante: e.target.value }))}
              placeholder="ID de la variante..."
            />
          </Field>
        )}

        <Field label="Descripción">
          <Input
            value={form.descripcion}
            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Nombre o descripción del material..."
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Cantidad">
            <Input
              type="number"
              min="1"
              value={form.cantidad}
              onChange={(e) => setForm((p) => ({ ...p, cantidad: e.target.value }))}
            />
          </Field>
          <Field label="Costo USD (unitario)">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.costo_usd}
              onChange={(e) => setForm((p) => ({ ...p, costo_usd: e.target.value }))}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit">Registrar</Button>
        </div>
      </form>
    </Modal>
  );
}
