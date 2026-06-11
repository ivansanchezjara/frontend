"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import EmptyState from '../feedback/EmptyState';
import ResizableHeader from './ResizableHeader';

/**
 * DataTable — Componente genérico de tabla para todo el ERP.
 * Encapsula estilos, estructura y patrones comunes: resizable headers,
 * columnas dinámicas, selección, edición inline, colores semafóricos, etc.
 *
 * ═══ PROPS DE COLUMNAS ═══
 * @param {Object[]} columns - Definición de columnas
 * @param {string}   columns[].key - Identificador único de la columna
 * @param {string}   columns[].label - Texto del header
 * @param {string}   [columns[].align] - 'left' (default), 'center', 'right'
 * @param {string}   [columns[].className] - Clases extra para th y td
 * @param {string}   [columns[].headerClassName] - Clases extra solo para th
 * @param {string}   [columns[].cellClassName] - Clases extra solo para td
 * @param {number}   [columns[].width] - Ancho por defecto en px
 * @param {number}   [columns[].minWidth] - Ancho mínimo en px (para resize)
 * @param {boolean}  [columns[].resizable] - Habilitar resize drag en esta columna
 * @param {boolean}  [columns[].required] - Columna siempre visible (no se puede ocultar)
 * @param {Function} [columns[].render] - (value, row, rowIndex) => ReactNode
 *
 * ═══ PROPS DE DATOS ═══
 * @param {Object[]} data - Array de objetos (filas)
 * @param {string}   [rowKey] - Campo para key de fila (default: 'id')
 * @param {Function} [onRowClick] - (row, index) => void
 * @param {string|number} [activeRowId] - ID de fila activa/resaltada
 *
 * ═══ PROPS DE VISIBILIDAD ═══
 * @param {string[]} [visibleColumns] - Array de keys visibles (null = todas visibles)
 *
 * ═══ PROPS DE SELECCIÓN ═══
 * @param {boolean}  [selectable] - Checkboxes de selección
 * @param {Array}    [selected] - IDs seleccionados
 * @param {Function} [onSelect] - (id) => void — toggle individual
 * @param {Function} [onSelectAll] - () => void — toggle todos
 *
 * ═══ PROPS DE LAYOUT ═══
 * @param {boolean}  [stickyHeader] - Header sticky para scroll vertical
 * @param {string}   [maxHeight] - Max height (habilita scroll vertical)
 * @param {string}   [variant] - 'card' | 'rounded' | 'flat'
 * @param {string}   [size] - 'sm' | 'md' | 'lg'
 * @param {boolean}  [fixedLayout] - table-layout: fixed (mejor para columnas con width definido)
 * @param {string}   [className] - Clases extra para el wrapper
 * @param {string}   [emptyMessage] - Mensaje del empty state
 * @param {string}   [emptyIcon] - Ícono del empty state
 * @param {React.ReactNode} [footer] - Contenido debajo de la tabla
 */
export default function DataTable({
  columns,
  data = [],
  rowKey = 'id',
  onRowClick,
  activeRowId,
  visibleColumns = null,
  selectable = false,
  selected = [],
  onSelect,
  onSelectAll,
  stickyHeader = false,
  maxHeight,
  variant = 'card',
  size = 'md',
  fixedLayout = false,
  className,
  emptyMessage = 'No hay datos para mostrar',
  emptyIcon = '📋',
  footer,
}) {
  if (!data || data.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyMessage} />;
  }

  // Filtrar columnas por visibilidad
  const displayColumns = visibleColumns
    ? columns.filter((col) => col.required || visibleColumns.includes(col.key))
    : columns;

  const allSelected = data.length > 0 && selected.length === data.length;
  const hasResizable = displayColumns.some((col) => col.resizable);

  // Tamaños
  const cellPadding = { sm: 'px-2 py-1.5', md: 'px-3 py-2.5', lg: 'px-4 py-3' }[size];
  const headerPadding = { sm: 'px-2 py-2', md: 'px-3 py-3', lg: 'px-4 py-4' }[size];

  const alignClass = (align) => ({
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align || 'left']);

  // Variantes de wrapper
  const wrapperStyles = {
    card: 'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden',
    rounded: 'bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden',
    flat: '',
  };

  const tableClasses = cn(
    'text-left border-collapse',
    fixedLayout ? 'w-max min-w-full table-fixed' : 'w-full',
  );

  // ─── Header Cell ─────────────────────────────────────────
  const renderHeaderCell = (col) => {
    const commonClasses = cn(
      headerPadding,
      'text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap',
      alignClass(col.align),
      col.className,
      col.headerClassName,
    );

    if (col.resizable) {
      return (
        <ResizableHeader
          key={col.key}
          defaultWidth={col.width || 150}
          minWidth={col.minWidth || 50}
          className={commonClasses}
        >
          {col.label}
        </ResizableHeader>
      );
    }

    return (
      <th
        key={col.key}
        className={commonClasses}
        style={col.width ? { minWidth: col.width, width: col.width } : undefined}
      >
        {col.label}
      </th>
    );
  };

  return (
    <div className={cn(wrapperStyles[variant] || wrapperStyles.card, className)}>
      <div
        className={cn('w-full overflow-x-auto', maxHeight && 'overflow-y-auto')}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table className={tableClasses}>
          <thead className={cn(
            'bg-slate-50 border-b border-slate-200',
            stickyHeader && 'sticky top-0 z-10',
          )}>
            <tr>
              {selectable && (
                <th className={cn(headerPadding, 'w-10')}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="rounded border-slate-300"
                    aria-label="Seleccionar todos"
                  />
                </th>
              )}
              {displayColumns.map(renderHeaderCell)}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {data.map((row, rowIndex) => {
              const id = row[rowKey];
              const isActive = activeRowId != null && String(activeRowId) === String(id);
              const isSelected = selectable && selected.includes(id);

              return (
                <tr
                  key={id ?? rowIndex}
                  onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                  className={cn(
                    'transition-colors group',
                    onRowClick && 'cursor-pointer',
                    isActive
                      ? 'bg-emerald-50/40 ring-1 ring-inset ring-emerald-200'
                      : 'hover:bg-slate-50/60',
                    isSelected && !isActive && 'bg-blue-50/30',
                  )}
                >
                  {selectable && (
                    <td className={cn(cellPadding, 'w-10')} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect?.(id)}
                        className="rounded border-slate-300"
                        aria-label={`Seleccionar fila ${id}`}
                      />
                    </td>
                  )}
                  {displayColumns.map((col) => {
                    const value = row[col.key];
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          cellPadding,
                          alignClass(col.align),
                          col.className,
                          col.cellClassName,
                        )}
                        style={col.width && !col.resizable ? { minWidth: col.width } : undefined}
                      >
                        {col.render
                          ? col.render(value, row, rowIndex)
                          : (value ?? '—')
                        }
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {footer && (
        <div className="border-t border-slate-200 px-4 py-3 bg-slate-50/50">
          {footer}
        </div>
      )}
    </div>
  );
}
