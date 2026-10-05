import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80",
        secondary:
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80",
        destructive:
          "border-transparent bg-red-100 text-red-700 border-red-200",
        outline: "text-slate-950",
        sip: "border-blue-200 bg-blue-100 text-blue-700 font-bold",
        lumpsum: "border-amber-200 bg-amber-100 text-amber-800 font-bold",
        cob: "border-purple-200 bg-purple-100 text-purple-800 font-bold",
        switch: "border-sky-200 bg-sky-100 text-sky-800 font-bold",
        admin: "border-yellow-300 bg-yellow-100 text-yellow-900 font-bold",
        employee: "border-emerald-200 bg-emerald-100 text-emerald-800 font-bold",
        success: "border-emerald-200 bg-emerald-100 text-emerald-800 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
