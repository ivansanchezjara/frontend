import "./globals.css";

export const metadata = {
  title: "ERP System - Gestión Profesional",
  description: "Sistema de gestión de inventario y ventas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
