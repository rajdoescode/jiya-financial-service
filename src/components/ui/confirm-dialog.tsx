"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default" | "primary";
  icon?: "logout" | "danger" | "warning";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  icon = "danger",
  isLoading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6 rounded-2xl">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "p-3 rounded-2xl shrink-0 mt-0.5 shadow-inner",
              variant === "destructive" || icon === "danger"
                ? "bg-red-50 text-red-600 border border-red-100"
                : icon === "logout"
                ? "bg-amber-50 text-amber-600 border border-amber-100"
                : "bg-blue-50 text-[#1e3a8a] border border-blue-100"
            )}
          >
            {icon === "logout" ? (
              <LogOut className="w-6 h-6" />
            ) : variant === "destructive" || icon === "danger" ? (
              <Trash2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1.5 flex-1 pt-0.5">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-lg font-bold text-slate-900 leading-snug">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 leading-relaxed">
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <DialogFooter className="mt-5 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs font-semibold h-10 sm:h-9 px-4 rounded-xl border-slate-300 hover:bg-slate-100"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isLoading}
            onClick={handleConfirm}
            className={cn(
              "w-full sm:w-auto text-xs font-semibold h-10 sm:h-9 px-4 rounded-xl shadow-md transition-all",
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                : "bg-[#1e3a8a] hover:bg-[#1e40af] text-white shadow-blue-900/20"
            )}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
