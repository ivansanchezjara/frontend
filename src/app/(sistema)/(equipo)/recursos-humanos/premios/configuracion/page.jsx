"use client";
import { useState, useEffect } from "react";
import {
  PageHeader,
  Badge,
  Button,
  Input,
  LoadingScreen,
  EmptyState,
  useToast,
  useConfirm,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  getConfiguracionesPremio,
  createConfiguracionPremio,
  updateConfiguracionPremio,
  deleteConfiguracionPremio,
} from "@/services/apis/rrhh";
import { getFuncionarios } from "@/services/apis/rrhh";
import {
  Settings, Plus, Pencil, Trash2, Save, X, Percent, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TIPOS_PREMIO = [
  { value: "vendedor", label: "Vendedor (% lucro personal)" },
  { value: "empleado", label: "Empleado (% lucro empresa)" },
  { value: "kpi", label: "KPI específico" },
];

export default function ConfiguracionPremiosPage() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ funcionario: "", tipo: "empleado", porcentaje: "", observaciones: "" });
  const [showForm, setShowForm] = useState(false);

  const { data: configs, loading, execute: fetchConfigs } = useApi(getConfiguracionesPremio, {
    auto: false, initialData: { results: [] },
  });
  const { data: funcionarios, execute: fetchFuncionarios } = useApi(getFuncionarios, {
    auto: false, initialData: { results: [] },
  });

  useEffect(() => {
    fetchConfigs();
    fetchFuncionarios({ activo: true, page_size: 100 });
  }, [fetchConfigs, fetchFuncionarios]);

  const lista = configs?.results || configs || [];
  const funcionariosList = funcionarios?.results || funcionarios || [];

  const handleNuevo = () => {
    setEditId(null);
    setFormData({ funcionario: "", tipo: "empleado", porcentaje: "", observaciones: "" });
    setShowForm(true);
  };

  const handleEditar = (config) => {
    setEditId(config.id);
    setFormData({
      funcionario: config.funcionario,
      tipo: config.tipo,
      porcentaje: config.porcentaje,
      observaciones: config.observaciones || "",
    });
    setShowForm(true);
  };

  const handleGuardar = async () => {
    if (!formData.funcionario || !formData.porcentaje) {
      showToast("Completá funcionario y porcentaje", "error");
      return;
    }

    try {
      const data = {
        funcionario: Number(formData.funcionario),
        tipo: formData.tipo,
        porcentaje: Number(formData.porcentaje),
        activo: true,
        observaciones: formData.observaciones,
      };

      if (editId) {
        await updateConfiguracionPremio(editId, data);
        showToast("Configuración actualizada", "success");
      } else {
        await createConfiguracionPremio(data);
        showToast("Configuración creada", "success");
      }
      setShowForm(false);
      fetchConfigs();
    } catch (err) {
      showToast(err?.data?.detail || err?.data?.funcionario?.[0] || "Error al guardar", "error");
    }
  };

  const handleEliminar = async (id) => {
    const ok = await confirm("¿Eliminar esta configuración de premio?", "Confirmar");
    if (!ok) return;
    try {
      await deleteConfiguracionPremio(id);
      showToast("Configuración eliminada", "success");
      fetchConfigs();
    } catch (err) {
      showToast(err?.data?.detail || "Error al eliminar", "error");
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Recursos Humanos", href: "/recursos-humanos" },
          { label: "Premios", href: "/recursos-humanos/premios" },
          { label: "Configuración" },
        ]}
        subtitle={
          <>
            <Settings size={12} />
            Asignar porcentaje de premio a cada funcionario
          </>
        }
      >
        <Button variant="primary" size="sm" icon={Plus} onClick={handleNuevo}>
          Nuevo
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[900px] mx-auto space-y-6">

          {/* Formulario */}
          {showForm && (
            <div className="bg-white rounded-2xl border border-purple-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">
                {editId ? "Editar configuración" : "Nueva configuración de premio"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Funcionario</label>
                  <select
                    value={formData.funcionario}
                    onChange={(e) => setFormData({ ...formData, funcionario: e.target.value })}
                    disabled={!!editId}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                  >
                    <option value="">Seleccionar...</option>
                    {funcionariosList.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.apellido}, {f.nombre} — {f.cargo_nombre || ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Tipo de premio</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                  >
                    {TIPOS_PREMIO.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Porcentaje (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.porcentaje}
                    onChange={(e) => setFormData({ ...formData, porcentaje: e.target.value })}
                    placeholder="Ej: 5.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Observaciones</label>
                  <input
                    type="text"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Notas opcionales..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" icon={Save} onClick={handleGuardar}>
                  {editId ? "Actualizar" : "Guardar"}
                </Button>
                <Button variant="ghost" size="sm" icon={X} onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Lista */}
          {loading ? (
            <LoadingScreen message="Cargando configuraciones..." />
          ) : lista.length === 0 ? (
            <EmptyState
              icon="⚙️"
              titulo="Sin configuraciones"
              descripcion="No hay premios configurados. Presioná 'Nuevo' para asignar un porcentaje a un funcionario."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase">Funcionario</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Cargo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Porcentaje</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Estado</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lista.map((config) => (
                    <tr key={config.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{config.funcionario_nombre}</td>
                      <td className="px-4 py-3 text-slate-600">{config.funcionario_cargo}</td>
                      <td className="px-4 py-3">
                        <Badge variant={config.tipo === "vendedor" ? "info" : "default"} className="text-[10px]">
                          {config.tipo_display}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-purple-700">
                          {config.porcentaje}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={config.activo ? "success" : "default"} className="text-[10px]">
                          {config.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditar(config)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleEliminar(config.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
