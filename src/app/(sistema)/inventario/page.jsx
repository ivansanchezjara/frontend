"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductTable, { COLUMNAS_VISIBLES_POR_DEFECTO } from '@/components/inventario/ProductTable';
import SearchBar from '@/components/ui/SearchBar';
import LoadingScreen from '@/components/ui/LoadingScreen';
import EmptyState from '@/components/ui/EmptyState';
// Si tenés el ColumnSelector, lo importás. Si no, lo podés omitir por ahora.
// import ColumnSelector from '@/components/ui/ColumnSelector'; 

export default function InventarioPage() {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [columnasVisibles, setColumnasVisibles] = useState(COLUMNAS_VISIBLES_POR_DEFECTO);

    // Fetch de productos (ajustá la URL según tu API)
    useEffect(() => {
        const fetchInventario = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('access_token');
                // Asumiendo que tu endpoint soporta búsqueda: ?search=
                const url = searchTerm
                    ? `http://127.0.0.1:8000/api/productos/?search=${searchTerm}`
                    : `http://127.0.0.1:8000/api/productos/`;

                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Si tu API usa paginación, será data.results. Si no, es data directo.
                    setProductos(data.results || data);
                }
            } catch (error) {
                console.error("Error cargando inventario:", error);
            } finally {
                setLoading(false);
            }
        };

        // Pequeño debounce manual para no saturar la API al escribir rápido
        const timeoutId = setTimeout(() => {
            fetchInventario();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Función que se ejecuta al hacer clic en una fila de la tabla
    const handleSelectProducto = (producto) => {
        // En el futuro, esto podría abrir un panel lateral (Slide-over) 
        // para ver el historial de movimientos de ese producto específico.
        console.log("Producto seleccionado para ver historial:", producto.nombre_general);
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">

            {/* 1. HEADER Y ACCIONES PRINCIPALES */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Control de Inventario</h1>
                    <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">
                        Supervisá el stock, registrá ingresos y gestioná los precios de venta.
                    </p>
                </div>

                {/* Los botones de Movimientos */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Link
                        href="/inventario/ingresos/nuevo"
                        className="flex-1 md:flex-none bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold py-2.5 px-4 rounded-xl transition-colors text-sm text-center flex items-center justify-center gap-2"
                    >
                        <span>📥</span> Registrar Ingreso
                    </Link>
                    <Link
                        href="/inventario/ajustes/nuevo"
                        className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors text-sm text-center flex items-center justify-center gap-2"
                    >
                        <span>📈</span> Ajuste Comercial
                    </Link>
                </div>
            </div>

            {/* 2. BARRA DE HERRAMIENTAS (Buscador) */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="w-full sm:max-w-md">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar por código, producto o marca..."
                    />
                </div>
                {/* Aquí podrías poner el ColumnSelector si querés que elijan qué ver */}
            </div>

            {/* 3. TABLA DE DATOS */}
            {loading ? (
                <LoadingScreen message="Cargando inventario..." />
            ) : productos.length === 0 ? (
                <EmptyState
                    icon="📦"
                    title="No se encontraron productos"
                    message={searchTerm ? "Intentá con otro término de búsqueda." : "El inventario está vacío. Los productos deben crearse primero en el Catálogo."}
                    actionLabel={searchTerm ? "Limpiar Búsqueda" : "Ir al Catálogo"}
                    onAction={() => searchTerm ? setSearchTerm('') : window.location.href = '/catalogo'}
                />
            ) : (
                <div className="animate-in fade-in duration-500">
                    <ProductTable
                        productos={productos}
                        columnasVisibles={columnasVisibles}
                        onSelectProducto={handleSelectProducto}
                    />
                </div>
            )}

        </div>
    );
}