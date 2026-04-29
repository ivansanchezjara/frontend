// src/config/navigation.js

// 1. DICCIONARIO CENTRAL DE FAMILIAS Y ESTILOS
export const familyStyles = {
  slate: {
    // Para el menú General / Dashboard
    label: "General",
    activeNav: "bg-slate-700 shadow-sm text-white",
  },
  emerald: {
    label: "Comercial y Ventas",
    activeNav: "bg-emerald-600 shadow-sm text-white", // <--- Estilo para el menú lateral
    borderHover: "hover:border-emerald-500", // <--- Estilos para el Dashboard
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    groupHoverBg: "group-hover:bg-emerald-600",
    line: "bg-emerald-200",
  },
  blue: {
    label: "Operaciones y Logística",
    activeNav: "bg-blue-600 shadow-sm text-white",
    borderHover: "hover:border-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-600",
    groupHoverBg: "group-hover:bg-blue-600",
    line: "bg-blue-200",
  },
  purple: {
    label: "Finanzas y Control",
    activeNav: "bg-purple-600 shadow-sm text-white",
    borderHover: "hover:border-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-600",
    groupHoverBg: "group-hover:bg-purple-600",
    line: "bg-purple-200",
  },
  amber: {
    label: "Equipo y Administración",
    activeNav: "bg-amber-600 shadow-sm text-white",
    borderHover: "hover:border-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-600",
    groupHoverBg: "group-hover:bg-amber-600",
    line: "bg-amber-200",
  },
};

// 2. ORDEN DE RENDERIZADO
export const ordenFamilias = ["emerald", "blue", "purple", "amber"];

// --- TUS ARRAYS SIGUEN IGUAL ABAJO ---

export const modulosActivos = [
  {
    href: "/catalogo",
    icon: "📖",
    title: "Catálogo Master",
    desc: "Gestión de productos, fotos y descripciones.",
    color: "emerald",
  },
  {
    href: "/inventario/stock",
    icon: "📦",
    title: "Stock y Disponibilidad",
    desc: "Consulta rápida de existencias, vencimientos y ubicaciones.",
    color: "blue",
  },
  {
    href: "/movimientos",
    icon: "🏢",
    title: "Gestión de Movimientos",
    desc: "Carga de ingresos, consignaciones y ajustes comerciales.",
    color: "blue",
  },
  {
    href: "/media-manager",
    icon: "🖼️",
    title: "Gestor de Medios",
    desc: "Almacenamiento y Archivos de la plataforma.",
    color: "emerald",
  },
];

export const modulosFuturos = [
  {
    icon: "🤝",
    title: "Ventas y CRM",
    desc: "Seguimiento de clientes, cotizaciones y persecución comercial.",
    color: "emerald",
  },
  {
    icon: "💵",
    title: "Caja y Ventas Diarias",
    desc: "Apertura, cierre y facturación en mostrador.",
    color: "emerald",
  },
  {
    icon: "💳",
    title: "Cobranzas",
    desc: "Gestión de cuentas por cobrar y conciliación de clientes.",
    color: "purple",
  },
  {
    icon: "📊",
    title: "Finanzas y Gastos",
    desc: "Flujo de caja, gastos fijos y rentabilidad macro.",
    color: "purple",
  },
  {
    icon: "🔧",
    title: "Asistencia Técnica",
    desc: "Servicio post-venta y reparaciones de equipos.",
    color: "blue",
  },
  {
    icon: "👥",
    title: "Recursos Humanos",
    desc: "Legajos, asistencia y gestión de equipo.",
    color: "amber",
  },
];

export const navItems = [
  {
    category: "General",
    href: "/dashboard",
    icon: "🏠",
    label: "Panel Principal",
    type: "active",
    color: "slate",
  },
  {
    category: "Comercial",
    href: "/catalogo",
    icon: "📖",
    label: "Catálogo Master",
    type: "active",
    color: "emerald",
  },
  {
    category: "Comercial",
    label: "Ventas y CRM",
    icon: "🤝",
    type: "future",
    color: "emerald",
  },
  {
    category: "Comercial",
    label: "Caja y Facturación",
    icon: "💵",
    type: "future",
    color: "emerald",
  },
  {
    category: "Operaciones",
    href: "/inventario/stock",
    icon: "📦",
    label: "Stock y Disponibilidad",
    type: "active",
    color: "blue",
  },
  {
    category: "Operaciones",
    href: "/movimientos",
    icon: "🏢",
    label: "Gestión de Movimientos",
    type: "active",
    color: "blue",
  },
  {
    category: "Comercial",
    href: "/media-manager",
    icon: "🖼️",
    label: "Gestor de Medios",
    type: "active",
    color: "emerald",
  },
  {
    category: "Operaciones",
    label: "Asistencia Técnica",
    icon: "🔧",
    type: "future",
    color: "blue",
  },
  {
    category: "Finanzas",
    label: "Cobranzas",
    icon: "💳",
    type: "future",
    color: "purple",
  },
  {
    category: "Finanzas",
    label: "Finanzas y Gastos",
    icon: "📊",
    type: "future",
    color: "purple",
  },
  {
    category: "Equipo",
    label: "Recursos Humanos",
    icon: "👥",
    type: "future",
    color: "amber",
  },
];
