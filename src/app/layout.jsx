import "./globals.css";

export const metadata = {
  title: "ERP CORE",
  description: "Sistema de gestión integral",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-PY">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}