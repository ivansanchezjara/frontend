import { Text } from "./Typography";
import { cn } from "@/lib/utils";

export default function Field({ label, hint, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Text as="label" variant="label" >
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
