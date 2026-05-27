"use client";
import { PageHeader, Text, Heading } from '@/components/ui';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, Package, Calendar, MapPin, Layers } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import { crearEdicionLote } from '@/services/apis/movimientos';
import { getStockLotes } from '@/services/apis/inventario';
import SelectedProductCard from "@/components/movimientos/SelectedProductCard";
import ProductSearchModal from "@/components/movimientos/ProductSearchModal";

export default function NuevaEdicionLotePage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedLote, setSelectedLote] = useState(null);
    const [formData, setFormData] = useState({
        nuevo_lote_codigo: '',
        nuevo_vencimiento: '',
        motivo: ''
    });

    const { execute: createAction, loading: isSubmitting } = useApi(crearEdicionLote, { auto: false });

    const handleSelectLote = (lote) => {
        setSelectedLote(lote);
        setIsSearchOpen(false);
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
                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(true)}
                                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group"
                            >
                                <Package size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                <Text variant="bodySm" className="text-slate-500 group-hover:text-blue-600 transition-colors">
                                    Buscar lote por código, producto o depósito...
                                </Text>
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <SelectedProductCard
                                    codigo={selectedLote.variante_codigo}
                                    titulo={selectedLote.variante_nombre}
                                    detalles={[
                                        { icon: Package, label: `Lote: ${selectedLote.lote_codigo}` },
                                        { icon: MapPin, label: selectedLote.deposito_nombre },
                                        { icon: Calendar, label: `Venc: ${selectedLote.vencimiento ? new Date(selectedLote.vencimiento).toLocaleDateString() : 'Sin vencimiento'}` },
                                    ]}
                                    onClear={() => setSelectedLote(null)}
                                    clearLabel="Cambiar"
                                />
                                {selectedLote.total_registros_lote > 1 && (
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                                        <Layers size={14} className="text-blue-500" />
                                        <Text variant="bodyXs" className="text-blue-700 font-medium">
                                            Este código de lote existe en {selectedLote.total_registros_lote} depositos. Los cambios se aplicarán a todos.
                                        </Text>
                                    </div>
                                )}
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

            {/* Modal de búsqueda de lotes */}
            <ProductSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelect={handleSelectLote}
                apiFunc={getStockLotes}
                mode="lote-unico"
                showEmptyStock
                placeholder="Buscar por código de lote o producto..."
                emptyMessage="No se encontraron lotes con ese criterio."
            />
        </div>
    );
}
