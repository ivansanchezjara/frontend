"use client";
import { PageHeader, ResizableHeader, Text, Heading, LoadingScreen } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Search, Plus, Trash2, Layers } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import { getDepositos, getAjusteRapido, actualizarAjusteRapido } from '@/services/apis/movimientos';
import { getStockLotes } from '@/services/apis/inventario';
import ProductSearchModal from '@/components/movimientos/ProductSearchModal';

export default function EditarAjusteRapidoPage() {
    const { id } = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [depositos, setDepositos] = useState([]);
    const [stockLotes, setStockLotes] = useState([]);
    const [items, setItems] = useState([]);
    const [formData, setFormData] = useState({ deposito: '', observaciones: '' });
    const [errorMsg, setErrorMsg] = useState(null);
    const [errorCount, setErrorCount] = useState(0);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [activeRowIdx, setActiveRowIdx] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);

    const { execute: fetchDepositos } = useApi(getDepositos);
    const { execute: fetchStockLotes } = useApi(getStockLotes);
    const { execute: fetchAjuste } = useApi(getAjusteRapido, { auto: false });
    const { execute: updateAction, loading: isSubmitting } = useApi(actualizarAjusteRapido, { auto: false });

    useEffect(() => {
        async function loadData() {
            try {
                const [dDep, dLotes, ajuste] = await Promise.all([
                    fetchDepositos(),
                    fetchStockLotes({ limit: 10000 }),
                    fetchAjuste(id)
                ]);
                if (dDep) setDepositos(dDep.results || dDep);
                if (dLotes) setStockLotes(dLotes.results || dLotes);

                if (ajuste) {
                    // Redirect if not BORRADOR
                    if (ajuste.estado !== 'BORRADOR') {
                        showToast("Solo se pueden editar ajustes en estado BORRADOR.", "error");
                        router.push(`/movimientos/ajustes/altas-bajas/${id}`);
                        return;
                    }

                    // Pre-populate form data
                    setFormData({
                        deposito: ajuste.deposito,
                        observaciones: ajuste.observaciones || ''
                    });

                    // Map existing lineas to items format
                    const mappedItems = (ajuste.lineas || []).map(linea => ({
                        tipo_operacion: linea.tipo_operacion,
                        variante: linea.variante,
                        variante_label: linea.variante_nombre || '',
                        variante_codigo: linea.variante_codigo || '',
                        lote: linea.lote,
                        lote_label: linea.lote_codigo || '',
                        cantidad: linea.cantidad,
                        motivo: linea.motivo,
                        nuevo_lote: !linea.lote && !!linea.nuevo_lote_codigo,
                        nuevo_lote_codigo: linea.nuevo_lote_codigo || '',
                        nuevo_vencimiento: linea.nuevo_vencimiento || '',
                        nuevo_costo: linea.nuevo_costo || ''
                    }));
                    setItems(mappedItems);
                }
            } catch (err) {
                showToast("Error cargando los datos del ajuste.", "error");
                router.push(`/movimientos/ajustes/altas-bajas/${id}`);
            } finally {
                setInitialLoading(false);
            }
        }
        loadData();
    }, [id]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'observaciones' && value.length > 500) return;
        setFormData({ ...formData, [name]: value });
    };

    // Get lotes filtered by variante + deposito
    const getLotesForRow = (varianteId) => {
        if (!formData.deposito || !varianteId) return [];
        return stockLotes.filter(
            sl => sl.variante === varianteId && sl.deposito === parseInt(formData.deposito)
        );
    };

    const handleAddRow = () => {
        if (!formData.deposito) {
            setErrorMsg("Debe seleccionar un depósito antes de agregar filas.");
            return;
        }
        if (items.length >= 200) {
            showToast("Máximo 200 líneas por ajuste.", "error");
            return;
        }
        const newItems = [...items, {
            tipo_operacion: 'ALTA',
            variante: null,
            variante_label: '',
            variante_codigo: '',
            lote: null,
            lote_label: '',
            cantidad: 1,
            motivo: '',
            nuevo_lote: false,
            nuevo_lote_codigo: '',
            nuevo_vencimiento: '',
            nuevo_costo: ''
        }];
        setItems(newItems);
        validateItems(newItems);
    };

    const handleRemoveRow = (idx) => {
        const newItems = items.filter((_, i) => i !== idx);
        setItems(newItems);
        validateItems(newItems);
    };

    const handleItemChange = (idx, field, value) => {
        const newItems = [...items];
        newItems[idx] = { ...newItems[idx], [field]: value };

        // Reset lote when variante changes
        if (field === 'variante') {
            newItems[idx].lote = null;
            newItems[idx].lote_label = '';
            newItems[idx].nuevo_lote = false;
            newItems[idx].nuevo_lote_codigo = '';
            newItems[idx].nuevo_vencimiento = '';
            newItems[idx].nuevo_costo = '';
        }

        // Reset lote when tipo changes
        if (field === 'tipo_operacion') {
            newItems[idx].lote = null;
            newItems[idx].lote_label = '';
            newItems[idx].nuevo_lote = false;
            newItems[idx].nuevo_lote_codigo = '';
            newItems[idx].nuevo_vencimiento = '';
            newItems[idx].nuevo_costo = '';
        }

        // Handle lote selection
        if (field === 'lote') {
            if (value === '__nuevo__') {
                newItems[idx].lote = null;
                newItems[idx].lote_label = 'Nuevo Lote';
                newItems[idx].nuevo_lote = true;
                newItems[idx].nuevo_lote_codigo = '';
                newItems[idx].nuevo_vencimiento = '';
                newItems[idx].nuevo_costo = '';
            } else {
                const loteId = value ? parseInt(value) : null;
                newItems[idx].lote = loteId;
                newItems[idx].nuevo_lote = false;
                newItems[idx].nuevo_lote_codigo = '';
                newItems[idx].nuevo_vencimiento = '';
                newItems[idx].nuevo_costo = '';
                if (loteId) {
                    const loteObj = stockLotes.find(sl => sl.id === loteId);
                    newItems[idx].lote_label = loteObj ? loteObj.lote_codigo : '';
                } else {
                    newItems[idx].lote_label = '';
                }
            }
        }

        setItems(newItems);
        validateItems(newItems);
    };

    const handleVarianteSelect = (item) => {
        if (activeRowIdx === null) return;
        const newItems = [...items];
        newItems[activeRowIdx] = {
            ...newItems[activeRowIdx],
            variante: item.variante || item.id,
            variante_label: item.variante_nombre || item.nombre_variante || '',
            variante_codigo: item.variante_codigo || item.product_code || '',
            lote: null,
            lote_label: '',
            nuevo_lote: false,
            nuevo_lote_codigo: '',
            nuevo_vencimiento: '',
            nuevo_costo: ''
        };
        setItems(newItems);
        validateItems(newItems);
        setIsSearchOpen(false);
    };

    const validateItems = (currentItems) => {
        let errors = 0;
        let globalError = null;

        if (currentItems.length === 0) {
            setErrorMsg(null);
            setErrorCount(0);
            return;
        }

        const seenKeys = new Set();

        for (let i = 0; i < currentItems.length; i++) {
            const row = currentItems[i];
            let hasError = false;

            if (!row.tipo_operacion) hasError = true;
            if (!row.variante) hasError = true;

            // Lote validation
            if (row.tipo_operacion === 'BAJA' && !row.lote) hasError = true;
            if (row.tipo_operacion === 'ALTA' && !row.lote && !row.nuevo_lote) hasError = true;

            // Nuevo lote fields
            if (row.nuevo_lote) {
                if (!row.nuevo_lote_codigo || row.nuevo_lote_codigo.trim() === '') hasError = true;
                if (!row.nuevo_costo || parseFloat(row.nuevo_costo) < 0.01) hasError = true;
            }

            // Cantidad
            const cant = parseInt(row.cantidad);
            if (!cant || cant < 1 || cant > 999999) hasError = true;

            // BAJA max stock
            if (row.tipo_operacion === 'BAJA' && row.lote) {
                const loteObj = stockLotes.find(sl => sl.id === row.lote);
                if (loteObj && cant > loteObj.cantidad) hasError = true;
            }

            // Motivo
            if (!row.motivo || row.motivo.trim().length < 3) hasError = true;

            // Duplicates (lote + tipo)
            if (row.lote) {
                const key = `${row.lote}-${row.tipo_operacion}`;
                if (seenKeys.has(key)) {
                    hasError = true;
                    if (!globalError) globalError = `Fila ${i + 1}: Lote duplicado con el mismo tipo de operación.`;
                }
                seenKeys.add(key);
            }

            if (hasError) errors++;
        }

        setErrorCount(errors);
        setErrorMsg(globalError);
    };

    const getRowError = (row, idx) => {
        if (!row.tipo_operacion) return "Seleccione tipo de operación";
        if (!row.variante) return "Seleccione un producto";
        if (row.tipo_operacion === 'BAJA' && !row.lote) return "Seleccione un lote";
        if (row.tipo_operacion === 'ALTA' && !row.lote && !row.nuevo_lote) return "Seleccione un lote o cree uno nuevo";
        if (row.nuevo_lote && (!row.nuevo_lote_codigo || row.nuevo_lote_codigo.trim() === '')) return "Código de lote nuevo requerido";
        if (row.nuevo_lote && (!row.nuevo_costo || parseFloat(row.nuevo_costo) < 0.01)) return "Costo >= 0.01 requerido para lote nuevo";

        const cant = parseInt(row.cantidad);
        if (!cant || cant < 1 || cant > 999999) return "Cantidad debe ser entre 1 y 999.999";

        if (row.tipo_operacion === 'BAJA' && row.lote) {
            const loteObj = stockLotes.find(sl => sl.id === row.lote);
            if (loteObj && cant > loteObj.cantidad) return `Cantidad excede stock disponible (${loteObj.cantidad})`;
        }

        if (!row.motivo || row.motivo.trim().length < 3) return "Motivo mínimo 3 caracteres";

        // Check duplicates
        const duplicateIdx = items.findIndex((other, j) =>
            j !== idx && other.lote && other.lote === row.lote && other.tipo_operacion === row.tipo_operacion
        );
        if (row.lote && duplicateIdx !== -1) return "Lote duplicado con el mismo tipo de operación";

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.deposito) {
            showToast("Debe seleccionar un depósito.", "error");
            return;
        }
        if (items.length === 0) {
            showToast("Debe agregar al menos una línea.", "error");
            return;
        }
        if (errorCount > 0) {
            showToast("Corrija los errores antes de guardar.", "error");
            return;
        }

        const isConfirmed = await confirm(
            "¿Estás seguro de guardar los cambios en este ajuste rápido?",
            "Guardar Cambios"
        );
        if (!isConfirmed) return;

        try {
            const lineas = items.map(item => ({
                tipo_operacion: item.tipo_operacion,
                variante: item.variante,
                lote: item.nuevo_lote ? null : item.lote,
                cantidad: parseInt(item.cantidad),
                motivo: item.motivo,
                nuevo_lote_codigo: item.nuevo_lote ? item.nuevo_lote_codigo : null,
                nuevo_vencimiento: item.nuevo_lote && item.nuevo_vencimiento ? item.nuevo_vencimiento : null,
                nuevo_costo: item.nuevo_lote && item.nuevo_costo ? parseFloat(item.nuevo_costo) : null
            }));

            const payload = {
                deposito: parseInt(formData.deposito),
                observaciones: formData.observaciones,
                lineas
            };

            await updateAction(id, payload);
            showToast("Ajuste rápido actualizado con éxito", "success");
            router.push(`/movimientos/ajustes/altas-bajas/${id}`);
        } catch (error) {
            showToast("Error al guardar los cambios", "error");
        }
    };

    const hasErrors = errorCount > 0 || items.length === 0 || !formData.deposito;

    // Loading state
    if (initialLoading) {
        return (
            <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
                <PageHeader
                    breadcrumbs={[
                        { label: 'Gestión de Movimientos', href: '/movimientos' },
                        { label: 'Ajustes de Inventario', href: '/movimientos/ajustes' },
                        { label: 'Altas y Bajas', href: '/movimientos/ajustes/altas-bajas' },
                        { label: `Ajuste #${id}`, href: `/movimientos/ajustes/altas-bajas/${id}` },
                        { label: 'Editar' }
                    ]}
                />
                <main className="flex-1 overflow-y-auto p-8">
                    <LoadingScreen message="Cargando datos del ajuste..." />
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Ajustes de Inventario', href: '/movimientos/ajustes' },
                    { label: 'Altas y Bajas', href: '/movimientos/ajustes/altas-bajas' },
                    { label: `Ajuste #${id}`, href: `/movimientos/ajustes/altas-bajas/${id}` },
                    { label: 'Editar' }
                ]}
                subtitle={
                    <>
                        <Layers size={12} />
                        Editá las líneas del ajuste rápido. Los cambios reemplazarán las líneas existentes.
                    </>
                }
            >
                <button
                    disabled={isSubmitting || hasErrors}
                    onClick={handleSubmit}
                    className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${hasErrors ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100'}`}
                >
                    {isSubmitting ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                </button>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">

                    {/* INFORMACIÓN GENERAL */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <Heading level={6} className="uppercase tracking-widest mb-4">Información General</Heading>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-700">
                            <div>
                                <Text variant="label" className="uppercase mb-1">Depósito</Text>
                                <select
                                    name="deposito"
                                    required
                                    value={formData.deposito}
                                    disabled
                                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm text-slate-500 cursor-not-allowed"
                                >
                                    <option value="">Seleccione...</option>
                                    {depositos.map(dep => (
                                        <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                                    ))}
                                </select>
                                <Text variant="bodyXs" className="text-slate-400 mt-1">
                                    El depósito no puede modificarse en edición.
                                </Text>
                            </div>
                            <div>
                                <Text variant="label" className="uppercase mb-1">Observaciones</Text>
                                <textarea
                                    name="observaciones"
                                    value={formData.observaciones}
                                    onChange={handleFormChange}
                                    rows="3"
                                    maxLength={500}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm"
                                    placeholder="Observaciones generales del ajuste (máx. 500 caracteres)"
                                ></textarea>
                                <Text variant="bodyXs" className="text-slate-400 mt-1">
                                    {formData.observaciones.length}/500
                                </Text>
                            </div>
                        </div>
                    </div>

                    {/* GRILLA MASIVA */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <Heading level={4}>Líneas de Ajuste ({items.length})</Heading>
                                {errorCount > 0 && (
                                    <span className="bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                                        {errorCount} {errorCount === 1 ? 'fila con error' : 'filas con errores'}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handleAddRow}
                                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
                            >
                                <Plus size={14} /> AGREGAR FILA
                            </button>
                        </div>

                        {errorMsg && (
                            <div className="px-4 py-2 bg-red-50 border-b border-red-100">
                                <Text variant="label" className="text-red-600">
                                    ⚠ {errorMsg}
                                </Text>
                            </div>
                        )}

                        <div className="overflow-auto max-h-[600px]">
                            <table className="w-full border-collapse text-[11px]">
                                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-100 uppercase text-slate-400 font-black">
                                    <tr>
                                        <ResizableHeader defaultWidth={100} minWidth={80} className="p-3 text-center">Tipo</ResizableHeader>
                                        <ResizableHeader defaultWidth={250} minWidth={180} className="p-3 text-left">Variante</ResizableHeader>
                                        <ResizableHeader defaultWidth={200} minWidth={140} className="p-3 text-left">Lote</ResizableHeader>
                                        <ResizableHeader defaultWidth={100} minWidth={70} className="p-3 text-center">Cantidad</ResizableHeader>
                                        <ResizableHeader defaultWidth={250} minWidth={150} className="p-3 text-left">Motivo</ResizableHeader>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, idx) => {
                                        const rowError = getRowError(item, idx);
                                        const availableLotes = getLotesForRow(item.variante);
                                        const maxStock = item.lote && item.tipo_operacion === 'BAJA'
                                            ? (stockLotes.find(sl => sl.id === item.lote)?.cantidad || 999999)
                                            : 999999;

                                        return (
                                            <tr key={idx} className={`hover:bg-slate-50 transition-all ${rowError ? 'bg-red-50/50' : ''}`}>
                                                {/* Tipo */}
                                                <td className="p-2">
                                                    <select
                                                        value={item.tipo_operacion}
                                                        onChange={(e) => handleItemChange(idx, 'tipo_operacion', e.target.value)}
                                                        className={`w-full border rounded-lg p-2 text-[11px] font-bold text-center ${item.tipo_operacion === 'ALTA' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}
                                                    >
                                                        <option value="ALTA">ALTA</option>
                                                        <option value="BAJA">BAJA</option>
                                                    </select>
                                                </td>

                                                {/* Variante */}
                                                <td className="p-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!formData.deposito) {
                                                                showToast("Seleccione un depósito primero.", "error");
                                                                return;
                                                            }
                                                            setActiveRowIdx(idx);
                                                            setIsSearchOpen(true);
                                                        }}
                                                        className={`w-full text-left border rounded-lg p-2 text-[11px] flex items-center gap-2 transition-all ${item.variante ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50 text-slate-400'}`}
                                                    >
                                                        <Search size={12} className="text-slate-400 shrink-0" />
                                                        {item.variante ? (
                                                            <div className="truncate">
                                                                <span className="font-black text-blue-600">{item.variante_codigo}</span>
                                                                {' '}
                                                                <span className="text-slate-600">{item.variante_label}</span>
                                                            </div>
                                                        ) : (
                                                            <span>Buscar variante...</span>
                                                        )}
                                                    </button>
                                                </td>

                                                {/* Lote */}
                                                <td className="p-2">
                                                    <div className="space-y-1">
                                                        <select
                                                            value={item.nuevo_lote ? '__nuevo__' : (item.lote || '')}
                                                            onChange={(e) => handleItemChange(idx, 'lote', e.target.value)}
                                                            disabled={!item.variante}
                                                            className="w-full border border-slate-200 rounded-lg p-2 text-[11px] bg-white disabled:bg-slate-100 disabled:text-slate-400"
                                                        >
                                                            <option value="">Seleccione lote...</option>
                                                            {item.tipo_operacion === 'ALTA' && (
                                                                <option value="__nuevo__">➕ Nuevo Lote</option>
                                                            )}
                                                            {availableLotes.map(sl => (
                                                                <option key={sl.id} value={sl.id}>
                                                                    {sl.lote_codigo} (Stock: {sl.cantidad})
                                                                </option>
                                                            ))}
                                                        </select>

                                                        {/* Campos de nuevo lote */}
                                                        {item.nuevo_lote && (
                                                            <div className="flex gap-1">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Código"
                                                                    maxLength={100}
                                                                    value={item.nuevo_lote_codigo}
                                                                    onChange={(e) => handleItemChange(idx, 'nuevo_lote_codigo', e.target.value)}
                                                                    className="flex-1 border border-emerald-200 rounded-lg p-1.5 text-[10px] bg-emerald-50"
                                                                />
                                                                <input
                                                                    type="date"
                                                                    value={item.nuevo_vencimiento}
                                                                    onChange={(e) => handleItemChange(idx, 'nuevo_vencimiento', e.target.value)}
                                                                    className="w-[110px] border border-emerald-200 rounded-lg p-1.5 text-[10px] bg-emerald-50"
                                                                />
                                                                <input
                                                                    type="number"
                                                                    placeholder="Costo"
                                                                    min="0.01"
                                                                    step="0.01"
                                                                    value={item.nuevo_costo}
                                                                    onChange={(e) => handleItemChange(idx, 'nuevo_costo', e.target.value)}
                                                                    className="w-[80px] border border-emerald-200 rounded-lg p-1.5 text-[10px] bg-emerald-50"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Cantidad */}
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={maxStock}
                                                        value={item.cantidad}
                                                        onChange={(e) => handleItemChange(idx, 'cantidad', e.target.value)}
                                                        className="w-full border border-slate-200 rounded-lg p-2 text-center font-bold text-[11px]"
                                                    />
                                                    {item.tipo_operacion === 'BAJA' && item.lote && (
                                                        <Text variant="bodyXs" className="text-slate-400 text-center mt-0.5">
                                                            Máx: {maxStock}
                                                        </Text>
                                                    )}
                                                </td>

                                                {/* Motivo */}
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Motivo del ajuste (mín. 3 chars)"
                                                        maxLength={255}
                                                        value={item.motivo}
                                                        onChange={(e) => handleItemChange(idx, 'motivo', e.target.value)}
                                                        className={`w-full border rounded-lg p-2 text-[11px] ${item.motivo && item.motivo.trim().length < 3 ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                                    />
                                                </td>

                                                {/* Acciones */}
                                                <td className="p-2 text-center">
                                                    <button
                                                        onClick={() => handleRemoveRow(idx)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-16 text-center">
                                                <Layers size={32} className="mx-auto text-slate-200 mb-3" />
                                                <Text variant="bodySm" className="text-slate-400">
                                                    No hay líneas de ajuste. Haga clic en "Agregar Fila" para comenzar.
                                                </Text>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {items.length > 0 && (
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <Text variant="bodySm" className="text-slate-500">
                                        <span className="font-black">{items.filter(i => i.tipo_operacion === 'ALTA').length}</span> altas
                                        {' · '}
                                        <span className="font-black">{items.filter(i => i.tipo_operacion === 'BAJA').length}</span> bajas
                                    </Text>
                                </div>
                                <Text variant="bodyXs" className="text-slate-400">
                                    {items.length}/200 líneas
                                </Text>
                            </div>
                        )}
                    </div>
                </div>

                {/* ProductSearchModal */}
                <ProductSearchModal
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    onSelect={handleVarianteSelect}
                    lotes={stockLotes}
                    mode="variante"
                    placeholder="Buscar variante por código o nombre..."
                    emptyMessage="No se encontraron variantes."
                    showEmptyStock={true}
                />
            </main>
        </div>
    );
}
