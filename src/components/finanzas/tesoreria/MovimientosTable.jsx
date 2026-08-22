"use client";

import { Badge, DataTable, Text } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatMonto, formatFecha } from "./helpers";

const MOVIMIENTO_COLUMNS = [
  {
    key: "fecha",
    label: "Fecha",
    resizable: true,
    width: 100,
    minWidth: 80,
    render: (val) => <span className="text-xs text-slate-600">{formatFecha(val)}</span>,
  },
  {
    key: "cuenta_nombre",
    label: "Cuenta",
    resizable: true,
    width: 160,
    minWidth: 100,
    render: (val) => (
      <Text variant="bodyXs" className="font-medium text-slate-700 truncate">
        {val || "—"}
      </Text>
    ),
  },
  {
    key: "concepto",
    label: "Concepto",
    resizable: true,
    width: 300,
    minWidth: 150,
    cellClassName: "max-w-0",
    render: (val) => (
      <Text variant="bodyXs" className="font-medium text-slate-700 truncate">
        {val || "—"}
      </Text>
    ),
  },
  {
    key: "origen_display",
    label: "Origen",
    resizable: true,
    width: 120,
    minWidth: 80,
    render: (val, row) => (
      <Badge variant={row.tipo === "ingreso" ? "success" : "danger"} className="text-[10px]">
        {val}
      </Badge>
    ),
  },
  {
    key: "monto_original",
    label: "Monto",
    align: "right",
    resizable: true,
    width: 150,
    minWidth: 100,
    render: (val, row) => (
      <span className={cn("text-xs font-bold", row.tipo === "ingreso" ? "text-emerald-600" : "text-red-600")}>
        {row.tipo === "ingreso" ? "+" : "-"} {formatMonto(val, row.moneda_original)}
      </span>
    ),
  },
];

/**
 * Tabla reutilizable de movimientos financieros.
 * @param {Object} props
 * @param {Array} props.data - Lista de movimientos
 * @param {boolean} [props.showCuenta=true] - Mostrar columna "Cuenta"
 */
export default function MovimientosTable({ data = [], showCuenta = true }) {
  const columns = showCuenta
    ? MOVIMIENTO_COLUMNS
    : MOVIMIENTO_COLUMNS.filter((col) => col.key !== "cuenta_nombre");

  return (
    <DataTable
      columns={columns}
      data={data}
      rowKey="id"
      size="sm"
      fixedLayout
      emptyMessage="Sin movimientos registrados."
      emptyIcon="📋"
    />
  );
}
