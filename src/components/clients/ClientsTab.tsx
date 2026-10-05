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
    if (!confirm(`Are you sure you want to delete client "${client.name}"?`)) return;
    deleteMutation.mutate(client.id);
  };

  const getClientTotalInvested = (clientId: string) => {
    let total = 0;
    allInvestments
      .filter((t) => t.clientId === clientId)
      .forEach((t) => (total += t.amount));
    return total;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Add Client Card */}
      <div className="lg:col-span-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#1e3a8a]" />
              <CardTitle>Add Client & Map to Agent</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
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
                className="w-full"
                disabled={createMutation.isPending}
              >
                Save Client
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Clients List Table */}
      <div className="lg:col-span-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1e3a8a]" />
              <CardTitle>Registered Clients</CardTitle>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {clients.length} client(s)
            </span>
          </CardHeader>
          <CardContent className="p-0">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
