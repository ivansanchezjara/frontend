import FloatingMensajeria from '@/components/comercial/mensajeria/FloatingMensajeria';

export default function VentasCrmLayout({ children }) {
  return (
    <>
      {children}
      <FloatingMensajeria />
    </>
  );
}
