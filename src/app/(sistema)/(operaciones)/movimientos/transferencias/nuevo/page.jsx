"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Search, Package, Check, MapPin, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import ProductSearchModal from '@/components/movimientos/ProductSearchModal';
import { getApiUrl } from '@/services/api';

export default function NuevaTransferenciaPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stockLotes, setStockLotes] = useState([]);
    const [depositos, setDepositos] = useState([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const [transf, setTransf] = useState({
        deposito_origen: '',
        deposito_destino: '',
        observaciones: ''
    });

    const [items, setItems] = useState([]);
    const [lastAddedId, setLastAddedId] = useState(null);

    useEffect(() => {
        const token = Cookies.get('token');
        const API_BASE = getApiUrl();

        async function loadData() {
            try {
                // Traemos stock
                const resStock = await fetch(`${API_BASE}/api/inventario/stock-lotes/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dataStock = await resStock.json();
                setStockLotes(Array.isArray(dataStock) ? dataStock : (dataStock.results || []));

                // Traemos depósitos
                const resDep = await fetch(`${API_BASE}/api/inventario/depositos/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dDep = await resDep.json();
                setDepositos(Array.isArray(dDep) ? dDep : (dDep.results || []));
            } catch (err) {
                console.error("Error cargando datos:", err);
            }
        }
        loadData();
    }, []);

    const handleHeaderChange = (e) => {
        const { name, value } = e.target;
        setTransf(prev => ({ ...prev, [name]: value }));

        // Si cambia el deposito origen, limpiamos los items porque ya no pertenecen
        if (name === 'deposito_origen') {
            setItems([]);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const addItem = (lote) => {
        // Verificar si ya está
        if (items.some(i => i.lote_origen === lote.id)) {
            alert("Este lote ya ha sido agregado.");
            return;
        }

        const newItem = {
            lote_origen: lote.id,
            lote_codigo: lote.lote_codigo,
            variante_nombre: lote.variante_nombre,
            nombre_variante: lote.nombre_variante,
            stock_disponible: lote.cantidad,
            cantidad: 1
        };
        setItems([...items, newItem]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!transf.deposito_origen || !transf.deposito_destino || items.length === 0 || isSubmitting) return;

        if (transf.deposito_origen === transf.deposito_destino) {
            alert("El depósito de destino no puede ser el mismo que el de origen.");
            return;
        }

        // Validar cantidades
        for (const item of items) {
            if (!item.cantidad || item.cantidad <= 0) {
                alert(`La cantidad para ${item.lote_codigo} debe ser mayor a 0.`);
                return;
            }
            if (item.cantidad > item.stock_disponible) {
                alert(`Stock insuficiente para ${item.lote_codigo}. Máximo: ${item.stock_disponible}`);
                return;
            }
        }

        setIsSubmitting(true);
        const token = Cookies.get('token');
        const API_BASE = getApiUrl();

        try {
            const response = await fetch(`${API_BASE}/api/inventario/transferencias/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...transf,
                    items: items.map(i => ({ lote_origen: i.lote_origen, cantidad: Number(i.cantidad) }))
                })
            });

            if (response.ok) {
                router.push('/movimientos/transferencias');
            } else {
                const errData = await response.json();
                alert("Error al guardar: " + JSON.stringify(errData));
            }
        } catch (error) {
            alert("Error de conexión.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Transferencias Internas', href: '/movimientos/transferencias' },
                    { label: 'Nueva Transferencia' }
                ]}
                subtitle="Mové stock entre depósitos de forma controlada y auditada."
            >
                <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ítems a mover</p>
                    <p className="text-2xl font-black text-slate-900">{items.length}</p>
                </div>
                <button
                    disabled={isSubmitting || !transf.deposito_origen || !transf.deposito_destino || items.length === 0}
                    onClick={handleSubmit}
                    className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg ${(!transf.deposito_origen || !transf.deposito_destino || items.length === 0) ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'}`}
                >
                    {isSubmitting ? 'GUARDANDO...' : 'GUARDAR TRANSFERENCIA'}
                </button>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">

                    {/* Cabecera: Depósitos */}
                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <MapPin size={14} className="text-slate-400" /> Definición de Depósitos
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-slate-700">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Depósito de Origen</label>
                                <select
                                    name="deposito_origen"
                                    value={transf.deposito_origen}
                                    onChange={handleHeaderChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[20px] p-4 font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
                                >
                                    <option value="">Seleccionar origen...</option>
                                    {depositos.map(dep => (
                                        <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Depósito de Destino</label>
                                <select
                                    name="deposito_destino"
                                    value={transf.deposito_destino}
                                    onChange={handleHeaderChange}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[20px] p-4 font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
                                >
                                    <option value="">Seleccionar destino...</option>
                                    {depositos.filter(d => d.id !== parseInt(transf.deposito_origen)).map(dep => (
                                        <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Notas del movimiento</label>
                                <textarea
                                    name="observaciones"
                                    value={transf.observaciones}
                                    onChange={handleHeaderChange}
                                    rows="1"
                                    placeholder="Ej: Reposición de stock mensual..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[24px] p-5 font-medium text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Items */}
                    <div className={`bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px] transition-all ${!transf.deposito_origen || !transf.deposito_destino ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><Check size={18} /></div>
                                <h2 className="text-slate-800 font-black">Productos a Transferir ({items.length})</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(true)}
                                className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
                            >
                                <Search size={16} /> BUSCAR PRODUCTOS
                            </button>
                        </div>

                        <div className="overflow-auto flex-1">
                            <table className="w-full border-collapse text-[11px]">
                                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-100 uppercase text-slate-400 font-black">
                                    <tr>
                                        <th className="p-4 text-left">Producto / Lote</th>
                                        <th className="p-4 text-center w-32">Stock Origen</th>
                                        <th className="p-4 text-center w-32">Cant. a Mover</th>
                                        <th className="p-4 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                                Usa el botón "Buscar Productos" para agregar ítems de {depositos.find(d => d.id === parseInt(transf.deposito_origen))?.nombre || "origen"}
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-all group">
                                                <td className="p-4">
                                                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{item.lote_codigo}</div>
                                                    <div className="font-black text-slate-800 text-sm">
                                                        {item.variante_nombre} <span className="text-slate-400 font-bold text-xs">| {item.nombre_variante}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="inline-block px-3 py-1 bg-slate-100 rounded-full font-black text-slate-600">{item.stock_disponible} unid.</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={item.stock_disponible}
                                                            value={item.cantidad}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                // Permitir string vacío temporalmente, de lo contrario parsear a número
                                                                handleItemChange(idx, 'cantidad', val === '' ? '' : parseInt(val, 10));
                                                            }}
                                                            className={`w-24 text-center px-3 py-2 border rounded-xl font-black text-sm outline-none focus:ring-2 ${item.cantidad > item.stock_disponible || !item.cantidad ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-200 bg-white text-slate-900 focus:ring-blue-500/20'}`}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => removeItem(idx)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modal de búsqueda */}
                <ProductSearchModal
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    onSelect={addItem}
                    lotes={(stockLotes || []).filter(l => l.deposito === parseInt(transf.deposito_origen))}
                    placeholder={`Buscar stock en ${(depositos || []).find(d => d.id === parseInt(transf.deposito_origen))?.nombre || "depósito"}...`}
                    emptyMessage="No se encontró stock disponible en este depósito."
                />
            </main>
        </div>
    );
}