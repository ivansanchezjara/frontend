export default function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}
