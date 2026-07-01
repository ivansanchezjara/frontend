"use client";
import { useState, useEffect } from "react";
import {
  EmptyState,
  LoadingScreen,
  PageHeader,
  Pagination,
  SearchBar,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getFuncionarios, getDepartamentos, getCargos } from "@/services/apis/rrhh";
import FuncionarioTable from "@/components/rrhh/FuncionarioTable";
import FuncionarioModal from "@/components/rrhh/FuncionarioModal";
import FuncionarioDetail from "@/components/rrhh/FuncionarioDetail";
import {
  Users,
  UserPlus,
  Building2,
  Briefcase,
  UserCheck,
  UserX,
} from "lucide-react";

const PAGE_SIZE = 20;

export default function RecursosHumanosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);
  const [editingFuncionario, setEditingFuncionario] = useState(null);

  const {
    data: funcionariosData,
    loading,
    execute: fetchFuncionarios,
  } = useApi(getFuncionarios, {
    auto: false,
    initialData: { results: [], count: 0 },
  });

  const { data: departamentosData } = useApi(getDepartamentos, {
    auto: true,
    initialData: { results: [] },
  });

  const { data: cargosData } = useApi(getCargos, {
    auto: true,
    initialData: { results: [] },
  });

  const funcionarios = funcionariosData?.results || [];
  const count = funcionariosData?.count || 0;
  const departamentos = departamentosData?.results || departamentosData || [];
  const cargos = cargosData?.results || cargosData || [];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchFuncionarios({
        page,
        search: searchTerm,
        estado: filtroEstado || undefined,
        departamento: filtroDepartamento || undefined,
      });
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filtroEstado, filtroDepartamento, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filtroEstado, filtroDepartamento]);

  const ESTADO_OPTIONS = [
    { id: "", label: "Todos", icon: Users },
    { id: "activo", label: "Activos", icon: UserCheck },
    { id: "licencia", label: "En Licencia", icon: UserX },
    { id: "desvinculado", label: "Desvinculados", icon: UserX },
  ];

  const handleCreated = () => {
    setShowModal(false);
    setEditingFuncionario(null);
    fetchFuncionarios({ page, search: searchTerm });
  };

  const handleEdit = (funcionario) => {
    setEditingFuncionario(funcionario);
    setShowModal(true);
  };

  if (selectedFuncionario) {
    return (
      <FuncionarioDetail
        funcionarioId={selectedFuncionario}
        onBack={() => setSelectedFuncionario(null)}
        onRefresh={() => fetchFuncionarios({ page, search: searchTerm })}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        title="Recursos Humanos"
        subtitle={
          <>
            <Users size={12} /> Gestión de Funcionarios y Legajos
          </>
        }
        actions={
          <button
            onClick={() => { setEditingFuncionario(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
          >
            <UserPlus size={16} />
            Nuevo Funcionario
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Stats rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 group hover:border-amber-200 transition-all">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users size={16} />
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total</p>
                <p className="text-lg font-bold text-slate-800">{count}</p>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 group hover:border-emerald-200 transition-all">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck size={16} />
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Activos</p>
                <p className="text-lg font-bold text-slate-800">
                  {funcionarios.filter(f => f.estado === "activo").length}
                </p>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 group hover:border-blue-200 transition-all">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 size={16} />
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Departamentos</p>
                <p className="text-lg font-bold text-slate-800">{departamentos.length}</p>
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 group hover:border-purple-200 transition-all">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Briefcase size={16} />
              </div>
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Cargos</p>
                <p className="text-lg font-bold text-slate-800">{cargos.length}</p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {ESTADO_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setFiltroEstado(opt.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      filtroEstado === opt.id
                        ? "bg-amber-100 text-amber-700 shadow-lg ring-2 ring-amber-200"
                        : "bg-white/50 text-slate-400 hover:bg-white hover:text-slate-600 border border-slate-100"
                    }`}
                  >
                    <Icon size={12} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="w-full xl:max-w-md flex items-center gap-3">
              <div className="flex-1">
                <SearchBar
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Buscar por nombre, cédula, teléfono..."
                />
              </div>
              <select
                value={filtroDepartamento}
                onChange={(e) => setFiltroDepartamento(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-600"
              >
                <option value="">Todos los Dptos.</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="w-full">
            {loading ? (
              <LoadingScreen message="Cargando funcionarios..." />
            ) : funcionarios.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No hay funcionarios registrados"
                description="Agrega tu primer funcionario para comenzar."
              />
            ) : (
              <>
                <FuncionarioTable
                  funcionarios={funcionarios}
                  onSelect={(f) => setSelectedFuncionario(f.id)}
                  onEdit={handleEdit}
                />
                <Pagination
                  count={count}
                  pageSize={PAGE_SIZE}
                  currentPage={page}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <FuncionarioModal
          funcionario={editingFuncionario}
          departamentos={departamentos}
          cargos={cargos}
          onClose={() => { setShowModal(false); setEditingFuncionario(null); }}
          onSuccess={handleCreated}
        />
      )}
    </div>
  );
}
