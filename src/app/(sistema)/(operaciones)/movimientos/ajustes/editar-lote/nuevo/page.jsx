"use client";
import { PageHeader, Text, Heading } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, Search, Package, Calendar, MapPin } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import { crearEdicionLote } from '@/services/apis/movimientos';
import { getStockLotes } from '@/services/apis/inventario';

export default function NuevaEdicionLotePage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [stockLotes, setStockLotes] = useState([]);
    const [searchLote, setSearchLote] = useState('');
    const [selectedLote, setSelectedLote] = useState(null);
    const [formData, setFormData] = useState({
        nuevo_lote_codigo: '',
        nuevo_vencimiento: '',
        motivo: ''
    });

    const { execute: fetchStockLotes, loading: loadingLotes } = useApi(getStockLotes, { auto: false });
    const { execute: createAction, loading: isSubmitting } = useApi(crearEdicionLote, { auto: false });

    useEffect(() => {
        async function loadLotes() {
            try {
                const data = await fetchStockLotes({ limit: 10000 });
                if (data) setStockLotes(data.results || data);
            } catch (err) {
                // Error handled by useApi
            }
        }
        loadLotes();
    }, []);

    const filteredLotes = stockLotes.filter(lote => {
        if (!searchLote) return false;
        const term = searchLote.toLowerCase();
        return (
            lote.lote_codigo?.toLowerCase().includes(term) ||
            lote.variante_codigo?.toLowerCase().includes(term) ||
            lote.variante_nombre?.toLowerCase().includes(term) ||
            lote.deposito_nombre?.toLowerCase().includes(term)
        );
    }).slice(0, 20);

    const handleSelectLote = (lote) => {
        setSelectedLote(lote);
        setSearchLote('');
        // Pre-fill current values
        setFormData(prev => ({
            ...prev,
            nuevo_lote_codigo: '',
            nuevo_vencimiento: ''
        }));
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const hasChanges = () => {
        if (!selectedLote) return false;
        const codigoChanged = formData.nuevo_lote_codigo.trim() !== '' &&
            formData.nuevo_lote_codigo.trim() !== selectedLote.lote_codigo;
        const vencimientoChanged = formData.nuevo_vencimiento !== '' &&
            formData.nuevo_vencimiento !== (selectedLote.vencimiento || '');
        return codigoChanged || vencimientoChanged;
    };

    const canSubmit = selectedLote && formData.motivo.trim().length >= 3 && hasChanges();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!canSubmit) {
            showToast("Complete todos los campos requeridos.", "error");
            return;
        }

        const isConfirmed = await confirm(
            "¿Guardar este borrador de edición de lote?",
            "Guardar Borrador"
        );
        if (!isConfirmed) return;

        try {
            const payload = {
                lote: selectedLote.id,
                motivo: formData.motivo,
                ...(formData.nuevo_lote_codigo.trim() !== '' &&
                    formData.nuevo_lote_codigo.trim() !== selectedLote.lote_codigo
                    ? { nuevo_lote_codigo: formData.nuevo_lote_codigo.trim() }
                    : {}),
                ...(formData.nuevo_vencimiento !== '' &&
                    formData.nuevo_vencimiento !== (selectedLote.vencimiento || '')
                    ? { nuevo_vencimiento: formData.nuevo_vencimiento }
                    : { nuevo_vencimiento: null }),
            };

            const result = await createAction(payload);
            showToast("Borrador de edición creado con éxito", "success");
            router.push(`/movimientos/ajustes/editar-lote/${result.id}`);
        } catch (error) {
            showToast("Error al guardar el borrador", "error");
        }
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Ajustes de Inventario', href: '/movimientos/ajustes' },
                    { label: 'Editar Lote', href: '/movimientos/ajustes/editar-lote' },
                    { label: 'Nueva Edición' }
                ]}
                subtitle={
                    <>
                        <Edit3 size={12} />
                        Seleccioná un lote y corregí su nombre o fecha de vencimiento.
                    </>
                }
            >
                <button
                    disabled={isSubmitting || !canSubmit}
                    onClick={handleSubmit}
                    className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${!canSubmit ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100'}`}
                >
                    {isSubmitting ? 'GUARDANDO...' : 'GUARDAR BORRADOR'}
                </button>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* BUSCAR LOTE */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <Heading level={6} className="uppercase tracking-widest mb-4">
                            1. Seleccionar Lote
                        </Heading>

                        {!selectedLote ? (
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchLote}
                                        onChange={(e) => setSearchLote(e.target.value)}
                                        placeholder="Buscar por código de lote, producto o depósito..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 text-sm"
                                    />
                                </div>

                                {searchLote && (
                                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                                        {filteredLotes.length === 0 ? (
                                            <div className="p-4 text-center">
                                                <Text variant="bodySm" className="text-slate-400">
                                                    No se encontraron lotes con ese criterio.
                                                </Text>
                                            </div>
                                        ) : (
                                            filteredLotes.map(lote => (
                                                <button
                                                    key={lote.id}
                                                    type="button"
                                                    onClick={() => handleSelectLote(lote)}
                                                    className="w-full text-left p-3 hover:bg-blue-50 border-b border-slate-100 last:border-b-0 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <Text variant="bodySmBold" className="text-slate-800">
                                                                {lote.lote_codigo}
                                                            </Text>
                                                            <Text variant="bodyXs" className="text-slate-500">
                                                                {lote.variante_codigo} — {lote.variante_nombre}
                                                            </Text>
                                                        </div>
                                                        <div className="text-right">
                                                            <Text variant="bodyXs" className="text-slate-400">
                                                                {lote.deposito_nombre}
                                                            </Text>
                                                            <Text variant="bodyXs" className="text-slate-400">
                                                                Stock: {lote.cantidad} | Venc: {lote.vencimiento ? new Date(lote.vencimiento).toLocaleDateString() : '—'}
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                                            <Package size={24} />
                                        </div>
                                        <div>
                                            <Text variant="bodyXs" className="text-blue-500 font-black uppercase tracking-widest leading-none mb-1">
                                                {selectedLote.variante_codigo}
                                            </Text>
                                            <Text className="text-lg font-black text-slate-900 leading-none">
                                                {selectedLote.variante_nombre}
                                            </Text>
                                            <div className="flex items-center gap-4 mt-1.5">
                                                <Text variant="bodyXs" className="text-slate-500 flex items-center gap-1">
                                                    <Package size={12} /> Lote: <span className="font-bold text-slate-700">{selectedLote.lote_codigo}</span>
                                                </Text>
                                                <Text variant="bodyXs" className="text-slate-500 flex items-center gap-1">
                                                    <MapPin size={12} /> {selectedLote.deposito_nombre}
                                                </Text>
                                                <Text variant="bodyXs" className="text-slate-500 flex items-center gap-1">
                                                    <Calendar size={12} /> Venc: {selectedLote.vencimiento ? new Date(selectedLote.vencimiento).toLocaleDateString() : 'Sin vencimiento'}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedLote(null)}
                                        className="text-slate-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition-colors"
                                    >
                                        Cambiar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* NUEVOS VALORES */}
                    {selectedLote && (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Heading level={6} className="uppercase tracking-widest mb-4">
                                2. Nuevos Valores
                            </Heading>
                            <Text variant="bodySm" className="text-slate-500 mb-5">
                                Completá solo los campos que necesitás corregir. Los campos vacíos no se modificarán.
                            </Text>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Text variant="label" className="uppercase mb-1">
                                        Nuevo Código de Lote
                                    </Text>
                                    <input
                                        type="text"
                                        name="nuevo_lote_codigo"
                                        value={formData.nuevo_lote_codigo}
                                        onChange={handleFormChange}
                                        maxLength={100}
                                        placeholder={selectedLote.lote_codigo}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm"
                                    />
                                    <Text variant="bodyXs" className="text-slate-400 mt-1">
                                        Actual: <span className="font-bold">{selectedLote.lote_codigo}</span>
                                    </Text>
                                </div>
                                <div>
                                    <Text variant="label" className="uppercase mb-1">
                                        Nueva Fecha de Vencimiento
                                    </Text>
                                    <input
                                        type="date"
                                        name="nuevo_vencimiento"
                                        value={formData.nuevo_vencimiento}
                                        onChange={handleFormChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm"
                                    />
                                    <Text variant="bodyXs" className="text-slate-400 mt-1">
                                        Actual: <span className="font-bold">{selectedLote.vencimiento ? new Date(selectedLote.vencimiento).toLocaleDateString() : 'Sin vencimiento'}</span>
                                    </Text>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MOTIVO */}
                    {selectedLote && (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Heading level={6} className="uppercase tracking-widest mb-4">
                                3. Motivo de la Corrección
                            </Heading>
                            <textarea
                                name="motivo"
                                value={formData.motivo}
                                onChange={handleFormChange}
                                rows="3"
                                maxLength={500}
                                placeholder="Describí el motivo de la corrección (mín. 3 caracteres)..."
                                className={`w-full bg-slate-50 border rounded-xl p-3 text-sm ${formData.motivo.length > 0 && formData.motivo.length < 3 ? 'border-red-300' : 'border-slate-200'}`}
                            />
                            <Text variant="bodyXs" className="text-slate-400 mt-1">
                                {formData.motivo.length}/500
                            </Text>
                        </div>
                    )}

                    {/* RESUMEN */}
                    {selectedLote && hasChanges() && formData.motivo.trim().length >= 3 && (
                        <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-3xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Heading level={6} className="uppercase tracking-widest mb-3 text-emerald-700">
                                Resumen de Cambios
                            </Heading>
                            <div className="space-y-2">
                                {formData.nuevo_lote_codigo.trim() !== '' && formData.nuevo_lote_codigo.trim() !== selectedLote.lote_codigo && (
                                    <div className="flex items-center gap-2">
                                        <Text variant="bodySm" className="text-slate-600">
                                            Código: <span className="line-through text-slate-400">{selectedLote.lote_codigo}</span>
                                            {' → '}
                                            <span className="font-bold text-emerald-700">{formData.nuevo_lote_codigo.trim()}</span>
                                        </Text>
                                    </div>
                                )}
                                {formData.nuevo_vencimiento !== '' && formData.nuevo_vencimiento !== (selectedLote.vencimiento || '') && (
                                    <div className="flex items-center gap-2">
                                        <Text variant="bodySm" className="text-slate-600">
                                            Vencimiento: <span className="line-through text-slate-400">{selectedLote.vencimiento ? new Date(selectedLote.vencimiento).toLocaleDateString() : 'Sin vencimiento'}</span>
                                            {' → '}
                                            <span className="font-bold text-emerald-700">{new Date(formData.nuevo_vencimiento).toLocaleDateString()}</span>
                                        </Text>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
