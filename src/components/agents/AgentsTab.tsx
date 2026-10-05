"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IAgent, IInvestment } from "@/types";
import { formatINR } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Users2, PlusCircle, Edit3, Trash2, FileText, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface AgentsTabProps {
  onViewSlip: (agentId: string) => void;
}

export function AgentsTab({ onViewSlip }: AgentsTabProps) {
  const queryClient = useQueryClient();

  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sipRate, setSipRate] = useState<number | string>(1.5);
  const [lumpRate, setLumpRate] = useState<number | string>(1.0);
  const [cobRate, setCobRate] = useState<number | string>(0.5);
  const [switchRate, setSwitchRate] = useState<number | string>(0.5);
  const [deleteTargetAgent, setDeleteTargetAgent] = useState<IAgent | null>(null);

  const { data: agents = [] } = useQuery<IAgent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed to load agents");
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
    mutationFn: async (payload: {
      name: string;
      phone: string;
      rates: {
        SIP: number;
        Lumpsum: number;
        "Change of Broker": number;
        Switch: number;
      };
    }) => {
      const url = editId ? `/api/agents/${editId}` : "/api/agents";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to save agent");
      }
      return json.data;
    },
    onSuccess: () => {
      toast.success(
        editId
          ? "Agent rates updated successfully!"
          : "New agent registered successfully!"
      );
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      resetForm();
    },
    onError: (err) => {
      toast.error((err as Error).message || "Save agent failed");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete agent");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Agent deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (err) => {
      toast.error((err as Error).message || "Delete agent failed");
    },
  });

  const resetForm = () => {
    setEditId(null);
    setName("");
    setPhone("");
    setSipRate(1.5);
    setLumpRate(1.0);
    setCobRate(0.5);
    setSwitchRate(0.5);
  };

  const handleEdit = (agent: IAgent) => {
    setEditId(agent.id);
    setName(agent.name);
    setPhone(agent.phone || "");
    setSipRate(agent.rates?.SIP ?? agent.rate ?? 1.5);
    setLumpRate(agent.rates?.Lumpsum ?? agent.rate ?? 1.0);
    setCobRate(agent.rates?.["Change of Broker"] ?? agent.rate ?? 0.5);
    setSwitchRate(agent.rates?.Switch ?? agent.rate ?? 0.5);
  };

  const handleDelete = (agent: IAgent) => {
    setDeleteTargetAgent(agent);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide Agent Name");
      return;
    }

    saveMutation.mutate({
      name: name.trim(),
      phone: phone.trim(),
      rates: {
        SIP: parseFloat(String(sipRate)) || 0,
        Lumpsum: parseFloat(String(lumpRate)) || 0,
        "Change of Broker": parseFloat(String(cobRate)) || 0,
        Switch: parseFloat(String(switchRate)) || 0,
      },
    });
  };

  // Helper to compute stats per agent
  const getAgentTotals = (agentId: string) => {
    let sales = 0;
    let comm = 0;
    allInvestments
      .filter((t) => t.agentId === agentId)
      .forEach((t) => {
        sales += t.amount;
        comm += t.commission;
      });
    return { sales, comm };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form Column */}
      <div className="lg:col-span-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {editId ? (
                <Edit3 className="w-5 h-5 text-[#1e3a8a]" />
              ) : (
                <PlusCircle className="w-5 h-5 text-[#1e3a8a]" />
              )}
              <CardTitle>{editId ? "Edit Agent & Rates" : "Add New Agent"}</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="agentName">Agent Full Name *</Label>
                <Input
                  id="agentName"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="agentPhone">Mobile Number</Label>
                <Input
                  id="agentPhone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9820011223"
                />
              </div>

              <div className="space-y-2">
                <Label className="block">Commission Rates by Investment Type (%) *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-600">SIP Rate (%)</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={sipRate}
                      onChange={(e) => setSipRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-600">Lumpsum (%)</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={lumpRate}
                      onChange={(e) => setLumpRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-600">COB (%)</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={cobRate}
                      onChange={(e) => setCobRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-600">Switch (%)</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      value={switchRate}
                      onChange={(e) => setSwitchRate(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Rates auto-apply to this agent&apos;s transactions by investment type
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                  {editId ? "Update Agent" : "Save Agent"}
                </Button>
                {editId && (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Table Column */}
      <div className="lg:col-span-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Users2 className="w-5 h-5 text-[#1e3a8a]" />
              <CardTitle>Registered Agents & Rates</CardTitle>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {agents.length} agent(s)
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Commission Rates (%)</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Total Comm</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No agents registered yet. Use the form on the left to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((ag) => {
                    const totals = getAgentTotals(ag.id);
                    return (
                      <TableRow key={ag.id}>
                        <TableCell className="font-semibold text-slate-900">
                          {ag.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {ag.phone || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="sip" className="px-1.5 py-0 text-[10px]">
                                SIP
                              </Badge>
                              <strong className="font-mono">{ag.rates?.SIP ?? ag.rate ?? 0}%</strong>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="lumpsum" className="px-1.5 py-0 text-[10px]">
                                Lump
                              </Badge>
                              <strong className="font-mono">{ag.rates?.Lumpsum ?? ag.rate ?? 0}%</strong>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="cob" className="px-1.5 py-0 text-[10px]">
                                COB
                              </Badge>
                              <strong className="font-mono">{ag.rates?.["Change of Broker"] ?? ag.rate ?? 0}%</strong>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="switch" className="px-1.5 py-0 text-[10px]">
                                Switch
                              </Badge>
                              <strong className="font-mono">{ag.rates?.Switch ?? ag.rate ?? 0}%</strong>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 font-mono">
                          {formatINR(totals.sales)}
                        </TableCell>
                        <TableCell className="font-bold text-emerald-700 font-mono">
                          {formatINR(totals.comm)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs px-2"
                              onClick={() => handleEdit(ag)}
                              title="Edit Agent Rates"
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 text-xs px-2"
                              onClick={() => onViewSlip(ag.id)}
                              title="View Month-End Slip"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1" />
                              Slip
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(ag)}
                              title="Delete Agent"
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

      <ConfirmDialog
        open={!!deleteTargetAgent}
        onOpenChange={(open) => !open && setDeleteTargetAgent(null)}
        title="Delete Agent"
        description={`Are you sure you want to delete agent "${deleteTargetAgent?.name}"? If they have mapped transactions or clients, please confirm before removing.`}
        confirmText="Delete Agent"
        variant="destructive"
        icon="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTargetAgent) {
            deleteMutation.mutate(deleteTargetAgent.id);
            setDeleteTargetAgent(null);
          }
        }}
      />
    </div>
  );
}
