"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IAgent, IClient, IInvestment } from "@/types";
import { formatINR } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Users, PlusCircle, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface ClientsTabProps {
  agents: IAgent[];
  onQuickInvest: (clientId: string) => void;
}

export function ClientsTab({ agents, onQuickInvest }: ClientsTabProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agentId, setAgentId] = useState("");
  const [deleteTargetClient, setDeleteTargetClient] = useState<IClient | null>(null);

  const { data: clients = [] } = useQuery<IClient[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to load clients");
      const json = await res.json();
      return json.data || [];
    },
  });

  const { data: allInvestments = [] } = useQuery<IInvestment[]>({
    queryKey: ["investments", "ALL", "ALL", "ALL", "ALL"],
    queryFn: async () => {
      const res = await fetch("/api/investments");
      if (!res.ok) throw new Error("Failed to load investments");
      const json = await res.json();
      return json.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; phone: string; agentId: string }) => {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create client");
      }
      return json.data;
    },
    onSuccess: () => {
      toast.success("✅ Client mapped with agent successfully!");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setName("");
      setPhone("");
      setAgentId("");
    },
    onError: (err) => {
      toast.error((err as Error).message || "Save client failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete client");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Client deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (err) => {
      toast.error((err as Error).message || "Delete client failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter Client Full Name");
      return;
    }
    if (!agentId) {
      toast.error("Please choose an Agent to map with this client");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      phone: phone.trim(),
      agentId,
    });
  };

  const handleDelete = (client: IClient) => {
    setDeleteTargetClient(client);
  };

  const getClientTotalInvested = (clientId: string) => {
    let total = 0;
    allInvestments
      .filter((t) => t.clientId === clientId)
      .forEach((t) => (total += t.amount));
    return total;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
      {/* Add Client Card */}
      <div className="lg:col-span-4">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#1e3a8a]" />
              <CardTitle className="text-base sm:text-lg">Add Client & Map to Agent</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="clientName">Client Full Name *</Label>
                <Input
                  id="clientName"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anjali Verma"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clientPhone">Mobile Number</Label>
                <Input
                  id="clientPhone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9811223344"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clientAgent">Map With Agent *</Label>
                <Select value={agentId} onValueChange={setAgentId}>
                  <SelectTrigger id="clientAgent">
                    <SelectValue placeholder="-- Choose Agent --" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((ag) => (
                      <SelectItem key={ag.id} value={ag.id}>
                        {ag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-500">
                  Investments by this client default to this agent
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 sm:h-9"
                disabled={createMutation.isPending}
              >
                Save Client
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Clients List Table / Card Column */}
      <div className="lg:col-span-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3.5 sm:py-4 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1e3a8a]" />
              <CardTitle className="text-base sm:text-lg">Registered Clients</CardTitle>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {clients.length} client(s)
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile Card List View (< md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {clients.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm px-4">
                  No clients registered yet. Use the form above to add one.
                </div>
              ) : (
                clients.map((c) => {
                  const agent = agents.find((a) => a.id === c.agentId);
                  const totalInvested = getClientTotalInvested(c.id);

                  return (
                    <div key={c.id} className="p-3.5 space-y-2.5 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{c.name}</div>
                          <div className="text-xs font-mono text-slate-500">
                            {c.phone || "No mobile"}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 text-xs px-2.5"
                            onClick={() => onQuickInvest(c.id)}
                            title="Record New Investment for this Client"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Invest
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(c)}
                            title="Delete Client"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Mapped Agent:</span>
                          <span className="font-semibold text-slate-800">
                            {agent ? agent.name : <span className="text-red-500">Unassigned</span>}
                          </span>
                        </div>
                        {agent && (
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                            <span>Rates:</span>
                            <span>SIP {agent.rates?.SIP ?? agent.rate ?? 0}% | Lump {agent.rates?.Lumpsum ?? agent.rate ?? 0}%</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-slate-400">Total Invested:</span>
                        <strong className="text-slate-900 font-mono text-sm">{formatINR(totalInvested)}</strong>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Mapped Agent</TableHead>
                    <TableHead>Agent Comm %</TableHead>
                    <TableHead>Total Invested</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No clients registered yet. Use the form on the left to add one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((c) => {
                      const agent = agents.find((a) => a.id === c.agentId);
                      const totalInvested = getClientTotalInvested(c.id);

                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-semibold text-slate-900">
                            {c.name}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-600">
                            {c.phone || "-"}
                          </TableCell>
                          <TableCell className="text-slate-800 font-medium">
                            {agent ? agent.name : <span className="text-red-500">Unassigned</span>}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {agent ? (
                              <span className="font-mono">
                                SIP: {agent.rates?.SIP ?? agent.rate ?? 0}% | Lump: {agent.rates?.Lumpsum ?? agent.rate ?? 0}%
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="font-bold text-slate-900 font-mono">
                            {formatINR(totalInvested)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="default"
                                size="sm"
                                className="h-8 text-xs px-2.5"
                                onClick={() => onQuickInvest(c.id)}
                                title="Record New Investment for this Client"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Invest
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(c)}
                                title="Delete Client"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteTargetClient}
        onOpenChange={(open) => !open && setDeleteTargetClient(null)}
        title="Delete Client"
        description={`Are you sure you want to delete client "${deleteTargetClient?.name}"? Any past investment records for this client will remain in reports.`}
        confirmText="Delete Client"
        variant="destructive"
        icon="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTargetClient) {
            deleteMutation.mutate(deleteTargetClient.id);
            setDeleteTargetClient(null);
          }
        }}
      />
    </div>
  );
}
