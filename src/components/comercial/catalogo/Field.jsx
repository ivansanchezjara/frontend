import { Text } from "@/components/ui";

export default function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Text as="label" variant="label" className="block text-[11px] text-slate-500">
        {label}
      </Text>
      {children}
      {hint && (
        <Text variant="bodySm" className="text-[11px] text-slate-400">
          {hint}
        </Text>
      )}
    </div>
  );
}
