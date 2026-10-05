"use client";

import { useState, useMemo } from "react";
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
import { Users, PlusCircle, Trash2, Plus, Edit3, RotateCcw, Search, X } from "lucide-react";
import { toast } from "sonner";

interface ClientsTabProps {
  agents: IAgent[];
  onQuickInvest: (clientId: string) => void;
}

export function ClientsTab({ agents, onQuickInvest }: ClientsTabProps) {
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agentId, setAgentId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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

  const saveMutation = useMutation({
    mutationFn: async (payload: { name: string; phone: string; agentId: string }) => {
      const url = editId ? `/api/clients/${editId}` : "/api/clients";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to save client");
      }
      return json.data;
    },
    onSuccess: () => {
      toast.success(
        editId
          ? "✅ Client details updated successfully!"
          : "✅ Client mapped with agent successfully!"
      );
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      resetForm();
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

  const resetForm = () => {
    setEditId(null);
    setName("");
    setPhone("");
    setAgentId("");
  };

  const handleEdit = (client: IClient) => {
    setEditId(client.id);
    setName(client.name);
    setPhone(client.phone || "");
    setAgentId(client.agentId || "");
  };

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

    saveMutation.mutate({
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

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase().trim();
    return clients.filter((c) => {
      const clientName = c.name?.toLowerCase() || "";
      const phone = c.phone || "";
      const mappedAg = agents.find((a) => a.id === c.agentId);
      const agentName = mappedAg?.name?.toLowerCase() || "";
      return clientName.includes(q) || phone.includes(q) || agentName.includes(q);
    });
  }, [clients, agents, searchQuery]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
      {/* Add / Edit Client Card */}
      <div className="lg:col-span-4">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              {editId ? (
                <Edit3 className="w-5 h-5 text-[#1e3a8a]" />
              ) : (
                <PlusCircle className="w-5 h-5 text-[#1e3a8a]" />
              )}
              <CardTitle className="text-base sm:text-lg">
                {editId ? "Edit Client & Agent Mapping" : "Add Client & Map to Agent"}
              </CardTitle>
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

              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                {editId && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetForm}
                    className="w-full sm:w-auto h-11 sm:h-9"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  className="flex-1 h-11 sm:h-9"
                  disabled={saveMutation.isPending}
                >
                  {editId ? "Update Client" : "Save Client"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Clients List Table / Card Column */}
      <div className="lg:col-span-8">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 sm:py-4 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1e3a8a]" />
              <CardTitle className="text-base sm:text-lg">Registered Clients</CardTitle>
              <span className="text-xs text-slate-500 font-medium">
                ({filteredClients.length} of {clients.length})
              </span>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search name, phone, agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile Card List View (< md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm px-4">
                  {searchQuery
                    ? `No clients found matching "${searchQuery}".`
                    : "No clients registered yet. Use the form above to add one."}
                </div>
              ) : (
                filteredClients.map((c) => {
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
                        <div className="flex items-center gap-1">
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
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs px-2"
                            onClick={() => handleEdit(c)}
                            title="Edit Client"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
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
                  {filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        {searchQuery
                          ? `No clients found matching "${searchQuery}".`
                          : "No clients registered yet. Use the form on the left to add one."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((c) => {
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
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs px-2"
                                onClick={() => handleEdit(c)}
                                title="Edit Client Details"
                              >
                                <Edit3 className="w-3.5 h-3.5 mr-1" />
                                Edit
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
