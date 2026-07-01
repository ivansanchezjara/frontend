"use client";

import { useState, useCallback } from "react";
import { Plus, Filter, Search, DollarSign, Calendar, Tag } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { getGastos, getCategoriasGasto } from "@/services/apis/finanzas";

const estadoBadge = {
  pendiente: "bg-yellow-100 text-yellow-700",
  pagado: "bg-green-100 text-green-700",
  anulado: "bg-red-100 text-red-700",
};

export default function FinanzasGastosPage() {
  const [filtros, setFiltros] = useState({});
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const { data: gastos, loading, refetch } = useApi(
    () => getGastos(filtros),
    [filtros]
  );

  const { data: categorias } = useApi(() => getCategoriasGasto(), []);

  const handleFiltro = useCallback((key, value) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Finanzas y Gastos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Registro y control de gastos operativos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <a
            href="/finanzas-gastos/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            <Plus className="w-4 h-4" />
            Nuevo Gasto
          </a>
        </div>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Estado
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              onChange={(e) => handleFiltro("estado", e.target.value)}
              value={filtros.estado || ""}
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="anulado">Anulado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Categoría
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              onChange={(e) => handleFiltro("categoria", e.target.value)}
              value={filtros.categoria || ""}
            >
              <option value="">Todas</option>
              {categorias?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Desde
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              onChange={(e) => handleFiltro("fecha_desde", e.target.value)}
              value={filtros.fecha_desde || ""}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Hasta
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              onChange={(e) => handleFiltro("fecha_hasta", e.target.value)}
              value={filtros.fecha_hasta || ""}
            />
          </div>
        </div>
      )}

      {/* Tabla de gastos */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando gastos...</div>
        ) : !gastos?.length ? (
          <div className="p-8 text-center text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium">No hay gastos registrados</p>
            <p className="text-sm mt-1">
              Registrá tu primer gasto con el botón &quot;Nuevo Gasto&quot;
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Concepto
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Categoría
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Monto
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  USD
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">
                  Fecha
                </th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gastos.map((gasto) => (
                <tr
                  key={gasto.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/finanzas-gastos/${gasto.id}`)
                  }
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {gasto.concepto}
                    </div>
                    {gasto.factura?.numero_factura && (
                      <div className="text-xs text-gray-500">
                        Fact. {gasto.factura.numero_factura}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {gasto.categoria_nombre}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {Number(gasto.monto_original).toLocaleString("es-PY")}{" "}
                    <span className="text-gray-400 text-xs">
                      {gasto.moneda_original}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">
                    {Number(gasto.monto_usd).toLocaleString("es-PY", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {new Date(gasto.fecha_gasto).toLocaleDateString("es-PY")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        estadoBadge[gasto.estado] || ""
                      }`}
                    >
                      {gasto.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
