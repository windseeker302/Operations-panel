import { cn } from "@/lib/utils";

export function Label({ className, ...props }) {
  return (
    <label
      className={cn("text-sm font-medium text-slate-700 dark:text-slate-300", className)}
      {...props}
    />
  );
}
