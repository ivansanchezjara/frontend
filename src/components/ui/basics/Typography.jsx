export function Heading({ children, level = 1, className = '', ...props }) {
  const Tag = `h${level}`;

  const baseStyles = "text-slate-900 font-black tracking-tight";
  const sizes = {
    1: "text-4xl",
    2: "text-3xl",
    3: "text-2xl",
    4: "text-xl",
    5: "text-lg",
    6: "text-[10px] uppercase tracking-[0.3em] text-slate-300",
  };

  const sizeStyles = sizes[level] || sizes[1];

  return (
    <Tag className={`${baseStyles} ${sizeStyles} ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export function Text({
  children,
  variant = 'body',
  as: Tag = 'p',
  className = '',
  ...props
}) {
  const styles = {
    body: "text-base font-medium text-slate-500",
    bodySm: "text-sm font-medium text-slate-500",
    bodyXs: "text-xs font-medium text-slate-500",
    bodyBold: "text-base font-bold text-slate-700",
    bodySmBold: "text-sm font-bold text-slate-700",
    bodyXsBold: "text-xs font-bold text-slate-700",
    muted: "text-sm font-medium text-slate-400",
    mutedXs: "text-xs font-medium text-slate-400",
    mono: "text-xs font-mono text-slate-400",
    caption: "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300",
    label: "text-[10px] font-black uppercase tracking-widest text-slate-400",
    tag: "text-[10px] font-bold uppercase tracking-widest text-emerald-600",
  };

  const variantStyle = styles[variant] || styles.body;

  return (
    <Tag className={`${variantStyle} ${className}`} {...props}>
      {children}
    </Tag>
  );
}
