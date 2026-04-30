import { redirect } from 'next/navigation';

export default function InventarioRootRedirect() {
    redirect('/inventario/stock');
}