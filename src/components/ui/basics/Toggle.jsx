import { Text } from "./Typography";

export default function Toggle({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer text-left w-full ${checked ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
    >
      <div
        className={`w-10 h-6 rounded-full transition-all flex-shrink-0 relative ${checked ? "bg-emerald-500" : "bg-slate-300"}`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${checked ? "left-5" : "left-1"}`}
        />
      </div>
      <div>
        <Text
          variant="bodySm"
          className={`font-black ${checked ? "text-emerald-700" : "text-slate-700"}`}
        >
          {label}
        </Text>
        {description && (
          <Text
            variant="bodySm"
            className={`text-xs mt-0.5 ${checked ? "text-emerald-500" : "text-slate-400"}`}
          >
            {description}
          </Text>
        )}
      </div>
    </button>
  );
}
