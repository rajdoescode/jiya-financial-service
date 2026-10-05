"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <div className="inline-flex p-3 bg-red-100 text-red-700 rounded-2xl">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
        <p className="text-sm text-slate-600">
          An unexpected error occurred while loading this page.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
          <Button onClick={() => reset()}>Try Again</Button>
        </div>
      </div>
    </div>
  );
}
