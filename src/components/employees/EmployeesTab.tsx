"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ShieldAlert,
  UserPlus,
  KeyRound,
  Copy,
  Trash2,
  Edit2,
  Dices,
} from "lucide-react";
import { toast } from "sonner";

interface EmployeeItem {
  id: string;
  name: string;
  username: string;
  status: string;
  createdAt: string;
}

interface EmployeesTabProps {
  onOpenAdminPasswordModal: () => void;
}

export function EmployeesTab({ onOpenAdminPasswordModal }: EmployeesTabProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // State for Reset Password modal
  const [resetModalEmployee, setResetModalEmployee] = useState<EmployeeItem | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [deleteTargetEmp, setDeleteTargetEmp] = useState<EmployeeItem | null>(null);

  const { data: employees = [], isLoading } = useQuery<EmployeeItem[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error("Failed to load employees");
      const json = await res.json();
      return json.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; username: string; password: string }) => {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create employee");
      }
      return json.data;
    },
    onSuccess: (newEmp) => {
      toast.success(`✅ Employee "${newEmp.name}" account created!`);
      queryClient.invalidateQueries({ queryKey: ["employees"] });

      // Automatically copy credentials to clipboard for ease of sharing with the employee
      copyCredentials(newEmp.name, newEmp.username, password);

      setName("");
      setUsername("");
      setPassword("");
    },
    onError: (err) => {
      toast.error((err as Error).message || "Create employee failed");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to reset password");
      }
      return json.data;
    },
    onSuccess: () => {
      toast.success("✅ Password reset successfully!");
      setResetModalEmployee(null);
      setResetPasswordVal("");
    },
    onError: (err) => {
      toast.error((err as Error).message || "Reset password failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete employee");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Employee account deleted");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err) => {
      toast.error((err as Error).message || "Delete employee failed");
    },
  });

  const generateAutoPassword = () => {
    const words = ["Jiya", "Wealth", "Grow", "Fund", "Invest", "Secure", "Capital"];
    const randWord = words[Math.floor(Math.random() * words.length)];
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setPassword(`${randWord}@${randNum}`);
  };

  const copyCredentials = (empName: string, empUser: string, empPass?: string) => {
    const portalUrl = typeof window !== "undefined" ? window.location.origin : "";
    const passDisplay = empPass || "[As assigned by Admin]";
    const text =
      `💼 *JIYA FINANCIAL SERVICES - EMPLOYEE PORTAL LOGIN*\n` +
      `----------------------------------------\n` +
      `👤 *Name:* ${empName}\n` +
      `🆔 *User ID:* ${empUser}\n` +
      `🔑 *Password:* ${passDisplay}\n` +
      `🌐 *Portal Link:* ${portalUrl}\n` +
      `----------------------------------------\n` +
      `Please sign in using the credentials above to record investments and view client details.`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success(`📋 Credentials for "${empName}" copied to clipboard!`);
      });
    } else {
      window.prompt("Copy credentials below:", text);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Employee name is required");
      return;
    }
    if (!username.trim()) {
      toast.error("User ID is required");
      return;
    }
    if (!password || password.length < 4) {
      toast.error("Password must be at least 4 characters long");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      username: username.trim(),
      password,
    });
  };

  const handleDelete = (emp: EmployeeItem) => {
    setDeleteTargetEmp(emp);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Create Form + Admin Settings */}
        <div className="lg:col-span-4 space-y-6">
          {/* Create Employee Account */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#1e3a8a]" />
                <CardTitle>Create Employee Account</CardTitle>
              </div>
              <CardDescription>
                Add employee login credentials to access the sales portal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="empName">Employee Full Name *</Label>
                  <Input
                    id="empName"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="empUsername">User ID / Username *</Label>
                  <Input
                    id="empUsername"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. rahul101"
                    pattern="[a-zA-Z0-9_\-]+"
                    title="Letters, numbers, underscores, or hyphens only"
                  />
                  <p className="text-[11px] text-slate-500">
                    Employee will sign in using this User ID
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="empPassword">Password *</Label>
                  <div className="relative">
                    <Input
                      id="empPassword"
                      required
                      minLength={4}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="e.g. Rahul@2026"
                      className="pr-20"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={generateAutoPassword}
                      className="absolute right-1 top-1 h-8 px-2 text-xs"
                      title="Generate random password"
                    >
                      <Dices className="w-3.5 h-3.5 mr-1" />
                      Auto
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Set initial password to give to the employee
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createMutation.isPending}
                >
                  Create Employee Login
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Admin Password Security Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#1e3a8a]" />
                <CardTitle>Admin Password Settings</CardTitle>
              </div>
              <CardDescription>
                Logged in as Administrator (<code>admin</code>). Keep your admin credentials secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="secondary"
                className="w-full"
                onClick={onOpenAdminPasswordModal}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Change Admin Password
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Employees List Table */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#1e3a8a]" />
                <CardTitle>Registered Employee Accounts</CardTitle>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {employees.length} employee(s)
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                        Loading employee accounts...
                      </TableCell>
                    </TableRow>
                  ) : employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        No employee accounts created yet. Use the form on the left to add one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-semibold text-slate-900">
                          {e.name}
                        </TableCell>
                        <TableCell>
                          <code className="bg-slate-100 text-[#1e3a8a] px-2 py-0.5 rounded font-mono font-bold text-xs">
                            {e.username}
                          </code>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {e.createdAt}
                        </TableCell>
                        <TableCell>
                          <Badge variant="employee" className="text-[11px] py-0">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="success"
                              size="sm"
                              className="h-8 text-xs px-2"
                              onClick={() => copyCredentials(e.name, e.username)}
                              title="Copy Login Details for Employee"
                            >
                              <Copy className="w-3.5 h-3.5 mr-1" />
                              Copy Details
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 text-xs px-2"
                              onClick={() => setResetModalEmployee(e)}
                              title="Reset Password"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1" />
                              Reset Pass
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(e)}
                              title="Delete employee account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reset Employee Password Modal */}
      {resetModalEmployee && (
        <Dialog
          open={!!resetModalEmployee}
          onOpenChange={(open) => {
            if (!open) {
              setResetModalEmployee(null);
              setResetPasswordVal("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#1e3a8a]" />
                Reset Password for {resetModalEmployee.name}
              </DialogTitle>
              <DialogDescription>
                Set a new password for employee user ID: <code>{resetModalEmployee.username}</code>
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!resetPasswordVal || resetPasswordVal.length < 4) {
                  toast.error("Password must be at least 4 characters long");
                  return;
                }
                resetPasswordMutation.mutate({
                  id: resetModalEmployee.id,
                  newPassword: resetPasswordVal,
                });
              }}
              className="space-y-4 py-2"
            >
              <div className="space-y-1.5">
                <Label htmlFor="newEmployeePass">New Password *</Label>
                <Input
                  id="newEmployeePass"
                  type="text"
                  required
                  minLength={4}
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setResetModalEmployee(null);
                    setResetPasswordVal("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={resetPasswordMutation.isPending}>
                  {resetPasswordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Employee Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTargetEmp}
        onOpenChange={(open) => !open && setDeleteTargetEmp(null)}
        title="Delete Employee Account"
        description={`Are you sure you want to delete employee "${deleteTargetEmp?.name}" (${deleteTargetEmp?.username})? They will immediately lose access to the portal.`}
        confirmText="Delete Account"
        variant="destructive"
        icon="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTargetEmp) {
            deleteMutation.mutate(deleteTargetEmp.id);
            setDeleteTargetEmp(null);
          }
        }}
      />
    </>
  );
}
