// 1. DICCIONARIO CENTRAL DE FAMILIAS Y ESTILOS
export const familyStyles = {
  slate: { label: "General", activeNav: "bg-slate-700 shadow-sm text-white" },
  emerald: {
    label: "Comercial y Ventas",
    activeNav: "bg-emerald-600 shadow-sm text-white",
    borderHover: "hover:border-emerald-500",
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
    groupHoverBg: "group-hover:bg-amber-200",
    line: "bg-amber-200",
  },
};

export const ordenFamilias = ["emerald", "blue", "purple", "amber"];

// 2. FUENTE ÚNICA DE LA VERDAD PARA MÓDULOS (ORDENADOS POR CATEGORÍA)
export const erpModules = [
  // --- CATEGORÍA: GENERAL ---
  {
    category: "General",
    href: "/dashboard",
    icon: "🏠",
    title: "Panel Principal",
    desc: "Vista general operativa y analítica del negocio.",
    color: "slate",
    estado: "activo",
    roles: ["Admin", "gestorDeCatalogo", "gestorDeDeposito", "vendedor", "gestorComercial", "cajero"],
  },

  // --- CATEGORÍA: COMERCIAL ---
  {
    category: "Comercial",
    href: "/catalogo",
    icon: "📖",
    title: "Catálogo Master",
    desc: "Gestión de productos, fotos y descripciones.",
    color: "emerald",
    estado: "activo",
    roles: ["Admin", "gestorDeCatalogo"],
  },
  {
    category: "Comercial",
    href: "/ventas-crm",
    icon: "🤝",
    title: "Ventas y CRM",
    desc: "Seguimiento de clientes, cotizaciones y gestión comercial.",
    color: "emerald",
    estado: "activo",
    roles: ["Admin", "vendedor"],
  },
  {
    category: "Comercial",
    href: "/media-manager",
    icon: "🖼️",
    title: "Gestor de Medios",
    desc: "Almacenamiento y Archivos de la plataforma.",
    color: "emerald",
    estado: "activo",
    roles: ["Admin", "gestorDeCatalogo"],
  },
  {
    category: "Comercial",
    href: "/gestion-comercial",
    icon: "💼",
    title: "Gestión Comercial",
    desc: "Configuración de precios de venta, costos base, márgenes y ofertas.",
    color: "emerald",
    estado: "activo",
    roles: ["Admin", "gestorComercial"],
  },

  // --- CATEGORÍA: OPERACIONES ---
  {
    category: "Operaciones",
    href: "/inventario/stock",
    icon: "📦",
    title: "Stock y Disponibilidad",
    desc: "Consulta rápida de existencias, vencimientos y ubicaciones.",
    color: "blue",
    estado: "activo",
    roles: ["Admin", "gestorDeDeposito"],
  },
  {
    category: "Operaciones",
    href: "/movimientos",
    icon: "🏢",
    title: "Gestión de Movimientos",
    desc: "Carga de ingresos, consignaciones y ajustes comerciales.",
    color: "blue",
    estado: "activo",
    roles: ["Admin", "gestorDeDeposito"],
  },
  {
    category: "Operaciones",
    href: "#",
    icon: "🔧",
    title: "Asistencia Técnica",
    desc: "Servicio post-venta y reparaciones de equipos.",
    color: "blue",
    estado: "proximamente",
    roles: ["Admin"],
  },

  // --- CATEGORÍA: FINANZAS ---
  {
    category: "Finanzas",
    href: "/caja",
    icon: "🧾",
    title: "Caja y Facturación",
    desc: "Cobro de pedidos, sesiones de caja y facturación.",
    color: "purple",
    estado: "activo",
    roles: ["Admin", "cajero", "gestorDeDeposito"],
    children: [
      { href: "/caja/cola", icon: "🧾", title: "Cola de Cobro", roles: ["Admin", "cajero"] },
      { href: "/caja/sesiones", icon: "💰", title: "Sesiones de Caja", roles: ["Admin", "cajero"] },
      { href: "/caja/entrega", icon: "📦", title: "Entrega de Mercadería", roles: ["Admin", "gestorDeDeposito"] },
      { href: "/caja/facturas", icon: "📄", title: "Facturas y Comprobantes", roles: ["Admin", "cajero"] },
      { href: "/caja/timbrados", icon: "🔖", title: "Timbrados", roles: ["Admin"] },
    ],
  },
  {
    category: "Finanzas",
    href: "#",
    icon: "📊",
    title: "Reportes Gerenciales",
    desc: "Control de ganancias del día, utilidades netas e indicadores macro.",
    color: "purple",
    estado: "proximamente",
    roles: ["Admin"],
  },
  {
    category: "Finanzas",
    href: "#",
    icon: "💳",
    title: "Cobranzas",
    desc: "Gestión de cuentas por cobrar y conciliación de clientes.",
    color: "purple",
    estado: "proximamente",
    roles: ["Admin"],
  },
  {
    category: "Finanzas",
    href: "#",
    icon: "💸",
    title: "Finanzas y Gastos",
    desc: "Flujo de caja, gastos fijos y rentabilidad macro.",
    color: "purple",
    estado: "proximamente",
    roles: ["Admin"],
  },

  // --- CATEGORÍA: EQUIPO ---
  {
    category: "Equipo",
    href: "#",
    icon: "👥",
    title: "Recursos Humanos",
    desc: "Legajos, asistencia y gestión de equipo.",
    color: "amber",
    estado: "proximamente",
    roles: ["Admin"],
  },
];

// Derived helpers for compatibility
export const navItems = erpModules.map(module => ({
  ...module,
  label: module.title,
  type: module.estado === "activo" ? "active" : "inactive",
  children: module.children?.map(child => ({
    ...child,
    label: child.title
  }))
}));

export const modulosActivos = erpModules.filter(m => m.estado === "activo");
export const modulosFuturos = erpModules.filter(m => m.estado === "proximamente");
