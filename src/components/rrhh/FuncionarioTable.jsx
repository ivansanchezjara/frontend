"use client";
import { Eye, Pencil } from "lucide-react";

const estadoColors = {
  activo: "bg-emerald-100 text-emerald-700",
  inactivo: "bg-slate-100 text-slate-600",
  licencia: "bg-amber-100 text-amber-700",
  desvinculado: "bg-red-100 text-red-700",
};

export default function FuncionarioTable({ funcionarios, onSelect, onEdit }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Funcionario
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Cédula
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Departamento
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Cargo
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Ingreso
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Estado
              </th>
              <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.map((f) => (
              <tr
                key={f.id}
                className="border-b border-slate-50 hover:bg-amber-50/30 transition-colors cursor-pointer"
                onClick={() => onSelect(f)}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{f.nombre_completo || `${f.apellido}, ${f.nombre}`}</p>
                  {f.telefono && (
                    <p className="text-[11px] text-slate-400">{f.telefono}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                  {f.cedula}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {f.departamento_nombre}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {f.cargo_nombre}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {f.fecha_ingreso}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${estadoColors[f.estado] || "bg-slate-100 text-slate-600"}`}>
                    {f.estado_display || f.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelect(f); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Ver detalle"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(f); }}
                      className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
