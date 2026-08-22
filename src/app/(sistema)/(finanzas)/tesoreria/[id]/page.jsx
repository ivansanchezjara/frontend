"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Building2 } from "lucide-react";
import { Button, PageHeader, LoadingScreen, Pagination } from "@/components/ui";
import { Text, Heading } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getCuenta, getMovimientos, getCuentas } from "@/services/apis/tesoreria";
import { formatMonto, TIPO_ICONS, TIPO_COLORS, MONEDA_CONFIG } from "@/components/finanzas/tesoreria/helpers";
import { cn } from "@/lib/utils";
import TransferenciaForm from "@/components/finanzas/tesoreria/TransferenciaForm";
import MovimientosTable from "@/components/finanzas/tesoreria/MovimientosTable";

export default function CuentaDetallePage() {
  const { id } = useParams();
  const [filtroTipo, setFiltroTipo] = useState("");
  const [page, setPage] = useState(1);
  const [showTransferencia, setShowTransferencia] = useState(false);

  // Cargar cuenta
  const { data: cuenta, loading: loadingCuenta, execute: fetchCuenta } = useApi(getCuenta, {
    auto: false, initialData: null,
  });

  // Cargar todas las cuentas (para transferencia)
  const { data: cuentasData, execute: fetchCuentas } = useApi(getCuentas, {
    auto: true, initialData: { results: [] },
  });
  const cuentas = cuentasData?.results || cuentasData || [];

  // Cargar movimientos
  const { data: movData, loading: loadingMov, execute: fetchMovimientos } = useApi(getMovimientos, {
    auto: false, initialData: { results: [], count: 0 },
  });

  useEffect(() => {
    if (id) fetchCuenta(id);
  }, [id, fetchCuenta]);

  useEffect(() => {
    if (id) {
      const params = { cuenta: id, page };
      if (filtroTipo) params.tipo = filtroTipo;
      fetchMovimientos(params);
    }
  }, [id, page, filtroTipo, fetchMovimientos]);

  const movimientos = movData?.results || [];
  const totalCount = movData?.count || 0;

  if (loadingCuenta || !cuenta) {
    return <LoadingScreen texto="Cargando cuenta..." />;
  }

  const Icon = TIPO_ICONS[cuenta.tipo] || Building2;
  const colorBg = TIPO_COLORS[cuenta.tipo] || "bg-slate-500";
  const moneda = cuenta.moneda_principal || "PYG";
  const config = MONEDA_CONFIG[moneda];
  const saldo = Number(cuenta.saldo || 0);

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Tesorería", href: "/tesoreria" },
          { label: cuenta.nombre },
        ]}
        subtitle={`${cuenta.tipo_display}${cuenta.entidad_bancaria ? ` • ${cuenta.entidad_bancaria}` : ""}`}
        subtitleClassName="text-purple-600"
      />

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Acciones */}
          <div className="flex items-center justify-end">
            <Button variant="primary" size="sm" icon={ArrowRight} onClick={() => setShowTransferencia(true)}
              className="bg-purple-600 hover:bg-purple-700">
              Transferir
            </Button>
          </div>

          {/* Card resumen de la cuenta */}
          <div className={cn("border rounded-2xl p-5", config.color)}>
            <div className="flex items-center gap-4">
              <span className={cn("inline-flex h-12 w-12 items-center justify-center rounded-xl text-white shrink-0", colorBg)}>
                <Icon size={22} />
              </span>
              <div className="flex-1">
                <Text variant="bodySmBold" className="text-slate-800">{cuenta.nombre}</Text>
                <Text variant="mutedXs">
                  {cuenta.tipo_display}
                  {cuenta.entidad_bancaria && ` • ${cuenta.entidad_bancaria}`}
                  {cuenta.numero_cuenta && ` • Cta. ${cuenta.numero_cuenta}`}
                </Text>
              </div>
              <div className="text-right">
                <Text variant="label" className="mb-0.5">Saldo actual</Text>
                <Heading level={4} className={cn(saldo >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {formatMonto(saldo, moneda)}
                </Heading>
              </div>
            </div>
          </div>

          {/* Transferencia */}
          {showTransferencia && (
            <TransferenciaForm
              cuentas={cuentas}
              onClose={() => setShowTransferencia(false)}
              onSuccess={() => { fetchCuenta(id); fetchMovimientos({ cuenta: id, page }); setShowTransferencia(false); }}
            />
          )}

          {/* Movimientos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Text variant="label">Movimientos</Text>
              <select value={filtroTipo} onChange={(e) => { setFiltroTipo(e.target.value); setPage(1); }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                <option value="">Todos</option>
                <option value="ingreso">Ingresos</option>
                <option value="egreso">Egresos</option>
              </select>
            </div>

            {loadingMov ? <LoadingScreen texto="Cargando movimientos..." /> : (
              <>
                <MovimientosTable data={movimientos} showCuenta={false} />
                {totalCount > 20 && <Pagination count={totalCount} pageSize={20} currentPage={page} onPageChange={setPage} />}
              </>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
