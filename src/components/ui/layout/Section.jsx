import { Text } from "../basics/Typography";

export default function Section({ title, subtitle, children }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <Text as="h2" variant="label" className="text-slate-500">
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodySm" className="mt-0.5 text-[11px] text-slate-400">
              {subtitle}
            </Text>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
