"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { Search, Plus, Trash2, Package, Calendar, DollarSign, Calculator, AlertCircle, Save, Check, Download, Upload, Tag, Clock } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function EditarIngresoPage() {
    const router = useRouter();
    const { id } = useParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [depositos, setDepositos] = useState([]);
    const [variantes, setVariantes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [lastAddedId, setLastAddedId] = useState(null);
    
    const [ingreso, setIngreso] = useState({
        fecha_arribo: '',
        descripcion: '',
        comprobante: '',
        deposito: '',
        estado: ''
    });

    const [items, setItems] = useState([]);

    const getApiUrl = () => {
        if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
        if (typeof window !== 'undefined') {
            return `${window.location.protocol}//${window.location.hostname}:8000`;
        }
        return 'http://127.0.0.1:8000';
    };

    useEffect(() => {
        const token = Cookies.get('token');
        const API_BASE = getApiUrl();
        async function loadAll() {
            try {
                const resDep = await fetch(`${API_BASE}/api/inventario/depositos/`, { headers: { 'Authorization': `Bearer ${token}` } });
                const dDep = await resDep.json();
                setDepositos(dDep.results || dDep);
                const resVar = await fetch(`${API_BASE}/api/catalogo/variantes/`, { headers: { 'Authorization': `Bearer ${token}` } });
                const dVar = await resVar.json();
                setVariantes(dVar.results || dVar);

                const resIng = await fetch(`${API_BASE}/api/inventario/ingresos/${id}/`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (resIng.ok) {
                    const dIng = await resIng.json();
                    if (dIng.estado === 'APROBADO') { router.push('/movimientos/ingresos'); return; }
                    setIngreso({ fecha_arribo: dIng.fecha_arribo, descripcion: dIng.descripcion, comprobante: dIng.comprobante || '', deposito: dIng.deposito, estado: dIng.estado });
                    setItems((dIng.items || []).map(it => ({
                        variante: it.variante,
                        variante_label: `${it.variante_codigo} - ${it.variante_nombre}`,
                        cantidad: it.cantidad,
                        costo_fob_unitario: it.costo_fob_unitario,
                        costo_landed_unitario: it.costo_landed_unitario,
                        lote_codigo: it.lote_codigo || '',
                        vencimiento: it.vencimiento || '',
                        nuevo_precio_0_publico: it.nuevo_precio_0_publico,
                        nuevo_precio_1_estudiante: it.nuevo_precio_1_estudiante,
                        nuevo_precio_2_reventa: it.nuevo_precio_2_reventa,
                        nuevo_precio_3_mayorista: it.nuevo_precio_3_mayorista,
                        nuevo_precio_4_intercompany: it.nuevo_precio_4_intercompany
                    })));
                }
            } catch (err) { setErrorMsg("Error de conexión."); } finally { setIsLoading(false); }
        }
        loadAll();
    }, [id]);

    const handleIngresoChange = (e) => setIngreso({ ...ingreso, [e.target.name]: e.target.value });
    
    const generateAutoLote = () => {
        const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `${date}-AUTO-${random}`;
    };

    const getVariantDisplayName = (v) => {
        const parentName = (v.producto_padre_nombre || '').trim();
        const variantName = (v.nombre_variante || '').trim();

        if (!parentName) return variantName;
        if (!variantName || parentName.toLowerCase() === variantName.toLowerCase()) return parentName;
        return `${parentName} · ${variantName}`;
    };

    const normalizeText = (text) => (text || '').toString().trim().toLowerCase();

    const parseSpreadsheetDate = (value) => {
        if (value == null) return '';
        const raw = value.toString().trim();
        if (!raw) return '';

        if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
            const [day, month, year] = raw.split('/');
            return `${year}-${month}-${day}`;
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            return raw;
        }

        return '';
    };

    const formatDateForSpreadsheet = (value) => {
        if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
        const [year, month, day] = value.split('-');
        return `${day}/${month}/${year}`;
    };

    const resolveVariantFromCell = (cellValue) => {
        const raw = (cellValue || '').toString().trim();
        if (!raw) return null;

        const possibleCode = raw.split(' - ')[0].trim();
        const normalizedRaw = normalizeText(raw);
        const normalizedCode = normalizeText(possibleCode);

        return variantes.find(v =>
            normalizeText(v.product_code) === normalizedCode ||
            normalizeText(v.product_code) === normalizedRaw ||
            normalizeText(getVariantDisplayName(v)) === normalizedRaw ||
            normalizeText(v.nombre_variante) === normalizedRaw ||
            normalizeText(v.producto_padre_nombre) === normalizedRaw
        ) || null;
    };

    const addProductToItems = (v) => {
        const newItem = {
            variante: v.id,
            variante_label: `${v.product_code} - ${getVariantDisplayName(v)}`,
            cantidad: 0,
            costo_fob_unitario: v.costo_fob || 0,
            costo_landed_unitario: v.costo_landed || 0,
            lote_codigo: generateAutoLote(),
            vencimiento: '',
            nuevo_precio_0_publico: v.precio_0_publico || 0,
            nuevo_precio_1_estudiante: v.precio_1_estudiante || 0,
            nuevo_precio_2_reventa: v.precio_2_reventa || 0,
            nuevo_precio_3_mayorista: v.precio_3_mayorista || 0,
            nuevo_precio_4_intercompany: v.precio_4_intercompany || 0
        };
        const newItems = [...items, newItem].sort((a,b) => a.variante_label.localeCompare(b.variante_label));
        setItems(newItems);
        validateItems(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
        validateItems(newItems);
    };

    const validateItems = (currentItems) => {
        let error = null;
        for (let i = 0; i < currentItems.length; i++) {
            const it = currentItems[i];
            const fob = parseFloat(it.costo_fob_unitario || 0);
            const landed = parseFloat(it.costo_landed_unitario || 0);
            const p0 = parseFloat(it.nuevo_precio_0_publico || 0);
            const p1 = parseFloat(it.nuevo_precio_1_estudiante || 0);
            const p2 = parseFloat(it.nuevo_precio_2_reventa || 0);
            const p3 = parseFloat(it.nuevo_precio_3_mayorista || 0);
            const p4 = parseFloat(it.nuevo_precio_4_intercompany || 0);

            if (parseFloat(it.cantidad) <= 0) error = `Item ${i+1}: Cantidad debe ser mayor a 0.`;
            else if (!it.lote_codigo || it.lote_codigo.trim() === "") error = `Item ${i+1}: El código de lote es obligatorio (use S/L si no tiene).`;
            else if (fob < 0 || landed < 0 || p0 < 0 || p1 < 0 || p2 < 0 || p3 < 0 || p4 < 0) error = `Item ${i+1}: No se permiten valores negativos.`;
            else if (fob > landed) error = `Item ${i+1}: Costo FOB no puede superar al Landed.`;
            else if (!(p0 >= p1 && p1 >= p2 && p2 >= p3 && p3 >= p4)) error = `Item ${i+1}: Jerarquía P0≥P1≥P2≥P3≥P4.`;
            if (error) break;
        }
        setErrorMsg(error);
    };

    const handleDownloadTemplate = () => {
        const headers = ["Codigo", "Cantidad", "Lote", "Vencimiento", "FOB", "Landed", "P0", "P1", "P2", "P3", "P4"];
        const rows = items.map(it => {
            const code = it.variante_label.split(' - ')[0];
            return [
                code, it.cantidad, it.lote_codigo, formatDateForSpreadsheet(it.vencimiento),
                it.costo_fob_unitario, it.costo_landed_unitario,
                it.nuevo_precio_0_publico, it.nuevo_precio_1_estudiante,
                it.nuevo_precio_2_reventa, it.nuevo_precio_3_mayorista,
                it.nuevo_precio_4_intercompany
            ].join(";");
        });
        const csvContent = [headers.join(";"), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `plantilla_ingreso_${id}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (errorMsg || items.length === 0) return;
        if (!ingreso.deposito) { alert("Debe seleccionar un depósito."); return; }
        setIsSubmitting(true);
        const token = Cookies.get('token');
        const API_BASE = getApiUrl();
        try {
            const res = await fetch(`${API_BASE}/api/inventario/ingresos/${id}/`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...ingreso, items: items.map(it => ({...it, vencimiento: it.vencimiento===''?null:it.vencimiento})) })
            });
            if (res.ok) router.push('/movimientos/ingresos');
            else {
                const errData = await res.json();
                console.error("Error backend:", errData);
                alert("Error al actualizar: " + JSON.stringify(errData));
            }
        } catch (error) { alert("Error de conexión."); } finally { setIsSubmitting(false); }
    };

    if (isLoading) return <div className="p-20 text-center font-black animate-pulse uppercase text-slate-300 tracking-widest text-xl">Cargando borrador...</div>;

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: 'Gestión de Movimientos', href: '/movimientos' },
                    { label: 'Ingresos de Mercadería', href: '/movimientos/ingresos' },
                    { label: `Editar Borrador #${id}` }
                ]}
                subtitle="Modificá los datos del arribo o los ítems antes de la aprobación definitiva."
            >
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Inversión (Landed)</p>
                    <p className={`text-xl font-black leading-none ${errorMsg ? 'text-red-500' : 'text-slate-900'}`}>${items.reduce((s,i)=>s+(i.cantidad*(i.costo_landed_unitario||0)),0).toLocaleString()}</p>
                </div>
                <button disabled={isSubmitting || !!errorMsg} onClick={handleSubmit} className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${errorMsg ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100'}`}>
                    {isSubmitting ? 'GUARDANDO...' : 'ACTUALIZAR BORRADOR'}
                </button>
            </PageHeader>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1800px] mx-auto space-y-6">

            <div className="space-y-6">
                {/* SECCION GENERAL - AHORA ARRIBA Y ANCHO COMPLETO */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Información General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-slate-700">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Depósito</label>
                            <select name="deposito" required value={ingreso.deposito} onChange={handleIngresoChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm">
                                {depositos.map(dep => <option key={dep.id} value={dep.id}>{dep.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha de Arribo</label>
                            <input type="date" name="fecha_arribo" value={ingreso.fecha_arribo} onChange={handleIngresoChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Comprobante</label>
                            <input type="text" name="comprobante" value={ingreso.comprobante} onChange={handleIngresoChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" placeholder="N° Factura / Remito" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Observaciones</label>
                            <textarea name="descripcion" value={ingreso.descripcion} onChange={handleIngresoChange} rows="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm" placeholder="Ej: Arribo de mercadería de Aduana..."></textarea>
                        </div>
                    </div>
                </div>

                {/* TABLA DE ITEMS - ANCHO COMPLETO */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                            <h2 className="text-slate-800 font-black">Ítems ({items.length})</h2>
                            <div className="flex gap-2">
                                <input type="file" id="csvImportEdit" className="hidden" accept=".csv,.txt" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        const lines = ev.target.result.split(/\r?\n/);
                                        const loaded = [];
                                        lines.slice(1).forEach(l => {
                                            const p = l.split(/[;,]/).map(val => val.trim());
                                            if (p.length < 2) return;
                                            const v = resolveVariantFromCell(p[0]);
                                            if (v) loaded.push({
                                                variante: v.id, variante_label: `${v.product_code} - ${getVariantDisplayName(v)}`,
                                                cantidad: p[1] || 1, lote_codigo: p[2] || generateAutoLote(), vencimiento: parseSpreadsheetDate(p[3]),
                                                costo_fob_unitario: p[4] || v.costo_fob || 0, costo_landed_unitario: p[5] || v.costo_landed || 0,
                                                nuevo_precio_0_publico: p[6] || v.precio_0_publico || 0, nuevo_precio_1_estudiante: p[7] || v.precio_1_estudiante || 0,
                                                nuevo_precio_2_reventa: p[8] || v.precio_2_reventa || 0, nuevo_precio_3_mayorista: p[9] || v.precio_3_mayorista || 0, nuevo_precio_4_intercompany: p[10] || v.precio_4_intercompany || 0
                                            });
                                        });
                                        if (loaded.length > 0) { 
                                            const sorted = [...items, ...loaded].sort((a,b) => a.variante_label.localeCompare(b.variante_label));
                                            setItems(sorted); 
                                            validateItems(sorted); 
                                            alert("Cargado!"); 
                                        }
                                    };
                                    reader.readAsText(file);
                                }}/>
                                <button type="button" onClick={handleDownloadTemplate} className="bg-slate-50 text-slate-500 hover:text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-200 transition-all active:scale-95">
                                    <Download size={14}/> Bajar Plantilla
                                </button>
                                <button type="button" onClick={() => document.getElementById('csvImportEdit').click()} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-200 hover:bg-slate-200 transition-all active:scale-95">
                                    <Upload size={14}/> Subir CSV
                                </button>
                                <button type="button" onClick={() => setIsSearchOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"><Search size={14} /> BUSCAR</button>
                            </div>
                        </div>
                        <div className="overflow-auto max-h-[600px]">
                            <table className="w-full border-collapse text-[11px]">
                                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-100 uppercase text-slate-400 font-black">
                                    <tr>
                                        <th className="p-3 text-left min-w-[300px]">Producto</th>
                                        <th className="p-3 text-center w-20">Cant.</th>
                                        <th className="p-3 text-right min-w-[100px]">FOB</th>
                                        <th className="p-3 text-right min-w-[110px]">LANDED</th>
                                        <th className="p-3 text-center min-w-[110px] bg-blue-50/20 text-blue-600 border-x border-white">Precio P0</th>
                                        <th className="p-3 text-center min-w-[100px] bg-blue-50/20 text-blue-500 font-bold">P1</th>
                                        <th className="p-3 text-center min-w-[100px] bg-blue-50/20 text-blue-500 font-bold">P2</th>
                                        <th className="p-3 text-center min-w-[100px] bg-blue-50/20 text-blue-500 font-bold">P3</th>
                                        <th className="p-3 text-center min-w-[100px] bg-blue-50/20 text-blue-500 font-bold">P4</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, idx) => {
                                        const v = variantes.find(x => x.id === item.variante) || {};
                                        
                                        // Validaciones locales de fila
                                        const qtyError = parseFloat(item.cantidad) <= 0;
                                        const fobError = parseFloat(item.costo_fob_unitario) > parseFloat(item.costo_landed_unitario);
                                        const pBreak = !(item.nuevo_precio_0_publico >= item.nuevo_precio_1_estudiante && item.nuevo_precio_1_estudiante >= item.nuevo_precio_2_reventa && item.nuevo_precio_2_reventa >= item.nuevo_precio_3_mayorista && item.nuevo_precio_3_mayorista >= item.nuevo_precio_4_intercompany);
                                        
                                        let rowError = null;
                                        if (qtyError) rowError = "Cantidad debe ser mayor a 0";
                                        else if (fobError) rowError = "FOB no puede ser mayor que Landed";
                                        else if (pBreak) rowError = "Jerarquía de precios inválida (P0≥P1≥P2≥P3≥P4)";

                                        const isFobChanged = parseFloat(item.costo_fob_unitario) !== parseFloat(v.costo_fob || 0);
                                        const isLandedChanged = parseFloat(item.costo_landed_unitario) !== parseFloat(v.costo_landed || 0);

                                        return (
                                            <tr key={idx} className={`hover:bg-slate-50 transition-all ${(rowError) ? 'bg-red-50/50' : ''}`}>
                                                <td className="p-3">
                                                    <div className="font-black text-slate-800 text-[11px] mb-2 truncate max-w-[280px]">{item.variante_label}</div>
                                                    <div className="flex gap-2 mb-1">
                                                        <div className="relative flex-1">
                                                            <Tag size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                            <input type="text" placeholder="Lote" value={item.lote_codigo} onChange={(e) => handleItemChange(idx, 'lote_codigo', e.target.value)} className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold" />
                                                        </div>
                                                        <div className="relative flex-1">
                                                            <Clock size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                            <input type="date" value={item.vencimiento} onChange={(e) => handleItemChange(idx, 'vencimiento', e.target.value)} className="w-full pl-6 pr-1 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold" />
                                                        </div>
                                                    </div>
                                                    {rowError && (
                                                        <div className="text-[9px] font-black text-red-600 uppercase tracking-tighter bg-red-100 px-2 py-1 rounded-md inline-block animate-pulse">
                                                            ⚠ {rowError}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-1"><input type="number" min="1" value={item.cantidad} onChange={(e) => handleItemChange(idx, 'cantidad', e.target.value)} className="w-full border-slate-200 border rounded p-1.5 text-center font-bold" /></td>
                                                <td className="p-1">
                                                    <input type="number" min="0" step="1" value={item.costo_fob_unitario} onChange={(e) => handleItemChange(idx, 'costo_fob_unitario', e.target.value)} 
                                                        className={`w-full text-right border rounded p-1.5 min-w-[80px] ${fobError ? 'border-red-500 bg-red-100 text-red-700' : isFobChanged ? 'border-slate-300 text-slate-900 font-black' : 'border-slate-100 text-slate-400 font-medium'}`} 
                                                    />
                                                </td>
                                                <td className="p-1">
                                                    <input type="number" min="0" step="1" value={item.costo_landed_unitario} onChange={(e) => handleItemChange(idx, 'costo_landed_unitario', e.target.value)} 
                                                        className={`w-full text-right border rounded p-1.5 min-w-[90px] ${isLandedChanged ? 'bg-blue-50 border-blue-200 text-blue-700 font-black' : 'bg-slate-50 border-slate-100 text-slate-400 font-medium'}`} 
                                                    />
                                                </td>
                                                {[0,1,2,3,4].map(n => {
                                                    const keys = ['publico','estudiante','reventa','mayorista','intercompany'];
                                                    const k = `nuevo_precio_${n}_${keys[n]}`;
                                                    const catalogKey = `precio_${n}_${keys[n]}`;
                                                    const isChanged = parseFloat(item[k]) !== parseFloat(v[catalogKey] || 0);

                                                    return (
                                                        <td key={n} className={`p-1 ${n===0?'bg-blue-50/5':''}`}>
                                                            <input type="number" min="0" step="1" value={item[k]} onChange={(e) => handleItemChange(idx, k, e.target.value)} 
                                                                className={`w-full text-right border rounded p-1.5 text-[11px] min-w-[90px] ${pBreak ? 'border-red-300' : isChanged ? 'border-blue-200 text-blue-700 font-black bg-blue-50/30' : 'border-slate-50 text-slate-400 font-medium bg-white'}`} 
                                                            />
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-2 text-center text-slate-300 hover:text-red-500"><button onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 size={16} /></button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {isSearchOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
                            <div className="flex-1 relative">
                                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input autoFocus type="text" placeholder="Buscar por código o nombre..." className="w-full h-12 bg-white rounded-2xl pl-12 pr-4 text-lg font-black border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <button onClick={() => {
                                const filtered = variantes.filter(v => 
                                    v.product_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                    (v.producto_padre_nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (v.nombre_variante || "").toLowerCase().includes(searchTerm.toLowerCase())
                                );
                                if (filtered.length > 0) {
                                    const newItemsAdd = filtered.map(v => ({
                                        variante: v.id,
                                        variante_label: `${v.product_code} - ${getVariantDisplayName(v)}`,
                                        cantidad: 0,
                                        costo_fob_unitario: v.costo_fob || 0,
                                        costo_landed_unitario: v.costo_landed || 0,
                                        lote_codigo: generateAutoLote(),
                                        vencimiento: '',
                                        nuevo_precio_0_publico: v.precio_0_publico || 0,
                                        nuevo_precio_1_estudiante: v.precio_1_estudiante || 0,
                                        nuevo_precio_2_reventa: v.precio_2_reventa || 0,
                                        nuevo_precio_3_mayorista: v.precio_3_mayorista || 0,
                                        nuevo_precio_4_intercompany: v.precio_4_intercompany || 0
                                    }));
                                    const totalItems = [...items, ...newItemsAdd].sort((a,b) => a.variante_label.localeCompare(b.variante_label));
                                    setItems(totalItems);
                                    validateItems(totalItems);
                                    alert(`Agregados ${filtered.length} productos.`);
                                }
                            }} className="bg-blue-100 text-blue-700 px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-200 transition-all">
                                Seleccionar Todo
                            </button>
                            <button onClick={() => setIsSearchOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-200 transition-all">✕</button>
                        </div>
                        <div className="p-2 max-h-[400px] overflow-y-auto">
                            {variantes.filter(v =>
                                v.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (v.producto_padre_nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (v.nombre_variante || "").toLowerCase().includes(searchTerm.toLowerCase())
                            ).map(v => (
                                <button key={v.id} onClick={() => { addProductToItems(v); setLastAddedId(v.id); setTimeout(()=>setLastAddedId(null),500); }} className={`w-full p-4 flex items-center justify-between rounded-3xl transition-all text-left mb-1 ${lastAddedId === v.id ? 'bg-blue-100 border-2 border-blue-300 scale-95' : 'hover:bg-slate-50 border-2 border-transparent'}`}>
                                    <div><div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{v.product_code}</div><div className="font-bold text-slate-800">{getVariantDisplayName(v)}</div></div>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${lastAddedId === v.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{lastAddedId === v.id ? <Check size={24} /> : <Plus size={24} />}</div>
                                </button>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-100 flex justify-end"><button onClick={() => setIsSearchOpen(false)} className="bg-slate-900 text-white px-10 py-4 rounded-3xl font-black text-sm uppercase tracking-widest">CERRAR</button></div>
                    </div>
                </div>
                )}
                </div>
            </main>
        </div>
    );
}
