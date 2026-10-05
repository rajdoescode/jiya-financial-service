"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthUserSession } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPasswordDialog } from "./AdminPasswordDialog";
import { toast } from "sonner";
import {
  Briefcase,
  KeyRound,
  Download,
  Upload,
  LogOut,
  User as UserIcon,
} from "lucide-react";

interface HeaderProps {
  user: AuthUserSession;
  onDataRestored?: () => void;
}

export function Header({ user, onDataRestored }: HeaderProps) {
  const router = useRouter();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user.role.toLowerCase() === "admin";

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to sign out?")) return;

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  const handleBackup = async () => {
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("Failed to export backup");
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);

      const blob = new Blob([JSON.stringify(data.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jiya_financial_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded successfully!");
    } catch (err) {
      toast.error((err as Error).message || "Backup export failed.");
    }
  };

  const handleRestoreFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        const res = await fetch("/api/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        });

        const resData = await res.json();
        if (!res.ok || !resData.success) {
          throw new Error(resData.error?.message || "Failed to restore backup");
        }

        toast.success("✅ Data restored successfully!");
        if (onDataRestored) onDataRestored();
      } catch (err) {
        toast.error("Error restoring backup: " + (err as Error).message);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <header className="bg-[#1e3a8a] text-white px-4 sm:px-6 py-4 flex flex-wrap justify-between items-center gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Jiya Financial Services
            </h1>
            <p className="text-xs text-blue-100/80">
              Mutual Fund Sales & Agent Commission Tracking Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap no-print">
          {/* User Pill */}
          <div className="flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full border border-white/20 text-xs sm:text-sm font-medium">
            <Badge
              variant={isAdmin ? "admin" : "employee"}
              className="px-2 py-0 text-[11px]"
            >
              {isAdmin ? "Admin" : "Employee"}
            </Badge>
            <span className="flex items-center gap-1 font-semibold text-white">
              <UserIcon className="w-3.5 h-3.5" />
              {user.name || user.username}
            </span>
          </div>

          {/* Admin-only buttons */}
          {isAdmin && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20"
                onClick={() => setPasswordDialogOpen(true)}
                title="Change Admin Password"
              >
                <KeyRound className="w-3.5 h-3.5 mr-1" />
                Change Password
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20"
                onClick={handleBackup}
                title="Backup all data to JSON"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Backup
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20"
                onClick={() => fileInputRef.current?.click()}
                title="Restore data from JSON backup"
              >
                <Upload className="w-3.5 h-3.5 mr-1" />
                Restore
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".json"
                onChange={handleRestoreFileChange}
              />
            </>
          )}

          {/* Logout */}
          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-xs bg-red-600/90 hover:bg-red-700"
            onClick={handleLogout}
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      {isAdmin && (
        <AdminPasswordDialog
          open={passwordDialogOpen}
          onOpenChange={setPasswordDialogOpen}
        />
      )}
    </>
  );
}
