"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users, Wrench, Phone, Mail, Edit2 } from "lucide-react";
import {
  PageHeader,
  Button,
  Badge,
  Text,
  SearchBar,
  EmptyState,
  LoadingScreen,
  Modal,
  Input,
  Field,
} from "@/components/ui";
import { Heading } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui";
import {
  getTecnicos,
  createTecnico,
  updateTecnico,
  getTiposServicio,
} from "@/services/apis/asistencia";
import { cn } from "@/lib/utils";

// ─── Contenido ──────────────────────────────────────────────────

function TecnicosContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("");

  const {
    data: tecnicosData,
    loading,
    execute: refetch,
  } = useApi(getTecnicos, { auto: true, initialData: { results: [] } });

  const { data: tiposData } = useApi(getTiposServicio, {
    auto: true,
    initialData: { results: [] },
    args: [{ activo: "true" }],
  });

  const tecnicos = tecnicosData?.results || tecnicosData || [];
  const tipos = tiposData?.results || tiposData || [];

  const tecnicosFiltrados = filtroTipo
    ? tecnicos.filter((t) => t.tipo === filtroTipo)
    : tecnicos;

  const handleSave = async (data) => {
    try {
      if (editando) {
        await updateTecnico(editando.id, data);
        showToast("Técnico actualizado.", "success");
      } else {
        await createTecnico(data);
        showToast("Técnico creado.", "success");
      }
      setShowModal(false);
      setEditando(null);
      refetch();
    } catch (err) {
      showToast(err?.message || "Error al guardar.", "error");
    }
  };

  const handleEditar = (tecnico) => {
    setEditando(tecnico);
    setShowModal(true);
  };

  if (loading && tecnicos.length === 0) {
    return <LoadingScreen texto="Cargando técnicos..." />;
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Asistencia Técnica", href: "/asistencia-tecnica" },
          { label: "Técnicos" },
        ]}
        subtitle={`${tecnicosFiltrados.length} técnicos`}
        subtitleClassName="text-blue-600"
      >
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => { setEditando(null); setShowModal(true); }}
          className="rounded-xl font-bold text-xs shadow-lg"
        >
          NUEVO TÉCNICO
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Filtros */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className={cn(
                  "appearance-none text-xs font-semibold rounded-lg px-2 py-1.5 pr-6 cursor-pointer",
                  "border transition-all outline-none",
                  filtroTipo
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                <option value="">Tipo: Todos</option>
                <option value="interno">Internos</option>
                <option value="externo">Externos</option>
              </select>
            </div>
          </div>

          {/* Grid de técnicos */}
          {tecnicosFiltrados.length === 0 ? (
            <EmptyState
              titulo="Sin técnicos registrados"
              descripcion="Agregá el primer técnico al equipo."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tecnicosFiltrados.map((tecnico) => (
                <div
                  key={tecnico.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {tecnico.nombre_completo?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <Text className="font-bold text-slate-800 text-sm leading-tight">
                          {tecnico.nombre_completo}
                        </Text>
                        <Badge
                          variant={tecnico.tipo === "interno" ? "info" : "warning"}
                          className="mt-0.5"
                        >
                          {tecnico.tipo_display}
                        </Badge>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditar(tecnico)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 size={14} className="text-slate-400" />
                    </button>
                  </div>

                  {tecnico.telefono && (
                    <div className="flex items-center gap-2 mt-2">
                      <Phone size={12} className="text-slate-400" />
                      <Text variant="bodyXs" className="text-slate-500">{tecnico.telefono}</Text>
                    </div>
                  )}
                  {tecnico.email && (
                    <div className="flex items-center gap-2 mt-1">
                      <Mail size={12} className="text-slate-400" />
                      <Text variant="bodyXs" className="text-slate-500">{tecnico.email}</Text>
                    </div>
                  )}

                  {tecnico.especialidades_nombres?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {tecnico.especialidades_nombres.map((esp, i) => (
                        <span
                          key={i}
                          className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500"
                        >
                          {esp}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <Link
                      href={`/asistencia-tecnica/tecnicos/${tecnico.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Ver agenda y detalle →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Crear/Editar */}
      <TecnicoModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditando(null); }}
        onSave={handleSave}
        tecnico={editando}
        tiposServicio={tipos}
      />
    </div>
  );
}

// ─── Modal ──────────────────────────────────────────────────────

function TecnicoModal({ open, onClose, onSave, tecnico, tiposServicio }) {
  const [form, setForm] = useState({
    user: "",
    nombre_completo: "",
    telefono: "",
    email: "",
    tipo: "interno",
    especialidades: [],
    activo: true,
    notas: "",
  });

  // Sync form when modal opens or tecnico changes
  useEffect(() => {
    if (!open) return;
    if (tecnico) {
      setForm({
        user: tecnico.user || "",
        nombre_completo: tecnico.nombre_completo || "",
        telefono: tecnico.telefono || "",
        email: tecnico.email || "",
        tipo: tecnico.tipo || "interno",
        especialidades: tecnico.especialidades || [],
        activo: tecnico.activo ?? true,
        notas: tecnico.notas || "",
      });
    } else {
      setForm({
        user: "",
        nombre_completo: "",
        telefono: "",
        email: "",
        tipo: "interno",
        especialidades: [],
        activo: true,
        notas: "",
      });
    }
  }, [tecnico, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (data.user) data.user = Number(data.user);
    onSave(data);
  };

  const toggleEspecialidad = (id) => {
    setForm((prev) => ({
      ...prev,
      especialidades: prev.especialidades.includes(id)
        ? prev.especialidades.filter((e) => e !== id)
        : [...prev.especialidades, id],
    }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tecnico ? "Editar Técnico" : "Nuevo Técnico"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre Completo *">
            <Input
              value={form.nombre_completo}
              onChange={(e) => setForm((p) => ({ ...p, nombre_completo: e.target.value }))}
              placeholder="Nombre completo"
              required
            />
          </Field>

          {!tecnico && (
            <Field label="ID de Usuario *">
              <Input
                type="number"
                value={form.user}
                onChange={(e) => setForm((p) => ({ ...p, user: e.target.value }))}
                placeholder="ID del user en Django"
                required
              />
            </Field>
          )}

          <Field label="Tipo">
            <select
              value={form.tipo}
              onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="interno">Interno</option>
              <option value="externo">Externo</option>
            </select>
          </Field>

          <Field label="Teléfono">
            <Input
              value={form.telefono}
              onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))}
              placeholder="0981..."
            />
          </Field>

          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="tecnico@empresa.com"
            />
          </Field>
        </div>

        {/* Especialidades */}
        <Field label="Especialidades">
          <div className="flex flex-wrap gap-2">
            {tiposServicio.map((tipo) => (
              <button
                key={tipo.id}
                type="button"
                onClick={() => toggleEspecialidad(tipo.id)}
                className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all",
                  form.especialidades.includes(tipo.id)
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                )}
              >
                {tipo.nombre}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Notas">
          <textarea
            value={form.notas}
            onChange={(e) => setForm((p) => ({ ...p, notas: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Observaciones internas..."
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" type="submit">
            {tecnico ? "Guardar Cambios" : "Crear Técnico"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function TecnicosPage() {
  return (
    <Suspense fallback={<LoadingScreen texto="Cargando técnicos..." />}>
      <TecnicosContent />
    </Suspense>
  );
}
