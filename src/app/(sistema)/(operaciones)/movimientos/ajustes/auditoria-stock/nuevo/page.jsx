"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Tag, Package, X, Lock } from 'lucide-react';
import { PageHeader, Text, Heading, Button } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/components/ui/feedback/ToastContext';
import { useConfirm } from '@/components/ui/feedback/ConfirmContext';
import { crearAuditoriaStock, getDepositos, getMarcasDisponibles } from '@/services/apis/movimientos';
import { getProductos } from '@/services/apis/catalogo';

export default function NuevaAuditoriaStockPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [formData, setFormData] = useState({
        titulo: '', modo_seleccion: 'MARCA', marca_filtro: '', deposito: '', observaciones: '',
    });
    const [productosSeleccionados, setProductosSeleccionados] = useState([]);
    const [depositos, setDepositos] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [productosDisponibles, setProductosDisponibles] = useState([]);
    const [searchProducto, setSearchProducto] = useState('');
    const [showProductSearch, setShowProductSearch] = useState(false);

    const { execute: fetchDepositos } = useApi(getDepositos, { auto: false });
    const { execute: fetchMarcas } = useApi(getMarcasDisponibles, { auto: false });
    const { execute: fetchProductos } = useApi(getProductos, { auto: false });
    const { execute: crear, loading: isSubmitting } = useApi(crearAuditoriaStock, { auto: false });

    useEffect(() => {
        async function loadData() {
            const [dDep, dMarcas] = await Promise.all([fetchDepositos(), fetchMarcas()]);
            if (dDep) setDepositos(dDep.results || dDep || []);
            if (dMarcas) setMarcas(Array.isArray(dMarcas) ? dMarcas : []);
        }
        loadData();
    }, []);

    useEffect(() => {
        if (formData.modo_seleccion === 'PRODUCTOS' && searchProducto.length >= 2) {
            const timer = setTimeout(async () => {
                const result = await fetchProductos({ search: searchProducto, page_size: 20 });
                if (result) setProductosDisponibles(result.results || result || []);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [searchProducto, formData.modo_seleccion]);

    const handleChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    const handleAddProducto = (producto) => {
        if (!productosSeleccionados.find(p => p.id === producto.id)) setProductosSeleccionados(prev => [...prev, producto]);
        setSearchProducto(''); setShowProductSearch(false);
    };
    const handleRemoveProducto = (id) => { setProductosSeleccionados(prev => prev.filter(p => p.id !== id)); };

    const isValid = () => {
        if (!formData.titulo.trim()) return false;
        if (formData.modo_seleccion === 'MARCA' && !formData.marca_filtro) return false;
        if (formData.modo_seleccion === 'PRODUCTOS' && productosSeleccionados.length === 0) return false;
        return true;
    };

    const handleSubmit = async () => {
        if (!isValid()) { showToast("Complete todos los campos obligatorios.", "error"); return; }
        const confirmed = await confirm("¿Crear esta auditoría de stock? Se generarán las líneas automáticamente.", "Crear Auditoría");
        if (!confirmed) return;
        try {
            const payload = {
                titulo: formData.titulo.trim(), modo_seleccion: formData.modo_seleccion,
                marca_filtro: formData.modo_seleccion === 'MARCA' ? formData.marca_filtro : '',
                deposito: formData.deposito ? parseInt(formData.deposito) : null,
                observaciones: formData.observaciones,
            };
            if (formData.modo_seleccion === 'PRODUCTOS') payload.productos = productosSeleccionados.map(p => p.id);
            const result = await crear(payload);
            showToast("Auditoría de stock creada con éxito.", "success");
            router.push(`/movimientos/ajustes/auditoria-stock/${result.id}`);
        } catch (error) { showToast("Error al crear la auditoría.", "error"); }
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: "Gestión de Movimientos", href: "/movimientos" },
                    { label: "Ajustes de Inventario", href: "/movimientos/ajustes" },
                    { label: "Auditoría de Stock", href: "/movimientos/ajustes/auditoria-stock" },
                    { label: "Nueva Auditoría" },
                ]}
                subtitle={<><ClipboardList size={12} />Configurá la auditoría masiva de stock</>}
            >
                <button disabled={isSubmitting || !isValid()} onClick={handleSubmit}
                    className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${!isValid() ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100'}`}>
                    {isSubmitting ? 'CREANDO...' : 'CREAR AUDITORÍA'}
                </button>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[900px] mx-auto space-y-6">
                    {/* Información General */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <Heading level={6} className="uppercase tracking-widest mb-4">Información General</Heading>
                        <div className="space-y-4">
                            <div>
                                <Text variant="label" className="uppercase mb-1">Título de la Auditoría *</Text>
                                <input type="text" name="titulo" value={formData.titulo} onChange={handleChange}
                                    placeholder="Ej: Auditoría Thalys - Mayo 2026" maxLength={200}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <Text variant="label" className="uppercase mb-1">Depósito (opcional)</Text>
                                <select name="deposito" value={formData.deposito} onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium">
                                    <option value="">Todos los depósitos</option>
                                    {depositos.map(dep => <option key={dep.id} value={dep.id}>{dep.nombre}</option>)}
                                </select>
                                <Text variant="bodyXs" className="text-slate-400 mt-1">Dejá vacío para auditar todos los depósitos.</Text>
                            </div>
                            <div>
                                <Text variant="label" className="uppercase mb-1">Observaciones</Text>
                                <textarea name="observaciones" value={formData.observaciones} onChange={handleChange}
                                    rows={3} maxLength={1000} placeholder="Notas adicionales sobre esta auditoría..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium resize-none" />
                            </div>
                        </div>
                    </div>

                    {/* Modo de selección */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <Heading level={6} className="uppercase tracking-widest mb-4">Selección de Productos</Heading>
                        <div className="flex gap-2 mb-6">
                            <button onClick={() => setFormData(prev => ({ ...prev, modo_seleccion: 'MARCA' }))}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.modo_seleccion === 'MARCA' ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                <Tag size={14} /> Por Marca
                            </button>
                            <button onClick={() => setFormData(prev => ({ ...prev, modo_seleccion: 'PRODUCTOS' }))}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.modo_seleccion === 'PRODUCTOS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                <Package size={14} /> Por Productos
                            </button>
                        </div>

                        {formData.modo_seleccion === 'MARCA' ? (
                            <div>
                                <Text variant="label" className="uppercase mb-1">Marca *</Text>
                                <select name="marca_filtro" value={formData.marca_filtro} onChange={handleChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium">
                                    <option value="">Seleccione una marca...</option>
                                    {marcas.map(marca => <option key={marca} value={marca}>{marca}</option>)}
                                </select>
                                <Text variant="bodyXs" className="text-slate-400 mt-2">Se incluirán todos los productos activos de esta marca y sus lotes de stock.</Text>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Text variant="label" className="uppercase mb-1">Buscar Productos *</Text>
                                    <input type="text" value={searchProducto}
                                        onChange={(e) => { setSearchProducto(e.target.value); setShowProductSearch(true); }}
                                        onFocus={() => setShowProductSearch(true)}
                                        placeholder="Escribí para buscar por nombre o código..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                                    {showProductSearch && productosDisponibles.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                            {productosDisponibles.filter(p => !productosSeleccionados.find(s => s.id === p.id)).map(producto => (
                                                <button key={producto.id} onClick={() => handleAddProducto(producto)}
                                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0">
                                                    <Text className="font-bold text-slate-900 text-sm">{producto.nombre_general}</Text>
                                                    <Text variant="bodyXs" className="text-slate-400">{producto.general_code} • {producto.brand}</Text>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {productosSeleccionados.length > 0 && (
                                    <div className="space-y-2">
                                        <Text variant="label" className="text-slate-400 uppercase">{productosSeleccionados.length} producto(s) seleccionado(s)</Text>
                                        <div className="flex flex-wrap gap-2">
                                            {productosSeleccionados.map(p => (
                                                <div key={p.id} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                                                    <Text variant="bodySm" className="font-bold text-blue-800">{p.nombre_general}</Text>
                                                    <button onClick={() => handleRemoveProducto(p.id)} className="text-blue-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Info de bloqueo */}
                    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
                        <div className="flex items-start gap-3">
                            <Lock size={20} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <Heading level={6} className="text-amber-800 mb-1">Bloqueo de Ventas</Heading>
                                <Text variant="bodySm" className="text-amber-700 leading-relaxed">
                                    Al iniciar el conteo, los productos seleccionados quedarán bloqueados para venta
                                    hasta que se apruebe o rechace la auditoría. Esto garantiza la integridad del recuento.
                                    {formData.deposito ? ' El bloqueo aplica solo al depósito seleccionado.' : ' El bloqueo aplica a todos los depósitos.'}
                                </Text>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
